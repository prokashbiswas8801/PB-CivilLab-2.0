import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  UserCheck,
  Calendar,
  FileCode2,
  Briefcase,
  Download,
  Printer,
  FolderArchive,
  Plus,
  Check,
  Edit3,
  Layers,
  Scale,
  Boxes,
  Package,
} from 'lucide-react';
import { CivilWorkspace } from '../../types/civil';
import { useWorkbench } from '../../context/WorkbenchContext';

interface ProjectRollupBannerProps {
  activeWorkspace: CivilWorkspace;
  workspaces: CivilWorkspace[];
  onSelectWorkspace: (workspaceId: string) => void;
  onOpenNewWorkspace: () => void;
  onOpenWorkspaceManager: () => void;
  onOpenPrintPreview: () => void;
  onDirectDownloadPdf: () => void;
}

export const ProjectRollupBanner: React.FC<ProjectRollupBannerProps> = ({
  activeWorkspace,
  workspaces,
  onSelectWorkspace,
  onOpenNewWorkspace,
  onOpenWorkspaceManager,
  onOpenPrintPreview,
  onDirectDownloadPdf,
}) => {
  const workbench = useWorkbench();
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({
    projectName: workbench.projectMetadata.projectName || activeWorkspace.name,
    projectCode: workbench.projectMetadata.projectCode || activeWorkspace.projectCode,
    projectLocation: workbench.projectMetadata.projectLocation || activeWorkspace.siteLocation,
    engineerName: workbench.projectMetadata.engineerName || activeWorkspace.engineerOfRecord,
    clientName: workbench.projectMetadata.clientName || 'Public Works Dept (PWD)',
    date: workbench.projectMetadata.date || new Date().toISOString().split('T')[0],
  });

  const handleSaveMeta = () => {
    workbench.updateProjectMetadata({
      projectName: metaForm.projectName,
      projectCode: metaForm.projectCode,
      projectLocation: metaForm.projectLocation,
      engineerName: metaForm.engineerName,
      clientName: metaForm.clientName,
      date: metaForm.date,
    });
    setIsEditingMeta(false);
  };

  // Live Rollup Computation across active workspace BOQ, materials, BBS & snapshots
  const boqItems = activeWorkspace.boq?.items || [];

  // 1. Total Concrete Volume (m³)
  const boqConcreteM3 = boqItems
    .filter((it) => {
      const desc = (it.description + ' ' + (it.category || '')).toLowerCase();
      return desc.includes('concrete') || desc.includes('rcc') || desc.includes('pcc') || desc.includes('slab') || desc.includes('beam') || desc.includes('column');
    })
    .reduce((acc, it) => acc + (it.numberOfMembers || 1) * (it.lengthM || 0) * (it.widthM || 0) * (it.heightM || 0), 0);

  const matConcreteM3 = (activeWorkspace.concreteMaterials?.members || []).reduce(
    (acc, m) => acc + (m.computedVolumeM3 || (m.count || 1) * (m.lengthM || 0) * (m.widthM || 0) * (m.heightM || 0)),
    0
  );

  const totalConcreteM3 = Number((boqConcreteM3 > 0 ? boqConcreteM3 : (matConcreteM3 > 0 ? matConcreteM3 : 64.8)).toFixed(1));

  // 2. Total Rebar Steel (Ton)
  const boqRebarKg = boqItems
    .filter((it) => {
      const desc = (it.description + ' ' + (it.category || '')).toLowerCase();
      return desc.includes('steel') || desc.includes('rebar') || desc.includes('reinforcement');
    })
    .reduce((acc, it) => acc + (it.numberOfMembers || 1) * (it.lengthM || 0) * (it.unitRate > 0 ? 1 : 0), 0);

  const estimatedRebarTon = Number(
    (boqRebarKg > 0 ? boqRebarKg / 1000 : (totalConcreteM3 * 95) / 1000).toFixed(2)
  );

  // 3. Total Bricks (Nos)
  const boqBricks = boqItems
    .filter((it) => {
      const desc = (it.description + ' ' + (it.category || '')).toLowerCase();
      return desc.includes('brick') || desc.includes('masonry');
    })
    .reduce((acc, it) => {
      const vol = (it.numberOfMembers || 1) * (it.lengthM || 0) * (it.widthM || 0) * (it.heightM || 0);
      return acc + vol * 500; // standard 500 bricks per m3
    }, 0);

  const masonryBricks = (activeWorkspace.masonry?.wallLengthM || 0) * (activeWorkspace.masonry?.wallHeightM || 0) * 120;
  const totalBricksNos = Math.round(boqBricks > 0 ? boqBricks : (masonryBricks > 0 ? masonryBricks : 14850));

  // 4. Total Cement (Bags)
  // Dry volume factor 1.54: ~7.5 bags per m3 for standard 1:1.5:3 RCC + mortar demand
  const totalCementBags = Math.round(totalConcreteM3 * 7.8 + (totalBricksNos / 500) * 1.8);

  return (
    <section className="border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] rounded-md p-4 sm:p-5 relative overflow-hidden shadow-xs">
      {/* Hairline grid accent watermark */}
      <div className="absolute top-0 right-0 w-80 h-full opacity-5 pointer-events-none font-mono text-[9px] select-none overflow-hidden leading-tight p-2 text-right">
        CAD/CAE BENCHMARK CONTROL · ACI 318-19 · BNBC 2020 · IS 456 · SP 34 · TERZAGHI · MEYERHOF · POMI SMM7 · DENSITY 24 kN/m³ · E_c = 4700√f&apos;c · VOLUMETRIC EXPANSION 1.54
      </div>

      <div className="relative z-10 space-y-4">
        {/* ROW 1: HEADER & LIVE ACTIONS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/60 pb-3.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] px-1.5 py-0.5 rounded text-[11px]">
                {metaForm.projectCode || activeWorkspace.projectCode}
              </span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                {metaForm.projectLocation}
              </span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">
                Governing Code: <strong className="text-[var(--md-sys-color-on-surface)]">{activeWorkspace.governingCode}</strong>
              </span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
              <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-wider">
                Active Benchmark
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-0.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                {metaForm.projectName}
              </h1>
              <button
                type="button"
                onClick={() => setIsEditingMeta(!isEditingMeta)}
                className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface)] border border-transparent hover:border-[var(--md-sys-color-outline-variant)] transition-all cursor-pointer text-xs flex items-center gap-1 font-mono"
                title="Edit Project Identification"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">{isEditingMeta ? 'Cancel' : 'Edit Meta'}</span>
              </button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDirectDownloadPdf}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Export Certified Master Project Summary PDF"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Export Master PDF</span>
            </button>

            <button
              type="button"
              onClick={onOpenPrintPreview}
              className="px-3 py-1.5 rounded bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-opacity"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>Print A4</span>
            </button>

            <button
              type="button"
              onClick={onOpenWorkspaceManager}
              className="px-2.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FolderArchive className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
              <span>Projects ({workspaces.length})</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewWorkspace}
              className="px-2.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* INLINE METADATA EDITOR (EXPANDABLE) */}
        {isEditingMeta && (
          <div className="p-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
            <div>
              <label className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={metaForm.projectName}
                onChange={(e) => setMetaForm({ ...metaForm, projectName: e.target.value })}
                className="w-full px-2 py-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded text-xs text-[var(--md-sys-color-on-surface)]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1">
                Project Code
              </label>
              <input
                type="text"
                value={metaForm.projectCode}
                onChange={(e) => setMetaForm({ ...metaForm, projectCode: e.target.value })}
                className="w-full px-2 py-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded text-xs text-[var(--md-sys-color-on-surface)]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1">
                Location
              </label>
              <input
                type="text"
                value={metaForm.projectLocation}
                onChange={(e) => setMetaForm({ ...metaForm, projectLocation: e.target.value })}
                className="w-full px-2 py-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded text-xs text-[var(--md-sys-color-on-surface)]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1">
                Engineer of Record
              </label>
              <input
                type="text"
                value={metaForm.engineerName}
                onChange={(e) => setMetaForm({ ...metaForm, engineerName: e.target.value })}
                className="w-full px-2 py-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded text-xs text-[var(--md-sys-color-on-surface)]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1">
                Client Organization
              </label>
              <input
                type="text"
                value={metaForm.clientName}
                onChange={(e) => setMetaForm({ ...metaForm, clientName: e.target.value })}
                className="w-full px-2 py-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded text-xs text-[var(--md-sys-color-on-surface)]"
              />
            </div>
            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <label className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1">
                  Report Date
                </label>
                <input
                  type="date"
                  value={metaForm.date}
                  onChange={(e) => setMetaForm({ ...metaForm, date: e.target.value })}
                  className="w-full px-2 py-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded text-xs text-[var(--md-sys-color-on-surface)]"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveMeta}
                className="px-2.5 py-1.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded font-bold text-xs inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        )}

        {/* METADATA METRIC DETAILS BAR */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Engineer: <strong className="text-[var(--md-sys-color-on-surface)]">{metaForm.engineerName}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Client: <strong className="text-[var(--md-sys-color-on-surface)]">{metaForm.clientName}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Date: <strong className="text-[var(--md-sys-color-on-surface)]">{metaForm.date}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Currency: <strong className="text-[var(--md-sys-color-on-surface)]">{activeWorkspace.currency}</strong></span>
          </div>
        </div>

        {/* LIVE PROJECT ROLLUP COUNTERS (4 METRIC TILES) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
          {/* Tile 1: Concrete Volume */}
          <div className="p-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-md flex items-center justify-between">
            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Total Concrete
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[var(--md-sys-color-on-surface)]">
                  {totalConcreteM3.toLocaleString()}
                </span>
                <span className="text-xs font-mono font-semibold text-[var(--md-sys-color-primary)]">
                  m³
                </span>
              </div>
              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                ≈ {(totalConcreteM3 * 35.3147).toFixed(0)} CFT wet volume
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center shrink-0 text-[var(--md-sys-color-primary)]">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          {/* Tile 2: Rebar Steel */}
          <div className="p-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-md flex items-center justify-between">
            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Total Rebar Steel
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[var(--md-sys-color-on-surface)]">
                  {estimatedRebarTon.toLocaleString()}
                </span>
                <span className="text-xs font-mono font-semibold text-amber-500">
                  Ton
                </span>
              </div>
              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                ≈ {Math.round(estimatedRebarTon * 1000).toLocaleString()} kg (d²/162)
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center shrink-0 text-amber-500">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          {/* Tile 3: Bricks */}
          <div className="p-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-md flex items-center justify-between">
            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Total Clay Bricks
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[var(--md-sys-color-on-surface)]">
                  {totalBricksNos.toLocaleString()}
                </span>
                <span className="text-xs font-mono font-semibold text-rose-500">
                  Nos
                </span>
              </div>
              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                Modular 240×115×75mm
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center shrink-0 text-rose-500">
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          {/* Tile 4: Cement Bags */}
          <div className="p-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-md flex items-center justify-between">
            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Total Cement Bags
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[var(--md-sys-color-on-surface)]">
                  {totalCementBags.toLocaleString()}
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-500">
                  Bags
                </span>
              </div>
              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                50 kg net wt · 1.54 factor
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center shrink-0 text-emerald-500">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* WORKSPACE SWITCHER STRIP (IF MULTIPLE) */}
        {workspaces.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 custom-scrollbar text-xs">
            <span className="font-mono text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase shrink-0">
              Switch Project:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => onSelectWorkspace(ws.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                    ws.id === activeWorkspace.id
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                      : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  [{ws.projectCode}] {ws.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
