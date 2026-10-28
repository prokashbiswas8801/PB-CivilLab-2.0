import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  X,
  FileText,
  Clock,
  ExternalLink,
  AlertCircle,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import {
  PublicEngineeringReportRecord,
  getVerifiedReportById,
  decodeVerificationToken,
  listVerifiedReports,
} from '../utils/verificationEngine';

interface VerifySubmittalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecord: (record: PublicEngineeringReportRecord) => void;
}

export function VerifySubmittalModal({
  isOpen,
  onClose,
  onSelectRecord,
}: VerifySubmittalModalProps) {
  const [docRefInput, setDocRefInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<PublicEngineeringReportRecord[]>(() =>
    isOpen ? listVerifiedReports() : []
  );

  // Refresh recent reports whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setRecentReports(listVerifiedReports());
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const raw = docRefInput.trim();
    if (!raw) {
      setErrorMsg('Please enter a Document Reference ID or paste a Verification URL.');
      return;
    }

    // Case 1: Raw URL pasted (e.g. https://.../?verify=PBCL-2026-XXXXXX&token=...)
    if (raw.includes('verify=') || raw.includes('token=')) {
      try {
        const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        const token = url.searchParams.get('token');
        const docId = url.searchParams.get('verify');

        if (token) {
          const decoded = decodeVerificationToken(token);
          if (decoded) {
            onSelectRecord(decoded);
            onClose();
            return;
          }
        }

        if (docId) {
          const found = getVerifiedReportById(docId);
          if (found) {
            onSelectRecord(found);
            onClose();
            return;
          }
        }
      } catch {
        // Continue to token or ID lookup
      }
    }

    // Case 2: Direct Base64 token pasted
    if (raw.length > 50 && !raw.includes(' ')) {
      const decoded = decodeVerificationToken(raw);
      if (decoded) {
        onSelectRecord(decoded);
        onClose();
        return;
      }
    }

    // Case 3: Document Reference ID (e.g., PBCL-2026-XXXXXX)
    const found = getVerifiedReportById(raw);
    if (found) {
      onSelectRecord(found);
      onClose();
      return;
    }

    // Check if it's formatted like a submittal reference
    const isDocRefPattern = /^PBCL-\d{4}-[A-Z0-9]+$/i.test(raw);
    if (isDocRefPattern) {
      setErrorMsg(
        `Document "${raw}" was not found in your local verification registry. If this report was issued on another device, paste the full URL or cryptographic token from the QR code.`
      );
    } else {
      setErrorMsg(
        'Invalid submittal reference format. Document references follow the pattern: PBCL-2026-XXXXXX'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl m3-card rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="verify-modal-title" className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                Verify Engineering Submittal
              </h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Verify PDF reports via Document Reference or QR code link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close verification modal"
            className="p-1.5 rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label
                htmlFor="submittal-doc-ref"
                className="block text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2"
              >
                Document Reference ID or Verification URL
              </label>
              <div className="relative">
                <input
                  id="submittal-doc-ref"
                  type="text"
                  value={docRefInput}
                  onChange={(e) => {
                    setDocRefInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g. PBCL-2026-A1B2C3 or paste https://.../?verify=..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] text-sm font-mono placeholder:font-sans placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all"
                  autoFocus
                />
                <Search className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1.5">
                Scan the QR code on any printed submittal with your phone or paste the reference code above.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-xs transition-opacity cursor-pointer btn-tactile flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify &amp; Load Certified Submittal</span>
            </button>
          </form>

          {/* Recently Issued & Verified Reports */}
          <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Local Certified Submittal Registry ({recentReports.length})
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Stored in browser
              </span>
            </div>

            {recentReports.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] text-center text-xs text-[var(--md-sys-color-on-surface-variant)] border border-dashed border-[var(--md-sys-color-outline-variant)]">
                No certified submittals exported yet. Export a PDF report to automatically register and verify it here.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                {recentReports.map((rec) => (
                  <div
                    key={rec.docId}
                    onClick={() => {
                      onSelectRecord(rec);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[var(--md-sys-color-primary)] group-hover:underline">
                          {rec.docId}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono uppercase">
                          {rec.module.shortLabel}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--md-sys-color-on-surface)] truncate font-medium mt-0.5">
                        {rec.project.name} · {rec.project.projectCode}
                      </div>
                      <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-2 mt-0.5 font-mono">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{new Date(rec.issuedAt).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>EOR: {rec.engineer.fullName}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:bg-[var(--md-sys-color-primary)] group-hover:text-[var(--md-sys-color-on-primary)] transition-colors shrink-0"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
