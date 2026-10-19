// ============================================================
// GameZone OS — Reports & Analytics Page
// ============================================================

import React, { useState, useMemo } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { useApp, useSettings } from '../context';
import { PageHeader, formatCurrency, STATION_TYPE_LABELS, exportCSV } from '../components';
import { EXPENSE_CATEGORY_LABELS } from '../components';
import ChartWrapper from '../ChartWrapper';

type DateRange = '7d' | '30d' | '90d' | 'custom';

function getDateRange(range: DateRange, customFrom?: string, customTo?: string): { from: string; to: string } {
  const to = new Date().toISOString().split('T')[0];
  if (range === 'custom' && customFrom && customTo) return { from: customFrom, to: customTo };
  const from = new Date();
  if (range === '7d') from.setDate(from.getDate() - 7);
  else if (range === '30d') from.setDate(from.getDate() - 30);
  else if (range === '90d') from.setDate(from.getDate() - 90);
  return { from: from.toISOString().split('T')[0], to };
}

export default function ReportsPage() {
  const { state } = useApp();
  const settings = useSettings();
  const [range, setRange] = useState<DateRange>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [tab, setTab] = useState<'revenue' | 'sessions' | 'expenses' | 'stations'>('revenue');

  const { from, to } = getDateRange(range, customFrom, customTo);

  const transactions = useMemo(() =>
    state.transactions.filter(t => t.date >= from && t.date <= to && t.type !== 'refund'),
    [state.transactions, from, to]
  );

  const expenses = useMemo(() =>
    state.expenses.filter(e => e.date >= from && e.date <= to),
    [state.expenses, from, to]
  );

  const sessions = useMemo(() =>
    state.sessions.filter(s => s.status === 'ended' && s.startTime.split('T')[0] >= from && s.startTime.split('T')[0] <= to),
    [state.sessions, from, to]
  );

  // Revenue by day
  const dailyRevenue = useMemo(() => {
    const days: Record<string, number> = {};
    transactions.forEach(t => { days[t.date] = (days[t.date] ?? 0) + t.amount; });
    return Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).map(([date, revenue]) => ({
      name: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue,
    }));
  }, [transactions]);

  // Revenue by type
  const revenueByType = useMemo(() => {
    const groups: Record<string, number> = { Sessions: 0, 'Food & Bev': 0, Packages: 0, Other: 0 };
    transactions.forEach(t => {
      if (t.type === 'session') groups['Sessions'] += t.amount;
      else if (t.type === 'order') groups['Food & Bev'] += t.amount;
      else if (t.type === 'package') groups['Packages'] += t.amount;
      else groups['Other'] += t.amount;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Station type revenue
  const stationRevenue = useMemo(() => {
    const groups: Record<string, number> = {};
    state.stations.forEach(s => { groups[s.type] = 0; });
    // Approximate: distribute session revenue by type ratio
    const sessionTxns = transactions.filter(t => t.type === 'session');
    const total = sessionTxns.reduce((s, t) => s + t.amount, 0);
    const stationCounts = state.stations.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const totalStations = Object.values(stationCounts).reduce((a, b) => a + b, 0);
    Object.keys(stationCounts).forEach(type => {
      const rateMultiplier = { ps5: 120, xbox: 100, pc: 80, racing: 200, vr: 250 }[type] ?? 100;
      groups[type] = Math.round((stationCounts[type] / totalStations) * total * (rateMultiplier / 120));
    });
    return Object.entries(groups).map(([type, value]) => ({
      name: STATION_TYPE_LABELS[type]?.replace(' Station', '').replace(' Sim', '') ?? type,
      value,
    })).filter(d => d.value > 0);
  }, [transactions, state.stations]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    expenses.forEach(e => { groups[EXPENSE_CATEGORY_LABELS[e.category]] = (groups[EXPENSE_CATEGORY_LABELS[e.category]] ?? 0) + e.amount; });
    return Object.entries(groups).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // KPIs
  const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const avgTxn = transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : 0;
  const endedSessions = sessions.length;
  const avgSessionMs = endedSessions > 0 ? sessions.reduce((s, ses) => {
    if (!ses.endTime) return s;
    return s + (new Date(ses.endTime).getTime() - new Date(ses.startTime).getTime() - ses.pausedDuration);
  }, 0) / endedSessions : 0;
  const avgSessionHours = (avgSessionMs / 3600_000).toFixed(1);

  // CSV export
  const handleExport = () => {
    exportCSV(
      `gamezone_report_${from}_${to}.csv`,
      ['Date', 'Type', 'Description', 'Customer', 'Amount', 'Payment Method'],
      transactions.map(t => [t.date, t.type, t.description, t.customerName ?? '', t.amount, t.paymentMethod])
    );
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Business performance overview — illustrative demo data."
        breadcrumb={['GameZone OS', 'Reports']}
        actions={
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={15} /> Export CSV
          </button>
        }
      />

      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
        ⚠️ All figures below are derived from demo seed data and do not represent actual business results.
      </p>

      {/* Date range */}
      <div className="toolbar" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="filter-group">
          {(['7d', '30d', '90d', 'custom'] as DateRange[]).map(r => (
            <button key={r} className={`filter-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
              {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : r === '90d' ? 'Last 90 days' : 'Custom'}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="date" className="form-control" style={{ width: 'auto', height: 34 }} value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>to</span>
            <input type="date" className="form-control" style={{ width: 'auto', height: 34 }} value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </div>
        )}
      </div>

      {/* KPI summary bar */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <SummaryCard label="Total Revenue" value={formatCurrency(totalRevenue, settings.currencySymbol)} sub={`${transactions.length} transactions`} color="var(--accent-violet)" />
        <SummaryCard label="Total Expenses" value={formatCurrency(totalExpenses, settings.currencySymbol)} sub={`${expenses.length} entries`} color="var(--status-danger)" />
        <SummaryCard label="Avg Transaction" value={formatCurrency(avgTxn, settings.currencySymbol)} sub="Per transaction" color="var(--accent-blue)" />
        <SummaryCard label="Ended Sessions" value={endedSessions.toString()} sub={`Avg ${avgSessionHours}h each`} color="var(--status-success)" />
        <SummaryCard label="Net Estimate" value={formatCurrency(totalRevenue - totalExpenses, settings.currencySymbol)} sub="Illustrative only" color={totalRevenue - totalExpenses >= 0 ? 'var(--status-success)' : 'var(--status-danger)'} />
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-5)' }}>
        {['revenue', 'sessions', 'expenses', 'stations'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t as typeof tab)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Daily Revenue</div><div className="card-subtitle">{from} – {to}</div></div>
            <div className="card-body">
              <ChartWrapper type="area" data={dailyRevenue} dataKey="revenue" xKey="name" height={240} />
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header"><div className="card-title">Revenue by Type</div></div>
              <div className="card-body">
                <ChartWrapper type="pie" data={revenueByType} dataKey="value" xKey="name" height={200} showLegend />
              </div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title">Revenue by Station Type</div></div>
              <div className="card-body">
                <ChartWrapper type="bar" data={stationRevenue} dataKey="value" xKey="name" height={200} />
              </div>
            </div>
          </div>

          {/* Transaction table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">All Transactions</div>
              <button className="btn btn-sm btn-secondary" onClick={handleExport}><Download size={13} /> Export</button>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Type</th><th>Description</th><th>Customer</th><th>Payment</th><th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 30).map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.date}</td>
                      <td><span className="tag">{t.type}</span></td>
                      <td className="truncate" style={{ maxWidth: 200 }}><strong>{t.description}</strong></td>
                      <td>{t.customerName ?? '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{t.paymentMethod}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-success)' }}>
                        {formatCurrency(t.amount, settings.currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Session History</div><div className="card-subtitle">{endedSessions} sessions in range</div></div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Customer</th><th>Station</th><th>Duration</th><th>Rate</th><th style={{ textAlign: 'right' }}>Charge</th></tr>
              </thead>
              <tbody>
                {sessions.slice(0, 30).map(ses => {
                  const station = state.stations.find(s => s.id === ses.stationId);
                  const durationMs = ses.endTime ? new Date(ses.endTime).getTime() - new Date(ses.startTime).getTime() - ses.pausedDuration : 0;
                  const hours = durationMs / 3600_000;
                  const charge = hours * ses.ratePerHour;
                  return (
                    <tr key={ses.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{ses.startTime.split('T')[0]}</td>
                      <td><strong>{ses.customerName}</strong></td>
                      <td>{station?.name ?? ses.stationId}</td>
                      <td>{hours.toFixed(1)}h</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(ses.ratePerHour, settings.currencySymbol)}/hr</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-success)' }}>
                        {formatCurrency(charge, settings.currencySymbol)}
                      </td>
                    </tr>
                  );
                })}
                {sessions.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>No ended sessions in this range</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Expense Breakdown by Category</div></div>
            <div className="card-body">
              <ChartWrapper type="bar" data={expenseBreakdown} dataKey="value" xKey="name" height={220} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">All Expenses</div></div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Payment</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.date}</td>
                      <td><span className="tag">{EXPENSE_CATEGORY_LABELS[e.category]}</span></td>
                      <td><strong>{e.description}</strong></td>
                      <td style={{ textTransform: 'capitalize' }}>{e.paymentMethod}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-danger)' }}>
                        {formatCurrency(e.amount, settings.currencySymbol)}
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>No expenses in range</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'stations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="grid-2">
            <div className="card">
              <div className="card-header"><div className="card-title">Station Status Summary</div></div>
              <div className="card-body">
                {(['available', 'occupied', 'reserved', 'maintenance'] as const).map(status => {
                  const count = state.stations.filter(s => s.status === status).length;
                  const total = state.stations.filter(s => !s.disabled).length;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{status}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-surface-3)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: { available: 'var(--status-success)', occupied: 'var(--accent-violet)', reserved: 'var(--status-info)', maintenance: 'var(--status-warning)' }[status] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title">Revenue by Station Type</div></div>
              <div className="card-body">
                <ChartWrapper type="pie" data={stationRevenue} dataKey="value" xKey="name" height={200} showLegend />
              </div>
            </div>
          </div>

          {/* Station list */}
          <div className="card">
            <div className="card-header"><div className="card-title">All Stations</div></div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead><tr><th>Name</th><th>Type</th><th>Rate</th><th>Status</th></tr></thead>
                <tbody>
                  {state.stations.filter(s => !s.disabled).map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong>{s.specs && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.specs}</div>}</td>
                      <td>{STATION_TYPE_LABELS[s.type]}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(s.hourlyRate, settings.currencySymbol)}/hr</td>
                      <td><span className={`badge ${s.status}`}><span className="badge-dot" />{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{sub}</div>
    </div>
  );
}
