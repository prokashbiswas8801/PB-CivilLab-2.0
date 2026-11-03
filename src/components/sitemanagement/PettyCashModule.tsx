import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Trash2,
  Edit2,
  Printer,
  Download,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Coffee,
  Hammer,
  Truck,
  Wrench,
  Fuel,
  Printer as PrintIcon,
  HelpCircle,
  X,
  Check,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { useOfflineSync } from '../../context/OfflineSyncContext';
import { PettyCashTransaction, PettyCashType, PettyCashCategory } from '../../types/siteManagement';

const CATEGORIES: Array<{ key: PettyCashCategory; label: string; icon: any }> = [
  { key: 'Labor Snacks', label: 'Labor Snacks (নাস্তা/চা)', icon: Coffee },
  { key: 'Hardware/GI Wire/Nails', label: 'Hardware (পেরেক/তার)', icon: Hammer },
  { key: 'Transport/Van', label: 'Transport/Van (ভ্যান ভাড়া)', icon: Truck },
  { key: 'Tools', label: 'Minor Tools (ছোট যন্ত্রপাতি)', icon: Wrench },
  { key: 'Fuel/Generator', label: 'Fuel/Generator (ডিজেল/অকটেন)', icon: Fuel },
  { key: 'Printing/Stationery', label: 'Printing/Stationery (কাগজ/প্রিন্ট)', icon: PrintIcon },
  { key: 'Misc', label: 'Miscellaneous (বিবিধ খরচ)', icon: HelpCircle },
];

export const PettyCashModule: React.FC = () => {
  const {
    siteData,
    activeProjectId,
    addPettyCashEntry,
    updatePettyCashEntry,
    deletePettyCashEntry,
    financialSummary,
  } = useSiteManagement();
  const { isOnline, stats, triggerSyncNow, isSyncing, isEntityPending } = useOfflineSync();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | PettyCashType>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | PettyCashCategory>('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PettyCashTransaction | null>(null);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<PettyCashTransaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [entryType, setEntryType] = useState<PettyCashType>('Expense');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<PettyCashCategory>('Labor Snacks');
  const [amount, setAmount] = useState<number | ''>('');
  const [voucherNo, setVoucherNo] = useState('');
  const [description, setDescription] = useState('');
  const [receiverOrSupplier, setReceiverOrSupplier] = useState('');
  const [approvedBy, setApprovedBy] = useState('Engr. Site In-Charge');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return siteData.pettyCash.filter((t) => {
      const matchSearch =
        t.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.receiverOrSupplier && t.receiverOrSupplier.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = typeFilter === 'All' || t.type === typeFilter;
      const matchCategory = categoryFilter === 'All' || t.category === categoryFilter;

      return matchSearch && matchType && matchCategory;
    });
  }, [siteData.pettyCash, searchQuery, typeFilter, categoryFilter]);

  // Expenses breakdown by category
  const categorySpendSummary = useMemo(() => {
    const map: Record<string, number> = {};
    siteData.pettyCash
      .filter((p) => p.type === 'Expense')
      .forEach((p) => {
        map[p.category] = (map[p.category] || 0) + p.amount;
      });
    return map;
  }, [siteData.pettyCash]);

  // Handle open create
  const handleOpenCreate = (type: PettyCashType = 'Expense') => {
    setEditingEntry(null);
    setEntryType(type);
    setDate(new Date().toISOString().split('T')[0]);
    setCategory(type === 'Expense' ? 'Labor Snacks' : 'Misc');
    setAmount('');
    const nextSeq = siteData.pettyCash.length + 1;
    setVoucherNo(type === 'Expense' ? `V-PC-${nextSeq.toString().padStart(3, '0')}` : `HO-CASH-${nextSeq.toString().padStart(3, '0')}`);
    setDescription('');
    setReceiverOrSupplier('');
    setApprovedBy('Engr. Site In-Charge');
    setIsModalOpen(true);
  };

  // Handle open edit
  const handleOpenEdit = (entry: PettyCashTransaction) => {
    setEditingEntry(entry);
    setEntryType(entry.type);
    setDate(entry.date);
    setCategory(entry.category);
    setAmount(entry.amount);
    setVoucherNo(entry.voucherNo);
    setDescription(entry.description);
    setReceiverOrSupplier(entry.receiverOrSupplier || '');
    setApprovedBy(entry.approvedBy || 'Engr. Site In-Charge');
    setIsModalOpen(true);
  };

  // Handle save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('⚠️ Please enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      showToast('⚠️ Please enter a transaction description.');
      return;
    }

    const payload: Omit<PettyCashTransaction, 'id' | 'timestamp'> = {
      date,
      type: entryType,
      category,
      amount: numAmount,
      voucherNo: voucherNo.trim() || `PC-${Date.now().toString(36).toUpperCase()}`,
      description: description.trim(),
      receiverOrSupplier: receiverOrSupplier.trim() || undefined,
      approvedBy: approvedBy.trim() || undefined,
    };

    if (editingEntry) {
      updatePettyCashEntry(editingEntry.id, payload);
      showToast(`Updated entry ${payload.voucherNo}`);
    } else {
      addPettyCashEntry(payload);
      showToast(`Added ${entryType} of ৳ ${numAmount.toLocaleString()}`);
    }

    setIsModalOpen(false);
  };

  // Handle delete
  const handleDelete = (id: string, no: string) => {
    if (confirm(`Delete petty cash entry ${no}?`)) {
      deletePettyCashEntry(id);
      showToast(`Deleted ${no}`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('⚠️ No transactions to export.');
      return;
    }
    const headers = ['Voucher No', 'Date', 'Type', 'Category', 'Amount (BDT)', 'Party/Receiver', 'Description', 'Approved By'];
    const rows = filteredTransactions.map((t) => [
      `"${t.voucherNo}"`,
      `"${t.date}"`,
      `"${t.type}"`,
      `"${t.category}"`,
      t.amount,
      `"${(t.receiverOrSupplier || '').replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.approvedBy || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `PettyCash_Ledger_${activeProjectId}_${new Date().toISOString().split('T')[0]}.csv`);
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
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Module 07 • ERP-07
            </span>
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Project: {activeProjectId}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-[var(--md-sys-color-on-surface)] tracking-tight">
            Site Petty Cash & Daily Expense Ledger
          </h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-2xl font-serif">
            Track site engineer imprest fund replenishment, daily local purchases, labor refreshment bills, and instant cash-in-hand reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleOpenCreate('Cash Received')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Add Cash Received</span>
          </button>
          <button
            onClick={() => handleOpenCreate('Expense')}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>- New Expense</span>
          </button>
        </div>
      </div>

      {/* Core Imprest Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Cash Inward / Imprest */}
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Total Imprest Received
            </span>
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[var(--md-sys-color-on-surface)] tabular-nums">
            ৳ {financialSummary.totalPettyCashInward.toLocaleString()}
          </div>
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
            From Head Office / Client transfers
          </span>
        </div>

        {/* Total Expenses Spent */}
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Total Site Expenses
            </span>
            <div className="p-2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-rose-600 dark:text-rose-400 tabular-nums">
            ৳ {financialSummary.totalPettyCashSpent.toLocaleString()}
          </div>
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
            Minor site materials, snacks & transport
          </span>
        </div>

        {/* Current Cash in Hand */}
        <div
          className={`p-5 rounded-3xl border shadow-sm transition-all ${
            financialSummary.pettyCashBalance < 2000
              ? 'bg-amber-500/10 border-amber-500/40'
              : 'bg-emerald-500/10 border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
              Current Cash in Hand
            </span>
            <div
              className={`p-2 rounded-full ${
                financialSummary.pettyCashBalance < 2000
                  ? 'bg-amber-500/20 text-amber-600'
                  : 'bg-emerald-500/20 text-emerald-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-serif tabular-nums ${
              financialSummary.pettyCashBalance < 2000
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-emerald-700 dark:text-emerald-300'
            }`}
          >
            ৳ {financialSummary.pettyCashBalance.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {financialSummary.pettyCashBalance < 2000 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-3 h-3" /> Low Balance Alert! Request Replenishment
              </span>
            ) : (
              <span className="text-xs text-emerald-700 dark:text-emerald-400">
                Healthy Site Imprest Reserve
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Offline & Sync Status Banner */}
      {(!isOnline || stats.pettyCashPending > 0) && (
        <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans shadow-xs ${
          !isOnline
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {!isOnline ? (
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {!isOnline ? 'Offline Imprest Mode: ' : 'Local Vouchers Queued: '}
              </span>
              <span>
                {stats.pettyCashPending > 0
                  ? `${stats.pettyCashPending} petty cash transaction${stats.pettyCashPending > 1 ? 's' : ''} stored safely in local cache.`
                  : 'Cash advances and expense receipts are safely recorded locally.'}
                {' Data will automatically push to cloud when connection is active.'}
              </span>
            </div>
          </div>
          {isOnline && stats.pettyCashPending > 0 && (
            <button
              type="button"
              onClick={() => triggerSyncNow()}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 inline-flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : `Push Vouchers (${stats.pettyCashPending})`}</span>
            </button>
          )}
        </div>
      )}

      {/* Category Spend Distribution Cards */}
      <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-3">
          Expense Breakdown by Head
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map(({ key, label, icon: Icon }) => {
            const amount = categorySpendSummary[key] || 0;
            const pct =
              financialSummary.totalPettyCashSpent > 0
                ? Math.round((amount / financialSummary.totalPettyCashSpent) * 100)
                : 0;

            return (
              <div
                key={key}
                onClick={() => setCategoryFilter(categoryFilter === key ? 'All' : key)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  categoryFilter === key
                    ? 'bg-rose-500/15 border-rose-500 shadow-sm'
                    : 'bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <Icon className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                    {pct}%
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                  {key}
                </div>
                <div className="text-xs font-bold font-serif text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                  ৳ {amount.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
          <input
            type="text"
            placeholder="Search by Voucher No, Item Description, Payee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-serif"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] font-serif">
            <Filter className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Expense">Expenses Only</option>
              <option value="Cash Received">Cash Received</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] font-serif">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.key}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                <th className="py-3.5 px-4">Voucher No & Date</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description / Purpose</th>
                <th className="py-3.5 px-4">Payee / Party</th>
                <th className="py-3.5 px-4 text-right">Debit (Expense)</th>
                <th className="py-3.5 px-4 text-right">Credit (Received)</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-xs font-serif">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
                    <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
                    <p className="font-medium text-sm">No Petty Cash Transactions Found</p>
                    <p className="text-xs opacity-75 mt-0.5">Use the buttons above to log expenses or imprest cash.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors group"
                  >
                    {/* Voucher No & Date */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 flex-wrap">
                        <span>{tx.voucherNo}</span>
                        {isEntityPending('petty-cash', tx.id) ? (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> Pending
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 inline-flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Synced
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                        {tx.date}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.type === 'Cash Received'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {tx.type === 'Cash Received' ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        <span>{tx.type}</span>
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-[var(--md-sys-color-on-surface)]">
                        {tx.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-[280px]">
                      <div className="text-[var(--md-sys-color-on-surface)] font-medium line-clamp-2">
                        {tx.description}
                      </div>
                      {tx.approvedBy && (
                        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                          Auth: {tx.approvedBy}
                        </div>
                      )}
                    </td>

                    {/* Payee / Party */}
                    <td className="py-3 px-4 text-[var(--md-sys-color-on-surface-variant)]">
                      {tx.receiverOrSupplier || '—'}
                    </td>

                    {/* Debit */}
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-rose-600 dark:text-rose-400">
                      {tx.type === 'Expense' ? `৳ ${tx.amount.toLocaleString()}` : '—'}
                    </td>

                    {/* Credit */}
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-blue-600 dark:text-blue-400">
                      {tx.type === 'Cash Received' ? `৳ ${tx.amount.toLocaleString()}` : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedVoucherForPrint(tx)}
                          title="Print Voucher Slip"
                          className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] transition-colors"
                        >
                          <Printer className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          title="Edit Transaction"
                          className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id, tx.voucherNo)}
                          title="Delete Transaction"
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

      {/* CREATE / EDIT TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
              <div>
                <h3 className="text-xl font-bold font-serif text-[var(--md-sys-color-on-surface)]">
                  {editingEntry ? 'Edit Transaction' : entryType === 'Expense' ? 'Record Site Expense' : 'Receive Imprest Cash'}
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-serif">
                  Immediately updates site cash-in-hand and project financial rollup.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div className="flex p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
                <button
                  type="button"
                  onClick={() => setEntryType('Expense')}
                  className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    entryType === 'Expense'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  Site Expense (Debit -)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('Cash Received')}
                  className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    entryType === 'Cash Received'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  Cash Inward (Credit +)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Voucher No
                  </label>
                  <input
                    type="text"
                    required
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Category Head
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Amount (৳ BDT)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-rose-500/40 font-bold tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Description / Purpose
                </label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Purchased 10kg GI wire and 5kg 2-inch steel nails for slab shuttering."
                  className="w-full px-4 py-2 rounded-2xl text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    {entryType === 'Expense' ? 'Shop / Payee' : 'Source / Sender'}
                  </label>
                  <input
                    type="text"
                    value={receiverOrSupplier}
                    onChange={(e) => setReceiverOrSupplier(e.target.value)}
                    placeholder="e.g. M/S Bismillah Hardware"
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Authorized By
                  </label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-full text-xs font-medium border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-medium text-white shadow-md ${
                    entryType === 'Expense' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEntry ? 'Update Entry' : 'Save Transaction'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE PETTY CASH VOUCHER SLIP */}
      {selectedVoucherForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
          <div className="relative w-full max-w-lg my-8 rounded-3xl bg-white text-zinc-900 border border-zinc-200 shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
            {/* Modal Controls */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-100 border-b border-zinc-200 print:hidden">
              <span className="text-xs font-semibold text-zinc-600 uppercase">
                Petty Cash Debit / Credit Voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedVoucherForPrint(null)}
                  className="p-1 rounded-full hover:bg-zinc-200 text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Voucher Body */}
            <div className="p-8 space-y-5 font-serif">
              <div className="text-center pb-4 border-b border-zinc-800">
                <h3 className="text-lg font-bold uppercase tracking-tight">PB CivilLab Construction Site</h3>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-sans">
                  Site Imprest Cash Voucher
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-zinc-900 text-white text-[11px] font-bold uppercase">
                  {selectedVoucherForPrint.type} Voucher
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-semibold text-zinc-500 uppercase">Voucher No:</span> <strong className="font-mono">{selectedVoucherForPrint.voucherNo}</strong></div>
                <div className="text-right"><span className="font-semibold text-zinc-500 uppercase">Date:</span> {selectedVoucherForPrint.date}</div>
                <div><span className="font-semibold text-zinc-500 uppercase">Category:</span> {selectedVoucherForPrint.category}</div>
                <div className="text-right"><span className="font-semibold text-zinc-500 uppercase">Payee/Party:</span> {selectedVoucherForPrint.receiverOrSupplier || 'N/A'}</div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-300 space-y-2">
                <div className="text-xs text-zinc-700">
                  <span className="font-semibold uppercase text-[10px] text-zinc-500 block">Particulars / Details:</span>
                  <p className="mt-1 font-medium">{selectedVoucherForPrint.description}</p>
                </div>
                <div className="pt-2 border-t border-zinc-300 flex justify-between items-center text-sm font-bold">
                  <span>Amount Paid / Received:</span>
                  <span className="text-base font-mono">৳ {selectedVoucherForPrint.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-10 grid grid-cols-2 gap-4 text-center text-xs">
                <div className="border-t border-zinc-400 pt-1.5">
                  <p className="font-bold">Prepared By</p>
                  <p className="text-[10px] text-zinc-500">Site Accountant / Engineer</p>
                </div>
                <div className="border-t border-zinc-400 pt-1.5">
                  <p className="font-bold">{selectedVoucherForPrint.approvedBy || 'Project In-Charge'}</p>
                  <p className="text-[10px] text-zinc-500">Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
