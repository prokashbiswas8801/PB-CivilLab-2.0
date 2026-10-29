import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Laptop,
  FileSpreadsheet,
  Terminal,
  Calculator,
  Search,
  Copy,
  CheckCircle2,
  ExternalLink,
  Code,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface CadUtilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'viewport' | 'shortcuts' | 'excel';
}

interface CadShortcut {
  cmd: string;
  alias: string;
  category: 'Drawing' | 'Editing' | 'Layers' | 'Annotation' | 'Productivity';
  description: string;
  tips: string;
}

interface LispRoutine {
  name: string;
  command: string;
  description: string;
  code: string;
}

interface ExcelFormulaItem {
  name: string;
  category: 'Takeoff & BOQ' | 'Structural & Rebar' | 'Financial & Project';
  formula: string;
  syntax: string;
  description: string;
  example: string;
}

export const CadUtilitiesModal: React.FC<CadUtilitiesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'viewport',
}) => {
  const [activeTab, setActiveTab] = useState<'viewport' | 'shortcuts' | 'excel'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- AutoCAD Viewport Calculator State ---
  const [unitType, setUnitType] = useState<'metric-mm' | 'metric-m' | 'imperial-inch'>('metric-mm');
  const [targetScale, setTargetScale] = useState<number>(100); // 1:100
  const [paperTextHeightMm, setPaperTextHeightMm] = useState<number>(2.5); // standard 2.5mm title/dim text
  const [paperTitleHeightMm, setPaperTitleHeightMm] = useState<number>(5.0);

  // Computations:
  // Zoom factor: In metric layout where 1 unit = 1mm and model is in meters (1 unit = 1000mm):
  // Zoom xp factor = (1000 / scale)xp.
  // If model is in mm: Zoom xp factor = (1 / scale)xp.
  const zoomXpFactor = unitType === 'metric-m' ? 1000 / targetScale : 1 / targetScale;
  const modelTextHeight = paperTextHeightMm * (unitType === 'metric-m' ? targetScale / 1000 : targetScale);
  const modelTitleHeight = paperTitleHeightMm * (unitType === 'metric-m' ? targetScale / 1000 : targetScale);
  const dimScale = targetScale;
  const ltScale = unitType === 'metric-m' ? targetScale * 0.025 : targetScale * 0.5;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // --- CAD Shortcuts Database ---
  const CAD_SHORTCUTS: CadShortcut[] = [
    { cmd: 'OVERKILL', alias: 'OVERKILL', category: 'Productivity', description: 'Removes duplicate or overlapping lines, arcs, and polylines.', tips: 'Essential before importing structural frames or sending drawings to clients.' },
    { cmd: 'PURGE', alias: 'PU', category: 'Productivity', description: 'Removes unused named objects like layers, linetypes, blocks, and styles.', tips: 'Drastically reduces drawing DWG file size.' },
    { cmd: 'BURST', alias: 'BURST', category: 'Editing', description: 'Explodes selected blocks preserving attribute values as plain text.', tips: 'Prevents title blocks or rebar tags from reverting to attribute tags.' },
    { cmd: 'FLATTEN', alias: 'FLATTEN', category: 'Editing', description: 'Converts 3D geometry into 2D by setting all Z-coordinates to zero.', tips: 'Fixes fillet or trim errors caused by rogue Z-elevations.' },
    { cmd: 'QSELECT', alias: 'QSE', category: 'Productivity', description: 'Quickly selects objects based on filtering criteria (layer, color, type).', tips: 'Great for selecting all text of a specific height or all circles.' },
    { cmd: 'LAYISO', alias: 'LAYISO', category: 'Layers', description: 'Isolates the layers of selected objects, hiding or locking all others.', tips: 'Use LAYUNISO to restore previous layer states.' },
    { cmd: 'MATCHPROP', alias: 'MA', category: 'Editing', description: 'Copies properties from one object to one or more other objects.', tips: 'Quickly match layer, linetype, hatch scale, or dimension styles.' },
    { cmd: 'PEDIT', alias: 'PE', category: 'Drawing', description: 'Edits polylines, 3D polygon meshes, and joins multiple lines into one.', tips: 'Type M (Multiple) then J (Join) to convert lines to a closed boundary.' },
    { cmd: 'BOUNDARY', alias: 'BO', category: 'Drawing', description: 'Creates a region or polyline from an enclosed area.', tips: 'Fastest way to get area of irregular slabs or rooms.' },
    { cmd: 'DIMSTYLE', alias: 'D', category: 'Annotation', description: 'Creates and modifies dimension styles.', tips: 'Set Fit tab to "Use overall scale of" to match viewport scale.' },
    { cmd: 'APPLOAD', alias: 'AP', category: 'Productivity', description: 'Loads AutoLISP routines, ObjectARX, and VBA applications.', tips: 'Load civil reinforcement or chainage routines.' },
    { cmd: 'CHSPACE', alias: 'CHSPACE', category: 'Productivity', description: 'Transfers objects between Model Space and Paper Space viewports.', tips: 'Maintains exact visual scale when transferring notes or details.' },
  ];

  // --- LISP Hub ---
  const LISP_ROUTINES: LispRoutine[] = [
    {
      name: 'Total Length of Selected Lines/Polylines (TLEN)',
      command: 'TLEN',
      description: 'Calculates the cumulative sum length of all selected lines, polylines, and arcs (e.g. for rebar or piping takeoff).',
      code: `(defun c:TLEN (/ ss tot len i ent)
  (vl-load-com)
  (setq tot 0.0)
  (if (setq ss (ssget '((0 . "LINE,LWPOLYLINE,POLYLINE,ARC,SPLINE"))))
    (progn
      (repeat (setq i (sslength ss))
        (setq ent (vlax-ename->vla-object (ssname ss (setq i (1- i)))))
        (setq len (vlax-curve-getDistAtParam ent (vlax-curve-getEndParam ent)))
        (setq tot (+ tot len))
      )
      (princ (strcat "\\nTotal Length = " (rtos tot 2 3) " units"))
    )
    (princ "\\nNo valid curves selected.")
  )
  (princ)
)`,
    },
    {
      name: 'Coordinate Spot Elevation / Northing & Easting (XYZ)',
      command: 'XYZ',
      description: 'Clicks any point in model space and automatically places a leader with exact Easting (X), Northing (Y), and Elevation (Z).',
      code: `(defun c:XYZ (/ pt ptText str)
  (setq pt (getpoint "\\nClick coordinate inspection point: "))
  (if pt
    (progn
      (setq ptText (getpoint pt "\\nPick text placement location: "))
      (setq str (strcat "E: " (rtos (car pt) 2 3) "\\nN: " (rtos (cadr pt) 2 3) "\\nZ: " (rtos (caddr pt) 2 3)))
      (command "_LEADER" pt ptText "" str "")
    )
  )
  (princ)
)`,
    },
  ];

  // --- Excel Formula Library ---
  const EXCEL_FORMULAS: ExcelFormulaItem[] = [
    {
      name: 'Cement Bags Tally from Concrete Volume',
      category: 'Takeoff & BOQ',
      formula: '=CEILING.MATH((Volume_m3 * 1.54 * (Cement_Ratio / Sum_Ratios) * 1440) / 50)',
      syntax: 'CEILING.MATH((Vol * 1.54 * (1/sum) * 1440)/50, 1)',
      description: 'Calculates exact rounded-up 50kg cement bags using standard dry factor 1.54 and cement bulk density 1440 kg/m³.',
      example: 'For 10 m³ of 1:1.5:3 mix: =CEILING.MATH((10*1.54*(1/5.5)*1440)/50) -> 81 Bags',
    },
    {
      name: 'Exact Theoretical Rebar Weight per Meter',
      category: 'Structural & Rebar',
      formula: '=(Diameter_mm^2) / 162.2 * Length_m',
      syntax: '=(Dia^2 / 162.198) * Length',
      description: 'Calculates structural steel weight in kg using exact mass density (7850 kg/m³).',
      example: 'For 12m length of 16mm bar: =(16^2 / 162.2) * 12 -> 18.94 kg',
    },
    {
      name: 'Two-Way Table Dynamic Rate Lookup (INDEX-MATCH)',
      category: 'Takeoff & BOQ',
      formula: '=INDEX(RateMatrix, MATCH(ItemCode, CodeColumn, 0), MATCH(RegionDistrict, RegionHeader, 0))',
      syntax: 'INDEX(array, row_num, [col_num])',
      description: 'Looks up material or labor unit rates dynamically based on both Item Code and Regional District (e.g. Dhaka vs Chittagong).',
      example: '=INDEX(Rates!$C$2:$G$100, MATCH(B5, Rates!$A$2:$A$100, 0), MATCH($D$2, Rates!$C$1:$G$1, 0))',
    },
    {
      name: 'Rebar Cutting Bars with Standard Stock Length (12m)',
      category: 'Structural & Rebar',
      formula: '=INT(12 / CuttingLength_m) & " pcs/bar, Offcut: " & ROUND(MOD(12, CuttingLength_m), 2) & " m"',
      syntax: 'INT(Stock/Cut) & MOD(Stock, Cut)',
      description: 'Calculates how many pieces can be cut from a 12m standard stock bar and remaining scrap offcut.',
      example: 'For 3.8m cut length: gives "3 pcs/bar, Offcut: 0.6 m"',
    },
    {
      name: 'Cash Flow S-Curve Progress Polynomial Distribution',
      category: 'Financial & Project',
      formula: '=3*(Month/TotalMonths)^2 - 2*(Month/TotalMonths)^3',
      syntax: '3*(t/T)^2 - 2*(t/T)^3',
      description: 'Smooth mathematical S-curve cumulative percentage progress for project construction cash flows.',
      example: 'At month 6 of 12 (50% time elapsed): =3*(0.5)^2 - 2*(0.5)^3 -> 50% cumulative billing',
    },
  ];

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return CAD_SHORTCUTS;
    const q = searchQuery.toLowerCase();
    return CAD_SHORTCUTS.filter(
      (s) =>
        s.cmd.toLowerCase().includes(q) ||
        s.alias.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredFormulas = useMemo(() => {
    if (!searchQuery.trim()) return EXCEL_FORMULAS;
    const q = searchQuery.toLowerCase();
    return EXCEL_FORMULAS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  CAD, Excel &amp; Utilities Hub
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AutoCAD Viewport Scaler, CAD Shortcuts &amp; LISP Scripts, Civil Excel Formula Library
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => setActiveTab('viewport')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'viewport'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>AutoCAD Scale &amp; Viewport</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shortcuts')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'shortcuts'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>CAD Shortcuts &amp; LISP Hub</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('excel')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'excel'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Formula Library</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'viewport' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Inputs */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Drawing &amp; Scale Setup
                  </h3>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Model Space Unit System
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUnitType('metric-m')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold ${
                          unitType === 'metric-m'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Meters (1 unit = 1.0 m)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnitType('metric-mm')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold ${
                          unitType === 'metric-mm'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Millimeters (1 unit = 1 mm)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Target Print Scale (1 : X)
                    </label>
                    <div className="flex gap-2">
                      {[20, 50, 100, 200, 500].map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() => setTargetScale(sc)}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold ${
                            targetScale === sc
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          1:{sc}
                        </button>
                      ))}
                    </div>
                    <div className="pt-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={targetScale}
                        onChange={(e) => setTargetScale(Math.max(1, Number(e.target.value)))}
                        className="w-full text-base px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Paper Body Text (mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        inputMode="decimal"
                        value={paperTextHeightMm}
                        onChange={(e) => setPaperTextHeightMm(Math.max(1, Number(e.target.value)))}
                        className="w-full text-base px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Paper Title Text (mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        inputMode="decimal"
                        value={paperTitleHeightMm}
                        onChange={(e) => setPaperTitleHeightMm(Math.max(2, Number(e.target.value)))}
                        className="w-full text-base px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Viewport & AutoCAD Commands Output */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Primary Zoom Command */}
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-indigo-700 dark:text-indigo-400">AutoCAD Viewport Zoom Factor</div>
                      <div className="text-2xl font-black font-mono text-indigo-900 dark:text-indigo-200 mt-1">
                        Z ↵ S ↵ {zoomXpFactor.toFixed(4)}xp
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Inside viewport: Type <code>Z</code> → <code>S</code> → <code>{zoomXpFactor.toFixed(4)}xp</code>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyText(`Z\nS\n${zoomXpFactor.toFixed(4)}xp`, 'zoom-cmd')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copiedId === 'zoom-cmd' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'zoom-cmd' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* System Variable Table */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      AutoCAD System Variables for 1:{targetScale}
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <strong className="text-indigo-600 dark:text-indigo-400">DIMSCALE:</strong> Overall Dimension Scale
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{dimScale}</span>
                          <button
                            type="button"
                            onClick={() => copyText(`DIMSCALE ${dimScale}`, 'dimscale')}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <strong className="text-indigo-600 dark:text-indigo-400">LTSCALE / PSLTSCALE:</strong> Linetype Scale
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{ltScale.toFixed(2)} (PSLTSCALE=1)</span>
                          <button
                            type="button"
                            onClick={() => copyText(`LTSCALE ${ltScale.toFixed(2)}\nPSLTSCALE 1`, 'ltscale')}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <strong className="text-indigo-600 dark:text-indigo-400">Model Text Height:</strong> For {paperTextHeightMm}mm on paper
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{modelTextHeight.toFixed(2)} {unitType === 'metric-m' ? 'm' : 'mm'}</span>
                          <button
                            type="button"
                            onClick={() => copyText(`${modelTextHeight.toFixed(2)}`, 'textheight')}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <strong className="text-indigo-600 dark:text-indigo-400">Model Title Height:</strong> For {paperTitleHeightMm}mm on paper
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{modelTitleHeight.toFixed(2)} {unitType === 'metric-m' ? 'm' : 'mm'}</span>
                          <button
                            type="button"
                            onClick={() => copyText(`${modelTitleHeight.toFixed(2)}`, 'titleheight')}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-5">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shortcuts, commands, or LISP routines (e.g. overkill, purge, burst)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* AutoCAD Shortcuts Table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Civil AutoCAD Essential Commands ({filteredShortcuts.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredShortcuts.map((s) => (
                      <div
                        key={s.cmd}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs">
                              {s.alias}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{s.category}</span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{s.cmd}</div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {s.description}
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-500 italic">
                          Tip: {s.tips}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AutoLISP Scripts Hub */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Civil AutoLISP Productivity Scripts
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">Load in AutoCAD via APPLOAD</span>
                  </div>

                  <div className="space-y-3">
                    {LISP_ROUTINES.map((lisp) => (
                      <div
                        key={lisp.command}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 space-y-2 font-mono text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div>
                            <span className="text-indigo-400 font-bold">{lisp.name}</span>
                            <span className="text-slate-500 ml-2">(Command: {lisp.command})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyText(lisp.code, `lisp-${lisp.command}`)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedId === `lisp-${lisp.command}` ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === `lisp-${lisp.command}` ? 'Copied' : 'Copy Code'}</span>
                          </button>
                        </div>
                        <p className="text-slate-400 text-[11px]">{lisp.description}</p>
                        <pre className="p-3 rounded-xl bg-black/60 text-[11px] overflow-x-auto text-emerald-400 leading-relaxed custom-scrollbar">
                          {lisp.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'excel' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Excel formulas (e.g. cement, rebar, index match, s-curve)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-3">
                  {filteredFormulas.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase">
                            {f.category}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{f.name}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(f.formula, `excel-${idx}`)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          {copiedId === `excel-${idx}` ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === `excel-${idx}` ? 'Copied' : 'Copy Formula'}</span>
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs text-indigo-600 dark:text-indigo-400 break-all select-all">
                        {f.formula}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400">{f.description}</p>
                      <div className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-900/60 p-2 rounded-lg">
                        <strong>Example:</strong> {f.example}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
