import React from 'react';
import { ToastProvider } from './components/common/Toast';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Functional Pages
import { OverviewPage } from './components/pages/OverviewPage';
import { SuppliersPage } from './components/pages/SuppliersPage';
import { ProductsPage } from './components/pages/ProductsPage';
import { InventoryPage } from './components/pages/InventoryPage';
import { PurchaseOrdersPage } from './components/pages/PurchaseOrdersPage';
import { ShipmentsPage } from './components/pages/ShipmentsPage';
import { DisruptionsPage } from './components/pages/DisruptionsPage';
import { RecoveryPlansPage } from './components/pages/RecoveryPlansPage';
import { ApprovalsPage } from './components/pages/ApprovalsPage';
import { IncidentHistoryPage } from './components/pages/IncidentHistoryPage';
import { AIAgentsPage } from './components/pages/AIAgentsPage';
import { IntegrationsPage } from './components/pages/IntegrationsPage';
import { AuditLogsPage } from './components/pages/AuditLogsPage';
import { SettingsPage } from './components/pages/SettingsPage';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      {activeTab === 'overview' && <OverviewPage />}
      {activeTab === 'suppliers' && <SuppliersPage />}
      {activeTab === 'products' && <ProductsPage />}
      {activeTab === 'inventory' && <InventoryPage />}
      {activeTab === 'purchase-orders' && <PurchaseOrdersPage />}
      {activeTab === 'shipments' && <ShipmentsPage />}
      {activeTab === 'disruptions' && <DisruptionsPage />}
      {activeTab === 'recovery-plans' && <RecoveryPlansPage />}
      {activeTab === 'approvals' && <ApprovalsPage />}
      {activeTab === 'incident-history' && <IncidentHistoryPage />}
      {activeTab === 'ai-agents' && <AIAgentsPage />}
      {activeTab === 'integrations' && <IntegrationsPage />}
      {activeTab === 'audit-logs' && <AuditLogsPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
          <Header />
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <MainContent />
          </div>
        </div>
      </AppProvider>
    </ToastProvider>
  );
};

export default App;
