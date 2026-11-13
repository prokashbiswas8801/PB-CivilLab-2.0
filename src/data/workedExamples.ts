import { BeamParameters, ContinuousBeamParameters } from '../types/civil';

export interface BeamWorkedExample {
  id: string;
  module: 'beam-analysis';
  title: string;
  subtitle: string;
  category: string;
  params: Partial<BeamParameters>;
}

export interface ContinuousBeamWorkedExample {
  id: string;
  module: 'continuous-beam';
  title: string;
  subtitle: string;
  category: string;
  params: ContinuousBeamParameters;
}

export type WorkedExampleEntry = BeamWorkedExample | ContinuousBeamWorkedExample;

export const BEAM_WORKED_EXAMPLES: BeamWorkedExample[] = [
  {
    id: 'ss-udl-6m',
    module: 'beam-analysis',
    title: 'Simply Supported Girder (L = 6m, w = 15 kN/m)',
    subtitle: 'Classic wL²/8 = 67.5 kN·m flexure + 5wL⁴/384EI deflection benchmark',
    category: 'Textbook Benchmark',
    params: {
      spanLengthM: 6.0,
      uniformLoadKnPerM: 15,
      pointLoadKn: 0,
      pointLoadPositionM: 3.0,
      elasticModulusGpa: 200,
      momentOfInertiaCm4: 28000,
      supportCondition: 'simply-supported',
      overhangLeftM: 0,
      overhangRightM: 0,
      distributedLoadType: 'uniform',
      endLoadKnPerM: 15,
      allowableStressMpa: 250,
      sectionDepthMm: 450,
      codeStandard: 'BNBC-2020',
    },
  },
  {
    id: 'cantilever-balcony',
    module: 'beam-analysis',
    title: 'Cantilever Balcony + Parapet Point Load',
    subtitle: 'L = 2.8m overhang with 12 kN/m slab UDL + 18 kN tip parapet',
    category: 'Residential RC',
    params: {
      spanLengthM: 2.8,
      uniformLoadKnPerM: 12,
      pointLoadKn: 18,
      pointLoadPositionM: 2.8,
      elasticModulusGpa: 25,
      momentOfInertiaCm4: 185000,
      supportCondition: 'cantilever',
      overhangLeftM: 0,
      overhangRightM: 0,
      distributedLoadType: 'uniform',
      endLoadKnPerM: 12,
      allowableStressMpa: 220,
      sectionDepthMm: 500,
      codeStandard: 'BNBC-2020',
    },
  },
  {
    id: 'overhanging-trapezoidal',
    module: 'beam-analysis',
    title: 'Double-Overhanging Transfer Girder (Trapezoidal)',
    subtitle: '6.5m main span + 1.5m/2.0m cantilevers with hogging contraflexure',
    category: 'Commercial Frame',
    params: {
      spanLengthM: 6.5,
      uniformLoadKnPerM: 14,
      pointLoadKn: 35,
      pointLoadPositionM: 8.5,
      elasticModulusGpa: 200,
      momentOfInertiaCm4: 65000,
      supportCondition: 'overhanging',
      overhangLeftM: 1.5,
      overhangRightM: 2.0,
      distributedLoadType: 'trapezoidal',
      endLoadKnPerM: 26,
      allowableStressMpa: 250,
      sectionDepthMm: 550,
      codeStandard: 'BNBC-2020',
    },
  },
  {
    id: 'fixed-hydrostatic',
    module: 'beam-analysis',
    title: 'Fixed-End Retaining Wall / Hydrostatic Beam',
    subtitle: '5.5m fixed girder under increasing triangular fluid pressure (0 → 30 kN/m)',
    category: 'Water / Retaining',
    params: {
      spanLengthM: 5.5,
      uniformLoadKnPerM: 30,
      pointLoadKn: 0,
      pointLoadPositionM: 2.75,
      elasticModulusGpa: 27,
      momentOfInertiaCm4: 240000,
      supportCondition: 'fixed-ends',
      overhangLeftM: 0,
      overhangRightM: 0,
      distributedLoadType: 'triangular-increasing',
      endLoadKnPerM: 30,
      allowableStressMpa: 240,
      sectionDepthMm: 550,
      codeStandard: 'ACI-318',
    },
  },
];

export const CONTINUOUS_BEAM_WORKED_EXAMPLES: ContinuousBeamWorkedExample[] = [
  {
    id: '3-span-asymmetric',
    module: 'continuous-beam',
    title: '3-Span Asymmetric Floor Beam (Dhaka RC Frame)',
    subtitle: '5.5m + 7.2m + 4.8m unequal spans with point girder reaction on middle bay',
    category: 'BNBC-2020 Frame',
    params: {
      spanCount: 3,
      leftSupport: 'pin',
      rightSupport: 'pin',
      sectionDepthMm: 600,
      sectionWidthMm: 300,
      allowableStressMpa: 250,
      concreteGradeFckMpa: 25,
      codeStandard: 'BNBC-2020',
      spans: [
        {
          id: 'ex3-s1',
          spanIndex: 0,
          lengthM: 5.5,
          udlKnPerM: 28,
          pointLoadKn: 0,
          pointLoadPositionM: 2.75,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 540000,
          elasticModulusGpa: 24,
        },
        {
          id: 'ex3-s2',
          spanIndex: 1,
          lengthM: 7.2,
          udlKnPerM: 34,
          pointLoadKn: 65,
          pointLoadPositionM: 3.6,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 540000,
          elasticModulusGpa: 24,
        },
        {
          id: 'ex3-s3',
          spanIndex: 2,
          lengthM: 4.8,
          udlKnPerM: 24,
          pointLoadKn: 0,
          pointLoadPositionM: 2.4,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 540000,
          elasticModulusGpa: 24,
        },
      ],
    },
  },
  {
    id: '2-span-fixed-bridge',
    module: 'continuous-beam',
    title: '2-Span Continuous Bridge Deck Girder',
    subtitle: 'Fixed abutments · Equal 10m spans under 45 kN/m + 120 kN axle point load',
    category: 'Bridge / AASHTO',
    params: {
      spanCount: 2,
      leftSupport: 'fixed',
      rightSupport: 'fixed',
      sectionDepthMm: 850,
      sectionWidthMm: 400,
      allowableStressMpa: 250,
      concreteGradeFckMpa: 35,
      codeStandard: 'ACI-318',
      spans: [
        {
          id: 'ex2-s1',
          spanIndex: 0,
          lengthM: 10.0,
          udlKnPerM: 45,
          pointLoadKn: 120,
          pointLoadPositionM: 4.0,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 2040000,
          elasticModulusGpa: 28,
        },
        {
          id: 'ex2-s2',
          spanIndex: 1,
          lengthM: 10.0,
          udlKnPerM: 45,
          pointLoadKn: 0,
          pointLoadPositionM: 5.0,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 2040000,
          elasticModulusGpa: 28,
        },
      ],
    },
  },
  {
    id: '4-span-hydrostatic-tank',
    module: 'continuous-beam',
    title: '4-Span Underground Tank Wall Strip',
    subtitle: 'Multi-bay symmetric & triangular earth/water pressure distribution',
    category: 'Hydraulic Structure',
    params: {
      spanCount: 4,
      leftSupport: 'fixed',
      rightSupport: 'pin',
      sectionDepthMm: 500,
      sectionWidthMm: 350,
      allowableStressMpa: 230,
      concreteGradeFckMpa: 30,
      codeStandard: 'BNBC-2020',
      spans: [
        {
          id: 'ex4-s1',
          spanIndex: 0,
          lengthM: 4.5,
          udlKnPerM: 18,
          pointLoadKn: 0,
          pointLoadPositionM: 2.25,
          triangularLoadKnPerM: 22,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 364000,
          elasticModulusGpa: 26,
        },
        {
          id: 'ex4-s2',
          spanIndex: 1,
          lengthM: 5.0,
          udlKnPerM: 18,
          pointLoadKn: 0,
          pointLoadPositionM: 2.5,
          triangularLoadKnPerM: 25,
          triangularLoadPattern: 'symmetric',
          momentOfInertiaCm4: 364000,
          elasticModulusGpa: 26,
        },
        {
          id: 'ex4-s3',
          spanIndex: 2,
          lengthM: 5.0,
          udlKnPerM: 18,
          pointLoadKn: 0,
          pointLoadPositionM: 2.5,
          triangularLoadKnPerM: 25,
          triangularLoadPattern: 'symmetric',
          momentOfInertiaCm4: 364000,
          elasticModulusGpa: 26,
        },
        {
          id: 'ex4-s4',
          spanIndex: 3,
          lengthM: 4.5,
          udlKnPerM: 18,
          pointLoadKn: 0,
          pointLoadPositionM: 2.25,
          triangularLoadKnPerM: 22,
          triangularLoadPattern: 'decreasing',
          momentOfInertiaCm4: 364000,
          elasticModulusGpa: 26,
        },
      ],
    },
  },
];

export const ALL_WORKED_EXAMPLES: WorkedExampleEntry[] = [
  ...BEAM_WORKED_EXAMPLES,
  ...CONTINUOUS_BEAM_WORKED_EXAMPLES,
];

export interface ParsedDeepLink {
  module?: 'beam-analysis' | 'continuous-beam';
  exampleId?: string;
  overrides: {
    L?: number;
    q?: number;
    P?: number;
    a?: number;
  };
}

/**
 * Safely parses URL query parameters (?module=beam-analysis&example=ss-udl-6m&q=10)
 * without touching verification routes (?verify, ?docToken, etc.).
 */
export function parseStructuralDeepLink(search: string): ParsedDeepLink | null {
  if (!search) return null;
  const sp = new URLSearchParams(search);
  const rawModule = sp.get('module');
  const rawExample = sp.get('example');

  const L = sp.has('L') ? Number(sp.get('L')) : undefined;
  const q = sp.has('q') ? Number(sp.get('q')) : undefined;
  const P = sp.has('P') ? Number(sp.get('P')) : undefined;
  const a = sp.has('a') ? Number(sp.get('a')) : undefined;

  const hasValidOverrides =
    (L !== undefined && Number.isFinite(L) && L > 0 && L <= 100) ||
    (q !== undefined && Number.isFinite(q) && q >= 0 && q <= 2000) ||
    (P !== undefined && Number.isFinite(P) && P >= 0 && P <= 5000) ||
    (a !== undefined && Number.isFinite(a) && a >= 0 && a <= 100);

  const moduleValid = rawModule === 'beam-analysis' || rawModule === 'continuous-beam' ? rawModule : undefined;

  if (!moduleValid && !rawExample && !hasValidOverrides) {
    return null;
  }

  return {
    module: moduleValid,
    exampleId: rawExample || undefined,
    overrides: {
      ...(L !== undefined && Number.isFinite(L) && L > 0 && L <= 100 ? { L } : {}),
      ...(q !== undefined && Number.isFinite(q) && q >= 0 && q <= 2000 ? { q } : {}),
      ...(P !== undefined && Number.isFinite(P) && P >= 0 && P <= 5000 ? { P } : {}),
      ...(a !== undefined && Number.isFinite(a) && a >= 0 && a <= 100 ? { a } : {}),
    },
  };
}

export function buildWorkedExampleUrl(
  moduleKey: 'beam-analysis' | 'continuous-beam',
  exampleId: string,
  beamOverrides?: Partial<BeamParameters>
): string {
  const url = new URL(window.location.href);
  url.searchParams.delete('verify');
  url.searchParams.delete('token');
  url.searchParams.delete('docToken');
  url.searchParams.delete('verifyDoc');
  url.searchParams.set('module', moduleKey);
  url.searchParams.set('example', exampleId);
  if (moduleKey === 'beam-analysis' && beamOverrides) {
    if (typeof beamOverrides.spanLengthM === 'number') {
      url.searchParams.set('L', String(beamOverrides.spanLengthM));
    }
    if (typeof beamOverrides.uniformLoadKnPerM === 'number') {
      url.searchParams.set('q', String(beamOverrides.uniformLoadKnPerM));
    }
    if (typeof beamOverrides.pointLoadKn === 'number' && beamOverrides.pointLoadKn > 0) {
      url.searchParams.set('P', String(beamOverrides.pointLoadKn));
    } else {
      url.searchParams.delete('P');
    }
  } else {
    url.searchParams.delete('L');
    url.searchParams.delete('q');
    url.searchParams.delete('P');
  }
  return url.toString();
}
