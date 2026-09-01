import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../api/client';
import { Category, Supplier, BulkImportRow, BulkImportResult } from '../../types';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Download,
  Copy,
  Table,
  Layers,
  Search,
  Check,
  X,
  Play,
  Pause,
  Sliders,
  Database,
  Building2,
  Tag,
  Boxes,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
  Zap,
} from 'lucide-react';

interface BulkProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted: () => void;
  categories: Category[];
  suppliers: Supplier[];
}

// Target Schema Fields for Mapping
interface TargetFieldDef {
  key: string;
  label: string;
  required?: boolean;
  description: string;
  aliases: string[];
  type: 'string' | 'number' | 'boolean' | 'array';
  defaultValue?: any;
}

const TARGET_FIELDS: TargetFieldDef[] = [
  {
    key: 'name',
    label: 'Product Name',
    required: true,
    description: 'The title/name of the hardware or supply item',
    aliases: ['name', 'product_name', 'productname', 'title', 'item_name', 'item', 'description_short'],
    type: 'string',
  },
  {
    key: 'unitPrice',
    label: 'Unit Price (₹)',
    required: true,
    description: 'Procurement cost per unit in INR',
    aliases: ['unitprice', 'price', 'unit_price', 'cost', 'rate', 'procurement_cost', 'amount'],
    type: 'number',
  },
  {
    key: 'productCode',
    label: 'SKU / Product Code',
    required: false,
    description: 'Unique SKU identifier (auto-generated if empty)',
    aliases: ['productcode', 'product_code', 'sku', 'item_code', 'part_number', 'code', 'barcode'],
    type: 'string',
  },
  {
    key: 'brand',
    label: 'Brand / Manufacturer',
    required: false,
    description: 'Brand name (e.g. Apple, Dell, Cisco)',
    aliases: ['brand', 'manufacturer', 'make', 'oem', 'vendor_brand'],
    type: 'string',
  },
  {
    key: 'categoryName',
    label: 'Category',
    required: false,
    description: 'Category name or code (e.g. Laptops, Displays)',
    aliases: ['category', 'categoryname', 'category_name', 'cat', 'department', 'type', 'group'],
    type: 'string',
  },
  {
    key: 'supplierName',
    label: 'Supplier / Vendor',
    required: false,
    description: 'Assigned vendor company name',
    aliases: ['supplier', 'suppliername', 'supplier_name', 'vendor', 'vendor_name', 'distributor'],
    type: 'string',
  },
  {
    key: 'mrpPrice',
    label: 'MRP / Retail Price (₹)',
    required: false,
    description: 'Original list price before discount',
    aliases: ['mrp', 'mrpprice', 'mrp_price', 'list_price', 'retail_price', 'original_price'],
    type: 'number',
  },
  {
    key: 'quantity',
    label: 'Initial Stock Quantity',
    required: false,
    description: 'Current physical inventory quantity',
    aliases: ['quantity', 'qty', 'stock', 'initial_stock', 'count', 'on_hand', 'units_in_stock'],
    type: 'number',
    defaultValue: 15,
  },
  {
    key: 'minimumStock',
    label: 'Min Stock Buffer',
    required: false,
    description: 'Safety threshold before low-stock alerts',
    aliases: ['minimumstock', 'min_stock', 'minstock', 'reorder_level', 'safety_stock', 'buffer'],
    type: 'number',
    defaultValue: 5,
  },
  {
    key: 'unit',
    label: 'Unit of Measure',
    required: false,
    description: 'e.g. Units, Pieces, Packs, Sets',
    aliases: ['unit', 'uom', 'unit_of_measure', 'measurement'],
    type: 'string',
    defaultValue: 'Units',
  },
  {
    key: 'warehouseLocation',
    label: 'Warehouse Location',
    required: false,
    description: 'Physical aisle or rack location',
    aliases: ['warehouse', 'warehouselocation', 'warehouse_location', 'location', 'bin', 'rack', 'bay'],
    type: 'string',
    defaultValue: 'Central Warehouse Bay 01',
  },
  {
    key: 'imageUrl',
    label: 'Image URL',
    required: false,
    description: 'Direct link to high-res product photo',
    aliases: ['image', 'imageurl', 'image_url', 'photo', 'picture', 'thumbnail', 'asset_url'],
    type: 'string',
  },
  {
    key: 'isFlipkartAssured',
    label: 'Flipkart Assured (Yes/No)',
    required: false,
    description: 'Flag for certified OEM guarantee',
    aliases: ['flipkartassured', 'isflipkartassured', 'assured', 'f_assured', 'certified'],
    type: 'boolean',
    defaultValue: true,
  },
  {
    key: 'highlights',
    label: 'Highlights (Multiline / Bullets)',
    required: false,
    description: 'Key feature bullet points (separated by semicolon or pipe)',
    aliases: ['highlights', 'features', 'bullet_points', 'key_highlights', 'specs_summary'],
    type: 'array',
  },
  {
    key: 'description',
    label: 'Full Description',
    required: false,
    description: 'Detailed specifications and scope',
    aliases: ['description', 'desc', 'details', 'long_description', 'notes', 'specifications'],
    type: 'string',
  },
];

// Sample CSV Data for instant testing
const SAMPLE_CSV_DATA = `SKU,Product Name,Brand,Category,Supplier,Price,MRP,Stock Quantity,Min Buffer,Unit,Warehouse Bay,Flipkart Assured,Highlights,Image URL
PRD-LAP-M3P,Apple MacBook Pro 16 M3 Max 64GB 2TB,Apple,Laptops & Mobile Workstations,TechDynamics Enterprises,349900,389900,18,5,Units,Warehouse Bay 1 - Secure,TRUE,Apple M3 Max 16-core CPU;64GB Unified Memory;Liquid Retina XDR Display;3-Year AppleCare+,https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80
PRD-LAP-X1C,Lenovo ThinkPad X1 Carbon Gen 12,Lenovo,Laptops & Mobile Workstations,TechDynamics Enterprises,168500,195000,25,6,Units,Warehouse Bay 1 - Zone B,TRUE,Intel Core Ultra 7 155H;32GB LPDDR5X;OLED 2.8K 120Hz;Mil-SPEC 810H Tested,https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=80
PRD-DISP-5K,LG 34-Inch UltraWide 5K2K Nano IPS,LG,Displays & Peripherals,Apex Office Solutions,112000,135000,14,4,Units,Warehouse Bay 2 - Fragile,TRUE,5120x2160 Resolution;Thunderbolt 4 96W PD;98% DCI-P3 Color Calibrated,https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80
PRD-DISP-DELL32,Dell UltraSharp 32 4K USB-C Hub Monitor,Dell,Displays & Peripherals,TechDynamics Enterprises,82500,98000,30,8,Units,Warehouse Bay 2 - Aisle 3,TRUE,IPS Black 2000:1 Contrast;RJ45 LAN Pass-through;Auto KVM Switch,https://images.unsplash.com/photo-1547119957-637f8679db1e?w=500&auto=format&fit=crop&q=80
PRD-SRV-R760,Dell PowerEdge R760 2U Dual Xeon 128GB,Dell,Servers & Enterprise Storage,CloudCore Networks,645000,720000,6,2,Units,Data Center Staging Bay,TRUE,Dual Intel Xeon Gold 6430;128GB DDR5 ECC;8x 1.92TB NVMe SSD;iDRAC9 Enterprise,https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80
PRD-SRV-HPE380,HPE ProLiant DL380 Gen11 64-Core,HPE,Servers & Enterprise Storage,CloudCore Networks,580000,650000,8,2,Units,Data Center Staging Bay,TRUE,AMD EPYC 9354 32C/64T;256GB RAM;Redundant 1600W Titanium PSU;HPE iLO 6,https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=80
PRD-NET-C9300,Cisco Catalyst 9300 48-Port PoE+ Switch,Cisco,Networking & Infrastructure,CloudCore Networks,385000,430000,12,3,Units,Networking Rack Bay 4,TRUE,48 Gigabit Ethernet PoE+;Modular Uplinks 40G;DNA Premier License;StackWise-480,https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80
PRD-NET-FORTI,Fortinet FortiGate 100F Next-Gen Firewall,Fortinet,Networking & Infrastructure,CloudCore Networks,265000,310000,10,3,Units,Networking Rack Bay 4,TRUE,1 Gbps Threat Protection;Dual SFP+ 10GE;Enterprise Security Bundle;Zero Trust Ready,https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=80
PRD-FURN-AERON,Herman Miller Aeron Ergonomic Chair (Size B),Herman Miller,Ergonomic Office Furniture,Apex Office Solutions,118000,142000,20,5,Units,Furniture Warehouse 1,TRUE,8Z Pellicle Elastomeric Mesh;PostureFit SL Lumbar;Fully Adjustable Armrests;12-Year Warranty,https://images.unsplash.com/photo-1580481077194-4d8721c0eb0c?w=500&auto=format&fit=crop&q=80
PRD-FURN-DESK,Steelcase Migration SE Pro Electric Standing Desk,Steelcase,Ergonomic Office Furniture,Apex Office Solutions,64000,78000,15,4,Units,Furniture Warehouse 2,TRUE,Dual Motor High Stability;1600x800mm Anti-Glare Top;Collision Detection;Digital Memory,https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=500&auto=format&fit=crop&q=80
PRD-CONF-RALLY,Logitech Rally Plus Ultra-HD Modular AV System,Logitech,Smart Meeting Rooms & AV,Global Supplies Hub,245000,285000,8,2,Units,AV Equipment Bay 3,TRUE,RightSense AI Automation;Dual Ultra-HD 4K Speakers;Modular Mic Pod Array;Zoom/Teams Certified,https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&auto=format&fit=crop&q=80
PRD-PWR-APC10K,APC Smart-UPS On-Line 10kVA 230V Rack/Tower,APC by Schneider,Power, Server UPS & Cooling,CloudCore Networks,420000,480000,5,2,Units,Power Equipment Bay,TRUE,Double Conversion Online Topology;Pure Sine Wave;Network Management Card 3;Extended Battery Packs,https://images.unsplash.com/photo-1597733336794-12d05021d510?w=500&auto=format&fit=crop&q=80
PRD-SEC-AXIS,Axis Q3538-LVE 4K Dome Security Camera,Axis Communications,Safety, Security & Facility Supplies,Global Supplies Hub,89000,105000,16,4,Units,Facility Security Bay,TRUE,4K UHD at 60fps;Deep Learning Analytics;OptimizedIR 40m;IK10+ Vandal Resistant,https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&auto=format&fit=crop&q=80
PRD-STAT-BULK,3M Scotch Heavy Duty Packaging Tape (Box of 36),3M,General Office Supplies & Stationery,Global Supplies Hub,4800,5800,120,25,Packs,Stationery Depot Bay A,TRUE,Commercial Solvent-Free Adhesive;Resists Splitting and Tearing;Meets Postal Regulations,https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80
PRD-MOB-IP15PM,Apple iPhone 15 Pro Max 256GB Corporate Fleet,Apple,Laptops & Mobile Workstations,TechDynamics Enterprises,149900,159900,30,8,Units,Warehouse Bay 1 - Secure,TRUE,A17 Pro Bionic;Titanium Frame;MDM Corporate Enrollment Ready;5G Ultra Wideband,https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80`;

export const BulkProductImportModal: React.FC<BulkProductImportModalProps> = ({
  isOpen,
  onClose,
  onImportCompleted,
  categories,
  suppliers,
}) => {
  if (!isOpen) return null;

  // Step 1: Upload & Source, Step 2: Column Mapping, Step 3: Validation & Preview, Step 4: Batch Progress, Step 5: Completed
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Raw Input
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string>('');
  const [inputTab, setInputTab] = useState<'upload' | 'paste' | 'sample'>('upload');
  const [isDragOver, setIsDragOver] = useState(false);

  // Parsed Headers & Rows
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // targetKey -> sourceHeader

  // Import Options
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [defaultCategoryId, setDefaultCategoryId] = useState(categories[0]?.id || '');
  const [defaultSupplierId, setDefaultSupplierId] = useState(suppliers[0]?.id || '');
  const [batchChunkSize, setBatchChunkSize] = useState<number>(5);

  // Validation States
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR'>('ALL');
  const [previewSearch, setPreviewSearch] = useState('');

  // Execution & Progress States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);

  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [currentBatchNum, setCurrentBatchNum] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [processingSpeed, setProcessingSpeed] = useState(0); // items / sec
  const [logs, setLogs] = useState<{ id: string; type: 'info' | 'success' | 'warning' | 'error'; message: string; timestamp: string }[]>([]);

  // Final Results
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Timer for elapsed seconds
  useEffect(() => {
    let timer: any;
    if (isProcessing && !isPaused && startTime) {
      timer = setInterval(() => {
        const sec = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(sec);
        if (sec > 0 && processedCount > 0) {
          setProcessingSpeed(Number((processedCount / sec).toFixed(1)));
        }
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isProcessing, isPaused, startTime, processedCount]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type, message, timestamp: timeStr },
    ]);
  };

  // Helper to parse CSV or TSV string into headers and rows
  const parseDelimitedText = (text: string) => {
    const clean = text.trim();
    if (!clean) return { headers: [], rows: [] };

    // Try parsing as JSON first
    if (clean.startsWith('[') && clean.endsWith(']')) {
      try {
        const jsonArr = JSON.parse(clean);
        if (Array.isArray(jsonArr) && jsonArr.length > 0 && typeof jsonArr[0] === 'object') {
          const discoveredHeaders = Array.from(
            new Set(jsonArr.flatMap((obj) => Object.keys(obj)))
          );
          const rows = jsonArr.map((obj) => {
            const row: Record<string, string> = {};
            discoveredHeaders.forEach((h) => {
              row[h] = obj[h] !== undefined && obj[h] !== null ? String(obj[h]) : '';
            });
            return row;
          });
          return { headers: discoveredHeaders, rows };
        }
      } catch (e) {
        // Fallback to CSV
      }
    }

    // Determine delimiter (comma, tab, or semicolon)
    const firstLine = clean.split('\n')[0] || '';
    let delimiter = ',';
    if (firstLine.includes('\t') && firstLine.split('\t').length > firstLine.split(',').length) {
      delimiter = '\t';
    } else if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
      delimiter = ';';
    }

    // Split rows with regex to handle quotes
    const lines = clean.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuote && line[i + 1] === char) {
            cur += char;
            i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (char === delimiter && !inQuote) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const parsedHeaders = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());
    const parsedDataRows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]).map((v) => v.replace(/^["']|["']$/g, '').trim());
      if (values.every((v) => v === '')) continue; // skip empty line
      const rowObj: Record<string, string> = {};
      parsedHeaders.forEach((h, index) => {
        rowObj[h] = values[index] !== undefined ? values[index] : '';
      });
      parsedDataRows.push(rowObj);
    }

    return { headers: parsedHeaders, rows: parsedDataRows };
  };

  // Handle Loading Data into parser and creating initial mapping
  const processRawData = (text: string, srcFileName = 'pasted-data.csv') => {
    const { headers: h, rows: r } = parseDelimitedText(text);
    if (h.length === 0 || r.length === 0) {
      alert('Could not parse any valid product rows. Please check data format.');
      return;
    }

    setHeaders(h);
    setParsedRows(r);
    setFileName(srcFileName);

    // Auto generate mapping
    const mapping: Record<string, string> = {};

    TARGET_FIELDS.forEach((target) => {
      // Find matching header by exact name or aliases
      const match = h.find((header) => {
        const normHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        return target.aliases.some((alias) => {
          const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normHeader === normAlias || normHeader.includes(normAlias);
        });
      });

      if (match) {
        mapping[target.key] = match;
      } else {
        mapping[target.key] = '';
      }
    });

    setColumnMapping(mapping);
    setCurrentStep(2); // Proceed to Mapping Step
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      processRawData(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_DATA], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'procureflow_enterprise_product_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert mapped row to validated BulkImportRow
  const mapRowToProduct = (rawRow: Record<string, string>, index: number) => {
    const getValue = (targetKey: string) => {
      const mappedHeader = columnMapping[targetKey];
      if (mappedHeader && rawRow[mappedHeader] !== undefined) {
        return rawRow[mappedHeader];
      }
      const targetDef = TARGET_FIELDS.find((f) => f.key === targetKey);
      return targetDef?.defaultValue !== undefined ? String(targetDef.defaultValue) : '';
    };

    const name = getValue('name');
    const rawPrice = getValue('unitPrice').replace(/[^0-9.]/g, '');
    const unitPrice = Number(rawPrice);

    const productCode = getValue('productCode') || `PRD-BLK-${index + 1001}`;
    const brand = getValue('brand') || 'Enterprise OEM';
    const categoryName = getValue('categoryName') || '';
    const supplierName = getValue('supplierName') || '';

    const rawMrp = getValue('mrpPrice').replace(/[^0-9.]/g, '');
    const mrpPrice = Number(rawMrp) || Math.round(unitPrice * 1.25);

    const rawQty = getValue('quantity').replace(/[^0-9.]/g, '');
    const quantity = !isNaN(Number(rawQty)) && rawQty !== '' ? Number(rawQty) : 15;

    const rawMin = getValue('minimumStock').replace(/[^0-9.]/g, '');
    const minimumStock = !isNaN(Number(rawMin)) && rawMin !== '' ? Number(rawMin) : 5;

    const unit = getValue('unit') || 'Units';
    const warehouseLocation = getValue('warehouseLocation') || 'Central Warehouse Bay 01';
    const imageUrl = getValue('imageUrl') || '';
    const rawAssured = getValue('isFlipkartAssured').toLowerCase();
    const isFlipkartAssured = rawAssured === 'true' || rawAssured === 'yes' || rawAssured === '1' || rawAssured === '';

    const rawHighlights = getValue('highlights');
    const highlights = rawHighlights
      ? rawHighlights.split(/[\n;|]+/).map((s) => s.trim()).filter(Boolean)
      : [];

    const description = getValue('description') || `${name} imported via Bulk Catalog Sync.`;

    // Validation flags
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Missing required Product Name');
    }
    if (isNaN(unitPrice) || unitPrice <= 0) {
      errors.push('Invalid or missing Unit Price (₹)');
    }
    if (!categoryName && !defaultCategoryId) {
      warnings.push('Category unassigned (will use default category)');
    }
    if (!imageUrl) {
      warnings.push('No custom image URL (will use high-res OEM placeholder)');
    }

    const status: 'VALID' | 'WARNING' | 'ERROR' = errors.length > 0 ? 'ERROR' : warnings.length > 0 ? 'WARNING' : 'VALID';

    const mappedProduct: BulkImportRow = {
      productCode,
      name,
      brand,
      categoryName,
      categoryId: defaultCategoryId,
      supplierName,
      supplierId: defaultSupplierId,
      unitPrice,
      mrpPrice,
      quantity,
      minimumStock,
      unit,
      warehouseLocation,
      imageUrl,
      isFlipkartAssured,
      highlights,
      description,
    };

    return {
      index,
      rawRow,
      mappedProduct,
      status,
      errors,
      warnings,
    };
  };

  // Memoized transformed validated products
  const validatedItems = useMemo(() => {
    return parsedRows.map((row, idx) => mapRowToProduct(row, idx));
  }, [parsedRows, columnMapping, defaultCategoryId, defaultSupplierId]);

  // Statistics
  const stats = useMemo(() => {
    const validCount = validatedItems.filter((i) => i.status === 'VALID').length;
    const warningCount = validatedItems.filter((i) => i.status === 'WARNING').length;
    const errorCount = validatedItems.filter((i) => i.status === 'ERROR').length;
    return {
      total: validatedItems.length,
      valid: validCount,
      warning: warningCount,
      error: errorCount,
      readyToImport: validCount + warningCount,
    };
  }, [validatedItems]);

  // Filtered Preview Rows
  const filteredPreviewRows = useMemo(() => {
    let list = [...validatedItems];
    if (previewFilter !== 'ALL') {
      list = list.filter((i) => i.status === previewFilter);
    }
    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      list = list.filter(
        (i) =>
          i.mappedProduct.name.toLowerCase().includes(q) ||
          i.mappedProduct.productCode?.toLowerCase().includes(q) ||
          i.mappedProduct.brand?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [validatedItems, previewFilter, previewSearch]);

  // Execute Batch Import Process
  const startImportExecution = async () => {
    const itemsToImport = validatedItems
      .filter((i) => i.status !== 'ERROR')
      .map((i) => i.mappedProduct);

    if (itemsToImport.length === 0) {
      alert('No valid items available for import. Please fix required mapping errors.');
      return;
    }

    setCurrentStep(4); // Move to Progress Screen
    setIsProcessing(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;

    setProcessedCount(0);
    setTotalToProcess(itemsToImport.length);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setProcessingSpeed(0);
    setLogs([]);

    addLog('info', `🚀 Initializing Bulk Product Import Pipeline for ${itemsToImport.length} items...`);
    addLog('info', `Config: Batch Chunk Size = ${batchChunkSize}, Overwrite Existing SKUs = ${overwriteExisting ? 'YES' : 'NO'}`);

    // Break into chunks
    const chunks: BulkImportRow[][] = [];
    for (let i = 0; i < itemsToImport.length; i += batchChunkSize) {
      chunks.push(itemsToImport.slice(i, i + batchChunkSize));
    }
    setTotalBatches(chunks.length);

    const generatedBatchNum = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveFileName = fileName || (inputTab === 'sample' ? 'enterprise_hardware_sample_feed.csv' : (inputTab === 'paste' ? 'pasted_catalog_feed.tsv' : 'bulk_catalog_upload.csv'));
    const effectiveSourceType = inputTab === 'sample' ? 'SAMPLE_DATA' : (inputTab === 'paste' ? 'PASTE_DATA' : 'CSV_UPLOAD');

    let cumulativeCreated = 0;
    let cumulativeUpdated = 0;
    let cumulativeSkipped = 0;
    let cumulativeErrors = 0;
    const allErrors: { row: number; productCode?: string; name?: string; message: string }[] = [];
    const allCreatedProducts: any[] = [];
    const allUpdatedProducts: any[] = [];

    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      // Check cancellation
      if (isCancelledRef.current) {
        addLog('warning', '⚠️ Import cancelled by user.');
        break;
      }

      // Check pause
      while (isPausedRef.current) {
        await new Promise((r) => setTimeout(r, 400));
        if (isCancelledRef.current) break;
      }

      setCurrentBatchNum(cIdx + 1);
      const currentChunk = chunks[cIdx];
      const startItemIdx = cIdx * batchChunkSize;

      addLog(
        'info',
        `📦 Dispatching Batch ${cIdx + 1}/${chunks.length} (${currentChunk.length} SKUs: ${currentChunk[0]?.productCode || 'items'} to ${currentChunk[currentChunk.length - 1]?.productCode || ''})...`
      );

      try {
        const response = await api.bulkImportProducts({
          products: currentChunk,
          options: {
            batchNumber: generatedBatchNum,
            fileName: effectiveFileName,
            sourceType: effectiveSourceType,
            overwriteExisting,
            defaultCategoryId,
            defaultSupplierId,
          },
        });

        if (response.success && response.data) {
          const resData: BulkImportResult = response.data;
          cumulativeCreated += resData.createdCount;
          cumulativeUpdated += resData.updatedCount;
          cumulativeSkipped += resData.skippedCount;
          cumulativeErrors += resData.errorCount;

          if (resData.errors && resData.errors.length > 0) {
            allErrors.push(...resData.errors);
          }
          if (resData.createdProducts) {
            allCreatedProducts.push(...resData.createdProducts);
          }
          if (resData.updatedProducts) {
            allUpdatedProducts.push(...resData.updatedProducts);
          }

          addLog(
            'success',
            `✓ Batch ${cIdx + 1} processed: +${resData.createdCount} created, +${resData.updatedCount} updated, ${resData.errorCount} errors.`
          );
        } else {
          addLog('error', `❌ Batch ${cIdx + 1} failed: ${response.message}`);
          cumulativeErrors += currentChunk.length;
        }
      } catch (err: any) {
        addLog('error', `❌ Batch ${cIdx + 1} network error: ${err.message}`);
        cumulativeErrors += currentChunk.length;
      }

      // Update progress
      const doneSoFar = Math.min(itemsToImport.length, startItemIdx + currentChunk.length);
      setProcessedCount(doneSoFar);

      // Brief optical cadence between chunks for smooth UI perception
      await new Promise((r) => setTimeout(r, 200));
    }

    const finalSuccessRate = itemsToImport.length > 0
      ? Number((((cumulativeCreated + cumulativeUpdated) / itemsToImport.length) * 100).toFixed(1))
      : 100;

    const finalResult: BulkImportResult = {
      totalProcessed: itemsToImport.length,
      createdCount: cumulativeCreated,
      updatedCount: cumulativeUpdated,
      skippedCount: cumulativeSkipped,
      errorCount: cumulativeErrors,
      successRate: finalSuccessRate,
      batchNumber: generatedBatchNum,
      errors: allErrors,
      createdProducts: allCreatedProducts,
      updatedProducts: allUpdatedProducts,
    };

    setImportResult(finalResult);
    setIsProcessing(false);
    addLog('success', `🎉 Bulk import finished! Total: ${cumulativeCreated} created, ${cumulativeUpdated} updated.`);

    // Automatically transition to summary screen
    setTimeout(() => {
      setCurrentStep(5);
      onImportCompleted();
    }, 800);
  };

  const handleTogglePause = () => {
    isPausedRef.current = !isPaused;
    setIsPaused(!isPaused);
    if (!isPaused) {
      addLog('warning', '⏸️ Import execution paused.');
    } else {
      addLog('info', '▶️ Resuming import execution...');
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to stop the bulk import pipeline?')) {
      isCancelledRef.current = true;
      setIsProcessing(false);
    }
  };

  // Progress percentage calculation
  const progressPercent = totalToProcess > 0 ? Math.min(100, Math.round((processedCount / totalToProcess) * 100)) : 0;
  const estimatedSecondsLeft =
    processingSpeed > 0 && totalToProcess > processedCount
      ? Math.ceil((totalToProcess - processedCount) / processingSpeed)
      : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        id="bulk-product-import-modal"
        className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Bulk Product Metadata Importer</h2>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30 font-bold">
                  v2.4 Enterprise Batch Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Map, validate, and batch ingest enterprise catalog SKUs with real-time progress tracking
              </p>
            </div>
          </div>

          <button
            id="close-bulk-import-modal-btn"
            disabled={isProcessing}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-30 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Navigation Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between max-w-3xl mx-auto text-xs">
            {[
              { num: 1, label: 'Upload Data', icon: Upload },
              { num: 2, label: 'Map Metadata', icon: Sliders },
              { num: 3, label: 'Validate & Preview', icon: CheckCircle2 },
              { num: 4, label: 'Batch Ingestion', icon: Zap },
              { num: 5, label: 'Summary Report', icon: FileSpreadsheet },
            ].map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.num;
              const isDone = currentStep > step.num;

              return (
                <div key={step.num} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <span
                    className={`hidden sm:inline font-semibold ${
                      isActive ? 'text-blue-600' : isDone ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body with Step Views */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= STEP 1: UPLOAD & SOURCE SELECTION ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Tab Selector */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setInputTab('upload')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      inputTab === 'upload'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload CSV / JSON File</span>
                  </button>

                  <button
                    onClick={() => setInputTab('paste')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      inputTab === 'paste'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    <span>Paste Raw Text / Table</span>
                  </button>

                  <button
                    onClick={() => {
                      setInputTab('sample');
                      setRawText(SAMPLE_CSV_DATA);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      inputTab === 'sample'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-900" />
                    <span>Load 15 Sample SKUs</span>
                  </button>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV Template</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {inputTab === 'upload' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.json,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Drag and drop your Product Catalog CSV or JSON here
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Supports Comma-Separated Values (CSV), Tab-Separated (TSV), and JSON arrays. Max 5,000 SKUs per upload.
                  </p>
                  <button
                    type="button"
                    className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-xs"
                  >
                    Browse Local File
                  </button>
                </div>
              )}

              {/* Paste Raw Text */}
              {inputTab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Paste CSV, TSV or JSON Data (Header line required on row 1)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Auto-detects commas, tabs, and semicolon delimiters
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`SKU,Product Name,Brand,Category,Supplier,Price,MRP,Stock Quantity\nPRD-LAP-01,Dell Latitude 7440,Dell,Laptops,TechDynamics,125000,145000,20\nPRD-DISP-02,LG 27-Inch 4K UHD,LG,Displays,Apex Office Solutions,34000,42000,15`}
                    className="w-full p-3.5 text-xs font-mono rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      disabled={!rawText.trim()}
                      onClick={() => processRawData(rawText, 'pasted-text.csv')}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <span>Parse and Map Columns</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Load Sample Data Tab */}
              {inputTab === 'sample' && (
                <div className="space-y-4 bg-amber-50/50 p-6 rounded-2xl border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-950">
                        Pre-Configured Enterprise Hardware &amp; Supplies Dataset
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Contains 15 realistic enterprise SKUs across Laptops, 5K Displays, Rack Servers, Cisco Switches, Herman Miller Chairs, Axis Cameras, and APC UPS units ready for instant mapping and batch testing.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-700 leading-tight">
                    <pre>{SAMPLE_CSV_DATA}</pre>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => processRawData(SAMPLE_CSV_DATA, 'flipkart_enterprise_sample.csv')}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Load Sample &amp; Proceed to Mapping</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: METADATA & COLUMN MAPPING ================= */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50/80 border border-blue-200 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-blue-950">Column &amp; Field Mapping</h3>
                    <span className="text-[11px] font-mono font-bold bg-blue-200/80 text-blue-800 px-2 py-0.5 rounded">
                      {parsedRows.length} Rows Detected in {fileName}
                    </span>
                  </div>
                  <p className="text-xs text-blue-800 mt-0.5">
                    Match source data columns to ProcureFlow catalog schema properties. Mandatory fields are marked with (*).
                  </p>
                </div>

                <button
                  onClick={() => {
                    // Reset to auto mapping
                    const mapping: Record<string, string> = {};
                    TARGET_FIELDS.forEach((target) => {
                      const match = headers.find((h) => {
                        const normH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return target.aliases.some((a) => normH.includes(a.toLowerCase().replace(/[^a-z0-9]/g, '')));
                      });
                      mapping[target.key] = match || '';
                    });
                    setColumnMapping(mapping);
                  }}
                  className="px-3 py-1.5 bg-white text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-50 transition shrink-0"
                >
                  Reset Auto-Match
                </button>
              </div>

              {/* Mapping Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3 w-1/3">ProcureFlow Schema Field</th>
                      <th className="p-3 w-1/3">Source File Column ({headers.length} available)</th>
                      <th className="p-3 w-1/3">Sample Value (Row 1 Preview)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {TARGET_FIELDS.map((field) => {
                      const selectedSource = columnMapping[field.key] || '';
                      const sampleVal = selectedSource && parsedRows[0] ? parsedRows[0][selectedSource] : '';
                      const isMapped = Boolean(selectedSource);

                      return (
                        <tr
                          key={field.key}
                          className={`hover:bg-slate-50 transition ${
                            field.required && !isMapped ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="p-3 align-middle">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{field.label}</span>
                              {field.required && (
                                <span className="text-rose-600 font-black text-xs" title="Required Field">
                                  *
                                </span>
                              )}
                              {isMapped && (
                                <span className="p-0.5 text-emerald-600 bg-emerald-50 rounded">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{field.description}</div>
                          </td>

                          <td className="p-3 align-middle">
                            <select
                              value={selectedSource}
                              onChange={(e) =>
                                setColumnMapping({
                                  ...columnMapping,
                                  [field.key]: e.target.value,
                                })
                              }
                              className={`w-full p-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 bg-white ${
                                field.required && !isMapped
                                  ? 'border-rose-300 focus:ring-rose-200 text-rose-700'
                                  : isMapped
                                  ? 'border-emerald-300 text-slate-800'
                                  : 'border-slate-200 text-slate-500'
                              }`}
                            >
                              <option value="">-- Do Not Import / Unmapped --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3 align-middle">
                            {sampleVal ? (
                              <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 inline-block max-w-xs truncate">
                                {sampleVal}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-300 italic">
                                {field.defaultValue !== undefined ? `Default: ${field.defaultValue}` : 'No value'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Source Upload</span>
                </button>

                <button
                  disabled={!columnMapping['name'] || !columnMapping['unitPrice']}
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <span>Proceed to Validation &amp; Preview</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: VALIDATION & LIVE PREVIEW ================= */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Stat Banners */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="text-[11px] font-semibold text-slate-500">Total Rows</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valid Records</span>
                  </div>
                  <div className="text-xl font-black text-emerald-900 mt-0.5">{stats.valid}</div>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Warnings (Auto-fixed)</span>
                  </div>
                  <div className="text-xl font-black text-amber-950 mt-0.5">{stats.warning}</div>
                </div>

                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
                  <div className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Errors (Skipped)</span>
                  </div>
                  <div className="text-xl font-black text-rose-900 mt-0.5">{stats.error}</div>
                </div>
              </div>

              {/* Ingestion Settings Config Bar */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Batch Ingestion Rules &amp; Fallbacks</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Default Category Fallback
                    </label>
                    <select
                      value={defaultCategoryId}
                      onChange={(e) => setDefaultCategoryId(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Default Supplier Fallback
                    </label>
                    <select
                      value={defaultSupplierId}
                      onChange={(e) => setDefaultSupplierId(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.companyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Batch Chunk Size
                    </label>
                    <select
                      value={batchChunkSize}
                      onChange={(e) => setBatchChunkSize(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                    >
                      <option value={5}>5 items / batch (Smooth visual)</option>
                      <option value={10}>10 items / batch (Balanced)</option>
                      <option value={25}>25 items / batch (High throughput)</option>
                      <option value={50}>50 items / batch (Max speed)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overwriteExisting"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="overwriteExisting" className="text-xs font-semibold text-slate-700">
                    Overwrite existing products if matching SKU is already present in catalog
                  </label>
                </div>
              </div>

              {/* Live Preview Search & Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-500">Filter View:</span>
                  {(['ALL', 'VALID', 'WARNING', 'ERROR'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPreviewFilter(filter)}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                        previewFilter === filter
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search preview rows..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Live Preview Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-12">#</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">SKU Code</th>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5">Brand</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Unit Price (₹)</th>
                      <th className="p-2.5 text-center">Initial Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPreviewRows.map((item, idx) => {
                      const p = item.mappedProduct;
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-[11px] text-slate-400">{item.index + 1}</td>
                          <td className="p-2.5">
                            {item.status === 'VALID' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" /> Valid
                              </span>
                            )}
                            {item.status === 'WARNING' && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"
                                title={item.warnings.join(', ')}
                              >
                                <AlertTriangle className="w-3 h-3" /> Warning
                              </span>
                            )}
                            {item.status === 'ERROR' && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full"
                                title={item.errors.join(', ')}
                              >
                                <X className="w-3 h-3" /> Error
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{p.productCode}</td>
                          <td className="p-2.5 font-semibold text-slate-900 max-w-[200px] truncate" title={p.name}>
                            {p.name}
                          </td>
                          <td className="p-2.5 text-slate-600">{p.brand}</td>
                          <td className="p-2.5 text-slate-500">
                            {p.categoryName || categories.find((c) => c.id === defaultCategoryId)?.name}
                          </td>
                          <td className="p-2.5 text-right font-black text-slate-900">
                            ₹{p.unitPrice ? p.unitPrice.toLocaleString('en-IN') : '0'}
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-700">
                            {p.quantity} {p.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Adjust Column Mapping</span>
                </button>

                <button
                  disabled={stats.readyToImport === 0}
                  onClick={startImportExecution}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Batch Ingestion ({stats.readyToImport} SKUs)</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: BATCH IMPORT & PROGRESS STATUS BAR ================= */}
          {currentStep === 4 && (
            <div className="space-y-6 py-4 animate-in fade-in duration-150">
              {/* Big Progress Status Card */}
              <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl animate-pulse">
                      <RefreshCw className={`w-6 h-6 ${isProcessing && !isPaused ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Batch Ingestion In Progress</span>
                        {isPaused && (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                            PAUSED
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Batch {currentBatchNum} of {totalBatches} ({batchChunkSize} SKUs per chunk)
                      </p>
                    </div>
                  </div>

                  {/* Percentage Counter */}
                  <div className="text-right">
                    <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                      {progressPercent}%
                    </span>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {processedCount} of {totalToProcess} SKUs Processed
                    </div>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 h-full rounded-full transition-all duration-300 relative"
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] opacity-40"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>Elapsed: {elapsedSeconds}s</span>
                    </span>
                    <span>Speed: {processingSpeed} SKUs/sec</span>
                    <span>
                      Est. Remaining: {estimatedSecondsLeft > 0 ? `~${estimatedSecondsLeft}s` : 'Finishing...'}
                    </span>
                  </div>
                </div>

                {/* Execution Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTogglePause}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? 'Resume Import' : 'Pause'}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel Pipeline</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 italic">
                    ACID In-Memory Write with Audit Logging Active
                  </span>
                </div>
              </div>

              {/* Real-time Streaming Activity Log Console */}
              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                    <span className="font-bold text-white">Live Batch Ingestion Console</span>
                  </div>
                  <span>{logs.length} Log Entries</span>
                </div>

                <div
                  ref={logContainerRef}
                  className="max-h-48 overflow-y-auto space-y-1 text-[11px] scrollbar-none pr-1"
                >
                  {logs.map((log) => {
                    let color = 'text-slate-300';
                    if (log.type === 'success') color = 'text-emerald-400';
                    if (log.type === 'warning') color = 'text-amber-400';
                    if (log.type === 'error') color = 'text-rose-400';

                    return (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                        <span className={color}>{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 5: COMPLETED SUMMARY REPORT ================= */}
          {currentStep === 5 && importResult && (
            <div className="space-y-6 py-2 animate-in fade-in duration-150">
              {/* Success Banner */}
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-emerald-950">
                  Bulk Product Catalog Ingestion Completed!
                </h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  All processed items have been indexed into ProcureFlow with Flipkart metadata, category aggregations, and enterprise security audit logs.
                </p>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div className="text-xs font-semibold text-slate-500">Total Processed</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {importResult.totalProcessed}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <div className="text-xs font-semibold text-emerald-700">New SKUs Created</div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">
                    {importResult.createdCount}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
                  <div className="text-xs font-semibold text-blue-700">Existing SKUs Updated</div>
                  <div className="text-2xl font-black text-blue-900 mt-1">
                    {importResult.updatedCount}
                  </div>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-center">
                  <div className="text-xs font-semibold text-rose-700">Errors Encountered</div>
                  <div className="text-2xl font-black text-rose-900 mt-1">
                    {importResult.errorCount}
                  </div>
                </div>
              </div>

              {/* Error Table if any */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Error Log Details ({importResult.errors.length} items skipped)</span>
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="p-2 bg-white rounded-lg border border-rose-100 text-rose-800 text-[11px] flex justify-between">
                        <span>Row {err.row}: {err.name || err.productCode || 'Item'}</span>
                        <span className="font-semibold">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setRawText('');
                    setFileName('');
                  }}
                  className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Import Another Batch
                </button>

                <button
                  id="finish-bulk-import-btn"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Close &amp; View Catalog</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
