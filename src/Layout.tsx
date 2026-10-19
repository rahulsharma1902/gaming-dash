// ============================================================
// GameZone OS — Layout: Sidebar, Topbar, Shell
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Monitor, CalendarDays, Users, DollarSign,
  Coffee, TrendingDown, BarChart3, Globe, Settings, Menu, X,
  Bell, Search, ChevronDown, RotateCcw, Sun, Moon,
} from 'lucide-react';
import { useApp, useSettings } from './context';
import { ToastContainer } from './components';
import type { PageId } from './App';

interface NavItemDef {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  section?: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} />, section: 'Main' },
  { id: 'stations', label: 'Stations & Sessions', icon: <Monitor size={18} /> },
  { id: 'bookings', label: 'Bookings', icon: <CalendarDays size={18} /> },
  { id: 'customers', label: 'Customers', icon: <Users size={18} /> },
  { id: 'pricing', label: 'Pricing & Packages', icon: <DollarSign size={18} />, section: 'Operations' },
  { id: 'fnb', label: 'Food & Beverages', icon: <Coffee size={18} /> },
  { id: 'expenses', label: 'Expenses', icon: <TrendingDown size={18} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} />, section: 'Insights' },
  { id: 'website', label: 'Website Preview', icon: <Globe size={18} />, section: 'Tools' },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

interface LayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
}

export function Layout({ currentPage, onNavigate, children, globalSearch, setGlobalSearch }: LayoutProps) {
  const { toasts, dismissToast, state, dispatch, resetDemo } = useApp();
  const settings = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Sync theme attribute to document root
  useEffect(() => {
    const t = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  }, [settings.theme]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Maintenance alerts
  const maintenanceCount = state.stations.filter(s => s.status === 'maintenance').length;
  const activeSessionCount = state.sessions.filter(s => s.status === 'active').length;
  const upcomingBookings = state.bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;

  const notifications = [
    maintenanceCount > 0 && { title: `${maintenanceCount} station(s) under maintenance`, sub: 'Check the Stations page', icon: '🔧' },
    { title: `${activeSessionCount} active gaming sessions`, sub: 'Live now', icon: '🟢' },
    { title: `${upcomingBookings} upcoming bookings`, sub: 'View in Bookings', icon: '📅' },
  ].filter(Boolean);

  const currentNav = NAV_ITEMS.find(n => n.id === currentPage);
  let prevSection = '';

  const isDark = settings.theme === 'premium-neon' || settings.theme === 'dark' || !settings.theme;
  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: next } });
  };

  return (
    <div className="app-shell" data-theme={settings.theme || 'dark'}>
      {/* Sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">GZ</div>
          <div className="brand-text">
            <span className="brand-name">GameZone OS</span>
            <span className="brand-subtitle">{settings.monogram} · Demo</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(item => {
            const showSection = item.section && item.section !== prevSection;
            if (item.section) prevSection = item.section;
            return (
              <React.Fragment key={item.id}>
                {showSection && <div className="nav-section-label">{item.section}</div>}
                <button
                  className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                  aria-current={currentPage === item.id ? 'page' : undefined}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                  {item.id === 'stations' && maintenanceCount > 0 && (
                    <span className="nav-badge">{maintenanceCount}</span>
                  )}
                  {item.id === 'bookings' && upcomingBookings > 0 && (
                    <span className="nav-badge">{upcomingBookings}</span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="demo-banner">
            ⚡ Local Demo — Data stored in this browser session only
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>

            {/* Desktop Breadcrumb */}
            <nav className="page-breadcrumb hide-mobile" aria-label="Breadcrumb">
              <span>GameZone OS</span>
              <span className="breadcrumb-sep">›</span>
              <span className="crumb-current">{currentNav?.label ?? 'Overview'}</span>
            </nav>

            {/* Mobile Page Title */}
            <div className="mobile-page-title show-mobile">
              <span>{currentNav?.label ?? 'Overview'}</span>
            </div>

            {/* Global search */}
            <div className="search-bar hide-mobile" role="search">
              <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <input
                type="search"
                placeholder="Search stations, customers, bookings…"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                aria-label="Global search"
              />
            </div>
          </div>

          <div className="topbar-actions">
            {/* Theme Toggle - unified as topbar-btn */}
            <button
              className="topbar-btn"
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Public Website Preview Button (Desktop/Tablet) */}
            <button
              className="btn btn-secondary btn-sm hide-mobile"
              onClick={() => onNavigate('website')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              title="Preview Customer Website"
            >
              <Globe size={13} />
              <span>Public Website</span>
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="topbar-btn"
                onClick={() => setShowNotifs(v => !v)}
                aria-label="Notifications"
                aria-expanded={showNotifs}
              >
                <Bell size={16} />
                {maintenanceCount > 0 && <span className="notif-dot" />}
              </button>
              {showNotifs && (
                <div className="dropdown notif-dropdown" style={{ right: 0 }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Alerts & Activity
                  </div>
                  {(notifications as { title: string; sub: string; icon: string }[]).map((n, i) => (
                    <div key={i} className="dropdown-item">
                      <span style={{ fontSize: 18 }}>{n.icon}</span>
                      <div>
                        <div className="dropdown-item-title">{n.title}</div>
                        <div className="dropdown-item-sub">{n.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                className="profile-btn"
                onClick={() => setShowProfile(v => !v)}
                aria-label="Profile menu"
                aria-expanded={showProfile}
              >
                <div className="avatar-sm">{settings.monogram[0]}</div>
                <span className="profile-name hide-mobile" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {settings.name.split(' ')[0]}
                </span>
                <ChevronDown size={12} className="hide-mobile" style={{ color: 'var(--text-tertiary)' }} />
              </button>
              {showProfile && (
                <div className="dropdown profile-dropdown" style={{ right: 0 }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{settings.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Owner · Demo Account</div>
                  </div>
                  <div className="dropdown-item show-mobile" onClick={() => { onNavigate('website'); setShowProfile(false); }}>
                    <Globe size={14} />
                    <div>
                      <div className="dropdown-item-title">Public Website Preview</div>
                    </div>
                  </div>
                  <div className="dropdown-item" onClick={() => { onNavigate('settings'); setShowProfile(false); }}>
                    <Settings size={14} />
                    <div>
                      <div className="dropdown-item-title">Settings</div>
                    </div>
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => { setShowProfile(false); setShowResetConfirm(true); }}
                    style={{ color: 'var(--status-danger)' }}
                  >
                    <RotateCcw size={14} />
                    <div>
                      <div className="dropdown-item-title" style={{ color: 'var(--status-danger)' }}>Reset Demo Data</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content" id="main-content">
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} dismiss={dismissToast} />

      {/* Reset confirm dialog */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal modal-sm confirm-dialog" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2 className="modal-title">Reset Demo Data?</h2>
              <button className="modal-close" onClick={() => setShowResetConfirm(false)} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p>This will restore all sample data to its original state. Any changes you've made — stations, bookings, customers, sessions — will be lost.</p>
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>This only affects data in this browser tab session.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { resetDemo(); setShowResetConfirm(false); }}>
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
