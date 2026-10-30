import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Layers,
  Hammer,
  Grid,
  Paintbrush,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  DollarSign,
  Maximize2,
  Box,
  Percent,
} from 'lucide-react';
import { exportToCSV, generateEngineeringPDF } from '../../../utils/exportEngine';

export type TakeoffSubTab = 'brickwork' | 'plaster-paint' | 'flooring-tiles' | 'formwork-labor';

export interface OpeningDeduction {
  id: string;
  name: string;
  widthM: number;
  heightM: number;
  quantity: number;
}

export const MaterialTakeoff: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TakeoffSubTab>('brickwork');

  // =========================================================================
  // TAB 1: BRICKWORK ESTIMATOR STATE
  // =========================================================================
  const [wallLengthM, setWallLengthM] = useState<number>(15.0); // 15m wall run
  const [wallHeightM, setWallHeightM] = useState<number>(3.0); // 3.0m story height
  const [wallThicknessType, setWallThicknessType] = useState<'125mm' | '250mm' | 'custom'>('125mm');
  const [customThicknessMm, setCustomThicknessMm] = useState<number>(125);
  const [mortarRatio, setMortarRatio] = useState<'1:4' | '1:5' | '1:6'>('1:5');
  const [brickStandard, setBrickStandard] = useState<'traditional' | 'modular'>('traditional');
  const [brickWastagePercent, setBrickWastagePercent] = useState<number>(5.0); // 5%
  const [mortarWastagePercent, setMortarWastagePercent] = useState<number>(10.0); // 10%
  const [brickUnitPrice, setBrickUnitPrice] = useState<number>(12.0); // 12 BDT/INR or $0.15
  const [cementBagPrice, setCementBagPrice] = useState<number>(520); // 520 / bag
  const [sandCftPrice, setSandCftPrice] = useState<number>(45); // 45 / cft

  const [openings, setOpenings] = useState<OpeningDeduction[]>([
    { id: 'op-1', name: 'Main Door (D1)', widthM: 1.0, heightM: 2.1, quantity: 2 },
    { id: 'op-2', name: 'Window (W1)', widthM: 1.5, heightM: 1.2, quantity: 3 },
  ]);

  const addOpening = () => {
    setOpenings((prev) => [
      ...prev,
      {
        id: `op-${Date.now()}`,
        name: `Opening ${prev.length + 1}`,
        widthM: 1.2,
        heightM: 1.2,
        quantity: 1,
      },
    ]);
  };

  const removeOpening = (id: string) => {
    setOpenings((prev) => prev.filter((it) => it.id !== id));
  };

  const updateOpening = (id: string, field: keyof OpeningDeduction, val: string | number) => {
    setOpenings((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  // Brickwork Calculations
  const brickCalc = useMemo(() => {
    const thicknessM =
      wallThicknessType === '125mm'
        ? 0.125
        : wallThicknessType === '250mm'
        ? 0.25
        : customThicknessMm / 1000;

    const grossWallAreaM2 = wallLengthM * wallHeightM;
    const grossVolumeM3 = grossWallAreaM2 * thicknessM;

    // Deductions
    const totalDeductionsAreaM2 = openings.reduce(
      (sum, op) => sum + op.widthM * op.heightM * op.quantity,
      0
    );
    const totalDeductionsVolumeM3 = totalDeductionsAreaM2 * thicknessM;

    const netWallAreaM2 = Math.max(0.1, grossWallAreaM2 - totalDeductionsAreaM2);
    const netVolumeM3 = Math.max(0.01, grossVolumeM3 - totalDeductionsVolumeM3);

    // Brick Dimensions with / without mortar
    // Traditional Bengal/South-Asian: Nominal 250 x 125 x 75 mm (with 10mm mortar), Dry brick: 240 x 115 x 70 mm
    // Modular metric: Nominal 200 x 100 x 100 mm, Dry brick: 190 x 90 x 90 mm
    let dryBrickVolM3 = 0.24 * 0.115 * 0.07;
    let nominalBrickVolM3 = 0.25 * 0.125 * 0.075;
    if (brickStandard === 'modular') {
      dryBrickVolM3 = 0.19 * 0.09 * 0.09;
      nominalBrickVolM3 = 0.2 * 0.1 * 0.1;
    }

    // Number of nominal bricks without wastage
    const rawBricksCount = netVolumeM3 / nominalBrickVolM3;
    const totalBricksCount = Math.ceil(rawBricksCount * (1 + brickWastagePercent / 100));

    // Mortar wet volume = Net wall volume - actual dry brick solid volume
    const dryBricksSolidVolM3 = rawBricksCount * dryBrickVolM3;
    const wetMortarM3 = Math.max(0, netVolumeM3 - dryBricksSolidVolM3);

    // Dry mortar volume factor: wet mortar x 1.33 (33% void allowance) x (1 + wastage)
    const dryMortarFactor = 1.33 * (1 + mortarWastagePercent / 100);
    const dryMortarM3 = wetMortarM3 * dryMortarFactor;

    // Cement & Sand proportions
    let cementPart = 1;
    let sandPart = 5;
    if (mortarRatio === '1:4') {
      sandPart = 4;
    } else if (mortarRatio === '1:6') {
      sandPart = 6;
    }
    const totalParts = cementPart + sandPart;

    const cementVolM3 = (dryMortarM3 * cementPart) / totalParts;
    // 1 m3 cement = 1440 kg = 28.8 bags (50kg each)
    const cementBags = cementVolM3 * 28.8;

    const sandVolM3 = (dryMortarM3 * sandPart) / totalParts;
    const sandCFT = sandVolM3 * 35.3147;

    // Costs
    const brickCost = totalBricksCount * brickUnitPrice;
    const cementCost = Math.ceil(cementBags) * cementBagPrice;
    const sandCost = sandCFT * sandCftPrice;
    const totalMaterialCost = brickCost + cementCost + sandCost;

    return {
      thicknessM,
      grossWallAreaM2,
      grossVolumeM3,
      totalDeductionsAreaM2,
      totalDeductionsVolumeM3,
      netWallAreaM2,
      netVolumeM3,
      totalBricksCount,
      wetMortarM3,
      dryMortarM3,
      cementBags,
      sandVolM3,
      sandCFT,
      brickCost,
      cementCost,
      sandCost,
      totalMaterialCost,
    };
  }, [
    wallLengthM,
    wallHeightM,
    wallThicknessType,
    customThicknessMm,
    mortarRatio,
    brickStandard,
    brickWastagePercent,
    mortarWastagePercent,
    openings,
    brickUnitPrice,
    cementBagPrice,
    sandCftPrice,
  ]);

  // =========================================================================
  // TAB 2: PLASTERING & PAINTING STATE
  // =========================================================================
  const [plasterAreaM2, setPlasterAreaM2] = useState<number>(120); // 120 m2
  const [plasterThicknessMm, setPlasterThicknessMm] = useState<number>(12); // 12mm internal
  const [plasterRatio, setPlasterRatio] = useState<'1:3' | '1:4' | '1:5' | '1:6'>('1:4');
  const [includePaint, setIncludePaint] = useState<boolean>(true);
  const [numPaintCoats, setNumPaintCoats] = useState<number>(2);
  const [includePutty, setIncludePutty] = useState<boolean>(true);
  const [includePrimer, setIncludePrimer] = useState<boolean>(true);

  const plasterCalc = useMemo(() => {
    // Wet volume
    const wetVolM3 = plasterAreaM2 * (plasterThicknessMm / 1000);
    // Add 20% for joint filling/uneven masonry + 33% for dry volume expansion (1.20 * 1.33 ≈ 1.60 total factor)
    const dryMortarFactor = 1.6;
    const dryMortarM3 = wetVolM3 * dryMortarFactor;

    let cPart = 1;
    let sPart = 4;
    if (plasterRatio === '1:3') sPart = 3;
    if (plasterRatio === '1:5') sPart = 5;
    if (plasterRatio === '1:6') sPart = 6;
    const sumParts = cPart + sPart;

    const cementM3 = (dryMortarM3 * cPart) / sumParts;
    const cementBags = cementM3 * 28.8;
    const sandM3 = (dryMortarM3 * sPart) / sumParts;
    const sandCFT = sandM3 * 35.3147;

    // Painting coverage metrics:
    // Primer: ~12 m2 / Liter
    const primerLiters = includePrimer ? plasterAreaM2 / 12 : 0;
    // Putty: ~2.2 kg / m2 for 2 coats
    const puttyKg = includePutty ? plasterAreaM2 * 2.2 : 0;
    const puttyBags20kg = Math.ceil(puttyKg / 20);
    // Emulsion Paint: ~9 m2 / Liter per coat
    const paintLiters = includePaint ? (plasterAreaM2 * numPaintCoats) / 9 : 0;
    const paintGallons = paintLiters / 3.78541;

    return {
      wetVolM3,
      dryMortarM3,
      cementBags,
      sandM3,
      sandCFT,
      primerLiters,
      puttyKg,
      puttyBags20kg,
      paintLiters,
      paintGallons,
    };
  }, [
    plasterAreaM2,
    plasterThicknessMm,
    plasterRatio,
    includePaint,
    numPaintCoats,
    includePutty,
    includePrimer,
  ]);

  // =========================================================================
  // TAB 3: FLOORING & TILES STATE
  // =========================================================================
  const [roomLengthM, setRoomLengthM] = useState<number>(6.0); // 6m
  const [roomWidthM, setRoomWidthM] = useState<number>(5.0); // 5m
  const [tileLengthMm, setTileLengthMm] = useState<number>(600); // 600mm
  const [tileWidthMm, setTileWidthMm] = useState<number>(600); // 600mm
  const [skirtingHeightMm, setSkirtingHeightMm] = useState<number>(100); // 100mm (4")
  const [skirtingDoorDeductionM, setSkirtingDoorDeductionM] = useState<number>(2.0); // 2m door openings
  const [tileWastagePercent, setTileWastagePercent] = useState<number>(7.0); // 7%
  const [tilesPerBox, setTilesPerBox] = useState<number>(4); // 4 tiles/box (standard for 600x600)
  const [bedThicknessMm, setBedThicknessMm] = useState<number>(35); // 35mm mortar bed
  const [bedRatio, setBedRatio] = useState<'1:4' | '1:6'>('1:4');
  const [groutWidthMm, setGroutWidthMm] = useState<number>(3); // 3mm grout joints

  const tileCalc = useMemo(() => {
    const floorAreaM2 = roomLengthM * roomWidthM;
    const perimeterM = Math.max(0, 2 * (roomLengthM + roomWidthM) - skirtingDoorDeductionM);
    const skirtingAreaM2 = perimeterM * (skirtingHeightMm / 1000);
    const totalTileAreaM2 = floorAreaM2 + skirtingAreaM2;

    const singleTileAreaM2 = (tileLengthMm / 1000) * (tileWidthMm / 1000);
    const netTileCount = Math.ceil(totalTileAreaM2 / singleTileAreaM2);
    const grossTileCount = Math.ceil(netTileCount * (1 + tileWastagePercent / 100));
    const boxesRequired = Math.ceil(grossTileCount / tilesPerBox);

    // Bed Mortar
    const wetBedVolM3 = floorAreaM2 * (bedThicknessMm / 1000);
    const dryBedVolM3 = wetBedVolM3 * 1.33;
    const sPart = bedRatio === '1:4' ? 4 : 6;
    const cementBedBags = ((dryBedVolM3 * 1) / (1 + sPart)) * 28.8;
    const sandBedCFT = ((dryBedVolM3 * sPart) / (1 + sPart)) * 35.3147;

    // Grout powder: approx 0.35 kg/m2 for 600x600 with 3mm joints
    const groutKg = totalTileAreaM2 * (groutWidthMm * 0.12);

    return {
      floorAreaM2,
      skirtingAreaM2,
      totalTileAreaM2,
      singleTileAreaM2,
      netTileCount,
      grossTileCount,
      boxesRequired,
      cementBedBags,
      sandBedCFT,
      groutKg,
    };
  }, [
    roomLengthM,
    roomWidthM,
    tileLengthMm,
    tileWidthMm,
    skirtingHeightMm,
    skirtingDoorDeductionM,
    tileWastagePercent,
    tilesPerBox,
    bedThicknessMm,
    bedRatio,
    groutWidthMm,
  ]);

  // =========================================================================
  // TAB 4: FORMWORK (SHUTTERING) & LABOR STATE
  // =========================================================================
  const [formElementType, setFormElementType] = useState<'slab' | 'beam' | 'column' | 'combined'>('combined');
  const [slabSoffitAreaM2, setSlabSoffitAreaM2] = useState<number>(150); // 150 m2
  const [beamLengthM, setBeamLengthM] = useState<number>(60); // 60m total beams
  const [beamDepthMm, setBeamDepthMm] = useState<number>(450); // 450mm
  const [beamWidthMm, setBeamWidthMm] = useState<number>(250); // 250mm
  const [columnCount, setColumnCount] = useState<number>(12); // 12 columns
  const [colSizeBMm, setColSizeBMm] = useState<number>(300); // 300mm
  const [colSizeDMm, setColSizeDMm] = useState<number>(450); // 450mm
  const [colHeightM, setColHeightM] = useState<number>(3.0); // 3m
  const [propsSpacingM, setPropsSpacingM] = useState<number>(1.1); // 1.1m c/c grid
  const [masonDailyWage, setMasonDailyWage] = useState<number>(900); // 900 / day
  const [helperDailyWage, setHelperDailyWage] = useState<number>(600); // 600 / day

  const formworkCalc = useMemo(() => {
    // 1. Shuttering Area Calculation
    // Slab soffit
    const slabShutterArea = formElementType === 'column' ? 0 : slabSoffitAreaM2;

    // Beams (sides + bottom): 2 * (D_beam - t_slab) + W_beam
    const beamSideAndBottomPerMeter = 2 * (beamDepthMm / 1000) + beamWidthMm / 1000;
    const beamShutterArea =
      formElementType === 'slab' || formElementType === 'column'
        ? 0
        : beamLengthM * beamSideAndBottomPerMeter;

    // Columns: Perimeter * Height = 2 * (B + D) * H * Nos
    const colPerimeterM = 2 * (colSizeBMm / 1000 + colSizeDMm / 1000);
    const colShutterArea =
      formElementType === 'slab' || formElementType === 'beam'
        ? 0
        : columnCount * colPerimeterM * colHeightM;

    const totalShutteringAreaM2 = slabShutterArea + beamShutterArea + colShutterArea;
    const totalShutteringAreaSqft = totalShutteringAreaM2 * 10.7639;

    // 2. Props & Staging
    // Staging prop required per m2 of horizontal soffit (slab + beam bottoms)
    const horizSoffitArea = slabShutterArea + beamLengthM * (beamWidthMm / 1000);
    const propsCount = Math.ceil(horizSoffitArea / (propsSpacingM * propsSpacingM));

    // Release oil: ~1 Liter covers 20 - 25 m2 of plywood/steel shuttering
    const shutterOilLiters = totalShutteringAreaM2 / 22;

    // 3. Labor Productivity
    // Formwork carpenter + helper output: approx 8 m2 per man-day of skilled carpenter
    const carpenterManDays = totalShutteringAreaM2 / 8.0;
    const helperManDays = carpenterManDays * 1.25;

    const carpenterCost = carpenterManDays * masonDailyWage;
    const helperCost = helperManDays * helperDailyWage;
    const totalLaborCost = carpenterCost + helperCost;
    const unitLaborCostPerM2 = totalLaborCost / Math.max(1, totalShutteringAreaM2);

    return {
      slabShutterArea,
      beamShutterArea,
      colShutterArea,
      totalShutteringAreaM2,
      totalShutteringAreaSqft,
      propsCount,
      shutterOilLiters,
      carpenterManDays,
      helperManDays,
      carpenterCost,
      helperCost,
      totalLaborCost,
      unitLaborCostPerM2,
    };
  }, [
    formElementType,
    slabSoffitAreaM2,
    beamLengthM,
    beamDepthMm,
    beamWidthMm,
    columnCount,
    colSizeBMm,
    colSizeDMm,
    colHeightM,
    propsSpacingM,
    masonDailyWage,
    helperDailyWage,
  ]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Category', 'Item Description', 'Quantity', 'Unit', 'Remarks'];
    let rows: (string | number)[][] = [];

    if (activeTab === 'brickwork') {
      rows = [
        ['Brickwork', 'Net Brick Masonry Volume', brickCalc.netVolumeM3.toFixed(2), 'm³', 'After openings deduction'],
        ['Brickwork', 'Clay Bricks Required', brickCalc.totalBricksCount, 'nos', `Includes ${brickWastagePercent}% wastage`],
        ['Mortar', 'Wet Mortar Volume', brickCalc.wetMortarM3.toFixed(2), 'm³', 'Solid volume difference'],
        ['Mortar', 'Dry Mortar Volume', brickCalc.dryMortarM3.toFixed(2), 'm³', 'x1.33 dry factor + wastage'],
        ['Cement', 'Portland Cement (50kg bags)', Math.ceil(brickCalc.cementBags), 'bags', `Ratio ${mortarRatio}`],
        ['Sand', 'Coarse Sand Volume', brickCalc.sandCFT.toFixed(1), 'CFT', `${brickCalc.sandVolM3.toFixed(2)} m³`],
        ['Cost', 'Total Estimated Material Cost', brickCalc.totalMaterialCost.toFixed(0), 'Currency', 'Bricks + Cement + Sand'],
      ];
    } else if (activeTab === 'plaster-paint') {
      rows = [
        ['Plaster', 'Plaster Surface Area', plasterAreaM2, 'm²', `${plasterThicknessMm}mm thickness`],
        ['Plaster', 'Dry Mortar Volume', plasterCalc.dryMortarM3.toFixed(2), 'm³', 'Includes 60% void & depression'],
        ['Cement', 'Cement for Plaster', Math.ceil(plasterCalc.cementBags), 'bags', `Ratio ${plasterRatio}`],
        ['Sand', 'Plaster Sand', plasterCalc.sandCFT.toFixed(1), 'CFT', `${plasterCalc.sandM3.toFixed(2)} m³`],
        ['Putty', 'Wall Putty Powder', plasterCalc.puttyKg.toFixed(1), 'kg', `${plasterCalc.puttyBags20kg} bags (20kg)`],
        ['Primer', 'Surface Primer', plasterCalc.primerLiters.toFixed(1), 'Liters', '1 coat coverage'],
        ['Paint', 'Emulsion / Weather-coat Paint', plasterCalc.paintLiters.toFixed(1), 'Liters', `${numPaintCoats} coats (${plasterCalc.paintGallons.toFixed(1)} gal)`],
      ];
    } else if (activeTab === 'flooring-tiles') {
      rows = [
        ['Flooring', 'Total Floor + Skirting Area', tileCalc.totalTileAreaM2.toFixed(2), 'm²', `${roomLengthM}m x ${roomWidthM}m`],
        ['Tiles', `Tiles (${tileLengthMm}x${tileWidthMm}mm)`, tileCalc.grossTileCount, 'nos', `Includes ${tileWastagePercent}% wastage`],
        ['Tiles', 'Cartons / Boxes Required', tileCalc.boxesRequired, 'boxes', `${tilesPerBox} pcs/box`],
        ['Bedding', 'Cement for Bed Mortar', Math.ceil(tileCalc.cementBedBags), 'bags', `${bedThicknessMm}mm bed @ ${bedRatio}`],
        ['Bedding', 'Sand for Bed Mortar', tileCalc.sandBedCFT.toFixed(1), 'CFT', 'Coarse mortar sand'],
        ['Grout', 'Tile Joint Grout Powder', tileCalc.groutKg.toFixed(1), 'kg', `${groutWidthMm}mm joint width`],
      ];
    } else {
      rows = [
        ['Shuttering', 'Total Formwork Contact Area', formworkCalc.totalShutteringAreaM2.toFixed(1), 'm²', `${formworkCalc.totalShutteringAreaSqft.toFixed(0)} sq.ft`],
        ['Staging', 'Props / Acrow Jacks Required', formworkCalc.propsCount, 'nos', `@ ${propsSpacingM}m grid c/c`],
        ['Consumables', 'Shuttering Release Oil', formworkCalc.shutterOilLiters.toFixed(1), 'Liters', 'Plywood/Steel coverage'],
        ['Labor', 'Carpenter / Shuttering Man-days', formworkCalc.carpenterManDays.toFixed(1), 'man-days', '@ 8 m²/day'],
        ['Labor', 'Helper Man-days', formworkCalc.helperManDays.toFixed(1), 'man-days', '@ 1.25x ratio'],
        ['Cost', 'Estimated Formwork Labor Cost', formworkCalc.totalLaborCost.toFixed(0), 'Currency', `~${formworkCalc.unitLaborCostPerM2.toFixed(0)} per m²`],
      ];
    }

    exportToCSV(`PB_CivilLab_Takeoff_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // PDF Export
  const handleExportPDF = async () => {
    const pdfData = {
      projectMeta: {
        projectName: 'Construction Material Takeoff & Labor Productivity Assessment',
        projectCode: 'BOQ-TAKEOFF-2026',
        client: 'Site Quantity Surveying & Procurement Division',
        location: 'Civil Construction Submittal',
        date: new Date().toISOString().slice(0, 10),
        unitSystem: 'SI' as const,
        engineerName: 'Prokash Biswas, PE',
      },
      moduleMeta: {
        moduleId: 'material-takeoff-boq',
        moduleTitle: `MATERIAL TAKEOFF & BOQ REPORT — ${activeTab.toUpperCase()}`,
        standard: 'BNBC 2020 / ACI 211 / IS 1200 Method of Measurement',
        status: 'VERIFIED' as const,
      },
      inputs: [
        { name: 'Active Takeoff Trade', symbol: 'Trade', value: activeTab.toUpperCase(), unit: '-' },
        { name: 'Primary Geometry Parameter', symbol: 'Dim_1', value: activeTab === 'brickwork' ? `${wallLengthM}m x ${wallHeightM}m` : activeTab === 'plaster-paint' ? `${plasterAreaM2} m²` : activeTab === 'flooring-tiles' ? `${roomLengthM}m x ${roomWidthM}m` : `${formworkCalc.totalShutteringAreaM2.toFixed(1)} m²`, unit: 'metric' },
        { name: 'Mortar / Mix Specification', symbol: 'Mix', value: activeTab === 'brickwork' ? mortarRatio : activeTab === 'plaster-paint' ? plasterRatio : activeTab === 'flooring-tiles' ? bedRatio : 'Plywood + Steel Props', unit: 'ratio' },
      ],
      outputs: [
        { name: 'Net Finished Area / Volume', symbol: 'Net_qty', value: activeTab === 'brickwork' ? `${brickCalc.netVolumeM3.toFixed(2)} m³ (${brickCalc.netWallAreaM2.toFixed(1)} m²)` : activeTab === 'plaster-paint' ? `${plasterAreaM2} m²` : activeTab === 'flooring-tiles' ? `${tileCalc.totalTileAreaM2.toFixed(2)} m²` : `${formworkCalc.totalShutteringAreaM2.toFixed(1)} m²`, unit: 'vol/area', status: 'PASS' as const },
        { name: 'Primary Unit Count', symbol: 'N_primary', value: activeTab === 'brickwork' ? `${brickCalc.totalBricksCount} Bricks` : activeTab === 'plaster-paint' ? `${plasterCalc.paintLiters.toFixed(1)} L Paint` : activeTab === 'flooring-tiles' ? `${tileCalc.grossTileCount} Tiles (${tileCalc.boxesRequired} Boxes)` : `${formworkCalc.propsCount} Props`, unit: 'units', status: 'PASS' as const },
        { name: 'Cement Requirement', symbol: 'Cement', value: activeTab === 'brickwork' ? `${Math.ceil(brickCalc.cementBags)} Bags` : activeTab === 'plaster-paint' ? `${Math.ceil(plasterCalc.cementBags)} Bags` : activeTab === 'flooring-tiles' ? `${Math.ceil(tileCalc.cementBedBags)} Bags` : 'N/A', unit: 'bags', status: 'PASS' as const },
        { name: 'Sand Requirement', symbol: 'Sand', value: activeTab === 'brickwork' ? `${brickCalc.sandCFT.toFixed(1)} CFT` : activeTab === 'plaster-paint' ? `${plasterCalc.sandCFT.toFixed(1)} CFT` : activeTab === 'flooring-tiles' ? `${tileCalc.sandBedCFT.toFixed(1)} CFT` : 'N/A', unit: 'CFT', status: 'PASS' as const },
      ],
      governingAssumptions: [
        'Dry volume of mortar computed with 1.33 expansion multiplier for sand-cement dry density.',
        'Deductions applied strictly according to standard IS 1200 / BNBC opening measurement rules.',
        'Labor productivity based on standard CPWD/PWD output norms for skilled masons and helpers.',
        'Wastage allowances customizable between 3% and 10% to reflect actual site transit and cut-piece losses.',
      ],
    };

    await generateEngineeringPDF(pdfData, {
      filename: `PB_CivilLab_Takeoff_${activeTab}_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
                Construction &amp; BOQ Suite
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                Construction Material Takeoff &amp; Labor Estimator
              </h2>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
              Brickwork · Plastering &amp; Painting · Tiles &amp; Flooring · Shuttering &amp; Labor Man-Days
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              <span>Certified PDF</span>
            </button>
          </div>
        </div>

        {/* Trade Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto">
          {[
            { id: 'brickwork', label: 'Brick Masonry', icon: Box },
            { id: 'plaster-paint', label: 'Plastering & Paint', icon: Paintbrush },
            { id: 'flooring-tiles', label: 'Tiles & Flooring', icon: Grid },
            { id: 'formwork-labor', label: 'Formwork & Labor', icon: Hammer },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TakeoffSubTab)}
                className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
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
          TAB 1: BRICKWORK ESTIMATOR
          ===================================================================== */}
      {activeTab === 'brickwork' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Box className="w-4 h-4" />
                <span>Wall Dimensions &amp; Thickness</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Wall Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={wallLengthM}
                    onChange={(e) => setWallLengthM(Math.max(0.5, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Wall Height (m)
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    value={wallHeightM}
                    onChange={(e) => setWallHeightM(Math.max(0.5, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              {/* Thickness Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Wall Thickness
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '125mm', label: '5" (125mm)', sub: 'Partition' },
                    { id: '250mm', label: '10" (250mm)', sub: 'Load-bearing' },
                    { id: 'custom', label: 'Custom', sub: 'Variable' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWallThicknessType(item.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                        wallThicknessType === item.id
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                      }`}
                    >
                      <div>{item.label}</div>
                      <div className="text-[10px] opacity-75 font-normal">{item.sub}</div>
                    </button>
                  ))}
                </div>
                {wallThicknessType === 'custom' && (
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="number"
                      step="25"
                      value={customThicknessMm}
                      onChange={(e) => setCustomThicknessMm(Math.max(75, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                      placeholder="Thickness in mm"
                    />
                    <span className="text-xs font-mono text-slate-500">mm</span>
                  </div>
                )}
              </div>

              {/* Mortar Mix & Standard */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Mortar Mix Ratio
                  </label>
                  <select
                    value={mortarRatio}
                    onChange={(e) => setMortarRatio(e.target.value as any)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="1:4">1:4 (Rich mortar)</option>
                    <option value="1:5">1:5 (Standard)</option>
                    <option value="1:6">1:6 (Partition wall)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Brick Standard
                  </label>
                  <select
                    value={brickStandard}
                    onChange={(e) => setBrickStandard(e.target.value as any)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="traditional">Traditional (9.5"×4.5"×2.75")</option>
                    <option value="modular">Modular Metric (190×90×90)</option>
                  </select>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="space-y-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                    Openings &amp; Deductions ({openings.length})
                  </span>
                  <button
                    type="button"
                    onClick={addOpening}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Door/Window</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {openings.map((op) => (
                    <div
                      key={op.id}
                      className="p-2.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={op.name}
                        onChange={(e) => updateOpening(op.id, 'name', e.target.value)}
                        className="flex-1 font-medium bg-transparent border-none text-[var(--md-sys-color-on-surface)] focus:outline-none"
                      />
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <input
                          type="number"
                          step="0.1"
                          value={op.widthM}
                          onChange={(e) => updateOpening(op.id, 'widthM', Number(e.target.value))}
                          className="w-12 px-1 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                          placeholder="W(m)"
                        />
                        <span>×</span>
                        <input
                          type="number"
                          step="0.1"
                          value={op.heightM}
                          onChange={(e) => updateOpening(op.id, 'heightM', Number(e.target.value))}
                          className="w-12 px-1 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                          placeholder="H(m)"
                        />
                        <span>×</span>
                        <input
                          type="number"
                          value={op.quantity}
                          onChange={(e) => updateOpening(op.id, 'quantity', Number(e.target.value))}
                          className="w-10 px-1 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                          placeholder="Qty"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOpening(op.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                        title="Delete Opening"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 block">Total Bricks</span>
                <div className="text-2xl font-black font-mono text-amber-900 dark:text-amber-100 mt-0.5">
                  {brickCalc.totalBricksCount.toLocaleString()} <span className="text-xs font-normal">nos</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Includes {brickWastagePercent}% site wastage
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[11px] font-mono text-sky-700 dark:text-sky-400 block">Portland Cement</span>
                <div className="text-2xl font-black font-mono text-sky-900 dark:text-sky-100 mt-0.5">
                  {Math.ceil(brickCalc.cementBags)} <span className="text-xs font-normal">Bags</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Exact: {brickCalc.cementBags.toFixed(1)} bags (50kg)
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 block">Coarse Sand</span>
                <div className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-100 mt-0.5">
                  {brickCalc.sandCFT.toFixed(1)} <span className="text-xs font-normal">CFT</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Vol: {brickCalc.sandVolM3.toFixed(2)} m³
                </span>
              </div>
            </div>

            {/* Step-by-Step Mathematical Decomposition */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Dry-Volume Engineering Derivation Breakdown</span>
              </h4>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                  <span className="text-slate-500">Gross Wall Dimensions:</span>
                  <strong>{wallLengthM}m × {wallHeightM}m = {brickCalc.grossWallAreaM2.toFixed(1)} m² ({brickCalc.grossVolumeM3.toFixed(2)} m³)</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                  <span className="text-slate-500">Total Openings Deducted:</span>
                  <strong className="text-rose-500">-{brickCalc.totalDeductionsAreaM2.toFixed(2)} m² (-{brickCalc.totalDeductionsVolumeM3.toFixed(2)} m³)</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                  <span className="text-slate-500">Net Brickwork Masonry Volume:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{brickCalc.netVolumeM3.toFixed(2)} m³ ({brickCalc.netWallAreaM2.toFixed(1)} m²)</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                  <span className="text-slate-500">Wet Mortar Volume (Voids):</span>
                  <strong>{brickCalc.wetMortarM3.toFixed(3)} m³ (~{( (brickCalc.wetMortarM3 / brickCalc.netVolumeM3) * 100 ).toFixed(1)}% of brickwork)</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                  <span className="text-slate-500">Dry Mortar Volume (×1.33 Bulking):</span>
                  <strong className="text-amber-600">{brickCalc.dryMortarM3.toFixed(3)} m³ (Dry factor 1.33 + {mortarWastagePercent}% waste)</strong>
                </div>
              </div>
            </div>

            {/* Approximate Bill of Quantities Cost Matrix */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Cost Matrix &amp; Procurement Takeoff</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Total: {brickCalc.totalMaterialCost.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                  <span className="text-slate-500 block text-[10px]">Bricks Cost</span>
                  <strong className="text-[var(--md-sys-color-on-surface)]">{brickCalc.brickCost.toLocaleString()}</strong>
                </div>
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                  <span className="text-slate-500 block text-[10px]">Cement Cost</span>
                  <strong className="text-[var(--md-sys-color-on-surface)]">{brickCalc.cementCost.toLocaleString()}</strong>
                </div>
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                  <span className="text-slate-500 block text-[10px]">Sand Cost</span>
                  <strong className="text-[var(--md-sys-color-on-surface)]">{brickCalc.sandCost.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: PLASTERING & PAINTING ESTIMATOR
          ===================================================================== */}
      {activeTab === 'plaster-paint' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <Paintbrush className="w-4 h-4" />
                <span>Surface Area &amp; Plaster Specs</span>
              </h3>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-[var(--md-sys-color-on-surface)]">
                    Net Plaster Surface Area
                  </label>
                  <span className="font-mono text-slate-500">{(plasterAreaM2 * 10.7639).toFixed(0)} sq.ft</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={plasterAreaM2}
                    onChange={(e) => setPlasterAreaM2(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-xs font-mono text-slate-500">m²</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Plaster Thickness
                  </label>
                  <select
                    value={plasterThicknessMm}
                    onChange={(e) => setPlasterThicknessMm(Number(e.target.value))}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value={12}>12 mm (Internal Smooth)</option>
                    <option value={15}>15 mm (Masonry Rough)</option>
                    <option value={20}>20 mm (External 2-Coat)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Mortar Mix Ratio
                  </label>
                  <select
                    value={plasterRatio}
                    onChange={(e) => setPlasterRatio(e.target.value as any)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="1:3">1:3 (Ceiling / External)</option>
                    <option value="1:4">1:4 (Standard Internal)</option>
                    <option value="1:5">1:5 (Light Duty)</option>
                    <option value="1:6">1:6 (Partition Wall)</option>
                  </select>
                </div>
              </div>

              {/* Painting & Finishes Add-ons */}
              <div className="space-y-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                  Finishes &amp; Painting Setup
                </span>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePrimer}
                      onChange={(e) => setIncludePrimer(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                    <span className="text-[var(--md-sys-color-on-surface)]">Apply 1 Coat Water Primer (12 m²/L)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePutty}
                      onChange={(e) => setIncludePutty(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                    <span className="text-[var(--md-sys-color-on-surface)]">Apply 2 Coats Wall Putty (2.2 kg/m²)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePaint}
                      onChange={(e) => setIncludePaint(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                    <span className="text-[var(--md-sys-color-on-surface)]">Apply Finished Paint (Emulsion / Acrylic)</span>
                  </label>
                </div>

                {includePaint && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Number of Paint Coats
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNumPaintCoats(c)}
                          className={`py-1.5 text-xs font-mono rounded-lg border transition-all ${
                            numPaintCoats === c
                              ? 'bg-sky-500 text-white border-sky-500 font-bold'
                              : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                          }`}
                        >
                          {c} {c === 1 ? 'Coat' : 'Coats'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[11px] font-mono text-sky-700 dark:text-sky-300 block">Cement Bags</span>
                <div className="text-xl font-bold font-mono text-sky-900 dark:text-sky-100 mt-0.5">
                  {Math.ceil(plasterCalc.cementBags)} <span className="text-xs font-normal">Bags</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Exact: {plasterCalc.cementBags.toFixed(1)}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 block">Plaster Sand</span>
                <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-100 mt-0.5">
                  {plasterCalc.sandCFT.toFixed(1)} <span className="text-xs font-normal">CFT</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">{plasterCalc.sandM3.toFixed(2)} m³</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300 block">Wall Putty</span>
                <div className="text-xl font-bold font-mono text-teal-900 dark:text-teal-100 mt-0.5">
                  {plasterCalc.puttyKg.toFixed(0)} <span className="text-xs font-normal">kg</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">~{plasterCalc.puttyBags20kg} bags (20kg)</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 block">Finished Paint</span>
                <div className="text-xl font-bold font-mono text-indigo-900 dark:text-indigo-100 mt-0.5">
                  {plasterCalc.paintLiters.toFixed(1)} <span className="text-xs font-normal">L</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">{plasterCalc.paintGallons.toFixed(1)} Gal</span>
              </div>
            </div>

            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                Plastering &amp; Paint Materials Procurement Schedule
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Plaster Wet Volume:</span>
                  <strong>{plasterCalc.wetVolM3.toFixed(3)} m³ ({plasterAreaM2} m² @ {plasterThicknessMm}mm)</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Plaster Dry Mortar Volume:</span>
                  <strong>{plasterCalc.dryMortarM3.toFixed(3)} m³ (1.60x factor for joints &amp; dry expansion)</strong>
                </div>
                {includePrimer && (
                  <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                    <span>Wall Primer Required:</span>
                    <strong>{plasterCalc.primerLiters.toFixed(1)} Liters (1 Coat)</strong>
                  </div>
                )}
                {includePutty && (
                  <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                    <span>Wall Putty Powder:</span>
                    <strong>{plasterCalc.puttyKg.toFixed(1)} kg ({plasterCalc.puttyBags20kg} bags)</strong>
                  </div>
                )}
                {includePaint && (
                  <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                    <span>Paint Required ({numPaintCoats} Coats):</span>
                    <strong>{plasterCalc.paintLiters.toFixed(1)} Liters ({plasterCalc.paintGallons.toFixed(2)} US Gallons)</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: FLOORING & TILES ESTIMATOR
          ===================================================================== */}
      {activeTab === 'flooring-tiles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <Grid className="w-4 h-4" />
                <span>Room Dimensions &amp; Tile Geometry</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Room Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={roomLengthM}
                    onChange={(e) => setRoomLengthM(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Room Width (m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={roomWidthM}
                    onChange={(e) => setRoomWidthM(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              {/* Tile Size Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Tile Size (mm)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: 300, w: 300, label: '300×300 (12"×12")' },
                    { l: 600, w: 600, label: '600×600 (24"×24")' },
                    { l: 600, w: 1200, label: '600×1200 (Slab)' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setTileLengthMm(preset.l);
                        setTileWidthMm(preset.w);
                      }}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all ${
                        tileLengthMm === preset.l && tileWidthMm === preset.w
                          ? 'bg-teal-600 text-white font-bold'
                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skirting & Wastage */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Skirting Height (mm)
                  </label>
                  <input
                    type="number"
                    step="25"
                    value={skirtingHeightMm}
                    onChange={(e) => setSkirtingHeightMm(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Tile Wastage (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={tileWastagePercent}
                    onChange={(e) => setTileWastagePercent(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              {/* Bed Mortar */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Mortar Bed Thickness (mm)
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={bedThicknessMm}
                    onChange={(e) => setBedThicknessMm(Math.max(15, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Grout Joint Width (mm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={groutWidthMm}
                    onChange={(e) => setGroutWidthMm(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300 block">Total Tiles</span>
                <div className="text-xl font-bold font-mono text-teal-900 dark:text-teal-100 mt-0.5">
                  {tileCalc.grossTileCount} <span className="text-xs font-normal">pcs</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Net: {tileCalc.netTileCount} pcs</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[11px] font-mono text-sky-700 dark:text-sky-300 block">Boxes / Cartons</span>
                <div className="text-xl font-bold font-mono text-sky-900 dark:text-sky-100 mt-0.5">
                  {tileCalc.boxesRequired} <span className="text-xs font-normal">boxes</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">@ {tilesPerBox} pcs/box</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 block">Bed Cement</span>
                <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-100 mt-0.5">
                  {Math.ceil(tileCalc.cementBedBags)} <span className="text-xs font-normal">Bags</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Sand: {tileCalc.sandBedCFT.toFixed(1)} CFT</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 block">Joint Grout</span>
                <div className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-0.5">
                  {tileCalc.groutKg.toFixed(1)} <span className="text-xs font-normal">kg</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Width: {groutWidthMm}mm</span>
              </div>
            </div>

            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                Flooring Geometry &amp; Quantities Breakdown
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Net Floor Area:</span>
                  <strong>{tileCalc.floorAreaM2.toFixed(2)} m² ({(tileCalc.floorAreaM2 * 10.7639).toFixed(1)} sq.ft)</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Skirting Area ({skirtingHeightMm}mm high):</span>
                  <strong>{tileCalc.skirtingAreaM2.toFixed(2)} m²</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Gross Total Area with {tileWastagePercent}% Waste:</span>
                  <strong className="text-teal-600">{(tileCalc.totalTileAreaM2 * (1 + tileWastagePercent / 100)).toFixed(2)} m²</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: FORMWORK & LABOR PRODUCTIVITY
          ===================================================================== */}
      {activeTab === 'formwork-labor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Hammer className="w-4 h-4" />
                <span>Structural Member Quantities</span>
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Structural Scope
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {['combined', 'slab', 'beam', 'column'].map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setFormElementType(sc as any)}
                      className={`py-1.5 capitalize rounded-lg text-xs font-semibold ${
                        formElementType === sc
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

              {(formElementType === 'combined' || formElementType === 'slab') && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Slab Soffit Area (m²)
                  </label>
                  <input
                    type="number"
                    value={slabSoffitAreaM2}
                    onChange={(e) => setSlabSoffitAreaM2(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              )}

              {(formElementType === 'combined' || formElementType === 'beam') && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Beam Length (m)</label>
                    <input
                      type="number"
                      value={beamLengthM}
                      onChange={(e) => setBeamLengthM(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Depth (mm)</label>
                    <input
                      type="number"
                      value={beamDepthMm}
                      onChange={(e) => setBeamDepthMm(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Width (mm)</label>
                    <input
                      type="number"
                      value={beamWidthMm}
                      onChange={(e) => setBeamWidthMm(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                    />
                  </div>
                </div>
              )}

              {(formElementType === 'combined' || formElementType === 'column') && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Columns (Nos)</label>
                    <input
                      type="number"
                      value={columnCount}
                      onChange={(e) => setColumnCount(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">B × D (mm)</label>
                    <input
                      type="number"
                      value={colSizeBMm}
                      onChange={(e) => setColSizeBMm(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Height (m)</label>
                    <input
                      type="number"
                      value={colHeightM}
                      onChange={(e) => setColHeightM(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                    />
                  </div>
                </div>
              )}

              {/* Wage Rates */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Carpenter Wage (/day)
                  </label>
                  <input
                    type="number"
                    value={masonDailyWage}
                    onChange={(e) => setMasonDailyWage(Math.max(100, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Helper Wage (/day)
                  </label>
                  <input
                    type="number"
                    value={helperDailyWage}
                    onChange={(e) => setHelperDailyWage(Math.max(100, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 block">Total Shuttering</span>
                <div className="text-xl font-bold font-mono text-indigo-900 dark:text-indigo-100 mt-0.5">
                  {formworkCalc.totalShutteringAreaM2.toFixed(1)} <span className="text-xs font-normal">m²</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ~{formworkCalc.totalShutteringAreaSqft.toFixed(0)} sq.ft
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 block">Props / Jacks</span>
                <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-100 mt-0.5">
                  {formworkCalc.propsCount} <span className="text-xs font-normal">nos</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">@ {propsSpacingM}m spacing</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300 block">Carpenter Days</span>
                <div className="text-xl font-bold font-mono text-teal-900 dark:text-teal-100 mt-0.5">
                  {formworkCalc.carpenterManDays.toFixed(1)} <span className="text-xs font-normal">days</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  + {formworkCalc.helperManDays.toFixed(1)} helpers
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 block">Labor Cost</span>
                <div className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-0.5">
                  {formworkCalc.totalLaborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ~{formworkCalc.unitLaborCostPerM2.toFixed(0)} / m²
                </span>
              </div>
            </div>

            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                Formwork Contact Area Allocation
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Slab Soffit Formwork:</span>
                  <strong>{formworkCalc.slabShutterArea.toFixed(1)} m²</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Beam Sides &amp; Soffit:</span>
                  <strong>{formworkCalc.beamShutterArea.toFixed(1)} m²</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Column Vertical Faces:</span>
                  <strong>{formworkCalc.colShutterArea.toFixed(1)} m²</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Shutter Release Oil Required:</span>
                  <strong>{formworkCalc.shutterOilLiters.toFixed(1)} Liters</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
