import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Printer,
  Download,
  Users,
  Package,
  CheckCircle2,
  Clock,
  Droplets,
  DollarSign,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  Check,
  X,
  FileText,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { DailyProgressReport } from '../../types/siteManagement';

const WEATHER_OPTIONS = [
  { value: 'Sunny & Clear (Normal Operations)', icon: Sun },
  { value: 'Partly Cloudy (Fair Weather)', icon: Cloud },
  { value: 'Rainy - Work Delayed (Slab/Masonry Paused)', icon: CloudRain },
  { value: 'High Wind / Storm Warning', icon: Wind },
];

export const DailyProgressReportModule: React.FC = () => {
  const {
    siteData,
    activeProjectId,
    compileDailyProgressReport,
  } = useSiteManagement();

  // Selected Date state
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedWeather, setSelectedWeather] = useState<string>(WEATHER_OPTIONS[0].value);
  const [temperature, setTemperature] = useState<string>('29°C');
  const [siteCondition, setSiteCondition] = useState<string>('Normal site activity; batch mixer, vibrators & tower hoist operational.');
  const [nextDayPlan, setNextDayPlan] = useState<string>(
    '1. Continue 4th floor column shuttering & check plumb.\n2. Complete rebar cutting & bending for beam B-101 to B-105.\n3. Water curing on 3rd floor slab (morning & afternoon ponding).'
  );
  const [siteRemarks, setSiteRemarks] = useState<string>(
    'No safety incidents reported today. PPE helmets and boots strictly enforced for all workers and visitors.'
  );

  // Print view state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compile DPR live data for the selected date
  const dpr: DailyProgressReport = useMemo(() => {
    const report = compileDailyProgressReport(selectedDate);
    return {
      ...report,
      weather: selectedWeather,
      temperature,
      siteCondition,
      remarks: siteRemarks,
    };
  }, [compileDailyProgressReport, selectedDate, selectedWeather, temperature, siteCondition, siteRemarks]);

  // Quick date navigation
  const handleDateStep = (deltaDays: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + deltaDays);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dpr, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `DPR_${activeProjectId}_${selectedDate}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast('Exported DPR JSON');
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
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Module 09 • ERP-09
            </span>
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Project: {activeProjectId}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-[var(--md-sys-color-on-surface)] tracking-tight">
            1-Click Daily Progress Report (DPR) Aggregator
          </h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-2xl font-serif">
            Live auto-compiled site summary synthesizing daily labor headcount, material logs, active milestones, curing countdowns, and petty cash.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Generate Official DPR (PDF)</span>
          </button>
        </div>
      </div>

      {/* Date & Site Conditions Picker */}
      <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Date Selector with Steppers */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleDateStep(-1)}
              className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--md-sys-color-surface)] border border-amber-500/40 shadow-sm">
              <Calendar className="w-4 h-4 text-amber-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold font-mono focus:outline-none cursor-pointer text-[var(--md-sys-color-on-surface)]"
              />
            </div>

            <button
              onClick={() => handleDateStep(1)}
              className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]"
            >
              Today
            </button>
          </div>

          {/* Weather & Temp Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] font-serif">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <select
                value={selectedWeather}
                onChange={(e) => setSelectedWeather(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                {WEATHER_OPTIONS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs font-mono">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Temp:</span>
              <input
                type="text"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-14 bg-transparent font-bold focus:outline-none text-[var(--md-sys-color-on-surface)]"
              />
            </div>
          </div>
        </div>

        {/* Site Conditions Note */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
            Site Operating Conditions & Equipment Availability
          </label>
          <input
            type="text"
            value={siteCondition}
            onChange={(e) => setSiteCondition(e.target.value)}
            className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-serif"
          />
        </div>
      </div>

      {/* 5-Pillar Live Compiled Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* PILLAR 1: MANPOWER DEPLOYED */}
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-500/10 text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)] font-serif">
                  1. Manpower Deployed
                </h3>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Synced from Present Book
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">
              {dpr.totalLaborHeadcount} Workers
            </span>
          </div>

          {Object.keys(dpr.laborHeadcountByTrade).length === 0 ? (
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic py-3 text-center">
              No workers marked Present for {selectedDate}.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(dpr.laborHeadcountByTrade).map(([trade, data]) => (
                <div key={trade} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--md-sys-color-on-surface)] truncate max-w-[170px]">
                    {trade}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold">{data.count} Nos</span>
                    {data.otHours > 0 && (
                      <span className="text-[10px] text-amber-600">({data.otHours}h OT)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex justify-between items-center text-xs">
            <span className="text-[var(--md-sys-color-on-surface-variant)]">Est. Day Wage Cost:</span>
            <span className="font-bold font-mono text-emerald-600">
              ৳ {dpr.totalLaborCostToday.toLocaleString()}
            </span>
          </div>
        </div>

        {/* PILLAR 2: MATERIALS INWARD & OUTWARD */}
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)] font-serif">
                  2. Materials Logistics
                </h3>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Store Ledger Transactions
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              {dpr.materialsReceived.length} In / {dpr.materialsIssued.length} Out
            </span>
          </div>

          <div className="space-y-3">
            {/* Inward */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                + Received on Site Today:
              </span>
              {dpr.materialsReceived.length === 0 ? (
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic">No inward deliveries.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {dpr.materialsReceived.map((m, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span className="truncate max-w-[160px] text-[var(--md-sys-color-on-surface)]">{m.itemName}</span>
                      <span className="font-bold font-mono text-emerald-600">
                        +{m.qty} {m.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Outward */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-1">
                - Consumed / Issued Today:
              </span>
              {dpr.materialsIssued.length === 0 ? (
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic">No outward issues recorded.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {dpr.materialsIssued.map((m, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span className="truncate max-w-[160px] text-[var(--md-sys-color-on-surface)]">{m.itemName}</span>
                      <span className="font-bold font-mono text-rose-600">
                        -{m.qty} {m.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* PILLAR 3: ACTIVE TASKS & CASTING */}
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-purple-500/10 text-purple-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)] font-serif">
                  3. Active Milestones
                </h3>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Schedule Execution
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">
              {dpr.activeMilestones.length} In Progress
            </span>
          </div>

          {dpr.activeMilestones.length === 0 ? (
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic py-3 text-center">
              No milestones active on {selectedDate}.
            </p>
          ) : (
            <div className="space-y-2.5">
              {dpr.activeMilestones.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[var(--md-sys-color-on-surface)] truncate max-w-[180px]">
                      {m.title}
                    </span>
                    <span className="font-bold font-mono">{m.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--md-sys-color-surface-container)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PILLAR 4: QUALITY CHECKS & CURING */}
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-600">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)] font-serif">
                  4. Quality & Curing
                </h3>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Concrete Tests & Wet Curing
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {/* Active Curing Countdowns */}
            {dpr.curingRemindersActive.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> Active Wet Curing:
                </span>
                {dpr.curingRemindersActive.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="truncate max-w-[170px] text-[var(--md-sys-color-on-surface)]">{c.element}</span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-300 font-mono">
                      {c.daysLeft}d left
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Cube Tests Due */}
            {dpr.cubeTestsDueToday.length > 0 ? (
              <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
                  Crushing Tests Due Today:
                </span>
                {dpr.cubeTestsDueToday.map((cube, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span>{cube.structuralElement}</span>
                    <span className="font-bold text-rose-600 font-mono">
                      {cube.day7TestDate === selectedDate ? '7-Day' : '28-Day'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic">
                No concrete crushing scheduled for today.
              </p>
            )}
          </div>
        </div>

        {/* PILLAR 5: EXPENSES & PETTY CASH */}
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-rose-500/10 text-rose-600">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)] font-serif">
                  5. Daily Site Cash Spent
                </h3>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Petty Cash Disbursements
                </span>
              </div>
            </div>
            <span className="text-xs font-bold font-serif text-rose-600 tabular-nums">
              ৳ {dpr.pettyCashSpentToday.toLocaleString()}
            </span>
          </div>

          {dpr.pettyCashTransactions.length === 0 ? (
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic py-3 text-center">
              No cash expenses recorded on {selectedDate}.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {dpr.pettyCashTransactions.map((tx) => (
                <li key={tx.id} className="flex justify-between items-center">
                  <span className="truncate max-w-[170px] text-[var(--md-sys-color-on-surface)]">
                    {tx.description}
                  </span>
                  <span className="font-bold font-mono text-rose-600">
                    ৳ {tx.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* PILLAR 6: FIELD NOTES & INSTRUCTIONS */}
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-amber-500/10 text-amber-600">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)] font-serif">
                  6. Field Observations
                </h3>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Client & Architect Instructions
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
              {dpr.fieldNotesToday.length} Notes
            </span>
          </div>

          {dpr.fieldNotesToday.length === 0 ? (
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic py-3 text-center">
              No field notes recorded on {selectedDate}.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {dpr.fieldNotesToday.map((n) => (
                <div key={n.id} className="p-2 rounded-xl bg-[var(--md-sys-color-surface-container)]">
                  <div className="flex justify-between text-[10px] font-bold text-amber-600 mb-0.5">
                    <span>{n.category}</span>
                    <span className="font-mono">{n.floorGridTag}</span>
                  </div>
                  <p className="line-clamp-2 text-[var(--md-sys-color-on-surface)] font-serif">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Target Planning & Engineer Remarks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
          <label className="block text-xs font-bold font-serif text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
            Target Plan for Tomorrow / Next Working Shift
          </label>
          <textarea
            rows={3}
            value={nextDayPlan}
            onChange={(e) => setNextDayPlan(e.target.value)}
            className="w-full p-3 rounded-2xl text-xs bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] font-serif resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
          <label className="block text-xs font-bold font-serif text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
            Site Quality & Safety Remarks / Constraints
          </label>
          <textarea
            rows={3}
            value={siteRemarks}
            onChange={(e) => setSiteRemarks(e.target.value)}
            className="w-full p-3 rounded-2xl text-xs bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] font-serif resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* PRINTABLE OFFICIAL A4 DPR MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
          <div className="relative w-full max-w-4xl my-8 rounded-3xl bg-white text-zinc-900 border border-zinc-200 shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
            {/* Modal Controls */}
            <div className="flex items-center justify-between p-4 bg-zinc-100 border-b border-zinc-200 print:hidden">
              <span className="text-xs font-semibold text-zinc-600 uppercase">
                Official Daily Progress Report (DPR) Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official DPR (A4)</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* A4 Report Sheet */}
            <div className="p-8 md:p-12 space-y-6 font-serif text-xs">
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-zinc-900 space-y-1">
                <h2 className="text-2xl font-bold tracking-tight uppercase">BD. CivilLab Construction Supervision</h2>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-sans">
                  Official Site Daily Progress Report (DPR)
                </p>
                <div className="inline-block mt-1 px-4 py-0.5 rounded-full bg-zinc-900 text-white text-xs font-bold uppercase">
                  Date of Report: {selectedDate}
                </div>
              </div>

              {/* General Project & Meteorological Conditions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Project ID:</span>
                  <span className="font-bold font-mono">{activeProjectId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Weather:</span>
                  <span>{selectedWeather}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Temperature:</span>
                  <span className="font-mono">{temperature}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Total Deployed:</span>
                  <span className="font-bold text-amber-700">{dpr.totalLaborHeadcount} Tradesmen</span>
                </div>
              </div>

              {/* 1. Manpower Headcount Table */}
              <div className="space-y-1.5">
                <h4 className="font-bold uppercase text-[11px] tracking-wider text-zinc-800">
                  1. Labor Muster Roll Summary:
                </h4>
                <div className="overflow-hidden border border-zinc-300 rounded-lg">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-zinc-100 font-bold border-b border-zinc-300">
                      <tr>
                        <th className="py-1.5 px-3">Trade Category</th>
                        <th className="py-1.5 px-3 text-center">Headcount</th>
                        <th className="py-1.5 px-3 text-center">Overtime Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 font-sans">
                      {Object.keys(dpr.laborHeadcountByTrade).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-2 px-3 text-center text-zinc-500 italic">No attendance marked today.</td>
                        </tr>
                      ) : (
                        Object.entries(dpr.laborHeadcountByTrade).map(([trade, data]) => (
                          <tr key={trade}>
                            <td className="py-1.5 px-3 font-medium">{trade}</td>
                            <td className="py-1.5 px-3 text-center font-bold font-mono">{data.count}</td>
                            <td className="py-1.5 px-3 text-center font-mono">{data.otHours} hrs</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Materials Received & Consumed */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h4 className="font-bold uppercase text-[11px] tracking-wider text-emerald-800">
                    2. Materials Received (Inward Challans):
                  </h4>
                  <div className="overflow-hidden border border-zinc-300 rounded-lg">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-zinc-100 font-bold border-b border-zinc-300">
                        <tr>
                          <th className="py-1.5 px-2.5">Item</th>
                          <th className="py-1.5 px-2.5 text-right">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 font-sans">
                        {dpr.materialsReceived.length === 0 ? (
                          <tr><td colSpan={2} className="py-2 px-2.5 text-center text-zinc-500 italic">No inward materials today.</td></tr>
                        ) : (
                          dpr.materialsReceived.map((m, idx) => (
                            <tr key={idx}>
                              <td className="py-1 px-2.5">{m.itemName}</td>
                              <td className="py-1 px-2.5 text-right font-mono font-bold text-emerald-700">+{m.qty} {m.unit}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold uppercase text-[11px] tracking-wider text-rose-800">
                    3. Materials Consumed / Issued:
                  </h4>
                  <div className="overflow-hidden border border-zinc-300 rounded-lg">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-zinc-100 font-bold border-b border-zinc-300">
                        <tr>
                          <th className="py-1.5 px-2.5">Item</th>
                          <th className="py-1.5 px-2.5 text-right">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 font-sans">
                        {dpr.materialsIssued.length === 0 ? (
                          <tr><td colSpan={2} className="py-2 px-2.5 text-center text-zinc-500 italic">No outward materials today.</td></tr>
                        ) : (
                          dpr.materialsIssued.map((m, idx) => (
                            <tr key={idx}>
                              <td className="py-1 px-2.5">{m.itemName}</td>
                              <td className="py-1 px-2.5 text-right font-mono font-bold text-rose-700">-{m.qty} {m.unit}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 4. Active Milestones & Progress */}
              <div className="space-y-1.5">
                <h4 className="font-bold uppercase text-[11px] tracking-wider text-zinc-800">
                  4. Construction Progress & Milestones Executed:
                </h4>
                <div className="overflow-hidden border border-zinc-300 rounded-lg">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-zinc-100 font-bold border-b border-zinc-300">
                      <tr>
                        <th className="py-1.5 px-3">Milestone / Zone</th>
                        <th className="py-1.5 px-3 text-center">Status</th>
                        <th className="py-1.5 px-3 text-right">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 font-sans">
                      {dpr.activeMilestones.length === 0 ? (
                        <tr><td colSpan={3} className="py-2 px-3 text-center text-zinc-500 italic">No active milestones today.</td></tr>
                      ) : (
                        dpr.activeMilestones.map((m, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-3 font-medium">{m.title} ({m.zoneFloor})</td>
                            <td className="py-1.5 px-3 text-center">{m.status}</td>
                            <td className="py-1.5 px-3 text-right font-bold font-mono">{m.progress}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Tomorrow's Plan & General Remarks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-300 space-y-1">
                  <span className="font-bold text-[10px] uppercase text-zinc-600 block">Tomorrow's Planned Targets:</span>
                  <p className="whitespace-pre-line text-[11px] leading-relaxed">{nextDayPlan}</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-300 space-y-1">
                  <span className="font-bold text-[10px] uppercase text-zinc-600 block">Safety & Quality Observations:</span>
                  <p className="whitespace-pre-line text-[11px] leading-relaxed">{siteRemarks}</p>
                </div>
              </div>

              {/* Three Tier Signatures */}
              <div className="pt-14 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="border-t border-zinc-400 pt-1.5">
                  <p className="font-bold">Prepared By</p>
                  <p className="text-[10px] text-zinc-500">Site Engineer</p>
                </div>
                <div className="border-t border-zinc-400 pt-1.5">
                  <p className="font-bold">Verified By</p>
                  <p className="text-[10px] text-zinc-500">Project Manager / In-Charge</p>
                </div>
                <div className="border-t border-zinc-400 pt-1.5">
                  <p className="font-bold">Acknowledged By</p>
                  <p className="text-[10px] text-zinc-500">Consultant / Client Representative</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
