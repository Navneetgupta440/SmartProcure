import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PurchaseRequest, PurchaseRequestStatus, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatusBadge, RoleBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  IndianRupee,
  Building2,
  AlertTriangle,
  FileText,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

interface ApprovalsPageProps {
  initialRequestId?: string | null;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ initialRequestId }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [pendingRequests, setPendingRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Approval Modals
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.getPendingApprovals();
      if (res.success && res.data) {
        setPendingRequests(res.data);
        if (initialRequestId) {
          const match = res.data.find(
            (p) => p.id === initialRequestId || p.requestNumber === initialRequestId
          );
          if (match) {
            setSelectedPR(match);
            setActionType('APPROVE');
            setRemarks('Authorized under departmental procurement guidelines');
          }
        }
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [currentUser]);

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPR || !actionType) return;

    if (actionType === 'REJECT' && !remarks.trim()) {
      showToast('error', 'Validation Error', 'Rejection reason is mandatory.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (actionType === 'APPROVE') {
        const res = await api.approveRequest(selectedPR.id, {
          approverId: currentUser.id,
          remarks: remarks || 'Approved under departmental budget authority',
        });
        if (res.success) {
          showToast('success', 'Approval Granted', `Requisition ${selectedPR.requestNumber} approved.`);
        }
      } else {
        const res = await api.rejectRequest(selectedPR.id, {
          rejectorId: currentUser.id,
          remarks,
        });
        if (res.success) {
          showToast('info', 'Requisition Rejected', `Requisition ${selectedPR.requestNumber} rejected.`);
        }
      }

      setSelectedPR(null);
      setActionType(null);
      setRemarks('');
      fetchPending();
    } catch (err: any) {
      showToast('error', 'Decision Error', err.message);
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
            <h2 className="text-xl font-bold text-slate-900">Multi-Level Approvals Workbench</h2>
            <RoleBadge role={currentUser.role} />
          </div>
          <p className="text-xs text-slate-500">
            Review corporate procurement requisitions routed automatically based on monetary value thresholds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingRequests.length} Pending Review</span>
          </span>
        </div>
      </div>

      {/* Threshold Matrix Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tier 1 Threshold</span>
          <div className="text-sm font-extrabold text-slate-900 mt-0.5">Below ₹15,000</div>
          <p className="text-[11px] text-slate-500 mt-1">Direct Department Manager approval required</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tier 2 Threshold</span>
          <div className="text-sm font-extrabold text-slate-900 mt-0.5">₹15,000 — ₹1,00,000</div>
          <p className="text-[11px] text-slate-500 mt-1">Manager → Procurement Manager sign-off</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tier 3 Threshold</span>
          <div className="text-sm font-extrabold text-slate-900 mt-0.5">Above ₹1,00,000</div>
          <p className="text-[11px] text-slate-500 mt-1">Manager → Procurement Manager → Executive Admin</p>
        </div>
      </div>

      {/* Pending Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">Loading pending requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">All Approvals Cleared!</h4>
            <p className="text-xs text-slate-400 mt-1">No pending purchase requisitions require your sign-off at this time.</p>
          </div>
        ) : (
          pendingRequests.map((pr) => {
            const isRequesterSelf = pr.requestedBy === currentUser.id && currentUser.role !== UserRole.ADMIN;

            return (
              <div
                key={pr.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      {pr.requestNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{pr.department}</span>
                    <span className="text-[11px] text-slate-400">• Requested by {pr.requesterName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Level {pr.currentApprovalLevel} of {pr.approvalLevelRequired}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      {pr.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="md:col-span-2 space-y-1">
                    <span className="text-slate-400 font-semibold block">Justification Reason:</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{pr.reason}</p>
                    <div className="pt-2 text-[11px] text-slate-500">
                      Items: {pr.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ')}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                    <div>
                      <span className="text-slate-400 font-semibold block">Total Valuation:</span>
                      <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                        ₹{pr.estimatedAmount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-2">
                      Submitted: {new Date(pr.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {isRequesterSelf && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>
                      Self-Approval Restriction: You are the author of this requisition. A separate manager or admin must sign off.
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    disabled={isRequesterSelf}
                    onClick={() => {
                      setSelectedPR(pr);
                      setActionType('REJECT');
                      setRemarks('');
                    }}
                    className="px-4 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    disabled={isRequesterSelf}
                    onClick={() => {
                      setSelectedPR(pr);
                      setActionType('APPROVE');
                      setRemarks('Budget approved for project requirements');
                    }}
                    className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 font-bold text-xs shadow-xs transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Requisition</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decision Modal */}
      {selectedPR && actionType && (
        <Modal
          isOpen={!!selectedPR}
          onClose={() => {
            setSelectedPR(null);
            setActionType(null);
          }}
          title={actionType === 'APPROVE' ? `Approve Requisition: ${selectedPR.requestNumber}` : `Reject Requisition: ${selectedPR.requestNumber}`}
          subtitle={`Current Level: ${selectedPR.currentApprovalLevel} / ${selectedPR.approvalLevelRequired} • Amount: ₹${selectedPR.estimatedAmount.toLocaleString('en-IN')}`}
          maxWidth="md"
        >
          <form onSubmit={handleDecision} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {actionType === 'APPROVE' ? 'Approval Remarks / Notes (Optional)' : 'Rejection Reason (Mandatory) *'}
              </label>
              <textarea
                required={actionType === 'REJECT'}
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  actionType === 'APPROVE'
                    ? 'e.g. Approved within Q3 departmental hardware allocation'
                    : 'e.g. Budget ceiling reached this quarter. Please resubmit next month.'
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPR(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-white font-bold transition shadow-xs flex items-center gap-1.5 ${
                  actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
