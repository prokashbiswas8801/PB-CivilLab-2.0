import {
  CivilWorkspace,
  TakeoffLineItem,
} from '../types/civil';
import {
  CalculationEnvelope,
  RebarBBSResult,
  ConcreteMixResult,
  MasonryResult,
  PileCapacityResult,
} from './calculations';

export interface AutoSyncResult {
  updatedWorkspace: CivilWorkspace;
  syncedItemsCount: number;
  syncedItemDescriptions: string[];
  message: string;
}

/**
 * Synchronizes total steel reinforcement tonnage from Rebar BBS module directly into the BOQ Takeoff schedule.
 * Automatically updates existing synced line item or appends a new one, strictly preserving custom user unit rates.
 */
export function syncRebarBbsToBoq(
  workspace: CivilWorkspace,
  bbsEnvelope: CalculationEnvelope<RebarBBSResult>
): AutoSyncResult {
  const result = bbsEnvelope.result;
  if (!result || result.totalSteelWeightTon <= 0) {
    return {
      updatedWorkspace: workspace,
      syncedItemsCount: 0,
      syncedItemDescriptions: [],
      message: 'No Rebar BBS tonnage data available to synchronize.',
    };
  }

  const existingItems = [...workspace.boq.items];
  const itemDescription = 'Reinforcement Steel (Grade 60 / 500W Deformed Bars) — Auto-Synced from BBS';
  const qtyTons = Number(result.totalSteelWeightTon.toFixed(3));

  const existingIndex = existingItems.findIndex(
    (item) => item.description.includes('Reinforcement Steel') && item.category === 'rebar'
  );

  let updatedItems: TakeoffLineItem[];
  if (existingIndex >= 0) {
    const existing = existingItems[existingIndex];
    updatedItems = existingItems.map((item, idx) =>
      idx === existingIndex
        ? {
            ...item,
            description: itemDescription,
            unit: 'ton',
            numberOfMembers: 1,
            lengthM: qtyTons,
            widthM: 1,
            heightM: 1,
            deductionQty: 0,
            wastagePercent: 3.0,
          }
        : item
    );
  } else {
    const newItem: TakeoffLineItem = {
      id: `sync-rebar-${Date.now()}`,
      itemNo: `RB-${existingItems.length + 1}`,
      description: itemDescription,
      category: 'rebar',
      numberOfMembers: 1,
      lengthM: qtyTons,
      widthM: 1,
      heightM: 1,
      deductionQty: 0,
      unit: 'ton',
      wastagePercent: 3.0,
      unitRate: 108000, // Standard default per ton (108 BDT/kg)
    };
    updatedItems = [...existingItems, newItem];
  }

  const updatedWorkspace: CivilWorkspace = {
    ...workspace,
    boq: {
      ...workspace.boq,
      items: updatedItems,
    },
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedWorkspace,
    syncedItemsCount: 1,
    syncedItemDescriptions: [`Reinforcement Steel: ${qtyTons} Tonnes`],
    message: `Successfully synchronized ${qtyTons} Tonnes of Reinforcement Steel into BOQ Takeoff Schedule.`,
  };
}

/**
 * Synchronizes concrete mix batch volumes (wet concrete, cement bags, sand, and stone aggregates)
 * directly into the BOQ Estimator takeoff schedule.
 */
export function syncConcreteMixToBoq(
  workspace: CivilWorkspace,
  mixEnvelope: CalculationEnvelope<ConcreteMixResult>
): AutoSyncResult {
  const result = mixEnvelope.result;
  if (!result || result.batchVolumeM3 <= 0) {
    return {
      updatedWorkspace: workspace,
      syncedItemsCount: 0,
      syncedItemDescriptions: [],
      message: 'No Concrete Mix volumetric data available to synchronize.',
    };
  }

  const vol = Number(result.batchVolumeM3.toFixed(2));
  const cementBags = Math.ceil(result.cementBags50Kg || result.cementBags);
  const sandM3 = Number(result.fineAggM3.toFixed(2));
  const stoneM3 = Number(result.coarseAggM3.toFixed(2));
  const admixKg = Number((result.batchAdmixtureKg || 0).toFixed(1));
  const targetMpa = result.estimated28DayMpa.toFixed(0);

  const existingItems = [...workspace.boq.items];
  const syncedDescriptions: string[] = [];

  const syncEntries: {
    key: string;
    description: string;
    category: 'superstructure' | 'substructure';
    unit: 'm3' | 'bags' | 'kg';
    qty: number;
    defaultRate: number;
  }[] = [
    {
      key: 'rcc-concrete',
      description: `Cast-in-Situ RCC Concrete (f'c = ${targetMpa} MPa) — Auto-Synced from Mix Design`,
      category: 'superstructure',
      unit: 'm3',
      qty: vol,
      defaultRate: 9800,
    },
    {
      key: 'portland-cement',
      description: `Portland Composite / Ordinary Cement (50kg Bags) — Auto-Synced from Mix Design`,
      category: 'substructure',
      unit: 'bags',
      qty: cementBags,
      defaultRate: 560,
    },
    {
      key: 'coarse-sand',
      description: `Coarse Sand / Fine Aggregate (FM 2.7) — Auto-Synced from Mix Design`,
      category: 'substructure',
      unit: 'm3',
      qty: sandM3,
      defaultRate: 1800,
    },
    {
      key: 'crushed-stone',
      description: `Crushed Stone Coarse Aggregates (20mm down) — Auto-Synced from Mix Design`,
      category: 'substructure',
      unit: 'm3',
      qty: stoneM3,
      defaultRate: 6200,
    },
  ];

  if (admixKg > 0) {
    syncEntries.push({
      key: 'chemical-admixture',
      description: `Chemical Water-Reducing Admixture (Superplasticizer) — Auto-Synced from Mix Design`,
      category: 'substructure',
      unit: 'kg',
      qty: admixKg,
      defaultRate: 250,
    });
  }

  let currentItems = [...existingItems];

  for (const entry of syncEntries) {
    const existingIndex = currentItems.findIndex((it) => it.description.includes(entry.key) || it.description === entry.description);
    if (existingIndex >= 0) {
      currentItems = currentItems.map((it, idx) =>
        idx === existingIndex
          ? {
              ...it,
              description: entry.description,
              unit: entry.unit,
              numberOfMembers: 1,
              lengthM: entry.qty,
              widthM: 1,
              heightM: 1,
              deductionQty: 0,
              // Strictly preserve custom user rate if already entered, otherwise fallback to default
              unitRate: it.unitRate > 0 ? it.unitRate : entry.defaultRate,
            }
          : it
      );
    } else {
      const newItem: TakeoffLineItem = {
        id: `sync-mix-${entry.key}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemNo: `MX-${currentItems.length + 1}`,
        description: entry.description,
        category: entry.category,
        numberOfMembers: 1,
        lengthM: entry.qty,
        widthM: 1,
        heightM: 1,
        deductionQty: 0,
        unit: entry.unit,
        wastagePercent: 3.0,
        unitRate: entry.defaultRate,
      };
      currentItems.push(newItem);
    }
    syncedDescriptions.push(`${entry.description}: ${entry.qty} ${entry.unit}`);
  }

  const updatedWorkspace: CivilWorkspace = {
    ...workspace,
    boq: {
      ...workspace.boq,
      items: currentItems,
    },
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedWorkspace,
    syncedItemsCount: syncEntries.length,
    syncedItemDescriptions: syncedDescriptions,
    message: `Successfully synchronized ${syncEntries.length} Concrete Material items (${vol} m³ concrete, ${cementBags} cement bags, ${sandM3} m³ sand, ${stoneM3} m³ stone) into BOQ Takeoff Schedule.`,
  };
}

/**
 * Synchronizes brickwork, wall plastering, and floor finishes from Masonry & Finishes module
 * directly into the BOQ Estimator takeoff schedule.
 */
export function syncMasonryToBoq(
  workspace: CivilWorkspace,
  masonryEnvelope: CalculationEnvelope<MasonryResult>
): AutoSyncResult {
  const result = masonryEnvelope.result;
  if (!result || (result.netWallVolumeM3 <= 0 && result.floorAreaM2 <= 0 && result.plasterAreaM2 <= 0)) {
    return {
      updatedWorkspace: workspace,
      syncedItemsCount: 0,
      syncedItemDescriptions: [],
      message: 'No Masonry & Finishes volumetric data available to synchronize.',
    };
  }

  const existingItems = [...workspace.boq.items];
  const syncedDescriptions: string[] = [];

  const syncEntries: {
    key: string;
    description: string;
    category: 'masonry' | 'finishing';
    unit: 'm3' | 'm2';
    qty: number;
    defaultRate: number;
  }[] = [];

  if (result.netWallVolumeM3 > 0) {
    syncEntries.push({
      key: 'brick-masonry',
      description: `First Class Brickwork in 1:6 Cement-Sand Mortar (Net Vol: ${result.netWallVolumeM3.toFixed(2)} m³, ${result.bricksWithWastageCount} Bricks) — Auto-Synced from Masonry`,
      category: 'masonry',
      unit: 'm3',
      qty: Number(result.netWallVolumeM3.toFixed(2)),
      defaultRate: 7200,
    });
  }

  if (result.plasterAreaM2 > 0) {
    syncEntries.push({
      key: 'wall-plaster',
      description: `12mm / 15mm Cement Sand Plaster (1:4) to Wall Surfaces — Auto-Synced from Masonry`,
      category: 'finishing',
      unit: 'm2',
      qty: Number(result.plasterAreaM2.toFixed(2)),
      defaultRate: 210,
    });
  }

  if (result.floorAreaM2 > 0) {
    syncEntries.push({
      key: 'floor-tiles',
      description: `Homogeneous Floor Tiles with Neat Cement Grouting (${result.tilesWithWastageCount} Tiles) — Auto-Synced from Finishes`,
      category: 'finishing',
      unit: 'm2',
      qty: Number(result.floorAreaM2.toFixed(2)),
      defaultRate: 1850,
    });
  }

  // Paint & Wall Putty Schedule
  if (result.paintPuttySchedule && result.paintPuttySchedule.finishingSurfaceAreaM2 > 0) {
    const p = result.paintPuttySchedule;
    syncEntries.push({
      key: 'wall-putty',
      description: `Interior/Exterior Wall Putty Application (${p.puttyCoats} Coats, ${p.puttyKgRequired} kg / ${p.puttyBags20Kg} Bags) — Auto-Synced from Finishes`,
      category: 'finishing',
      unit: 'm2',
      qty: Number(p.finishingSurfaceAreaM2.toFixed(2)),
      defaultRate: 85,
    });
    syncEntries.push({
      key: 'paint-finish',
      description: `Weather-Shield / Plastic Emulsion Paint (${p.paintCoats} Coats, ${p.paintLitersRequired} Liters / ${p.paintGallons} Gal) — Auto-Synced from Finishes`,
      category: 'finishing',
      unit: 'm2',
      qty: Number(p.finishingSurfaceAreaM2.toFixed(2)),
      defaultRate: 145,
    });
  }

  // MS Window/Veranda Grill Schedule
  if (result.grillThaiSchedule && result.grillThaiSchedule.totalGrillWeightKg > 0) {
    const g = result.grillThaiSchedule;
    syncEntries.push({
      key: 'ms-grill',
      description: `MS Window & Veranda Protective Grills (${g.totalGrillAreaSft} SFT, ${g.totalGrillWeightMaund} Maund) — Auto-Synced from Finishes`,
      category: 'finishing',
      unit: 'm2',
      qty: Number((g.totalGrillAreaSft * 0.092903).toFixed(2)), // m2
      defaultRate: 1850, // per m2 (~170 BDT/sft)
    });
  }

  // Thai Aluminum Window & Door Schedule
  if (result.grillThaiSchedule && result.grillThaiSchedule.totalThaiAreaSft > 0) {
    const t = result.grillThaiSchedule;
    syncEntries.push({
      key: 'thai-aluminum',
      description: `Thai Aluminum Sliding Windows & Door Frames (${t.totalThaiAreaSft} SFT, ${t.totalThaiFrameRft} RFT frame) — Auto-Synced from Finishes`,
      category: 'finishing',
      unit: 'm2',
      qty: Number((t.totalThaiAreaSft * 0.092903).toFixed(2)), // m2
      defaultRate: 4800, // per m2 (~450 BDT/sft)
    });
  }

  let currentItems = [...existingItems];

  for (const entry of syncEntries) {
    const existingIndex = currentItems.findIndex(
      (it) => it.description.includes(entry.key) || it.description === entry.description
    );
    if (existingIndex >= 0) {
      currentItems = currentItems.map((it, idx) =>
        idx === existingIndex
          ? {
              ...it,
              description: entry.description,
              unit: entry.unit,
              numberOfMembers: 1,
              lengthM: entry.qty,
              widthM: 1,
              heightM: 1,
              deductionQty: 0,
              unitRate: it.unitRate > 0 ? it.unitRate : entry.defaultRate,
            }
          : it
      );
    } else {
      const newItem: TakeoffLineItem = {
        id: `sync-masonry-${entry.key}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemNo: `MS-${currentItems.length + 1}`,
        description: entry.description,
        category: entry.category,
        numberOfMembers: 1,
        lengthM: entry.qty,
        widthM: 1,
        heightM: 1,
        deductionQty: 0,
        unit: entry.unit,
        wastagePercent: 3.0,
        unitRate: entry.defaultRate,
      };
      currentItems.push(newItem);
    }
    syncedDescriptions.push(`${entry.description}: ${entry.qty} ${entry.unit}`);
  }

  const updatedWorkspace: CivilWorkspace = {
    ...workspace,
    boq: {
      ...workspace.boq,
      items: currentItems,
    },
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedWorkspace,
    syncedItemsCount: syncEntries.length,
    syncedItemDescriptions: syncedDescriptions,
    message: `Successfully synchronized ${syncEntries.length} Masonry & Finish items into BOQ Takeoff Schedule.`,
  };
}

/**
 * Synchronizes Deep Pile Foundation concrete casting and boring quantities
 * directly into the BOQ Estimator substructure schedule.
 */
export function syncPileCapacityToBoq(
  workspace: CivilWorkspace,
  pileEnvelope: CalculationEnvelope<PileCapacityResult>
): AutoSyncResult {
  const result = pileEnvelope.result;
  if (!result || result.diameterM <= 0 || result.lengthM <= 0) {
    return {
      updatedWorkspace: workspace,
      syncedItemsCount: 0,
      syncedItemDescriptions: [],
      message: 'No Pile Capacity geometric data available to synchronize.',
    };
  }

  const totalPiles = result.pileGroupSummary?.totalPiles || 1;
  const pileVol = Number((result.crossSectionAreaM2 * result.lengthM * totalPiles).toFixed(2));
  const drillingM = Number((result.lengthM * totalPiles).toFixed(1));
  const diaMm = Math.round(result.diameterM * 1000);

  const existingItems = [...workspace.boq.items];
  const syncedDescriptions: string[] = [];

  const syncEntries: {
    key: string;
    description: string;
    category: 'substructure';
    unit: 'm3' | 'm';
    qty: number;
    defaultRate: number;
  }[] = [
    {
      key: 'pile-casting',
      description: `Cast-in-Situ RCC Bored Piles (${diaMm}mm Ø, ${totalPiles} Nos × ${result.lengthM}m Depth) — Auto-Synced from Pile Capacity`,
      category: 'substructure',
      unit: 'm3',
      qty: pileVol,
      defaultRate: 11500,
    },
    {
      key: 'pile-boring',
      description: `Boring / Drilling & Installation of Bored Piles (${diaMm}mm Ø) — Auto-Synced from Pile Capacity`,
      category: 'substructure',
      unit: 'm',
      qty: drillingM,
      defaultRate: 1800,
    },
  ];

  let currentItems = [...existingItems];

  for (const entry of syncEntries) {
    const existingIndex = currentItems.findIndex(
      (it) => it.description.includes(entry.key) || it.description === entry.description
    );
    if (existingIndex >= 0) {
      currentItems = currentItems.map((it, idx) =>
        idx === existingIndex
          ? {
              ...it,
              description: entry.description,
              unit: entry.unit,
              numberOfMembers: 1,
              lengthM: entry.qty,
              widthM: 1,
              heightM: 1,
              deductionQty: 0,
              unitRate: it.unitRate > 0 ? it.unitRate : entry.defaultRate,
            }
          : it
      );
    } else {
      const newItem: TakeoffLineItem = {
        id: `sync-pile-${entry.key}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemNo: `PL-${currentItems.length + 1}`,
        description: entry.description,
        category: entry.category,
        numberOfMembers: 1,
        lengthM: entry.qty,
        widthM: 1,
        heightM: 1,
        deductionQty: 0,
        unit: entry.unit,
        wastagePercent: 3.0,
        unitRate: entry.defaultRate,
      };
      currentItems.push(newItem);
    }
    syncedDescriptions.push(`${entry.description}: ${entry.qty} ${entry.unit}`);
  }

  const updatedWorkspace: CivilWorkspace = {
    ...workspace,
    boq: {
      ...workspace.boq,
      items: currentItems,
    },
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedWorkspace,
    syncedItemsCount: syncEntries.length,
    syncedItemDescriptions: syncedDescriptions,
    message: `Successfully synchronized ${syncEntries.length} Deep Foundation items (${totalPiles} Piles, ${pileVol} m³ concrete, ${drillingM}m drilling) into BOQ Substructure Schedule.`,
  };
}

import { resolveDynamicRate } from './rateResolver';
import {
  computeConcreteMaterials,
  computeMasonryFinishes,
  computeRebarBBS,
  computeEarthwork,
} from './calculations';
import { InventoryItem, SiteManagementData } from '../types/siteManagement';

/**
 * Synchronizes surveying land area / earthwork directly into the BOQ Estimator
 * using exact physical layout dimensions and dynamically resolved PWD/Schedule rates.
 */
export function syncSurveyingEarthworkToBoq(
  workspace: CivilWorkspace,
  params: {
    landAreaSqM?: number;
    excavationVolumeM3?: number;
    description?: string;
    formationRL?: number;
  }
): AutoSyncResult {
  const { landAreaSqM = 0, excavationVolumeM3 = 0, description, formationRL } = params;
  if (landAreaSqM <= 0 && excavationVolumeM3 <= 0) {
    return {
      updatedWorkspace: workspace,
      syncedItemsCount: 0,
      syncedItemDescriptions: [],
      message: 'No Surveying land area or earthwork volume available to synchronize.',
    };
  }

  const existingItems = [...workspace.boq.items];
  const syncedDescriptions: string[] = [];

  // Derive real spatial dimensions: bounding side L x W
  const sideM = landAreaSqM > 0 ? Number(Math.sqrt(landAreaSqM).toFixed(2)) : 10;
  const clearingRate = resolveDynamicRate(workspace, 'site-clearing', { fallbackRate: 45 });
  const earthworkRate = resolveDynamicRate(workspace, 'earthwork', { fallbackRate: 245 });

  // Average excavation depth from grid leveling RLs
  const avgDepthM =
    landAreaSqM > 0 && excavationVolumeM3 > 0
      ? Number((excavationVolumeM3 / landAreaSqM).toFixed(3))
      : 0.45;

  const syncEntries: {
    key: string;
    description: string;
    category: 'substructure';
    unit: 'm3' | 'm2';
    lengthM: number;
    widthM: number;
    heightM: number;
    numberOfMembers: number;
    rate: number;
  }[] = [];

  if (landAreaSqM > 0) {
    syncEntries.push({
      key: 'site-clearing',
      description:
        description ||
        `Site Clearing, Grubbing & Topsoil Stripping (${landAreaSqM.toFixed(1)} m² plot, ${sideM}m × ${sideM}m) — Surveying Suite Sync`,
      category: 'substructure',
      unit: 'm2',
      lengthM: sideM,
      widthM: sideM,
      heightM: 1,
      numberOfMembers: 1,
      rate: clearingRate,
    });
  }

  if (excavationVolumeM3 > 0) {
    const formationNote = formationRL ? ` at Formation RL ${formationRL.toFixed(3)}m` : '';
    syncEntries.push({
      key: 'leveling-cut-fill',
      description: `Site Grading & Profile Earthwork Cut/Fill (${excavationVolumeM3.toFixed(1)} m³${formationNote}, avg depth ${avgDepthM}m) — Surveying Leveling Grid Sync`,
      category: 'substructure',
      unit: 'm3',
      lengthM: sideM,
      widthM: sideM,
      heightM: avgDepthM,
      numberOfMembers: 1,
      rate: earthworkRate,
    });
  }

  let currentItems = [...existingItems];

  for (const entry of syncEntries) {
    const existingIndex = currentItems.findIndex(
      (it) => it.description.includes(entry.key) || it.description === entry.description
    );
    if (existingIndex >= 0) {
      currentItems = currentItems.map((it, idx) =>
        idx === existingIndex
          ? {
              ...it,
              description: entry.description,
              unit: entry.unit,
              numberOfMembers: entry.numberOfMembers,
              lengthM: entry.lengthM,
              widthM: entry.widthM,
              heightM: entry.heightM,
              deductionQty: 0,
              unitRate: it.unitRate > 0 ? it.unitRate : entry.rate,
            }
          : it
      );
    } else {
      const newItem: TakeoffLineItem = {
        id: `sync-surv-${entry.key}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemNo: `SV-${currentItems.length + 1}`,
        description: entry.description,
        category: entry.category,
        numberOfMembers: entry.numberOfMembers,
        lengthM: entry.lengthM,
        widthM: entry.widthM,
        heightM: entry.heightM,
        deductionQty: 0,
        unit: entry.unit,
        wastagePercent: 0,
        unitRate: entry.rate,
      };
      currentItems.push(newItem);
    }
    const computedVol = entry.unit === 'm3' ? (entry.lengthM * entry.widthM * entry.heightM) : (entry.lengthM * entry.widthM);
    syncedDescriptions.push(`${entry.description}: ${computedVol.toFixed(1)} ${entry.unit} @ ${entry.rate} BDT`);
  }

  const updatedWorkspace: CivilWorkspace = {
    ...workspace,
    boq: {
      ...workspace.boq,
      items: currentItems,
    },
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedWorkspace,
    syncedItemsCount: syncEntries.length,
    syncedItemDescriptions: syncedDescriptions,
    message: `Successfully synchronized ${syncEntries.length} Surveying items with real physical geometry into BOQ Substructure Schedule.`,
  };
}

/**
 * Universal one-click multi-module synchronization directly into the BOQ Estimator takeoff schedule.
 */
export function syncAllModulesToBoq(
  workspace: CivilWorkspace,
  bbsEnvelope?: CalculationEnvelope<RebarBBSResult>,
  mixEnvelope?: CalculationEnvelope<ConcreteMixResult>,
  masonryEnvelope?: CalculationEnvelope<MasonryResult>,
  pileEnvelope?: CalculationEnvelope<PileCapacityResult>
): AutoSyncResult {
  let ws = workspace;
  const allSyncedDescriptions: string[] = [];
  let totalCount = 0;

  if (bbsEnvelope?.result && bbsEnvelope.result.totalSteelWeightTon > 0) {
    const rebarRes = syncRebarBbsToBoq(ws, bbsEnvelope);
    ws = rebarRes.updatedWorkspace;
    totalCount += rebarRes.syncedItemsCount;
    allSyncedDescriptions.push(...rebarRes.syncedItemDescriptions);
  }

  if (mixEnvelope?.result && mixEnvelope.result.batchVolumeM3 > 0) {
    const mixRes = syncConcreteMixToBoq(ws, mixEnvelope);
    ws = mixRes.updatedWorkspace;
    totalCount += mixRes.syncedItemsCount;
    allSyncedDescriptions.push(...mixRes.syncedItemDescriptions);
  }

  if (masonryEnvelope?.result && (masonryEnvelope.result.netWallVolumeM3 > 0 || masonryEnvelope.result.floorAreaM2 > 0)) {
    const masRes = syncMasonryToBoq(ws, masonryEnvelope);
    ws = masRes.updatedWorkspace;
    totalCount += masRes.syncedItemsCount;
    allSyncedDescriptions.push(...masRes.syncedItemDescriptions);
  }

  if (pileEnvelope?.result && pileEnvelope.result.diameterM > 0 && pileEnvelope.result.lengthM > 0) {
    const pileRes = syncPileCapacityToBoq(ws, pileEnvelope);
    ws = pileRes.updatedWorkspace;
    totalCount += pileRes.syncedItemsCount;
    allSyncedDescriptions.push(...pileRes.syncedItemDescriptions);
  }

  return {
    updatedWorkspace: ws,
    syncedItemsCount: totalCount,
    syncedItemDescriptions: allSyncedDescriptions,
    message:
      totalCount > 0
        ? `Successfully synchronized ${totalCount} items from engineering modules into BOQ Takeoff Schedule.`
        : 'No valid data to synchronize from active engineering modules.',
  };
}

/* --------------------------------------------------------------------------
   SITE MANAGEMENT ERP <-> ENGINEERING DESIGN INTEGRATION PIPELINE
--------------------------------------------------------------------------- */

export interface DesignMaterialCeilings {
  cementBags: number;
  sandCft: number;
  coarseAggregateCft: number;
  bricksNos: number;
  rebarTonnes: number;
  rebarByDiaTonnes: Record<number, number>;
  totalConcreteM3: number;
  earthworkBankM3: number;
}

/**
 * Aggregates design materials across Concrete Materials, Masonry Finishes,
 * Rebar BBS, and Earthwork to establish baseline project procurement ceilings.
 */
export function extractDesignMaterialCeilings(workspace: CivilWorkspace): DesignMaterialCeilings {
  let cementBags = 0;
  let sandCft = 0;
  let coarseAggregateCft = 0;
  let bricksNos = 0;
  let rebarTonnes = 0;
  const rebarByDiaTonnes: Record<number, number> = {};
  let totalConcreteM3 = 0;
  let earthworkBankM3 = 0;

  // 1. Concrete Materials
  if (workspace.concreteMaterials) {
    const cm = computeConcreteMaterials(workspace.concreteMaterials);
    if (cm.result) {
      cementBags += cm.result.cementBags || 0;
      sandCft += cm.result.sandVolumeCft || ((cm.result.sandVolumeM3 || 0) * 35.3147);
      coarseAggregateCft += cm.result.aggregateVolumeCft || ((cm.result.aggregateVolumeM3 || 0) * 35.3147);
      totalConcreteM3 += cm.result.wetVolumeM3 || 0;
    }
  }

  // 2. Masonry & Finishes
  if (workspace.masonry) {
    const mas = computeMasonryFinishes(workspace.masonry);
    if (mas.result) {
      bricksNos += mas.result.netBricksCount || mas.result.totalBricksCount || 0;
      cementBags += (mas.result.mortarCementBags || 0) + (mas.result.plasterCementBags || 0);
      sandCft += ((mas.result.mortarSandVolumeM3 || 0) + (mas.result.plasterSandVolumeM3 || 0)) * 35.3147;
    }
  }

  // 3. Rebar BBS
  if (workspace.rebarBbs) {
    const bbs = computeRebarBBS(workspace.rebarBbs);
    if (bbs.result) {
      rebarTonnes += bbs.result.totalSteelWeightTon || ((bbs.result.totalSteelWeightKg || 0) / 1000);
      if (bbs.result.summaryByDia) {
        for (const item of bbs.result.summaryByDia) {
          rebarByDiaTonnes[item.diaMm] =
            (rebarByDiaTonnes[item.diaMm] || 0) + Number((item.totalWeightKg / 1000).toFixed(3));
        }
      }
    }
  }

  // 4. Earthwork & Alignment
  if (workspace.earthwork) {
    const ew = computeEarthwork(workspace.earthwork);
    if (ew.result) {
      earthworkBankM3 += ew.result.bankVolumeM3 || 0;
    }
  }

  // 5. Surveying Leveling cut/fill
  if (workspace.surveying?.computedExcavationVolumeM3) {
    earthworkBankM3 += workspace.surveying.computedExcavationVolumeM3;
  }

  return {
    cementBags: Math.round(cementBags),
    sandCft: Math.round(sandCft),
    coarseAggregateCft: Math.round(coarseAggregateCft),
    bricksNos: Math.round(bricksNos),
    rebarTonnes: Number(rebarTonnes.toFixed(2)),
    rebarByDiaTonnes,
    totalConcreteM3: Number(totalConcreteM3.toFixed(2)),
    earthworkBankM3: Number(earthworkBankM3.toFixed(2)),
  };
}

/**
 * 1-Click Sync of calculated design material totals into Site Store Inventory
 * as baseline project budget ceilings (theoreticalBoqQty).
 */
export function syncDesignCeilingsToInventory(
  siteData: SiteManagementData,
  ceilings: DesignMaterialCeilings,
  updateInventoryItem: (id: string, partial: Partial<InventoryItem>) => void,
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'totalInward' | 'totalOutward' | 'updatedAt'>) => InventoryItem
): { updatedCount: number; message: string } {
  let updatedCount = 0;

  const targetItems: Array<{
    nameMatch: string;
    category: string;
    unit: 'Bags' | 'CFT' | 'Nos' | 'Ton';
    qty: number;
    unitRate: number;
  }> = [
    {
      nameMatch: 'cement',
      category: 'Cement',
      unit: 'Bags',
      qty: ceilings.cementBags,
      unitRate: 580,
    },
    {
      nameMatch: 'sand',
      category: 'Aggregates',
      unit: 'CFT',
      qty: ceilings.sandCft,
      unitRate: 52,
    },
    {
      nameMatch: 'stone',
      category: 'Aggregates',
      unit: 'CFT',
      qty: ceilings.coarseAggregateCft,
      unitRate: 145,
    },
    {
      nameMatch: 'brick',
      category: 'Bricks & Masonry',
      unit: 'Nos',
      qty: ceilings.bricksNos,
      unitRate: 13.5,
    },
    {
      nameMatch: 'rebar',
      category: 'Steel',
      unit: 'Ton',
      qty: ceilings.rebarTonnes,
      unitRate: 104000,
    },
  ];

  for (const target of targetItems) {
    if (target.qty <= 0) continue;

    const existing = siteData.inventory.find(
      (inv) =>
        inv.name.toLowerCase().includes(target.nameMatch) ||
        inv.category.toLowerCase().includes(target.nameMatch)
    );

    if (existing) {
      updateInventoryItem(existing.id, {
        theoreticalBoqQty: target.qty,
      });
      updatedCount++;
    } else {
      addInventoryItem({
        name: `${target.category} (${target.unit}) - Design Baseline`,
        category: target.category,
        unit: target.unit,
        currentStock: 0,
        minThreshold: Math.round(target.qty * 0.1),
        unitRate: target.unitRate,
        theoreticalBoqQty: target.qty,
        specification: 'Derived from structural and architectural design takeoff',
      });
      updatedCount++;
    }
  }

  return {
    updatedCount,
    message: `Updated ${updatedCount} store inventory items with design budget ceilings (Cement: ${ceilings.cementBags} bags, Sand: ${ceilings.sandCft} cft, Rebar: ${ceilings.rebarTonnes} Tons, Bricks: ${ceilings.bricksNos} Nos).`,
  };
}

