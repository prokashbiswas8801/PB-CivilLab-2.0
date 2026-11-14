import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  Building,
  CheckCircle2,
  Droplets,
  FileDown,
  FileSpreadsheet,
  Flame,
  Layers,
  Maximize2,
  Send,
  ShieldCheck,
  Weight,
  Zap,
} from 'lucide-react';
import {
  RebarBBSParameters,
  SepticTankParameters,
  TakeoffLineItem,
  WaterOccupancyPreset,
  WaterTankParameters,
} from '../../../types/civil';
import {
  WATER_OCCUPANCY_PRESETS,
  buildBoqItemsFromTanks,
  buildRebarParamsFromTank,
  computeSepticSoakPitDesign,
  computeWaterReservoirDesign,
  infiltrationRateToPercolationMin,
  percolationMinToInfiltrationRate,
} from '../../../utils/architectureEngine';
import { exportToCSV, generateEngineeringPDF } from '../../../utils/exportEngine';
import { DcrGaugeSuite } from '../../DcrCapacityGauge';
import { StepByStepPanel } from '../../StepByStepPanel';

export type ServiceTab = 'water-reservoirs' | 'septic-system';

export interface BuildingServicesSizerProps {
  initialTab?: ServiceTab;
  initialWaterValues?: Partial<WaterTankParameters>;
  initialSepticValues?: Partial<SepticTankParameters>;
  onWaterChange?: (values: WaterTankParameters) => void;
  onSepticChange?: (values: SepticTankParameters) => void;
  onSendToBOQ?: (items: TakeoffLineItem[]) => void;
  onSendTankToRebar?: (rebarParams: Partial<RebarBBSParameters>) => void;
}

const SOIL_PERCOLATION_PRESETS = [
  { label: 'Coarse Sand', minPer25mm: 5 },
  { label: 'Sandy Loam', minPer25mm: 15 },
  { label: 'Silty Loam', minPer25mm: 30 },
  { label: 'Clayey Loam', minPer25mm: 50 },
];

export const BuildingServicesSizer: React.FC<BuildingServicesSizerProps> = ({
  initialTab = 'water-reservoirs',
  initialWaterValues,
  initialSepticValues,
  onWaterChange,
  onSepticChange,
  onSendToBOQ,
  onSendTankToRebar,
}) => {
  const [activeTab, setActiveTab] = useState<ServiceTab>(initialTab);
  const [viewMode, setViewMode] = useState<'schematics' | 'steps'>('schematics');
  const [boqSentBanner, setBoqSentBanner] = useState<string>('');

  // Selectable BOQ scope toggles
  const [includeExcavation, setIncludeExcavation] = useState<boolean>(true);
  const [includeWaterRcc, setIncludeWaterRcc] = useState<boolean>(true);
  const [includeSepticMasonrySlabs, setIncludeSepticMasonrySlabs] = useState<boolean>(true);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // =========================================================================
  // 1. WATER RESERVOIRS (UGWR & OHT) STATE
  // =========================================================================
  const [calcMode, setCalcMode] = useState<'occupants' | 'building'>(
    initialWaterValues?.calcMode || 'building'
  );
  const [occupancyPreset, setOccupancyPreset] = useState<WaterOccupancyPreset>(
    initialWaterValues?.occupancyPreset || 'residential-135'
  );
  const [numFloors, setNumFloors] = useState<number>(initialWaterValues?.numFloors ?? 6);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(initialWaterValues?.unitsPerFloor ?? 2);
  const [personsPerUnit, setPersonsPerUnit] = useState<number>(
    initialWaterValues?.personsPerUnit ?? 5
  );
  const [directOccupants, setDirectOccupants] = useState<number>(
    initialWaterValues?.directOccupants ?? 50
  );
  const [floatingPopulation, setFloatingPopulation] = useState<number>(
    initialWaterValues?.floatingPopulation ?? 5
  );
  const [lpcd, setLpcd] = useState<number>(initialWaterValues?.lpcd ?? 135);
  const [storageDays, setStorageDays] = useState<number>(initialWaterValues?.storageDays ?? 1.0);
  const [fireReserveL, setFireReserveL] = useState<number>(
    initialWaterValues?.fireReserveL ?? 10000
  );
  const [fireReserveMinutes, setFireReserveMinutes] = useState<number>(
    initialWaterValues?.fireReserveMinutes ?? 45
  );
  const [firePumpFlowLpm, setFirePumpFlowLpm] = useState<number>(
    initialWaterValues?.firePumpFlowLpm ?? 225
  );
  const [fireReserveAutoMode, setFireReserveAutoMode] = useState<boolean>(
    initialWaterValues?.fireReserveAutoMode ?? false
  );
  const [ugwrSharePercent, setUgwrSharePercent] = useState<number>(
    initialWaterValues?.ugwrSharePercent ?? 65
  );
  const [ugwrWaterDepthM, setUgwrWaterDepthM] = useState<number>(
    initialWaterValues?.ugwrWaterDepthM ?? 2.0
  );
  const [ugwrLwRatio, setUgwrLwRatio] = useState<number>(initialWaterValues?.ugwrLwRatio ?? 1.5);
  const [ohtWaterDepthM, setOhtWaterDepthM] = useState<number>(
    initialWaterValues?.ohtWaterDepthM ?? 1.6
  );
  const [ohtLwRatio, setOhtLwRatio] = useState<number>(initialWaterValues?.ohtLwRatio ?? 1.3);
  const [pumpFillHours, setPumpFillHours] = useState<number>(
    initialWaterValues?.pumpFillHours ?? 2.0
  );
  const [totalHeadM, setTotalHeadM] = useState<number>(initialWaterValues?.totalHeadM ?? 28);

  // =========================================================================
  // 2. SEPTIC TANK & SOAK PIT STATE
  // =========================================================================
  const [septicUsers, setSepticUsers] = useState<number>(initialSepticValues?.septicUsers ?? 35);
  const [sewageRateLpcd, setSewageRateLpcd] = useState<number>(
    initialSepticValues?.sewageRateLpcd ?? 90
  );
  const [detentionHours, setDetentionHours] = useState<number>(
    initialSepticValues?.detentionHours ?? 24
  );
  const [desludgingYears, setDesludgingYears] = useState<number>(
    initialSepticValues?.desludgingYears ?? 2.0
  );
  const [septicDepthM, setSepticDepthM] = useState<number>(
    initialSepticValues?.septicDepthM ?? 1.6
  );
  const [septicLwRatio, setSepticLwRatio] = useState<number>(
    initialSepticValues?.septicLwRatio ?? 2.5
  );
  const [soilPercolationMinPer25mm, setSoilPercolationMinPer25mm] = useState<number>(
    initialSepticValues?.soilPercolationMinPer25mm ??
      infiltrationRateToPercolationMin(initialSepticValues?.soilPercolationRate ?? 30)
  );
  const [soilPercolationRate, setSoilPercolationRate] = useState<number>(
    initialSepticValues?.soilPercolationRate ??
      percolationMinToInfiltrationRate(initialSepticValues?.soilPercolationMinPer25mm ?? 18)
  );
  const [soakPitDiaM, setSoakPitDiaM] = useState<number>(initialSepticValues?.soakPitDiaM ?? 1.8);

  const onWaterChangeRef = useRef(onWaterChange);
  onWaterChangeRef.current = onWaterChange;
  const onSepticChangeRef = useRef(onSepticChange);
  onSepticChangeRef.current = onSepticChange;

  const waterParams: WaterTankParameters = useMemo(
    () => ({
      calcMode,
      occupancyPreset,
      numFloors,
      unitsPerFloor,
      personsPerUnit,
      directOccupants,
      floatingPopulation,
      lpcd,
      storageDays,
      fireReserveL: fireReserveAutoMode
        ? Math.round(firePumpFlowLpm * fireReserveMinutes)
        : fireReserveL,
      fireReserveMinutes,
      firePumpFlowLpm,
      fireReserveAutoMode,
      ugwrSharePercent,
      ugwrWaterDepthM,
      ugwrLwRatio,
      ohtWaterDepthM,
      ohtLwRatio,
      pumpFillHours,
      totalHeadM,
    }),
    [
      calcMode,
      occupancyPreset,
      numFloors,
      unitsPerFloor,
      personsPerUnit,
      directOccupants,
      floatingPopulation,
      lpcd,
      storageDays,
      fireReserveL,
      fireReserveMinutes,
      firePumpFlowLpm,
      fireReserveAutoMode,
      ugwrSharePercent,
      ugwrWaterDepthM,
      ugwrLwRatio,
      ohtWaterDepthM,
      ohtLwRatio,
      pumpFillHours,
      totalHeadM,
    ]
  );

  const septicParams: SepticTankParameters = useMemo(
    () => ({
      septicUsers,
      sewageRateLpcd,
      detentionHours,
      desludgingYears,
      septicDepthM,
      septicLwRatio,
      soilPercolationRate,
      soilPercolationMinPer25mm,
      soakPitDiaM,
    }),
    [
      septicUsers,
      sewageRateLpcd,
      detentionHours,
      desludgingYears,
      septicDepthM,
      septicLwRatio,
      soilPercolationRate,
      soilPercolationMinPer25mm,
      soakPitDiaM,
    ]
  );

  useEffect(() => {
    onWaterChangeRef.current?.(waterParams);
  }, [waterParams]);

  useEffect(() => {
    onSepticChangeRef.current?.(septicParams);
  }, [septicParams]);

  const waterEnvelope = useMemo(() => computeWaterReservoirDesign(waterParams), [waterParams]);
  const waterCalc = waterEnvelope.result!;

  const septicEnvelope = useMemo(() => computeSepticSoakPitDesign(septicParams), [septicParams]);
  const septicCalc = septicEnvelope.result!;

  const handleSelectOccupancyPreset = (presetId: WaterOccupancyPreset) => {
    setOccupancyPreset(presetId);
    const found = WATER_OCCUPANCY_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setLpcd(found.lpcd);
    }
  };

  const handlePercolationMinChange = (mins: number) => {
    const safeMin = Math.max(1, Math.min(90, mins));
    setSoilPercolationMinPer25mm(safeMin);
    setSoilPercolationRate(percolationMinToInfiltrationRate(safeMin));
  };

  const handleSendToBOQ = () => {
    if (!onSendToBOQ) return;
    const items = buildBoqItemsFromTanks(waterCalc, septicCalc, {
      includeExcavation,
      includeWaterRcc,
      includeSepticMasonrySlabs,
    });
    if (items.length === 0) return;
    onSendToBOQ(items);
    setBoqSentBanner(`Pushed ${items.length} line item(s) to BOQ Estimator`);
    setTimeout(() => setBoqSentBanner(''), 3500);
  };

  const handleSendToRebar = (target: 'ugwr' | 'oht' | 'septic') => {
    if (!onSendTankToRebar) return;
    onSendTankToRebar(buildRebarParamsFromTank(target, waterCalc, septicCalc));
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Parameter', 'Value', 'Unit', 'Specification'];
    if (activeTab === 'water-reservoirs') {
      const rows: (string | number)[][] = [
        ['Occupancy Preset', waterCalc.occupancyLabel, '-', 'BNBC Table 8.5.1'],
        ['Total Calculated Occupants', waterCalc.totalUsers, 'persons', 'Residents + floating'],
        ['Per Capita Daily Demand', waterCalc.lpcd, 'LPCD', 'Design potable demand'],
        ['Storage Buffer', storageDays, 'day(s)', 'Municipal supply buffer'],
        ['Firefighting Reserve', waterCalc.fireReserveL, 'Litres', `${waterCalc.fireReserveMinutes} min duration`],
        ['Net Daily Water Demand', Math.round(waterCalc.totalNetWaterL), 'Litres', `${waterCalc.totalNetWaterM3.toFixed(2)} m³ total`],
        ['UGWR Capacity', Math.round(waterCalc.ugwrTotalL), 'Litres', `${waterCalc.ugwrTotalM3.toFixed(2)} m³ (${ugwrSharePercent}% + fire)`],
        ['UGWR Dimensions (L x W x H)', `${waterCalc.ugwrLengthM.toFixed(2)} x ${waterCalc.ugwrWidthM.toFixed(2)} x ${waterCalc.ugwrTotalHeightM.toFixed(2)}`, 'm', 'Incl. 0.30m freeboard'],
        ['OHT Capacity', Math.round(waterCalc.ohtTotalL), 'Litres', `${waterCalc.ohtTotalM3.toFixed(2)} m³ (${waterCalc.ohtSharePercent}%)`],
        ['OHT Dimensions (L x W x H)', `${waterCalc.ohtLengthM.toFixed(2)} x ${waterCalc.ohtWidthM.toFixed(2)} x ${waterCalc.ohtTotalHeightM.toFixed(2)}`, 'm', 'Incl. 0.30m freeboard'],
        ['OHT Roof Dead Load (Water + RCC)', `${waterCalc.ohtTotalDeadLoadKn} kN (${waterCalc.ohtTotalDeadLoadTonnes} MT)`, 'kN', `${waterCalc.ohtRoofSlabPressureKpa} kN/m² roof pressure`],
        ['Transfer Pump Discharge', `${waterCalc.pumpFlowLpm.toFixed(1)} LPM (${waterCalc.pumpFlowM3Hr.toFixed(2)} m³/hr)`, 'flow', `${waterCalc.pumpFlowGpm.toFixed(1)} GPM (${pumpFillHours}h fill)`],
        ['Pump Total Head (Static + Friction)', `${waterCalc.staticHeadM} + ${waterCalc.frictionHeadM} = ${waterCalc.totalHeadM}`, 'm', 'Static lift + ~15% friction'],
        ['Recommended Motor Rating', `${waterCalc.recommendedHp} HP`, 'HP', `${waterCalc.recommendedKw} kW motor`],
      ];
      exportToCSV(`BD_CivilLab_Water_Reservoirs_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    } else {
      const rows: (string | number)[][] = [
        ['Contributing Users', septicUsers, 'persons', 'Design population'],
        ['Sewage Inflow Rate', sewageRateLpcd, 'LPCD', '80-90% domestic water'],
        ['Hydraulic Detention', detentionHours, 'hours', 'IS 2470 / BNBC 24h min'],
        ['Desludging Interval', desludgingYears, 'years', 'Sludge cleaning interval'],
        ['Daily Sewage Inflow', Math.round(septicCalc.dailySewageL), 'Litres', `${septicCalc.dailySewageM3.toFixed(2)} m³/day`],
        ['Liquid Retention Volume', Number(septicCalc.liquidRetentionM3.toFixed(2)), 'm³', 'Settling zone'],
        ['Sludge Storage Volume', Number(septicCalc.sludgeVolumeM3.toFixed(2)), 'm³', '0.07 m³/capita/yr'],
        ['Scum Allowance Volume', Number(septicCalc.scumAllowanceM3.toFixed(2)), 'm³', '0.015 m³/capita'],
        ['Total Septic Tank Volume', Number(septicCalc.totalSepticVolumeM3.toFixed(2)), 'm³', `~${Math.round(septicCalc.totalSepticVolumeL)} Litres`],
        ['Tank Dimensions (L x W x H)', `${septicCalc.tankLengthM.toFixed(2)} x ${septicCalc.tankWidthM.toFixed(2)} x ${septicCalc.totalTankHeightM.toFixed(2)}`, 'm', `L:W = ${septicCalc.lwRatioActual}:1`],
        ['Chamber 1 / Chamber 2 (2/3 : 1/3)', `${septicCalc.chamber1LengthM.toFixed(2)} / ${septicCalc.chamber2LengthM.toFixed(2)}`, 'm', 'Baffle wall partition'],
        ['Soil Percolation Test', septicCalc.soilPercolationMinPer25mm, 'min/25mm', `Ir = ${septicCalc.soilInfiltrationRateLpdM2} L/m²/day`],
        ['Required Sidewall Absorption Area', Number(septicCalc.requiredAbsorptionAreaM2.toFixed(2)), 'm²', 'Excluding pit bottom per code'],
        ['Soak Pit Internal Dia & Total Depth', `Dia ${soakPitDiaM.toFixed(1)}m x ${septicCalc.soakPitTotalDepthM.toFixed(2)}m`, 'm', `Gravel envelope Dia ${septicCalc.gravelEnvelopeOuterDiaM}m`],
      ];
      exportToCSV(`BD_CivilLab_Septic_System_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    }
  };

  // Certified PDF Export (single tab)
  const handleExportPDF = async () => {
    if (activeTab === 'water-reservoirs') {
      await generateEngineeringPDF(
        {
          projectMeta: {
            projectName: 'Water Reservoir (UGWR & OHT) & Pump Sizing Assessment',
            projectCode: 'MEP-WATER-2026',
            client: 'Building Services & Water Supply Division',
            location: 'Plumbing Engineering Submittal',
            date: new Date().toISOString().slice(0, 10),
            unitSystem: 'SI' as const,
            engineerName: 'Design Engineer, PE',
          },
          moduleMeta: {
            moduleId: 'water-reservoir-sizer',
            moduleTitle: 'WATER RESERVOIRS (UGWR / OHT) & PUMP SIZING REPORT',
            standard: 'BNBC 2020 Part 8 Chap 5 / IS 1172 / NFPA 22',
            status: waterCalc.overallCompliant ? 'SAFE' : 'WARNING',
          },
          inputs: [
            { name: 'Occupancy Demand Class', symbol: 'Preset', value: waterCalc.occupancyLabel, unit: 'LPCD' },
            { name: 'Total Contributing Occupants', symbol: 'N_pop', value: waterCalc.totalUsers, unit: 'persons' },
            { name: 'Per Capita Daily Demand', symbol: 'LPCD', value: waterCalc.lpcd, unit: 'L/person/day' },
            { name: 'Storage Buffer Duration', symbol: 'T_store', value: storageDays, unit: 'days' },
            { name: 'Firefighting Reserve', symbol: 'V_fire', value: `${waterCalc.fireReserveL} (${waterCalc.fireReserveMinutes} min)`, unit: 'L' },
            { name: 'UGWR Allocation Share', symbol: 'Ratio_ugwr', value: `${ugwrSharePercent}%`, unit: '%' },
            { name: 'Total Pump Head (Static+Friction)', symbol: 'H_head', value: `${waterCalc.staticHeadM} + ${waterCalc.frictionHeadM} = ${totalHeadM}`, unit: 'm' },
          ],
          outputs: [
            { name: 'Total Net Water Demand', symbol: 'Q_total', value: Math.round(waterCalc.totalNetWaterL), unit: 'Litres', status: 'PASS' as const },
            { name: 'UGWR Volume & Clear Box', symbol: 'V_ugwr', value: `${Math.round(waterCalc.ugwrTotalL)} L (${waterCalc.ugwrLengthM.toFixed(2)}x${waterCalc.ugwrWidthM.toFixed(2)}x${waterCalc.ugwrTotalHeightM.toFixed(2)}m)`, unit: 'L', status: 'PASS' as const },
            { name: 'OHT Volume & Clear Box', symbol: 'V_oht', value: `${Math.round(waterCalc.ohtTotalL)} L (${waterCalc.ohtLengthM.toFixed(2)}x${waterCalc.ohtWidthM.toFixed(2)}x${waterCalc.ohtTotalHeightM.toFixed(2)}m)`, unit: 'L', status: 'PASS' as const },
            { name: 'OHT Roof Structural Dead Load', symbol: 'W_oht', value: `${waterCalc.ohtTotalDeadLoadKn} kN (${waterCalc.ohtRoofSlabPressureKpa} kN/m2)`, unit: 'kN', status: waterCalc.ohtRoofSlabPressureKpa <= 30 ? 'PASS' : 'WARNING' },
            { name: 'Transfer Pump Discharge', symbol: 'Q_pump', value: `${waterCalc.pumpFlowLpm.toFixed(1)} LPM / ${waterCalc.pumpFlowM3Hr.toFixed(2)} m3/hr`, unit: 'flow', status: 'PASS' as const },
            { name: 'Recommended Pump Motor', symbol: 'P_motor', value: `${waterCalc.recommendedHp} HP (${waterCalc.recommendedKw} kW)`, unit: 'HP', status: 'PASS' as const },
          ],
          stepByStepFormulas: waterEnvelope.handCalculationSteps?.map((s) => ({
            stepNumber: s.stepNumber,
            title: s.title,
            equation: s.formula,
            substitution: s.substitution,
            result: s.result,
            remarks: s.reasoning,
          })),
          governingAssumptions: [
            'Fire reserve stored inside UGWR with 300mm freeboard clear air gap above top water level.',
            'OHT structural dead load includes stored water (9.81 kN/m3) plus RCC base, walls, and cover slab (24 kN/m3).',
          ],
        },
        {
          filename: `BD_CivilLab_Water_Reservoirs_${new Date().toISOString().slice(0, 10)}.pdf`,
        }
      );
    } else {
      await generateEngineeringPDF(
        {
          projectMeta: {
            projectName: 'Septic Tank & Soak Well Sanitary Sizing Assessment',
            projectCode: 'SAN-SEPTIC-2026',
            client: 'Public Health Engineering Division',
            location: 'Building Sanitation & Effluent Submittal',
            date: new Date().toISOString().slice(0, 10),
            unitSystem: 'SI' as const,
            engineerName: 'Design Engineer, PE',
          },
          moduleMeta: {
            moduleId: 'septic-system-sizer',
            moduleTitle: 'SEPTIC TANK & SOAK PIT SANITATION DESIGN REPORT',
            standard: 'BNBC 2020 Part 8 Chap 6 / IS 2470',
            status: septicCalc.overallCompliant ? 'SAFE' : 'WARNING',
          },
          inputs: [
            { name: 'Contributing Design Population', symbol: 'N_users', value: septicUsers, unit: 'persons' },
            { name: 'Per Capita Sewage Inflow', symbol: 'Q_lpcd', value: sewageRateLpcd, unit: 'LPCD' },
            { name: 'Hydraulic Detention Time', symbol: 'T_det', value: detentionHours, unit: 'hours' },
            { name: 'Desludging Cleaning Interval', symbol: 'N_yr', value: desludgingYears, unit: 'years' },
            { name: 'Soil Percolation Time', symbol: 't_p', value: `${septicCalc.soilPercolationMinPer25mm} (Ir=${septicCalc.soilInfiltrationRateLpdM2} L/m2/d)`, unit: 'min/25mm' },
          ],
          outputs: [
            { name: 'Daily Sewage Inflow', symbol: 'Q_daily', value: `${septicCalc.dailySewageL} L (${septicCalc.dailySewageM3.toFixed(2)} m3/d)`, unit: 'L/day', status: 'PASS' as const },
            { name: 'Total Septic Tank Capacity', symbol: 'V_septic', value: `${septicCalc.totalSepticVolumeM3.toFixed(2)} m3 (${Math.round(septicCalc.totalSepticVolumeL)} L)`, unit: 'm3', status: 'PASS' as const },
            { name: 'Tank Internal Geometry', symbol: 'LxWxH', value: `${septicCalc.tankLengthM.toFixed(2)}m x ${septicCalc.tankWidthM.toFixed(2)}m x ${septicCalc.totalTankHeightM.toFixed(2)}m`, unit: 'm', status: septicCalc.lwRatioPass ? 'PASS' : 'WARNING' },
            { name: 'Soak Pit Sidewall Absorption Area', symbol: 'A_wall', value: `${septicCalc.requiredAbsorptionAreaM2.toFixed(2)} m2 (excluding bottom)`, unit: 'm2', status: septicCalc.soilSuitableForSoakPit ? 'PASS' : 'WARNING' },
            { name: 'Soak Pit Diameter x Total Depth', symbol: 'DxH', value: `Dia ${soakPitDiaM.toFixed(1)}m x ${septicCalc.soakPitTotalDepthM.toFixed(2)}m`, unit: 'm', status: 'PASS' as const },
          ],
          stepByStepFormulas: septicEnvelope.handCalculationSteps?.map((s) => ({
            stepNumber: s.stepNumber,
            title: s.title,
            equation: s.formula,
            substitution: s.substitution,
            result: s.result,
            remarks: s.reasoning,
          })),
          governingAssumptions: [
            'Two-chamber tank split 2/3 primary settling & 1/3 secondary quiescent zone with submerged baffle wall.',
            'Soak pit absorption calculated strictly on cylindrical sidewall area (bottom excluded per IS 2470 / BNBC).',
          ],
        },
        {
          filename: `BD_CivilLab_Septic_System_${new Date().toISOString().slice(0, 10)}.pdf`,
        }
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Action Strip */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 uppercase">
                BNBC 2020 Part 8
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                Water Reservoir (UGWR/OHT) &amp; Septic Tank / Soak Pit Designer
              </h2>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
              Occupancy LPCD Presets · NFPA/BNBC Fire Reserve · OHT Roof Dead Load · Percolation &amp; Soak Well Sidewall
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
          </div>
        </div>

        {/* Sub-Navigation & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('water-reservoirs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'water-reservoirs'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>Water Reservoirs (UGWR &amp; OHT)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('septic-system')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'septic-system'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Septic Tank &amp; Soak Pit</span>
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

        {/* Cross-Module BOQ & Rebar BBS Integration Bar */}
        {(onSendToBOQ || onSendTankToRebar) && (
          <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="font-mono font-bold uppercase text-[var(--md-sys-color-on-surface-variant)]">
                BOQ Scope:
              </span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--md-sys-color-on-surface)]">
                <input
                  type="checkbox"
                  checked={includeExcavation}
                  onChange={(e) => setIncludeExcavation(e.target.checked)}
                  className="rounded accent-emerald-600"
                />
                <span>Excavation</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--md-sys-color-on-surface)]">
                <input
                  type="checkbox"
                  checked={includeWaterRcc}
                  onChange={(e) => setIncludeWaterRcc(e.target.checked)}
                  className="rounded accent-cyan-600"
                />
                <span>UGWR &amp; OHT RCC</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--md-sys-color-on-surface)]">
                <input
                  type="checkbox"
                  checked={includeSepticMasonrySlabs}
                  onChange={(e) => setIncludeSepticMasonrySlabs(e.target.checked)}
                  className="rounded accent-emerald-600"
                />
                <span>Septic Brick/Slabs &amp; Soak Well</span>
              </label>
              {boqSentBanner && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {boqSentBanner}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onSendToBOQ && (
                <button
                  type="button"
                  onClick={handleSendToBOQ}
                  disabled={!includeExcavation && !includeWaterRcc && !includeSepticMasonrySlabs}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Push Selected to BOQ</span>
                </button>
              )}
              {onSendTankToRebar && (
                <button
                  type="button"
                  onClick={() =>
                    handleSendToRebar(activeTab === 'water-reservoirs' ? 'ugwr' : 'septic')
                  }
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    Send {activeTab === 'water-reservoirs' ? 'UGWR Slab' : 'Septic Slab'} to Rebar BBS
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          TAB 1: WATER RESERVOIRS (UGWR & OHT)
          ===================================================================== */}
      {activeTab === 'water-reservoirs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  <span>Occupancy &amp; Demand Setup</span>
                </h3>
                <div className="flex bg-[var(--md-sys-color-surface-container)] p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setCalcMode('building')}
                    className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                      calcMode === 'building' ? 'bg-cyan-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    By Building
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMode('occupants')}
                    className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                      calcMode === 'occupants' ? 'bg-cyan-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    Headcount
                  </button>
                </div>
              </div>

              {/* Occupancy Demand Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                  BNBC / IS 1172 Occupancy Demand Preset
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {WATER_OCCUPANCY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectOccupancyPreset(preset.id)}
                      className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                        occupancyPreset === preset.id
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold'
                          : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                      }`}
                    >
                      <div className="truncate">{preset.label.split(' (')[0]}</div>
                      <div className="font-mono text-[10px] opacity-80">{preset.lpcd} LPCD</div>
                    </button>
                  ))}
                </div>
              </div>

              {calcMode === 'building' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Floors
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={numFloors}
                      onChange={(e) => setNumFloors(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Units/Floor
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={unitsPerFloor}
                      onChange={(e) => setUnitsPerFloor(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Persons/Unit
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={personsPerUnit}
                      onChange={(e) => setPersonsPerUnit(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Permanent Occupants
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={directOccupants}
                      onChange={(e) => setDirectOccupants(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Floating Visitors
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={floatingPopulation}
                      onChange={(e) => setFloatingPopulation(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                </div>
              )}

              {/* LPCD & Storage Days */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Demand Rate (LPCD)
                  </label>
                  <input
                    type="number"
                    min={15}
                    value={lpcd}
                    onChange={(e) => {
                      setOccupancyPreset('custom');
                      setLpcd(Math.max(15, Number(e.target.value)));
                    }}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Storage Buffer (Days)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={storageDays}
                    onChange={(e) => setStorageDays(Math.max(0.5, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              {/* BNBC / NFPA Firefighting Reserve Duration & Pump Flow */}
              <div className="space-y-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>BNBC / NFPA Fire Reserve</span>
                  </label>
                  <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400 font-bold">
                    {waterCalc.fireReserveL.toLocaleString()} L
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {[30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setFireReserveAutoMode(true);
                        setFireReserveMinutes(mins);
                      }}
                      className={`py-1 px-1.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                        fireReserveAutoMode && fireReserveMinutes === mins
                          ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                          : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {mins} min ({Math.round((firePumpFlowLpm * mins) / 1000)}k L)
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                      Fire Flow (L/min)
                    </label>
                    <input
                      type="number"
                      step="25"
                      min={0}
                      value={firePumpFlowLpm}
                      onChange={(e) => {
                        setFireReserveAutoMode(true);
                        setFirePumpFlowLpm(Math.max(0, Number(e.target.value)));
                      }}
                      className="w-full text-xs font-mono tabular-nums px-2 py-1 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                      Manual Fire Reserve (L)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min={0}
                      value={waterCalc.fireReserveL}
                      onChange={(e) => {
                        setFireReserveAutoMode(false);
                        setFireReserveL(Math.max(0, Number(e.target.value)));
                      }}
                      className="w-full text-xs font-mono tabular-nums px-2 py-1 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                </div>
              </div>

              {/* UGWR / OHT Allocation Slider */}
              <div className="space-y-1 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[var(--md-sys-color-on-surface)]">UGWR / OHT Domestic Split</span>
                  <span className="font-mono tabular-nums text-cyan-600 dark:text-cyan-400 font-bold">
                    {ugwrSharePercent}% UGWR / {100 - ugwrSharePercent}% OHT
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="80"
                  step="5"
                  value={ugwrSharePercent}
                  onChange={(e) => setUgwrSharePercent(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Geometric Depth & L:W Ratios */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    UGWR Water Depth (m)
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    min={1.0}
                    value={ugwrWaterDepthM}
                    onChange={(e) => setUgwrWaterDepthM(Math.max(1.0, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    OHT Water Depth (m)
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    min={0.8}
                    value={ohtWaterDepthM}
                    onChange={(e) => setOhtWaterDepthM(Math.max(0.8, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              {/* Pump Specs */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    OHT Fill Target (Hrs)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={pumpFillHours}
                    onChange={(e) => setPumpFillHours(Math.max(0.5, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Total Head Static+Fric (m)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min={5}
                    value={totalHeadM}
                    onChange={(e) => setTotalHeadM(Math.max(5, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results & 2D Section Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Net Water Summary Card */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 font-bold uppercase">
                  Total Net Domestic &amp; Fire Storage
                </span>
                <div className="text-2xl md:text-3xl font-black font-mono tabular-nums text-cyan-900 dark:text-cyan-100 mt-1">
                  {Math.round(waterCalc.totalNetWaterL).toLocaleString()}{' '}
                  <span className="text-sm font-normal">Litres</span>
                </div>
                <span className="text-xs text-slate-500 block mt-0.5 font-mono">
                  {waterCalc.totalUsers} occupants @ {waterCalc.lpcd} LPCD +{' '}
                  {waterCalc.fireReserveL.toLocaleString()} L fire ({waterCalc.fireReserveMinutes} min)
                </span>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-xs text-slate-500">Volumetric Total</div>
                <div className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                  {waterCalc.totalNetWaterM3.toFixed(2)} m³
                </div>
              </div>
            </div>

            {viewMode === 'schematics' ? (
              <>
                {/* Tank Dimension Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* UGWR Card */}
                  <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                      <div>
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                          Underground (UGWR)
                        </span>
                        <div className="text-base font-black font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
                          {Math.round(waterCalc.ugwrTotalL).toLocaleString()} L
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono tabular-nums bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">
                        {waterCalc.ugwrTotalM3.toFixed(1)} m³
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono tabular-nums">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Internal Box (L × W):</span>
                        <strong className="text-[var(--md-sys-color-on-surface)]">
                          {waterCalc.ugwrLengthM.toFixed(2)} × {waterCalc.ugwrWidthM.toFixed(2)} m
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Water Depth + FB:</span>
                        <strong className="text-[var(--md-sys-color-on-surface)]">
                          {ugwrWaterDepthM.toFixed(2)} + {waterCalc.ugwrFreeboardM.toFixed(2)} m
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-cyan-600 font-bold">Total Clear Height:</span>
                        <strong className="text-cyan-600 font-bold">
                          {waterCalc.ugwrTotalHeightM.toFixed(2)} m
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* OHT Card + Roof Slab Dead Load */}
                  <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                      <div>
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase">
                          Overhead Tank (OHT)
                        </span>
                        <div className="text-base font-black font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
                          {Math.round(waterCalc.ohtTotalL).toLocaleString()} L
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono tabular-nums bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
                        {waterCalc.ohtTotalM3.toFixed(1)} m³
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono tabular-nums">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Internal Box (L × W):</span>
                        <strong className="text-[var(--md-sys-color-on-surface)]">
                          {waterCalc.ohtLengthM.toFixed(2)} × {waterCalc.ohtWidthM.toFixed(2)} m
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Depth (+0.3m FB):</span>
                        <strong className="text-[var(--md-sys-color-on-surface)]">
                          {waterCalc.ohtTotalHeightM.toFixed(2)} m
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Weight className="w-3 h-3" />
                          Roof Dead Load:
                        </span>
                        <strong className="text-amber-600 dark:text-amber-400 font-bold">
                          {waterCalc.ohtTotalDeadLoadKn} kN ({waterCalc.ohtRoofSlabPressureKpa} kPa)
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transfer Pump Motor Sizing Card */}
                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-mono block">
                        Recommended Centrifugal Transfer Pump
                      </span>
                      <strong className="text-base md:text-lg font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
                        {waterCalc.recommendedHp} HP ({waterCalc.recommendedKw} kW)
                      </strong>
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums text-xs text-slate-500 space-y-0.5">
                    <div>
                      Flow:{' '}
                      <strong className="text-[var(--md-sys-color-on-surface)]">
                        {waterCalc.pumpFlowLpm.toFixed(1)} L/min
                      </strong>{' '}
                      |{' '}
                      <strong className="text-cyan-600 dark:text-cyan-400">
                        {waterCalc.pumpFlowM3Hr.toFixed(2)} m³/hr
                      </strong>
                    </div>
                    <div>
                      Head: <strong className="text-[var(--md-sys-color-on-surface)]">{waterCalc.staticHeadM}m</strong> static +{' '}
                      <strong className="text-[var(--md-sys-color-on-surface)]">{waterCalc.frictionHeadM}m</strong> friction ={' '}
                      <strong>{totalHeadM}m</strong>
                    </div>
                  </div>
                </div>

                {/* DCR Compliance Gauges */}
                <DcrGaugeSuite
                  gauges={waterCalc.dcrGauges}
                  moduleKey={`arch-water-${waterCalc.totalUsers}-${waterCalc.ugwrTotalL}`}
                  showAllInitially={true}
                />

                {/* 2D Schematic SVG for UGWR & OHT */}
                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-cyan-500" />
                    <span>Schematic Elevation — UGWR, Transfer Pump &amp; OHT Roof Load</span>
                  </span>

                  <svg
                    data-arch-svg="true"
                    viewBox="0 0 600 245"
                    className="w-full h-auto bg-[#0f172a] rounded-xl border border-[var(--md-sys-color-outline-variant)]"
                  >
                    {/* Ground Grade Line */}
                    <line x1="15" y1="55" x2="295" y2="55" stroke="#475569" strokeWidth="1.5" strokeDasharray="6 3" />
                    <text x="20" y="49" fill="#94a3b8" fontSize="8" fontFamily="monospace">GL ±0.00m</text>

                    {/* UGWR Tank (Left) */}
                    <g transform="translate(35, 58)">
                      <rect x="0" y="0" width="220" height="145" fill="#0284c7" fillOpacity="0.12" stroke="#38bdf8" strokeWidth="2.5" rx="3" />
                      <rect x="3" y="28" width="214" height="114" fill="#0284c7" fillOpacity="0.35" />
                      <line x1="3" y1="28" x2="217" y2="28" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" />
                      <text x="110" y="19" fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        Freeboard: {waterCalc.ugwrFreeboardM.toFixed(2)}m
                      </text>
                      <text x="110" y="68" fill="#e0f2fe" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        UGWR ({ugwrSharePercent}% + Fire)
                      </text>
                      <text x="110" y="88" fill="#38bdf8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                        {Math.round(waterCalc.ugwrTotalL).toLocaleString()} L ({waterCalc.ugwrLengthM.toFixed(1)}×{waterCalc.ugwrWidthM.toFixed(1)}×{waterCalc.ugwrTotalHeightM.toFixed(1)}m)
                      </text>
                      <text x="110" y="106" fill="#fda4af" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        Fire Reserve: {waterCalc.fireReserveL.toLocaleString()} L ({waterCalc.fireReserveMinutes} min)
                      </text>
                      <rect x="28" y="-8" width="42" height="8" fill="#64748b" rx="2" />
                      <line x1="185" y1="18" x2="185" y2="132" stroke="#f59e0b" strokeWidth="3" />
                      <circle cx="185" cy="132" r="4.5" fill="#f59e0b" />
                    </g>

                    {/* Transfer Pipe and Pump */}
                    <path d="M 220 76 L 325 76 L 325 45 L 355 45" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                    <circle cx="290" cy="76" r="11" fill="#10b981" />
                    <text x="290" y="79.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">P</text>
                    <text x="290" y="101" fill="#34d399" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                      {waterCalc.recommendedHp} HP · {waterCalc.pumpFlowM3Hr.toFixed(1)} m³/h
                    </text>

                    {/* OHT Tank (Right) */}
                    <g transform="translate(355, 22)">
                      <rect x="0" y="0" width="210" height="128" fill="#0ea5e9" fillOpacity="0.12" stroke="#38bdf8" strokeWidth="2.5" rx="3" />
                      <rect x="3" y="25" width="204" height="100" fill="#0ea5e9" fillOpacity="0.32" />
                      <line x1="3" y1="25" x2="207" y2="25" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" />
                      <text x="105" y="17" fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        FB: {waterCalc.ohtFreeboardM.toFixed(2)}m | H={waterCalc.ohtTotalHeightM.toFixed(2)}m
                      </text>
                      <text x="105" y="62" fill="#e0f2fe" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        OHT ({waterCalc.ohtSharePercent}%)
                      </text>
                      <text x="105" y="81" fill="#38bdf8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                        {Math.round(waterCalc.ohtTotalL).toLocaleString()} L ({waterCalc.ohtLengthM.toFixed(1)}×{waterCalc.ohtWidthM.toFixed(1)}m)
                      </text>
                      <text x="105" y="100" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        Roof Load: {waterCalc.ohtTotalDeadLoadKn} kN ({waterCalc.ohtRoofSlabPressureKpa} kPa)
                      </text>
                      <rect x="25" y="-8" width="36" height="8" fill="#64748b" rx="2" />
                      {/* Supporting roof columns */}
                      <rect x="12" y="128" width="10" height="55" fill="#64748b" />
                      <rect x="188" y="128" width="10" height="55" fill="#64748b" />
                      <line x1="-15" y1="183" x2="225" y2="183" stroke="#94a3b8" strokeWidth="3" />
                      <text x="105" y="198" fill="#94a3b8" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                        Roof Structural Slab Bearing
                      </text>
                    </g>
                  </svg>
                </div>
              </>
            ) : (
              <StepByStepPanel
                moduleTitle="Water Reservoir & Pump Sizing Hand Calculations"
                steps={waterEnvelope.handCalculationSteps}
                scopeAndLimits={waterEnvelope.scopeAndLimits}
              />
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: SEPTIC TANK & SOAK PIT
          ===================================================================== */}
      {activeTab === 'septic-system' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Sanitary Inflow &amp; Digestion Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Users (Population)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={septicUsers}
                    onChange={(e) => setSepticUsers(Math.max(5, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Sewage Rate (LPCD)
                  </label>
                  <input
                    type="number"
                    min={30}
                    value={sewageRateLpcd}
                    onChange={(e) => setSewageRateLpcd(Math.max(30, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Detention Period (Hrs)
                  </label>
                  <input
                    type="number"
                    step="6"
                    min={12}
                    value={detentionHours}
                    onChange={(e) => setDetentionHours(Math.max(12, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Desludging Cycle (IS 2470)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1.0, 2.0, 3.0].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setDesludgingYears(yr)}
                        className={`py-1.5 px-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                          desludgingYears === yr
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                        }`}
                      >
                        {yr} yr
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tank Geometry Setup */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Liquid Depth (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={1.0}
                    value={septicDepthM}
                    onChange={(e) => setSepticDepthM(Math.max(1.0, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    L : W Ratio (2.0–4.0)
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    min={1.5}
                    max={4.5}
                    value={septicLwRatio}
                    onChange={(e) => setSepticLwRatio(Math.max(1.5, Number(e.target.value)))}
                    className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              {/* Soil Percolation Rate (min/25mm) & Soak Pit */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Soak Pit Soil Percolation (min/25mm)
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-cyan-600 dark:text-cyan-400 font-bold">
                    I_r = {septicCalc.soilInfiltrationRateLpdM2} L/m²/d
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {SOIL_PERCOLATION_PRESETS.map((soil) => (
                    <button
                      key={soil.label}
                      type="button"
                      onClick={() => handlePercolationMinChange(soil.minPer25mm)}
                      className={`px-2 py-1 text-left rounded-lg border text-[10px] transition-colors cursor-pointer ${
                        Math.abs(soilPercolationMinPer25mm - soil.minPer25mm) <= 2
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {soil.label} ({soil.minPer25mm} min)
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Percolation (min/25mm)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={soilPercolationMinPer25mm}
                      onChange={(e) => handlePercolationMinChange(Number(e.target.value))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Pit Internal Dia (m)
                    </label>
                    <input
                      type="number"
                      step="0.2"
                      min={0.9}
                      value={soakPitDiaM}
                      onChange={(e) => setSoakPitDiaM(Math.max(0.9, Number(e.target.value)))}
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results & Longitudinal Section Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Metric Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 block">
                  Total Tank Capacity
                </span>
                <div className="text-xl md:text-2xl font-bold font-mono tabular-nums text-emerald-900 dark:text-emerald-100 mt-0.5">
                  {septicCalc.totalSepticVolumeM3.toFixed(2)}{' '}
                  <span className="text-xs font-normal">m³</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                  ~{Math.round(septicCalc.totalSepticVolumeL).toLocaleString()} L (incl. scum)
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300 block">
                  Effluent Wall Area (A)
                </span>
                <div className="text-xl md:text-2xl font-bold font-mono tabular-nums text-teal-900 dark:text-teal-100 mt-0.5">
                  {septicCalc.requiredAbsorptionAreaM2.toFixed(1)}{' '}
                  <span className="text-xs font-normal">m²</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                  Q / I_r (bottom excluded)
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 block">
                  Soak Pit Total Depth
                </span>
                <div className="text-xl md:text-2xl font-bold font-mono tabular-nums text-cyan-900 dark:text-cyan-100 mt-0.5">
                  {septicCalc.soakPitTotalDepthM.toFixed(2)}{' '}
                  <span className="text-xs font-normal">m</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                  Internal Ø {soakPitDiaM.toFixed(1)}m (+gravel)
                </span>
              </div>
            </div>

            {viewMode === 'schematics' ? (
              <>
                {/* 2-Chamber Septic Tank Dimensions Card */}
                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                    <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
                      2-Chamber Septic Tank &amp; Baffle Schedule
                    </h4>
                    <span
                      className={`text-xs font-mono font-bold flex items-center gap-1 ${
                        septicCalc.lwRatioPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                      }`}
                    >
                      {septicCalc.lwRatioPass ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      L : W = {septicCalc.lwRatioActual} : 1
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono tabular-nums">
                    <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-center">
                      <span className="text-slate-500 block text-[10px]">Length (L)</span>
                      <strong className="text-sm text-[var(--md-sys-color-on-surface)]">
                        {septicCalc.tankLengthM.toFixed(2)} m
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-center">
                      <span className="text-slate-500 block text-[10px]">Width (W)</span>
                      <strong className="text-sm text-[var(--md-sys-color-on-surface)]">
                        {septicCalc.tankWidthM.toFixed(2)} m
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-center">
                      <span className="text-slate-500 block text-[10px]">Liquid Depth</span>
                      <strong className="text-sm text-[var(--md-sys-color-on-surface)]">
                        {septicDepthM.toFixed(2)} m
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-center">
                      <span className="text-slate-500 block text-[10px]">Total (+0.35m FB)</span>
                      <strong className="text-sm text-emerald-600 dark:text-emerald-400">
                        {septicCalc.totalTankHeightM.toFixed(2)} m
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums text-slate-500">
                    <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container)] flex justify-between">
                      <span>Chamber 1 (2/3 L):</span>
                      <strong className="text-[var(--md-sys-color-on-surface)]">
                        {septicCalc.chamber1LengthM.toFixed(2)} m
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container)] flex justify-between">
                      <span>Chamber 2 (1/3 L):</span>
                      <strong className="text-[var(--md-sys-color-on-surface)]">
                        {septicCalc.chamber2LengthM.toFixed(2)} m
                      </strong>
                    </div>
                  </div>
                </div>

                {/* DCR Compliance Gauges */}
                <DcrGaugeSuite
                  gauges={septicCalc.dcrGauges}
                  moduleKey={`arch-septic-${septicCalc.septicUsers}-${septicCalc.soilPercolationMinPer25mm}`}
                  showAllInitially={true}
                />

                {/* Upgraded Longitudinal 2D CAD SVG Schematic */}
                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-emerald-500" />
                    <span>
                      Longitudinal Section: 2-Chamber Septic Tank &amp; Brick-Lined Soak Pit
                    </span>
                  </span>

                  <svg
                    data-arch-svg="true"
                    viewBox="0 0 640 250"
                    className="w-full h-auto bg-[#0f172a] rounded-xl border border-[var(--md-sys-color-outline-variant)]"
                  >
                    {/* Ground level */}
                    <line x1="10" y1="38" x2="630" y2="38" stroke="#64748b" strokeWidth="1.5" strokeDasharray="6 3" />
                    <text x="16" y="32" fill="#94a3b8" fontSize="8" fontFamily="monospace">GL ±0.00m</text>

                    {/* Septic Tank Container */}
                    <g transform="translate(28, 45)">
                      {/* Vent Pipe with Cowl */}
                      <path d="M 325 0 L 325 -32 L 333 -32" fill="none" stroke="#cbd5e1" strokeWidth="3" />
                      <circle cx="335" cy="-32" r="3" fill="#f59e0b" />
                      <text x="278" y="-23" fill="#cbd5e1" fontSize="8" fontFamily="monospace">Vent Ø75mm</text>

                      {/* RCC Cover Slab & Manholes */}
                      <rect x="-4" y="-6" width="358" height="7" fill="#64748b" rx="1" />
                      <rect x="65" y="-11" width="44" height="6" fill="#94a3b8" rx="1" />
                      <rect x="260" y="-11" width="44" height="6" fill="#94a3b8" rx="1" />

                      {/* Tank Boundary */}
                      <rect x="0" y="1" width="350" height="162" fill="#064e3b" fillOpacity="0.16" stroke="#10b981" strokeWidth="2.5" rx="2" />

                      {/* Scum Layer */}
                      <rect x="2" y="28" width="346" height="16" fill="#d97706" fillOpacity="0.35" />
                      <text x="118" y="39" fill="#fbbf24" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                        Scum &amp; Freeboard ({septicCalc.freeboardM}m)
                      </text>

                      {/* Liquid Settling Zone */}
                      <rect x="2" y="44" width="346" height="80" fill="#047857" fillOpacity="0.32" />

                      {/* Digested Sludge Zone */}
                      <rect x="2" y="124" width="346" height="37" fill="#334155" fillOpacity="0.75" />
                      <text x="175" y="146" fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        Sludge Storage ({septicCalc.sludgeVolumeM3.toFixed(2)} m³ / {desludgingYears}yr)
                      </text>

                      {/* Hanging Scum Baffle at Inlet */}
                      <line x1="42" y1="2" x2="42" y2="62" stroke="#fbbf24" strokeWidth="3" />
                      {/* Division Baffle Wall at 2/3 L */}
                      <line x1="233" y1="2" x2="233" y2="128" stroke="#10b981" strokeWidth="4" />
                      <rect x="230" y="72" width="6" height="24" fill="#0f172a" />
                      <text x="233" y="112" fill="#34d399" fontSize="8" textAnchor="middle" fontFamily="monospace">
                        2/3 L Baffle
                      </text>

                      {/* Chamber Labels */}
                      <text x="135" y="84" fill="#a7f3d0" fontSize="10.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        Chamber 1 ({septicCalc.chamber1LengthM.toFixed(2)}m)
                      </text>
                      <text x="292" y="84" fill="#a7f3d0" fontSize="10.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        C2 ({septicCalc.chamber2LengthM.toFixed(2)}m)
                      </text>

                      {/* Inlet Sanitary T-Pipe */}
                      <path d="M -22 36 L 22 36 L 22 72" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <text x="-20" y="29" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace">Inlet</text>

                      {/* Outlet Sanitary T-Pipe to Soak Pit */}
                      <path d="M 328 74 L 328 42 L 442 42" fill="none" stroke="#38bdf8" strokeWidth="3.5" />
                      <text x="385" y="34" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                        Effluent Ø100mm
                      </text>

                      {/* Tank Overall Dimension Line */}
                      <line x1="0" y1="176" x2="350" y2="176" stroke="#10b981" strokeWidth="1" />
                      <text x="175" y="190" fill="#34d399" fontSize="9.5" textAnchor="middle" fontFamily="monospace">
                        L = {septicCalc.tankLengthM.toFixed(2)}m × W = {septicCalc.tankWidthM.toFixed(2)}m × H = {septicCalc.totalTankHeightM.toFixed(2)}m
                      </text>
                    </g>

                    {/* Brick-Lined Soak Pit with Gravel Envelope (Right) */}
                    <g transform="translate(468, 45)">
                      {/* Outer Gravel / Brick-Bat Envelope */}
                      <rect x="-22" y="12" width="144" height="154" fill="#475569" fillOpacity="0.28" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 2" />
                      {/* Aggregate pebbles illustration */}
                      <circle cx="-12" cy="40" r="2.5" fill="#94a3b8" />
                      <circle cx="-10" cy="70" r="2.5" fill="#94a3b8" />
                      <circle cx="-13" cy="105" r="2.5" fill="#94a3b8" />
                      <circle cx="112" cy="50" r="2.5" fill="#94a3b8" />
                      <circle cx="110" cy="90" r="2.5" fill="#94a3b8" />
                      <circle cx="113" cy="125" r="2.5" fill="#94a3b8" />

                      {/* Honeycomb Brick Cylinder */}
                      <rect x="0" y="12" width="100" height="148" fill="#047857" fillOpacity="0.16" stroke="#34d399" strokeWidth="2.5" strokeDasharray="6 3" />
                      <rect x="-12" y="4" width="124" height="8" fill="#64748b" rx="2" />

                      <text x="50" y="54" fill="#e2e8f0" fontSize="10.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        SOAK PIT
                      </text>
                      <text x="50" y="72" fill="#34d399" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        Ø {soakPitDiaM.toFixed(1)}m Internal
                      </text>
                      <text x="50" y="88" fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        H = {septicCalc.soakPitTotalDepthM.toFixed(2)}m
                      </text>
                      <text x="50" y="106" fill="#38bdf8" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                        A_wall = {septicCalc.requiredAbsorptionAreaM2.toFixed(1)} m²
                      </text>
                      <text x="50" y="124" fill="#fbbf24" fontSize="8" textAnchor="middle" fontFamily="monospace">
                        {septicCalc.soilPercolationMinPer25mm} min/25mm
                      </text>
                      <text x="50" y="182" fill="#94a3b8" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                        +150mm Filter Gravel Envelope
                      </text>
                    </g>
                  </svg>
                </div>
              </>
            ) : (
              <StepByStepPanel
                moduleTitle="Septic Tank & Soak Pit Hand Calculations"
                steps={septicEnvelope.handCalculationSteps}
                scopeAndLimits={septicEnvelope.scopeAndLimits}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
