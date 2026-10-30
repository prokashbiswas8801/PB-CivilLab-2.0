import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Laptop } from 'lucide-react';
import { CadExcelHub } from '../calculators/hub/CadExcelHub';

interface CadUtilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'viewport' | 'shortcuts' | 'excel';
}

export const CadUtilitiesModal: React.FC<CadUtilitiesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'viewport',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Interactive AutoCAD &amp; Excel Engineering Hub
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scale &amp; Viewport Zoom Calculator, Shortcuts, AutoLISP Scripts &amp; Engineering Formula Library
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body containing the full CadExcelHub */}
          <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
            <CadExcelHub initialTab={initialTab} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
