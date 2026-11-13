import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Settings,
  ArrowRightLeft,
  RefreshCw,
  Check,
  HelpCircle,
  Search,
  Star,
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
  ArrowRight,
  Compass,
  Wrench,
  X,
} from 'lucide-react';
import {
  CivilWorkspace,
  UnitCategoryKey,
  CustomUnitDefinition,
} from '../../types/civil';
import {
  STANDARD_UNITS,
  BASE_UNITS,
  EXACT_CONVERSION,
  convertDirect,
  computeRegionalLandBreakdown,
  FeetInchParseResult,
  formatSmartNumber,
  formatNumberWhileTyping,
  formatFeetInches,
  parseNaturalConversionExpression,
  NaturalExpressionParseResult,
  REBAR_BAR_DESIGNATIONS,
  UnitInfo,
} from '../../utils/unitConverter';
import { parseSmartUnitInput } from '../../utils/unitEngine';
import { ExplainConversionModal } from '../modals/ExplainConversionModal';
import { UnitConverterDiagramSvg } from '../EngineeringDiagrams';

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
    description: 'Cumec, CFT, cement bag (1.25 cft), truck loads, brass, and liters',
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

// Top 5–6 quick unit pills per category for 1-click Source / Target switching
const QUICK_UNIT_PILLS_BY_CATEGORY: Partial<Record<UnitCategoryKey, string[]>> = {
  length: ['m', 'ft', 'ft-in', 'mm', 'in', 'suta'],
  area: ['katha', 'ft2', 'decimal', 'm2', 'bigha', 'acre'],
  volume: ['m3', 'cft', 'liter', 'brass', 'bag_cement', 'yd3'],
  mass: ['kg', 'tonne', 'lb', 'bag50', 'maund', 'seer'],
  force: ['kN', 'kip', 'N', 'lbf', 'MN', 'tonf'],
  pressure: ['MPa', 'psi', 'kPa', 'psf', 'bar', 'ksi'],
  moment: ['kN.m', 'kip.ft', 'N.m', 'lbf.ft', 'kip.in'],
  distributed_load: ['kN/m', 'kip/ft', 'plf', 'klf', 'N/mm'],
  density: ['kN/m3', 'pcf', 'kg/m3', 'g/cm3', 'tonne/m3'],
  slope: ['percent', 'degree', 'ratio', 'rad', 'permille'],
  velocity: ['m/s', 'ft/s', 'km/h', 'mph', 'knot'],
  flow_rate: ['m3/s', 'cfs', 'L/s', 'gpm', 'm3/hr', 'L/min'],
  temperature: ['c', 'f', 'k', 'r'],
  energy: ['kJ', 'kWh', 'MJ', 'BTU', 'kcal', 'J'],
  power: ['kW', 'hp', 'W', 'TR', 'btu_hr'],
  fuel_economy: ['km_l', 'l_100km', 'mpg_us', 'mpg_uk'],
  cad_typography: ['mm', 'pt', 'px_96', 'in', 'mil', 'cm'],
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
    { label: 'chain ⇄ ft', from: 'chain', to: 'ft', title: "Gunter's Chain (66 ft) ↔ Feet" },
  ],
  area: [
    { label: 'katha ⇄ sft', from: 'katha', to: 'ft2', title: 'Katha (720 sq ft) ↔ SFT' },
    { label: 'decimal ⇄ sft', from: 'decimal', to: 'ft2', title: 'Decimal/Shotok (435.6 sq ft) ↔ SFT' },
    { label: 'decimal ⇄ katha', from: 'decimal', to: 'katha', title: 'Decimal ↔ Katha (1.65 dec/katha)' },
    { label: 'm² ⇄ sft', from: 'm2', to: 'ft2', title: 'Square Meters ↔ Square Feet' },
    { label: 'katha ⇄ bigha', from: 'katha', to: 'bigha', title: 'Katha (20 katha/bigha) ↔ Bigha' },
    { label: 'ha ⇄ acre', from: 'ha', to: 'acre', title: 'Hectare (2.471 ac) ↔ Acre' },
  ],
  volume: [
    { label: 'm³ ⇄ cft', from: 'm3', to: 'cft', title: 'Cubic Meters ↔ CFT (35.315 cft/m³)' },
    { label: 'm³ ⇄ Liter', from: 'm3', to: 'liter', title: 'Cubic Meters ↔ Liters' },
    { label: 'cft ⇄ bag', from: 'cft', to: 'bag_cement', title: 'CFT ↔ Cement Bags (1.25 cft/bag)' },
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
    { label: 'mm³ ⇄ in³', from: 'mm3_sec', to: 'in3_sec', title: 'Section Modulus mm³ ↔ in³' },
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
    { label: 'kJ ⇄ BTU', from: 'kJ', to: 'BTU', title: 'Kilojoules ↔ British Thermal Units' },
    { label: 'kWh ⇄ MJ', from: 'kWh', to: 'MJ', title: 'Kilowatt-hours ↔ Megajoules' },
    { label: 'kcal ⇄ kJ', from: 'kcal', to: 'kJ', title: 'Kilocalories ↔ Kilojoules' },
  ],
  power: [
    { label: 'kW ⇄ HP', from: 'kW', to: 'hp', title: 'Kilowatts ↔ Horsepower (1 HP ≈ 0.7457 kW)' },
    { label: 'TR ⇄ kW', from: 'TR', to: 'kW', title: 'Tons of Refrigeration (TR) ↔ kW (1 TR ≈ 3.5168 kW)' },
    { label: 'BTU/h ⇄ kW', from: 'btu_hr', to: 'kW', title: 'BTU/h ↔ kW' },
  ],
  time_frequency: [
    { label: 'hr ⇄ min', from: 'hr', to: 'min', title: 'Hours ↔ Minutes' },
    { label: 'day ⇄ hr', from: 'day', to: 'hr', title: 'Days ↔ Hours' },
    { label: 'Hz ⇄ kHz', from: 'Hz', to: 'kHz', title: 'Hertz ↔ Kilohertz' },
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
export const DIMENSION_GROUP_LABELS: Record<string, { label: string; badge: string }> = {
  inertia: { label: 'Moment of Inertia (L⁴)', badge: 'Ix / Iy' },
  modulus: { label: 'Section Modulus (L³)', badge: 'Sx / Zx' },
  dynamic: { label: 'Dynamic Viscosity (μ)', badge: 'Pa·s / cP' },
  kinematic: { label: 'Kinematic Viscosity (ν)', badge: 'm²/s / cSt' },
  permeability: { label: 'Hydraulic Permeability (k)', badge: 'm/s / m/day' },
  time: { label: 'Time & Duration', badge: 's / hr / yr' },
  frequency: { label: 'Frequency & Speed', badge: 'Hz / RPM' },
  storage: { label: 'File & BIM Storage', badge: 'B / GB / GiB' },
  bandwidth: { label: 'Network Transfer Speed', badge: 'bps / Mbps' },
};

export interface UnitConverterInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  availableCategoryUnits: Array<{ id: string; name: string; symbol: string; isRegional?: boolean; dimensionGroup?: string }>;
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
  const [isSecondaryToolsOpen, setIsSecondaryToolsOpen] = useState(true);
  const [selectedRebarId, setSelectedRebarId] = useState<string>('iso-16');
  const [copiedHeroResult, setCopiedHeroResult] = useState(false);
  const [pinnedCategories, setPinnedCategories] = useState<UnitCategoryKey[]>(() => {
    try {
      const stored = localStorage.getItem('bdcivillab_pinned_categories');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return ['length', 'area', 'volume', 'mass', 'pressure'];
  });
  const [recentCategories, setRecentCategories] = useState<UnitCategoryKey[]>(() => {
    try {
      const stored = localStorage.getItem('bdcivillab_recent_categories');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return ['area', 'length', 'pressure'];
  });

  // Table filter and scientific notation options for All-Units Live Comparison Grid
  const [comparisonSearch, setComparisonSearch] = useState('');
  const [comparisonPrecision, setComparisonPrecision] = useState<number | 'auto'>('auto');
  const [isScientific, setIsScientific] = useState(false);
  const [copiedUnitId, setCopiedUnitId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSourceFocusedRef = useRef(false);

  const converter = activeWorkspace.converter;
  const currentCategory = converter.category;
  const regionalLandPreset = converter.regionalLandPreset || 'standard';

  // Track recent categories when category changes
  useEffect(() => {
    setRecentCategories((prev) => {
      const next = [currentCategory, ...prev.filter((c) => c !== currentCategory)].slice(0, 6);
      try {
        localStorage.setItem('bdcivillab_recent_categories', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [currentCategory]);

  // Dimension sub-groups for multi-dimension categories
  const dimensionGroups = useMemo(() => {
    const stdUnits: UnitInfo[] = STANDARD_UNITS[currentCategory] || [];
    return Array.from(
      new Set(stdUnits.map((u) => u.dimensionGroup).filter((g): g is string => Boolean(g)))
    );
  }, [currentCategory]);

  const activeDimensionGroup = useMemo(() => {
    if (dimensionGroups.length <= 1) return undefined;
    const stdUnits: UnitInfo[] = STANDARD_UNITS[currentCategory] || [];
    const fromDef = stdUnits.find((u) => u.id === converter.fromUnit);
    return fromDef?.dimensionGroup || dimensionGroups[0];
  }, [dimensionGroups, currentCategory, converter.fromUnit]);

  const scopedCategoryUnits = useMemo(() => {
    if (!activeDimensionGroup) return availableCategoryUnits;
    const stdUnits: UnitInfo[] = STANDARD_UNITS[currentCategory] || [];
    const allowedIds = new Set(
      stdUnits.filter((u) => !u.dimensionGroup || u.dimensionGroup === activeDimensionGroup).map((u) => u.id)
    );
    return availableCategoryUnits.filter((u) => allowedIds.has(u.id) || !stdUnits.some((s) => s.id === u.id));
  }, [activeDimensionGroup, availableCategoryUnits, currentCategory]);

  // Top 5–6 quick pills for Source & Target cards
  const quickUnitPills = useMemo(() => {
    const preferredIds = QUICK_UNIT_PILLS_BY_CATEGORY[currentCategory] || [];
    const picked: typeof scopedCategoryUnits = [];
    for (const id of preferredIds) {
      const found = scopedCategoryUnits.find((u) => u.id === id);
      if (found) picked.push(found);
    }
    for (const u of scopedCategoryUnits) {
      if (picked.length >= 6) break;
      if (!picked.some((p) => p.id === u.id)) picked.push(u);
    }
    return picked.slice(0, 6);
  }, [currentCategory, scopedCategoryUnits]);

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

  // Helper to format source input string consistently
  const formatSourceDisplay = (val: number, unitId: string): string => {
    if (isNaN(val) || !isFinite(val)) return '';
    if (unitId === 'ft-in') return formatFeetInches(val);
    return formatNumberWhileTyping(String(val)).formatted;
  };

  // Controlled local draft string for Hero Source Input (prevents cursor jumping)
  const [displayInputString, setDisplayInputString] = useState<string>(() =>
    converter.inputValue !== undefined && converter.inputValue !== null
      ? formatSourceDisplay(converter.inputValue, converter.fromUnit)
      : ''
  );

  // Sync display string when workspace inputValue or fromUnit changes externally
  useEffect(() => {
    if (isSourceFocusedRef.current) return;
    setDisplayInputString(formatSourceDisplay(converter.inputValue, converter.fromUnit));
  }, [converter.inputValue, converter.fromUnit]);

  // Calculate live conversion result directly with exact regional preset
  const currentConvertedValue = useMemo(() => {
    try {
      const res = convertDirect(
        converter.inputValue,
        converter.fromUnit,
        converter.toUnit,
        converter.category,
        customUnits,
        regionalLandPreset
      );
      return isNaN(res) || !isFinite(res) ? null : res;
    } catch {
      return null;
    }
  }, [converter.inputValue, converter.fromUnit, converter.toUnit, converter.category, customUnits, regionalLandPreset]);

  // Length multi-format footer readout (Meters, Feet-Inch 0'-0", Decimal Feet 0.00')
  const lengthFooterSummary = useMemo(() => {
    if (currentCategory !== 'length') return null;
    try {
      const meters = convertDirect(
        converter.inputValue,
        converter.fromUnit,
        'm',
        'length',
        customUnits,
        regionalLandPreset
      );
      if (isNaN(meters) || !isFinite(meters)) return null;
      const decFeet = meters / EXACT_CONVERSION.FT_TO_M;
      return {
        ftInStr: formatFeetInches(meters, { isMeters: true }),
        decFtStr: `${decFeet.toFixed(2)}'`,
        metricStr: `${formatSmartNumber(meters, 4)} m`,
        mmStr: `${formatSmartNumber(meters * 1000, 1)} mm`,
      };
    } catch {
      return null;
    }
  }, [currentCategory, converter.inputValue, converter.fromUnit, customUnits, regionalLandPreset]);

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

  // Multi-unit live comparison grid
  const comparisonRows = useMemo(() => {
    return scopedCategoryUnits.map((u) => {
      let val = 0;
      let formatted = '—';
      try {
        val = convertDirect(
          converter.inputValue,
          converter.fromUnit,
          u.id,
          converter.category,
          customUnits,
          regionalLandPreset
        );
        const effDecimals =
          comparisonPrecision === 'auto'
            ? Math.abs(val) >= 1000
              ? 2
              : Math.abs(val) >= 1
              ? 4
              : 6
            : comparisonPrecision;
        if (isNaN(val) || !isFinite(val)) {
          formatted = 'N/A';
        } else if (u.id === 'ft-in') {
          formatted = formatFeetInches(val);
        } else if (isScientific) {
          formatted = val.toExponential(effDecimals);
        } else {
          formatted = formatSmartNumber(val, effDecimals);
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
    scopedCategoryUnits,
    converter.inputValue,
    converter.fromUnit,
    converter.toUnit,
    converter.category,
    customUnits,
    regionalLandPreset,
    isScientific,
    comparisonPrecision,
  ]);

  // Filtered comparison rows
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
      cats = Array.from(new Set([...pinnedCategories, ...recentCategories]));
    } else {
      const domainInfo = MACRO_DOMAINS.find((d) => d.id === activeMacroDomain);
      cats = domainInfo ? domainInfo.categories : MACRO_DOMAINS[0].categories;
    }

    if (!omniSearchQuery.trim()) return cats;

    const q = omniSearchQuery.toLowerCase().trim();
    return cats.filter((c) => {
      const meta = CATEGORY_METAS[c];
      if (!meta) return false;
      const units = STANDARD_UNITS[c] || [];
      return (
        meta.nameEn.toLowerCase().includes(q) ||
        meta.nameBn.toLowerCase().includes(q) ||
        meta.id.toLowerCase().includes(q) ||
        meta.topPreviews.some((p) => p.toLowerCase().includes(q)) ||
        units.some(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.symbol.toLowerCase().includes(q) ||
            (u.bengaliName && u.bengaliName.toLowerCase().includes(q))
        )
      );
    });
  }, [activeMacroDomain, pinnedCategories, recentCategories, omniSearchQuery]);

  const fromUnitObj = availableCategoryUnits.find((u) => u.id === converter.fromUnit);
  const toUnitObj = availableCategoryUnits.find((u) => u.id === converter.toUnit);
  const fromSym = fromUnitObj?.symbol || converter.fromUnit;
  const toSym = toUnitObj?.symbol || converter.toUnit;

  // Formatted Target Output String
  const heroTargetFormatted = useMemo(() => {
    if (currentConvertedValue === null) return '—';
    if (converter.toUnit === 'ft-in') {
      return formatFeetInches(currentConvertedValue);
    }
    return formatSmartNumber(currentConvertedValue, 6);
  }, [currentConvertedValue, converter.toUnit]);

  // Inline 1 From = X To Equivalence Formula
  const unitEquivalenceFormula = useMemo(() => {
    try {
      if (currentCategory === 'temperature') {
        if (converter.fromUnit === 'c' && converter.toUnit === 'f') return '°F = (°C × 9/5) + 32';
        if (converter.fromUnit === 'f' && converter.toUnit === 'c') return '°C = (°F − 32) × 5/9';
        if (converter.fromUnit === 'c' && converter.toUnit === 'k') return 'K = °C + 273.15';
        if (converter.fromUnit === 'k' && converter.toUnit === 'c') return '°C = K − 273.15';
        return conversionResult?.formula || `${fromSym} → ${toSym}`;
      }
      if (currentCategory === 'fuel_economy' && (converter.fromUnit === 'l_100km' || converter.toUnit === 'l_100km')) {
        return conversionResult?.formula || `Reciprocal: ${fromSym} ↔ ${toSym}`;
      }
      const oneUnit = convertDirect(
        1,
        converter.fromUnit,
        converter.toUnit,
        currentCategory,
        customUnits,
        regionalLandPreset
      );
      if (isNaN(oneUnit) || !isFinite(oneUnit)) return conversionResult?.formula || '';
      const formattedRatio =
        converter.toUnit === 'ft-in'
          ? formatFeetInches(oneUnit)
          : formatSmartNumber(oneUnit, 6);
      return `1 ${fromSym} = ${formattedRatio} ${toSym}`;
    } catch {
      return conversionResult?.formula || '';
    }
  }, [
    currentCategory,
    converter.fromUnit,
    converter.toUnit,
    customUnits,
    regionalLandPreset,
    fromSym,
    toSym,
    conversionResult?.formula,
  ]);

  // Copy handlers
  const handleCopyHeroResult = () => {
    if (heroTargetFormatted === '—') return;
    const payload = converter.toUnit === 'ft-in' ? heroTargetFormatted : `${heroTargetFormatted} ${toSym}`;
    navigator.clipboard.writeText(payload);
    setCopiedHeroResult(true);
    setTimeout(() => setCopiedHeroResult(false), 1800);
  };

  const handleCopyComparisonValue = (text: string, unitId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUnitId(unitId);
    setTimeout(() => setCopiedUnitId(null), 1800);
  };

  // Swap handler
  const handleSwapUnits = (withValueCarry: boolean = false) => {
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 380);

    const oldFrom = converter.fromUnit;
    const oldTo = converter.toUnit;

    let nextValue = converter.inputValue;
    if (withValueCarry && currentConvertedValue !== null) {
      nextValue = parseFloat(currentConvertedValue.toFixed(6));
      setDisplayInputString(formatSourceDisplay(nextValue, oldTo));
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
      ? `Swapped ${oldTo} ⇄ ${oldFrom} (${formatSmartNumber(nextValue, 4)})`
      : `Swapped ${toSym} ⇄ ${fromSym}`;

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
    setDisplayInputString(raw);
    if (raw.trim() === '') return;

    const parsed = parseSmartUnitInput(raw, converter.fromUnit, converter.category, customUnits);
    if (parsed.isValid && !isNaN(parsed.parsedValue)) {
      updateActiveWorkspace((ws) => ({
        ...ws,
        converter: { ...ws.converter, inputValue: parsed.parsedValue },
      }));
      return;
    }

    const fallbackNum = parseFloat(raw.replace(/,/g, ''));
    if (!isNaN(fallbackNum) && isFinite(fallbackNum)) {
      updateActiveWorkspace((ws) => ({
        ...ws,
        converter: { ...ws.converter, inputValue: fallbackNum },
      }));
    }
  };

  const handleNumericInputBlur = () => {
    isSourceFocusedRef.current = false;
    if (displayInputString.trim() === '') {
      updateActiveWorkspace((ws) => ({
        ...ws,
        converter: { ...ws.converter, inputValue: 0 },
      }));
      setDisplayInputString(formatSourceDisplay(0, converter.fromUnit));
      return;
    }
    setDisplayInputString(formatSourceDisplay(converter.inputValue, converter.fromUnit));
  };

  const handleCategorySwitch = (catKey: UnitCategoryKey) => {
    if (currentCategory === catKey) return;
    const units = STANDARD_UNITS[catKey] || [];
    const defaultFrom =
      catKey === 'area' ? 'katha' : catKey === 'length' ? 'm' : units[0]?.id || 'base';
    const defaultTo =
      catKey === 'area' ? 'ft2' : catKey === 'length' ? 'ft' : units[1]?.id || units[0]?.id || 'base';
    updateActiveWorkspace((ws) => ({
      ...ws,
      converter: {
        ...ws.converter,
        category: catKey,
        fromUnit: units.some((u) => u.id === defaultFrom) ? defaultFrom : units[0]?.id || 'base',
        toUnit: units.some((u) => u.id === defaultTo) ? defaultTo : units[1]?.id || units[0]?.id || 'base',
      },
    }));
  };

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

    setDisplayInputString(formatSourceDisplay(inputValue, fromUnit));
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
    setLastSwapNotice(`Applied: ${inputValue} ${fromUnit} → ${toUnit}`);
    setTimeout(() => setLastSwapNotice(null), 3000);
  };

  const quickPairs = COMMON_CATEGORY_PAIRS[currentCategory] || [];
  const activeMeta = CATEGORY_METAS[currentCategory] || CATEGORY_METAS.length;
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="space-y-5">
      {/* =================================================================== */}
      {/* 1. COMPACT CATEGORY PICKER & OMNI-EXPRESSION BAR                    */}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5 space-y-3">
        {/* Top Row: Omni-Search + Active Category + Expand/Custom Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-primary)] opacity-80" />
            <input
              ref={searchInputRef}
              type="text"
              value={omniSearchQuery}
              onChange={(e) => setOmniSearchQuery(e.target.value)}
              placeholder={`Search 21 disciplines or type expression (e.g. '5 katha to sft', '25 mpa to psi', '12'-6" in mm') — Press '/'`}
              className="w-full pl-10 pr-16 py-2 text-xs sm:text-sm font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60"
            />
            {omniSearchQuery ? (
              <button
                type="button"
                onClick={() => setOmniSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]">
                /
              </kbd>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs">
              <ActiveIcon className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">{activeMeta.nameEn}</span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-bangla hidden sm:inline">
                ({activeMeta.nameBn})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsBentoExpanded((prev) => !prev)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] transition-all cursor-pointer flex items-center gap-1 btn-tactile"
            >
              <span>{isBentoExpanded ? 'Compact Strip' : 'All 21 Disciplines'}</span>
              {isBentoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Live Natural Expression Preview Banner */}
        {naturalParseResult.parsed &&
          naturalParseResult.category &&
          naturalParseResult.fromUnit &&
          naturalParseResult.toUnit &&
          naturalParseResult.inputValue !== undefined && (
            <div className="p-3 rounded-xl bg-[var(--md-sys-color-primary-container)]/70 border border-[var(--md-sys-color-primary)] flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[var(--md-sys-color-on-primary-container)]">
                    Instant Expression:
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

        {/* Macro-Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {MACRO_DOMAINS.map((dom) => {
            const isActive = activeMacroDomain === dom.id;
            const count =
              dom.id === 'pinned'
                ? Array.from(new Set([...pinnedCategories, ...recentCategories])).length
                : dom.id === 'all'
                ? 21
                : dom.categories.length;

            return (
              <button
                key={dom.id}
                type="button"
                onClick={() => setActiveMacroDomain(dom.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold shadow-xs'
                    : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                }`}
              >
                <span>{dom.icon}</span>
                <span>{dom.labelEn}</span>
                <span
                  className={`text-[10px] px-1.5 rounded-full font-mono ${
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

        {/* Category Picker: Compact Horizontal Strip (Default) OR Expanded 21-Card Grid */}
        {!isBentoExpanded && !omniSearchQuery.trim() ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
            {displayedCategories.map((catKey) => {
              const meta = CATEGORY_METAS[catKey];
              if (!meta) return null;
              const IconComp = meta.icon;
              const isSelected = currentCategory === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => handleCategorySwitch(catKey)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 btn-tactile ${
                    isSelected
                      ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-2xs'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                  title={`${meta.nameEn} (${meta.nameBn}) — ${meta.description}`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--md-sys-color-primary)]' : 'opacity-75'}`} />
                  <span>{meta.nameEn}</span>
                </button>
              );
            })}
          </div>
        ) : (
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
                  onClick={() => handleCategorySwitch(catKey)}
                  className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/30 ring-2 ring-[var(--md-sys-color-primary)] shadow-xs'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                            : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)]'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                          {meta.nameEn}
                        </div>
                        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate font-bangla">
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

                  <div className="mt-2 flex flex-wrap gap-1">
                    {meta.topPreviews.slice(0, 3).map((prev) => (
                      <span
                        key={prev}
                        className="text-[9px] font-mono px-1 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]"
                      >
                        {prev}
                      </span>
                    ))}
                    <span className="text-[9px] font-mono px-1 rounded bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-bold ml-auto">
                      {units.length} units
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dimension Sub-Group Switcher (when category has multiple physical quantities like Inertia L⁴ vs Section Modulus L³) */}
        {dimensionGroups.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/50">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mr-1">
              Quantity:
            </span>
            {dimensionGroups.map((grp) => {
              const info = DIMENSION_GROUP_LABELS[grp] || { label: grp, badge: grp };
              const isSelected = activeDimensionGroup === grp;
              const grpUnits = (STANDARD_UNITS[currentCategory] || []).filter((u) => u.dimensionGroup === grp);
              return (
                <button
                  key={grp}
                  type="button"
                  onClick={() => {
                    if (grpUnits.length > 0 && !isSelected) {
                      updateActiveWorkspace((ws) => ({
                        ...ws,
                        converter: {
                          ...ws.converter,
                          fromUnit: grpUnits[0].id,
                          toUnit: grpUnits[1]?.id || grpUnits[0].id,
                        },
                      }));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold shadow-xs'
                      : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  <span>{info.label}</span>
                  <span className="text-[10px] font-mono opacity-80">({info.badge})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2. TOP HERO CONVERSION STAGE: SOURCE (FROM) ⇄ TARGET (TO)           */}
      {/* =================================================================== */}
      <section aria-label="Primary Source to Target Conversion Stage" className="space-y-3">
        {/* Quick Common Pairs Strip */}
        {quickPairs.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0 mr-1">
              Quick Pairs:
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
                  className={`min-h-[30px] px-2.5 py-0.5 text-[11px] font-mono rounded-full border whitespace-nowrap transition-all cursor-pointer btn-tactile ${
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

        {/* 3-Part Side-by-Side Hero Conversion Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-4">
          {/* --------------------------------------------------------------- */}
          {/* LEFT CARD: SOURCE UNIT (FROM • যে একক থেকে)                     */}
          {/* --------------------------------------------------------------- */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs">
            {/* Card Header + Active Source Unit Identity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]">
                  <span>FROM / উৎস একক</span>
                </span>
                <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  SI Base: <strong>{BASE_UNITS[currentCategory]}</strong>
                </span>
              </div>

              {/* Prominent Source Unit Header + Full Dropdown Selector */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2 px-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-xl sm:text-2xl font-mono font-black text-[var(--md-sys-color-on-surface)] shrink-0">
                      {fromSym}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] truncate">
                      — {fromUnitObj?.name || converter.fromUnit}
                    </span>
                  </div>
                </div>

                <select
                  aria-label="Source Unit (From)"
                  value={converter.fromUnit}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: { ...ws.converter, fromUnit: val },
                    }));
                  }}
                  className="w-full min-h-[44px] px-4 font-mono text-xs sm:text-sm font-semibold border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
                >
                  {scopedCategoryUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.symbol} — {u.name} {u.isRegional ? '★ Regional' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 1-Click Quick Unit Pills inside Source Card */}
              <div className="flex flex-wrap items-center gap-1.5">
                {quickUnitPills.map((u) => {
                  const isActive = u.id === converter.fromUnit;
                  return (
                    <button
                      key={`from-pill-${u.id}`}
                      type="button"
                      onClick={() => {
                        updateActiveWorkspace((ws) => ({
                          ...ws,
                          converter: { ...ws.converter, fromUnit: u.id },
                        }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer btn-tactile ${
                        isActive
                          ? 'bg-[var(--md-sys-color-on-surface)] text-[var(--md-sys-color-surface)] border-transparent shadow-2xs'
                          : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)]'
                      }`}
                      title={`Set Source unit to ${u.name} (${u.symbol})`}
                    >
                      {u.symbol}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Large Focused Numeric / Expression Input Field */}
            <div className="space-y-2.5 pt-1">
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode={currentCategory === 'length' ? 'text' : 'decimal'}
                  aria-label={`Source value in ${fromSym}`}
                  value={displayInputString}
                  onFocus={() => {
                    isSourceFocusedRef.current = true;
                  }}
                  onBlur={handleNumericInputBlur}
                  onChange={(e) => handleNumericInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNumericInputBlur();
                    }
                  }}
                  placeholder={converter.fromUnit === 'ft-in' ? `12'-6"` : '0'}
                  className="w-full min-h-[68px] pl-5 pr-24 py-3 text-3xl md:text-4xl font-mono font-bold tabular-nums border-2 border-[var(--md-sys-color-outline)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-2xs"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {displayInputString && displayInputString !== '0' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDisplayInputString('0');
                        updateActiveWorkspace((ws) => ({
                          ...ws,
                          converter: { ...ws.converter, inputValue: 0 },
                        }));
                      }}
                      className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
                      aria-label="Reset input value to zero"
                      title="Clear to 0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]">
                    {fromSym}
                  </span>
                </div>
              </div>

              {/* Quick Input Presets + Parsing Hint */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mr-0.5">
                    Quick:
                  </span>
                  {[1, 10, 50, 100, 1000].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setDisplayInputString(formatSourceDisplay(num, converter.fromUnit));
                        updateActiveWorkspace((ws) => ({
                          ...ws,
                          converter: { ...ws.converter, inputValue: num },
                        }));
                      }}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded-full border transition-colors cursor-pointer ${
                        converter.inputValue === num
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold'
                          : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      {num.toLocaleString()}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  {currentCategory === 'length' ? `Supports 12'-3", 12 3, + - * /` : `Supports arithmetic (+, -, *, /)`}
                </span>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* CENTER BRIDGE: DIRECTIONAL FLOW & SWAP CONTROLS (⇄)             */}
          {/* --------------------------------------------------------------- */}
          <div className="flex flex-row lg:flex-col items-center justify-center gap-2.5 py-1 lg:px-1">
            {/* Directional Conversion Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface)] whitespace-nowrap shadow-2xs">
              <span>{fromSym}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="text-[var(--md-sys-color-primary)]">{toSym}</span>
            </div>

            {/* Primary Circular Swap Units Button (⇄) */}
            <button
              type="button"
              onClick={() => handleSwapUnits(false)}
              className={`w-12 h-12 rounded-full border-2 border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] hover:bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary-container)] hover:text-[var(--md-sys-color-on-primary)] transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center group ${
                isSwapping ? 'ring-4 ring-[var(--md-sys-color-primary)]/30' : ''
              }`}
              title={`Swap Source (${fromSym}) and Target (${toSym})`}
              aria-label={`Swap ${fromSym} and ${toSym} units`}
            >
              <ArrowRightLeft
                className={`w-5 h-5 transition-transform duration-300 ${
                  isSwapping ? 'rotate-180 scale-110' : 'group-hover:rotate-180'
                }`}
              />
            </button>

            {/* Secondary Swap with Value Button */}
            {currentConvertedValue !== null && (
              <button
                type="button"
                onClick={() => handleSwapUnits(true)}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[10px] font-mono font-bold text-[var(--md-sys-color-primary)] transition-all cursor-pointer inline-flex items-center gap-1 btn-tactile whitespace-nowrap"
                title="Swap units AND carry converted result into Source input"
              >
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span>Swap w/ Value</span>
              </button>
            )}

            {lastSwapNotice && (
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 text-center max-w-[130px] leading-tight animate-fadeIn">
                {lastSwapNotice}
              </span>
            )}
          </div>

          {/* --------------------------------------------------------------- */}
          {/* RIGHT CARD: TARGET UNIT (TO • যে এককে রূপান্তর)                  */}
          {/* --------------------------------------------------------------- */}
          <div className="rounded-2xl border-2 border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-sm">
            {/* Card Header + Target Unit Identity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]">
                  <span>TO / রূপান্তরিত একক</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyHeroResult}
                  disabled={heroTargetFormatted === '—'}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] text-[var(--md-sys-color-primary)] text-[11px] font-mono font-bold transition-colors cursor-pointer disabled:opacity-40"
                  title="Copy converted result to clipboard"
                >
                  {copiedHeroResult ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHeroResult ? 'Copied' : 'Copy Result'}</span>
                </button>
              </div>

              {/* Prominent Target Unit Header + Full Dropdown Selector */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2 px-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-xl sm:text-2xl font-mono font-black text-[var(--md-sys-color-primary)] shrink-0">
                      {toSym}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                      — {toUnitObj?.name || converter.toUnit}
                    </span>
                  </div>
                </div>

                <select
                  aria-label="Target Unit (To)"
                  value={converter.toUnit}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: { ...ws.converter, toUnit: val },
                    }));
                  }}
                  className="w-full min-h-[44px] px-4 font-mono text-xs sm:text-sm font-semibold border border-[var(--md-sys-color-primary)]/60 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
                >
                  {scopedCategoryUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.symbol} — {u.name} {u.isRegional ? '★ Regional' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 1-Click Quick Unit Pills inside Target Card */}
              <div className="flex flex-wrap items-center gap-1.5">
                {quickUnitPills.map((u) => {
                  const isActive = u.id === converter.toUnit;
                  return (
                    <button
                      key={`to-pill-${u.id}`}
                      type="button"
                      onClick={() => {
                        updateActiveWorkspace((ws) => ({
                          ...ws,
                          converter: { ...ws.converter, toUnit: u.id },
                        }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer btn-tactile ${
                        isActive
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent shadow-2xs'
                          : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)]'
                      }`}
                      title={`Set Target unit to ${u.name} (${u.symbol})`}
                    >
                      {u.symbol}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Giant Live Converted Readout + Formula Bar + Length Footer */}
            <div className="space-y-2.5 pt-1">
              <div
                aria-live="polite"
                className="min-h-[68px] px-5 py-3 rounded-2xl border border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface)] flex flex-wrap items-baseline justify-between gap-2 shadow-2xs"
              >
                <span className="text-3xl md:text-4xl font-mono font-black tabular-nums text-[var(--md-sys-color-primary)] break-all">
                  {heroTargetFormatted}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-primary)]/30 shrink-0">
                  {toSym}
                </span>
              </div>

              {/* Inline Unit-Equivalence Formula Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface)]/85 border border-[var(--md-sys-color-outline-variant)] text-[11px] font-mono">
                <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                  {unitEquivalenceFormula}
                </span>
                <button
                  type="button"
                  onClick={() => setIsExplainModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[var(--md-sys-color-primary)] font-bold hover:underline cursor-pointer shrink-0"
                  title="Open step-by-step mathematical derivation and unit factor proof"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Explain</span>
                </button>
              </div>

              {/* Length Category Footer: Dual Feet-Inch (0'-0"), Decimal Feet (0.00') & Metric Equivalence */}
              {currentCategory === 'length' && lengthFooterSummary && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[11px] font-mono tabular-nums">
                  <div className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface)]">
                    <Compass className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                    <span className="font-bold text-[var(--md-sys-color-primary)]">{lengthFooterSummary.ftInStr}</span>
                    <span className="opacity-60">•</span>
                    <span className="font-semibold">{lengthFooterSummary.decFtStr}</span>
                  </div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">
                    {lengthFooterSummary.metricStr} ({lengthFooterSummary.mmStr})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. BANGLADESH REGIONAL LAND MEASURE MATRIX (AREA DISCIPLINE)        */}
      {/* =================================================================== */}
      {currentCategory === 'area' && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📐</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Bangladesh Regional Land Measure Matrix
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-emerald-500/10 p-1 rounded-lg border border-emerald-500/20 text-xs font-medium">
              <span className="text-[10px] font-mono uppercase text-emerald-800 dark:text-emerald-300 mr-1 px-1">
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
                { label: 'Kani / কানি', val: landBreakdown.kanis, unit: regionalLandPreset === 'chattogram' ? 'kani_shahi' : 'kani', sub: regionalLandPreset === 'chattogram' ? '120 Dec' : '20 Gonda' },
                { label: 'Gonda / গণ্ডা', val: landBreakdown.gondas, unit: 'gonda', sub: '864 sft' },
                { label: 'Kara / কড়া', val: landBreakdown.karas, unit: 'kara', sub: '216 sft' },
                { label: 'Acre / একর', val: landBreakdown.acres, unit: 'acre', sub: '43,560 sft' },
                { label: 'Hectare / হেক্টর', val: landBreakdown.hectares, unit: 'ha', sub: '10,000 m²' },
                { label: 'Square Feet', val: landBreakdown.squareFeet, unit: 'ft2', sub: 'ft² (sft)' },
                { label: 'Square Meters', val: landBreakdown.squareMeters, unit: 'm2', sub: 'SI m²' },
                { label: 'Guntha', val: landBreakdown.gunthas, unit: 'guntha', sub: '1,089 sft' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: { ...ws.converter, toUnit: item.unit },
                    }));
                  }}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    converter.toUnit === item.unit
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 font-bold ring-1 ring-emerald-500'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400'
                  }`}
                  title={`Click to set ${item.label} as Target unit`}
                >
                  <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    <span className="truncate font-bangla">{item.label}</span>
                    <span className="text-[9px] uppercase opacity-75">{item.sub}</span>
                  </div>
                  <div className="text-sm font-mono font-bold mt-0.5 text-emerald-700 dark:text-emerald-300 truncate tabular-nums">
                    {formatSmartNumber(item.val, 4)}{' '}
                    <span className="text-[10px] font-normal">{item.unit}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. SECONDARY SECTION BELOW HERO STAGE: ALL EQUIVALENT CONVERSIONS   */}
      {/* =================================================================== */}
      <section
        aria-label="All Equivalent Conversions"
        className="pt-4 border-t border-[var(--md-sys-color-outline-variant)] space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--md-sys-color-on-surface)] tracking-tight flex items-center gap-2">
              <span>All Equivalent Conversions</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-normal">•</span>
              <span className="font-bangla text-[var(--md-sys-color-primary)]">অন্যান্য এককে মান</span>
            </h2>
            <p className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Live comparison across all {scopedCategoryUnits.length} {activeMeta.nameEn.toLowerCase()} units for{' '}
              <strong>
                {converter.fromUnit === 'ft-in'
                  ? formatFeetInches(converter.inputValue)
                  : formatSmartNumber(converter.inputValue)}{' '}
                {fromSym}
              </strong>
            </p>
          </div>
        </div>

        {/* 4A. Multi-Unit Comparison Grid */}
        <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
              Multi-Unit Comparison Grid ({scopedCategoryUnits.length} Units)
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative">
                <input
                  type="text"
                  value={comparisonSearch}
                  onChange={(e) => setComparisonSearch(e.target.value)}
                  placeholder="Filter units..."
                  className="pl-3 pr-7 py-1 text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                />
                {comparisonSearch && (
                  <button
                    type="button"
                    onClick={() => setComparisonSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

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

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">Dec:</span>
                {(['auto', 2, 4, 6, 8] as const).map((p) => (
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
                    {p === 'auto' ? 'Auto' : p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-b border-[var(--md-sys-color-outline-variant)]">
                <tr>
                  <th className="py-2 px-3 font-semibold">Unit Name &amp; Symbol</th>
                  <th className="py-2 px-3 font-semibold text-right">Converted Equivalent</th>
                  <th className="py-2 px-3 font-semibold text-center w-36">Actions</th>
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[var(--md-sys-color-on-surface)]">{row.unit.name}</span>
                        <span className="text-[10px] px-1.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] font-bold">
                          {row.unit.symbol}
                        </span>
                        {row.unit.isRegional && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                            Regional
                          </span>
                        )}
                        {row.isSource && (
                          <span className="text-[9px] px-1 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold">
                            From
                          </span>
                        )}
                        {row.isTarget && (
                          <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                            To
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
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
                          className="p-1.5 rounded hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] transition-colors cursor-pointer"
                          title={`Copy ${row.formatted} ${row.unit.symbol}`}
                          aria-label={`Copy ${row.unit.name} value`}
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
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            row.isTarget
                              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                              : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] text-[var(--md-sys-color-primary)]'
                          }`}
                        >
                          {row.isTarget ? 'Active To' : 'Set as To'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4B. Collapsible Secondary Tools Row (Visual Diagram, Feet-Inch Parser & Custom Jobsite Units) */}
        <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] overflow-hidden">
          <button
            type="button"
            onClick={() => setIsSecondaryToolsOpen((prev) => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
            aria-expanded={isSecondaryToolsOpen}
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                Secondary Engineering Tools: Visual Scale Diagram, Feet-Inch (0&apos;-0&quot;) Parser &amp; Custom Units
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-[var(--md-sys-color-primary)] flex items-center gap-1 shrink-0">
              <span>{isSecondaryToolsOpen ? 'Collapse' : 'Expand'}</span>
              {isSecondaryToolsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {isSecondaryToolsOpen && (
            <div className="p-4 pt-2 border-t border-[var(--md-sys-color-outline-variant)] space-y-4 animate-fadeIn">
              {/* Row 1: Visual Scale Diagram + Custom Jobsite Unit Manager */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* Visual Conversion Scale Diagram */}
                <div className="lg:col-span-2 p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex flex-col justify-between">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
                    Visual Scale Vector ({fromSym} → {toSym})
                  </div>
                  <UnitConverterDiagramSvg
                    inputVal={converter.inputValue}
                    outputVal={currentConvertedValue ?? 0}
                    fromUnit={converter.fromUnit}
                    toUnit={converter.toUnit}
                    category={converter.category}
                  />
                </div>

                {/* Custom Jobsite Unit Manager */}
                <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                        Custom Jobsite Units
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">
                        {customUnits.length} Defined
                      </span>
                    </div>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                      Define project-specific factors (e.g., local truck/trolley capacities, tile pack areas, custom batch weights) relative to canonical SI base units.
                    </p>
                    {customUnits.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {customUnits.slice(0, 6).map((cu) => (
                          <span
                            key={cu.id}
                            className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                          >
                            {cu.symbol} ({cu.category})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onOpenCustomUnitsModal}
                    className="w-full min-h-[40px] px-3 py-2 text-xs font-bold rounded-xl border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] transition-all cursor-pointer flex items-center justify-center gap-1.5 btn-tactile"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Manage Custom Jobsite Units</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Dedicated Feet-Inch (0'-0") Expression Parser */}
              <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                      Feet-Inch (0&apos;-0&quot;) &amp; Fraction Expression Parser
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
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
                        className="px-2 py-0.5 text-[10px] font-mono rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder={`e.g. 14'-6 3/4", 12 ft 4 in, 3/4", 3810mm, or 3.81m`}
                    value={converter.feetInchRawString}
                    onChange={(e) => {
                      const str = e.target.value;
                      updateActiveWorkspace((ws) => ({
                        ...ws,
                        converter: { ...ws.converter, feetInchRawString: str },
                      }));
                    }}
                    className="w-full min-h-[44px] px-4 pr-16 font-mono text-sm border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {activeFeetInchResult.isValid ? (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                          Architectural Standard
                        </span>
                        <strong className="text-sm text-[var(--md-sys-color-primary)] truncate block">
                          {activeFeetInchResult.fractionString || activeFeetInchResult.normalizedString}
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                          Decimal Feet
                        </span>
                        <strong className="text-sm truncate block">
                          {formatSmartNumber(activeFeetInchResult.totalFeet, 4)} ft
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                          Metric (Meters)
                        </span>
                        <strong className="text-sm text-emerald-600 dark:text-emerald-400 truncate block">
                          {formatSmartNumber(activeFeetInchResult.totalMeters, 4)} m
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                          Millimeters (mm)
                        </span>
                        <strong className="text-sm truncate block">
                          {formatSmartNumber(activeFeetInchResult.totalMm, 1)} mm
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                        Fraction: {activeFeetInchResult.fractionString || `${activeFeetInchResult.totalInches.toFixed(2)}"`}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
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
                        >
                          Apply to From (ft&apos;-in&quot;)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const feetVal = parseFloat(activeFeetInchResult.totalFeet.toFixed(4));
                            setDisplayInputString(formatSourceDisplay(feetVal, 'ft'));
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
                          className="px-2.5 py-1 text-[11px] font-mono rounded bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-primary)] cursor-pointer font-bold"
                        >
                          Apply {activeFeetInchResult.totalFeet.toFixed(3)} ft
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const metersVal = parseFloat(activeFeetInchResult.totalMeters.toFixed(4));
                            setDisplayInputString(formatSourceDisplay(metersVal, 'm'));
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
                        >
                          Apply {activeFeetInchResult.totalMeters.toFixed(3)} m
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  converter.feetInchRawString && (
                    <div className="text-xs font-mono text-amber-600 dark:text-amber-400 pt-0.5">
                      {activeFeetInchResult.errorMessage || 'Try format: 12\'-6 1/2" or 3500mm'}
                    </div>
                  )
                )}
              </div>

              {/* Row 3: Rebar Bar Designation Equivalence (Length / Area / Mass) */}
              {(currentCategory === 'length' || currentCategory === 'area' || currentCategory === 'mass') && (() => {
                const selectedBar = REBAR_BAR_DESIGNATIONS.find((b) => b.id === selectedRebarId) || REBAR_BAR_DESIGNATIONS[6];
                return (
                  <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🔩</span>
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                          Rebar Bar Designation Equivalence (ASTM #3–#18 ⇄ ISO/BDS 8mm–50mm)
                        </label>
                      </div>
                      <select
                        value={selectedBar.id}
                        onChange={(e) => setSelectedRebarId(e.target.value)}
                        className="px-3 py-1 text-xs font-mono font-bold border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                      >
                        {REBAR_BAR_DESIGNATIONS.map((b) => (
                          <option key={b.id} value={b.id}>
                            [{b.standard}] {b.label} — {b.diameterMm} mm ({b.unitWeightKgPerM} kg/m)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Diameter (mm / in)</span>
                        <strong className="text-sm text-[var(--md-sys-color-primary)]">
                          {selectedBar.diameterMm} mm ({selectedBar.diameterIn}&quot;)
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Bangla Suta (সূতা)</span>
                        <strong className="text-sm">{selectedBar.suta.toFixed(2)} suta</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Steel Area (As)</span>
                        <strong className="text-sm">{selectedBar.areaMm2} mm² ({selectedBar.areaIn2} in²)</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Unit Weight (d²/162.2)</span>
                        <strong className="text-sm text-emerald-600 dark:text-emerald-400">
                          {selectedBar.unitWeightKgPerM} kg/m ({selectedBar.unitWeightLbPerFt} lb/ft)
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Closest Cross-Standard</span>
                        <strong className="text-xs text-[var(--md-sys-color-on-surface)]">{selectedBar.nearestEquivalent}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* Step-by-Step Conversion Logic & Custom Unit Factor Proof Modal */}
      <ExplainConversionModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        inputValue={converter.inputValue}
        fromUnitId={converter.fromUnit}
        toUnitId={converter.toUnit}
        category={converter.category}
        customUnits={customUnits}
        regionalLandPreset={regionalLandPreset}
        onSwapUnits={() => handleSwapUnits(false)}
        onOpenCustomUnitsModal={onOpenCustomUnitsModal}
      />
    </div>
  );
};

// -----------------------------------------------------------------------------
// UnitConverterMetrics Component (Compact SI & Audit Telemetry Strip Below Stage)
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
  regionalLandPreset?: 'standard' | 'rajshahi' | 'chattogram';
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
  regionalLandPreset = 'standard',
  onSwapUnits,
  onSwapWithResult,
  onOpenCustomUnitsModal,
}) => {
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const meta = CATEGORY_METAS[category] || CATEGORY_METAS.length;

  return (
    <div className="space-y-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
            Discipline &amp; Canonical SI Base
          </div>
          <div className="text-sm font-mono font-bold mt-1 text-[var(--md-sys-color-on-surface)]">
            {meta.nameEn} ({BASE_UNITS[category]})
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>Exact Conversion Derivation</span>
            <button
              type="button"
              onClick={() => setIsExplainModalOpen(true)}
              className="text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              title="Explain step-by-step conversion logic using stored custom unit factors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Explain Step-by-Step</span>
            </button>
          </div>
          <div className="text-xs font-mono mt-1 opacity-90 break-words leading-relaxed text-[var(--md-sys-color-on-surface)]">
            {conversionResult.formula}
          </div>
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
        regionalLandPreset={regionalLandPreset}
        onSwapUnits={onSwapUnits}
        onOpenCustomUnitsModal={onOpenCustomUnitsModal}
      />
    </div>
  );
};
