import React from 'react';
import {
  ArrowRightLeft,
  ArrowRight,
  FileSpreadsheet,
  Hammer,
  Shovel,
  Boxes,
  Layers,
  HardHat,
  SlidersHorizontal,
  Droplets,
} from 'lucide-react';
import { EngineeringModuleId, CivilWorkspace } from '../types/civil';

interface WorkflowCrossLinkBannerProps {
  activeModule: EngineeringModuleId;
  activeWorkspace: CivilWorkspace;
  onTransferBbsToBoq: () => void;
  onTransferBearingToFootingAndPit: () => void;
  onTransferBearingToPile?: () => void;
  onTransferMixToMaterials: () => void;
  onTransferMixToBoq?: () => void;
  onTransferMaterialsToBoq: () => void;
  onTransferEarthworkToBoq: () => void;
  onApplyRateToBoq: () => void;
  onTransferContinuousBeamToRebar?: () => void;
  onTransferBeamToRebar?: () => void;
  onTransferRcColumnToRebar?: () => void;
  onTransferMasonryToBoq?: () => void;
  onTransferPileToBoq?: () => void;
  onTransferSurveyingToBoq?: () => void;
  onTransferPipeToBoq?: () => void;
  onSyncBoqToInventory?: () => void;
  onSyncMixToCubeTests?: () => void;
  onGenerateRequisitionSlip?: (sourceModule: 'concrete-materials' | 'rebar-bbs' | 'masonry-finishes') => void;
  bearingFailed?: boolean;
  bbsSteelWeightKg?: number;
  bearingFootingWidthM?: number;
  bearingEmbedmentDepthM?: number;
  bearingAppliedLoadKn?: number;
  beamSpanM?: number;
  beamMaxMomentKnm?: number;
  rcColWidthMm?: number;
  rcColDepthMm?: number;
  rcColBarCount?: number;
  rcColBarDiaMm?: number;
  masonryNetVolumeM3?: number;
  masonryBricksCount?: number;
  pileTotalCount?: number;
  pileConcreteVolumeM3?: number;
  surveyingLandAreaSqM?: number;
  mixBatchVolumeM3?: number;
  matConcreteVolumeM3?: number;
  earthworkBankVolumeM3?: number;
  rateAnalysisUnitRate?: number;
  continuousBeamMaxMomentKnm?: number;
  pipeLengthM?: number;
  pipeDiameterMm?: number;
  pipeMaterial?: string;
  currencySymbol: string;
}

export const WorkflowCrossLinkBanner: React.FC<WorkflowCrossLinkBannerProps> = ({
  activeModule,
  activeWorkspace,
  onTransferBbsToBoq,
  onTransferBearingToFootingAndPit,
  onTransferBearingToPile,
  onTransferMixToMaterials,
  onTransferMixToBoq,
  onTransferMaterialsToBoq,
  onTransferEarthworkToBoq,
  onApplyRateToBoq,
  onTransferContinuousBeamToRebar,
  onTransferBeamToRebar,
  onTransferRcColumnToRebar,
  onTransferMasonryToBoq,
  onTransferPileToBoq,
  onTransferSurveyingToBoq,
  onTransferPipeToBoq,
  onSyncBoqToInventory,
  onSyncMixToCubeTests,
  onGenerateRequisitionSlip,
  bearingFailed,
  bbsSteelWeightKg,
  bearingFootingWidthM,
  bearingEmbedmentDepthM,
  bearingAppliedLoadKn,
  beamSpanM,
  beamMaxMomentKnm,
  rcColWidthMm,
  rcColDepthMm,
  rcColBarCount,
  rcColBarDiaMm,
  masonryNetVolumeM3,
  masonryBricksCount,
  pileTotalCount,
  pileConcreteVolumeM3,
  surveyingLandAreaSqM,
  mixBatchVolumeM3,
  matConcreteVolumeM3,
  earthworkBankVolumeM3,
  rateAnalysisUnitRate,
  continuousBeamMaxMomentKnm,
  pipeLengthM,
  pipeDiameterMm,
  pipeMaterial,
  currencySymbol,
}) => {
  // 1. Rebar BBS -> BOQ Schedule
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
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                Continuity
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Transfer <strong>{bbsSteelWeightKg.toLocaleString()} kg</strong> calculated rebar directly into Bill of Quantities Item 4.01.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGenerateRequisitionSlip && (
            <button
              type="button"
              onClick={() => onGenerateRequisitionSlip('rebar-bbs')}
              className="touch-target-48 px-3.5 py-1.5 rounded-lg border border-blue-500/50 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-blue-500/10 font-semibold cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              title="Package rebar tonnage by bar diameter into a pending Site Requisition Indent (SM-02)"
            >
              <Boxes className="w-3.5 h-3.5 text-blue-500" />
              <span>Generate Material Requisition Slip (SM-02)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onTransferBbsToBoq}
            className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Send Rebar to BOQ</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Bearing Capacity -> Footing Rebar BBS & Excavation & Deep Foundation
  if (activeModule === 'bearing-capacity' && bearingFootingWidthM && bearingEmbedmentDepthM) {
    // If shallow bearing has failed (FS < 3.0 or DCR > 1.0), prioritize Deep Pile Foundation switch!
    if (bearingFailed && onTransferBearingToPile) {
      return (
        <div className="bg-gradient-to-r from-rose-950/30 via-red-950/20 to-transparent border-2 border-rose-500/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-rose-500 flex items-center gap-2">
                <span>⚠️ Shallow Bearing Capacity Exceeded (q_app &gt; q_all)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded uppercase">
                  Switch to Deep Foundation
                </span>
              </div>
              <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
                Column Load <strong>{bearingAppliedLoadKn || activeWorkspace.bearing.appliedColumnLoadKn} kN</strong> exceeds soil allowable bearing capacity. Switch to Bored Cast-in-Situ Pile Foundation to transfer loads to competent bearing strata.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTransferBearingToPile}
              className="touch-target-48 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <Layers className="w-4 h-4" />
              <span>Switch to Deep Pile Foundation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-amber-900/10 via-orange-900/10 to-transparent border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-600/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <HardHat className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Soil Bearing → Substructure Modules</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded">
                Sync Geotech
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Footing <strong>{bearingFootingWidthM}m × {bearingFootingWidthM}m</strong>, Embedment <strong>{bearingEmbedmentDepthM}m</strong>, Working Load <strong>{bearingAppliedLoadKn || activeWorkspace.bearing.appliedColumnLoadKn} kN</strong>. Includes 300mm working offset &amp; 150mm bedding.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onTransferBearingToPile && (
            <button
              type="button"
              onClick={onTransferBearingToPile}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-amber-500/10 font-semibold cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              title="Pass column load and geotechnical properties to Deep Pile Foundation"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Pass to Pile Capacity</span>
            </button>
          )}

          <button
            type="button"
            onClick={onTransferBearingToFootingAndPit}
            className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Sync Footing BBS &amp; Pit</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    );
  }

  // 3. ACI 211 Mix -> Concrete Materials & BOQ
  if (activeModule === 'concrete-mix' && mixBatchVolumeM3 && mixBatchVolumeM3 > 0) {
    return (
      <div className="bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-transparent border border-teal-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: ACI 211 Mix Proportions → BOQ Takeoff Schedule</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded">
                Auto-Sync
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Sync <strong>{mixBatchVolumeM3} m³</strong> concrete, cement bags, fine sand, coarse stone, and admixtures directly into BOQ Takeoff.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onTransferMixToBoq && (
            <button
              type="button"
              onClick={onTransferMixToBoq}
              className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Auto-Sync to BOQ</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}
          {onSyncMixToCubeTests && (
            <button
              type="button"
              onClick={onSyncMixToCubeTests}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-teal-500/40 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-teal-500/10 font-semibold cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              title="Log concrete pour and target f'c into Site Cube Test Register"
            >
              <Layers className="w-3.5 h-3.5 text-teal-500" />
              <span>Sync to Cube Tests</span>
            </button>
          )}
          <button
            type="button"
            onClick={onTransferMixToMaterials}
            className="touch-target-48 px-3 py-1.5 rounded-lg border border-teal-500/40 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-teal-500/10 font-semibold cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Boxes className="w-3.5 h-3.5 text-teal-500" />
            <span>Send to Materials</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Concrete Materials -> BOQ Schedule
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
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded">
                Takeoff Sync
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Insert <strong>{matConcreteVolumeM3} m³</strong> casting concrete into BOQ Superstructure schedule.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGenerateRequisitionSlip && (
            <button
              type="button"
              onClick={() => onGenerateRequisitionSlip('concrete-materials')}
              className="touch-target-48 px-3.5 py-1.5 rounded-lg border border-purple-500/50 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-purple-500/10 font-semibold cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              title="Package Cement Bags, Sand CFT & Coarse Aggregate CFT into a pending Site Requisition Indent (SM-02)"
            >
              <Boxes className="w-3.5 h-3.5 text-purple-500" />
              <span>Generate Material Requisition Slip (SM-02)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onTransferMaterialsToBoq}
            className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Transfer to BOQ</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    );
  }

  // 5. Earthwork Excavation -> BOQ Substructure
  if (activeModule === 'earthwork-alignment' && earthworkBankVolumeM3 && earthworkBankVolumeM3 > 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-900/10 via-green-900/10 to-transparent border border-emerald-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Shovel className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Excavation Volume → BOQ Substructure</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
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
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <Shovel className="w-3.5 h-3.5" />
          <span>Add Earthwork to BOQ</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  // 6. Rate Analysis -> BOQ Item Rates
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
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded">
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
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Apply Rate to BOQ</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  // 7. Continuous Beam -> Rebar BBS
  if (activeModule === 'continuous-beam' && continuousBeamMaxMomentKnm && continuousBeamMaxMomentKnm > 0 && onTransferContinuousBeamToRebar) {
    return (
      <div className="bg-gradient-to-r from-sky-900/10 via-blue-900/10 to-transparent border border-sky-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Continuous Beam Moment → Rebar BBS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded">
                Flexure Reinforcement
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Pass governing moment <strong>{continuousBeamMaxMomentKnm.toFixed(1)} kN·m</strong> and span dimensions into Beam Rebar BBS design.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferContinuousBeamToRebar}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <Hammer className="w-3.5 h-3.5" />
          <span>Pass to Rebar BBS</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  // 8. Pipe Hydraulics -> BOQ Plumbing Schedule
  if (activeModule === 'pipe-hydraulics' && pipeLengthM && pipeLengthM > 0 && onTransferPipeToBoq) {
    return (
      <div className="bg-gradient-to-r from-cyan-900/10 via-blue-900/10 to-transparent border border-cyan-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Pipe Pipeline → BOQ Plumbing</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded">
                Pipeline Schedule
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Add <strong>{pipeLengthM}m</strong> pipeline ({pipeDiameterMm || 200}mm Ø, {pipeMaterial || 'PVC'}) directly to BOQ Plumbing takeoff.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferPipeToBoq}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Add Pipeline to BOQ</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  // 9. Single Beam Analysis -> Rebar BBS
  if (activeModule === 'beam-analysis' && beamSpanM && beamSpanM > 0 && onTransferBeamToRebar) {
    return (
      <div className="bg-gradient-to-r from-blue-900/10 via-sky-900/10 to-transparent border border-blue-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Beam Flexure Design → Rebar BBS Schedule</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                Beam Reinforcement
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Transfer span (<strong>{beamSpanM}m</strong>) and max moment <strong>{beamMaxMomentKnm ? `${beamMaxMomentKnm.toFixed(1)} kN·m` : '0 kN·m'}</strong> into Beam BBS reinforcement detailing.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferBeamToRebar}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <Hammer className="w-3.5 h-3.5" />
          <span>Pass to Beam Rebar BBS</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  // 10. Masonry & Finishes -> BOQ Estimator
  if (activeModule === 'masonry-finishes' && ((masonryNetVolumeM3 && masonryNetVolumeM3 > 0) || (masonryBricksCount && masonryBricksCount > 0)) && onTransferMasonryToBoq) {
    return (
      <div className="bg-gradient-to-r from-orange-900/10 via-amber-900/10 to-transparent border border-orange-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Masonry Brickwork &amp; Plaster → BOQ Takeoff</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded">
                Takeoff Sync
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Sync <strong>{masonryNetVolumeM3 ? `${masonryNetVolumeM3.toFixed(2)} m³` : ''}</strong> brickwork ({masonryBricksCount || 0} bricks) and wall plaster into BOQ Takeoff Schedule.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGenerateRequisitionSlip && (
            <button
              type="button"
              onClick={() => onGenerateRequisitionSlip('masonry-finishes')}
              className="touch-target-48 px-3.5 py-1.5 rounded-lg border border-orange-500/50 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-orange-500/10 font-semibold cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              title="Package Bricks, Mortar/Plaster Cement Bags & Sand CFT into a pending Site Requisition Indent (SM-02)"
            >
              <Boxes className="w-3.5 h-3.5 text-orange-500" />
              <span>Generate Material Requisition Slip (SM-02)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onTransferMasonryToBoq}
            className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Send Masonry to BOQ</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    );
  }

  // 11. Deep Pile Capacity -> BOQ Substructure
  if (activeModule === 'pile-capacity' && pileConcreteVolumeM3 && pileConcreteVolumeM3 > 0 && onTransferPileToBoq) {
    return (
      <div className="bg-gradient-to-r from-indigo-900/10 via-violet-900/10 to-transparent border border-indigo-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Deep Pile Foundation → BOQ Substructure</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded">
                Pile Substructure
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Transfer <strong>{pileTotalCount || 1} Piles</strong> ({pileConcreteVolumeM3.toFixed(1)} m³ concrete and drilling depth) into Substructure BOQ Schedule.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferPileToBoq}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Send Piles to BOQ</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  // 12. Surveying Suite -> BOQ Site Work
  if (activeModule === 'surveying-suite' && surveyingLandAreaSqM && surveyingLandAreaSqM > 0 && onTransferSurveyingToBoq) {
    return (
      <div className="bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-transparent border border-emerald-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Shovel className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Surveying Site Area → BOQ Site Preparation</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
                Site Works
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Transfer measured site area <strong>{surveyingLandAreaSqM.toFixed(1)} m²</strong> to Site Clearing and Grading in BOQ.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferSurveyingToBoq}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Send Site Area to BOQ</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  // 13. BOQ Estimator -> Site Store Inventory ERP Ceilings
  if (activeModule === 'boq-estimator' && onSyncBoqToInventory && activeWorkspace.boq.items.length > 0) {
    return (
      <div className="bg-gradient-to-r from-blue-900/10 via-teal-900/10 to-transparent border border-blue-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: Design Takeoff → Store Ledger &amp; Inventory ERP</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                ERP Baseline
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Sync total Cement, Sand, Coarse Aggregate, Bricks, and Rebar from design into Store Inventory as project budget ceilings (theoreticalBoqQty).
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSyncBoqToInventory}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Sync Ceilings to Store Ledger</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  // 14. RC Column Design -> Rebar BBS Schedule
  if (activeModule === 'rc-column-design' && onTransferRcColumnToRebar) {
    const colB = rcColWidthMm ?? activeWorkspace.rcColumn?.widthB_Mm ?? 400;
    const colH = rcColDepthMm ?? activeWorkspace.rcColumn?.depthH_Mm ?? 500;
    const colBars = rcColBarCount ?? 10;
    const colDia = rcColBarDiaMm ?? activeWorkspace.rcColumn?.longitudinalBarDiaMm ?? 20;

    return (
      <div className="bg-gradient-to-r from-indigo-900/10 via-blue-900/10 to-transparent border border-indigo-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Hammer className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>One-Click Cross-Link: RC Column Design → Rebar BBS Schedule</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded">
                Column Detailing
              </span>
            </div>
            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] mt-0.5">
              Push <strong>{colB}×{colH} mm</strong> column with <strong>{colBars}-φ{colDia}mm</strong> longitudinal bars and ties directly into Column Rebar BBS.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferRcColumnToRebar}
          className="touch-target-48 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <Hammer className="w-3.5 h-3.5" />
          <span>Sync Column Rebar to BBS Schedule</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    );
  }

  return null;
};
