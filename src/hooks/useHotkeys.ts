import { useEffect, useRef } from 'react';

export interface HotkeyHandlers {
  onToggleCommandPalette: () => void;
  onToggleSidebar?: () => void;
  onToggleHistory?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

/**
 * Consolidated global keyboard shortcut hook.
 * Safely ignores keydown events originating from inputs, textareas, selects, or editable elements.
 */
export function useHotkeys(handlers: HotkeyHandlers) {
  const handlersRef = useRef<HotkeyHandlers>(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        Boolean(target.isContentEditable);

      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl/Cmd + K: Command Palette & Global Search
      if (isCmdOrCtrl && key === 'k') {
        e.preventDefault();
        handlersRef.current.onToggleCommandPalette();
        return;
      }

      // Quick slash "/" search when not actively focused in an input field
      if (e.key === '/' && !isInput && !isCmdOrCtrl) {
        e.preventDefault();
        handlersRef.current.onToggleCommandPalette();
        return;
      }

      // Ctrl/Cmd + B: Toggle Sidebar Collapse
      if (isCmdOrCtrl && key === 'b') {
        e.preventDefault();
        handlersRef.current.onToggleSidebar?.();
        return;
      }

      // Ctrl/Cmd + H: Global History Ledger
      if (isCmdOrCtrl && key === 'h') {
        e.preventDefault();
        handlersRef.current.onToggleHistory?.();
        return;
      }

      // Global Undo: Ctrl/Cmd + Z (without Shift)
      if (isCmdOrCtrl && key === 'z' && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handlersRef.current.onUndo?.();
        }
        return;
      }

      // Global Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if ((isCmdOrCtrl && key === 'y') || (isCmdOrCtrl && e.shiftKey && key === 'z')) {
        if (!isInput) {
          e.preventDefault();
          handlersRef.current.onRedo?.();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
