import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Trash2, Download, ShieldAlert } from 'lucide-react';
import { STORAGE_KEY, clearAndResetStorage } from '../utils/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
  onResetAppState?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryFeedback: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryFeedback: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[PB CivilLab Runtime Exception Caught by ErrorBoundary]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleSoftRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryFeedback: null,
    });
    if (this.props.onResetAppState) {
      this.props.onResetAppState();
    }
  };

  handleSafeCacheRecovery = (): void => {
    clearAndResetStorage();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryFeedback: null,
    });
    if (this.props.onResetAppState) {
      this.props.onResetAppState();
    }
  };

  handleExportBackupBeforeReset = (): void => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || '{}';
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pb-civillab-crash-backup-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.setState({
        recoveryFeedback: 'Diagnostic JSON snapshot exported to your device.',
      });
    } catch {
      this.setState({
        recoveryFeedback: 'Unable to export snapshot; proceed with safe cache reset.',
      });
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="min-h-screen w-full bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] flex items-center justify-center p-6"
      >
        <div className="max-w-2xl w-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl p-6 md:p-8">
          <div className="flex items-start gap-4 pb-6 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="w-12 h-12 rounded-lg bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-[var(--md-sys-color-error)]">
                RUNTIME EXCEPTION ISOLATED · SCHEMA V2 SAFEGUARD
              </div>
              <h1 className="text-xl md:text-2xl font-bold mt-1 text-[var(--md-sys-color-on-surface)]">
                Rendering Fault Intercepted by PB CivilLab Boundary
              </h1>
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1.5 leading-relaxed">
                A calculation module or UI component encountered an unexpected runtime error. Your local storage data remains isolated and intact. Choose a recovery action below.
              </p>
            </div>
          </div>

          <div className="my-6 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[var(--md-sys-color-error)]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown runtime rendering exception'}</span>
            </div>
            {this.state.errorInfo?.componentStack && (
              <pre className="mt-3 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] overflow-x-auto max-h-36 leading-relaxed">
                {this.state.errorInfo.componentStack.trim()}
              </pre>
            )}
          </div>

          {this.state.recoveryFeedback && (
            <div className="mb-4 text-xs font-mono text-[var(--md-sys-color-primary)]">
              {this.state.recoveryFeedback}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={this.handleSoftRetry}
              className="touch-target-48 px-5 py-2.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold text-sm flex items-center gap-2 hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Resume Session (Soft Retry)</span>
            </button>

            <button
              type="button"
              onClick={this.handleExportBackupBeforeReset}
              className="touch-target-48 px-4 py-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] font-medium text-sm flex items-center gap-2 hover:bg-[var(--md-sys-color-surface-container)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Local Backup JSON</span>
            </button>

            <button
              type="button"
              onClick={this.handleSafeCacheRecovery}
              className="touch-target-48 px-4 py-2.5 rounded-lg bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Safe Cache Recovery (Reset to Schema v2 Defaults)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
