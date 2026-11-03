import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  Mic,
  MicOff,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Clock,
  Printer,
  Trash2,
  Check,
  X,
  Volume2,
  Calendar,
  Sparkles,
  User,
  ShieldAlert,
  Compass,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { useOfflineSync } from '../../context/OfflineSyncContext';
import { FieldNote, FieldNoteCategory } from '../../types/siteManagement';

const CATEGORIES: { key: FieldNoteCategory; label: string; color: string }[] = [
  { key: 'Client Instruction', label: 'Client Instruction', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300' },
  { key: 'Architect Verbal Order', label: 'Architect Verbal Order', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-300' },
  { key: 'Site Observation', label: 'Site Observation', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300' },
  { key: 'Safety/Issue', label: 'Safety / Hazard', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300' },
  { key: 'Quality Concern', label: 'Quality Concern', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300' },
];

export const FieldNotebookModule: React.FC = () => {
  const {
    siteData,
    activeProjectId,
    addFieldNote,
    updateFieldNote,
    deleteFieldNote,
  } = useSiteManagement();
  const { isOnline, stats, triggerSyncNow, isSyncing, isEntityPending } = useOfflineSync();

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyUnresolved, setOnlyUnresolved] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------------------------------
  // CREATE FIELD NOTE FORM STATE
  // --------------------------------------------------------------------------
  const [noteForm, setNoteForm] = useState({
    category: 'Client Instruction' as FieldNoteCategory,
    floorGridTag: '#Grid-',
    content: '',
    voiceTranscript: '',
    priority: 'Normal' as 'Normal' | 'High' | 'Critical',
    recordedBy: 'Site Engineer',
    date: new Date().toISOString().split('T')[0],
  });

  // --------------------------------------------------------------------------
  // WEB SPEECH-TO-TEXT DICTATION ENGINE
  // --------------------------------------------------------------------------
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Supports English dictation

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }

      if (finalTranscript) {
        setNoteForm((prev) => ({
          ...prev,
          content: prev.content ? `${prev.content} ${finalTranscript.trim()}` : finalTranscript.trim(),
          voiceTranscript: prev.voiceTranscript
            ? `${prev.voiceTranscript} ${finalTranscript.trim()}`
            : `Spoken: "${finalTranscript.trim()}"`,
        }));
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      showToast('Speech dictation is not supported in this browser environment.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      showToast('Voice dictation paused.');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('Microphone active — speak clearly to record notes hands-free!');
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return siteData.fieldNotes.filter((note) => {
      const matchCategory = selectedCategory === 'All' || note.category === selectedCategory;
      const matchUnresolved = onlyUnresolved ? !note.isResolved : true;
      const matchSearch =
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.floorGridTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.recordedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.voiceTranscript && note.voiceTranscript.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchUnresolved && matchSearch;
    });
  }, [siteData.fieldNotes, selectedCategory, onlyUnresolved, searchQuery]);

  // Submit Note
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.content.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const created = addFieldNote({
      date: noteForm.date,
      category: noteForm.category,
      floorGridTag: noteForm.floorGridTag.trim() || '#General',
      content: noteForm.content.trim(),
      voiceTranscript: noteForm.voiceTranscript.trim() || undefined,
      priority: noteForm.priority,
      recordedBy: noteForm.recordedBy.trim() || 'Site Engineer',
      isResolved: false,
    });

    showToast(`Logged Field Note for ${created.floorGridTag}`);
    setCreateModalOpen(false);
    setNoteForm({
      category: 'Client Instruction',
      floorGridTag: '#Grid-',
      content: '',
      voiceTranscript: '',
      priority: 'Normal',
      recordedBy: 'Site Engineer',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 md:p-6 rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface-container)] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                Site Engineering Diary
              </span>
              <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                {activeProjectId}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
              Smart Engineering Field Notebook
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl">
              Chronological jobsite log for verbal architect orders, client change requests, structural grid observations, and hands-free voice dictation memos.
            </p>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record Field Note</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs cursor-pointer transition-colors"
              title="Print Field Notes Log"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--md-sys-color-outline)]/15">
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Total Notes Logged
            </span>
            <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5 tabular-nums">
              {siteData.fieldNotes.length}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              Permanent audit trail
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Unresolved Issues
            </span>
            <div className="text-xl font-bold font-mono text-rose-600 mt-0.5 tabular-nums">
              {siteData.fieldNotes.filter((n) => !n.isResolved).length}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              Requires field action
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Client / Architect Orders
            </span>
            <div className="text-xl font-bold font-mono text-[var(--md-sys-color-primary)] mt-0.5 tabular-nums">
              {siteData.fieldNotes.filter((n) => n.category === 'Client Instruction' || n.category === 'Architect Verbal Order').length}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              Verbal directives tracked
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/15">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
              Voice Transcripts
            </span>
            <div className="text-xl font-bold font-mono text-purple-600 mt-0.5 tabular-nums">
              {siteData.fieldNotes.filter((n) => n.voiceTranscript).length}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-sans">
              Hands-free memos saved
            </span>
          </div>
        </div>
      </div>

      {/* Offline & Sync Status Banner */}
      {(!isOnline || stats.fieldNotesPending > 0) && (
        <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans shadow-xs ${
          !isOnline
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
            : 'bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {!isOnline ? (
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-purple-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {!isOnline ? 'Offline Field Note Mode: ' : 'Local Notes Queued: '}
              </span>
              <span>
                {stats.fieldNotesPending > 0
                  ? `${stats.fieldNotesPending} field note${stats.fieldNotesPending > 1 ? 's' : ''} stored in local cache.`
                  : 'Site notes and voice memos are safely recorded locally.'}
                {' Data will sync automatically when online.'}
              </span>
            </div>
          </div>
          {isOnline && stats.fieldNotesPending > 0 && (
            <button
              type="button"
              onClick={() => triggerSyncNow()}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 inline-flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : `Sync Notes (${stats.fieldNotesPending})`}</span>
            </button>
          )}
        </div>
      )}

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
              selectedCategory === 'All'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
            }`}
          >
            All Notes ({siteData.fieldNotes.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = siteData.fieldNotes.filter((n) => n.category === cat.key).length;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyUnresolved(!onlyUnresolved)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
              onlyUnresolved
                ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline)]/30'
            }`}
          >
            Pending / Action Required
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search note, #Grid-C3, person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline)]/30 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-hidden focus:border-[var(--md-sys-color-primary)] w-56 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Field Notes List Cards */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)]">
            <BookOpen className="w-10 h-10 mx-auto text-[var(--md-sys-color-on-surface-variant)]/40 mb-3" />
            <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">No Field Notes Found</h4>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
              Tap "+ Record Field Note" above to write or dictate site instructions.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isResolved = note.isResolved;
            const isCritical = note.priority === 'Critical';
            const isHigh = note.priority === 'High';

            return (
              <div
                key={note.id}
                className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isResolved
                    ? 'border-emerald-200 bg-emerald-500/5 opacity-80'
                    : isCritical
                    ? 'border-rose-300 bg-rose-500/5'
                    : 'border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-outline)]/40'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--md-sys-color-outline)]/15">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)]/20">
                      {note.floorGridTag}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        CATEGORIES.find((c) => c.key === note.category)?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {note.category}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      }`}
                    >
                      {note.priority || 'Normal'} Priority
                    </span>

                    {isEntityPending('field-notes', note.id) ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Pending Sync
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 inline-flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Synced
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-mono">{note.date}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono">
                      {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="py-3">
                  <p className="text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed">
                    {note.content}
                  </p>

                  {/* Voice Transcript Tag */}
                  {note.voiceTranscript && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 text-xs flex items-start gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-mono text-[10px] font-bold uppercase block text-purple-700 dark:text-purple-400">
                          Voice Memo Audio Transcription
                        </span>
                        <span className="italic">{note.voiceTranscript}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Bar */}
                <div className="pt-3 border-t border-[var(--md-sys-color-outline)]/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[var(--md-sys-color-on-surface-variant)]">
                    <span>Recorded By: <b>{note.recordedBy}</b></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Resolved Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        updateFieldNote(note.id, { isResolved: !note.isResolved });
                        showToast(`Marked note as ${!note.isResolved ? 'Resolved' : 'Pending'}`);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isResolved
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isResolved ? 'Resolved ✓' : 'Mark Resolved'}</span>
                    </button>

                    {/* Delete Note */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this field note?')) {
                          deleteFieldNote(note.id);
                          showToast('Note deleted');
                        }
                      }}
                      className="p-1 rounded-full text-rose-500 hover:bg-rose-100 cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL: RECORD FIELD NOTE WITH HANDS-FREE SPEECH-TO-TEXT */}
      {/* ==================================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 shadow-2xl p-6 font-serif my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline)]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Record Field Note
                  </h4>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Digital Site Observation & Instruction Book
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isListening && recognitionRef.current) {
                    recognitionRef.current.stop();
                    setIsListening(false);
                  }
                  setCreateModalOpen(false);
                }}
                className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleNoteSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={noteForm.category}
                    onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value as FieldNoteCategory })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Floor / Grid Location Tag <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. #Grid-C3 or #Level2-Plumbing"
                    value={noteForm.floorGridTag}
                    onChange={(e) => setNoteForm({ ...noteForm, floorGridTag: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs font-mono font-semibold border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Dictation Microphone Pill Button */}
              <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-600 text-white'}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] block">
                      Hands-Free Voice Dictation
                    </span>
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                      {isListening ? 'Listening now... Speak your note clearly' : 'Tap to speak notes directly into form'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white shadow-md animate-bounce'
                      : 'bg-purple-700 hover:bg-purple-800 text-white shadow-xs'
                  }`}
                >
                  {isListening ? 'Stop Listening' : 'Start Dictation'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Note Content & Directives <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Client requested shifting master bath vertical plumbing core 6 inches eastward. Advised plumbing contractor to hold core drilling until revised structural shaft drawing arrives."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Priority Level
                  </label>
                  <select
                    value={noteForm.priority}
                    onChange={(e) => setNoteForm({ ...noteForm, priority: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Recorded By
                  </label>
                  <input
                    type="text"
                    required
                    value={noteForm.recordedBy}
                    onChange={(e) => setNoteForm({ ...noteForm, recordedBy: e.target.value })}
                    className="w-full px-4 py-2 rounded-full text-xs border border-[var(--md-sys-color-outline)]/40 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline)]/15">
                <button
                  type="button"
                  onClick={() => {
                    if (isListening && recognitionRef.current) {
                      recognitionRef.current.stop();
                      setIsListening(false);
                    }
                    setCreateModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-sm cursor-pointer hover:opacity-90"
                >
                  Save Field Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
