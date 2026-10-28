import { BidTabulationData, BidTabulationItem, TakeoffUnit } from '../types/civil';

export interface EvaluatedBidVendorSummary {
  vendorKey: 'vendor1' | 'vendor2' | 'vendor3';
  vendorName: string;
  totalBidAmount: number;
  varianceFromEstimateBdt: number;
  variancePercent: number; // positive = higher than estimate, negative = savings
  lowestItemCount: number;
  rank: 1 | 2 | 3;
  isLowestOverall: boolean;
  complianceRating: 'Compliant' | 'Substantially Compliant';
}

export interface EvaluatedBidLineItem {
  id: string;
  itemDescription: string;
  unit: TakeoffUnit;
  quantity: number;
  engineersRate: number;
  engineersTotal: number;
  vendor1Rate: number;
  vendor1Total: number;
  vendor2Rate: number;
  vendor2Total: number;
  vendor3Rate: number;
  vendor3Total: number;
  lowestRate: number;
  lowestVendorKey: 'vendor1' | 'vendor2' | 'vendor3' | 'tie';
  lowestVendorName: string;
  varianceFromEstimatePercent: number;
  potentialSavingsBdt: number;
}

export interface BidTabulationReport {
  totalEngineersEstimate: number;
  vendors: EvaluatedBidVendorSummary[];
  lineItems: EvaluatedBidLineItem[];
  recommendedVendorName: string;
  recommendedVendorKey: 'vendor1' | 'vendor2' | 'vendor3';
  netSavingsAgainstEstimateBdt: number;
  netSavingsPercent: number;
}

export function evaluateBidTabulation(data: BidTabulationData): BidTabulationReport {
  let engTotal = 0;
  let v1Total = 0;
  let v2Total = 0;
  let v3Total = 0;

  let v1Wins = 0;
  let v2Wins = 0;
  let v3Wins = 0;

  const evaluatedLines: EvaluatedBidLineItem[] = data.items.map((item) => {
    const qty = item.quantity > 0 ? item.quantity : 1;
    const engT = item.engineersEstimateRate * qty;
    const v1T = item.vendor1.unitRate * qty;
    const v2T = item.vendor2.unitRate * qty;
    const v3T = item.vendor3.unitRate * qty;

    engTotal += engT;
    v1Total += v1T;
    v2Total += v2T;
    v3Total += v3T;

    const rates = [
      { key: 'vendor1' as const, name: data.vendor1Name, rate: item.vendor1.unitRate },
      { key: 'vendor2' as const, name: data.vendor2Name, rate: item.vendor2.unitRate },
      { key: 'vendor3' as const, name: data.vendor3Name, rate: item.vendor3.unitRate },
    ].filter((r) => r.rate > 0);

    rates.sort((a, b) => a.rate - b.rate);
    const lowest = rates[0] || { key: 'vendor1', name: data.vendor1Name, rate: item.engineersEstimateRate };

    if (lowest.key === 'vendor1') v1Wins++;
    else if (lowest.key === 'vendor2') v2Wins++;
    else if (lowest.key === 'vendor3') v3Wins++;

    const variancePct =
      item.engineersEstimateRate > 0
        ? ((lowest.rate - item.engineersEstimateRate) / item.engineersEstimateRate) * 100
        : 0;

    const potentialSavings = Math.max(0, engT - lowest.rate * qty);

    return {
      id: item.id,
      itemDescription: item.itemDescription,
      unit: item.unit,
      quantity: qty,
      engineersRate: item.engineersEstimateRate,
      engineersTotal: Math.round(engT * 100) / 100,
      vendor1Rate: item.vendor1.unitRate,
      vendor1Total: Math.round(v1T * 100) / 100,
      vendor2Rate: item.vendor2.unitRate,
      vendor2Total: Math.round(v2T * 100) / 100,
      vendor3Rate: item.vendor3.unitRate,
      vendor3Total: Math.round(v3T * 100) / 100,
      lowestRate: lowest.rate,
      lowestVendorKey: lowest.key,
      lowestVendorName: lowest.name,
      varianceFromEstimatePercent: Math.round(variancePct * 10) / 10,
      potentialSavingsBdt: Math.round(potentialSavings * 100) / 100,
    };
  });

  const vendorTotals = [
    { key: 'vendor1' as const, name: data.vendor1Name, total: v1Total, wins: v1Wins },
    { key: 'vendor2' as const, name: data.vendor2Name, total: v2Total, wins: v2Wins },
    { key: 'vendor3' as const, name: data.vendor3Name, total: v3Total, wins: v3Wins },
  ];

  vendorTotals.sort((a, b) => a.total - b.total);

  const vendorSummaries: EvaluatedBidVendorSummary[] = vendorTotals.map((vt, idx) => {
    const diff = vt.total - engTotal;
    const diffPct = engTotal > 0 ? (diff / engTotal) * 100 : 0;
    return {
      vendorKey: vt.key,
      vendorName: vt.name,
      totalBidAmount: Math.round(vt.total * 100) / 100,
      varianceFromEstimateBdt: Math.round(diff * 100) / 100,
      variancePercent: Math.round(diffPct * 10) / 10,
      lowestItemCount: vt.wins,
      rank: (idx + 1) as 1 | 2 | 3,
      isLowestOverall: idx === 0,
      complianceRating: 'Compliant',
    };
  });

  const bestVendor = vendorSummaries[0];
  const netSavings = engTotal - bestVendor.totalBidAmount;
  const netSavingsPct = engTotal > 0 ? (netSavings / engTotal) * 100 : 0;

  return {
    totalEngineersEstimate: Math.round(engTotal * 100) / 100,
    vendors: vendorSummaries,
    lineItems: evaluatedLines,
    recommendedVendorName: bestVendor.vendorName,
    recommendedVendorKey: bestVendor.vendorKey,
    netSavingsAgainstEstimateBdt: Math.round(netSavings * 100) / 100,
    netSavingsPercent: Math.round(netSavingsPct * 10) / 10,
  };
}
