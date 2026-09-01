import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AuditLog } from '../types';
import { useNotifications } from '../context/NotificationContext';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Layers,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        entityType: entityFilter || undefined,
      });

      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      (log.newValue && log.newValue.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    const headers = 'ID,Timestamp,Entity Type,Entity ID,Action,User Name,User Role,Details\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.entityType}","${l.entityId}","${l.action}","${l.userName}","${l.userRole}","${(l.newValue || '').replace(/"/g, '""')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `procureflow-audit-trail-${Date.now()}.csv`;
    link.click();
    showToast('success', 'CSV Exported', 'Audit ledger downloaded as CSV file');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Immutable Compliance Audit Ledger</h2>
          </div>
          <p className="text-xs text-slate-500">
            Append-only cryptographic & operational event log recording all state transitions, approvals, and mutations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLogs()}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by action, user, entity ID, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
          >
            <option value="">All Entity Classes</option>
            <option value="PURCHASE_REQUEST">Purchase Requests</option>
            <option value="PURCHASE_ORDER">Purchase Orders</option>
            <option value="DELIVERY">Deliveries & Logistics</option>
            <option value="INVENTORY">Inventory Movements</option>
            <option value="SYSTEM">System & Config</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No audit logs matching query</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Audit Payload & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-700">{log.entityId}</span>
                      <span className="text-[10px] text-slate-400 block">{log.entityType}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{log.userName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{log.userRole}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-md">
                      <p className="leading-relaxed line-clamp-2">{log.newValue}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
