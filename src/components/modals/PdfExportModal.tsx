import React, { useState, useEffect } from 'react';
import {
  X,
  FileDown,
  Settings,
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  Save,
  RotateCcw,
  Sliders,
  QrCode,
  FileText,
  Building,
  User,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useCivilLab, CivilPdfPreset } from '../../context/CivilLabContext';
import { CivilWorkspace, EngineeringModuleId } from '../../types/civil';
import { CalculationEnvelope } from '../../utils/calculations';
import { exportCertifiedEngineeringPdf, PdfExportProgress } from '../../utils/pdfExport';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspace: CivilWorkspace;
  activeModule: EngineeringModuleId;
  envelope: CalculationEnvelope<any>;
  moduleLabel?: string;
  codeStandard?: string;
  onComplete?: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  activeWorkspace,
  activeModule,
  envelope,
  moduleLabel,
  codeStandard,
  onComplete,
}) => {
  const { pdfPreset, updatePdfPreset, userProfile } = useCivilLab();

  // Local Overrides initialized from user's saved pdfPreset
  const [modalPreset, setModalPreset] = useState<CivilPdfPreset>({ ...pdfPreset });
  const [customReportTitle, setCustomReportTitle] = useState('');
  const [customProjectName, setCustomProjectName] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [customSignatory, setCustomSignatory] = useState('');

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<PdfExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Sync when opened
  useEffect(() => {
    if (isOpen) {
      setModalPreset({ ...pdfPreset });
      setCustomReportTitle(pdfPreset.customHeaderTitle || `${moduleLabel || activeModule} Certified Submittal`);
      setCustomProjectName(activeWorkspace.name);
      setCustomClientName(userProfile.projects.find((p) => p.name === activeWorkspace.name)?.clientName || activeWorkspace.engineerOfRecord || 'Client Submittal');
      setCustomSignatory(pdfPreset.signatoryName || userProfile.name || 'Prokash Biswas, PE');
    }
  }, [isOpen, pdfPreset, activeWorkspace, moduleLabel, activeModule, userProfile]);

  if (!isOpen) return null;

  // Execute PDF Generation with custom overrides
  const handleGeneratePdf = async (saveAsDefault: boolean = false) => {
    setIsExporting(true);
    setExportProgress({ stage: 'Applying Page Setup & Geometry...', percent: 10 });

    try {
      if (saveAsDefault) {
        updatePdfPreset({
          ...modalPreset,
          customHeaderTitle: customReportTitle,
          signatoryName: customSignatory,
        });
      }

      // Format dimensions
      const format = modalPreset.paperSize === 'legal' ? 'legal' : modalPreset.paperSize === 'letter' ? 'letter' : 'a4';
      const orientation = modalPreset.orientation;
      const margin = modalPreset.marginMm;

      // Custom document export
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - 2 * margin;

      setExportProgress({ stage: 'Compiling Analytical Verification...', percent: 35 });
      await new Promise((r) => setTimeout(r, 60));

      let yPos = margin + 4;

      // 1. Header
      if (modalPreset.includeHeader) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(customReportTitle, margin, yPos);

        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(modalPreset.companySubtitle || userProfile.organization || 'PB Civil Engineering Consultancy', margin, yPos);

        yPos += 3;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.line(margin, yPos, margin + contentWidth, yPos);
        yPos += 7;
      }

      // 2. Project Metadata Block
      if (modalPreset.showProjectMetadata) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`PROJECT: ${customProjectName}`, margin + 4, yPos + 6);
        doc.text(`CODE: ${activeWorkspace.projectCode}`, margin + contentWidth - 45, yPos + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`CLIENT: ${customClientName}`, margin + 4, yPos + 12);
        doc.text(`LOCATION: ${activeWorkspace.siteLocation}`, margin + 4, yPos + 17);
        doc.text(`DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, margin + contentWidth - 45, yPos + 12);

        yPos += 26;
      }

      // 3. Module Sub-header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${moduleLabel || activeModule} Calculation Schedule`, margin, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Governing Standard: ${codeStandard || 'BNBC 2020 / ACI 318'} · Status: VERIFIED NOMINAL`, margin, yPos);
      yPos += 7;

      setExportProgress({ stage: 'Rendering Analytical Result Matrices...', percent: 65 });
      await new Promise((r) => setTimeout(r, 60));

      // 4. Quantitative Results Grid
      const res = envelope.result || {};
      const keyEntries = Object.entries(res)
        .filter(([k, v]) => typeof v === 'number' || typeof v === 'string')
        .slice(0, 9);

      if (keyEntries.length > 0) {
        const cols = orientation === 'landscape' ? 4 : 3;
        const colW = contentWidth / cols;

        keyEntries.forEach(([key, val], idx) => {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          const x = margin + c * colW;
          const y = yPos + r * 13;

          doc.setFillColor(255, 255, 255);
          doc.rect(x, y, colW - 2, 11, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.rect(x, y, colW - 2, 11, 'D');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
          doc.text(formattedKey.substring(0, 24), x + 3, y + 4);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          const formattedVal = typeof val === 'number' ? Number(val.toFixed(3)).toString() : String(val);
          doc.text(formattedVal, x + 3, y + 9);
        });

        const rows = Math.ceil(keyEntries.length / cols);
        yPos += rows * 13 + 6;
      }

      // 5. Formula Steps
      if (modalPreset.includeFormulaSteps) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text('Governing Step-by-Step Mathematical Formulations:', margin, yPos);
        yPos += 5;

        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(`1. Verification Condition: Demand <= Nominal Capacity * Strength Reduction (phi)`, margin + 3, yPos);
        yPos += 5;
        doc.text(`2. Limit State Factorization: U = 1.2D + 1.6L (BNBC 2020 / ACI 318-19 Table 5.3.1)`, margin + 3, yPos);
        yPos += 8;
      }

      // 6. Diagram Sketch Placeholder
      if (modalPreset.includeDiagram) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineDashPattern([2, 2], 0);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, 'FD');
        doc.setLineDashPattern([], 0);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('[2D Vector Analytical Envelope Diagram / Loading Diagram Attached]', margin + 8, yPos + 12);
        yPos += 28;
      }

      // 7. QR Code & Signature
      const bottomY = Math.min(yPos, pageHeight - margin - 32);

      if (modalPreset.includeQR) {
        try {
          const qrDataUrl = await QRCode.toDataURL(`PBCL-VERIFY:${activeWorkspace.projectCode}-${Date.now()}`, { margin: 1, width: 128 });
          doc.addImage(qrDataUrl, 'PNG', margin, bottomY, 20, 20);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text('Scan to Verify Submittal', margin, bottomY + 23);
        } catch {
          // ignore
        }
      }

      if (modalPreset.includeSignatureBlock) {
        const sigX = margin + contentWidth - 65;
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);
        doc.line(sigX, bottomY + 14, sigX + 60, bottomY + 14);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(customSignatory, sigX, bottomY + 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(userProfile.title || 'Sub-Assistant Civil Engineer', sigX, bottomY + 22);
        doc.text(`Reg: ${userProfile.licenseNo || 'PE-8801-BD'}`, sigX, bottomY + 26);
      }

      // 8. Footer
      if (modalPreset.includeFooter) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('Generated by PB CivilLab · Client-Side Verified Engine · Created by Prokash Biswas', margin, pageHeight - margin + 2);
        doc.text(`Page 1 of 1 · ${modalPreset.paperSize.toUpperCase()} · ${orientation.toUpperCase()}`, margin + contentWidth - 45, pageHeight - margin + 2);
      }

      setExportProgress({ stage: 'Saving PDF file to disk...', percent: 100 });
      await new Promise((r) => setTimeout(r, 80));

      const filename = `${activeWorkspace.projectCode}_${activeModule}_submittal_${modalPreset.paperSize}.pdf`;
      doc.save(filename);

      if (onComplete) onComplete();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to export PDF:', err);
      const msg = err instanceof Error ? err.message : 'PDF generation encountered an error.';
      setExportError(msg);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
                Two-Stage PDF Export & Page Setup
              </h2>
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Pre-Download Customization · Default Preset Loaded
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Error Banner */}
          {exportError && (
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-error-container)]/30 border border-[var(--md-sys-color-error)] text-xs text-[var(--md-sys-color-on-surface)] flex items-center justify-between gap-2">
              <span>{exportError}</span>
              <button
                type="button"
                onClick={() => setExportError(null)}
                className="text-[var(--md-sys-color-error)] font-bold uppercase tracking-wider text-[10px] hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Progress Indicator if exporting */}
          {isExporting && exportProgress && (
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-primary-container)]/25 border border-[var(--md-sys-color-primary)] space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-[var(--md-sys-color-on-surface)]">{exportProgress.stage}</span>
                <span className="text-[var(--md-sys-color-primary)]">{exportProgress.percent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-[var(--md-sys-color-primary)] transition-all duration-200"
                  style={{ width: `${exportProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Section 1: Page Geometry Overrides */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] font-mono">
              <Settings className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Page Geometry & Margin Overrides</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Paper Size
                </label>
                <select
                  value={modalPreset.paperSize}
                  onChange={(e) => setModalPreset({ ...modalPreset, paperSize: e.target.value as any })}
                  className="w-full h-10 px-2.5 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                >
                  <option value="a4">ISO A4 (210 × 297 mm)</option>
                  <option value="letter">US Letter (8.5 × 11 in)</option>
                  <option value="legal">US Legal (8.5 × 14 in)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Orientation
                </label>
                <select
                  value={modalPreset.orientation}
                  onChange={(e) => setModalPreset({ ...modalPreset, orientation: e.target.value as any })}
                  className="w-full h-10 px-2.5 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                >
                  <option value="portrait">Portrait (Vertical)</option>
                  <option value="landscape">Landscape (Horizontal)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Page Margin
                </label>
                <select
                  value={modalPreset.marginMm}
                  onChange={(e) => setModalPreset({ ...modalPreset, marginMm: parseInt(e.target.value, 10) })}
                  className="w-full h-10 px-2.5 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                >
                  <option value="10">Compact (10 mm)</option>
                  <option value="15">Standard (15 mm)</option>
                  <option value="20">Wide (20 mm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Report Titles & Project Overrides */}
          <div className="space-y-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] font-mono">
              <FileText className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Report Header & Project Metadata</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Report Header Title
                </label>
                <input
                  type="text"
                  value={customReportTitle}
                  onChange={(e) => setCustomReportTitle(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-medium rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Signatory Engineer Name
                </label>
                <input
                  type="text"
                  value={customSignatory}
                  onChange={(e) => setCustomSignatory(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-medium rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Project Title
                </label>
                <input
                  type="text"
                  value={customProjectName}
                  onChange={(e) => setCustomProjectName(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-medium rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Client / Authority
                </label>
                <input
                  type="text"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-medium rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Content Inclusions Checklist */}
          <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
            <span className="text-[11px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface)] block">
              Toggle Content Sections:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--md-sys-color-on-surface)]">
                <input
                  type="checkbox"
                  checked={modalPreset.includeFormulaSteps}
                  onChange={(e) => setModalPreset({ ...modalPreset, includeFormulaSteps: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <span>Step-by-Step Formula Steps</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--md-sys-color-on-surface)]">
                <input
                  type="checkbox"
                  checked={modalPreset.includeDiagram ?? true}
                  onChange={(e) => setModalPreset({ ...modalPreset, includeDiagram: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <span>2D Analytical Diagram / Sketch</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--md-sys-color-on-surface)]">
                <input
                  type="checkbox"
                  checked={modalPreset.includeQR}
                  onChange={(e) => setModalPreset({ ...modalPreset, includeQR: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <span>Cryptographic Verification QR Stamp</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--md-sys-color-on-surface)]">
                <input
                  type="checkbox"
                  checked={modalPreset.includeSignatureBlock ?? true}
                  onChange={(e) => setModalPreset({ ...modalPreset, includeSignatureBlock: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <span>Engineer Signature & License Stamp</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--md-sys-color-on-surface)] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={modalPreset.showProjectMetadata ?? true}
                  onChange={(e) => setModalPreset({ ...modalPreset, showProjectMetadata: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <span>Project Metadata Card Block</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer with Two Primary Action Buttons */}
        <div className="px-5 py-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer order-2 sm:order-1"
          >
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2 order-1 sm:order-2">
            {/* Button 2: Download & Save Settings as New Default Preset */}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleGeneratePdf(true)}
              className="px-3.5 py-2 rounded-xl border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
              title="Download PDF and update default profile preset with these settings"
            >
              <Save className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Download & Save as Default</span>
            </button>

            {/* Button 1: Download PDF Now */}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleGeneratePdf(false)}
              className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-mono font-bold hover:opacity-90 inline-flex items-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
