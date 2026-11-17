import React, { useState, useMemo } from 'react';
import {
  Terminal,
  FileSpreadsheet,
  Copy,
  Check,
  Maximize2,
  Layers,
  Command,
  Code,
  MapPin,
  Sparkles,
  Wrench,
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  Cpu,
  CheckCircle2,
  Sliders,
  Compass,
  Database,
  CalendarClock,
  TrendingUp,
  GitBranch,
  Library
} from 'lucide-react';
import {
  PAPER_SIZES_MM,
  VIEWPORT_WALKTHROUGH_STEPS,
  CTB_PEN_TABLE,
  EXPANDED_CAD_COMMANDS,
  CAD_PLUGINS_DATA,
  EXPANDED_LISP_ROUTINES,
  DYNAMIC_BLOCKS_DATAEXTRACTION_GUIDE,
  DEFAULT_SURVEY_CSV,
  SURVEY_CAD_WORKFLOW_GUIDE,
  EXPANDED_EXCEL_FORMULAS,
  EXCEL_VBA_MACROS,
  EXCEL_ADVANCED_GUIDES,
  CadPluginSuite
} from '../../../data/cadExcelHubData';
import {
  SOFTWARE_GUIDEBOOK_CHAPTERS,
  SoftwarePillarId
} from '../../../data/softwareGuidebookData';
import { AboutThisTool, AboutThisToolButton } from '../../ui';

export type CadHubTabId =
  | 'viewport'
  | 'shortcuts'
  | 'plugins'
  | 'lisp'
  | 'survey'
  | 'excel'
  | 'guidebook'
  | 'msproject';

export interface CadExcelHubProps {
  initialTab?: CadHubTabId;
}

export const CadExcelHub: React.FC<CadExcelHubProps> = ({ initialTab = 'viewport' }) => {
  const [activeTab, setActiveTab] = useState<CadHubTabId>(initialTab);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // --- TAB 1: Viewport & Plotting State ---
  const [drawingUnit, setDrawingUnit] = useState<'mm' | 'cm' | 'm' | 'inch' | 'feet'>('mm');
  const [targetScale, setTargetScale] = useState<number>(100);
  const [customScale, setCustomScale] = useState<string>('100');
  const [paperTextHeight, setPaperTextHeight] = useState<number>(2.5);
  const [paperTitleHeight, setPaperTitleHeight] = useState<number>(5.0);
  const [selectedPaperId, setSelectedPaperId] = useState<'A0' | 'A1' | 'A2' | 'A3' | 'A4'>('A1');
  const [expandedWalkthroughStep, setExpandedWalkthroughStep] = useState<number | null>(1);
  const [showAllWalkthroughSteps, setShowAllWalkthroughSteps] = useState<boolean>(false);

  // --- TAB 2: Essential AutoCAD Commands State ---
  const [cmdSearch, setCmdSearch] = useState<string>('');
  const [cmdCategory, setCmdCategory] = useState<string>('All');
  const [expandedCmdMap, setExpandedCmdMap] = useState<Record<string, boolean>>({
    OVERKILL: true,
    OSNAPZ: true
  });
  const [expandAllCommands, setExpandAllCommands] = useState<boolean>(false);

  // --- TAB 3: Plugins & Add-ons State ---
  const [activePluginId, setActivePluginId] = useState<CadPluginSuite['id']>('yqarch');
  const [pluginSearch, setPluginSearch] = useState<string>('');
  const [pluginCategory, setPluginCategory] = useState<string>('All');

  // --- TAB 4: AutoLISP & Dynamic Blocks State ---
  const [lispCategory, setLispCategory] = useState<string>('All');

  // --- TAB 5: Survey CSV-to-CAD State ---
  const [csvInput, setCsvInput] = useState<string>(DEFAULT_SURVEY_CSV);
  const [surveyColumnOrder, setSurveyColumnOrder] = useState<'PENZD' | 'PNEZD'>('PENZD');
  const [surveyTextHeight, setSurveyTextHeight] = useState<number>(0.4);
  const [surveyConnectPolyline, setSurveyConnectPolyline] = useState<boolean>(false);
  const [surveyIncludeZInText, setSurveyIncludeZInText] = useState<boolean>(true);

  // --- TAB 6: Excel Engineering Studio State ---
  const [excelSubTab, setExcelSubTab] = useState<'formulas' | 'vba' | 'guides'>('formulas');
  const [excelSearch, setExcelSearch] = useState<string>('');
  const [excelCategory, setExcelCategory] = useState<string>('All');

  // --- TAB 7: Master Guidebook (25 Chapters) State ---
  const [guidePillar, setGuidePillar] = useState<'all' | SoftwarePillarId>('all');
  const [guideSelectedChapterId, setGuideSelectedChapterId] = useState<string>('all');
  const [guideSearch, setGuideSearch] = useState<string>('');
  const [expandedTopicMap, setExpandedTopicMap] = useState<Record<string, boolean>>({
    'acad-1-1': true,
    'excel-1-1': true,
    'msp-1-1': true
  });
  const [expandAllGuideTopics, setExpandAllGuideTopics] = useState<boolean>(false);

  // --- TAB 8: MS Project EVM & CPM Calculator State ---
  const [evmInputMode, setEvmInputMode] = useState<'percent' | 'direct'>('percent');
  const [evmBac, setEvmBac] = useState<number>(10000000);
  const [evmPlannedPct, setEvmPlannedPct] = useState<number>(50);
  const [evmEarnedPct, setEvmEarnedPct] = useState<number>(42);
  const [evmDirectPv, setEvmDirectPv] = useState<number>(5000000);
  const [evmDirectEv, setEvmDirectEv] = useState<number>(4200000);
  const [evmAc, setEvmAc] = useState<number>(4650000);

  // CPM Task Pass & Float State
  const [cpmEs, setCpmEs] = useState<number>(10);
  const [cpmDuration, setCpmDuration] = useState<number>(8);
  const [cpmLf, setCpmLf] = useState<number>(22);
  const [cpmSuccessorEs, setCpmSuccessorEs] = useState<number>(20);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Viewport Math Calculations ---
  const unitFactors: Record<'mm' | 'cm' | 'm' | 'inch' | 'feet', number> = {
    mm: 1,
    cm: 10,
    m: 1000,
    inch: 25.4,
    feet: 304.8
  };

  const unitFactor = unitFactors[drawingUnit];
  const effectiveScale = targetScale > 0 ? targetScale : 100;
  const xpFactor = unitFactor / effectiveScale;
  const modelTextHeight = (paperTextHeight * effectiveScale) / unitFactor;
  const modelTitleHeight = (paperTitleHeight * effectiveScale) / unitFactor;
  const dimScale = effectiveScale / unitFactor;
  const ltScale = (effectiveScale / unitFactor) * 0.5;

  const selectedPaper = useMemo(
    () => PAPER_SIZES_MM.find((p) => p.id === selectedPaperId) || PAPER_SIZES_MM[1],
    [selectedPaperId]
  );

  const groundWidthInDrawingUnits = (selectedPaper.playableWidthMm * effectiveScale) / unitFactor;
  const groundHeightInDrawingUnits = (selectedPaper.playableHeightMm * effectiveScale) / unitFactor;
  const groundWidthMeters = (selectedPaper.playableWidthMm * effectiveScale) / 1000;
  const groundHeightMeters = (selectedPaper.playableHeightMm * effectiveScale) / 1000;

  // --- Filtered AutoCAD Commands ---
  const commandCategories = useMemo(() => {
    const cats = Array.from(new Set(EXPANDED_CAD_COMMANDS.map((c) => c.category)));
    return ['All', ...cats];
  }, []);

  const filteredCommands = useMemo(() => {
    const q = cmdSearch.trim().toLowerCase();
    return EXPANDED_CAD_COMMANDS.filter((item) => {
      const matchesCat = cmdCategory === 'All' || item.category === cmdCategory;
      const matchesQuery =
        !q ||
        item.cmd.toLowerCase().includes(q) ||
        item.alias.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.mechanics.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [cmdSearch, cmdCategory]);

  // --- Active Plugin Suite & Filtered Commands ---
  const activePluginSuite = useMemo(
    () => CAD_PLUGINS_DATA.find((p) => p.id === activePluginId) || CAD_PLUGINS_DATA[0],
    [activePluginId]
  );

  const pluginCategories = useMemo(() => {
    const cats = Array.from(new Set(activePluginSuite.commands.map((c) => c.category)));
    return ['All', ...cats];
  }, [activePluginSuite]);

  const filteredPluginCommands = useMemo(() => {
    const q = pluginSearch.trim().toLowerCase();
    return activePluginSuite.commands.filter((cmd) => {
      const matchesCat = pluginCategory === 'All' || cmd.category === pluginCategory;
      const matchesQuery =
        !q ||
        cmd.code.toLowerCase().includes(q) ||
        cmd.name.toLowerCase().includes(q) ||
        cmd.purpose.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [activePluginSuite, pluginSearch, pluginCategory]);

  // --- Filtered LISP Routines ---
  const lispCategories = useMemo(() => {
    const cats = Array.from(new Set(EXPANDED_LISP_ROUTINES.map((l) => l.category)));
    return ['All', ...cats];
  }, []);

  const filteredLispRoutines = useMemo(() => {
    return EXPANDED_LISP_ROUTINES.filter(
      (item) => lispCategory === 'All' || item.category === lispCategory
    );
  }, [lispCategory]);

  // --- Filtered Excel Formulas ---
  const excelCategories = useMemo(() => {
    const cats = Array.from(new Set(EXPANDED_EXCEL_FORMULAS.map((f) => f.category)));
    return ['All', ...cats];
  }, []);

  const filteredExcelFormulas = useMemo(() => {
    const q = excelSearch.trim().toLowerCase();
    return EXPANDED_EXCEL_FORMULAS.filter((f) => {
      const matchesCat = excelCategory === 'All' || f.category === excelCategory;
      const matchesQuery =
        !q ||
        f.title.toLowerCase().includes(q) ||
        f.desc.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        f.explanation.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [excelSearch, excelCategory]);

  // --- Survey Script Generation ---
  const generatedSurveyData = useMemo(() => {
    const lines = csvInput.trim().split('\n');
    const scr: string[] = [
      '; ==========================================================',
      '; AutoCAD Survey Total Station Script (.SCR)',
      `; Column Order: ${surveyColumnOrder} -> Mapped to AutoCAD Easting(X), Northing(Y), Elev(Z)`,
      '; ==========================================================',
      '._OSMODE 0',
      '._-LAYER _M "SURVEY-POINTS" _C 2 "" ""',
      '._-LAYER _M "SURVEY-TEXT" _C 3 "" ""',
      '._-LAYER _M "SURVEY-BOUNDARY" _C 4 "" ""'
    ];

    const validCoords: { p: string; e: string; n: string; z: string; d: string }[] = [];

    lines.forEach((line) => {
      const parts = line.split(',').map((s) => s.trim());
      if (parts.length >= 4) {
        const p = parts[0];
        const col1 = parts[1];
        const col2 = parts[2];
        const z = parts[3];
        const d = parts[4] || '';

        const e = surveyColumnOrder === 'PENZD' ? col1 : col2;
        const n = surveyColumnOrder === 'PENZD' ? col2 : col1;

        if (!isNaN(Number(e)) && !isNaN(Number(n))) {
          validCoords.push({ p, e, n, z: isNaN(Number(z)) ? '0.000' : z, d });
        }
      }
    });

    validCoords.forEach(({ p, e, n, z, d }) => {
      const th = surveyTextHeight > 0 ? surveyTextHeight : 0.4;
      const offsetE = (Number(e) + th * 0.6).toFixed(3);
      const offsetN = (Number(n) + th * 0.6).toFixed(3);
      const label = surveyIncludeZInText
        ? `${p}${d ? ` (${d})` : ''} [RL:${z}]`
        : `${p}${d ? ` (${d})` : ''}`;

      scr.push('._CLAYER "SURVEY-POINTS"');
      scr.push(`._POINT ${e},${n},${z}`);
      scr.push('._CLAYER "SURVEY-TEXT"');
      scr.push(`._-TEXT ${offsetE},${offsetN},${z} ${th} 0 ${label}`);
    });

    if (surveyConnectPolyline && validCoords.length >= 2) {
      scr.push('._CLAYER "SURVEY-BOUNDARY"');
      scr.push('._3DPOLY');
      validCoords.forEach(({ e, n, z }) => {
        scr.push(`${e},${n},${z}`);
      });
      scr.push('');
    }

    scr.push('._ZOOM _E');
    return {
      script: scr.join('\n'),
      pointCount: validCoords.length
    };
  }, [csvInput, surveyColumnOrder, surveyTextHeight, surveyConnectPolyline, surveyIncludeZInText]);

  // --- Filtered Master Guidebook Chapters ---
  const chaptersForActivePillar = useMemo(() => {
    return SOFTWARE_GUIDEBOOK_CHAPTERS.filter(
      (ch) => guidePillar === 'all' || ch.pillar === guidePillar
    );
  }, [guidePillar]);

  const filteredGuideChapters = useMemo(() => {
    const q = guideSearch.trim().toLowerCase();
    return chaptersForActivePillar
      .filter((ch) => guideSelectedChapterId === 'all' || ch.id === guideSelectedChapterId)
      .map((ch) => {
        if (!q) return ch;
        const matchingTopics = ch.topics.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.summary.toLowerCase().includes(q) ||
            t.mechanics.toLowerCase().includes(q) ||
            t.proTip.toLowerCase().includes(q) ||
            t.commandsOrFormulas.some((cf) => cf.toLowerCase().includes(q)) ||
            t.guidelines.some((g) => g.toLowerCase().includes(q))
        );
        if (
          ch.title.toLowerCase().includes(q) ||
          ch.subtitle.toLowerCase().includes(q)
        ) {
          return ch;
        }
        return { ...ch, topics: matchingTopics };
      })
      .filter((ch) => ch.topics.length > 0);
  }, [chaptersForActivePillar, guideSelectedChapterId, guideSearch]);

  const msProjectChapters = useMemo(
    () => SOFTWARE_GUIDEBOOK_CHAPTERS.filter((ch) => ch.pillar === 'msproject'),
    []
  );

  // --- EVM & CPM Calculations ---
  const evmMetrics = useMemo(() => {
    const bac = Math.max(0, evmBac);
    const pv =
      evmInputMode === 'percent'
        ? (bac * Math.min(100, Math.max(0, evmPlannedPct))) / 100
        : Math.max(0, evmDirectPv);
    const ev =
      evmInputMode === 'percent'
        ? (bac * Math.min(100, Math.max(0, evmEarnedPct))) / 100
        : Math.max(0, evmDirectEv);
    const ac = Math.max(0, evmAc);

    const sv = ev - pv;
    const cv = ev - ac;
    const spi = pv > 0 ? ev / pv : 1;
    const cpi = ac > 0 ? ev / ac : 1;

    // 3 Standard EAC Formulas
    const eacStandard = cpi > 0 ? bac / cpi : bac;
    const eacTypical = ac + (bac - ev);
    const eacComposite =
      cpi * spi > 0 ? ac + (bac - ev) / (cpi * spi) : eacStandard;

    const etcStandard = eacStandard - ac;
    const vacStandard = bac - eacStandard;
    const tcpiBac = bac - ac > 0 ? (bac - ev) / (bac - ac) : 1;

    return {
      bac,
      pv,
      ev,
      ac,
      sv,
      cv,
      spi,
      cpi,
      eacStandard,
      eacTypical,
      eacComposite,
      etcStandard,
      vacStandard,
      tcpiBac
    };
  }, [evmInputMode, evmBac, evmPlannedPct, evmEarnedPct, evmDirectPv, evmDirectEv, evmAc]);

  const cpmMetrics = useMemo(() => {
    const ef = cpmEs + cpmDuration;
    const ls = cpmLf - cpmDuration;
    const totalSlack = ls - cpmEs; // also equals cpmLf - ef
    const freeSlack = cpmSuccessorEs - ef;
    const isCritical = totalSlack <= 0;
    return {
      ef,
      ls,
      totalSlack,
      freeSlack,
      isCritical
    };
  }, [cpmEs, cpmDuration, cpmLf, cpmSuccessorEs]);

  const toggleCommandExpand = (cmdName: string) => {
    setExpandedCmdMap((prev) => ({
      ...prev,
      [cmdName]: !prev[cmdName]
    }));
  };

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopicMap((prev) => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const getPillarBadge = (pillar: SoftwarePillarId) => {
    if (pillar === 'autocad') {
      return {
        label: 'AUTOCAD',
        classes: 'bg-amber-500/15 border-amber-500/30 text-amber-400'
      };
    }
    if (pillar === 'excel') {
      return {
        label: 'MICROSOFT EXCEL',
        classes: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
      };
    }
    return {
      label: 'MS PROJECT',
      classes: 'bg-violet-500/15 border-violet-500/30 text-violet-300'
    };
  };

  const activeDocToolId = useMemo(() => {
    if (activeTab === 'viewport') return 'cad-viewport';
    if (activeTab === 'excel') return 'cad-excel';
    if (activeTab === 'guidebook') return 'cad-guidebook';
    if (activeTab === 'msproject') return 'cad-msproject';
    return 'cad-shortcuts';
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> Civil, Structural & Project Management Software Hub
              </div>
              <AboutThisToolButton toolId={activeDocToolId} targetId="cad-hub-doc" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Terminal className="w-6 h-6 text-amber-500 shrink-0" />
              AutoCAD, Excel & MS Project Engineering Hub
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
              Complete operational mechanics, 25-chapter software guidebook (<span className="text-amber-300 font-medium">AutoCAD</span>, <span className="text-emerald-300 font-medium">Microsoft Excel</span> & <span className="text-violet-300 font-medium">MS Project</span>), viewport & plotting math, plugin suites (<span className="text-zinc-200 font-medium">YQArch, YQPrime, Lee Mac, RebarCAD, Civil 3D</span>), AutoLISP, Survey CSV-to-CAD, and EVM/CPM scheduling tools.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-center">
              <div className="text-base font-bold font-mono text-amber-400">25 Ch.</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Master Guide</div>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-center">
              <div className="text-base font-bold font-mono text-emerald-400">5 Suites</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">CAD Plugins</div>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-center">
              <div className="text-base font-bold font-mono text-violet-400">EVM + CPM</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">MS Project</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-zinc-800/80">
          <button
            onClick={() => setActiveTab('guidebook')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'guidebook'
                ? 'bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/20'
                : 'bg-zinc-950/70 text-cyan-300 hover:text-white border border-cyan-500/30'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            Master Guidebook (AutoCAD • Excel • MS Project)
          </button>

          <button
            onClick={() => setActiveTab('viewport')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'viewport'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            1. Viewport & Plotting
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'shortcuts'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <Command className="w-3.5 h-3.5" />
            2. CAD Commands
          </button>

          <button
            onClick={() => setActiveTab('plugins')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'plugins'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            3. Plugins (YQArch / Civil 3D)
          </button>

          <button
            onClick={() => setActiveTab('lisp')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'lisp'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            4. AutoLISP & Dynamic Blocks
          </button>

          <button
            onClick={() => setActiveTab('survey')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'survey'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            5. Survey CSV to CAD
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'excel'
                ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            6. Excel Studio & VBA
          </button>

          <button
            onClick={() => setActiveTab('msproject')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'msproject'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-zinc-950/70 text-violet-300 hover:text-white border border-violet-500/30'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            7. MS Project (EVM & CPM)
          </button>
        </div>
      </div>

      {/* =====================================================================
          MASTER GUIDEBOOK TAB: 25 CHAPTERS (AUTOCAD 1-9, EXCEL 1-8, MS PROJECT 1-8)
      ===================================================================== */}
      {activeTab === 'guidebook' && (
        <div className="space-y-6">
          {/* Top Pillar Switcher + Search + Chapter Filter */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <Library className="w-5 h-5 text-cyan-400" />
                  Complete 25-Chapter Engineering Software Usage Guidelines & Pro Tips
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select a software pillar below or search across all 25 chapters (AutoCAD Chapters 1–9, Microsoft Excel Chapters 1–8, and Microsoft Project Chapters 1–8).
                </p>
              </div>

              <button
                onClick={() => setExpandAllGuideTopics((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300 hover:border-cyan-500/40 transition-colors self-start lg:self-center shrink-0"
              >
                {expandAllGuideTopics ? 'Collapse All Topic Guidelines' : 'Expand All Topic Guidelines'}
              </button>
            </div>

            {/* Pillar Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                onClick={() => {
                  setGuidePillar('all');
                  setGuideSelectedChapterId('all');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  guidePillar === 'all'
                    ? 'bg-cyan-500/15 border-cyan-500 text-white'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="text-xs font-bold font-mono uppercase text-cyan-400">
                  All 3 Software Pillars
                </div>
                <div className="text-sm font-bold text-white mt-0.5">25 Complete Chapters</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  AutoCAD (9) + Excel (8) + MS Project (8)
                </div>
              </button>

              <button
                onClick={() => {
                  setGuidePillar('autocad');
                  setGuideSelectedChapterId('all');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  guidePillar === 'autocad'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="text-xs font-bold font-mono uppercase text-amber-400">
                  Pillar 1 • AutoCAD
                </div>
                <div className="text-sm font-bold text-white mt-0.5">9 Drafting & BIM Chapters</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Setup, 2D, Modify, Snaps, Layers, Blocks, Dim, Plot, LISP
                </div>
              </button>

              <button
                onClick={() => {
                  setGuidePillar('excel');
                  setGuideSelectedChapterId('all');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  guidePillar === 'excel'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="text-xs font-bold font-mono uppercase text-emerald-400">
                  Pillar 2 • Microsoft Excel
                </div>
                <div className="text-sm font-bold text-white mt-0.5">8 Engineering Chapters</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  BOQ/MB/RA Bills/BBS, Lookups, Matrix, Solver, Power Query
                </div>
              </button>

              <button
                onClick={() => {
                  setGuidePillar('msproject');
                  setGuideSelectedChapterId('all');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  guidePillar === 'msproject'
                    ? 'bg-violet-500/15 border-violet-500 text-white'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="text-xs font-bold font-mono uppercase text-violet-300">
                  Pillar 3 • MS Project
                </div>
                <div className="text-sm font-bold text-white mt-0.5">8 CPM & EVM Chapters</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Calendars, WBS, FS/SS/FF, Critical Path, Resources, Baselines, EVM
                </div>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={guideSearch}
                onChange={(e) => setGuideSearch(e.target.value)}
                placeholder="Search any command, function, or topic across all 25 chapters (e.g., XLOOKUP, WBLOCK, edays, BCWP, Total Slack, Goal Seek, MLINE, ETRANSMIT)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Chapter Quick-Jump Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setGuideSelectedChapterId('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all ${
                  guideSelectedChapterId === 'all'
                    ? 'bg-cyan-500 text-zinc-950 border-cyan-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Show All ({chaptersForActivePillar.length} Chapters)
              </button>
              {chaptersForActivePillar.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setGuideSelectedChapterId(ch.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                    guideSelectedChapterId === ch.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {ch.pillar === 'autocad'
                    ? `CAD ${ch.chapterNumber}: `
                    : ch.pillar === 'excel'
                    ? `XL ${ch.chapterNumber}: `
                    : `MSP ${ch.chapterNumber}: `}
                  {ch.title}
                </button>
              ))}
            </div>
          </div>

          {/* Chapters & Expandable Topic Cards */}
          <div className="space-y-6">
            {filteredGuideChapters.map((chapter) => {
              const badge = getPillarBadge(chapter.pillar);
              return (
                <div
                  key={chapter.id}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold uppercase ${badge.classes}`}
                        >
                          {badge.label} • Chapter {chapter.chapterNumber}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {chapter.topics.length} Core Topic Modules
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-white mt-1">
                        {chapter.chapterNumber}. {chapter.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{chapter.subtitle}</p>
                    </div>
                  </div>

                  {/* Topic Accordions inside Chapter */}
                  <div className="space-y-3">
                    {chapter.topics.map((topic) => {
                      const isTopicOpen =
                        expandAllGuideTopics || !!expandedTopicMap[topic.id];
                      return (
                        <div
                          key={topic.id}
                          className={`border rounded-xl transition-all overflow-hidden ${
                            isTopicOpen
                              ? 'bg-zinc-950/90 border-cyan-500/40'
                              : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div
                            onClick={() => toggleTopicExpand(topic.id)}
                            className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <div className="space-y-1.5">
                              <h4 className="text-sm font-bold text-white">{topic.title}</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {topic.commandsOrFormulas.map((cf, cIdx) => (
                                  <span
                                    key={cIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(cf, `${topic.id}-cf-${cIdx}`);
                                    }}
                                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-amber-300 flex items-center gap-1 cursor-pointer"
                                    title="Click to copy syntax/formula"
                                  >
                                    <span>{cf}</span>
                                    {copiedText === `${topic.id}-cf-${cIdx}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 text-zinc-500" />
                                    )}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed">
                                {topic.summary}
                              </p>
                            </div>

                            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 self-end md:self-center shrink-0">
                              {isTopicOpen ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>

                          {isTopicOpen && (
                            <div className="px-4 pb-4 pt-3 border-t border-zinc-800/80 space-y-3.5 text-xs">
                              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1">
                                  Operational Mechanics & Engineering Context
                                </div>
                                <p className="text-zinc-300 leading-relaxed">
                                  {topic.mechanics}
                                </p>
                              </div>

                              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-1.5">
                                  Step-by-Step Usage Guidelines
                                </div>
                                <ol className="space-y-1.5 text-zinc-300">
                                  {topic.guidelines.map((g, gIdx) => (
                                    <li key={gIdx} className="flex items-start gap-2">
                                      <span className="font-mono text-amber-400 font-bold shrink-0">
                                        {gIdx + 1}.
                                      </span>
                                      <span className="leading-relaxed">{g}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>

                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-emerald-300 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Field & Office Pro Tip:</strong> {topic.proTip}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 8: MICROSOFT PROJECT (EVM & CPM INTERACTIVE STUDIO + 8 CHAPTERS)
      ===================================================================== */}
      {activeTab === 'msproject' && (
        <div className="space-y-6">
          {/* Top Grid: Interactive EVM Calculator + CPM Pass & Float Analyzer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Earned Value Management (EVM) Calculator */}
            <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    MS Project Earned Value Management (EVM) Calculator
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Computes <code className="text-zinc-200 font-mono">BCWS (PV)</code>, <code className="text-zinc-200 font-mono">BCWP (EV)</code>, <code className="text-zinc-200 font-mono">ACWP (AC)</code>, <code className="text-zinc-200 font-mono">SV</code>, <code className="text-zinc-200 font-mono">CV</code>, <code className="text-zinc-200 font-mono">SPI</code>, <code className="text-zinc-200 font-mono">CPI</code>, <code className="text-zinc-200 font-mono">EAC</code>, <code className="text-zinc-200 font-mono">ETC</code>, <code className="text-zinc-200 font-mono">VAC</code> & <code className="text-zinc-200 font-mono">TCPI</code>.
                  </p>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEvmInputMode('percent')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${
                      evmInputMode === 'percent'
                        ? 'bg-violet-500 text-white border-violet-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    BAC + % Mode
                  </button>
                  <button
                    onClick={() => setEvmInputMode('direct')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${
                      evmInputMode === 'direct'
                        ? 'bg-violet-500 text-white border-violet-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Direct PV/EV Mode
                  </button>
                </div>
              </div>

              {/* EVM Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Budget at Completion (<code className="text-violet-300 font-mono">BAC / Baseline Cost</code>)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={evmBac}
                    onChange={(e) => setEvmBac(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Actual Cost Incurred (<code className="text-violet-300 font-mono">AC / ACWP</code>)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={evmAc}
                    onChange={(e) => setEvmAc(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                {evmInputMode === 'percent' ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                        Planned % Complete at Status Date (<code className="text-cyan-300 font-mono">PV %</code>)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={evmPlannedPct}
                        onChange={(e) => setEvmPlannedPct(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                        Earned Physical % Complete (<code className="text-emerald-300 font-mono">EV %</code>)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={evmEarnedPct}
                        onChange={(e) => setEvmEarnedPct(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                        Planned Value (<code className="text-cyan-300 font-mono">PV / BCWS</code>)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={evmDirectPv}
                        onChange={(e) => setEvmDirectPv(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                        Earned Value (<code className="text-emerald-300 font-mono">EV / BCWP</code>)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={evmDirectEv}
                        onChange={(e) => setEvmDirectEv(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* EVM Results Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3">
                  <div className="text-[10px] font-mono text-zinc-400">PV (BCWS)</div>
                  <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                    {evmMetrics.pv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3">
                  <div className="text-[10px] font-mono text-zinc-400">EV (BCWP)</div>
                  <div className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
                    {evmMetrics.ev.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3">
                  <div className="text-[10px] font-mono text-zinc-400">SPI (EV / PV)</div>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 ${
                      evmMetrics.spi >= 1 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {evmMetrics.spi.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    SV: {evmMetrics.sv >= 0 ? '+' : ''}
                    {evmMetrics.sv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3">
                  <div className="text-[10px] font-mono text-zinc-400">CPI (EV / AC)</div>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 ${
                      evmMetrics.cpi >= 1 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {evmMetrics.cpi.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    CV: {evmMetrics.cv >= 0 ? '+' : ''}
                    {evmMetrics.cv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              {/* EAC & Completion Forecasting Table */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                  <span className="font-mono uppercase text-[10px] text-violet-300 font-bold">
                    Forecast at Completion (EAC, ETC, VAC & TCPI)
                  </span>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        evmMetrics.spi >= 1
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {evmMetrics.spi >= 1 ? 'AHEAD / ON SCHEDULE' : 'BEHIND SCHEDULE'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        evmMetrics.cpi >= 1
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {evmMetrics.cpi >= 1 ? 'UNDER / ON BUDGET' : 'OVER BUDGET'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2.5">
                    <div className="text-[10px] text-zinc-400 font-mono">
                      1. EAC (Standard = BAC / CPI)
                    </div>
                    <div className="text-sm font-bold font-mono text-white mt-0.5">
                      {evmMetrics.eacStandard.toLocaleString(undefined, {
                        maximumFractionDigits: 0
                      })}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      VAC:{' '}
                      <span
                        className={
                          evmMetrics.vacStandard >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }
                      >
                        {evmMetrics.vacStandard >= 0 ? '+' : ''}
                        {evmMetrics.vacStandard.toLocaleString(undefined, {
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2.5">
                    <div className="text-[10px] text-zinc-400 font-mono">
                      2. EAC (One-Off = AC + BAC - EV)
                    </div>
                    <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                      {evmMetrics.eacTypical.toLocaleString(undefined, {
                        maximumFractionDigits: 0
                      })}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      ETC (Std):{' '}
                      {evmMetrics.etcStandard.toLocaleString(undefined, {
                        maximumFractionDigits: 0
                      })}
                    </div>
                  </div>

                  <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2.5">
                    <div className="text-[10px] text-zinc-400 font-mono">
                      3. EAC (Composite CPI×SPI)
                    </div>
                    <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                      {evmMetrics.eacComposite.toLocaleString(undefined, {
                        maximumFractionDigits: 0
                      })}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Required TCPI: <strong className="text-white">{evmMetrics.tcpiBac.toFixed(3)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Critical Path Method (CPM) Forward/Backward Pass & Float Analyzer */}
            <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      CPM Forward / Backward Pass & Slack Analyzer
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Computes <code className="text-zinc-200 font-mono">EF</code>, <code className="text-zinc-200 font-mono">LS</code>, <code className="text-zinc-200 font-mono">Total Slack (TS)</code> & <code className="text-zinc-200 font-mono">Free Slack (FS)</code>.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${
                      cpmMetrics.isCritical
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {cpmMetrics.isCritical ? 'CRITICAL PATH (TS ≤ 0)' : 'NON-CRITICAL (HAS FLOAT)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Early Start (<code className="text-amber-300 font-mono">ES</code>, Day #)
                    </label>
                    <input
                      type="number"
                      value={cpmEs}
                      onChange={(e) => setCpmEs(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Task Duration (<code className="text-amber-300 font-mono">D</code>, Working Days)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={cpmDuration}
                      onChange={(e) => setCpmDuration(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Late Finish (<code className="text-cyan-300 font-mono">LF</code> from Backward Pass)
                    </label>
                    <input
                      type="number"
                      value={cpmLf}
                      onChange={(e) => setCpmLf(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Successor Early Start (<code className="text-emerald-300 font-mono">ES_succ</code>)
                    </label>
                    <input
                      type="number"
                      value={cpmSuccessorEs}
                      onChange={(e) => setCpmSuccessorEs(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Visual PERT Node Box */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <div className="text-[10px] font-mono uppercase text-zinc-400 text-center">
                    Standard CPM Network Node (ES | D | EF / LS | TS | LF)
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                      <div className="text-[10px] text-zinc-500">Early Start (ES)</div>
                      <div className="text-sm font-bold text-white">Day {cpmEs}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                      <div className="text-[10px] text-zinc-500">Duration (D)</div>
                      <div className="text-sm font-bold text-amber-400">{cpmDuration} d</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                      <div className="text-[10px] text-zinc-500">Early Finish (EF)</div>
                      <div className="text-sm font-bold text-white">Day {cpmMetrics.ef}</div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                      <div className="text-[10px] text-zinc-500">Late Start (LS)</div>
                      <div className="text-sm font-bold text-cyan-300">Day {cpmMetrics.ls}</div>
                    </div>
                    <div
                      className={`border rounded-lg p-2 ${
                        cpmMetrics.isCritical
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      <div className="text-[10px]">Total Slack (TS)</div>
                      <div className="text-sm font-bold">{cpmMetrics.totalSlack} d</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                      <div className="text-[10px] text-zinc-500">Late Finish (LF)</div>
                      <div className="text-sm font-bold text-cyan-300">Day {cpmLf}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs font-mono px-1">
                    <span className="text-zinc-400">
                      Free Slack (<code className="text-zinc-200">ES_succ - EF</code>):
                    </span>
                    <span className="font-bold text-emerald-400">{cpmMetrics.freeSlack} days</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-400">
                <strong className="text-white">CPM Equations:</strong> <code className="text-amber-300 font-mono">EF = ES + D</code> | <code className="text-cyan-300 font-mono">LS = LF - D</code> | <code className="text-emerald-300 font-mono">Total Slack = LF - EF = LS - ES</code> | <code className="text-violet-300 font-mono">Free Slack = ES(succ) - EF</code>.
              </div>
            </div>
          </div>

          {/* All 8 MS Project Guidebook Chapters Embedded Directly Below */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-violet-400" />
                  Microsoft Project (MS Project) Complete 8-Chapter Usage Guidelines & Tips
                </h3>
                <p className="text-xs text-zinc-400">
                  Click any topic below to expand step-by-step scheduling procedures, formulas, and construction CPM best practices.
                </p>
              </div>
              <button
                onClick={() => setExpandAllGuideTopics((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-violet-300 hover:border-violet-500/40 shrink-0"
              >
                {expandAllGuideTopics ? 'Collapse All Chapters' : 'Expand All 8 Chapters'}
              </button>
            </div>

            {msProjectChapters.map((chapter) => (
              <div
                key={chapter.id}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4"
              >
                <div className="border-b border-zinc-800 pb-3">
                  <span className="px-2.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-mono font-bold uppercase">
                    MS PROJECT • Chapter {chapter.chapterNumber}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1">
                    {chapter.chapterNumber}. {chapter.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{chapter.subtitle}</p>
                </div>

                <div className="space-y-3">
                  {chapter.topics.map((topic) => {
                    const isOpen = expandAllGuideTopics || !!expandedTopicMap[topic.id];
                    return (
                      <div
                        key={topic.id}
                        className={`border rounded-xl transition-all overflow-hidden ${
                          isOpen
                            ? 'bg-zinc-950/90 border-violet-500/40'
                            : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div
                          onClick={() => toggleTopicExpand(topic.id)}
                          className="p-4 cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-white">{topic.title}</h5>
                            <div className="flex flex-wrap gap-1.5">
                              {topic.commandsOrFormulas.map((cf, idx) => (
                                <code
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-violet-300"
                                >
                                  {cf}
                                </code>
                              ))}
                            </div>
                            <p className="text-xs text-zinc-400">{topic.summary}</p>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                          )}
                        </div>

                        {isOpen && (
                          <div className="px-4 pb-4 pt-3 border-t border-zinc-800/80 space-y-3 text-xs">
                            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3">
                              <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold mb-1">
                                CPM & Scheduling Mechanics
                              </div>
                              <p className="text-zinc-300 leading-relaxed">{topic.mechanics}</p>
                            </div>

                            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3">
                              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold mb-1.5">
                                Step-by-Step Usage Guidelines
                              </div>
                              <ol className="space-y-1.5 text-zinc-300">
                                {topic.guidelines.map((g, gIdx) => (
                                  <li key={gIdx} className="flex items-start gap-2">
                                    <span className="font-mono text-violet-400 font-bold shrink-0">
                                      {gIdx + 1}.
                                    </span>
                                    <span className="leading-relaxed">{g}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-emerald-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>
                                <strong>Planning Engineer Pro Tip:</strong> {topic.proTip}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 1: VIEWPORT, DRAWING PARAMETERS & PLOTTING MECHANICS
      ===================================================================== */}
      {activeTab === 'viewport' && (
        <div className="space-y-6">
          {/* Top Grid: Calculator Controls + Calculated Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Inputs */}
            <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Drawing & Viewport Parameters
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">Model 1:1 → Paper Space mm</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  1. Model Space Drawing Unit (<code className="text-amber-400 font-mono">-DWGUNITS</code>)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['mm', 'cm', 'm', 'inch', 'feet'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setDrawingUnit(unit)}
                      className={`py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all border ${
                        drawingUnit === unit
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  1 Model Space unit = <span className="text-zinc-300 font-mono font-semibold">{unitFactor} mm</span> on plotted ISO paper.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  2. Target Viewport Scale Ratio (<code className="text-amber-400 font-mono">1 : N</code>)
                </label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[10, 20, 25, 50, 75, 100, 150, 200, 500, 1000].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setTargetScale(s);
                        setCustomScale(String(s));
                      }}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        targetScale === s
                          ? 'bg-amber-500 text-zinc-950 border-amber-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      1:{s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400 shrink-0">Custom Scale 1 :</span>
                  <input
                    type="number"
                    min={1}
                    value={customScale}
                    onChange={(e) => {
                      setCustomScale(e.target.value);
                      const val = Number(e.target.value);
                      if (val > 0) setTargetScale(val);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  3. Target ISO Paper Sheet Size (at 1:1 Paper Setup)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {PAPER_SIZES_MM.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPaperId(p.id)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        selectedPaperId === p.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {selectedPaper.label} — {selectedPaper.typicalUse}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Plotted Body Text (mm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={paperTextHeight}
                    onChange={(e) => setPaperTextHeight(Number(e.target.value) || 2.5)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-zinc-500">ISO Standard: 2.5 mm</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Plotted Section Title (mm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1.5"
                    value={paperTitleHeight}
                    onChange={(e) => setPaperTitleHeight(Number(e.target.value) || 5.0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-zinc-500">ISO Standard: 3.5 – 5.0 mm</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Outputs & Mathematical Breakdown */}
            <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Calculated AutoCAD Viewport & Model Parameters
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono">
                    Scale 1:{effectiveScale} in {drawingUnit.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Card 1: ZOOM XP */}
                  <div className="bg-zinc-950/90 border border-amber-500/30 rounded-xl p-4 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                        1. Viewport Zoom XP Factor
                      </span>
                      <button
                        onClick={() => handleCopy(`${xpFactor}XP`, 'xp-cmd')}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title="Copy XP Factor"
                      >
                        {copiedText === 'xp-cmd' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white mt-1">
                      {Number(xpFactor.toFixed(6))}XP
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1.5 font-mono bg-zinc-900/90 px-2.5 py-1 rounded border border-zinc-800">
                      Command: <span className="text-amber-300">Z</span> ↵ <span className="text-amber-300">{Number(xpFactor.toFixed(6))}XP</span> ↵
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1.5">
                      Formula: {unitFactor} mm / {effectiveScale} = {Number(xpFactor.toFixed(6))}XP
                    </p>
                  </div>

                  {/* Card 2: Model Space Text & Title Height */}
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      2. Model Space Text Heights
                    </span>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <div>
                        <div className="text-[10px] text-zinc-500">Body ({paperTextHeight}mm on paper):</div>
                        <div className="text-xl font-bold font-mono text-white">
                          {Number(modelTextHeight.toFixed(4))} <span className="text-xs text-zinc-400">{drawingUnit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-zinc-500">Title ({paperTitleHeight}mm on paper):</div>
                        <div className="text-xl font-bold font-mono text-cyan-300">
                          {Number(modelTitleHeight.toFixed(4))} <span className="text-xs text-zinc-400">{drawingUnit}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">
                      Formula: H_model = H_paper × ({effectiveScale} / {unitFactor})
                    </p>
                  </div>

                  {/* Card 3: DIMSCALE & LTSCALE */}
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      3. Dimension & Linetype Scales
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2">
                        <div className="text-[10px] font-mono text-zinc-400">DIMSCALE</div>
                        <div className="text-lg font-bold font-mono text-emerald-400">
                          {Number(dimScale.toFixed(4))}
                        </div>
                      </div>
                      <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2">
                        <div className="text-[10px] font-mono text-zinc-400">Model LTSCALE</div>
                        <div className="text-lg font-bold font-mono text-emerald-400">
                          {Number(ltScale.toFixed(4))}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">
                      In Paper Space Layouts, always set <code className="text-zinc-300">PSLTSCALE = 1</code> and <code className="text-zinc-300">LTSCALE = 1</code>.
                    </p>
                  </div>

                  {/* Card 4: Real-World Sheet Coverage on Ground */}
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                      4. {selectedPaper.id} Printable Ground Coverage
                    </span>
                    <div className="text-lg font-bold font-mono text-white mt-1">
                      {Number(groundWidthInDrawingUnits.toFixed(2))} × {Number(groundHeightInDrawingUnits.toFixed(2))} {drawingUnit}
                    </div>
                    <div className="text-xs font-mono text-purple-300 mt-0.5">
                      ({groundWidthMeters.toFixed(2)} m × {groundHeightMeters.toFixed(2)} m real-world area)
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1.5">
                      Net printable viewport window inside {selectedPaper.id} titleblock margins ({selectedPaper.playableWidthMm}×{selectedPaper.playableHeightMm} mm).
                    </p>
                  </div>
                </div>
              </div>

              {/* Mathematical Mechanics Formula Banner */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-300 space-y-1.5">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  How AutoCAD Viewport Scaling Works Under the Hood:
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  AutoCAD Paper Space is strictly measured in <strong className="text-white">millimeters (1 unit = 1 mm)</strong> when plotted at 1:1. Because your Model Space geometry is drawn in <strong className="text-white">{drawingUnit.toUpperCase()}</strong> (<code className="text-amber-300">1 {drawingUnit} = {unitFactor} mm</code>), AutoCAD must bridge two conversions simultaneously inside a Viewport: converting {drawingUnit} to millimeters (<code className="text-amber-300">× {unitFactor}</code>) and reducing by the target scale (<code className="text-amber-300">÷ {effectiveScale}</code>). Typing <code className="text-emerald-300 font-mono">Z ↵ {Number(xpFactor.toFixed(6))}XP ↵</code> inside an active viewport locks that exact ratio relative to Paper Space (`XP` = <em className="text-zinc-200">times Paper Space</em>).
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-Step Operational Guide to Viewport & Drawing Setup */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Step-by-Step Operational Guide: Setting Up Model Space, Layouts & Locked Viewports
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Click any step below to view the internal CAD mechanics, exact command sequence, and drafting best practices.
                </p>
              </div>
              <button
                onClick={() => setShowAllWalkthroughSteps((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-400 hover:border-amber-500/40 transition-colors self-start sm:self-auto shrink-0"
              >
                {showAllWalkthroughSteps ? 'Collapse Steps' : 'Expand All 6 Steps'}
              </button>
            </div>

            <div className="space-y-3">
              {VIEWPORT_WALKTHROUGH_STEPS.map((item) => {
                const isOpen = showAllWalkthroughSteps || expandedWalkthroughStep === item.step;
                return (
                  <div
                    key={item.step}
                    className={`border rounded-xl transition-all overflow-hidden ${
                      isOpen
                        ? 'bg-zinc-950/90 border-amber-500/40'
                        : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <button
                      onClick={() =>
                        setExpandedWalkthroughStep(
                          expandedWalkthroughStep === item.step ? null : item.step
                        )
                      }
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          0{item.step}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">{item.title}</span>
                            <code className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-amber-300">
                              {item.command}
                            </code>
                          </div>
                          <p className="text-xs text-zinc-400 truncate mt-0.5">{item.summary}</p>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-2 border-t border-zinc-800/80 space-y-3 text-xs">
                        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1">
                            How It Functions (Internal Mechanics)
                          </div>
                          <p className="text-zinc-300 leading-relaxed">{item.mechanics}</p>
                        </div>

                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-1.5">
                            Step-by-Step Execution in AutoCAD
                          </div>
                          <ol className="space-y-1.5">
                            {item.instructions.map((inst, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-zinc-300">
                                <span className="font-mono text-amber-400 font-bold shrink-0">
                                  {idx + 1}.
                                </span>
                                <span>{inst}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-emerald-300 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Engineering Pro Tip:</strong> {item.proTip}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTB / STB Plot Style Table & Lineweight Reference */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-cyan-400" />
                  Standard Civil & Structural CTB Plot Style Table, Lineweights & Sheet Set Manager (<code className="text-cyan-400 font-mono">SSM</code>)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  How AutoCAD maps on-screen Layer Index Colors (1–9 & 250–254) to physical PDF pen thicknesses and grayscale screening via <code className="text-zinc-200 font-mono">STYLESMANAGER</code>.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono self-start md:self-auto">
                ISO 128 / ACI 315 Pen Standard
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-400 bg-zinc-950/60">
                    <th className="py-2.5 px-3">AutoCAD Color</th>
                    <th className="py-2.5 px-3">Plot Output Color</th>
                    <th className="py-2.5 px-3">Ink Screening</th>
                    <th className="py-2.5 px-3">Lineweight (mm)</th>
                    <th className="py-2.5 px-3">Standard Civil / Structural / Architectural Layer Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {CTB_PEN_TABLE.map((row) => (
                    <tr key={row.colorNumber} className="hover:bg-zinc-950/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-white flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-sm border border-white/20 shrink-0"
                          style={{ backgroundColor: row.hexPreview }}
                        />
                        {row.colorNumber}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300 font-mono">{row.plotColor}</td>
                      <td className="py-2.5 px-3 text-zinc-300 font-mono">{row.screening}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                        {row.lineweightMm}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">{row.engineeringUse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: ESSENTIAL CIVIL & ARCHITECTURAL AUTOCAD COMMANDS
      ===================================================================== */}
      {activeTab === 'shortcuts' && (
        <div className="space-y-5">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cmdSearch}
                  onChange={(e) => setCmdSearch(e.target.value)}
                  placeholder="Search commands, aliases, system variables, or tasks (e.g., OVERKILL, OSNAPZ, XCLIP, PSLTSCALE)..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                onClick={() => setExpandAllCommands((prev) => !prev)}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-400 hover:border-amber-500/40 transition-colors shrink-0"
              >
                {expandAllCommands ? 'Collapse Command Details' : 'Expand All Mechanics & Steps'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {commandCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCmdCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    cmdCategory === cat
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {filteredCommands.map((item) => {
              const isExpanded = expandAllCommands || !!expandedCmdMap[item.cmd];
              return (
                <div
                  key={item.cmd}
                  className={`border rounded-2xl transition-all overflow-hidden ${
                    isExpanded
                      ? 'bg-zinc-900/60 border-amber-500/40'
                      : 'bg-zinc-900/30 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div
                    onClick={() => toggleCommandExpand(item.cmd)}
                    className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold font-mono text-amber-400">
                          {item.cmd}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                          Alias: {item.alias}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-300">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item.cmd.split(' ')[0], `cmd-${item.cmd}`);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-mono flex items-center gap-1.5"
                      >
                        {copiedText === `cmd-${item.cmd}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-3 border-t border-zinc-800/80 bg-zinc-950/60 space-y-3.5 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-zinc-400">
                          Command-Line Syntax:
                        </span>
                        <code className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-amber-300 font-mono">
                          {item.syntax}
                        </code>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-3.5">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1.5">
                            How It Works (Internal Mechanics)
                          </div>
                          <p className="text-zinc-300 leading-relaxed">{item.mechanics}</p>
                        </div>

                        <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-3.5">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-1.5">
                            Step-by-Step Instructions
                          </div>
                          <ol className="space-y-1.5">
                            {item.stepByStep.map((step, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-2 text-zinc-300">
                                <span className="font-mono text-amber-400 font-bold shrink-0">
                                  {sIdx + 1}.
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Field & Drafting Best Practice:</strong> {item.tips}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: AUTOCAD PLUGINS & ADD-ON SUITES
      ===================================================================== */}
      {activeTab === 'plugins' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {CAD_PLUGINS_DATA.map((suite) => {
              const isSelected = suite.id === activePluginId;
              return (
                <button
                  key={suite.id}
                  onClick={() => {
                    setActivePluginId(suite.id);
                    setPluginCategory('All');
                    setPluginSearch('');
                  }}
                  className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold font-mono uppercase ${
                          isSelected ? 'text-amber-400' : 'text-zinc-200'
                        }`}
                      >
                        {suite.id === 'yqarch'
                          ? 'YQArch (源泉设计)'
                          : suite.id === 'yqprime'
                          ? 'YQPrime Suite'
                          : suite.id === 'leemac'
                          ? 'Lee Mac LISP'
                          : suite.id === 'rebarcad'
                          ? 'RebarCAD / ASD'
                          : 'Civil 3D BIM'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                        {suite.commands.length} Workflows
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2">
                      {suite.discipline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-5">
            <div className="border-b border-zinc-800 pb-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                {activePluginSuite.discipline}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mt-0.5">
                {activePluginSuite.name}
              </h3>
              <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                {activePluginSuite.overview}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Installation, English Language & Unit Setup Steps
                </div>
                <ol className="space-y-2 text-xs text-zinc-300">
                  {activePluginSuite.setupSteps.map((st, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{st}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="lg:col-span-5 bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Master Configuration Commands
                </div>
                <div className="space-y-2">
                  {activePluginSuite.keyConfigCommands.map((cfg) => (
                    <div
                      key={cfg.cmd}
                      className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 flex items-start justify-between gap-2"
                    >
                      <div>
                        <code className="text-xs font-mono font-bold text-amber-400">
                          {cfg.cmd}
                        </code>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{cfg.effect}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(cfg.cmd.split(' ')[0], `cfg-${cfg.cmd}`)}
                        className="p-1.5 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white shrink-0"
                      >
                        {copiedText === `cfg-${cfg.cmd}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pluginSearch}
                    onChange={(e) => setPluginSearch(e.target.value)}
                    placeholder={`Search ${activePluginSuite.name} commands...`}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pluginCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setPluginCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                        pluginCategory === cat
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPluginCommands.map((cmd) => (
                  <div
                    key={cmd.code}
                    className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                              {cmd.code}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">
                              {cmd.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1.5">{cmd.name}</h4>
                        </div>
                        <button
                          onClick={() =>
                            handleCopy(cmd.code.split(' ')[0], `plug-${cmd.code}`)
                          }
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white shrink-0"
                        >
                          {copiedText === `plug-${cmd.code}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">{cmd.purpose}</p>

                      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-3 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                          Step-by-Step Workflow:
                        </div>
                        <ol className="space-y-1 text-xs text-zinc-300">
                          {cmd.stepByStep.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="font-mono text-amber-400 font-bold shrink-0">
                                {idx + 1}.
                              </span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    {cmd.proTip && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-[11px] text-emerald-300">
                        <strong>Pro Tip:</strong> {cmd.proTip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: AUTOLISP STUDIO & DYNAMIC BLOCKS / DATAEXTRACTION
      ===================================================================== */}
      {activeTab === 'lisp' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-amber-400" />
                  Production AutoLISP (<code className="text-amber-400 font-mono">.LSP</code>) Automation Library
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Copy or download any <code className="text-zinc-200 font-mono">.lsp</code> routine below, type <code className="text-amber-300 font-mono">APPLOAD</code> in AutoCAD, load the file, and run its command name.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lispCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setLispCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      lispCategory === cat
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredLispRoutines.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                            Command: {item.command}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">{item.title}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopy(item.code, `lisp-${item.id}`)}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300 text-[11px] font-mono flex items-center gap-1"
                        >
                          {copiedText === `lisp-${item.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadFile(item.code, `${item.command}.lsp`)
                          }
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-amber-400"
                          title={`Download ${item.command}.lsp`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">{item.desc}</p>

                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2.5">
                      <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold mb-1">
                        How to Run:
                      </div>
                      <ol className="space-y-1 text-[11px] text-zinc-300">
                        {item.howToRun.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="font-mono text-amber-400 font-bold">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <pre className="bg-zinc-900 border border-zinc-800/90 rounded-lg p-3 text-[11px] font-mono text-amber-300/90 overflow-x-auto max-h-52">
                    <code>{item.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono uppercase">
                {DYNAMIC_BLOCKS_DATAEXTRACTION_GUIDE.badge}
              </span>
              <h3 className="text-base md:text-lg font-bold text-white mt-1.5">
                {DYNAMIC_BLOCKS_DATAEXTRACTION_GUIDE.title}
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {DYNAMIC_BLOCKS_DATAEXTRACTION_GUIDE.overview}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DYNAMIC_BLOCKS_DATAEXTRACTION_GUIDE.steps.map((st) => (
                <div
                  key={st.stepNumber}
                  className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                      Step 0{st.stepNumber}
                    </span>
                    <code className="text-[11px] font-mono text-cyan-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {st.commandOrFormula}
                    </code>
                  </div>
                  <h4 className="text-sm font-bold text-white">{st.heading}</h4>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {st.details.map((d, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: SURVEY TOTAL STATION CSV TO AUTOCAD SCRIPT (.SCR)
      ===================================================================== */}
      {activeTab === 'survey' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  Total Station CSV Coordinate Input
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">
                  {generatedSurveyData.pointCount} Valid Points Parsed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    CSV Column Order
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setSurveyColumnOrder('PENZD')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                        surveyColumnOrder === 'PENZD'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      P, E(X), N(Y), Z, D
                    </button>
                    <button
                      onClick={() => setSurveyColumnOrder('PNEZD')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                        surveyColumnOrder === 'PNEZD'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      P, N(Y), E(X), Z, D
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Point Label Text Height (m/ft)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.05"
                    value={surveyTextHeight}
                    onChange={(e) => setSurveyTextHeight(Number(e.target.value) || 0.4)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={surveyIncludeZInText}
                    onChange={(e) => setSurveyIncludeZInText(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0"
                  />
                  <span>Include Spot Elevation <code className="text-amber-300 font-mono">[RL: Z]</code> in label</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={surveyConnectPolyline}
                    onChange={(e) => setSurveyConnectPolyline(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0"
                  />
                  <span>Connect points with <code className="text-cyan-300 font-mono">3DPOLY</code> boundary</span>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Paste Total Station CSV rows below:</span>
                  <button
                    onClick={() => setCsvInput(DEFAULT_SURVEY_CSV)}
                    className="text-amber-400 hover:underline font-mono"
                  >
                    Reset Sample Data
                  </button>
                </div>
                <textarea
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  className="w-full h-56 bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="lg:col-span-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Generated AutoCAD Script (<code className="text-amber-400 font-mono">.SCR</code>)
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Auto-creates layers <code className="text-zinc-200 font-mono">SURVEY-POINTS</code> & <code className="text-zinc-200 font-mono">SURVEY-TEXT</code> with <code className="text-zinc-200 font-mono">OSMODE 0</code> protection.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(generatedSurveyData.script, 'scr-copy')}
                      className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 flex items-center gap-1.5"
                    >
                      {copiedText === 'scr-copy' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        handleDownloadFile(generatedSurveyData.script, 'Survey_Points_Import.scr')
                      }
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .SCR</span>
                    </button>
                  </div>
                </div>

                <pre className="w-full h-72 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-y-auto">
                  <code>{generatedSurveyData.script}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono uppercase">
                {SURVEY_CAD_WORKFLOW_GUIDE.badge}
              </span>
              <h3 className="text-base md:text-lg font-bold text-white mt-1.5">
                {SURVEY_CAD_WORKFLOW_GUIDE.title}
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {SURVEY_CAD_WORKFLOW_GUIDE.overview}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SURVEY_CAD_WORKFLOW_GUIDE.steps.map((st) => (
                <div
                  key={st.stepNumber}
                  className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-2"
                >
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                    Step 0{st.stepNumber}
                  </span>
                  <h4 className="text-sm font-bold text-white">{st.heading}</h4>
                  <code className="block text-[10px] font-mono text-cyan-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                    {st.commandOrFormula}
                  </code>
                  <ul className="space-y-1.5 text-xs text-zinc-300 pt-1">
                    {st.details.map((d, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: EXCEL ENGINEERING STUDIO
      ===================================================================== */}
      {activeTab === 'excel' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setExcelSubTab('formulas')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  excelSubTab === 'formulas'
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                1. Civil & Structural Formulas ({EXPANDED_EXCEL_FORMULAS.length})
              </button>

              <button
                onClick={() => setExcelSubTab('vba')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  excelSubTab === 'vba'
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                2. Ready-to-Copy VBA Macros ({EXCEL_VBA_MACROS.length})
              </button>

              <button
                onClick={() => setExcelSubTab('guides')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  excelSubTab === 'guides'
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                3. Structural Matrix Solver & Power Query BOQ
              </button>
            </div>
          </div>

          {excelSubTab === 'formulas' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={excelSearch}
                    onChange={(e) => setExcelSearch(e.target.value)}
                    placeholder="Search Excel formulas..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {excelCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setExcelCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        excelCategory === cat
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredExcelFormulas.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-3.5 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono uppercase">
                          {item.category}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">{item.title}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
                      </div>

                      <button
                        onClick={() => handleCopy(item.formula, `xl-${item.id}`)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-emerald-400 flex items-center gap-1.5 self-start sm:self-center shrink-0"
                      >
                        {copiedText === `xl-${item.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Formula</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Formula</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 font-mono text-xs text-emerald-300 overflow-x-auto">
                      {item.formula}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 text-xs">
                      <div className="md:col-span-5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5">
                        <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold mb-1">
                          Mathematical & Formula Mechanics
                        </div>
                        <p className="text-zinc-300 leading-relaxed">{item.explanation}</p>
                        <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                          <span className="text-zinc-400">Input: {item.exampleInput}</span>
                          <span className="text-emerald-400 font-bold">→ {item.exampleOutput}</span>
                        </div>
                      </div>

                      <div className="md:col-span-7 bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5">
                        <div className="text-[10px] font-mono uppercase text-amber-400 font-bold mb-1">
                          Step-by-Step Worksheet Setup
                        </div>
                        <ol className="space-y-1.5 text-zinc-300">
                          {item.stepByStep.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="font-mono text-emerald-400 font-bold">{idx + 1}.</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {excelSubTab === 'vba' && (
            <div className="space-y-5">
              {EXCEL_VBA_MACROS.map((macro) => (
                <div
                  key={macro.id}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                          {macro.functionName}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          {macro.category}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1.5">{macro.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{macro.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopy(macro.vbaCode, `vba-${macro.id}`)}
                        className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-1.5"
                      >
                        {copiedText === `vba-${macro.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied VBA</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy VBA Module</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDownloadFile(macro.vbaCode, `${macro.id}.bas`)}
                        className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-amber-400"
                        title="Download .bas file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 text-xs">
                    <div className="text-[10px] font-mono uppercase text-amber-400 font-bold mb-1.5">
                      Step-by-Step Installation in Excel (ALT + F11):
                    </div>
                    <ol className="space-y-1 text-zinc-300">
                      {macro.howToInstall.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-mono text-emerald-400 font-bold">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-64">
                    <code>{macro.vbaCode}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}

          {excelSubTab === 'guides' && (
            <div className="space-y-6">
              {EXCEL_ADVANCED_GUIDES.map((guide) => (
                <div
                  key={guide.id}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4"
                >
                  <div className="border-b border-zinc-800 pb-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase">
                      {guide.badge}
                    </span>
                    <h3 className="text-base md:text-lg font-bold text-white mt-1.5">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{guide.overview}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {guide.steps.map((st) => (
                      <div
                        key={st.stepNumber}
                        className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-2"
                      >
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                          Step 0{st.stepNumber}
                        </span>
                        <h4 className="text-sm font-bold text-white">{st.heading}</h4>
                        <code className="block text-[11px] font-mono text-amber-300 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                          {st.commandOrFormula}
                        </code>
                        <ul className="space-y-1.5 text-xs text-zinc-300 pt-1">
                          {st.details.map((d, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Bilingual Engineering Monograph & Documentation */}
      <div className="pt-4 border-t border-zinc-800/80">
        <AboutThisTool id="cad-hub-doc" toolId={activeDocToolId} defaultExpanded={true} />
      </div>
    </div>
  );
};
