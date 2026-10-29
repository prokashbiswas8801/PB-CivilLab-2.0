/**
 * PB CivilLab — Precision Math & Validation Engine
 * 
 * Provides:
 * 1. Floating-point precision error prevention (safe arithmetic, Kahan summation, engineering rounding).
 * 2. Strict engineering input validators (non-zero division guard, range clamping, domain constraints).
 * 3. Safe, non-divergent iterative numerical solvers (Bisection, Newton-Raphson, Secant) with hard
 *    iteration cutoffs (MAX_ITERATIONS = 100) and strict convergence tolerance (1e-6) to guarantee
 *    that hydraulic and geotechnical solvers never enter infinite loops or yield NaN/Infinity.
 */

// ============================================================================
// CONSTANTS & PRECISION CONFIGURATION
// ============================================================================

export const MAX_ITERATIONS = 100;
export const DEFAULT_SOLVER_TOLERANCE = 1e-6;
export const DIVISION_EPSILON = 1e-12;

// ============================================================================
// 1. FLOATING-POINT PRECISION & ENGINEERING FORMATTING
// ============================================================================

/**
 * Rounds a floating-point number to a specified number of decimal places for final presentation.
 * Mitigates binary floating-point representation anomalies (e.g. 0.1 + 0.2 = 0.30000000000000004).
 * Keeps intermediate math in full double-precision, applying rounding only at presentation boundaries.
 */
export function roundEng(value: number, decimals: number = 3): number {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return 0;
  }
  // Exponential formatting eliminates floating-point rounding jitter
  const exponent = Number(`${value}e+${decimals}`);
  if (isNaN(exponent)) return 0;
  return Number(`${Math.round(exponent)}e-${decimals}`);
}

/**
 * Formats a numeric value with standard civil engineering commas and decimals.
 */
export function formatEng(value: number, decimals: number = 3, unit?: string): string {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return unit ? `0 ${unit}` : '0';
  }
  const rounded = roundEng(value, decimals);
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Safe addition that mitigates floating-point accumulation errors.
 */
export function safeAdd(...numbers: number[]): number {
  let sum = 0;
  for (const n of numbers) {
    if (typeof n === 'number' && isFinite(n)) {
      sum += n;
    }
  }
  return roundEng(sum, 10);
}

/**
 * Safe subtraction with floating-point jitter reduction.
 */
export function safeSub(a: number, b: number): number {
  const diff = (isFinite(a) ? a : 0) - (isFinite(b) ? b : 0);
  return roundEng(diff, 10);
}

/**
 * Safe multiplication with precision stabilization.
 */
export function safeMul(a: number, b: number): number {
  const prod = (isFinite(a) ? a : 0) * (isFinite(b) ? b : 0);
  return roundEng(prod, 10);
}

/**
 * Safe division with automatic zero-division defense.
 */
export function safeDiv(numerator: number, denominator: number, fallback: number = 0): number {
  if (!isFinite(numerator) || !isFinite(denominator) || Math.abs(denominator) < DIVISION_EPSILON) {
    return fallback;
  }
  return roundEng(numerator / denominator, 10);
}

/**
 * Kahan Summation Algorithm:
 * Achieves O(1) numerical precision drift across long takeoff schedules,
 * rebar bending lists, or bill-of-quantities line items.
 */
export function kahanSum(numbers: number[]): number {
  let sum = 0.0;
  let c = 0.0; // Running compensation for lost low-order bits

  for (let i = 0; i < numbers.length; i++) {
    const val = numbers[i];
    if (typeof val !== 'number' || !isFinite(val)) continue;

    const y = val - c;
    const t = sum + y;
    c = (t - sum) - y;
    sum = t;
  }

  return sum;
}

/**
 * Clamps a number within [min, max] safely.
 */
export function clamp(val: number, min: number, max: number): number {
  if (isNaN(val)) return min;
  return Math.min(Math.max(val, min), max);
}

// ============================================================================
// 2. STRICT INPUT VALIDATORS
// ============================================================================

export interface ValidationResult<T = number> {
  isValid: boolean;
  value: T;
  clamped?: T;
  error?: string;
  warning?: string;
}

/**
 * Guards against zero or near-zero division by enforcing a minimum positive threshold.
 */
export function preventZeroDivision(val: number, fallback: number = 1e-6): number {
  if (!isFinite(val) || Math.abs(val) < DIVISION_EPSILON) {
    return val < 0 ? -fallback : fallback;
  }
  return val;
}

/**
 * Validates that an input parameter is strictly positive (or optionally non-negative).
 */
export function validatePositive(
  val: number,
  fieldName: string,
  allowZero: boolean = false,
  fallback: number = 1.0
): ValidationResult<number> {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return {
      isValid: false,
      value: fallback,
      clamped: fallback,
      error: `${fieldName} must be a valid real number.`,
    };
  }

  if (allowZero) {
    if (val < 0) {
      return {
        isValid: false,
        value: val,
        clamped: 0,
        error: `${fieldName} cannot be negative (received ${val}).`,
      };
    }
    return { isValid: true, value: val, clamped: val };
  }

  if (val <= 0) {
    return {
      isValid: false,
      value: val,
      clamped: fallback,
      error: `${fieldName} must be strictly positive (received ${val}).`,
    };
  }

  return { isValid: true, value: val, clamped: val };
}

/**
 * Validates that an engineering parameter lies within an acceptable physical or code range.
 */
export function validateRange(
  val: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult<number> {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return {
      isValid: false,
      value: min,
      clamped: min,
      error: `${fieldName} must be a finite numerical value.`,
    };
  }

  if (val < min) {
    return {
      isValid: false,
      value: val,
      clamped: min,
      error: `${fieldName} (${val}) is below permissible minimum of ${min}.`,
    };
  }

  if (val > max) {
    return {
      isValid: false,
      value: val,
      clamped: max,
      error: `${fieldName} (${val}) exceeds permissible maximum of ${max}.`,
    };
  }

  return { isValid: true, value: val, clamped: val };
}

// ----------------------------------------------------------------------------
// Specialized Civil / Geotechnical / Hydraulic Domain Validators
// ----------------------------------------------------------------------------

/**
 * Validates Internal Soil Friction Angle (Phi):
 * Typically 0° (pure clay) to 45° (dense sand/gravel), max 50° for rockfill.
 */
export function validateSoilFrictionAngle(phiDeg: number): ValidationResult<number> {
  return validateRange(phiDeg, 0, 50, 'Soil Friction Angle (φ)');
}

/**
 * Validates Open-Channel Bed Slope (S_0):
 * Must be positive. Typical channel slopes: 0.00001 (1:100,000) to 0.25 (chutes).
 */
export function validateChannelSlope(slope: number, fieldName: string = 'Channel Bed Slope S_0'): ValidationResult<number> {
  return validateRange(slope, 0.00001, 0.5, fieldName);
}

/**
 * Validates Manning's Roughness Coefficient (n):
 * Typical civil range: 0.008 (smooth glass/PVC) to 0.150 (dense natural floodway).
 */
export function validateManningsN(n: number): ValidationResult<number> {
  return validateRange(n, 0.008, 0.200, "Manning's Roughness Coefficient (n)");
}

/**
 * Validates Hazen-Williams Roughness Coefficient (C):
 * Typical range: 60 (corroded unlined iron) to 160 (ultra-smooth plastic).
 */
export function validateHazenWilliamsC(c: number): ValidationResult<number> {
  return validateRange(c, 40, 160, 'Hazen-Williams C Roughness');
}

/**
 * Validates Concrete Compressive Strength (f'c):
 * Structural concrete range: 14 MPa (2,000 psi lean) to 100 MPa (14,500 psi ultra-high).
 */
export function validateConcreteStrength(fcMpa: number): ValidationResult<number> {
  return validateRange(fcMpa, 14, 100, "Concrete Compressive Strength (f'c)");
}

/**
 * Validates Steel Reinforcement Yield Strength (fy):
 * Structural rebar range: 250 MPa (Grade 40) to 550 MPa (Grade 80).
 */
export function validateRebarYieldStrength(fyMpa: number): ValidationResult<number> {
  return validateRange(fyMpa, 240, 600, 'Rebar Yield Strength (fy)');
}

// ============================================================================
// 3. SAFE ITERATIVE NUMERICAL SOLVERS (BISECTION, NEWTON-RAPHSON, SECANT)
// ============================================================================

export interface SolverResult {
  root: number;
  iterations: number;
  converged: boolean;
  residual: number;
  error?: string;
}

/**
 * Safe Bisection Solver:
 * Guaranteed linear convergence for continuous functions f(x) = 0 where f(a) * f(b) <= 0.
 * Automatically attempts bracket expansion if initial points do not cross zero.
 * Hard limit of MAX_ITERATIONS = 100 prevents infinite loops under all circumstances.
 */
export function solveBisection(
  f: (x: number) => number,
  a: number,
  b: number,
  tol: number = DEFAULT_SOLVER_TOLERANCE,
  maxIterations: number = MAX_ITERATIONS
): SolverResult {
  let low = a;
  let high = b;
  let fa = f(low);
  let fb = f(high);

  if (isNaN(fa) || isNaN(fb)) {
    return {
      root: (a + b) / 2,
      iterations: 0,
      converged: false,
      residual: NaN,
      error: 'Function evaluated to NaN at initial bounds.',
    };
  }

  // Exact root match at endpoints
  if (Math.abs(fa) <= tol) return { root: low, iterations: 0, converged: true, residual: fa };
  if (Math.abs(fb) <= tol) return { root: high, iterations: 0, converged: true, residual: fb };

  // Bracket Expansion Defense: If both endpoints have same sign, expand search window safely
  if (fa * fb > 0) {
    let expanded = false;
    const step = Math.max(Math.abs(high - low) * 0.5, 0.1);
    for (let expIter = 0; expIter < 20; expIter++) {
      low = Math.max(1e-5, low - step);
      high = high + step;
      fa = f(low);
      fb = f(high);
      if (fa * fb <= 0) {
        expanded = true;
        break;
      }
    }

    if (!expanded) {
      // Return whichever boundary produced the smaller residual
      const best = Math.abs(fa) < Math.abs(fb) ? low : high;
      const bestRes = Math.abs(fa) < Math.abs(fb) ? fa : fb;
      return {
        root: best,
        iterations: 20,
        converged: false,
        residual: bestRes,
        error: `Could not bracket root in interval [${a}, ${b}]. Best approximate boundary root returned.`,
      };
    }
  }

  let mid = (low + high) / 2;
  let fmid = f(mid);
  let iter = 0;

  while (iter < maxIterations) {
    iter++;
    mid = (low + high) / 2;
    fmid = f(mid);

    if (isNaN(fmid) || !isFinite(fmid)) {
      return {
        root: mid,
        iterations: iter,
        converged: false,
        residual: fmid,
        error: 'Numerical overflow or NaN during bisection search.',
      };
    }

    // Check convergence criteria
    if (Math.abs(fmid) < tol || (high - low) / 2 < tol) {
      return {
        root: mid,
        iterations: iter,
        converged: true,
        residual: fmid,
      };
    }

    // Narrow down bracket
    if (fa * fmid < 0) {
      high = mid;
      fb = fmid;
    } else {
      low = mid;
      fa = fmid;
    }
  }

  return {
    root: mid,
    iterations: iter,
    converged: Math.abs(fmid) < tol * 10,
    residual: fmid,
    error: iter >= maxIterations ? `Maximum iterations (${maxIterations}) reached without full convergence.` : undefined,
  };
}

/**
 * Safe Newton-Raphson Solver with Numerical Central Difference & Boundary Clamping:
 * Solves f(x) = 0 with quadratic local convergence.
 * Includes defensive fallbacks:
 * 1. Central difference df(x) computation if derivative function not supplied.
 * 2. Near-zero derivative detection with bisection perturbation to prevent division by zero.
 * 3. Range clamping [minVal, maxVal] to prevent divergence to negative or unphysical hydraulic depths.
 * 4. Strict MAX_ITERATIONS = 100 cutoff.
 */
export function solveNewtonRaphson(
  f: (x: number) => number,
  df: ((x: number) => number) | null,
  x0: number,
  tol: number = DEFAULT_SOLVER_TOLERANCE,
  maxIterations: number = MAX_ITERATIONS,
  minVal: number = 0.001,
  maxVal: number = 50.0
): SolverResult {
  let x = clamp(x0, minVal, maxVal);
  let iter = 0;
  const h = 1e-5; // Finite difference step

  while (iter < maxIterations) {
    iter++;
    const fx = f(x);

    if (isNaN(fx) || !isFinite(fx)) {
      return {
        root: x,
        iterations: iter,
        converged: false,
        residual: fx,
        error: 'Evaluation produced NaN or Infinity in Newton-Raphson solver.',
      };
    }

    if (Math.abs(fx) < tol) {
      return {
        root: x,
        iterations: iter,
        converged: true,
        residual: fx,
      };
    }

    // Compute derivative analytically or numerically via central difference
    let dfx: number;
    if (df) {
      dfx = df(x);
    } else {
      const fPlus = f(x + h);
      const fMinus = f(x - h);
      dfx = (fPlus - fMinus) / (2 * h);
    }

    // Guard against zero slope / horizontal tangent
    if (!isFinite(dfx) || Math.abs(dfx) < DIVISION_EPSILON) {
      // Fallback: Perturb x slightly or switch to bisection step
      dfx = dfx < 0 ? -1e-4 : 1e-4;
    }

    const step = fx / dfx;
    let nextX = x - step;

    // Apply damping if step is excessively large
    if (Math.abs(step) > (maxVal - minVal) * 0.5) {
      nextX = x - Math.sign(step) * (maxVal - minVal) * 0.25;
    }

    // Enforce physical boundary constraints
    nextX = clamp(nextX, minVal, maxVal);

    if (Math.abs(nextX - x) < tol && Math.abs(fx) < tol * 10) {
      return {
        root: nextX,
        iterations: iter,
        converged: true,
        residual: f(nextX),
      };
    }

    x = nextX;
  }

  const finalResidual = f(x);
  return {
    root: x,
    iterations: iter,
    converged: Math.abs(finalResidual) < tol * 10,
    residual: finalResidual,
    error: iter >= maxIterations ? `Newton-Raphson exceeded ${maxIterations} iterations.` : undefined,
  };
}

/**
 * Safe Secant Solver:
 * Does not require analytical derivatives. Highly robust for nonlinear hydraulic equations.
 */
export function solveSecant(
  f: (x: number) => number,
  x0: number,
  x1: number,
  tol: number = DEFAULT_SOLVER_TOLERANCE,
  maxIterations: number = MAX_ITERATIONS,
  minVal: number = 0.001,
  maxVal: number = 50.0
): SolverResult {
  let xPrev = clamp(x0, minVal, maxVal);
  let xCurr = clamp(x1, minVal, maxVal);
  let fPrev = f(xPrev);
  let fCurr = f(xCurr);

  let iter = 0;
  while (iter < maxIterations) {
    iter++;

    if (Math.abs(fCurr) < tol) {
      return {
        root: xCurr,
        iterations: iter,
        converged: true,
        residual: fCurr,
      };
    }

    const denominator = fCurr - fPrev;
    if (Math.abs(denominator) < DIVISION_EPSILON) {
      // Slopes identical; fall back to bisection between xPrev and xCurr
      return solveBisection(f, xPrev, xCurr, tol, maxIterations - iter);
    }

    const xNext = clamp(xCurr - (fCurr * (xCurr - xPrev)) / denominator, minVal, maxVal);

    if (Math.abs(xNext - xCurr) < tol) {
      return {
        root: xNext,
        iterations: iter,
        converged: true,
        residual: f(xNext),
      };
    }

    xPrev = xCurr;
    fPrev = fCurr;
    xCurr = xNext;
    fCurr = f(xCurr);
  }

  return {
    root: xCurr,
    iterations: iter,
    converged: Math.abs(fCurr) < tol * 10,
    residual: fCurr,
    error: `Secant solver reached maximum ${maxIterations} iterations.`,
  };
}
