import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  SyncQueueItem,
  OfflineSyncContextType,
  SyncModuleType,
  SyncActionType,
  OfflineSyncStats,
} from '../types/offlineSync';

const QUEUE_STORAGE_KEY = 'bdcivillab_offline_sync_queue_v1';
const LEGACY_QUEUE_STORAGE_KEY = 'pbcivillab_offline_sync_queue_v1';
const SIMULATED_OFFLINE_KEY = 'bdcivillab_simulated_offline';
const LEGACY_SIMULATED_OFFLINE_KEY = 'pbcivillab_simulated_offline';
const LAST_SYNC_KEY = 'bdcivillab_last_sync_timestamp';
const LEGACY_LAST_SYNC_KEY = 'pbcivillab_last_sync_timestamp';

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Raw Browser Connectivity Status
  const [isNativeOnline, setIsNativeOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // 2. Simulated Offline Mode (for testing without turning off internet)
  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SIMULATED_OFFLINE_KEY) ?? localStorage.getItem(LEGACY_SIMULATED_OFFLINE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Effective Online State
  const isOnline = isNativeOnline && !isSimulatedOffline;

  // 3. Persistent Sync Queue State
  const [queue, setQueue] = useState<SyncQueueItem[]>(() => {
    try {
      let raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem(LEGACY_QUEUE_STORAGE_KEY);
        if (raw) localStorage.setItem(QUEUE_STORAGE_KEY, raw);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('[OfflineSync] Failed to read queue from storage:', e);
    }
    return [];
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_SYNC_KEY) || localStorage.getItem(LEGACY_LAST_SYNC_KEY);
    } catch {
      return null;
    }
  });

  // Service Worker State
  const [swRegistered, setSwRegistered] = useState<boolean>(false);
  const [swBackgroundSyncSupported, setSwBackgroundSyncSupported] = useState<boolean>(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Sync reference to avoid stale closures during auto-sync
  const queueRef = useRef<SyncQueueItem[]>(queue);
  queueRef.current = queue;

  const isOnlineRef = useRef<boolean>(isOnline);
  isOnlineRef.current = isOnline;

  // Save queue to localStorage
  const saveQueue = useCallback((newQueue: SyncQueueItem[]) => {
    setQueue(newQueue);
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newQueue));
    } catch (e) {
      console.error('[OfflineSync] Failed to persist queue to localStorage:', e);
    }
  }, []);

  // Set Simulated Offline
  const setSimulatedOffline = useCallback((simulated: boolean) => {
    setIsSimulatedOfflineState(simulated);
    try {
      localStorage.setItem(SIMULATED_OFFLINE_KEY, simulated ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, []);

  const toggleSimulatedOffline = useCallback(() => {
    setSimulatedOffline(!isSimulatedOffline);
  }, [isSimulatedOffline, setSimulatedOffline]);

  // --------------------------------------------------------------------------
  // SERVICE WORKER REGISTRATION & BACKGROUND SYNC SETUP
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        swRegistrationRef.current = registration;
        setSwRegistered(true);

        // Check if Background Sync is supported
        if ('sync' in registration) {
          setSwBackgroundSyncSupported(true);
        }

        // Listen for messages from Service Worker (e.g., BACKGROUND_SYNC_TRIGGERED)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'BACKGROUND_SYNC_TRIGGERED') {
            console.log('[OfflineSync] Received BACKGROUND_SYNC_TRIGGERED from Service Worker');
            // Trigger flush if currently online
            if (isOnlineRef.current) {
              triggerSyncNowInternal();
            }
          }
        });
      } catch (err) {
        console.warn('[OfflineSync] Service Worker registration failed:', err);
      }
    };

    // Register after page load for performance
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  // --------------------------------------------------------------------------
  // SYNC PROCESSING CORE ENGINE
  // --------------------------------------------------------------------------
  const triggerSyncNowInternal = useCallback(async (): Promise<boolean> => {
    const currentQueue = queueRef.current;
    const pendingItems = currentQueue.filter(
      (item) => item.status === 'pending' || item.status === 'failed'
    );

    if (pendingItems.length === 0) {
      return true;
    }

    if (!isOnlineRef.current) {
      return false;
    }

    setIsSyncing(true);

    try {
      // Mark pending items as syncing
      const updatedQueue = currentQueue.map((item) => {
        if (item.status === 'pending' || item.status === 'failed') {
          return { ...item, status: 'syncing' as const };
        }
        return item;
      });
      saveQueue(updatedQueue);

      // Simulate network push delay (400ms - 750ms) to mirror realistic cloud sync
      await new Promise((resolve) => setTimeout(resolve, 600));

      const nowIso = new Date().toISOString();

      // Successfully synced: update items to 'synced' and keep history up to 50 items
      const finalizedQueue = updatedQueue.map((item) => {
        if (item.status === 'syncing') {
          return {
            ...item,
            status: 'synced' as const,
            syncedAt: nowIso,
            retryCount: item.retryCount + 1,
          };
        }
        return item;
      });

      // Keep only last 50 synced items to prevent unbounded localStorage growth
      const syncedItems = finalizedQueue.filter((i) => i.status === 'synced');
      const nonSyncedItems = finalizedQueue.filter((i) => i.status !== 'synced');
      const trimmedSynced = syncedItems.slice(-50);
      const cleanQueue = [...trimmedSynced, ...nonSyncedItems];

      saveQueue(cleanQueue);
      setLastSyncTime(nowIso);
      try {
        localStorage.setItem(LAST_SYNC_KEY, nowIso);
      } catch {
        // ignore
      }

      // Dispatch custom window event so toast or celebration notification triggers
      window.dispatchEvent(
        new CustomEvent('civillab:sync-complete', {
          detail: {
            syncedCount: pendingItems.length,
            timestamp: nowIso,
          },
        })
      );

      return true;
    } catch (err) {
      console.error('[OfflineSync] Sync failed with exception:', err);
      // Mark as failed
      const rolledBack = currentQueue.map((item) => {
        if (item.status === 'syncing') {
          return {
            ...item,
            status: 'failed' as const,
            error: String(err),
            retryCount: item.retryCount + 1,
          };
        }
        return item;
      });
      saveQueue(rolledBack);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [saveQueue]);

  const triggerSyncNow = useCallback(async (): Promise<boolean> => {
    return triggerSyncNowInternal();
  }, [triggerSyncNowInternal]);

  // --------------------------------------------------------------------------
  // AUTO-SYNC ON RECONNECTION
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleOnline = () => {
      setIsNativeOnline(true);
      // If not simulated offline, trigger sync immediately!
      if (!isSimulatedOffline) {
        console.log('[OfflineSync] Network online restored. Initiating auto-sync...');
        setTimeout(() => {
          triggerSyncNowInternal();
        }, 300);
      }
    };

    const handleOffline = () => {
      setIsNativeOnline(false);
      console.log('[OfflineSync] Network offline detected. Switching to local cache mode.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatedOffline, triggerSyncNowInternal]);

  // Auto-sync when toggling back to online from simulated offline
  useEffect(() => {
    if (isOnline) {
      const hasPending = queueRef.current.some(
        (i) => i.status === 'pending' || i.status === 'failed'
      );
      if (hasPending) {
        triggerSyncNowInternal();
      }
    }
  }, [isOnline, triggerSyncNowInternal]);

  // --------------------------------------------------------------------------
  // ENQUEUE MUTATION
  // --------------------------------------------------------------------------
  const enqueueMutation = useCallback(
    (item: {
      module: SyncModuleType;
      action: SyncActionType;
      entityId: string;
      summary: string;
      payload: any;
      projectId?: string;
    }): SyncQueueItem => {
      const now = new Date().toISOString();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const id = `SYNC-${item.module.toUpperCase()}-${Date.now()}-${randomSuffix}`;

      // If effectively offline, mark as pending. If online, also mark as pending then auto-sync
      const initialStatus: 'pending' = 'pending';

      const newItem: SyncQueueItem = {
        id,
        projectId: item.projectId || 'PROJ-DEFAULT-01',
        module: item.module,
        action: item.action,
        entityId: item.entityId,
        summary: item.summary,
        timestamp: now,
        status: initialStatus,
        retryCount: 0,
        payload: item.payload,
      };

      const updated = [...queueRef.current, newItem];
      saveQueue(updated);

      // Attempt Background Sync registration with Service Worker
      if (!isOnline && swRegistrationRef.current && 'sync' in swRegistrationRef.current) {
        try {
          (swRegistrationRef.current as any).sync
            .register('site-erp-sync')
            .catch(() => {});
        } catch {
          // ignore
        }
      }

      // If online, immediately process in background
      if (isOnline) {
        setTimeout(() => {
          triggerSyncNowInternal();
        }, 150);
      }

      return newItem;
    },
    [isOnline, saveQueue, triggerSyncNowInternal]
  );

  // --------------------------------------------------------------------------
  // RETRY SINGLE FAILED ITEM
  // --------------------------------------------------------------------------
  const retryFailedItem = useCallback(
    async (id: string): Promise<boolean> => {
      const item = queueRef.current.find((i) => i.id === id);
      if (!item) return false;

      const resetItem = { ...item, status: 'pending' as const, error: undefined };
      const updated = queueRef.current.map((i) => (i.id === id ? resetItem : i));
      saveQueue(updated);

      if (isOnline) {
        return triggerSyncNowInternal();
      }
      return false;
    },
    [isOnline, saveQueue, triggerSyncNowInternal]
  );

  // --------------------------------------------------------------------------
  // CLEAR SYNCED HISTORY
  // --------------------------------------------------------------------------
  const clearSyncedHistory = useCallback(() => {
    const remaining = queueRef.current.filter((i) => i.status !== 'synced');
    saveQueue(remaining);
  }, [saveQueue]);

  // --------------------------------------------------------------------------
  // REMOVE QUEUE ITEM
  // --------------------------------------------------------------------------
  const removeQueueItem = useCallback(
    (id: string) => {
      const remaining = queueRef.current.filter((i) => i.id !== id);
      saveQueue(remaining);
    },
    [saveQueue]
  );

  // --------------------------------------------------------------------------
  // CHECK IF ENTITY IS PENDING
  // --------------------------------------------------------------------------
  const isEntityPending = useCallback(
    (module: SyncModuleType, entityId: string): boolean => {
      return queue.some(
        (i) =>
          i.module === module &&
          i.entityId === entityId &&
          (i.status === 'pending' || i.status === 'syncing' || i.status === 'failed')
      );
    },
    [queue]
  );

  // --------------------------------------------------------------------------
  // STATS ROLLUP
  // --------------------------------------------------------------------------
  const stats = useMemo<OfflineSyncStats>(() => {
    let pendingCount = 0;
    let syncedCount = 0;
    let failedCount = 0;
    let attendancePending = 0;
    let fieldNotesPending = 0;
    let pettyCashPending = 0;

    queue.forEach((item) => {
      if (item.status === 'pending' || item.status === 'syncing') {
        pendingCount++;
        if (item.module === 'attendance') attendancePending++;
        if (item.module === 'field-notes') fieldNotesPending++;
        if (item.module === 'petty-cash') pettyCashPending++;
      } else if (item.status === 'synced') {
        syncedCount++;
      } else if (item.status === 'failed') {
        failedCount++;
        if (item.module === 'attendance') attendancePending++;
        if (item.module === 'field-notes') fieldNotesPending++;
        if (item.module === 'petty-cash') pettyCashPending++;
      }
    });

    return {
      pendingCount,
      syncedCount,
      failedCount,
      attendancePending,
      fieldNotesPending,
      pettyCashPending,
    };
  }, [queue]);

  const value = useMemo<OfflineSyncContextType>(
    () => ({
      isOnline,
      isNativeOnline,
      isSimulatedOffline,
      toggleSimulatedOffline,
      setSimulatedOffline,
      queue,
      pendingCount: stats.pendingCount,
      syncedCount: stats.syncedCount,
      isSyncing,
      lastSyncTime,
      stats,
      enqueueMutation,
      triggerSyncNow,
      retryFailedItem,
      clearSyncedHistory,
      removeQueueItem,
      isEntityPending,
      swRegistered,
      swBackgroundSyncSupported,
    }),
    [
      isOnline,
      isNativeOnline,
      isSimulatedOffline,
      toggleSimulatedOffline,
      setSimulatedOffline,
      queue,
      stats,
      isSyncing,
      lastSyncTime,
      enqueueMutation,
      triggerSyncNow,
      retryFailedItem,
      clearSyncedHistory,
      removeQueueItem,
      isEntityPending,
      swRegistered,
      swBackgroundSyncSupported,
    ]
  );

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
};

export const useOfflineSync = (): OfflineSyncContextType => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
};
