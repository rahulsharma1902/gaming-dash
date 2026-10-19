// ============================================================
// GameZone OS — Bookings Page
// ============================================================

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, CalendarDays, AlertCircle } from 'lucide-react';
import { useApp, useSettings } from '../context';
import type { Booking, BookingStatus, StationType } from '../types';
import { PageHeader, StatusBadge, EmptyState, formatCurrency, STATION_TYPE_LABELS, STATION_TYPE_ICONS, SearchInput, Modal, ConfirmDialog } from '../components';
import { makeId } from '../data';

const STATUS_FILTERS: BookingStatus[] = ['confirmed', 'pending', 'checked-in', 'completed', 'cancelled', 'no-show'];

export default function BookingsPage() {
  const { state, dispatch, toast } = useApp();
  const settings = useSettings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'day'>('list');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    return state.bookings.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (search && !b.customerName.toLowerCase().includes(search.toLowerCase()) && !b.phone.includes(search)) return false;
      if (viewMode === 'day' && b.date !== selectedDate) return false;
      return true;
    }).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  }, [state.bookings, statusFilter, search, viewMode, selectedDate]);

  const updateStatus = (booking: Booking, status: BookingStatus) => {
    dispatch({ type: 'UPSERT_BOOKING', payload: { ...booking, status } });
    toast({ type: 'success', title: `Booking ${status}`, message: booking.customerName });
  };

  const handleDelete = (booking: Booking) => {
    dispatch({ type: 'DELETE_BOOKING', payload: booking.id });
    toast({ type: 'success', title: 'Booking deleted' });
    setDeleteConfirm(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const summary = {
    total: state.bookings.length,
    confirmed: state.bookings.filter(b => b.status === 'confirmed').length,
    today: state.bookings.filter(b => b.date === todayStr).length,
    pending: state.bookings.filter(b => b.status === 'pending').length,
  };

  return (
    <div>
      <PageHeader
        title="Bookings & Reservations"
        description="Schedule and manage gaming sessions in advance."
        breadcrumb={['GameZone OS', 'Bookings']}
        actions={
          <button className="btn btn-primary" onClick={() => { setEditingBooking(null); setShowModal(true); }}>
            <Plus size={15} /> New Booking
          </button>
        }
      />

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Today', value: summary.today, color: 'var(--accent-violet)' },
          { label: 'Confirmed', value: summary.confirmed, color: 'var(--status-success)' },
          { label: 'Pending', value: summary.pending, color: 'var(--status-warning)' },
          { label: 'Total', value: summary.total, color: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '10px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'baseline', gap: 8,
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="filter-group">
          <button className={`filter-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>All Bookings</button>
          <button className={`filter-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>Day View</button>
        </div>
        {viewMode === 'day' && (
          <input type="date" className="form-control" style={{ width: 'auto', height: 34 }}
            value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        )}
        <div className="filter-group" style={{ flexWrap: 'wrap' }}>
          <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, phone…" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<CalendarDays size={24} />} title="No bookings found" description="Adjust filters or create a new booking." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Station</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(bk => (
                <tr key={bk.id} className={bk.date === todayStr ? 'row-highlight' : ''}>
                  <td>
                    <strong>{bk.customerName}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{bk.phone}</div>
                    {bk.addons && bk.addons.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <span className="badge pending" style={{ fontSize: 10, padding: '1px 5px' }}>
                          🍟 {bk.addons.reduce((s, a) => s + a.quantity, 0)} snacks/drinks
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ marginRight: 4 }}>{STATION_TYPE_ICONS[bk.stationType]}</span>
                    {STATION_TYPE_LABELS[bk.stationType]}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    <div>{bk.date}</div>
                    <div style={{ color: 'var(--text-tertiary)' }}>{bk.startTime}</div>
                  </td>
                  <td>{bk.durationMinutes / 60}h {bk.durationMinutes % 60 > 0 ? `${bk.durationMinutes % 60}m` : ''}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-success)' }}>
                    {formatCurrency(bk.quotedPrice, settings.currencySymbol)}
                  </td>
                  <td><StatusBadge status={bk.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {bk.status === 'pending' && <button className="btn btn-sm btn-success" onClick={() => updateStatus(bk, 'confirmed')}>Confirm</button>}
                      {bk.status === 'confirmed' && <button className="btn btn-sm btn-primary" onClick={() => updateStatus(bk, 'checked-in')}>Check In</button>}
                      {bk.status === 'checked-in' && <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(bk, 'completed')}>Complete</button>}
                      {(bk.status === 'pending' || bk.status === 'confirmed') && (
                        <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(bk, 'cancelled')}>Cancel</button>
                      )}
                      {bk.status === 'confirmed' && (
                        <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(bk, 'no-show')}>No-show</button>
                      )}
                      <button className="btn btn-sm btn-secondary btn-icon" onClick={() => { setEditingBooking(bk); setShowModal(true); }}><Edit2 size={12} /></button>
                      <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setDeleteConfirm(bk)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <BookingFormModal
          booking={editingBooking}
          existingBookings={state.bookings}
          stations={state.stations}
          products={state.fnbProducts}
          onClose={() => setShowModal(false)}
          onSave={(bk) => {
            dispatch({ type: 'UPSERT_BOOKING', payload: bk });
            toast({ type: 'success', title: editingBooking ? 'Booking updated' : 'Booking created', message: bk.customerName });
            setShowModal(false);
          }}
          symbol={settings.currencySymbol}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Booking?"
          message={`Delete booking for ${deleteConfirm.customerName} on ${deleteConfirm.date} at ${deleteConfirm.startTime}? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// ---- Booking Form Modal ----
function BookingFormModal({ booking, existingBookings, stations, products, onClose, onSave, symbol }: {
  booking: Booking | null;
  existingBookings: Booking[];
  stations: import('../types').Station[];
  products: import('../types').FnBProduct[];
  onClose: () => void;
  onSave: (b: Booking) => void;
  symbol: string;
}) {
  const isEdit = !!booking;
  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<Partial<Booking>>(booking ?? {
    status: 'pending',
    date: todayStr,
    startTime: '14:00',
    durationMinutes: 60,
    stationType: 'ps5',
  });
  const [selectedAddons, setSelectedAddons] = useState<import('../types').SessionAddon[]>(booking?.addons ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState<string | null>(null);

  const set = (k: keyof Booking, v: Booking[keyof Booking]) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const ne = { ...e }; delete ne[k]; return ne; });
    setConflict(null);
  };

  const filteredStations = stations.filter(s => !form.stationType || s.type === form.stationType);

  const detectConflict = (): string | null => {
    if (!form.stationId || !form.date || !form.startTime || !form.durationMinutes) return null;
    const [sh, sm] = form.startTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = startMins + form.durationMinutes;

    for (const bk of existingBookings) {
      if (bk.id === booking?.id) continue;
      if (bk.stationId !== form.stationId || bk.date !== form.date) continue;
      if (bk.status === 'cancelled' || bk.status === 'no-show') continue;
      const [bh, bm] = bk.startTime.split(':').map(Number);
      const bStart = bh * 60 + bm;
      const bEnd = bStart + bk.durationMinutes;
      if (startMins < bEnd && endMins > bStart) {
        return `Conflicts with ${bk.customerName}'s booking at ${bk.startTime}`;
      }
    }
    return null;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.customerName?.trim()) errs.customerName = 'Name is required';
    if (!form.phone?.trim()) errs.phone = 'Phone is required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.startTime) errs.startTime = 'Start time is required';
    if (!form.durationMinutes || form.durationMinutes <= 0) errs.durationMinutes = 'Duration required';
    if (!form.quotedPrice || form.quotedPrice <= 0) errs.quotedPrice = 'Price required';
    if (form.date && form.date < todayStr) errs.date = 'Cannot book in the past';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const c = detectConflict();
    if (c) { setConflict(c); return; }

    const saved: Booking = {
      id: booking?.id ?? makeId('bk'),
      customerName: form.customerName!.trim(),
      phone: form.phone!.trim(),
      stationType: form.stationType as StationType ?? 'ps5',
      stationId: form.stationId,
      date: form.date!,
      startTime: form.startTime!,
      durationMinutes: form.durationMinutes!,
      quotedPrice: form.quotedPrice!,
      status: form.status as BookingStatus ?? 'pending',
      addons: selectedAddons,
      notes: form.notes,
      createdAt: booking?.createdAt ?? new Date().toISOString(),
    };
    onSave(saved);
  };

  // Auto-compute price based on station type and duration + addons
  const autoPrice = useMemo(() => {
    const base: Record<string, number> = { ps5: 120, xbox: 100, pc: 80, racing: 200, vr: 250 };
    const rate = base[form.stationType ?? 'ps5'] ?? 100;
    const basePrice = Math.round((rate * (form.durationMinutes ?? 60)) / 60);
    const addonsTotal = selectedAddons.reduce((s, a) => s + a.price * a.quantity, 0);
    return basePrice + addonsTotal;
  }, [form.stationType, form.durationMinutes, selectedAddons]);

  return (
    <Modal
      title={isEdit ? 'Edit Booking' : 'New Booking'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Create Booking'}</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {conflict && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--status-danger-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--status-danger)' }}>
            <AlertCircle size={16} /> {conflict}
          </div>
        )}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Customer Name <span className="required">*</span></label>
            <input className={`form-control ${errors.customerName ? 'error' : ''}`} value={form.customerName ?? ''} onChange={e => set('customerName', e.target.value)} placeholder="Full name" />
            {errors.customerName && <span className="form-error">{errors.customerName}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone <span className="required">*</span></label>
            <input className={`form-control ${errors.phone ? 'error' : ''}`} value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="10-digit phone" />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Station Type</label>
            <select className="form-control" value={form.stationType ?? 'ps5'} onChange={e => { set('stationType', e.target.value as StationType); set('stationId', undefined); }}>
              {(['ps5', 'xbox', 'pc', 'racing', 'vr'] as const).map(t => <option key={t} value={t}>{STATION_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Specific Station (optional)</label>
            <select className="form-control" value={form.stationId ?? ''} onChange={e => set('stationId', e.target.value || undefined)}>
              <option value="">Any available</option>
              {filteredStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Date <span className="required">*</span></label>
            <input type="date" className={`form-control ${errors.date ? 'error' : ''}`} value={form.date ?? ''} min={todayStr} onChange={e => set('date', e.target.value)} />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Start Time <span className="required">*</span></label>
            <input type="time" className={`form-control ${errors.startTime ? 'error' : ''}`} value={form.startTime ?? ''} onChange={e => set('startTime', e.target.value)} />
            {errors.startTime && <span className="form-error">{errors.startTime}</span>}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Duration (minutes) <span className="required">*</span></label>
            <select className="form-control" value={form.durationMinutes ?? 60} onChange={e => set('durationMinutes', +e.target.value)}>
              {[30, 60, 90, 120, 150, 180, 240, 300].map(d => <option key={d} value={d}>{d < 60 ? `${d}m` : `${d/60}h${d%60?` ${d%60}m`:''}`}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              Quoted Price (₹) <span className="required">*</span>
              <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>Suggested: ₹{autoPrice}</span>
            </label>
            <input type="number" className={`form-control ${errors.quotedPrice ? 'error' : ''}`}
              value={form.quotedPrice ?? autoPrice} onChange={e => set('quotedPrice', +e.target.value)} min={0} />
            {errors.quotedPrice && <span className="form-error">{errors.quotedPrice}</span>}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status ?? 'pending'} onChange={e => set('status', e.target.value as BookingStatus)}>
              {STATUS_FILTERS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Pre-order Snacks & Drinks (Add-ons)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
            {products.slice(0, 6).map(p => {
              const isSelected = selectedAddons.some(a => a.productId === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedAddons(prev => prev.filter(a => a.productId !== p.id));
                    } else {
                      setSelectedAddons(prev => [...prev, {
                        id: makeId('adn'),
                        productId: p.id,
                        name: p.name,
                        category: p.category,
                        price: p.price,
                        quantity: 1,
                        addedAt: new Date().toISOString(),
                      }]);
                    }
                  }}
                  style={{ justifyContent: 'space-between', fontSize: 11, padding: '6px 8px' }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <span>+{formatCurrency(p.price, symbol)}</span>
                </button>
              );
            })}
          </div>
          {selectedAddons.length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>
              Selected: {selectedAddons.map(a => a.name).join(', ')} (+{formatCurrency(selectedAddons.reduce((s, a) => s + a.price * a.quantity, 0), symbol)})
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Special requests, group info, etc." />
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          ⚠️ Demo only — no real SMS, email, or WhatsApp confirmations are sent. Booking data is stored locally in this browser session.
        </p>
      </div>
    </Modal>
  );
}
