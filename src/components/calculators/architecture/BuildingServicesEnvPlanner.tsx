import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  CloudRain,
  FileDown,
  FileSpreadsheet,
  Maximize2,
  Send,
  Sun,
  Wind,
} from 'lucide-react';
import {
  RainwaterDaylightParameters,
  TakeoffLineItem,
} from '../../../types/civil';
import {
  buildBoqItemsFromRwhCistern,
  computeDaylightVentilationDesign,
  computeRainwaterHarvestingDesign,
} from '../../../utils/architectureEngine';
import { exportToCSV, generateEngineeringPDF } from '../../../utils/exportEngine';
import { DcrGaugeSuite } from '../../DcrCapacityGauge';
import { StepByStepPanel } from '../../StepByStepPanel';

export type ServicesSubMode = 'rainwater' | 'daylight';

export interface BuildingServicesEnvPlannerProps {
  initialValues?: Partial<RainwaterDaylightParameters>;
  onChange?: (values: RainwaterDaylightParameters) => void;
  onSendRwhToBoq?: (items: TakeoffLineItem[]) => void;
  subMode?: ServicesSubMode;
  onSubModeChange?: (mode: ServicesSubMode) => void;
}

const RAINFALL_CITY_PRESETS = [
  { label: 'Dhaka', mm: 2050 },
  { label: 'Chattogram', mm: 2850 },
  { label: 'Sylhet', mm: 3900 },
  { label: 'Rajshahi', mm: 1450 },
];

export const BuildingServicesEnvPlanner: React.FC<BuildingServicesEnvPlannerProps> = ({
  initialValues,
  onChange,
  onSendRwhToBoq,
  subMode: controlledSubMode,
  onSubModeChange,
}) => {
  const [internalSubMode, setInternalSubMode] = useState<ServicesSubMode>(
    controlledSubMode || 'rainwater'
  );
  const subMode = controlledSubMode ?? internalSubMode;
  const setSubMode = (m: ServicesSubMode) => {
    setInternalSubMode(m);
    onSubModeChange?.(m);
  };

  const [viewMode, setViewMode] = useState<'schematics' | 'steps'>('schematics');
  const [boqNotice, setBoqNotice] = useState<boolean>(false);

  // Rainwater Harvesting State
  const [roofCatchmentAreaM2, setRoofCatchmentAreaM2] = useState<number>(
    initialValues?.roofCatchmentAreaM2 ?? 220
  );
  const [runoffCoefficient, setRunoffCoefficient] = useState<number>(
    initialValues?.runoffCoefficient ?? 0.9
  );
  const [annualRainfallMm, setAnnualRainfallMm] = useState<number>(
    initialValues?.annualRainfallMm ?? 2050
  );
  const [monsoonCaptureSharePct, setMonsoonCaptureSharePct] = useState<number>(
    initialValues?.monsoonCaptureSharePct ?? 75
  );
  const [drySpellDays, setDrySpellDays] = useState<number>(initialValues?.drySpellDays ?? 25);
  const [dailyRwhDemandLpd, setDailyRwhDemandLpd] = useState<number>(
    initialValues?.dailyRwhDemandLpd ?? 900
  );
  const [cisternDepthM, setCisternDepthM] = useState<number>(
    initialValues?.cisternDepthM ?? 2.0
  );
  const [cisternLwRatio, setCisternLwRatio] = useState<number>(
    initialValues?.cisternLwRatio ?? 1.5
  );

  // Habitable Room Daylight & Ventilation State
  const [roomName, setRoomName] = useState<string>(
    initialValues?.roomName || 'Master Bedroom 01'
  );
  const [roomOccupancyType, setRoomOccupancyType] = useState<
    'habitable' | 'kitchen' | 'utility'
  >(initialValues?.roomOccupancyType || 'habitable');
  const [roomLengthM, setRoomLengthM] = useState<number>(initialValues?.roomLengthM ?? 4.2);
  const [roomWidthM, setRoomWidthM] = useState<number>(initialValues?.roomWidthM ?? 3.4);
  const [ceilingHeightM, setCeilingHeightM] = useState<number>(
    initialValues?.ceilingHeightM ?? 3.0
  );
  const [windowCount, setWindowCount] = useState<number>(initialValues?.windowCount ?? 2);
  const [windowWidthM, setWindowWidthM] = useState<number>(initialValues?.windowWidthM ?? 1.5);
  const [windowHeightM, setWindowHeightM] = useState<number>(
    initialValues?.windowHeightM ?? 1.35
  );
  const [openableWindowPct, setOpenableWindowPct] = useState<number>(
    initialValues?.openableWindowPct ?? 50
  );
  const [ventilatorAreaM2, setVentilatorAreaM2] = useState<number>(
    initialValues?.ventilatorAreaM2 ?? 0.25
  );

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const params: RainwaterDaylightParameters = useMemo(
    () => ({
      roofCatchmentAreaM2,
      runoffCoefficient,
      annualRainfallMm,
      monsoonCaptureSharePct,
      drySpellDays,
      dailyRwhDemandLpd,
      cisternDepthM,
      cisternLwRatio,
      roomName,
      roomOccupancyType,
      roomLengthM,
      roomWidthM,
      ceilingHeightM,
      windowCount,
      windowWidthM,
      windowHeightM,
      openableWindowPct,
      ventilatorAreaM2,
    }),
    [
      roofCatchmentAreaM2,
      runoffCoefficient,
      annualRainfallMm,
      monsoonCaptureSharePct,
      drySpellDays,
      dailyRwhDemandLpd,
      cisternDepthM,
      cisternLwRatio,
      roomName,
      roomOccupancyType,
      roomLengthM,
      roomWidthM,
      ceilingHeightM,
      windowCount,
      windowWidthM,
      windowHeightM,
      openableWindowPct,
      ventilatorAreaM2,
    ]
  );

  useEffect(() => {
    onChangeRef.current?.(params);
  }, [params]);

  const rwhEnvelope = useMemo(() => computeRainwaterHarvestingDesign(params), [params]);
  const rwhRes = rwhEnvelope.result!;

  const daylightEnvelope = useMemo(() => computeDaylightVentilationDesign(params), [params]);
  const dayRes = daylightEnvelope.result!;

  const handlePushRwhToBoq = () => {
    if (!onSendRwhToBoq) return;
    onSendRwhToBoq(buildBoqItemsFromRwhCistern(rwhRes));
    setBoqNotice(true);
    setTimeout(() => setBoqNotice(false), 3500);
  };

  const handleExportCSV = () => {
    const headers = ['Parameter', 'Value', 'Unit', 'Code / Spec'];
    if (subMode === 'rainwater') {
      exportToCSV(
        `BD_CivilLab_Rainwater_Harvesting_${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        [
          ['Roof Catchment Area', roofCatchmentAreaM2, 'm2', 'Effective plan projection'],
          ['Runoff Coefficient (Cr)', runoffCoefficient, 'ratio', '0.85 - 0.95 for RCC roof'],
          ['Annual Rainfall Depth', annualRainfallMm, 'mm', 'Regional meteorological mean'],
          ['First-Flush Diverter Volume', rwhRes.firstFlushDivertedL, 'L/event', '0.5 mm initial roof wash'],
          ['Annual Harvestable Rainwater', Math.round(rwhRes.annualHarvestableL), 'L/yr', `${rwhRes.annualHarvestableM3.toFixed(1)} m3/yr`],
          ['Recommended Cistern Capacity', Math.round(rwhRes.recommendedCisternL), 'Litres', `${rwhRes.recommendedCisternM3.toFixed(2)} m3`],
          ['Cistern Dimensions (L x W x H)', `${rwhRes.cisternLengthM.toFixed(2)} x ${rwhRes.cisternWidthM.toFixed(2)} x ${rwhRes.cisternTotalHeightM.toFixed(2)}`, 'm', 'Incl. 0.30m freeboard'],
          ['Annual Demand Coverage', `${rwhRes.demandCoveragePct}%`, '%', `${dailyRwhDemandLpd} L/day non-potable`],
        ]
      );
    } else {
      exportToCSV(
        `BD_CivilLab_Daylight_Ventilation_${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        [
          ['Room Name & Type', `${dayRes.roomName} (${dayRes.roomOccupancyType})`, '-', 'BNBC 2020 Part 3'],
          ['Floor Dimensions (L x W)', `${roomLengthM.toFixed(2)} x ${roomWidthM.toFixed(2)}`, 'm', `Min width ${dayRes.minDimM} m >= ${dayRes.minRequiredWidthM} m`],
          ['Floor Area', dayRes.floorAreaM2, 'm2', `Min ${dayRes.minRequiredAreaM2} m2 (${dayRes.areaPass ? 'PASS' : 'FAIL'})`],
          ['Clear Ceiling Height', ceilingHeightM.toFixed(2), 'm', `Min ${dayRes.minRequiredHeightM} m (${dayRes.heightPass ? 'PASS' : 'FAIL'})`],
          ['Total Glazed Window Area', dayRes.totalGlazedWindowAreaM2, 'm2', `${windowCount} x (${windowWidthM}x${windowHeightM}m)`],
          ['Window-to-Floor Daylight Ratio', `${dayRes.daylightRatioPct}%`, '%', `Min ${dayRes.minRequiredDaylightPct}% / Target 15%`],
          ['Effective Openable Ventilation', `${dayRes.ventilationRatioPct}%`, '%', `Openable ${openableWindowPct}% + ${ventilatorAreaM2} m2 louver`],
        ]
      );
    }
  };

  const handleExportPDF = async () => {
    if (subMode === 'rainwater') {
      await generateEngineeringPDF(
        {
          projectMeta: {
            projectName: 'Rainwater Harvesting (RWH) Cistern Sizing',
            projectCode: 'ARC-RWH-2026',
            date: new Date().toISOString().slice(0, 10),
            unitSystem: 'SI',
          },
          moduleMeta: {
            moduleId: 'architecture-services-rwh',
            moduleTitle: 'RAINWATER HARVESTING CISTERN & CATCHMENT YIELD REPORT',
            standard: 'BNBC 2020 Part 8 §5.6',
            status: rwhRes.overallCompliant ? 'SAFE' : 'WARNING',
          },
          inputs: [
            { name: 'Roof Catchment Area', symbol: 'A_roof', value: roofCatchmentAreaM2, unit: 'm2' },
            { name: 'Runoff Coefficient', symbol: 'C_r', value: runoffCoefficient, unit: 'ratio' },
            { name: 'Annual Rainfall', symbol: 'R_yr', value: annualRainfallMm, unit: 'mm' },
            { name: 'Dry-Spell Buffer Target', symbol: 'T_dry', value: drySpellDays, unit: 'days' },
            { name: 'Daily RWH Demand', symbol: 'Q_rwh', value: dailyRwhDemandLpd, unit: 'L/day' },
          ],
          outputs: [
            { name: 'Annual Harvestable Yield', symbol: 'V_yr', value: `${Math.round(rwhRes.annualHarvestableL).toLocaleString()} L`, unit: 'L/yr', status: 'PASS' },
            { name: 'Recommended Cistern Capacity', symbol: 'V_cistern', value: `${Math.round(rwhRes.recommendedCisternL).toLocaleString()} L (${rwhRes.recommendedCisternM3.toFixed(2)} m3)`, unit: 'L', status: 'PASS' },
            { name: 'Cistern Clear Geometry', symbol: 'LxWxH', value: `${rwhRes.cisternLengthM.toFixed(2)}x${rwhRes.cisternWidthM.toFixed(2)}x${rwhRes.cisternTotalHeightM.toFixed(2)}`, unit: 'm', status: 'PASS' },
          ],
          stepByStepFormulas: rwhEnvelope.handCalculationSteps?.map((s) => ({
            stepNumber: s.stepNumber,
            title: s.title,
            equation: s.formula,
            substitution: s.substitution,
            result: s.result,
            remarks: s.reasoning,
          })),
        },
        { filename: `BD_CivilLab_RWH_Cistern_${new Date().toISOString().slice(0, 10)}.pdf` }
      );
    } else {
      await generateEngineeringPDF(
        {
          projectMeta: {
            projectName: `Habitable Space Check — ${dayRes.roomName}`,
            projectCode: 'ARC-DAYLIGHT-2026',
            date: new Date().toISOString().slice(0, 10),
            unitSystem: 'SI',
          },
          moduleMeta: {
            moduleId: 'architecture-services-daylight',
            moduleTitle: 'BNBC 2020 DAYLIGHT, NATURAL VENTILATION & ERGONOMICS AUDIT',
            standard: 'BNBC 2020 Part 3 Chap 1 & 3',
            status: dayRes.overallCompliant ? 'PASS' : 'WARNING',
          },
          inputs: [
            { name: 'Room Space Type', symbol: 'Type', value: dayRes.roomOccupancyType, unit: '-' },
            { name: 'Room Length x Width', symbol: 'L x W', value: `${roomLengthM} x ${roomWidthM}`, unit: 'm' },
            { name: 'Clear Ceiling Height', symbol: 'H_ceil', value: ceilingHeightM, unit: 'm' },
            { name: 'Windows Provided', symbol: 'N x W x H', value: `${windowCount} x ${windowWidthM} x ${windowHeightM}`, unit: 'm' },
            { name: 'Openable Shutter Percentage', symbol: '%_open', value: openableWindowPct, unit: '%' },
          ],
          outputs: [
            { name: 'Room Floor Area', symbol: 'A_floor', value: dayRes.floorAreaM2, unit: 'm2', limit: `>= ${dayRes.minRequiredAreaM2} m2`, status: dayRes.areaPass ? 'PASS' : 'FAIL' },
            { name: 'Minimum Room Width', symbol: 'W_min', value: dayRes.minDimM, unit: 'm', limit: `>= ${dayRes.minRequiredWidthM} m`, status: dayRes.widthPass ? 'PASS' : 'FAIL' },
            { name: 'Daylight Window Ratio', symbol: 'R_day', value: `${dayRes.daylightRatioPct}%`, unit: '%', limit: `>= ${dayRes.minRequiredDaylightPct}%`, status: dayRes.daylightPass ? 'PASS' : 'FAIL' },
            { name: 'Openable Ventilation Ratio', symbol: 'R_vent', value: `${dayRes.ventilationRatioPct}%`, unit: '%', limit: `>= ${dayRes.minRequiredVentilationPct}%`, status: dayRes.ventilationPass ? 'PASS' : 'FAIL' },
          ],
          stepByStepFormulas: daylightEnvelope.handCalculationSteps?.map((s) => ({
            stepNumber: s.stepNumber,
            title: s.title,
            equation: s.formula,
            substitution: s.substitution,
            result: s.result,
            remarks: s.reasoning,
          })),
        },
        { filename: `BD_CivilLab_Daylight_Ventilation_${new Date().toISOString().slice(0, 10)}.pdf` }
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Sub-Mode Selector */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
                Environmental Compliance
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                Rainwater Harvesting, Daylight &amp; Natural Ventilation Planner
              </h2>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
              BNBC 2020 Part 3 &amp; Part 8 · Roof Catchment Cistern · Habitable Area (≥9.5 m²) · Window-to-Floor Ratio (≥10–15%)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            {subMode === 'rainwater' && onSendRwhToBoq && (
              <button
                type="button"
                onClick={handlePushRwhToBoq}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Push Cistern to BOQ</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubMode('rainwater')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                subMode === 'rainwater'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              <CloudRain className="w-4 h-4" />
              <span>Rainwater Harvesting (RWH) Cistern</span>
            </button>
            <button
              type="button"
              onClick={() => setSubMode('daylight')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                subMode === 'daylight'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Daylight, Ventilation &amp; Room Ergonomics</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container)] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('schematics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'schematics'
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-2xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>2D Schematic &amp; DCR</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('steps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'steps'
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-2xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              <BookOpenCheck className="w-3.5 h-3.5" />
              <span>Step-by-Step Derivations</span>
            </button>
          </div>
        </div>

        {boqNotice && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Rainwater Harvesting cistern excavation &amp; RCC items added to BOQ Estimator.</span>
          </div>
        )}
      </div>

      {/* =====================================================================
          SUB-MODE 1: RAINWATER HARVESTING (RWH) CISTERN SIZER
          ===================================================================== */}
      {subMode === 'rainwater' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4" />
                <span>Catchment &amp; Rainfall Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Roof Area (m²)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={roofCatchmentAreaM2}
                    onChange={(e) => setRoofCatchmentAreaM2(Math.max(10, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Runoff Coeff. (Cr)
                  </label>
                  <input
                    type="number"
                    step="0.02"
                    min={0.5}
                    max={0.98}
                    value={runoffCoefficient}
                    onChange={(e) =>
                      setRunoffCoefficient(Math.min(0.98, Math.max(0.5, Number(e.target.value))))
                    }
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                  Bangladesh Meteorological Rainfall Preset (mm/yr)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {RAINFALL_CITY_PRESETS.map((city) => (
                    <button
                      key={city.label}
                      type="button"
                      onClick={() => setAnnualRainfallMm(city.mm)}
                      className={`px-2 py-1 text-[10px] font-mono rounded-lg border transition-colors cursor-pointer ${
                        annualRainfallMm === city.mm
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      <div>{city.label}</div>
                      <div>{city.mm}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Annual Rainfall (mm)
                  </label>
                  <input
                    type="number"
                    step="50"
                    min={200}
                    value={annualRainfallMm}
                    onChange={(e) => setAnnualRainfallMm(Math.max(200, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Monsoon Share (%)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min={20}
                    max={100}
                    value={monsoonCaptureSharePct}
                    onChange={(e) =>
                      setMonsoonCaptureSharePct(Math.min(100, Math.max(20, Number(e.target.value))))
                    }
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Dry-Spell Storage (Days)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={drySpellDays}
                    onChange={(e) => setDrySpellDays(Math.max(5, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Non-Potable Demand (L/d)
                  </label>
                  <input
                    type="number"
                    step="50"
                    min={50}
                    value={dailyRwhDemandLpd}
                    onChange={(e) => setDailyRwhDemandLpd(Math.max(50, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Cistern Water Depth (m)
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    min={0.8}
                    value={cisternDepthM}
                    onChange={(e) => setCisternDepthM(Math.max(0.8, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Cistern L : W Ratio
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    min={1.0}
                    value={cisternLwRatio}
                    onChange={(e) => setCisternLwRatio(Math.max(1.0, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 block">
                  Annual Harvest Yield
                </span>
                <div className="text-xl font-black font-mono tabular-nums text-indigo-900 dark:text-indigo-100 mt-0.5">
                  {rwhRes.annualHarvestableM3.toFixed(1)}{' '}
                  <span className="text-xs font-normal">m³/yr</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 block">
                  {Math.round(rwhRes.annualHarvestableL).toLocaleString()} L/yr
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 block">
                  Recommended Cistern
                </span>
                <div className="text-xl font-black font-mono tabular-nums text-cyan-900 dark:text-cyan-100 mt-0.5">
                  {Math.round(rwhRes.recommendedCisternL).toLocaleString()}{' '}
                  <span className="text-xs font-normal">L</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 block">
                  {rwhRes.recommendedCisternM3.toFixed(2)} m³ · {rwhRes.demandCoveragePct}% annual demand
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 block">
                  Cistern Clear Box (L×W×H)
                </span>
                <div className="text-lg font-black font-mono tabular-nums text-emerald-900 dark:text-emerald-100 mt-0.5">
                  {rwhRes.cisternLengthM.toFixed(1)} × {rwhRes.cisternWidthM.toFixed(1)} ×{' '}
                  {rwhRes.cisternTotalHeightM.toFixed(1)} m
                </div>
                <span className="text-[10px] font-mono text-slate-500 block">
                  First-flush: {rwhRes.firstFlushDivertedL} L/storm
                </span>
              </div>
            </div>

            {viewMode === 'schematics' ? (
              <>
                <DcrGaugeSuite
                  gauges={rwhRes.dcrGauges}
                  moduleKey={`arch-rwh-${rwhRes.roofCatchmentAreaM2}-${rwhRes.recommendedCisternL}`}
                  showAllInitially={true}
                />

                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-indigo-500" />
                    <span>Rainwater Catchment, First-Flush Diverter &amp; Storage Cistern Schematic</span>
                  </span>

                  <svg
                    data-arch-svg="true"
                    viewBox="0 0 600 220"
                    className="w-full h-auto bg-[#0f172a] rounded-xl border border-[var(--md-sys-color-outline-variant)]"
                  >
                    {/* Roof Catchment Slab */}
                    <polygon points="35,45 270,22 270,32 35,55" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
                    <text x="150" y="25" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      RCC Roof Catchment ({roofCatchmentAreaM2} m² · Cr={runoffCoefficient})
                    </text>

                    {/* Rain drops */}
                    <line x1="80" y1="8" x2="75" y2="20" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="120" y1="5" x2="115" y2="17" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="210" y1="3" x2="205" y2="15" stroke="#38bdf8" strokeWidth="1.5" />

                    {/* Downspout Pipe */}
                    <path d="M 42 54 L 42 128 L 195 128" fill="none" stroke="#38bdf8" strokeWidth="3.5" />

                    {/* First-Flush Diverter Vertical Standpipe */}
                    <rect x="65" y="128" width="22" height="58" fill="#d97706" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2" rx="2" />
                    <text x="76" y="198" fill="#fbbf24" fontSize="8" textAnchor="middle" fontFamily="monospace">
                      1st-Flush ({rwhRes.firstFlushDivertedL}L)
                    </text>

                    {/* Sand-Gravel-Charcoal Filter Box */}
                    <rect x="195" y="108" width="110" height="44" fill="#065f46" fillOpacity="0.25" stroke="#10b981" strokeWidth="2" rx="4" />
                    <text x="250" y="127" fill="#a7f3d0" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                      Sand / Carbon
                    </text>
                    <text x="250" y="141" fill="#34d399" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                      Rapid Filter
                    </text>

                    {/* Pipe from Filter to Cistern */}
                    <path d="M 305 128 L 355 128 L 355 108" fill="none" stroke="#38bdf8" strokeWidth="3" />

                    {/* RWH Storage Cistern */}
                    <g transform="translate(355, 72)">
                      <rect x="0" y="0" width="210" height="122" fill="#1e3a8a" fillOpacity="0.25" stroke="#60a5fa" strokeWidth="2.5" rx="3" />
                      <rect x="3" y="24" width="204" height="95" fill="#2563eb" fillOpacity="0.32" />
                      <line x1="3" y1="24" x2="207" y2="24" stroke="#93c5fd" strokeWidth="1" strokeDasharray="4 2" />
                      <text x="105" y="16" fill="#cbd5e1" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                        Freeboard: {rwhRes.cisternFreeboardM.toFixed(2)}m
                      </text>
                      <text x="105" y="58" fill="#eff6ff" fontSize="12" fontWeight="bold" textAnchor="middle">
                        RWH CISTERN
                      </text>
                      <text x="105" y="76" fill="#93c5fd" fontSize="10" textAnchor="middle" fontFamily="monospace">
                        {Math.round(rwhRes.recommendedCisternL).toLocaleString()} L ({rwhRes.recommendedCisternM3.toFixed(1)} m³)
                      </text>
                      <text x="105" y="94" fill="#34d399" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        {rwhRes.cisternLengthM.toFixed(2)}m × {rwhRes.cisternWidthM.toFixed(2)}m × {rwhRes.cisternTotalHeightM.toFixed(2)}m
                      </text>
                    </g>
                  </svg>
                </div>
              </>
            ) : (
              <StepByStepPanel
                moduleTitle="Rainwater Harvesting Yield & Cistern Sizing Derivations"
                steps={rwhEnvelope.handCalculationSteps}
                scopeAndLimits={rwhEnvelope.scopeAndLimits}
              />
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-MODE 2: HABITABLE ROOM DAYLIGHT, VENTILATION & ERGONOMICS
          ===================================================================== */}
      {subMode === 'daylight' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Sun className="w-4 h-4" />
                <span>Room Geometry &amp; Fenestration Setup</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Room Label
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    BNBC Space Class
                  </label>
                  <select
                    value={roomOccupancyType}
                    onChange={(e) =>
                      setRoomOccupancyType(e.target.value as 'habitable' | 'kitchen' | 'utility')
                    }
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="habitable">Habitable (Bed/Living)</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="utility">Bath / Utility</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={1.0}
                    value={roomLengthM}
                    onChange={(e) => setRoomLengthM(Math.max(1.0, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Width (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.9}
                    value={roomWidthM}
                    onChange={(e) => setRoomWidthM(Math.max(0.9, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Ceiling H (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min={1.8}
                    value={ceilingHeightM}
                    onChange={(e) => setCeilingHeightM(Math.max(1.8, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-500" />
                  <span>Windows &amp; Ventilation Openings</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      No. Windows
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={windowCount}
                      onChange={(e) => setWindowCount(Math.max(0, Math.round(Number(e.target.value))))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Win Width (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0.3}
                      value={windowWidthM}
                      onChange={(e) => setWindowWidthM(Math.max(0.3, Number(e.target.value)))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Win Height (m)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min={0.3}
                      value={windowHeightM}
                      onChange={(e) => setWindowHeightM(Math.max(0.3, Number(e.target.value)))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Openable Shutter (%)
                    </label>
                    <select
                      value={openableWindowPct}
                      onChange={(e) => setOpenableWindowPct(Number(e.target.value))}
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    >
                      <option value={50}>50% (2-Track Sliding)</option>
                      <option value={67}>67% (3-Track Sliding)</option>
                      <option value={100}>100% (Casement / Louver)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Aux. Ventilator (m²)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min={0}
                      value={ventilatorAreaM2}
                      onChange={(e) => setVentilatorAreaM2(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className={`p-3.5 rounded-2xl border ${
                  dayRes.areaPass && dayRes.widthPass
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 block">
                  Floor Area &amp; Min Width
                </span>
                <div className="text-xl font-black font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
                  {dayRes.floorAreaM2} m²
                </div>
                <span className="text-[10px] font-mono text-slate-500 block">
                  Min W: {dayRes.minDimM} m (Code ≥ {dayRes.minRequiredWidthM}m)
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  dayRes.daylightPass
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 block">
                  Window-to-Floor Daylight
                </span>
                <div className="text-xl font-black font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
                  {dayRes.daylightRatioPct}%
                </div>
                <span className="text-[10px] font-mono text-slate-500 block">
                  Glazed: {dayRes.totalGlazedWindowAreaM2} m² (Min {dayRes.minRequiredDaylightPct}%)
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  dayRes.ventilationPass
                    ? 'bg-sky-500/10 border-sky-500/20'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 block">
                  Net Openable Ventilation
                </span>
                <div className="text-xl font-black font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
                  {dayRes.ventilationRatioPct}%
                </div>
                <span className="text-[10px] font-mono text-slate-500 block">
                  Free Air: {dayRes.totalVentilationOpeningM2} m² (Min {dayRes.minRequiredVentilationPct}%)
                </span>
              </div>
            </div>

            {viewMode === 'schematics' ? (
              <>
                <DcrGaugeSuite
                  gauges={dayRes.dcrGauges}
                  moduleKey={`arch-daylight-${dayRes.floorAreaM2}-${dayRes.daylightRatioPct}-${dayRes.ventilationRatioPct}`}
                  showAllInitially={true}
                />

                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-amber-500" />
                    <span>2D Room Plan &amp; Daylight Penetration Section</span>
                  </span>

                  <svg
                    data-arch-svg="true"
                    viewBox="0 0 600 220"
                    className="w-full h-auto bg-[#0f172a] rounded-xl border border-[var(--md-sys-color-outline-variant)]"
                  >
                    {/* Left: Plan Footprint */}
                    <g transform="translate(30, 32)">
                      <text x="115" y="-12" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        ROOM PLAN ({dayRes.floorAreaM2} m²)
                      </text>
                      <rect x="0" y="0" width="230" height="145" fill="#1e293b" stroke="#94a3b8" strokeWidth="4" />
                      {/* Daylight Cone from exterior window */}
                      <polygon points="35,2 195,2 224,138 6,138" fill="#fbbf24" fillOpacity="0.14" />
                      {/* Window glazing on top wall */}
                      <line x1="45" y1="0" x2="185" y2="0" stroke="#38bdf8" strokeWidth="6" />
                      <text x="115" y="-2" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                        {windowCount} Win ({dayRes.daylightRatioPct}%)
                      </text>
                      <text x="115" y="75" fill="#fde68a" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        {dayRes.roomName}
                      </text>
                      <text x="115" y="95" fill="#cbd5e1" fontSize="9.5" textAnchor="middle" fontFamily="monospace">
                        {roomLengthM.toFixed(2)}m × {roomWidthM.toFixed(2)}m
                      </text>
                      <text x="115" y="165" fill={dayRes.widthPass ? '#34d399' : '#f87171'} fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                        Min Dim: {dayRes.minDimM}m (Code ≥ {dayRes.minRequiredWidthM}m)
                      </text>
                    </g>

                    {/* Right: Section Elevation */}
                    <g transform="translate(320, 32)">
                      <text x="125" y="-12" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        SECTION ELEVATION (H = {ceilingHeightM.toFixed(2)}m)
                      </text>
                      {/* Floor & Roof Slabs */}
                      <rect x="0" y="0" width="250" height="12" fill="#64748b" />
                      <rect x="0" y="135" width="250" height="12" fill="#64748b" />
                      {/* Exterior Wall with Window */}
                      <rect x="0" y="12" width="12" height="32" fill="#94a3b8" />
                      <rect x="2" y="44" width="8" height="58" fill="#38bdf8" fillOpacity="0.8" />
                      <rect x="0" y="102" width="12" height="33" fill="#94a3b8" />
                      {/* Sun Rays */}
                      <polygon points="12,44 235,135 12,102" fill="#fbbf24" fillOpacity="0.18" />
                      <line x1="-18" y1="36" x2="12" y2="54" stroke="#fbbf24" strokeWidth="2" />
                      <line x1="-18" y1="54" x2="12" y2="72" stroke="#fbbf24" strokeWidth="2" />

                      {/* Ceiling Height Dimension */}
                      <line x1="220" y1="12" x2="220" y2="135" stroke={dayRes.heightPass ? '#34d399' : '#f87171'} strokeWidth="1.5" />
                      <text x="214" y="75" fill={dayRes.heightPass ? '#34d399' : '#f87171'} fontSize="9.5" textAnchor="end" fontFamily="monospace">
                        Clear {ceilingHeightM.toFixed(2)}m
                      </text>
                      <text x="125" y="165" fill={dayRes.ventilationPass ? '#38bdf8' : '#f87171'} fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                        Openable Vent: {dayRes.ventilationRatioPct}% ({dayRes.totalVentilationOpeningM2} m²)
                      </text>
                    </g>
                  </svg>
                </div>
              </>
            ) : (
              <StepByStepPanel
                moduleTitle="BNBC Part 3 Room Ergonomics & Daylight Derivations"
                steps={daylightEnvelope.handCalculationSteps}
                scopeAndLimits={daylightEnvelope.scopeAndLimits}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
