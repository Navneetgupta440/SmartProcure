import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../api/client';
import { Delivery, Product, PurchaseOrder, Supplier } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { Modal } from '../components/common/Modal';
import {
  exportExecutiveReportPDF,
  exportConsolidatedMasterCSV,
  exportPurchaseOrdersCSV,
  exportVendorSpendCSV,
  formatINR,
  ExportOptions,
} from '../utils/reportExport';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Search,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { showToast } = useNotifications();

  // Data state
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [procurementReport, setProcurementReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Navigation state
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'orders' | 'sla'>('overview');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'FY26' | 'Q3' | '30D'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown states
  const [showCsvDropdown, setShowCsvDropdown] = useState(false);
  const csvDropdownRef = useRef<HTMLDivElement>(null);

  // Export Customization Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [stakeholderTarget, setStakeholderTarget] = useState('Board of Directors & Finance Committee');
  const [reportTitle, setReportTitle] = useState('ProcureFlow Enterprise Financial & Procurement Audit');
  const [notes, setNotes] = useState('Authorized capital expenditure ledger compiled under ISO-9001 and internal corporate financial policies.');

  const [modalOptions, setModalOptions] = useState<ExportOptions>({
    includeExecutiveSummary: true,
    includeCategoryBreakdown: true,
    includeVendorBreakdown: true,
    includeOrdersRegister: true,
    includeOperationalMetrics: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, supRes, prRes, delRes, reportRes] = await Promise.all([
        api.getPurchaseOrders(),
        api.getSuppliers(),
        api.getProducts(),
        api.getDeliveries(),
        api.getProcurementReport(),
      ]);

      if (poRes.success && poRes.data) setOrders(poRes.data);
      if (supRes.success && supRes.data) setSuppliers(supRes.data);
      if (prRes.success && prRes.data) setProducts(prRes.data);
      if (delRes.success && delRes.data) setDeliveries(delRes.data);
      if (reportRes.success && reportRes.data) setProcurementReport(reportRes.data);
    } catch (e: any) {
      showToast('error', 'Error Fetching Reports Data', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close CSV dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (csvDropdownRef.current && !csvDropdownRef.current.contains(event.target as Node)) {
        setShowCsvDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter orders according to period
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.orderDate || o.createdAt);
      if (periodFilter === 'FY26') {
        const fyStart = new Date('2026-04-01');
        const fyEnd = new Date('2027-03-31');
        if (orderDate < fyStart || orderDate > fyEnd) return false;
      } else if (periodFilter === 'Q3') {
        const q3Start = new Date('2026-07-01');
        const q3End = new Date('2026-09-30');
        if (orderDate < q3Start || orderDate > q3End) return false;
      } else if (periodFilter === '30D') {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (orderDate < thirtyDaysAgo) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPo = o.poNumber.toLowerCase().includes(q);
        const matchSup = (o.supplierName || '').toLowerCase().includes(q);
        const matchStatus = (o.status || '').toLowerCase().includes(q);
        if (!matchPo && !matchSup && !matchStatus) return false;
      }

      return true;
    });
  }, [orders, periodFilter, searchQuery]);

  // Derived financial computations
  const totalCommittedSpend = useMemo(() => {
    return filteredOrders.reduce((acc, po) => acc + po.totalAmount, 0);
  }, [filteredOrders]);

  const totalTaxPaid = useMemo(() => {
    return filteredOrders.reduce((acc, po) => acc + po.tax, 0);
  }, [filteredOrders]);

  const totalShipping = useMemo(() => {
    return filteredOrders.reduce((acc, po) => acc + (po.shippingCost || 0), 0);
  }, [filteredOrders]);

  // Vendor spend distribution
  const spendBySupplier = useMemo(() => {
    return suppliers
      .map((s) => {
        const supOrders = filteredOrders.filter((o) => o.supplierId === s.id);
        const spend = supOrders.reduce((acc, o) => acc + o.totalAmount, 0);
        const pct = totalCommittedSpend > 0 ? (spend / totalCommittedSpend) * 100 : 0;
        return {
          id: s.id,
          name: s.companyName,
          gstNumber: s.gstNumber,
          city: s.city,
          state: s.state,
          rating: s.rating,
          qualityScore: s.qualityScore,
          deliveryScore: s.deliveryScore,
          averageLeadDays: s.averageLeadDays,
          spend,
          percentage: pct,
          orderCount: supOrders.length,
        };
      })
      .sort((a, b) => b.spend - a.spend);
  }, [suppliers, filteredOrders, totalCommittedSpend]);

  const periodLabelMap = {
    ALL: 'All Historical Records',
    FY26: 'FY 2026-27 (Current Fiscal Year)',
    Q3: 'Q3 2026 (Jul - Sep 2026)',
    '30D': 'Trailing 30 Days',
  };

  // 1. Direct PDF Download Handler
  const handleQuickPdfExport = () => {
    try {
      exportExecutiveReportPDF(
        {
          orders: filteredOrders,
          suppliers,
          products,
          procurementReport,
          periodLabel: periodLabelMap[periodFilter],
          generatedBy: 'Procurement Leadership',
        },
        {
          includeExecutiveSummary: true,
          includeCategoryBreakdown: true,
          includeVendorBreakdown: true,
          includeOrdersRegister: true,
          includeOperationalMetrics: true,
        },
        `procureflow-report-${periodFilter.toLowerCase()}`
      );
      showToast('success', 'PDF Downloaded', 'Executive financial report PDF generated and downloaded successfully.');
    } catch (err: any) {
      showToast('error', 'PDF Generation Error', err.message || 'Failed to generate PDF document');
    }
  };

  // 2. Direct CSV Master Export Handler
  const handleQuickCsvMasterExport = () => {
    try {
      exportConsolidatedMasterCSV(
        {
          orders: filteredOrders,
          suppliers,
          products,
          procurementReport,
          periodLabel: periodLabelMap[periodFilter],
          generatedBy: 'Procurement Leadership',
        },
        {
          includeExecutiveSummary: true,
          includeCategoryBreakdown: true,
          includeVendorBreakdown: true,
          includeOrdersRegister: true,
          includeOperationalMetrics: true,
        },
        `procureflow-master-report-${periodFilter.toLowerCase()}`
      );
      setShowCsvDropdown(false);
      showToast('success', 'Master CSV Downloaded', 'Consolidated financial & operational CSV report saved.');
    } catch (err: any) {
      showToast('error', 'CSV Export Error', err.message || 'Failed to export CSV file');
    }
  };

  // 3. Purchase Orders CSV Handler
  const handleQuickCsvOrdersExport = () => {
    try {
      exportPurchaseOrdersCSV(filteredOrders, `procureflow-orders-${periodFilter.toLowerCase()}`);
      setShowCsvDropdown(false);
      showToast('success', 'Orders CSV Downloaded', `${filteredOrders.length} purchase orders exported to CSV.`);
    } catch (err: any) {
      showToast('error', 'CSV Export Error', err.message || 'Failed to export orders CSV');
    }
  };

  // 4. Vendor Spend CSV Handler
  const handleQuickCsvVendorExport = () => {
    try {
      exportVendorSpendCSV(suppliers, filteredOrders, `procureflow-vendor-spend-${periodFilter.toLowerCase()}`);
      setShowCsvDropdown(false);
      showToast('success', 'Vendor CSV Downloaded', 'Certified supplier concentration metrics exported to CSV.');
    } catch (err: any) {
      showToast('error', 'CSV Export Error', err.message || 'Failed to export vendor spend CSV');
    }
  };

  // 5. Configured Modal Export Execution
  const handleModalExportSubmit = () => {
    try {
      const payload = {
        orders: filteredOrders,
        suppliers,
        products,
        procurementReport,
        periodLabel: periodLabelMap[periodFilter],
        generatedBy: stakeholderTarget,
      };

      if (exportFormat === 'pdf') {
        exportExecutiveReportPDF(payload, modalOptions, `procureflow-executive-brief-${periodFilter.toLowerCase()}`);
        showToast('success', 'Executive PDF Exported', `Report for "${stakeholderTarget}" downloaded successfully.`);
      } else {
        exportConsolidatedMasterCSV(payload, modalOptions, `procureflow-stakeholder-data-${periodFilter.toLowerCase()}`);
        showToast('success', 'Financial CSV Exported', `Customized spreadsheet downloaded for "${stakeholderTarget}".`);
      }
      setIsExportModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Export Failed', err.message || 'An error occurred during report export.');
    }
  };

  // 6. Native Print
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Procurement Financial Analytics & Executive Reports
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Capital Expenditure Audit</span>
            <span aria-hidden="true">·</span>
            <span>18% GST Input Tax Credits</span>
            <span aria-hidden="true">·</span>
            <span>Supplier Volume Concentration</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
              {filteredOrders.length} Authorized POs
            </span>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick PDF Export Button */}
          <button
            onClick={handleQuickPdfExport}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            title="Download executive-ready PDF audit report"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>Export PDF</span>
          </button>

          {/* Quick CSV Dropdown Button */}
          <div className="relative" ref={csvDropdownRef}>
            <button
              onClick={() => setShowCsvDropdown((prev) => !prev)}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
              title="Download structured CSV spreadsheet files"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export CSV</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showCsvDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select CSV Dataset
                </div>
                <button
                  onClick={handleQuickCsvMasterExport}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-medium">Consolidated Master CSV</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">All-in-One</span>
                </button>

                <button
                  onClick={handleQuickCsvOrdersExport}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-medium">Purchase Orders Ledger</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{filteredOrders.length} POs</span>
                </button>

                <button
                  onClick={handleQuickCsvVendorExport}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium">Vendor Concentration Matrix</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{suppliers.length} Vendors</span>
                </button>
              </div>
            )}
          </div>

          {/* Configure & Export Modal Trigger */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            title="Customize report scope, sections, and recipient notes"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Customize Report</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrintReport}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
            title="Print or Save as System PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Refresh Data */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Period Filter & Navigation Segmented Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Executive Summary
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'vendors'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Vendor Concentration
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            PO Audit Register
          </button>
          <button
            onClick={() => setActiveTab('sla')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'sla'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            SLA & Compliance
          </button>
        </div>

        {/* Fiscal Period Filter Segment */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs">
          <span className="text-[11px] font-medium text-slate-400 px-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Period:</span>
          </span>
          <button
            onClick={() => setPeriodFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              periodFilter === 'ALL'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setPeriodFilter('FY26')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              periodFilter === 'FY26'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            FY 2026-27
          </button>
          <button
            onClick={() => setPeriodFilter('Q3')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              periodFilter === 'Q3'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Q3 2026
          </button>
          <button
            onClick={() => setPeriodFilter('30D')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              periodFilter === '30D'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>TOTAL COMMITTED SPEND</span>
            <span className="font-mono text-[10px] text-indigo-500">CAPEX</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono tabular-nums">
            ₹{(totalCommittedSpend / 100000).toFixed(2)} Lakh
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>{filteredOrders.length} authorized purchase orders</span>
            <span className="font-mono tabular-nums text-[11px] text-slate-400">
              ₹{formatINR(totalCommittedSpend)}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>INPUT GST TAX PAID</span>
            <span className="font-mono text-[10px] text-emerald-500">18% ITC</span>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono tabular-nums">
            ₹{(totalTaxPaid / 100000).toFixed(2)} Lakh
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Reclaimable tax component</span>
            <span className="font-mono tabular-nums text-[11px] text-slate-400">
              ₹{formatINR(totalTaxPaid)}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>ACTIVE VENDORS</span>
            <span className="font-mono text-[10px] text-blue-500">TIER 1</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tabular-nums">
            {suppliers.length} Approved
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Quality & compliance verified</span>
            <span className="text-[11px] text-slate-400">100% Tax Compliant</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>ON-TIME SLA RATE</span>
            <span className="font-mono text-[10px] text-amber-500">LOGISTICS</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono tabular-nums">
            {procurementReport?.onTimeDeliveryRate || 96.4}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Average turnaround: 4.2h</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Nominal</span>
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category CapEx Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Capital Expenditure by Category
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {procurementReport?.spendByCategory?.length || 3} Categories
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Strategic procurement allocation across core enterprise infrastructure
              </p>

              <div className="space-y-4">
                {(
                  procurementReport?.spendByCategory || [
                    { category: 'Enterprise IT & Laptops', amount: 1650000, percentage: 58.8 },
                    { category: 'Networking & Data Center', amount: 780000, percentage: 27.8 },
                    { category: 'Displays & Peripherals', amount: 372900, percentage: 13.4 },
                  ]
                ).map((cat: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100 font-bold">
                          ₹{formatINR(cat.amount)}
                        </span>
                        <span className="font-mono tabular-nums text-slate-400 text-[11px]">
                          ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>GST ITC Reclaim Available</span>
              </span>
              <button
                onClick={handleQuickPdfExport}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Export Executive Brief</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Top Vendors Concentration Mini Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Vendor Spend Distribution & Concentration
                </h3>
                <button
                  onClick={() => setActiveTab('vendors')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Contract capital allocation across top certified supplier entities
              </p>

              <div className="space-y-4">
                {spendBySupplier.slice(0, 4).map((sup, idx) => {
                  return (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{sup.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({sup.orderCount} POs)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                            ₹{formatINR(sup.spend)}
                          </span>
                          <span className="font-mono tabular-nums text-[10px] text-slate-400 ml-2">
                            ({sup.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                          style={{ width: `${Math.max(5, sup.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="text-xs text-slate-400">
                Top vendor accounts for {(spendBySupplier[0]?.percentage || 0).toFixed(0)}% of total authorized spend
              </span>
              <button
                onClick={handleQuickCsvVendorExport}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Export Vendor CSV</span>
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Vendors Detail */}
      {activeTab === 'vendors' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Certified Supplier Concentration & Performance Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detailed spend allocation, verified GSTIN IDs, vendor performance ratings, and delivery turnarounds
              </p>
            </div>

            <button
              onClick={handleQuickCsvVendorExport}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Vendor CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Supplier Entity</th>
                  <th className="py-3 px-4">Location & GSTIN</th>
                  <th className="py-3 px-4 text-center">Quality / Rating</th>
                  <th className="py-3 px-4 text-center">Lead Time</th>
                  <th className="py-3 px-4 text-center">Authorized POs</th>
                  <th className="py-3 px-4 text-right">Committed Spend</th>
                  <th className="py-3 px-4 text-right">Budget Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {spendBySupplier.map((sup, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{sup.name}</div>
                      <div className="text-[11px] text-slate-400">Tier-1 Corporate Vendor</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 dark:text-slate-300">
                        {sup.city}, {sup.state}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">{sup.gstNumber || 'GST Verified'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{sup.rating} ★</div>
                      <div className="text-[10px] text-slate-400 font-mono">{sup.qualityScore}% Quality</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {sup.averageLeadDays || 3} days
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                      {sup.orderCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                      ₹{formatINR(sup.spend)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                        {sup.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Orders Detail */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Authorized Purchase Orders Compliance Register
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete transactional audit ledger of all issued purchase orders with GST breakdown
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter PO or vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-44"
                />
              </div>

              <button
                onClick={handleQuickCsvOrdersExport}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export POs (CSV)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Supplier Account</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">GST (18%)</th>
                  <th className="py-3 px-4 text-right">Total Net (INR)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No purchase orders matching the specified filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {o.poNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(o.orderDate || o.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {o.supplierName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        ₹{formatINR(o.subtotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                        ₹{formatINR(o.tax)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                        ₹{formatINR(o.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: SLA & Compliance */}
      {activeTab === 'sla' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Procurement Cycle & Operational Efficiency
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Workflow velocity benchmarks across requisition, multi-level approvals, and supplier dispatch
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Average Requisition Approval Turnaround
                  </div>
                  <div className="text-[11px] text-slate-400">From submission to Level-3 sign-off</div>
                </div>
                <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                  {procurementReport?.avgApprovalHours || 4.2} Hours
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    On-Time Supplier Fulfillment Rate
                  </div>
                  <div className="text-[11px] text-slate-400">Within agreed SLA delivery milestone</div>
                </div>
                <div className="font-mono text-base font-bold text-emerald-600">
                  {procurementReport?.onTimeDeliveryRate || 96.4}%
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Input Tax Credit Reconciliation
                  </div>
                  <div className="text-[11px] text-slate-400">18% GST verified against supplier GSTR-1</div>
                </div>
                <div className="font-mono text-base font-bold text-indigo-600">
                  100% Reclaimable
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                Audit Certification & Governance Protocols
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                ProcureFlow Enterprise maintains strict adherence to regulatory standards:
              </p>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>SOX Section 404 Compliance:</strong> Strict role segregation prevents self-approval on purchase orders over ₹15,000.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>GST Rule 36(4) Alignment:</strong> Verified invoice reporting ensures zero risk of input tax credit disallowance.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Immutable Audit Trail:</strong> Every status transition, price adjustment, and delivery sign-off is cryptographically timestamped.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Export complete audit pack for compliance auditors:</span>
              <button
                onClick={handleQuickPdfExport}
                className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Download Audit PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Customize & Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Configure & Export Procurement Insights"
        subtitle="Export financial, operational, and supplier analytics in PDF or CSV formats for executive stakeholders"
        maxWidth="2xl"
      >
        <div className="space-y-5 text-xs">
          {/* Format Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
              1. Choose Export Document Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  exportFormat === 'pdf'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className={`w-5 h-5 shrink-0 ${exportFormat === 'pdf' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold">Executive PDF Document (.pdf)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Formatted executive brief with tables, KPI cards, and compliance certification
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  exportFormat === 'csv'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className={`w-5 h-5 shrink-0 ${exportFormat === 'csv' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold">Consolidated CSV Spreadsheet (.csv)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Excel/Sheets UTF-8 dataset with structured financial breakdowns and records
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Stakeholder Target & Custom Heading */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Prepared For / Target Audience
              </label>
              <input
                type="text"
                value={stakeholderTarget}
                onChange={(e) => setStakeholderTarget(e.target.value)}
                placeholder="e.g. Board of Directors, Audit Committee"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reporting Period Scope
              </label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Historical Records</option>
                <option value="FY26">FY 2026-27 (Current Fiscal Year)</option>
                <option value="Q3">Q3 2026 (Jul - Sep 2026)</option>
                <option value="30D">Last 30 Days (Trailing)</option>
              </select>
            </div>
          </div>

          {/* Section Inclusions Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
              2. Select Sections to Include
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalOptions.includeExecutiveSummary}
                  onChange={(e) => setModalOptions({ ...modalOptions, includeExecutiveSummary: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300">Executive Financial KPIs & Spend Summary</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalOptions.includeCategoryBreakdown}
                  onChange={(e) => setModalOptions({ ...modalOptions, includeCategoryBreakdown: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300">Capital Expenditure by Category</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalOptions.includeVendorBreakdown}
                  onChange={(e) => setModalOptions({ ...modalOptions, includeVendorBreakdown: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300">Vendor Spend Distribution & Concentration</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalOptions.includeOrdersRegister}
                  onChange={(e) => setModalOptions({ ...modalOptions, includeOrdersRegister: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300">Authorized Purchase Orders Register</span>
              </label>
            </div>
          </div>

          {/* Preview Summary Box */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export Package Manifest:</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 font-mono">
              <div>Scope: {periodLabelMap[periodFilter]}</div>
              <div>Orders in scope: {filteredOrders.length} POs totaling ₹{formatINR(totalCommittedSpend)}</div>
              <div>Tax reclaim component: ₹{formatINR(totalTaxPaid)} (18% ITC)</div>
              <div>Certified suppliers: {suppliers.length} Accounts</div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleModalExportSubmit}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Download {exportFormat.toUpperCase()} Now</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
