import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  X,
  Printer,
  FileText,
  Share2,
  Calendar,
  Building,
  MapPin,
  Lock,
  Globe,
  Sparkles,
  Award,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  VerifiedOfficeDocRecord,
  buildOfficeDocVerificationUrl,
  listVerifiedOfficeDocs,
} from '../../utils/officeDocVerification';

interface OfficeDocVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocRecord?: VerifiedOfficeDocRecord | null;
  onOpenPublicPreview?: (record: VerifiedOfficeDocRecord) => void;
}

export const OfficeDocVerificationModal: React.FC<OfficeDocVerificationModalProps> = ({
  isOpen,
  onClose,
  currentDocRecord,
  onOpenPublicPreview,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<VerifiedOfficeDocRecord | null>(
    currentDocRecord || null
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [verifiedList, setVerifiedList] = useState<VerifiedOfficeDocRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      const all = listVerifiedOfficeDocs();
      setVerifiedList(all);
      if (currentDocRecord) {
        setSelectedRecord(currentDocRecord);
      } else if (all.length > 0) {
        setSelectedRecord(all[0]);
      }
    }
  }, [isOpen, currentDocRecord]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bdcivillab.app';
  const publicUrl = selectedRecord ? buildOfficeDocVerificationUrl(selectedRecord, origin) : '';

  useEffect(() => {
    if (!publicUrl) {
      setQrDataUrl('');
      return;
    }
    let isMounted = true;
    QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: 220,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.warn('QR Code generation error:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [publicUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl my-6 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl overflow-hidden font-serif">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300">
                  PUBLIC VERIFICATION PORTAL
                </span>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                  Tamper-Evident URL
                </span>
              </div>
              <h3 className="text-lg font-bold font-serif text-[var(--md-sys-color-on-surface)] mt-0.5">
                Stakeholder Verification Link Generator
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {selectedRecord ? (
            <>
              {/* Active Document Overview Card */}
              <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 font-sans uppercase">
                    {selectedRecord.docTypeTitle}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>AUTHENTIC & VERIFIED</span>
                  </span>
                </div>
                <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  {selectedRecord.projectName}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] pt-1 border-t border-blue-500/15">
                  <div>
                    <span className="text-[10px] block opacity-75">Memo / Ref:</span>
                    <span className="font-bold text-[var(--md-sys-color-on-surface)]">{selectedRecord.memoNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block opacity-75">Issue Date:</span>
                    <span className="font-bold text-[var(--md-sys-color-on-surface)]">{selectedRecord.issueDate}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] block opacity-75">Signing Engineer:</span>
                    <span className="font-bold text-[var(--md-sys-color-on-surface)] truncate block">{selectedRecord.engineerName}</span>
                  </div>
                </div>
              </div>

              {/* QR Code & Public URL Display */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                {qrDataUrl ? (
                  <div className="p-2.5 bg-white rounded-xl shadow-xs border border-zinc-200 shrink-0">
                    <img
                      src={qrDataUrl}
                      alt="Document Verification QR"
                      className="w-32 h-32 object-contain"
                    />
                    <div className="text-[9px] font-mono text-zinc-600 text-center mt-1">
                      Scan to Verify
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl border border-dashed border-[var(--md-sys-color-outline-variant)] flex items-center justify-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    Generating QR...
                  </div>
                )}

                <div className="flex-1 w-full space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 font-sans">
                      Public-Facing Verification URL
                    </label>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-sans mb-1.5 leading-tight">
                      Share this unique, tamper-evident URL with clients, site security, sub-contractors, or financial auditors to display a simplified read-only submittal.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={publicUrl}
                        className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] truncate select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="px-3 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold inline-flex items-center gap-1.5 shrink-0 shadow-xs hover:opacity-90 cursor-pointer transition-all"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {onOpenPublicPreview && selectedRecord ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenPublicPreview(selectedRecord);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                        <span>Open Read-Only Public View</span>
                      </button>
                    ) : (
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                        <span>Open Read-Only Public View</span>
                      </a>
                    )}

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Test in New Tab</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Security Hash Metadata */}
              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Digital Hash:</span>
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                    {selectedRecord.verificationHash}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Algorithm: PB-SHA256
                </span>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-[var(--md-sys-color-on-surface-variant)]">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-600" />
              <p className="font-medium text-sm">No Document Selected</p>
              <p className="text-xs opacity-75 mt-0.5">
                Generate an office document in SM-10 to create its public verification link.
              </p>
            </div>
          )}

          {/* Recently Issued Office Documents Registry */}
          {verifiedList.length > 1 && (
            <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] font-sans block mb-2">
                Recently Issued Documents Registry ({verifiedList.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {verifiedList.map((doc) => {
                  const isCurrent = selectedRecord?.docId === doc.docId;
                  return (
                    <div
                      key={doc.docId}
                      onClick={() => setSelectedRecord(doc)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-[var(--md-sys-color-on-surface)] truncate">
                          {doc.docTypeTitle} — {doc.memoNo}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                          {doc.projectName} • {doc.issueDate}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 shrink-0">
                        {isCurrent ? 'Active' : 'Select'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
