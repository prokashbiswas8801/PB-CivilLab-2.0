import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Check, Sparkles } from 'lucide-react';
import { useCivilLab, SavedHistoryItem } from '../../context/CivilLabContext';

export interface AddToHistoryButtonProps {
  item: Omit<SavedHistoryItem, 'id' | 'timestamp'>;
  label?: string;
  className?: string;
  variant?: 'primary' | 'outline' | 'subtle';
  compact?: boolean;
  onSaved?: (savedItem: SavedHistoryItem) => void;
}

export const AddToHistoryButton: React.FC<AddToHistoryButtonProps> = ({
  item,
  label = 'Add to History',
  className = '',
  variant = 'outline',
  compact = false,
  onSaved,
}) => {
  const { addSavedHistoryItem } = useCivilLab();
  const [justSaved, setJustSaved] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const saved = addSavedHistoryItem(item);
      setJustSaved(true);
      if (onSaved) onSaved(saved);
      setTimeout(() => {
        setJustSaved(false);
      }, 2200);
    } catch (err) {
      console.error('Failed to save to history:', err);
    }
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer active:scale-95 select-none';

  let variantStyles = '';
  if (justSaved) {
    variantStyles =
      'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500 shadow-sm';
  } else if (variant === 'primary') {
    variantStyles =
      'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 border border-transparent shadow-xs';
  } else if (variant === 'subtle') {
    variantStyles =
      'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/60';
  } else {
    // outline (default)
    variantStyles =
      'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] shadow-2xs';
  }

  const sizeStyles = compact
    ? 'px-2 py-1 text-xs gap-1 rounded-md'
    : 'px-3 py-1.5 text-xs font-semibold gap-1.5 rounded-lg';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      title={justSaved ? 'Saved to persistent History!' : 'Save complete state snapshot to persistent History ledger'}
      aria-label={label}
    >
      {justSaved ? (
        <>
          <Check className="w-3.5 h-3.5 stroke-[2.5] animate-scale-in" />
          <span className="font-mono">{compact ? 'Saved' : 'Saved to History!'}</span>
        </>
      ) : (
        <>
          <Bookmark className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
          <span className="font-mono">{label}</span>
        </>
      )}
    </button>
  );
};
