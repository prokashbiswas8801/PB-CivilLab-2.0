import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  BookOpen,
  CheckCircle2,
  Cpu,
  Compass,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  Maximize2,
  Copy,
  Check,
} from 'lucide-react';
import {
  getToolDocumentation,
  ToolDocumentation,
  GoverningEquation,
  StepByStepUsage,
} from '../../data/toolDocumentation';

export type AboutToolTab = 'capabilities' | 'methodology' | 'usage' | 'protips';

export interface AboutThisToolProps {
  toolId: string;
  fallbackMeta?: Partial<ToolDocumentation> & {
    title?: string;
    category?: string;
    standardUsed?: string;
    description?: string;
  };
  defaultExpanded?: boolean;
  className?: string;
  id?: string;
}

/**
 * Authoritative "About This Tool" Expandable Section
 * Features 'Georgia'/'Times New Roman' typographic hierarchy,
 * theme-adaptive styling, governing equations, step-by-step guidance, and field pro-tips.
 */
export const AboutThisTool: React.FC<AboutThisToolProps> = ({
  toolId,
  fallbackMeta,
  defaultExpanded = true,
  className = '',
  id = 'about-this-tool-section',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [activeTab, setActiveTab] = useState<AboutToolTab>('capabilities');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  const doc = useMemo(() => {
    return getToolDocumentation(toolId, fallbackMeta);
  }, [toolId, fallbackMeta]);

  const handleCopyFormula = (formula: string, name: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(name);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  return (
    <section
      id={id}
      aria-label={`About ${doc.title} Documentation & Engineering Guide`}
      className={`rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] overflow-hidden transition-all shadow-xs ${className}`}
    >
      {/* Header Banner & Collapse Toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-between gap-3 cursor-pointer select-none transition-colors border-b border-[var(--md-sys-color-outline-variant)]"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline)]">
                {doc.discipline}
              </span>
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{doc.standardUsed}</span>
              </span>
            </div>

            <h3
              className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)] mt-0.5 tracking-tight"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              About This Tool &middot; {doc.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline">
            {isExpanded ? 'Collapse Guide' : 'Expand Guide'}
          </span>
          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] transition-transform"
            aria-label={isExpanded ? 'Collapse documentation' : 'Expand documentation'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {/* Overview Monograph Section with Georgia / Times New Roman Typography */}
            <div className="p-5 sm:p-6 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="max-w-4xl space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                  Technical Overview &amp; Engineering Purpose
                </span>
                <p
                  className="text-sm sm:text-base leading-relaxed text-[var(--md-sys-color-on-surface)] text-justify"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  {doc.overview}
                </p>
              </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="px-5 pt-3 bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] flex items-center gap-2 overflow-x-auto text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('capabilities')}
                className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === 'capabilities'
                    ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] font-extrabold'
                    : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>What It Does &amp; Capabilities</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('methodology')}
                className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === 'methodology'
                    ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] font-extrabold'
                    : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>How It Works &amp; Governing Formulas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('usage')}
                className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === 'usage'
                    ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] font-extrabold'
                    : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>How to Use for Accurate Results</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('protips')}
                className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === 'protips'
                    ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] font-extrabold'
                    : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Engineering Pro-Tips &amp; Field Advice</span>
              </button>
            </div>

            {/* Sub-Tab Content Cards */}
            <div className="p-5 sm:p-6 space-y-6">
              {/* TAB 1: CAPABILITIES */}
              {activeTab === 'capabilities' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4
                      className="text-sm font-bold text-[var(--md-sys-color-on-surface)]"
                      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                    >
                      Core Analytical Capabilities &amp; System Deliverables
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                      {doc.capabilities.length} verified operations
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {doc.capabilities.map((cap, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex items-start gap-3"
                      >
                        <div className="p-1 rounded-md bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] mt-0.5 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed"
                          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                        >
                          {cap}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: METHODOLOGY & GOVERNING FORMULAS */}
              {activeTab === 'methodology' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Methodology Description */}
                  <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                      Analytical Method &amp; Mathematical Formulation
                    </div>
                    <p
                      className="text-xs sm:text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]"
                      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                    >
                      {doc.howItWorks.methodology}
                    </p>
                  </div>

                  {/* Governing Equations Cards */}
                  {doc.howItWorks.governingEquations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                          Governing Engineering Equations &amp; Code Formulations
                        </span>
                        <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          Standard LaTeX notation
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {doc.howItWorks.governingEquations.map((eq, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-2 flex flex-col justify-between"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <h5
                                  className="text-xs font-bold text-[var(--md-sys-color-on-surface)]"
                                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                                >
                                  {eq.name}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => handleCopyFormula(eq.formula, eq.name)}
                                  className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
                                  title="Copy formula"
                                >
                                  {copiedFormula === eq.name ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs font-mono font-bold text-[var(--md-sys-color-primary)] select-all overflow-x-auto">
                                {eq.formula}
                              </div>

                              <p
                                className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed"
                                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                              >
                                {eq.description}
                              </p>
                            </div>

                            {eq.variables && eq.variables.length > 0 && (
                              <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] space-y-0.5">
                                {eq.variables.map((v, vi) => (
                                  <div key={vi}>&bull; {v}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Code Standards & Design Assumptions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                        Referenced Design Codes &amp; Standards
                      </span>
                      <ul className="text-xs font-mono space-y-1 text-[var(--md-sys-color-on-surface)]">
                        {doc.howItWorks.codeStandards.map((std, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)]" />
                            <span>{std}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                        Underlying Engineering Assumptions
                      </span>
                      <ul
                        className="text-xs space-y-1 text-[var(--md-sys-color-on-surface)]"
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                      >
                        {doc.howItWorks.assumptions.map((asm, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[var(--md-sys-color-primary)] font-bold">&ndash;</span>
                            <span>{asm}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STEP-BY-STEP USAGE */}
              {activeTab === 'usage' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4
                      className="text-sm font-bold text-[var(--md-sys-color-on-surface)]"
                      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                    >
                      Step-by-Step Practical Calculation Guide
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                      Standard workflow
                    </span>
                  </div>

                  <div className="space-y-3">
                    {doc.stepByStepUsage.map((item) => (
                      <div
                        key={item.step}
                        className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex items-start gap-3.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {item.step}
                        </div>

                        <div className="space-y-1 flex-1">
                          <h5
                            className="text-xs sm:text-sm font-bold text-[var(--md-sys-color-on-surface)]"
                            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                          >
                            {item.title}
                          </h5>
                          <p
                            className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed"
                            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                          >
                            {item.instruction}
                          </p>
                          {item.tip && (
                            <div className="mt-1.5 p-2 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[11px] font-mono text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.tip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PRO-TIPS & FIELD ADVICE */}
              {activeTab === 'protips' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Field Best Practices */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" />
                      <span>Smart Field Advice &amp; Common Jobsite Mistakes to Avoid</span>
                    </span>

                    <div className="space-y-2.5">
                      {doc.proTipsAndBestPractices.map((tip, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-[var(--md-sys-color-on-surface)] flex items-start gap-3"
                        >
                          <div className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <p
                            className="text-xs sm:text-sm leading-relaxed"
                            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                          >
                            {tip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Code Boundaries & Limitations */}
                  {doc.limitationsAndNotes.length > 0 && (
                    <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--md-sys-color-error)] uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Code Boundaries &amp; Engineering Limitations</span>
                      </div>
                      <ul
                        className="text-xs space-y-1 text-[var(--md-sys-color-on-surface-variant)]"
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                      >
                        {doc.limitationsAndNotes.map((note, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="font-bold">&bull;</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export interface AboutThisToolButtonProps {
  toolId: string;
  onClick?: () => void;
  targetId?: string;
  className?: string;
  label?: string;
  title?: string;
}

/**
 * Top Action Header Pill Button: [ ⓘ About This Tool ]
 * Click smooth-scrolls to the bottom documentation accordion or invokes the quick drawer
 */
export const AboutThisToolButton: React.FC<AboutThisToolButtonProps> = ({
  toolId,
  onClick,
  targetId = 'about-this-tool-section',
  className = '',
  label = 'About This Tool',
  title = 'Open comprehensive engineering documentation, governing equations, and pro-tips for this tool',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }

    // Smooth-scroll to target section
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs hover:border-[var(--md-sys-color-primary)] ${className}`}
      title={title}
      aria-label={`About ${toolId} engineering guide`}
    >
      <HelpCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
      <span className="font-mono">{label}</span>
    </button>
  );
};

export interface AboutThisToolDrawerProps {
  toolId: string;
  isOpen: boolean;
  onClose: () => void;
  fallbackMeta?: Partial<ToolDocumentation>;
}

/**
 * Quick Slide-Over Drawer for Instant On-Screen Reference
 * Allows engineers to read governing formulas without scrolling away from input fields
 */
export const AboutThisToolDrawer: React.FC<AboutThisToolDrawerProps> = ({
  toolId,
  isOpen,
  onClose,
  fallbackMeta,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl h-full bg-[var(--md-sys-color-surface)] border-l border-[var(--md-sys-color-outline-variant)] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                <h3
                  className="text-base font-bold text-[var(--md-sys-color-on-surface)]"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  Quick Engineering Monograph &amp; Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <AboutThisTool
                toolId={toolId}
                fallbackMeta={fallbackMeta}
                defaultExpanded={true}
                id="drawer-about-this-tool"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
