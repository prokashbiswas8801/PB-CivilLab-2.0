import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Droplets,
  AlertTriangle,
  Activity,
  Award,
  Sparkles,
  X,
  Check,
  Building,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { CubeTestRecord, ConcreteGrade, CubeTestStatus } from '../../types/siteManagement';

const CONCRETE_GRADES: Array<{ grade: ConcreteGrade; targetMpa: number; targetPsi: number; mixRatio: string }> = [
  { grade: 'M15', targetMpa: 15, targetPsi: 2175, mixRatio: '1:2:4' },
  { grade: 'M20', targetMpa: 20, targetPsi: 2900, mixRatio: '1:1.5:3' },
  { grade: 'M25', targetMpa: 25, targetPsi: 3625, mixRatio: '1:1:2' },
  { grade: 'M30', targetMpa: 30, targetPsi: 4350, mixRatio: 'Design Mix' },
  { grade: 'M35', targetMpa: 35, targetPsi: 5075, mixRatio: 'Design Mix' },
  { grade: 'M40', targetMpa: 40, targetPsi: 5800, mixRatio: 'Design Mix' },
];

export const CubeTestModule: React.FC = () => {
  const {
    siteData,
    activeProjectId,
    addCubeTestRecord,
    updateCubeTestRecord,
    deleteCubeTestRecord,
    addMilestoneTask,
  } = useSiteManagement();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CubeTestStatus>('All');
  const [gradeFilter, setGradeFilter] = useState<string>('All');

  // Modals
  const [isPourModalOpen, setIsPourModalOpen] = useState(false);
  const [isTestResultModalOpen, setIsTestResultModalOpen] = useState(false);
  const [editingCube, setEditingCube] = useState<CubeTestRecord | null>(null);
  const [selectedCubeForPrint, setSelectedCubeForPrint] = useState<CubeTestRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Concrete Pour Entry
  const [pourId, setPourId] = useState('');
  const [castingDate, setCastingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [structuralElement, setStructuralElement] = useState('');
  const [concreteGrade, setConcreteGrade] = useState<ConcreteGrade>('M25');
  const [slumpMm, setSlumpMm] = useState<number | ''>(100);
  const [labName, setLabName] = useState('Central Site Quality Testing Lab');
  const [remarks, setRemarks] = useState('');

  // Form State for Recording Test Results
  const [testedRecord, setTestedRecord] = useState<CubeTestRecord | null>(null);
  const [day7Strength, setDay7Strength] = useState<number | ''>('');
  const [day28Strength, setDay28Strength] = useState<number | ''>('');
  const [testRemarks, setTestRemarks] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered cube test records
  const filteredCubes = useMemo(() => {
    return siteData.cubeTests.filter((cube) => {
      const matchSearch =
        cube.pourId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cube.structuralElement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cube.labName && cube.labName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        cube.concreteGrade.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'All' || cube.status === statusFilter;
      const matchGrade = gradeFilter === 'All' || cube.concreteGrade === gradeFilter;

      return matchSearch && matchStatus && matchGrade;
    });
  }, [siteData.cubeTests, searchQuery, statusFilter, gradeFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = siteData.cubeTests.length;
    const passed = siteData.cubeTests.filter((c) => c.status === 'Passed').length;
    const failed = siteData.cubeTests.filter((c) => c.status === 'Failed').length;
    const scheduled = siteData.cubeTests.filter((c) => c.status === 'Scheduled').length;
    const dueTodayCount = siteData.cubeTests.filter(
      (c) => (c.day7TestDate === todayStr && !c.day7StrengthMPa) || (c.day28TestDate === todayStr && !c.day28StrengthMPa)
    ).length;

    return { total, passed, failed, scheduled, dueTodayCount };
  }, [siteData.cubeTests, todayStr]);

  // Open Log New Pour Modal
  const handleOpenNewPour = () => {
    setEditingCube(null);
    const nextSeq = siteData.cubeTests.length + 1;
    setPourId(`POUR-${nextSeq.toString().padStart(3, '0')}`);
    setCastingDate(new Date().toISOString().split('T')[0]);
    setStructuralElement('');
    setConcreteGrade('M25');
    setSlumpMm(100);
    setLabName('Central Site Quality Testing Lab');
    setRemarks('Sample prepared with standard 150mm steel cube molds & tamping rod.');
    setIsPourModalOpen(true);
  };

  // Open Record Test Results Modal
  const handleOpenRecordResult = (cube: CubeTestRecord) => {
    setTestedRecord(cube);
    setDay7Strength(cube.day7StrengthMPa !== undefined ? cube.day7StrengthMPa : '');
    setDay28Strength(cube.day28StrengthMPa !== undefined ? cube.day28StrengthMPa : '');
    setTestRemarks(cube.remarks || '');
    setIsTestResultModalOpen(true);
  };

  // Save New Pour
  const handleSavePour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!structuralElement.trim()) {
      showToast('⚠️ Please specify the Structural Element (e.g. 3rd Floor Slab & Beams).');
      return;
    }
    const target = CONCRETE_GRADES.find((g) => g.grade === concreteGrade)?.targetMpa || 25;

    const payload = {
      pourId: pourId.trim() || `POUR-${Date.now().toString(36).toUpperCase()}`,
      castingDate,
      structuralElement: structuralElement.trim(),
      concreteGrade,
      targetStrengthMPa: target,
      slumpMm: Number(slumpMm) || 100,
      status: 'Scheduled' as const,
      labName: labName.trim() || 'Central Quality Lab',
      remarks: remarks.trim() || undefined,
    };

    if (editingCube) {
      updateCubeTestRecord(editingCube.id, payload);
      showToast(`Updated concrete pour ${payload.pourId}`);
    } else {
      addCubeTestRecord(payload);
      showToast(`Logged casting pour & auto-scheduled 7-Day / 28-Day testing and BNBC curing in Schedule Roster (SM-03)!`);
    }

    setIsPourModalOpen(false);
  };

  // 1-Click Sync to Schedule & Roster (SM-03)
  const handleSyncToSchedule = (cube: CubeTestRecord) => {
    const castDate = new Date(cube.castingDate);
    const d7 = new Date(castDate);
    d7.setDate(d7.getDate() + 7);
    const day7Str = d7.toISOString().split('T')[0];

    const d28 = new Date(castDate);
    d28.setDate(d28.getDate() + 28);
    const day28Str = d28.toISOString().split('T')[0];

    const curingEnd = new Date(castDate);
    curingEnd.setDate(curingEnd.getDate() + 14);
    const curingEndStr = curingEnd.toISOString().split('T')[0];

    const isColumnOrWall = /col|column|wall|pillar|lift|core/i.test(cube.structuralElement);
    const deshutterDays = isColumnOrWall ? 2 : 21;
    const deshutter = new Date(castDate);
    deshutter.setDate(deshutter.getDate() + deshutterDays);
    const deshutterStr = deshutter.toISOString().split('T')[0];

    addMilestoneTask({
      title: `Curing & De-shuttering: ${cube.structuralElement} (${cube.concreteGrade})`,
      zoneFloor: cube.structuralElement,
      startDate: cube.castingDate,
      endDate: deshutterStr,
      progress: 35,
      isCastingEvent: true,
      castingDate: cube.castingDate,
      autoCuringEndDate: curingEndStr,
      autoDeshutteringDate: deshutterStr,
      linkedCubeTestId: cube.id,
      status: 'Under Curing',
      priority: 'Critical',
      assignedForeman: 'Site Quality Officer',
      notes: `BNBC-2020 Concrete Quality: Continuous curing till ${curingEndStr}. 7-day test: ${day7Str}, 28-day test: ${day28Str}. Formwork de-shuttering target: ${deshutterStr} (${deshutterDays} days).`,
    });

    showToast(`✓ Synced 7d/28d crushing milestones & BNBC de-shuttering (${deshutterStr}) to Schedule Roster (SM-03)!`);
  };

  // Save Test Results
  const handleSaveTestResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testedRecord) return;

    const d7 = day7Strength !== '' ? Number(day7Strength) : undefined;
    const d28 = day28Strength !== '' ? Number(day28Strength) : undefined;

    updateCubeTestRecord(testedRecord.id, {
      day7StrengthMPa: d7,
      day28StrengthMPa: d28,
      remarks: testRemarks.trim() || undefined,
    });

    showToast(`Saved crushing test results for ${testedRecord.pourId}`);
    setIsTestResultModalOpen(false);
  };

  // Delete
  const handleDelete = (id: string, pour: string) => {
    if (confirm(`Delete cube test record ${pour}?`)) {
      deleteCubeTestRecord(id);
      showToast(`Deleted ${pour}`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredCubes.length === 0) {
      showToast('⚠️ No cube records to export.');
      return;
    }
    const headers = [
      'Pour ID',
      'Structural Element',
      'Casting Date',
      'Grade',
      'Target Strength (MPa)',
      'Slump (mm)',
      '7-Day Test Date',
      '7-Day Result (MPa)',
      '7-Day DCR',
      '28-Day Test Date',
      '28-Day Result (MPa)',
      '28-Day DCR',
      'Overall Status',
      'Testing Lab',
      'Remarks',
    ];
    const rows = filteredCubes.map((c) => [
      `"${c.pourId}"`,
      `"${c.structuralElement.replace(/"/g, '""')}"`,
      `"${c.castingDate}"`,
      `"${c.concreteGrade}"`,
      c.targetStrengthMPa,
      c.slumpMm,
      `"${c.day7TestDate}"`,
      c.day7StrengthMPa ?? '',
      c.day7PassDcr ? c.day7PassDcr.toFixed(2) : '',
      `"${c.day28TestDate}"`,
      c.day28StrengthMPa ?? '',
      c.day28PassDcr ? c.day28PassDcr.toFixed(2) : '',
      `"${c.status}"`,
      `"${(c.labName || '').replace(/"/g, '""')}"`,
      `"${(c.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Concrete_Cube_Register_${activeProjectId}_${new Date().toISOString().split('T')[0]}.csv`);
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
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Module 08 • ERP-08
            </span>
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Project: {activeProjectId}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-[var(--md-sys-color-on-surface)] tracking-tight">
            Concrete Pour & Cube/Cylinder Test Register
          </h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-2xl font-serif">
            Automated 7-Day & 28-Day crushing schedules, slump verification, ACI 308 curing alerts, and characteristic compressive strength PASS/FAIL certification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenNewPour}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Concrete Pour</span>
          </button>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
            Total Pours Logged
          </span>
          <div className="text-2xl font-bold font-serif text-[var(--md-sys-color-on-surface)] tabular-nums mt-1">
            {stats.total}
          </div>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            {siteData.cubeTests.reduce((acc, c) => acc + (c.day28StrengthMPa ? 1 : 0), 0)} fully completed
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Passed Target (DCR ≥ 1.0)
          </span>
          <div className="text-2xl font-bold font-serif text-emerald-600 tabular-nums mt-1">
            {stats.passed}
          </div>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Achieved 28-day design strength
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
            Failed / Under-strength
          </span>
          <div className="text-2xl font-bold font-serif text-rose-600 tabular-nums mt-1">
            {stats.failed}
          </div>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Requires core test / NDT
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
            Scheduled / In Curing
          </span>
          <div className="text-2xl font-bold font-serif text-amber-600 tabular-nums mt-1">
            {stats.scheduled}
          </div>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Awaiting 7-day or 28-day date
          </span>
        </div>

        <div
          className={`p-4 rounded-3xl border shadow-sm transition-all ${
            stats.dueTodayCount > 0
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-100 animate-pulse'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-100'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Tests Due Today
          </span>
          <div className="text-2xl font-bold font-serif tabular-nums mt-1">
            {stats.dueTodayCount}
          </div>
          <span className="text-[11px] opacity-80">
            {stats.dueTodayCount > 0 ? 'Send samples to lab immediately!' : 'No crushing due today'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
          <input
            type="text"
            placeholder="Search by Pour ID, Structural Member, Concrete Grade, Testing Lab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-serif"
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
              <option value="Scheduled">Scheduled</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] font-serif">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer max-w-[120px] truncate"
            >
              <option value="All">All Grades</option>
              {CONCRETE_GRADES.map((g) => (
                <option key={g.grade} value={g.grade}>
                  {g.grade} ({g.targetMpa} MPa)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Register Table */}
      <div className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                <th className="py-3.5 px-4">Sample ID & Pour Date</th>
                <th className="py-3.5 px-4">Structural Element</th>
                <th className="py-3.5 px-4 text-center">Grade & Slump</th>
                <th className="py-3.5 px-4 text-center">7-Day Test (Target 67%)</th>
                <th className="py-3.5 px-4 text-center">28-Day Test (Target 100%)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-xs font-serif">
              {filteredCubes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
                    <Layers className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-600" />
                    <p className="font-medium text-sm">No Concrete Pour Records Found</p>
                    <p className="text-xs opacity-75 mt-0.5">Click "+ Log Concrete Pour" to record your casting batch.</p>
                  </td>
                </tr>
              ) : (
                filteredCubes.map((cube) => {
                  const isDay7DueToday = cube.day7TestDate === todayStr && !cube.day7StrengthMPa;
                  const isDay28DueToday = cube.day28TestDate === todayStr && !cube.day28StrengthMPa;
                  const target7 = cube.targetStrengthMPa * 0.67;

                  return (
                    <tr
                      key={cube.id}
                      className="hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors group"
                    >
                      {/* Sample ID & Pour Date */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[var(--md-sys-color-on-surface)] font-mono">
                          {cube.pourId}
                        </div>
                        <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                          Cast: {cube.castingDate}
                        </div>
                      </td>

                      {/* Structural Member */}
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                          {cube.structuralElement}
                        </div>
                        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                          Lab: {cube.labName || 'Standard Site Lab'}
                        </div>
                      </td>

                      {/* Grade & Slump */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          {cube.concreteGrade} ({cube.targetStrengthMPa} MPa)
                        </span>
                        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
                          Slump: {cube.slumpMm} mm
                        </div>
                      </td>

                      {/* 7-Day Crushing */}
                      <td className="py-3 px-4 text-center">
                        {cube.day7StrengthMPa !== undefined ? (
                          <div>
                            <span
                              className={`font-bold tabular-nums text-xs ${
                                cube.day7StrengthMPa >= target7 ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              {cube.day7StrengthMPa} MPa
                            </span>
                            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block font-mono">
                              DCR: {(cube.day7StrengthMPa / target7).toFixed(2)} ({Math.round((cube.day7StrengthMPa / cube.targetStrengthMPa) * 100)}%)
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                              {cube.day7TestDate}
                            </span>
                            {isDay7DueToday && (
                              <span className="block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 animate-pulse">
                                Due Today!
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 28-Day Crushing */}
                      <td className="py-3 px-4 text-center">
                        {cube.day28StrengthMPa !== undefined ? (
                          <div>
                            <span
                              className={`font-bold tabular-nums text-xs ${
                                cube.day28StrengthMPa >= cube.targetStrengthMPa
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {cube.day28StrengthMPa} MPa
                            </span>
                            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block font-mono">
                              DCR: {(cube.day28StrengthMPa / cube.targetStrengthMPa).toFixed(2)} ({Math.round((cube.day28StrengthMPa / cube.targetStrengthMPa) * 100)}%)
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                              {cube.day28TestDate}
                            </span>
                            {isDay28DueToday && (
                              <span className="block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 animate-pulse">
                                Due Today!
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold ${
                            cube.status === 'Passed'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : cube.status === 'Failed'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {cube.status === 'Passed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : cube.status === 'Failed' ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>{cube.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleSyncToSchedule(cube)}
                            title="1-Click Sync to Schedule & Roster (SM-03): adds 7d/28d crushing & BNBC de-shuttering milestones"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-all hover:scale-105 cursor-pointer"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Sync Schedule</span>
                          </button>
                          <button
                            onClick={() => handleOpenRecordResult(cube)}
                            title="Record Crushing Strength Results"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
                          >
                            <Activity className="w-3 h-3" />
                            <span>Record Test</span>
                          </button>
                          <button
                            onClick={() => setSelectedCubeForPrint(cube)}
                            title="Print Official Certificate"
                            className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                          >
                            <Printer className="w-4 h-4 text-indigo-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(cube.id, cube.pourId)}
                            title="Delete Record"
                            className="p-1.5 rounded-full hover:bg-rose-500/10 text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* MODAL 1: LOG CONCRETE POUR */}
      {isPourModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
              <div>
                <h3 className="text-xl font-bold font-serif text-[var(--md-sys-color-on-surface)]">
                  Log Concrete Casting Pour
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-serif">
                  Automatically schedules 7-day and 28-day laboratory testing and 14-day curing.
                </p>
              </div>
              <button
                onClick={() => setIsPourModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePour} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Sample / Pour ID
                  </label>
                  <input
                    type="text"
                    required
                    value={pourId}
                    onChange={(e) => setPourId(e.target.value)}
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Casting Date
                  </label>
                  <input
                    type="date"
                    required
                    value={castingDate}
                    onChange={(e) => setCastingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Structural Element / Pour Zone
                </label>
                <input
                  type="text"
                  required
                  value={structuralElement}
                  onChange={(e) => setStructuralElement(e.target.value)}
                  placeholder="e.g. 4th Floor Slab & Beams (Grid A1-D4)"
                  className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Concrete Grade
                  </label>
                  <select
                    value={concreteGrade}
                    onChange={(e) => setConcreteGrade(e.target.value as ConcreteGrade)}
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                  >
                    {CONCRETE_GRADES.map((g) => (
                      <option key={g.grade} value={g.grade}>
                        {g.grade} ({g.targetMpa} MPa / {g.targetPsi} psi)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Slump Value (mm)
                  </label>
                  <input
                    type="number"
                    required
                    value={slumpMm}
                    onChange={(e) => setSlumpMm(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Testing Facility / Lab Name
                </label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="e.g. BUET Civil Materials Testing Lab"
                  className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Remarks / Mix Spec
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. 150mm standard steel molds, 3 sets sampled"
                  className="w-full px-4 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <button
                  type="button"
                  onClick={() => setIsPourModalOpen(false)}
                  className="px-5 py-2 rounded-full text-xs font-medium border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Log Pour & Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD TEST RESULTS */}
      {isTestResultModalOpen && testedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
              <div>
                <h3 className="text-xl font-bold font-serif text-[var(--md-sys-color-on-surface)]">
                  Record Crushing Strength Results
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
                  {testedRecord.pourId} • {testedRecord.structuralElement}
                </p>
              </div>
              <button
                onClick={() => setIsTestResultModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTestResult} className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Target 28-Day Strength:</span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    {testedRecord.targetStrengthMPa} MPa ({testedRecord.concreteGrade})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Expected 7-Day Target (67%):</span>
                  <span className="font-bold font-mono">
                    {(testedRecord.targetStrengthMPa * 0.67).toFixed(1)} MPa
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    7-Day Strength (MPa)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={day7Strength}
                    onChange={(e) => setDay7Strength(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 18.5"
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] tabular-nums"
                  />
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block mt-0.5">
                    Test Date: {testedRecord.day7TestDate}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    28-Day Strength (MPa)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={day28Strength}
                    onChange={(e) => setDay28Strength(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 27.2"
                    className="w-full px-3 py-2 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-indigo-500/40 font-bold tabular-nums"
                  />
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block mt-0.5">
                    Test Date: {testedRecord.day28TestDate}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Crushing Observations / Lab Notes
                </label>
                <textarea
                  rows={2}
                  value={testRemarks}
                  onChange={(e) => setTestRemarks(e.target.value)}
                  placeholder="e.g. Clean shear cone fracture mode observed; tested on Universal Testing Machine."
                  className="w-full px-4 py-2 rounded-2xl text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] font-serif resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <button
                  type="button"
                  onClick={() => setIsTestResultModalOpen(false)}
                  className="px-5 py-2 rounded-full text-xs font-medium border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Results & Evaluate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE TEST CERTIFICATE */}
      {selectedCubeForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
          <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-white text-zinc-900 border border-zinc-200 shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
            {/* Modal Controls */}
            <div className="flex items-center justify-between p-4 bg-zinc-100 border-b border-zinc-200 print:hidden">
              <span className="text-xs font-semibold text-zinc-600 uppercase">
                Concrete Compressive Strength Certificate
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 text-white"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setSelectedCubeForPrint(null)}
                  className="p-1 rounded-full hover:bg-zinc-200 text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="p-8 md:p-10 space-y-6 font-serif">
              <div className="text-center pb-4 border-b-2 border-zinc-800 space-y-1">
                <h3 className="text-xl font-bold uppercase tracking-tight">BD. CivilLab Materials Quality Control</h3>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-sans">
                  Concrete Cube Compressive Strength Test Certificate (BS 1881 / ASTM C39 / BNBC 2020)
                </p>
                <div
                  className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                    selectedCubeForPrint.status === 'Passed'
                      ? 'bg-emerald-600 text-white'
                      : selectedCubeForPrint.status === 'Failed'
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-800 text-white'
                  }`}
                >
                  Result: {selectedCubeForPrint.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="font-semibold text-zinc-500 uppercase">Sample ID:</span> <strong className="font-mono">{selectedCubeForPrint.pourId}</strong></div>
                <div className="text-right"><span className="font-semibold text-zinc-500 uppercase">Casting Date:</span> {selectedCubeForPrint.castingDate}</div>
                <div><span className="font-semibold text-zinc-500 uppercase">Structural Member:</span> <strong>{selectedCubeForPrint.structuralElement}</strong></div>
                <div className="text-right"><span className="font-semibold text-zinc-500 uppercase">Testing Laboratory:</span> {selectedCubeForPrint.labName || 'Site Central Lab'}</div>
                <div><span className="font-semibold text-zinc-500 uppercase">Design Concrete Grade:</span> <strong className="font-mono">{selectedCubeForPrint.concreteGrade} ({selectedCubeForPrint.targetStrengthMPa} MPa)</strong></div>
                <div className="text-right"><span className="font-semibold text-zinc-500 uppercase">Slump at Pour:</span> {selectedCubeForPrint.slumpMm} mm</div>
              </div>

              {/* Strength Table */}
              <div className="overflow-hidden border border-zinc-300 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[10px] border-b border-zinc-300">
                    <tr>
                      <th className="py-2.5 px-3">Age of Test</th>
                      <th className="py-2.5 px-3 text-center">Scheduled Date</th>
                      <th className="py-2.5 px-3 text-right">Required Target</th>
                      <th className="py-2.5 px-3 text-right">Crushing Result</th>
                      <th className="py-2.5 px-3 text-center">Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    <tr>
                      <td className="py-3 px-3 font-bold">7-Day Test</td>
                      <td className="py-3 px-3 text-center font-mono">{selectedCubeForPrint.day7TestDate}</td>
                      <td className="py-3 px-3 text-right font-mono">{(selectedCubeForPrint.targetStrengthMPa * 0.67).toFixed(1)} MPa</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {selectedCubeForPrint.day7StrengthMPa !== undefined ? `${selectedCubeForPrint.day7StrengthMPa} MPa` : 'Awaiting'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {selectedCubeForPrint.day7StrengthMPa !== undefined ? (
                          selectedCubeForPrint.day7StrengthMPa >= selectedCubeForPrint.targetStrengthMPa * 0.67 ? (
                            <span className="text-emerald-700">Satisfactory</span>
                          ) : (
                            <span className="text-amber-700">Marginal</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold">28-Day Test (Governing)</td>
                      <td className="py-3 px-3 text-center font-mono">{selectedCubeForPrint.day28TestDate}</td>
                      <td className="py-3 px-3 text-right font-mono">{selectedCubeForPrint.targetStrengthMPa} MPa</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                        {selectedCubeForPrint.day28StrengthMPa !== undefined ? `${selectedCubeForPrint.day28StrengthMPa} MPa` : 'Awaiting'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {selectedCubeForPrint.day28StrengthMPa !== undefined ? (
                          selectedCubeForPrint.day28StrengthMPa >= selectedCubeForPrint.targetStrengthMPa ? (
                            <span className="text-emerald-700">PASS (Compliant)</span>
                          ) : (
                            <span className="text-rose-700">FAIL (Non-Compliant)</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
                <span className="font-bold text-zinc-700">Remarks: </span>
                <span>{selectedCubeForPrint.remarks || 'Standard moist curing compliance in site curing tank observed.'}</span>
              </div>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-2 gap-6 text-center text-xs">
                <div className="border-t border-zinc-400 pt-2 space-y-0.5">
                  <p className="font-bold">Tested By QC Technician</p>
                  <p className="text-[10px] text-zinc-500">Materials Testing Lab</p>
                </div>
                <div className="border-t border-zinc-400 pt-2 space-y-0.5">
                  <p className="font-bold">Certified By Resident Engineer</p>
                  <p className="text-[10px] text-zinc-500">BD. CivilLab Construction Supervision</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
