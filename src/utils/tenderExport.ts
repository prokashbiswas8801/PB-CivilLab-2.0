import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  CivilWorkspace,
  UserProfile,
  TakeoffLineItem,
} from '../types/civil';
import { BOQResult, ComputedTakeoffItem } from './calculations';
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
import { BRAND_LOGO_BASE64 } from '../assets/brandLogoData';

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
  lines.push(`"PB CIVILLAB - OFFICIAL TENDER BILL OF QUANTITIES (BOQ)"`);
  lines.push(`"Project Name:","${workspace.name}"`);
  lines.push(`"Project Code:","${workspace.projectCode}"`);
  lines.push(`"Site Location:","${workspace.siteLocation}"`);
  lines.push(`"Engineer of Record:","${workspace.engineerOfRecord}"`);
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

  const csvContent = lines.join('\r\n');
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
 * Generates Official Multi-Page Tender BOQ Submittal PDF (Form A Grand Summary & Form B Priced Schedule)
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

  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://ais-dev-c54uoao5og26sxud7v2lhx-26469248367.asia-southeast1.run.app';

  // Build verified report record & persist in registry
  const envelope = {
    status: 'valid' as const,
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

  const primaryColor = [30, 64, 175];
  const darkTextColor = [15, 23, 42];
  const mutedTextColor = [71, 85, 105];
  const lightBgColor = [248, 250, 252];
  const borderColor = [203, 213, 225];

  // PAGE 1: COVER & FORM A - GRAND SUMMARY OF BILL OF QUANTITIES
  let cursorY = margin;

  // Header Banner
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, cursorY, contentWidth, 32, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.4);

  // Brand Logo Icon
  try {
    doc.addImage(BRAND_LOGO_BASE64, 'JPEG', margin + 4, cursorY + 4, 24, 24);
  } catch {
    // continue
  }

  const textX = margin + 32;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PB CivilLab · Tender Management Suite', textX, cursorY + 8);

  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.setFontSize(7);
  doc.text('OFFICIAL TENDER BILL OF QUANTITIES & WORK BREAKDOWN SCHEDULE', textX, cursorY + 13);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Project: ${workspace.name} [${workspace.projectCode}] · Site: ${workspace.siteLocation}`, textX, cursorY + 19);

  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Governing Standard: ${workspace.governingCode} · Currency: ${workspace.currency} · Date: ${dateStr}`, textX, cursorY + 25);

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

  cursorY += 38;

  // FORM A: GRAND SUMMARY TITLE
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, cursorY, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FORM A: GRAND SUMMARY OF BILL OF QUANTITIES (WBS CHAPTERS)', margin + 4, cursorY + 4.8);

  cursorY += 7;

  // Table Header
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, cursorY, contentWidth, 6, 'FD');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('WBS Code', margin + 3, cursorY + 4.2);
  doc.text('Chapter Description', margin + 25, cursorY + 4.2);
  doc.text('Lines', margin + 115, cursorY + 4.2, { align: 'center' });
  doc.text(`Subtotal (${workspace.currency})`, margin + 155, cursorY + 4.2, { align: 'right' });
  doc.text('% Share', margin + contentWidth - 4, cursorY + 4.2, { align: 'right' });

  cursorY += 6;

  // Table Body Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  const summaries = boqResult.wbsSectionSummaries && boqResult.wbsSectionSummaries.length > 0
    ? boqResult.wbsSectionSummaries
    : boqResult.categorySummaries.map((c) => ({
        code: c.category.toUpperCase().slice(0, 3),
        title: `${c.category.toUpperCase()} Trade Works`,
        itemCount: c.itemCount,
        subtotal: c.subtotal,
        percentageOfSubtotal: c.percentageOfSubtotal,
      }));

  summaries.forEach((s) => {
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, cursorY + 5.5, margin + contentWidth, cursorY + 5.5);

    doc.setFont('courier', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Sec ${s.code}`, margin + 3, cursorY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(doc.splitTextToSize(s.title, 85)[0] || s.title, margin + 25, cursorY + 4);

    doc.text(String(s.itemCount), margin + 115, cursorY + 4, { align: 'center' });
    doc.setFont('courier', 'normal');
    doc.text(s.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), margin + 155, cursorY + 4, { align: 'right' });
    doc.text(`${s.percentageOfSubtotal.toFixed(1)}%`, margin + contentWidth - 4, cursorY + 4, { align: 'right' });

    cursorY += 6;
  });

  cursorY += 2;

  // Subtotal Card
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, cursorY, contentWidth, 32, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Direct Measurement Subtotal:', margin + 6, cursorY + 6);
  doc.text(`${workspace.currency} ${boqResult.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + contentWidth - 6, cursorY + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`+ Physical Contingency Reserve (${boqResult.contingencyPercent}%):`, margin + 6, cursorY + 12);
  doc.text(`${workspace.currency} ${boqResult.contingencyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + contentWidth - 6, cursorY + 12, { align: 'right' });

  doc.text(`+ Contractor Profit & Overhead CP&OH (${boqResult.contractorOverheadPercent}%):`, margin + 6, cursorY + 18);
  doc.text(`${workspace.currency} ${boqResult.contractorOverheadAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + contentWidth - 6, cursorY + 18, { align: 'right' });

  doc.text(`+ Statutory VAT / Tax (${boqResult.vatTaxPercent}%):`, margin + 6, cursorY + 24);
  doc.text(`${workspace.currency} ${boqResult.vatTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + contentWidth - 6, cursorY + 24, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ESTIMATED GRAND TOTAL TENDER SUM:', margin + 6, cursorY + 29.5);
  doc.text(`${workspace.currency} ${boqResult.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + contentWidth - 6, cursorY + 29.5, { align: 'right' });

  cursorY += 38;

  // S-Curve & Cash Flow summary box on Page 1 if available
  if (cashFlow) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.rect(margin, cursorY, contentWidth, 24, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('CASH FLOW & S-CURVE FORECAST MILESTONES', margin + 4, cursorY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(
      `Project Duration: ${cashFlow.totalProjectMonths} Months · Retainage: ${cashFlow.retainagePercent}% · Peak Burn: Month ${cashFlow.peakExpenditureMonth} (${workspace.currency} ${cashFlow.peakExpenditureAmount.toLocaleString()})`,
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
      doc.text(`Month ${m.expectedMonth} · ${workspace.currency} ${m.cumulativeAmount.toLocaleString()}`, colX, cursorY + 20);
    });

    cursorY += 28;
  }

  // 3-Signature QA block at bottom of Page 1
  const sigBoxHeight = 24;
  const sigBoxY = pageHeight - margin - sigBoxHeight - 4;

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, sigBoxY, contentWidth, sigBoxHeight, 'FD');

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
  doc.text(userProfile?.fullName || 'Project QS / Cost Estimator', col1X + 3, sigBoxY + 10);
  doc.setFontSize(5.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Signature: ________________  Date: ${dateStr}`, col1X + 3, sigBoxY + 19);

  // Col 2: Checked By
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. CHECKED BY (SENIOR ESTIMATOR)', col2X + 3, sigBoxY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Lead Civil Contracts Engineer', col2X + 3, sigBoxY + 10);
  doc.setFontSize(5.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Signature: ________________  Date: ${dateStr}`, col2X + 3, sigBoxY + 19);

  // Col 3: Approved By
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. APPROVED BY (ENGINEER OF RECORD)', col3X + 3, sigBoxY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(workspace.engineerOfRecord || userProfile?.fullName || 'Licensed Professional Engineer', col3X + 3, sigBoxY + 10);
  doc.setFontSize(5.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Seal & Sign: _____________  Date: ${dateStr}`, col3X + 3, sigBoxY + 19);

  // Footer Page 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`PB CivilLab Tender Submittal Engine · Ref: ${docId} · ISO 9001 Protocol · Page 1 of 2`, margin, pageHeight - margin + 2);
  doc.text('CONFIDENTIAL · STRICTLY FOR TENDER BIDDING & PERMIT SUBMISSION', pageWidth - margin - 80, pageHeight - margin + 2);

  // PAGE 2: FORM B - ITEMIZED BILL OF QUANTITIES
  doc.addPage();
  cursorY = margin;

  // Mini Header on Page 2
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, cursorY, contentWidth, 14, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FORM B: ITEMIZED BILL OF QUANTITIES (MEASUREMENT BREAKDOWN)', margin + 4, cursorY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Project Code: ${workspace.projectCode} · Submittal Doc Ref: ${docId} · Total Items: ${boqResult.items.length}`, margin + 4, cursorY + 11);

  cursorY += 17;

  // Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, cursorY, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Item #', margin + 2, cursorY + 4.2);
  doc.text('Description of Works', margin + 22, cursorY + 4.2);
  doc.text('Nos', margin + 98, cursorY + 4.2, { align: 'center' });
  doc.text('Unit', margin + 112, cursorY + 4.2, { align: 'center' });
  doc.text('Billable Qty', margin + 134, cursorY + 4.2, { align: 'right' });
  doc.text(`Rate (${workspace.currency})`, margin + 156, cursorY + 4.2, { align: 'right' });
  doc.text(`Total (${workspace.currency})`, margin + contentWidth - 3, cursorY + 4.2, { align: 'right' });

  cursorY += 6;

  // Render items (up to 28 items fit cleanly per page)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  boqResult.items.slice(0, 28).forEach((it) => {
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, cursorY + 5.5, margin + contentWidth, cursorY + 5.5);

    doc.setFont('courier', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(it.itemNo, margin + 2, cursorY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    const cleanDesc = doc.splitTextToSize(it.description, 72)[0] || it.description;
    doc.text(cleanDesc, margin + 22, cursorY + 4);

    doc.text(String(it.numberOfMembers), margin + 98, cursorY + 4, { align: 'center' });
    doc.setFont('courier', 'bold');
    doc.text(it.unit, margin + 112, cursorY + 4, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.text(it.totalBillableQty.toLocaleString(undefined, { minimumFractionDigits: 1 }), margin + 134, cursorY + 4, { align: 'right' });
    doc.text(it.unitRate.toLocaleString(undefined, { minimumFractionDigits: 2 }), margin + 156, cursorY + 4, { align: 'right' });
    doc.setFont('courier', 'bold');
    doc.text(it.itemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), margin + contentWidth - 3, cursorY + 4, { align: 'right' });

    cursorY += 6;
  });

  // Footer Page 2
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`PB CivilLab Tender Submittal Engine · Ref: ${docId} · ISO 9001 Protocol · Page 2 of 2`, margin, pageHeight - margin + 2);
  doc.text('OFFICIAL TENDER BILL OF QUANTITIES · AUTHORITATIVE ESTIMATE', pageWidth - margin - 80, pageHeight - margin + 2);

  // Save PDF
  const sanitizedProject = workspace.projectCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Tender_BOQ_${sanitizedProject}_${docId}.pdf`;
  doc.save(filename);

  return docId;
}
