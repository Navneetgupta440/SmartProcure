import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Supplier } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Star,
  ShieldCheck,
  Truck,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Plus,
  BarChart2,
  TrendingUp,
  Award,
} from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    gstNumber: '',
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.getSuppliers();
      if (res.success && res.data) {
        setSuppliers(res.data);
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSupplier(formData);
      if (res.success) {
        showToast('success', 'Supplier Registered', `${res.data.companyName} added to directory.`);
        setShowCreateModal(false);
        fetchSuppliers();
      }
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Approved Vendor & Supplier Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time quality scores, delivery lead times, reliability indices, and tax compliance records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Supplier</span>
          </button>
        </div>
      </div>

      {/* Supplier Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs font-semibold text-slate-500">Loading vendors...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base border border-blue-100">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{sup.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{sup.companyName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>
                      {sup.city}, {sup.state}
                    </span>
                  </p>
                </div>

                {/* Score Breakdown Bars */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                      <span>Quality Rating</span>
                      <span className="text-slate-900 font-bold">{sup.qualityScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${sup.qualityScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                      <span>On-Time Delivery</span>
                      <span className="text-slate-900 font-bold">{sup.deliveryScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${sup.deliveryScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                      <span>Reliability Score</span>
                      <span className="text-slate-900 font-bold">{sup.reliabilityScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${sup.reliabilityScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact & GST details */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-500">{sup.gstNumber}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                <span className="text-slate-500 font-medium">Avg Lead Time:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {sup.averageLeadDays} business days
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Onboard Supplier */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Onboard New Supplier Partner"
        subtitle="Register vendor commercial terms, tax identifiers, and communication channels"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company Legal Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Global Technology Private Limited"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Officer Name</label>
              <input
                type="text"
                placeholder="e.g. Sanjeev Kapoor"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GST / Tax Identification *</label>
              <input
                type="text"
                required
                placeholder="e.g. 29AAACT9823P1Z4"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                placeholder="contracts@vendor.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State / Province</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
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
              Register Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
