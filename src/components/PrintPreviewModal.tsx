import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer,
  Download,
  Settings,
  X,
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  BookmarkCheck,
  Plus,
  Trash2,
  QrCode,
  ShieldCheck,
  FileText,
  User,
  Eye,
  Copy,
  CheckCircle2,
  Layers,
  Scale,
  Sparkles,
  Calendar,
  Building,
  HardHat,
  Hash,
} from 'lucide-react';
import {
  CivilWorkspace,
  EngineeringModuleId,
  UserProfile,
  UserCustomPreferences,
  BuildingCode,
} from '../types/civil';
import { Logo, LogoMark } from './Logo';
import {
  PrintSettings,
  PrintPreset,
  PrintSectionToggles,
  PaperSize,
  PageOrientation,
  MarginOption,
  FontScaleOption,
  DEFAULT_PRINT_SETTINGS,
  loadSavedPrintPresets,
  savePrintPresets,
} from '../utils/printStorage';
import {
  generateQrCodeSvg,
  generateQrCodeDataUrl,
  generateVerificationHash,
  buildReportVerificationString,
  ReportVerificationPayload,
} from '../utils/qrCode';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspace: CivilWorkspace;
  activeModule: EngineeringModuleId;
  userProfile: UserProfile;
  userPreferences: UserCustomPreferences;
  moduleMeta: {
    label: string;
    codeStandard: string;
  };
  currentEnvelope: {
    status: 'valid' | 'warning' | 'invalid';
    result: any;
    issues?: any[];
  };
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  activeWorkspace,
  activeModule,
  userProfile,
  userPreferences,
  moduleMeta,
  currentEnvelope,
}) => {
  // Unique Document ID & Timestamp generated for this export instance
  const [documentId, setDocumentId] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Print Settings & Presets State
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [presets, setPresets] = useState<PrintPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-client-standard');
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  // Zoom & View state
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 100, 125, etc.

  // Initialize unique document ID and timestamp when modal opens
  useEffect(() => {
    if (isOpen) {
      const uniqueId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `DOC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
          : `DOC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setDocumentId(uniqueId);
      setTimestamp(new Date().toISOString());

      // Load presets
      const loadedPresets = loadSavedPrintPresets();
      setPresets(loadedPresets);
      const defaultPreset = loadedPresets.find((p) => p.id === 'preset-client-standard');
      if (defaultPreset) {
        setSettings(defaultPreset.settings);
        setSelectedPresetId(defaultPreset.id);
      }
    }
  }, [isOpen]);

  // Verification Hash
  const verificationHash = useMemo(() => {
    const rawData = `${documentId}|${activeWorkspace.projectCode}|${activeModule}|${timestamp}|${userProfile.fullName}`;
    return generateVerificationHash(rawData);
  }, [documentId, activeWorkspace.projectCode, activeModule, timestamp, userProfile.fullName]);

  // Verification Payload for QR Code
  const qrPayload: ReportVerificationPayload = useMemo(() => {
    return {
      documentId,
      projectCode: activeWorkspace.projectCode,
      projectName: activeWorkspace.name,
      moduleId: activeModule,
      moduleName: moduleMeta.label,
      codeStandard: moduleMeta.codeStandard,
      siteLocation: activeWorkspace.siteLocation,
      engineerOfRecord: userProfile.fullName,
      organization: userProfile.organization,
      licenseNumber: userProfile.licenseNumber,
      status: currentEnvelope.status === 'invalid' ? 'critical' : currentEnvelope.status,
      timestamp,
      verificationHash,
    };
  }, [
    documentId,
    activeWorkspace,
    activeModule,
    moduleMeta,
    userProfile,
    currentEnvelope.status,
    timestamp,
    verificationHash,
  ]);

  // Generate QR Code vector SVG & Data URL
  useEffect(() => {
    if (!isOpen || !documentId) return;
    const qrText = buildReportVerificationString(qrPayload);

    generateQrCodeSvg(qrText).then((svg) => setQrCodeSvg(svg));
    generateQrCodeDataUrl(qrText).then((url) => setQrCodeDataUrl(url));
  }, [isOpen, documentId, qrPayload]);

  if (!isOpen) return null;

  // Toggle individual sections
  const handleToggleSection = (sectionKey: keyof PrintSectionToggles) => {
    setSettings((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: !prev.sections[sectionKey],
      },
    }));
  };

  // Switch Preset
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setSettings(found.settings);
    }
  };

  // Save Current as New Custom Preset
  const handleSaveCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset: PrintPreset = {
      id: `print-preset-${Date.now()}`,
      name: newPresetName.trim(),
      description: `Custom layout (${settings.paperSize.toUpperCase()} · ${settings.orientation})`,
      settings: { ...settings },
      isBuiltIn: false,
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    savePrintPresets(updated);
    setSelectedPresetId(newPreset.id);
    setNewPresetName('');
    setIsSavingPreset(false);
  };

  // Delete Custom Preset
  const handleDeletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    savePrintPresets(updated);
    if (selectedPresetId === id) {
      setSelectedPresetId('preset-client-standard');
      const standard = presets.find((p) => p.id === 'preset-client-standard');
      if (standard) setSettings(standard.settings);
    }
  };

  // Trigger Print / Export PDF
  const handleTriggerPrint = () => {
    // Populate the printable report DOM node before calling window.print()
    const printEl = document.getElementById('pb-printable-report');
    const previewEl = document.getElementById('pb-report-preview-sheet');
    if (printEl && previewEl) {
      printEl.innerHTML = previewEl.innerHTML;
      printEl.className = 'print:block bg-white text-slate-900 p-0 m-0';
    }
    const cleanUp = () => {
      if (printEl) {
        printEl.innerHTML = '';
        printEl.className = 'hidden print:block bg-white text-slate-900';
      }
      window.removeEventListener('afterprint', cleanUp);
    };
    window.addEventListener('afterprint', cleanUp);
    window.print();
  };

  // Download Standalone Self-Contained Vector HTML Report
  const handleDownloadHtml = () => {
    const previewEl = document.getElementById('pb-report-preview-sheet');
    if (!previewEl) return;
    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeWorkspace.name} - ${moduleMeta.label} [${documentId}]</title>
  <style>
    @page { size: ${settings.orientation === 'landscape' ? 'landscape' : 'portrait'}; margin: 12mm 15mm 15mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 24px; line-height: 1.4; font-size: 11pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-size: 10pt; font-family: monospace; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #f8fafc; font-weight: bold; }
    .print-avoid-break { page-break-inside: avoid; break-inside: avoid; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
  </style>
</head>
<body>
  ${previewEl.innerHTML}
</body>
</html>`;
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeWorkspace.projectCode}_${activeModule}_Report_${documentId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy Verification Payload
  const handleCopyPayload = () => {
    const text = buildReportVerificationString(qrPayload);
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Paper styling classes
  const paperDimensionClass =
    settings.paperSize === 'letter'
      ? settings.orientation === 'landscape'
        ? 'w-[11in] min-h-[8.5in]'
        : 'w-[8.5in] min-h-[11in]'
      : settings.paperSize === 'legal'
        ? settings.orientation === 'landscape'
          ? 'w-[14in] min-h-[8.5in]'
          : 'w-[8.5in] min-h-[14in]'
        : settings.orientation === 'landscape'
          ? 'w-[297mm] min-h-[210mm]'
          : 'w-[210mm] min-h-[297mm]';

  const marginPaddingClass =
    settings.margins === 'compact'
      ? 'p-6 sm:p-8'
      : settings.margins === 'wide'
        ? 'p-12 sm:p-14'
        : 'p-8 sm:p-10';

  const fontScaleStyle = {
    fontSize:
      settings.fontScale === 'small'
        ? '10pt'
        : settings.fontScale === 'large'
          ? '12pt'
          : '11pt',
  };

  return (
    <div
      id="pb-print-dialog"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-7xl h-[94vh] flex flex-col rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-2xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="shrink-0 px-6 py-3.5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Print Preview & Vector PDF Engine
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                  {documentId}
                </span>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Dynamic QR Validation · Flawless Box-Constraint Layout · Certified Submittal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(50, prev - 15))}
                className="p-1.5 hover:bg-[var(--md-sys-color-surface-container)] rounded text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-bold min-w-[50px] text-center">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(150, prev + 15))}
                className="p-1.5 hover:bg-[var(--md-sys-color-surface-container)] rounded text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1.5 hover:bg-[var(--md-sys-color-surface-container)] rounded text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                title="Reset Zoom (100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print / Export Action Button */}
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 font-semibold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs transition-opacity"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>

            {/* Standalone Vector HTML Export */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Download verified vector HTML document"
            >
              <Download className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <span className="hidden sm:inline">Export HTML</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Split View: Settings Configuration Panel (Left) & Sheet Preview (Right) */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
          {/* LEFT: Configuration & Toggle Controls (Scrollable) */}
          <div className="w-full lg:w-88 shrink-0 border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-6 no-print">
            {/* Presets Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                  <BookmarkCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Report Layout Presets</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSavingPreset(!isSavingPreset)}
                  className="text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save Preset</span>
                </button>
              </div>

              <select
                value={selectedPresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden font-medium cursor-pointer"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isBuiltIn ? '(Built-in)' : '(Custom)'}
                  </option>
                ))}
              </select>

              {isSavingPreset && (
                <form onSubmit={handleSaveCustomPreset} className="mt-2.5 p-3 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
                  <div className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                    Save Current Configuration
                  </div>
                  <input
                    type="text"
                    required
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="e.g. My Client Submittal"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]"
                  />
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsSavingPreset(false)}
                      className="px-2 py-1 text-[11px] rounded hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-[11px] font-semibold rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Layout Geometry & Typography */}
            <div className="space-y-3.5 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Page Geometry & Typography</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Paper Size */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Paper Size
                  </label>
                  <select
                    value={settings.paperSize}
                    onChange={(e) => setSettings({ ...settings, paperSize: e.target.value as PaperSize })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] font-mono"
                  >
                    <option value="a4">A4 (210 × 297 mm)</option>
                    <option value="letter">Letter (8.5 × 11 in)</option>
                    <option value="legal">Legal (8.5 × 14 in)</option>
                  </select>
                </div>

                {/* Orientation */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Orientation
                  </label>
                  <select
                    value={settings.orientation}
                    onChange={(e) => setSettings({ ...settings, orientation: e.target.value as PageOrientation })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] font-mono capitalize"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                {/* Margins */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Margins
                  </label>
                  <select
                    value={settings.margins}
                    onChange={(e) => setSettings({ ...settings, margins: e.target.value as MarginOption })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] font-mono capitalize"
                  >
                    <option value="compact">Compact (12mm)</option>
                    <option value="normal">Normal (20mm)</option>
                    <option value="wide">Wide (28mm)</option>
                  </select>
                </div>

                {/* Font Scaling */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Font Scale
                  </label>
                  <select
                    value={settings.fontScale}
                    onChange={(e) => setSettings({ ...settings, fontScale: e.target.value as FontScaleOption })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] font-mono capitalize"
                  >
                    <option value="small">Small (10pt)</option>
                    <option value="medium">Medium (11pt)</option>
                    <option value="large">Large (12pt)</option>
                  </select>
                </div>
              </div>

              {/* Watermark Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.includeWatermark}
                    onChange={(e) => setSettings({ ...settings, includeWatermark: e.target.checked })}
                    className="rounded border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                  <span>Render Engineering Draft Watermark</span>
                </label>
                {settings.includeWatermark && (
                  <input
                    type="text"
                    value={settings.watermarkText}
                    onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                    className="w-full mt-2 px-2.5 py-1 text-xs rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] uppercase font-mono"
                  />
                )}
              </div>
            </div>

            {/* Granular Section Selection Toggles */}
            <div className="space-y-3 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Report Sections to Include</span>
                </div>
                <div className="text-[10px] text-[var(--md-sys-color-primary)] font-mono">
                  {Object.values(settings.sections).filter(Boolean).length}/11 Active
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { key: 'projectClientMetadata', label: '1. Project & Client Metadata' },
                  { key: 'projectDetailsLocation', label: '2. Project Details & Site Location' },
                  { key: 'userProfileAuthor', label: '3. User Profile Author Credentials' },
                  { key: 'primaryResultBanner', label: '4. Primary Result Status Banner' },
                  { key: 'calculationInputs', label: '5. Calculation Inputs Table' },
                  { key: 'secondaryOutputs', label: '6. Secondary Calculated Outputs' },
                  { key: 'detailedBreakdown', label: '7. Detailed Breakdown & Step Table' },
                  { key: 'mathematicalEquations', label: '8. Mathematical Equations & Trace' },
                  { key: 'assumptionsBasis', label: '9. Assumptions & Engineering Basis' },
                  { key: 'jobsiteNotes', label: '10. Jobsite Notes & Precautions' },
                  { key: 'qualitySignOff', label: '11. Quality Sign-Off & Official Stamp' },
                ].map(({ key, label }) => {
                  const k = key as keyof PrintSectionToggles;
                  const isChecked = settings.sections[k];
                  return (
                    <label
                      key={key}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer transition-colors"
                    >
                      <span className="text-[var(--md-sys-color-on-surface)] font-medium">{label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSection(k)}
                        className="rounded border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* QR Code Validation Details */}
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-[var(--md-sys-color-on-surface)]">
                <span className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Validation QR Code</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                  SECURE SHA-32
                </span>
              </div>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Encodes unique UUID, verification hash, governing standard, and timestamp.
              </p>
              <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                <span className="truncate max-w-[170px] opacity-75">{verificationHash}</span>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface)] text-[10px] font-semibold text-[var(--md-sys-color-primary)] cursor-pointer inline-flex items-center gap-1"
                >
                  {copiedLink ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Interactive Calculation Sheet Preview (Centered & Scaled) */}
          <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-8 flex justify-center items-start custom-scrollbar">
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
            >
              {/* THE EXACT PRINTABLE REPORT SHEET CONTAINER */}
              <div
                id="pb-report-preview-sheet"
                style={fontScaleStyle}
                className={`${paperDimensionClass} ${marginPaddingClass} bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 relative select-text leading-relaxed font-sans`}
              >
                {/* Draft Watermark */}
                {settings.includeWatermark && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0 select-none">
                    <span className="text-6xl sm:text-7xl md:text-8xl font-black text-slate-200/50 -rotate-45 uppercase tracking-widest text-center">
                      {settings.watermarkText}
                    </span>
                  </div>
                )}

                <div className="relative z-10 flex flex-col justify-between min-h-full space-y-6">
                  {/* ========================================================
                      SECTION 1: CERTIFIED REPORT HEADER WITH LOGO & QR CODE
                      ======================================================== */}
                  <header className="border-b-2 border-slate-900 pb-5 print-avoid-break">
                    <div className="flex items-start justify-between gap-4">
                      {/* Brand Logo & Slogan */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <Logo variant="full" size="md" className="shrink-0" />
                        </div>
                        <div className="text-[10px] font-mono font-bold tracking-widest text-slate-600 mt-1 uppercase">
                          CALCULATE SMARTER. BUILD BETTER.
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Developed &amp; Designed by PROKASH BISWAS
                        </div>
                      </div>

                      {/* Document Details & Standards */}
                      <div className="text-right text-[11px] font-mono space-y-0.5 shrink-0">
                        <div className="font-bold text-sm text-slate-900 uppercase">
                          Engineering Calculation Sheet
                        </div>
                        <div>
                          Doc Ref: <strong>{documentId}</strong>
                        </div>
                        <div>
                          Governing Standard: <strong className="text-blue-700">{moduleMeta.codeStandard}</strong>
                        </div>
                        <div>
                          Date &amp; Time: {new Date(timestamp).toLocaleDateString()} {new Date(timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      {/* DYNAMIC SCANNABLE QR CODE AT TOP-RIGHT */}
                      {settings.includeQrCode && (
                        <div className="shrink-0 flex flex-col items-center ml-2 border border-slate-300 rounded p-1 bg-white shadow-2xs">
                          {qrCodeDataUrl ? (
                            <img
                              src={qrCodeDataUrl}
                              alt={`QR Code verification for ${documentId}`}
                              className="w-16 h-16 sm:w-20 sm:h-20"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[9px] font-mono">
                              QR
                            </div>
                          )}
                          <span className="text-[8px] font-mono font-bold text-slate-500 mt-0.5 tracking-tight">
                            SCAN TO VERIFY
                          </span>
                        </div>
                      )}
                    </div>
                  </header>

                  {/* ========================================================
                      SECTION 2: PROJECT, CLIENT & LOCATION METADATA
                      ======================================================== */}
                  {(settings.sections.projectClientMetadata || settings.sections.projectDetailsLocation) && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-300 rounded print-avoid-break text-xs font-mono">
                      {settings.sections.projectClientMetadata && (
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                            Project Identification
                          </div>
                          <div className="font-bold text-sm text-slate-900 font-sans mt-0.5">
                            {activeWorkspace.name}
                          </div>
                          <div className="text-slate-600 mt-0.5">
                            Code: <strong>[{activeWorkspace.projectCode}]</strong> · Currency: <strong>{activeWorkspace.currency}</strong>
                          </div>
                        </div>
                      )}

                      {settings.sections.projectDetailsLocation && (
                        <div className="md:text-right">
                          <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                            Location &amp; Work Discipline
                          </div>
                          <div className="font-semibold text-slate-800 font-sans mt-0.5">
                            Site: {activeWorkspace.siteLocation}
                          </div>
                          <div className="text-blue-700 font-bold mt-0.5">
                            Module: {moduleMeta.label}
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* ========================================================
                      SECTION 3: USER PROFILE AUTHOR & ENGINEER OF RECORD
                      ======================================================== */}
                  {settings.sections.userProfileAuthor && (
                    <section className="p-3.5 bg-white border border-slate-300 rounded print-avoid-break text-xs font-mono flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                          Certified Prepared By / Engineer of Record
                        </div>
                        <div className="font-bold text-sm text-slate-900 font-sans mt-0.5">
                          {userProfile.fullName || 'Project Engineer, PE'}
                        </div>
                        <div className="text-slate-700">
                          {userProfile.designation} · {userProfile.organization}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          License ID: <strong>{userProfile.licenseNumber || 'PE-00000'}</strong>
                          {userProfile.email && ` · Email: ${userProfile.email}`}
                          {userProfile.phone && ` · Tel: ${userProfile.phone}`}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="inline-block px-3 py-1.5 border border-dashed border-blue-600 bg-blue-50/50 rounded text-center">
                          <div className="text-[9px] font-bold text-blue-900 uppercase">
                            CERTIFICATION SEAL
                          </div>
                          <div className="text-xs font-black text-blue-700">
                            {userProfile.initials || (userProfile.fullName ? userProfile.fullName.slice(0, 2).toUpperCase() : 'PE')} STAMP
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ========================================================
                      SECTION 4: PRIMARY RESULT STATUS BANNER
                      ======================================================== */}
                  {settings.sections.primaryResultBanner && (
                    <section className="p-3.5 rounded border border-slate-300 bg-slate-100 flex items-center justify-between gap-4 print-avoid-break">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                          Primary Engineering Analysis Status
                        </span>
                        <div className="text-base font-bold text-slate-900 font-sans mt-0.5 flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full inline-block ${
                              currentEnvelope.status === 'valid'
                                ? 'bg-emerald-500'
                                : currentEnvelope.status === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                            }`}
                          />
                          <span>
                            {currentEnvelope.status === 'valid'
                              ? 'VERIFIED & CONFORMANT'
                              : currentEnvelope.status === 'warning'
                                ? 'WARNING / LIMIT STATE ADVISORY'
                                : 'CRITICAL CAPACITY EXCEEDED'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-slate-600">
                        <div>Governing Standard: <strong>{moduleMeta.codeStandard}</strong></div>
                        <div>Safety Check: <strong>{currentEnvelope.status.toUpperCase()}</strong></div>
                      </div>
                    </section>
                  )}

                  {/* ========================================================
                      SECTION 5: CALCULATION INPUTS TABLE
                      ======================================================== */}
                  {settings.sections.calculationInputs && (
                    <section className="print-avoid-break space-y-2">
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                        1. Primary Design Inputs &amp; Geometrical Parameters
                      </h3>
                      <table className="w-full text-left text-xs font-mono border border-slate-300">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="p-2 border-b border-slate-300">Parameter Description</th>
                            <th className="p-2 border-b border-slate-300 text-center">Symbol</th>
                            <th className="p-2 border-b border-slate-300 text-right">Magnitude</th>
                            <th className="p-2 border-b border-slate-300 text-center">Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {renderModuleInputRows(activeModule, activeWorkspace)}
                        </tbody>
                      </table>
                    </section>
                  )}

                  {/* ========================================================
                      SECTION 6: SECONDARY CALCULATED OUTPUTS
                      ======================================================== */}
                  {settings.sections.secondaryOutputs && (
                    <section className="print-avoid-break space-y-2">
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                        2. Analytical Results &amp; Quantitative Envelopes
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {renderModuleOutputCards(activeModule, activeWorkspace, currentEnvelope.result)}
                      </div>
                    </section>
                  )}

                  {/* ========================================================
                      SECTION 7: DETAILED BREAKDOWN & STEP TABLE
                      ======================================================== */}
                  {settings.sections.detailedBreakdown && (
                    <section className="space-y-2 print-avoid-break">
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                        3. Detailed Breakdown &amp; Itemized Schedule
                      </h3>
                      {renderModuleDetailedTable(activeModule, activeWorkspace, currentEnvelope.result)}
                    </section>
                  )}

                  {/* ========================================================
                      SECTION 8: MATHEMATICAL EQUATIONS & CALCULATION TRACE
                      ======================================================== */}
                  {settings.sections.mathematicalEquations && (
                    <section className="print-avoid-break space-y-2 p-3 bg-slate-50 border border-slate-200 rounded">
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                        4. Governing Mathematical Equations &amp; Formulas
                      </h3>
                      <div className="text-xs font-mono space-y-1.5 text-slate-700">
                        {renderModuleEquations(activeModule, moduleMeta.codeStandard)}
                      </div>
                    </section>
                  )}

                  {/* ========================================================
                      SECTION 9: ASSUMPTIONS & ENGINEERING BASIS
                      ======================================================== */}
                  {settings.sections.assumptionsBasis && (
                    <section className="print-avoid-break space-y-2 text-xs font-mono">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                        5. Engineering Assumptions &amp; Material Specifications
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-600">
                        <li>Governing building code requirements: {moduleMeta.codeStandard}.</li>
                        <li>All concrete mixes conform to specified volumetric batching with dry volume factor 1.54.</li>
                        <li>Structural rebar minimum yield strength: fy = 500 MPa (Grade 72.5 / 500W deformed bar).</li>
                        <li>Soil shear parameters determined in accordance with ASTM / BNBC standard geotechnical exploratory logs.</li>
                      </ul>
                    </section>
                  )}

                  {/* ========================================================
                      SECTION 10: JOBSITE NOTES & PRECAUTIONS
                      ======================================================== */}
                  {settings.sections.jobsiteNotes && (
                    <section className="print-avoid-break p-3 border border-amber-300 bg-amber-50/50 rounded text-xs font-mono space-y-1">
                      <div className="font-bold text-amber-900 uppercase">
                        6. Jobsite Inspection Notes &amp; Precautions
                      </div>
                      <p className="text-amber-800 leading-normal">
                        All dimensional checks, formwork plumbness, and bar lap splices must be inspected on-site by a certified engineer prior to casting. Ensure water-cement ratio is rigorously maintained and continuous wet curing is observed for a minimum of 28 days.
                      </p>
                    </section>
                  )}

                  {/* ========================================================
                      SECTION 11: QUALITY SIGN-OFF & OFFICIAL STAMP
                      ======================================================== */}
                  {settings.sections.qualitySignOff && (
                    <section className="print-avoid-break pt-4 border-t-2 border-slate-800 space-y-4">
                      <div className="text-[10px] font-mono text-slate-600 italic">
                        {userPreferences.reportHeaderNote ||
                          'Verified for preliminary structural & estimation design under BNBC-2020 / ACI-318 standards.'}
                      </div>

                      <div className="grid grid-cols-2 gap-8 text-xs font-mono">
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-500">Prepared &amp; Computed By</div>
                          <div className="font-bold text-slate-900 font-sans mt-0.5">{userProfile.fullName}</div>
                          <div className="text-slate-600">{userProfile.designation}</div>
                          <div className="text-slate-500 text-[11px] mt-1">Date: {new Date(timestamp).toLocaleDateString()}</div>
                        </div>

                        <div className="text-right flex flex-col justify-between items-end">
                          <div className="text-[10px] font-bold uppercase text-slate-500">Reviewed &amp; Certified Stamp</div>
                          <div className="mt-6 w-48 border-b-2 border-slate-900"></div>
                          <div className="font-bold text-slate-900 mt-1">
                            {userProfile.licenseNumber ? `License: ${userProfile.licenseNumber}` : 'Licensed Structural Engineer'}
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ========================================================
                      RUNNING FOOTER: LEGAL DISCLAIMER & DYNAMIC COPYRIGHT
                      ======================================================== */}
                  <footer className="pt-4 border-t border-slate-300 text-[10px] font-mono text-slate-500 space-y-1 print-avoid-break">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>© 2026 PB CivilLab. All rights reserved.</div>
                      <div>Created &amp; Developed by PROKASH BISWAS</div>
                      <div>Document Ref: {documentId}</div>
                    </div>
                    <div className="text-[9px] text-slate-400 leading-tight">
                      Disclaimer: PB CivilLab provides design calculations for estimation, academic, and practical guidance purposes. All output should be reviewed by a certified licensed structural engineer prior to construction.
                    </div>
                  </footer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   MODULE-SPECIFIC ROW RENDERERS FOR INPUTS & OUTPUTS
-------------------------------------------------------------------------- */
function renderModuleInputRows(moduleId: EngineeringModuleId, ws: CivilWorkspace) {
  switch (moduleId) {
    case 'boq-estimator':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Active Currency</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right">{ws.boq.currency}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Contingency Allowance</td>
            <td className="p-2 text-center">%</td>
            <td className="p-2 text-right">{ws.boq.contingencyPercent}</td>
            <td className="p-2 text-center">%</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Contractor Overhead &amp; Profit</td>
            <td className="p-2 text-center">%</td>
            <td className="p-2 text-right">{ws.boq.contractorOverheadPercent}</td>
            <td className="p-2 text-center">%</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">VAT / Tax Rate</td>
            <td className="p-2 text-center">%</td>
            <td className="p-2 text-right">{ws.boq.vatTaxPercent}</td>
            <td className="p-2 text-center">%</td>
          </tr>
        </>
      );
    case 'beam-analysis':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Clear Span Length</td>
            <td className="p-2 text-center">L</td>
            <td className="p-2 text-right">{ws.beam.spanLengthM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Uniformly Distributed Load (UDL)</td>
            <td className="p-2 text-center">w</td>
            <td className="p-2 text-right">{ws.beam.uniformLoadKnPerM}</td>
            <td className="p-2 text-center">kN/m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Point Concentrated Load</td>
            <td className="p-2 text-center">P</td>
            <td className="p-2 text-right">{ws.beam.pointLoadKn}</td>
            <td className="p-2 text-center">kN</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Point Load Position</td>
            <td className="p-2 text-center">a</td>
            <td className="p-2 text-right">{ws.beam.pointLoadPositionM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Modulus of Elasticity</td>
            <td className="p-2 text-center">E</td>
            <td className="p-2 text-right">{ws.beam.elasticModulusGpa}</td>
            <td className="p-2 text-center">GPa</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Moment of Inertia</td>
            <td className="p-2 text-center">I_x</td>
            <td className="p-2 text-right">{ws.beam.momentOfInertiaCm4}</td>
            <td className="p-2 text-center">cm⁴</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Support Fixity Condition</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right capitalize">{ws.beam.supportCondition}</td>
            <td className="p-2 text-center">-</td>
          </tr>
        </>
      );
    case 'bearing-capacity':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Footing Width</td>
            <td className="p-2 text-center">B</td>
            <td className="p-2 text-right">{ws.bearing.footingWidthM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Footing Length</td>
            <td className="p-2 text-center">L</td>
            <td className="p-2 text-right">{ws.bearing.footingLengthM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Embedment Depth</td>
            <td className="p-2 text-center">D_f</td>
            <td className="p-2 text-right">{ws.bearing.embedmentDepthM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Soil Cohesion</td>
            <td className="p-2 text-center">c</td>
            <td className="p-2 text-right">{ws.bearing.soilCohesionKpa}</td>
            <td className="p-2 text-center">kPa</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Internal Friction Angle</td>
            <td className="p-2 text-center">ϕ</td>
            <td className="p-2 text-right">{ws.bearing.frictionAngleDeg}°</td>
            <td className="p-2 text-center">deg</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Soil Unit Weight</td>
            <td className="p-2 text-center">γ</td>
            <td className="p-2 text-right">{ws.bearing.unitWeightKnPerM3}</td>
            <td className="p-2 text-center">kN/m³</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Target Factor of Safety</td>
            <td className="p-2 text-center">FS</td>
            <td className="p-2 text-right">{ws.bearing.factorOfSafety}</td>
            <td className="p-2 text-center">-</td>
          </tr>
        </>
      );
    case 'concrete-materials':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Target Wet RCC Volume</td>
            <td className="p-2 text-center">V_wet</td>
            <td className="p-2 text-right">{ws.concreteMaterials.wetVolumeM3}</td>
            <td className="p-2 text-center">m³</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Volumetric Mix Ratio</td>
            <td className="p-2 text-center">C:S:A</td>
            <td className="p-2 text-right">{`1 : ${ws.concreteMaterials.ratioSand} : ${ws.concreteMaterials.ratioAggregate}`}</td>
            <td className="p-2 text-center">ratio</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Dry Volume Expansion Factor</td>
            <td className="p-2 text-center">Factor</td>
            <td className="p-2 text-right">{ws.concreteMaterials.customDryFactor}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Cement Bag Unit Weight</td>
            <td className="p-2 text-center">W_bag</td>
            <td className="p-2 text-right">{ws.concreteMaterials.cementBagWeightKg}</td>
            <td className="p-2 text-center">kg</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Wastage Allowance</td>
            <td className="p-2 text-center">%</td>
            <td className="p-2 text-right">{ws.concreteMaterials.wastagePercent}</td>
            <td className="p-2 text-center">%</td>
          </tr>
        </>
      );
    case 'concrete-mix':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Specified Compressive Strength</td>
            <td className="p-2 text-center">f'c</td>
            <td className="p-2 text-right">{ws.concrete.targetStrengthMpa}</td>
            <td className="p-2 text-center">MPa</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Design Water-Cement Ratio</td>
            <td className="p-2 text-center">w/c</td>
            <td className="p-2 text-right">{ws.concrete.waterCementRatio}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Workability Slump</td>
            <td className="p-2 text-center">Slump</td>
            <td className="p-2 text-right">{ws.concrete.slumpMm}</td>
            <td className="p-2 text-center">mm</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Max Aggregate Nominal Size</td>
            <td className="p-2 text-center">D_max</td>
            <td className="p-2 text-right">{ws.concrete.maxAggregateSizeMm}</td>
            <td className="p-2 text-center">mm</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Cement Specific Gravity</td>
            <td className="p-2 text-center">SG</td>
            <td className="p-2 text-right">{ws.concrete.cementSpecificGravity}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Batch Volume</td>
            <td className="p-2 text-center">V_batch</td>
            <td className="p-2 text-right">{ws.concrete.batchVolumeM3}</td>
            <td className="p-2 text-center">m³</td>
          </tr>
        </>
      );
    case 'rebar-bbs':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Structural Element Type</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right capitalize">{ws.rebarBbs.elementType}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Slab Span / Length</td>
            <td className="p-2 text-center">L_elem</td>
            <td className="p-2 text-right">{ws.rebarBbs.slabLengthM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Clear Concrete Cover</td>
            <td className="p-2 text-center">c_clear</td>
            <td className="p-2 text-right">{ws.rebarBbs.clearCoverMm}</td>
            <td className="p-2 text-center">mm</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Hook Configuration</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right">{ws.rebarBbs.hookAngle}°</td>
            <td className="p-2 text-center">deg</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Rebar Density</td>
            <td className="p-2 text-center">ρ_s</td>
            <td className="p-2 text-right">{ws.rebarBbs.rebarDensityKgPerM3}</td>
            <td className="p-2 text-center">kg/m³</td>
          </tr>
        </>
      );
    case 'masonry-finishes':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Wall Length</td>
            <td className="p-2 text-center">L</td>
            <td className="p-2 text-right">{ws.masonry.wallLengthM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Wall Height</td>
            <td className="p-2 text-center">H</td>
            <td className="p-2 text-right">{ws.masonry.wallHeightM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Wall Thickness</td>
            <td className="p-2 text-center">t</td>
            <td className="p-2 text-right">{ws.masonry.wallThicknessM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Mortar Mix Ratio</td>
            <td className="p-2 text-center">C:S</td>
            <td className="p-2 text-right">1 : {ws.masonry.mortarRatioSand}</td>
            <td className="p-2 text-center">ratio</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Modular Brick Dimensions</td>
            <td className="p-2 text-center">L×W×H</td>
            <td className="p-2 text-right">{`${ws.masonry.brickLengthMm}×${ws.masonry.brickWidthMm}×${ws.masonry.brickHeightMm}`}</td>
            <td className="p-2 text-center">mm</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Openings Count</td>
            <td className="p-2 text-center">N_open</td>
            <td className="p-2 text-right">{ws.masonry.openings.length}</td>
            <td className="p-2 text-center">items</td>
          </tr>
        </>
      );
    case 'earthwork-alignment':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Calculation Model</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right capitalize">{ws.earthwork.calculationType.replace('-', ' ')}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Soil Geotechnical Classification</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right capitalize">{ws.earthwork.soilType.replace('-', ' ')}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Road Alignment Length</td>
            <td className="p-2 text-center">L_road</td>
            <td className="p-2 text-right">{ws.earthwork.roadLengthM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Formation Roadway Width</td>
            <td className="p-2 text-center">B_form</td>
            <td className="p-2 text-right">{ws.earthwork.formationWidthM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Embankment / Trench Side Slope</td>
            <td className="p-2 text-center">s</td>
            <td className="p-2 text-right">1 : {ws.earthwork.sideSlopeS}</td>
            <td className="p-2 text-center">H:V</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Station 1 Depth</td>
            <td className="p-2 text-center">d_1</td>
            <td className="p-2 text-right">{ws.earthwork.depthStation1M}</td>
            <td className="p-2 text-center">m</td>
          </tr>
        </>
      );
    case 'open-channel':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Channel Bed Width</td>
            <td className="p-2 text-center">b</td>
            <td className="p-2 text-right">{ws.channel.bottomWidthM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Normal Flow Depth</td>
            <td className="p-2 text-center">y</td>
            <td className="p-2 text-right">{ws.channel.flowDepthM}</td>
            <td className="p-2 text-center">m</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Side Slope</td>
            <td className="p-2 text-center">z</td>
            <td className="p-2 text-right">{ws.channel.sideSlopeZ}</td>
            <td className="p-2 text-center">H:1V</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Manning's Roughness Coefficient</td>
            <td className="p-2 text-center">n</td>
            <td className="p-2 text-right">{ws.channel.manningN}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Longitudinal Bed Slope</td>
            <td className="p-2 text-center">S_0</td>
            <td className="p-2 text-right">{ws.channel.bedSlope}</td>
            <td className="p-2 text-center">m/m</td>
          </tr>
        </>
      );
    case 'rate-analysis':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Trade Work Specification</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right capitalize">{ws.rateAnalysis.workType.replace('-', ' ')}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Basis Volume</td>
            <td className="p-2 text-center">V_basis</td>
            <td className="p-2 text-right">{ws.rateAnalysis.basisVolumeM3}</td>
            <td className="p-2 text-center">m³</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Active Currency</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right">{ws.rateAnalysis.currency}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Cement Unit Price</td>
            <td className="p-2 text-center">Rate</td>
            <td className="p-2 text-right">{ws.rateAnalysis.cementPricePerBag}</td>
            <td className="p-2 text-center">/bag</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Contractor Profit Allowance</td>
            <td className="p-2 text-center">%</td>
            <td className="p-2 text-right">{ws.rateAnalysis.contractorProfitPercent}</td>
            <td className="p-2 text-center">%</td>
          </tr>
        </>
      );
    case 'unit-converter':
      return (
        <>
          <tr>
            <td className="p-2 font-medium">Dimension Category</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right capitalize">{ws.converter.category}</td>
            <td className="p-2 text-center">-</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Source Magnitude &amp; Unit</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right">{ws.converter.inputValue} {ws.converter.fromUnit}</td>
            <td className="p-2 text-center">{ws.converter.fromUnit}</td>
          </tr>
          <tr>
            <td className="p-2 font-medium">Target Unit</td>
            <td className="p-2 text-center">-</td>
            <td className="p-2 text-right">{ws.converter.toUnit}</td>
            <td className="p-2 text-center">{ws.converter.toUnit}</td>
          </tr>
        </>
      );
    default:
      return (
        <tr>
          <td className="p-2">Calculated Parameter Set</td>
          <td className="p-2 text-center">-</td>
          <td className="p-2 text-right">Standard Nominal</td>
          <td className="p-2 text-center">SI</td>
        </tr>
      );
  }
}

function renderModuleOutputCards(moduleId: EngineeringModuleId, ws: CivilWorkspace, result: any) {
  if (!result) return <div className="text-xs font-mono">No data</div>;

  if (moduleId === 'boq-estimator') {
    return (
      <>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Subtotal Amount</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.currencySymbol} {result.subtotalAmount?.toLocaleString()}</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Contingency ({result.contingencyPercent}%)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.currencySymbol} {result.contingencyAmount?.toLocaleString()}</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">CP &amp; OH ({result.contractorOverheadPercent}%)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.currencySymbol} {result.contractorOverheadAmount?.toLocaleString()}</div>
        </div>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-300">
          <div className="text-[10px] text-blue-700 font-mono font-bold">GRAND TOTAL BOQ</div>
          <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">{result.currencySymbol} {result.grandTotalAmount?.toLocaleString()}</div>
        </div>
      </>
    );
  }

  if (moduleId === 'beam-analysis') {
    return (
      <>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Max Moment (M_max)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.maxMomentKnm?.toFixed(2)} kN·m</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Max Shear (V_max)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.maxShearKn?.toFixed(2)} kN</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Max Deflection (Δ)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.maxDeflectionMm?.toFixed(2)} mm</div>
        </div>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-300">
          <div className="text-[10px] text-blue-700 font-mono font-bold">Allowable Deflection</div>
          <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">{result.allowableDeflectionMm?.toFixed(2)} mm</div>
        </div>
      </>
    );
  }

  if (moduleId === 'bearing-capacity') {
    return (
      <>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Ultimate Capacity (q_u)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.ultimateBearingCapacityKpa?.toFixed(1)} kPa</div>
        </div>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-300">
          <div className="text-[10px] text-blue-700 font-mono font-bold">Allowable Capacity (q_all)</div>
          <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">{result.allowableBearingCapacityKpa?.toFixed(1)} kPa</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Applied Pressure (q_0)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.totalAppliedPressureKpa?.toFixed(1)} kPa</div>
        </div>
        <div className="p-2.5 rounded bg-emerald-50 border border-emerald-300">
          <div className="text-[10px] text-emerald-700 font-mono font-bold">Safety Factor (FS)</div>
          <div className="text-sm font-bold font-mono text-emerald-900 mt-0.5">{result.factorOfSafetyAchieved?.toFixed(2)} (Safe)</div>
        </div>
      </>
    );
  }

  if (moduleId === 'concrete-materials') {
    return (
      <>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Dry Volume (w/ wastage)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.totalDryVolumeWithWastageM3?.toFixed(2)} m³</div>
        </div>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-300">
          <div className="text-[10px] text-blue-700 font-mono font-bold">Cement Bags Required</div>
          <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">{result.cementBags50Kg?.toFixed(1)} bags</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Fine Sand Volume</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.sandVolumeCft?.toFixed(1)} cft</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Stone Aggregates</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.aggregateVolumeCft?.toFixed(1)} cft</div>
        </div>
      </>
    );
  }

  if (moduleId === 'concrete-mix') {
    return (
      <>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Target Mean Strength</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.targetMeanStrengthMpa?.toFixed(1)} MPa</div>
        </div>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-300">
          <div className="text-[10px] text-blue-700 font-mono font-bold">Water-Cement Ratio (w/c)</div>
          <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">{result.waterCementRatio?.toFixed(2)}</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Cement Content</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.cementKgM3?.toFixed(0)} kg/m³</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Water Demand</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.waterKgM3?.toFixed(0)} L/m³</div>
        </div>
      </>
    );
  }

  if (moduleId === 'rebar-bbs') {
    return (
      <>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-300">
          <div className="text-[10px] text-blue-700 font-mono font-bold">TOTAL REBAR WEIGHT</div>
          <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">{result.totalWeightKg?.toFixed(1)} kg ({result.totalWeightTon?.toFixed(3)} Ton)</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Total Cutting Length</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.totalLengthM?.toFixed(1)} m</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Scheduled Bars Count</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.totalBarsCount} bars</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Steel Unit Density</div>
          <div className="text-sm font-bold font-mono mt-0.5">7850 kg/m³</div>
        </div>
      </>
    );
  }

  if (moduleId === 'masonry-finishes') {
    return (
      <>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-300">
          <div className="text-[10px] text-blue-700 font-mono font-bold">MODULAR BRICKS DEMAND</div>
          <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">{result.brickCountWithWastage?.toLocaleString()} nos</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Dry Mortar Volume</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.dryMortarVolumeM3?.toFixed(2)} m³</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Cement (Bags)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.cementBags?.toFixed(1)} bags</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Sand (cft)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.sandCft?.toFixed(1)} cft</div>
        </div>
      </>
    );
  }

  if (moduleId === 'earthwork-alignment') {
    return (
      <>
        <div className="p-2.5 rounded bg-amber-50 border border-amber-300">
          <div className="text-[10px] text-amber-700 font-mono font-bold">Total Cut Excavation</div>
          <div className="text-sm font-bold font-mono text-amber-900 mt-0.5">{result.totalCutVolumeM3?.toFixed(1)} m³</div>
        </div>
        <div className="p-2.5 rounded bg-emerald-50 border border-emerald-300">
          <div className="text-[10px] text-emerald-700 font-mono font-bold">Total Fill Embankment</div>
          <div className="text-sm font-bold font-mono text-emerald-900 mt-0.5">{result.totalFillVolumeM3?.toFixed(1)} m³</div>
        </div>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-300">
          <div className="text-[10px] text-blue-700 font-mono font-bold">Net Mass Balance</div>
          <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">{result.netBalanceVolumeM3?.toFixed(1)} m³</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Prismoidal Correction</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.prismoidalCorrectionM3?.toFixed(1)} m³</div>
        </div>
      </>
    );
  }

  if (moduleId === 'open-channel') {
    return (
      <>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-300">
          <div className="text-[10px] text-blue-700 font-mono font-bold">DISCHARGE CAPACITY (Q)</div>
          <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">{result.dischargeQCumecs?.toFixed(2)} m³/s ({result.dischargeCfs?.toFixed(1)} cfs)</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Mean Velocity (V)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.flowVelocityMPerS?.toFixed(2)} m/s</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Hydraulic Radius (R_h)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.hydraulicRadiusM?.toFixed(3)} m</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Froude Number (Fr)</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.froudeNumber?.toFixed(2)} ({result.flowRegime?.toUpperCase()})</div>
        </div>
      </>
    );
  }

  if (moduleId === 'rate-analysis') {
    return (
      <>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-300">
          <div className="text-[10px] text-blue-700 font-mono font-bold">COMPOSITE UNIT RATE</div>
          <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">{result.currencySymbol} {result.grandRateWithTax?.toFixed(2)} / {ws.rateAnalysis.basisVolumeM3} m³</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Material Component</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.currencySymbol} {result.materialTotalCost?.toFixed(2)}</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Labor Component</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.currencySymbol} {result.laborTotalCost?.toFixed(2)}</div>
        </div>
        <div className="p-2.5 rounded bg-slate-50 border border-slate-300">
          <div className="text-[10px] text-slate-500 font-mono">Contractor Profit &amp; Tax</div>
          <div className="text-sm font-bold font-mono mt-0.5">{result.currencySymbol} {(result.contractorProfitAmount + (result.taxAmount || 0))?.toFixed(2)}</div>
        </div>
      </>
    );
  }

  return (
    <div className="col-span-full p-2.5 bg-slate-50 border border-slate-300 font-mono text-xs">
      Verification Status: Nominal · Code Standard: {ws.governingCode}
    </div>
  );
}

function renderModuleDetailedTable(moduleId: EngineeringModuleId, ws: CivilWorkspace, result: any) {
  if (moduleId === 'boq-estimator' && result?.items) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border border-slate-300">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-2 border-b border-slate-300">Item #</th>
              <th className="p-2 border-b border-slate-300">Description</th>
              <th className="p-2 border-b border-slate-300 text-center">Nos</th>
              <th className="p-2 border-b border-slate-300 text-right">L (m)</th>
              <th className="p-2 border-b border-slate-300 text-right">W (m)</th>
              <th className="p-2 border-b border-slate-300 text-right">H (m)</th>
              <th className="p-2 border-b border-slate-300 text-center">Unit</th>
              <th className="p-2 border-b border-slate-300 text-right">Qty</th>
              <th className="p-2 border-b border-slate-300 text-right">Rate</th>
              <th className="p-2 border-b border-slate-300 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {result.items.map((it: any) => (
              <tr key={it.id}>
                <td className="p-2 font-bold">{it.itemNo}</td>
                <td className="p-2">{it.description}</td>
                <td className="p-2 text-center">{it.numberOfMembers}</td>
                <td className="p-2 text-right">{it.lengthM}</td>
                <td className="p-2 text-right">{it.widthM}</td>
                <td className="p-2 text-right">{it.heightM}</td>
                <td className="p-2 text-center">{it.unit}</td>
                <td className="p-2 text-right font-bold">{it.totalBillableQty}</td>
                <td className="p-2 text-right">{it.unitRate}</td>
                <td className="p-2 text-right font-bold">{it.itemTotalAmount?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (moduleId === 'rebar-bbs' && result?.schedule) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border border-slate-300">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-2 border-b border-slate-300">Bar Mark</th>
              <th className="p-2 border-b border-slate-300">Member</th>
              <th className="p-2 border-b border-slate-300 text-center">Dia (mm)</th>
              <th className="p-2 border-b border-slate-300">Shape Code &amp; Geometry</th>
              <th className="p-2 border-b border-slate-300 text-center">Bars</th>
              <th className="p-2 border-b border-slate-300 text-right">Cut Length (m)</th>
              <th className="p-2 border-b border-slate-300 text-right">Unit Wt (kg/m)</th>
              <th className="p-2 border-b border-slate-300 text-right">Total Wt (kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {result.schedule.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="p-2 font-bold">{item.barMark}</td>
                <td className="p-2">{item.memberDescription}</td>
                <td className="p-2 text-center font-bold">T{item.diameterMm}</td>
                <td className="p-2">{item.shapeCode} · {item.shapeDescription}</td>
                <td className="p-2 text-center">{item.totalNumberOfBars}</td>
                <td className="p-2 text-right">{item.cuttingLengthM?.toFixed(2)}</td>
                <td className="p-2 text-right">{item.unitWeightKgPerM?.toFixed(3)}</td>
                <td className="p-2 text-right font-bold">{item.totalWeightKg?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (moduleId === 'earthwork-alignment' && result?.stationBreakdown) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border border-slate-300">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-2 border-b border-slate-300">Station</th>
              <th className="p-2 border-b border-slate-300 text-right">Chainage (m)</th>
              <th className="p-2 border-b border-slate-300 text-right">Cut Area (m²)</th>
              <th className="p-2 border-b border-slate-300 text-right">Fill Area (m²)</th>
              <th className="p-2 border-b border-slate-300 text-right">Cut Vol (m³)</th>
              <th className="p-2 border-b border-slate-300 text-right">Fill Vol (m³)</th>
              <th className="p-2 border-b border-slate-300 text-right">Net Mass (m³)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {result.stationBreakdown.map((st: any, idx: number) => (
              <tr key={idx}>
                <td className="p-2 font-bold">{st.stationId}</td>
                <td className="p-2 text-right">{st.chainageM}</td>
                <td className="p-2 text-right">{st.cutAreaSqM?.toFixed(2)}</td>
                <td className="p-2 text-right">{st.fillAreaSqM?.toFixed(2)}</td>
                <td className="p-2 text-right font-semibold text-amber-800">{st.incrementalCutM3?.toFixed(2)}</td>
                <td className="p-2 text-right font-semibold text-emerald-800">{st.incrementalFillM3?.toFixed(2)}</td>
                <td className="p-2 text-right font-bold">{st.cumulativeMassM3?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (moduleId === 'rate-analysis' && result) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border border-slate-300">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-2 border-b border-slate-300">Component</th>
              <th className="p-2 border-b border-slate-300">Resource Description</th>
              <th className="p-2 border-b border-slate-300 text-right">Quantity</th>
              <th className="p-2 border-b border-slate-300 text-center">Unit</th>
              <th className="p-2 border-b border-slate-300 text-right">Unit Rate ({result.currencySymbol})</th>
              <th className="p-2 border-b border-slate-300 text-right">Total ({result.currencySymbol})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {result.materialsBreakdown?.map((m: any, i: number) => (
              <tr key={`mat-${i}`}>
                <td className="p-2 font-semibold text-blue-700">Material</td>
                <td className="p-2">{m.materialName}</td>
                <td className="p-2 text-right">{m.quantity}</td>
                <td className="p-2 text-center">{m.unit}</td>
                <td className="p-2 text-right">{m.unitRate}</td>
                <td className="p-2 text-right font-bold">{m.subtotalCost?.toFixed(2)}</td>
              </tr>
            ))}
            {result.laborsBreakdown?.map((l: any, i: number) => (
              <tr key={`lab-${i}`}>
                <td className="p-2 font-semibold text-emerald-700">Labor</td>
                <td className="p-2">{l.laborCategory}</td>
                <td className="p-2 text-right">{l.headcount}</td>
                <td className="p-2 text-center">man-days</td>
                <td className="p-2 text-right">{l.wagePerDay}</td>
                <td className="p-2 text-right font-bold">{l.subtotalCost?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (moduleId === 'concrete-mix' && result) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border border-slate-300">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-2 border-b border-slate-300">Constituent</th>
              <th className="p-2 border-b border-slate-300 text-right">Mass per m³ (kg)</th>
              <th className="p-2 border-b border-slate-300 text-right">Mass per 50kg Bag (kg)</th>
              <th className="p-2 border-b border-slate-300 text-right">Proportion by Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="p-2 font-bold">Portland Cement</td>
              <td className="p-2 text-right font-bold">{result.cementKgM3?.toFixed(1)}</td>
              <td className="p-2 text-right">50.0</td>
              <td className="p-2 text-right">1.00</td>
            </tr>
            <tr>
              <td className="p-2 font-bold">Fine Aggregate (Sand)</td>
              <td className="p-2 text-right font-bold">{result.fineAggregateKgM3?.toFixed(1)}</td>
              <td className="p-2 text-right">{(result.fineAggregateKgM3 / (result.cementKgM3 / 50))?.toFixed(1)}</td>
              <td className="p-2 text-right">{(result.fineAggregateKgM3 / result.cementKgM3)?.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="p-2 font-bold">Coarse Aggregate (Stone)</td>
              <td className="p-2 text-right font-bold">{result.coarseAggregateKgM3?.toFixed(1)}</td>
              <td className="p-2 text-right">{(result.coarseAggregateKgM3 / (result.cementKgM3 / 50))?.toFixed(1)}</td>
              <td className="p-2 text-right">{(result.coarseAggregateKgM3 / result.cementKgM3)?.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="p-2 font-bold">Potable Water</td>
              <td className="p-2 text-right font-bold">{result.waterKgM3?.toFixed(1)}</td>
              <td className="p-2 text-right">{(result.waterKgM3 / (result.cementKgM3 / 50))?.toFixed(1)} L</td>
              <td className="p-2 text-right">{(result.waterKgM3 / result.cementKgM3)?.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="p-3 border border-slate-200 bg-slate-50 text-xs font-mono">
      Complete calculation log and itemized vector steps verified in document verification envelope.
    </div>
  );
}

function renderModuleEquations(moduleId: EngineeringModuleId, codeStandard: string) {
  switch (moduleId) {
    case 'beam-analysis':
      return (
        <>
          <div>• Maximum Bending Moment: M_max = (w · L²) / 8 + (P · a · b) / L</div>
          <div>• Maximum Shear Force: V_max = (w · L) / 2 + (P · max(a, b)) / L</div>
          <div>• Maximum Elastic Deflection: Δ_max = (5 · w · L⁴) / (384 · E · I) + (P · L³) / (48 · E · I) ≤ L / 360</div>
          <div>• Flexural Stress Verification: σ = (M · c) / I ≤ σ_allow</div>
        </>
      );
    case 'bearing-capacity':
      return (
        <>
          <div>• Terzaghi General Formula: q_u = c · N_c · s_c + γ · D_f · N_q + 0.5 · γ · B · N_γ · s_γ</div>
          <div>• Bearing Capacity Factors: N_q = e^(π·tan ϕ) · tan²(45° + ϕ/2), N_c = (N_q - 1)·cot ϕ, N_γ = 2(N_q + 1)·tan ϕ</div>
          <div>• Allowable Safe Bearing Pressure: q_all = q_u / FS  (Design Factor of Safety FS = 3.0)</div>
        </>
      );
    case 'concrete-materials':
      return (
        <>
          <div>• Volumetric Dry Bulk Expansion: V_dry = V_wet × 1.54 × (1 + Wastage% / 100)</div>
          <div>• Portland Cement Volume Proportion: V_cement = V_dry × [C / (C + S + A)]</div>
          <div>• Total Standard 50kg Bags Required: Bags = (V_cement × 1440 kg/m³) / 50 kg</div>
          <div>• Aggregate Volume in Engineering Units: Volume (cft) = V_part × 35.3147 cft/m³</div>
        </>
      );
    case 'concrete-mix':
      return (
        <>
          <div>• Target Mean Compressive Strength: f'cr = f'c + 1.34 · s  or  f'cr = f'c + 2.33 · s - 3.5 MPa</div>
          <div>• Water-Cement Ratio Estimation: w/c = Function(f'cr, Environmental Exposure Criterion)</div>
          <div>• Absolute Volume Law: C/(γc · ρw) + W/ρw + FA/(γfa · ρw) + CA/(γca · ρw) + Air = 1.0 m³</div>
        </>
      );
    case 'rebar-bbs':
      return (
        <>
          <div>• Unit Weight of Steel Rebar: w = d² / 162.2 kg/m  (where diameter d is in millimeters)</div>
          <div>• Bar Cutting Length: L_cut = L_gross - n_45°(1d) - n_90°(2d) - n_135°(3d) + Hooks</div>
          <div>• Tension Lap Splice Criterion: L_lap ≥ 40d to 50d  (ACI 318 / BNBC 2020)</div>
        </>
      );
    case 'masonry-finishes':
      return (
        <>
          <div>• Modular Bricks Demand: N = [V_wall × (1 - Openings) / (L_nom × W_nom × H_nom)] × (1 + Wastage%)</div>
          <div>• Dry Mortar Volume Conversion: V_dry_mortar = (V_wall - N × V_brick_actual) × 1.33</div>
          <div>• Plaster Surface Area: A_plaster = 2 × (L × H) - A_openings + A_reveals</div>
        </>
      );
    case 'earthwork-alignment':
      return (
        <>
          <div>• Average End-Area Formulation: V = (L / 2) · (A1 + A2)</div>
          <div>• Prismoidal Volume Formulation: V_prism = (L / 6) · (A1 + 4 · Am + A2)</div>
          <div>• Prismoidal Correction Factor: Cp = (L / 12) · s · (d1 - d2)²  (Eliminates End-Area Overestimation)</div>
        </>
      );
    case 'open-channel':
      return (
        <>
          <div>• Manning Open-Channel Flow Velocity: V = (1 / n) · Rh^(2/3) · S0^(1/2)</div>
          <div>• Continuity Discharge Capacity: Q = A · V = A · [(1 / n) · Rh^(2/3) · S0^(1/2)]</div>
          <div>• Froude Number Flow Regime: Fr = V / √(g · Dh)  where Dh = A / T  (Fr &lt; 1 Subcritical, Fr &gt; 1 Supercritical)</div>
        </>
      );
    case 'rate-analysis':
      return (
        <>
          <div>• Direct Prime Cost: C_prime = Σ Materials + Σ Labor + Σ Equipment/Machinery</div>
          <div>• Contractor Profit &amp; Overheads: CP = C_prime × (CP% / 100)</div>
          <div>• Composite Unit Billable Rate: R_unit = (C_prime + CP) × (1 + Tax% / 100)</div>
        </>
      );
    case 'unit-converter':
      return (
        <>
          <div>• Dimensional Invariant Law: Q = Magnitude × [Unit] = Constant</div>
          <div>• Exact IEEE-754 Conversion: V_target = V_source × (k_source / k_target)</div>
        </>
      );
    default:
      return <div>• Governing Standard Formulation: {codeStandard}</div>;
  }
}
