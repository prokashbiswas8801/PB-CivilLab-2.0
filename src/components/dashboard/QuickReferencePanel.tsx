import React, { useState } from 'react';
import {
  BookOpen,
  Hash,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type ReferenceTab = 'rebar' | 'concrete' | 'densities';

interface RebarData {
  diaMm: number;
  areaMm2: number;
  weightKgM: number;
  weightLbFt: number;
  perimeterMm: number;
  lap40dMm: number;
}

const REBAR_TABLE: RebarData[] = [
  { diaMm: 8, areaMm2: 50.3, weightKgM: 0.395, weightLbFt: 0.265, perimeterMm: 25.1, lap40dMm: 320 },
  { diaMm: 10, areaMm2: 78.5, weightKgM: 0.617, weightLbFt: 0.414, perimeterMm: 31.4, lap40dMm: 400 },
  { diaMm: 12, areaMm2: 113.1, weightKgM: 0.888, weightLbFt: 0.597, perimeterMm: 37.7, lap40dMm: 480 },
  { diaMm: 16, areaMm2: 201.1, weightKgM: 1.578, weightLbFt: 1.060, perimeterMm: 50.3, lap40dMm: 640 },
  { diaMm: 20, areaMm2: 314.2, weightKgM: 2.466, weightLbFt: 1.657, perimeterMm: 62.8, lap40dMm: 800 },
  { diaMm: 22, areaMm2: 380.1, weightKgM: 2.984, weightLbFt: 2.005, perimeterMm: 69.1, lap40dMm: 880 },
  { diaMm: 25, areaMm2: 490.9, weightKgM: 3.853, weightLbFt: 2.589, perimeterMm: 78.5, lap40dMm: 1000 },
  { diaMm: 28, areaMm2: 615.8, weightKgM: 4.834, weightLbFt: 3.248, perimeterMm: 88.0, lap40dMm: 1120 },
  { diaMm: 32, areaMm2: 804.2, weightKgM: 6.313, weightLbFt: 4.242, perimeterMm: 100.5, lap40dMm: 1280 },
];

interface ConcreteMixData {
  grade: string;
  ratio: string;
  fckMpa: number;
  fckPsi: number;
  cementBagsPerM3: number;
  sandCftPerM3: number;
  stoneCftPerM3: number;
  wcRatio: string;
}

const CONCRETE_MIX_TABLE: ConcreteMixData[] = [
  { grade: 'M10', ratio: '1 : 3 : 6', fckMpa: 10, fckPsi: 1450, cementBagsPerM3: 4.4, sandCftPerM3: 16.3, stoneCftPerM3: 32.6, wcRatio: '0.55 - 0.60' },
  { grade: 'M15', ratio: '1 : 2 : 4', fckMpa: 15, fckPsi: 2175, cementBagsPerM3: 6.3, sandCftPerM3: 15.5, stoneCftPerM3: 31.0, wcRatio: '0.50 - 0.55' },
  { grade: 'M20', ratio: '1 : 1.5 : 3', fckMpa: 20, fckPsi: 2900, cementBagsPerM3: 8.0, sandCftPerM3: 14.7, stoneCftPerM3: 29.4, wcRatio: '0.45 - 0.50' },
  { grade: 'M25', ratio: '1 : 1 : 2', fckMpa: 25, fckPsi: 3625, cementBagsPerM3: 11.0, sandCftPerM3: 13.5, stoneCftPerM3: 27.0, wcRatio: '0.40 - 0.45' },
  { grade: 'M30', ratio: '1 : 0.75 : 1.5', fckMpa: 30, fckPsi: 4350, cementBagsPerM3: 13.6, sandCftPerM3: 12.5, stoneCftPerM3: 25.0, wcRatio: '0.38 - 0.42' },
];

interface MaterialDensity {
  material: string;
  knM3: number;
  kgM3: number;
  lbFt3: number;
  notes: string;
}

const MATERIAL_DENSITIES: MaterialDensity[] = [
  { material: 'Reinforced Cement Concrete (RCC)', knM3: 24.0, kgM3: 2400, lbFt3: 150, notes: 'Includes 1–2% standard structural rebar' },
  { material: 'Plain Cement Concrete (PCC)', knM3: 23.0, kgM3: 2300, lbFt3: 144, notes: 'Lean concrete / sub-base without steel' },
  { material: 'Traditional Clay Brick Masonry', knM3: 19.2, kgM3: 1920, lbFt3: 120, notes: '1:6 or 1:4 cement-sand mortar joints' },
  { material: 'Structural Reinforcing Steel', knM3: 78.5, kgM3: 7850, lbFt3: 490, notes: 'Deformed high-strength rebar (BS 4449)' },
  { material: 'Portland Cement (Bulk / Loose)', knM3: 14.4, kgM3: 1440, lbFt3: 90, notes: 'Standard bag = 50 kg (approx 1.25 CFT)' },
  { material: 'Coarse River Sand (Dry)', knM3: 16.0, kgM3: 1600, lbFt3: 100, notes: 'FM 2.2 to 2.8 concrete fine aggregate' },
  { material: 'Crushed Stone Aggregate', knM3: 16.5, kgM3: 1650, lbFt3: 103, notes: 'Graded 20mm down crushed granite/basalt' },
  { material: 'Pure Water (4°C standard)', knM3: 9.81, kgM3: 1000, lbFt3: 62.4, notes: 'Used for hydrostatic pressure & flow' },
];

export const QuickReferencePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReferenceTab>('rebar');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <section className="border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] rounded-md shadow-xs overflow-hidden">
      {/* HEADER WITH TABS */}
      <div className="px-3.5 py-2.5 bg-[var(--md-sys-color-surface-container)] border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
            <BookOpen className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Field Engineering Reference Manual</span>
          </div>

          {/* Sub-tabs */}
          <div className="hidden sm:flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('rebar')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'rebar'
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                  : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]'
              }`}
            >
              Rebar Table (8–32mm)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('concrete')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'concrete'
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                  : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]'
              }`}
            >
              Concrete Mixes &amp; 1.54 Factor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('densities')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'densities'
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                  : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]'
              }`}
            >
              Unit Weights &amp; Densities
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface)] text-xs font-mono flex items-center gap-1 cursor-pointer"
        >
          <span className="text-[10px] hidden sm:inline">{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* MOBILE TAB ROW */}
      {isExpanded && (
        <div className="sm:hidden px-3 py-1.5 bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] flex items-center gap-1 overflow-x-auto text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('rebar')}
            className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap ${activeTab === 'rebar' ? 'bg-[var(--md-sys-color-primary)] text-white font-bold' : 'text-slate-400'}`}
          >
            Rebars
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('concrete')}
            className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap ${activeTab === 'concrete' ? 'bg-[var(--md-sys-color-primary)] text-white font-bold' : 'text-slate-400'}`}
          >
            Mix Ratios
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('densities')}
            className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap ${activeTab === 'densities' ? 'bg-[var(--md-sys-color-primary)] text-white font-bold' : 'text-slate-400'}`}
          >
            Unit Weights
          </button>
        </div>
      )}

      {/* CONTENT AREA */}
      {isExpanded && (
        <div className="p-3 overflow-x-auto custom-scrollbar">
          {activeTab === 'rebar' && (
            <div className="space-y-1.5">
              <table className="w-full text-left text-xs font-mono tabular-nums divide-y divide-[var(--md-sys-color-outline-variant)]/60">
                <thead className="text-[9px] uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] font-bold">
                  <tr>
                    <th className="py-2 px-2.5">Bar Dia (d)</th>
                    <th className="py-2 px-2.5">Cross-Section Area (As)</th>
                    <th className="py-2 px-2.5">Unit Wt (kg/m) [d²/162.2]</th>
                    <th className="py-2 px-2.5">Unit Wt (lb/ft)</th>
                    <th className="py-2 px-2.5">Perimeter</th>
                    <th className="py-2 px-2.5">Tension Lap (40d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
                  {REBAR_TABLE.map((row) => (
                    <tr key={row.diaMm} className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors">
                      <td className="py-1.5 px-2.5 font-bold text-[var(--md-sys-color-primary)]">
                        {row.diaMm} mm (Ø{row.diaMm})
                      </td>
                      <td className="py-1.5 px-2.5 text-[var(--md-sys-color-on-surface)]">
                        {row.areaMm2} mm²
                      </td>
                      <td className="py-1.5 px-2.5 text-[var(--md-sys-color-on-surface)] font-semibold">
                        {row.weightKgM} kg/m
                      </td>
                      <td className="py-1.5 px-2.5 text-[var(--md-sys-color-on-surface-variant)]">
                        {row.weightLbFt} lb/ft
                      </td>
                      <td className="py-1.5 px-2.5 text-[var(--md-sys-color-on-surface-variant)]">
                        {row.perimeterMm} mm
                      </td>
                      <td className="py-1.5 px-2.5 text-amber-500 font-medium">
                        {row.lap40dMm} mm ({row.lap40dMm / 1000} m)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] pt-1 flex items-center justify-between">
                <span>BS 8666 / IS 1786 Standard · Unit weight formula: w = d² / 162.196 kg/m</span>
                <span className="text-[var(--md-sys-color-primary)]">Density of steel: 7,850 kg/m³</span>
              </div>
            </div>
          )}

          {activeTab === 'concrete' && (
            <div className="space-y-1.5">
              <table className="w-full text-left text-xs font-mono tabular-nums divide-y divide-[var(--md-sys-color-outline-variant)]/60">
                <thead className="text-[9px] uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] font-bold">
                  <tr>
                    <th className="py-2 px-2.5">Concrete Grade</th>
                    <th className="py-2 px-2.5">Nominal Ratio (C:S:Agg)</th>
                    <th className="py-2 px-2.5">28-Day Strength (f&apos;ck)</th>
                    <th className="py-2 px-2.5">Cement Demand (Bags/m³)</th>
                    <th className="py-2 px-2.5">Sand (CFT/m³)</th>
                    <th className="py-2 px-2.5">Stone (CFT/m³)</th>
                    <th className="py-2 px-2.5">w/c Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
                  {CONCRETE_MIX_TABLE.map((row) => (
                    <tr key={row.grade} className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors">
                      <td className="py-1.5 px-2.5 font-bold text-[var(--md-sys-color-primary)]">
                        {row.grade}
                      </td>
                      <td className="py-1.5 px-2.5 font-semibold text-[var(--md-sys-color-on-surface)]">
                        {row.ratio}
                      </td>
                      <td className="py-1.5 px-2.5 text-[var(--md-sys-color-on-surface)]">
                        {row.fckMpa} MPa ({row.fckPsi} psi)
                      </td>
                      <td className="py-1.5 px-2.5 text-emerald-500 font-bold">
                        {row.cementBagsPerM3} bags
                      </td>
                      <td className="py-1.5 px-2.5 text-[var(--md-sys-color-on-surface-variant)]">
                        {row.sandCftPerM3} CFT
                      </td>
                      <td className="py-1.5 px-2.5 text-[var(--md-sys-color-on-surface-variant)]">
                        {row.stoneCftPerM3} CFT
                      </td>
                      <td className="py-1.5 px-2.5 text-amber-500">
                        {row.wcRatio}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] pt-1 flex items-center justify-between">
                <span>Dry Volume Expansion Factor: <strong>1.54 × Wet RCC Volume</strong> (accounts for aggregate voids and shrinkage)</span>
                <span className="text-emerald-500 font-semibold">1 Bag = 50 kg = 1.25 CFT</span>
              </div>
            </div>
          )}

          {activeTab === 'densities' && (
            <div className="space-y-1.5">
              <table className="w-full text-left text-xs font-mono tabular-nums divide-y divide-[var(--md-sys-color-outline-variant)]/60">
                <thead className="text-[9px] uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] font-bold">
                  <tr>
                    <th className="py-2 px-2.5">Civil Material</th>
                    <th className="py-2 px-2.5">Unit Weight (kN/m³)</th>
                    <th className="py-2 px-2.5">Density (kg/m³)</th>
                    <th className="py-2 px-2.5">Imperial (lb/ft³)</th>
                    <th className="py-2 px-2.5">Engineering Application &amp; Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
                  {MATERIAL_DENSITIES.map((row) => (
                    <tr key={row.material} className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors">
                      <td className="py-1.5 px-2.5 font-bold text-[var(--md-sys-color-on-surface)]">
                        {row.material}
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-[var(--md-sys-color-primary)]">
                        {row.knM3.toFixed(2)} kN/m³
                      </td>
                      <td className="py-1.5 px-2.5 text-[var(--md-sys-color-on-surface)]">
                        {row.kgM3.toLocaleString()} kg/m³
                      </td>
                      <td className="py-1.5 px-2.5 text-amber-500 font-medium">
                        {row.lbFt3} lb/ft³ (pcf)
                      </td>
                      <td className="py-1.5 px-2.5 text-[var(--md-sys-color-on-surface-variant)] text-[11px]">
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] pt-1 flex items-center justify-between">
                <span>Governing Code: IS 875 (Part 1) / BNBC 2020 Chapter 2 / ACI 318 Dead Load Criteria</span>
                <span className="text-[var(--md-sys-color-primary)]">1 kN/m³ = 6.3658 lb/ft³</span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
