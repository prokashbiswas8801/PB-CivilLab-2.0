/**
 * PB CivilLab — Offline & Background Sync System Types
 * 
 * Provides strict TypeScript models for:
 * - Offline mutation queues across Site Management modules
 *   (Attendance, Field Notes, Petty Cash, Store, Requisitions, etc.)
 * - Background Sync status tracking, conflict resolution, and retry loops
 * - Service Worker communication interfaces
 */

export type SyncModuleType =
  | 'attendance'
  | 'field-notes'
  | 'petty-cash'
  | 'inventory'
  | 'requisitions'
  | 'schedule'
  | 'contractor-bills'
  | 'cube-tests';

export type SyncActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'RECORD_ATTENDANCE'
  | 'BATCH_ATTENDANCE';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncQueueItem {
  id: string; // e.g., 'SYNC-ATT-1730600000000-xyz'
  projectId: string;
  module: SyncModuleType;
  action: SyncActionType;
  entityId: string;
  summary: string; // Human readable description e.g. "Attendance: Md. Rahim (Present, 2h OT)"
  timestamp: string; // ISO 8601 creation timestamp
  status: SyncStatus;
  retryCount: number;
  payload: any;
  error?: string;
  syncedAt?: string;
}

export interface OfflineSyncStats {
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  attendancePending: number;
  fieldNotesPending: number;
  pettyCashPending: number;
}

export interface OfflineSyncContextType {
  // Connectivity Status
  isOnline: boolean; // Effective online state (navigator.onLine && !isSimulatedOffline)
  isNativeOnline: boolean; // Raw browser navigator.onLine
  isSimulatedOffline: boolean; // Developer/tester simulation mode
  toggleSimulatedOffline: () => void;
  setSimulatedOffline: (simulated: boolean) => void;

  // Sync Queue State
  queue: SyncQueueItem[];
  pendingCount: number;
  syncedCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
  stats: OfflineSyncStats;

  // Actions
  enqueueMutation: (item: {
    module: SyncModuleType;
    action: SyncActionType;
    entityId: string;
    summary: string;
    payload: any;
    projectId?: string;
  }) => SyncQueueItem;
  triggerSyncNow: () => Promise<boolean>;
  retryFailedItem: (id: string) => Promise<boolean>;
  clearSyncedHistory: () => void;
  removeQueueItem: (id: string) => void;
  isEntityPending: (module: SyncModuleType, entityId: string) => boolean;

  // Service Worker Metadata
  swRegistered: boolean;
  swBackgroundSyncSupported: boolean;
}
