import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardCheck } from 'lucide-react';
import { SiteChecklist } from '../calculators/construction/SiteChecklist';

interface SiteQcModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  engineerName?: string;
}

export const SiteQcModal: React.FC<SiteQcModalProps> = ({
  isOpen,
  onClose,
}) => {
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
          <div className="px-6 py-4 border-b border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 flex items-center justify-between bg-[var(--md-sys-color-surface-container-lowest,#fafafa)] dark:bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface,#0f172a)] dark:text-white">
                  Field QA/QC &amp; Pre-Pour Quality Audit Suite
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant,#64748b)] dark:text-slate-400 font-mono">
                  ACI 318 · ACI 347R · BNBC 2020 · Pre-Concreting · Footing &amp; Column Layout · Brickwork &amp; Plastering
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            <SiteChecklist />
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
