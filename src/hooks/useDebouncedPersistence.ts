import { useEffect, useRef, useCallback } from 'react';
import { CivilLabSchemaV2 } from '../types/civil';
import { STORAGE_KEY } from '../utils/storage';
import { persistToIndexedDB } from '../utils/indexedStorage';

export interface UseDebouncedPersistenceReturn {
  flush: () => void;
}

/**
 * Debounced persistence pipeline for local-first storage:
 * - 300ms debounced write for localStorage
 * - 1000ms idle callback write for IndexedDB
 * - Guaranteed synchronous flush on beforeunload and component unmount
 */
export function useDebouncedPersistence(appState: CivilLabSchemaV2): UseDebouncedPersistenceReturn {
  const latestStateRef = useRef<CivilLabSchemaV2>(appState);
  latestStateRef.current = appState;

  const localTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idbTimerRef = useRef<ReturnType<typeof setTimeout> | number | null>(null);
  const isDirtyRef = useRef<boolean>(false);

  const flush = useCallback(() => {
    if (!isDirtyRef.current) return;
    try {
      const stateToPersist = latestStateRef.current;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
      // Asynchronously initiate IndexedDB persist
      persistToIndexedDB(stateToPersist).catch((err) => {
        console.warn('[BD. CivilLab] IndexedDB persistence flush warning:', err);
      });
      isDirtyRef.current = false;
    } catch (err) {
      console.error('[BD. CivilLab] Failed to flush state to localStorage:', err);
    }
  }, []);

  useEffect(() => {
    isDirtyRef.current = true;

    // 1. Debounced localStorage persistence (300ms delay)
    if (localTimerRef.current) {
      clearTimeout(localTimerRef.current);
    }
    localTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(latestStateRef.current));
      } catch (err) {
        console.error('[BD. CivilLab] Debounced localStorage write error:', err);
      }
    }, 300);

    // 2. Debounced IndexedDB persistence (1000ms idle callback)
    if (idbTimerRef.current) {
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && typeof idbTimerRef.current === 'number') {
        window.cancelIdleCallback(idbTimerRef.current);
      } else {
        clearTimeout(idbTimerRef.current as ReturnType<typeof setTimeout>);
      }
    }

    const runIdbBackup = () => {
      persistToIndexedDB(latestStateRef.current).catch((err) => {
        console.warn('[BD. CivilLab] Debounced IndexedDB persist error:', err);
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idbTimerRef.current = window.requestIdleCallback(runIdbBackup, { timeout: 1000 });
    } else {
      idbTimerRef.current = setTimeout(runIdbBackup, 1000);
    }

    return () => {
      // Intentionally do not clear isDirty on cleanup
    };
  }, [appState]);

  // Synchronous flush guarantee on beforeunload and component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flush();
    };
  }, [flush]);

  return { flush };
}
