// ============================================================
// GameZone OS — Customers Page
// ============================================================

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Users, Star } from 'lucide-react';
import { useApp, useSettings } from '../context';
import type { Customer } from '../types';
import { PageHeader, StatusBadge, EmptyState, formatCurrency, formatDate, SearchInput, Modal, ConfirmDialog } from '../components';
import { makeId } from '../data';

const LOYALTY_COLORS: Record<string, string> = { gold: 'var(--status-warning)', silver: 'var(--text-secondary)', bronze: '#cd7f32' };

export default function CustomersPage() {
  const { state, dispatch, toast } = useApp();
  const settings = useSettings();
  const [search, setSearch] = useState('');
  const [loyaltyFilter, setLoyaltyFilter] = useState<'all' | 'gold' | 'silver' | 'bronze'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'visits' | 'spend' | 'date'>('name');

  const filtered = useMemo(() => {
    return state.customers.filter(c => {
      if (c.archived) return false;
      if (loyaltyFilter !== 'all' && c.loyaltyStatus !== loyaltyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? '').toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'visits') return b.totalVisits - a.totalVisits;
      if (sortBy === 'spend') return b.totalSpend - a.totalSpend;
      return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    });
  }, [state.customers, loyaltyFilter, search, sortBy]);

  const handleDelete = (c: Customer) => {
    dispatch({ type: 'UPSERT_CUSTOMER', payload: { ...c, archived: true } });
    toast({ type: 'success', title: 'Customer archived', message: c.name });
    setDeleteConfirm(null);
    if (selectedCustomer?.id === c.id) setSelectedCustomer(null);
  };

  const customerSessions = (customerId: string) =>
    state.sessions.filter(s => s.customerId === customerId);

  const customerBookings = (customerId: string) =>
    state.bookings.filter(b => b.status !== 'cancelled' && b.status !== 'no-show');

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Directory of registered players and their history."
        breadcrumb={['GameZone OS', 'Customers']}
        actions={
          <button className="btn btn-primary" onClick={() => { setEditingCustomer(null); setShowModal(true); }}>
            <Plus size={15} /> Add Customer
          </button>
        }
      />

      {/* Summary */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Total', value: state.customers.filter(c => !c.archived).length, color: 'var(--text-primary)' },
          { label: 'Gold', value: state.customers.filter(c => c.loyaltyStatus === 'gold' && !c.archived).length, color: LOYALTY_COLORS.gold },
          { label: 'Silver', value: state.customers.filter(c => c.loyaltyStatus === 'silver' && !c.archived).length, color: LOYALTY_COLORS.silver },
          { label: 'Bronze', value: state.customers.filter(c => c.loyaltyStatus === 'bronze' && !c.archived).length, color: LOYALTY_COLORS.bronze },
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
          {(['all', 'gold', 'silver', 'bronze'] as const).map(f => (
            <button key={f} className={`filter-btn ${loyaltyFilter === f ? 'active' : ''}`} onClick={() => setLoyaltyFilter(f)}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Name, phone, email…" />
        <select className="form-control" style={{ width: 'auto', height: 34, fontSize: 12 }} value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
          <option value="name">Sort: Name</option>
          <option value="visits">Sort: Most Visits</option>
          <option value="spend">Sort: Highest Spend</option>
          <option value="date">Sort: Newest</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={24} />} title="No customers found" description="Add your first customer or adjust search filters." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Loyalty</th>
                <th>Joined</th>
                <th>Visits</th>
                <th>Total Spend</th>
                <th>Preferred</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cust => (
                <tr key={cust.id} onClick={() => setSelectedCustomer(cust)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, var(--accent-violet), var(--accent-blue))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff',
                      }}>
                        {cust.name[0]}
                      </div>
                      <div>
                        <strong>{cust.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{cust.phone}</div>
                        {cust.email && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{cust.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: LOYALTY_COLORS[cust.loyaltyStatus], fontWeight: 600, fontSize: 13 }}>
                      <Star size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                      {cust.loyaltyStatus.charAt(0).toUpperCase() + cust.loyaltyStatus.slice(1)}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{formatDate(cust.registeredAt)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cust.totalVisits}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-success)', fontWeight: 600 }}>
                    {formatCurrency(cust.totalSpend, settings.currencySymbol)}
                  </td>
                  <td>{cust.preferredType ? `${cust.preferredType.toUpperCase()}` : '—'}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-secondary btn-icon" onClick={() => { setEditingCustomer(cust); setShowModal(true); }}><Edit2 size={12} /></button>
                      <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setDeleteConfirm(cust)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer detail panel */}
      {selectedCustomer && (
        <Modal title="Customer Profile" onClose={() => setSelectedCustomer(null)} size="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-blue))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: '#fff',
              }}>{selectedCustomer.name[0]}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedCustomer.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedCustomer.phone}{selectedCustomer.email ? ` · ${selectedCustomer.email}` : ''}</div>
                <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                  <span style={{ color: LOYALTY_COLORS[selectedCustomer.loyaltyStatus], fontSize: 12, fontWeight: 600 }}>
                    ★ {selectedCustomer.loyaltyStatus.charAt(0).toUpperCase() + selectedCustomer.loyaltyStatus.slice(1)} Member
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Since {formatDate(selectedCustomer.registeredAt)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Total Visits', value: selectedCustomer.totalVisits },
                { label: 'Total Spend', value: formatCurrency(selectedCustomer.totalSpend, settings.currencySymbol) },
                { label: 'Avg Spend', value: formatCurrency(selectedCustomer.totalVisits > 0 ? Math.round(selectedCustomer.totalSpend / selectedCustomer.totalVisits) : 0, settings.currencySymbol) },
              ].map(m => (
                <div key={m.label} style={{ padding: '12px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-violet)' }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {selectedCustomer.notes && (
              <div style={{ padding: '12px 14px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)' }}>
                📝 {selectedCustomer.notes}
              </div>
            )}

            {/* Recent sessions */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Recent Sessions</div>
              {customerSessions(selectedCustomer.id).length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No session records</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {customerSessions(selectedCustomer.id).slice(0, 5).map(ses => (
                    <div key={ses.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{new Date(ses.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <StatusBadge status={ses.status} dot={false} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Form modal */}
      {showModal && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setShowModal(false)}
          onSave={(c) => {
            dispatch({ type: 'UPSERT_CUSTOMER', payload: c });
            toast({ type: 'success', title: editingCustomer ? 'Customer updated' : 'Customer added', message: c.name });
            setShowModal(false);
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Archive Customer?"
          message={`Archive ${deleteConfirm.name}? They will be removed from the active directory. Their history will be preserved.`}
          confirmLabel="Archive"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// ---- Customer Form Modal ----
function CustomerFormModal({ customer, onClose, onSave }: {
  customer: Customer | null; onClose: () => void; onSave: (c: Customer) => void;
}) {
  const [form, setForm] = useState<Partial<Customer>>(customer ?? { loyaltyStatus: 'bronze' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof Customer, v: Customer[keyof Customer]) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const ne = { ...e }; delete ne[k]; return ne; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = 'Name is required';
    if (!form.phone?.trim()) errs.phone = 'Phone is required';
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid 10-digit phone number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const saved: Customer = {
      id: customer?.id ?? makeId('cus'),
      name: form.name!.trim(),
      phone: form.phone!.trim(),
      email: form.email?.trim() || undefined,
      registeredAt: customer?.registeredAt ?? new Date().toISOString(),
      totalVisits: customer?.totalVisits ?? 0,
      totalSpend: customer?.totalSpend ?? 0,
      preferredType: form.preferredType,
      notes: form.notes,
      loyaltyStatus: form.loyaltyStatus ?? 'bronze',
    };
    onSave(saved);
  };

  return (
    <Modal
      title={customer ? 'Edit Customer' : 'Add Customer'}
      onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{customer ? 'Save Changes' : 'Add Customer'}</button></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Customer name" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone <span className="required">*</span></label>
            <input className={`form-control ${errors.phone ? 'error' : ''}`} value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="10-digit number" />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email (optional)</label>
          <input className={`form-control ${errors.email ? 'error' : ''}`} type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Preferred Station</label>
            <select className="form-control" value={form.preferredType ?? ''} onChange={e => set('preferredType', e.target.value as Customer['preferredType'] || undefined)}>
              <option value="">No preference</option>
              <option value="ps5">PlayStation 5</option>
              <option value="xbox">Xbox</option>
              <option value="pc">Gaming PC</option>
              <option value="racing">Racing Sim</option>
              <option value="vr">VR Station</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Loyalty Status</label>
            <select className="form-control" value={form.loyaltyStatus ?? 'bronze'} onChange={e => set('loyaltyStatus', e.target.value as Customer['loyaltyStatus'])}>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Preferences, notes about this customer…" />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          Use only fictional or consented contact information in this demo. Do not store real customer data.
        </p>
      </div>
    </Modal>
  );
}
