import {
  CivilWorkspace,
  EngineeringModuleId,
  UserProfile,
} from '../types/civil';
import { CalculationEnvelope } from './calculations';
import {
  createVerifiedReportRecord,
  saveVerifiedReport,
  PublicEngineeringReportRecord,
} from './verificationEngine';
import {
  applyExportUnitConversionToReport,
  buildReportDataFromWorkspace,
  ExportUnitPreset,
  generateEngineeringPDF,
  PdfExportEngineOptions,
} from './exportEngine';

export interface PdfExportProgress {
  stage: string;
  percent: number;
}

export interface PdfExportCustomOverrides {
  paperSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  exportUnitPreset?: ExportUnitPreset;
  customHeaderTitle?: string;
  companySubtitle?: string;
  customProjectName?: string;
  customClientName?: string;
  customSignatory?: string;
  includeHeader?: boolean;
  showProjectMetadata?: boolean;
  includeFormulaSteps?: boolean;
  includeDiagram?: boolean;
  includeQR?: boolean;
  includeSignatureBlock?: boolean;
  includeFooter?: boolean;
}

export interface PdfExportOptions {
  workspace: CivilWorkspace;
  activeModule: EngineeringModuleId;
  envelope: CalculationEnvelope<any>;
  userProfile?: UserProfile;
  onProgress?: (progress: PdfExportProgress) => void;
  customOverrides?: PdfExportCustomOverrides;
  filename?: string;
}

/**
 * Generates and triggers direct client-side download of a certified engineering submittal PDF report.
 * Consolidates all PDF export flows onto the single authoritative multi-page AutoTable + vector SVG engine
 * in `exportEngine.ts` while persisting a cryptographic verification record in `verificationEngine.ts`.
 */
export async function exportCertifiedEngineeringPdf({
  workspace,
  activeModule,
  envelope,
  userProfile,
  onProgress,
  customOverrides,
  filename,
}: PdfExportOptions): Promise<PublicEngineeringReportRecord> {
  // Build complete, unit-accurate, module-specific engineering report payload
  const effectiveProfile: UserProfile | undefined = userProfile
    ? {
        ...userProfile,
        fullName:
          customOverrides?.customSignatory ||
          userProfile.fullName ||
          workspace.engineerOfRecord ||
          'Pending Signature',
      }
    : customOverrides?.customSignatory
      ? {
          fullName: customOverrides.customSignatory,
          designation: 'Engineer of Record',
          organization: workspace.name,
          role: 'structural-engineer',
          licenseNumber: workspace.projectCode,
          email: '',
          phone: '',
          initials: customOverrides.customSignatory
            .split(/\s+/)
            .map((w) => w[0])
            .join('')
            .slice(0, 3)
            .toUpperCase(),
        }
      : undefined;

  const rawReportData = buildReportDataFromWorkspace(
    activeModule,
    workspace,
    envelope,
    effectiveProfile
  );

  const reportData = applyExportUnitConversionToReport(
    rawReportData,
    customOverrides?.exportUnitPreset || 'workspace',
    workspace
  );

  // Apply custom overrides if provided
  if (customOverrides?.customProjectName) {
    reportData.projectMeta.projectName = customOverrides.customProjectName;
  }
  if (customOverrides?.customClientName) {
    reportData.projectMeta.client = customOverrides.customClientName;
  }
  if (customOverrides?.customSignatory) {
    reportData.projectMeta.engineerName = customOverrides.customSignatory;
  }

  // Persist tamper-evident cryptographic verification record
  const verifiedRecord = createVerifiedReportRecord(
    workspace,
    activeModule,
    envelope,
    effectiveProfile,
    reportData.docId
  );
  saveVerifiedReport(verifiedRecord);
  reportData.qrLinkUrl = verifiedRecord.verificationUrl;

  const targetFilename =
    filename ||
    `${workspace.projectCode || 'BDCL'}_${activeModule.toUpperCase()}_Submittal_${reportData.docId}.pdf`;

  const engineOptions: PdfExportEngineOptions = {
    onProgress,
    autoDownload: true,
    filename: targetFilename,
    paperSize: customOverrides?.paperSize || 'a4',
    orientation: customOverrides?.orientation || 'portrait',
    marginMm: customOverrides?.marginMm || 14,
    exportUnitPreset: customOverrides?.exportUnitPreset || 'workspace',
    customHeaderTitle: customOverrides?.customHeaderTitle,
    customCompanySubtitle: customOverrides?.companySubtitle,
    customProjectName: customOverrides?.customProjectName,
    customClientName: customOverrides?.customClientName,
    customSignatory: customOverrides?.customSignatory,
    includeHeader: customOverrides?.includeHeader ?? true,
    showProjectMetadata: customOverrides?.showProjectMetadata ?? true,
    includeFormulaSteps: customOverrides?.includeFormulaSteps ?? true,
    includeDiagram: customOverrides?.includeDiagram ?? true,
    includeQR: customOverrides?.includeQR ?? true,
    includeSignatureBlock: customOverrides?.includeSignatureBlock ?? true,
    includeFooter: customOverrides?.includeFooter ?? true,
  };

  await generateEngineeringPDF(reportData, engineOptions);

  return verifiedRecord;
}
