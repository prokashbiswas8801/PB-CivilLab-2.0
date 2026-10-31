import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../../types/civil';

export interface NewWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (e: React.FormEvent) => void;
  name: string;
  setName: (val: string) => void;
  code: string;
  setCode: (val: string) => void;
  site: string;
  setSite: (val: string) => void;
  engineer: string;
  setEngineer: (val: string) => void;
  currency: CurrencyCode;
  setCurrency: (val: CurrencyCode) => void;
  template: 'clean' | 'clone' | 'demo';
  setTemplate: (val: 'clean' | 'clone' | 'demo') => void;
  activeWorkspaceItemCount: number;
}

export const NewWorkspaceModal: React.FC<NewWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  name,
  setName,
  code,
  setCode,
  site,
  setSite,
  engineer,
  setEngineer,
  currency,
  setCurrency,
  template,
  setTemplate,
  activeWorkspaceItemCount,
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
            className="w-full max-w-md bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl"
          >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
            Create New Project Workspace
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close create project modal"
            className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Project Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Highway Flyover — Sector 4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Project Code</label>
            <input
              type="text"
              placeholder="e.g. CIV-2026-HW04"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Jobsite Location</label>
            <input
              type="text"
              placeholder="e.g. North Abutment Sector"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Engineer of Record (EOR)</label>
            <input
              type="text"
              placeholder="e.g. Project Engineer, PE"
              value={engineer}
              onChange={(e) => setEngineer(e.target.value)}
              className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Default Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Takeoff Spreadsheet Initial State</label>
            <div className="space-y-1.5 text-xs font-mono">
              <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${template === 'clean' ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/10 font-bold' : 'border-[var(--md-sys-color-outline-variant)]'}`}>
                <input
                  type="radio"
                  name="newWsTemplate"
                  value="clean"
                  checked={template === 'clean'}
                  onChange={() => setTemplate('clean')}
                />
                <span>Clean Blank Slate (0 Takeoff Items)</span>
              </label>
              <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${template === 'clone' ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/10 font-bold' : 'border-[var(--md-sys-color-outline-variant)]'}`}>
                <input
                  type="radio"
                  name="newWsTemplate"
                  value="clone"
                  checked={template === 'clone'}
                  onChange={() => setTemplate('clone')}
                />
                <span>Copy Items from Active Project ({activeWorkspaceItemCount} Items)</span>
              </label>
              <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${template === 'demo' ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/10 font-bold' : 'border-[var(--md-sys-color-outline-variant)]'}`}>
                <input
                  type="radio"
                  name="newWsTemplate"
                  value="demo"
                  checked={template === 'demo'}
                  onChange={() => setTemplate('demo')}
                />
                <span>Pre-load Padma Viaduct Demo Items (7 Items)</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="touch-target-48 px-4 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold cursor-pointer"
            >
              Create Project
            </button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
