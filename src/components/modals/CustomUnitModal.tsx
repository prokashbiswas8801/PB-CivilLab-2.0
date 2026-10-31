import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { CustomUnitDefinition, UnitCategoryKey } from '../../types/civil';
import { BASE_UNITS } from '../../utils/unitConverter';

export interface CustomUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  customUnits: CustomUnitDefinition[];
  onCreateUnit: (e: React.FormEvent) => void;
  onDeleteUnit: (id: string) => void;
  unitName: string;
  setUnitName: (v: string) => void;
  unitSymbol: string;
  setUnitSymbol: (v: string) => void;
  unitCategory: UnitCategoryKey;
  setUnitCategory: (v: UnitCategoryKey) => void;
  unitFactor: number;
  setUnitFactor: (v: number) => void;
  unitDesc: string;
  setUnitDesc: (v: string) => void;
}

export const CustomUnitModal: React.FC<CustomUnitModalProps> = ({
  isOpen,
  onClose,
  customUnits,
  onCreateUnit,
  onDeleteUnit,
  unitName,
  setUnitName,
  unitSymbol,
  setUnitSymbol,
  unitCategory,
  setUnitCategory,
  unitFactor,
  setUnitFactor,
  unitDesc,
  setUnitDesc,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl custom-scrollbar"
          >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              Custom Engineering Unit Manager
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Define and persist project-specific or local customary units
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Custom Unit Manager"
            className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to add unit */}
        <form onSubmit={onCreateUnit} className="mt-4 p-4 rounded-lg bg-[var(--md-sys-color-surface-container)] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
            Add New Jobsite Unit
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Unit Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Tipper Truck"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Unit Symbol</label>
              <input
                type="text"
                required
                placeholder="e.g. truck"
                value={unitSymbol}
                onChange={(e) => setUnitSymbol(e.target.value)}
                className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Discipline Category</label>
              <select
                value={unitCategory}
                onChange={(e) => setUnitCategory(e.target.value as UnitCategoryKey)}
                className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
              >
                <option value="length">Length</option>
                <option value="area">Area / Land</option>
                <option value="volume">Volume / CFT</option>
                <option value="mass">Mass / Bags</option>
                <option value="pressure">Pressure / Stress</option>
                <option value="force">Force / Reaction</option>
                <option value="distributed_load">Uniform Load / Line Load</option>
                <option value="density">Unit Weight / Density</option>
                <option value="moment">Moment / Bending</option>
                <option value="slope">Slope / Gradient</option>
                <option value="velocity">Flow Velocity</option>
                <option value="flow_rate">Discharge / Flow Rate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Multiplier to SI Base ({BASE_UNITS[unitCategory]})
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 10.0"
                value={unitFactor}
                onChange={(e) => setUnitFactor(Number(e.target.value))}
                className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Description / Jobsite Note</label>
            <input
              type="text"
              placeholder="e.g. Standard 3-axle 10 m³ hauling dump truck"
              value={unitDesc}
              onChange={(e) => setUnitDesc(e.target.value)}
              className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full touch-target-48 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs cursor-pointer shadow-xs"
          >
            Save Custom Engineering Unit
          </button>
        </form>

        {/* List of custom units */}
        <div className="mt-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
            Active Custom Units ({customUnits.length})
          </div>
          {customUnits.map((u) => (
            <div key={u.id} className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-xs">{u.name} ({u.symbol})</div>
                <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  1 {u.symbol} = {u.toBaseFactor} {BASE_UNITS[u.category]} · {u.description}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteUnit(u.id)}
                className="touch-target-48 px-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] cursor-pointer"
                aria-label={`Delete custom unit ${u.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
