export type SoftwarePillarId = 'autocad' | 'excel' | 'msproject';

export interface GuidebookTopicItem {
  id: string;
  title: string;
  commandsOrFormulas: string[];
  summary: string;
  mechanics: string;
  guidelines: string[];
  proTip: string;
}

export interface GuidebookChapter {
  id: string;
  pillar: SoftwarePillarId;
  chapterNumber: number;
  title: string;
  subtitle: string;
  topics: GuidebookTopicItem[];
}

export const SOFTWARE_GUIDEBOOK_CHAPTERS: GuidebookChapter[] = [
  // =========================================================================
  // PILLAR 1: AUTOCAD (9 CHAPTERS)
  // =========================================================================
  {
    id: 'acad-ch1',
    pillar: 'autocad',
    chapterNumber: 1,
    title: 'Drawing Setup & Coordinate Systems',
    subtitle: 'UNITS, -DWGUNITS, LIMITS, Grid/Snap, WCS vs. UCS, and Absolute/Relative/Polar Coordinate Entry',
    topics: [
      {
        id: 'acad-1-1',
        title: 'UNITS, -DWGUNITS, LIMITS, Grid (F7) & Snap (F9) Settings',
        commandsOrFormulas: ['UNITS (UN)', '-DWGUNITS', 'LIMITS', 'GRID (F7)', 'SNAP (F9)', 'INSUNITS'],
        summary: 'Establish true 1:1 physical measurement units, insertion scaling, and visual grid calibration before drawing a single line.',
        mechanics:
          '`UNITS` sets display formatting (Decimal, Architectural, Engineering) and `INSUNITS` (block insertion unit), whereas `-DWGUNITS` (with the leading hyphen) sets the internal database metric/imperial scale factor and can automatically rescale existing Model Space geometry.',
        guidelines: [
          'Type `-DWGUNITS` ↵ at the start of every project: choose `3` for Millimeters, `6` for Meters, or `1`/`2` for Inches/Feet.',
          'Set `Scale objects from other drawings upon insert?` to `Yes` so Xrefs in meters automatically scale by 1000 when inserted into a millimeter drawing.',
          'Type `UNITS` (`UN`) ↵ to set Linear Precision (`0` for mm, `0.000` for m) and Angular Type (`Decimal Degrees` or `Deg/Min/Sec` for survey bearings).',
          'Use `F7` to toggle the background Grid and `F9` (`SNAPMODE`) only when laying out modular schematics—keep `F9` OFF during general civil/architectural drafting so your cursor does not jump past Osnap points.',
          'Type `LIMITS` ↵ `0,0` ↵ `50000,35000` (if needed for legacy plotters), then run `ZOOM` -> `All`.'
        ],
        proTip: 'If you ever receive a consultant drawing drawn in Meters and need it in Millimeters, run `-DWGUNITS`, change from `6` to `3`, and answer `Yes` to "Scale objects in current drawing to reflect change in units?".'
      },
      {
        id: 'acad-1-2',
        title: 'World Coordinate System (WCS) & User Coordinate System (UCS)',
        commandsOrFormulas: ['UCS', 'UCS -> W (World)', 'UCS -> OB (Object)', 'PLAN', 'UCSICON', 'UCSFOLLOW'],
        summary: 'Rotate your drafting axes to match skewed building wings or road alignments while preserving true Geodetic Survey coordinates.',
        mechanics:
          'The `WCS` is the permanent, immutable global coordinate origin $(0,0,0)$ used by surveyors and Xrefs. The `UCS` is a movable, rotatable local workplane $(X\', Y\', Z\')$ that redirects `ORTHO` (`F8`), rectangular arrays, and dimensions along any skewed building axis.',
        guidelines: [
          'To draft on an angled building wing without rotating the actual site geometry: Type `UCS` ↵ `OB` (Object) ↵ and click the skewed exterior wall or grid line.',
          'Type `PLAN` ↵ `C` (Current UCS) ↵ so the screen rotates to make the angled wing sit horizontally on your monitor.',
          'Type `UCS` ↵ `NA` (Named) -> `S` (Save) and name it `WING-NORTH` so you can recall it anytime.',
          'To return to true North-Up survey coordinates: Type `UCS` ↵ `W` (World) ↵ followed by `PLAN` ↵ `W` ↵.',
          'Type `UCSICON` ↵ `OR` (Origin) so the XY axis icon visually sits at $(0,0)$ when visible.'
        ],
        proTip: 'Never move or rotate a georeferenced site survey to $(0,0)$ in WCS—always rotate the `UCS` and `PLAN` view instead so Xref overlays and Total Station setting-out coordinates stay 100% accurate.'
      },
      {
        id: 'acad-1-3',
        title: 'Absolute, Relative, and Polar Coordinate Entry',
        commandsOrFormulas: ['#X,Y,Z (Absolute)', '@ΔX,ΔY (Relative)', '@Dist<Angle (Polar)', 'DYNPICOORDS', 'F12 (DYNMODE)'],
        summary: 'Enter exact mathematical coordinates and survey bearings from the keyboard with Dynamic Input ON or OFF.',
        mechanics:
          'When Dynamic Input (`F12`) is ON, AutoCAD treats second-point entries as Relative (`@`) by default unless prefixed with `#`. When `F12` is OFF, prefixing with `@` is mandatory for relative deltas.',
        guidelines: [
          'Absolute Coordinates (`#X,Y` or `X,Y`): Anchors a point relative to the active origin $(0,0)$—e.g., `#500.25,1000.50` places a survey benchmark at Easting 500.25, Northing 1000.50.',
          'Relative Cartesian Coordinates (`@ΔX,ΔY`): Steps from the last clicked point—e.g., inside `RECTANG` or `LINE`, typing `@4500,3200` draws a 4500 × 3200 mm room.',
          'Relative Polar Coordinates (`@Distance<Angle`): Steps a specific length at a Counter-Clockwise angle from East ($0^\\circ$)—e.g., `@3500<45` draws a 3.5m line at $45^\\circ$.',
          'Direct Distance Entry (Fastest): Turn `F8` (Ortho) or `F10` (Polar) ON, point your cursor in the desired direction, type `4500`, and press Enter.'
        ],
        proTip: 'To enter Surveyor Bearings (e.g., North 35° East), set Angular Units (`UNITS`) to `Surveyor\'s Units` and type `@25.5<N35d15\'20"E`.'
      }
    ]
  },

  {
    id: 'acad-ch2',
    pillar: 'autocad',
    chapterNumber: 2,
    title: '2D Drafting & Geometry',
    subtitle: 'LINE, PLINE, XLINE, RAY, MLINE, CIRCLE, ARC, ELLIPSE, RECTANG, POLYGON, SPLINE, HATCH, BOUNDARY, REGION & WIPEOUT',
    topics: [
      {
        id: 'acad-2-1',
        title: 'Linear & Continuous Entities: LINE, PLINE, XLINE, RAY, MLINE',
        commandsOrFormulas: ['LINE (L)', 'PLINE (PL)', 'XLINE (XL)', 'RAY', 'MLINE (ML)', 'MLSTYLE', 'MLEDIT'],
        summary: 'Choose the right linear entity for structural grids, continuous slab perimeters, construction projections, and double-line walls.',
        mechanics:
          '`LINE` creates independent 2-vertex segments. `LWPOLYLINE` (`PLINE`) stores an entire connected sequence of straight and arc segments as a single lightweight object with a continuous `Area`, `Length`, and `Global Width`. `XLINE` and `RAY` create infinite/semi-infinite projection lines for elevations.',
        guidelines: [
          'Use `PLINE` (`PL`) instead of `LINE` for all footings, columns, room boundaries, and pipelines so a single click selects the whole loop and calculates area/length.',
          'Inside `PLINE`, type `W` (Width) to draw thick directional arrows (Start Width = `0`, End Width = `150`) or heavy structural rebar bars (Global Width = `25`).',
          'Use `XLINE` (`XL`) -> `V` (Vertical) or `H` (Horizontal) to project floor plan corners down/up when constructing Architectural Elevations and Building Sections.',
          'Use `XLINE` -> `B` (Bisect) to find the exact angle bisector of any skewed corner.',
          'Use `MLINE` (`ML`) after configuring wall thicknesses in `MLSTYLE` to draw double-line brick walls, and run `MLEDIT` to clean up T-junctions and crosses.'
        ],
        proTip: 'Press `C` (Close) at the end of a `PLINE` instead of clicking the start point manually—this sets the internal `Closed = Yes` flag required by `EXTRUDE`, `AREA`, and Civil 3D boundaries.'
      },
      {
        id: 'acad-2-2',
        title: 'Curved & Closed Shapes: CIRCLE, ARC, ELLIPSE, RECTANG, POLYGON, SPLINE',
        commandsOrFormulas: ['CIRCLE (C)', 'ARC (A)', 'ELLIPSE (EL)', 'RECTANG (REC)', 'POLYGON (POL)', 'SPLINE (SPL)'],
        summary: 'Construct circular piles, road horizontal curves, column rectangles, hexagonal bolts, and smooth topographic contours.',
        mechanics:
          '`RECTANG` and `POLYGON` generate closed `LWPOLYLINE` entities. `CIRCLE` and `ARC` use true mathematical radii, whereas `SPLINE` creates a NURBS curve (Non-Uniform Rational B-Spline) controlled by Fit Points or Control Vertices (`CV`).',
        guidelines: [
          'In `CIRCLE` (`C`), type `TTR` (Tan-Tan-Radius) to fit a road curb fillet or transition curve tangent to two existing lines with a known radius.',
          'In `CIRCLE`, type `2P` to draw a circle by clicking two opposite diameter endpoints, or `3P` through three survey points on a circular tank.',
          'In `ARC` (`A`), hold down the `CTRL` key while dragging to flip the arc curvature direction between clockwise and counter-clockwise!',
          'In `RECTANG` (`REC`), click the first corner, then type `D` (Dimensions) ↵ `400` ↵ `600` ↵ to draw an exact 400×600 mm column, or use `R` (Rotation) to draw a rectangle aligned to a sloped roof.',
          'In `POLYGON` (`POL`), choose `I` (Inscribed in circle — measured corner-to-corner) or `C` (Circumscribed about circle — measured flat-to-flat for structural hex nuts/bolts).'
        ],
        proTip: 'Before exporting `SPLINE` or `ELLIPSE` curves to CNC laser cutters or structural FEM software, run `SPLINEDIT` -> `Convert to Polyline` (precision `5`) or set `PELLIPSE = 1`.'
      },
      {
        id: 'acad-2-3',
        title: 'Fills, Regions & Masks: HATCH, GRADIENT, BOUNDARY, REGION, WIPEOUT',
        commandsOrFormulas: ['HATCH (H)', 'GRADIENT (GD)', 'HATCHEDIT (HE)', 'HPGAPTOL', 'BOUNDARY (BO)', 'REGION (REG)', 'MASSPROP', 'WIPEOUT'],
        summary: 'Apply concrete/brick section patterns, presentation gradients, room polylines, section moment of inertia (Ixx/Iyy), and background masks.',
        mechanics:
          'Associative `HATCH` and `GRADIENT` link their boundary loop to surrounding walls so stretching a wall automatically updates the fill area. `REGION` converts closed 2D loops into solid planar faces capable of Boolean operations (`UNION`, `SUBTRACT`, `INTERSECT`) and engineering structural property extraction (`MASSPROP`).',
        guidelines: [
          'Always place Hatches on a dedicated layer (`A-HATC` or `S-CONC-HATC` set to Color 8 or 252) so one click on `LAYOFF` hides all hatches during heavy drafting.',
          'Check `Create Separate Hatches` in the Hatch Ribbon when hatching 10 columns or rooms at once—so deleting one room hatch later doesn’t delete all 10!',
          'Use `GRADIENT` (`GD`) with smooth 1-color or 2-color transitions for architectural elevation sky/glass rendering, water bodies, and landscape presentation plans.',
          'Use `BOUNDARY` (`BO`) -> `Pick Points` inside any enclosed room to generate a single closed Polyline for instant area and perimeter measurement.',
          'To compute exact Centroid, Area, and Moment of Inertia ($I_{xx}, I_{yy}$) of any irregular composite shear wall or girder section: convert the outline to a `REGION` (`REG`), move its centroid to `0,0`, and type `MASSPROP`!',
          'Set `WIPEOUTFRAME = 2` so wipeout borders are selectable on screen but never plot on PDF.'
        ],
        proTip: 'If AutoCAD complains "A closed boundary cannot be determined" when hatching a room with small drafting gaps, set `HPGAPTOL` to `50` (mm) to bridge gaps automatically.'
      }
    ]
  },

  {
    id: 'acad-ch3',
    pillar: 'autocad',
    chapterNumber: 3,
    title: 'Modification & Editing Commands',
    subtitle: 'MOVE, COPY, ROTATE, SCALE, MIRROR, OFFSET, TRIM, EXTEND, FILLET, CHAMFER, ARRAY, STRETCH, LENGTHEN, BREAK, JOIN, ALIGN, PEDIT & OVERKILL',
    topics: [
      {
        id: 'acad-3-1',
        title: 'Core Transformations: MOVE, COPY, ROTATE, SCALE, MIRROR, OFFSET',
        commandsOrFormulas: ['MOVE (M)', 'COPY (CO/CP)', 'ROTATE (RO)', 'SCALE (SC)', 'MIRROR (MI)', 'OFFSET (O)'],
        summary: 'Master Reference scaling, Reference rotation, Copy Arrays, and Offset-to-Current-Layer options.',
        mechanics:
          'Every transformation command supports sub-options (`Copy`, `Reference`, `Array`, `Multiple`, `Layer`) that eliminate manual hand-calculations of angles and scale ratios.',
        guidelines: [
          'Inside `COPY` (`CO`), after picking the base point, type `A` (Array) -> Enter number of items (e.g., `12` stirrups or purlins) -> Click the spacing or type `F` (Fit) to distribute them evenly across a span.',
          'Inside `ROTATE` (`RO`), use `R` (Reference) to match any existing angled line without measuring the angle: select object -> pick base point -> type `R` -> click 2 points on your object -> click `P` (Points) and click 2 points along the target slope!',
          'Inside `SCALE` (`SC`), use `R` (Reference) to rescale a scanned PDF floor plan: pick base point -> type `R` -> click both ends of a known door/wall on the PDF -> type the real length (`900` or `5000`) ↵.',
          'Inside `OFFSET` (`O`), before typing the distance, type `L` (Layer) -> `C` (Current) so offsetting a structural grid line onto your Wall layer puts the new line directly on the Wall layer!'
        ],
        proTip: 'Before using `MIRROR` (`MI`) on a duplex apartment or symmetrical bridge half, verify `MIRRTEXT = 0` so text and tags remain left-to-right readable.'
      },
      {
        id: 'acad-3-2',
        title: 'Corner & Intersection Cleanup: TRIM, EXTEND, FILLET, CHAMFER, BLEND',
        commandsOrFormulas: ['TRIM (TR)', 'EXTEND (EX)', 'TRIMEXTENDMODE', 'FILLET (F)', 'CHAMFER (CHA)', 'BLEND'],
        summary: 'Clean beam-column joints, wall intersections, and road curves at high speed using Shift-overrides and Fence selection.',
        mechanics:
          'In modern AutoCAD (`TRIMEXTENDMODE = 1`), `TRIM` and `EXTEND` default to Quick Mode where every visible object acts as a cutting/boundary edge immediately. Holding `SHIFT` swaps `TRIM` and `EXTEND` on the fly.',
        guidelines: [
          'Start `TRIM` (`TR`) and drag a Fence line across multiple beam/wall tails to trim 20 lines in a single swipe.',
          'Hold `SHIFT` while inside `TRIM` to temporarily `EXTEND` lines without exiting the command (and hold `SHIFT` inside `EXTEND` to `TRIM`).',
          'If you prefer classic cutting-edge selection on dense drawings, type `TRIM` -> `T` (Mode) -> `S` (Standard) or set `TRIMEXTENDMODE = 0`.',
          'Hold `SHIFT` while clicking the second line in `FILLET` (`F`) or `CHAMFER` (`CHA`) to form an instant sharp $90^\\circ$ zero-radius corner while keeping your stored radius (e.g., `R = 6000` mm for road curbs) intact.',
          'Use `BLEND` to connect two separate splines, road edges, or contour lines with a smooth tangent (`G1`) or curvature-continuous (`G2`) spline.'
        ],
        proTip: 'When trimming 2D lines near 3D contours in a Top view, set `PROJMODE = 1` so AutoCAD trims based on apparent 2D XY intersections even if lines sit at different Z elevations.'
      },
      {
        id: 'acad-3-3',
        title: 'Parametric Patterns & Resizing: ARRAY (Rect/Polar/Path), STRETCH, LENGTHEN',
        commandsOrFormulas: ['ARRAYRECT', 'ARRAYPOLAR', 'ARRAYPATH', 'ARRAYEDIT', 'STRETCH (S)', 'LENGTHEN (LEN)'],
        summary: 'Distribute pile grids, circular tank bolts, or curved highway guardrails associatively and stretch structural bays cleanly.',
        mechanics:
          'Associative Arrays (`ARRAYRECT`, `ARRAYPOLAR`, `ARRAYPATH`) remain a single parametric object with interactive blue grips for adjusting spacing, row count, or path curvature. Holding `CTRL` allows clicking and deleting/moving individual array instances.',
        guidelines: [
          'Use `ARRAYPATH` to distribute streetlights, trees, pile foundations, or rebar dowels along a curved road centerline or retaining wall alignment (set Method = `Measure` for fixed spacing like `@2500` mm, or `Divide` for equal subdivisions).',
          'Hold `CTRL` and click any individual column or light inside an Associative Array to erase or shift just that single instance around an obstacle without exploding the array!',
          'With `STRETCH` (`S`), always drag a green Right-to-Left Crossing Window (`C` or `CP` Crossing Polygon) across the vertices you want to move.',
          'Use `LENGTHEN` (`LEN`) -> `DE` (Delta) -> `300` to extend rebar lap tails by exactly 300 mm, or `LEN` -> `T` (Total) -> `12000` to set any line or arc to an exact total arc length of 12,000 mm!'
        ],
        proTip: 'Need to measure or set the exact curved length along a circular arc road or bent rebar? `LENGTHEN` -> `T` (Total) works on Arcs as well as straight lines!'
      },
      {
        id: 'acad-3-4',
        title: 'Topology & Database Repair: BREAK, JOIN, EXPLODE, ALIGN, PEDIT, OVERKILL',
        commandsOrFormulas: ['BREAK (BR)', 'BREAKATPOINT', 'JOIN (J)', 'EXPLODE (X)', 'ALIGN (AL)', 'PEDIT (PE)', 'OVERKILL (OV)'],
        summary: 'Split continuous beams at column supports, weld collinear segments, align consultant underlays, and strip duplicate lines.',
        mechanics:
          '`BREAK` with `@` splits an object at a single point with zero gap (`BREAKATPOINT`). `JOIN` merges collinear lines, arcs, and open polylines into a single entity. `OVERKILL` deletes stacked duplicates within vector tolerances.',
        guidelines: [
          'To split a line or polyline at an exact intersection without removing a gap: Type `BREAKATPOINT` (or `BR` -> Select object -> Type `F` (First point) -> Click intersection -> Type `@` ↵).',
          'Use `JOIN` (`J`) to heal broken grid lines, walls, or arcs into a single continuous line/polyline (or convert a `360°` arc back into a full `CIRCLE` via `JOIN` -> `C`lose).',
          'Use `PEDIT` (`PE`) -> `M` (Multiple) -> Select lines -> `J` (Join) with a small Fuzz Distance to weld imperfect survey contour lines into closed polylines.',
          'Use `ALIGN` (`AL`) with 2 source-destination point pairs to move, rotate, and optionally scale details or Xrefs in one operation.',
          'Run `OVERKILL` before plotting or exporting DXFs to structural analysis software to merge overlapping segments.'
        ],
        proTip: 'Never run `EXPLODE` (`X`) on Dimensions, Hatches, or Multi-leaders—exploding them turns smart associative annotations into hundreds of dumb lines and fragments!'
      }
    ]
  },

  {
    id: 'acad-ch4',
    pillar: 'autocad',
    chapterNumber: 4,
    title: 'Precision Snaps & Object Selection',
    subtitle: 'OSNAP (F3), OTRACK (F11), POLAR (F10), ORTHO (F8), QSELECT, FILTER, SELECTSIMILAR & Selection Cycling',
    topics: [
      {
        id: 'acad-4-1',
        title: 'OSNAP Modes (F3): Endpoint, Midpoint, Center, Node, Quadrant, Intersection, Extension, Perpendicular, Tangent, Nearest',
        commandsOrFormulas: ['OSNAP (OS / F3)', 'END / MID / CEN / NOD / QUA', 'INT / EXT / PER / TAN / NEA', 'M2P (Mid Between 2 Points)', 'TK (Temporary Tracking)'],
        summary: 'Configure the 10 precision Object Snaps and invoke single-shot overrides (`Shift + Right-Click`) for crowded structural and survey joints.',
        mechanics:
          'Turning on every single Object Snap simultaneously (`Nearest` + `Perpendicular` + `Endpoint` + `Center`) causes cursor "snap fighting" where AutoCAD grabs `Nearest` instead of the true `Endpoint`. Keep 5–6 core snaps active in `OSNAP` (`F3`) and invoke special snaps on demand.',
        guidelines: [
          '`Endpoint (END)`, `Midpoint (MID)`, `Center (CEN)` & `Intersection (INT)`: Keep these 4 enabled at all times for general structural and architectural geometry.',
          '`Node (NOD)`: Snaps specifically to AutoCAD `POINT` entities (Survey Total Station points) and dimension definition points—enable `Node` whenever connecting or labeling imported survey points!',
          '`Quadrant (QUA)`: Snaps to the $0^\\circ, 90^\\circ, 180^\\circ, 270^\\circ$ cardinal rim points of a `CIRCLE`, `ARC`, or `ELLIPSE` (ideal for dimensioning outer pile/column diameters or circular water tanks).',
          '`Extension (EXT)` & `Perpendicular (PER)`: Projects a temporary dashed path beyond the end of a line/arc (`EXT`) or locks a $90^\\circ$ normal drop onto a wall/beam (`PER`).',
          '`Tangent (TAN)` & `Nearest (NEA)`: Keep `NEA` and `TAN` OFF in running Osnaps (`F3`) so they never hijack Endpoint snaps—invoke them mid-command via `Shift + Right-Click`!',
          '`M2P` (Mid Between 2 Points): Type `M2P` during any command and click two opposite room corners to snap dead-center in the room.'
        ],
        proTip: 'Hold `TAB` while hovering over a dense beam-rebar intersection to cycle visually through every available Osnap point (`Endpoint`, `Midpoint`, `Center`, `Perpendicular`, `Quadrant`) before clicking!'
      },
      {
        id: 'acad-4-2',
        title: 'Directional Aids: OTRACK (F11), POLAR (F10) & ORTHO (F8)',
        commandsOrFormulas: ['OTRACK (F11)', 'POLAR (F10)', 'ORTHO (F8)', 'POLARANG'],
        summary: 'Align new geometry horizontally and vertically with existing walls and columns without drawing temporary construction lines.',
        mechanics:
          '`ORTHO` (`F8`) hard-locks cursor movement to $0^\\circ, 90^\\circ, 180^\\circ, 270^\\circ$. `POLAR` (`F10`) provides soft green alignment guides at any preset increment ($15^\\circ, 30^\\circ, 45^\\circ, 90^\\circ$). `OTRACK` (`F11`) projects dotted green alignment vectors from hovered Osnap points.',
        guidelines: [
          'Keep `POLAR` (`F10`) set to $45^\\circ$ or $30^\\circ$ increments and `OTRACK` (`F11`) ON for 95% of architectural and structural drafting.',
          'To align a new column with an existing column X-coordinate AND a wall Y-coordinate: hover (don’t click!) over Point 1 for 0.5 seconds (`+` appears), hover over Point 2 (`+` appears), then move to where both green dotted tracking lines cross and click!',
          'Hold down `SHIFT` at any time while drawing to temporarily toggle `ORTHO` (`F8`) ON or OFF for the current pick.'
        ],
        proTip: 'Inside Polar Tracking Settings (`DS` -> Polar Tracking), check "Track using all polar angle settings" so `OTRACK` projects vectors at $30^\\circ/45^\\circ$ as well as $90^\\circ$.'
      },
      {
        id: 'acad-4-3',
        title: 'Smart Database Selection: QSELECT, FILTER, SELECTSIMILAR & Selection Cycling',
        commandsOrFormulas: ['QSELECT', 'FILTER (FI)', 'SELECTSIMILAR', 'SELECTSIMILARMODE', 'SELECTIONCYCLING (CTRL+W)'],
        summary: 'Isolate and select thousands of matching blocks, texts, hatches, or stacked overlapping lines by database property.',
        mechanics:
          'Instead of picking objects one by one, `QSELECT` and `FILTER` query the drawing database by Entity Type, Layer, Color, Linetype, Radius, Text Content, or Z-Elevation.',
        guidelines: [
          'Use `SELECTSIMILAR`: Select one pile circle or column block, right-click -> `Select Similar` to highlight every matching object on that layer instantly (type `SELECTSIMILARMODE` -> `130` to match by Layer + Name).',
          'Use `QSELECT` to find errors: e.g., Object Type = `Line`, Property = `Start Z`, Operator = `<> Not Equal`, Value = `0` to catch every 3D skewed line in a 2D plan!',
          'Use `FILTER` (`FI`) when you need multi-condition Boolean logic (`AND` / `OR` / `NOT`), such as selecting all `Circles` with `Radius = 300` on Layer `S-PILE` inside a specific building wing.',
          'Press `CTRL + W` (`SELECTIONCYCLING = 2`) when working on stacked lines (e.g., a Wall line, Grid line, and Viewport border sitting on top of each other) so a clean popup list lets you pick the exact entity you want.'
        ],
        proTip: 'Inside any editing command (`MOVE`, `COPY`, `ERASE`), type `P` ↵ to re-select your `Previous` selection set, or type `L` ↵ to select the `Last` created object.'
      }
    ]
  },

  {
    id: 'acad-ch5',
    pillar: 'autocad',
    chapterNumber: 5,
    title: 'Layer & Property Management',
    subtitle: 'LAYER States, Freeze vs. Off, Viewport Freeze, LAYISO/LAYMRG/LAYDEL, MATCHPROP, PROPERTIES & Linetype Scales',
    topics: [
      {
        id: 'acad-5-1',
        title: 'LAYER Controls: On/Off, Freeze/Thaw, Lock, Plot/No-Plot & VP Freeze',
        commandsOrFormulas: ['LAYER (LA)', 'LAYERSTATE (LAS)', 'VPLAYER', 'LAYLOCKFADECTL'],
        summary: 'Understand the critical difference between Layer Off and Layer Freeze, and configure per-viewport layer visibility.',
        mechanics:
          '`Off` hides objects visually on screen, but AutoCAD still calculates them during `REGEN` and `ZOOM Extents` (and `SELECT ALL` can still erase them!). `Freeze` completely unloads the layer geometry from CPU/GPU memory and excludes it from `ZOOM Extents` and `REGEN`.',
        guidelines: [
          'Prefer `Freeze` over `Off` when hiding heavy civil survey contours, 3D furniture, or hatch layers to boost panning/zooming frame rates.',
          'Use `Lock` (with `LAYLOCKFADECTL = 55`) on structural grid lines (`S-GRID`) and architectural background layers while drafting MEP or rebar overlays so you can snap to them without accidentally moving or deleting them.',
          'Click the `Plot` printer icon in `LA` to set `Defpoints`, `A-ANNO-VPRT` (Viewport borders), and construction note layers to `No-Plot`.',
          'Inside a Paper Space Layout, double-click inside a Viewport and click the `VP Freeze` icon in `LA` to hide Furniture and Dimensions in the Structural Framing Viewport while keeping them visible in the Architectural Viewport on the next tab!',
          'Type `LAS` (`LAYERSTATE`) to save named layer snapshots (`01-Architectural-Plan`, `02-Structural-Framing`, `03-Electrical-Reflected-Ceiling`) and switch between them in 1 second.'
        ],
        proTip: 'Never draw project geometry on Layer `0` or Layer `Defpoints`! Reserve Layer `0` strictly for the internal geometry inside Block definitions so blocks inherit the color/linetype of whatever layer they are inserted on.'
      },
      {
        id: 'acad-5-2',
        title: 'Express Layer Tools: LAYISO, LAYUNISO, LAYMCUR, LAYOFF, LAYON, LAYMRG, LAYDEL',
        commandsOrFormulas: ['LAYISO', 'LAYUNISO', 'LAYMCUR', 'LAYOFF', 'LAYON', 'LAYTHW', 'LAYMRG', 'LAYDEL'],
        summary: 'Control layers directly by clicking objects in the drawing without scrolling through a 200-layer palette.',
        mechanics:
          'These object-driven commands read the `Layer` property of clicked entities and execute batch layer state transitions or rewrite symbol table references (`LAYMRG` / `LAYDEL`).',
        guidelines: [
          '`LAYISO` / `LAYUNISO`: Isolates only the layers of the objects you click (e.g., `S-BEAM` and `S-COL`) for fast BOQ takeoffs, then restores the previous state with `LAYUNISO`.',
          '`LAYMCUR`: Click any existing wall, dimension, or rebar bar to make its layer the Active Current Layer immediately.',
          '`LAYOFF` / `LAYFRZ`: Click any annoying hatch, furniture block, or contour line to turn off or freeze its layer on the spot.',
          '`LAYMRG` (Layer Merge): Merges duplicate consultant layers (e.g., `WALL`, `A-WALL`, `WALLS_NEW`) onto your single standard `A-WALL` layer and deletes the redundant layer names.',
          '`LAYDEL`: Force-deletes a stubborn junk layer and erases all objects on it.'
        ],
        proTip: 'Type `LAYWALK` to interactively click through layers one by one and inspect what lives on mystery layers in an unfamiliar consultant drawing.'
      },
      {
        id: 'acad-5-3',
        title: 'Property Inheritance & Linetype Scaling: MATCHPROP, PROPERTIES & LTSCALE',
        commandsOrFormulas: ['MATCHPROP (MA)', 'PROPERTIES (CH / CTRL+1)', 'QUICKPROPERTIES (QP)', 'LTSCALE', 'PSLTSCALE', 'MSLTSCALE', 'CELTSCALE'],
        summary: 'Maintain strict `ByLayer` discipline and synchronize dashed/centerline scales across Model and Paper Space.',
        mechanics:
          'Every entity should have `Color = ByLayer`, `Linetype = ByLayer`, and `Lineweight = ByLayer` (`SETBYLAYER`) so `.CTB` plot styles and Viewport Overrides work predictably.',
        guidelines: [
          'Type `SETBYLAYER` -> Select `ALL` -> Answer `Yes` to strip messy manual color/linetype overrides from imported drawings and return all objects to clean `ByLayer` control.',
          'Inside `MATCHPROP` (`MA`), after clicking the source object, type `S` (Settings) to uncheck `Layer` or `Text Style` if you only want to copy Hatch Pattern or Dimension Style without changing the target object’s layer!',
          'Enforce the golden 4-variable linetype rule in every template: `LTSCALE = 1` (or `0.5`), `PSLTSCALE = 1`, `MSLTSCALE = 1`, and `CELTSCALE = 1`, followed by `REGENALL` (`REA`).'
        ],
        proTip: 'If `QUICKPROPERTIES` (`QP`) popups annoy you every time you click a line, press `CTRL + SHIFT + P` (or set `QPMODE = 0`) to turn it off.'
      }
    ]
  },

  {
    id: 'acad-ch6',
    pillar: 'autocad',
    chapterNumber: 6,
    title: 'Blocks, Attributes & External References',
    subtitle: 'BLOCK, WBLOCK, INSERT, BCOUNT, Dynamic Blocks (BEDIT), Attributes (ATTDEF/ATTSYNC/BURST) & Xrefs (XREF/XCLIP/ETRANSMIT)',
    topics: [
      {
        id: 'acad-6-1',
        title: 'Block Creation & Counting: BLOCK, WBLOCK, INSERT, BCOUNT',
        commandsOrFormulas: ['BLOCK (B)', 'WBLOCK (W)', 'INSERT (I)', 'BCOUNT', 'BASE'],
        summary: 'Build reusable internal and external symbol libraries with proper basepoints and Layer 0 inheritance.',
        mechanics:
          '`BLOCK` (`B`) saves a symbol definition inside the current DWG only. `WBLOCK` (`W` — Write Block) exports geometry out to a standalone clean `.dwg` file on disk so your whole engineering team can insert it across any project.',
        guidelines: [
          'Before running `BLOCK` (`B`), move the symbol geometry to Layer `0` with Color/Linetype set to `ByLayer` (or `ByBlock`) so the block adopts the properties of the layer it is placed on.',
          'Always click `Pick Point` in the Block dialog to define a logical Insertion Basepoint (e.g., the center of a pile/column, or the hinge corner of a door)—never leave Basepoint at `0,0,0`!',
          'Use `WBLOCK` (`W`) -> `Objects` to export standard structural details, north arrows, and titleblocks into a shared office library folder.',
          'Type `BCOUNT` ↵ `ALL` ↵ (and press `F2`) to print an instant itemized count of every block in the drawing.'
        ],
        proTip: 'Running `WBLOCK` -> `Entire Drawing` is the most powerful way to strip deep database corruption and trim 70% off the file size of a bloated DWG!'
      },
      {
        id: 'acad-6-2',
        title: 'Dynamic Blocks: BEDIT, Parameters, Actions & Visibility States',
        commandsOrFormulas: ['BEDIT (BE)', 'BSAVE', 'BCLOSE', 'BACTIONTOOL', 'BVSTATE'],
        summary: 'Combine multiple door sizes, column sections, and north-arrow orientations into a single intelligent block with interactive blue grips.',
        mechanics:
          'Inside the Block Editor (`BEDIT`), a Dynamic Block pairs a **Parameter** (which defines a grip and geometric property like `Linear Distance`, `Rotation Angle`, `Alignment`, or `Visibility`) with an **Action** (`Stretch`, `Scale`, `Move`, `Rotate`, `Flip`, `Array`, `Lookup`).',
        guidelines: [
          'Alignment Parameter (Zero Action needed!): Place an `Alignment` parameter along the back edge of a sanitary fixture, door, or structural section marker—now hovering the block near any angled wall automatically rotates the block tangent to the wall!',
          'Flip Parameter + Flip Action: Add a vertical/horizontal reflection axis to doors and section callouts so one click on the arrow grip flips the swing direction.',
          'Visibility States (`BVSTATE`): Pack 5 different rebar hook styles or column configurations (`4-Bar`, `8-Bar`, `12-Bar`, `Circular`) into one block and switch between them via a dropdown grip.',
          'Linear Parameter + Stretch Action + Increment List: Restrict a door block to stretch ONLY in standard modular widths (`750, 900, 1000, 1200 mm`) so drafters cannot stretch a door to `937.4 mm`.'
        ],
        proTip: 'Always test your Dynamic Block inside the Block Editor using the `Test Block` button (`BTESTBLOCK`) on the ribbon before saving and closing (`BCLOSE`).'
      },
      {
        id: 'acad-6-3',
        title: 'Block Attributes: ATTDEF, ATTEDIT, EATTEDIT, ATTSYNC, BURST',
        commandsOrFormulas: ['ATTDEF (ATT)', 'ATTEDIT (ATE)', 'EATTEDIT', 'BATTMAN', 'ATTSYNC', 'BURST', 'ATTREQ', 'ATTDIA'],
        summary: 'Embed structured database tags (Column ID, Pile RL, Door Mark, Drawing Revision) inside blocks for automated schedules.',
        mechanics:
          '`ATTDEF` creates a variable text field inside a block definition. Every inserted block instance stores its own unique string values while sharing the same block geometry.',
        guidelines: [
          'Type `ATTDEF` inside `BEDIT` to define Tag (`DOOR_NO` — no spaces!), Prompt (`Enter Door Mark:`), and Default (`D-01`), and check `Lock position = Yes`.',
          'Double-click any attributed block to open the Enhanced Attribute Editor (`EATTEDIT`), or type `-ATTEDIT` (`ATE`) to batch-edit attribute values, heights, or angles across multiple blocks at once via command line!',
          'Run `BATTMAN` (Block Attribute Manager) to change the prompt order of attributes in a titleblock or remove obsolete tags.',
          'Run `ATTSYNC` -> `Select` after editing any block in `BEDIT` to push attribute formatting/position updates to all existing block instances.',
          'Always use `BURST` (never `EXPLODE`) when converting attributed blocks to plain text so typed values (`C-12`) do not revert to raw tag names (`COL_TAG`).'
        ],
        proTip: 'Insert a `FIELD` (`CTRL+F` -> `Object` -> `Position` or `Area`) inside an Attribute’s Default Value so a Survey Benchmark Block automatically displays its own live Y-coordinate or elevation whenever moved!'
      },
      {
        id: 'acad-6-4',
        title: 'External References: XREF, XCLIP, XBIND & ETRANSMIT',
        commandsOrFormulas: ['XREF (XR)', 'XCLIP (XC)', 'XBIND (XB)', 'ETRANSMIT', 'VISRETAIN', 'XDWGFADECTL'],
        summary: 'Coordinate multi-discipline Architectural, Structural, and MEP drawings using live external references.',
        mechanics:
          'An `XREF` links an external DWG into your current drawing without merging its database. **Attachment** Xrefs travel nested into downstream drawings; **Overlay** Xrefs are visible only in the immediate host drawing and prevent circular reference loops (`A -> B -> A`).',
        guidelines: [
          'Always attach consultant backgrounds using Reference Type = `Overlay` and Path Type = `Relative Path` so two disciplines referencing each other never trigger circular Xref loops.',
          'Place every Xref at Insertion Point `0,0,0`, Scale `1,1,1`, Rotation `0` on a dedicated `Z-XREF` layer so all disciplines register to the exact same origin.',
          'Ensure `VISRETAIN = 1` so color, lineweight, and freeze changes you make to Xref layers (`e.g., turning Architectural walls grey Index 9`) are saved in your host drawing when the Xref reloads.',
          'Use `XCLIP` (`XC`) to crop an Xref to a specific building wing or blow-up area, and use `XBIND` (`XB`) to permanently import a specific Block, Layer, or DimStyle out of an attached Xref into your host DWG without binding the entire Xref!',
          'When submitting final CAD files to a client or contractor, ALWAYS run `ETRANSMIT`—it packages your main DWG, all Xrefs, `.CTB` plot styles, custom `.SHX`/`.TTF` fonts, and raster logos into a single `.ZIP` archive.'
        ],
        proTip: 'Need to copy just one beam, grid line, or room label out of a locked Xref into your active drawing without opening the Xref? Type `NCOPY` (Nested Copy) and click the sub-entity directly!'
      }
    ]
  },

  {
    id: 'acad-ch7',
    pillar: 'autocad',
    chapterNumber: 7,
    title: 'Annotation, Text & Dimensioning',
    subtitle: 'TEXT, MTEXT, STYLE, DIMLINEAR/ALIGNED/CONTINUE/BASELINE/ORDINATE, DIMSTYLE, MLEADER, TABLE & Annotative Scaling',
    topics: [
      {
        id: 'acad-7-1',
        title: 'Typography & Search: TEXT, MTEXT, STYLE, SPELL, FIND',
        commandsOrFormulas: ['MTEXT (MT / T)', 'TEXT (DT)', 'STYLE (ST)', 'SPELL (SP)', 'FIND', 'TXT2MTXT'],
        summary: 'Configure non-distorted ISO/Arial text styles, engineering symbols (`Ø, °, ±`), background masks, and global Find/Replace.',
        mechanics:
          '`STYLE` (`ST`) defines font family (`Arial.ttf`, `ISOCP.shx`, `romans.shx`) and Width Factor. Keep `Height = 0.000` inside the `STYLE` dialog so `DIMSTYLE`, `TABLE`, and `MTEXT` can dynamically control text height per scale.',
        guidelines: [
          'Inside `STYLE` (`ST`), ALWAYS leave `Height = 0`—setting a fixed height inside `STYLE` locks dimensions and prevents `DIMSCALE` from scaling dimension text!',
          'Memorize the three universal AutoCAD engineering control codes: `%%c` = Diameter ($\varnothing$), `%%d` = Degree ($^\circ$), and `%%p` = Plus/Minus ($\pm$). In `MTEXT`, also use `\U+00B2` for $\text{m}^2$ and `\U+00B3` for $\text{m}^3$.',
          'Use `TXT2MTXT` to combine old, fragmented single-line `DTEXT` specification notes into a single clean, multi-column `MTEXT` paragraph with automatic numbered lists.',
          'Enable `Background Mask` (Offset `1.15`, Use drawing background color) inside `MTEXT` Properties (`CTRL+1`) so rebar callouts and room labels automatically mask crossing hatch and grid lines.',
          'Run `FIND` to batch-update concrete grades (`M25` -> `M30`) or sheet references across the entire DWG.'
        ],
        proTip: 'Type `TCASE` to convert selected notes to `UPPERCASE`, `Title Case`, or `Sentence case` in two clicks—standardizing construction notes in seconds.'
      },
      {
        id: 'acad-7-2',
        title: 'Precision Dimensioning: DIMLINEAR, DIMALIGNED, DIMANGULAR, DIMARC, DIMRADIUS, DIMDIAMETER, DIMCONTINUE, DIMBASELINE, DIMORDINATE, DIMSTYLE, DIMSPACE, DIMBREAK',
        commandsOrFormulas: ['DIMLINEAR (DLI)', 'DIMALIGNED (DAL)', 'DIMANGULAR (DAN)', 'DIMARC (DAR)', 'DIMRADIUS (DRA)', 'DIMDIAMETER (DDI)', 'DIMCONTINUE (DCO)', 'DIMBASELINE (DBA)', 'DIMORDINATE (DOR)', 'DIMSTYLE (D)', 'DIMSPACE', 'DIMBREAK'],
        summary: 'Place aligned structural bay chains, curve radii/diameters, cumulative setting-out dimensions, arc lengths, and auto-spaced parallel dimension tiers.',
        mechanics:
          'When `DIMASSOC = 2`, dimensions link parametrically to the snapped geometry vertices (`Defpoints`). Pressing Enter twice at the start of `DLI` or `DAL` lets you click an entire line or arc segment directly without picking both endpoints.',
        guidelines: [
          'Grid & Facade Chains: Place the first bay dimension with `DLI` (or `DAL` for sloped beams/roofs), then immediately type `DCO` (`DIMCONTINUE`) and click each remaining grid line—all dimensions lock into a perfectly collinear chain.',
          'Curves, Culverts & Piles (`DIMRADIUS`, `DIMDIAMETER`, `DIMARC`, `DIMANGULAR`): Use `DRA` (`R1500`) for road curb and rebar bend radii, `DDI` (`Ø600`) for bored piles and pipes, `DAR` for true curved arc length, and `DAN` for skewed grid angles.',
          'Cumulative Setting-Out (`DIMBASELINE` / `DBA` & `DIMORDINATE` / `DOR`): Use `DBA` to stack cumulative distances from Grid A, or set `UCS` at the corner benchmark and run `DOR` to label exact X/Y datum coordinates without cluttering dimension lines.',
          'Equal Tier Spacing & Clean Gaps (`DIMSPACE` & `DIMBREAK`): Run `DIMSPACE` (`Auto`) to space parallel dimension tiers evenly, and run `DIMBREAK` (`Auto`) to insert clean visual breaks where extension lines cross!'
        ],
        proTip: 'Inside `DIMSTYLE` (`D`) -> `Lines` tab, check `Fixed length extension lines` (set Length = `8` mm in paper units). This keeps all dimension extension tails clean and uniform even when snapping to staggered interior/exterior wall corners!'
      },
      {
        id: 'acad-7-3',
        title: 'Smart Callouts & Live Schedules: MLEADER, MLEADERSTYLE, TABLE, TABLESTYLE & Excel DATALINK',
        commandsOrFormulas: ['MLEADER (MLD)', 'MLEADERSTYLE (MLS)', 'MLEADERALIGN (MLA)', 'MLEADERCOLLECT (MLC)', 'TABLE (TB)', 'TABLESTYLE (TS)', 'DATALINK (DL)'],
        summary: 'Standardize leader callouts with `MLEADERSTYLE` and link formatted Excel BOQ/BBS spreadsheets live into AutoCAD via `TABLESTYLE` & `DATALINK`.',
        mechanics:
          '`MLEADER` combines arrowhead, leader landing, and MText/Block bubble into a single associative entity governed by `MLEADERSTYLE`. `DATALINK` connects a specific Named Range or Sheet in an external `.xlsx` file bi-directionally to an AutoCAD `TABLE`.',
        guidelines: [
          'Configure `MLEADERSTYLE` (`MLS`) with a closed filled arrow (`3.0 mm`), horizontal landing (`2.0 mm`), and either `MText` (for rebar callouts) or `Block -> Circle/Hexagon` (for keynote/bar mark tags).',
          'Use `MLEADERALIGN` (`MLA`) to line up all structural rebar callouts neatly along a vertical margin, and `MLEADERCOLLECT` (`MLC`) to group multiple block-tag leaders into a single horizontal chain.',
          'Configure `TABLESTYLE` (`TS`) with dedicated `Title` (`5.0 mm`), `Header` (`3.5 mm`), and `Data` (`2.5 mm`) cell styles before inserting schedules.',
          'Live Excel Schedule Link: Type `DATALINK` (`DL`) -> Create a new Excel Data Link -> Browse to your `Bar_Bending_Schedule.xlsx` -> Type `TABLE` (`TB`) -> Check `From a data link` and insert the table on your CAD sheet.'
        ],
        proTip: 'AutoCAD native tables (`TABLE`) support Excel-like formulas directly inside cells (`=SUM(C3:C20)`, `=B4*C4`)—press `CTRL+F` -> `Formula` inside any table cell.'
      },
      {
        id: 'acad-7-4',
        title: 'Annotative Scaling: CANNOSCALE, ANNOALLVISIBLE, ANNOAUTOSCALE & OBJECTSCALE',
        commandsOrFormulas: ['CANNOSCALE', 'ANNOALLVISIBLE', 'ANNOAUTOSCALE', 'OBJECTSCALE', 'SCALELISTEDIT'],
        summary: 'Let a single Model Space text, dimension, or block automatically resize itself across 1:100 Plan and 1:20 Detail viewports.',
        mechanics:
          'An Annotative object stores a fixed **Paper Height** (e.g., `2.5 mm`) and a list of assigned **Annotation Scales** (`OBJECTSCALE`, e.g., `1:100` and `1:20`). Each Paper Space viewport displays only the scale representation matching its own Viewport Scale.',
        guidelines: [
          'In your Text Style (`ST`), Dimension Style (`D`), or MLeader Style (`MLS`), check the `Annotative` checkbox and enter the Paper Text Height (`2.5` mm).',
          'Before placing dimensions in Model Space, set the bottom-right Annotation Scale dropdown (`CANNOSCALE`) to your primary plan scale (`1:100`).',
          'To make existing `1:100` column tags also appear at the right size inside a `1:25` blow-up viewport: select the tags, type `OBJECTSCALE` -> `Add` -> Select `1:25` -> Click OK.',
          'Keep `ANNOAUTOSCALE = -4` (Off) during normal viewing so switching scales on the status bar does not accidentally attach unwanted scales to every object in the drawing.',
          'Set `ANNOALLVISIBLE = 0` inside Layout tabs so objects without the viewport’s exact scale assigned automatically hide in that viewport.'
        ],
        proTip: 'If dragging an annotative text leaves behind a large "ghost" duplicate of the text at another scale, click ONLY the main blue grip to move all scale representations together, or click the sub-grip while at that specific scale to shift just the `1:20` label position!'
      }
    ]
  },

  {
    id: 'acad-ch8',
    pillar: 'autocad',
    chapterNumber: 8,
    title: 'Layouts, Viewports & Plotting',
    subtitle: 'Model vs. Paper Space, PAGESETUP, MVIEW, ZOOM nXP, Viewport Locking, CTB/STB Plot Styles, Lineweights & Batch PUBLISH',
    topics: [
      {
        id: 'acad-8-1',
        title: 'Model Space vs. Paper Space Architecture & PAGESETUP',
        commandsOrFormulas: ['MODEL', 'LAYOUT', 'PAGESETUP', 'MVIEW (MV)', 'VPCLIP', 'CHSPACE'],
        summary: 'Draft 1:1 in Model Space, compose titleblocks at 1:1 mm in Paper Space, and cut multi-scale viewports.',
        mechanics:
          'Model Space holds the full-scale building/site model. Paper Space Layouts represent physical sheets (`ISO A1 = 841×594 mm`, `ISO A3 = 420×297 mm`) plotted at `1 mm = 1 unit`, containing your titleblock, general notes, legends, and one or more `MVIEW` viewports.',
        guidelines: [
          'Always configure `PAGESETUP` using `DWG To PDF.pc3` (or `AutoCAD PDF (High Quality Print).pc3`), select `ISO full bleed` paper sizes so margins equal `0.00 mm`, and lock Plot Scale to `1:1 (1 mm = 1 unit)`.',
          'Create viewports on a dedicated `A-ANNO-VPRT` layer set to `No-Plot` using `MVIEW` (`MV`).',
          'To create an L-shaped or circular detail viewport: draw a closed `PLINE` or `CIRCLE` in Paper Space, then type `MV` -> `O` (Object) and click the shape (or use `VPCLIP` to reshape an existing rectangular viewport).',
          'Use `CHSPACE` to transfer objects cleanly between Model Space and Paper Space without changing their visual size.'
        ],
        proTip: 'Hold `CTRL + R` while activated inside a viewport to cycle focus between overlapping or adjacent viewports on the same sheet!'
      },
      {
        id: 'acad-8-2',
        title: 'Viewport Scaling (ZOOM nXP) & Viewport Locking',
        commandsOrFormulas: ['MSPACE (MS)', 'PSPACE (PS)', 'ZOOM (Z) -> nXP', 'MVIEW -> Lock -> ON', 'VPROTATEASSOC'],
        summary: 'Apply exact mathematical XP zoom factors and lock viewports against accidental mouse-wheel scrolling.',
        mechanics:
          '`Zoom XP` equals `(Millimeters per 1 Model Unit) / Scale_Ratio`. For a drawing in **Millimeters** at `1:100`, `XP = 1/100 = 0.01XP`. For a drawing in **Meters** at `1:100`, `XP = 1000/100 = 10XP`.',
        guidelines: [
          'Double-click inside the viewport (`MSPACE`), pan roughly to the building plan, type `Z` ↵ `0.01XP` ↵ (for mm @ 1:100) or pick `1:100` from the bottom-right Viewport Scale bar.',
          'Double-click outside the viewport (`PSPACE`), select the viewport frame, and lock it immediately via Properties (`Display Locked = Yes`) or `MV` -> `L` -> `ON`.',
          'To rotate the view inside a single viewport (e.g., aligning a long highway bridge horizontally on the sheet) without rotating other viewports: set `VPROTATEASSOC = 1` and simply rotate the viewport border in Paper Space using `ROTATE` (`RO`), or run `UCS` -> `Z` inside the viewport followed by `PLAN`!'
        ],
        proTip: 'If you ever get stuck zoomed all the way inside an active viewport and cannot double-click outside its border to return to Paper Space, simply type `PS` (`PSPACE`) and press Enter!'
      },
      {
        id: 'acad-8-3',
        title: 'Plot Style Tables (.CTB vs .STB), Lineweights & Batch PDF PUBLISH',
        commandsOrFormulas: ['PLOT (CTRL+P)', 'STYLESMANAGER', 'CONVERTPSTYLES', 'LWDISPLAY', 'PUBLISH', 'SSM (Sheet Set Manager)'],
        summary: 'Control line hierarchy (`0.09 mm` to `0.60 mm`), halftone background screening, and 1-click multi-sheet PDF publishing.',
        mechanics:
          'Color-Dependent Plot Styles (`.CTB`) map each of AutoCAD’s 255 index colors to a printed color, screening %, and lineweight (`Color 1 Red = 0.15 mm Black`, `Color 4 Cyan = 0.50 mm Black`, `Color 9 = 60% Screened Grey`). Named Plot Styles (`.STB`) assign plot styles directly to layers regardless of color.',
        guidelines: [
          'Type `LWDISPLAY` -> `ON` in your Layout tab (with "Display plot styles" checked in `PAGESETUP`) to preview true monochrome `.CTB` lineweights live on screen before plotting!',
          'Use Colors `250`–`254` or set `Screening = 40%` on Color `8`/`9` in your `.CTB` file to print architectural background Xrefs in crisp halftone grey underneath dark black (`100%`) structural beams or MEP ductwork.',
          'When plotting to PDF, click `PDF Options...` and uncheck `Include layer information` if you want a lightweight, flat PDF for clients who shouldn’t toggle your CAD layers in Adobe Acrobat.',
          'Use `PUBLISH` (with `BACKGROUNDPLOT = 0` for maximum speed) to batch-plot 50+ layouts across multiple DWGs into a single combined PDF.'
        ],
        proTip: 'Always set `PLOTTRANSPARENCYOVERRIDE = 2` (or check "Plot transparency" in `PAGESETUP`) if your drawing uses solid hatch transparency for architectural shadows or water bodies—note that enabling transparency rasterizes the PDF and increases file size.'
      }
    ]
  },

  {
    id: 'acad-ch9',
    pillar: 'autocad',
    chapterNumber: 9,
    title: 'Data Extraction, Cleanup & Automation',
    subtitle: 'DATAEXTRACTION, FIELD, PURGE/-PURGE, AUDIT, RECOVER, FLATTEN, AutoLISP, .SCR Scripts, acad.pgp & Plugins',
    topics: [
      {
        id: 'acad-9-1',
        title: 'Live Database Schedules & Dynamic Text: DATAEXTRACTION & FIELD',
        commandsOrFormulas: ['DATAEXTRACTION (DX)', 'FIELD (CTRL+F)', 'UPDATEFIELD', 'FIELDEVAL'],
        summary: 'Automate quantity takeoffs directly from DWG geometry and embed self-updating areas, coordinates, and plot dates.',
        mechanics:
          '`FIELD` embeds an evaluated expression (`%<\\AcObjProp Object(%<\\_ObjId ...>%).Area \\f "%lu2%pr2%ct8[1e-006]">%`) inside any Text, MText, or Attribute that recalculates automatically on `SAVE`, `PLOT`, or `REGEN` (`FIELDEVAL = 31`).',
        guidelines: [
          'Live Room Area Label: Type `MTEXT` -> Type `"AREA = "` -> Press `CTRL+F` (`FIELD`) -> Category: `Objects` -> `Object` -> Click the room’s closed polyline -> Property: `Area` -> Click `Additional Format` and set Conversion Factor = `0.000001` (if drawing in mm to display $\text{m}^2$) and Suffix = `" m²"`.',
          'Stretch the room polyline and type `RE` (`REGEN`)—the room area label updates itself instantaneously!',
          'Run `DATAEXTRACTION` (`DX`) to extract block counts, dynamic block parameters, attribute values, and polyline lengths/areas into an Excel `.xlsx` BOQ.'
        ],
        proTip: 'Put a `Filename` and `PlotDate` Field in the bottom margin of your Titleblock border so every printed check-plot automatically stamps the exact `.dwg` file path and timestamp.'
      },
      {
        id: 'acad-9-2',
        title: 'File Hygiene & Crash Recovery: PURGE, -PURGE, AUDIT, RECOVER, FLATTEN',
        commandsOrFormulas: ['PURGE (PU)', '-PURGE -> R (Regapps)', 'AUDIT', 'RECOVER', 'RECOVERALL', 'DRAWINGRECOVERY', 'FLATTEN'],
        summary: 'Shrink bloated 50 MB consultant files down to 2 MB, repair corrupted databases, and flatten 3D survey mess.',
        mechanics:
          'Standard dialog `PURGE` does not purge unreferenced Registered Applications (`RegApps`) left behind by third-party civil/GIS vertical plugins. Only command-line `-PURGE` -> `R` clears the `APPID` table.',
        guidelines: [
          'The 4-Step Consultant File Sanitization Routine (run on every external DWG before Xrefing it into your project):',
          '1. `CHANGE` -> `ALL` -> `P` -> `E` -> `0` (plus `FLATTEN` if needed) to force Z = 0.',
          '2. `OVERKILL` -> `ALL` to strip duplicate overlapping lines.',
          '3. `-PURGE` -> `R` -> `*` -> `N` (purges RegApps), followed by `-PURGE` -> `A` -> `*` -> `N` (purges all unused blocks/layers/styles).',
          '4. `AUDIT` -> `Y` to repair database header errors, then `SAVE`.',
          'If a DWG refuses to open, run `RECOVER` (or `RECOVERALL` if it contains corrupted Xrefs) from a blank tab.'
        ],
        proTip: 'Set `ISAVEPERCENT = 0` and `SAVETIME = 10` in Options so AutoCAD performs full, clean database saves every 10 minutes instead of fragmented incremental saves.'
      },
      {
        id: 'acad-9-3',
        title: 'Customization & Scripting: APPLOAD, .SCR Scripts, acad.pgp & Plugins',
        commandsOrFormulas: ['APPLOAD (AP)', 'SCRIPT (SCR)', 'ALIASEDIT', 'REINIT', 'SYSVARMONITOR'],
        summary: 'Automate repetitive tasks with AutoLISP routines, `.SCR` batch scripts, custom left-hand aliases, and SysVar monitoring.',
        mechanics:
          '`acad.pgp` maps short keyboard aliases to full commands. `SYSVARMONITOR` watches critical system variables (`FILEDIA`, `OSNAPZ`, `MIRRTEXT`, `PICKFIRST`) and alerts you immediately if a rogue script changes them.',
        guidelines: [
          'Use `APPLOAD` -> `Startup Suite` to load your favorite `.lsp` routines (`TLEN`, `NUMINC`, `STEAL`, `YQArch`) automatically in every session.',
          'Type `ALIASEDIT` (or edit `acad.pgp` and run `REINIT`) to bind frequent 2-hand commands (`COPY`, `ROTATE`, `MATCHPROP`, `LAYISO`, `XCLIP`) to fast left-hand keys (`CC`, `RR`, `MM`, `LI`, `XC`) so your right hand never leaves the mouse!',
          'Type `SYSVARMONITOR` and add `OSNAPZ = 1`, `MIRRTEXT = 0`, `FILEDIA = 1`, `PICKFIRST = 1`, `DIMASSOC = 2`, and `PSLTSCALE = 1`—if any crash resets them, click `Reset All` in 1 second!'
        ],
        proTip: 'In a `.SCR` script file, every space or newline acts exactly like pressing the `Enter` key in AutoCAD—avoid trailing spaces at the end of lines unless an extra `Enter` is required!'
      }
    ]
  },

  // =========================================================================
  // PILLAR 2: MICROSOFT EXCEL (8 CHAPTERS)
  // =========================================================================
  {
    id: 'excel-ch1',
    pillar: 'excel',
    chapterNumber: 1,
    title: 'Civil & Construction Engineering Sheets',
    subtitle: 'BOQ, Measurement Book (MB), Contractor RA Bills, Bar Bending Schedule (BBS), Rate Analysis, Material Reconciliation, Mix Ratios & Earthwork',
    topics: [
      {
        id: 'excel-1-1',
        title: 'Bill of Quantities (BOQ), Measurement Book (MB) & Contractor Running Account (RA) Bills',
        commandsOrFormulas: [
          'Qty = Nos × Length × Breadth × Depth',
          'Current_Bill_Qty = Cumulative_Qty - Previous_Bill_Qty',
          'Net_Payable = Gross_Bill - Retention(5%) - Mobilization_Recovery - Tax/VAT'
        ],
        summary: 'Structure auditable tender BOQs, site Measurement Books, and multi-stage Contractor Running Account (RA) certificates.',
        mechanics:
          'An engineering workbook separates raw site dimensions (**Measurement Book / Takeoff Sheet**) from unit pricing (**BOQ Abstract**) and periodic financial certification (**RA Bill**). Never type hard-coded numbers (`=12.45+18.20`) inside a BOQ Quantity cell—link every BOQ cell to a `SUM` or `SUBTOTAL` on the MB sheet.',
        guidelines: [
          'Measurement Book (`MB`) Columns: `Item Ref | Floor/Grid Location | Description | Deduction Flag (+1 or -1) | Nos | Length (m) | Breadth (m) | Depth/Height (m) | Line Qty (=Sign*Nos*PROD(L,B,D))`.',
          'Window/Door Deduction Rule: In Masonry and Plastering takeoffs, enter `Sign = -1` on opening rows so `=D10 * E10 * PRODUCT(F10:H10)` automatically deducts openings without needing separate subtraction formulas!',
          'Contractor Running Account (`RA`) Bill Columns: `BOQ Qty | Unit | Rate | BOQ Amount | Previous Certified Qty | Current Period Qty | Cumulative Qty (=Prev+Curr) | Previous Amount | Current Bill Amount | Cumulative Amount | % Executed (=Cum_Qty/BOQ_Qty)`.',
          'Add a Conditional Formatting rule on `Cumulative Qty > BOQ Qty` to highlight Quantity Overruns / Variation Orders (`VO`) in amber/red immediately.'
        ],
        proTip: 'Always track RA Bills on a **Cumulative Minus Previous** basis (`Current Payable = Cumulative Certified to Date - Total Previously Certified`)—this self-corrects any rounding discrepancies across interim payment certificates (IPCs).'
      },
      {
        id: 'excel-1-2',
        title: 'Bar Bending Schedule (BBS), Rate Analysis & Material Reconciliation Sheets',
        commandsOrFormulas: [
          'Unit_Wt (kg/m) = ROUND(Dia_mm^2 / 162.162, 3)',
          'Cut_Length_m = (A + B + C + 2*Hook - Bend_Deductions) / 1000',
          'Wastage_% = (Actual_Issued - Theoretical_BOQ) / Theoretical_BOQ'
        ],
        summary: 'Build BS 8666 / ACI 315 Bar Bending Schedules, itemized Rate Analysis sheets, and Theoretical vs. Actual Material Reconciliation matrices.',
        mechanics:
          '**BBS** calculates exact cutting length and splits total weight into diameter columns (`8, 10, 12, 16, 20, 25, 32 mm`) via `IF` or `SUMIFS`. **Rate Analysis** builds unit rates from Labor + Material + Plant + Wastage + Overhead & Profit (`OH&P`). **Material Reconciliation** audits store issues against theoretical BOQ consumption.',
        guidelines: [
          'BBS Bend Deductions: Deduct $2d$ for each $90^\\circ$ bend, $3d$ for each $135^\\circ$ bend, and $4d$ for $180^\\circ$ hooks; add $10d$ (or $\\max(12d, 75\\text{ mm})$) for seismic stirrup hooks.',
          'BBS Diameter Matrix: Use `=IF($D10=K$4, ($G10*$H10*$I10)/1000, 0)` across columns `K:Q` (`8mm` to `32mm`) so the bottom `SUM` row gives exact Metric Tons per diameter for steel procurement!',
          'Rate Analysis Structure (e.g., for $1\\text{ m}^3$ RCC M25): Calculate Dry Volume $= 1.54\\text{ m}^3$, multiply by mix proportions for Cement (bags), Sand ($\text{m}^3$), Stone ($\text{m}^3$), Admixture (L), Mason/Helper man-days, Mixer hire, add `15%` Contractor Profit & Overhead, and divide by base unit.',
          'Material Reconciliation: Compare `Theoretical Consumption (from executed MB quantities)` vs `Actual Consumption (Store Issue + Opening Stock - Closing Stock at Site)` and flag if Rebar Wastage exceeds `3%–5%` or Concrete Wastage exceeds `2%–3%`.'
        ],
        proTip: 'Link all Unit Rates in your Rate Analysis sheets to a single central **Master Basic Price List** tab (`Cement/bag`, `Rebar/MT`, `Diesel/L`, `Mason/day`)—updating 5 market prices updates 150 BOQ item rates instantaneously!'
      },
      {
        id: 'excel-1-3',
        title: 'Concrete / Mortar Mix Calculators & Earthwork Cut-Fill Sheets',
        commandsOrFormulas: [
          'Dry_Concrete_Vol = Wet_Vol × 1.54',
          'Dry_Brick_Mortar_Vol = Wet_Mortar_Vol × 1.33',
          'Dry_Plaster_Vol = Wet_Plaster_Area × Thickness × 1.33 × 1.20 (joint/unevenness)',
          'Cut_Fill_Vol = ((Area_1 + Area_2) / 2) × Station_Length'
        ],
        summary: 'Compute exact dry material quantities for concrete, brickwork, and plastering, and tabulate station-by-station earthwork volumes.',
        mechanics:
          'Dry loose ingredients (cement, sand, stone) contain air voids that compact when water is added. Multiplying wet compacted volume by `1.54` (for concrete) or `1.33` (for mortar) converts finished drawing volume into bulk dry ingredient volume.',
        guidelines: [
          'Cement Bag Conversion: $1\\text{ bag of OPC cement} = 50\\text{ kg} \\approx 0.0347\\text{ m}^3 = 1.226\\text{ cft}$ (bulk density $1440\\text{ kg/m}^3$).',
          'Brickwork Rule (Standard Metric/Regional Bricks): Deduct mortar joint thickness (`10 mm` or `12 mm`) when calculating brick count per $\text{m}^3$, then subtract `Brick Count × Single Brick Volume` from $1.00\\text{ m}^3$ to get Wet Mortar Volume ($\\approx 0.25\\text{–}0.30\\text{ m}^3$ per $\text{m}^3$ of brickwork).',
          'Earthwork Mass Haul & Cut/Fill Sheet: Include columns for `Chainage (m) | Existing GL | Proposed Formation RL | Depth of Cut/Fill | Cut Area (m²) | Fill Area (m²) | Cut Vol (m³) | Compacted Fill Vol (m³) | Cumulative Net Mass Haul (=Prev + Cut - Fill*Compaction_Factor)`.'
        ],
        proTip: 'In Earthwork Mass Haul sheets, plotting the **Cumulative Net Volume** column as an Excel Line Chart against Chainage creates a true **Bruckner Mass Haul Diagram** where rising slopes indicate Cut, falling slopes indicate Fill, and horizontal lines show economical free-haul balance loops!'
      }
    ]
  },

  {
    id: 'excel-ch2',
    pillar: 'excel',
    chapterNumber: 2,
    title: 'Lookup & Reference Functions',
    subtitle: 'XLOOKUP, VLOOKUP, HLOOKUP, INDEX, MATCH, XMATCH, CHOOSE, INDIRECT, OFFSET & ADDRESS',
    topics: [
      {
        id: 'excel-2-1',
        title: 'Modern & Classic Lookups: XLOOKUP, VLOOKUP, HLOOKUP',
        commandsOrFormulas: [
          '=XLOOKUP(lookup_val, lookup_array, return_array, [if_not_found], [match_mode])',
          '=VLOOKUP(val, table, col_idx, FALSE)',
          '=HLOOKUP(val, table, row_idx, FALSE)'
        ],
        summary: 'Fetch rebar weights, steel section properties, and BOQ rates cleanly across tables with built-in fallback handling and exact/next-larger matching.',
        mechanics:
          '`XLOOKUP` replaces both `VLOOKUP` and `HLOOKUP`: it can look left or right, never breaks when columns are inserted, defaults to exact match (`0`), and includes a `[match_mode] = 1` option that automatically selects the **next larger standard beam/pipe size** when a calculated design requirement falls between two catalog sizes!',
        guidelines: [
          'Standard Exact Lookup: `=XLOOKUP(B5, tbl_Rates[Item_Code], tbl_Rates[Unit_Rate], "Missing Code")` fetches the unit rate and prints `"Missing Code"` instead of `#N/A` if not found.',
          'Engineering "Next Larger Standard Size" Selection (`match_mode = 1`): Suppose required steel section modulus $Z_{\\text{req}} = 415\\text{ cm}^3$ is in `D12`. Use `=XLOOKUP(D12, tbl_Steel[Zxx], tbl_Steel[Designation], "Exceeds Catalog", 1)` to automatically pick the lightest steel beam with $Z_{xx} \\ge 415\\text{ cm}^3$!',
          'When working in legacy workbooks using `VLOOKUP`, ALWAYS set the 4th argument (`range_lookup`) to `FALSE` (`0`) for item codes and designations so Excel does not return wrong approximate matches.'
        ],
        proTip: '`XLOOKUP` can return an entire row of 6 properties (`Area, Depth, Width, Tw, Tf, Ixx`) in a single formula: `=XLOOKUP(B5, tbl_Steel[Name], tbl_Steel[[Area]:[Ixx]])`!'
      },
      {
        id: 'excel-2-2',
        title: 'Two-Way Matrix Lookups: INDEX, MATCH & XMATCH',
        commandsOrFormulas: [
          '=INDEX(Data_Matrix, MATCH(Row_Val, Row_Headers, 0), MATCH(Col_Val, Col_Headers, 0))',
          '=XMATCH(lookup_val, lookup_array, [match_mode])'
        ],
        summary: 'Query 2D engineering code tables (Concrete Grade vs. Shear Stress $\\tau_c$, Wind Zone vs. Building Height, or Pipe Dia vs. Velocity).',
        mechanics:
          '`MATCH` returns the numeric row or column position (`1, 2, 3...`) of a header, and `INDEX(array, row_num, col_num)` retrieves the cell at the intersection of that row and column.',
        guidelines: [
          'For 2D Code Tables (e.g., ACI/BNBC/IS 456 Design Shear Strength $\\tau_c$ by `% Tension Steel Pt` down rows `B5:B20` and `Concrete Grade M20–M40` across `C4:G4`):',
          'Use `=INDEX($C$5:$G$20, MATCH(Pt_Val, $B$5:$B$20, 1), MATCH(Conc_Grade, $C$4:$G$4, 0))` to pull the design value automatically.',
          'Use `XMATCH` with `match_mode = -1` (Exact or next smaller) and `1` (Exact or next larger) to grab the two bounding rows for automated linear interpolation.'
        ],
        proTip: '`INDEX` and `MATCH` are non-volatile functions—they recalculate only when their referenced data changes, keeping 50,000-row estimation workbooks lightning fast.'
      },
      {
        id: 'excel-2-3',
        title: 'Dynamic Ranges & Sheet Routing: CHOOSE, INDIRECT, OFFSET, ADDRESS',
        commandsOrFormulas: [
          '=CHOOSE(index_num, val1, val2, val3)',
          '=INDIRECT("\'" & B5 & "\'!G40")',
          '=OFFSET(ref, rows, cols, [height], [width])',
          '=ADDRESS(row_num, col_num)'
        ],
        summary: 'Pull totals dynamically from floor sheet names typed in cells and switch between design codes (`ACI`, `Eurocode`, `BS`) via a dropdown.',
        mechanics:
          '`INDIRECT` converts a text string (like `"Floor_3!H50"`) into a live cell reference. `CHOOSE` selects the $k$-th item or range based on a scenario index (`1, 2, 3`). `OFFSET` builds a dynamic rectangular range from a starting anchor cell.',
        guidelines: [
          'Multi-Sheet BOQ Summary Table: List your worksheet tab names (`"Substructure"`, `"Ground_Floor"`, `"Floor_1"`, `"Roof"`) in `A5:A8`. Assuming every sheet has its grand total in cell `H100`, enter `=INDIRECT("\'" & A5 & "\'!H100")` in `B5` and drag down to build an instant project summary!',
          'Use `CHOOSE(Code_Index, SafetyFactor_ACI, SafetyFactor_BS, SafetyFactor_EC2)` to switch load factors across an entire structural design sheet from a single Option Button or Dropdown.',
          'Use `OFFSET` carefully—both `INDIRECT` and `OFFSET` are volatile functions (they recalculate on every edit). For dynamic expanding ranges, prefer Excel Structured Tables (`tbl_BOQ[Amount]`) or `INDEX(A:A, 1):INDEX(A:A, COUNTA(A:A))`.'
        ],
        proTip: 'Always wrap sheet names inside single quotes in `INDIRECT("\'" & A5 & "\'!G20")`—without single quotes, any sheet tab name containing a space (`"1st Floor"`) will return a `#REF!` error!'
      }
    ]
  },

  {
    id: 'excel-ch3',
    pillar: 'excel',
    chapterNumber: 3,
    title: 'Logical & Conditional Functions',
    subtitle: 'IF, IFS, AND, OR, NOT, IFERROR, SUMIF/SUMIFS, SUMPRODUCT, COUNTIF/COUNTIFS, AVERAGEIFS, SUBTOTAL & AGGREGATE',
    topics: [
      {
        id: 'excel-3-1',
        title: 'Engineering Design Checks: IF, IFS, AND, OR, NOT, IFERROR, IFNA',
        commandsOrFormulas: [
          '=IF(AND(Demand <= Capacity, Deflection <= L/250), "SAFE", "REDESIGN")',
          '=IFS(Ratio<=0.5, "Low", Ratio<=0.85, "Optimal", Ratio<=1.0, "Near Limit", TRUE, "OVERSTRESSED")',
          '=IFERROR(Calculation, 0)'
        ],
        summary: 'Automate structural pass/fail code checks, multi-tier geotechnical classifications, and clean division-by-zero protection.',
        mechanics:
          'Instead of deeply nested `IF(IF(IF(...)))` chains, `IFS` evaluates conditions sequentially and returns the result of the first `TRUE` test (`TRUE` at the end acts as the catch-all `Else` branch). `AND` requires every sub-check to pass; `OR` triggers if any single failure mode occurs.',
        guidelines: [
          'Combined Structural Check: `=IF(AND(Mu <= Phi_Mn, Vu <= Phi_Vn, Rho >= Rho_min, Rho <= Rho_max), "OK - SAFE", "FAIL - INCREASE SECTION")` checks flexure, shear, and reinforcement limits simultaneously.',
          'Soil SPT Consistency Classification with `IFS`: `=IFS(N_val<4, "Very Soft", N_val<8, "Soft", N_val<15, "Firm", N_val<30, "Stiff", TRUE, "Very Stiff / Hard")`.',
          'Wrap unit rate or percentage variance formulas in `=IFERROR(Current_Cost / BOQ_Budget, 0)` so unstarted rows with `0` budget display `0.0%` instead of `#DIV/0!` which breaks bottom `SUM` totals!'
        ],
        proTip: 'Prefer `IFNA` over `IFERROR` around `XLOOKUP`/`MATCH` formulas—`IFNA` catches legitimate "item not found" (`#N/A`) cases without hiding real formula syntax or `#DIV/0!` bugs!'
      },
      {
        id: 'excel-3-2',
        title: 'Conditional Aggregations, Counting & Averages: SUM, SUMIF, SUMIFS, SUMPRODUCT, COUNT, COUNTA, COUNTBLANK, COUNTIF, COUNTIFS, AVERAGE, AVERAGEIF, AVERAGEIFS',
        commandsOrFormulas: [
          '=SUMIFS(sum_range, criteria_range1, criteria1, ...)',
          '=SUMPRODUCT(Qty_Range, Rate_Range)',
          '=COUNT(num_range) | =COUNTA(any_range) | =COUNTBLANK(range)',
          '=COUNTIFS(range1, crit1, ...) | =AVERAGEIFS(avg_range, range1, crit1, ...)'
        ],
        summary: 'Compute BOQ totals without helper columns, audit unpriced blank BOQ rows, count test cylinders, and calculate mean concrete strength by grade.',
        mechanics:
          '`SUM` / `SUMIF` / `SUMIFS` aggregate numeric totals; `COUNT` counts only numeric cells, `COUNTA` counts all non-empty cells (text + numbers), and `COUNTBLANK` counts empty unpriced/unfilled cells. `SUMPRODUCT` multiplies corresponding arrays and sums the products ($\sum A_i B_i$).',
        guidelines: [
          'BOQ Completeness Audit (`COUNT` vs `COUNTA` vs `COUNTBLANK`): Place `=COUNTBLANK(F5:F300)` at the top of your Tender Rate column—if it returns anything greater than `0`, you have unpriced items in your bid!',
          'Direct Total Cost without an Amount Column: `=SUMPRODUCT(D5:D200, E5:E200)` multiplies `Quantity × Unit Rate` for every row and sums the grand total in one formula.',
          'Quality Control Cube Strength Mean (`AVERAGEIFS` & `COUNTIFS`): Use `=AVERAGEIFS(MPa_Col, Grade_Col, "M30", Age_Col, 28)` to compute the mean 28-day cylinder strength for M30 concrete, and `=COUNTIFS(Grade_Col, "M30", MPa_Col, "<30")` to count any failing samples!'
        ],
        proTip: 'You can use wildcards (`*` and `?`) inside `SUMIF`, `SUMIFS`, `COUNTIF`, `COUNTIFS`, and `AVERAGEIFS`: `=SUMIFS(Amount_Col, WBS_Col, "03.02.*")` sums every sub-item belonging to Concrete Work package `03.02`!'
      },
      {
        id: 'excel-3-3',
        title: 'Filter-Aware Totals & Sub-Totals: SUBTOTAL (9 vs 109) & AGGREGATE',
        commandsOrFormulas: [
          '=SUBTOTAL(9, G5:G50)',
          '=SUBTOTAL(109, G5:G50)',
          '=AGGREGATE(9, 7, G5:G500)'
        ],
        summary: 'Prevent double-counting section subtotals in long BOQs and sum only visible filtered rows containing errors.',
        mechanics:
          'When you place `=SUBTOTAL(9, ...)` at the bottom of Civil, Architectural, and MEP sections in a BOQ, a grand total `=SUBTOTAL(9, G5:G500)` at the very bottom of the sheet **automatically ignores all intermediate `SUBTOTAL` cells**—completely eliminating the #1 cause of double-counted tender errors!',
        guidelines: [
          'Never use `=SUM(G5:G500)` across a BOQ column that contains section subtotals! Use `=SUBTOTAL(9, ...)` for every section subtotal AND for the Grand Total at the bottom.',
          '`SUBTOTAL(9, range)` includes manually hidden rows but respects AutoFilter; `SUBTOTAL(109, range)` ignores BOTH filtered-out rows and manually hidden rows.',
          'Use `=AGGREGATE(9, 7, G5:G500)` (`9 = SUM`, `7 = Ignore hidden rows AND error values`) when summing a preliminary cost column where a few unpriced items still show `#N/A` or `#DIV/0!`.'
        ],
        proTip: 'Press `ALT + =` at the bottom of a filtered Excel Table column to insert `=SUBTOTAL(109, ...)` automatically.'
      }
    ]
  },

  {
    id: 'excel-ch4',
    pillar: 'excel',
    chapterNumber: 4,
    title: 'Math, Engineering & Matrix Functions',
    subtitle: 'ROUND/ROUNDUP/MROUND/CEILING.MATH, CONVERT, SQRT/POWER/MOD, Trig Functions (RADIANS/DEGREES) & Matrix Solver (MMULT/MINVERSE/MDETERM)',
    topics: [
      {
        id: 'excel-4-1',
        title: 'Construction Rounding & Modular Sizing: ROUND, ROUNDUP, ROUNDDOWN, MROUND, CEILING.MATH, FLOOR.MATH',
        commandsOrFormulas: [
          '=ROUNDUP(Span_mm / Spacing_mm, 0) + 1',
          '=CEILING.MATH(Required_Depth_mm, 25)',
          '=FLOOR.MATH(Provided_Spacing_mm, 5)',
          '=MROUND(Val, Multiple)'
        ],
        summary: 'Round rebar counts up to whole bars, snap concrete member depths up to 25 mm formwork increments, and round stirrup spacing down for safety.',
        mechanics:
          'In structural design, direction of rounding dictates safety: **Number of Bars** and **Member Depth** must round **UP** (`ROUNDUP` / `CEILING.MATH`), whereas **Maximum Stirrup/Tie Spacing** and **Capacity** must round **DOWN** (`ROUNDDOWN` / `FLOOR.MATH`).',
        guidelines: [
          'Number of Stirrups / Slab Bars across a Span: `=ROUNDUP(Clear_Span / Spacing, 0) + 1` (always round UP and add 1 starter bar!).',
          'Modular Concrete Formwork Depth: If theoretical required beam effective depth + cover equals `514.3 mm`, use `=CEILING.MATH(514.3, 25)` to snap automatically to a practical `525 mm` carpenter formwork size (or `550 mm` using `50` increment).',
          'Safe Rebar Spacing: If required stirrup spacing $s_{\\text{max}} = 168.4\\text{ mm}$, use `=FLOOR.MATH(168.4, 10)` to specify `160 mm c/c` (rounding UP to `170 mm` would violate shear code!).',
          'Always wrap BOQ `Amount = ROUND(Qty * Rate, 2)` inside `ROUND(..., 2)` so invisible 4th-decimal fractions do not cause a 1-cent discrepancy between printed column sums and calculator checks.'
        ],
        proTip: 'Never merely decrease decimal places using the Home ribbon toolbar button—formatting only hides decimals visually while Excel still sums the unrounded floating-point value in the background!'
      },
      {
        id: 'excel-4-2',
        title: 'Unit Conversions, Exponents & Trigonometry: CONVERT, SQRT, POWER, PI, ABS, MOD, SIN/COS/TAN, ASIN/ACOS/ATAN, RADIANS/DEGREES',
        commandsOrFormulas: [
          '=CONVERT(value, "from_unit", "to_unit")',
          '=SQRT(x) | =POWER(x, y) | =PI() | =ABS(x) | =MOD(n, d)',
          '=SIN(RADIANS(Deg)) | =COS(RADIANS(Deg)) | =TAN(RADIANS(Deg))',
          '=DEGREES(ASIN(x)) | =DEGREES(ACOS(x)) | =DEGREES(ATAN(Rise/Run))'
        ],
        summary: 'Perform built-in SI/Imperial unit conversions, evaluate circular areas (`PI`), and compute earth pressure ($K_a, K_p$) and truss angles.',
        mechanics:
          'Excel’s `SIN`, `COS`, and `TAN` functions strictly expect angles in **Radians**, and inverse trig functions (`ASIN`, `ACOS`, `ATAN`) return angles in **Radians**! Always wrap degree inputs in `RADIANS(...)` and wrap inverse trig outputs in `DEGREES(...)`.',
        guidelines: [
          'Built-In `CONVERT` Function Examples: `=CONVERT(100, "ft", "m")` ($30.48\\text{ m}$), `=CONVERT(1, "m3", "ft3")` ($35.3147\\text{ cft}$), `=CONVERT(1000, "lbm", "kg")`.',
          'Circular Pile Area & Hydraulic Radius (`PI`, `POWER`, `SQRT`, `ABS`): Pile Area $= \\text{`=PI()*POWER(Dia/2, 2)`}$; Resultant Vector Length $= \\text{`=SQRT(Fx^2 + Fy^2)`}$; Absolute Eccentricity $|e| = \\text{`=ABS(M / P)`}$.',
          'Rankine Active Earth Pressure Coefficient ($K_a$) for Soil Friction Angle $\\phi$ (in cell `C5` in degrees): `=(1 - SIN(RADIANS(C5))) / (1 + SIN(RADIANS(C5)))` (or `=TAN(RADIANS(45 - C5/2))^2`).',
          'Inverse Trig (`ASIN`, `ACOS`, `ATAN`) for Roof Pitch / Strut-and-Tie Angle $\\theta$: `=DEGREES(ATAN(Rise / Run))` or `=DEGREES(ACOS(Adjacent / Hypotenuse))`.'
        ],
        proTip: 'For area and volume conversions inside `CONVERT`, append `2` or `3` or use `"m2"`, `"ft2"`, `"in2"`, `"m3"`, `"ft3"`, `"gal"`, `"l"`.'
      },
      {
        id: 'excel-4-3',
        title: 'Linear Algebra & Structural Stiffness Matrices: MMULT, MINVERSE, MDETERM',
        commandsOrFormulas: [
          '=MDETERM(Stiffness_Matrix_K)',
          '=MMULT(MINVERSE(Matrix_K), Load_Vector_F)',
          '=MMULT(TRANSPOSE(Matrix_T), MMULT(Local_k, Matrix_T))'
        ],
        summary: 'Solve simultaneous equations, continuous beam stiffness matrices, and 3D coordinate transformations natively in Excel.',
        mechanics:
          '`MINVERSE(K)` computes the inverse matrix $[K]^{-1}$ via Gaussian elimination, and `MMULT(A, B)` performs matrix multiplication ($[A]_{m \\times n} \\times [B]_{n \\times p} = [C]_{m \\times p}$).',
        guidelines: [
          'Check stability first: Run `=MDETERM(B4:E7)` on your stiffness matrix $[K]$. If the determinant is `0` (or $< 10^{-12}$), the structure is unstable (singular matrix).',
          'Solve $[K]\\{u\\} = \\{F\\}$: In cell `I4`, enter `=MMULT(MINVERSE(B4:E7), G4:G7)` to solve all unknown displacements/rotations simultaneously.',
          'Compute Member Global Stiffness $[K_g] = [T]^T [k_l] [T]$: Nest two `MMULT` calls as `=MMULT(TRANSPOSE(T_mat), MMULT(k_local, T_mat))`.'
        ],
        proTip: 'In Excel 365/2021+, dynamic array formulas spill automatically when you press `Enter`. In older Excel 2016/2019, select the full output range first and press `CTRL + SHIFT + ENTER`.'
      }
    ]
  },

  {
    id: 'excel-ch5',
    pillar: 'excel',
    chapterNumber: 5,
    title: 'Text, Date & Dynamic Array Functions',
    subtitle: 'TEXTJOIN/LEFT/MID/FIND/SUBSTITUTE, WORKDAY.INTL/NETWORKDAYS.INTL/DATEDIF & Modern LET/LAMBDA/FILTER/SORT/UNIQUE/SEQUENCE',
    topics: [
      {
        id: 'excel-5-1',
        title: 'String Parsing & Rebar Callouts: TEXTJOIN, CONCAT, LEFT, RIGHT, MID, LEN, FIND, SEARCH, TRIM, CLEAN, SUBSTITUTE, REPLACE, VALUE, TEXT',
        commandsOrFormulas: [
          '=TEXTJOIN(" + ", TRUE, B5:E5) | =CONCAT(A2:C2)',
          '=LEFT(text, n) | =MID(text, start, n) | =RIGHT(text, n) | =LEN(text)',
          '=FIND("x", A2) (case-sensitive) | =SEARCH("beam", A2) (case-insensitive)',
          '=VALUE(TRIM(CLEAN(SUBSTITUTE(A5, "m2", "")))) | =TEXT(Val, "0.00")'
        ],
        summary: 'Generate formatted AutoCAD rebar callout strings (`"4-Ø20 + 2-Ø16"`) and parse imported CAD/Survey text strings into numbers.',
        mechanics:
          '`FIND` (case-sensitive) and `SEARCH` (case-insensitive, supports wildcards) locate the character position of delimiters like `"x"` or `"-"`, allowing `LEFT`, `MID`, `RIGHT`, `LEN`, and `REPLACE` to slice dimension strings (`"300x600"`). Wrapping numeric cells in `TEXT(cell, "0.00")` preserves decimal places inside concatenated labels.',
        guidelines: [
          'Extract Width `B` and Depth `D` from `"300x600"` in cell `A2`: Width `=VALUE(LEFT(A2, FIND("x", A2)-1))` (`300`), and Depth `=VALUE(RIGHT(A2, LEN(A2)-FIND("x", A2)))` (`600`).',
          'Combine Multi-Layer Beam Bars cleanly (`TEXTJOIN` & `CONCAT`): `=TEXTJOIN(" + ", TRUE, IF(B5:D5>0, B5:D5 & "-Ø" & $B$4:$D$4, ""))` joins only non-zero bar layers with `" + "` and ignores empty columns!',
          'Clean Imported PDF/CAD Data: Wrap pasted text in `=VALUE(TRIM(CLEAN(SUBSTITUTE(A5, "m2", ""))))` to strip trailing `"m2"` unit suffixes and non-printing ASCII characters and convert to a true calculable number.'
        ],
        proTip: 'Use custom number formats (`CTRL+1 -> Number -> Custom -> 0.00 "m³"` or `0 "mm c/c"`) instead of typing units inside cells—the cell displays `"14.50 m³"` on printouts while remaining a pure number (`14.5`) for `SUM` and multiplication!'
      },
      {
        id: 'excel-5-2',
        title: 'Construction Schedule & Contract Dates: TODAY, NOW, DATE, DATEDIF, WORKDAY, WORKDAY.INTL, NETWORKDAYS, NETWORKDAYS.INTL, EDATE, EOMONTH',
        commandsOrFormulas: [
          '=TODAY() | =NOW() | =DATE(Year, Month, Day)',
          '=WORKDAY(Start, Days, [Holidays]) | =WORKDAY.INTL(Start, Days, "0000100", Holidays)',
          '=NETWORKDAYS(Start, End, [Holidays]) | =NETWORKDAYS.INTL(Start, End, 7, Holidays)',
          '=DATEDIF(Start_Date, Finish_Date, "d") | =EDATE(Date, Months) | =EOMONTH(Date, 0)'
        ],
        summary: 'Track live contract elapsed time (`TODAY`/`DATEDIF`) and calculate working days using 5-day (`WORKDAY`) or 6-day (`WORKDAY.INTL`) site calendars.',
        mechanics:
          '`TODAY()` returns the live current date for countdown trackers (`=Contract_Finish - TODAY()`). Standard `WORKDAY` and `NETWORKDAYS` assume a 5-day week (Sat/Sun off), whereas `WORKDAY.INTL` and `NETWORKDAYS.INTL` let you define a 6-day construction site workweek (`"0000100"` = Friday off only).',
        guidelines: [
          '7-Character Weekend String (`Mon-Tue-Wed-Thu-Fri-Sat-Sun`, where `0 = Workday`, `1 = Weekend`): Use `"0000100"` for a 6-day site week with Friday off, or `"0000001"` for a 6-day site week with Sunday off.',
          'Calculate Task Finish Date: `=WORKDAY.INTL(Start_Date, Working_Days - 1, "0000100", $H$5:$H$25)` (where `$H$5:$H$25` lists public holidays and rain-out days).',
          'Calculate Defect Liability Period (`DLP` = 12 or 24 months from Handover): `=EDATE(Handover_Date, 12)` returns the exact calendar date 12 months later, and `=EOMONTH(Invoice_Date, 1)` returns the last day of next month for payment due dates.'
        ],
        proTip: 'Why subtract 1 in `WORKDAY.INTL(Start_Date, Duration - 1, ...)`? Because if a 1-day task starts on Monday morning, it finishes on Monday evening—not Tuesday!'
      },
      {
        id: 'excel-5-3',
        title: 'Modern Dynamic Arrays & Named Variables: LET, LAMBDA, FILTER, SORT, SORTBY, UNIQUE, SEQUENCE',
        commandsOrFormulas: [
          '=LET(b, 300, d, 550, fc, 25, fy, 500, ...)',
          '=LAMBDA(d, ROUND((d^2)/162.162, 3))',
          '=FILTER(tbl_BOQ, tbl_BOQ[Floor]="GF", "No Items")',
          '=SORT(UNIQUE(tbl_BBS[Dia_mm])) | =SORTBY(tbl_BOQ, tbl_BOQ[Amount], -1) | =SEQUENCE(20)'
        ],
        summary: 'Write readable formulas with local variables (`LET`), reusable custom functions without VBA (`LAMBDA`), and live sorted/filtered sub-schedules.',
        mechanics:
          '`LET` assigns local names (`b, d, fc, fy`) inside a formula so sub-expressions are evaluated once. `LAMBDA` lets you define custom named functions inside Excel’s Name Manager (`CTRL+F3`) without needing `.xlsm` VBA macros! `FILTER`, `SORT`, `SORTBY`, `UNIQUE`, and `SEQUENCE` spill dynamic arrays automatically.',
        guidelines: [
          'Reinforced Concrete Flexural Depth Check with `LET`: `=LET(Mu_Nmm, B5*10^6, b, C5, d, D5, fc, E5, fy, F5, Rn, Mu_Nmm/(0.9*b*d^2), rho, (0.85*fc/fy)*(1 - SQRT(1 - (2*Rn)/(0.85*fc))), ROUND(rho*b*d, 1))` computes exact required steel area $A_s$ ($\text{mm}^2$) in one clean cell!',
          'Create a Macro-Free Custom Function with `LAMBDA`: Open `Formulas -> Name Manager -> New` -> Name it `RebarWt` -> Refers to: `=LAMBDA(dia_mm, ROUND((dia_mm^2)/162.162, 3))` -> Now use `=RebarWt(16)` anywhere in the workbook!',
          'Top Cost Items Ranking (`SORTBY` & `FILTER`): Use `=SORTBY(tbl_BOQ, tbl_BOQ[Amount], -1)` to automatically rank all BOQ items from highest cost to lowest cost for Pareto 80/20 value engineering!'
        ],
        proTip: 'Combine `SORT(UNIQUE(range))` to create a self-updating list of all unique Concrete Grades or Rebar Diameters currently used in your schedule.'
      }
    ]
  },

  {
    id: 'excel-ch6',
    pillar: 'excel',
    chapterNumber: 6,
    title: 'Data Management & Analysis Tools',
    subtitle: 'Data Validation, Conditional Formatting, Flash Fill, Text to Columns, Remove Duplicates, Goal Seek, Scenario Manager & Solver',
    topics: [
      {
        id: 'excel-6-1',
        title: 'Input Guardrails & Visual Alerts: Data Validation & Conditional Formatting',
        commandsOrFormulas: [
          'Data -> Data Validation -> Allow: List (Source: =8,10,12,16,20,25,32)',
          'Conditional Formatting -> New Rule -> Use a formula: =$J5="FAIL"'
        ],
        summary: 'Prevent invalid rebar diameters or concrete grades from being typed and highlight over-budget or failing structural rows automatically.',
        mechanics:
          'Data Validation restricts cell entry to pre-approved lists or mathematical bounds before calculation occurs. Formula-driven Conditional Formatting (`=$ColumnRow = Condition`) formats an entire table row based on a single status column.',
        guidelines: [
          'Standard Rebar Diameter Dropdown: Select the Diameter column in your BBS -> `Data -> Data Validation -> Allow: List` -> Enter `8,10,12,16,20,25,28,32` so no one can accidentally type `15 mm` or `18 mm`!',
          'Custom Formula Validation (Prevent Duplicate Bar Marks): Select `B5:B200` -> `Data Validation -> Custom` -> Formula: `=COUNTIF($B$5:$B$200, B5)=1` with an Error Alert `"Duplicate Bar Mark!"`.',
          'Full-Row Conditional Formatting: Select `A5:K100` -> `Conditional Formatting -> New Rule -> Use a formula` -> Enter `=$K5="FAIL"` (note the `$` ONLY before `K`, not before `5`!) and set Fill to soft red. Now the entire beam row turns red whenever Column K flags `"FAIL"`!'
        ],
        proTip: 'Use Conditional Formatting `Data Bars` (Solid Fill) on your `% Executed` column in Contractor RA Bills and Project Trackers to turn a number column into an instant visual progress bar.'
      },
      {
        id: 'excel-6-2',
        title: 'Rapid Data Cleaning: Flash Fill (CTRL+E), Text to Columns, Remove Duplicates & Consolidation',
        commandsOrFormulas: ['CTRL + E (Flash Fill)', 'Data -> Text to Columns', 'Data -> Remove Duplicates', 'Data -> Consolidate'],
        summary: 'Split combined CAD dimension strings (`"400x600"`), clean Total Station CSV logs, and deduplicate material catalogs in seconds.',
        mechanics:
          '`Text to Columns` splits a single column along a delimiter (`x`, `,`, `-`, `/`) into separate numeric columns. `Flash Fill` (`CTRL+E`) detects pattern transformations from a single typed example.',
        guidelines: [
          'Splitting Column/Beam Sizes (`"400x650"` into Width `400` and Depth `650`): Select the column -> `Data -> Text to Columns -> Delimited -> Other: "x"` -> Finish!',
          'Flash Fill (`CTRL+E`): If Column A contains messy CAD layer names (`"S-BEAM-B12-300x600"`), type `"B12"` in `B2`, click `B3`, and press `CTRL + E`—Excel extracts the beam mark for all 500 rows instantly!',
          'Use `Data -> Remove Duplicates` when building a master BOQ item catalog from multiple sub-consultant sheets.'
        ],
        proTip: 'In Excel 365, you can also split `"400x650"` dynamically with a formula using `=VALUE(TEXTSPLIT(A2, "x"))`!'
      },
      {
        id: 'excel-6-3',
        title: 'Engineering Back-Calculation & Optimization: Goal Seek, Scenario Manager, Data Tables & Solver',
        commandsOrFormulas: [
          'Data -> What-If Analysis -> Goal Seek',
          'Data -> What-If Analysis -> Data Table',
          'Data -> Solver (GRG Nonlinear / Simplex LP)'
        ],
        summary: 'Solve implicit engineering equations (Manning’s pipe depth, neutral axis depth $c$, footing width $B$) and minimize structural cost with Solver.',
        mechanics:
          '**Goal Seek** uses Newton-Raphson iteration to vary ONE input cell until a target formula cell reaches a specific value (e.g., `Demand / Capacity = 1.000` or `Sum of Forces = 0`). **Solver** varies MULTIPLE design variables simultaneously (`Width B`, `Depth D`, `Steel Area As`) subject to engineering constraints (`Deflection <= L/250`, `Stress <= Allowable`) to **Minimize Total Cost**!',
        guidelines: [
          'Implicit Equation Solving with `Goal Seek`: For Manning’s open-channel flow or P-M interaction neutral axis depth where $y$ cannot be isolated algebraically, create a cell `Residual = Calculated_Q - Design_Q`, launch `Data -> What-If Analysis -> Goal Seek`, set `Set cell: Residual`, `To value: 0`, `By changing cell: Flow_Depth_y`, and click OK!',
          'Sensitivity Analysis with `Data Tables`: Build a 2-variable Data Table to view how Project IRR or Foundation Bearing Pressure varies across 5 Soil Bearing Capacities and 5 Column Loads simultaneously.',
          'Structural Cost Optimization with `Solver` (enable under `File -> Options -> Add-ins -> Solver Add-in`): Set Objective = `Total Footing Concrete + Rebar Cost` -> Choose `Min` -> By Changing Variable Cells = `Footing_L, Footing_B, Thickness_D` -> Add Constraints: `Bearing_Pressure <= Qa`, `Punching_Shear_Ratio <= 1.0`, `Footing_B >= 1.2` -> Click `Solve`!'
        ],
        proTip: 'When optimizing discrete rebar counts or stock bar cutting patterns in `Solver`, add an `int` (Integer) constraint on the number of bars so Solver only outputs whole bar numbers!'
      }
    ]
  },

  {
    id: 'excel-ch7',
    pillar: 'excel',
    chapterNumber: 7,
    title: 'Pivot Tables & Visualization',
    subtitle: 'Pivot Tables, Slicers, Timelines, Calculated Fields, S-Curve & GSD Scatter Charts, Waterfall Cashflow & KPI Dashboards',
    topics: [
      {
        id: 'excel-7-1',
        title: 'Executive BOQ & Cost Summaries: Pivot Tables, Slicers, Timelines & Calculated Fields',
        commandsOrFormulas: [
          'Insert -> PivotTable (from Excel Table)',
          'PivotTable Analyze -> Insert Slicer / Insert Timeline',
          'PivotTable Analyze -> Fields, Items & Sets -> Calculated Field'
        ],
        summary: 'Turn a 5,000-row site cost ledger or Bar Bending Schedule into an interactive, multi-dimensional executive summary in 30 seconds.',
        mechanics:
          'A Pivot Table groups, cross-tabulates, and aggregates a normalized data table without writing a single formula. **Slicers** and **Timelines** provide visual filter buttons that can control multiple Pivot Tables and Charts across a dashboard simultaneously.',
        guidelines: [
          'Always format your source data as an official Excel Table (`CTRL + T`, e.g., `tbl_SiteCosts`) BEFORE inserting a Pivot Table—that way the Pivot Table automatically expands as new rows are added at the bottom.',
          'BBS Summary Pivot: Drag `Floor` to Rows, `Bar_Diameter` to Columns, and `Weight_MT` to Values -> Instant project steel procurement matrix!',
          'Add Interactive Slicers: Click inside the Pivot Table -> `PivotTable Analyze -> Insert Slicer` -> Check `Building_Zone`, `Contractor`, and `Work_Package`.',
          'Right-click any Slicer -> `Report Connections` and check all Pivot Tables on your dashboard so clicking `"Tower B"` filters Cost, Steel Tonnage, and Concrete Volume charts together!'
        ],
        proTip: 'In `PivotTable Options -> Layout & Format`, always uncheck `"Autofit column widths on update"` so refreshing your Pivot Table never scrambles your carefully formatted dashboard column widths!'
      },
      {
        id: 'excel-7-2',
        title: 'Engineering Charts: S-Curves (Combo), Grain Size Distribution (Log Scatter) & Cashflow Waterfalls',
        commandsOrFormulas: [
          'Insert -> Combo Chart (Clustered Column + Line on Secondary Axis)',
          'Insert -> XY (Scatter) with Smooth Lines -> Format X-Axis -> Logarithmic Scale (Base 10)',
          'Insert -> Waterfall Chart'
        ],
        summary: 'Build authentic engineering visualizations: Planned vs. Actual S-Curves, Semilog Geotechnical Sieve Curves, and Variation Waterfall charts.',
        mechanics:
          'Standard Excel `Line Charts` space X-axis categories evenly as text labels (`1, 2, 3...`), distorting unequal chainages, depths, or sieve diameters! True engineering curves ($P$-$M$ interaction diagrams, Proctor compaction curves, Borehole depth logs, and Sieve Analysis) MUST use **XY Scatter Charts**.',
        guidelines: [
          'Project Progress S-Curve (`Combo Chart`): Plot Monthly Planned & Actual Spend as `Clustered Columns` on the Primary Y-Axis, and plot Cumulative Planned % vs. Cumulative Earned % as `Smooth Lines` on the Secondary Y-Axis (`0% to 100%`).',
          'Geotechnical Sieve Analysis Curve (`Semilog XY Scatter`): Insert an `XY Scatter with Smooth Lines` chart (`X = Sieve Opening mm`, `Y = % Finer`). Right-click the horizontal X-Axis -> `Format Axis` -> Check `Logarithmic scale (Base: 10)` and optionally check `Values in reverse order`!',
          'Contract Variation & Cashflow Bridge (`Waterfall Chart`): Use `Insert -> Waterfall` to visually walk from `Original Contract Sum` + `Approved VOs` - `Omissions` - `Retention` = `Forecast Final Account`. Right-click the first and last bars and check `Set as Total`.'
        ],
        proTip: 'When plotting a Borehole SPT $N$-value vs. Depth profile, use an `XY Scatter` chart, put `Depth (m)` on the vertical Y-Axis, and check `Values in reverse order` + `Horizontal axis crosses at: Minimum axis value` so Depth `0.0 m` sits at the top of the chart and increases downward!'
      }
    ]
  },

  {
    id: 'excel-ch8',
    pillar: 'excel',
    chapterNumber: 8,
    title: 'Automation & Page Setup',
    subtitle: 'Power Query Multi-Sheet Consolidation, VBA Macros/UDFs, Formula Locking/Protection & Professional A4/A3 BOQ Page Setup',
    topics: [
      {
        id: 'excel-8-1',
        title: 'Power Query Data Pipelines & VBA User-Defined Functions (UDFs)',
        commandsOrFormulas: [
          'Data -> Get Data -> From File / From Folder / Blank Query',
          'CTRL + ALT + F5 (Refresh All)',
          'ALT + F11 (VBA Editor) -> Insert -> Module'
        ],
        summary: 'Automate monthly consolidation of 20+ site measurement sheets with Power Query and extend Excel with custom VBA engineering functions.',
        mechanics:
          'Power Query records a repeatable ETL (Extract, Transform, Load) recipe in the M language (`Excel.CurrentWorkbook()` or `Folder.Files()`). Unlike copy-pasting or fragile cross-sheet links, clicking `Refresh All` (`CTRL+ALT+F5`) re-runs the entire consolidation in seconds.',
        guidelines: [
          'Consolidating Monthly Site Reports from a Folder: Put all weekly/monthly `.xlsx` site concrete logs into one folder -> `Data -> Get Data -> From File -> From Folder` -> Click `Combine & Transform Data` -> Filter out blank rows -> `Close & Load To...` a Master Pivot Table!',
          'Unpivoting Wide Matrix Schedules (`Transform -> Unpivot Other Columns`): If a schedule has Floors down rows and 12 Months across columns, select the Floor column in Power Query and click `Unpivot Other Columns` to convert it into a database-ready 3-column table (`Floor | Month | Amount`).',
          'Save workbooks containing VBA Macros (`SpellBDT`, `FtInToMeters`) as `.xlsm` (Excel Macro-Enabled Workbook) so macros are not stripped on save.'
        ],
        proTip: 'Before sending a macro-enabled `.xlsm` tender file to an external client whose IT firewall blocks macros, use `Copy -> Paste Values` on your `=SpellBDT()` cells and save a clean `.xlsx` distribution copy.'
      },
      {
        id: 'excel-8-2',
        title: 'Template Security & Professional Engineering Page Setup (A4/A3 Printing)',
        commandsOrFormulas: [
          'CTRL + 1 -> Protection -> Locked / Hidden',
          'Review -> Protect Sheet',
          'Page Layout -> Print Titles -> Rows to repeat at top',
          'View -> Page Break Preview'
        ],
        summary: 'Lock structural design formulas while leaving yellow input cells editable, and configure multi-page BOQs with repeating headers and zero orphan columns.',
        mechanics:
          'By default, EVERY cell in Excel has `Locked = Checked`, which takes effect only when `Review -> Protect Sheet` is enabled. Unlocking only your yellow user-input cells first protects 100% of your structural equations from accidental overwriting.',
        guidelines: [
          'Locking Design Formulas while Allowing User Inputs: 1. Select all yellow input cells (`hold CTRL` to multi-select) -> Press `CTRL+1` -> `Protection` tab -> Uncheck `Locked` -> OK. 2. Go to `Review -> Protect Sheet` -> Check `"Select unlocked cells"` (and optionally uncheck `"Select locked cells"`) -> Enter password.',
          'Fit All BOQ Columns Onto 1 Page Wide: Go to `Page Layout -> Scale to Fit` -> Set `Width: 1 page` and leave `Height: Automatic`! (Never set Height to `1 page` on a 300-row BOQ or Excel will shrink the font to microscopic 2pt size!).',
          'Repeat Table Headers on Every Printed Page: Go to `Page Layout -> Print Titles` -> In `Rows to repeat at top`, select your table header rows (e.g., `$1:$5`). Now Page 2 through Page 40 automatically print the BOQ column headers at the top!',
          'Add Official Engineering Footer: In `Page Setup -> Header/Footer -> Custom Footer`, set Left = `&[File] - &[Tab]`, Center = `Checked By: _________`, and Right = `Page &[Page] of &[Pages]`.'
        ],
        proTip: 'Always switch to `View -> Page Break Preview` before exporting a BOQ or calculation report to PDF (`CTRL+P`)—drag any dashed blue horizontal page break lines slightly up so a section heading is never stranded alone at the bottom of a page!'
      }
    ]
  },

  // =========================================================================
  // PILLAR 3: MICROSOFT PROJECT (MS PROJECT) (8 CHAPTERS)
  // =========================================================================
  {
    id: 'msp-ch1',
    pillar: 'msproject',
    chapterNumber: 1,
    title: 'Project Setup & Calendars',
    subtitle: 'Project Information, Base Calendars (Standard/24-Hour/Night Shift), Custom Work Weeks & Holidays, Auto vs. Manual Scheduling',
    topics: [
      {
        id: 'msp-1-1',
        title: 'Project Information & Auto-Scheduled vs. Manually Scheduled Modes',
        commandsOrFormulas: [
          'Project -> Project Information (Start Date, Current Date, Status Date, Calendar)',
          'File -> Options -> Schedule -> New tasks created: Auto Scheduled'
        ],
        summary: 'Anchor the master project start date and enforce CPM Auto-Scheduling before entering a single WBS task.',
        mechanics:
          '**Manually Scheduled** tasks act like static Excel rows—they ignore predecessor shifts, calendar holidays, and critical path logic unless forced. **Auto-Scheduled** tasks dynamically recalculate Start, Finish, and Float (`Slack`) instantaneously via the Critical Path Method (CPM) engine.',
        guidelines: [
          'Step 1 on Every New Project: Go to `File -> Options -> Schedule` -> Set `"Scheduling options for this project: New tasks created"` to `Auto Scheduled`.',
          'Step 2: Go to `Project -> Project Information` -> Set `Schedule from: Project Start Date`, enter the official Contract Commencement / Notice to Proceed (`NTP`) date, and select your Project Base Calendar.',
          'Also inside `File -> Options -> Schedule`, ensure `Hours per day` (`8.0` or `9.0`), `Hours per week` (`48.0` for 6-day site week), and `Days per month` (`26`) match your custom Working Calendar hours exactly—otherwise typing `"10 days"` calculates wrong total hours!'
        ],
        proTip: 'Why must `Hours per day` in Options match your Calendar? MS Project stores all task durations internally in **Minutes** (`1 day = 480 mins` at 8 hrs/day). If your calendar has 9-hour days (`8:00–18:00` with 1h lunch) but Options still says `8 hrs/day`, a `"1 day"` task spills 1 hour into the next morning!'
      },
      {
        id: 'msp-1-2',
        title: 'Base Calendars, Custom Construction Work Weeks & Holiday Exceptions',
        commandsOrFormulas: [
          'Project -> Change Working Time',
          'Create New Calendar (Copy of Standard)',
          'Exceptions Tab (Holidays / Monsoon Shutdowns)',
          'Work Weeks Tab -> [Default] -> Details'
        ],
        summary: 'Configure 6-day construction site calendars, 24-hour TBM/slipform calendars, and statutory holiday/monsoon exceptions.',
        mechanics:
          'MS Project provides three built-in Base Calendars (`Standard` 8am–5pm Mon–Fri, `24 Hours`, and `Night Shift`). For construction sites, you create a custom calendar (e.g., `6-Day Construction Site`) where `Work Weeks` defines the regular weekly pattern and `Exceptions` overrides specific holiday dates.',
        guidelines: [
          'Go to `Project -> Change Working Time` -> Click `Create New Calendar...` -> Name it `6-Day Site Calendar (48h)`.',
          'To configure a 6-Day Week (e.g., Saturday–Thursday working, Friday off): Click the `Work Weeks` tab at the bottom -> Select `[Default]` -> Click `Details...` -> Select Saturday through Thursday -> Choose `"Set day(s) to these specific working times"` (`8:00 AM–12:00 PM`, `1:00 PM–5:00 PM`) -> Select Friday and choose `"Set days to nonworking time"` -> Click OK.',
          'To add Public Holidays (Eid, Puja, National Holidays, Monsoon Shutdown): Switch to the `Exceptions` tab -> Type the Holiday Name, Start Date, and Finish Date.',
          'Assign your new calendar in TWO places: 1. `Project -> Project Information -> Calendar`, AND 2. Right-click the Gantt chart timescale header -> `Nonworking Time` -> Select your custom calendar so non-working shaded bars match on screen!'
        ],
        proTip: 'Create a dedicated `7-Day Concrete Curing Calendar` (7 days/week working, no holidays) and assign it via the `Task Calendar` column to concrete curing tasks—or simply use Elapsed Days (`edays`)!'
      }
    ]
  },

  {
    id: 'msp-ch2',
    pillar: 'msproject',
    chapterNumber: 2,
    title: 'Work Breakdown Structure (WBS) & Tasks',
    subtitle: 'Task Hierarchy, WBS Codes, Duration & Elapsed Days (edays), Recurring Tasks, Splits, Inactivation, Deadlines & Constraints',
    topics: [
      {
        id: 'msp-2-1',
        title: 'Task Hierarchy: Project Summary Task (Task 0), Summary Tasks, Subtasks & Milestones',
        commandsOrFormulas: [
          'Gantt Chart Format -> Check: Project Summary Task (Task 0) & Outline Number',
          'Task -> Indent Task (ALT + SHIFT + Right) / Outdent (ALT + SHIFT + Left)',
          'Duration = 0 days (Milestone)'
        ],
        summary: 'Organize construction schedules using top-down WBS deliverables, rolled-up Summary Bars, and 0-day Contract Milestones.',
        mechanics:
          '`Summary Tasks` automatically calculate their own Duration, Start, Finish, Work, Cost, and `% Complete` by rolling up their indented child `Subtasks`. You should NEVER type durations, resources, or dependencies directly onto Summary Tasks.',
        guidelines: [
          'Turn on the Master Project Summary Bar (`Task 0`) immediately: Go to `Gantt Chart Format` ribbon -> Check `Project Summary Task` and `Outline Number` on the far right.',
          'Structure your WBS levels logically: `Level 1 = Project`, `Level 2 = Key Milestones & Preliminaries / Substructure / Superstructure / MEP / Finishes`, `Level 3 = Floor or Zone`, `Level 4 = Deliverable Work Packages`.',
          'Define Custom WBS Codes: Go to `Project -> WBS -> Define Code` (e.g., Project Prefix `BLDG-A.` followed by `Numbers (ordered)` -> `Uppercase Letters` -> `Numbers`) and insert the `WBS` column.',
          'Enter `0 days` in the Duration column of any task (`e.g., "Substructure Complete"`, `"Tower Crane Erected"`, `"Substantial Completion"`) to turn it into a black diamond **Milestone** (`♦`).'
        ],
        proTip: 'The Golden Rule of CPM Scheduling: **Never link Predecessors/Successors to Summary Tasks** and **never assign Resources to Summary Tasks**—link and resource ONLY the lowest-level work packages (`Subtasks` and `Milestones`) to prevent circular dependencies and distorted float!'
      },
      {
        id: 'msp-2-2',
        title: 'Duration Estimation, Elapsed Duration (edays), Recurring Tasks, Task Splits & Inactivation',
        commandsOrFormulas: [
          '7 edays (Elapsed 24/7 Calendar Days)',
          'Task -> Insert -> Recurring Task',
          'Task -> Schedule -> Split Task',
          'Task -> Schedule -> Inactivate (Project Pro)'
        ],
        summary: 'Model continuous 24/7 concrete curing (`edays`), weekly site coordination meetings, interrupted tasks, and scope deletions.',
        mechanics:
          'Standard duration (`days` or `d`) counts only working days from the calendar (skipping weekends and holidays). **Elapsed Duration (`edays` or `ed`)** counts continuous 24-hour calendar days straight through weekends and holidays!',
        guidelines: [
          'Concrete Curing & Stripping Formwork: Enter `7 edays` (or `14 edays` / `28 edays`) for concrete curing tasks or as lag time (`25FS+7edays`)—because concrete cures 24/7 during weekends and holidays!',
          'Recurring Tasks: Go to `Task -> Task (dropdown) -> Recurring Task` to insert `"Weekly Client Progress Meeting"` (`Every 1 week on Monday, Duration = 2 hrs`) across the entire project duration in one dialog.',
          'Interrupted Work (`Split Task`): If excavation pauses for 4 days due to dewatering or utility relocation after starting, click `Split Task` on the Task ribbon and drag the second half of the Gantt bar to the resumption date (`........`).',
          'Deleting Scope Safely (`Inactivate`): Instead of deleting a cancelled work package (which renumbers every row ID below it), click `Inactivate` to strike through the task and remove its cost/schedule impact while preserving history.'
        ],
        proTip: 'Any task duration showing a question mark (`5 days?`) is marked as an **Estimated Duration**—uncheck `"Estimated"` in Task Information once the subcontractor or rate-productivity calculation confirms the duration.'
      },
      {
        id: 'msp-2-3',
        title: 'Deadlines vs. Task Constraints (ASAP, ALAP, SNET, SNLT, FNET, FNLT, MSO, MFO)',
        commandsOrFormulas: [
          'Task Information -> Advanced -> Deadline',
          'Constraint Types: ASAP (Default), SNET, FNLT, MSO (Hard), MFO (Hard)'
        ],
        summary: 'Track contractual target dates using non-restrictive Deadlines (`⇩`) instead of hard constraints (`MSO`/`MFO`) that break the Critical Path.',
        mechanics:
          'Typing a date directly into the `Start` or `Finish` column silently slaps a **Start No Earlier Than (`SNET`)** or **Finish No Earlier Than (`FNET`)** constraint onto the task! Hard constraints (`Must Start On` / `Must Finish On`) lock a task to a calendar date and prevent predecessor delays from pushing the schedule—destroying dynamic CPM forecasting.',
        guidelines: [
          'Keep 95%+ of tasks set to `As Soon As Possible (ASAP)` driven purely by Predecessor network logic.',
          'How to Track Contractual Target Dates Safely (`Deadline` vs `MFO`): Double-click your Milestone -> `Advanced` tab -> Enter the contractual target date inside the `Deadline:` box (do NOT change Constraint Type from `ASAP`!).',
          'Setting a `Deadline` places a green hollow down-arrow (`⇩`) on the Gantt chart, calculates exact negative `Total Slack` if the milestone slips past the deadline, and displays a red warning indicator in the Indicator column—without locking the schedule!',
          'Legitimate Use of `SNET` (Start No Earlier Than): Use `SNET` only for external procurement deliveries (`"Chiller Delivery from Port: SNET 15-May"`) or permit handovers.'
        ],
        proTip: 'Before submitting any baseline programme to a Client Engineer/Consultant (`FIDIC` / `NEC`), insert the `Constraint Type` column and verify almost every task reads `As Soon As Possible`—consultants routinely reject schedules containing hard `Must Start/Finish On` constraints!'
      }
    ]
  },

  {
    id: 'msp-ch3',
    pillar: 'msproject',
    chapterNumber: 3,
    title: 'Task Dependencies & Scheduling Logic',
    subtitle: 'Finish-to-Start (FS), Start-to-Start (SS), Finish-to-Finish (FF), Start-to-Finish (SF), Lead Time (-Lag) & Lag Time (+Lag)',
    topics: [
      {
        id: 'msp-3-1',
        title: 'The 4 Logical Relationship Types: FS, SS, FF, and SF',
        commandsOrFormulas: [
          '12FS (Finish-to-Start — Default)',
          '12SS (Start-to-Start)',
          '12FF (Finish-to-Finish)',
          '12SF (Start-to-Finish)'
        ],
        summary: 'Model sequential, overlapping, and concurrent construction activities with closed-network CPM logic.',
        mechanics:
          'Every non-summary task between `Project Start` and `Project Finish` must have at least one Predecessor and one Successor (`Closed Network Rule`). Leaving a task without a successor creates an "open end" (dangling task) whose delay will fail to push the final completion date.',
        guidelines: [
          '`Finish-to-Start (FS)` (80% of links): Task B cannot start until Task A finishes—e.g., `Column Formwork (10) -> Column Concrete Pour (10FS)`.',
          '`Start-to-Start (SS)`: Task B can start as soon as (or shortly after) Task A starts—e.g., `Excavate Trench (20) -> Lay Bedding & Pipe (20SS+2 days)`.',
          '`Finish-to-Finish (FF)`: Task B cannot finish until Task A finishes—e.g., `Install MEP Piping (30) -> Pressure Testing & Inspection (30FF+1 day)`.',
          'Best Practice for Overlapping Construction Trades (`SS + FF` Ladder): When linking `Plastering` to `Painting` across a large floor with `SS+3d`, also add an `FF+2d` link (`15SS+3d, 15FF+2d`) so if the final 10% of plastering is delayed, painting cannot unrealistically finish before plastering finishes!'
        ],
        proTip: 'Insert the `Predecessors` AND `Successors` columns side-by-side and filter for `Blanks`—the ONLY task with blank Predecessors should be your `Project Start Milestone`, and the ONLY task with blank Successors should be your `Project Completion Milestone`!'
      },
      {
        id: 'msp-3-2',
        title: 'Lead Time (Negative Lag) & Lag Time (Positive Lag)',
        commandsOrFormulas: [
          '14FS+7edays (Positive Lag — Waiting/Curing Time)',
          '18FS-3d (Negative Lag / Lead — Fast-Tracking Overlap)',
          '22SS+25% (Percentage Lag)'
        ],
        summary: 'Apply positive curing/waiting lags and negative fast-tracking leads or percentage overlaps accurately.',
        mechanics:
          '**Lag (`+`)** inserts a mandatory waiting delay between linked tasks without consuming labor resources. **Lead (`-`)** pulls the successor earlier to overlap with the tail end of its predecessor.',
        guidelines: [
          'Positive Lag (`+`): Use `12FS+7edays` after `"Slab Concrete Pour"` before `"Strike Slab Soffit Props"` so formwork stripping waits 7 continuous calendar days without needing a resource-loaded task.',
          'Percentage Lag (`%`): Use `15SS+50%` so `"Brickwork"` starts automatically as soon as `"RC Frame on 1st Floor"` reaches 50% of its duration!',
          'Negative Lag / Lead (`-`): Use `20FS-4d` to start `"Rebar Fabrication"` 4 days before `"Footing Excavation"` finishes (or convert long `FS-lead` links into explicit `SS+lag` + `FF+lag` relationships for cleaner progress tracking).'
        ],
        proTip: 'Avoid using huge positive lags (`e.g., 10FS+45d`) to represent material procurement—replace any lag longer than 10 days with an explicit WBS task (`"Shop Drawing Approval & Material Delivery — 45 days"`) so its progress can be tracked!'
      }
    ]
  },

  {
    id: 'msp-ch4',
    pillar: 'msproject',
    chapterNumber: 4,
    title: 'Critical Path Method (CPM)',
    subtitle: 'Critical Path Identification, Total Slack (Total Float) vs. Free Slack (Free Float), Schedule Compression (Crashing & Fast-Tracking)',
    topics: [
      {
        id: 'msp-4-1',
        title: 'Critical Path Identification, Forward/Backward Pass & Total Slack vs. Free Slack',
        commandsOrFormulas: [
          'Gantt Chart Format -> Check: Critical Tasks (Red Bars) & Slack',
          'Total Slack (TS) = Late Start - Early Start = Late Finish - Early Finish',
          'Free Slack (FS) = Early Start(Successor) - Early Finish(Current)'
        ],
        summary: 'Display the red Critical Path chain and distinguish between Project Total Float and Immediate Successor Free Float.',
        mechanics:
          'During the **Forward Pass**, MS Project computes `Early Start (ES)` and `Early Finish (EF)` from the start date. During the **Backward Pass**, it computes `Late Finish (LF)` and `Late Start (LS)` backward from the project finish date. Any task with `Total Slack <= 0 days` sits on the **Critical Path**—a 1-day delay on a critical task delays the entire project completion by 1 day!',
        guidelines: [
          'Highlight the Critical Path in Red: Go to `Gantt Chart Format` ribbon -> Check `Critical Tasks` (turns critical Gantt bars bright red) and check `Slack` (draws thin lines behind non-critical bars showing available float).',
          'Insert Float Columns in Your Table: Right-click any column header -> `Insert Column` -> Add `Total Slack`, `Free Slack`, `Early Start`, `Early Finish`, `Late Start`, and `Late Finish`.',
          '`Total Slack (Total Float)`: How long a task can be delayed without delaying the **overall Project Finish Date**.',
          '`Free Slack (Free Float)`: How long a task can be delayed without delaying the **Early Start of its immediate successor task** (`Free Slack` is always $\\le$ `Total Slack`).',
          'Filter Only Critical Tasks for Executive Review: Go to `View -> Data -> Filter: Critical` to isolate the longest driving chain of the project.'
        ],
        proTip: 'In `File -> Options -> Advanced -> Calculation options for this project`, you can check `"Calculate multiple critical paths"` so independent sub-networks or phased handover buildings each display their own driving critical path!'
      },
      {
        id: 'msp-4-2',
        title: 'Schedule Compression Techniques: Crashing vs. Fast-Tracking',
        commandsOrFormulas: [
          'Crashing = Add Resources / Overtime to Critical Tasks (Increases Cost)',
          'Fast-Tracking = Overlap Critical Sequential Tasks via SS+Lag / Zone Splitting (Increases Rework Risk)'
        ],
        summary: 'Recover slipped completion dates or shorten contract durations systematically by targeting only the Critical Path.',
        mechanics:
          'Shortening a non-critical task that has `15 days` of Total Slack reduces project duration by **zero days**! Schedule compression MUST focus strictly on Critical Path tasks (`Total Slack <= 0`), watching carefully as near-critical parallel paths become the new Critical Path.',
        guidelines: [
          'Technique 1 — `Fast-Tracking` (No extra direct cost, higher coordination risk): Break a monolithic floor task (`"1st Floor Slab — 20 days"`) into Pour Zones (`Zone A: 10d` and `Zone B: 10d`) and link `Formwork -> Rebar -> Concrete` with `SS+4d` and `FF+3d` overlaps.',
          'Technique 2 — `Crashing` (Higher direct cost, preserves sequential logic): Double crew allocation (`200%` or `2 Crews`), switch key critical path tasks to a `Double-Shift / 16-Hour Calendar`, or use high-early-strength concrete admixtures to cut curing lag from `14 edays` to `5 edays`.',
          'After compressing the primary critical path by 5 days, refresh the `Critical` filter—any parallel path that previously had `3 days` of Total Slack is now on the Critical Path!'
        ],
        proTip: 'Crash the **least expensive** critical tasks (`lowest Crash Cost per Day Saved = (Crash_Cost - Normal_Cost) / (Normal_Duration - Crash_Duration)`) and early substructure tasks first to gain maximum buffer early in the project.'
      }
    ]
  },

  {
    id: 'msp-ch5',
    pillar: 'msproject',
    chapterNumber: 5,
    title: 'Resource & Cost Management',
    subtitle: 'Resource Sheet (Work/Material/Cost), Rates, Task Types (Fixed Units/Work/Duration), Effort-Driven, Leveling & Cost Accrual',
    topics: [
      {
        id: 'msp-5-1',
        title: 'Resource Sheet Setup: Work, Material & Cost Resources + Rate Tables',
        commandsOrFormulas: [
          'View -> Resource Sheet',
          'Type = Work (Man-hours/Equipment-hours) | Material (m³, MT, Bags) | Cost (Lump-sum Subcontracts)'
        ],
        summary: 'Distinguish correctly between Labor/Plant (`Work`), Consumable Materials (`Material`), and Lump-Sum Subcontracts/Permits (`Cost`).',
        mechanics:
          '1. **Work Resources** (Masons, Carpenters, Excavators, Tower Cranes) have `Max Units` (`100% = 1 person`, `1000% = 10 masons`) and an hourly/daily `Std. Rate`. 2. **Material Resources** (Ready-Mix Concrete $\text{m}^3$, Rebar $\text{MT}$, Bricks $\text{Nos}$) have a `Material Label` and unit price (`$110/m³`) with NO Max Units. 3. **Cost Resources** (Subcontract Package, Insurance, Testing Fee) let you enter a specific dollar/taka lump-sum amount per task assignment.',
        guidelines: [
          'Switch to `View -> Resource Sheet` before assigning any resources to tasks.',
          'Enter Labor & Plant as `Type = Work`: e.g., `Resource Name = Bar Bender`, `Type = Work`, `Max. Units = 1200%` (meaning 12 bar benders available on site), `Std. Rate = 100/hr` (or `800/day`).',
          'Enter Bulk Materials as `Type = Material`: e.g., `Resource Name = Concrete M30`, `Type = Material`, `Material Label = m³`, `Std. Rate = 9500` (price per $1\\text{ m}^3$). When assigning to a footing task, type `45 m³` in the Units box!',
          'Enter Subcontracts & Variable Lump Sums as `Type = Cost`: e.g., `Resource Name = Piling Subcontractor`, `Type = Cost`. When assigning to `"Bored Piles Zone A"`, enter the exact subcontract value (`1,250,000`) in the Task Form / Resource Assignment cost field.'
        ],
        proTip: 'Double-click any Material or Work resource -> `Costs` tab (`Cost Rate Tables A–E`) to enter **Date-Effective Price Escalation** (e.g., Steel price increases by `+8%` effective `01-Jan-2027`)—MS Project automatically prices tasks after that date at the escalated rate!'
      },
      {
        id: 'msp-5-2',
        title: 'The Scheduling Formula: Task Types (Fixed Units, Fixed Work, Fixed Duration) & Effort-Driven',
        commandsOrFormulas: [
          'Work = Duration × Units',
          'Fixed Units (Default): Changing Units recalculates Duration',
          'Fixed Duration: Changing Units recalculates Work (Duration stays locked!)',
          'Fixed Work: Changing Units recalculates Duration (Work stays locked)'
        ],
        summary: 'Prevent MS Project from unexpectedly shrinking or lengthening your task durations when you add or adjust crew sizes.',
        mechanics:
          'MS Project enforces the fundamental identity $\\text{Work (man-hours)} = \\text{Duration} \\times \\text{Assignment Units}$. Whichever variable you lock as the **Task Type** (`Fixed Duration`, `Fixed Units`, or `Fixed Work`) will NEVER change when you edit one of the other two variables!',
        guidelines: [
          'Why did my 10-day task suddenly change to 5 days when I added a second resource?! Because the default Task Type is `Fixed Units` with `Effort-Driven` ON (doubling workers halves duration).',
          'For Construction Schedules where you want Duration to stay strictly fixed while you load multiple trades (`Mason`, `Helper`, `Concrete`, `Rebar`): Select all tasks -> Open `Task Information -> Advanced` -> Set `Task type: Fixed Duration` and uncheck `Effort driven`!',
          'When to use `Fixed Work`: Use `Fixed Work` when a task has a known man-hour budget from your Rate Analysis (e.g., `400 man-hours` of formwork) and you want MS Project to calculate the exact `Duration` as you test assigning `5` vs `10` carpenters (`500%` vs `1000%`).'
        ],
        proTip: 'You can change the global default Task Type for all new tasks under `File -> Options -> Schedule -> Default task type: Fixed Duration`!'
      },
      {
        id: 'msp-5-3',
        title: 'Resource Overallocation Detection, Leveling, Fixed Costs & Cost Accrual',
        commandsOrFormulas: [
          'View -> Resource Graph / Resource Usage (Red Overallocated Resources)',
          'Resource -> Leveling Options -> Level only within available slack',
          'Accrue At: Start | Prorated (Default) | End'
        ],
        summary: 'Resolve red overallocated crews/cranes using Resource Leveling and control cashflow timing with Cost Accrual.',
        mechanics:
          'Whenever concurrent tasks demand `16 Masons (1600%)` on the same Tuesday when your `Resource Sheet Max Units` is `1200%`, MS Project flags the resource in **Red** (Overallocated). **Resource Leveling** delays lower-priority or higher-float tasks until resources free up.',
        guidelines: [
          'Inspect Overallocations: Open a split screen (`View -> Split View -> Check Details` and set bottom pane to `Resource Graph` or `Task Usage`) to see the exact days where demand exceeds capacity.',
          'Safe Resource Leveling: Go to `Resource -> Leveling Options` -> Set `Leveling calculations: Manual`, check `"Level only within available slack"` (so leveling NEVER pushes the final project completion date!), and click `Level All`.',
          'If leveling changes your schedule unexpectedly, click `Clear Leveling` immediately to restore original dates.',
          'Cashflow Accrual (`Accrue At`): Set `Accrue At = Start` for upfront mobilization/advance payments, `Prorated` for daily labor/concrete, and `End` for subcontractor milestone payments paid only upon 100% task completion.'
        ],
        proTip: 'Insert the `Fixed Cost` column in the `Cost` table (`View -> Tables -> Cost`) to enter quick task-level costs without even creating resources if you only need a rapid S-Curve cashflow!'
      }
    ]
  },

  {
    id: 'msp-ch6',
    pillar: 'msproject',
    chapterNumber: 6,
    title: 'Baselines & Progress Tracking',
    subtitle: 'Saving Baselines (0–10), Status Date Configuration, % Complete vs. Physical % Complete, Actuals & Rescheduling Uncompleted Work',
    topics: [
      {
        id: 'msp-6-1',
        title: 'Setting, Saving & Managing Baselines (Baseline 0–10) & Interim Plans',
        commandsOrFormulas: [
          'Project -> Schedule -> Set Baseline -> Set Baseline... (Baseline, Baseline 1–10)',
          'View -> Tables -> Variance (Baseline Start/Finish vs. Start/Finish Variance)',
          'View -> Tracking Gantt'
        ],
        summary: 'Lock the approved contract schedule snapshot (`Baseline 0`) before tracking a single day of actual site progress.',
        mechanics:
          'When you click `Set Baseline`, MS Project copies every task’s current `Start`, `Finish`, `Duration`, `Work`, and `Cost` into static read-only fields (`Baseline Start`, `Baseline Finish`, `Baseline Duration`, `Baseline Work`, `Baseline Cost`). All Schedule Variance (`SV`), Finish Variance, and Earned Value (`BCWS/PV`, `BCWP/EV`) calculations compare live tasks against `Baseline 0`!',
        guidelines: [
          'Once your WBS, CPM logic, and Cost loading are approved by the Client/PM, go to `Project -> Set Baseline -> Set Baseline...` -> Select `Baseline` (Baseline 0) -> Choose `Entire project` -> Click OK.',
          'Switch to `View -> Tracking Gantt`: Each task now displays TWO bars—a lower **Grey Baseline Bar** (locked original plan) and an upper **Blue/Red Live Bar** (current forecast).',
          'If a major Variation Order (`VO`) or Extension of Time (`EOT`) is approved mid-project: First save a copy of your current `Baseline` into `Baseline 1` (to preserve original contract history), and then update `Baseline` (`Baseline 0`) for the revised contract programme!'
        ],
        proTip: 'If you add 3 new variation tasks later and want to baseline ONLY those 3 tasks without overwriting the rest of your original Baseline, select those 3 rows -> `Set Baseline` -> Choose `Selected tasks` and check `"Roll up baselines: To all summary tasks"`!'
      },
      {
        id: 'msp-6-2',
        title: 'The Monthly Update Cycle: Status Date, % Complete vs. Physical % Complete & Actuals',
        commandsOrFormulas: [
          'Project -> Status Date -> Draw Vertical Red Status Date Gridline',
          '% Complete (Duration %) vs. % Work Complete vs. Physical % Complete',
          'Project -> Update Project -> Reschedule uncompleted work to start after: [Status Date]'
        ],
        summary: 'Execute a rigorous, audit-proof weekly/monthly schedule update using `Actual Start`, `Remaining Duration`, and `Update Project`.',
        mechanics:
          'MS Project tracks three distinct percentages: 1. `% Complete` $= \\frac{\\text{Actual Duration}}{\\text{Total Duration}}$, 2. `% Work Complete` $= \\frac{\\text{Actual Work}}{\\text{Total Work}}$, and 3. `Physical % Complete` (manually entered physical site measurement, e.g., `450 m³ / 1000 m³ = 45%`, which can drive Earned Value `BCWP` independently of elapsed days!).',
        guidelines: [
          'Step 1 — Set the Status Date: Go to `Project -> Status Date` and enter the Friday/Saturday site cutoff date. Right-click the Gantt chart background -> `Gridlines...` -> Select `Status Date` -> Set Line Type to solid bright Red so everyone sees the reporting cutoff line.',
          'Step 2 — Switch to the Tracking Table: Go to `View -> Tables -> Tracking` (displays `Act. Start`, `Act. Finish`, `% Comp.`, `Phys. % Comp.`, `Act. Dur.`, `Rem. Dur.`).',
          'Step 3 — Enter True Site Actuals (Do NOT just guess `% Complete`!):',
          '• For tasks that **Finished**: Enter the true `Actual Start` and `Actual Finish` dates (this automatically sets `% Complete = 100%`).',
          '• For tasks **In Progress**: Enter the true `Actual Start` date, enter the measured `% Complete` (or `Physical % Complete`), and update `Remaining Duration` based on how many days the site engineer realistically needs to finish!',
          'Step 4 — Push Delayed Unstarted/Remaining Work Past the Status Date: Go to `Project -> Update Project` -> Select `"Reschedule uncompleted work to start after: [Status Date]"` -> Click OK.'
        ],
        proTip: 'Nothing should sit in the "past" (to the left of the red Status Date line) as uncompleted work, and nothing should sit in the "future" (to the right of the Status Date line) as completed actuals—running `Update Project -> Reschedule uncompleted work` enforces this rule across the entire schedule!'
      }
    ]
  },

  {
    id: 'msp-ch7',
    pillar: 'msproject',
    chapterNumber: 7,
    title: 'Earned Value Management (EVM)',
    subtitle: 'PV (BCWS), EV (BCWP), AC (ACWP), SV & CV, SPI & CPI, BAC, EAC, ETC, VAC & TCPI',
    topics: [
      {
        id: 'msp-7-1',
        title: 'Core EVM Metrics in MS Project: PV (BCWS), EV (BCWP), AC (ACWP), SV, CV, SPI & CPI',
        commandsOrFormulas: [
          'PV (BCWS) = Baseline Cost planned up to Status Date',
          'EV (BCWP) = Baseline Cost (BAC) × % Complete',
          'AC (ACWP) = Actual Cost incurred up to Status Date',
          'SV = EV - PV  |  SPI = EV / PV',
          'CV = EV - AC  |  CPI = EV / AC'
        ],
        summary: 'Configure MS Project’s Earned Value table and interpret Schedule/Cost Variances and Performance Indices accurately.',
        mechanics:
          'Earned Value Management integrates **Scope, Schedule, and Cost** against `Baseline 0` as of the `Status Date`. Notice that MS Project uses classic US DoD column names in its Earned Value table: `BCWS` = `PV` (Planned Value), `BCWP` = `EV` (Earned Value), and `ACWP` = `AC` (Actual Cost).',
        guidelines: [
          'Prerequisites for EVM in MS Project: 1. Tasks must be cost-loaded (`Resources` or `Fixed Cost`), 2. `Baseline 0` must be saved (`Set Baseline`), and 3. `Project -> Status Date` must be set.',
          'View the EVM Table: Go to `View -> Tables -> More Tables... -> Earned Value` (plus `Earned Value Cost Indicators` and `Earned Value Schedule Indicators`).',
          'Use Physical % Complete for Accurate Construction EVM: Go to `File -> Options -> Advanced -> Earned Value options for this project` -> Set `"Default task Earned Value method"` to `Physical % Complete` so Earned Value reflects true cubic meters poured rather than merely elapsed days!',
          'Interpreting Indices: `SPI > 1.00` (`SV > 0`) means **Ahead of Schedule**; `SPI < 1.00` (`SV < 0`) means **Behind Schedule**. `CPI > 1.00` (`CV > 0`) means **Under Budget**; `CPI < 1.00` (`CV < 0`) means **Over Budget**.'
        ],
        proTip: 'Bydefault, MS Project automatically ties `Actual Cost (ACWP)` to `% Complete`. To enter true accounting invoice Actual Costs independently of `% Complete`, go to `File -> Options -> Schedule` and uncheck `"Actual costs are always calculated by Project"`!'
      },
      {
        id: 'msp-7-2',
        title: 'Forecasting Project Completion Cost: BAC, EAC, ETC, VAC & TCPI',
        commandsOrFormulas: [
          'BAC = Baseline Cost at Completion',
          'EAC (Standard CPI) = BAC / CPI',
          'ETC (Estimate to Complete) = EAC - AC',
          'VAC (Variance at Completion) = BAC - EAC',
          'TCPI = (BAC - EV) / (BAC - AC)'
        ],
        summary: 'Forecast final project outturn cost (`EAC`), remaining funding required (`ETC`), and expected budget overrun/savings (`VAC`).',
        mechanics:
          '`BAC` is the original approved baseline budget. `EAC` predicts what the total project will actually cost at completion based on historical cost efficiency (`CPI`). `TCPI` (To-Complete Performance Index) measures the efficiency required on all remaining work just to finish within `BAC`.',
        guidelines: [
          '`EAC = BAC / CPI`: Standard formula used by MS Project when current cost variances (`CPI`) are expected to continue at the same rate for the remainder of the project.',
          '`EAC = AC + (BAC - EV)`: Used when past cost overruns were a one-off anomaly (e.g., an unexpected rock obstruction in foundation piling) and remaining superstructure work will proceed at original budgeted rates.',
          '`EAC = AC + [(BAC - EV) / (CPI × SPI)]`: Composite pessimistic forecast used when the project is behind schedule AND over budget, recognizing that accelerating remaining work to meet the deadline will cost extra.',
          'If `TCPI > 1.10`, finishing within the original `BAC` budget is statistically improbable without formal value engineering or scope reduction.'
        ],
        proTip: 'Use the interactive **EVM & CPM Calculator** in Tab 8 of this Hub to compute and compare all three `EAC` forecasting models, `SPI`, `CPI`, `ETC`, `VAC`, and `TCPI` instantaneously!'
      }
    ]
  },

  {
    id: 'msp-ch8',
    pillar: 'msproject',
    chapterNumber: 8,
    title: 'Views, Custom Fields & Reporting',
    subtitle: 'Gantt/Tracking/Detail Gantt, Network Diagram (PERT), Usage Views, Timeline, Custom Fields/Indicators, Filters/Groups & PDF/Excel Export',
    topics: [
      {
        id: 'msp-8-1',
        title: 'Specialized Diagnostic Views: Tracking Gantt, Detail Gantt, Network Diagram, Usage Views & Timeline',
        commandsOrFormulas: [
          'View -> Tracking Gantt / Detail Gantt / Network Diagram',
          'View -> Task Usage / Resource Usage (Timephased Grid)',
          'View -> Timeline (Executive Summary Bar)'
        ],
        summary: 'Switch between schedule slippage views, timephased monthly cashflow/man-hour tables, and executive one-page Timelines.',
        mechanics:
          'Every View in MS Project simply displays the same underlying database through a different lens. **Usage Views** (`Task Usage` and `Resource Usage`) expose a **Timephased Right-Hand Grid** (Daily, Weekly, Monthly, or Quarterly columns) showing exact hours and costs per period.',
        guidelines: [
          '`Detail Gantt` (`View -> Other Views -> More Views -> Detail Gantt`): Draws thin slippage lines to the left of tasks showing exactly how many days each task has slipped from its Baseline Start.',
          '`Task Usage` View (How to Extract Monthly Cashflow & S-Curve Data!): Switch to `View -> Task Usage` -> Set the right-hand timescale to `Months` -> Right-click inside the yellow/white right-hand grid and check `Cost` and `Baseline Cost` (uncheck `Work`). Now Task `0` (`Project Summary Task`) shows your exact **Monthly Planned Cost vs. Monthly Forecast Cost** ready to copy straight into Excel!',
          '`Timeline` View: Right-click key summary phases and milestones -> Click `Add to Timeline` to build a clean, color-coded executive banner at the top of the screen that copies directly into PowerPoint or Word.'
        ],
        proTip: 'In `Task Usage` or `Resource Usage`, right-click the right-hand grid -> `Detail Styles...` and add `Cumulative Cost` and `BCWS`/`BCWP` to export a ready-made cumulative S-Curve table to Excel in 5 seconds!'
      },
      {
        id: 'msp-8-2',
        title: 'Custom Fields, Formulas & Graphical Traffic-Light Indicators',
        commandsOrFormulas: [
          'Project -> Custom Fields (Text1, Number1, Cost1, Flag1, Duration1)',
          'Formula: IIf([Finish Variance] > 4800, "Delayed >10d", IIf([Finish Variance] > 0, "Minor Slip", "On Track"))',
          'Graphical Indicators -> Red / Yellow / Green Traffic Lights'
        ],
        summary: 'Create automated traffic-light RAG (`Red / Amber / Green`) schedule health columns and custom engineering KPIs.',
        mechanics:
          '`Project -> Custom Fields` lets you write VBA-style expressions (`IIf`, `ProjDateDiff`, `[Finish Variance]`, `[Baseline Cost]`) and replace raw text/numbers with visual Red, Yellow, and Green status icons.',
        guidelines: [
          'How to Build a Traffic-Light Schedule Health Column (`Text1`):',
          '1. Go to `Project -> Custom Fields` -> Select Type = `Text`, pick `Text1`, click `Rename...` and name it `Schedule RAG`.',
          '2. Click `Formula...` and enter: `IIf([% Complete]=100, "Completed", IIf([Finish Variance]>2400, "Critical Delay", IIf([Finish Variance]>0, "Minor Slip", "On Track")))` (note: in MS Project formulas, `Finish Variance` is in minutes where `480 mins = 1 day`, so `2400 = 5 days`!).',
          '3. Click `Graphical Indicators...` -> Set `equals "Critical Delay" = Red Circle`, `equals "Minor Slip" = Yellow Diamond`, `equals "On Track" = Green Circle`, `equals "Completed" = Blue Checkmark`.',
          '4. Under `"Calculation for task and group summary rows"`, select `Use formula` so Summary Tasks also display traffic lights!'
        ],
        proTip: 'Create a Custom `Text2` field named `Responsible Contractor / Trade` (`Civil`, `Structural`, `MEP`, `Facade`) so you can Group and Filter the entire 1,000-line schedule by subcontractor in one click!'
      },
      {
        id: 'msp-8-3',
        title: 'Lookahead Filtering, Grouping, Visual Reports & Calibrated PDF/Excel Exporting',
        commandsOrFormulas: [
          'View -> Data -> Filter: Date Range... (2-Week / 4-Week Lookahead)',
          'View -> Data -> Group By / Highlight',
          'Report -> Visual Reports (Cash Flow / Earned Value Over Time)',
          'File -> Print / Export to PDF (Page Setup -> Fit to 1 page wide)'
        ],
        summary: 'Generate 3-Week Rolling Site Lookahead schedules and export crisp, legible A3/A1 Gantt PDFs without chopped bars or blank pages.',
        mechanics:
          'Why does printing an MS Project Gantt chart often spit out 24 mostly blank pages? Because both the left-hand table columns AND the right-hand multi-year timescale span multiple pages horizontally unless calibrated in `Page Setup` and `Print Dates`.',
        guidelines: [
          'Generate a 3-Week Rolling Site Lookahead Schedule: Go to `View -> Data -> Filter -> Date Range...` -> Enter today’s date and the date 21 days from today -> Filter shows every task starting, finishing, or active during the next 3 weeks!',
          'Perfect A3 / A1 Landscape PDF Gantt Export (5-Step Checklist):',
          '1. Hide unnecessary columns in the left table so only `ID, WBS, Task Name, Duration, Start, Finish, % Complete, Total Slack` remain visible (drag the vertical divider bar tight against the last column!).',
          '2. Zoom the Gantt timescale to `Months / Weeks` or `Quarters / Months`.',
          '3. Press `CTRL + P` (`File -> Print`) -> Under Settings, set `Dates:` from Project Start to Project Finish (prevents printing 6 blank months after project end!).',
          '4. Click `Page Setup` -> Set Orientation = `Landscape`, Paper Size = `A3` (or `A1`), and under Scaling select `Fit to: 1 pages wide by [N] pages tall`.',
          '5. Under the `View` tab of `Page Setup`, check `"Print first [5] columns on all pages"` and uncheck `"Print blank pages"`!'
        ],
        proTip: 'Before exporting task data to Excel (`File -> Export -> Save Project as File -> Microsoft Excel Workbook`), create a dedicated Export Table (`View -> Tables -> More Tables`) containing `WBS`, `Outline Level`, `Name`, `Duration`, `Start`, `Finish`, `Predecessors`, `Baseline Cost`, and `Cost` so the Export Wizard maps every column cleanly.'
      }
    ]
  }
];
