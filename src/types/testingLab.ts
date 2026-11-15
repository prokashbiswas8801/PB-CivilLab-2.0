export type TestingLabDomainId =
  | 'cement'
  | 'aggregate'
  | 'brick-block'
  | 'concrete-ndt'
  | 'rebar-steel'
  | 'soil-pile'
  | 'highway-bitumen'
  | 'water-plumbing'
  | 'site-checklists';

export type TestingLabLanguageMode = 'dual' | 'bn' | 'en';

export type TestingLabVerdict = 'PASS' | 'WARNING' | 'FAIL';

export interface BilingualText {
  en: string;
  bn: string;
}

export interface TestingLabDomainMeta {
  id: TestingLabDomainId;
  shortCode: string;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  governingCodes: string[];
}

export interface LabApparatusItem {
  item: BilingualText;
  spec: string;
}

export interface LabFormulaItem {
  name: BilingualText;
  equation: string;
  variables: BilingualText[];
  unitNote: string;
}

export interface LabAcceptanceRange {
  tier: TestingLabVerdict;
  rangeLabel: string;
  codeLimit: string;
  interpretation: BilingualText;
}

export interface LabInputField {
  key: string;
  label: BilingualText;
  unit: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  hint?: BilingualText;
  options?: Array<{ value: number; label: BilingualText }>;
}

export interface LabChecklistItemDef {
  id: string;
  category: BilingualText;
  item: BilingualText;
  codeRef: string;
  critical: boolean;
  weight?: number;
}

export interface LabTestDefinition {
  id: string;
  domainId: TestingLabDomainId;
  code: string;
  title: BilingualText;
  testType: 'Field Instant Check' | 'Laboratory Test';
  testTypeBn: string;
  governingCodes: string[];
  objective: BilingualText;
  sampling: {
    frequency: BilingualText;
    quantity: BilingualText;
    lotSize: BilingualText;
  };
  apparatus: LabApparatusItem[];
  procedure: BilingualText[];
  precautionsAndTricks: {
    precautions: BilingualText[];
    contractorTricks: BilingualText[];
  };
  mathSection: {
    formulas: LabFormulaItem[];
    workedExample: BilingualText;
  };
  acceptanceRanges: LabAcceptanceRange[];
  remedialActions: BilingualText[];
  calculatorInputs: LabInputField[];
  sampleLocationPlaceholder?: string;
  checklistItems?: LabChecklistItemDef[];
}

export interface LabEvaluationMetric {
  labelEn: string;
  labelBn: string;
  value: string;
  unit: string;
  highlight?: boolean;
}

export interface LabEvaluationOutput {
  testId: string;
  primaryMetricLabel: BilingualText;
  primaryValue: string;
  primaryUnit: string;
  codeLimitText: string;
  verdict: TestingLabVerdict;
  verdictHeadline: BilingualText;
  verdictDetail: BilingualText;
  metrics: LabEvaluationMetric[];
  steps: string[];
  weightedScorePct?: number;
}

export interface TestingLabSavedRecord {
  id: string;
  testId: string;
  testCode: string;
  domainId: TestingLabDomainId;
  testNameEn: string;
  testNameBn: string;
  governingCodes: string[];
  sampleRef: string;
  locationGrid: string;
  testedBy: string;
  testedAt: string;
  inputs: Record<string, number>;
  metrics: LabEvaluationMetric[];
  primaryResultLabel: string;
  primaryResultValue: string;
  codeLimitText: string;
  verdict: TestingLabVerdict;
  verdictDetail: BilingualText;
  steps: string[];
  remarks?: string;
}

export type ChecklistItemStatus = 'PASS' | 'FAIL' | 'NA';

export interface TestingLabChecklistLog {
  id: string;
  testId: string;
  testCode: string;
  checklistTitleEn: string;
  checklistTitleBn: string;
  locationGrid: string;
  inspector: string;
  inspectedAt: string;
  totalItems: number;
  passedCount: number;
  failedCount: number;
  naCount: number;
  criticalFailedCount: number;
  itemStates: Record<string, ChecklistItemStatus>;
  overallVerdict: TestingLabVerdict;
  remarks?: string;
}

export interface TestingLabWorkspaceState {
  activeDomainId: TestingLabDomainId;
  activeTestId: string;
  languageMode: TestingLabLanguageMode;
  draftInputsByTestId: Record<string, Record<string, number>>;
  draftChecklistsByTestId: Record<string, Record<string, ChecklistItemStatus>>;
  savedRecords: TestingLabSavedRecord[];
  checklistLogs: TestingLabChecklistLog[];
}
