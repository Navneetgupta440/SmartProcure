import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  Terminal,
  Code2,
  Copy,
  CheckCircle2,
  Download,
  Play,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const PostmanOpenApiPage: React.FC = () => {
  const { showToast } = useNotifications();

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/workflow',
      description: 'Unified Central Workflow Command for all multi-role lifecycle transitions',
      sampleBody: {
        action: 'CREATE_PR',
        payload: {
          userId: 'usr-emp-01',
          department: 'Engineering',
          priority: 'HIGH',
          reason: 'Monitors for team',
          items: [{ productId: 'prd-02', quantity: 3 }],
        },
      },
    },
    {
      method: 'GET',
      path: '/api/v1/dashboard/kpis',
      description: 'Fetch executive dashboard metrics, pending approvals count, and spend trends',
      sampleBody: null,
    },
    {
      method: 'GET',
      path: '/api/v1/requests',
      description: 'List all purchase requests with optional status and priority query filters',
      sampleBody: null,
    },
    {
      method: 'POST',
      path: '/api/v1/requests',
      description: 'Submit a new purchase requisition and calculate approval tier routing',
      sampleBody: {
        userId: 'usr-emp-01',
        department: 'Cloud Infrastructure',
        priority: 'MEDIUM',
        reason: 'Developer workstations',
        items: [{ productId: 'prd-01', quantity: 2 }],
      },
    },
    {
      method: 'POST',
      path: '/api/v1/requests/:id/approve',
      description: 'Grant manager or executive approval sign-off on a requisition',
      sampleBody: {
        approverId: 'usr-mgr-01',
        remarks: 'Approved within Q3 team budget allocation',
      },
    },
    {
      method: 'POST',
      path: '/api/v1/orders',
      description: 'Generate legally binding purchase order and transmit to selected supplier',
      sampleBody: {
        purchaseRequestId: 'pr-2026-0001',
        supplierId: 'sup-techcorp-01',
        creatorId: 'usr-proc-01',
        discount: 5000,
        shippingCost: 2000,
        expectedDays: 4,
      },
    },
    {
      method: 'POST',
      path: '/api/v1/orders/:id/dispatch',
      description: 'Supplier dispatches consignment, generates tracking number & assigns courier',
      sampleBody: {
        supplierUserId: 'usr-sup-01',
        carrier: 'BlueDart Express Air',
        shippingAddress: 'ProcureFlow Corp HQ, Dock 2, Bengaluru',
        deliveryAgentId: 'usr-del-01',
      },
    },
    {
      method: 'POST',
      path: '/api/v1/deliveries/:id/status',
      description: 'Logistics agent logs GPS milestone checkpoint or confirms goods delivered',
      sampleBody: {
        actorId: 'usr-del-01',
        status: 'DELIVERED',
        location: 'Bengaluru Receiving Dock #02',
        description: 'Physical inspection completed and goods receipt note signed',
      },
    },
    {
      method: 'POST',
      path: '/api/v1/inventory/adjust',
      description: 'Adjust warehouse stock count for a SKU with audit trail reason',
      sampleBody: {
        productId: 'prd-01',
        quantityChange: 10,
        reason: 'Physical stock recount adjustment',
      },
    },
    {
      method: 'POST',
      path: '/api/v1/ai/advisory',
      description: 'Gemini-powered strategic procurement advisory and spend optimizer',
      sampleBody: {
        prompt: 'Analyze suppliers and recommend cost optimization strategy',
      },
    },
    {
      method: 'GET',
      path: '/api/v1/audit-logs',
      description: 'Query immutable security, financial, and lifecycle audit records',
      sampleBody: null,
    },
    {
      method: 'POST',
      path: '/api/v1/reset',
      description: 'Restore database to initial seed dataset for testing and demonstrations',
      sampleBody: {},
    },
  ];

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [testingResponse, setTestingResponse] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleTestEndpoint = async (ep: (typeof endpoints)[0]) => {
    try {
      setIsExecuting(true);
      setTestingResponse(null);

      let url = ep.path.replace(':id', 'pr-2026-0001');
      let options: RequestInit = {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token_usr-admin-01_1740000000000',
        },
      };

      if (ep.sampleBody && ep.method !== 'GET') {
        options.body = JSON.stringify(ep.sampleBody);
      }

      const res = await fetch(url, options);
      const json = await res.json();
      setTestingResponse({ status: res.status, data: json });
      showToast('info', 'API Executed', `Received HTTP ${res.status} response`);
    } catch (err: any) {
      setTestingResponse({ error: err.message });
      showToast('error', 'API Call Failed', err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownloadPostmanCollection = () => {
    const collection = {
      info: {
        name: 'ProcureFlow Enterprise REST API Collection',
        description: 'Complete Postman collection for enterprise procurement lifecycle testing',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: endpoints.map((ep) => ({
        name: `${ep.method} ${ep.path}`,
        request: {
          method: ep.method,
          header: [{ key: 'Content-Type', value: 'application/json' }],
          url: {
            raw: `http://localhost:3000${ep.path}`,
            protocol: 'http',
            host: ['localhost'],
            port: '3000',
            path: ep.path.split('/').filter(Boolean),
          },
          body: ep.sampleBody
            ? {
                mode: 'raw',
                raw: JSON.stringify(ep.sampleBody, null, 2),
              }
            : undefined,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ProcureFlow-Postman-Collection.json';
    link.click();
    showToast('success', 'Collection Downloaded', 'Postman collection JSON exported successfully');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Postman & OpenAPI Contract Hub</h2>
          </div>
          <p className="text-xs text-slate-500">
            Interactive API sandbox, endpoint contracts, schema models, and exportable Postman collections
          </p>
        </div>

        <button
          onClick={handleDownloadPostmanCollection}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Postman Collection</span>
        </button>
      </div>

      {/* Endpoints Accordion List */}
      <div className="space-y-3">
        {endpoints.map((ep, idx) => {
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition"
            >
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg border ${
                      ep.method === 'POST'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : ep.method === 'GET'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900">{ep.path}</span>
                  <span className="hidden md:inline text-xs text-slate-500">• {ep.description}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs font-mono">
                  <p className="text-slate-700 font-sans text-xs font-medium">{ep.description}</p>

                  {ep.sampleBody && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                        Sample Request Body
                      </span>
                      <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] overflow-x-auto">
                        {JSON.stringify(ep.sampleBody, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => handleTestEndpoint(ep)}
                      disabled={isExecuting}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold font-sans text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Execute Live Test Call</span>
                    </button>
                  </div>

                  {/* Live Response Box */}
                  {testingResponse && (
                    <div className="p-4 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-sans font-bold">API Test Response</span>
                        <span className="text-emerald-400 font-bold">Status: {testingResponse.status}</span>
                      </div>
                      <pre className="text-[11px] text-emerald-300 overflow-x-auto max-h-60">
                        {JSON.stringify(testingResponse.data || testingResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
