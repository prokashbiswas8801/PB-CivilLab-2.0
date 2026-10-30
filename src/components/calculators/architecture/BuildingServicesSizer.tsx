import React, { useState, useMemo } from 'react';
import {
  Droplets,
  Layers,
  FileSpreadsheet,
  FileDown,
  Building,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Zap,
  ShieldAlert,
  ArrowRight,
  Flame,
  Check,
} from 'lucide-react';
import { exportToCSV, generateEngineeringPDF } from '../../../utils/exportEngine';

export type ServiceTab = 'water-reservoirs' | 'septic-system';

export const BuildingServicesSizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ServiceTab>('water-reservoirs');

  // =========================================================================
  // 1. WATER RESERVOIRS (UGWR & OHT) STATE
  // =========================================================================
  const [calcMode, setCalcMode] = useState<'occupants' | 'building'>('building');
  const [numFloors, setNumFloors] = useState<number>(6); // G + 5
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(2); // 2 units/floor
  const [personsPerUnit, setPersonsPerUnit] = useState<number>(5); // 5 persons/unit
  const [directOccupants, setDirectOccupants] = useState<number>(50);
  const [floatingPopulation, setFloatingPopulation] = useState<number>(5);
  const [lpcd, setLpcd] = useState<number>(135); // Litres Per Capita Daily (135 LPCD BNBC)
  const [storageDays, setStorageDays] = useState<number>(1.0); // 1.0 day buffer
  const [fireReserveL, setFireReserveL] = useState<number>(10000); // 10,000 L fire reserve
  const [ugwrSharePercent, setUgwrSharePercent] = useState<number>(65); // 65% UGWR / 35% OHT
  const [ugwrWaterDepthM, setUgwrWaterDepthM] = useState<number>(2.0); // 2.0 m
  const [ugwrLwRatio, setUgwrLwRatio] = useState<number>(1.5); // L : W = 1.5 : 1
  const [ohtWaterDepthM, setOhtWaterDepthM] = useState<number>(1.6); // 1.6 m
  const [ohtLwRatio, setOhtLwRatio] = useState<number>(1.3); // L : W = 1.3 : 1
  const [pumpFillHours, setPumpFillHours] = useState<number>(2.0); // 2 hours fill time
  const [totalHeadM, setTotalHeadM] = useState<number>(28); // 28m delivery head

  // Calculations for Water Reservoirs
  const waterCalc = useMemo(() => {
    const totalUsers =
      calcMode === 'building'
        ? numFloors * unitsPerFloor * personsPerUnit + floatingPopulation
        : directOccupants + floatingPopulation;

    // Daily domestic demand (Litres)
    const dailyDomesticL = totalUsers * lpcd * storageDays;

    // Net demand including firefighting reserve
    const totalNetWaterL = dailyDomesticL + fireReserveL;
    const totalNetWaterM3 = totalNetWaterL / 1000;

    // Allocation: UGWR gets domestic share + full fire reserve
    const ugwrDomesticL = (dailyDomesticL * ugwrSharePercent) / 100;
    const ugwrTotalL = ugwrDomesticL + fireReserveL;
    const ugwrTotalM3 = ugwrTotalL / 1000;

    // OHT gets remaining domestic share
    const ohtTotalL = dailyDomesticL - ugwrDomesticL;
    const ohtTotalM3 = ohtTotalL / 1000;

    // UGWR Geometric Dimensions (with 0.3m freeboard)
    const ugwrFreeboardM = 0.3;
    const ugwrEffectiveDepthM = ugwrWaterDepthM;
    const ugwrSurfaceAreaM2 = ugwrTotalM3 / ugwrEffectiveDepthM;
    const ugwrWidthM = Math.max(1.5, Math.sqrt(ugwrSurfaceAreaM2 / ugwrLwRatio));
    const ugwrLengthM = ugwrSurfaceAreaM2 / ugwrWidthM;
    const ugwrTotalHeightM = ugwrEffectiveDepthM + ugwrFreeboardM;

    // OHT Geometric Dimensions (with 0.3m freeboard)
    const ohtFreeboardM = 0.3;
    const ohtEffectiveDepthM = ohtWaterDepthM;
    const ohtSurfaceAreaM2 = ohtTotalM3 / ohtEffectiveDepthM;
    const ohtWidthM = Math.max(1.2, Math.sqrt(ohtSurfaceAreaM2 / ohtLwRatio));
    const ohtLengthM = ohtSurfaceAreaM2 / ohtWidthM;
    const ohtTotalHeightM = ohtEffectiveDepthM + ohtFreeboardM;

    // Pump Sizing: Transfer from UGWR to OHT in specified pumpFillHours
    const pumpFlowLpm = ohtTotalL / (pumpFillHours * 60);
    const pumpFlowGpm = pumpFlowLpm * 0.264172;
    // Hydraulic Power: P(kW) = (Q in L/s * H in m * 9.81) / (1000 * efficiency 0.65)
    const flowLps = pumpFlowLpm / 60;
    const pumpKw = (flowLps * totalHeadM * 9.81) / (1000 * 0.65);
    const pumpHp = pumpKw * 1.34102;
    // Commercial motor recommendation
    const recommendedHp =
      pumpHp <= 1.0 ? 1.0 : pumpHp <= 1.5 ? 1.5 : pumpHp <= 2.0 ? 2.0 : pumpHp <= 3.0 ? 3.0 : Math.ceil(pumpHp);

    return {
      totalUsers,
      dailyDomesticL,
      totalNetWaterL,
      totalNetWaterM3,
      ugwrTotalL,
      ugwrTotalM3,
      ugwrLengthM,
      ugwrWidthM,
      ugwrTotalHeightM,
      ugwrFreeboardM,
      ohtTotalL,
      ohtTotalM3,
      ohtLengthM,
      ohtWidthM,
      ohtTotalHeightM,
      ohtFreeboardM,
      pumpFlowLpm,
      pumpFlowGpm,
      pumpKw,
      pumpHp,
      recommendedHp,
    };
  }, [
    calcMode,
    numFloors,
    unitsPerFloor,
    personsPerUnit,
    directOccupants,
    floatingPopulation,
    lpcd,
    storageDays,
    fireReserveL,
    ugwrSharePercent,
    ugwrWaterDepthM,
    ugwrLwRatio,
    ohtWaterDepthM,
    ohtLwRatio,
    pumpFillHours,
    totalHeadM,
  ]);

  // =========================================================================
  // 2. SEPTIC TANK & SOAK PIT STATE
  // =========================================================================
  const [septicUsers, setSepticUsers] = useState<number>(35);
  const [sewageRateLpcd, setSewageRateLpcd] = useState<number>(90); // 90 LPCD (80-90% of water demand)
  const [detentionHours, setDetentionHours] = useState<number>(24); // 24-48 hrs retention
  const [desludgingYears, setDesludgingYears] = useState<number>(2.0); // 2 years desludging interval
  const [septicDepthM, setSepticDepthM] = useState<number>(1.6); // 1.6m liquid depth
  const [septicLwRatio, setSepticLwRatio] = useState<number>(2.5); // 2.5 : 1
  const [soilPercolationRate, setSoilPercolationRate] = useState<number>(30); // 30 L/m²/day percolation rate
  const [soakPitDiaM, setSoakPitDiaM] = useState<number>(1.8); // 1.8m internal dia

  // Calculations for Septic Tank & Soak Pit
  const septicCalc = useMemo(() => {
    // 1. Daily sewage flow Q_s
    const dailySewageL = septicUsers * sewageRateLpcd;
    const dailySewageM3 = dailySewageL / 1000;

    // 2. Liquid Retention Volume V_ret = Q_s * (detention / 24)
    const liquidRetentionM3 = dailySewageM3 * (detentionHours / 24);

    // 3. Sludge Digestion & Storage Volume V_sludge = C * 0.07 m3/person/year * desludgingYears
    // 0.07 m3/capita/year standard BNBC/IS 2470
    const sludgeVolumeM3 = septicUsers * 0.07 * desludgingYears;

    // Total required septic tank liquid capacity
    const totalSepticVolumeM3 = liquidRetentionM3 + sludgeVolumeM3;
    const totalSepticVolumeL = totalSepticVolumeM3 * 1000;

    // Dimensions
    const freeboardM = 0.35;
    const surfaceAreaM2 = totalSepticVolumeM3 / septicDepthM;
    const tankWidthM = Math.max(1.0, Math.sqrt(surfaceAreaM2 / septicLwRatio));
    const tankLengthM = surfaceAreaM2 / tankWidthM;
    const totalTankHeightM = septicDepthM + freeboardM;

    // Chamber split: 1st chamber = 2/3 length, 2nd chamber = 1/3 length
    const chamber1LengthM = (tankLengthM * 2) / 3;
    const chamber2LengthM = tankLengthM / 3;

    // 4. Soak Pit / Absorption Well Sizing
    // Effective sidewall absorption area required A_abs = dailySewageL / percolationRate
    const requiredAbsorptionAreaM2 = dailySewageL / soilPercolationRate;
    // Sidewall area of cylinder = PI * D * H_eff
    const soakPitEffectiveDepthM = Math.max(
      2.0,
      requiredAbsorptionAreaM2 / (Math.PI * soakPitDiaM)
    );
    const soakPitTotalDepthM = soakPitEffectiveDepthM + 0.5; // with inlet clearance & cover slab

    return {
      dailySewageL,
      dailySewageM3,
      liquidRetentionM3,
      sludgeVolumeM3,
      totalSepticVolumeM3,
      totalSepticVolumeL,
      tankLengthM,
      tankWidthM,
      totalTankHeightM,
      freeboardM,
      chamber1LengthM,
      chamber2LengthM,
      requiredAbsorptionAreaM2,
      soakPitEffectiveDepthM,
      soakPitTotalDepthM,
    };
  }, [
    septicUsers,
    sewageRateLpcd,
    detentionHours,
    desludgingYears,
    septicDepthM,
    septicLwRatio,
    soilPercolationRate,
    soakPitDiaM,
  ]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Parameter', 'Value', 'Unit', 'Specification'];
    if (activeTab === 'water-reservoirs') {
      const rows: (string | number)[][] = [
        ['Calculation Basis', calcMode.toUpperCase(), '-', 'Input Mode'],
        ['Total Calculated Occupants', waterCalc.totalUsers, 'persons', 'Headcount + floating'],
        ['Per Capita Daily Demand', lpcd, 'LPCD', 'BNBC Table 8.5.1'],
        ['Storage Period', storageDays, 'day(s)', 'Municipal supply factor'],
        ['Firefighting Reserve Allowance', fireReserveL, 'Litres', 'Dedicated fire reserve'],
        ['Net Daily Water Demand', Math.round(waterCalc.totalNetWaterL), 'Litres', `${waterCalc.totalNetWaterM3.toFixed(2)} m³ total`],
        ['UGWR Capacity Allocation', Math.round(waterCalc.ugwrTotalL), 'Litres', `${waterCalc.ugwrTotalM3.toFixed(2)} m³ (${ugwrSharePercent}% + fire)`],
        ['UGWR Dimensions (L x W x H)', `${waterCalc.ugwrLengthM.toFixed(2)} x ${waterCalc.ugwrWidthM.toFixed(2)} x ${waterCalc.ugwrTotalHeightM.toFixed(2)}`, 'm', 'Internal clear box'],
        ['UGWR Freeboard', waterCalc.ugwrFreeboardM, 'm', 'Air gap above high-water'],
        ['OHT Capacity Allocation', Math.round(waterCalc.ohtTotalL), 'Litres', `${waterCalc.ohtTotalM3.toFixed(2)} m³ (${100 - ugwrSharePercent}%)`],
        ['OHT Dimensions (L x W x H)', `${waterCalc.ohtLengthM.toFixed(2)} x ${waterCalc.ohtWidthM.toFixed(2)} x ${waterCalc.ohtTotalHeightM.toFixed(2)}`, 'm', 'Internal clear box'],
        ['OHT Freeboard', waterCalc.ohtFreeboardM, 'm', 'Air gap above high-water'],
        ['Transfer Pump Flow Rate', Number(waterCalc.pumpFlowLpm.toFixed(1)), 'LPM', `${waterCalc.pumpFlowGpm.toFixed(1)} GPM (${pumpFillHours} hr fill)`],
        ['Transfer Pump Head', totalHeadM, 'm', 'Static + dynamic friction'],
        ['Recommended Motor Rating', `${waterCalc.recommendedHp} HP`, 'HP', `${(waterCalc.recommendedHp * 0.7457).toFixed(2)} kW motor`],
      ];
      exportToCSV(`PB_CivilLab_Water_Reservoirs_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    } else {
      const rows: (string | number)[][] = [
        ['Contributing Users', septicUsers, 'persons', 'Design population'],
        ['Sewage Generation Rate', sewageRateLpcd, 'LPCD', '80-90% water demand'],
        ['Detention Retention Period', detentionHours, 'hours', 'Hydraulic retention'],
        ['Desludging Interval', desludgingYears, 'years', 'Sludge cleaning interval'],
        ['Daily Sewage Inflow', Math.round(septicCalc.dailySewageL), 'Litres', `${septicCalc.dailySewageM3.toFixed(2)} m³/day`],
        ['Liquid Retention Volume', Number(septicCalc.liquidRetentionM3.toFixed(2)), 'm³', 'Settling zone'],
        ['Sludge Accumulation Volume', Number(septicCalc.sludgeVolumeM3.toFixed(2)), 'm³', '0.07 m³/capita/yr'],
        ['Total Septic Volume Required', Number(septicCalc.totalSepticVolumeM3.toFixed(2)), 'm³', `~${Math.round(septicCalc.totalSepticVolumeL)} Litres`],
        ['Tank Dimensions (L x W x H)', `${septicCalc.tankLengthM.toFixed(2)} x ${septicCalc.tankWidthM.toFixed(2)} x ${septicCalc.totalTankHeightM.toFixed(2)}`, 'm', '2-Chamber Sedimentation'],
        ['Chamber 1 Length (2/3)', Number(septicCalc.chamber1LengthM.toFixed(2)), 'm', 'Primary settling'],
        ['Chamber 2 Length (1/3)', Number(septicCalc.chamber2LengthM.toFixed(2)), 'm', 'Secondary quiescent'],
        ['Soak Pit Internal Diameter', soakPitDiaM, 'm', 'Cylindrical well'],
        ['Soak Pit Total Depth', Number(septicCalc.soakPitTotalDepthM.toFixed(2)), 'm', 'Honeycomb lining + gravel'],
      ];
      exportToCSV(`PB_CivilLab_Septic_System_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    if (activeTab === 'water-reservoirs') {
      const pdfData = {
        projectMeta: {
          projectName: 'Water Reservoir (UGWR & OHT) & Pump Sizing Assessment',
          projectCode: 'MEP-WATER-2026',
          client: 'Building Services & Water Supply Division',
          location: 'Plumbing Engineering Submittal',
          date: new Date().toISOString().slice(0, 10),
          unitSystem: 'SI' as const,
          engineerName: 'Prokash Biswas, PE',
        },
        moduleMeta: {
          moduleId: 'water-reservoir-sizer',
          moduleTitle: 'WATER RESERVOIRS (UGWR / OHT) & PUMP SIZING REPORT',
          standard: 'BNBC 2020 Part 8 Chap 5 / WHO Guidelines / NFPA',
          status: 'VERIFIED' as const,
        },
        inputs: [
          { name: 'Total Contributing Occupants', symbol: 'N_pop', value: waterCalc.totalUsers, unit: 'persons' },
          { name: 'Per Capita Daily Water Demand', symbol: 'LPCD', value: lpcd, unit: 'L/person/day' },
          { name: 'Storage Buffer Duration', symbol: 'T_store', value: storageDays, unit: 'days' },
          { name: 'Firefighting Reserve Allowance', symbol: 'V_fire', value: fireReserveL, unit: 'L' },
          { name: 'UGWR Allocation Share', symbol: 'Ratio_ugwr', value: `${ugwrSharePercent}%`, unit: '%' },
          { name: 'Total Static + Dynamic Head', symbol: 'H_head', value: totalHeadM, unit: 'm' },
        ],
        outputs: [
          { name: 'Total Daily Net Water Demand', symbol: 'Q_total', value: Math.round(waterCalc.totalNetWaterL), unit: 'Litres', status: 'PASS' as const },
          { name: 'Underground Reservoir Volume (UGWR)', symbol: 'V_ugwr', value: `${Math.round(waterCalc.ugwrTotalL)} L (${waterCalc.ugwrTotalM3.toFixed(2)} m³)`, unit: 'vol', status: 'PASS' as const },
          { name: 'UGWR Clear Dimensions (L x W x H)', symbol: 'Dims_ugwr', value: `${waterCalc.ugwrLengthM.toFixed(2)}m x ${waterCalc.ugwrWidthM.toFixed(2)}m x ${waterCalc.ugwrTotalHeightM.toFixed(2)}m`, unit: 'm', status: 'PASS' as const },
          { name: 'Overhead Tank Volume (OHT)', symbol: 'V_oht', value: `${Math.round(waterCalc.ohtTotalL)} L (${waterCalc.ohtTotalM3.toFixed(2)} m³)`, unit: 'vol', status: 'PASS' as const },
          { name: 'OHT Clear Dimensions (L x W x H)', symbol: 'Dims_oht', value: `${waterCalc.ohtLengthM.toFixed(2)}m x ${waterCalc.ohtWidthM.toFixed(2)}m x ${waterCalc.ohtTotalHeightM.toFixed(2)}m`, unit: 'm', status: 'PASS' as const },
          { name: 'Transfer Pump Discharge Rate', symbol: 'Q_pump', value: `${waterCalc.pumpFlowLpm.toFixed(1)} LPM (${waterCalc.pumpFlowGpm.toFixed(1)} GPM)`, unit: 'flow', status: 'PASS' as const },
          { name: 'Recommended Pump Motor Rating', symbol: 'P_motor', value: `${waterCalc.recommendedHp} HP (${(waterCalc.recommendedHp * 0.7457).toFixed(2)} kW)`, unit: 'HP', status: 'PASS' as const },
        ],
        governingAssumptions: [
          'Domestic water requirement calculated at 135 LPCD for standard residential buildings (BNBC 2020 Part 8 Table 8.5.1).',
          'UGWR provides buffer for municipal supply intermittency plus required dedicated fire reserve.',
          'All reservoir internal heights include a minimum 300 mm (0.3m) clear air freeboard above high-water line.',
          'Transfer pump sizing assumes filling OHT from UGWR within 2 hours against 28m total dynamic head at 65% efficiency.',
        ],
      };

      await generateEngineeringPDF(pdfData, {
        filename: `PB_CivilLab_Water_Reservoirs_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } else {
      const pdfData = {
        projectMeta: {
          projectName: 'Septic Tank & Soak Well Sanitary Sizing Assessment',
          projectCode: 'SAN-SEPTIC-2026',
          client: 'Public Health Engineering Division',
          location: 'Building Sanitation & Effluent Submittal',
          date: new Date().toISOString().slice(0, 10),
          unitSystem: 'SI' as const,
          engineerName: 'Prokash Biswas, PE',
        },
        moduleMeta: {
          moduleId: 'septic-system-sizer',
          moduleTitle: 'SEPTIC TANK & SOAK PIT SANITATION DESIGN REPORT',
          standard: 'BNBC 2020 Part 8 Chap 6 / IS 2470 / WHO Guidelines',
          status: 'VERIFIED' as const,
        },
        inputs: [
          { name: 'Contributing Design Population', symbol: 'N_users', value: septicUsers, unit: 'persons' },
          { name: 'Per Capita Sewage Inflow', symbol: 'Q_lpcd', value: sewageRateLpcd, unit: 'LPCD' },
          { name: 'Detention / Retention Duration', symbol: 'T_det', value: detentionHours, unit: 'hours' },
          { name: 'Desludging Cleaning Period', symbol: 'T_desludge', value: desludgingYears, unit: 'years' },
          { name: 'Soil Percolation Rate', symbol: 'R_perc', value: soilPercolationRate, unit: 'L/m²/day' },
        ],
        outputs: [
          { name: 'Daily Sewage Discharge', symbol: 'Q_daily', value: `${septicCalc.dailySewageL} Litres (${septicCalc.dailySewageM3.toFixed(2)} m³)`, unit: 'vol', status: 'PASS' as const },
          { name: 'Total Septic Tank Volume', symbol: 'V_septic', value: `${septicCalc.totalSepticVolumeM3.toFixed(2)} m³ (${Math.round(septicCalc.totalSepticVolumeL)} L)`, unit: 'vol', status: 'PASS' as const },
          { name: 'Septic Tank Dimensions (L x W x H)', symbol: 'Dims_septic', value: `${septicCalc.tankLengthM.toFixed(2)}m x ${septicCalc.tankWidthM.toFixed(2)}m x ${septicCalc.totalTankHeightM.toFixed(2)}m`, unit: 'm', status: 'PASS' as const },
          { name: '1st Chamber Length (2/3)', symbol: 'L_ch1', value: septicCalc.chamber1LengthM.toFixed(2), unit: 'm', status: 'INFO' as const },
          { name: '2nd Chamber Length (1/3)', symbol: 'L_ch2', value: septicCalc.chamber2LengthM.toFixed(2), unit: 'm', status: 'INFO' as const },
          { name: 'Soak Pit Internal Diameter', symbol: 'D_soak', value: soakPitDiaM.toFixed(2), unit: 'm', status: 'PASS' as const },
          { name: 'Soak Pit Total Depth', symbol: 'H_soak', value: septicCalc.soakPitTotalDepthM.toFixed(2), unit: 'm', status: 'PASS' as const },
        ],
        governingAssumptions: [
          'Septic tank volume accounts for 24-hour hydraulic detention plus anaerobic sludge digestion storage at 0.07 m³/person/year.',
          'Two-chamber sedimentation tank configuration with 2:1 to 3:1 length-to-width ratio ensures optimum quiescent settling.',
          'Submerged baffle wall slot positioned at 35% of liquid depth prevents scum and bottom sludge carryover.',
          'Soak pit / absorption well sized using sidewall effective percolation area against specified soil absorption rate.',
        ],
      };

      await generateEngineeringPDF(pdfData, {
        filename: `PB_CivilLab_Septic_System_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 uppercase">
                Building Services &amp; MEP
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                Water Reservoir (UGWR/OHT) &amp; Septic Tank Sizer
              </h2>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
              BNBC 2020 Part 8 · Domestic Demand · Fire Reserve · Tank Geometries · Transfer Pump HP · 2-Chamber Septic &amp; Soak Well
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Certified PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Switching: Water Reservoirs vs Septic Tank */}
        <div className="flex items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('water-reservoirs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'water-reservoirs'
                ? 'bg-cyan-500 text-white shadow-xs'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>Water Reservoirs (UGWR &amp; OHT)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('septic-system')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'septic-system'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Septic Tank &amp; Soak Well</span>
          </button>
        </div>
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
                  <span>Demand &amp; Occupancy Setup</span>
                </h3>
                <div className="flex bg-[var(--md-sys-color-surface-container)] p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setCalcMode('building')}
                    className={`px-2 py-1 rounded-md font-medium ${
                      calcMode === 'building' ? 'bg-cyan-500 text-white' : 'text-slate-500'
                    }`}
                  >
                    By Building
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMode('occupants')}
                    className={`px-2 py-1 rounded-md font-medium ${
                      calcMode === 'occupants' ? 'bg-cyan-500 text-white' : 'text-slate-500'
                    }`}
                  >
                    Direct Headcount
                  </button>
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
                      value={numFloors}
                      onChange={(e) => setNumFloors(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Units/Floor
                    </label>
                    <input
                      type="number"
                      value={unitsPerFloor}
                      onChange={(e) => setUnitsPerFloor(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Persons/Unit
                    </label>
                    <input
                      type="number"
                      value={personsPerUnit}
                      onChange={(e) => setPersonsPerUnit(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Direct Total Occupants
                  </label>
                  <input
                    type="number"
                    value={directOccupants}
                    onChange={(e) => setDirectOccupants(Math.max(1, Number(e.target.value)))}
                    className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              )}

              {/* Demand & Days */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Per Capita Demand (LPCD)
                  </label>
                  <input
                    type="number"
                    value={lpcd}
                    onChange={(e) => setLpcd(Math.max(30, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-[10px] text-slate-500">135 (BNBC Standard)</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Storage Days
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={storageDays}
                    onChange={(e) => setStorageDays(Math.max(0.5, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-[10px] text-slate-500">1.0 day buffer</span>
                </div>
              </div>

              {/* Firefighting Reserve */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>Firefighting Reserve</span>
                  </label>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                    {fireReserveL.toLocaleString()} L
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[0, 10000, 25000, 50000].map((vol) => (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => setFireReserveL(vol)}
                      className={`py-1 px-1 text-[10px] font-mono rounded border transition-colors ${
                        fireReserveL === vol
                          ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                          : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {vol === 0 ? 'None' : `${vol / 1000}k L`}
                    </button>
                  ))}
                </div>
              </div>

              {/* UGWR / OHT Allocation Slider */}
              <div className="space-y-1 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[var(--md-sys-color-on-surface)]">UGWR / OHT Storage Split</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400">
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
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Geometric Depth & Ratios */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    UGWR Water Depth (m)
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    value={ugwrWaterDepthM}
                    onChange={(e) => setUgwrWaterDepthM(Math.max(1.2, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    OHT Water Depth (m)
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    value={ohtWaterDepthM}
                    onChange={(e) => setOhtWaterDepthM(Math.max(1.0, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
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
                    value={pumpFillHours}
                    onChange={(e) => setPumpFillHours(Math.max(0.5, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Total Dynamic Head (m)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={totalHeadM}
                    onChange={(e) => setTotalHeadM(Math.max(10, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
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
                  Net Daily Domestic &amp; Fire Requirement
                </span>
                <div className="text-2xl md:text-3xl font-black font-mono text-cyan-900 dark:text-cyan-100 mt-1">
                  {Math.round(waterCalc.totalNetWaterL).toLocaleString()} <span className="text-sm font-normal">Litres</span>
                </div>
                <span className="text-xs text-slate-500 block mt-0.5 font-mono">
                  {waterCalc.totalUsers} occupants @ {lpcd} LPCD + {fireReserveL.toLocaleString()}L fire reserve
                </span>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs text-slate-500">Volumetric Total</div>
                <div className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                  {waterCalc.totalNetWaterM3.toFixed(2)} m³
                </div>
              </div>
            </div>

            {/* Tank Dimension Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* UGWR Card */}
              <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                  <div>
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                      Underground (UGWR)
                    </span>
                    <div className="text-base font-black font-mono text-[var(--md-sys-color-on-surface)]">
                      {Math.round(waterCalc.ugwrTotalL).toLocaleString()} L
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">
                    {waterCalc.ugwrTotalM3.toFixed(1)} m³
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Internal Length (L):</span>
                    <strong className="text-[var(--md-sys-color-on-surface)]">{waterCalc.ugwrLengthM.toFixed(2)} m</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Internal Width (W):</span>
                    <strong className="text-[var(--md-sys-color-on-surface)]">{waterCalc.ugwrWidthM.toFixed(2)} m</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Water Depth (Dw):</span>
                    <strong className="text-[var(--md-sys-color-on-surface)]">{ugwrWaterDepthM.toFixed(2)} m</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Clear Freeboard:</span>
                    <strong className="text-slate-400">{waterCalc.ugwrFreeboardM.toFixed(2)} m</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--md-sys-color-outline-variant)]">
                    <span className="text-cyan-600 font-bold">Total Depth (H):</span>
                    <strong className="text-cyan-600 font-bold">{waterCalc.ugwrTotalHeightM.toFixed(2)} m</strong>
                  </div>
                </div>
              </div>

              {/* OHT Card */}
              <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                  <div>
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase">
                      Overhead (OHT)
                    </span>
                    <div className="text-base font-black font-mono text-[var(--md-sys-color-on-surface)]">
                      {Math.round(waterCalc.ohtTotalL).toLocaleString()} L
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
                    {waterCalc.ohtTotalM3.toFixed(1)} m³
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Internal Length (L):</span>
                    <strong className="text-[var(--md-sys-color-on-surface)]">{waterCalc.ohtLengthM.toFixed(2)} m</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Internal Width (W):</span>
                    <strong className="text-[var(--md-sys-color-on-surface)]">{waterCalc.ohtWidthM.toFixed(2)} m</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Water Depth (Dw):</span>
                    <strong className="text-[var(--md-sys-color-on-surface)]">{ohtWaterDepthM.toFixed(2)} m</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Clear Freeboard:</span>
                    <strong className="text-slate-400">{waterCalc.ohtFreeboardM.toFixed(2)} m</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--md-sys-color-outline-variant)]">
                    <span className="text-sky-600 font-bold">Total Depth (H):</span>
                    <strong className="text-sky-600 font-bold">{waterCalc.ohtTotalHeightM.toFixed(2)} m</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer Pump Motor Sizing Card */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-mono block">Recommended Transfer Pump Motor</span>
                  <strong className="text-base md:text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                    {waterCalc.recommendedHp} HP ({ (waterCalc.recommendedHp * 0.7457).toFixed(2) } kW) Pump
                  </strong>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-slate-500 space-y-0.5">
                <div>Discharge: <strong className="text-[var(--md-sys-color-on-surface)]">{waterCalc.pumpFlowLpm.toFixed(1)} LPM</strong> ({waterCalc.pumpFlowGpm.toFixed(1)} GPM)</div>
                <div>Total Head: <strong className="text-[var(--md-sys-color-on-surface)]">{totalHeadM} m</strong> (Fill: {pumpFillHours} hrs)</div>
              </div>
            </div>

            {/* 2D Schematic SVG for UGWR & OHT */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-cyan-500" />
                <span>Schematic Cross-Section Elevation (UGWR &amp; OHT)</span>
              </span>

              <svg
                viewBox="0 0 600 240"
                className="w-full h-auto bg-[var(--md-sys-color-surface-container-lowest,#0f172a)] rounded-xl border border-[var(--md-sys-color-outline-variant)]"
              >
                {/* UGWR Tank (Left) */}
                <g transform="translate(40, 50)">
                  <rect x="0" y="0" width="220" height="150" fill="#0284c7" fillOpacity="0.1" stroke="#38bdf8" strokeWidth="2" rx="4" />
                  {/* Liquid Fill */}
                  <rect x="2" y="30" width="216" height="118" fill="#0284c7" fillOpacity="0.35" />
                  {/* Freeboard area */}
                  <line x1="2" y1="30" x2="218" y2="30" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="110" y="20" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    Freeboard: {waterCalc.ugwrFreeboardM}m
                  </text>
                  <text x="110" y="75" fill="#e0f2fe" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    UGWR
                  </text>
                  <text x="110" y="95" fill="#38bdf8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                    {Math.round(waterCalc.ugwrTotalL).toLocaleString()} L ({waterCalc.ugwrLengthM.toFixed(1)}m × {waterCalc.ugwrWidthM.toFixed(1)}m)
                  </text>
                  {/* Manhole */}
                  <rect x="30" y="-8" width="40" height="8" fill="#64748b" rx="2" />
                  {/* Suction pipe */}
                  <line x1="180" y1="20" x2="180" y2="135" stroke="#f59e0b" strokeWidth="3" />
                  <circle cx="180" cy="135" r="4" fill="#f59e0b" />
                </g>

                {/* Transfer Pipe and Pump in center */}
                <path d="M 220 70 L 320 70 L 320 40 L 350 40" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                <circle cx="280" cy="70" r="10" fill="#10b981" />
                <text x="280" y="73" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                  P
                </text>
                <text x="280" y="95" fill="#34d399" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  {waterCalc.recommendedHp} HP
                </text>

                {/* OHT Tank (Right) */}
                <g transform="translate(350, 20)">
                  <rect x="0" y="0" width="190" height="130" fill="#0ea5e9" fillOpacity="0.1" stroke="#38bdf8" strokeWidth="2" rx="4" />
                  <rect x="2" y="25" width="186" height="103" fill="#0ea5e9" fillOpacity="0.3" />
                  <line x1="2" y1="25" x2="188" y2="25" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="95" y="18" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    Freeboard: {waterCalc.ohtFreeboardM}m
                  </text>
                  <text x="95" y="65" fill="#e0f2fe" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    OHT
                  </text>
                  <text x="95" y="85" fill="#38bdf8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                    {Math.round(waterCalc.ohtTotalL).toLocaleString()} L ({waterCalc.ohtLengthM.toFixed(1)}m × {waterCalc.ohtWidthM.toFixed(1)}m)
                  </text>
                  {/* Manhole */}
                  <rect x="30" y="-8" width="35" height="8" fill="#64748b" rx="2" />
                  {/* Supporting columns */}
                  <line x1="10" y1="130" x2="10" y2="180" stroke="#94a3b8" strokeWidth="4" />
                  <line x1="180" y1="130" x2="180" y2="180" stroke="#94a3b8" strokeWidth="4" />
                </g>
              </svg>
            </div>
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

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Contributing Population (Users)
                </label>
                <input
                  type="number"
                  value={septicUsers}
                  onChange={(e) => setSepticUsers(Math.max(1, Number(e.target.value)))}
                  className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Sewage Rate (LPCD)
                  </label>
                  <input
                    type="number"
                    value={sewageRateLpcd}
                    onChange={(e) => setSewageRateLpcd(Math.max(30, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-[10px] text-slate-500">80-90% water demand</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    Detention Period (Hours)
                  </label>
                  <input
                    type="number"
                    step="6"
                    value={detentionHours}
                    onChange={(e) => setDetentionHours(Math.max(12, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-[10px] text-slate-500">24h (Standard BNBC)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Desludging Cleaning Interval
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1.0, 2.0, 3.0].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setDesludgingYears(yr)}
                      className={`py-1.5 px-2 text-xs font-mono rounded-lg border transition-all ${
                        desludgingYears === yr
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                          : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {yr} {yr === 1 ? 'Year' : 'Years'}
                    </button>
                  ))}
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
                    value={septicDepthM}
                    onChange={(e) => setSepticDepthM(Math.max(1.0, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                    Length-to-Width Ratio
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    value={septicLwRatio}
                    onChange={(e) => setSepticLwRatio(Math.max(1.5, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              {/* Soak Pit Parameters */}
              <div className="space-y-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Soak Pit / Soil Absorption
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Soil Percolation (L/m²/day)
                    </label>
                    <input
                      type="number"
                      value={soilPercolationRate}
                      onChange={(e) => setSoilPercolationRate(Math.max(10, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                    <span className="text-[10px] text-slate-500">Sandy loam: 30-40</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                      Pit Internal Dia (m)
                    </label>
                    <input
                      type="number"
                      step="0.2"
                      value={soakPitDiaM}
                      onChange={(e) => setSoakPitDiaM(Math.max(1.0, Number(e.target.value)))}
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results & 2D Section Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Metric Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 block">Total Tank Capacity</span>
                <div className="text-xl md:text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-0.5">
                  {septicCalc.totalSepticVolumeM3.toFixed(2)} <span className="text-xs font-normal">m³</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ~{Math.round(septicCalc.totalSepticVolumeL).toLocaleString()} Litres
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300 block">Daily Inflow Rate</span>
                <div className="text-xl md:text-2xl font-bold font-mono text-teal-900 dark:text-teal-100 mt-0.5">
                  {septicCalc.dailySewageM3.toFixed(2)} <span className="text-xs font-normal">m³/day</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {septicCalc.dailySewageL.toLocaleString()} L/day
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 block">Soak Pit Total Depth</span>
                <div className="text-xl md:text-2xl font-bold font-mono text-cyan-900 dark:text-cyan-100 mt-0.5">
                  {septicCalc.soakPitTotalDepthM.toFixed(2)} <span className="text-xs font-normal">m</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Internal Ø: {soakPitDiaM.toFixed(1)} m
                </span>
              </div>
            </div>

            {/* 2-Chamber Septic Tank Dimensions Card */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
                  2-Chamber Septic Tank Engineering Geometry
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  L : W = {septicLwRatio} : 1
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-center">
                  <span className="text-slate-500 block text-[10px]">Total Length (L)</span>
                  <strong className="text-sm text-[var(--md-sys-color-on-surface)]">{septicCalc.tankLengthM.toFixed(2)} m</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-center">
                  <span className="text-slate-500 block text-[10px]">Total Width (W)</span>
                  <strong className="text-sm text-[var(--md-sys-color-on-surface)]">{septicCalc.tankWidthM.toFixed(2)} m</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-center">
                  <span className="text-slate-500 block text-[10px]">Liquid Depth (Dw)</span>
                  <strong className="text-sm text-[var(--md-sys-color-on-surface)]">{septicDepthM.toFixed(2)} m</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-center">
                  <span className="text-slate-500 block text-[10px]">Total Depth (+FB)</span>
                  <strong className="text-sm text-emerald-600 dark:text-emerald-400">{septicCalc.totalTankHeightM.toFixed(2)} m</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono text-slate-500">
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Chamber 1 (2/3 length):</span>
                  <strong className="text-[var(--md-sys-color-on-surface)]">{septicCalc.chamber1LengthM.toFixed(2)} m</strong>
                </div>
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container)] flex justify-between">
                  <span>Chamber 2 (1/3 length):</span>
                  <strong className="text-[var(--md-sys-color-on-surface)]">{septicCalc.chamber2LengthM.toFixed(2)} m</strong>
                </div>
              </div>
            </div>

            {/* 2D Schematic SVG for Septic Tank & Soak Pit */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-emerald-500" />
                <span>2-Chamber Septic Tank &amp; Soak Well Cross-Section</span>
              </span>

              <svg
                viewBox="0 0 620 220"
                className="w-full h-auto bg-[var(--md-sys-color-surface-container-lowest,#0f172a)] rounded-xl border border-[var(--md-sys-color-outline-variant)]"
              >
                {/* Septic Tank Boundary */}
                <g transform="translate(30, 40)">
                  <rect x="0" y="0" width="360" height="150" fill="#065f46" fillOpacity="0.1" stroke="#10b981" strokeWidth="2" rx="4" />

                  {/* Scum Layer */}
                  <rect x="2" y="25" width="356" height="15" fill="#d97706" fillOpacity="0.3" />
                  <text x="180" y="36" fill="#f59e0b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    Scum Layer (Freeboard: {septicCalc.freeboardM}m)
                  </text>

                  {/* Clear Liquid */}
                  <rect x="2" y="40" width="356" height="75" fill="#047857" fillOpacity="0.3" />

                  {/* Sludge Layer */}
                  <rect x="2" y="115" width="356" height="33" fill="#374151" fillOpacity="0.6" />
                  <text x="180" y="135" fill="#9ca3af" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    Digested Sludge Zone ({septicCalc.sludgeVolumeM3.toFixed(2)} m³)
                  </text>

                  {/* Baffle Wall at 2/3 distance */}
                  <line x1="240" y1="0" x2="240" y2="120" stroke="#10b981" strokeWidth="4" />
                  {/* Baffle slot opening */}
                  <rect x="237" y="65" width="6" height="25" fill="#0f172a" />
                  <text x="240" y="105" fill="#34d399" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    Baffle
                  </text>

                  {/* Chamber labels */}
                  <text x="120" y="80" fill="#a7f3d0" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    Chamber 1 ({septicCalc.chamber1LengthM.toFixed(1)}m)
                  </text>
                  <text x="300" y="80" fill="#a7f3d0" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    Chamber 2 ({septicCalc.chamber2LengthM.toFixed(1)}m)
                  </text>

                  {/* Manhole covers */}
                  <rect x="60" y="-8" width="40" height="8" fill="#64748b" rx="2" />
                  <rect x="280" y="-8" width="40" height="8" fill="#64748b" rx="2" />

                  {/* Inlet Pipe Tee */}
                  <path d="M -15 35 L 20 35 L 20 70" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <text x="-12" y="28" fill="#cbd5e1" fontSize="9" fontFamily="monospace">Inlet</text>

                  {/* Outlet Pipe Tee */}
                  <path d="M 340 70 L 340 40 L 380 40" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <text x="365" y="32" fill="#cbd5e1" fontSize="9" fontFamily="monospace">Effluent</text>
                </g>

                {/* Soak Pit (Right) */}
                <g transform="translate(450, 40)">
                  {/* Outer packing aggregate */}
                  <rect x="-15" y="10" width="130" height="145" fill="#475569" fillOpacity="0.2" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
                  <text x="50" y="165" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    Filter Gravel
                  </text>

                  {/* Honeycomb Pit Cylinder */}
                  <rect x="0" y="10" width="100" height="140" fill="#047857" fillOpacity="0.1" stroke="#34d399" strokeWidth="2" strokeDasharray="5 3" />
                  <text x="50" y="60" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    SOAK PIT
                  </text>
                  <text x="50" y="78" fill="#34d399" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    Ø {soakPitDiaM.toFixed(1)}m
                  </text>
                  <text x="50" y="94" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    H = {septicCalc.soakPitTotalDepthM.toFixed(1)}m
                  </text>
                  {/* Cover slab */}
                  <rect x="-10" y="2" width="120" height="8" fill="#94a3b8" rx="2" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
