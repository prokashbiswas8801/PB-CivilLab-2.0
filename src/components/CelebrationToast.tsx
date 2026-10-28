import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, Sparkles, X, ShieldCheck } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'celebrate' | 'info' | 'warning';
  duration?: number;
}

export interface CelebrationToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const CelebrationToast: React.FC<CelebrationToastProps> = ({
  toast,
  onDismiss,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration || 4500;
    const interval = 20;
    const step = 100 / (duration / interval);

    setProgress(100);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast]);

  if (!toast) return null;

  const isCelebration = toast.type === 'celebrate' || toast.type === 'success';
  const isWarning = toast.type === 'warning';

  return (
    <AnimatePresence>
      <motion.div
        key={toast.id}
        initial={{ opacity: 0, y: 32, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full shadow-2xl rounded-3xl overflow-hidden border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]/95 backdrop-blur-xl pointer-events-auto"
        role="alert"
        aria-live="assertive"
      >
        {/* Glow accent halo */}
        {isCelebration && (
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
        )}
        {isWarning && (
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        )}

        <div className="p-4 sm:p-4.5 flex items-start gap-3.5 relative z-10">
          {/* Animated Status Icon */}
          <div className="shrink-0 mt-0.5">
            {toast.type === 'celebrate' ? (
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <Sparkles className="w-4 h-4 fill-emerald-500/40" />
                </motion.div>
                <div className="absolute inset-0 rounded-full border border-emerald-500/40 animate-ping opacity-30" />
              </div>
            ) : toast.type === 'success' ? (
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: [0, 1.25, 1], rotate: [-45, 10, 0] }}
                  transition={{ type: 'spring', stiffness: 550, damping: 22 }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-25" />
              </div>
            ) : toast.type === 'warning' ? (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                <Info className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Toast Message Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="text-xs sm:text-sm font-bold text-[var(--md-sys-color-on-surface)] leading-tight flex items-center gap-1.5">
              <span>{toast.title}</span>
              {isCelebration && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Verified
                </span>
              )}
            </div>
            {toast.description && (
              <p className="text-[11px] sm:text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5 leading-relaxed line-clamp-2">
                {toast.description}
              </p>
            )}
          </div>

          {/* Tactile Dismiss Button */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="shrink-0 p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-transform active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Countdown Progress Bar */}
        <div className="h-0.5 w-full bg-[var(--md-sys-color-surface-container-high)] overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${
              isCelebration
                ? 'bg-emerald-500'
                : isWarning
                ? 'bg-amber-500'
                : 'bg-[var(--md-sys-color-primary)]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
