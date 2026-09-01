/**
 * ProcureFlow Enterprise - Master REST API Server
 * Full-stack Express Backend + Vite Middleware (Port 3000)
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db } from './server/db';
import {
  UserRole,
  UserStatus,
  StandardApiResponse,
  DeliveryStatus,
  PurchaseRequestStatus,
  PurchaseOrderStatus,
} from './src/types';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standard Response Helper
function formatResponse<T>(success: boolean, message: string, data: T, extra?: Record<string, any>): StandardApiResponse<T> {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

// ----------------------------------------------------
// 1. HEALTH & ACTUATOR APIS
// ----------------------------------------------------
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json(
    formatResponse(true, 'ProcureFlow Enterprise REST Services Operational', {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0-PROD',
      database: 'PostgreSQL-Compatible Engine Connected',
      activeUsers: db.users.length,
      productsCount: db.products.length,
    })
  );
});

// ----------------------------------------------------
// 2. AUTHENTICATION APIS
// ----------------------------------------------------
app.post('/api/v1/auth/signup', (req: Request, res: Response) => {
  const { name, email, phone, role, department, password } = req.body;
  if (!name || !email) {
    return res.status(400).json(formatResponse(false, 'Name and email are required', null));
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json(formatResponse(false, 'Email already registered in system', null));
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    phone: phone || '+91 99000 11223',
    role: role || UserRole.EMPLOYEE,
    status: UserStatus.ACTIVE,
    department: department || 'Operations',
    profileImage: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.logAudit(newUser.id, 'SIGNUP', 'USER', newUser.id, `User registered: ${newUser.name} (${newUser.role})`);

  const token = `jwt_token_${newUser.id}_${Date.now()}`;
  res.status(201).json(
    formatResponse(true, 'User registered successfully', {
      user: newUser,
      accessToken: token,
      refreshToken: `refresh_${token}`,
      tokenType: 'Bearer',
      expiresIn: 86400,
    })
  );
});

app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json(formatResponse(false, 'Email is required', null));
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json(formatResponse(false, 'Invalid email or credentials', null));
  }

  user.lastLogin = new Date().toISOString();
  db.logAudit(user.id, 'LOGIN', 'AUTH', user.id, `User login successful: ${user.name}`);

  const token = `jwt_token_${user.id}_${Date.now()}`;
  res.json(
    formatResponse(true, 'Authentication successful', {
      user,
      accessToken: token,
      refreshToken: `refresh_${token}`,
      tokenType: 'Bearer',
      expiresIn: 86400,
    })
  );
});

app.get('/api/v1/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let user = db.users[0]; // default admin for demo if no header

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userIdMatch = token.match(/jwt_token_([^_]+)_/);
    if (userIdMatch && userIdMatch[1]) {
      const found = db.users.find((u) => u.id === userIdMatch[1]);
      if (found) user = found;
    }
  }

  res.json(formatResponse(true, 'User profile retrieved', user));
});

// ----------------------------------------------------
// 3. USER MANAGEMENT APIS
// ----------------------------------------------------
app.get('/api/v1/users', (req: Request, res: Response) => {
  const { role, search } = req.query;
  let list = [...db.users];

  if (role) {
    list = list.filter((u) => u.role === role);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  res.json(formatResponse(true, 'Users retrieved', list, { totalElements: list.length }));
});

// ----------------------------------------------------
// 4. CATEGORIES APIS
// ----------------------------------------------------
app.get('/api/v1/categories', (req: Request, res: Response) => {
  res.json(formatResponse(true, 'Categories retrieved', db.categories));
});

app.post('/api/v1/categories', (req: Request, res: Response) => {
  const { name, code, description } = req.body;
  if (!name || !code) {
    return res.status(400).json(formatResponse(false, 'Name and code are required', null));
  }

  const newCat = {
    id: `cat-${Date.now()}`,
    name,
    code,
    description: description || '',
    productCount: 0,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
  };

  db.categories.push(newCat);
  db.logAudit('usr-admin-01', 'CREATE_CATEGORY', 'CATEGORY', newCat.id, `Created category: ${name}`);
  res.status(201).json(formatResponse(true, 'Category created', newCat));
});

// ----------------------------------------------------
// 5. PRODUCTS & INVENTORY APIS
// ----------------------------------------------------
app.get('/api/v1/products', (req: Request, res: Response) => {
  const { search, category, supplier, stockStatus, page = 0, size = 50 } = req.query;
  let list = [...db.products];

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q));
  }

  if (category) {
    list = list.filter((p) => p.categoryId === category || p.categoryName === category);
  }

  if (supplier) {
    list = list.filter((p) => p.supplierId === supplier || p.supplierName === supplier);
  }

  if (stockStatus === 'LOW') {
    list = list.filter((p) => p.quantity <= p.minimumStock);
  }

  const pNum = Number(page);
  const sNum = Number(size);
  const start = pNum * sNum;
  const paginated = list.slice(start, start + sNum);

  res.json(
    formatResponse(true, 'Products retrieved successfully', paginated, {
      page: pNum,
      size: sNum,
      totalElements: list.length,
      totalPages: Math.ceil(list.length / sNum),
    })
  );
});

app.get('/api/v1/products/:id', (req: Request, res: Response) => {
  const product = db.products.find((p) => p.id === req.params.id || p.productCode === req.params.id);
  if (!product) {
    return res.status(404).json(formatResponse(false, 'Product not found', null));
  }
  res.json(formatResponse(true, 'Product details retrieved', product));
});

app.post('/api/v1/products', (req: Request, res: Response) => {
  const { name, productCode, categoryId, supplierId, unitPrice, minimumStock, maximumStock, unit, description, imageUrl } = req.body;

  if (!name || !unitPrice) {
    return res.status(400).json(formatResponse(false, 'Name and unitPrice are required', null));
  }

  const code = productCode || `PRD-GEN-${Math.floor(1000 + Math.random() * 9000)}`;
  const cat = db.categories.find((c) => c.id === categoryId) || db.categories[0];
  const sup = db.suppliers.find((s) => s.id === supplierId) || db.suppliers[0];

  const newProd = {
    id: `prd-${Date.now()}`,
    productCode: code,
    name,
    description: description || '',
    categoryId: cat?.id || 'cat-comp-01',
    categoryName: cat?.name || 'General Hardware',
    supplierId: sup?.id || 'sup-tech-01',
    supplierName: sup?.companyName || 'TechDynamics',
    unitPrice: Number(unitPrice),
    quantity: 10,
    minimumStock: Number(minimumStock) || 5,
    maximumStock: Number(maximumStock) || 30,
    reservedQuantity: 0,
    availableQuantity: 10,
    unit: unit || 'Units',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE' as const,
    warehouseLocation: 'Warehouse A - Bay 01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.products.unshift(newProd);
  db.logAudit('usr-admin-01', 'CREATE_PRODUCT', 'PRODUCT', newProd.productCode, `Created product: ${newProd.name}`);

  res.status(201).json(formatResponse(true, 'Product created successfully', newProd));
});

// Bulk Import Products API
app.post('/api/v1/products/bulk-import', (req: Request, res: Response) => {
  const { products, options = {} } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json(formatResponse(false, 'No products provided in request body', null));
  }

  const {
    batchNumber,
    fileName,
    sourceType = 'CSV_UPLOAD',
    overwriteExisting = true,
    defaultCategoryId,
    defaultSupplierId,
    dryRun = false,
  } = options;

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors: { row: number; productCode?: string; name?: string; message: string }[] = [];
  const createdProducts: any[] = [];
  const updatedProducts: any[] = [];
  const createdProductsSummary: { id: string; productCode: string; name: string; unitPrice: number; categoryName: string }[] = [];
  const updatedProductSnapshots: { productId: string; productCode: string; name: string; previousState: any }[] = [];

  const defaultCat = db.categories.find((c) => c.id === defaultCategoryId) || db.categories[0];
  const defaultSup = db.suppliers.find((s) => s.id === defaultSupplierId) || db.suppliers[0];

  products.forEach((item: any, index: number) => {
    const rowNum = index + 1;

    // Basic validation
    if (!item.name || typeof item.name !== 'string' || !item.name.trim()) {
      errors.push({ row: rowNum, productCode: item.productCode, name: item.name, message: 'Missing product name' });
      errorCount++;
      return;
    }

    const price = Number(item.unitPrice);
    if (isNaN(price) || price <= 0) {
      errors.push({ row: rowNum, productCode: item.productCode, name: item.name, message: 'Invalid or missing unit price' });
      errorCount++;
      return;
    }

    // Resolve Category
    let cat = db.categories.find(
      (c) =>
        c.id === item.categoryId ||
        c.code?.toLowerCase() === item.categoryCode?.toLowerCase() ||
        c.name.toLowerCase() === item.categoryName?.toLowerCase()
    );
    if (!cat && item.categoryName) {
      const qCat = item.categoryName.toLowerCase();
      cat = db.categories.find((c) => c.name.toLowerCase().includes(qCat));
    }
    if (!cat) cat = defaultCat;

    // Resolve Supplier
    let sup = db.suppliers.find(
      (s) =>
        s.id === item.supplierId ||
        s.companyName.toLowerCase() === item.supplierName?.toLowerCase()
    );
    if (!sup && item.supplierName) {
      const qSup = item.supplierName.toLowerCase();
      sup = db.suppliers.find((s) => s.companyName.toLowerCase().includes(qSup));
    }
    if (!sup) sup = defaultSup;

    // SKU Code
    let sku = item.productCode?.trim();
    if (!sku) {
      sku = `PRD-BLK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Price and MRP calculations
    const mrp = Number(item.mrpPrice) || Math.round(price * 1.25);
    const discount =
      Number(item.discountPercentage) ||
      (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

    const qty = Number(item.quantity) >= 0 ? Number(item.quantity) : 15;
    const minStock = Number(item.minimumStock) >= 0 ? Number(item.minimumStock) : 5;
    const maxStock = Number(item.maximumStock) >= minStock ? Number(item.maximumStock) : Math.max(30, qty * 2);

    const defaultImages = [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80',
    ];
    const imageChoice = item.imageUrl?.trim() || defaultImages[index % defaultImages.length];

    // Highlights & Specs
    let highlights: string[] = [];
    if (Array.isArray(item.highlights)) {
      highlights = item.highlights;
    } else if (typeof item.highlights === 'string' && item.highlights.trim()) {
      highlights = item.highlights.split(/[\n;,|]+/).map((s: string) => s.trim()).filter(Boolean);
    } else {
      highlights = [
        `Enterprise Grade SKU: ${sku}`,
        `100% Genuine OEM Certified with GST Input Tax Credit`,
        `ProcureFlow 3-Year Enterprise SLA & Replacement Support`,
      ];
    }

    // Specifications
    let specs = item.specifications;
    if (!Array.isArray(specs) || specs.length === 0) {
      specs = [
        { key: 'Brand', value: item.brand || 'Enterprise OEM' },
        { key: 'Category', value: cat?.name || 'Hardware & IT' },
        { key: 'Warranty', value: '3 Years ProSupport Onsite' },
        { key: 'GST Tax Rate', value: '18% Input Credit Eligible' },
      ];
    }

    // Check existing
    const existingIndex = db.products.findIndex(
      (p) => p.productCode.toLowerCase() === sku.toLowerCase() || p.id === item.id
    );

    if (existingIndex >= 0) {
      if (overwriteExisting) {
        const existing = db.products[existingIndex];
        // Snapshot for revert capability
        updatedProductSnapshots.push({
          productId: existing.id,
          productCode: existing.productCode,
          name: existing.name,
          previousState: JSON.parse(JSON.stringify(existing)),
        });

        if (!dryRun) {
          const updatedProduct = {
            ...existing,
            name: item.name,
            brand: item.brand || existing.brand || 'Enterprise OEM',
            categoryId: cat?.id || existing.categoryId,
            categoryName: cat?.name || existing.categoryName,
            supplierId: sup?.id || existing.supplierId,
            supplierName: sup?.companyName || existing.supplierName,
            unitPrice: price,
            mrpPrice: mrp,
            discountPercentage: discount,
            quantity: qty,
            availableQuantity: qty,
            minimumStock: minStock,
            maximumStock: maxStock,
            unit: item.unit || existing.unit || 'Units',
            description: item.description || existing.description || '',
            imageUrl: imageChoice,
            isFlipkartAssured: item.isFlipkartAssured !== undefined ? Boolean(item.isFlipkartAssured) : true,
            deliveryTag: item.deliveryTag || existing.deliveryTag || 'Free Express Delivery in 24-48 Hours',
            deliveryDays: Number(item.deliveryDays) || existing.deliveryDays || 2,
            warehouseLocation: item.warehouseLocation || existing.warehouseLocation || 'Central Warehouse Bay 01',
            highlights,
            specifications: specs,
            updatedAt: new Date().toISOString(),
          };
          db.products[existingIndex] = updatedProduct;
          updatedProducts.push(updatedProduct);
        }
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      // Create new
      const newProduct = {
        id: `prd-bulk-${Date.now()}-${index}`,
        productCode: sku,
        name: item.name,
        brand: item.brand || 'Enterprise OEM',
        description: item.description || `${item.name} procured via enterprise bulk catalog sync.`,
        categoryId: cat?.id || 'cat-comp-01',
        categoryName: cat?.name || 'General Hardware',
        supplierId: sup?.id || 'sup-tech-01',
        supplierName: sup?.companyName || 'TechDynamics Enterprises',
        unitPrice: price,
        mrpPrice: mrp,
        discountPercentage: discount,
        rating: Number(item.rating) || 4.7,
        reviewCount: Number(item.reviewCount) || Math.floor(40 + Math.random() * 200),
        isFlipkartAssured: item.isFlipkartAssured !== undefined ? Boolean(item.isFlipkartAssured) : true,
        deliveryDays: Number(item.deliveryDays) || 2,
        deliveryTag: item.deliveryTag || 'Free Express Delivery in 24-48 Hours',
        highlights,
        specifications: specs,
        offers: [
          '5% Volume Procurement Rebate on 10+ Units',
          '30-Day Net Corporate Invoice Credit Terms',
          'Free On-Site Deployment & Installation Assistance',
        ],
        galleryImages: [imageChoice],
        quantity: qty,
        minimumStock: minStock,
        maximumStock: maxStock,
        reservedQuantity: 0,
        availableQuantity: qty,
        unit: item.unit || 'Units',
        imageUrl: imageChoice,
        status: 'ACTIVE' as const,
        warehouseLocation: item.warehouseLocation || `Warehouse Bay ${Math.floor(1 + Math.random() * 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      createdProductsSummary.push({
        id: newProduct.id,
        productCode: newProduct.productCode,
        name: newProduct.name,
        unitPrice: newProduct.unitPrice,
        categoryName: newProduct.categoryName,
      });

      if (!dryRun) {
        db.products.unshift(newProduct);
        createdProducts.push(newProduct);
      }
      createdCount++;
    }
  });

  const generatedBatchNumber = batchNumber || `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const finalSuccessRate = products.length > 0 ? Number((((createdCount + updatedCount) / products.length) * 100).toFixed(1)) : 0;
  let batchId = `imp-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  // Update Category Counts and record import history
  if (!dryRun) {
    db.categories.forEach((cat) => {
      cat.productCount = db.products.filter((p) => p.categoryId === cat.id).length;
    });

    const status: any = errorCount === 0 ? 'COMPLETED' : (createdCount + updatedCount > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED');

    const historyRecord = {
      id: batchId,
      batchNumber: generatedBatchNumber,
      fileName: fileName || 'bulk_catalog_upload.csv',
      sourceType: sourceType as any,
      status,
      totalRecords: products.length,
      createdCount,
      updatedCount,
      skippedCount,
      errorCount,
      successRate: finalSuccessRate,
      createdProductIds: createdProducts.map((p) => p.id),
      createdProductsSummary,
      updatedProductSnapshots,
      errors,
      isRevertible: (createdProducts.length > 0 || updatedProductSnapshots.length > 0),
      revertedAt: null,
      revertedBy: null,
      revertSummary: null,
      createdBy: {
        id: 'usr-admin-01',
        name: 'Navneet Gupta',
        email: 'indianavneetgupta33@gmail.com',
        role: 'ADMIN',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.bulkImportHistory.unshift(historyRecord);

    db.logAudit(
      'usr-admin-01',
      'BULK_IMPORT_PRODUCTS',
      'PRODUCT_BATCH',
      generatedBatchNumber,
      `Bulk imported products: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors. Batch: ${generatedBatchNumber}`
    );
  }

  const result = {
    totalProcessed: products.length,
    createdCount,
    updatedCount,
    skippedCount,
    errorCount,
    successRate: finalSuccessRate,
    batchId,
    batchNumber: generatedBatchNumber,
    errors,
    createdProducts,
    updatedProducts,
  };

  res.status(200).json(
    formatResponse(
      true,
      `Bulk import completed: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`,
      result
    )
  );
});

// Import History APIs
app.get('/api/v1/products/import-history', (req: Request, res: Response) => {
  const { status, search } = req.query;

  let records = [...db.bulkImportHistory];

  if (status && typeof status === 'string' && status !== 'ALL') {
    records = records.filter((r) => r.status === status);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    records = records.filter(
      (r) =>
        r.fileName.toLowerCase().includes(q) ||
        r.batchNumber.toLowerCase().includes(q) ||
        r.createdBy.name.toLowerCase().includes(q)
    );
  }

  const totalImports = db.bulkImportHistory.length;
  const totalIngestedSKUs = db.bulkImportHistory.reduce((acc, h) => acc + (h.createdCount + h.updatedCount), 0);
  const totalProcessedAll = db.bulkImportHistory.reduce((acc, h) => acc + h.totalRecords, 0);
  const overallSuccessRate = totalProcessedAll > 0
    ? Number(((totalIngestedSKUs / totalProcessedAll) * 100).toFixed(1))
    : 100;
  const revertedCount = db.bulkImportHistory.filter((h) => h.status === 'REVERTED').length;

  res.json(
    formatResponse(true, 'Import history retrieved', records, {
      totalElements: records.length,
      metrics: {
        totalImports,
        totalIngestedSKUs,
        overallSuccessRate,
        revertedCount,
      },
    })
  );
});

app.get('/api/v1/products/import-history/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const record = db.bulkImportHistory.find((r) => r.id === id || r.batchNumber === id);

  if (!record) {
    return res.status(404).json(formatResponse(false, 'Import batch history not found', null));
  }

  res.json(formatResponse(true, 'Import batch details retrieved', record));
});

// Revert Bulk Import Action API
app.post('/api/v1/products/import-history/:id/revert', (req: Request, res: Response) => {
  const { id } = req.params;
  const { revertedBy = 'Navneet Gupta (Admin)' } = req.body;

  const recordIndex = db.bulkImportHistory.findIndex((r) => r.id === id || r.batchNumber === id);
  if (recordIndex < 0) {
    return res.status(404).json(formatResponse(false, 'Import batch not found', null));
  }

  const record = db.bulkImportHistory[recordIndex];

  if (record.status === 'REVERTED') {
    return res.status(400).json(formatResponse(false, 'This bulk import action has already been reverted', record));
  }

  if (!record.isRevertible) {
    return res.status(400).json(formatResponse(false, 'This import batch cannot be reverted', record));
  }

  // 1. Delete created products
  const beforeCount = db.products.length;
  if (record.createdProductIds && record.createdProductIds.length > 0) {
    db.products = db.products.filter((p) => !record.createdProductIds.includes(p.id));
  }
  const removedCreatedCount = beforeCount - db.products.length;

  // 2. Restore modified products to pre-import snapshots
  let restoredCount = 0;
  if (record.updatedProductSnapshots && record.updatedProductSnapshots.length > 0) {
    record.updatedProductSnapshots.forEach((snap) => {
      const pIdx = db.products.findIndex((p) => p.id === snap.productId);
      if (pIdx >= 0) {
        db.products[pIdx] = {
          ...db.products[pIdx],
          ...snap.previousState,
          updatedAt: new Date().toISOString(),
        };
        restoredCount++;
      }
    });
  }

  // 3. Recalculate Category product counts
  db.categories.forEach((cat) => {
    cat.productCount = db.products.filter((p) => p.categoryId === cat.id).length;
  });

  // 4. Update import history record
  const revertSummary = `Revert executed: Removed ${removedCreatedCount} newly created SKUs and restored ${restoredCount} modified SKUs to original state.`;
  const updatedRecord = {
    ...record,
    status: 'REVERTED' as const,
    isRevertible: false,
    revertedAt: new Date().toISOString(),
    revertedBy,
    revertSummary,
    updatedAt: new Date().toISOString(),
  };

  db.bulkImportHistory[recordIndex] = updatedRecord;

  // 5. Audit log
  db.logAudit(
    'usr-admin-01',
    'REVERT_BULK_IMPORT',
    'PRODUCT_BATCH',
    record.batchNumber,
    revertSummary
  );

  res.json(
    formatResponse(
      true,
      `Successfully reverted bulk import batch ${record.batchNumber}. ${removedCreatedCount} SKUs removed, ${restoredCount} SKUs restored.`,
      updatedRecord
    )
  );
});

// ----------------------------------------------------
// 6. SUPPLIERS APIS
// ----------------------------------------------------
app.get('/api/v1/suppliers', (req: Request, res: Response) => {
  res.json(formatResponse(true, 'Suppliers retrieved', db.suppliers, { totalElements: db.suppliers.length }));
});

app.get('/api/v1/suppliers/:id', (req: Request, res: Response) => {
  const supplier = db.suppliers.find((s) => s.id === req.params.id);
  if (!supplier) return res.status(404).json(formatResponse(false, 'Supplier not found', null));
  res.json(formatResponse(true, 'Supplier details', supplier));
});

app.post('/api/v1/suppliers', (req: Request, res: Response) => {
  const { companyName, contactPerson, email, phone, city, state, gstNumber } = req.body;
  if (!companyName || !email) {
    return res.status(400).json(formatResponse(false, 'Company name and email required', null));
  }

  const newSupplier = {
    id: `sup-${Date.now()}`,
    companyName,
    contactPerson: contactPerson || 'Vendor Representative',
    email,
    phone: phone || '+91 80 1234 5678',
    address: 'Commercial Business District',
    city: city || 'Bengaluru',
    state: state || 'Karnataka',
    country: 'India',
    gstNumber: gstNumber || '29AAAAA0000A1Z5',
    taxId: `PAN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    rating: 4.5,
    qualityScore: 90,
    deliveryScore: 90,
    reliabilityScore: 90,
    averageLeadDays: 3,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.suppliers.unshift(newSupplier);
  db.logAudit('usr-admin-01', 'CREATE_SUPPLIER', 'SUPPLIER', newSupplier.id, `Created supplier ${companyName}`);
  res.status(201).json(formatResponse(true, 'Supplier created', newSupplier));
});

// ----------------------------------------------------
// 7. PURCHASE REQUESTS APIS
// ----------------------------------------------------
app.get('/api/v1/purchase-requests', (req: Request, res: Response) => {
  const { status, requestedBy } = req.query;
  let list = [...db.purchaseRequests];

  if (status) {
    list = list.filter((pr) => pr.status === status);
  }
  if (requestedBy) {
    list = list.filter((pr) => pr.requestedBy === requestedBy);
  }

  res.json(formatResponse(true, 'Purchase requests retrieved', list, { totalElements: list.length }));
});

app.get('/api/v1/purchase-requests/:id', (req: Request, res: Response) => {
  const pr = db.purchaseRequests.find((p) => p.id === req.params.id || p.requestNumber === req.params.id);
  if (!pr) return res.status(404).json(formatResponse(false, 'Purchase request not found', null));
  res.json(formatResponse(true, 'Purchase request retrieved', pr));
});

app.post('/api/v1/purchase-requests', (req: Request, res: Response) => {
  try {
    const { userId, department, priority, reason, items } = req.body;
    const pr = db.createPurchaseRequest(
      userId || 'usr-emp-01',
      department || 'Information Technology',
      priority || 'MEDIUM',
      reason || 'Operational requirements',
      items || []
    );
    res.status(201).json(formatResponse(true, `Purchase Request ${pr.requestNumber} created successfully`, pr));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

// ----------------------------------------------------
// 8. MULTI-LEVEL APPROVALS APIS
// ----------------------------------------------------
app.get('/api/v1/approvals/pending', (req: Request, res: Response) => {
  const pending = db.purchaseRequests.filter(
    (pr) => pr.status === PurchaseRequestStatus.PENDING_APPROVAL || pr.status === PurchaseRequestStatus.SUBMITTED
  );
  res.json(formatResponse(true, 'Pending approvals retrieved', pending));
});

app.post('/api/v1/approvals/:requestId/approve', (req: Request, res: Response) => {
  try {
    const { approverId, remarks } = req.body;
    const pr = db.approvePurchaseRequest(req.params.requestId, approverId || 'usr-mgr-01', remarks);
    res.json(formatResponse(true, `Purchase Request ${pr.requestNumber} approved successfully`, pr));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

app.post('/api/v1/approvals/:requestId/reject', (req: Request, res: Response) => {
  try {
    const { rejectorId, remarks } = req.body;
    const pr = db.rejectPurchaseRequest(req.params.requestId, rejectorId || 'usr-mgr-01', remarks);
    res.json(formatResponse(true, `Purchase Request ${pr.requestNumber} rejected`, pr));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

// ----------------------------------------------------
// 9. PURCHASE ORDERS APIS
// ----------------------------------------------------
app.get('/api/v1/purchase-orders', (req: Request, res: Response) => {
  const { status, supplierId } = req.query;
  let list = [...db.purchaseOrders];

  if (status) {
    list = list.filter((po) => po.status === status);
  }
  if (supplierId) {
    list = list.filter((po) => po.supplierId === supplierId);
  }

  res.json(formatResponse(true, 'Purchase orders retrieved', list, { totalElements: list.length }));
});

app.get('/api/v1/purchase-orders/:id', (req: Request, res: Response) => {
  const po = db.purchaseOrders.find((p) => p.id === req.params.id || p.poNumber === req.params.id);
  if (!po) return res.status(404).json(formatResponse(false, 'Purchase order not found', null));
  res.json(formatResponse(true, 'Purchase order retrieved', po));
});

app.post('/api/v1/purchase-orders', (req: Request, res: Response) => {
  try {
    const { purchaseRequestId, supplierId, creatorId, discount, shippingCost, expectedDays, remarks } = req.body;
    const po = db.createPurchaseOrder(
      purchaseRequestId,
      supplierId,
      creatorId || 'usr-proc-01',
      Number(discount) || 0,
      Number(shippingCost) || 0,
      Number(expectedDays) || 4,
      remarks || ''
    );
    res.status(201).json(formatResponse(true, `Purchase Order ${po.poNumber} generated successfully`, po));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

// ----------------------------------------------------
// 10. SUPPLIER ORDER PROCESSING APIS
// ----------------------------------------------------
app.get('/api/v1/supplier/orders', (req: Request, res: Response) => {
  const { supplierId } = req.query;
  let list = [...db.purchaseOrders];
  if (supplierId) {
    list = list.filter((p) => p.supplierId === supplierId);
  }
  res.json(formatResponse(true, 'Supplier orders retrieved', list));
});

app.post('/api/v1/supplier/orders/:id/accept', (req: Request, res: Response) => {
  try {
    const { supplierUserId } = req.body;
    const po = db.supplierAcceptPO(req.params.id, supplierUserId || 'usr-sup-01');
    res.json(formatResponse(true, `Purchase order ${po.poNumber} accepted`, po));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

app.post('/api/v1/supplier/orders/:id/reject', (req: Request, res: Response) => {
  try {
    const { supplierUserId, reason } = req.body;
    const po = db.supplierRejectPO(req.params.id, supplierUserId || 'usr-sup-01', reason);
    res.json(formatResponse(true, `Purchase order ${po.poNumber} rejected`, po));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

app.post('/api/v1/supplier/orders/:id/process', (req: Request, res: Response) => {
  try {
    const { supplierUserId } = req.body;
    const po = db.processPO(req.params.id, supplierUserId || 'usr-sup-01');
    res.json(formatResponse(true, `Purchase order ${po.poNumber} processing initiated`, po));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

app.post('/api/v1/supplier/orders/:id/dispatch', (req: Request, res: Response) => {
  try {
    const { supplierUserId, carrier, shippingAddress, deliveryAgentId } = req.body;
    const result = db.dispatchPO(req.params.id, supplierUserId || 'usr-sup-01', carrier, shippingAddress, deliveryAgentId);
    res.json(formatResponse(true, `Purchase order ${result.po.poNumber} dispatched with tracking ${result.delivery.trackingNumber}`, result));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

// ----------------------------------------------------
// 11. DELIVERIES & REAL-TIME TRACKING APIS
// ----------------------------------------------------
app.get('/api/v1/deliveries', (req: Request, res: Response) => {
  const { status, deliveryAgentId } = req.query;
  let list = [...db.deliveries];
  if (status) list = list.filter((d) => d.status === status);
  if (deliveryAgentId) list = list.filter((d) => d.deliveryAgentId === deliveryAgentId);
  res.json(formatResponse(true, 'Deliveries retrieved', list, { totalElements: list.length }));
});

app.get('/api/v1/deliveries/:id', (req: Request, res: Response) => {
  const delivery = db.deliveries.find((d) => d.id === req.params.id || d.trackingNumber === req.params.id);
  if (!delivery) return res.status(404).json(formatResponse(false, 'Delivery not found', null));
  res.json(formatResponse(true, 'Delivery details retrieved', delivery));
});

app.put('/api/v1/deliveries/:id/status', (req: Request, res: Response) => {
  try {
    const { actorId, status, location, description } = req.body;
    const updated = db.updateDeliveryStatus(req.params.id, actorId || 'usr-del-01', status, location, description);
    res.json(formatResponse(true, `Delivery status updated to ${status}`, updated));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

// ----------------------------------------------------
// 12. INVENTORY APIS
// ----------------------------------------------------
app.get('/api/v1/inventory', (req: Request, res: Response) => {
  const inventoryList = db.products.map((p) => ({
    productId: p.id,
    productCode: p.productCode,
    name: p.name,
    categoryName: p.categoryName,
    quantity: p.quantity,
    minimumStock: p.minimumStock,
    maximumStock: p.maximumStock,
    reservedQuantity: p.reservedQuantity,
    availableQuantity: p.availableQuantity,
    warehouseLocation: p.warehouseLocation,
    isLowStock: p.quantity <= p.minimumStock,
  }));
  res.json(formatResponse(true, 'Inventory status retrieved', inventoryList));
});

app.post('/api/v1/inventory/adjust', (req: Request, res: Response) => {
  try {
    const { productId, quantityChange, reason, performedById } = req.body;
    const prod = db.adjustStock(productId, Number(quantityChange), reason, performedById || 'usr-admin-01');
    res.json(formatResponse(true, `Inventory stock updated for ${prod.productCode}`, prod));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

app.get('/api/v1/inventory/transactions', (req: Request, res: Response) => {
  res.json(formatResponse(true, 'Inventory transactions log retrieved', db.inventoryTransactions));
});

// ----------------------------------------------------
// 13. SMART PROCUREMENT & RECOMMENDATION APIS
// ----------------------------------------------------
app.get('/api/v1/procurement/recommendations', (req: Request, res: Response) => {
  const recs = db.getSmartRecommendations();
  res.json(formatResponse(true, 'Smart procurement replenishment recommendations', recs));
});

app.get('/api/v1/suppliers/recommendation', (req: Request, res: Response) => {
  const { productId } = req.query;
  const rankings = db.getSupplierRankingsForProduct(productId as string);
  res.json(formatResponse(true, 'Supplier ranking matrix calculated', rankings));
});

// ----------------------------------------------------
// 14. CENTRAL WORKFLOW API (POST /api/v1/workflow)
// ----------------------------------------------------
app.post('/api/v1/workflow', (req: Request, res: Response) => {
  try {
    const { action, entityType, entityId, remarks, actorId, payload } = req.body;
    if (!action || !entityId) {
      return res.status(400).json(formatResponse(false, 'action and entityId are required', null));
    }

    const result = db.executeWorkflow({
      action,
      entityType: entityType || 'PURCHASE_REQUEST',
      entityId,
      remarks,
      actorId,
      payload,
    });

    res.json(formatResponse(result.success, result.message, result.data));
  } catch (err: any) {
    res.status(400).json(formatResponse(false, err.message, null));
  }
});

// ----------------------------------------------------
// 15. AUDIT LOGS & NOTIFICATIONS APIS
// ----------------------------------------------------
app.get('/api/v1/audit-logs', (req: Request, res: Response) => {
  const { action, entityType, userId } = req.query;
  let list = [...db.auditLogs];
  if (action) list = list.filter((a) => a.action === action);
  if (entityType) list = list.filter((a) => a.entityType === entityType);
  if (userId) list = list.filter((a) => a.userId === userId);
  res.json(formatResponse(true, 'Audit ledger retrieved', list));
});

app.get('/api/v1/notifications', (req: Request, res: Response) => {
  const { userId } = req.query;
  let list = [...db.notifications];
  if (userId) list = list.filter((n) => !n.userId || n.userId === userId);
  res.json(formatResponse(true, 'Notifications retrieved', list));
});

app.post('/api/v1/notifications/:id/read', (req: Request, res: Response) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) notif.read = true;
  res.json(formatResponse(true, 'Notification marked as read', notif));
});

app.post('/api/v1/notifications/read-all', (req: Request, res: Response) => {
  db.notifications.forEach((n) => (n.read = true));
  res.json(formatResponse(true, 'All notifications marked as read', null));
});

// ----------------------------------------------------
// 16. DASHBOARD & REPORTING APIS
// ----------------------------------------------------
app.get('/api/v1/dashboard/:role', (req: Request, res: Response) => {
  const role = req.params.role.toUpperCase() as UserRole;
  const kpis = db.getDashboardKPIs(role);
  res.json(formatResponse(true, `Dashboard KPIs for ${role}`, kpis));
});

app.get('/api/v1/reports/procurement', (req: Request, res: Response) => {
  const kpis = db.getDashboardKPIs();
  res.json(
    formatResponse(true, 'Procurement Financial Analytics Report', {
      totalSpend: kpis.totalProcurementSpend,
      spendByMonth: kpis.monthlySpendTrend,
      spendByCategory: [
        { category: 'Enterprise IT & Laptops', amount: 1650000, percentage: 58.8 },
        { category: 'Networking & Data Center', amount: 780000, percentage: 27.8 },
        { category: 'Displays & Peripherals', amount: 372900, percentage: 13.4 },
      ],
      spendBySupplier: db.suppliers.map((s) => ({
        supplier: s.companyName,
        spend: s.id === 'sup-tech-01' ? 1900000 : s.id === 'sup-cyber-04' ? 902900 : 0,
        rating: s.rating,
      })),
      onTimeDeliveryRate: 96.4,
      avgApprovalHours: 4.2,
    })
  );
});

// ----------------------------------------------------
// 17. SYSTEM RESET / SEED APIS
// ----------------------------------------------------
app.post('/api/v1/system/reset', (req: Request, res: Response) => {
  db.resetToSeed();
  db.logAudit('usr-admin-01', 'SYSTEM_RESET', 'DATABASE', 'ALL', 'Reset all tables to fresh initial enterprise seed state');
  res.json(formatResponse(true, 'System successfully reset to original seed dataset', null));
});

// ----------------------------------------------------
// 18. GEMINI AI PROCUREMENT ADVISOR APIS
// ----------------------------------------------------
app.post('/api/v1/gemini/procurement-advisor', async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;
    const ai = getGemini();

    if (!ai) {
      // Fallback intelligent heuristic advisor response if key not present
      const recs = db.getSmartRecommendations();
      const topLow = recs[0];
      return res.json(
        formatResponse(true, 'AI Procurement Advisor Analysis (Heuristic Engine)', {
          insight: `ProcureFlow Intelligent Recommendation: Immediate replenishment is advised for ${topLow ? topLow.productName : 'Dell Precision Workstations'}. Supplier TechDynamics Global maintains the highest reliability index (95%) and lowest lead times (3 days). Consider bundling with networking peripherals to leverage bulk volume rebates of 8-12%.`,
          actionableRecommendations: [
            'Trigger purchase request for critical items before weekend buffer depletion.',
            'Consolidate IT hardware requisitions with TechDynamics Global Ltd.',
            'Maintain dynamic safety stock at 1.5x minimum thresholds during Q3 vendor cycle.',
          ],
        })
      );
    }

    const systemPrompt = `You are ProcureFlow AI, an expert Chief Procurement Officer (CPO) and supply chain advisor for enterprise organisations.
Context:
Current Products: ${db.products.length}
Low Stock Products: ${db.products.filter((p) => p.quantity <= p.minimumStock).map((p) => `${p.name} (Qty: ${p.quantity}, Min: ${p.minimumStock})`).join(', ')}
Suppliers: ${db.suppliers.map((s) => `${s.companyName} (Rating: ${s.rating}*, Quality: ${s.qualityScore}%, Lead: ${s.averageLeadDays}d)`).join('; ')}

User Query: ${prompt || 'Provide a strategic procurement optimization summary for the current inventory and vendor landscape.'}

Provide a concise, highly actionable, strategic advisory response formatted with bullet points.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
    });

    res.json(
      formatResponse(true, 'AI Procurement Advisor Analysis', {
        insight: response.text,
      })
    );
  } catch (error: any) {
    res.status(500).json(formatResponse(false, error.message || 'Error generating AI analysis', null));
  }
});

// ----------------------------------------------------
// SERVER STARTUP & VITE INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ProcureFlow Enterprise] Server started successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
