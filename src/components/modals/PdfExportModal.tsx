import React, { useState, useEffect } from 'react';
import {
  X,
  FileDown,
  Settings,
  Save,
  FileText,
  Printer,
} from 'lucide-react';
import { useCivilLab, CivilPdfPreset } from '../../context/CivilLabContext';
import { CivilWorkspace, EngineeringModuleId, UserProfile } from '../../types/civil';
import { CalculationEnvelope } from '../../utils/calculations';
import { exportCertifiedEngineeringPdf, PdfExportProgress } from '../../utils/pdfExport';
import { TESTING_LAB_TEST_MAP, TESTING_LAB_TESTS } from '../../data/testingLabCatalog';
import {
  evaluateLabTest,
  exportLabTestCertificatePdf,
  getDefaultChecklistStates,
  getDefaultInputsForTest,
} from '../../utils/testingLabEngine';

export interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspace: CivilWorkspace;
  activeModule: EngineeringModuleId;
  envelope: CalculationEnvelope<any>;
  moduleLabel?: string;
  codeStandard?: string;
  onComplete?: () => void;
  onOpenPrintPreview?: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  activeWorkspace,
  activeModule,
  envelope,
  moduleLabel,
  onComplete,
  onOpenPrintPreview,
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
      setCustomReportTitle(
        pdfPreset.customHeaderTitle || `${moduleLabel || activeModule} Certified Submittal`
      );
      setCustomProjectName(activeWorkspace.name);
      setCustomClientName(
        userProfile.projects.find((p) => p.name === activeWorkspace.name)?.clientName ||
          activeWorkspace.engineerOfRecord ||
          ''
      );
      setCustomSignatory(pdfPreset.signatoryName || userProfile.name || '');
      setExportError(null);
    }
  }, [isOpen, pdfPreset, activeWorkspace, moduleLabel, activeModule, userProfile]);

  if (!isOpen) return null;

  // Execute PDF Generation with custom overrides via the unified certified export engine
  const handleGeneratePdf = async (saveAsDefault: boolean = false) => {
    setIsExporting(true);
    setExportError(null);
    setExportProgress({ stage: 'Applying Page Setup & Geometry...', percent: 10 });

    try {
      if (saveAsDefault) {
        updatePdfPreset({
          ...modalPreset,
          customHeaderTitle: customReportTitle,
          signatoryName: customSignatory,
        });
      }

      const mappedUserProfile: UserProfile = {
        fullName:
          customSignatory || userProfile.name || activeWorkspace.engineerOfRecord || 'Pending Signature',
        designation: userProfile.title || 'Engineer of Record',
        organization: userProfile.organization || 'Consulting Practice',
        role: 'structural-engineer',
        licenseNumber: userProfile.licenseNo || 'Pending License',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        initials: (customSignatory || userProfile.name || activeWorkspace.engineerOfRecord || 'EOR')
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 3)
          .toUpperCase(),
      };

      if (activeModule === 'testing-lab-qaqc') {
        const labState = activeWorkspace.testingLab;
        const test =
          (labState?.activeTestId && TESTING_LAB_TEST_MAP[labState.activeTestId]) ||
          TESTING_LAB_TESTS[0];
        const inputs = {
          ...getDefaultInputsForTest(test),
          ...(labState?.draftInputsByTestId?.[test.id] || {}),
        };
        const checklistStates = test.checklistItems
          ? {
              ...getDefaultChecklistStates(test),
              ...(labState?.draftChecklistsByTestId?.[test.id] || {}),
            }
          : undefined;
        const evaluation = evaluateLabTest(test.id, inputs, checklistStates);
        setExportProgress({ stage: 'Rendering Certified QA/QC Lab Certificate...', percent: 65 });
        await exportLabTestCertificatePdf({
          test,
          inputs,
          evaluation,
          sampleRef: labState?.savedRecords?.[0]?.sampleRef || 'LAB-SMP-001',
          locationGrid:
            labState?.savedRecords?.[0]?.locationGrid ||
            activeWorkspace.siteLocation ||
            'Site Zone',
          remarks: '',
          workspace: activeWorkspace,
          userProfile: mappedUserProfile,
          checklistStates,
          customOverrides: {
            reportTitle: customReportTitle || undefined,
            projectName: customProjectName || undefined,
            clientName: customClientName || undefined,
            signatoryName: customSignatory || undefined,
            paperSize: modalPreset.paperSize,
            orientation: modalPreset.orientation,
            marginMm: modalPreset.marginMm,
            exportUnitPreset: modalPreset.exportUnitPreset || 'workspace',
            includeQR: modalPreset.includeQR,
            includeFormulaSteps: modalPreset.includeFormulaSteps,
            includeDiagram: modalPreset.includeDiagram,
            includeSignatureBlock: modalPreset.includeSignatureBlock,
          },
        });
      } else {
        await exportCertifiedEngineeringPdf({
          workspace: activeWorkspace,
          activeModule,
          envelope,
          userProfile: mappedUserProfile,
          onProgress: (prog) => setExportProgress(prog),
          customOverrides: {
            paperSize: modalPreset.paperSize,
            orientation: modalPreset.orientation,
            marginMm: modalPreset.marginMm,
            exportUnitPreset: modalPreset.exportUnitPreset || 'workspace',
            customHeaderTitle: customReportTitle || undefined,
            companySubtitle: modalPreset.companySubtitle || userProfile.organization || undefined,
            customProjectName: customProjectName || undefined,
            customClientName: customClientName || undefined,
            customSignatory: customSignatory || undefined,
            includeHeader: modalPreset.includeHeader ?? true,
            showProjectMetadata: modalPreset.showProjectMetadata ?? true,
            includeFormulaSteps: modalPreset.includeFormulaSteps ?? true,
            includeDiagram: modalPreset.includeDiagram ?? true,
            includeQR: modalPreset.includeQR ?? true,
            includeSignatureBlock: modalPreset.includeSignatureBlock ?? true,
            includeFooter: modalPreset.includeFooter ?? true,
          },
        });
      }

      setExportProgress({ stage: 'Certified PDF Saved!', percent: 100 });
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(null);
        onComplete?.();
        onClose();
      }, 240);
    } catch (err: unknown) {
      console.error('Failed to export PDF:', err);
      const msg = err instanceof Error ? err.message : 'PDF generation encountered an error.';
      setExportError(msg);
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
                Certified PDF Submittal & Page Setup
              </h2>
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Full Submittal · Light CAD Blueprint · Custom Export Unit System
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

          {/* Section 1: Export Unit Preset Segmented Selector & Page Geometry */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] font-mono flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Target Measurement Unit System (Tables, Schedules &amp; Formulas)</span>
                </span>
                <span className="text-[11px] font-mono text-[var(--md-sys-color-primary)] font-semibold">
                  {(modalPreset.exportUnitPreset || 'workspace') === 'regional'
                    ? 'Dual Reference (Target + SI)'
                    : 'Target Unit Only'}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="Export Unit System Preset"
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
              >
                {[
                  {
                    id: 'workspace' as const,
                    label: 'Workspace',
                    units:
                      activeWorkspace.unitPreferences?.systemPreset === 'imperial'
                        ? 'Active · Imperial'
                        : activeWorkspace.unitPreferences?.systemPreset === 'regional'
                          ? 'Active · Regional'
                          : 'Active · SI Metric',
                  },
                  {
                    id: 'metric' as const,
                    label: 'SI Metric',
                    units: 'm · mm · kN · MPa',
                  },
                  {
                    id: 'imperial' as const,
                    label: 'Imperial',
                    units: 'ft-in · kip · psi',
                  },
                  {
                    id: 'regional' as const,
                    label: 'Regional BD',
                    units: 'ft-in · CFT · Katha',
                  },
                ].map((opt) => {
                  const isActive = (modalPreset.exportUnitPreset || 'workspace') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() =>
                        setModalPreset({
                          ...modalPreset,
                          exportUnitPreset: opt.id,
                        })
                      }
                      className={`px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] shadow-xs'
                          : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight whitespace-nowrap truncate">
                        {opt.label}
                      </div>
                      <div
                        className={`text-[10px] font-mono tabular-nums mt-1 whitespace-nowrap truncate ${
                          isActive
                            ? 'text-[var(--md-sys-color-on-primary)]/90'
                            : 'text-[var(--md-sys-color-on-surface-variant)]'
                        }`}
                      >
                        {opt.units}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Paper Size
                </label>
                <select
                  value={modalPreset.paperSize}
                  onChange={(e) =>
                    setModalPreset({ ...modalPreset, paperSize: e.target.value as any })
                  }
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
                  onChange={(e) =>
                    setModalPreset({ ...modalPreset, orientation: e.target.value as any })
                  }
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
                  onChange={(e) =>
                    setModalPreset({ ...modalPreset, marginMm: parseInt(e.target.value, 10) })
                  }
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
              <span>Consultant Title Block & Project Metadata</span>
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
              Submittal Content & Certification Elements:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--md-sys-color-on-surface)]">
                <input
                  type="checkbox"
                  checked={modalPreset.includeFormulaSteps}
                  onChange={(e) =>
                    setModalPreset({ ...modalPreset, includeFormulaSteps: e.target.checked })
                  }
                  className="w-3.5 h-3.5 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <span>Step-by-Step Derivations & Formulas</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--md-sys-color-on-surface)]">
                <input
                  type="checkbox"
                  checked={modalPreset.includeDiagram ?? true}
                  onChange={(e) =>
                    setModalPreset({ ...modalPreset, includeDiagram: e.target.checked })
                  }
                  className="w-3.5 h-3.5 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <span>2D Analytical Diagram / CAD Sketch</span>
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
                  onChange={(e) =>
                    setModalPreset({ ...modalPreset, includeSignatureBlock: e.target.checked })
                  }
                  className="w-3.5 h-3.5 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <span>3-Tier Consultant QA/QC Signature & Seal</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--md-sys-color-on-surface)] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={modalPreset.showProjectMetadata ?? true}
                  onChange={(e) =>
                    setModalPreset({ ...modalPreset, showProjectMetadata: e.target.checked })
                  }
                  className="w-3.5 h-3.5 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <span>Consultant Title Block & Project Identification Grid</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            >
              Cancel
            </button>
            {onOpenPrintPreview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrintPreview();
                }}
                className="px-3.5 py-2 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-primary)] text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Live Sheet Preview & Print</span>
              </button>
            )}
          </div>

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
              <span>Download Certified PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
