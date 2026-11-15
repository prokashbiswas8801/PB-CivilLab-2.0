import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import {
  ChecklistItemStatus,
  LabEvaluationMetric,
  LabEvaluationOutput,
  LabTestDefinition,
  TestingLabVerdict,
} from '../types/testingLab';
import { TESTING_LAB_TEST_MAP } from '../data/testingLabCatalog';
import { CivilWorkspace, UserProfile } from '../types/civil';
import { sanitizeEngineeringSymbols } from './exportEngine';
import { generateSubmittalDocRef } from './qrCode';
import { createVerifiedReportRecord, saveVerifiedReport } from './verificationEngine';
import { BRAND_LOGO_BASE64 } from '../assets/brandLogoData';
import { BRAND_LOGO_SRC } from '../components/Logo';

export function getDefaultInputsForTest(test: LabTestDefinition): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const field of test.calculatorInputs) {
    defaults[field.key] = field.defaultValue;
  }
  return defaults;
}

export function getDefaultChecklistStates(
  test: LabTestDefinition
): Record<string, ChecklistItemStatus> {
  const states: Record<string, ChecklistItemStatus> = {};
  if (test.checklistItems) {
    for (const item of test.checklistItems) {
      states[item.id] = 'PASS';
    }
  }
  return states;
}

function num(val: number | undefined, fallback: number): number {
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

function fmt(n: number, decimals = 2): string {
  return Number.isFinite(n) ? n.toFixed(decimals) : '0.00';
}

export function formatLabFieldValue(
  field: LabTestDefinition['calculatorInputs'][number],
  rawVal: number | undefined
): string {
  const val = rawVal ?? field.defaultValue;
  if (field.options && field.options.length > 0) {
    const matched = field.options.find((opt) => opt.value === val);
    if (matched) return matched.label.en;
  }
  return `${val}${field.unit ? ` ${field.unit}` : ''}`.trim();
}

export function evaluateLabTest(
  testId: string,
  rawInputs: Record<string, number>,
  checklistStates?: Record<string, ChecklistItemStatus>
): LabEvaluationOutput {
  const test = TESTING_LAB_TEST_MAP[testId];
  const inputs = test ? { ...getDefaultInputsForTest(test), ...rawInputs } : rawInputs;

  switch (testId) {
    // =======================================================================
    // CATEGORY 1: CEMENT QUALITY TESTS (10 TESTS — 5 FIELD + 5 LAB)
    // =======================================================================

    // 1.1 FIELD CHECK 1: PHYSICAL LUMPS & BAG WEIGHT AUDIT
    case 'cem-field-lumps': {
      const avgWt = num(inputs.avgBagWeightKg, 49.7);
      const sampleG = Math.max(1, num(inputs.sampleMassG, 1000));
      const lumpG = Math.max(0, num(inputs.hardLumpMassG, 10));

      const deficitPct = ((50.0 - avgWt) / 50.0) * 100;
      const lumpPct = (lumpG / sampleG) * 100;

      let verdict: TestingLabVerdict = 'PASS';
      if (avgWt < 49.0 || lumpPct > 5.0) verdict = 'FAIL';
      else if (avgWt < 49.5 || lumpPct > 2.0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Hard Lump % & Avg Bag Weight', bn: 'শক্ত দলার হার ও গড় ওজন' },
        primaryValue: `${fmt(lumpPct, 2)}% Lump | ${fmt(avgWt, 2)} kg`,
        primaryUnit: '',
        codeLimitText: 'Bag Weight ≥ 49.5 kg (±1%) | Hard Lumps ≤ 2.0%',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — FREE-FLOWING FULL-WEIGHT CEMENT', bn: 'পাস — দলামুক্ত ও সঠিক ওজনের সিমেন্ট' }
            : verdict === 'WARNING'
            ? { en: 'MARGINAL — SCREEN LUMPS & LAB RETEST', bn: 'সতর্কতা — চালনি দিয়ে দলা ফেলুন ও ল্যাব টেস্ট করুন' }
            : { en: 'REJECT DELIVERY — EXCESS LUMPS OR UNDERWEIGHT', bn: 'ফেল — অতিরিক্ত শক্ত দলা বা কম ওজন, ট্রাক ফেরত দিন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Average weight ${fmt(avgWt, 2)} kg (deficit ${fmt(deficitPct, 2)}%) meets BSTI ±1% limit and hard lumps ${fmt(lumpPct, 2)}% ≤ 2.0%.`, bn: `ব্যাগের গড় ওজন ${fmt(avgWt, 2)} কেজি (ঘাটতি ${fmt(deficitPct, 2)}%) ও শক্ত দলা ${fmt(lumpPct, 2)}% (≤ ২%) অনুমোদিত সীমায় আছে।` }
            : verdict === 'WARNING'
            ? { en: `Weight ${fmt(avgWt, 2)} kg (49.0–49.49 kg) or lumps ${fmt(lumpPct, 2)}% (2.1–5.0%) is borderline. Screen lumps via 1.18 mm sieve and verify mortar strength.`, bn: `ওজন (${fmt(avgWt, 2)} কেজি) বা দলা (${fmt(lumpPct, 2)}%) সীমান্তবর্তী—১.১৮ মিমি চালনিতে চেলে মর্টার টেস্ট ছাড়া আরসিসিতে দেবেন না।` }
            : { en: `Severe defect: Weight < 49.0 kg (${fmt(avgWt, 2)} kg) or Hard Lumps > 5.0% (${fmt(lumpPct, 2)}%). Reject shipment immediately.`, bn: `মারাত্মক ত্রুটি: ওজন ৪৯.০ কেজির কম বা শক্ত দলা ৫%-এর বেশি (${fmt(lumpPct, 2)}%)—আনলোড না করে ফেরত পাঠান।` },
        metrics: [
          { labelEn: 'Average Bag Weight', labelBn: 'ব্যাগের গড় ওজন', value: fmt(avgWt, 2), unit: 'kg', highlight: true },
          { labelEn: 'Weight Deficit vs 50 kg', labelBn: 'ওজন ঘাটতি (%)', value: fmt(deficitPct, 2), unit: '%' },
          { labelEn: 'Hard Uncrushable Lumps', labelBn: 'শক্ত দলার হার', value: fmt(lumpPct, 2), unit: '%', highlight: true },
          { labelEn: 'Passable Fine Cement', labelBn: 'সচল মিহি সিমেন্ট', value: fmt(Math.max(0, 100 - lumpPct), 2), unit: '%' },
        ],
        steps: [
          `1. Weight Deficit = ((50.00 - ${fmt(avgWt, 2)}) / 50.00) × 100 = ${fmt(deficitPct, 2)}% (BSTI ≥ 49.50 kg)`,
          `2. Hard Lump % = (${fmt(lumpG, 1)} / ${fmt(sampleG, 0)}) × 100 = ${fmt(lumpPct, 2)}% (Allowed ≤ 2.0%)`,
        ],
      };
    }

    // 1.2 FIELD CHECK 2: COLOR, BAG TEMP & FINGER-RUBBING SMOOTHNESS
    case 'cem-field-color-rub': {
      const colorCode = Math.round(num(inputs.colorCode, 1));
      const rubCode = Math.round(num(inputs.rubCode, 1));
      const tempC = num(inputs.bagCoreTempC, 29);

      let verdict: TestingLabVerdict = 'PASS';
      if (colorCode >= 3 || rubCode >= 3 || tempC > 45) verdict = 'FAIL';
      else if (colorCode === 2 || rubCode === 2 || tempC > 38) verdict = 'WARNING';

      const colorText = colorCode === 1 ? 'Uniform Greenish-Grey' : colorCode === 2 ? 'Slightly Pale Grey' : 'Streaky / Yellowish';
      const rubText = rubCode === 1 ? 'Silky Smooth' : rubCode === 2 ? 'Trace Fine Grains' : 'Gritty / Sandy';

      return {
        testId,
        primaryMetricLabel: { en: 'Visual Color, Smoothness & Temp', bn: 'রঙ, মসৃণতা ও তাপমাত্রা' },
        primaryValue: `${rubText} | ${fmt(tempC, 1)}°C`,
        primaryUnit: '',
        codeLimitText: 'Uniform Greenish-Grey | Silky Smooth | Bag Temp ≤ 38°C',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — PURE UNADULTERATED CEMENT', bn: 'পাস — খাঁটি ও ভেজালমুক্ত সিমেন্ট' }
            : verdict === 'WARNING'
            ? { en: 'HOLD — CHECK COOLING OR RUN 90µm SIEVE', bn: 'সতর্কতা — ৪৮ ঘণ্টা ঠান্ডা করুন বা ৯০µm চালনি পরীক্ষা করুন' }
            : { en: 'ADULTERATED OR HYDRATING — REJECT / LAB TEST', bn: 'ফেল — পাথরের গুঁড়া ভেজাল বা ভেতরে গরম হয়ে নষ্ট সিমেন্ট' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `${colorText}, ${rubText} finger rub, and cool core temp ${fmt(tempC, 1)}°C (≤ 38°C) confirm clean Portland clinker.`, bn: `রঙ ও স্পর্শ সম্পূর্ণ মসৃণ এবং ভেতরের তাপমাত্রা ${fmt(tempC, 1)}°সে. (≤ ৩৮°সে.)—খাঁটি সিমেন্টের প্রমাণ।` }
            : verdict === 'WARNING'
            ? { en: `Mildly pale tone, trace grit, or elevated core temperature (${fmt(tempC, 1)}°C). Cool mill-hot cement 48 h or verify 90 µm sieve residue.`, bn: `রঙ সামান্য ফ্যাকাশে, হালকা দানা বা তাপমাত্রা ৩৯–৪৫°সে.—৯০ মাইক্রন চালনি দিয়ে যাচাই করুন।` }
            : { en: `Gritty sand feel, blotchy color, or bag temperature > 45°C (${fmt(tempC, 1)}°C) indicates filler adulteration or active pre-hydration.`, bn: `আঙুলে বালির মতো খসখসে, ছোপ ছোপ রঙ বা তাপ >৪৫°সে.—ভেজাল বা নষ্ট সিমেন্ট, বাতিল করুন।` },
        metrics: [
          { labelEn: 'Color Inspection', labelBn: 'রঙ পর্যবেক্ষণ', value: colorText, unit: '', highlight: true },
          { labelEn: 'Finger-Rub Texture', labelBn: 'আঙুলে ঘষা মসৃণতা', value: rubText, unit: '', highlight: true },
          { labelEn: 'Bag Core Temperature', labelBn: 'ব্যাগের ভেতরের তাপমাত্রা', value: fmt(tempC, 1), unit: '°C' },
        ],
        steps: [
          `1. Color Grade = Code ${colorCode} (${colorText})`,
          `2. Rubbing Smoothness = Code ${rubCode} (${rubText})`,
          `3. Bag Core Temp = ${fmt(tempC, 1)}°C (Cool ≤ 38°C; Mill-Hot Warning 39–45°C; Critical > 45°C).`,
        ],
      };
    }

    // 1.3 FIELD CHECK 3: WATER FLOAT & SETTLING TEST
    case 'cem-field-float': {
      const tFloat = Math.max(0, num(inputs.floatTimeSec, 6));
      const scumCode = Math.round(num(inputs.scumCode, 1));

      let verdict: TestingLabVerdict = 'PASS';
      if (tFloat === 0 || tFloat > 30 || scumCode >= 3) verdict = 'FAIL';
      else if (tFloat < 3 || tFloat > 15 || scumCode === 2) verdict = 'WARNING';

      const scumLabel = scumCode === 1 ? 'Clean Water (All Sunk)' : scumCode === 2 ? 'Slight Grey Film (PCC)' : 'Heavy White Chalk Scum';

      return {
        testId,
        primaryMetricLabel: { en: 'Float Duration & Surface Residue', bn: 'ভাসা সময় ও পানির উপরের অবস্থা' },
        primaryValue: `${fmt(tFloat, 1)} sec | ${scumCode === 1 ? 'Clean' : scumCode === 2 ? 'Trace Film' : 'Chalk Scum'}`,
        primaryUnit: '',
        codeLimitText: 'Float 3–15 sec before sinking | Zero Floating White Scum',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — TRUE PORTLAND DENSITY PASS', bn: 'পাস — খাঁটি সিমেন্টের আদর্শ ঘনত্ব প্রমাণিত' }
            : verdict === 'WARNING'
            ? { en: 'MARGINAL — CHECK PCC BLEND / 90µm SIEVE', bn: 'সতর্কতা — PCC সিমেন্ট হলে গ্রেড ও চালনি মিলিয়ে নিন' }
            : { en: 'ADULTERATED OR PRE-HYDRATED — QUARANTINE LOT', bn: 'ফেল — চক পাউডার/ছাই ভেজাল বা আর্দ্রতায় ভারী সিমেন্ট' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Particles floated ${fmt(tFloat, 1)} s (3–15 s band) then settled completely with crystal-clear surface water (SG ≈ 3.15).`, bn: `সিমেন্ট ${fmt(tFloat, 1)} সেকেন্ড ভেসে থাকার পর সম্পূর্ণ নিচে থিতিয়ে গেছে—পানির ওপরে কোনো ভেজাল ভাসেনি।` }
            : verdict === 'WARNING'
            ? { en: `Rapid 1–2 s drop or light grey film (common in fly-ash/slag PCC CEM-II). Verify bag grade & run sieve test.`, bn: `দ্রুত (১–২ সে.) ডুবে গেছে বা PCC-র সামান্য ধূসর আস্তরণ—৯০ মাইক্রন ফাইননেস পরীক্ষা করুন।` }
            : { en: `Instant stone-like drop (0 s) or persistent chalk/lime scum (> 30 s). Suspect adulteration or stale hydration.`, bn: `০ সেকেন্ডেই পাথরের মতো ডুবে গেছে অথবা >৩০ সেকেন্ড সাদা চকের স্তর ভেসে আছে—লট স্থগিত করুন।` },
        metrics: [
          { labelEn: 'Initial Float Duration', labelBn: 'পানিতে ভাসা সময়', value: fmt(tFloat, 1), unit: 'sec', highlight: true },
          { labelEn: '30-Sec Surface Status', labelBn: '৩০ সেকেন্ড পর উপরের অবস্থা', value: scumLabel, unit: '', highlight: true },
        ],
        steps: [
          `1. Initial Float Duration = ${fmt(tFloat, 1)} s (Ideal OPC/PCC band: 3.0–15.0 s)`,
          `2. Surface Residue Check @ 30 s = ${scumLabel}.`,
        ],
      };
    }

    // 1.4 FIELD CHECK 4: GLASS PLATE PASTE SETTING & CRACK TEST
    case 'cem-field-glass-plate': {
      const hardCode = Math.round(num(inputs.hardnessCode, 1));
      const crackCode = Math.round(num(inputs.crackCode, 1));

      let verdict: TestingLabVerdict = 'PASS';
      if (hardCode >= 3 || crackCode >= 3) verdict = 'FAIL';
      else if (hardCode === 2 || crackCode === 2) verdict = 'WARNING';

      const hardLabel = hardCode === 1 ? 'Rock Hard (No Dent)' : hardCode === 2 ? 'Firm / Scratches' : 'Soft / Crumbles';
      const crackLabel = crackCode === 1 ? 'Zero Cracks, Flat' : crackCode === 2 ? 'Hairline Edge' : 'Warped / Radial Cracks';

      return {
        testId,
        primaryMetricLabel: { en: '24-Hr Paste Hardness & Soundness', bn: '২৪-ঘণ্টা পেস্ট দৃঢ়তা ও ফাটল' },
        primaryValue: `${hardLabel} | ${crackLabel}`,
        primaryUnit: '',
        codeLimitText: 'Hardened at 24h Underwater | Zero Cracks or Warping',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — SOUND HYDRAULIC SETTING PASS', bn: 'পাস — সিমেন্ট নিখুঁতভাবে শক্ত ও স্থিতিশীল হয়েছে' }
            : verdict === 'WARNING'
            ? { en: 'VERIFY VICAT & LE-CHATELIER SOUNDNESS', bn: 'সতর্কতা — ভিক্যাট সেটিং ও সাউন্ডনেস টেস্টে নিশ্চিত হোন' }
            : { en: 'DEAD CEMENT OR UNSOUND EXPANSION — REJECT', bn: 'ফেল — মেয়াদোত্তীর্ণ নরম সিমেন্ট বা প্রসারণ ফাটল, বাতিল করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: '24-hour submerged cement pat cured rock-hard with zero curling or cracking—hydraulically active and sound.', bn: '২৪ ঘণ্টা পানিতে থাকার পরও পেস্ট পাথরের মতো শক্ত ও ফাটলমুক্ত রয়েছে।' }
            : verdict === 'WARNING'
            ? { en: 'Slightly slow edge hardening or hairline marks (can occur in blended PCC at 24 h); confirm via Vicat & Le-Chatelier tests.', bn: 'সামান্য নরম বা কিনারায় সূক্ষ্ম দাগ—PCC হলে ভিক্যাট ও সাউন্ডনেস টেস্ট দিয়ে নিশ্চিত হোন।' }
            : { en: 'Submerged cake remained soft/crumbly (dead cement) or curled/cracked radially (unsound excess free lime). Do NOT pour RCC.', bn: '২৪ ঘণ্টাতেও নরম কাদার মতো ভেঙে গেছে বা বেঁকে ফেটে গেছে—আরসিসি ঢালাইয়ে সম্পূর্ণ নিষিদ্ধ।' },
        metrics: [
          { labelEn: '24-Hr Pat Hardness', labelBn: '২৪-ঘণ্টা দৃঢ়তা', value: hardLabel, unit: '', highlight: true },
          { labelEn: 'Warping & Crack Check', labelBn: 'বাঁক ও ফাটল অবস্থা', value: crackLabel, unit: '', highlight: true },
        ],
        steps: [
          `1. Submerged 24-Hr Nail Test = ${hardLabel}`,
          `2. Glass Plate Adhesion & Distortion = ${crackLabel}.`,
        ],
      };
    }

    // 1.5 FIELD CHECK 5: DATE OF PACKING & STORAGE STRENGTH REDUCTION
    case 'cem-field-packing-storage': {
      const ageDays = Math.max(0, num(inputs.storageAgeDays, 35));
      const ratedGrade = Math.max(20, num(inputs.ratedGradeMpa, 42.5));

      // Piecewise strength loss curve matching BNBC / PCA / PWD engineering reference:
      // 0d=0%, 30d=2%, 90d=20%, 180d=30%, 365d=40%, 730d=50%
      let lossPct = 0;
      if (ageDays <= 30) {
        lossPct = (ageDays / 30) * 2.0;
      } else if (ageDays <= 90) {
        lossPct = 2.0 + ((ageDays - 30) / 60) * 18.0;
      } else if (ageDays <= 180) {
        lossPct = 20.0 + ((ageDays - 90) / 90) * 10.0;
      } else if (ageDays <= 365) {
        lossPct = 30.0 + ((ageDays - 180) / 185) * 10.0;
      } else {
        lossPct = Math.min(55, 40.0 + ((ageDays - 365) / 365) * 10.0);
      }
      const retainedPct = Math.max(0, 100 - lossPct);
      const estMpa = ratedGrade * (retainedPct / 100);
      const ageMonths = ageDays / 30;

      let verdict: TestingLabVerdict = 'PASS';
      if (ageDays > 90) verdict = 'FAIL';
      else if (ageDays > 60) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Estimated Storage Strength Loss & Status', bn: 'মজুদে সম্ভাব্য শক্তি হ্রাস ও অবস্থা' },
        primaryValue: `-${fmt(lossPct, 1)}% Loss (~${fmt(estMpa, 1)} MPa left)`,
        primaryUnit: '',
        codeLimitText: 'Optimal ≤ 60d | FIFO Max ≤ 90d (3m ≈ -20%, 6m ≈ -30%, 12m ≈ -40%)',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — FRESH MILL STOCK (≤ 60 DAYS)', bn: 'পাস — সতেজ উৎপাদন ব্যাচ (≤ ৬০ দিন)' }
            : verdict === 'WARNING'
            ? { en: 'APPROACHING 3-MONTH LIMIT — CONSUME FIRST', bn: 'সতর্কতা — ৩ মাসের সীমার কাছাকাছি, আগে ব্যবহার করুন' }
            : { en: 'EXPIRED (> 90 DAYS) — MANDATORY ASTM C109 RETEST', bn: 'ফেল (> ৯০ দিন) — ল্যাবে মর্টার টেস্ট ছাড়া আরসিসি নিষেধ' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Age ${ageDays} days (${fmt(ageMonths, 1)} months) retains ~${fmt(retainedPct, 1)}% rated strength (~${fmt(estMpa, 1)} MPa). Safe for direct RCC.`, bn: `উৎপাদনের পর ${ageDays} দিন (${fmt(ageMonths, 1)} মাস)—শক্তি হ্রাস মাত্র ~${fmt(lossPct, 1)}%, সরাসরি আরসিসিতে ব্যবহারযোগ্য।` }
            : verdict === 'WARNING'
            ? { en: `Age ${ageDays} days carries ~${fmt(lossPct, 1)}% storage degradation. Prioritize immediate FIFO use if 100% lump-free.`, bn: `বয়স ${ageDays} দিন (শক্তি হ্রাস ~${fmt(lossPct, 1)}%)—দলামুক্ত থাকলে অগ্রাধিকার ভিত্তিতে দ্রুত ব্যবহার করুন।` }
            : { en: `Stored ${ageDays} days (> 3 months cutoff; est. ${fmt(lossPct, 1)}% strength drop to ~${fmt(estMpa, 1)} MPa). Must pass ASTM C109 mortar retest before RCC.`, bn: `${ageDays} দিন পুরনো (>৩ মাস)—প্রায় ${fmt(lossPct, 1)}% শক্তি কমেছে! ল্যাবে কম্প্রেসিভ টেস্ট পাস ছাড়া ঢালাই নিষেধ।` },
        metrics: [
          { labelEn: 'Elapsed Shelf Age', labelBn: 'মজুদ বয়স', value: `${fmt(ageDays, 0)} d (${fmt(ageMonths, 1)} m)`, unit: '', highlight: true },
          { labelEn: 'Est. Strength Reduction', labelBn: 'সম্ভাব্য শক্তি হ্রাস', value: fmt(lossPct, 1), unit: '%', highlight: true },
          { labelEn: 'Est. Retained 28d Strength', labelBn: 'অবশিষ্ট আনুমানিক শক্তি', value: fmt(estMpa, 1), unit: 'MPa' },
          { labelEn: 'Retained Potency', labelBn: 'অবশিষ্ট কার্যকারিতা', value: fmt(retainedPct, 1), unit: '%' },
        ],
        steps: [
          `1. Storage Age = ${ageDays} days (${fmt(ageMonths, 2)} months since packing date)`,
          `2. Interpolated Moisture Loss = ${fmt(lossPct, 1)}% (Curve: 3m=20%, 6m=30%, 12m=40%, 24m=50%)`,
          `3. Estimated Effective 28d Strength = ${ratedGrade} × ${fmt(retainedPct / 100, 3)} = ${fmt(estMpa, 1)} MPa (BNBC/IS retest limit: 90d).`,
        ],
      };
    }

    // 1.6 LAB TEST 6: FINENESS OF CEMENT BY 90-MICRON SIEVE
    case 'cem-fineness-sieve': {
      const w1 = Math.max(1, num(inputs.totalMassG, 100));
      const w2 = Math.max(0, num(inputs.retainedMassG, 4.5));
      const residuePct = (w2 / w1) * 100;

      let verdict: TestingLabVerdict = 'PASS';
      if (residuePct > 10.0) verdict = 'FAIL';
      else if (residuePct > 8.0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: '90-Micron Sieve Residue (R)', bn: '৯০-মাইক্রন চালনিতে অবশেষ (R)' },
        primaryValue: fmt(residuePct, 2),
        primaryUnit: '%',
        codeLimitText: 'OPC Pass ≤ 10.0% (Optimal ≤ 8.0%) | > 10.0% Reject',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — FINE UNIFORM GRINDING', bn: 'পাস — আদর্শ সূক্ষ্ম ও মিহি সিমেন্ট' }
            : verdict === 'WARNING'
            ? { en: 'UPPER FINENESS MARGIN (8–10%) — VERIFY STRENGTH', bn: 'সতর্কতা — ৮–১০% সীমায়, মর্টার শক্তি যাচাই করুন' }
            : { en: 'TOO COARSE (> 10%) — REJECT CEMENT LOT', bn: 'ফেল (> ১০%) — মোটা দানা বা ভেজাল, লট বাতিল করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Residue R = ${fmt(residuePct, 2)}% (≤ 10% limit)—high specific surface area promotes clean hydration.`, bn: `অবশেষ ${fmt(residuePct, 2)}% (≤ ১০% সীমা)—সিমেন্ট যথেষ্ট মিহি ও দ্রুত শক্তি অর্জনে সক্ষম।` }
            : verdict === 'WARNING'
            ? { en: `Residue ${fmt(residuePct, 2)}% sits near the 10% limit; run mortar strength cube test to ensure 7-day gain.`, bn: `অবশেষ ${fmt(residuePct, 2)}% সর্বোচ্চ ১০% সীমার কাছাকাছি—৭ দিনের মর্টার স্ট্রেন্থ দেখে নিশ্চিত হোন।` }
            : { en: `Residue ${fmt(residuePct, 2)}% exceeds 10% OPC maximum—coarse unground grains or stone dust adulteration.`, bn: `অবশেষ ১০%-এর বেশি (${fmt(residuePct, 2)}%)—কম শক্তি ও বেশি ব্লিডিং ঘটাবে; চালান বাতিল করুন।` },
        metrics: [
          { labelEn: '90µm Residue (R)', labelBn: '৯০µm অবশেষ হার', value: fmt(residuePct, 2), unit: '%', highlight: true },
          { labelEn: 'Passing Fines (< 90µm)', labelBn: '৯০µm পার হওয়া মিহি অংশ', value: fmt(Math.max(0, 100 - residuePct), 2), unit: '%' },
        ],
        steps: [
          `1. Residue R(%) = (W₂ / W₁) × 100 = (${fmt(w2, 2)} / ${fmt(w1, 1)}) × 100 = ${fmt(residuePct, 2)}%`,
          `2. Code Check: ${fmt(residuePct, 2)}% vs 10.0% Max Ceiling (IS 269 / ASTM C430).`,
        ],
      };
    }

    // 1.7 LAB TEST 7: NORMAL CONSISTENCY OF CEMENT (VICAT)
    case 'cem-normal-consistency': {
      const cemG = Math.max(1, num(inputs.cementMassG, 400));
      const waterMl = Math.max(0, num(inputs.waterAddedMl, 116));
      const bottomClear = Math.max(0, Math.min(40, num(inputs.bottomClearanceMm, 6.0)));

      const pPct = (waterMl / cemG) * 100;
      const topPen = 40 - bottomClear;
      const validPen = bottomClear >= 5.0 && bottomClear <= 7.0;

      let verdict: TestingLabVerdict = 'PASS';
      if (pPct < 24.0 || pPct > 35.0) verdict = 'FAIL';
      else if (!validPen || pPct < 26.0 || pPct > 33.0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Normal Consistency (P)', bn: 'নরমাল কনসিস্টেন্সি (P)' },
        primaryValue: `${fmt(pPct, 1)}% (${fmt(bottomClear, 1)} mm bottom)`,
        primaryUnit: '',
        codeLimitText: 'Standard P = 26%–33% at 5–7 mm Bottom Clearance (33–35 mm Top)',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — STANDARD CONSISTENCY CONVERGED', bn: 'পাস — আদর্শ কনসিস্টেন্সি ও পেনিট্রেশন অর্জিত' }
            : verdict === 'WARNING'
            ? { en: validPen ? 'BORDERLINE WATER DEMAND (USE ADMIXTURE IN MIX)' : 'ADJUST TRIAL WATER TO HIT 5–7 mm BOTTOM', bn: validPen ? 'সতর্কতা — পানির চাহিদা সীমান্তবর্তী' : 'সতর্কতা — ৫–৭ মিমি পেনিট্রেশনের জন্য পানি বদলে ট্রায়াল দিন' }
            : { en: 'ABNORMAL WATER DEMAND — RETEST / VERIFY CEMENT', bn: 'ফেল — অস্বাভাবিক পানির চাহিদা, ভেজাল/ক্ষতিগ্রস্ত সিমেন্ট' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `P = ${fmt(pPct, 1)}% with ${fmt(bottomClear, 1)} mm bottom clearance (${fmt(topPen, 1)} mm penetration) hits ASTM C187 / IS 4031 target cleanly.`, bn: `কনসিস্টেন্সি P = ${fmt(pPct, 1)}% এবং তলা থেকে দূরত্ব ${fmt(bottomClear, 1)} মিমি (৫–৭ মিমি সীমা)—ভিক্যাট পরীক্ষায় উত্তীর্ণ।` }
            : verdict === 'WARNING'
            ? { en: validPen ? `Plunger converged at ${fmt(bottomClear, 1)} mm, but P = ${fmt(pPct, 1)}% sits outside typical 26–33% band.` : `Reading ${fmt(bottomClear, 1)} mm is outside 5–7 mm target! ${bottomClear > 7 ? 'Increase water slightly' : 'Reduce water slightly'} in next trial.`, bn: validPen ? `প্লাঞ্জার ৫–৭ মিমি হলেও P = ${fmt(pPct, 1)}% আদর্শ ২৬–৩৩% সীমার বাইরে।` : `তলা থেকে দূরত্ব ${fmt(bottomClear, 1)} মিমি (টার্গেট ৫–৭ মিমি)—পরের ট্রায়ালে পানি ${bottomClear > 7 ? 'বাড়ান' : 'কমান'}।` }
            : { en: `Extreme P = ${fmt(pPct, 1)}% (< 24% or > 35%) indicates severe filler adulteration or pre-hydration.`, bn: `অস্বাভাবিক P = ${fmt(pPct, 1)}% (<২৪% বা >৩৫%)—মর্টার কিউব টেস্ট ছাড়া ব্যবহার করবেন না।` },
        metrics: [
          { labelEn: 'Consistency Water (P)', labelBn: 'নরমাল কনসিস্টেন্সি (P)', value: fmt(pPct, 1), unit: '%', highlight: true },
          { labelEn: 'Bottom Clearance Reading', labelBn: 'তলা থেকে দূরত্ব', value: fmt(bottomClear, 1), unit: 'mm', highlight: true },
          { labelEn: 'Penetration From Top', labelBn: 'উপর থেকে পেনিট্রেশন', value: fmt(topPen, 1), unit: 'mm' },
          { labelEn: 'Next Setting Gauge Water (0.85P)', labelBn: 'সেটিং টেস্টের পানি (০.৮৫P)', value: fmt(0.85 * waterMl, 1), unit: 'mL' },
        ],
        steps: [
          `1. P(%) = (${fmt(waterMl, 1)} / ${fmt(cemG, 0)}) × 100 = ${fmt(pPct, 2)}%`,
          `2. Penetration Check: Bottom = ${fmt(bottomClear, 1)} mm (Target 5.0–7.0 mm) | Top = ${fmt(topPen, 1)} mm (Target 33–35 mm)`,
          `3. Water for Setting Time Test = 0.85 × ${fmt(waterMl, 1)} = ${fmt(0.85 * waterMl, 1)} mL.`,
        ],
      };
    }

    // 1.8 LAB TEST 8: INITIAL & FINAL SETTING TIME (VICAT NEEDLE)
    case 'cem-setting-time': {
      const cemG = Math.max(1, num(inputs.cementMassG, 400));
      const pPct = Math.max(10, num(inputs.consistencyPct, 29.0));
      const t1 = Math.max(0, num(inputs.t1WaterMin, 0));
      const t2 = Math.max(t1, num(inputs.t2InitialMin, 140));
      const t3 = Math.max(t1, num(inputs.t3FinalMin, 295));

      const wSetMl = 0.85 * (pPct / 100) * cemG;
      const ist = t2 - t1;
      const fst = t3 - t1;

      let verdict: TestingLabVerdict = 'PASS';
      if (ist < 45 || fst > 600 || t3 <= t2) verdict = 'FAIL';
      else if (ist < 60 || fst > 375) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Initial (IST) / Final (FST) Setting Time', bn: 'ইনিশিয়াল (IST) ও ফাইনাল (FST) সেটিং টাইম' },
        primaryValue: `${fmt(ist, 0)} min / ${fmt(fst, 0)} min`,
        primaryUnit: '',
        codeLimitText: 'IST ≥ 60 min (ASTM ≥ 45) | FST ≤ 375 min (BDS EN ≤ 600)',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — IDEAL HYDRATION WINDOW', bn: 'পাস — আদর্শ ইনিশিয়াল ও ফাইনাল সেটিং সময়' }
            : verdict === 'WARNING'
            ? { en: 'BORDERLINE SETTING WINDOW — MANAGE POUR CYCLE', bn: 'সতর্কতা — সেটিং সময় সীমান্তবর্তী, ঢালাই/সাটারিং সময় সমন্বয় করুন' }
            : { en: 'FLASH SET OR DELAYED SET FAILURE — REJECT', bn: 'ফেল — দ্রুত জমে যাওয়া (<৪৫ মি.) বা অতি বিলম্বিত (>৬০০ মি.) ত্রুটি' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `0.85P Gauge Water = ${fmt(wSetMl, 1)} mL; IST = ${fmt(ist, 0)} min (≥ 60 min) and FST = ${fmt(fst, 0)} min (≤ 375 min) satisfy both BDS EN 197 & ASTM C150.`, bn: `সেটিং পানি ${fmt(wSetMl, 1)} মি.লি.; IST ${fmt(ist, 0)} মিনিট ও FST ${fmt(fst, 0)} মিনিট সব কোডের মধ্যে উত্তীর্ণ।` }
            : verdict === 'WARNING'
            ? { en: `IST ${fmt(ist, 0)} min (45–59 min) or FST ${fmt(fst, 0)} min (376–600 min) passes secondary limit—place concrete quickly in hot weather or extend prop time.`, bn: `IST ৪৫–৫৯ মিনিট বা FST ৩৭৬–৬০০ মিনিট—দ্রুত ঢালাই শেষ করুন বা সাটারিং খুলতে বাড়তি সময় দিন।` }
            : { en: `Failed: IST < 45 min (${fmt(ist, 0)} min flash-set risk) or FST > 600 min (${fmt(fst, 0)} min retarded). Reject batch immediately.`, bn: `ফেল: IST < ৪৫ মিনিট (গাড়িতেই জমে যাবে) অথবা FST > ৬০০ মিনিট—সিমেন্ট বাতিল করুন।` },
        metrics: [
          { labelEn: 'Initial Setting Time (IST)', labelBn: 'ইনিশিয়াল সেটিং (IST)', value: fmt(ist, 0), unit: 'min', highlight: true },
          { labelEn: 'Final Setting Time (FST)', labelBn: 'ফাইনাল সেটিং (FST)', value: fmt(fst, 0), unit: 'min', highlight: true },
          { labelEn: 'Setting Water (0.85×P)', labelBn: 'সেটিং পানি (০.৮৫×P)', value: fmt(wSetMl, 1), unit: 'mL' },
          { labelEn: 'IST / FST in Hours', labelBn: 'ঘণ্টায় সেটিং সময়', value: `${fmt(ist / 60, 2)} / ${fmt(fst / 60, 2)}`, unit: 'hrs' },
        ],
        steps: [
          `1. Gauging Water W_set = 0.85 × (${fmt(pPct, 1)} / 100) × ${cemG} = ${fmt(wSetMl, 1)} mL`,
          `2. IST = T₂ - T₁ = ${t2} - ${t1} = ${fmt(ist, 0)} min (BDS EN ≥ 60 min; ASTM ≥ 45 min)`,
          `3. FST = T₃ - T₁ = ${t3} - ${t1} = ${fmt(fst, 0)} min (ASTM ≤ 375 min; BDS EN ≤ 600 min).`,
        ],
      };
    }

    // 1.9 LAB TEST 9: SOUNDNESS BY LE-CHATELIER
    case 'cem-soundness-lechatelier': {
      const l1 = num(inputs.initialGapMm, 12.0);
      const l2 = num(inputs.finalGapMm, 14.5);
      const expansion = Math.max(0, l2 - l1);

      let verdict: TestingLabVerdict = 'PASS';
      if (expansion > 10.0) verdict = 'FAIL';
      else if (expansion > 8.0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Le-Chatelier Soundness Expansion', bn: 'লি-চ্যাটেলিয়ার প্রসারণ' },
        primaryValue: fmt(expansion, 2),
        primaryUnit: 'mm',
        codeLimitText: 'BS EN 196-3 / BDS EN 197-1 Limit: Expansion ≤ 10.0 mm',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — VOLUME-STABLE SOUND CEMENT', bn: 'পাস — আয়তন-স্থিতিশীল ও ফাটলমুক্ত সিমেন্ট' }
            : verdict === 'WARNING'
            ? { en: 'UPPER EXPANSION MARGIN (8.1–10.0 mm) — AERATE & RETEST', bn: 'সতর্কতা — প্রসারণ ১০ মিমি সীমার কাছে, ৭ দিন বাতাসে রেখে রি-টেস্ট করুন' }
            : { en: 'UNSOUND CEMENT (> 10.0 mm) — REJECT LOT', bn: 'ফেল (> ১০ মিমি) — অতিরিক্ত মুক্ত চুন, কংক্রিট ফাটাবে, বাতিল করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Boiling expansion = ${fmt(expansion, 2)} mm (≤ 8.0 mm optimal, ≤ 10.0 mm code limit)—negligible free CaO/MgO expansion risk.`, bn: `প্রসারণ ${fmt(expansion, 2)} মিমি (≤ ১০ মিমি সীমা)—ভবিষ্যতে কংক্রিট বা প্লাস্টারে ফাটল ধরার ঝুঁকি নেই।` }
            : verdict === 'WARNING'
            ? { en: `Expansion ${fmt(expansion, 2)} mm sits near the 10.0 mm limit; aerate sample 7 days and re-verify (≤ 5 mm aerated).`, bn: `প্রসারণ ৮.১–১০.০ মিমির মধ্যে—৭ দিন শুকনো ছায়ায় ছড়িয়ে রেখে পুনরায় পরীক্ষা করুন।` }
            : { en: `Expansion ${fmt(expansion, 2)} mm exceeds 10.0 mm maximum—high free lime will cause delayed concrete cracking & pop-outs.`, bn: `প্রসারণ ১০ মিমি অতিক্রম করেছে (${fmt(expansion, 2)} মিমি)—ভবন সুরক্ষায় লট বাতিল করুন।` },
        metrics: [
          { labelEn: 'Net Expansion (L₂ - L₁)', labelBn: 'মোট প্রসারণ (L₂ - L₁)', value: fmt(expansion, 2), unit: 'mm', highlight: true },
          { labelEn: 'Code Margin Remaining', labelBn: 'অবশিষ্ট নিরাপদ মার্জিন', value: fmt(10.0 - expansion, 2), unit: 'mm' },
        ],
        steps: [
          `1. Expansion = L₂ - L₁ = ${fmt(l2, 1)} - ${fmt(l1, 1)} = ${fmt(expansion, 2)} mm`,
          `2. Limit Comparison: ${fmt(expansion, 2)} mm vs 10.0 mm Max (BDS EN 197-1 / BS EN 196-3).`,
        ],
      };
    }

    // 1.10 LAB TEST 10: COMPRESSIVE STRENGTH OF CEMENT MORTAR CUBE
    case 'cem-mortar-strength': {
      const gradeCode = Math.round(num(inputs.cementGradeCode, 1));
      const cubeCode = Math.round(num(inputs.cubeSizeCode, 1));
      const ageDays = Math.round(num(inputs.testAgeDays, 7));
      const p1 = Math.max(0, num(inputs.load1Kn, 88.0));
      const p2 = Math.max(0, num(inputs.load2Kn, 91.5));
      const p3 = Math.max(0, num(inputs.load3Kn, 89.0));

      const areaMm2 = cubeCode === 2 ? 5000 : 2500;
      const s1 = (p1 * 1000) / areaMm2;
      const s2 = (p2 * 1000) / areaMm2;
      const s3 = (p3 * 1000) / areaMm2;
      const meanMpa = (s1 + s2 + s3) / 3;
      const meanPsi = meanMpa * 145.038;

      const targets: Record<number, { name: string; d3: number; d7: number; d28: number }> = {
        1: { name: 'CEM-I 42.5N (OPC)', d3: 20.0, d7: 33.0, d28: 42.5 },
        2: { name: 'CEM-I 52.5N (High-Strength OPC)', d3: 27.0, d7: 40.0, d28: 52.5 },
        3: { name: 'CEM-II 42.5N (PCC Composite)', d3: 16.0, d7: 28.0, d28: 42.5 },
      };
      const spec = targets[gradeCode] || targets[1];
      const reqMpa = ageDays <= 3 ? spec.d3 : ageDays <= 7 ? spec.d7 : spec.d28;
      const dcr = meanMpa / reqMpa;

      let verdict: TestingLabVerdict = 'PASS';
      if (meanMpa < reqMpa * 0.9) verdict = 'FAIL';
      else if (meanMpa < reqMpa) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: `${ageDays}-Day Mean Mortar Strength`, bn: `${ageDays}-দিনের গড় মর্টার শক্তি` },
        primaryValue: `${fmt(meanMpa, 2)} MPa (${fmt(meanPsi, 0)} psi)`,
        primaryUnit: '',
        codeLimitText: `${spec.name} @ ${ageDays}d Min ≥ ${fmt(reqMpa, 1)} MPa`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — ${spec.name} ${ageDays}D STRENGTH PASS`, bn: `পাস — ${ageDays}-দিনের সিমেন্ট গ্রেড শক্তি অর্জিত` }
            : verdict === 'WARNING'
            ? { en: `SLIGHTLY BELOW ${ageDays}D TARGET (90–99%) — VERIFY 28D`, bn: `সতর্কতা — ${ageDays}-দিনের লক্ষ্যমাত্রার ৯০–৯৯%, ২৮-দিন যাচাই করুন` }
            : { en: `UNDER-STRENGTH CEMENT (< 90% TARGET) — REJECT`, bn: `ফেল — নির্ধারিত গ্রেডের চেয়ে কম শক্তি, লট বাতিল করুন` },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `3-cube average f_m = ${fmt(meanMpa, 2)} MPa (${fmt(meanPsi, 0)} psi) exceeds ${fmt(reqMpa, 1)} MPa target (DCR = ${fmt(dcr, 2)}×).`, bn: `৩টি কিউবের গড় শক্তি ${fmt(meanMpa, 2)} MPa (${fmt(meanPsi, 0)} psi) যা ≥ ${fmt(reqMpa, 1)} MPa লক্ষ্যমাত্রা অতিক্রম করেছে।` }
            : verdict === 'WARNING'
            ? { en: `Measured ${fmt(meanMpa, 2)} MPa is 90–99% of ${fmt(reqMpa, 1)} MPa requirement. Extend moist curing and verify 28-day cubes.`, bn: `প্রাপ্ত শক্তি ${fmt(meanMpa, 2)} MPa যা লক্ষ্যমাত্রার ৯০–৯৯%—কিউরিং বাড়িয়ে ২৮ দিনের ফলাফল দেখুন।` }
            : { en: `Failed minimum mortar strength (${fmt(meanMpa, 2)} MPa < ${fmt(reqMpa * 0.9, 1)} MPa). Switch cement brand or adjust concrete mix design.`, bn: `শক্তি নির্ধারিত মানের চেয়ে ১০%+ কম—স্ট্রাকচারাল আরসিসিতে ব্যবহার বন্ধ করে সিমেন্ট বদলান।` },
        metrics: [
          { labelEn: '3-Cube Mean Strength', labelBn: 'গড় কম্প্রেসিভ স্ট্রেন্থ', value: fmt(meanMpa, 2), unit: 'MPa', highlight: true },
          { labelEn: 'Strength in PSI', labelBn: 'শক্তি (psi)', value: fmt(meanPsi, 0), unit: 'psi', highlight: true },
          { labelEn: 'Compliance Ratio (DCR)', labelBn: 'কমপ্লায়েন্স অনুপাত', value: fmt(dcr, 2), unit: '×' },
          { labelEn: 'Mould Bed Area (A)', labelBn: 'কিউব তলের ক্ষেত্রফল', value: fmt(areaMm2, 0), unit: 'mm²' },
        ],
        steps: [
          `1. Specimen Area A = ${areaMm2} mm² (${cubeCode === 2 ? '70.6×70.6 mm IS Cube' : '50×50 mm ASTM C109 Cube'})`,
          `2. Individual Cube Strengths = [${fmt(s1, 2)}, ${fmt(s2, 2)}, ${fmt(s3, 2)}] MPa`,
          `3. Mean f_m = ${fmt(meanMpa, 2)} MPa (${fmt(meanPsi, 0)} psi) vs ${ageDays}d Spec ≥ ${fmt(reqMpa, 1)} MPa (DCR ${fmt(dcr, 2)}×).`,
        ],
      };
    }

    // =======================================================================
    // CATEGORY 2: FINE & COARSE AGGREGATE TESTS (5 TESTS)
    // =======================================================================

    // 2.1 FIELD SILT & CLAY CONTENT IN SAND (GRADUATED JAR)
    case 'agg-sand-silt': {
      const vSand = Math.max(1, num(inputs.sandLayerMl, 96.0));
      const vSilt = Math.max(0, num(inputs.siltLayerMl, 4.5));
      const siltPct = (vSilt / vSand) * 100;

      let verdict: TestingLabVerdict = 'PASS';
      if (siltPct > 8.0) verdict = 'FAIL';
      else if (siltPct > 6.0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Jar Silt & Clay Content', bn: 'জারে থিতানো পলি ও কাদা' },
        primaryValue: fmt(siltPct, 2),
        primaryUnit: '% Vol',
        codeLimitText: 'RCC / Plaster Pass ≤ 6.0% Vol (ASTM ≤ 3% Wt) | 6–8% Wash | > 8% Reject',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — CLEAN STRUCTURAL SAND', bn: 'পাস — পরিষ্কার ও কাদামুক্ত বালি' }
            : verdict === 'WARNING'
            ? { en: 'WASH MANDATORY (6–8% SILT) BEFORE MIXING', bn: 'সতর্কতা (৬–৮% পলি) — ঢালাইয়ের আগে বালি ধুয়ে নিন' }
            : { en: 'EXCESSIVE CLAY/SILT (> 8%) — REJECT LOT', bn: 'ফেল (> ৮% পলি) — অতি কাদাময় বালি, ট্রাক ফেরত দিন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Settled silt layer = ${fmt(siltPct, 2)}% (≤ 6.0% volumetric limit). Approved cleanly for RCC, masonry, and plaster.`, bn: `জারে পলি ও কাদা ${fmt(siltPct, 2)}% (≤ ৬.০%)—আরসিসি, গাঁথুনি ও প্লাস্টারের জন্য সরাসরি অনুমোদিত।` }
            : verdict === 'WARNING'
            ? { en: `Silt = ${fmt(siltPct, 2)}% falls in 6.0–8.0% wash zone. Flood-wash sand on inclined screen or confirm ASTM C117 #200 wash (< 3% wt).`, bn: `পলি ${fmt(siltPct, 2)}% (৬–৮%)—বালি পরিষ্কার পানিতে ধুয়ে আবার টেস্ট করুন বা #২০০ ওয়াশ (<৩% ওজন) যাচাই করুন।` }
            : { en: `Silt ${fmt(siltPct, 2)}% exceeds 8.0%—clay coats sand grains, weakens paste bond, and cracks concrete/plaster.`, bn: `পলি ${fmt(siltPct, 2)}% (>৮%)—সিমেন্টের বন্ডিং নষ্ট করে ফাটল ধরাবে; সম্পূর্ণ চালান বাতিল করুন।` },
        metrics: [
          { labelEn: 'Volumetric Silt Content', labelBn: 'পলি ও কাদার হার', value: fmt(siltPct, 2), unit: '%', highlight: true },
          { labelEn: 'Clean Sand Layer (V_sand)', labelBn: 'পরিষ্কার বালির স্তর', value: fmt(vSand, 1), unit: 'mL' },
          { labelEn: 'Settled Silt Layer (V_silt)', labelBn: 'জমাট পলি স্তর', value: fmt(vSilt, 1), unit: 'mL' },
        ],
        steps: [
          `1. Silt Content (%) = (V_silt / V_sand) × 100 = (${fmt(vSilt, 1)} / ${fmt(vSand, 1)}) × 100 = ${fmt(siltPct, 2)}%`,
          `2. Limit Comparison: ≤ 6.0% Pass | 6.1%–8.0% Wash Required | > 8.0% Reject.`,
        ],
      };
    }

    // 2.2 SIEVE ANALYSIS & FINENESS MODULUS (FM) — 6-SIEVE TABLE
    case 'agg-sand-fm': {
      const useCode = Math.round(num(inputs.intendedUseCode, 4));
      const w4 = Math.max(0, num(inputs.retained4G, 12));
      const w8 = Math.max(0, num(inputs.retained8G, 48));
      const w16 = Math.max(0, num(inputs.retained16G, 115));
      const w30 = Math.max(0, num(inputs.retained30G, 145));
      const w50 = Math.max(0, num(inputs.retained50G, 110));
      const w100 = Math.max(0, num(inputs.retained100G, 55));
      const wPan = Math.max(0, num(inputs.panMassG, 15));

      const totalW = Math.max(1, w4 + w8 + w16 + w30 + w50 + w100 + wPan);
      const cumWeights = [
        w4,
        w4 + w8,
        w4 + w8 + w16,
        w4 + w8 + w16 + w30,
        w4 + w8 + w16 + w30 + w50,
        w4 + w8 + w16 + w30 + w50 + w100,
      ];
      const cumPcts = cumWeights.map((cw) => (cw / totalW) * 100);
      const sumCumPct = cumPcts.reduce((s, v) => s + v, 0);
      const fm = sumCumPct / 100;
      const finesPct = (wPan / totalW) * 100;

      const useSpecs: Record<number, { label: string; min: number; max: number; warnMin: number; warnMax: number }> = {
        4: { label: 'Structural RCC — Sylhet Sand (2.50–3.00)', min: 2.5, max: 3.0, warnMin: 2.2, warnMax: 3.2 },
        3: { label: 'General RCC — Blended Sand (2.20–2.50)', min: 2.2, max: 2.5, warnMin: 1.9, warnMax: 3.1 },
        2: { label: 'Masonry Mortar (1.50–1.80)', min: 1.5, max: 1.8, warnMin: 1.35, warnMax: 2.15 },
        1: { label: 'Finishing Plaster — Local/Domar (1.20–1.50)', min: 1.2, max: 1.5, warnMin: 1.05, warnMax: 1.8 },
      };
      const targetSpec = useSpecs[useCode] || useSpecs[4];

      let verdict: TestingLabVerdict = 'PASS';
      if (fm < targetSpec.warnMin || fm > targetSpec.warnMax) verdict = 'FAIL';
      else if (fm < targetSpec.min || fm > targetSpec.max) verdict = 'WARNING';

      const bdClass =
        fm >= 2.5 && fm <= 3.05
          ? 'Coarse Sylhet Structural RCC Sand'
          : fm >= 2.2 && fm < 2.5
          ? 'Blended General RCC Sand'
          : fm >= 1.5 && fm < 2.2
          ? 'Masonry Mortar Sand'
          : fm >= 1.2 && fm < 1.5
          ? 'Local/Domar Finishing Plaster Sand'
          : fm < 1.2
          ? 'Over-Fine Silty Sand'
          : 'Over-Coarse Harsh Sand';

      return {
        testId,
        primaryMetricLabel: { en: 'Fineness Modulus (FM) & BD Class', bn: 'ফাইননেস মডুলাস (FM) ও বালির শ্রেণি' },
        primaryValue: `FM ${fmt(fm, 2)} (${bdClass})`,
        primaryUnit: '',
        codeLimitText: `Selected Scope: ${targetSpec.label}`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — SUITABLE FOR ${targetSpec.label.toUpperCase()}`, bn: `পাস — নির্বাচিত কাজের জন্য উপযুক্ত FM (${fmt(fm, 2)})` }
            : verdict === 'WARNING'
            ? { en: `BLENDING ADVISORY — FM ${fmt(fm, 2)} NEAR SCOPE BOUND`, bn: `সতর্কতা — FM ${fmt(fm, 2)} আদর্শ সীমার বাইরে, ব্লেন্ডিং করুন` }
            : { en: `UNSUITABLE FOR SELECTED APPLICATION (FM ${fmt(fm, 2)})`, bn: `ফেল — নির্বাচিত কাজের গ্রেডের অনুপযুক্ত FM (${fmt(fm, 2)})` },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Computed FM = ${fmt(fm, 2)} (Sum Cum.% = ${fmt(sumCumPct, 1)}%, Pan fines = ${fmt(finesPct, 1)}%) fits cleanly within ${targetSpec.min.toFixed(2)}–${targetSpec.max.toFixed(2)}.`, bn: `প্রাপ্ত FM = ${fmt(fm, 2)} (যোগফল ${fmt(sumCumPct, 1)}%, প্যান ${fmt(finesPct, 1)}%) যা নির্ধারিত ${targetSpec.min.toFixed(2)}–${targetSpec.max.toFixed(2)} সীমার মধ্যে আছে।` }
            : verdict === 'WARNING'
            ? { en: `FM ${fmt(fm, 2)} is slightly outside ${targetSpec.min.toFixed(2)}–${targetSpec.max.toFixed(2)} (${bdClass}). Blend coarse Sylhet and local sand to adjust.`, bn: `FM ${fmt(fm, 2)} নির্ধারিত সীমা থেকে সামান্য সরে গেছে—সিলেট ও লোকাল বালি মিশিয়ে (Blending) সঠিক FM তৈরি করুন।` }
            : { en: `FM ${fmt(fm, 2)} (${bdClass}) is unsuitable for ${targetSpec.label}. Reassign to matching work or switch quarry source.`, bn: `FM ${fmt(fm, 2)} নির্বাচিত কাজের উপযোগী নয়; অন্য কাজে ব্যবহার করুন বা বালির উৎস বদলান।` },
        metrics: [
          { labelEn: 'Fineness Modulus (FM)', labelBn: 'ফাইননেস মডুলাস (FM)', value: fmt(fm, 2), unit: 'FM', highlight: true },
          { labelEn: 'Sum of Cum. % (#4–#100)', labelBn: 'ক্রমপুঞ্জিত % যোগফল', value: fmt(sumCumPct, 1), unit: '%', highlight: true },
          { labelEn: 'Total Sieved Mass', labelBn: 'মোট চালনা ওজন', value: fmt(totalW, 1), unit: 'g' },
          { labelEn: 'Pan Passing #100 (<0.15mm)', labelBn: '#১০০ পার হওয়া মিহি অংশ', value: fmt(finesPct, 1), unit: '%' },
        ],
        steps: [
          `1. Total Mass W = ${fmt(totalW, 1)} g`,
          `2. Cumulative % [#4, #8, #16, #30, #50, #100] = [${cumPcts.map((p) => fmt(p, 1) + '%').join(', ')}]`,
          `3. Sum of Cum.% = ${fmt(sumCumPct, 2)}% → FM = ${fmt(sumCumPct, 2)} / 100 = ${fmt(fm, 2)} (${bdClass}).`,
        ],
      };
    }

    // 2.3 BULKING OF SAND & FARRAH CORRECTION
    case 'agg-sand-bulking': {
      const h1 = Math.max(1, num(inputs.dampHeightH1, 200));
      const h2 = Math.max(1, num(inputs.saturatedHeightH2, 166));
      const dryVol = Math.max(0.1, num(inputs.dryBoxVolCft, 1.875));

      const bulkingPct = Math.max(0, ((h1 - h2) / h2) * 100);
      const multiplier = 1 + bulkingPct / 100;
      const adjVol = dryVol * multiplier;
      const extraCft = adjVol - dryVol;

      let verdict: TestingLabVerdict = 'PASS';
      if (bulkingPct > 30.0) verdict = 'FAIL';
      else if (bulkingPct > 18.0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Sand Bulking % & Site Farrah Volume', bn: 'বালির স্ফীতি % ও সাইট ফর্মা মাপ' },
        primaryValue: `${fmt(bulkingPct, 2)}% | ${fmt(adjVol, 2)} CFT/bag`,
        primaryUnit: '',
        codeLimitText: '≤ 18% Normal | 18–30% Mandatory Farrah Box Correction | > 30% Weigh-Batch',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'NORMAL BULKING (≤ 18%) — APPLY FARRAH MULTIPLIER', bn: 'পাস — স্বাভাবিক স্ফীতি (সংশোধিত ফর্মায় মাপুন)' }
            : verdict === 'WARNING'
            ? { en: 'MANDATORY FARRAH CORRECTION (18–30% BULKING)', bn: 'সতর্কতা — ফর্মা বক্সে বাড়তি বালি যোগ করা বাধ্যতামূলক' }
            : { en: 'EXTREME BULKING (> 30%) — USE WEIGH-BATCHING', bn: 'ফেল (> ৩০%) — অতি মিহি/ভেজা বালি, ওজন পদ্ধতিতে মিক্সিং করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Bulking = ${fmt(bulkingPct, 2)}% (${fmt(multiplier, 3)}× factor). Measure ${fmt(adjVol, 2)} CFT (+${fmt(extraCft, 2)} CFT) in Farrah box per ${fmt(dryVol, 3)} CFT dry spec.`, bn: `বাল্কিং ${fmt(bulkingPct, 2)}% (${fmt(multiplier, 3)}×)। প্রতি ব্যাগে ${fmt(dryVol, 3)} সিএফটির বদলে ফর্মায় ${fmt(adjVol, 2)} সিএফটি (+${fmt(extraCft, 2)}) মাপুন।` }
            : verdict === 'WARNING'
            ? { en: `Significant ${fmt(bulkingPct, 2)}% bulking! You MUST compensate site Farrah box from ${fmt(dryVol, 3)} to ${fmt(adjVol, 2)} CFT (+${fmt(extraCft, 2)} CFT) to prevent harsh honeycombed concrete.`, bn: `উল্লেখযোগ্য ${fmt(bulkingPct, 2)}% স্ফীতি! ঢালাইয়ে হানিকম্বিং এড়াতে ফর্মায় অবশ্যই ${fmt(adjVol, 2)} সিএফটি (+${fmt(extraCft, 2)} সিএফটি বেশি) বালি দিন।` }
            : { en: `Excessive ${fmt(bulkingPct, 2)}% expansion signals overly fine damp sand. Check sand FM and switch to digital weigh-batching.`, bn: `৩০%-এর বেশি (${fmt(bulkingPct, 2)}%) স্ফীতি—বালি অতি চিকন; FM পরীক্ষা করুন ও ওজন মেশিনে ব্যাচিং করুন।` },
        metrics: [
          { labelEn: 'Sand Bulking %', labelBn: 'বালির স্ফীতি হার', value: fmt(bulkingPct, 2), unit: '%', highlight: true },
          { labelEn: 'Farrah Box Multiplier', labelBn: 'ফর্মা বক্স গুণিতক', value: fmt(multiplier, 3), unit: '×' },
          { labelEn: 'Corrected Site Box Vol.', labelBn: 'সংশোধিত সাইট ফর্মা মাপ', value: fmt(adjVol, 2), unit: 'CFT', highlight: true },
          { labelEn: 'Extra Damp Sand Needed', labelBn: 'বাড়তি যোগ্য বালি', value: `+${fmt(extraCft, 2)}`, unit: 'CFT' },
        ],
        steps: [
          `1. Bulking(%) = ((H₁ - H₂) / H₂) × 100 = ((${h1} - ${h2}) / ${h2}) × 100 = ${fmt(bulkingPct, 2)}%`,
          `2. Batch Multiplier = 1 + (${fmt(bulkingPct, 2)} / 100) = ${fmt(multiplier, 3)}×`,
          `3. Corrected Box Volume = ${fmt(dryVol, 3)} × ${fmt(multiplier, 3)} = ${fmt(adjVol, 2)} CFT (+${fmt(extraCft, 2)} CFT extra).`,
        ],
      };
    }

    // 2.4 SPECIFIC GRAVITY & WATER ABSORPTION (STONE CHIPS VS PICKED JHAMA)
    case 'agg-sg-absorption': {
      const aggType = Math.round(num(inputs.aggTypeCode, 1));
      const a = Math.max(1, num(inputs.ovenDryMassA, 2480));
      const b = Math.max(a, num(inputs.ssdMassB, 2502));
      const c = Math.max(0, num(inputs.submergedMassC, 1595));

      const denom = Math.max(1, b - c);
      const gsb = a / denom;
      const ssdSg = b / denom;
      const appSg = a / Math.max(1, a - c);
      const absPct = ((b - a) / a) * 100;

      const isStone = aggType === 1;
      let verdict: TestingLabVerdict = 'PASS';
      if (isStone) {
        if (absPct > 2.5 || gsb < 2.4) verdict = 'FAIL';
        else if (absPct > 1.5) verdict = 'WARNING';
      } else {
        if (absPct > 16.0 || gsb < 1.8) verdict = 'FAIL';
        else if (absPct > 15.0) verdict = 'WARNING';
      }

      const limitText = isStone
        ? 'Crushed Stone: Absorption ≤ 1.5% (Max ≤ 2.5%) | G_sb 2.60–2.85'
        : 'Picked Jhama Brick Khoa: Absorption ≤ 15.0% (Reject > 16%) | G_sb 1.80–2.20';

      return {
        testId,
        primaryMetricLabel: { en: 'Bulk SG (G_sb) & Water Absorption', bn: 'বাল্ক আপেক্ষিক গুরুত্ব ও পানি শোষণ' },
        primaryValue: `G_sb ${fmt(gsb, 2)} | Abs ${fmt(absPct, 2)}%`,
        primaryUnit: '',
        codeLimitText: limitText,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — ${isStone ? 'DENSE CRUSHED STONE' : '1ST-CLASS PICKED JHAMA KHOA'}`, bn: `পাস — ${isStone ? 'উন্নত ঘন পাথর' : 'ভালো পোড়া পিকড ঝামা খোয়া'}` }
            : verdict === 'WARNING'
            ? { en: 'ELEVATED ABSORPTION — PRE-SOAK TO SSD & CHECK STRENGTH', bn: 'সতর্কতা — বেশি শোষণ, ঢালাইয়ের আগে ভিজিয়ে SSD করে নিন' }
            : { en: 'HIGH POROSITY / SOFT AGGREGATE — REJECT FOR RCC', bn: 'ফেল — অতি ছিদ্রযুক্ত বা কাঁচা খোয়া/পাথর, আরসিসিতে বাতিল' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Bulk SG = ${fmt(gsb, 2)}, SSD SG = ${fmt(ssdSg, 2)}, and Water Absorption = ${fmt(absPct, 2)}% meet ASTM C127 / BNBC limits.`, bn: `আপেক্ষিক গুরুত্ব ${fmt(gsb, 2)} (SSD ${fmt(ssdSg, 2)}) এবং পানি শোষণ ${fmt(absPct, 2)}% অনুমোদিত সীমায় আছে।` }
            : verdict === 'WARNING'
            ? { en: `Absorption ${fmt(absPct, 2)}% exceeds optimal threshold; verify ACV/L.A. wear resistance and pre-soak piles to full SSD before batching.`, bn: `পানি শোষণ ${fmt(absPct, 2)}% আদর্শ সীমার কিছুটা বেশি; এলএ/ক্রাশিং যাচাই করে ঢালাইয়ের আগে ভালোভাবে ভিজিয়ে নিন।` }
            : { en: `Failed porosity/density check (Abs = ${fmt(absPct, 2)}%, G_sb = ${fmt(gsb, 2)}). Unsuitable for structural RCC.`, bn: `পানি শোষণ বা ঘনত্ব কোড সীমায় ফেল করেছে—স্ট্রাকচারাল আরসিসিতে ব্যবহার নিষেধ।` },
        metrics: [
          { labelEn: 'Bulk Specific Gravity (G_sb)', labelBn: 'বাল্ক আপেক্ষিক গুরুত্ব (G_sb)', value: fmt(gsb, 2), unit: '', highlight: true },
          { labelEn: '24-Hr Water Absorption', labelBn: 'পানি শোষণ (%)', value: fmt(absPct, 2), unit: '%', highlight: true },
          { labelEn: 'SSD Specific Gravity', labelBn: 'SSD আপেক্ষিক গুরুত্ব', value: fmt(ssdSg, 2), unit: '' },
          { labelEn: 'Apparent Specific Gravity', labelBn: 'অ্যাপারেন্ট আপেক্ষিক গুরুত্ব', value: fmt(appSg, 2), unit: '' },
        ],
        steps: [
          `1. Displaced Water (B - C) = ${b} - ${c} = ${fmt(denom, 1)} g`,
          `2. Bulk G_sb = A / (B - C) = ${a} / ${fmt(denom, 1)} = ${fmt(gsb, 3)} | SSD SG = ${b} / ${fmt(denom, 1)} = ${fmt(ssdSg, 3)}`,
          `3. Water Absorption = ((${b} - ${a}) / ${a}) × 100 = ${fmt(absPct, 2)}%.`,
        ],
      };
    }

    // 2.5 ACV / AIV / L.A. ABRASION VALUE
    case 'agg-acv-aiv-laa': {
      const methodCode = Math.round(num(inputs.testMethodCode, 1));
      const w1 = Math.max(1, num(inputs.initialMassG, 5000));
      const w2 = Math.min(w1, Math.max(0, num(inputs.passingFinesG, 1100)));
      const lossPct = (w2 / w1) * 100;

      const methodMap: Record<number, { name: string; sieve: string }> = {
        1: { name: 'L.A. Abrasion (ASTM C131)', sieve: '1.70 mm (#12)' },
        2: { name: 'ACV Crushing (BS 812)', sieve: '2.36 mm (#8)' },
        3: { name: 'AIV Impact (BS 812)', sieve: '2.36 mm (#8)' },
      };
      const mInfo = methodMap[methodCode] || methodMap[1];

      let verdict: TestingLabVerdict = 'PASS';
      if (lossPct > 40.0) verdict = 'FAIL';
      else if (lossPct > 30.0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: `${mInfo.name} Loss`, bn: `${mInfo.name} ক্ষয় মান` },
        primaryValue: fmt(lossPct, 2),
        primaryUnit: '%',
        codeLimitText: 'Wearing Course / Heavy RCC ≤ 30% | Base / Gen. RCC ≤ 35–40% | > 40% Reject',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — TOUGH WEARING & RCC AGGREGATE', bn: 'পাস — শক্ত ও টেকসই হাইওয়ে/আরসিসি পাথর' }
            : verdict === 'WARNING'
            ? { en: 'BASE / NON-WEARING GRADE (30.1–40%)', bn: 'সতর্কতা (৩০–৪০%) — শুধু বেজ কোর্স/সাধারণ কাজে ব্যবহারযোগ্য' }
            : { en: 'SOFT / FRIABLE AGGREGATE (> 40%) — REJECT LOT', bn: 'ফেল (> ৪০%) — অতি নরম ও ভঙ্গুর পাথর, বাতিল করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `${mInfo.name} = ${fmt(lossPct, 2)}% (≤ 30% max for wearing surfaces & heavy bridges/RCC).`, bn: `${mInfo.name} মান ${fmt(lossPct, 2)}% (≤ ৩০%)—হাইওয়ে কার্পেটিং, ব্রিজ ও উচ্চ-শক্তির আরসিসিতে অনুমোদিত।` }
            : verdict === 'WARNING'
            ? { en: `Loss ${fmt(lossPct, 2)}% (30.1–40%) is acceptable for road base/sub-base and general non-wearing concrete, not heavy highway wearing coats.`, bn: `ক্ষয় ${fmt(lossPct, 2)}% (৩০–৪০%) সড়কের বেজ কোর্স বা সাধারণ কাজে চলবে, কিন্তু হাইওয়ে টপ লেয়ারে নিষেধ।` }
            : { en: `Loss ${fmt(lossPct, 2)}% exceeds 40% ceiling—soft rock pulverizes under load. Reject batch immediately.`, bn: `ক্ষয় ৪০%-এর বেশি (${fmt(lossPct, 2)}%)—লোড নিলে গুঁড়া হয়ে যাবে; সম্পূর্ণ লট ফেরত দিন।` },
        metrics: [
          { labelEn: 'Calculated Loss Value', labelBn: 'প্রাপ্ত ক্ষয়ের হার', value: fmt(lossPct, 2), unit: '%', highlight: true },
          { labelEn: `Fines Passing ${mInfo.sieve}`, labelBn: 'চালনি পার হওয়া গুঁড়া', value: fmt(w2, 0), unit: 'g' },
          { labelEn: 'Retained Hard Stone', labelBn: 'অক্ষত থাকা শক্ত পাথর', value: fmt(w1 - w2, 0), unit: 'g' },
        ],
        steps: [
          `1. Protocol: ${mInfo.name} (Finish Sieve: ${mInfo.sieve})`,
          `2. Loss(%) = (W₂ / W₁) × 100 = (${fmt(w2, 1)} / ${fmt(w1, 0)}) × 100 = ${fmt(lossPct, 2)}%.`,
        ],
      };
    }

    // =======================================================================
    // CATEGORY 3: BRICK & BLOCK TESTS (4 TESTS)
    // =======================================================================

    // 3.1 FIELD BRICK QUALITY CHECKS + 20-BRICK CUMULATIVE DIMENSIONS
    case 'brk-field-checks': {
      const isTrad = Math.round(num(inputs.brickStdCode, 1)) === 2;
      const lenMm = Math.max(100, num(inputs.cum20LenMm, 4760));
      const widMm = Math.max(100, num(inputs.cum20WidMm, 2280));
      const hgtMm = Math.max(100, num(inputs.cum20HgtMm, 1385));
      const soundCode = Math.round(num(inputs.ringingSoundCode, 1));
      const breaks = Math.max(0, num(inputs.dropBreakCount, 0));

      const stdL = isTrad ? 4826 : 4800; // 190" = 4826mm | Metric = 4800mm
      const stdW = isTrad ? 2286 : 2300; // 90" = 2286mm  | Metric = 2300mm
      const stdH = isTrad ? 1397 : 1400; // 55" = 1397mm  | Metric = 1400mm

      const dL = lenMm - stdL;
      const dW = widMm - stdW;
      const dH = hgtMm - stdH;

      let verdict: TestingLabVerdict = 'PASS';
      if (soundCode >= 3 || breaks >= 2 || Math.abs(dL) > 120 || Math.abs(dW) > 60 || Math.abs(dH) > 60) {
        verdict = 'FAIL';
      } else if (soundCode === 2 || breaks === 1 || Math.abs(dL) > 80 || Math.abs(dW) > 40 || Math.abs(dH) > 40) {
        verdict = 'WARNING';
      }

      return {
        testId,
        primaryMetricLabel: { en: '20-Brick Tolerance & Drop/Sound Audit', bn: '২০-ইটের মাপ, শব্দ ও পতন যাচাই' },
        primaryValue: `ΔL ${dL >= 0 ? '+' : ''}${fmt(dL, 0)} | ΔW ${dW >= 0 ? '+' : ''}${fmt(dW, 0)} | ΔH ${dH >= 0 ? '+' : ''}${fmt(dH, 0)} mm`,
        primaryUnit: '',
        codeLimitText: `${isTrad ? 'Trad. 190" / 90" / 55"' : 'BD Metric 4800±80 / 2300±40 / 1400±40 mm'} | 0 Drop Breaks`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — 1ST-CLASS UNIFORM BRICK', bn: 'পাস — সঠিক মাপ ও ১ম শ্রেণির মজবুত ইট' }
            : verdict === 'WARNING'
            ? { en: 'MINOR SIZE DRIFT / 1 BREAK — LAB VERIFY', bn: 'সতর্কতা — সামান্য মাপ বিচ্যুতি বা ১টি ভাঙন, ল্যাব টেস্ট করুন' }
            : { en: 'REJECT DELIVERY — BRITTLE OR UNDERSIZED DIE', bn: 'ফেল — ভঙ্গুর বা ছোট ছাঁচের ইট, ট্রাক ফেরত দিন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `20-brick cumulative deviations (ΔL=${dL >= 0 ? '+' : ''}${dL}, ΔW=${dW >= 0 ? '+' : ''}${dW}, ΔH=${dH >= 0 ? '+' : ''}${dH} mm) are inside ±80/±40/±40 mm with crisp ring & 0 drop breaks.`, bn: `২০টি ইটের দৈর্ঘ্য, প্রস্থ ও উচ্চতার বিচ্যুতি অনুমোদিত সীমার মধ্যে এবং পতন পরীক্ষায় ০টি ভাঙন—মান উত্তীর্ণ।` }
            : verdict === 'WARNING'
            ? { en: `One border-tolerance drift or 1 drop break noted; verify 24h water absorption and crushing strength before full stacking.`, bn: `সামান্য মাপ বিচ্যুতি বা ১টি ইট ভেঙেছে—পানি শোষণ ও কম্প্রেসিভ স্ট্রেন্থ দেখে অনুমোদন দিন।` }
            : { en: `Failed physical field checks (${breaks}/5 drop breaks, dull sound, or out-of-spec brick mold size). Reject truckload.`, bn: `পতন পরীক্ষায় ≥২টি ভাঙন, ভোঁতা শব্দ বা মাপের বড় ঘাটতি—গাড়ি থেকে না নামিয়ে ফেরত পাঠান।` },
        metrics: [
          { labelEn: '20-Brick Length ΔL (±80)', labelBn: 'দৈর্ঘ্য বিচ্যুতি ΔL (±৮০)', value: `${dL >= 0 ? '+' : ''}${fmt(dL, 0)}`, unit: 'mm', highlight: true },
          { labelEn: '20-Brick Width ΔW (±40)', labelBn: 'প্রস্থ বিচ্যুতি ΔW (±৪০)', value: `${dW >= 0 ? '+' : ''}${fmt(dW, 0)}`, unit: 'mm' },
          { labelEn: '20-Brick Height ΔH (±40)', labelBn: 'উচ্চতা বিচ্যুতি ΔH (±৪০)', value: `${dH >= 0 ? '+' : ''}${fmt(dH, 0)}`, unit: 'mm' },
          { labelEn: '1.2m Drop Breakages', labelBn: '৪ ফুট পতনে ভাঙা ইট', value: fmt(breaks, 0), unit: '/ 5 nos', highlight: true },
        ],
        steps: [
          `1. Standard (${isTrad ? 'Trad. 9.5"×4.5"×2.75" = 4826 / 2286 / 1397 mm' : 'BD Metric 240×115×70 = 4800 / 2300 / 1400 mm'})`,
          `2. Deviations: ΔL = ${dL >= 0 ? '+' : ''}${dL} mm (±80), ΔW = ${dW >= 0 ? '+' : ''}${dW} mm (±40), ΔH = ${dH >= 0 ? '+' : ''}${dH} mm (±40)`,
          `3. Sound/Scratch Code = ${soundCode}, 1.2 m Drop Breaks = ${breaks} / 5.`,
        ],
      };
    }

    // 3.2 24-HOUR COLD WATER ABSORPTION
    case 'brk-water-absorption': {
      const w1 = Math.max(1, num(inputs.dryWeightG, 2950));
      const w2 = Math.max(w1, num(inputs.wetWeightG, 3360));
      const absPct = ((w2 - w1) / w1) * 100;

      let verdict: TestingLabVerdict = 'PASS';
      if (absPct > 22.0) verdict = 'FAIL';
      else if (absPct > 20.0) verdict = 'WARNING';

      const gradeClass =
        absPct <= 12.0
          ? 'Picked Jhama / Ceramic Brick (≤ 12%)'
          : absPct <= 15.0
          ? 'PWD Strict 1st Class (≤ 15%)'
          : absPct <= 20.0
          ? 'General 1st Class (15.1–20%)'
          : absPct <= 22.0
          ? '2nd Class (20.1–22%)'
          : '3rd Class / Under-Burnt (> 22%)';

      return {
        testId,
        primaryMetricLabel: { en: '24-Hr Water Absorption & Class', bn: '২৪-ঘণ্টা পানি শোষণ ও শ্রেণি' },
        primaryValue: `${fmt(absPct, 2)}% (${gradeClass})`,
        primaryUnit: '',
        codeLimitText: 'Jhama ≤ 12% | PWD 1st Class ≤ 15% (Max ≤ 20%) | 2nd Class 20–22% | > 22% Reject',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — ${absPct <= 15 ? 'PWD STRICT 1ST CLASS' : 'GENERAL 1ST CLASS'}`, bn: `পাস — ${absPct <= 15 ? 'পিডব্লিউডি ১ম শ্রেণির ঘন ইট' : '১ম শ্রেণির ইট'}` }
            : verdict === 'WARNING'
            ? { en: '2ND CLASS BRICK (20–22%) — INTERIOR PARTITION ONLY', bn: 'সতর্কতা (২য় শ্রেণি) — শুধু ভেতরের পার্টিশন দেয়ালে দিন' }
            : { en: '3RD CLASS UNDER-BURNT (> 22%) — REJECT LOT', bn: 'ফেল (> ২২%) — ৩য় শ্রেণির কাঁচা ইট, চালান বাতিল করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `24-hour absorption = ${fmt(absPct, 2)}% (${gradeClass}). Pre-soak 2–3 h cleanly before mortar laying.`, bn: `পানি শোষণ ${fmt(absPct, 2)}% (${gradeClass})। গাঁথুনির ২–৩ ঘণ্টা আগে পরিষ্কার পানিতে ভিজিয়ে নিন।` }
            : verdict === 'WARNING'
            ? { en: `Absorption ${fmt(absPct, 2)}% falls in 20–22% 2nd-class band; unsuitable for exterior damp walls or structural load-bearing masonry.`, bn: `শোষণ ২০–২২% (২য় শ্রেণি)—বাইরের দেয়াল ও ভারবহনকারী দেয়ালে ব্যবহার নিষেধ।` }
            : { en: `Excessive ${fmt(absPct, 2)}% porosity (> 22%) steals mortar water and breeds chronic dampness. Reject delivery.`, bn: `অতিরিক্ত ছিদ্রযুক্ত ৩য় শ্রেণির ইট (>২২%)—দেয়ালে ড্যাম্প ও নোনা ধরাবে; ট্রাক ফেরত দিন।` },
        metrics: [
          { labelEn: 'Water Absorption', labelBn: 'পানি শোষণের হার', value: fmt(absPct, 2), unit: '%', highlight: true },
          { labelEn: 'Brick Classification', labelBn: 'ইটের শ্রেণি', value: gradeClass, unit: '', highlight: true },
          { labelEn: 'Absorbed Water Mass', labelBn: 'শোষিত পানির ওজন', value: fmt(w2 - w1, 0), unit: 'g' },
        ],
        steps: [
          `1. Absorbed Water = W₂ - W₁ = ${w2} - ${w1} = ${w2 - w1} g`,
          `2. Absorption = (${w2 - w1} / ${w1}) × 100 = ${fmt(absPct, 2)}% → ${gradeClass}.`,
        ],
      };
    }

    // 3.3 EFFLORESCENCE (LONA) TEST
    case 'brk-efflorescence': {
      const saltPct = Math.max(0, num(inputs.saltAreaPct, 6));
      const flaking = Math.round(num(inputs.flakingCode, 1)) >= 2;

      const rating = flaking
        ? 'SERIOUS (Powder / Flaking)'
        : saltPct === 0
        ? 'NIL (0%)'
        : saltPct < 10
        ? 'SLIGHT (< 10%)'
        : saltPct <= 50
        ? 'MODERATE (10–50%)'
        : 'HEAVY (> 50%)';

      let verdict: TestingLabVerdict = 'PASS';
      if (flaking || saltPct > 50) verdict = 'FAIL';
      else if (saltPct >= 10) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'IS 3495 Efflorescence Rating', bn: 'নোনা (Efflorescence) শ্রেণি' },
        primaryValue: `${rating} (${fmt(saltPct, 0)}%)`,
        primaryUnit: '',
        codeLimitText: 'Nil (0%) / Slight (< 10%) Pass | Moderate (10–50%) Interior | Heavy/Serious Reject',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — ${saltPct === 0 ? 'NIL (নোনা মুক্ত)' : 'SLIGHT (< 10%)'} EFFLORESCENCE`, bn: `পাস — ${saltPct === 0 ? 'নোনা মুক্ত (Nil)' : 'সামান্য নোনা (< ১০%)'}` }
            : verdict === 'WARNING'
            ? { en: 'MODERATE EFFLORESCENCE (10–50%) — BRUSH & ANTI-SALT SEAL', bn: 'সতর্কতা — মধ্যম নোনা, তারের ব্রাশ ও সল্ট-প্রাইমার ব্যবহার করুন' }
            : { en: 'HEAVY / SERIOUS LONA — REJECT BRICK LOT', bn: 'ফেল — অতিরিক্ত (>৫০%) বা গুঁড়া/আঁশ খসা মারাত্মক নোনা, বাতিল করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Classified as ${rating} (${fmt(saltPct, 0)}% surface area, no powdering). Approved for exposed & plastered walls.`, bn: `ইটের নোনা ${rating} (${fmt(saltPct, 0)}%)—প্লাস্টার ও রঙের জন্য নিরাপদ।` }
            : verdict === 'WARNING'
            ? { en: `Moderate soluble salt (10–50%). Dry-brush thoroughly, keep out of damp basement/toilet walls, and apply anti-salt primer.`, bn: `মধ্যম নোনা (১০–৫০%)—স্যাঁতসেঁতে বা বেজমেন্ট দেয়ালে ব্যবহার নিষেধ; শুকনো তারের ব্রাশে ঘষে সিলার দিন।` }
            : { en: `${flaking ? 'Surface powdering/flaking (Serious)' : 'Over 50% heavy salt deposit'} will blister paint and delaminate plaster—reject shipment.`, bn: `মারাত্মক/অতিরিক্ত নোনা—দেয়ালের প্লাস্টার ও রঙ খসিয়ে দেবে; পুরো চালান ফেরত পাঠান।` },
        metrics: [
          { labelEn: 'Efflorescence Class', labelBn: 'নোনা শ্রেণিবিভাগ', value: rating, unit: '', highlight: true },
          { labelEn: 'Salt-Covered Face Area', labelBn: 'সাদা লবণ ঢাকা এলাকা', value: fmt(saltPct, 0), unit: '%' },
          { labelEn: 'Surface Powder/Flaking', labelBn: 'গুঁড়া/আঁশ খসা অবস্থা', value: flaking ? 'YES (Serious)' : 'No', unit: '', highlight: true },
        ],
        steps: [
          `1. 2-Cycle Distilled Capillary Area = ${fmt(saltPct, 1)}% | Flaking/Powdering = ${flaking ? 'Yes' : 'No'}`,
          `2. Classification: ${rating} (0% Nil | <10% Slight | 10–50% Moderate | >50% Heavy | Flaking Serious).`,
        ],
      };
    }

    // 3.4 COMPRESSIVE / CRUSHING STRENGTH OF BRICKS & HOLLOW BLOCKS (5-SPECIMEN MEAN)
    case 'brk-compressive': {
      const unitCode = Math.round(num(inputs.masonryUnitCode, 2));
      const lMm = Math.max(50, num(inputs.brickLengthMm, 240));
      const wMm = Math.max(40, num(inputs.brickWidthMm, 115));
      const netPct = Math.min(100, Math.max(25, num(inputs.netSolidPct, 100)));
      const loads = [
        Math.max(0, num(inputs.load1Kn, 450)),
        Math.max(0, num(inputs.load2Kn, 470)),
        Math.max(0, num(inputs.load3Kn, 440)),
        Math.max(0, num(inputs.load4Kn, 465)),
        Math.max(0, num(inputs.load5Kn, 455)),
      ];

      const grossArea = lMm * wMm;
      const netArea = grossArea * (netPct / 100);
      const strengthsMpa = loads.map((p) => (p * 1000) / netArea);
      const meanMpa = strengthsMpa.reduce((a, b) => a + b, 0) / 5;
      const minMpa = Math.min(...strengthsMpa);
      const meanPsi = meanMpa * 145.038;

      const unitSpecs: Record<number, { name: string; targetMpa: number }> = {
        1: { name: 'Grade S / Heavy Duty Brick (> 20 MPa)', targetMpa: 20.0 },
        2: { name: '1st Class Clay Brick (≥ 10.5 / PWD 15.0 MPa)', targetMpa: 10.5 },
        3: { name: '2nd Class Brick (≥ 7.0 MPa)', targetMpa: 7.0 },
        4: { name: 'Load-Bearing Hollow Block (≥ 13.1 MPa Net)', targetMpa: 13.1 },
      };
      const uSpec = unitSpecs[unitCode] || unitSpecs[2];
      const dcr = meanMpa / uSpec.targetMpa;

      let verdict: TestingLabVerdict = 'PASS';
      if (unitCode === 4) {
        if (meanMpa < 13.1 || minMpa < 10.5) verdict = 'FAIL';
      } else {
        if (meanMpa < 7.0) verdict = 'FAIL';
        else if (meanMpa < uSpec.targetMpa) verdict = 'WARNING';
        else if (minMpa < uSpec.targetMpa * 0.8) verdict = 'WARNING';
      }

      return {
        testId,
        primaryMetricLabel: { en: '5-Specimen Mean Compressive Strength', bn: '৫-নমুনার গড় কম্প্রেসিভ স্ট্রেন্থ' },
        primaryValue: `${fmt(meanMpa, 2)} MPa (${fmt(meanPsi, 0)} psi)`,
        primaryUnit: '',
        codeLimitText: `${uSpec.name} | Min Single ≥ ${fmt(uSpec.targetMpa * 0.8, 1)} MPa`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — PASSES ${uSpec.name.toUpperCase()}`, bn: `পাস — নির্ধারিত মানের ইট/ব্লক উত্তীর্ণ` }
            : verdict === 'WARNING'
            ? { en: 'BELOW TARGET CLASS — PARTITION / DOWNGRADE ONLY', bn: 'সতর্কতা — নির্ধারিত গ্রেড ফেল (শুধু পার্টিশন/নিম্ন গ্রেড উপযোগী)' }
            : { en: 'CRITICAL CRUSHING FAILURE — REJECT LOT', bn: 'ফেল — অতি দুর্বল ইট/ব্লক, সম্পূর্ণ চালান বাতিল করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `5-specimen average = ${fmt(meanMpa, 2)} MPa (${fmt(meanPsi, 0)} psi), minimum brick = ${fmt(minMpa, 2)} MPa. Meets ${uSpec.name} (DCR ${fmt(dcr, 2)}×).`, bn: `৫টি নমুনার গড় শক্তি ${fmt(meanMpa, 2)} MPa (${fmt(meanPsi, 0)} psi) ও সর্বনিম্ন ${fmt(minMpa, 2)} MPa—মান উত্তীর্ণ।` }
            : verdict === 'WARNING'
            ? { en: `Mean ${fmt(meanMpa, 2)} MPa misses ${fmt(uSpec.targetMpa, 1)} MPa target (or lowest unit ${fmt(minMpa, 2)} MPa < 80% target); restrict to non-load infill.`, bn: `গড় শক্তি ${fmt(meanMpa, 2)} MPa (বা সর্বনিম্ন একক ${fmt(minMpa, 2)} MPa) নির্ধারিত মানের নিচে—শুধু পার্টিশনে ব্যবহারযোগ্য।` }
            : { en: `Failed minimum structural strength (${fmt(meanMpa, 2)} MPa < ${unitCode === 4 ? '13.1' : '7.0'} MPa). Reject delivery immediately.`, bn: `মারাত্মক দুর্বল ইট/ব্লক (${fmt(meanMpa, 2)} MPa)—ট্রাক ফেরত পাঠান।` },
        metrics: [
          { labelEn: '5-Specimen Mean (MPa)', labelBn: 'গড় শক্তি (MPa)', value: fmt(meanMpa, 2), unit: 'MPa', highlight: true },
          { labelEn: '5-Specimen Mean (psi)', labelBn: 'গড় শক্তি (psi)', value: fmt(meanPsi, 0), unit: 'psi', highlight: true },
          { labelEn: 'Lowest Specimen (Min)', labelBn: 'সর্বনিম্ন নমুনা শক্তি', value: fmt(minMpa, 2), unit: 'MPa' },
          { labelEn: 'Effective Net Area', labelBn: 'নিট লোড ক্ষেত্রফল', value: fmt(netArea, 0), unit: 'mm²' },
        ],
        steps: [
          `1. Net Bed Area A_net = (${lMm} × ${wMm}) × ${netPct}% = ${fmt(netArea, 0)} mm²`,
          `2. Individual Strengths = [${strengthsMpa.map((s) => fmt(s, 2)).join(', ')}] MPa`,
          `3. 5-Specimen Mean f_b = ${fmt(meanMpa, 2)} MPa (${fmt(meanPsi, 0)} psi) vs Target ≥ ${fmt(uSpec.targetMpa, 1)} MPa.`,
        ],
      };
    }

    // =======================================================================
    // CATEGORY 4: FRESH, HARDENED & NDT CONCRETE TESTS (6 TESTS)
    // =======================================================================

    // 4.1 SLUMP CONE TEST OF FRESH CONCRETE (ASTM C143)
    case 'con-slump-cone': {
      const presetCode = Math.round(num(inputs.elementPresetCode, 3));
      const presets: Record<number, { name: string; nameBn: string; minMm: number; maxMm: number }> = {
        1: { name: 'Road Pavement / Dry Mass', nameBn: 'রোড পেভমেন্ট', minMm: 25, maxMm: 50 },
        2: { name: 'Mass Footing / Sub-Structure', nameBn: 'ম্যাস ফুটিং', minMm: 50, maxMm: 75 },
        3: { name: 'Normal Beam, Slab & Column', nameBn: 'সাধারণ বিম, ছাদ ও কলাম', minMm: 75, maxMm: 125 },
        4: { name: 'Pumped Concrete / Dense Rebar', nameBn: 'পাম্প কংক্রিট', minMm: 100, maxMm: 150 },
        5: { name: 'Cast-in-Situ Bored Pile Tremie', nameBn: 'বোরড পাইল ট্রেমি', minMm: 150, maxMm: 200 },
      };
      // Support legacy targetSlumpMm if loaded from an older workspace record
      const useLegacyTarget = inputs.elementPresetCode === undefined && inputs.targetSlumpMm !== undefined;
      const preset = presets[presetCode] || presets[3];
      const minTarget = useLegacyTarget ? Math.max(0, num(inputs.targetSlumpMm, 100) - 25) : preset.minMm;
      const maxTarget = useLegacyTarget ? num(inputs.targetSlumpMm, 100) + 25 : preset.maxMm;

      const slumpTypeCode = Math.round(num(inputs.slumpTypeCode, 1));
      const hSubsided = Math.min(300, Math.max(0, num(inputs.subsidedHeightMm ?? inputs.slumpedHeightMm, 195)));
      const tempC = num(inputs.concreteTempC, 29.5);

      const slumpMm = 300 - hSubsided;
      const slumpIn = slumpMm / 25.4;
      const outsideMm = slumpMm < minTarget ? minTarget - slumpMm : slumpMm > maxTarget ? slumpMm - maxTarget : 0;

      const typeNames: Record<number, string> = {
        1: 'True Slump',
        2: 'Zero Slump',
        3: 'Shear Slump',
        4: 'Collapse Slump',
      };
      const slumpTypeLabel = typeNames[slumpTypeCode] || 'True Slump';

      let verdict: TestingLabVerdict = 'PASS';
      if (slumpTypeCode === 4 || outsideMm > 25 || tempC > 35 || slumpMm > 240) {
        verdict = 'FAIL';
      } else if (slumpTypeCode === 3 || (slumpTypeCode === 2 && minTarget > 25) || outsideMm > 0 || tempC > 32) {
        verdict = 'WARNING';
      }

      return {
        testId,
        primaryMetricLabel: { en: 'Measured Slump & Profile Type', bn: 'পরিমাপকৃত স্লাম্প ও আকৃতি' },
        primaryValue: `${fmt(slumpMm, 0)} mm (${fmt(slumpIn, 2)}") · ${slumpTypeLabel}`,
        primaryUnit: '',
        codeLimitText: `${preset.name}: ${minTarget}–${maxTarget} mm | True Slump | Temp ≤ 32°C`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — TRUE SLUMP WORKABILITY & TEMP PASS', bn: 'পাস — সঠিক ট্রু স্লাম্প ও নিরাপদ তাপমাত্রা' }
            : verdict === 'WARNING'
            ? slumpTypeCode === 3
              ? { en: 'SHEAR SLUMP — LACK OF COHESION, REMIX & RETEST', bn: 'সতর্কতা (শেয়ার স্লাম্প) — পুনরায় মিক্স করে আবার পরীক্ষা করুন' }
              : { en: 'BORDERLINE SLUMP / TEMP — CHECK ADMIXTURE ONLY', bn: 'সতর্কতা — স্লাম্প বা তাপমাত্রা সীমান্তবর্তী, কখনোই পানি মেশাবেন না' }
            : slumpTypeCode === 4
            ? { en: 'COLLAPSE SLUMP — EXCESS WATER / SEGREGATION, REJECT TRUCK', bn: 'ফেল (কলাপ্স স্লাম্প) — অতিরিক্ত পানি, পুরো মিক্সার ট্রাক ফেরত দিন' }
            : { en: 'OUT-OF-SPEC SLUMP OR OVERHEATED MIX — REJECT', bn: 'ফেল — স্লাম্প সীমার বাইরে বা অতিরিক্ত গরম কংক্রিট, ট্রাক ফেরত দিন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Slump = ${fmt(slumpMm, 0)} mm (${fmt(slumpIn, 2)} in) sits cleanly inside ${minTarget}–${maxTarget} mm (${preset.name}) with cohesive True Slump and ${fmt(tempC, 1)}°C ≤ 32°C.`, bn: `স্লাম্প ${fmt(slumpMm, 0)} মিমি (${fmt(slumpIn, 2)} ইঞ্চি) অনুমোদিত ${minTarget}–${maxTarget} মিমি সীমার ভেতর এবং ট্রু স্লাম্প ও তাপমাত্রা ${fmt(tempC, 1)}°সে নিরাপদ।` }
            : verdict === 'WARNING'
            ? { en: `${slumpTypeLabel} (${fmt(slumpMm, 0)} mm vs ${minTarget}–${maxTarget} mm, Temp ${fmt(tempC, 1)}°C). Remix drum 2 min and retest; adjust stiff mixes only with certified PCE superplasticizer.`, bn: `${slumpTypeLabel} (${fmt(slumpMm, 0)} মিমি বনাম ${minTarget}–${maxTarget} মিমি)—পানি না মিশিয়ে অ্যাডমিক্সচার দিয়ে বা ড্রাম ঘুরিয়ে ২য় পরীক্ষা করুন।` }
            : { en: `${slumpTypeLabel} (${fmt(slumpMm, 0)} mm) or temperature ${fmt(tempC, 1)}°C violates ASTM C143/C94 tolerances. Reject transit mixer immediately.`, bn: `${slumpTypeLabel} (${fmt(slumpMm, 0)} মিমি) বা তাপমাত্রা ${fmt(tempC, 1)}°সে গ্রহণযোগ্য নয়—গাড়ি ঢালাইয়ে ব্যবহার নিষেধ।` },
        metrics: [
          { labelEn: 'Slump (Millimeters)', labelBn: 'স্লাম্প (মিমি)', value: fmt(slumpMm, 0), unit: 'mm', highlight: true },
          { labelEn: 'Slump (Inches)', labelBn: 'স্লাম্প (ইঞ্চি)', value: fmt(slumpIn, 2), unit: 'in', highlight: true },
          { labelEn: 'Observed Profile', labelBn: 'স্লাম্পের আকৃতি', value: slumpTypeLabel, unit: '' },
          { labelEn: 'Concrete Temp', labelBn: 'কংক্রিট তাপমাত্রা', value: fmt(tempC, 1), unit: '°C' },
        ],
        steps: [
          `1. Cone Geometry: Bottom Ø200 mm (8") × Top Ø100 mm (4") × Height 300 mm (12"), 3 layers × 25 blows (Ø16 mm rod)`,
          `2. Slump = 300 - H_subsided = 300 - ${hSubsided} = ${fmt(slumpMm, 0)} mm (${fmt(slumpIn, 2)} in)`,
          `3. Target Band (${preset.name}): ${minTarget}–${maxTarget} mm | Observed Profile: ${slumpTypeLabel} | Temp: ${fmt(tempC, 1)}°C.`,
        ],
      };
    }

    // 4.2 CONCRETE CYLINDER & CUBE COMPRESSIVE STRENGTH (BNBC-2020 / ACI 318-19)
    case 'con-cylinder-cube': {
      const specTypeCode = Math.round(num(inputs.specTypeCode, 1));
      const fcMpa = Math.max(5, num(inputs.designFcMpa, 25));
      const ageD = Math.max(1, Math.round(num(inputs.testAgeDays, 28)));
      const p1 = Math.max(0, num(inputs.load1Kn, 475));
      const p2 = Math.max(0, num(inputs.load2Kn, 490));
      const p3 = Math.max(0, num(inputs.load3Kn, 465));

      const isCube = specTypeCode === 2;
      const isCyl100 = specTypeCode === 3;
      const areaMm2 = isCube ? 22500 : isCyl100 ? Math.PI * 50 * 50 : Math.PI * 75 * 75;
      const cylFactor = isCube ? 0.8 : 1.0;

      const s1 = (p1 * 1000) / areaMm2;
      const s2 = (p2 * 1000) / areaMm2;
      const s3 = (p3 * 1000) / areaMm2;
      const rawMeanMpa = (s1 + s2 + s3) / 3;
      const currEquivMpa = rawMeanMpa * cylFactor;
      const currMinSpecMpa = Math.min(s1, s2, s3) * cylFactor;

      const prev1 = num(inputs.prevTest1Mpa, currEquivMpa);
      const prev2 = num(inputs.prevTest2Mpa, currEquivMpa);
      const rolling3AvgMpa = (currEquivMpa + prev1 + prev2) / 3;

      // ACI 318-19 §26.12.3.1 / BNBC-2020 Single-Test Lower Bound
      const minSingleFloor28 = fcMpa <= 35 ? Math.max(0, fcMpa - 3.5) : 0.9 * fcMpa;

      const maturityFactor = ageD <= 7 ? 0.65 : ageD <= 14 ? 0.85 : 1.0;
      const maturityExpectRange = ageD <= 7 ? '65%–70%' : ageD <= 14 ? '85%–90%' : '≥ 100%';
      const reqEarlyMpa = fcMpa * maturityFactor;
      const dcr = currEquivMpa / (ageD >= 28 ? fcMpa : reqEarlyMpa);

      const aciRule1Pass = rolling3AvgMpa >= fcMpa;
      const minConsecutiveMpa = Math.min(currEquivMpa, prev1, prev2);
      const aciRule2Pass = minConsecutiveMpa >= minSingleFloor28;

      let verdict: TestingLabVerdict = 'PASS';
      if (ageD >= 28) {
        if (!aciRule2Pass || currEquivMpa < fcMpa * 0.85) verdict = 'FAIL';
        else if (!aciRule1Pass || currEquivMpa < fcMpa) verdict = 'WARNING';
      } else {
        if (currEquivMpa < reqEarlyMpa * 0.85) verdict = 'FAIL';
        else if (currEquivMpa < reqEarlyMpa) verdict = 'WARNING';
      }

      const specName = isCube ? '150×150mm Cube (0.80× Factor)' : isCyl100 ? 'Ø100×200mm Cylinder' : 'Ø150×300mm Cylinder';

      return {
        testId,
        primaryMetricLabel: { en: `${ageD}d Test Mean & 3-Test Rolling Avg`, bn: `${ageD}-দিনের গড় ও ৩-টেস্ট ধারাবাহিক গড়` },
        primaryValue: `${fmt(currEquivMpa, 2)} MPa (${fmt(currEquivMpa * 145.038, 0)} psi)`,
        primaryUnit: '',
        codeLimitText:
          ageD >= 28
            ? `3-Test Avg ≥ ${fmt(fcMpa, 1)} MPa & Single Test ≥ ${fmt(minSingleFloor28, 1)} MPa`
            : `${ageD}d Maturity Expect ${maturityExpectRange} (≥ ${fmt(reqEarlyMpa, 1)} MPa)`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — ${ageD}-DAY STRENGTH PASSES BNBC / ACI 318`, bn: `পাস — ${ageD}-দিনের শক্তি BNBC-2020 ও ACI 318 অনুযায়ী উত্তীর্ণ` }
            : verdict === 'WARNING'
            ? { en: ageD >= 28 ? '3-TEST ROLLING AVG BELOW f\'c — INVESTIGATE MIX' : `BELOW ${ageD}D MATURITY TARGET — EXTEND CURING`, bn: ageD >= 28 ? 'সতর্কতা — ৩-ব্যাচের গড় f\'c-এর নিচে, মিক্স যাচাই করুন' : `সতর্কতা — ${ageD}-দিনের প্রত্যাশিত হার কম, কিউরিং বাড়ান` }
            : { en: 'NON-CONFORMANT — BELOW ACI 318 LOWER BOUND, CORE TEST REQ.', bn: 'ফেল — সর্বনিম্ন কোড সীমার নিচে, ASTM C42 কোর টেস্ট আবশ্যক' },
        verdictDetail:
          verdict === 'PASS'
            ? {
                en:
                  ageD >= 28
                    ? `Current test = ${fmt(currEquivMpa, 2)} MPa; 3-Consecutive Avg = ${fmt(rolling3AvgMpa, 2)} MPa ≥ ${fmt(fcMpa, 1)} MPa and Lowest Test = ${fmt(minConsecutiveMpa, 2)} MPa ≥ ${fmt(minSingleFloor28, 1)} MPa.`
                    : `Achieved ${fmt((currEquivMpa / fcMpa) * 100, 1)}% of f'c at ${ageD}d (${fmt(currEquivMpa, 2)} MPa ≥ ${fmt(reqEarlyMpa, 1)} MPa; expected ${maturityExpectRange}).`,
                bn:
                  ageD >= 28
                    ? `বর্তমান গড় ${fmt(currEquivMpa, 2)} MPa, ৩টি ধারাবাহিক টেস্টের গড় ${fmt(rolling3AvgMpa, 2)} MPa (≥ ${fmt(fcMpa, 1)}) এবং সর্বনিম্ন ${fmt(minConsecutiveMpa, 2)} MPa (≥ ${fmt(minSingleFloor28, 1)})—সকল শর্ত পাস।`
                    : `${ageD} দিনে ডিজাইন শক্তির ${fmt((currEquivMpa / fcMpa) * 100, 1)}% অর্জিত হয়েছে (${fmt(currEquivMpa, 2)} MPa ≥ ${fmt(reqEarlyMpa, 1)} MPa)—সঠিক কিউরিং অগ্রগতি।`,
              }
            : verdict === 'WARNING'
            ? {
                en:
                  ageD >= 28
                    ? `Single test (${fmt(currEquivMpa, 2)} MPa) stays above floor ${fmt(minSingleFloor28, 1)} MPa, but 3-test average (${fmt(rolling3AvgMpa, 2)} MPa) fell below ${fmt(fcMpa, 1)} MPa. Increase cementitious factor & verify curing.`
                    : `Measured ${fmt(currEquivMpa, 2)} MPa (${fmt((currEquivMpa / fcMpa) * 100, 1)}%) lags ${maturityExpectRange} milestone. Keep formwork propped and test 28d cylinders.`,
                bn:
                  ageD >= 28
                    ? `৩-টেস্টের ধারাবাহিক গড় (${fmt(rolling3AvgMpa, 2)} MPa) ডিজাইন শক্তি ${fmt(fcMpa, 1)} MPa-এর নিচে—মিক্স ডিজাইন ও কিউরিং উন্নীত করুন।`
                    : `${ageD} দিনের লক্ষ্যমাত্রা (${maturityExpectRange}) থেকে কম—পানি কিউরিং বাড়িয়ে ২৮ দিনের টেস্টের অপেক্ষা করুন।`,
              }
            : {
                en: `Failed ACI 318 §26.12.3 threshold! Minimum test (${fmt(minConsecutiveMpa, 2)} MPa) fell below ${fmt(minSingleFloor28, 1)} MPa floor (f'c ${fcMpa <= 35 ? '- 3.5 MPa' : '× 0.90'}). Stop upper-floor pouring and take 3 ASTM C42 cores.`,
                bn: `সর্বনিম্ন কোড সীমা (${fmt(minSingleFloor28, 1)} MPa) লঙ্ঘিত হয়েছে! ওপরের ঢালাই স্থগিত করে ASTM C42 অনুযায়ী ৩টি কোর কাটিং টেস্ট করুন।`,
              },
        metrics: [
          { labelEn: 'Equiv. Cylinder Strength', labelBn: 'সিলিন্ডার সমতুল্য গড়', value: fmt(currEquivMpa, 2), unit: 'MPa', highlight: true },
          { labelEn: '3-Consecutive Test Avg', labelBn: '৩-টেস্ট ধারাবাহিক গড়', value: fmt(rolling3AvgMpa, 2), unit: 'MPa', highlight: true },
          { labelEn: 'Strength in PSI / Maturity', labelBn: 'শক্তি (psi) / অর্জন হার', value: `${fmt(currEquivMpa * 145.038, 0)} psi (${fmt((currEquivMpa / fcMpa) * 100, 0)}%)`, unit: '' },
          { labelEn: 'ACI Lower Bound Floor', labelBn: 'একক সর্বনিম্ন সীমা', value: fmt(minSingleFloor28, 1), unit: 'MPa' },
        ],
        steps: [
          `1. ${specName}: A = ${fmt(areaMm2, 1)} mm² | Raw Specimen Mean = ${fmt(rawMeanMpa, 2)} MPa → Cyl. Equiv = ${fmt(currEquivMpa, 2)} MPa (Lowest = ${fmt(currMinSpecMpa, 2)} MPa)`,
          `2. ACI 318 Rule 1 (3-Test Avg ≥ f'c): (${fmt(currEquivMpa, 2)} + ${fmt(prev1, 2)} + ${fmt(prev2, 2)}) / 3 = ${fmt(rolling3AvgMpa, 2)} MPa vs ${fmt(fcMpa, 1)} MPa → ${aciRule1Pass ? 'OK' : 'BELOW f\'c'}`,
          `3. ACI 318 Rule 2 (No Test < ${fcMpa <= 35 ? 'f\'c - 3.5' : '0.90·f\'c'}): Min = ${fmt(minConsecutiveMpa, 2)} MPa vs ${fmt(minSingleFloor28, 1)} MPa → ${aciRule2Pass ? 'OK' : 'VIOLATED'} | DCR = ${fmt(dcr, 2)}×.`,
        ],
      };
    }

    // 4.3 DRILLED CONCRETE CORE TEST (ASTM C42 / ACI 318)
    case 'con-core-cutting': {
      const dia = Math.max(40, num(inputs.coreDiaMm, 100));
      const len = Math.max(40, num(inputs.coreLenMm, 175));
      const designFc = Math.max(10, num(inputs.designFcMpa, 25));
      const p1 = Math.max(0, num(inputs.core1LoadKn, 178));
      const p2 = Math.max(0, num(inputs.core2LoadKn, 184));
      const p3 = Math.max(0, num(inputs.core3LoadKn, 172));

      const ld = len / dia;
      // ASTM C42 piecewise linear k_ld interpolation: 1.00->0.87, 1.25->0.93, 1.50->0.96, 1.75->0.98, 2.00->1.00
      let kLd = 1.0;
      if (ld <= 1.0) kLd = 0.87;
      else if (ld <= 1.25) kLd = 0.87 + ((ld - 1.0) / 0.25) * (0.93 - 0.87);
      else if (ld <= 1.5) kLd = 0.93 + ((ld - 1.25) / 0.25) * (0.96 - 0.93);
      else if (ld <= 1.75) kLd = 0.96 + ((ld - 1.5) / 0.25) * (0.98 - 0.96);
      else if (ld < 2.0) kLd = 0.98 + ((ld - 1.75) / 0.25) * (1.0 - 0.98);
      else kLd = 1.0;

      const areaMm2 = (Math.PI * dia * dia) / 4;
      const f1 = kLd * ((p1 * 1000) / areaMm2);
      const f2 = kLd * ((p2 * 1000) / areaMm2);
      const f3 = kLd * ((p3 * 1000) / areaMm2);

      const coreAvg = (f1 + f2 + f3) / 3;
      const coreMin = Math.min(f1, f2, f3);
      const reqAvg = 0.85 * designFc;
      const reqMin = 0.75 * designFc;
      const ldValid = ld >= 1.0 && ld <= 2.1;

      let verdict: TestingLabVerdict = 'PASS';
      if (coreAvg < reqAvg || coreMin < reqMin) verdict = 'FAIL';
      else if (!ldValid) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: '3-Core Corrected Avg & Min Core', bn: '৩ কোরের সংশোধিত গড় ও সর্বনিম্ন' },
        primaryValue: `Avg ${fmt(coreAvg, 2)} / Min ${fmt(coreMin, 2)} MPa`,
        primaryUnit: '',
        codeLimitText: `ACI 318: Avg ≥ 0.85·f'c (${fmt(reqAvg, 2)} MPa) & Min ≥ 0.75·f'c (${fmt(reqMin, 2)} MPa)`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — IN-SITU CORE ADEQUACY VERIFIED', bn: 'পাস — কোরের শক্তি ACI 318 ও BNBC অনুযায়ী নিরাপদ' }
            : verdict === 'WARNING'
            ? { en: 'L/D ASPECT RATIO OUTSIDE 1.0–2.0 — RE-DRILL', bn: 'সতর্কতা — L/D অনুপাত ১.০০–২.০০-এর বাইরে, নতুন কোর কাটুন' }
            : { en: 'STRUCTURAL CORE FAILURE — JACKETING / RETROFIT REQ.', bn: 'ফেল — ইন-সিটু কংক্রিট দুর্বল, জ্যাকেটিং বা রেট্রোফিটিং জরুরি' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `L/D = ${fmt(ld, 2)} (k_ld = ${fmt(kLd, 3)}). Corrected 3-Core Avg = ${fmt(coreAvg, 2)} MPa (≥ ${fmt(reqAvg, 2)}) and Min Core = ${fmt(coreMin, 2)} MPa (≥ ${fmt(reqMin, 2)}).`, bn: `L/D = ${fmt(ld, 2)} (k_ld = ${fmt(kLd, 3)})। সংশোধিত গড় শক্তি ${fmt(coreAvg, 2)} MPa (≥ ${fmt(reqAvg, 2)}) এবং সর্বনিম্ন ${fmt(coreMin, 2)} MPa (≥ ${fmt(reqMin, 2)})—স্ট্রাকচার নিরাপদ।` }
            : verdict === 'WARNING'
            ? { en: `Strength exceeded thresholds, but core L/D = ${fmt(ld, 2)} is outside ASTM C42 1.00–2.00 range. Extract compliant cores to certify.`, bn: `কোরের L/D অনুপাত ${fmt(ld, 2)} (সীমা ১.০০–২.০০-এর বাইরে)—সঠিক মাপের কোর কেটে পুনঃপরীক্ষা করুন।` }
            : { en: `Failed ACI 318 §26.12.4: Core Avg (${fmt(coreAvg, 2)} vs ≥${fmt(reqAvg, 2)}) or Min Core (${fmt(coreMin, 2)} vs ≥${fmt(reqMin, 2)}). Perform RC jacketing / load test.`, bn: `৩ কোরের গড় (${fmt(coreAvg, 2)} < ${fmt(reqAvg, 2)}) বা একক কোর (${fmt(coreMin, 2)} < ${fmt(reqMin, 2)}) ফেল করেছে! আরসিসি জ্যাকেটিং বা লোড টেস্ট আবশ্যক।` },
        metrics: [
          { labelEn: 'Corrected 3-Core Mean', labelBn: 'সংশোধিত ৩-কোর গড়', value: fmt(coreAvg, 2), unit: 'MPa', highlight: true },
          { labelEn: 'Lowest Single Core', labelBn: 'সর্বনিম্ন একক কোর', value: fmt(coreMin, 2), unit: 'MPa', highlight: true },
          { labelEn: 'L/D Aspect & k_ld Factor', labelBn: 'L/D অনুপাত ও k_ld ফ্যাক্টর', value: `${fmt(ld, 2)} (k=${fmt(kLd, 3)})`, unit: '' },
          { labelEn: 'Mean Core % of f\'c', labelBn: 'f\'c-এর কত % অর্জিত', value: fmt((coreAvg / designFc) * 100, 1), unit: '%' },
        ],
        steps: [
          `1. Core Area A = π×${dia}²/4 = ${fmt(areaMm2, 1)} mm² | Aspect L/D = ${len}/${dia} = ${fmt(ld, 2)} → k_ld = ${fmt(kLd, 3)}`,
          `2. Corrected Cores = [${fmt(f1, 2)}, ${fmt(f2, 2)}, ${fmt(f3, 2)}] MPa → Avg = ${fmt(coreAvg, 2)} MPa | Min = ${fmt(coreMin, 2)} MPa`,
          `3. ACI 318 Audit: Avg ≥ ${fmt(reqAvg, 2)} MPa (0.85·f'c) & Min ≥ ${fmt(reqMin, 2)} MPa (0.75·f'c).`,
        ],
      };
    }

    // 4.4 REBOUND (SCHMIDT) HAMMER NDT (ASTM C805)
    case 'con-rebound-hammer': {
      const alpha = Math.round(num(inputs.strikeAngleCode, 0));
      const targetFc = Math.max(10, num(inputs.targetFcMpa, 25));

      // Check if 10-reading grid r1..r10 is populated in draftInputs
      const gridVals: number[] = [];
      for (let i = 1; i <= 10; i++) {
        const v = inputs[`r${i}`];
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) gridVals.push(v);
      }

      let rawMean = num(inputs.rawMeanRebound, 36.0);
      let outlierCount = 0;
      let validCount = 10;

      if (gridVals.length >= 6) {
        const initMean = gridVals.reduce((a, b) => a + b, 0) / gridVals.length;
        const kept = gridVals.filter((v) => Math.abs(v - initMean) <= 6.0);
        outlierCount = gridVals.length - kept.length;
        validCount = kept.length;
        rawMean = kept.length > 0 ? kept.reduce((a, b) => a + b, 0) / kept.length : initMean;
      }

      const angleAdj = alpha === 90 ? -2.8 : alpha === -90 ? 3.0 : 0.0;
      const rCorr = Math.max(10, rawMean + angleAdj);
      const estFcMpa = Math.max(5, 0.025 * rCorr * rCorr - 0.35 * rCorr + 4.0);
      const ratio = estFcMpa / targetFc;
      const surfaceQuality =
        rCorr > 40 ? 'Very Good Hard Layer' : rCorr >= 30 ? 'Good Layer' : rCorr >= 20 ? 'Fair Surface' : 'Poor / Delaminated';

      let verdict: TestingLabVerdict = 'PASS';
      if (rCorr < 20 || ratio < 0.75) verdict = 'FAIL';
      else if (outlierCount > 2 || rCorr < 30 || ratio < 0.85) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Corrected Rebound (R_n) & Est. f\'c', bn: 'সমন্বিত রিবাউন্ড (R_n) ও আনুমানিক শক্তি' },
        primaryValue: `R_n ${fmt(rCorr, 1)} | ~${fmt(estFcMpa, 1)} MPa (${surfaceQuality})`,
        primaryUnit: '',
        codeLimitText: `R_n ≥ 30 (Good) | ≤ 2 Outliers (>±6) | Est. ≥ 0.85·f'c (${fmt(0.85 * targetFc, 1)} MPa)`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — GOOD CONCRETE SURFACE HARDNESS', bn: 'পাস — কংক্রিটের পৃষ্ঠের দৃঢ়তা উত্তম' }
            : verdict === 'WARNING'
            ? outlierCount > 2
              ? { en: `HIGH SCATTER (${outlierCount} OUTLIERS >±6) — DISCARD SET & RETEST`, bn: `সতর্কতা — ${outlierCount}টি আউটলায়ার (>±৬), পুরো সেট পুনরায় টেস্ট করুন` }
              : { en: 'FAIR / BORDERLINE HARDNESS — PAIR WITH UPV OR CORE', bn: 'সতর্কতা — মাঝারি দৃঢ়তা, ইউপিভি বা কোর টেস্টে নিশ্চিত হোন' }
            : { en: 'LOW REBOUND / WEAK SURFACE — CORE TEST MANDATORY', bn: 'ফেল — পৃষ্ঠের শক্তি অত্যন্ত কম, অবিলম্বে কোর কাটিং করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Raw valid mean (${validCount} readings, ${outlierCount} outliers >±6 discarded) = ${fmt(rawMean, 1)}; angle-corrected R_n = ${fmt(rCorr, 1)} (${surfaceQuality}) → Est. f'c ≈ ${fmt(estFcMpa, 1)} MPa (≥ 85% of ${targetFc} MPa).`, bn: `গড় রিডিং ${fmt(rawMean, 1)} (${outlierCount}টি আউটলায়ার বাদ), কোণ সমন্বয়ের পর R_n = ${fmt(rCorr, 1)} (${surfaceQuality}) → আনুমানিক শক্তি ≈ ${fmt(estFcMpa, 1)} MPa।` }
            : verdict === 'WARNING'
            ? { en: `${outlierCount > 2 ? `${outlierCount} readings deviated >±6 from grid mean (ASTM C805 invalidates set). ` : ''}Corrected R_n = ${fmt(rCorr, 1)} (~${fmt(estFcMpa, 1)} MPa). Grind concrete smoother & verify with UPV/Cores.`, bn: `গ্রিড রিডিংয়ে অসামঞ্জস্য (${outlierCount} আউটলায়ার) অথবা R_n = ${fmt(rCorr, 1)} (~${fmt(estFcMpa, 1)} MPa)—মসৃণ করে পুনঃপরীক্ষা ও ইউপিভি করুন।` }
            : { en: `Corrected R_n = ${fmt(rCorr, 1)} (~${fmt(estFcMpa, 1)} MPa < 75% of ${targetFc} MPa). Extract 3 ASTM C42 drilled cores to establish true structural strength.`, bn: `সমন্বিত রিবাউন্ড মাত্র ${fmt(rCorr, 1)} (~${fmt(estFcMpa, 1)} MPa)—সত্যিকারের শক্তি জানতে ASTM C42 কোর কাটিং আবশ্যক।` },
        metrics: [
          { labelEn: 'Angle-Corrected R_n', labelBn: 'সমন্বিত রিবাউন্ড (R_n)', value: fmt(rCorr, 1), unit: 'R', highlight: true },
          { labelEn: 'Est. In-Situ Strength', labelBn: 'আনুমানিক শক্তি', value: `${fmt(estFcMpa, 1)} MPa (${fmt(estFcMpa * 145.038, 0)} psi)`, unit: '', highlight: true },
          { labelEn: 'IS 13311 Surface Class', labelBn: 'পৃষ্ঠের মান শ্রেণি', value: surfaceQuality, unit: '' },
          { labelEn: 'Discarded Outliers (>±6)', labelBn: 'বাদ দেয়া আউটলায়ার', value: `${outlierCount} (${validCount} kept)`, unit: 'pts' },
        ],
        steps: [
          `1. Valid Raw Mean (${validCount} kept, ${outlierCount} discarded >±6) = ${fmt(rawMean, 1)} | Strike Angle α = ${alpha}° (Δα = ${angleAdj >= 0 ? '+' : ''}${fmt(angleAdj, 1)})`,
          `2. Corrected R_n = ${fmt(rawMean, 1)} + (${fmt(angleAdj, 1)}) = ${fmt(rCorr, 1)} (${surfaceQuality})`,
          `3. Empirical Strength = 0.025·(${fmt(rCorr, 1)})² - 0.35·(${fmt(rCorr, 1)}) + 4.0 = ${fmt(estFcMpa, 1)} MPa (${fmt(ratio * 100, 0)}% of ${targetFc} MPa).`,
        ],
      };
    }

    // 4.5 ULTRASONIC PULSE VELOCITY (UPV) NDT (ASTM C597 / IS 13311)
    case 'con-upv': {
      const txMode = Math.round(num(inputs.txModeCode, 1));
      const pathMm = Math.max(50, num(inputs.upvPathMm, 375));
      const timeUs = Math.max(5, num(inputs.upvTimeUs, 88));

      const vKms = pathMm / timeUs;
      const vMs = vKms * 1000;
      const modeName = txMode === 1 ? 'Direct' : txMode === 2 ? 'Semi-Direct' : 'Indirect (Surface)';
      const qualityClass =
        vKms > 4.5 ? 'Excellent' : vKms >= 3.5 ? 'Good' : vKms >= 3.0 ? 'Medium / Doubtful' : 'Poor / Honeycombed';

      let verdict: TestingLabVerdict = 'PASS';
      if (vKms < 3.0) verdict = 'FAIL';
      else if (vKms < 3.5) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Pulse Velocity (V) & Concrete Quality', bn: 'পালস ভেলোসিটি (V) ও কংক্রিটের মান' },
        primaryValue: `${fmt(vKms, 2)} km/s (${fmt(vMs, 0)} m/s) · ${qualityClass}`,
        primaryUnit: '',
        codeLimitText: 'IS 13311: >4.5 Excellent | 3.5–4.5 Good | 3.0–3.5 Medium | <3.0 Poor',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — ${qualityClass.toUpperCase()} HOMOGENEOUS CONCRETE`, bn: `পাস — ${vKms > 4.5 ? 'অতি উত্তম' : 'ভালো'} ও ফাঁকামুক্ত কংক্রিট` }
            : verdict === 'WARNING'
            ? { en: 'MEDIUM / DOUBTFUL VELOCITY — DENSE GRID & CORE VERIFY', bn: 'সতর্কতা — মাঝারি বা সন্দেহজনক ঘনত্ব, কোর টেস্ট করুন' }
            : { en: 'POOR / HONEYCOMBED (<3.0 km/s) — GROUT & CORE AUDIT', bn: 'ফেল — অভ্যন্তরীণ হানিকম্ব বা ফাটল (<৩.০ km/s), গ্রাউটিং জরুরি' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `${modeName} UPV = ${fmt(vKms, 2)} km/s (${fmt(vMs, 0)} m/s) classifies concrete as "${qualityClass}" per IS 13311—dense matrix without internal voids.`, bn: `${modeName} পদ্ধতিতে পালস বেগ ${fmt(vKms, 2)} km/s (${fmt(vMs, 0)} m/s) যা "${qualityClass}" শ্রেণির ঘন ও নিরেট কংক্রিট প্রমাণ করে।` }
            : verdict === 'WARNING'
            ? { en: `UPV = ${fmt(vKms, 2)} km/s falls in 3.00–3.49 km/s Medium/Doubtful zone. ${txMode === 3 ? 'Note: Indirect surface paths naturally read lower—verify via Direct face-to-face mode or drilled core.' : 'Inspect tighter grid and confirm with ASTM C42 core.'}`, bn: `ইউপিভি বেগ ${fmt(vKms, 2)} km/s (৩.০–৩.৫ মাঝারি মান)—ঘন গ্রিডে ডিরেক্ট মোডে চেক করে কোর টেস্ট দিয়ে নিশ্চিত হোন।` }
            : { en: `Low pulse velocity ${fmt(vKms, 2)} km/s (< 3.0 km/s) indicates deep internal honeycombing, air voids, or cracks. Perform pressure grouting & core testing.`, bn: `পালস বেগ ৩.০ km/s-এর নিচে (${fmt(vKms, 2)})—ভেতরে বড় ফাঁকা/হানিকম্ব রয়েছে; প্রেশার গ্রাউটিং ও কোর টেস্ট প্রয়োজন।` },
        metrics: [
          { labelEn: 'Pulse Velocity (km/s)', labelBn: 'পালস ভেলোসিটি (km/s)', value: fmt(vKms, 3), unit: 'km/s', highlight: true },
          { labelEn: 'Pulse Velocity (m/s)', labelBn: 'পালস ভেলোসিটি (m/s)', value: fmt(vMs, 0), unit: 'm/s' },
          { labelEn: 'IS 13311 Quality Grade', labelBn: 'কংক্রিটের গুণগত মান', value: qualityClass, unit: '', highlight: true },
          { labelEn: 'Transmission Path Mode', labelBn: 'পরীক্ষার মোড', value: modeName, unit: '' },
        ],
        steps: [
          `1. Mode = ${modeName} | Path Length L = ${pathMm} mm | Transit Time T = ${timeUs} µs`,
          `2. V (km/s) = L_mm / T_µs = ${pathMm} / ${timeUs} = ${fmt(vKms, 3)} km/s (${fmt(vMs, 0)} m/s)`,
          `3. IS 13311 Classification: ${qualityClass} (>4.5 Excellent; 3.5–4.5 Good; 3.0–3.5 Medium; <3.0 Poor).`,
        ],
      };
    }

    // Legacy backward-compatibility fallback if an old saved record loads 'con-ndt-rebound-upv'
    case 'con-ndt-rebound-upv': {
      const rNum = Math.max(10, num(inputs.meanRebound, 35));
      const pathMm = Math.max(50, num(inputs.upvPathMm, 375));
      const timeUs = Math.max(5, num(inputs.upvTimeUs, 90));
      const targetFc = Math.max(10, num(inputs.targetFcMpa, 25));
      const velocityKms = pathMm / timeUs;
      const estFcMpa = Math.max(5, 0.025 * rNum * rNum - 0.35 * rNum + 4.0);
      const ratio = estFcMpa / targetFc;
      let verdict: TestingLabVerdict = 'PASS';
      if (velocityKms < 3.0 || ratio < 0.75) verdict = 'FAIL';
      else if (velocityKms < 3.5 || ratio < 0.85) verdict = 'WARNING';
      return {
        testId,
        primaryMetricLabel: { en: 'UPV Pulse Velocity & Est. Strength', bn: 'ইউপিভি বেগ ও আনুমানিক শক্তি' },
        primaryValue: `${fmt(velocityKms, 2)} km/s | ${fmt(estFcMpa, 1)} MPa`,
        primaryUnit: '',
        codeLimitText: 'UPV ≥ 3.50 km/s (Good) | Est f\'c ≥ 0.85·Target',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — GOOD HOMOGENEOUS CONCRETE', bn: 'পাস — ঘন ও ফাঁকা-মুক্ত কংক্রিট' }
            : verdict === 'WARNING'
            ? { en: 'MEDIUM / QUESTIONABLE — CORE VERIFY', bn: 'সতর্কতা — মাঝারি ঘনত্ব, কোর টেস্টে নিশ্চিত হোন' }
            : { en: 'POOR QUALITY / INTERNAL VOIDS DETECTED', bn: 'ফেল — অভ্যন্তরীণ হানিকম্ব বা শক্তি ঘাটতি' },
        verdictDetail: {
          en: `UPV = ${fmt(velocityKms, 2)} km/s and Rebound R = ${rNum} (~${fmt(estFcMpa, 1)} MPa).`,
          bn: `ইউপিভি বেগ ${fmt(velocityKms, 2)} km/s এবং রিবাউন্ড আনুমানিক শক্তি ${fmt(estFcMpa, 1)} MPa।`,
        },
        metrics: [
          { labelEn: 'Ultrasonic Velocity (V)', labelBn: 'পালস ভেলোসিটি (V)', value: fmt(velocityKms, 2), unit: 'km/s', highlight: true },
          { labelEn: 'Est. Rebound Strength', labelBn: 'রিবাউন্ড আনুমানিক শক্তি', value: fmt(estFcMpa, 1), unit: 'MPa', highlight: true },
        ],
        steps: [
          `1. Pulse Velocity V = ${pathMm} / ${timeUs} = ${fmt(velocityKms, 3)} km/s`,
          `2. Est. Strength f_est = ${fmt(estFcMpa, 1)} MPa.`,
        ],
      };
    }

    // 4.6 FERROSCAN / COVER METER & HALF-CELL CORROSION POTENTIAL (ASTM C876)
    case 'con-cover-halfcell': {
      const memberCode = Math.round(num(inputs.memberTypeCode, 3));
      const coverMm = Math.max(0, num(inputs.measuredCoverMm, 42));
      const mv = num(inputs.halfCellMv, -145);

      const members: Record<number, { name: string; minCover: number }> = {
        1: { name: 'Earth-Cast / Pile Cap', minCover: 75 },
        2: { name: 'Soil / Weather / Coastal Exposed', minCover: 50 },
        3: { name: 'Interior Beam / Column', minCover: 40 },
        4: { name: 'Interior Slab / Joist', minCover: 20 },
      };
      const mem = members[memberCode] || members[3];
      const deficitMm = Math.max(0, mem.minCover - coverMm);

      const corrosionRisk =
        mv > -200 ? '<10% Low Corrosion Risk' : mv >= -350 ? 'Uncertain Activity (-200 to -350 mV)' : '>90% Active Steel Corrosion';

      let verdict: TestingLabVerdict = 'PASS';
      if (mv < -350 || deficitMm > 5) verdict = 'FAIL';
      else if (mv <= -200 || deficitMm > 0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Clear Cover & Half-Cell Corrosion Status', bn: 'রডের কভার ও মরিচার ঝুঁকি' },
        primaryValue: `${fmt(coverMm, 0)} mm Cover | ${fmt(mv, 0)} mV CSE`,
        primaryUnit: '',
        codeLimitText: `BNBC Min Cover ≥ ${mem.minCover} mm (${mem.name}) | Half-Cell > -200 mV`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — ADEQUATE COVER & PASSIVE REBAR', bn: 'পাস — রডের কভার সঠিক ও মরিচা ঝুঁকি <১০%' }
            : verdict === 'WARNING'
            ? { en: 'UNCERTAIN CORROSION OR MINOR COVER SHORTFALL', bn: 'সতর্কতা — কভার সামান্য কম বা মরিচার ঝুঁকি সন্দেহজনক' }
            : { en: 'ACTIVE CORROSION (>90%) OR SEVERE COVER DEFICIT', bn: 'ফেল — সক্রিয় মরিচা (>৯০%) অথবা কভার মারাত্মক কম' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Cover ${fmt(coverMm, 0)} mm meets BNBC ${mem.minCover} mm minimum and Half-Cell ${fmt(mv, 0)} mV (> -200 mV) confirms <10% corrosion risk.`, bn: `ক্লিয়ার কভার ${fmt(coverMm, 0)} মিমি (ন্যূনতম ${mem.minCover} মিমি) এবং হাফ-সেল ${fmt(mv, 0)} mV (> -২০০ mV)—মরিচার ঝুঁকি ১০%-এর নিচে।` }
            : verdict === 'WARNING'
            ? { en: `Cover ${fmt(coverMm, 0)} mm vs ${mem.minCover} mm or Half-Cell ${fmt(mv, 0)} mV (-200 to -350 mV Uncertain). Apply anti-carbonation & MCI barrier coating.`, bn: `কভার বা হাফ-সেল (${fmt(mv, 0)} mV) সতর্কতা জোনে—অ্যান্টি-কার্বনেশন ও করোশন ইনহিবিটর প্রলেপ দিন।` }
            : { en: `Severe cover deficit (${fmt(deficitMm, 0)} mm short) or active corrosion (${fmt(mv, 0)} mV < -350 mV = >90% probability). Chip, clean rebar, apply zinc-epoxy & repair mortar.`, bn: `ভেতরের রডে সক্রিয় মরিচা (>৯০%) বা কভার >৫ মিমি কম—খুঁড়ে রড পরিষ্কার করে জিংক-ইপোক্সি প্রাইমার ও পলিমার মর্টারে মেরামত করুন।` },
        metrics: [
          { labelEn: 'Measured Clear Cover', labelBn: 'পরিমাপকৃত কভার', value: fmt(coverMm, 0), unit: 'mm', highlight: true },
          { labelEn: 'BNBC Required Cover', labelBn: 'BNBC ন্যূনতম কভার', value: fmt(mem.minCover, 0), unit: 'mm' },
          { labelEn: 'Half-Cell Potential', labelBn: 'হাফ-সেল ভোল্টেজ', value: fmt(mv, 0), unit: 'mV CSE', highlight: true },
          { labelEn: 'ASTM C876 Corrosion Risk', labelBn: 'মরিচার সম্ভাবনা', value: corrosionRisk, unit: '' },
        ],
        steps: [
          `1. Cover Audit (${mem.name}): Measured ${coverMm} mm vs BNBC Min ${mem.minCover} mm (Margin = ${coverMm - mem.minCover >= 0 ? '+' : ''}${coverMm - mem.minCover} mm)`,
          `2. Half-Cell Potential = ${mv} mV vs Cu/CuSO₄ → ${corrosionRisk} (>-200 Safe, -200..-350 Uncertain, <-350 Active).`,
        ],
      };
    }

    // =======================================================================
    // CATEGORY 5: REINFORCING STEEL BAR (REBAR) TESTS (4 TESTS)
    // =======================================================================

    // 5.1 FIELD UNIT WEIGHT PER METER & ROLLING MARGIN TOLERANCE
    case 'reb-unit-weight': {
      const dia = Math.max(6, num(inputs.barDiaMm, 16));
      const lenMm = Math.max(50, num(inputs.cutLengthMm, 1000));
      const massG = Math.max(1, num(inputs.measuredMassG, 1552));

      const wStdKgM = (dia * dia) / 162.2;
      const wStdKgFt = (dia * dia) / 532.15;
      const wActKgM = massG / lenMm;
      const wActKgFt = wActKgM * 0.3048;
      const marginPct = ((wActKgM - wStdKgM) / wStdKgM) * 100;
      const tolLimit = dia <= 12 ? 6.0 : 4.5;

      const nomAreaMm2 = (Math.PI * dia * dia) / 4;
      const effAreaMm2 = nomAreaMm2 * (wActKgM / wStdKgM);

      let verdict: TestingLabVerdict = 'PASS';
      if (marginPct < -6.0 || marginPct > tolLimit + 2.0) verdict = 'FAIL';
      else if (Math.abs(marginPct) > tolLimit) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Actual Unit Weight & Rolling Margin', bn: 'প্রকৃত একক ওজন ও রোলিং মার্জিন' },
        primaryValue: `${fmt(wActKgM, 3)} kg/m (${fmt(wActKgFt, 3)} kg/ft) · ${marginPct >= 0 ? '+' : ''}${fmt(marginPct, 2)}%`,
        primaryUnit: '',
        codeLimitText: `Std ${fmt(wStdKgM, 3)} kg/m (${fmt(wStdKgFt, 3)} kg/ft) | BDS Tol ±${tolLimit}%`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — FULL-SECTION BAR MASS & AREA PASS', bn: 'পাস — রডের একক ওজন ও ক্ষেত্রফল কোড অনুযায়ী সঠিক' }
            : verdict === 'WARNING'
            ? { en: 'OUTSIDE ROLLING TOLERANCE — RE-CHECK BUNDLES / SPACING', bn: 'সতর্কতা — রোলিং মার্জিন সীমার বাইরে, বান্ডিল চেক ও স্পেসিং সমন্বয়' }
            : { en: 'UNDERSIZED (> 6% LIGHT) — REJECT TRUCKLOAD', bn: 'ফেল (>৬% হালকা) — আন্ডারসাইজ রড, ট্রাক ফেরত পাঠান' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Measured ${fmt(wActKgM, 3)} kg/m (${fmt(wActKgFt, 3)} kg/ft) deviates ${marginPct >= 0 ? '+' : ''}${fmt(marginPct, 2)}% from ${fmt(wStdKgM, 3)} kg/m—within BDS ISO 6935-2 ±${tolLimit}% tolerance. Effective area A_s,eff = ${fmt(effAreaMm2, 1)} mm².`, bn: `প্রাপ্ত ওজন ${fmt(wActKgM, 3)} kg/m (${fmt(wActKgFt, 3)} kg/ft), বিচ্যুতি ${marginPct >= 0 ? '+' : ''}${fmt(marginPct, 2)}% যা ±${tolLimit}% সীমার ভেতর। কার্যকর ক্ষেত্রফল ${fmt(effAreaMm2, 1)} মিমি²।` }
            : verdict === 'WARNING'
            ? { en: `Deviation ${fmt(marginPct, 2)}% breaches ±${tolLimit}% rolling margin. Effective area drops to ${fmt(effAreaMm2, 1)} mm² vs ${fmt(nomAreaMm2, 1)} mm² nominal—verify 3 random bundles & adjust bar spacing.`, bn: `ওজন বিচ্যুতি ${fmt(marginPct, 2)}% (±${tolLimit}% সীমা ছাড়িয়েছে)—কার্যকর ক্ষেত্রফল ${fmt(effAreaMm2, 1)} মিমি²; আরও ৩টি বান্ডিল মেপে স্পেসিং সমন্বয় করুন।` }
            : { en: `Severe mass deficit (${fmt(marginPct, 2)}% < -6.0%). Effective steel area drops to ${fmt(effAreaMm2, 1)} mm². Reject consignment before unloading.`, bn: `রড ৬%-এর বেশি হালকা (${fmt(marginPct, 2)}%)—মূল লোহার ক্ষেত্রফল কমে যাওয়ায় পুরো চালান আনলোড না করে ফেরত দিন।` },
        metrics: [
          { labelEn: 'Actual Weight (kg/m | kg/ft)', labelBn: 'প্রকৃত ওজন (kg/m | kg/ft)', value: `${fmt(wActKgM, 3)} | ${fmt(wActKgFt, 3)}`, unit: '', highlight: true },
          { labelEn: 'Standard Weight (d²/162.2)', labelBn: 'আদর্শ ওজন (d²/১৬২.২)', value: `${fmt(wStdKgM, 3)} | ${fmt(wStdKgFt, 3)}`, unit: 'kg/m|ft' },
          { labelEn: 'Rolling Margin Deviation', labelBn: 'রোলিং মার্জিন বিচ্যুতি', value: `${marginPct >= 0 ? '+' : ''}${fmt(marginPct, 2)}`, unit: '%', highlight: true },
          { labelEn: 'Effective Steel Area (A_s,eff)', labelBn: 'কার্যকর ক্ষেত্রফল (A_s,eff)', value: `${fmt(effAreaMm2, 1)} / ${fmt(nomAreaMm2, 1)}`, unit: 'mm²' },
        ],
        steps: [
          `1. Theoretical w_std = ${dia}²/162.2 = ${fmt(wStdKgM, 3)} kg/m (${dia}²/532.15 = ${fmt(wStdKgFt, 3)} kg/ft)`,
          `2. Actual w_act = ${massG} g / ${lenMm} mm = ${fmt(wActKgM, 3)} kg/m (${fmt(wActKgFt, 3)} kg/ft) → Margin = ${marginPct >= 0 ? '+' : ''}${fmt(marginPct, 2)}% (Limit ±${tolLimit}%)`,
          `3. Effective Steel Area A_s,eff = ${fmt(nomAreaMm2, 1)} × (${fmt(wActKgM, 3)}/${fmt(wStdKgM, 3)}) = ${fmt(effAreaMm2, 1)} mm² (${fmt((effAreaMm2 / nomAreaMm2) * 100, 1)}% of nominal).`,
        ],
      };
    }

    // 5.2 UTM TENSILE YIELD (fy), ULTIMATE (fu) & SEISMIC DUCTILITY RATIO (fu/fy)
    case 'reb-tensile-yield': {
      const gradeCode = Math.round(num(inputs.steelGradeCode, 1));
      const grades: Record<number, { label: string; minFy: number; maxFy: number; minRatio: number }> = {
        1: { label: 'BNBC 500W / B500DWR', minFy: 500, maxFy: 625, minRatio: 1.25 },
        2: { label: 'ASTM A706 Grade 60', minFy: 420, maxFy: 545, minRatio: 1.25 },
        3: { label: 'BDS 400W Seismic', minFy: 400, maxFy: 525, minRatio: 1.25 },
        4: { label: 'BDS ISO B500C', minFy: 500, maxFy: 625, minRatio: 1.15 },
      };
      // Support legacy targetYieldMpa if loaded from older saved record
      const legacyFy = inputs.steelGradeCode === undefined && inputs.targetYieldMpa !== undefined ? num(inputs.targetYieldMpa, 500) : undefined;
      const g = grades[gradeCode] || grades[1];
      const specMinFy = legacyFy ?? g.minFy;
      const specMaxFy = specMinFy + 125;
      const reqRatio = legacyFy ? 1.15 : g.minRatio;

      const dia = Math.max(6, num(inputs.barDiaMm, 16));
      const wMeas = num(inputs.measuredUnitWtKgM, 0);
      const dEff = wMeas > 0 ? Math.sqrt(162.2 * wMeas) : dia;
      const areaEff = (Math.PI * dEff * dEff) / 4;

      const py = Math.max(0, num(inputs.yieldLoadKn, 109));
      const pu = Math.max(0, num(inputs.ultimateLoadKn, 138));
      const fy = (py * 1000) / areaEff;
      const fu = (pu * 1000) / areaEff;
      const ratio = fy > 0 ? fu / fy : 0;

      const passMinFy = fy >= specMinFy;
      const passMaxCap = fy <= specMaxFy;
      const passRatio = ratio >= reqRatio;

      let verdict: TestingLabVerdict = 'PASS';
      if (!passMinFy || !passRatio) verdict = 'FAIL';
      else if (!passMaxCap) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Yield fy, Ultimate fu & Ductility Ratio', bn: 'ইল্ড (fy), আল্টিমেট (fu) ও ডাক্টিলিটি অনুপাত' },
        primaryValue: `fy ${fmt(fy, 1)} | fu ${fmt(fu, 1)} MPa | fu/fy ${fmt(ratio, 2)}`,
        primaryUnit: '',
        codeLimitText: `${g.label}: ${specMinFy}–${specMaxFy} MPa | fu/fy ≥ ${fmt(reqRatio, 2)}`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — ALL 3 BNBC SEISMIC REBAR GATES PASS', bn: 'পাস — ইল্ড, ওভার-স্ট্রেংথ ক্যাপ ও সিসমিক ডাক্টিলিটি অনুমোদিত' }
            : verdict === 'WARNING'
            ? { en: `OVERSTRENGTH CAP EXCEEDED (fy > ${specMaxFy} MPa) — ENGINEER REVIEW`, bn: `সতর্কতা — ইল্ড +১২৫ MPa ক্যাপ (${specMaxFy} MPa) অতিক্রম করেছে` }
            : { en: !passMinFy ? 'UNDER-STRENGTH YIELD — REJECT LOT' : `FAILED STRAIN-HARDENING RATIO (fu/fy < ${fmt(reqRatio, 2)}) — REJECT`, bn: !passMinFy ? 'ফেল — নির্ধারিত ইল্ড শক্তির কম, লট বাতিল করুন' : 'ফেল — ভূমিকম্প সহনশীল ডাক্টিলিটি অনুপাত (fu/fy) কম, বাতিল করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `d_eff = ${fmt(dEff, 2)} mm (A₀ = ${fmt(areaEff, 1)} mm²): fy = ${fmt(fy, 1)} MPa (within ${specMinFy}–${specMaxFy}), fu = ${fmt(fu, 1)} MPa, fu/fy = ${fmt(ratio, 2)} ≥ ${fmt(reqRatio, 2)}.`, bn: `কার্যকর ক্ষেত্রফল ${fmt(areaEff, 1)} মিমি²: fy = ${fmt(fy, 1)} MPa (${specMinFy}–${specMaxFy}), fu = ${fmt(fu, 1)} MPa এবং fu/fy = ${fmt(ratio, 2)} (≥ ${fmt(reqRatio, 2)})—সম্পূর্ণ নিরাপদ।` }
            : verdict === 'WARNING'
            ? { en: `Actual fy = ${fmt(fy, 1)} MPa exceeds seismic +125 MPa cap (${specMaxFy} MPa), risking brittle column overload before beam yielding. Require structural engineer sign-off.`, bn: `প্রাপ্ত ইল্ড ${fmt(fy, 1)} MPa সিসমিক +১২৫ MPa সীমা (${specMaxFy} MPa) ছাড়িয়ে গেছে—স্ট্রাকচারাল ইঞ্জিনিয়ারের অনুমোদন ছাড়া ব্যবহার নিষেধ।` }
            : { en: `Failed ${!passMinFy ? `minimum yield (${fmt(fy, 1)} < ${specMinFy} MPa)` : `seismic strain-hardening ratio (${fmt(ratio, 2)} < ${fmt(reqRatio, 2)})`}. Quarantine & reject steel heat lot.`, bn: `${!passMinFy ? `ইল্ড শক্তি ${fmt(fy, 1)} MPa নির্ধারিত ${specMinFy}-এর নিচে` : `ডাক্টিলিটি অনুপাত ${fmt(ratio, 2)} (< ${fmt(reqRatio, 2)})`}—ভবন সুরক্ষায় চালান বাতিল করুন।` },
        metrics: [
          { labelEn: 'Actual Yield Stress (fy)', labelBn: 'প্রাপ্ত ইল্ড স্ট্রেস (fy)', value: fmt(fy, 1), unit: 'MPa', highlight: true },
          { labelEn: 'Ultimate Tensile (fu)', labelBn: 'আল্টিমেট স্ট্রেস (fu)', value: fmt(fu, 1), unit: 'MPa' },
          { labelEn: 'Seismic Ratio (fu / fy)', labelBn: 'সিসমিক অনুপাত (fu/fy)', value: fmt(ratio, 2), unit: '×', highlight: true },
          { labelEn: 'Effective Area (A₀)', labelBn: 'কার্যকর ক্ষেত্রফল (A₀)', value: `${fmt(areaEff, 1)} (d=${fmt(dEff, 2)}mm)`, unit: 'mm²' },
        ],
        steps: [
          `1. d_eff = ${wMeas > 0 ? `√(162.2×${wMeas}) = ${fmt(dEff, 2)}` : `${dia} (nominal)`} mm → A₀ = π·d_eff²/4 = ${fmt(areaEff, 2)} mm²`,
          `2. fy = (${py}×1000)/${fmt(areaEff, 2)} = ${fmt(fy, 1)} MPa | fu = (${pu}×1000)/${fmt(areaEff, 2)} = ${fmt(fu, 1)} MPa`,
          `3. Seismic Gates: [fy ≥ ${specMinFy}: ${passMinFy ? 'PASS' : 'FAIL'}] | [fy ≤ ${specMaxFy}: ${passMaxCap ? 'PASS' : 'WARN'}] | [fu/fy = ${fmt(ratio, 2)} ≥ ${fmt(reqRatio, 2)}: ${passRatio ? 'PASS' : 'FAIL'}].`,
        ],
      };
    }

    // 5.3 PERCENTAGE ELONGATION TEST
    case 'reb-elongation': {
      const stdCode = Math.round(num(inputs.gaugeStandardCode, 1));
      const dia = Math.max(6, num(inputs.barDiaMm, 16));
      const l0 = stdCode === 2 ? 200 : 5 * dia;
      const lf = Math.max(l0, num(inputs.finalGaugeMm, stdCode === 2 ? 232 : 94.5));

      const elongPct = ((lf - l0) / l0) * 100;
      const minPass = stdCode === 2 ? 12.0 : 14.0;
      const minFail = stdCode === 2 ? 10.0 : 12.0;

      let verdict: TestingLabVerdict = 'PASS';
      if (elongPct < minFail) verdict = 'FAIL';
      else if (elongPct < minPass) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Total Fracture Elongation (%)', bn: 'মোট ইলংগেশন (%)' },
        primaryValue: fmt(elongPct, 2),
        primaryUnit: '%',
        codeLimitText:
          stdCode === 2
            ? 'ASTM 200mm (8"): ≥ 12% Seismic Pass | 10–11.9% Marginal | < 10% Reject'
            : 'BDS ISO 6935-2 (5d): ≥ 14–16% Pass | 12–13.9% Marginal | < 12% Scrap Steel Reject',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — HIGH DUCTILE ELONGATION PASS', bn: 'পাস — উচ্চ প্রসারণক্ষম ও ভূমিকম্প-সহনশীল রড' }
            : verdict === 'WARNING'
            ? { en: 'BORDERLINE ELONGATION — VERIFY HEAT DUCTILITY', bn: 'সতর্কতা — ইলংগেশন সীমান্তবর্তী, আরও নমুনা পরীক্ষা করুন' }
            : { en: 'BRITTLE SCRAP STEEL (< 12%) — REJECT LOT', bn: 'ফেল (<১২%) — ভঙ্গুর স্ক্র্যাপ রড, পুরো চালান ফেরত দিন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Gauge L₀ = ${fmt(l0, 1)} mm stretched to L_f = ${fmt(lf, 1)} mm → Elongation = ${fmt(elongPct, 2)}% (≥ ${minPass}% target). Ample plastic warning prior to rupture.`, bn: `গেজ দৈর্ঘ্য ${fmt(l0, 1)} মিমি থেকে ছিঁড়ে ${fmt(lf, 1)} মিমি হয়েছে → প্রসারণ = ${fmt(elongPct, 2)}% (≥ ${minPass}%)—নিরাপদ ডাক্টিলিটি।` }
            : verdict === 'WARNING'
            ? { en: `Elongation ${fmt(elongPct, 2)}% falls in borderline band (${minFail}–${minPass}%). Test 2 extra bars from the same mill heat & verify CEV.`, bn: `প্রসারণ ${fmt(elongPct, 2)}% সীমান্তবর্তী (${minFail}–${minPass}%)—একই হিট থেকে আরও ২টি রড টেস্ট করে নিশ্চিত হোন।` }
            : { en: `Brittle elongation ${fmt(elongPct, 2)}% (< ${minFail}%) signals impure scrap/over-quenched brittle steel. Reject bundle immediately.`, bn: `মাত্র ${fmt(elongPct, 2)}% প্রসারণ (<${minFail}%) প্রমাণ করে রড ভঙ্গুর ও স্ক্র্যাপ-জাত—অবিলম্বে চালান ফেরত দিন।` },
        metrics: [
          { labelEn: 'Total Elongation', labelBn: 'মোট ইলংগেশন', value: fmt(elongPct, 2), unit: '%', highlight: true },
          { labelEn: 'Initial Gauge (L₀)', labelBn: 'প্রাথমিক গেজ (L₀)', value: fmt(l0, 1), unit: 'mm' },
          { labelEn: 'Final Length (L_f)', labelBn: 'চূড়ান্ত দৈর্ঘ্য (L_f)', value: fmt(lf, 1), unit: 'mm', highlight: true },
          { labelEn: 'Net Stretch (ΔL)', labelBn: 'মোট বৃদ্ধি (ΔL)', value: fmt(lf - l0, 1), unit: 'mm' },
        ],
        steps: [
          `1. Standard Gauge L₀ = ${stdCode === 2 ? '200.0 mm (ASTM 8")' : `5 × ${dia} = ${fmt(l0, 1)} mm (BDS ISO 6935-2)`}`,
          `2. Elongation (%) = [(${fmt(lf, 1)} - ${fmt(l0, 1)}) / ${fmt(l0, 1)}] × 100 = ${fmt(elongPct, 2)}% (Pass ≥ ${minPass}%, Reject < ${minFail}%).`,
        ],
      };
    }

    // 5.4 180° COLD BEND & REBEND TEST
    case 'reb-bend-rebend': {
      const gradeCode = Math.round(num(inputs.steelGradeCode, 1));
      const dia = Math.max(8, num(inputs.barDiaMm, 16));
      const mandrel = Math.max(10, num(inputs.mandrelDiaMm, 64));
      const angle = Math.max(0, num(inputs.bendAngleDeg, 180));
      const cracks = Math.max(0, num(inputs.cracksFoundCount, 0));

      const ratio = mandrel / dia;
      const reqMaxRatio =
        gradeCode === 2
          ? dia <= 16
            ? 3.0
            : dia <= 25
            ? 4.0
            : 5.0
          : dia <= 16
          ? 4.0
          : dia <= 25
          ? 5.0
          : 7.0;

      let verdict: TestingLabVerdict = 'PASS';
      if (cracks > 0) verdict = 'FAIL';
      else if (ratio > reqMaxRatio + 0.1 || angle < 180) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Mandrel Pin Ratio & Crack Audit', bn: 'ম্যান্ড্রেল অনুপাত ও ফাটল' },
        primaryValue: `${fmt(ratio, 1)}×d (${mandrel} mm) | ${cracks} Cracks`,
        primaryUnit: '',
        codeLimitText: `Max Pin ≤ ${reqMaxRatio}×d (${fmt(reqMaxRatio * dia, 0)} mm) | 180° Bend | 0 Cracks`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — ZERO CRACKS / DUCTILE BEND PASS', bn: 'পাস — কোনো ফাটল নেই, হুক ও ক্র্যাংক বাঁকানো নিরাপদ' }
            : verdict === 'WARNING'
            ? { en: 'OVERSIZED PIN OR < 180° BEND — REPEAT CLEANLY', bn: 'সতর্কতা — বড় পিন বা ১৮০°-এর কম কোণ, সঠিক পিনে রি-টেস্ট করুন' }
            : { en: 'BRITTLE BEND CRACK FAILURE — REJECT LOT', bn: 'ফেল — বাঁকানোর সময় ফাটল ধরেছে, পুরো লট বাতিল' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `${dia} mm bar bent ${angle}° around ${mandrel} mm mandrel (${fmt(ratio, 1)}×d ≤ ${reqMaxRatio}×d) & rebent after 100°C ageing with 0 outer cracks.`, bn: `${dia} মিমি রড ${mandrel} মিমি পিনে (${fmt(ratio, 1)}×d) ১৮০° বাঁকিয়ে ও ১০০°সে এজিং রি-বেন্ডে ০টি ফাটল পাওয়া গেছে।` }
            : verdict === 'WARNING'
            ? { en: `Mandrel (${fmt(ratio, 1)}×d > ${reqMaxRatio}×d max) or bend angle (${angle}° < 180°) was gentler than code. Repeat with exact ${fmt(reqMaxRatio * dia, 0)} mm pin.`, bn: `কোড সীমার (${reqMaxRatio}×d = ${fmt(reqMaxRatio * dia, 0)} মিমি) চেয়ে বড় পিন বা কম কোণ ব্যবহার হয়েছে—সঠিক ম্যান্ড্রেলে পুনঃপরীক্ষা করুন।` }
            : { en: `${cracks} specimen(s) cracked/split on the outer convex tension arc. Reject steel lot immediately.`, bn: `${cracks}টি নমুনায় ফাটল ধরা পড়েছে! রড ভঙ্গুর—পুরো হিট লট ফেরত পাঠান।` },
        metrics: [
          { labelEn: 'Mandrel Pin Ratio', labelBn: 'ম্যান্ড্রেল অনুপাত (D_m/d)', value: fmt(ratio, 1), unit: '×d', highlight: true },
          { labelEn: 'Code Max Pin Limit', labelBn: 'সর্বোচ্চ কোড পিন সীমা', value: `${reqMaxRatio}×d (${fmt(reqMaxRatio * dia, 0)} mm)`, unit: '' },
          { labelEn: 'Bend Angle & Cracks', labelBn: 'বাঁক কোণ ও ফাটল', value: `${angle}° | ${cracks} Cracks`, unit: '', highlight: true },
        ],
        steps: [
          `1. Code Mandrel Limit (${gradeCode === 2 ? '400W/Gr60' : '500W'} @ ${dia}mm) = ${reqMaxRatio}×d = ${fmt(reqMaxRatio * dia, 0)} mm`,
          `2. Actual Mandrel Ratio = ${mandrel} / ${dia} = ${fmt(ratio, 2)}×d | Bend Angle = ${angle}° | Outer Cracks = ${cracks} (Must be 0).`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 16. STANDARD PENETRATION TEST — SPT (N-VALUE), N60 & (N1)60
    // -----------------------------------------------------------------------
    case 'soil-spt-nvalue': {
      const soilClass = Math.round(num(inputs.soilClassCode, 2)); // 1=Clay, 2=Sand
      const emPct = Math.max(30, num(inputs.hammerEfficiencyPct, 60));
      const n1 = Math.max(0, num(inputs.n1Seating, 4));
      const n2 = Math.max(0, num(inputs.n2Blows, 8));
      const n3 = Math.max(0, num(inputs.n3Blows, 10));
      const rodLen = Math.max(1.5, num(inputs.rodLengthM, 7.5));
      const bhCode = Math.round(num(inputs.boreholeDiaCode, 1));
      const linerCode = Math.round(num(inputs.samplerLinerCode, 1));
      const sigmaV = Math.max(10, num(inputs.effOverburdenKpa, 90));

      const nField = n2 + n3;
      const cB = bhCode === 3 ? 1.15 : bhCode === 2 ? 1.05 : 1.0;
      const cS = linerCode === 2 ? 1.2 : 1.0;
      const cR = rodLen < 3 ? 0.75 : rodLen < 4 ? 0.8 : rodLen < 6 ? 0.85 : rodLen < 10 ? 0.95 : 1.0;

      const n60 = nField * (emPct / 60) * cB * cS * cR;
      const cN = Math.min(2.0, Math.sqrt(100 / sigmaV));
      const n1_60 = cN * n60;

      let soilStateEn = '';
      let soilStateBn = '';
      if (soilClass === 1) {
        if (n60 < 2) { soilStateEn = 'Very Soft Clay'; soilStateBn = 'অতি নরম কাদা'; }
        else if (n60 < 4) { soilStateEn = 'Soft Clay'; soilStateBn = 'নরম কাদা'; }
        else if (n60 < 8) { soilStateEn = 'Medium Stiff Clay'; soilStateBn = 'মাঝারি শক্ত কাদা'; }
        else if (n60 < 15) { soilStateEn = 'Stiff Clay'; soilStateBn = 'শক্ত (Stiff) কাদা'; }
        else if (n60 < 30) { soilStateEn = 'Very Stiff Clay'; soilStateBn = 'খুব শক্ত কাদা'; }
        else { soilStateEn = 'Hard Clay'; soilStateBn = 'কঠিন কাদা'; }
      } else {
        if (n60 < 4) { soilStateEn = 'Very Loose Sand'; soilStateBn = 'অতি আলগা বালু'; }
        else if (n60 < 10) { soilStateEn = 'Loose Sand'; soilStateBn = 'আলগা বালু'; }
        else if (n60 < 30) { soilStateEn = 'Medium Dense Sand'; soilStateBn = 'মাঝারি ঘন বালু'; }
        else if (n60 < 50) { soilStateEn = 'Dense Sand'; soilStateBn = 'ঘন বালু'; }
        else { soilStateEn = 'Very Dense Sand'; soilStateBn = 'অতি ঘন বালু'; }
      }

      let verdict: TestingLabVerdict = 'PASS';
      if (n60 < 4) verdict = 'FAIL';
      else if ((soilClass === 1 && n60 < 8) || (soilClass === 2 && n60 < 10)) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Corrected N₆₀ & Normalized (N₁)₆₀', bn: 'সংশোধিত N₆₀ ও (N₁)₆₀' },
        primaryValue: `N₆₀ ${fmt(n60, 1)} | (N₁)₆₀ ${fmt(n1_60, 1)}`,
        primaryUnit: `(${soilStateEn})`,
        codeLimitText: soilClass === 1 ? 'Clay Stiff ≥ 8 (V.Soft <2, Soft 2–4)' : 'Sand Med.Dense ≥ 10 (V.Loose <4, Loose 4–10)',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `COMPETENT STRATUM — ${soilStateEn.toUpperCase()}`, bn: `পাস — নির্ভরযোগ্য ${soilStateBn} স্তর` }
            : verdict === 'WARNING'
            ? { en: `LOW BEARING / LIQUEFACTION CHECK — ${soilStateEn.toUpperCase()}`, bn: `সতর্কতা — ${soilStateBn}, কম বেয়ারিং ও লিকুইফ্যাকশন যাচাই করুন` }
            : { en: `WEAK COMPRESSIBLE LAYER — ${soilStateEn.toUpperCase()} (BYPASS)`, bn: `ফেল — ${soilStateBn}, গভীর পাইল দিয়ে অতিক্রম করুন` },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Field N = ${nField} (N₁=${n1} discarded) yields N₆₀ = ${fmt(n60, 1)} and (N₁)₆₀ = ${fmt(n1_60, 1)} (${soilStateEn}).`, bn: `ফিল্ড N = ${nField} (প্রথম N₁=${n1} বাদ), সংশোধিত N₆₀ = ${fmt(n60, 1)} ও (N₁)₆₀ = ${fmt(n1_60, 1)} (${soilStateBn})।` }
            : verdict === 'WARNING'
            ? { en: `N₆₀ = ${fmt(n60, 1)} (${soilStateEn}) indicates moderate-to-low stiffness; evaluate settlement and liquefaction.`, bn: `N₆₀ = ${fmt(n60, 1)} (${soilStateBn})—হালকা ভবনে কম বেয়ারিং ধরুন অথবা পাইল গভীরে নিন।` }
            : { en: `N₆₀ = ${fmt(n60, 1)} (${soilStateEn}) is unsafe for shallow foundations or pile tip; advance deep piles into N ≥ 30–50 bearing strata.`, bn: `N₆₀ = ${fmt(n60, 1)} (${soilStateBn}) ফাউন্ডেশনের জন্য ঝুঁকিপূর্ণ—পাইল শক্ত স্তর (N ≥ ৩০–৫০) পর্যন্ত নামান।` },
        metrics: [
          { labelEn: 'Field N (N₂ + N₃)', labelBn: 'ফিল্ড N (N₁ বাদ)', value: fmt(nField, 0), unit: 'blows', highlight: true },
          { labelEn: 'Energy-Corrected N₆₀', labelBn: 'সংশোধিত N₆₀', value: fmt(n60, 1), unit: 'blows', highlight: true },
          { labelEn: 'Overburden-Norm (N₁)₆₀', labelBn: 'ওভারবার্ডেন (N₁)₆₀', value: fmt(n1_60, 1), unit: 'blows', highlight: true },
          { labelEn: 'Classification', labelBn: 'মাটির অবস্থা', value: soilStateEn, unit: '' },
        ],
        steps: [
          `1. Field N = N₂ + N₃ = ${n2} + ${n3} = ${nField} (1st 150 mm seating N₁=${n1} discarded per ASTM D1586)`,
          `2. Factors: E_m/60 = ${fmt(emPct / 60, 2)}, C_B = ${fmt(cB, 2)}, C_S = ${fmt(cS, 2)}, C_R = ${fmt(cR, 2)} (L = ${rodLen} m)`,
          `3. N₆₀ = ${nField} × ${fmt(emPct / 60, 2)} × ${fmt(cB, 2)} × ${fmt(cS, 2)} × ${fmt(cR, 2)} = ${fmt(n60, 1)}`,
          `4. C_N = min(√(100 / ${sigmaV}), 2.0) = ${fmt(cN, 3)} → (N₁)₆₀ = ${fmt(cN, 3)} × ${fmt(n60, 1)} = ${fmt(n1_60, 1)} (${soilStateEn})`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 17. ATTERBERG LIMITS (LL, PL, PI & LI)
    // -----------------------------------------------------------------------
    case 'soil-atterberg-limits': {
      const ll = Math.max(5, num(inputs.liquidLimitPct, 34.0));
      const pl = Math.max(1, num(inputs.plasticLimitPct, 21.0));
      const wn = Math.max(0, num(inputs.naturalMoisturePct, 24.5));

      const pi = ll - pl;
      const li = pi > 0.1 ? (wn - pl) / pi : 0;

      const swellLabel = pi < 7 ? 'Low Plasticity (Low Swell)' : pi <= 17 ? 'Medium Plasticity (Moderate)' : 'High Plasticity (Expansive)';
      const consistencyLabel = li < 0 ? 'Semi-Solid / Brittle' : li < 0.75 ? 'Plastic Solid (Stiff)' : li < 1.0 ? 'Soft Near Liquid' : 'Liquid Mud (Sensitive)';

      let verdict: TestingLabVerdict = 'PASS';
      if (pl > ll || pi > 25 || li >= 1.0) verdict = 'FAIL';
      else if (pi > 17 || li >= 0.75) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Plasticity Index (PI) & Liquidity (LI)', bn: 'প্লাস্টিসিটি ইনডেক্স (PI) ও LI' },
        primaryValue: `PI ${fmt(pi, 1)}% | LI ${fmt(li, 2)}`,
        primaryUnit: swellLabel,
        codeLimitText: 'PI < 7 Low | 7–17 Medium | > 17 High Expansive | LI < 0.75',
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — ${swellLabel.toUpperCase()}`, bn: 'পাস — কম/মাঝারি প্লাস্টিসিটির স্থিতিশীল মাটি' }
            : verdict === 'WARNING'
            ? { en: 'EXPANSIVE CLAY / SOFTENING RISK (PI > 17 OR LI ≥ 0.75)', bn: 'সতর্কতা — ফোলা প্রবণ কাদামাটি বা অতিরিক্ত আর্দ্রতা' }
            : { en: 'HIGHLY EXPANSIVE OR LIQUID MUD — REJECT FOR FILL', bn: 'ফেল — অতি এক্সপ্যানসিভ বা তরল কাদা, ভরাটে বাতিল করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `LL = ${fmt(ll, 1)}%, PL = ${fmt(pl, 1)}% → PI = ${fmt(pi, 1)}% (${swellLabel}), LI = ${fmt(li, 2)} (${consistencyLabel}).`, bn: `LL = ${fmt(ll, 1)}%, PL = ${fmt(pl, 1)}% থেকে PI = ${fmt(pi, 1)}% এবং LI = ${fmt(li, 2)}—মাটির ফোলা প্রবণতা নিয়ন্ত্রণে আছে।` }
            : verdict === 'WARNING'
            ? { en: `High plasticity PI = ${fmt(pi, 1)}% or LI = ${fmt(li, 2)} indicates shrink-swell or wet softening risk; stabilize or cushion with sand.`, bn: `PI = ${fmt(pi, 1)}% বা LI = ${fmt(li, 2)}—বর্ষায় ফুলে ও শুকনোয় ফেটে যেতে পারে; বালি কুশন দিন।` }
            : { en: `Extreme expansive clay (PI = ${fmt(pi, 1)}% > 25%) or liquid state (LI = ${fmt(li, 2)} ≥ 1.0). Unfit for road/plinth subgrade.`, bn: `অতি উচ্চ PI = ${fmt(pi, 1)}% বা তরল কাদা (LI = ${fmt(li, 2)})—রাস্তা বা প্লিন্থ ভরাটের জন্য সম্পূর্ণ অনুপযোগী।` },
        metrics: [
          { labelEn: 'Plasticity Index (PI = LL - PL)', labelBn: 'প্লাস্টিসিটি ইনডেক্স (PI)', value: fmt(pi, 1), unit: '%', highlight: true },
          { labelEn: 'Liquidity Index (LI)', labelBn: 'লিকুইডিটি ইনডেক্স (LI)', value: fmt(li, 2), unit: '', highlight: true },
          { labelEn: 'Swelling Classification', labelBn: 'ফোলা প্রবণতা', value: pi < 7 ? 'Low (<7)' : pi <= 17 ? 'Medium (7–17)' : 'High (>17)', unit: '' },
          { labelEn: 'In-Situ Consistency', labelBn: 'প্রাকৃতিক অবস্থা', value: consistencyLabel, unit: '' },
        ],
        steps: [
          `1. Plasticity Index PI = LL - PL = ${fmt(ll, 1)} - ${fmt(pl, 1)} = ${fmt(pi, 1)}% (${swellLabel})`,
          `2. Liquidity Index LI = (w_n - PL) / PI = (${fmt(wn, 1)} - ${fmt(pl, 1)}) / ${fmt(Math.max(0.1, pi), 1)} = ${fmt(li, 2)} (${consistencyLabel})`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 18. FIELD DRY DENSITY (SAND REPLACEMENT CONE) & PROCTOR MDD/OMC
    // -----------------------------------------------------------------------
    case 'soil-fdd-compaction': {
      const hasTotalPoured = inputs.totalSandPouredG !== undefined || inputs.sandInHoleG === undefined;
      const totalPoured = Math.max(100, num(inputs.totalSandPouredG, 2240));
      const coneSand = Math.max(0, num(inputs.coneSandMassG, 520));
      const wHole = hasTotalPoured ? Math.max(50, totalPoured - coneSand) : Math.max(1, num(inputs.sandInHoleG, 1720));

      const gammaSand = Math.max(0.5, num(inputs.pouringSandDensity, 1.48));
      const mWet = Math.max(1, num(inputs.excavatedWetMassG, 2210));
      const wPct = Math.max(0, num(inputs.moisturePct, 10.5));
      const mdd = Math.max(0.5, num(inputs.labMdd, 1.78));
      const omc = Math.max(1, num(inputs.labOmcPct, 11.0));
      const reqPct =
        inputs.layerScopeCode !== undefined
          ? Math.round(num(inputs.layerScopeCode, 1)) === 2
            ? 98
            : 95
          : Math.max(80, num(inputs.requiredCompactionPct, 95));

      const vHoleCc = wHole / gammaSand;
      const gammaWet = mWet / vHoleCc;
      const gammaDry = gammaWet / (1 + wPct / 100);
      const compPct = (gammaDry / mdd) * 100;
      const omcDelta = wPct - omc;

      let verdict: TestingLabVerdict = 'PASS';
      if (compPct < reqPct - 2.0) verdict = 'FAIL';
      else if (compPct < reqPct || Math.abs(omcDelta) > 3.0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Relative Compaction (% MDD)', bn: 'ফিল্ড কমপ্যাকশন (% MDD)' },
        primaryValue: fmt(compPct, 1),
        primaryUnit: '% MDD',
        codeLimitText: `Required Min: ≥ ${reqPct}% of Lab MDD (${fmt(mdd, 2)} g/cc) | OMC ${fmt(omc, 1)}% ± 2%`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — COMPACTION TARGET ACHIEVED', bn: 'পাস — নির্ধারিত কমপ্যাকশন অর্জিত হয়েছে' }
            : verdict === 'WARNING'
            ? { en: 'UNDER-COMPACTED OR MOISTURE DRIFT — EXTRA ROLLING', bn: 'সতর্কতা — কমপ্যাকশন বা আর্দ্রতা সামান্য কমবেশি, রি-রোলিং করুন' }
            : { en: 'NON-CONFORMANT — SCARIFY & RE-COMPACT LIFT', bn: 'ফেল — স্তর খুঁড়ে আর্দ্রতা ঠিক করে আবার কমপ্যাক্ট করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Field dry density ${fmt(gammaDry, 3)} g/cm³ = ${fmt(compPct, 1)}% of MDD (≥ ${reqPct}%) at ${fmt(wPct, 1)}% moisture. Approve next lift.`, bn: `ফিল্ড ড্রাই ডেনসিটি ${fmt(gammaDry, 3)} g/cm³ এবং কমপ্যাকশন ${fmt(compPct, 1)}% (≥ ${reqPct}%)—পরবর্তী স্তরের কাজ শুরু করা যাবে।` }
            : verdict === 'WARNING'
            ? { en: `Compaction ${fmt(compPct, 1)}% (target ≥ ${reqPct}%) or moisture variance (${omcDelta >= 0 ? '+' : ''}${fmt(omcDelta, 1)}% from OMC); adjust water & add 2–4 passes.`, bn: `কমপ্যাকশন ${fmt(compPct, 1)}% (লক্ষ্য ≥ ${reqPct}%) বা OMC থেকে আর্দ্রতার পার্থক্য বেশি—পানি সমন্বয় ও আরও রোলিং করুন।` }
            : { en: `Compaction ${fmt(compPct, 1)}% fails ${reqPct}% target by >2%. Scarify layer, bring moisture near ${fmt(omc, 1)}% OMC, and re-compact in ≤150 mm lifts.`, bn: `কমপ্যাকশন ${fmt(compPct, 1)}% লক্ষ্যমাত্রার চেয়ে ২%+ কম! পুরো স্তর খুঁড়ে পুনরায় কমপ্যাকশন করুন।` },
        metrics: [
          { labelEn: 'Relative Compaction (RC)', labelBn: 'কমপ্যাকশন শতাংশ', value: fmt(compPct, 1), unit: '% MDD', highlight: true },
          { labelEn: 'Field Dry Density (γ_d)', labelBn: 'ফিল্ড ড্রাই ডেনসিটি', value: fmt(gammaDry, 3), unit: 'g/cm³', highlight: true },
          { labelEn: 'Hole Volume / Sand Used', labelBn: 'গর্তের আয়তন / বালি', value: `${fmt(vHoleCc, 0)} cc`, unit: `(${fmt(wHole, 0)}g)` },
          { labelEn: 'Moisture vs OMC', labelBn: 'আর্দ্রতা বনাম OMC', value: `${fmt(wPct, 1)}%`, unit: `(${omcDelta >= 0 ? '+' : ''}${fmt(omcDelta, 1)}%)` },
        ],
        steps: [
          hasTotalPoured
            ? `1. Hole Sand W_hole = W_poured - W_cone = ${totalPoured} - ${coneSand} = ${wHole} g → V_hole = ${wHole} / ${gammaSand} = ${fmt(vHoleCc, 1)} cm³`
            : `1. Hole Volume V_hole = ${wHole} / ${gammaSand} = ${fmt(vHoleCc, 1)} cm³`,
          `2. Wet Density γ_wet = ${mWet} / ${fmt(vHoleCc, 1)} = ${fmt(gammaWet, 3)} g/cm³`,
          `3. Dry Density γ_d = ${fmt(gammaWet, 3)} / (1 + ${wPct}/100) = ${fmt(gammaDry, 3)} g/cm³`,
          `4. Relative Compaction RC = (${fmt(gammaDry, 3)} / ${mdd}) × 100 = ${fmt(compPct, 1)}% (Target ≥ ${reqPct}%)`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 19. BENTONITE DRILLING SLURRY QUALITY (DENSITY, VISCOSITY, SAND %, pH)
    // -----------------------------------------------------------------------
    case 'soil-bentonite-slurry': {
      const stage = Math.round(num(inputs.slurryStageCode, 1)); // 1=Pre-Tremie, 2=Fresh
      const rho = Math.max(0.95, num(inputs.mudDensityGcc, 1.07));
      const visc = Math.max(20, num(inputs.marshViscositySec, 38));
      const sand = Math.max(0, num(inputs.sandContentPct, 2.5));
      const ph = num(inputs.slurryPh, 9.2);

      const rhoLimitMax = stage === 2 ? 1.1 : 1.15;
      const sandLimitPass = stage === 2 ? 2.0 : 4.0;

      let verdict: TestingLabVerdict = 'PASS';
      if (rho > 1.15 || rho < 1.02 || visc < 29 || visc > 60 || sand > 5.0 || ph < 7.5 || ph > 12.0) {
        verdict = 'FAIL';
      } else if (
        (stage === 2 && (rho < 1.03 || rho > 1.1)) ||
        visc < 32 ||
        visc > 50 ||
        sand > sandLimitPass ||
        ph < 8.0 ||
        ph > 11.0
      ) {
        verdict = 'WARNING';
      }

      return {
        testId,
        primaryMetricLabel: { en: 'Slurry Density, Viscosity & Sand %', bn: 'স্লারি ডেনসিটি, ভিসকোসিটি ও বালির হার' },
        primaryValue: `${fmt(rho, 2)} g/cc | ${fmt(visc, 0)}s | ${fmt(sand, 1)}% Sand`,
        primaryUnit: `pH ${fmt(ph, 1)}`,
        codeLimitText: `ρ ${stage === 2 ? '1.03–1.10' : '1.03–1.15'} g/cc | Visc 32–50s | Sand ≤ ${sandLimitPass}% | pH 8–11`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — CLEAN SLURRY, CLEARED FOR TREMIE POUR', bn: 'পাস — স্লারি পরিষ্কার, ট্রেমি ঢালাইয়ের জন্য নিরাপদ' }
            : verdict === 'WARNING'
            ? { en: 'MARGINAL SLURRY — RUN DESANDER / AIRLIFT 20 MIN', bn: 'সতর্কতা — ডিস্যান্ডার বা এয়ার-লিফট চালিয়ে পুনরায় টেস্ট করুন' }
            : { en: 'HIGH SAND / SOFT-TOE HAZARD — HOLD TREMIE CONCRETING', bn: 'ফেল — বালির হার বেশি (Soft-Toe ঝুঁকি), ঢালাই বন্ধ রাখুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Mud balance ρ = ${fmt(rho, 2)} g/cm³, Marsh funnel = ${fmt(visc, 0)} s/qt, Sand = ${fmt(sand, 1)}% (≤ ${sandLimitPass}%), pH = ${fmt(ph, 1)}. Zero soft-toe sand dropout risk.`, bn: `ঘনত্ব ${fmt(rho, 2)} g/cc, ভিসকোসিটি ${fmt(visc, 0)} সে., বালি ${fmt(sand, 1)}% ও pH ${fmt(ph, 1)}—তলায় বালি জমার ঝুঁকি নেই।` }
            : verdict === 'WARNING'
            ? { en: `Slurry property sits near boundary (Visc ${fmt(visc, 0)}s, Sand ${fmt(sand, 1)}%, ρ ${fmt(rho, 2)}). Circulate desander or condition bentonite before concreting.`, bn: `স্লারির মান সীমান্তবর্তী—ডিস্যান্ডার বা তাজা বেনটোনাইট সঞ্চালন করে পুনরায় যাচাই করুন।` }
            : { en: `Critical failure (${sand > 4 ? `Sand ${fmt(sand, 1)}% settles to cause soft-toe pile failure` : `ρ=${fmt(rho, 2)} g/cc or Visc=${fmt(visc, 0)}s traps mud`}). Flush & replace borehole slurry!`, bn: `পাইলের তলা নরম হওয়া (Soft Toe) বা গর্ত ধসার মারাত্মক ঝুঁকি—সম্পূর্ণ ফ্লাশিং ও স্লারি বদল ছাড়া ঢালাই নিষেধ।` },
        metrics: [
          { labelEn: 'Mud Balance Density (ρ)', labelBn: 'মাড ব্যালেন্স ঘনত্ব', value: fmt(rho, 2), unit: 'g/cm³', highlight: true },
          { labelEn: 'Marsh Funnel Viscosity', labelBn: 'মার্শ ভিসকোসিটি', value: fmt(visc, 0), unit: 'sec/qt', highlight: true },
          { labelEn: '200-Mesh Sand Content', labelBn: 'বালির হার (%)', value: fmt(sand, 1), unit: '%', highlight: true },
          { labelEn: 'Slurry Alkalinity (pH)', labelBn: 'স্লারির pH', value: fmt(ph, 1), unit: 'pH' },
        ],
        steps: [
          `1. Density Check: ${fmt(rho, 2)} g/cm³ vs ≤ ${fmt(rhoLimitMax, 2)} g/cm³ (${stage === 2 ? 'Fresh Tank 1.03–1.10' : 'Pre-Tremie Bottom ≤ 1.15'})`,
          `2. Marsh Funnel (1-Quart / 946 mL): ${fmt(visc, 0)} sec (Target 32–50 sec/qt)`,
          `3. Sand Content Screen: ${fmt(sand, 1)}% vs Pre-Tremie Max 4.0% | pH: ${fmt(ph, 1)} (Target 8.0–11.0).`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 20. STATIC PILE LOAD TEST (DAVISSON / BNBC) & PIT INTEGRITY
    // -----------------------------------------------------------------------
    case 'soil-pile-static-pit': {
      const stage = Math.round(num(inputs.pileTestStageCode, 1)); // 1=Working 1.5Q, 2=Initial 2.0Q
      const dia = Math.max(250, num(inputs.pileDiaMm, 500));
      const lenM = Math.max(3, num(inputs.pileLengthM, 21));
      const loadKn = Math.max(50, num(inputs.testLoadKn, 1200));
      const ecGpa = Math.max(15, num(inputs.concreteEcGpa, 25));
      const grossS = Math.max(0, num(inputs.grossSettlementMm, 11.4));
      const netS = Math.max(0, num(inputs.netSettlementMm, 3.2));
      const pitMs = Math.max(1, num(inputs.pitReflectionMs, 10.7));
      const anomalyDepth = Math.max(0, num(inputs.earlyAnomalyDepthM, 0));

      const areaMm2 = (Math.PI * dia * dia) / 4;
      const elasticMm = (loadKn * lenM * 1000) / (areaMm2 * ecGpa);
      const davissonMm = elasticMm + (4.0 + dia / 120);
      const bnbcGrossCap = stage === 2 ? 25.0 : 18.0;
      const waveSpeed = (2 * lenM) / (pitMs / 1000);

      let verdict: TestingLabVerdict = 'PASS';
      if (anomalyDepth > 0 || grossS > 25 || netS > 10 || waveSpeed < 3200) {
        verdict = 'FAIL';
      } else if (grossS > davissonMm || grossS > bnbcGrossCap || netS > 6 || waveSpeed < 3600) {
        verdict = 'WARNING';
      }

      return {
        testId,
        primaryMetricLabel: { en: 'Settlement vs Davisson & PIT Speed', bn: 'সেটেলমেন্ট বনাম ডেভিসন ও পিআইটি বেগ' },
        primaryValue: `Gross ${fmt(grossS, 1)} / Dav ${fmt(davissonMm, 1)} mm | ${fmt(waveSpeed, 0)} m/s`,
        primaryUnit: '',
        codeLimitText: `Gross ≤ Davisson (${fmt(davissonMm, 1)} mm) & ≤ ${bnbcGrossCap} mm | Net ≤ 6 mm | PIT ≥ 3600 m/s`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — SOUND SHAFT & DAVISSON BEARING PASS', bn: 'পাস — পাইল অক্ষত ও ডেভিসন/বিএনবিসি লোড ক্ষমতা প্রমাণিত' }
            : verdict === 'WARNING'
            ? { en: 'EXCEEDS DAVISSON OFFSET OR BORDERLINE WAVE SPEED', bn: 'সতর্কতা — ডেভিসন লিমিট অতিক্রম বা পিআইটি বেগ সীমান্তবর্তী' }
            : { en: anomalyDepth > 0 ? `PIT NECKING / VOID @ ${fmt(anomalyDepth, 1)}m — ACTION REQ.` : 'PILE FAILURE — DERATE / ADD COMPENSATORY PILES', bn: anomalyDepth > 0 ? `ফেল — ${fmt(anomalyDepth, 1)} মি. গভীরতায় নেকিং/ফাটল শনাক্ত` : 'ফেল — অতিরিক্ত সেটেলমেন্ট বা দুর্বল কংক্রিট' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Gross ${fmt(grossS, 1)} mm ≤ Davisson ${fmt(davissonMm, 1)} mm (Δ_el = ${fmt(elasticMm, 2)} mm), Net = ${fmt(netS, 1)} mm ≤ 6 mm, and PIT c = ${fmt(waveSpeed, 0)} m/s with zero shaft anomalies.`, bn: `গ্রস সেটেলমেন্ট ${fmt(grossS, 1)} মিমি (ডেভিসন সীমা ${fmt(davissonMm, 1)} মিমি), নেট ${fmt(netS, 1)} মিমি এবং পিআইটি বেগ ${fmt(waveSpeed, 0)} m/s—পাইল সম্পূর্ণ নিরাপদ।` }
            : verdict === 'WARNING'
            ? { en: `Gross (${fmt(grossS, 1)} mm vs Davisson ${fmt(davissonMm, 1)} mm) or Net (${fmt(netS, 1)} mm) or PIT velocity (${fmt(waveSpeed, 0)} m/s) warrants capacity review.`, bn: `সেটেলমেন্ট বা পিআইটি তরঙ্গ বেগ সীমান্তবর্তী—জিওটেকনিক্যাল ইঞ্জিনিয়ারের মাধ্যমে পাইল লোড ক্ষমতা পুনর্মূল্যায়ন করুন।` }
            : { en: `${anomalyDepth > 0 ? `Early PIT impedance anomaly at ${fmt(anomalyDepth, 1)} m depth (necking/void). ` : ''}Failed settlement or wave speed (${fmt(waveSpeed, 0)} m/s). Derate pile & add sacrificial piles.`, bn: `পাইলের ভেতরে নেকিং বা ভারবহন ক্ষমতা ফেল—পাইল ক্যাপের পাশে অতিরিক্ত পাইল স্থাপন বাধ্যতামূলক।` },
        metrics: [
          { labelEn: 'Gross / Davisson Limit', labelBn: 'গ্রস বনাম ডেভিসন সীমা', value: `${fmt(grossS, 1)} / ${fmt(davissonMm, 1)}`, unit: 'mm', highlight: true },
          { labelEn: 'Elastic Shortening (PL/AE)', labelBn: 'ইলাস্টিক শর্টেনিং', value: fmt(elasticMm, 2), unit: 'mm' },
          { labelEn: 'Net Permanent Settlement', labelBn: 'স্থায়ী নেট সেটেলমেন্ট', value: fmt(netS, 1), unit: 'mm', highlight: true },
          { labelEn: 'PIT Wave Velocity (c)', labelBn: 'পিআইটি তরঙ্গ বেগ (c)', value: fmt(waveSpeed, 0), unit: 'm/s', highlight: true },
        ],
        steps: [
          `1. Pile Area A = π × ${dia}² / 4 = ${fmt(areaMm2, 0)} mm² → Δ_elastic = (${loadKn} × ${lenM} × 1000) / (${fmt(areaMm2, 0)} × ${ecGpa}) = ${fmt(elasticMm, 2)} mm`,
          `2. Davisson Offset Limit Δ_Davisson = ${fmt(elasticMm, 2)} + (4.0 + ${dia}/120) = ${fmt(davissonMm, 2)} mm (${stage === 2 ? '2.0×Q Test Pile' : '1.5×Q Working Pile'})`,
          `3. Net Residual = ${fmt(netS, 1)} mm (Elastic rebound = ${fmt(Math.max(0, grossS - netS), 1)} mm)`,
          `4. PIT Stress-Wave Velocity c = (2 × ${lenM}) / (${pitMs}/1000) = ${fmt(waveSpeed, 0)} m/s | Early Anomaly Depth = ${anomalyDepth > 0 ? `${anomalyDepth} m (NECKING)` : '0 m (Intact)'}`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 21. 4-DAY SOAKED CALIFORNIA BEARING RATIO (CBR) TEST (RHD / LGED)
    // -----------------------------------------------------------------------
    case 'hwy-cbr-soaked': {
      const layer = Math.round(num(inputs.pavementLayerCode, 3)); // 1=Subgrade 5%, 2=ISG 10%, 3=Sub-base 30%, 4=Base 80%
      const p25 = Math.max(0, num(inputs.load25Kgf, 465));
      const p50 = Math.max(0, num(inputs.load50Kgf, 665));
      const swell = Math.max(0, num(inputs.swellPct, 0.35));

      const targetMap: Record<number, { pct: number; name: string }> = {
        1: { pct: 5, name: 'Subgrade Soil' },
        2: { pct: 10, name: 'Improved Subgrade (ISG)' },
        3: { pct: 30, name: 'Sub-base Course' },
        4: { pct: 80, name: 'WBM / Crushed Stone Base' },
      };
      const spec = targetMap[layer] || targetMap[3];

      const cbr25 = (p25 / 1370) * 100;
      const cbr50 = (p50 / 2055) * 100;
      const govCbr = Math.max(cbr25, cbr50);
      const cbr50Higher = cbr50 > cbr25;

      let verdict: TestingLabVerdict = 'PASS';
      if (govCbr < spec.pct * 0.8 || swell > 1.5) verdict = 'FAIL';
      else if (govCbr < spec.pct || swell > 1.0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: `Soaked CBR (${spec.name})`, bn: `সোকড সিবিআর (${spec.name})` },
        primaryValue: `${fmt(govCbr, 1)}% CBR`,
        primaryUnit: `Swell ${fmt(swell, 2)}%`,
        codeLimitText: `RHD / LGED ${spec.name}: Min CBR ≥ ${spec.pct}% | 4-Day Swell ≤ 1.0%`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — ${spec.name.toUpperCase()} CBR PASS`, bn: `পাস — ${spec.name}-এর জন্য সিবিআর অনুমোদিত` }
            : verdict === 'WARNING'
            ? { en: 'BORDERLINE CBR OR MODERATE SWELL (1.0–1.5%)', bn: 'সতর্কতা — সিবিআর সীমান্তবর্তী, বালি-খোয়া মিশিয়ে উন্নতি করুন' }
            : { en: 'CBR FAILURE OR EXCESS SWELL — REJECT / STABILIZE', bn: 'ফেল — সিবিআর অপর্যাপ্ত বা অতিরিক্ত ফোলা (>১.৫%)' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `CBR₂.₅ = ${fmt(cbr25, 1)}%, CBR₅.₀ = ${fmt(cbr50, 1)}% → Governing CBR = ${fmt(govCbr, 1)}% (≥ ${spec.pct}%), Swell = ${fmt(swell, 2)}%.${cbr50Higher ? ' Note: CBR₅.₀ > CBR₂.₅ — verify on repeat specimen per ASTM D1883.' : ''}`, bn: `CBR₂.₅ = ${fmt(cbr25, 1)}% ও CBR₅.₀ = ${fmt(cbr50, 1)}% → কার্যকর সিবিআর = ${fmt(govCbr, 1)}% (≥ ${spec.pct}%), ফোলা ${fmt(swell, 2)}%।` }
            : verdict === 'WARNING'
            ? { en: `Governing CBR ${fmt(govCbr, 1)}% is 80–99% of ${spec.pct}% requirement or swell is 1.01–1.50%; blend coarse sand/aggregate or check compaction.`, bn: `প্রাপ্ত সিবিআর ${fmt(govCbr, 1)}% লক্ষ্যমাত্রার চেয়ে সামান্য কম—মোটা বালি/খোয়া মিশিয়ে পুনরায় যাচাই করুন।` }
            : { en: `Governing CBR ${fmt(govCbr, 1)}% (< 80% of ${spec.pct}%) or 4-day swell ${fmt(swell, 2)}% > 1.5%. Unsuitable for ${spec.name}.`, bn: `সিবিআর মাত্র ${fmt(govCbr, 1)}% অথবা ৪-দিনে ফোলা ${fmt(swell, 2)}% (> ১.৫%)—উৎস পরিবর্তন বা স্ট্যাবিলাইজ করুন।` },
        metrics: [
          { labelEn: 'Governing Soaked CBR', labelBn: 'কার্যকর সোকড সিবিআর', value: fmt(govCbr, 1), unit: '%', highlight: true },
          { labelEn: 'CBR at 2.5 mm (÷ 1370)', labelBn: '২.৫ মিমি সিবিআর', value: fmt(cbr25, 1), unit: '%' },
          { labelEn: 'CBR at 5.0 mm (÷ 2055)', labelBn: '৫.০ মিমি সিবিআর', value: fmt(cbr50, 1), unit: '%' },
          { labelEn: '4-Day Soaked Swell', labelBn: '৪-দিনের ফোলা হার', value: fmt(swell, 2), unit: '%', highlight: true },
        ],
        steps: [
          `1. CBR₂.₅ = (${p25} / 1370) × 100 = ${fmt(cbr25, 2)}%`,
          `2. CBR₅.₀ = (${p50} / 2055) × 100 = ${fmt(cbr50, 2)}%`,
          `3. Governing CBR = ${fmt(govCbr, 1)}% vs RHD/LGED ${spec.name} Target ≥ ${spec.pct}% | 4-Day Swell = ${fmt(swell, 2)}% (≤ 1.0%).`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 22. DCP PENETRATION & IN-SITU CBR (Supports hwy-dcp-cbr + legacy soil-dcp-cbr)
    // -----------------------------------------------------------------------
    case 'hwy-dcp-cbr':
    case 'soil-dcp-cbr': {
      const penMm = Math.max(1, num(inputs.penetrationMm, 150));
      const blows = Math.max(1, num(inputs.blowCount, 22));
      const targetCbr = Math.max(2, num(inputs.targetCbrPct, 30));

      const dn = penMm / blows;
      // ASTM D6951 correlation: log10(CBR) = 2.46 - 1.12 * log10(DN)
      const logCbr = 2.46 - 1.12 * Math.log10(Math.max(0.5, dn));
      const estCbr = Math.min(100, Math.pow(10, logCbr));

      let verdict: TestingLabVerdict = 'PASS';
      if (estCbr < targetCbr * 0.8) verdict = 'FAIL';
      else if (estCbr < targetCbr) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'DCP Index (DN) & Est. CBR', bn: 'ডিসিপি রেট (DN) ও আনুমানিক সিবিআর' },
        primaryValue: `${fmt(estCbr, 1)}% CBR (${fmt(dn, 2)} mm/blow)`,
        primaryUnit: '',
        codeLimitText: `Required Min CBR ≥ ${targetCbr}% (log₁₀(CBR) = 2.46 - 1.12·log₁₀(DN))`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — SUBGRADE / SUB-BASE CBR PASS', bn: 'পাস — স্তরের সিবিআর শক্তি ডিজাইন অনুযায়ী সঠিক' }
            : verdict === 'WARNING'
            ? { en: 'MARGINAL CBR (80–99%) — RE-COMPACT / SOAK CHECK', bn: 'সতর্কতা — সিবিআর সামান্য কম, পুনরায় রোলিং করুন' }
            : { en: 'SOFT STRATUM (<80% TARGET) — REMOVE & REPLACE', bn: 'ফেল — নরম স্তর শনাক্ত, মাটি পরিবর্তন করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `DN = ${fmt(dn, 2)} mm/blow yields ASTM D6951 CBR = ${fmt(estCbr, 1)}% (≥ ${targetCbr}%).`, bn: `পেনিট্রেশন ইনডেক্স DN = ${fmt(dn, 2)} মিমি/আঘাত থেকে প্রাপ্ত সিবিআর ${fmt(estCbr, 1)}%, যা ≥ ${targetCbr}% লক্ষ্যমাত্রা পূরণ করেছে।` }
            : verdict === 'WARNING'
            ? { en: `Estimated CBR ${fmt(estCbr, 1)}% is 80–99% of ${targetCbr}% design target; apply extra compaction or verify soaked lab CBR.`, bn: `সিবিআর ${fmt(estCbr, 1)}% লক্ষ্যমাত্রার ৮০–৯৯%; বাড়তি রোলিং দিয়ে পুনরায় যাচাই করুন।` }
            : { en: `Low bearing capacity (CBR ${fmt(estCbr, 1)}% vs ${targetCbr}%). Excavate soft pocket & backfill with granular sub-base.`, bn: `সিবিআর মাত্র ${fmt(estCbr, 1)}%—রাস্তা/ফ্লোরের নিচের নরম মাটি সরিয়ে ভালো বালি বা খোয়া বসান।` },
        metrics: [
          { labelEn: 'Estimated In-Situ CBR', labelBn: 'আনুমানিক ইন-সিটু সিবিআর', value: fmt(estCbr, 1), unit: '%', highlight: true },
          { labelEn: 'Penetration Index (DN)', labelBn: 'পেনিট্রেশন রেট (DN)', value: fmt(dn, 2), unit: 'mm/blow', highlight: true },
          { labelEn: 'log₁₀(CBR)', labelBn: 'লগ সিবিআর মান', value: fmt(logCbr, 3), unit: '' },
        ],
        steps: [
          `1. DCP Penetration Index DN = ${penMm} / ${blows} = ${fmt(dn, 2)} mm/blow`,
          `2. log₁₀(CBR) = 2.46 - 1.12·log₁₀(${fmt(dn, 2)}) = ${fmt(logCbr, 3)} → CBR = ${fmt(estCbr, 1)}% (Target ≥ ${targetCbr}%).`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 23. BITUMEN PENETRATION (60/70 & 80/100), SOFTENING, DUCTILITY & FLASH POINT
    // -----------------------------------------------------------------------
    case 'hwy-bitumen-penetration': {
      const gradeCode = Math.round(num(inputs.bitumenGradeCode, 1)); // 1=60/70, 2=80/100
      const p1 = num(inputs.pen1, 64);
      const p2 = num(inputs.pen2, 66);
      const p3 = num(inputs.pen3, 65);
      const sp = num(inputs.softeningTempC, 50.0);
      const duct = Math.max(0, num(inputs.ductilityCm, 88));
      const flash = Math.max(50, num(inputs.flashPointC, 265));

      const penAvg = (p1 + p2 + p3) / 3;
      const penMin = gradeCode === 2 ? 80 : 60;
      const penMax = gradeCode === 2 ? 100 : 70;
      const spMin = gradeCode === 2 ? 42 : 46;
      const spMax = gradeCode === 2 ? 52 : 58;
      const flashMin = gradeCode === 2 ? 225 : 230;
      const gradeLabel = gradeCode === 2 ? '80/100 (VG-10)' : '60/70 (VG-30)';

      let verdict: TestingLabVerdict = 'PASS';
      if (flash < 220 || duct < 65 || penAvg < penMin - 10 || penAvg > penMax + 10 || sp < spMin - 3) {
        verdict = 'FAIL';
      } else if (penAvg < penMin || penAvg > penMax || sp < spMin || sp > spMax + 4 || duct < 75 || flash < flashMin) {
        verdict = 'WARNING';
      }

      return {
        testId,
        primaryMetricLabel: { en: `${gradeLabel} Penetration & Softening`, bn: `${gradeLabel} পেনিট্রেশন ও সফটেনিং` },
        primaryValue: `${fmt(penAvg, 1)} dmm | ${fmt(sp, 1)}°C | ${fmt(duct, 0)}cm`,
        primaryUnit: `Flash ${fmt(flash, 0)}°C`,
        codeLimitText: `${gradeLabel}: Pen ${penMin}–${penMax} dmm | SP ${spMin}–${spMax}°C | Duct ≥ 75cm | Flash ≥ ${flashMin}°C`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — ${gradeLabel} BITUMEN CERTIFIED`, bn: `পাস — ${gradeLabel} গ্রেড বিটুমিন শতভাগ খাঁটি` }
            : verdict === 'WARNING'
            ? { en: 'BORDERLINE GRADE DRIFT — VERIFY VISCOSITY', bn: 'সতর্কতা — বিটুমিনের গ্রেড সামান্য বিচ্যুত' }
            : { en: 'ADULTERATED / OFF-GRADE BITUMEN — REJECT LOT', bn: 'ফেল — ভেজাল বা বাতিলযোগ্য বিটুমিন, ড্রাম ফেরত দিন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Mean Penetration ${fmt(penAvg, 1)} (${penMin}–${penMax}), Softening ${fmt(sp, 1)}°C, Ductility ${fmt(duct, 0)} cm, and Flash ${fmt(flash, 0)}°C pass ${gradeLabel} specs.`, bn: `গড় পেনিট্রেশন ${fmt(penAvg, 1)}, সফটেনিং ${fmt(sp, 1)}°সে, ডাক্টিলিটি ${fmt(duct, 0)} সেমি ও ফ্ল্যাশ ${fmt(flash, 0)}°সে—সব মান ${gradeLabel} গ্রেডের উপযোগী।` }
            : verdict === 'WARNING'
            ? { en: `One parameter lies slightly outside ${gradeLabel} target band; check 60°C viscosity before batching.`, bn: `কোনো একটি মান ${gradeLabel} গ্রেডের সীমানা ছাড়িয়েছে—ব্যবহারের আগে ভিসকোসিটি পরীক্ষা করুন।` }
            : { en: `Critical failure (Flash ${fmt(flash, 0)}°C < 220°C indicates kerosene/solvent dilution, or Ductility ${fmt(duct, 0)} < 65cm, or Pen ${fmt(penAvg, 1)} far off spec). Reject lot!`, bn: `ভেজাল বা অতি নরম/ভঙ্গুর বিটুমিন (ফ্ল্যাশ <২২০°সে বা ডাক্টিলিটি <৬৫ সেমি)—পুরো চালান বাতিল করুন।` },
        metrics: [
          { labelEn: 'Mean Penetration (25°C)', labelBn: 'গড় পেনিট্রেশন', value: fmt(penAvg, 1), unit: '0.1mm', highlight: true },
          { labelEn: 'Softening Point (R&B)', labelBn: 'সফটেনিং পয়েন্ট', value: fmt(sp, 1), unit: '°C', highlight: true },
          { labelEn: 'Ductility (27°C)', labelBn: 'ডাক্টিলিটি (২৭°সে)', value: fmt(duct, 0), unit: 'cm', highlight: true },
          { labelEn: 'Cleveland Flash Point', labelBn: 'ফ্ল্যাশ পয়েন্ট', value: fmt(flash, 0), unit: '°C' },
        ],
        steps: [
          `1. Mean Penetration = (${p1} + ${p2} + ${p3}) / 3 = ${fmt(penAvg, 1)} dmm (Spec ${penMin}–${penMax} for ${gradeLabel})`,
          `2. Softening Point = ${fmt(sp, 1)}°C (Spec ${spMin}–${spMax}°C) | Ductility = ${fmt(duct, 0)} cm (Min 75 cm)`,
          `3. Open-Cup Flash Point = ${fmt(flash, 0)}°C (Min ≥ ${flashMin}°C to prove zero kerosene/diesel cutback).`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 24. MARSHALL STABILITY, FLOW, AIR VOIDS & CENTRIFUGE BITUMEN EXTRACTION
    // -----------------------------------------------------------------------
    case 'hwy-marshall-stability': {
      const courseCode = Math.round(num(inputs.courseTypeCode, 1)); // 1=WC, 2=DBM
      const stab = Math.max(0, num(inputs.correctedStabilityKn, 11.4));
      const flow = Math.max(0.1, num(inputs.flowMm, 3.1));
      const gmb = Math.max(1, num(inputs.bulkGravityGmb, 2.382));
      const gmm = Math.max(gmb, num(inputs.riceGravityGmm, 2.48));
      const w1 = Math.max(100, num(inputs.mixSampleW1G, 1200));
      const w2 = Math.max(50, Math.min(w1, num(inputs.extractedAggW2G, 1138)));
      const wAsh = Math.max(0, num(inputs.mineralAshG, 1.6));

      const stabMin = courseCode === 2 ? 8.2 : 9.0;
      const bitMin = courseCode === 2 ? 4.0 : 4.8;
      const bitMax = courseCode === 2 ? 5.2 : 6.0;
      const layerName = courseCode === 2 ? 'DBM' : 'Wearing Course';

      const vaPct = ((gmm - gmb) / gmm) * 100;
      const mq = stab / flow;
      const bitPct = ((w1 - w2 + wAsh) / w1) * 100;

      let verdict: TestingLabVerdict = 'PASS';
      if (
        stab < stabMin - 1.0 ||
        flow < 1.8 ||
        flow > 4.5 ||
        vaPct < 2.5 ||
        vaPct > 6.0 ||
        bitPct < bitMin - 0.5 ||
        bitPct > bitMax + 0.5
      ) {
        verdict = 'FAIL';
      } else if (
        stab < stabMin ||
        flow < 2.0 ||
        flow > 4.0 ||
        vaPct < 3.0 ||
        vaPct > 5.0 ||
        bitPct < bitMin ||
        bitPct > bitMax
      ) {
        verdict = 'WARNING';
      }

      return {
        testId,
        primaryMetricLabel: { en: `${layerName}: Stability, Va & Bitumen %`, bn: `${layerName}: স্ট্যাবিলিটি, ভয়েডস ও বিটুমিন %` },
        primaryValue: `${fmt(stab, 1)} kN | ${fmt(vaPct, 2)}% Va | ${fmt(bitPct, 2)}% Bitumen`,
        primaryUnit: '',
        codeLimitText: `${layerName}: Stab ≥ ${stabMin} kN | Flow 2–4 mm | Va 3–5% | Bitumen ${bitMin}–${bitMax}%`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — ${layerName.toUpperCase()} HMA APPROVED`, bn: `পাস — ${layerName} হট-মিক্স অনুমোদিত` }
            : verdict === 'WARNING'
            ? { en: 'MARGINAL JMF — ADJUST PLANT BITUMEN / FILLER', bn: 'সতর্কতা — প্ল্যান্টে বিটুমিন/ফিলার সমন্বয় করুন' }
            : { en: 'NON-CONFORMANT HMA — HALT PAVING PLANT', bn: 'ফেল — হট-মিক্স প্ল্যান্ট বন্ধ করে মিক্স সংশোধন করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Stability ${fmt(stab, 1)} kN, Flow ${fmt(flow, 1)} mm, Air Voids ${fmt(vaPct, 2)}%, and Extracted Bitumen ${fmt(bitPct, 2)}% (${bitMin}–${bitMax}%) pass RHD specs.`, bn: `স্ট্যাবিলিটি ${fmt(stab, 1)} kN, ফ্লো ${fmt(flow, 1)} মিমি, এয়ার ভয়েডস ${fmt(vaPct, 2)}% এবং এক্সট্রাক্ট বিটুমিন ${fmt(bitPct, 2)}%—সব মান RHD অনুযায়ী পাস।` }
            : verdict === 'WARNING'
            ? { en: `Mix parameter sits in warning zone (Va ${fmt(vaPct, 2)}%, Bitumen ${fmt(bitPct, 2)}%); calibrate hot-bin aggregate or ±0.2% binder pump.`, bn: `মিক্সের মান সীমান্তবর্তী—প্ল্যান্টে বিটুমিন ±০.২% বা পাথর গ্রেডেশন সমন্বয় করুন।` }
            : { en: `Critical bleeding/rutting (Va < 2.5%, rich bitumen) or monsoon raveling risk (Va > 6%, starved bitumen ${fmt(bitPct, 2)}%). Halt paving.`, bn: `রাস্তা ডেবে যাওয়া বা বর্ষায় পাথর উঠে যাওয়ার মারাত্মক ঝুঁকি (Va ${fmt(vaPct, 2)}%, বিটুমিন ${fmt(bitPct, 2)}%)—প্ল্যান্ট বন্ধ করুন।` },
        metrics: [
          { labelEn: 'Marshall Stability', labelBn: 'মার্শাল স্ট্যাবিলিটি', value: fmt(stab, 1), unit: 'kN', highlight: true },
          { labelEn: 'Extracted Bitumen %', labelBn: 'এক্সট্রাক্টেড বিটুমিন %', value: fmt(bitPct, 2), unit: '%', highlight: true },
          { labelEn: 'Air Voids (Va)', labelBn: 'এয়ার ভয়েডস (Va)', value: fmt(vaPct, 2), unit: '%', highlight: true },
          { labelEn: 'Flow / MQ Quotient', labelBn: 'ফ্লো ও MQ অনুপাত', value: `${fmt(flow, 1)} mm`, unit: `(${fmt(mq, 2)} kN/mm)` },
        ],
        steps: [
          `1. Bitumen Extraction % = [(${w1} - ${w2} + ${wAsh}) / ${w1}] × 100 = ${fmt(bitPct, 2)}% (Spec ${bitMin}–${bitMax}%)`,
          `2. Air Voids Va = ((${fmt(gmm, 3)} - ${fmt(gmb, 3)}) / ${fmt(gmm, 3)}) × 100 = ${fmt(vaPct, 2)}% (Spec 3.0–5.0%)`,
          `3. Stability = ${fmt(stab, 1)} kN (≥ ${stabMin} kN), Flow = ${fmt(flow, 1)} mm (2.0–4.0 mm), MQ = ${fmt(mq, 2)} kN/mm.`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 25. ASPHALT CORE COMPACTION & THICKNESS
    // -----------------------------------------------------------------------
    case 'hwy-core-compaction': {
      const gCore = Math.max(0.5, num(inputs.coreDensity, 2.33));
      const gLab = Math.max(0.5, num(inputs.labMarshallDensity, 2.382));
      const tDes = Math.max(10, num(inputs.designThicknessMm, 50));
      const tMeas = Math.max(0, num(inputs.measuredThicknessMm, 49));

      const compPct = (gCore / gLab) * 100;
      const deficitMm = tDes - tMeas;

      let verdict: TestingLabVerdict = 'PASS';
      if (compPct < 95.0 || deficitMm > 5.0) verdict = 'FAIL';
      else if (compPct < 97.0 || deficitMm > 3.0) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Field Core Compaction & Thickness', bn: 'কোর কমপ্যাকশন ও পুরুত্ব' },
        primaryValue: `${fmt(compPct, 1)}% | ${fmt(tMeas, 1)} mm`,
        primaryUnit: '',
        codeLimitText: `Compaction ≥ 97.0% | Design ${tDes} mm (Deficit ≤ 3mm)`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — PAVEMENT CORE APPROVED', bn: 'পাস — পিচ ঢালাইয়ের ঘনত্ব ও পুরুত্ব সঠিক' }
            : verdict === 'WARNING'
            ? { en: 'UNDER-COMPACTED / SLIGHT THINNESS — PENALTY', bn: 'সতর্কতা — সামান্য কম ঘনত্ব বা পুরুত্ব (বিল সমন্বয়)' }
            : { en: 'NON-CONFORMANT — MILL & RE-PAVE DEFECTIVE LANE', bn: 'ফেল — আলগা/অতি পাতলা ঢালাই, মিলিং ও পুনরায় কার্পেটিং' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Core compaction ${fmt(compPct, 1)}% (≥ 97%) and average thickness ${fmt(tMeas, 1)} mm vs ${tDes} mm design.`, bn: `কোর কমপ্যাকশন ${fmt(compPct, 1)}% ও পুরুত্ব ${fmt(tMeas, 1)} মিমি—উভয়ই অনুমোদিত মানের ভেতর।` }
            : verdict === 'WARNING'
            ? { en: `Compaction (${fmt(compPct, 1)}%) or thickness deficit (${fmt(deficitMm, 1)} mm) is in warning zone; apply contract price reduction or seal coat.`, bn: `ঘনত্ব ৯৫–৯৭% বা পুরুত্ব ৩–৫ মিমি কম—চুক্তি অনুযায়ী বিল কর্তন ও সিল কোট দিন।` }
            : { en: `Compaction < 95% or thickness deficit > 5 mm. Permeable asphalt will fail rapidly; mill and re-lay.`, bn: `ঘনত্ব <৯৫% বা পুরুত্ব ৫ মিমি-এর বেশি কম—পিচ উঠে যাবে; ত্রুটিপূর্ণ অংশ মিলিং করে নতুন ঢালাই দিন।` },
        metrics: [
          { labelEn: 'Field Core Compaction', labelBn: 'কোর কমপ্যাকশন হার', value: fmt(compPct, 1), unit: '%', highlight: true },
          { labelEn: 'Measured Core Thickness', labelBn: 'কোরের গড় পুরুত্ব', value: fmt(tMeas, 1), unit: 'mm', highlight: true },
          { labelEn: 'Thickness Variance', labelBn: 'পুরুত্ব পার্থক্য', value: `${-deficitMm >= 0 ? '+' : ''}${fmt(-deficitMm, 1)}`, unit: 'mm' },
        ],
        steps: [
          `1. Core Compaction = (${fmt(gCore, 3)} / ${fmt(gLab, 3)}) × 100 = ${fmt(compPct, 1)}% (Target ≥ 97.0%)`,
          `2. Thickness Variance = ${fmt(tMeas, 1)} - ${fmt(tDes, 1)} = ${-deficitMm >= 0 ? '+' : ''}${fmt(-deficitMm, 1)} mm.`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 26. CONCRETE MIXING & CURING WATER CHEMISTRY (RCC vs PCC)
    // -----------------------------------------------------------------------
    case 'wat-mixing-water': {
      const modeCode = Math.round(num(inputs.concreteModeCode, 1)); // 1=RCC <=500, 2=PCC <=2000
      const ph = num(inputs.waterPh, 7.1);
      const tds = Math.max(0, num(inputs.tdsPpm, 640));
      const cl = Math.max(0, num(inputs.chloridePpm, 185));
      const so4 = Math.max(0, num(inputs.sulfatePpm, 95));

      const isPcc = modeCode === 2;
      const clLimit = isPcc ? 2000 : 500;
      const clFail = isPcc ? 2000 : 800;

      let verdict: TestingLabVerdict = 'PASS';
      if (ph < 5.5 || cl > clFail || so4 > 400 || tds > 3000) verdict = 'FAIL';
      else if (ph < 6.0 || ph > 8.5 || cl > clLimit || tds > 2000) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: `Water Chemistry (${isPcc ? 'PCC' : 'RCC'} Mode)`, bn: `পানির মান (${isPcc ? 'পিসিসি' : 'আরসিসি'})` },
        primaryValue: `pH ${fmt(ph, 1)} | ${cl} mg/L Cl⁻ | ${so4} SO₄`,
        primaryUnit: `TDS ${tds} mg/L`,
        codeLimitText: `pH 6.0–8.5 | ${isPcc ? 'PCC Cl⁻ ≤ 2000' : 'RCC Cl⁻ ≤ 500'} | SO₄ ≤ 400 | TDS ≤ 2000 mg/L`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — SAFE FOR ${isPcc ? 'PCC' : 'RCC'} MIXING & CURING`, bn: `পাস — ${isPcc ? 'পিসিসি' : 'আরসিসি'} ঢালাই ও কিউরিংয়ের জন্য নিরাপদ পানি` }
            : verdict === 'WARNING'
            ? { en: 'BORDERLINE CHEMISTRY — ASTM C1602 MORTAR CUBE TEST REQ.', bn: 'সতর্কতা — তুলনামূলক মর্টার কিউব টেস্ট (≥৯০%) আবশ্যক' }
            : { en: 'SALINE / CORROSIVE WATER — REJECT SOURCE', bn: 'ফেল — লবণাক্ত বা দূষিত পানি, রডে মরিচা ধরাবে' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `pH ${fmt(ph, 1)}, Chloride ${cl} mg/L (≤ ${clLimit}), Sulfate ${so4} mg/L (≤ 400), and TDS ${tds} mg/L meet BNBC/IS limits.`, bn: `pH ${fmt(ph, 1)}, ক্লোরাইড ${cl} mg/L (≤ ${clLimit}), সালফেট ${so4} mg/L ও TDS ${tds} mg/L—সব মান নিরাপদ সীমায় রয়েছে।` }
            : verdict === 'WARNING'
            ? { en: `Cl⁻ (${cl} mg/L) or TDS (${tds} mg/L) or pH (${fmt(ph, 1)}) sits in warning range; pass ASTM C1602 ≥90% mortar check first.`, bn: `ক্লোরাইড বা টিডিএস সীমান্তবর্তী—ডিস্টিল্ড পানির সাথে তুলনামূলক মর্টার কিউব টেস্ট ছাড়া ব্যবহার নিষেধ।` }
            : { en: `Excessive chloride (${cl} > ${clFail} mg/L), sulfate (${so4} > 400 mg/L), or acidic pH (< 5.5). Switch to WASA or rainwater.`, bn: `অতিরিক্ত ক্লোরাইড, সালফেট বা অ্যাসিডিক পানি—রডে দ্রুত মরিচা ধরে কাঠামো দুর্বল করবে; পানির উৎস বদলান।` },
        metrics: [
          { labelEn: 'Water pH (6.0–8.5)', labelBn: 'পানির pH', value: fmt(ph, 1), unit: 'pH', highlight: true },
          { labelEn: 'Chloride (Cl⁻)', labelBn: 'ক্লোরাইড (Cl⁻)', value: fmt(cl, 0), unit: 'mg/L', highlight: true },
          { labelEn: 'Sulfate (SO₄²⁻)', labelBn: 'সালফেট (SO₄²⁻)', value: fmt(so4, 0), unit: 'mg/L', highlight: true },
          { labelEn: 'Total Dissolved Solids', labelBn: 'টিডিএস (TDS)', value: fmt(tds, 0), unit: 'mg/L' },
        ],
        steps: [
          `1. pH = ${fmt(ph, 1)} (Safe Band 6.0–8.5)`,
          `2. Chloride = ${cl} mg/L vs ${isPcc ? 'PCC Limit ≤ 2000' : 'RCC Limit ≤ 500'} mg/L`,
          `3. Sulfate SO₄²⁻ = ${so4} mg/L (Limit ≤ 400 mg/L) | TDS = ${tds} mg/L (Limit ≤ 2000 mg/L).`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 27. uPVC / CPVC / GI PIPELINE HYDROSTATIC PRESSURE TEST (10 bar / 2h)
    // -----------------------------------------------------------------------
    case 'wat-hydrostatic-pipe': {
      const pWork = Math.max(0.5, num(inputs.workingPressureBar, 5.0));
      const pStart = Math.max(0, num(inputs.startPressureBar, 10.5));
      const pEnd = Math.max(0, num(inputs.endPressureBar, 10.4));
      const holdMin = Math.max(5, num(inputs.holdMinutes, 120));
      const leaks = Math.max(0, num(inputs.leakingJointsCount, 0));

      const pReq = Math.max(10.0, 1.5 * pWork);
      const dropBar = Math.max(0, pStart - pEnd);

      let verdict: TestingLabVerdict = 'PASS';
      if (leaks > 0 || dropBar > 0.4 || pStart < pReq) verdict = 'FAIL';
      else if (dropBar > 0.2 || holdMin < 120) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: 'Hydrostatic Drop & Joint Audit', bn: 'প্রেশার ড্রপ ও জয়েন্ট যাচাই' },
        primaryValue: `ΔP ${fmt(dropBar, 2)} bar | ${leaks} Leaks`,
        primaryUnit: `(${fmt(pStart * 14.504, 0)} psi)`,
        codeLimitText: `P_test ≥ ${fmt(pReq, 1)} bar (≥ 150 psi) | ΔP ≤ 0.20 bar | Hold ≥ 120 min | 0 Leaks`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — WATERTIGHT PLUMBING LOOP', bn: 'পাস — পাইপলাইন সম্পূর্ণ লিকমুক্ত' }
            : verdict === 'WARNING'
            ? { en: 'BLEED AIR & HOLD FULL 2 HOURS (120 MIN) RE-TEST', bn: 'সতর্কতা — বাতাস বের করে পূর্ণ ২ ঘণ্টা (১২০ মিনিট) রি-টেস্ট করুন' }
            : { en: 'ACTIVE LEAK OR UNDER-PRESSURIZED — REPAIR', bn: 'ফেল — লিক পাওয়া গেছে বা প্রেশার < ১০ বার, মেরামত করুন' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Applied ${fmt(pStart, 1)} bar (≥ ${fmt(pReq, 1)} bar) held ${holdMin} min with ΔP = ${fmt(dropBar, 2)} bar (≤ 0.20) and 0 weeping joints.`, bn: `${fmt(pStart, 1)} bar চাপে ${holdMin} মিনিট পর ড্রপ মাত্র ${fmt(dropBar, 2)} bar ও লিক ০টি—প্লাস্টারের অনুমতি দিন।` }
            : verdict === 'WARNING'
            ? { en: `Pressure drop ${fmt(dropBar, 2)} bar (0.21–0.40) or hold time ${holdMin}m < 120m without drips—bleed air & hold full 2h.`, bn: `দৃশ্যমান লিক ছাড়া ০.২১–০.৪০ বার ড্রপ বা সময় ১২০ মিনিটের কম—বাতাস বের করে ২ ঘণ্টা ধরে রাখুন।` }
            : { en: `${leaks} weeping joints, ΔP > 0.40 bar, or start pressure ${fmt(pStart, 1)} < ${fmt(pReq, 1)} bar. Cut & re-weld before plastering.`, bn: `জয়েন্টে লিক, ΔP > ০.৪০ bar বা টেস্ট চাপ < ${fmt(pReq, 1)} bar—মেরামত ছাড়া প্লাস্টার নিষেধ।` },
        metrics: [
          { labelEn: 'Pressure Drop (ΔP)', labelBn: 'চাপ পতন (ΔP)', value: fmt(dropBar, 2), unit: 'bar', highlight: true },
          { labelEn: 'Required Min Test Pressure', labelBn: 'ন্যূনতম টেস্ট প্রেশার', value: fmt(pReq, 1), unit: 'bar', highlight: true },
          { labelEn: 'Hold Time / Weeping Joints', labelBn: 'সময় ও লিক জয়েন্ট', value: `${holdMin}m / ${leaks}`, unit: 'leaks', highlight: true },
        ],
        steps: [
          `1. Required P_req = max(1.5 × ${pWork}, 10.0) = ${fmt(pReq, 1)} bar (~${fmt(pReq * 14.504, 0)} psi) | Applied P_start = ${fmt(pStart, 1)} bar`,
          `2. Pressure Drop ΔP = ${fmt(pStart, 2)} - ${fmt(pEnd, 2)} = ${fmt(dropBar, 2)} bar over ${holdMin} min (Spec ≤ 0.20 bar, ≥ 120 min, 0 leaks).`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 28. SANITARY DRAINAGE PIPE SLOPE, 1.5M WATER HEAD & BALL TEST
    // -----------------------------------------------------------------------
    case 'wat-sanitary-slope-ball': {
      const diaCode = Math.round(num(inputs.pipeDiaCode, 1)); // 1=100mm (1:60-1:80), 2=150mm (1:100-1:120)
      const lenM = Math.max(0.5, num(inputs.runLengthM, 12.0));
      const dropMm = num(inputs.invertDropMm, 180);
      const headDropMm = Math.max(0, num(inputs.waterHeadDropMm, 0));
      const ballPass = Math.round(num(inputs.ballPassStatus, 1)); // 1=Pass, 2=Jammed

      const minN = diaCode === 2 ? 100 : 60;
      const maxN = diaCode === 2 ? 120 : 80;
      const diaLabel = diaCode === 2 ? '150 mm (6")' : '100 mm (4")';

      const isBackFall = dropMm <= 0;
      const ratioN = isBackFall ? 9999 : (lenM * 1000) / dropMm;
      const dropPerM = dropMm / lenM;

      let verdict: TestingLabVerdict = 'PASS';
      if (isBackFall || ballPass === 2 || headDropMm > 20 || ratioN > maxN) {
        verdict = 'FAIL';
      } else if (ratioN < minN || headDropMm > 10) {
        verdict = 'WARNING';
      }

      return {
        testId,
        primaryMetricLabel: { en: `${diaLabel} Slope & Ball/Head Test`, bn: `${diaLabel} ঢাল ও বল/হেড পরীক্ষা` },
        primaryValue: isBackFall ? 'BACK-FALL (FAIL)' : `1 : ${fmt(ratioN, 1)} (${fmt(dropPerM, 1)} mm/m)`,
        primaryUnit: ballPass === 1 ? 'Ball PASS' : 'Ball JAM',
        codeLimitText: `${diaLabel}: Slope 1:${minN} to 1:${maxN} | 1.5m Head Drop ≤ 10 mm | Ball PASS`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: `CONFORMANT — SELF-CLEANSING SLOPE & BALL PASS`, bn: `পাস — আদর্শ স্ব-পরিষ্কারক ঢাল ও বল টেস্ট সফল` }
            : verdict === 'WARNING'
            ? { en: 'OVER-STEEP SLOPE OR MINOR HEAD DROP — CHECK SOCKETS', bn: 'সতর্কতা — অতি খাড়া ঢাল বা হেড ড্রপ (১১–২০ মিমি)' }
            : { en: isBackFall ? 'NEGATIVE BACK-FALL — RE-LAY SEWER' : ballPass === 2 ? 'BALL JAMMED INSIDE PIPE — CLEAR / RE-LAY' : 'FLAT SLOPE OR LEAKING JOINT — RE-GRADE', bn: 'ফেল — সমতল/উল্টো ঢাল, লিক অথবা ভেতরে বল আটকে গেছে' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Gradient 1:${fmt(ratioN, 1)} (${fmt(dropPerM, 1)} mm/m) lies inside 1:${minN}–1:${maxN}, 1.5m water head drop = ${headDropMm} mm (≤10), and ball passed end-to-end.`, bn: `পাইপের ঢাল ১:${fmt(ratioN, 1)} (আদর্শ ১:${minN}–১:${maxN}), ১.৫ মি. হেড ড্রপ ${headDropMm} মিমি ও বল নির্বিঘ্নে পার হয়েছে।` }
            : verdict === 'WARNING'
            ? { en: `Gradient 1:${fmt(ratioN, 1)} is steeper than 1:${minN} (water outruns solids) or 1.5m head drop is ${headDropMm} mm (11–20mm). Inspect plugs & grade.`, bn: `ঢাল ১:${minN}-এর চেয়ে বেশি খাড়া অথবা হেড ড্রপ ১১–২০ মিমি—জয়েন্ট ও ঢাল পরীক্ষা করুন।` }
            : { en: `Failed check (${isBackFall ? 'negative slope' : ballPass === 2 ? 'ball obstructed' : ratioN > maxN ? `slope 1:${fmt(ratioN, 0)} flatter than 1:${maxN}` : `head drop ${headDropMm}mm > 20mm`}). Excavate & re-lay.`, bn: `পাইপের ঢাল ১:${maxN}-এর চেয়ে সমতল, উল্টো ঢাল বা বল আটকে গেছে—পুনরায় স্থাপন করুন।` },
        metrics: [
          { labelEn: 'Measured Gradient (1 : N)', labelBn: 'পরিমাপকৃত ঢাল (১ : N)', value: isBackFall ? 'Back-Fall' : `1 : ${fmt(ratioN, 1)}`, unit: '', highlight: true },
          { labelEn: 'Fall per Meter', labelBn: 'প্রতি মিটারে ঢাল', value: fmt(dropPerM, 1), unit: 'mm/m', highlight: true },
          { labelEn: '1.5m Water Head Drop', labelBn: '১.৫ মি. হেড ড্রপ', value: fmt(headDropMm, 0), unit: 'mm' },
          { labelEn: 'Ball Passage Check', labelBn: 'বল পাসিং অবস্থা', value: ballPass === 1 ? 'FREE PASS' : 'JAMMED', unit: '', highlight: true },
        ],
        steps: [
          `1. Slope N = (L_m × 1000) / ΔIL_mm = (${lenM} × 1000) / ${dropMm} = ${isBackFall ? 'INVALID' : fmt(ratioN, 1)} → Gradient 1 : ${isBackFall ? 'Back-Fall' : fmt(ratioN, 1)} (Band 1:${minN}–1:${maxN})`,
          `2. Required drop range over ${lenM} m: ${fmt((lenM * 1000) / maxN, 0)}–${fmt((lenM * 1000) / minN, 0)} mm (Measured: ${dropMm} mm)`,
          `3. 1.5m Water Head Drop = ${headDropMm} mm (≤ 10 mm) | Ball Test = ${ballPass === 1 ? 'Passed end-to-end' : 'OBSTRUCTED'}.`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 29. ROOF, SUNKEN BATHROOM & UGWR/OHT WATER TANK 72H PONDING TEST
    // -----------------------------------------------------------------------
    case 'wat-roof-ponding': {
      const structCode = Math.round(num(inputs.structureTypeCode, 1)); // 1=Roof/Bath 50-75mm, 2=UGWR/OHT Full
      const depthMm = Math.max(0, num(inputs.pondingDepthMm, 65));
      const slabDrop = Math.max(0, num(inputs.slabDropMm, 15.0));
      const evapDrop = Math.max(0, num(inputs.evapBucketDropMm, 13.5));
      const hrs = Math.max(1, num(inputs.testHours, 72));
      const spots = Math.max(0, num(inputs.dampSpotsCount, 0));

      const netSeepage = Math.max(0, slabDrop - evapDrop);
      const minDepth = structCode === 2 ? 300 : 50;
      const structLabel = structCode === 2 ? 'UGWR / OHT Tank' : 'Roof / Sunken Bath';

      let verdict: TestingLabVerdict = 'PASS';
      if (spots > 0 || netSeepage > 5.0 || hrs < 48) verdict = 'FAIL';
      else if (netSeepage > 3.0 || hrs < 72 || depthMm < minDepth) verdict = 'WARNING';

      return {
        testId,
        primaryMetricLabel: { en: `${structLabel}: Net Seepage`, bn: `${structLabel}: নিট সিপেজ` },
        primaryValue: `${fmt(netSeepage, 1)} mm | ${spots} Damp Spots`,
        primaryUnit: `(${hrs}h @ ${depthMm}mm)`,
        codeLimitText: `Net Seepage ≤ 3.0 mm | Hold ≥ 72h (48h min) | Depth ≥ ${minDepth}mm | 0 Damp Spots`,
        verdict,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'CONFORMANT — 100% WATERTIGHT WATERPROOFING', bn: 'পাস — ছাদ, বাথরুম বা ট্যাংক শতভাগ জলরোধী' }
            : verdict === 'WARNING'
            ? { en: 'EXTEND TO 72H OR CHECK DEPTH / BUND SEAL', bn: 'সতর্কতা — ৭২ ঘণ্টা পূর্ণ করুন বা বাঁধ/গভীরতা যাচাই করুন' }
            : { en: 'ACTIVE SEEPAGE — GROUT & RE-POND 72H', bn: 'ফেল — ড্যাম্প বা লিক পাওয়া গেছে, মেরামত আবশ্যক' },
        verdictDetail:
          verdict === 'PASS'
            ? { en: `Net seepage after evaporation correction = ${fmt(netSeepage, 1)} mm over ${hrs}h (${depthMm} mm depth) with 0 underside/outer damp spots.`, bn: `${hrs} ঘণ্টায় বাষ্পীভবন বাদ দিয়ে নিট সিপেজ ${fmt(netSeepage, 1)} মিমি এবং কোনো ড্যাম্প/লিক নেই।` }
            : verdict === 'WARNING'
            ? { en: `Hold time (${hrs}h < 72h), pond depth (${depthMm} < ${minDepth}mm), or net drop (${fmt(netSeepage, 1)} mm) needs tightening to full 72h spec.`, bn: `পরীক্ষার সময় ৭২ ঘণ্টার কম, গভীরতা অপর্যাপ্ত বা নিট ড্রপ ৩–৫ মিমি—পূর্ণ ৭২ ঘণ্টা পর্যবেক্ষণ করুন।` }
            : { en: `${spots} damp spots, net drop ${fmt(netSeepage, 1)} mm > 5 mm, or hold < 48h. Drain, inject PU/epoxy grout, re-coat & re-pond 72h.`, bn: `নিচের ছাদে/দেয়ালে ${spots}টি ভেজা দাগ বা ৫ মিমি+ লিক—গ্রাউটিং ও নতুন ওয়াটারপ্রুফিং কোট দিয়ে ৭২ ঘণ্টা রি-টেস্ট করুন।` },
        metrics: [
          { labelEn: 'Net Seepage (ΔH - ΔEvap)', labelBn: 'নিট পানি সিপেজ ড্রপ', value: fmt(netSeepage, 1), unit: 'mm', highlight: true },
          { labelEn: 'Ponding Depth & Hold', labelBn: 'গভীরতা ও সময়', value: `${depthMm}mm / ${hrs}h`, unit: '' },
          { labelEn: 'Soffit / Wall Damp Spots', labelBn: 'ভেজা দাগ / লিক', value: fmt(spots, 0), unit: 'nos', highlight: true },
        ],
        steps: [
          `1. Net Seepage = ΔH_structure - ΔH_evap_pan = ${fmt(slabDrop, 1)} - ${fmt(evapDrop, 1)} = ${fmt(netSeepage, 1)} mm`,
          `2. Depth = ${depthMm} mm (Min ${minDepth} mm for ${structLabel}) | Hold = ${hrs}h (Target 72h) | Damp Spots = ${spots} (Must be 0).`,
        ],
      };
    }

    // -----------------------------------------------------------------------
    // 25–29. DOMAIN 9: SITE EXECUTION & STRUCTURAL QA/QC VERIFIERS (WEIGHTED)
    // -----------------------------------------------------------------------
    case 'qc-pre-pour-rcc':
    case 'qc-rebar-seismic':
    case 'qc-curing-deshuttering':
    case 'qc-masonry-plaster':
    case 'qc-excavation-foundation': {
      const items = test?.checklistItems || [];
      const states = checklistStates || getDefaultChecklistStates(test!);
      let passed = 0;
      let failed = 0;
      let na = 0;
      let criticalFails = 0;
      let totalApplicableWeight = 0;
      let passedWeight = 0;

      for (const it of items) {
        const w = it.weight ?? (it.critical ? 20 : 10);
        const st = states[it.id] || 'PASS';
        if (st === 'NA') {
          na += 1;
        } else {
          totalApplicableWeight += w;
          if (st === 'PASS') {
            passed += 1;
            passedWeight += w;
          } else {
            failed += 1;
            if (it.critical) criticalFails += 1;
          }
        }
      }

      const applicable = Math.max(1, items.length - na);
      const rawScorePct = (passed / applicable) * 100;
      const weightedScorePct =
        totalApplicableWeight > 0 ? (passedWeight / totalApplicableWeight) * 100 : rawScorePct;

      let verdict: TestingLabVerdict = 'PASS';
      const quantAlerts: string[] = [];
      const quantWarnings: string[] = [];
      const extraMetrics: LabEvaluationMetric[] = [];
      const extraSteps: string[] = [];
      let codeLimitSummary = '0 Critical Fails & Weighted Score ≥ 90% Required for Sign-Off';

      if (testId === 'qc-pre-pour-rcc') {
        const L = Math.max(0.2, num(inputs.roomLenM, 4.0));
        const W = Math.max(0.2, num(inputs.roomWidM, 3.0));
        const dTheoMm = Math.sqrt(L * L + W * W) * 1000;
        const d1 = Math.max(100, num(inputs.diag1Mm, 5001));
        const d2 = Math.max(100, num(inputs.diag2Mm, 4999));
        const sqDiffD1D2 = Math.abs(d1 - d2);
        const sqDiffTheo = Math.max(Math.abs(d1 - dTheoMm), Math.abs(d2 - dTheoMm));
        const maxSqErrMm = Math.max(sqDiffD1D2, sqDiffTheo);
        const plumb = Math.max(0, num(inputs.plumbErrPer3mMm, 3.5));
        const spanM = Math.max(0.5, num(inputs.slabSpanM, 5.2));
        const camberProvided = Math.max(0, num(inputs.providedCamberMm, 12));
        const propS = Math.max(200, num(inputs.propSpacingMm, 800));

        const minCamberMm = spanM > 4.5 ? (spanM * 1000) / 500 : 0;
        const maxCamberMm = spanM > 4.5 ? (spanM * 1000) / 300 : 10;

        if (maxSqErrMm > 5) {
          quantAlerts.push(`Diagonal error ${fmt(maxSqErrMm, 1)} mm exceeds 5 mm limit (target ≤ 3.0 mm)`);
        } else if (maxSqErrMm > 3) {
          quantWarnings.push(`Diagonal squareness ${fmt(maxSqErrMm, 1)} mm slightly above 3.0 mm (1/8")`);
        }
        if (plumb > 8) {
          quantAlerts.push(`Column plumb error ${fmt(plumb, 1)} mm/3m > 8 mm`);
        } else if (plumb > 6) {
          quantWarnings.push(`Column plumb ${fmt(plumb, 1)} mm/3m (> 6 mm target)`);
        }
        if (propS > 1000) {
          quantAlerts.push(`Prop spacing ${fmt(propS, 0)} mm > 1000 mm max`);
        } else if (propS > 900) {
          quantWarnings.push(`Prop spacing ${fmt(propS, 0)} mm > 900 mm standard`);
        }
        if (spanM > 4.5 && camberProvided < minCamberMm) {
          quantWarnings.push(`Span ${fmt(spanM, 1)}m > 4.5m needs camber ≥ ${fmt(minCamberMm, 0)} mm (got ${fmt(camberProvided, 0)} mm)`);
        }

        codeLimitSummary = `Diag Δ ≤ 3.0 mm | Plumb ≤ 6 mm/3m | Props ≤ 900 mm | Camber L/500–L/300 (>4.5m)`;
        extraMetrics.push(
          { labelEn: 'Theoretical Diagonal (D_theo)', labelBn: 'তাত্ত্বিক কর্ণ (D_theo)', value: fmt(dTheoMm, 1), unit: 'mm', highlight: true },
          { labelEn: 'Max Squareness Error', labelBn: 'সর্বোচ্চ কর্ণ ত্রুটি', value: fmt(maxSqErrMm, 1), unit: 'mm (≤3)', highlight: true },
          { labelEn: 'Plumb / Prop Spacing', labelBn: 'ওলন / প্রপস দূরত্ব', value: `${fmt(plumb, 1)}mm / ${fmt(propS, 0)}mm`, unit: '' },
          { labelEn: 'Camber (Span >4.5m)', labelBn: 'ক্যাম্বার (L/500–L/300)', value: `${fmt(camberProvided, 0)} vs ${fmt(minCamberMm, 0)}–${fmt(maxCamberMm, 0)}`, unit: 'mm' }
        );
        extraSteps.push(
          `3. D_theo = √(${fmt(L, 2)}² + ${fmt(W, 2)}²) × 1000 = ${fmt(dTheoMm, 1)} mm | |D1-D2| = ${fmt(sqDiffD1D2, 1)} mm, max dev = ${fmt(maxSqErrMm, 1)} mm (≤ 3.0 mm)`,
          `4. Plumb = ${fmt(plumb, 1)} mm/3m (≤ 6 mm) | Props = ${fmt(propS, 0)} mm (≤ 900 mm) | Camber = ${fmt(camberProvided, 0)} mm (Req ${fmt(minCamberMm, 0)}–${fmt(maxCamberMm, 0)} mm)`
        );
      } else if (testId === 'qc-rebar-seismic') {
        const memCode = Math.round(num(inputs.coverMemberCode, 3));
        const reqCoverMm = memCode === 1 ? 75 : memCode === 2 ? 50 : memCode === 4 ? 20 : 40;
        const measCover = Math.max(0, num(inputs.measuredCoverMm, 40));
        const hCol = Math.max(150, num(inputs.colDepthMm, 450));
        const Hn = Math.max(1000, num(inputs.colClearHeightMm, 3000));
        const dbTie = Math.max(6, num(inputs.stirrupBarDiaMm, 10));
        const hookTail = Math.max(0, num(inputs.hook135ExtensionMm, 80));
        const lapCode = Math.round(num(inputs.lapZoneComplianceCode, 1));
        const chairS = Math.max(200, num(inputs.chairBarSpacingMm, 950));

        const l0Mm = Math.max(hCol, Hn / 6, 450);
        const minHookMm = Math.max(6 * dbTie, 75);
        const maxLapHoopMm = Math.min(100, 6 * dbTie);

        if (measCover < reqCoverMm - 3) {
          quantAlerts.push(`Clear cover ${measCover}mm < required ${reqCoverMm}mm`);
        } else if (measCover < reqCoverMm) {
          quantWarnings.push(`Clear cover ${measCover}mm slightly below ${reqCoverMm}mm`);
        }
        if (lapCode === 2) {
          quantAlerts.push(`Column/Beam splice inside confinement zone L₀ (${fmt(l0Mm, 0)} mm) or >50% unstaggered`);
        }
        if (hookTail < minHookMm) {
          quantAlerts.push(`135° hook extension ${hookTail}mm < min ${fmt(minHookMm, 0)}mm`);
        }
        if (chairS > 1200) {
          quantAlerts.push(`Chair bar spacing ${chairS}mm > 1200mm (max 1000mm c/c)`);
        } else if (chairS > 1000) {
          quantWarnings.push(`Chair spacing ${chairS}mm > 1000mm (3'-3") target`);
        }

        codeLimitSummary = `Cover ≥ ${reqCoverMm}mm | Splice outside L₀=${fmt(l0Mm, 0)}mm | 135° Hook ≥ ${fmt(minHookMm, 0)}mm | Chairs ≤ 1000mm`;
        extraMetrics.push(
          { labelEn: 'Clear Cover (Meas vs Min)', labelBn: 'ক্লিয়ার কাভার (মাপ বনাম ন্যূনতম)', value: `${measCover} / ${reqCoverMm}`, unit: 'mm', highlight: true },
          { labelEn: 'Confinement Zone (L₀)', labelBn: 'সিসমিক কনফাইনমেন্ট (L₀)', value: fmt(l0Mm, 0), unit: 'mm', highlight: true },
          { labelEn: '135° Hook Tail (Meas vs Min)', labelBn: '১৩৫° হুক দৈর্ঘ্য', value: `${hookTail} / ${fmt(minHookMm, 0)}`, unit: 'mm' },
          { labelEn: 'Lap Hoop Max / Chair Space', labelBn: 'ল্যাপ রিং / চেয়ার দূরত্ব', value: `≤${fmt(maxLapHoopMm, 0)} / ${chairS}`, unit: 'mm' }
        );
        extraSteps.push(
          `3. Required Cover = ${reqCoverMm} mm (Provided ${measCover} mm) | L₀ = max(${hCol}, ${Hn}/6, 450) = ${fmt(l0Mm, 0)} mm`,
          `4. Required 135° Hook Tail = max(6×${dbTie}, 75) = ${fmt(minHookMm, 0)} mm (Provided ${hookTail} mm) | Chairs = ${chairS} mm (≤ 1000 mm)`
        );
      } else if (testId === 'qc-curing-deshuttering') {
        const elCode = Math.round(num(inputs.stripElementCode, 3));
        const spanM = Math.max(0.5, num(inputs.memberSpanM, 4.2));
        const ageDays = Math.max(0.2, num(inputs.concreteAgeDays, 14));
        const curingDays = Math.max(0, num(inputs.curingDaysDone, 10));
        const cemCode = Math.round(num(inputs.cementBlendCode, 1)); // 1=OPC, 2=PCC
        const tempC = num(inputs.ambientTempC, 28);

        let baseMinDays = 14;
        if (elCode === 1) baseMinDays = cemCode === 2 || tempC < 18 ? 2 : 1; // 24-48h
        else if (elCode === 2) baseMinDays = spanM > 4.5 ? 7 : 3;
        else if (elCode === 3) baseMinDays = spanM > 4.5 ? 21 : 14;
        else if (elCode === 4) baseMinDays = cemCode === 2 ? 21 : 14;
        else baseMinDays = 28; // elCode === 5 (>6m beam or cantilever)

        const extraBuffer = (cemCode === 2 || tempC < 18) && elCode >= 3 ? 3 : 0;
        const recommendedDays = baseMinDays + extraBuffer;
        const reqCuringDays = cemCode === 2 ? 10 : 7;

        if (ageDays < baseMinDays) {
          quantAlerts.push(`Concrete age ${fmt(ageDays, 1)}d < BNBC min ${baseMinDays}d (${fmt(baseMinDays - ageDays, 1)}d short)`);
        } else if (ageDays < recommendedDays) {
          quantWarnings.push(`Age ${fmt(ageDays, 1)}d meets bare min ${baseMinDays}d, but PCC/cold weather recommends ${recommendedDays}d`);
        }
        if (curingDays < reqCuringDays && elCode >= 2) {
          quantWarnings.push(`Wet curing ${curingDays}d < recommended ${reqCuringDays}d continuous hydration`);
        }

        codeLimitSummary = `BNBC Min Age ≥ ${baseMinDays}d (Rec ${recommendedDays}d) | Wet Curing ≥ ${reqCuringDays}d`;
        extraMetrics.push(
          { labelEn: 'Concrete Age vs BNBC Min', labelBn: 'ঢালাইয়ের বয়স বনাম ন্যূনতম', value: `${fmt(ageDays, 1)} / ${baseMinDays}`, unit: 'days', highlight: true },
          { labelEn: 'PCC / Cold Recommended Age', labelBn: 'নিরাপদ সুপারিশকৃত দিন', value: fmt(recommendedDays, 0), unit: 'days' },
          { labelEn: 'Wet Curing Completed', labelBn: 'ভেজা কিউরিং সম্পন্ন', value: `${curingDays} / ${reqCuringDays}+`, unit: 'days', highlight: true }
        );
        extraSteps.push(
          `3. BNBC §5.11 Min Stripping Duration = ${baseMinDays} days (Buffer +${extraBuffer}d → ${recommendedDays}d) | Actual Age = ${fmt(ageDays, 1)} days`,
          `4. Wet Curing Completed = ${curingDays} days vs Target ≥ ${reqCuringDays} days (${cemCode === 2 ? 'PCC CEM-II' : 'OPC CEM-I'}, ${tempC}°C)`
        );
      } else if (testId === 'qc-masonry-plaster') {
        const surfCode = Math.round(num(inputs.plasterSurfaceCode, 2)); // 1=ceil 6-8, 2=int 12, 3=ext 15-20
        const pThick = Math.max(1, num(inputs.plasterThicknessMm, 12));
        const gap2m = Math.max(0, num(inputs.straightedgeGap2mMm, 2.0));
        const soakH = Math.max(0, num(inputs.brickSoakHours, 2.5));
        const joint = num(inputs.mortarJointMm, 10);
        const lift = num(inputs.dailyLiftM, 1.35);
        const plumb = num(inputs.plumbErrorMm, 2.0);
        const tileHol = Math.max(0, num(inputs.tileHollowPct, 1.5));

        const pMin = surfCode === 1 ? 6 : surfCode === 3 ? 15 : 10;
        const pMax = surfCode === 1 ? 10 : surfCode === 3 ? 22 : 15;

        if (gap2m > 4.0) quantAlerts.push(`2m Straightedge flatness ${fmt(gap2m, 1)}mm > 4.0mm max`);
        else if (gap2m > 3.0) quantWarnings.push(`2m Straightedge gap ${fmt(gap2m, 1)}mm (> 3.0mm target)`);
        if (soakH < 1.5) quantAlerts.push(`Brick pre-soak ${fmt(soakH, 1)}h < 2.0h (dry bricks)`);
        else if (soakH < 2.0) quantWarnings.push(`Brick soak ${fmt(soakH, 1)}h < 2.0h`);
        if (joint > 14 || joint < 6) quantAlerts.push(`Mortar joint ${joint}mm out of 8–12mm`);
        if (lift > 1.8) quantAlerts.push(`Daily lift ${fmt(lift, 2)}m > 1.5m limit`);
        else if (lift > 1.5) quantWarnings.push(`Daily lift ${fmt(lift, 2)}m > 1.5m`);
        if (plumb > 5) quantAlerts.push(`Wall plumb ${fmt(plumb, 1)}mm > 3mm/3m`);
        else if (plumb > 3) quantWarnings.push(`Wall plumb ${fmt(plumb, 1)}mm > 3mm/3m`);
        if (tileHol > 5) quantAlerts.push(`Hollow tiles ${fmt(tileHol, 1)}% > 5% max`);
        if (pThick < pMin || pThick > pMax) quantWarnings.push(`Plaster thickness ${pThick}mm outside ${pMin}–${pMax}mm spec`);

        codeLimitSummary = `2m Straightedge ≤ 3.0mm | Plumb ≤ 3mm/3m | Lift ≤ 1.5m | Soak ≥ 2h | Hollow < 5%`;
        extraMetrics.push(
          { labelEn: '2m Patti Flatness Gap', labelBn: '২ মি. পাট্টি ফাঁকা', value: fmt(gap2m, 1), unit: 'mm (≤3)', highlight: true },
          { labelEn: 'Plaster Thickness / Plumb', labelBn: 'প্লাস্টার / ওলন ত্রুটি', value: `${pThick}mm / ${fmt(plumb, 1)}mm`, unit: '' },
          { labelEn: 'Brick Soak / Daily Lift', labelBn: 'ইট ভেজানো / দৈনিক উচ্চতা', value: `${fmt(soakH, 1)}h / ${fmt(lift, 2)}m`, unit: '' },
          { labelEn: 'Hollow Tile Rate', labelBn: 'ফাঁপা টাইলস হার', value: fmt(tileHol, 1), unit: '% (<5%)' }
        );
        extraSteps.push(
          `3. Masonry: Brick soak = ${fmt(soakH, 1)}h (≥ 2h), Joint = ${joint}mm (8–12mm), Lift = ${fmt(lift, 2)}m (≤ 1.5m), Plumb = ${fmt(plumb, 1)}mm/3m (≤ 3mm)`,
          `4. Finishing: Plaster = ${pThick}mm (Target ${pMin}–${pMax}mm), 2m Straightedge = ${fmt(gap2m, 1)}mm (≤ 3.0mm), Hollow Tiles = ${fmt(tileHol, 1)}% (< 5%)`
        );
      } else if (testId === 'qc-excavation-foundation') {
        const depthM = Math.max(0.1, num(inputs.excavationDepthM, 2.4));
        const rlErr = Math.max(0, num(inputs.rlErrorMm, 10));
        const dewat = Math.max(0, num(inputs.dewateringClearanceMm, 450));
        if (rlErr > 25) quantAlerts.push(`Bottom RL error ${rlErr}mm > 25mm max`);
        else if (rlErr > 15) quantWarnings.push(`Bottom RL error ${rlErr}mm > 15mm target`);
        if (dewat < 300) quantAlerts.push(`Dewatering ${dewat}mm < 300mm below base`);

        codeLimitSummary = `RL Error ≤ 15mm | Water Table ≥ 300mm Below Base | Shoring if Depth > 1.5m`;
        extraMetrics.push(
          { labelEn: 'RL Level Error / Depth', labelBn: 'লেভেল ত্রুটি / গভীরতা', value: `${rlErr}mm / ${fmt(depthM, 1)}m`, unit: '', highlight: true },
          { labelEn: 'Dewatering Clearance', labelBn: 'ডি-ওয়াটারিং ক্লিয়ারেন্স', value: fmt(dewat, 0), unit: 'mm (≥300)', highlight: true }
        );
        extraSteps.push(
          `3. Bottom RL Error = ${rlErr} mm (≤ 15 mm) | Excavation Depth = ${fmt(depthM, 1)} m (> 1.5 m requires shoring)`,
          `4. Groundwater Lowered = ${dewat} mm below pit base (Min 300 mm before BFS & PCC blinding).`
        );
      }

      if (criticalFails > 0 || weightedScorePct < 75 || quantAlerts.length > 0) {
        verdict = 'FAIL';
      } else if (weightedScorePct < 90 || failed > 0 || quantWarnings.length > 0) {
        verdict = 'WARNING';
      }

      const combinedAlertStr = [...quantAlerts, ...quantWarnings].join(' · ');

      return {
        testId,
        primaryMetricLabel: { en: 'Weighted QA/QC Score', bn: 'ওয়েটেড মান যাচাই স্কোর' },
        primaryValue: `${fmt(weightedScorePct, 0)}% (${passed}/${applicable} Pass | ${criticalFails} Crit. Fail)`,
        primaryUnit: '',
        codeLimitText: codeLimitSummary,
        verdict,
        weightedScorePct,
        verdictHeadline:
          verdict === 'PASS'
            ? { en: 'SIGNED OFF — EXECUTION CLEARANCE APPROVED', bn: 'পাস — কাজের অনুমোদন স্বাক্ষরের জন্য প্রস্তুত' }
            : verdict === 'WARNING'
            ? { en: 'CONDITIONAL — RECTIFY MINOR ITEMS BEFORE SIGN-OFF', bn: 'সতর্কতা — ছোটখাটো ত্রুটি ঠিক করে অনুমোদন দিন' }
            : { en: 'HOLD POINT — CRITICAL DEFECT / CODE VIOLATION', bn: 'স্থগিত (HOLD) — ক্রিটিক্যাল ত্রুটি সংশোধন ছাড়া কাজ নিষেধ' },
        verdictDetail:
          verdict === 'PASS'
            ? {
                en: `Weighted score ${fmt(weightedScorePct, 0)}% (${passed}/${applicable} Pass, ${na} N/A, 0 Critical Fails) and all geometric/code tolerances cleared.`,
                bn: `ওয়েটেড স্কোর ${fmt(weightedScorePct, 0)}% (${passed}টি পাস, ০টি ক্রিটিক্যাল ফেল) এবং সকল BNBC/PWD মাপ সঠিক—নিরাপদে পরবর্তী ধাপ শুরু করুন।`,
              }
            : verdict === 'WARNING'
            ? {
                en: `Weighted score ${fmt(weightedScorePct, 0)}% (${failed} non-critical fail). ${combinedAlertStr || 'Rectify minor items prior to sign-off.'}`,
                bn: `ওয়েটেড স্কোর ${fmt(weightedScorePct, 0)}%। ${combinedAlertStr || 'সাধারণ ত্রুটিগুলো সংশোধন করে স্বাক্ষর করুন।'}`,
              }
            : {
                en: `${criticalFails} CRITICAL checklist failure(s) or tolerance violation! ${combinedAlertStr} Hold execution until rectified.`,
                bn: `${criticalFails}টি ক্রিটিক্যাল ফেল অথবা মাপের গুরুতর ত্রুটি! ${combinedAlertStr} ত্রুটি ঠিক না করা পর্যন্ত কাজ স্থগিত রাখুন।`,
              },
        metrics: [
          { labelEn: 'Weighted QA/QC Score', labelBn: 'ওয়েটেড স্কোর', value: fmt(weightedScorePct, 1), unit: '%', highlight: true },
          { labelEn: 'Passed / Applicable', labelBn: 'পাস / প্রযোজ্য', value: `${passed} / ${applicable}`, unit: `(${criticalFails} Crit Fail)` },
          ...extraMetrics,
        ],
        steps: [
          `1. Applicable Items = ${items.length} - ${na} N/A = ${applicable} | Total Applicable Weight = ${totalApplicableWeight}`,
          `2. Weighted Score = (${passedWeight} / ${Math.max(1, totalApplicableWeight)}) × 100 = ${fmt(weightedScorePct, 1)}% (Raw ${fmt(rawScorePct, 0)}%) | Critical Fails = ${criticalFails}`,
          ...extraSteps,
        ],
      };
    }

    default:
      return {
        testId,
        primaryMetricLabel: { en: 'Evaluation Result', bn: 'পরীক্ষণের ফলাফল' },
        primaryValue: 'N/A',
        primaryUnit: '',
        codeLimitText: 'Standard Spec',
        verdict: 'PASS',
        verdictHeadline: { en: 'EVALUATED', bn: 'মূল্যায়িত' },
        verdictDetail: { en: 'Test evaluated cleanly.', bn: 'পরীক্ষা সম্পন্ন হয়েছে।' },
        metrics: [],
        steps: [],
      };
  }
}

// ============================================================================
// STANDARD LIMIT COMPARISON CHART DATA EXTRACTOR (USED IN PDF & PRINT HTML)
// ============================================================================

export interface LabBenchmarkBar {
  label: string;
  measured: number;
  limit: number;
  unit: string;
  direction: 'min' | 'max'; // 'min' = measured >= limit passes; 'max' = measured <= limit passes
  status: 'PASS' | 'WARNING' | 'FAIL';
}

export function buildLabBenchmarkBars(
  testId: string,
  inputs: Record<string, number>,
  evaluation: LabEvaluationOutput
): LabBenchmarkBar[] {
  const test = TESTING_LAB_TEST_MAP[testId];
  const inp = test ? { ...getDefaultInputsForTest(test), ...inputs } : inputs;
  const bars: LabBenchmarkBar[] = [];

  const addBar = (
    label: string,
    measured: number,
    limit: number,
    unit: string,
    direction: 'min' | 'max',
    warnTolRatio = 0.05
  ) => {
    let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    if (direction === 'min') {
      if (measured < limit * (1 - warnTolRatio)) status = 'FAIL';
      else if (measured < limit) status = 'WARNING';
    } else {
      if (measured > limit * (1 + warnTolRatio)) status = 'FAIL';
      else if (measured > limit) status = 'WARNING';
    }
    bars.push({
      label,
      measured: Number.isFinite(measured) ? measured : 0,
      limit: Number.isFinite(limit) ? limit : 1,
      unit,
      direction,
      status,
    });
  };

  if (testId === 'qc-pre-pour-rcc') {
    const L = Math.max(0.2, num(inp.roomLenM, 4.0));
    const W = Math.max(0.2, num(inp.roomWidM, 3.0));
    const dTheo = Math.sqrt(L * L + W * W) * 1000;
    const d1 = num(inp.diag1Mm, 5001);
    const d2 = num(inp.diag2Mm, 4999);
    const maxSq = Math.max(Math.abs(d1 - d2), Math.abs(d1 - dTheo), Math.abs(d2 - dTheo));
    addBar('Diagonal Squareness Err', maxSq, 3.0, 'mm', 'max', 0.66);
    addBar('Column Vertical Plumb Err', num(inp.plumbErrPer3mMm, 3.5), 6.0, 'mm/3m', 'max', 0.33);
    addBar('Prop Spacing (c/c)', num(inp.propSpacingMm, 800), 900, 'mm', 'max', 0.11);
    addBar('Weighted Checklist Score', evaluation.weightedScorePct ?? 100, 90, '%', 'min', 0.16);
  } else if (testId === 'qc-rebar-seismic') {
    const mc = Math.round(num(inp.coverMemberCode, 3));
    const reqC = mc === 1 ? 75 : mc === 2 ? 50 : mc === 4 ? 20 : 40;
    const db = Math.max(6, num(inp.stirrupBarDiaMm, 10));
    const minHook = Math.max(6 * db, 75);
    addBar('Clear Cover Provided', num(inp.measuredCoverMm, 40), reqC, 'mm', 'min', 0.08);
    addBar('135 deg Hook Tail', num(inp.hook135ExtensionMm, 80), minHook, 'mm', 'min', 0.05);
    addBar('Top Chair Bar Spacing', num(inp.chairBarSpacingMm, 950), 1000, 'mm', 'max', 0.2);
    addBar('Weighted Checklist Score', evaluation.weightedScorePct ?? 100, 90, '%', 'min', 0.16);
  } else if (testId === 'qc-curing-deshuttering') {
    const elCode = Math.round(num(inp.stripElementCode, 3));
    const span = Math.max(0.5, num(inp.memberSpanM, 4.2));
    const baseMin =
      elCode === 1 ? 1 : elCode === 2 ? (span > 4.5 ? 7 : 3) : elCode === 3 ? (span > 4.5 ? 21 : 14) : elCode === 4 ? 14 : 28;
    const reqCure = Math.round(num(inp.cementBlendCode, 1)) === 2 ? 10 : 7;
    addBar('Concrete Age vs Stripping Min', num(inp.concreteAgeDays, 14), baseMin, 'days', 'min', 0.02);
    addBar('Wet Curing Completed', num(inp.curingDaysDone, 10), reqCure, 'days', 'min', 0.2);
    addBar('Weighted Checklist Score', evaluation.weightedScorePct ?? 100, 90, '%', 'min', 0.16);
  } else if (testId === 'qc-masonry-plaster') {
    addBar('2m Straightedge Flatness', num(inp.straightedgeGap2mMm, 2.0), 3.0, 'mm', 'max', 0.33);
    addBar('Wall Plumb Err (/3m)', num(inp.plumbErrorMm, 2.0), 3.0, 'mm', 'max', 0.66);
    addBar('Daily Masonry Lift', num(inp.dailyLiftM, 1.35), 1.5, 'm', 'max', 0.2);
    addBar('Brick Pre-Soak Time', num(inp.brickSoakHours, 2.5), 2.0, 'hr', 'min', 0.25);
    addBar('Hollow Tile Rate', num(inp.tileHollowPct, 1.5), 5.0, '%', 'max', 0.05);
  } else if (testId === 'qc-excavation-foundation') {
    addBar('Pit Bottom RL Error', num(inp.rlErrorMm, 10), 15, 'mm', 'max', 0.66);
    addBar('Dewatering Below Base', num(inp.dewateringClearanceMm, 450), 300, 'mm', 'min', 0.05);
    addBar('Weighted Checklist Score', evaluation.weightedScorePct ?? 100, 90, '%', 'min', 0.16);
  } else {
    // Generic quantitative benchmark bars extracted from evaluation metrics vs numeric code limits
    const firstMetric = evaluation.metrics[0];
    const parsedNum = firstMetric ? parseFloat(String(firstMetric.value).replace(/[^0-9.-]/g, '')) : NaN;
    const verdictPass = evaluation.verdict === 'PASS' ? 100 : evaluation.verdict === 'WARNING' ? 80 : 45;
    if (Number.isFinite(parsedNum) && parsedNum > 0) {
      bars.push({
        label: sanitizeEngineeringSymbols(firstMetric.labelEn).slice(0, 32),
        measured: parsedNum,
        limit: parsedNum,
        unit: sanitizeEngineeringSymbols(firstMetric.unit || ''),
        direction: 'min',
        status: evaluation.verdict,
      });
    }
    bars.push({
      label: 'BNBC / ASTM Compliance Index',
      measured: verdictPass,
      limit: 90,
      unit: '%',
      direction: 'min',
      status: evaluation.verdict,
    });
  }

  return bars;
}

// ============================================================================
// QR-VERIFIED A4 LAB TEST CERTIFICATE PDF EXPORTER (jsPDF)
// ============================================================================

export async function exportLabTestCertificatePdf(params: {
  test: LabTestDefinition;
  inputs: Record<string, number>;
  evaluation: LabEvaluationOutput;
  sampleRef: string;
  locationGrid: string;
  remarks: string;
  workspace: CivilWorkspace;
  userProfile?: UserProfile;
  checklistStates?: Record<string, ChecklistItemStatus>;
  customOverrides?: {
    reportTitle?: string;
    projectName?: string;
    clientName?: string;
    signatoryName?: string;
    paperSize?: 'a4' | 'letter' | 'legal';
    orientation?: 'portrait' | 'landscape';
    marginMm?: number;
    includeQR?: boolean;
    includeFormulaSteps?: boolean;
    includeDiagram?: boolean;
    includeSignatureBlock?: boolean;
  };
}): Promise<string> {
  const {
    test,
    inputs,
    evaluation,
    sampleRef,
    locationGrid,
    remarks,
    workspace,
    userProfile,
    checklistStates,
    customOverrides,
  } = params;

  const paperFormat = customOverrides?.paperSize || 'a4';
  const orientation = customOverrides?.orientation || 'portrait';
  const doc = new jsPDF({ orientation, unit: 'mm', format: paperFormat });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = customOverrides?.marginMm ?? 14;
  const contentWidth = pageWidth - 2 * margin;
  const docId = generateSubmittalDocRef(2026);
  const nowStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Register cryptographic verification envelope so QR scan verifies cleanly
  const envelopeCompat: any = {
    status: evaluation.verdict === 'PASS' ? 'valid' : evaluation.verdict === 'WARNING' ? 'warning' : 'invalid',
    issues: [],
    result: {
      title: `${test.code}: ${test.title.en}`,
      summary: `${evaluation.primaryValue} ${evaluation.primaryUnit} [${evaluation.verdict}]`,
      status: evaluation.verdict === 'PASS' ? 'valid' : evaluation.verdict === 'WARNING' ? 'warning' : 'invalid',
    },
  };
  const verifiedRecord = createVerifiedReportRecord(
    workspace,
    'testing-lab-qaqc',
    envelopeCompat,
    userProfile,
    docId
  );
  saveVerifiedReport(verifiedRecord);

  let qrDataUrl = '';
  if (customOverrides?.includeQR !== false) {
    try {
      qrDataUrl = await QRCode.toDataURL(verifiedRecord.verificationUrl, {
        margin: 1,
        width: 160,
        errorCorrectionLevel: 'M',
      });
    } catch {
      qrDataUrl = '';
    }
  }

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');
  try {
    doc.addImage(BRAND_LOGO_BASE64, 'PNG', margin, 5, 20, 20);
  } catch {
    // ignore image error
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text(
    sanitizeEngineeringSymbols(
      customOverrides?.reportTitle || 'BD. CivilLab — QUALITY ASSURANCE & LAB TEST CERTIFICATE'
    ),
    margin + 24,
    12.5
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(148, 163, 184);
  doc.text(`Ref: ${docId}  |  Test Code: ${test.code} (${test.testType})  |  Issued: ${nowStr}`, margin + 24, 18.5);
  doc.text(`Governing Codes: ${sanitizeEngineeringSymbols(test.governingCodes.join(' . '))}`, margin + 24, 24.5);

  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth - margin - 24, 3.5, 24, 25, 'F');
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 22.5, 4.5, 21, 21);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(5.5);
    doc.text('SCAN TO VERIFY', pageWidth - margin - 12, 27.6, { align: 'center' });
  }

  let y = 39;

  // Test Title + Bold Official Stamp Badge
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  const titleWrapped = doc.splitTextToSize(sanitizeEngineeringSymbols(test.title.en), contentWidth - 42);
  doc.text(titleWrapped, margin, y);

  const vColor: [number, number, number] =
    evaluation.verdict === 'PASS'
      ? [22, 163, 74]
      : evaluation.verdict === 'WARNING'
      ? [217, 119, 6]
      : [220, 38, 38];

  // Official Stamp Box on Top-Right
  doc.setDrawColor(vColor[0], vColor[1], vColor[2]);
  doc.setLineWidth(0.9);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 36, y - 4.5, 36, 12, 1.5, 1.5, 'FD');
  doc.setTextColor(vColor[0], vColor[1], vColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(evaluation.verdict, pageWidth - margin - 18, y + 1.5, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('OFFICIAL QA/QC STAMP', pageWidth - margin - 18, y + 5.5, { align: 'center' });

  y += Math.max(8, titleWrapped.length * 4.8) + 2;

  // Verdict Banner
  doc.setFillColor(vColor[0], vColor[1], vColor[2]);
  doc.roundedRect(margin, y, contentWidth, 11, 1.8, 1.8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(
    sanitizeEngineeringSymbols(`VERDICT: ${evaluation.verdict} — ${evaluation.verdictHeadline.en}`),
    margin + 4,
    y + 7
  );
  y += 15;

  // Project & Sample Metadata Grid
  const projectLabel = customOverrides?.projectName || workspace.name;
  const engineerLabel = customOverrides?.signatoryName || userProfile?.fullName || workspace.engineerOfRecord;
  const clientLine = customOverrides?.clientName ? `\nClient: ${sanitizeEngineeringSymbols(customOverrides.clientName)}` : '';

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.0, cellPadding: 2.0 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    head: [['Project & Engineering Authority', 'Sample & Code Identification']],
    body: [
      [
        `Project: ${sanitizeEngineeringSymbols(projectLabel)} [${workspace.projectCode}]\nSite: ${sanitizeEngineeringSymbols(workspace.siteLocation)}${clientLine}\nEngineer: ${sanitizeEngineeringSymbols(engineerLabel)}`,
        `Sample ID / Batch: ${sanitizeEngineeringSymbols(sampleRef || 'LAB-SMP-001')}\nMember / Grid Location: ${sanitizeEngineeringSymbols(locationGrid || 'Site Stockpile / Pour Zone')}\nAcceptance Standard: ${sanitizeEngineeringSymbols(evaluation.codeLimitText)}`,
      ],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 4.5;

  // Observed Inputs & Evaluated Metrics Tables
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'striped',
    styles: { fontSize: 8.0, cellPadding: 1.8 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255 },
    head: [['Observed Test Parameter', 'Measured Value', 'Unit']],
    body: test.calculatorInputs.map((f) => [
      sanitizeEngineeringSymbols(f.label.en),
      sanitizeEngineeringSymbols(formatLabFieldValue(f, inputs[f.key])),
      f.options ? 'Preset' : sanitizeEngineeringSymbols(f.unit || '-'),
    ]),
  });
  y = (doc as any).lastAutoTable.finalY + 4.5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.2, cellPadding: 2.0 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    head: [['Evaluated Engineering Metric', 'Computed Output', 'Unit']],
    body: evaluation.metrics.map((m) => [
      sanitizeEngineeringSymbols(m.labelEn),
      sanitizeEngineeringSymbols(m.value),
      sanitizeEngineeringSymbols(m.unit || '-'),
    ]),
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // Standard Limit Comparison Chart (Vector Horizontal Bar Graphic)
  const bars = buildLabBenchmarkBars(test.id, inputs, evaluation);
  if (customOverrides?.includeDiagram !== false && bars.length > 0) {
    const chartH = 9 + bars.length * 7.5;
    if (y + chartH > pageHeight - 40) {
      doc.addPage();
      y = 18;
    }
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, y, contentWidth, chartH, 1.8, 1.8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(30, 58, 138);
    doc.text('STANDARD LIMIT COMPARISON CHART (MEASURED VS ALLOWABLE CODE THRESHOLD)', margin + 3.5, y + 5.2);

    let barY = y + 9.5;
    const labelColW = 54;
    const valColW = 36;
    const trackW = contentWidth - labelColW - valColW - 8;
    const trackX = margin + labelColW + 3;

    for (const b of bars) {
      const denom = Math.max(1e-6, b.limit * 1.4, b.measured * 1.1);
      const measW = Math.min(trackW, Math.max(2, (b.measured / denom) * trackW));
      const limX = trackX + Math.min(trackW - 1, (b.limit / denom) * trackW);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);
      doc.text(sanitizeEngineeringSymbols(b.label).slice(0, 31), margin + 3.5, barY + 3.2);

      // Background Track
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(trackX, barY, trackW, 4, 0.8, 0.8, 'F');

      // Measured Bar
      const bCol: [number, number, number] =
        b.status === 'PASS' ? [16, 185, 129] : b.status === 'WARNING' ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(bCol[0], bCol[1], bCol[2]);
      doc.roundedRect(trackX, barY, measW, 4, 0.8, 0.8, 'F');

      // Code Threshold Vertical Marker
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.6);
      doc.line(limX, barY - 0.8, limX, barY + 4.8);

      // Value Readout
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      const limPrefix = b.direction === 'min' ? '>=' : '<=';
      doc.text(
        sanitizeEngineeringSymbols(`${Number(b.measured.toFixed(1))} vs ${limPrefix}${Number(b.limit.toFixed(1))} ${b.unit}`),
        pageWidth - margin - 3,
        barY + 3.2,
        { align: 'right' }
      );

      barY += 7.2;
    }
    y += chartH + 4.5;
  }

  // Weighted Checklist Audit Table if Domain 9
  if (test.checklistItems && test.checklistItems.length > 0 && checklistStates) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.6 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [['QA/QC Inspection Point', 'Code', 'Wt', 'Crit', 'Status']],
      body: test.checklistItems.map((it) => [
        sanitizeEngineeringSymbols(it.item.en),
        it.codeRef,
        String(it.weight ?? (it.critical ? 20 : 10)),
        it.critical ? 'YES' : 'No',
        checklistStates[it.id] || 'PASS',
      ]),
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // Governing Equations & Step-by-Step Derivations
  if (customOverrides?.includeFormulaSteps !== false) {
    if (y > pageHeight - 65) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Governing Equations, Derivations & Engineering Interpretation:', margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    const govEqs = test.mathSection.formulas.map((f) => `Eq (${f.name.en}): ${f.equation}`);
    const stepLines = [
      ...govEqs.map((g) => sanitizeEngineeringSymbols(g)),
      ...evaluation.steps.map((s) => sanitizeEngineeringSymbols(s)),
      `Interpretation: ${sanitizeEngineeringSymbols(evaluation.verdictDetail.en)}`,
      ...(remarks.trim() ? [`Engineer Remarks: ${sanitizeEngineeringSymbols(remarks.trim())}`] : []),
    ];
    for (const line of stepLines) {
      const wrapped = doc.splitTextToSize(line, contentWidth);
      if (y + wrapped.length * 3.8 > pageHeight - 36) {
        doc.addPage();
        y = 18;
      }
      doc.text(wrapped, margin, y);
      y += wrapped.length * 3.8 + 1;
    }
  }

  // 3-Tier QA/QC Sign-Off Matrix
  if (customOverrides?.includeSignatureBlock !== false) {
    if (y > pageHeight - 34) {
      doc.addPage();
      y = 18;
    }
    const sigY = Math.max(y + 10, pageHeight - 31);
    const colW = (contentWidth - 12) / 3;
    const tiers = [
      { title: '1. Tested / Inspected By', role: 'Site QA/QC Engineer', name: engineerLabel },
      { title: '2. Checked / Verified By', role: 'Resident / Project Engineer', name: 'Project In-Charge' },
      { title: '3. Approved By', role: 'Consultant / Client Rep', name: customOverrides?.clientName || 'Authorized Signatory' },
    ];
    tiers.forEach((tier, idx) => {
      const xStart = margin + idx * (colW + 6);
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.35);
      doc.line(xStart, sigY, xStart + colW, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.6);
      doc.setTextColor(15, 23, 42);
      doc.text(sanitizeEngineeringSymbols(tier.title), xStart, sigY + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(sanitizeEngineeringSymbols(`${tier.name} · ${tier.role}`), xStart, sigY + 8);
    });
  }

  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Hash: ${verifiedRecord.verificationHash} · BD. CivilLab Certified QA/QC Laboratory Certificate · Page 1`,
    margin,
    pageHeight - 8
  );

  doc.save(`${test.code}_${docId}_Lab_Certificate.pdf`);
  return docId;
}

export async function buildPrintableLabCertificateHtml(params: {
  test: LabTestDefinition;
  inputs: Record<string, number>;
  evaluation: LabEvaluationOutput;
  sampleRef: string;
  locationGrid: string;
  remarks: string;
  workspace: CivilWorkspace;
  userProfile?: UserProfile;
  checklistStates?: Record<string, ChecklistItemStatus>;
}): Promise<string> {
  const {
    test,
    inputs,
    evaluation,
    sampleRef,
    locationGrid,
    remarks,
    workspace,
    userProfile,
    checklistStates,
  } = params;
  const docId = generateSubmittalDocRef(2026);
  const nowStr = new Date().toLocaleString();

  const envelopeCompat: any = {
    status: evaluation.verdict === 'PASS' ? 'valid' : evaluation.verdict === 'WARNING' ? 'warning' : 'invalid',
    issues: [],
    result: {
      title: `${test.code}: ${test.title.en}`,
      summary: `${evaluation.primaryValue} ${evaluation.primaryUnit} [${evaluation.verdict}]`,
      status: evaluation.verdict === 'PASS' ? 'valid' : evaluation.verdict === 'WARNING' ? 'warning' : 'invalid',
    },
  };
  const verifiedRecord = createVerifiedReportRecord(
    workspace,
    'testing-lab-qaqc',
    envelopeCompat,
    userProfile,
    docId
  );
  saveVerifiedReport(verifiedRecord);
  const qrDataUrl = await QRCode.toDataURL(verifiedRecord.verificationUrl, { margin: 1, width: 150 }).catch(() => '');

  const verdictColor =
    evaluation.verdict === 'PASS'
      ? 'bg-emerald-600 text-white'
      : evaluation.verdict === 'WARNING'
      ? 'bg-amber-600 text-white'
      : 'bg-rose-600 text-white';
  const stampClass =
    evaluation.verdict === 'PASS'
      ? 'border-emerald-700 text-emerald-700 bg-emerald-50'
      : evaluation.verdict === 'WARNING'
      ? 'border-amber-700 text-amber-700 bg-amber-50'
      : 'border-rose-700 text-rose-700 bg-rose-50';

  const bars = buildLabBenchmarkBars(test.id, inputs, evaluation);
  const barsHtml = bars
    .map((b) => {
      const denom = Math.max(1e-6, b.limit * 1.4, b.measured * 1.1);
      const measPct = Math.min(100, Math.max(4, (b.measured / denom) * 100));
      const limPct = Math.min(98, Math.max(4, (b.limit / denom) * 100));
      const fillCls =
        b.status === 'PASS' ? 'bg-emerald-500' : b.status === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500';
      const op = b.direction === 'min' ? '≥' : '≤';
      return `
        <div class="space-y-0.5">
          <div class="flex justify-between text-[10px] font-mono">
            <span class="font-semibold text-slate-700">${b.label}</span>
            <span class="font-bold text-slate-900">${Number(b.measured.toFixed(1))} vs ${op} ${Number(b.limit.toFixed(1))} ${b.unit} [${b.status}]</span>
          </div>
          <div class="relative h-2.5 w-full bg-slate-200 rounded overflow-hidden">
            <div class="h-full ${fillCls}" style="width:${measPct.toFixed(1)}%"></div>
            <div class="absolute top-0 bottom-0 w-0.5 bg-slate-900" style="left:${limPct.toFixed(1)}%" title="Code Limit"></div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="space-y-4 font-sans text-slate-900 bg-white p-6 max-w-4xl mx-auto leading-relaxed">
      <div class="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4 print-avoid-break">
        <div class="flex items-center gap-3">
          <img src="${BRAND_LOGO_SRC}" alt="BD. CivilLab" class="w-12 h-12 rounded-lg object-contain bg-slate-900 p-1 border border-slate-300" />
          <div>
            <div class="text-xl font-black text-blue-700">BD. CivilLab — Laboratory &amp; Field QA/QC Certificate</div>
            <div class="text-xs font-mono text-slate-600">${test.code} · ${test.testType} (${test.testTypeBn}) · ${nowStr}</div>
            <div class="text-xs font-bold text-slate-900 mt-0.5">${test.title.en} (${test.title.bn})</div>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="px-3 py-1.5 border-2 rounded font-mono text-center -rotate-2 ${stampClass}">
            <div class="text-sm font-black tracking-wider">${evaluation.verdict}</div>
            <div class="text-[7px] font-bold uppercase tracking-widest">QA/QC STAMP</div>
          </div>
          ${
            qrDataUrl
              ? `<div class="border border-slate-800 p-1 rounded bg-white text-center shrink-0">
                  <img src="${qrDataUrl}" alt="QR" class="w-16 h-16" />
                  <div class="text-[7px] font-mono font-bold">${docId}</div>
                </div>`
              : ''
          }
        </div>
      </div>

      <div class="px-4 py-2.5 rounded-lg font-bold text-sm ${verdictColor} print-avoid-break">
        VERDICT: ${evaluation.verdict} — ${evaluation.verdictHeadline.en} (${evaluation.verdictHeadline.bn})
      </div>

      <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-300 rounded text-xs font-mono print-avoid-break">
        <div>
          <div class="font-bold text-slate-500 uppercase text-[10px]">Project Information</div>
          <div class="font-bold text-slate-900">${workspace.name} [${workspace.projectCode}]</div>
          <div>Site: ${workspace.siteLocation}</div>
          <div>Engineer: ${userProfile?.fullName || workspace.engineerOfRecord}</div>
        </div>
        <div>
          <div class="font-bold text-slate-500 uppercase text-[10px]">Sample &amp; Code Reference</div>
          <div>Sample Ref: <strong>${sampleRef || 'LAB-SMP-001'}</strong></div>
          <div>Grid / Zone: ${locationGrid || 'Site Pour / Stockpile'}</div>
          <div>Codes: ${test.governingCodes.join(' · ')}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 print-avoid-break">
        <table class="w-full border-collapse border border-slate-300 text-xs">
          <thead><tr class="bg-slate-800 text-white"><th class="p-2 text-left">Observed Input</th><th class="p-2 text-right">Value</th></tr></thead>
          <tbody>
            ${test.calculatorInputs
              .map(
                (f) =>
                  `<tr class="border-t border-slate-200"><td class="p-1.5">${f.label.en}<br/><span class="text-[10px] text-slate-500">${f.label.bn}</span></td><td class="p-1.5 text-right font-mono font-bold">${formatLabFieldValue(f, inputs[f.key])}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
        <table class="w-full border-collapse border border-slate-300 text-xs">
          <thead><tr class="bg-emerald-800 text-white"><th class="p-2 text-left">Evaluated Metric</th><th class="p-2 text-right">Output</th></tr></thead>
          <tbody>
            ${evaluation.metrics
              .map(
                (m) =>
                  `<tr class="border-t border-slate-200"><td class="p-1.5">${m.labelEn}<br/><span class="text-[10px] text-slate-500">${m.labelBn}</span></td><td class="p-1.5 text-right font-mono font-bold">${m.value} ${m.unit}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>

      ${
        bars.length > 0
          ? `<div class="p-3 bg-slate-50 border border-slate-300 rounded space-y-2 print-avoid-break">
              <div class="text-[10px] font-mono font-bold uppercase text-blue-800">Standard Limit Comparison Chart (Measured vs Allowable Code Limit)</div>
              ${barsHtml}
            </div>`
          : ''
      }

      ${
        test.checklistItems && test.checklistItems.length > 0 && checklistStates
          ? `<table class="w-full border-collapse border border-slate-300 text-xs print-avoid-break">
              <thead><tr class="bg-slate-800 text-white"><th class="p-1.5 text-left">Inspection Point</th><th class="p-1.5">Code</th><th class="p-1.5">Wt</th><th class="p-1.5">Status</th></tr></thead>
              <tbody>
                ${test.checklistItems
                  .map(
                    (it) =>
                      `<tr class="border-t border-slate-200"><td class="p-1.5">${it.item.en} (${it.item.bn})</td><td class="p-1.5 text-center font-mono">${it.codeRef}</td><td class="p-1.5 text-center font-mono">${it.weight ?? 10}</td><td class="p-1.5 text-center font-bold">${checklistStates[it.id] || 'PASS'}</td></tr>`
                  )
                  .join('')}
              </tbody>
            </table>`
          : ''
      }

      <div class="p-3 border border-slate-300 rounded text-xs space-y-1 print-avoid-break">
        <div class="font-bold uppercase text-[10px] text-slate-500">Governing Equations &amp; Derivation Steps</div>
        ${test.mathSection.formulas.map((f) => `<div class="font-mono text-blue-900 font-semibold">${f.name.en}: ${f.equation}</div>`).join('')}
        ${evaluation.steps.map((s) => `<div class="font-mono">${s}</div>`).join('')}
        <div class="pt-1 text-slate-800"><strong>Interpretation:</strong> ${evaluation.verdictDetail.en} (${evaluation.verdictDetail.bn})</div>
        ${remarks.trim() ? `<div class="text-slate-700"><strong>Remarks:</strong> ${remarks}</div>` : ''}
      </div>

      <div class="pt-10 grid grid-cols-3 gap-6 text-xs font-mono print-avoid-break">
        <div class="border-t border-slate-800 pt-1 text-center">
          <div class="font-bold">1. Tested / Inspected By</div>
          <div class="text-[10px] text-slate-500">${userProfile?.fullName || 'Site QA/QC Engineer'}</div>
        </div>
        <div class="border-t border-slate-800 pt-1 text-center">
          <div class="font-bold">2. Checked / Verified By</div>
          <div class="text-[10px] text-slate-500">Resident / Project Engineer</div>
        </div>
        <div class="border-t border-slate-800 pt-1 text-center">
          <div class="font-bold">3. Approved By</div>
          <div class="text-[10px] text-slate-500">Consultant / Client Rep</div>
        </div>
      </div>
      <div class="text-[9px] font-mono text-slate-400 text-center pt-1">
        Verification Hash: ${verifiedRecord.verificationHash} · BD. CivilLab Certified Engineering QA/QC Portal
      </div>
    </div>
  `;
}
