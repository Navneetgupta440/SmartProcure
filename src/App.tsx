import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { InteractiveDemoModal } from './components/common/InteractiveDemoModal';
import { FounderModal } from './components/common/FounderModal';
import { DirectApprovalModal } from './components/common/DirectApprovalModal';
import { AuthGateway } from './components/auth/AuthGateway';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { PurchaseRequestsPage } from './pages/PurchaseRequestsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { SupplierPortalPage } from './pages/SupplierPortalPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SmartProcurementPage } from './pages/SmartProcurementPage';
import { WorkflowEnginePage } from './pages/WorkflowEnginePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { PostmanOpenApiPage } from './pages/PostmanOpenApiPage';
import { SettingsPage } from './pages/SettingsPage';

import { api } from './api/client';
import { UserRole } from './types';
import { ShieldCheck, Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [directApprovalRequestId, setDirectApprovalRequestId] = useState<string | null>(null);
  const [showDirectApprovalModal, setShowDirectApprovalModal] = useState(false);

  // Live sidebar counters
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  const handleOpenDirectApproval = (requestId: string) => {
    setDirectApprovalRequestId(requestId);
    setShowDirectApprovalModal(true);
  };

  const fetchGlobalCounters = async () => {
    if (!isAuthenticated) return;
    try {
      const [kpisRes, prodRes, poRes] = await Promise.all([
        api.getDashboardKPIs(currentUser.role),
        api.getProducts(),
        api.getPurchaseOrders(),
      ]);

      if (kpisRes.success && kpisRes.data) {
        setPendingApprovalsCount(kpisRes.data.pendingApprovals);
      }
      if (prodRes.success && prodRes.data) {
        setLowStockCount(prodRes.data.filter((p) => p.quantity <= p.minimumStock).length);
      }
      if (poRes.success && poRes.data) {
        setActiveOrdersCount(poRes.data.filter((p) => p.status !== 'DELIVERED').length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGlobalCounters();
  }, [currentUser, activeTab, isAuthenticated]);

  // Adjust active tab if user role does not have access
  useEffect(() => {
    if (currentUser.role === UserRole.SUPPLIER && activeTab === 'approvals') {
      setActiveTab('supplier-portal');
    }
  }, [currentUser]);

  // If not signed in, show pre-auth Sign In & Sign Up Gateway (strictly without founder details)
  if (!isAuthenticated) {
    return (
      <>
        <AuthGateway />
        <ToastContainer />
      </>
    );
  }

  const isEmployeeRole = currentUser.role === UserRole.EMPLOYEE;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenQuickDemo={() => setShowDemoModal(true)}
          />
        );
      case 'requests':
        return <PurchaseRequestsPage onOpenDirectApproval={handleOpenDirectApproval} />;
      case 'approvals':
        return <ApprovalsPage initialRequestId={directApprovalRequestId} />;
      case 'orders':
        return <PurchaseOrdersPage />;
      case 'supplier-portal':
        return <SupplierPortalPage />;
      case 'deliveries':
        return <DeliveriesPage />;
      case 'products':
        return <ProductsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'smart-procurement':
        return <SmartProcurementPage />;
      case 'workflow-engine':
        return <WorkflowEnginePage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'postman-api':
        return <PostmanOpenApiPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenQuickDemo={() => setShowDemoModal(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-600 selection:text-white transition-colors">
      {/* Top Navigation Bar */}
      <Header
        onOpenQuickDemo={() => setShowDemoModal(true)}
        onSelectTab={(t) => setActiveTab(t)}
        onOpenFounderModal={() => setShowFounderModal(true)}
        onOpenDirectApproval={handleOpenDirectApproval}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          pendingApprovalsCount={pendingApprovalsCount}
          lowStockCount={lowStockCount}
          activeOrdersCount={activeOrdersCount}
          onOpenFounderModal={() => setShowFounderModal(true)}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Professional Polish Sub-Footer */}
      <footer className="h-9 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 text-[10px] text-slate-500 dark:text-slate-400 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Cluster AP-SOUTH-1</span>
          </div>
          {isEmployeeRole && (
            <>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <button
                onClick={() => setShowFounderModal(true)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                title="Employee Exclusive Access: Founder Profile"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Employee View: Founder & Lead Dev</span>
              </button>
            </>
          )}
        </div>

        <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
          SMARTPROCURE ENTERPRISE &copy; 2026 • REST API & CLOUD RUN
        </div>
      </footer>

      {/* Founder Modal */}
      <FounderModal isOpen={showFounderModal} onClose={() => setShowFounderModal(false)} />

      {/* Direct Approval Modal (1-Click Notification & In-App Approvals) */}
      <DirectApprovalModal
        isOpen={showDirectApprovalModal}
        requestId={directApprovalRequestId}
        onClose={() => {
          setShowDirectApprovalModal(false);
          setDirectApprovalRequestId(null);
        }}
        onSuccess={fetchGlobalCounters}
        onNavigateToWorkbench={() => {
          setShowDirectApprovalModal(false);
          setActiveTab('approvals');
        }}
      />

      {/* Global Interactive Walkthrough Demo */}
      <InteractiveDemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onRefreshAll={fetchGlobalCounters}
      />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <NotificationProvider>
            <MainLayout />
          </NotificationProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
