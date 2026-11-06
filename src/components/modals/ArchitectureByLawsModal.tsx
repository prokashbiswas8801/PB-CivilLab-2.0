import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  Layers,
  Droplets,
  Building,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { FarMgcCalculator } from '../calculators/architecture/FarMgcCalculator';
import { StaircaseDesigner } from '../calculators/architecture/StaircaseDesigner';
import { BuildingServicesSizer } from '../calculators/architecture/BuildingServicesSizer';
import { AboutThisTool, AboutThisToolButton } from '../ui';
import {
  ArchitectureParameters,
  TakeoffLineItem,
  RebarBBSParameters,
  FarMgcParameters,
  StaircaseParameters,
  WaterTankParameters,
  SepticTankParameters,
} from '../../types/civil';
import { createDefaultArchitectureParameters } from '../../utils/storage';

export type ArchitectureTab = 'far' | 'staircase' | 'watertank' | 'septictank';

export interface ArchitectureByLawsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ArchitectureTab;
  architecture?: ArchitectureParameters;
  onUpdateArchitecture?: (updater: (prev: ArchitectureParameters) => ArchitectureParameters) => void;
  onSendTankToBOQ?: (items: TakeoffLineItem[]) => void;
  onSendStaircaseToRebar?: (stairParams: Partial<RebarBBSParameters>) => void;
}

export const ArchitectureByLawsModal: React.FC<ArchitectureByLawsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'far',
  architecture,
  onUpdateArchitecture,
  onSendTankToBOQ,
  onSendStaircaseToRebar,
}) => {
  const [activeTab, setActiveTab] = useState<ArchitectureTab>(initialTab);
  const [tankSentNotice, setTankSentNotice] = useState<boolean>(false);
  const [stairSentNotice, setStairSentNotice] = useState<boolean>(false);

  // Active architecture snapshot with clean fallback
  const arch: ArchitectureParameters = architecture || createDefaultArchitectureParameters();

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const handleUpdateFar = (farMgc: FarMgcParameters) => {
    onUpdateArchitecture?.((prev) => ({ ...prev, farMgc }));
  };

  const handleUpdateStair = (staircase: StaircaseParameters) => {
    onUpdateArchitecture?.((prev) => ({ ...prev, staircase }));
  };

  const handleUpdateWater = (waterTank: WaterTankParameters) => {
    onUpdateArchitecture?.((prev) => ({ ...prev, waterTank }));
  };

  const handleUpdateSeptic = (septicTank: SepticTankParameters) => {
    onUpdateArchitecture?.((prev) => ({ ...prev, septicTank }));
  };

  const handleDirectSendTankToBOQ = () => {
    if (!onSendTankToBOQ) return;
    const wt = arch.waterTank;
    const st = arch.septicTank;

    // 1. Water calculations
    const totalUsers =
      wt.calcMode === 'building'
        ? wt.numFloors * wt.unitsPerFloor * wt.personsPerUnit + wt.floatingPopulation
        : wt.directOccupants + wt.floatingPopulation;
    const dailyDomesticL = totalUsers * wt.lpcd * wt.storageDays;
    const ugwrDomesticL = (dailyDomesticL * wt.ugwrSharePercent) / 100;
    const ugwrTotalL = ugwrDomesticL + wt.fireReserveL;
    const ugwrTotalM3 = ugwrTotalL / 1000;
    const ugwrSurfaceAreaM2 = ugwrTotalM3 / Math.max(0.5, wt.ugwrWaterDepthM);
    const ugwrWidthM = Math.max(1.5, Math.sqrt(ugwrSurfaceAreaM2 / Math.max(0.5, wt.ugwrLwRatio)));
    const ugwrLengthM = ugwrSurfaceAreaM2 / ugwrWidthM;
    const ugwrTotalHeightM = wt.ugwrWaterDepthM + 0.3;

    const ohtTotalL = Math.max(0, dailyDomesticL - ugwrDomesticL);
    const ohtTotalM3 = ohtTotalL / 1000;
    const ohtSurfaceAreaM2 = ohtTotalM3 / Math.max(0.5, wt.ohtWaterDepthM);
    const ohtWidthM = Math.max(1.2, Math.sqrt(ohtSurfaceAreaM2 / Math.max(0.5, wt.ohtLwRatio)));
    const ohtLengthM = ohtSurfaceAreaM2 / ohtWidthM;
    const ohtTotalHeightM = wt.ohtWaterDepthM + 0.3;

    // 2. Septic calculations
    const dailySewageL = st.septicUsers * st.sewageRateLpcd;
    const liquidRetentionM3 = (dailySewageL / 1000) * (st.detentionHours / 24);
    const sludgeVolumeM3 = st.septicUsers * 0.07 * st.desludgingYears;
    const totalSepticVolumeM3 = liquidRetentionM3 + sludgeVolumeM3;
    const surfaceAreaM2 = totalSepticVolumeM3 / Math.max(0.5, st.septicDepthM);
    const tankWidthM = Math.max(1.0, Math.sqrt(surfaceAreaM2 / Math.max(0.5, st.septicLwRatio)));
    const tankLengthM = surfaceAreaM2 / tankWidthM;
    const totalTankHeightM = st.septicDepthM + 0.35;

    const requiredAbsorptionAreaM2 = dailySewageL / Math.max(1, st.soilPercolationRate);
    const soakPitEffectiveDepthM = Math.max(
      2.0,
      requiredAbsorptionAreaM2 / (Math.PI * Math.max(0.5, st.soakPitDiaM))
    );
    const soakPitTotalDepthM = soakPitEffectiveDepthM + 0.5;

    const items: TakeoffLineItem[] = [
      {
        id: `takeoff-ugwr-${Date.now().toString().slice(-6)}`,
        itemNo: '210.01',
        description: `RCC (1:1.5:3) with waterproofing in Underground Water Reservoir (UGWR ${Math.round(ugwrTotalL).toLocaleString()}L - ${ugwrLengthM.toFixed(1)}m x ${ugwrWidthM.toFixed(1)}m x ${ugwrTotalHeightM.toFixed(1)}m) Base, Walls & Roof`,
        category: 'substructure',
        numberOfMembers: 1,
        lengthM: Number(ugwrLengthM.toFixed(2)),
        widthM: Number(ugwrWidthM.toFixed(2)),
        heightM: Number(ugwrTotalHeightM.toFixed(2)),
        deductionQty: 0,
        unit: 'm3',
        wastagePercent: 3.0,
        unitRate: 14500,
      },
      {
        id: `takeoff-oht-${Date.now().toString().slice(-6)}`,
        itemNo: '210.02',
        description: `RCC (1:1.5:3) with waterproofing in Overhead Water Tank (OHT ${Math.round(ohtTotalL).toLocaleString()}L - ${ohtLengthM.toFixed(1)}m x ${ohtWidthM.toFixed(1)}m x ${ohtTotalHeightM.toFixed(1)}m) Base, Walls & Roof Slab`,
        category: 'superstructure',
        numberOfMembers: 1,
        lengthM: Number(ohtLengthM.toFixed(2)),
        widthM: Number(ohtWidthM.toFixed(2)),
        heightM: Number(ohtTotalHeightM.toFixed(2)),
        deductionQty: 0,
        unit: 'm3',
        wastagePercent: 3.0,
        unitRate: 16500,
      },
      {
        id: `takeoff-septic-${Date.now().toString().slice(-6)}`,
        itemNo: '220.01',
        description: `First Class Brickwork (1:4 cement-sand) in Septic Tank (${Math.round(totalSepticVolumeM3 * 1000).toLocaleString()}L - ${tankLengthM.toFixed(1)}m x ${tankWidthM.toFixed(1)}m x ${totalTankHeightM.toFixed(1)}m) with plaster & neat cement finish`,
        category: 'substructure',
        numberOfMembers: 1,
        lengthM: Number(tankLengthM.toFixed(2)),
        widthM: Number(tankWidthM.toFixed(2)),
        heightM: Number(totalTankHeightM.toFixed(2)),
        deductionQty: 0,
        unit: 'm3',
        wastagePercent: 4.0,
        unitRate: 8500,
      },
      {
        id: `takeoff-soakpit-${Date.now().toString().slice(-6)}`,
        itemNo: '220.02',
        description: `Honeycomb Brickwork & Gravel Packing in Absorption Soak Well (Dia ${st.soakPitDiaM.toFixed(1)}m x Depth ${soakPitTotalDepthM.toFixed(1)}m)`,
        category: 'substructure',
        numberOfMembers: 1,
        lengthM: Number(st.soakPitDiaM.toFixed(2)),
        widthM: Number(st.soakPitDiaM.toFixed(2)),
        heightM: Number(soakPitTotalDepthM.toFixed(2)),
        deductionQty: 0,
        unit: 'm3',
        wastagePercent: 5.0,
        unitRate: 7800,
      },
    ];

    onSendTankToBOQ(items);
    setTankSentNotice(true);
    setTimeout(() => setTankSentNotice(false), 4000);
  };

  const handleDirectSendStaircaseToRebar = () => {
    if (!onSendStaircaseToRebar) return;
    const sc = arch.staircase;
    const targetRisers = Math.max(3, Math.round(sc.floorHeightMm / Math.max(50, sc.preferredRiserMm)));
    const actualRiserMm = sc.floorHeightMm / targetRisers;
    const risersFlight1 = Math.ceil(targetRisers / 2);
    const treadsFlight1 = Math.max(1, risersFlight1 - 1);
    const goingLengthMm = treadsFlight1 * sc.preferredTreadMm;

    onSendStaircaseToRebar({
      stairGoingM: Number((goingLengthMm / 1000).toFixed(2)),
      stairTotalRiseM: Number((sc.floorHeightMm / 1000).toFixed(2)),
      waistSlabThicknessMm: sc.waistSlabMm,
      riserMm: Math.round(actualRiserMm),
      treadMm: sc.preferredTreadMm,
      landingLengthM: Number((sc.landingWidthMm / 1000).toFixed(2)),
    });
    setStairSentNotice(true);
    setTimeout(() => setStairSentNotice(false), 4000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[92vh] bg-[var(--md-sys-color-surface,#ffffff)] dark:bg-slate-900 border border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 flex items-center justify-between bg-[var(--md-sys-color-surface-container-lowest,#fafafa)] dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface,#0f172a)] dark:text-white">
                    Architecture, Space Planning &amp; Building Services Suite
                  </h2>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant,#64748b)] dark:text-slate-400 font-mono">
                    BNBC 2020 · FAR &amp; MGC Setbacks · Staircase Ergonomics · UGWR &amp; OHT · Septic Tank &amp; Soak Well
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AboutThisToolButton
                  toolId={`architecture-${activeTab}`}
                  onClick={() => {
                    document.getElementById(`arch-doc-${activeTab}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-2 border-b border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 bg-[var(--md-sys-color-surface-container-low,#f8fafc)] dark:bg-slate-900/60 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('far')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'far'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>FAR, MGC &amp; Setbacks</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('staircase')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'staircase'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Staircase Geometry &amp; Ergonomics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('watertank')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'watertank'
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Droplets className="w-4 h-4" />
                <span>Water Reservoirs (UGWR &amp; OHT)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('septictank')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'septictank'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Septic Tank &amp; Soak Well</span>
              </button>
            </div>

            {/* Quick Action Toolbar Linking Architecture to BOQ & Rebar BBS */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  Cross-Module Estimation Workflows:
                </span>
                {tankSentNotice && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tank Quantities Sent to BOQ
                  </span>
                )}
                {stairSentNotice && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Staircase Sent to Rebar BBS
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectSendTankToBOQ}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Compute UGWR, OHT, Septic Tank & Soak Well concrete and brickwork volumes and send to BOQ"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Send Tank Concrete &amp; Brickwork to BOQ</span>
                </button>

                <button
                  type="button"
                  onClick={handleDirectSendStaircaseToRebar}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Send Staircase waist slab thickness, riser, tread, and flight dimensions directly to Rebar BBS"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Send Staircase to Rebar BBS</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
              {activeTab === 'far' && (
                <FarMgcCalculator
                  initialValues={arch.farMgc}
                  onChange={handleUpdateFar}
                />
              )}

              {activeTab === 'staircase' && (
                <StaircaseDesigner
                  initialValues={arch.staircase}
                  onChange={handleUpdateStair}
                  onSendToRebarBbs={onSendStaircaseToRebar}
                />
              )}

              {activeTab === 'watertank' && (
                <BuildingServicesSizer
                  initialTab="water-reservoirs"
                  initialWaterValues={arch.waterTank}
                  initialSepticValues={arch.septicTank}
                  onWaterChange={handleUpdateWater}
                  onSepticChange={handleUpdateSeptic}
                  onSendToBOQ={onSendTankToBOQ}
                />
              )}

              {activeTab === 'septictank' && (
                <BuildingServicesSizer
                  initialTab="septic-system"
                  initialWaterValues={arch.waterTank}
                  initialSepticValues={arch.septicTank}
                  onWaterChange={handleUpdateWater}
                  onSepticChange={handleUpdateSeptic}
                  onSendToBOQ={onSendTankToBOQ}
                />
              )}

              {/* Dedicated "About This Tool" Documentation Section */}
              <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <AboutThisTool
                  key={`arch-doc-${activeTab}`}
                  toolId={`architecture-${activeTab}`}
                  id={`arch-doc-${activeTab}`}
                  defaultExpanded={false}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

