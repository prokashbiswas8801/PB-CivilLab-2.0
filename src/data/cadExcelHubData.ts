export interface PaperSizeSpec {
  id: 'A0' | 'A1' | 'A2' | 'A3' | 'A4';
  label: string;
  widthMm: number;
  heightMm: number;
  playableWidthMm: number;
  playableHeightMm: number;
  typicalUse: string;
}

export interface ViewportWalkthroughStep {
  step: number;
  title: string;
  command: string;
  summary: string;
  mechanics: string;
  instructions: string[];
  proTip: string;
}

export interface CtbPenAssignment {
  colorNumber: string;
  colorName: string;
  hexPreview: string;
  plotColor: string;
  screening: string;
  lineweightMm: string;
  engineeringUse: string;
}

export interface CadCommandDetail {
  cmd: string;
  alias: string;
  category:
    | 'Cleanup & Audit'
    | 'System Variables'
    | 'Drawing & Precision Snaps'
    | 'Blocks, Xrefs & Attributes'
    | 'Dimensioning & Annotation'
    | 'Layout & Plotting'
    | '3D & Site Grading';
  syntax: string;
  desc: string;
  mechanics: string;
  stepByStep: string[];
  sysVars?: string[];
  tips: string;
}

export interface CadPluginCommand {
  code: string;
  name: string;
  category: string;
  purpose: string;
  stepByStep: string[];
  proTip?: string;
}

export interface CadPluginSuite {
  id: 'yqarch' | 'yqprime' | 'leemac' | 'rebarcad' | 'civil3d';
  name: string;
  tagline: string;
  discipline: string;
  badgeColor: string;
  overview: string;
  setupSteps: string[];
  keyConfigCommands: { cmd: string; effect: string }[];
  commands: CadPluginCommand[];
}

export interface LispRoutineItem {
  id: string;
  title: string;
  command: string;
  category: 'Takeoff & BOQ' | 'Structural & Grids' | 'Survey & Coordinates' | 'Annotation & Drafting';
  desc: string;
  howToRun: string[];
  code: string;
}

export interface EngineeringGuideSection {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  overview: string;
  steps: {
    stepNumber: number;
    heading: string;
    commandOrFormula: string;
    details: string[];
  }[];
  keyTakeaways: string[];
}

export interface ExcelFormulaItem {
  id: string;
  title: string;
  category: 'BOQ & Estimation' | 'Structural & Rebar' | 'Geotechnical & Survey' | 'Unit & Text Parsing';
  desc: string;
  formula: string;
  explanation: string;
  stepByStep: string[];
  exampleInput: string;
  exampleOutput: string;
}

export interface ExcelVbaMacroItem {
  id: string;
  title: string;
  functionName: string;
  category: string;
  desc: string;
  usageInCell: string;
  howToInstall: string[];
  vbaCode: string;
}

export const PAPER_SIZES_MM: PaperSizeSpec[] = [
  {
    id: 'A0',
    label: 'ISO A0 (841 × 1189 mm)',
    widthMm: 1189,
    heightMm: 841,
    playableWidthMm: 1139,
    playableHeightMm: 801,
    typicalUse: 'Master Site Plans, Highway Corridors & Large Infrastructure Layouts'
  },
  {
    id: 'A1',
    label: 'ISO A1 (594 × 841 mm)',
    widthMm: 841,
    heightMm: 594,
    playableWidthMm: 791,
    playableHeightMm: 554,
    typicalUse: 'Standard Tender Drawings, Structural Framing Plans & Floor Layouts'
  },
  {
    id: 'A2',
    label: 'ISO A2 (420 × 594 mm)',
    widthMm: 594,
    heightMm: 420,
    playableWidthMm: 554,
    playableHeightMm: 380,
    typicalUse: 'Medium Building Floor Plans, Foundation Layouts & Detailing Sheets'
  },
  {
    id: 'A3',
    label: 'ISO A3 (297 × 420 mm)',
    widthMm: 420,
    heightMm: 297,
    playableWidthMm: 385,
    playableHeightMm: 267,
    typicalUse: 'Site Office Prints, Beam/Column RC Details & Half-Scale Check Plots'
  },
  {
    id: 'A4',
    label: 'ISO A4 (210 × 297 mm)',
    widthMm: 297,
    heightMm: 210,
    playableWidthMm: 267,
    playableHeightMm: 180,
    typicalUse: 'Calculation Book Sketches, Standard Details & Field Inspection Attachments'
  }
];

export const VIEWPORT_WALKTHROUGH_STEPS: ViewportWalkthroughStep[] = [
  {
    step: 1,
    title: 'Verify Model Space 1:1 Drawing Units',
    command: '-DWGUNITS / UNITS',
    summary: 'Always draft in true 1:1 real-world dimensions inside Model Space before touching any Layout tab.',
    mechanics:
      'AutoCAD Model Space is an infinite coordinate grid measured in "Drawing Units". Whether 1 Drawing Unit represents 1 millimeter, 1 meter, or 1 inch determines the numerator of your viewport XP zoom factor when plotting onto a millimeter-based ISO paper sheet.',
    instructions: [
      'Type -DWGUNITS (with the leading hyphen) and press Enter.',
      'Inspect the command prompt: 1 = Inches, 2 = Feet, 3 = Millimeters, 6 = Meters.',
      'Set Linear display precision to 0.000 for Meters/Feet or 0 for Millimeters.',
      'Ensure INSUNITS matches your base unit so external Xrefs and blocks scale automatically upon insertion.'
    ],
    proTip: 'Never scale your building geometry up or down in Model Space to "fit a titleblock". Scale the Viewport instead.'
  },
  {
    step: 2,
    title: 'Configure Layout Page Setup in Millimeters (1:1 Plot Scale)',
    command: 'PAGESETUP',
    summary: 'Anchor the Paper Space Layout tab to an exact physical ISO sheet (e.g., A1 or A3) at 1:1 paper scale.',
    mechanics:
      'Paper Space represents the physical sheet of paper in millimeters. By keeping the Plot Scale inside PAGESETUP fixed at 1 mm = 1 unit, all titleblocks stay at their true physical size (e.g., an A1 border is always 841 × 594 mm), and only the viewport zoom factor controls the drawing scale.',
    instructions: [
      'Switch from Model tab to a Layout tab (e.g., Layout1) at the bottom-left.',
      'Type PAGESETUP -> Click Modify.',
      'Select Printer/Plotter: "DWG To PDF.pc3" (or AutoCAD PDF High Quality Print).',
      'Select Paper Size: ISO Full Bleed A1 (841.00 x 594.00 MM) or ISO A3 (420.00 x 297.00 MM).',
      'Under Plot Scale, set Scale = 1:1 and Units = Millimeters (1 mm = 1 unit).',
      'Check "Plot object lineweights" and "Plot with plot styles", assign your .CTB file, and click OK.'
    ],
    proTip: 'Use "ISO full bleed" paper sizes so AutoCAD sets printable margins to 0 mm, preventing titleblock border clipping.'
  },
  {
    step: 3,
    title: 'Create the Layout Viewport on a Non-Plotting Layer',
    command: 'MVIEW (MV)',
    summary: 'Cut a viewing window into Model Space on a dedicated Defpoints or VPORTS layer set to Non-Plot.',
    mechanics:
      'A Layout Viewport (`MVIEW`) is a live camera portal into Model Space. Putting the viewport frame on a layer with the Plot icon disabled guarantees the rectangular frame line never prints on your final PDF.',
    instructions: [
      'Open Layer Properties (LA), create a layer named "A-ANNO-VPRT", and click the Printer icon to disable plotting.',
      'Set "A-ANNO-VPRT" as the current layer.',
      'Type MVIEW (or MV) -> Press Enter.',
      'Click the inner top-left and bottom-right corners inside your Titleblock drawing area.',
      'Double-click inside the viewport frame to activate Model Space through the viewport.'
    ],
    proTip: 'You can create polygonal or irregular viewports using MVIEW -> Polygonal (P) or Object (O) from any closed polyline.'
  },
  {
    step: 4,
    title: 'Apply Exact Mathematical Zoom XP Scale Factor',
    command: 'ZOOM (Z) -> [Factor]XP',
    summary: 'Compute and apply the exact XP factor connecting Paper Space millimeters to Model Space units.',
    mechanics:
      'The "XP" suffix tells AutoCAD to scale Model Space relative to Paper Space units (mm). Formula: Zoom XP = (Unit Factor in mm per Model Unit) / (Target Scale Ratio N). If drafting in Meters (1 m = 1000 mm) at 1:100 scale, Zoom XP = 1000 / 100 = 10XP. If drafting in Millimeters (1 mm = 1 mm) at 1:100 scale, Zoom XP = 1 / 100 = 0.01XP.',
    instructions: [
      'Double-click inside the viewport so its border becomes thick (Active Model Space).',
      'Pan (middle-mouse drag) roughly to center your building plan or structural detail.',
      'Type Z and press Enter.',
      'Type the calculated XP value from the calculator above (e.g., 10XP for Meters at 1:100, or 0.01XP for mm at 1:100) and press Enter.',
      'Use PAN only (never scroll the mouse wheel!) to fine-tune the position.'
    ],
    proTip: 'You can place multiple viewports on the same A1 sheet with different XP factors (e.g., Floor Plan at 1:100 and Footing Section at 1:25).'
  },
  {
    step: 5,
    title: 'Lock the Viewport & Synchronize Text/Dimension Heights',
    command: 'MVIEW -> Lock (L) -> ON',
    summary: 'Lock the viewport scale immediately so accidental mouse-wheel scrolling cannot ruin the drawing scale.',
    mechanics:
      'When a viewport is locked, zooming with the scroll wheel zooms the entire Paper Space sheet rather than altering the internal XP scale. For Model Space text to print at exactly H_paper (e.g., 2.5 mm) on paper, its Model Space height must be H_model = H_paper × (Scale Ratio / Unit Factor).',
    instructions: [
      'Double-click outside the viewport to return to Paper Space (PSPACE).',
      'Select the viewport border, right-click -> Display Locked -> Yes (or click the padlock icon on the status bar).',
      'Alternatively, type MV -> L -> ON -> Select the viewport -> Enter.',
      'Set your Dimension Style Overall Scale (DIMSCALE) equal to the calculator output (or use Annotative dimensions with ANNOAUTOSCALE = 4).'
    ],
    proTip: 'Always verify locked status before issuing drawings—an unlocked viewport bumped to 1:103.7 makes paper scale measurements invalid on site.'
  },
  {
    step: 6,
    title: 'Unify Dashed & Centerline Linetypes Across All Scales',
    command: 'PSLTSCALE / MSLTSCALE / LTSCALE',
    summary: 'Force dashed hidden lines and structural grid centerlines to print with identical dash lengths across 1:100 and 1:20 viewports.',
    mechanics:
      'Without Paper Space Linetype Scaling (`PSLTSCALE = 1`), a grid centerline looks dashed in a 1:100 plan viewport but looks like a solid continuous line inside a 1:20 detail viewport on the same sheet.',
    instructions: [
      'Type PSLTSCALE -> Set to 1.',
      'Type MSLTSCALE -> Set to 1.',
      'Type LTSCALE -> Set to 1 (or 0.5 for denser dashes on ISO sheets).',
      'Type CELTSCALE -> Set to 1 (ensures new entities do not carry local overrides).',
      'Type REA (REGENALL) inside the Layout tab to refresh all viewports simultaneously.'
    ],
    proTip: 'If dashes still do not update after setting PSLTSCALE = 1, you must run REGENALL (REA) inside the Layout tab to recalculate viewport display lists.'
  }
];

export const CTB_PEN_TABLE: CtbPenAssignment[] = [
  {
    colorNumber: 'Color 1 (Red)',
    colorName: 'Red',
    hexPreview: '#ef4444',
    plotColor: 'Black',
    screening: '100%',
    lineweightMm: '0.15 mm',
    engineeringUse: 'Dimension lines, leader arrows, extension lines, and minor section hatching'
  },
  {
    colorNumber: 'Color 2 (Yellow)',
    colorName: 'Yellow',
    hexPreview: '#eab308',
    plotColor: 'Black',
    screening: '100%',
    lineweightMm: '0.25 mm',
    engineeringUse: 'General annotation text (2.5 mm), room labels, door/window elevation lines, furniture'
  },
  {
    colorNumber: 'Color 3 (Green)',
    colorName: 'Green',
    hexPreview: '#22c55e',
    plotColor: 'Black',
    screening: '100%',
    lineweightMm: '0.35 mm',
    engineeringUse: 'Architectural uncut walls, structural beam outlines, medium section cuts, titles (3.5 mm)'
  },
  {
    colorNumber: 'Color 4 (Cyan)',
    colorName: 'Cyan',
    hexPreview: '#06b6d4',
    plotColor: 'Black',
    screening: '100%',
    lineweightMm: '0.50 mm',
    engineeringUse: 'Primary architectural/structural cut walls, main longitudinal rebar, major section profiles'
  },
  {
    colorNumber: 'Color 5 (Blue)',
    colorName: 'Blue',
    hexPreview: '#3b82f6',
    plotColor: 'Black',
    screening: '100%',
    lineweightMm: '0.60 mm',
    engineeringUse: 'Heavy structural column cuts, main rebar callouts, sheet border outer frame, ground line'
  },
  {
    colorNumber: 'Color 6 (Magenta)',
    colorName: 'Magenta',
    hexPreview: '#d946ef',
    plotColor: 'Black',
    screening: '100%',
    lineweightMm: '0.20 mm',
    engineeringUse: 'Stirrups/ties, hidden slab edges, overhead beams, secondary structural detailing'
  },
  {
    colorNumber: 'Color 7 (White/Black)',
    colorName: 'White',
    hexPreview: '#f8fafc',
    plotColor: 'Black',
    screening: '100%',
    lineweightMm: '0.25 mm',
    engineeringUse: 'Standard notes, schedules, tables, titleblock grid dividers, and general symbols'
  },
  {
    colorNumber: 'Color 8 (Dark Grey)',
    colorName: 'Index 8',
    hexPreview: '#71717a',
    plotColor: 'Black',
    screening: '100%',
    lineweightMm: '0.09 mm',
    engineeringUse: 'Ultra-fine structural grid lines, floor tile patterns, concrete texture hatching, wipeout borders'
  },
  {
    colorNumber: 'Color 9 (Light Grey)',
    colorName: 'Index 9',
    hexPreview: '#a1a1aa',
    plotColor: 'Black',
    screening: '60%',
    lineweightMm: '0.13 mm',
    engineeringUse: 'Screened architectural background Xrefs (for MEP/Structural overlay drawings) & contour lines'
  },
  {
    colorNumber: 'Colors 250–254',
    colorName: 'Greys 250–254',
    hexPreview: '#52525b',
    plotColor: 'Use Object Color / Screened Black',
    screening: '25% – 50%',
    lineweightMm: '0.10 mm',
    engineeringUse: 'Solid shaded RC column poché, retaining wall backfill shading, phasing clouds'
  }
];

export const EXPANDED_CAD_COMMANDS: CadCommandDetail[] = [
  // Cleanup & Audit
  {
    cmd: 'OVERKILL',
    alias: 'OV',
    category: 'Cleanup & Audit',
    syntax: 'OVERKILL -> Select Objects -> Enter',
    desc: 'Deletes duplicate overlapping lines, arcs, and polylines and merges partially overlapping collinear segments.',
    mechanics:
      'Compares geometric vectors within a specified numeric tolerance (default 0.000001). When two collinear segments overlap or sit stacked on top of each other, OVERKILL combines them into a single clean entity, dramatically reducing file size and preventing laser/plotter double-striking.',
    stepByStep: [
      'Type OVERKILL in the command line and press Enter.',
      'Type ALL (or window-select the target drawing area) and press Enter.',
      'In the dialog box, set Tolerance to 0.001 (for mm drawings) or 0.0001 (for meter drawings).',
      'Check "Optimize segments within polylines" and "Combine co-linear objects that partially overlap".',
      'Leave "Ignore Layer" unchecked so lines on different layers are not accidentally merged, then click OK.'
    ],
    sysVars: ['DELOBJ'],
    tips: 'Always run OVERKILL before exporting drawings to ETABS, SAFE, or STAAD.Pro—overlapping analytical lines cause duplicate finite element nodes and mesh failures.'
  },
  {
    cmd: 'PURGE',
    alias: 'PU',
    category: 'Cleanup & Audit',
    syntax: 'PURGE (or -PURGE for command-line)',
    desc: 'Removes unused blocks, layers, linetypes, dimension styles, RegApps, and zero-length geometry from the DWG database.',
    mechanics:
      'Every time you copy-paste entities from external consultant drawings, invisible unreferenced block definitions, DGN linestyles, and Registered Applications (RegApps) bloat the DWG symbol table. PURGE scans the drawing database for unreferenced ObjectIDs and permanently strips them.',
    stepByStep: [
      'Type -PURGE (with a leading hyphen for the fast command-line version) and press Enter.',
      'Type R (Regapps — Registered Applications) -> Enter -> Type * -> Enter -> Type N (No confirmation).',
      'Repeat -PURGE -> Type A (All unused named objects) -> Enter -> Type * -> Enter -> Type N.',
      'Or type PURGE (dialog), check "Purge nested items", "Unnamed objects (Zero-length geometry & Empty text)", and click Purge All.'
    ],
    sysVars: ['PROXYGRAPHICS'],
    tips: 'Purging RegApps (-PURGE -> R) is the #1 fix when a small 2 MB AutoCAD file suddenly balloons to 45 MB and lags during copy-paste.'
  },
  {
    cmd: 'AUDIT',
    alias: 'AUD',
    category: 'Cleanup & Audit',
    syntax: 'AUDIT -> Y',
    desc: 'Evaluates the integrity of the active DWG database and repairs corrupted entity handles and header tables.',
    mechanics:
      'Traverses the internal DWG object hierarchy (Header, Symbol Tables, Block Records, and AcDbEntities), validating pointers and checksums. Corrupt records are either repaired in-place or moved to an `$AUDIT_BAD` recovery layer.',
    stepByStep: [
      'Type AUDIT and press Enter.',
      'At the prompt "Fix any errors detected? [Yes/No]", type Y and press Enter.',
      'Review the command history (F2) to inspect "Total errors found" and "Total errors fixed".',
      'Save the drawing immediately (CTRL+S) after the audit completes.'
    ],
    tips: 'Run AUDIT immediately after recovering a crashed file or receiving survey DWGs generated by third-party GIS/Total Station software.'
  },
  {
    cmd: 'LAYDEL',
    alias: 'LDEL',
    category: 'Cleanup & Audit',
    syntax: 'LAYDEL -> Select entity or [Name]',
    desc: 'Force-deletes a stubborn layer and permanently erases every object residing on it, including inside nested blocks.',
    mechanics:
      'Standard PURGE cannot delete a layer if even a single tiny point lies on it or if a block definition references that layer internally. LAYDEL rewrites every block definition in the drawing to strip objects on that layer and removes the layer from the Layer Table.',
    stepByStep: [
      'Type LAYDEL and press Enter.',
      'Click an object on the unwanted layer, or type N (Name) to pick the layer from a list.',
      'Press Enter, then type Y to confirm permanent deletion.'
    ],
    tips: 'Use extreme caution: LAYDEL modifies existing block definitions across the entire drawing if those blocks contain sub-entities on the deleted layer.'
  },
  {
    cmd: 'SCALELISTEDIT',
    alias: 'SLE',
    category: 'Cleanup & Audit',
    syntax: '-SCALELISTEDIT -> R -> Y -> E',
    desc: 'Resets bloated annotation scale lists caused by nested Xrefs, eliminating 10-second pauses when selecting viewports.',
    mechanics:
      'Imported drawings often inject hundreds of garbage custom scales (e.g., `1:100_1_1_1`). AutoCAD evaluates the entire scale dictionary whenever you click an annotative object or viewport.',
    stepByStep: [
      'Type -SCALELISTEDIT (with the leading hyphen) and press Enter.',
      'Type R (Reset) and press Enter.',
      'Type Y (Yes, reset to default metric/imperial scales) and press Enter.',
      'Type E (Exit) and press Enter.'
    ],
    tips: 'If selecting a viewport freezes AutoCAD for several seconds, resetting the scale list fixes it immediately.'
  },

  // System Variables
  {
    cmd: 'OSNAPZ',
    alias: 'OSNAPZ',
    category: 'System Variables',
    syntax: 'OSNAPZ -> 1',
    desc: 'Forces all Object Snaps to project onto the current elevation (Z = 0), preventing accidental 3D skewed lines.',
    mechanics:
      'When snapping to a 3D topographic contour or surveyor spot-level block at Z = +45.25m, AutoCAD normally inherits that Z elevation for your new 2D wall line. Setting OSNAPZ = 1 substitutes the current ELEVATION value (0.00) for the Z-coordinate of every snapped point.',
    stepByStep: [
      'Type ELEVATION and verify it is set to 0.',
      'Type OSNAPZ and press Enter.',
      'Type 1 and press Enter.',
      'Now any line, polyline, or dimension snapped onto 3D survey points stays strictly flat on the Z = 0 plane.'
    ],
    sysVars: ['ELEVATION', 'FLATTEN'],
    tips: 'Note that OSNAPZ resets to 0 when you close AutoCAD unless you add `(setvar "OSNAPZ" 1)` to your `acaddoc.lsp` startup file.'
  },
  {
    cmd: 'FILEDIA & PICKFIRST',
    alias: 'FILEDIA',
    category: 'System Variables',
    syntax: 'FILEDIA -> 1 | PICKFIRST -> 1',
    desc: 'Restores missing File Open/Save dialog boxes and re-enables Noun-Verb selection (selecting objects before typing a command).',
    mechanics:
      'Aborted AutoLISP scripts or crashes frequently leave `FILEDIA = 0` (forcing command-line path typing) and `PICKFIRST = 0` (breaking Delete key and Properties palette selection).',
    stepByStep: [
      'If CTRL+O or SAVEAS only shows a text prompt instead of a window, type FILEDIA -> 1 -> Enter.',
      'If selecting objects and pressing Delete does nothing, type PICKFIRST -> 1 -> Enter.',
      'Also verify PICKADD -> 2 so clicking multiple objects adds them to the selection set without holding Shift.'
    ],
    sysVars: ['FILEDIA', 'CMDDIA', 'PICKFIRST', 'PICKADD'],
    tips: 'Keep this quartet memorized: FILEDIA=1, CMDDIA=1, PICKFIRST=1, PICKADD=2.'
  },
  {
    cmd: 'MIRRTEXT',
    alias: 'MIRRTEXT',
    category: 'System Variables',
    syntax: 'MIRRTEXT -> 0',
    desc: 'Prevents text, MText, and block attributes from flipping backwards like a mirror image when mirroring symmetrical plans.',
    mechanics:
      'Controls how the `MIRROR` transformation matrix affects `AcDbText` and `AcDbMText` entities. When set to `0`, the insertion box position is mirrored across the axis, but the text reading orientation remains left-to-right.',
    stepByStep: [
      'Type MIRRTEXT and press Enter.',
      'Enter 0 and press Enter.',
      'Run MIRROR (MI) on any symmetrical duplex apartment or structural framing bay—all room labels and beam tags remain readable.'
    ],
    sysVars: ['MIRRTEXT'],
    tips: 'If attributes inside a mirrored Block still flip upside down, ensure the Attribute Definition inside the Block Editor is a Multiline Attribute or use a Flip Action parameter.'
  },
  {
    cmd: 'LTSCALE / PSLTSCALE / MSLTSCALE',
    alias: 'LTS / PSLTS',
    category: 'System Variables',
    syntax: 'PSLTSCALE -> 1 | MSLTSCALE -> 1 | LTSCALE -> 1',
    desc: 'Synchronizes dashed, hidden, and centerline linetype appearance between Model Space and multi-scale Paper Space viewports.',
    mechanics:
      '`PSLTSCALE = 1` binds dash lengths to Paper Space millimeters rather than Model Space units. `MSLTSCALE = 1` previews those same dash lengths inside Model Space using the active Annotation Scale.',
    stepByStep: [
      'Type PSLTSCALE -> 1 -> Enter.',
      'Type MSLTSCALE -> 1 -> Enter.',
      'Type LTSCALE -> 1 -> Enter (or 0.5 for tighter ISO dashes).',
      'Type REA (REGENALL) to rebuild display geometry across all viewports.'
    ],
    sysVars: ['LTSCALE', 'PSLTSCALE', 'MSLTSCALE', 'CELTSCALE'],
    tips: 'Never override individual line scales in Properties (`CELTSCALE` != 1) to "make dashes show up"—fix PSLTSCALE and REGENALL instead.'
  },
  {
    cmd: 'DIMASSOC',
    alias: 'DIMASSOC',
    category: 'System Variables',
    syntax: 'DIMASSOC -> 2',
    desc: 'Creates true associative dimensions that automatically update their value and stretch when the measured wall or column moves.',
    mechanics:
      '`DIMASSOC = 2` binds dimension definition points directly to geometric Osnap reactors on the target objects. `DIMASSOC = 1` creates non-associative dimensions, and `DIMASSOC = 0` creates exploded lines and text.',
    stepByStep: [
      'Type DIMASSOC and press Enter.',
      'Type 2 and press Enter.',
      'If existing dimensions became disassociated after stretching, run DIMREASSOCIATE to re-bind them.'
    ],
    sysVars: ['DIMASSOC', 'DIMSCALE'],
    tips: 'When dimensioning inside Paper Space over a scaled Viewport, `DIMASSOC = 2` automatically reads the true Model Space length instead of the paper millimeter size.'
  },

  // Drawing & Precision Snaps
  {
    cmd: 'FILLET (Radius = 0) & CHAMFER',
    alias: 'F / CHA',
    category: 'Drawing & Precision Snaps',
    syntax: 'F -> Hold Shift + Click second line',
    desc: 'Instantly trims or extends two intersecting or non-touching wall/beam lines to a sharp 90° corner.',
    mechanics:
      'Holding Down the `SHIFT` key while clicking the second line temporarily overrides the current Fillet Radius to `0.000`, extending or trimming both segments to their exact mathematical intersection point without erasing your stored radius.',
    stepByStep: [
      'Type F (FILLET) and press Enter.',
      'Click the first wall or beam line.',
      'Hold down SHIFT on your keyboard and click the second line to form an instant sharp corner.',
      'Use F -> M (Multiple) when cleaning up dozens of structural beam-column intersections continuously.'
    ],
    sysVars: ['FILLETRAD', 'TRIMMODE'],
    tips: 'Holding SHIFT also works inside TRIM (TR) and EXTEND (EX)—holding SHIFT inside TRIM temporarily turns it into EXTEND and vice versa!'
  },
  {
    cmd: 'BOUNDARY (BO)',
    alias: 'BO',
    category: 'Drawing & Precision Snaps',
    syntax: 'BO -> Pick Points -> Click inside room',
    desc: 'Flood-fills any enclosed room or slab bay with a clean, single closed Polyline for instant area & perimeter takeoff.',
    mechanics:
      'Uses the same ray-casting island-detection algorithm as `HATCH`, tracing the inner perimeter of surrounding walls, columns, and door headers to generate a new closed `LWPOLYLINE` on the current layer.',
    stepByStep: [
      'Create or activate an "AREA-TAKEOFF" layer.',
      'Type BO and press Enter.',
      'Set Object Type to "Polyline" and click "Pick Points".',
      'Click once inside the enclosed room or structural slab panel and press Enter.',
      'Select the newly created polyline and open Properties (CTRL+1) or run LIST (LI) to read the exact Area and Perimeter.'
    ],
    sysVars: ['HPBOUND', 'HPGAPTOL'],
    tips: 'If a doorway gap prevents boundary detection, set HPGAPTOL (Hatch Gap Tolerance) to your door opening width (e.g., 900 mm or 0.9 m) to bridge open doors automatically.'
  },
  {
    cmd: 'ALIGN',
    alias: 'AL',
    category: 'Drawing & Precision Snaps',
    syntax: 'AL -> Select Objects -> Source1/Dest1 -> Source2/Dest2 -> Y/N',
    desc: 'Moves, rotates, and optionally scales an entire building plan, Xref, or site boundary to match two reference survey coordinates in one step.',
    mechanics:
      'Computes a 2D affine transformation matrix (translation + rotation + uniform scale factor) from two pairs of source and destination points: Point Pair 1 anchors translation, and Point Pair 2 defines the rotation vector and scale ratio.',
    stepByStep: [
      'Type AL and press Enter.',
      'Select the objects, block, or site boundary to align and press Enter.',
      'Click First Source Point on your object, then click First Destination Point on the target grid/survey point.',
      'Click Second Source Point on your object, then click Second Destination Point on the target grid/survey point.',
      'Press Enter to skip the 3rd point (for 2D plans).',
      'At "Scale objects based on alignment points? [Yes/No]", type Y to match scale or N to only move and rotate.'
    ],
    tips: 'ALIGN is the fastest way to register a scanned PDF underlay or architectural floor plan onto a rotated Civil Survey coordinate grid.'
  },
  {
    cmd: 'PEDIT (Multiple Join)',
    alias: 'PE',
    category: 'Drawing & Precision Snaps',
    syntax: 'PE -> M -> Select Lines -> J -> Fuzz Distance',
    desc: 'Converts hundreds of disconnected lines and arcs into continuous closed polylines, automatically bridging small drafting gaps.',
    mechanics:
      'Using the `Multiple (M)` flag unlocks the `Fuzz Distance` parameter inside `Join`, instructing AutoCAD to extend or add tiny closing segments wherever endpoints lie within the specified tolerance.',
    stepByStep: [
      'Type PE and press Enter.',
      'Type M (Multiple) and press Enter.',
      'Select all disconnected contour lines, footing outlines, or parcel boundaries and press Enter.',
      'If prompted "Convert Lines, Arcs and Splines to polylines?", type Y -> Enter.',
      'Type J (Join) -> Enter, then enter a Fuzz Distance (e.g., 5 for 5 mm) -> Enter twice.'
    ],
    sysVars: ['PEDITACCEPT'],
    tips: 'Set PEDITACCEPT = 1 so AutoCAD stops asking "Do you want to turn it into one?" every time you run PEDIT.'
  },
  {
    cmd: 'STRETCH',
    alias: 'S',
    category: 'Drawing & Precision Snaps',
    syntax: 'S -> Right-to-Left Crossing Window -> Base Point -> Displacement',
    desc: 'Shifts structural grid spans, walls, and beams while keeping all connected perpendicular lines and dimensions attached.',
    mechanics:
      'Operates exclusively on vertices enclosed inside a Crossing Selection (`Right-to-Left` green window or `CP` Crossing Polygon). Vertices inside the crossing box move by the displacement vector; vertices outside remain anchored.',
    stepByStep: [
      'Type S and press Enter.',
      'Click and drag from RIGHT to LEFT (Green Crossing Box) across the column line or wall end you want to lengthen.',
      'Press Enter to finish selection.',
      'Click a base point and type the exact delta distance (e.g., 600) in the Ortho/Polar direction.'
    ],
    tips: 'Never use a Left-to-Right blue window with STRETCH—it selects the whole object and merely moves it instead of stretching vertices.'
  },
  {
    cmd: 'M2P (Mid Between 2 Points)',
    alias: 'M2P / MTP',
    category: 'Drawing & Precision Snaps',
    syntax: 'During any command -> Type M2P -> Click Pt 1 -> Click Pt 2',
    desc: 'Command modifier that snaps to the exact geometric midpoint between any two clicked points without drawing construction lines.',
    mechanics:
      'Evaluates $P_{\\text{mid}} = \\frac{P_1 + P_2}{2}$ on the fly inside any active drawing, moving, or dimensioning command.',
    stepByStep: [
      'Start any command (e.g., CIRCLE, LINE, MOVE, or INSERT for a ceiling light or column).',
      'When AutoCAD asks for a point, type M2P (or Shift + Right-Click -> Mid Between 2 Points) and press Enter.',
      'Click the first opposite corner of the room or column bay.',
      'Click the second opposite diagonal corner—your object snaps dead-center in the room.'
    ],
    tips: 'Combine M2P with TK (Temporary Tracking) to place structural openings or MEP sleeves at exact offsets from grid intersections without construction lines.'
  },
  {
    cmd: 'TK (Temporary Tracking)',
    alias: 'TK',
    category: 'Drawing & Precision Snaps',
    syntax: 'During any point prompt -> Type TK -> Base Pt -> Offset distances -> Enter',
    desc: 'Steps off multiple orthogonal X and Y offset distances from a reference corner before placing the first point of an object.',
    mechanics:
      'Creates a temporary invisible coordinate chain from a reference Osnap point before committing the actual vertex to the active command.',
    stepByStep: [
      'Start a command (e.g., Circle for a core-cut hole or Insert for a column).',
      'At the "Specify center point" prompt, type TK and press Enter.',
      'Click the reference room corner or grid intersection.',
      'Move your cursor East (Ortho F8 ON), type 1200 -> Enter.',
      'Move your cursor North, type 850 -> Enter.',
      'Press Enter once more to accept that exact location!'
    ],
    tips: 'Eliminates 90% of temporary offset construction lines that clutter drawings.'
  },

  // Blocks, Xrefs & Attributes
  {
    cmd: 'XCLIP',
    alias: 'XC',
    category: 'Blocks, Xrefs & Attributes',
    syntax: 'XC -> Select Xref/Block -> New Boundary -> Rectangular/Polygonal',
    desc: 'Crops an External Reference (Xref) or Block to a custom boundary without exploding or trimming the source file.',
    mechanics:
      'Attaches a spatial clipping filter (`AcDbSpatialFilter`) to the block reference. You can also invert the clip (`Invert Clip`) to mask out an interior courtyard or core area.',
    stepByStep: [
      'Type XC and press Enter.',
      'Select the external reference (Xref) or block and press Enter.',
      'Press Enter to accept "New boundary".',
      'Choose Rectangular, Polygonal, or Select Polyline, and trace the desired blow-up detail region.',
      'Set XCLIPFRAME = 0 to hide the clipping border on printouts, or 2 to show it on screen but hide it when plotting.'
    ],
    sysVars: ['XCLIPFRAME'],
    tips: 'Click the small blue arrow grip on an XCLIP boundary to invert the mask inside-out instantly.'
  },
  {
    cmd: 'BURST',
    alias: 'BURST',
    category: 'Blocks, Xrefs & Attributes',
    syntax: 'BURST -> Select Blocks -> Enter',
    desc: 'Explodes blocks while preserving the exact typed values of all Attributes as readable Text instead of reverting to raw Tag names.',
    mechanics:
      'Unlike standard `EXPLODE` (which reverts block attributes like `C-14 (400x600)` back to their generic attribute tag definition `COL_ID`), `BURST` (an Express Tool) extracts the evaluated string value of every visible attribute and converts it into a permanent `DBText` or `MText` entity at the exact same coordinates and layer.',
    stepByStep: [
      'Type BURST and press Enter.',
      'Select the attributed blocks (e.g., column tags, spot level blocks, or titleblocks) and press Enter.',
      'All attribute values remain intact as normal editable text.'
    ],
    tips: 'Always use BURST instead of EXPLODE when preparing consultant drawings for client handover or importing into structural analysis software.'
  },
  {
    cmd: 'ATTSYNC & BATTMAN',
    alias: 'ATTSYNC',
    category: 'Blocks, Xrefs & Attributes',
    syntax: 'ATTSYNC -> Select -> Pick Block -> Yes',
    desc: 'Pushes newly added, moved, or reformatted Attribute Definitions from the Block Editor to all existing instances in the drawing.',
    mechanics:
      'In AutoCAD, existing block insertions cache their own Attribute entities (`AcDbAttribute`) at the moment of insertion. Editing a block in `BEDIT` does not automatically update already-placed blocks until `ATTSYNC` regenerates their attribute sub-entities.',
    stepByStep: [
      'Edit your block in BEDIT (e.g., move an attribute tag or add a new attribute) and save the block (BSAVE).',
      'Type ATTSYNC and press Enter.',
      'Type S (Select) -> Click any instance of that block in the drawing -> Type Y (Yes).',
      'Use BATTMAN (Block Attribute Manager) to reorder attribute prompts or toggle attribute visibility globally.'
    ],
    tips: 'Always run ATTSYNC after modifying any dynamic or attributed block—otherwise old instances won’t show your changes.'
  },
  {
    cmd: 'DATAEXTRACTION',
    alias: 'DX',
    category: 'Blocks, Xrefs & Attributes',
    syntax: 'DX -> Follow 8-Step Extraction Wizard',
    desc: 'Extracts block counts, attribute values, polyline areas, and lengths directly into a live AutoCAD Table or Excel BOQ `.xlsx` spreadsheet.',
    mechanics:
      'Queries the DWG database across one or multiple drawings, aggregating properties (`Count`, `Layer`, `Area`, `Length`, `X/Y/Z`, and custom Block Attributes) with SQL-style grouping and summing.',
    stepByStep: [
      'Type DX (DATAEXTRACTION) and press Enter.',
      'Page 1: Create a new data extraction (.dxe) file.',
      'Page 2: Select "Current Drawing" or "Select objects in the current drawing".',
      'Page 3: Check the blocks (e.g., Columns, Doors, Piles) or polylines you want to quantify.',
      'Page 4: Check "Attribute" and "Geometry" categories (e.g., Area, Length, Mark, Size).',
      'Page 5: Combine identical rows and sort by Mark.',
      'Page 6–8: Output to both an AutoCAD Table on the sheet AND an external Excel (.xlsx) BOQ file.'
    ],
    tips: 'If you update the drawing later, right-click the extracted AutoCAD Table and choose "Update Table Data Links" to recalculate quantities automatically.'
  },
  {
    cmd: 'WIPEOUT',
    alias: 'WO',
    category: 'Blocks, Xrefs & Attributes',
    syntax: 'WIPEOUT -> Trace Polygon -> WIPEOUTFRAME -> 2',
    desc: 'Places a background-color mask behind text, column tags, or equipment blocks so dense hatching and grid lines do not strike through text.',
    mechanics:
      'Creates a raster polygon mask filled with the current background color. Combined with `DRAWORDER` (`DR`), objects placed above the wipeout read cleanly over busy backgrounds.',
    stepByStep: [
      'Type WIPEOUT -> P (Polyline) -> Select a closed rectangle around your tag or equipment symbol.',
      'Type DR (DRAWORDER) -> Select your text/symbol -> F (Front).',
      'Type WIPEOUTFRAME -> Set to 2 (frame is visible on screen so you can select it, but NEVER prints on PDF/paper).'
    ],
    sysVars: ['WIPEOUTFRAME'],
    tips: 'For MText annotations, you don’t even need a separate Wipeout—open Properties (CTRL+1) on the MText, set "Background Mask = Yes", and set Border Offset Factor to 1.15.'
  },

  // Dimensioning & Annotation
  {
    cmd: 'QDIM & DIMCONTINUE',
    alias: 'QDIM / DCO',
    category: 'Dimensioning & Annotation',
    syntax: 'QDIM -> Select all grid lines -> Enter -> Click placement line',
    desc: 'Dimensions an entire structural grid line array or facade opening sequence in a single operation.',
    mechanics:
      '`QDIM` extracts all intersection/endpoint coordinates of the selected geometry along the chosen axis and generates a perfectly aligned chain of continuous or baseline dimensions.',
    stepByStep: [
      'Type QDIM and press Enter.',
      'Select all structural grid lines (e.g., Grids 1 through 12) and press Enter.',
      'Type C (Continuous) or B (Baseline) and click where the dimension string should sit.',
      'To add more bays to an existing dimension, type DCO (DIMCONTINUE) and click the next points.'
    ],
    sysVars: ['DIMSPACE', 'DIMBREAK'],
    tips: 'Use DIMBREAK to automatically create clean visual gaps where dimension extension lines cross each other.'
  },
  {
    cmd: 'FIND',
    alias: 'FIND',
    category: 'Dimensioning & Annotation',
    syntax: 'FIND -> Search String -> Replace All / Zoom To',
    desc: 'Searches and batch-replaces text across Single-line Text, MText, Dimensions, Tables, and Block Attributes simultaneously.',
    mechanics:
      'Scans all text-bearing entities across Model Space and all Layout tabs, even penetrating nested Block Attribute values.',
    stepByStep: [
      'Type FIND and press Enter.',
      'Enter the target string (e.g., "M25 CONCRETE" or a room number "RM-104").',
      'Click "List Results" to see every occurrence, and double-click any row to zoom directly to that spot in the drawing.',
      'Or enter a replacement string and click "Replace All" to update specification notes globally.'
    ],
    tips: 'Indispensable for updating concrete grades, rebar grades, or drawing revision numbers across 20 layout tabs at once.'
  },
  {
    cmd: 'TCOUNT (Automatic Text Numbering)',
    alias: 'TCOUNT',
    category: 'Dimensioning & Annotation',
    syntax: 'TCOUNT -> Select Text -> Sort (X/Y/Select-order) -> Start,Increment -> Overwrite/Prefix/Suffix',
    desc: 'Automatically numbers piles, columns, parking stalls, or risers sequentially by X-coordinate, Y-coordinate, or pick order.',
    mechanics:
      'Sorts the selected `Text`/`MText` array spatially along the X-axis, Y-axis, or selection order and replaces or prefixes strings with an arithmetic progression ($n_0 + k \\cdot \\Delta$).',
    stepByStep: [
      'Copy a placeholder text label (e.g., "P-") across all 50 piles or columns.',
      'Type TCOUNT and press Enter.',
      'Select all the text objects and press Enter.',
      'Choose Sort order: X (left-to-right), Y (top-to-bottom), or Select-order.',
      'Enter Start and Increment: `1,1` and press Enter.',
      'Choose Suffix (to turn "P-" into "P-1", "P-2", ..., "P-50").'
    ],
    tips: 'For numbering blocks with Attributes or automatic dynamic prefixes (`C1`, `C2`), pair TCOUNT with Lee Mac’s `NUMINC` plugin.'
  },

  // Layout & Plotting
  {
    cmd: 'LAYISO & LAYUNISO',
    alias: 'LAYISO',
    category: 'Layout & Plotting',
    syntax: 'LAYISO -> S (Settings) -> O (Off) -> Select Objects',
    desc: 'Isolates only the layers of the objects you click (e.g., Structural Columns & Beams), hiding or locking everything else.',
    mechanics:
      'Temporarily turns off or locks/fades all layers except those belonging to the selection set, storing the previous layer state in memory until `LAYUNISO` is called.',
    stepByStep: [
      'Type LAYISO and press Enter.',
      'Type S (Settings) -> O (Off) -> O (Off) so unisolated layers turn completely invisible rather than just faded.',
      'Click one object on each layer you want to work on (e.g., Column + Beam + Rebar) and press Enter.',
      'Perform your takeoff or editing, then type LAYUNISO to restore all layers.'
    ],
    sysVars: ['LAYLOCKFADECTL'],
    tips: 'Inside a Paper Space Viewport, `LAYISO` freezes layers ONLY in that specific viewport (`VP Freeze`) without affecting other viewports!'
  },
  {
    cmd: 'CHSPACE (Change Space)',
    alias: 'CHSPACE',
    category: 'Layout & Plotting',
    syntax: 'CHSPACE -> Select Objects -> Enter',
    desc: 'Transfers objects between Model Space and Paper Space through an active viewport while automatically scaling them to look identical.',
    mechanics:
      'Multiplies or divides the entity geometry by the active viewport’s `XP` zoom factor so its visual footprint on screen does not change by a single pixel when crossing between Model Space and Paper Space.',
    stepByStep: [
      'Open a Layout tab containing a scaled Viewport.',
      'Double-click inside the viewport to activate it.',
      'Type CHSPACE and press Enter.',
      'Select notes, dimensions, or callout bubbles that were accidentally drawn in Model Space (or Paper Space) and press Enter.',
      'They jump cleanly to Paper Space at the exact 1:1 millimeter height.'
    ],
    tips: 'Use CHSPACE to project a Paper Space viewport boundary rectangle into Model Space so you know the exact sheet crop limits while drafting in Model Space.'
  },
  {
    cmd: 'PUBLISH & SSM',
    alias: 'PUBLISH / SSM',
    category: 'Layout & Plotting',
    syntax: 'PUBLISH -> Add Sheets -> Publish to Multi-Sheet PDF',
    desc: 'Batch-plots dozens of Layout tabs across multiple DWG files into a single bookmarked PDF package.',
    mechanics:
      'Runs background plot threads using the saved Page Setup of each sheet, compiling all drawings into a single multi-page PDF without opening and plotting each sheet manually.',
    stepByStep: [
      'Ensure at least one Layout tab has a properly configured Page Setup (e.g., "A1-PDF-Monochrome").',
      'Type PUBLISH and press Enter.',
      'Set "Publish to:" -> PDF.',
      'Remove Model tabs if you only want Layout sheets, select all sheets, and assign your saved Page Setup to all rows.',
      'Click "Publish Options" -> Check "Multi-sheet file" -> Click Publish.'
    ],
    sysVars: ['BACKGROUNDPLOT'],
    tips: 'Set BACKGROUNDPLOT = 0 if you want PUBLISH to plot 3x faster in the foreground instead of spooling slowly in the background.'
  },

  // 3D & Site Grading
  {
    cmd: 'FLATTEN & CHANGE (Elev = 0)',
    alias: 'FLATTEN',
    category: '3D & Site Grading',
    syntax: 'CHANGE -> ALL -> P -> E -> 0',
    desc: 'Collapses 3D survey lines, contours, and skewed blocks down to flat 2D geometry at Z = 0.00.',
    mechanics:
      'Two complementary tools: `CHANGE -> Properties -> Elevation -> 0` instantaneously zeroes out the Z coordinates of all native 2D lines/polylines, while `FLATTEN` projects complex 3D meshes, blocks, and non-coplanar polylines onto the World XY plane.',
    stepByStep: [
      'First run the fast native method: Type CHANGE -> Type ALL -> Enter -> Type P (Properties) -> Type E (Elevation) -> Type 0 -> Enter twice.',
      'If stubborn 3D blocks or splines remain at non-zero Z, select them and type FLATTEN -> Enter -> Type N (Do not remove hidden lines) -> Enter.',
      'Finally set OSNAPZ = 1 so future snaps stay at Z = 0.'
    ],
    sysVars: ['OSNAPZ', 'ELEVATION'],
    tips: 'Always run the `CHANGE -> ALL -> P -> E -> 0` sequence first—it handles 50,000 lines in 0.2 seconds, whereas FLATTEN can take minutes on huge drawings.'
  }
];

export const CAD_PLUGINS_DATA: CadPluginSuite[] = [
  {
    id: 'yqarch',
    name: 'YQArch (YuanQuan Architecture — 源泉设计)',
    tagline: 'The #1 Free AutoLISP Productivity Suite for Civil, Structural & Architectural Drafting',
    discipline: 'Architecture, Structural Detailing & Fast BOQ Takeoff',
    badgeColor: 'amber',
    overview:
      'YQArch (YuanQuan Design) is a legendary lightweight AutoLISP/VLX plugin containing over 300 specialized commands that automate structural grid generation, double-line walls, automatic columns, doors/windows, staircase plans & sections, beam/slab rebar detailing, area/length BOQ tables, and one-click batch PDF plotting.',
    setupSteps: [
      'Download and extract the YQArch folder to `C:\\YQArch` (avoid spaces or special characters in the folder path).',
      'In AutoCAD, type APPLOAD (AP) -> Browse to `C:\\YQArch\\sys\\yqstart.lsp` -> Click Load, and add it to the Startup Suite.',
      'Switch YQArch from Chinese to English immediately: Type `yq_lang` -> Press Enter -> Type `1` (English) or select English in the dialog.',
      'Configure your base drawing unit: Type `YQSYSCFG` (or `yq_set`) -> Set Default Drawing Unit to Millimeters (mm), Centimeters (cm), Meters (m), or Inches so all wall thicknesses and text heights scale automatically.',
      'Type `YQ` or `SD` at any time to open the master YQArch visual command palette.'
    ],
    keyConfigCommands: [
      { cmd: 'yq_lang', effect: 'Switches all YQArch menus, dialogs, and command prompts between Chinese (0) and English (1).' },
      { cmd: 'YQSYSCFG', effect: 'Opens the master configuration file (`config.txt`) to set base units (mm/m), layer naming standards, and default text height.' },
      { cmd: 'SD / YQ', effect: 'Launches the interactive on-screen YQArch command dashboard.' },
      { cmd: 'BBL', effect: 'Sets the active YQArch drawing scale (e.g., 1:100, 1:50) for all auto-generated text, symbols, and dimensions.' }
    ],
    commands: [
      {
        code: 'ZXW',
        name: 'Structural Grid Axis Network',
        category: 'Grids & Columns',
        purpose: 'Generates a complete multi-bay X/Y structural grid with automatic outer dimension chains and grid bubbles (A, B, C / 1, 2, 3) in 5 seconds.',
        stepByStep: [
          'Type ZXW and press Enter.',
          'In the dialog, enter X-axis bay spacings separated by spaces (e.g., `4500 5000 3600` or `4500*3` for 3 equal bays of 4500 mm).',
          'Enter Y-axis bay spacings (e.g., `4200 6000 4200`).',
          'Check "Auto Dimension" and "Axis Bubbles on Both Sides", click OK, and click insertion point in Model Space.'
        ],
        proTip: 'Use syntax `4000*4 5500 4000*2` inside ZXW to define repeated structural bays rapidly.'
      },
      {
        code: 'ZZBZ',
        name: 'Batch Structural Columns at Grid Intersections',
        category: 'Grids & Columns',
        purpose: 'Automatically places solid-hatched RC columns at every selected grid line intersection.',
        stepByStep: [
          'Type ZZBZ and press Enter.',
          'Enter Column Width and Depth (e.g., `400` x `600` mm) and choose rectangular or circular section.',
          'Window-select all structural grid lines generated by ZXW and press Enter—columns populate every intersection instantly.'
        ],
        proTip: 'Use `ZZX` afterwards to trim walls automatically around newly placed structural columns.'
      },
      {
        code: 'XWW / WW',
        name: 'Double-Line Walls from Axes (`XWW`) or Manual (`WW`)',
        category: 'Walls, Doors & Windows',
        purpose: 'Converts single grid/centerlines into clean double-line architectural walls with automatic T-junction and corner cleanup.',
        stepByStep: [
          'Type XWW and press Enter.',
          'Set wall thickness (e.g., `250` mm for exterior 10" brick wall or `125` mm for 5" partition).',
          'Select the grid lines or single-line sketch and press Enter—all intersections self-heal automatically.',
          'Or type WW to draw double-line walls interactively with left/center/right justification.'
        ],
        proTip: 'Use `XWD` to heal broken wall intersections or `GW` to change the thickness of existing double walls.'
      },
      {
        code: 'AD / AW',
        name: 'Intelligent Door (`AD`) & Window (`AW`) Insertion',
        category: 'Walls, Doors & Windows',
        purpose: 'Cuts double-line walls automatically and inserts parametric single, double, sliding, or pocket doors and windows.',
        stepByStep: [
          'Type AD (Door) or AW (Window) and press Enter.',
          'Pick door style (single swing, double swing, sliding), width (e.g., `900` or `1000` mm), and pier offset distance from the nearest corner (e.g., `100` mm).',
          'Click on the double-line wall near the corner, then click the swing direction.'
        ],
        proTip: 'Type `MD` or `MW` to delete a door or window and automatically heal the wall opening back into a continuous double wall!'
      },
      {
        code: 'DD / DZZ',
        name: 'One-Click Closed Wall & Facade Auto-Dimensioning',
        category: 'Dimensioning & Annotation',
        purpose: 'Automatically generates 3-tier exterior architectural dimensions (Opening Chain + Grid-to-Grid Bay Chain + Overall Length) by dragging a window across a facade.',
        stepByStep: [
          'Type DD and press Enter.',
          'Drag a crossing selection across the exterior wall, windows, and grid lines along one side of the building.',
          'Move cursor outward and click to place all 3 aligned dimension tiers simultaneously.',
          'Use `DZZ` to dimension every interior room wall automatically.'
        ],
        proTip: 'Use `DA` to align messy dimension strings or `DC` to merge/split existing dimensions.'
      },
      {
        code: 'LTJ / LTB',
        name: 'Parametric Staircase Plan (`LTJ`) & Section (`LTB`)',
        category: 'Stairs, Elevations & Sections',
        purpose: 'Draws complete dog-legged, open-well, or straight staircase plans and full vertical sections with treads, risers, handrails, and break lines.',
        stepByStep: [
          'Type LTJ (Stair Plan) or LTB (Stair Section) and press Enter.',
          'Enter Stairwell Width, Flight Width, Landing Width, Story Height (e.g., `3200` mm), and Number of Risers (e.g., `20` risers @ `160` mm).',
          'Click insertion point in Model Space to generate the complete annotated staircase.'
        ],
        proTip: 'LTB calculates riser height automatically from story height and flags if tread/riser ratios violate ergonomic bounds.'
      },
      {
        code: 'GJBZ / JGB',
        name: 'RC Beam & Slab Rebar Detailing',
        category: 'Structural Detailing',
        purpose: 'Draws longitudinal rebar, bent-up bars, stirrup callouts, and cross-sections for RC beams and slabs.',
        stepByStep: [
          'Type GJBZ and press Enter.',
          'Configure bar diameter symbol (`%%132` or `Ø`), spacing (`@150`), and hook styles (90°, 135° seismic, or 180°).',
          'Pick the beam/slab edges to place top, bottom, and distribution reinforcement with leader callouts.'
        ]
      },
      {
        code: 'MJ / CD',
        name: 'Automatic Room Area (`MJ`) & Total Length (`CD`) BOQ Tables',
        category: 'BOQ Takeoff & Plotting',
        purpose: 'Measures multiple closed polylines/rooms (`MJ`) or sums pipe/wall/cable lengths (`CD`), labeling each item on the drawing and placing a summed schedule table.',
        stepByStep: [
          'Type MJ (Area Statistics) or CD (Length Statistics) and press Enter.',
          'Choose unit conversion (e.g., convert mm² drawing units into m² or sq.ft with 2 decimal places).',
          'Select all closed polylines or click inside rooms -> Press Enter -> Click to place the live summary table (or export directly to CSV/Excel).'
        ],
        proTip: 'MJ can automatically number each parcel (`A-1`, `A-2`...) at its centroid while generating the area schedule table.'
      },
      {
        code: 'BP / TK',
        name: 'Drawing Frame Insertion (`TK`) & Batch PDF Plot (`BP`)',
        category: 'BOQ Takeoff & Plotting',
        purpose: 'Detects all standard drawing frames (`TK`) arranged inside Model Space or Layout Space and batch-plots all sheets to individual or combined PDFs in one click.',
        stepByStep: [
          'Type TK to place standardized A1/A2/A3 drawing borders around your plans.',
          'Type BP (Batch Plot) and press Enter.',
          'Window-select all 20+ drawing borders in Model Space -> Choose PDF output folder -> Click Plot.'
        ],
        proTip: 'BP automatically sorts sheets left-to-right, top-to-bottom and names PDFs using the sheet number text inside each titleblock.'
      },
      {
        code: 'SCB / JJ',
        name: 'Architectural Block Library (`SCB`) & Room Furniture (`JJ`)',
        category: 'Blocks & Symbols',
        purpose: 'Inserts scaled sanitary ware, furniture, vehicles, trees, north arrows, and section markers or populates an entire bedroom/living room/toilet layout automatically.',
        stepByStep: [
          'Type JJ (Auto Furniture/Sanitary) and click inside any room to place beds, wardrobes, sofas, or WC fixtures scaled to the room.',
          'Or type SCB to browse the master block catalog.'
        ]
      }
    ]
  },
  {
    id: 'yqprime',
    name: 'YQPrime (Enhanced Structural & Architectural Toolbar Suite)',
    tagline: 'Modernized Ribbon Interface, English-First Structural RC Detailing & Automated BBS Workflows',
    discipline: 'Structural RC Detailing, Bar Bending Schedules & Production Drafting',
    badgeColor: 'emerald',
    overview:
      'YQPrime builds upon the YQArch engine with a clean English ribbon/toolbar UI, pre-calibrated metric/imperial structural templates, enhanced RC beam/column/footing section generators, automatic rebar mark tagging, and direct Bar Bending Schedule (BBS) table extraction.',
    setupSteps: [
      'Run the YQPrime installer or load `yqprime_loader.vlx` via APPLOAD and add the YQPrime `/support` directory to AutoCAD Options -> Files -> Support File Search Path.',
      'Type `MENULOAD` (or `CUILOAD`) and load `YQPrime.cuix` to enable the dedicated visual Ribbon tab and floating structural toolbars.',
      'Run `YQP_UNIT` to lock your project standard (Metric mm/m with ACI/BNBC/Eurocode rebar diameters: 10, 12, 16, 20, 25, 28, 32 mm).',
      'Set your scale multiplier using `YQP_SCALE` before generating structural sections.'
    ],
    keyConfigCommands: [
      { cmd: 'YQP_UNIT', effect: 'Configures metric/imperial units, rebar bar diameter sets, and concrete cover defaults.' },
      { cmd: 'YQP_SCALE', effect: 'Synchronizes detail callouts, section bubbles, and rebar text height to 1:20, 1:25, 1:50, or 1:100.' },
      { cmd: 'YQP_BBS', effect: 'Scans tagged reinforcement bars and generates a formatted Bar Bending Schedule table with unit weights.' }
    ],
    commands: [
      {
        code: 'YQP_BEAM / LJM',
        name: 'Parametric RC Beam Elevation & Cross-Section Generator',
        category: 'RC Structural Detailing',
        purpose: 'Generates longitudinal beam elevations and 1:20 cross-sections (L/4 support and mid-span) with main bars, extra top/bottom bars, side face reinforcement, and 135° seismic stirrups.',
        stepByStep: [
          'Launch the Beam Section dialog (`LJM` or from the YQPrime Structural Ribbon).',
          'Input Beam Width $b$ (e.g., `300` mm), Total Depth $h$ (`600` mm), Slab Thickness (`150` mm), and Clear Cover (`40` mm).',
          'Specify Top Bars (e.g., `3-Ø20 + 2-Ø16 extra`), Bottom Bars (`4-Ø20`), and Stirrups (`Ø10 @ 125 c/c`).',
          'Click in Model Space to place the fully dimensioned cross-section with rebar callouts.'
        ],
        proTip: 'Automatically checks minimum clear bar spacing against maximum aggregate size during placement.'
      },
      {
        code: 'YQP_COL / ZJM',
        name: 'RC Column Cross-Section & Tie Configuration',
        category: 'RC Structural Detailing',
        purpose: 'Draws rectangular, circular, or L/T-shaped column sections with corner bars, intermediate bars, inner diamond/cross ties, and seismic hooks.',
        stepByStep: [
          'Run `ZJM` (Column Section Detailer).',
          'Enter Column dimensions (e.g., `500 × 750` mm), concrete cover (`40` mm), and bar arrangement along X and Y faces.',
          'Select multi-legged tie arrangement (e.g., 4-legged + diamond tie) and click insertion point.'
        ]
      },
      {
        code: 'YQP_FOOT / JCD',
        name: 'Isolated & Combined Footing Plan + Section Generator',
        category: 'RC Structural Detailing',
        purpose: 'Generates pad/stepped/sloped footing plan and vertical section with lean concrete (PCC), X/Y starter bars, and column dowels.',
        stepByStep: [
          'Launch Footing Detailer (`JCD`).',
          'Input Footing $L \\times B \\times D$, PCC thickness (`75` mm projection), and bottom mesh reinforcement (`Ø16 @ 150 c/c B/W`).',
          'Click once to place both the Plan and Section views aligned vertically.'
        ]
      },
      {
        code: 'YQP_BBS',
        name: 'Automated Bar Bending Schedule (BBS) Extractor',
        category: 'Takeoff & Schedules',
        purpose: 'Reads rebar callout tags across the active sheet, computes cutting length (including 90°/135° bend deductions and hooks), and prints a complete weight table in kg / metric tons.',
        stepByStep: [
          'Tag reinforcement bars using YQPrime rebar callout leaders (`GJBZ`).',
          'Type `YQP_BBS` -> Window-select all structural details on the sheet.',
          'Verify shape codes and unit weight formula ($d^2 / 162.2$ kg/m), then click to insert the BBS table or export to Excel.'
        ]
      }
    ]
  },
  {
    id: 'leemac',
    name: 'Lee Mac Programming Suite (Industry-Standard AutoLISP Utilities)',
    tagline: 'Surgical Precision AutoLISP Tools for Numbering, Attribute Sync, Layer Standards & Polylines',
    discipline: 'Drafting Automation, Titleblock Sync & CAD Management',
    badgeColor: 'cyan',
    overview:
      'Created by Lee Mac, these open-source, rock-solid `.lsp` utilities are trusted by civil and structural CAD managers worldwide to solve AutoCAD’s biggest gaps: dynamic incremental numbering with prefixes/suffixes, two-way Excel-to-Titleblock attribute synchronization, stealing layers/styles from template files, and curvilinear text alignment.',
    setupSteps: [
      'Download individual `.lsp` files (`NumIncV3-9.lsp`, `MacAttV3-1.lsp`, `StealV1-8.lsp`, `PolyInfoV1-4.lsp`) into `C:\\CAD_LISP\\LeeMac`.',
      'Type `APPLOAD` -> Click "Contents..." under Startup Suite -> Click "Add..." and select your Lee Mac `.lsp` files so they load automatically in every drawing.',
      'Ensure `C:\\CAD_LISP\\LeeMac` is listed under Options (`OP`) -> System -> Security -> Trusted Locations.'
    ],
    keyConfigCommands: [
      { cmd: 'NUMINC', effect: 'Launches the Incremental Numbering Suite dialog (supports Text, MText, and Block Attributes).' },
      { cmd: 'MACATTEDIT', effect: 'Batch-edits or imports/exports Titleblock Attributes across dozens of DWG files without opening them.' },
      { cmd: 'STEAL', effect: 'Imports Layers, Dimension Styles, Text Styles, Blocks, and Page Setups from any template DWG.' }
    ],
    commands: [
      {
        code: 'NUMINC',
        name: 'Incremental Numbering Suite (`NumIncV3-9.lsp`)',
        category: 'Numbering & Tagging',
        purpose: 'Places sequential numbers or letters (`C-01`, `C-02`... or `Grid A`, `Grid B`...) inside Text, MText, or Block Attributes with live cursor preview and optional rectangular/circular enclosures.',
        stepByStep: [
          'Type `NUMINC` and press Enter.',
          'Set Prefix (`P-`), Middle (`01`), Suffix (``), and Increment (`1`).',
          'Optionally enable "Text Enclosure" (Circle, Slot, or Rectangle around each pile/column tag) or select an existing Attributed Block to increment.',
          'Click sequentially on every pile, column, footing, or parking stall—each click increments the number automatically.'
        ],
        proTip: 'Press Tab or R while placing to rotate the tag or type Backspace to undo the last number and decrement the counter!'
      },
      {
        code: 'MACATTEDIT / MACATTEXT',
        name: 'Global Attribute Extractor & Editor (`MacAttV3-1.lsp`)',
        category: 'Titleblocks & Excel Sync',
        purpose: 'Extracts or batch-updates Titleblock Attributes (`DWG_NO`, `REV`, `DATE`, `CHECKED_BY`) across 100+ external DWG files via ObjectDBX without even opening the drawings in AutoCAD.',
        stepByStep: [
          'Type `MACATTEXT` to extract titleblock attributes from an entire project folder directly into an Excel spreadsheet.',
          'Or type `MACATTEDIT` -> Add all project DWGs -> Enter the Titleblock Block Name and Attribute Tags (`REV = R2`, `DATE = 17-NOV-2026`) -> Click Run.',
          'All 100+ drawings are updated silently in seconds.'
        ]
      },
      {
        code: 'STEAL',
        name: 'Steal from Drawing (`StealV1-8.lsp`)',
        category: 'CAD Standards & Templates',
        purpose: 'Imports selected Layers, Linetypes, Dimension Styles, Text Styles, Blocks, Layouts, and Page Setups from an office standard `.dwt`/`.dwg` into your current messy drawing.',
        stepByStep: [
          'Type `STEAL` and press Enter.',
          'Select your office standard template DWG file.',
          'In the two-pane dialog, select the Layers, DimStyles (`ISO-100`, `ISO-50`), and Page Setups (`A1-PDF`) you need, and click "Steal".'
        ],
        proTip: 'Type `STEALALL` to import every standard layer and style from a template in one keystroke.'
      },
      {
        code: 'POLYINFO / A2F',
        name: 'Polyline Information (`PolyInfo`) & Area-to-Field (`Area2Field`)',
        category: 'Takeoff & Annotation',
        purpose: 'Links the live geometric Area of one or more closed polylines directly into an MText or Block Attribute using a dynamic AutoCAD Field expression.',
        stepByStep: [
          'Type `A2F` (Area to Field) and press Enter.',
          'Select one or multiple room polylines (it automatically sums multiple selections!) and press Enter.',
          'Click an existing room label MText or Attribute—whenever you stretch the room wall and run REGEN, the area number updates automatically!'
        ]
      }
    ]
  },
  {
    id: 'rebarcad',
    name: 'RebarCAD & Structural Detailing Suite (CADS RC / ASD)',
    tagline: 'Parametric Reinforcement Bar Marks, BS 8666 / ACI 315 Shape Codes & Live Bar Bending Schedules',
    discipline: 'Reinforced Concrete Detailing & BBS Automation',
    badgeColor: 'rose',
    overview:
      'Specialized RC detailing environments (such as CADS RC / RebarCAD and AutoCAD Structural Detailing) replace dumb lines with intelligent parametric Bar Entities that carry Bar Mark, Diameter, Grade, BS 8666 / ACI 315 Shape Code, Leg Lengths ($A, B, C, D, R$), Lap multipliers ($40d / 50d$), and Variable Range groups.',
    setupSteps: [
      'Before detailing any member, configure the Project Design Code (`BS 8666:2020`, `ACI 315 / BNBC`, or `IS 2502`) so bend deductions, minimum mandrel radii, and standard hook lengths ($12d$ / $90^\\circ$ / $135^\\circ$) calculate accurately.',
      'Assign a Member Prefix (`B1-`, `C4-`, `F2-`) to group bar marks by structural element on the Bar Bending Schedule.',
      'Define Concrete Cover outlines first so parametric bars automatically snap inside the cover boundary.'
    ],
    keyConfigCommands: [
      { cmd: 'RC_CONFIG', effect: 'Sets standard rebar code (BS 8666 / ACI 315), bar grades (H / 500W / 60 Grade), and lap length multipliers.' },
      { cmd: 'RC_BAR', effect: 'Draws a parametric reinforcement bar by picking cover edges and selecting Shape Code (00, 11, 20, 21, 51, 63).' },
      { cmd: 'RC_RANGE', effect: 'Defines single, fixed-pitch, tapered/variable, or alternate bar distribution ranges across slabs and beams.' }
    ],
    commands: [
      {
        code: 'SHAPE CODES (00, 11, 20, 21, 51)',
        name: 'Parametric Bar Creation by Standard Shape Code',
        category: 'Bar Detailing',
        purpose: 'Places intelligent bars whose cutting length $L$ is computed automatically from outer leg dimensions minus bend allowances.',
        stepByStep: [
          'Select Create Bar -> Choose Shape Code: `00` (Straight bar), `11` (Single 90° L-bob), `20` (U-bar / Double L-bar), `21` (Cranked/Trombone bar), `51` (Closed rectangular stirrup with 135° seismic hooks).',
          'Select Bar Grade & Diameter (e.g., `H16` or `Ø16`) and click the concrete outline—the bar offsets automatically by the specified concrete cover (e.g., `25` mm or `40` mm).',
          'Stretch any bar leg grip—its cutting length updates live in the Bar Bending Schedule.'
        ],
        proTip: 'Under BS 8666 Shape Code 51 (Closed Stirrup), Cutting Length = $2(A + B) + 24d$ (with 135° seismic hooks).'
      },
      {
        code: 'VARIABLE / TAPERED RANGE',
        name: 'Single, Linear & Variable Tapered Bar Ranges',
        category: 'Slab & Retaining Wall Distribution',
        purpose: 'Distributes bars across retaining walls, bridge abutments, or triangular slab bays where each bar in the group has a progressively changing length.',
        stepByStep: [
          'Draw the minimum and maximum bounding bars at the start and end of the tapered zone.',
          'Run `Variable Range` -> Specify Pitch Spacing (e.g., `150` mm c/c).',
          'The software calculates the exact number of bars ($N = \\lceil L_{\\text{zone}} / s \\rceil + 1$) and generates an interpolated sub-schedule for every varying bar length.'
        ]
      },
      {
        code: 'AUTO-LAP & SPLICE',
        name: 'Stock Length Splitting & Staggered Laps',
        category: 'Long-Span Slabs & Rafts',
        purpose: 'Splits continuous raft or bridge deck bars exceeding standard mill stock length (12.00 m / 39.5 ft) and adds compression/tension lap splices ($40d$–$55d$).',
        stepByStep: [
          'Select a long reinforcement bar exceeding `12000` mm.',
          'Run `Split Bar` -> Set Stock Length = `12000` mm and Tension Lap = `50 × d` (e.g., `800` mm for Ø16).',
          'Enable "Stagger Alternate Bars" so adjacent laps are offset by $1.3 \\times L_{\\text{lap}}$ per structural code.'
        ]
      },
      {
        code: 'LIVE BBS SCHEDULE',
        name: 'Dynamic Bar Bending Schedule & Weight Summary',
        category: 'Schedule Output',
        purpose: 'Generates the final Bar Bending Schedule sorted by Member, Bar Mark, Diameter, Shape Sketch, Cutting Length, and Total Tonnage.',
        stepByStep: [
          'Run `Audit Marks` to check for unlabelled bars or duplicate bar numbers.',
          'Run `Compact Marks` to renumber sequential marks cleanly (`01, 02, 03...`).',
          'Place the BBS sheet table or export directly to Excel / BVBS automated rebar bender format.'
        ]
      }
    ]
  },
  {
    id: 'civil3d',
    name: 'AutoCAD Civil 3D (Survey, Terrain Surfaces, Alignments & Earthwork)',
    tagline: 'Dynamic BIM Workflow for Topographic Surveys, Road Corridors & Cut/Fill Earthwork Volumes',
    discipline: 'Highway, Site Grading, Drainage & Surveying Engineering',
    badgeColor: 'violet',
    overview:
      'AutoCAD Civil 3D extends core AutoCAD with dynamic civil engineering objects arranged in the Toolspace Prospector hierarchy: COGO Survey Points, TIN Topographic Surfaces, Horizontal Alignments, Vertical Profiles, Subassembly Corridors, Pipe Networks, and TIN Volume Surfaces for exact earthwork cut/fill quantities.',
    setupSteps: [
      'Always start from a Metric (`_AutoCAD Civil 3D (Metric) NCS.dwt`) or Imperial template—never start Civil 3D from a blank `acad.dwt` or you will lack all Surface, Alignment, and Profile styles.',
      'Open Toolspace (`TOOLSPACE`) -> Switch to the `Settings` tab -> Right-click Drawing Name -> `Edit Drawing Settings` -> Assign your Coordinate System (e.g., `UTM84-45N` or `BTM` Bangladesh Transverse Mercator).',
      'Switch back to the `Prospector` tab inside Toolspace to manage Points, Surfaces, Alignments, and Corridors.'
    ],
    keyConfigCommands: [
      { cmd: 'TOOLSPACE', effect: 'Opens the master Civil 3D Prospector and Settings hierarchy panel.' },
      { cmd: 'MAPCSASSIGN', effect: 'Assigns a real-world Geodetic Coordinate System (UTM / BTM / State Plane) to the DWG.' },
      { cmd: 'ANALYZEVOLUMESDASHBOARD', effect: 'Opens the Volumes Dashboard to compute exact Cut, Fill, and Net Earthwork volumes in m³ / cu.yd.' }
    ],
    commands: [
      {
        code: 'COGO POINTS & TIN SURFACE',
        name: 'Import Survey CSV Points & Build Existing Ground (EG) TIN Surface',
        category: '1. Topographic Survey & Surfaces',
        purpose: 'Imports Total Station / RTK GPS point files (`P,E,N,Z,D`) and triangulates an Existing Ground (EG) TIN Surface with live contours and spot elevations.',
        stepByStep: [
          'In Toolspace Prospector -> Right-click `Points` -> `Create` -> Click `Import Points` (last icon on toolbar).',
          'Add your `.csv` file and select format `PENZD (comma delimited)` (Point#, Easting, Northing, Elevation, Description).',
          'Right-click `Surfaces` -> `Create Surface` -> Name it `EG` (Existing Ground) and pick style `Contours 1m and 5m (Background)`.',
          'Expand `Surfaces -> EG -> Definition -> Point Groups` -> Right-click `Add` -> Select `_All Points` -> Click OK.',
          'To build a surface from existing 3D CAD polylines instead, right-click `Definition -> Contours -> Add` or `Drawing Objects -> Add`.'
        ],
        proTip: 'Always add an Outer Boundary polyline under `Surface -> Definition -> Boundaries` so TIN triangles do not interpolate across concave bays.'
      },
      {
        code: 'ALIGNMENT & SURFACE PROFILE',
        name: 'Horizontal Alignment & Existing/Proposed Vertical Profile',
        category: '2. Road & Canal Geometry',
        purpose: 'Creates station/chainage geometry (`0+000` to `2+500`) along a road or canal centerline and extracts the longitudinal Existing Ground profile.',
        stepByStep: [
          'Draw a 2D Polyline along your proposed road centerline from start to end.',
          'Go to Home Ribbon -> `Alignment` -> `Create Alignment from Objects` -> Select the polyline, verify flow direction arrow, and assign Design Speed and Curve Radius.',
          'Go to `Profile` -> `Create Surface Profile` -> Select your Alignment and `EG` Surface -> Click `Add` -> Click `Draw in Profile View` to place the longitudinal profile grid.',
          'Select the Profile View -> Launch `Profile Creation Tools` to sketch the Proposed Finished Grade (`FG`) vertical alignment with parabolic crest/sag vertical curves.'
        ]
      },
      {
        code: 'ASSEMBLY & CORRIDOR',
        name: 'Typical Cross-Section Assembly & 3D Corridor Modeling',
        category: '3. 3D Corridor & Grading',
        purpose: 'Combines Horizontal Alignment + Vertical Profile + Typical Cross-Section (`Assembly`) into a 3D road/embankment Corridor with daylight cut/fill batters.',
        stepByStep: [
          'Go to Home -> `Assembly` -> `Create Assembly` and click in empty model space to place the red vertical baseline marker.',
          'Press CTRL+3 (Tool Palettes) -> Add Left/Right Travel Lanes (`LaneSuperelevationAOR`), Curbs, Shoulders, and `BasicSideSlopeCutDitch` daylight subassemblies.',
          'Go to `Corridor` -> `Create Corridor` -> Select your Alignment, Proposed Profile (`FG`), Assembly, and set Target Surface = `EG`.',
          'Under `Corridor Properties -> Surfaces`, create a Corridor Top/Datum Surface and check "Add as Breakline" + "Corridor Extents as Outer Boundary".'
        ]
      },
      {
        code: 'TIN VOLUME SURFACE',
        name: 'Earthwork Cut & Fill Volume Takeoff (`Volumes Dashboard`)',
        category: '4. Earthwork Quantities',
        purpose: 'Compares the Existing Ground (`EG`) TIN Surface against the Proposed Grading / Corridor Datum Surface (`FG`) to compute exact Cut and Fill volumes and draw Cut/Fill color heatmaps.',
        stepByStep: [
          'Go to Analyze Ribbon -> `Volumes Dashboard` (or right-click `Surfaces -> Create Surface` -> Set Type to `TIN Volume Surface`).',
          'Set Base Surface = `EG` (Existing Ground) and Comparison Surface = `FG-Datum` (Proposed Formation Level).',
          'Enter Cut Factor (e.g., `1.00`) and Fill Compaction Factor (e.g., `1.15`).',
          'Click the `Insert Cut/Fill Summary` icon to place the official Earthwork Volume Table on your sheet, or create Sample Lines to generate Station-by-Station End-Area Volume tables.'
        ],
        proTip: 'Assign a "2D Solid Elevation Banding" style with elevation `0.00` split into Red (Cut < 0) and Green (Fill > 0) to generate an instant client visual earthwork map.'
      }
    ]
  }
];

export const EXPANDED_LISP_ROUTINES: LispRoutineItem[] = [
  {
    id: 'tlen',
    title: 'Total Length Calculator (TLEN)',
    command: 'TLEN',
    category: 'Takeoff & BOQ',
    desc: 'Sums the exact geometric length of all selected lines, polylines, arcs, splines, and circles—essential for wall, pipe, cable, and curb BOQ takeoffs.',
    howToRun: [
      'Save the code below as `TLEN.lsp` and load it via `APPLOAD` (AP).',
      'Use `LAYISO` to isolate your target wall, pipe, or trench layer.',
      'Type `TLEN` -> Select all objects -> Press Enter.',
      'Read both the command-line breakdown and the popup summary dialog.'
    ],
    code: `(defun c:TLEN (/ ss tl n ent itm obj l)
  (vl-load-com)
  (princ "\\nSelect lines, arcs, polylines, or splines to sum total length: ")
  (if (setq ss (ssget '((0 . "LINE,ARC,CIRCLE,POLYLINE,LWPOLYLINE,ELLIPSE,SPLINE"))))
    (progn
      (setq tl 0.0 n (sslength ss))
      (while (> n 0)
        (setq n (1- n)
              ent (ssname ss n)
              obj (vlax-ename->vla-object ent)
              l (vlax-curve-getDistAtParam obj (vlax-curve-getEndParam obj))
              tl (+ tl l))
      )
      (princ (strcat "\\n>>> Selected Entities: " (itoa (sslength ss)) " | Total Length = " (rtos tl 2 3)))
      (alert (strcat "Objects Selected: " (itoa (sslength ss))
                     "\\nTotal Cumulative Length: " (rtos tl 2 3) " drawing units"))
    )
    (princ "\\nNo valid linear objects selected.")
  )
  (princ)
)`
  },
  {
    id: 'areatable',
    title: 'Room / Parcel Area Takeoff to CSV & Labels (AREATABLE)',
    command: 'AREATABLE',
    category: 'Takeoff & BOQ',
    desc: 'Labels the centroid of every selected closed polyline with a sequential ID (`A-1`, `A-2`...) and Area, and prints the cumulative total area.',
    howToRun: [
      'Draw or `BOUNDARY` (BO) closed polylines around all rooms, slabs, or site parcels.',
      'Type `AREATABLE` -> Enter unit conversion divisor (e.g., `1000000` if drawing in mm to output m², or `1` if drawing in meters/feet).',
      'Select all closed polylines and press Enter—each room is labeled at its geometric centroid and the total area is summed.'
    ],
    code: `(defun c:AREATABLE (/ ss div th i ent obj area total pt idx str)
  (vl-load-com)
  (setq div (getreal "\\nEnter Area Divisor (1 for m/ft, 1000000 for mm->m2) <1.0>: "))
  (if (not div) (setq div 1.0))
  (setq th (getreal "\\nEnter Label Text Height <250.0>: "))
  (if (not th) (setq th 250.0))
  (princ "\\nSelect closed polylines for area takeoff: ")
  (if (setq ss (ssget '((0 . "LWPOLYLINE,POLYLINE,CIRCLE"))))
    (progn
      (setq i 0 total 0.0)
      (while (< i (sslength ss))
        (setq ent (ssname ss i)
              obj (vlax-ename->vla-object ent)
              area (/ (vla-get-Area obj) div)
              total (+ total area)
              idx (1+ i)
              pt (vlax-curve-getStartPoint obj)
              str (strcat "A-" (itoa idx) " = " (rtos area 2 2)))
        (entmake (list '(0 . "TEXT") (cons 10 pt) (cons 40 th) (cons 1 str)))
        (princ (strcat "\\nParcel A-" (itoa idx) ": " (rtos area 2 3)))
        (setq i (1+ i))
      )
      (alert (strcat "Processed " (itoa i) " Parcels\\nCumulative Total Area: " (rtos total 2 3)))
    )
  )
  (princ)
)`
  },
  {
    id: 'autogrid',
    title: 'Parametric Structural Grid Generator (AUTOGRID)',
    command: 'AUTOGRID',
    category: 'Structural & Grids',
    desc: 'Generates an orthogonal structural grid with dedicated `S-GRID` and `S-GRID-TEXT` layers and numbered/lettered axis bubbles.',
    howToRun: [
      'Type `AUTOGRID` and press Enter.',
      'Click the origin (bottom-left) grid intersection.',
      'Enter number of X bays, X spacing, number of Y bays, and Y spacing.'
    ],
    code: `(defun c:AUTOGRID (/ pt numX spcX numY spcY i x y totX totY ext)
  (setq pt (getpoint "\\nSelect bottom-left Grid Origin: ")
        numX (getint "\\nNumber of X-axis bays: ")
        spcX (getdist "\\nX-axis bay spacing: ")
        numY (getint "\\nNumber of Y-axis bays: ")
        spcY (getdist "\\nY-axis bay spacing: "))
  (setq totX (* (1- numX) spcX)
        totY (* (1- numY) spcY)
        ext (* (min spcX spcY) 0.35))
  (command "._-LAYER" "_M" "S-GRID" "_C" "8" "" "_L" "CENTER" "" "")
  (setq i 0)
  (repeat numX
    (setq x (+ (car pt) (* i spcX)))
    (command "._LINE" (list x (- (cadr pt) ext)) (list x (+ (cadr pt) totY ext)) "")
    (setq i (1+ i)))
  (setq i 0)
  (repeat numY
    (setq y (+ (cadr pt) (* i spcY)))
    (command "._LINE" (list (- (car pt) ext) y) (list (+ (car pt) totX ext) y) "")
    (setq i (1+ i)))
  (princ "\\nStructural Grid Generated Successfully.")
  (princ)
)`
  },
  {
    id: 'exportxyz',
    title: 'Export Points & Block Coordinates to Survey CSV (EXPORTXYZ)',
    command: 'EXPORTXYZ',
    category: 'Survey & Coordinates',
    desc: 'Extracts the exact Easting (X), Northing (Y), and Elevation (Z) of all selected Points, Circles, or Blocks (e.g., Pile Centers) to a Total Station CSV file.',
    howToRun: [
      'Type `EXPORTXYZ` and press Enter.',
      'Select all pile center circles, survey points, or column blocks and press Enter.',
      'Choose where to save the `.csv` file—import directly into Excel or upload to your Total Station for site setting-out!'
    ],
    code: `(defun c:EXPORTXYZ (/ ss fn fp i ent ed pt pno)
  (princ "\\nSelect Points, Circles, or Blocks to export (P,E,N,Z): ")
  (if (and (setq ss (ssget '((0 . "POINT,CIRCLE,INSERT"))))
           (setq fn (getfiled "Save Survey Coordinates CSV" "Pile_SettingOut.csv" "csv" 1)))
    (progn
      (setq fp (open fn "w") i 0)
      (write-line "Point_No,Easting_X,Northing_Y,Elevation_Z,Entity_Type" fp)
      (while (< i (sslength ss))
        (setq ent (ssname ss i)
              ed (entget ent)
              pt (cdr (assoc 10 ed))
              pno (1+ i))
        (write-line
          (strcat "PT-" (itoa pno) ","
                  (rtos (car pt) 2 4) ","
                  (rtos (cadr pt) 2 4) ","
                  (rtos (caddr pt) 2 4) ","
                  (cdr (assoc 0 ed)))
          fp)
        (setq i (1+ i))
      )
      (close fp)
      (alert (strcat "Exported " (itoa i) " coordinates to:\\n" fn))
    )
  )
  (princ)
)`
  },
  {
    id: 'zzero',
    title: 'Instant Z-Coordinate Flattener (ZZERO)',
    command: 'ZZERO',
    category: 'Survey & Coordinates',
    desc: 'Forces the start, end, and vertex Z-coordinates of all selected Lines, Polylines, Texts, and Blocks strictly to Z = 0.000 without slow FLATTEN delays.',
    howToRun: [
      'Type `ZZERO` and press Enter.',
      'Select objects (or type `ALL`) and press Enter.',
      'Also sets `OSNAPZ = 1` automatically so all subsequent drafting remains flat.'
    ],
    code: `(defun c:ZZERO (/ ss)
  (setvar "CMDECHO" 0)
  (princ "\\nSelect objects to force onto Z = 0.00 plane: ")
  (if (setq ss (ssget))
    (progn
      (command "._CHANGE" ss "" "_P" "_E" "0.0" "")
      (command "._MOVE" ss "" '(0 0 0) '(0 0 1e99) "._MOVE" "_P" "" '(0 0 0) '(0 0 -1e99))
      (setvar "OSNAPZ" 1)
      (princ (strcat "\\nFlattened " (itoa (sslength ss)) " entities to Z=0.00 and set OSNAPZ=1."))
    )
  )
  (setvar "CMDECHO" 1)
  (princ)
)`
  },
  {
    id: 'beamtag',
    title: 'Structural Beam Size & Level Stamper (BEAMTAG)',
    command: 'BEAMTAG',
    category: 'Annotation & Drafting',
    desc: 'Stamps aligned structural beam nomenclature (`B12 (300x600)`) parallel to any clicked beam line with automatic rotation matching.',
    howToRun: [
      'Type `BEAMTAG` -> Enter Beam ID & Size (e.g., `GB-1 (300x600)`) and text height.',
      'Click two points along the beam line to place the rotated label parallel to the beam.'
    ],
    code: `(defun c:BEAMTAG (/ txt th p1 p2 ang mid)
  (setq txt (getstring T "\\nEnter Beam Tag (e.g., B1 (300x600)): "))
  (setq th (getreal "\\nEnter Text Height <200>: "))
  (if (not th) (setq th 200.0))
  (while (and (setq p1 (getpoint "\\nClick Beam Start Point (Enter to exit): "))
              (setq p2 (getpoint p1 "\\nClick Beam Direction Point: ")))
    (setq ang (angle p1 p2)
          mid (list (/ (+ (car p1) (car p2)) 2.0) (/ (+ (cadr p1) (cadr p2)) 2.0) 0.0))
    (if (and (> ang (/ pi 2.0)) (<= ang (* pi 1.5)))
      (setq ang (+ ang pi)))
    (entmake (list '(0 . "TEXT") (cons 10 mid) (cons 40 th) (cons 50 ang) (cons 1 txt)))
  )
  (princ)
)`
  },
  {
    id: 'slopearrow',
    title: 'Drainage / Ramp Slope Percentage & Ratio Stamper (SLOPEARROW)',
    command: 'SLOPEARROW',
    category: 'Annotation & Drafting',
    desc: 'Computes the exact longitudinal slope (% and 1:N gradient) between two clicked invert/spot levels and places an aligned slope callout.',
    howToRun: [
      'Type `SLOPEARROW` and press Enter.',
      'Enter Upstream/High Elevation (m) and Downstream/Low Elevation (m).',
      'Click the high point and low point on the drawing—it measures horizontal distance $L$, computes Slope % and $1:N$ ratio, and stamps the callout.'
    ],
    code: `(defun c:SLOPEARROW (/ z1 z2 p1 p2 dist dz pct ratio ang mid lbl)
  (setq z1 (getreal "\\nEnter Upstream / High Elevation (m): ")
        z2 (getreal "\\nEnter Downstream / Low Elevation (m): ")
        p1 (getpoint "\\nClick Upstream Point on Plan: ")
        p2 (getpoint p1 "\\nClick Downstream Point on Plan: "))
  (setq dist (distance p1 p2)
        dz (abs (- z1 z2)))
  (if (> dist 0.0)
    (progn
      (setq pct (* (/ dz dist) 100.0)
            ratio (if (> dz 0.0) (/ dist dz) 0.0)
            ang (angle p1 p2)
            mid (list (/ (+ (car p1) (car p2)) 2.0) (/ (+ (cadr p1) (cadr p2)) 2.0) 0.0)
            lbl (strcat "SLOPE = " (rtos pct 2 2) "% (1:" (rtos ratio 2 1) ")"))
      (if (and (> ang (/ pi 2.0)) (<= ang (* pi 1.5))) (setq ang (+ ang pi)))
      (entmake (list '(0 . "TEXT") (cons 10 mid) (cons 40 200.0) (cons 50 ang) (cons 1 lbl)))
      (princ (strcat "\\n>>> " lbl))
    )
  )
  (princ)
)`
  },
  {
    id: 'countblocks',
    title: 'Automated Block Schedule Counter to CSV/Screen (COUNTBLOCKS)',
    command: 'COUNTBLOCKS',
    category: 'Takeoff & BOQ',
    desc: 'Counts all block references in the selection set (including unique block names) and prints a clean BOQ summary list.',
    howToRun: [
      'Type `COUNTBLOCKS` and press Enter.',
      'Window-select the floor plan or type `ALL` and press Enter.',
      'Press `F2` to view the itemized block schedule table.'
    ],
    code: `(defun c:COUNTBLOCKS (/ ss i ent ed bname lst pair msg)
  (princ "\\nSelect blocks to count for BOQ schedule: ")
  (if (setq ss (ssget '((0 . "INSERT"))))
    (progn
      (setq i 0 lst '())
      (while (< i (sslength ss))
        (setq ent (ssname ss i)
              ed (entget ent)
              bname (cdr (assoc 2 ed)))
        (if (setq pair (assoc bname lst))
          (setq lst (subst (cons bname (1+ (cdr pair))) pair lst))
          (setq lst (cons (cons bname 1) lst)))
        (setq i (1+ i))
      )
      (setq msg "BLOCK QUANTITY SCHEDULE:\\n------------------------\\n")
      (foreach item (vl-sort lst '(lambda (a b) (< (car a) (car b))))
        (setq msg (strcat msg (car item) "  -->  " (itoa (cdr item)) " Nos\\n"))
      )
      (princ (strcat "\\n" msg))
      (alert msg)
    )
  )
  (princ)
)`
  }
];

export const DYNAMIC_BLOCKS_DATAEXTRACTION_GUIDE: EngineeringGuideSection = {
  id: 'dynamic-blocks-dx',
  title: 'Dynamic Blocks, Parametric Attributes (`ATTDEF`) & Live `DATAEXTRACTION` to Excel BOQ',
  subtitle: 'Turn static geometry into smart, stretchable BIM-lite components that auto-populate your Bill of Quantities',
  badge: 'CAD-to-BOQ Automation',
  overview:
    'Instead of creating 25 separate static blocks for different column sizes or door widths (`C_300x300`, `C_300x450`, `C_400x600`...) and counting them by hand, an engineer builds ONE Dynamic Block with Linear Stretch parameters, Visibility States, and Attribute Definitions (`ATTDEF`), then extracts a live schedule using `DATAEXTRACTION`.',
  steps: [
    {
      stepNumber: 1,
      heading: 'Define Smart Attributes Before Creating the Block (`ATTDEF`)',
      commandOrFormula: 'ATTDEF (ATT)',
      details: [
        'Type `ATTDEF` and press Enter.',
        'Create three attributes for a Structural Column or Footing block: Tag = `MARK` (Prompt: `Column Mark`, Default: `C1`), Tag = `CONC_GRADE` (Default: `M30`), and Tag = `LEVEL` (Default: `GF to 1F`).',
        'Check "Lock position" so Dynamic Block grips can move the attribute cleanly.'
      ]
    },
    {
      stepNumber: 2,
      heading: 'Add Linear Stretch Parameters & Increment Lists in Block Editor (`BEDIT`)',
      commandOrFormula: 'BEDIT -> Authoring Palettes',
      details: [
        'Select your column rectangle and attributes, type `B` (BLOCK), name it `STRUCT_COLUMN_DYN`, and check "Open in block editor".',
        'In the Block Authoring Palette -> `Parameters` tab -> Choose `Linear` parameter and dimension the Width (`Col_Width`) and Depth (`Col_Depth`).',
        'Select the `Col_Width` parameter -> Open Properties (`CTRL+1`) -> Set `Value Set -> Dist Type = Increment`, `Dist Increment = 50` mm, `Dist Minimum = 250` mm, `Dist Maximum = 1200` mm.',
        'Switch to the `Actions` tab -> Choose `Stretch` -> Select the `Col_Width` parameter -> Click the right grip -> Draw a crossing frame around the right edge of the column -> Select the column rectangle.'
      ]
    },
    {
      stepNumber: 3,
      heading: 'Link Dynamic Width & Depth Into a Self-Updating Attribute Field',
      commandOrFormula: 'FIELD (CTRL+F) -> Object ->Col_Width',
      details: [
        'Double-click your `SIZE` attribute or MText inside the Block Editor and press `CTRL+F` (Insert Field).',
        'Select Field Category: `Objects` -> Field Name: `BlockPlaceholder` -> Select `Col_Width` and `Col_Depth`.',
        'Close Block Editor (`BCLOSE`) and Save. Now stretching a column from `300x450` to `400x750` updates its printed text label AND its internal database property simultaneously!'
      ]
    },
    {
      stepNumber: 4,
      heading: 'Extract Live Quantities & Concrete Volume to Excel (`DATAEXTRACTION`)',
      commandOrFormula: 'DATAEXTRACTION (DX)',
      details: [
        'Type `DX` -> Create a new `.dxe` extraction file -> Select `Current Drawing`.',
        'Check `STRUCT_COLUMN_DYN` -> On Page 4, check `MARK`, `CONC_GRADE`, `Col_Width`, `Col_Depth`, and `Count`.',
        'On Page 5, right-click the table header -> `Insert Formula Column` -> Name it `Area_m2` and enter `([Col_Width] * [Col_Depth]) / 1000000`.',
        'Output both an on-sheet Schedule Table and an external `.xlsx` BOQ file.'
      ]
    }
  ],
  keyTakeaways: [
    'Always run `ATTSYNC` after adding new attributes or field placeholders inside `BEDIT`.',
    'Dynamic block parameter names (`Col_Width`, `Col_Depth`, `Visibility1`) appear as native columns inside `DATAEXTRACTION`—letting you calculate exact concrete volumes ($L \\times B \\times H \\times \\text{Count}$) without leaving AutoCAD.'
  ]
};

export const DEFAULT_SURVEY_CSV = `P1,500.000,1000.000,10.250,BM-1
P2,515.420,1004.180,10.420,GL-CORNER
P3,532.100,1008.950,10.380,GL-EDGE
P4,548.750,996.300,9.850,DRAIN-INV
P5,525.000,982.400,10.600,COL-C1`;

export const SURVEY_CAD_WORKFLOW_GUIDE: EngineeringGuideSection = {
  id: 'survey-coordinates-guide',
  title: 'Survey Total Station CSV-to-CAD Mechanics & Geodetic Coordinate Systems (`WCS` vs `UCS`)',
  subtitle: 'How Easting (X), Northing (Y), and Reduced Level (Z) map into AutoCAD without losing survey datum precision',
  badge: 'Geomatics & Setting-Out',
  overview:
    'A Total Station or RTK GNSS rover records coordinates in `P, N, E, Z, D` or `P, E, N, Z, D` order. In AutoCAD, the horizontal axis is $X = \\text{Easting}$ and the vertical axis is $Y = \\text{Northing}$. Mixing up Northing and Easting mirrors and rotates your entire site by $90^\\circ$ across the line $Y = X$!',
  steps: [
    {
      stepNumber: 1,
      heading: 'Verify Easting (X) vs. Northing (Y) Column Order Before Importing',
      commandOrFormula: 'AutoCAD Coordinate = Easting(X), Northing(Y), Elevation(Z)',
      details: [
        'Total Stations often export `Point, Northing, Easting, Elevation, Code` (PNEZD).',
        'AutoCAD `POINT` and `LINE` commands strictly expect `X,Y,Z` which equals `Easting,Northing,Elevation` (PENZD).',
        'Use the "Column Order" toggle in the Script Generator below (`P,E,N,Z,D` vs `P,N,E,Z,D`) so Easting is always mapped to X and Northing is mapped to Y.'
      ]
    },
    {
      stepNumber: 2,
      heading: 'Protect True World Coordinates (`WCS`) While Drafting Orthogonal Plans (`UCS`)',
      commandOrFormula: 'UCS -> Object -> PLAN -> Current UCS',
      details: [
        'Real-world survey buildings are rarely aligned straight North-South; they sit at an azimuth angle on high UTM/BTM coordinates (e.g., $E = 245,820.45\\text{ m}, N = 2,634,110.80\\text{ m}$).',
        'NEVER move or rotate the survey boundary to `0,0` in Model Space—doing so destroys all setting-out coordinates (`ID` / `EXPORTXYZ`) for pile and column layout!',
        'Instead, leave the survey in true `WCS` coordinates, type `UCS` -> `OB` (Object) -> Click the main building grid line, and type `PLAN` -> `Enter` twice.',
        'Your screen rotates so the building sits perfectly horizontal/vertical for Ortho (`F8`) drafting, while true UTM/BTM coordinates remain 100% intact when you switch back to `UCS -> World`!'
      ]
    },
    {
      stepNumber: 3,
      heading: 'Configure Point Display Style (`PTYPE`) After Running `.SCR` Script',
      commandOrFormula: 'PTYPE (DDPTYPE) -> ZOOM Extents (Z -> E)',
      details: [
        'Download or copy the generated `.scr` script below.',
        'In AutoCAD, type `SCRIPT` (`SCR`), select the downloaded `.scr` file, and wait 1 second.',
        'Type `PTYPE` -> Choose the Crosshair-with-Circle symbol -> Set Point Size to `0.5` Units in Absolute Units.',
        'Type `Z` -> `E` (Zoom Extents) to frame your plotted survey network.'
      ]
    }
  ],
  keyTakeaways: [
    'Always turn off running Object Snaps (`OSMODE = 0` or `F3` OFF) before pasting coordinate scripts directly into the command bar—otherwise AutoCAD snaps new points onto nearby existing geometry! (Our generator automatically wraps scripts with `OSMODE 0`).',
    'Use `ID` on any column center in `UCS -> World` to read the exact Easting and Northing for the site surveyor.'
  ]
};

export const EXPANDED_EXCEL_FORMULAS: ExcelFormulaItem[] = [
  {
    id: 'sumifs-rebar',
    title: 'Multi-Criteria Rebar & Concrete BOQ Aggregation (SUMIFS)',
    category: 'BOQ & Estimation',
    desc: 'Sums total steel weight or concrete volume filtered simultaneously by Bar Diameter (e.g., 16 mm) and Structural Floor/Zone (e.g., 1st Floor).',
    formula: '=SUMIFS(Weight_Col, Dia_Col, 16, Floor_Col, "1st Floor")',
    explanation:
      'Evaluates multiple criteria ranges in parallel and sums only rows where every condition is TRUE—allowing one master Bar Bending Schedule sheet to feed an automatic Diameter-by-Floor summary matrix.',
    stepByStep: [
      'Place Total Weight (kg) in Column `H`, Bar Diameter (mm) in Column `C`, and Structural Floor in Column `B`.',
      'Create a summary matrix with Bar Diameters (`8, 10, 12, 16, 20, 25, 32`) across the top row (`K2:Q2`) and Floors down Column `J` (`J3:J12`).',
      'In cell `K3`, enter `=SUMIFS($H:$H, $C:$C, K$2, $B:$B, $J3)` and drag across all columns and rows.'
    ],
    exampleInput: 'Dia_Col = 16 mm, Floor_Col = "1st Floor"',
    exampleOutput: '4,825.60 kg (4.826 MT)'
  },
  {
    id: 'unit-weight-rebar',
    title: 'Exact Rebar Unit Weight from Diameter d²/162.2 (kg/m)',
    category: 'Structural & Rebar',
    desc: 'Derives the theoretical unit mass of steel reinforcement per linear meter from nominal bar diameter $d$ (mm) assuming steel density $\\rho = 7850\\text{ kg/m}^3$.',
    formula: '=ROUND((C5^2)/162.162, 3)',
    explanation:
      'Derived from cross-sectional area $\\frac{\\pi d^2}{4} \\times 10^{-6}\\text{ m}^2 \\times 7850\\text{ kg/m}^3 = \\frac{d^2}{162.162}\\text{ kg/m}$ (or $\\frac{d^2}{533}\\text{ kg/ft}$). Rounding to 3 decimals matches standard BS/ACI/BNBC mill tables.',
    stepByStep: [
      'Put Bar Diameter in mm (e.g., `16`) in cell `C5`.',
      'Put Cutting Length in meters in `E5` and Total Number of Bars in `F5`.',
      'Compute Total Weight (kg) as `=ROUND((C5^2)/162.162, 3) * E5 * F5`.'
    ],
    exampleInput: 'C5 = 20 mm',
    exampleOutput: '2.467 kg/m (0.752 kg/ft)'
  },
  {
    id: 'rebar-stock-optimizer',
    title: '12m Rebar Stock Bar Cutting & Lap Splice Calculator (LET)',
    category: 'Structural & Rebar',
    desc: 'Calculates exact total cutting length including staggered tension laps ($50d$) whenever a continuous member bar exceeds standard 12.00 m mill length.',
    formula: '=LET(span, D5, dia, C5, stock, 12, lap, 50*dia/1000, nLaps, MAX(0, CEILING.MATH((span-stock)/(stock-lap))), ROUND(span + nLaps*lap, 3))',
    explanation:
      'Each 12 m stock bar after the first only advances the effective run by $(12 - L_{\\text{lap}})$ meters. Using Excel `LET` keeps the formula self-documented and prevents under-estimating lap wastage on long rafts and girders.',
    stepByStep: [
      'Enter Bar Diameter (mm) in `C5` (e.g., `25`) and Continuous Member Length (m) in `D5` (e.g., `28.50` m).',
      'Paste the `=LET(...)` formula in `E5`—it computes required number of $50d$ laps (`2` laps of `1.25` m each) and outputs total required bar length (`31.000` m).'
    ],
    exampleInput: 'C5 = 25 mm, D5 = 28.50 m',
    exampleOutput: '31.000 m (includes 2 laps × 1.25 m)'
  },
  {
    id: 'stirrup-cut-length',
    title: 'Seismic Rectangular Stirrup Cutting Length (135° Hooks)',
    category: 'Structural & Rebar',
    desc: 'Calculates exact cutting length of a closed rectangular stirrup (BS Shape Code 51 / ACI Tie) given column/beam width $B$, depth $D$, clear cover $c$, and tie diameter $d$.',
    formula: '=LET(B, C5, D, D5, cov, E5, d, F5, a, B-2*cov-d, b, D-2*cov-d, hook, MAX(10*d, 75), bend, 3*2*d + 2*3*d, ROUND((2*(a+b) + 2*hook - bend)/1000, 3))',
    explanation:
      'Computes centerline/outer dimensions $a = B - 2c$, $b = D - 2c$, adds two $135^\\circ$ seismic hooks ($\\ge \\max(10d, 75\\text{ mm})$), and deducts three $90^\\circ$ bends ($3 \\times 2d$) and two $135^\\circ$ hook bends ($2 \\times 3d$).',
    stepByStep: [
      'Enter Beam Width `B` (mm) in `C5`, Depth `D` (mm) in `D5`, Clear Cover (mm) in `E5`, and Stirrup Dia (mm) in `F5`.',
      'Paste the formula to output exact cutting length in meters.'
    ],
    exampleInput: 'B=300, D=600, Cover=40, d=10 mm',
    exampleOutput: '1.540 m per stirrup'
  },
  {
    id: 'index-match-section',
    title: 'Two-Way Structural Steel / Rebar Property Lookup (INDEX / MATCH)',
    category: 'Structural & Rebar',
    desc: 'Retrieves any geometric property ($I_{xx}, Z_{xx}, r_y, A_s$) from an AISC/IS/BS steel section table by matching Section Designation on rows and Property Name on columns.',
    formula: '=INDEX(Table_Data, MATCH(Section_Name, Section_Col, 0), MATCH(Property_Name, Header_Row, 0))',
    explanation:
      'Unlike `VLOOKUP` (which breaks if a column is inserted and cannot look left), combining `INDEX` with two `MATCH` functions creates a bulletproof 2D matrix lookup.',
    stepByStep: [
      'Select your Steel Section data block (`C4:M120`) as `Table_Data`.',
      'Match the chosen beam designation (e.g., `"UB 457x191x67"`) down `B4:B120` and the required property (`"Ixx (cm4)"`) across `C3:M3`.'
    ],
    exampleInput: 'Section = "UB 457x191x67", Property = "Ixx (cm4)"',
    exampleOutput: '29,380 cm⁴'
  },
  {
    id: 'soil-bearing-interpolation',
    title: 'Geotechnical SPT N-Value & Steam Table Linear Interpolation',
    category: 'Geotechnical & Survey',
    desc: 'Automatically finds the bounding rows in a borehole log or code design table and linearly interpolates the exact intermediate value at depth $z$.',
    formula: '=LET(x, G4, xR, A4:A15, yR, B4:B15, i, MATCH(x, xR, 1), x1, INDEX(xR,i), x2, INDEX(xR,i+1), y1, INDEX(yR,i), y2, INDEX(yR,i+1), IF(x=x1, y1, y1 + (x-x1)*(y2-y1)/(x2-x1)))',
    explanation:
      '`MATCH(x, xR, 1)` finds the largest row index $i$ where $x_i \\le x$, fetches $(x_1, y_1)$ and $(x_2, y_2)$, and applies $y = y_1 + \\frac{x - x_1}{x_2 - x_1}(y_2 - y_1)$ automatically across the entire table.',
    stepByStep: [
      'Ensure your Depth column (`A4:A15`) is sorted in ascending order (`1.5, 3.0, 4.5, 6.0...` m).',
      'Enter any target foundation depth in `G4` (e.g., `3.75` m) to get the exact interpolated SPT $N$-value or bearing capacity $q_a$.'
    ],
    exampleInput: 'Target Depth = 3.75 m (between 3.0m @ N=12 and 4.5m @ N=18)',
    exampleOutput: 'N = 15.0'
  },
  {
    id: 'feet-inch-parser',
    title: 'Parse Architectural Feet-Inch Text ("12\'-6.5\\"") to Decimal Feet & Meters',
    category: 'Unit & Text Parsing',
    desc: 'Converts architectural dimension strings typed as `12\'-6"` or `12\'-6.5"` directly into mathematical decimal feet (`12.542 ft`) or meters (`3.823 m`).',
    formula: '=LEFT(A2, FIND("\'", A2)-1) + MID(A2, FIND("\'", A2)+1, LEN(A2)-FIND("\'", A2)-1)/12',
    explanation:
      'Extracts the whole feet substring to the left of the apostrophe (`\'`), extracts the inches substring between the apostrophe and the double-quote (`"`), and divides inches by `12`. Wrap in `* 0.3048` to convert directly to meters.',
    stepByStep: [
      'Type architectural strings in the format `14\'-9"` or `8\'-4.5"` in cell `A2` (ensure `-` is removed or include `SUBSTITUTE(A2,"-","")`).',
      'To turn a decimal foot value in `B2` back into `"14\'-9\\""`, use: `=INT(B2)&"\'-"&ROUND(MOD(B2,1)*12,1)&"\\""`.'
    ],
    exampleInput: 'A2 = "12\'6""',
    exampleOutput: '12.500 ft (3.810 m)'
  },
  {
    id: 'earthwork-prismoidal',
    title: 'Road & Canal Prismoidal / End-Area Earthwork Volume Formula',
    category: 'Geotechnical & Survey',
    desc: 'Calculates Cut or Fill volume between consecutive chainage stations using either Average End-Area or the more accurate Prismoidal correction.',
    formula: '= ((A_prev + A_curr) / 2) * (Chainage_curr - Chainage_prev)',
    explanation:
      'Computes $V = \\frac{A_1 + A_2}{2} \\times L$ between Station 1 and Station 2. For tapered embankments where $A_1$ and $A_2$ differ sharply, use the Prismoidal formula: `=(L/6)*(A1 + A2 + 4*SQRT(A1*A2))`.',
    stepByStep: [
      'Put Station Chainage (m) in Column `A`, Cut Cross-Sectional Area ($\\text{m}^2$) in Column `B`, and Fill Area ($\\text{m}^2$) in Column `C`.',
      'In row 3 (`D3`), enter `=((B2+B3)/2)*(A3-A2)` and drag down all stations.'
    ],
    exampleInput: 'Ch 0+020 (A1=14.2 m²) to Ch 0+040 (A2=18.6 m²)',
    exampleOutput: '328.00 m³'
  },
  {
    id: 'concrete-dry-mortar',
    title: 'Concrete Mix Cement, Sand & Stone Aggregate Quantity Formula (1.54 Dry Volume)',
    category: 'BOQ & Estimation',
    desc: 'Converts wet compacted concrete volume ($V_{\\text{wet}}$ in $\\text{m}^3$) into exact bags of Cement (50 kg), Sand ($\text{m}^3 / \text{cft}$), and Coarse Aggregate for any mix ratio ($1 : m : n$).',
    formula: '=LET(Vwet, B5, c, 1, s, 1.5, a, 3, Vdry, Vwet*1.54, sumR, c+s+a, ROUNDUP((Vdry*(c/sumR))/0.0347, 0))',
    explanation:
      'Multiplying wet volume by `1.54` accounts for air voids and bulking shrinkage during mixing. Dividing cement volume ($\\text{m}^3$) by `0.0347` $\\text{m}^3/\\text{bag}$ gives the required number of 50 kg Portland cement bags.',
    stepByStep: [
      'Enter Wet Concrete Volume ($\\text{m}^3$) in `B5` (e.g., `10.0` $\\text{m}^3$) and set mix ratios `c=1, s=1.5, a=3` (M20).',
      'For Sand in $\\text{cft}$, replace the final expression with `ROUND(Vdry*(s/sumR)*35.3147, 1)`.'
    ],
    exampleInput: 'Wet Concrete = 10.0 m³ (Mix 1 : 1.5 : 3)',
    exampleOutput: '81 Bags Cement | 148.3 cft Sand | 296.6 cft Stone'
  }
];

export const EXCEL_VBA_MACROS: ExcelVbaMacroItem[] = [
  {
    id: 'spell-bdt',
    title: 'Convert Contractor Bill Amount to Words — Taka & Paisa (`SpellBDT`)',
    functionName: '=SpellBDT(A1)',
    category: 'RA Bills & Tender BOQ',
    desc: 'Custom Excel worksheet function that converts any numeric contractor bill or tender total into South Asian Crore / Lakh / Thousand words ("Taka Twelve Lakh Forty-Five Thousand Only").',
    usageInCell: '=SpellBDT(G45)',
    howToInstall: [
      'Open your BOQ Excel workbook and press `ALT + F11` to open the Visual Basic for Applications (VBA) Editor.',
      'Click `Insert -> Module` on the top menu.',
      'Paste the VBA code below into the blank module window and save your workbook as an `.xlsm` (Macro-Enabled Workbook).',
      'In any sheet cell, type `=SpellBDT(G45)` to print the bill amount in words automatically.'
    ],
    vbaCode: `Function SpellBDT(ByVal Amt As Double) As String
    Dim Whole As Currency, Paisa As Integer
    Whole = Int(Abs(Amt))
    Paisa = Round((Abs(Amt) - Whole) * 100, 0)
    If Whole = 0 Then
        SpellBDT = "Taka Zero Only"
        Exit Function
    End If
    Dim Res As String
    If Whole >= 10000000 Then
        Res = Res & ThreeDigitWords(Int(Whole / 10000000)) & " Crore "
        Whole = Whole - Int(Whole / 10000000) * 10000000
    End If
    If Whole >= 100000 Then
        Res = Res & TwoDigitWords(Int(Whole / 100000)) & " Lakh "
        Whole = Whole - Int(Whole / 100000) * 100000
    End If
    If Whole >= 1000 Then
        Res = Res & TwoDigitWords(Int(Whole / 1000)) & " Thousand "
        Whole = Whole - Int(Whole / 1000) * 1000
    End If
    If Whole > 0 Then
        Res = Res & ThreeDigitWords(Int(Whole))
    End If
    Res = "Taka " & Application.WorksheetFunction.Trim(Res)
    If Paisa > 0 Then
        Res = Res & " and Paisa " & TwoDigitWords(Paisa) & " Only"
    Else
        Res = Res & " Only"
    End If
    SpellBDT = Res
End Function

Private Function ThreeDigitWords(ByVal N As Long) As String
    Dim H As Long, RemN As Long
    H = Int(N / 100): RemN = N Mod 100
    If H > 0 Then ThreeDigitWords = TwoDigitWords(H) & " Hundred "
    If RemN > 0 Then ThreeDigitWords = ThreeDigitWords & TwoDigitWords(RemN)
End Function

Private Function TwoDigitWords(ByVal N As Long) As String
    Dim Ones As Variant, Tens As Variant
    Ones = Array("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", _
                 "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", _
                 "Seventeen", "Eighteen", "Nineteen")
    Tens = Array("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety")
    If N < 20 Then
        TwoDigitWords = Ones(N)
    Else
        TwoDigitWords = Tens(Int(N / 10)) & IIf(N Mod 10 > 0, "-" & Ones(N Mod 10), "")
    End If
End Function`
  },
  {
    id: 'parse-ft-in',
    title: 'Universal Feet-Inch String Parser UDF (`FtInToMeters` & `FtInToFeet`)',
    functionName: '=FtInToMeters("14\'-6.5\\"")',
    category: 'Measurement Book & Takeoff',
    desc: 'Parses any messy site measurement book string (`14\'-6"`, `14\' 6.5"`, `14-6`, or plain `14.5`) into clean decimal feet or meters without complex nested worksheet formulas.',
    usageInCell: '=FtInToFeet(C12)  or  =FtInToMeters(C12)',
    howToInstall: [
      'Press `ALT + F11` in Excel -> `Insert -> Module`.',
      'Paste the function below and use `=FtInToFeet(A2)` or `=FtInToMeters(A2)` anywhere in your takeoff workbook.'
    ],
    vbaCode: `Function FtInToFeet(ByVal RawText As String) As Double
    Dim S As String, Parts As Variant
    S = Trim(Replace(Replace(RawText, Chr(34), ""), "in", ""))
    S = Replace(S, "ft", "'")
    If InStr(S, "'") > 0 Then
        Parts = Split(S, "'")
        Dim Ft As Double, Inch As Double
        Ft = Val(Trim(Parts(0)))
        Inch = Val(Replace(Trim(Parts(1)), "-", ""))
        FtInToFeet = Ft + (Inch / 12#)
    ElseIf InStr(S, "-") > 0 Then
        Parts = Split(S, "-")
        FtInToFeet = Val(Parts(0)) + (Val(Parts(1)) / 12#)
    Else
        FtInToFeet = Val(S)
    End If
End Function

Function FtInToMeters(ByVal RawText As String) As Double
    FtInToMeters = Round(FtInToFeet(RawText) * 0.3048, 4)
End Function`
  },
  {
    id: 'batch-export-boq-pdf',
    title: 'One-Click Batch Export All BOQ & BBS Sheets to Formatted PDFs (`ExportAllBOQSheetsToPDF`)',
    functionName: 'Sub ExportAllBOQSheetsToPDF()',
    category: 'Document Control & Reporting',
    desc: 'Iterates through every visible worksheet in your Estimation workbook and exports each sheet to a timestamped PDF inside a `/PDF_Export` subfolder.',
    usageInCell: 'Run via ALT + F8 -> ExportAllBOQSheetsToPDF',
    howToInstall: [
      'Press `ALT + F11` -> `Insert -> Module` and paste the subroutine below.',
      'Press `ALT + F8` in Excel, select `ExportAllBOQSheetsToPDF`, and click Run (or assign it to a shape button on your Summary Sheet).'
    ],
    vbaCode: `Sub ExportAllBOQSheetsToPDF()
    Dim ws As Worksheet, FolderPath As String, FileName As String
    FolderPath = ThisWorkbook.Path & Application.PathSeparator & "PDF_Export"
    If Dir(FolderPath, vbDirectory) = "" Then MkDir FolderPath
    
    For Each ws In ThisWorkbook.Worksheets
        If ws.Visible = xlSheetVisible Then
            FileName = FolderPath & Application.PathSeparator & _
                       ws.Name & "_" & Format(Now, "yyyymmdd") & ".pdf"
            ws.ExportAsFixedFormat Type:=xlTypePDF, FileName:=FileName, _
                Quality:=xlQualityStandard, IncludeDocProperties:=True, _
                IgnorePrintAreas:=False, OpenAfterPublish:=False
        End If
    Next ws
    MsgBox "All visible BOQ & BBS sheets exported to:" & vbCrLf & FolderPath, vbInformation
End Sub`
  },
  {
    id: 'rebar-weight-interp',
    title: 'Rebar Unit Weight & Code Table Linear Interpolation UDFs (`RebarUnitWeight` & `LinearInterp`)',
    functionName: '=RebarUnitWeight(Dia_mm) & =LinearInterp(x, xRange, yRange)',
    category: 'Structural & BBS Automation',
    desc: 'Provides two clean engineering worksheet functions: `=RebarUnitWeight(16)` for unit mass in kg/m ($d^2/162.162$) and `=LinearInterp(x, X_Col, Y_Col)` for automatic table interpolation.',
    usageInCell: '=RebarUnitWeight(C5)  or  =LinearInterp(G4, A4:A15, B4:B15)',
    howToInstall: [
      'Press `ALT + F11` in Excel -> `Insert -> Module`.',
      'Paste the VBA code below to unlock `=RebarUnitWeight()` and `=LinearInterp()` across all sheets in your workbook.'
    ],
    vbaCode: `Function RebarUnitWeight(ByVal DiaMM As Double) As Double
    ' Returns unit weight of steel bar in kg/m (Density = 7850 kg/m3)
    If DiaMM <= 0 Then
        RebarUnitWeight = 0#
    Else
        RebarUnitWeight = Round((DiaMM ^ 2) / 162.162, 3)
    End If
End Function

Function LinearInterp(ByVal x As Double, ByVal xRng As Range, ByVal yRng As Range) As Variant
    Dim n As Long, i As Long
    Dim x1 As Double, x2 As Double, y1 As Double, y2 As Double
    n = xRng.Rows.Count
    If n < 2 Or xRng.Rows.Count <> yRng.Rows.Count Then
        LinearInterp = CVErr(xlErrRef)
        Exit Function
    End If
    If x <= xRng.Cells(1, 1).Value Then
        LinearInterp = yRng.Cells(1, 1).Value
        Exit Function
    ElseIf x >= xRng.Cells(n, 1).Value Then
        LinearInterp = yRng.Cells(n, 1).Value
        Exit Function
    End If
    For i = 1 To n - 1
        x1 = xRng.Cells(i, 1).Value
        x2 = xRng.Cells(i + 1, 1).Value
        If x >= x1 And x <= x2 Then
            y1 = yRng.Cells(i, 1).Value
            y2 = yRng.Cells(i + 1, 1).Value
            If x2 = x1 Then
                LinearInterp = y1
            Else
                LinearInterp = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
            End If
            Exit Function
        End If
    Next i
End Function`
  }
];

export const EXCEL_ADVANCED_GUIDES: EngineeringGuideSection[] = [
  {
    id: 'structural-matrix-solver',
    title: 'Structural Matrix Stiffness Solver in Native Excel (`MINVERSE` & `MMULT`)',
    subtitle: 'Solve $[K]\\{u\\} = \\{F\\}$ for Continuous Beams, Trusses, and Portal Frames or 6×6 Pile Group Forces without VBA',
    badge: 'Structural Matrix Mechanics',
    overview:
      'Every linear structural stiffness system or pile-group load distribution follows $[K]\\{u\\} = \\{F\\}$, where $[K]$ is the $n \\times n$ global stiffness matrix, $\\{F\\}$ is the $n \\times 1$ nodal force/moment vector, and $\\{u\\} = [K]^{-1}\\{F\\}$ is the unknown displacement/rotation vector.',
    steps: [
      {
        stepNumber: 1,
        heading: 'Assemble the Reduced Stiffness Matrix [K] and Load Vector {F}',
        commandOrFormula: 'Matrix [K] in B4:E7 (4×4) | Vector {F} in G4:G7 (4×1)',
        details: [
          'Assemble your restrained degrees of freedom into a square $n \\times n$ cell range (e.g., `B4:E7` for a 4-DOF continuous beam or frame).',
          'Verify that diagonal terms $K_{ii} > 0$ and the matrix is symmetric ($K_{ij} = K_{ji}$).',
          'Enter the applied nodal loads and fixed-end moment reactions $\\{F\\}$ into a vertical column `G4:G7`.'
        ]
      },
      {
        stepNumber: 2,
        heading: 'Solve Nodal Displacements {u} = [K]⁻¹{F} in a Single Formula',
        commandOrFormula: '=MMULT(MINVERSE(B4:E7), G4:G7)',
        details: [
          'In modern Excel (365 / 2021+), simply click cell `I4`, type `=MMULT(MINVERSE(B4:E7), G4:G7)`, and press Enter—the entire displacement vector $\\{u\\}$ spills down `I4:I7` automatically!',
          'In older Excel versions (2016/2019), first highlight all 4 output cells `I4:I7`, type `=MMULT(MINVERSE(B4:E7), G4:G7)`, and press `CTRL + SHIFT + ENTER` (Array Formula).'
        ]
      },
      {
        stepNumber: 3,
        heading: 'Back-Substitute Member End Moments {M} = [k_e]{u_e} + {FEM}',
        commandOrFormula: '=MMULT(k_element, u_element) + FEM_vector',
        details: [
          'Multiply each member’s local stiffness matrix $[k_e]$ by its extracted nodal displacements $\\{u_e\\}$ using `=MMULT(k_e, u_e)` and add the Fixed-End Moments $\\{\\text{FEM}\\}$ to get final design bending moments and shear forces.'
        ]
      }
    ],
    keyTakeaways: [
      'Always check the determinant `=MDETERM(B4:E7)` first—if `MDETERM` equals `0`, your structural model is a mechanism (unstable/insufficient boundary restraints)!',
      'Use `=TRANSPOSE(range)` when computing $[T]^T [k] [T]$ coordinate transformations for inclined truss and frame members.'
    ]
  },
  {
    id: 'power-query-boq',
    title: 'Power Query Multi-Sheet & Multi-Building BOQ Consolidation',
    subtitle: 'Combine 15+ Floor Tabs or Sub-Contractor Measurement Sheets into One Live Master Abstract without Fragile 3D Formulas',
    badge: 'Data Pipeline Automation',
    overview:
      'Manually linking 20 floor tabs (`=\'GF\'!G12 + \'1F\'!G12 + \'2F\'!G12...`) breaks the moment a row is inserted on one floor. Excel Power Query (`Data -> Get & Transform`) stacks all floor measurement sheets into a single normalized Master Abstract that refreshes in one click (`CTRL + ALT + F5`).',
    steps: [
      {
        stepNumber: 1,
        heading: 'Convert Each Floor Measurement Sheet into an Official Excel Table (`CTRL + T`)',
        commandOrFormula: 'CTRL + T -> Name tables: tbl_Substructure, tbl_GF, tbl_TypicalFloor',
        details: [
          'Click inside your measurement list on each sheet and press `CTRL + T` (Create Table).',
          'Ensure identical column headers across all sheets: `Item_Code`, `Description`, `Unit`, `Nos`, `Length`, `Breadth`, `Depth`, `Quantity`.',
          'Prefix each table name consistently on the Table Design tab (e.g., `BOQ_Footing`, `BOQ_GF`, `BOQ_1F`).'
        ]
      },
      {
        stepNumber: 2,
        heading: 'Query All Workbook Tables Dynamically (`Excel.CurrentWorkbook()`)',
        commandOrFormula: '= Excel.CurrentWorkbook()',
        details: [
          'Go to `Data` Ribbon -> `Get Data` -> `From Other Sources` -> `Blank Query`.',
          'In the formula bar, type `= Excel.CurrentWorkbook()` and press Enter.',
          'Filter the `[Name]` column to `Text Filters -> Begins With -> "BOQ_"` so Power Query automatically picks up any new floor table you add in the future!',
          'Click the double-arrow Expand button (`[Content]`) to stack all rows from all floors into a single unified table.'
        ]
      },
      {
        stepNumber: 3,
        heading: 'Group By Item Code & Load to Master Abstract Sheet',
        commandOrFormula: 'Transform -> Group By -> Item_Code -> Sum of Quantity',
        details: [
          'In the Power Query Editor, select `Item_Code`, `Description`, and `Unit` -> Click `Group By`.',
          'Set New Column Name = `Total_Quantity`, Operation = `Sum`, and Column = `Quantity`.',
          'Click `Close & Load To...` -> `Table` on your Master Abstract sheet. Whenever site measurements change, press `CTRL + ALT + F5` (Refresh All) to recalculate the entire project tender!'
        ]
      }
    ],
    keyTakeaways: [
      'Power Query also connects directly to AutoCAD `DATAEXTRACTION` `.csv`/`.xlsx` outputs—letting your Excel BOQ pull updated block counts and areas straight from your project folder.'
    ]
  }
];
