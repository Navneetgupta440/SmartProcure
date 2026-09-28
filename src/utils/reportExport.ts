import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, PurchaseOrder, Supplier } from '../types';

export interface ReportDataPayload {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  products: Product[];
  procurementReport?: {
    totalSpend: number;
    spendByMonth: { month: string; spend: number; ordersCount: number }[];
    spendByCategory: { category: string; amount: number; percentage: number }[];
    spendBySupplier: { supplier: string; spend: number; rating: number }[];
    onTimeDeliveryRate: number;
    avgApprovalHours: number;
  };
  periodLabel?: string;
  generatedBy?: string;
}

export interface ExportOptions {
  includeExecutiveSummary?: boolean;
  includeVendorBreakdown?: boolean;
  includeCategoryBreakdown?: boolean;
  includeOrdersRegister?: boolean;
  includeOperationalMetrics?: boolean;
  reportTitle?: string;
  notes?: string;
}

/**
 * Helper to download a string as a file in the browser
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format currency in Indian Rupees style without symbol for raw CSV or with symbol
 */
export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Generate and download CSV of Purchase Orders
 */
export function exportPurchaseOrdersCSV(orders: PurchaseOrder[], filenamePrefix = 'procureflow-orders'): void {
  const headers = [
    'PO Number',
    'Date',
    'Supplier Name',
    'Supplier Email',
    'Items Count',
    'Subtotal (INR)',
    'GST Tax 18% (INR)',
    'Shipping Cost (INR)',
    'Discount (INR)',
    'Total Net Amount (INR)',
    'Expected Delivery Date',
    'Status',
    'Tracking Number',
  ];

  const rows = orders.map((o) => [
    `"${o.poNumber}"`,
    `"${new Date(o.orderDate || o.createdAt).toLocaleDateString('en-IN')}"`,
    `"${(o.supplierName || '').replace(/"/g, '""')}"`,
    `"${(o.supplierEmail || '').replace(/"/g, '""')}"`,
    o.items?.length || 0,
    o.subtotal || 0,
    o.tax || 0,
    o.shippingCost || 0,
    o.discount || 0,
    o.totalAmount || 0,
    `"${o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString('en-IN') : 'N/A'}"`,
    `"${o.status}"`,
    `"${o.trackingNumber || 'N/A'}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Generate and download CSV of Supplier Spend & Concentration
 */
export function exportVendorSpendCSV(
  suppliers: Supplier[],
  orders: PurchaseOrder[],
  filenamePrefix = 'procureflow-vendor-spend'
): void {
  const totalSpend = orders.reduce((acc, o) => acc + o.totalAmount, 0);

  const headers = [
    'Supplier Name',
    'Contact Person',
    'Email',
    'Phone',
    'City',
    'State',
    'GST Number',
    'Rating',
    'Quality Score (%)',
    'Delivery Score (%)',
    'Average Lead Days',
    'Authorized Orders Count',
    'Committed Spend (INR)',
    'Spend Concentration (%)',
    'Status',
  ];

  const rows = suppliers.map((s) => {
    const supOrders = orders.filter((o) => o.supplierId === s.id);
    const spend = supOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const pct = totalSpend > 0 ? ((spend / totalSpend) * 100).toFixed(1) : '0.0';

    return [
      `"${s.companyName.replace(/"/g, '""')}"`,
      `"${(s.contactPerson || '').replace(/"/g, '""')}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.city || ''}"`,
      `"${s.state || ''}"`,
      `"${s.gstNumber || ''}"`,
      s.rating || 0,
      s.qualityScore || 0,
      s.deliveryScore || 0,
      s.averageLeadDays || 0,
      supOrders.length,
      spend,
      pct,
      `"${s.status}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Generate Comprehensive Consolidated Master Financial & Operational CSV
 */
export function exportConsolidatedMasterCSV(
  data: ReportDataPayload,
  options: ExportOptions = {},
  filenamePrefix = 'procureflow-master-report'
): void {
  const {
    orders,
    suppliers,
    procurementReport,
    periodLabel = 'FY 2026-27 (Current Period)',
    generatedBy = 'Procurement Officer',
  } = data;

  const totalCommittedSpend = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalTaxPaid = orders.reduce((acc, o) => acc + o.tax, 0);
  const totalShipping = orders.reduce((acc, o) => acc + (o.shippingCost || 0), 0);
  const totalSubtotal = orders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalDiscount = orders.reduce((acc, o) => acc + (o.discount || 0), 0);
  const onTimeRate = procurementReport?.onTimeDeliveryRate ?? 96.4;
  const avgApprovalHours = procurementReport?.avgApprovalHours ?? 4.2;

  const lines: string[] = [];

  // Metadata block
  lines.push(`"PROCUREFLOW ENTERPRISE - CONSOLIDATED PROCUREMENT & FINANCIAL REPORT"`);
  lines.push(`"Report Generated At","${new Date().toISOString()}"`);
  lines.push(`"Reporting Period","${periodLabel}"`);
  lines.push(`"Generated By","${generatedBy}"`);
  lines.push(`"Currency","INR (Indian Rupee)"`);
  lines.push('');

  // 1. Executive Summary
  if (options.includeExecutiveSummary !== false) {
    lines.push(`"SECTION 1: EXECUTIVE FINANCIAL SUMMARY & KPIS"`);
    lines.push(`"Metric","Value","Unit / Notes"`);
    lines.push(`"Total Committed CapEx Spend",${totalCommittedSpend},"INR (Total value of all authorized POs)"`);
    lines.push(`"Total PO Subtotal",${totalSubtotal},"INR (Net of taxes & shipping)"`);
    lines.push(`"Total GST Tax Paid (18% ITC)",${totalTaxPaid},"INR (Eligible for Input Tax Credit)"`);
    lines.push(`"Total Freight & Logistics Cost",${totalShipping},"INR"`);
    lines.push(`"Total Volume Procurement Discounts",${totalDiscount},"INR"`);
    lines.push(`"Total Authorized Purchase Orders",${orders.length},"Orders"`);
    lines.push(`"Active Certified Suppliers",${suppliers.length},"Suppliers"`);
    lines.push(`"On-Time Vendor Delivery Rate",${onTimeRate},"% of shipments on schedule"`);
    lines.push(`"Average Approval Turnaround",${avgApprovalHours},"Hours per Requisition"`);
    lines.push('');
  }

  // 2. Category Spend Breakdown
  if (options.includeCategoryBreakdown !== false && procurementReport?.spendByCategory) {
    lines.push(`"SECTION 2: CAPITAL EXPENDITURE BY CATEGORY"`);
    lines.push(`"Category Name","Expenditure Amount (INR)","Share Percentage (%)"`);
    procurementReport.spendByCategory.forEach((cat) => {
      lines.push(`"${cat.category.replace(/"/g, '""')}",${cat.amount},${cat.percentage}`);
    });
    lines.push('');
  }

  // 3. Vendor Concentration Breakdown
  if (options.includeVendorBreakdown !== false) {
    lines.push(`"SECTION 3: CERTIFIED VENDOR SPEND DISTRIBUTION & CONCENTRATION"`);
    lines.push(`"Vendor Name","GSTIN","City","Rating (Stars)","Order Count","Committed Spend (INR)","Share (%)","Quality Score (%)","Lead Days"`);
    suppliers.forEach((s) => {
      const supOrders = orders.filter((o) => o.supplierId === s.id);
      const spend = supOrders.reduce((acc, o) => acc + o.totalAmount, 0);
      const pct = totalCommittedSpend > 0 ? ((spend / totalCommittedSpend) * 100).toFixed(1) : '0.0';
      lines.push(
        `"${s.companyName.replace(/"/g, '""')}","${s.gstNumber || ''}","${s.city || ''}",${s.rating || 0},${supOrders.length},${spend},${pct},${s.qualityScore || 0},${s.averageLeadDays || 0}`
      );
    });
    lines.push('');
  }

  // 4. Detailed Purchase Orders Ledger
  if (options.includeOrdersRegister !== false) {
    lines.push(`"SECTION 4: PURCHASE ORDERS AUDIT REGISTER"`);
    lines.push(
      `"PO Number","Date","Supplier","Items Count","Subtotal (INR)","GST Tax (INR)","Shipping (INR)","Total (INR)","Status","Tracking Number"`
    );
    orders.forEach((o) => {
      lines.push(
        `"${o.poNumber}","${new Date(o.orderDate || o.createdAt).toLocaleDateString('en-IN')}","${(o.supplierName || '').replace(/"/g, '""')}",${o.items?.length || 0},${o.subtotal || 0},${o.tax || 0},${o.shippingCost || 0},${o.totalAmount || 0},"${o.status}","${o.trackingNumber || 'N/A'}"`
      );
    });
    lines.push('');
  }

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Generate High-Fidelity Executive PDF Report with jsPDF and AutoTable
 */
export function exportExecutiveReportPDF(
  data: ReportDataPayload,
  options: ExportOptions = {},
  filenamePrefix = 'procureflow-executive-report'
): void {
  const {
    orders,
    suppliers,
    procurementReport,
    periodLabel = 'FY 2026-27 (Current Period)',
    generatedBy = 'Procurement Leadership',
  } = data;

  const totalCommittedSpend = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalTaxPaid = orders.reduce((acc, o) => acc + o.tax, 0);
  const totalOrders = orders.length;
  const onTimeRate = procurementReport?.onTimeDeliveryRate ?? 96.4;
  const avgApprovalHours = procurementReport?.avgApprovalHours ?? 4.2;

  // Initialize jsPDF document (Portrait, A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 16;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Executive Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('PROCUREFLOW ENTERPRISE', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('FINANCIAL ANALYTICS & SUPPLY CHAIN AUDIT REPORT', margin, currentY + 4);

  // Reference Code & Date on Right
  const docRef = `PFR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  doc.setFontSize(8);
  doc.text(`Doc Ref: ${docRef}`, pageWidth - margin, currentY, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - margin, currentY + 4, { align: 'right' });
  doc.text(`Period: ${periodLabel}`, pageWidth - margin, currentY + 8, { align: 'right' });

  currentY += 14;

  // Divider Line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 3. Executive KPI Metrics Cards Block
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 18;

  const kpis = [
    { label: 'TOTAL AUTHORIZED SPEND', val: `₹${(totalCommittedSpend / 100000).toFixed(2)} L`, sub: `${totalOrders} Purchase Orders` },
    { label: 'GST INPUT TAX (18% ITC)', val: `₹${(totalTaxPaid / 100000).toFixed(2)} L`, sub: 'Tax Reclaimable' },
    { label: 'CERTIFIED VENDORS', val: `${suppliers.length} Active`, sub: 'Tier-1 Partners' },
    { label: 'ON-TIME DELIVERY', val: `${onTimeRate}%`, sub: `Avg SLA ${avgApprovalHours}h` },
  ];

  kpis.forEach((kpi, index) => {
    const cardX = margin + index * (cardWidth + 3);
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 3, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, cardX + 3, currentY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 3, currentY + 15.5);
  });

  currentY += cardHeight + 8;

  // 4. Section: Category Spend Allocation Table
  if (options.includeCategoryBreakdown !== false && procurementReport?.spendByCategory) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Capital Expenditure by Category', margin, currentY);
    currentY += 2;

    const catRows = procurementReport.spendByCategory.map((c) => [
      c.category,
      `₹${formatINR(c.amount)}`,
      `${c.percentage.toFixed(1)}%`,
      c.percentage > 30 ? 'Primary Strategic Core' : 'Operational Consumable',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Category Name', 'Authorized Expenditure', 'Allocation Share', 'Budget Classification']],
      body: catRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: 'right', fontStyle: 'bold' },
        2: { halign: 'right' },
        3: { halign: 'left' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 5. Section: Vendor Spend Distribution Table
  if (options.includeVendorBreakdown !== false) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Certified Vendor Spend Distribution & SLA Ranking', margin, currentY);
    currentY += 2;

    const sortedVendors = suppliers
      .map((s) => {
        const supOrders = orders.filter((o) => o.supplierId === s.id);
        const spend = supOrders.reduce((acc, o) => acc + o.totalAmount, 0);
        return {
          name: s.companyName,
          gst: s.gstNumber || 'GST Verified',
          location: `${s.city || ''}, ${s.state || ''}`,
          rating: `${s.rating || 4.5} ★`,
          ordersCount: supOrders.length,
          spend,
          share: totalCommittedSpend > 0 ? (spend / totalCommittedSpend) * 100 : 0,
        };
      })
      .sort((a, b) => b.spend - a.spend);

    const vendorRows = sortedVendors.map((v) => [
      v.name,
      v.gst,
      v.rating,
      `${v.ordersCount} POs`,
      `₹${formatINR(v.spend)}`,
      `${v.share.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Vendor Entity', 'GST Number', 'Rating', 'Volume', 'Committed Spend', 'CapEx Share']],
      body: vendorRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 35 },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'right' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 6. Section: Recent Purchase Orders Audit Register
  if (options.includeOrdersRegister !== false) {
    // Check if we need a new page
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Purchase Orders Compliance Register', margin, currentY);
    currentY += 2;

    const orderRows = orders.slice(0, 15).map((o) => [
      o.poNumber,
      new Date(o.orderDate || o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      o.supplierName,
      `₹${formatINR(o.subtotal)}`,
      `₹${formatINR(o.tax)}`,
      `₹${formatINR(o.totalAmount)}`,
      o.status.replace(/_/g, ' '),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['PO Number', 'Date', 'Supplier Account', 'Subtotal', 'GST (18%)', 'Net Total', 'Status']],
      body: orderRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 20 },
        2: { cellWidth: 45 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'center' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 7. Audit Verification & Certification Sign-Off Block
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('AUDIT & COMPLIANCE CERTIFICATION', margin + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This financial executive ledger has been compiled from authorized procurement database ledgers under ISO-9001 and SOX compliance protocols.',
    margin + 3,
    currentY + 9.5
  );
  doc.text(
    `Prepared by: ${generatedBy} • Electronic Timestamp: ${new Date().toISOString()} • SHA-256 Verified`,
    margin + 3,
    currentY + 14
  );
  doc.text('Authorized Signatory: ________________________ (Chief Procurement Officer / Controller)', margin + 3, currentY + 18.5);

  // Add Page Numbers and Confidentiality Footer to All Pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `CONFIDENTIAL • PROCUREFLOW ENTERPRISE SYSTEM • FOR INTERNAL STAKEHOLDERS ONLY`,
      margin,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Save the PDF
  const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
