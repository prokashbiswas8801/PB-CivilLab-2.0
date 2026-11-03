import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Droplets,
  Building,
  User,
  Sliders,
  Layers,
  Sparkles,
  Info,
  Timer,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { MilestoneTask, EngineerTask } from '../../types/siteManagement';

type ElementType =
  | 'slab-short' // Slab span <= 4.5m (7 days props)
  | 'slab-long' // Slab span > 4.5m (14 days props)
  | 'beam-short' // Beam span <= 6.0m (14 days props)
  | 'beam-long' // Beam span > 6.0m (21 days props)
  | 'vertical-col' // Columns / walls / beam sides (1-2 days)
  | 'cantilever'; // Cantilever canopy / slab (28 days)

export const ScheduleRosterModule: React.FC = () => {
  const {
    siteData,
    activeProjectId,
    addMilestoneTask,
    updateMilestoneTask,
    deleteMilestoneTask,
    addEngineerTask,
    toggleEngineerTask,
    deleteEngineerTask,
  } = useSiteManagement();

  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'roster'>('schedule');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState<string>('All');
  const [rosterCategoryFilter, setRosterCategoryFilter] = useState<string>('All');

  // Modals
  const [addMilestoneModalOpen, setAddMilestoneModalOpen] = useState<boolean>(false);
  const [addInspectionModalOpen, setAddInspectionModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------------------------------
  // MILESTONE FORM STATE
  // --------------------------------------------------------------------------
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    zoneFloor: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0,
    priority: 'High' as 'Low' | 'Medium' | 'High' | 'Critical',
    assignedForeman: '',
    notes: '',
    isCastingEvent: false,
    castingDate: new Date().toISOString().split('T')[0],
    elementType: 'slab-long' as ElementType,
    curingDurationDays: 14,
  });

  // Calculate live deshuttering days based on structural element
  const deshutteringDays = useMemo(() => {
    switch (milestoneForm.elementType) {
      case 'vertical-col':
        return 2; // 24 to 48 hours
      case 'slab-short':
        return 7;
      case 'slab-long':
        return 14;
      case 'beam-short':
        return 14;
      case 'beam-long':
        return 21;
      case 'cantilever':
        return 28;
      default:
        return 14;
    }
  }, [milestoneForm.elementType]);

  const computedCuringEndDate = useMemo(() => {
    const cast = new Date(milestoneForm.castingDate);
    cast.setDate(cast.getDate() + milestoneForm.curingDurationDays);
    return cast.toISOString().split('T')[0];
  }, [milestoneForm.castingDate, milestoneForm.curingDurationDays]);

  const computedDeshutterDate = useMemo(() => {
    const cast = new Date(milestoneForm.castingDate);
    cast.setDate(cast.getDate() + deshutteringDays);
    return cast.toISOString().split('T')[0];
  }, [milestoneForm.castingDate, deshutteringDays]);

  // --------------------------------------------------------------------------
  // INSPECTION TASK FORM STATE
  // --------------------------------------------------------------------------
  const [inspectionForm, setInspectionForm] = useState({
    title: '',
    category: 'Quality Inspection' as EngineerTask['category'],
    priority: 'Urgent' as EngineerTask['priority'],
    assignedTo: 'Site Engineer',
    targetDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  // Filtered Milestones
  const filteredMilestones = useMemo(() => {
    return siteData.milestones.filter((m) => {
      const matchStatus = milestoneStatusFilter === 'All' || m.status === milestoneStatusFilter;
      const matchSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.zoneFloor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.assignedForeman && m.assignedForeman.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [siteData.milestones, milestoneStatusFilter, searchQuery]);

  // Active Curing Milestones
  const activeCuringEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return siteData.milestones.filter((m) => {
      return (
        m.isCastingEvent &&
        m.castingDate &&
        m.autoCuringEndDate &&
        m.autoCuringEndDate >= todayStr
      );
    });
  }, [siteData.milestones]);

  // Filtered Engineer Inspections
  const filteredInspections = useMemo(() => {
    return siteData.engineerTasks.filter((t) => {
      const matchCat = rosterCategoryFilter === 'All' || t.category === rosterCategoryFilter;
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.remarks && t.remarks.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [siteData.engineerTasks, rosterCategoryFilter, searchQuery]);

  // Submit Milestone
  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneForm.title.trim()) return;

    const created = addMilestoneTask({
      title: milestoneForm.title.trim(),
      zoneFloor: milestoneForm.zoneFloor.trim() || 'General Structure',
      startDate: milestoneForm.startDate,
      endDate: milestoneForm.endDate,
      progress: milestoneForm.progress,
      isCastingEvent: milestoneForm.isCastingEvent,
      castingDate: milestoneForm.isCastingEvent ? milestoneForm.castingDate : undefined,
      autoCuringEndDate: milestoneForm.isCastingEvent ? computedCuringEndDate : undefined,
      autoDeshutteringDate: milestoneForm.isCastingEvent ? computedDeshutterDate : undefined,
      status:
        milestoneForm.progress === 100
          ? 'Completed'
          : milestoneForm.isCastingEvent
          ? 'Under Curing'
          : milestoneForm.progress > 0
          ? 'In Progress'
          : 'Not Started',
      priority: milestoneForm.priority,
      assignedForeman: milestoneForm.assignedForeman.trim() || undefined,
      notes: milestoneForm.notes.trim() || undefined,
    });

    showToast(`Added Milestone: "${created.title}"`);
    if (created.isCastingEvent) {
      showToast('Smart Assistant: Linked 7-Day & 28-Day Cube Test Records automatically created!');
    }

    setAddMilestoneModalOpen(false);
    setMilestoneForm({
      title: '',
      zoneFloor: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      priority: 'High',
      assignedForeman: '',
      notes: '',
      isCastingEvent: false,
      castingDate: new Date().toISOString().split('T')[0],
      elementType: 'slab-long',
      curingDurationDays: 14,
    });
  };

  // Submit Inspection Task
  const handleInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionForm.title.trim()) return;

    const created = addEngineerTask({
      title: inspectionForm.title.trim(),
      category: inspectionForm.category,
      priority: inspectionForm.priority,
      assignedTo: inspectionForm.assignedTo.trim() || 'Site Engineer',
      targetDate: inspectionForm.targetDate,
      isCompleted: false,
      remarks: inspectionForm.remarks.trim() || undefined,
    });

    showToast(`Added Inspection Task: "${created.title}"`);
    setAddInspectionModalOpen(false);
    setInspectionForm({
      title: '',
      category: 'Quality Inspection',
      priority: 'Urgent',
      assignedTo: 'Site Engineer',
      targetDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                Site Execution & QA/QC
              </span>
              <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                {activeProjectId}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
              Project Schedule & Engineer Roster
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl">
              Track multi-tier construction milestones, concrete casting curing/de-shuttering schedules, and engineer daily inspection checklists.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {activeSubTab === 'schedule' ? (
              <button
                type="button"
                onClick={() => setAddMilestoneModalOpen(true)}
                className="px-4 py-2 rounded-full bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Milestone / Casting Task</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAddInspectionModalOpen(true)}
                className="px-4 py-2 rounded-full bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Daily Inspection Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[var(--md-sys-color-outline)]/15">
          <button
            type="button"
            onClick={() => setActiveSubTab('schedule')}
            className={`px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors ${
              activeSubTab === 'schedule'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sub-Tab A: Construction Schedule & Casting Tracker</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono">
              {siteData.milestones.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('roster')}
            className={`px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors ${
              activeSubTab === 'roster'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sub-Tab B: Engineer's Daily Roster & Inspection Log</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono">
              {siteData.engineerTasks.length}
            </span>
          </button>
        </div>
      </div>

      {/* ACTIVE CURING ALERT BANNER (If elements currently undergoing curing) */}
      {activeCuringEvents.length > 0 && (
        <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-blue-600 text-white shrink-0">
              <Droplets className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold">
                Active Concrete Curing & De-Shuttering Operations ({activeCuringEvents.length})
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                Maintain continuous wet hessian burlap or water ponding to prevent plastic shrinkage cracking and achieve specified compressive strength.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeCuringEvents.map((m) => {
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(m.autoCuringEndDate!).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              );
              return (
                <span
                  key={m.id}
                  className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white dark:bg-blue-900 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-2xs"
                >
                  {m.title}: {daysLeft} Days Curing Left
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB A: PROJECT CONSTRUCTION SCHEDULE & CASTING TRACKER */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mr-1">Status:</span>
              {['All', 'Not Started', 'In Progress', 'Under Curing', 'Completed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setMilestoneStatusFilter(st)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                    milestoneStatusFilter === st
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
              <input
                type="text"
                placeholder="Search milestone title, floor zone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline)]/30 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-hidden focus:border-[var(--md-sys-color-primary)] w-56 sm:w-64"
              />
            </div>
          </div>

          {/* Milestones List */}
          <div className="space-y-3">
            {filteredMilestones.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)]">
                <Calendar className="w-8 h-8 mx-auto text-[var(--md-sys-color-on-surface-variant)]/40 mb-2" />
                <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">No Milestones Found</h4>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  Click "+ Add Milestone / Casting Task" above to schedule tasks.
                </p>
              </div>
            ) : (
              filteredMilestones.map((m) => {
                const isCasting = m.isCastingEvent;
                const isUnderCuring = m.status === 'Under Curing';
                const isCompleted = m.progress === 100;

                return (
                  <div
                    key={m.id}
                    className={`p-5 rounded-2xl border transition-all shadow-xs ${
                      isUnderCuring
                        ? 'border-blue-400 bg-blue-500/5 dark:border-blue-900'
                        : isCompleted
                        ? 'border-emerald-300 bg-emerald-500/5 dark:border-emerald-950'
                        : 'border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                            {m.title}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline)]/20">
                            {m.zoneFloor}
                          </span>
                          {isCasting && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 inline-flex items-center gap-1">
                              <Droplets className="w-3 h-3" /> CONCRETE POUR EVENT
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isUnderCuring
                                ? 'bg-blue-600 text-white'
                                : m.status === 'In Progress'
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-400 text-white'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                          <span>Start: <b>{m.startDate}</b></span>
                          <span>•</span>
                          <span>Target End: <b>{m.endDate}</b></span>
                          {m.assignedForeman && (
                            <>
                              <span>•</span>
                              <span>Foreman: <b>{m.assignedForeman}</b></span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Progress Slider */}
                      <div className="w-full md:w-64 space-y-1">
                        <div className="flex justify-between text-xs font-mono font-semibold text-[var(--md-sys-color-on-surface)]">
                          <span>Progress</span>
                          <span className="text-[var(--md-sys-color-primary)]">{m.progress}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={m.progress}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateMilestoneTask(m.id, {
                              progress: val,
                              status: val === 100 ? 'Completed' : val > 0 ? (m.isCastingEvent ? 'Under Curing' : 'In Progress') : 'Not Started',
                            });
                          }}
                          className="w-full accent-[var(--md-sys-color-primary)] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* SMART CASTING & DESHUTTERING ACCORDION */}
                    {isCasting && (
                      <div className="mt-4 pt-3 border-t border-[var(--md-sys-color-outline)]/15 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)]/20">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                            Casting Date
                          </span>
                          <div className="font-mono font-bold text-sm text-[var(--md-sys-color-on-surface)] mt-0.5">
                            {m.castingDate}
                          </div>
                          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                            Concrete Pour Verified
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-950 dark:text-blue-100">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-blue-700 dark:text-blue-300 block flex items-center gap-1">
                            <Droplets className="w-3 h-3" /> Mandatory Curing End
                          </span>
                          <div className="font-mono font-bold text-sm mt-0.5">
                            {m.autoCuringEndDate || 'Pending'}
                          </div>
                          <span className="text-[11px] text-blue-800 dark:text-blue-300">
                            14-day wet burlap ponding per ACI 308
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-100">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-700 dark:text-amber-300 block flex items-center gap-1">
                            <Timer className="w-3 h-3" /> Safe De-Shuttering Date
                          </span>
                          <div className="font-mono font-bold text-sm mt-0.5">
                            {m.autoDeshutteringDate || 'Pending'}
                          </div>
                          <span className="text-[11px] text-amber-800 dark:text-amber-300">
                            Minimum soffit prop removal window
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bottom notes & delete */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--md-sys-color-outline)]/10 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      <span>{m.notes || 'No special engineering instructions logged.'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete milestone "${m.title}"?`)) {
                            deleteMilestoneTask(m.id);
                            showToast(`Deleted ${m.title}`);
                          }
                        }}
                        className="p-1 rounded-full text-rose-500 hover:bg-rose-100 cursor-pointer"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB B: ENGINEER'S DAILY ROSTER & INSPECTION LOG */}
      {activeSubTab === 'roster' && (
        <div className="space-y-4">
          {/* Category Filter & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mr-1">Category:</span>
              {[
                'All',
                'Quality Inspection',
                'Safety Audit',
                'Material Checking',
                'Level/Grid Verification',
                'Client Coordination',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setRosterCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                    rosterCategoryFilter === cat
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
              <input
                type="text"
                placeholder="Search inspection title, engineer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline)]/30 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-hidden focus:border-[var(--md-sys-color-primary)] w-56 sm:w-64"
              />
            </div>
          </div>

          {/* Inspection Cards */}
          <div className="space-y-3">
            {filteredInspections.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)]">
                <FileCheck2 className="w-8 h-8 mx-auto text-[var(--md-sys-color-on-surface-variant)]/40 mb-2" />
                <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">No Inspection Tasks Found</h4>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  Add daily QA/QC checklists, rebar inspections, and safety rounds above.
                </p>
              </div>
            ) : (
              filteredInspections.map((task) => {
                const isUrgent = task.priority === 'Urgent';
                const isHigh = task.priority === 'High';

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start gap-3 shadow-xs ${
                      task.isCompleted
                        ? 'border-emerald-200 bg-emerald-500/5 opacity-75'
                        : isUrgent
                        ? 'border-rose-300 bg-rose-500/5'
                        : 'border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)]'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleEngineerTask(task.id)}
                      className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        task.isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)]'
                      }`}
                    >
                      {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-bold text-sm ${
                            task.isCompleted
                              ? 'line-through text-[var(--md-sys-color-on-surface-variant)]'
                              : 'text-[var(--md-sys-color-on-surface)]'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline)]/20">
                          {task.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            isUrgent
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                              : isHigh
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                          }`}
                        >
                          {task.priority} Priority
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                        <span>Assigned To: <b>{task.assignedTo}</b></span>
                        <span>•</span>
                        <span>Target Date: <b>{task.targetDate}</b></span>
                        {task.completedAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 font-semibold">
                              Verified at: {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>

                      {task.remarks && (
                        <div className="mt-2 text-xs italic text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] p-2 rounded-xl">
                          "{task.remarks}"
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete task "${task.title}"?`)) {
                          deleteEngineerTask(task.id);
                        }
                      }}
                      className="p-1 rounded-full text-rose-500 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD MILESTONE TASK & CASTING ASSISTANT */}
      {/* ==================================================================== */}
      {addMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-6 font-serif my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Schedule Construction Milestone
                  </h3>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    With Smart Concrete Pour & Curing Calculator
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddMilestoneModalOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMilestoneSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Task / Milestone Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3rd Floor Slab & Beam Casting (Grid A1-D4)"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Zone / Floor Tag <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Level 3 / Deck"
                    value={milestoneForm.zoneFloor}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, zoneFloor: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Assigned Foreman / Supervisor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Md. Jahangir Alam"
                    value={milestoneForm.assignedForeman}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, assignedForeman: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={milestoneForm.startDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Target End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={milestoneForm.endDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              {/* SMART CONCRETE CASTING TOGGLE */}
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                      Smart Concrete Pour & Curing Assistant
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={milestoneForm.isCastingEvent}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, isCastingEvent: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {milestoneForm.isCastingEvent && (
                  <div className="space-y-3 pt-2 border-t border-blue-500/20 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                          Casting Date (Pour Day)
                        </label>
                        <input
                          type="date"
                          value={milestoneForm.castingDate}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, castingDate: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-blue-300 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                          Structural Element Type (De-shuttering Code)
                        </label>
                        <select
                          value={milestoneForm.elementType}
                          onChange={(e) =>
                            setMilestoneForm({ ...milestoneForm, elementType: e.target.value as ElementType })
                          }
                          className="w-full px-3 py-1.5 rounded-full text-xs border border-blue-300 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                        >
                          <option value="vertical-col">Vertical Elements: Columns, Walls (1-2 Days)</option>
                          <option value="slab-short">Slab Soffit (Span &le; 4.5m) (7 Days props)</option>
                          <option value="slab-long">Slab Soffit (Span &gt; 4.5m) (14 Days props)</option>
                          <option value="beam-short">Beam Soffit (Span &le; 6.0m) (14 Days props)</option>
                          <option value="beam-long">Beam Soffit (Span &gt; 6.0m) (21 Days props)</option>
                          <option value="cantilever">Cantilever Slab / Canopy (28 Days)</option>
                        </select>
                      </div>
                    </div>

                    {/* Calculated Live Dates Display */}
                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-blue-700 dark:text-blue-300 block">
                          Mandatory Wet Curing
                        </span>
                        <div className="font-mono font-bold text-sm text-blue-900 dark:text-blue-100 mt-0.5">
                          Until {computedCuringEndDate} (14d)
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-amber-700 dark:text-amber-300 block">
                          Safe De-Shuttering Date
                        </span>
                        <div className="font-mono font-bold text-sm text-amber-900 dark:text-amber-100 mt-0.5">
                          On {computedDeshutterDate} ({deshutteringDays}d)
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-blue-800 dark:text-blue-300 italic flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>
                        Automatic Connection: 7-Day & 28-Day Concrete Cube Crushing tests will be automatically scheduled!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Special Notes & Safety Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ensure 40mm cover blocks tied at 1m spacing; check plumb before pour"
                  value={milestoneForm.notes}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => setAddMilestoneModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-sm cursor-pointer hover:opacity-90"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD DAILY INSPECTION TASK */}
      {/* ==================================================================== */}
      {addInspectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-6 font-serif">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Add Engineer Inspection Item
                  </h3>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Quality audit, rebar check, or safety walkthrough
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddInspectionModalOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInspectionSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Inspection Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Check column C3 line-dori plumb & clear cover blocks"
                  value={inspectionForm.title}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Inspection Category
                  </label>
                  <select
                    value={inspectionForm.category}
                    onChange={(e) =>
                      setInspectionForm({ ...inspectionForm, category: e.target.value as EngineerTask['category'] })
                    }
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  >
                    <option value="Quality Inspection">Quality Inspection</option>
                    <option value="Safety Audit">Safety Audit</option>
                    <option value="Material Checking">Material Checking</option>
                    <option value="Level/Grid Verification">Level/Grid Verification</option>
                    <option value="Client Coordination">Client Coordination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Priority
                  </label>
                  <select
                    value={inspectionForm.priority}
                    onChange={(e) =>
                      setInspectionForm({ ...inspectionForm, priority: e.target.value as EngineerTask['priority'] })
                    }
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Assigned Inspector / Engineer
                  </label>
                  <input
                    type="text"
                    required
                    value={inspectionForm.assignedTo}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, assignedTo: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Target Inspection Date
                  </label>
                  <input
                    type="date"
                    required
                    value={inspectionForm.targetDate}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, targetDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Field Remarks / Criteria to Verify
                </label>
                <input
                  type="text"
                  placeholder="e.g. Slump within 100±25mm; lap length minimum 50d = 800mm for 16mm rebar"
                  value={inspectionForm.remarks}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, remarks: e.target.value })}
                  className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => setAddInspectionModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-sm cursor-pointer hover:opacity-90"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
