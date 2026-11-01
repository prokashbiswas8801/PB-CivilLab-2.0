import React, { useState, useMemo, useRef } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  FileDown,
  Download,
  Upload,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Tag,
  Clock,
  Compass,
  Boxes,
  Hash,
} from 'lucide-react';
import { useCivilLab, SavedHistoryItem } from '../../context/CivilLabContext';

interface HistoryPageProps {
  onReloadCalculation?: (item: SavedHistoryItem) => void;
  onExportPdf?: (item: SavedHistoryItem) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onReloadCalculation,
  onExportPdf,
}) => {
  const {
    savedHistory,
    deleteSavedHistoryItem,
    clearSavedHistory,
    navigateToCalculator,
    setActivePage,
  } = useCivilLab();

  const [filterType, setFilterType] = useState<'all' | 'calculation' | 'conversion'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importNotification, setImportNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return savedHistory.filter((item) => {
      // Type Filter
      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesModule = (item.moduleId || '').toLowerCase().includes(q);
        const matchesTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesModule && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [savedHistory, filterType, searchQuery]);

  // Copy Summary Handler
  const handleCopySummary = (item: SavedHistoryItem) => {
    const formatted = [
      `PB CivilLab · Saved Record: ${item.title}`,
      `Timestamp: ${new Date(item.timestamp).toLocaleString()}`,
      `Type: ${item.type.toUpperCase()}`,
      `Summary: ${item.summary}`,
      item.keyMetrics && item.keyMetrics.length > 0
        ? `Key Metrics:\n${item.keyMetrics.map((m) => ` - ${m.label}: ${m.value} ${m.unit || ''}`).join('\n')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(formatted);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reload Item Handler
  const handleReload = (item: SavedHistoryItem) => {
    if (onReloadCalculation) {
      onReloadCalculation(item);
    } else if (item.moduleId) {
      if (item.moduleId.startsWith('converter-')) {
        setActivePage('converter');
      } else {
        navigateToCalculator(item.moduleId);
      }
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(savedHistory, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civil_lab_history_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Merge imported items into localStorage savedHistory
          const existing = savedHistory;
          const existingIds = new Set(existing.map((x) => x.id));
          const newItems = parsed.filter((x) => x && x.id && !existingIds.has(x.id));
          const merged = [...newItems, ...existing];
          localStorage.setItem('pb_civillab_saved_history_v2', JSON.stringify(merged));
          localStorage.setItem('civil_lab_saved_history_v1', JSON.stringify(merged));
          setImportNotification({ message: `Successfully restored ${newItems.length} records into ledger.`, type: 'success' });
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } else {
          setImportNotification({ message: 'Invalid backup format. Expected a JSON array of records.', type: 'error' });
        }
      } catch (err) {
        setImportNotification({ message: 'Failed to read backup file. Please ensure it is a valid JSON file.', type: 'error' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Import Notification Banner */}
      {importNotification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
            importNotification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300'
              : 'bg-[var(--md-sys-color-error-container)]/30 border-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <span>{importNotification.message}</span>
          <button
            type="button"
            onClick={() => setImportNotification(null)}
            className="font-bold uppercase tracking-wider text-[10px] hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Ledger Header */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                Permanent Storage
              </span>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                · Never Auto-Deleted ({savedHistory.length} Total Records)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight">
              Engineering Calculations & Conversions Ledger
            </h1>
            <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl">
              All saved beam analyses, rebar takeoffs, concrete mixes, hydraulic profiles, and land conversions. 
              Restore snapshots directly into active workbenches or export certified PDF submittals.
            </p>
          </div>

          {/* Backup / Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container)] text-xs font-mono font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Import JSON history backup from file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Backup</span>
            </button>

            <button
              type="button"
              onClick={handleExportBackup}
              disabled={savedHistory.length === 0}
              className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container)] text-xs font-mono font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export complete history records to JSON backup"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            {savedHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-500 bg-red-50/50 dark:bg-red-950/20 text-xs font-mono font-semibold text-red-700 dark:text-red-400 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Clear all saved records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Clear Confirmation Modal / Banner */}
        {showClearConfirm && (
          <div className="mt-4 p-4 rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900 dark:text-red-200">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>
                Are you sure you want to delete all <strong>{savedHistory.length}</strong> saved records? This action is permanent.
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSavedHistory();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete All
              </button>
            </div>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[var(--md-sys-color-surface-container)] p-1 rounded-xl border border-[var(--md-sys-color-outline-variant)]/60">
            {[
              { id: 'all', label: `All (${savedHistory.length})` },
              {
                id: 'calculation',
                label: `Calculations (${savedHistory.filter((i) => i.type === 'calculation').length})`,
              },
              {
                id: 'conversion',
                label: `Conversions (${savedHistory.filter((i) => i.type === 'conversion').length})`,
              },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilterType(btn.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterType === btn.id
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ledger by title, tag, value..."
              className="w-full h-10 pl-9 pr-3 text-xs font-mono rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:border-[var(--md-sys-color-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Ledger Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] flex items-center justify-center mx-auto">
            <History className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              {savedHistory.length === 0 ? 'No Saved Records Yet' : 'No Matching Records'}
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {savedHistory.length === 0
                ? 'Click "Add to History" on any calculator or unit converter to save complete state snapshots here permanently.'
                : 'Try adjusting your search query or switching between Calculations and Conversions filter pills.'}
            </p>
          </div>
          {savedHistory.length === 0 && (
            <button
              type="button"
              onClick={() => setActivePage('converter')}
              className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-mono font-bold hover:opacity-90 inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Explore Unit Converter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/60 rounded-2xl p-5 shadow-sm transition-all duration-200 space-y-4"
            >
              {/* Item Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        item.type === 'calculation'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {item.type}
                    </span>
                    {item.moduleId && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
                        {item.moduleId}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">
                    {item.summary}
                  </p>
                </div>

                {/* 4 Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 self-start shrink-0">
                  {/* 1. Reload / Open in Calculator */}
                  <button
                    type="button"
                    onClick={() => handleReload(item)}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-mono font-bold hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-opacity"
                    title="Restore inputs and open in active workbench"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Open in Tool</span>
                  </button>

                  {/* 2. Export PDF */}
                  {item.type === 'calculation' && (
                    <button
                      type="button"
                      onClick={() => onExportPdf && onExportPdf(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] text-xs font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                      title="Export verified PDF report"
                    >
                      <FileDown className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                      <span>PDF</span>
                    </button>
                  )}

                  {/* 3. Copy Summary */}
                  <button
                    type="button"
                    onClick={() => handleCopySummary(item)}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] text-xs font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    title="Copy formatted summary to clipboard"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {/* 4. Delete Entry */}
                  <button
                    type="button"
                    onClick={() => deleteSavedHistoryItem(item.id)}
                    className="p-1.5 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-50/50 dark:hover:bg-red-950/30 text-[var(--md-sys-color-on-surface-variant)] hover:text-red-600 cursor-pointer transition-colors"
                    title="Delete record from ledger"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Key Metrics Chips */}
              {item.keyMetrics && item.keyMetrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/60">
                  {item.keyMetrics.map((km, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 font-mono text-xs"
                    >
                      <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                        {km.label}
                      </div>
                      <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5 truncate">
                        {km.value} {km.unit || ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
