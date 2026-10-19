// ============================================================
// GameZone OS — Stations & Sessions Page (Neo-Brutalism + Add-ons)
// ============================================================

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Power, Wrench, Play, Square, Grid3X3, List, Coffee, Trash2, Check, DollarSign } from 'lucide-react';
import { useApp, useSettings } from '../context';
import type { Station, Session, StationType, StationStatus, SessionAddon } from '../types';
import {
  PageHeader, StatusBadge, EmptyState, formatCurrency, formatDuration,
  calcSessionCharge, calcSessionTimeCharge, calcSessionAddonsTotal,
  STATION_TYPE_LABELS, STATION_TYPE_ICONS, SearchInput, Modal
} from '../components';
import { useSessionElapsed } from '../hooks';
import { makeId } from '../data';

// ---- Filters ----
const TYPE_FILTERS = [
  { id: 'all', label: 'All Types' },
  { id: 'ps5', label: 'PS5' },
  { id: 'xbox', label: 'Xbox' },
  { id: 'pc', label: 'PC' },
  { id: 'racing', label: 'Racing' },
  { id: 'vr', label: 'VR' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'All Status' },
  { id: 'available', label: 'Available' },
  { id: 'occupied', label: 'In Use' },
  { id: 'reserved', label: 'Reserved' },
  { id: 'maintenance', label: 'Maintenance' },
];

export default function StationsPage() {
  const { state, dispatch, toast } = useApp();
  const settings = useSettings();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showStationModal, setShowStationModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [showStartSession, setShowStartSession] = useState<Station | null>(null);
  const [showEndReceipt, setShowEndReceipt] = useState<{ session: Session; station: Station } | null>(null);
  const [showAddonModal, setShowAddonModal] = useState<{ session: Session; station: Station } | null>(null);

  const filtered = useMemo(() => {
    return state.stations.filter(s => {
      if (s.disabled) return false;
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [state.stations, typeFilter, statusFilter, search]);

  const getActiveSession = (stationId: string) =>
    state.sessions.find(s => s.stationId === stationId && (s.status === 'active' || s.status === 'paused'));

  const handleEndSessionWithPayment = (session: Session, station: Station, paymentMethod: 'cash' | 'upi' | 'card') => {
    const endTime = new Date().toISOString();
    const timeCharge = calcSessionTimeCharge({ ...session, endTime });
    const addonsTotal = calcSessionAddonsTotal(session);
    const totalCharge = Math.max(Math.round((timeCharge + addonsTotal) * 100) / 100, 0);

    const addonBreakdown = session.addons && session.addons.length > 0
      ? ` + Add-ons (${session.addons.map(a => `${a.name} x${a.quantity}`).join(', ')})`
      : '';

    const txn = {
      id: makeId('txn'),
      type: 'session' as const,
      description: `Session — ${session.customerName} (${station.name}) — Playtime: ${formatCurrency(timeCharge, settings.currencySymbol)}${addonBreakdown}`,
      amount: totalCharge,
      paymentMethod,
      customerId: session.customerId,
      customerName: session.customerName,
      sessionId: session.id,
      date: endTime.split('T')[0],
      createdAt: endTime,
    };

    dispatch({ type: 'END_SESSION', payload: { sessionId: session.id, endTime, transaction: txn } });
    toast({
      type: 'success',
      title: 'Session completed & billed!',
      message: `${session.customerName} — Paid ${formatCurrency(totalCharge, settings.currencySymbol)} via ${paymentMethod.toUpperCase()}`,
    });
    setShowEndReceipt(null);
    setSelectedStation(null);
  };

  const handleMarkMaintenance = (station: Station) => {
    dispatch({ type: 'UPSERT_STATION', payload: { ...station, status: 'maintenance' } });
    toast({ type: 'warning', title: `${station.name} marked for maintenance` });
  };

  const handleMarkAvailable = (station: Station) => {
    dispatch({ type: 'UPSERT_STATION', payload: { ...station, status: 'available' } });
    toast({ type: 'success', title: `${station.name} is now available` });
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { available: 0, occupied: 0, reserved: 0, maintenance: 0 };
    state.stations.filter(s => !s.disabled).forEach(s => { counts[s.status] = (counts[s.status] ?? 0) + 1; });
    return counts;
  }, [state.stations]);

  // Keep live reference to active session when modal is open
  const liveSelectedSession = selectedStation ? getActiveSession(selectedStation.id) : undefined;
  const liveAddonSession = showAddonModal ? getActiveSession(showAddonModal.station.id) : undefined;

  return (
    <div>
      <PageHeader
        title="Gaming Floor & Sessions"
        description="Live floor control with instant snack & beverage add-on tracking."
        breadcrumb={['GameZone OS', 'Stations & Sessions']}
        actions={
          <button className="btn btn-primary" onClick={() => { setEditingStation(null); setShowStationModal(true); }}>
            <Plus size={16} /> Add Station
          </button>
        }
      />

      {/* Status Counts Bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-md)',
          }}>
            <StatusBadge status={status} dot />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>{count}</span>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="toolbar">
        <div className="filter-group" style={{ flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map(f => (
            <button key={f.id} className={`filter-btn ${typeFilter === f.id ? 'active' : ''}`} onClick={() => setTypeFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="filter-group" style={{ flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.id} className={`filter-btn ${statusFilter === f.id ? 'active' : ''}`} onClick={() => setStatusFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search stations…" />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className={`btn btn-sm btn-secondary ${viewMode === 'grid' ? 'btn-primary' : ''}`} onClick={() => setViewMode('grid')} aria-label="Grid view"><Grid3X3 size={15} /></button>
          <button className={`btn btn-sm btn-secondary ${viewMode === 'list' ? 'btn-primary' : ''}`} onClick={() => setViewMode('list')} aria-label="List view"><List size={15} /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Grid3X3 size={28} />} title="No stations match criteria" description="Adjust your filters or add a new station to your gaming floor." />
      ) : viewMode === 'grid' ? (
        <div className="station-grid">
          {filtered.map(station => (
            <StationCard
              key={station.id}
              station={station}
              session={getActiveSession(station.id)}
              symbol={settings.currencySymbol}
              onClick={() => setSelectedStation(station)}
              onStart={() => setShowStartSession(station)}
              onEnd={(ses) => setShowEndReceipt({ session: ses, station })}
              onAddon={(ses) => setShowAddonModal({ session: ses, station })}
              onEdit={() => { setEditingStation(station); setShowStationModal(true); }}
              onMaintenance={() => handleMarkMaintenance(station)}
              onAvailable={() => handleMarkAvailable(station)}
            />
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>Type</th>
                <th>Rate / hr</th>
                <th>Status</th>
                <th>Current Session & Add-ons</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(station => {
                const ses = getActiveSession(station.id);
                return (
                  <StationTableRow
                    key={station.id}
                    station={station}
                    session={ses}
                    symbol={settings.currencySymbol}
                    onStart={() => setShowStartSession(station)}
                    onEnd={() => ses && setShowEndReceipt({ session: ses, station })}
                    onAddon={() => ses && setShowAddonModal({ session: ses, station })}
                    onEdit={() => { setEditingStation(station); setShowStationModal(true); }}
                    onMaintenance={() => handleMarkMaintenance(station)}
                    onAvailable={() => handleMarkAvailable(station)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Station detail panel & interactive addon hub */}
      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          session={liveSelectedSession}
          symbol={settings.currencySymbol}
          products={state.fnbProducts}
          onClose={() => setSelectedStation(null)}
          onStart={() => { setShowStartSession(selectedStation); setSelectedStation(null); }}
          onEnd={(ses) => { setShowEndReceipt({ session: ses, station: selectedStation }); setSelectedStation(null); }}
          onOpenAddonModal={(ses) => setShowAddonModal({ session: ses, station: selectedStation })}
          onEdit={() => { setEditingStation(selectedStation); setShowStationModal(true); setSelectedStation(null); }}
        />
      )}

      {/* Dedicated Session Addon Drawer / Modal */}
      {showAddonModal && liveAddonSession && (
        <SessionAddonModal
          station={showAddonModal.station}
          session={liveAddonSession}
          symbol={settings.currencySymbol}
          products={state.fnbProducts}
          onClose={() => setShowAddonModal(null)}
        />
      )}

      {/* End session rich receipt & payment modal */}
      {showEndReceipt && (
        <EndSessionReceiptModal
          session={showEndReceipt.session}
          station={showEndReceipt.station}
          symbol={settings.currencySymbol}
          onClose={() => setShowEndReceipt(null)}
          onConfirm={(method) => handleEndSessionWithPayment(showEndReceipt.session, showEndReceipt.station, method)}
        />
      )}

      {/* Start session modal */}
      {showStartSession && (
        <StartSessionModal
          station={showStartSession}
          customers={state.customers}
          products={state.fnbProducts}
          symbol={settings.currencySymbol}
          onClose={() => setShowStartSession(null)}
          onStart={(ses) => {
            dispatch({ type: 'UPSERT_SESSION', payload: ses });
            toast({ type: 'success', title: 'Session started!', message: `${ses.customerName} on ${showStartSession.name}` });
            setShowStartSession(null);
          }}
        />
      )}

      {/* Add/edit station modal */}
      {showStationModal && (
        <StationFormModal
          station={editingStation}
          onClose={() => setShowStationModal(false)}
          onSave={(st) => {
            dispatch({ type: 'UPSERT_STATION', payload: st });
            toast({ type: 'success', title: editingStation ? 'Station updated' : 'Station added', message: st.name });
            setShowStationModal(false);
          }}
        />
      )}
    </div>
  );
}

// ---- Station Card (Neo-Brutalism Style) ----
function StationCard({ station, session, symbol, onClick, onStart, onEnd, onAddon, onEdit, onMaintenance, onAvailable }: {
  station: Station; session?: Session; symbol: string;
  onClick: () => void; onStart: () => void; onEnd: (s: Session) => void;
  onAddon: (s: Session) => void; onEdit: () => void; onMaintenance: () => void; onAvailable: () => void;
}) {
  const elapsed = useSessionElapsed(session?.startTime ?? '', session?.pausedDuration ?? 0, session?.status ?? 'ended');
  const totalCharge = session ? calcSessionCharge(session) : 0;
  const addonsTotal = session ? calcSessionAddonsTotal(session) : 0;
  const addonCount = session?.addons ? session.addons.reduce((sum, a) => sum + a.quantity, 0) : 0;

  return (
    <div className={`station-card ${station.status}`} onClick={onClick}>
      <div className="station-icon-row">
        <div className="station-type-icon">{STATION_TYPE_ICONS[station.type]}</div>
        <StatusBadge status={station.status} />
      </div>

      <div>
        <div className="station-name">{station.name}</div>
        <div className="station-meta">{STATION_TYPE_LABELS[station.type]} · {formatCurrency(station.hourlyRate, symbol)}/hr</div>
        {station.specs && <div className="station-meta" style={{ marginTop: 2 }}>{station.specs}</div>}
      </div>

      {session && (
        <div className="station-session-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>👤 {session.customerName}</span>
            <span className="session-timer">{formatDuration(elapsed)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Due:</span>
            <span className="session-charge">{formatCurrency(totalCharge, symbol)}</span>
          </div>

          {/* Add-ons strip if customer purchased snacks/drinks */}
          {addonCount > 0 && (
            <div className="station-addons-strip" style={{ marginTop: 8 }}>
              <span>🍟 {addonCount} snacks/drinks</span>
              <span>+{formatCurrency(addonsTotal, symbol)}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
        {station.status === 'available' && (
          <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={onStart}>
            <Play size={13} /> Start
          </button>
        )}

        {station.status === 'occupied' && session && (
          <>
            <button
              className="btn btn-sm btn-info"
              style={{ flex: 1 }}
              onClick={() => onAddon(session)}
              title="Add Chips, Coke, Drinks & Snacks"
            >
              <Coffee size={13} /> + Add-on
            </button>
            <button
              className="btn btn-sm btn-danger"
              style={{ flex: 1 }}
              onClick={() => onEnd(session)}
              title="Finish & Bill Session"
            >
              <Square size={13} /> End
            </button>
          </>
        )}

        {station.status === 'maintenance' && (
          <button className="btn btn-sm btn-success" style={{ flex: 1 }} onClick={onAvailable}>
            <Power size={13} /> Mark Ready
          </button>
        )}

        <button className="btn btn-sm btn-secondary btn-icon" onClick={onEdit} aria-label="Edit station">
          <Edit2 size={13} />
        </button>
        {station.status === 'available' && (
          <button className="btn btn-sm btn-secondary btn-icon" onClick={onMaintenance} aria-label="Maintenance">
            <Wrench size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Station Table Row ----
function StationTableRow({ station, session, symbol, onStart, onEnd, onAddon, onEdit, onMaintenance, onAvailable }: {
  station: Station; session?: Session; symbol: string;
  onStart: () => void; onEnd: () => void; onAddon: () => void; onEdit: () => void;
  onMaintenance: () => void; onAvailable: () => void;
}) {
  const elapsed = useSessionElapsed(session?.startTime ?? '', session?.pausedDuration ?? 0, session?.status ?? 'ended');
  const total = session ? calcSessionCharge(session) : 0;
  const addonCount = session?.addons ? session.addons.reduce((sum, a) => sum + a.quantity, 0) : 0;

  return (
    <tr>
      <td>
        <strong>{station.name}</strong>
        {station.specs && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{station.specs}</div>}
      </td>
      <td>{STATION_TYPE_LABELS[station.type]}</td>
      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatCurrency(station.hourlyRate, symbol)}/hr</td>
      <td><StatusBadge status={station.status} /></td>
      <td>
        {session ? (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{session.customerName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {formatDuration(elapsed)} · Total: {formatCurrency(total, symbol)}
            </div>
            {addonCount > 0 && (
              <span className="station-addons-pill" style={{ marginTop: 4 }}>
                🍟 {addonCount} snacks/drinks
              </span>
            )}
          </div>
        ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          {station.status === 'available' && <button className="btn btn-sm btn-primary" onClick={onStart}><Play size={12} /> Start</button>}
          {station.status === 'occupied' && session && (
            <>
              <button className="btn btn-sm btn-info" onClick={onAddon} title="Add Chips/Coke"><Coffee size={12} /> + Add-on</button>
              <button className="btn btn-sm btn-danger" onClick={onEnd}><Square size={12} /> End</button>
            </>
          )}
          {station.status === 'maintenance' && <button className="btn btn-sm btn-success" onClick={onAvailable}><Power size={12} /> Ready</button>}
          <button className="btn btn-sm btn-secondary btn-icon" onClick={onEdit}><Edit2 size={12} /></button>
          {station.status === 'available' && <button className="btn btn-sm btn-secondary btn-icon" onClick={onMaintenance}><Wrench size={12} /></button>}
        </div>
      </td>
    </tr>
  );
}

// ---- Station Detail Modal with Interactive Add-on Manager ----
function StationDetailModal({ station, session, symbol, products, onClose, onStart, onEnd, onOpenAddonModal, onEdit }: {
  station: Station; session?: Session; symbol: string; products: import('../types').FnBProduct[];
  onClose: () => void; onStart: () => void; onEnd: (s: Session) => void;
  onOpenAddonModal: (s: Session) => void; onEdit: () => void;
}) {
  const { dispatch, toast } = useApp();
  const elapsed = useSessionElapsed(session?.startTime ?? '', session?.pausedDuration ?? 0, session?.status ?? 'ended');
  const timeCharge = session ? calcSessionTimeCharge(session) : 0;
  const addonsTotal = session ? calcSessionAddonsTotal(session) : 0;
  const total = session ? calcSessionCharge(session) : 0;

  // Quick 1-click popular add-on chips
  const quickItems = [
    { name: "Lay's Classic Chips", price: 30, cat: 'snacks' as const, emoji: '🍟' },
    { name: 'Coca-Cola 300ml', price: 40, cat: 'beverages' as const, emoji: '🥤' },
    { name: 'Doritos Cheese', price: 50, cat: 'snacks' as const, emoji: '🧀' },
    { name: 'Red Bull 250ml', price: 150, cat: 'beverages' as const, emoji: '⚡' },
    { name: 'Masala Maggi Bowl', price: 60, cat: 'meals' as const, emoji: '🍜' },
    { name: 'Extra Controller (1h)', price: 50, cat: 'accessories' as const, emoji: '🎮' },
  ];

  const handleQuickAdd = (item: typeof quickItems[0]) => {
    if (!session) return;
    const match = products.find(p => p.name.toLowerCase().includes(item.name.toLowerCase().slice(0, 5)));
    const addon: SessionAddon = {
      id: makeId('adn'),
      productId: match?.id,
      name: match?.name || item.name,
      category: item.cat,
      price: match?.price || item.price,
      quantity: 1,
      addedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_SESSION_ADDON', payload: { sessionId: session.id, addon } });
    toast({ type: 'success', title: `Added ${addon.name}`, message: `Added to ${station.name}` });
  };

  return (
    <Modal title={station.name} onClose={onClose} size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between' }}>
          <div>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={onEdit}><Edit2 size={14} />Edit</button>
            {station.status === 'available' && <button className="btn btn-primary" onClick={onStart}><Play size={14} />Start Session</button>}
            {session && station.status === 'occupied' && (
              <>
                <button className="btn btn-info" onClick={() => onOpenAddonModal(session)}><Coffee size={14} />+ Add Items</button>
                <button className="btn btn-danger" onClick={() => onEnd(session)}><Square size={14} />End & Checkout</button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Station identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="station-type-icon" style={{ width: 52, height: 52, fontSize: 24 }}>{STATION_TYPE_ICONS[station.type]}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{station.name}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{STATION_TYPE_LABELS[station.type]}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}><StatusBadge status={station.status} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <DetailRow label="Station #" value={`#${station.number}`} />
          <DetailRow label="Hourly Rate" value={formatCurrency(station.hourlyRate, symbol)} />
          <DetailRow label="Specs" value={station.specs || 'Standard Rig'} />
        </div>

        {/* Active Session Breakdown */}
        {session && (
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>Live Player Session</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>👤 {session.customerName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Playtime</span>
                <div className="session-timer">{formatDuration(elapsed)}</div>
              </div>
            </div>

            {/* Billing Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div style={{ padding: '8px 12px', background: 'var(--bg-surface-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>PLAY CHARGE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{formatCurrency(timeCharge, symbol)}</div>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8' }}>ADD-ONS TOTAL</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: '#38BDF8' }}>{formatCurrency(addonsTotal, symbol)}</div>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(198, 255, 0, 0.08)', border: '1px solid rgba(198, 255, 0, 0.25)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>TOTAL BILL DUE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{formatCurrency(total, symbol)}</div>
              </div>
            </div>

            {/* Quick 1-Click Add-on Pills */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, color: 'var(--text-primary)' }}>
                ⚡ 1-Click Quick Add Snacks & Drinks:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {quickItems.map(item => (
                  <button
                    key={item.name}
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleQuickAdd(item)}
                    style={{ fontSize: 11, padding: '5px 10px' }}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>({formatCurrency(item.price, symbol)})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Session Addons List */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  🍟 Session Add-ons ({session.addons?.length || 0})
                </span>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => onOpenAddonModal(session)}
                >
                  <Coffee size={13} /> Full Menu & Custom
                </button>
              </div>

              {(!session.addons || session.addons.length === 0) ? (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '12px', textAlign: 'center', background: 'var(--bg-surface-3)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  No snacks or drinks added yet. Click any quick add item above or browse menu!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {session.addons.map(addon => (
                    <div key={addon.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', background: 'var(--bg-surface-3)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{addon.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(addon.price, symbol)} each
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                          <button
                            style={{ width: 26, height: 26, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'var(--text-primary)' }}
                            onClick={() => dispatch({ type: 'UPDATE_SESSION_ADDON_QTY', payload: { sessionId: session.id, addonId: addon.id, quantity: addon.quantity - 1 } })}
                          >−</button>
                          <span style={{ padding: '0 8px', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 12, color: 'var(--text-primary)' }}>{addon.quantity}</span>
                          <button
                            style={{ width: 26, height: 26, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'var(--text-primary)' }}
                            onClick={() => dispatch({ type: 'UPDATE_SESSION_ADDON_QTY', payload: { sessionId: session.id, addonId: addon.id, quantity: addon.quantity + 1 } })}
                          >+</button>
                        </div>

                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: 60, textAlign: 'right', color: 'var(--text-primary)' }}>
                          {formatCurrency(addon.price * addon.quantity, symbol)}
                        </span>

                        <button
                          className="btn btn-sm btn-ghost btn-icon"
                          style={{ padding: 4, width: 26, height: 26, color: 'var(--status-danger)' }}
                          onClick={() => dispatch({ type: 'REMOVE_SESSION_ADDON', payload: { sessionId: session.id, addonId: addon.id } })}
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---- Dedicated Session Addon Modal / Drawer ----
function SessionAddonModal({ station, session, symbol, products, onClose }: {
  station: Station; session: Session; symbol: string;
  products: import('../types').FnBProduct[]; onClose: () => void;
}) {
  const { dispatch, toast } = useApp();
  const [activeCategory, setActiveCategory] = useState<'all' | 'snacks' | 'beverages' | 'meals' | 'custom'>('all');
  const [search, setSearch] = useState('');

  // Custom add-on inputs
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState(40);
  const [customQty, setCustomQty] = useState(1);

  const filteredProducts = products.filter(p => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddProduct = (prod: import('../types').FnBProduct) => {
    const addon: SessionAddon = {
      id: makeId('adn'),
      productId: prod.id,
      name: prod.name,
      category: prod.category,
      price: prod.price,
      quantity: 1,
      addedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_SESSION_ADDON', payload: { sessionId: session.id, addon } });
    toast({ type: 'success', title: `Added ${prod.name}`, message: `Added to ${station.name}` });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const addon: SessionAddon = {
      id: makeId('adn'),
      name: customName.trim(),
      category: 'other',
      price: Math.max(0, customPrice),
      quantity: Math.max(1, customQty),
      addedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_SESSION_ADDON', payload: { sessionId: session.id, addon } });
    toast({ type: 'success', title: `Added ${addon.name}`, message: `Custom add-on saved to session` });
    setCustomName('');
    setCustomPrice(40);
    setCustomQty(1);
  };

  const addonsTotal = calcSessionAddonsTotal(session);

  return (
    <Modal
      title={`Add Snacks & Drinks — ${station.name}`}
      onClose={onClose}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Total Add-ons:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 17, background: 'rgba(198, 255, 0, 0.12)', color: 'var(--primary)', padding: '2px 10px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              {formatCurrency(addonsTotal, symbol)}
            </span>
          </div>
          <button className="btn btn-primary" onClick={onClose}><Check size={14} /> Done</button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Subhead info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <strong>Station:</strong> {station.name} · <strong>Player:</strong> {session.customerName}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}>
            Orders automatically bill to the final session invoice.
          </div>
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', 'snacks', 'beverages', 'meals', 'custom'] as const).map(cat => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'All Items' : cat === 'snacks' ? '🍟 Chips & Snacks' : cat === 'beverages' ? '🥤 Drinks & Energy' : cat === 'meals' ? '🍔 Meals' : '✨ Custom Item'}
            </button>
          ))}
        </div>

        {activeCategory === 'custom' ? (
          <form onSubmit={handleAddCustom} style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Add Custom Snack / Drink / Extra Item</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  className="form-control"
                  placeholder="e.g. Masala Chips, Extra DualSense, Cold Coffee"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unit Price (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  min={0}
                  value={customPrice}
                  onChange={e => setCustomPrice(+e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  value={customQty}
                  onChange={e => setCustomQty(+e.target.value)}
                  required
                />
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary"><Plus size={14} /> Add to Session</button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ marginBottom: 4 }}>
              <input
                type="search"
                className="form-control"
                placeholder="Search chips, coke, red bull, burger…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
              {filteredProducts.map(prod => {
                const sessionCount = session.addons?.find(a => a.productId === prod.id)?.quantity || 0;
                return (
                  <div
                    key={prod.id}
                    style={{
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-md)',
                      padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{prod.name}</span>
                        {sessionCount > 0 && (
                          <span style={{ background: 'var(--primary)', color: '#0A0C10', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>
                            x{sessionCount}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        Stock: {prod.stock} · {prod.category}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                        {formatCurrency(prod.price, symbol)}
                      </span>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAddProduct(prod)}
                        disabled={prod.stock <= 0}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Current Active Items List in Session */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, color: 'var(--text-primary)' }}>
            Current Items on this Session:
          </div>

          {(!session.addons || session.addons.length === 0) ? (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No add-ons currently added.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {session.addons.map(addon => (
                <div key={addon.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'var(--bg-surface-3)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{addon.name}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                      <button
                        style={{ width: 24, height: 24, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'var(--text-primary)' }}
                        onClick={() => dispatch({ type: 'UPDATE_SESSION_ADDON_QTY', payload: { sessionId: session.id, addonId: addon.id, quantity: addon.quantity - 1 } })}
                      >−</button>
                      <span style={{ padding: '0 6px', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 12, color: 'var(--text-primary)' }}>{addon.quantity}</span>
                      <button
                        style={{ width: 24, height: 24, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'var(--text-primary)' }}
                        onClick={() => dispatch({ type: 'UPDATE_SESSION_ADDON_QTY', payload: { sessionId: session.id, addonId: addon.id, quantity: addon.quantity + 1 } })}
                      >+</button>
                    </div>

                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, width: 60, textAlign: 'right', color: 'var(--text-primary)' }}>
                      {formatCurrency(addon.price * addon.quantity, symbol)}
                    </span>

                    <button
                      className="btn btn-sm btn-ghost btn-icon"
                      style={{ padding: 2, width: 24, height: 24, color: 'var(--status-danger)' }}
                      onClick={() => dispatch({ type: 'REMOVE_SESSION_ADDON', payload: { sessionId: session.id, addonId: addon.id } })}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---- End Session Itemized Receipt & Checkout Modal ----
function EndSessionReceiptModal({ session, station, symbol, onClose, onConfirm }: {
  session: Session; station: Station; symbol: string;
  onClose: () => void; onConfirm: (method: 'cash' | 'upi' | 'card') => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const elapsed = useSessionElapsed(session.startTime, session.pausedDuration, 'active');
  const timeCharge = calcSessionTimeCharge(session);
  const addonsTotal = calcSessionAddonsTotal(session);
  const grandTotal = calcSessionCharge(session);

  return (
    <Modal
      title="Complete Session & Checkout"
      onClose={onClose}
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={() => onConfirm(paymentMethod)}>
            <DollarSign size={15} /> Collect {formatCurrency(grandTotal, symbol)} & End
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Receipt Header Box */}
        <div style={{
          padding: '14px 16px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>Session Invoice</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2, color: 'var(--text-primary)' }}>{session.customerName}</div>
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: 'var(--text-secondary)' }}>
            Station: {station.name} ({STATION_TYPE_LABELS[station.type]})
          </div>
        </div>

        {/* Itemized Breakdown Table */}
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: 'var(--bg-surface-3)', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Itemized Bill Details
          </div>

          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-surface-2)' }}>
            {/* Playtime row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>⏱️ Station Playtime</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {formatDuration(elapsed)} @ {formatCurrency(session.ratePerHour, symbol)}/hr
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                {formatCurrency(timeCharge, symbol)}
              </div>
            </div>

            {/* Addons items */}
            {session.addons && session.addons.length > 0 && (
              <>
                <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
                    🍟 Snacks & Drinks Consumed:
                  </div>
                  {session.addons.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2, color: 'var(--text-secondary)' }}>
                      <span>{a.name} x{a.quantity}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(a.price * a.quantity, symbol)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Grand Total Row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 6,
            }}>
              <span style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)' }}>Grand Total Due</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 900, background: 'var(--primary)', color: '#0A0C10', padding: '3px 10px', borderRadius: 'var(--radius-sm)' }}>
                {formatCurrency(grandTotal, symbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="form-group">
          <label className="form-label">Payment Method</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(['cash', 'upi', 'card'] as const).map(method => (
              <button
                key={method}
                type="button"
                className={`filter-btn ${paymentMethod === method ? 'active' : ''}`}
                onClick={() => setPaymentMethod(method)}
                style={{ textAlign: 'center', padding: '10px 4px' }}
              >
                {method === 'cash' ? '💵 CASH' : method === 'upi' ? '📱 UPI / QR' : '💳 CARD'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ---- Detail Row helper ----
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

// ---- Start Session Modal with Pre-Order Addons ----
function StartSessionModal({ station, customers, products, symbol, onClose, onStart }: {
  station: Station; customers: import('../types').Customer[];
  products: import('../types').FnBProduct[]; symbol: string;
  onClose: () => void; onStart: (s: Session) => void;
}) {
  const [customerType, setCustomerType] = useState<'walkin' | 'existing'>('walkin');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [duration, setDuration] = useState<'open' | number>('open');
  const [customDuration, setCustomDuration] = useState(60);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCustomer = customers.find(c => c.id === customerId);

  // Quick initial snack options
  const initialSnackOptions = products.slice(0, 4);

  const toggleInitialAddon = (prodId: string) => {
    setSelectedAddonIds(prev => prev.includes(prodId) ? prev.filter(x => x !== prodId) : [...prev, prodId]);
  };

  const handleStart = () => {
    const errs: Record<string, string> = {};
    if (customerType === 'walkin' && !customerName.trim()) errs.customerName = 'Customer name is required';
    if (customerType === 'existing' && !customerId) errs.customerId = 'Please select a customer';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const name = customerType === 'existing' ? selectedCustomer!.name : customerName.trim() || 'Walk-in Guest';

    const addons: SessionAddon[] = selectedAddonIds.map(prodId => {
      const prod = products.find(p => p.id === prodId)!;
      return {
        id: makeId('adn'),
        productId: prod.id,
        name: prod.name,
        category: prod.category,
        price: prod.price,
        quantity: 1,
        addedAt: new Date().toISOString(),
      };
    });

    const session: Session = {
      id: makeId('ses'),
      stationId: station.id,
      customerId: customerType === 'existing' ? customerId : undefined,
      customerName: name,
      startTime: new Date().toISOString(),
      pausedDuration: 0,
      plannedDuration: duration === 'open' ? undefined : (typeof duration === 'number' ? duration : customDuration),
      ratePerHour: station.hourlyRate,
      status: 'active',
      linkedOrderIds: [],
      addons,
    };
    onStart(session);
  };

  return (
    <Modal
      title={`Start Session — ${station.name}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleStart}><Play size={14} /> Start Session</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ padding: '10px 14px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{STATION_TYPE_ICONS[station.type]} {station.name}</span>
          <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>Rate: {formatCurrency(station.hourlyRate, symbol)}/hr</span>
        </div>

        <div className="form-group">
          <label className="form-label">Customer Type</label>
          <div className="filter-group">
            <button type="button" className={`filter-btn ${customerType === 'walkin' ? 'active' : ''}`} onClick={() => setCustomerType('walkin')}>Walk-in</button>
            <button type="button" className={`filter-btn ${customerType === 'existing' ? 'active' : ''}`} onClick={() => setCustomerType('existing')}>Registered</button>
          </div>
        </div>

        {customerType === 'walkin' ? (
          <div className="form-group">
            <label className="form-label">Player Name <span className="required">*</span></label>
            <input
              className={`form-control ${errors.customerName ? 'error' : ''}`}
              placeholder="e.g. Rahul, John Doe"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            {errors.customerName && <span className="form-error">{errors.customerName}</span>}
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Select Customer <span className="required">*</span></label>
            <select className={`form-control ${errors.customerId ? 'error' : ''}`} value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Choose customer…</option>
              {customers.filter(c => !c.archived).map(c => (
                <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
              ))}
            </select>
            {errors.customerId && <span className="form-error">{errors.customerId}</span>}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Session Duration</label>
          <div className="filter-group" style={{ flexWrap: 'wrap' }}>
            {(['open', 60, 120, 180] as const).map(d => (
              <button key={d} type="button" className={`filter-btn ${duration === d ? 'active' : ''}`} onClick={() => setDuration(d)}>
                {d === 'open' ? 'Open-ended' : `${d / 60}h`}
              </button>
            ))}
          </div>
        </div>

        {/* Initial Welcome Addon options */}
        <div className="form-group">
          <label className="form-label">Add Initial Snack / Drink</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {initialSnackOptions.map(p => {
              const selected = selectedAddonIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleInitialAddon(p.id)}
                  style={{ fontSize: 11, padding: '6px 8px', justifyContent: 'space-between' }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <span>+{formatCurrency(p.price, symbol)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ---- Station Form Modal ----
function StationFormModal({ station, onClose, onSave }: {
  station: Station | null; onClose: () => void;
  onSave: (s: Station) => void;
}) {
  const [form, setForm] = useState<Partial<Station>>(station ?? { type: 'ps5', status: 'available', hourlyRate: 120, number: 1 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof Station, v: Station[keyof Station]) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = 'Name is required';
    if (!form.hourlyRate || form.hourlyRate <= 0) errs.hourlyRate = 'Rate must be positive';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const saved: Station = {
      id: station?.id ?? makeId('sta'),
      name: form.name!.trim(),
      type: form.type as StationType ?? 'ps5',
      number: form.number ?? 1,
      hourlyRate: form.hourlyRate!,
      status: form.status as StationStatus ?? 'available',
      specs: form.specs,
      notes: form.notes,
    };
    onSave(saved);
  };

  return (
    <Modal
      title={station ? 'Edit Station' : 'Add Station'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{station ? 'Save Changes' : 'Add Station'}</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Station Name <span className="required">*</span></label>
            <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g., PlayStation Alpha" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Station Number</label>
            <input type="number" className="form-control" value={form.number ?? 1} min={1} onChange={e => set('number', +e.target.value)} />
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-control" value={form.type ?? 'ps5'} onChange={e => set('type', e.target.value as StationType)}>
              {(['ps5', 'xbox', 'pc', 'racing', 'vr'] as const).map(t => <option key={t} value={t}>{STATION_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Hourly Rate (₹) <span className="required">*</span></label>
            <input type="number" className={`form-control ${errors.hourlyRate ? 'error' : ''}`} value={form.hourlyRate ?? ''} min={0} onChange={e => set('hourlyRate', +e.target.value)} />
            {errors.hourlyRate && <span className="form-error">{errors.hourlyRate}</span>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Specs / Rig Hardware</label>
          <input className="form-control" value={form.specs ?? ''} onChange={e => set('specs', e.target.value)} placeholder="e.g., RTX 4080 · i9-13900K · 360Hz" />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-control" value={form.status ?? 'available'} onChange={e => set('status', e.target.value as StationStatus)}>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Internal notes…" />
        </div>
      </div>
    </Modal>
  );
}
