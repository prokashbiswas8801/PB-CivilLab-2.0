import React from 'react';
import { Loader2 } from 'lucide-react';

export const ModuleSuspenseFallback: React.FC<{ title?: string }> = ({
  title = 'Loading Engineering Suite...',
}) => {
  return (
    <div className="w-full min-h-[420px] flex flex-col items-center justify-center p-8 text-center animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center mb-4 text-[var(--md-sys-color-primary)] shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <div className="text-sm font-bold font-mono tracking-wide text-[var(--md-sys-color-on-surface)] mb-1">
        {title}
      </div>
      <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm">
        Initializing computational routines, local CAD tables, and precision equations...
      </div>
    </div>
  );
};

export const ModalSuspenseFallback: React.FC<{ isOpen?: boolean }> = ({ isOpen = true }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md p-6 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-[var(--md-sys-color-primary)] animate-spin mb-3" />
        <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
          Loading Module Dialog...
        </div>
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 font-mono">
          Mounting requested sub-system
        </div>
      </div>
    </div>
  );
};
