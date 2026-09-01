import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../api/client';
import { UserRole } from '../../types';
import {
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Loader2,
  Package,
  ShieldAlert,
  Boxes,
} from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshAll: () => void;
}

export const InteractiveDemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, onRefreshAll }) => {
  const { loginAsPersona } = useAuth();
  const { showToast } = useNotifications();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [createdPrId, setCreatedPrId] = useState<string | null>(null);
  const [createdPoId, setCreatedPoId] = useState<string | null>(null);
  const [createdDelId, setCreatedDelId] = useState<string | null>(null);

  const steps = [
    {
      title: '1. Employee Requisition',
      role: UserRole.EMPLOYEE,
      description: 'Employee (Ananya) requests 5 units of Herman Miller Aeron Chairs (₹4,25,000).',
      actionName: 'Create Purchase Request',
    },
    {
      title: '2. Manager Approval (Level 1)',
      role: UserRole.MANAGER,
      description: 'Manager (Vikram) reviews budget and approves request at Level 1.',
      actionName: 'Approve as Manager',
    },
    {
      title: '3. Procurement PO Generation',
      role: UserRole.PROCUREMENT_MANAGER,
      description: 'Procurement Mgr (Pooja) compares suppliers and issues Purchase Order to ErgoMax Solutions.',
      actionName: 'Generate Purchase Order',
    },
    {
      title: '4. Supplier Acceptance & Dispatch',
      role: UserRole.SUPPLIER,
      description: 'Supplier (Suresh) accepts PO, packages consignment, and dispatches with BlueDart tracking.',
      actionName: 'Accept & Dispatch PO',
    },
    {
      title: '5. Logistics Delivery & Inventory Sync',
      role: UserRole.DELIVERY_AGENT,
      description: 'Delivery Agent (Amit) marks consignment DELIVERED. Inventory increments automatically.',
      actionName: 'Confirm Delivery',
    },
  ];

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleExecuteCurrentStep = async () => {
    setIsRunning(true);
    try {
      if (currentStep === 0) {
        // Step 1: Create PR as Employee
        await loginAsPersona(UserRole.EMPLOYEE);
        addLog('Logged in as Employee (Ananya Deshmukh)');

        const res = await api.createPurchaseRequest({
          userId: 'usr-emp-01',
          department: 'Cloud Infrastructure & Engineering',
          priority: 'HIGH',
          reason: 'Ergonomic chairs for senior engineering team expansion',
          items: [{ productId: 'prd-07', quantity: 5 }],
        });

        if (res.success && res.data) {
          setCreatedPrId(res.data.id);
          addLog(`Created Purchase Request: ${res.data.requestNumber} (₹${res.data.estimatedAmount.toLocaleString('en-IN')})`);
          showToast('success', 'Step 1 Complete', `Purchase Request ${res.data.requestNumber} generated!`);
          setCurrentStep(1);
        }
      } else if (currentStep === 1) {
        // Step 2: Approve as Manager
        await loginAsPersona(UserRole.MANAGER);
        addLog('Switched persona to IT Manager (Vikram Mehta)');

        if (!createdPrId) throw new Error('No active PR found');

        const res = await api.approveRequest(createdPrId, {
          approverId: 'usr-mgr-01',
          remarks: 'Approved for engineering ergonomics project budget',
        });

        if (res.success && res.data) {
          addLog(`Manager Approved ${res.data.requestNumber} (Status: ${res.data.status})`);
          showToast('success', 'Step 2 Complete', `PR ${res.data.requestNumber} approved!`);
          setCurrentStep(2);
        }
      } else if (currentStep === 2) {
        // Step 3: Create PO as Procurement Manager
        await loginAsPersona(UserRole.PROCUREMENT_MANAGER);
        addLog('Switched persona to Procurement Manager (Pooja Iyer)');

        if (!createdPrId) throw new Error('No active PR found');

        const res = await api.createPurchaseOrder({
          purchaseRequestId: createdPrId,
          supplierId: 'sup-ergomax-05',
          creatorId: 'usr-proc-01',
          discount: 10000,
          shippingCost: 2500,
          expectedDays: 3,
          remarks: 'Fast delivery requested for ergonomic chairs',
        });

        if (res.success && res.data) {
          setCreatedPoId(res.data.id);
          addLog(`Generated Purchase Order: ${res.data.poNumber} to ErgoMax (Total: ₹${res.data.totalAmount.toLocaleString('en-IN')})`);
          showToast('success', 'Step 3 Complete', `Purchase Order ${res.data.poNumber} sent to supplier!`);
          setCurrentStep(3);
        }
      } else if (currentStep === 3) {
        // Step 4: Accept & Dispatch as Supplier
        await loginAsPersona(UserRole.SUPPLIER);
        addLog('Switched persona to Supplier (Suresh Singhania)');

        if (!createdPoId) throw new Error('No active PO found');

        // Accept
        await api.supplierAcceptPO(createdPoId, 'usr-sup-01');
        addLog('Supplier accepted Purchase Order');

        // Dispatch
        const dispatchRes = await api.supplierDispatchPO(createdPoId, {
          supplierUserId: 'usr-sup-01',
          carrier: 'BlueDart Express Air',
          shippingAddress: 'ProcureFlow Corp HQ, Receiving Dock, Bengaluru',
          deliveryAgentId: 'usr-del-01',
        });

        if (dispatchRes.success && dispatchRes.data) {
          setCreatedDelId(dispatchRes.data.delivery.id);
          addLog(`Supplier Dispatched PO! Tracking Number: ${dispatchRes.data.delivery.trackingNumber}`);
          showToast('success', 'Step 4 Complete', `Order dispatched! Tracking: ${dispatchRes.data.delivery.trackingNumber}`);
          setCurrentStep(4);
        }
      } else if (currentStep === 4) {
        // Step 5: Deliver & Inventory Update
        await loginAsPersona(UserRole.DELIVERY_AGENT);
        addLog('Switched persona to Logistics Agent (Amit Patel)');

        if (!createdDelId) throw new Error('No active Delivery found');

        const delRes = await api.updateDeliveryStatus(createdDelId, {
          actorId: 'usr-del-01',
          status: 'DELIVERED',
          location: 'ProcureFlow Receiving Bay #02',
          description: 'Package consignment verified and barcode scanned. Physical goods received.',
        });

        if (delRes.success && delRes.data) {
          addLog(`Delivery marked DELIVERED! Inventory stock automatically incremented (+5 chairs) and audit logged.`);
          showToast('success', 'Full Lifecycle Complete!', 'Goods received, inventory synced, and audit logged.');
          setCurrentStep(5);
        }
      }

      onRefreshAll();
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
      showToast('error', 'Execution Error', err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetDemo = () => {
    setCurrentStep(0);
    setLogs([]);
    setCreatedPrId(null);
    setCreatedPoId(null);
    setCreatedDelId(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automated End-to-End Procurement Lifecycle Demo"
      subtitle="Interactive step-by-step walkthrough simulating real enterprise operations across all 7 personas"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Progress Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-left transition ${
                  isCompleted
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : isCurrent
                    ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>Step {idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 text-blue-600 animate-spin-slow" />
                  ) : null}
                </div>
                <p className="text-[11px] font-semibold truncate">{step.title.split('. ')[1]}</p>
              </div>
            );
          })}
        </div>

        {/* Current Step Focus Card */}
        {currentStep < steps.length ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
                Current Active Phase: {steps[currentStep].title}
              </span>
              <span className="text-xs bg-slate-700/80 px-2.5 py-1 rounded-full text-slate-200 font-medium">
                Persona: {steps[currentStep].role.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-sm mt-3 text-slate-200 leading-relaxed">{steps[currentStep].description}</p>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={handleExecuteCurrentStep}
                disabled={isRunning}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-blue-500/30 transition disabled:opacity-50 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing API Transaction...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{steps[currentStep].actionName}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold">End-to-End Lifecycle Completed Successfully!</h4>
            <p className="text-xs text-emerald-800 mt-1 max-w-lg mx-auto">
              From Employee Requisition → Multi-Level Approval → PO Generation → Vendor Processing → Logistics Delivery → Auto Inventory Sync.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={handleResetDemo}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-run Lifecycle Demo</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition"
              >
                Explore Live Data in App
              </button>
            </div>
          </div>
        )}

        {/* Live Execution Logs Console */}
        <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-slate-300 border border-slate-800">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-slate-400 text-xs">
            <span>Real-time REST API Transaction Logs</span>
            <span>REST /api/v1/...</span>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">Click the action button above to start the demo workflow...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-emerald-400">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
