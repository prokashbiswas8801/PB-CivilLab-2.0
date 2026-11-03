import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Download,
  Users,
  BookOpen,
  Wallet,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info,
  X,
  Database,
  Layers,
} from 'lucide-react';
import { useOfflineSync } from '../../context/OfflineSyncContext';
import { SyncModuleType, SyncQueueItem } from '../../types/offlineSync';

export interface OfflineSyncManagerProps {
  className?: string;
  variant?: 'pill' | 'banner' | 'card';
}

export const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const {
    isOnline,
    isNativeOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    queue,
    pendingCount,
    syncedCount,
    isSyncing,
    lastSyncTime,
    stats,
    triggerSyncNow,
    retryFailedItem,
    clearSyncedHistory,
    removeQueueItem,
    swRegistered,
    swBackgroundSyncSupported,
  } = useOfflineSync();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'synced' | SyncModuleType>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      showToast('⚠️ Cannot sync while offline. Restore connection or disable simulated offline.');
      return;
    }
    const success = await triggerSyncNow();
    if (success) {
      showToast('✓ All offline changes pushed and synchronized successfully!');
    } else {
      showToast('⚠️ Sync encountered an error. Please retry.');
    }
  };

  const handleExportSyncLog = () => {
    const jsonStr = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        networkStatus: isOnline ? 'ONLINE' : 'OFFLINE',
        isSimulatedOffline,
        pendingCount,
        syncedCount,
        queue,
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CivilLab_Sync_Audit_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded offline sync audit log.');
  };

  const filteredQueue = queue.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return item.status === 'pending' || item.status === 'syncing' || item.status === 'failed';
    if (selectedFilter === 'synced') return item.status === 'synced';
    return item.module === selectedFilter;
  });

  const getModuleIcon = (mod: SyncModuleType) => {
    switch (mod) {
      case 'attendance':
        return <Users className="w-3.5 h-3.5 text-blue-500" />;
      case 'field-notes':
        return <BookOpen className="w-3.5 h-3.5 text-purple-500" />;
      case 'petty-cash':
        return <Wallet className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const getModuleBadgeColor = (mod: SyncModuleType) => {
    switch (mod) {
      case 'attendance':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'field-notes':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'petty-cash':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    }
  };

  // --------------------------------------------------------------------------
  // RENDER COMPACT PILL VARIANT (Header / Navigation Bar)
  // --------------------------------------------------------------------------
  return (
    <>
      <div className={`flex items-center gap-2 font-sans ${className}`}>
        {/* Status Pill */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs ${
            isOnline
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 animate-pulse'
          }`}
          title="Click to open Job-Site Offline Cache & Sync Center"
        >
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          )}

          <span>
            {isOnline
              ? isSimulatedOffline
                ? 'Simulated Offline'
                : 'Online & Synced'
              : isSimulatedOffline
              ? 'Offline (Test Mode)'
              : 'Offline (Local Cache)'}
          </span>

          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white shadow-2xs">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Quick Sync Now Button (shown when pending items exist or user wants manual refresh) */}
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs ${
              isOnline
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 active:scale-95'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 border-gray-300 dark:border-gray-700 cursor-not-allowed'
            }`}
            title={isOnline ? 'Push offline mutations to cloud' : 'Connect to internet to push mutations'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : `Sync Now (${pendingCount})`}</span>
          </button>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* FULL OFFLINE CACHE & SYNC CENTER MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
                    isOnline
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                      Job-Site Offline & Cloud Sync Center
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isOnline
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isOnline ? 'Active Connection' : 'Offline Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Service Worker Cache + IndexedDB/LocalStorage Mutation Queue
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Toast Inside Modal */}
              {toastMessage && (
                <div className="px-4 py-2.5 rounded-full bg-emerald-700 text-white text-xs font-medium flex items-center gap-2 shadow-md animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* Status & Simulation Switch Card */}
              <div className="p-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-amber-500" />
                    <span>Offline Caching Engine</span>
                  </div>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                    {isOnline
                      ? 'Connected. Attendance, Field Notes, and Petty Cash vouchers sync automatically.'
                      : 'You are working offline. All entries are safely saved to local storage and queued to push.'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                    <span>
                      Service Worker: <strong>{swRegistered ? 'Active ✓' : 'Initializing'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Background Sync: <strong>{swBackgroundSyncSupported ? 'Supported ✓' : 'Fallback'}</strong>
                    </span>
                    {lastSyncTime && (
                      <>
                        <span>•</span>
                        <span>
                          Last Synced: <strong>{new Date(lastSyncTime).toLocaleTimeString()}</strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Simulated Offline Toggle */}
                <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--md-sys-color-outline-variant)]">
                  <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                    Simulate Field Disconnect
                  </span>
                  <button
                    type="button"
                    onClick={toggleSimulatedOffline}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSimulatedOffline
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                        : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline)] hover:border-amber-500'
                    }`}
                  >
                    {isSimulatedOffline ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-amber-200" />
                        <span>Simulated Offline: ON</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                        <span>Simulate Offline</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Module Pending KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-blue-700 dark:text-blue-300">
                    <span>Attendance</span>
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-1 text-lg font-black font-mono text-blue-900 dark:text-blue-100">
                    {stats.attendancePending}
                  </div>
                  <div className="text-[10px] text-blue-600/80">Pending sync</div>
                </div>

                <div className="p-3 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-purple-700 dark:text-purple-300">
                    <span>Field Notes</span>
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-1 text-lg font-black font-mono text-purple-900 dark:text-purple-100">
                    {stats.fieldNotesPending}
                  </div>
                  <div className="text-[10px] text-purple-600/80">Pending sync</div>
                </div>

                <div className="p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    <span>Petty Cash</span>
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-1 text-lg font-black font-mono text-amber-900 dark:text-amber-100">
                    {stats.pettyCashPending}
                  </div>
                  <div className="text-[10px] text-amber-600/80">Pending sync</div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      { key: 'all', label: `All (${queue.length})` },
                      { key: 'pending', label: `Pending (${pendingCount})` },
                      { key: 'synced', label: `Synced (${syncedCount})` },
                      { key: 'attendance', label: 'Attendance' },
                      { key: 'field-notes', label: 'Notes' },
                      { key: 'petty-cash', label: 'Cash' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setSelectedFilter(f.key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        selectedFilter === f.key
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)]'
                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportSyncLog}
                    className="px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                    title="Export JSON audit trail of all offline actions"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" />
                    <span>Audit Log</span>
                  </button>

                  {syncedCount > 0 && (
                    <button
                      type="button"
                      onClick={clearSyncedHistory}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                      title="Clear synced records from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Synced</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Queue Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--md-sys-color-on-surface)] px-1">
                  <span>Mutation Log ({filteredQueue.length} entries)</span>
                  {pendingCount > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                      {pendingCount} waiting to push
                    </span>
                  )}
                </div>

                {filteredQueue.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                    <p className="font-semibold text-[var(--md-sys-color-on-surface)]">
                      Sync Queue is Pristine
                    </p>
                    <p className="mt-1 max-w-sm mx-auto text-[11px]">
                      All site entries are synchronized with local storage and cloud. When you work offline,
                      mutations appear here with pending badges.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredQueue.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                          item.status === 'pending' || item.status === 'syncing'
                            ? 'bg-amber-500/5 border-amber-500/30'
                            : item.status === 'failed'
                            ? 'bg-red-500/5 border-red-500/30'
                            : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">{getModuleIcon(item.module)}</div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getModuleBadgeColor(
                                  item.module
                                )}`}
                              >
                                {item.module}
                              </span>
                              <span className="font-mono text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                {item.action}
                              </span>
                              <span className="font-mono text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                {new Date(item.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="font-medium text-[var(--md-sys-color-on-surface)] mt-1">
                              {item.summary}
                            </p>
                            {item.error && (
                              <p className="text-[10px] text-red-500 font-mono mt-0.5">{item.error}</p>
                            )}
                          </div>
                        </div>

                        {/* Status & Item Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {item.status === 'synced' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Synced</span>
                            </span>
                          ) : item.status === 'syncing' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                              <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                              <span>Pushing...</span>
                            </span>
                          ) : item.status === 'failed' ? (
                            <button
                              type="button"
                              onClick={() => retryFailedItem(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30 hover:bg-red-500/20 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3 text-red-500" />
                              <span>Retry</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Pending Sync</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeQueueItem(item.id)}
                            className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove mutation from queue"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Changes stay 100% safe in browser storage even if browser is closed.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer flex-1 sm:flex-none text-center"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing || !isOnline}
                  className={`px-5 py-2 rounded-full text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer flex-1 sm:flex-none ${
                    isOnline
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synchronizing...' : 'Sync All Pending'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
