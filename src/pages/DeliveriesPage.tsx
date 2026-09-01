import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Delivery, DeliveryStatus, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatusBadge, RoleBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Calendar,
  AlertCircle,
  Navigation,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const DeliveriesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Update Modal
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [newStatus, setNewStatus] = useState<DeliveryStatus>(DeliveryStatus.IN_TRANSIT);
  const [currentLocation, setCurrentLocation] = useState('Bengaluru Central Distribution Hub');
  const [statusRemarks, setStatusRemarks] = useState('Consignment scanned at sorting center');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.getDeliveries();
      if (res.success && res.data) {
        setDeliveries(res.data);
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [currentUser]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    try {
      setIsUpdating(true);
      const res = await api.updateDeliveryStatus(selectedDelivery.id, {
        actorId: currentUser.id,
        status: newStatus,
        location: currentLocation,
        description: statusRemarks,
      });

      if (res.success) {
        showToast(
          'success',
          'Milestone Updated',
          `Shipment ${selectedDelivery.trackingNumber} updated to ${newStatus}`
        );
        if (newStatus === DeliveryStatus.DELIVERED) {
          showToast(
            'success',
            'Stock Increment Triggered',
            'Warehouse inventory has been updated with delivered physical goods!'
          );
        }
        setSelectedDelivery(null);
        fetchDeliveries();
      }
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">Logistics & Real-time Live Tracking</h2>
            <RoleBadge role={currentUser.role} />
          </div>
          <p className="text-xs text-slate-500">
            GPS milestone checkpoints, carrier waybills, and automated receiving dock verification
          </p>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="space-y-5">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">Loading delivery tracking...</div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Active Shipments</h4>
            <p className="text-xs text-slate-400 mt-1">Dispatched purchase orders will display live tracking here</p>
          </div>
        ) : (
          deliveries.map((del) => {
            const milestoneStages = [
              DeliveryStatus.PICKED_UP,
              DeliveryStatus.IN_TRANSIT,
              DeliveryStatus.OUT_FOR_DELIVERY,
              DeliveryStatus.DELIVERED,
            ];

            const currentIndex = milestoneStages.indexOf(del.status);

            return (
              <div
                key={del.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 hover:shadow-md transition space-y-5"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                        {del.trackingNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{del.carrier}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Purchase Order Ref: <span className="font-mono font-bold text-slate-700">{del.poNumber}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={del.status} />
                    <button
                      onClick={() => {
                        setSelectedDelivery(del);
                        setNewStatus(del.status);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Update Checkpoint</span>
                    </button>
                  </div>
                </div>

                {/* Milestone Stepper Visualizer */}
                <div className="py-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative">
                    {milestoneStages.map((stage, idx) => {
                      const isPassed = currentIndex >= idx;
                      const isCurrent = del.status === stage;

                      return (
                        <div
                          key={stage}
                          className={`p-3 rounded-xl border text-left transition ${
                            isPassed
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 text-xs">
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                              Phase {idx + 1}
                            </span>
                            {isPassed ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-slate-300" />
                            )}
                          </div>
                          <p className="text-xs font-bold truncate">{stage.replace(/_/g, ' ')}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tracking Milestones History Ledger */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    GPS Checkpoint Audit Log
                  </span>
                  <div className="space-y-2 text-xs">
                    {(del.trackingHistory || []).map((u, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{u.status.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(u.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5">{u.description}</p>
                          <p className="text-slate-400 text-[10px] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{u.location}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Update Checkpoint Status */}
      {selectedDelivery && (
        <Modal
          isOpen={!!selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          title={`Logistics Checkpoint Update: ${selectedDelivery.trackingNumber}`}
          subtitle={`Carrier: ${selectedDelivery.carrier} • PO: ${selectedDelivery.poNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Milestone Status *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as DeliveryStatus)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value={DeliveryStatus.PICKED_UP}>PICKED_UP (At Vendor Hub)</option>
                <option value={DeliveryStatus.IN_TRANSIT}>IN_TRANSIT (En Route / Linehaul)</option>
                <option value={DeliveryStatus.OUT_FOR_DELIVERY}>OUT_FOR_DELIVERY (Last-Mile Courier)</option>
                <option value={DeliveryStatus.DELIVERED}>DELIVERED (Goods Received at Dock)</option>
                <option value={DeliveryStatus.FAILED}>FAILED (Delivery Attempt Exception)</option>
                <option value={DeliveryStatus.RETURNED}>RETURNED (Returned to Origin)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GPS Current Location *</label>
              <input
                type="text"
                required
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="e.g. Outer Ring Road Toll Gate, Bengaluru"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Description / Remarks *</label>
              <textarea
                required
                rows={2}
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder="e.g. Scanned at warehouse sorting dock"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            {newStatus === DeliveryStatus.DELIVERED && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                <span className="font-bold block mb-0.5">Inventory Auto-Sync Notice:</span>
                <span>
                  Marking this shipment as DELIVERED will automatically execute inventory stock increments for all ordered SKUs and post to the audit ledger.
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-xs"
              >
                Save Milestone Checkpoint
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
