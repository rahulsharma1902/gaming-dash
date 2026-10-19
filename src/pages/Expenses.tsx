// ============================================================
// GameZone OS — Expenses Page
// ============================================================

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, TrendingDown } from 'lucide-react';
import { useApp, useSettings } from '../context';
import type { Expense, ExpenseCategory } from '../types';
import { PageHeader, formatCurrency, formatDate, EmptyState, SearchInput, Modal, ConfirmDialog, KpiCard } from '../components';
import { EXPENSE_CATEGORY_LABELS } from '../components';
import { makeId } from '../data';
import ChartWrapper from '../ChartWrapper';

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][];

export default function ExpensesPage() {
  const { state, dispatch, toast } = useApp();
  const settings = useSettings();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    return state.expenses.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (e.date < dateFrom || e.date > dateTo) return false;
      if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [state.expenses, categoryFilter, dateFrom, dateTo, search]);

  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);

  const periodRevenue = useMemo(() => {
    return state.transactions
      .filter(t => t.date >= dateFrom && t.date <= dateTo && t.type !== 'refund')
      .reduce((s, t) => s + t.amount, 0);
  }, [state.transactions, dateFrom, dateTo]);

  const netResult = periodRevenue - totalExpenses;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    filtered.forEach(e => { groups[EXPENSE_CATEGORY_LABELS[e.category]] = (groups[EXPENSE_CATEGORY_LABELS[e.category]] ?? 0) + e.amount; });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Track operating costs and estimate financial performance."
        breadcrumb={['GameZone OS', 'Expenses']}
        actions={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus size={15} /> Add Expense
          </button>
        }
      />

      {/* Period selector */}
      <div className="toolbar" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>From</span>
          <input type="date" className="form-control" style={{ width: 'auto', height: 34 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>To</span>
          <input type="date" className="form-control" style={{ width: 'auto', height: 34 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div className="filter-group" style={{ flexWrap: 'wrap' }}>
          <button className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>All</button>
          {CATEGORIES.map(([id, label]) => (
            <button key={id} className={`filter-btn ${categoryFilter === id ? 'active' : ''}`} onClick={() => setCategoryFilter(id)}>
              {label}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search expenses…" />
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-5)' }}>
        <KpiCard label="Total Expenses" value={formatCurrency(totalExpenses, settings.currencySymbol)} icon={<TrendingDown size={16} />} iconColor="red" subtext="Selected period" />
        <KpiCard label="Revenue" value={formatCurrency(periodRevenue, settings.currencySymbol)} icon={<TrendingDown size={16} />} iconColor="green" subtext="Demo estimate" />
        <KpiCard label="Net Result" value={formatCurrency(netResult, settings.currencySymbol)} icon={<TrendingDown size={16} />} iconColor={netResult >= 0 ? 'green' : 'red'} subtext="Illustrative only" />
        <KpiCard label="Transactions" value={filtered.length} icon={<TrendingDown size={16} />} iconColor="violet" subtext="Expense entries" />
      </div>

      <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Category breakdown chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Expense Breakdown</div>
            <div className="card-subtitle">By category, selected period</div>
          </div>
          <div className="card-body">
            <ChartWrapper type="pie" data={categoryBreakdown} dataKey="value" xKey="name" height={180} showLegend />
          </div>
        </div>

        {/* Category totals */}
        <div className="card">
          <div className="card-header"><div className="card-title">Category Summary</div></div>
          <div className="card-body" style={{ padding: 0 }}>
            {categoryBreakdown.sort((a, b) => b.value - a.value).map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-danger)' }}>{formatCurrency(c.value, settings.currencySymbol)}</span>
              </div>
            ))}
            {categoryBreakdown.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>No expenses in range</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
        ⚠️ Net result is an illustrative estimate using demo sample data. This is not audited financial information.
      </div>

      {/* Expense table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<TrendingDown size={24} />} title="No expenses found" description="Add your first expense or adjust filters." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(exp => (
                <tr key={exp.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{exp.date}</td>
                  <td>
                    <strong>{exp.description}</strong>
                    {exp.notes && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{exp.notes}</div>}
                  </td>
                  <td><span className="tag">{EXPENSE_CATEGORY_LABELS[exp.category]}</span></td>
                  <td style={{ textTransform: 'capitalize' }}>{exp.paymentMethod}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-danger)' }}>
                    {formatCurrency(exp.amount, settings.currencySymbol)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-secondary btn-icon" onClick={() => { setEditing(exp); setShowModal(true); }}><Edit2 size={12} /></button>
                      <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setDeleteConfirm(exp)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showModal && (
        <ExpenseFormModal
          expense={editing}
          onClose={() => setShowModal(false)}
          onSave={(e) => {
            dispatch({ type: 'UPSERT_EXPENSE', payload: e });
            toast({ type: 'success', title: editing ? 'Expense updated' : 'Expense added', message: e.description });
            setShowModal(false);
          }}
          symbol={settings.currencySymbol}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Expense?"
          message={`Delete "${deleteConfirm.description}" (${formatCurrency(deleteConfirm.amount, settings.currencySymbol)})?`}
          confirmLabel="Delete"
          onConfirm={() => {
            dispatch({ type: 'DELETE_EXPENSE', payload: deleteConfirm.id });
            toast({ type: 'success', title: 'Expense deleted' });
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// ---- Expense Form Modal ----
function ExpenseFormModal({ expense, onClose, onSave, symbol }: {
  expense: Expense | null; onClose: () => void;
  onSave: (e: Expense) => void; symbol: string;
}) {
  const [form, setForm] = useState<Partial<Expense>>(expense ?? {
    date: new Date().toISOString().split('T')[0], category: 'other', paymentMethod: 'cash',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof Expense, v: Expense[keyof Expense]) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => { const ne = { ...e }; delete ne[k]; return ne; }); };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.description?.trim()) errs.description = 'Description is required';
    if (!form.amount || form.amount <= 0) errs.amount = 'Amount is required';
    if (!form.date) errs.date = 'Date is required';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      id: expense?.id ?? makeId('exp'),
      date: form.date!,
      category: form.category as ExpenseCategory ?? 'other',
      description: form.description!.trim(),
      amount: form.amount!,
      paymentMethod: form.paymentMethod as Expense['paymentMethod'] ?? 'cash',
      notes: form.notes?.trim() || undefined,
    });
  };

  return (
    <Modal title={expense ? 'Edit Expense' : 'Add Expense'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{expense ? 'Save Changes' : 'Add Expense'}</button></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Date <span className="required">*</span></label>
            <input type="date" className={`form-control ${errors.date ? 'error' : ''}`} value={form.date ?? ''} onChange={e => set('date', e.target.value)} />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={form.category ?? 'other'} onChange={e => set('category', e.target.value as ExpenseCategory)}>
              {CATEGORIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description <span className="required">*</span></label>
          <input className={`form-control ${errors.description ? 'error' : ''}`} value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="What was this for?" />
          {errors.description && <span className="form-error">{errors.description}</span>}
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Amount ({symbol}) <span className="required">*</span></label>
            <input type="number" className={`form-control ${errors.amount ? 'error' : ''}`} value={form.amount ?? ''} min={0} onChange={e => set('amount', +e.target.value)} />
            {errors.amount && <span className="form-error">{errors.amount}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-control" value={form.paymentMethod ?? 'cash'} onChange={e => set('paymentMethod', e.target.value as Expense['paymentMethod'])}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-control" value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Optional reference or notes" />
        </div>
      </div>
    </Modal>
  );
}
