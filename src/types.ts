/**
 * ProcureFlow Enterprise - Master Type Definitions
 * Complete domain models, DTOs, Enums, and API Contracts
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  PROCUREMENT_MANAGER = 'PROCUREMENT_MANAGER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  DELIVERY_AGENT = 'DELIVERY_AGENT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  supplierId?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  code: string;
  productCount?: number;
  status: 'ACTIVE' | 'INACTIVE';
  iconName?: string;
  imageUrl?: string;
  featured?: boolean;
  discountHeadline?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  supplierId: string;
  supplierName?: string;
  unitPrice: number;
  mrpPrice?: number;
  discountPercentage?: number;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  isFlipkartAssured?: boolean;
  deliveryDays?: number;
  deliveryTag?: string;
  highlights?: string[];
  specifications?: { key: string; value: string }[];
  offers?: string[];
  galleryImages?: string[];
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  reservedQuantity: number;
  availableQuantity: number;
  unit: string;
  imageUrl: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  warehouseLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  gstNumber: string;
  taxId: string;
  rating: number; // 1.0 to 5.0
  qualityScore: number; // 0 to 100
  deliveryScore: number; // 0 to 100
  reliabilityScore: number; // 0 to 100
  averageLeadDays: number;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW';
  catalogProducts?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BulkImportRow {
  productCode?: string;
  name: string;
  brand?: string;
  categoryName?: string;
  categoryId?: string;
  supplierName?: string;
  supplierId?: string;
  unitPrice: number;
  mrpPrice?: number;
  discountPercentage?: number;
  quantity?: number;
  minimumStock?: number;
  maximumStock?: number;
  unit?: string;
  description?: string;
  imageUrl?: string;
  warehouseLocation?: string;
  deliveryTag?: string;
  deliveryDays?: number;
  isFlipkartAssured?: boolean;
  rating?: number;
  reviewCount?: number;
  highlights?: string[];
  specifications?: { key: string; value: string }[];
  [key: string]: any;
}

export interface BulkImportPayload {
  products: BulkImportRow[];
  options?: {
    batchNumber?: string;
    fileName?: string;
    sourceType?: 'CSV_UPLOAD' | 'PASTE_DATA' | 'SAMPLE_DATA' | 'API_SYNC';
    overwriteExisting?: boolean;
    defaultCategoryId?: string;
    defaultSupplierId?: string;
    dryRun?: boolean;
  };
}

export interface BulkImportResult {
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  successRate: number;
  batchId?: string;
  batchNumber?: string;
  errors: { row: number; productCode?: string; name?: string; message: string }[];
  createdProducts: Product[];
  updatedProducts: Product[];
}

export type BulkImportStatus = 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED' | 'REVERTED';

export interface BulkImportHistoryRecord {
  id: string;
  batchNumber: string;
  fileName: string;
  sourceType: 'CSV_UPLOAD' | 'PASTE_DATA' | 'SAMPLE_DATA' | 'API_SYNC';
  status: BulkImportStatus;
  totalRecords: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  successRate: number; // percentage (e.g. 96.5)
  createdProductIds: string[];
  createdProductsSummary?: { id: string; productCode: string; name: string; unitPrice: number; categoryName: string }[];
  updatedProductSnapshots: {
    productId: string;
    productCode: string;
    name: string;
    previousState: Partial<Product>;
  }[];
  errors: { row: number; productCode?: string; name?: string; message: string }[];
  isRevertible: boolean;
  revertedAt?: string | null;
  revertedBy?: string | null;
  revertSummary?: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export enum PurchaseRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  CONVERTED_TO_PO = 'CONVERTED_TO_PO',
}

export interface PurchaseRequestItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  estimatedTotal: number;
  unit: string;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string; // e.g. PR-2026-000001
  requestedBy: string;
  requesterName: string;
  requesterRole: UserRole;
  department: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  reason: string;
  status: PurchaseRequestStatus;
  items: PurchaseRequestItem[];
  estimatedAmount: number;
  approvalLevelRequired: number; // 1: Manager, 2: Manager + PM, 3: Manager + PM + Admin
  currentApprovalLevel: number;
  purchaseOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Approval {
  id: string;
  purchaseRequestId: string;
  requestNumber: string;
  requiredRole: UserRole;
  level: number;
  approverId?: string;
  approverName?: string;
  status: ApprovalStatus;
  remarks?: string;
  actionDate?: string;
  createdAt: string;
}

export interface ApprovalHistory {
  id: string;
  purchaseRequestId: string;
  level: number;
  action: 'APPROVED' | 'REJECTED' | 'ESCALATED';
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  remarks: string;
  timestamp: string;
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT_TO_SUPPLIER = 'SENT_TO_SUPPLIER',
  SUPPLIER_ACCEPTED = 'SUPPLIER_ACCEPTED',
  SUPPLIER_REJECTED = 'SUPPLIER_REJECTED',
  PROCESSING = 'PROCESSING',
  DISPATCHED = 'DISPATCHED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-000001
  purchaseRequestId: string;
  requestNumber: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  createdBy: string;
  creatorName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  subtotal: number;
  tax: number;
  discount: number;
  shippingCost: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  remarks?: string;
  items: PurchaseOrderItem[];
  trackingNumber?: string;
  deliveryId?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export enum DeliveryStatus {
  CREATED = 'CREATED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
}

export interface DeliveryTrackingPoint {
  id: string;
  status: DeliveryStatus;
  location: string;
  description: string;
  timestamp: string;
  updatedBy: string;
}

export interface Delivery {
  id: string;
  purchaseOrderId: string;
  poNumber: string;
  deliveryAgentId?: string;
  deliveryAgentName?: string;
  deliveryAgentPhone?: string;
  trackingNumber: string;
  carrier: string;
  shippingAddress: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  status: DeliveryStatus;
  notes?: string;
  trackingHistory: DeliveryTrackingPoint[];
  inventoryUpdated: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum InventoryTransactionType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  RESERVATION = 'RESERVATION',
  RELEASE = 'RELEASE',
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  type: InventoryTransactionType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  referenceId?: string; // PO ID or Delivery ID
  referenceType?: string;
  reason: string;
  performedBy: string;
  timestamp: string;
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export interface Notification {
  id: string;
  userId?: string;
  recipientEmail?: string;
  title: string;
  message: string;
  type: string;
  channel: NotificationChannel;
  read: boolean;
  referenceId?: string;
  referenceType?: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  retryCount?: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface SmartRecommendation {
  productId: string;
  productCode: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  recommendedQuantity: number;
  preferredSupplierId: string;
  preferredSupplierName: string;
  estimatedCost: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  reason: string;
  historicalDemandMonthly: number;
}

export interface SupplierRanking {
  supplierId: string;
  companyName: string;
  productPrice: number;
  rating: number;
  qualityScore: number;
  deliveryScore: number;
  reliabilityScore: number;
  leadDays: number;
  compositeScore: number; // 0 to 100 calculated
  scoreBreakdown: {
    priceScore: number;
    qualityScore: number;
    deliveryScore: number;
    ratingScore: number;
    reliabilityScore: number;
  };
  recommendationRank: number;
  recommended: boolean;
  reason: string;
}

export interface WorkflowCommand {
  action:
    | 'APPROVE_REQUEST'
    | 'REJECT_REQUEST'
    | 'CREATE_PURCHASE_ORDER'
    | 'SEND_PURCHASE_ORDER'
    | 'ACCEPT_ORDER'
    | 'REJECT_ORDER'
    | 'START_PROCESSING'
    | 'READY_FOR_DISPATCH'
    | 'DISPATCH_ORDER'
    | 'UPDATE_DELIVERY'
    | 'MARK_DELIVERED'
    | 'CANCEL_ORDER';
  entityType: 'PURCHASE_REQUEST' | 'PURCHASE_ORDER' | 'DELIVERY';
  entityId: string;
  remarks?: string;
  actorId?: string;
  payload?: Record<string, any>;
}

export interface StandardApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path?: string;
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  metadata?: any;
}

export interface DashboardKPIs {
  totalUsers: number;
  totalProducts: number;
  totalSuppliers: number;
  totalPurchaseRequests: number;
  pendingApprovals: number;
  approvedRequests: number;
  rejectedRequests: number;
  activePurchaseOrders: number;
  ordersInTransit: number;
  deliveredOrders: number;
  lowStockProducts: number;
  totalProcurementSpend: number;
  onTimeDeliveryRate: number;
  averageApprovalHours: number;
  monthlySpendTrend: { month: string; spend: number; ordersCount: number }[];
  statusDistribution: { status: string; count: number }[];
  recentActivities: AuditLog[];
}
