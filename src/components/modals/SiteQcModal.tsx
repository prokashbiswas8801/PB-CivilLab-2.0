import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ClipboardList,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { SiteChecklist } from '../calculators/construction/SiteChecklist';
import { AboutThisTool, AboutThisToolButton } from '../ui';
import { NumericDraftInput } from '../ui/NumericDraftInput';
import { TESTING_LAB_TEST_MAP } from '../../data/testingLabCatalog';
import {
  evaluateLabTest,
  getDefaultChecklistStates,
  getDefaultInputsForTest,
} from '../../utils/testingLabEngine';
import { ChecklistItemStatus } from '../../types/testingLab';
import { useSiteManagement } from '../../context/SiteManagementContext';

interface SiteQcModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  engineerName?: string;
  onNavigateToLab?: (testId: string) => void;
}

const STRUCTURAL_VERIFIER_IDS = [
  'qc-pre-pour-rcc',
  'qc-rebar-seismic',
  'qc-curing-deshuttering',
  'qc-masonry-plaster',
] as const;

export const SiteQcModal: React.FC<SiteQcModalProps> = ({
  isOpen,
  onClose,
  projectName,
  engineerName,
  onNavigateToLab,
}) => {
  const { logLabVerdictToDpr } = useSiteManagement();
  const [mode, setMode] = useState<'verifiers' | 'legacy'>('verifiers');
  const [activeVerifierId, setActiveVerifierId] = useState<string>(STRUCTURAL_VERIFIER_IDS[0]);
  const [inputsById, setInputsById] = useState<Record<string, Record<string, number>>>({});
  const [checklistsById, setChecklistsById] = useState<Record<string, Record<string, ChecklistItemStatus>>>({});
  const [locationGrid, setLocationGrid] = useState('Grid A1–C4 / Typical Floor');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const activeTest = TESTING_LAB_TEST_MAP[activeVerifierId] || TESTING_LAB_TEST_MAP[STRUCTURAL_VERIFIER_IDS[0]];

  const currentInputs = useMemo(() => {
    if (!activeTest) return {};
    return {
      ...getDefaultInputsForTest(activeTest),
      ...(inputsById[activeTest.id] || {}),
    };
  }, [activeTest, inputsById]);

  const currentChecklists = useMemo(() => {
    if (!activeTest) return {};
    return {
      ...getDefaultChecklistStates(activeTest),
      ...(checklistsById[activeTest.id] || {}),
    };
  }, [activeTest, checklistsById]);

  const evaluation = useMemo(() => {
    if (!activeTest) return null;
    return evaluateLabTest(activeTest.id, currentInputs, currentChecklists);
  }, [activeTest, currentInputs, currentChecklists]);

  const updateInput = (key: string, val: number) => {
    if (!activeTest) return;
    setInputsById((prev) => ({
      ...prev,
      [activeTest.id]: {
        ...getDefaultInputsForTest(activeTest),
        ...(prev[activeTest.id] || {}),
        [key]: Number.isFinite(val) ? val : 0,
      },
    }));
  };

  const updateChecklist = (itemId: string, status: ChecklistItemStatus) => {
    if (!activeTest) return;
    setChecklistsById((prev) => ({
      ...prev,
      [activeTest.id]: {
        ...getDefaultChecklistStates(activeTest),
        ...(prev[activeTest.id] || {}),
        [itemId]: status,
      },
    }));
  };

  const handleSyncToDpr = () => {
    if (!activeTest || !evaluation) return;
    logLabVerdictToDpr({
      testId: activeTest.id,
      testCode: activeTest.code,
      testNameEn: activeTest.title.en,
      testNameBn: activeTest.title.bn,
      domainId: activeTest.domainId,
      sampleRef: `SITE-QC-${activeTest.code}`,
      locationGrid: locationGrid.trim() || 'Site Pour Zone',
      primaryResult: `${evaluation.primaryValue} ${evaluation.primaryUnit}`.trim(),
      codeLimit: evaluation.codeLimitText,
      verdict: evaluation.verdict,
      testedBy: engineerName || 'Site QA/QC Engineer',
      remarks: `Quick QA/QC Verifier (${projectName || 'Active Project'})`,
    });
    setSyncMessage(`Synced ${activeTest.code} (${evaluation.verdict}) to Today's DPR!`);
    setTimeout(() => setSyncMessage(null), 3500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[92vh] bg-[var(--md-sys-color-surface,#ffffff)] dark:bg-slate-900 border border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-[var(--md-sys-color-surface-container-lowest,#fafafa)] dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface,#0f172a)] dark:text-white">
                    Field QA/QC &amp; Pre-Pour Quality Audit Suite
                  </h2>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant,#64748b)] dark:text-slate-400 font-mono">
                    BNBC 2020 · ACI 318 · ACI 347R · PWD Stripping, Seismic Rebar, Diagonal Squareness &amp; 2m Patti
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMode('verifiers')}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      mode === 'verifiers'
                        ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Quick Structural Verifiers (BNBC-2020)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('legacy')}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      mode === 'legacy'
                        ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Legacy Field Cards
                  </button>
                </div>

                <AboutThisToolButton toolId="site-qc-protocols" targetId="site-qc-doc" />
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
              {mode === 'verifiers' && activeTest && evaluation ? (
                <div className="space-y-4">
                  {/* Verifier Selector Tabs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {STRUCTURAL_VERIFIER_IDS.map((vid) => {
                      const t = TESTING_LAB_TEST_MAP[vid];
                      if (!t) return null;
                      const selected = t.id === activeTest.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveVerifierId(t.id)}
                          className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                            selected
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                            {t.code}
                          </div>
                          <div className="text-xs font-bold line-clamp-1 mt-0.5">{t.title.en}</div>
                          <div className="text-[11px] font-nikosh text-slate-500 dark:text-slate-400 line-clamp-1" lang="bn">
                            {t.title.bn}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Live Verdict Banner */}
                  <div
                    className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      evaluation.verdict === 'PASS'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                        : evaluation.verdict === 'WARNING'
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                        : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {evaluation.verdict === 'PASS' ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        ) : evaluation.verdict === 'WARNING' ? (
                          <AlertTriangle className="w-6 h-6 text-amber-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-rose-600" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-black uppercase px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/70">
                            {evaluation.verdict}
                          </span>
                          {evaluation.weightedScorePct !== undefined && (
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                              Weighted Score: {evaluation.weightedScorePct.toFixed(0)}%
                            </span>
                          )}
                          <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                            {evaluation.primaryValue} {evaluation.primaryUnit}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {evaluation.verdictHeadline.en}
                        </div>
                        <div className="text-xs font-nikosh text-slate-700 dark:text-slate-300" lang="bn">
                          {evaluation.verdictHeadline.bn}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleSyncToDpr}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Sync Verdict to DPR</span>
                      </button>
                      {onNavigateToLab && (
                        <button
                          type="button"
                          onClick={() => onNavigateToLab(activeTest.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Full Monograph in Testing Lab</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {syncMessage && (
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{syncMessage}</span>
                    </div>
                  )}

                  {/* Quick Grid Input + Verifier Inputs */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono">
                        Quantitative Site Measurements
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Pour / Inspection Zone &amp; Grid Tag
                        </label>
                        <input
                          type="text"
                          value={locationGrid}
                          onChange={(e) => setLocationGrid(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                        {activeTest.calculatorInputs.map((f) => (
                          <div key={f.key}>
                            <label className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-1">
                              <span>{f.label.en}</span>
                              {f.unit && <span className="font-mono text-slate-400">{f.unit}</span>}
                            </label>
                            {f.options ? (
                              <select
                                value={currentInputs[f.key] ?? f.defaultValue}
                                onChange={(e) => updateInput(f.key, Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                              >
                                {f.options.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label.en}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <NumericDraftInput
                                value={currentInputs[f.key] ?? f.defaultValue}
                                min={f.min}
                                max={f.max}
                                onChangeValue={(val) => updateInput(f.key, val)}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weighted Checklist Points */}
                    <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span>Weighted BNBC Inspection Points ({activeTest.checklistItems?.length || 0})</span>
                        <span className="font-mono text-[11px] text-slate-500">Critical * = Auto-Hold</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(activeTest.checklistItems || []).map((it) => {
                          const st = currentChecklists[it.id] || 'PASS';
                          return (
                            <div
                              key={it.id}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                            >
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                                  <span>{it.category.en}</span>
                                  <span>·</span>
                                  <span>{it.codeRef}</span>
                                  <span>· Wt:{it.weight ?? 15}</span>
                                  {it.critical && (
                                    <span className="text-rose-600 font-bold">*CRITICAL</span>
                                  )}
                                </div>
                                <div className="text-xs font-medium text-slate-800 dark:text-slate-100">
                                  {it.item.en}
                                </div>
                                <div className="text-[11px] font-nikosh text-slate-500 dark:text-slate-400" lang="bn">
                                  {it.item.bn}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {(['PASS', 'FAIL', 'NA'] as ChecklistItemStatus[]).map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => updateChecklist(it.id, opt)}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer transition-colors ${
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
                  </div>
                </div>
              ) : (
                <SiteChecklist />
              )}

              <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <AboutThisTool toolId="site-qc-protocols" id="site-qc-doc" defaultExpanded={false} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
