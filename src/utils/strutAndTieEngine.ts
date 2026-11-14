import {
  StmMember,
  StmNode,
  StmNodalLoad,
  StrutAndTieParams,
  ValidationIssue,
} from '../types/civil';
import {
  CalculationEnvelope,
  CalculationStep,
  ScopeAndLimitsMetadata,
  createEnvelope,
} from './calculations';

export type StmMemberRole = 'strut' | 'tie' | 'zero-force';

export interface StmNodeResult {
  nodeId: string;
  label: string;
  xM: number;
  yM: number;
  support: StmNode['support'];
  uxMm: number;
  uyMm: number;
  appliedFxKn: number;
  appliedFyKn: number;
  reactionRxKn: number;
  reactionRyKn: number;
  sumFxResidualKn: number;
  sumFyResidualKn: number;
}

export interface StmMemberResult {
  memberId: string;
  label: string;
  startNodeId: string;
  endNodeId: string;
  startLabel: string;
  endLabel: string;
  lengthM: number;
  angleDeg: number;
  cosTheta: number;
  sinTheta: number;
  axialForceKn: number; // + Tension (Tie), - Compression (Strut)
  role: StmMemberRole;
  stressMpa: number;
  allowableLimitMpa: number;
  dcrRatio: number;
  requiredTieSteelMm2: number; // As,req = F_tie / (0.75 * fy) for ties, 0 for struts
}

export interface StrutAndTieResult {
  presetName: string;
  memberThicknessMm: number;
  concreteFcMpa: number;
  rebarFyMpa: number;
  nodeCount: number;
  memberCount: number;
  strutCount: number;
  tieCount: number;
  zeroForceCount: number;
  totalAppliedFxKn: number;
  totalAppliedFyKn: number;
  totalReactionRxKn: number;
  totalReactionRyKn: number;
  equilibriumResidualKn: number;
  momentResidualKnm: number;
  maxCompressionStrutKn: number;
  maxTensionTieKn: number;
  totalRequiredTieSteelMm2: number;
  maxDisplacementMm: number;
  governingDcr: number;
  status: 'nominal' | 'warning' | 'critical';
  nodeResults: StmNodeResult[];
  memberResults: StmMemberResult[];
}

export interface StmWorkedExampleMeta {
  id: string;
  name: string;
  shortDesc: string;
  params: StrutAndTieParams;
}

export const STM_WORKED_EXAMPLES: StmWorkedExampleMeta[] = [
  {
    id: 'deep-beam-single',
    name: 'Deep Beam under Single Point Load',
    shortDesc: '4.0m span × 1.6m transfer deep beam carrying 900 kN central point load',
    params: {
      presetId: 'deep-beam-single',
      presetName: 'Deep Beam under Single Point Load',
      code: 'BNBC-2020',
      memberThicknessMm: 400,
      concreteFcMpa: 28,
      rebarFyMpa: 420,
      nodes: [
        { id: 'n1', label: 'A (Left Support)', xM: 0.0, yM: 0.0, support: 'pin' },
        { id: 'n2', label: 'B (Load Node)', xM: 2.0, yM: 1.4, support: 'none' },
        { id: 'n3', label: 'C (Right Support)', xM: 4.0, yM: 0.0, support: 'roller-y' },
      ],
      members: [
        { id: 'm1', label: 'S1 (Left Strut)', startNodeId: 'n1', endNodeId: 'n2', areaCm2: 800, strutBetaS: 0.75 },
        { id: 'm2', label: 'S2 (Right Strut)', startNodeId: 'n2', endNodeId: 'n3', areaCm2: 800, strutBetaS: 0.75 },
        { id: 'm3', label: 'T1 (Bottom Tie)', startNodeId: 'n1', endNodeId: 'n3', areaCm2: 24, strutBetaS: 0.75 },
      ],
      nodalLoads: [{ nodeId: 'n2', fxKn: 0, fyKn: -900 }],
    },
  },
  {
    id: 'two-point-transfer-girder',
    name: 'Symmetrical Two-Point Load Transfer Girder',
    shortDesc: '6.0m span × 1.8m transfer girder supporting twin 650 kN planted column loads',
    params: {
      presetId: 'two-point-transfer-girder',
      presetName: 'Symmetrical Two-Point Load Transfer Girder',
      code: 'BNBC-2020',
      memberThicknessMm: 450,
      concreteFcMpa: 32,
      rebarFyMpa: 500,
      nodes: [
        { id: 'n1', label: 'A (Left Pin)', xM: 0.0, yM: 0.0, support: 'pin' },
        { id: 'n2', label: 'B (Top Left)', xM: 2.0, yM: 1.5, support: 'none' },
        { id: 'n3', label: 'C (Top Right)', xM: 4.0, yM: 1.5, support: 'none' },
        { id: 'n4', label: 'D (Right Roller)', xM: 6.0, yM: 0.0, support: 'roller-y' },
      ],
      members: [
        { id: 'm1', label: 'S1 (Diag Strut L)', startNodeId: 'n1', endNodeId: 'n2', areaCm2: 900, strutBetaS: 0.75 },
        { id: 'm2', label: 'S2 (Top Chord)', startNodeId: 'n2', endNodeId: 'n3', areaCm2: 900, strutBetaS: 1.0 },
        { id: 'm3', label: 'S3 (Diag Strut R)', startNodeId: 'n3', endNodeId: 'n4', areaCm2: 900, strutBetaS: 0.75 },
        { id: 'm4', label: 'T1 (Bottom Tie)', startNodeId: 'n1', endNodeId: 'n4', areaCm2: 32, strutBetaS: 0.75 },
      ],
      nodalLoads: [
        { nodeId: 'n2', fxKn: 0, fyKn: -650 },
        { nodeId: 'n3', fxKn: 0, fyKn: -650 },
      ],
    },
  },
  {
    id: 'corbel-bracket-stm',
    name: 'Corbel Bracket STM',
    shortDesc: 'Cantilever column corbel with Vu = 420 kN vertical & Nuc = 85 kN outward tension',
    params: {
      presetId: 'corbel-bracket-stm',
      presetName: 'Corbel Bracket STM',
      code: 'ACI-318',
      memberThicknessMm: 350,
      concreteFcMpa: 30,
      rebarFyMpa: 420,
      nodes: [
        { id: 'n1', label: 'A (Col Back Top)', xM: 0.0, yM: 0.6, support: 'roller-x' },
        { id: 'n2', label: 'B (Bearing Pad)', xM: 0.55, yM: 0.6, support: 'none' },
        { id: 'n3', label: 'C (Col Compression)', xM: 0.0, yM: 0.0, support: 'pin' },
      ],
      members: [
        { id: 'm1', label: 'T1 (Top Anchor Tie)', startNodeId: 'n1', endNodeId: 'n2', areaCm2: 18, strutBetaS: 0.75 },
        { id: 'm2', label: 'S1 (Inclined Strut)', startNodeId: 'n3', endNodeId: 'n2', areaCm2: 650, strutBetaS: 0.75 },
        { id: 'm3', label: 'S2 (Col Face Strut)', startNodeId: 'n1', endNodeId: 'n3', areaCm2: 700, strutBetaS: 1.0 },
      ],
      nodalLoads: [{ nodeId: 'n2', fxKn: 85, fyKn: -420 }],
    },
  },
];

function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > maxVal) {
        maxVal = Math.abs(M[r][col]);
        pivotRow = r;
      }
    }
    if (maxVal < 1e-10) {
      return null;
    }
    if (pivotRow !== col) {
      const tmp = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = tmp;
    }

    const piv = M[col][col];
    for (let j = col; j <= n; j++) {
      M[col][j] /= piv;
    }
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      if (Math.abs(factor) < 1e-14) continue;
      for (let j = col; j <= n; j++) {
        M[r][j] -= factor * M[col][j];
      }
    }
  }

  return M.map((row) => row[n]);
}

export function computeStrutAndTie(
  params: StrutAndTieParams
): CalculationEnvelope<StrutAndTieResult> {
  if (!params) {
    return createEnvelope<StrutAndTieResult>(null, [
      { field: 'params', message: 'Strut-and-Tie parameters are missing.', severity: 'error' },
    ]);
  }
  const issues: ValidationIssue[] = [];
  const { nodes = [], members = [], nodalLoads = [], concreteFcMpa, rebarFyMpa } = params;

  if (nodes.length < 3 || members.length < 2) {
    issues.push({
      field: 'nodes',
      message: 'A valid Strut-and-Tie truss requires at least 3 nodes and 2 members.',
      severity: 'error',
    });
    return createEnvelope<StrutAndTieResult>(null, issues);
  }

  const nodeIndexMap = new Map<string, number>();
  nodes.forEach((n, idx) => nodeIndexMap.set(n.id, idx));

  const nDof = nodes.length * 2;
  const K: number[][] = Array.from({ length: nDof }, () => Array(nDof).fill(0));
  const F: number[] = Array(nDof).fill(0);

  // Use nominal E = 200 GPa for elastic stiffness ratio (exact statically determinate / stiffness forces)
  const E_kpa = 200_000_000;

  interface GeomCache {
    member: StmMember;
    iIdx: number;
    jIdx: number;
    L: number;
    c: number;
    s: number;
    EA_over_L: number;
  }
  const memberGeoms: GeomCache[] = [];

  for (const m of members) {
    const iIdx = nodeIndexMap.get(m.startNodeId);
    const jIdx = nodeIndexMap.get(m.endNodeId);
    if (iIdx === undefined || jIdx === undefined || iIdx === jIdx) {
      issues.push({
        field: 'members',
        message: `Member ${m.label} has invalid start/end node connectivity.`,
        severity: 'error',
      });
      return createEnvelope<StrutAndTieResult>(null, issues);
    }
    const ni = nodes[iIdx];
    const nj = nodes[jIdx];
    const dx = nj.xM - ni.xM;
    const dy = nj.yM - ni.yM;
    const L = Math.hypot(dx, dy);
    if (L < 1e-4) {
      issues.push({
        field: 'members',
        message: `Member ${m.label} has zero geometric length.`,
        severity: 'error',
      });
      return createEnvelope<StrutAndTieResult>(null, issues);
    }
    const c = dx / L;
    const s = dy / L;
    const areaM2 = Math.max(1e-5, m.areaCm2 / 10000);
    const kVal = (E_kpa * areaM2) / L;

    memberGeoms.push({ member: m, iIdx, jIdx, L, c, s, EA_over_L: kVal });

    const dofs = [2 * iIdx, 2 * iIdx + 1, 2 * jIdx, 2 * jIdx + 1];
    const ke = [
      [c * c, c * s, -c * c, -c * s],
      [c * s, s * s, -c * s, -s * s],
      [-c * c, -c * s, c * c, c * s],
      [-c * s, -s * s, c * s, s * s],
    ];
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        K[dofs[r]][dofs[col]] += kVal * ke[r][col];
      }
    }
  }

  for (const load of nodalLoads) {
    const idx = nodeIndexMap.get(load.nodeId);
    if (idx !== undefined) {
      F[2 * idx] += load.fxKn;
      F[2 * idx + 1] += load.fyKn;
    }
  }

  const fixedDofs = new Set<number>();
  nodes.forEach((n, idx) => {
    if (n.support === 'pin') {
      fixedDofs.add(2 * idx);
      fixedDofs.add(2 * idx + 1);
    } else if (n.support === 'roller-x') {
      // Restrained in X, free in Y
      fixedDofs.add(2 * idx);
    } else if (n.support === 'roller-y') {
      // Restrained in Y, free in X
      fixedDofs.add(2 * idx + 1);
    }
  });

  if (fixedDofs.size < 3) {
    issues.push({
      field: 'supports',
      message: `Truss is kinematically unstable (${fixedDofs.size} support restraints < 3 minimum for 2D equilibrium). Add Pin + Roller supports.`,
      severity: 'error',
    });
    return createEnvelope<StrutAndTieResult>(null, issues);
  }

  const freeDofs: number[] = [];
  for (let d = 0; d < nDof; d++) {
    if (!fixedDofs.has(d)) freeDofs.push(d);
  }

  let U = Array(nDof).fill(0);
  if (freeDofs.length > 0) {
    const Kff = freeDofs.map((r) => freeDofs.map((c) => K[r][c]));
    const Ff = freeDofs.map((r) => F[r]);
    const Uf = solveLinearSystem(Kff, Ff);
    if (!Uf) {
      issues.push({
        field: 'members',
        message: 'Singular STM truss stiffness matrix — structure is unstable or contains an unrestrained mechanism.',
        severity: 'error',
      });
      return createEnvelope<StrutAndTieResult>(null, issues);
    }
    freeDofs.forEach((dof, k) => {
      U[dof] = Uf[k];
    });
  }

  // Reactions R = K*U - F
  const R = Array(nDof).fill(0);
  for (let r = 0; r < nDof; r++) {
    let ku = 0;
    for (let c = 0; c < nDof; c++) ku += K[r][c] * U[c];
    R[r] = fixedDofs.has(r) ? ku - F[r] : 0;
  }

  // Member axial forces: + Tension, - Compression
  const phiStm = 0.75; // ACI 318-19 Table 21.2.1 / BNBC STM strength reduction factor
  const memberResults: StmMemberResult[] = memberGeoms.map((g) => {
    const uix = U[2 * g.iIdx];
    const uiy = U[2 * g.iIdx + 1];
    const ujx = U[2 * g.jIdx];
    const ujy = U[2 * g.jIdx + 1];
    const deltaAxial = (ujx - uix) * g.c + (ujy - uiy) * g.s;
    const axialForceKn = g.EA_over_L * deltaAxial;

    const role: StmMemberRole =
      axialForceKn < -0.05 ? 'strut' : axialForceKn > 0.05 ? 'tie' : 'zero-force';

    const betaS = g.member.strutBetaS ?? 0.75;
    const strutLimitMpa = phiStm * 0.85 * betaS * concreteFcMpa;
    const tieLimitMpa = phiStm * rebarFyMpa;

    const areaMm2 = Math.max(1, g.member.areaCm2 * 100);
    const stressMpa = (Math.abs(axialForceKn) * 1000) / areaMm2;
    const allowableLimitMpa =
      role === 'tie' ? tieLimitMpa : strutLimitMpa;
    const dcrRatio = allowableLimitMpa > 0 ? stressMpa / allowableLimitMpa : 0;
    const requiredTieSteelMm2 =
      role === 'tie' ? (axialForceKn * 1000) / Math.max(1, phiStm * rebarFyMpa) : 0;

    return {
      memberId: g.member.id,
      label: g.member.label,
      startNodeId: g.member.startNodeId,
      endNodeId: g.member.endNodeId,
      startLabel: nodes[g.iIdx].label,
      endLabel: nodes[g.jIdx].label,
      lengthM: g.L,
      angleDeg: (Math.atan2(g.s, g.c) * 180) / Math.PI,
      cosTheta: g.c,
      sinTheta: g.s,
      axialForceKn,
      role,
      stressMpa,
      allowableLimitMpa,
      dcrRatio,
      requiredTieSteelMm2,
    };
  });

  // Joint-by-joint residual audit
  const nodeResults: StmNodeResult[] = nodes.map((n, idx) => {
    const fxApp = F[2 * idx];
    const fyApp = F[2 * idx + 1];
    const rx = R[2 * idx];
    const ry = R[2 * idx + 1];

    let sumMemberFx = 0;
    let sumMemberFy = 0;
    for (const mr of memberResults) {
      if (mr.startNodeId === n.id) {
        // Member pulls/pushes along +u direction from start node
        sumMemberFx += mr.axialForceKn * mr.cosTheta;
        sumMemberFy += mr.axialForceKn * mr.sinTheta;
      } else if (mr.endNodeId === n.id) {
        sumMemberFx -= mr.axialForceKn * mr.cosTheta;
        sumMemberFy -= mr.axialForceKn * mr.sinTheta;
      }
    }

    return {
      nodeId: n.id,
      label: n.label,
      xM: n.xM,
      yM: n.yM,
      support: n.support,
      uxMm: U[2 * idx] * 1000,
      uyMm: U[2 * idx + 1] * 1000,
      appliedFxKn: fxApp,
      appliedFyKn: fyApp,
      reactionRxKn: rx,
      reactionRyKn: ry,
      sumFxResidualKn: fxApp + rx + sumMemberFx,
      sumFyResidualKn: fyApp + ry + sumMemberFy,
    };
  });

  const totalAppliedFxKn = nodeResults.reduce((s, n) => s + n.appliedFxKn, 0);
  const totalAppliedFyKn = nodeResults.reduce((s, n) => s + n.appliedFyKn, 0);
  const totalReactionRxKn = nodeResults.reduce((s, n) => s + n.reactionRxKn, 0);
  const totalReactionRyKn = nodeResults.reduce((s, n) => s + n.reactionRyKn, 0);

  const sumFx = totalAppliedFxKn + totalReactionRxKn;
  const sumFy = totalAppliedFyKn + totalReactionRyKn;
  const sumMz = nodeResults.reduce(
    (s, n) => s + n.xM * (n.appliedFyKn + n.reactionRyKn) - n.yM * (n.appliedFxKn + n.reactionRxKn),
    0
  );
  const equilibriumResidualKn = Math.hypot(sumFx, sumFy);
  const momentResidualKnm = Math.abs(sumMz);

  const struts = memberResults.filter((m) => m.role === 'strut');
  const ties = memberResults.filter((m) => m.role === 'tie');
  const zeros = memberResults.filter((m) => m.role === 'zero-force');

  const maxCompressionStrutKn = struts.reduce(
    (mx, m) => Math.max(mx, Math.abs(m.axialForceKn)),
    0
  );
  const maxTensionTieKn = ties.reduce((mx, m) => Math.max(mx, m.axialForceKn), 0);
  const totalRequiredTieSteelMm2 = ties.reduce((s, m) => s + m.requiredTieSteelMm2, 0);
  const maxDisplacementMm = nodeResults.reduce(
    (mx, n) => Math.max(mx, Math.hypot(n.uxMm, n.uyMm)),
    0
  );
  const governingDcr = memberResults.reduce((mx, m) => Math.max(mx, m.dcrRatio), 0);
  const status: StrutAndTieResult['status'] =
    governingDcr > 1.0 ? 'critical' : governingDcr > 0.85 ? 'warning' : 'nominal';

  if (governingDcr > 1.0) {
    issues.push({
      field: 'members',
      message: `One or more STM members exceed preliminary design stress capacity (Governing DCR = ${(governingDcr * 100).toFixed(1)}%). Increase member width/tie steel area.`,
      severity: 'warning',
    });
  }

  // Step-by-Step Joint Equilibrium Derivations
  const handCalculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Global Support Reactions & Equilibrium Verification',
      formula: 'ΣFx = 0 ,   ΣFy = 0 ,   ΣM_0 = 0',
      substitution: `ΣFx_app = ${totalAppliedFxKn.toFixed(1)} kN → ΣRx = ${totalReactionRxKn.toFixed(1)} kN | ΣFy_app = ${totalAppliedFyKn.toFixed(1)} kN → ΣRy = ${totalReactionRyKn.toFixed(1)} kN`,
      result: `Global Residual: √(ΣFx² + ΣFy²) = ${equilibriumResidualKn.toExponential(2)} kN, |ΣM_0| = ${momentResidualKnm.toExponential(2)} kN·m`,
      reasoning: `Confirms static equilibrium between applied discontinuity point loads and boundary bearing reactions.`,
      isVerifiedAgainstEngine: equilibriumResidualKn < 1e-2 && momentResidualKnm < 1e-2,
    },
    ...nodeResults.map((nr, idx): CalculationStep => {
      const attached = memberResults.filter(
        (m) => m.startNodeId === nr.nodeId || m.endNodeId === nr.nodeId
      );
      const termsX = attached
        .map((m) => {
          const sign = m.startNodeId === nr.nodeId ? 1 : -1;
          const dirX = sign * m.cosTheta;
          return `${m.label}(${(dirX * m.axialForceKn).toFixed(1)})`;
        })
        .join(' + ');
      const termsY = attached
        .map((m) => {
          const sign = m.startNodeId === nr.nodeId ? 1 : -1;
          const dirY = sign * m.sinTheta;
          return `${m.label}(${(dirY * m.axialForceKn).toFixed(1)})`;
        })
        .join(' + ');

      const jointRes = Math.hypot(nr.sumFxResidualKn, nr.sumFyResidualKn);
      return {
        stepNumber: idx + 2,
        title: `Method of Joints Equilibrium at Node ${nr.label}`,
        formula: `ΣF_x,joint = F_x + R_x + Σ(N_i · cosθ_i) = 0 ,   ΣF_y,joint = F_y + R_y + Σ(N_i · sinθ_i) = 0`,
        substitution: `X: ${(nr.appliedFxKn + nr.reactionRxKn).toFixed(1)} + [${termsX || '0'}] = ${nr.sumFxResidualKn.toFixed(3)} kN | Y: ${(nr.appliedFyKn + nr.reactionRyKn).toFixed(1)} + [${termsY || '0'}] = ${nr.sumFyResidualKn.toFixed(3)} kN`,
        result: `Node (${nr.xM.toFixed(2)}m, ${nr.yM.toFixed(2)}m): R=(${nr.reactionRxKn.toFixed(1)}, ${nr.reactionRyKn.toFixed(1)}) kN · Residual = ${jointRes.toExponential(1)} kN`,
        reasoning: `Resolves concurrent strut compression and tie tension components at node ${nr.label}.`,
        isVerifiedAgainstEngine: jointRes < 1e-2,
      };
    }),
    {
      stepNumber: nodeResults.length + 2,
      title: 'Tie Reinforcement Sizing & Strut Stress Summary',
      formula: 'A_s,tie = F_tie / (φ · f_y)  [φ = 0.75] ,   f_ce = φ · 0.85 · β_s · f\'c',
      substitution: `Max Strut C_max = ${maxCompressionStrutKn.toFixed(1)} kN (${struts.length} struts) | Max Tie T_max = ${maxTensionTieKn.toFixed(1)} kN (${ties.length} ties, f_y = ${rebarFyMpa} MPa)`,
      result: `Total Required Tie Rebar A_s,total = ${totalRequiredTieSteelMm2.toFixed(0)} mm² | Governing Member DCR = ${(governingDcr * 100).toFixed(1)}%`,
      reasoning: `Sizes principal tension ties at φ=0.75 per ACI 318-19 Ch. 23 / BNBC 2020 STM provisions; nodal anchorage sizing remains advisory.`,
      isVerifiedAgainstEngine: true,
    },
  ];

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Partial',
    codeReference: 'Partial (Truss Equilibrium & Member Forces) — ACI 318-19 Ch. 23 / BNBC 2020 Part 6 Ch. 6 STM',
    covered: [
      '2D pin-jointed truss equilibrium solver via Direct Stiffness & Method of Joints verification',
      'Automatic classification into Compression Struts (-), Tension Ties (+), and Zero-Force members',
      'Global reaction and ∑Fx, ∑Fy, ∑M residual balance verification',
      'Preliminary tie rebar area As = Tu/(φ·fy) and nominal strut stress screening',
    ],
    unsupported: [
      'Advisory Only: Detailed CCC / CCT / CTT nodal zone bearing dimensions & confinement checks',
      'Advisory Only: Tension tie hook, 90° bend, or mechanical headed-bar anchorage development length l_d',
      'Out-of-plane 3D pile-cap punching and biaxial strut dispersion',
    ],
  };

  const result: StrutAndTieResult = {
    presetName: params.presetName,
    memberThicknessMm: params.memberThicknessMm,
    concreteFcMpa,
    rebarFyMpa,
    nodeCount: nodes.length,
    memberCount: members.length,
    strutCount: struts.length,
    tieCount: ties.length,
    zeroForceCount: zeros.length,
    totalAppliedFxKn,
    totalAppliedFyKn,
    totalReactionRxKn,
    totalReactionRyKn,
    equilibriumResidualKn,
    momentResidualKnm,
    maxCompressionStrutKn,
    maxTensionTieKn,
    totalRequiredTieSteelMm2,
    maxDisplacementMm,
    governingDcr,
    status,
    nodeResults,
    memberResults,
  };

  return createEnvelope<StrutAndTieResult>(result, issues, {
    handCalculationSteps,
    scopeAndLimits,
  });
}
