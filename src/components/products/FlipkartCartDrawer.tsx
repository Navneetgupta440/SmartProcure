import React, { useState } from 'react';
import { Product } from '../../types';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Sparkles,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface FlipkartCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSubmitPurchaseRequest: (
    department: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    reason: string
  ) => Promise<void>;
  userDepartment?: string;
}

export const FlipkartCartDrawer: React.FC<FlipkartCartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitPurchaseRequest,
  userDepartment = 'Cloud Infrastructure & Engineering',
}) => {
  if (!isOpen) return null;

  const [department, setDepartment] = useState(userDepartment);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.unitPrice * item.quantity,
    0
  );

  const mrpTotal = items.reduce((acc, item) => {
    const mrp = item.product.mrpPrice || Math.round(item.product.unitPrice * 1.25);
    return acc + mrp * item.quantity;
  }, 0);

  const totalSavings = Math.max(0, mrpTotal - subtotal);
  const estimatedTax = Math.round(subtotal * 0.18); // 18% GST estimate
  const totalWithTax = subtotal + estimatedTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    try {
      setIsSubmitting(true);
      await onSubmitPurchaseRequest(department, priority, reason || 'Bulk requisition via Flipkart Enterprise Catalog');
      onClearCart();
      setShowCheckoutForm(false);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div
        id="flipkart-cart-drawer"
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Purchase Request Basket</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Flipkart-style Multi-Product Requisition</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[11px] text-rose-300 hover:text-rose-100 hover:underline px-2 py-1"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Your Basket is Empty</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Explore the Flipkart Enterprise Catalog and click &ldquo;Add to PR Basket&rdquo; to build your purchase order request.
              </p>
            </div>
          ) : !showCheckoutForm ? (
            <div className="space-y-3">
              {/* Savings Announcement */}
              {totalSavings > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
                  <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Corporate Catalog Savings: ₹{totalSavings.toLocaleString('en-IN')} on this requisition!
                  </span>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2.5">
                {items.map(({ product, quantity }) => {
                  const itemTotal = product.unitPrice * quantity;
                  return (
                    <div
                      key={product.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3 relative group"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                      />

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="text-[10px] font-mono text-blue-600 font-bold uppercase">
                          {product.productCode}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                        <div className="text-xs font-black text-slate-800 mt-0.5">
                          ₹{product.unitPrice.toLocaleString('en-IN')}
                          <span className="text-[10px] text-slate-400 font-normal"> / {product.unit}</span>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white p-0.5">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))}
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-bold text-xs text-slate-900 font-mono">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-bold text-slate-900">
                            Total: ₹{itemTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveItem(product.id)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 transition p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                <div className="font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
                  <span>Price Details ({items.length} items)</span>
                  <span className="text-[10px] font-mono text-emerald-400">Flipkart Verified</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Catalog MRP:</span>
                  <span className="line-through">₹{mrpTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Special Discount:</span>
                  <span>-₹{totalSavings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Requisition Subtotal:</span>
                  <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Estimated GST (18% Input Credit):</span>
                  <span>₹{estimatedTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-800">
                  <span>Total Estimated Amount:</span>
                  <span className="text-amber-400">₹{totalWithTax.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Purchase Request Details Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Requisition Approval Details</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Fill in the procurement purpose to route this request through the automated multi-level approval pipeline.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Department *</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Procurement Urgency / Priority *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="LOW">LOW - Standard Restock (7-10 Days)</option>
                  <option value="MEDIUM">MEDIUM - Planned Project Need (3-5 Days)</option>
                  <option value="HIGH">HIGH - Critical Operations (1-2 Days)</option>
                  <option value="URGENT">URGENT - Emergency Deployment (Same Day)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Justification / Reason *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Procurement of hardware and supplies for Q3 Bangalore engineering floor onboarding"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Items in Requisition:</span>
                  <span>{items.length} SKUs</span>
                </div>
                <div className="flex justify-between font-black text-slate-900">
                  <span>Total Estimated Cost:</span>
                  <span className="text-blue-600">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {items.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
            {!showCheckoutForm ? (
              <button
                type="button"
                onClick={() => setShowCheckoutForm(true)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Requisition Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutForm(false)}
                  className="px-4 py-3 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit Purchase Request</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
