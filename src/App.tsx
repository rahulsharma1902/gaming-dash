// ============================================================
// GameZone OS — Root App
// ============================================================

import React, { useState, useMemo, Suspense } from 'react';
import { AppProvider } from './context';
import { Layout } from './Layout';

// Lazy-load pages for better initial load
const Overview = React.lazy(() => import('./pages/Overview'));
const Stations = React.lazy(() => import('./pages/Stations'));
const Bookings = React.lazy(() => import('./pages/Bookings'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const FnB = React.lazy(() => import('./pages/FnB'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Website = React.lazy(() => import('./pages/Website'));
const Settings = React.lazy(() => import('./pages/Settings'));

export type PageId = 'overview' | 'stations' | 'bookings' | 'customers' | 'pricing' | 'fnb' | 'expenses' | 'reports' | 'website' | 'settings';

function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      <div className="skeleton" style={{ height: 40, width: '40%' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
      </div>
      <div className="skeleton" style={{ height: 240 }} />
    </div>
  );
}

function AppInner() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [globalSearch, setGlobalSearch] = useState('');

  const currentPageComponent = useMemo(() => {
    switch (currentPage) {
      case 'overview': return <Overview />;
      case 'stations': return <Stations />;
      case 'bookings': return <Bookings />;
      case 'customers': return <Customers />;
      case 'pricing': return <Pricing />;
      case 'fnb': return <FnB />;
      case 'expenses': return <Expenses />;
      case 'reports': return <Reports />;
      case 'website': return <Website />;
      case 'settings': return <Settings />;
      default: return <Overview />;
    }
  }, [currentPage]);

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={(page) => {
        setCurrentPage(page);
        // Reset search when navigating
        setGlobalSearch('');
        // Scroll to top
        window.scrollTo({ top: 0 });
      }}
      globalSearch={globalSearch}
      setGlobalSearch={setGlobalSearch}
    >
      <Suspense fallback={<PageSkeleton />}>
        {currentPageComponent}
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
