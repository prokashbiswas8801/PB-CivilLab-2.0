import React, { useState, useMemo } from 'react';
import {
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
  Download,
  Info,
  Check,
  Printer,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { exportToCSV } from '../../../utils/exportEngine';

export type CadHubTab = 'viewport-scale' | 'shortcuts-lisp' | 'excel-formulas';

export interface CadShortcut {
  cmd: string;
  alias: string;
  category: 'System Variables' | 'Cleanup & Audit' | 'Drawing & Snaps' | 'Blocks & Xrefs' | 'Annotation';
  description: string;
  syntax: string;
  tips: string;
}

export interface LispRoutine {
  id: string;
  name: string;
  command: string;
  category: 'Measurement' | 'Annotation' | 'Data Export';
  description: string;
  instructions: string;
  code: string;
}

export interface ExcelFormulaItem {
  id: string;
  name: string;
  category: 'Rebar & BOQ' | 'Interpolation & Math' | 'Units & Text' | 'Lookup & Matrix';
  formula: string;
  syntax: string;
  description: string;
  example: string;
  copyFormula: string;
}

export interface CadExcelHubProps {
  initialTab?: 'viewport' | 'shortcuts' | 'excel' | 'viewport-scale' | 'shortcuts-lisp' | 'excel-formulas';
}

export const CadExcelHub: React.FC<CadExcelHubProps> = ({ initialTab = 'viewport-scale' }) => {
  const mapInitialTab = (tab: string): CadHubTab => {
    if (tab === 'shortcuts' || tab === 'shortcuts-lisp') return 'shortcuts-lisp';
    if (tab === 'excel' || tab === 'excel-formulas') return 'excel-formulas';
    return 'viewport-scale';
  };

  const [activeTab, setActiveTab] = useState<CadHubTab>(mapInitialTab(initialTab));

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLispCategory, setSelectedLispCategory] = useState<string>('all');
  const [selectedExcelCategory, setSelectedExcelCategory] = useState<string>('all');

  // Copy helper with feedback
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // =========================================================================
  // 1. AUTOCAD SCALE, VIEWPORT & TEXT HEIGHT CALCULATOR STATE
  // =========================================================================
  const [drawingUnit, setDrawingUnit] = useState<'mm' | 'm' | 'inch' | 'ft'>('mm');
  const [scaleRatio, setScaleRatio] = useState<number>(100); // 1:100 default
  const [paperTextMm, setPaperTextMm] = useState<number>(2.5); // 2.5mm standard
  const [paperTitleMm, setPaperTitleMm] = useState<number>(5.0); // 5.0mm titles
  const [customScaleInput, setCustomScaleInput] = useState<string>('1:100');

  // Standard Scales Table
  const METRIC_SCALES = [
    { label: '1:1', ratio: 1 },
    { label: '1:5', ratio: 5 },
    { label: '1:10', ratio: 10 },
    { label: '1:20', ratio: 20 },
    { label: '1:25', ratio: 25 },
    { label: '1:50', ratio: 50 },
    { label: '1:100', ratio: 100 },
    { label: '1:200', ratio: 200 },
    { label: '1:500', ratio: 500 },
    { label: '1:1000', ratio: 1000 },
  ];

  const IMPERIAL_SCALES = [
    { label: '1/8" = 1\'-0"', ratio: 96 },
    { label: '3/16" = 1\'-0"', ratio: 64 },
    { label: '1/4" = 1\'-0"', ratio: 48 },
    { label: '3/8" = 1\'-0"', ratio: 32 },
    { label: '1/2" = 1\'-0"', ratio: 24 },
    { label: '3/4" = 1\'-0"', ratio: 16 },
    { label: '1" = 1\'-0"', ratio: 12 },
    { label: '1-1/2" = 1\'-0"', ratio: 8 },
    { label: '3" = 1\'-0"', ratio: 4 },
  ];

  // Calculations for Scale & Viewport
  const scaleCalc = useMemo(() => {
    // Unit multiplier to convert model units to mm
    // When paper space layout is in mm:
    // If Model is mm: 1 model unit = 1 mm -> zoom xp = 1 / scale
    // If Model is m: 1 model unit = 1000 mm -> zoom xp = 1000 / scale
    // If Model is inch: 1 model unit = 25.4 mm -> zoom xp = 25.4 / scale (or 1 / scale if layout in inches)
    // If Model is ft: 1 model unit = 304.8 mm -> zoom xp = 304.8 / scale
    let unitToPaperFactor = 1.0;
    if (drawingUnit === 'm') unitToPaperFactor = 1000.0;
    else if (drawingUnit === 'inch') unitToPaperFactor = 25.4;
    else if (drawingUnit === 'ft') unitToPaperFactor = 304.8;

    const zoomFactorDecimal = unitToPaperFactor / scaleRatio;
    const zoomXpCommand =
      drawingUnit === 'm'
        ? `1000/${scaleRatio}xp`
        : drawingUnit === 'mm'
        ? `1/${scaleRatio}xp`
        : `${zoomFactorDecimal.toFixed(4)}xp`;

    // Model space text height needed to plot at desired paper height:
    // H_model = H_paper * (scale / unitToPaperFactor)
    const modelTextHeight = paperTextMm * (scaleRatio / unitToPaperFactor);
    const modelTitleHeight = paperTitleMm * (scaleRatio / unitToPaperFactor);

    // DIMSCALE: Overall dimension scale factor
    const dimScale = scaleRatio / (drawingUnit === 'm' ? 1000 : 1);

    // Linetype Scale (LTSCALE)
    const ltScale = drawingUnit === 'm' ? scaleRatio * 0.025 : scaleRatio * 0.5;

    return {
      zoomXpCommand,
      zoomFactorDecimal,
      modelTextHeight,
      modelTitleHeight,
      dimScale,
      ltScale,
    };
  }, [drawingUnit, scaleRatio, paperTextMm, paperTitleMm]);

  // Standard AIA / ISO Layer Names & Lineweights
  const AIA_ISO_LAYERS = [
    { name: 'S-COLS', color: 'Red (1)', lineweight: '0.50 mm', pen: 'Heavy', use: 'Columns, shear walls, structural cores' },
    { name: 'S-BEAM', color: 'Yellow (2)', lineweight: '0.35 mm', pen: 'Medium', use: 'Main & secondary structural beams' },
    { name: 'S-SLAB', color: 'Cyan (4)', lineweight: '0.25 mm', pen: 'Thin', use: 'Floor slab soffits, slab outline' },
    { name: 'S-REBAR-MAIN', color: 'Magenta (6)', lineweight: '0.60 mm', pen: 'Extra-Heavy', use: 'Main flexural rebars, column longitudinal bars' },
    { name: 'S-REBAR-TIE', color: 'Green (3)', lineweight: '0.35 mm', pen: 'Medium', use: 'Stirrups, column ties, spiral links' },
    { name: 'A-WALL-FULL', color: 'White (7)', lineweight: '0.35 mm', pen: 'Medium', use: 'Brickwork partition & perimeter walls' },
    { name: 'A-DOOR-WIND', color: 'Color 8 / Green', lineweight: '0.20 mm', pen: 'Thin', use: 'Doors, windows, louvers & glazing' },
    { name: 'G-ANNO-DIMS', color: 'Color 8 / Grey', lineweight: '0.15 mm', pen: 'Hairline', use: 'Dimension lines, ticks, extension lines' },
    { name: 'G-ANNO-TEXT', color: 'Yellow (2)', lineweight: '0.25 mm', pen: 'Thin', use: 'General annotations, schedules, room names' },
    { name: 'S-GRID-IDEN', color: 'Red (1) / DASHED', lineweight: '0.18 mm', pen: 'Hairline', use: 'Centerline structural grid axes & bubbles' },
    { name: 'A-FLOR-HATCH', color: 'Color 9 / Grey', lineweight: '0.13 mm', pen: 'Hairline', use: 'Floor tiles, concrete stipple, earth hatch' },
  ];

  // =========================================================================
  // 2. AUTOCAD SHORTCUTS & ONE-CLICK AUTOLISP SNIPPETS
  // =========================================================================
  const CAD_SHORTCUTS: CadShortcut[] = [
    {
      cmd: 'OVERKILL',
      alias: 'OVERKILL',
      category: 'Cleanup & Audit',
      syntax: 'OVERKILL',
      description: 'Removes duplicate or overlapping lines, arcs, and polylines, and merges collinear segments.',
      tips: 'Mandatory before running structural modeling, area takeoffs, or plotting.',
    },
    {
      cmd: 'PURGE',
      alias: 'PU / -PURGE',
      category: 'Cleanup & Audit',
      syntax: '-PURGE -> A -> * -> N',
      description: 'Purges unused block definitions, layers, linetypes, dimension styles, and zero-length geometries.',
      tips: 'Use -PURGE with RegApps option to drastically reduce DWG file size and prevent lag.',
    },
    {
      cmd: 'AUDIT',
      alias: 'AUDIT',
      category: 'Cleanup & Audit',
      syntax: 'AUDIT -> Y',
      description: 'Scans the drawing database for errors and fixes corrupted block headers and pointers.',
      tips: 'Always run AUDIT after importing external surveyor DWGs.',
    },
    {
      cmd: 'PSLTSCALE',
      alias: 'PSLTSCALE',
      category: 'System Variables',
      syntax: 'PSLTSCALE -> 1 -> REA',
      description: 'Controls paper space linetype scaling so dashed lines look identical across all viewports regardless of zoom factor.',
      tips: 'Set PSLTSCALE = 1, MSLTSCALE = 1, then regenerate with REGENALL (REA).',
    },
    {
      cmd: 'DIMASSOC',
      alias: 'DIMASSOC',
      category: 'System Variables',
      syntax: 'DIMASSOC -> 2',
      description: 'Controls dimension associativity. Value 2 creates associative dimensions that automatically stretch with geometry.',
      tips: 'Set to 2 so dimensions update automatically when wall lengths are stretched.',
    },
    {
      cmd: 'BURST',
      alias: 'BURST',
      category: 'Blocks & Xrefs',
      syntax: 'BURST',
      description: 'Explodes selected blocks while preserving attribute text values as regular text instead of tag strings.',
      tips: 'Critical for title blocks, column tags, and door schedules before converting to CAD lines.',
    },
    {
      cmd: 'FLATTEN',
      alias: 'FLATTEN',
      category: 'Drawing & Snaps',
      syntax: 'FLATTEN',
      description: 'Forces all 3D geometries, lines, and arcs to Elevation Z = 0 (2D plane).',
      tips: 'Resolves stubborn FILLET, TRIM, and HATCH non-coplanar errors.',
    },
    {
      cmd: 'WBLOCK',
      alias: 'W',
      category: 'Blocks & Xrefs',
      syntax: 'WBLOCK',
      description: 'Exports selected objects into a brand-new clean DWG file stripped of bloat and corrupt dictionary tables.',
      tips: 'Best method to fix stubborn bloated drawings: WBLOCK clean model geometry.',
    },
    {
      cmd: 'XREF',
      alias: 'XR',
      category: 'Blocks & Xrefs',
      syntax: 'XREF',
      description: 'Manages External Reference DWGs (Architectural background, Structural key plan, MEP layout).',
      tips: 'Use Overlay instead of Attach to prevent circular nesting xref loops.',
    },
    {
      cmd: 'CHSPACE',
      alias: 'CHSPACE',
      category: 'Drawing & Snaps',
      syntax: 'CHSPACE',
      description: 'Transfers objects between Model Space and Paper Space viewport while maintaining exact visual scale.',
      tips: 'Allows moving notes, revision clouds, or detail tags into paper space seamlessly.',
    },
    {
      cmd: 'QSELECT',
      alias: 'QSE',
      category: 'Drawing & Snaps',
      syntax: 'QSELECT',
      description: 'Quickly creates a selection set based on filtering criteria (e.g., all 16mm rebar text, or all red lines).',
      tips: 'Ideal for isolating all footing text or all hatched boundary regions.',
    },
    {
      cmd: 'PEDIT JOIN',
      alias: 'PE -> M -> J',
      category: 'Drawing & Snaps',
      syntax: 'PEDIT -> M -> (select) -> Y -> J -> 0.0',
      description: 'Converts individual line segments into single continuous closed polylines for AREA calculations.',
      tips: 'Tolerance 0.0 joins contiguous lines; essential for floor area takeoff.',
    },
  ];

  // AutoLISP Routines
  const LISP_ROUTINES: LispRoutine[] = [
    {
      id: 'lisp-tlen',
      name: 'TLEN — Total Cumulative Length of Polylines & Lines',
      command: 'TLEN',
      category: 'Measurement',
      description: 'Calculates and sums the total length of all selected lines, polylines, splines, and arcs. Indispensable for rebar cutting, pipe runs, and perimeter takeoffs.',
      instructions: '1. In AutoCAD, type APPLOAD and load this .lsp file.\n2. Type TLEN and select lines/polylines.\n3. Total sum displays in command window.',
      code: `(defun c:TLEN (/ ss tot len i ent)
  (vl-load-com)
  (setq tot 0.0)
  (prompt "\\n[PB CivilLab] Select Lines, Polylines, Arcs for Cumulative Length: ")
  (if (setq ss (ssget '((0 . "LINE,LWPOLYLINE,POLYLINE,ARC,SPLINE"))))
    (progn
      (repeat (setq i (sslength ss))
        (setq ent (vlax-ename->vla-object (ssname ss (setq i (1- i)))))
        (setq len (vlax-curve-getDistAtParam ent (vlax-curve-getEndParam ent)))
        (setq tot (+ tot len))
      )
      (alert (strcat "PB CivilLab Quantity Takeoff:\\n---------------------------------\\nTotal Cumulative Length = " 
                     (rtos tot 2 3) " Drawing Units\\nEquivalent Meters (if mm): " 
                     (rtos (/ tot 1000.0) 2 3) " m"))
      (princ (strcat "\\n>> Total Length = " (rtos tot 2 3) " units."))
    )
    (prompt "\\nNo valid curves selected.")
  )
  (princ)
)`,
    },
    {
      id: 'lisp-autogrid',
      name: 'AUTOGRID — Auto-Number Structural Grid Bubbles',
      command: 'AUTOGRID',
      category: 'Annotation',
      description: 'Click anywhere to automatically place a circular grid bubble with auto-incrementing letters (A, B, C...) or numbers (1, 2, 3...).',
      instructions: '1. Load with APPLOAD.\n2. Type AUTOGRID.\n3. Choose mode (Alpha/Numeric), starting index, and click insertion points.',
      code: `(defun c:AUTOGRID (/ pt tag r pref)
  (setq pref (getstring "\\nGrid Prefix or Starting character [A, B, C... or 1, 2, 3...]: "))
  (if (= pref "") (setq pref "1"))
  (setq r (getdist "\\nGrid Bubble Radius <300>: "))
  (if (null r) (setq r 300.0))
  (while (setq pt (getpoint "\\nPick grid intersection point: "))
    (command "_CIRCLE" pt r)
    (command "_TEXT" "_MC" pt (* r 0.8) 0 pref)
    (if (numberp (read pref))
      (setq pref (itoa (1+ (atoi pref))))
      (setq pref (chr (1+ (ascii pref))))
    )
  )
  (princ)
)`,
    },
    {
      id: 'lisp-exportxyz',
      name: 'EXPORTXYZ — Export Polyline Vertices / Survey Points to CSV',
      command: 'EXPORTXYZ',
      category: 'Data Export',
      description: 'Extracts coordinates (X, Y, Z / Easting, Northing, RL) of selected points or polyline vertices and exports directly to a formatted CSV spreadsheet.',
      instructions: '1. Load with APPLOAD.\n2. Type EXPORTXYZ.\n3. Select polyline boundary or point markers.\n4. CSV file will be written to C:\\CivilLab_Coordinates.csv.',
      code: `(defun c:EXPORTXYZ (/ ss fn file i ent obj pts pt j)
  (vl-load-com)
  (setq fn "C:\\\\CivilLab_Coordinates.csv")
  (if (setq ss (ssget '((0 . "POINT,LWPOLYLINE"))))
    (progn
      (setq file (open fn "w"))
      (write-line "Point_No,Easting_X,Northing_Y,Elevation_Z" file)
      (setq j 1)
      (repeat (setq i (sslength ss))
        (setq ent (ssname ss (setq i (1- i))))
        (setq obj (vlax-ename->vla-object ent))
        (if (= (vla-get-ObjectName obj) "AcDbPoint")
          (progn
            (setq pt (vlax-safearray->list (vlax-variant-value (vla-get-Coordinates obj))))
            (write-line (strcat (itoa j) "," (rtos (car pt) 2 4) "," (rtos (cadr pt) 2 4) "," (rtos (caddr pt) 2 4)) file)
            (setq j (1+ j))
          )
        )
      )
      (close file)
      (alert (strcat "Coordinates successfully exported to:\\n" fn))
    )
  )
  (princ)
)`,
    },
  ];

  // =========================================================================
  // 3. EXCEL FOR ENGINEERS FORMULA LIBRARY
  // =========================================================================
  const EXCEL_FORMULAS: ExcelFormulaItem[] = [
    {
      id: 'ex-rebar-sumifs',
      name: 'Rebar Tonnage by Diameter via SUMIFS',
      category: 'Rebar & BOQ',
      formula: '=SUMIFS(Table_BBS[Weight_kg], Table_BBS[Dia_mm], 16) / 1000',
      syntax: '=SUMIFS(sum_range, criteria_range1, criteria1) / 1000',
      description: 'Sums the total bar cutting weight in Metric Tons (MT) for a specific diameter (e.g. 16mm) from a dynamic BBS table.',
      example: 'Table with columns [Dia_mm] and [Weight_kg]. Gives total MT of 16mm steel on the job.',
      copyFormula: '=SUMIFS(Table_BBS[Weight_kg], Table_BBS[Dia_mm], 16) / 1000',
    },
    {
      id: 'ex-interpolation',
      name: 'Linear Interpolation for Code Design Tables',
      category: 'Interpolation & Math',
      formula: '=FORECAST(X_target, OFFSET(Y_range, MATCH(X_target, X_range, 1)-1, 0, 2), OFFSET(X_range, MATCH(X_target, X_range, 1)-1, 0, 2))',
      syntax: '=FORECAST(x, known_y\'s, known_x\'s)',
      description: 'Accurately interpolates bearing capacity factors (Nc, Nq, Ngamma) or moment coefficients from building code tables without manual calculation.',
      example: 'Interpolating friction angle phi = 33.5° between 30° and 35° values in Table A4.',
      copyFormula: '=FORECAST(D5, OFFSET($C$2:$C$20, MATCH(D5, $B$2:$B$20, 1)-1, 0, 2), OFFSET($B$2:$B$20, MATCH(D5, $B$2:$B$20, 1)-1, 0, 2))',
    },
    {
      id: 'ex-feet-inch-parser',
      name: 'Feet-Inch Text String to Decimal Meters Parser',
      category: 'Units & Text',
      formula: '=(LEFT(A2, FIND("\'", A2)-1)*12 + MID(A2, FIND("\'", A2)+2, FIND("""", A2)-FIND("\'", A2)-2)) * 0.0254',
      syntax: '=(Feet*12 + Inches) * 0.0254',
      description: 'Parses architectural strings like 15\'-6" and converts them automatically to decimal meters (4.724m).',
      example: 'Converts "24\'-8"" in cell A2 into 7.5184 meters.',
      copyFormula: '=(LEFT(A2, FIND("\'", A2)-1)*12 + MID(A2, FIND("\'", A2)+2, FIND("""", A2)-FIND("\'", A2)-2)) * 0.0254',
    },
    {
      id: 'ex-boq-rounding',
      name: 'Commercial Bag Rounding & Wastage via CEILING',
      category: 'Rebar & BOQ',
      formula: '=CEILING.MATH((Volume_m3 * 1.54 * (1/5.5) * 1440 / 50) * 1.05, 1)',
      syntax: '=CEILING.MATH(number, [significance])',
      description: 'Calculates rounded-up procurement cement bags for 1:1.5:3 concrete with 1.54 dry factor and 5% handling wastage.',
      example: 'For 12.5 m³: =CEILING.MATH((12.5*1.54*(1/5.5)*1440/50)*1.05, 1) -> 106 Bags',
      copyFormula: '=CEILING.MATH((Volume_m3 * 1.54 * (1/5.5) * 1440 / 50) * 1.05, 1)',
    },
    {
      id: 'ex-convert-units',
      name: 'Engineering Unit Conversion using CONVERT',
      category: 'Units & Text',
      formula: '=CONVERT(CellVal, "lbf", "N") / 1000',
      syntax: '=CONVERT(number, from_unit, to_unit)',
      description: 'Converts force from Imperial kips/lbf to SI kiloNewtons (kN) natively in Excel without external add-ins.',
      example: '=CONVERT(100, "lbf", "N")/1000 -> 0.4448 kN',
      copyFormula: '=CONVERT(A2, "lbf", "N") / 1000',
    },
    {
      id: 'ex-matrix-lookup',
      name: 'Dynamic 2-Way Rate Lookup (INDEX-MATCH-MATCH)',
      category: 'Lookup & Matrix',
      formula: '=INDEX(RateMatrix, MATCH(WorkItem, ItemList, 0), MATCH(ProjectCity, CityHeaders, 0))',
      syntax: '=INDEX(array, row_num, column_num)',
      description: 'Fetches labor and material composite unit rates based simultaneously on work item code and regional city schedule.',
      example: 'Lookup "RCC_1_1.5_3" in row and "Dhaka" or "Chittagong" in column.',
      copyFormula: '=INDEX(Rates!$C$4:$H$150, MATCH(B5, Rates!$A$4:$A$150, 0), MATCH($D$2, Rates!$C$3:$H$3, 0))',
    },
  ];

  // Filtering
  const filteredShortcuts = useMemo(() => {
    return CAD_SHORTCUTS.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchText =
        s.cmd.toLowerCase().includes(q) ||
        s.alias.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      const matchCat = selectedLispCategory === 'all' || s.category === selectedLispCategory;
      return matchText && matchCat;
    });
  }, [searchQuery, selectedLispCategory]);

  const filteredFormulas = useMemo(() => {
    return EXCEL_FORMULAS.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchText =
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.syntax.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q);
      const matchCat = selectedExcelCategory === 'all' || f.category === selectedExcelCategory;
      return matchText && matchCat;
    });
  }, [searchQuery, selectedExcelCategory]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
                Productivity &amp; Standards Hub
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                AutoCAD &amp; Excel Engineering Hub
              </h2>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
              Viewport Scales &amp; Zoom XP · AutoLISP Snippets · Standard AIA Layers · Civil Excel Formula Library
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>One-Click Copy Ready</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto">
          {[
            { id: 'viewport-scale', label: '1. Viewport Scales, Text & AIA Layers', icon: Laptop },
            { id: 'shortcuts-lisp', label: '2. AutoCAD Shortcuts & AutoLISP Hub', icon: Terminal },
            { id: 'excel-formulas', label: '3. Civil Engineering Excel Formula Library', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as CadHubTab)}
                className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          TAB 1: AUTOCAD SCALE, VIEWPORT & TEXT HEIGHT CALCULATOR
          ===================================================================== */}
      {activeTab === 'viewport-scale' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>Drawing &amp; Viewport Parameters</span>
              </h3>

              {/* Drawing Unit */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Model Space Drawing Unit
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'mm', label: 'Millimeters (mm)' },
                    { id: 'm', label: 'Meters (m)' },
                    { id: 'inch', label: 'Inches (")' },
                    { id: 'ft', label: 'Feet (\')' },
                  ].map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setDrawingUnit(u.id as any)}
                      className={`py-1.5 text-xs font-semibold rounded-lg text-center transition-all ${
                        drawingUnit === u.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {u.id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Plot Scale */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-[var(--md-sys-color-on-surface)]">
                    Target Plot Scale
                  </label>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    1:{scaleRatio}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {METRIC_SCALES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setScaleRatio(s.ratio)}
                      className={`py-1.5 text-xs font-mono font-medium rounded-lg border transition-all ${
                        scaleRatio === s.ratio
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Imperial Presets (if inch/ft or for comparison) */}
              <div className="space-y-1 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Imperial Architectural Presets:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {IMPERIAL_SCALES.slice(0, 6).map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setScaleRatio(s.ratio)}
                      className={`py-1 px-1 text-[11px] font-mono rounded border transition-colors ${
                        scaleRatio === s.ratio
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plotted Text Height on Paper */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Notes / Dim Text on Paper (mm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={paperTextMm}
                    onChange={(e) => setPaperTextMm(Math.max(1.0, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-[10px] text-slate-500">ISO standard: 2.5 mm</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Titles Text on Paper (mm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={paperTitleMm}
                    onChange={(e) => setPaperTitleMm(Math.max(2.0, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-[10px] text-slate-500">Major headings: 5.0 mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Command Strip */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-indigo-700 dark:text-indigo-400 font-bold uppercase">
                    AutoCAD Viewport ZOOM Command
                  </span>
                  <div className="text-2xl font-black font-mono text-indigo-900 dark:text-indigo-100 mt-0.5 flex items-center gap-2">
                    <span>{scaleCalc.zoomXpCommand}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`Z\n${scaleCalc.zoomXpCommand}`, 'cmd-zoom')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedId === 'cmd-zoom' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'cmd-zoom' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-right font-mono text-xs text-slate-500">
                  <div>Custom Scale Value:</div>
                  <strong className="text-sm text-[var(--md-sys-color-on-surface)]">
                    {scaleCalc.zoomFactorDecimal.toFixed(6)}
                  </strong>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-[var(--md-sys-color-surface)] p-2.5 rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                <code>Command sequence: <strong>Z</strong> [Enter] → <strong>{scaleCalc.zoomXpCommand}</strong> [Enter]</code>
              </div>
            </div>

            {/* Calculated Values Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block">Model Text Height</span>
                <div className="text-lg font-bold font-mono text-[var(--md-sys-color-on-surface)]">
                  {scaleCalc.modelTextHeight.toFixed(2)} {drawingUnit}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(scaleCalc.modelTextHeight.toFixed(2), 'txt-h')}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  {copiedId === 'txt-h' ? 'Copied!' : 'Copy Height'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block">DIMSCALE</span>
                <div className="text-lg font-bold font-mono text-[var(--md-sys-color-on-surface)]">
                  {scaleCalc.dimScale.toFixed(1)}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`DIMSCALE\n${scaleCalc.dimScale}`, 'dim-scale')}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  {copiedId === 'dim-scale' ? 'Copied!' : 'Copy Command'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block">Model Title Height</span>
                <div className="text-lg font-bold font-mono text-[var(--md-sys-color-on-surface)]">
                  {scaleCalc.modelTitleHeight.toFixed(2)} {drawingUnit}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(scaleCalc.modelTitleHeight.toFixed(2), 'txt-title')}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  {copiedId === 'txt-title' ? 'Copied!' : 'Copy Height'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block">LTSCALE</span>
                <div className="text-lg font-bold font-mono text-[var(--md-sys-color-on-surface)]">
                  {scaleCalc.ltScale.toFixed(1)}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`LTSCALE\n${scaleCalc.ltScale}\nPSLTSCALE\n1`, 'lt-scale')}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  {copiedId === 'lt-scale' ? 'Copied!' : 'Copy LTSCALE'}
                </button>
              </div>
            </div>

            {/* AIA / ISO Standard Layer Name & Plot Lineweight Reference Table */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Standard AIA / ISO Layer Names &amp; Plot Lineweights (0.13mm - 0.60mm)</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-500">ISO 128 / AIA CAD Standard</span>
              </div>

              <div className="overflow-x-auto max-h-64 custom-scrollbar">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5">Layer Name</th>
                      <th className="py-2 px-2">Lineweight</th>
                      <th className="py-2 px-2">Color</th>
                      <th className="py-2 px-2">Purpose / Element</th>
                      <th className="py-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                    {AIA_ISO_LAYERS.map((layer) => (
                      <tr key={layer.name} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                        <td className="py-2 px-2.5 font-bold text-[var(--md-sys-color-primary)]">{layer.name}</td>
                        <td className="py-2 px-2 font-bold text-amber-600">{layer.lineweight}</td>
                        <td className="py-2 px-2 text-slate-500">{layer.color}</td>
                        <td className="py-2 px-2 text-slate-600 dark:text-slate-400 font-sans text-[11px]">{layer.use}</td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopy(`-LAYER M ${layer.name} C ${layer.color.split(' ')[0]} ${layer.name} LW ${layer.lineweight.split(' ')[0]} ${layer.name} `, `layer-${layer.name}`)}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-indigo-500/10 hover:text-indigo-600 inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedId === `layer-${layer.name}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === `layer-${layer.name}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: AUTOCAD SHORTCUTS & ONE-CLICK AUTOLISP SNIPPETS
          ===================================================================== */}
      {activeTab === 'shortcuts-lisp' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AutoCAD commands, system variables, or AutoLISP functions (e.g., OVERKILL, TLEN, PSLTSCALE)..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
              />
            </div>
          </div>

          {/* Section A: Essential Civil/Architectural AutoCAD Commands */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-500" />
                  <span>Essential Civil &amp; Architectural AutoCAD Commands ({filteredShortcuts.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500">One-click copyable syntax and best practice jobsite tips</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredShortcuts.map((sc) => (
                <div
                  key={sc.cmd}
                  className="p-3.5 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {sc.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(sc.syntax, `cmd-${sc.cmd}`)}
                        className="p-1 rounded hover:bg-[var(--md-sys-color-surface)] text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                        title="Copy command syntax"
                      >
                        {copiedId === `cmd-${sc.cmd}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === `cmd-${sc.cmd}` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                        {sc.cmd}
                      </strong>
                      <span className="text-xs font-mono text-slate-400">({sc.alias})</span>
                    </div>

                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-snug">
                      {sc.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/60 text-[11px] text-amber-600 dark:text-amber-400 font-sans">
                    💡 <strong>Tip:</strong> {sc.tips}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Ready-to-Copy AutoLISP (.lsp) Snippets */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Code className="w-4 h-4" />
                  <span>Ready-to-Use AutoLISP (.lsp) Civil Engineering Routines</span>
                </h3>
                <span className="text-[10px] text-slate-500">Paste directly into AutoCAD command line or save as .lsp and APPLOAD</span>
              </div>
            </div>

            <div className="space-y-4">
              {LISP_ROUTINES.map((lisp) => (
                <div
                  key={lisp.id}
                  className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Command: {lisp.command}
                        </span>
                        <strong className="text-sm text-[var(--md-sys-color-on-surface)]">
                          {lisp.name}
                        </strong>
                      </div>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                        {lisp.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(lisp.code, `lisp-${lisp.id}`)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        {copiedId === `lisp-${lisp.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === `lisp-${lisp.id}` ? 'Copied LISP!' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Code Block Container */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-emerald-400 overflow-x-auto max-h-48 custom-scrollbar">
                    <pre>{lisp.code}</pre>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 bg-[var(--md-sys-color-surface)] p-2 rounded-lg border border-[var(--md-sys-color-outline-variant)]">
                    {lisp.instructions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: EXCEL FOR ENGINEERS FORMULA LIBRARY
          ===================================================================== */}
      {activeTab === 'excel-formulas' && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Excel formulas (e.g. SUMIFS, FORECAST, CONVERT, CEILING)..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {['all', 'Rebar & BOQ', 'Interpolation & Math', 'Units & Text', 'Lookup & Matrix'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedExcelCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedExcelCategory === cat
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  {cat === 'all' ? 'All Formulas' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Formula Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFormulas.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.copyFormula, item.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === item.id ? 'Copied Formula!' : 'Copy Formula'}</span>
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    {item.name}
                  </h4>

                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    {item.description}
                  </p>

                  {/* Formula Code Box */}
                  <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-2.5 font-mono text-xs text-emerald-700 dark:text-emerald-300 select-all overflow-x-auto">
                    <code>{item.formula}</code>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] text-[11px] text-slate-500 font-mono">
                  Example: {item.example}
                </div>
              </div>
            ))}
          </div>

          {/* Engineering Sheet Page Setup & Print Checklist */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-emerald-500" />
              <span>A4 Portrait Engineering Sheet Best Practice &amp; Page Setup Checklist</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] space-y-1">
                <strong className="text-[var(--md-sys-color-on-surface)] block">1. Repeat Top Title Rows</strong>
                <p className="text-slate-500 text-[11px]">
                  Go to <em>Page Layout → Print Titles → Rows to repeat at top:</em> <code>$1:$4</code> so headers appear on every printed sheet.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] space-y-1">
                <strong className="text-[var(--md-sys-color-on-surface)] block">2. Lock Formulas &amp; Unlock Inputs</strong>
                <p className="text-slate-500 text-[11px]">
                  Select user input cells → Format Cells → uncheck "Locked". Protect Sheet with password to prevent accidental formula corruption.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] space-y-1">
                <strong className="text-[var(--md-sys-color-on-surface)] block">3. Dynamic Excel Tables</strong>
                <p className="text-slate-500 text-[11px]">
                  Format takeoffs as an official Excel Table (<code>Ctrl+T</code>) so formulas automatically propagate down as rows are added.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
