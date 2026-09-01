import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PurchaseOrder, PurchaseRequest, Supplier, PurchaseOrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  ShoppingBag,
  Plus,
  Printer,
  FileText,
  Building2,
  Calendar,
  Truck,
  IndianRupee,
  Download,
  Eye,
  CheckCircle2,
  Send,
} from 'lucide-react';

export const PurchaseOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [approvedPRs, setApprovedPRs] = useState<PurchaseRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Form
  const [selectedPrId, setSelectedPrId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(2500);
  const [expectedDays, setExpectedDays] = useState(4);
  const [remarks, setRemarks] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, prRes, supRes] = await Promise.all([
        api.getPurchaseOrders(),
        api.getPurchaseRequests({ status: 'APPROVED' }),
        api.getSuppliers(),
      ]);

      if (poRes.success && poRes.data) setOrders(poRes.data);
      if (prRes.success && prRes.data) setApprovedPRs(prRes.data);
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

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrId || !selectedSupplierId) {
      showToast('error', 'Validation Error', 'Please select an approved request and supplier.');
      return;
    }

    try {
      const res = await api.createPurchaseOrder({
        purchaseRequestId: selectedPrId,
        supplierId: selectedSupplierId,
        creatorId: currentUser.id,
        discount: Number(discount),
        shippingCost: Number(shippingCost),
        expectedDays: Number(expectedDays),
        remarks,
      });

      if (res.success) {
        showToast('success', 'Purchase Order Issued', `PO ${res.data.poNumber} generated and transmitted to vendor.`);
        setShowCreateModal(false);
        fetchData();
      }
    } catch (err: any) {
      showToast('error', 'PO Generation Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Purchase Orders Registry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Legally binding procurement contracts, supplier fulfillment tracking, and GST invoices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (approvedPRs.length === 0) {
                showToast('info', 'No Approved PRs', 'There are no approved purchase requests waiting for PO conversion.');
              }
              if (approvedPRs.length > 0) setSelectedPrId(approvedPRs[0].id);
              if (suppliers.length > 0) setSelectedSupplierId(suppliers[0].id);
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate PO from Approved PR ({approvedPRs.length})</span>
          </button>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">Loading purchase orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Purchase Orders Issued Yet</h4>
            <p className="text-xs text-slate-400 mt-1">Convert approved purchase requisitions to generate POs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier Partner</th>
                  <th className="py-3 px-4">Order Date / Delivery</th>
                  <th className="py-3 px-4">Subtotal + GST</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {po.poNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Ref: {po.requestNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{po.supplierName}</div>
                      <div className="text-[11px] text-slate-400">{po.supplierEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{new Date(po.orderDate).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-400">
                        Exp: {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      ₹{po.subtotal.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] text-slate-400 font-mono">+ ₹{po.tax.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                      ₹{po.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedPO(po);
                          setShowInvoiceModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition font-bold inline-flex items-center gap-1"
                        title="Print / View Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Invoice PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create PO from Approved PR */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Issue Purchase Order"
        subtitle="Transmit authorized purchase order contract to vendor with commercial terms"
        maxWidth="xl"
      >
        <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Fully Approved Requisition *</label>
            <select
              required
              value={selectedPrId}
              onChange={(e) => setSelectedPrId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              {approvedPRs.length === 0 && <option value="">No approved requisitions available</option>}
              {approvedPRs.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.requestNumber} • {pr.requesterName} (₹{pr.estimatedAmount.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Vendor / Supplier Partner *</label>
            <select
              required
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName} ({s.rating}★, Lead: {s.averageLeadDays} days, Quality: {s.qualityScore}%)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Volume Discount (₹)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Freight & Shipping (₹)</label>
              <input
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Delivery Lead (Days)</label>
              <input
                type="number"
                value={expectedDays}
                onChange={(e) => setExpectedDays(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Special Delivery Remarks / Instructions</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Deliver to Receiving Bay 2, include calibration certificate"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Issue Purchase Order</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Printable / Exportable PO Invoice */}
      {selectedPO && (
        <Modal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          title={`Purchase Order Invoice: ${selectedPO.poNumber}`}
          subtitle="Print-ready corporate purchase order voucher"
          maxWidth="3xl"
        >
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 text-xs text-slate-800 font-sans print:border-none">
            {/* Header Voucher */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">PROCUREFLOW CORP</h1>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  HQ Outer Ring Road, Tech Park, Bengaluru, Karnataka - 560103
                </p>
                <p className="text-[11px] text-slate-500">GSTIN: 29AAACP9911D1Z1 • procurement@procureflow.com</p>
              </div>

              <div className="text-right">
                <span className="text-base font-extrabold text-blue-600 font-mono">{selectedPO.poNumber}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Date: {new Date(selectedPO.orderDate).toLocaleDateString()}
                </p>
                <span className="inline-block mt-1">
                  <StatusBadge status={selectedPO.status} />
                </span>
              </div>
            </div>

            {/* Vendor & Shipping Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Vendor Partner (Supplier)
                </span>
                <div className="font-bold text-slate-900 text-sm">{selectedPO.supplierName}</div>
                <p className="text-slate-500 mt-0.5">{selectedPO.supplierEmail}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Ship To & Invoicing Address
                </span>
                <div className="font-bold text-slate-900">ProcureFlow Receiving & QA Center</div>
                <p className="text-slate-500 mt-0.5">Expected SLA: {new Date(selectedPO.expectedDeliveryDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPO.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{item.productCode}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold">₹{item.totalPrice.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculation Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{selectedPO.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Applicable GST (18%):</span>
                  <span className="font-semibold">₹{selectedPO.tax.toLocaleString('en-IN')}</span>
                </div>
                {selectedPO.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>- ₹{selectedPO.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Freight / Logistics:</span>
                  <span className="font-semibold">₹{selectedPO.shippingCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>₹{selectedPO.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-400">
              <div>
                <div className="h-10 border-b border-dashed border-slate-300" />
                <p className="mt-1 font-semibold text-slate-600">Authorized Procurement Officer Signature</p>
                <p>{selectedPO.creatorName}</p>
              </div>
              <div className="text-right">
                <div className="h-10 border-b border-dashed border-slate-300" />
                <p className="mt-1 font-semibold text-slate-600">Supplier Acceptance Acknowledgement</p>
                <p>{selectedPO.supplierName}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
