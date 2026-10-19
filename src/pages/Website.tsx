// ============================================================
// GameZone OS — Public Website Preview Page
// ============================================================

import React, { useState } from 'react';
import { ExternalLink, X, ChevronDown } from 'lucide-react';
import { useApp, useSettings } from '../context';
import { PageHeader, formatCurrency, STATION_TYPE_LABELS, STATION_TYPE_ICONS } from '../components';
import { makeId } from '../data';

export default function WebsitePage() {
  const { state, dispatch, toast } = useApp();
  const settings = useSettings();
  const [showSite, setShowSite] = useState(false);

  if (showSite) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#0a0c10', overflowY: 'auto' }}>
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 600 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowSite(false)}
            style={{ background: 'rgba(26,30,40,0.9)', backdropFilter: 'blur(8px)' }}
          >
            <X size={14} /> Exit Preview
          </button>
        </div>
        <PublicWebsite settings={settings} packages={state.packages} pricingRules={state.pricingRules} onBooking={(bk) => {
          dispatch({ type: 'UPSERT_BOOKING', payload: bk });
          toast({ type: 'success', title: 'Booking enquiry submitted!', message: 'This is a demo — no real confirmation is sent.' });
        }} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Website Preview"
        description="Preview the public-facing website for Pixel Arena Gaming Lounge."
        breadcrumb={['GameZone OS', 'Website Preview']}
        actions={
          <button className="btn btn-primary" onClick={() => setShowSite(true)}>
            <ExternalLink size={15} /> Preview Website
          </button>
        }
      />

      <div style={{ marginBottom: 'var(--space-5)', padding: '12px 16px', background: 'var(--status-info-dim)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--status-info)' }}>
        ℹ️ The website preview reflects your current business settings — name, hours, pricing, and packages are pulled from the Settings and Pricing pages. Changes update the site. No real domain is configured.
      </div>

      {/* Website features list */}
      <div className="grid-2">
        {[
          { title: 'Hero Section', desc: 'Business name, tagline, and a primary CTA booking button.' },
          { title: 'Station Types', desc: 'Display of all available gaming stations — PS5, Xbox, PCs, Racing, VR.' },
          { title: 'Pricing & Packages', desc: 'Live pricing from your configured rates and active packages.' },
          { title: 'Opening Hours', desc: 'Your set business hours pulled from Settings.' },
          { title: 'Gallery', desc: 'Visual showcase of your gaming floor areas.' },
          { title: 'Contact & Location', desc: 'Address, phone, and map placeholder from Settings.' },
          { title: 'FAQ', desc: 'Common questions about the gaming centre.' },
          { title: 'Booking Form', desc: 'Enquiry form that creates a demo booking request.' },
        ].map((f, i) => (
          <div key={i} style={{
            padding: 'var(--space-4)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>✓ {f.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
        <button className="btn btn-primary btn-lg" onClick={() => setShowSite(true)}>
          <ExternalLink size={16} /> Open Full Website Preview
        </button>
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
          Preview opens in the same browser window. Use "Exit Preview" to return.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Public Website Component
// ============================================================

function PublicWebsite({ settings, packages, pricingRules, onBooking }: {
  settings: ReturnType<typeof useSettings>;
  packages: import('../types').Package[];
  pricingRules: import('../types').PricingRule[];
  onBooking: (b: import('../types').Booking) => void;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const stationTypes = [
    { type: 'ps5', color: '#003791', gradient: 'linear-gradient(135deg, #003791 0%, #0070cc 100%)' },
    { type: 'xbox', color: '#107c10', gradient: 'linear-gradient(135deg, #107c10 0%, #52b043 100%)' },
    { type: 'pc', color: '#7c5cfc', gradient: 'linear-gradient(135deg, #7c5cfc 0%, #3b82f6 100%)' },
    { type: 'racing', color: '#e11d48', gradient: 'linear-gradient(135deg, #e11d48 0%, #f97316 100%)' },
    { type: 'vr', color: '#0891b2', gradient: 'linear-gradient(135deg, #0891b2 0%, #7c5cfc 100%)' },
  ];

  const activePackages = packages.filter(p => p.active);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setNavOpen(false);
    setActiveSection(id);
  };

  return (
    <div className="public-site">
      {/* Sticky Nav */}
      <nav className="public-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: 'linear-gradient(135deg, #7c5cfc, #3b82f6)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, color: '#fff',
          }}>PA</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#e8eaf0' }}>{settings.name}</div>
            <div style={{ fontSize: 11, color: '#5a6380' }}>{settings.tagline}</div>
          </div>
        </div>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }} className="public-nav-links">
          {[['home', 'Home'], ['stations', 'Stations'], ['pricing', 'Pricing'], ['gallery', 'Gallery'], ['contact', 'Contact']].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: '#8892aa', fontSize: 14, cursor: 'pointer', transition: 'color 150ms' }}
              onMouseEnter={e => (e.target as HTMLButtonElement).style.color = '#e8eaf0'}
              onMouseLeave={e => (e.target as HTMLButtonElement).style.color = '#8892aa'}
            >{label}</button>
          ))}
          <button
            className="btn btn-primary"
            style={{ height: 36, fontSize: 13 }}
            onClick={() => setShowBookingForm(true)}
          >Book Now</button>
        </div>
      </nav>

      {/* Hero */}
      <section id="home" className="public-hero" style={{ minHeight: '90vh' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.25)', borderRadius: 999, fontSize: 12, color: '#a78bfa', marginBottom: 24, fontWeight: 500 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            Now Open · {settings.openingHours.monday?.open} – {settings.openingHours.saturday?.close}
          </div>

          <h1 className="hero-title">
            {settings.name.split(' ').slice(0, 2).join(' ')}<br />
            <span className="hero-accent">{settings.name.split(' ').slice(2).join(' ') || 'Gaming Lounge'}</span>
          </h1>

          <p style={{ fontSize: 18, color: '#8892aa', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
            {settings.tagline}. Premium gaming stations, café, and event space in the heart of Bengaluru.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ height: 48, fontSize: 15, padding: '0 28px' }}
              onClick={() => setShowBookingForm(true)}
            >
              Reserve a Station
            </button>
            <button
              className="btn btn-secondary"
              style={{ height: 48, fontSize: 15, padding: '0 28px' }}
              onClick={() => scrollTo('stations')}
            >
              View Stations
            </button>
          </div>

          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
            {[['11+', 'Gaming Stations'], ['360Hz', 'PC Monitors'], ['4K OLED', 'Console Displays'], ['5G', 'Low-Latency Net']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#e8eaf0', letterSpacing: '-0.5px' }}>{val}</div>
                <div style={{ fontSize: 12, color: '#5a6380', marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stations */}
      <section id="stations" style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader label="Gaming Floor" title="Choose Your Setup" sub="Each station is designed for a specific style of play. Pick yours." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginTop: 40 }}>
          {stationTypes.map(({ type, gradient }) => {
            const rule = pricingRules.find(r => r.stationType === type);
            return (
              <div key={type} style={{
                background: 'rgba(26,30,40,0.8)', border: '1px solid #1e2230', borderRadius: 16,
                overflow: 'hidden', transition: 'transform 200ms ease, border-color 200ms ease', cursor: 'default',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#333a50'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.borderColor = '#1e2230'; }}
              >
                <div style={{ height: 80, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                  {STATION_TYPE_ICONS[type]}
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#e8eaf0' }}>{STATION_TYPE_LABELS[type]}</div>
                  {rule && (
                    <div style={{ fontSize: 13, color: '#8892aa', marginTop: 4 }}>
                      From <strong style={{ color: '#a78bfa' }}>₹{rule.weekdayRate}/hr</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '80px 40px', background: 'rgba(26,30,40,0.5)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader label="Pricing" title="Simple, Transparent Rates" sub="No hidden fees. Pay only for the time you play." />

          {/* Hourly rates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginTop: 40, marginBottom: 48 }}>
            {pricingRules.filter(r => r.enabled).map(rule => (
              <div key={rule.id} style={{ padding: '20px', background: '#13161e', border: '1px solid #1e2230', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{STATION_TYPE_ICONS[rule.stationType]}</div>
                <div style={{ fontSize: 13, color: '#5a6380', marginBottom: 4 }}>{STATION_TYPE_LABELS[rule.stationType]}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#e8eaf0' }}>₹{rule.weekdayRate}/hr</div>
                {rule.weekdayRate !== rule.weekendRate && (
                  <div style={{ fontSize: 11, color: '#7c5cfc', marginTop: 4 }}>₹{rule.weekendRate}/hr weekends</div>
                )}
              </div>
            ))}
          </div>

          {/* Packages */}
          {activePackages.length > 0 && (
            <>
              <h3 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#e8eaf0', marginBottom: 24 }}>Gaming Packages</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {activePackages.map(pkg => (
                  <div key={pkg.id} style={{ padding: '24px', background: '#13161e', border: '1px solid #252a3a', borderRadius: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#e8eaf0', marginBottom: 6 }}>{pkg.name}</div>
                    <div style={{ fontSize: 13, color: '#5a6380', marginBottom: 14 }}>{pkg.description}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: '#e8eaf0' }}>₹{pkg.price}</span>
                      {pkg.savings && <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Save ₹{pkg.savings}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#5a6380' }}>
                      {pkg.durationMinutes >= 60 ? `${pkg.durationMinutes / 60}h` : `${pkg.durationMinutes}m`}
                      {pkg.stationType !== 'any' && ` · ${STATION_TYPE_LABELS[pkg.stationType]}`}
                      {pkg.maxPersons && ` · Up to ${pkg.maxPersons} players`}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader label="Gallery" title="The Experience" sub="Premium gaming setup designed for performance and comfort." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 40 }}>
          {[
            { bg: 'linear-gradient(135deg, #0d1b4f 0%, #1e3a8a 100%)', label: 'Console Zone', icon: '🎮' },
            { bg: 'linear-gradient(135deg, #1a1e28 0%, #2d3748 100%)', label: 'PC Battlestations', icon: '💻' },
            { bg: 'linear-gradient(135deg, #2d1b69 0%, #4c1d95 100%)', label: 'VR Arena', icon: '🥽' },
            { bg: 'linear-gradient(135deg, #1a0a00 0%, #7c2d12 100%)', label: 'Racing Simulator', icon: '🏎️' },
            { bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 100%)', label: 'Café Corner', icon: '☕' },
            { bg: 'linear-gradient(135deg, #0a0c10 0%, #1a1e28 100%)', label: 'Lounge Area', icon: '🛋️' },
          ].map((item, i) => (
            <div key={i} style={{
              background: item.bg, borderRadius: 12, aspectRatio: '16/10',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, border: '1px solid rgba(255,255,255,0.05)',
              fontSize: 40, cursor: 'default',
            }}>
              {item.icon}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Hours + Contact */}
      <section id="contact" style={{ padding: '80px 40px', background: 'rgba(26,30,40,0.5)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader label="Visit Us" title="Opening Hours & Location" sub="Walk-in welcome. Bookings recommended for weekends." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40 }}>
            {/* Hours */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0', marginBottom: 20 }}>Business Hours</h3>
              {Object.entries(settings.openingHours).map(([day, hours]) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e2230', fontSize: 13 }}>
                  <span style={{ color: '#8892aa', textTransform: 'capitalize' }}>{day}</span>
                  <span style={{ color: hours.closed ? '#ef4444' : '#e8eaf0', fontWeight: 500 }}>
                    {hours.closed ? 'Closed' : `${hours.open} – ${hours.close}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0', marginBottom: 20 }}>Contact</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <InfoRow icon="📍" label="Address" value={settings.address} />
                <InfoRow icon="📞" label="Phone" value={settings.phone} />
                <InfoRow icon="✉️" label="Email" value={settings.email} />
              </div>

              <div style={{ marginTop: 28 }}>
                <button
                  className="btn btn-primary"
                  style={{ height: 44, fontSize: 14, width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowBookingForm(true)}
                >
                  Send a Booking Enquiry
                </button>
                <p style={{ fontSize: 11, color: '#5a6380', marginTop: 8, textAlign: 'center' }}>
                  Demo only — no real booking confirmation is sent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 40px', maxWidth: 800, margin: '0 auto' }}>
        <SectionHeader label="FAQ" title="Common Questions" sub="" />
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { q: 'Do I need to book in advance?', a: 'Walk-ins are welcome for weekdays. Weekend bookings are highly recommended as stations fill up quickly.' },
            { q: 'What do I need to bring?', a: 'Just yourself! All equipment — controllers, headsets, and gaming peripherals — are provided.' },
            { q: 'Is food and beverage available?', a: 'Yes! We have a café with snacks, beverages, and light meals available during all operating hours.' },
            { q: 'Can I book for a group or birthday?', a: 'Absolutely. We offer group packages and can arrange private gaming events. Contact us for details.' },
            { q: 'What is your cancellation policy?', a: 'Bookings can be cancelled up to 2 hours before the start time without any charge.' },
          ].map((faq, i) => <FaqItem key={i} {...faq} />)}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px', background: '#0a0c10', borderTop: '1px solid #1e2230', textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0', marginBottom: 4 }}>{settings.name}</div>
        <div style={{ fontSize: 12, color: '#5a6380' }}>{settings.address}</div>
        <div style={{ fontSize: 11, color: '#5a6380', marginTop: 16 }}>
          © {new Date().getFullYear()} {settings.name}. Website preview — GameZone OS Demo.
        </div>
      </footer>

      {/* Booking modal */}
      {showBookingForm && (
        <PublicBookingForm
          onClose={() => setShowBookingForm(false)}
          onSubmit={onBooking}
        />
      )}
    </div>
  );
}

function SectionHeader({ label, title, sub }: { label: string; title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#7c5cfc', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{label}</div>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#e8eaf0', letterSpacing: '-0.5px', marginBottom: 10 }}>{title}</h2>
      {sub && <p style={{ fontSize: 15, color: '#5a6380', maxWidth: 500, margin: '0 auto' }}>{sub}</p>}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: '#5a6380', fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: '#8892aa' }}>{value}</div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: '#13161e', border: '1px solid #1e2230', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          fontSize: 14, fontWeight: 600, color: '#e8eaf0', textAlign: 'left', fontFamily: 'Inter, sans-serif',
        }}
      >
        {q}
        <ChevronDown size={16} style={{ color: '#5a6380', transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : '' }} />
      </button>
      {open && <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#8892aa', lineHeight: 1.6 }}>{a}</div>}
    </div>
  );
}

function PublicBookingForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (b: import('../types').Booking) => void }) {
  const [form, setForm] = useState({ name: '', phone: '', stationType: 'ps5', date: '', time: '14:00', duration: 60, notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const set = (k: string, v: string | number) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => { const n = { ...e }; delete n[k]; return n; }); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.phone.trim()) e.phone = 'Phone required';
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter 10-digit number';
    if (!form.date) e.date = 'Date required';
    if (form.date && form.date < todayStr) e.date = 'Cannot book past dates';
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const base: Record<string, number> = { ps5: 120, xbox: 100, pc: 80, racing: 200, vr: 250 };
    const price = Math.round((base[form.stationType] ?? 100) * form.duration / 60);
    onSubmit({
      id: makeId('bk'),
      customerName: form.name.trim(),
      phone: form.phone.trim(),
      stationType: form.stationType as import('../types').StationType,
      date: form.date,
      startTime: form.time,
      durationMinutes: form.duration,
      quotedPrice: price,
      status: 'pending',
      notes: form.notes || undefined,
      createdAt: new Date().toISOString(),
    });
    setSubmitted(true);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,15,20,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#13161e', border: '1px solid #252a3a', borderRadius: 16, width: '100%', maxWidth: 480, padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e8eaf0', marginBottom: 8 }}>Enquiry Received!</h2>
            <p style={{ fontSize: 14, color: '#8892aa', marginBottom: 20 }}>
              This is a demo — no real confirmation has been sent. Your booking request has been added to the demo system.
            </p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e8eaf0' }}>Book a Station</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8892aa', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Your Name <span className="required">*</span></label>
                <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone <span className="required">*</span></label>
                <input className={`form-control ${errors.phone ? 'error' : ''}`} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit number" />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Station Type</label>
                  <select className="form-control" value={form.stationType} onChange={e => set('stationType', e.target.value)}>
                    <option value="ps5">PS5</option>
                    <option value="xbox">Xbox</option>
                    <option value="pc">Gaming PC</option>
                    <option value="racing">Racing Sim</option>
                    <option value="vr">VR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select className="form-control" value={form.duration} onChange={e => set('duration', +e.target.value)}>
                    {[60, 120, 180, 240].map(d => <option key={d} value={d}>{d / 60}h</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Date <span className="required">*</span></label>
                  <input type="date" className={`form-control ${errors.date ? 'error' : ''}`} value={form.date} min={todayStr} onChange={e => set('date', e.target.value)} />
                  {errors.date && <span className="form-error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Time</label>
                  <input type="time" className="form-control" value={form.time} onChange={e => set('time', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Special requests, group size…" />
              </div>
              <p style={{ fontSize: 11, color: '#5a6380' }}>
                This is a demo booking form. No real confirmation will be sent. Data is stored locally.
              </p>
              <button className="btn btn-primary" style={{ height: 44, fontSize: 14 }} onClick={handleSubmit}>
                Submit Enquiry
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
