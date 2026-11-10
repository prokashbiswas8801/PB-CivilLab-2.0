import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Download,
  Languages,
  ArrowLeft,
  Building,
  Calendar,
  MapPin,
  Lock,
  ExternalLink,
  Award,
  Truck,
  Briefcase,
  FileSpreadsheet,
  AlertTriangle,
  QrCode,
  Share2,
} from 'lucide-react';
import { VerifiedOfficeDocRecord } from '../../utils/officeDocVerification';

interface OfficeDocPublicPortalViewProps {
  record: VerifiedOfficeDocRecord;
  onClose: () => void;
  onOpenWorkbench?: () => void;
}

export const OfficeDocPublicPortalView: React.FC<OfficeDocPublicPortalViewProps> = ({
  record,
  onClose,
  onOpenWorkbench,
}) => {
  const [language, setLanguage] = useState<'en' | 'bn'>(record.language || 'en');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyLink = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : record.verificationUrl;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(record.verificationHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getDocTypeIcon = () => {
    switch (record.docType) {
      case 'gate-pass':
        return Truck;
      case 'work-order':
        return Briefcase;
      case 'ra-bill-forwarding':
        return FileSpreadsheet;
      case 'site-instruction-ncr':
        return AlertTriangle;
      case 'completion-certificate':
        return Award;
      default:
        return Award;
    }
  };

  const DocIcon = getDocTypeIcon();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-serif selection:bg-blue-600 selection:text-white">
      {/* Top Fixed Security Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Verification Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-sans tracking-wide text-white">
                  <span className="text-blue-400 font-extrabold">BD.</span> CivilLab
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VERIFIED STAKEHOLDER PORTAL
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Ref: {record.memoNo} • ID: {record.docId}
              </div>
            </div>
          </div>

          {/* Action Strip */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'))}
              className="px-3.5 py-1.5 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Languages className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied Link' : 'Share Link'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {onOpenWorkbench && (
              <button
                type="button"
                onClick={onOpenWorkbench}
                className="px-3.5 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-sans font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all hidden sm:inline-flex"
              >
                <span>Launch Workbench</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Close Portal"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Stakeholder Read-Only View Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Verification Status Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold font-sans text-white">
                  {language === 'bn' ? 'অফিসিয়ালি সত্যায়িত ও সুরক্ষিত নথি' : 'Officially Certified & Secured Document'}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300">
                  PASSED
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-0.5 leading-relaxed">
                {language === 'bn'
                  ? 'এই নথিটি BD. CivilLab অথেনটিকেশন ইঞ্জিনে নিবন্ধিত এবং এর অপরিবর্তনযোগ্য ক্রিপ্টোগ্রাফিক হ্যাশ যাচাইকৃত।'
                  : 'This record was digitally authorized and authenticated under the BD. CivilLab Engineering Registry.'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Verification Hash</div>
            <button
              type="button"
              onClick={handleCopyHash}
              className="text-xs font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              title="Click to copy digital hash"
            >
              <Lock className="w-3 h-3" />
              <span>{record.verificationHash}</span>
              {copiedHash && <span className="text-[10px] text-white">✓</span>}
            </button>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              Issued: {new Date(record.issuedAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Read-Only Document Sheet (White A4 Style for Stakeholders) */}
        <div className={`bg-white text-zinc-950 p-6 sm:p-12 rounded-2xl shadow-2xl border border-slate-700 max-w-3xl mx-auto print:shadow-none print:m-0 print:p-0 print:border-none printable-document ${language === 'bn' ? 'font-nikosh' : ''}`} lang={language === 'bn' ? 'bn' : 'en'}>
          {/* Header */}
          <div className="border-b-2 border-zinc-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 font-serif uppercase">
                  {record.organization}
                </h1>
                <div className="text-xs text-zinc-600 font-sans mt-0.5">
                  Civil, Structural & Architectural Project Management Division
                </div>
                <div className="text-[11px] text-zinc-500 font-sans mt-0.5">
                  Site: {record.siteLocation}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-sm border border-emerald-700 font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800">
                  VERIFIED STAKEHOLDER COPY
                </span>
                <div className="text-[10px] font-mono text-zinc-500 mt-1">
                  Public ID: {record.docId}
                </div>
              </div>
            </div>
          </div>

          {/* Document Reference Strip */}
          <div className="flex justify-between items-center text-xs font-mono border-b border-zinc-200 pb-3 mb-6 text-zinc-700">
            <div>
              <span className="font-semibold text-zinc-900">
                {language === 'bn' ? 'স্মারক নং:' : 'Ref / Memo No:'}
              </span>{' '}
              <span className="font-bold text-zinc-950">{record.memoNo}</span>
            </div>
            <div>
              <span className="font-semibold text-zinc-900">
                {language === 'bn' ? 'তারিখ:' : 'Issue Date:'}
              </span>{' '}
              <span className="font-bold text-zinc-950">{record.issueDate}</span>
            </div>
          </div>

          {/* Project Details Banner */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-300 rounded-lg mb-6 text-xs font-sans grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                {language === 'bn' ? 'প্রকল্পের নাম' : 'Project Title'}
              </span>
              <span className="font-bold text-zinc-900">{record.projectName}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                {language === 'bn' ? 'প্রকল্প কোড' : 'Project Code'}
              </span>
              <span className="font-mono font-bold text-zinc-900">{record.projectCode}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                {language === 'bn' ? 'সাইট লোকেশন' : 'Site Location'}
              </span>
              <span className="text-zinc-800 truncate block">{record.siteLocation}</span>
            </div>
          </div>

          {/* Document Title Header */}
          <div className="text-center my-5">
            <div className="inline-flex items-center gap-2 border-b-2 border-zinc-900 pb-1 px-4">
              <DocIcon className="w-5 h-5 text-zinc-900" />
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-zinc-950">
                {language === 'bn' && record.docTypeTitleBn
                  ? record.docTypeTitleBn
                  : record.docTypeTitle}
              </h2>
            </div>
          </div>

          {/* Primary Key Fields (Simplified Read-Only Grid) */}
          {record.keyFields && record.keyFields.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-sans">
              {record.keyFields.map((field, idx) => (
                <div key={idx} className={field.highlight ? 'col-span-2 sm:col-span-1' : ''}>
                  <span className="text-zinc-500 block text-[10px] font-bold uppercase">
                    {field.label}
                  </span>
                  <span
                    className={`font-mono ${
                      field.highlight
                        ? 'font-bold text-emerald-700 text-sm'
                        : 'font-semibold text-zinc-900'
                    }`}
                  >
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Summary Text / Scope Description */}
          {record.summaryText && (
            <div className="mb-5 text-xs font-sans leading-relaxed text-zinc-800 bg-zinc-50/60 p-3.5 rounded border border-zinc-200">
              <div className="font-bold text-zinc-900 text-[11px] uppercase mb-1">
                {language === 'bn' ? 'নথির সারসংক্ষেপ ও বিবরণ:' : 'Document Summary & Purpose:'}
              </div>
              <p>{record.summaryText}</p>
            </div>
          )}

          {/* Itemized Table (Read-Only) */}
          {record.tableData && record.tableData.rows.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-zinc-300 text-xs font-sans">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-900">
                    {record.tableData.headers.map((h, i) => (
                      <th key={i} className="p-2 border-r border-zinc-300 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {record.tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-zinc-50">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`p-2 border-r border-zinc-300 ${
                            cIdx === 0
                              ? 'font-mono font-bold text-center w-12'
                              : typeof cell === 'number' || (typeof cell === 'string' && cell.startsWith('৳'))
                              ? 'text-right font-mono'
                              : ''
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Contract Clauses or Security Notes */}
          {record.clausesOrNotes && record.clausesOrNotes.length > 0 && (
            <div className="mb-6 p-3 bg-zinc-50 border border-zinc-200 rounded text-[11px] font-sans text-zinc-700 space-y-1">
              <div className="font-bold text-zinc-900 uppercase text-[10px]">
                {language === 'bn' ? 'শর্তাবলী ও বিধিমালা:' : 'Conditions & Specifications:'}
              </div>
              {record.clausesOrNotes.map((note, idx) => (
                <div key={idx} className="leading-relaxed">
                  • {note}
                </div>
              ))}
            </div>
          )}

          {/* Tri-Party Verified Signature Blocks */}
          <div className="grid grid-cols-3 gap-4 pt-12 mt-6 border-t border-zinc-300 text-xs font-sans">
            {record.signatories.map((sig, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-700 font-bold mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{sig.verifiedStatus || 'CERTIFIED'}</span>
                </div>
                <div className="border-t border-zinc-900 pt-2 font-bold text-zinc-950 truncate">
                  {sig.name}
                </div>
                <div className="text-[11px] text-zinc-600 truncate">{sig.title}</div>
                {sig.license && (
                  <div className="text-[10px] font-mono text-zinc-500 truncate">{sig.license}</div>
                )}
                <div className="text-[10px] text-zinc-400 mt-0.5">{sig.role}</div>
              </div>
            ))}
          </div>

          {/* Official Verification Watermark */}
          <div className="mt-10 pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-zinc-400 font-sans">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>CivilLab Verified Public Submittal • Tamper Evident</span>
            </div>
            <div className="font-mono">
              Hash: {record.verificationHash}
            </div>
          </div>
        </div>

        {/* External Stakeholder Instructions */}
        <div className="text-center text-xs text-slate-400 font-sans py-2">
          This read-only verification portal confirms the authenticity of this civil engineering document.
        </div>
      </main>
    </div>
  );
};
