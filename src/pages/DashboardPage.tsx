import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { api } from '../api/client';
import { DashboardKPIs, UserRole } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge, RoleBadge } from '../components/common/Badge';
import { SupplierPerformanceCard } from '../components/dashboard/SupplierPerformanceCard';
import {
  IndianRupee,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Boxes,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  FileText,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tabId: string) => void;
  onOpenQuickDemo: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate, onOpenQuickDemo }) => {
  const { currentUser } = useAuth();
  const { t, formatDate } = useI18n();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardKPIs(currentUser.role);
      if (res.success && res.data) {
        setKpis(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  if (loading || !kpis) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Enterprise Dashboard Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Persona Greeting */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                {currentUser.department || 'Enterprise Logistics'}
              </span>
              <span className="text-slate-600">•</span>
              <RoleBadge role={currentUser.role} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {t('dash_welcomeBack', { name: currentUser.name })}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {t('dash_bannerSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenQuickDemo}
              className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('dash_runDemo')}</span>
            </button>
            <button
              onClick={() => onNavigate('requests')}
              className="px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('dash_newRequisition')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dash_totalSpend')}
          value={`₹${(kpis.totalProcurementSpend / 100000).toFixed(1)} Lakh`}
          subtitle={t('dash_totalSpendSub')}
          icon={IndianRupee}
          color="indigo"
          trend={{ value: '12.4%', isPositive: true }}
          onClick={() => onNavigate('reports')}
        />
        <StatCard
          title={t('dash_pendingApprovals')}
          value={kpis.pendingApprovals}
          subtitle={t('dash_pendingApprovalsSub')}
          icon={Clock}
          color="amber"
          onClick={() => onNavigate('approvals')}
        />
        <StatCard
          title={t('dash_activeOrders')}
          value={kpis.ordersInTransit}
          subtitle={t('dash_activeOrdersSub')}
          icon={Truck}
          color="purple"
          onClick={() => onNavigate('deliveries')}
        />
        <StatCard
          title={t('dash_lowStockAlerts')}
          value={kpis.lowStockProducts}
          subtitle={t('dash_lowStockSub')}
          icon={AlertTriangle}
          color="rose"
          onClick={() => onNavigate('inventory')}
        />
      </div>

      {/* Main Charts & Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spend Chart Card */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{t('dash_spendVelocity')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t('dash_spendVelocitySub')}</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dash_fullAnalytics')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* CSS-based Bar Chart Representation */}
          <div className="space-y-4 pt-2">
            {kpis.monthlySpendTrend.map((item, idx) => {
              const maxSpend = 5000000;
              const pct = Math.min(100, Math.round((item.spend / maxSpend) * 100));

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700 font-semibold">{item.month}</span>
                    <span className="text-slate-900">
                      ₹{(item.spend / 100000).toFixed(2)} L{' '}
                      <span className="text-slate-400 text-[11px]">({item.ordersCount} orders)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('dash_onTimeSla')}</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{kpis.onTimeDeliveryRate}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('dash_avgApprovalSla')}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{kpis.averageApprovalHours} {t('dash_hours')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('dash_catalogItems')}</p>
              <p className="text-xl font-bold text-indigo-600 mt-0.5">{kpis.totalProducts}</p>
            </div>
          </div>
        </div>

        {/* Requisition Status & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">{t('dash_statusMatrix')}</h3>
            <div className="space-y-2.5">
              {kpis.statusDistribution.map((st, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span className="text-xs font-semibold text-slate-800">{st.status}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {st.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigate('smart-procurement')}
                className="w-full py-2 px-3 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold flex items-center justify-center gap-2 border border-indigo-200 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('dash_openSmartProcurement')}</span>
              </button>
            </div>
          </div>

          {/* Quick Nav Shortcuts */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{t('dash_fastOps')}</h4>
            <button
              onClick={() => onNavigate('approvals')}
              className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200 flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>{t('dash_approvalsWorkbench')}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => onNavigate('workflow-engine')}
              className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200 flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <Boxes className="w-4 h-4 text-indigo-600" />
                <span>{t('dash_workflowEngine')}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Supplier Performance Rating & Ranking Card (Live API Metrics) */}
      <SupplierPerformanceCard onNavigate={onNavigate} />

      {/* Recent Activity Audit Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{t('dash_auditTrail')}</h3>
            <p className="text-xs text-slate-500">{t('dash_auditTrailSub')}</p>
          </div>
          <button
            onClick={() => onNavigate('audit-logs')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{t('dash_fullAuditLog')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <th className="px-6 py-3">{t('dash_tableAction')}</th>
                <th className="px-6 py-3">{t('dash_tableEntity')}</th>
                <th className="px-6 py-3">{t('dash_tableActor')}</th>
                <th className="px-6 py-3">{t('dash_tableDetails')}</th>
                <th className="px-6 py-3">{t('dash_tableTimestamp')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {kpis.recentActivities.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-900">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-indigo-600">{log.entityId}</td>
                  <td className="px-6 py-3.5 text-slate-700">
                    <div className="font-medium">{log.userName}</div>
                    <span className="text-[10px] text-slate-400">{log.userRole}</span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate">{log.newValue}</td>
                  <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                    {formatDate(log.timestamp, { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

