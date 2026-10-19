// ============================================================
// GameZone OS — Settings Page
// ============================================================

import React, { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { useApp, useSettings } from '../context';
import type { BusinessSettings } from '../types';
import { PageHeader, ConfirmDialog } from '../components';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SettingsPage() {
  const { dispatch, toast, resetDemo } = useApp();
  const settings = useSettings();
  const [form, setForm] = useState<BusinessSettings>({ ...settings });
  const [tab, setTab] = useState<'business' | 'hours' | 'policies' | 'demo'>('business');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof BusinessSettings, v: BusinessSettings[keyof BusinessSettings]) =>
    setForm(f => ({ ...f, [k]: v }));

  const setHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setForm(f => ({
      ...f,
      openingHours: {
        ...f.openingHours,
        [day]: { ...f.openingHours[day], [field]: value },
      },
    }));
  };

  const handleSave = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: form });
    setSaved(true);
    toast({ type: 'success', title: 'Settings saved', message: 'Changes saved to demo session storage.' });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your business identity and demo preferences."
        breadcrumb={['GameZone OS', 'Settings']}
        actions={
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={15} /> {saved ? 'Saved ✓' : 'Save Settings'}
          </button>
        }
      />

      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
        ⚠️ Settings are saved to your browser session storage. Changes are not synced to any server or other devices.
      </div>

      <div className="tabs" style={{ marginBottom: 'var(--space-5)' }}>
        {(['business', 'hours', 'policies', 'demo'] as const).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'business' ? 'Business Info' : t === 'hours' ? 'Opening Hours' : t === 'policies' ? 'Booking Policy' : 'Demo & Reset'}
          </button>
        ))}
      </div>

      {tab === 'business' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Business Information</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Business Name <span className="required">*</span></label>
                  <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tagline</label>
                  <input className="form-control" value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Your catchy slogan" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-control" value={form.address} onChange={e => set('address', e.target.value)} rows={2} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Logo Monogram</label>
                  <input className="form-control" value={form.monogram} maxLength={3} onChange={e => set('monogram', e.target.value.toUpperCase())} placeholder="PA" />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency Symbol</label>
                  <input className="form-control" value={form.currencySymbol} maxLength={3} onChange={e => set('currencySymbol', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select className="form-control" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Theme Design</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${form.theme === 'premium-neon' || form.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => set('theme', 'premium-neon')}
                  >
                    ⚡ Premium Neon Gaming (Dark Graphite & Electric Lime)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${form.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => set('theme', 'light')}
                  >
                    ☀️ Clean Minimal Light
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '2px solid #000', paddingTop: 'var(--space-4)' }}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.taxEnabled} onChange={e => set('taxEnabled', e.target.checked)} />
                    <span className="form-label" style={{ margin: 0 }}>Apply GST/Tax on transactions</span>
                  </label>
                </div>
                {form.taxEnabled && (
                  <div className="form-group" style={{ marginTop: 8 }}>
                    <label className="form-label">Tax Rate (%)</label>
                    <input type="number" className="form-control" style={{ width: 120 }} value={form.taxRate} min={0} max={100} step={0.5} onChange={e => set('taxRate', +e.target.value)} />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>Clearly labeled as illustrative in demo transactions.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'hours' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Opening Hours</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {DAYS.map(day => (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 100, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{day}</div>
                  <input type="checkbox" checked={!(form.openingHours[day]?.closed)} onChange={e => setHours(day, 'closed', !e.target.checked)} id={`${day}_open`} />
                  <label htmlFor={`${day}_open`} style={{ fontSize: 12, color: 'var(--text-tertiary)', cursor: 'pointer', minWidth: 40 }}>
                    {form.openingHours[day]?.closed ? 'Closed' : 'Open'}
                  </label>
                  {!form.openingHours[day]?.closed && (
                    <>
                      <input type="time" className="form-control" style={{ width: 120, height: 34 }}
                        value={form.openingHours[day]?.open ?? '10:00'} onChange={e => setHours(day, 'open', e.target.value)} />
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>–</span>
                      <input type="time" className="form-control" style={{ width: 120, height: 34 }}
                        value={form.openingHours[day]?.close ?? '23:00'} onChange={e => setHours(day, 'close', e.target.value)} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'policies' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Booking Policies</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Lead Time for Bookings (hours)</label>
                <input type="number" className="form-control" style={{ width: 120 }} value={form.bookingLeadHours} min={0} max={48} onChange={e => set('bookingLeadHours', +e.target.value)} />
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>Minimum hours in advance a booking can be made.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Max Booking Window (days ahead)</label>
                <input type="number" className="form-control" style={{ width: 120 }} value={form.maxBookingDays} min={1} max={365} onChange={e => set('maxBookingDays', +e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'demo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Demo Information</div></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', fontSize: 14, color: 'var(--text-secondary)' }}>
                <p>This is a <strong style={{ color: 'var(--text-primary)' }}>frontend-only demo</strong> of GameZone OS. All data is stored in your browser's <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-surface-2)', padding: '1px 5px', borderRadius: 3 }}>sessionStorage</code>.</p>
                <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Data is scoped to the current browser tab. Closing the tab may clear it.</li>
                  <li>No real payments, hardware, SMS, or email is used.</li>
                  <li>No credentials are stored. The login screen (if shown) is a simulated demo flow only.</li>
                  <li>Sample customer names, phone numbers, and addresses are entirely fictional.</li>
                  <li>Financial figures are illustrative sample data and not real business results.</li>
                </ul>
                <p style={{ fontSize: 12 }}>Storage key: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-surface-2)', padding: '1px 5px', borderRadius: 3 }}>gamezone_os_v1</code></p>
              </div>
            </div>
          </div>

          <div className="card" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ color: 'var(--status-danger)' }}>Reset Demo Data</div>
                <div className="card-subtitle">Restore all data to original seed state</div>
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Resetting will remove any changes you've made — including added stations, bookings, customers, expenses, and transactions — and restore the original sample data. This action cannot be undone.
              </p>
              <button className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
                <RotateCcw size={14} /> Reset All Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={15} /> {saved ? 'Saved ✓' : 'Save Settings'}
        </button>
      </div>

      {showResetConfirm && (
        <ConfirmDialog
          title="Reset Demo Data?"
          message="This will restore all stations, bookings, customers, sessions, expenses, and transactions to the original seed data. Your setting changes will also be reset."
          confirmLabel="Reset Everything"
          onConfirm={() => { resetDemo(); setForm({ ...settings }); setShowResetConfirm(false); }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}
