/**
 * Hydraulic Material Roughness Presets & Engineering Reference Database
 * Complies with standard civil engineering references (Chow, Fair-Geyer, AWWA, ASCE)
 */

export interface HydraulicMaterialDefinition {
  id: string;
  name: string;
  category: 'plastic' | 'metal' | 'concrete' | 'natural';
  hazenWilliamsC: number;
  hazenWilliamsCRange: [number, number];
  manningN: number;
  manningNRange: [number, number];
  darcyRoughnessMm: number;
  description: string;
  recommendedUses: string[];
  maxVelocityMps: number;
  minCleansingVelocityMps: number;
}

export const HYDRAULIC_MATERIALS: HydraulicMaterialDefinition[] = [
  {
    id: 'pvc',
    name: 'PVC (Polyvinyl Chloride)',
    category: 'plastic',
    hazenWilliamsC: 150,
    hazenWilliamsCRange: [140, 150],
    manningN: 0.009,
    manningNRange: [0.009, 0.011],
    darcyRoughnessMm: 0.0015,
    description: 'Smooth-wall thermoplastic pipe. Corrosion-immune, exceptionally low friction losses.',
    recommendedUses: ['Potable Water Distribution', 'Building Plumbing', 'Gravity Sewer', 'Drainage'],
    maxVelocityMps: 3.0,
    minCleansingVelocityMps: 0.6,
  },
  {
    id: 'hdpe',
    name: 'HDPE (High-Density Polyethylene)',
    category: 'plastic',
    hazenWilliamsC: 150,
    hazenWilliamsCRange: [145, 155],
    manningN: 0.010,
    manningNRange: [0.009, 0.012],
    darcyRoughnessMm: 0.002,
    description: 'Flexible, fusion-welded leak-free pipe. High abrasion resistance and chemical durability.',
    recommendedUses: ['Water Transmission Mains', 'Trenchless Moling/HDD', 'Mining Slurry', 'Storm Culverts'],
    maxVelocityMps: 3.5,
    minCleansingVelocityMps: 0.6,
  },
  {
    id: 'ductile-iron',
    name: 'Ductile Iron (Cement Mortar Lined)',
    category: 'metal',
    hazenWilliamsC: 130,
    hazenWilliamsCRange: [120, 140],
    manningN: 0.012,
    manningNRange: [0.011, 0.014],
    darcyRoughnessMm: 0.12,
    description: 'High tensile ductility and pressure rating. Centrifugally lined with cement mortar to inhibit tuberculation.',
    recommendedUses: ['High-Pressure Water Mains', 'Pumping Rising Mains', 'Urban Arterial Transmission'],
    maxVelocityMps: 4.0,
    minCleansingVelocityMps: 0.6,
  },
  {
    id: 'concrete',
    name: 'Precast Concrete / RCC Pipe',
    category: 'concrete',
    hazenWilliamsC: 120,
    hazenWilliamsCRange: [110, 130],
    manningN: 0.013,
    manningNRange: [0.012, 0.015],
    darcyRoughnessMm: 0.36,
    description: 'Heavy-duty precast reinforced concrete pipe (RCP). High structural strength under highway earth loads.',
    recommendedUses: ['Stormwater Drainage Trunks', 'Highway Culverts', 'Box Culverts', 'Sanitary Interceptors'],
    maxVelocityMps: 3.5,
    minCleansingVelocityMps: 0.7,
  },
  {
    id: 'corrugated-steel',
    name: 'Corrugated Steel Pipe (CSP / CMP)',
    category: 'metal',
    hazenWilliamsC: 80,
    hazenWilliamsCRange: [60, 100],
    manningN: 0.024,
    manningNRange: [0.022, 0.027],
    darcyRoughnessMm: 4.5,
    description: 'Helical corrugated galvanized steel. High surface corrugation roughness; economical for large drainage runs.',
    recommendedUses: ['Highway & Railway Culverts', 'Temporary Stream Crossings', 'Storm Outfall Chutes'],
    maxVelocityMps: 3.0,
    minCleansingVelocityMps: 0.75,
  },
  {
    id: 'cast-iron',
    name: 'Unlined Cast Iron (Aged / Tuberculated)',
    category: 'metal',
    hazenWilliamsC: 100,
    hazenWilliamsCRange: [80, 110],
    manningN: 0.015,
    manningNRange: [0.013, 0.017],
    darcyRoughnessMm: 0.26,
    description: 'Legacy cast iron pipe prone to internal mineral encrustation and tuberculation over design life.',
    recommendedUses: ['Legacy Network Assessment', 'Rehabilitation Evaluation'],
    maxVelocityMps: 2.5,
    minCleansingVelocityMps: 0.6,
  },
  {
    id: 'galvanized-steel',
    name: 'Galvanized Steel / GI Pipe',
    category: 'metal',
    hazenWilliamsC: 120,
    hazenWilliamsCRange: [110, 130],
    manningN: 0.014,
    manningNRange: [0.013, 0.016],
    darcyRoughnessMm: 0.15,
    description: 'Zinc-coated steel for above-ground piping, pump headers, and fire suppression systems.',
    recommendedUses: ['Pump Headers', 'Fire Main Risers', 'Industrial Plant Piping'],
    maxVelocityMps: 3.5,
    minCleansingVelocityMps: 0.6,
  },
  {
    id: 'channel-earth-uniform',
    name: 'Earth Channel (Clean & Uniform)',
    category: 'natural',
    hazenWilliamsC: 70,
    hazenWilliamsCRange: [60, 80],
    manningN: 0.022,
    manningNRange: [0.020, 0.025],
    darcyRoughnessMm: 8.0,
    description: 'Regular trapezoidal earth channel in loam/clay with straight alignment and smooth bottom.',
    recommendedUses: ['Agricultural Irrigation Canals', 'Surface Drainage Ditches'],
    maxVelocityMps: 1.5,
    minCleansingVelocityMps: 0.5,
  },
  {
    id: 'channel-riprap',
    name: 'Riprap / Stone Pitching Lined',
    category: 'natural',
    hazenWilliamsC: 50,
    hazenWilliamsCRange: [40, 60],
    manningN: 0.038,
    manningNRange: [0.035, 0.042],
    darcyRoughnessMm: 25.0,
    description: 'Hand-placed or dumped angular rock riprap for erosion protection on steep channel banks.',
    recommendedUses: ['Scour Protection Zones', 'Steep Spillway Chutes', 'Bridge Abutment Ditches'],
    maxVelocityMps: 3.0,
    minCleansingVelocityMps: 0.8,
  },
];

export function getHydraulicMaterial(id: string): HydraulicMaterialDefinition {
  return (
    HYDRAULIC_MATERIALS.find((m) => m.id === id) ||
    HYDRAULIC_MATERIALS.find((m) => m.id === 'pvc')!
  );
}

/**
 * Commercial Nominal Diameters (DN in mm) standard for water and storm pipelines
 */
export const STANDARD_COMMERCIAL_DIAMETERS_MM = [
  50, 65, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1500, 1800, 2000
];
