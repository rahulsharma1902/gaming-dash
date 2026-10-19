// ============================================================
// GameZone OS — Pricing & Packages Page
// ============================================================

import React, { useState } from 'react';
import { Edit2, Package, DollarSign, ToggleLeft, ToggleRight, Plus, Trash2 } from 'lucide-react';
import { useApp, useSettings } from '../context';
import type { PricingRule, Package as PkgType, StationType } from '../types';
import { PageHeader, formatCurrency, STATION_TYPE_LABELS, STATION_TYPE_ICONS, Modal, ConfirmDialog } from '../components';
import { makeId } from '../data';

export default function PricingPage() {
  const { state, dispatch, toast } = useApp();
  const settings = useSettings();
  const [tab, setTab] = useState<'rates' | 'packages'>('rates');
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [editingPkg, setEditingPkg] = useState<PkgType | null>(null);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [deletePkg, setDeletePkg] = useState<PkgType | null>(null);

  const togglePackage = (pkg: PkgType) => {
    dispatch({ type: 'UPSERT_PACKAGE', payload: { ...pkg, active: !pkg.active } });
    toast({ type: 'success', title: pkg.active ? 'Package deactivated' : 'Package activated', message: pkg.name });
  };

  const toggleRule = (rule: PricingRule) => {
    dispatch({ type: 'UPSERT_PRICING', payload: { ...rule, enabled: !rule.enabled } });
    toast({ type: 'success', title: rule.enabled ? 'Rate disabled' : 'Rate enabled' });
  };

  return (
    <div>
      <PageHeader
        title="Pricing & Packages"
        description="Configure hourly rates by station type and manage gaming packages."
        breadcrumb={['GameZone OS', 'Pricing & Packages']}
      />

      <div className="tabs" style={{ marginBottom: 'var(--space-5)' }}>
        <button className={`tab-btn ${tab === 'rates' ? 'active' : ''}`} onClick={() => setTab('rates')}>
          Hourly Rates
        </button>
        <button className={`tab-btn ${tab === 'packages' ? 'active' : ''}`} onClick={() => setTab('packages')}>
          Packages & Deals
        </button>
      </div>

      {tab === 'rates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            ℹ️ Rates shown below are used to calculate session charges. Changes affect new sessions only — ongoing sessions retain their original rate.
          </div>

          {state.pricingRules.map(rule => (
            <div key={rule.id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{STATION_TYPE_ICONS[rule.stationType]}</span>
                  <div>
                    <div className="card-title">{STATION_TYPE_LABELS[rule.stationType]}</div>
                    <div className="card-subtitle">Station pricing configuration</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className={`btn btn-sm ${rule.enabled ? 'btn-ghost' : 'btn-secondary'}`}
                    onClick={() => toggleRule(rule)}
                    style={{ color: rule.enabled ? 'var(--status-success)' : 'var(--text-tertiary)' }}
                  >
                    {rule.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {rule.enabled ? 'Active' : 'Disabled'}
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => { setEditingRule(rule); setShowRuleModal(true); }}>
                    <Edit2 size={14} /> Edit
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                  <RateField label="Weekday Rate" value={formatCurrency(rule.weekdayRate, settings.currencySymbol) + '/hr'} />
                  <RateField label="Weekend Rate" value={formatCurrency(rule.weekendRate, settings.currencySymbol) + '/hr'} highlight />
                  {rule.peakRate && <RateField label="Peak Rate" value={formatCurrency(rule.peakRate, settings.currencySymbol) + '/hr'} />}
                  {rule.peakHours && <RateField label="Peak Hours" value={`${rule.peakHours.start} – ${rule.peakHours.end}`} />}
                  <RateField label="Minimum Charge" value={formatCurrency(rule.minimumCharge, settings.currencySymbol)} />
                  <RateField label="Rounding" value={rule.roundingRule.charAt(0).toUpperCase() + rule.roundingRule.slice(1)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'packages' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <button className="btn btn-primary" onClick={() => { setEditingPkg(null); setShowPkgModal(true); }}>
              <Plus size={15} /> Add Package
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {state.packages.map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                symbol={settings.currencySymbol}
                onEdit={() => { setEditingPkg(pkg); setShowPkgModal(true); }}
                onToggle={() => togglePackage(pkg)}
                onDelete={() => setDeletePkg(pkg)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showRuleModal && editingRule && (
        <PricingRuleModal
          rule={editingRule}
          onClose={() => setShowRuleModal(false)}
          onSave={(r) => {
            dispatch({ type: 'UPSERT_PRICING', payload: r });
            toast({ type: 'success', title: 'Pricing updated', message: STATION_TYPE_LABELS[r.stationType] });
            setShowRuleModal(false);
          }}
          symbol={settings.currencySymbol}
        />
      )}

      {showPkgModal && (
        <PackageFormModal
          pkg={editingPkg}
          onClose={() => setShowPkgModal(false)}
          onSave={(p) => {
            dispatch({ type: 'UPSERT_PACKAGE', payload: p });
            toast({ type: 'success', title: editingPkg ? 'Package updated' : 'Package created', message: p.name });
            setShowPkgModal(false);
          }}
          symbol={settings.currencySymbol}
        />
      )}

      {deletePkg && (
        <ConfirmDialog
          title="Delete Package?"
          message={`Delete the "${deletePkg.name}" package? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            dispatch({ type: 'DELETE_PACKAGE', payload: deletePkg.id });
            toast({ type: 'success', title: 'Package deleted' });
            setDeletePkg(null);
          }}
          onCancel={() => setDeletePkg(null)}
        />
      )}
    </div>
  );
}

function RateField({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: highlight ? 'var(--accent-violet)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  );
}

function PackageCard({ pkg, symbol, onEdit, onToggle, onDelete }: {
  pkg: PkgType; symbol: string; onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const h = Math.floor(pkg.durationMinutes / 60), m = pkg.durationMinutes % 60;
  const durationStr = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;

  return (
    <div className="card" style={{ opacity: pkg.active ? 1 : 0.6, transition: 'opacity 200ms ease' }}>
      <div className="card-header">
        <div>
          <div className="card-title">{pkg.name}</div>
          <div className="card-subtitle">{pkg.description}</div>
        </div>
        {!pkg.active && <span className="badge cancelled" style={{ flexShrink: 0 }}>Inactive</span>}
        {pkg.active && <span className="badge available" style={{ flexShrink: 0 }}>Active</span>}
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(pkg.price, symbol)}</span>
          {pkg.savings && <span style={{ fontSize: 12, color: 'var(--status-success)', fontWeight: 600 }}>Save {formatCurrency(pkg.savings, symbol)}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <span className="tag">{durationStr}</span>
          <span className="tag">{pkg.stationType === 'any' ? 'Any Station' : STATION_TYPE_LABELS[pkg.stationType]}</span>
          {pkg.maxPersons && <span className="tag">Up to {pkg.maxPersons} players</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`btn btn-sm ${pkg.active ? 'btn-secondary' : 'btn-primary'}`} onClick={onToggle} style={{ flex: 1 }}>
            {pkg.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {pkg.active ? 'Deactivate' : 'Activate'}
          </button>
          <button className="btn btn-sm btn-secondary btn-icon" onClick={onEdit}><Edit2 size={12} /></button>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={onDelete}><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}

// ---- Pricing Rule Modal ----
function PricingRuleModal({ rule, onClose, onSave, symbol }: { rule: PricingRule; onClose: () => void; onSave: (r: PricingRule) => void; symbol: string; }) {
  const [form, setForm] = useState({ ...rule });
  const set = (k: keyof PricingRule, v: PricingRule[keyof PricingRule]) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal title={`Edit — ${STATION_TYPE_LABELS[rule.stationType]}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave(form)}>Save Changes</button></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Weekday Rate ({symbol}/hr)</label>
            <input type="number" className="form-control" value={form.weekdayRate} min={0} onChange={e => set('weekdayRate', +e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Weekend Rate ({symbol}/hr)</label>
            <input type="number" className="form-control" value={form.weekendRate} min={0} onChange={e => set('weekendRate', +e.target.value)} />
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Peak Rate ({symbol}/hr)</label>
            <input type="number" className="form-control" value={form.peakRate ?? ''} min={0} onChange={e => set('peakRate', +e.target.value || undefined)} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label className="form-label">Minimum Charge ({symbol})</label>
            <input type="number" className="form-control" value={form.minimumCharge} min={0} onChange={e => set('minimumCharge', +e.target.value)} />
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Peak Start</label>
            <input type="time" className="form-control" value={form.peakHours?.start ?? ''} onChange={e => set('peakHours', { ...form.peakHours, start: e.target.value, end: form.peakHours?.end ?? '22:00' })} />
          </div>
          <div className="form-group">
            <label className="form-label">Peak End</label>
            <input type="time" className="form-control" value={form.peakHours?.end ?? ''} onChange={e => set('peakHours', { ...form.peakHours, end: e.target.value, start: form.peakHours?.start ?? '17:00' })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Rounding Rule</label>
          <select className="form-control" value={form.roundingRule} onChange={e => set('roundingRule', e.target.value as PricingRule['roundingRule'])}>
            <option value="up">Round Up (to next 30 min)</option>
            <option value="nearest">Round to Nearest 15 min</option>
            <option value="actual">Actual Time (no rounding)</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

// ---- Package Form Modal ----
function PackageFormModal({ pkg, onClose, onSave, symbol }: { pkg: PkgType | null; onClose: () => void; onSave: (p: PkgType) => void; symbol: string; }) {
  const [form, setForm] = useState<Partial<PkgType>>(pkg ?? { active: true, stationType: 'any', durationMinutes: 60 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof PkgType, v: PkgType[keyof PkgType]) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => { const ne = { ...e }; delete ne[k]; return ne; }); };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = 'Name is required';
    if (!form.price || form.price <= 0) errs.price = 'Price is required';
    if (!form.durationMinutes || form.durationMinutes <= 0) errs.durationMinutes = 'Duration is required';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      id: pkg?.id ?? makeId('pkg'),
      name: form.name!.trim(),
      description: form.description?.trim() ?? '',
      stationType: form.stationType ?? 'any',
      durationMinutes: form.durationMinutes!,
      price: form.price!,
      savings: form.savings || undefined,
      active: form.active ?? true,
      maxPersons: form.maxPersons || undefined,
    });
  };

  return (
    <Modal title={pkg ? 'Edit Package' : 'New Package'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{pkg ? 'Save Changes' : 'Create Package'}</button></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label">Package Name <span className="required">*</span></label>
          <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g., Weekend Gaming Pass" />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-control" value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Short description" />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Station Type</label>
            <select className="form-control" value={form.stationType ?? 'any'} onChange={e => set('stationType', e.target.value as StationType | 'any')}>
              <option value="any">Any Station</option>
              <option value="ps5">PlayStation 5</option>
              <option value="xbox">Xbox</option>
              <option value="pc">Gaming PC</option>
              <option value="racing">Racing Sim</option>
              <option value="vr">VR Station</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Duration (minutes) <span className="required">*</span></label>
            <input type="number" className={`form-control ${errors.durationMinutes ? 'error' : ''}`} value={form.durationMinutes ?? ''} min={15} step={15} onChange={e => set('durationMinutes', +e.target.value)} />
            {errors.durationMinutes && <span className="form-error">{errors.durationMinutes}</span>}
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Price ({symbol}) <span className="required">*</span></label>
            <input type="number" className={`form-control ${errors.price ? 'error' : ''}`} value={form.price ?? ''} min={0} onChange={e => set('price', +e.target.value)} />
            {errors.price && <span className="form-error">{errors.price}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Savings ({symbol})</label>
            <input type="number" className="form-control" value={form.savings ?? ''} min={0} onChange={e => set('savings', +e.target.value || undefined)} placeholder="Optional" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Max Players (optional)</label>
          <input type="number" className="form-control" value={form.maxPersons ?? ''} min={1} max={20} onChange={e => set('maxPersons', +e.target.value || undefined)} placeholder="e.g., 4" />
        </div>
      </div>
    </Modal>
  );
}
