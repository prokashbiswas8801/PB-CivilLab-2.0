# Implementation Plan: AutoCAD, Microsoft Excel & MS Project Master Usage Guidebook + EVM/CPM Studio

## 1. Architectural Overview & Preservation Guarantee
- **Strict Non-Destructive Integration**: All 6 existing tabs and tools in `CadExcelHub.tsx` (`1. Viewport, Scale & Plotting`, `2. Essential AutoCAD Commands`, `3. Plugins (YQArch / YQPrime / Civil 3D)`, `4. AutoLISP & Dynamic Blocks`, `5. Survey CSV to CAD`, and `6. Excel Formulas, VBA & Matrix`) remain 100% intact without removing or altering any existing calculator or dataset.
- **New Capabilities Added to `CadExcelHub`**:
  - **Tab 7: Master Curriculum Guidebook (25 Chapters — AutoCAD, Excel & MS Project)**:
    - A searchable, filterable encyclopedia organized by Software Pillar (**AutoCAD [9 Chapters]**, **Microsoft Excel [8 Chapters]**, **Microsoft Project [8 Chapters]**).
    - Expandable **Chapter & Topic Accordions** covering every single sub-topic and command requested by the user with:
      - **Syntax / Shortcut / Menu Path** (with one-click copy)
      - **How It Works (Engineering Context & Mechanics)**
      - **Step-by-Step Usage Guidelines**
      - **Field & Office Pro Tips / Common Pitfalls**
  - **Tab 8: MS Project EVM & Critical Path (CPM) Calculator + Scheduling Studio**:
    - **Interactive Earned Value Management (EVM) Calculator**:
      - Inputs: Budget at Completion (`BAC`), Planned % Complete (`PV %` or direct `PV / BCWS`), Earned % Complete (`EV %` or direct `EV / BCWP`), Actual Cost (`AC / ACWP`), and EAC Forecasting Method (Standard CPI, Typical Variance, or CPI × SPI Composite).
      - Real-time Outputs: `PV (BCWS)`, `EV (BCWP)`, `AC (ACWP)`, Schedule Variance (`SV = EV - PV`), Cost Variance (`CV = EV - AC`), Schedule Performance Index (`SPI = EV / PV`), Cost Performance Index (`CPI = EV / AC`), Estimate at Completion (`EAC`), Estimate to Complete (`ETC`), Variance at Completion (`VAC = BAC - EAC`), To-Complete Performance Index (`TCPI`), and automated project health diagnostics (Ahead/Behind Schedule, Under/Over Budget).
    - **Interactive CPM Forward/Backward Pass & Float (Slack) Analyzer**:
      - Computes Early Start (`ES`), Early Finish (`EF = ES + D`), Late Start (`LS = LF - D`), Late Finish (`LF`), Total Slack (`TS = LS - ES = LF - EF`), Free Slack (`FS`), and Critical Path status (`TS = 0`).

---

## 2. Complete 25-Chapter Curriculum Coverage (`/src/data/softwareGuidebookData.ts`)

### Pillar A: AUTOCAD (Chapters 1–9)
1. **Drawing Setup & Coordinate Systems**:
   - `UNITS`, `-DWGUNITS`, `LIMITS`, Grid (`F7`) & Snap (`F9`) Settings
   - World Coordinate System (`WCS`) & User Coordinate System (`UCS`, `UCSICON`, `PLAN`)
   - Absolute (`X,Y,Z`), Relative (`@ΔX,ΔY`), and Polar (`@Dist<Angle`) Coordinate Entry
2. **2D Drafting & Geometry**:
   - `LINE`, `PLINE` (Width, Arc/Line segments), `XLINE` (Hor/Ver/Ang/Bisect/Offset), `RAY`, `MLINE` (`MLSTYLE`, `MLEDIT`)
   - `CIRCLE` (Center-Radius,Dia, 2P, 3P, TTR, TTT), `ARC`, `ELLIPSE`, `RECTANG` (Chamfer/Fillet/Width/Dimensions), `POLYGON` (Inscribed vs. Circumscribed), `SPLINE`
   - `HATCH` (`HPGAPTOL`, Associative, Origin, Separate Hatches), `GRADIENT`, `BOUNDARY`, `REGION` (`UNION`, `SUBTRACT`, `MASSPROP`), `WIPEOUT` (`WIPEOUTFRAME`)
3. **Modification & Editing Commands**:
   - `MOVE`, `COPY` (Array option), `ROTATE` (Copy & Reference angle), `SCALE` (Reference length scaling), `MIRROR` (`MIRRTEXT`), `OFFSET` (Through, Erase, Layer)
   - `TRIM` & `EXTEND` (Quick mode vs. Cutting edges, Fence, Shift-toggle), `FILLET` (Shift-zero radius, Multiple), `CHAMFER` (Distance vs. Angle), `BLEND`
   - `ARRAY` (`ARRAYRECT`, `ARRAYPOLAR`, `ARRAYPATH` — associative editing), `STRETCH` (Crossing window rules), `LENGTHEN` (`DElta`, `Percent`, `Total`, `DYnamic`)
   - `BREAK` (Break at Point `@`), `JOIN`, `EXPLODE`, `ALIGN` (2-point 2D transformation), `PEDIT` (Multiple, Join with Fuzz), `OVERKILL`
4. **Precision Snaps & Object Selection**:
   - `OSNAP` (`F3` — Endpoint, Midpoint, Center, Geometric Center, Node, Quadrant, Intersection, Apparent Intersection, Extension, Perpendicular, Tangent, Nearest, `M2P`)
   - `OTRACK` (`F11` Object Snap Tracking), `POLAR` (`F10` Polar Tracking & Incremental Angles), `ORTHO` (`F8`)
   - `QSELECT` (Property queries), `FILTER` (Boolean selection lists), `SELECTSIMILAR` (`SELECTSIMILARMODE`), Selection Cycling (`CTRL+W` / `SELECTIONCYCLING`)
5. **Layer & Property Management**:
   - `LAYER` (On/Off vs. Freeze/Thaw performance, Lock/Unlock fade, Plot/No-Plot, `VP Freeze` per viewport, Layer States `LAS`)
   - `LAYISO`, `LAYUNISO`, `LAYMCUR`, `LAYOFF`, `LAYON`, `LAYMRG` (Merge layers), `LAYDEL` (Force delete)
   - `MATCHPROP` (`MA` & Property Settings), `PROPERTIES` (`CTRL+1`), `QUICKPROPERTIES` (`QP`)
   - Linetype Scales (`LTSCALE`, `PSLTSCALE = 1`, `MSLTSCALE = 1`, `CELTSCALE = 1`)
6. **Blocks, Attributes & External References**:
   - `BLOCK` (`B`), `WBLOCK` (Write external DWG block), `INSERT` (`CLASSICINSERT` / Blocks Palette), `BCOUNT`
   - Dynamic Blocks (`BEDIT`, Point/Linear/Polar/XY/Rotation/Alignment/Flip/Visibility/Lookup Parameters & Stretch/Scale/Move/Array Actions)
   - Attributes (`ATTDEF`, `ATTEDIT`, `EATTEDIT`, `BATTMAN`, `ATTSYNC`, `BURST` vs. `EXPLODE`)
   - External References (`XREF` Attachment vs. Overlay, Relative Paths, `XCLIP`, `XBIND`, `ETRANSMIT` package archiving)
7. **Annotation, Text & Dimensioning**:
   - `TEXT` (`DTEXT`), `MTEXT` (Columns, Background Mask, Stacked Fractions, Symbols `%%c`, `%%d`, `%%p`), `STYLE`, `SPELL`, `FIND`
   - `DIMLINEAR`, `DIMALIGNED`, `DIMANGULAR`, `DIMARC`, `DIMRADIUS`, `DIMDIAMETER`
   - `DIMCONTINUE` (`DCO`), `DIMBASELINE` (`DBA`), `DIMORDINATE`, `DIMSTYLE` (`D`), `DIMSPACE`, `DIMBREAK`
   - `MLEADER` (`MLD`), `MLEADERSTYLE` (`MLS`), `TABLE` (`TB`), `TABLESTYLE` (`TS` — Formulas & Excel Data Links `DATALINK`)
   - Annotative Scaling (`CANNOSCALE`, `ANNOALLVISIBLE`, `ANNOAUTOSCALE`, `OBJECTSCALE`)
8. **Layouts, Viewports & Plotting**:
   - Model Space (1:1 Real Units) vs. Paper Space (1:1 Millimeters)
   - `PAGESETUP`, `MVIEW` (Polygonal & Object Viewports), Viewport Scaling (`ZOOM nXP`), Viewport Locking (`MV -> L -> ON`)
   - Plot Style Tables (`.CTB` Color-Dependent vs. `.STB` Named Plot Styles, `STYLESMANAGER`, `CONVERTPSTYLES`)
   - Lineweight Settings (`LWDISPLAY`), `PUBLISH` (Batch Multi-Sheet PDF), `DWG To PDF.pc3` Export & Font/Layer Capture
9. **Data Extraction, Cleanup & Automation**:
   - `DATAEXTRACTION` (`DX`), `FIELD` (`CTRL+F` dynamic properties & areas)
   - `PURGE`, `-PURGE` (`Regapps`), `AUDIT`, `RECOVER`, `RECOVERALL`, `FLATTEN`
   - AutoLISP Routines (`APPLOAD`, Startup Suite, `acaddoc.lsp`), Script Files (`.SCR`)
   - Custom Command Aliases (`acad.pgp` & `REINIT`), Plugins (`YQArch`, `YQPrime`, `Lee Mac LISP`, `RebarCAD`, `Civil 3D`)

### Pillar B: MICROSOFT EXCEL (Chapters 1–8)
1. **Civil & Construction Engineering Sheets**:
   - Bill of Quantities (`BOQ`), Measurement Book (`MB`), Contractor Running Account (`RA`) Bill (Previous, Current, Cumulative, Retention & Advance Recovery), Bar Bending Schedule (`BBS`), Rate Analysis & Unit Cost Breakdown, Material Reconciliation (Theoretical vs. Actual Consumption & Wastage %), Concrete & Mortar Mix Ratio Calculators, Earthwork Volume & Cut-Fill Sheets
2. **Lookup & Reference Functions**:
   - `XLOOKUP`, `VLOOKUP`, `HLOOKUP`, `INDEX`, `MATCH`, `XMATCH`, `CHOOSE`, `INDIRECT`, `OFFSET`, `ADDRESS`
3. **Logical & Conditional Functions**:
   - `IF`, `IFS`, `AND`, `OR`, `NOT`, `IFERROR`, `IFNA`, `SUM`, `SUMIF`, `SUMIFS`, `SUMPRODUCT`, `COUNT`, `COUNTA`, `COUNTBLANK`, `COUNTIF`, `COUNTIFS`, `AVERAGE`, `AVERAGEIF`, `AVERAGEIFS`, `SUBTOTAL` (`9` vs `109`), `AGGREGATE`
4. **Math, Engineering & Matrix Functions**:
   - `ROUND`, `ROUNDUP`, `ROUNDDOWN`, `MROUND`, `CEILING.MATH`, `FLOOR.MATH`, `CONVERT`, `SQRT`, `POWER`, `PI`, `ABS`, `MOD`, `SIN`, `COS`, `TAN`, `ASIN`, `ACOS`, `ATAN`, `RADIANS`, `DEGREES`, `MMULT`, `MINVERSE`, `MDETERM`
5. **Text, Date & Dynamic Array Functions**:
   - `TEXTJOIN`, `CONCAT`, `LEFT`, `RIGHT`, `MID`, `LEN`, `FIND`, `SEARCH`, `TRIM`, `CLEAN`, `SUBSTITUTE`, `REPLACE`, `VALUE`, `TEXT`, `TODAY`, `NOW`, `DATE`, `DATEDIF`, `WORKDAY.INTL`, `NETWORKDAYS.INTL`, `EDATE`, `EOMONTH`, `LET`, `LAMBDA`, `FILTER`, `SORT`, `SORTBY`, `UNIQUE`, `SEQUENCE`
6. **Data Management & Analysis Tools**:
   - Data Validation (Dependent Dropdowns, Date/Number bounds, Custom Formulas), Conditional Formatting (Formula rules, Data Bars, Color Scales, Icon Sets), Flash Fill (`CTRL+E`), Text to Columns, Remove Duplicates, Data Consolidation, What-If Analysis (`Goal Seek` for back-calculating section depth/rebar, `Scenario Manager`, `Data Tables`), `Solver` Add-in (Cost/Mix Optimization)
7. **Pivot Tables & Visualization**:
   - Pivot Tables, Pivot Charts, Slicers, Timelines, Calculated Fields, Column/Bar/Line/Area/Scatter (S-Curve & GSD)/Combo/Waterfall Cashflow Charts, Interactive KPI Dashboards
8. **Automation & Page Setup**:
   - Power Query (`Get & Transform` multi-sheet merging), VBA Macros & UDFs, Worksheet & Workbook Protection (Locking formula cells while unlocking input cells), Page Setup (A4/A3 Portrait/Landscape fit-to-1-page-wide, Print Area, Print Titles repeating headers, Page Break Preview)

### Pillar C: MICROSOFT PROJECT (MS PROJECT) (Chapters 1–8)
1. **Project Setup & Calendars**:
   - Project Information (Start Date, Finish Date, Current Date, Status Date), Base Calendars (Standard, 24-Hour, Night Shift), Custom Working Hours, Work Weeks (e.g., Sat–Thu site week) & Holiday/Monsoon Exceptions, Auto-Scheduled vs. Manually Scheduled Modes
2. **Work Breakdown Structure (WBS) & Tasks**:
   - Task Hierarchy (Project Summary Task `Task 0`, Summary Tasks, Subtasks, 0-day Milestones), WBS Codes & Outline Numbering, Duration Estimation & Elapsed Duration (`edays` for 24/7 concrete curing), Recurring Tasks (Weekly Site Progress Meetings), Task Splits, Task Inactivation, Deadlines & Task Constraints (`ASAP`, `ALAP`, `SNET`, `SNLT`, `FNET`, `FNLT`, `MSO`, `MFO`)
3. **Task Dependencies & Scheduling Logic**:
   - `FS` (Finish-to-Start), `SS` (Start-to-Start), `FF` (Finish-to-Finish), `SF` (Start-to-Finish), Lead Time (Negative Lag, e.g., `FS - 3 days`) & Lag Time (Positive Lag, e.g., `FS + 7 edays` for stripping formwork)
4. **Critical Path Method (CPM)**:
   - Critical Path Identification, Total Slack (`Total Float`) & Free Slack (`Free Float`), Schedule Compression (`Crashing` via resources/overtime vs. `Fast-Tracking` via parallel `SS`/`FS-lead` logic)
5. **Resource & Cost Management**:
   - Resource Sheet (`Work` labor/equipment, `Material` m³/tons/bags, `Cost` lump-sum subcontracts), Resource Rates (Standard, Overtime, Cost Per Use), Task Types (`Fixed Units`, `Fixed Work`, `Fixed Duration`) & Effort-Driven Scheduling (`Work = Duration × Units`), Resource Overallocation Detection & Resource Leveling, Fixed Task Costs, Cost Accrual (`Start`, `Prorated`, `End`), Budget Resources
6. **Baselines & Progress Tracking**:
   - Setting, Saving, and Clearing Baselines (`Baseline 0–10`) & Interim Plans, Status Date Configuration & Gridlines, Progress Tracking (`% Complete` duration vs. `% Work Complete` vs. `Physical % Complete` for EVM), `Actual Start`, `Actual Finish`, `Actual Duration`, `Remaining Duration`, Rescheduling Uncompleted Work (`Update Project`)
7. **Earned Value Management (EVM)**:
   - `PV (BCWS)`, `EV (BCWP)`, `AC (ACWP)`, `SV` & `CV`, `SPI` & `CPI`, `BAC`, `EAC`, `ETC`, `VAC`, and `TCPI`
8. **Views, Custom Fields & Reporting**:
   - Gantt Chart, Tracking Gantt, Detail Gantt (Slippage bars), Network Diagram (`PERT`), Task Usage, Resource Usage, Resource Graph, Timeline View, Custom Fields (`Number1`, `Text1`, `Flag1`), Formulas & Graphical Traffic-Light Indicators, Filtering, Grouping, Highlighting, Built-in Visual Cashflow/S-Curve Reports, Excel & PDF Exporting (Single-Page / Multi-Page Timescale Calibration)

---

## 3. Files to Create & Update
1. **Create `/src/data/softwareGuidebookData.ts`**:
   - Contains the complete structured 25-chapter encyclopedia across **AutoCAD (9 chapters)**, **Microsoft Excel (8 chapters)**, and **Microsoft Project (8 chapters)** with detailed commands, formulas, step-by-step usage guidelines, and pro tips.
2. **Update `/src/components/calculators/hub/CadExcelHub.tsx`**:
   - Add **Tab 7 (`7. Master Guidebook (25 Chapters)`)** with Pillar Switcher (`All`, `AutoCAD`, `Microsoft Excel`, `MS Project`), Chapter Filter, Global Instant Search, Expand/Collapse All controls, and one-click Command/Formula copy.
   - Add **Tab 8 (`8. MS Project (EVM & CPM)`)** featuring the interactive **Earned Value Management (EVM) Calculator** and **Critical Path Method (CPM) Single-Task Float & Pass Calculator** plus direct access to the 8 MS Project Guidebook chapters.
3. **Verify Compilation & Linting**:
   - Run `compile_applet` and `lint_applet` together to guarantee 0 TypeScript or build errors.
