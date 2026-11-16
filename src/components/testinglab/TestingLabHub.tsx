import React, { useMemo, useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
  Printer,
  Save,
  RotateCcw,
  Trash2,
  Languages,
  ClipboardCheck,
  ShieldAlert,
  Wrench,
  BookOpen,
  Calculator,
  History,
  Upload,
  PackageCheck,
  ClipboardList,
  FileWarning,
  ArrowUpRight,
} from 'lucide-react';
import {
  BilingualText,
  ChecklistItemStatus,
  TestingLabChecklistLog,
  TestingLabDomainId,
  TestingLabLanguageMode,
  TestingLabSavedRecord,
  TestingLabVerdict,
  TestingLabWorkspaceState,
} from '../../types/testingLab';
import { CalculationRecord, CivilWorkspace, EngineeringModuleId, UserProfile } from '../../types/civil';
import { ConcreteGrade, CubeTestRecord } from '../../types/siteManagement';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { useCivilLab } from '../../context/CivilLabContext';
import {
  TESTING_LAB_DOMAINS,
  TESTING_LAB_DOMAIN_MAP,
  TESTING_LAB_TEST_MAP,
  TESTING_LAB_TESTS,
  getTestsForDomain,
} from '../../data/testingLabCatalog';
import {
  buildPrintableLabCertificateHtml,
  evaluateLabTest,
  exportLabTestCertificatePdf,
  getDefaultChecklistStates,
  getDefaultInputsForTest,
  getSamplePresetInputsForTest,
} from '../../utils/testingLabEngine';
import { generateUUID } from '../../utils/storage';
import { triggerSafeDomPrint } from '../../utils/exportEngine';
import { formatFeetInches } from '../../utils/unitConverter';
import { resolveUnitAndCategory } from '../../utils/unitEngine';
import { NumericDraftInput } from '../ui/NumericDraftInput';

export interface TestingLabHubProps {
  activeWorkspace: CivilWorkspace;
  userProfile?: UserProfile;
  onUpdateTestingLab: (updater: (prev: TestingLabWorkspaceState) => TestingLabWorkspaceState) => void;
  onSaveToHistory?: (record: CalculationRecord) => void;
  onSyncToCubeRegister?: (payload: Omit<CubeTestRecord, 'id' | 'day7TestDate' | 'day28TestDate'>) => void;
  onNavigateToModule?: (moduleId: EngineeringModuleId, subAction?: string) => void;
  onNotify?: (msg: string) => void;
}

const DEFAULT_TESTING_LAB_STATE: TestingLabWorkspaceState = {
  activeDomainId: 'cement',
  activeTestId: 'cem-field-lumps',
  languageMode: 'dual',
  draftInputsByTestId: {},
  draftChecklistsByTestId: {},
  savedRecords: [],
  checklistLogs: [],
};

function renderBilingual(
  text: BilingualText,
  mode: TestingLabLanguageMode,
  options?: { enClass?: string; bnClass?: string; inline?: boolean }
) {
  const enCls = options?.enClass || 'text-slate-800 dark:text-slate-100';
  const bnCls = options?.bnClass || 'font-nikosh text-slate-600 dark:text-slate-300';

  if (mode === 'en') {
    return <span className={enCls}>{text.en}</span>;
  }
  if (mode === 'bn') {
    return (
      <span className={bnCls} lang="bn">
        {text.bn}
      </span>
    );
  }
  if (options?.inline) {
    return (
      <span>
        <span className={enCls}>{text.en}</span>
        <span className="mx-1.5 text-slate-400">·</span>
        <span className={bnCls} lang="bn">
          {text.bn}
        </span>
      </span>
    );
  }
  return (
    <div className="space-y-1">
      <div className={enCls}>{text.en}</div>
      <div className={bnCls} lang="bn">
        {text.bn}
      </div>
    </div>
  );
}

export const TestingLabHub: React.FC<TestingLabHubProps> = ({
  activeWorkspace,
  userProfile,
  onUpdateTestingLab,
  onSaveToHistory,
  onSyncToCubeRegister,
  onNavigateToModule,
  onNotify,
}) => {
  const { siteData, logLabVerdictToDpr, updateInventoryQaStatus } = useSiteManagement();
  const { userProfile: civilLabProfile, setPendingNcrDraft } = useCivilLab();

  const labState: TestingLabWorkspaceState = activeWorkspace.testingLab || DEFAULT_TESTING_LAB_STATE;
  const langMode = labState.languageMode || 'dual';

  const activeDomain = TESTING_LAB_DOMAIN_MAP[labState.activeDomainId] || TESTING_LAB_DOMAINS[0];
  const domainTests = useMemo(() => getTestsForDomain(activeDomain.id), [activeDomain.id]);
  const activeTest = useMemo(() => {
    const found = TESTING_LAB_TEST_MAP[labState.activeTestId];
    if (found && found.domainId === activeDomain.id) return found;
    return domainTests[0];
  }, [labState.activeTestId, activeDomain.id, domainTests]);

  const [sampleRef, setSampleRef] = useState('');
  const [locationGrid, setLocationGrid] = useState('');
  const [remarks, setRemarks] = useState('');
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [logFilterDomain, setLogFilterDomain] = useState<'all' | TestingLabDomainId>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedStoreItemId, setSelectedStoreItemId] = useState<string>('');

  const matchedDefaultStoreItemId = useMemo(() => {
    const inv = siteData.inventory || [];
    if (inv.length === 0) return '';
    const dId = activeTest.domainId;
    const kwMap: Record<string, RegExp> = {
      cement: /cement|opc|pcc|সিমেন্ট/i,
      aggregates: /sand|stone|brick|khoa|aggregate|বালি|পাথর/i,
      bricks: /brick|block|ইট|ব্লক/i,
      concrete: /cement|stone|sand|concrete|rmc/i,
      rebar: /rebar|steel|rod|bar|রড/i,
      bitumen: /bitumen|asphalt|prime|tack/i,
      'water-plumbing': /pipe|water|waterproof|chemical|admixture/i,
    };
    const rx = kwMap[dId];
    if (rx) {
      const match = inv.find((it) => rx.test(it.name) || rx.test(it.category));
      if (match) return match.id;
    }
    return inv[0].id;
  }, [siteData.inventory, activeTest.domainId]);

  const effectiveStoreItemId =
    selectedStoreItemId && siteData.inventory.some((it) => it.id === selectedStoreItemId)
      ? selectedStoreItemId
      : matchedDefaultStoreItemId;

  const currentInputs = useMemo(
    () => ({
      ...getDefaultInputsForTest(activeTest),
      ...(labState.draftInputsByTestId[activeTest.id] || {}),
    }),
    [activeTest, labState.draftInputsByTestId]
  );

  const currentChecklistStates = useMemo(
    () => ({
      ...getDefaultChecklistStates(activeTest),
      ...(labState.draftChecklistsByTestId[activeTest.id] || {}),
    }),
    [activeTest, labState.draftChecklistsByTestId]
  );

  const evaluation = useMemo(
    () => evaluateLabTest(activeTest.id, currentInputs, currentChecklistStates),
    [activeTest.id, currentInputs, currentChecklistStates]
  );

  const setDomain = (domainId: TestingLabDomainId) => {
    const tests = getTestsForDomain(domainId);
    onUpdateTestingLab((prev) => ({
      ...prev,
      activeDomainId: domainId,
      activeTestId: tests[0]?.id || prev.activeTestId,
    }));
  };

  const setTestId = (testId: string) => {
    onUpdateTestingLab((prev) => ({
      ...prev,
      activeTestId: testId,
    }));
  };

  const setLangMode = (mode: TestingLabLanguageMode) => {
    onUpdateTestingLab((prev) => ({
      ...prev,
      languageMode: mode,
    }));
  };

  const updateInput = (key: string, value: number) => {
    onUpdateTestingLab((prev) => ({
      ...prev,
      draftInputsByTestId: {
        ...prev.draftInputsByTestId,
        [activeTest.id]: {
          ...getDefaultInputsForTest(activeTest),
          ...(prev.draftInputsByTestId[activeTest.id] || {}),
          [key]: Number.isFinite(value) ? value : 0,
        },
      },
    }));
  };

  const resetInputsToExample = () => {
    onUpdateTestingLab((prev) => ({
      ...prev,
      draftInputsByTestId: {
        ...prev.draftInputsByTestId,
        [activeTest.id]: getDefaultInputsForTest(activeTest),
      },
      draftChecklistsByTestId: {
        ...prev.draftChecklistsByTestId,
        [activeTest.id]: getDefaultChecklistStates(activeTest),
      },
    }));
    onNotify?.(`Reset ${activeTest.code} inputs to 0 baseline.`);
  };

  const loadSampleTestPreset = () => {
    onUpdateTestingLab((prev) => ({
      ...prev,
      draftInputsByTestId: {
        ...prev.draftInputsByTestId,
        [activeTest.id]: getSamplePresetInputsForTest(activeTest),
      },
      draftChecklistsByTestId: {
        ...prev.draftChecklistsByTestId,
        [activeTest.id]: getDefaultChecklistStates(activeTest),
      },
    }));
    onNotify?.(`Loaded sample worked example for ${activeTest.code}.`);
  };

  const updateChecklistItem = (itemId: string, status: ChecklistItemStatus) => {
    onUpdateTestingLab((prev) => ({
      ...prev,
      draftChecklistsByTestId: {
        ...prev.draftChecklistsByTestId,
        [activeTest.id]: {
          ...getDefaultChecklistStates(activeTest),
          ...(prev.draftChecklistsByTestId[activeTest.id] || {}),
          [itemId]: status,
        },
      },
    }));
  };

  const handleSaveRecord = () => {
    const nowIso = new Date().toISOString();
    const tester = userProfile?.fullName || civilLabProfile?.name || activeWorkspace.engineerOfRecord || 'Not Set';

    if (activeTest.checklistItems && activeTest.checklistItems.length > 0) {
      let passed = 0;
      let failed = 0;
      let na = 0;
      let critFail = 0;
      for (const it of activeTest.checklistItems) {
        const st = currentChecklistStates[it.id] || 'PASS';
        if (st === 'PASS') passed += 1;
        else if (st === 'FAIL') {
          failed += 1;
          if (it.critical) critFail += 1;
        } else na += 1;
      }
      const newChecklistLog: TestingLabChecklistLog = {
        id: generateUUID(),
        testId: activeTest.id,
        testCode: activeTest.code,
        checklistTitleEn: activeTest.title.en,
        checklistTitleBn: activeTest.title.bn,
        locationGrid: locationGrid.trim() || 'Site Pour Zone',
        inspector: tester,
        inspectedAt: nowIso,
        totalItems: activeTest.checklistItems.length,
        passedCount: passed,
        failedCount: failed,
        naCount: na,
        criticalFailedCount: critFail,
        itemStates: { ...currentChecklistStates },
        overallVerdict: evaluation.verdict,
        remarks: remarks.trim() || undefined,
      };
      onUpdateTestingLab((prev) => ({
        ...prev,
        checklistLogs: [newChecklistLog, ...(prev.checklistLogs || [])].slice(0, 100),
      }));
    }

    const newRecord: TestingLabSavedRecord = {
      id: generateUUID(),
      testId: activeTest.id,
      testCode: activeTest.code,
      domainId: activeTest.domainId,
      testNameEn: activeTest.title.en,
      testNameBn: activeTest.title.bn,
      governingCodes: activeTest.governingCodes,
      sampleRef: sampleRef.trim() || 'LAB-SMP-001',
      locationGrid: locationGrid.trim() || 'Site Zone',
      testedBy: tester,
      testedAt: nowIso,
      inputs: { ...currentInputs },
      metrics: evaluation.metrics,
      primaryResultLabel: evaluation.primaryMetricLabel.en,
      primaryResultValue: `${evaluation.primaryValue} ${evaluation.primaryUnit}`.trim(),
      codeLimitText: evaluation.codeLimitText,
      verdict: evaluation.verdict,
      verdictDetail: evaluation.verdictDetail,
      steps: evaluation.steps,
      remarks: remarks.trim() || undefined,
    };

    onUpdateTestingLab((prev) => ({
      ...prev,
      savedRecords: [newRecord, ...(prev.savedRecords || [])].slice(0, 150),
    }));

    if (onSaveToHistory) {
      onSaveToHistory({
        id: generateUUID(),
        workspaceId: activeWorkspace.id,
        moduleId: 'testing-lab-qaqc',
        timestamp: nowIso,
        title: `${activeTest.code} · ${activeTest.title.en} (${newRecord.sampleRef})`,
        notes: `${evaluation.verdict}: ${evaluation.verdictDetail.en}`,
        status:
          evaluation.verdict === 'PASS'
            ? 'nominal'
            : evaluation.verdict === 'WARNING'
            ? 'warning'
            : 'critical',
        keyMetrics: evaluation.metrics.slice(0, 4).map((m) => ({
          label: m.labelEn,
          value: m.value,
          unit: m.unit,
        })),
        inputsSnapshot: currentInputs,
      });
    }

    onNotify?.(`Saved ${activeTest.code} test result (${evaluation.verdict}) to Project QA/QC Log & History.`);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const docId = await exportLabTestCertificatePdf({
        test: activeTest,
        inputs: currentInputs,
        evaluation,
        sampleRef,
        locationGrid,
        remarks,
        workspace: activeWorkspace,
        userProfile,
        checklistStates: activeTest.checklistItems ? currentChecklistStates : undefined,
      });
      onNotify?.(`Exported QR-Verified A4 Lab Certificate (${docId}).`);
    } catch (err) {
      console.error('Lab PDF Export error:', err);
      onNotify?.('Failed to export Lab Certificate PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintA4 = async () => {
    const html = await buildPrintableLabCertificateHtml({
      test: activeTest,
      inputs: currentInputs,
      evaluation,
      sampleRef,
      locationGrid,
      remarks,
      workspace: activeWorkspace,
      userProfile,
      checklistStates: activeTest.checklistItems ? currentChecklistStates : undefined,
    });
    triggerSafeDomPrint(html);
  };

  const handleLoadRecord = (rec: TestingLabSavedRecord) => {
    onUpdateTestingLab((prev) => ({
      ...prev,
      activeDomainId: rec.domainId,
      activeTestId: rec.testId,
      draftInputsByTestId: {
        ...prev.draftInputsByTestId,
        [rec.testId]: { ...rec.inputs },
      },
    }));
    setSampleRef(rec.sampleRef);
    setLocationGrid(rec.locationGrid);
    setRemarks(rec.remarks || '');
    setShowSavedDrawer(false);
    onNotify?.(`Loaded saved record ${rec.testCode} (${rec.sampleRef}).`);
  };

  const handleDeleteRecord = (id: string) => {
    onUpdateTestingLab((prev) => ({
      ...prev,
      savedRecords: prev.savedRecords.filter((r) => r.id !== id),
    }));
  };

  const filteredSavedRecords = useMemo(() => {
    if (logFilterDomain === 'all') return labState.savedRecords;
    return labState.savedRecords.filter((r) => r.domainId === logFilterDomain);
  }, [labState.savedRecords, logFilterDomain]);

  const verdictStyle = (verdict: TestingLabVerdict) => {
    if (verdict === 'PASS') {
      return {
        banner: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100',
        badge: 'bg-emerald-600 text-white',
        Icon: CheckCircle2,
      };
    }
    if (verdict === 'WARNING') {
      return {
        banner: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100',
        badge: 'bg-amber-600 text-white',
        Icon: AlertTriangle,
      };
    }
    return {
      banner: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100',
      badge: 'bg-rose-600 text-white',
      Icon: XCircle,
    };
  };

  const vStyle = verdictStyle(evaluation.verdict);
  const VerdictIcon = vStyle.Icon;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 font-sans">
      {/* TOP MODULE HEADER & BILINGUAL LANGUAGE CONTROLS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Testing Lab &amp; Field QA/QC Suite{' '}
              <span className="font-nikosh font-semibold text-blue-600 dark:text-blue-400" lang="bn">
                (নির্মাণ পরীক্ষণ ও মান যাচাই)
              </span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {TESTING_LAB_DOMAINS.length} Engineering Testing Domains · {TESTING_LAB_TESTS.length} Bilingual 10-Section Monographs · Live Lab Calculator · QR A4 Certificates
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* 1-Click Language Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70">
            <Languages className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-2 mr-1.5 shrink-0" />
            {(
              [
                { id: 'dual', label: 'বাংলা + English Dual' },
                { id: 'bn', label: 'শুধু বাংলা' },
                { id: 'en', label: 'English Only' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLangMode(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  langMode === opt.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowSavedDrawer((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              showSavedDrawer
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Saved Lab Logs ({labState.savedRecords.length})</span>
          </button>
        </div>
      </div>

      {/* SAVED PROJECT LAB RECORDS & CHECKLIST LOGS DRAWER */}
      {showSavedDrawer && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Project Saved QA/QC Test &amp; Checklist Register ({activeWorkspace.projectCode})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click Load to reopen inputs in the calculator or export an official A4 certificate.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={logFilterDomain}
                onChange={(e) => setLogFilterDomain(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="all">All 9 Domains</option>
                {TESTING_LAB_DOMAINS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.shortCode} · {d.titleEn}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowSavedDrawer(false)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {filteredSavedRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No saved test certificates in this filter yet. Run any test in Section 10 and click &ldquo;Save to Project Lab Log&rdquo;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-[11px] uppercase font-mono text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-3">Date &amp; Ref</th>
                    <th className="py-2 pr-3">Test</th>
                    <th className="py-2 pr-3">Location / Grid</th>
                    <th className="py-2 pr-3">Result</th>
                    <th className="py-2 pr-3">Verdict</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSavedRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 pr-3 font-mono tabular-nums whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{rec.sampleRef}</div>
                        <div className="text-[11px] text-slate-500">{new Date(rec.testedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {rec.testCode} · {rec.testNameEn}
                        </div>
                        <div className="font-nikosh text-[11px] text-slate-500 dark:text-slate-400" lang="bn">
                          {rec.testNameBn}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{rec.locationGrid}</td>
                      <td className="py-2 pr-3 font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {rec.primaryResultValue}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            rec.verdict === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                              : rec.verdict === 'WARNING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200'
                          }`}
                        >
                          {rec.verdict}
                        </span>
                      </td>
                      <td className="py-2 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadRecord(rec)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Load</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="inline-flex items-center p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Delete Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 9-DOMAIN SELECTOR GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {TESTING_LAB_DOMAINS.map((dom, idx) => {
          const isSelected = dom.id === activeDomain.id;
          return (
            <button
              key={dom.id}
              type="button"
              onClick={() => setDomain(dom.id)}
              className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[11px] font-mono font-bold ${
                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {idx + 1}. {dom.shortCode}
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {getTestsForDomain(dom.id).length} Tests
                </span>
              </div>
              <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white truncate">
                {langMode === 'bn' ? dom.titleBn : dom.titleEn}
              </div>
              {langMode === 'dual' && (
                <div className="font-nikosh text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5" lang="bn">
                  {dom.titleBn}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* TESTS WITHIN ACTIVE DOMAIN */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 px-2">
          {activeDomain.shortCode} Protocols:
        </span>
        {domainTests.map((t) => {
          const isCurrent = t.id === activeTest.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTestId(t.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer text-left ${
                isCurrent
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-500'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="font-mono text-[10px] opacity-80 mr-1.5">{t.code}</span>
              <span>{langMode === 'bn' ? t.title.bn : t.title.en}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* UNIVERSAL 10-SECTION BILINGUAL TEST MONOGRAPH & LIVE ENGINE            */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        {/* SECTION 1: TEST HEADER & GOVERNING STANDARDS */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="font-bold text-blue-600 dark:text-blue-400">01 · {activeTest.code}</span>
              <span className="text-slate-400">|</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {activeTest.testType} ({activeTest.testTypeBn})
              </span>
            </div>
            <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
              Standards: <strong className="text-slate-900 dark:text-white">{activeTest.governingCodes.join(' · ')}</strong>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
            {renderBilingual(activeTest.title, langMode, {
              enClass: 'text-slate-900 dark:text-white font-bold',
              bnClass: 'font-nikosh text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300 block mt-0.5',
            })}
          </h2>

          {/* SECTION 2: OBJECTIVE / PURPOSE */}
          <div className="pt-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>2. Objective &amp; Structural Risk Prevented (পরীক্ষণের উদ্দেশ্য)</span>
            </h3>
            <div className="text-sm leading-relaxed">
              {renderBilingual(activeTest.objective, langMode)}
            </div>
          </div>
        </section>

        {/* SECTION 3 & 4: SAMPLING FREQUENCY & REQUIRED APPARATUS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Sampling Frequency &amp; Required Quantity (নমুনা সংগ্রহের নিয়ম)
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Testing Frequency / পরীক্ষার ফ্রিকোয়েন্সি
                </div>
                {renderBilingual(activeTest.sampling.frequency, langMode)}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Required Sample Quantity / নমুনার পরিমাণ
                </div>
                {renderBilingual(activeTest.sampling.quantity, langMode)}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Inspection Lot Size / লটের মাপ
                </div>
                {renderBilingual(activeTest.sampling.lotSize, langMode)}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4. Required Apparatus, Reagents &amp; Materials (প্রয়োজনীয় যন্ত্রপাতি)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <th className="py-1.5 pr-3">Equipment / Apparatus</th>
                    <th className="py-1.5">Dimensions / Least Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeTest.apparatus.map((app, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 align-top">
                        {renderBilingual(app.item, langMode, {
                          enClass: 'font-semibold text-slate-800 dark:text-slate-100',
                          bnClass: 'font-nikosh text-slate-600 dark:text-slate-300',
                        })}
                      </td>
                      <td className="py-2 font-mono text-[11px] text-slate-600 dark:text-slate-300 align-top">
                        {app.spec}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* SECTION 5 & 6: STEP-BY-STEP PROCEDURE + PRECAUTIONS & CONTRACTOR TRICKS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              5. Step-by-Step Field / Lab Procedure (কার্যপ্রণালী — সহজ ধাপে বর্ণনা)
            </h3>
            <ol className="space-y-2.5 text-xs sm:text-sm">
              {activeTest.procedure.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="flex-1">{renderBilingual(step, langMode)}</div>
                </li>
              ))}
            </ol>
          </section>

          <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>6. Precautions &amp; Site Contractor Tricks (সাবধানতা ও সাইট ফাঁকি)</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              {activeTest.precautionsAndTricks.precautions.map((p, idx) => (
                <div
                  key={`p-${idx}`}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                >
                  <div className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">
                    Technical Precaution · কারিগরি সতর্কতা
                  </div>
                  {renderBilingual(p, langMode)}
                </div>
              ))}
              {activeTest.precautionsAndTricks.contractorTricks.map((t, idx) => (
                <div
                  key={`t-${idx}`}
                  className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70"
                >
                  <div className="text-[10px] font-mono font-bold uppercase text-amber-700 dark:text-amber-300 mb-1">
                    Common Site Pitfall / Contractor Trick · সাইটের সাধারণ ফাঁকি
                  </div>
                  {renderBilingual(t, langMode)}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* SECTION 7: MATHEMATICAL PROCESS, FORMULAS & WORKED EXAMPLE */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            7. Mathematical Process, Exact Formulas &amp; Worked Example (গাণিতিক সূত্র ও উদাহরণসহ হিসাব)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTest.mathSection.formulas.map((f, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {renderBilingual(f.name, langMode, { inline: true })}
                </div>
                <div className="p-2 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto tabular-nums">
                  {f.equation}
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {f.variables.map((v, vi) => (
                    <li key={vi}>• {renderBilingual(v, langMode, { inline: true })}</li>
                  ))}
                </ul>
                <div className="text-[11px] font-mono text-blue-700 dark:text-blue-300">
                  Note: {f.unitNote}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-xs">
            <div className="text-[10px] font-mono font-bold uppercase text-blue-700 dark:text-blue-300 mb-1">
              Solved Numerical Worked Example · সমাধানকৃত উদাহরণ
            </div>
            {renderBilingual(activeTest.mathSection.workedExample, langMode)}
          </div>
        </section>

        {/* SECTION 8 & 9: ACCEPTANCE INTERPRETATION CHART + REMEDIAL ACTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              8. Standard Acceptance Comparison &amp; Interpretation Chart (ফলাফলের তুলনা চার্ট)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Range / Condition</th>
                    <th className="py-2 pr-3">Code Limit</th>
                    <th className="py-2">Engineering Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeTest.acceptanceRanges.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-3 align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            row.tier === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                              : row.tier === 'WARNING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200'
                          }`}
                        >
                          {row.tier}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono font-semibold text-slate-800 dark:text-slate-100 tabular-nums align-top">
                        {row.rangeLabel}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 align-top">
                        {row.codeLimit}
                      </td>
                      <td className="py-2.5 align-top">{renderBilingual(row.interpretation, langMode)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>9. Engineering Remedial Action on Failure (ফেল করলে করণীয়)</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              {activeTest.remedialActions.map((rem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60"
                >
                  {renderBilingual(rem, langMode)}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* =================================================================== */}
        {/* SECTION 10: INTERACTIVE LIVE LAB CALCULATOR & A4 CERTIFICATE ENGINE */}
        {/* =================================================================== */}
        <section className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                10. Interactive Live Lab Calculator &amp; A4 Certificate Generator{' '}
                <span className="font-nikosh font-semibold text-blue-600 dark:text-blue-400" lang="bn">
                  (লাইভ ক্যালকুলেটর ও সার্টিফিকেট)
                </span>
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={resetInputsToExample}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Zero</span>
              </button>
              <button
                type="button"
                onClick={loadSampleTestPreset}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Load Sample Test Data</span>
              </button>
            </div>
          </div>

          {/* Sample Identification Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Sample ID / Challan No
              </label>
              <input
                type="text"
                value={sampleRef}
                onChange={(e) => setSampleRef(e.target.value)}
                placeholder="e.g. SMP-01 / LOT-A"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Structural Member / Grid Location
              </label>
              <input
                type="text"
                value={locationGrid}
                onChange={(e) => setLocationGrid(e.target.value)}
                placeholder="e.g. Grid A1–C4 / Ground Slab"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                QA/QC Engineer Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional site note or challan observation..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Domain 9 Interactive Checklist Table (if applicable) */}
          {activeTest.checklistItems && activeTest.checklistItems.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Interactive Weighted Site Inspection Checklist ({activeTest.checklistItems.length} Points)</span>
                </span>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  {evaluation.weightedScorePct !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold ${
                        evaluation.weightedScorePct >= 90
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : evaluation.weightedScorePct >= 75
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      Weighted Score: {evaluation.weightedScorePct.toFixed(0)}%
                    </span>
                  )}
                  <span className="text-slate-500 dark:text-slate-400">
                    Critical * (Auto-Hold)
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeTest.checklistItems.map((it) => {
                  const st = currentChecklistStates[it.id] || 'PASS';
                  const itemWt = it.weight ?? (it.critical ? 20 : 10);
                  return (
                    <div
                      key={it.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <span>{it.category.en}</span>
                          <span>·</span>
                          <span>{it.codeRef}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            Wt: {itemWt}
                          </span>
                          {it.critical && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">*CRITICAL</span>
                          )}
                        </div>
                        <div className="text-xs">
                          {renderBilingual(it.item, langMode)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(['PASS', 'FAIL', 'NA'] as ChecklistItemStatus[]).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateChecklistItem(it.id, opt)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                              st === opt
                                ? opt === 'PASS'
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : opt === 'FAIL'
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-slate-600 text-white border-slate-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive 10-Reading Schmidt Hammer Grid (LAB-CON-04) */}
          {activeTest.id === 'con-rebound-hammer' && (() => {
            const defaultGrid = [36, 35, 37, 36, 38, 34, 36, 37, 35, 36];
            const vals = defaultGrid.map((defVal, idx) => {
              const raw = currentInputs[`r${idx + 1}`];
              return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : defVal;
            });
            const initMean = vals.reduce((a, b) => a + b, 0) / vals.length;
            const outlierFlags = vals.map((v) => Math.abs(v - initMean) > 6.0);
            const kept = vals.filter((_, idx) => !outlierFlags[idx]);
            const outlierCount = vals.length - kept.length;
            const validMean = kept.length > 0 ? kept.reduce((a, b) => a + b, 0) / kept.length : initMean;

            const syncGrid = (nextVals: number[]) => {
              const m0 = nextVals.reduce((a, b) => a + b, 0) / nextVals.length;
              const k = nextVals.filter((v) => Math.abs(v - m0) <= 6.0);
              const nextMean = k.length > 0 ? k.reduce((a, b) => a + b, 0) / k.length : m0;
              onUpdateTestingLab((prev) => {
                const prevMap = { ...getDefaultInputsForTest(activeTest), ...(prev.draftInputsByTestId[activeTest.id] || {}) };
                nextVals.forEach((v, idx) => {
                  prevMap[`r${idx + 1}`] = v;
                });
                prevMap.rawMeanRebound = Number(nextMean.toFixed(1));
                return {
                  ...prev,
                  draftInputsByTestId: {
                    ...prev.draftInputsByTestId,
                    [activeTest.id]: prevMap,
                  },
                };
              });
            };

            return (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Interactive 10-Point ASTM C805 Rebound Grid · ১০-পয়েন্ট শ্মিট হ্যামার গ্রিড
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                    <span className={outlierCount > 2 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-blue-600 dark:text-blue-400 font-bold'}>
                      Valid Mean = {validMean.toFixed(1)} ({outlierCount} discarded &gt;±6)
                    </span>
                    <button
                      type="button"
                      onClick={() => syncGrid(defaultGrid)}
                      className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-[11px] font-sans font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Reset Grid
                    </button>
                  </div>
                </div>
                <div className="p-3.5 grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-white dark:bg-slate-900">
                  {vals.map((val, idx) => {
                    const isOutlier = outlierFlags[idx];
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border ${
                          isOutlier
                            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className="font-bold text-slate-500 dark:text-slate-400">Pt #{idx + 1}</span>
                          {isOutlier ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400">OUTLIER</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">OK</span>
                          )}
                        </div>
                        <NumericDraftInput
                          min={0}
                          max={70}
                          step={1}
                          value={val}
                          highlightZero
                          onChangeValue={(nextVal) => {
                            const nextArr = [...vals];
                            nextArr[idx] = nextVal;
                            syncGrid(nextArr);
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>ASTM C805 Rule: Discard readings &gt; ±6 from 10-pt mean ({initMean.toFixed(1)}). If &gt;2 outliers, discard entire set.</span>
                  <span className="tabular-nums">Angle Δα synced live below</span>
                </div>
              </div>
            );
          })()}

          {/* Interactive 5-Element Slump Reference & Profile Picker (LAB-CON-01) */}
          {activeTest.id === 'con-slump-cone' && (() => {
            const presetCode = Math.round(currentInputs.elementPresetCode ?? 3);
            const slumpTypeCode = Math.round(currentInputs.slumpTypeCode ?? 1);
            const elements = [
              { code: 1, name: 'Road Pavement / Dry Mass', range: '25–50 mm (1"–2")' },
              { code: 2, name: 'Mass Footing / Sub-Structure', range: '50–75 mm (2"–3")' },
              { code: 3, name: 'Normal Beam, Slab & Column', range: '75–125 mm (3"–5")' },
              { code: 4, name: 'Pumped Concrete / Dense Rebar', range: '100–150 mm (4"–6")' },
              { code: 5, name: 'Cast-in-Situ Bored Pile Tremie', range: '150–200 mm (6"–8")' },
            ];
            const profiles = [
              { code: 1, name: 'True Slump', note: 'Even symmetrical drop · PASS', tone: 'emerald' },
              { code: 2, name: 'Zero Slump', note: 'Dry stiff mix · Vibrate/Admix', tone: 'amber' },
              { code: 3, name: 'Shear Slump', note: 'Half slides · Remix & Retest', tone: 'amber' },
              { code: 4, name: 'Collapse Slump', note: 'Soupy segregation · REJECT', tone: 'rose' },
            ];
            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold uppercase text-slate-600 dark:text-slate-300">
                    BNBC / ACI Standard Element Slump Presets (Click to Select)
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {elements.map((el) => {
                      const active = presetCode === el.code;
                      return (
                        <button
                          key={el.code}
                          type="button"
                          onClick={() => updateInput('elementPresetCode', el.code)}
                          className={`w-full px-3.5 py-2 flex items-center justify-between text-xs text-left cursor-pointer transition-colors ${
                            active
                              ? 'bg-blue-50/80 dark:bg-blue-950/30 font-bold text-blue-700 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <span>{el.name}</span>
                          <span className="font-mono tabular-nums">{el.range}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-600 dark:text-slate-300">
                    Slump Profile Visual Audit (Click Type)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {profiles.map((p) => {
                      const active = slumpTypeCode === p.code;
                      return (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => updateInput('slumpTypeCode', p.code)}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                            active
                              ? p.tone === 'emerald'
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                                : p.tone === 'amber'
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100'
                                : 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="text-xs font-bold">{p.name}</div>
                          <div className="text-[10px] font-mono opacity-80 mt-0.5">{p.note}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Interactive 6-Sieve FM Gradation Table (LAB-AGG-02) */}
          {activeTest.id === 'agg-sand-fm' && (() => {
            const sieves = [
              { key: 'retained4G', label: '#4 (4.75 mm)', mm: 4.75 },
              { key: 'retained8G', label: '#8 (2.36 mm)', mm: 2.36 },
              { key: 'retained16G', label: '#16 (1.18 mm)', mm: 1.18 },
              { key: 'retained30G', label: '#30 (0.60 mm)', mm: 0.6 },
              { key: 'retained50G', label: '#50 (0.30 mm)', mm: 0.3 },
              { key: 'retained100G', label: '#100 (0.15 mm)', mm: 0.15 },
              { key: 'panMassG', label: 'Pan (< 0.15 mm)', mm: 0 },
            ];
            const weights = sieves.map((s) => Math.max(0, currentInputs[s.key] ?? 0));
            const totalW = Math.max(1, weights.reduce((a, b) => a + b, 0));
            let running = 0;
            const rows = sieves.map((s, idx) => {
              const wt = weights[idx];
              const indPct = (wt / totalW) * 100;
              running += wt;
              const cumPct = idx < 6 ? (running / totalW) * 100 : 100;
              const passingPct = idx < 6 ? Math.max(0, 100 - cumPct) : 0;
              return { ...s, wt, indPct, cumPct, passingPct };
            });
            const sumCum6 = rows.slice(0, 6).reduce((a, r) => a + r.cumPct, 0);
            const fmVal = sumCum6 / 100;
            return (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Interactive 6-Sieve ASTM C136 Gradation Table · ৬-সিভ চালনি বিশ্লেষণ টেবিল
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    FM = {fmVal.toFixed(2)} (Total W = {totalW.toFixed(1)} g)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
                        <th className="py-2 px-3">ASTM Sieve</th>
                        <th className="py-2 px-3">Weight Retained (g)</th>
                        <th className="py-2 px-3 text-right">Ind. Retained %</th>
                        <th className="py-2 px-3 text-right">Cum. Retained %</th>
                        <th className="py-2 px-3 text-right">% Passing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rows.map((r, idx) => (
                        <tr key={r.key} className={idx === 6 ? 'bg-slate-50/70 dark:bg-slate-800/30' : ''}>
                          <td className="py-1.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-100">{r.label}</td>
                          <td className="py-1.5 px-3">
                            <NumericDraftInput
                              min={0}
                              max={1000}
                              value={r.wt}
                              baseUnit="g"
                              highlightZero
                              onChangeValue={(v) => updateInput(r.key, v)}
                              className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">{r.indPct.toFixed(1)}%</td>
                          <td className="py-1.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                            {idx < 6 ? `${r.cumPct.toFixed(1)}%` : 'Excluded (Pan)'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono tabular-nums text-blue-600 dark:text-blue-400">{r.passingPct.toFixed(1)}%</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-blue-50/40 dark:bg-blue-950/20 font-mono font-bold">
                        <td className="py-2 px-3 text-slate-800 dark:text-slate-100">Sum (#4–#100)</td>
                        <td className="py-2 px-3 tabular-nums">{totalW.toFixed(1)} g</td>
                        <td className="py-2 px-3 text-right tabular-nums">100.0%</td>
                        <td className="py-2 px-3 text-right text-blue-700 dark:text-blue-300 tabular-nums">{sumCum6.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-blue-700 dark:text-blue-300 tabular-nums">FM = {fmVal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                  {[
                    { range: '1.20–1.50', title: 'Local/Domar Plaster', active: fmVal >= 1.2 && fmVal < 1.5 },
                    { range: '1.50–1.80', title: 'Masonry Mortar', active: fmVal >= 1.5 && fmVal < 2.2 },
                    { range: '2.20–2.50', title: 'Blended General RCC', active: fmVal >= 2.2 && fmVal < 2.5 },
                    { range: '2.50–3.00', title: 'Sylhet Structural RCC', active: fmVal >= 2.5 && fmVal <= 3.05 },
                  ].map((b) => (
                    <div
                      key={b.range}
                      className={`px-2.5 py-1.5 rounded-lg border font-mono ${
                        b.active
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <div>{b.range} FM</div>
                      <div className="font-sans font-semibold">{b.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Raw Observation Inputs + Live Verdict & Computed Output */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Observation Inputs */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                Raw Lab / Field Observations
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                {activeTest.calculatorInputs.map((field) => {
                  const currentVal = typeof currentInputs[field.key] === 'number' && Number.isFinite(currentInputs[field.key]) ? currentInputs[field.key] : 0;
                  return (
                    <div
                      key={field.key}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {renderBilingual(field.label, langMode, { inline: true })}
                        </label>
                        {!field.options?.length && currentVal === 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                            0 BASELINE
                          </span>
                        )}
                      </div>
                      {field.options && field.options.length > 0 ? (
                        <select
                          value={currentVal}
                          onChange={(e) => updateInput(field.key, parseFloat(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                        >
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {langMode === 'bn'
                                ? opt.label.bn
                                : langMode === 'en'
                                ? opt.label.en
                                : `${opt.label.en} · ${opt.label.bn}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <NumericDraftInput
                            value={currentVal}
                            min={field.min ?? 0}
                            max={field.max}
                            allowNegative={typeof field.min === 'number' && field.min < 0}
                            baseUnit={field.unit}
                            highlightZero
                            onChangeValue={(v) => updateInput(field.key, v)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white"
                          />
                          {!resolveUnitAndCategory(field.unit) && (
                            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 w-16 text-right shrink-0">
                              {field.unit}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Real-Time Calculation & Verdict Dashboard */}
            <div className="lg:col-span-7 space-y-4">
              {/* Verdict Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${vStyle.banner}`}>
                <VerdictIcon className="w-6 h-6 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${vStyle.badge}`}>
                      {evaluation.verdict}
                    </span>
                    <span className="text-sm font-bold">
                      {renderBilingual(evaluation.verdictHeadline, langMode, { inline: true })}
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed">
                    {renderBilingual(evaluation.verdictDetail, langMode)}
                  </div>
                  <div className="text-[11px] font-mono opacity-85 pt-0.5">
                    Acceptance Standard: {evaluation.codeLimitText}
                  </div>
                </div>
              </div>

              {/* Computed Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {evaluation.metrics.map((m, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border ${
                      m.highlight
                        ? 'border-blue-300 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {langMode === 'bn' ? m.labelBn : m.labelEn}
                      {langMode === 'dual' && (
                        <span className="font-nikosh ml-1.5 text-slate-400" lang="bn">
                          ({m.labelBn})
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-lg font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {m.value}{' '}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Calculation Steps */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-1">
                <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Live Analytical Derivation Steps
                </div>
                {evaluation.steps.map((s, idx) => (
                  <div
                    key={idx}
                    className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300"
                  >
                    {s}
                  </div>
                ))}
              </div>

              {/* Domain 1 Interactive 5-Point Field Cement Lot Inspection Scorecard */}
              {activeDomain.id === 'cement' && (() => {
                const scKey = '__cem_scorecard__';
                const scState = labState.draftInputsByTestId[scKey] || {};
                const checks = [
                  { id: 'chkLumps', testId: 'cem-field-lumps', labelEn: '1. Lumps & Bag Weight (≥49.5 kg, ≤2%)', labelBn: '১. দলা ও ওজন যাচাই' },
                  { id: 'chkColor', testId: 'cem-field-color-rub', labelEn: '2. Color, Cool Temp & Silky Rubbing', labelBn: '২. রঙ, তাপমাত্রা ও মসৃণতা' },
                  { id: 'chkFloat', testId: 'cem-field-float', labelEn: '3. Float Test (3–15s, Zero Chalk Scum)', labelBn: '৩. পানিতে ভাসা পরীক্ষা' },
                  { id: 'chkPaste', testId: 'cem-field-glass-plate', labelEn: '4. Glass Plate 24h Setting & Soundness', labelBn: '৪. কাঁচের প্লেট পেস্ট পরীক্ষা' },
                  { id: 'chkAge', testId: 'cem-field-packing-storage', labelEn: '5. Packing Date & Storage Age (≤60–90d)', labelBn: '৫. উৎপাদনের তারিখ ও বয়স' },
                ];
                const statuses = checks.map((c) => scState[c.id] ?? 1);
                const passCount = statuses.filter((v) => v === 1).length;
                const failCount = statuses.filter((v) => v === 3).length;
                const lotDecision =
                  failCount > 0 ? 'REJECT / LAB HOLD' : passCount === 5 ? 'ACCEPT LOT FOR RCC' : 'CONDITIONAL — SCREEN / RETEST';
                const updateScoreItem = (id: string, val: number) => {
                  onUpdateTestingLab((prev) => ({
                    ...prev,
                    draftInputsByTestId: {
                      ...prev.draftInputsByTestId,
                      [scKey]: { ...(prev.draftInputsByTestId[scKey] || {}), [id]: val },
                    },
                  }));
                };
                const syncFromLiveTests = () => {
                  const nextMap: Record<string, number> = {};
                  for (const c of checks) {
                    const testInputs = labState.draftInputsByTestId[c.testId] || {};
                    const ev = evaluateLabTest(c.testId, testInputs);
                    nextMap[c.id] = ev.verdict === 'PASS' ? 1 : ev.verdict === 'WARNING' ? 2 : 3;
                  }
                  onUpdateTestingLab((prev) => ({
                    ...prev,
                    draftInputsByTestId: { ...prev.draftInputsByTestId, [scKey]: nextMap },
                  }));
                  onNotify?.('Synced 5-Point Cement Scorecard from your active Field Check results.');
                };
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          5-Point Field Cement Lot Inspection Scorecard{' '}
                          <span className="font-nikosh text-blue-600 dark:text-blue-400" lang="bn">
                            (৫-পয়েন্ট সাইট সিমেন্ট অনুমোদন কার্ড)
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          Score: {passCount}/5 PASS · Verdict: <strong className={failCount > 0 ? 'text-rose-600' : passCount === 5 ? 'text-emerald-600' : 'text-amber-600'}>{lotDecision}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={syncFromLiveTests}
                        className="px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40"
                      >
                        Sync From 5 Checks
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {checks.map((c, idx) => {
                        const val = statuses[idx];
                        return (
                          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                            <button
                              type="button"
                              onClick={() => setTestId(c.testId)}
                              className="text-left hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
                            >
                              {langMode === 'bn' ? c.labelBn : c.labelEn}
                            </button>
                            <div className="flex items-center gap-1">
                              {[
                                { code: 1, label: 'PASS', cls: 'bg-emerald-600 text-white border-emerald-600' },
                                { code: 2, label: 'WARN', cls: 'bg-amber-600 text-white border-amber-600' },
                                { code: 3, label: 'FAIL', cls: 'bg-rose-600 text-white border-rose-600' },
                              ].map((opt) => (
                                <button
                                  key={opt.code}
                                  type="button"
                                  onClick={() => updateScoreItem(c.id, opt.code)}
                                  className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold cursor-pointer ${
                                    val === opt.code
                                      ? opt.cls
                                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke Comparison Table for CEM-I vs CEM-II Mortar Strength */}
              {activeTest.id === 'cem-mortar-strength' && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                    BDS EN 197-1 / ASTM C150 Strength Class Benchmarks (MPa)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-[11px] text-slate-500">
                          <th className="py-1 pr-2">Cement Type</th>
                          <th className="py-1 pr-2 text-right">3-Day Min</th>
                          <th className="py-1 pr-2 text-right">7-Day Min</th>
                          <th className="py-1 text-right">28-Day Min</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                        {[
                          { code: 1, name: 'CEM-I 42.5N (OPC)', d3: '20.0 MPa', d7: '33.0 MPa', d28: '42.5 MPa' },
                          { code: 2, name: 'CEM-I 52.5N (OPC)', d3: '27.0 MPa', d7: '40.0 MPa', d28: '52.5 MPa' },
                          { code: 3, name: 'CEM-II 42.5N (PCC)', d3: '16.0 MPa', d7: '28.0 MPa', d28: '42.5 MPa' },
                        ].map((row) => (
                          <tr
                            key={row.code}
                            className={
                              Math.round(currentInputs.cementGradeCode ?? 1) === row.code
                                ? 'bg-blue-50/80 dark:bg-blue-950/30 font-bold text-blue-700 dark:text-blue-300'
                                : 'text-slate-700 dark:text-slate-300'
                            }
                          >
                            <td className="py-1.5 pr-2 font-sans">{row.name}</td>
                            <td className="py-1.5 pr-2 text-right tabular-nums">{row.d3}</td>
                            <td className="py-1.5 pr-2 text-right tabular-nums">{row.d7}</td>
                            <td className="py-1.5 text-right tabular-nums">{row.d28}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bespoke Farrah Box Mix Adjustment Table for Sand Bulking (LAB-AGG-03) */}
              {activeTest.id === 'agg-sand-bulking' && (() => {
                const h1 = Math.max(1, currentInputs.dampHeightH1 ?? 200);
                const h2 = Math.max(1, currentInputs.saturatedHeightH2 ?? 166);
                const mult = 1 + Math.max(0, (h1 - h2) / h2);
                const presets = [
                  { mix: '1 : 1.5 : 3 RCC (1 bag)', dry: 1.875 },
                  { mix: '1 : 2 : 4 RCC (1 bag)', dry: 2.5 },
                  { mix: '1 : 4 Masonry Mortar', dry: 5.0 },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      Site Farrah Box Volume Compensation Schedule (×{mult.toFixed(3)})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                      {presets.map((p) => (
                        <div key={p.mix} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="font-sans text-[11px] font-semibold text-slate-500">{p.mix}</div>
                          <div className="mt-0.5 tabular-nums text-slate-900 dark:text-white font-bold">
                            {p.dry.toFixed(2)} → {(p.dry * mult).toFixed(2)} CFT
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke 20-Brick Cumulative Tolerance & Feet-Inches Readout (LAB-BRK-01) */}
              {activeTest.id === 'brk-field-checks' && (() => {
                const isTrad = Math.round(currentInputs.brickStdCode ?? 1) === 2;
                const rows = [
                  {
                    axis: '20 × Length',
                    measured: currentInputs.cum20LenMm ?? 4760,
                    target: isTrad ? 4826 : 4800,
                    tol: 80,
                    tradNote: '190" (15\'-10")',
                  },
                  {
                    axis: '20 × Width',
                    measured: currentInputs.cum20WidMm ?? 2280,
                    target: isTrad ? 2286 : 2300,
                    tol: 40,
                    tradNote: '90" (7\'-6")',
                  },
                  {
                    axis: '20 × Height',
                    measured: currentInputs.cum20HgtMm ?? 1385,
                    target: isTrad ? 1397 : 1400,
                    tol: 40,
                    tradNote: '55" (4\'-7")',
                  },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      20-Brick Cumulative Dimension Audit (Metric mm + Imperial Feet-Inch)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-[11px] text-slate-500">
                            <th className="py-1 pr-2">Axis</th>
                            <th className="py-1 pr-2">Measured (mm / ft-in)</th>
                            <th className="py-1 pr-2">Target (±Tol)</th>
                            <th className="py-1 text-right">Dev</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                          {rows.map((r) => {
                            const dev = r.measured - r.target;
                            const ok = Math.abs(dev) <= r.tol;
                            return (
                              <tr key={r.axis}>
                                <td className="py-1.5 pr-2 font-sans font-semibold">{r.axis}</td>
                                <td className="py-1.5 pr-2 tabular-nums">
                                  {r.measured} mm ({formatFeetInches(r.measured / 1000, { isMeters: true })})
                                </td>
                                <td className="py-1.5 pr-2 tabular-nums">
                                  {isTrad ? r.tradNote : `${r.target} ±${r.tol} mm`}
                                </td>
                                <td className={`py-1.5 text-right font-bold tabular-nums ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {dev >= 0 ? '+' : ''}{dev} mm
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke BNBC-2020 / ACI 318 Compliance + 1-Click Sync to SM-08 Cube Register (LAB-CON-02) */}
              {activeTest.id === 'con-cylinder-cube' && (() => {
                const fc = currentInputs.designFcMpa ?? 0;
                const ageD = Math.max(1, Math.round(currentInputs.testAgeDays ?? 28));
                const specTypeCode = Math.round(currentInputs.specTypeCode ?? 1);
                const area = specTypeCode === 2 ? 22500 : specTypeCode === 3 ? Math.PI * 2500 : Math.PI * 5625;
                const factor = specTypeCode === 2 ? 0.8 : 1.0;
                const p1 = Math.max(0, currentInputs.load1Kn ?? 0);
                const p2 = Math.max(0, currentInputs.load2Kn ?? 0);
                const p3 = Math.max(0, currentInputs.load3Kn ?? 0);
                if (fc <= 0 || (p1 <= 0 && p2 <= 0 && p3 <= 0)) return null;
                const currMean = (((p1 + p2 + p3) * 1000) / (3 * area)) * factor;
                const prev1 = currentInputs.prevTest1Mpa ?? currMean;
                const prev2 = currentInputs.prevTest2Mpa ?? currMean;
                const rolling3 = (currMean + prev1 + prev2) / 3;
                const floor28 = fc <= 35 ? Math.max(0, fc - 3.5) : 0.9 * fc;
                const minConsec = Math.min(currMean, prev1, prev2);
                const g1Pass = rolling3 >= fc;
                const g2Pass = minConsec >= floor28;
                const maturityPct = (currMean / fc) * 100;

                const handlePushToCubeRegister = () => {
                  if (!onSyncToCubeRegister) return;
                  const grade: ConcreteGrade =
                    fc >= 40 ? 'M40' : fc >= 35 ? 'M35' : fc >= 30 ? 'M30' : fc >= 25 ? 'M25' : fc >= 20 ? 'M20' : 'M15';
                  const slumpDraft = labState.draftInputsByTestId['con-slump-cone'];
                  const syncedSlumpMm =
                    slumpDraft && typeof slumpDraft.subsidedHeightMm === 'number'
                      ? Math.max(0, 300 - slumpDraft.subsidedHeightMm)
                      : 100;
                  const todayStr = new Date().toISOString().split('T')[0];
                  onSyncToCubeRegister({
                    pourId: sampleRef.trim() || `LAB-${Date.now().toString().slice(-4)}`,
                    castingDate: todayStr,
                    structuralElement: locationGrid.trim() || `${activeWorkspace.projectCode} Structural Member`,
                    concreteGrade: grade,
                    targetStrengthMPa: fc,
                    slumpMm: Math.round(syncedSlumpMm),
                    day7StrengthMPa: ageD <= 14 ? Number(currMean.toFixed(2)) : undefined,
                    day28StrengthMPa: ageD >= 28 ? Number(currMean.toFixed(2)) : undefined,
                    status: evaluation.verdict === 'FAIL' ? 'Failed' : ageD >= 28 && evaluation.verdict === 'PASS' ? 'Passed' : 'Scheduled',
                    labName: 'BD. CivilLab Testing Hub',
                    remarks: `${ageD}d ${evaluation.verdict} (${currMean.toFixed(2)} MPa; 3-Test Avg ${rolling3.toFixed(2)} MPa). ${remarks}`.trim(),
                  });
                };

                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] font-mono font-bold uppercase text-slate-600 dark:text-slate-300">
                        BNBC-2020 / ACI 318-19 2-Gate Audit &amp; Maturity Curve
                      </div>
                      {onSyncToCubeRegister && (
                        <button
                          type="button"
                          onClick={handlePushToCubeRegister}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Sync to Cube-Tests Register (SM-08)</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div className={`p-2.5 rounded-lg border ${g1Pass ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30'}`}>
                        <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Gate 1 · 3-Test Rolling Avg ≥ f&apos;c</div>
                        <div className="font-bold tabular-nums mt-0.5 text-slate-900 dark:text-white">
                          {rolling3.toFixed(2)} vs ≥ {fc.toFixed(1)} MPa · {g1Pass ? 'PASS' : 'BELOW'}
                        </div>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${g2Pass ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-rose-300 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30'}`}>
                        <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Gate 2 · No Single Test &lt; Floor</div>
                        <div className="font-bold tabular-nums mt-0.5 text-slate-900 dark:text-white">
                          {minConsec.toFixed(2)} vs ≥ {floor28.toFixed(1)} MPa · {g2Pass ? 'PASS' : 'FAIL'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                      {[
                        { label: '7-Day Target', target: '65%–70%', active: ageD <= 7 },
                        { label: '14-Day Target', target: '85%–90%', active: ageD > 7 && ageD <= 14 },
                        { label: '28-Day Design', target: '≥ 100% f\'c', active: ageD >= 28 },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className={`px-2.5 py-1.5 rounded-lg border ${
                            m.active
                              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 font-bold text-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <div>{m.label}</div>
                          <div className="tabular-nums">{m.target} {m.active ? `(Now ${maturityPct.toFixed(0)}%)` : ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke ASTM C42 3-Core & L/D Correction Strip (LAB-CON-03) */}
              {activeTest.id === 'con-core-cutting' && (() => {
                const dia = currentInputs.coreDiaMm ?? 0;
                const len = currentInputs.coreLenMm ?? 0;
                const fc = currentInputs.designFcMpa ?? 0;
                if (dia <= 0 || len <= 0 || fc <= 0) return null;
                const ld = len / dia;
                let kLd = 1.0;
                if (ld <= 1.0) kLd = 0.87;
                else if (ld <= 1.25) kLd = 0.87 + ((ld - 1.0) / 0.25) * 0.06;
                else if (ld <= 1.5) kLd = 0.93 + ((ld - 1.25) / 0.25) * 0.03;
                else if (ld <= 1.75) kLd = 0.96 + ((ld - 1.5) / 0.25) * 0.02;
                else if (ld < 2.0) kLd = 0.98 + ((ld - 1.75) / 0.25) * 0.02;
                const area = (Math.PI * dia * dia) / 4;
                const loads = [currentInputs.core1LoadKn ?? 0, currentInputs.core2LoadKn ?? 0, currentInputs.core3LoadKn ?? 0];
                const minCoreLimit = 0.75 * fc;
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      ASTM C42 Core-by-Core Breakdown (L/D = {ld.toFixed(2)} → k_ld = {kLd.toFixed(3)})
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      {loads.map((p, idx) => {
                        const raw = (p * 1000) / area;
                        const corr = raw * kLd;
                        const ok = corr >= minCoreLimit;
                        return (
                          <div key={idx} className={`p-2 rounded-lg border bg-white dark:bg-slate-900 ${ok ? 'border-slate-200 dark:border-slate-800' : 'border-rose-400 dark:border-rose-700'}`}>
                            <div className="text-[10px] text-slate-500">Core #{idx + 1} ({p} kN)</div>
                            <div className={`font-bold tabular-nums ${ok ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
                              {corr.toFixed(2)} MPa
                            </div>
                            <div className="text-[10px] text-slate-400 tabular-nums">Raw {raw.toFixed(1)} MPa</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke IS 13311 UPV Quality Classification Band (LAB-CON-05) */}
              {activeTest.id === 'con-upv' && (() => {
                const pathMm = currentInputs.upvPathMm ?? 0;
                const timeUs = currentInputs.upvTimeUs ?? 0;
                if (pathMm <= 0 || timeUs <= 0) return null;
                const v = pathMm / timeUs;
                const bands = [
                  { label: '> 4.50 km/s', grade: 'Excellent', active: v > 4.5, cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' },
                  { label: '3.50–4.50 km/s', grade: 'Good', active: v >= 3.5 && v <= 4.5, cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' },
                  { label: '3.00–3.49 km/s', grade: 'Medium', active: v >= 3.0 && v < 3.5, cls: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200' },
                  { label: '< 3.00 km/s', grade: 'Poor / Voids', active: v < 3.0, cls: 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      IS 13311 Ultrasonic Pulse Velocity Matrix (V = {v.toFixed(2)} km/s)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      {bands.map((b) => (
                        <div key={b.grade} className={`p-2 rounded-lg border ${b.active ? `${b.cls} font-bold` : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'}`}>
                          <div className="tabular-nums">{b.label}</div>
                          <div className="font-sans text-[11px]">{b.grade}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke Half-Cell Corrosion & BNBC Cover Thresholds (LAB-CON-06) */}
              {activeTest.id === 'con-cover-halfcell' && (() => {
                const mv = currentInputs.halfCellMv ?? -145;
                const zones = [
                  { range: '> -200 mV CSE', status: '<10% Low Risk', active: mv > -200, cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' },
                  { range: '-200 to -350 mV', status: 'Uncertain Activity', active: mv <= -200 && mv >= -350, cls: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200' },
                  { range: '< -350 mV CSE', status: '>90% Active Rust', active: mv < -350, cls: 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      ASTM C876 Half-Cell Potential Thresholds (CSE Electrode)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                      {zones.map((z) => (
                        <div key={z.range} className={`p-2 rounded-lg border ${z.active ? `${z.cls} font-bold` : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'}`}>
                          <div className="tabular-nums">{z.range}</div>
                          <div className="font-sans text-[11px]">{z.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke BDS ISO 6935-2 Rebar Unit Weight Reference Table (LAB-REB-01) */}
              {activeTest.id === 'reb-unit-weight' && (() => {
                const selDia = Math.round(currentInputs.barDiaMm ?? 16);
                const lenMm = Math.max(50, currentInputs.cutLengthMm ?? 1000);
                const massG = Math.max(1, currentInputs.measuredMassG ?? 1552);
                const wAct = massG / lenMm;
                const wStd = (selDia * selDia) / 162.2;
                const areaRatio = wStd > 0 ? wAct / wStd : 1;
                const dias = [8, 10, 12, 16, 20, 22, 25, 28, 32];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                        BDS ISO 6935-2 Standard Rebar Weight Reference (Click Bar Dia)
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
                        Spacing Scale Factor = {areaRatio.toFixed(3)}×
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-[11px] text-slate-500">
                            <th className="py-1 pr-2">Dia</th>
                            <th className="py-1 pr-2 text-right">kg/m (d²/162.2)</th>
                            <th className="py-1 pr-2 text-right">kg/ft</th>
                            <th className="py-1 text-right">BDS Tol.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                          {dias.map((d) => {
                            const kgm = (d * d) / 162.2;
                            const kgft = (d * d) / 532.15;
                            const tol = d <= 12 ? '±6.0%' : '±4.5%';
                            const isSel = selDia === d;
                            return (
                              <tr
                                key={d}
                                onClick={() => updateInput('barDiaMm', d)}
                                className={`cursor-pointer transition-colors ${
                                  isSel
                                    ? 'bg-blue-50/80 dark:bg-blue-950/30 font-bold text-blue-700 dark:text-blue-300'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                                }`}
                              >
                                <td className="py-1 pr-2 tabular-nums">Ø {d} mm</td>
                                <td className="py-1 pr-2 text-right tabular-nums">{kgm.toFixed(3)}</td>
                                <td className="py-1 pr-2 text-right tabular-nums">{kgft.toFixed(3)}</td>
                                <td className="py-1 text-right tabular-nums">{tol}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke BNBC Seismic 3-Gate Ductility Checklist (LAB-REB-02) */}
              {activeTest.id === 'reb-tensile-yield' && (() => {
                const gCode = Math.round(currentInputs.steelGradeCode ?? 1);
                const minFy = gCode === 2 ? 420 : gCode === 3 ? 400 : 500;
                const maxFy = minFy + 125;
                const minRatio = gCode === 4 ? 1.15 : 1.25;
                const dia = Math.max(6, currentInputs.barDiaMm ?? 16);
                const wMeas = currentInputs.measuredUnitWtKgM ?? 0;
                const dEff = wMeas > 0 ? Math.sqrt(162.2 * wMeas) : dia;
                const areaEff = (Math.PI * dEff * dEff) / 4;
                const fy = ((currentInputs.yieldLoadKn ?? 109) * 1000) / areaEff;
                const fu = ((currentInputs.ultimateLoadKn ?? 138) * 1000) / areaEff;
                const ratio = fy > 0 ? fu / fy : 0;
                const g1 = fy >= minFy;
                const g2 = fy <= maxFy;
                const g3 = ratio >= minRatio;
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      BNBC-2020 Seismic Steel 3-Gate Verification
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <div className={`p-2 rounded-lg border ${g1 ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-rose-400 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30'}`}>
                        <div className="text-[10px] text-slate-500">1. Min Yield (fy ≥ {minFy})</div>
                        <div className="font-bold tabular-nums">{fy.toFixed(1)} MPa · {g1 ? 'PASS' : 'FAIL'}</div>
                      </div>
                      <div className={`p-2 rounded-lg border ${g2 ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-amber-400 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30'}`}>
                        <div className="text-[10px] text-slate-500">2. Cap (fy ≤ {maxFy})</div>
                        <div className="font-bold tabular-nums">{fy.toFixed(1)} MPa · {g2 ? 'PASS' : 'OVER'}</div>
                      </div>
                      <div className={`p-2 rounded-lg border ${g3 ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-rose-400 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30'}`}>
                        <div className="text-[10px] text-slate-500">3. Seismic fu/fy ≥ {minRatio}</div>
                        <div className="font-bold tabular-nums">{ratio.toFixed(2)}× · {g3 ? 'PASS' : 'FAIL'}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke Mandrel Pin Table (LAB-REB-04) */}
              {activeTest.id === 'reb-bend-rebend' && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                    BDS ISO 6935-2 / ASTM A615 Maximum Mandrel Pin Diameter
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-[11px] text-slate-500">
                          <th className="py-1 pr-2">Nominal Dia (d)</th>
                          <th className="py-1 pr-2">500W / B500DWR</th>
                          <th className="py-1">400W / Gr.60</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        <tr><td className="py-1 pr-2">8–16 mm</td><td className="py-1 pr-2">4 × d (e.g. 64mm)</td><td className="py-1">3 × d (e.g. 48mm)</td></tr>
                        <tr><td className="py-1 pr-2">20–25 mm</td><td className="py-1 pr-2">5 × d (e.g. 125mm)</td><td className="py-1">4 × d (e.g. 100mm)</td></tr>
                        <tr><td className="py-1 pr-2">28–32 mm</td><td className="py-1 pr-2">7 × d (e.g. 224mm)</td><td className="py-1">5 × d (e.g. 160mm)</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bespoke SPT N60 & (N1)60 Soil Consistency / Relative Density Strip (LAB-SOI-01) */}
              {activeTest.id === 'soil-spt-nvalue' && (() => {
                const soilCode = Math.round(currentInputs.soilClassCode ?? 2);
                const eff = Math.max(30, Math.min(100, currentInputs.hammerEfficiencyPct ?? 60));
                const nField = Math.max(0, currentInputs.n2Blows ?? 8) + Math.max(0, currentInputs.n3Blows ?? 10);
                const rodL = Math.max(1.5, currentInputs.rodLengthM ?? 7.5);
                const bhCode = Math.round(currentInputs.boreholeDiaCode ?? 1);
                const linerCode = Math.round(currentInputs.samplerLinerCode ?? 1);
                const sigmaV = Math.max(10, currentInputs.effOverburdenKpa ?? 90);
                const cR = rodL < 3 ? 0.75 : rodL < 4 ? 0.8 : rodL < 6 ? 0.85 : rodL < 10 ? 0.95 : 1.0;
                const cB = bhCode === 3 ? 1.15 : bhCode === 2 ? 1.05 : 1.0;
                const cS = linerCode === 2 ? 1.2 : 1.0;
                const n60 = nField * (eff / 60) * cB * cS * cR;
                const cN = Math.min(Math.sqrt(100 / sigmaV), 2.0);
                const n1_60 = n60 * cN;
                const targetN = n60;
                const tiers =
                  soilCode === 2
                    ? [
                        { range: '0–4', desc: 'Very Loose (Liquefiable)', active: targetN < 4, cls: 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200' },
                        { range: '4–10', desc: 'Loose Sand', active: targetN >= 4 && targetN < 10, cls: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200' },
                        { range: '10–30', desc: 'Medium Dense', active: targetN >= 10 && targetN <= 30, cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' },
                        { range: '> 30', desc: 'Dense / Very Dense', active: targetN > 30, cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' },
                      ]
                    : [
                        { range: '< 4', desc: 'Very Soft / Soft Clay', active: targetN < 4, cls: 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200' },
                        { range: '4–8', desc: 'Medium Stiff Clay', active: targetN >= 4 && targetN < 8, cls: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200' },
                        { range: '8–15', desc: 'Stiff Clay', active: targetN >= 8 && targetN <= 15, cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' },
                        { range: '> 15', desc: 'Very Stiff / Hard', active: targetN > 15, cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' },
                      ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                        {soilCode === 2 ? 'Granular Sand Relative Density — N₆₀ / (N₁)₆₀' : 'Cohesive Clay Consistency — N₆₀'}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
                        C_R = {cR.toFixed(2)} · C_N = {cN.toFixed(2)} · N₆₀ = {n60.toFixed(1)} · (N₁)₆₀ = {n1_60.toFixed(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      {tiers.map((t) => (
                        <div key={t.range} className={`p-2 rounded-lg border ${t.active ? `${t.cls} font-bold` : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'}`}>
                          <div className="tabular-nums">N = {t.range}</div>
                          <div className="font-sans text-[11px]">{t.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke Plasticity Index & Swelling Potential Matrix (LAB-SOI-02) */}
              {activeTest.id === 'soil-atterberg-limits' && (() => {
                const ll = Math.max(0, currentInputs.liquidLimitPct ?? 42);
                const pl = Math.max(0, currentInputs.plasticLimitPct ?? 21);
                const wn = Math.max(0, currentInputs.naturalMoisturePct ?? 26);
                const pi = ll - pl;
                const li = pi > 0 ? (wn - pl) / pi : 0;
                const bands = [
                  { range: 'PI < 7%', grade: 'Low Plasticity (ML / CL-ML)', active: pi >= 0 && pi < 7, cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' },
                  { range: 'PI 7%–17%', grade: 'Medium Plasticity (CL)', active: pi >= 7 && pi <= 17, cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' },
                  { range: 'PI 17%–25%', grade: 'High Plasticity (Mod. Swell)', active: pi > 17 && pi <= 25, cls: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200' },
                  { range: 'PI > 25%', grade: 'Expansive High-Swell (CH)', active: pi > 25, cls: 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="font-bold uppercase text-slate-500 dark:text-slate-400">
                        ASTM D4318 Plasticity &amp; Swell Potential Band
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
                        PI = {pi.toFixed(1)}% · LI = {li.toFixed(2)} ({li > 1 ? 'Liquid/Sensitive' : li >= 0 ? 'Plastic' : 'Semi-Solid'})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      {bands.map((b) => (
                        <div key={b.range} className={`p-2 rounded-lg border ${b.active ? `${b.cls} font-bold` : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'}`}>
                          <div className="tabular-nums">{b.range}</div>
                          <div className="font-sans text-[11px]">{b.grade}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke Bentonite Slurry Fresh Tank vs Pre-Tremie Gate Comparison (LAB-SOI-04) */}
              {activeTest.id === 'soil-bentonite-slurry' && (() => {
                const stCode = Math.round(currentInputs.slurryStageCode ?? 2);
                const rho = currentInputs.mudDensityGcc ?? 1.07;
                const visc = currentInputs.marshViscositySec ?? 39;
                const sand = currentInputs.sandContentPct ?? 1.8;
                const ph = currentInputs.slurryPh ?? 9.2;
                const maxRho = stCode === 1 ? 1.1 : 1.15;
                const maxSand = stCode === 1 ? 1.0 : 4.0;
                const checks = [
                  { name: 'Density (g/cc)', val: rho.toFixed(3), lim: `1.02–${maxRho.toFixed(2)}`, ok: rho >= 1.02 && rho <= maxRho },
                  { name: 'Marsh Visc (sec)', val: visc.toFixed(1), lim: '32–50 sec', ok: visc >= 32 && visc <= 50 },
                  { name: '200-Mesh Sand (%)', val: sand.toFixed(1), lim: `≤ ${maxSand.toFixed(1)}%`, ok: sand <= maxSand },
                  { name: 'Slurry pH', val: ph.toFixed(1), lim: '8.0–11.0', ok: ph >= 8.0 && ph <= 11.0 },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                        API 13B-1 / PWD Borehole Slurry 4-Gate Pre-Tremie Audit (Click Stage)
                      </span>
                      <div className="flex gap-1.5">
                        {[
                          { code: 1, label: 'Fresh Mixer (Sand ≤1%)' },
                          { code: 2, label: 'Pre-Tremie Toe (Sand ≤4%)' },
                        ].map((s) => (
                          <button
                            key={s.code}
                            type="button"
                            onClick={() => updateInput('slurryStageCode', s.code)}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-semibold cursor-pointer ${
                              stCode === s.code
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      {checks.map((c) => (
                        <div key={c.name} className={`p-2 rounded-lg border ${c.ok ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-rose-400 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30'}`}>
                          <div className="text-[10px] text-slate-500">{c.name}</div>
                          <div className="font-bold tabular-nums">{c.val} ({c.ok ? 'OK' : 'FAIL'})</div>
                          <div className="text-[10px] text-slate-500 tabular-nums">Spec {c.lim}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke Pile Static Davisson Limit & Sonic PIT Velocity Band (LAB-SOI-05) */}
              {activeTest.id === 'soil-pile-static-pit' && (() => {
                const dia = Math.max(250, currentInputs.pileDiaMm ?? 600);
                const len = Math.max(3, currentInputs.pileLengthM ?? 24);
                const q = Math.max(50, currentInputs.testLoadKn ?? 1800);
                const ec = Math.max(15, currentInputs.concreteEcGpa ?? 27);
                const gross = Math.max(0, currentInputs.grossSettlementMm ?? 11.4);
                const net = Math.max(0, currentInputs.netSettlementMm ?? 3.8);
                const dt = Math.max(0.5, currentInputs.pitReflectionMs ?? 12.1);
                const anomaly = Math.max(0, currentInputs.earlyAnomalyDepthM ?? 0);
                const areaMm2 = (Math.PI * dia * dia) / 4;
                const elasticMm = (q * 1000 * len * 1000) / (areaMm2 * ec * 1000);
                const davissonMm = elasticMm + 4 + dia / 120;
                const cWave = (2 * len * 1000) / dt;
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      ASTM D1143 Davisson Offset vs BNBC Settlement &amp; ASTM D5882 PIT Integrity
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <div className={`p-2 rounded-lg border ${gross <= davissonMm ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-rose-400 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30'}`}>
                        <div className="text-[10px] text-slate-500">1. Gross vs Davisson Limit</div>
                        <div className="font-bold tabular-nums">{gross.toFixed(1)} vs ≤ {davissonMm.toFixed(1)} mm</div>
                      </div>
                      <div className={`p-2 rounded-lg border ${net <= 12 ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-rose-400 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30'}`}>
                        <div className="text-[10px] text-slate-500">2. Net Plastic Settlement</div>
                        <div className="font-bold tabular-nums">{net.toFixed(1)} vs ≤ 12.0 mm</div>
                      </div>
                      <div className={`p-2 rounded-lg border ${anomaly === 0 && cWave >= 3600 && cWave <= 4300 ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-rose-400 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30'}`}>
                        <div className="text-[10px] text-slate-500">3. PIT Wave Speed &amp; Shaft</div>
                        <div className="font-bold tabular-nums">{cWave.toFixed(0)} m/s · {anomaly > 0 ? `Defect @ ${anomaly}m` : 'Full Toe'}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke Clickable RHD/LGED Layer CBR Benchmark Table (LAB-HWY-01 & LAB-HWY-02) */}
              {(activeTest.id === 'hwy-cbr-soaked' || activeTest.id === 'hwy-dcp-cbr' || activeTest.id === 'soil-dcp-cbr') && (() => {
                const layerCode = Math.round(currentInputs.pavementLayerCode ?? 2);
                const targetCbr = Math.round(currentInputs.targetCbrPct ?? 10);
                const layers = [
                  { code: 1, name: 'Subgrade Soil (4-Day Soaked)', minCbr: 5, swellMax: '≤ 2.0%' },
                  { code: 2, name: 'Improved Subgrade (ISG)', minCbr: 10, swellMax: '≤ 1.5%' },
                  { code: 3, name: 'Granular Sub-base (GSB)', minCbr: 30, swellMax: '≤ 1.0%' },
                  { code: 4, name: 'Crushed Aggregate Base (WMM)', minCbr: 80, swellMax: '≤ 0.5%' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      RHD / LGED Pavement Layer CBR Specification (Click Layer to Apply Target)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-[11px] text-slate-500">
                            <th className="py-1 pr-2">Pavement Layer</th>
                            <th className="py-1 pr-2 text-right">Min CBR (%)</th>
                            <th className="py-1 text-right">Max Swell</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                          {layers.map((ly) => {
                            const isSel = activeTest.id === 'hwy-cbr-soaked' ? layerCode === ly.code : targetCbr === ly.minCbr;
                            return (
                              <tr
                                key={ly.code}
                                onClick={() =>
                                  activeTest.id === 'hwy-cbr-soaked'
                                    ? updateInput('pavementLayerCode', ly.code)
                                    : updateInput('targetCbrPct', ly.minCbr)
                                }
                                className={`cursor-pointer transition-colors ${
                                  isSel
                                    ? 'bg-blue-50/80 dark:bg-blue-950/30 font-bold text-blue-700 dark:text-blue-300'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                                }`}
                              >
                                <td className="py-1 pr-2 font-sans">{ly.name}</td>
                                <td className="py-1 pr-2 text-right tabular-nums">≥ {ly.minCbr}%</td>
                                <td className="py-1 text-right tabular-nums">{ly.swellMax}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke 60/70 vs 80/100 Bitumen Grade Benchmark Table (LAB-HWY-03) */}
              {activeTest.id === 'hwy-bitumen-penetration' && (() => {
                const gCode = Math.round(currentInputs.bitumenGradeCode ?? 1);
                const rows = [
                  { code: 1, grade: '60/70 Pen (VG-30 Heavy Traffic)', pen: '60–70 dmm', soft: '46–56 °C', duct: '≥ 75 cm', flash: '≥ 230 °C' },
                  { code: 2, grade: '80/100 Pen (VG-10 Light/Seal)', pen: '80–100 dmm', soft: '42–52 °C', duct: '≥ 75 cm', flash: '≥ 225 °C' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      RHD / AASHTO M20 Bitumen Grade Limits (Click Grade to Switch)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-[11px] text-slate-500">
                            <th className="py-1 pr-2">Grade</th>
                            <th className="py-1 pr-2">Pen (25°C)</th>
                            <th className="py-1 pr-2">R&amp;B Softening</th>
                            <th className="py-1 pr-2">Ductility</th>
                            <th className="py-1 text-right">Flash Pt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                          {rows.map((r) => (
                            <tr
                              key={r.code}
                              onClick={() => updateInput('bitumenGradeCode', r.code)}
                              className={`cursor-pointer transition-colors ${
                                gCode === r.code
                                  ? 'bg-blue-50/80 dark:bg-blue-950/30 font-bold text-blue-700 dark:text-blue-300'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                              }`}
                            >
                              <td className="py-1 pr-2 font-sans">{r.grade}</td>
                              <td className="py-1 pr-2 tabular-nums">{r.pen}</td>
                              <td className="py-1 pr-2 tabular-nums">{r.soft}</td>
                              <td className="py-1 pr-2 tabular-nums">{r.duct}</td>
                              <td className="py-1 text-right tabular-nums">{r.flash}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke Marshall Wearing Course vs DBM & Extraction Audit (LAB-HWY-04) */}
              {activeTest.id === 'hwy-marshall-stability' && (() => {
                const cCode = Math.round(currentInputs.courseTypeCode ?? 1);
                const gmm = currentInputs.riceGravityGmm ?? 0;
                const gmb = currentInputs.bulkGravityGmb ?? 0;
                const va = gmm > 0 ? ((gmm - gmb) / gmm) * 100 : 0;
                const w1 = Math.max(0, currentInputs.mixSampleW1G ?? 0);
                const w2 = Math.max(0, currentInputs.extractedAggW2G ?? 0);
                const ash = Math.max(0, currentInputs.mineralAshG ?? 0);
                const pb = w1 > 0 ? ((w1 - w2 + ash) / w1) * 100 : 0;
                const specs = [
                  { code: 1, name: 'Wearing Course (AC / BC)', stab: '≥ 9.0 kN', flow: '2.0–4.0 mm', va: '3.0%–5.0%', pbSpec: '5.0%–6.0%' },
                  { code: 2, name: 'Dense Bituminous Macadam (DBM)', stab: '≥ 8.2 kN', flow: '2.0–4.0 mm', va: '3.0%–6.0%', pbSpec: '4.0%–5.0%' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="font-bold uppercase text-slate-500 dark:text-slate-400">
                        RHD Marshall &amp; Centrifuge Extraction Spec (Click Course)
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
                        Air Voids Va = {va.toFixed(2)}% · Extracted Bitumen Pb = {pb.toFixed(2)}%
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-[11px] text-slate-500">
                            <th className="py-1 pr-2">Asphalt Course</th>
                            <th className="py-1 pr-2">Stability</th>
                            <th className="py-1 pr-2">Flow</th>
                            <th className="py-1 pr-2">Air Voids (Va)</th>
                            <th className="py-1 text-right">Bitumen %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                          {specs.map((sp) => (
                            <tr
                              key={sp.code}
                              onClick={() => updateInput('courseTypeCode', sp.code)}
                              className={`cursor-pointer transition-colors ${
                                cCode === sp.code
                                  ? 'bg-blue-50/80 dark:bg-blue-950/30 font-bold text-blue-700 dark:text-blue-300'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                              }`}
                            >
                              <td className="py-1 pr-2 font-sans">{sp.name}</td>
                              <td className="py-1 pr-2 tabular-nums">{sp.stab}</td>
                              <td className="py-1 pr-2 tabular-nums">{sp.flow}</td>
                              <td className="py-1 pr-2 tabular-nums">{sp.va}</td>
                              <td className="py-1 text-right tabular-nums">{sp.pbSpec}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke Mixing Water RCC vs PCC Chemical Limit Strip (LAB-WAT-01) */}
              {activeTest.id === 'wat-mixing-water' && (() => {
                const mode = Math.round(currentInputs.concreteModeCode ?? 1);
                const modes = [
                  { code: 1, title: 'RCC (Reinforced Concrete)', clMax: '≤ 500 mg/L', so4Max: '≤ 400 mg/L', tdsMax: '≤ 2000 mg/L' },
                  { code: 2, title: 'PCC (Plain Concrete / Mass)', clMax: '≤ 2000 mg/L', so4Max: '≤ 400 mg/L', tdsMax: '≤ 2000 mg/L' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      IS 456 / BNBC Mixing Water Tolerance (Click RCC or PCC)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {modes.map((m) => (
                        <button
                          key={m.code}
                          type="button"
                          onClick={() => updateInput('concreteModeCode', m.code)}
                          className={`text-left p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            mode === m.code
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div className="font-sans">{m.title}</div>
                          <div className="text-[11px] tabular-nums mt-0.5">
                            Cl⁻ {m.clMax} · SO₄²⁻ {m.so4Max} · TDS {m.tdsMax}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bespoke Sanitary Pipe Self-Cleansing Slope Band Helper (LAB-WAT-03) */}
              {activeTest.id === 'wat-sanitary-slope-ball' && (() => {
                const pipeCode = Math.round(currentInputs.pipeDiaCode ?? 1);
                const lenM = Math.max(0.5, currentInputs.runLengthM ?? 15);
                const minDropMm = pipeCode === 1 ? (lenM * 1000) / 80 : (lenM * 1000) / 120;
                const maxDropMm = pipeCode === 1 ? (lenM * 1000) / 60 : (lenM * 1000) / 100;
                const pipes = [
                  { code: 1, label: '100 mm (4") Soil Pipe · Slope 1:60 to 1:80' },
                  { code: 2, label: '150 mm (6") Drain Line · Slope 1:100 to 1:120' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="font-bold uppercase text-slate-500 dark:text-slate-400">
                        BNBC Part VIII Self-Cleansing Invert Drop Window (L = {lenM.toFixed(1)} m)
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
                        Target ΔIL = {minDropMm.toFixed(0)}–{maxDropMm.toFixed(0)} mm
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {pipes.map((p) => (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => updateInput('pipeDiaCode', p.code)}
                          className={`text-left p-2 rounded-lg border cursor-pointer transition-colors ${
                            pipeCode === p.code
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Domain 9 Helper 1: Diagonal Squareness SVG & Camber/Plumb Schematic (LAB-QCS-01) */}
              {activeTest.id === 'qc-pre-pour-rcc' && (() => {
                const lenM = Math.max(0.5, currentInputs.roomLenM ?? 4.0);
                const widM = Math.max(0.5, currentInputs.roomWidM ?? 3.0);
                const dTheoMm = Math.sqrt(lenM * lenM + widM * widM) * 1000;
                const d1Mm = currentInputs.diag1Mm ?? dTheoMm;
                const d2Mm = currentInputs.diag2Mm ?? dTheoMm;
                const maxErrMm = Math.max(
                  Math.abs(d1Mm - d2Mm),
                  Math.abs(d1Mm - dTheoMm),
                  Math.abs(d2Mm - dTheoMm)
                );
                const sqPass = maxErrMm <= 3.0;
                const spanM = Math.max(1.0, currentInputs.slabSpanM ?? 5.2);
                const camMinMm = spanM > 4.5 ? (spanM * 1000) / 500 : 0;
                const camMaxMm = spanM > 4.5 ? (spanM * 1000) / 300 : 0;
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="font-bold uppercase text-slate-600 dark:text-slate-300">
                        Formwork Diagonal Squareness &amp; Camber Schematic (ACI 347R)
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          sqPass
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : maxErrMm <= 5
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        D_theo = {dTheoMm.toFixed(1)} mm · Δ_max = {maxErrMm.toFixed(1)} mm (Limit ≤ 3.0 mm / 1/8&quot;)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5 flex justify-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                        <svg viewBox="0 0 240 130" className="w-full max-w-[230px] h-auto" aria-label="Diagonal Squareness Check">
                          <rect
                            x="32"
                            y="22"
                            width="176"
                            height="86"
                            fill="rgba(59, 130, 246, 0.08)"
                            stroke={sqPass ? '#059669' : '#e11d48'}
                            strokeWidth="2"
                          />
                          <line x1="32" y1="22" x2="208" y2="108" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 3" />
                          <line x1="32" y1="108" x2="208" y2="22" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 3" />
                          <text x="120" y="15" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-[9px] font-mono font-bold">
                            L = {lenM.toFixed(2)} m ({formatFeetInches(lenM)})
                          </text>
                          <text x="18" y="68" textAnchor="middle" transform="rotate(-90 18 68)" className="fill-slate-700 dark:fill-slate-200 text-[9px] font-mono font-bold">
                            W = {widM.toFixed(2)} m
                          </text>
                          <text x="120" y="54" textAnchor="middle" className="fill-blue-700 dark:fill-blue-300 text-[8.5px] font-mono font-bold">
                            D1 = {d1Mm.toFixed(0)} mm
                          </text>
                          <text x="120" y="84" textAnchor="middle" className="fill-amber-700 dark:fill-amber-300 text-[8.5px] font-mono font-bold">
                            D2 = {d2Mm.toFixed(0)} mm
                          </text>
                        </svg>
                      </div>
                      <div className="md:col-span-7 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500">Feet-Inch L × W</div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {formatFeetInches(lenM)} × {formatFeetInches(widM)}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500">Column Plumb / 3m</div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {(currentInputs.plumbErrPer3mMm ?? 3.5).toFixed(1)} mm (≤ 6.0 mm)
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500">Target Camber (Span {spanM.toFixed(1)}m)</div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {spanM > 4.5 ? `${camMinMm.toFixed(1)}–${camMaxMm.toFixed(1)} mm` : '0 mm (≤ 4.5m)'}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500">Prop Spacing c/c</div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {(currentInputs.propSpacingMm ?? 800).toFixed(0)} mm (≤ 900 mm)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Domain 9 Helper 2: BNBC Clear Cover Presets & Seismic L0 Summary (LAB-QCS-02) */}
              {activeTest.id === 'qc-rebar-seismic' && (() => {
                const memCode = Math.round(currentInputs.coverMemberCode ?? 3);
                const colD = Math.max(200, currentInputs.colDepthMm ?? 450);
                const colH = Math.max(1500, currentInputs.colClearHeightMm ?? 3000);
                const stDia = Math.max(6, currentInputs.stirrupBarDiaMm ?? 10);
                const reqL0 = Math.max(colD, colH / 6, 450);
                const reqHook = Math.max(6 * stDia, 75);
                const coverPresets = [
                  { code: 1, label: 'Footing / Pile Cap', reqMm: 75, imperial: '3"' },
                  { code: 2, label: 'Water Tank / Soil Face', reqMm: 50, imperial: '2"' },
                  { code: 3, label: 'Column & Beam', reqMm: 40, imperial: '1.5"' },
                  { code: 4, label: 'Slab & Staircase', reqMm: 20, imperial: '3/4"' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="font-bold uppercase text-slate-600 dark:text-slate-300">
                        BNBC-2020 Clear Cover Presets &amp; Seismic Confinement Audit
                      </span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">
                        L₀ = {reqL0.toFixed(0)} mm · 135° Hook ≥ {reqHook.toFixed(0)} mm · Chairs ≤ 1000 mm
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      {coverPresets.map((p) => (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => updateInput('coverMemberCode', p.code)}
                          className={`text-left p-2 rounded-lg border cursor-pointer transition-colors ${
                            memCode === p.code
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div className="font-sans">{p.label}</div>
                          <div className="text-[11px] mt-0.5">Min {p.reqMm} mm ({p.imperial})</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Domain 9 Helper 3: BNBC §5.11 Stripping Schedule Selector (LAB-QCS-03) */}
              {activeTest.id === 'qc-curing-deshuttering' && (() => {
                const elemCode = Math.round(currentInputs.stripElementCode ?? 3);
                const rows = [
                  { code: 1, title: 'Vertical Sides (Col / Beam / Wall)', baseMin: '24–48 hrs' },
                  { code: 2, title: 'Slab Soffit Ply (Props Fixed)', baseMin: '3–7 days' },
                  { code: 3, title: 'Slab Soffit Props Removal', baseMin: '14d (≤4.5m) / 21d (>4.5m)' },
                  { code: 4, title: 'Beam / Arch Props (≤ 6.0 m)', baseMin: '14–21 days' },
                  { code: 5, title: 'Beam > 6.0 m or Cantilever', baseMin: '28 days + 28d Cube' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-slate-600 dark:text-slate-300">
                      BNBC-2020 §5.11 / PWD Minimum De-Shuttering Matrix (Click to Select Element)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-mono">
                      {rows.map((r) => (
                        <button
                          key={r.code}
                          type="button"
                          onClick={() => updateInput('stripElementCode', r.code)}
                          className={`text-left p-2 rounded-lg border cursor-pointer transition-colors ${
                            elemCode === r.code
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div className="font-sans">{r.title}</div>
                          <div className="text-[11px] mt-0.5 text-blue-700 dark:text-blue-300">{r.baseMin}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Domain 9 Helper 4: Plaster Thickness Presets & 2m Patti Verification (LAB-QCS-04) */}
              {activeTest.id === 'qc-masonry-plaster' && (() => {
                const surfCode = Math.round(currentInputs.plasterSurfaceCode ?? 2);
                const pattiGap = currentInputs.straightedgeGap2mMm ?? 2.0;
                const hollowPct = currentInputs.tileHollowPct ?? 1.5;
                const surfaces = [
                  { code: 1, title: 'RCC Ceiling Soffit', spec: '6–8 mm' },
                  { code: 2, title: 'Internal Brick Wall', spec: '12 mm' },
                  { code: 3, title: 'External Weather Wall', spec: '15–20 mm' },
                ];
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="font-bold uppercase text-slate-600 dark:text-slate-300">
                        Plaster Thickness, 2.0 m Straightedge (Patti) &amp; Tile Tapping Limits
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        2m Patti Gap: {pattiGap.toFixed(1)} mm (≤ 3.0) · Tile Hollow: {hollowPct.toFixed(1)}% (&lt; 5.0%)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                      {surfaces.map((s) => (
                        <button
                          key={s.code}
                          type="button"
                          onClick={() => updateInput('plasterSurfaceCode', s.code)}
                          className={`text-left p-2 rounded-lg border cursor-pointer transition-colors ${
                            surfCode === s.code
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div className="font-sans">{s.title}</div>
                          <div className="text-[11px] mt-0.5 text-blue-700 dark:text-blue-300">Target: {s.spec}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Site Management ERP Connector Strip (DPR, Store Ledger & Official NCR Notice) */}
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Site Management ERP Integration • দৈনিক রিপোর্ট ও স্টোর সংযোগ</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Workspace: {activeWorkspace.projectCode}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* 1. Sync to DPR */}
                  <button
                    type="button"
                    onClick={() => {
                      const tester = userProfile?.fullName || civilLabProfile?.name || activeWorkspace.engineerOfRecord || 'Not Set';
                      logLabVerdictToDpr({
                        testId: activeTest.id,
                        testCode: activeTest.code,
                        testNameEn: activeTest.title.en,
                        testNameBn: activeTest.title.bn,
                        domainId: activeTest.domainId,
                        sampleRef: sampleRef.trim() || 'LAB-SMP-001',
                        locationGrid: locationGrid.trim() || 'Site Zone',
                        primaryResult: `${evaluation.primaryValue} ${evaluation.primaryUnit}`.trim(),
                        codeLimit: evaluation.codeLimitText,
                        verdict: evaluation.verdict,
                        testedBy: tester,
                        remarks: remarks.trim() || undefined,
                      });
                      onNotify?.(`Synced ${activeTest.code} (${evaluation.verdict}) to Today's Daily Progress Report (SM-09).`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Sync to DPR · দৈনিক রিপোর্টে যুক্ত করুন</span>
                  </button>

                  {/* 2. Update Store Material QA Status */}
                  {siteData.inventory.length > 0 && (
                    <div className="inline-flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                      <select
                        value={effectiveStoreItemId}
                        onChange={(e) => setSelectedStoreItemId(e.target.value)}
                        aria-label="Select Store Inventory Material"
                        className="px-2 py-1 text-xs bg-transparent text-slate-800 dark:text-slate-100 max-w-[200px] focus:outline-hidden"
                      >
                        {siteData.inventory.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.qaStatus || 'Pending'})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (!effectiveStoreItemId) return;
                          const targetStatus =
                            evaluation.verdict === 'FAIL' ? 'Quarantined / Rejected' : 'QA Verified';
                          updateInventoryQaStatus(effectiveStoreItemId, targetStatus, {
                            testCode: activeTest.code,
                            testName: activeTest.title.en,
                            sampleRef: sampleRef.trim() || 'LAB-SMP-001',
                            remarks: `${evaluation.verdict}: ${evaluation.primaryValue} ${evaluation.primaryUnit}`.trim(),
                          });
                          const sku = siteData.inventory.find((i) => i.id === effectiveStoreItemId)?.name || effectiveStoreItemId;
                          onNotify?.(`Store SKU "${sku}" marked as ${targetStatus} (${activeTest.code}).`);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          evaluation.verdict === 'FAIL'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>
                          Update Store Status ({evaluation.verdict === 'FAIL' ? 'Quarantine' : 'Verify'})
                        </span>
                      </button>
                    </div>
                  )}

                  {/* 3. Generate Official NCR / Rejection Notice */}
                  {(evaluation.verdict === 'FAIL' || evaluation.verdict === 'WARNING') && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingNcrDraft({
                          ncrNo: `NCR/${activeTest.code}/${new Date().getFullYear()}-${String(Math.floor(10 + Math.random() * 89))}`,
                          titleEn: 'Non-Conformance & Material Rejection Notice',
                          titleBn: 'নিম্নমানের নির্মাণ সামগ্রী প্রত্যাখ্যান ও অপসারণ নোটিশ',
                          locationGrid: `${locationGrid.trim() || 'Site Zone'} (Sample: ${sampleRef.trim() || 'LAB-SMP-001'})`,
                          severity: evaluation.verdict === 'FAIL' ? 'Critical / Safety Hazard' : 'Major',
                          defectDescription: `[${activeTest.code} — ${activeTest.title.en} (${activeTest.title.bn})] VERDICT: ${evaluation.verdict}. Measured Result: ${evaluation.primaryValue} ${evaluation.primaryUnit}. Acceptance Limit: ${evaluation.codeLimitText}. Finding: ${evaluation.verdictDetail.en} (${evaluation.verdictDetail.bn})`,
                          governingCode: activeTest.governingCodes.join(' | '),
                          rectificationActionRequired: `${activeTest.remedialActions.map((a) => `${a.en} (${a.bn})`).join(' ')} Immediately quarantine non-conforming lot or rectify defect prior to resuming work.`,
                          testCode: activeTest.code,
                          verdict: evaluation.verdict === 'FAIL' ? 'FAIL' : 'WARNING',
                        });
                        onNotify?.('Drafted Official Rejection / NCR Notice — opening Site Office Docs (SM-10).');
                        onNavigateToModule?.('office-docs');
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        evaluation.verdict === 'FAIL'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                          : 'border border-amber-500 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100'
                      }`}
                    >
                      <FileWarning className="w-3.5 h-3.5" />
                      <span>Generate Official Notice · অফিশিয়াল চিঠি তৈরি</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSaveRecord}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save to Project Lab Log &amp; History</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isExporting ? 'Generating PDF...' : 'Export Certified Lab PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintA4}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print A4 Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
