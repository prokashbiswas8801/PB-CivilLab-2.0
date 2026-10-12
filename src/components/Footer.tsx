import React, { useState } from 'react';
import { Logo } from './Logo';
import { ShieldCheck, FileText, UserCheck, Mail, X, ExternalLink, HardHat, Award, Scale } from 'lucide-react';

export interface FooterProps {
  onNavigateHome?: () => void;
  className?: string;
}

type ModalType = 'credits' | 'terms' | 'privacy' | 'contact' | null;

export const Footer: React.FC<FooterProps> = ({ onNavigateHome, className = '' }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer
        className={`w-full bg-[var(--md-sys-color-surface-container-low)] border-t border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] transition-colors select-none ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Main Footer Grid: 3 Distinct Columns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Column 1: Brand & Tagline & Author */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-3">
                <Logo
                  variant="full"
                  size="md"
                  showTagline={true}
                  onClick={onNavigateHome}
                  asLink={!onNavigateHome}
                  href="#top"
                />
              </div>

              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-sm pt-1">
                Precision computational workbench engineered for structural engineers, geotechnical practitioners,
                and quantity surveyors. High-fidelity formulas, real-time vector diagrams, and standards-compliant takeoff schedules.
              </p>

              {/* Developer / Creator Attribution */}
              <div className="pt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)]">
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Created &amp; Developed by <strong>PROKASH BISWAS</strong></span>
                </span>
              </div>
            </div>

            {/* Column 2: Engineering Code Compliance & Workbenches */}
            <div className="md:col-span-4 space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Standardized Civil Code Engines</span>
              </div>
              <ul className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)]" />
                  <span>ACI 318-19 &amp; Eurocode 2 (EC2) RC Flexure / Shear</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)]" />
                  <span>Terzaghi, Meyerhof &amp; Hansen Bearing Capacity</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)]" />
                  <span>IS 10262 / ACI 211.1 Concrete Absolute Volume Mix</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)]" />
                  <span>Manning &amp; Saint-Venant Open Channel Hydraulics</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Interactive Links & Credentials */}
            <div className="md:col-span-3 space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Compliance &amp; Identity
              </div>
              <div className="flex flex-col space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveModal('credits')}
                  className="text-left text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>Page Credits &amp; Engineering Credentials</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  className="text-left text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Scale className="w-3.5 h-3.5 shrink-0" />
                  <span>Terms of Service &amp; Calculations Scope</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="text-left text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Privacy Policy &amp; Local Persistence</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('contact')}
                  className="text-left text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>Developer Contact &amp; Technical Support</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mandatory Engineering Technical Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
            <p className="text-xs font-mono leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
              <strong className="text-[var(--md-sys-color-on-surface)]">Disclaimer:</strong> PB CivilLab provides design calculations for estimation, academic, and practical guidance purposes. All output should be reviewed by a certified licensed structural engineer prior to construction.
            </p>
          </div>

          {/* Bottom Copyright & Secondary Tagline Statement */}
          <div className="pt-6 border-t border-[var(--md-sys-color-outline-variant)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                &copy; {currentYear} PB CivilLab. All rights reserved.
              </span>
              <span>&middot;</span>
              <span className="text-[var(--md-sys-color-primary)] font-bold">
                PROKASH BISWAS
              </span>
            </div>

            <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold text-[var(--md-sys-color-primary)]">
              <span>CALCULATE SMARTER. BUILD BETTER.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Modal Dialogs for Links & Metadata */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-2xl shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-2.5">
                <Logo variant="mark" size={28} />
                <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  {activeModal === 'credits' && 'Page Credits & Author Credentials'}
                  {activeModal === 'terms' && 'Terms of Service & Engineering Liability'}
                  {activeModal === 'privacy' && 'Privacy Policy & Local Data Persistence'}
                  {activeModal === 'contact' && 'Developer Contact & Feedback'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="touch-target-48 p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Credits */}
            {activeModal === 'credits' && (
              <div className="space-y-4 text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
                  <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Lead Structural Engineer &amp; Full-Stack Architect
                  </div>
                  <div className="font-mono text-[var(--md-sys-color-primary)] text-sm font-bold">
                    PROKASH BISWAS
                  </div>
                  <p className="text-xs">
                    Responsible for mathematical formulation, vector diagrams, civil geotechnical modules,
                    and design token architecture across the PB CivilLab platform.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-[var(--md-sys-color-on-surface)] uppercase font-mono tracking-wider">
                    Core Technical Frameworks &amp; Standards
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 font-mono">
                    <li>Civil Design Standards: ACI 318, Eurocode 2, BNBC 2020, IS 456:2000, ASTM standards</li>
                    <li>Frontend Architecture: React 19, Vite, Tailwind CSS with dynamic Material Design 3 tokens</li>
                    <li>Persistence: 100% Client-Side Local Schema v2 storage, multi-project workspace isolation</li>
                    <li>Icons &amp; Geometry: Official PB CivilLab SVG vector asset set &amp; Lucide Engineering Icons</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Modal Body: Terms of Service */}
            {activeModal === 'terms' && (
              <div className="space-y-4 text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                <p>
                  <strong>1. Acceptance of Terms:</strong> By accessing or using PB CivilLab, you acknowledge that all calculations, diagrams, and estimation schedules are generated through client-side computational algorithms.
                </p>
                <p>
                  <strong>2. Professional Verification Required:</strong> PB CivilLab is intended for estimation, academic verification, preliminary sizing, and field guidance. It does not replace the statutory seal, review, or certification of a registered, licensed Professional Engineer (PE / SE).
                </p>
                <p>
                  <strong>3. Limitation of Liability:</strong> Under no circumstances shall the author (PROKASH BISWAS) or PB CivilLab be liable for direct, indirect, or consequential damages resulting from structural construction, site excavation, or procurement executed without independent engineering peer review.
                </p>
              </div>
            )}

            {/* Modal Body: Privacy Policy */}
            {activeModal === 'privacy' && (
              <div className="space-y-4 text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                <p>
                  <strong>1. 100% Client-Side Data Ownership:</strong> All calculation parameters, workspace configurations, takeoff items, and historical logs remain strictly inside your browser&#39;s local storage.
                </p>
                <p>
                  <strong>2. Zero Server Tracking:</strong> PB CivilLab does not upload your project budgets, contractor rates, or structural dimensions to external advertising or analytics brokers.
                </p>
                <p>
                  <strong>3. Portability &amp; Backups:</strong> You can export and import complete workspace state packages anytime via the built-in JSON Bundle exporter.
                </p>
              </div>
            )}

            {/* Modal Body: Contact */}
            {activeModal === 'contact' && (
              <div className="space-y-4 text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                <p>
                  Have feedback, feature requests for additional civil engineering modules, or code standard inquiries?
                </p>
                <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
                  <div className="font-bold text-[var(--md-sys-color-on-surface)]">
                    Primary Engineering Inquiries
                  </div>
                  <div className="font-mono text-sm font-bold text-[var(--md-sys-color-primary)]">
                    prokashbiswas8801@gmail.com
                  </div>
                  <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                    Creator: PROKASH BISWAS
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="touch-target-48 px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold cursor-pointer"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
