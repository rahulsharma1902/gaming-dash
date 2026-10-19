// ============================================================
// GameZone OS — Overview Dashboard
// ============================================================

import React, { useState, useMemo } from 'react';
import { Activity, Zap, CalendarCheck, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { useApp, useSettings } from '../context';
import { KpiCard, formatCurrency, formatDuration, formatTime, calcSessionCharge, STATION_TYPE_LABELS, STATION_TYPE_ICONS, StatusBadge } from '../components';
import ChartWrapper from '../ChartWrapper';
import { useLiveClock } from '../hooks';

function buildRevenueData(transactions: { date: string; amount: number; type: string }[], range: 'day' | 'week' | 'month') {
  const now = new Date();
  const buckets: Record<string, number> = {};

  if (range === 'day') {
    for (let h = 6; h <= 23; h++) {
      buckets[`${h}:00`] = 0;
    }
    transactions
      .filter(t => t.date === now.toISOString().split('T')[0] && t.type !== 'refund')
      .forEach(t => {
        const h = new Date(t.date + 'T' + (t as { createdAt?: string }).createdAt?.slice(11, 13) + ':00:00').getHours() || 10;
        const key = `${h}:00`;
        if (key in buckets) buckets[key] += t.amount;
      });
  } else if (range === 'week') {
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(now); dt.setDate(dt.getDate() - d);
      const label = dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      const dateStr = dt.toISOString().split('T')[0];
      const dayTotal = transactions.filter(t => t.date === dateStr && t.type !== 'refund').reduce((s, t) => s + t.amount, 0);
      buckets[label] = dayTotal;
    }
  } else {
    for (let d = 29; d >= 0; d -= 3) {
      const dt = new Date(now); dt.setDate(dt.getDate() - d);
      const label = dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const dayTotal = transactions.filter(t => t.date === dt.toISOString().split('T')[0] && t.type !== 'refund').reduce((s, t) => s + t.amount, 0);
      buckets[label] = (buckets[label] ?? 0) + dayTotal;
    }
  }

  return Object.entries(buckets).map(([name, revenue]) => ({ name, revenue }));
}

export default function OverviewPage() {
  const { state } = useApp();
  const settings = useSettings();
  const now = useLiveClock(60000);
  const [revenueRange, setRevenueRange] = useState<'day' | 'week' | 'month'>('week');

  const todayStr = now.toISOString().split('T')[0];
  const dayOfWeek = now.toLocaleDateString('en-IN', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Operating status
  const todayKey = dayOfWeek.toLowerCase();
  const todayHours = settings.openingHours[todayKey];
  const isOpen = (() => {
    if (!todayHours || todayHours.closed) return false;
    const [oh, om] = todayHours.open.split(':').map(Number);
    const [ch, cm] = todayHours.close.split(':').map(Number);
    const h = now.getHours(), m = now.getMinutes();
    const cur = h * 60 + m, open = oh * 60 + om, close = ch * 60 + cm;
    return cur >= open && cur < close;
  })();

  // KPIs
  const todayTxns = state.transactions.filter(t => t.date === todayStr && t.type !== 'refund');
  const todayRevenue = todayTxns.reduce((s, t) => s + t.amount, 0);

  // Yesterday
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayRevenue = state.transactions.filter(t => t.date === yesterdayStr && t.type !== 'refund').reduce((s, t) => s + t.amount, 0);
  const revenueChange = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : null;

  const activeSessions = state.sessions.filter(s => s.status === 'active' || s.status === 'paused');
  const availableStations = state.stations.filter(s => s.status === 'available' && !s.disabled);
  const todayBookings = state.bookings.filter(b => b.date === todayStr);
  const confirmedToday = todayBookings.filter(b => b.status === 'confirmed' || b.status === 'checked-in').length;

  const thisMonthStr = todayStr.slice(0, 7);
  const monthExpenses = state.expenses
    .filter(e => e.date.startsWith(thisMonthStr))
    .reduce((s, e) => s + e.amount, 0);

  // Revenue chart data
  const revenueData = useMemo(() => buildRevenueData(state.transactions, revenueRange), [state.transactions, revenueRange]);

  // Revenue breakdown by type
  const breakdownData = useMemo(() => {
    const groups: Record<string, number> = { Sessions: 0, 'Food & Bev': 0, Packages: 0, Other: 0 };
    state.transactions.filter(t => {
      const d = new Date(t.date); const n = new Date(); n.setDate(n.getDate() - 30);
      return d >= n && t.type !== 'refund';
    }).forEach(t => {
      if (t.type === 'session') groups['Sessions'] += t.amount;
      else if (t.type === 'order') groups['Food & Bev'] += t.amount;
      else if (t.type === 'package') groups['Packages'] += t.amount;
      else groups['Other'] += t.amount;
    });
    return Object.entries(groups).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [state.transactions]);

  // Station utilization
  const utilizationData = useMemo(() => {
    const types = ['ps5', 'xbox', 'pc', 'racing', 'vr'] as const;
    return types.map(type => {
      const total = state.stations.filter(s => s.type === type).length;
      const occupied = state.stations.filter(s => s.type === type && (s.status === 'occupied' || s.status === 'reserved')).length;
      return { name: STATION_TYPE_LABELS[type].replace(' Station', '').replace(' Sim', ''), occupied, available: total - occupied };
    }).filter(d => d.occupied + d.available > 0);
  }, [state.stations]);

  // Upcoming bookings
  const upcomingBookings = state.bookings
    .filter(b => (b.status === 'confirmed' || b.status === 'pending') && b.date >= todayStr)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    .slice(0, 5);

  // Recent transactions
  const recentTxns = [...state.transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div>
      {/* Welcome header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h1 className="page-title">Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'} 👋</h1>
            <p className="page-description">{dateStr} · {timeStr} · {dayOfWeek}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className={`operating-status ${isOpen ? 'open' : 'closed'}`}>
              <span className="pulse-dot" />
              {isOpen ? 'Open' : 'Closed'}
              {todayHours && !todayHours.closed && ` · Until ${todayHours.close}`}
            </span>
            <span style={{
              background: 'var(--status-warning-dim)', color: 'var(--status-warning)',
              border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-full)',
              padding: '4px 10px', fontSize: 11, fontWeight: 600,
            }}>
              ⚡ DEMO DATA
            </span>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <KpiCard
          label="Today's Revenue"
          value={formatCurrency(todayRevenue, settings.currencySymbol)}
          icon={<TrendingUp size={16} />}
          iconColor="violet"
          change={revenueChange !== null ? { value: `${Math.abs(revenueChange)}% vs yesterday`, direction: revenueChange >= 0 ? 'up' : 'down' } : undefined}
          subtext={revenueChange === null ? 'No data for yesterday' : undefined}
        />
        <KpiCard
          label="Active Sessions"
          value={activeSessions.length}
          icon={<Activity size={16} />}
          iconColor="blue"
          subtext={`of ${state.stations.filter(s => !s.disabled).length} total stations`}
        />
        <KpiCard
          label="Available Stations"
          value={availableStations.length}
          icon={<Zap size={16} />}
          iconColor="green"
          subtext="Ready to start"
        />
        <KpiCard
          label="Today's Bookings"
          value={todayBookings.length}
          icon={<CalendarCheck size={16} />}
          iconColor="cyan"
          subtext={`${confirmedToday} confirmed`}
        />
        <KpiCard
          label="Gaming Hours Today"
          value={`${activeSessions.reduce((s, ses) => {
            const elapsed = (Date.now() - new Date(ses.startTime).getTime()) / 3600_000;
            return s + elapsed;
          }, 0).toFixed(1)}h`}
          icon={<Clock size={16} />}
          iconColor="orange"
          subtext="Across active sessions"
        />
        <KpiCard
          label="Monthly Expenses"
          value={formatCurrency(monthExpenses, settings.currencySymbol)}
          icon={<TrendingDown size={16} />}
          iconColor="red"
          subtext={`${thisMonthStr}`}
        />
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Revenue chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue</div>
              <div className="card-subtitle">
                {revenueRange === 'day' ? 'Today by hour' : revenueRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
              </div>
            </div>
            <div className="filter-group">
              {(['day', 'week', 'month'] as const).map(r => (
                <button key={r} className={`filter-btn ${revenueRange === r ? 'active' : ''}`} onClick={() => setRevenueRange(r)}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <ChartWrapper type="area" data={revenueData} dataKey="revenue" xKey="name" height={200} />
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue Breakdown</div>
              <div className="card-subtitle">Last 30 days by category</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ChartWrapper type="pie" data={breakdownData} dataKey="value" xKey="name" height={160} showLegend />
          </div>
        </div>
      </div>

      {/* Station utilization */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <div className="card-title">Station Utilization</div>
          <div className="card-subtitle">Current availability by type</div>
        </div>
        <div className="card-body">
          <ChartWrapper
            type="bar" data={utilizationData} xKey="name" height={180}
            keys={['occupied', 'available']} labels={['In Use', 'Available']}
            colors={['#1683FF', '#303030']} showLegend
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-2">
        {/* Active sessions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Live Sessions</div>
            <span className="badge occupied"><span className="badge-dot" />{activeSessions.length} active</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {activeSessions.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                No active sessions right now
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {activeSessions.map(ses => {
                  const station = state.stations.find(s => s.id === ses.stationId);
                  return (
                    <LiveSessionRow key={ses.id} session={ses} station={station} symbol={settings.currencySymbol} />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Upcoming Bookings</div>
            <span className="badge reserved">{upcomingBookings.length} scheduled</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {upcomingBookings.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                No upcoming bookings
              </div>
            ) : (
              <div>
                {upcomingBookings.map(bk => (
                  <div key={bk.id} className="dropdown-item">
                    <div style={{ fontSize: 20 }}>{STATION_TYPE_ICONS[bk.stationType]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{bk.customerName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {bk.date === todayStr ? 'Today' : bk.date} · {bk.startTime} · {STATION_TYPE_LABELS[bk.stationType]}
                      </div>
                    </div>
                    <StatusBadge status={bk.status} dot={false} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header">
          <div className="card-title">Recent Transactions</div>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Simulated demo data</span>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Time</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.map(txn => (
                <tr key={txn.id}>
                  <td><strong>{txn.description}</strong></td>
                  <td><span className="tag">{txn.type}</span></td>
                  <td>{new Date(txn.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                  <td style={{ textTransform: 'capitalize' }}>{txn.paymentMethod}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--status-success)', fontWeight: 600 }}>
                    {formatCurrency(txn.amount, settings.currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance alert */}
      {state.stations.filter(s => s.status === 'maintenance').length > 0 && (
        <div style={{
          marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--status-warning-dim)',
          border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 14,
        }}>
          <span style={{ fontSize: 20 }}>🔧</span>
          <div>
            <strong style={{ color: 'var(--status-warning)' }}>Maintenance Alert</strong>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
              {state.stations.filter(s => s.status === 'maintenance').map(s => s.name).join(', ')} {state.stations.filter(s => s.status === 'maintenance').length === 1 ? 'is' : 'are'} under maintenance.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Live session row (self-updating timer) ----
function LiveSessionRow({ session, station, symbol }: {
  session: { id: string; startTime: string; pausedDuration: number; ratePerHour: number; status: string; customerName: string; stationId: string };
  station?: { name: string; type: string };
  symbol: string;
}) {
  const now = useLiveClock(1000);
  const elapsed = now.getTime() - new Date(session.startTime).getTime() - session.pausedDuration;
  const charge = calcSessionCharge(session);

  return (
    <div className="dropdown-item">
      <div style={{ fontSize: 18 }}>{station ? STATION_TYPE_ICONS[station.type] : '🎮'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
          {session.customerName}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {station?.name ?? 'Station'} · Started {formatTime(session.startTime)}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="session-timer">{formatDuration(elapsed)}</div>
        <div className="session-charge">{formatCurrency(charge, symbol)}</div>
      </div>
    </div>
  );
}
