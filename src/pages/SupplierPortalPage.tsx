import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PurchaseOrder, Delivery } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Store,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  Send,
  Boxes,
  Clock,
  Building2,
  Calendar,
} from 'lucide-react';

export const SupplierPortalPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispatch Modal
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [carrier, setCarrier] = useState('BlueDart Express Air');
  const [shippingAddress, setShippingAddress] = useState('ProcureFlow HQ, Outer Ring Road, Bengaluru');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getPurchaseOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const handleAccept = async (poId: string) => {
    try {
      const res = await api.supplierAcceptPO(poId, currentUser.id);
      if (res.success) {
        showToast('success', 'Order Accepted', 'Purchase order status updated to SUPPLIER_ACCEPTED');
        fetchOrders();
      }
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const handleProcess = async (poId: string) => {
    try {
      const res = await api.supplierProcessPO(poId, currentUser.id);
      if (res.success) {
        showToast('info', 'Order in Processing', 'Consignment packaging initiated');
        fetchOrders();
      }
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    try {
      setIsSubmitting(true);
      const res = await api.supplierDispatchPO(selectedPO.id, {
        supplierUserId: currentUser.id,
        carrier,
        shippingAddress,
        deliveryAgentId: 'usr-del-01',
      });

      if (res.success) {
        showToast(
          'success',
          'Consignment Dispatched!',
          `Tracking: ${res.data.delivery.trackingNumber} assigned to ${carrier}`
        );
        setSelectedPO(null);
        fetchOrders();
      }
    } catch (err: any) {
      showToast('error', 'Dispatch Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">Supplier Order Fulfillment Hub</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
              Partner Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Accept corporate purchase contracts, update warehouse fulfillment milestones, and generate airway bills
          </p>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Orders in Queue</h4>
            <p className="text-xs text-slate-400 mt-1">New purchase orders sent to you will appear here</p>
          </div>
        ) : (
          orders.map((po) => (
            <div
              key={po.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {po.poNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{po.supplierName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={po.status} />
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    Expected: {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="font-bold text-slate-800 mb-2">Contracted Line Items:</div>
                <div className="space-y-1.5">
                  {po.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700">
                      <span>
                        <span className="font-bold text-slate-900">{i.quantity}x</span> {i.productName} ({i.productCode})
                      </span>
                      <span className="font-mono font-bold">₹{i.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-900">
                  <span>Grand Invoiced Total (incl. GST):</span>
                  <span className="text-sm font-extrabold text-blue-600">
                    ₹{po.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Operational Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {po.status === 'SENT_TO_SUPPLIER' && (
                  <>
                    <button
                      onClick={() => handleAccept(po.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Purchase Order</span>
                    </button>
                  </>
                )}

                {po.status === 'SUPPLIER_ACCEPTED' && (
                  <button
                    onClick={() => handleProcess(po.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Begin Processing & Packing</span>
                  </button>
                )}

                {(po.status === 'PROCESSING' || po.status === 'SUPPLIER_ACCEPTED') && (
                  <button
                    onClick={() => {
                      setSelectedPO(po);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Dispatch Shipment & Assign Courier</span>
                  </button>
                )}

                {po.status === 'DISPATCHED' && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    <span>Dispatched • In Transit with Courier</span>
                  </span>
                )}

                {po.status === 'DELIVERED' && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Delivered & Verified at Receiving Dock</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Dispatch PO */}
      {selectedPO && (
        <Modal
          isOpen={!!selectedPO}
          onClose={() => setSelectedPO(null)}
          title={`Dispatch Consignment for PO: ${selectedPO.poNumber}`}
          subtitle="Generate airway tracking bill and hand over cargo to logistics carrier"
          maxWidth="md"
        >
          <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Logistics & Airway Carrier *</label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="BlueDart Express Air">BlueDart Express Air (Priority Next-Day)</option>
                <option value="Delhivery Surface Express">Delhivery Surface Express (Heavy Freight)</option>
                <option value="DTDC Express Cargo">DTDC Express Cargo</option>
                <option value="FedEx Logistics Domestic">FedEx Logistics Domestic</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Destination Shipping Address *</label>
              <input
                type="text"
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              <span className="font-bold block mb-0.5">Automated Lifecycle Trigger:</span>
              <span>
                Dispatching will immediately create a real-time Delivery record with tracking number and assign it to the logistics fleet.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Confirm Consignment Handover</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
