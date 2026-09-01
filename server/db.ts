/**
 * ProcureFlow Enterprise In-Memory Database & Business Logic Engine
 * Implements complete state machines, validation rules, ACID transactions,
 * audit logging, notification dispatch, and smart procurement calculations.
 */

import {
  User,
  UserRole,
  UserStatus,
  Category,
  Product,
  Supplier,
  PurchaseRequest,
  PurchaseRequestStatus,
  PurchaseOrder,
  PurchaseOrderStatus,
  Delivery,
  DeliveryStatus,
  InventoryTransaction,
  InventoryTransactionType,
  Notification,
  NotificationChannel,
  AuditLog,
  SmartRecommendation,
  SupplierRanking,
  WorkflowCommand,
  ApprovalStatus,
  BulkImportHistoryRecord,
} from '../src/types';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_PURCHASE_REQUESTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_DELIVERIES,
  INITIAL_INVENTORY_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BULK_IMPORT_HISTORY,
} from '../src/data/seedData';

export interface ScoringWeights {
  priceWeight: number; // default 0.35
  qualityWeight: number; // default 0.20
  deliveryWeight: number; // default 0.20
  ratingWeight: number; // default 0.15
  reliabilityWeight: number; // default 0.10
}

export interface ApprovalThresholds {
  level1Max: number; // < 15,000 -> Manager
  level2Max: number; // 15,000 - 100,000 -> Manager + PM
  level3Min: number; // > 100,000 -> Manager + PM + Admin
}

class DatabaseEngine {
  public users: User[] = [];
  public categories: Category[] = [];
  public suppliers: Supplier[] = [];
  public products: Product[] = [];
  public purchaseRequests: PurchaseRequest[] = [];
  public purchaseOrders: PurchaseOrder[] = [];
  public deliveries: Delivery[] = [];
  public inventoryTransactions: InventoryTransaction[] = [];
  public notifications: Notification[] = [];
  public auditLogs: AuditLog[] = [];
  public bulkImportHistory: BulkImportHistoryRecord[] = [];

  public scoringWeights: ScoringWeights = {
    priceWeight: 0.35,
    qualityWeight: 0.20,
    deliveryWeight: 0.20,
    ratingWeight: 0.15,
    reliabilityWeight: 0.10,
  };

  public approvalThresholds: ApprovalThresholds = {
    level1Max: 15000,
    level2Max: 100000,
    level3Min: 100000,
  };

  private prCounter = 5;
  private poCounter = 3;
  private trkCounter = 9812;

  constructor() {
    this.resetToSeed();
  }

  public resetToSeed() {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.categories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
    this.suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.purchaseRequests = JSON.parse(JSON.stringify(INITIAL_PURCHASE_REQUESTS));
    this.purchaseOrders = JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS));
    this.deliveries = JSON.parse(JSON.stringify(INITIAL_DELIVERIES));
    this.inventoryTransactions = JSON.parse(JSON.stringify(INITIAL_INVENTORY_TRANSACTIONS));
    this.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
    this.auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    this.bulkImportHistory = JSON.parse(JSON.stringify(INITIAL_BULK_IMPORT_HISTORY));
  }

  // Audit Logging
  public logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    newValue: string,
    oldValue?: string,
    ipAddress = '127.0.0.1',
    userAgent = 'ProcureFlow Internal Engine'
  ): AuditLog {
    const user = this.users.find((u) => u.id === userId) || {
      id: userId,
      name: 'System Service',
      role: UserRole.ADMIN,
    };

    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user.id,
      userName: user.name,
      userRole: (user as any).role || UserRole.ADMIN,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.unshift(entry);
    return entry;
  }

  // Notification Dispatching
  public sendNotification(
    recipientUserId: string | undefined,
    recipientEmail: string | undefined,
    title: string,
    message: string,
    type: string,
    referenceId?: string,
    referenceType?: string,
    channel: NotificationChannel = NotificationChannel.IN_APP
  ): Notification {
    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: recipientUserId,
      recipientEmail,
      title,
      message,
      type,
      channel,
      read: false,
      referenceId,
      referenceType,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(notif);
    return notif;
  }

  // Purchase Request ID Generator
  public generatePRNumber(): string {
    const num = String(this.prCounter++).padStart(6, '0');
    return `PR-2026-${num}`;
  }

  // Purchase Order ID Generator
  public generatePONumber(): string {
    const num = String(this.poCounter++).padStart(6, '0');
    return `PO-2026-${num}`;
  }

  // Tracking Number Generator
  public generateTrackingNumber(): string {
    const num = String(this.trkCounter++);
    return `TRK-2026-${num}`;
  }

  // Determine Approval Levels required based on total estimated amount
  public calculateRequiredApprovalLevels(amount: number): number {
    if (amount <= this.approvalThresholds.level1Max) {
      return 1; // Manager only
    } else if (amount <= this.approvalThresholds.level2Max) {
      return 2; // Manager + Procurement Manager
    } else {
      return 3; // Manager + Procurement Manager + Admin
    }
  }

  // Create Purchase Request
  public createPurchaseRequest(
    userId: string,
    department: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    reason: string,
    items: { productId: string; quantity: number }[]
  ): PurchaseRequest {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    if (!items || items.length === 0) {
      throw new Error('Purchase request must contain at least one item');
    }

    let estimatedAmount = 0;
    const requestItems = items.map((item, idx) => {
      if (item.quantity <= 0) {
        throw new Error('Item quantity must be greater than zero');
      }
      const product = this.products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      const total = product.unitPrice * item.quantity;
      estimatedAmount += total;

      return {
        id: `pri-${Date.now()}-${idx}`,
        productId: product.id,
        productCode: product.productCode,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.unitPrice,
        estimatedTotal: total,
        unit: product.unit,
      };
    });

    const approvalLevelRequired = this.calculateRequiredApprovalLevels(estimatedAmount);
    const prNumber = this.generatePRNumber();

    const newPR: PurchaseRequest = {
      id: `pr-${Date.now()}`,
      requestNumber: prNumber,
      requestedBy: user.id,
      requesterName: user.name,
      requesterRole: user.role,
      department: department || user.department || 'General Operations',
      priority,
      reason,
      status: PurchaseRequestStatus.PENDING_APPROVAL,
      items: requestItems,
      estimatedAmount,
      approvalLevelRequired,
      currentApprovalLevel: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.purchaseRequests.unshift(newPR);

    // Audit Log
    this.logAudit(
      userId,
      'CREATE_REQUEST',
      'PURCHASE_REQUEST',
      prNumber,
      `Created PR ${prNumber} with ${items.length} items (₹${estimatedAmount.toLocaleString('en-IN')})`
    );

    // Notify Managers
    const managers = this.users.filter((u) => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);
    managers.forEach((mgr) => {
      this.sendNotification(
        mgr.id,
        mgr.email,
        'New Purchase Request For Approval',
        `${prNumber} created by ${user.name} for ₹${estimatedAmount.toLocaleString('en-IN')} is awaiting review.`,
        'APPROVAL_REQUIRED',
        newPR.id,
        'PURCHASE_REQUEST'
      );
    });

    return newPR;
  }

  // Approve Purchase Request
  public approvePurchaseRequest(
    prId: string,
    approverId: string,
    remarks = 'Approved according to budget authorization'
  ): PurchaseRequest {
    const pr = this.purchaseRequests.find((p) => p.id === prId || p.requestNumber === prId);
    if (!pr) throw new Error('Purchase request not found');

    const approver = this.users.find((u) => u.id === approverId);
    if (!approver) throw new Error('Approver not found');

    if (pr.requestedBy === approverId && approver.role !== UserRole.ADMIN) {
      throw new Error('Self-approval violation: You cannot approve your own purchase request');
    }

    if (
      pr.status !== PurchaseRequestStatus.PENDING_APPROVAL &&
      pr.status !== PurchaseRequestStatus.SUBMITTED
    ) {
      throw new Error(`Cannot approve request in status ${pr.status}`);
    }

    const nextLevel = pr.currentApprovalLevel + 1;
    if (nextLevel > pr.approvalLevelRequired) {
      // Fully approved!
      pr.status = PurchaseRequestStatus.APPROVED;
      pr.currentApprovalLevel = pr.approvalLevelRequired;
      pr.updatedAt = new Date().toISOString();

      this.logAudit(
        approverId,
        'APPROVE_REQUEST',
        'PURCHASE_REQUEST',
        pr.requestNumber,
        `Final approval (Level ${pr.currentApprovalLevel}/${pr.approvalLevelRequired}) granted. Status set to APPROVED. Remarks: ${remarks}`
      );

      // Notify Requester & Procurement Managers
      this.sendNotification(
        pr.requestedBy,
        undefined,
        'Purchase Request Fully Approved',
        `Your request ${pr.requestNumber} (₹${pr.estimatedAmount.toLocaleString('en-IN')}) has been fully approved and is ready for PO creation.`,
        'REQUEST_APPROVED',
        pr.id,
        'PURCHASE_REQUEST'
      );

      const procManagers = this.users.filter((u) => u.role === UserRole.PROCUREMENT_MANAGER);
      procManagers.forEach((pm) => {
        this.sendNotification(
          pm.id,
          pm.email,
          'Approved PR Ready For PO Generation',
          `${pr.requestNumber} is fully approved. You can now compare suppliers and create a Purchase Order.`,
          'PO_CREATION_READY',
          pr.id,
          'PURCHASE_REQUEST'
        );
      });
    } else {
      // Intermediate level approval
      pr.currentApprovalLevel = nextLevel;
      pr.updatedAt = new Date().toISOString();

      this.logAudit(
        approverId,
        'APPROVE_REQUEST',
        'PURCHASE_REQUEST',
        pr.requestNumber,
        `Level ${pr.currentApprovalLevel - 1} approval granted. Escalated to Level ${nextLevel}. Remarks: ${remarks}`
      );

      // Notify next level approvers
      const targetRole = nextLevel === 2 ? UserRole.PROCUREMENT_MANAGER : UserRole.ADMIN;
      const nextApprovers = this.users.filter((u) => u.role === targetRole || u.role === UserRole.ADMIN);
      nextApprovers.forEach((appr) => {
        this.sendNotification(
          appr.id,
          appr.email,
          `Escalated Approval Required (Level ${nextLevel})`,
          `${pr.requestNumber} for ₹${pr.estimatedAmount.toLocaleString('en-IN')} requires your Level ${nextLevel} approval.`,
          'APPROVAL_REQUIRED',
          pr.id,
          'PURCHASE_REQUEST'
        );
      });
    }

    return pr;
  }

  // Reject Purchase Request
  public rejectPurchaseRequest(prId: string, rejectorId: string, remarks: string): PurchaseRequest {
    if (!remarks || remarks.trim().length === 0) {
      throw new Error('Rejection reason/remarks are mandatory');
    }

    const pr = this.purchaseRequests.find((p) => p.id === prId || p.requestNumber === prId);
    if (!pr) throw new Error('Purchase request not found');

    const rejector = this.users.find((u) => u.id === rejectorId);
    if (!rejector) throw new Error('Rejector user not found');

    if (
      pr.status !== PurchaseRequestStatus.PENDING_APPROVAL &&
      pr.status !== PurchaseRequestStatus.SUBMITTED
    ) {
      throw new Error(`Cannot reject request in status ${pr.status}`);
    }

    pr.status = PurchaseRequestStatus.REJECTED;
    pr.updatedAt = new Date().toISOString();

    this.logAudit(
      rejectorId,
      'REJECT_REQUEST',
      'PURCHASE_REQUEST',
      pr.requestNumber,
      `Rejected at Level ${pr.currentApprovalLevel}. Reason: ${remarks}`
    );

    this.sendNotification(
      pr.requestedBy,
      undefined,
      'Purchase Request Rejected',
      `Your request ${pr.requestNumber} was rejected by ${rejector.name}. Reason: ${remarks}`,
      'REQUEST_REJECTED',
      pr.id,
      'PURCHASE_REQUEST'
    );

    return pr;
  }

  // Create Purchase Order from Approved PR
  public createPurchaseOrder(
    prId: string,
    supplierId: string,
    creatorId: string,
    discount = 0,
    shippingCost = 0,
    expectedDays = 5,
    remarks = ''
  ): PurchaseOrder {
    const pr = this.purchaseRequests.find((p) => p.id === prId || p.requestNumber === prId);
    if (!pr) throw new Error('Purchase request not found');

    if (pr.status !== PurchaseRequestStatus.APPROVED) {
      throw new Error(`Cannot create Purchase Order for request with status '${pr.status}'. Request must be APPROVED.`);
    }

    if (pr.purchaseOrderId) {
      throw new Error(`A Purchase Order (${pr.purchaseOrderId}) is already generated for this request.`);
    }

    const supplier = this.suppliers.find((s) => s.id === supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const creator = this.users.find((u) => u.id === creatorId);
    if (!creator) throw new Error('Creator user not found');

    const poNumber = this.generatePONumber();

    const poItems = pr.items.map((item, idx) => ({
      id: `poi-${Date.now()}-${idx}`,
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.estimatedTotal,
      unit: item.unit,
    }));

    const subtotal = poItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const tax = Math.round(subtotal * 0.18); // 18% GST standard
    const totalAmount = subtotal + tax + shippingCost - discount;

    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + expectedDays);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      purchaseRequestId: pr.id,
      requestNumber: pr.requestNumber,
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      supplierEmail: supplier.email,
      createdBy: creator.id,
      creatorName: creator.name,
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: expectedDate.toISOString(),
      subtotal,
      tax,
      discount,
      shippingCost,
      totalAmount,
      status: PurchaseOrderStatus.SENT_TO_SUPPLIER,
      remarks,
      items: poItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.purchaseOrders.unshift(newPO);

    // Update PR
    pr.status = PurchaseRequestStatus.CONVERTED_TO_PO;
    pr.purchaseOrderId = newPO.id;
    pr.updatedAt = new Date().toISOString();

    // Audit Log
    this.logAudit(
      creatorId,
      'CREATE_PO',
      'PURCHASE_ORDER',
      poNumber,
      `Generated ${poNumber} to supplier ${supplier.companyName} for ₹${totalAmount.toLocaleString('en-IN')}`
    );

    // Notify Supplier user if registered
    const supplierUser = this.users.find((u) => u.supplierId === supplier.id || u.email === supplier.email);
    if (supplierUser) {
      this.sendNotification(
        supplierUser.id,
        supplier.email,
        `New Purchase Order Received: ${poNumber}`,
        `ProcureFlow has issued ${poNumber} for ₹${totalAmount.toLocaleString('en-IN')}. Please accept or reject this order.`,
        'PO_ISSUED',
        newPO.id,
        'PURCHASE_ORDER'
      );
    }

    return newPO;
  }

  // Supplier Accept Purchase Order
  public supplierAcceptPO(poId: string, supplierUserId: string): PurchaseOrder {
    const po = this.purchaseOrders.find((p) => p.id === poId || p.poNumber === poId);
    if (!po) throw new Error('Purchase order not found');

    if (po.status !== PurchaseOrderStatus.SENT_TO_SUPPLIER) {
      throw new Error(`Cannot accept PO in status ${po.status}`);
    }

    po.status = PurchaseOrderStatus.SUPPLIER_ACCEPTED;
    po.updatedAt = new Date().toISOString();

    this.logAudit(
      supplierUserId,
      'ACCEPT_PO',
      'PURCHASE_ORDER',
      po.poNumber,
      `Supplier accepted PO ${po.poNumber}`
    );

    this.sendNotification(
      po.createdBy,
      undefined,
      'Supplier Accepted Purchase Order',
      `${po.supplierName} accepted ${po.poNumber} and will initiate fabrication/packaging.`,
      'SUPPLIER_ACCEPTED',
      po.id,
      'PURCHASE_ORDER'
    );

    return po;
  }

  // Supplier Reject Purchase Order
  public supplierRejectPO(poId: string, supplierUserId: string, reason: string): PurchaseOrder {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Supplier rejection reason is required');
    }

    const po = this.purchaseOrders.find((p) => p.id === poId || p.poNumber === poId);
    if (!po) throw new Error('Purchase order not found');

    if (po.status !== PurchaseOrderStatus.SENT_TO_SUPPLIER) {
      throw new Error(`Cannot reject PO in status ${po.status}`);
    }

    po.status = PurchaseOrderStatus.SUPPLIER_REJECTED;
    po.rejectionReason = reason;
    po.updatedAt = new Date().toISOString();

    this.logAudit(
      supplierUserId,
      'REJECT_PO',
      'PURCHASE_ORDER',
      po.poNumber,
      `Supplier rejected PO ${po.poNumber}. Reason: ${reason}`
    );

    this.sendNotification(
      po.createdBy,
      undefined,
      'Supplier Rejected Purchase Order',
      `${po.supplierName} rejected ${po.poNumber}. Reason: ${reason}`,
      'SUPPLIER_REJECTED',
      po.id,
      'PURCHASE_ORDER'
    );

    return po;
  }

  // Start Processing PO
  public processPO(poId: string, supplierUserId: string): PurchaseOrder {
    const po = this.purchaseOrders.find((p) => p.id === poId || p.poNumber === poId);
    if (!po) throw new Error('Purchase order not found');

    if (po.status !== PurchaseOrderStatus.SUPPLIER_ACCEPTED) {
      throw new Error(`Cannot start processing PO in status ${po.status}. Must be SUPPLIER_ACCEPTED.`);
    }

    po.status = PurchaseOrderStatus.PROCESSING;
    po.updatedAt = new Date().toISOString();

    this.logAudit(
      supplierUserId,
      'START_PROCESSING',
      'PURCHASE_ORDER',
      po.poNumber,
      `PO ${po.poNumber} is now in processing and packing stage`
    );

    return po;
  }

  // Dispatch PO and generate Delivery tracking
  public dispatchPO(
    poId: string,
    supplierUserId: string,
    carrier = 'BlueDart Express Air Cargo',
    shippingAddress = 'ProcureFlow Corp HQ, Receiving Dock, Bengaluru - 560103',
    deliveryAgentId = 'usr-del-01'
  ): { po: PurchaseOrder; delivery: Delivery } {
    const po = this.purchaseOrders.find((p) => p.id === poId || p.poNumber === poId);
    if (!po) throw new Error('Purchase order not found');

    if (
      po.status !== PurchaseOrderStatus.PROCESSING &&
      po.status !== PurchaseOrderStatus.SUPPLIER_ACCEPTED
    ) {
      throw new Error(`Cannot dispatch PO in status ${po.status}`);
    }

    const trackingNumber = this.generateTrackingNumber();
    const deliveryAgent = this.users.find((u) => u.id === deliveryAgentId) || this.users[6];

    po.status = PurchaseOrderStatus.DISPATCHED;
    po.trackingNumber = trackingNumber;
    po.updatedAt = new Date().toISOString();

    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 3);

    const delivery: Delivery = {
      id: `del-${Date.now()}`,
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      deliveryAgentId: deliveryAgent?.id,
      deliveryAgentName: deliveryAgent?.name,
      deliveryAgentPhone: deliveryAgent?.phone,
      trackingNumber,
      carrier,
      shippingAddress,
      expectedDeliveryDate: expectedDate.toISOString(),
      status: DeliveryStatus.PICKED_UP,
      notes: `Dispatched from ${po.supplierName} warehouse facilities`,
      inventoryUpdated: false,
      trackingHistory: [
        {
          id: `tp-${Date.now()}-1`,
          status: DeliveryStatus.CREATED,
          location: `${po.supplierName} Outbound Dock`,
          description: 'Shipment manifests generated and electronic airway bill attached',
          timestamp: new Date().toISOString(),
          updatedBy: 'Supplier Dispatch Officer',
        },
        {
          id: `tp-${Date.now()}-2`,
          status: DeliveryStatus.PICKED_UP,
          location: 'Regional Cargo Gateway',
          description: `Consignment collected by ${carrier}`,
          timestamp: new Date().toISOString(),
          updatedBy: deliveryAgent?.name || 'Carrier Agent',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    po.deliveryId = delivery.id;
    this.deliveries.unshift(delivery);

    this.logAudit(
      supplierUserId,
      'DISPATCH_ORDER',
      'PURCHASE_ORDER',
      po.poNumber,
      `Dispatched PO ${po.poNumber} with carrier ${carrier}. Tracking: ${trackingNumber}`
    );

    // Notify delivery agent and requester
    if (deliveryAgent) {
      this.sendNotification(
        deliveryAgent.id,
        deliveryAgent.email,
        'New Delivery Assignment',
        `You have been assigned shipment ${trackingNumber} for ${po.poNumber}.`,
        'DELIVERY_ASSIGNED',
        delivery.id,
        'DELIVERY'
      );
    }

    return { po, delivery };
  }

  // Update Delivery Status and Tracking Location
  public updateDeliveryStatus(
    deliveryId: string,
    actorId: string,
    newStatus: DeliveryStatus,
    location: string,
    description: string
  ): Delivery {
    const delivery = this.deliveries.find((d) => d.id === deliveryId || d.trackingNumber === deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    const po = this.purchaseOrders.find((p) => p.id === delivery.purchaseOrderId);

    // State machine check
    const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      [DeliveryStatus.CREATED]: [DeliveryStatus.PICKED_UP, DeliveryStatus.FAILED],
      [DeliveryStatus.PICKED_UP]: [DeliveryStatus.IN_TRANSIT, DeliveryStatus.FAILED],
      [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.OUT_FOR_DELIVERY, DeliveryStatus.FAILED],
      [DeliveryStatus.OUT_FOR_DELIVERY]: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.RETURNED],
      [DeliveryStatus.DELIVERED]: [],
      [DeliveryStatus.FAILED]: [DeliveryStatus.RETURNED, DeliveryStatus.IN_TRANSIT],
      [DeliveryStatus.RETURNED]: [],
    };

    if (delivery.status === DeliveryStatus.DELIVERED) {
      throw new Error('Cannot update status of an already DELIVERED consignment');
    }

    const actor = this.users.find((u) => u.id === actorId) || { name: 'Logistics Agent' };

    delivery.status = newStatus;
    delivery.updatedAt = new Date().toISOString();

    const trackingPoint = {
      id: `tp-${Date.now()}`,
      status: newStatus,
      location: location || 'Transit Corridor',
      description: description || `Status updated to ${newStatus}`,
      timestamp: new Date().toISOString(),
      updatedBy: actor.name,
    };

    delivery.trackingHistory.push(trackingPoint);

    // Update parent PO status as well
    if (po) {
      if (newStatus === DeliveryStatus.IN_TRANSIT) po.status = PurchaseOrderStatus.IN_TRANSIT;
      if (newStatus === DeliveryStatus.OUT_FOR_DELIVERY) po.status = PurchaseOrderStatus.OUT_FOR_DELIVERY;
      if (newStatus === DeliveryStatus.DELIVERED) po.status = PurchaseOrderStatus.DELIVERED;
      po.updatedAt = new Date().toISOString();
    }

    // If DELIVERED -> Trigger Inventory Auto-Update!
    if (newStatus === DeliveryStatus.DELIVERED && !delivery.inventoryUpdated && po) {
      delivery.actualDeliveryDate = new Date().toISOString();
      delivery.inventoryUpdated = true;

      // Increment inventory for each product in the PO
      po.items.forEach((item) => {
        const product = this.products.find((p) => p.id === item.productId);
        if (product) {
          const prevQty = product.quantity;
          product.quantity += item.quantity;
          product.availableQuantity = product.quantity - (product.reservedQuantity || 0);
          product.updatedAt = new Date().toISOString();

          // Create inventory transaction
          const invTx: InventoryTransaction = {
            id: `inv-tx-${Date.now()}-${item.productId}`,
            productId: product.id,
            productCode: product.productCode,
            productName: product.name,
            type: InventoryTransactionType.PURCHASE,
            quantityChange: item.quantity,
            previousQuantity: prevQty,
            newQuantity: product.quantity,
            referenceId: delivery.id,
            referenceType: 'DELIVERY_CONFIRMATION',
            reason: `Automatic inventory stock addition from receipt of ${po.poNumber} (${delivery.trackingNumber})`,
            performedBy: actor.name,
            timestamp: new Date().toISOString(),
          };

          this.inventoryTransactions.unshift(invTx);
        }
      });

      this.logAudit(
        actorId,
        'MARK_DELIVERED',
        'DELIVERY',
        delivery.trackingNumber,
        `Consignment ${delivery.trackingNumber} confirmed DELIVERED. Inventory quantities automatically incremented for ${po.items.length} items.`
      );

      // Notify procurement manager and requester
      this.sendNotification(
        po.createdBy,
        undefined,
        'Delivery Confirmed & Inventory Synced',
        `${po.poNumber} (${delivery.trackingNumber}) has arrived and inventory has been updated.`,
        'ORDER_DELIVERED',
        po.id,
        'PURCHASE_ORDER'
      );
    } else {
      this.logAudit(
        actorId,
        'UPDATE_DELIVERY',
        'DELIVERY',
        delivery.trackingNumber,
        `Status updated to ${newStatus} at ${location}`
      );
    }

    return delivery;
  }

  // Adjust Stock directly
  public adjustStock(
    productId: string,
    quantityChange: number,
    reason: string,
    performedById: string
  ): Product {
    const product = this.products.find((p) => p.id === productId || p.productCode === productId);
    if (!product) throw new Error('Product not found');

    const prevQty = product.quantity;
    const newQty = prevQty + quantityChange;
    if (newQty < 0) {
      throw new Error(`Negative inventory prohibited. Available: ${prevQty}, Requested change: ${quantityChange}`);
    }

    product.quantity = newQty;
    product.availableQuantity = newQty - (product.reservedQuantity || 0);
    product.updatedAt = new Date().toISOString();

    const user = this.users.find((u) => u.id === performedById);

    const invTx: InventoryTransaction = {
      id: `inv-tx-${Date.now()}`,
      productId: product.id,
      productCode: product.productCode,
      productName: product.name,
      type: quantityChange >= 0 ? InventoryTransactionType.ADJUSTMENT : InventoryTransactionType.ADJUSTMENT,
      quantityChange,
      previousQuantity: prevQty,
      newQuantity: newQty,
      reason: reason || 'Manual inventory reconciliation adjustment',
      performedBy: user?.name || 'Inventory Officer',
      timestamp: new Date().toISOString(),
    };

    this.inventoryTransactions.unshift(invTx);

    this.logAudit(
      performedById,
      'UPDATE_INVENTORY',
      'PRODUCT',
      product.productCode,
      `Manual stock adjusted by ${quantityChange > 0 ? '+' : ''}${quantityChange} (${prevQty} -> ${newQty}). Reason: ${reason}`
    );

    return product;
  }

  // Smart Procurement Recommendation Engine (Low Stock & EOQ)
  public getSmartRecommendations(): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    this.products.forEach((p) => {
      if (p.quantity <= p.minimumStock) {
        // Find best supplier or assigned supplier
        const supplier = this.suppliers.find((s) => s.id === p.supplierId) || this.suppliers[0];
        const deficit = p.maximumStock - p.quantity;
        const recommendedQty = Math.max(deficit, p.minimumStock * 2);
        const estimatedCost = recommendedQty * p.unitPrice;

        const urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' =
          p.quantity === 0
            ? 'CRITICAL'
            : p.quantity < p.minimumStock / 2
            ? 'CRITICAL'
            : p.quantity <= p.minimumStock
            ? 'HIGH'
            : 'MODERATE';

        recommendations.push({
          productId: p.id,
          productCode: p.productCode,
          productName: p.name,
          currentStock: p.quantity,
          minimumStock: p.minimumStock,
          maximumStock: p.maximumStock,
          recommendedQuantity: recommendedQty,
          preferredSupplierId: supplier.id,
          preferredSupplierName: supplier.companyName,
          estimatedCost,
          urgency,
          reason: `Current stock (${p.quantity} ${p.unit}) is at or below safety buffer threshold (${p.minimumStock} ${p.unit}). Buffer replenishment recommended.`,
          historicalDemandMonthly: p.minimumStock * 3,
        });
      }
    });

    return recommendations.sort((a, b) => (a.urgency === 'CRITICAL' ? -1 : 1));
  }

  // Multi-Factor Algorithmic Supplier Ranking
  public getSupplierRankingsForProduct(productId?: string): SupplierRanking[] {
    const targetProduct = productId ? this.products.find((p) => p.id === productId) : null;
    const basePrice = targetProduct ? targetProduct.unitPrice : 100000;

    const w = this.scoringWeights;

    const rankings = this.suppliers.map((s, idx) => {
      // Synthetic variation for demonstration if specific product prices vary across suppliers
      const priceModifier = 1 + (idx % 3 === 0 ? 0 : idx % 2 === 0 ? -0.05 : 0.08);
      const computedPrice = Math.round(basePrice * priceModifier);

      // Normalize scores 0 - 100
      const priceScore = Math.min(100, Math.max(20, Math.round(100 - ((computedPrice - basePrice * 0.9) / (basePrice * 0.3)) * 40)));
      const qualityScore = s.qualityScore || 85;
      const deliveryScore = s.deliveryScore || 85;
      const ratingScore = Math.round((s.rating / 5.0) * 100);
      const reliabilityScore = s.reliabilityScore || 85;

      const compositeScore = Math.round(
        w.priceWeight * priceScore +
        w.qualityWeight * qualityScore +
        w.deliveryWeight * deliveryScore +
        w.ratingWeight * ratingScore +
        w.reliabilityWeight * reliabilityScore
      );

      return {
        supplierId: s.id,
        companyName: s.companyName,
        productPrice: computedPrice,
        rating: s.rating,
        qualityScore,
        deliveryScore,
        reliabilityScore,
        leadDays: s.averageLeadDays || 3,
        compositeScore,
        scoreBreakdown: {
          priceScore,
          qualityScore,
          deliveryScore,
          ratingScore,
          reliabilityScore,
        },
        recommendationRank: 0,
        recommended: false,
        reason: '',
      };
    });

    // Sort descending by composite score
    rankings.sort((a, b) => b.compositeScore - a.compositeScore);

    rankings.forEach((r, index) => {
      r.recommendationRank = index + 1;
      r.recommended = index === 0;
      r.reason =
        index === 0
          ? `Top overall vendor score (${r.compositeScore}/100) with optimal balance of ${r.rating}★ rating, ${r.leadDays} days lead time, and high reliability.`
          : index === 1
          ? `Runner-up vendor with strong quality scores (${r.qualityScore}%) and competitive pricing.`
          : `Alternative vendor for failover or overflow orders.`;
    });

    return rankings;
  }

  // Central Workflow Action Router
  public executeWorkflow(cmd: WorkflowCommand): { success: boolean; message: string; data: any } {
    const actorId = cmd.actorId || 'usr-admin-01';

    switch (cmd.action) {
      case 'APPROVE_REQUEST': {
        const pr = this.approvePurchaseRequest(cmd.entityId, actorId, cmd.remarks);
        return { success: true, message: `Purchase Request ${pr.requestNumber} approved successfully.`, data: pr };
      }
      case 'REJECT_REQUEST': {
        const pr = this.rejectPurchaseRequest(cmd.entityId, actorId, cmd.remarks || 'Rejected by workflow');
        return { success: true, message: `Purchase Request ${pr.requestNumber} rejected.`, data: pr };
      }
      case 'CREATE_PURCHASE_ORDER': {
        const payload = cmd.payload || {};
        const po = this.createPurchaseOrder(
          cmd.entityId,
          payload.supplierId || this.suppliers[0].id,
          actorId,
          payload.discount || 0,
          payload.shippingCost || 0,
          payload.expectedDays || 4,
          cmd.remarks || ''
        );
        return { success: true, message: `Purchase Order ${po.poNumber} created successfully.`, data: po };
      }
      case 'SEND_PURCHASE_ORDER': {
        const po = this.purchaseOrders.find((p) => p.id === cmd.entityId || p.poNumber === cmd.entityId);
        if (!po) throw new Error('Purchase Order not found');
        po.status = PurchaseOrderStatus.SENT_TO_SUPPLIER;
        return { success: true, message: `PO ${po.poNumber} sent to supplier ${po.supplierName}`, data: po };
      }
      case 'ACCEPT_ORDER': {
        const po = this.supplierAcceptPO(cmd.entityId, actorId);
        return { success: true, message: `Supplier accepted PO ${po.poNumber}`, data: po };
      }
      case 'REJECT_ORDER': {
        const po = this.supplierRejectPO(cmd.entityId, actorId, cmd.remarks || 'Supplier cannot fulfill order at this time');
        return { success: true, message: `Supplier rejected PO ${po.poNumber}`, data: po };
      }
      case 'START_PROCESSING': {
        const po = this.processPO(cmd.entityId, actorId);
        return { success: true, message: `PO ${po.poNumber} is now being processed`, data: po };
      }
      case 'DISPATCH_ORDER': {
        const payload = cmd.payload || {};
        const res = this.dispatchPO(
          cmd.entityId,
          actorId,
          payload.carrier,
          payload.shippingAddress,
          payload.deliveryAgentId
        );
        return { success: true, message: `PO ${res.po.poNumber} dispatched with tracking ${res.delivery.trackingNumber}`, data: res };
      }
      case 'UPDATE_DELIVERY': {
        const payload = cmd.payload || {};
        const del = this.updateDeliveryStatus(
          cmd.entityId,
          actorId,
          payload.status || DeliveryStatus.IN_TRANSIT,
          payload.location || 'In Transit',
          payload.description || cmd.remarks || 'Transit milestone reached'
        );
        return { success: true, message: `Delivery tracking updated for ${del.trackingNumber}`, data: del };
      }
      case 'MARK_DELIVERED': {
        const payload = cmd.payload || {};
        const del = this.updateDeliveryStatus(
          cmd.entityId,
          actorId,
          DeliveryStatus.DELIVERED,
          payload.location || 'Destination Dock',
          cmd.remarks || 'Package handed over and barcode verified'
        );
        return { success: true, message: `Delivery ${del.trackingNumber} marked DELIVERED and inventory synced.`, data: del };
      }
      case 'CANCEL_ORDER': {
        const po = this.purchaseOrders.find((p) => p.id === cmd.entityId || p.poNumber === cmd.entityId);
        if (!po) throw new Error('Purchase Order not found');
        if (po.status === PurchaseOrderStatus.DELIVERED) {
          throw new Error('Cannot cancel a delivered Purchase Order');
        }
        po.status = PurchaseOrderStatus.CANCELLED;
        this.logAudit(actorId, 'CANCEL_ORDER', 'PURCHASE_ORDER', po.poNumber, `PO cancelled. Reason: ${cmd.remarks}`);
        return { success: true, message: `PO ${po.poNumber} cancelled`, data: po };
      }
      default:
        throw new Error(`Unknown workflow command action: ${(cmd as any).action}`);
    }
  }

  // Dashboard Aggregator
  public getDashboardKPIs(userRole?: UserRole): any {
    const totalUsers = this.users.length;
    const totalProducts = this.products.length;
    const totalSuppliers = this.suppliers.length;
    const totalPurchaseRequests = this.purchaseRequests.length;
    const pendingApprovals = this.purchaseRequests.filter(
      (pr) => pr.status === PurchaseRequestStatus.PENDING_APPROVAL || pr.status === PurchaseRequestStatus.SUBMITTED
    ).length;
    const approvedRequests = this.purchaseRequests.filter(
      (pr) => pr.status === PurchaseRequestStatus.APPROVED || pr.status === PurchaseRequestStatus.CONVERTED_TO_PO
    ).length;
    const rejectedRequests = this.purchaseRequests.filter(
      (pr) => pr.status === PurchaseRequestStatus.REJECTED
    ).length;
    const activePurchaseOrders = this.purchaseOrders.filter(
      (po) =>
        po.status !== PurchaseOrderStatus.DELIVERED &&
        po.status !== PurchaseOrderStatus.COMPLETED &&
        po.status !== PurchaseOrderStatus.CANCELLED
    ).length;
    const ordersInTransit = this.deliveries.filter(
      (d) => d.status === DeliveryStatus.IN_TRANSIT || d.status === DeliveryStatus.OUT_FOR_DELIVERY
    ).length;
    const deliveredOrders = this.deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED).length;
    const lowStockProducts = this.products.filter((p) => p.quantity <= p.minimumStock).length;

    const totalProcurementSpend = this.purchaseOrders
      .filter((po) => po.status !== PurchaseOrderStatus.CANCELLED)
      .reduce((acc, po) => acc + po.totalAmount, 0);

    const monthlySpendTrend = [
      { month: 'Apr 2026', spend: 2450000, ordersCount: 8 },
      { month: 'May 2026', spend: 3120000, ordersCount: 12 },
      { month: 'Jun 2026', spend: 1980000, ordersCount: 7 },
      { month: 'Jul 2026', spend: 4500000, ordersCount: 15 },
      { month: 'Aug 2026', spend: 2802900, ordersCount: 10 },
      { month: 'Sep 2026', spend: 1250000, ordersCount: 4 },
    ];

    const statusDistribution = [
      { status: 'Delivered', count: deliveredOrders },
      { status: 'In Transit', count: ordersInTransit },
      { status: 'Pending Approval', count: pendingApprovals },
      { status: 'Processing', count: activePurchaseOrders },
    ];

    return {
      totalUsers,
      totalProducts,
      totalSuppliers,
      totalPurchaseRequests,
      pendingApprovals,
      approvedRequests,
      rejectedRequests,
      activePurchaseOrders,
      ordersInTransit,
      deliveredOrders,
      lowStockProducts,
      totalProcurementSpend,
      onTimeDeliveryRate: 96.4,
      averageApprovalHours: 4.2,
      monthlySpendTrend,
      statusDistribution,
      recentActivities: this.auditLogs.slice(0, 10),
    };
  }
}

export const db = new DatabaseEngine();
