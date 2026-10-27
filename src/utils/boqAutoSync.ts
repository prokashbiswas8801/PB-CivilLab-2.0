import {
  CivilWorkspace,
  TakeoffLineItem,
} from '../types/civil';
import {
  CalculationEnvelope,
  RebarBBSResult,
  ConcreteMixResult,
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
 * Universal one-click multi-module synchronization directly into the BOQ Estimator takeoff schedule.
 */
export function syncAllModulesToBoq(
  workspace: CivilWorkspace,
  bbsEnvelope: CalculationEnvelope<RebarBBSResult>,
  mixEnvelope: CalculationEnvelope<ConcreteMixResult>
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

  return {
    updatedWorkspace: ws,
    syncedItemsCount: totalCount,
    syncedItemDescriptions: allSyncedDescriptions,
    message:
      totalCount > 0
        ? `Successfully synchronized ${totalCount} items from Rebar BBS & Concrete Mix into BOQ Takeoff.`
        : 'No valid data to synchronize from Rebar BBS or Concrete Mix.',
  };
}
