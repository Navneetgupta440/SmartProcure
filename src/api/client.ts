/**
 * ProcureFlow Enterprise - Centralized REST API Client
 */

import { StandardApiResponse } from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<StandardApiResponse<T>> {
  const token = localStorage.getItem('procureflow_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP Error ${res.status}`);
    }
    return data;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  health: () => request<any>('/health'),

  // Auth
  signup: (body: any) => request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/auth/me'),

  // Users
  getUsers: (params?: { role?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/users${q ? `?${q}` : ''}`);
  },

  // Categories
  getCategories: () => request<any[]>('/categories'),
  createCategory: (body: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(body) }),

  // Products
  getProducts: (params?: { search?: string; category?: string; supplier?: string; stockStatus?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/products${q ? `?${q}` : ''}`);
  },
  getProduct: (id: string) => request<any>(`/products/${id}`),
  createProduct: (body: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(body) }),
  bulkImportProducts: (body: { products: any[]; options?: any }) =>
    request<any>('/products/bulk-import', { method: 'POST', body: JSON.stringify(body) }),
  getImportHistory: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/products/import-history${q ? `?${q}` : ''}`);
  },
  getImportHistoryDetail: (id: string) => request<any>(`/products/import-history/${id}`),
  revertImportBatch: (id: string, body?: { revertedBy?: string }) =>
    request<any>(`/products/import-history/${id}/revert`, { method: 'POST', body: JSON.stringify(body || {}) }),

  // Suppliers
  getSuppliers: () => request<any[]>('/suppliers'),
  getSupplier: (id: string) => request<any>(`/suppliers/${id}`),
  createSupplier: (body: any) => request<any>('/suppliers', { method: 'POST', body: JSON.stringify(body) }),

  // Purchase Requests
  getPurchaseRequests: (params?: { status?: string; requestedBy?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/purchase-requests${q ? `?${q}` : ''}`);
  },
  getPurchaseRequest: (id: string) => request<any>(`/purchase-requests/${id}`),
  createPurchaseRequest: (body: any) => request<any>('/purchase-requests', { method: 'POST', body: JSON.stringify(body) }),

  // Approvals
  getPendingApprovals: () => request<any[]>('/approvals/pending'),
  approveRequest: (requestId: string, body: { approverId: string; remarks?: string }) =>
    request<any>(`/approvals/${requestId}/approve`, { method: 'POST', body: JSON.stringify(body) }),
  rejectRequest: (requestId: string, body: { rejectorId: string; remarks: string }) =>
    request<any>(`/approvals/${requestId}/reject`, { method: 'POST', body: JSON.stringify(body) }),

  // Purchase Orders
  getPurchaseOrders: (params?: { status?: string; supplierId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/purchase-orders${q ? `?${q}` : ''}`);
  },
  getPurchaseOrder: (id: string) => request<any>(`/purchase-orders/${id}`),
  createPurchaseOrder: (body: any) => request<any>('/purchase-orders', { method: 'POST', body: JSON.stringify(body) }),

  // Supplier Portal
  getSupplierOrders: (supplierId?: string) =>
    request<any[]>(`/supplier/orders${supplierId ? `?supplierId=${supplierId}` : ''}`),
  supplierAcceptPO: (poId: string, supplierUserId?: string) =>
    request<any>(`/supplier/orders/${poId}/accept`, { method: 'POST', body: JSON.stringify({ supplierUserId }) }),
  supplierRejectPO: (poId: string, body: { supplierUserId?: string; reason: string }) =>
    request<any>(`/supplier/orders/${poId}/reject`, { method: 'POST', body: JSON.stringify(body) }),
  supplierProcessPO: (poId: string, supplierUserId?: string) =>
    request<any>(`/supplier/orders/${poId}/process`, { method: 'POST', body: JSON.stringify({ supplierUserId }) }),
  supplierDispatchPO: (poId: string, body: any) =>
    request<any>(`/supplier/orders/${poId}/dispatch`, { method: 'POST', body: JSON.stringify(body) }),

  // Deliveries
  getDeliveries: (params?: { status?: string; deliveryAgentId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/deliveries${q ? `?${q}` : ''}`);
  },
  getDelivery: (id: string) => request<any>(`/deliveries/${id}`),
  updateDeliveryStatus: (id: string, body: any) =>
    request<any>(`/deliveries/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),

  // Inventory
  getInventory: () => request<any[]>('/inventory'),
  adjustInventory: (body: any) => request<any>('/inventory/adjust', { method: 'POST', body: JSON.stringify(body) }),
  getInventoryTransactions: () => request<any[]>('/inventory/transactions'),

  // Smart Procurement Engine
  getSmartRecommendations: () => request<any[]>('/procurement/recommendations'),
  getSupplierRankings: (productId?: string) =>
    request<any[]>(`/suppliers/recommendation${productId ? `?productId=${productId}` : ''}`),

  // Central Workflow API
  executeWorkflow: (body: any) => request<any>('/workflow', { method: 'POST', body: JSON.stringify(body) }),
  executeWorkflowCommand: (action: string, payload: any) =>
    request<any>('/workflow', { method: 'POST', body: JSON.stringify({ action, payload }) }),

  // Audit Logs & Notifications
  getAuditLogs: (params?: { action?: string; entityType?: string; userId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/audit-logs${q ? `?${q}` : ''}`);
  },
  getNotifications: (userId?: string) =>
    request<any[]>(`/notifications${userId ? `?userId=${userId}` : ''}`),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),

  // Dashboard & Analytics
  getDashboardKPIs: (role: string) => request<any>(`/dashboard/${role}`),
  getProcurementReport: () => request<any>('/reports/procurement'),

  // System
  resetSystem: () => request<any>('/system/reset', { method: 'POST' }),

  // Gemini AI Advisor
  askGeminiAdvisor: (prompt: string, context?: any) =>
    request<any>('/gemini/procurement-advisor', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    }),
  askProcurementAI: (prompt: string, context?: any) =>
    request<any>('/gemini/procurement-advisor', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    }),
};
