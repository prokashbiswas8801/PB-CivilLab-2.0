import { LabTestDefinition } from '../types/testingLab';

export const TESTING_LAB_TESTS_PART3_CAT6_7_8: LabTestDefinition[] = [
  // =========================================================================
  // CATEGORY 6: SOIL, COMPACTION & PILE FOUNDATION TESTS
  // (মাটি, কম্প্যাকশন ও পাইল পরীক্ষা) — 5 Complete 10-Section Bilingual Protocols
  // =========================================================================

  // 6.1 STANDARD PENETRATION TEST — SPT (N-VALUE) & CORRECTIONS
  {
    id: 'soil-spt-nvalue',
    domainId: 'soil-pile',
    code: 'LAB-SOI-01',
    title: {
      en: 'Standard Penetration Test (SPT N-Value) & Overburden / Energy Corrections',
      bn: 'স্ট্যান্ডার্ড পেনিট্রেশন টেস্ট (SPT N-মান) ও এন-৬০ / ওভারবার্ডেন সংশোধন',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড বোরহোল ও জিওটেকনিক্যাল বিশ্লেষণ',
    governingCodes: ['ASTM D1586', 'BNBC-2020 Part 6 Ch. 3', 'IS 2131'],
    objective: {
      en: 'Measures in-situ soil resistance (N-value) at every 1.5 m borehole depth interval to classify clay consistency or sand relative density, calculate safe bearing capacity for shallow footings, verify pile founding stratum, and assess seismic liquefaction potential across Bangladesh alluvial deposits.',
      bn: 'বোরহোলের প্রতি ১.৫ মিটার গভীরতায় মাটির ভেদন প্রতিরোধ ক্ষমতা (SPT N-মান) পরিমাপ করে মাটির ঘনত্ব বা দৃঢ়তা নির্ণয়, অগভীর ফুটিংয়ের বেয়ারিং ক্যাপাসিটি হিসাব, পাইলের শেষ স্তর নির্বাচন এবং ভূমিকম্পে মাটির লিকুইফ্যাকশন (Liquefaction) ঝুঁকি যাচাই করে।',
    },
    sampling: {
      frequency: {
        en: 'Every 1.5 m (5 ft) vertical interval inside each geotechnical borehole (minimum 2–3 boreholes per residential building; 1 borehole per 300–500 m² footprint).',
        bn: 'প্রতিটি জিওটেকনিক্যাল বোরহোলের প্রতি ১.৫ মিটার (৫ ফুট) গভীরতা পরপর (আবাসিক ভবনে ন্যূনতম ২–৩টি বোরহোল; প্রতি ৩০০–৫০০ বর্গমিটারে ১টি)।',
      },
      quantity: {
        en: 'Full 450 mm (18") split-spoon penetration driven in three consecutive 150 mm (6") stages (N₁, N₂, N₃), with disturbed soil sample sealed cleanly in plastic jars.',
        bn: 'পরপর তিনটি ১৫০ মিমি (৬ ইঞ্চি) ধাপে মোট ৪৫০ মিমি (১৮ ইঞ্চি) স্প্লিট-স্পুন স্যাম্পলার প্রবেশ করিয়ে N₁, N₂, N₃ আঘাত গণনা ও ভেতরের মাটির নমুনা জারে সংরক্ষণ।',
      },
      lotSize: {
        en: '1 Borehole test horizon at specified RL / depth.',
        bn: 'নির্দিষ্ট গভীরতায় ১টি বোরহোল টেস্ট স্তর।',
      },
    },
    apparatus: [
      {
        item: { en: 'Standard Split-Spoon Sampler (Hardened Steel Shoe)', bn: 'স্ট্যান্ডার্ড স্প্লিট-স্পুন স্যাম্পলার' },
        spec: 'OD = 50.8 mm (2.0"), ID = 35.0 mm (1.375"), Length ≥ 450 mm',
      },
      {
        item: { en: 'Standard SPT Drop Hammer & Guide Rod Assembly', bn: 'এসপিটি ড্রপ হ্যামার ও গাইড রড' },
        spec: 'Mass = 63.5 kg (140 lb), Free-Fall Drop Height = 760 mm (30")',
      },
      {
        item: { en: 'Drill Rods (AW / BW), Cathead Winch or Auto-Trip Rig & Depth Tape', bn: 'ড্রিল রড (AW/BW), উইঞ্চ/ট্রিপ রিগ ও মাপার ফিতা' },
        spec: '150 mm chalk marks on drill rod above casing collar',
      },
    ],
    procedure: [
      {
        en: 'Advance the borehole cleanly to the test depth and flush out bottom sludge/cuttings carefully without disturbing underlying virgin soil.',
        bn: 'নির্ধারিত গভীরতা পর্যন্ত বোরহোল ড্রিল করে নিচের আলগা কাদা ও বালি ভালোভাবে ফ্লাশ করে পরিষ্কার করুন—যেন তলার মূল মাটি আলগা না হয়।',
      },
      {
        en: 'Thread the Split-Spoon sampler (OD 50.8 mm, ID 35 mm) onto the drill rod string and lower gently to rest firmly on the cleaned borehole bottom.',
        bn: 'ড্রিল রডের মাথায় স্প্লিট-স্পুন স্যাম্পলার লাগিয়ে ধীরে ধীরে বোরহোলের তলায় বসান।',
      },
      {
        en: 'Mark three consecutive 150 mm (6") increments on the upper drill rod with chalk. Drop the 63.5 kg (140 lb) Donut or Safety hammer freely from exactly 760 mm (30") height, counting blows N₁, N₂, and N₃ for each 150 mm penetration.',
        bn: 'ওপরের ড্রিল রডে পরপর তিনটি ১৫০ মিমি (৬ ইঞ্চি) করে দাগ দিন। ৬৩.৫ কেজি (১৪০ পাউন্ড) হ্যামারটি ঠিক ৭৬০ মিমি (৩০ ইঞ্চি) উচ্চতা থেকে মুক্তভাবে ফেলে প্রতি ৬ ইঞ্চিতে আঘাতের সংখ্যা (N₁, N₂, N₃) গুনে লিখুন।',
      },
      {
        en: 'Discard N₁ (first 150 mm seating drive through disturbed borehole mud) and record Field N = N₂ + N₃. Terminate drive if 50 blows occur in any 150 mm stage (Refusal > 50/150 mm). Apply Energy (E_m/60), Borehole (C_B), Sampler (C_S), Rod Length (C_R), and Overburden (C_N) corrections.',
        bn: 'প্রথম ১৫০ মিমি-এর N₁ বাদ দিয়ে Field N = N₂ + N₃ হিসাব করুন (যেকোনো ১৫০ মিমি ধাপে ৫০+ আঘাত লাগলে Refusal লিখে থামুন)। এরপর হ্যামার এনার্জি (E_m/60), C_B, C_S, C_R ও ওভারবার্ডেন C_N সংশোধন প্রয়োগ করে N₆₀ ও (N₁)₆₀ বের করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Maintain borehole water/bentonite slurry head AT OR ABOVE surrounding groundwater table at all times in loose sand—low head causes upward piping ("boiling"), producing falsely low N = 1–2 readings.',
          bn: 'বালু মাটিতে বোরিংয়ের সময় গর্তের ভেতরের পানির/বেনটোনাইটের লেভেল সর্বদা ভূগর্ভস্থ পানির স্তরের চেয়ে উঁচু রাখুন—না হলে নিচ থেকে বালি ফুলে উঠে (Sand Boiling) ভুল কম N-মান দেখাবে।',
        },
        {
          en: 'Count turns on the cathead rope (strictly ≤ 2 wraps for Donut hammer, ~45% energy) and verify full 760 mm drop mark.',
          bn: 'ডোনাট হ্যামারে দড়ির প্যাঁচ ২টির বেশি দেবেন না এবং প্রতি আঘাতে পুরো ৭৬০ মিমি (৩০ ইঞ্চি) উঠছে কিনা নিশ্চিত করুন।',
        },
      ],
      contractorTricks: [
        {
          en: '"Short-Stroke Hammer Drop & Uncleaned Slump Mud": Drilling helpers drop the 63.5 kg hammer only 500–600 mm when exhausted or count N₁+N₂ instead of N₂+N₃—skewing soil logs toward wrong foundation depths. Even worse: fabricating high N-values on paper without drilling deep!',
          bn: 'কম উচ্চতা থেকে হাতুড়ি ফেলা ও N₁ যোগ করে বাড়তি N দেখানো: ক্লান্ত হেল্পার ৭৬০ মিমির বদলে ৫০০–৬০০ মিমি থেকে হাতুড়ি ছাড়লে ভুয়া বেশি N-মান আসে; আবার অনেকে কাদার N₁-ও যোগ করে ফেলে! তাই স্যাম্পলারে প্রকৃত মাটি ওঠা নিজ চোখে পরীক্ষা করুন।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Field N-Value, Energy-Corrected N₆₀ & Overburden-Normalized (N₁)₆₀', bn: 'ফিল্ড N, সংশোধিত N₆₀ ও ওভারবার্ডেন-সমন্বিত (N₁)₆₀ সূত্র' },
          equation: 'N_field = N₂ + N₃  |  N₆₀ = N_field × (E_m / 60) × C_B × C_S × C_R  |  C_N = min(√(100 / σ\'_v), 2.0)  |  (N₁)₆₀ = C_N × N₆₀',
          variables: [
            { en: 'N₂, N₃ = Blow counts for 150–300 mm and 300–450 mm penetration (N₁ seating discarded)', bn: 'N₂, N₃ = ২য় ও ৩য় ১৫০ মিমি ধাপের আঘাত সংখ্যা (প্রথম N₁ বাদ)' },
            { en: 'E_m = Hammer energy efficiency % (Donut ~45%, Safety ~60%, Automatic Trip ~80%)', bn: 'E_m = হ্যামার দক্ষতা % (ডোনাট ৪৫%, সেফটি ৬০%, অটো-ট্রিপ ৮০%)' },
            { en: 'C_B = Borehole factor (1.0 for 65–115mm; 1.05 for 150mm; 1.15 for 200mm); C_S = Sampler (1.0 std; 1.2 no liner); C_R = Rod length factor (0.75–1.00)', bn: 'C_B, C_S, C_R = বোরহোল, স্যাম্পলার ও রড দৈর্ঘ্য সংশোধন গুণিতক' },
            { en: 'σ\'_v = Effective vertical overburden stress at test depth (kPa)', bn: 'σ\'_v = পরীক্ষা গভীরতায় কার্যকর মাটির চাপ (kPa)' },
          ],
          unitNote: 'Cohesive Clay N₆₀: 0–2 V.Soft, 2–4 Soft, 4–8 Med.Stiff, 8–15 Stiff, 15–30 V.Stiff, >30 Hard. Sand N₆₀: 0–4 V.Loose, 4–10 Loose, 10–30 Med.Dense, 30–50 Dense, >50 V.Dense.',
        },
      ],
      workedExample: {
        en: 'Sand stratum at 7.5 m (σ\'_v = 90 kPa), Safety hammer (E_m=60%), 100mm borehole (C_B=1.0), std liner (C_S=1.0), L=7.5m (C_R=0.95). Blows: N₁=4, N₂=8, N₃=10 → N_field = 18. N₆₀ = 18 × (60/60) × 1.0 × 1.0 × 0.95 = 17.1; C_N = min(√(100/90), 2.0) = 1.054 → (N₁)₆₀ = 18.0 (Medium Dense Sand).',
        bn: '৭.৫ মি. গভীরতায় বালু স্তরে (σ\'_v = ৯০ kPa, সেফটি হ্যামার E_m=৬০%, C_R=০.৯৫) আঘাত N₁=৪, N₂=৮, N₃=১০ → Field N = ১৮। N₆₀ = ১৮ × ০.৯৫ = ১৭.১; C_N = ১.০৫৪ → (N₁)₆₀ = ১৮.০ (মাঝারি ঘন বালু)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Cohesive N₆₀ ≥ 8 (Stiff–Hard) OR Sand N₆₀ ≥ 10 (Medium Dense–Very Dense)', codeLimit: 'BNBC-2020 / ASTM D1586', interpretation: { en: 'Competent load-bearing stratum suitable for shallow footings (at higher N) or deep pile founding (N ≥ 30–50).', bn: 'দৃঢ় বা ঘন মাটির স্তর—ফুটিং বা পাইল স্থাপনের জন্য নির্ভরযোগ্য ভারবহনক্ষম স্তর।' } },
      { tier: 'WARNING', rangeLabel: 'Cohesive N₆₀ 4–7.9 (Med. Stiff) OR Sand N₆₀ 4–9.9 (Loose)', codeLimit: 'Low Bearing / Liquefaction Check', interpretation: { en: 'Moderate stiffness; low bearing capacity (~60–110 kPa) and loose sand requires seismic liquefaction screening in Zone 2–4.', bn: 'মাঝারি নরম বা আলগা মাটি—অগভীর ফুটিংয়ে কম বেয়ারিং ধরুন এবং বালু স্তরে ভূমিকম্প লিকুইফ্যাকশন যাচাই করুন।' } },
      { tier: 'FAIL', rangeLabel: 'Cohesive N₆₀ < 4 (Very Soft/Soft) OR Sand N₆₀ < 4 (Very Loose)', codeLimit: 'BYPASS WITH DEEP PILES', interpretation: { en: 'Highly compressible soft clay or liquefiable loose silt/sand; unsuitable as final bearing horizon—extend piles deeper to dense stratum.', bn: 'অতি নরম কাদা বা অতি আলগা বালু—এই স্তরে ভিত্তি বসালে ভবন বসবে বা ভূমিকম্পে ধসবে; পাইল আরও গভীরে নিন।' } },
    ],
    remedialActions: [
      { en: 'Never terminate cast-in-situ piles inside soft clay (N < 8) or loose silty sand (N < 15); verify end-bearing socketed ≥ 3D into dense sand/hard clay (N ≥ 30–50).', bn: 'কখনোই N < ৮ কাদা বা N < ১৫ আলগা বালুতে পাইল শেষ করবেন না—ন্যূনতম N ≥ ৩০–৫০ শক্ত স্তরে পাইল নামান।' },
    ],
    calculatorInputs: [
      {
        key: 'soilClassCode',
        label: { en: 'Stratum Soil Classification', bn: 'মাটির শ্রেণিবিভাগ' },
        unit: 'type',
        defaultValue: 2,
        options: [
          { value: 1, label: { en: 'Cohesive Clay / Silty Clay (কাদামাটি)', bn: 'Cohesive Clay / Silty Clay (কাদামাটি)' } },
          { value: 2, label: { en: 'Cohesionless Sand / Silty Sand (বালু মাটি)', bn: 'Cohesionless Sand / Silty Sand (বালু মাটি)' } },
        ],
      },
      {
        key: 'hammerEfficiencyPct',
        label: { en: 'SPT Hammer Type & Energy (E_m)', bn: 'হ্যামারের ধরন ও দক্ষতা (E_m)' },
        unit: '%',
        defaultValue: 60,
        options: [
          { value: 45, label: { en: 'Donut Hammer / Rope Cathead (45%)', bn: 'ডোনাট হ্যামার ও দড়ি (৪৫%)' } },
          { value: 60, label: { en: 'Standard Safety Hammer (60%)', bn: 'স্ট্যান্ডার্ড সেফটি হ্যামার (৬০%)' } },
          { value: 80, label: { en: 'Automatic Trip Hammer (80%)', bn: 'অটোমেটিক ট্রিপ হ্যামার (৮০%)' } },
        ],
      },
      { key: 'n1Seating', label: { en: '1st Increment N₁ (0–150mm Seating, Discarded)', bn: '১ম ১৫০ মিমি আঘাত N₁ (বাদ দেয়া হবে)' }, unit: 'blows', defaultValue: 4, min: 0, max: 50, step: 1 },
      { key: 'n2Blows', label: { en: '2nd Increment N₂ (150–300mm)', bn: '২য় ১৫০ মিমি আঘাত N₂' }, unit: 'blows', defaultValue: 8, min: 0, max: 50, step: 1 },
      { key: 'n3Blows', label: { en: '3rd Increment N₃ (300–450mm)', bn: '৩য় ১৫০ মিমি আঘাত N₃' }, unit: 'blows', defaultValue: 10, min: 0, max: 50, step: 1 },
      { key: 'rodLengthM', label: { en: 'Total Drill Rod Length Above Sampler', bn: 'ড্রিল রডের মোট দৈর্ঘ্য' }, unit: 'm', defaultValue: 7.5, min: 1.5, max: 60, step: 1.5 },
      {
        key: 'boreholeDiaCode',
        label: { en: 'Borehole Diameter (C_B)', bn: 'বোরহোলের ব্যাস (C_B)' },
        unit: 'dia',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '65–115 mm Standard (C_B = 1.00)', bn: '৬৫–১১৫ মিমি স্ট্যান্ডার্ড (C_B = ১.০০)' } },
          { value: 2, label: { en: '150 mm (C_B = 1.05)', bn: '১৫০ মিমি (C_B = ১.০৫)' } },
          { value: 3, label: { en: '200 mm (C_B = 1.15)', bn: '২০০ মিমি (C_B = ১.১৫)' } },
        ],
      },
      {
        key: 'samplerLinerCode',
        label: { en: 'Split-Spoon Liner Status (C_S)', bn: 'স্যাম্পলার লাইনার (C_S)' },
        unit: 'liner',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Standard Sampler w/ Liner (C_S = 1.00)', bn: 'স্ট্যান্ডার্ড লাইনারসহ (C_S = ১.০০)' } },
          { value: 2, label: { en: 'Sampler Without Liner (C_S = 1.20)', bn: 'লাইনারবিহীন স্যাম্পলার (C_S = ১.২০)' } },
        ],
      },
      { key: 'effOverburdenKpa', label: { en: 'Effective Vertical Overburden Stress (σ\'_v)', bn: 'কার্যকর ওভারবার্ডেন চাপ (σ\'_v)' }, unit: 'kPa', defaultValue: 90, min: 10, max: 800, step: 5 },
    ],
  },

  // 6.2 ATTERBERG LIMITS (LL, PL, PI & LI)
  {
    id: 'soil-atterberg-limits',
    domainId: 'soil-pile',
    code: 'LAB-SOI-02',
    title: {
      en: 'Atterberg Limits — Liquid Limit (LL), Plastic Limit (PL) & Swelling Index (PI)',
      bn: 'অ্যাটারবার্গ লিমিটস — লিকুইড লিমিট (LL), প্লাস্টিক লিমিট (PL) ও ফোলা প্রবণতা (PI)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি সয়েল ক্লাসিফিকেশন পরীক্ষা',
    governingCodes: ['ASTM D4318', 'AASHTO T89 / T90', 'BNBC-2020 Part 6'],
    objective: {
      en: 'Determines moisture boundaries between liquid, plastic, and semi-solid clay states (LL, PL, PI = LL - PL) and Liquidity Index (LI). Identifies high-plasticity expansive Madhupur/Barind clays (PI > 17) that swell heavily during monsoon and shrink/crack shallow plinths and pavements in dry winters.',
      bn: 'কাদামাটির লিকুইড লিমিট (LL), প্লাস্টিক লিমিট (PL) ও প্লাস্টিসিটি ইনডেক্স (PI = LL - PL) নির্ণয় করে—যাতে বর্ষায় ফুলে ওঠা ও শুকনো মৌসুমে ফেটে যাওয়া এক্সপ্যানসিভ কাদামাটি (PI > ১৭) শনাক্ত করে ফাউন্ডেশন ও রাস্তার ক্ষতি রোধ করা যায়।',
    },
    sampling: {
      frequency: {
        en: 'Each cohesive clay/silt stratum encountered in boreholes or road borrow-pit subgrade soil prior to highway embankment approval.',
        bn: 'বোরহোলের প্রতিটি কাদামাটির স্তরে এবং রাস্তার সাব-গ্রেড বা ভরাট মাটি অনুমোদনের আগে।',
      },
      quantity: {
        en: 'Approx. 250 g air-dried fine soil passing No. 40 (425 µm) ASTM sieve.',
        bn: '#৪০ (৪২৫ মাইক্রন) চালনি দিয়ে চালা প্রায় ২৫০ গ্রাম শুকনো মিহি মাটি।',
      },
      lotSize: {
        en: '1 cohesive stratum / borrow source.',
        bn: '১টি কাদামাটি স্তর / বোরো পিট উৎস।',
      },
    },
    apparatus: [
      {
        item: { en: 'Casagrande Liquid Limit Cup & Grooving Tool (or Cone Penetrometer)', bn: 'ক্যাসাগ্রান্ডে লিকুইড লিমিট কাপ ও গ্রুভিং টুল' },
        spec: '10.0 mm drop height onto hard rubber base @ 2 drops/sec',
      },
      {
        item: { en: 'Frosted Glass Plate (3 mm Plastic Thread Rolling), Oven & 0.01 g Balance', bn: 'ফ্রস্টেড কাঁচের প্লেট (৩ মিমি রোলিং), ওভেন ও ০.০১ গ্রাম স্কেল' },
        spec: '110 ± 5°C drying oven + 425 µm (#40) sieve',
      },
    ],
    procedure: [
      {
        en: 'Sieve air-dried soil through No. 40 (425 µm) mesh and mix ~150 g cleanly with distilled water into a smooth uniform paste.',
        bn: '#৪০ চালনি দিয়ে চালা প্রায় ১৫০ গ্রাম মাটি বিশুদ্ধ পানির সাথে মিশিয়ে সমান পেস্ট তৈরি করুন।',
      },
      {
        en: 'Liquid Limit (LL): Place paste in Casagrande brass cup, cut a sharp 2 mm groove with the grooving tool, crank handle at 2 revolutions/sec, and count blows (N) until the bottom of the groove closes over 13 mm (1/2"). Test 3–4 moisture points spanning 15–35 blows; LL is moisture % at N = 25 blows.',
        bn: 'লিকুইড লিমিট (LL): ব্রাস কাপে পেস্ট রেখে গ্রুভিং টুল দিয়ে খাঁজ কাটুন; সেকেন্ডে ২ বার হ্যান্ডেল ঘুরিয়ে ১৩ মিমি খাঁজ মিলতে কত ঘা লাগে গুনুন। ১৫–৩৫ ঘায়ের মধ্যে ৩–৪টি রিডিং নিয়ে ২৫ ঘায়ের আর্দ্রতা (LL) নির্ণয় করুন।',
      },
      {
        en: 'Plastic Limit (PL): Roll a small ~8 g soil ball between palm and frosted glass plate into a uniform 3.0 mm (1/8") thread until it just begins crumbling into 3–10 mm pieces; oven-dry immediately at 110°C to determine PL moisture %.',
        bn: 'প্লাস্টিক লিমিট (PL): সামান্য মাটি হাতের তালু দিয়ে কাঁচের ওপর ৩.০ মিমি সুতার মতো পাকান যতক্ষণ না সেটি ফাটতে শুরু করে; ওভেনে শুকিয়ে ওই অবস্থার আর্দ্রতা (PL) বের করুন।',
      },
      {
        en: 'Measure natural in-situ moisture w_n (%) of sealed Shelby/SPT sample and calculate PI = LL - PL and Liquidity Index LI = (w_n - PL) / PI.',
        bn: 'মাটির প্রাকৃতিক আর্দ্রতা (w_n) মেপে PI = LL - PL এবং লিকুইডিটি ইনডেক্স LI = (w_n - PL) / PI হিসাব করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Never oven-dry organic/peaty soil prior to Atterberg testing—heat permanently destroys clay plasticity and underestimates LL by 20–35%!',
          bn: 'অ্যাটারবার্গ টেস্টের আগে কাঁচা মাটি ওভেনে শুকাবেন না (বাতাসে শুকান)—তাপে মাটির প্লাস্টিসিটি স্থায়ীভাবে নষ্ট হয়ে ভুল কম LL দেখায়।',
        },
        {
          en: 'Calibrate Casagrande cup drop height using the 10.0 mm gauge block on back of the grooving tool before every test.',
          bn: 'প্রতিটি পরীক্ষার আগে ১০.০ মিমি গেজ দিয়ে ক্যাসাগ্রান্ডে কাপের পতনের উচ্চতা যাচাই করে নিন।',
        },
      ],
      contractorTricks: [
        {
          en: 'Dumping High-PI Plastic Clay Into Road Embankments: Highway contractors mix expansive dark clay (PI = 22–30) into road fills; it passes initial dry rolling yet turns into soft muddy ruts and cracks pavements as soon as monsoon water arrives.',
          bn: 'রাস্তার ভরাটে উচ্চ-PI (২২–৩০) এঁটেল মাটি ব্যবহার: শুকনো অবস্থায় রোলিংয়ে পাস দেখালেও বর্ষার পানি পেলেই এই মাটি ফুলে নরম কাদা হয়ে রাস্তা ভেঙে ফেলে। তাই রাস্তায় PI ≤ ১২–১৫ মাটি নিশ্চিত করুন।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Plasticity Index (PI) & Liquidity Index (LI)', bn: 'প্লাস্টিসিটি ইনডেক্স (PI) ও লিকুইডিটি ইনডেক্স (LI)' },
          equation: 'PI (%) = LL - PL  |  LI = (w_n - PL) / PI',
          variables: [
            { en: 'LL = Liquid Limit moisture content at 25 Casagrande blows (%)', bn: 'LL = ২৫ ঘায়ের লিকুইড লিমিট আর্দ্রতা (%)' },
            { en: 'PL = Plastic Limit moisture content at 3 mm thread crumble (%)', bn: 'PL = ৩ মিমি সুতা ফেটে যাওয়া প্লাস্টিক লিমিট আর্দ্রতা (%)' },
            { en: 'w_n = In-situ natural moisture content (%)', bn: 'w_n = মাঠের প্রাকৃতিক আর্দ্রতা (%)' },
          ],
          unitNote: 'Swelling Chart: PI < 7 Low (Low Expansion), PI 7–17 Medium (Moderate Clay), PI > 17 High (High Expansive Clay); Highway Subgrade Max PI ≤ 15.',
        },
      ],
      workedExample: {
        en: 'Measured LL = 34.0%, PL = 21.0%, w_n = 24.5% → PI = 34.0 - 21.0 = 13.0% (Medium Plasticity, 7–17); LI = (24.5 - 21.0) / 13.0 = 0.27 (Stiff–Plastic Solid, LI < 0.75) → PASS.',
        bn: 'LL = ৩৪.০%, PL = ২১.০% ও প্রাকৃতিক আর্দ্রতা w_n = ২৪.৫% হলে PI = ১৩.০% (মাঝারি প্লাস্টিসিটি) এবং LI = ০.২৭ (স্থিতিশীল শক্ত-প্লাস্টিক মাটি) → পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'PI ≤ 17% (Low <7 or Medium 7–17) & LI < 0.75', codeLimit: 'ASTM D4318 / RHD Subgrade', interpretation: { en: 'Low-to-medium plasticity clay/silt with manageable volume change; suitable with standard compaction.', bn: 'কম বা মাঝারি প্লাস্টিসিটির মাটি—ফোলা/সংকোচন ঝুঁকি নিয়ন্ত্রিত এবং কমপ্যাকশনের জন্য উপযুক্ত।' } },
      { tier: 'WARNING', rangeLabel: 'PI 17.1%–25.0% OR LI 0.75–0.99', codeLimit: 'Expansive Clay / Softening', interpretation: { en: 'High swelling potential or wet near liquid limit; unsuitable directly beneath grade slabs or road bases without lime/sand stabilization.', bn: 'উচ্চ ফোলা প্রবণতা বা কাদা-নরম অবস্থা—রাস্তা বা মেঝের নিচে সরাসরি ব্যবহার না করে বালি/চুন মিশিয়ে স্থিতিশীল করুন।' } },
      { tier: 'FAIL', rangeLabel: 'PI > 25.0% OR LI ≥ 1.00 (w_n ≥ LL) OR PL > LL', codeLimit: 'HIGHLY EXPANSIVE / REJECT FILL', interpretation: { en: 'Extreme shrink-swell expansive clay or sensitive liquid mud (LI ≥ 1.0); reject for road/plinth fill and isolate shallow footings with sand cushions.', bn: 'চরম এক্সপ্যানসিভ কাদামাটি বা তরল কাদা—ভরাট কাজে সম্পূর্ণ বাতিল করুন এবং ফাউন্ডেশনের নিচে মোটা বালির কুশন দিন।' } },
    ],
    remedialActions: [
      { en: 'Where shallow slabs rest on PI > 17 clay, excavate top 450–600 mm and compact a non-expansive Sylhet sand / brick-khoa blanket cushion.', bn: 'PI > ১৭ কাদামাটির ওপর মেঝে বা রাস্তা বানাতে হলে ওপরের ৪৫০–৬০০ মিমি মাটি সরিয়ে মোটা বালি-খোয়ার কুশন বেড তৈরি করুন।' },
    ],
    calculatorInputs: [
      { key: 'liquidLimitPct', label: { en: 'Liquid Limit (LL)', bn: 'লিকুইড লিমিট (LL)' }, unit: '%', defaultValue: 34.0, min: 10, max: 120, step: 0.5 },
      { key: 'plasticLimitPct', label: { en: 'Plastic Limit (PL)', bn: 'প্লাস্টিক লিমিট (PL)' }, unit: '%', defaultValue: 21.0, min: 5, max: 70, step: 0.5 },
      { key: 'naturalMoisturePct', label: { en: 'Natural In-Situ Moisture (w_n)', bn: 'মাটির প্রাকৃতিক আর্দ্রতা (w_n)' }, unit: '%', defaultValue: 24.5, min: 1, max: 120, step: 0.5 },
    ],
  },

  // 6.3 PROCTOR COMPACTION & FIELD DRY DENSITY (SAND REPLACEMENT CONE)
  {
    id: 'soil-fdd-compaction',
    domainId: 'soil-pile',
    code: 'LAB-SOI-03',
    title: {
      en: 'Proctor MDD/OMC & Field Dry Density (FDD) by Sand Replacement Cone',
      bn: 'প্রক্টর কমপ্যাকশন (MDD/OMC) ও ফিল্ড ড্রাই ডেনসিটি (স্যান্ড রিপ্লেসমেন্ট কোন)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ফিল্ড কমপ্যাকশন ও ল্যাব প্রক্টর যাচাই',
    governingCodes: ['ASTM D1556 (FDD)', 'ASTM D698 / D1557 (Proctor)', 'RHD / LGED / PWD Spec'],
    objective: {
      en: 'Measures actual compacted dry density of building plinth sand fills, road subgrades, sub-bases, and crushed stone base layers versus Lab Modified/Standard Proctor Maximum Dry Density (MDD) and Optimum Moisture Content (OMC). Prevents differential floor settlement and pavement wheel-track rutting.',
      bn: 'ভবনের বালি ভরাট, রাস্তার সাব-গ্রেড, সাব-বেজ ও বেজ কোর্স ল্যাবরেটরি প্রক্টর (MDD ও OMC)-এর তুলনায় কত % কমপ্যাকশন হয়েছে তা মেপে বের করে—যাতে ফ্লোর বসে যাওয়া বা রাস্তায় গর্ত হওয়া না ঘটে।',
    },
    sampling: {
      frequency: {
        en: 'Plinth sand filling: 1 test per 150–250 m² per compacted lift (max 150–200 mm thick). Highway Subgrade/Base: 1 test per 50–100 m chainage staggered L/C/R per lift.',
        bn: 'ভবনের বালি ভরাটে প্রতি স্তরে (সর্বোচ্চ ১৫০–২০০ মিমি) ১৫০–২৫০ বর্গমিটারে ১টি এবং রাস্তায় প্রতি ৫০–১০০ মিটারে ১টি পরীক্ষা।',
      },
      quantity: {
        en: 'Excavate a clean 100 mm or 150 mm Ø test hole strictly to the full thickness of the compacted lift (≈150 mm deep), sealing 100% of excavated soil.',
        bn: 'কমপ্যাক্টেড স্তরের পূর্ণ পুরুত্ব (প্রায় ১৫০ মিমি গভীর × ১০০/১৫০ মিমি ব্যাস) জুড়ে গর্ত খুঁড়ে সম্পূর্ণ মাটি/বালি সংগ্রহ।',
      },
      lotSize: {
        en: '1 compacted 150–200 mm lift.',
        bn: '১টি কমপ্যাক্টেড (১৫০–২০০ মিমি) স্তর।',
      },
    },
    apparatus: [
      {
        item: { en: 'Sand Pouring Cylinder (SPC) + Calibrated Dry Uniform Sand', bn: 'স্যান্ড পোরিং সিলিন্ডার (SPC) ও ক্যালিব্রেটেড শুকনো বালি' },
        spec: 'Pre-calibrated W_sand in cone (g) & Bulk density γ_sand (1.42–1.55 g/cm³)',
      },
      {
        item: { en: 'Hole Excavation Base Tray, Chisel, Scoop, Digital Balance & Rapid Moisture Meter/Oven', bn: 'হোল ট্রে, বাটালি, ডিজিটাল স্কেল ও আর্দ্রতা পরিমাপক' },
        spec: '1 g balance sensitivity; airtight moisture sample tins',
      },
    ],
    procedure: [
      {
        en: 'Pre-calibrate standard dry pouring sand bulk density (γ_sand) and cone-fill mass (W_cone) on a flat glass plate prior to fieldwork.',
        bn: 'মাঠে যাওয়ার আগে ল্যাবে ক্যালিব্রেটেড শুকনো বালির ঘনত্ব (γ_sand) এবং কোনের ভেতরে আটকে থাকা বালির ওজন (W_cone) ঠিকভাবে মেপে নিন।',
      },
      {
        en: 'Brush loose dust off the compacted surface, fix the hole tray, and excavate a vertical cylindrical hole (100–150 mm Ø × 150 mm deep). Collect 100% of excavated soil into a sealed jar and weigh immediately (W_excavated).',
        bn: 'কমপ্যাক্টেড তলের ওপর ট্রে বসিয়ে ১৫০ মিমি গভীর গর্ত খুঁড়ে সম্পূর্ণ মাটি/বালি নিখুঁতভাবে তুলে ওজন নিন (W_excavated)।',
      },
      {
        en: 'Weigh the sand cylinder (W_initial), place it over the hole, open shutter until pouring sand stops flowing completely, close shutter, and re-weigh (W_final) to get total sand poured W_poured = W_initial - W_final.',
        bn: 'বালি ভর্তি সিলিন্ডার ওজন করে গর্তের ওপর বসিয়ে শাটার খুলুন; বালি পড়া থেমে গেলে শাটার বন্ধ করে আবার ওজন নিয়ে গর্ত+কোনে যাওয়া মোট বালি (W_poured) বের করুন।',
      },
      {
        en: 'Subtract cone sand mass (V_hole = (W_poured - W_cone) / γ_sand), find wet density γ_wet, dry density γ_d using moisture w%, and compute Relative Compaction RC (%) = (γ_d / MDD) × 100.',
        bn: 'মোট বালি থেকে কোনের বালি (W_cone) বাদ দিয়ে গর্তের আয়তন (V_hole), ড্রাই ডেনসিটি (γ_d) এবং MDD-এর বিপরীতে Relative Compaction (%) হিসাব করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Stop ALL vibratory rollers and heavy excavators within 15 m during sand pouring—vibrations shake pouring sand denser inside the hole, inflating V_hole and falsifying density downward or vice versa.',
          bn: 'বালি ঢালার সময় ১৫ মিটারের মধ্যে সব ভাইব্রেটর রোলার ও ভারী গাড়ি বন্ধ রাখুন—কম্পনে বালি চেপে গিয়ে আয়তনের ভুল হিসাব আসবে।',
        },
        {
          en: 'Check moisture content w% against Lab OMC (±2%)—you cannot reach 98% MDD if soil is bone-dry or waterlogged!',
          bn: 'মাঠের আর্দ্রতা ল্যাব OMC-এর (±২%) কাছাকাছি আছে কিনা দেখুন—অতিরিক্ত শুকনো বা কাদা অবস্থায় ৯৮% কমপ্যাকশন পাওয়া যায় না।',
        },
      ],
      contractorTricks: [
        {
          en: '"1-Meter Uncompacted Sand Dumping & Water-Only Flooding": Contractors dump 600–900 mm loose sand at once and compact only the top 150 mm, or flood sand without vibration—leaving deep honeycombed voids that settle 50–100 mm after tiles are laid.',
          bn: 'একবারে ৩ ফুট বালি ফেলে শুধু ওপরে রোলার চালানো: নিচের স্তর ফাঁপা রেখে উপরের ৬ ইঞ্চি শক্ত করলে FDD টেস্টে পাস দেখালেও কয়েক মাস পর ভবনের মেঝে বসে ফেটে যায়। তাই প্রতি ১৫০–২০০ মিমি স্তরে আলাদা কমপ্যাকশন বাধ্যতামূলক।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Hole Volume, Field Dry Density (γ_d) & Relative Compaction (RC%)', bn: 'গর্তের আয়তন, ফিল্ড ড্রাই ডেনসিটি ও কমপ্যাকশন (%) সূত্র' },
          equation: 'V_hole = (W_poured - W_cone) / γ_sand  |  γ_wet = W_excavated / V_hole  |  γ_d = γ_wet / (1 + w/100)  |  RC(%) = (γ_d / MDD_lab) × 100',
          variables: [
            { en: 'W_poured = Total sand leaving cylinder; W_cone = Pre-calibrated sand filling metal cone (g)', bn: 'W_poured = সিলিন্ডার থেকে বের হওয়া মোট বালি; W_cone = কোনের বালি (গ্রাম)' },
            { en: 'γ_sand = Calibrated pouring sand density (g/cm³); w = Excavated soil moisture (%)', bn: 'γ_sand = ক্যালিব্রেটেড বালির ঘনত্ব; w = খননকৃত মাটির আর্দ্রতা (%)' },
            { en: 'MDD_lab = Lab Standard/Modified Proctor Maximum Dry Density (g/cm³)', bn: 'MDD_lab = ল্যাব প্রক্টর সর্বোচ্চ শুকনো ঘনত্ব (g/cm³)' },
          ],
          unitNote: 'Targets: Plinth Sand Fill ≥ 95%; Road Subgrade ≥ 95%; Improved Subgrade (ISG) / Sub-base / Base Course ≥ 98% MDD.',
        },
      ],
      workedExample: {
        en: 'W_poured = 2,240 g, W_cone = 520 g → W_hole = 1,720 g. With γ_sand = 1.48 g/cm³ → V_hole = 1,162.2 cm³. W_excavated = 2,210 g → γ_wet = 1.902 g/cm³. At w = 10.5% → γ_d = 1.721 g/cm³. vs MDD = 1.78 → RC = 96.7% (PASS ≥ 95%).',
        bn: 'মোট বালি ২,২৪০ গ্রাম থেকে কোনের ৫২০ গ্রাম বাদে গর্তে ১,৭২০ গ্রাম (γ=১.৪৮) → আয়তন ১,১৬২.২ সিসি। খননকৃত মাটি ২,২১০ গ্রাম (আর্দ্রতা ১০.৫%) → γ_d = ১.৭২১ g/cm³। MDD ১.৭৮ হলে RC = ৯৬.৭% (পাস ≥ ৯৫%)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'RC ≥ 95% (Plinth/Subgrade) OR RC ≥ 98% (ISG/Sub-base/Base)', codeLimit: 'RHD / LGED / PWD Spec', interpretation: { en: 'Full design compaction & stiffness verified; approve next 150–200 mm lift or PCC blinding.', bn: 'নির্ধারিত কমপ্যাকশন অর্জিত হয়েছে—পরবর্তী স্তর বা পিসিসি ঢালাইয়ের অনুমতি দিন।' } },
      { tier: 'WARNING', rangeLabel: '0.1%–2.0% below Target RC (e.g. 93.0–94.9% for 95% spec)', codeLimit: 'Moisture Adjust + Re-Roll', interpretation: { en: 'Slightly under-compacted; check moisture vs OMC, sprinkle lightly, add 2–4 vibratory passes & re-test.', bn: 'কমপ্যাকশন সামান্য কম; OMC অনুযায়ী হালকা পানি ছিটিয়ে আরও ২–৪ বার ভাইব্রেটর রোলিং করে পুনরায় পরীক্ষা করুন।' } },
      { tier: 'FAIL', rangeLabel: '> 2.0% below Target RC (e.g. < 93% for 95% or < 96% for 98% spec)', codeLimit: 'SCARIFY & RE-COMPACT', interpretation: { en: 'Loose voided lift or excess moisture (>OMC+2%); scarify entire layer, aerate/blend, and re-compact in ≤150 mm lifts.', bn: 'স্তর আলগা বা অতি ভেজা—পুরো স্তর খুঁড়ে বাতাসে শুকিয়ে বা পানি সমন্বয় করে পুনরায় কমপ্যাক্ট করুন।' } },
    ],
    remedialActions: [
      { en: 'Never pour concrete floor slabs or lay asphalt over lifts failing FDD compaction; verify moisture within OMC ± 2% before rolling.', bn: 'কমপ্যাকশন পাস ছাড়া মেঝে বা রাস্তার ওপরের স্তর ঢালাই করবেন না; রোলিংয়ের আগে আর্দ্রতা OMC ± ২%-এর ভেতর রাখুন।' },
    ],
    calculatorInputs: [
      {
        key: 'layerScopeCode',
        label: { en: 'Compacted Structural Layer Scope', bn: 'কমপ্যাক্টেড স্তরের ধরন' },
        unit: 'spec',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Plinth Sand Fill / Road Subgrade (Min ≥ 95%)', bn: 'প্লিন্থ বালি ভরাট / সাব-গ্রেড (≥ ৯৫%)' } },
          { value: 2, label: { en: 'Improved Subgrade / Sub-base / Base (Min ≥ 98%)', bn: 'ISG / সাব-বেজ / বেজ কোর্স (≥ ৯৮%)' } },
        ],
      },
      { key: 'totalSandPouredG', label: { en: 'Total Sand Poured (W_initial - W_final)', bn: 'সিলিন্ডার থেকে ঢালা মোট বালি' }, unit: 'g', defaultValue: 2240, min: 400, max: 8000, step: 10 },
      { key: 'coneSandMassG', label: { en: 'Calibrated Sand in Metal Cone (W_cone)', bn: 'কোনের ভেতরে থাকা বালি (W_cone)' }, unit: 'g', defaultValue: 520, min: 100, max: 1500, step: 5 },
      { key: 'pouringSandDensity', label: { en: 'Calibrated Pouring Sand Density (γ_sand)', bn: 'ক্যালিব্রেটেড বালির ঘনত্ব (γ_sand)' }, unit: 'g/cm³', defaultValue: 1.48, min: 1.2, max: 1.75, step: 0.01 },
      { key: 'excavatedWetMassG', label: { en: 'Excavated Wet Soil Mass (W_excavated)', bn: 'গর্ত থেকে ওঠানো ভেজা মাটি' }, unit: 'g', defaultValue: 2210, min: 300, max: 8000, step: 10 },
      { key: 'moisturePct', label: { en: 'Field Soil Moisture Content (w)', bn: 'মাঠের আর্দ্রতা (w)' }, unit: '%', defaultValue: 10.5, min: 0.5, max: 40, step: 0.2 },
      { key: 'labMdd', label: { en: 'Lab Proctor MDD (MDD_lab)', bn: 'ল্যাব প্রক্টর MDD' }, unit: 'g/cm³', defaultValue: 1.78, min: 1.3, max: 2.4, step: 0.01 },
      { key: 'labOmcPct', label: { en: 'Lab Proctor Optimum Moisture (OMC)', bn: 'ল্যাব অপটিমাম আর্দ্রতা (OMC)' }, unit: '%', defaultValue: 11.0, min: 3, max: 30, step: 0.5 },
    ],
  },

  // 6.4 BENTONITE SLURRY QUALITY TEST FOR BORED CAST-IN-SITU PILES
  {
    id: 'soil-bentonite-slurry',
    domainId: 'soil-pile',
    code: 'LAB-SOI-04',
    title: {
      en: 'Bentonite Slurry Quality Test for Bored Piles (Density, Viscosity, Sand % & pH)',
      bn: 'বোরড পাইলের বেনটোনাইট স্লারি পরীক্ষা (ডেনসিটি, ভিসকোসিটি, বালির হার ও pH)',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'পাইল বোরিং সাইট ফিল্ড পরীক্ষা',
    governingCodes: ['BNBC-2020 Part 6 §3.8', 'FHWA GEC-10 / ICE SPERWall', 'API 13B-1'],
    objective: {
      en: 'Verifies borehole stabilization drilling mud BEFORE concrete tremie pouring. High sand content (> 4%) suspends heavy silica sand that settles rapidly to the borehole bottom during tremie placement—creating a compressible "soft toe" or trapped mud pockets that ruin end-bearing and cause sudden pile settlement failure.',
      bn: 'বোরড পাইল ঢালাইয়ের (Tremie Pour) আগে গর্তের ভেতরের বেনটোনাইট স্লারির মান যাচাই করে। স্লারিতে বালির পরিমাণ ৪%-এর বেশি হলে ঢালাইয়ের সময় সেই ভারী বালি পাইলের তলায় জমে "নরম তলা" (Soft Toe) তৈরি করে এবং পাইল লোড নিলে ভবন বসে যায়।',
    },
    sampling: {
      frequency: {
        en: '1 sample from mixing tank (fresh slurry) AND mandatory bottom-hole sample via bailer/sampler from 0.5 m above pile toe right BEFORE lowering tremie pipe for concreting.',
        bn: 'মিক্সিং ট্যাংকে তাজা স্লারি এবং প্রতিবার ঢালাইয়ের (Tremie Pour) ঠিক আগে বোরহোলের তলদেশ (বেস থেকে ০.৫ মি. ওপর) থেকে সংগৃহীত স্লারি।',
      },
      quantity: {
        en: '1.5 Liters captured cleanly in bottom-sampling canister (not dipped from top water surface).',
        bn: 'তলদেশ স্যাম্পলার দিয়ে সংগৃহীত কমপক্ষে ১.৫ লিটার স্লারি (কখনোই ওপরের ভাসমান পানি থেকে নয়)।',
      },
      lotSize: {
        en: 'Every single cast-in-situ bored pile prior to concrete discharge.',
        bn: 'প্রতিটি বোরড পাইল ঢালাইয়ের আগে।',
      },
    },
    apparatus: [
      {
        item: { en: 'Calibrated Baroid Mud Balance (Specific Gravity Beam)', bn: 'মাড ব্যালেন্স (Mud Balance) স্কেল' },
        spec: 'Range 0.72–2.88 g/cm³, 0.01 g/cm³ resolution',
      },
      {
        item: { en: 'Marsh Funnel Viscometer (1 Quart / 946 mL Cup) & Stopwatch', bn: 'মার্শ ফানেল ভিসকোমিটার (৯৪৬ মি.লি. কাপ) ও স্টপওয়াচ' },
        spec: 'Fresh water calibration = 26 ± 0.5 sec/quart at 21°C',
      },
      {
        item: { en: 'API Sand Content Screen (200-Mesh / 75 µm Sieve + Graduated Tube) & pH Strips', bn: '২০০-মেশ বালির চালনি টিউব সেট ও pH স্ট্রিপ' },
        spec: '0–20% calibrated glass sand tube; pH 1–14 strips',
      },
    ],
    procedure: [
      {
        en: 'Mud Balance Density: Fill mud balance cup completely with bubble-free slurry, press lid so excess mud escapes the vent hole, wipe exterior dry, and balance rider beam to read density in g/cm³.',
        bn: 'ডেনসিটি (Mud Balance): মাড ব্যালেন্সের কাপে স্লারি ভরে ঢাকনা চেপে বাড়তি বাতাস/কাদা বের করে বাইরে মুছে ব্যালেন্স বিম থেকে ডেনসিটি (g/cm³) পড়ুন।',
      },
      {
        en: 'Marsh Funnel Viscosity: Hold finger under the 4.7 mm funnel orifice, pour 1.5 L slurry through top screen up to the underside mark, release finger while starting stopwatch, and record seconds for exactly 946 mL (1 quart) to fill the receiving cup.',
        bn: 'ভিসকোসিটি (Marsh Funnel): আঙুল দিয়ে ফানেলের মুখ বন্ধ করে চালনি দিয়ে ১.৫ লিটার স্লারি ভরুন; আঙুল সরিয়ে ঠিক ৯৪৬ মি.লি. (১ কোয়ার্ট) কাপ ভরতে কত সেকেন্ড লাগে তা মাপুন।',
      },
      {
        en: 'Sand Content (%): Pour slurry up to "Mud to Here" mark in the glass tube, dilute with clean water, shake, pour through the 200-mesh (75 µm) screen, wash away clay, back-wash trapped sand into tube, let settle, and read direct % volume.',
        bn: 'বালির পরিমাণ (%): টিউবে দাগ পর্যন্ত স্লারি ও পানি মিশিয়ে ঝাঁকিয়ে ২০০-মেশ (৭৫ মাইক্রন) চালনিতে ধুয়ে ফেলুন; শুধু পরিষ্কার বালি টিউবে ঢেলে নিচে জমা হওয়ার পর সরাসরি % পড়ুন।',
      },
      {
        en: 'Measure slurry pH (must be 8.0–11.0; alkaline dispersion prevents clay flocculation) and desand/flush borehole cleanly if sand > 4% or density > 1.15 g/cm³.',
        bn: 'স্লারির pH মাপুন (৮.০–১১.০ হতে হবে); বালি ৪%-এর বেশি বা ডেনসিটি >১.১৫ g/cm³ হলে ডিস্যান্ডিং/ফ্লাশিং না করে ঢালাই শুরু করবেন না।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Pre-hydrate bentonite powder in clean fresh water (pH 7–9, low salinity) for at least 12–24 hours in circulation tanks—dry-dumping powder straight into borehole fails to form a waterproof filter cake!',
          bn: 'বেনটোনাইট পাউডার ঢালাইয়ের অন্তত ১২–২৪ ঘণ্টা আগে পরিষ্কার ট্যাংকে গুলিয়ে ভিজিয়ে রাখুন—সরাসরি গর্তে শুকনো পাউডার ফেললে বোরহোলের দেয়ালে ফিল্টার-কেক তৈরি হয় না।',
        },
      ],
      contractorTricks: [
        {
          en: '"Fake Clear Water Flushing or Sampling From Top": Boring crews skip bentonite circulation (using muddy clay water) or take the test cup from the top 300 mm while 12% dense silica sand sits silently on the pile bottom—causing catastrophic soft-toe settlement during load testing.',
          bn: 'শুধু কাদা-পানি ব্যবহার বা ওপর থেকে স্লারি নেয়া: বেনটোনাইটের বদলে শুধু কাদা-পানি ব্যবহার করলে বা তলদেশের বদলে ওপর থেকে স্যাম্পল নিলে নিচে ১২%+ বালি জমে পাইল লোড টেস্টে বসে যায়!',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'BNBC / FHWA Bentonite Slurry Acceptance Criteria', bn: 'বেনটোনাইট স্লারির মানদণ্ড সীমা (BNBC / FHWA)' },
          equation: 'ρ_fresh = 1.03–1.10 g/cm³ (Pre-Pour ≤ 1.15)  |  Viscosity = 32–50 sec/qt  |  Sand ≤ 4.0%  |  pH = 8.0–11.0',
          variables: [
            { en: 'ρ = Mud Balance slurry unit weight (g/cm³)', bn: 'ρ = মাড ব্যালেন্সে মাপা স্লারির ঘনত্ব (g/cm³)' },
            { en: 't_marsh = Marsh funnel efflux time for 946 mL (sec/quart)', bn: 't_marsh = মার্শ ফানেলে ১ কোয়ার্ট ভরার সময় (সেকেন্ড)' },
            { en: 'Sand(%) = Coarse >75 µm silica fraction remaining in borehole mud', bn: 'Sand(%) = ঢালাইয়ের আগে স্লারিতে ভাসমান বালির %' },
          ],
          unitNote: 'Excess Sand (> 4%) or Density (> 1.15 g/cm³) traps sediment below tremie concrete, creating Soft Toe.',
        },
      ],
      workedExample: {
        en: 'Pre-tremie bottom sample: Density ρ = 1.07 g/cm³ (≤ 1.15), Marsh Funnel = 38 sec/qt (32–50), Sand Content = 2.5% (≤ 4.0%), pH = 9.2 (8.0–11.0) → ALL PASS — Clear for Tremie Concreting.',
        bn: 'ঢালাই-পূর্ব তলদেশ স্যাম্পল: ডেনসিটি ১.০৭ g/cm³ (≤ ১.১৫), মার্শ ভিসকোসিটি ৩৮ সেকেন্ড (৩২–৫০), বালি ২.৫% (≤ ৪.০%) ও pH ৯.২ → সব পাস, ট্রেমি ঢালাইয়ের জন্য প্রস্তুত।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'ρ ≤ 1.15 g/cm³ (1.03–1.10 fresh), Visc 32–50s, Sand ≤ 4.0%, pH 8.0–11.0', codeLimit: 'BNBC-2020 / FHWA', interpretation: { en: 'Clean, stable bentonite suspension; borehole wall sealed and bottom free of sand sediment for tremie pour.', bn: 'আদর্শ বেনটোনাইট স্লারি—গর্তের দেয়াল সুরক্ষিত ও তলদেশে বালি মুক্ত; ট্রেমি ঢালাইয়ের ছাড়পত্র দিন।' } },
      { tier: 'WARNING', rangeLabel: 'Visc 29–31s or 51–55s OR Sand 4.1–5.0% OR pH 7.5–7.9 / 11.1–11.5', codeLimit: 'Circulate / Desand', interpretation: { en: 'Marginally contaminated or thin; run airlift / desander unit for 20 min or add hydrated bentonite & re-test.', bn: 'ভিসকোসিটি কম বা বালি ৪–৫%—২০ মিনিট এয়ার-লিফট বা ডিস্যান্ডার চালিয়ে পুনরায় টেস্ট করুন।' } },
      { tier: 'FAIL', rangeLabel: 'Sand > 5.0% OR ρ > 1.15 g/cm³ OR Visc < 29s / > 60s OR pH < 7.5', codeLimit: 'HOLD POUR — DESAND / REPLACE', interpretation: { en: 'Severe soft-toe risk (sand will drop out during concrete pour) or high borehole collapse / tremie blockage risk! Flush & replace slurry.', bn: 'পাইলের তলা নরম (Soft Toe) বা গর্ত ধসার মারাত্মক ঝুঁকি! স্লারি পরিবর্তন ও পুনরায় ফ্লাশিং ছাড়া ঢালাই সম্পূর্ণ নিষেধ।' } },
    ],
    remedialActions: [
      { en: 'Never allow concrete discharge if pre-pour bottom sand > 4%; operate air-lift reverse circulation until sand drops ≤ 2–4% and check pile depth with weighted sounding tape.', bn: 'ঢালাইয়ের আগে বালি >৪% থাকলে এয়ার-লিফট ফ্লাশিং করে বালি ≤৪%-এ নামান এবং প্লাম্ব-টেপ দিয়ে পাইলের পূর্ণ গভীরতা পুনরায় মাপুন।' },
    ],
    calculatorInputs: [
      {
        key: 'slurryStageCode',
        label: { en: 'Slurry Testing Stage', bn: 'স্লারি পরীক্ষার ধাপ' },
        unit: 'stage',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Pre-Tremie Bottom Sample (Density ≤ 1.15, Sand ≤ 4%)', bn: 'ঢালাইয়ের আগে তলদেশের নমুনা (ডেনসিটি ≤ ১.১৫, বালি ≤ ৪%)' } },
          { value: 2, label: { en: 'Fresh Tank Slurry (Density 1.03–1.10)', bn: 'ট্যাংকের তাজা স্লারি (ডেনসিটি ১.০৩–১.১০)' } },
        ],
      },
      { key: 'mudDensityGcc', label: { en: 'Mud Balance Density (ρ)', bn: 'মাড ব্যালেন্স ঘনত্ব (ρ)' }, unit: 'g/cm³', defaultValue: 1.07, min: 1.0, max: 1.5, step: 0.01 },
      { key: 'marshViscositySec', label: { en: 'Marsh Funnel Viscosity', bn: 'মার্শ ফানেল ভিসকোসিটি' }, unit: 'sec/qt', defaultValue: 38, min: 25, max: 90, step: 1 },
      { key: 'sandContentPct', label: { en: '200-Mesh Sand Content', bn: '২০০-মেশ বালির পরিমাণ' }, unit: '%', defaultValue: 2.5, min: 0, max: 20, step: 0.5 },
      { key: 'slurryPh', label: { en: 'Measured Slurry pH', bn: 'স্লারির pH মান' }, unit: 'pH', defaultValue: 9.2, min: 5, max: 13, step: 0.1 },
    ],
  },

  // 6.5 PILE INTEGRITY TEST (PIT) & STATIC AXIAL PILE LOAD TEST (DAVISSON & BNBC)
  {
    id: 'soil-pile-static-pit',
    domainId: 'soil-pile',
    code: 'LAB-SOI-05',
    title: {
      en: 'Static Axial Pile Load Test (Davisson / BNBC) & Low-Strain PIT Integrity',
      bn: 'পাইল স্ট্যাটিক লোড টেস্ট (ডেভিসন ও বিএনবিসি) ও পিআইটি (PIT) ইন্টিগ্রিটি পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড পাইল লোড ও পিআইটি পরীক্ষা',
    governingCodes: ['ASTM D1143 (Static)', 'ASTM D5882 (PIT)', 'BNBC-2020 Part 6 §3', 'PWD Spec'],
    objective: {
      en: 'Proves true axial load-settlement safety at 1.5× Q_design (Working Pile) or 2.0× Q_design (Initial Test Pile) using both BNBC/PWD gross-net limits and the Davisson Offset Criterion, while Low-Strain PIT detects shaft necking, honeycombing, soil intrusion, or soft-toe defects.',
      bn: 'কাজের পাইলে ১.৫ গুণ বা টেস্ট পাইলে ২.০ গুণ লোডে ডেভিসন অফসেট ও বিএনবিসি সীমার ভেতর নিরাপদ সেটেলমেন্ট প্রমাণ করে এবং পিআইটি (PIT) সনিক তরঙ্গের মাধ্যমে পাইলের ভেতরের নেকিং (Necking), ফাটল বা তলা নরম আছে কিনা যাচাই করে।',
    },
    sampling: {
      frequency: {
        en: 'Static Load Test: 1–2% of working piles (tested to 150% Q_design) plus ≥ 1 Initial Test Pile to 200% Q_design; PIT Sonic Integrity: 50%–100% of all cast piles.',
        bn: 'স্ট্যাটিক লোড টেস্ট: কাজের পাইলের ১–২% (১৫০% লোড) ও ১টি টেস্ট পাইল (২০০% লোড); পিআইটি টেস্ট: মোট পাইলের ৫০–১০০%।',
      },
      quantity: {
        en: 'Pile age ≥ 28 days for Static Load (≥ 7–14 days for PIT) with top laitance chipped down cleanly to sound flat concrete.',
        bn: 'স্ট্যাটিক টেস্টে ≥ ২৮ দিন ও পিআইটিতে ≥ ৭–১৪ দিন বয়স—ওপরের দুর্বল লাইটেন্স কেটে সমতল করা পাইল মাথা।',
      },
      lotSize: {
        en: 'Per building foundation pile layout.',
        bn: 'প্রতিটি ভবনের পাইল ফাউন্ডেশন।',
      },
    },
    apparatus: [
      {
        item: { en: 'Calibrated Hydraulic Jack, Reaction Kentledge / Anchor Frame & 4 Dial Gauges', bn: 'ক্যালিব্রেটেড হাইড্রোলিক জ্যাক, কেন্টলেজ ও ৪টি ডায়াল গেজ' },
        spec: '0.01 mm dial gauges on independent reference beams anchored ≥ 2.5 m away',
      },
      {
        item: { en: 'Low-Strain PIT Accelerometer, Nylon Hammer & Signal Analyzer', bn: 'পিআইটি অ্যাক্সিলারোমিটার সেন্সর, হ্যামার ও অ্যানালাইজার' },
        spec: 'Stress-wave velocity c = 3,600–4,200 m/s in sound RCC',
      },
    ],
    procedure: [
      {
        en: 'Static Load Test: Center hydraulic jack over pile head, mount 4 dial gauges at 90° quadrants on independent steel reference beams supported > 2.5 m clear of pile and kentledge supports.',
        bn: 'স্ট্যাটিক লোড: জ্যাক বসিয়ে পাইল ও কেন্টলেজ খুঁটি থেকে অন্তত ২.৫ মিটার দূরে আলাদা রেফারেন্স বিমে ৪টি ডায়াল গেজ ৯০° কোণে সেট করুন।',
      },
      {
        en: 'Apply load in 20–25% increments up to 150% Q_design (Working Pile) or 200% Q_design (Initial Test Pile), holding each step until settlement rate stabilizes (< 0.25 mm/hr) and holding peak load for 24 hours; unload in steps and record final permanent net settlement.',
        bn: '২০–২৫% ধাপে ধাপে ১৫০% বা ২০০% লোড তুলে সর্বোচ্চ লোড ২৪ ঘণ্টা ধরে রাখুন; এরপর ধাপে ধাপে লোড নামিয়ে স্থায়ী নেট সেটেলমেন্ট মাপুন।',
      },
      {
        en: 'Evaluate Elastic Shortening Δ_elastic = (P·L)/(A·E_p) and Davisson Offset Limit Δ_Davisson = Δ_elastic + (4.0 + D_mm/120) alongside BNBC gross/net settlement bounds.',
        bn: 'ইলাস্টিক শর্টেনিং Δ_elastic ও ডেভিসন অফসেট সীমা Δ_Davisson এবং বিএনবিসি গ্রস/নেট সীমার সাথে প্রাপ্ত সেটেলমেন্ট মিলিয়ে দেখুন।',
      },
      {
        en: 'PIT Integrity: Grind 3–4 smooth spots on trimmed sound concrete, couple sensor with gel, strike with hammer, and inspect reflectogram for clean toe bounce at Δt = 2L/c (vs early impedance drop indicating necking/crack).',
        bn: 'পিআইটি পরীক্ষা: কাটা মাথার ৩–৪টি মসৃণ বিন্দুতে জেল দিয়ে সেন্সর লাগিয়ে হাতুড়িতে টোকা দিন; Δt = 2L/c সময়ে তলার প্রতিফলন ঠিক আছে নাকি আগেই নেকিং/ফাটল সিগন্যাল আসছে তা দেখুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Shade reference beams from direct sunlight and wind; thermal warping of exposed steel channels creates 1.5–2.5 mm fake dial-gauge drift.',
          bn: 'রেফারেন্স বিমে সরাসরি রোদ লাগতে দেবেন না—রোদে স্টিল বেঁকে ১.৫–২.৫ মিমি ভুল সেটেলমেন্ট রিডিং আসে।',
        },
      ],
      contractorTricks: [
        {
          en: '"Anchoring Reference Beam Legs Beside Test Pile or Cutting Test Short": Placing gauge beam stakes within 1 m of the pile causes stakes to sink with the pile cone, hiding true settlement; and omitting 24-hour peak hold conceals long-term clay consolidation creep.',
          bn: 'রেফারেন্স বিমের খুঁটি পাইলের কাছে পুঁতে দেয়া বা ২৪ ঘণ্টা লোড না রাখা: খুঁটি ১ মিটারের ভেতরে পুঁতলে পাইলের সাথে খুঁটিও বসে গিয়ে কম সেটেলমেন্ট দেখায়!',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Davisson Offset Criterion, Elastic Shortening & PIT Wave Velocity', bn: 'ডেভিসন অফসেট লিমিট, ইলাস্টিক শর্টেনিং ও পিআইটি তরঙ্গ বেগ' },
          equation: 'Δ_elastic = (P_kN × L_m × 1000) / (A_mm² × E_p,GPa)  |  Δ_Davisson = Δ_elastic + (4.0 + D_mm / 120) mm  |  c (m/s) = 2L / (Δt_ms / 1000)',
          variables: [
            { en: 'P = Max test load (1.5×Q_design Working or 2.0×Q_design Initial Test), L = Pile length (m)', bn: 'P = সর্বোচ্চ টেস্ট লোড (kN), L = পাইলের দৈর্ঘ্য (মি.)' },
            { en: 'A = π·D²/4 (mm²), E_p = Pile concrete modulus (typically 25–30 GPa)', bn: 'A = পাইলের প্রস্থচ্ছেদ ক্ষেত্রফল (মিমি²), E_p = কংক্রিটের মডুলাস (GPa)' },
            { en: 'Δt_ms = PIT toe reflection transit time (ms); early spike = Necking/Void', bn: 'Δt_ms = পিআইটি তলা থেকে তরঙ্গ ফেরার সময় (মিলি-সে.)' },
          ],
          unitNote: 'BNBC/PWD Limits: Working (150% Q): Gross ≤ 18–25 mm (≤12mm @100% Q), Net ≤ 6–10 mm, Gross ≤ Δ_Davisson; Healthy PIT c = 3,600–4,200 m/s.',
        },
      ],
      workedExample: {
        en: '500 mm Ø pile, L = 21 m, P = 1,200 kN (150% Q), E_p = 25 GPa → A = 196,350 mm², Δ_elastic = (1200×21×1000)/(196350×25) = 5.13 mm; Δ_Davisson = 5.13 + (4.0 + 500/120) = 13.30 mm. Observed Gross = 11.4 mm (≤ 13.30 mm & ≤ 18 mm), Net = 3.2 mm (≤ 6 mm), PIT Δt = 10.7 ms → c = 3,925 m/s → PASS.',
        bn: '৫০০ মিমি Ø, ২১ মি. পাইলে ১,২০০ kN (১৫০%) লোডে Δ_elastic = ৫.১৩ মিমি ও ডেভিসন সীমা = ১৩.৩০ মিমি। মাপা গ্রস সেটেলমেন্ট = ১১.৪ মিমি (≤ ১৩.৩০ মিমি ও ≤ ১৮ মিমি), নেট = ৩.২ মিমি (≤ ৬ মিমি) ও পিআইটি বেগ = ৩,৯২৫ m/s → পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Gross ≤ Δ_Davisson & ≤ BNBC Max, Net ≤ 6 mm, PIT c ≥ 3,600 m/s & 0 Necking', codeLimit: 'BNBC-2020 / Davisson / ASTM', interpretation: { en: 'Intact full-length shaft and verified axial bearing capacity with adequate safety factor.', bn: 'পাইলের কংক্রিট অক্ষত আছে এবং নিরাপদ ভারবহন ক্ষমতা ডেভিসন ও বিএনবিসি অনুযায়ী প্রমাণিত হয়েছে।' } },
      { tier: 'WARNING', rangeLabel: 'Gross > Δ_Davisson (still < 25mm) OR Net 6.1–10mm OR PIT c 3,200–3,599 m/s', codeLimit: 'Geotech Review / Derate', interpretation: { en: 'Elevated settlement or minor concrete impedance shift; evaluate capacity derating or confirm via static test.', bn: 'সেটেলমেন্ট ডেভিসন সীমার ওপরে বা মাঝারি বেগ—পাইলের লোড ক্ষমতা পুনর্মূল্যায়ন করুন।' } },
      { tier: 'FAIL', rangeLabel: 'Gross > 25 mm OR Net > 10 mm OR PIT Early Necking / c < 3,200 m/s', codeLimit: 'REJECT / ADD COMPENSATORY PILES', interpretation: { en: 'Shaft necking/void or bearing plunge failure; derate defective pile and add sacrificial compensatory piles in cap.', bn: 'পাইলের ভেতরে নেকিং/ফাঁকা অথবা মাটি ধসে সেটেলমেন্ট ফেল—পাইল ক্যাপের পাশে অতিরিক্ত পাইল স্থাপন বাধ্যতামূলক।' } },
    ],
    remedialActions: [
      { en: 'Upper defects (< 3 m) may be excavated, chipped to sound core, and jacketed; deeper necking requires adding compensatory piles.', bn: 'ওপরের ৩ মিটারে ত্রুটি থাকলে খুঁড়ে জ্যাকেটিং করা যায়; গভীরে নেকিং থাকলে পাশে নতুন পাইল দিন।' },
    ],
    calculatorInputs: [
      {
        key: 'pileTestStageCode',
        label: { en: 'Static Load Test Protocol Level', bn: 'লোড টেস্টের ধরন' },
        unit: 'mode',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Working Pile Test (1.5 × Q_design, Gross ≤ 18–25mm)', bn: 'ওয়ার্কিং পাইল (১.৫ × Q_design)' } },
          { value: 2, label: { en: 'Initial Test Pile (2.0 × Q_design, Gross ≤ 25mm)', bn: 'ইনিশিয়াল টেস্ট পাইল (২.০ × Q_design)' } },
        ],
      },
      { key: 'pileDiaMm', label: { en: 'Pile Diameter (D)', bn: 'পাইলের ব্যাস (D)' }, unit: 'mm', defaultValue: 500, min: 300, max: 1500, step: 50 },
      { key: 'pileLengthM', label: { en: 'Tested Pile Length (L)', bn: 'পাইলের দৈর্ঘ্য (L)' }, unit: 'm', defaultValue: 21, min: 6, max: 60, step: 0.5 },
      { key: 'testLoadKn', label: { en: 'Peak Axial Test Load (P)', bn: 'সর্বোচ্চ টেস্ট লোড (P)' }, unit: 'kN', defaultValue: 1200, min: 200, max: 15000, step: 50 },
      { key: 'concreteEcGpa', label: { en: 'Concrete Elastic Modulus (E_p)', bn: 'কংক্রিটের মডুলাস (E_p)' }, unit: 'GPa', defaultValue: 25.0, min: 18, max: 38, step: 1 },
      { key: 'grossSettlementMm', label: { en: 'Observed Peak Gross Settlement', bn: 'মোট গ্রস সেটেলমেন্ট' }, unit: 'mm', defaultValue: 11.4, min: 0, max: 80, step: 0.2 },
      { key: 'netSettlementMm', label: { en: 'Observed Net Permanent Settlement', bn: 'স্থায়ী নেট সেটেলমেন্ট' }, unit: 'mm', defaultValue: 3.2, min: 0, max: 50, step: 0.2 },
      { key: 'pitReflectionMs', label: { en: 'PIT Toe Reflection Time (Δt)', bn: 'পিআইটি তলা থেকে প্রতিফলন সময় (Δt)' }, unit: 'ms', defaultValue: 10.7, min: 2, max: 45, step: 0.1 },
      { key: 'earlyAnomalyDepthM', label: { en: 'Early Necking/Void Depth (0 = Intact)', bn: 'নেকিং/ফাটল গভীরতা (০ = অক্ষত)' }, unit: 'm', defaultValue: 0, min: 0, max: 50, step: 0.5 },
    ],
  },

  // =========================================================================
  // CATEGORY 7: HIGHWAY, PAVEMENT & BITUMEN TESTS (RHD / LGED)
  // (রাস্তা, পেভমেন্ট ও বিটুমিন পরীক্ষা) — 5 Complete 10-Section Bilingual Protocols
  // =========================================================================

  // 7.1 CALIFORNIA BEARING RATIO (CBR) TEST — 4-DAY SOAKED
  {
    id: 'hwy-cbr-soaked',
    domainId: 'highway-bitumen',
    code: 'LAB-HWY-01',
    title: {
      en: 'California Bearing Ratio (CBR) Test — 4-Day Soaked (ASTM D1883 / RHD / LGED)',
      bn: 'ক্যালিফোর্নিয়া বিয়ারিং রেশিও (CBR) টেস্ট — ৪-দিন ভেজানো (RHD / LGED)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি পেভমেন্ট ডিজাইন পরীক্ষা',
    governingCodes: ['ASTM D1883', 'AASHTO T193', 'RHD / LGED Pavement Manual'],
    objective: {
      en: 'Measures strength and load-spreading resistance of subgrade soil, Improved Subgrade (ISG), sand-aggregate sub-base, and WBM base course after 4-day (96-hour) worst-case monsoon soaking—directly governing flexible asphalt pavement layer thicknesses under RHD & LGED road standards.',
      bn: 'বর্ষাকালের সবচেয়ে খারাপ পরিস্থিতির আদলে ৪ দিন (৯৬ ঘণ্টা) পানিতে ভিজিয়ে রেখে রাস্তার সাব-গ্রেড, ISG, সাব-বেজ ও বেজ কোর্সের ভারবহন ক্ষমতা (CBR%) নির্ণয় করে—যার ওপর রাস্তার পুরুত্ব ও স্থায়িত্ব নির্ভর করে।',
    },
    sampling: {
      frequency: {
        en: '1 three-point soaked CBR test (compacted at 10, 30 & 65 blows or 95/98% MDD) per soil/aggregate borrow source or every 1–2 km along highway alignment.',
        bn: 'প্রতিটি মাটি বা খোয়া-বালি মিক্সের উৎসে অথবা রাস্তার প্রতি ১–২ কি.মি. পরপর ১ সেট (৩টি মোল্ড)।',
      },
      quantity: {
        en: '35 kg air-dried representative soil/aggregate passing 19 mm sieve compacted inside 152 mm Ø × 178 mm height (Spacer 50.8 mm) CBR moulds.',
        bn: '১৯ মিমি চালনি দিয়ে চালা প্রায় ৩৫ কেজি নমুনা (১৫২ মিমি ব্যাস × ১৭৮ মিমি উচ্চতার ৩টি মোল্ড)।',
      },
      lotSize: {
        en: '1 borrow pit / aggregate blend source.',
        bn: '১টি মাটি বা সাব-বেজ/বেজ মিশ্রণ উৎস।',
      },
    },
    apparatus: [
      {
        item: { en: 'CBR Compression Loading Machine + Standard Penetration Piston', bn: 'সিবিআর লোডিং মেশিন ও স্ট্যান্ডার্ড পেনিট্রেশন পিস্টন' },
        spec: 'Piston Area = 1,935 mm² (Ø 49.64 mm / 3 in²), Rate = 1.27 mm/min',
      },
      {
        item: { en: '152 mm Ø CBR Moulds, 2.5 kg Annular Surcharge Weights & Swell Dial Gauge', bn: '১৫২ মিমি সিবিআর মোল্ড, ২.৫ কেজি ওজন ও সোয়েল ডায়াল গেজ' },
        spec: '96-hour immersion tank with perforated base plate & tripod',
      },
    ],
    procedure: [
      {
        en: 'Compact sample at Lab OMC into 152 mm Ø moulds (effective height 127.3 mm over 50.8 mm spacer disc) to target field compaction energy (typically 56/65 blows × 5 layers with 4.54 kg Modified Proctor hammer).',
        bn: 'ল্যাব OMC আর্দ্রতায় ১৫২ মিমি সিবিআর মোল্ডে (স্পেসার ডিস্কের ওপর ১২৭.৩ মিমি উচ্চতায়) ৪.৫৪ কেজি হ্যামারে ৫ স্তরে নির্দিষ্ট আঘাতে কমপ্যাক্ট করুন।',
      },
      {
        en: 'Place annular surcharge weights (min 4.54 kg representing pavement overburden), mount swell dial gauge, and immerse mould completely in water for exactly 96 hours (4 days), recording Swell (%) expansion.',
        bn: 'ওপরের সারচার্জ ওজন (ন্যূনতম ৪.৫৪ কেজি) ও ডায়াল গেজ বসিয়ে পুরো মোল্ডটি ঠিক ৪ দিন (৯৬ ঘণ্টা) পানিতে ডুবিয়ে রাখুন এবং মাটি কত % ফুললো (Swell %) তা লিখুন।',
      },
      {
        en: 'Drain free water for 15 minutes, center under the 1,935 mm² (3 in²) cylindrical piston, apply 45 N seating load, and penetrate steadily at 1.27 mm/min, recording loads at 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.5, 10.0, and 12.5 mm.',
        bn: 'পানি ঝরিয়ে ১,৯৩৫ মিমি² পিস্টনের নিচে বসিয়ে প্রতি মিনিটে ১.২৭ মিমি হারে চাপ দিন এবং ২.৫ মিমি ও ৫.০ মিমি প্রবেশে লোড (P₂.₅ এবং P₅.₀) নোট করুন।',
      },
      {
        en: 'Apply concave-up initial curve zero-correction if needed, then compute CBR₂.₅ = (P₂.₅ / 1370)×100% and CBR₅.₀ = (P₅.₀ / 2055)×100%. Report CBR₂.₅ (or CBR₅.₀ if higher on repeat test).',
        bn: 'CBR₂.₅ = (P₂.₅ / ১৩৭০)×১০০% ও CBR₅.₀ = (P₅.₀ / ২০৫৫)×১০০% হিসাব করে RHD/LGED স্তরের চাহিদার সাথে মিলিয়ে নিন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Always soak full 96 hours—unsoaked dry CBR often reads 2×–4× higher than soaked CBR, severely under-designing Bangladesh monsoon pavements!',
          bn: 'অবশ্যই পূর্ণ ৯৬ ঘণ্টা (৪ দিন) ভিজিয়ে টেস্ট করুন—শুকনো অবস্থায় সিবিআর ২–৪ গুণ বেশি দেখায় যা বর্ষায় রাস্তা ধসিয়ে দেয়!',
        },
      ],
      contractorTricks: [
        {
          en: '"Testing Unsoaked Moulds or Applying Excess Surcharge Weights": Skipping the 4-day soak or piling extra surcharge rings inflates apparent CBR from 4% up to 12%, falsely clearing weak clay as Improved Subgrade.',
          bn: '৪ দিন না ভিজিয়ে শুকনো টেস্ট বা বাড়তি ওজন চাপানো: না ভিজিয়ে টেস্ট করলে মাত্র ৪% সিবিআরের দুর্বল কাদাকেও ১২% দেখিয়ে ISG হিসেবে পাস করানো হয়।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'ASTM D1883 Standard Penetration Load CBR Formula', bn: 'স্ট্যান্ডার্ড সিবিআর (CBR) গণনা সূত্র' },
          equation: 'CBR₂.₅ (%) = (P₂.₅_kgf / 1370) × 100  |  CBR₅.₀ (%) = (P₅.₀_kgf / 2055) × 100  |  (1 kgf = 9.8067 N)',
          variables: [
            { en: 'P₂.₅ = Piston load at 2.5 mm penetration (Std crushed stone = 1370 kgf / 13.44 kN)', bn: 'P₂.₅ = ২.৫ মিমি প্রবেশে লোড (আদর্শ মান = ১,৩৭০ kgf / ১৩.৪৪ kN)' },
            { en: 'P₅.₀ = Piston load at 5.0 mm penetration (Std crushed stone = 2055 kgf / 20.15 kN)', bn: 'P₅.₀ = ৫.০ মিমি প্রবেশে লোড (আদর্শ মান = ২,০৫৫ kgf / ২০.১৫ kN)' },
            { en: 'Piston Area = 1,935 mm² (3.0 in²); Governing CBR is typically CBR₂.₅ (unless repeat CBR₅.₀ > CBR₂.₅)', bn: 'পিস্টন ক্ষেত্রফল = ১,৯৩৫ মিমি² (সাধারণত CBR₂.₅ প্রযোজ্য)' },
          ],
          unitNote: 'RHD / LGED Soaked Targets: Subgrade ≥ 5% (4–5%), Improved Subgrade (ISG) ≥ 10% (8–10%), Sub-base ≥ 30% (25–30%), WBM/Crushed Stone Base ≥ 80%.',
        },
      ],
      workedExample: {
        en: 'Sub-base specimen gives P₂.₅ = 465 kgf and P₅.₀ = 665 kgf, Swell = 0.35% → CBR₂.₅ = (465/1370)×100 = 33.94%; CBR₅.₀ = (665/2055)×100 = 32.36%. Governing CBR = 33.9% (≥ 30% LGED/RHD Sub-base PASS).',
        bn: 'সাব-বেজ নমুনায় P₂.₅ = ৪৬৫ kgf ও P₅.₀ = ৬৬৫ kgf হলে CBR₂.₅ = (৪৬৫/১৩৭০)×১০০ = ৩৩.৯৪% এবং CBR₅.₀ = ৩২.৩৬%। কার্যকর CBR = ৩৩.৯% (≥ ৩০% সাব-বেজ পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Governing Soaked CBR ≥ Layer Min & 4-Day Swell ≤ 1.0%', codeLimit: 'RHD / LGED / ASTM D1883', interpretation: { en: 'Approved pavement bearing strength for selected layer (Subgrade/ISG/Sub-base/Base).', bn: 'নির্বাচিত সড়ক স্তরের জন্য পর্যাপ্ত বিয়ারিং ক্ষমতা অর্জিত হয়েছে—কাজে ব্যবহার অনুমোদিত।' } },
      { tier: 'WARNING', rangeLabel: '80%–99% of Layer Target CBR OR Swell 1.01%–1.50%', codeLimit: 'Blend Sand/Khoa / Increase Thickness', interpretation: { en: 'Borderline soaked CBR; blend coarser sand/brick khoa or increase pavement overlay thickness per design.', bn: 'সীমান্তবর্তী সিবিআর—খোয়া/মোটা বালি মিশিয়ে মান বাড়ান অথবা স্তরের পুরুত্ব বৃদ্ধি করুন।' } },
      { tier: 'FAIL', rangeLabel: '< 80% of Target CBR OR 4-Day Swell > 1.50%', codeLimit: 'REJECT BORROW SOURCE', interpretation: { en: 'Unacceptable bearing failure or excessive swell; reject material or stabilize with cement/sand-stone blend.', bn: 'রাস্তার স্তর বহনের অযোগ্য বা ফোলা >১.৫%—উৎস বাতিল করে বালি-খোয়া মিশিয়ে পুনরায় মিক্স ডিজাইন করুন।' } },
    ],
    remedialActions: [
      { en: 'To upgrade weak Sub-base (CBR 18% -> ≥ 30%), increase crushed brick/stone fraction to 60–70% blended with clean coarse Sylhet sand.', bn: 'সাব-বেজের সিবিআর ৩০%-এর নিচে থাকলে ৬০–৭০% ভাঙা খোয়া ও ৩০–৪০% মোটা সিলেট বালি মিশিয়ে রি-টেস্ট করুন।' },
    ],
    calculatorInputs: [
      {
        key: 'pavementLayerCode',
        label: { en: 'Target Highway Layer (RHD / LGED)', bn: 'রাস্তার স্তর নির্বাচন (RHD / LGED)' },
        unit: 'layer',
        defaultValue: 3,
        options: [
          { value: 1, label: { en: 'Subgrade Soil (Min ≥ 5%)', bn: 'সাব-গ্রেড মাটি (≥ ৫%)' } },
          { value: 2, label: { en: 'Improved Subgrade — ISG (Min ≥ 10%)', bn: 'উন্নত সাব-গ্রেড — ISG (≥ ১০%)' } },
          { value: 3, label: { en: 'Sand-Aggregate Sub-base (Min ≥ 30%)', bn: 'সাব-বেজ কোর্স (≥ ৩০%)' } },
          { value: 4, label: { en: 'WBM / Crushed Stone Base Course (Min ≥ 80%)', bn: 'WBM / বেজ কোর্স (≥ ৮০%)' } },
        ],
      },
      { key: 'load25Kgf', label: { en: 'Measured Piston Load at 2.5 mm (P₂.₅)', bn: '২.৫ মিমি প্রবেশে লোড (P₂.₅)' }, unit: 'kgf', defaultValue: 465, min: 10, max: 3500, step: 5 },
      { key: 'load50Kgf', label: { en: 'Measured Piston Load at 5.0 mm (P₅.₀)', bn: '৫.০ মিমি প্রবেশে লোড (P₅.₀)' }, unit: 'kgf', defaultValue: 665, min: 10, max: 5000, step: 5 },
      { key: 'swellPct', label: { en: '4-Day Soaked Swell Expansion', bn: '৪-দিন ভিজিয়ে ফোলা হার (Swell)' }, unit: '%', defaultValue: 0.35, min: 0, max: 8.0, step: 0.05 },
    ],
  },

  // 7.2 DYNAMIC CONE PENETROMETER (DCP) FIELD TEST
  {
    id: 'hwy-dcp-cbr',
    domainId: 'highway-bitumen',
    code: 'LAB-HWY-02',
    title: {
      en: 'Dynamic Cone Penetrometer (DCP) Field CBR & Layer Stiffness Test',
      bn: 'ডায়নামিক কোন পেনিট্রোমিটার (DCP) ফিল্ড সিবিআর ও স্তর যাচাই পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড ডিসিপি পরীক্ষা',
    governingCodes: ['ASTM D6951', 'TRL Road Note 8', 'RHD / LGED Pavement Manual'],
    objective: {
      en: 'Rapidly evaluates in-situ CBR and layer-by-layer thickness down to 800–1,000 mm depth along compacted highways, sub-bases, and factory floors without 4-day soaking delays—instantly flagging soft wet clay pockets beneath compacted crusts.',
      bn: 'ল্যাব সিবিআর-এর ৪ দিনের অপেক্ষা ছাড়াই রাস্তার বা ফ্যাক্টরি ফ্লোরের ৮০০–১,০০০ মিমি গভীরতা পর্যন্ত প্রতিটি স্তরের সিবিআর (CBR%) ও নরম পকেট তাৎক্ষণিকভাবে শনাক্ত করে।',
    },
    sampling: {
      frequency: {
        en: 'Every 50 m staggered L/C/R along road formation / sub-base or 1 test per 200 m² industrial slab.',
        bn: 'সড়কের প্রতি ৫০ মিটার পরপর বাম-মধ্য-ডান বরাবর অথবা প্রতি ২০০ বর্গমিটারে ১টি পয়েন্ট।',
      },
      quantity: {
        en: 'Continuous non-disturbed penetration profile down to 800–1,000 mm depth.',
        bn: '৮০০–১,০০০ মিমি গভীরতা পর্যন্ত সরাসরি মাঠ পর্যায়ের রিডিং।',
      },
      lotSize: {
        en: '500 m highway section or 1,000 m² slab bay.',
        bn: '৫০০ মিটার সড়ক অংশ বা ১,০০০ বর্গমিটার এলাকা।',
      },
    },
    apparatus: [
      {
        item: { en: 'Standard 8 kg DCP Drop Hammer (575 mm Fall, 60° 20 mm Cone)', bn: 'স্ট্যান্ডার্ড ৮ কেজি ডিসিপি হ্যামার (৫৭৫ মিমি ড্রপ, ৬০° কোণ)' },
        spec: 'ASTM D6951 compliant tempered steel cone',
      },
      {
        item: { en: '1,000 mm Graduated Vertical Scale Rod', bn: '১,০০০ মিমি গ্র্যাজুয়েটেড স্কেল রড' },
        spec: '1 mm scale resolution',
      },
    ],
    procedure: [
      {
        en: 'Hold DCP rod strictly vertical on trimmed test surface, apply 1 gentle seating blow, and record Zero Scale Reading.',
        bn: 'সমতল স্থানে ডিসিপি রড খাড়া ধরে ১টি সিটিং আঘাত দিয়ে শুরুর স্কেল রিডিং নোট করুন।',
      },
      {
        en: 'Lift 8 kg hammer to the 575 mm upper stop and release cleanly in free fall without pushing or forcing the anvil.',
        bn: '৮ কেজি হ্যামারটি ঠিক ৫৭৫ মিমি ওপরের স্টপ পর্যন্ত তুলে হাতের চাপ ছাড়া মুক্তভাবে পড়তে দিন।',
      },
      {
        en: 'Record cumulative penetration (mm) after every 5 or 10 blows across the tested layer and compute Penetration Index DN = ΔPenetration / Blows (mm/blow) and log₁₀(CBR) = 2.46 - 1.12·log₁₀(DN).',
        bn: 'প্রতি ৫ বা ১০ আঘাতে কত মিমি প্রবেশ করছে তা লিখে DN (মিমি/আঘাত) এবং log₁₀(CBR) = ২.৪৬ - ১.১২ log₁₀(DN) সূত্র থেকে সিবিআর বের করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Replace worn 60° cone tips (> 2 mm wear) and relocate 300 mm away if the cone strikes an isolated brick boulder.',
          bn: 'কোণের মাথা ভোঁতা হলে বদলে নিন এবং বড় ইট-পাথরে ঠেকে গেলে ৩০০ মিমি পাশে সরিয়ে নতুন পরীক্ষা করুন।',
        },
      ],
      contractorTricks: [
        {
          en: '"Short Lifting or Leaning Weight on Handle": Lifting hammer only 400 mm makes DN artificially small (fake high CBR); leaning body weight pushes cone faster. Keep shaft plumb and full 575 mm free fall.',
          bn: 'হ্যামার পুরো ৫৭৫ মিমি না তোলা বা রডে ভর দেয়া—সর্বদা পুরো উচ্চতা থেকে মুক্ত পতন নিশ্চিত করুন।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'DCP Penetration Index (DN) & ASTM D6951 CBR Equation', bn: 'ডিসিপি পেনিট্রেশন ইনডেক্স (DN) ও সিবিআর (CBR) সূত্র' },
          equation: 'DN (mm/blow) = ΔPenetration_mm / Blows  |  log₁₀(CBR) = 2.46 - 1.12 · log₁₀(DN)',
          variables: [
            { en: 'ΔPenetration = Depth penetrated through uniform layer (mm)', bn: 'ΔPenetration = নির্দিষ্ট স্তরে প্রবেশ গভীরতা (মিমি)' },
            { en: 'Blows = Total standard 8 kg drops over ΔPenetration', bn: 'Blows = ওই স্তরে মোট আঘাতের সংখ্যা' },
          ],
          unitNote: 'Ref Values: DN = 38 mm/blow → ~5% CBR (Subgrade); DN = 20 → ~10% (ISG); DN = 7.6 → ~30% (Sub-base); DN = 3.1 → ~80% (Base).',
        },
      ],
      workedExample: {
        en: '150 mm Sub-base takes 22 blows → DN = 150 / 22 = 6.82 mm/blow → log₁₀(CBR) = 2.46 - 1.12·log₁₀(6.82) = 1.526 → CBR = 33.6% (≥ 30% Sub-base PASS).',
        bn: '১৫০ মিমি সাব-বেজে ২২ আঘাত লাগলে DN = ৬.৮২ মিমি/আঘাত → log₁₀(CBR) = ১.৫২৬ → আনুমানিক সিবিআর = ৩৩.৬% (সাব-বেজ ≥ ৩০% পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'In-Situ DCP CBR ≥ Design Layer Target CBR', codeLimit: 'ASTM D6951 / RHD', interpretation: { en: 'Stiff compacted stratum meeting design bearing CBR across full depth.', bn: 'রাস্তা বা ফ্লোরের নিচের স্তরের সিবিআর ডিজাইন চাহিদা পূরণ করেছে।' } },
      { tier: 'WARNING', rangeLabel: '80%–99% of Target CBR (e.g. 24%–29.9% for 30% Sub-base)', codeLimit: 'Re-Roll / Check Moisture', interpretation: { en: 'Marginal stiffness; apply additional vibratory compaction and check soaked lab CBR.', bn: 'মাঝারি মান—অতিরিক্ত রোলিং করে পুনরায় পরীক্ষা করুন।' } },
      { tier: 'FAIL', rangeLabel: '< 80% of Target CBR', codeLimit: 'SOFT POCKET / REMOVE & REPLACE', interpretation: { en: 'Soft compressible clay/organic pocket beneath surface; excavate and backfill with granular sub-base.', bn: 'নরম কাদা/দুর্বল পকেট—এই অংশ তুলে ভালো বালি-খোয়া ভরাট করে রোলিং করুন।' } },
    ],
    remedialActions: [
      { en: 'Where weak subgrade (< 5% CBR) sits above high water table, place woven geotextile + 200 mm sand-khoa capping layer.', bn: 'সিবিআর ৫%-এর নিচে থাকলে জিওটেক্সটাইল ও ২০০ মিমি বালি-খোয়ার ক্যাপ লেয়ার দিন।' },
    ],
    calculatorInputs: [
      { key: 'penetrationMm', label: { en: 'Layer Penetration Depth (ΔPenetration)', bn: 'মোট পেনিট্রেশন গভীরতা' }, unit: 'mm', defaultValue: 150, min: 10, max: 900, step: 5 },
      { key: 'blowCount', label: { en: 'Standard 8 kg Hammer Blows', bn: 'মোট হ্যামার আঘাতের সংখ্যা' }, unit: 'blows', defaultValue: 22, min: 1, max: 300, step: 1 },
      { key: 'targetCbrPct', label: { en: 'Required Design CBR (%)', bn: 'নির্ধারিত ডিজাইন সিবিআর (%)' }, unit: '%', defaultValue: 30, min: 3, max: 100, step: 1 },
    ],
  },

  // 7.3 BITUMEN PENETRATION, SOFTENING POINT, DUCTILITY & FLASH/FIRE POINT
  {
    id: 'hwy-bitumen-penetration',
    domainId: 'highway-bitumen',
    code: 'LAB-HWY-03',
    title: {
      en: 'Bitumen Penetration (60/70 & 80/100), Softening Point, Ductility & Flash Point',
      bn: 'বিটুমিন পেনিট্রেশন (৬০/৭০ ও ৮০/১০০), সফটেনিং পয়েন্ট, ডাক্টিলিটি ও ফ্ল্যাশ পয়েন্ট',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি হাইওয়ে বিটুমিন পরীক্ষা',
    governingCodes: ['ASTM D5 / D36 / D113 / D92', 'AASHTO T49 / T53 / T51 / T48', 'RHD / LGED Bitumen Spec'],
    objective: {
      en: 'Authenticates paving-grade bitumen (60/70 VG-30 vs 80/100 VG-10) across four physical gates—hardness (Penetration), heat resistance (Softening Point), tensile stretchability (Ductility), and overheating/solvent safety (Flash & Fire Point)—catching kerosene/waste-oil adulteration common in drum deliveries.',
      bn: 'বাংলাদেশের সড়কে ব্যবহৃত ৬০/৭০ (VG-30) ও ৮০/১০০ (VG-10) বিটুমিনের ঘনত্ব (Penetration), গরম তাপমাত্রায় গলে না যাওয়া (Softening Point), টান সহনশীলতা (Ductility) এবং পোড়া মবিল/কেরোসিন ভেজাল শনাক্তের ফ্ল্যাশ/ফায়ার পয়েন্ট যাচাই করে।',
    },
    sampling: {
      frequency: {
        en: '1 full 4-test suite per 20–50 drums (or every bulk bitumen tanker delivery) prior to Prime/Tack Coat or Hot-Mix production.',
        bn: 'প্রতি ২০–৫০ ড্রাম বিটুমিন বা প্রতিটি বিটুমিন ট্যাংকার ব্যাচে ১ সেট পূর্ণাঙ্গ পরীক্ষা।',
      },
      quantity: {
        en: '2.0 kg clean molten bitumen from mid-drum depth poured carefully into penetration cup, brass softening rings, briquette ductility moulds, and Cleveland Open Cup.',
        bn: 'ড্রামের মাঝের স্তর থেকে সংগৃহীত ২.০ কেজি পরিষ্কার বিটুমিন নমুনা।',
      },
      lotSize: {
        en: '1 Bitumen batch / 20 Metric Tonnes.',
        bn: '১টি বিটুমিন লট / ২০ মেট্রিক টন।',
      },
    },
    apparatus: [
      {
        item: { en: 'Standard Penetrometer (100 g Needle, 5.0 s, 25.0 ± 0.1°C Water Bath)', bn: 'স্ট্যান্ডার্ড পেনিট্রোমিটার (১০০ গ্রাম সুই, ৫ সেকেন্ড, ২৫°সে)' },
        spec: '1 division = 0.1 mm (dmm) penetration',
      },
      {
        item: { en: 'Ring & Ball Softening Apparatus (3.5 g Balls, 5°C/min Heat Rate)', bn: 'রিং অ্যান্ড বল সফটেনিং অ্যাপারেটাস' },
        spec: 'Two 15.88 mm brass rings, 25.0 mm ball drop distance',
      },
      {
        item: { en: 'Ductility Machine (27.0°C Bath, 50 mm/min Pull) & Cleveland Open Cup Flash Tester', bn: 'ডাক্টিলিটি মেশিন (২৭°সে) ও ক্লিভল্যান্ড ওপেন কাপ ফ্ল্যাশ টেস্টার' },
        spec: 'Ductility travel ≥ 100 cm; Flash thermometer up to 360°C',
      },
    ],
    procedure: [
      {
        en: 'Penetration (ASTM D5): Condition cup in 25.0 ± 0.1°C water bath for 1 hour, touch 100 g standard needle tip cleanly onto bitumen surface, release freely for 5.0 seconds, and average 3 readings ≥ 10 mm apart.',
        bn: 'পেনিট্রেশন: ২৫.০°সে পানিতে ১ ঘণ্টা কন্ডিশনিং শেষে ১০০ গ্রাম সুই ৫.০ সেকেন্ড ছেড়ে ৩টি স্থানে গড় রিডিং (০.১ মিমি এককে) নিন।',
      },
      {
        en: 'Ring & Ball Softening Point (ASTM D36): Mount 3.5 g steel balls on cooled rings in bath, heat uniformly at 5°C/min, and average temperatures when each ball drops 25.0 mm to the lower plate.',
        bn: 'সফটেনিং পয়েন্ট: রিংয়ের ওপর ৩.৫ গ্রাম বল বসিয়ে প্রতি মিনিটে ৫°সে হারে তাপ বাড়িয়ে বল দুটি ২৫ মিমি নিচে নামার গড় তাপমাত্রা লিখুন।',
      },
      {
        en: 'Ductility (ASTM D113): Pour briquette moulds (10×10 mm waist), condition at 27.0°C for 90 min, pull apart at 50 mm/min inside density-matched bath, and record distance (cm) until thread breaks.',
        bn: 'ডাক্টিলিটি: ২৭.০°সে তাপমাত্রায় ব্রিকেট মোল্ড প্রতি মিনিটে ৫০ মিমি গতিতে টেনে সুতা ছিঁড়ে যাওয়ার দৈর্ঘ্য (সেমি) মাপুন।',
      },
      {
        en: 'Flash & Fire Point (ASTM D92): Heat bitumen in Cleveland Open Cup at 5–6°C/min, pass small test flame across cup; Flash Point is the temperature when surface vapors briefly flash blue (<5s burning = Fire Point).',
        bn: 'ফ্ল্যাশ পয়েন্ট: ওপেন কাপে বিটুমিন গরম করে ওপর দিয়ে ছোট শিখা ঘোরান—যে তাপমাত্রায় নীল আগুন ঝলকে ওঠে সেটিই ফ্ল্যাশ পয়েন্ট (এবং ≥৫ সেকেন্ড জ্বলে থাকলে ফায়ার পয়েন্ট)।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Never overheat bitumen > 175°C while melting samples for testing—excess heat oxidizes light fractions and falsely lowers penetration by 10–15 units.',
          bn: 'নমুনা গলানোর সময় ১৭৫°সে-এর বেশি তাপ দেবেন না—অতিরিক্ত তাপে বিটুমিন শক্ত হয়ে ভুল কম পেনিট্রেশন দেখায়।',
        },
      ],
      contractorTricks: [
        {
          en: '"Used Engine Oil / Kerosene Dilution & Fake 60/70 Drum Stencils": Unscrupulous suppliers cut hard oxidized bitumen with burnt mobil or solvent to fake a "65 penetration" reading—exposed instantly by low Flash Point (< 220°C) and brittle Ductility (< 50 cm)!',
          bn: 'পোড়া মবিল বা কেরোসিন মেশানো ভেজাল বিটুমিন: শক্ত বা সস্তা বিটুমিনে মবিল/কেরোসিন মিশিয়ে পেনিট্রেশন ৬৫ বানানো হয়—যা ফ্ল্যাশ পয়েন্ট (<২২০°সে) ও কম ডাক্টিলিটি (<৫০ সেমি) পরীক্ষায় সাথে সাথে ধরা পড়ে!',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: '60/70 (VG-30) vs 80/100 (VG-10) RHD Bitumen Benchmarks', bn: '৬০/৭০ বনাম ৮০/১০০ বিটুমিন মানদণ্ড (RHD / LGED)' },
          equation: 'Pen_avg = (P₁ + P₂ + P₃) / 3 (0.1 mm)  |  60/70 (VG-30): Pen 60–70, SP ≥ 46°C, Duct ≥ 75 cm, Flash ≥ 230°C',
          variables: [
            { en: '60/70 Grade (VG-30): Standard for RHD National/Regional Highways (heavy axle loads, 40°C+ summer)', bn: '৬০/৭০ (VG-30): ভারী মহাসড়ক ও গরমের জন্য আদর্শ (পেন ৬০–৭০, SP ≥ ৪৬°সে, ডাক্টিলিটি ≥ ৭৫ সেমি)' },
            { en: '80/100 Grade (VG-10): LGED Rural Roads, Surface Dressing & Cold-Season Seal Coats (Pen 80–100, SP ≥ 42°C, Duct ≥ 75 cm, Flash ≥ 220°C)', bn: '৮০/১০০ (VG-10): গ্রামীণ সড়ক ও সিল কোট (পেন ৮০–১০০, SP ≥ ৪২°সে, ফ্ল্যাশ ≥ ২২০°সে)' },
          ],
          unitNote: 'Fire Point typically exceeds Flash Point by 20–35°C; Flash Point < 220°C flags volatile diesel/kerosene contamination.',
        },
      ],
      workedExample: {
        en: '60/70 Grade drum test: Pen = (64+66+65)/3 = 65.0 dmm (60–70), Softening Point = 50.0°C (≥ 46°C), Ductility = 88 cm (≥ 75 cm), Flash Point = 265°C (≥ 230°C) → ALL 4 GATES PASS.',
        bn: '৬০/৭০ ড্রাম পরীক্ষায়: পেনিট্রেশন = ৬৫.০ (৬০–৭০), সফটেনিং = ৫০.০°সে (≥ ৪৬°), ডাক্টিলিটি = ৮৮ সেমি (≥ ৭৫ সেমি) ও ফ্ল্যাশ পয়েন্ট = ২৬৫°সে (≥ ২৩০°) → ৪টি গেটই পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Penetration, Softening Point, Ductility ≥ 75cm & Flash Point All Within Grade Spec', codeLimit: 'RHD / LGED / ASTM D946', interpretation: { en: 'Authentic un-adulterated paving bitumen approved for hot-mix batching & spraying.', bn: 'ভেজালমুক্ত খাঁটি বিটুমিন—হট-মিক্স প্ল্যান্ট ও প্রাইম/ট্যাক কোটের জন্য অনুমোদিত।' } },
      { tier: 'WARNING', rangeLabel: 'Penetration ±5 dmm outside band OR Ductility 65–74 cm OR SP 1–2°C low', codeLimit: 'Verify Viscosity / Restrict Traffic', interpretation: { en: 'Slight grade drift or early oxidation; check absolute viscosity at 60°C or restrict to light rural roads.', bn: 'গ্রেডের সামান্য বিচ্যুতি—হালকা সড়কের আগে ৬০°সে ভিসকোসিটি যাচাই করুন।' } },
      { tier: 'FAIL', rangeLabel: 'Flash Point < 220°C OR Ductility < 65 cm OR Penetration >10 dmm off spec', codeLimit: 'REJECT — ADULTERATED LOT', interpretation: { en: 'Solvent/burnt-oil adulterated or brittle cracked bitumen; reject entire consignment immediately.', bn: 'কেরোসিন/পোড়া মবিল ভেজাল অথবা অতি ভঙ্গুর বিটুমিন—পুরো চালান অবিলম্বে ফেরত দিন।' } },
    ],
    remedialActions: [
      { en: 'Never allow open-drum field boiling without thermometers; reject any drum showing smoke/flash below 220°C.', bn: 'থার্মোমিটার ছাড়া ড্রাম ফোটাবেন না এবং ২২০°সে-এর নিচে ধোঁয়া বা আগুন ধরলে লট বাতিল করুন।' },
    ],
    calculatorInputs: [
      {
        key: 'bitumenGradeCode',
        label: { en: 'Specified Bitumen Grade', bn: 'নির্ধারিত বিটুমিন গ্রেড' },
        unit: 'grade',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '60/70 Penetration Grade (VG-30 Highway)', bn: '৬০/৭০ গ্রেড (VG-30 মহাসড়ক)' } },
          { value: 2, label: { en: '80/100 Penetration Grade (VG-10 Rural/Seal)', bn: '৮০/১০০ গ্রেড (VG-10 গ্রামীণ সড়ক)' } },
        ],
      },
      { key: 'pen1', label: { en: 'Penetration Reading #1 (25°C, 100g, 5s)', bn: 'পেনিট্রেশন রিডিং #১' }, unit: '0.1mm', defaultValue: 64, min: 15, max: 180, step: 1 },
      { key: 'pen2', label: { en: 'Penetration Reading #2', bn: 'পেনিট্রেশন রিডিং #২' }, unit: '0.1mm', defaultValue: 66, min: 15, max: 180, step: 1 },
      { key: 'pen3', label: { en: 'Penetration Reading #3', bn: 'পেনিট্রেশন রিডিং #৩' }, unit: '0.1mm', defaultValue: 65, min: 15, max: 180, step: 1 },
      { key: 'softeningTempC', label: { en: 'Ring & Ball Softening Point', bn: 'সফটেনিং পয়েন্ট তাপমাত্রা' }, unit: '°C', defaultValue: 50.0, min: 30, max: 95, step: 0.5 },
      { key: 'ductilityCm', label: { en: 'Ductility at 27°C', bn: 'ডাক্টিলিটি (২৭°সে)' }, unit: 'cm', defaultValue: 88, min: 5, max: 120, step: 1 },
      { key: 'flashPointC', label: { en: 'Cleveland Open Cup Flash Point', bn: 'ফ্ল্যাশ পয়েন্ট তাপমাত্রা' }, unit: '°C', defaultValue: 265, min: 140, max: 350, step: 5 },
    ],
  },

  // 7.4 MARSHALL STABILITY, FLOW & BITUMEN EXTRACTION TEST
  {
    id: 'hwy-marshall-stability',
    domainId: 'highway-bitumen',
    code: 'LAB-HWY-04',
    title: {
      en: 'Marshall Stability, Flow, Air Voids & Centrifuge Bitumen Extraction Test',
      bn: 'মার্শাল স্ট্যাবিলিটি, ফ্লো, এয়ার ভয়েডস ও বিটুমিন এক্সট্রাকশন পরীক্ষা',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি হট-মিক্স অ্যাসফল্ট পরীক্ষা',
    governingCodes: ['ASTM D6927 (Marshall)', 'ASTM D2172 (Extraction)', 'AASHTO T245 / RHD Spec'],
    objective: {
      en: 'Simultaneously audits HMA strength (Marshall Stability), deformation resistance (Flow), void waterproofing (V_a = 3%–5%), and true plant bitumen binder percentage via centrifuge solvent extraction—catching "starved mix" contractor cost-cutting on Wearing Course & DBM layers.',
      bn: 'হট-মিক্স অ্যাসফল্টের ভারবহন ক্ষমতা (Stability), ফ্লো (Flow), এয়ার ভয়েডস (৩–৫%) এবং সেন্ট্রিফিউজ এক্সট্রাকশন করে প্ল্যান্টের মিশ্রণে আসল বিটুমিন % ঠিক আছে কিনা তা একসাথে যাচাই করে।',
    },
    sampling: {
      frequency: {
        en: '1 full Marshall + Centrifuge Extraction set per production shift or every 100–200 MT of Hot-Mix Asphalt (HMA) from batch/drum plant.',
        bn: 'অ্যাসফল্ট প্ল্যান্টের প্রতি শিফটে বা প্রতি ১০০–২০০ মেট্রিক টন হট-মিক্স উৎপাদনে ১ সেট পরীক্ষা।',
      },
      quantity: {
        en: '3 compacted Marshall briquettes (101.6 mm Ø × 63.5 mm H, 75 blows/face) + 1,000–1,200 g loose hot mix for centrifuge bitumen extraction.',
        bn: '৩টি মার্শাল ব্রিকেট (প্রতি পিঠে ৭৫ আঘাত) এবং এক্সট্রাকশনের জন্য ১,০০০–১,২০০ গ্রাম তাজা হট-মিক্স।',
      },
      lotSize: {
        en: '100–200 MT HMA production lot.',
        bn: '১০০–২০০ মেট্রিক টন হট-মিক্স ব্যাচ।',
      },
    },
    apparatus: [
      {
        item: { en: 'Marshall Load Frame (50.8 mm/min), Breaking Head & 60°C Water Bath', bn: 'মার্শাল লোডিং প্রেস (৫০.৮ মিমি/মিনিট), ব্রেকিং হেড ও ৬০°সে বাথ' },
        spec: '50 kN load ring/cell + 0.25 mm flow gauge',
      },
      {
        item: { en: 'Centrifuge Bitumen Extractor (3,600 RPM), Filter Ring & Solvent (TCE/Benzene)', bn: 'সেন্ট্রিফিউজ বিটুমিন এক্সট্রাক্টর ও সলভেন্ট' },
        spec: '0.1 g digital balance + muffle furnace/ash pan for W_ash',
      },
    ],
    procedure: [
      {
        en: 'Determine briquette Bulk Specific Gravity (G_mb) in air/water and compare with Theoretical Maximum Rice Gravity (G_mm) to obtain Air Voids V_a%.',
        bn: 'ব্রিকেটের বাল্ক ডেনসিটি (G_mb) ও রাইস ম্যাক্স ডেনসিটি (G_mm) মেপে এয়ার ভয়েডস V_a% হিসাব করুন।',
      },
      {
        en: 'Condition briquettes in 60 ± 1°C water bath for 30–40 min, load inside breaking head at 50.8 mm/min until failure, and read Stability (kN) and Flow (mm).',
        bn: '৬০°সে পানিতে ৩০–৪০ মিনিট রেখে ৫০.৮ মিমি/মিনিট গতিতে লোড দিয়ে স্ট্যাবিলিটি (kN) ও ফ্লো (মিমি) মাপুন।',
      },
      {
        en: 'Bitumen Extraction (ASTM D2172): Weigh loose HMA sample (W₁), place in centrifuge bowl with solvent, spin at up to 3,600 RPM repeatedly until clear solvent drains, oven-dry extracted aggregates (W₂), and measure ash/filler correction (W_ash).',
        bn: 'বিটুমিন এক্সট্রাকশন: হট-মিক্স ওজন করে (W₁) সেন্ট্রিফিউজ বাটিতে সলভেন্ট দিয়ে ঘুরান যতক্ষণ না পরিষ্কার সলভেন্ট বের হয়; পাথর শুকিয়ে ওজন (W₂) এবং ফিলার অ্যাশ (W_ash) মাপুন।',
      },
      {
        en: 'Compute Bitumen (%) = [(W₁ - W₂ + W_ash) / W₁] × 100 and check all parameters against RHD Wearing Course or DBM acceptance bands.',
        bn: 'বিটুমিন (%) = [(W₁ - W₂ + W_ash) / W₁] × ১০০ বের করে RHD ওয়্যারিং কোর্স বা DBM-এর সীমার সাথে যাচাই করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Operate centrifuge extractor strictly under ventilated fume hood using chemical gloves—trichloroethylene/benzene vapors are hazardous.',
          bn: 'এক্সট্রাকশন টেস্ট অবশ্যই ফিউম হুড বা খোলা বাতাসে গ্লাভস পরে করুন—সলভেন্টের গ্যাস স্বাস্থ্যের জন্য ক্ষতিকর।',
        },
        {
          en: 'Complete Marshall crushing within 30 seconds of leaving the 60°C water bath to prevent false stiff readings.',
          bn: '৬০°সে বাথ থেকে তোলার ৩০ সেকেন্ডের মধ্যে মার্শাল টেস্ট শেষ করুন।',
        },
      ],
      contractorTricks: [
        {
          en: '"Starving Expensive Bitumen Below JMF": Reducing bitumen from 5.2% down to 4.1% saves money at the plant while producing Air Voids > 6%—causing massive aggregate raveling and potholes during the first monsoon!',
          bn: 'মিক্সে বিটুমিন কমিয়ে দেয়া: খরচ বাঁচাতে ৫.২%-এর বদলে ৪.১% বিটুমিন দিলে এয়ার ভয়েডস ৬%-এর বেশি হয়ে প্রথম বর্ষাতেই রাস্তার পাথর উঠে গর্ত হয়ে যায়—যা এক্সট্রাকশনে সাথে সাথে ধরা পড়ে!',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Bitumen Extraction %, Air Voids (V_a%) & Marshall Quotient', bn: 'বিটুমিন %, এয়ার ভয়েডস ও মার্শাল কোশেন্ট সূত্র' },
          equation: 'Bitumen(%) = [(W₁ - W₂ + W_ash) / W₁] × 100  |  Va(%) = [(G_mm - G_mb) / G_mm] × 100  |  MQ = Stability_kN / Flow_mm',
          variables: [
            { en: 'W₁ = Initial dry HMA mix mass (g); W₂ = Oven-dry extracted aggregate mass (g)', bn: 'W₁ = মোট অ্যাসফল্ট নমুনার ওজন; W₂ = শুকনো পাথরের ওজন (গ্রাম)' },
            { en: 'W_ash = Solvent-retained bitumen/ash correction weight (g)', bn: 'W_ash = অ্যাশ বা সংশোধন ওজন (গ্রাম)' },
          ],
          unitNote: 'RHD Spec: Wearing Course Stab ≥ 9.0 kN, Bitumen 4.8–6.0%; DBM Stab ≥ 8.2 kN, Bitumen 4.0–5.2%; Flow 2.0–4.0 mm; Air Voids 3.0%–5.0%.',
        },
      ],
      workedExample: {
        en: 'Wearing Course HMA: Stab = 11.4 kN (≥ 9.0), Flow = 3.1 mm (2–4), G_mb=2.382 vs G_mm=2.480 → Va = 3.95% (3–5%). Extraction W₁=1200g, W₂=1138g, W_ash=1.6g → Bitumen = [(1200-1138+1.6)/1200]×100 = 5.30% (4.8–6.0% PASS).',
        bn: 'ওয়্যারিং কোর্সে: স্ট্যাবিলিটি ১১.৪ kN (≥ ৯.০), ফ্লো ৩.১ মিমি, এয়ার ভয়েডস Va = ৩.৯৫% (৩–৫%) এবং এক্সট্রাকশন W₁=১২০০g, W₂=১১৩৮g, W_ash=১.৬g → বিটুমিন = ৫.৩০% (৪.৮–৬.০% পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Stability ≥ 9.0 (WC) / ≥ 8.2 (DBM) kN, Flow 2–4 mm, Va 3–5%, Bitumen Within Spec', codeLimit: 'RHD / ASTM D6927 & D2172', interpretation: { en: 'Balanced rut-resistant & waterproof asphalt plant production certified.', bn: 'জলরোধী ও শক্তিশালী হট-মিক্স অ্যাসফল্ট—রাস্তায় কার্পেটিংয়ের জন্য অনুমোদিত।' } },
      { tier: 'WARNING', rangeLabel: 'Minor deviation in Flow (4.1–4.5mm), Va (2.5–2.9% / 5.1–6.0%) or Bitumen ±0.3%', codeLimit: 'Tune HMA Plant JMF', interpretation: { en: 'Adjust plant bitumen pump calibration or stone-dust filler & re-test next truck.', bn: 'প্ল্যান্টে বিটুমিন বা পাথরের অনুপাত সামান্য সমন্বয় করে পরবর্তী ট্রাক পুনরায় পরীক্ষা করুন।' } },
      { tier: 'FAIL', rangeLabel: 'Stability < 8.0 kN OR Flow > 4.5mm OR Va < 2.5% / > 6.0% OR Starved/Over-rich Bitumen', codeLimit: 'HALT HMA PLANT', interpretation: { en: 'Severe bleeding/rutting or monsoon stripping risk; reject mix and recalibrate batch plant.', bn: 'রাস্তা ডেবে যাওয়া বা বর্ষায় পাথর উঠে যাওয়ার মারাত্মক ঝুঁকি—প্ল্যান্ট বন্ধ করে মিক্স পরিবর্তন করুন।' } },
    ],
    remedialActions: [
      { en: 'Compare extracted aggregate sieve gradation against approved Job Mix Formula (JMF) whenever Bitumen % or Va% drifts out of spec.', bn: 'বিটুমিন % বা এয়ার ভয়েডস বিচ্যুত হলে এক্সট্রাকশন করা পাথরের চালনি বিশ্লেষণ JMF-এর সাথে মিলিয়ে নিন।' },
    ],
    calculatorInputs: [
      {
        key: 'courseTypeCode',
        label: { en: 'Pavement Layer Spec (RHD)', bn: 'রাস্তার স্তরের ধরন (RHD)' },
        unit: 'layer',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Wearing Course (Stab ≥ 9.0 kN, Bitumen 4.8–6.0%)', bn: 'ওয়্যারিং কোর্স (স্ট্যাব ≥ ৯.০ kN, বিটুমিন ৪.৮–৬.০%)' } },
          { value: 2, label: { en: 'Dense Bituminous Macadam — DBM (Stab ≥ 8.2 kN, 4.0–5.2%)', bn: 'ডেন্স বিটুমিনাস ম্যাক্যাডাম — DBM (≥ ৮.২ kN, ৪.০–৫.২%)' } },
        ],
      },
      { key: 'correctedStabilityKn', label: { en: 'Corrected Marshall Stability', bn: 'সংশোধিত মার্শাল স্ট্যাবিলিটি' }, unit: 'kN', defaultValue: 11.4, min: 2, max: 30, step: 0.2 },
      { key: 'flowMm', label: { en: 'Marshall Flow Value', bn: 'মার্শাল ফ্লো মান' }, unit: 'mm', defaultValue: 3.1, min: 0.5, max: 10, step: 0.1 },
      { key: 'bulkGravityGmb', label: { en: 'Briquette Bulk Gravity (G_mb)', bn: 'বাল্ক স্পেসিফিক গ্র্যাভিটি (G_mb)' }, unit: 'g/cc', defaultValue: 2.382, min: 1.8, max: 2.8, step: 0.005 },
      { key: 'riceGravityGmm', label: { en: 'Theoretical Max Rice Gravity (G_mm)', bn: 'রাইস ম্যাক্স গ্র্যাভিটি (G_mm)' }, unit: 'g/cc', defaultValue: 2.480, min: 1.9, max: 2.9, step: 0.005 },
      { key: 'mixSampleW1G', label: { en: 'Extraction Initial Mix Mass (W₁)', bn: 'এক্সট্রাকশন নমুনা ওজন (W₁)' }, unit: 'g', defaultValue: 1200, min: 300, max: 3000, step: 10 },
      { key: 'extractedAggW2G', label: { en: 'Extracted Dry Aggregate Mass (W₂)', bn: 'শুকনো পাথরের ওজন (W₂)' }, unit: 'g', defaultValue: 1138, min: 250, max: 2900, step: 1 },
      { key: 'mineralAshG', label: { en: 'Ash / Correction Mass (W_ash)', bn: 'অ্যাশ ওজন (W_ash)' }, unit: 'g', defaultValue: 1.6, min: 0, max: 50, step: 0.2 },
    ],
  },

  // 7.5 ASPHALT FIELD CORE DENSITY, PAVEMENT THICKNESS & PRIME COAT AUDIT
  {
    id: 'hwy-core-compaction',
    domainId: 'highway-bitumen',
    code: 'LAB-HWY-05',
    title: {
      en: 'Asphalt Field Core Density, Pavement Thickness & Prime Coat Audit',
      bn: 'রাস্তার পিচ ঢালাই কোর ডেনসিটি, পুরুত্ব ও প্রাইম/ট্যাক কোট পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড কোর ও রেট পরীক্ষা',
    governingCodes: ['ASTM D2726 / D3549', 'RHD Road Spec §4.3', 'LGED Bituminous Manual'],
    objective: {
      en: 'Verifies that finished compacted asphalt achieved ≥ 97% of Marshall lab density, meets paid layer thickness (e.g. 50 mm DBM/WC), and receives exact tack/prime coat bitumen spray rate.',
      bn: 'রাস্তার রোলিং শেষে পিচ ঢালাইয়ের ঘনত্ব ল্যাব মার্শাল ডেনসিটির কমপক্ষে ৯৭% হয়েছে কিনা, বিলের পুরুত্ব ঠিক আছে কিনা এবং প্রাইম/ট্যাক কোট সঠিক হারে দেয়া হয়েছে কিনা যাচাই করে।',
    },
    sampling: {
      frequency: {
        en: '1 drilled 100 mm core per 250–500 m² (or every 100 m staggered lane); 1 tray check per 500 m² prime/tack coat.',
        bn: 'প্রতি ২৫০–৫০০ বর্গমিটারে ১টি ১০০ মিমি কোর কাটিং এবং প্রতি ৫০০ বর্গমিটারে প্রাইম কোট ট্রে টেস্ট।',
      },
      quantity: {
        en: '100 mm Ø core extracted cleanly after pavement cools (< 40°C).',
        bn: 'রাস্তা ঠান্ডা (<৪০°সে) হওয়ার পর কাটা ১০০ মিমি ব্যাসের কোর।',
      },
      lotSize: {
        en: '1 day paving lane run.',
        bn: '১ দিনের কার্পেটিং লেন অংশ।',
      },
    },
    apparatus: [
      {
        item: { en: 'Diamond Core Drilling Machine (100 mm Ø) + Caliper', bn: 'ডায়মন্ড কোর কাটিং মেশিন (১০০ মিমি) ও ক্যালিপার' },
        spec: '0.5 mm thickness precision',
      },
      {
        item: { en: '300×300 mm Tared Metal/Paper Tray & Digital Balance', bn: '৩০০×৩০০ মিমি ট্রে ও ডিজিটাল স্কেল' },
        spec: 'For prime/tack coat spray rate (kg/m²)',
      },
    ],
    procedure: [
      {
        en: 'Core Extraction: Drill 100 mm core 24h after rolling, dry off water, measure thickness at 4 quadrants (T_avg), and measure Bulk Specific Gravity G_core via ASTM D2726.',
        bn: 'কোর কাটিং: রোলিংয়ের ২৪ ঘণ্টা পর ১০০ মিমি কোর কেটে ৪ কোণায় পুরুত্ব (T_avg) মাপুন এবং ডেনসিটি G_core নির্ণয় করুন।',
      },
      {
        en: 'Compute Field Compaction % = (G_core / G_lab_marshall) × 100 (target ≥ 97%).',
        bn: 'ফিল্ড কমপ্যাকশন % = (G_core / G_lab) × ১০০ হিসাব করুন (লক্ষ্য ≥ ৯৭%)।',
      },
      {
        en: 'Prime/Tack Coat Check: Weigh clean tray (W₀), lay flat ahead of bitumen sprayer, re-weigh immediately after pass (W₁), and divide net mass by tray area (0.09 m²).',
        bn: 'প্রাইম/ট্যাক কোট পরীক্ষা: স্প্রেয়ারের সামনে মাপা ট্রে (W₀) বিছিয়ে স্প্রে শেষে আবার ওজন নিন (W₁) এবং প্রতি বর্গমিটারে কেজি/লিটার হিসাব করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Backfill and compact every core hole immediately with hot mix or cold patch to prevent water ingress.',
          bn: 'কোর কাটার সাথে সাথেই গর্তটি হট-মিক্স দিয়ে ভরাট করে রোলিং করে দিন।',
        },
      ],
      contractorTricks: [
        {
          en: '"Thick Edges, Thin Crown" Paving: Laying full 50 mm along road shoulders while starving inner traffic lanes to 35 mm—caught instantly by staggered core drilling!',
          bn: 'কিনারে মোটা, মাঝখানে পাতলা: রাস্তার দুই কিনারে ৫০ মিমি দিয়ে মাঝের লেনে ৩৫ মিমি দেয়া হয়—যা স্ট্যাগার্ড কোর কাটিংয়ে সাথে সাথে ধরা পড়ে।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Field Core Compaction % & Thickness Variance', bn: 'ফিল্ড কোর কমপ্যাকশন % ও পুরুত্ব বিচ্যুতি' },
          equation: 'Comp(%) = (G_core / G_lab) × 100  |  ΔT = T_measured - T_design (mm)',
          variables: [
            { en: 'G_core = Drilled core bulk gravity; G_lab = Daily Marshall reference gravity', bn: 'G_core = কোরের ডেনসিটি; G_lab = ল্যাব মার্শাল ডেনসিটি' },
            { en: 'T_measured = Average 4-point core thickness vs Design thickness (mm)', bn: 'T_measured = কোরের গড় পুরুত্ব বনাম ডিজাইন পুরুত্ব (মিমি)' },
          ],
          unitNote: 'RHD Spec: Core Compaction ≥ 97.0% of Lab Marshall; Thickness shortfall ≤ 3 mm.',
        },
      ],
      workedExample: {
        en: 'G_core = 2.330 vs G_lab = 2.382 → Compaction = 97.8% (PASS ≥ 97%). Core T_avg = 49.0 mm vs 50 mm design (-1.0 mm PASS).',
        bn: 'G_core = ২.৩৩০ বনাম G_lab = ২.৩৮২ → কমপ্যাকশন = ৯৭.৮% (পাস ≥ ৯৭%) এবং গড় পুরুত্ব ৪৯ মিমি বনাম ৫০ মিমি (পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Core Compaction ≥ 97.0% & Thickness Deficit ≤ 3 mm', codeLimit: 'RHD / LGED / ASTM', interpretation: { en: 'Full payment-grade asphalt density and thickness achieved.', bn: 'সঠিক ঘনত্ব ও পুরুত্ব অর্জিত হয়েছে—পূর্ণ বিলের জন্য অনুমোদিত।' } },
      { tier: 'WARNING', rangeLabel: 'Compaction 95.0–96.9% OR Thickness Deficit 3.1–5.0 mm', codeLimit: 'Penalty / Fog Seal', interpretation: { en: 'Under-compacted or slightly thin; apply contract price adjustment.', bn: 'সামান্য কম ঘনত্ব বা পুরুত্ব—চুক্তি অনুযায়ী বিল কর্তন বা সিলিং প্রযোজ্য।' } },
      { tier: 'FAIL', rangeLabel: 'Compaction < 95.0% OR Thickness Deficit > 5.0 mm', codeLimit: 'MILL & OVERLAY', interpretation: { en: 'Permeable honeycombed asphalt that will ravel rapidly; mill defective lane and re-pave.', bn: 'অতি আলগা বা মারাত্মক পাতলা ঢালাই—মিলিং করে পুনরায় ঢালাই দিতে হবে।' } },
    ],
    remedialActions: [
      { en: 'Halt rolling once mat cools below 85°C (breakdown rolling must occur > 115°C); cold rolling crushes aggregates.', bn: 'পিচ ৮৫°সে-এর নিচে ঠান্ডা হয়ে গেলে রোলিং বন্ধ করুন; মিক্সিং ও রোলিং তাপমাত্রা কঠোরভাবে নিয়ন্ত্রণ করুন।' },
    ],
    calculatorInputs: [
      { key: 'coreDensity', label: { en: 'Drilled Core Bulk Gravity (G_core)', bn: 'মাঠের কোরের ঘনত্ব (G_core)' }, unit: 'g/cc', defaultValue: 2.33, min: 1.8, max: 2.7, step: 0.005 },
      { key: 'labMarshallDensity', label: { en: 'Daily Lab Marshall Density (G_lab)', bn: 'দৈনিক ল্যাব মার্শাল ঘনত্ব (G_lab)' }, unit: 'g/cc', defaultValue: 2.382, min: 1.8, max: 2.7, step: 0.005 },
      { key: 'designThicknessMm', label: { en: 'Design Pavement Thickness', bn: 'ডিজাইন পুরুত্ব' }, unit: 'mm', defaultValue: 50, min: 20, max: 150, step: 5 },
      { key: 'measuredThicknessMm', label: { en: 'Average Measured Core Thickness', bn: 'কোরে মাপা গড় পুরুত্ব' }, unit: 'mm', defaultValue: 49, min: 10, max: 160, step: 0.5 },
    ],
  },

  // =========================================================================
  // CATEGORY 8: WATER QUALITY, PLUMBING & WATERPROOFING TESTS
  // (পানি, প্লাম্বিং ও ওয়াটারপ্রুফিং পরীক্ষা) — 4 Complete 10-Section Bilingual Protocols
  // =========================================================================

  // 8.1 CONCRETE MIXING & CURING WATER QUALITY TEST
  {
    id: 'wat-mixing-water',
    domainId: 'water-plumbing',
    code: 'LAB-WAT-01',
    title: {
      en: 'Concrete Mixing & Curing Water Quality Test (pH, Chloride Cl⁻, Sulfate SO₄²⁻ & TDS)',
      bn: 'কংক্রিট মিক্সিং ও কিউরিং পানির মান পরীক্ষা (pH, ক্লোরাইড Cl⁻, সালফেট ও TDS)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাব ও ফিল্ড ওয়াটার কেমিস্ট্রি পরীক্ষা',
    governingCodes: ['BNBC-2020 Part 6 §5.3', 'ASTM C1602', 'IS 456:2000 Table 1'],
    objective: {
      en: 'Prevents premature steel rebar corrosion and concrete sulfate attack caused by brackish coastal groundwater, tidal river water, or contaminated deep-tubewell iron/chloride water—enforcing strict Chloride limits (≤ 500 mg/L for RCC vs ≤ 2000 mg/L for unreinforced PCC).',
      bn: 'উপকূলীয় লবণাক্ত পানি, নদীর দূষিত পানি বা অতিরিক্ত ক্লোরাইডযুক্ত নলকূপের পানি দিয়ে ঢালাই বা কিউরিং করলে রডে দ্রুত মরিচা ধরে ভবন ধ্বংস হয়—তা ঠেকাতে পানির pH, ক্লোরাইড (RCC ≤ ৫০০ mg/L, PCC ≤ ২০০০ mg/L), সালফেট ও TDS পরীক্ষা করে।',
    },
    sampling: {
      frequency: {
        en: 'Once at project mobilization per water source (deep tubewell / municipal WASA / pond) and quarterly or across dry/monsoon season shifts.',
        bn: 'প্রকল্প শুরুর সময় প্রতিটি পানির উৎসের জন্য ১ বার এবং প্রতি ৩ মাসে বা মৌসুম পরিবর্তনে।',
      },
      quantity: {
        en: '2 Liters collected in a clean, thrice-rinsed plastic bottle after pumping source continuously for 10 minutes.',
        bn: 'পাম্প ১০ মিনিট চালিয়ে ওই পানি দিয়ে বোতল ৩ বার ধুয়ে সংগৃহীত ২ লিটার পানি।',
      },
      lotSize: {
        en: 'Per water supply source.',
        bn: 'প্রতিটি পানির উৎস।',
      },
    },
    apparatus: [
      {
        item: { en: 'Calibrated Digital pH Meter & TDS/Conductivity Meter', bn: 'ক্যালিব্রেটেড ডিজিটাল pH মিটার ও TDS মিটার' },
        spec: 'pH ±0.05 (range 0–14), TDS 0–5,000 mg/L (ppm)',
      },
      {
        item: { en: 'Silver Nitrate (AgNO₃) Chloride Titration Kit & Sulfate Turbidimeter', bn: 'ক্লোরাইড (Cl⁻) টাইট্রেশন কিট ও সালফেট (SO₄²⁻) টেস্টার' },
        spec: 'mg/L (ppm) accuracy',
      },
    ],
    procedure: [
      {
        en: 'Flush deep-tubewell or supply tap for 10 min, rinse clean sample bottle 3× with source water, and fill 2 L completely to the cap.',
        bn: 'পাম্প/কল ১০ মিনিট চালিয়ে পরিষ্কার বোতল ওই পানিতে ৩ বার ধুয়ে ২ লিটার নমুনা ভরুন।',
      },
      {
        en: 'Dip calibrated pH probe and TDS meter into agitated water at 25°C; wait 30 seconds for stable readings.',
        bn: 'ক্যালিব্রেটেড pH ও TDS মিটার ডুবিয়ে ৩০ সেকেন্ড পর স্থির রিডিং নোট করুন।',
      },
      {
        en: 'Determine Chloride (Cl⁻ mg/L) by titration/ion chromatography and Sulfate (SO₄²⁻ mg/L) against BNBC-2020/IS 456 limits: pH 6.0–8.5, Cl⁻ ≤ 500 mg/L (RCC) / ≤ 2000 mg/L (PCC), SO₄²⁻ ≤ 400 mg/L, TDS ≤ 2000 mg/L.',
        bn: 'ক্লোরাইড (Cl⁻) ও সালফেট (SO₄²⁻) মাত্রা (mg/L) নির্ণয় করে RCC (Cl⁻ ≤ ৫০০ mg/L) বা PCC (≤ ২০০০ mg/L) সীমার সাথে যাচাই করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Visual clarity NEVER guarantees safe water—crystal-clear coastal shallow tubewells in Khulna, Barishal, or Chattogram frequently carry 1,500+ mg/L Chloride!',
          bn: 'দেখতে স্বচ্ছ মানেই নিরাপদ পানি নয়—উপকূলীয় অঞ্চলের পরিষ্কার পানিতেও ১,৫০০+ mg/L ক্লোরাইড থাকে!',
        },
      ],
      contractorTricks: [
        {
          en: '"WASA Water for Mixing, Saline Sump/Pond Water for Curing": Contractors sometimes batch concrete with good water yet pump brackish shallow-well/pond water for 14-day slab curing—driving chlorides deep into young porous cover concrete!',
          bn: 'মিক্সিংয়ে ভালো পানি দিয়ে কিউরিংয়ে নোনা পুকুর/গর্তের পানি দেয়া: কাঁচা কংক্রিটে লবণাক্ত পানি দিয়ে কিউরিং করলে তা ভেতরে ঢুকে ২–৩ বছরেই রডে মরিচা ধরিয়ে দেয়।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'BNBC-2020 / IS 456 Concrete Mixing & Curing Water Chemical Limits', bn: 'কংক্রিট পানির রাসায়নিক সীমা (BNBC / IS 456)' },
          equation: 'pH: 6.0–8.5  |  Cl⁻ ≤ 500 mg/L (RCC) / ≤ 2000 mg/L (PCC)  |  SO₄²⁻ ≤ 400 mg/L  |  TDS ≤ 2000 mg/L',
          variables: [
            { en: 'Cl⁻ = Dissolved Chloride ion concentration (mg/L ≡ ppm)', bn: 'Cl⁻ = দ্রবীভূত ক্লোরাইড মাত্রা (mg/L বা ppm)' },
            { en: 'SO₄²⁻ = Sulfate ion concentration (mg/L); TDS = Total Dissolved Solids (mg/L)', bn: 'SO₄²⁻ = সালফেট ও TDS = মোট দ্রবীভূত কঠিন পদার্থ (mg/L)' },
          ],
          unitNote: 'Prestressed / Post-Tensioned Concrete requires stricter Chloride ≤ 250–500 mg/L; 1 mg/L ≡ 1 ppm.',
        },
      ],
      workedExample: {
        en: 'RCC Site Tubewell: pH = 7.1 (6.0–8.5), TDS = 640 mg/L (≤ 2000), Chloride = 185 mg/L (≤ 500 RCC), Sulfate = 95 mg/L (≤ 400) → PASS for RCC Mixing & Curing.',
        bn: 'সাইটের নলকূপে pH = ৭.১, TDS = ৬৪০ mg/L (≤ ২০০০), ক্লোরাইড = ১৮৫ mg/L (≤ ৫০০ RCC) ও সালফেট = ৯৫ mg/L (≤ ৪০০) → আরসিসি ঢালাই ও কিউরিংয়ের জন্য পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'pH 6.0–8.5, Cl⁻ ≤ 500 (RCC) / ≤ 2000 (PCC), SO₄ ≤ 400 & TDS ≤ 2000 mg/L', codeLimit: 'BNBC-2020 / IS 456', interpretation: { en: 'Safe water approved for concrete batching, mortar mixing, and structural curing.', bn: 'আরসিসি/পিসিসি ঢালাই, মর্টার ও কিউরিংয়ের জন্য সম্পূর্ণ নিরাপদ পানি।' } },
      { tier: 'WARNING', rangeLabel: 'TDS 2001–3000 mg/L OR pH 5.5–5.9 / 8.6–9.0 OR Cl⁻ near 500–800 (RCC)', codeLimit: 'ASTM C1602 Mortar Cube Check', interpretation: { en: 'Borderline chemistry; confirm 7-day & 28-day comparative mortar strength ≥ 90% of distilled-water control before RCC use.', bn: 'সীমান্তবর্তী মান—ডিস্টিল্ড পানির সাথে তুলনামূলক মর্টার কিউব টেস্টে ≥৯০% শক্তি ছাড়া আরসিসিতে ব্যবহার নিষেধ।' } },
      { tier: 'FAIL', rangeLabel: 'Cl⁻ > Limit (>500 RCC / >2000 PCC) OR SO₄ > 400 mg/L OR pH < 5.5', codeLimit: 'REJECT WATER SOURCE', interpretation: { en: 'Corrosive chloride/sulfate water causing rapid rebar rust & concrete spalling; switch to municipal WASA or rainwater storage.', bn: 'রডে মরিচা ও সালফেট ক্ষয়ের তীব্র ঝুঁকি—এই পানির উৎস বাতিল করে ওয়াসা/বৃষ্টির পানি ব্যবহার করুন।' } },
    ],
    remedialActions: [
      { en: 'In coastal/saline belts, harvest monsoon roof water into tanks or haul potable WASA tankers strictly for RCC casting and curing.', bn: 'উপকূলীয় এলাকায় বৃষ্টির পানি সংরক্ষণ অথবা ওয়াসার ট্যাংকার পানি ব্যবহার করুন।' },
    ],
    calculatorInputs: [
      {
        key: 'concreteModeCode',
        label: { en: 'Concrete Structural Application', bn: 'কংক্রিটের ধরন' },
        unit: 'type',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Reinforced Concrete — RCC (Strict Cl⁻ ≤ 500 mg/L)', bn: 'আরসিসি রডযুক্ত ঢালাই (Cl⁻ ≤ ৫০০ mg/L)' } },
          { value: 2, label: { en: 'Plain Concrete — PCC / Mass (Cl⁻ ≤ 2000 mg/L)', bn: 'পিসিসি রডবিহীন ঢালাই (Cl⁻ ≤ ২০০০ mg/L)' } },
        ],
      },
      { key: 'waterPh', label: { en: 'Measured Water pH', bn: 'পানির পরিমাপকৃত pH' }, unit: 'pH', defaultValue: 7.1, min: 3.0, max: 12.0, step: 0.1 },
      { key: 'tdsPpm', label: { en: 'Total Dissolved Solids (TDS)', bn: 'টিডিএস (TDS)' }, unit: 'mg/L', defaultValue: 640, min: 10, max: 10000, step: 20 },
      { key: 'chloridePpm', label: { en: 'Chloride Concentration (Cl⁻)', bn: 'ক্লোরাইডের মাত্রা (Cl⁻)' }, unit: 'mg/L', defaultValue: 185, min: 0, max: 5000, step: 10 },
      { key: 'sulfatePpm', label: { en: 'Sulfate Concentration (SO₄²⁻)', bn: 'সালফেটের মাত্রা (SO₄²⁻)' }, unit: 'mg/L', defaultValue: 95, min: 0, max: 3000, step: 10 },
    ],
  },

  // 8.2 uPVC / CPVC / GI PIPELINE HYDROSTATIC PRESSURE TEST
  {
    id: 'wat-hydrostatic-pipe',
    domainId: 'water-plumbing',
    code: 'LAB-WAT-02',
    title: {
      en: 'uPVC / CPVC / GI Water Supply Hydrostatic Pressure Test (BNBC Part 8 / PWD)',
      bn: 'uPVC / CPVC / GI পানি সরবরাহ পাইপলাইনের হাইড্রোস্ট্যাটিক প্রেশার টেস্ট',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড প্লাম্বিং প্রেশার টেস্ট',
    governingCodes: ['BNBC-2020 Part 8 Ch. 6', 'PWD Plumbing Spec', 'IPC §312.5'],
    objective: {
      en: 'Exposes pinholes, unglued uPVC/CPVC solvent-cement joints, loose GI threads, or faulty PPR fusion welds BEFORE bathroom wall chases are plastered and tiled—pressurizing loops to max(1.5 × P_working, 10 bar / 150 psi) for 2 full hours with ≤ 0.2 bar allowable drop and zero weeping.',
      bn: 'বাথরুমের দেয়াল প্লাস্টার বা টাইলস লাগানোর আগেই পাইপলাইনের ছিদ্র, খারাপ সলভেন্ট জয়েন্ট বা থ্রেড লিক ধরে ফেলে। কাজের চাপের ১.৫ গুণ বা ন্যূনতম ১০ বার (১৫০ psi) চাপে ২ ঘণ্টা ধরে রেখে প্রেশার ড্রপ ≤ ০.২ বার ও ০ লিক নিশ্চিত করে।',
    },
    sampling: {
      frequency: {
        en: '100% of concealed hot/cold water supply loops (every bathroom, kitchen, riser & terrace ring) BEFORE plastering or tiling chases.',
        bn: 'প্লাস্টার ও টাইলস করার আগে ১০০% কনসিলড ও রাইজার পানি সরবরাহ লাইন।',
      },
      quantity: {
        en: 'Complete isolated floor/bathroom piping network capped cleanly with brass end-plugs.',
        bn: 'ব্রাস এন্ড-প্লাগ দিয়ে মুখ বন্ধ করা সম্পূর্ণ পাইপিং নেটওয়ার্ক।',
      },
      lotSize: {
        en: '1 apartment unit / bathroom plumbing loop.',
        bn: 'প্রতিটি ইউনিট / বাথরুম সার্কিট।',
      },
    },
    apparatus: [
      {
        item: { en: 'Hydraulic Pressure Test Pump + Glycerine-Filled Pressure Gauge', bn: 'হাইড্রোলিক প্রেশার টেস্ট পাম্প ও গ্লিসারিন-ফিল্ড গেজ' },
        spec: '0–20 bar (0–300 psi) dial with 0.1–0.2 bar resolution',
      },
      {
        item: { en: 'Air Bleed Valve & Brass End-Caps', bn: 'এয়ার ব্লিড ভালভ ও পিতলের এন্ড-প্লাগ' },
        spec: 'Zero weeping shut-off isolation valve',
      },
    ],
    procedure: [
      {
        en: 'Allow ≥ 24 hours cure after final uPVC/CPVC solvent-cement joint (≥ 1 hour after PPR heat-fusion) before filling water.',
        bn: 'সর্বশেষ uPVC/CPVC গাম দেয়ার কমপক্ষে ২৪ ঘণ্টা পর (PPR ওয়েল্ডিংয়ের ১ ঘণ্টা পর) পরীক্ষা শুরু করুন।',
      },
      {
        en: 'Fill pipe loop slowly with clean water while opening highest brass plugs until 100% of trapped air bubbles escape.',
        bn: 'সবচেয়ে উঁচু প্লাগ খুলে ধীরে ধীরে পানি ভরে ভেতরের সমস্ত বাতাস সম্পূর্ণ বের করে দিন।',
      },
      {
        en: 'Pump pressure steadily to P_test = max(1.5 × P_working, 10.0 bar / 150 psi) depending on pipe schedule/pressure rating.',
        bn: 'লাইন অপারেটিং চাপের ১.৫ গুণ বা ন্যূনতম ১০.০ বার (১৫০ psi) চাপে পাম্প করুন।',
      },
      {
        en: 'Isolate pump valve, hold continuously for 120 minutes (2 hours), inspect every elbow/tee/thread visually for weeping, and confirm ΔP ≤ 0.2 bar.',
        bn: 'ভালভ বন্ধ করে ঠিক ২ ঘণ্টা (১২০ মিনিট) ধরে রাখুন; প্রতিটি জয়েন্ট চোখ দিয়ে যাচাই করে প্রেশার ড্রপ ≤ ০.২ বার নিশ্চিত করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'NEVER test plastic uPVC/CPVC pipes with compressed air—burst plastic shrapnel causes severe injury!',
          bn: 'কখনোই বাতাসের চাপ (Compressed Air) দিয়ে প্লাস্টিক পাইপ টেস্ট করবেন না—বিস্ফোরণে মারাত্মক দুর্ঘটনা ঘটবে!',
        },
      ],
      contractorTricks: [
        {
          en: '"Testing Only to 4 Bar for 15 Minutes or Plastering Un-tested Loops": Low pressure for 15 minutes fails to open hairline glue gaps that leak behind bathroom tiles months later—causing permanent dampness.',
          bn: 'মাত্র ৪ বার চাপে ১৫ মিনিট টেস্ট বা টেস্ট ছাড়াই প্লাস্টার: কম চাপে অল্প সময় টেস্ট করলে জয়েন্টের চুল-ছিদ্র ধরা পড়ে না এবং কয়েক মাস পর বাথরুমের দেয়াল ড্যাম্প হয়ে যায়।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'BNBC Part 8 / PWD Hydrostatic Test Pressure & Allowable Drop', bn: 'হাইড্রোস্ট্যাটিক টেস্ট প্রেশার ও ড্রপ সূত্র' },
          equation: 'P_req = max(1.5 × P_working, 10.0 bar [150 psi])  |  ΔP = P_start - P_end ≤ 0.20 bar  (Hold ≥ 120 min)',
          variables: [
            { en: 'P_working = Expected pump+static operating pressure (bar)', bn: 'P_working = লাইনের স্বাভাবিক কার্যচাপ (bar)' },
            { en: 'P_start, P_end = Initial and 2-hour final gauge pressure (bar; 1 bar ≈ 14.504 psi)', bn: 'P_start, P_end = শুরু ও ২ ঘণ্টা পরের গেজ প্রেশার (bar)' },
          ],
          unitNote: 'BNBC Part 8 / PWD Standard: Min 10 bar (150 psi) for 2 hours; ΔP ≤ 0.20 bar and 0 weeping joints.',
        },
      ],
      workedExample: {
        en: 'P_working = 5.0 bar → P_req = max(7.5, 10.0) = 10.0 bar (145–150 psi). Pumped to P_start = 10.5 bar; after 120 min P_end = 10.4 bar → ΔP = 0.10 bar (≤ 0.20 bar), 0 weeping joints → PASS.',
        bn: 'কার্যচাপ ৫.০ bar হলে ন্যূনতম টেস্ট প্রেশার = ১০.০ bar। ১০.৫ bar চাপ দিয়ে ১২০ মিনিট পর ১০.৪ bar থাকলে ΔP = ০.১০ bar (≤ ০.২০) ও লিক ০টি → পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'P_start ≥ Req (≥10 bar), Hold ≥ 120m, ΔP ≤ 0.20 bar & 0 Weeping Joints', codeLimit: 'BNBC Part 8 / PWD', interpretation: { en: 'Zero-leakage watertight plumbing verified; clear wall chases for plastering & tiling.', bn: 'পাইপলাইন শতভাগ লিকমুক্ত—প্লাস্টার ও টাইলস কাজের অনুমোদন দিন।' } },
      { tier: 'WARNING', rangeLabel: 'ΔP 0.21–0.40 bar OR Hold 60–119 min with 0 visible joint drips', codeLimit: 'Air Bleed & Full 2h Re-Test', interpretation: { en: 'Drop may stem from trapped air or temperature dip; bleed air and hold full 120 min.', bn: 'দৃশ্যমান লিক ছাড়া সামান্য ড্রপ হলে ভেতরের বাতাস বের করে পূর্ণ ২ ঘণ্টা পুনরায় পরীক্ষা করুন।' } },
      { tier: 'FAIL', rangeLabel: 'ΔP > 0.40 bar OR Any Joint Weeping OR P_start < Required Test Pressure', codeLimit: 'RE-WELD / REPLACE JOINT', interpretation: { en: 'Active pinhole or faulty joint; depressurize, replace defective fitting, cure 24h & re-test.', bn: 'জয়েন্টে লিক আছে বা চাপ কম—ত্রুটিপূর্ণ অংশ কেটে বদলে ২৪ ঘণ্টা পর পুনরায় প্রেশার টেস্ট করুন।' } },
    ],
    remedialActions: [
      { en: 'Maintain 3–4 bar light pressure inside concealed pipes while tile masons work so any accidental drill/nail hit sprays immediately.', bn: 'টাইলস বা স্যানিটারি ফিটিং লাগানোর সময় লাইনে ৩–৪ বার প্রেশার রেখে দিন যাতে ড্রিল/পেরেকের ছিদ্র সাথে সাথে ধরা পড়ে।' },
    ],
    calculatorInputs: [
      { key: 'workingPressureBar', label: { en: 'System Working Pressure (P_working)', bn: 'লাইন অপারেটিং প্রেশার (P_working)' }, unit: 'bar', defaultValue: 5.0, min: 1.0, max: 12.0, step: 0.5 },
      { key: 'startPressureBar', label: { en: 'Initial Test Pressure Applied (P_start)', bn: 'শুরুর টেস্ট প্রেশার (P_start)' }, unit: 'bar', defaultValue: 10.5, min: 1.0, max: 25.0, step: 0.2 },
      { key: 'endPressureBar', label: { en: 'Final Pressure After 2h Hold (P_end)', bn: 'সময় শেষে চূড়ান্ত প্রেশার (P_end)' }, unit: 'bar', defaultValue: 10.4, min: 0.0, max: 25.0, step: 0.1 },
      { key: 'holdMinutes', label: { en: 'Continuous Pressure Hold Duration', bn: 'প্রেশার ধরে রাখার সময়' }, unit: 'min', defaultValue: 120, min: 15, max: 1440, step: 15 },
      { key: 'leakingJointsCount', label: { en: 'Visible Weeping / Dripping Joints', bn: 'চোখে দেখা লিক করা জয়েন্ট' }, unit: 'nos', defaultValue: 0, min: 0, max: 20, step: 1 },
    ],
  },

  // 8.3 SANITARY DRAINAGE PIPE SLOPE, WATER HEAD & BALL PASSAGE TEST
  {
    id: 'wat-sanitary-slope-ball',
    domainId: 'water-plumbing',
    code: 'LAB-WAT-03',
    title: {
      en: 'Sanitary Drainage Pipe Self-Cleansing Slope, 1.5m Water Head & Ball Test',
      bn: 'স্যুয়ারেজ/ড্রেনেজ পাইপের ঢাল (Slope), ১.৫ মি. ওয়াটার হেড ও বল পাসিং পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড ড্রেনেজ স্লোপ ও লিক পরীক্ষা',
    governingCodes: ['BNBC-2020 Part 8 Ch. 7', 'PWD Sanitary Spec', 'IS 1742 / BS EN 1610'],
    objective: {
      en: 'Prevents chronic sewage blockages and foul trench seepage by verifying self-cleansing hydraulic slope (1:60 to 1:80 for 100 mm / 4" pipe; 1:100 to 1:120 for 150 mm / 6" pipe), joint watertightness under a 1.5 m standing water head, and smooth bore unobstructed alignment using a rolling Ball Test.',
      bn: 'টয়লেট ও সুয়ারেজ পাইপে ময়লা জমে ব্লক হওয়া এবং মাটির নিচে দুর্গন্ধযুক্ত পানি চুঁইয়ে পড়া রোধ করতে পাইপের সঠিক ঢাল (১০০ মিমি: ১:৬০–১:৮০; ১৫০ মিমি: ১:১০০–১:১২০), ১.৫ মিটার পানির চাপে লিক না থাকা ও ভেতর দিয়ে নির্বিঘ্নে বল গড়িয়ে যাওয়া পরীক্ষা করে।',
    },
    sampling: {
      frequency: {
        en: '100% of underground/suspended sanitary sewer runs between inspection chambers/manholes BEFORE trench backfilling or encasing in lean concrete.',
        bn: 'মাটি ভরাট বা সিসি ঢালাইয়ের আগে প্রতি ২টি ইন্সপেকশন পিট/ম্যানহোলের মধ্যবর্তী ১০০% সুয়ারেজ পাইপলাইন।',
      },
      quantity: {
        en: 'Full invert-to-invert pipe section between upstream and downstream manholes.',
        bn: 'দুই ম্যানহোলের মধ্যবর্তী সম্পূর্ণ পাইপ সেগমেন্ট।',
      },
      lotSize: {
        en: '1 manhole-to-manhole sewer bay.',
        bn: '১টি ম্যানহোল থেকে পরবর্তী ম্যানহোল লাইন।',
      },
    },
    apparatus: [
      {
        item: { en: 'Auto-Level / Spirit Level, Staff & Rubber Expanding Drain Plugs', bn: 'অটো-লেভেল / স্পিরিট লেভেল ও রাবার ড্রেন প্লাগ' },
        spec: '±2 mm invert elevation accuracy',
      },
      {
        item: { en: '1.5 m Vertical Standpipe Bend + 75 mm / 125 mm Smooth Test Ball', bn: '১.৫ মি. খাড়া স্ট্যান্ডপাইপ ও মসৃণ টেস্ট বল' },
        spec: 'Ball Ø = Pipe ID minus 20–25 mm (e.g. 75 mm ball for 100 mm pipe)',
      },
    ],
    procedure: [
      {
        en: 'Slope Verification: Measure upstream and downstream invert elevations with Auto-Level across exact horizontal run length L_m; compute gradient 1 : N = (L_m × 1000) / ΔIL_mm and verify 100 mm (4") pipes fall within 1:60–1:80 and 150 mm (6") pipes within 1:100–1:120.',
        bn: 'ঢাল (Slope) পরীক্ষা: অটো-লেভেলে দুই প্রান্তের ইনভার্ট লেভেল মেপে মোট পার্থক্য (ΔIL) থেকে ১:N ঢাল বের করুন (৪" পাইপে ১:৬০–১:৮০ এবং ৬" পাইপে ১:১০০–১:১২০)।',
      },
      {
        en: '1.5m Water Head Test: Seal the lower manhole outlet with an expanding rubber plug, attach a 1.5 m vertical bend/riser at the upper end, fill completely with water, wait 30 min for pipe absorption, top up to 1.5 m mark, and hold 30–60 minutes verifying zero joint weeping and negligible drop (≤ 5–10 mm).',
        bn: '১.৫ মি. ওয়াটার হেড পরীক্ষা: নিচের মুখে প্লাগ এঁটে ওপরের মুখে ১.৫ মিটার উঁচু খাড়া পাইপ লাগিয়ে পানি ভরুন; ৩০–৬০ মিনিট রেখে সব জয়েন্ট শুকনো আছে ও পানির স্তর নামছে না তা দেখুন।',
      },
      {
        en: 'Ball & Mirror/Torch Alignment Test: Drain water and roll a smooth 75 mm (for 100 mm) or 125 mm (for 150 mm) rubber/hardwood ball from upper chamber—it must roll cleanly out the lower end without catching on mortar burrs or sagging bellies.',
        bn: 'বল টেস্ট: পানি ছেড়ে দিয়ে ওপরের দিক থেকে মসৃণ ৭৫ বা ১২৫ মিমি বল গড়িয়ে দিন—ভেতরে মর্টার জমে না থাকলে বলটি নির্বিঘ্নে নিচে বেরিয়ে আসবে।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Support pipe barrels uniformly on compacted sand/concrete cradles BEFORE backfilling; unsupported socket joints snap or belly downward under soil weight.',
          bn: 'মাটি চাপা দেয়ার আগে পাইপের নিচে বালি বা সিসি বেড দিন—না হলে মাটির চাপে পাইপ মাঝখানে ঝুলে গিয়ে পানি আটকে যাবে।',
        },
      ],
      contractorTricks: [
        {
          en: '"Steep Over-Slope (>1:40) or Flat/Back-Fall Belly": Laying a 100 mm pipe TOO steep (> 1:30) lets water rush ahead leaving solid waste stranded dry; laying flatter than 1:80 causes chronic silt blockage. Mortar protruding inside sockets traps paper and sewage.',
          bn: 'অতি খাড়া (>১:৩০) বা উল্টো ঢাল: পাইপ বেশি খাড়া করলে পানি চলে যায় কিন্তু কঠিন ময়লা আটকে থাকে; আর ১:৮০-এর চেয়ে সমতল হলে ময়লা জমে জ্যাম হয়—এবং জয়েন্টের ভেতরে বাড়তি গাম/সিমেন্ট বল টেস্টে ধরা পড়ে।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Pipe Gradient Ratio (1 : N) & Minimum Drop Calculation', bn: 'ড্রেনেজ পাইপ ঢাল (১:N) ও প্রয়োজনীয় ড্রপ সূত্র' },
          equation: 'Gradient = 1 : N  where  N = (Run_Length_m × 1000) / ΔIL_mm  |  Drop_mm/m = 1000 / N',
          variables: [
            { en: 'ΔIL_mm = Upstream Invert Level minus Downstream Invert Level (mm)', bn: 'ΔIL_mm = উঁচু প্রান্ত ও নিচু প্রান্তের ইনভার্ট লেভেলের পার্থক্য (মিমি)' },
            { en: '100 mm (4") Self-Cleansing Band: 1:60 (16.7 mm/m) to 1:80 (12.5 mm/m)', bn: '১০০ মিমি (৪") আদর্শ ঢাল: ১:৬০ থেকে ১:৮০ (প্রতি মিটারে ১২.৫–১৬.৭ মিমি)' },
            { en: '150 mm (6") Self-Cleansing Band: 1:100 (10.0 mm/m) to 1:120 (8.3 mm/m)', bn: '১৫০ মিমি (৬") আদর্শ ঢাল: ১:১০০ থেকে ১:১২০ (প্রতি মিটারে ৮.৩–১০.০ মিমি)' },
          ],
          unitNote: '1.5 m (1,500 mm) standing water head drop ≤ 10 mm over 30–60 min; Ball must roll cleanly end-to-end.',
        },
      ],
      workedExample: {
        en: '100 mm (4") sewer run L = 12.0 m, invert drop ΔIL = 180 mm → Gradient = 1 : (12000/180) = 1 : 66.7 (15.0 mm/m, cleanly inside 1:60–1:80); 1.5m water head drop = 0 mm; Ball passed freely → PASS.',
        bn: '১০০ মিমি (৪") ১২ মি. পাইপে লেভেল ড্রপ ১৮০ মিমি হলে ঢাল = ১ : ৬৬.৭ (প্রতি মি. ১৫ মিমি, আদর্শ ১:৬০–১:৮০ এর মধ্যে); ১.৫ মি. ওয়াটার হেডে ড্রপ ০ মিমি ও বল পাস → অনুমোদিত।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Slope Within Self-Cleansing Band, 1.5m Head Drop ≤ 10mm & Ball Free', codeLimit: 'BNBC Part 8 / PWD', interpretation: { en: 'Self-cleansing velocity (≥ 0.75 m/s) & watertight sockets verified; clear trench for backfilling.', bn: 'পাইপের ঢাল, জয়েন্ট ও ভেতরের মসৃণতা সঠিক—মাটি/বালি ভরাটের অনুমতি দিন।' } },
      { tier: 'WARNING', rangeLabel: 'Slope slightly steep (e.g. 1:45 for 4") OR Minor head drop 11–20 mm', codeLimit: 'Inspect Pipe Joints / Bedding', interpretation: { en: 'Check rubber plug seal, tighten sockets, or verify slope bedding before concrete haunching.', bn: 'রাবার প্লাগ বা জয়েন্ট পুনরায় চেক করুন এবং বেশি খাড়া অংশ সংশোধন করুন।' } },
      { tier: 'FAIL', rangeLabel: 'Flatter than Min Slope (e.g. >1:80 on 4" / >1:120 on 6"), Back-Fall, Head Drop >20mm or Ball Jam', codeLimit: 'RE-LAY & CLEAR OBSTRUCTION', interpretation: { en: 'Sewer will clog or leak raw sewage into soil; excavate, re-grade bedding, clear burr, and re-test.', bn: 'ময়লা জমে জ্যাম হবে বা পানির লিক রয়েছে—পাইপ তুলে সঠিক ঢাল ও জয়েন্ট ঠিক করে পুনরায় পরীক্ষা করুন।' } },
    ],
    remedialActions: [
      { en: 'Never encase sanitary pipes in concrete until both 1.5 m water-head and ball-passage sign-offs are recorded.', bn: '১.৫ মি. ওয়াটার হেড এবং বল টেস্ট পাস না হওয়া পর্যন্ত পাইপের চারপাশে কংক্রিট বা মাটি দেবেন না।' },
    ],
    calculatorInputs: [
      {
        key: 'pipeDiaCode',
        label: { en: 'Sanitary Pipe Nominal Diameter', bn: 'স্যুয়ারেজ পাইপের ব্যাস' },
        unit: 'dia',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '100 mm (4" Pipe — Self-Cleansing Slope 1:60 to 1:80)', bn: '১০০ মিমি (৪" পাইপ — ঢাল ১:৬০ থেকে ১:৮০)' } },
          { value: 2, label: { en: '150 mm (6" Pipe — Self-Cleansing Slope 1:100 to 1:120)', bn: '১৫০ মিমি (৬" পাইপ — ঢাল ১:১০০ থেকে ১:১২০)' } },
        ],
      },
      { key: 'runLengthM', label: { en: 'Manhole-to-Manhole Pipe Length (L)', bn: 'পাইপ লাইনের মোট দৈর্ঘ্য (L)' }, unit: 'm', defaultValue: 12.0, min: 1.5, max: 60, step: 0.5 },
      { key: 'invertDropMm', label: { en: 'Measured Invert Drop (ΔIL)', bn: 'দুই প্রান্তের লেভেল ড্রপ (ΔIL)' }, unit: 'mm', defaultValue: 180, min: -50, max: 1500, step: 5 },
      { key: 'waterHeadDropMm', label: { en: '1.5m Water Head Drop in 30–60 Min', bn: '১.৫ মি. ওয়াটার হেড ড্রপ' }, unit: 'mm', defaultValue: 0, min: 0, max: 300, step: 1 },
      {
        key: 'ballPassStatus',
        label: { en: 'End-to-End Ball Passage Check', bn: 'বল পাসিং পরীক্ষা' },
        unit: 'check',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Passed Freely End-to-End (নির্বিঘ্নে বের হয়েছে)', bn: 'Passed Freely (নির্বিঘ্নে বের হয়েছে)' } },
          { value: 2, label: { en: 'Jammed / Obstructed Inside (ভেতরে আটকে গেছে)', bn: 'Jammed / Obstructed (আটকে গেছে)' } },
        ],
      },
    ],
  },

  // 8.4 ROOF SLAB, SUNKEN BATHROOM & UGWR/OHT WATER TANK 72-HOUR PONDING TEST
  {
    id: 'wat-roof-ponding',
    domainId: 'water-plumbing',
    code: 'LAB-WAT-04',
    title: {
      en: 'Roof, Sunken Bathroom & UGWR/OHT Water Tank 72-Hour Ponding Test',
      bn: 'ছাদ, বাথরুম স্ল্যাব ও UGWR/OHT পানির ট্যাংকের ৭২-ঘণ্টা ওয়াটার পন্ডিং পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড ওয়াটারপ্রুফিং ও ট্যাংক টেস্ট',
    governingCodes: ['ASTM D5957', 'BNBC-2020 Part 8', 'PWD Waterproofing & Tank Spec'],
    objective: {
      en: 'Certifies zero-leakage membrane/crystalline waterproofing across flat roofs, sunken bathroom slabs (50–75 mm water depth), and Underground/Overhead Water Reservoirs (UGWR/OHT filled to full operating overflow depth) over 72 continuous hours using an evaporation compensation bucket and dry soffit/outer-wall inspection.',
      bn: 'ছাদ বা বাথরুম স্ল্যাবে ৫০–৭৫ মিমি পানি জমিয়ে এবং মাটির নিচের/ছাদের ওপরের পানির ট্যাংকে (UGWR/OHT) পূর্ণ গভীরতায় পানি ভরে একটানা ৭২ ঘণ্টা রেখে রোদের বাষ্পীভবন বাদে কোনো লিক বা নিচের ছাদে/বাইরের দেয়ালে ড্যাম্প হচ্ছে কিনা তা প্রমাণ করে।',
    },
    sampling: {
      frequency: {
        en: '100% of flat roofs (before patent stone / lime terracing), sunken toilet slabs (before screed/tiles), balconies, and 100% of UGWR & OHT reservoir chambers.',
        bn: 'জলছাদ/প্যাটেন্ট স্টোন বা বাথরুম টাইলস করার আগে ১০০% ছাদ ও স্যাঙ্কেন স্ল্যাব এবং প্রতিটি UGWR ও OHT ট্যাংক।',
      },
      quantity: {
        en: 'Roof / Sunken Slab: 50–75 mm water depth; UGWR / OHT Tank: Full top-water operating depth held for 72 continuous hours.',
        bn: 'ছাদ/বাথরুম: ৫০–৭৫ মিমি গভীর পানি; পানির ট্যাংক: পূর্ণ ধারণক্ষমতা গভীরতায় ৭২ ঘণ্টা।',
      },
      lotSize: {
        en: '1 roof bay, bathroom sunken slab, or reservoir tank compartment.',
        bn: '১টি ছাদ সেগমেন্ট, বাথরুম বা পানির ট্যাংক চেম্বার।',
      },
    },
    apparatus: [
      {
        item: { en: 'Temporary Containment Bunds, Drain Plugs & Millimeter Scale', bn: 'অস্থায়ী ইট-মর্টার বাঁধ, ড্রেন প্লাগ ও মিলিমিটার স্কেল' },
        spec: '50–75 mm roof marker; full depth staff inside UGWR/OHT',
      },
      {
        item: { en: 'Open Reference Evaporation Compensation Bucket / Pan', bn: 'বাষ্পীভবন পরিমাপক রেফারেন্স বালতি/প্যান' },
        spec: 'Placed directly beside test slab in identical sun/wind exposure',
      },
    ],
    procedure: [
      {
        en: 'Clean slab/tank walls thoroughly, plug rain/floor outlets tightly, and build mortar containment bunds on open doorways/roof edges (for tanks, close inlet/outlet valves cleanly).',
        bn: 'ছাদ বা ট্যাংক পরিষ্কার করে ড্রেনের মুখ শক্তভাবে বন্ধ করুন এবং দরজার মুখে বাঁধ দিন (ট্যাংকের ক্ষেত্রে সব ভালভ বন্ধ করুন)।',
      },
      {
        en: 'Fill Roof/Bathroom to 50–75 mm minimum depth (or fill UGWR/OHT tank to full top operating level and allow concrete 24h initial saturation); set a water-filled Evaporation Compensation Bucket right alongside.',
        bn: 'ছাদ/বাথরুমে ৫০–৭৫ মিমি পানি ভরুন (অথবা UGWR/OHT ট্যাংক পূর্ণ গভীরতায় ভরে ২৪ ঘণ্টা স্যাচুরেশন দিন); পাশে বাষ্পীভবন মাপার বালতি রাখুন।',
      },
      {
        en: 'Record exact initial water levels H₀ in both test zone and control bucket; monitor continuously for 72 hours (min 48h).',
        bn: 'উভয় স্থানের শুরুর পানির উচ্চতা H₀ লিখে ঠিক ৭২ ঘণ্টা (ন্যূনতম ৪৮ ঘণ্টা) অপেক্ষা করুন।',
      },
      {
        en: 'At 72h, compute Evaporation-Adjusted Net Drop = ΔH_test - ΔH_evap and physically inspect the entire underside soffit ceiling (or tank exterior walls) with a bright torch for any damp patches, efflorescence, or drips.',
        bn: '৭২ ঘণ্টা পর বাষ্পীভবন বাদ দিয়ে নিট সিপেজ (ΔH_test - ΔH_evap) বের করুন এবং নিচের সিলিং বা ট্যাংকের বাইরের দেয়ালে কোনো ভেজা দাগ বা ফোঁটা আছে কিনা টর্চ দিয়ে পরীক্ষা করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Always place the control evaporation pan in the exact same sunlight/wind condition—Bangladesh summer sun evaporates 6–10 mm/day (20–30 mm over 72h)!',
          bn: 'গরমের দিনে রোদে প্রতিদিন ৬–১০ মিমি (৭২ ঘণ্টায় ২০–৩০ মিমি) পানি বাষ্প হয়ে উড়ে যায়—তাই রেফারেন্স বালতি ছাড়া লিক নির্ণয় করবেন না।',
        },
        {
          en: 'For UGWR tanks, perform ponding test BEFORE backfilling exterior soil around tank walls so groundwater cannot mask an outward leak.',
          bn: 'UGWR ট্যাংকের চারপাশের মাটি ভরাট করার আগেই পন্ডিং টেস্ট করুন—যাতে বাইরে থেকে চুঁইয়ে পড়া নিজ চোখে দেখা যায়।',
        },
      ],
      contractorTricks: [
        {
          en: '"Refilling Water Overnight or Testing Only 12 Hours": Night watchmen top up ponding water secretly before morning measurement, or crews drain after 12h—missing slow capillary leaks along bathroom WC/floor-trap sleeves that take 48–72 hours to wet the ceiling below.',
          bn: 'রাতে গোপনে পানি বাড়ানো বা মাত্র ১২ ঘণ্টায় পানি ছেড়ে দেয়া: বাথরুমের পাইপ স্লিভ দিয়ে চুঁইয়ে নিচের সিলিং ভিজতে ৪৮–৭২ ঘণ্টা সময় লাগে, তাই নিরবচ্ছিন্ন ৭২ ঘণ্টা ও তালাবদ্ধ স্কেল পর্যবেক্ষণ জরুরি।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Evaporation-Adjusted Net Seepage Drop (ASTM D5957)', bn: 'বাষ্পীভবন-সমন্বিত নিট সিপেজ ড্রপ সূত্র' },
          equation: 'Net_Seepage(mm) = ΔH_structure - ΔH_evap_pan  |  Limit ≤ 3.0 mm (72h) & 0 Soffit Damp Spots',
          variables: [
            { en: 'ΔH_structure = Total drop in roof/bathroom pond or UGWR/OHT water level (mm)', bn: 'ΔH_structure = ছাদ/ট্যাংকের পানির উচ্চতা যত মিমি কমেছে' },
            { en: 'ΔH_evap_pan = Natural sun/wind evaporation loss measured in control pan (mm)', bn: 'ΔH_evap_pan = রেফারেন্স বালতিতে বাষ্প হয়ে উড়ে যাওয়া পানি (মিমি)' },
          ],
          unitNote: 'Roof/Bathroom depth = 50–75 mm; UGWR/OHT = Full operating depth. Zero underside damp spots mandatory.',
        },
      ],
      workedExample: {
        en: 'Roof Slab (initial depth 65 mm) over 72h: Slab water dropped 15.0 mm, Evaporation Pan dropped 13.5 mm → Net Seepage = 15.0 - 13.5 = 1.5 mm (≤ 3.0 mm) & 0 soffit damp spots → PASS.',
        bn: 'ছাদে (৬৫ মিমি গভীরতা) ৭২ ঘণ্টায় পানি কমেছে ১৫.০ মিমি এবং বালতির বাষ্পীভবন ১৩.৫ মিমি হলে নিট সিপেজ = ১.৫ মিমি (≤ ৩.০ মিমি) ও নিচের সিলিং সম্পূর্ণ শুকনো → পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Depth ≥ 50mm (Roof), Hold ≥ 72h (48h min), Net Seepage ≤ 3.0mm & 0 Damp Spots', codeLimit: 'ASTM D5957 / BNBC / PWD', interpretation: { en: '100% watertight waterproofing / tank shell certified; approve screed, tiles, or backfill.', bn: 'ছাদ, বাথরুম বা ট্যাংক শতভাগ জলরোধী প্রমাণিত—টাইলস, জলছাদ বা মাটি ভরাটের অনুমতি দিন।' } },
      { tier: 'WARNING', rangeLabel: 'Hold 48–71h OR Depth < 50mm OR Net Seepage 3.1–5.0 mm with Dry Soffit', codeLimit: 'Verify Bund / Extend to 72h', interpretation: { en: 'Bund weeping or insufficient 72h hold; seal doorway bunds/plugs tightly and hold full 72h.', bn: 'অস্থায়ী বাঁধ/প্লাগ লিক বা ৭২ ঘণ্টা পূর্ণ হয়নি—বাঁধ ঠিক করে পূর্ণ ৭২ ঘণ্টা পর্যবেক্ষণ করুন।' } },
      { tier: 'FAIL', rangeLabel: 'Net Seepage > 5.0 mm OR ANY Underside Dampness/Drip OR Hold < 48h', codeLimit: 'PU/EPOXY GROUT & RE-POND 72H', interpretation: { en: 'Active leak around pipe sleeves, honeycombing, or torn membrane; drain, inject PU/cementitious grout, re-coat & re-pond 72h.', bn: 'নিচের ছাদে/বাইরের দেয়ালে ড্যাম্প বা ৫ মিমি+ লিক—গ্রাউটিং ও নতুন ওয়াটারপ্রুফিং কোট দিয়ে আবার ৭২ ঘণ্টা পরীক্ষা করুন।' } },
    ],
    remedialActions: [
      { en: 'Pack annular clearances around every bathroom trap/WC sleeve with non-shrink epoxy/polymer grout and cove corners (watt) before brushing elastomeric membrane.', bn: 'বাথরুমের সব পাইপ স্লিভের চারপাশ নন-শ্রিঙ্ক গ্রাউটে ভরে এবং কোনায় ফিল্লেট (Watt) বানিয়ে ওয়াটারপ্রুফিং কোট দিন।' },
    ],
    calculatorInputs: [
      {
        key: 'structureTypeCode',
        label: { en: 'Tested Water-Retaining Structure', bn: 'পরীক্ষিত স্থাপনার ধরন' },
        unit: 'zone',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Roof Slab / Sunken Bathroom (Target 50–75 mm Depth)', bn: 'ছাদ / বাথরুম স্ল্যাব (৫০–৭৫ মিমি গভীরতা)' } },
          { value: 2, label: { en: 'UGWR / OHT Water Tank (Full Operating Depth)', bn: 'UGWR / OHT পানির ট্যাংক (পূর্ণ গভীরতা)' } },
        ],
      },
      { key: 'pondingDepthMm', label: { en: 'Initial Ponding / Tank Water Depth', bn: 'শুরুর পানির গভীরতা' }, unit: 'mm', defaultValue: 65, min: 15, max: 4000, step: 5 },
      { key: 'slabDropMm', label: { en: 'Observed Structure Water Drop (ΔH_structure)', bn: 'স্থাপনায় পানি কমার মাপ' }, unit: 'mm', defaultValue: 15.0, min: 0, max: 150, step: 0.5 },
      { key: 'evapBucketDropMm', label: { en: 'Control Pan Evaporation Loss (ΔH_evap)', bn: 'রেফারেন্স বালতির বাষ্পীভবন' }, unit: 'mm', defaultValue: 13.5, min: 0, max: 100, step: 0.5 },
      { key: 'testHours', label: { en: 'Continuous Ponding Duration', bn: 'মোট পন্ডিং সময়' }, unit: 'hrs', defaultValue: 72, min: 6, max: 168, step: 6 },
      { key: 'dampSpotsCount', label: { en: 'Underside Soffit / Exterior Wall Damp Spots', bn: 'নিচের সিলিং / বাইরের দেয়ালে ভেজা দাগ' }, unit: 'nos', defaultValue: 0, min: 0, max: 50, step: 1 },
    ],
  },
];
