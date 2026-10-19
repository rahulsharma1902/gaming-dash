// ============================================================
// GameZone OS — App Context (global state management)
// ============================================================

import React, { createContext, useContext, useCallback, useEffect, useReducer } from 'react';
import type { AppState, Station, Session, SessionAddon, Booking, Customer, FnBProduct, Order, Expense, Transaction, BusinessSettings, Package, PricingRule } from './types';
import { loadState, saveState, resetState, STORAGE_KEY } from './data';

// ---- Toast system ----
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface AppContextValue {
  state: AppState;
  toasts: Toast[];
  dispatch: React.Dispatch<Action>;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  resetDemo: () => void;
}

// ---- Actions ----
type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'UPSERT_STATION'; payload: Station }
  | { type: 'DELETE_STATION'; payload: string }
  | { type: 'UPSERT_SESSION'; payload: Session }
  | { type: 'END_SESSION'; payload: { sessionId: string; endTime: string; transaction: Transaction } }
  | { type: 'ADD_SESSION_ADDON'; payload: { sessionId: string; addon: SessionAddon } }
  | { type: 'REMOVE_SESSION_ADDON'; payload: { sessionId: string; addonId: string } }
  | { type: 'UPDATE_SESSION_ADDON_QTY'; payload: { sessionId: string; addonId: string; quantity: number } }
  | { type: 'UPSERT_BOOKING'; payload: Booking }
  | { type: 'DELETE_BOOKING'; payload: string }
  | { type: 'UPSERT_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'UPSERT_PRICING'; payload: PricingRule }
  | { type: 'UPSERT_PACKAGE'; payload: Package }
  | { type: 'DELETE_PACKAGE'; payload: string }
  | { type: 'UPSERT_FNB'; payload: FnBProduct }
  | { type: 'DELETE_FNB'; payload: string }
  | { type: 'COMPLETE_ORDER'; payload: { order: Order; transaction: Transaction; updatedProducts: FnBProduct[] } }
  | { type: 'UPSERT_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<BusinessSettings> };

function reducer(state: AppState, action: Action): AppState {
  let next: AppState;
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'UPSERT_STATION': {
      const exists = state.stations.find(s => s.id === action.payload.id);
      next = {
        ...state,
        stations: exists
          ? state.stations.map(s => s.id === action.payload.id ? action.payload : s)
          : [...state.stations, action.payload],
      };
      break;
    }

    case 'DELETE_STATION':
      next = { ...state, stations: state.stations.filter(s => s.id !== action.payload) };
      break;

    case 'UPSERT_SESSION': {
      const exists = state.sessions.find(s => s.id === action.payload.id);
      const newSessions = exists
        ? state.sessions.map(s => s.id === action.payload.id ? action.payload : s)
        : [...state.sessions, action.payload];

      // Update station status
      const stationId = action.payload.stationId;
      const newStations = state.stations.map(st => {
        if (st.id !== stationId) return st;
        let status = st.status;
        if (action.payload.status === 'active' || action.payload.status === 'paused') {
          status = 'occupied';
        }
        return { ...st, status };
      });

      next = { ...state, sessions: newSessions, stations: newStations };
      break;
    }

    case 'END_SESSION': {
      const { sessionId, endTime, transaction } = action.payload;
      const session = state.sessions.find(s => s.id === sessionId);
      const newSessions = state.sessions.map(s =>
        s.id === sessionId ? { ...s, status: 'ended' as const, endTime } : s
      );
      // Free station
      const newStations = session
        ? state.stations.map(st => {
            if (st.id !== session.stationId) return st;
            return { ...st, status: 'available' as const };
          })
        : state.stations;

      next = {
        ...state,
        sessions: newSessions,
        stations: newStations,
        transactions: [...state.transactions, transaction],
      };
      break;
    }

    case 'ADD_SESSION_ADDON': {
      const { sessionId, addon } = action.payload;
      const targetSession = state.sessions.find(s => s.id === sessionId);
      if (!targetSession) return state;

      const currentAddons = targetSession.addons || [];
      const existingIdx = currentAddons.findIndex(a =>
        (addon.productId && a.productId === addon.productId) ||
        (a.name.toLowerCase() === addon.name.toLowerCase() && a.price === addon.price)
      );

      let newAddons: SessionAddon[];
      if (existingIdx >= 0) {
        newAddons = currentAddons.map((a, i) =>
          i === existingIdx ? { ...a, quantity: a.quantity + addon.quantity } : a
        );
      } else {
        newAddons = [...currentAddons, addon];
      }

      // Decrement stock if linked to FnB product
      const newProducts = addon.productId
        ? state.fnbProducts.map(p =>
            p.id === addon.productId ? { ...p, stock: Math.max(0, p.stock - addon.quantity) } : p
          )
        : state.fnbProducts;

      next = {
        ...state,
        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, addons: newAddons } : s),
        fnbProducts: newProducts,
      };
      break;
    }

    case 'REMOVE_SESSION_ADDON': {
      const { sessionId, addonId } = action.payload;
      const targetSession = state.sessions.find(s => s.id === sessionId);
      if (!targetSession) return state;

      const removed = targetSession.addons?.find(a => a.id === addonId);
      const newAddons = (targetSession.addons || []).filter(a => a.id !== addonId);

      // Restore stock if product linked
      const newProducts = (removed && removed.productId)
        ? state.fnbProducts.map(p =>
            p.id === removed.productId ? { ...p, stock: p.stock + removed.quantity } : p
          )
        : state.fnbProducts;

      next = {
        ...state,
        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, addons: newAddons } : s),
        fnbProducts: newProducts,
      };
      break;
    }

    case 'UPDATE_SESSION_ADDON_QTY': {
      const { sessionId, addonId, quantity } = action.payload;
      const targetSession = state.sessions.find(s => s.id === sessionId);
      if (!targetSession) return state;

      if (quantity <= 0) {
        const removed = targetSession.addons?.find(a => a.id === addonId);
        const newAddons = (targetSession.addons || []).filter(a => a.id !== addonId);
        const newProducts = (removed && removed.productId)
          ? state.fnbProducts.map(p =>
              p.id === removed.productId ? { ...p, stock: p.stock + removed.quantity } : p
            )
          : state.fnbProducts;
        next = {
          ...state,
          sessions: state.sessions.map(s => s.id === sessionId ? { ...s, addons: newAddons } : s),
          fnbProducts: newProducts,
        };
      } else {
        const item = targetSession.addons?.find(a => a.id === addonId);
        const delta = item ? quantity - item.quantity : 0;
        const newAddons = (targetSession.addons || []).map(a =>
          a.id === addonId ? { ...a, quantity } : a
        );
        const newProducts = (item && item.productId && delta !== 0)
          ? state.fnbProducts.map(p =>
              p.id === item.productId ? { ...p, stock: Math.max(0, p.stock - delta) } : p
            )
          : state.fnbProducts;
        next = {
          ...state,
          sessions: state.sessions.map(s => s.id === sessionId ? { ...s, addons: newAddons } : s),
          fnbProducts: newProducts,
        };
      }
      break;
    }

    case 'UPSERT_BOOKING': {
      const exists = state.bookings.find(b => b.id === action.payload.id);
      next = {
        ...state,
        bookings: exists
          ? state.bookings.map(b => b.id === action.payload.id ? action.payload : b)
          : [...state.bookings, action.payload],
      };
      break;
    }

    case 'DELETE_BOOKING':
      next = { ...state, bookings: state.bookings.filter(b => b.id !== action.payload) };
      break;

    case 'UPSERT_CUSTOMER': {
      const exists = state.customers.find(c => c.id === action.payload.id);
      next = {
        ...state,
        customers: exists
          ? state.customers.map(c => c.id === action.payload.id ? action.payload : c)
          : [...state.customers, action.payload],
      };
      break;
    }

    case 'DELETE_CUSTOMER':
      next = { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
      break;

    case 'UPSERT_PRICING': {
      const exists = state.pricingRules.find(p => p.id === action.payload.id);
      next = {
        ...state,
        pricingRules: exists
          ? state.pricingRules.map(p => p.id === action.payload.id ? action.payload : p)
          : [...state.pricingRules, action.payload],
      };
      break;
    }

    case 'UPSERT_PACKAGE': {
      const exists = state.packages.find(p => p.id === action.payload.id);
      next = {
        ...state,
        packages: exists
          ? state.packages.map(p => p.id === action.payload.id ? action.payload : p)
          : [...state.packages, action.payload],
      };
      break;
    }

    case 'DELETE_PACKAGE':
      next = { ...state, packages: state.packages.filter(p => p.id !== action.payload) };
      break;

    case 'UPSERT_FNB': {
      const exists = state.fnbProducts.find(p => p.id === action.payload.id);
      next = {
        ...state,
        fnbProducts: exists
          ? state.fnbProducts.map(p => p.id === action.payload.id ? action.payload : p)
          : [...state.fnbProducts, action.payload],
      };
      break;
    }

    case 'DELETE_FNB':
      next = { ...state, fnbProducts: state.fnbProducts.filter(p => p.id !== action.payload) };
      break;

    case 'COMPLETE_ORDER': {
      const { order, transaction, updatedProducts } = action.payload;
      // merge updated products
      const newProducts = state.fnbProducts.map(p => {
        const updated = updatedProducts.find(u => u.id === p.id);
        return updated ?? p;
      });
      next = {
        ...state,
        orders: [...state.orders, order],
        fnbProducts: newProducts,
        transactions: [...state.transactions, transaction],
      };
      break;
    }

    case 'UPSERT_EXPENSE': {
      const exists = state.expenses.find(e => e.id === action.payload.id);
      next = {
        ...state,
        expenses: exists
          ? state.expenses.map(e => e.id === action.payload.id ? action.payload : e)
          : [...state.expenses, action.payload],
      };
      break;
    }

    case 'DELETE_EXPENSE':
      next = { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };
      break;

    case 'ADD_TRANSACTION':
      next = { ...state, transactions: [...state.transactions, action.payload] };
      break;

    case 'UPDATE_SETTINGS':
      next = { ...state, settings: { ...state.settings, ...action.payload } };
      break;

    default:
      return state;
  }

  saveState(next);
  return next;
}

const AppContext = createContext<AppContextValue | null>(null);

let toastCounter = 0;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState());
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  // Save on change is done in reducer already; but also ensure initial load is saved
  useEffect(() => {
    // If storage was empty, we seeded — save it
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) saveState(state);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `toast_${++toastCounter}`;
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = resetState();
    dispatch({ type: 'SET_STATE', payload: fresh });
    toast({ type: 'success', title: 'Demo data reset', message: 'All data has been restored to original samples.' });
  }, [toast]);

  return (
    <AppContext.Provider value={{ state, toasts, dispatch, toast, dismissToast, resetDemo }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

// Convenience selectors
export function useSettings() {
  return useApp().state.settings;
}
