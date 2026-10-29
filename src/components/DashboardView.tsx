import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calculator,
  FileSpreadsheet,
  HardHat,
  Waves,
  Boxes,
  Hammer,
  Grid,
  Shovel,
  Sparkles,
  Scale,
  SlidersHorizontal,
  FolderArchive,
  Download,
  Printer,
  ShieldCheck,
  Search,
  Plus,
  ArrowRight,
  RotateCcw,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Award,
  Layers,
  FileText,
} from 'lucide-react';
import {
  EngineeringModuleId,
  CivilWorkspace,
  UserProfile,
  CalculationRecord,
} from '../types/civil';
import {
  CalculationEnvelope,
  BOQResult,
  RebarBBSResult,
  ConcreteMixResult,
  ConcreteMaterialResult,
  getCurrencySymbol,
} from '../utils/calculations';
import { CapacityUtilizationInfo } from '../utils/analyticalExport';
import { Logo, BrandLogoIcon } from './Logo';

export interface DashboardViewProps {
  activeWorkspace: CivilWorkspace;
  workspaces: CivilWorkspace[];
  activeModule: EngineeringModuleId;
  onSelectModule: (moduleId: EngineeringModuleId) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onOpenNewWorkspace: () => void;
  onOpenWorkspaceManager: () => void;
  onOpenProfileModal: (tab: 'profile' | 'preferences' | 'presets') => void;
  onOpenPrintPreview: () => void;
  onDirectDownloadPdf: () => void;
  calculationHistory: CalculationRecord[];
  onRestoreCalculation?: (record: CalculationRecord) => void;
  userProfile: UserProfile;
  boqEnvelope: CalculationEnvelope<BOQResult>;
  bbsEnvelope: CalculationEnvelope<RebarBBSResult>;
  concreteEnvelope: CalculationEnvelope<ConcreteMixResult>;
  matEnvelope: CalculationEnvelope<ConcreteMaterialResult>;
  capacityInfo: CapacityUtilizationInfo | null;
  moduleMeta: Record<
    EngineeringModuleId,
    { label: string; shortLabel: string; codeStandard: string; icon: React.ComponentType<{ className?: string }> }
  >;
}

type ModuleCategoryFilter = 'all' | 'structural' | 'geotech' | 'hydraulics' | 'estimation' | 'materials';

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeWorkspace,
  workspaces,
  activeModule,
  onSelectModule,
  onSelectWorkspace,
  onOpenNewWorkspace,
  onOpenWorkspaceManager,
  onOpenProfileModal,
  onOpenPrintPreview,
  onDirectDownloadPdf,
  calculationHistory,
  onRestoreCalculation,
  userProfile,
  boqEnvelope,
  bbsEnvelope,
  concreteEnvelope,
  matEnvelope,
  capacityInfo,
  moduleMeta,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ModuleCategoryFilter>('all');

  // Categorize modules
  const moduleCategories: Record<EngineeringModuleId, ModuleCategoryFilter> = {
    'boq-estimator': 'estimation',
    'rate-analysis': 'estimation',
    'unit-converter': 'materials',
    'concrete-materials': 'materials',
    'rebar-bbs': 'structural',
    'masonry-finishes': 'materials',
    'earthwork-alignment': 'geotech',
    'beam-analysis': 'structural',
    'bearing-capacity': 'geotech',
    'concrete-mix': 'materials',
    'open-channel': 'hydraulics',
    'continuous-beam': 'structural',
    'pile-capacity': 'geotech',
    'pipe-hydraulics': 'hydraulics',
    'surveying-suite': 'geotech',
  };

  // Engineering formulas and methods associated with each solver module
  const MODULE_FORMULAS: Record<EngineeringModuleId, string[]> = {
    'boq-estimator': ['Takeoff Quantity', 'Rate Schedule', 'Subtotal & Overhead', 'VAT / Tax Markup'],
    'rate-analysis': ['Labor Breakdown', 'Equipment Factor', 'Material Yield', 'Overhead & Profit'],
    'unit-converter': ['SI to Imperial', 'Unit Weights', 'Stress (MPa / psi)', 'Section Modulus'],
    'concrete-materials': ['Dry Volume Factor 1.54', 'Nominal Ratios (1:2:4)', 'Cement Bag Tally', 'Aggregate Yield'],
    'rebar-bbs': ['Bar Bending Schedule', 'Unit Weight W = D²/162', 'Hook Allowance', 'Cutting Length', 'Tonnage'],
    'masonry-finishes': ['Brick Mortar Ratio', 'Plaster Factor 1.33', 'Paint Coverage', 'Wastage Allowance'],
    'earthwork-alignment': ['Average End Area', 'Prismoidal Volume', 'Cut & Fill Balance', 'Shrinkage & Bulking'],
    'beam-analysis': ['Euler-Bernoulli Elastic Flexure', 'Maximum Moment wL²/8', 'Shear V = wL/2', 'Deflection 5wL⁴/(384EI)'],
    'bearing-capacity': ['Terzaghi Bearing Capacity', 'Meyerhof General Equation', 'Nc, Nq, Nγ Factors', 'Allowable Bearing q_all'],
    'concrete-mix': ['ACI 211.1 Mix Design', 'Water-Cement Ratio (w/c)', 'Coarse Aggregate Bulk Vol', '28-Day Target Strength f’cr'],
    'open-channel': ['Manning Open Channel Equation', 'Hydraulic Radius R = A/P', 'Froude Number Fr', 'Critical & Normal Depth'],
    'continuous-beam': ['Clapeyron Three-Moment Equation', 'Multi-Span Moment Redistribution', 'Bending Envelope', 'Support Reactions'],
    'pile-capacity': ['Static Pile Bearing', 'Alpha Method (Cohesion)', 'Beta Method (Friction)', 'Total Ultimate Q_ult'],
    'pipe-hydraulics': ['Darcy-Weisbach Head Loss', 'Hazen-Williams Equation', 'Colebrook-White Friction f', 'Reynolds Number Re'],
    'surveying-suite': ["Heron's Formula", 'Shoelace Algorithm', 'Rise & Fall Leveling', 'Height of Instrument (HI)', 'Decimal / Katha / Acre'],
  };

  // Filter modules based on search, formulas, and category
  const filteredModules = useMemo(() => {
    const allModules = Object.keys(moduleMeta) as EngineeringModuleId[];
    return allModules.filter((modId) => {
      const meta = moduleMeta[modId];
      const cat = moduleCategories[modId];

      const matchesCategory = categoryFilter === 'all' || cat === categoryFilter;
      const query = searchQuery.trim().toLowerCase();
      const formulas = MODULE_FORMULAS[modId] || [];
      const formulaMatch = formulas.some((f) => f.toLowerCase().includes(query));

      const matchesSearch =
        !query ||
        meta.label.toLowerCase().includes(query) ||
        meta.shortLabel.toLowerCase().includes(query) ||
        meta.codeStandard.toLowerCase().includes(query) ||
        modId.toLowerCase().includes(query) ||
        formulaMatch;

      return matchesCategory && matchesSearch;
    });
  }, [moduleMeta, categoryFilter, searchQuery]);

  // Filter activity history based on search
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return calculationHistory;
    const q = searchQuery.trim().toLowerCase();
    return calculationHistory.filter(
      (rec) =>
        rec.title.toLowerCase().includes(q) ||
        rec.notes.toLowerCase().includes(q) ||
        rec.moduleId.toLowerCase().includes(q) ||
        rec.workspaceId.toLowerCase().includes(q)
    );
  }, [calculationHistory, searchQuery]);

  // Project statistics for Top Hero Command Cards
  const boqTotal = boqEnvelope.result?.grandTotalAmount ?? 0;
  const boqItemsCount = boqEnvelope.result?.totalItemCount ?? 0;
  const steelTonnes = bbsEnvelope.result?.totalSteelTonnes ?? 0;
  const steelKg = bbsEnvelope.result?.totalSteelWeightKg ?? 0;
  const concreteVolumeM3 = concreteEnvelope.result?.batchVolumeM3 ?? 0;
  const cementBagsCount = concreteEnvelope.result?.cementBags50Kg ?? 0;

  // Stagger animation container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const projectStatus = capacityInfo?.status ?? 'nominal';

  const catColors: Record<ModuleCategoryFilter, { bg: string; text: string; border: string }> = {
    all: { bg: 'bg-zinc-500/10', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-500/20' },
    structural: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
    geotech: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
    hydraulics: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20' },
    estimation: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
    materials: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-7xl mx-auto px-4 md:px-6 pt-5">
      {/* 1. DYNAMIC MATERIAL YOU HERO COMMAND BANNER */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`rounded-3xl p-6 md:p-8 border shadow-xs relative overflow-hidden transition-colors ${
          projectStatus === 'critical'
            ? 'border-rose-500/40 bg-rose-500/5 text-[var(--md-sys-color-on-surface)]'
            : projectStatus === 'warning'
            ? 'border-amber-500/40 bg-amber-500/5 text-[var(--md-sys-color-on-surface)]'
            : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--md-sys-color-primary)]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="font-bold text-[var(--md-sys-color-primary)]">[{activeWorkspace.projectCode}]</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)] opacity-50">·</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">{activeWorkspace.siteLocation}</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)] opacity-50">·</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Code: {activeWorkspace.governingCode}</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)] opacity-50">·</span>
              <span className={`font-bold text-[10px] uppercase tracking-wider ${
                projectStatus === 'critical'
                  ? 'text-rose-600 dark:text-rose-400'
                  : projectStatus === 'warning'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {projectStatus === 'critical' ? 'Limit Exceeded' : projectStatus === 'warning' ? 'Check Limit' : 'Limits Verified'}
              </span>
            </div>

            <div className="flex items-center gap-3.5 pt-1">
              <BrandLogoIcon size={48} animated={true} className="shadow-xs border border-[var(--md-sys-color-outline-variant)] shrink-0" />
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)] leading-tight">
                  {activeWorkspace.name}
                </h1>
                <div className="text-[11px] font-mono font-bold text-[var(--md-sys-color-primary)] tracking-wider uppercase mt-0.5">
                  PB CivilLab · Precision Computational Suite
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-2xl leading-relaxed">
              Integrated civil, structural, geotechnical, and hydraulic design workspace. Real-time limit-state convergence, verified code formulations, and one-click submittals.
            </p>

            {/* Quick Workspace Switcher strip */}
            {workspaces.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 custom-scrollbar text-xs">
                <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] shrink-0">Switch Project:</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {workspaces.map((ws) => {
                    const isCur = ws.id === activeWorkspace.id;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => onSelectWorkspace(ws.id)}
                        className={`touch-target-48 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          isCur
                            ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                            : 'bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]'
                        }`}
                        title={`Switch to ${ws.name}`}
                      >
                        [{ws.projectCode}] {ws.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Commands */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onDirectDownloadPdf}
              className="touch-target-48 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-all btn-tactile"
              title="Download Certified PDF Submittal Report (jsPDF)"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onOpenPrintPreview}
              className="touch-target-48 px-4 py-2.5 rounded-2xl bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-all btn-tactile"
              title="Print Preview Modal with QR & Official Stamp"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Print A4</span>
            </button>

            <button
              type="button"
              onClick={onOpenWorkspaceManager}
              className="touch-target-48 px-3.5 py-2.5 rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all btn-tactile"
              title="Switch or Manage Project Workspaces"
            >
              <FolderArchive className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="hidden sm:inline">Projects ({workspaces.length})</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewWorkspace}
              className="touch-target-48 px-3.5 py-2.5 rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all btn-tactile"
              title="Create New Project Workspace"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* 2. PROJECT SUMMARY & KPI COMMAND CARDS (FRAMER MOTION STAGGERED) */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Grand Total BOQ Estimate */}
        <motion.div
          variants={itemVariants}
          onClick={() => onSelectModule('boq-estimator')}
          className="rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] transition-all cursor-pointer group shadow-xs hover:shadow-md relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-[var(--md-sys-color-primary)] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Takeoff <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
              Grand Total BOQ Estimate
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-[var(--md-sys-color-on-surface)] truncate">
              {getCurrencySymbol(activeWorkspace.currency)}{' '}
              {boqTotal > 0 ? boqTotal.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
              <span>{boqItemsCount} billable line items</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active Takeoff</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Governing DCR Capacity State */}
        <motion.div
          variants={itemVariants}
          onClick={() => onSelectModule(activeModule)}
          className="rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] transition-all cursor-pointer group shadow-xs hover:shadow-md relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              DCR Live <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
              Demand-Capacity Ratio (DCR)
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-[var(--md-sys-color-on-surface)] flex items-baseline gap-2">
              <span>{capacityInfo ? capacityInfo.formattedValue : 'Nominal'}</span>
              <span className={`text-xs font-semibold ${
                capacityInfo?.status === 'critical'
                  ? 'text-rose-600 dark:text-rose-400'
                  : capacityInfo?.status === 'warning'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {capacityInfo?.status === 'critical' ? 'Exceeded' : capacityInfo?.status === 'warning' ? 'Check Limit' : 'Verified'}
              </span>
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
              {capacityInfo?.metricLabel || 'Structural & geotechnical safety limits OK'}
            </div>
          </div>
        </motion.div>

        {/* Card 3: Reinforcement Steel Rebar BBS */}
        <motion.div
          variants={itemVariants}
          onClick={() => onSelectModule('rebar-bbs')}
          className="rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] transition-all cursor-pointer group shadow-xs hover:shadow-md relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Hammer className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              BBS <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
              Reinforcement Steel (BBS)
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-[var(--md-sys-color-on-surface)] truncate">
              {steelTonnes > 0 ? steelTonnes.toFixed(2) : (steelKg / 1000).toFixed(2)}{' '}
              <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">Tonnes</span>
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
              {(steelKg).toLocaleString(undefined, { maximumFractionDigits: 0 })} kg · Grade 60 / 500W
            </div>
          </div>
        </motion.div>

        {/* Card 4: Engineer of Record Credential */}
        <motion.div
          variants={itemVariants}
          onClick={() => onOpenProfileModal('profile')}
          className="rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] transition-all cursor-pointer group shadow-xs hover:shadow-md relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Credentials <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
              Engineer of Record (EOR)
            </div>
            <div className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)] truncate">
              {userProfile.fullName || 'Project Engineer, PE'}
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
              {userProfile.licenseNumber ? `Lic: ${userProfile.licenseNumber}` : userProfile.organization || userProfile.designation}
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* 3. SEARCH & CATEGORY FILTER BAR */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 14+ modules, formulas, code standards..."
              className="w-full pl-10 pr-12 py-2.5 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-xs md:text-sm text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar text-xs font-semibold">
            {[
              { id: 'all', label: 'All Modules' },
              { id: 'structural', label: 'Structural' },
              { id: 'geotech', label: 'Geotechnical' },
              { id: 'hydraulics', label: 'Hydraulics' },
              { id: 'estimation', label: 'BOQ & Cost' },
              { id: 'materials', label: 'Materials' },
            ].map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id as ModuleCategoryFilter)}
                  className={`touch-target-48 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-bold'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. QUICK LAUNCHER GRID FOR 14+ ENGINEERING MODULES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
            Engineering Solvers &amp; Modules ({filteredModules.length})
          </h2>
          <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
            Verified BNBC-2020 / ACI-318 / AISC 360
          </span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredModules.map((modId) => {
            const meta = moduleMeta[modId];
            const Icon = meta.icon;
            const isCurrentlyActive = activeModule === modId;
            const cat = moduleCategories[modId];
            const catColor = catColors[cat] || catColors.all;
            const formulas = MODULE_FORMULAS[modId] || [];

            return (
              <motion.div
                key={modId}
                variants={itemVariants}
                onClick={() => onSelectModule(modId)}
                className={`rounded-3xl p-5 border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                  isCurrentlyActive
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)] shadow-sm'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-outline)] shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 uppercase font-semibold">
                      <span className={catColor.text}>{cat}</span>
                      <span className="opacity-40">·</span>
                      <span>{meta.shortLabel}</span>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-1">
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors leading-snug">
                      {meta.label}
                    </h3>
                    <p className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] opacity-80">
                      {meta.codeStandard}
                    </p>
                  </div>

                  {/* Formula and Key Methods Badges */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {formulas.slice(0, 2).map((formula, fIdx) => (
                      <span
                        key={fIdx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] leading-tight"
                      >
                        {formula}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)] text-[11px]">
                      {isCurrentlyActive ? 'Current Workspace' : 'Launch Module'}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[var(--md-sys-color-surface-container)] group-hover:bg-[var(--md-sys-color-primary)] group-hover:text-[var(--md-sys-color-on-primary)] flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 5. RECENT CALCULATIONS & ACTIVITY STREAM */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left 2 Cols: Activity Ledger */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                Recent Calculations &amp; Snapshots
              </h2>
            </div>
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              {filteredHistory.length} Recorded Snapshots
            </span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] space-y-2">
              <Clock className="w-8 h-8 mx-auto text-[var(--md-sys-color-outline)]" />
              <div className="font-semibold text-sm text-[var(--md-sys-color-on-surface)]">
                {searchQuery ? `No Snapshots Found for "${searchQuery}"` : 'No Snapshots Logged Yet'}
              </div>
              <div>Use the "Log Snapshot" command button in any engineering solver to persist calculations to your activity stream.</div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredHistory.slice(0, 6).map((record) => {
                const meta = moduleMeta[record.moduleId];
                const Icon = meta ? meta.icon : Activity;

                return (
                  <div
                    key={record.id}
                    className="rounded-2xl p-4 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                            {record.title}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                            {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-1">
                          {record.notes}
                        </div>

                        {/* Metric Tags */}
                        {record.keyMetrics && record.keyMetrics.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                            {record.keyMetrics.slice(0, 3).map((km, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]">
                                {km.label}: <strong>{km.value}</strong> {km.unit}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectModule(record.moduleId);
                          if (onRestoreCalculation) onRestoreCalculation(record);
                        }}
                        className="touch-target-48 px-3 py-1.5 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-primary)] hover:text-white hover:border-transparent text-xs font-semibold text-[var(--md-sys-color-on-surface)] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Open this module and restore snapshot inputs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Open &amp; Review</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Project Overview & Code Compliance Card */}
        <div className="space-y-4">
          <div className="rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                Project Information
              </span>
              <span className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                {activeWorkspace.projectCode}
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Site Location:</span>
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">{activeWorkspace.siteLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Building Code:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{activeWorkspace.governingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Primary Currency:</span>
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">{activeWorkspace.currency} ({getCurrencySymbol(activeWorkspace.currency)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Unit System Preset:</span>
                <span className="font-bold capitalize text-[var(--md-sys-color-on-surface)]">
                  {activeWorkspace.unitPreferences?.systemPreset || 'metric'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onOpenWorkspaceManager}
                className="text-[var(--md-sys-color-primary)] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <span>Edit Project Metadata</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onOpenProfileModal('preferences')}
                className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] font-semibold cursor-pointer"
              >
                Settings
              </button>
            </div>
          </div>

          {/* Quick Cross-Module Sync Status Card */}
          <div className="rounded-3xl p-5 border border-emerald-500/20 bg-emerald-500/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Cross-Module Auto-Sync Engine</span>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Auto-sync reinforcement steel tonnage and concrete material volumes directly into your BOQ takeoff schedule with 1 click.
            </p>
            <button
              type="button"
              onClick={() => onSelectModule('boq-estimator')}
              className="w-full py-2 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <span>Open BOQ Takeoff Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
