import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BulkImportHistoryRecord, BulkImportStatus } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../common/Modal';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Layers,
  Check,
  ChevronRight,
  User,
  ShieldCheck,
  Boxes,
  Database,
  ArrowRight,
  Eye,
  AlertOctagon,
  History,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';

interface RecentImportsTabProps {
  onOpenBulkImportModal: () => void;
  onRefreshCatalog: () => void;
}

export const RecentImportsTab: React.FC<RecentImportsTabProps> = ({
  onOpenBulkImportModal,
  onRefreshCatalog,
}) => {
  const { showToast } = useNotifications();
  const [historyRecords, setHistoryRecords] = useState<BulkImportHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Aggregated Metrics
  const [metrics, setMetrics] = useState({
    totalImports: 0,
    totalIngestedSKUs: 0,
    overallSuccessRate: 100,
    revertedCount: 0,
  });

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<BulkImportHistoryRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [revertTargetRecord, setRevertTargetRecord] = useState<BulkImportHistoryRecord | null>(null);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getImportHistory({
        status: statusFilter,
        search: searchQuery,
      });

      if (res.success && res.data) {
        setHistoryRecords(res.data);
        if (res.metadata?.metrics) {
          setMetrics(res.metadata.metrics);
        } else {
          const total = res.data.length;
          const totalIngested = res.data.reduce(
            (acc: number, r: BulkImportHistoryRecord) => acc + (r.createdCount + r.updatedCount),
            0
          );
          const totalProcessed = res.data.reduce(
            (acc: number, r: BulkImportHistoryRecord) => acc + r.totalRecords,
            0
          );
          const successRate = totalProcessed > 0
            ? Number(((totalIngested / totalProcessed) * 100).toFixed(1))
            : 100;
          const reverted = res.data.filter((r: BulkImportHistoryRecord) => r.status === 'REVERTED').length;

          setMetrics({
            totalImports: total,
            totalIngestedSKUs: totalIngested,
            overallSuccessRate: successRate,
            revertedCount: reverted,
          });
        }
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to fetch bulk import history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  // Revert Action
  const handleExecuteRevert = async () => {
    if (!revertTargetRecord) return;

    try {
      setIsReverting(true);
      const res = await api.revertImportBatch(revertTargetRecord.id, {
        revertedBy: 'Navneet Gupta (Executive Admin)',
      });

      if (res.success) {
        showToast(
          'success',
          'Bulk Action Reverted',
          `Batch ${revertTargetRecord.batchNumber} has been rolled back successfully.`
        );
        setShowRevertModal(false);
        setRevertTargetRecord(null);
        fetchHistory();
        onRefreshCatalog(); // sync catalog and categories
      } else {
        showToast('error', 'Revert Failed', res.message || 'Unable to revert batch action');
      }
    } catch (err: any) {
      showToast('error', 'Revert Error', err.message || 'Error executing revert action');
    } finally {
      setIsReverting(false);
    }
  };

  const getStatusBadge = (status: BulkImportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'PARTIALLY_COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Partial Success
          </span>
        );
      case 'REVERTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
            Reverted
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getSourceTypeBadge = (source: string) => {
    switch (source) {
      case 'CSV_UPLOAD':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3" /> CSV File
          </span>
        );
      case 'PASTE_DATA':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Pasted Feed
          </span>
        );
      case 'SAMPLE_DATA':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <Database className="w-3 h-3" /> Sample Feed
          </span>
        );
      case 'API_SYNC':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Boxes className="w-3 h-3" /> API Sync
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {source}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bulk Batches</p>
            <h3 className="text-2xl font-black text-slate-900">{metrics.totalImports}</h3>
            <p className="text-[11px] text-slate-400">All-time upload jobs</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SKUs Ingested</p>
            <h3 className="text-2xl font-black text-slate-900">{metrics.totalIngestedSKUs.toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-600 font-medium">Created or updated in catalog</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Success Rate</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-slate-900">{metrics.overallSuccessRate}%</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Optimal
              </span>
            </div>
            <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.overallSuccessRate)}%` }}
              ></div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reverted Batches</p>
            <h3 className="text-2xl font-black text-slate-900">{metrics.revertedCount}</h3>
            <p className="text-[11px] text-purple-600 font-medium">Rollback actions preserved</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Batch #, file name, operator..."
              className="w-full pl-9 pr-20 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold transition"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Batches' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'PARTIALLY_COMPLETED', label: 'Partial Success' },
              { id: 'REVERTED', label: 'Reverted' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={() => fetchHistory()}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition shrink-0"
              title="Refresh Import History"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              id="start-new-bulk-upload-btn"
              onClick={onOpenBulkImportModal}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>New Bulk Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* History Batches List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Bulk Upload Activity Logs</h2>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {historyRecords.length} records
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Immutable audit record of all multi-SKU ingestion jobs with rollback tracking
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-500">Loading bulk import logs...</p>
          </div>
        ) : historyRecords.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">No Bulk Upload History Found</h3>
            <p className="text-xs text-slate-500 mb-4">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No import jobs match the current filter criteria.'
                : 'You have not executed any bulk product catalog imports yet.'}
            </p>
            <button
              onClick={onOpenBulkImportModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import First Product Batch</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Batch &amp; File Manifest</th>
                  <th className="py-3 px-4">Uploaded By &amp; Date</th>
                  <th className="py-3 px-4">SKU Breakdown</th>
                  <th className="py-3 px-4">Success Rate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {historyRecords.map((record) => {
                  const uploadDate = new Date(record.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const uploadTime = new Date(record.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50/80 transition ${
                        record.status === 'REVERTED' ? 'bg-slate-50/40 opacity-90' : ''
                      }`}
                    >
                      {/* Batch & File */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {record.batchNumber}
                            </span>
                            {getSourceTypeBadge(record.sourceType)}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium truncate max-w-xs">{record.fileName}</span>
                          </div>
                          {record.revertSummary && (
                            <p className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mt-1 max-w-md font-medium">
                              ↩️ {record.revertSummary}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Uploaded By */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{record.createdBy?.name || 'Administrator'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {uploadDate} at {uploadTime}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU Breakdown */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold"
                              title="New SKUs created"
                            >
                              +{record.createdCount} Created
                            </span>
                            {record.updatedCount > 0 && (
                              <span
                                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold"
                                title="Existing SKUs updated"
                              >
                                ~{record.updatedCount} Updated
                              </span>
                            )}
                            {record.errorCount > 0 && (
                              <span
                                className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold"
                                title="Rows skipped due to errors"
                              >
                                !{record.errorCount} Errors
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            Total Processed: <span className="font-bold text-slate-600">{record.totalRecords}</span> items
                          </div>
                        </div>
                      </td>

                      {/* Success Rate */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-black ${
                                record.successRate >= 95
                                  ? 'text-emerald-600'
                                  : record.successRate >= 75
                                  ? 'text-blue-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {record.successRate}%
                            </span>
                          </div>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                record.successRate >= 95
                                  ? 'bg-emerald-500'
                                  : record.successRate >= 75
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, record.successRate)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(record.status)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowDetailModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Inspect batch details & SKUs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {/* Revert Link / Button */}
                          {record.isRevertible && record.status !== 'REVERTED' ? (
                            <button
                              id={`revert-batch-btn-${record.id}`}
                              onClick={() => {
                                setRevertTargetRecord(record);
                                setShowRevertModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Revert this bulk upload action"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                              <span>Revert</span>
                            </button>
                          ) : record.status === 'REVERTED' ? (
                            <span className="text-[11px] font-bold text-slate-400 italic px-2 py-1 bg-slate-100 rounded-lg">
                              Reverted
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-300 px-2 py-1">
                              Locked
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Details Modal */}
      {selectedRecord && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Bulk Upload Batch: ${selectedRecord.batchNumber}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {selectedRecord.batchNumber}
                  </span>
                  {getSourceTypeBadge(selectedRecord.sourceType)}
                  {getStatusBadge(selectedRecord.status)}
                </div>
                <p className="text-xs text-slate-500">
                  File: <span className="font-medium text-slate-700">{selectedRecord.fileName}</span> • Ingested on{' '}
                  {new Date(selectedRecord.createdAt).toLocaleString('en-IN')} by{' '}
                  <span className="font-semibold text-slate-800">{selectedRecord.createdBy?.name}</span>
                </p>
              </div>

              {selectedRecord.isRevertible && selectedRecord.status !== 'REVERTED' && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setRevertTargetRecord(selectedRecord);
                    setShowRevertModal(true);
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Revert This Bulk Action</span>
                </button>
              )}
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Rows</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{selectedRecord.totalRecords}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
                <span className="text-[11px] font-semibold uppercase">Created SKUs</span>
                <p className="text-xl font-black mt-0.5">+{selectedRecord.createdCount}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-800">
                <span className="text-[11px] font-semibold uppercase">Updated SKUs</span>
                <p className="text-xl font-black mt-0.5">~{selectedRecord.updatedCount}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800">
                <span className="text-[11px] font-semibold uppercase">Errors Skipped</span>
                <p className="text-xl font-black mt-0.5">{selectedRecord.errorCount}</p>
              </div>
            </div>

            {/* If Reverted */}
            {selectedRecord.revertSummary && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-purple-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  <span>Rollback Audit Event</span>
                </div>
                <p className="text-xs">{selectedRecord.revertSummary}</p>
                <p className="text-[11px] text-purple-600">
                  Executed by {selectedRecord.revertedBy} on{' '}
                  {selectedRecord.revertedAt && new Date(selectedRecord.revertedAt).toLocaleString('en-IN')}
                </p>
              </div>
            )}

            {/* Created Products Breakdown */}
            {selectedRecord.createdProductsSummary && selectedRecord.createdProductsSummary.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  <span>Created Catalog SKUs ({selectedRecord.createdProductsSummary.length})</span>
                </h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectedRecord.createdProductsSummary.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-mono font-bold text-slate-900 text-[11px] mr-2">
                          {item.productCode}
                        </span>
                        <span className="text-slate-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {item.categoryName}
                        </span>
                        <span className="font-bold text-slate-900">
                          ₹{item.unitPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Updated Products Snapshot */}
            {selectedRecord.updatedProductSnapshots && selectedRecord.updatedProductSnapshots.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>Updated SKUs &amp; Pre-Import State ({selectedRecord.updatedProductSnapshots.length})</span>
                </h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectedRecord.updatedProductSnapshots.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-mono font-bold text-slate-900 text-[11px] mr-2">
                          {item.productCode}
                        </span>
                        <span className="text-slate-700">{item.name}</span>
                      </div>
                      <div className="text-right text-[11px] text-slate-500">
                        Prior Unit Price: <span className="font-bold text-slate-700">₹{item.previousState.unitPrice?.toLocaleString('en-IN') || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row Validation Errors if any */}
            {selectedRecord.errors && selectedRecord.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-rose-800 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Parsing &amp; Validation Errors ({selectedRecord.errors.length})</span>
                </h4>
                <div className="max-h-40 overflow-y-auto border border-rose-200 bg-rose-50/50 rounded-xl divide-y divide-rose-100">
                  {selectedRecord.errors.map((err, idx) => (
                    <div key={idx} className="p-2.5 text-xs text-rose-900 flex items-start gap-2">
                      <span className="font-mono font-bold bg-rose-200 text-rose-950 px-1.5 py-0.5 rounded text-[10px]">
                        Row {err.row}
                      </span>
                      <div>
                        <span className="font-semibold">{err.productCode || err.name || 'Unknown SKU'}: </span>
                        <span>{err.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close Log
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Revert Action Confirmation Modal */}
      {revertTargetRecord && (
        <Modal
          isOpen={showRevertModal}
          onClose={() => !isReverting && setShowRevertModal(false)}
          title="Confirm Revert of Bulk Upload Action"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-rose-900">
                  Are you sure you want to rollback batch {revertTargetRecord.batchNumber}?
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed">
                  This destructive operation will permanently purge newly created SKUs and restore previously existing SKUs to their pre-import price, quantity, and metadata states.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Rollback Scope:</h5>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>
                    <strong>{revertTargetRecord.createdProductIds?.length || revertTargetRecord.createdCount} newly created SKUs</strong> will be deleted from the catalog.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span>
                    <strong>{revertTargetRecord.updatedProductSnapshots?.length || revertTargetRecord.updatedCount} modified SKUs</strong> will be restored to their prior snapshot state.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>
                    Category SKU inventory counts and audit trails will be automatically updated.
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={isReverting}
                onClick={() => setShowRevertModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-revert-batch-btn"
                disabled={isReverting}
                onClick={handleExecuteRevert}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isReverting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rolling back SKUs...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Revert Bulk Action</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
