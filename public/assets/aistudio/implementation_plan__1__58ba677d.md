# Certified Engineering PDF Diagram Capture, Light CAD Sheet Styling & Export Unit Freedom

This update resolves the missing 2D engineering diagram and dark-block visual artifacts in exported PDFs, transitions the submittal sheet to a clean light architectural blueprint aesthetic, and empowers users to choose their preferred measurement unit system (`Workspace Default`, `SI Metric`, `Imperial ft-in`, or `Regional BD`) directly when exporting or printing any engineering document.

## User Review & Critical Decisions

> [!IMPORTANT]
> All three product and design decisions below have been confirmed through your preferences and are locked in for implementation:

- **Confirmed Decision 1 — Export Unit System Freedom**: Both the **PDF Submittal Export Modal** and the **Unified Print Preview Modal** will include an interactive **Export Unit Format Selector** (`Active Workspace`, `SI Metric (m, mm, kN, MPa)`, `Imperial (ft-in, kip, psi, CFT)`, and `Regional BD (ft-in, CFT, Katha/Decimal)`). Selecting a unit preset dynamically converts and formats all exported input parameters, computed outputs, itemized schedules, step-by-step substitutions, and 2D diagram callouts into that unit system.
- **Confirmed Decision 2 — Crisp Light CAD Blueprint Diagrams**: Captured 2D analytical and structural diagrams will render on a crisp white/light blueprint canvas (`#ffffff` / `#f8fafc`) with high-contrast dark structural strokes (`#0f172a`, `#1e3a8a`, `#0284c7`, `#dc2626`) and zero dark background boxes. Small UI toolbar icons (`24×24` Lucide icons) are strictly excluded from diagram capture so the true structural/civil schematic is always embedded.
- **Confirmed Decision 3 — Clean Light Architectural Header (Zero Dark Blocks)**: All solid black/dark-navy background blocks in the PDF title block, diagram frame, logo badge, and schedule headers are replaced with a crisp light architectural title block featuring structured navy rules, a light-background CAD monogram, and light blueprint table headers—completely eliminating white-spot artifacts and saving printer ink.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **True 2D Engineering Diagram Capture**: Fixes the selector collision where a `24×24` toolbar icon inside the visualizer header was captured instead of the `680×408` structural SVG diagram, and adds light-mode CAD color normalization so every dark-mode or light-mode SVG diagram exports as a sharp, paper-friendly technical drawing.
  2. **Artifact-Free Light Architectural Title Block**: Replaces heavy dark rectangle fills and dark-background raster logos with a clean, bordered architectural title block, light-theme vector monogram, and subtle blueprint-tinted table headers.
  3. **Dynamic Export Unit Conversion**: Integrates the central unit conversion engine into the report builder so users can switch the exported document's unit system on the fly—converting lengths (`m` $\leftrightarrow$ `ft-in` / `ft` / `mm`), areas (`m²` $\leftrightarrow$ `sq ft` / `Katha` / `Decimal`), volumes (`m³` $\leftrightarrow$ `CFT`), forces (`kN` $\leftrightarrow$ `kip` / `kgf`), distributed loads (`kN/m` $\leftrightarrow$ `kip/ft`), moments (`kN·m` $\leftrightarrow$ `kip·ft`), and stresses (`MPa` / `kPa` $\leftrightarrow$ `psi` / `ksf`).
- **Target Audience / Persona**: Structural, geotechnical, hydraulic, and QS/site engineers preparing formal calculations for municipal authorities (RAJUK, PWD, LGED), clients, or contractors who require either SI Metric or Imperial/Regional (`ft-in`, `CFT`, `psi`) submittals.
- **Key Value**: 100% accurate 2D diagrams in every exported PDF, zero dark-block or white-spot visual defects, and complete flexibility to issue reports in any client-requested unit standard without altering workspace inputs.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Selecting Export Units in the PDF Export Modal**:
     - The user opens the **Export Certified PDF** modal and selects from four unit format buttons: **Workspace Units**, **SI Metric**, **Imperial (ft-in / psi / CFT)**, or **Regional BD (ft-in / CFT / Katha)**.
     - Clicking **Export Certified PDF** converts all report tables, derivations, and diagram dimensions to the chosen unit system and downloads the clean light-blueprint PDF.
  2. **Switching Export Units Live in the Unified Print Preview Modal**:
     - In the **Print Preview Modal**, the user can toggle the **Export Unit Format** selector in the sidebar/toolbar.
     - Both the live A4/Letter preview sheet and the **Download Certified PDF** / **Print Sheet** actions immediately reflect the selected unit format, light CAD diagram, and clean architectural header.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Precision Architectural & Structural Submittal Sheet (ISO/CAD engineering drawing border + clean light paper posture).
  - *Color Palette & Mood*:
    - **Paper Canvas (60%)**: Pure White (`#ffffff`) and subtle Architectural Alabaster (`#f8fafc`) for alternating table rows and formula callout boxes.
    - **Structural Framing & Typography (30%)**: Deep Slate (`#0f172a`) for primary text and values, Charcoal Slate (`#475569`) for secondary labels, and Crisp Hairline Rules (`#cbd5e1`).
    - **Engineering Accents (10%)**: Blueprint Navy (`#1e3a8a`) for title block framing and section headers, Technical Cobalt (`#2563eb`) for primary vector curves, and semantic verification accents (`#047857` Emerald Pass, `#b45309` Amber Warning, `#be123c` Crimson Fail).
  - *Typography & Hierarchy*: Clean sans-serif structural headings paired with tabular monospace numerals (`Courier` / `tabular-nums`) for all converted quantities, equations, and coordinates.
- **Interactive Feedback & Motion**: Instant unit format preview updates in the Print Preview sheet and smooth progress stage feedback during high-DPI light-CAD diagram rasterization.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Filtering UI Icons & Normalizing SVG Diagrams to Light CAD Blueprint Style**
  - *Chosen Approach*: Explicitly tag and select only primary engineering schematic SVGs (verifying `viewBox` width $\ge 200$ and excluding `.lucide` icon elements), and transform dark-canvas SVG fills (`#0f172a`, `#1e293b`, `#141413`) and light strokes (`#f8fafc`, `#e2e8f0`) into a crisp white/alabaster CAD background (`#ffffff` / `#f8fafc`) with dark technical strokes (`#0f172a`, `#1e3a8a`, `#334155`).
  - *Why*: Previously, a `24×24` toolbar icon inside the diagram card header was matched first by the generic `svg` selector and stretched onto a dark `#0f172a` canvas, creating a black block with white spots while skipping the actual engineering diagram.
  - *Alternatives Considered*: Capturing the entire DOM container via HTML rasterization was rejected because vector-to-canvas SVG serialization with light-CAD palette mapping produces far sharper lines and text at 2×–3× print DPI.
- **Decision 2: Post-Processing & Formatting Report Data by Selected Export Unit Preset**
  - *Chosen Approach*: Pass the selected `exportUnitPreset` (`workspace` | `metric` | `imperial` | `regional`) into the report builder and apply a deterministic unit-conversion transformer across every `ReportParameterRow`, `ReportOutputRow`, `ReportTakeoffRow`, and `ReportFormulaStep`, as well as the hidden print-capture diagram's `unitPreset` prop.
  - *Why*: Centralizing unit transformation in the report data builder guarantees that every module's inputs, outputs, and schedules respect the user's chosen export unit format without mutating the underlying SI workspace state.
  - *Alternatives Considered*: Mutating global workspace unit state during export was rejected to avoid unexpected side effects on the user's active editing session.
- **Decision 3: Light Architectural Title Block & Light Monogram Seal**
  - *Chosen Approach*: Render the PDF header, logo monogram, diagram container, and table headers using clean white/light-slate fills (`#ffffff`, `#f1f5f9`, `#eff6ff`) with crisp navy borders (`#1e3a8a`) and dark text (`#0f172a`).
  - *Why*: Eliminates all black/dark blocks and raster contrast artifacts while matching standard civil/structural consultant submittal sheets that print cleanly on office laser/inkjet printers.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌────────────────────────────────────────────────────────────────────────────┐
│                   USER EXPORT & PRINT ENTRY POINTS                         │
│  ┌──────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │     PDF Submittal Configurator   │  │   Unified Print Preview Modal  │  │
│  │  • Export Unit Preset Selector   │  │  • Live Export Unit Switcher   │  │
│  │    (Workspace/SI/Imperial/Reg.)  │  │  • Live A4/Letter Sheet View   │  │
│  └─────────────────┬────────────────┘  └────────────────┬───────────────┘  │
└────────────────────┼────────────────────────────────────┼──────────────────┘
                     └─────────────────┬──────────────────┘
                                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                 UNIT-AWARE REPORT BUILDER & CONVERTER                      │
│  • Resolves target unit system (Workspace | SI Metric | Imperial | BD)     │
│  • Converts Input Rows, Output Rows, Takeoff Schedules & Formula Steps     │
│    (m <-> ft-in/ft, mm <-> in, m² <-> sq ft/Katha, m³ <-> CFT,             │
│     kN <-> kip, kN/m <-> kip/ft, kN·m <-> kip·ft, MPa/kPa <-> psi/ksf)     │
└──────────────────────────────────────┬─────────────────────────────────────┘
                                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│            LIGHT-CAD SVG DIAGRAM CAPTURE & VECTOR PDF ENGINE               │
│  • Selects true engineering SVG (excludes 24x24 .lucide UI icons)          │
│  • Remaps dark canvas fills (#0f172a/#1e293b) -> crisp white/light CAD     │
│  • Renders Light Architectural Header, Light Logo, Tables & 3-Tier Seal    │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `ExportUnitPreset`: `'workspace' | 'metric' | 'imperial' | 'regional'` added to `PdfExportEngineOptions`, `PdfExportCustomOverrides`, and `PrintSettings`.
  - Unit conversion formatter maps standard engineering units (`m`, `mm`, `cm`, `m^2`, `m²`, `m^3`, `m³`, `kN`, `kN/m`, `kN.m`, `kN·m`, `MPa`, `kPa`, `kg`, `kg/m^3`, `L/s`) and compound values into their exact target unit counterparts with clean unit labels and precision rounding.
- **Interactive Component & State Mapping**:
  - Selecting a unit preset in `PdfExportModal` or `PrintPreviewModal` updates local modal state and syncs the hidden diagram capture container's `unitPreset` prop so captured 2D diagrams also display dimensions in the chosen unit system (`ft-in` vs `m`).
  - `captureActiveModuleDiagramPng` iterates all candidate SVGs in `#pb-print-capture-source .print-capture-diagram`, `[data-diagram-export="active-module"]`, and active module containers, skipping any `<svg>` with class `lucide` or bounding/viewBox width $< 180\text{px}$, and converts the matched engineering SVG into a high-DPI light-blueprint PNG.
