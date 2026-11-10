import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CivilWorkspace, CurrencyCode, SUPPORTED_CURRENCIES } from '../../types/civil';

export interface EditWorkspaceData {
  id?: string;
  name: string;
  code: string;
  site: string;
  engineer: string;
  currency: CurrencyCode;
}

export interface EditWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace?: CivilWorkspace | null;
  onSaveWorkspace?: (data: EditWorkspaceData) => void;

  // Optional legacy props
  onSave?: (e: React.FormEvent) => void;
  name?: string;
  setName?: (val: string) => void;
  code?: string;
  setCode?: (val: string) => void;
  site?: string;
  setSite?: (val: string) => void;
  engineer?: string;
  setEngineer?: (val: string) => void;
  currency?: CurrencyCode;
  setCurrency?: (val: CurrencyCode) => void;
}

export const EditWorkspaceModal: React.FC<EditWorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onSaveWorkspace,
  onSave,
  name: propName,
  setName: propSetName,
  code: propCode,
  setCode: propSetCode,
  site: propSite,
  setSite: propSetSite,
  engineer: propEngineer,
  setEngineer: propSetEngineer,
  currency: propCurrency,
  setCurrency: propSetCurrency,
}) => {
  const [internalName, setInternalName] = useState('');
  const [internalCode, setInternalCode] = useState('');
  const [internalSite, setInternalSite] = useState('');
  const [internalEngineer, setInternalEngineer] = useState('');
  const [internalCurrency, setInternalCurrency] = useState<CurrencyCode>('BDT');

  useEffect(() => {
    if (workspace && isOpen) {
      setInternalName(workspace.name || '');
      setInternalCode(workspace.projectCode || '');
      setInternalSite(workspace.siteLocation || '');
      setInternalEngineer(workspace.engineerOfRecord || '');
      setInternalCurrency(workspace.currency || 'BDT');
    }
  }, [workspace, isOpen]);

  const name = propName !== undefined ? propName : internalName;
  const setName = propSetName || setInternalName;
  const code = propCode !== undefined ? propCode : internalCode;
  const setCode = propSetCode || setInternalCode;
  const site = propSite !== undefined ? propSite : internalSite;
  const setSite = propSetSite || setInternalSite;
  const engineer = propEngineer !== undefined ? propEngineer : internalEngineer;
  const setEngineer = propSetEngineer || setInternalEngineer;
  const currency = propCurrency !== undefined ? propCurrency : internalCurrency;
  const setCurrency = propSetCurrency || setInternalCurrency;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveWorkspace) {
      onSaveWorkspace({
        id: workspace?.id,
        name: name.trim() || 'Untitled Civil Project',
        code: code.trim() || 'CIV-PROJ',
        site: site.trim() || 'General Jobsite',
        engineer: engineer.trim() || 'Project Engineer, PE',
        currency,
      });
      onClose();
    } else if (onSave) {
      onSave(e);
    }
  };

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
                Edit Project Metadata
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close edit project modal"
                className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Project Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Jobsite Location</label>
                <input
                  type="text"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Engineer of Record (EOR)</label>
                <input
                  type="text"
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
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
