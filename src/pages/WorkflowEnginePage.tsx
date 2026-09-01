import React, { useState } from 'react';
import { api } from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import {
  GitBranch,
  Terminal,
  Play,
  Copy,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Code2,
} from 'lucide-react';

export const WorkflowEnginePage: React.FC = () => {
  const { showToast } = useNotifications();

  const presets = [
    {
      name: '1. Create Purchase Request',
      action: 'CREATE_PR',
      payload: {
        userId: 'usr-emp-01',
        department: 'Cloud Infrastructure & Engineering',
        priority: 'HIGH',
        reason: 'Additional developer laptops for onboarding sprint',
        items: [{ productId: 'prd-01', quantity: 2 }],
      },
    },
    {
      name: '2. Approve Purchase Request',
      action: 'APPROVE_PR',
      payload: {
        purchaseRequestId: 'pr-2026-0001',
        approverId: 'usr-mgr-01',
        remarks: 'Approved under engineering budget limit',
      },
    },
    {
      name: '3. Generate Purchase Order',
      action: 'GENERATE_PO',
      payload: {
        purchaseRequestId: 'pr-2026-0001',
        supplierId: 'sup-techcorp-01',
        creatorId: 'usr-proc-01',
        discount: 5000,
        shippingCost: 1500,
        expectedDays: 4,
        remarks: 'Handle with priority delivery',
      },
    },
    {
      name: '4. Supplier Accept PO',
      action: 'SUPPLIER_ACCEPT_PO',
      payload: {
        purchaseOrderId: 'po-2026-0001',
        supplierUserId: 'usr-sup-01',
      },
    },
    {
      name: '5. Dispatch PO Shipment',
      action: 'DISPATCH_PO',
      payload: {
        purchaseOrderId: 'po-2026-0001',
        supplierUserId: 'usr-sup-01',
        carrier: 'BlueDart Express Air',
        shippingAddress: 'ProcureFlow Corp HQ, Dock 2, Bengaluru',
        deliveryAgentId: 'usr-del-01',
      },
    },
    {
      name: '6. Deliver Shipment & Sync Inventory',
      action: 'UPDATE_DELIVERY',
      payload: {
        deliveryId: 'del-2026-0001',
        actorId: 'usr-del-01',
        status: 'DELIVERED',
        location: 'Bengaluru Receiving Dock #01',
        description: 'Package delivered and signed by warehouse incharge',
      },
    },
    {
      name: '7. Manual Stock Adjustment',
      action: 'STOCK_ADJUSTMENT',
      payload: {
        productId: 'prd-01',
        quantityChange: 5,
        reason: 'Direct physical stock inventory receipt',
      },
    },
  ];

  const [selectedAction, setSelectedAction] = useState(presets[0].action);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(presets[0].payload, null, 2));
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectPreset = (preset: (typeof presets)[0]) => {
    setSelectedAction(preset.action);
    setJsonInput(JSON.stringify(preset.payload, null, 2));
    setResponseOutput(null);
  };

  const handleExecute = async () => {
    try {
      setExecuting(true);
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(jsonInput);
      } catch (e) {
        showToast('error', 'JSON Error', 'Invalid JSON syntax in request body payload.');
        return;
      }

      const res = await api.executeWorkflowCommand(selectedAction, parsedPayload);
      setResponseOutput(res);

      if (res.success) {
        showToast('success', 'Workflow Executed', `Action ${selectedAction} succeeded!`);
      } else {
        showToast('error', 'Execution Error', res.message || 'Workflow execution returned error');
      }
    } catch (err: any) {
      setResponseOutput({ success: false, error: err.message });
      showToast('error', 'API Failure', err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyCurl = () => {
    const curl = `curl -X POST http://localhost:3000/api/v1/workflow \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ action: selectedAction, payload: JSON.parse(jsonInput || '{}') })}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('info', 'cURL Copied', 'cURL command copied to clipboard');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">Central Workflow Command API Hub</h2>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            POST /api/v1/workflow
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Execute unified programmatic lifecycle transitions, trigger automated business state machines, and inspect transaction payloads.
        </p>
      </div>

      {/* Preset Action Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Preset Workflow Lifecycle Transitions
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedAction === p.action
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Request & Response Split Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Builder */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 font-mono text-xs text-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  POST
                </span>
                <span className="text-slate-300 font-bold">/api/v1/workflow</span>
              </div>
              <button
                onClick={handleCopyCurl}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-sans font-bold block mb-1">
                Workflow Action Directive:
              </label>
              <input
                type="text"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-indigo-400 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-sans font-bold block mb-1">
                Request JSON Payload:
              </label>
              <textarea
                rows={10}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleExecute}
            disabled={executing}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md"
          >
            <Play className="w-4 h-4" />
            <span>{executing ? 'Executing Transaction...' : 'Execute Workflow Command'}</span>
          </button>
        </div>

        {/* Response Inspector */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 font-mono text-xs text-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              HTTP Response Payload
            </span>
            {responseOutput && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  responseOutput.success ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {responseOutput.success ? '200 OK' : '400 BAD REQUEST'}
              </span>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {responseOutput ? (
              <pre className="text-emerald-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(responseOutput, null, 2)}
              </pre>
            ) : (
              <div className="py-20 text-center text-slate-600 font-sans">
                <Terminal className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                <p className="text-xs">Click "Execute Workflow Command" to run live REST mutation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
