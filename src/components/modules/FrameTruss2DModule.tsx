import React, { useState } from 'react';
import {
  CivilWorkspace,
  FrameTruss2DParams,
  FrameTruss2DNode,
  FrameTruss2DMember,
  FrameTruss2DNodalLoad,
  FrameTruss2DSupportType,
  BuildingCode,
} from '../../types/civil';
import { FrameTruss2DResult } from '../../utils/frameSolver2d';
import { createDefaultFrameTruss2D } from '../../utils/storage';
import {
  Network,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  GitCompare,
  ShieldCheck,
  Activity,
  Sparkles,
  Move,
  Layers,
} from 'lucide-react';

export type FrameTruss2DPresetId =
  | 'portal-sway'
  | 'pratt-truss'
  | 'two-story-frame'
  | 'cantilever-bracket';

export function getFrameTruss2DPreset(presetId: FrameTruss2DPresetId): FrameTruss2DParams {
  if (presetId === 'portal-sway') {
    return createDefaultFrameTruss2D();
  }
  if (presetId === 'pratt-truss') {
    return {
      code: 'BNBC-2020',
      presetName: 'Pratt Roof Truss',
      analysisMode: 'first-order-linear',
      allowableStressMpa: 250,
      sectionDepthMm: 150,
      thermalDeltaC: 0,
      nodes: [
        { id: 'n1', label: 'L0', xM: 0, yM: 0, support: 'pin' },
        { id: 'n2', label: 'L1', xM: 3.0, yM: 0, support: 'none' },
        { id: 'n3', label: 'L2', xM: 6.0, yM: 0, support: 'none' },
        { id: 'n4', label: 'L3', xM: 9.0, yM: 0, support: 'none' },
        { id: 'n5', label: 'L4', xM: 12.0, yM: 0, support: 'roller-x' },
        { id: 'n6', label: 'U1', xM: 3.0, yM: 1.5, support: 'none' },
        { id: 'n7', label: 'U2', xM: 6.0, yM: 3.0, support: 'none' },
        { id: 'n8', label: 'U3', xM: 9.0, yM: 1.5, support: 'none' },
      ],
      members: [
        { id: 'm1', label: 'BC1', startNodeId: 'n1', endNodeId: 'n2', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 24, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm2', label: 'BC2', startNodeId: 'n2', endNodeId: 'n3', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 24, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm3', label: 'BC3', startNodeId: 'n3', endNodeId: 'n4', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 24, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm4', label: 'BC4', startNodeId: 'n4', endNodeId: 'n5', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 24, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm5', label: 'TC1', startNodeId: 'n1', endNodeId: 'n6', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 32, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm6', label: 'TC2', startNodeId: 'n6', endNodeId: 'n7', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 32, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm7', label: 'TC3', startNodeId: 'n7', endNodeId: 'n8', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 32, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm8', label: 'TC4', startNodeId: 'n8', endNodeId: 'n5', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 32, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm9', label: 'V1', startNodeId: 'n2', endNodeId: 'n6', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 16, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm10', label: 'V2', startNodeId: 'n3', endNodeId: 'n7', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 16, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm11', label: 'V3', startNodeId: 'n4', endNodeId: 'n8', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 16, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm12', label: 'D1', startNodeId: 'n6', endNodeId: 'n3', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 18, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm13', label: 'D2', startNodeId: 'n8', endNodeId: 'n3', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 18, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
      ],
      nodalLoads: [
        { nodeId: 'n6', fxKn: 0, fyKn: -30, mzKnm: 0 },
        { nodeId: 'n7', fxKn: 12, fyKn: -45, mzKnm: 0 },
        { nodeId: 'n8', fxKn: 0, fyKn: -30, mzKnm: 0 },
      ],
    };
  }
  if (presetId === 'two-story-frame') {
    return {
      code: 'BNBC-2020',
      presetName: '2-Story Moment Frame',
      analysisMode: 'second-order-p-delta',
      allowableStressMpa: 250,
      sectionDepthMm: 400,
      thermalDeltaC: 0,
      nodes: [
        { id: 'n1', label: 'B1', xM: 0, yM: 0, support: 'fixed' },
        { id: 'n2', label: 'B2', xM: 6.0, yM: 0, support: 'fixed' },
        { id: 'n3', label: 'F1L', xM: 0, yM: 3.5, support: 'none' },
        { id: 'n4', label: 'F1R', xM: 6.0, yM: 3.5, support: 'none' },
        { id: 'n5', label: 'RF-L', xM: 0, yM: 7.0, support: 'none' },
        { id: 'n6', label: 'RF-R', xM: 6.0, yM: 7.0, support: 'none' },
      ],
      members: [
        { id: 'm1', label: 'C1-L', startNodeId: 'n1', endNodeId: 'n3', memberType: 'frame', startHinge: false, endHinge: false, areaCm2: 90, inertiaCm4: 28000, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm2', label: 'C1-R', startNodeId: 'n2', endNodeId: 'n4', memberType: 'frame', startHinge: false, endHinge: false, areaCm2: 90, inertiaCm4: 28000, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm3', label: 'G1', startNodeId: 'n3', endNodeId: 'n4', memberType: 'frame', startHinge: false, endHinge: false, areaCm2: 85, inertiaCm4: 34000, elasticModulusGpa: 200, udlKnPerM: 28.0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm4', label: 'C2-L', startNodeId: 'n3', endNodeId: 'n5', memberType: 'frame', startHinge: false, endHinge: false, areaCm2: 75, inertiaCm4: 22000, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm5', label: 'C2-R', startNodeId: 'n4', endNodeId: 'n6', memberType: 'frame', startHinge: false, endHinge: false, areaCm2: 75, inertiaCm4: 22000, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
        { id: 'm6', label: 'G2', startNodeId: 'n5', endNodeId: 'n6', memberType: 'frame', startHinge: false, endHinge: false, areaCm2: 75, inertiaCm4: 28000, elasticModulusGpa: 200, udlKnPerM: 20.0, pointLoadKn: 0, pointLoadRatio: 0.5 },
      ],
      nodalLoads: [
        { nodeId: 'n3', fxKn: 28.0, fyKn: -35.0, mzKnm: 0 },
        { nodeId: 'n4', fxKn: 0, fyKn: -35.0, mzKnm: 0 },
        { nodeId: 'n5', fxKn: 42.0, fyKn: -25.0, mzKnm: 0 },
        { nodeId: 'n6', fxKn: 0, fyKn: -25.0, mzKnm: 0 },
      ],
    };
  }
  // cantilever-bracket
  return {
    code: 'BNBC-2020',
    presetName: 'Cantilever Bracket Truss',
    analysisMode: 'first-order-linear',
    allowableStressMpa: 250,
    sectionDepthMm: 250,
    thermalDeltaC: 0,
    nodes: [
      { id: 'n1', label: 'W-TOP', xM: 0, yM: 2.5, support: 'pin' },
      { id: 'n2', label: 'W-BOT', xM: 0, yM: 0, support: 'roller-y' },
      { id: 'n3', label: 'MID', xM: 2.5, yM: 2.5, support: 'none' },
      { id: 'n4', label: 'TIP', xM: 5.0, yM: 2.5, support: 'none' },
    ],
    members: [
      { id: 'm1', label: 'BM-1', startNodeId: 'n1', endNodeId: 'n3', memberType: 'frame', startHinge: true, endHinge: false, areaCm2: 50, inertiaCm4: 14000, elasticModulusGpa: 200, udlKnPerM: 10.0, pointLoadKn: 0, pointLoadRatio: 0.5 },
      { id: 'm2', label: 'BM-2', startNodeId: 'n3', endNodeId: 'n4', memberType: 'frame', startHinge: false, endHinge: false, areaCm2: 50, inertiaCm4: 14000, elasticModulusGpa: 200, udlKnPerM: 10.0, pointLoadKn: 0, pointLoadRatio: 0.5 },
      { id: 'm3', label: 'STRUT', startNodeId: 'n2', endNodeId: 'n3', memberType: 'truss', startHinge: true, endHinge: true, areaCm2: 35, inertiaCm4: 0, elasticModulusGpa: 200, udlKnPerM: 0, pointLoadKn: 0, pointLoadRatio: 0.5 },
    ],
    nodalLoads: [
      { nodeId: 'n4', fxKn: -15.0, fyKn: -45.0, mzKnm: 0 },
    ],
  };
}

export interface FrameTruss2DInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
}

export const FrameTruss2DInputs: React.FC<FrameTruss2DInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
}) => {
  const ft = activeWorkspace.frameTruss2d || createDefaultFrameTruss2D();
  const [hasUserEdits, setHasUserEdits] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<FrameTruss2DPresetId | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'nodes' | 'members' | 'loads'>('members');

  const commitFrameState = (next: FrameTruss2DParams, markEdited = true) => {
    if (markEdited) setHasUserEdits(true);
    updateActiveWorkspace((ws) => ({
      ...ws,
      frameTruss2d: next,
    }));
  };

  const handleRequestPreset = (presetId: FrameTruss2DPresetId) => {
    if (hasUserEdits) {
      setPendingPreset(presetId);
      return;
    }
    commitFrameState(getFrameTruss2DPreset(presetId), false);
  };

  const confirmApplyPreset = () => {
    if (!pendingPreset) return;
    commitFrameState(getFrameTruss2DPreset(pendingPreset), false);
    setHasUserEdits(false);
    setPendingPreset(null);
  };

  const handleAddNode = () => {
    const idx = ft.nodes.length + 1;
    const maxX = ft.nodes.length > 0 ? Math.max(...ft.nodes.map((n) => n.xM)) : 0;
    const newNode: FrameTruss2DNode = {
      id: `n-${Date.now().toString(36)}`,
      label: `N${idx}`,
      xM: Number((maxX + 3.0).toFixed(2)),
      yM: 0,
      support: 'none',
    };
    commitFrameState({ ...ft, nodes: [...ft.nodes, newNode] });
  };

  const handleUpdateNode = (id: string, patch: Partial<FrameTruss2DNode>) => {
    commitFrameState({
      ...ft,
      nodes: ft.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    });
  };

  const handleDeleteNode = (id: string) => {
    if (ft.nodes.length <= 2) return;
    commitFrameState({
      ...ft,
      nodes: ft.nodes.filter((n) => n.id !== id),
      members: ft.members.filter((m) => m.startNodeId !== id && m.endNodeId !== id),
      nodalLoads: ft.nodalLoads.filter((l) => l.nodeId !== id),
    });
  };

  const handleAddMember = () => {
    if (ft.nodes.length < 2) return;
    const idx = ft.members.length + 1;
    const startId = ft.nodes[ft.nodes.length - 2].id;
    const endId = ft.nodes[ft.nodes.length - 1].id;
    const newMember: FrameTruss2DMember = {
      id: `m-${Date.now().toString(36)}`,
      label: `M${idx}`,
      startNodeId: startId,
      endNodeId: endId,
      memberType: 'frame',
      startHinge: false,
      endHinge: false,
      areaCm2: 65,
      inertiaCm4: 18500,
      elasticModulusGpa: 200,
      udlKnPerM: 0,
      pointLoadKn: 0,
      pointLoadRatio: 0.5,
    };
    commitFrameState({ ...ft, members: [...ft.members, newMember] });
  };

  const handleUpdateMember = (id: string, patch: Partial<FrameTruss2DMember>) => {
    commitFrameState({
      ...ft,
      members: ft.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  };

  const handleDeleteMember = (id: string) => {
    if (ft.members.length <= 1) return;
    commitFrameState({
      ...ft,
      members: ft.members.filter((m) => m.id !== id),
    });
  };

  const handleAddNodalLoad = () => {
    if (ft.nodes.length === 0) return;
    const targetNode = ft.nodes.find((n) => n.support === 'none') || ft.nodes[ft.nodes.length - 1];
    const newLoad: FrameTruss2DNodalLoad = {
      nodeId: targetNode.id,
      fxKn: 15,
      fyKn: -20,
      mzKnm: 0,
    };
    commitFrameState({ ...ft, nodalLoads: [...ft.nodalLoads, newLoad] });
  };

  const handleUpdateNodalLoad = (index: number, patch: Partial<FrameTruss2DNodalLoad>) => {
    commitFrameState({
      ...ft,
      nodalLoads: ft.nodalLoads.map((l, idx) => (idx === index ? { ...l, ...patch } : l)),
    });
  };

  const handleDeleteNodalLoad = (index: number) => {
    commitFrameState({
      ...ft,
      nodalLoads: ft.nodalLoads.filter((_, idx) => idx !== index),
    });
  };

  const presetButtons: Array<{ id: FrameTruss2DPresetId; title: string; subtitle: string }> = [
    { id: 'portal-sway', title: 'Portal Sway Frame', subtitle: '4 Nodes · Fixed · P-Δ' },
    { id: 'pratt-truss', title: 'Pratt Roof Truss', subtitle: '8 Nodes · 13 Pin Bars' },
    { id: 'two-story-frame', title: '2-Story Moment Frame', subtitle: '6 Nodes · Sway Drift' },
    { id: 'cantilever-bracket', title: 'Cantilever Bracket Truss', subtitle: 'Frame + Strut Hybrid' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Structural Template Presets with Non-Destructive Guard */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structural Benchmarks</span>
          </div>
          {ft.presetName && (
            <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Active: <strong className="text-[var(--md-sys-color-on-surface)]">{ft.presetName}</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {presetButtons.map((p) => {
            const isActive = ft.presetName === p.title && !hasUserEdits;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleRequestPreset(p.id)}
                className={`text-left px-2.5 py-2 rounded-lg border transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <div className="text-xs font-semibold leading-tight">{p.title}</div>
                <div className="text-[10px] font-mono opacity-80 mt-0.5">{p.subtitle}</div>
              </button>
            );
          })}
        </div>

        {pendingPreset && (
          <div
            role="alertdialog"
            aria-label="Confirm loading structural template"
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-2.5 text-xs space-y-2"
          >
            <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                You have unsaved edits to nodes, members, or loads. Loading{' '}
                <strong>{presetButtons.find((b) => b.id === pendingPreset)?.title}</strong> will replace the current topology.
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingPreset(null)}
                className="px-2.5 py-1 rounded-md border border-[var(--md-sys-color-outline)] text-xs font-semibold hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
              >
                Keep Current Edits
              </button>
              <button
                type="button"
                onClick={confirmApplyPreset}
                className="px-2.5 py-1 rounded-md bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold cursor-pointer"
              >
                Replace Topology
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Analysis Mode & Design Criteria */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
          <GitCompare className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          <span>Solver Formulation & Stability</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
          <button
            type="button"
            onClick={() => commitFrameState({ ...ft, analysisMode: 'first-order-linear' })}
            className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
              ft.analysisMode === 'first-order-linear'
                ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            1st-Order Linear [K_E]
          </button>
          <button
            type="button"
            onClick={() => commitFrameState({ ...ft, analysisMode: 'second-order-p-delta' })}
            className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
              ft.analysisMode === 'second-order-p-delta'
                ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            2nd-Order P-Δ [K_E + K_G]
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Design Code
            </label>
            <select
              value={ft.code || 'BNBC-2020'}
              onChange={(e) => commitFrameState({ ...ft, code: e.target.value as BuildingCode })}
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono text-xs"
            >
              <option value="BNBC-2020">BNBC-2020</option>
              <option value="ACI-318">ACI-318 / AISC</option>
              <option value="IS-456">IS-456 / IS-800</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
              σ_allow (MPa)
            </label>
            <input
              type="number"
              min={10}
              step={10}
              value={ft.allowableStressMpa ?? 250}
              onChange={(e) =>
                commitFrameState({ ...ft, allowableStressMpa: Math.max(10, Number(e.target.value) || 0) })
              }
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Depth h (mm)
            </label>
            <input
              type="number"
              min={50}
              step={25}
              value={ft.sectionDepthMm ?? 350}
              onChange={(e) =>
                commitFrameState({ ...ft, sectionDepthMm: Math.max(50, Number(e.target.value) || 0) })
              }
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Thermal ΔT (°C)
            </label>
            <input
              type="number"
              step={5}
              value={ft.thermalDeltaC ?? 0}
              onChange={(e) =>
                commitFrameState({ ...ft, thermalDeltaC: Number(e.target.value) || 0 })
              }
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-xs"
            />
          </div>
        </div>
      </div>

      {/* 3. Tabbed Topology & Load Matrix Editor */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] overflow-hidden">
        <div className="flex items-center border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
          {[
            { id: 'nodes' as const, label: `Nodes (${ft.nodes.length})` },
            { id: 'members' as const, label: `Members (${ft.members.length})` },
            { id: 'loads' as const, label: `Nodal Loads (${ft.nodalLoads.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveEditorTab(tab.id)}
              className={`flex-1 px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-colors cursor-pointer ${
                activeEditorTab === tab.id
                  ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)]'
                  : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* NODES TAB */}
        {activeEditorTab === 'nodes' && (
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Global coordinates (X, Y in m) &amp; boundary restraints
              </span>
              <button
                type="button"
                onClick={handleAddNode}
                className="px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Node
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {ft.nodes.map((node) => (
                <div
                  key={node.id}
                  className="rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-2 space-y-2"
                >
                  <div className="grid grid-cols-12 gap-1.5 items-center text-xs">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">ID</label>
                      <input
                        type="text"
                        value={node.label}
                        onChange={(e) => handleUpdateNode(node.id, { label: e.target.value })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">X (m)</label>
                      <input
                        type="number"
                        step={0.5}
                        value={node.xM}
                        onChange={(e) => handleUpdateNode(node.id, { xM: Number(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">Y (m)</label>
                      <input
                        type="number"
                        step={0.5}
                        value={node.yM}
                        onChange={(e) => handleUpdateNode(node.id, { yM: Number(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">Support</label>
                      <select
                        value={node.support}
                        onChange={(e) =>
                          handleUpdateNode(node.id, {
                            support: e.target.value as FrameTruss2DSupportType,
                            springKx: e.target.value === 'spring' ? node.springKx ?? 5000 : node.springKx,
                            springKy: e.target.value === 'spring' ? node.springKy ?? 15000 : node.springKy,
                            springKr: e.target.value === 'spring' ? node.springKr ?? 0 : node.springKr,
                          })
                        }
                        className="w-full px-1 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono text-xs"
                      >
                        <option value="none">Free Joint</option>
                        <option value="fixed">Fixed</option>
                        <option value="pin">Pin (Ux,Uy)</option>
                        <option value="roller-x">Roller X (Uy)</option>
                        <option value="roller-y">Roller Y (Ux)</option>
                        <option value="spring">Spring (K)</option>
                      </select>
                    </div>
                    <div className="col-span-1 flex justify-end pt-3.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteNode(node.id)}
                        disabled={ft.nodes.length <= 2}
                        title="Remove node"
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {node.support === 'spring' && (
                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[var(--md-sys-color-outline-variant)] text-[11px] font-mono">
                      <div>
                        <label className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Kx (kN/m)</label>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={node.springKx ?? 5000}
                          onChange={(e) => handleUpdateNode(node.id, { springKx: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Ky (kN/m)</label>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={node.springKy ?? 15000}
                          onChange={(e) => handleUpdateNode(node.id, { springKy: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Kr (kN·m/rad)</label>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={node.springKr ?? 0}
                          onChange={(e) => handleUpdateNode(node.id, { springKr: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeEditorTab === 'members' && (
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Element connectivity, hinges, section A/I/E &amp; member loads
              </span>
              <button
                type="button"
                onClick={handleAddMember}
                className="px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Member
              </button>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {ft.members.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-2.5 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={m.label}
                        onChange={(e) => handleUpdateMember(m.id, { label: e.target.value })}
                        className="w-16 px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono font-bold text-xs"
                      />
                      <select
                        value={m.startNodeId}
                        onChange={(e) => handleUpdateMember(m.id, { startNodeId: e.target.value })}
                        className="px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono text-xs"
                      >
                        {ft.nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                      <span className="font-mono text-[var(--md-sys-color-on-surface-variant)]">→</span>
                      <select
                        value={m.endNodeId}
                        onChange={(e) => handleUpdateMember(m.id, { endNodeId: e.target.value })}
                        className="px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono text-xs"
                      >
                        {ft.nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={m.memberType}
                        onChange={(e) => {
                          const nextType = e.target.value as 'frame' | 'truss';
                          handleUpdateMember(m.id, {
                            memberType: nextType,
                            startHinge: nextType === 'truss' ? true : m.startHinge,
                            endHinge: nextType === 'truss' ? true : m.endHinge,
                          });
                        }}
                        className="px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono text-xs"
                      >
                        <option value="frame">Frame</option>
                        <option value="truss">Truss</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id)}
                        disabled={ft.members.length <= 1}
                        title="Remove member"
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Hinges & Section Properties */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 font-mono">
                    <div>
                      <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">A (cm²)</label>
                      <input
                        type="number"
                        min={1}
                        step={5}
                        value={m.areaCm2}
                        onChange={(e) => handleUpdateMember(m.id, { areaCm2: Math.max(0.1, Number(e.target.value) || 0) })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">I (cm⁴)</label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        disabled={m.memberType === 'truss'}
                        value={m.memberType === 'truss' ? 0 : m.inertiaCm4}
                        onChange={(e) => handleUpdateMember(m.id, { inertiaCm4: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums text-xs disabled:opacity-45"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">E (GPa)</label>
                      <input
                        type="number"
                        min={1}
                        step={5}
                        value={m.elasticModulusGpa}
                        onChange={(e) => handleUpdateMember(m.id, { elasticModulusGpa: Math.max(1, Number(e.target.value) || 0) })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">UDL (kN/m)</label>
                      <input
                        type="number"
                        step={2}
                        value={m.udlKnPerM}
                        onChange={(e) => handleUpdateMember(m.id, { udlKnPerM: Number(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">P (kN)</label>
                      <input
                        type="number"
                        step={5}
                        value={m.pointLoadKn}
                        onChange={(e) => handleUpdateMember(m.id, { pointLoadKn: Number(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Ratio a/L</label>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        value={m.pointLoadRatio}
                        onChange={(e) =>
                          handleUpdateMember(m.id, {
                            pointLoadRatio: Math.min(1, Math.max(0, Number(e.target.value) || 0)),
                          })
                        }
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums text-xs"
                      />
                    </div>
                  </div>

                  {m.memberType === 'frame' && (
                    <div className="flex items-center gap-4 pt-1 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={m.startHinge}
                          onChange={(e) => handleUpdateMember(m.id, { startHinge: e.target.checked })}
                        />
                        <span>Start Hinge</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={m.endHinge}
                          onChange={(e) => handleUpdateMember(m.id, { endHinge: e.target.checked })}
                        />
                        <span>End Hinge</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NODAL LOADS TAB */}
        {activeEditorTab === 'loads' && (
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Global joint forces Fx (+Right), Fy (+Up), Mz (+CCW)
              </span>
              <button
                type="button"
                onClick={handleAddNodalLoad}
                className="px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Load
              </button>
            </div>

            {ft.nodalLoads.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] border border-dashed border-[var(--md-sys-color-outline-variant)] rounded-lg">
                No concentrated nodal loads applied. Member UDLs/Point loads remain active.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {ft.nodalLoads.map((load, idx) => (
                  <div
                    key={`nl-${idx}`}
                    className="grid grid-cols-12 gap-1.5 items-center rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-2 text-xs font-mono"
                  >
                    <div className="col-span-3">
                      <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Node</label>
                      <select
                        value={load.nodeId}
                        onChange={(e) => handleUpdateNodalLoad(idx, { nodeId: e.target.value })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-xs"
                      >
                        {ft.nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Fx (kN)</label>
                      <input
                        type="number"
                        step={5}
                        value={load.fxKn}
                        onChange={(e) => handleUpdateNodalLoad(idx, { fxKn: Number(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Fy (kN)</label>
                      <input
                        type="number"
                        step={5}
                        value={load.fyKn}
                        onChange={(e) => handleUpdateNodalLoad(idx, { fyKn: Number(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Mz</label>
                      <input
                        type="number"
                        step={5}
                        value={load.mzKnm}
                        onChange={(e) => handleUpdateNodalLoad(idx, { mzKnm: Number(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] tabular-nums text-xs"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end pt-3.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteNodalLoad(idx)}
                        title="Remove nodal load"
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export interface FrameTruss2DMetricsProps {
  result: FrameTruss2DResult;
}

export const FrameTruss2DMetrics: React.FC<FrameTruss2DMetricsProps> = ({ result }) => {
  const statusIcon =
    result.status === 'critical' ? (
      <XCircle className="w-4 h-4 text-rose-500" />
    ) : result.status === 'warning' ? (
      <AlertTriangle className="w-4 h-4 text-amber-500" />
    ) : (
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    );

  const alphaDisplay = Number.isFinite(result.criticalBucklingFactorAlphaCr)
    ? result.criticalBucklingFactorAlphaCr.toFixed(2)
    : '∞ (Pure Tension)';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Card 1: Max Displacement & Sway Drift */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
          <span>Max Displacement Δ</span>
          <Move className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
        </div>
        <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
          {result.maxDisplacementMm.toFixed(2)} <span className="text-xs font-normal opacity-75">mm</span>
        </div>
        <div className="mt-1 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Node {result.maxDisplacementNodeLabel} · Drift{' '}
          {result.driftRatioDenominator > 0 ? `H/${Math.round(result.driftRatioDenominator)}` : '0'}
        </div>
      </div>

      {/* Card 2: P-Delta & Buckling Factor */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
          <span>Buckling α_cr / P-Δ</span>
          <Activity className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
        </div>
        <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
          {alphaDisplay}
        </div>
        <div className="mt-1 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          {result.analysisMode === 'second-order-p-delta'
            ? `2nd-Order Amp: ${result.pDeltaDisplacementAmplification.toFixed(3)}× (${result.pDeltaIterations} it.)`
            : `Est. B₂ Factor: ${result.b2AmplificationFactor.toFixed(3)}×`}
        </div>
      </div>

      {/* Card 3: Governing Member Envelopes */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
          <span>Peak Member Actions</span>
          <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
        </div>
        <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
          {result.maxAbsMomentKnm.toFixed(1)} <span className="text-xs font-normal opacity-75">kN·m</span>
        </div>
        <div className="mt-1 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          |V|={result.maxAbsShearKn.toFixed(1)} kN · |N|={result.maxAbsAxialKn.toFixed(1)} kN
        </div>
      </div>

      {/* Card 4: Combined Stress DCR & Equilibrium */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
          <span>Stress DCR &amp; Equilibrium</span>
          {statusIcon}
        </div>
        <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
          {(result.utilizationRatio * 100).toFixed(1)}%{' '}
          <span className="text-xs font-normal uppercase">({result.status})</span>
        </div>
        <div className="mt-1 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>
            σ={result.maxCombinedStressMpa.toFixed(1)} MPa · Res {result.equilibriumResidualKn.toExponential(1)}
          </span>
        </div>
      </div>
    </div>
  );
};
