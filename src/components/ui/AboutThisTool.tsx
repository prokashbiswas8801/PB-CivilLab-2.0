import React, { useState, useMemo, useEffect } from 'react';
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
  ShieldCheck,
  FileCode,
  Sparkles,
  Copy,
  Check,
  Languages,
} from 'lucide-react';
import {
  getToolDocumentation,
  ToolDocumentation,
} from '../../data/toolDocumentation';
import { getToolDocumentationBn } from '../../data/toolDocumentationBn';

export type AboutToolTab = 'capabilities' | 'methodology' | 'usage' | 'protips';
export type DocumentationLanguage = 'en' | 'bn' | 'both';

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
  initialLanguage?: DocumentationLanguage;
}

const STORAGE_LANG_KEY = 'civil_lab_about_tool_lang';
const LANG_CHANGE_EVENT = 'civil_lab_about_tool_lang_change';
const BENGALI_FONT_STACK = "'Nikosh', 'SolaimanLipi', system-ui, -apple-system, sans-serif";

/**
 * Authoritative "About This Tool" Bilingual Component
 * Supports English and Bengali (বাংলা) toggling with user preference persistence.
 * Features 'Georgia'/'Times New Roman' typographic hierarchy for English and
 * clean, readable typography for Bengali civil engineering technical monographs.
 */
export const AboutThisTool: React.FC<AboutThisToolProps> = ({
  toolId,
  fallbackMeta,
  defaultExpanded = true,
  className = '',
  id = 'about-this-tool-section',
  initialLanguage,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [activeTab, setActiveTab] = useState<AboutToolTab>('capabilities');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  // Initialize language from localStorage or prop (defaults to 'en')
  const [language, setLanguage] = useState<DocumentationLanguage>(() => {
    if (initialLanguage) return initialLanguage;
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'bn' || saved === 'en' || saved === 'both') {
      return saved as DocumentationLanguage;
    }
    return 'en';
  });

  // Sync across multiple instances on the page when language changes
  useEffect(() => {
    const handleGlobalLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<DocumentationLanguage>;
      if (customEvent.detail && customEvent.detail !== language) {
        setLanguage(customEvent.detail);
      }
    };
    window.addEventListener(LANG_CHANGE_EVENT, handleGlobalLangChange);
    return () => {
      window.removeEventListener(LANG_CHANGE_EVENT, handleGlobalLangChange);
    };
  }, [language]);

  const setLanguageAndBroadcast = (newLang: DocumentationLanguage) => {
    setLanguage(newLang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, newLang);
      window.dispatchEvent(
        new CustomEvent(LANG_CHANGE_EVENT, { detail: newLang })
      );
    } catch {
      // Ignore localStorage failure in restricted contexts
    }
  };

  const docEn = useMemo(() => {
    return getToolDocumentation(toolId, fallbackMeta);
  }, [toolId, fallbackMeta]);

  const docBn = useMemo(() => {
    return getToolDocumentationBn(toolId, fallbackMeta);
  }, [toolId, fallbackMeta]);

  // Primary active doc based on chosen language
  const primaryDoc = language === 'bn' ? docBn : docEn;

  const handleCopyFormula = (formula: string, name: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(name);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const isBn = language === 'bn';
  const isBoth = language === 'both';

  return (
    <section
      id={id}
      aria-label={`About ${primaryDoc.title} Documentation & Engineering Guide`}
      className={`rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] overflow-hidden transition-all shadow-xs ${className}`}
    >
      {/* Header Banner & Language Switcher Bar */}
      <div className="p-4 sm:p-5 bg-[var(--md-sys-color-surface-container)] flex flex-wrap items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3.5 cursor-pointer select-none flex-1 min-w-[240px]"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline)]">
                {isBn ? docBn.discipline : docEn.discipline}
              </span>
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{isBn ? docBn.standardUsed : docEn.standardUsed}</span>
              </span>
            </div>

            <h3
              className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)] mt-0.5 tracking-tight flex items-baseline gap-2 flex-wrap"
              style={{
                fontFamily: isBn
                  ? BENGALI_FONT_STACK
                  : "'Georgia', 'Times New Roman', serif",
              }}
            >
              <span>
                {isBn
                  ? `এই টুল সম্পর্কে · ${docBn.title}`
                  : `About This Tool · ${docEn.title}`}
              </span>
              {isBoth && (
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-normal">
                  ({docBn.title})
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Right Controls: Language Selector Pill & Collapse Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Interactive Language Selector Pill */}
          <div
            className="flex items-center p-0.5 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xs text-xs font-semibold"
            role="group"
            aria-label="Language selection for documentation"
          >
            <div className="pl-2 pr-1 text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span className="text-[10px] uppercase tracking-wider font-mono hidden md:inline">
                Lang:
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLanguageAndBroadcast('en')}
              className={`px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer font-medium ${
                language === 'en'
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
              title="Read guide in English"
            >
              English
            </button>

            <button
              type="button"
              onClick={() => setLanguageAndBroadcast('bn')}
              className={`px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer font-medium ${
                language === 'bn'
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
              title="বাংলায় পূর্ণাঙ্গ গাইড পড়ুন"
            >
              বাংলা
            </button>

            <button
              type="button"
              onClick={() => setLanguageAndBroadcast('both')}
              className={`px-2 py-1 rounded-full text-[11px] transition-all cursor-pointer font-medium hidden sm:inline-block ${
                language === 'both'
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
              title="উভয় ভাষা একসাথে দেখুন (Bilingual view)"
            >
              Both / উভয়
            </button>
          </div>

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] transition-colors cursor-pointer flex items-center gap-1"
            aria-label={isExpanded ? 'Collapse documentation' : 'Expand documentation'}
            title={
              isExpanded
                ? isBn
                  ? 'গাইড সংক্ষেপ করুন'
                  : 'Collapse Guide'
                : isBn
                ? 'গাইড বিস্তারিত দেখুন'
                : 'Expand Guide'
            }
          >
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] hidden lg:inline px-1">
              {isExpanded
                ? isBn
                  ? 'সংক্ষেপ'
                  : 'Collapse'
                : isBn
                ? 'বিস্তারিত'
                : 'Expand'}
            </span>
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
            {/* Overview Monograph Section */}
            <div className="p-5 sm:p-6 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="max-w-4xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                    {isBn
                      ? 'প্রকৌশল পরিচিতি ও মূল উদ্দেশ্য'
                      : 'Technical Overview & Engineering Purpose'}
                  </span>
                  <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                    {isBn ? 'বাংলা সংস্করণ' : 'English Edition'}
                  </div>
                </div>

                {/* Primary Overview Text */}
                <p
                  className="text-sm sm:text-base leading-relaxed text-[var(--md-sys-color-on-surface)] text-justify"
                  style={{
                    fontFamily: isBn
                      ? BENGALI_FONT_STACK
                      : "'Georgia', 'Times New Roman', serif",
                  }}
                >
                  {isBn ? docBn.overview : docEn.overview}
                </p>

                {/* Optional Both Mode Secondary Overview */}
                {isBoth && (
                  <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/60 text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed italic">
                    <span className="font-bold text-[var(--md-sys-color-primary)] font-mono not-italic mr-1.5">
                      [বাংলা অনুবাদ]:
                    </span>
                    {docBn.overview}
                  </div>
                )}
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
                <span>
                  {isBn
                    ? 'টুলের কার্যক্ষমতা ও সুবিধাসমূহ'
                    : 'What It Does & Capabilities'}
                </span>
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
                <span>
                  {isBn
                    ? 'কার্যপদ্ধতি ও মূল সূত্রাবলী'
                    : 'How It Works & Governing Formulas'}
                </span>
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
                <span>
                  {isBn
                    ? 'সঠিক ব্যবহারের নিয়মাবলী'
                    : 'How to Use for Accurate Results'}
                </span>
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
                <span>
                  {isBn
                    ? 'সাইট ইঞ্জিনিয়ারিং টিপস ও সতর্কতা'
                    : 'Engineering Pro-Tips & Field Advice'}
                </span>
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
                      style={{
                        fontFamily: isBn
                          ? BENGALI_FONT_STACK
                          : "'Georgia', 'Times New Roman', serif",
                      }}
                    >
                      {isBn
                        ? 'মূল কার্যক্ষমতা ও প্রকৌশল সুবিধাসমূহ'
                        : 'Core Analytical Capabilities & System Deliverables'}
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                      {primaryDoc.capabilities.length}{' '}
                      {isBn ? 'টি যাচাইকৃত অপারেশন' : 'verified operations'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {primaryDoc.capabilities.map((cap, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex items-start gap-3"
                      >
                        <div className="p-1 rounded-md bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] mt-0.5 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-1">
                          <span
                            className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed block"
                            style={{
                              fontFamily: isBn
                                ? BENGALI_FONT_STACK
                                : "'Georgia', 'Times New Roman', serif",
                            }}
                          >
                            {cap}
                          </span>
                          {isBoth && docBn.capabilities[i] && (
                            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-normal block italic">
                              {docBn.capabilities[i]}
                            </span>
                          )}
                        </div>
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
                      {isBn
                        ? 'বিশ্লেষণ পদ্ধতি ও গাণিতিক ভিত্তি'
                        : 'Analytical Method & Mathematical Formulation'}
                    </div>
                    <p
                      className="text-xs sm:text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]"
                      style={{
                        fontFamily: isBn
                          ? BENGALI_FONT_STACK
                          : "'Georgia', 'Times New Roman', serif",
                      }}
                    >
                      {primaryDoc.howItWorks.methodology}
                    </p>
                    {isBoth && (
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed italic pt-1 border-t border-[var(--md-sys-color-outline-variant)]/60">
                        {docBn.howItWorks.methodology}
                      </p>
                    )}
                  </div>

                  {/* Governing Equations Cards */}
                  {primaryDoc.howItWorks.governingEquations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                          {isBn
                            ? 'মূল প্রকৌশল সূত্রাবলী ও কোড সমীকরণ'
                            : 'Governing Engineering Equations & Code Formulations'}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          {isBn ? 'স্ট্যান্ডার্ড সমীকরণ নোটেশন' : 'Standard LaTeX notation'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {primaryDoc.howItWorks.governingEquations.map((eq, idx) => {
                          const bnEq = docBn.howItWorks.governingEquations[idx];
                          return (
                            <div
                              key={idx}
                              className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-2 flex flex-col justify-between"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <h5
                                    className="text-xs font-bold text-[var(--md-sys-color-on-surface)]"
                                    style={{
                                      fontFamily: isBn
                                        ? BENGALI_FONT_STACK
                                        : "'Georgia', 'Times New Roman', serif",
                                    }}
                                  >
                                    {eq.name}
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyFormula(eq.formula, eq.name)}
                                    className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
                                    title={isBn ? 'সূত্র কপি করুন' : 'Copy formula'}
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
                                  style={{
                                    fontFamily: isBn
                                      ? BENGALI_FONT_STACK
                                      : "'Georgia', 'Times New Roman', serif",
                                  }}
                                >
                                  {eq.description}
                                </p>

                                {isBoth && bnEq && (
                                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] italic">
                                    {bnEq.description}
                                  </p>
                                )}
                              </div>

                              {eq.variables && eq.variables.length > 0 && (
                                <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] space-y-0.5">
                                  {eq.variables.map((v, vi) => (
                                    <div key={vi}>&bull; {v}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Code Standards & Design Assumptions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                        {isBn
                          ? 'রেফারেন্স ডিজাইন কোড ও স্ট্যান্ডার্ড'
                          : 'Referenced Design Codes & Standards'}
                      </span>
                      <ul className="text-xs font-mono space-y-1 text-[var(--md-sys-color-on-surface)]">
                        {primaryDoc.howItWorks.codeStandards.map((std, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)]" />
                            <span>{std}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                        {isBn
                          ? 'মৌলিক প্রকৌশল অনুমানসমূহ'
                          : 'Underlying Engineering Assumptions'}
                      </span>
                      {primaryDoc.howItWorks.assumptions && primaryDoc.howItWorks.assumptions.length > 0 ? (
                        <ul
                          className="text-xs space-y-1 text-[var(--md-sys-color-on-surface)]"
                          style={{
                            fontFamily: isBn
                              ? BENGALI_FONT_STACK
                              : "'Georgia', 'Times New Roman', serif",
                          }}
                        >
                          {primaryDoc.howItWorks.assumptions.map((asm, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[var(--md-sys-color-primary)] font-bold">&ndash;</span>
                              <span>{asm}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                          {isBn
                            ? 'স্ট্যান্ডার্ড ইঞ্জিনিয়ারিং অনুমান ও রেফারেন্স প্রযোজ্য।'
                            : 'Standard engineering assumptions and tolerances apply.'}
                        </p>
                      )}
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
                      style={{
                        fontFamily: isBn
                          ? BENGALI_FONT_STACK
                          : "'Georgia', 'Times New Roman', serif",
                      }}
                    >
                      {isBn
                        ? 'ধাপে ধাপে ব্যবহার নির্দেশিকা'
                        : 'Step-by-Step Practical Calculation Guide'}
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                      {isBn ? 'স্ট্যান্ডার্ড ওয়ার্কফ্লো' : 'Standard workflow'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {primaryDoc.stepByStepUsage.map((item, idx) => {
                      const bnItem = docBn.stepByStepUsage[idx];
                      return (
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
                              style={{
                                fontFamily: isBn
                                  ? BENGALI_FONT_STACK
                                  : "'Georgia', 'Times New Roman', serif",
                              }}
                            >
                              {item.title}
                            </h5>
                            <p
                              className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed"
                              style={{
                                fontFamily: isBn
                                  ? BENGALI_FONT_STACK
                                  : "'Georgia', 'Times New Roman', serif",
                              }}
                            >
                              {item.instruction}
                            </p>

                            {isBoth && bnItem && (
                              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic pt-0.5">
                                {bnItem.instruction}
                              </p>
                            )}

                            {item.tip && (
                              <div className="mt-1.5 p-2 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[11px] font-mono text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                                <span>{item.tip}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                      <span>
                        {isBn
                          ? 'স্মার্ট ফিল্ড পরামর্শ ও সাধারণ ভুলসমূহ'
                          : 'Smart Field Advice & Common Jobsite Mistakes to Avoid'}
                      </span>
                    </span>

                    <div className="space-y-2.5">
                      {primaryDoc.proTipsAndBestPractices.map((tip, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-[var(--md-sys-color-on-surface)] flex items-start gap-3"
                        >
                          <div className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-1">
                            <p
                              className="text-xs sm:text-sm leading-relaxed"
                              style={{
                                fontFamily: isBn
                                  ? BENGALI_FONT_STACK
                                  : "'Georgia', 'Times New Roman', serif",
                              }}
                            >
                              {tip}
                            </p>
                            {isBoth && docBn.proTipsAndBestPractices[i] && (
                              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                                {docBn.proTipsAndBestPractices[i]}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Code Boundaries & Limitations */}
                  {primaryDoc.limitationsAndNotes.length > 0 && (
                    <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--md-sys-color-error)] uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>
                          {isBn
                            ? 'কোড সীমাবদ্ধতা ও ফিল্ড সতর্কতা'
                            : 'Code Boundaries & Engineering Limitations'}
                        </span>
                      </div>
                      <ul
                        className="text-xs space-y-1 text-[var(--md-sys-color-on-surface-variant)]"
                        style={{
                          fontFamily: isBn
                            ? BENGALI_FONT_STACK
                            : "'Georgia', 'Times New Roman', serif",
                        }}
                      >
                        {primaryDoc.limitationsAndNotes.map((note, i) => (
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
 * Top Action Header Pill Button: [ ⓘ About This Tool / এই টুল সম্পর্কে ]
 * Smooth-scrolls to the documentation accordion or invokes the quick drawer
 */
export const AboutThisToolButton: React.FC<AboutThisToolButtonProps> = ({
  toolId,
  onClick,
  targetId = 'about-this-tool-section',
  className = '',
  label,
  title,
}) => {
  const [currentLang, setCurrentLang] = useState<DocumentationLanguage>(() => {
    return (localStorage.getItem(STORAGE_LANG_KEY) as DocumentationLanguage) || 'en';
  });

  useEffect(() => {
    const handleGlobalLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<DocumentationLanguage>;
      if (customEvent.detail) {
        setCurrentLang(customEvent.detail);
      }
    };
    window.addEventListener(LANG_CHANGE_EVENT, handleGlobalLangChange);
    return () => {
      window.removeEventListener(LANG_CHANGE_EVENT, handleGlobalLangChange);
    };
  }, []);

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

  const defaultLabel =
    currentLang === 'bn' ? 'এই টুল সম্পর্কে' : 'About This Tool';
  const displayLabel = label || defaultLabel;
  const defaultTitle =
    currentLang === 'bn'
      ? 'প্রকৌশল গাইড, মূল সমীকরণ ও ফিল্ড টিপস খুলুন'
      : 'Open comprehensive engineering documentation, governing equations, and pro-tips for this tool';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs hover:border-[var(--md-sys-color-primary)] ${className}`}
      title={title || defaultTitle}
      aria-label={`About ${toolId} engineering guide`}
    >
      <HelpCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
      <span className="font-mono">{displayLabel}</span>
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
 * Allows engineers to read governing formulas in Bengali or English without losing their spot.
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
            className="w-full max-w-3xl h-full bg-[var(--md-sys-color-surface)] border-l border-[var(--md-sys-color-outline-variant)] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                <h3
                  className="text-base font-bold text-[var(--md-sys-color-on-surface)]"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  Engineering Monograph &amp; Guide (প্রকৌশল গাইড)
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
