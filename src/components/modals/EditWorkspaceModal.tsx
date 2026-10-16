import React from 'react';
import { X } from 'lucide-react';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../../types/civil';

export interface EditWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
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
}

export const EditWorkspaceModal: React.FC<EditWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSave,
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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl p-6 space-y-4">
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

        <form onSubmit={onSave} className="space-y-3">
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
      </div>
    </div>
  );
};
