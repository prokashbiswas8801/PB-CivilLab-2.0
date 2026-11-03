import React, { useState, useMemo } from 'react';
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Search,
  Plus,
  Filter,
  FileDown,
  Download,
  Calendar,
  Layers,
  MapPin,
  Truck,
  User,
  Hash,
  Sparkles,
  Info,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  X,
  Printer,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { InventoryItem, StockTransaction, MaterialUnit } from '../../types/siteManagement';

const MATERIAL_UNITS: MaterialUnit[] = [
  'Bags',
  'Ton',
  'CFT',
  'Nos',
  'Liters',
  'Kg',
  'Sq.Ft',
  'Rft',
  'Cum',
  'Bundle',
];

const MATERIAL_CATEGORIES = [
  'All',
  'Cement',
  'Steel',
  'Aggregates',
  'Masonry',
  'Finishing',
  'Plumbing/Sanitary',
  'Electrical',
  'Hardware',
  'Chemicals/Admixtures',
  'Other',
];

interface StoreInventoryModuleProps {
  onNavigateToRequisitions?: () => void;
}

export const StoreInventoryModule: React.FC<StoreInventoryModuleProps> = ({ onNavigateToRequisitions }) => {
  const {
    siteData,
    activeProjectId,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    recordStockTransaction,
    createRequisitionFromLowStock,
  } = useSiteManagement();

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions' | 'variance'>('inventory');
  const [txTypeFilter, setTxTypeFilter] = useState<'All' | 'Inward' | 'Outward'>('All');

  // Modals
  const [inwardModalOpen, setInwardModalOpen] = useState<boolean>(false);
  const [outwardModalOpen, setOutwardModalOpen] = useState<boolean>(false);
  const [addItemModalOpen, setAddItemModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------------------------------
  // INWARD FORM STATE (মালামাল জমা)
  // --------------------------------------------------------------------------
  const [inwardForm, setInwardForm] = useState({
    itemId: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    challanNo: '',
    supplier: '',
    truckNo: '',
    receiver: '',
    remarks: '',
  });

  // --------------------------------------------------------------------------
  // OUTWARD FORM STATE (মালামাল খরচ)
  // --------------------------------------------------------------------------
  const [outwardForm, setOutwardForm] = useState({
    itemId: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    floorZone: '',
    workHead: '',
    foreman: '',
    remarks: '',
  });

  // --------------------------------------------------------------------------
  // NEW MATERIAL ITEM FORM
  // --------------------------------------------------------------------------
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'Cement',
    unit: 'Bags' as MaterialUnit,
    currentStock: '0',
    minThreshold: '10',
    unitRate: '0',
    theoreticalBoqQty: '0',
    specification: '',
    locationRack: '',
    notes: '',
  });

  // Filtered Inventory Items
  const filteredInventory = useMemo(() => {
    return siteData.inventory.filter((item) => {
      const matchCategory = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.specification && item.specification.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchLowStock = onlyLowStock ? item.currentStock <= item.minThreshold : true;
      return matchCategory && matchSearch && matchLowStock;
    });
  }, [siteData.inventory, selectedCategory, searchQuery, onlyLowStock]);

  // Low stock counter
  const lowStockCount = useMemo(() => {
    return siteData.inventory.filter((item) => item.currentStock <= item.minThreshold).length;
  }, [siteData.inventory]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    const totalMaterials = siteData.inventory.length;
    const totalStockValue = siteData.inventory.reduce((sum, item) => sum + item.currentStock * item.unitRate, 0);
    const totalInwardCount = siteData.stockTransactions.filter((t) => t.type === 'Inward').length;
    const totalOutwardCount = siteData.stockTransactions.filter((t) => t.type === 'Outward').length;
    return { totalMaterials, totalStockValue, totalInwardCount, totalOutwardCount };
  }, [siteData.inventory, siteData.stockTransactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return siteData.stockTransactions.filter((t) => {
      const matchType = txTypeFilter === 'All' || t.type === txTypeFilter;
      const matchSearch =
        t.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.challanNo && t.challanNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.supplier && t.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.floorZone && t.floorZone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.foreman && t.foreman.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [siteData.stockTransactions, txTypeFilter, searchQuery]);

  // Selected item for outward limit check
  const selectedOutwardItem = useMemo(() => {
    return siteData.inventory.find((i) => i.id === outwardForm.itemId);
  }, [siteData.inventory, outwardForm.itemId]);

  const outwardQtyNum = parseFloat(outwardForm.quantity) || 0;
  const isOutwardExceedingStock = selectedOutwardItem ? outwardQtyNum > selectedOutwardItem.currentStock : false;

  // Handlers
  const handleCreateRequisitionFromLowStock = () => {
    const newReq = createRequisitionFromLowStock('Urgent', 'Generated via Store & Inventory Low Stock alert');
    if (newReq) {
      showToast(`Created Requisition Slip ${newReq.reqNo} with ${newReq.items.length} low-stock items!`);
      if (onNavigateToRequisitions) {
        onNavigateToRequisitions();
      }
    } else {
      showToast('All material inventory levels are currently above minimum safety thresholds.');
    }
  };

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardForm.itemId) return;
    const item = siteData.inventory.find((i) => i.id === inwardForm.itemId);
    if (!item) return;

    const qty = parseFloat(inwardForm.quantity) || 0;
    if (qty <= 0) return;

    recordStockTransaction({
      itemId: item.id,
      itemName: item.name,
      type: 'Inward',
      date: inwardForm.date,
      quantity: qty,
      unit: item.unit,
      unitRate: item.unitRate,
      totalAmount: qty * item.unitRate,
      challanNo: inwardForm.challanNo || undefined,
      supplier: inwardForm.supplier || undefined,
      truckNo: inwardForm.truckNo || undefined,
      vehicleNo: inwardForm.truckNo || undefined,
      receiver: inwardForm.receiver || undefined,
      remarks: inwardForm.remarks || undefined,
    });

    showToast(`Received ${qty} ${item.unit} of ${item.name} into Store.`);
    setInwardModalOpen(false);
    setInwardForm({
      itemId: '',
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      challanNo: '',
      supplier: '',
      truckNo: '',
      receiver: '',
      remarks: '',
    });
  };

  const handleOutwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outwardForm.itemId) return;
    const item = siteData.inventory.find((i) => i.id === outwardForm.itemId);
    if (!item) return;

    const qty = parseFloat(outwardForm.quantity) || 0;
    if (qty <= 0) return;
    if (qty > item.currentStock) {
      alert(`Cannot issue ${qty} ${item.unit}. Current store balance is only ${item.currentStock} ${item.unit}!`);
      return;
    }

    recordStockTransaction({
      itemId: item.id,
      itemName: item.name,
      type: 'Outward',
      date: outwardForm.date,
      quantity: qty,
      unit: item.unit,
      unitRate: item.unitRate,
      totalAmount: qty * item.unitRate,
      floorZone: outwardForm.floorZone || undefined,
      workHead: outwardForm.workHead || undefined,
      foreman: outwardForm.foreman || undefined,
      remarks: outwardForm.remarks || undefined,
    });

    showToast(`Issued ${qty} ${item.unit} of ${item.name} for ${outwardForm.floorZone || 'site work'}.`);
    setOutwardModalOpen(false);
    setOutwardForm({
      itemId: '',
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      floorZone: '',
      workHead: '',
      foreman: '',
      remarks: '',
    });
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) return;

    const created = addInventoryItem({
      name: newItemForm.name.trim(),
      category: newItemForm.category,
      unit: newItemForm.unit,
      currentStock: parseFloat(newItemForm.currentStock) || 0,
      minThreshold: parseFloat(newItemForm.minThreshold) || 10,
      unitRate: parseFloat(newItemForm.unitRate) || 0,
      theoreticalBoqQty: parseFloat(newItemForm.theoreticalBoqQty) || 0,
      specification: newItemForm.specification.trim() || undefined,
      locationRack: newItemForm.locationRack.trim() || undefined,
      notes: newItemForm.notes.trim() || undefined,
    });

    showToast(`Added ${created.name} to material inventory.`);
    setAddItemModalOpen(false);
    setNewItemForm({
      name: '',
      category: 'Cement',
      unit: 'Bags',
      currentStock: '0',
      minThreshold: '10',
      unitRate: '0',
      theoreticalBoqQty: '0',
      specification: '',
      locationRack: '',
      notes: '',
    });
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Item ID',
      'Material Name',
      'Category',
      'Unit',
      'Current Stock',
      'Min Threshold',
      'Status',
      'Unit Rate (৳)',
      'Total Value (৳)',
      'Theoretical BOQ',
      'Total Inward',
      'Total Outward',
      'Specification',
      'Location / Rack',
    ];

    const rows = siteData.inventory.map((item) => [
      `"${item.id}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.unit}"`,
      item.currentStock,
      item.minThreshold,
      item.currentStock <= item.minThreshold ? 'LOW STOCK' : 'SAFE',
      item.unitRate,
      item.currentStock * item.unitRate,
      item.theoreticalBoqQty,
      item.totalInward,
      item.totalOutward,
      `"${(item.specification || '').replace(/"/g, '""')}"`,
      `"${(item.locationRack || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Site_Inventory_${activeProjectId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Inventory CSV exported successfully!');
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 md:p-6 rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface-container)] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)]/20">
                Project Store & Logistics
              </span>
              <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                {activeProjectId}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
              Store & Inventory Ledger
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl">
              Real-time site material balances, inward challan gate passes (মালামাল জমা), outward floor issues (মালামাল খরচ), and theoretical BOQ consumption variance.
            </p>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCreateRequisitionFromLowStock}
              className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Automatically scan all inventory items below minimum threshold and draft a requisition"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>+ Create Requisition for Low Stock ({lowStockCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setInwardModalOpen(true)}
              className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>মালামাল জমা (Inward)</span>
            </button>

            <button
              type="button"
              onClick={() => setOutwardModalOpen(true)}
              className="px-4 py-2 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>মালামাল খরচ (Issue)</span>
            </button>

            <button
              type="button"
              onClick={() => setAddItemModalOpen(true)}
              className="px-3.5 py-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Material</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="p-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs cursor-pointer transition-colors"
              title="Export Inventory CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--md-sys-color-outline)]/15">
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Materials Tracked
            </span>
            <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5 tabular-nums">
              {stats.totalMaterials}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              Active SKU codes
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Low Stock Alerts
            </span>
            <div className={`text-xl font-bold font-mono mt-0.5 tabular-nums ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {lowStockCount}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              {lowStockCount > 0 ? 'Needs immediate PO' : 'All stocks healthy'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Estimated Store Value
            </span>
            <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5 tabular-nums">
              ৳ {stats.totalStockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              Based on unit rates
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Total Transactions
            </span>
            <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5 tabular-nums">
              {siteData.stockTransactions.length}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              {stats.totalInwardCount} In / {stats.totalOutwardCount} Out
            </span>
          </div>
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)]/20 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'inventory'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            Live Stock Table
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'transactions'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            Gate Pass & Issue Logs ({siteData.stockTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variance')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'variance'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            BOQ vs. Actual Variance
          </button>
        </div>

        {/* Search & Low Stock Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search material, challan, floor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline)]/30 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-hidden focus:border-[var(--md-sys-color-primary)] w-56 sm:w-64"
            />
          </div>

          {activeTab === 'inventory' && (
            <button
              type="button"
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
                onlyLowStock
                  ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
                  : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline)]/30 hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Low Stock Only</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (Inventory View) */}
      {activeTab === 'inventory' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {MATERIAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold'
                  : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* TAB 1: LIVE STOCK TABLE */}
      {activeTab === 'inventory' && (
        <div className="rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px] font-sans">
                  <th className="py-3 px-4">Material / SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Specification</th>
                  <th className="py-3 px-3 text-right">Current Stock</th>
                  <th className="py-3 px-3 text-right">Min Threshold</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Unit Rate (৳)</th>
                  <th className="py-3 px-3 text-right">Inward / Outward</th>
                  <th className="py-3 px-4 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline)]/15">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
                      No materials found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const isLow = item.currentStock <= item.minThreshold;
                    const stockVal = item.currentStock * item.unitRate;
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors ${
                          isLow ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-[var(--md-sys-color-on-surface)]">{item.name}</div>
                          <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                            {item.id} {item.locationRack ? `• ${item.locationRack}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-sans text-[var(--md-sys-color-on-surface-variant)]">
                          {item.category}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-[var(--md-sys-color-on-surface-variant)] max-w-xs truncate">
                          {item.specification || '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-sm tabular-nums text-[var(--md-sys-color-on-surface)]">
                          {item.currentStock.toLocaleString()}{' '}
                          <span className="text-[11px] font-sans font-normal text-[var(--md-sys-color-on-surface-variant)]">
                            {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[11px] tabular-nums text-[var(--md-sys-color-on-surface-variant)]">
                          {item.minThreshold.toLocaleString()} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800 animate-pulse">
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                              SAFE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-[var(--md-sys-color-on-surface)]">
                          ৳ {item.unitRate.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[11px] tabular-nums text-[var(--md-sys-color-on-surface-variant)]">
                          <span className="text-emerald-600 font-semibold">+{item.totalInward}</span> /{' '}
                          <span className="text-amber-600 font-semibold">-{item.totalOutward}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setInwardForm((prev) => ({ ...prev, itemId: item.id }));
                                setInwardModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors"
                              title="Record Inward Delivery"
                            >
                              + Inward
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOutwardForm((prev) => ({ ...prev, itemId: item.id }));
                                setOutwardModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors"
                              title="Issue Material to Floor"
                            >
                              - Issue
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GATE PASS & TRANSACTION LOGS */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Filter Type:</span>
            {(['All', 'Inward', 'Outward'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxTypeFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  txTypeFilter === t
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                {t === 'Inward' ? 'মালামাল জমা (Inward)' : t === 'Outward' ? 'মালামাল খরচ (Outward)' : 'All Records'}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px] font-sans">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-4">Material</th>
                    <th className="py-3 px-3 text-right">Quantity</th>
                    <th className="py-3 px-4">Challan / Floor Tag</th>
                    <th className="py-3 px-4">Supplier / Foreman</th>
                    <th className="py-3 px-3">Received / Issued By</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline)]/15">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
                        No transaction logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isIn = tx.type === 'Inward';
                      return (
                        <tr key={tx.id} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                          <td className="py-3 px-4 font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="py-3 px-3">
                            {isIn ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                                <ArrowDownLeft className="w-3 h-3" /> INWARD
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                                <ArrowUpRight className="w-3 h-3" /> OUTWARD
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[var(--md-sys-color-on-surface)]">{tx.itemName}</div>
                            <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                              {tx.itemId}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-sm tabular-nums text-[var(--md-sys-color-on-surface)]">
                            {isIn ? `+${tx.quantity}` : `-${tx.quantity}`}{' '}
                            <span className="text-[11px] font-sans font-normal text-[var(--md-sys-color-on-surface-variant)]">
                              {tx.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isIn ? (
                              <div>
                                <span className="font-mono font-semibold text-[var(--md-sys-color-on-surface)]">
                                  {tx.challanNo || 'No Challan'}
                                </span>
                                {tx.truckNo && (
                                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mt-0.5">
                                    <Truck className="w-3 h-3" /> {tx.truckNo}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold text-[var(--md-sys-color-primary)]">
                                  {tx.floorZone || 'General Floor'}
                                </span>
                                {tx.workHead && (
                                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                    {tx.workHead}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-[var(--md-sys-color-on-surface)]">
                            {isIn ? tx.supplier || '—' : tx.foreman || '—'}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                            {isIn ? tx.receiver || 'Store' : tx.issuedTo || 'Site'}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-[var(--md-sys-color-on-surface-variant)] max-w-xs truncate">
                            {tx.remarks || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: THEORETICAL BOQ VS ACTUAL CONSUMPTION VARIANCE */}
      {activeTab === 'variance' && (
        <div className="rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[var(--md-sys-color-outline)]/15 bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Theoretical BOQ vs. Site Consumption Variance
              </h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Monitors wastage, over-consumption, and safe allowances against approved estimate baselines.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px] font-sans">
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-3 text-right">Theoretical BOQ Qty</th>
                  <th className="py-3 px-3 text-right">Total Inward Procured</th>
                  <th className="py-3 px-3 text-right">Actual Issued / Consumed</th>
                  <th className="py-3 px-3 text-right">Store Balance</th>
                  <th className="py-3 px-3 text-right">Consumption %</th>
                  <th className="py-3 px-3 text-right">Variance (Over/Under)</th>
                  <th className="py-3 px-4 text-center">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline)]/15">
                {siteData.inventory.map((item) => {
                  const boq = item.theoreticalBoqQty || 0;
                  const consumed = item.totalOutward || 0;
                  const ratio = boq > 0 ? (consumed / boq) * 100 : 0;
                  const variance = consumed - boq;
                  const isOverBoq = boq > 0 && consumed > boq;
                  const isNearBoq = boq > 0 && ratio >= 85 && ratio <= 100;

                  return (
                    <tr key={item.id} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[var(--md-sys-color-on-surface)]">{item.name}</div>
                        <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          {item.id}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
                        {boq > 0 ? `${boq.toLocaleString()} ${item.unit}` : 'Not Specified'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-600 font-semibold">
                        +{item.totalInward} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-700 font-semibold">
                        -{consumed} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[var(--md-sys-color-on-surface)]">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        {boq > 0 ? (
                          <span
                            className={
                              isOverBoq ? 'text-rose-600' : isNearBoq ? 'text-amber-600' : 'text-emerald-600'
                            }
                          >
                            {ratio.toFixed(1)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {boq > 0 ? (
                          <span className={isOverBoq ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
                            {variance > 0 ? `+${variance.toFixed(1)}` : variance.toFixed(1)} {item.unit}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOverBoq ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300">
                            Over-Consumption
                          </span>
                        ) : isNearBoq ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300">
                            Nearing Limit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300">
                            Normal Limit
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: INWARD DELIVERY FORM (মালামাল জমা) */}
      {/* ==================================================================== */}
      {inwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-6 font-serif">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Inward Stock Delivery (মালামাল জমা)
                  </h3>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Direct Store Inward Gate Pass
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInwardModalOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Select Material <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={inwardForm.itemId}
                  onChange={(e) => setInwardForm({ ...inwardForm, itemId: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                >
                  <option value="">-- Choose Item from Inventory --</option>
                  {siteData.inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} (Current: {inv.currentStock} {inv.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Quantity Received <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.001"
                    placeholder="e.g. 200"
                    value={inwardForm.quantity}
                    onChange={(e) => setInwardForm({ ...inwardForm, quantity: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Delivery Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={inwardForm.date}
                    onChange={(e) => setInwardForm({ ...inwardForm, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Challan / Invoice No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CH-2026-8891"
                    value={inwardForm.challanNo}
                    onChange={(e) => setInwardForm({ ...inwardForm, challanNo: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Supplier / Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shah Cement / BSRM"
                    value={inwardForm.supplier}
                    onChange={(e) => setInwardForm({ ...inwardForm, supplier: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Truck / Vehicle No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DM-TA-11-2091"
                    value={inwardForm.truckNo}
                    onChange={(e) => setInwardForm({ ...inwardForm, truckNo: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Received By
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engr. Prokash / Store Incharge"
                    value={inwardForm.receiver}
                    onChange={(e) => setInwardForm({ ...inwardForm, receiver: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Quality Remarks / Inspection Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Moisture seal intact, sample bag weighed 50.1 kg"
                  value={inwardForm.remarks}
                  onChange={(e) => setInwardForm({ ...inwardForm, remarks: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => setInwardModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
                >
                  Save Inward Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: OUTWARD / ISSUE FORM (মালামাল খরচ) */}
      {/* ==================================================================== */}
      {outwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-6 font-serif">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Issue Material to Floor (মালামাল খরচ)
                  </h3>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Deducts automatically from Store Balance
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOutwardModalOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOutwardSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Select Material <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={outwardForm.itemId}
                  onChange={(e) => setOutwardForm({ ...outwardForm, itemId: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                >
                  <option value="">-- Choose Item from Inventory --</option>
                  {siteData.inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} (Available: {inv.currentStock} {inv.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOutwardItem && (
                <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)]/15 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Available Store Stock:</span>
                    <div className="font-mono font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                      {selectedOutwardItem.currentStock} {selectedOutwardItem.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Unit Rate:</span>
                    <div className="font-mono text-sm text-[var(--md-sys-color-on-surface)]">
                      ৳ {selectedOutwardItem.unitRate}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Quantity to Issue <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.001"
                    placeholder="e.g. 50"
                    value={outwardForm.quantity}
                    onChange={(e) => setOutwardForm({ ...outwardForm, quantity: e.target.value })}
                    className={`w-full px-4 py-2 rounded-full text-xs font-mono border bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden ${
                      isOutwardExceedingStock
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-[var(--md-sys-color-outline)]/40 focus:border-[var(--md-sys-color-primary)]'
                    }`}
                  />
                  {isOutwardExceedingStock && (
                    <span className="text-[10px] text-rose-600 block mt-1 font-semibold">
                      Cannot issue more than available stock ({selectedOutwardItem?.currentStock})!
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Issue Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={outwardForm.date}
                    onChange={(e) => setOutwardForm({ ...outwardForm, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Floor / Location Tag <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2nd Floor Beam-Slab"
                    value={outwardForm.floorZone}
                    onChange={(e) => setOutwardForm({ ...outwardForm, floorZone: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Work Head / Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RCC 1:1.5:3 Casting"
                    value={outwardForm.workHead}
                    onChange={(e) => setOutwardForm({ ...outwardForm, workHead: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Foreman / Contractor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Master Mason Jahangir"
                    value={outwardForm.foreman}
                    onChange={(e) => setOutwardForm({ ...outwardForm, foreman: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Remarks / Instruction
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grid C1 to C5"
                    value={outwardForm.remarks}
                    onChange={(e) => setOutwardForm({ ...outwardForm, remarks: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => setOutwardModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOutwardExceedingStock}
                  className="px-5 py-2 rounded-full bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
                >
                  Confirm Issue to Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE NEW MATERIAL SKU */}
      {/* ==================================================================== */}
      {addItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-6 font-serif">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)]">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Add New Material to Site Catalog
                  </h3>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Establishes baseline thresholds & rates
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddItemModalOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Material Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500W Deformed Rebar 12mm"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Trade Category
                  </label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  >
                    {MATERIAL_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value as MaterialUnit })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  >
                    {MATERIAL_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newItemForm.currentStock}
                    onChange={(e) => setNewItemForm({ ...newItemForm, currentStock: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Min Threshold (Alert)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newItemForm.minThreshold}
                    onChange={(e) => setNewItemForm({ ...newItemForm, minThreshold: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Unit Rate (৳)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newItemForm.unitRate}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unitRate: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Theoretical BOQ Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 5000"
                    value={newItemForm.theoreticalBoqQty}
                    onChange={(e) => setNewItemForm({ ...newItemForm, theoreticalBoqQty: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Location / Shed / Rack
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Yard Stack-C / Bay 2"
                    value={newItemForm.locationRack}
                    onChange={(e) => setNewItemForm({ ...newItemForm, locationRack: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Specification / Grade
                </label>
                <input
                  type="text"
                  placeholder="e.g. ASTM A615 / BDS ISO 6935-2 Grade 72.5"
                  value={newItemForm.specification}
                  onChange={(e) => setNewItemForm({ ...newItemForm, specification: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => setAddItemModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-sm cursor-pointer hover:opacity-90"
                >
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
