import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Product, InventoryTransaction, Category, Supplier } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { Modal } from '../components/common/Modal';
import { BulkProductImportModal } from '../components/products/BulkProductImportModal';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  MapPin,
  Building2,
  IndianRupee,
  Layers,
  Upload,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, txRes, catRes, supRes] = await Promise.all([
        api.getProducts(),
        api.getInventoryTransactions(),
        api.getCategories(),
        api.getSuppliers(),
      ]);

      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
      if (txRes.success && txRes.data) setTransactions(txRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (supRes.success && supRes.data) setSuppliers(supRes.data);
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalInventoryValuation = products.reduce((acc, p) => acc + p.unitPrice * p.quantity, 0);
  const lowStockCount = products.filter((p) => p.quantity <= p.minimumStock).length;

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduct) return;

    try {
      const res = await api.adjustInventory({
        productId: targetProduct.id,
        quantityChange: Number(adjustQty),
        reason: adjustReason || 'Physical warehouse inventory audit adjustment',
      });

      if (res.success) {
        showToast('success', 'Stock Adjusted', `Inventory updated for SKU ${targetProduct.productCode}`);
        setShowAdjustModal(false);
        fetchData();
      }
    } catch (err: any) {
      showToast('error', 'Adjustment Error', err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Warehouse Inventory & Stock Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time physical stock counts, warehouse aisle allocations, and immutable ledger movements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData()}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="inventory-bulk-import-btn"
            onClick={() => setShowBulkImportModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Bulk Product Import</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Inventory Valuation</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              ₹{(totalInventoryValuation / 100000).toFixed(2)} Lakh
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{products.length} registered SKUs</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Low Stock SKUs</span>
            <div className="text-xl font-extrabold text-rose-600 mt-1">{lowStockCount} Items</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Below safety buffer threshold</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Physical Units</span>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">
              {products.reduce((acc, p) => acc + p.quantity, 0)} Units
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all storage bays</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Current Warehouse Stock Holdings</h3>
          <span className="text-xs text-slate-500">{products.length} Products</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4">SKU / Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Warehouse Location</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Stock Health</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const isLow = p.quantity <= p.minimumStock;
                const bufferPct = Math.min(100, Math.round((p.quantity / p.maximumStock) * 100));

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="font-mono text-[10px] text-blue-600">{p.productCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.categoryName}</td>
                    <td className="py-3 px-4 text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.warehouseLocation}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ₹{p.unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-extrabold text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                        {p.quantity} {p.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Min: {p.minimumStock} • Max: {p.maximumStock}</span>
                    </td>
                    <td className="py-3 px-4 min-w-36">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isLow ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${bufferPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{bufferPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setTargetProduct(p);
                          setAdjustQty(0);
                          setAdjustReason('');
                          setShowAdjustModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Movement Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h3 className="text-base font-bold text-slate-900 mb-3">Inventory Movement Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">Transaction Type</th>
                <th className="pb-3">Product SKU</th>
                <th className="pb-3">Quantity Delta</th>
                <th className="pb-3">Reason / Context</th>
                <th className="pb-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 8).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80">
                  <td className="py-3">
                    <span className="font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-blue-600">{tx.productCode}</td>
                  <td className="py-3 font-extrabold font-mono">
                    <span className={tx.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">{tx.reason}</td>
                  <td className="py-3 text-slate-400 text-[11px]">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Adjust Stock */}
      {targetProduct && (
        <Modal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          title={`Inventory Adjustment: ${targetProduct.name}`}
          subtitle={`Product Code: ${targetProduct.productCode} • Current Balance: ${targetProduct.quantity} ${targetProduct.unit}`}
          maxWidth="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantity Delta (+ to add stock, - to deduct stock) *
              </label>
              <input
                type="number"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(Number(e.target.value))}
                placeholder="e.g. +10 or -3"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-base font-bold font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                New Stock Balance: {(targetProduct.quantity || 0) + Number(adjustQty)} {targetProduct.unit}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Stock Adjustment *</label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Quarterly physical stock audit recount"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-xs"
              >
                Save Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk Product Metadata Importer Modal */}
      <BulkProductImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportCompleted={() => {
          fetchData();
          showToast('success', 'Bulk Import Complete', 'Warehouse inventory and catalog refreshed.');
        }}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
};
