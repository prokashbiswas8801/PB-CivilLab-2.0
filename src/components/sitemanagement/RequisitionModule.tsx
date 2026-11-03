import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Copy,
  Printer,
  Share2,
  Search,
  Filter,
  Trash2,
  Calendar,
  X,
  Package,
  Layers,
  ArrowRight,
  Send,
  Building,
  User,
} from 'lucide-react';
import { useSiteManagement } from '../../context/SiteManagementContext';
import {
  RequisitionOrder,
  RequisitionItem,
  UrgencyLevel,
  RequisitionStatus,
  MaterialUnit,
} from '../../types/siteManagement';

const URGENCY_LEVELS: UrgencyLevel[] = ['Normal', 'Urgent', 'Critical'];
const STATUS_OPTIONS: RequisitionStatus[] = ['Pending', 'Approved', 'Received', 'Cancelled'];

interface RequisitionModuleProps {
  onNavigateToStore?: () => void;
}

export const RequisitionModule: React.FC<RequisitionModuleProps> = ({ onNavigateToStore }) => {
  const {
    siteData,
    activeProjectId,
    createRequisition,
    updateRequisition,
    deleteRequisition,
    markRequisitionAsReceived,
  } = useSiteManagement();

  // Filters & State
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReq, setSelectedReq] = useState<RequisitionOrder | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [receiveModalReq, setReceiveModalReq] = useState<RequisitionOrder | null>(null);
  const [printModalReq, setPrintModalReq] = useState<RequisitionOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------------------------------
  // CREATE REQUISITION FORM STATE
  // --------------------------------------------------------------------------
  const [formData, setFormData] = useState({
    reqNo: `REQ-${new Date().getFullYear()}-${(siteData.requisitions.length + 1).toString().padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    requiredByDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    urgency: 'Urgent' as UrgencyLevel,
    requestedBy: 'Site Engineer',
    notes: '',
  });

  const [formItems, setFormItems] = useState<RequisitionItem[]>([
    {
      itemId: '',
      itemName: '',
      unit: 'Bags',
      requestedQty: 100,
      estimatedRate: 580,
      currentStockAtReq: 0,
      notes: '',
    },
  ]);

  // --------------------------------------------------------------------------
  // RECEIVE INTO STORE MODAL FORM STATE
  // --------------------------------------------------------------------------
  const [receiveForm, setReceiveForm] = useState({
    challanNo: '',
    truckNo: '',
    supplier: '',
    receiver: 'Storekeeper',
  });

  // Filtered Requisitions
  const filteredRequisitions = useMemo(() => {
    return siteData.requisitions.filter((req) => {
      const matchStatus = statusFilter === 'All' || req.status === statusFilter;
      const matchUrgency = urgencyFilter === 'All' || req.urgency === urgencyFilter;
      const matchSearch =
        req.reqNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.items.some((i) => i.itemName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (req.notes && req.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchUrgency && matchSearch;
    });
  }, [siteData.requisitions, statusFilter, urgencyFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = siteData.requisitions.length;
    const pending = siteData.requisitions.filter((r) => r.status === 'Pending').length;
    const approved = siteData.requisitions.filter((r) => r.status === 'Approved').length;
    const received = siteData.requisitions.filter((r) => r.status === 'Received').length;
    const critical = siteData.requisitions.filter((r) => r.urgency === 'Critical' && r.status !== 'Received').length;
    return { total, pending, approved, received, critical };
  }, [siteData.requisitions]);

  // Handle Form Item Change
  const handleItemSelect = (index: number, itemId: string) => {
    const inv = siteData.inventory.find((i) => i.id === itemId);
    const updated = [...formItems];
    if (inv) {
      updated[index] = {
        ...updated[index],
        itemId: inv.id,
        itemName: inv.name,
        unit: inv.unit,
        estimatedRate: inv.unitRate,
        currentStockAtReq: inv.currentStock,
        notes: inv.specification || '',
      };
    } else {
      updated[index] = {
        ...updated[index],
        itemId,
        itemName: '',
      };
    }
    setFormItems(updated);
  };

  const handleItemFieldChange = (index: number, field: keyof RequisitionItem, value: any) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
  };

  const handleAddItemRow = () => {
    setFormItems([
      ...formItems,
      {
        itemId: '',
        itemName: '',
        unit: 'Bags',
        requestedQty: 10,
        estimatedRate: 0,
        currentStockAtReq: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length <= 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  // Submit Requisition
  const handleCreateRequisitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = formItems.filter((i) => i.itemName.trim() && i.requestedQty > 0);
    if (validItems.length === 0) {
      showToast('⚠️ Please add at least one valid material item with requested quantity.');
      return;
    }

    const newReq = createRequisition({
      reqNo: formData.reqNo.trim(),
      date: formData.date,
      requiredByDate: formData.requiredByDate,
      urgency: formData.urgency,
      items: validItems,
      status: 'Pending',
      requestedBy: formData.requestedBy.trim(),
      notes: formData.notes.trim() || undefined,
    });

    showToast(`Requisition Order ${newReq.reqNo} created successfully!`);
    setCreateModalOpen(false);

    // Reset form
    setFormData({
      reqNo: `REQ-${new Date().getFullYear()}-${(siteData.requisitions.length + 2).toString().padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      requiredByDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      urgency: 'Urgent',
      requestedBy: 'Site Engineer',
      notes: '',
    });
    setFormItems([
      {
        itemId: '',
        itemName: '',
        unit: 'Bags',
        requestedQty: 100,
        estimatedRate: 580,
        currentStockAtReq: 0,
        notes: '',
      },
    ]);
  };

  // Mark as Received Confirmation
  const handleConfirmReceiveInStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveModalReq) return;
    if (!receiveForm.challanNo.trim()) {
      showToast('⚠️ Please provide Challan No. for inward verification!');
      return;
    }

    const success = markRequisitionAsReceived(
      receiveModalReq.id,
      receiveForm.challanNo.trim(),
      receiveForm.truckNo.trim() || undefined,
      receiveForm.supplier.trim() || undefined,
      receiveForm.receiver.trim() || undefined
    );

    if (success) {
      showToast(`Requisition ${receiveModalReq.reqNo} marked as Received & items stocked in Store!`);
      setReceiveModalReq(null);
      setReceiveForm({ challanNo: '', truckNo: '', supplier: '', receiver: 'Storekeeper' });
      if (onNavigateToStore) {
        // Option to navigate
      }
    } else {
      showToast('⚠️ Failed to mark requisition as received. It may already be received.');
    }
  };

  // WhatsApp Formatted Text Copy
  const handleCopyWhatsAppSlip = (req: RequisitionOrder) => {
    const urgencyIcon = req.urgency === 'Critical' ? '🔴 CRITICAL' : req.urgency === 'Urgent' ? '🟠 URGENT' : '🟢 NORMAL';
    const itemsText = req.items
      .map(
        (item, idx) =>
          `${idx + 1}. *${item.itemName}* — ${item.requestedQty} ${item.unit} (Current Store: ${item.currentStockAtReq} ${item.unit})${
            item.notes ? `\n   _Spec: ${item.notes}_` : ''
          }`
      )
      .join('\n');

    const totalEst = req.items.reduce((sum, item) => sum + item.requestedQty * item.estimatedRate, 0);

    const message = `🏗️ *PB CivilLab — Material Requisition Order*\n📋 *Req No:* ${req.reqNo} | *Priority:* ${urgencyIcon}\n📅 *Date:* ${req.date} | *Required By:* ${req.requiredByDate}\n🏢 *Project:* ${activeProjectId}\n-----------------------------------\n📦 *Materials Required:*\n${itemsText}\n-----------------------------------\n💰 *Est. Total Value:* ৳ ${totalEst.toLocaleString()}\n👤 *Requested By:* ${req.requestedBy}\n${req.notes ? `⚠️ *Remarks:* ${req.notes}\n` : ''}✅ *Please arrange procurement and dispatch to site immediately.*`;

    navigator.clipboard.writeText(message);
    showToast('Requisition formatted for WhatsApp & copied to clipboard!');
  };

  // Native Print A4 Slip
  const handlePrintSlip = (req: RequisitionOrder) => {
    setPrintModalReq(req);
    setTimeout(() => {
      window.print();
    }, 300);
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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Procurement & Indents
              </span>
              <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                {activeProjectId}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
              Material Requisition & PO Generator
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl">
              Create multi-item site indents with real-time store balances, 1-click WhatsApp dispatch, and automatic Inward Store inventory integration.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Requisition Slip</span>
            </button>

            {onNavigateToStore && (
              <button
                type="button"
                onClick={onNavigateToStore}
                className="px-3.5 py-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                <span>View Store Ledger</span>
              </button>
            )}
          </div>
        </div>

        {/* Live KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--md-sys-color-outline)]/15">
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Total Indents Raised
            </span>
            <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5 tabular-nums">
              {stats.total}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              Site requisition orders
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Pending / In Procurement
            </span>
            <div className={`text-xl font-bold font-mono mt-0.5 tabular-nums ${stats.pending > 0 ? 'text-amber-600' : 'text-[var(--md-sys-color-on-surface)]'}`}>
              {stats.pending + stats.approved}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              {stats.pending} Draft, {stats.approved} Approved
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Critical Urgent Orders
            </span>
            <div className={`text-xl font-bold font-mono mt-0.5 tabular-nums ${stats.critical > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stats.critical}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              {stats.critical > 0 ? 'Needs fast-track delivery' : 'No critical bottlenecks'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Received in Store
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5 tabular-nums">
              {stats.received}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              100% Inward reconciled
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mr-1">Status:</span>
          {['All', ...STATUS_OPTIONS].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === st
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold'
                  : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search & Urgency */}
        <div className="flex items-center gap-2">
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline)]/30 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
          >
            <option value="All">All Urgencies</option>
            {URGENCY_LEVELS.map((u) => (
              <option key={u} value={u}>
                {u} Priority
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search slip no, item, engineer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline)]/30 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-hidden focus:border-[var(--md-sys-color-primary)] w-56 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Requisitions List Cards */}
      <div className="space-y-4">
        {filteredRequisitions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)]">
            <FileText className="w-10 h-10 mx-auto text-[var(--md-sys-color-on-surface-variant)]/40 mb-3" />
            <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">No Requisitions Found</h4>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
              Create a new requisition slip or generate one from the Store Low-Stock alerts.
            </p>
          </div>
        ) : (
          filteredRequisitions.map((req) => {
            const isCritical = req.urgency === 'Critical';
            const isUrgent = req.urgency === 'Urgent';
            const isReceived = req.status === 'Received';
            const isApproved = req.status === 'Approved';
            const isPending = req.status === 'Pending';
            const totalEstValue = req.items.reduce((acc, i) => acc + i.requestedQty * i.estimatedRate, 0);

            return (
              <div
                key={req.id}
                className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isReceived
                    ? 'border-emerald-200 bg-emerald-500/5 dark:border-emerald-950'
                    : isCritical
                    ? 'border-rose-300 bg-rose-500/5 dark:border-rose-950'
                    : 'border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-outline)]/40'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--md-sys-color-outline)]/15">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                      {req.reqNo}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300'
                          : isUrgent
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300'
                      }`}
                    >
                      {req.urgency} Priority
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                        isReceived
                          ? 'bg-emerald-600 text-white'
                          : isApproved
                          ? 'bg-blue-600 text-white'
                          : req.status === 'Cancelled'
                          ? 'bg-gray-400 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      Status: {req.status}
                    </span>
                    {req.linkedChallanNo && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline)]/20">
                        Challan: {req.linkedChallanNo}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Indent: {req.date}</span>
                    <span>•</span>
                    <span className="font-semibold text-rose-600">Needed By: {req.requiredByDate}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[10px] font-sans uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline)]/10 pb-1">
                        <th className="py-1.5 px-2">Material / Specification</th>
                        <th className="py-1.5 px-2 text-right">Store Balance</th>
                        <th className="py-1.5 px-2 text-right">Required Quantity</th>
                        <th className="py-1.5 px-2 text-right">Est. Unit Rate (৳)</th>
                        <th className="py-1.5 px-2 text-right">Estimated Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--md-sys-color-outline)]/10">
                      {req.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                          <td className="py-2 px-2">
                            <span className="font-bold text-[var(--md-sys-color-on-surface)]">{item.itemName}</span>
                            {item.notes && (
                              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                                {item.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)]">
                            {item.currentStockAtReq} {item.unit}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-sm tabular-nums text-[var(--md-sys-color-primary)]">
                            {item.requestedQty} {item.unit}
                          </td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
                            ৳ {item.estimatedRate.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-semibold tabular-nums text-[var(--md-sys-color-on-surface)]">
                            ৳ {(item.requestedQty * item.estimatedRate).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Notes & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    <span className="font-semibold text-[var(--md-sys-color-on-surface)]">Requested By:</span>{' '}
                    {req.requestedBy}{' '}
                    {req.notes && (
                      <span className="ml-2 italic text-[11px] text-[var(--md-sys-color-on-surface-variant)]/80">
                        "{req.notes}"
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* One-click Receive in Store */}
                    {!isReceived && (
                      <button
                        type="button"
                        onClick={() => {
                          setReceiveModalReq(req);
                          setReceiveForm({ challanNo: '', truckNo: '', supplier: '', receiver: 'Storekeeper' });
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                        title="Mark received and automatically create Inward Stock Transactions into Store"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>✓ Mark as Received in Store</span>
                      </button>
                    )}

                    {/* WhatsApp Copy */}
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppSlip(req)}
                      className="px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Copy formatted markdown text for instant WhatsApp / Telegram dispatch"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Copy</span>
                    </button>

                    {/* Print PDF Slip */}
                    <button
                      type="button"
                      onClick={() => handlePrintSlip(req)}
                      className="px-3 py-1.5 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Print Official A4 Material Requisition Slip"
                    >
                      <Printer className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                      <span>Print A4 Slip</span>
                    </button>

                    {/* Delete Requisition */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete requisition slip ${req.reqNo}?`)) {
                          deleteRequisition(req.id);
                          showToast(`Deleted ${req.reqNo}`);
                        }
                      }}
                      className="p-1.5 rounded-full hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 cursor-pointer transition-colors"
                      title="Delete Requisition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL: CREATE REQUISITION SLIP */}
      {/* ==================================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-6 font-serif my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Create Material Requisition Slip
                  </h3>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Site purchase indent with live inventory lookup
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequisitionSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Requisition Slip No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reqNo}
                    onChange={(e) => setFormData({ ...formData, reqNo: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Date of Indent <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Required-By Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.requiredByDate}
                    onChange={(e) => setFormData({ ...formData, requiredByDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Urgency Priority Tier <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {URGENCY_LEVELS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setFormData({ ...formData, urgency: u })}
                        className={`flex-1 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                          formData.urgency === u
                            ? u === 'Critical'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : u === 'Urgent'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border-transparent'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Requested By (Engineer / Supervisor)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requestedBy}
                    onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-2 pt-2 border-t border-[var(--md-sys-color-outline)]/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                    Material Line Items ({formItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface-container)] space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        {/* Select from Inventory */}
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                            Material SKU / Custom Name
                          </label>
                          <select
                            value={item.itemId}
                            onChange={(e) => handleItemSelect(idx, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                          >
                            <option value="">-- Select from Store Inventory --</option>
                            {siteData.inventory.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} ({inv.currentStock} {inv.unit} in stock)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                            Required Qty ({item.unit})
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            required
                            value={item.requestedQty}
                            onChange={(e) =>
                              handleItemFieldChange(idx, 'requestedQty', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-3 py-1.5 rounded-full text-xs font-mono font-bold border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                          />
                        </div>

                        {/* Estimated Rate */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                            Est. Rate (৳)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={item.estimatedRate}
                            onChange={(e) =>
                              handleItemFieldChange(idx, 'estimatedRate', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                          />
                        </div>

                        {/* Delete Row */}
                        <div className="sm:col-span-1 text-center pt-3 sm:pt-0">
                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-100 cursor-pointer"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Specification & Item Notes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Specification (e.g. 500W Deformed, Grade 72.5)"
                          value={item.notes || ''}
                          onChange={(e) => handleItemFieldChange(idx, 'notes', e.target.value)}
                          className="w-full px-3 py-1 rounded-full text-xs border border-[var(--md-sys-color-outline)]/30 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                        />
                        <div className="text-[11px] font-mono flex items-center justify-between text-[var(--md-sys-color-on-surface-variant)] px-2">
                          <span>Store Stock: {item.currentStockAtReq} {item.unit}</span>
                          <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                            Line Total: ৳ {(item.requestedQty * item.estimatedRate).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Purpose / Structural Element / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Required for 4th floor columns & core shear wall casting scheduled this Friday"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-sm cursor-pointer hover:opacity-90"
                >
                  Create Requisition Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: MARK AS RECEIVED IN STORE (AUTO-CONNECT 2) */}
      {/* ==================================================================== */}
      {receiveModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-6 font-serif">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Receive Materials into Store
                  </h3>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Requisition {receiveModalReq.reqNo}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiveModalReq(null)}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200">
              <div className="font-semibold mb-1">Automatic Stock Integration Active:</div>
              Confirming this form will update requisition status to <b>Received</b> and automatically generate <b>Inward Stock Transactions</b>, adding quantities directly into the Store Inventory balance!
            </div>

            <form onSubmit={handleConfirmReceiveInStore} className="space-y-4 mt-4">
              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)]/15 text-xs space-y-1">
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">Items to be stocked:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  {receiveModalReq.items.map((i, idx) => (
                    <li key={idx}>
                      <b>{i.itemName}</b>: +{i.requestedQty} {i.unit}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Challan / Delivery Invoice No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CH-2026-9041"
                  value={receiveForm.challanNo}
                  onChange={(e) => setReceiveForm({ ...receiveForm, challanNo: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Truck / Vehicle No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DM-TA-14-3819"
                    value={receiveForm.truckNo}
                    onChange={(e) => setReceiveForm({ ...receiveForm, truckNo: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Supplier / Vendor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shah Cement / BSRM"
                    value={receiveForm.supplier}
                    onChange={(e) => setReceiveForm({ ...receiveForm, supplier: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Received By (Storekeeper / Engineer)
                </label>
                <input
                  type="text"
                  value={receiveForm.receiver}
                  onChange={(e) => setReceiveForm({ ...receiveForm, receiver: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => setReceiveModalReq(null)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
                >
                  Confirm & Stock in Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PRINTABLE A4 REQUISITION SLIP (Hidden except during window.print) */}
      {/* ==================================================================== */}
      {printModalReq && (
        <div className="fixed inset-0 z-50 bg-white text-black p-8 overflow-y-auto hidden print:block font-serif">
          <div className="border-b-2 border-black pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">PB CivilLab — Site Material Requisition Slip</h1>
                <p className="text-xs text-gray-600 mt-1">Official Material Procurement & Inward Indent Voucher</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono">Slip No: {printModalReq.reqNo}</div>
                <div className="text-xs">Date: {printModalReq.date}</div>
                <div className="text-xs font-bold text-red-600">Priority: {printModalReq.urgency.toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs mb-6 border p-3 rounded">
            <div>
              <p><b>Project ID:</b> {activeProjectId}</p>
              <p><b>Requested By:</b> {printModalReq.requestedBy}</p>
              <p><b>Status:</b> {printModalReq.status}</p>
            </div>
            <div>
              <p><b>Required-By Date:</b> {printModalReq.requiredByDate}</p>
              <p><b>Linked Challan:</b> {printModalReq.linkedChallanNo || 'Pending Delivery'}</p>
              <p><b>Purpose:</b> {printModalReq.notes || 'Site construction requirement'}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-black mb-8">
            <thead>
              <tr className="bg-gray-100 border-b border-black text-black">
                <th className="p-2 border-r border-black">Sl</th>
                <th className="p-2 border-r border-black">Material Description / Specification</th>
                <th className="p-2 border-r border-black text-right">Current Stock</th>
                <th className="p-2 border-r border-black text-right">Indented Qty</th>
                <th className="p-2 border-r border-black text-right">Est. Rate</th>
                <th className="p-2 text-right">Total Est. (৳)</th>
              </tr>
            </thead>
            <tbody>
              {printModalReq.items.map((it, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                  <td className="p-2 border-r border-black">
                    <b>{it.itemName}</b>
                    {it.notes && <div className="text-[10px] text-gray-700">{it.notes}</div>}
                  </td>
                  <td className="p-2 border-r border-black text-right">{it.currentStockAtReq} {it.unit}</td>
                  <td className="p-2 border-r border-black text-right font-bold">{it.requestedQty} {it.unit}</td>
                  <td className="p-2 border-r border-black text-right">৳ {it.estimatedRate}</td>
                  <td className="p-2 text-right font-bold">৳ {(it.requestedQty * it.estimatedRate).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2 border-black bg-gray-50">
                <td colSpan={5} className="p-2 text-right border-r border-black">Grand Total Estimated:</td>
                <td className="p-2 text-right">
                  ৳ {printModalReq.items.reduce((s, i) => s + i.requestedQty * i.estimatedRate, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="grid grid-cols-3 gap-6 text-center text-xs pt-16 border-t border-gray-400 mt-20">
            <div>
              <div className="border-t border-black pt-1 font-semibold">Site Engineer (Requested By)</div>
            </div>
            <div>
              <div className="border-t border-black pt-1 font-semibold">Storekeeper (Stock Verified)</div>
            </div>
            <div>
              <div className="border-t border-black pt-1 font-semibold">Project Director / Approver</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
