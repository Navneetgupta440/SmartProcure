import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { PurchaseRequest, PurchaseRequestStatus, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useI18n } from '../../context/I18nContext';
import { Modal } from './Modal';
import { StatusBadge, RoleBadge } from './Badge';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  AlertTriangle,
  FileText,
  UserCheck,
  IndianRupee,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCog,
  CheckSquare,
} from 'lucide-react';

interface DirectApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
  onSuccess?: () => void;
  onNavigateToWorkbench?: () => void;
}

export const DirectApprovalModal: React.FC<DirectApprovalModalProps> = ({
  isOpen,
  onClose,
  requestId,
  onSuccess,
  onNavigateToWorkbench,
}) => {
  const { currentUser, loginAsPersona } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();
  const { formatCurrency } = useI18n();

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch requisition details by ID or Request Number
  const fetchRequestDetails = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setError(null);
      
      // Try direct get by ID or search list
      let found: PurchaseRequest | null = null;
      try {
        const res = await api.getPurchaseRequest(requestId);
        if (res.success && res.data) {
          found = res.data;
        }
      } catch {
        // Fallback to searching all requests
        const allRes = await api.getPurchaseRequests();
        if (allRes.success && allRes.data) {
          found = allRes.data.find((p) => p.id === requestId || p.requestNumber === requestId) || null;
        }
      }

      if (found) {
        setRequest(found);
        // Pre-fill default remarks
        if (found.currentApprovalLevel >= found.approvalLevelRequired) {
          setRemarks('Final sign-off authorized under enterprise budgetary allocation');
        } else {
          setRemarks(`Level ${found.currentApprovalLevel} approval granted`);
        }
      } else {
        setError(`Requisition '${requestId}' could not be found.`);
      }
    } catch (err: any) {
      console.error('Failed to load purchase request:', err);
      setError(err?.message || 'Failed to retrieve requisition details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestDetails();
      setActionType(null);
    } else {
      setRequest(null);
      setError(null);
      setActionType(null);
      setRemarks('');
    }
  }, [isOpen, requestId]);

  if (!isOpen) return null;

  const isRequesterSelf = request ? request.requestedBy === currentUser.id && currentUser.role !== UserRole.ADMIN : false;
  const isApproverRole =
    currentUser.role === UserRole.MANAGER ||
    currentUser.role === UserRole.PROCUREMENT_MANAGER ||
    currentUser.role === UserRole.ADMIN;

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!request) return;

    if (decision === 'REJECT' && !remarks.trim()) {
      showToast('error', 'Validation Error', 'Rejection reason is mandatory.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (decision === 'APPROVE') {
        const res = await api.approveRequest(request.id, {
          approverId: currentUser.id,
          remarks: remarks || `Approved by ${currentUser.name}`,
        });

        if (res.success) {
          showToast(
            'success',
            'Purchase Request Approved!',
            `Requisition ${request.requestNumber} approved at Level ${request.currentApprovalLevel}.`
          );
          await refreshNotifications();
          if (onSuccess) onSuccess();
          onClose();
        }
      } else {
        const res = await api.rejectRequest(request.id, {
          rejectorId: currentUser.id,
          remarks: remarks || 'Requisition rejected by reviewer',
        });

        if (res.success) {
          showToast(
            'info',
            'Purchase Request Rejected',
            `Requisition ${request.requestNumber} has been rejected.`
          );
          await refreshNotifications();
          if (onSuccess) onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      showToast('error', 'Decision Failed', err?.message || 'Could not process decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch persona helper for convenient approval testing
  const handleSwitchToManager = () => {
    loginAsPersona(UserRole.MANAGER);
    showToast('info', 'Switched Persona', 'You are now signed in as Vikram Mehta (IT Dept Manager).');
  };

  const isPending =
    request?.status === PurchaseRequestStatus.PENDING_APPROVAL ||
    request?.status === PurchaseRequestStatus.SUBMITTED;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Direct Purchase Request Approval & Review"
      subtitle="Immediate requisition sign-off triggered from system notification"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 font-medium">Fetching requisition details from REST API...</p>
          </div>
        ) : error || !request ? (
          <div className="py-8 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">Requisition Not Accessible</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error || 'Requisition record not found.'}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 transition"
            >
              Close Window
            </button>
          </div>
        ) : (
          <>
            {/* Header Requisition Summary Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-800/80 dark:to-indigo-950/30 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                    {request.requestNumber}
                  </span>
                  <StatusBadge status={request.status} />
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {request.priority} PRIORITY
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">Requisition Valuation</div>
                  <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                    ₹{request.estimatedAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Requester & Department Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-medium">Requester:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{request.requesterName}</span>
                  <span className="text-[10px] text-slate-400 block">({request.requesterRole})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Department:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{request.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Submitted At:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {new Date(request.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Multi-Level Workflow Progress Bar */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Approval Routing Stage</span>
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                  Level {request.currentApprovalLevel} of {request.approvalLevelRequired} Required
                </span>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div
                  className={`p-2 rounded-lg border text-center font-medium ${
                    request.currentApprovalLevel >= 1
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {request.currentApprovalLevel > 1 ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-500" />
                    )}
                    <span>Tier 1: Manager</span>
                  </div>
                </div>

                <div
                  className={`p-2 rounded-lg border text-center font-medium ${
                    request.approvalLevelRequired < 2
                      ? 'opacity-40 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400'
                      : request.currentApprovalLevel >= 2
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {request.currentApprovalLevel > 2 ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-500" />
                    )}
                    <span>Tier 2: Procurement</span>
                  </div>
                </div>

                <div
                  className={`p-2 rounded-lg border text-center font-medium ${
                    request.approvalLevelRequired < 3
                      ? 'opacity-40 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400'
                      : request.currentApprovalLevel >= 3
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Tier 3: Executive Admin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Justification */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Business Justification / Purpose:
              </span>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {request.reason}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Requested Requisition Items ({request.items.length})</span>
                <span className="font-normal text-slate-400 lowercase">quantities and line totals</span>
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-3.5 py-2.5">Item & Code</th>
                      <th className="px-3.5 py-2.5 text-center">Qty</th>
                      <th className="px-3.5 py-2.5 text-right">Est. Unit Price</th>
                      <th className="px-3.5 py-2.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {request.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{item.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.productCode}</div>
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono font-medium">
                          {item.quantity} {item.unit || 'Units'}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          ₹{item.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{item.estimatedTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role & Self-Approval Checks */}
            {isRequesterSelf && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    <strong>Self-Approval Restriction:</strong> You created this requisition. Company policy prevents self-approving.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToManager}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shrink-0 transition flex items-center gap-1 cursor-pointer"
                >
                  <UserCog className="w-3.5 h-3.5" />
                  <span>Switch to Manager</span>
                </button>
              </div>
            )}

            {!isApproverRole && !isRequesterSelf && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 shrink-0 text-indigo-500" />
                  <span>
                    Your current role is <strong>{currentUser.role}</strong>. Approvals require Manager or Admin sign-off.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToManager}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shrink-0 transition flex items-center gap-1 cursor-pointer"
                >
                  <UserCog className="w-3.5 h-3.5" />
                  <span>Test as IT Manager</span>
                </button>
              </div>
            )}

            {/* Approval / Rejection Form Controls (if pending and user can act) */}
            {isPending && !isRequesterSelf && isApproverRole && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Reviewer Notes / Sign-Off Remarks:
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Approved within Q3 departmental hardware allocation"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[11px] text-slate-400">
                    Signing as <strong className="text-slate-700 dark:text-slate-200">{currentUser.name}</strong> ({currentUser.role})
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDecision('REJECT')}
                      className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Request</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDecision('APPROVE')}
                      className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>
                        {request.currentApprovalLevel >= request.approvalLevelRequired
                          ? 'Grant Final Approval'
                          : `Approve Level ${request.currentApprovalLevel}`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* If Already Approved or Converted */}
            {!isPending && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    This requisition is in status <strong>{request.status}</strong> and does not require approval.
                  </span>
                </div>
                {request.purchaseOrderId && (
                  <span className="font-mono text-[11px] font-bold">PO: {request.purchaseOrderId}</span>
                )}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              {onNavigateToWorkbench ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToWorkbench();
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to Multi-Level Approvals Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
