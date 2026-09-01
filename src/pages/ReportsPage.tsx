import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Product, PurchaseOrder, Supplier } from '../types';
import { useNotifications } from '../context/NotificationContext';
import {
  BarChart3,
  Download,
  IndianRupee,
  Calendar,
  Building2,
  TrendingUp,
  PieChart,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, supRes, prRes] = await Promise.all([
        api.getPurchaseOrders(),
        api.getSuppliers(),
        api.getProducts(),
      ]);

      if (poRes.success && poRes.data) setOrders(poRes.data);
      if (supRes.success && supRes.data) setSuppliers(supRes.data);
      if (prRes.success && prRes.data) setProducts(prRes.data);
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCommittedSpend = orders.reduce((acc, po) => acc + po.totalAmount, 0);
  const totalTaxPaid = orders.reduce((acc, po) => acc + po.tax, 0);

  // Group by Supplier
  const spendBySupplier = suppliers.map((s) => {
    const supOrders = orders.filter((o) => o.supplierId === s.id);
    const spend = supOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    return {
      name: s.companyName,
      spend,
      orderCount: supOrders.length,
      rating: s.rating,
    };
  }).sort((a, b) => b.spend - a.spend);

  const handleExportFullReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      totalSpend: totalCommittedSpend,
      totalTax: totalTaxPaid,
      totalOrders: orders.length,
      supplierBreakdown: spendBySupplier,
      ordersSummary: orders.map((o) => ({
        poNumber: o.poNumber,
        supplier: o.supplierName,
        total: o.totalAmount,
        status: o.status,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `procureflow-executive-report-${Date.now()}.json`;
    a.click();
    showToast('success', 'Report Exported', 'Executive financial report downloaded');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Procurement Financial Analytics & Executive Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Capital expenditure breakdown, GST tax liability, vendor volume concentration, and budget audits
          </p>
        </div>

        <button
          onClick={handleExportFullReport}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics Report</span>
        </button>
      </div>

      {/* Spend Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Authorized PO Spend
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{(totalCommittedSpend / 100000).toFixed(2)} Lakh
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{orders.length} authorized purchase orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Input GST Tax Paid
          </span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            ₹{(totalTaxPaid / 100000).toFixed(2)} Lakh
          </div>
          <p className="text-[11px] text-slate-500 mt-1">18% ITC reclaimable tax component</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active Vendor Partners
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{suppliers.length} Approved</div>
          <p className="text-[11px] text-slate-500 mt-1">Across hardware, cloud & logistics</p>
        </div>
      </div>

      {/* Supplier Spend Concentration */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Vendor Spend Distribution & Concentration</h3>
        <p className="text-xs text-slate-500 mb-4">Contract capital allocation across certified supplier accounts</p>

        <div className="space-y-4">
          {spendBySupplier.map((sup, idx) => {
            const pct = totalCommittedSpend > 0 ? Math.round((sup.spend / totalCommittedSpend) * 100) : 0;

            return (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{sup.name}</span>
                    <span className="text-[10px] text-slate-400">({sup.orderCount} POs)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900">₹{sup.spend.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 ml-2">({pct}%)</span>
                  </div>
                </div>

                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
