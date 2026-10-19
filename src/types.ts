// ============================================================
// GameZone OS — Types
// ============================================================

export type StationType = 'ps5' | 'xbox' | 'pc' | 'racing' | 'vr';
export type StationStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface Station {
  id: string;
  name: string;
  type: StationType;
  number: number;
  hourlyRate: number;
  status: StationStatus;
  specs?: string;
  notes?: string;
  disabled?: boolean;
}

export interface SessionAddon {
  id: string;
  productId?: string;
  name: string;
  category: FnBCategory | 'accessories' | 'other';
  price: number;
  quantity: number;
  addedAt: string;
}

export interface Session {
  id: string;
  stationId: string;
  customerId?: string;
  customerName: string;
  startTime: string; // ISO string
  endTime?: string;  // ISO string, set when ended
  pausedAt?: string; // ISO string if paused
  pausedDuration: number; // accumulated paused ms
  plannedDuration?: number; // minutes, undefined = open-ended
  ratePerHour: number;
  status: 'active' | 'paused' | 'ended';
  linkedOrderIds: string[];
  addons?: SessionAddon[];
  notes?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  stationType: StationType;
  stationId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  quotedPrice: number;
  status: BookingStatus;
  addons?: SessionAddon[];
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  registeredAt: string;
  totalVisits: number;
  totalSpend: number;
  preferredType?: StationType;
  notes?: string;
  loyaltyStatus: 'bronze' | 'silver' | 'gold';
  archived?: boolean;
}

export interface PricingRule {
  id: string;
  stationType: StationType;
  weekdayRate: number;
  weekendRate: number;
  peakRate?: number;
  peakHours?: { start: string; end: string }; // "18:00"
  minimumCharge: number;
  roundingRule: 'up' | 'nearest' | 'actual';
  enabled: boolean;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  stationType: StationType | 'any';
  durationMinutes: number;
  price: number;
  savings?: number;
  active: boolean;
  maxPersons?: number;
}

export type FnBCategory = 'snacks' | 'beverages' | 'meals' | 'desserts';

export interface FnBProduct {
  id: string;
  name: string;
  category: FnBCategory;
  price: number;
  stock: number;
  lowStockThreshold: number;
  available: boolean;
  description?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  sessionId?: string;
  customerId?: string;
  customerName?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  paymentMethod: 'cash' | 'upi' | 'card';
}

export type ExpenseCategory = 'rent' | 'electricity' | 'internet' | 'maintenance' | 'supplies' | 'staff' | 'marketing' | 'other';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank' | 'card';
  notes?: string;
}

export type TransactionType = 'session' | 'order' | 'package' | 'booking_deposit' | 'refund';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  customerId?: string;
  customerName?: string;
  sessionId?: string;
  orderId?: string;
  createdAt: string;
  date: string; // YYYY-MM-DD
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  openingHours: { [day: string]: { open: string; close: string; closed?: boolean } };
  currency: string;
  currencySymbol: string;
  taxRate: number;
  taxEnabled: boolean;
  bookingLeadHours: number;
  maxBookingDays: number;
  timezone: string;
  theme: 'premium-neon' | 'dark' | 'light';
  monogram: string;
}

export interface AppState {
  version: number;
  stations: Station[];
  sessions: Session[];
  bookings: Booking[];
  customers: Customer[];
  pricingRules: PricingRule[];
  packages: Package[];
  fnbProducts: FnBProduct[];
  orders: Order[];
  expenses: Expense[];
  transactions: Transaction[];
  settings: BusinessSettings;
}
