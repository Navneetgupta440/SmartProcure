import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { Product, Category, Supplier } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Modal } from '../components/common/Modal';
import { FlipkartProductModal } from '../components/products/FlipkartProductModal';
import { FlipkartCartDrawer, CartItem } from '../components/products/FlipkartCartDrawer';
import { BulkProductImportModal } from '../components/products/BulkProductImportModal';
import { RecentImportsTab } from '../components/products/RecentImportsTab';
import {
  Package,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Boxes,
  MapPin,
  Tag,
  Building2,
  CheckCircle2,
  RefreshCw,
  Star,
  ShieldCheck,
  Truck,
  ShoppingCart,
  Grid,
  List,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Laptop,
  Smartphone,
  Monitor,
  Network,
  Server,
  Armchair,
  Video,
  ShieldAlert,
  Zap,
  Briefcase,
  Upload,
  Database,
  FileSpreadsheet,
  History,
  X,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Main Tab: Catalog vs Recent Imports
  const [activeTab, setActiveTab] = useState<'catalog' | 'recent_imports'>('catalog');

  // Filters & Views
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [onlyAssured, setOnlyAssured] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW'>('ALL');
  const [sortBy, setSortBy] = useState<'popularity' | 'price_asc' | 'price_desc' | 'rating' | 'discount'>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals & Drawers
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Cart / Requisition Basket State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // New Product Form
  const [formData, setFormData] = useState({
    name: '',
    productCode: '',
    categoryId: '',
    supplierId: '',
    brand: '',
    unitPrice: 25000,
    mrpPrice: 32000,
    minimumStock: 5,
    maximumStock: 30,
    unit: 'Units',
    description: '',
    imageUrl: '',
    isFlipkartAssured: true,
    highlights: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, supRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getSuppliers(),
      ]);

      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (supRes.success) setSuppliers(supRes.data);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute available Brands
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach((p) => {
      if (p.brand) brandsSet.add(p.brand);
    });
    return Array.from(brandsSet).sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.productCode.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCatId) {
      list = list.filter((p) => p.categoryId === selectedCatId);
    }

    // Brand
    if (selectedBrand) {
      list = list.filter((p) => p.brand === selectedBrand);
    }

    // Flipkart Assured
    if (onlyAssured) {
      list = list.filter((p) => p.isFlipkartAssured);
    }

    // Rating
    if (minRating > 0) {
      list = list.filter((p) => (p.rating || 0) >= minRating);
    }

    // Stock Filter
    if (stockFilter === 'LOW') {
      list = list.filter((p) => p.quantity <= p.minimumStock);
    } else if (stockFilter === 'IN_STOCK') {
      list = list.filter((p) => p.quantity > 0);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'price_asc') return a.unitPrice - b.unitPrice;
      if (sortBy === 'price_desc') return b.unitPrice - a.unitPrice;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'discount') return (b.discountPercentage || 0) - (a.discountPercentage || 0);
      // Popularity (review count / quantity)
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });

    return list;
  }, [products, search, selectedCatId, selectedBrand, onlyAssured, minRating, stockFilter, sortBy]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(
      'success',
      'Added to PR Basket',
      `${quantity}x ${product.name} added to Requisition Basket.`
    );
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSubmitCartPurchaseRequest = async (
    department: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    reason: string
  ) => {
    try {
      const requestItems = cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const res = await api.createPurchaseRequest({
        department,
        priority,
        reason,
        items: requestItems,
      });

      if (res.success) {
        showToast(
          'success',
          'Purchase Request Submitted',
          `Requisition ${res.data.requestNumber} for ₹${res.data.estimatedAmount.toLocaleString(
            'en-IN'
          )} successfully sent for approval.`
        );
        fetchData();
      }
    } catch (err: any) {
      showToast('error', 'Requisition Failed', err.message);
      throw err;
    }
  };

  // Instant Request for single product
  const handleDirectRequest = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setShowCartDrawer(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const highlightsArray = formData.highlights
        ? formData.highlights.split('\n').filter((h) => h.trim().length > 0)
        : [];

      const payload = {
        ...formData,
        highlights: highlightsArray,
      };

      const res = await api.createProduct(payload);
      if (res.success) {
        showToast('success', 'Product Created', `Product ${res.data.name} added to catalog.`);
        setShowCreateModal(false);
        fetchData();
      }
    } catch (err: any) {
      showToast('error', 'Failed to Create', err.message);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    try {
      const res = await api.adjustInventory({
        productId: adjustTarget.id,
        quantityChange: Number(adjustQty),
        reason: adjustReason,
      });

      if (res.success) {
        showToast('success', 'Stock Adjusted', `Inventory updated for ${adjustTarget.productCode}`);
        setShowAdjustModal(false);
        fetchData();
      }
    } catch (err: any) {
      showToast('error', 'Adjustment Error', err.message);
    }
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartValue = cartItems.reduce(
    (acc, item) => acc + item.product.unitPrice * item.quantity,
    0
  );

  // Category Icon Resolver
  const getCategoryIcon = (code: string) => {
    switch (code) {
      case 'CAT-LAP':
        return <Laptop className="w-4 h-4" />;
      case 'CAT-MOB':
        return <Smartphone className="w-4 h-4" />;
      case 'CAT-DISP':
        return <Monitor className="w-4 h-4" />;
      case 'CAT-NET':
        return <Network className="w-4 h-4" />;
      case 'CAT-SRV':
        return <Server className="w-4 h-4" />;
      case 'CAT-FURN':
        return <Armchair className="w-4 h-4" />;
      case 'CAT-CONF':
        return <Video className="w-4 h-4" />;
      case 'CAT-SEC':
        return <ShieldAlert className="w-4 h-4" />;
      case 'CAT-PWR':
        return <Zap className="w-4 h-4" />;
      case 'CAT-STAT':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Boxes className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Flipkart Brand Banner & Header Bar */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded italic tracking-tighter shadow-xs">
                Flipkart
              </span>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Enterprise B2B Catalog
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                {products.length} SKUs Live
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Enterprise Hardware, Cloud Servers &amp; Facility Supplies
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Procure certified corporate assets with volume pricing, GST input credit, 100% Flipkart Assured OEM authenticity, and automated multi-level requisition approvals.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchData()}
              className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 transition"
              title="Refresh Catalog"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Cart / PR Basket Button */}
            <button
              id="open-pr-cart-drawer-btn"
              onClick={() => setShowCartDrawer(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 relative cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>PR Basket</span>
              {totalCartCount > 0 && (
                <span className="bg-slate-950 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Bulk Product Import Button */}
            <button
              id="bulk-product-import-btn"
              onClick={() => setShowBulkImportModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 border border-slate-700 hover:border-slate-600 cursor-pointer"
              title="Bulk import & map product metadata via CSV/JSON"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Bulk Import</span>
            </button>

            <button
              id="add-product-btn"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add SKU</span>
            </button>
          </div>
        </div>

        {/* Flipkart Category Top Strip */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCatId('')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${
              selectedCatId === ''
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>All Categories ({categories.length})</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(isSelected ? '' : cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {getCategoryIcon(cat.code)}
                <span>{cat.name}</span>
                {cat.productCount ? (
                  <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.5 rounded text-slate-400">
                    {cat.productCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Sub-Tabs: Product Catalog vs Recent Imports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            id="catalog-tab-btn"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4 text-blue-400" />
            <span>Product Catalog</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === 'catalog' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {products.length} SKUs
            </span>
          </button>

          <button
            id="recent-imports-tab-btn"
            onClick={() => setActiveTab('recent_imports')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'recent_imports'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Recent Imports</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'recent_imports' ? 'bg-slate-800 text-amber-300' : 'bg-amber-100 text-amber-800'
              }`}
            >
              History &amp; Rollback
            </span>
          </button>
        </div>

        {activeTab === 'recent_imports' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkImportModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Launch Bulk Product Importer</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* View: Recent Imports Tab */}
      {activeTab === 'recent_imports' ? (
        <RecentImportsTab
          onOpenBulkImportModal={() => setShowBulkImportModal(true)}
          onRefreshCatalog={() => fetchData()}
        />
      ) : (
        <>
          {/* Main Filter & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by brand, SKU, hardware specs (e.g. Dell, Apple M3, Cisco, Herman Miller)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Brand Dropdown */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Brands ({availableBrands.length})</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Assured Toggle */}
            <button
              onClick={() => setOnlyAssured(!onlyAssured)}
              className={`px-3 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition ${
                onlyAssured
                  ? 'bg-blue-50 border-blue-400 text-blue-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="italic font-serif font-black text-blue-600">f</span>
              <span>Assured Only</span>
            </button>

            {/* Rating Filter */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={0}>All Ratings</option>
              <option value={4.5}>4.5★ &amp; above</option>
              <option value={4.0}>4.0★ &amp; above</option>
              <option value={3.5}>3.5★ &amp; above</option>
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Stock</option>
              <option value="IN_STOCK">In Stock Only</option>
              <option value="LOW">Low Stock Alerts</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="popularity">Sort: Popularity</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="discount">Sort: Biggest Discount</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            {/* Grid / List View Switcher */}
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(selectedCatId || selectedBrand || onlyAssured || minRating > 0 || stockFilter !== 'ALL' || search) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Active Filters:</span>

            {selectedCatId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-200 text-[11px]">
                <span>Category: {categories.find((c) => c.id === selectedCatId)?.name}</span>
                <button onClick={() => setSelectedCatId('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedBrand && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 font-semibold rounded-lg border border-slate-200 text-[11px]">
                <span>Brand: {selectedBrand}</span>
                <button onClick={() => setSelectedBrand('')} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {onlyAssured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 font-semibold rounded-lg border border-amber-200 text-[11px]">
                <span>Flipkart Assured</span>
                <button onClick={() => setOnlyAssured(false)} className="hover:text-amber-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded-lg border border-emerald-200 text-[11px]">
                <span>Rating: {minRating}★+</span>
                <button onClick={() => setMinRating(0)} className="hover:text-emerald-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {stockFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 font-semibold rounded-lg border border-rose-200 text-[11px]">
                <span>Stock: {stockFilter}</span>
                <button onClick={() => setStockFilter('ALL')} className="hover:text-rose-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={() => {
                setSelectedCatId('');
                setSelectedBrand('');
                setOnlyAssured(false);
                setMinRating(0);
                setStockFilter('ALL');
                setSearch('');
              }}
              className="text-[11px] text-blue-600 hover:underline font-semibold ml-2"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Products Display Section */}
      {loading ? (
        <div className="p-16 text-center text-xs font-semibold text-slate-500 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
          <span>Loading Flipkart enterprise catalog items...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No products matching your search criteria</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your brand, category or rating filters, or add a new SKU.
          </p>
          <button
            onClick={() => {
              setSelectedCatId('');
              setSelectedBrand('');
              setOnlyAssured(false);
              setMinRating(0);
              setStockFilter('ALL');
              setSearch('');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= FLIPKART GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => {
            const mrp = prod.mrpPrice || Math.round(prod.unitPrice * 1.25);
            const discount = prod.discountPercentage || Math.round(((mrp - prod.unitPrice) / mrp) * 100);
            const rating = prod.rating || 4.5;
            const reviewCount = prod.reviewCount || 120;
            const isLowStock = prod.quantity <= prod.minimumStock;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div
                    onClick={() => {
                      setSelectedDetailProduct(prod);
                      setShowProductDetailModal(true);
                    }}
                    className="h-44 bg-slate-50 relative overflow-hidden cursor-pointer flex items-center justify-center p-3"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* SKU Code */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs">
                        {prod.productCode}
                      </span>
                    </div>

                    {/* Assured Badge */}
                    {prod.isFlipkartAssured && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                          <span className="italic font-serif text-amber-300">f</span>
                          <span>Assured</span>
                        </span>
                      </div>
                    )}

                    {/* Discount Ribbon */}
                    {discount > 0 && (
                      <div className="absolute bottom-2 left-2.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                        {discount}% OFF
                      </div>
                    )}

                    {/* Low Stock Warning */}
                    {isLowStock && (
                      <div className="absolute bottom-2 right-2.5 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>LOW STOCK</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2">
                    {/* Brand & Category */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-600 uppercase tracking-wider truncate">
                        {prod.brand || prod.categoryName}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate max-w-[100px]">
                        {prod.categoryName}
                      </span>
                    </div>

                    {/* Product Title */}
                    <h3
                      onClick={() => {
                        setSelectedDetailProduct(prod);
                        setShowProductDetailModal(true);
                      }}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug"
                      title={prod.name}
                    >
                      {prod.name}
                    </h3>

                    {/* Rating & Reviews Chip */}
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                        <span>{rating}</span>
                        <Star className="w-2.5 h-2.5 fill-white" />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        ({reviewCount.toLocaleString()})
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="pt-1.5 flex items-baseline gap-2">
                      <span className="text-base font-black text-slate-900">
                        ₹{prod.unitPrice.toLocaleString('en-IN')}
                      </span>
                      {mrp > prod.unitPrice && (
                        <span className="text-xs font-medium text-slate-400 line-through">
                          ₹{mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Delivery & Stock Tag */}
                    <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-emerald-700 font-medium truncate">
                        <Truck className="w-3 h-3 shrink-0" />
                        <span className="truncate">{prod.deliveryTag || 'Free Express Delivery'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Stock: <strong className={isLowStock ? 'text-rose-600' : 'text-slate-700'}>{prod.quantity} {prod.unit}</strong></span>
                        <span className="truncate">{prod.supplierName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDetailProduct(prod);
                      setShowProductDetailModal(true);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white border border-slate-200 transition text-center"
                  >
                    Quick View
                  </button>

                  <button
                    onClick={() => handleAddToCart(prod, 1)}
                    className="p-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-xs cursor-pointer"
                    title="Add to Purchase Request Basket"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= FLIPKART LIST VIEW ================= */
        <div className="space-y-3">
          {filteredProducts.map((prod) => {
            const mrp = prod.mrpPrice || Math.round(prod.unitPrice * 1.25);
            const discount = prod.discountPercentage || Math.round(((mrp - prod.unitPrice) / mrp) * 100);
            const rating = prod.rating || 4.5;
            const reviewCount = prod.reviewCount || 120;
            const isLowStock = prod.quantity <= prod.minimumStock;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4 flex-1">
                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      setSelectedDetailProduct(prod);
                      setShowProductDetailModal(true);
                    }}
                    className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-2 relative shrink-0 cursor-pointer overflow-hidden group"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition"
                    />
                    {prod.isFlipkartAssured && (
                      <span className="absolute bottom-1 right-1 text-[8px] font-black px-1.5 py-0.2 bg-blue-600 text-white rounded">
                        f-Assured
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {prod.productCode}
                      </span>
                      <span className="text-[11px] font-bold text-blue-600 uppercase">
                        {prod.brand || prod.categoryName}
                      </span>
                    </div>

                    <h3
                      onClick={() => {
                        setSelectedDetailProduct(prod);
                        setShowProductDetailModal(true);
                      }}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                    >
                      {prod.name}
                    </h3>

                    {/* Highlights bullets preview */}
                    {prod.highlights && prod.highlights.length > 0 && (
                      <ul className="text-xs text-slate-500 list-disc list-inside line-clamp-1 hidden md:block">
                        <li>{prod.highlights[0]}</li>
                      </ul>
                    )}

                    {/* Rating & Supplier */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                        <span>{rating}</span>
                        <Star className="w-2.5 h-2.5 fill-white" />
                      </div>
                      <span>({reviewCount.toLocaleString()} ratings)</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{prod.supplierName}</span>
                      </span>
                      <span>•</span>
                      <span className={isLowStock ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        Stock: {prod.quantity} {prod.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Actions Right Section */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-2">
                  <div className="text-left sm:text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-slate-900">
                        ₹{prod.unitPrice.toLocaleString('en-IN')}
                      </span>
                      {discount > 0 && (
                        <span className="text-xs font-bold text-emerald-600">
                          {discount}% off
                        </span>
                      )}
                    </div>
                    {mrp > prod.unitPrice && (
                      <div className="text-xs text-slate-400 line-through">
                        ₹{mrp.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedDetailProduct(prod);
                        setShowProductDetailModal(true);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleAddToCart(prod, 1)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to PR</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Flipkart Cart / PR Basket Floating Quick Trigger (if cart has items) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom duration-200">
          <button
            id="floating-pr-cart-btn"
            onClick={() => setShowCartDrawer(true)}
            className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white p-3.5 px-5 rounded-full shadow-2xl border border-slate-700 transition cursor-pointer"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-white">Requisition Basket</div>
              <div className="text-[10px] text-amber-300 font-mono">
                ₹{totalCartValue.toLocaleString('en-IN')}
              </div>
            </div>
          </button>
        </div>
      )}
      </>
      )}

      {/* Flipkart Product Detail Modal */}
      <FlipkartProductModal
        product={selectedDetailProduct}
        isOpen={showProductDetailModal}
        onClose={() => {
          setShowProductDetailModal(false);
          setSelectedDetailProduct(null);
        }}
        onAddToCart={handleAddToCart}
        onDirectRequest={handleDirectRequest}
        onAdjustStock={(prod) => {
          setAdjustTarget(prod);
          setAdjustQty(0);
          setAdjustReason('Physical audit adjustment');
          setShowAdjustModal(true);
        }}
      />

      {/* Flipkart Cart Drawer */}
      <FlipkartCartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onSubmitPurchaseRequest={handleSubmitCartPurchaseRequest}
        userDepartment={currentUser.department}
      />

      {/* Modal: Add New Product SKU */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Catalog Product SKU"
        subtitle="Register a new hardware asset or office supply into the Flipkart B2B procurement database"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product SKU Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. PRD-LAP-10"
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                placeholder="e.g. Apple, Dell, Sony"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dell XPS 15 Workstation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Primary Supplier *</label>
              <select
                required
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName} ({s.rating}★)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Procurement Price (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">MRP Price (₹)</label>
              <input
                type="number"
                min={1}
                value={formData.mrpPrice}
                onChange={(e) => setFormData({ ...formData, mrpPrice: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Buffer</label>
              <input
                type="number"
                min={0}
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Key Highlights (1 per line)</label>
            <textarea
              rows={2}
              placeholder="32GB DDR5 RAM&#10;1TB NVMe Gen4 SSD&#10;3-Year ProSupport Warranty"
              value={formData.highlights}
              onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Technical specifications and details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isFlipkartAssured"
              checked={formData.isFlipkartAssured}
              onChange={(e) => setFormData({ ...formData, isFlipkartAssured: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isFlipkartAssured" className="font-semibold text-slate-700">
              Mark as Flipkart Assured (Verified Enterprise OEM Quality)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-xs"
            >
              Save Product SKU
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Stock */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title={`Adjust Stock: ${adjustTarget?.name || ''}`}
        subtitle={`Current quantity: ${adjustTarget?.quantity || 0} ${adjustTarget?.unit || 'Units'}`}
        maxWidth="md"
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
            <div>SKU: <strong className="font-mono text-slate-900">{adjustTarget?.productCode}</strong></div>
            <div>Safety Buffer Min: <strong className="text-slate-900">{adjustTarget?.minimumStock} {adjustTarget?.unit}</strong></div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Quantity Change (Positive to add, Negative to deduct) *
            </label>
            <input
              type="number"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
              placeholder="e.g. +10 or -5"
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Stock Adjustment *</label>
            <input
              type="text"
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Quarterly physical cycle count audit"
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdjustModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-xs"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Product Metadata Importer Modal */}
      <BulkProductImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportCompleted={() => {
          fetchData();
          showToast(
            'success',
            'Bulk Import Complete',
            'Catalog products updated with batch imported SKUs.'
          );
        }}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
};
