import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole, Notification } from '../../types';
import { RoleBadge } from '../common/Badge';
import { LanguageSelector } from '../common/LanguageSelector';
import { SmartProcureLogo } from '../common/SmartProcureLogo';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Search,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  User,
  Info,
  ArrowRight,
  Zap,
  CheckSquare,
  Package,
  Truck,
  PlusCircle,
} from 'lucide-react';
import { api } from '../../api/client';

interface HeaderProps {
  onOpenTour?: () => void;
  onOpenQuickDemo?: () => void;
  onSelectTab?: (tabId: string) => void;
  onOpenFounderModal?: () => void;
  onOpenDirectApproval?: (requestId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickDemo,
  onSelectTab,
  onOpenFounderModal,
  onOpenDirectApproval,
}) => {
  const { currentUser, loginAsPersona, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, showToast, refreshNotifications } = useNotifications();
  const { t } = useI18n();
  const { isDark, toggleTheme, theme, setTheme } = useTheme();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSimulatingPR, setIsSimulatingPR] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle direct notification click
  const handleNotificationAction = (n: Notification) => {
    markAsRead(n.id);
    setShowNotifMenu(false);

    const isPRApproval =
      n.type === 'APPROVAL_REQUIRED' ||
      n.referenceType === 'PURCHASE_REQUEST' ||
      n.title.toLowerCase().includes('approval') ||
      n.title.toLowerCase().includes('purchase request');

    if (isPRApproval) {
      const prId = n.referenceId || 'pr-1003';
      if (onOpenDirectApproval) {
        onOpenDirectApproval(prId);
      } else if (onSelectTab) {
        onSelectTab('approvals');
      }
      return;
    }

    if (n.referenceType === 'PURCHASE_ORDER' || n.type === 'PO_ISSUED' || n.type === 'ORDER_DELIVERED') {
      if (currentUser.role === UserRole.SUPPLIER) {
        if (onSelectTab) onSelectTab('supplier-portal');
      } else {
        if (onSelectTab) onSelectTab('orders');
      }
      return;
    }

    if (n.referenceType === 'PRODUCT' || n.type === 'LOW_STOCK') {
      if (onSelectTab) onSelectTab('inventory');
      return;
    }

    if (n.referenceType === 'DELIVERY' || n.type === 'DELIVERY_STATUS_CHANGED') {
      if (onSelectTab) onSelectTab('deliveries');
      return;
    }
  };

  // Helper to simulate a new Purchase Request for approval immediately
  const handleSimulateNewPR = async () => {
    try {
      setIsSimulatingPR(true);
      const prRes = await api.createPurchaseRequest({
        requestedBy: currentUser.id || 'usr-emp-01',
        department: 'Cloud Infrastructure & AI Systems',
        priority: 'HIGH',
        reason: 'Urgent acquisition of high-performance compute accelerators for production LLM cluster',
        items: [
          {
            productId: 'prd-01',
            quantity: 3,
          },
          {
            productId: 'prd-03',
            quantity: 4,
          },
        ],
      });

      if (prRes.success && prRes.data) {
        await refreshNotifications();
        showToast(
          'info',
          'New Purchase Request For Approval',
          `${prRes.data.requestNumber} created for ₹${prRes.data.estimatedAmount.toLocaleString('en-IN')}. Click to review & approve!`,
          {
            label: 'Review & Approve Now →',
            onClick: () => {
              if (onOpenDirectApproval) {
                onOpenDirectApproval(prRes.data.id);
              }
            },
          }
        );
      }
    } catch (err: any) {
      showToast('error', 'Simulation Failed', err?.message || 'Could not generate PR');
    } finally {
      setIsSimulatingPR(false);
    }
  };

  // Persona switchers for testing
  const personas = [
    { role: UserRole.EMPLOYEE, name: 'Ananya Deshmukh', title: 'Senior Software Engineer (Employee)' },
    { role: UserRole.MANAGER, name: 'Vikram Mehta', title: 'IT Dept Manager' },
    { role: UserRole.PROCUREMENT_MANAGER, name: 'Pooja Iyer', title: 'Procurement Specialist' },
    { role: UserRole.ADMIN, name: 'System Administrator', title: 'Enterprise IT Admin' },
    { role: UserRole.SUPPLIER, name: 'Suresh Singhania', title: 'Premier Vendor Partner' },
    { role: UserRole.DELIVERY_AGENT, name: 'Amit Patel', title: 'BlueDart Logistics Agent' },
    { role: UserRole.CUSTOMER, name: 'Kavita Rao', title: 'Corporate Operations Lead' },
  ];

  // Access control: Founder & Lead Developer details visible ONLY to EMPLOYEE role
  const isEmployeeRole = currentUser.role === UserRole.EMPLOYEE;

  const handleResetSystem = async () => {
    if (confirm('Reset database to clean initial enterprise seed dataset?')) {
      try {
        setIsResetting(true);
        await api.resetSystem();
        showToast('success', t('action_reset'), 'All tables reset to initial enterprise demo state.');
        setTimeout(() => window.location.reload(), 600);
      } catch (err) {
        showToast('error', 'Reset Failed', 'Could not reset database');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    showToast('info', t('action_search'), `Filtering records for: "${searchQuery}"`);
    if (onSelectTab) onSelectTab('requests');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors">
      {/* Left: Official SmartProcure Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectTab && onSelectTab('dashboard')}
          className="text-left focus:outline-none hover:opacity-90 transition cursor-pointer"
        >
          <SmartProcureLogo size="md" variant="full" />
        </button>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('header_searchPlaceholder')}
            className="w-48 xl:w-60 pl-9 pr-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        {/* Quick Demo Guided Workflow button */}
        {onOpenQuickDemo && (
          <button
            onClick={onOpenQuickDemo}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t('header_demoWorkflow')}</span>
          </button>
        )}

        {/* Dedicated Founder Profile Button - Visible ONLY to Employee Role */}
        {isEmployeeRole && onOpenFounderModal && (
          <button
            onClick={onOpenFounderModal}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition cursor-pointer"
            title="Employee Exclusive: View Founder & Lead Dev Dossier"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="truncate max-w-[130px]">Founder & Dev Info</span>
          </button>
        )}

        {/* Language Selector */}
        <LanguageSelector />

        {/* Visual Explicit Theme Switcher Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              !isDark
                ? 'bg-white text-amber-600 shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch to Light Theme"
          >
            <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500 fill-amber-400/20' : ''}`} />
            <span className="hidden sm:inline">Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-900 text-blue-400 shadow-xs font-semibold border border-slate-700/60'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Switch to Dark Theme"
          >
            <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400 fill-blue-400/20' : ''}`} />
            <span className="hidden sm:inline">Dark</span>
          </button>
        </div>

        {/* System Reset Button */}
        <button
          onClick={handleResetSystem}
          disabled={isResetting}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer disabled:opacity-50"
          title="Reset Enterprise Demo Data"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 relative transition cursor-pointer"
            title={t('header_notifications')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in duration-100 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {t('header_notifications')} ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {t('header_markAllRead')}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 text-xs pr-0.5">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 text-xs">{t('header_noNotifications')}</p>
                ) : (
                  notifications.slice(0, 10).map((n) => {
                    const isPRApproval =
                      n.type === 'APPROVAL_REQUIRED' ||
                      n.referenceType === 'PURCHASE_REQUEST' ||
                      n.title.toLowerCase().includes('approval') ||
                      n.title.toLowerCase().includes('purchase request');

                    const isPO =
                      n.referenceType === 'PURCHASE_ORDER' ||
                      n.type === 'PO_ISSUED' ||
                      n.type === 'SUPPLIER_ACCEPTED' ||
                      n.type === 'ORDER_DELIVERED';

                    const isLowStock = n.referenceType === 'PRODUCT' || n.type === 'LOW_STOCK';
                    const isDelivery = n.referenceType === 'DELIVERY' || n.type === 'DELIVERY_STATUS_CHANGED';

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationAction(n)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                          isPRApproval && !n.read
                            ? 'bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent dark:from-amber-950/40 dark:via-indigo-950/30 border-amber-300 dark:border-amber-700/60 shadow-2xs'
                            : n.read
                            ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/60 opacity-80'
                            : 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isPRApproval ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase tracking-tight">
                                <Zap className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                <span>Action: Approval Required</span>
                              </span>
                            ) : isPO ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20 uppercase tracking-tight">
                                <Package className="w-2.5 h-2.5" />
                                <span>Purchase Order</span>
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20 uppercase tracking-tight">
                                <span>Inventory Alert</span>
                              </span>
                            ) : isDelivery ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 uppercase tracking-tight">
                                <Truck className="w-2.5 h-2.5" />
                                <span>Logistics</span>
                              </span>
                            ) : null}

                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                            )}
                          </div>

                          <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="font-semibold text-[11px] text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {n.title}
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                          {n.message}
                        </p>

                        {/* Direct Action Trigger Buttons */}
                        {isPRApproval && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between">
                            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                              Direct Approvals Access
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationAction(n);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Review & Approve →</span>
                            </button>
                          </div>
                        )}

                        {isPO && (
                          <div className="mt-2 text-right">
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold group-hover:underline inline-flex items-center gap-0.5">
                              <span>Open Purchase Order</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        )}

                        {isLowStock && (
                          <div className="mt-2 text-right">
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold group-hover:underline inline-flex items-center gap-0.5">
                              <span>Check Safety Stock</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Notification Footer Action Bar */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={handleSimulateNewPR}
                  disabled={isSimulatingPR}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Generate a test purchase requisition and trigger approval notification"
                >
                  <PlusCircle className={`w-3.5 h-3.5 ${isSimulatingPR ? 'animate-spin' : ''}`} />
                  <span>{isSimulatingPR ? 'Creating PR...' : '+ Simulate PR for Approval'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowNotifMenu(false);
                    if (onSelectTab) onSelectTab('approvals');
                  }}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-[10px] font-medium"
                >
                  View Approvals Tab →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Section with Left Border Divider */}
        <div className="relative border-l border-slate-200 dark:border-slate-800 pl-3 sm:pl-4">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tight font-mono">
                {currentUser.role.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full border-2 border-blue-500/30 shadow-xs overflow-hidden flex items-center justify-center shrink-0">
              {currentUser.profileImage ? (
                <img
                  src={currentUser.profileImage}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)}
                </div>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in duration-100 text-slate-900 dark:text-slate-100">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('header_switchRole')}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Logged in as <span className="font-semibold text-slate-900 dark:text-slate-100">{currentUser.name}</span>
                </p>
              </div>

              {/* Founder Profile - Visible ONLY to Employee */}
              {isEmployeeRole && onOpenFounderModal && (
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    onOpenFounderModal();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-xs font-semibold mb-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Employee Access: Founder & Dev Dossier</span>
                </button>
              )}

              <div className="space-y-1">
                {personas.map((p) => {
                  const isCurrent = currentUser.role === p.role;
                  return (
                    <button
                      key={p.role}
                      onClick={() => {
                        loginAsPersona(p.role);
                        setShowRoleMenu(false);
                        showToast('info', 'Role Switched', `Active role: ${p.name} (${p.title})`);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{p.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{p.title}</div>
                      </div>
                      <RoleBadge role={p.role} />
                    </button>
                  );
                })}
              </div>

              {/* Sign Out Button */}
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    signOut();
                    showToast('info', 'Signed Out', 'You have been signed out to the SmartProcure portal.');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-xs font-semibold transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
