import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Settings,
  ArrowRightLeft,
  RefreshCw,
  Check,
  HelpCircle,
  Search,
  Star,
  Pin,
  Filter,
  Copy,
  Maximize2,
  Ruler,
  Boxes,
  Scale,
  Zap,
  Gauge,
  RotateCcw,
  ArrowDownUp,
  Layers,
  Box,
  TrendingUp,
  Wind,
  Droplets,
  Activity,
  Thermometer,
  Flame,
  Cpu,
  Clock,
  HardDrive,
  Fuel,
  Edit3,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  CivilWorkspace,
  UnitCategoryKey,
  CustomUnitDefinition,
} from '../../types/civil';
import {
  STANDARD_UNITS,
  BASE_UNITS,
  convertDirect,
  computeRegionalLandBreakdown,
  FeetInchParseResult,
  formatSmartNumber,
  formatNumberWhileTyping,
  formatFeetInches,
  parseNaturalConversionExpression,
  NaturalExpressionParseResult,
} from '../../utils/unitConverter';
import { parseSmartUnitInput } from '../../utils/unitEngine';
import { ExplainConversionModal } from '../modals/ExplainConversionModal';

export { ExplainConversionModal };

// -----------------------------------------------------------------------------
// Macro-Domains Definition
// -----------------------------------------------------------------------------
export type MacroDomain =
  | 'all'
  | 'pinned'
  | 'civil_structural'
  | 'regional_bd'
  | 'geotech_hydraulics'
  | 'physics_mep'
  | 'digital_everyday';

export interface MacroDomainInfo {
  id: MacroDomain;
  labelEn: string;
  labelBn: string;
  icon: string;
  categories: UnitCategoryKey[];
}

export const MACRO_DOMAINS: MacroDomainInfo[] = [
  {
    id: 'all',
    labelEn: 'All Categories (21)',
    labelBn: 'সব পরিমাপ',
    icon: '🌐',
    categories: [
      'length',
      'area',
      'volume',
      'mass',
      'force',
      'pressure',
      'moment',
      'distributed_load',
      'density',
      'section_properties',
      'slope',
      'velocity',
      'flow_rate',
      'viscosity',
      'temperature',
      'energy',
      'power',
      'time_frequency',
      'digital_storage',
      'fuel_economy',
      'cad_typography',
    ],
  },
  {
    id: 'civil_structural',
    labelEn: 'Civil & Structural (10)',
    labelBn: 'পূর্ত ও স্ট্রাকচারাল',
    icon: '🏗️',
    categories: [
      'length',
      'area',
      'volume',
      'mass',
      'force',
      'pressure',
      'moment',
      'distributed_load',
      'density',
      'section_properties',
    ],
  },
  {
    id: 'regional_bd',
    labelEn: 'BD Land & Regional (4)',
    labelBn: 'বাংলাদেশ ভূমি ও ঐতিহ্য',
    icon: '🇧🇩',
    categories: ['area', 'mass', 'volume', 'length'],
  },
  {
    id: 'geotech_hydraulics',
    labelEn: 'Geotech & Hydraulics (5)',
    labelBn: 'ভূ-কারিগরি ও হাইড্রলিক্স',
    icon: '💧',
    categories: ['pressure', 'flow_rate', 'viscosity', 'density', 'slope'],
  },
  {
    id: 'physics_mep',
    labelEn: 'Physics & MEP (5)',
    labelBn: 'পদার্থ ও এমইপি',
    icon: '⚡',
    categories: ['temperature', 'energy', 'power', 'velocity', 'time_frequency'],
  },
  {
    id: 'digital_everyday',
    labelEn: 'Digital, Transport & CAD (3)',
    labelBn: 'ডিজিটাল ও ড্রয়িং',
    icon: '📐',
    categories: ['digital_storage', 'fuel_economy', 'cad_typography'],
  },
  {
    id: 'pinned',
    labelEn: 'Pinned & Favorites',
    labelBn: 'পিন করা প্রিয় ক্যাটাগরি',
    icon: '⭐',
    categories: [],
  },
];

// -----------------------------------------------------------------------------
// Category Metadata (Icons, English & Bengali Titles, Previews)
// -----------------------------------------------------------------------------
export interface CategoryMeta {
  id: UnitCategoryKey;
  nameEn: string;
  nameBn: string;
  icon: React.ComponentType<{ className?: string }>;
  topPreviews: string[];
  description: string;
}

export const CATEGORY_METAS: Record<UnitCategoryKey, CategoryMeta> = {
  length: {
    id: 'length',
    nameEn: 'Length & Distance',
    nameBn: 'দৈর্ঘ্য ও দূরত্ব',
    icon: Ruler,
    topPreviews: ['m', 'ft', "ft'-in\"", 'mm', 'suta', 'chain'],
    description: 'SI meters, imperial feet/inches, rebar mm, and regional suta/chain/link',
  },
  area: {
    id: 'area',
    nameEn: 'Area & Land Survey',
    nameBn: 'ক্ষেত্রফল ও ভূমি পরিমাপ',
    icon: Maximize2,
    topPreviews: ['sft', 'm²', 'katha', 'decimal', 'bigha', 'kani'],
    description: 'SFT, sqm, acres, shotok/decimal, katha, bigha, kani, and gonda',
  },
  volume: {
    id: 'volume',
    nameEn: 'Volume & Capacity',
    nameBn: 'আয়তন ও ধারকত্ব',
    icon: Boxes,
    topPreviews: ['m³', 'cft', 'Liter', 'bag (50kg)', 'brass', 'gal'],
    description: 'Cumec, CFT, cement bag (1.226 cft), truck loads, brass, and liters',
  },
  mass: {
    id: 'mass',
    nameEn: 'Mass & Weight',
    nameBn: 'ভর ও ওজন',
    icon: Scale,
    topPreviews: ['kg', 'tonne', 'lb', 'maund', 'seer', 'tola'],
    description: 'Kilograms, metric tonnes, imperial lbs, maund, seer, tola, and ana',
  },
  force: {
    id: 'force',
    nameEn: 'Force & Reaction',
    nameBn: 'বল ও প্রতিক্রিয়া',
    icon: Zap,
    topPreviews: ['kN', 'kip', 'N', 'lbf', 'ton-force'],
    description: 'Structural reactions in kN, kips, newtons, and pound-force',
  },
  pressure: {
    id: 'pressure',
    nameEn: 'Pressure & Strength',
    nameBn: 'চাপ ও কংক্রিট শক্তি',
    icon: Gauge,
    topPreviews: ['MPa', 'psi', 'kPa', 'bar', 'psf', 'ksi'],
    description: 'Concrete f\'c in MPa/psi, soil bearing in kPa/psf/ksf, and bar',
  },
  moment: {
    id: 'moment',
    nameEn: 'Bending Moment & Torque',
    nameBn: 'বেন্ডিং মোমেন্ট ও টর্ক',
    icon: RotateCcw,
    topPreviews: ['kN·m', 'kip·ft', 'N·m', 'lbf·ft'],
    description: 'Flexural moments Mmax in kN·m, kip·ft, N·m, and lbf·ft',
  },
  distributed_load: {
    id: 'distributed_load',
    nameEn: 'Uniform Line Load',
    nameBn: 'বিস্তৃত লোড (ইউডিএল)',
    icon: ArrowDownUp,
    topPreviews: ['kN/m', 'plf (lb/ft)', 'klf', 'N/mm'],
    description: 'Beam and slab line loads in kN/m, plf, klf, and N/mm',
  },
  density: {
    id: 'density',
    nameEn: 'Unit Weight & Density',
    nameBn: 'একক ওজন ও ঘনত্ব',
    icon: Layers,
    topPreviews: ['kN/m³', 'pcf', 'kg/m³', 'g/cm³'],
    description: 'Soil unit weight γ in kN/m³, concrete pcf, and kg/m³',
  },
  section_properties: {
    id: 'section_properties',
    nameEn: 'Section Properties (I, S)',
    nameBn: 'সেকশন জড়তার ভ্রামক',
    icon: Box,
    topPreviews: ['mm⁴', 'in⁴', 'cm⁴', 'mm³', 'in³'],
    description: 'Moment of Inertia (Ix, Iy) and elastic section modulus (Sx, Sy)',
  },
  slope: {
    id: 'slope',
    nameEn: 'Slope & Grade',
    nameBn: 'ঢাল, নতি ও কোণ',
    icon: TrendingUp,
    topPreviews: ['% grade', 'degree (°)', 'ratio (1:n)', 'rad'],
    description: 'Ramp/roof slope in % grade, degrees, 1:n ratio, and radians',
  },
  velocity: {
    id: 'velocity',
    nameEn: 'Flow Velocity & Speed',
    nameBn: 'বেগ ও প্রবাহ গতিবেগ',
    icon: Wind,
    topPreviews: ['m/s', 'ft/s', 'km/h', 'mph'],
    description: 'Open channel flow velocity in m/s, ft/s, km/h, and mph',
  },
  flow_rate: {
    id: 'flow_rate',
    nameEn: 'Discharge & Flow Rate',
    nameBn: 'নির্গমন ও প্রবাহ হার (Q)',
    icon: Droplets,
    topPreviews: ['m³/s (cumec)', 'cfs (cusec)', 'L/s', 'gpm', 'm³/hr'],
    description: 'Hydraulic discharge in cumecs (m³/s), cusecs (cfs), L/s, and GPM',
  },
  viscosity: {
    id: 'viscosity',
    nameEn: 'Viscosity (Fluid)',
    nameBn: 'সান্দ্রতা (তরল গতি)',
    icon: Activity,
    topPreviews: ['Pa·s', 'cP (centipoise)', 'm²/s', 'cSt'],
    description: 'Dynamic viscosity (Pa·s, cP) and kinematic viscosity (cSt, m²/s)',
  },
  temperature: {
    id: 'temperature',
    nameEn: 'Temperature',
    nameBn: 'তাপমাত্রা',
    icon: Thermometer,
    topPreviews: ['°C', '°F', 'K', '°R'],
    description: 'Celsius, Fahrenheit, Kelvin, and Rankine thermal scales',
  },
  energy: {
    id: 'energy',
    nameEn: 'Energy & Work',
    nameBn: 'শক্তি ও কাজ',
    icon: Flame,
    topPreviews: ['J', 'kJ', 'kWh', 'BTU', 'kcal'],
    description: 'Joules, kilowatt-hours, British Thermal Units, and calories',
  },
  power: {
    id: 'power',
    nameEn: 'Power & Heat Flow',
    nameBn: 'ক্ষমতা ও লোড',
    icon: Cpu,
    topPreviews: ['kW', 'HP (mechanical)', 'W', 'TR (cooling)', 'BTU/h'],
    description: 'Kilowatts, horsepower (HP), chiller tons (TR), and Watts',
  },
  time_frequency: {
    id: 'time_frequency',
    nameEn: 'Time & Frequency',
    nameBn: 'সময় ও কম্পাঙ্ক',
    icon: Clock,
    topPreviews: ['s', 'hr', 'day', 'Hz', 'kHz'],
    description: 'Seconds, hours, days, structural frequency (Hz), and period',
  },
  digital_storage: {
    id: 'digital_storage',
    nameEn: 'Digital Storage & BIM',
    nameBn: 'ডিজিটাল স্টোরেজ ও বিআইএম',
    icon: HardDrive,
    topPreviews: ['MB', 'GB', 'TB', 'Byte'],
    description: 'CAD drawings, point cloud scans, and BIM model file sizes',
  },
  fuel_economy: {
    id: 'fuel_economy',
    nameEn: 'Fuel Consumption',
    nameBn: 'জ্বালানি সাশ্রয়িতা',
    icon: Fuel,
    topPreviews: ['km/L', 'L/100km', 'mpg (US)'],
    description: 'Site fleet and heavy equipment fuel consumption efficiency',
  },
  cad_typography: {
    id: 'cad_typography',
    nameEn: 'CAD Scale & Typography',
    nameBn: 'ক্যাড ড্রয়িং ও স্কেল',
    icon: Edit3,
    topPreviews: ['mm', 'pt (point)', 'px (96dpi)', 'mil (0.001in)'],
    description: 'Drawing sheet scale, typography points, pixels, and mils',
  },
};

// Common paired units for quick single-click selection per engineering category
const COMMON_CATEGORY_PAIRS: Record<
  UnitCategoryKey,
  Array<{ label: string; from: string; to: string; title?: string }>
> = {
  length: [
    { label: 'm ⇄ ft', from: 'm', to: 'ft', title: 'Metric Meters ↔ Imperial Feet' },
    { label: "m ⇄ ft'-in\"", from: 'm', to: 'ft-in', title: 'Meters ↔ Architectural Feet-Inch' },
    { label: "ft ⇄ ft'-in\"", from: 'ft', to: 'ft-in', title: 'Decimal Feet ↔ Architectural Feet-Inch' },
    { label: 'mm ⇄ in', from: 'mm', to: 'in', title: 'Rebar Millimeters ↔ Inches' },
    { label: 'suta ⇄ mm', from: 'suta', to: 'mm', title: 'Bangla Suta (1/8") ↔ Rebar mm' },
    { label: 'm ⇄ mm', from: 'm', to: 'mm', title: 'Meters ↔ Millimeters' },
    { label: 'chain ⇄ ft', from: 'chain', to: 'ft', title: "Gunter's Chain (66 ft) ↔ Feet" },
  ],
  area: [
    { label: 'katha ⇄ sft', from: 'katha', to: 'ft2', title: 'Katha (720 sq ft) ↔ SFT' },
    { label: 'decimal ⇄ sft', from: 'decimal', to: 'ft2', title: 'Decimal/Shotok (435.6 sq ft) ↔ SFT' },
    { label: 'decimal ⇄ katha', from: 'decimal', to: 'katha', title: 'Decimal ↔ Katha (1.65 dec/katha)' },
    { label: 'm² ⇄ sft', from: 'm2', to: 'ft2', title: 'Square Meters ↔ Square Feet' },
    { label: 'katha ⇄ bigha', from: 'katha', to: 'bigha', title: 'Katha (20 katha/bigha) ↔ Bigha' },
    { label: 'bigha ⇄ acre', from: 'bigha', to: 'acre', title: 'Bigha (3.025 bigha/ac) ↔ Acre' },
    { label: 'kani ⇄ decimal', from: 'kani', to: 'decimal', title: 'Kani ↔ Decimal' },
    { label: 'ha ⇄ acre', from: 'ha', to: 'acre', title: 'Hectare (2.471 ac) ↔ Acre' },
  ],
  volume: [
    { label: 'm³ ⇄ cft', from: 'm3', to: 'cft', title: 'Cubic Meters ↔ CFT (35.315 cft/m³)' },
    { label: 'm³ ⇄ Liter', from: 'm3', to: 'liter', title: 'Cubic Meters ↔ Liters' },
    { label: 'cft ⇄ bag', from: 'cft', to: 'bag_cement', title: 'CFT ↔ Cement Bags (1.226 cft/bag)' },
    { label: 'cft ⇄ brass', from: 'cft', to: 'brass', title: 'CFT ↔ Brass (100 CFT)' },
    { label: 'cft ⇄ US gal', from: 'cft', to: 'gal_us', title: 'CFT ↔ US Gallons' },
  ],
  mass: [
    { label: 'kg ⇄ lb', from: 'kg', to: 'lb', title: 'Kilograms ↔ Imperial Pounds' },
    { label: 'tonne ⇄ kg', from: 'tonne', to: 'kg', title: 'Metric Tonne ↔ Kilograms' },
    { label: 'maund ⇄ kg', from: 'maund', to: 'kg', title: 'Regional Maund (40 seers = 37.324 kg) ↔ Kilograms' },
    { label: 'seer ⇄ kg', from: 'seer', to: 'kg', title: 'Seer (0.9331 kg) ↔ Kilograms' },
    { label: 'tola ⇄ gram', from: 'tola', to: 'g', title: 'Tola/Vori (11.664 g) ↔ Grams' },
  ],
  pressure: [
    { label: 'MPa ⇄ psi', from: 'MPa', to: 'psi', title: 'Concrete Strength MPa ↔ PSI (1 MPa ≈ 145 psi)' },
    { label: 'kPa ⇄ psf', from: 'kPa', to: 'psf', title: 'Soil Bearing kPa ↔ PSF' },
    { label: 'GPa ⇄ ksi', from: 'GPa', to: 'ksi', title: 'Modulus GPa ↔ KSI' },
    { label: 'bar ⇄ psi', from: 'bar', to: 'psi', title: 'Bar ↔ PSI' },
    { label: 'tsf ⇄ ksf', from: 'tsf', to: 'ksf', title: 'Tons/sq ft ↔ Kips/sq ft' },
  ],
  force: [
    { label: 'kN ⇄ kip', from: 'kN', to: 'kip', title: 'Kilonewtons ↔ US Kips (1 kip ≈ 4.448 kN)' },
    { label: 'kN ⇄ lbf', from: 'kN', to: 'lbf', title: 'Kilonewtons ↔ Pound-force' },
    { label: 'kN ⇄ N', from: 'kN', to: 'N', title: 'Kilonewtons ↔ Newtons' },
    { label: 'MN ⇄ kip', from: 'MN', to: 'kip', title: 'Meganewtons ↔ Kips' },
  ],
  distributed_load: [
    { label: 'kN/m ⇄ plf', from: 'kN/m', to: 'plf', title: 'Uniform Load kN/m ↔ Pounds/foot (plf)' },
    { label: 'kN/m ⇄ klf', from: 'kN/m', to: 'klf', title: 'Uniform Load kN/m ↔ Kips/foot (klf)' },
    { label: 'kN/m ⇄ N/mm', from: 'kN/m', to: 'N/mm', title: 'kN/m ↔ N/mm' },
  ],
  density: [
    { label: 'kN/m³ ⇄ pcf', from: 'kN/m3', to: 'pcf', title: 'Soil Unit Weight kN/m³ ↔ PCF' },
    { label: 'kg/m³ ⇄ pcf', from: 'kg/m3', to: 'pcf', title: 'Density kg/m³ ↔ PCF' },
  ],
  moment: [
    { label: 'kN·m ⇄ kip·ft', from: 'kN.m', to: 'kip.ft', title: 'Bending Moment kN·m ↔ Kip·ft' },
    { label: 'N·m ⇄ lbf·ft', from: 'N.m', to: 'lbf.ft', title: 'Newton·meters ↔ Pound-force·ft' },
  ],
  section_properties: [
    { label: 'mm⁴ ⇄ in⁴', from: 'mm4', to: 'in4', title: 'Moment of Inertia mm⁴ ↔ in⁴' },
    { label: 'cm⁴ ⇄ in⁴', from: 'cm4', to: 'in4', title: 'cm⁴ ↔ in⁴' },
    { label: 'mm³ ⇄ in³', from: 'mm3', to: 'in3', title: 'Section Modulus mm³ ↔ in³' },
  ],
  slope: [
    { label: 'degree ⇄ % grade', from: 'degree', to: 'percent', title: 'Slope Angle Degree ↔ Percent Grade' },
    { label: 'ratio ⇄ % grade', from: 'ratio', to: 'percent', title: 'Slope Ratio (1:n) ↔ Percent Grade' },
  ],
  velocity: [
    { label: 'm/s ⇄ ft/s', from: 'm/s', to: 'ft/s', title: 'Flow Velocity m/s ↔ ft/s' },
    { label: 'km/h ⇄ mph', from: 'km/h', to: 'mph', title: 'Speed km/h ↔ Miles per hour' },
  ],
  flow_rate: [
    { label: 'm³/s ⇄ cfs', from: 'm3/s', to: 'cfs', title: 'Cumecs (m³/s) ↔ Cusecs (cfs)' },
    { label: 'L/s ⇄ gpm', from: 'L/s', to: 'gpm', title: 'Discharge L/s ↔ US GPM' },
    { label: 'm³/hr ⇄ gpm', from: 'm3/hr', to: 'gpm', title: 'Treatment Plant m³/hr ↔ GPM' },
  ],
  viscosity: [
    { label: 'Pa·s ⇄ cP', from: 'Pa.s', to: 'cP', title: 'Pascal-second ↔ Centipoise (1 Pa·s = 1000 cP)' },
    { label: 'm²/s ⇄ cSt', from: 'm2_s', to: 'cSt', title: 'Kinematic m²/s ↔ Centistokes (10⁶ cSt)' },
  ],
  temperature: [
    { label: '°C ⇄ °F', from: 'c', to: 'f', title: 'Celsius ↔ Fahrenheit' },
    { label: '°C ⇄ K', from: 'c', to: 'k', title: 'Celsius ↔ Kelvin' },
    { label: '°F ⇄ K', from: 'f', to: 'k', title: 'Fahrenheit ↔ Kelvin' },
  ],
  energy: [
    { label: 'kJ ⇄ BTU', from: 'kJ', to: 'btu', title: 'Kilojoules ↔ British Thermal Units' },
    { label: 'kWh ⇄ MJ', from: 'kWh', to: 'MJ', title: 'Kilowatt-hours ↔ Megajoules' },
    { label: 'kcal ⇄ kJ', from: 'kcal', to: 'kJ', title: 'Kilocalories ↔ Kilojoules' },
  ],
  power: [
    { label: 'kW ⇄ HP', from: 'kW', to: 'hp', title: 'Kilowatts ↔ Horsepower (1 HP ≈ 0.7457 kW)' },
    { label: 'TR ⇄ kW', from: 'TR', to: 'kW', title: 'Tons of Refrigeration (TR) ↔ kW (1 TR ≈ 3.5168 kW)' },
    { label: 'BTU/h ⇄ kW', from: 'btu_h', to: 'kW', title: 'BTU/h ↔ kW' },
  ],
  time_frequency: [
    { label: 'hr ⇄ min', from: 'hr', to: 'min', title: 'Hours ↔ Minutes' },
    { label: 'day ⇄ hr', from: 'day', to: 'hr', title: 'Days ↔ Hours' },
    { label: 'Hz ⇄ kHz', from: 'hz', to: 'khz', title: 'Hertz ↔ Kilohertz' },
  ],
  digital_storage: [
    { label: 'MB ⇄ GB', from: 'MB', to: 'GB', title: 'Megabytes ↔ Gigabytes' },
    { label: 'GB ⇄ TB', from: 'GB', to: 'TB', title: 'Gigabytes ↔ Terabytes' },
  ],
  fuel_economy: [
    { label: 'km/L ⇄ L/100km', from: 'km_l', to: 'l_100km', title: 'km per Liter ↔ Liters per 100km (Reciprocal)' },
    { label: 'km/L ⇄ mpg (US)', from: 'km_l', to: 'mpg_us', title: 'km per Liter ↔ US MPG' },
  ],
  cad_typography: [
    { label: 'mm ⇄ pt', from: 'mm', to: 'pt', title: 'CAD Millimeters ↔ Points (1 pt = 1/72 in)' },
    { label: 'mm ⇄ px (96dpi)', from: 'mm', to: 'px_96', title: 'Millimeters ↔ Screen Pixels (96 DPI)' },
    { label: 'in ⇄ mil', from: 'in', to: 'mil', title: 'Inches ↔ Mils (1 mil = 0.001 in)' },
  ],
};

// -----------------------------------------------------------------------------
// Component Props
// -----------------------------------------------------------------------------
export interface UnitConverterInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  availableCategoryUnits: Array<{ id: string; name: string; symbol: string; isRegional?: boolean }>;
  activeFeetInchResult: FeetInchParseResult;
  onOpenCustomUnitsModal: () => void;
  conversionResult?: {
    result: number;
    formula: string;
  };
}

export const UnitConverterInputs: React.FC<UnitConverterInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  availableCategoryUnits,
  activeFeetInchResult,
  onOpenCustomUnitsModal,
  conversionResult,
}) => {
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastSwapNotice, setLastSwapNotice] = useState<string | null>(null);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [activeMacroDomain, setActiveMacroDomain] = useState<MacroDomain>('all');
  const [omniSearchQuery, setOmniSearchQuery] = useState('');
  const [isBentoExpanded, setIsBentoExpanded] = useState(false);
  const [pinnedCategories, setPinnedCategories] = useState<UnitCategoryKey[]>(() => {
    try {
      const stored = localStorage.getItem('bdcivillab_pinned_categories');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return ['length', 'area', 'volume', 'mass', 'pressure'];
  });

  // Table filter and scientific notation options for All-Units Live Comparison Grid
  const [comparisonSearch, setComparisonSearch] = useState('');
  const [comparisonPrecision, setComparisonPrecision] = useState<number>(4);
  const [isScientific, setIsScientific] = useState(false);
  const [copiedUnitId, setCopiedUnitId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const converter = activeWorkspace.converter;
  const currentCategory = converter.category;
  const regionalLandPreset = converter.regionalLandPreset || 'standard';

  // Toggle Pinned status
  const togglePinCategory = (cat: UnitCategoryKey, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedCategories((prev) => {
      const next = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      try {
        localStorage.setItem('bdcivillab_pinned_categories', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut '/' to focus Omni-Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Natural Language Expression Parsing
  const naturalParseResult = useMemo<NaturalExpressionParseResult>(() => {
    if (!omniSearchQuery.trim()) return { parsed: false };
    return parseNaturalConversionExpression(omniSearchQuery, customUnits);
  }, [omniSearchQuery, customUnits]);

  // Local state for freeform text typing with clean comma auto-formatting
  const [displayInputString, setDisplayInputString] = useState<string>(() =>
    converter.inputValue !== undefined && converter.inputValue !== null
      ? formatNumberWhileTyping(String(converter.inputValue)).formatted
      : ''
  );

  // Sync internal display when external workspace inputValue changes
  useEffect(() => {
    const numericFromDisplay = parseFloat(displayInputString.replace(/,/g, ''));
    if (!isNaN(converter.inputValue) && numericFromDisplay !== converter.inputValue) {
      setDisplayInputString(formatNumberWhileTyping(String(converter.inputValue)).formatted);
    }
  }, [converter.inputValue]);

  // Calculate live conversion result if not passed
  const currentConvertedValue = useMemo(() => {
    if (conversionResult) return conversionResult.result;
    try {
      const res = convertDirect(
        converter.inputValue,
        converter.fromUnit,
        converter.toUnit,
        converter.category,
        customUnits
      );
      return isNaN(res) || !isFinite(res) ? null : res;
    } catch {
      return null;
    }
  }, [conversionResult, converter.inputValue, converter.fromUnit, converter.toUnit, converter.category, customUnits]);

  // Exhaustive regional land breakdown matrix when discipline is 'area'
  const landBreakdown = useMemo(() => {
    if (currentCategory !== 'area') return null;
    return computeRegionalLandBreakdown(
      converter.inputValue,
      converter.fromUnit,
      customUnits,
      regionalLandPreset
    );
  }, [currentCategory, converter.inputValue, converter.fromUnit, customUnits, regionalLandPreset]);

  // Multi-unit live comparison grid: Compute values for ALL units in the active category
  const comparisonRows = useMemo(() => {
    const units = availableCategoryUnits;
    return units.map((u) => {
      let val = 0;
      let formatted = '—';
      try {
        val = convertDirect(
          converter.inputValue,
          converter.fromUnit,
          u.id,
          converter.category,
          customUnits
        );
        if (isNaN(val) || !isFinite(val)) {
          formatted = 'N/A';
        } else if (isScientific) {
          formatted = val.toExponential(comparisonPrecision);
        } else {
          formatted = formatSmartNumber(val, comparisonPrecision);
        }
      } catch {
        formatted = 'Error';
      }
      return {
        unit: u,
        value: val,
        formatted,
        isSource: u.id === converter.fromUnit,
        isTarget: u.id === converter.toUnit,
      };
    });
  }, [
    availableCategoryUnits,
    converter.inputValue,
    converter.fromUnit,
    converter.toUnit,
    converter.category,
    customUnits,
    isScientific,
    comparisonPrecision,
  ]);

  // Filtered comparison rows for search bar inside the comparison grid
  const filteredComparisonRows = useMemo(() => {
    if (!comparisonSearch.trim()) return comparisonRows;
    const q = comparisonSearch.toLowerCase().trim();
    return comparisonRows.filter(
      (r) =>
        r.unit.id.toLowerCase().includes(q) ||
        r.unit.name.toLowerCase().includes(q) ||
        r.unit.symbol.toLowerCase().includes(q)
    );
  }, [comparisonRows, comparisonSearch]);

  // Categories filtered by active Macro-Domain and Omni-Search query
  const displayedCategories = useMemo(() => {
    let cats: UnitCategoryKey[] = [];
    if (activeMacroDomain === 'pinned') {
      cats = pinnedCategories;
    } else {
      const domainInfo = MACRO_DOMAINS.find((d) => d.id === activeMacroDomain);
      cats = domainInfo ? domainInfo.categories : MACRO_DOMAINS[0].categories;
    }

    if (!omniSearchQuery.trim()) return cats;

    const q = omniSearchQuery.toLowerCase().trim();
    return cats.filter((c) => {
      const meta = CATEGORY_METAS[c];
      if (!meta) return false;
      return (
        meta.nameEn.toLowerCase().includes(q) ||
        meta.nameBn.toLowerCase().includes(q) ||
        meta.id.toLowerCase().includes(q) ||
        meta.topPreviews.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [activeMacroDomain, pinnedCategories, omniSearchQuery]);

  // Copy handler
  const handleCopyComparisonValue = (text: string, unitId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUnitId(unitId);
    setTimeout(() => setCopiedUnitId(null), 1800);
  };

  // Instant Swap handler with rotation animation
  const handleSwapUnits = (withValueCarry: boolean = false) => {
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 380);

    const oldFrom = converter.fromUnit;
    const oldTo = converter.toUnit;

    let nextValue = converter.inputValue;
    if (withValueCarry && currentConvertedValue !== null) {
      nextValue = parseFloat(currentConvertedValue.toFixed(6));
      setDisplayInputString(
        oldTo === 'ft-in'
          ? formatFeetInches(nextValue)
          : formatNumberWhileTyping(String(nextValue)).formatted
      );
    }

    updateActiveWorkspace((ws) => ({
      ...ws,
      converter: {
        ...ws.converter,
        fromUnit: oldTo,
        toUnit: oldFrom,
        inputValue: nextValue,
      },
    }));

    const noticeText = withValueCarry
      ? `Swapped ${oldTo} ⇄ ${oldFrom} & carried value (${nextValue})`
      : `Swapped ${oldTo} ⇄ ${oldFrom}`;

    setLastSwapNotice(noticeText);
    setTimeout(() => setLastSwapNotice(null), 2500);
  };

  const handleApplyQuickPair = (pair: { from: string; to: string }) => {
    const isAlreadyActive =
      converter.fromUnit === pair.from && converter.toUnit === pair.to;

    const newFrom = isAlreadyActive ? pair.to : pair.from;
    const newTo = isAlreadyActive ? pair.from : pair.to;

    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 350);

    updateActiveWorkspace((ws) => ({
      ...ws,
      converter: {
        ...ws.converter,
        fromUnit: newFrom,
        toUnit: newTo,
      },
    }));

    setLastSwapNotice(`Set ${newFrom} ⇄ ${newTo}`);
    setTimeout(() => setLastSwapNotice(null), 2000);
  };

  const handleNumericInputChange = (raw: string) => {
    const typingResult = formatNumberWhileTyping(raw);
    const formatted = typingResult.formatted;
    setDisplayInputString(formatted);

    // Support mathematical expressions and smart parsing (e.g. "250 / 2", "12500", "12'-6\"")
    const parsed = parseSmartUnitInput(formatted, converter.fromUnit, converter.category);
    if (parsed.isValid && !isNaN(parsed.parsedValue)) {
      updateActiveWorkspace((ws) => ({
        ...ws,
        converter: { ...ws.converter, inputValue: parsed.parsedValue },
      }));
    } else if (typingResult.cleanNumeric !== undefined && !isNaN(typingResult.cleanNumeric)) {
      updateActiveWorkspace((ws) => ({
        ...ws,
        converter: { ...ws.converter, inputValue: typingResult.cleanNumeric! },
      }));
    } else {
      const fallbackNum = parseFloat(formatted.replace(/,/g, ''));
      if (!isNaN(fallbackNum)) {
        updateActiveWorkspace((ws) => ({
          ...ws,
          converter: { ...ws.converter, inputValue: fallbackNum },
        }));
      }
    }
  };

  // Apply natural expression result to converter
  const handleApplyNaturalExpression = () => {
    if (
      !naturalParseResult.parsed ||
      !naturalParseResult.category ||
      !naturalParseResult.fromUnit ||
      !naturalParseResult.toUnit ||
      naturalParseResult.inputValue === undefined
    ) {
      return;
    }
    const { inputValue, fromUnit, toUnit, category } = naturalParseResult;

    setDisplayInputString(formatNumberWhileTyping(String(inputValue)).formatted);
    updateActiveWorkspace((ws) => ({
      ...ws,
      converter: {
        ...ws.converter,
        category,
        fromUnit,
        toUnit,
        inputValue,
      },
    }));

    setOmniSearchQuery('');
    setLastSwapNotice(`Applied expression: ${inputValue} ${fromUnit} → ${toUnit}`);
    setTimeout(() => setLastSwapNotice(null), 3000);
  };

  const fromUnitObj = availableCategoryUnits.find((u) => u.id === converter.fromUnit);
  const toUnitObj = availableCategoryUnits.find((u) => u.id === converter.toUnit);
  const quickPairs = COMMON_CATEGORY_PAIRS[currentCategory] || [];
  const activeMeta = CATEGORY_METAS[currentCategory] || CATEGORY_METAS.length;
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------------- */}
      {/* 1. Omni-Search & Natural Language Expression Bar */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative rounded-2xl border border-[var(--md-sys-color-primary)]/40 bg-gradient-to-r from-[var(--md-sys-color-surface-container-low)] to-[var(--md-sys-color-surface-container)] p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-primary)] opacity-80" />
            <input
              ref={searchInputRef}
              type="text"
              value={omniSearchQuery}
              onChange={(e) => setOmniSearchQuery(e.target.value)}
              placeholder="Omni-Search or Expression (e.g. '5 katha to sft', '25 mpa to psi', '100 c to f', '12'-6&quot; in mm') — Press '/'"
              className="w-full pl-9 pr-14 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60"
            />
            <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]">
              /
            </kbd>
          </div>
          {omniSearchQuery && (
            <button
              type="button"
              onClick={() => setOmniSearchQuery('')}
              className="text-xs font-mono px-2 py-1 rounded bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Live Natural Expression Preview Card */}
        {naturalParseResult.parsed &&
          naturalParseResult.category &&
          naturalParseResult.fromUnit &&
          naturalParseResult.toUnit &&
          naturalParseResult.inputValue !== undefined && (
            <div className="mt-2.5 p-3 rounded-xl bg-[var(--md-sys-color-primary-container)]/70 border border-[var(--md-sys-color-primary)] flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[var(--md-sys-color-on-primary-container)]">
                    Detected Query:
                  </span>{' '}
                  <span className="font-mono font-semibold">
                    {naturalParseResult.inputValue} {naturalParseResult.fromUnit} ={' '}
                    <strong className="text-[var(--md-sys-color-primary)]">
                      {naturalParseResult.formattedResult} {naturalParseResult.toUnit}
                    </strong>
                  </span>{' '}
                  <span className="text-[10px] opacity-75 font-mono">
                    ({CATEGORY_METAS[naturalParseResult.category]?.nameEn})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyNaturalExpression}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 transition-all cursor-pointer shadow-xs btn-tactile flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Converter</span>
              </button>
            </div>
          )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Macro-Domain Filter Tabs & Bento Category Grid */}
      {/* ------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ActiveIcon className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
              Category: {activeMeta.nameEn}{' '}
              <span className="font-normal text-[var(--md-sys-color-on-surface-variant)]">
                ({activeMeta.nameBn})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBentoExpanded(!isBentoExpanded)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] transition-all cursor-pointer flex items-center gap-1 btn-tactile"
            >
              <span>{isBentoExpanded ? 'Collapse Grid' : 'Browse All 21 Categories'}</span>
              {isBentoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onOpenCustomUnitsModal}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer flex items-center gap-1"
              title="Add user-defined conversion factors"
            >
              <Settings className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Custom Units ({customUnits.length})</span>
            </button>
          </div>
        </div>

        {/* 2-tier Macro-Domain Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {MACRO_DOMAINS.map((dom) => {
            const isActive = activeMacroDomain === dom.id;
            const count =
              dom.id === 'pinned'
                ? pinnedCategories.length
                : dom.id === 'all'
                ? 21
                : dom.categories.length;

            return (
              <button
                key={dom.id}
                type="button"
                onClick={() => {
                  setActiveMacroDomain(dom.id);
                  if (!isBentoExpanded) setIsBentoExpanded(true);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold shadow-xs'
                    : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                }`}
              >
                <span>{dom.icon}</span>
                <span>{dom.labelEn}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compact Bento Category Grid (Expanded or Compact View) */}
        {isBentoExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/60 animate-fadeIn">
            {displayedCategories.map((catKey) => {
              const meta = CATEGORY_METAS[catKey];
              if (!meta) return null;
              const IconComp = meta.icon;
              const isSelected = currentCategory === catKey;
              const isPinned = pinnedCategories.includes(catKey);
              const units = STANDARD_UNITS[catKey] || [];

              return (
                <div
                  key={catKey}
                  onClick={() => {
                    if (currentCategory !== catKey) {
                      updateActiveWorkspace((ws) => ({
                        ...ws,
                        converter: {
                          ...ws.converter,
                          category: catKey,
                          fromUnit: units[0]?.id || 'base',
                          toUnit: units[1]?.id || units[0]?.id || 'base',
                        },
                      }));
                    }
                  }}
                  className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/30 ring-2 ring-[var(--md-sys-color-primary)] shadow-xs'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? 'bg-[var(--md-sys-color-primary)] text-white'
                            : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)]'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                          {meta.nameEn}
                        </div>
                        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                          {meta.nameBn}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => togglePinCategory(catKey, e)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        isPinned
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-neutral-400 hover:text-neutral-600 opacity-40 group-hover:opacity-100'
                      }`}
                      title={isPinned ? 'Unpin category' : 'Pin category to favorites'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Top Preview Badges */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {meta.topPreviews.slice(0, 3).map((prev) => (
                      <span
                        key={prev}
                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]"
                      >
                        {prev}
                      </span>
                    ))}
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-bold ml-auto">
                      {units.length} units
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. Quick Conversion Pairs Bar */}
      {/* ------------------------------------------------------------------- */}
      {quickPairs.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0 mr-1">
            Standard Pairs:
          </span>
          {quickPairs.map((pair) => {
            const isPairSelected =
              (converter.fromUnit === pair.from && converter.toUnit === pair.to) ||
              (converter.fromUnit === pair.to && converter.toUnit === pair.from);

            return (
              <button
                key={pair.label}
                type="button"
                onClick={() => handleApplyQuickPair(pair)}
                className={`min-h-[32px] px-3 py-1 text-[11px] font-mono rounded-full border whitespace-nowrap transition-all cursor-pointer btn-tactile ${
                  isPairSelected
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                }`}
                title={pair.title || `Switch units to ${pair.label}`}
              >
                {pair.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. Main Conversion Direction: Source Unit (From) ⇄ Swap ⇄ Target Unit (To) */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
          {/* Source Unit (From) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                Source Unit (From)
              </label>
              {fromUnitObj && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] font-bold">
                  {fromUnitObj.symbol}
                </span>
              )}
            </div>
            <select
              value={converter.fromUnit}
              onChange={(e) => {
                const val = e.target.value;
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, fromUnit: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
            >
              {availableCategoryUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol}) {u.isRegional ? '★ Regional' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dedicated Central Swap Button */}
          <div className="flex items-center justify-center shrink-0 self-center sm:self-end sm:pb-0.5">
            <button
              type="button"
              onClick={() => handleSwapUnits(false)}
              className={`min-h-[48px] min-w-[48px] px-3.5 sm:px-3 rounded-xl border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] hover:bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary-container)] hover:text-white transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5 font-bold text-xs btn-tactile group ${
                isSwapping ? 'ring-2 ring-[var(--md-sys-color-primary)]' : ''
              }`}
              title={`Swap 'From' (${fromUnitObj?.symbol || converter.fromUnit}) and 'To' (${toUnitObj?.symbol || converter.toUnit})`}
              aria-label="Swap from and to units"
            >
              <ArrowRightLeft
                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                  isSwapping ? 'rotate-180 scale-125' : 'group-hover:rotate-180'
                }`}
              />
              <span className="sm:hidden font-mono">Swap (⇄)</span>
            </button>
          </div>

          {/* Target Unit (To) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                Target Unit (To)
              </label>
              {toUnitObj && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] font-bold">
                  {toUnitObj.symbol}
                </span>
              )}
            </div>
            <select
              value={converter.toUnit}
              onChange={(e) => {
                const val = e.target.value;
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
            >
              {availableCategoryUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol}) {u.isRegional ? '★ Regional' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Feedback Badge & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/60 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface-variant)] text-[11px]">
            {lastSwapNotice ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{lastSwapNotice}</span>
              </span>
            ) : (
              <span>
                Active Conversion: <strong>{fromUnitObj?.symbol || converter.fromUnit}</strong> →{' '}
                <strong>{toUnitObj?.symbol || converter.toUnit}</strong>
              </span>
            )}
          </div>

          {/* Action Buttons: Explain Conversion & Smart Swap */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExplainModalOpen(true)}
              className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono font-bold rounded-md border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/50 hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] transition-colors cursor-pointer inline-flex items-center gap-1.5 btn-tactile shadow-xs"
              title="Open step-by-step mathematical conversion logic and custom unit factors"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Explain Conversion</span>
            </button>

            {currentConvertedValue !== null && (
              <button
                type="button"
                onClick={() => handleSwapUnits(true)}
                className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono font-bold rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] transition-colors cursor-pointer inline-flex items-center gap-1 btn-tactile"
                title="Swap units AND set the converted result as the new input value"
              >
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span>
                  Swap with Result ({formatSmartNumber(currentConvertedValue, 4)}{' '}
                  {toUnitObj?.symbol || converter.toUnit})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 5. Input Numeric Value with Quick Value Chips */}
      {/* ------------------------------------------------------------------- */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
          <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
            Input Numeric Value ({fromUnitObj?.symbol || converter.fromUnit})
          </label>
          {/* Quick value presets */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Quick:
            </span>
            {[1, 10, 50, 100, 1000].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setDisplayInputString(formatNumberWhileTyping(String(num)).formatted);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    converter: { ...ws.converter, inputValue: num },
                  }));
                }}
                className={`px-2 py-0.5 text-[10px] font-mono rounded-full border transition-colors cursor-pointer ${
                  converter.inputValue === num
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                {num.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          inputMode="decimal"
          value={displayInputString}
          onChange={(e) => handleNumericInputChange(e.target.value)}
          placeholder="Enter numeric value or arithmetic expression (e.g. 2,500.50 or 250 / 2)"
          className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-base bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
        />
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 flex items-center justify-between">
          <span>Real-time thousand separators active. Arithmetic supported (+, -, *, /).</span>
          <span>
            SI Base: <strong>{BASE_UNITS[currentCategory]}</strong>
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 6. Regional Land Preset Switcher & Matrix (Area Discipline) */}
      {/* ------------------------------------------------------------------- */}
      {currentCategory === 'area' && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📐</span>
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Bangladesh Regional Land Measure Matrix
              </label>
            </div>

            {/* Regional Land Preset Selector */}
            <div className="flex items-center gap-1 bg-emerald-500/10 p-1 rounded-lg border border-emerald-500/20 text-xs font-medium">
              <span className="text-[10px] font-mono uppercase text-emerald-800 dark:text-emerald-300 mr-1">
                Preset:
              </span>
              {[
                { id: 'standard' as const, label: 'Standard BD (720 sft/katha)' },
                { id: 'rajshahi' as const, label: 'Rajshahi (1,440 sft)' },
                { id: 'chattogram' as const, label: 'Chattogram Kani' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: { ...ws.converter, regionalLandPreset: p.id },
                    }));
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                    regionalLandPreset === p.id
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-500/20'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {landBreakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {[
                { label: 'Decimal / শতক', val: landBreakdown.decimals, unit: 'decimal', sub: '435.6 sft' },
                { label: 'Katha / কাঠা', val: landBreakdown.katha, unit: 'katha', sub: regionalLandPreset === 'rajshahi' ? '1,440 sft' : '720 sft' },
                { label: 'Bigha / বিঘা', val: landBreakdown.bigha, unit: 'bigha', sub: '20 Katha' },
                { label: 'Chhatak / ছটাক', val: landBreakdown.chataks, unit: 'chhatak', sub: '45 sft' },
                { label: 'Kani / কানি', val: landBreakdown.kanis, unit: 'kani', sub: '20 Gonda' },
                { label: 'Gonda / গণ্ডা', val: landBreakdown.gondas, unit: 'gonda', sub: '864 sft' },
                { label: 'Kara / কড়া', val: landBreakdown.karas, unit: 'kara', sub: '216 sft' },
                { label: 'Acre / একর', val: landBreakdown.acres, unit: 'acre', sub: '43,560 sft' },
                { label: 'Hectare / হেক্টর', val: landBreakdown.hectares, unit: 'ha', sub: '10,000 m²' },
                { label: 'Square Feet', val: landBreakdown.squareFeet, unit: 'ft2', sub: 'ft² (sft)' },
                { label: 'Square Meters', val: landBreakdown.squareMeters, unit: 'm2', sub: 'SI m²' },
                { label: 'Guntha', val: landBreakdown.gunthas, unit: 'guntha', sub: '1,089 sft' },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => {
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: { ...ws.converter, toUnit: item.unit },
                    }));
                  }}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    converter.toUnit === item.unit
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 font-bold ring-1 ring-emerald-500'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400'
                  }`}
                  title={`Click to set ${item.label} as target unit`}
                >
                  <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    <span className="truncate">{item.label}</span>
                    <span className="text-[9px] uppercase opacity-75">{item.sub}</span>
                  </div>
                  <div className="text-sm font-bold mt-0.5 text-emerald-700 dark:text-emerald-300 truncate">
                    {formatSmartNumber(item.val, 4)}{' '}
                    <span className="text-[10px] font-normal">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 7. Multi-Unit Live Comparison Grid (All Units in Category) */}
      {/* ------------------------------------------------------------------- */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📊</span>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
              Multi-Unit Live Comparison Grid ({availableCategoryUnits.length} Units)
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Table Search */}
            <div className="relative">
              <input
                type="text"
                value={comparisonSearch}
                onChange={(e) => setComparisonSearch(e.target.value)}
                placeholder="Filter table units..."
                className="pl-2 pr-6 py-1 text-xs font-mono rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
              />
              {comparisonSearch && (
                <button
                  type="button"
                  onClick={() => setComparisonSearch('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--md-sys-color-on-surface-variant)]"
                >
                  ×
                </button>
              )}
            </div>

            {/* Scientific Notation Toggle */}
            <button
              type="button"
              onClick={() => setIsScientific(!isScientific)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono border transition-all cursor-pointer ${
                isScientific
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
              title="Toggle scientific exponent notation (1.23e+4)"
            >
              Sci ({isScientific ? 'ON' : 'OFF'})
            </button>

            {/* Precision Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Dec:
              </span>
              {[2, 4, 6, 8].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setComparisonPrecision(p)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                    comparisonPrecision === p
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Comparison Table */}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-b border-[var(--md-sys-color-outline-variant)]">
              <tr>
                <th className="py-2 px-3 font-semibold">Unit Name & Symbol</th>
                <th className="py-2 px-3 font-semibold text-right">Converted Equivalent</th>
                <th className="py-2 px-3 font-semibold text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/40">
              {filteredComparisonRows.map((row) => (
                <tr
                  key={row.unit.id}
                  onClick={() => {
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: { ...ws.converter, toUnit: row.unit.id },
                    }));
                  }}
                  className={`transition-colors cursor-pointer ${
                    row.isTarget
                      ? 'bg-[var(--md-sys-color-primary-container)]/30 font-bold'
                      : row.isSource
                      ? 'bg-[var(--md-sys-color-surface-container)]'
                      : 'hover:bg-[var(--md-sys-color-surface-container-low)]'
                  }`}
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                        {row.unit.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] font-bold">
                        {row.unit.symbol}
                      </span>
                      {row.unit.isRegional && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                          Regional
                        </span>
                      )}
                      {row.isSource && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
                          Source
                        </span>
                      )}
                      {row.isTarget && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                          Target
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={`text-sm ${
                        row.isTarget
                          ? 'text-[var(--md-sys-color-primary)] font-extrabold'
                          : 'text-[var(--md-sys-color-on-surface)] font-medium'
                      }`}
                    >
                      {row.formatted}
                    </span>{' '}
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                      {row.unit.symbol}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleCopyComparisonValue(row.formatted, row.unit.id)}
                        className="p-1 rounded hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] transition-colors cursor-pointer"
                        title={`Copy ${row.formatted} ${row.unit.symbol}`}
                      >
                        {copiedUnitId === row.unit.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            converter: { ...ws.converter, toUnit: row.unit.id },
                          }));
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          row.isTarget
                            ? 'bg-[var(--md-sys-color-primary)] text-white'
                            : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-white text-[var(--md-sys-color-primary)]'
                        }`}
                      >
                        {row.isTarget ? 'Active' : 'Set To'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 8. Architectural Feet-Inch String Parser Card */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📏</span>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
              Architectural Feet-Inch & Fraction Parser
            </label>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mr-1">
              Presets:
            </span>
            {[
              { label: "12'-6 1/2\"", val: "12'-6 1/2\"" },
              { label: "25'-0\"", val: "25'-0\"" },
              { label: "9'-4 3/4\"", val: "9'-4 3/4\"" },
              { label: '3500mm', val: '3500mm' },
              { label: '2.45m', val: '2.45m' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    converter: { ...ws.converter, feetInchRawString: p.val },
                  }));
                }}
                className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="e.g. 14'-6 3/4&quot;, 12 ft 4 in, 3/4&quot;, 3810mm, or 3.81m"
            value={converter.feetInchRawString}
            onChange={(e) => {
              const str = e.target.value;
              updateActiveWorkspace((ws) => ({
                ...ws,
                converter: { ...ws.converter, feetInchRawString: str },
              }));
            }}
            className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
          />
          {converter.feetInchRawString && (
            <button
              type="button"
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, feetInchRawString: '' },
                }));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {activeFeetInchResult.isValid ? (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                  Architectural Standard
                </span>
                <strong className="text-sm text-[var(--md-sys-color-primary)] truncate block">
                  {activeFeetInchResult.fractionString || activeFeetInchResult.normalizedString}
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                  Decimal Feet
                </span>
                <strong className="text-sm truncate block">
                  {formatSmartNumber(activeFeetInchResult.totalFeet, 4)} ft
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                  Metric (Meters)
                </span>
                <strong className="text-sm text-emerald-600 dark:text-emerald-400 truncate block">
                  {formatSmartNumber(activeFeetInchResult.totalMeters, 4)} m
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                  Millimeters (mm)
                </span>
                <strong className="text-sm truncate block">
                  {formatSmartNumber(activeFeetInchResult.totalMm, 1)} mm
                </strong>
              </div>
            </div>

            {/* Transfer to Main Converter Input Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Fraction: {activeFeetInchResult.fractionString || `${activeFeetInchResult.totalInches.toFixed(2)}"`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const feetVal = parseFloat(activeFeetInchResult.totalFeet.toFixed(4));
                    setDisplayInputString(activeFeetInchResult.fractionString || formatFeetInches(feetVal));
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: {
                        ...ws.converter,
                        category: 'length',
                        fromUnit: 'ft-in',
                        inputValue: feetVal,
                      },
                    }));
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-400 cursor-pointer font-bold"
                  title="Load architectural feet'-in&quot; notation into main converter input"
                >
                  Apply {activeFeetInchResult.fractionString || `${activeFeetInchResult.totalFeet.toFixed(2)} ft`} (ft&apos;-in&quot;)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const feetVal = parseFloat(activeFeetInchResult.totalFeet.toFixed(4));
                    setDisplayInputString(formatNumberWhileTyping(String(feetVal)).formatted);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: {
                        ...ws.converter,
                        category: 'length',
                        fromUnit: 'ft',
                        inputValue: feetVal,
                      },
                    }));
                  }}
                  className="px-2 py-1 text-[11px] font-mono rounded bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-primary)] cursor-pointer font-bold"
                  title="Load parsed feet into main converter input"
                >
                  Apply {activeFeetInchResult.totalFeet.toFixed(3)} ft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const metersVal = parseFloat(activeFeetInchResult.totalMeters.toFixed(4));
                    setDisplayInputString(formatNumberWhileTyping(String(metersVal)).formatted);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: {
                        ...ws.converter,
                        category: 'length',
                        fromUnit: 'm',
                        inputValue: metersVal,
                      },
                    }));
                  }}
                  className="px-3 py-1 text-[11px] font-mono rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] transition-colors cursor-pointer font-bold"
                  title="Load parsed meters into main converter input"
                >
                  Apply {activeFeetInchResult.totalMeters.toFixed(3)} m
                </button>
              </div>
            </div>
          </div>
        ) : (
          converter.feetInchRawString && (
            <div className="text-xs font-mono text-amber-600 dark:text-amber-400 pt-0.5">
              ⚠️ {activeFeetInchResult.errorMessage || 'Unable to parse architectural string. Try format: 12\'-6 1/2" or 3500mm'}
            </div>
          )
        )}
      </div>

      {/* Step-by-Step Conversion Logic & Custom Unit Factor Proof Modal */}
      <ExplainConversionModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        inputValue={converter.inputValue}
        fromUnitId={converter.fromUnit}
        toUnitId={converter.toUnit}
        category={converter.category}
        customUnits={customUnits}
        onSwapUnits={() => handleSwapUnits(false)}
        onOpenCustomUnitsModal={onOpenCustomUnitsModal}
      />
    </div>
  );
};

// -----------------------------------------------------------------------------
// UnitConverterMetrics Component
// -----------------------------------------------------------------------------
export interface UnitConverterMetricsProps {
  inputValue: number;
  fromUnit: string;
  toUnit: string;
  category: UnitCategoryKey;
  conversionResult: {
    result: number;
    formula: string;
  };
  customUnits?: CustomUnitDefinition[];
  onSwapUnits?: () => void;
  onSwapWithResult?: () => void;
  onOpenCustomUnitsModal?: () => void;
}

export const UnitConverterMetrics: React.FC<UnitConverterMetricsProps> = ({
  inputValue,
  fromUnit,
  toUnit,
  category,
  conversionResult,
  customUnits = [],
  onSwapUnits,
  onSwapWithResult,
  onOpenCustomUnitsModal,
}) => {
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const meta = CATEGORY_METAS[category] || CATEGORY_METAS.length;

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Source Value</div>
          <div className="text-xl font-bold font-mono mt-0.5">
            {fromUnit === 'ft-in'
              ? formatFeetInches(inputValue)
              : formatSmartNumber(inputValue)}{' '}
            <span className="text-xs font-normal">{fromUnit === 'ft-in' ? `ft'-in"` : fromUnit}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Converted Value</div>
          <div className="text-xl font-bold font-mono mt-0.5 text-[var(--md-sys-color-primary)]">
            {toUnit === 'ft-in'
              ? formatFeetInches(conversionResult.result)
              : formatSmartNumber(conversionResult.result, 6)}{' '}
            <span className="text-xs font-normal">{toUnit === 'ft-in' ? `ft'-in"` : toUnit}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>Conversion Formula</span>
            <button
              type="button"
              onClick={() => setIsExplainModalOpen(true)}
              className="text-[10px] font-bold text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              title="Explain step-by-step conversion logic using stored custom unit factors"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Explain</span>
            </button>
          </div>
          <div className="text-xs font-mono mt-1 opacity-90 truncate" title={conversionResult.formula}>
            {conversionResult.formula}
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Discipline & Base SI
          </div>
          <div className="text-xs font-mono font-bold mt-1">
            {meta.nameEn} ({BASE_UNITS[category]})
          </div>
        </div>
      </div>

      {/* Quick Swap & Explain Conversion Action Bar in Analytical Stage */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/50 no-print">
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Audit & Reverse Calculations:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExplainModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-full border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] transition-all cursor-pointer flex items-center gap-1.5 btn-tactile font-bold shadow-xs"
            title="Explain step-by-step conversion logic using stored custom unit factors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Explain Conversion</span>
          </button>
          {onSwapUnits && (
            <button
              type="button"
              onClick={onSwapUnits}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer flex items-center gap-1.5 btn-tactile"
              title={`Swap ${fromUnit} ⇄ ${toUnit}`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>
                Swap ({toUnit} ⇄ {fromUnit})
              </span>
            </button>
          )}
          {onSwapWithResult && (
            <button
              type="button"
              onClick={onSwapWithResult}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all cursor-pointer flex items-center gap-1.5 btn-tactile"
              title="Swap units and set input to current converted result"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                Swap & Invert ({formatSmartNumber(conversionResult.result, 4)} {toUnit})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Step-by-Step Conversion Logic & Custom Unit Factor Proof Modal */}
      <ExplainConversionModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        inputValue={inputValue}
        fromUnitId={fromUnit}
        toUnitId={toUnit}
        category={category}
        customUnits={customUnits}
        onSwapUnits={onSwapUnits}
        onOpenCustomUnitsModal={onOpenCustomUnitsModal}
      />
    </div>
  );
};
