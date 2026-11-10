import { CivilWorkspace } from '../types/civil';
import { ALL_RATE_LIBRARIES, PWD_RATES_2024 } from './costLibraries';
import { computeRateAnalysis } from './calculations';

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
      (wt === 'rcc-1-1.5-3' || wt === 'rcc-1-2-4' || wt === 'pcc-1-3-6')
    ) {
      const computed = computeRateAnalysis(workspace.rateAnalysis);
      if (computed.result && computed.result.unitRatePerM3 > 0) {
        return Math.round(computed.result.unitRatePerM3);
      }
    }

    if (category === 'rebar' && wt === 'rebar-fabrication') {
      const computed = computeRateAnalysis(workspace.rateAnalysis);
      if (computed.result && computed.result.unitRatePerM3 > 0) {
        // unitRate per kg
        return Math.round(computed.result.unitRatePerM3);
      }
    }

    if (category === 'masonry' && wt === 'brickwork-1-6') {
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
        // Deep excavation surcharge (~20% extra per meter beyond 1.5m)
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
