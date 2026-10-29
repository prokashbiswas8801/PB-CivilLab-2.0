import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SiteQcModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  engineerName?: string;
}

interface ChecklistItem {
  id: string;
  category: 'Concrete Pouring' | 'Rebar & Formwork' | 'Masonry & Plaster' | 'Earthwork & Compaction';
  title: string;
  codeReference: string;
  passed: boolean;
  notes: string;
}

const DEFAULT_QC_ITEMS: ChecklistItem[] = [
  { id: 'qc-1', category: 'Rebar & Formwork', title: 'Clear cover to reinforcement verified with cement/PVC spacer blocks', codeReference: 'ACI 318 / BNBC 8.1.8', passed: true, notes: '50mm for footing, 40mm for beam/column' },
  { id: 'qc-2', category: 'Rebar & Formwork', title: 'Formwork props vertical, braced against lateral kick, with cleanout holes', codeReference: 'ACI 347R', passed: true, notes: 'Tight seams, no slurry leakage' },
  { id: 'qc-3', category: 'Rebar & Formwork', title: 'Lap splices staggered (>1.3× Ld) and tied securely with 18-gauge binding wire', codeReference: 'BNBC 8.2.14', passed: true, notes: 'Staggered at least 600mm' },
  { id: 'qc-4', category: 'Concrete Pouring', title: 'Slump test cone performed at site (tolerance ±25mm of design mix)', codeReference: 'ASTM C143 / BS 1881', passed: true, notes: 'Measured: 100mm (Target: 100mm)' },
  { id: 'qc-5', category: 'Concrete Pouring', title: 'Minimum 6 standard test cylinders (150×300mm) or cubes (150mm) sampled', codeReference: 'ASTM C31', passed: true, notes: '3 for 7-day break, 3 for 28-day break' },
  { id: 'qc-6', category: 'Concrete Pouring', title: 'Concrete drop height restricted (<1.5m) to prevent aggregate segregation', codeReference: 'ACI 304R', passed: true, notes: 'Tremie pipe / chute used for deep lifts' },
  { id: 'qc-7', category: 'Concrete Pouring', title: 'Continuous wet curing plan established for minimum 7 days (14 days for fly ash)', codeReference: 'ACI 308R', passed: false, notes: 'Hessian / jute bags pre-soaked on site' },
  { id: 'qc-8', category: 'Masonry & Plaster', title: 'Bricks pre-soaked in clean water for at least 2 hours before laying', codeReference: 'BNBC 2.1.3', passed: true, notes: 'Prevents water suction from mortar' },
  { id: 'qc-9', category: 'Masonry & Plaster', title: 'Mortar joint thickness maintained within 10mm to 12mm with frog facing UP', codeReference: 'IS 2212 / BNBC', passed: true, notes: 'Frog filled completely with mortar' },
  { id: 'qc-10', category: 'Earthwork & Compaction', title: 'Backfill compacted in loose lifts not exceeding 150mm to 200mm thickness', codeReference: 'ASTM D1557', passed: true, notes: 'Compacted with plate tamper / roller' },
];

export const SiteQcModal: React.FC<SiteQcModalProps> = ({
  isOpen,
  onClose,
  projectName = 'Current Project',
  engineerName = 'Site Quality Engineer',
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_QC_ITEMS);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, passed: !it.passed } : it))
    );
  };

  const updateNotes = (id: string, notes: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, notes } : it))
    );
  };

  const passCount = items.filter((it) => it.passed).length;
  const totalCount = items.length;
  const passPercent = Math.round((passCount / totalCount) * 100);

  const filteredItems = items.filter(
    (it) => activeCategory === 'all' || it.category === activeCategory
  );

  const handleCopyReport = () => {
    const report = `=== SITE QA/QC COMPLIANCE AUDIT CHECKLIST ===
Project: ${projectName}
Auditing Engineer: ${engineerName}
Date: ${new Date().toLocaleDateString()}
Pass Rate: ${passCount} / ${totalCount} (${passPercent}%)
--------------------------------------------------
${items
  .map(
    (it, idx) =>
      `[${it.passed ? 'PASS' : 'FAIL'}] ${idx + 1}. ${it.title}\n    Ref: ${it.codeReference} | Remarks: ${it.notes}`
  )
  .join('\n\n')}
--------------------------------------------------
Audited and approved for structural casting.`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Site QA/QC Engineering Checklists
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-pour, rebar spacing, slump verification, and curing compliance protocols
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Audit'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Strip */}
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                Compliance Status:
              </span>
              <span className={`text-xs font-mono font-bold ${passPercent >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {passCount} / {totalCount} Items Passed ({passPercent}%)
              </span>
            </div>

            <div className="w-40 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${passPercent >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${passPercent}%` }}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar text-xs">
            {['all', 'Concrete Pouring', 'Rebar & Formwork', 'Masonry & Plaster', 'Earthwork & Compaction'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All Checkpoints' : cat}
                </button>
              )
            )}
          </div>

          {/* Items List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.passed
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-rose-500/30 bg-rose-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        item.passed
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {item.passed && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.codeReference}
                        </span>
                        <span>·</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      item.passed
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {item.passed ? 'Verified Pass' : 'Pending Inspection'}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateNotes(item.id, e.target.value)}
                    placeholder="Field inspection observation / inspector notes..."
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
