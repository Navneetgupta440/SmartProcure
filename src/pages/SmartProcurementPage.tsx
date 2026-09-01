import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Product, Supplier } from '../types';
import { useNotifications } from '../context/NotificationContext';
import {
  Sparkles,
  Calculator,
  Award,
  TrendingUp,
  BrainCircuit,
  Boxes,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

export const SmartProcurementPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // EOQ Calculator inputs
  const [selectedProductId, setSelectedProductId] = useState('');
  const [annualDemand, setAnnualDemand] = useState(120);
  const [orderCost, setOrderCost] = useState(1500); // Cost per order (₹)
  const [holdingCostPct, setHoldingCostPct] = useState(15); // Holding cost percentage

  // Weighted Supplier Matrix weights
  const [priceWeight, setPriceWeight] = useState(30);
  const [qualityWeight, setQualityWeight] = useState(35);
  const [deliveryWeight, setDeliveryWeight] = useState(35);

  // Gemini AI Advisor
  const [aiPrompt, setAiPrompt] = useState('Analyze our current low stock items and recommend the most cost-effective bulk procurement schedule for Q3.');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes] = await Promise.all([api.getProducts(), api.getSuppliers()]);
      if (pRes.success && pRes.data) {
        setProducts(pRes.data);
        if (pRes.data.length > 0) setSelectedProductId(pRes.data[0].id);
      }
      if (sRes.success && sRes.data) setSuppliers(sRes.data);
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // EOQ Formula: sqrt((2 * D * S) / H)
  // D = Annual Demand, S = Setup/Order Cost, H = Holding Cost per unit (Price * holdingCostPct / 100)
  const holdingCostPerUnit = selectedProduct ? (selectedProduct.unitPrice * holdingCostPct) / 100 : 1;
  const eoqUnits = Math.round(
    Math.sqrt((2 * annualDemand * orderCost) / Math.max(1, holdingCostPerUnit))
  );
  const reorderPointUnits = selectedProduct ? Math.round(selectedProduct.minimumStock * 1.5) : 10;

  // Supplier Multi-criteria Weighted Scoring Calculation
  const scoredSuppliers = suppliers.map((sup) => {
    // Normalizing scores
    const qualityScoreWeighted = (sup.qualityScore / 100) * qualityWeight;
    const deliveryScoreWeighted = (sup.deliveryScore / 100) * deliveryWeight;
    // Lower lead time = better price/logistics score
    const leadTimeScore = Math.max(10, 100 - sup.averageLeadDays * 10);
    const priceScoreWeighted = (leadTimeScore / 100) * priceWeight;
    const totalScore = (qualityScoreWeighted + deliveryScoreWeighted + priceScoreWeighted).toFixed(1);

    return {
      ...sup,
      compositeScore: Number(totalScore),
    };
  }).sort((a, b) => b.compositeScore - a.compositeScore);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    try {
      setAiLoading(true);
      setAiResponse('');
      const res = await api.askProcurementAI(aiPrompt, {
        lowStockItems: products.filter((p) => p.quantity <= p.minimumStock),
        totalSuppliers: suppliers.length,
      });

      if (res.success && res.data) {
        setAiResponse(res.data.response);
      }
    } catch (err: any) {
      showToast('error', 'AI Request Failed', err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            Intelligent Operations Suite
          </span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">Smart Procurement & AI Advisor</h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Advanced inventory mathematics, Economic Order Quantity (EOQ) optimization, multi-criteria vendor scoring, and Gemini-powered procurement decision support.
        </p>
      </div>

      {/* Grid: EOQ Calculator + Weighted Supplier Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EOQ Optimization Calculator */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Economic Order Quantity (EOQ) Engine</h3>
          </div>
          <p className="text-xs text-slate-500">
            Determine the mathematical order volume that minimizes total holding and ordering costs.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Product SKU</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Unit: ₹{p.unitPrice.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Annual Demand (Units)</label>
                <input
                  type="number"
                  value={annualDemand}
                  onChange={(e) => setAnnualDemand(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Order Placement Cost (₹)</label>
                <input
                  type="number"
                  value={orderCost}
                  onChange={(e) => setOrderCost(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Carrying Cost % / Year</label>
                <input
                  type="number"
                  value={holdingCostPct}
                  onChange={(e) => setHoldingCostPct(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 text-center font-bold"
                />
              </div>
            </div>

            {/* Calculated EOQ Results Card */}
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Optimal Order Size (EOQ)</span>
                <div className="text-2xl font-black text-blue-950 mt-0.5">{eoqUnits} Units</div>
                <p className="text-[10px] text-blue-600 mt-0.5">Minimizes inventory cost</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Suggested Reorder Point (ROP)</span>
                <div className="text-2xl font-black text-blue-950 mt-0.5">{reorderPointUnits} Units</div>
                <p className="text-[10px] text-blue-600 mt-0.5">Trigger replenishment when stock hits this</p>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Criteria Weighted Vendor Scorecard */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Weighted Supplier Evaluation Matrix</h3>
          </div>
          <p className="text-xs text-slate-500">
            Real-time multi-criteria decision analysis (MCDA) weighting Quality, Delivery SLA, and Pricing.
          </p>

          {/* Dynamic Weight Sliders */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 flex justify-between">
                <span>Quality Weight</span>
                <span className="text-indigo-600">{qualityWeight}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="70"
                value={qualityWeight}
                onChange={(e) => setQualityWeight(Number(e.target.value))}
                className="w-full mt-1 accent-indigo-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 flex justify-between">
                <span>Delivery Weight</span>
                <span className="text-indigo-600">{deliveryWeight}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="70"
                value={deliveryWeight}
                onChange={(e) => setDeliveryWeight(Number(e.target.value))}
                className="w-full mt-1 accent-indigo-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 flex justify-between">
                <span>Price / Lead Weight</span>
                <span className="text-indigo-600">{priceWeight}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="70"
                value={priceWeight}
                onChange={(e) => setPriceWeight(Number(e.target.value))}
                className="w-full mt-1 accent-indigo-600"
              />
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {scoredSuppliers.map((sup, rank) => (
              <div
                key={sup.id}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                  rank === 0
                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      rank === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{rank + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">{sup.companyName}</h4>
                    <p className="text-[10px] text-slate-400">
                      Quality: {sup.qualityScore}% • SLA: {sup.deliveryScore}% • Lead: {sup.averageLeadDays}d
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-slate-900">{sup.compositeScore}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">/ 100 Index</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gemini AI Procurement Advisor Interactive Console */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Gemini AI Procurement Co-Pilot</h3>
              <p className="text-xs text-slate-500">
                Server-side LLM advisory on spend optimization, supplier negotiation strategy, and risk mitigation
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
            GEMINI-2.5-FLASH
          </span>
        </div>

        <form onSubmit={handleAskAI} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask anything regarding procurement optimization, budget planning, or vendor evaluations..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setAiPrompt('Compare our top 3 IT suppliers and give a negotiation strategy to reduce lead times by 20%.')
                }
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
              >
                Supplier Negotiation Strategy
              </button>
              <button
                type="button"
                onClick={() =>
                  setAiPrompt('What bulk order batching schedule should we follow to minimize annual holding costs for laptops and monitors?')
                }
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
              >
                Bulk Batching Schedule
              </button>
            </div>

            <button
              type="submit"
              disabled={aiLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Strategy...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Consult AI Advisor</span>
                </>
              )}
            </button>
          </div>
        </form>

        {aiResponse && (
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs border border-slate-800 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-indigo-400 font-bold text-[11px] uppercase tracking-wider pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Strategic Intelligence Advisory Output</span>
              </span>
              <span>REST /api/v1/ai/advisory</span>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed font-sans pt-1 text-slate-200">
              {aiResponse}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
