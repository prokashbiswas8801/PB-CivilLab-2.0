import {
  CivilWorkspace,
  MasterMarketRates,
  RateAnalysisParameters,
  RateAnalysisWorkType,
  TakeoffLineItem,
} from '../types/civil';
import { ALL_RATE_LIBRARIES, PWD_RATES_2024 } from './costLibraries';
import { computeRateAnalysis } from './calculations';
import { EXACT_CONVERSION } from './unitConverter';
import { createDefaultMasterMarketRates } from './storage';

export type DynamicRateCategory =
  | 'concrete'
  | 'earthwork'
  | 'masonry'
  | 'rebar'
  | 'pipe'
  | 'plumbing'
  | 'plaster'
  | 'site-clearing';

export interface DynamicRateOptions {
  pipeDiaMm?: number;
  pipeMaterial?: string;
  depthM?: number;
  concreteGrade?: string;
  fallbackRate?: number;
}

export interface RateAnalysisTradePreset {
  workType: RateAnalysisWorkType;
  label: string;
  shortTag: string;
  basisVolumeM3: number;
  basisUnitLabel: 'm³' | 'm²' | 'Ton';
  rebarAllowanceKgPerM3: number;
  admixtureDoseKgPerM3: number;
  masonDaysRequired: number;
  laborerDaysRequired: number;
  barBenderDaysRequired: number;
  mixerHirePerM3: number;
  vibratorHirePerM3: number;
  shutteringScaffoldingPerM3: number;
  wastagePercent: number;
  waterElectricityPercent: number;
  codeNote: string;
}

export const RATE_ANALYSIS_TRADE_PRESETS: RateAnalysisTradePreset[] = [
  {
    workType: 'rcc-1-1.5-3',
    label: 'RCC 1:1.5:3 (Column/Beam)',
    shortTag: 'C20/M20 Frame',
    basisVolumeM3: 1.0,
    basisUnitLabel: 'm³',
    rebarAllowanceKgPerM3: 115,
    admixtureDoseKgPerM3: 1.5,
    masonDaysRequired: 0.45,
    laborerDaysRequired: 2.8,
    barBenderDaysRequired: 1.2,
    mixerHirePerM3: 320,
    vibratorHirePerM3: 95,
    shutteringScaffoldingPerM3: 1250,
    wastagePercent: 2.5,
    waterElectricityPercent: 1.5,
    codeNote: 'PWD Item 4.1 · Dry vol 1.54 · Sylhet sand + 20mm stone',
  },
  {
    workType: 'rcc-1-2-4',
    label: 'RCC 1:2:4 (Slab/Footing)',
    shortTag: 'C15/M15 Slab',
    basisVolumeM3: 1.0,
    basisUnitLabel: 'm³',
    rebarAllowanceKgPerM3: 85,
    admixtureDoseKgPerM3: 0,
    masonDaysRequired: 0.38,
    laborerDaysRequired: 2.35,
    barBenderDaysRequired: 0.9,
    mixerHirePerM3: 280,
    vibratorHirePerM3: 80,
    shutteringScaffoldingPerM3: 920,
    wastagePercent: 2.5,
    waterElectricityPercent: 1.5,
    codeNote: 'PWD Item 4.3 · Dry vol 1.54 · Slab & footing pour',
  },
  {
    workType: 'pcc-1-3-6',
    label: 'PCC 1:3:6 (Lean Concrete)',
    shortTag: 'Sub-base Soling',
    basisVolumeM3: 1.0,
    basisUnitLabel: 'm³',
    rebarAllowanceKgPerM3: 0,
    admixtureDoseKgPerM3: 0,
    masonDaysRequired: 0.25,
    laborerDaysRequired: 1.85,
    barBenderDaysRequired: 0,
    mixerHirePerM3: 180,
    vibratorHirePerM3: 45,
    shutteringScaffoldingPerM3: 120,
    wastagePercent: 2.0,
    waterElectricityPercent: 1.5,
    codeNote: 'PWD Item 3.2 · Brick khoa + local sand bed concrete',
  },
  {
    workType: 'brickwork-125mm-1-4',
    label: '125mm Brick Wall (1:4)',
    shortTag: '5" Partition / m²',
    basisVolumeM3: 1.0,
    basisUnitLabel: 'm²',
    rebarAllowanceKgPerM3: 0,
    admixtureDoseKgPerM3: 0,
    masonDaysRequired: 0.16,
    laborerDaysRequired: 0.28,
    barBenderDaysRequired: 0,
    mixerHirePerM3: 0,
    vibratorHirePerM3: 0,
    shutteringScaffoldingPerM3: 38,
    wastagePercent: 3.0,
    waterElectricityPercent: 1.5,
    codeNote: 'PWD Item 6.5 · 52 bricks/m² + 0.028 m³ dry 1:4 mortar',
  },
  {
    workType: 'brickwork-1-6',
    label: '250mm Brick Wall (1:6)',
    shortTag: '10" Masonry / m³',
    basisVolumeM3: 1.0,
    basisUnitLabel: 'm³',
    rebarAllowanceKgPerM3: 0,
    admixtureDoseKgPerM3: 0,
    masonDaysRequired: 0.85,
    laborerDaysRequired: 1.55,
    barBenderDaysRequired: 0,
    mixerHirePerM3: 0,
    vibratorHirePerM3: 0,
    shutteringScaffoldingPerM3: 180,
    wastagePercent: 3.0,
    waterElectricityPercent: 1.5,
    codeNote: 'PWD Item 6.1 · 500 bricks/m³ + 0.30 m³ dry 1:6 mortar',
  },
  {
    workType: 'plaster-1-4',
    label: '12mm Wall Plaster (1:4)',
    shortTag: 'Mortar / m³ (~75 m²)',
    basisVolumeM3: 1.0,
    basisUnitLabel: 'm³',
    rebarAllowanceKgPerM3: 0,
    admixtureDoseKgPerM3: 0,
    masonDaysRequired: 3.2,
    laborerDaysRequired: 4.5,
    barBenderDaysRequired: 0,
    mixerHirePerM3: 0,
    vibratorHirePerM3: 0,
    shutteringScaffoldingPerM3: 450,
    wastagePercent: 5.0,
    waterElectricityPercent: 1.5,
    codeNote: 'PWD Item 9.1 · 1.33 dry factor · Screened sand 1:4',
  },
  {
    workType: 'patent-stone-1-2-4',
    label: '1:2:4 Patent Stone / Screed',
    shortTag: 'Floor Topping / m³',
    basisVolumeM3: 1.0,
    basisUnitLabel: 'm³',
    rebarAllowanceKgPerM3: 0,
    admixtureDoseKgPerM3: 0,
    masonDaysRequired: 1.45,
    laborerDaysRequired: 2.6,
    barBenderDaysRequired: 0,
    mixerHirePerM3: 160,
    vibratorHirePerM3: 40,
    shutteringScaffoldingPerM3: 140,
    wastagePercent: 2.5,
    waterElectricityPercent: 1.5,
    codeNote: 'PWD Item 8.4 · 1:2:4 screed + neat cement punning',
  },
  {
    workType: 'rebar-fabrication',
    label: '500W Rebar Fabrication (1 Ton)',
    shortTag: 'Cutting & Placing',
    basisVolumeM3: 1.0,
    basisUnitLabel: 'Ton',
    rebarAllowanceKgPerM3: 1000,
    admixtureDoseKgPerM3: 0,
    masonDaysRequired: 0,
    laborerDaysRequired: 4.5,
    barBenderDaysRequired: 6.5,
    mixerHirePerM3: 0,
    vibratorHirePerM3: 0,
    shutteringScaffoldingPerM3: 350,
    wastagePercent: 2.5,
    waterElectricityPercent: 1.0,
    codeNote: 'PWD Item 5.1 · 1000 kg rebar + 10 kg wire + cover blocks',
  },
];

/**
 * Resolves accurate engineering unit rates dynamically:
 * 1. Checks user's customized Rate Analysis calculation if matching the trade
 * 2. Looks up active schedule of rates library (PWD 2024, PWD 2025, LGED, Commercial)
 * 3. Applies regional district multipliers
 * 4. Falls back gracefully without zero or dummy values
 */
export function resolveDynamicRate(
  workspace: CivilWorkspace,
  category: DynamicRateCategory,
  options: DynamicRateOptions = {}
): number {
  const { pipeDiaMm, depthM, fallbackRate } = options;

  // 1. Check if user's Rate Analysis module has matching computed rates
  if (workspace.rateAnalysis) {
    const wt = workspace.rateAnalysis.workType;
    if (
      category === 'concrete' &&
      (wt === 'rcc-1-1.5-3' || wt === 'rcc-1-2-4' || wt === 'pcc-1-3-6' || wt === 'patent-stone-1-2-4')
    ) {
      const computed = computeRateAnalysis(workspace.rateAnalysis);
      if (computed.result && computed.result.unitRatePerM3 > 0) {
        return Math.round(computed.result.unitRatePerM3);
      }
    }

    if (category === 'rebar' && wt === 'rebar-fabrication') {
      const computed = computeRateAnalysis(workspace.rateAnalysis);
      if (computed.result && computed.result.unitRatePerM3 > 0) {
        // unitRate per Ton -> return per kg
        return Math.round(computed.result.unitRatePerM3 / 1000);
      }
    }

    if (category === 'masonry' && (wt === 'brickwork-1-6' || wt === 'brickwork-125mm-1-4')) {
      const computed = computeRateAnalysis(workspace.rateAnalysis);
      if (computed.result && computed.result.unitRatePerM3 > 0) {
        return Math.round(computed.result.unitRatePerM3);
      }
    }

    if (category === 'plaster' && wt === 'plaster-1-4') {
      const computed = computeRateAnalysis(workspace.rateAnalysis);
      if (computed.result && computed.result.unitRatePerM3 > 0) {
        return Math.round(computed.result.unitRatePerM3);
      }
    }
  }

  // 2. Schedule of Rates Library Lookup (Default PWD 2024 / User Selected Library)
  const libId = workspace.boq?.rateLibraryId || 'pwd-2024';
  const library = ALL_RATE_LIBRARIES[libId] || PWD_RATES_2024;
  const regionalMultiplier = workspace.boq?.regionalMultiplier || 1.0;

  let resolvedBaseRate = 0;

  switch (category) {
    case 'concrete': {
      // PWD-401 (RCC 1:1.5:3) or PWD-302 (PCC 1:3:6)
      const rccItem = library.items.find((it) => it.code === 'PWD-401' || it.category === 'superstructure');
      resolvedBaseRate = rccItem ? rccItem.baseRateBdt : 14200;
      break;
    }

    case 'earthwork': {
      // PWD-201 (Earth excavation in foundation trenches)
      const ewItem = library.items.find((it) => it.code === 'PWD-201' || it.category === 'earthwork');
      let base = ewItem ? ewItem.baseRateBdt : 245;
      if (depthM && depthM > 1.5) {
        // Deep excavation surcharge (~15% extra per meter beyond 1.5m)
        base = Math.round(base * (1 + (depthM - 1.5) * 0.15));
      }
      resolvedBaseRate = base;
      break;
    }

    case 'site-clearing': {
      // PWD Site clearing / dressing per m²
      resolvedBaseRate = 45;
      break;
    }

    case 'masonry': {
      // PWD-601 (1st class brickwork in 1:6 mortar)
      const brickItem = library.items.find((it) => it.code === 'PWD-601' || it.category === 'masonry');
      resolvedBaseRate = brickItem ? brickItem.baseRateBdt : 8650;
      break;
    }

    case 'rebar': {
      // PWD-501 (500W rebar per kg)
      const rebarItem = library.items.find((it) => it.code === 'PWD-501' || it.category === 'rebar');
      resolvedBaseRate = rebarItem ? rebarItem.baseRateBdt : 118;
      break;
    }

    case 'pipe':
    case 'plumbing': {
      // Standard PWD / DPHE Schedule for uPVC and DI pressure pipe laying
      const dia = pipeDiaMm || 200;
      if (dia >= 300) resolvedBaseRate = 4600;
      else if (dia >= 250) resolvedBaseRate = 4100;
      else if (dia >= 200) resolvedBaseRate = 3200;
      else if (dia >= 150) resolvedBaseRate = 2450;
      else if (dia >= 100) resolvedBaseRate = 1850;
      else resolvedBaseRate = 1200;
      break;
    }

    default:
      resolvedBaseRate = fallbackRate || 500;
  }

  // Multiply by regional district adjustment index
  const finalRate = Math.round(resolvedBaseRate * regionalMultiplier);
  return finalRate > 0 ? finalRate : (fallbackRate || 500);
}

/**
 * Converts Master Market Material & Labor Rates into RateAnalysisParameters fields
 */
export function mapMasterRatesToRateAnalysis(
  currentRateAnalysis: RateAnalysisParameters,
  marketRates: MasterMarketRates
): RateAnalysisParameters {
  const m3ToCft = EXACT_CONVERSION.M3_TO_CFT;
  return {
    ...currentRateAnalysis,
    cementPricePerBag: Number(marketRates.cementBag50Kg.toFixed(2)),
    sandPricePerM3: Math.round(marketRates.sylhetSandPerCft * m3ToCft),
    localSandPricePerM3: Math.round(marketRates.localSandPerCft * m3ToCft),
    stoneChipsPricePerM3: Math.round(marketRates.stoneChips20mmPerCft * m3ToCft),
    brickKhoaPricePerM3: Math.round(marketRates.brickKhoaPerCft * m3ToCft),
    brickPricePer1000: Math.round(marketRates.firstClassBrickPer1000),
    rebarPricePerKg: Number((marketRates.rebar500WPerTon / 1000).toFixed(2)),
    masonDailyWage: Math.round(marketRates.headMasonDailyWage),
    laborerDailyWage: Math.round(marketRates.helperDailyWage),
    barBenderDailyWage: Math.round(marketRates.barBenderDailyWage ?? marketRates.headMasonDailyWage),
  };
}

export interface MasterMarketSyncResult {
  marketRates: MasterMarketRates;
  rateAnalysis: RateAnalysisParameters;
  boqItems: TakeoffLineItem[];
  updatedBoqCount: number;
  tradeRates: Record<RateAnalysisWorkType, number>;
}

/**
 * Synchronizes Master Market Material & Labor Rates into BOTH `rate-analysis`
 * and all linked items in `boq.items` (respecting item unit: m3/cft/m2/sft/ton/kg & regionalMultiplier).
 */
export function syncMasterMarketRatesToWorkspace(
  workspace: CivilWorkspace,
  incomingMarketRates?: MasterMarketRates
): MasterMarketSyncResult {
  const baseMarket = incomingMarketRates || workspace.marketRates || createDefaultMasterMarketRates();
  const stampedMarket: MasterMarketRates = {
    ...baseMarket,
    lastSyncedAt: new Date().toISOString(),
  };

  const nextRateAnalysis = mapMasterRatesToRateAnalysis(workspace.rateAnalysis, stampedMarket);

  // Compute reference analyzed unit rates for every standard trade preset using updated market prices
  const tradeRates = {} as Record<RateAnalysisWorkType, number>;
  RATE_ANALYSIS_TRADE_PRESETS.forEach((preset) => {
    const simulatedParams: RateAnalysisParameters = {
      ...nextRateAnalysis,
      workType: preset.workType,
      basisVolumeM3: 1.0,
      rebarAllowanceKgPerM3: preset.rebarAllowanceKgPerM3,
      admixtureDoseKgPerM3: preset.admixtureDoseKgPerM3,
      masonDaysRequired: preset.masonDaysRequired,
      laborerDaysRequired: preset.laborerDaysRequired,
      barBenderDaysRequired: preset.barBenderDaysRequired,
      mixerHirePerM3: preset.mixerHirePerM3,
      vibratorHirePerM3: preset.vibratorHirePerM3,
      shutteringScaffoldingPerM3: preset.shutteringScaffoldingPerM3,
      wastagePercent: nextRateAnalysis.wastagePercent ?? preset.wastagePercent,
      waterElectricityPercent: preset.waterElectricityPercent,
    };
    const env = computeRateAnalysis(simulatedParams);
    tradeRates[preset.workType] = env.result ? env.result.unitRatePerM3 : 0;
  });

  const regionalMult = workspace.boq?.regionalMultiplier || 1.0;
  let updatedBoqCount = 0;

  const updatedBoqItems = (workspace.boq?.items || []).map((item) => {
    const desc = (item.description || '').toLowerCase();
    let matchedM3OrBaseRate = 0;
    let rateKind: 'volumetric' | 'area' | 'plaster-area' | 'rebar-mass' | 'none' = 'none';

    if (item.category === 'rebar' || desc.includes('rebar') || desc.includes('reinforcement') || desc.includes('steel') || desc.includes('tor')) {
      matchedM3OrBaseRate = tradeRates['rebar-fabrication']; // per Ton (1000 kg)
      rateKind = 'rebar-mass';
    } else if (
      desc.includes('125mm') ||
      desc.includes('5"') ||
      desc.includes('5 inch') ||
      desc.includes('partition') ||
      (item.category === 'masonry' && (item.unit === 'm2' || item.unit === 'sft'))
    ) {
      matchedM3OrBaseRate = tradeRates['brickwork-125mm-1-4']; // per m²
      rateKind = 'area';
    } else if (item.category === 'masonry' || desc.includes('brick') || desc.includes('masonry')) {
      matchedM3OrBaseRate = tradeRates['brickwork-1-6']; // per m³
      rateKind = 'volumetric';
    } else if (desc.includes('plaster') || desc.includes('rendering')) {
      // plaster-1-4 rate is per 1 m³ mortar (~75 m² at 12mm thick including wastage)
      matchedM3OrBaseRate = tradeRates['plaster-1-4'];
      rateKind = item.unit === 'm2' || item.unit === 'sft' ? 'plaster-area' : 'volumetric';
    } else if (desc.includes('patent') || desc.includes('screed') || desc.includes('topping')) {
      matchedM3OrBaseRate = tradeRates['patent-stone-1-2-4'];
      rateKind = 'volumetric';
    } else if (desc.includes('1:3:6') || desc.includes('pcc') || desc.includes('lean') || desc.includes('blinding') || desc.includes('soling')) {
      matchedM3OrBaseRate = tradeRates['pcc-1-3-6'];
      rateKind = 'volumetric';
    } else if (desc.includes('1:2:4') || desc.includes('slab') || desc.includes('footing') || desc.includes('raft') || desc.includes('stair')) {
      matchedM3OrBaseRate = tradeRates['rcc-1-2-4'];
      rateKind = 'volumetric';
    } else if (
      item.category === 'substructure' ||
      item.category === 'superstructure' ||
      desc.includes('rcc') ||
      desc.includes('concrete') ||
      desc.includes('column') ||
      desc.includes('beam') ||
      desc.includes('1:1.5:3')
    ) {
      matchedM3OrBaseRate = tradeRates['rcc-1-1.5-3'];
      rateKind = 'volumetric';
    }

    if (rateKind === 'none' || matchedM3OrBaseRate <= 0) {
      return item;
    }

    let nextUnitRate = item.unitRate;
    if (rateKind === 'rebar-mass') {
      const ratePerTon = matchedM3OrBaseRate;
      if (item.unit === 'ton') {
        nextUnitRate = ratePerTon * regionalMult;
      } else if (item.unit === 'kg') {
        nextUnitRate = (ratePerTon / 1000) * regionalMult;
      } else {
        return item;
      }
    } else if (rateKind === 'area') {
      // matchedM3OrBaseRate is per m²
      if (item.unit === 'm2') {
        nextUnitRate = matchedM3OrBaseRate * regionalMult;
      } else if (item.unit === 'sft') {
        nextUnitRate = (matchedM3OrBaseRate / EXACT_CONVERSION.M2_TO_SFT) * regionalMult;
      } else {
        return item;
      }
    } else if (rateKind === 'plaster-area') {
      // 1 m³ mortar covers ~75 m² of 12mm plaster
      const ratePerM2 = matchedM3OrBaseRate / 75;
      if (item.unit === 'm2') {
        nextUnitRate = ratePerM2 * regionalMult;
      } else if (item.unit === 'sft') {
        nextUnitRate = (ratePerM2 / EXACT_CONVERSION.M2_TO_SFT) * regionalMult;
      } else {
        return item;
      }
    } else if (rateKind === 'volumetric') {
      if (item.unit === 'm3') {
        nextUnitRate = matchedM3OrBaseRate * regionalMult;
      } else if (item.unit === 'cft') {
        nextUnitRate = (matchedM3OrBaseRate / EXACT_CONVERSION.M3_TO_CFT) * regionalMult;
      } else {
        return item;
      }
    }

    updatedBoqCount++;
    return {
      ...item,
      unitRate: Number(nextUnitRate.toFixed(2)),
    };
  });

  return {
    marketRates: stampedMarket,
    rateAnalysis: nextRateAnalysis,
    boqItems: updatedBoqItems,
    updatedBoqCount,
    tradeRates,
  };
}

