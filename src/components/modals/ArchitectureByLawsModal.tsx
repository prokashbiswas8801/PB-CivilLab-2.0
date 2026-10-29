import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  Layers,
  Droplets,
  Building,
  CheckCircle2,
  Copy,
  Download,
  Info,
  Maximize2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface ArchitectureByLawsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'far' | 'watertank' | 'septictank';
}

export const ArchitectureByLawsModal: React.FC<ArchitectureByLawsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'far',
}) => {
  const [activeTab, setActiveTab] = useState<'far' | 'watertank' | 'septictank'>(initialTab);
  const [copied, setCopied] = useState(false);

  // --- FAR & Setback State ---
  const [plotAreaSqm, setPlotAreaSqm] = useState(300); // ~4.5 Katha
  const [roadWidthM, setRoadWidthM] = useState(9.14); // 30 ft
  const [frontageM, setFrontageM] = useState(15);
  const [occupancy, setOccupancy] = useState<'residential' | 'commercial' | 'mixed'>('residential');
  const [plotLengthM, setPlotLengthM] = useState(20);

  // FAR Calculation (Based on standard municipal by-laws / BNBC & NBC)
  const mgcPercent = plotAreaSqm <= 200 ? 67.5 : plotAreaSqm <= 350 ? 62.5 : plotAreaSqm <= 500 ? 60 : 55;
  const farRatio =
    roadWidthM < 6
      ? 2.0
      : roadWidthM < 9
      ? occupancy === 'commercial' ? 3.0 : 2.5
      : roadWidthM < 12
      ? occupancy === 'commercial' ? 3.75 : 3.15
      : occupancy === 'commercial' ? 4.5 : 3.75;

  const maxGroundCoverageSqm = (plotAreaSqm * mgcPercent) / 100;
  const maxGrossFloorAreaSqm = plotAreaSqm * farRatio;
  const estimatedFloors = Math.ceil(maxGrossFloorAreaSqm / maxGroundCoverageSqm);

  // Setback requirements (in meters)
  const frontSetbackM = roadWidthM < 9 ? 1.5 : roadWidthM < 12 ? 2.0 : 2.5;
  const rearSetbackM = plotAreaSqm < 250 ? 1.5 : 2.0;
  const sideSetbackM = plotAreaSqm < 250 ? 1.0 : 1.25;

  const allowableBuildingWidth = Math.max(1, frontageM - 2 * sideSetbackM);
  const allowableBuildingLength = Math.max(1, plotLengthM - frontSetbackM - rearSetbackM);
  const allowableFootprintSqm = allowableBuildingWidth * allowableBuildingLength;
  const effectiveFootprintSqm = Math.min(maxGroundCoverageSqm, allowableFootprintSqm);

  // --- Water Tank Sizer State ---
  const [occupants, setOccupants] = useState(30);
  const [lpcd, setLpcd] = useState(135); // Litres Per Capita Daily
  const [storageDays, setStorageDays] = useState(1);
  const [ugwrSharePercent, setUgwrSharePercent] = useState(60);

  const totalDailyDemandL = occupants * lpcd * storageDays;
  const totalWaterM3 = totalDailyDemandL / 1000;
  const ugwrVolumeM3 = (totalWaterM3 * ugwrSharePercent) / 100;
  const ohtVolumeM3 = totalWaterM3 - ugwrVolumeM3;

  // UGWR Dimensions (assuming 2.0m water depth + 0.3m freeboard)
  const ugwrDepthM = 2.0;
  const ugwrAreaM2 = ugwrVolumeM3 / ugwrDepthM;
  const ugwrWidthM = Math.max(1.5, Math.sqrt(ugwrAreaM2 / 1.5));
  const ugwrLengthM = ugwrAreaM2 / ugwrWidthM;

  // OHT Dimensions (assuming 1.6m water depth + 0.3m freeboard)
  const ohtDepthM = 1.6;
  const ohtAreaM2 = ohtVolumeM3 / ohtDepthM;
  const ohtWidthM = Math.max(1.2, Math.sqrt(ohtAreaM2 / 1.3));
  const ohtLengthM = ohtAreaM2 / ohtWidthM;

  // Pump rating (fill OHT in 2 hours)
  const pumpFlowLpm = (ohtVolumeM3 * 1000) / (2 * 60);
  const pumpHp = Math.max(0.75, (pumpFlowLpm * 25) / (4500 * 0.6)); // 25m total head, 60% pump efficiency

  // --- Septic Tank State ---
  const [septicUsers, setSepticUsers] = useState(25);
  const [desludgingYears, setDesludgingYears] = useState(2);
  const [sewageLpcd, setSewageLpcd] = useState(90);

  // Septic volume = Liquid capacity (1 day retention) + Sludge storage (0.07 m3/user/yr)
  const dailySewageM3 = (septicUsers * sewageLpcd) / 1000;
  const sludgeVolumeM3 = septicUsers * 0.07 * desludgingYears;
  const septicTotalVolumeM3 = dailySewageM3 + sludgeVolumeM3;

  const septicLiquidDepthM = 1.5;
  const septicAreaM2 = septicTotalVolumeM3 / septicLiquidDepthM;
  const septicWidthM = Math.max(1.2, Math.sqrt(septicAreaM2 / 2.5)); // L : W = 2.5 : 1
  const septicLengthM = septicAreaM2 / septicWidthM;
  const soakPitDiaM = 1.8;
  const soakPitDepthM = Math.max(2.5, dailySewageM3 / (Math.PI * (soakPitDiaM / 2) * 1.5));

  const handleCopyReport = () => {
    let reportText = '';
    if (activeTab === 'far') {
      reportText = `=== FAR, MGC & SETBACK ASSESSMENT ===
Plot Area: ${plotAreaSqm} m² (~${(plotAreaSqm * 10.7639).toFixed(0)} sq.ft)
Road Width: ${roadWidthM} m | Frontage: ${frontageM} m
Occupancy: ${occupancy.toUpperCase()}
------------------------------------
Permissible FAR: ${farRatio.toFixed(2)}
Max Ground Coverage (MGC): ${mgcPercent}% (${maxGroundCoverageSqm.toFixed(1)} m²)
Max Permissible Gross Floor Area: ${maxGrossFloorAreaSqm.toFixed(1)} m² (~${(maxGrossFloorAreaSqm * 10.7639).toFixed(0)} sq.ft)
Approximate Permissible Floors: ~${estimatedFloors} Floors
------------------------------------
Mandatory Setbacks:
- Front: ${frontSetbackM} m
- Rear: ${rearSetbackM} m
- Sides (Left & Right): ${sideSetbackM} m each
Effective Footprint: ${effectiveFootprintSqm.toFixed(1)} m²`;
    } else if (activeTab === 'watertank') {
      reportText = `=== WATER TANK UGWR & OHT SIZING REPORT ===
Occupants: ${occupants} | Demand: ${lpcd} LPCD | Storage: ${storageDays} Day(s)
Total Daily Demand: ${totalDailyDemandL.toLocaleString()} Liters (${totalWaterM3.toFixed(2)} m³)
------------------------------------
UGWR (Under-Ground Reservoir) [${ugwrSharePercent}%]:
- Volume: ${(ugwrVolumeM3 * 1000).toLocaleString()} Liters (${ugwrVolumeM3.toFixed(2)} m³)
- Clear Dimensions (L × W × H): ${ugwrLengthM.toFixed(2)}m × ${ugwrWidthM.toFixed(2)}m × ${(ugwrDepthM + 0.3).toFixed(2)}m (incl. 0.3m freeboard)
------------------------------------
OHT (Over-Head Tank) [${100 - ugwrSharePercent}%]:
- Volume: ${(ohtVolumeM3 * 1000).toLocaleString()} Liters (${ohtVolumeM3.toFixed(2)} m³)
- Clear Dimensions (L × W × H): ${ohtLengthM.toFixed(2)}m × ${ohtWidthM.toFixed(2)}m × ${(ohtDepthM + 0.3).toFixed(2)}m (incl. 0.3m freeboard)
------------------------------------
Transfer Pump Sizing:
- Flow Rate: ${pumpFlowLpm.toFixed(1)} LPM
- Recommended Motor: ${pumpHp.toFixed(2)} HP (Submersible/Centrifugal)`;
    } else {
      reportText = `=== SEPTIC TANK & SOAK PIT SIZING REPORT ===
Design Users: ${septicUsers} | Desludging Interval: ${desludgingYears} Years
Total Required Volume: ${(septicTotalVolumeM3 * 1000).toLocaleString()} Liters (${septicTotalVolumeM3.toFixed(2)} m³)
------------------------------------
Septic Tank Dimensions (2-Chamber, L:W = 2.5:1):
- Length: ${septicLengthM.toFixed(2)} m
- Width: ${septicWidthM.toFixed(2)} m
- Total Depth: ${(septicLiquidDepthM + 0.3).toFixed(2)} m (1.5m liquid + 0.3m freeboard)
- Chamber 1 (Inlet): ${(septicLengthM * 0.67).toFixed(2)} m | Chamber 2: ${(septicLengthM * 0.33).toFixed(2)} m
------------------------------------
Soak Well / Pit Sizing:
- Internal Diameter: ${soakPitDiaM.toFixed(2)} m
- Recommended Depth: ${soakPitDepthM.toFixed(2)} m with honeycomb brick lining`;
    }

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Architecture &amp; By-Laws Calculator
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  FAR, MGC setbacks, Water Reservoir &amp; Septic Tank engineering sizer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => setActiveTab('far')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
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
              onClick={() => setActiveTab('watertank')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'watertank'
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>Water Tank (UGWR &amp; OHT)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('septictank')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'septictank'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Septic Tank &amp; Soak Pit</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'far' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Inputs */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Plot &amp; Road Parameters
                  </h3>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>Plot Area (m²)</span>
                      <span className="font-mono text-slate-500">{(plotAreaSqm * 10.7639).toFixed(0)} sq.ft</span>
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={plotAreaSqm}
                      onChange={(e) => setPlotAreaSqm(Math.max(50, Number(e.target.value)))}
                      className="w-full text-base px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Road Width (m)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        inputMode="decimal"
                        value={roadWidthM}
                        onChange={(e) => setRoadWidthM(Math.max(3, Number(e.target.value)))}
                        className="w-full text-base px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Frontage (m)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        inputMode="decimal"
                        value={frontageM}
                        onChange={(e) => setFrontageM(Math.max(5, Number(e.target.value)))}
                        className="w-full text-base px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Plot Length / Depth (m)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      value={plotLengthM}
                      onChange={(e) => setPlotLengthM(Math.max(5, Number(e.target.value)))}
                      className="w-full text-base px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Occupancy Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['residential', 'commercial', 'mixed'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setOccupancy(type)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                            occupancy === type
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Outputs & Sketch */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400">Permissible FAR</div>
                      <div className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-1">
                        {farRatio.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Floor Area Ratio</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <div className="text-[11px] font-mono text-blue-700 dark:text-blue-400">Max Ground Coverage</div>
                      <div className="text-2xl font-bold font-mono text-blue-900 dark:text-blue-200 mt-1">
                        {mgcPercent}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{maxGroundCoverageSqm.toFixed(1)} m² max footprint</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">Max Gross Floor Area</div>
                      <div className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200 mt-1">
                        {maxGrossFloorAreaSqm.toFixed(0)} m²
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">~{(maxGrossFloorAreaSqm * 10.7639).toFixed(0)} sq.ft</div>
                    </div>
                  </div>

                  {/* Mandatory Setbacks Card */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Mandatory Clear Setbacks
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-slate-500 block text-[10px]">Front Setback</span>
                        <strong className="text-sm text-slate-900 dark:text-white">{frontSetbackM} m</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-slate-500 block text-[10px]">Rear Setback</span>
                        <strong className="text-sm text-slate-900 dark:text-white">{rearSetbackM} m</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-slate-500 block text-[10px]">Side Setbacks (ea)</span>
                        <strong className="text-sm text-slate-900 dark:text-white">{sideSetbackM} m</strong>
                      </div>
                    </div>
                  </div>

                  {/* 2D Footprint Sketch */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
                    <span className="text-xs font-mono text-slate-400 mb-2">Schematic Plot &amp; Building Envelope</span>
                    <svg viewBox="0 0 300 200" className="w-full max-w-xs h-40">
                      {/* Plot Boundary */}
                      <rect x="20" y="20" width="260" height="160" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />
                      <text x="150" y="15" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">ROADWAY ({roadWidthM}m)</text>

                      {/* Building Footprint */}
                      <rect x="50" y="55" width="200" height="100" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
                      <text x="150" y="105" textAnchor="middle" fill="#d97706" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                        BUILDING FOOTPRINT
                      </text>
                      <text x="150" y="125" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                        {effectiveFootprintSqm.toFixed(1)} m²
                      </text>

                      {/* Dimension labels */}
                      <text x="35" y="110" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">{sideSetbackM}m</text>
                      <text x="265" y="110" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">{sideSetbackM}m</text>
                      <text x="150" y="42" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">Front: {frontSetbackM}m</text>
                      <text x="150" y="172" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">Rear: {rearSetbackM}m</text>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'watertank' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Demand &amp; Capacity Parameters
                  </h3>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Number of Occupants / Users
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={occupants}
                      onChange={(e) => setOccupants(Math.max(1, Number(e.target.value)))}
                      className="w-full text-base px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Per Capita Daily Demand (LPCD)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={lpcd}
                      onChange={(e) => setLpcd(Math.max(45, Number(e.target.value)))}
                      className="w-full text-base px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500">Standard: 135 LPCD (Residential), 45 LPCD (Offices)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Storage Days Factor
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      value={storageDays}
                      onChange={(e) => setStorageDays(Math.max(0.5, Number(e.target.value)))}
                      className="w-full text-base px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>UGWR Allocation</span>
                      <span className="font-mono">{ugwrSharePercent}% / {100 - ugwrSharePercent}% OHT</span>
                    </label>
                    <input
                      type="range"
                      min="40"
                      max="80"
                      value={ugwrSharePercent}
                      onChange={(e) => setUgwrSharePercent(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-cyan-700 dark:text-cyan-400">Total Net Daily Requirement</div>
                      <div className="text-2xl font-black font-mono text-cyan-900 dark:text-cyan-200 mt-0.5">
                        {totalDailyDemandL.toLocaleString()} Litres
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-500">Volumetric Equivalent</div>
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {totalWaterM3.toFixed(2)} m³
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* UGWR Card */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          UGWR (Under-Ground)
                        </strong>
                        <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {(ugwrVolumeM3 * 1000).toLocaleString()} L
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Internal Length:</span>
                          <span className="font-bold">{ugwrLengthM.toFixed(2)} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Internal Width:</span>
                          <span className="font-bold">{ugwrWidthM.toFixed(2)} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Water Depth:</span>
                          <span className="font-bold">{ugwrDepthM.toFixed(2)} m (+0.3m freeboard)</span>
                        </div>
                      </div>
                    </div>

                    {/* OHT Card */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          OHT (Over-Head Tank)
                        </strong>
                        <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {(ohtVolumeM3 * 1000).toLocaleString()} L
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Internal Length:</span>
                          <span className="font-bold">{ohtLengthM.toFixed(2)} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Internal Width:</span>
                          <span className="font-bold">{ohtWidthM.toFixed(2)} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Water Depth:</span>
                          <span className="font-bold">{ohtDepthM.toFixed(2)} m (+0.3m freeboard)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pump recommendation */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Recommended Transfer Pump</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        {pumpHp.toFixed(2)} HP Centrifugal Pump
                      </strong>
                    </div>
                    <div className="text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                      Discharge: {pumpFlowLpm.toFixed(1)} L/min (2 hr fill)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'septictank' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sanitary Loading Parameters
                  </h3>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Connected Population (Users)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={septicUsers}
                      onChange={(e) => setSepticUsers(Math.max(1, Number(e.target.value)))}
                      className="w-full text-base px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Desludging Cleaning Period (Years)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      value={desludgingYears}
                      onChange={(e) => setDesludgingYears(Math.max(0.5, Number(e.target.value)))}
                      className="w-full text-base px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Sewage Flow Per Capita (LPCD)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={sewageLpcd}
                      onChange={(e) => setSewageLpcd(Math.max(30, Number(e.target.value)))}
                      className="w-full text-base px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400">Total Tank Volume Required</div>
                    <div className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200 mt-1">
                      {septicTotalVolumeM3.toFixed(2)} m³
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Daily Flow: {dailySewageM3.toFixed(2)} m³ + Sludge Storage: {sludgeVolumeM3.toFixed(2)} m³
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Recommended 2-Chamber Septic Tank Dimensions
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-slate-500 block text-[10px]">Length</span>
                        <strong className="text-sm text-slate-900 dark:text-white">{septicLengthM.toFixed(2)} m</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-slate-500 block text-[10px]">Width</span>
                        <strong className="text-sm text-slate-900 dark:text-white">{septicWidthM.toFixed(2)} m</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-slate-500 block text-[10px]">Total Depth</span>
                        <strong className="text-sm text-slate-900 dark:text-white">{(septicLiquidDepthM + 0.3).toFixed(2)} m</strong>
                      </div>
                    </div>
                  </div>

                  {/* Soak Pit Dimensions */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Effluent Soak Pit / Absorption Well
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-500 block text-[10px]">Pit Internal Diameter:</span>
                        <strong className="text-slate-900 dark:text-white">{soakPitDiaM.toFixed(2)} m</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-500 block text-[10px]">Recommended Depth:</span>
                        <strong className="text-slate-900 dark:text-white">{soakPitDepthM.toFixed(2)} m</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
