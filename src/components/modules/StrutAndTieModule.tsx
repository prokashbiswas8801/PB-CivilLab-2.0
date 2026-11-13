import React, { useState } from 'react';
import {
  BuildingCode,
  CivilWorkspace,
  StmMember,
  StmNode,
  StmSupportType,
  StrutAndTieParams,
} from '../../types/civil';
import {
  STM_WORKED_EXAMPLES,
  StrutAndTieResult,
} from '../../utils/strutAndTieEngine';
import { createDefaultStrutAndTie } from '../../utils/storage';
import {
  AlertTriangle,
  BookmarkCheck,
  ChevronDown,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';

export interface StrutAndTieInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  result?: StrutAndTieResult | null;
}

export const StrutAndTieInputs: React.FC<StrutAndTieInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  result,
}) => {
  const stm = activeWorkspace.strutAndTie || createDefaultStrutAndTie();
  const [openSections, setOpenSections] = useState({
    material: true,
    nodes: true,
    members: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const commit = (patch: Partial<StrutAndTieParams>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      strutAndTie: {
        ...(ws.strutAndTie || createDefaultStrutAndTie()),
        ...patch,
      },
    }));
  };

  const loadWorkedExample = (exampleId: string) => {
    const found = STM_WORKED_EXAMPLES.find((ex) => ex.id === exampleId);
    if (!found) return;
    commit({
      ...found.params,
      nodes: found.params.nodes.map((n) => ({ ...n })),
      members: found.params.members.map((m) => ({ ...m })),
      nodalLoads: found.params.nodalLoads.map((l) => ({ ...l })),
    });
  };

  const updateNode = (id: string, patch: Partial<StmNode>) => {
    commit({
      nodes: stm.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    });
  };

  const updateLoadForNode = (nodeId: string, fxKn: number, fyKn: number) => {
    const exists = stm.nodalLoads.some((l) => l.nodeId === nodeId);
    const nextLoads = exists
      ? stm.nodalLoads.map((l) => (l.nodeId === nodeId ? { ...l, fxKn, fyKn } : l))
      : [...stm.nodalLoads, { nodeId, fxKn, fyKn }];
    commit({ nodalLoads: nextLoads });
  };

  const addNode = () => {
    const nextNum = stm.nodes.length + 1;
    const newId = `n${Date.now().toString().slice(-4)}`;
    commit({
      nodes: [
        ...stm.nodes,
        {
          id: newId,
          label: `N${nextNum}`,
          xM: 2.0,
          yM: 0.8,
          support: 'none',
        },
      ],
    });
  };

  const removeNode = (id: string) => {
    if (stm.nodes.length <= 3) return;
    commit({
      nodes: stm.nodes.filter((n) => n.id !== id),
      members: stm.members.filter((m) => m.startNodeId !== id && m.endNodeId !== id),
      nodalLoads: stm.nodalLoads.filter((l) => l.nodeId !== id),
    });
  };

  const updateMember = (id: string, patch: Partial<StmMember>) => {
    commit({
      members: stm.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  };

  const addMember = () => {
    if (stm.nodes.length < 2) return;
    const nextNum = stm.members.length + 1;
    commit({
      members: [
        ...stm.members,
        {
          id: `m${Date.now().toString().slice(-4)}`,
          label: `M${nextNum}`,
          startNodeId: stm.nodes[0].id,
          endNodeId: stm.nodes[stm.nodes.length - 1].id,
          areaCm2: 500,
          strutBetaS: 0.75,
        },
      ],
    });
  };

  const removeMember = (id: string) => {
    if (stm.members.length <= 2) return;
    commit({
      members: stm.members.filter((m) => m.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      {/* Partial Scope Advisory Banner */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 flex items-start gap-2.5 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-[var(--md-sys-color-on-surface)]">
            Scope Status: Partial (Truss Equilibrium &amp; Member Forces)
          </div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Solves exact 2D truss equilibrium, Strut/Tie classification, and required tie steel area A_s. Detailed CCC/CCT/CTT nodal zone geometry and hook anchorage length l_d remain advisory.
          </div>
        </div>
      </div>

      {/* 1-Click Worked Examples Selector */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
            <BookmarkCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>1-Click Discontinuity Region Worked Examples</span>
          </span>
          {result && (
            <span className="text-[11px] font-mono text-[var(--md-sys-color-primary)] font-semibold">
              {result.strutCount} Struts · {result.tieCount} Ties
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {STM_WORKED_EXAMPLES.map((ex) => {
            const active = stm.presetId === ex.id || stm.presetName === ex.name;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => loadWorkedExample(ex.id)}
                className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]'
                    : 'bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]'
                }`}
              >
                <div className="text-xs font-semibold">{ex.name}</div>
                <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  {ex.shortDesc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1: Concrete, Rebar & Thickness */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('material')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-left cursor-pointer"
        >
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>1. D-Region Thickness &amp; Material Capacities</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] transition-transform ${
              openSections.material ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.material && (
          <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Code
              </label>
              <select
                value={stm.code}
                onChange={(e) => commit({ code: e.target.value as BuildingCode })}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono text-[var(--md-sys-color-on-surface)]"
              >
                <option value="BNBC-2020">BNBC-2020</option>
                <option value="ACI-318">ACI 318-19</option>
                <option value="IS-456">IS 456</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Web Width b (mm)
              </label>
              <input
                type="number"
                min={150}
                max={2000}
                step={25}
                value={stm.memberThicknessMm}
                onChange={(e) => commit({ memberThicknessMm: Number(e.target.value) || 300 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Concrete f&apos;c (MPa)
              </label>
              <input
                type="number"
                min={15}
                max={70}
                step={1}
                value={stm.concreteFcMpa}
                onChange={(e) => commit({ concreteFcMpa: Number(e.target.value) || 28 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Tie Yield f_y (MPa)
              </label>
              <input
                type="number"
                min={250}
                max={600}
                step={20}
                value={stm.rebarFyMpa}
                onChange={(e) => commit({ rebarFyMpa: Number(e.target.value) || 420 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Nodes, Supports & Nodal Loads */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('nodes')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-left cursor-pointer"
        >
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
            2. Nodal Coordinates (x, y), Supports &amp; Point Loads ({stm.nodes.length})
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] transition-transform ${
              openSections.nodes ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.nodes && (
          <div className="p-3 space-y-2.5 text-xs">
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {stm.nodes.map((node) => {
                const load = stm.nodalLoads.find((l) => l.nodeId === node.id) || {
                  nodeId: node.id,
                  fxKn: 0,
                  fyKn: 0,
                };
                return (
                  <div
                    key={node.id}
                    className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={node.label}
                        onChange={(e) => updateNode(node.id, { label: e.target.value })}
                        className="w-36 px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono font-semibold text-xs text-[var(--md-sys-color-on-surface)]"
                      />
                      <select
                        value={node.support}
                        onChange={(e) =>
                          updateNode(node.id, { support: e.target.value as StmSupportType })
                        }
                        className="px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono text-[11px] text-[var(--md-sys-color-on-surface)]"
                      >
                        <option value="none">Free Node</option>
                        <option value="pin">Pin (Ux, Uy)</option>
                        <option value="roller-y">Roller Y (Uy)</option>
                        <option value="roller-x">Roller X (Ux)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeNode(node.id)}
                        disabled={stm.nodes.length <= 3}
                        className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] disabled:opacity-30 cursor-pointer"
                        title="Remove node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          x (m)
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={node.xM}
                          onChange={(e) => updateNode(node.id, { xM: Number(e.target.value) })}
                          className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          y (m)
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={node.yM}
                          onChange={(e) => updateNode(node.id, { yM: Number(e.target.value) })}
                          className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          Fx (kN)
                        </label>
                        <input
                          type="number"
                          step={10}
                          value={load.fxKn}
                          onChange={(e) =>
                            updateLoadForNode(node.id, Number(e.target.value), load.fyKn)
                          }
                          className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          Fy (kN)
                        </label>
                        <input
                          type="number"
                          step={25}
                          value={load.fyKn}
                          onChange={(e) =>
                            updateLoadForNode(node.id, load.fxKn, Number(e.target.value))
                          }
                          className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addNode}
              className="w-full py-1.5 rounded-lg border border-dashed border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-[11px] font-mono font-semibold text-[var(--md-sys-color-primary)] flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Truss Node</span>
            </button>
          </div>
        )}
      </div>

      {/* Section 3: Strut & Tie Member Connectivity */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('members')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-left cursor-pointer"
        >
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
            3. Strut &amp; Tie Connectivity ({stm.members.length} Members)
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] transition-transform ${
              openSections.members ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.members && (
          <div className="p-3 space-y-2.5 text-xs">
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {stm.members.map((mem) => {
                const resMem = result?.memberResults.find((mr) => mr.memberId === mem.id);
                return (
                  <div
                    key={mem.id}
                    className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={mem.label}
                        onChange={(e) => updateMember(mem.id, { label: e.target.value })}
                        className="w-36 px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono font-semibold text-xs"
                      />
                      {resMem && (
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            resMem.role === 'strut'
                              ? 'text-amber-600 dark:text-amber-400'
                              : resMem.role === 'tie'
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'text-[var(--md-sys-color-on-surface-variant)]'
                          }`}
                        >
                          {resMem.role === 'strut'
                            ? `STRUT (${Math.abs(resMem.axialForceKn).toFixed(0)} kN C)`
                            : resMem.role === 'tie'
                            ? `TIE (+${resMem.axialForceKn.toFixed(0)} kN T)`
                            : 'ZERO-FORCE'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMember(mem.id)}
                        disabled={stm.members.length <= 2}
                        className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] disabled:opacity-30 cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          Start Node
                        </label>
                        <select
                          value={mem.startNodeId}
                          onChange={(e) => updateMember(mem.id, { startNodeId: e.target.value })}
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono text-[11px]"
                        >
                          {stm.nodes.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          End Node
                        </label>
                        <select
                          value={mem.endNodeId}
                          onChange={(e) => updateMember(mem.id, { endNodeId: e.target.value })}
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono text-[11px]"
                        >
                          {stm.nodes.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          Area (cm²)
                        </label>
                        <input
                          type="number"
                          min={5}
                          step={25}
                          value={mem.areaCm2}
                          onChange={(e) => updateMember(mem.id, { areaCm2: Number(e.target.value) || 50 })}
                          className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addMember}
              className="w-full py-1.5 rounded-lg border border-dashed border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-[11px] font-mono font-semibold text-[var(--md-sys-color-primary)] flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Strut / Tie Element</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const StrutAndTieMetrics: React.FC<{
  result: StrutAndTieResult;
}> = ({ result }) => {
  const eqOk = result.equilibriumResidualKn < 1e-2 && result.momentResidualKnm < 1e-2;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Max Compression Strut
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
          {result.maxCompressionStrutKn.toFixed(1)} kN
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          {result.strutCount} Compression Struts (Dashed)
        </div>
      </div>

      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Max Tension Tie Force
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400 mt-1">
          +{result.maxTensionTieKn.toFixed(1)} kN
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          {result.tieCount} Tension Ties (Solid)
        </div>
      </div>

      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Required Tie Steel A_s,req
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-primary)] mt-1">
          {result.totalRequiredTieSteelMm2.toFixed(0)} mm²
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          φ=0.75 · f_y={result.rebarFyMpa} MPa (Advisory Node)
        </div>
      </div>

      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Global Equilibrium &amp; DCR
        </div>
        <div
          className={`text-xl font-bold font-mono tabular-nums mt-1 ${
            result.status === 'critical'
              ? 'text-[var(--md-sys-color-error)]'
              : eqOk
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {(result.governingDcr * 100).toFixed(1)}%
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          {eqOk ? 'ΣF=0, ΣM=0 Verified' : `Residual ${result.equilibriumResidualKn.toExponential(1)}`}
        </div>
      </div>
    </div>
  );
};
