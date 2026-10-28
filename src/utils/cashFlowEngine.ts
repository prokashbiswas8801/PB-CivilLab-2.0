import { TakeoffLineItem } from '../types/civil';
import { ComputedTakeoffItem } from './calculations';

export interface MonthlyCashFlowPeriod {
  month: number;
  periodLabel: string;
  directPlannedExpenditure: number;
  contingencyReserve: number;
  contractorOverhead: number;
  vatTax: number;
  grossBilling: number;
  retainageWithheld: number; // e.g. 5% or 10%
  netCashOutflow: number; // Gross billing - retainage
  cumulativePlannedExpenditure: number;
  cumulativeNetCashOutflow: number;
  cumulativeProgressPercent: number; // 0 to 100%
  activeItemCount: number;
}

export interface ProjectMilestone {
  percentage: number;
  label: string;
  expectedMonth: number;
  cumulativeAmount: number;
  status: 'pending' | 'in-progress' | 'achieved';
}

export interface CashFlowForecastResult {
  totalProjectMonths: number;
  totalBudget: number;
  retainagePercent: number;
  totalRetainageWithheld: number;
  monthlyPeriods: MonthlyCashFlowPeriod[];
  milestones: ProjectMilestone[];
  peakExpenditureMonth: number;
  peakExpenditureAmount: number;
  averageMonthlyBurnRate: number;
}

/**
 * Weights a period `t` inside `duration` according to selected curve distribution
 */
function getDistributionWeight(
  localPeriod: number, // 0 to duration - 1
  duration: number,
  curve: 's-curve' | 'linear' | 'early-peak' | 'late-peak' = 's-curve'
): number {
  if (duration <= 1) return 1.0;

  const tNorm = (localPeriod + 0.5) / duration; // 0.0 to 1.0 (midpoint of period)

  switch (curve) {
    case 'linear':
      return 1.0 / duration;

    case 'early-peak': {
      // Front-loaded triangular/beta distribution (peaks around 30% duration)
      const raw = Math.sin(tNorm * Math.PI * 0.8 + 0.2);
      return Math.max(0.01, raw);
    }

    case 'late-peak': {
      // Back-loaded distribution (peaks around 75% duration)
      const raw = Math.sin(tNorm * Math.PI * 0.8 + 0.8);
      return Math.max(0.01, raw);
    }

    case 's-curve':
    default: {
      // Standard bell-shaped density function generating classic S-curve cumulative
      // Normal distribution centered at 0.5 with sigma = 0.2
      const z = (tNorm - 0.5) / 0.2;
      const density = Math.exp(-0.5 * z * z);
      return Math.max(0.01, density);
    }
  }
}

/**
 * Computes monthly cash flow schedule and S-Curve progress metrics from BOQ items
 */
export function computeCashFlowForecast(
  items: (TakeoffLineItem | ComputedTakeoffItem)[],
  options: {
    totalProjectMonths?: number;
    retainagePercent?: number;
    contingencyPercent?: number;
    contractorOverheadPercent?: number;
    vatTaxPercent?: number;
  } = {}
): CashFlowForecastResult {
  const retainagePct = options.retainagePercent ?? 5;
  const contingencyPct = options.contingencyPercent ?? 3;
  const overheadPct = options.contractorOverheadPercent ?? 10;
  const vatTaxPct = options.vatTaxPercent ?? 7.5;

  // Determine project duration
  let maxMonthDetected = 6;
  items.forEach((it, idx) => {
    const s = it.startMonth || Math.min(12, Math.floor(idx / 2) + 1);
    const d = it.durationMonths || 2;
    if (s + d - 1 > maxMonthDetected) {
      maxMonthDetected = s + d - 1;
    }
  });

  const totalMonths = Math.max(options.totalProjectMonths || 12, maxMonthDetected, 6);

  // Month buckets: 1 to totalMonths
  const monthlyDirectExpenditure: number[] = new Array(totalMonths).fill(0);
  const monthlyActiveItemsCount: number[] = new Array(totalMonths).fill(0);

  // Map each item across its timeline
  items.forEach((it, idx) => {
    // If ComputedTakeoffItem, use it.itemTotalAmount, else estimate from unitRate
    const amount =
      'itemTotalAmount' in it
        ? it.itemTotalAmount
        : (it.lengthM || 1) * (it.widthM || 1) * (it.heightM || 1) * (it.numberOfMembers || 1) * it.unitRate;

    if (amount <= 0) return;

    // Default start month based on trade category or sequence if not set
    let startMonth = it.startMonth;
    let duration = it.durationMonths;

    if (!startMonth) {
      switch (it.category) {
        case 'misc':
          startMonth = 1;
          duration = duration || Math.min(totalMonths, 3);
          break;
        case 'earthwork':
          startMonth = 1;
          duration = duration || 2;
          break;
        case 'substructure':
          startMonth = 2;
          duration = duration || 3;
          break;
        case 'superstructure':
          startMonth = 4;
          duration = duration || 4;
          break;
        case 'rebar':
          startMonth = 3;
          duration = duration || 5;
          break;
        case 'masonry':
          startMonth = 6;
          duration = duration || 3;
          break;
        case 'finishing':
          startMonth = 7;
          duration = duration || 4;
          break;
        case 'plumbing':
          startMonth = 5;
          duration = duration || 4;
          break;
        case 'electrical':
          startMonth = 8;
          duration = duration || 3;
          break;
        default:
          startMonth = Math.min(totalMonths, Math.floor(idx / 2) + 1);
          duration = duration || 2;
          break;
      }
    }

    startMonth = Math.max(1, Math.min(startMonth, totalMonths));
    duration = Math.max(1, Math.min(duration || 2, totalMonths - startMonth + 1));
    const curve = it.curveDistribution || 's-curve';

    // Compute weights
    const weights: number[] = [];
    let sumWeights = 0;
    for (let p = 0; p < duration; p++) {
      const w = getDistributionWeight(p, duration, curve);
      weights.push(w);
      sumWeights += w;
    }

    // Allocate across months
    for (let p = 0; p < duration; p++) {
      const mIdx = startMonth - 1 + p;
      if (mIdx < totalMonths) {
        const allocated = (weights[p] / sumWeights) * amount;
        monthlyDirectExpenditure[mIdx] += allocated;
        monthlyActiveItemsCount[mIdx] += 1;
      }
    }
  });

  const totalDirect = monthlyDirectExpenditure.reduce((acc, v) => acc + v, 0);

  // Mark-up multipliers
  const contFactor = contingencyPct / 100;
  const ohFactor = overheadPct / 100;
  const vatFactor = vatTaxPct / 100;
  const retFactor = retainagePct / 100;

  // Build cumulative periods
  const periods: MonthlyCashFlowPeriod[] = [];
  let cumPlanned = 0;
  let cumNetCash = 0;
  let peakAmount = 0;
  let peakMonth = 1;

  for (let m = 0; m < totalMonths; m++) {
    const direct = monthlyDirectExpenditure[m];
    const cont = direct * contFactor;
    const oh = (direct + cont) * ohFactor;
    const vat = (direct + cont + oh) * vatFactor;
    const gross = direct + cont + oh + vat;

    const retainage = gross * retFactor;
    const netCash = gross - retainage;

    cumPlanned += gross;
    cumNetCash += netCash;

    if (gross > peakAmount) {
      peakAmount = gross;
      peakMonth = m + 1;
    }

    periods.push({
      month: m + 1,
      periodLabel: `Month ${m + 1}`,
      directPlannedExpenditure: Math.round(direct * 100) / 100,
      contingencyReserve: Math.round(cont * 100) / 100,
      contractorOverhead: Math.round(oh * 100) / 100,
      vatTax: Math.round(vat * 100) / 100,
      grossBilling: Math.round(gross * 100) / 100,
      retainageWithheld: Math.round(retainage * 100) / 100,
      netCashOutflow: Math.round(netCash * 100) / 100,
      cumulativePlannedExpenditure: Math.round(cumPlanned * 100) / 100,
      cumulativeNetCashOutflow: Math.round(cumNetCash * 100) / 100,
      cumulativeProgressPercent: totalDirect > 0 ? Math.min(100, Math.round((cumPlanned / (totalDirect * (1 + contFactor) * (1 + ohFactor) * (1 + vatFactor))) * 1000) / 10) : 0,
      activeItemCount: monthlyActiveItemsCount[m],
    });
  }

  // Adjust final percentage to exactly 100% if non-zero
  if (periods.length > 0 && cumPlanned > 0) {
    periods[periods.length - 1].cumulativeProgressPercent = 100;
  }

  const grandTotalBudget = cumPlanned;
  const totalRetainage = periods.reduce((sum, p) => sum + p.retainageWithheld, 0);

  // Calculate standard EPC milestones
  const milestones: ProjectMilestone[] = [
    {
      percentage: 25,
      label: '25% Milestone: Substructure & Foundation Completion',
      expectedMonth: findMonthForPercent(periods, 25),
      cumulativeAmount: Math.round(grandTotalBudget * 0.25 * 100) / 100,
      status: 'pending',
    },
    {
      percentage: 50,
      label: '50% Milestone: Superstructure RCC Frame Topped Out',
      expectedMonth: findMonthForPercent(periods, 50),
      cumulativeAmount: Math.round(grandTotalBudget * 0.50 * 100) / 100,
      status: 'pending',
    },
    {
      percentage: 75,
      label: '75% Milestone: Enclosure, Masonry & Rough-in Services',
      expectedMonth: findMonthForPercent(periods, 75),
      cumulativeAmount: Math.round(grandTotalBudget * 0.75 * 100) / 100,
      status: 'pending',
    },
    {
      percentage: 100,
      label: '100% Milestone: Substantial Completion, Punch-List & Handover',
      expectedMonth: totalMonths,
      cumulativeAmount: Math.round(grandTotalBudget * 100) / 100,
      status: 'pending',
    },
  ];

  return {
    totalProjectMonths: totalMonths,
    totalBudget: Math.round(grandTotalBudget * 100) / 100,
    retainagePercent: retainagePct,
    totalRetainageWithheld: Math.round(totalRetainage * 100) / 100,
    monthlyPeriods: periods,
    milestones,
    peakExpenditureMonth: peakMonth,
    peakExpenditureAmount: Math.round(peakAmount * 100) / 100,
    averageMonthlyBurnRate: Math.round((grandTotalBudget / Math.max(1, totalMonths)) * 100) / 100,
  };
}

function findMonthForPercent(periods: MonthlyCashFlowPeriod[], targetPercent: number): number {
  for (const p of periods) {
    if (p.cumulativeProgressPercent >= targetPercent) {
      return p.month;
    }
  }
  return periods.length > 0 ? periods[periods.length - 1].month : 1;
}
