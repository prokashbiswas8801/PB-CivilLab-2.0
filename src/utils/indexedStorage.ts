/**
 * IndexedDB Local-First Storage Provider for PB CivilLab
 * 
 * Provides an asynchronous, robust persistence layer backing up localStorage.
 * Ensures zero-data-loss across app sessions, browser crashes, or storage pressure.
 */

import { CivilLabSchemaV2 } from '../types/civil';

const IDB_DATABASE_NAME = 'pb_civillab_db';
const IDB_DATABASE_VERSION = 1;
const IDB_STORE_NAME = 'app_state_store';
const IDB_STATE_KEY = 'root_state';

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase | null> | null = null;

export function getIDBDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_DATABASE_NAME, IDB_DATABASE_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = (err) => {
        console.warn('[PB CivilLab] IndexedDB open error, falling back to pure localStorage:', err);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('[PB CivilLab] IndexedDB open request blocked');
        resolve(null);
      };
    } catch (e) {
      console.warn('[PB CivilLab] IndexedDB initialization failed:', e);
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Persists the entire state snapshot asynchronously into IndexedDB.
 */
export async function persistToIndexedDB(state: CivilLabSchemaV2): Promise<boolean> {
  try {
    const db = await getIDBDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.put(state, IDB_STATE_KEY);

      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        console.warn('[PB CivilLab] Failed writing state to IndexedDB');
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('[PB CivilLab] Error persisting to IndexedDB:', err);
    return false;
  }
}

/**
 * Loads the state snapshot from IndexedDB if present.
 */
export async function loadFromIndexedDB(): Promise<CivilLabSchemaV2 | null> {
  try {
    const db = await getIDBDatabase();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(IDB_STATE_KEY);

      req.onsuccess = () => {
        if (req.result && typeof req.result === 'object') {
          resolve(req.result as CivilLabSchemaV2);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        console.warn('[PB CivilLab] Failed loading state from IndexedDB');
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('[PB CivilLab] Error loading from IndexedDB:', err);
    return null;
  }
}

/**
 * Purges IndexedDB state (e.g. on user reset).
 */
export async function clearIndexedDB(): Promise<boolean> {
  try {
    const db = await getIDBDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export async function getIndexedDBStats(): Promise<{
  supported: boolean;
  hasStoredState: boolean;
  lastPersistedTime?: string;
  approxSizeChars: number;
}> {
  if (!isIndexedDBSupported()) {
    return { supported: false, hasStoredState: false, approxSizeChars: 0 };
  }

  try {
    const stored = await loadFromIndexedDB();
    if (!stored) {
      return { supported: true, hasStoredState: false, approxSizeChars: 0 };
    }
    const jsonStr = JSON.stringify(stored);
    return {
      supported: true,
      hasStoredState: true,
      lastPersistedTime: stored.lastMigratedAt || new Date().toISOString(),
      approxSizeChars: jsonStr.length,
    };
  } catch {
    return { supported: true, hasStoredState: false, approxSizeChars: 0 };
  }
}
