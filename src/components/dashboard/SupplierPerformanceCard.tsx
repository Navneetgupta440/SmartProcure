import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SupplierRanking, Product, Supplier } from '../../types';
import { useI18n } from '../../context/I18nContext';
import {
  Award,
  Star,
  TrendingUp,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sparkles,
  Zap,
  Building2,
  ArrowRight,
  BarChart2,
  Layers,
  Crown,
  Medal,
} from 'lucide-react';

interface SupplierPerformanceCardProps {
  onNavigate?: (tabId: string) => void;
}

export const SupplierPerformanceCard: React.FC<SupplierPerformanceCardProps> = ({ onNavigate }) => {
  const { t, formatCurrency } = useI18n();
  const [rankings, setRankings] = useState<SupplierRanking[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'podium' | 'matrix'>('podium');
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Fetch ranking metrics and catalog products from API
  const fetchRankings = async (prodId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Parallel fetch rankings, suppliers and product catalog
      const [rankingsRes, suppliersRes, productsRes] = await Promise.all([
        api.getSupplierRankings(prodId || undefined),
        api.getSuppliers(),
        api.getProducts(),
      ]);

      if (rankingsRes.success && rankingsRes.data) {
        setRankings(rankingsRes.data);
      }
      if (suppliersRes.success && suppliersRes.data) {
        setSuppliers(suppliersRes.data);
      }
      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to fetch supplier rankings:', err);
      setError(err?.message || 'Failed to load supplier performance rankings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings(selectedProductId);
  }, [selectedProductId]);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProductId(e.target.value);
  };

  const toggleExpand = (supplierId: string) => {
    setExpandedSupplierId(expandedSupplierId === supplierId ? null : supplierId);
  };

  // Helper to render star ratings visually
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.4;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <div key={i} className="relative inline-block w-3.5 h-3.5">
            <Star className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
        );
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  // Medal styling helper
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          label: 'Rank #1',
          bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
          icon: <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />,
        };
      case 2:
        return {
          label: 'Rank #2',
          bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400/30',
          icon: <Medal className="w-3.5 h-3.5 text-slate-400" />,
        };
      case 3:
        return {
          label: 'Rank #3',
          bg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
          icon: <Medal className="w-3.5 h-3.5 text-amber-700 dark:text-amber-500" />,
        };
      default:
        return {
          label: `Rank #${rank}`,
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
          icon: <Award className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  // Top ranked supplier
  const topSupplier = rankings.length > 0 ? rankings[0] : null;
  const topSupplierDetails = topSupplier
    ? suppliers.find((s) => s.id === topSupplier.supplierId)
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
      {/* Card Header with Live API Badge, Product Filter & Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              Supplier Performance & Ranking Matrix
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-factor weighted ranking based on quality, on-time SLA, lead time, price & reliability.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Product Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedProductId}
              onChange={handleProductChange}
              className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Catalog Products (Global Score)</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name} ({prod.productCode})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('podium')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'podium'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
              title="Leaderboard / Podium View"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Podium</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
              title="Full Comparison Matrix"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matrix</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchRankings(selectedProductId)}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Refresh API Rankings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && rankings.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Calculating algorithmic vendor scores from REST API...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            onClick={() => fetchRankings(selectedProductId)}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Retry Fetching Rankings
          </button>
        </div>
      ) : rankings.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          No supplier performance data available.
        </div>
      ) : (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Spotlight Hero: #1 Top Ranked Partner */}
          {topSupplier && (
            <div className="relative rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-800/50 p-5 text-white shadow-md overflow-hidden">
              {/* Background ambient badge glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                      <span>#1 Preferred Vendor Partner</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>GST Verified</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                      <span>{topSupplier.companyName}</span>
                    </h4>
                    <p className="text-xs text-indigo-200 mt-1 max-w-xl leading-relaxed">
                      {topSupplier.reason}
                    </p>
                  </div>

                  {/* Highlight Metrics Pills */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/60 border border-indigo-800/40 text-xs">
                      {renderStars(topSupplier.rating)}
                      <span className="font-bold text-white ml-1">{topSupplier.rating}</span>
                      <span className="text-[10px] text-slate-400">/ 5.0</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/60 border border-indigo-800/40 text-xs">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-slate-300">Lead Time:</span>
                      <span className="font-bold text-white">{topSupplier.leadDays} Days</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/60 border border-indigo-800/40 text-xs">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-300">On-Time SLA:</span>
                      <span className="font-bold text-emerald-300">{topSupplier.deliveryScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Big Composite Score Gauge Box */}
                <div className="shrink-0 flex sm:flex-col items-center justify-between sm:justify-center p-4 rounded-xl bg-slate-950/80 border border-indigo-700/40 text-center min-w-[140px] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                    Composite Score
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-indigo-300 font-mono">
                    {topSupplier.compositeScore}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Excellent
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: PODIUM / LEADERBOARD CARDS */}
          {viewMode === 'podium' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankings.map((rankItem, index) => {
                const rankBadge = getRankBadge(rankItem.recommendationRank);
                const isTop = rankItem.recommendationRank === 1;
                const isExpanded = expandedSupplierId === rankItem.supplierId;

                return (
                  <div
                    key={rankItem.supplierId}
                    className={`rounded-xl border p-4.5 transition-all space-y-3.5 ${
                      isTop
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800/60 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/70 hover:border-slate-300'
                    }`}
                  >
                    {/* Header: Rank + Name + Score */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${rankBadge.bg}`}
                          >
                            {rankBadge.icon}
                            <span>{rankBadge.label}</span>
                          </span>
                          {rankItem.recommended && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {rankItem.companyName}
                        </h5>
                      </div>

                      {/* Score circle badge */}
                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                          {rankItem.compositeScore}
                          <span className="text-[10px] text-slate-400 font-normal">/100</span>
                        </div>
                        <div className="text-[9px] text-slate-400">Overall Score</div>
                      </div>
                    </div>

                    {/* Star Rating & Lead Time Bar */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5">
                        {renderStars(rankItem.rating)}
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {rankItem.rating}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{rankItem.leadDays}d Lead Time</span>
                      </div>
                    </div>

                    {/* Multi-Metric Performance Progress Bars */}
                    <div className="space-y-2 text-[11px]">
                      {/* Quality Score Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-600 dark:text-slate-400">Quality Score:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">
                            {rankItem.qualityScore}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${rankItem.qualityScore}%` }}
                          />
                        </div>
                      </div>

                      {/* On-Time Delivery Score Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-600 dark:text-slate-400">On-Time Delivery SLA:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">
                            {rankItem.deliveryScore}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${rankItem.deliveryScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Reliability Score Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-600 dark:text-slate-400">Reliability Index:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">
                            {rankItem.reliabilityScore}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${rankItem.reliabilityScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expandable Breakdown Drawer */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] space-y-1.5 text-slate-600 dark:text-slate-400 animate-in fade-in duration-150">
                        <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[9px]">
                          Weighted Factor Contributions:
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 font-mono">
                          <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            Price Score: <span className="font-bold">{rankItem.scoreBreakdown.priceScore}/100</span> (35%)
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            Quality: <span className="font-bold">{rankItem.scoreBreakdown.qualityScore}/100</span> (20%)
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            Delivery: <span className="font-bold">{rankItem.scoreBreakdown.deliveryScore}/100</span> (20%)
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            Rating: <span className="font-bold">{rankItem.scoreBreakdown.ratingScore}/100</span> (15%)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer buttons */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => toggleExpand(rankItem.supplierId)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Factors' : 'View Weights'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('suppliers')}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Vendor Info</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW MODE 2: COMPARISON MATRIX TABLE */
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Rank & Partner</th>
                    <th className="px-4 py-3 text-center">Composite Score</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3 text-center">Quality</th>
                    <th className="px-4 py-3 text-center">On-Time SLA</th>
                    <th className="px-4 py-3 text-center">Reliability</th>
                    <th className="px-4 py-3 text-center">Lead Time</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {rankings.map((rankItem) => {
                    const rankBadge = getRankBadge(rankItem.recommendationRank);
                    return (
                      <tr
                        key={rankItem.supplierId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${rankBadge.bg}`}
                            >
                              {rankItem.recommendationRank}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{rankItem.companyName}</span>
                                {rankItem.recommended && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                                    TOP
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Vendor ID: {rankItem.supplierId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                            {rankItem.compositeScore}/100
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {renderStars(rankItem.rating)}
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              {rankItem.rating}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {rankItem.qualityScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {rankItem.deliveryScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {rankItem.reliabilityScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                            {rankItem.leadDays} Days
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {onNavigate && (
                            <button
                              onClick={() => onNavigate('suppliers')}
                              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                            >
                              Details
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick Footer Navigation Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
              <span>Algorithmic weights: Price (35%), Quality (20%), Delivery (20%), Rating (15%), Reliability (10%)</span>
            </div>

            <div className="flex items-center gap-3">
              {onNavigate && (
                <>
                  <button
                    onClick={() => onNavigate('smart-procurement')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Smart Procurement Engine</span>
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    onClick={() => onNavigate('suppliers')}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                  >
                    <span>All Suppliers ({suppliers.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
