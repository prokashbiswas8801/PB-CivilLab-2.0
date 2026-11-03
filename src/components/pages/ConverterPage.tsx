import React, { useState, useMemo } from 'react';
import {
  ArrowRightLeft,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Maximize2,
  Compass,
  Boxes,
  Gauge,
  Scale,
  Hash,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useCivilLab } from '../../context/CivilLabContext';
import { AddToHistoryButton } from '../ui/AddToHistoryButton';
import { AboutThisTool, AboutThisToolButton } from '../ui';
import { EXACT_CONVERSION, parseFeetInchString } from '../../utils/unitConverter';

type ConverterTab = 'length' | 'area' | 'volume' | 'pressure' | 'rebar';

export const ConverterPage: React.FC = () => {
  const { userProfile, addSavedHistoryItem } = useCivilLab();
  const [activeTab, setActiveTab] = useState<ConverterTab>('area');
  const [precision, setPrecision] = useState<number>(4);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // -------------------------------------------------------------------------
  // 1. LENGTH & DISTANCE STATE
  // -------------------------------------------------------------------------
  const [lengthValue, setLengthValue] = useState<number>(10);
  const [lengthFromUnit, setLengthFromUnit] = useState<string>('m');
  const [lengthToUnit, setLengthToUnit] = useState<string>('ft');

  // Compound Feet-Inch input
  const [ftInput, setFtInput] = useState<number>(12);
  const [inInput, setInInput] = useState<number>(6);

  const lengthFactors: Record<string, number> = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: EXACT_CONVERSION.IN_TO_M,
    ft: EXACT_CONVERSION.FT_TO_M,
    yd: EXACT_CONVERSION.YD_TO_M,
    mi: EXACT_CONVERSION.MI_TO_M,
    chain: EXACT_CONVERSION.CHAIN_TO_M,
    link: EXACT_CONVERSION.LINK_TO_M,
  };

  const lengthResult = useMemo(() => {
    const meters = lengthValue * (lengthFactors[lengthFromUnit] || 1);
    return meters / (lengthFactors[lengthToUnit] || 1);
  }, [lengthValue, lengthFromUnit, lengthToUnit]);

  // Feet-Inch conversion to meters & mm
  const compoundTotalInches = ftInput * 12 + inInput;
  const compoundMeters = compoundTotalInches * EXACT_CONVERSION.IN_TO_M;
  const compoundFeet = compoundTotalInches / 12;

  // -------------------------------------------------------------------------
  // 2. LAND & AREA STATE (South Asian & Standard)
  // -------------------------------------------------------------------------
  const [areaValue, setAreaValue] = useState<number>(1);
  const [areaFromUnit, setAreaFromUnit] = useState<string>('katha');
  const [areaToUnit, setAreaToUnit] = useState<string>('sft');
  const [customKathaSqFt, setCustomKathaSqFt] = useState<number>(720);
  const [isCustomKatha, setIsCustomKatha] = useState<boolean>(false);

  // Area conversion factors in m²
  const areaFactors = useMemo<Record<string, number>>(() => {
    const kathaInSqFt = isCustomKatha ? customKathaSqFt : 720;
    const kathaInM2 = kathaInSqFt * EXACT_CONVERSION.SFT_TO_M2;
    const bighaInM2 = kathaInM2 * 20;
    const chhatakInM2 = kathaInM2 / 16;

    return {
      sft: EXACT_CONVERSION.SFT_TO_M2,
      m2: 1,
      katha: kathaInM2,
      decimal: EXACT_CONVERSION.DECIMAL_TO_M2, // 435.6 sq ft
      bigha: bighaInM2,
      acre: EXACT_CONVERSION.ACRE_TO_M2,
      hectare: EXACT_CONVERSION.HECTARE_TO_M2,
      chhatak: chhatakInM2,
      ganda: EXACT_CONVERSION.GANDA_TO_M2,
      guntha: EXACT_CONVERSION.GUNTHA_TO_M2,
    };
  }, [isCustomKatha, customKathaSqFt]);

  const areaResult = useMemo(() => {
    const sqMeters = areaValue * (areaFactors[areaFromUnit] || 1);
    return sqMeters / (areaFactors[areaToUnit] || 1);
  }, [areaValue, areaFromUnit, areaToUnit, areaFactors]);

  // Multi-unit table readout for current area
  const areaEquivalents = useMemo(() => {
    const sqMeters = areaValue * (areaFactors[areaFromUnit] || 1);
    return {
      sft: sqMeters / EXACT_CONVERSION.SFT_TO_M2,
      m2: sqMeters,
      decimal: sqMeters / EXACT_CONVERSION.DECIMAL_TO_M2,
      katha: sqMeters / areaFactors.katha,
      bigha: sqMeters / areaFactors.bigha,
      acre: sqMeters / EXACT_CONVERSION.ACRE_TO_M2,
      hectare: sqMeters / EXACT_CONVERSION.HECTARE_TO_M2,
      chhatak: sqMeters / areaFactors.chhatak,
    };
  }, [areaValue, areaFromUnit, areaFactors]);

  // -------------------------------------------------------------------------
  // 3. VOLUME & CONCRETE / SITE MATERIALS
  // -------------------------------------------------------------------------
  const [volValue, setVolValue] = useState<number>(10);
  const [volFromUnit, setVolFromUnit] = useState<string>('m3');
  const [volToUnit, setVolToUnit] = useState<string>('cft');

  // Cement Bag tool
  const [cementBagsInput, setCementBagsInput] = useState<number>(50);

  const volFactors: Record<string, number> = {
    m3: 1,
    cft: EXACT_CONVERSION.CFT_TO_M3,
    liter: EXACT_CONVERSION.LITER_TO_M3,
    gal_us: EXACT_CONVERSION.GAL_US_TO_M3,
    gal_uk: EXACT_CONVERSION.GAL_UK_TO_M3,
    brass: EXACT_CONVERSION.CFT_TO_M3 * 100, // 1 Brass = 100 CFT
  };

  const volResult = useMemo(() => {
    const m3 = volValue * (volFactors[volFromUnit] || 1);
    return m3 / (volFactors[volToUnit] || 1);
  }, [volValue, volFromUnit, volToUnit]);

  // 1 Bag = 50 kg, standard bulk density 1440 kg/m3 -> vol = 50 / 1440 = 0.03472 m3 = 1.226 CFT
  const cementBagsCalculations = useMemo(() => {
    const totalKg = cementBagsInput * 50;
    const totalTons = totalKg / 1000;
    const totalM3 = totalKg / 1440;
    const totalCft = totalM3 * EXACT_CONVERSION.M3_TO_CFT;
    return {
      kg: totalKg,
      tons: totalTons,
      m3: totalM3,
      cft: totalCft,
    };
  }, [cementBagsInput]);

  // -------------------------------------------------------------------------
  // 4. FORCE, LOAD & STRESS / PRESSURE
  // -------------------------------------------------------------------------
  const [pressValue, setPressValue] = useState<number>(25);
  const [pressFromUnit, setPressFromUnit] = useState<string>('mpa');
  const [pressToUnit, setPressToUnit] = useState<string>('psi');

  const pressFactors: Record<string, number> = {
    pa: 1,
    kpa: EXACT_CONVERSION.KPA_TO_PA,
    mpa: EXACT_CONVERSION.MPA_TO_PA,
    gpa: EXACT_CONVERSION.GPA_TO_PA,
    psi: EXACT_CONVERSION.PSI_TO_PA,
    ksi: EXACT_CONVERSION.KSI_TO_PA,
    psf: EXACT_CONVERSION.PSF_TO_PA,
    ksf: EXACT_CONVERSION.TSF_TO_PA / 2, // 1 ksf = 1000 psf
    bar: EXACT_CONVERSION.BAR_TO_PA,
    kgf_cm2: EXACT_CONVERSION.KGF_CM2_TO_PA,
    kn_m2: EXACT_CONVERSION.KPA_TO_PA, // 1 kN/m² = 1 kPa
  };

  const pressResult = useMemo(() => {
    const pa = pressValue * (pressFactors[pressFromUnit] || 1);
    return pa / (pressFactors[pressToUnit] || 1);
  }, [pressValue, pressFromUnit, pressToUnit]);

  // -------------------------------------------------------------------------
  // 5. REBAR MM <-> SUTA & DENSITY
  // -------------------------------------------------------------------------
  const [rebarLengthMeters, setRebarLengthMeters] = useState<number>(100);
  const [selectedBarDiameter, setSelectedBarDiameter] = useState<number>(16);

  // Density converter
  const [densityValue, setDensityValue] = useState<number>(2400); // Concrete default
  const [densityFromUnit, setDensityFromUnit] = useState<string>('kg_m3');
  const [densityToUnit, setDensityToUnit] = useState<string>('kn_m3');

  const densityFactors: Record<string, number> = {
    kg_m3: 1,
    kn_m3: 101.9716212977928, // 1 kN/m³ ≈ 101.97 kg/m³
    lb_ft3: 16.018463,        // 1 lb/ft³ = 16.018 kg/m³
    g_cm3: 1000,
  };

  const densityResult = useMemo(() => {
    const kgM3 = densityValue * (densityFactors[densityFromUnit] || 1);
    return kgM3 / (densityFactors[densityToUnit] || 1);
  }, [densityValue, densityFromUnit, densityToUnit]);

  // Rebar Database: Metric Diameter, Suta equivalent, US Bar #, Unit Weight (d²/162), Cross Sectional Area
  const rebarTable = [
    { dia: 6, suta: 1.89, barNo: '#2', unitWeight: 0.222, area: 28.3 },
    { dia: 8, suta: 2.52, barNo: '#2.5', unitWeight: 0.395, area: 50.3 },
    { dia: 10, suta: 3.15, barNo: '#3', unitWeight: 0.617, area: 78.5 },
    { dia: 12, suta: 3.78, barNo: '#4', unitWeight: 0.888, area: 113.1 },
    { dia: 16, suta: 5.04, barNo: '#5', unitWeight: 1.578, area: 201.1 },
    { dia: 20, suta: 6.30, barNo: '#6', unitWeight: 2.466, area: 314.2 },
    { dia: 22, suta: 6.93, barNo: '#7', unitWeight: 2.984, area: 380.1 },
    { dia: 25, suta: 7.87, barNo: '#8 (1")', unitWeight: 3.853, area: 490.9 },
    { dia: 28, suta: 8.82, barNo: '#9', unitWeight: 4.834, area: 615.8 },
    { dia: 32, suta: 10.08, barNo: '#10', unitWeight: 6.313, area: 804.2 },
  ];

  const selectedBar = rebarTable.find((b) => b.dia === selectedBarDiameter) || rebarTable[4];
  const rebarTotalWeightKg = selectedBar.unitWeight * rebarLengthMeters;
  const rebarTotalWeightTons = rebarTotalWeightKg / 1000;
  const rebarTotalWeightLbs = rebarTotalWeightKg * 2.20462;

  // Format Helper
  const formatNum = (val: number, prec: number = precision) => {
    if (isNaN(val)) return '0';
    if (Math.abs(val) > 1e9 || (Math.abs(val) < 1e-4 && val !== 0)) {
      return val.toExponential(prec);
    }
    return Number(val.toFixed(prec)).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: prec,
    });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                Civil & Structural Workbench
              </span>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                · Zero-Drift NIST & Regional Constants
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight">
              Engineering & Regional Converter
            </h1>
            <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl">
              Bidirectional precision conversion for civil parameters, land surveying (Katha, Decimal, Bigha), 
              site concrete volumes (CFT, Brass, Bags), hydraulic pressures, and rebar nominal sizes (Suta / সুতা).
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <AboutThisToolButton
              toolId="unit-converter"
              onClick={() => {
                document.getElementById('converter-about-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Precision Controls */}
            <div className="flex items-center gap-1.5 bg-[var(--md-sys-color-surface-container)] p-1 rounded-full border border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[11px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] px-2.5">
                Decimals:
              </span>
              {[2, 3, 4, 6].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrecision(p)}
                  className={`w-7 h-7 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    precision === p
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-black'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation — Full Pill Segmented Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] mt-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'area', label: 'Land & Area (Regional)', icon: Compass, badge: 'Katha / Decimal' },
            { id: 'volume', label: 'Volume & Concrete', icon: Boxes, badge: 'CFT / Brass / Bags' },
            { id: 'rebar', label: 'Rebar & Density', icon: Hash, badge: 'Suta / d²/162' },
            { id: 'pressure', label: 'Stress & Force', icon: Gauge, badge: 'MPa / PSI / Kip' },
            { id: 'length', label: 'Length & Feet-Inch', icon: Maximize2, badge: 'Compound 12\' 6"' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ConverterTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-black'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                <span className={`hidden md:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive
                    ? 'bg-[var(--md-sys-color-on-primary)]/20 text-[var(--md-sys-color-on-primary)]'
                    : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: LAND & AREA (SOUTH ASIAN & STANDARD) */}
      {/* ===================================================================== */}
      {activeTab === 'area' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Converter Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                  <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Land & Survey Area Converter
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <AddToHistoryButton
                    item={{
                      type: 'conversion',
                      title: `Land Area: ${areaValue} ${areaFromUnit.toUpperCase()} to ${areaToUnit.toUpperCase()}`,
                      moduleId: 'converter-land-area',
                      summary: `${areaValue} ${areaFromUnit} = ${formatNum(areaResult)} ${areaToUnit}`,
                      status: 'valid',
                      keyMetrics: [
                        { label: 'Input', value: `${areaValue} ${areaFromUnit}` },
                        { label: 'Result', value: `${formatNum(areaResult)} ${areaToUnit}` },
                        { label: 'Sq. Feet', value: `${formatNum(areaEquivalents.sft, 2)} sft` },
                        { label: 'Decimals', value: `${formatNum(areaEquivalents.decimal, 3)} dec` },
                      ],
                      inputs: { areaValue, areaFromUnit, areaToUnit, customKathaSqFt, isCustomKatha },
                      results: { convertedValue: areaResult, areaEquivalents },
                      tags: ['land-area', 'surveying', 'katha', 'decimal'],
                    }}
                    label="Save to History"
                    variant="outline"
                  />
                </div>
              </div>

              {/* Converter Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                {/* From Column */}
                <div className="sm:col-span-5 space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                    From Value & Unit
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={areaValue}
                    onChange={(e) => setAreaValue(parseFloat(e.target.value) || 0)}
                    className="w-full h-12 px-3 text-lg font-mono font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                  />
                  <select
                    value={areaFromUnit}
                    onChange={(e) => setAreaFromUnit(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="katha">Katha / কাঠা (Standard 720 sft)</option>
                    <option value="decimal">Decimal / শতক / শতাংশ (435.6 sft)</option>
                    <option value="bigha">Bigha / বিঘা (20 Katha / 14,400 sft)</option>
                    <option value="sft">Square Feet (sq ft / sft)</option>
                    <option value="m2">Square Meter (m² / sqm)</option>
                    <option value="acre">Acre / একর (100 Decimals)</option>
                    <option value="hectare">Hectare / হেক্টর (10,000 m²)</option>
                    <option value="chhatak">Chhatak / ছটাক (45 sft = 1/16 Katha)</option>
                    <option value="ganda">Ganda / গণ্ডা (216 sft)</option>
                    <option value="guntha">Guntha / গুন্টা (1,089 sft)</option>
                  </select>
                </div>

                {/* Swap Button */}
                <div className="sm:col-span-1 flex justify-center py-2 sm:py-0">
                  <button
                    type="button"
                    onClick={() => {
                      const temp = areaFromUnit;
                      setAreaFromUnit(areaToUnit);
                      setAreaToUnit(temp);
                    }}
                    className="w-10 h-10 rounded-full border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] flex items-center justify-center cursor-pointer transition-transform hover:rotate-180"
                    title="Swap From and To Units"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* To Column */}
                <div className="sm:col-span-5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                      Converted Result
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(formatNum(areaResult), 'area-main')}
                      className="text-xs font-mono text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'area-main' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'area-main' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="w-full h-12 px-3 text-lg font-mono font-extrabold rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 flex items-center overflow-x-auto no-scrollbar">
                    {formatNum(areaResult)}
                  </div>
                  <select
                    value={areaToUnit}
                    onChange={(e) => setAreaToUnit(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="sft">Square Feet (sq ft / sft)</option>
                    <option value="katha">Katha / কাঠা (Standard 720 sft)</option>
                    <option value="decimal">Decimal / শতক / শতাংশ (435.6 sft)</option>
                    <option value="bigha">Bigha / বিঘা (20 Katha / 14,400 sft)</option>
                    <option value="m2">Square Meter (m² / sqm)</option>
                    <option value="acre">Acre / একর (100 Decimals)</option>
                    <option value="hectare">Hectare / হেক্টর (10,000 m²)</option>
                    <option value="chhatak">Chhatak / ছটাক (45 sft)</option>
                    <option value="ganda">Ganda / গণ্ডা (216 sft)</option>
                    <option value="guntha">Guntha / গুন্টা (1,089 sft)</option>
                  </select>
                </div>
              </div>

              {/* Custom Local Katha Override Option */}
              <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex flex-wrap items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--md-sys-color-on-surface)]">
                  <input
                    type="checkbox"
                    checked={isCustomKatha}
                    onChange={(e) => setIsCustomKatha(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                  <span>Custom Local Katha Size (e.g. Dhaka vs Rajshahi/Sylhet district customs)</span>
                </label>
                {isCustomKatha && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--md-sys-color-on-surface-variant)]">1 Katha =</span>
                    <input
                      type="number"
                      value={customKathaSqFt}
                      onChange={(e) => setCustomKathaSqFt(parseFloat(e.target.value) || 720)}
                      className="w-24 h-8 px-2 font-mono font-bold text-xs rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                    <span className="font-mono text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">sq.ft</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Land Conversion Cheat Card */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                <Info className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span>South Asian Official Legal Standards Breakdown</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">1 Decimal / শতক</div>
                  <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">435.6 Sq.Ft</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">40.468 m²</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">1 Katha / কাঠা</div>
                  <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">720 Sq.Ft</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">1.653 Decimals</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">1 Bigha / বিঘা</div>
                  <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">20 Kathas</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">14,400 Sq.Ft</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">1 Acre / একর</div>
                  <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">100 Decimals</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">60.5 Kathas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Matrix: Full Instant Equivalent Readout */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  All Unit Equivalents for {areaValue} {areaFromUnit.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] font-bold">
                  Instant Schedule
                </span>
              </div>

              <div className="divide-y divide-[var(--md-sys-color-outline-variant)]/40 text-xs font-mono">
                {[
                  { label: 'Square Feet (sq.ft)', value: formatNum(areaEquivalents.sft, 2), unit: 'ft²' },
                  { label: 'Square Meters (sq.m)', value: formatNum(areaEquivalents.m2, 3), unit: 'm²' },
                  { label: 'Decimal / শতক / শতাংশ', value: formatNum(areaEquivalents.decimal, 4), unit: 'dec' },
                  { label: 'Katha / কাঠা', value: formatNum(areaEquivalents.katha, 4), unit: 'katha' },
                  { label: 'Bigha / বিঘা', value: formatNum(areaEquivalents.bigha, 5), unit: 'bigha' },
                  { label: 'Acre / একর', value: formatNum(areaEquivalents.acre, 5), unit: 'acre' },
                  { label: 'Hectare / হেক্টর', value: formatNum(areaEquivalents.hectare, 5), unit: 'ha' },
                  { label: 'Chhatak / ছটাক', value: formatNum(areaEquivalents.chhatak, 3), unit: 'chhatak' },
                ].map((row, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-2 hover:bg-[var(--md-sys-color-surface-container)] px-2 rounded-lg transition-colors">
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">{row.label}</span>
                    <div className="flex items-center gap-1.5 font-bold text-[var(--md-sys-color-on-surface)]">
                      <span>{row.value}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`${row.value} ${row.unit}`, `area-eq-${idx}`)}
                        className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] cursor-pointer"
                        title="Copy value"
                      >
                        {copiedKey === `area-eq-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: VOLUME & CONCRETE / SITE MATERIALS */}
      {/* ===================================================================== */}
      {activeTab === 'volume' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                  <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Volume & Concrete Site Units
                  </h2>
                </div>
                <AddToHistoryButton
                  item={{
                    type: 'conversion',
                    title: `Volume: ${volValue} ${volFromUnit.toUpperCase()} to ${volToUnit.toUpperCase()}`,
                    moduleId: 'converter-volume',
                    summary: `${volValue} ${volFromUnit} = ${formatNum(volResult)} ${volToUnit}`,
                    status: 'valid',
                    keyMetrics: [
                      { label: 'Input', value: `${volValue} ${volFromUnit}` },
                      { label: 'Result', value: `${formatNum(volResult)} ${volToUnit}` },
                    ],
                    inputs: { volValue, volFromUnit, volToUnit },
                    results: { convertedValue: volResult },
                    tags: ['volume', 'cft', 'm3', 'brass', 'concrete'],
                  }}
                  label="Save to History"
                  variant="outline"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                <div className="sm:col-span-5 space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                    From Volume
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={volValue}
                    onChange={(e) => setVolValue(parseFloat(e.target.value) || 0)}
                    className="w-full h-12 px-3 text-lg font-mono font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                  />
                  <select
                    value={volFromUnit}
                    onChange={(e) => setVolFromUnit(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="m3">Cubic Meter (m³)</option>
                    <option value="cft">Cubic Feet (CFT)</option>
                    <option value="brass">Brass (100 CFT = 2.8317 m³)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="gal_us">US Gallon (gal)</option>
                    <option value="gal_uk">UK Imperial Gallon</option>
                  </select>
                </div>

                <div className="sm:col-span-1 flex justify-center py-2 sm:py-0">
                  <button
                    type="button"
                    onClick={() => {
                      const temp = volFromUnit;
                      setVolFromUnit(volToUnit);
                      setVolToUnit(temp);
                    }}
                    className="w-10 h-10 rounded-full border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] flex items-center justify-center cursor-pointer transition-transform hover:rotate-180"
                    title="Swap From and To Units"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="sm:col-span-5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                      Converted Result
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(formatNum(volResult), 'vol-main')}
                      className="text-xs font-mono text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'vol-main' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'vol-main' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="w-full h-12 px-3 text-lg font-mono font-extrabold rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 flex items-center overflow-x-auto no-scrollbar">
                    {formatNum(volResult)}
                  </div>
                  <select
                    value={volToUnit}
                    onChange={(e) => setVolToUnit(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="cft">Cubic Feet (CFT)</option>
                    <option value="m3">Cubic Meter (m³)</option>
                    <option value="brass">Brass (100 CFT = 2.8317 m³)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="gal_us">US Gallon (gal)</option>
                    <option value="gal_uk">UK Imperial Gallon</option>
                  </select>
                </div>
              </div>

              {/* Volume Technical Note */}
              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-2">
                <Info className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                <span>
                  <strong>1 m³ = 35.3147 CFT</strong> · <strong>1 Brass = 100 CFT = 2.8317 m³</strong> (Standard procurement unit for sand, gravel, and earthwork).
                </span>
              </div>
            </div>

            {/* Quick Volume Multi-Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: '1 m³ in CFT', val: '35.3147 CFT', sub: 'Exact physical constant' },
                { label: '1 Brass in CFT', val: '100.00 CFT', sub: 'Standard quarry unit' },
                { label: '1 CFT in Liters', val: '28.3168 L', sub: 'Water equivalent' },
              ].map((card, i) => (
                <div key={i} className="p-4 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-[var(--md-sys-color-on-surface-variant)]">{card.label}</div>
                  <div className="text-base font-mono font-bold text-[var(--md-sys-color-on-surface)] mt-1">{card.val}</div>
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{card.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Cement Bags <-> kg / CFT Calculator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Cement Bags ⇄ Weight & Volume
                  </h3>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Standard 50 kg / bag @ 1440 kg/m³ density
                  </p>
                </div>
                <AddToHistoryButton
                  item={{
                    type: 'conversion',
                    title: `Cement Bags: ${cementBagsInput} Bags Schedule`,
                    moduleId: 'converter-cement-bags',
                    summary: `${cementBagsInput} Bags = ${cementBagsCalculations.kg} kg = ${formatNum(cementBagsCalculations.cft, 2)} CFT`,
                    status: 'valid',
                    keyMetrics: [
                      { label: 'Bags', value: `${cementBagsInput}` },
                      { label: 'Weight', value: `${cementBagsCalculations.kg} kg (${cementBagsCalculations.tons} T)` },
                      { label: 'Volume (CFT)', value: `${formatNum(cementBagsCalculations.cft, 2)} CFT` },
                      { label: 'Volume (m³)', value: `${formatNum(cementBagsCalculations.m3, 3)} m³` },
                    ],
                    inputs: { cementBagsInput },
                    results: cementBagsCalculations,
                    tags: ['cement', 'concrete', 'bags', 'boq'],
                  }}
                  label="Save"
                  compact
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Number of Cement Bags
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cementBagsInput}
                  onChange={(e) => setCementBagsInput(parseFloat(e.target.value) || 0)}
                  className="w-full h-11 px-3 text-base font-mono font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Total Weight (kg)</div>
                  <div className="text-base font-bold text-[var(--md-sys-color-on-surface)] mt-1">
                    {formatNum(cementBagsCalculations.kg, 0)} kg
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    {formatNum(cementBagsCalculations.tons, 3)} Metric Tons
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Total Volume (CFT)</div>
                  <div className="text-base font-bold text-[var(--md-sys-color-on-surface)] mt-1">
                    {formatNum(cementBagsCalculations.cft, 2)} CFT
                  </div>
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    ~1.226 CFT / bag
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 col-span-2">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Total Metric Volume (m³)</div>
                  <div className="text-base font-bold text-[var(--md-sys-color-on-surface)] mt-1">
                    {formatNum(cementBagsCalculations.m3, 3)} m³
                  </div>
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    (0.03472 m³ / bag @ 1440 kg/m³)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: REBAR MM <-> SUTA & DENSITY */}
      {/* ===================================================================== */}
      {activeTab === 'rebar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Rebar Nominal mm <-> Suta Table Card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                    <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                      Rebar Nominal Diameter (mm) ⇄ Suta (সুতা) & # Bar Sizes
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    1 Suta = 1/8" = 3.175 mm · Unit Weight Formula: <strong>W = d² / 162.2 kg/m</strong>
                  </p>
                </div>

                <AddToHistoryButton
                  item={{
                    type: 'conversion',
                    title: `Rebar Schedule: ${rebarLengthMeters}m of ${selectedBar.dia}mm (${selectedBar.suta} Suta)`,
                    moduleId: 'converter-rebar-schedule',
                    summary: `${rebarLengthMeters}m @ ${selectedBar.dia}mm = ${formatNum(rebarTotalWeightKg, 1)} kg (${formatNum(rebarTotalWeightTons, 3)} T)`,
                    status: 'valid',
                    keyMetrics: [
                      { label: 'Bar Size', value: `${selectedBar.dia} mm (${selectedBar.suta} Suta)` },
                      { label: 'Length', value: `${rebarLengthMeters} m` },
                      { label: 'Unit Wt', value: `${selectedBar.unitWeight} kg/m` },
                      { label: 'Total Wt', value: `${formatNum(rebarTotalWeightKg, 1)} kg` },
                    ],
                    inputs: { rebarLengthMeters, selectedBarDiameter },
                    results: { rebarTotalWeightKg, rebarTotalWeightTons, rebarTotalWeightLbs, selectedBar },
                    tags: ['rebar', 'suta', 'bbs', 'steel'],
                  }}
                  label="Save to History"
                  variant="outline"
                />
              </div>

              {/* Interactive Suta Rebar Table */}
              <div className="overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] uppercase text-[10px] tracking-wider border-b border-[var(--md-sys-color-outline-variant)]">
                    <tr>
                      <th className="p-3">Select</th>
                      <th className="p-3">Diameter (mm)</th>
                      <th className="p-3">Suta (সুতা)</th>
                      <th className="p-3">US Bar #</th>
                      <th className="p-3">Area (mm²)</th>
                      <th className="p-3">Unit Wt (kg/m)</th>
                      <th className="p-3">Unit Wt (lb/ft)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/60 text-[var(--md-sys-color-on-surface)]">
                    {rebarTable.map((bar) => {
                      const isSelected = bar.dia === selectedBarDiameter;
                      const lbPerFt = bar.unitWeight * 0.67197;
                      return (
                        <tr
                          key={bar.dia}
                          onClick={() => setSelectedBarDiameter(bar.dia)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[var(--md-sys-color-primary-container)]/30 font-bold'
                              : 'hover:bg-[var(--md-sys-color-surface-container-low)]'
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="radio"
                              name="rebarRadio"
                              checked={isSelected}
                              onChange={() => setSelectedBarDiameter(bar.dia)}
                              className="text-[var(--md-sys-color-primary)] cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-bold text-sm text-[var(--md-sys-color-primary)]">
                            {bar.dia} mm
                          </td>
                          <td className="p-3 font-bold text-[var(--md-sys-color-on-surface)]">
                            {bar.suta.toFixed(1)} Suta
                          </td>
                          <td className="p-3 text-[var(--md-sys-color-on-surface-variant)]">{bar.barNo}</td>
                          <td className="p-3">{bar.area.toFixed(1)}</td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-400 font-bold">{bar.unitWeight.toFixed(3)}</td>
                          <td className="p-3 text-[var(--md-sys-color-on-surface-variant)]">{lbPerFt.toFixed(3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Length to Weight Multi-Calculator */}
              <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                      Total Length for Selected Bar ({selectedBar.dia} mm / {selectedBar.suta} Suta):
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={rebarLengthMeters}
                      onChange={(e) => setRebarLengthMeters(parseFloat(e.target.value) || 0)}
                      className="w-28 h-9 px-3 text-sm font-mono font-bold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    />
                    <span className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)]">Meters</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                  <div>
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Total Weight (kg)</span>
                    <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                      {formatNum(rebarTotalWeightKg, 2)} kg
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Metric Tons</span>
                    <div className="text-sm font-bold text-emerald-600 mt-0.5">
                      {formatNum(rebarTotalWeightTons, 4)} T
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Imperial Weight (lb)</span>
                    <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                      {formatNum(rebarTotalWeightLbs, 1)} lbs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Density Converter Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Material Density Converter
                  </h3>
                </div>
                <AddToHistoryButton
                  item={{
                    type: 'conversion',
                    title: `Density: ${densityValue} ${densityFromUnit} to ${densityToUnit}`,
                    moduleId: 'converter-density',
                    summary: `${densityValue} ${densityFromUnit} = ${formatNum(densityResult, 2)} ${densityToUnit}`,
                    status: 'valid',
                    keyMetrics: [
                      { label: 'Input', value: `${densityValue} ${densityFromUnit}` },
                      { label: 'Result', value: `${formatNum(densityResult, 2)} ${densityToUnit}` },
                    ],
                    inputs: { densityValue, densityFromUnit, densityToUnit },
                    results: { densityResult },
                    tags: ['density', 'unit-weight', 'materials'],
                  }}
                  label="Save"
                  compact
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Density Value
                </label>
                <input
                  type="number"
                  step="any"
                  value={densityValue}
                  onChange={(e) => setDensityValue(parseFloat(e.target.value) || 0)}
                  className="w-full h-11 px-3 text-base font-mono font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <select
                    value={densityFromUnit}
                    onChange={(e) => setDensityFromUnit(e.target.value)}
                    className="h-9 px-2 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="kg_m3">kg/m³</option>
                    <option value="kn_m3">kN/m³</option>
                    <option value="lb_ft3">lb/ft³ (pcf)</option>
                    <option value="g_cm3">g/cm³</option>
                  </select>
                  <select
                    value={densityToUnit}
                    onChange={(e) => setDensityToUnit(e.target.value)}
                    className="h-9 px-2 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="kn_m3">kN/m³</option>
                    <option value="kg_m3">kg/m³</option>
                    <option value="lb_ft3">lb/ft³ (pcf)</option>
                    <option value="g_cm3">g/cm³</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono">
                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase">Result</div>
                <div className="text-xl font-bold mt-1">
                  {formatNum(densityResult, 2)} <span className="text-xs font-normal">{densityToUnit}</span>
                </div>
              </div>

              {/* Standard Reference Densities */}
              <div className="space-y-1 text-xs font-mono pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="text-[10px] font-bold uppercase text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Standard Civil References:
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/40">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Reinforced Concrete:</span>
                  <span className="font-bold">24 kN/m³ (150 pcf)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/40">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Plain Concrete (PCC):</span>
                  <span className="font-bold">23 kN/m³ (144 pcf)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/40">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Structural Steel:</span>
                  <span className="font-bold">78.5 kN/m³ (490 pcf)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Water:</span>
                  <span className="font-bold">9.81 kN/m³ (62.4 pcf)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: STRESS, PRESSURE & FORCE */}
      {/* ===================================================================== */}
      {activeTab === 'pressure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                  <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Stress & Pressure Converter
                  </h2>
                </div>
                <AddToHistoryButton
                  item={{
                    type: 'conversion',
                    title: `Stress: ${pressValue} ${pressFromUnit.toUpperCase()} to ${pressToUnit.toUpperCase()}`,
                    moduleId: 'converter-stress',
                    summary: `${pressValue} ${pressFromUnit} = ${formatNum(pressResult)} ${pressToUnit}`,
                    status: 'valid',
                    keyMetrics: [
                      { label: 'Input', value: `${pressValue} ${pressFromUnit}` },
                      { label: 'Result', value: `${formatNum(pressResult)} ${pressToUnit}` },
                    ],
                    inputs: { pressValue, pressFromUnit, pressToUnit },
                    results: { pressResult },
                    tags: ['stress', 'pressure', 'mpa', 'psi', 'ksi'],
                  }}
                  label="Save to History"
                  variant="outline"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                <div className="sm:col-span-5 space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                    From Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={pressValue}
                    onChange={(e) => setPressValue(parseFloat(e.target.value) || 0)}
                    className="w-full h-12 px-3 text-lg font-mono font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                  />
                  <select
                    value={pressFromUnit}
                    onChange={(e) => setPressFromUnit(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="mpa">Megapascal (MPa = N/mm²)</option>
                    <option value="psi">Pounds per sq inch (psi)</option>
                    <option value="ksi">Kips per sq inch (ksi = 1000 psi)</option>
                    <option value="kpa">Kilopascal (kPa = kN/m²)</option>
                    <option value="gpa">Gigapascal (GPa)</option>
                    <option value="psf">Pounds per sq ft (psf)</option>
                    <option value="ksf">Kips per sq ft (ksf)</option>
                    <option value="bar">Bar</option>
                    <option value="kgf_cm2">kg/cm² (at)</option>
                    <option value="pa">Pascal (Pa)</option>
                  </select>
                </div>

                <div className="sm:col-span-1 flex justify-center py-2 sm:py-0">
                  <button
                    type="button"
                    onClick={() => {
                      const temp = pressFromUnit;
                      setPressFromUnit(pressToUnit);
                      setPressToUnit(temp);
                    }}
                    className="w-10 h-10 rounded-full border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] flex items-center justify-center cursor-pointer transition-transform hover:rotate-180"
                    title="Swap Units"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="sm:col-span-5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                      Converted Result
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(formatNum(pressResult), 'press-main')}
                      className="text-xs font-mono text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'press-main' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'press-main' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="w-full h-12 px-3 text-lg font-mono font-extrabold rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 flex items-center overflow-x-auto no-scrollbar">
                    {formatNum(pressResult)}
                  </div>
                  <select
                    value={pressToUnit}
                    onChange={(e) => setPressToUnit(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="psi">Pounds per sq inch (psi)</option>
                    <option value="mpa">Megapascal (MPa = N/mm²)</option>
                    <option value="ksi">Kips per sq inch (ksi = 1000 psi)</option>
                    <option value="kpa">Kilopascal (kPa = kN/m²)</option>
                    <option value="gpa">Gigapascal (GPa)</option>
                    <option value="psf">Pounds per sq ft (psf)</option>
                    <option value="ksf">Kips per sq ft (ksf)</option>
                    <option value="bar">Bar</option>
                    <option value="kgf_cm2">kg/cm² (at)</option>
                    <option value="pa">Pascal (Pa)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Common Civil Concrete & Steel Strengths */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Common Engineering Strengths Reference
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Concrete f'c 3000 psi</div>
                  <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">20.68 MPa</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">M20 ~ M25</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Concrete f'c 4000 psi</div>
                  <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">27.58 MPa</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">M28 ~ M30</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Steel fy Grade 60</div>
                  <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">413.68 MPa</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">60 ksi = Fe 415</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Steel fy Grade 75 / 500W</div>
                  <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">500.00 MPa</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">72.5 ksi = Fe 500</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {/* Force Quick Equivalents */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Structural Force Reference Conversions
              </span>
              <div className="divide-y divide-[var(--md-sys-color-outline-variant)]/40 text-xs font-mono">
                {[
                  { from: '1 kip', to: '4.448 kN', note: '1,000 lbf' },
                  { from: '100 kN', to: '22.48 kips', note: 'Column / Reaction load' },
                  { from: '1 metric ton-force (tf)', to: '9.807 kN', note: '1,000 kgf' },
                  { from: '1 kN', to: '224.81 lbf', note: 'Metric base force' },
                ].map((row, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[var(--md-sys-color-on-surface)]">{row.from}</span>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] mx-2">=</span>
                      <span className="font-bold text-emerald-600">{row.to}</span>
                    </div>
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">{row.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: LENGTH & COMPOUND FEET-INCH */}
      {/* ===================================================================== */}
      {activeTab === 'length' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Standard Length Converter */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                  <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Standard Length & Distance
                  </h2>
                </div>
                <AddToHistoryButton
                  item={{
                    type: 'conversion',
                    title: `Length: ${lengthValue} ${lengthFromUnit.toUpperCase()} to ${lengthToUnit.toUpperCase()}`,
                    moduleId: 'converter-length',
                    summary: `${lengthValue} ${lengthFromUnit} = ${formatNum(lengthResult)} ${lengthToUnit}`,
                    status: 'valid',
                    keyMetrics: [
                      { label: 'Input', value: `${lengthValue} ${lengthFromUnit}` },
                      { label: 'Result', value: `${formatNum(lengthResult)} ${lengthToUnit}` },
                    ],
                    inputs: { lengthValue, lengthFromUnit, lengthToUnit },
                    results: { lengthResult },
                    tags: ['length', 'distance', 'surveying'],
                  }}
                  label="Save to History"
                  variant="outline"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                <div className="sm:col-span-5 space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                    From Length
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={lengthValue}
                    onChange={(e) => setLengthValue(parseFloat(e.target.value) || 0)}
                    className="w-full h-12 px-3 text-lg font-mono font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <select
                    value={lengthFromUnit}
                    onChange={(e) => setLengthFromUnit(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="m">Meter (m)</option>
                    <option value="mm">Millimeter (mm)</option>
                    <option value="cm">Centimeter (cm)</option>
                    <option value="km">Kilometer (km)</option>
                    <option value="ft">Foot / Feet (ft)</option>
                    <option value="in">Inch (in)</option>
                    <option value="yd">Yard (yd)</option>
                    <option value="mi">Mile (mi)</option>
                    <option value="chain">Chain (66 ft)</option>
                    <option value="link">Link (7.92 in)</option>
                  </select>
                </div>

                <div className="sm:col-span-1 flex justify-center py-2 sm:py-0">
                  <button
                    type="button"
                    onClick={() => {
                      const temp = lengthFromUnit;
                      setLengthFromUnit(lengthToUnit);
                      setLengthToUnit(temp);
                    }}
                    className="w-10 h-10 rounded-full border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] flex items-center justify-center cursor-pointer transition-transform hover:rotate-180"
                    title="Swap Units"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="sm:col-span-5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                      Converted Result
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(formatNum(lengthResult), 'len-main')}
                      className="text-xs font-mono text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'len-main' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'len-main' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="w-full h-12 px-3 text-lg font-mono font-extrabold rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 flex items-center overflow-x-auto no-scrollbar">
                    {formatNum(lengthResult)}
                  </div>
                  <select
                    value={lengthToUnit}
                    onChange={(e) => setLengthToUnit(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="ft">Foot / Feet (ft)</option>
                    <option value="m">Meter (m)</option>
                    <option value="in">Inch (in)</option>
                    <option value="mm">Millimeter (mm)</option>
                    <option value="cm">Centimeter (cm)</option>
                    <option value="km">Kilometer (km)</option>
                    <option value="yd">Yard (yd)</option>
                    <option value="mi">Mile (mi)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Interactive Feet-Inch Compound Tool */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Interactive Feet-Inch Tool
                  </h3>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Compound 12' 6" ⇄ Metric Dimensions
                  </p>
                </div>
                <AddToHistoryButton
                  item={{
                    type: 'conversion',
                    title: `Feet-Inch: ${ftInput}'-${inInput}" (${formatNum(compoundMeters, 3)} m)`,
                    moduleId: 'converter-compound-feet-inch',
                    summary: `${ftInput}' ${inInput}" = ${formatNum(compoundMeters, 3)} m = ${formatNum(compoundMeters * 1000, 1)} mm`,
                    status: 'valid',
                    keyMetrics: [
                      { label: 'Feet-Inch', value: `${ftInput}' ${inInput}"` },
                      { label: 'Meters', value: `${formatNum(compoundMeters, 3)} m` },
                      { label: 'Millimeters', value: `${formatNum(compoundMeters * 1000, 1)} mm` },
                      { label: 'Decimal Feet', value: `${formatNum(compoundFeet, 3)} ft` },
                    ],
                    inputs: { ftInput, inInput },
                    results: { compoundMeters, compoundFeet, compoundTotalInches },
                    tags: ['feet-inch', 'architectural-units', 'dimensions'],
                  }}
                  label="Save"
                  compact
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                    Feet (')
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={ftInput}
                    onChange={(e) => setFtInput(parseFloat(e.target.value) || 0)}
                    className="w-full h-11 px-3 text-base font-mono font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                    Inches (")
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={inInput}
                    onChange={(e) => setInInput(parseFloat(e.target.value) || 0)}
                    className="w-full h-11 px-3 text-base font-mono font-bold rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Total Meters:</span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                    {formatNum(compoundMeters, 3)} m
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Millimeters (mm):</span>
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                    {formatNum(compoundMeters * 1000, 1)} mm
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Decimal Feet:</span>
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                    {formatNum(compoundFeet, 3)} ft
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Total Inches:</span>
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                    {compoundTotalInches} in
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED EXPANDABLE "ABOUT THIS TOOL" MONOGRAPH & USER GUIDANCE SECTION */}
      <AboutThisTool
        toolId="unit-converter"
        id="converter-about-section"
        defaultExpanded={true}
      />
    </div>
  );
};
