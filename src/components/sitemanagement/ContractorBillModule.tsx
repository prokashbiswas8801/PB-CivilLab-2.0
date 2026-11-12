import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  DollarSign,
  Building,
  User,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { useCivilLab } from '../../context/CivilLabContext';
import { ContractorRABill } from '../../types/siteManagement';
import { CivilWorkspace, TakeoffLineItem } from '../../types/civil';
import { loadPersistedState } from '../../utils/storage';

const COMMON_TRADES = [
  'RCC Structural Civil Labor',
  'Bar Bending & Binding (রডমিস্ত্রি কাজ)',
  'Formwork & Shuttering (শাটারিং ও সেন্টারিং)',
  'Brick Masonry & Plastering (গাঁথুনি ও প্লাস্টার)',
  'Tiles & Marble Laying (টাইলস ফিটিং)',
  'Sanitary & Plumbing Piping (প্লাম্বিং কাজ)',
  'Electrical Conduiting & Wiring (ইলেকট্রিক কাজ)',
  'Internal & External Painting (রংয়ের কাজ)',
  'False Ceiling & Gypsum Board',
  'Earth Excavation & Backfilling',
];

const COMMON_UNITS = ['Sq.Ft', 'm³', 'CFT', 'Ton', 'Kg', 'Nos', 'Rft', 'Point'];

export interface ContractorBillModuleProps {
  activeWorkspace?: CivilWorkspace;
}

export const ContractorBillModule: React.FC<ContractorBillModuleProps> = ({ activeWorkspace: propsWs }) => {
  const {
    siteData,
    activeProjectId,
    addRABill,
    updateRABill,
    deleteRABill,
    financialSummary,
    addPettyCashEntry,
  } = useSiteManagement();

  const activeWorkspace = useMemo(() => {
    if (propsWs) return propsWs;
    try {
      const persisted = loadPersistedState();
      return persisted.workspaces.find((w) => w.id === persisted.activeWorkspaceId) || persisted.workspaces[0];
    } catch {
      return null;
    }
  }, [propsWs]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Certified' | 'Paid'>('All');
  const [contractorFilter, setContractorFilter] = useState<string>('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<ContractorRABill | null>(null);
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<ContractorRABill | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [contractorName, setContractorName] = useState('');
  const [workTrade, setWorkTrade] = useState(COMMON_TRADES[0]);
  const [unit, setUnit] = useState('Sq.Ft');
  const [contractRate, setContractRate] = useState<number | ''>(145);
  const [previousMeasuredQty, setPreviousMeasuredQty] = useState<number | ''>(0);
  const [currentMeasuredQty, setCurrentMeasuredQty] = useState<number | ''>(1000);
  const [retentionPercent, setRetentionPercent] = useState<number>(10);
  const [advanceDeducted, setAdvanceDeducted] = useState<number | ''>(0);
  const [taxPercent, setTaxPercent] = useState<number>(3); // 3% AIT default
  const [voucherNo, setVoucherNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Draft' | 'Certified' | 'Paid'>('Draft');
  const [linkedBoqItemId, setLinkedBoqItemId] = useState<string>('');
  const [tenderBoqQuantity, setTenderBoqQuantity] = useState<number | undefined>(undefined);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Unique list of contractors for filtering
  const uniqueContractors = useMemo(() => {
    const names = new Set<string>();
    siteData.raBills.forEach((b) => {
      if (b.contractorName) names.add(b.contractorName);
    });
    return Array.from(names);
  }, [siteData.raBills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return siteData.raBills.filter((bill) => {
      const matchSearch =
        bill.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.contractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.workTrade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bill.voucherNo && bill.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'All' || bill.paymentStatus === statusFilter;
      const matchContractor = contractorFilter === 'All' || bill.contractorName === contractorFilter;

      return matchSearch && matchStatus && matchContractor;
    });
  }, [siteData.raBills, searchQuery, statusFilter, contractorFilter]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setEditingBill(null);
    const nextSeq = siteData.raBills.length + 1;
    setBillNo(`RA-${nextSeq.toString().padStart(2, '0')}`);
    setBillDate(new Date().toISOString().split('T')[0]);
    setContractorName('');
    setWorkTrade(COMMON_TRADES[0]);
    setUnit('Sq.Ft');
    setContractRate(145);
    setPreviousMeasuredQty(0);
    setCurrentMeasuredQty(500);
    setRetentionPercent(10);
    setAdvanceDeducted(0);
    setTaxPercent(3);
    setVoucherNo(`V-RA-${nextSeq.toString().padStart(2, '0')}`);
    setRemarks('');
    setPaymentStatus('Draft');
    setLinkedBoqItemId('');
    setTenderBoqQuantity(undefined);
    setIsFormOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (bill: ContractorRABill) => {
    setEditingBill(bill);
    setBillNo(bill.billNo);
    setBillDate(bill.date);
    setContractorName(bill.contractorName);
    setWorkTrade(bill.workTrade);
    setUnit(bill.unit);
    setContractRate(bill.contractRate);
    setPreviousMeasuredQty(bill.previousMeasuredQty);
    setCurrentMeasuredQty(bill.currentMeasuredQty);
    setRetentionPercent(bill.retentionPercent);
    setAdvanceDeducted(bill.advanceDeducted);
    const taxRate = bill.currentGrossAmount > 0 ? (bill.taxVatDeducted / bill.currentGrossAmount) * 100 : 0;
    setTaxPercent(Math.round(taxRate * 10) / 10);
    setVoucherNo(bill.voucherNo || '');
    setRemarks(bill.remarks || '');
    setPaymentStatus(bill.paymentStatus);
    setLinkedBoqItemId(bill.linkedBoqItemId || '');
    setTenderBoqQuantity(bill.tenderBoqQuantity);
    setIsFormOpen(true);
  };

  // Link selected BOQ line item to auto-populate trade, unit, rate and tender budget
  const handleSelectBoqItem = (itemId: string) => {
    setLinkedBoqItemId(itemId);
    if (!itemId) {
      setTenderBoqQuantity(undefined);
      return;
    }
    const boqItem = activeWorkspace?.boq?.items?.find((it: TakeoffLineItem) => it.id === itemId);
    if (boqItem) {
      const tenderQty =
        boqItem.numberOfMembers * boqItem.lengthM * boqItem.widthM * boqItem.heightM -
        (boqItem.deductionQty || 0);
      setTenderBoqQuantity(Number(tenderQty.toFixed(2)));
      setWorkTrade(`${boqItem.itemNo}: ${boqItem.description}`);
      setUnit(boqItem.unit === 'm3' ? 'm³' : boqItem.unit === 'm2' ? 'Sq.Ft' : boqItem.unit);
      if (boqItem.unitRate > 0) {
        setContractRate(boqItem.unitRate);
      }
    }
  };

  // When contractor or trade changes in form, auto-fill previous cumulative qty from last bill
  const handleContractorSelect = (selectedName: string) => {
    setContractorName(selectedName);
    const existingBills = siteData.raBills
      .filter((b) => b.contractorName.toLowerCase() === selectedName.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (existingBills.length > 0) {
      const last = existingBills[0];
      setPreviousMeasuredQty(last.totalCumulativeQty);
      setWorkTrade(last.workTrade);
      setUnit(last.unit);
      setContractRate(last.contractRate);
    }
  };

  // Calculations for form in real-time
  const rateNum = Number(contractRate) || 0;
  const prevQtyNum = Number(previousMeasuredQty) || 0;
  const currQtyNum = Number(currentMeasuredQty) || 0;
  const totalQtyCalc = prevQtyNum + currQtyNum;
  const currentGrossCalc = currQtyNum * rateNum;
  const totalGrossCalc = totalQtyCalc * rateNum;
  const retentionAmountCalc = (currentGrossCalc * retentionPercent) / 100;
  const taxAmountCalc = (currentGrossCalc * taxPercent) / 100;
  const advanceDeductedNum = Number(advanceDeducted) || 0;
  const netPayableCalc = Math.max(
    0,
    currentGrossCalc - retentionAmountCalc - advanceDeductedNum - taxAmountCalc
  );

  // Save bill handler
  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorName.trim()) {
      showToast('⚠️ Please enter or select a Contractor Name.');
      return;
    }
    if (currQtyNum <= 0) {
      showToast('⚠️ Current Measured Quantity must be greater than zero.');
      return;
    }
    if (rateNum <= 0) {
      showToast('⚠️ Contract Rate must be greater than zero.');
      return;
    }

    const payload: Omit<ContractorRABill, 'id'> = {
      billNo: billNo || `RA-${Date.now().toString(36).toUpperCase()}`,
      date: billDate,
      contractorName: contractorName.trim(),
      workTrade,
      unit,
      contractRate: rateNum,
      previousMeasuredQty: prevQtyNum,
      currentMeasuredQty: currQtyNum,
      totalCumulativeQty: totalQtyCalc,
      currentGrossAmount: currentGrossCalc,
      totalGrossAmount: totalGrossCalc,
      retentionPercent,
      retentionAmount: retentionAmountCalc,
      advanceDeducted: advanceDeductedNum,
      taxVatDeducted: taxAmountCalc,
      netPayable: netPayableCalc,
      paymentStatus,
      voucherNo: voucherNo.trim() || undefined,
      remarks: remarks.trim() || undefined,
      linkedBoqItemId: linkedBoqItemId || undefined,
      tenderBoqQuantity: tenderBoqQuantity,
    };

    if (editingBill) {
      updateRABill(editingBill.id, payload);
      showToast(`Updated RA Bill ${payload.billNo} successfully.`);
    } else {
      addRABill(payload);
      showToast(`Added RA Bill ${payload.billNo} to site register.`);
    }

    setIsFormOpen(false);
  };

  // Status toggle handler
  const handleToggleStatus = (bill: ContractorRABill) => {
    const nextStatus =
      bill.paymentStatus === 'Draft'
        ? 'Certified'
        : bill.paymentStatus === 'Certified'
        ? 'Paid'
        : 'Draft';
    updateRABill(bill.id, { paymentStatus: nextStatus });
    showToast(`Bill ${bill.billNo} marked as ${nextStatus}.`);
  };

  // Record Payment in Petty Cash / Ledger
  const handleRecordPaymentInPettyCash = (bill: ContractorRABill) => {
    const voucherRef = bill.voucherNo || `V-RA-${bill.billNo}`;
    addPettyCashEntry({
      date: new Date().toISOString().split('T')[0],
      type: 'Expense',
      category: 'Contractor RA Bill',
      amount: bill.netPayable,
      voucherNo: voucherRef,
      description: `Contractor RA Bill payment to ${bill.contractorName} for ${bill.workTrade} (${bill.billNo})`,
      receiverOrSupplier: bill.contractorName,
      approvedBy: 'Project Director',
      paymentMode: 'Bank',
    });
    updateRABill(bill.id, { paymentStatus: 'Paid', voucherNo: voucherRef });
    showToast(`Logged payment of ৳ ${bill.netPayable.toLocaleString()} in Petty Cash / Ledger (Voucher: ${voucherRef}) & marked bill as Paid.`);
  };

  // Delete bill handler
  const handleDelete = (id: string, no: string) => {
    if (confirm(`Are you sure you want to delete ${no}? This cannot be undone.`)) {
      deleteRABill(id);
      showToast(`Deleted ${no}.`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredBills.length === 0) {
      showToast('⚠️ No bills to export.');
      return;
    }
    const headers = [
      'Bill No',
      'Date',
      'Contractor',
      'Work Trade',
      'Unit',
      'Contract Rate',
      'Previous Qty',
      'Current Qty',
      'Total Cumulative Qty',
      'Current Gross',
      'Total Gross',
      'Retention %',
      'Retention Held',
      'Advance Deducted',
      'AIT/VAT Deducted',
      'Net Payable',
      'Status',
      'Voucher Ref',
      'Remarks',
    ];
    const rows = filteredBills.map((b) => [
      `"${b.billNo}"`,
      `"${b.date}"`,
      `"${b.contractorName.replace(/"/g, '""')}"`,
      `"${b.workTrade.replace(/"/g, '""')}"`,
      `"${b.unit}"`,
      b.contractRate,
      b.previousMeasuredQty,
      b.currentMeasuredQty,
      b.totalCumulativeQty,
      b.currentGrossAmount,
      b.totalGrossAmount,
      `${b.retentionPercent}%`,
      b.retentionAmount,
      b.advanceDeducted,
      b.taxVatDeducted,
      b.netPayable,
      `"${b.paymentStatus}"`,
      `"${b.voucherNo || ''}"`,
      `"${(b.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Contractor_RA_Bills_${activeProjectId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 text-white shadow-xl text-sm font-medium animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Module 06 • ERP-06
            </span>
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Project: {activeProjectId}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-[var(--md-sys-color-on-surface)] tracking-tight">
            Sub-Contractor RA Bill & Measurement Tracker
          </h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-2xl font-serif">
            Sequential Running Account (RA) Certification with cumulative joint measurements, security retention holding, and multi-tier approval sign-offs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New RA Bill</span>
          </button>
        </div>
      </div>

      {/* High-level Financial Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Total Gross Certified
            </span>
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[var(--md-sys-color-on-surface)] tabular-nums">
            ৳ {financialSummary.totalContractorGrossCertified.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
            Across {siteData.raBills.length} recorded RA bill cycles
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Retention Money Held
            </span>
            <div className="p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-amber-600 dark:text-amber-400 tabular-nums">
            ৳ {financialSummary.totalContractorRetentionHeld.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
            5% - 10% Security Deposit held until handover
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Advances & Deductions
            </span>
            <div className="p-2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[var(--md-sys-color-on-surface)] tabular-nums">
            ৳{' '}
            {siteData.raBills
              .reduce((sum, b) => sum + b.advanceDeducted + b.taxVatDeducted, 0)
              .toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
            Advance recovery + Tax/VAT withheld
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-purple-500/30 bg-purple-500/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              Net Payable / Certified
            </span>
            <div className="p-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-purple-600 dark:text-purple-400 tabular-nums">
            ৳ {financialSummary.totalContractorNetPaid.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
            Net disbursement to trade contractors
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
          <input
            type="text"
            placeholder="Search by Bill No, Contractor Name, Work Trade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-serif"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] font-serif">
            <Filter className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Certified">Certified</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {uniqueContractors.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] font-serif">
              <User className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
              <select
                value={contractorFilter}
                onChange={(e) => setContractorFilter(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="All">All Contractors</option>
                {uniqueContractors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bills Ledger Table */}
      <div className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                <th className="py-3.5 px-4">Bill No & Date</th>
                <th className="py-3.5 px-4">Sub-Contractor & Trade</th>
                <th className="py-3.5 px-4 text-right">Rate</th>
                <th className="py-3.5 px-4 text-right">Measurements (Qty)</th>
                <th className="py-3.5 px-4 text-right">Current Gross</th>
                <th className="py-3.5 px-4 text-right">Retention</th>
                <th className="py-3.5 px-4 text-right">Deductions</th>
                <th className="py-3.5 px-4 text-right">Net Payable</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-xs font-serif">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-600" />
                    <p className="font-medium text-sm">No Sub-Contractor RA Bills Found</p>
                    <p className="text-xs opacity-75 mt-0.5">Click "+ New RA Bill" to record your first measurement cycle.</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors group"
                  >
                    {/* Bill No & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                        <span>{bill.billNo}</span>
                        {bill.voucherNo && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]">
                            {bill.voucherNo}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                        {bill.date}
                      </div>
                    </td>

                    {/* Contractor & Trade */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                        {bill.contractorName}
                      </div>
                      <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                        {bill.workTrade}
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <span className="font-medium">৳ {bill.contractRate}</span>
                      <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                        per {bill.unit}
                      </span>
                    </td>

                    {/* Measurements */}
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <div className="font-semibold text-purple-700 dark:text-purple-300">
                        {bill.currentMeasuredQty.toLocaleString()} {bill.unit}
                      </div>
                      <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                        Prev: {bill.previousMeasuredQty.toLocaleString()} • Total: {bill.totalCumulativeQty.toLocaleString()}
                      </div>
                      {bill.tenderBoqQuantity !== undefined && (
                        <div className="mt-1">
                          {bill.totalCumulativeQty > bill.tenderBoqQuantity ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                              ⚠️ Over-run ({bill.totalCumulativeQty.toLocaleString()} / {bill.tenderBoqQuantity.toLocaleString()})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              ✓ Tender: {bill.tenderBoqQuantity.toLocaleString()} {bill.unit}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Current Gross */}
                    <td className="py-3.5 px-4 text-right font-medium tabular-nums text-[var(--md-sys-color-on-surface)]">
                      ৳ {bill.currentGrossAmount.toLocaleString()}
                    </td>

                    {/* Retention */}
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        - ৳ {bill.retentionAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                        ({bill.retentionPercent}%)
                      </span>
                    </td>

                    {/* Deductions */}
                    <td className="py-3.5 px-4 text-right tabular-nums text-rose-600 dark:text-rose-400">
                      <div>- ৳ {(bill.advanceDeducted + bill.taxVatDeducted).toLocaleString()}</div>
                      <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                        Adv: ৳{bill.advanceDeducted.toLocaleString()} • Tax: ৳{bill.taxVatDeducted.toLocaleString()}
                      </div>
                    </td>

                    {/* Net Payable & Ledger Sync */}
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        ৳ {bill.netPayable.toLocaleString()}
                      </div>
                      {bill.paymentStatus !== 'Paid' ? (
                        <button
                          type="button"
                          onClick={() => handleRecordPaymentInPettyCash(bill)}
                          title="Record Payment in Petty Cash / Ledger (SM-07)"
                          className="mt-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Record Payment in Petty Cash / Ledger</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 mt-1">
                          <Check className="w-3 h-3" /> Paid in Ledger
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(bill)}
                        title="Click to cycle status: Draft -> Certified -> Paid"
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-transform active:scale-95 ${
                          bill.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : bill.paymentStatus === 'Certified'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {bill.paymentStatus === 'Paid' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : bill.paymentStatus === 'Certified' ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{bill.paymentStatus}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedBillForPrint(bill)}
                          title="Print / View A4 RA Bill Slip"
                          className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] transition-colors"
                        >
                          <Printer className="w-4 h-4 text-purple-600" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(bill)}
                          title="Edit Bill"
                          className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bill.id, bill.billNo)}
                          title="Delete Bill"
                          className="p-1.5 rounded-full hover:bg-rose-500/10 text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
              <div>
                <h3 className="text-xl font-bold font-serif text-[var(--md-sys-color-on-surface)]">
                  {editingBill ? `Edit Sub-Contractor RA Bill (${editingBill.billNo})` : 'New Sub-Contractor RA Bill'}
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-serif">
                  Calculate gross measurements, security retention holding, and net payable disbursement.
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBill} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                    Bill No / Code
                  </label>
                  <input
                    type="text"
                    required
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="e.g. RA-02"
                    className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                    Bill Date
                  </label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                    Voucher / Reference
                  </label>
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    placeholder="e.g. V-RA-02-CERT"
                    className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-mono"
                  />
                </div>
              </div>

              {/* Contractor & Trade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                    Contractor / Agency Name
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={contractorName}
                      onChange={(e) => setContractorName(e.target.value)}
                      placeholder="e.g. M/S Eastern Civil Builders"
                      className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                    />
                    {uniqueContractors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                        <span className="opacity-75">Recent:</span>
                        {uniqueContractors.slice(0, 3).map((name) => (
                          <button
                            type="button"
                            key={name}
                            onClick={() => handleContractorSelect(name)}
                            className="px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[10px] hover:text-purple-600 transition-colors"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Link to BOQ Tender Item */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                      <span>Link to BOQ Tender Item (Continuous Tracking)</span>
                    </label>
                    {tenderBoqQuantity !== undefined && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-semibold">
                        Tender Ceiling: {tenderBoqQuantity.toLocaleString()} {unit}
                      </span>
                    )}
                  </div>
                  <select
                    value={linkedBoqItemId}
                    onChange={(e) => handleSelectBoqItem(e.target.value)}
                    className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                  >
                    <option value="">-- Manual Site Trade (Not linked to BOQ) --</option>
                    {(activeWorkspace?.boq?.items || []).map((it: TakeoffLineItem) => {
                      const qty =
                        it.numberOfMembers * it.lengthM * it.widthM * it.heightM -
                        (it.deductionQty || 0);
                      return (
                        <option key={it.id} value={it.id}>
                          {it.itemNo}: {it.description} (Tender: {qty.toFixed(1)} {it.unit} @ ৳{it.unitRate})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                    Work Trade / Scope
                  </label>
                  <select
                    value={workTrade}
                    onChange={(e) => setWorkTrade(e.target.value)}
                    className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                  >
                    {COMMON_TRADES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Measurement Numbers */}
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
                  <span>Joint Measurement & Rate Breakdown</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">
                    Total Qty: {totalQtyCalc.toLocaleString()} {unit}
                  </span>
                </div>

                {tenderBoqQuantity !== undefined && totalQtyCalc > tenderBoqQuantity && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>BOQ Quantity Over-run:</strong> Total measured {totalQtyCalc.toLocaleString()} {unit} exceeds tender ceiling {tenderBoqQuantity.toLocaleString()} {unit} by {(totalQtyCalc - tenderBoqQuantity).toLocaleString()} {unit} ({((totalQtyCalc / tenderBoqQuantity - 1) * 100).toFixed(1)}% excess).
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-full text-xs bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Agreed Rate (৳)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={contractRate}
                      onChange={(e) => setContractRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-full text-xs bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Previous Qty
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={previousMeasuredQty}
                      onChange={(e) => setPreviousMeasuredQty(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-full text-xs bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Current Bill Qty
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={currentMeasuredQty}
                      onChange={(e) => setCurrentMeasuredQty(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-full text-xs bg-[var(--md-sys-color-surface)] border border-purple-500/40 font-bold tabular-nums"
                    />
                  </div>
                </div>

                {/* Gross Amount Display */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)] text-xs">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Current Bill Gross:</span>
                  <span className="font-bold text-sm text-[var(--md-sys-color-on-surface)] tabular-nums">
                    ৳ {currentGrossCalc.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Deductions & Retention */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                      Retention Held
                    </label>
                    <span className="text-xs font-bold text-amber-600 tabular-nums">
                      {retentionPercent}% = ৳ {retentionAmountCalc.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[0, 5, 7.5, 10].map((pct) => (
                      <button
                        type="button"
                        key={pct}
                        onClick={() => setRetentionPercent(pct)}
                        className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                          retentionPercent === pct
                            ? 'bg-amber-600 text-white font-bold shadow-sm'
                            : 'bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                    Advance Deducted (৳)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={advanceDeducted}
                    onChange={(e) => setAdvanceDeducted(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] tabular-nums"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                      Tax / VAT (AIT)
                    </label>
                    <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
                      ৳ {taxAmountCalc.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[0, 2, 3, 5].map((pct) => (
                      <button
                        type="button"
                        key={pct}
                        onClick={() => setTaxPercent(pct)}
                        className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                          taxPercent === pct
                            ? 'bg-purple-600 text-white font-bold shadow-sm'
                            : 'bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight Card */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Net Certified Disbursement
                  </span>
                  <div className="text-2xl font-bold font-serif text-emerald-700 dark:text-emerald-300 tabular-nums">
                    ৳ {netPayableCalc.toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--md-sys-color-on-surface-variant)] font-serif">
                  <p>Gross: ৳ {currentGrossCalc.toLocaleString()}</p>
                  <p className="text-rose-600 dark:text-rose-400">
                    Deductions: - ৳ {(retentionAmountCalc + advanceDeductedNum + taxAmountCalc).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Status and Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                  >
                    <option value="Draft">Draft (Site Verification Pending)</option>
                    <option value="Certified">Certified (Passed by Project Manager)</option>
                    <option value="Paid">Paid (Account Disbursement Complete)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                    Remarks / Location Notes
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Verified joint measurement with Foreman on site"
                    className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-medium border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBill ? 'Update RA Bill' : 'Save & Certify Bill'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE A4 SLIP MODAL */}
      {selectedBillForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
          <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-white text-zinc-900 border border-zinc-200 shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between p-4 bg-zinc-100 border-b border-zinc-200 print:hidden">
              <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Official RA Bill Certificate Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4 Slip</span>
                </button>
                <button
                  onClick={() => setSelectedBillForPrint(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* A4 Document Body */}
            <div className="p-8 md:p-12 space-y-6 font-serif">
              {/* Header */}
              <div className="text-center pb-6 border-b-2 border-zinc-800 space-y-1">
                <h2 className="text-2xl font-bold tracking-tight uppercase">BD. CivilLab Engineering & Construction</h2>
                <p className="text-xs text-zinc-600 uppercase tracking-widest font-sans">
                  Project Site Operations & Sub-Contractor Management System
                </p>
                <div className="inline-block mt-2 px-4 py-1 rounded-full bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider">
                  Running Account (RA) Bill Certificate
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p><span className="font-semibold text-zinc-500 uppercase">Project ID:</span> {activeProjectId}</p>
                  <p><span className="font-semibold text-zinc-500 uppercase">Contractor:</span> <strong className="text-sm">{selectedBillForPrint.contractorName}</strong></p>
                  <p><span className="font-semibold text-zinc-500 uppercase">Trade/Scope:</span> {selectedBillForPrint.workTrade}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p><span className="font-semibold text-zinc-500 uppercase">Bill Number:</span> <strong className="text-sm font-mono">{selectedBillForPrint.billNo}</strong></p>
                  <p><span className="font-semibold text-zinc-500 uppercase">Certification Date:</span> {selectedBillForPrint.date}</p>
                  <p><span className="font-semibold text-zinc-500 uppercase">Voucher Ref:</span> {selectedBillForPrint.voucherNo || 'N/A'}</p>
                </div>
              </div>

              {/* Joint Measurement Table */}
              <div className="overflow-hidden border border-zinc-300 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[10px] border-b border-zinc-300">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Contract Rate</th>
                      <th className="py-2.5 px-3 text-right">Previous Qty</th>
                      <th className="py-2.5 px-3 text-right">Current Qty</th>
                      <th className="py-2.5 px-3 text-right">Total Up-to-Date</th>
                      <th className="py-2.5 px-3 text-right">Gross Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    <tr>
                      <td className="py-3 px-3">
                        <div className="font-bold">{selectedBillForPrint.workTrade}</div>
                        <div className="text-[10px] text-zinc-500">{selectedBillForPrint.remarks || 'Site execution per technical specs.'}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{selectedBillForPrint.unit}</td>
                      <td className="py-3 px-3 text-right font-mono">৳ {selectedBillForPrint.contractRate.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono">{selectedBillForPrint.previousMeasuredQty.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{selectedBillForPrint.currentMeasuredQty.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{selectedBillForPrint.totalCumulativeQty.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">৳ {selectedBillForPrint.currentGrossAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions & Net Payable Summary */}
              <div className="flex justify-end">
                <div className="w-full sm:w-1/2 space-y-2 text-xs border-t border-zinc-200 pt-2">
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-600">Current Gross Work Certified:</span>
                    <span className="font-bold font-mono">৳ {selectedBillForPrint.currentGrossAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-amber-700">
                    <span>Less: Security Retention ({selectedBillForPrint.retentionPercent}%):</span>
                    <span className="font-mono">- ৳ {selectedBillForPrint.retentionAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-rose-700">
                    <span>Less: Advance Recovered:</span>
                    <span className="font-mono">- ৳ {selectedBillForPrint.advanceDeducted.toLocaleString()}</span>
                  </div>
                  {selectedBillForPrint.taxVatDeducted > 0 && (
                    <div className="flex justify-between py-1 text-rose-700">
                      <span>Less: AIT / Tax Withheld:</span>
                      <span className="font-mono">- ৳ {selectedBillForPrint.taxVatDeducted.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2.5 border-t-2 border-zinc-800 text-sm font-bold text-zinc-950">
                    <span>Net Amount Payable:</span>
                    <span className="text-base font-mono">৳ {selectedBillForPrint.netPayable.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 3-Tier Signatures Block */}
              <div className="pt-16 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="border-t border-zinc-400 pt-2 space-y-0.5">
                  <p className="font-bold">Prepared By</p>
                  <p className="text-[10px] text-zinc-500">Site Engineer</p>
                </div>
                <div className="border-t border-zinc-400 pt-2 space-y-0.5">
                  <p className="font-bold">Checked & Certified By</p>
                  <p className="text-[10px] text-zinc-500">Project Manager / QS</p>
                </div>
                <div className="border-t border-zinc-400 pt-2 space-y-0.5">
                  <p className="font-bold">Accepted & Received By</p>
                  <p className="text-[10px] text-zinc-500">Sub-Contractor Representative</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
