// ============================================================
// GameZone OS — Shared Utility Components
// ============================================================

import React, { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import type { Toast } from './context';

// ---- Toast Notifications ----
interface ToastContainerProps {
  toasts: Toast[];
  dismiss: (id: string) => void;
}

export function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  const iconMap = {
    success: <CheckCircle size={16} />,
    error: <AlertCircle size={16} />,
    warning: <AlertTriangle size={16} />,
    info: <Info size={16} />,
  };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast" role="alert">
          <div className={`toast-icon ${t.type}`}>{iconMap[t.type]}</div>
          <div className="toast-content">
            <div className="toast-title">{t.title}</div>
            {t.message && <div className="toast-message">{t.message}</div>}
          </div>
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---- Confirm Dialog ----
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', confirmVariant = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  useEscClose(onCancel);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-sm confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="modal-header">
          <h2 className="modal-title" id="confirm-title">{title}</h2>
          <button className="modal-close" onClick={onCancel} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Modal Wrapper ----
interface ModalProps {
  title: string;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ title, onClose, size = 'md', footer, children }: ModalProps) {
  useEscClose(onClose);

  const sizeClass = size === 'sm' ? 'modal-sm' : size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : '';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${sizeClass}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ---- Hooks ----
export function useEscClose(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

// ---- Page header component ----
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: string[];
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        {breadcrumb && breadcrumb.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />}
                <span style={{ fontSize: 'var(--font-size-xs)', color: i === breadcrumb.length - 1 ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

// ---- Empty State ----
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
      {action}
    </div>
  );
}

// ---- KPI Card ----
interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: 'violet' | 'blue' | 'green' | 'orange' | 'red' | 'cyan';
  change?: { value: string; direction: 'up' | 'down' };
  subtext?: string;
}

export function KpiCard({ label, value, icon, iconColor = 'violet', change, subtext }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <div className={`kpi-icon ${iconColor}`}>{icon}</div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-meta">
        {change && (
          <span className={`kpi-change ${change.direction}`}>
            {change.direction === 'up' ? '↑' : '↓'} {change.value}
          </span>
        )}
        {subtext && <span>{subtext}</span>}
      </div>
    </div>
  );
}

// ---- Badge ----
interface BadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
}

export function StatusBadge({ status, label, dot = true }: BadgeProps) {
  const labels: Record<string, string> = {
    available: 'Available', occupied: 'Occupied', reserved: 'Reserved', maintenance: 'Maintenance',
    confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', completed: 'Completed',
    'checked-in': 'Checked In', 'no-show': 'No Show',
    active: 'Active', paused: 'Paused', ended: 'Ended',
    gold: 'Gold', silver: 'Silver', bronze: 'Bronze',
  };

  const displayLabel = label ?? labels[status] ?? status;
  const cssClass = status.replace(/[^a-z0-9]/gi, '-').toLowerCase();

  return (
    <span className={`badge ${cssClass}`}>
      {dot && <span className="badge-dot" />}
      {displayLabel}
    </span>
  );
}

// ---- Currency formatter ----
export function formatCurrency(amount: number, symbol = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ---- Duration formatter ----
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDurationShort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ---- Date helpers ----
export function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDateTime(isoStr: string): string {
  return `${formatDate(isoStr)}, ${formatTime(isoStr)}`;
}

// ---- Billing calculation ----
export function calcSessionTimeCharge(session: { startTime: string; endTime?: string; pausedDuration: number; ratePerHour: number; status: string }): number {
  const end = session.endTime ? new Date(session.endTime) : new Date();
  const start = new Date(session.startTime);
  const activeMs = Math.max(0, (end.getTime() - start.getTime()) - session.pausedDuration);
  const hours = activeMs / 3600_000;
  return Math.ceil(hours * session.ratePerHour * 100) / 100;
}

export function calcSessionAddonsTotal(session: { addons?: { price: number; quantity: number }[] }): number {
  if (!session.addons || session.addons.length === 0) return 0;
  return session.addons.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calcSessionCharge(session: {
  startTime: string;
  endTime?: string;
  pausedDuration: number;
  ratePerHour: number;
  status: string;
  addons?: { price: number; quantity: number }[];
}): number {
  const timeCharge = calcSessionTimeCharge(session);
  const addonsCharge = calcSessionAddonsTotal(session);
  return Math.round((timeCharge + addonsCharge) * 100) / 100;
}

// ---- Station type display ----
export const STATION_TYPE_LABELS: Record<string, string> = {
  ps5: 'PlayStation 5', xbox: 'Xbox', pc: 'Gaming PC', racing: 'Racing Sim', vr: 'VR Station',
};

export const STATION_TYPE_ICONS: Record<string, string> = {
  ps5: '🎮', xbox: '🕹️', pc: '💻', racing: '🏎️', vr: '🥽',
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  rent: 'Rent', electricity: 'Electricity', internet: 'Internet', maintenance: 'Maintenance',
  supplies: 'Supplies', staff: 'Staff', marketing: 'Marketing', other: 'Other',
};

// ---- Number input ----
interface NumberInputProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

export function NumberInput({ value, min = 0, max = 99, onChange }: NumberInputProps) {
  return (
    <div className="number-input">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  );
}

// ---- Search input ----
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: SearchInputProps) {
  return (
    <div className="search-input-sm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

// ---- CSV export utility ----
export function exportCSV(filename: string, headers: string[], rows: (string | number | undefined)[][]): void {
  const escape = (v: string | number | undefined) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const content = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ---- Simple line/bar chart using recharts ----
export { default as ChartWrapper } from './ChartWrapper';
