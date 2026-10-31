import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  Layers,
  Droplets,
  Building,
  TrendingUp,
} from 'lucide-react';
import { FarMgcCalculator } from '../calculators/architecture/FarMgcCalculator';
import { StaircaseDesigner } from '../calculators/architecture/StaircaseDesigner';
import { BuildingServicesSizer } from '../calculators/architecture/BuildingServicesSizer';

export type ArchitectureTab = 'far' | 'staircase' | 'watertank' | 'septictank';

interface ArchitectureByLawsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ArchitectureTab;
}

export const ArchitectureByLawsModal: React.FC<ArchitectureByLawsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'far',
}) => {
  const [activeTab, setActiveTab] = useState<ArchitectureTab>(initialTab);

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
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface,#0f172a)] dark:text-white">
                  Architecture, Space Planning &amp; Building Services Suite
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant,#64748b)] dark:text-slate-400 font-mono">
                  BNBC 2020 · FAR &amp; MGC Setbacks · Staircase Ergonomics · UGWR &amp; OHT · Septic Tank &amp; Soak Well
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

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-2 border-b border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 bg-[var(--md-sys-color-surface-container-low,#f8fafc)] dark:bg-slate-900/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('far')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'far'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>FAR, MGC &amp; Setbacks</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staircase')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'staircase'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Staircase Geometry &amp; Ergonomics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('watertank')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'watertank'
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>Water Reservoirs (UGWR &amp; OHT)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('septictank')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'septictank'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Septic Tank &amp; Soak Well</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'far' && <FarMgcCalculator />}
            {activeTab === 'staircase' && <StaircaseDesigner />}
            {activeTab === 'watertank' && <BuildingServicesSizer />}
            {activeTab === 'septictank' && <BuildingServicesSizer />}
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
