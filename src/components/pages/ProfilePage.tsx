import React, { useState } from 'react';
import {
  User,
  Sliders,
  FolderGit2,
  FileText,
  Save,
  Check,
  FileDown,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Palette,
  Compass,
  CheckCircle2,
  Globe,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Building,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useCivilLab, CivilProjectItem, EngineeringThemeOption, CivilPdfPreset } from '../../context/CivilLabContext';
import { useTheme } from '../../context/ThemeContext';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

type ProfileTab = 'engineer' | 'preferences' | 'projects' | 'pdf';

export const ProfilePage: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    addProject,
    updateProject,
    removeProject,
    selectActiveProject,
    pdfPreset,
    updatePdfPreset,
  } = useCivilLab();
  const { setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<ProfileTab>('engineer');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Engineer Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: userProfile.name || '',
    title: userProfile.title || '',
    organization: userProfile.organization || '',
    licenseNo: userProfile.licenseNo || '',
    email: userProfile.email || '',
    phone: userProfile.phone || '+880 1712-345678',
    location: userProfile.location || 'Dhaka, Bangladesh',
  });

  // Site & Unit Preferences State
  const [prefForm, setPrefForm] = useState({
    theme: userProfile.theme || 'obsidian-gold',
    defaultUnitSystem: userProfile.defaultUnitSystem || 'SI',
    defaultDesignCode: userProfile.defaultDesignCode || 'BNBC 2020',
    autoCollapseLandscape: userProfile.autoCollapseLandscape ?? true,
    showShortcutBadges: userProfile.showShortcutBadges ?? true,
  });

  // PDF Export Preset Form State
  const [presetForm, setPresetForm] = useState<CivilPdfPreset>({
    paperSize: pdfPreset.paperSize || 'a4',
    orientation: pdfPreset.orientation || 'portrait',
    marginMm: pdfPreset.marginMm || 15,
    includeHeader: pdfPreset.includeHeader ?? true,
    includeFooter: pdfPreset.includeFooter ?? true,
    includeQR: pdfPreset.includeQR ?? true,
    includeFormulaSteps: pdfPreset.includeFormulaSteps ?? true,
    includeDiagram: pdfPreset.includeDiagram ?? true,
    includeSignatureBlock: pdfPreset.includeSignatureBlock ?? true,
    showProjectMetadata: pdfPreset.showProjectMetadata ?? true,
    customHeaderTitle: pdfPreset.customHeaderTitle || 'Official Structural & Geotechnical Submittal Sheet',
    companySubtitle: pdfPreset.companySubtitle || 'PB Civil Engineering Consultancy · Verified Computations',
    signatoryName: pdfPreset.signatoryName || userProfile.name || 'Prokash Biswas, PE',
  });

  // Project Modal / Edit State
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    clientName: '',
    code: '',
    location: '',
    currency: 'BDT',
  });

  const [isGeneratingSamplePdf, setIsGeneratingSamplePdf] = useState(false);

  const showToast = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  // Save Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileForm);
    // Also update signatoryName if it matched previous name
    updatePdfPreset({ signatoryName: `${profileForm.name}${profileForm.title ? `, ${profileForm.title.split(' ')[0]}` : ''}` });
    showToast('Engineer profile saved successfully.');
  };

  // Save Preferences Handler
  const handleSavePreferences = () => {
    updateUserProfile(prefForm);
    setTheme(prefForm.theme as any);
    showToast('Site & unit preferences saved.');
  };

  // Save PDF Preset Handler
  const handleSavePdfPreset = () => {
    updatePdfPreset(presetForm);
    showToast('Saved as default site PDF export preset.');
  };

  // Project Creation / Edit Handlers
  const handleSaveProjectForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim() || !projectForm.code.trim()) return;

    if (editingProjectId) {
      updateProject(editingProjectId, projectForm);
      showToast(`Updated project "${projectForm.name}".`);
      setEditingProjectId(null);
    } else {
      addProject(projectForm);
      showToast(`Created project "${projectForm.name}".`);
      setIsAddingProject(false);
    }

    setProjectForm({
      name: '',
      clientName: '',
      code: '',
      location: '',
      currency: 'BDT',
    });
  };

  const handleStartEditProject = (p: CivilProjectItem) => {
    setEditingProjectId(p.id);
    setProjectForm({
      name: p.name,
      clientName: p.clientName || '',
      code: p.code,
      location: p.location || '',
      currency: p.currency || 'BDT',
    });
    setIsAddingProject(true);
  };

  // Download Sample Test PDF using jsPDF
  const handleDownloadSamplePdf = async () => {
    setIsGeneratingSamplePdf(true);
    try {
      const orientation = presetForm.orientation;
      const format = presetForm.paperSize === 'legal' ? 'legal' : presetForm.paperSize === 'letter' ? 'letter' : 'a4';
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = presetForm.marginMm;
      const contentWidth = pageWidth - 2 * margin;

      let yPos = margin + 4;

      // Header Block
      if (presetForm.includeHeader) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(20, 35, 60);
        doc.text(presetForm.customHeaderTitle, margin, yPos);

        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(90, 105, 125);
        doc.text(presetForm.companySubtitle || 'PB Civil Engineering Consultancy', margin, yPos);

        yPos += 3;
        doc.setDrawColor(210, 220, 230);
        doc.setLineWidth(0.4);
        doc.line(margin, yPos, margin + contentWidth, yPos);
        yPos += 7;
      }

      // Project Metadata Block
      if (presetForm.showProjectMetadata) {
        const activeProj = userProfile.projects.find((p) => p.id === userProfile.activeProjectId) || userProfile.projects[0];
        doc.setFillColor(245, 248, 252);
        doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'F');
        doc.setDrawColor(200, 215, 230);
        doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`PROJECT: ${activeProj?.name || 'Padma River Viaduct Pier Design'}`, margin + 4, yPos + 6);
        doc.text(`CODE: ${activeProj?.code || 'PBCL-2026-VIAD'}`, margin + contentWidth - 45, yPos + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`CLIENT: ${activeProj?.clientName || 'Bangladesh Bridge Authority'}`, margin + 4, yPos + 12);
        doc.text(`LOCATION: ${activeProj?.location || 'Dhaka-Mawa Corridor'}`, margin + 4, yPos + 17);
        doc.text(`DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, margin + contentWidth - 45, yPos + 12);

        yPos += 26;
      }

      // Calculation Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Sample Structural Calculation: Simply Supported Beam Analysis', margin, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Governing Code: ${userProfile.defaultDesignCode || 'BNBC 2020 / ACI 318-19'} · Unit System: ${userProfile.defaultUnitSystem === 'Imperial' ? 'US Customary FPS' : 'SI Metric (N, mm, MPa)'}`, margin, yPos);
      yPos += 8;

      // Key Metrics Table / Grid
      const colW = contentWidth / 3;
      const metrics = [
        { label: 'Span Length L', val: '6.00 m' },
        { label: 'Factored Load Wu', val: '24.50 kN/m' },
        { label: 'Max Moment Mu', val: '110.25 kN·m' },
        { label: 'Max Shear Vu', val: '73.50 kN' },
        { label: 'Concrete f\'c', val: '28.00 MPa' },
        { label: 'Steel Yield fy', val: '415.00 MPa' },
      ];

      metrics.forEach((m, idx) => {
        const c = idx % 3;
        const r = Math.floor(idx / 3);
        const x = margin + c * colW;
        const y = yPos + r * 14;

        doc.setFillColor(250, 252, 255);
        doc.rect(x, y, colW - 2, 11, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(x, y, colW - 2, 11, 'D');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(m.label, x + 3, y + 4);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(m.val, x + 3, y + 9);
      });

      yPos += 34;

      // Formula Steps
      if (presetForm.includeFormulaSteps) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text('Governing Step-by-Step Formulas:', margin, yPos);
        yPos += 5;

        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text('1. Mu = (Wu * L^2) / 8 = (24.50 * 6.00^2) / 8 = 110.25 kN·m [Governing Maximum Flexure]', margin + 4, yPos);
        yPos += 5;
        doc.text('2. Vu = (Wu * L) / 2 = (24.50 * 6.00) / 2 = 73.50 kN [Support Critical Shear]', margin + 4, yPos);
        yPos += 5;
        doc.text('3. phi_Mn = 0.90 * As * fy * (d - a/2) >= Mu -> Capacity Ratio: 78.4% [PASS - CODE NOMINAL]', margin + 4, yPos);
        yPos += 10;
      }

      // Diagram Placeholder
      if (presetForm.includeDiagram) {
        doc.setDrawColor(180, 200, 225);
        doc.setLineDashPattern([2, 2], 0);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos, contentWidth, 24, 2, 2, 'FD');
        doc.setLineDashPattern([], 0);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text('[2D Vector Analytical Bending Moment & Shear Diagram Included Here]', margin + 12, yPos + 13);
        yPos += 30;
      }

      // Signature Block & QR Code
      const bottomY = Math.min(yPos, pageHeight - margin - 35);

      if (presetForm.includeQR) {
        try {
          const qrDataUrl = await QRCode.toDataURL(`PBCL-VERIFY:TEST-${Date.now()}`, { margin: 1, width: 128 });
          doc.addImage(qrDataUrl, 'PNG', margin, bottomY, 22, 22);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text('Scan to Verify Submittal', margin, bottomY + 25);
        } catch {
          // ignore
        }
      }

      if (presetForm.includeSignatureBlock) {
        const sigX = margin + contentWidth - 65;
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);
        doc.line(sigX, bottomY + 16, sigX + 60, bottomY + 16);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(presetForm.signatoryName || userProfile.name, sigX, bottomY + 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(userProfile.title || 'Sub-Assistant Civil Engineer', sigX, bottomY + 24);
        doc.text(`Reg / License: ${userProfile.licenseNo || 'PE-8801-BD'}`, sigX, bottomY + 28);
      }

      // Footer
      if (presetForm.includeFooter) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('Generated by PB CivilLab · Client-Side Verified Engine · Created by Prokash Biswas', margin, pageHeight - margin + 2);
        doc.text(`Page 1 of 1 · Margins: ${presetForm.marginMm}mm · ${presetForm.paperSize.toUpperCase()}`, margin + contentWidth - 45, pageHeight - margin + 2);
      }

      doc.save(`Sample_CivilLab_Submittal_${presetForm.paperSize}_${presetForm.orientation}.pdf`);
      showToast('Sample PDF downloaded successfully.');
    } catch (err: unknown) {
      console.error('Failed to generate sample PDF:', err);
      showToast('Failed to generate sample PDF: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsGeneratingSamplePdf(false);
    }
  };

  const themes: Array<{ id: EngineeringThemeOption; name: string; desc: string; bg: string; text: string; border: string; swatches: string[] }> = [
    {
      id: 'obsidian-gold',
      name: 'Obsidian Gold',
      desc: 'Default dark workbench with amber gold and crimson accents',
      bg: 'bg-[#1C1917]',
      text: 'text-[#FAF7F2]',
      border: 'border-[#F59E0B]/60',
      swatches: ['#121110', '#1C1917', '#F59E0B', '#E11D48'],
    },
    {
      id: 'terracotta-studio',
      name: 'Terracotta Studio',
      desc: 'Espresso dark with burnt orange & warm gold for masonry & structural design',
      bg: 'bg-[#211B18]',
      text: 'text-[#FFFBEB]',
      border: 'border-[#EA580C]/60',
      swatches: ['#161210', '#211B18', '#EA580C', '#EAB308'],
    },
    {
      id: 'editorial-parchment',
      name: 'Editorial Parchment',
      desc: 'Archival cream paper with crimson ruby & amber accents in serif typography',
      bg: 'bg-[#FFFFFF]',
      text: 'text-[#1C1917]',
      border: 'border-[#9F1239]/60',
      swatches: ['#F7F4EF', '#FFFFFF', '#9F1239', '#B45309'],
    },
    {
      id: 'solar-amber',
      name: 'Solar Amber',
      desc: 'Sun-drenched daytime mode with safety vermilion & forest emerald for field use',
      bg: 'bg-[#F8FAFC]',
      text: 'text-[#090D16]',
      border: 'border-[#D9460F]/60',
      swatches: ['#FFFFFF', '#F8FAFC', '#D9460F', '#047857'],
    },
    {
      id: 'emerald-botanical',
      name: 'Emerald Botanical',
      desc: 'Evergreen & polished brass workbench for hydraulic & geotechnical engineering',
      bg: 'bg-[#0D241D]',
      text: 'text-[#ECFDF5]',
      border: 'border-[#10B981]/60',
      swatches: ['#071712', '#0D241D', '#10B981', '#F59E0B'],
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                Engineer Workspace
              </span>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                · Persistent Profile, Presets & Projects
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight">
              User Profile & Site Preferences
            </h1>
            <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl">
              Configure your professional engineer license data, site unit systems, active projects, and global PDF submittal export presets.
            </p>
          </div>

          {/* Quick Active Project Pill */}
          <div className="bg-[var(--md-sys-color-surface-container)] px-3.5 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] flex items-center gap-2 self-start md:self-auto">
            <FolderGit2 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <div className="text-xs">
              <span className="text-[10px] font-mono uppercase text-[var(--md-sys-color-on-surface-variant)] block leading-none">
                Active Project
              </span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                {userProfile.projects.find((p) => p.id === userProfile.activeProjectId)?.name || userProfile.projects[0]?.name || 'PADMA-2026'}
              </span>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {saveSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto border-b border-[var(--md-sys-color-outline-variant)] pb-px no-scrollbar">
          {[
            { id: 'engineer', label: 'Engineer Profile', icon: User, badge: 'Signature & Reg' },
            { id: 'preferences', label: 'Site & Unit Preferences', icon: Sliders, badge: 'Codes & Theme' },
            { id: 'projects', label: `Projects Manager (${userProfile.projects.length})`, icon: FolderGit2, badge: 'Active Site' },
            { id: 'pdf', label: 'Global PDF Export Preset', icon: FileText, badge: 'Page Setup & Print' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/15'
                    : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB A: ENGINEER PROFILE */}
      {/* ===================================================================== */}
      {activeTab === 'engineer' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
              <div>
                <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Professional Engineer Credentials
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  These credentials automatically populate calculation covers, submittal certificates, and PDF stamp blocks.
                </p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-mono font-bold hover:opacity-90 inline-flex items-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Prokash Biswas"
                  className="w-full h-11 px-3 text-sm font-medium rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Professional Designation / Title</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.title}
                  onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                  placeholder="e.g. Sub-Assistant Civil Engineer / Structural Designer"
                  className="w-full h-11 px-3 text-sm font-medium rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Organization / Engineering Firm Name</span>
                </label>
                <input
                  type="text"
                  value={profileForm.organization}
                  onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                  placeholder="e.g. PB Civil Engineering Consultancy"
                  className="w-full h-11 px-3 text-sm font-medium rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>License / Registration ID</span>
                </label>
                <input
                  type="text"
                  value={profileForm.licenseNo}
                  onChange={(e) => setProfileForm({ ...profileForm, licenseNo: e.target.value })}
                  placeholder="e.g. PE-8801-BD / IEB M-34821"
                  className="w-full h-11 px-3 text-sm font-mono font-medium rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="engineer@example.com"
                  className="w-full h-11 px-3 text-sm font-mono font-medium rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Contact Phone / Mobile</span>
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+880 1712-345678"
                  className="w-full h-11 px-3 text-sm font-mono font-medium rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Office / Site Location</span>
                </label>
                <input
                  type="text"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  placeholder="Dhaka Metropolitan Zone, Bangladesh"
                  className="w-full h-11 px-3 text-sm font-medium rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                />
              </div>
            </div>

            {/* Live Signature Block Preview */}
            <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
              <span className="text-xs font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                Live Submittal Signature Block Preview:
              </span>
              <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] max-w-sm">
                <div className="border-b border-slate-400 dark:border-slate-600 pb-1 mb-2 w-48">
                  <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] italic">
                    Digital Seal & Verified Signatory
                  </span>
                </div>
                <div className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  {profileForm.name || 'Prokash Biswas, PE'}
                </div>
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  {profileForm.title || 'Sub-Assistant Civil Engineer'}
                </div>
                <div className="text-[11px] font-mono text-[var(--md-sys-color-primary)] mt-0.5">
                  {profileForm.organization || 'PB Civil Consultancy'} · Reg: {profileForm.licenseNo || 'PE-8801-BD'}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* TAB B: SITE & UNIT PREFERENCES */}
      {/* ===================================================================== */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
              <div>
                <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Theme & Design Standards Configuration
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Select your engineering theme, default unit system, and building code standards.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-mono font-bold hover:opacity-90 inline-flex items-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>

            {/* Theme Selector Cards */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Visual Theme Aesthetic</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {themes.map((t) => {
                  const isSelected = prefForm.theme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setPrefForm({ ...prefForm, theme: t.id });
                        setTheme(t.id as any);
                        updateUserProfile({ theme: t.id });
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[var(--md-sys-color-primary)] shadow-md bg-[var(--md-sys-color-primary-container)]/15'
                          : 'border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)] truncate">{t.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />}
                      </div>
                      <div className={`h-10 rounded-xl ${t.bg} ${t.border} border p-2 mb-2 flex items-center justify-between px-2.5`}>
                        <div className="flex -space-x-1.5 shrink-0">
                          {t.swatches.map((color, idx) => (
                            <span
                              key={idx}
                              className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-xs"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${t.text}`}>Serif CAD</span>
                      </div>
                      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-snug line-clamp-2">
                        {t.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Standards & Unit Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Default Unit System</span>
                </label>
                <select
                  value={prefForm.defaultUnitSystem}
                  onChange={(e) => setPrefForm({ ...prefForm, defaultUnitSystem: e.target.value as any })}
                  className="w-full h-11 px-3 text-sm font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                >
                  <option value="SI">SI Metric (mm, m, kN, MPa, kg/m³)</option>
                  <option value="Imperial">Imperial FPS (in, ft, kip, psi, lb/ft³)</option>
                </select>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Can be toggled per workspace with 1-click in the top bar.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Governing Building Code Standard</span>
                </label>
                <select
                  value={prefForm.defaultDesignCode}
                  onChange={(e) => setPrefForm({ ...prefForm, defaultDesignCode: e.target.value })}
                  className="w-full h-11 px-3 text-sm font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                >
                  <option value="BNBC 2020">BNBC 2020 (Bangladesh National Building Code)</option>
                  <option value="ACI 318-19">ACI 318-19 (American Concrete Institute)</option>
                  <option value="IS 456-2000">IS 456:2000 (Indian Standard Plain & Reinforced)</option>
                  <option value="Eurocode 2">Eurocode 2 (EN 1992-1-1 Structural Concrete)</option>
                  <option value="AISC 360-16">AISC 360-16 (Specification for Structural Steel)</option>
                </select>
              </div>
            </div>

            {/* Dock Behavior Toggles */}
            <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
              <span className="text-xs font-mono uppercase font-bold text-[var(--md-sys-color-on-surface)] block">
                Floating Bottom Dock Ergonomics:
              </span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--md-sys-color-on-surface)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefForm.autoCollapseLandscape}
                    onChange={(e) => setPrefForm({ ...prefForm, autoCollapseLandscape: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                  <span>Auto-collapse dock to minimal corner pill in mobile landscape mode (maximizes calculation canvas)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--md-sys-color-on-surface)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefForm.showShortcutBadges}
                    onChange={(e) => setPrefForm({ ...prefForm, showShortcutBadges: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                  <span>Show desktop keyboard shortcut hints on dock buttons (Alt+1..6, Alt+D, Ctrl+K)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB C: PROJECTS MANAGER */}
      {/* ===================================================================== */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
              <div>
                <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Engineering Projects Directory
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Create and manage active engineering projects. The active project tags all new calculations, ledger entries, and PDF covers.
                </p>
              </div>

              {!isAddingProject && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProjectId(null);
                    setProjectForm({
                      name: '',
                      clientName: '',
                      code: `PBCL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                      location: '',
                      currency: 'BDT',
                    });
                    setIsAddingProject(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-mono font-bold hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              )}
            </div>

            {/* Project Creation / Edit Form Modal / Inline Box */}
            {isAddingProject && (
              <form onSubmit={handleSaveProjectForm} className="p-4 rounded-xl border border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface-container)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] font-mono">
                    {editingProjectId ? 'Edit Project Details' : 'Create New Civil Project'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingProject(false);
                      setEditingProjectId(null);
                    }}
                    className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      placeholder="e.g. Padma Viaduct Package-3"
                      className="w-full h-10 px-3 text-xs font-medium rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                      Project Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectForm.code}
                      onChange={(e) => setProjectForm({ ...projectForm, code: e.target.value })}
                      placeholder="e.g. PBCL-2026-VIAD"
                      className="w-full h-10 px-3 text-xs font-mono font-bold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                      Client / Authority Name
                    </label>
                    <input
                      type="text"
                      value={projectForm.clientName}
                      onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                      placeholder="e.g. Bangladesh Bridge Authority (BBA)"
                      className="w-full h-10 px-3 text-xs font-medium rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                      Site Location
                    </label>
                    <input
                      type="text"
                      value={projectForm.location}
                      onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                      placeholder="e.g. Mawa Sector, Munshiganj"
                      className="w-full h-10 px-3 text-xs font-medium rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingProject(false);
                      setEditingProjectId(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-mono font-bold hover:opacity-90 cursor-pointer shadow-xs"
                  >
                    {editingProjectId ? 'Save Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            )}

            {/* Projects List */}
            <div className="space-y-3">
              {userProfile.projects.map((proj) => {
                const isActive = (userProfile.activeProjectId || userProfile.projects[0]?.id) === proj.id;
                return (
                  <div
                    key={proj.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/10 shadow-xs'
                        : 'border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)]">
                            {proj.code}
                          </span>
                          {isActive ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Active Project
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                selectActiveProject(proj.id);
                                showToast(`Set "${proj.name}" as active project.`);
                              }}
                              className="text-[11px] font-mono text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
                            >
                              Set as Active
                            </button>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                          {proj.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">
                          {proj.clientName && <span>Client: {proj.clientName}</span>}
                          {proj.location && <span>· Location: {proj.location}</span>}
                          <span>· Created: {new Date(proj.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleStartEditProject(proj)}
                          className="p-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
                          title="Edit project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {userProfile.projects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete project "${proj.name}"?`)) {
                                removeProject(proj.id);
                                showToast(`Deleted project "${proj.name}".`);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-950/30 text-[var(--md-sys-color-on-surface-variant)] hover:text-red-600 cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB D: GLOBAL PDF EXPORT PRESET & PAGE SETUP */}
      {/* ===================================================================== */}
      {activeTab === 'pdf' && (
        <div className="space-y-6">
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
              <div>
                <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Site-Wide Default PDF Page Setup & Export Preset
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Define your standard engineering submittal geometry, margins, QR cryptographic seal, and signature block.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSamplePdf}
                  disabled={isGeneratingSamplePdf}
                  className="px-3.5 py-2 rounded-xl border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container)] text-xs font-mono font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
                  title="Generate a real test PDF to preview current preset"
                >
                  <FileDown className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>{isGeneratingSamplePdf ? 'Generating...' : 'Download Sample Test PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePdfPreset}
                  className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-mono font-bold hover:opacity-90 inline-flex items-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save as Default Preset</span>
                </button>
              </div>
            </div>

            {/* Page Geometry & Sizing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Paper Size
                </label>
                <select
                  value={presetForm.paperSize}
                  onChange={(e) => setPresetForm({ ...presetForm, paperSize: e.target.value as any })}
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                >
                  <option value="a4">ISO A4 (210 × 297 mm) — International Standard</option>
                  <option value="letter">US Letter (8.5 × 11 in) — North America</option>
                  <option value="legal">US Legal (8.5 × 14 in) — Large Schedules</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Orientation
                </label>
                <select
                  value={presetForm.orientation}
                  onChange={(e) => setPresetForm({ ...presetForm, orientation: e.target.value as any })}
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                >
                  <option value="portrait">Portrait (Standard Vertical Submittal)</option>
                  <option value="landscape">Landscape (Wide Tabular BBS / Takeoff Schedule)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Page Margins
                </label>
                <select
                  value={presetForm.marginMm}
                  onChange={(e) => setPresetForm({ ...presetForm, marginMm: parseInt(e.target.value, 10) })}
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                >
                  <option value="10">Compact (10 mm) — Maximum Data Density</option>
                  <option value="15">Standard (15 mm) — Recommended Engineering Balance</option>
                  <option value="20">Wide (20 mm) — Formal Binder Margins</option>
                </select>
              </div>
            </div>

            {/* Custom Header & Branding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Custom Report Header Title
                </label>
                <input
                  type="text"
                  value={presetForm.customHeaderTitle}
                  onChange={(e) => setPresetForm({ ...presetForm, customHeaderTitle: e.target.value })}
                  placeholder="Official Structural & Geotechnical Submittal Sheet"
                  className="w-full h-11 px-3 text-xs font-medium rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Company / Organization Subtitle
                </label>
                <input
                  type="text"
                  value={presetForm.companySubtitle || ''}
                  onChange={(e) => setPresetForm({ ...presetForm, companySubtitle: e.target.value })}
                  placeholder="PB Civil Engineering Consultancy · Verified Engineering Calculations"
                  className="w-full h-11 px-3 text-xs font-medium rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Engineer Signatory Name in Stamp Block
                </label>
                <input
                  type="text"
                  value={presetForm.signatoryName}
                  onChange={(e) => setPresetForm({ ...presetForm, signatoryName: e.target.value })}
                  placeholder="e.g. Prokash Biswas, PE"
                  className="w-full h-11 px-3 text-xs font-medium rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>
            </div>

            {/* Content Toggles Checklist */}
            <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
              <span className="text-xs font-mono uppercase font-bold text-[var(--md-sys-color-on-surface)] block">
                Submittal Content Inclusions:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[var(--md-sys-color-on-surface)] font-medium">
                  <input
                    type="checkbox"
                    checked={presetForm.includeFormulaSteps}
                    onChange={(e) => setPresetForm({ ...presetForm, includeFormulaSteps: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                  <span>Show Step-by-Step Formula Breakdown (Mu, Vu, phi_Mn)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[var(--md-sys-color-on-surface)] font-medium">
                  <input
                    type="checkbox"
                    checked={presetForm.includeDiagram ?? true}
                    onChange={(e) => setPresetForm({ ...presetForm, includeDiagram: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                  <span>Show 2D Analytical Diagram / Curve Plot Sketch</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[var(--md-sys-color-on-surface)] font-medium">
                  <input
                    type="checkbox"
                    checked={presetForm.includeQR}
                    onChange={(e) => setPresetForm({ ...presetForm, includeQR: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                  <span>Show Tamper-Evident Verification QR Code Stamp</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[var(--md-sys-color-on-surface)] font-medium">
                  <input
                    type="checkbox"
                    checked={presetForm.includeSignatureBlock ?? true}
                    onChange={(e) => setPresetForm({ ...presetForm, includeSignatureBlock: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                  <span>Show Professional Engineer Signature & Seal Block</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[var(--md-sys-color-on-surface)] font-medium sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={presetForm.showProjectMetadata ?? true}
                    onChange={(e) => setPresetForm({ ...presetForm, showProjectMetadata: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                  <span>Show Project Metadata Card (Code, Client, Location, Date)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
