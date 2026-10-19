// ============================================================
// GameZone OS — Seed Data & Storage Management
// ============================================================

import type { AppState, Station, Session, Booking, Customer, PricingRule, Package, FnBProduct, Expense, Transaction, BusinessSettings } from './types';

export const STORAGE_KEY = 'gamezone_os_v3';
export const STORAGE_VERSION = 3;

// ---- Deterministic ID generation ----
let _idCounter = 1000;
export function makeId(prefix: string): string {
  return `${prefix}_${(++_idCounter).toString(36)}`;
}

// ---- Date helpers ----
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function isoHoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

function isoMinutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

// ---- Default business settings ----
const defaultSettings: BusinessSettings = {
  name: 'Pixel Arena Gaming Lounge',
  tagline: 'Level Up Your Game',
  address: '2nd Floor, Nexus Mall, Koramangala, Bengaluru – 560034',
  phone: '+91 98765 43210',
  email: 'hello@pixelarena.in',
  website: 'pixelarena.in',
  openingHours: {
    monday:    { open: '10:00', close: '23:00' },
    tuesday:   { open: '10:00', close: '23:00' },
    wednesday: { open: '10:00', close: '23:00' },
    thursday:  { open: '10:00', close: '23:00' },
    friday:    { open: '10:00', close: '00:00' },
    saturday:  { open: '09:00', close: '00:00' },
    sunday:    { open: '09:00', close: '23:00' },
  },
  currency: 'INR',
  currencySymbol: '₹',
  taxRate: 18,
  taxEnabled: false,
  bookingLeadHours: 1,
  maxBookingDays: 30,
  timezone: 'Asia/Kolkata',
  theme: 'premium-neon',
  monogram: 'PA',
};

// ---- Seed stations ----
const seedStations: Station[] = [
  { id: 'sta_001', name: 'PlayStation Alpha', type: 'ps5', number: 1, hourlyRate: 120, status: 'occupied', specs: 'PS5 + 65" OLED + DualSense' },
  { id: 'sta_002', name: 'PlayStation Beta', type: 'ps5', number: 2, hourlyRate: 120, status: 'available', specs: 'PS5 + 65" OLED + DualSense' },
  { id: 'sta_003', name: 'PlayStation Gamma', type: 'ps5', number: 3, hourlyRate: 120, status: 'reserved', specs: 'PS5 + 55" OLED' },
  { id: 'sta_004', name: 'Xbox Titan', type: 'xbox', number: 1, hourlyRate: 100, status: 'occupied', specs: 'Xbox Series X + 65" 4K' },
  { id: 'sta_005', name: 'Xbox Nova', type: 'xbox', number: 2, hourlyRate: 100, status: 'available', specs: 'Xbox Series X + 55" 4K' },
  { id: 'sta_006', name: 'PC Raptor', type: 'pc', number: 1, hourlyRate: 80, status: 'occupied', specs: 'RTX 4080 · i9-13900K · 360Hz' },
  { id: 'sta_007', name: 'PC Viper', type: 'pc', number: 2, hourlyRate: 80, status: 'occupied', specs: 'RTX 4070 · i7-13700K · 240Hz' },
  { id: 'sta_008', name: 'PC Phantom', type: 'pc', number: 3, hourlyRate: 80, status: 'available', specs: 'RTX 4070 Ti · i7-13700K · 240Hz' },
  { id: 'sta_009', name: 'PC Storm', type: 'pc', number: 4, hourlyRate: 80, status: 'maintenance', specs: 'RTX 4060 Ti · i5-13600K' },
  { id: 'sta_010', name: 'Racing Sim Pro', type: 'racing', number: 1, hourlyRate: 200, status: 'available', specs: 'Fanatec DD2 · Sparco Seat · Triple 27" 165Hz' },
  { id: 'sta_011', name: 'VR World', type: 'vr', number: 1, hourlyRate: 250, status: 'available', specs: 'Meta Quest Pro + Full-body tracking' },
];

// ---- Seed customers ----
const seedCustomers: Customer[] = [
  { id: 'cus_001', name: 'Arjun Mehta', phone: '9876543210', email: 'arjun.m@email.com', registeredAt: daysAgo(120), totalVisits: 34, totalSpend: 12800, preferredType: 'ps5', loyaltyStatus: 'gold', notes: 'Loves FIFA and GT7' },
  { id: 'cus_002', name: 'Priya Sharma', phone: '9812345678', email: 'priya.s@email.com', registeredAt: daysAgo(90), totalVisits: 18, totalSpend: 5400, preferredType: 'pc', loyaltyStatus: 'silver' },
  { id: 'cus_003', name: 'Rohan Verma', phone: '9923456789', registeredAt: daysAgo(60), totalVisits: 8, totalSpend: 2200, preferredType: 'xbox', loyaltyStatus: 'bronze' },
  { id: 'cus_004', name: 'Sneha Iyer', phone: '9834567890', email: 'sneha.i@email.com', registeredAt: daysAgo(45), totalVisits: 22, totalSpend: 8800, preferredType: 'ps5', loyaltyStatus: 'gold' },
  { id: 'cus_005', name: 'Karan Patel', phone: '9756789012', registeredAt: daysAgo(30), totalVisits: 5, totalSpend: 1500, preferredType: 'racing', loyaltyStatus: 'bronze' },
  { id: 'cus_006', name: 'Aditya Kumar', phone: '9667890123', email: 'aditya.k@email.com', registeredAt: daysAgo(14), totalVisits: 3, totalSpend: 960, preferredType: 'pc', loyaltyStatus: 'bronze' },
  { id: 'cus_007', name: 'Divya Nair', phone: '9578901234', email: 'divya.n@email.com', registeredAt: daysAgo(80), totalVisits: 15, totalSpend: 4200, preferredType: 'xbox', loyaltyStatus: 'silver' },
  { id: 'cus_008', name: 'Vikram Singh', phone: '9489012345', registeredAt: daysAgo(200), totalVisits: 52, totalSpend: 19800, preferredType: 'ps5', loyaltyStatus: 'gold' },
];

// ---- Seed sessions (some active) ----
const seedSessions: Session[] = [
  {
    id: 'ses_001', stationId: 'sta_001', customerId: 'cus_001',
    customerName: 'Arjun Mehta', startTime: isoHoursAgo(1.5),
    pausedDuration: 0, ratePerHour: 120, status: 'active',
    linkedOrderIds: [], notes: 'Regular - GT7 session',
    addons: [
      { id: 'adn_001', productId: 'fnb_013', name: "Lay's Classic Salted Chips", category: 'snacks', price: 30, quantity: 1, addedAt: isoHoursAgo(1) },
      { id: 'adn_002', productId: 'fnb_015', name: 'Coca-Cola Chilled Can 300ml', category: 'beverages', price: 40, quantity: 2, addedAt: isoHoursAgo(0.8) },
    ],
  },
  {
    id: 'ses_002', stationId: 'sta_004', customerId: 'cus_003',
    customerName: 'Rohan Verma', startTime: isoMinutesAgo(45),
    pausedDuration: 0, ratePerHour: 100, status: 'active',
    linkedOrderIds: [],
    addons: [
      { id: 'adn_003', productId: 'fnb_006', name: 'Red Bull Original', category: 'beverages', price: 150, quantity: 1, addedAt: isoMinutesAgo(35) },
      { id: 'adn_004', productId: 'fnb_014', name: 'Doritos Nacho Cheese', category: 'snacks', price: 50, quantity: 1, addedAt: isoMinutesAgo(30) },
    ],
  },
  {
    id: 'ses_003', stationId: 'sta_006', customerId: 'cus_002',
    customerName: 'Priya Sharma', startTime: isoHoursAgo(2),
    pausedDuration: 0, ratePerHour: 80, status: 'active',
    linkedOrderIds: [], plannedDuration: 180,
    addons: [
      { id: 'adn_005', productId: 'fnb_015', name: 'Coca-Cola Chilled Can 300ml', category: 'beverages', price: 40, quantity: 1, addedAt: isoHoursAgo(1.5) },
    ],
  },
  {
    id: 'ses_004', stationId: 'sta_007',
    customerName: 'Walk-in Guest', startTime: isoMinutesAgo(30),
    pausedDuration: 0, ratePerHour: 80, status: 'active',
    linkedOrderIds: [],
  },
  // Historical ended sessions
  {
    id: 'ses_005', stationId: 'sta_002', customerId: 'cus_004',
    customerName: 'Sneha Iyer', startTime: new Date(Date.now() - 5*3600_000).toISOString(),
    endTime: new Date(Date.now() - 3*3600_000).toISOString(),
    pausedDuration: 0, ratePerHour: 120, status: 'ended', linkedOrderIds: [],
  },
  {
    id: 'ses_006', stationId: 'sta_005', customerId: 'cus_007',
    customerName: 'Divya Nair', startTime: new Date(Date.now() - 4*3600_000).toISOString(),
    endTime: new Date(Date.now() - 2.5*3600_000).toISOString(),
    pausedDuration: 0, ratePerHour: 100, status: 'ended', linkedOrderIds: [],
  },
];

// ---- Seed bookings ----
function futureDate(daysFromNow: number, time: string): { date: string; startTime: string } {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return { date: d.toISOString().split('T')[0], startTime: time };
}

const seedBookings: Booking[] = [
  { id: 'bk_001', customerName: 'Vikram Singh', phone: '9489012345', stationType: 'ps5', stationId: 'sta_003', ...futureDate(0, '19:00'), durationMinutes: 120, quotedPrice: 240, status: 'confirmed', createdAt: isoHoursAgo(2), notes: 'Birthday session', addons: [{ id: 'adn_b01', productId: 'fnb_015', name: 'Coca-Cola Chilled Can 300ml', category: 'beverages', price: 40, quantity: 2, addedAt: isoHoursAgo(2) }] },
  { id: 'bk_002', customerName: 'Sneha Iyer', phone: '9834567890', stationType: 'pc', ...futureDate(1, '15:00'), durationMinutes: 180, quotedPrice: 240, status: 'confirmed', createdAt: isoHoursAgo(5) },
  { id: 'bk_003', customerName: 'Ravi Krishnan', phone: '9345678901', stationType: 'racing', stationId: 'sta_010', ...futureDate(1, '11:00'), durationMinutes: 60, quotedPrice: 200, status: 'pending', createdAt: isoHoursAgo(8) },
  { id: 'bk_004', customerName: 'Aditya Kumar', phone: '9667890123', stationType: 'vr', stationId: 'sta_011', ...futureDate(2, '16:00'), durationMinutes: 60, quotedPrice: 250, status: 'confirmed', createdAt: isoHoursAgo(12) },
  { id: 'bk_005', customerName: 'Meera Kapoor', phone: '9556789012', stationType: 'xbox', ...futureDate(2, '14:00'), durationMinutes: 120, quotedPrice: 200, status: 'pending', createdAt: isoHoursAgo(24) },
  { id: 'bk_006', customerName: 'Arjun Mehta', phone: '9876543210', stationType: 'ps5', ...futureDate(3, '20:00'), durationMinutes: 180, quotedPrice: 360, status: 'confirmed', createdAt: isoHoursAgo(36) },
  { id: 'bk_007', customerName: 'Pooja Reddy', phone: '9423456789', stationType: 'pc', ...futureDate(-1, '14:00'), durationMinutes: 120, quotedPrice: 160, status: 'completed', createdAt: isoHoursAgo(50) },
  { id: 'bk_008', customerName: 'Ankit Sharma', phone: '9312456789', stationType: 'ps5', ...futureDate(-2, '18:00'), durationMinutes: 60, quotedPrice: 120, status: 'no-show', createdAt: isoHoursAgo(70) },
];

// ---- Pricing rules ----
const seedPricingRules: PricingRule[] = [
  { id: 'pr_001', stationType: 'ps5', weekdayRate: 120, weekendRate: 150, peakRate: 160, peakHours: { start: '17:00', end: '22:00' }, minimumCharge: 60, roundingRule: 'up', enabled: true },
  { id: 'pr_002', stationType: 'xbox', weekdayRate: 100, weekendRate: 130, peakRate: 140, peakHours: { start: '17:00', end: '22:00' }, minimumCharge: 60, roundingRule: 'up', enabled: true },
  { id: 'pr_003', stationType: 'pc', weekdayRate: 80, weekendRate: 100, peakRate: 110, peakHours: { start: '17:00', end: '23:00' }, minimumCharge: 40, roundingRule: 'nearest', enabled: true },
  { id: 'pr_004', stationType: 'racing', weekdayRate: 200, weekendRate: 240, minimumCharge: 100, roundingRule: 'up', enabled: true },
  { id: 'pr_005', stationType: 'vr', weekdayRate: 250, weekendRate: 300, minimumCharge: 125, roundingRule: 'up', enabled: true },
];

// ---- Packages ----
const seedPackages: Package[] = [
  { id: 'pkg_001', name: '1-Hour Play', description: 'Single session on any console', stationType: 'any', durationMinutes: 60, price: 99, savings: 21, active: true },
  { id: 'pkg_002', name: '3-Hour Gaming Pass', description: 'Extended session — great value', stationType: 'any', durationMinutes: 180, price: 249, savings: 111, active: true },
  { id: 'pkg_003', name: 'PS5 Weekend Pass', description: '2 hours on PS5 any weekend', stationType: 'ps5', durationMinutes: 120, price: 220, savings: 80, active: true },
  { id: 'pkg_004', name: 'PC Warrior Pack', description: '3 hours on gaming PC', stationType: 'pc', durationMinutes: 180, price: 199, savings: 41, active: true },
  { id: 'pkg_005', name: 'Group Battle (4-Pack)', description: '1 hour for 4 players on PCs', stationType: 'pc', durationMinutes: 60, price: 280, savings: 40, active: true, maxPersons: 4 },
  { id: 'pkg_006', name: 'VR Explorer', description: '45-minute VR experience', stationType: 'vr', durationMinutes: 45, price: 180, active: false },
];

// ---- F&B Products ----
const seedFnBProducts: FnBProduct[] = [
  { id: 'fnb_013', name: "Lay's Classic Salted Chips", category: 'snacks', price: 30, stock: 50, lowStockThreshold: 10, available: true, description: 'Crispy salted potato chips 50g' },
  { id: 'fnb_014', name: 'Doritos Nacho Cheese', category: 'snacks', price: 50, stock: 35, lowStockThreshold: 8, available: true, description: 'Tortilla chips with bold cheesy seasoning' },
  { id: 'fnb_015', name: 'Coca-Cola Chilled Can 300ml', category: 'beverages', price: 40, stock: 80, lowStockThreshold: 15, available: true, description: 'Ice-cold refreshing Coke' },
  { id: 'fnb_006', name: 'Red Bull Energy 250ml', category: 'beverages', price: 150, stock: 60, lowStockThreshold: 15, available: true, description: 'Revitalizes body and mind' },
  { id: 'fnb_016', name: 'Monster Energy Ultra', category: 'beverages', price: 140, stock: 40, lowStockThreshold: 10, available: true, description: 'Zero sugar energy boost' },
  { id: 'fnb_017', name: 'Masala Maggi Noodles', category: 'meals', price: 60, stock: 45, lowStockThreshold: 10, available: true, description: 'Hot gaming snack bowl' },
  { id: 'fnb_001', name: 'Classic Burger', category: 'meals', price: 149, stock: 25, lowStockThreshold: 5, available: true },
  { id: 'fnb_002', name: 'Chicken Wrap', category: 'meals', price: 129, stock: 18, lowStockThreshold: 5, available: true },
  { id: 'fnb_003', name: 'Loaded Nachos', category: 'snacks', price: 99, stock: 40, lowStockThreshold: 10, available: true },
  { id: 'fnb_004', name: 'Garlic Bread', category: 'snacks', price: 79, stock: 30, lowStockThreshold: 8, available: true },
  { id: 'fnb_007', name: 'Cold Coffee', category: 'beverages', price: 89, stock: 35, lowStockThreshold: 10, available: true },
  { id: 'fnb_009', name: 'Mineral Water', category: 'beverages', price: 25, stock: 100, lowStockThreshold: 20, available: true },
  { id: 'fnb_011', name: 'Chocolate Brownie', category: 'desserts', price: 79, stock: 15, lowStockThreshold: 4, available: true },
  { id: 'fnb_012', name: 'Ice Cream Cup', category: 'desserts', price: 69, stock: 22, lowStockThreshold: 5, available: true },
];

// ---- Expenses ----
function buildExpenses(): Expense[] {
  const items: Expense[] = [];
  // Monthly fixed expenses
  for (let m = 0; m < 3; m++) {
    const mo = new Date(); mo.setDate(1); mo.setMonth(mo.getMonth() - m);
    const ds = mo.toISOString().split('T')[0];
    items.push({ id: `exp_rent_${m}`, date: ds, category: 'rent', description: 'Monthly Rent — Nexus Mall', amount: 85000, paymentMethod: 'bank', notes: 'Due on 1st of each month' });
    items.push({ id: `exp_elec_${m}`, date: ds, category: 'electricity', description: 'Electricity Bill — BESCOM', amount: m === 0 ? 18400 : 17200, paymentMethod: 'upi' });
    items.push({ id: `exp_net_${m}`, date: ds, category: 'internet', description: 'Fiber Broadband — JioFiber', amount: 3999, paymentMethod: 'upi' });
  }
  // Irregular expenses
  items.push({ id: 'exp_001', date: daysAgo(5), category: 'maintenance', description: 'PC Storm — GPU replacement', amount: 28000, paymentMethod: 'card', notes: 'RTX 4060 Ti RMA replacement' });
  items.push({ id: 'exp_002', date: daysAgo(8), category: 'supplies', description: 'Controller charging docks x4', amount: 3600, paymentMethod: 'upi' });
  items.push({ id: 'exp_003', date: daysAgo(12), category: 'marketing', description: 'Instagram/Meta ads — Oct', amount: 5000, paymentMethod: 'card' });
  items.push({ id: 'exp_004', date: daysAgo(15), category: 'supplies', description: 'Cleaning supplies + tissues', amount: 1200, paymentMethod: 'cash' });
  items.push({ id: 'exp_005', date: daysAgo(20), category: 'maintenance', description: 'Racing sim force-feedback recalibration', amount: 4500, paymentMethod: 'cash' });
  return items;
}

// ---- Build some historical transactions for reports ----
function buildTransactions(): Transaction[] {
  const txns: Transaction[] = [];
  // Today's transactions
  const todayStr = today();
  txns.push({ id: 'txn_t01', type: 'session', description: 'Session — Sneha Iyer (PS5 Alpha, 2hr)', amount: 240, paymentMethod: 'upi', customerId: 'cus_004', customerName: 'Sneha Iyer', date: todayStr, createdAt: isoHoursAgo(3) });
  txns.push({ id: 'txn_t02', type: 'session', description: 'Session — Divya Nair (Xbox Titan, 1.5hr)', amount: 150, paymentMethod: 'cash', customerId: 'cus_007', customerName: 'Divya Nair', date: todayStr, createdAt: isoHoursAgo(2.5) });
  txns.push({ id: 'txn_t03', type: 'order', description: 'F&B Order — Nachos + Red Bull x2', amount: 399, paymentMethod: 'upi', date: todayStr, createdAt: isoHoursAgo(2) });
  txns.push({ id: 'txn_t04', type: 'package', description: 'PC Warrior Pack — Walk-in', amount: 199, paymentMethod: 'cash', date: todayStr, createdAt: isoHoursAgo(1) });

  // Seed 30 days of historical revenue
  for (let d = 1; d <= 30; d++) {
    const ds = daysAgo(d);
    const dow = new Date(ds).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const baseSessions = isWeekend ? 14 : 9;
    const revenue = baseSessions * 140 + Math.floor((d * 37) % 500);
    txns.push({
      id: `txn_h${d}`, type: 'session',
      description: `Day summary — ${baseSessions} sessions`,
      amount: revenue, paymentMethod: 'mixed' as 'cash',
      date: ds, createdAt: new Date(ds + 'T23:00:00').toISOString(),
    });
  }
  return txns;
}

// ---- Build initial seed state ----
export function buildSeedState(): AppState {
  return {
    version: STORAGE_VERSION,
    stations: seedStations,
    sessions: seedSessions,
    bookings: seedBookings,
    customers: seedCustomers,
    pricingRules: seedPricingRules,
    packages: seedPackages,
    fnbProducts: seedFnBProducts,
    orders: [],
    expenses: buildExpenses(),
    transactions: buildTransactions(),
    settings: defaultSettings,
  };
}

// ---- Storage helpers ----
export function loadState(): AppState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== STORAGE_VERSION) {
      return buildSeedState();
    }
    // Validate minimal shape
    if (!Array.isArray(parsed.stations) || !Array.isArray(parsed.sessions)) {
      return buildSeedState();
    }
    return parsed;
  } catch {
    return buildSeedState();
  }
}

export function saveState(state: AppState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable — continue without persistence
  }
}

export function resetState(): AppState {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  const fresh = buildSeedState();
  saveState(fresh);
  return fresh;
}
