import React from 'react';
import {
  ArrowRightLeft,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Hammer,
  Shovel,
  Boxes,
  Grid,
  CheckCircle2,
} from 'lucide-react';
import { EngineeringModuleId, CivilWorkspace } from '../types/civil';

interface WorkflowCrossLinkBannerProps {
  activeModule: EngineeringModuleId;
  activeWorkspace: CivilWorkspace;
  onTransferBbsToBoq: () => void;
  onTransferBearingToFootingAndPit: () => void;
  onTransferMixToMaterials: () => void;
  onTransferMaterialsToBoq: () => void;
  onTransferEarthworkToBoq: () => void;
  onApplyRateToBoq: () => void;
  bbsSteelWeightKg?: number;
  bearingFootingWidthM?: number;
  bearingEmbedmentDepthM?: number;
  mixBatchVolumeM3?: number;
  matConcreteVolumeM3?: number;
  earthworkBankVolumeM3?: number;
  rateAnalysisUnitRate?: number;
  currencySymbol: string;
}

export const WorkflowCrossLinkBanner: React.FC<WorkflowCrossLinkBannerProps> = ({
  activeModule,
  activeWorkspace,
  onTransferBbsToBoq,
  onTransferBearingToFootingAndPit,
  onTransferMixToMaterials,
  onTransferMaterialsToBoq,
  onTransferEarthworkToBoq,
  onApplyRateToBoq,
  bbsSteelWeightKg,
  bearingFootingWidthM,
  bearingEmbedmentDepthM,
  mixBatchVolumeM3,
  matConcreteVolumeM3,
  earthworkBankVolumeM3,
  rateAnalysisUnitRate,
  currencySymbol,
}) => {
  // Render contextual cross-linking action based on active module
  if (activeModule === 'rebar-bbs' && bbsSteelWeightKg && bbsSteelWeightKg > 0) {
    return (
      <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-transparent border border-blue-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Rebar Schedule → BOQ Takeoff</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                Continuity
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Transfer <strong>{bbsSteelWeightKg.toLocaleString()} kg</strong> calculated rebar directly into Bill of Quantities Item 4.01.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferBbsToBoq}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Send Rebar to BOQ</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  if (activeModule === 'bearing-capacity' && bearingFootingWidthM && bearingEmbedmentDepthM) {
    return (
      <div className="bg-gradient-to-r from-amber-900/10 via-orange-900/10 to-transparent border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-600/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Soil Bearing → Footing BBS & Excavation</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded">
                Sync Dimensions
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Sync Footing Width (<strong>{bearingFootingWidthM}m</strong>) & Depth (<strong>{bearingEmbedmentDepthM}m</strong>) to Rebar BBS & Pit Excavation.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferBearingToFootingAndPit}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
        >
          <Hammer className="w-3.5 h-3.5" />
          <span>Sync BBS & Pit Pit</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  if (activeModule === 'concrete-mix' && mixBatchVolumeM3 && mixBatchVolumeM3 > 0) {
    return (
      <div className="bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-transparent border border-teal-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: ACI 211 Mix → Material Estimator</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded">
                Batch Transfer
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Transfer <strong>{mixBatchVolumeM3} m³</strong> batch volume and calculated mix proportions to Concrete Technology module.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferMixToMaterials}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Send to Materials</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  if (activeModule === 'concrete-materials' && matConcreteVolumeM3 && matConcreteVolumeM3 > 0) {
    return (
      <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-transparent border border-purple-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Concrete Volume → BOQ Takeoff</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded">
                Takeoff Sync
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Insert <strong>{matConcreteVolumeM3} m³</strong> casting concrete into BOQ Superstructure schedule.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferMaterialsToBoq}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Transfer to BOQ</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  if (activeModule === 'earthwork-alignment' && earthworkBankVolumeM3 && earthworkBankVolumeM3 > 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-900/10 via-green-900/10 to-transparent border border-emerald-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Excavation Volume → BOQ Substructure</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
                Earthwork Takeoff
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Add <strong>{earthworkBankVolumeM3.toLocaleString()} m³</strong> excavation to Substructure BOQ schedule.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferEarthworkToBoq}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
        >
          <Shovel className="w-3.5 h-3.5" />
          <span>Add Earthwork to BOQ</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  if (activeModule === 'rate-analysis' && rateAnalysisUnitRate && rateAnalysisUnitRate > 0) {
    return (
      <div className="bg-gradient-to-r from-indigo-900/10 via-blue-900/10 to-transparent border border-indigo-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Rate Analysis → BOQ Item Rates</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded">
                Rate Sync
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Apply composite rate of <strong>{currencySymbol} {rateAnalysisUnitRate.toFixed(2)}/m³</strong> to matching BOQ takeoff items.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onApplyRateToBoq}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Apply Rate to BOQ</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  return null;
};
