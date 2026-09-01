import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PurchaseRequest, Product, PurchaseRequestStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  Building2,
  ShieldAlert,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface PurchaseRequestsPageProps {
  onOpenDirectApproval?: (requestId: string) => void;
}

export const PurchaseRequestsPage: React.FC<PurchaseRequestsPageProps> = ({ onOpenDirectApproval }) => {
  const { currentUser } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  // Requisition Builder State
  const [department, setDepartment] = useState(currentUser.department || 'Cloud Infrastructure & Engineering');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, prodRes] = await Promise.all([
        api.getPurchaseRequests({ status: statusFilter || undefined }),
        api.getProducts(),
      ]);

      if (reqRes.success && reqRes.data) setRequests(reqRes.data);
      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: 'productId' | 'quantity', val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Live estimated calculation
  const estimatedTotalAmount = items.reduce((acc, item) => {
    const p = products.find((prod) => prod.id === item.productId);
    return acc + (p ? p.unitPrice * (Number(item.quantity) || 0) : 0);
  }, 0);

  const calculateRequiredTiers = (amt: number) => {
    if (amt <= 15000) return '1 Tier (Manager Approval Only)';
    if (amt <= 100000) return '2 Tiers (Manager → Procurement Manager)';
    return '3 Tiers (Manager → Procurement Manager → Executive Admin)';
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('error', 'Validation Error', 'Please select at least one valid product.');
      return;
    }

    try {
      const res = await api.createPurchaseRequest({
        userId: currentUser.id,
        department,
        priority,
        reason,
        items: validItems,
      });

      if (res.success) {
        await refreshNotifications();
        showToast(
          'success',
          'New Purchase Request For Approval',
          `Requisition ${res.data.requestNumber} (₹${res.data.estimatedAmount.toLocaleString('en-IN')}) submitted for approval.`,
          {
            label: 'Review / Approve Requisition →',
            onClick: () => {
              if (onOpenDirectApproval) {
                onOpenDirectApproval(res.data.id);
              }
            },
          }
        );
        setShowCreateModal(false);
        setReason('');
        setItems([{ productId: '', quantity: 1 }]);
        fetchData();
      }
    } catch (err: any) {
      showToast('error', 'Creation Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">Purchase Requisitions Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, track, and monitor material requisitions across multi-level approval hierarchies
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Request</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        {['', 'PENDING_APPROVAL', 'APPROVED', 'CONVERTED_TO_PO', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {st ? st.replace(/_/g, ' ') : 'All Requisitions'}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">Loading purchase requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Requisitions Found</h4>
            <p className="text-xs text-slate-400 mt-1">Create a purchase request to begin the approval lifecycle</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Requester & Dept</th>
                  <th className="py-3 px-4">Items / Reason</th>
                  <th className="py-3 px-4">Est. Amount</th>
                  <th className="py-3 px-4">Approval Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {req.requestNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{req.requesterName}</div>
                      <div className="text-[11px] text-slate-500">{req.department}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 line-clamp-1">
                        {req.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{req.reason}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{req.estimatedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        Level {req.currentApprovalLevel} / {req.approvalLevelRequired}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === 'PENDING_APPROVAL' && onOpenDirectApproval && (
                          <button
                            onClick={() => onOpenDirectApproval(req.id)}
                            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition"
                            title="Direct Review & Approval Modal"
                          >
                            <span>Review / Approve</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition font-semibold cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Requisition */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Draft & Submit Purchase Requisition"
        subtitle="Specify product line items, required quantities, priority tier, and business justification"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Requesting Department *</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority Classification</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Requested Catalog Line Items</label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => {
                const selectedProd = products.find((p) => p.id === item.productId);
                const lineTotal = selectedProd ? selectedProd.unitPrice * item.quantity : 0;

                return (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex-1">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="">Select Product from Catalog...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.productCode} - {p.name} (₹{p.unitPrice.toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => updateItemRow(idx, 'quantity', Number(e.target.value))}
                        placeholder="Qty"
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-center font-bold"
                      />
                    </div>

                    <div className="w-28 text-right font-mono font-bold text-slate-800">
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Justification / Reason *</label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Approved team expansion requirement for new cloud engineers"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          {/* Real-time Approval Threshold Summary Card */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-blue-950">
              <span>Total Estimated Requisition Value:</span>
              <span className="text-base font-extrabold text-blue-900">
                ₹{estimatedTotalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[11px] text-blue-700 flex items-center gap-1.5 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Routing Pathway: {calculateRequiredTiers(estimatedTotalAmount)}</span>
            </div>
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
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-xs"
            >
              Submit for Approval
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Details */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Purchase Requisition: ${selectedRequest.requestNumber}`}
          subtitle={`Requested by ${selectedRequest.requesterName} (${selectedRequest.department})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block">Status</span>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Priority</span>
                <span className="font-bold text-slate-800">{selectedRequest.priority}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Approval Level</span>
                <span className="font-bold text-slate-800">
                  Level {selectedRequest.currentApprovalLevel} / {selectedRequest.approvalLevelRequired}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Created Date</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-1">Business Reason</h4>
              <p className="p-2.5 rounded-xl bg-slate-50 text-slate-700 leading-relaxed border border-slate-100">
                {selectedRequest.reason}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Line Items</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedRequest.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-white text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {item.productCode} • {item.quantity} {item.unit} @ ₹{item.unitPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="font-mono font-extrabold text-slate-900">
                      ₹{item.estimatedTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between font-bold">
              <span>Total Estimated Amount</span>
              <span className="text-base text-emerald-400">
                ₹{selectedRequest.estimatedAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
