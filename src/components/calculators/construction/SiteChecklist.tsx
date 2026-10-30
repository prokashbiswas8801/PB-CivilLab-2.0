import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  MinusCircle,
  FileSpreadsheet,
  FileDown,
  Printer,
  Copy,
  RotateCcw,
  AlertTriangle,
  Building,
  ShieldCheck,
  Calendar,
  User,
  HardHat,
  Search,
  Filter,
} from 'lucide-react';
import { exportToCSV, generateEngineeringPDF, ReportOutputRow } from '../../../utils/exportEngine';

export type ChecklistCategory = 'pre-concreting' | 'footing-column' | 'masonry-plaster';
export type ItemStatus = 'PASS' | 'FAIL' | 'NA';

export interface InspectionItem {
  id: string;
  category: ChecklistCategory;
  clause: string;
  title: string;
  description: string;
  standardRef: string;
  critical: boolean;
  status: ItemStatus;
  remarks: string;
}

const INITIAL_CHECKLIST_ITEMS: InspectionItem[] = [
  // 1. Pre-Concreting QA/QC Items
  {
    id: 'pc-1',
    category: 'pre-concreting',
    clause: '1.1',
    title: 'Formwork Plumb, Alignment & Surface Cleanliness',
    description: 'Verify formwork dimensions, verticality (plumb), tight joints to prevent slurry loss, and debris removal through cleanout openings.',
    standardRef: 'ACI 347R / BNBC 8.1.7',
    critical: true,
    status: 'PASS',
    remarks: 'Shuttering aligned, sealed with foam tape, sawdust/ties flushed out.',
  },
  {
    id: 'pc-2',
    category: 'pre-concreting',
    clause: '1.2',
    title: 'Staging Props Tightness & Lateral Bracing',
    description: 'Ensure verticality of props/jacks, base plates placed on firm ground/sills, and horizontal/diagonal cross-bracing installed.',
    standardRef: 'ACI 347R Sec 3.2',
    critical: true,
    status: 'PASS',
    remarks: 'Double-tier runner system braced; no loose acrow pins.',
  },
  {
    id: 'pc-3',
    category: 'pre-concreting',
    clause: '1.3',
    title: 'Clear Concrete Cover Blocks Verification',
    description: 'Specified cover maintained: Footing (50-75mm), Column/Beam (40mm), Slab (20-25mm) using concrete spacer blocks of equal grade.',
    standardRef: 'ACI 318 Sec 20.6 / BNBC',
    critical: true,
    status: 'PASS',
    remarks: 'Mortar/concrete spacers (50 MPa) tied at 1.0m c/c.',
  },
  {
    id: 'pc-4',
    category: 'pre-concreting',
    clause: '1.4',
    title: 'Chair Bars for Top Slab Reinforcement',
    description: 'Adequate rigid chair bars (min 12mm dia at 1.0m c/c) to support negative moment top mesh against displacement during pouring.',
    standardRef: 'CRSI Manual of Standard Practice',
    critical: false,
    status: 'PASS',
    remarks: 'Chair bars placed every 0.9m c/c under top steel.',
  },
  {
    id: 'pc-5',
    category: 'pre-concreting',
    clause: '1.5',
    title: 'Rebar Diameter, Spacing & Lap Staggering',
    description: 'Main bars and stirrups match structural schedule. Splice lapping length (>= 50d) staggered by at least 600mm. Ties secured with 18-gauge wire.',
    standardRef: 'ACI 318 Sec 25.5 / BNBC 8.2',
    critical: true,
    status: 'PASS',
    remarks: 'Ties checked; no two adjacent bars spliced in same section.',
  },
  {
    id: 'pc-6',
    category: 'pre-concreting',
    clause: '1.6',
    title: 'MEP Electrical Conduits & Plumbing Pass-throughs',
    description: 'All conduits, fan hooks, junction boxes, pipe sleeves embedded per MEP coordinated drawings and secured to prevent displacement.',
    standardRef: 'BNBC Part 8 MEP / NEC',
    critical: false,
    status: 'PASS',
    remarks: 'PVC conduits tied below top rebar mesh; sleeves capped.',
  },
  {
    id: 'pc-7',
    category: 'pre-concreting',
    clause: '1.7',
    title: 'Form Release Agent Application',
    description: 'Ensure mineral/vegetable form release oil is applied in thin uniform coat prior to rebar placement (no oil on steel).',
    standardRef: 'ACI 301 Sec 2.2.1',
    critical: false,
    status: 'PASS',
    remarks: 'Applied before rebar cage lowering.',
  },
  {
    id: 'pc-8',
    category: 'pre-concreting',
    clause: '1.8',
    title: 'Compaction Equipment & Slump Test Equipment Ready',
    description: 'Minimum 2 needle vibrators (40mm & 60mm) on site with 1 functional standby vibrator and slump cone apparatus ready.',
    standardRef: 'ASTM C143 / ACI 309R',
    critical: true,
    status: 'PASS',
    remarks: 'Primary diesel vibrator + standby electric vibrator tested on site.',
  },

  // 2. Footing & Column Layout Verification
  {
    id: 'fc-1',
    category: 'footing-column',
    clause: '2.1',
    title: 'Centerline Grid Offsets from Benchmarks',
    description: 'Grid layout verified from permanent benchmark pillars using total station or calibrated steel tape and 3-4-5 triangular method.',
    standardRef: 'BNBC Part 6 Chap 1 / Survey Manual',
    critical: true,
    status: 'PASS',
    remarks: 'Pillars referenced to municipal baseline. Grid error < 3mm.',
  },
  {
    id: 'fc-2',
    category: 'footing-column',
    clause: '2.2',
    title: 'Diagonal Trueness & Squareness of Layout',
    description: 'Diagonal checks across grid corners (D = sqrt(L^2 + W^2)) to confirm 90-degree square layout before footing casting.',
    standardRef: 'Standard Survey Practice',
    critical: true,
    status: 'PASS',
    remarks: 'Main rectangular boundary diagonal match within 5mm.',
  },
  {
    id: 'fc-3',
    category: 'footing-column',
    clause: '2.3',
    title: 'Excavation Depth & Blinding (PCC) Thickness',
    description: 'Foundation reached approved bearing stratum, trimmed level, and 75-100mm PCC/blinding bed placed without loose silt pockets.',
    standardRef: 'BNBC 3.2.4 / ACI 336',
    critical: true,
    status: 'PASS',
    remarks: 'Depth -2.4m from NGL; 75mm 1:3:6 PCC blinding cast.',
  },
  {
    id: 'fc-4',
    category: 'footing-column',
    clause: '2.4',
    title: 'Column Starter Rebar Dowels Plumb & Orientation',
    description: 'Column starter cages tied to footing mesh, checked for correct orientation (major vs minor axis), and plumb-bob alignment.',
    standardRef: 'ACI 318 Sec 16.5',
    critical: true,
    status: 'PASS',
    remarks: 'Dowels rigidly tied with temporary wooden template frame.',
  },
  {
    id: 'fc-5',
    category: 'footing-column',
    clause: '2.5',
    title: 'Anti-Termite Treatment & Soil Pre-conditioning',
    description: 'Chemical anti-termite emulsion sprayed uniformly over excavated bottom and backfill periphery according to environmental specs.',
    standardRef: 'IS 6313 / BNBC Part 2',
    critical: false,
    status: 'PASS',
    remarks: 'Chlorpyrifos emulsion sprayed at 5 L/m².',
  },

  // 3. Brick Masonry & Plastering Quality Check
  {
    id: 'mp-1',
    category: 'masonry-plaster',
    clause: '3.1',
    title: 'Brick Pre-Soaking in Clean Water',
    description: 'Bricks immersed in clean water for at least 2 hours before laying until effervescence ceases, preventing mortar moisture absorption.',
    standardRef: 'BNBC 2.1.3 / IS 2212',
    critical: true,
    status: 'PASS',
    remarks: 'Soaking pit active; bricks saturated surface dry (SSD).',
  },
  {
    id: 'mp-2',
    category: 'masonry-plaster',
    clause: '3.2',
    title: 'Fresh Mortar Usage (< 60-90 Mins)',
    description: 'Mortar freshly mixed on impermeable platform and utilized within initial setting time. Retempering with water strictly forbidden.',
    standardRef: 'ASTM C270 / BNBC',
    critical: true,
    status: 'PASS',
    remarks: 'Batches mixed every 45 mins; no dry crusting observed.',
  },
  {
    id: 'mp-3',
    category: 'masonry-plaster',
    clause: '3.3',
    title: 'Mortar Bed Joint Uniformity & Frog Orientation',
    description: 'Horizontal and vertical mortar joints uniform (10-12mm thick) with brick frogs facing UPWARD completely filled with mortar.',
    standardRef: 'IS 2212 / BNBC',
    critical: true,
    status: 'PASS',
    remarks: 'Joints struck flush with trowel; frog upward confirmed.',
  },
  {
    id: 'mp-4',
    category: 'masonry-plaster',
    clause: '3.4',
    title: 'Vertical Plumb & Course Leveling Every 3 Lifts',
    description: 'Plumb-bob and spirit level applied every 3 courses. Maximum wall height per day restricted to 1.5m to prevent joint deformation.',
    standardRef: 'CPWD Specs Sec 6',
    critical: true,
    status: 'PASS',
    remarks: 'Vertical tolerance within ±3mm over 3m height.',
  },
  {
    id: 'mp-5',
    category: 'masonry-plaster',
    clause: '3.5',
    title: 'Toothing & Racking Back at Wall Junctions',
    description: 'Stepped racking back provided at corners or junctions left unfinished for future continuation; proper interlocking ensured.',
    standardRef: 'IS 2212 Sec 8',
    critical: false,
    status: 'PASS',
    remarks: 'Stepped back in 1-brick increments.',
  },
  {
    id: 'mp-6',
    category: 'masonry-plaster',
    clause: '3.6',
    title: 'Concrete Surface Hacking for Plaster Key',
    description: 'All concrete column/beam faces hacked (min 30-40 hacks per 100cm²) or treated with bonding agent prior to plastering.',
    standardRef: 'IS 1661 / BNBC',
    critical: true,
    status: 'PASS',
    remarks: 'Hacking depth 3-4mm verified on RCC soffits and columns.',
  },
  {
    id: 'mp-7',
    category: 'masonry-plaster',
    clause: '3.7',
    title: 'Plaster Screeds (Button Marks) at 2m Centers',
    description: 'Plaster level dots / screed strips established vertically and horizontally at 1.8-2.0m spacing to ensure true planar surface.',
    standardRef: 'IS 1661 Sec 9',
    critical: false,
    status: 'PASS',
    remarks: '12mm plaster buttons aligned with plumb-line.',
  },
  {
    id: 'mp-8',
    category: 'masonry-plaster',
    clause: '3.8',
    title: 'Anti-Crack Mesh at RCC & Masonry Junctions',
    description: '200mm wide galvanized wire mesh / fiber mesh installed across joint between RCC frame and brickwork before plastering.',
    standardRef: 'BNBC Part 8 Architectural Finishing',
    critical: true,
    status: 'PASS',
    remarks: 'Chicken mesh nailed with 100mm overlap on either side.',
  },
];

export const SiteChecklist: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ChecklistCategory>('pre-concreting');
  const [items, setItems] = useState<InspectionItem[]>(INITIAL_CHECKLIST_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ItemStatus>('ALL');

  // Inspection Metadata
  const [projectName, setProjectName] = useState('Metro Tower Structural Package');
  const [pourLocation, setPourLocation] = useState('Level 4 Beam & Slab Casting Grid A-D');
  const [inspectorName, setInspectorName] = useState('Prokash Biswas, PE');
  const [contractorName, setContractorName] = useState('Apex Construction Consortium');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [weatherCondition, setWeatherCondition] = useState('Sunny, 28°C / Dry');
  const [copied, setCopied] = useState(false);

  // Status updates
  const setItemStatus = (id: string, status: ItemStatus) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status } : it))
    );
  };

  const updateItemRemarks = (id: string, remarks: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, remarks } : it))
    );
  };

  const markAllStatus = (category: ChecklistCategory, status: ItemStatus) => {
    setItems((prev) =>
      prev.map((it) => (it.category === category ? { ...it, status } : it))
    );
  };

  const resetCategory = (category: ChecklistCategory) => {
    const original = INITIAL_CHECKLIST_ITEMS.filter((it) => it.category === category);
    setItems((prev) => [
      ...prev.filter((it) => it.category !== category),
      ...original,
    ]);
  };

  // Metrics for active category
  const categoryItems = useMemo(
    () => items.filter((it) => it.category === activeCategory),
    [items, activeCategory]
  );

  const stats = useMemo(() => {
    const total = categoryItems.length;
    const passed = categoryItems.filter((it) => it.status === 'PASS').length;
    const failed = categoryItems.filter((it) => it.status === 'FAIL').length;
    const na = categoryItems.filter((it) => it.status === 'NA').length;
    const criticalFails = categoryItems.filter((it) => it.critical && it.status === 'FAIL').length;
    const passPercentage = total - na > 0 ? Math.round((passed / (total - na)) * 100) : 100;

    let verdict: 'APPROVED' | 'REJECTED' | 'CONDITIONAL' = 'APPROVED';
    if (criticalFails > 0) {
      verdict = 'REJECTED';
    } else if (failed > 0) {
      verdict = 'CONDITIONAL';
    }

    return {
      total,
      passed,
      failed,
      na,
      criticalFails,
      passPercentage,
      verdict,
    };
  }, [categoryItems]);

  const filteredItems = useMemo(() => {
    return categoryItems.filter((it) => {
      const matchSearch =
        it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.standardRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.remarks.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || it.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [categoryItems, searchQuery, statusFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Clause', 'Inspection Item Title', 'Standard Ref', 'Critical', 'Status', 'Engineer Remarks'];
    const rows = categoryItems.map((it) => [
      it.clause,
      it.title,
      it.standardRef,
      it.critical ? 'YES' : 'NO',
      it.status,
      it.remarks,
    ]);

    exportToCSV(`PB_CivilLab_QA_QC_${activeCategory}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows, {
      projectName,
      location: pourLocation,
      engineerName: inspectorName,
      date: inspectionDate,
      weather: weatherCondition,
    });
  };

  // Export Certified PDF
  const handleExportPDF = async () => {
    const categoryTitles: Record<ChecklistCategory, string> = {
      'pre-concreting': 'PRE-CONCRETING & POUR READINESS QA/QC SUBMITTAL',
      'footing-column': 'FOOTING & COLUMN LAYOUT QUALITY VERIFICATION',
      'masonry-plaster': 'BRICKWORK & PLASTERING SITE QA/QC AUDIT',
    };

    const outputRows: ReportOutputRow[] = categoryItems.map((it) => ({
      name: `[Clause ${it.clause}] ${it.title}`,
      symbol: it.standardRef,
      value: it.status,
      unit: it.critical ? 'CRITICAL' : 'STANDARD',
      status: it.status === 'PASS' ? 'PASS' : it.status === 'FAIL' ? 'FAIL' : 'INFO',
    }));

    const pdfData = {
      projectMeta: {
        projectName,
        projectCode: 'SITE-QC-2026',
        client: contractorName,
        location: pourLocation,
        date: inspectionDate,
        unitSystem: 'SI' as const,
        engineerName: inspectorName,
      },
      moduleMeta: {
        moduleId: 'site-qa-qc-checklist',
        moduleTitle: categoryTitles[activeCategory],
        standard: 'ACI 318 / ACI 347R / BNBC 2020 / ASTM Inspection Protocols',
        status: stats.verdict === 'APPROVED' ? ('PASS' as const) : stats.verdict === 'CONDITIONAL' ? ('WARNING' as const) : ('FAIL' as const),
      },
      inputs: [
        { name: 'Structure Pour Level / Grid', symbol: 'Location', value: pourLocation, unit: '-' },
        { name: 'General Contractor', symbol: 'Contractor', value: contractorName, unit: '-' },
        { name: 'Site Quality Engineer', symbol: 'Inspector', value: inspectorName, unit: '-' },
        { name: 'Weather Condition', symbol: 'Weather', value: weatherCondition, unit: '-' },
        { name: 'Total Items Checked', symbol: 'N_items', value: stats.total, unit: 'clauses' },
      ],
      outputs: [
        { name: 'Overall Compliance Pass Rate', symbol: 'Rate_%', value: `${stats.passPercentage}%`, unit: '%', status: stats.passPercentage >= 90 ? ('PASS' as const) : ('WARNING' as const) },
        { name: 'Conforming Items (PASS)', symbol: 'N_pass', value: stats.passed, unit: 'items', status: 'PASS' as const },
        { name: 'Non-Conforming Items (FAIL)', symbol: 'N_fail', value: stats.failed, unit: 'items', status: stats.failed === 0 ? ('PASS' as const) : ('FAIL' as const) },
        { name: 'Critical Non-Conformances', symbol: 'N_crit', value: stats.criticalFails, unit: 'items', status: stats.criticalFails === 0 ? ('PASS' as const) : ('FAIL' as const) },
        { name: 'Final Engineering Approval Verdict', symbol: 'Decision', value: stats.verdict, unit: 'Status', status: stats.verdict === 'APPROVED' ? ('PASS' as const) : ('FAIL' as const) },
        ...outputRows,
      ],
      governingAssumptions: [
        'All inspection checks conducted in situ strictly prior to placing concrete or applying finishes.',
        'Critical items with FAIL status automatically revoke casting approval until re-inspected and cleared.',
        'Concrete clear cover blocks must meet design grade and maintain specified tolerances without shifting.',
        'Signed submittal report constitutes a legal quality assurance record for structural warranty.',
      ],
    };

    await generateEngineeringPDF(pdfData, {
      filename: `PB_CivilLab_QA_QC_${activeCategory}_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  const handleCopyReport = () => {
    const reportText = `=== SITE QA/QC AUDIT REPORT ===
Project: ${projectName}
Location: ${pourLocation}
Auditing Engineer: ${inspectorName} | Contractor: ${contractorName}
Date: ${inspectionDate} | Weather: ${weatherCondition}
Compliance: ${stats.passed}/${stats.total - stats.na} Passed (${stats.passPercentage}%) | Verdict: ${stats.verdict}
--------------------------------------------------
${categoryItems
  .map(
    (it) =>
      `[${it.status}] ${it.clause}. ${it.title} (${it.standardRef}) ${it.critical ? '[CRITICAL]' : ''}
  Remarks: ${it.remarks || 'None'}`
  )
  .join('\n')}
--------------------------------------------------
Certified and signed by ${inspectorName}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                Field Engineering QA/QC
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                Interactive Site QA/QC &amp; Pre-Pour Inspection Checklists
              </h2>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
              Pre-Concreting · Formwork &amp; Rebar · Footing &amp; Column Layout · Brickwork &amp; Plastering · Pass/Fail Submittal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Signed Inspection PDF</span>
            </button>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto">
          {[
            { id: 'pre-concreting', label: '1. Pre-Concreting & Pour Readiness' },
            { id: 'footing-column', label: '2. Footing & Column Layout Verification' },
            { id: 'masonry-plaster', label: '3. Brickwork & Plastering Quality Check' },
          ].map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as ChecklistCategory)}
                className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inspection Header Form (Project, Location, Contractor, Inspector) */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Project Name</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full font-medium px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <HardHat className="w-3.5 h-3.5 text-slate-400" />
              <span>Pour Location / Element Grid</span>
            </label>
            <input
              type="text"
              value={pourLocation}
              onChange={(e) => setPourLocation(e.target.value)}
              className="w-full font-medium px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Quality Engineer / Inspector</span>
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full font-medium px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date &amp; Weather</span>
            </label>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-1/2 text-xs font-mono px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
              />
              <input
                type="text"
                value={weatherCondition}
                onChange={(e) => setWeatherCondition(e.target.value)}
                className="w-1/2 text-xs px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                placeholder="Weather"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Metrics HUD Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-500/10 border border-slate-500/20">
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block">Total Checks</span>
          <div className="text-xl md:text-2xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
            {stats.total} <span className="text-xs font-normal">items</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 block">Pass Rate</span>
          <div className="text-xl md:text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-200 mt-0.5">
            {stats.passPercentage}%
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
            {stats.passed} Conforming
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400 block">Non-Conforming</span>
          <div className="text-xl md:text-2xl font-bold font-mono text-rose-900 dark:text-rose-200 mt-0.5">
            {stats.failed} <span className="text-xs font-normal">items</span>
          </div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5 font-medium">
            {stats.criticalFails > 0 ? `${stats.criticalFails} CRITICAL` : 'No Critical'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-500/10 border border-slate-500/20">
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block">Not Applicable</span>
          <div className="text-xl md:text-2xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">
            {stats.na} <span className="text-xs font-normal">N/A</span>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
            stats.verdict === 'APPROVED'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200'
              : stats.verdict === 'CONDITIONAL'
              ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-200'
              : 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block">
            Submittal Verdict
          </span>
          <div className="text-base md:text-lg font-black tracking-tight">
            {stats.verdict}
          </div>
          <span className="text-[9px] opacity-80 block">
            {stats.verdict === 'APPROVED' ? 'Cleared for casting' : 'Action required before pour'}
          </span>
        </div>
      </div>

      {/* Toolbar: Search, Filter, Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clause, title, standard, or remarks..."
              className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            {(['ALL', 'PASS', 'FAIL', 'NA'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                  statusFilter === st
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markAllStatus(activeCategory, 'PASS')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 inline-flex items-center gap-1 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark All Pass</span>
          </button>
          <button
            type="button"
            onClick={() => resetCategory(activeCategory)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Interactive Checklist Cards */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isPass = item.status === 'PASS';
          const isFail = item.status === 'FAIL';
          const isNA = item.status === 'NA';

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                isFail
                  ? 'border-rose-400/80 bg-rose-500/5'
                  : isPass
                  ? 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-500/40'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-slate-500/5 opacity-75'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                {/* Item Information */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                      Clause {item.clause}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {item.standardRef}
                    </span>
                    {item.critical && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        CRITICAL HOLD-POINT
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    {item.title}
                  </h4>

                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-start">
                  <button
                    type="button"
                    onClick={() => setItemStatus(item.id, 'PASS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      isPass
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[var(--md-sys-color-surface-container)] text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PASS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemStatus(item.id, 'FAIL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      isFail
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-[var(--md-sys-color-surface-container)] text-slate-500 hover:bg-rose-500/10 hover:text-rose-600'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>FAIL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemStatus(item.id, 'NA')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono inline-flex items-center gap-1 transition-all cursor-pointer ${
                      isNA
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-[var(--md-sys-color-surface-container)] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>N/A</span>
                  </button>
                </div>
              </div>

              {/* Remarks Text Input */}
              <div className="mt-3 pt-2.5 border-t border-[var(--md-sys-color-outline-variant)]/60 flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 shrink-0">Engineer Remarks:</span>
                <input
                  type="text"
                  value={item.remarks}
                  onChange={(e) => updateItemRemarks(item.id, e.target.value)}
                  placeholder="Enter observation notes, verified dimensions, or corrective action needed..."
                  className="w-full text-xs px-2.5 py-1 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] font-mono"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
