import React, { useState } from 'react';
import { Product, Supplier } from '../../types';
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  Tag,
  Percent,
  CheckCircle2,
  Building2,
  MapPin,
  AlertTriangle,
  ShoppingCart,
  Plus,
  Minus,
  Sparkles,
  Info,
  Clock,
  CreditCard,
  FileText,
  Boxes,
} from 'lucide-react';

interface FlipkartProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onDirectRequest?: (product: Product, quantity: number) => void;
  onAdjustStock?: (product: Product) => void;
  supplier?: Supplier;
}

export const FlipkartProductModal: React.FC<FlipkartProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onDirectRequest,
  onAdjustStock,
  supplier,
}) => {
  if (!isOpen || !product) return null;

  const [selectedImage, setSelectedImage] = useState<string>(product.imageUrl);
  const [quantity, setQuantity] = useState<number>(1);
  const [pincode, setPincode] = useState('560103');
  const [pincodeChecked, setPincodeChecked] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'offers'>('details');

  const gallery = product.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : [product.imageUrl];

  const mrp = product.mrpPrice || Math.round(product.unitPrice * 1.25);
  const discount = product.discountPercentage || Math.round(((mrp - product.unitPrice) / mrp) * 100);
  const rating = product.rating || 4.5;
  const reviews = product.reviewCount || 128;
  const isLowStock = product.quantity <= product.minimumStock;

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length >= 6) {
      setPincodeChecked(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        id="flipkart-product-modal"
        className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="bg-amber-400 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded italic tracking-tighter">
              Flipkart
            </span>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              Enterprise Catalog Item
            </span>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              SKU: {product.productCode}
            </span>
          </div>

          <button
            id="close-flipkart-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column: Gallery & Badges (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 relative group flex items-center justify-center p-4 min-h-[300px]">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="max-h-72 w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                />

                {/* Discount Tag */}
                {discount > 0 && (
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
                    {discount}% OFF
                  </div>
                )}

                {/* Flipkart Assured Badge */}
                {product.isFlipkartAssured && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="italic text-amber-300 font-serif">f</span>
                    <span>Assured</span>
                  </div>
                )}
              </div>

              {/* Gallery Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {gallery.map((imgUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`w-16 h-16 rounded-xl border-2 p-1 bg-white overflow-hidden shrink-0 transition ${
                        selectedImage === imgUrl ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              )}

              {/* Stock and Warehouse Status Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Inventory Stock:</span>
                  <span className={`font-bold flex items-center gap-1 ${isLowStock ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {isLowStock ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{product.quantity} {product.unit} Available</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Safety Buffer Min:</span>
                  <span className="text-slate-600 font-semibold">{product.minimumStock} {product.unit}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/80">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>Location:</span>
                  </span>
                  <span className="font-mono text-slate-700 font-medium truncate max-w-[200px]">
                    {product.warehouseLocation || 'Central Warehouse Bay 01'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Details, Pricing, Specifications, Offers (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Category & Brand Header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                    {product.categoryName}
                  </span>
                  {product.brand && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Brand: <strong className="text-slate-800">{product.brand}</strong>
                    </span>
                  )}
                </div>

                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {product.name}
                </h1>
                <p className="text-xs text-slate-500 mt-1">{product.description}</p>
              </div>

              {/* Rating & Assured Banner */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-bold shadow-xs">
                  <span>{rating}</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {reviews.toLocaleString()} Ratings &amp; Enterprise Reviews
                </span>

                {product.isFlipkartAssured && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold rounded">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>100% Genuine Corporate Asset</span>
                  </div>
                )}
              </div>

              {/* Pricing Block */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    ₹{product.unitPrice.toLocaleString('en-IN')}
                  </span>
                  {mrp > product.unitPrice && (
                    <>
                      <span className="text-sm font-medium text-slate-400 line-through">
                        ₹{mrp.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {discount}% off
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                    <Tag className="w-3 h-3 text-amber-700" />
                    <span>GST Input Credit: Save up to 18% with GST invoice</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
                    <Truck className="w-3 h-3 text-blue-700" />
                    <span>{product.deliveryTag || 'Free Express Delivery in 24-48 Hours'}</span>
                  </span>
                </div>
              </div>

              {/* Navigation Tabs (Details / Specs / Offers) */}
              <div className="border-b border-slate-200 flex gap-4 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'details'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Key Highlights
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'specs'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Specifications ({product.specifications?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('offers')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'offers'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Corporate Offers
                </button>
              </div>

              {/* Tab Content 1: Key Highlights */}
              {activeTab === 'details' && (
                <div className="space-y-2.5 text-xs text-slate-700">
                  {product.highlights && product.highlights.length > 0 ? (
                    <ul className="space-y-1.5 list-disc list-inside">
                      {product.highlights.map((h, i) => (
                        <li key={i} className="leading-relaxed">
                          <span className="text-slate-800 font-medium">{h}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 italic">No specific highlights recorded for this SKU.</p>
                  )}

                  {/* Delivery Pincode Checker */}
                  <div className="pt-3 border-t border-slate-100">
                    <form onSubmit={handleCheckPincode} className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium shrink-0">Deliver to:</span>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Enter 6-digit Pincode"
                        maxLength={6}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-28 font-mono"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition"
                      >
                        Check
                      </button>
                    </form>

                    {pincodeChecked && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Delivery by Tomorrow, 11:00 AM | Free Corporate Shipping</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content 2: Specifications Table */}
              {activeTab === 'specs' && (
                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                  {product.specifications && product.specifications.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {product.specifications.map((spec, i) => (
                        <div key={i} className="grid grid-cols-3 p-2.5 bg-white hover:bg-slate-50">
                          <div className="text-slate-500 font-medium col-span-1">{spec.key}</div>
                          <div className="text-slate-900 font-semibold col-span-2">{spec.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-400">Standard enterprise OEM specifications apply.</div>
                  )}
                </div>
              )}

              {/* Tab Content 3: Corporate Offers */}
              {activeTab === 'offers' && (
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Volume Procurement Discount</span>
                    </div>
                    <p className="text-emerald-800 text-[11px]">
                      Special 5% rebate applied automatically for orders of 10+ units through ProcureFlow PO system.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                      <span>30-Day Net Credit Terms</span>
                    </div>
                    <p className="text-blue-800 text-[11px]">
                      Verified partner vendor: {product.supplierName} supports 30-day payment term with PO.
                    </p>
                  </div>

                  {product.offers && product.offers.map((off, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{off}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Supplier Info Snippet */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <div>
                    <div className="font-bold text-slate-900">{product.supplierName}</div>
                    <div className="text-[10px] text-slate-500">Verified OEM/Distributor Partner</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    4.8 ★ Vendor
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Bottom Action Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quantity Selector & Total */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-bold text-xs text-slate-900 font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs">
              <div className="text-slate-400 text-[10px]">Total Value:</div>
              <div className="font-black text-slate-900">
                ₹{(product.unitPrice * quantity).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onAdjustStock && (
              <button
                type="button"
                onClick={() => {
                  onAdjustStock(product);
                  onClose();
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
              >
                Adjust Stock
              </button>
            )}

            {onAddToCart && (
              <button
                id="add-to-pr-cart-modal-btn"
                type="button"
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to PR Basket</span>
              </button>
            )}

            {onDirectRequest && (
              <button
                id="direct-pr-request-modal-btn"
                type="button"
                onClick={() => {
                  onDirectRequest(product, quantity);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Instant Requisition</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
