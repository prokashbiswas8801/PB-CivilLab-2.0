import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  CreditCard,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Phone,
  Briefcase,
  TrendingUp,
  Coins,
  ShieldCheck,
  Share2,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { useOfflineSync } from '../../context/OfflineSyncContext';
import {
  LaborWorker,
  TradeCategory,
  AttendanceStatus,
  DailyAttendanceRecord,
  WorkerPaymentRecord,
} from '../../types/siteManagement';

const TRADE_CATEGORIES: { key: TradeCategory; label: string; bengali: string }[] = [
  { key: 'Head Mason', label: 'Head Mason', bengali: 'রাজমিস্ত্রি লিডার' },
  { key: 'Mason', label: 'Mason', bengali: 'রাজমিস্ত্রি' },
  { key: 'Helper/Jogali', label: 'Helper / Jogali', bengali: 'জোগালি' },
  { key: 'Bar Bender', label: 'Bar Bender', bengali: 'রডমিস্ত্রি' },
  { key: 'Carpenter', label: 'Carpenter (Shuttering)', bengali: 'কাঠমিস্ত্রি / শাটারিং' },
  { key: 'Plumber', label: 'Plumber', bengali: 'প্লাম্বার' },
  { key: 'Electrician', label: 'Electrician', bengali: 'ইলেকট্রিশিয়ান' },
  { key: 'Painter', label: 'Painter', bengali: 'পেইন্টার' },
  { key: 'Custom', label: 'Other Trades', bengali: 'অন্যান্য' },
];

export const LaborAttendanceModule: React.FC = () => {
  const {
    siteData,
    activeProjectId,
    addWorker,
    updateWorker,
    deleteWorker,
    recordDailyAttendance,
    recordWorkerPayment,
    getWorkerMonthlySummary,
    addPettyCashEntry,
  } = useSiteManagement();
  const { isOnline, stats, triggerSyncNow, isSyncing } = useOfflineSync();

  // Current Month/Year selector (default to current YYYY-MM)
  const today = new Date();
  const currentMonthStr = today.toISOString().slice(0, 7); // e.g. "2026-11"
  const currentDayNum = today.getDate();

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedTrade, setSelectedTrade] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'grid' | 'wages' | 'workers'>('grid');

  // Modals & Popovers
  const [addWorkerModalOpen, setAddWorkerModalOpen] = useState<boolean>(false);
  const [cellPopover, setCellPopover] = useState<{
    workerId: string;
    workerName: string;
    day: number;
    currentRecord: DailyAttendanceRecord;
  } | null>(null);
  const [payoutModalWorker, setPayoutModalWorker] = useState<LaborWorker | null>(null);
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    type: 'Wage Payout' as WorkerPaymentRecord['type'],
    paymentMethod: 'Cash' as WorkerPaymentRecord['paymentMethod'],
    voucherRef: '',
    remarks: '',
    syncToPettyCash: true,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Worker Form State
  const [workerForm, setWorkerForm] = useState({
    name: '',
    phone: '',
    trade: 'Mason' as TradeCategory,
    customTrade: '',
    dailyWage: '900',
    overtimeRatePerHr: '130',
    joiningDate: today.toISOString().split('T')[0],
    nidPassport: '',
    emergencyContact: '',
  });

  // Calculate Days in Selected Month
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate(); // e.g. 30 for Nov, 31 for Dec
  }, [selectedMonth]);

  // Days array: [1, 2, ..., 30/31]
  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Filtered Workers
  const filteredWorkers = useMemo(() => {
    return siteData.workers.filter((w) => {
      const matchTrade = selectedTrade === 'All' || w.trade === selectedTrade;
      const matchSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.phone.includes(searchQuery) ||
        w.trade.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTrade && matchSearch;
    });
  }, [siteData.workers, selectedTrade, searchQuery]);

  // Total Site Monthly Rollup Stats
  const siteMonthlyStats = useMemo(() => {
    let totalPresentDays = 0;
    let totalOtHours = 0;
    let totalGrossWages = 0;
    let totalKhoraki = 0;
    let totalDirectPaid = 0;
    let totalNetDue = 0;

    siteData.workers.forEach((w) => {
      const summary = getWorkerMonthlySummary(w.id, selectedMonth);
      totalPresentDays += summary.presentDays + summary.halfDays * 0.5;
      totalOtHours += summary.totalOtHours;
      totalGrossWages += summary.grossWage;
      totalKhoraki += summary.totalKhoraki;
      totalDirectPaid += summary.totalDirectPaid;
      totalNetDue += summary.netBalanceDue;
    });

    return {
      totalWorkers: siteData.workers.length,
      totalPresentDays,
      totalOtHours,
      totalGrossWages,
      totalKhoraki,
      totalDirectPaid,
      totalNetDue,
    };
  }, [siteData.workers, selectedMonth, getWorkerMonthlySummary]);

  // Navigate Month
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  // Quick Action: Mark All Active Workers Present for Today
  const handleMarkAllPresentToday = () => {
    if (selectedMonth !== currentMonthStr) {
      if (!confirm(`Selected month is ${selectedMonth}, but today is in ${currentMonthStr}. Mark all present for day ${currentDayNum} of ${selectedMonth}?`)) {
        return;
      }
    }

    const todayDateStr = `${selectedMonth}-${currentDayNum.toString().padStart(2, '0')}`;
    let updatedCount = 0;

    siteData.workers.forEach((w) => {
      if (w.isActive) {
        recordDailyAttendance(w.id, todayDateStr, {
          status: 'P',
        });
        updatedCount++;
      }
    });

    showToast(`Marked ${updatedCount} workers PRESENT (P) for Day ${currentDayNum}!`);
  };

  // Add Worker Submit
  const handleAddWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.name.trim()) return;

    const created = addWorker({
      name: workerForm.name.trim(),
      phone: workerForm.phone.trim(),
      trade: workerForm.trade,
      customTrade: workerForm.customTrade.trim() || undefined,
      dailyWage: parseFloat(workerForm.dailyWage) || 900,
      overtimeRatePerHr: parseFloat(workerForm.overtimeRatePerHr) || 130,
      joiningDate: workerForm.joiningDate,
      isActive: true,
      nidPassport: workerForm.nidPassport.trim() || undefined,
      emergencyContact: workerForm.emergencyContact.trim() || undefined,
    });

    showToast(`Enrolled worker: ${created.name} (${created.trade})`);
    setAddWorkerModalOpen(false);
    setWorkerForm({
      name: '',
      phone: '',
      trade: 'Mason',
      customTrade: '',
      dailyWage: '900',
      overtimeRatePerHr: '130',
      joiningDate: today.toISOString().split('T')[0],
      nidPassport: '',
      emergencyContact: '',
    });
  };

  // Payout / Khoraki Submit
  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModalWorker) return;
    const amountNum = parseFloat(payoutForm.amount) || 0;
    if (amountNum <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const voucherCode = payoutForm.voucherRef.trim() || `V-LAB-${Date.now().toString().slice(-4)}`;

    recordWorkerPayment({
      workerId: payoutModalWorker.id,
      workerName: payoutModalWorker.name,
      date: todayStr,
      type: payoutForm.type,
      amount: amountNum,
      paymentMethod: payoutForm.paymentMethod,
      voucherRef: voucherCode,
      remarks: payoutForm.remarks.trim() || undefined,
    });

    if (payoutForm.syncToPettyCash) {
      addPettyCashEntry({
        date: todayStr,
        type: 'Expense',
        category: 'Labor Wage / Khoraki',
        amount: amountNum,
        voucherNo: voucherCode,
        description: `${payoutForm.type} for ${payoutModalWorker.name} (${payoutModalWorker.trade})${payoutForm.remarks ? ` - ${payoutForm.remarks}` : ''}`,
        receiverOrSupplier: payoutModalWorker.name,
        approvedBy: 'Site Engineer',
        paymentMode: payoutForm.paymentMethod === 'Bank Transfer' ? 'Bank' : (payoutForm.paymentMethod === 'bKash/Mobile' ? 'bKash/Nagad' : 'Cash'),
      });
    }

    showToast(`Recorded ${payoutForm.type} of ৳ ${amountNum.toLocaleString()} for ${payoutModalWorker.name}${payoutForm.syncToPettyCash ? ' & logged in Petty Cash' : ''}.`);
    setPayoutModalWorker(null);
    setPayoutForm({
      amount: '',
      type: 'Wage Payout',
      paymentMethod: 'Cash',
      voucherRef: '',
      remarks: '',
      syncToPettyCash: true,
    });
  };

  // Export CSV Muster Roll
  const handleExportCsv = () => {
    const headers = [
      'Worker ID',
      'Name',
      'Trade',
      'Phone',
      'Daily Wage (৳)',
      'OT Rate (৳/hr)',
      ...daysArray.map((d) => `Day ${d}`),
      'Total Present Days',
      'Total OT Hours',
      'Gross Wage (৳)',
      'Khoraki Advance (৳)',
      'Direct Paid (৳)',
      'Net Payable (৳)',
    ];

    const monthBook = siteData.attendance[selectedMonth] || {};

    const rows = siteData.workers.map((w) => {
      const summary = getWorkerMonthlySummary(w.id, selectedMonth);
      const workerDays = monthBook[w.id] || {};

      const daysCols = daysArray.map((d) => {
        const rec = workerDays[d];
        if (!rec) return '—';
        if (rec.status === 'OT') return `OT(${rec.overtimeHours || 0}h)`;
        return rec.status;
      });

      return [
        `"${w.id}"`,
        `"${w.name.replace(/"/g, '""')}"`,
        `"${w.trade}"`,
        `"${w.phone}"`,
        w.dailyWage,
        w.overtimeRatePerHr,
        ...daysCols,
        (summary.presentDays + summary.halfDays * 0.5).toFixed(1),
        summary.totalOtHours,
        summary.grossWage,
        summary.totalKhoraki,
        summary.totalDirectPaid,
        summary.netBalanceDue,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Muster_Roll_${activeProjectId}_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported Muster Roll CSV!');
  };

  // Helper: Format Bengali Month Title
  const monthDisplayName = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const dateObj = new Date(year, month - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Muster Roll & Khoraki Ledger
              </span>
              <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                {activeProjectId}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
              Present Book / হাজিরা খাতা ও মজুরি হিসাব
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl">
              Authentic full-month construction muster roll: 1-to-31 daily attendance, overtime tracking, Khoraki (খোরাকি/advance) deductions, and automated wage settlement.
            </p>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllPresentToday}
              className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Fast jobsite check: marks all active workers present for today with one tap"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Mark All Present for Today</span>
            </button>

            <button
              type="button"
              onClick={() => setAddWorkerModalOpen(true)}
              className="px-3.5 py-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Enrol Worker</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="p-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs cursor-pointer transition-colors"
              title="Export Full Month Muster Roll CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs cursor-pointer transition-colors"
              title="Print Monthly Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Monthly Financial Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--md-sys-color-outline)]/15">
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Headcount / Present Days
            </span>
            <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5 tabular-nums">
              {siteMonthlyStats.totalPresentDays.toFixed(1)}{' '}
              <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">
                days ({siteMonthlyStats.totalWorkers} workers)
              </span>
            </div>
            <span className="text-[10px] text-amber-600 font-sans font-semibold">
              +{siteMonthlyStats.totalOtHours} OT Hours logged
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Gross Wages Earned (মোট মজুরি)
            </span>
            <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5 tabular-nums">
              ৳ {siteMonthlyStats.totalGrossWages.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              Days × Rate + OT
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Khoraki Advances (খোরাকি বাবদ)
            </span>
            <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums">
              ৳ {siteMonthlyStats.totalKhoraki.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              Daily food/cash advances
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Net Payable Liability (বকেয়া মজুরি)
            </span>
            <div className={`text-xl font-bold font-mono mt-0.5 tabular-nums ${siteMonthlyStats.totalNetDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              ৳ {siteMonthlyStats.totalNetDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              Gross − Khoraki − Paid
            </span>
          </div>
        </div>
      </div>

      {/* Offline & Sync Status Banner */}
      {(!isOnline || stats.attendancePending > 0) && (
        <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans shadow-xs ${
          !isOnline
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {!isOnline ? (
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {!isOnline ? 'Offline Job-Site Mode Active: ' : 'Local Changes Queued: '}
              </span>
              <span>
                {stats.attendancePending > 0
                  ? `${stats.attendancePending} attendance change${stats.attendancePending > 1 ? 's' : ''} stored safely in local cache.`
                  : 'Attendance entries are safely cached in browser storage.'}
                {' Data is 100% preserved locally and will sync once connection is restored.'}
              </span>
            </div>
          </div>
          {isOnline && stats.attendancePending > 0 && (
            <button
              type="button"
              onClick={() => triggerSyncNow()}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 inline-flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Pushing...' : `Push Now (${stats.attendancePending})`}</span>
            </button>
          )}
        </div>
      )}

      {/* Month Navigator & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Month Selector with Prev/Next buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)]/20">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 font-mono font-bold text-xs text-[var(--md-sys-color-on-surface)] min-w-32 text-center">
              {monthDisplayName}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/30 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
          />
        </div>

        {/* View Switcher: Matrix Grid vs Wage Breakdown */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)]/20">
          <button
            type="button"
            onClick={() => setActiveView('grid')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              activeView === 'grid'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            Present Book Matrix (হাজিরা গ্রিড)
          </button>
          <button
            type="button"
            onClick={() => setActiveView('wages')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              activeView === 'wages'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            Wage & Khoraki Sheet (মজুরি শিট)
          </button>
          <button
            type="button"
            onClick={() => setActiveView('workers')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              activeView === 'workers'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            Worker Directory ({siteData.workers.length})
          </button>
        </div>
      </div>

      {/* Trade Category Filter Pills & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedTrade('All')}
            className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
              selectedTrade === 'All'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
            }`}
          >
            All Trades ({siteData.workers.length})
          </button>
          {TRADE_CATEGORIES.map((cat) => {
            const count = siteData.workers.filter((w) => w.trade === cat.key).length;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedTrade(cat.key)}
                className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  selectedTrade === cat.key
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search worker name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline)]/30 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-hidden focus:border-[var(--md-sys-color-primary)] w-56 sm:w-64"
          />
        </div>
      </div>

      {/* VIEW 1: FULL-MONTH PRESENT BOOK ATTENDANCE MATRIX */}
      {activeView === 'grid' && (
        <div className="rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] overflow-hidden shadow-xs">
          {/* Legend Banner */}
          <div className="p-3 bg-[var(--md-sys-color-surface-container)] border-b border-[var(--md-sys-color-outline)]/15 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[var(--md-sys-color-on-surface)]">Legend:</span>
              <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] text-emerald-700 dark:text-emerald-300">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">P</span>
                Present (1.0)
              </span>
              <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] text-amber-700 dark:text-amber-300">
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">H</span>
                Half-Day (0.5)
              </span>
              <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] text-yellow-700 dark:text-yellow-300">
                <span className="w-4 h-4 rounded-full bg-yellow-500 text-black flex items-center justify-center">OT</span>
                Overtime
              </span>
              <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] text-rose-700 dark:text-rose-300">
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center">A</span>
                Absent (0.0)
              </span>
            </div>

            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic">
              Tap any date cell to toggle P &rarr; H &rarr; OT &rarr; A or record Khoraki
            </span>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] text-[10px] font-sans uppercase">
                  <th className="py-2.5 px-3 text-left sticky left-0 z-20 bg-[var(--md-sys-color-surface-container-low)] shadow-xs min-w-44">
                    Worker Name & Trade
                  </th>
                  {daysArray.map((day) => {
                    const isToday = selectedMonth === currentMonthStr && day === currentDayNum;
                    return (
                      <th
                        key={day}
                        className={`py-2 px-1 min-w-8 font-mono border-l border-[var(--md-sys-color-outline)]/10 ${
                          isToday ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold' : ''
                        }`}
                      >
                        {day}
                      </th>
                    );
                  })}
                  <th className="py-2.5 px-2 font-mono font-bold text-right border-l border-[var(--md-sys-color-outline)]/20 min-w-16">
                    P.Days
                  </th>
                  <th className="py-2.5 px-2 font-mono font-bold text-right border-l border-[var(--md-sys-color-outline)]/20 min-w-16">
                    OT.Hrs
                  </th>
                  <th className="py-2.5 px-3 font-mono font-bold text-right border-l border-[var(--md-sys-color-outline)]/20 min-w-24">
                    Net Balance (৳)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline)]/15">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 4} className="py-8 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
                      No workers found. Click "+ Enrol Worker" to add your site crew.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const monthBook = siteData.attendance[selectedMonth]?.[worker.id] || {};
                    const summary = getWorkerMonthlySummary(worker.id, selectedMonth);

                    return (
                      <tr key={worker.id} className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors">
                        {/* Worker Sticky Column */}
                        <td className="py-2.5 px-3 text-left sticky left-0 z-10 bg-[var(--md-sys-color-surface)] shadow-xs">
                          <div className="font-bold text-[var(--md-sys-color-on-surface)] truncate">
                            {worker.name}
                          </div>
                          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 font-sans">
                            <span>{worker.trade}</span>
                            <span>•</span>
                            <span className="font-mono">৳{worker.dailyWage}/d</span>
                          </div>
                        </td>

                        {/* Day Cells (1 to 28/30/31) */}
                        {daysArray.map((day) => {
                          const record = monthBook[day] || {
                            status: 'A',
                            overtimeHours: 0,
                            khoraki: 0,
                            wagePaid: 0,
                          };

                          const isPresent = record.status === 'P';
                          const isHalf = record.status === 'H';
                          const isOt = record.status === 'OT';
                          const isAbsent = record.status === 'A';
                          const hasKhoraki = record.khoraki > 0;
                          const isToday = selectedMonth === currentMonthStr && day === currentDayNum;

                          // Quick Cycle Handler
                          const handleCellClick = () => {
                            const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
                            let nextStatus: AttendanceStatus = 'P';
                            if (record.status === 'P') nextStatus = 'H';
                            else if (record.status === 'H') nextStatus = 'OT';
                            else if (record.status === 'OT') nextStatus = 'A';
                            else nextStatus = 'P';

                            recordDailyAttendance(worker.id, dateStr, {
                              status: nextStatus,
                              overtimeHours: nextStatus === 'OT' ? (record.overtimeHours || 2) : 0,
                            });
                          };

                          // Context Menu / Khoraki Popover
                          const handleCellRightClick = (e: React.MouseEvent) => {
                            e.preventDefault();
                            setCellPopover({
                              workerId: worker.id,
                              workerName: worker.name,
                              day,
                              currentRecord: record,
                            });
                          };

                          return (
                            <td
                              key={day}
                              onClick={handleCellClick}
                              onContextMenu={handleCellRightClick}
                              className={`py-1 px-0.5 border-l border-[var(--md-sys-color-outline)]/10 cursor-pointer select-none transition-colors hover:brightness-95 ${
                                isToday ? 'bg-[var(--md-sys-color-primary)]/5' : ''
                              }`}
                              title={`Day ${day}: ${record.status} (${record.overtimeHours || 0}h OT, Khoraki: ৳${record.khoraki || 0}) — Right click for Khoraki details`}
                            >
                              <div
                                className={`w-7 h-7 mx-auto rounded-full flex flex-col items-center justify-center font-mono font-bold text-[10px] relative transition-transform active:scale-90 ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : isHalf
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : isOt
                                    ? 'bg-yellow-400 text-black shadow-2xs'
                                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]/40 hover:text-[var(--md-sys-color-on-surface)]'
                                }`}
                              >
                                <span>{record.status}</span>
                                {hasKhoraki && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 ring-1 ring-white" />
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Summary Columns */}
                        <td className="py-2 px-2 text-right font-mono font-bold border-l border-[var(--md-sys-color-outline)]/20 tabular-nums text-[var(--md-sys-color-on-surface)]">
                          {(summary.presentDays + summary.halfDays * 0.5).toFixed(1)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono border-l border-[var(--md-sys-color-outline)]/20 tabular-nums text-amber-600 font-bold">
                          {summary.totalOtHours}h
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold border-l border-[var(--md-sys-color-outline)]/20 tabular-nums text-[var(--md-sys-color-primary)]">
                          ৳{summary.netBalanceDue.toLocaleString()}
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

      {/* VIEW 2: WAGE CALCULATION & KHORAKI SETTLEMENT SHEET */}
      {activeView === 'wages' && (
        <div className="rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[var(--md-sys-color-outline)]/15 bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Monthly Wage Settlement & Khoraki Reconciliation ({monthDisplayName})
              </h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Gross wages minus Khoraki food advances and cash payouts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] text-[10px] font-sans uppercase">
                  <th className="py-3 px-4">Worker & Trade</th>
                  <th className="py-3 px-3 text-right">Daily Rate</th>
                  <th className="py-3 px-3 text-right">Present Days</th>
                  <th className="py-3 px-3 text-right">OT Hours</th>
                  <th className="py-3 px-3 text-right">Gross Wage (৳)</th>
                  <th className="py-3 px-3 text-right">Khoraki Advance (৳)</th>
                  <th className="py-3 px-3 text-right">Paid Out (৳)</th>
                  <th className="py-3 px-3 text-right font-bold">Net Balance (৳)</th>
                  <th className="py-3 px-4 text-center">Settlement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline)]/15">
                {filteredWorkers.map((w) => {
                  const summary = getWorkerMonthlySummary(w.id, selectedMonth);
                  return (
                    <tr key={w.id} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[var(--md-sys-color-on-surface)]">{w.name}</div>
                        <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          {w.trade} • {w.phone}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
                        ৳ {w.dailyWage}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-[var(--md-sys-color-on-surface)]">
                        {(summary.presentDays + summary.halfDays * 0.5).toFixed(1)}d
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-600 font-bold">
                        {summary.totalOtHours}h
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-[var(--md-sys-color-on-surface)]">
                        ৳ {summary.grossWage.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-700 font-semibold">
                        -৳ {summary.totalKhoraki.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-600 font-semibold">
                        ৳ {summary.totalDirectPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-sm tabular-nums text-[var(--md-sys-color-primary)]">
                        ৳ {summary.netBalanceDue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPayoutModalWorker(w);
                            setPayoutForm({
                              amount: summary.netBalanceDue > 0 ? summary.netBalanceDue.toString() : '',
                              type: 'Wage Payout',
                              paymentMethod: 'Cash',
                              voucherRef: `V-WAGE-${Date.now().toString().slice(-4)}`,
                              remarks: `Wage settlement for ${monthDisplayName}`,
                              syncToPettyCash: true,
                            });
                          }}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 shadow-2xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Pay Wage / Khoraki</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: WORKER PROFILE DIRECTORY */}
      {activeView === 'workers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredWorkers.map((w) => (
            <div
              key={w.id}
              className="p-4 rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)]">
                    {w.trade}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      w.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {w.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h4 className="text-base font-bold text-[var(--md-sys-color-on-surface)] mt-2">
                  {w.name}
                </h4>

                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] space-y-1 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                    <span>{w.phone || 'No phone recorded'}</span>
                  </div>
                  <div>Daily Wage: <b>৳{w.dailyWage}</b> / day</div>
                  <div>OT Rate: <b>৳{w.overtimeRatePerHr}</b> / hour</div>
                  {w.emergencyContact && <div>Emergency: {w.emergencyContact}</div>}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--md-sys-color-outline)]/15 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    updateWorker(w.id, { isActive: !w.isActive });
                    showToast(`${w.name} marked ${!w.isActive ? 'Active' : 'Inactive'}`);
                  }}
                  className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
                >
                  {w.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove worker ${w.name} permanently?`)) {
                      deleteWorker(w.id);
                      showToast(`Removed ${w.name}`);
                    }
                  }}
                  className="p-1 rounded-full text-rose-500 hover:bg-rose-100 cursor-pointer"
                  title="Delete worker"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CELL ATTENDANCE & KHORAKI POPOVER */}
      {/* ==================================================================== */}
      {cellPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-5 font-serif">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div>
                <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  {cellPopover.workerName}
                </h4>
                <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Attendance & Khoraki for Day {cellPopover.day} ({monthDisplayName})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCellPopover(null)}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-3">
              {/* Status Picker */}
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Attendance Status
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['P', 'H', 'OT', 'A'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setCellPopover({
                          ...cellPopover,
                          currentRecord: { ...cellPopover.currentRecord, status: st },
                        });
                      }}
                      className={`py-2 rounded-full font-mono font-bold text-xs border transition-colors cursor-pointer ${
                        cellPopover.currentRecord.status === st
                          ? st === 'P'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : st === 'H'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : st === 'OT'
                            ? 'bg-yellow-400 text-black border-yellow-400'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border-transparent'
                      }`}
                    >
                      {st === 'P' ? 'Present' : st === 'H' ? 'Half' : st === 'OT' ? 'OT' : 'Absent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overtime Hours */}
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Overtime Hours (OT)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="16"
                  value={cellPopover.currentRecord.overtimeHours || ''}
                  onChange={(e) =>
                    setCellPopover({
                      ...cellPopover,
                      currentRecord: {
                        ...cellPopover.currentRecord,
                        overtimeHours: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="e.g. 2.0"
                  className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              {/* Khoraki Advance Given Today */}
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Khoraki / Food Advance Given (৳)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={cellPopover.currentRecord.khoraki || ''}
                  onChange={(e) =>
                    setCellPopover({
                      ...cellPopover,
                      currentRecord: {
                        ...cellPopover.currentRecord,
                        khoraki: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="e.g. 200"
                  className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => setCellPopover(null)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dateStr = `${selectedMonth}-${cellPopover.day.toString().padStart(2, '0')}`;
                    recordDailyAttendance(cellPopover.workerId, dateStr, cellPopover.currentRecord);
                    showToast(`Updated record for ${cellPopover.workerName}`);
                    setCellPopover(null);
                  }}
                  className="px-5 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold cursor-pointer"
                >
                  Save Day Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: PAY WAGE / KHORAKI ADVANCE VOUCHER */}
      {/* ==================================================================== */}
      {payoutModalWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-6 font-serif">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Disburse Labor Payment
                  </h4>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {payoutModalWorker.name} ({payoutModalWorker.trade})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayoutModalWorker(null)}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Payment Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={payoutForm.type}
                  onChange={(e) => setPayoutForm({ ...payoutForm, type: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                >
                  <option value="Wage Payout">Wage Payout (মজুরি প্রদান)</option>
                  <option value="Khoraki / Advance">Khoraki / Advance (খোরাকি বা অগ্রিম)</option>
                  <option value="Final Settlement">Final Settlement (চূড়ান্ত নিষ্পত্তি)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Amount (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs font-mono font-bold text-sm border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payoutForm.paymentMethod}
                    onChange={(e) => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  >
                    <option value="Cash">Cash (নগদ)</option>
                    <option value="bKash/Mobile">bKash / Nagad</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Voucher / Receipt Ref
                  </label>
                  <input
                    type="text"
                    value={payoutForm.voucherRef}
                    onChange={(e) => setPayoutForm({ ...payoutForm, voucherRef: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly settlement for casting crew"
                  value={payoutForm.remarks}
                  onChange={(e) => setPayoutForm({ ...payoutForm, remarks: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              {/* Petty Cash Sync Checkbox */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="syncLaborToPettyCash"
                  checked={payoutForm.syncToPettyCash}
                  onChange={(e) => setPayoutForm({ ...payoutForm, syncToPettyCash: e.target.checked })}
                  className="mt-0.5 rounded text-[var(--md-sys-color-primary)] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="syncLaborToPettyCash" className="text-xs text-[var(--md-sys-color-on-surface)] cursor-pointer select-none">
                  <span className="font-semibold block text-amber-700 dark:text-amber-300">
                    Record Payment in Petty Cash / Ledger (SM-07)
                  </span>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">
                    Automatically posts a debit expense voucher under &quot;Labor Wage / Khoraki&quot; in the site cashbook.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => setPayoutModalWorker(null)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ENROL NEW WORKER */}
      {/* ==================================================================== */}
      {addWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-6 font-serif">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Enrol Site Worker (কর্মী নিবন্ধন)
                  </h4>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Persistently stored across all project months
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddWorkerModalOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWorkerSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Worker Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Jahangir Alam"
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Trade Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={workerForm.trade}
                    onChange={(e) => setWorkerForm({ ...workerForm, trade: e.target.value as TradeCategory })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  >
                    {TRADE_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label} ({cat.bengali})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01711-234567"
                    value={workerForm.phone}
                    onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Daily Wage Rate (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="100"
                    value={workerForm.dailyWage}
                    onChange={(e) => setWorkerForm({ ...workerForm, dailyWage: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono font-bold border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Overtime Rate (৳/hr) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="10"
                    value={workerForm.overtimeRatePerHr}
                    onChange={(e) => setWorkerForm({ ...workerForm, overtimeRatePerHr: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={workerForm.joiningDate}
                    onChange={(e) => setWorkerForm({ ...workerForm, joiningDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01819-000000 (Brother)"
                    value={workerForm.emergencyContact}
                    onChange={(e) => setWorkerForm({ ...workerForm, emergencyContact: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => setAddWorkerModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-sm cursor-pointer hover:opacity-90"
                >
                  Save Worker Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
