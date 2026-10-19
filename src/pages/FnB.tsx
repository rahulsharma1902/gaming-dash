// ============================================================
// GameZone OS — Food & Beverages (POS) Page
// ============================================================

import React, { useState, useMemo } from 'react';
import { Plus, ShoppingCart, Trash2, Coffee, AlertTriangle, Edit2 } from 'lucide-react';
import { useApp, useSettings } from '../context';
import type { FnBProduct, FnBCategory, OrderItem } from '../types';
import { PageHeader, formatCurrency, NumberInput, EmptyState, SearchInput, Modal, ConfirmDialog } from '../components';
import { makeId } from '../data';

const CATEGORIES: { id: FnBCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'snacks', label: '🍟 Snacks' },
  { id: 'beverages', label: '🥤 Beverages' }, { id: 'meals', label: '🍔 Meals' },
  { id: 'desserts', label: '🍦 Desserts' },
];

type CartItem = OrderItem & { available: boolean };

export default function FnBPage() {
  const { state, dispatch, toast } = useApp();
  const settings = useSettings();
  const [categoryFilter, setCategoryFilter] = useState<FnBCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [editProduct, setEditProduct] = useState<FnBProduct | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<FnBProduct | null>(null);

  const products = useMemo(() => {
    return state.fnbProducts.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [state.fnbProducts, categoryFilter, search]);

  const addToCart = (product: FnBProduct) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id, productName: product.name,
        quantity: 1, unitPrice: product.price, available: product.available,
      }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.productId !== productId));
    } else {
      setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
    }
  };

  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = (paymentMethod: 'cash' | 'upi' | 'card') => {
    if (cart.length === 0) return;
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const orderId = makeId('ord');

    // Build updated products (decrease stock)
    const updatedProducts: FnBProduct[] = cart.map(item => {
      const product = state.fnbProducts.find(p => p.id === item.productId)!;
      return { ...product, stock: Math.max(0, product.stock - item.quantity) };
    });

    const order = {
      id: orderId,
      items: cart.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice })),
      subtotal: cartTotal,
      total: cartTotal,
      status: 'completed' as const,
      createdAt: now,
      paymentMethod,
    };

    const txn = {
      id: makeId('txn'),
      type: 'order' as const,
      description: `F&B Order — ${cart.map(i => `${i.productName} x${i.quantity}`).join(', ')}`,
      amount: cartTotal,
      paymentMethod,
      orderId,
      date: todayStr,
      createdAt: now,
    };

    dispatch({ type: 'COMPLETE_ORDER', payload: { order, transaction: txn, updatedProducts } });
    toast({ type: 'success', title: 'Order completed!', message: `${formatCurrency(cartTotal, settings.currencySymbol)} — ${paymentMethod.toUpperCase()}` });
    setCart([]);
    setShowCheckout(false);
  };

  const lowStockItems = state.fnbProducts.filter(p => p.stock <= p.lowStockThreshold && p.available);

  return (
    <div>
      <PageHeader
        title="Food & Beverages"
        description="Café POS — place orders, manage inventory, and track sales."
        breadcrumb={['GameZone OS', 'Food & Beverages']}
        actions={
          <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowProductModal(true); }}>
            <Plus size={15} /> Add Product
          </button>
        }
      />

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 'var(--space-4)',
          background: 'var(--status-warning-dim)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)', fontSize: 13,
        }}>
          <AlertTriangle size={16} style={{ color: 'var(--status-warning)' }} />
          <span style={{ color: 'var(--status-warning)', fontWeight: 600 }}>Low Stock:</span>
          <span style={{ color: 'var(--text-secondary)' }}>{lowStockItems.map(p => `${p.name} (${p.stock} left)`).join(', ')}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
        {/* Product list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="toolbar" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="filter-group" style={{ flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button key={c.id} className={`filter-btn ${categoryFilter === c.id ? 'active' : ''}`} onClick={() => setCategoryFilter(c.id as FnBCategory | 'all')}>
                  {c.label}
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search menu…" />
          </div>

          {products.length === 0 ? (
            <EmptyState icon={<Coffee size={24} />} title="No products found" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  symbol={settings.currencySymbol}
                  onAdd={() => addToCart(p)}
                  onEdit={() => { setEditProduct(p); setShowProductModal(true); }}
                  onDelete={() => setDeleteProduct(p)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart sidebar */}
        <div style={{ width: 280, flexShrink: 0 }} className="cart-panel">
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + 24px)' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={16} />
                <span className="card-title">Cart</span>
              </div>
              {cartCount > 0 && <span className="badge occupied">{cartCount} items</span>}
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {cart.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
                  Add items from the menu
                </div>
              ) : (
                <div>
                  {cart.map(item => (
                    <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">{item.productName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatCurrency(item.unitPrice, settings.currencySymbol)} each</div>
                      </div>
                      <NumberInput value={item.quantity} min={0} max={20} onChange={q => updateQty(item.productId, q)} />
                    </div>
                  ))}

                  <div style={{ padding: '14px', borderTop: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(cartTotal, settings.currencySymbol)}</span>
                    </div>
                    <button className="btn btn-primary w-full" onClick={() => setShowCheckout(true)}>
                      Proceed to Checkout
                    </button>
                    <button className="btn btn-ghost w-full" style={{ marginTop: 6 }} onClick={() => setCart([])}>
                      Clear Cart
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          total={cartTotal}
          symbol={settings.currencySymbol}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleCheckout}
        />
      )}

      {/* Product form modal */}
      {showProductModal && (
        <ProductFormModal
          product={editProduct}
          onClose={() => setShowProductModal(false)}
          onSave={(p) => {
            dispatch({ type: 'UPSERT_FNB', payload: p });
            toast({ type: 'success', title: editProduct ? 'Product updated' : 'Product added', message: p.name });
            setShowProductModal(false);
          }}
          symbol={settings.currencySymbol}
        />
      )}

      {deleteProduct && (
        <ConfirmDialog
          title="Delete Product?"
          message={`Remove "${deleteProduct.name}" from the menu?`}
          confirmLabel="Delete"
          onConfirm={() => {
            dispatch({ type: 'DELETE_FNB', payload: deleteProduct.id });
            toast({ type: 'success', title: 'Product removed' });
            setDeleteProduct(null);
          }}
          onCancel={() => setDeleteProduct(null)}
        />
      )}
    </div>
  );
}

// ---- Product Card ----
function ProductCard({ product, symbol, onAdd, onEdit, onDelete }: {
  product: FnBProduct; symbol: string;
  onAdd: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const isLowStock = product.stock <= product.lowStockThreshold;
  return (
    <div className="card" style={{ opacity: product.available ? 1 : 0.5 }}>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, textTransform: 'capitalize' }}>{product.category}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-sm btn-ghost btn-icon" onClick={onEdit}><Edit2 size={11} /></button>
            <button className="btn btn-sm btn-ghost btn-icon" onClick={onDelete}><Trash2 size={11} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(product.price, symbol)}</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: isLowStock ? 'var(--status-warning)' : 'var(--text-tertiary)' }}>
              {isLowStock && <AlertTriangle size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />}
              {product.stock} in stock
            </div>
          </div>
        </div>

        <button
          className="btn btn-sm btn-primary w-full"
          onClick={onAdd}
          disabled={!product.available || product.stock === 0}
        >
          + Add to Cart
        </button>
      </div>
    </div>
  );
}

// ---- Checkout Modal ----
function CheckoutModal({ cart, total, symbol, onClose, onConfirm }: {
  cart: CartItem[]; total: number; symbol: string;
  onClose: () => void; onConfirm: (method: 'cash' | 'upi' | 'card') => void;
}) {
  const [method, setMethod] = useState<'cash' | 'upi' | 'card'>('upi');

  return (
    <Modal title="Checkout" onClose={onClose} size="sm"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(method)}>Confirm Sale (Demo)</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          {cart.map(item => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{item.productName} × {item.quantity}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatCurrency(item.unitPrice * item.quantity, symbol)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, fontSize: 15 }}>
            <span style={{ color: 'var(--text-primary)' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)' }}>{formatCurrency(total, symbol)}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Payment Method</label>
          <div className="filter-group">
            {(['cash', 'upi', 'card'] as const).map(m => (
              <button key={m} className={`filter-btn ${method === m ? 'active' : ''}`} onClick={() => setMethod(m)}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          ⚠️ This is a simulated demo sale. No real payment is processed. Stock will decrease in the demo.
        </p>
      </div>
    </Modal>
  );
}

// ---- Product Form Modal ----
function ProductFormModal({ product, onClose, onSave, symbol }: {
  product: FnBProduct | null; onClose: () => void;
  onSave: (p: FnBProduct) => void; symbol: string;
}) {
  const [form, setForm] = useState<Partial<FnBProduct>>(product ?? { category: 'snacks', available: true, stock: 20, lowStockThreshold: 5 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof FnBProduct, v: FnBProduct[keyof FnBProduct]) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => { const ne = { ...e }; delete ne[k]; return ne; }); };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = 'Name is required';
    if (!form.price || form.price <= 0) errs.price = 'Price is required';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      id: product?.id ?? makeId('fnb'),
      name: form.name!.trim(),
      category: form.category as FnBCategory ?? 'snacks',
      price: form.price!,
      stock: form.stock ?? 20,
      lowStockThreshold: form.lowStockThreshold ?? 5,
      available: form.available ?? true,
      description: form.description,
    });
  };

  return (
    <Modal title={product ? 'Edit Product' : 'Add Product'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{product ? 'Save Changes' : 'Add Product'}</button></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Product Name <span className="required">*</span></label>
            <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={form.category ?? 'snacks'} onChange={e => set('category', e.target.value as FnBCategory)}>
              <option value="snacks">Snacks</option>
              <option value="beverages">Beverages</option>
              <option value="meals">Meals</option>
              <option value="desserts">Desserts</option>
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Price ({symbol}) <span className="required">*</span></label>
            <input type="number" className={`form-control ${errors.price ? 'error' : ''}`} value={form.price ?? ''} min={0} onChange={e => set('price', +e.target.value)} />
            {errors.price && <span className="form-error">{errors.price}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Current Stock</label>
            <input type="number" className="form-control" value={form.stock ?? ''} min={0} onChange={e => set('stock', +e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Low Stock Alert Threshold</label>
          <input type="number" className="form-control" value={form.lowStockThreshold ?? ''} min={0} onChange={e => set('lowStockThreshold', +e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="avail" checked={form.available ?? true} onChange={e => set('available', e.target.checked)} />
          <label htmlFor="avail" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Available for ordering</label>
        </div>
      </div>
    </Modal>
  );
}
