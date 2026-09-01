import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  ShoppingBag,
  Truck,
  Package,
  Boxes,
  Users,
  Sparkles,
  GitBranch,
  ShieldCheck,
  BarChart3,
  Terminal,
  Settings,
  Store,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  pendingApprovalsCount?: number;
  lowStockCount?: number;
  activeOrdersCount?: number;
  onOpenFounderModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingApprovalsCount = 0,
  lowStockCount = 0,
  activeOrdersCount = 0,
  onOpenFounderModal,
}) => {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const role = currentUser.role;

  // Access control: Founder & Lead Developer details visible ONLY to EMPLOYEE role
  const isEmployeeRole = role === UserRole.EMPLOYEE;

  const navSections = [
    {
      title: t('nav_managementOps'),
      items: [
        {
          id: 'dashboard',
          label: t('nav_dashboard'),
          icon: LayoutDashboard,
          badge: null,
          roles: [
            UserRole.ADMIN,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.MANAGER,
            UserRole.EMPLOYEE,
            UserRole.CUSTOMER,
            UserRole.SUPPLIER,
            UserRole.DELIVERY_AGENT,
          ],
        },
        {
          id: 'requests',
          label: t('nav_requests'),
          icon: FileText,
          badge: null,
          roles: [
            UserRole.ADMIN,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.MANAGER,
            UserRole.EMPLOYEE,
            UserRole.CUSTOMER,
          ],
        },
        {
          id: 'approvals',
          label: t('nav_approvals'),
          icon: CheckSquare,
          badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : null,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROCUREMENT_MANAGER],
        },
        {
          id: 'orders',
          label: t('nav_orders'),
          icon: ShoppingBag,
          badge: activeOrdersCount > 0 ? `${activeOrdersCount}` : null,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          roles: [
            UserRole.ADMIN,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.MANAGER,
            UserRole.EMPLOYEE,
            UserRole.CUSTOMER,
          ],
        },
        {
          id: 'supplier-portal',
          label: t('nav_supplierPortal'),
          icon: Store,
          badge: null,
          roles: [UserRole.ADMIN, UserRole.SUPPLIER, UserRole.PROCUREMENT_MANAGER],
        },
        {
          id: 'deliveries',
          label: t('nav_deliveries'),
          icon: Truck,
          badge: null,
          roles: [
            UserRole.ADMIN,
            UserRole.DELIVERY_AGENT,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.EMPLOYEE,
            UserRole.CUSTOMER,
          ],
        },
      ],
    },
    {
      title: t('nav_products'),
      items: [
        {
          id: 'products',
          label: t('nav_products'),
          icon: Package,
          badge: null,
          roles: [
            UserRole.ADMIN,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.MANAGER,
            UserRole.EMPLOYEE,
            UserRole.CUSTOMER,
          ],
        },
        {
          id: 'inventory',
          label: t('nav_inventory'),
          icon: Boxes,
          badge: lowStockCount > 0 ? `${lowStockCount} ${t('status_lowStock').toLowerCase()}` : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          roles: [
            UserRole.ADMIN,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.MANAGER,
            UserRole.EMPLOYEE,
          ],
        },
        {
          id: 'suppliers',
          label: t('nav_suppliers'),
          icon: Users,
          badge: null,
          roles: [
            UserRole.ADMIN,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.MANAGER,
            UserRole.EMPLOYEE,
          ],
        },
      ],
    },
    {
      title: t('nav_systemSection'),
      items: [
        {
          id: 'smart-procurement',
          label: t('nav_smartProcurement'),
          icon: Sparkles,
          badge: t('badge_smart') || 'SMART',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          roles: [
            UserRole.ADMIN,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.MANAGER,
            UserRole.EMPLOYEE,
          ],
        },
        {
          id: 'workflow-engine',
          label: t('nav_workflowEngine'),
          icon: GitBranch,
          badge: null,
          roles: [UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER, UserRole.MANAGER],
        },
        {
          id: 'reports',
          label: t('nav_reports'),
          icon: BarChart3,
          badge: null,
          roles: [
            UserRole.ADMIN,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.MANAGER,
            UserRole.EMPLOYEE,
          ],
        },
        {
          id: 'audit-logs',
          label: t('nav_auditLogs'),
          icon: ShieldCheck,
          badge: null,
          roles: [UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER],
        },
        {
          id: 'postman-api',
          label: t('nav_postmanApi'),
          icon: Terminal,
          badge: 'REST',
          badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          roles: [
            UserRole.ADMIN,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.MANAGER,
            UserRole.EMPLOYEE,
          ],
        },
        {
          id: 'settings',
          label: t('nav_settings'),
          icon: Settings,
          badge: null,
          roles: [UserRole.ADMIN, UserRole.EMPLOYEE],
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 flex flex-col shrink-0 border-r border-slate-800 select-none">
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {navSections.map((section, sIndex) => {
          const visibleItems = section.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIndex} className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                {section.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-600/30 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isActive ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700'
                          }`}
                        />
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate text-xs">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                            item.badgeColor || (isActive ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-slate-800 text-slate-400 border-slate-700')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Project Leadership / Founder & Developer Card - VISIBLE ONLY TO EMPLOYEE ROLE */}
      {isEmployeeRole && onOpenFounderModal && (
        <div className="px-4 pb-2">
          <button
            onClick={onOpenFounderModal}
            className="w-full p-2.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 font-mono">
              NG
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-white group-hover:text-indigo-300 truncate flex items-center gap-1">
                <span>Navneet Gupta</span>
                <span className="text-[9px] text-amber-400">★</span>
              </div>
              <div className="text-[9px] text-indigo-300/80 truncate">Employee View • Founder Info</div>
            </div>
          </button>
        </div>
      )}

      {/* Storage / Workflow Capacity Widget at bottom */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t('nav_storageCapacity')}</span>
            <span className="text-[10px] text-slate-300 font-bold">84%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '84%' }} />
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-0.5">
            <span>{t('nav_clusterStatus')}</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 99.98%
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
