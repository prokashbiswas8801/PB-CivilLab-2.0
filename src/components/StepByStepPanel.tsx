import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ChevronDown, BookOpenCheck, ShieldCheck, Info } from 'lucide-react';
import { CalculationStep, ScopeAndLimitsMetadata } from '../utils/calculations';

interface StepByStepPanelProps {
  moduleTitle: string;
  steps?: CalculationStep[];
  scopeAndLimits?: ScopeAndLimitsMetadata;
}

export const StepByStepPanel: React.FC<StepByStepPanelProps> = ({
  moduleTitle,
  steps,
  scopeAndLimits,
}) => {
  const [scopeExpanded, setScopeExpanded] = useState(false);

  const verifiedCount = steps ? steps.filter((s) => s.isVerifiedAgainstEngine).length : 0;
  const totalCount = steps ? steps.length : 0;

  return (
    <div className="space-y-4">
      {/* Scope, Assumptions & Limits Card */}
      {scopeAndLimits && (
        <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] overflow-hidden">
          <button
            type="button"
            onClick={() => setScopeExpanded((prev) => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
            aria-expanded={scopeExpanded}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldCheck className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold font-sans text-[var(--md-sys-color-on-surface)] flex items-center gap-2 flex-wrap">
                  <span>Scope, Assumptions &amp; Code Limits</span>
                  <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    · {scopeAndLimits.status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
                  {scopeAndLimits.codeReference}
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0 transition-transform duration-200 ${
                scopeExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {scopeExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden border-t border-[var(--md-sys-color-outline-variant)]"
              >
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--md-sys-color-surface)] text-xs">
                  <div>
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
                      Covered Capabilities
                    </div>
                    <ul className="space-y-1.5 text-[var(--md-sys-color-on-surface)]">
                      {scopeAndLimits.covered.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
                      Explicit Engineering Exclusions
                    </div>
                    <ul className="space-y-1.5 text-[var(--md-sys-color-on-surface-variant)]">
                      {scopeAndLimits.unsupported.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Header Summary Strip */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <div>
              <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                {moduleTitle} · Hand Calculation &amp; Engine Verification
              </h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Transparent analytical derivation cross-checked numerically against the discrete mesh solver.
              </p>
            </div>
          </div>

          {totalCount > 0 && (
            <div className="text-[11px] font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {verifiedCount}/{totalCount} Steps Verified
              </span>
            </div>
          )}
        </div>

        {/* Empty / Unavailable State */}
        {(!steps || steps.length === 0) ? (
          <div className="rounded-lg border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-6 text-center space-y-1.5">
            <Info className="w-5 h-5 mx-auto text-[var(--md-sys-color-on-surface-variant)]" />
            <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
              Enter valid non-zero structural span and load parameters to generate step-by-step derivations.
            </div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
              Tip: Load a preset from the Worked Examples menu above to inspect a verified derivation immediately.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step) => (
              <motion.div
                key={step.stepNumber}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(0.18, step.stepNumber * 0.025) }}
                className="rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-3.5 space-y-2.5"
              >
                {/* Step Title Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] text-[11px] font-mono font-bold tabular-nums shrink-0">
                      {String(step.stepNumber).padStart(2, '0')}
                    </span>
                    <h4 className="text-xs font-bold font-sans text-[var(--md-sys-color-on-surface)]">
                      {step.title}
                    </h4>
                  </div>

                  <div
                    className={`flex items-center gap-1 text-[11px] font-mono font-semibold ${
                      step.isVerifiedAgainstEngine
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {step.isVerifiedAgainstEngine ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Engine Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Check Discretization</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Formula & Substitution Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-md bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] px-2.5 py-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                      Governing Formula
                    </div>
                    <div className="font-mono text-[var(--md-sys-color-on-surface)] break-words leading-relaxed">
                      {step.formula}
                    </div>
                  </div>

                  <div className="rounded-md bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] px-2.5 py-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                      Numerical Substitution
                    </div>
                    <div className="font-mono tabular-nums text-[var(--md-sys-color-on-surface)] break-words leading-relaxed">
                      {step.substitution}
                    </div>
                  </div>
                </div>

                {/* Final Result & Engineering Reasoning */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 border-t border-[var(--md-sys-color-outline-variant)]">
                  <div className="font-mono tabular-nums text-xs font-bold text-[var(--md-sys-color-primary)]">
                    {step.result}
                  </div>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] sm:text-right max-w-xl leading-snug">
                    {step.reasoning}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
