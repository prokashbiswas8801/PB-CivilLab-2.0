import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import {
  CivilWorkspace,
  UserProfile,
} from '../types/civil';
import { BOQResult } from './calculations';
import {
  CashFlowForecastResult,
} from './cashFlowEngine';
import {
  BidTabulationReport,
} from './bidTabulationEngine';
import {
  createVerifiedReportRecord,
  saveVerifiedReport,
} from './verificationEngine';
import { generateSubmittalDocRef } from './qrCode';
import { BRAND_LOGO_BASE64, getBrandLogoPngDataUrl } from '../assets/brandLogoData';
import { sanitizeEngineeringSymbols } from './exportEngine';

/**
 * Generates official formatted CSV spreadsheet for Tender BOQ (Form A Grand Summary & Form B Itemized WBS)
 */
export function exportTenderBoqCsv(
  workspace: CivilWorkspace,
  boqResult: BOQResult,
  bidReport?: BidTabulationReport | null
): void {
  const currency = boqResult.currency;
  const currencySym = boqResult.currencySymbol;

  const lines: string[] = [];

  // Title Block
  lines.push(`"BD. CIVILLAB - OFFICIAL TENDER BILL OF QUANTITIES (BOQ)"`);
  lines.push(`"Project Name:","${workspace.name || 'Untitled Project'}"`);
  lines.push(`"Project Code:","${workspace.projectCode || 'PRJ-001'}"`);
  lines.push(`"Site Location:","${workspace.siteLocation || ''}"`);
  lines.push(`"Engineer of Record:","${workspace.engineerOfRecord || ''}"`);
  lines.push(`"Governing Code:","${workspace.governingCode}"`);
  lines.push(`"Currency:","${currency} (${currencySym})"`);
  lines.push(`"Date of Submittal:","${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}"`);
  lines.push(``);

  // FORM A: GRAND SUMMARY OF BILL OF QUANTITIES
  lines.push(`"========================================================================="`);
  lines.push(`"FORM A: GRAND SUMMARY OF BILL OF QUANTITIES (WBS CHAPTERS)"`);
  lines.push(`"========================================================================="`);
  lines.push(`"WBS Code","Chapter Description","Line Items Count","Subtotal (${currency})","Percentage (%)"`);

  if (boqResult.wbsSectionSummaries && boqResult.wbsSectionSummaries.length > 0) {
    boqResult.wbsSectionSummaries.forEach((s) => {
      lines.push(
        `"Section ${s.code}","${s.title.replace(/"/g, '""')}","${s.itemCount}","${s.subtotal.toFixed(2)}","${s.percentageOfSubtotal}%"`
      );
    });
  } else {
    boqResult.categorySummaries.forEach((c) => {
      lines.push(
        `"[${c.category.toUpperCase()}]","${c.category.toUpperCase()} Trade Items","${c.itemCount}","${c.subtotal.toFixed(2)}","${c.percentageOfSubtotal}%"`
      );
    });
  }

  lines.push(`"","DIRECT TAKEOFF SUBTOTAL:","${boqResult.items.length}","${boqResult.subtotalAmount.toFixed(2)}","100.0%"`);
  lines.push(`"","+ Physical Contingency Reserve (${boqResult.contingencyPercent}%):","","${boqResult.contingencyAmount.toFixed(2)}",""`);
  lines.push(`"","+ Contractor Profit & Overhead CP&OH (${boqResult.contractorOverheadPercent}%):","","${boqResult.contractorOverheadAmount.toFixed(2)}",""`);
  lines.push(`"","+ Statutory VAT / Tax (${boqResult.vatTaxPercent}%):","","${boqResult.vatTaxAmount.toFixed(2)}",""`);
  lines.push(`"","ESTIMATED GRAND TOTAL TENDER SUM:","","${boqResult.grandTotalAmount.toFixed(2)}",""`);
  lines.push(``);

  // FORM B: ITEMIZED MEASUREMENT BILL OF QUANTITIES
  lines.push(`"========================================================================="`);
  lines.push(`"FORM B: ITEMIZED MEASUREMENT BILL OF QUANTITIES (L x W x H)"`);
  lines.push(`"========================================================================="`);
  lines.push(`"Item No","WBS Chapter","Description","Nos","Length (m)","Width (m)","Height (m)","Deduction","Unit","Billable Qty","Unit Rate (${currencySym})","Total Amount (${currencySym})","Start Month","Duration"`);

  boqResult.items.forEach((it) => {
    const desc = it.description.replace(/"/g, '""');
    const wbs = (it.wbsSectionTitle || it.category).replace(/"/g, '""');
    lines.push(
      `"${it.itemNo}","${wbs}","${desc}","${it.numberOfMembers}","${it.lengthM > 0 ? it.lengthM.toFixed(2) : '-'}","${it.widthM > 0 ? it.widthM.toFixed(2) : '-'}","${it.heightM > 0 ? it.heightM.toFixed(2) : '-'}","${it.deductionQty > 0 ? it.deductionQty.toFixed(2) : '-'}","${it.unit}","${it.totalBillableQty.toFixed(2)}","${it.unitRate.toFixed(2)}","${it.itemTotalAmount.toFixed(2)}","${it.startMonth ? `Month ${it.startMonth}` : '-'}","${it.durationMonths ? `${it.durationMonths} mo` : '-'}"`
    );
  });
  lines.push(``);

  // FORM C: VENDOR BID TABULATION COMPARISON (If available)
  if (bidReport && bidReport.lineItems.length > 0) {
    lines.push(`"========================================================================="`);
    lines.push(`"FORM C: SUBCONTRACTOR & VENDOR BID TABULATION (3-QUOTE COMPARISON)"`);
    lines.push(`"========================================================================="`);
    lines.push(`"Item Description","Unit","Quantity","Engineer's Rate","${bidReport.vendors[0]?.vendorName || 'Vendor 1'}","${bidReport.vendors[1]?.vendorName || 'Vendor 2'}","${bidReport.vendors[2]?.vendorName || 'Vendor 3'}","Lowest Rate","Winning Supplier","Variance (%)"`);

    bidReport.lineItems.forEach((b) => {
      lines.push(
        `"${b.itemDescription.replace(/"/g, '""')}","${b.unit}","${b.quantity}","${b.engineersRate.toFixed(2)}","${b.vendor1Rate.toFixed(2)}","${b.vendor2Rate.toFixed(2)}","${b.vendor3Rate.toFixed(2)}","${b.lowestRate.toFixed(2)}","${b.lowestVendorName}","${b.varianceFromEstimatePercent}%"`
      );
    });

    lines.push(``);
    lines.push(`"TOTAL BID SUMMARY:","","","${bidReport.totalEngineersEstimate.toFixed(2)}","${bidReport.vendors[0]?.totalBidAmount.toFixed(2) || '-'}","${bidReport.vendors[1]?.totalBidAmount.toFixed(2) || '-'}","${bidReport.vendors[2]?.totalBidAmount.toFixed(2) || '-'}"`);
    lines.push(`"RECOMMENDED BIDDER:","${bidReport.recommendedVendorName}","NET SAVINGS:","${currencySym} ${bidReport.netSavingsAgainstEstimateBdt.toFixed(2)} (${bidReport.netSavingsPercent}%)"`);
  }

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tender_BOQ_${workspace.projectCode}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates UTF-8 BOM CSV for the Project Material & Manpower Resource Abstract Schedule
 */
export function exportBoqResourceAbstractCsv(
  workspace: CivilWorkspace,
  boqResult: BOQResult
): void {
  const abs = boqResult.resourceAbstract;
  if (!abs) return;

  const lines: string[] = [];
  lines.push(`"BD. CIVILLAB - BOQ RESOURCE ABSTRACT (PROJECT MATERIAL & MANPOWER DEMAND SCHEDULE)"`);
  lines.push(`"Project Name:","${workspace.name.replace(/"/g, '""')}"`);
  lines.push(`"Project Code:","${workspace.projectCode}"`);
  lines.push(`"Site Location:","${workspace.siteLocation.replace(/"/g, '""')}"`);
  lines.push(`"Generated Date:","${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}"`);
  lines.push(``);
  lines.push(`"PART A: PROJECT AGGREGATE RESOURCE DEMAND CEILINGS"`);
  lines.push(`"Resource Item","Total Quantity","Unit","Engineering Basis / Scope"`);
  lines.push(`"Portland Cement (50kg Bags)","${abs.cementBags50Kg.toFixed(1)}","Bags","RCC, PCC, Brickwork Mortar, Plaster & Screed"`);
  lines.push(`"Fine & Coarse Sand","${abs.sandCft.toFixed(1)}","CFT","Concrete Fine Agg + Masonry/Plaster Mortar"`);
  lines.push(`"Coarse Aggregate (Stone / Khoa)","${abs.coarseAggregateCft.toFixed(1)}","CFT","20mm Stone Chips + Brick Khoa Sub-base"`);
  lines.push(`"Deformed Steel Rebar (500W)","${abs.rebarTonnes.toFixed(3)}","Metric Ton","${abs.rebarKg.toFixed(0)} kg Direct Rebar + Embedded RCC Steel"`);
  lines.push(`"First-Class Clay Bricks","${abs.bricksNos.toFixed(0)}","Nos","250mm (500/m3) & 125mm (52/m2) Walls"`);
  lines.push(`"Skilled Head Mason (Rajmistri)","${abs.masonManDays.toFixed(1)}","Man-Days","Concreting, Masonry, Plastering & Screed"`);
  lines.push(`"General Helper (Jogali)","${abs.helperManDays.toFixed(1)}","Man-Days","Excavation, Batching, Curing & Material Handling"`);
  lines.push(`"Steel Fitter / Bar Bender","${abs.barBenderManDays.toFixed(1)}","Man-Days","Cutting, Bending, Binding & Placing Rebar"`);
  lines.push(`"Total Manpower Demand","${abs.totalManDays.toFixed(1)}","Man-Days","Combined Crew Effort Across Active BOQ"`);
  lines.push(``);
  lines.push(`"PART B: LINE-ITEM RESOURCE CONTRIBUTION MATRIX"`);
  lines.push(`"Item No","Trade Tag","Description","Billable Qty","Unit","Cement (Bags)","Sand (CFT)","Coarse Agg (CFT)","Rebar (kg)","Bricks (Nos)","Mason (Days)","Helper (Days)","Bar Bender (Days)"`);

  abs.lineItemBreakdown.forEach((row) => {
    lines.push(
      `"${row.itemNo}","${row.tradeTag}","${row.description.replace(/"/g, '""')}","${row.billableQty.toFixed(2)}","${row.unit}","${row.cementBags.toFixed(1)}","${row.sandCft.toFixed(1)}","${row.coarseAggregateCft.toFixed(1)}","${row.rebarKg.toFixed(1)}","${row.bricksNos.toFixed(0)}","${row.masonManDays.toFixed(1)}","${row.helperManDays.toFixed(1)}","${row.barBenderManDays.toFixed(1)}"`
    );
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BOQ_Resource_Abstract_${workspace.projectCode}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates Official Multi-Page Tender BOQ Submittal PDF (Form A Grand Summary, Form B Priced Schedule & Form C Bid Tabulation)
 * Uses jspdf-autotable so schedules of any length paginate cleanly across multiple pages with zero truncation.
 */
export async function exportTenderBoqPdf({
  workspace,
  boqResult,
  userProfile,
  bidReport,
  cashFlow,
}: {
  workspace: CivilWorkspace;
  boqResult: BOQResult;
  userProfile?: UserProfile;
  bidReport?: BidTabulationReport | null;
  cashFlow?: CashFlowForecastResult | null;
}): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;

  const docId = generateSubmittalDocRef(2026);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Build verified report record & persist in registry
  const envelope = {
    moduleId: 'boq-estimator' as const,
    timestamp: Date.now(),
    status: boqResult.items.length === 0 ? ('zero_baseline' as const) : ('valid' as const),
    issues: [],
    result: boqResult,
  };

  const verifiedRecord = createVerifiedReportRecord(
    workspace,
    'boq-estimator',
    envelope,
    userProfile,
    docId
  );
  saveVerifiedReport(verifiedRecord);

  // Generate QR Code
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verifiedRecord.verificationUrl, {
      margin: 1,
      width: 180,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch {
    // fallback
  }

  const primaryColor: [number, number, number] = [30, 64, 175];
  const darkTextColor: [number, number, number] = [15, 23, 42];
  const mutedTextColor: [number, number, number] = [71, 85, 105];
  const lightBgColor: [number, number, number] = [248, 250, 252];
  const borderColor: [number, number, number] = [203, 213, 225];

  // PAGE 1: COVER & FORM A - GRAND SUMMARY OF BILL OF QUANTITIES
  let cursorY = margin;

  // Header Banner
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, cursorY, contentWidth, 32, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.4);

  // Brand Logo Icon
  try {
    const brandLogoDataUrl = await getBrandLogoPngDataUrl(256).catch(() => BRAND_LOGO_BASE64);
    doc.addImage(brandLogoDataUrl, 'PNG', margin + 4, cursorY + 4, 24, 24);
  } catch {
    // continue
  }

  const textX = margin + 32;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BD. CivilLab | Tender Management Suite', textX, cursorY + 8);

  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.setFontSize(7);
  doc.text('OFFICIAL TENDER BILL OF QUANTITIES & WORK BREAKDOWN SCHEDULE', textX, cursorY + 13);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    sanitizeEngineeringSymbols(
      `Project: ${workspace.name || 'Untitled Project'} [${workspace.projectCode || 'PRJ-001'}] | Site: ${workspace.siteLocation || 'Not Specified'}`
    ),
    textX,
    cursorY + 19
  );

  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(
    sanitizeEngineeringSymbols(
      `Governing Standard: ${workspace.governingCode} | Currency: ${workspace.currency} | Date: ${dateStr}`
    ),
    textX,
    cursorY + 25
  );

  // Scannable QR Code Box
  const qrBoxSize = 21;
  const qrX = pageWidth - margin - qrBoxSize - 5;
  const qrY = cursorY + 2.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(qrX, qrY, qrBoxSize + 4, 27, 1.5, 1.5, 'FD');

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', qrX + 2, qrY + 1.5, qrBoxSize, qrBoxSize);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SCAN TO VERIFY', qrX + (qrBoxSize + 4) / 2, qrY + 23.5, { align: 'center' });
  doc.setFont('courier', 'bold');
  doc.setFontSize(5.5);
  doc.text(docId, qrX + (qrBoxSize + 4) / 2, qrY + 26, { align: 'center' });

  cursorY += 36;

  // FORM A: GRAND SUMMARY VIA AUTOTABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FORM A: GRAND SUMMARY OF BILL OF QUANTITIES (WBS CHAPTERS)', margin, cursorY);
  cursorY += 2.5;

  const summaries =
    boqResult.wbsSectionSummaries && boqResult.wbsSectionSummaries.length > 0
      ? boqResult.wbsSectionSummaries
      : boqResult.categorySummaries.map((c) => ({
          code: c.category.toUpperCase().slice(0, 3),
          title: `${c.category.toUpperCase()} Trade Works`,
          itemCount: c.itemCount,
          subtotal: c.subtotal,
          percentageOfSubtotal: c.percentageOfSubtotal,
        }));

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [['WBS Code', 'Chapter Description', 'Line Items', `Subtotal (${workspace.currency})`, '% Share']],
    body: summaries.map((s) => [
      sanitizeEngineeringSymbols(`Sec ${s.code}`),
      sanitizeEngineeringSymbols(s.title),
      String(s.itemCount),
      s.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      `${s.percentageOfSubtotal.toFixed(1)}%`,
    ]),
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: darkTextColor },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: lightBgColor },
    columnStyles: {
      0: { cellWidth: 24, font: 'courier', fontStyle: 'bold' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 42, font: 'courier', halign: 'right' },
      4: { cellWidth: 22, font: 'courier', halign: 'right' },
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 5;

  // Subtotal Card
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, cursorY, contentWidth, 32, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Direct Measurement Subtotal:', margin + 6, cursorY + 6);
  doc.text(
    sanitizeEngineeringSymbols(`${workspace.currency} ${boqResult.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`),
    margin + contentWidth - 6,
    cursorY + 6,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.text(`+ Physical Contingency Reserve (${boqResult.contingencyPercent}%):`, margin + 6, cursorY + 12);
  doc.text(
    sanitizeEngineeringSymbols(`${workspace.currency} ${boqResult.contingencyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`),
    margin + contentWidth - 6,
    cursorY + 12,
    { align: 'right' }
  );

  doc.text(`+ Contractor Profit & Overhead CP&OH (${boqResult.contractorOverheadPercent}%):`, margin + 6, cursorY + 18);
  doc.text(
    sanitizeEngineeringSymbols(`${workspace.currency} ${boqResult.contractorOverheadAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`),
    margin + contentWidth - 6,
    cursorY + 18,
    { align: 'right' }
  );

  doc.text(`+ Statutory VAT / Tax (${boqResult.vatTaxPercent}%):`, margin + 6, cursorY + 24);
  doc.text(
    sanitizeEngineeringSymbols(`${workspace.currency} ${boqResult.vatTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`),
    margin + contentWidth - 6,
    cursorY + 24,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ESTIMATED GRAND TOTAL TENDER SUM:', margin + 6, cursorY + 29.5);
  doc.text(
    sanitizeEngineeringSymbols(`${workspace.currency} ${boqResult.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`),
    margin + contentWidth - 6,
    cursorY + 29.5,
    { align: 'right' }
  );

  cursorY += 37;

  // S-Curve & Cash Flow summary box on Page 1 if available
  if (cashFlow && cursorY + 28 < pageHeight - 36) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(margin, cursorY, contentWidth, 24, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('CASH FLOW & S-CURVE FORECAST MILESTONES', margin + 4, cursorY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(
      sanitizeEngineeringSymbols(
        `Project Duration: ${cashFlow.totalProjectMonths} Months | Retainage: ${cashFlow.retainagePercent}% | Peak Burn: Month ${cashFlow.peakExpenditureMonth} (${workspace.currency} ${cashFlow.peakExpenditureAmount.toLocaleString()})`
      ),
      margin + 4,
      cursorY + 10
    );

    const mCols = [margin + 4, margin + 48, margin + 96, margin + 142];
    cashFlow.milestones.forEach((m, mIdx) => {
      const colX = mCols[mIdx] || margin + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      doc.text(`${m.percentage}% Milestone`, colX, cursorY + 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(
        sanitizeEngineeringSymbols(`Month ${m.expectedMonth} | ${workspace.currency} ${m.cumulativeAmount.toLocaleString()}`),
        colX,
        cursorY + 20
      );
    });

    cursorY += 28;
  }

  // 3-Signature QA block at bottom of Page 1
  const sigBoxHeight = 24;
  const sigBoxY = Math.max(cursorY + 4, pageHeight - margin - sigBoxHeight - 8);
  if (sigBoxY + sigBoxHeight < pageHeight - 10) {
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, sigBoxY, contentWidth, sigBoxHeight, 1.5, 1.5, 'FD');

    const colWidth = contentWidth / 3;
    const col1X = margin;
    const col2X = margin + colWidth;
    const col3X = margin + 2 * colWidth;

    doc.line(col2X, sigBoxY, col2X, sigBoxY + sigBoxHeight);
    doc.line(col3X, sigBoxY, col3X, sigBoxY + sigBoxHeight);

    // Col 1: Prepared By
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('1. PREPARED BY (QUANTITY SURVEYOR)', col1X + 3, sigBoxY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(sanitizeEngineeringSymbols(userProfile?.fullName || 'Pending Signature'), col1X + 3, sigBoxY + 10);
    doc.setFontSize(5.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.line(col1X + 3, sigBoxY + 16.5, col1X + 42, sigBoxY + 16.5);
    doc.text(`Signature | Date: ${dateStr}`, col1X + 3, sigBoxY + 19.5);

    // Col 2: Checked By
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. CHECKED BY (SENIOR ESTIMATOR)', col2X + 3, sigBoxY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('QA/QC Cost Verification', col2X + 3, sigBoxY + 10);
    doc.setFontSize(5.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.line(col2X + 3, sigBoxY + 16.5, col2X + 42, sigBoxY + 16.5);
    doc.text(`Signature | Date: ${dateStr}`, col2X + 3, sigBoxY + 19.5);

    // Col 3: Approved By
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('3. APPROVED BY (ENGINEER OF RECORD)', col3X + 3, sigBoxY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(
      sanitizeEngineeringSymbols(workspace.engineerOfRecord || userProfile?.fullName || 'Pending Signature'),
      col3X + 3,
      sigBoxY + 10
    );
    doc.setFontSize(5.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.line(col3X + 3, sigBoxY + 16.5, col3X + 42, sigBoxY + 16.5);
    doc.text(`Seal & Sign | Date: ${dateStr}`, col3X + 3, sigBoxY + 19.5);
  }

  // PAGE 2+: FORM B - ITEMIZED BILL OF QUANTITIES (MULTI-PAGE AUTOTABLE)
  doc.addPage();
  cursorY = margin;

  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.roundedRect(margin, cursorY, contentWidth, 14, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FORM B: ITEMIZED BILL OF QUANTITIES (MEASUREMENT BREAKDOWN)', margin + 4, cursorY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(
    sanitizeEngineeringSymbols(
      `Project Code: ${workspace.projectCode} | Submittal Doc Ref: ${docId} | Total Line Items: ${boqResult.items.length}`
    ),
    margin + 4,
    cursorY + 11
  );

  cursorY += 17;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin, bottom: 16 },
    head: [
      [
        'Item #',
        'Description of Works',
        'Nos',
        'Dimensions (L x W x H)',
        'Unit',
        'Billable Qty',
        `Rate (${workspace.currency})`,
        `Total (${workspace.currency})`,
      ],
    ],
    body: boqResult.items.map((it) => {
      const dims =
        it.lengthM > 0 || it.widthM > 0 || it.heightM > 0
          ? `${it.lengthM > 0 ? it.lengthM.toFixed(2) : '-'} x ${it.widthM > 0 ? it.widthM.toFixed(2) : '-'} x ${it.heightM > 0 ? it.heightM.toFixed(2) : '-'}`
          : 'Lump / Direct';
      return [
        sanitizeEngineeringSymbols(it.itemNo),
        sanitizeEngineeringSymbols(it.description),
        String(it.numberOfMembers),
        dims,
        sanitizeEngineeringSymbols(it.unit),
        it.totalBillableQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        it.unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        it.itemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ];
    }),
    theme: 'grid',
    styles: { fontSize: 6.8, cellPadding: 1.8, textColor: darkTextColor },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: lightBgColor },
    columnStyles: {
      0: { cellWidth: 16, font: 'courier', fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 11, halign: 'center' },
      3: { cellWidth: 32, font: 'courier', halign: 'center' },
      4: { cellWidth: 13, font: 'courier', halign: 'center' },
      5: { cellWidth: 21, font: 'courier', halign: 'right' },
      6: { cellWidth: 23, font: 'courier', halign: 'right' },
      7: { cellWidth: 26, font: 'courier', fontStyle: 'bold', halign: 'right' },
    },
  });

  // Optional FORM C: VENDOR BID TABULATION COMPARISON
  if (bidReport && bidReport.lineItems.length > 0) {
    let bidY = (doc as any).lastAutoTable.finalY + 8;
    if (bidY > pageHeight - 50) {
      doc.addPage();
      bidY = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('FORM C: VENDOR BID TABULATION & LOWEST RESPONSIVE BIDDER COMPARISON', margin, bidY);
    bidY += 2.5;

    autoTable(doc, {
      startY: bidY,
      margin: { left: margin, right: margin, bottom: 16 },
      head: [
        [
          'Description',
          'Qty',
          'Eng. Rate',
          sanitizeEngineeringSymbols(bidReport.vendors[0]?.vendorName || 'Vendor 1'),
          sanitizeEngineeringSymbols(bidReport.vendors[1]?.vendorName || 'Vendor 2'),
          sanitizeEngineeringSymbols(bidReport.vendors[2]?.vendorName || 'Vendor 3'),
          'Lowest Bidder',
        ],
      ],
      body: bidReport.lineItems.map((b) => [
        sanitizeEngineeringSymbols(b.itemDescription),
        `${b.quantity} ${sanitizeEngineeringSymbols(b.unit)}`,
        b.engineersRate.toFixed(2),
        b.vendor1Rate.toFixed(2),
        b.vendor2Rate.toFixed(2),
        b.vendor3Rate.toFixed(2),
        sanitizeEngineeringSymbols(`${b.lowestVendorName} (${b.lowestRate.toFixed(2)})`),
      ]),
      theme: 'grid',
      styles: { fontSize: 6.5, cellPadding: 1.6, textColor: darkTextColor },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: lightBgColor },
    });
  }

  // Running Footers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(
      sanitizeEngineeringSymbols(
        `BD. CivilLab Tender Submittal Engine | Ref: ${docId} | Governing Code: ${workspace.governingCode}`
      ),
      margin,
      pageHeight - 6.5
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6.5,
      { align: 'right' }
    );
  }

  // Save PDF
  const sanitizedProject = workspace.projectCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Tender_BOQ_${sanitizedProject}_${docId}.pdf`;
  doc.save(filename);

  return docId;
}

