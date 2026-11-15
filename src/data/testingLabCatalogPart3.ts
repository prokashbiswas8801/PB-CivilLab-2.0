import { LabTestDefinition } from '../types/testingLab';
import { TESTING_LAB_TESTS_PART3_CAT6_7_8 } from './testingLabData_Part3';

export const TESTING_LAB_TESTS_PART3: LabTestDefinition[] = [
  ...TESTING_LAB_TESTS_PART3_CAT6_7_8,

  // =========================================================================
  // DOMAIN 9: SITE EXECUTION & STRUCTURAL QA/QC CHECKLISTS (সাইট চেকলিস্ট)
  // =========================================================================
  {
    id: 'qc-pre-pour-rcc',
    domainId: 'site-checklists',
    code: 'LAB-QCS-01',
    title: {
      en: 'Pre-Pour Formwork, Diagonal Squareness, Camber & Staging Audit',
      bn: 'ঢালাই পূর্ববর্তী সাটারিং, ডায়াগোনাল স্কয়ারেস, ক্যাম্বার ও প্রপস যাচাই',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড সাটারিং ও প্রি-পোর যাচাই',
    governingCodes: ['BNBC-2020 Part 6 §5', 'ACI 347R Formwork', 'PWD RCC Formwork Spec'],
    objective: {
      en: 'Prevents formwork blowout or catastrophic slab collapse during concreting and ensures rectangular room geometry (diagonal squareness ≤ 3 mm / 1/8"), vertical column plumb (≤ 6 mm per 3 m / 10 ft), and upward beam/slab camber (L/300–L/500) before pouring.',
      bn: 'কংক্রিট ঢালাইয়ের সময় দুর্বল সাটারিং/প্রপসের কারণে ছাদ ধসে পড়া রোধ করে এবং ঢালাইয়ের আগেই রুমের কোণার ডায়াগোনাল স্কয়ারেস (≤ ৩ মিমি / ১/৮"), কলামের ওলন-সোজা ভাব (≤ ৬ মিমি প্রতি ৩ মি./১০ ফুটে) ও বিম-স্ল্যাবের ক্যাম্বার (L/300–L/500) নিশ্চিত করে।',
    },
    sampling: {
      frequency: { en: '100% inspection of every structural bay, beam soffit, column box, and staging tower 4–12 hours BEFORE batching/pouring.', bn: 'প্রতিটি আরসিসি ছাদ, বিম ও কলাম ঢালাইয়ের ৪–১২ ঘণ্টা আগে শতভাগ সরেজমিন যাচাই।' },
      quantity: { en: 'Diagonal tape check on all rectangular rooms, plumb-bob check on every column, water/laser level on soffit camber, and prop grid measurement.', bn: 'প্রতিটি রুমের কর্ণ (ডায়াগোনাল), প্রতিটি কলামের ওলন (Plumb), ওয়াটার লেভেল ক্যাম্বার ও বাঁশ/স্টিল প্রপসের দূরত্ব পরিমাপ।' },
      lotSize: { en: '1 structural casting zone / floor level.', bn: '১টি সম্পূর্ণ ঢালাই ফ্লোর বা বে-অংশ।' },
    },
    apparatus: [
      { item: { en: '30m/5m Steel Tape (mm & Feet-Inch), 1 kg Plumb Bob & Water/Laser Level', bn: 'স্টিল টেপ (মিমি ও ফুট-ইঞ্চি), ভারী ওলন (Plumb Bob) ও ওয়াটার/লেজার লেভেল' }, spec: 'Diagonal Δ ≤ 3 mm (1/8"); Plumb ≤ 6 mm per 3 m (10\'-0")' },
      { item: { en: 'Foam/Masking Sealing Tape, Vernier/Pocket Scale & Approved IFC Framing Plan', bn: 'ফোম/সিলিং টেপ, পকেট স্কেল ও অনুমোদিত ফ্রেমিং প্ল্যান' }, spec: 'Zero grout-leakage joints' },
    ],
    procedure: [
      { en: 'Squareness Check (ডায়াগোনাল যাচাই): Measure room/panel length L and width W. Compute theoretical diagonal D_theo = √(L² + W²). Measure both physical diagonals D1 and D2 inside formwork sides—deviation |D1 - D2| and |D - D_theo| must be ≤ 3 mm (1/8").', bn: 'ডায়াগোনাল স্কয়ারেস যাচাই: রুম বা স্ল্যাব প্যানেলের দৈর্ঘ্য (L) ও প্রস্থ (W) মেপে তাত্ত্বিক কর্ণ D_theo = √(L² + W²) বের করুন। সাটারিংয়ের ভেতর দুই দিকের কর্ণ D1 ও D2 মাপুন—তফাত অবশ্যই ≤ ৩ মিমি (১/৮") হতে হবে।' },
      { en: 'Verticality & Plumb (কলাম-দেয়াল ওলন): Drop plumb bob down two adjacent faces of every column/shear-wall shutter box over clear floor height (~3.0 m / 10\'-0"). Allowable lateral out-of-plumb ≤ 6 mm.', bn: 'কলামের ওলন পরীক্ষা: প্রতিটি কলাম বা রিটেইনিং ওয়াল বক্সের দুই পাশে ওপর থেকে নিচ পর্যন্ত ওলন ফেলে সোজা আছে কিনা দেখুন (প্রতি ৩.০ মি./১০ ফুটে সর্বোচ্চ ৬ মিমি ত্রুটি)।' },
      { en: 'Camber & Level Verification (ক্যাম্বার ও ওয়াটার লেভেল): For beams/slabs spanning > 4.5 m (15 ft), raise mid-span soffit with upward camber between L/500 and L/300 to offset elastic/creep sag.', bn: 'বিম ও স্ল্যাবের ক্যাম্বার: স্প্যান ৪.৫ মি. (১৫ ফুট)-এর বেশি হলে মাঝখানে L/500 থেকে L/300 পরিমাণ ওপরে তুলে ক্যাম্বার সেট করুন যাতে ঢালাইয়ের পর ছাদ ঝুলে না পড়ে।' },
      { en: 'Staging, Props & Sealing Audit (প্রপস, ব্রেসিং ও সিলিং): Check vertical steel/bamboo props spaced ≤ 900 mm c/c resting over hard timber sole plates (no brick stacks!), mandatory mid-height horizontal/X-bracing, watertight foam-tape at panel seams, and zero sawdust/tie-wire inside kickers.', bn: 'প্রপস, ব্রেসিং ও টেপিং: প্রপসের দূরত্ব ≤ ৯০০ মিমি, নিচে শক্ত কাঠের প্লেট (আলগা ইটের ওপর নয়), মাঝ-উচ্চতায় আনুভূমিক/ক্রস ব্রেসিং, জয়েন্টে ফোম-টেপ এবং ভেতর সম্পূর্ণ ময়লামুক্ত আছে কিনা দেখুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'NEVER sign the Pour Card unless standby needle vibrators (2 working + 1 spare), slump cone, cylinder moulds, floodlights, and rain polythene sheets are physically verified beside the pour.', bn: 'সাইটে সচল ২+১টি ব্যাকআপ ভাইব্রেটর, স্লাম্প কোন, সিলিন্ডার মোল্ড ও বৃষ্টির পলিথিন না দেখা পর্যন্ত ঢালাইয়ের ছাড়পত্রে স্বাক্ষর করবেন না।' },
        { en: 'Re-check prop tightness and tie-rod wingnuts continuously during concrete placement with a designated formwork watchman stationed underneath.', bn: 'ঢালাই চলাকালীন সাটারিংয়ের নিচে অবশ্যই একজন কার্পেন্টার/প্রপস পর্যবেক্ষক রাখুন যাতে প্রপস নড়ে গেলে সাথে সাথে টাইট করা যায়।' },
      ],
      contractorTricks: [
        { en: 'Propping Over Brick Bat Stacks & Unsealed Gaps: Workers level short props by balancing them on loose stacked bricks that crush under wet concrete load, and omit foam tape so cement slurry bleeds out leaving honeycombed beam bottoms.', bn: 'ইটের স্তূপের ওপর প্রপস রাখা ও টেপিং না করা: খাটো প্রপস উঁচু করতে ২-৩টি ইট সাজিয়ে রাখা হয় যা ঢালাইয়ের ওজনে ভেঙে ছাদ ধসে যায়; আর জয়েন্টে টেপ না দিলে সিমেন্টের পানি বের হয়ে হানিকম্ব তৈরি হয়।' },
        { en: 'Using Dry Muddy Steel Shutters Without Release Oil: Skipping mould oil tears fresh concrete corners during deshuttering and contaminates beam soffits.', bn: 'ফর্মায় তেল/মোল্ড-অয়েল না দেয়া ও পুরনো জং-পরা শিট: ময়লাযুক্ত শুকনো লোহার শিটে তেল না দিলে সাটার খোলার সময় কলাম/বিমের কোণা ভেঙে যায়।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Diagonal Squareness & Weighted Pour Compliance Equations', bn: 'কর্ণ (Diagonal) স্কয়ারেস ও ওয়েটেড চেকলিস্ট সূত্র' },
          equation: 'D_theo = √(L² + W²)  |  Max_Sq_Err = max(|D1 - D2|, |D1 - D_theo|, |D2 - D_theo|) ≤ 3 mm (1/8")  |  Score_W = (Σ Wt_pass / Σ Wt_appl) × 100',
          variables: [
            { en: 'L, W = Room / panel clear length & width (m or ft); D1, D2 = Measured physical diagonals (mm)', bn: 'L, W = প্যানেলের দৈর্ঘ্য ও প্রস্থ (মি.); D1, D2 = ফিতা দিয়ে মাপা দুই কর্ণ (মিমি)' },
            { en: 'Camber = Upward mid-span pre-deflection between L/500 and L/300 for spans > 4.5 m', bn: 'Camber = ৪.৫ মি.+ স্প্যানের মাঝখানে L/500 হতে L/300 উঁচু ক্যাম্বার' },
          ],
          unitNote: 'BNBC / ACI 347R: Plumb ≤ 6 mm / 3 m; Prop spacing ≤ 900 mm; Any CRITICAL Fail = Automatic POUR HOLD.',
        },
      ],
      workedExample: {
        en: 'Room 4.00 m × 3.00 m → D_theo = √(4² + 3²) = 5.000 m = 5000 mm. D1 = 5001 mm, D2 = 4999 mm → Error = 2.0 mm (≤ 3.0 mm PASS). Plumb = 3.5 mm/3m, Camber on 5.2 m span = 12 mm (L/433), Props @ 800 mm, Weighted Score = 100% → POUR APPROVED.',
        bn: 'রুম ৪.০০ মি. × ৩.০০ মি. → D_theo = ৫০০০ মিমি। মাপা D1 = ৫০০১, D2 = ৪৯৯৯ মিমি → ত্রুটি ২ মিমি (≤ ৩ মিমি পাস)। কলাম ওলন ৩.৫ মিমি, ৫.২ মি. বিম ক্যাম্বার ১২ মিমি (L/433), প্রপস ৮০০ মিমি ও স্কোর ১০০% → ঢালাই অনুমোদিত।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: '0 Critical Fails · Weighted Score ≥ 90% · Δ_diag ≤ 3mm · Plumb ≤ 6mm', codeLimit: 'ACI 347R / BNBC-2020', interpretation: { en: 'True-square, rigid, sealed formwork & staging verified. Sign Pour Clearance Card.', bn: 'নিখুঁত স্কয়ারেস, মজবুত প্রপস ও সিলড সাটারিং—ঢালাইয়ের অনুমোদন পত্রে স্বাক্ষর করুন।' } },
      { tier: 'WARNING', rangeLabel: '0 Critical Fails · Weighted Score 75%–89% OR Minor Tolerance Borderline', codeLimit: 'Tighten Wedge / Clean Box', interpretation: { en: 'Fix minor non-critical deficiencies (foam tape patch, sawdust flush, camber adjustment) before concrete arrival.', bn: 'ছোটখাটো ত্রুটি (যেমন টেপিং বা কাঠের গুঁড়া পরিষ্কার) ঢালাইয়ের গাড়ি আসার আগেই সংশোধন করুন।' } },
      { tier: 'FAIL', rangeLabel: 'ANY Critical Fail OR Weighted Score < 75% OR Δ_diag > 5mm / Prop > 1000mm / Plumb > 8mm', codeLimit: 'STOP POUR · HOLD POINT', interpretation: { en: 'Structural formwork collapse or major geometry error risk! Re-square shutters, add props & X-bracing, and re-inspect before pouring.', bn: 'ছাদ ধস বা বড় ধরনের বাঁকা কাজের ঝুঁকি! সাটারিং ঠিক করা, প্রপস ও ব্রেসিং বাড়ানো ছাড়া ঢালাই সম্পূর্ণ বন্ধ রাখুন।' } },
    ],
    remedialActions: [
      { en: 'Always place props directly over continuous timber sole boards on compacted ground or lower-floor reshores spanning across two floors below.', bn: 'মাটি বা নতুন ছাদের ওপর সরাসরি প্রপস না বসিয়ে শক্ত কাঠের তক্তা ও নিচের ২ তলার রিশোরিং (Reshoring) বজায় রাখুন।' },
      { en: 'Insert compressed-air / flush-out trapdoors at column bottoms to blow out tie-wire clippings and timber chips before closing kicker.', bn: 'কলামের গোড়ায় পরিষ্কার করার ফোকর (Clean-out box) রেখে ভেতরের ময়লা সম্পূর্ণ ধুয়ে/বাতাস দিয়ে বের করুন।' },
    ],
    calculatorInputs: [
      { key: 'roomLenM', label: { en: 'Panel / Room Length (L)', bn: 'রুম/প্যানেলের দৈর্ঘ্য (L)' }, unit: 'm', defaultValue: 4.0, min: 0.5, max: 30, step: 0.05 },
      { key: 'roomWidM', label: { en: 'Panel / Room Width (W)', bn: 'রুম/প্যানেলের প্রস্থ (W)' }, unit: 'm', defaultValue: 3.0, min: 0.5, max: 30, step: 0.05 },
      { key: 'diag1Mm', label: { en: 'Measured Diagonal 1 (D₁)', bn: 'মাপা কর্ণ ১ (D₁)' }, unit: 'mm', defaultValue: 5001, min: 500, max: 45000, step: 1 },
      { key: 'diag2Mm', label: { en: 'Measured Diagonal 2 (D₂)', bn: 'মাপা কর্ণ ২ (D₂)' }, unit: 'mm', defaultValue: 4999, min: 500, max: 45000, step: 1 },
      { key: 'plumbErrPer3mMm', label: { en: 'Column Vertical Plumb Error (/3m)', bn: 'কলাম ওলন ত্রুটি (প্রতি ৩ মি.)' }, unit: 'mm', defaultValue: 3.5, min: 0, max: 30, step: 0.5 },
      { key: 'slabSpanM', label: { en: 'Max Clear Beam/Slab Span', bn: 'বিম/স্ল্যাবের সর্বোচ্চ স্প্যান' }, unit: 'm', defaultValue: 5.2, min: 1.0, max: 18, step: 0.1 },
      { key: 'providedCamberMm', label: { en: 'Provided Mid-Span Soffit Camber', bn: 'প্রদানকৃত মাঝখানের ক্যাম্বার' }, unit: 'mm', defaultValue: 12, min: 0, max: 60, step: 1 },
      { key: 'propSpacingMm', label: { en: 'Max Center-to-Center Prop Spacing', bn: 'প্রপস/খুঁটির সর্বোচ্চ দূরত্ব' }, unit: 'mm', defaultValue: 800, min: 400, max: 1800, step: 50 },
    ],
    checklistItems: [
      { id: 'pp-1', category: { en: 'Staging & Props', bn: 'প্রপস ও ব্রেসিং' }, item: { en: 'Vertical MS/bamboo props spaced ≤ 900 mm c/c, plumb vertical on firm timber sole plates with mid-height horizontal & diagonal X-bracing', bn: 'প্রপস ≤ ৯০০ মিমি দূরত্বে, শক্ত কাঠের প্লেটের ওপর খাড়া ও মাঝ-উচ্চতায় X-ব্রেসিং বাঁধা' }, codeRef: 'ACI 347R', critical: true, weight: 20 },
      { id: 'pp-2', category: { en: 'Geometry & Camber', bn: 'স্কয়ারেস ও ক্যাম্বার' }, item: { en: 'Panel diagonal squareness error ≤ 3 mm (1/8"), column verticality ≤ 6 mm/3m & beam/slab camber L/500–L/300 verified', bn: 'কর্ণ স্কয়ারেস ত্রুটি ≤ ৩ মিমি, কলাম ওলন ≤ ৬ মিমি/৩মি. এবং >৪.৫ মি. স্প্যানে ক্যাম্বার L/500–L/300 সঠিক' }, codeRef: 'BNBC / ACI', critical: true, weight: 20 },
      { id: 'pp-3', category: { en: 'Joints & Sealing', bn: 'জয়েন্ট টেপিং ও তেল' }, item: { en: 'Watertight foam/masking tape over all ply/steel seams; thin mould-release oil coat applied without touching rebar', bn: 'সাটারিংয়ের সকল ফাঁকায় ফোম/টেপ লাগানো এবং রডে না লাগিয়ে পাতলা ফর্মা-অয়েল ব্রাশ করা' }, codeRef: 'PWD §5', critical: false, weight: 10 },
      { id: 'pp-4', category: { en: 'Cleanliness', bn: 'ভেতরের পরিচ্ছন্নতা' }, item: { en: 'Column kickers flushed via cleanout holes; zero sawdust, tie-wire snips, cigarette butts, or standing mud inside forms', bn: 'কলামের গোড়ায় ফোকর দিয়ে সমস্ত কাঠের গুঁড়া, তারের টুকরা ও ময়লা পরিষ্কার করে সিল করা' }, codeRef: 'ACI 318', critical: true, weight: 15 },
      { id: 'pp-5', category: { en: 'MEP Conduits', bn: 'ইলেকট্রিক্যাল ও প্লাম্বিং' }, item: { en: 'Conduits, fan boxes & sanitary sleeves tied cleanly between top/bottom mats away from beam support shear zones', bn: 'ইলেকট্রিক্যাল পাইপ, ফ্যান বক্স ও প্লাম্বিং স্লিভ ক্রিটিক্যাল শিয়ার জোন এড়িয়ে বসানো' }, codeRef: 'BNBC §8', critical: false, weight: 15 },
      { id: 'pp-6', category: { en: 'Pour Equipment', bn: 'ঢালাই প্রস্তুতি' }, item: { en: 'Minimum 2 working + 1 spare needle vibrators, slump cone, 6+ cylinder moulds, floodlights & rain polythene physically staged', bn: 'সচল ২+১টি ব্যাকআপ ভাইব্রেটর, স্লাম্প কোন, সিলিন্ডার মোল্ড, লাইট ও বৃষ্টির পলিথিন প্রস্তুত' }, codeRef: 'ASTM C94', critical: true, weight: 20 },
    ],
  },
  {
    id: 'qc-rebar-seismic',
    domainId: 'site-checklists',
    code: 'LAB-QCS-02',
    title: {
      en: 'Pre-Pour Reinforcement, Clear Cover & BNBC-2020 Seismic Ductile Detailing',
      bn: 'প্রি-পোর রড বাঁধাই, ক্লিয়ার কাভার ব্লক ও BNBC সিসমিক ডিটেইলিং যাচাই',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড সিসমিক রিবার ও কাভার যাচাই',
    governingCodes: ['BNBC-2020 Part 6 §8.3 (IMRF/SMRF)', 'ACI 318-19 Ch. 18 & 25', 'PWD RCC Detailing'],
    objective: {
      en: 'Verifies corrosion-protecting clear cover blocks (75mm footing, 50mm tank, 40mm col/beam, 20mm slab), seismic column/beam lap splice zone & staggering, 135° seismic stirrup hooks, beam-column core confinement ties, and top-mat chair bars prior to casting.',
      bn: 'কংক্রিটের স্থায়িত্ব ও ভূমিকম্প প্রতিরোধের জন্য সঠিক পুরুত্বের মর্টার কাভার ব্লক (ফুটিং ৭৫, ট্যাংক ৫০, কলাম/বিম ৪০, ছাদ ২০ মিমি), কলাম/বিমের সঠিক ল্যাপিং জোন ও স্ট্যাগারিং, ১৩৫° সিসমিক রিং হুক, জয়েন্ট টাই এবং টপ-মেশ চেয়ার বার যাচাই করে।',
    },
    sampling: {
      frequency: { en: '100% rebar cage & cover inspection immediately prior to closing column boxes or pouring beams/slabs/footings.', bn: 'প্রতিটি ফুটিং, কলাম বক্স বন্ধ করার আগে এবং বিম-ছাদ ঢালাইয়ের পূর্বে শতভাগ রড যাচাই।' },
      quantity: { en: 'Check clear cover gauge on soffits & sides, lap positions vs L₀ confinement length, 135° hook angles & tails, joint ties, and chair spacing.', bn: 'তলা ও পাশের কাভার ব্লক, কলাম/বিমের ল্যাপিং জোন, ১৩৫° হুকের দৈর্ঘ্য ও জয়েন্টের রিং পরিমাপ।' },
      lotSize: { en: '1 RCC casting lot (Footings / Column Lift / Slab-Beam Floor).', bn: '১টি ঢালাই লট (ফুটিং / কলাম লিফট / বিম-স্ল্যাব)।' },
    },
    apparatus: [
      { item: { en: 'Vernier / Digital Calliper, Steel Measuring Tape & Protractor', bn: 'ভার্নিয়ার ক্যালিপার, স্টিল টেপ ও কোণ-মাপক (Protractor)' }, spec: 'Rebar dia, hook extension (≥ max(6db, 75mm)), cover mm' },
      { item: { en: 'Issued-For-Construction (IFC) Bar Bending Schedule & Structural Drawings', bn: 'অনুমোদিত বার-বেন্ডিং শিডিউল (BBS) ও স্ট্রাকচারাল ড্রয়িং' }, spec: 'BNBC-2020 Seismic Zone SMRF/IMRF compliant' },
    ],
    procedure: [
      { en: 'Clear Cover Block Check (ক্লিয়ার কাভার যাচাই): Footing/Pile Cap against soil = 75 mm (3"); Water Tank/Retaining Wall = 50 mm (2"); Column & Beam = 40 mm (1.5"); Slab & Stair Waist = 20 mm (3/4"). Blocks must be rich 1:2 mortar with embedded GI wire—NEVER broken brick chips!', bn: 'ক্লিয়ার কাভার ব্লক পরীক্ষা: ফুটিং/পাইল-ক্যাপ = ৭৫ মিমি (৩"), ওয়াটার ট্যাংক/রিটেইনিং ওয়াল = ৫০ মিমি (২"), কলাম/বিম = ৪০ মিমি (১.৫"), ছাদ/সিঁড়ি = ২০ মিমি (৩/৪")। অবশ্যই সিমেন্ট-বালির তৈরি শক্ত জিআই তারযুক্ত কাভার ব্লক হতে হবে—ইটের টুকরা নয়।' },
      { en: 'Column & Beam Lapping Zone Audit (সিসমিক ল্যাপিং জোন): Compute Column confinement length L₀ = max(column depth h_c, clear height H_n / 6, 450 mm) at TOP & BOTTOM ends. ALL column laps MUST be inside the middle-half zone (outside L₀), ≤ 50% bars lapped at one elevation, staggered ≥ 1.3×L_s, with close lap hoops (≤ min(100 mm, 6 d_b)). For beams: lap TOP bars ONLY at mid-span and BOTTOM bars ≥ 2d away from column face!', bn: 'সিসমিক ল্যাপিং জোন: কলামের ওপর ও নিচে L₀ = max(কলাম সাইজ, ক্লিয়ার হাইট/৬, ৪৫০ মিমি) অংশে কোনো ল্যাপিং দেয়া যাবে না—ল্যাপ কেবল মাঝের অর্ধেক অংশে (≤ ৫০% রড এক স্থানে, ≥ ১.৩ Ls স্ট্যাগার্ড ও রিং স্পেসিং ≤ min(১০০ মিমি, ৬db)) হবে। বিমে টপ রড মাঝ-স্প্যানে ও বটম রড কলাম ফেস থেকে ২d দূরে ল্যাপ হবে।' },
      { en: '135° Seismic Hooks & Core Joint Ties (১৩৫° হুক ও জয়েন্ট রিং): Stirrup/tie hooks must bend ≥ 135° into the confined concrete core with straight tail extension ≥ max(6 d_b, 75 mm / 3"). Transverse ties MUST continue uninterrupted inside the beam-column joint core.', bn: '১৩৫° হুক ও কলাম-বিম জয়েন্ট: সব রিং-এর হুক অবশ্যই ভেতরের দিকে ১৩৫° কোণে ≥ max(৬db, ৭৫ মিমি) বাঁকাতে হবে। বিম-কলাম জয়েন্টের ভেতরেও রিং অব্যাহত রাখতে হবে।' },
      { en: 'Top Mesh Chairs & Bar Diameter Check (চেয়ার বার ও রড সংখ্যা): Verify steel chair bars (≥ Ø12 mm spaced ≤ 1.0 m / 3\'-3" c/c) hold upper slab extra-top/cranked steel at full design effective depth.', bn: 'চেয়ার বার ও রডের মাপ: ছাদের টপ রড ও ক্র্যাংক রড ধরে রাখতে ≤ ১.০ মি. (৩\'-৩") পরপর কমপক্ষে ১২ মিমি রডের চেয়ার বসানো হয়েছে কিনা দেখুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'NEVER lap 100% of column main bars right above the floor slab kicker—that creates a brittle seismic hinge right where bending moment is highest.', bn: 'কলামের সব রড ছাদের ঠিক ওপরে (কিকারে) একসাথে ল্যাপ করবেন না—ভূমিকম্পের সময় ওই স্থানেই সবচেয়ে বেশি মোমেন্ট কাজ করে।' },
      ],
      contractorTricks: [
        { en: '90° Open Stirrup Hooks & Missing Joint Ties: Bar benders bend stirrups at 90° (easier to slip on) and omit hoops inside beam-column joints; during an earthquake concrete spalls off and column bars buckle out catastrophically.', bn: '৯০° খোলা হুক ও জয়েন্ট রিং গায়েব: মিস্ত্রিরা কাজ সহজ করতে ৯০° হুক দেয় এবং বিম-কলাম জয়েন্টের ভেতর রিং দেয় না—ভূমিকম্পে কংক্রিট ঝরে পড়ে রড খুলে যায়।' },
        { en: 'Walking Over Un-Chaired Slab Extra-Tops: Without Ø12mm chairs, workers trample top steel straight onto the bottom mesh, slashing slab negative moment capacity by > 60%!', bn: 'চেয়ার বার না দিয়ে টপ রড মাড়িয়ে ফেলা: চেয়ার না দিলে ঢালাইয়ের সময় শ্রমিকদের পায়ে টপ রড নিচে দেবে যায় এবং ক্যান্টিলিভার/বিম সাপোর্টে ছাদ ফেটে ঝুলে পড়ে।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'BNBC-2020 Seismic Confinement Zone (L₀), 135° Hook Tail & Cover Limits', bn: 'BNBC-2020 সিসমিক জোন (L₀), ১৩৫° হুক ও কাভার সূত্র' },
          equation: 'L₀ = max(h_col, H_clear / 6, 450 mm)  |  Hook_tail ≥ max(6·d_b, 75 mm) @ 135°  |  Lap_hoop_s ≤ min(100 mm, 6·d_b)',
          variables: [
            { en: 'h_col = Max column cross-section dimension (mm); H_clear = Clear floor height (mm)', bn: 'h_col = কলামের বড় বাহু (মিমি); H_clear = ক্লিয়ার উচ্চতা (মিমি)' },
            { en: 'Clear Cover: Footing 75mm, Water Tank 50mm, Beam/Col 40mm, Slab/Stair 20mm', bn: 'ক্লিয়ার কাভার: ফুটিং ৭৫, ট্যাংক ৫০, বিম/কলাম ৪০, ছাদ/সিঁড়ি ২০ মিমি' },
          ],
          unitNote: 'Column splice: Inside middle 50% only, ≤ 50% bars at any section, staggered ≥ 1.3 × Ls.',
        },
      ],
      workedExample: {
        en: 'Column 450×300 mm, Clear Height = 3000 mm, 16 mm main bars → Required L₀ = max(450, 3000/6, 450) = 500 mm (top & bottom). Required cover = 40 mm, 135° hook extension ≥ max(96, 75) = 96 mm (use 100 mm) or 75 mm for 10mm stirrups. Middle-half splice, 50% staggered → SEISMIC COMPLIANT.',
        bn: 'কলাম ৪৫০×৩০০ মিমি, উচ্চতা ৩০০০ মিমি → কনফাইনমেন্ট L₀ = ৫০০ মিমি (ওপর ও নিচে)। কাভার ৪০ মিমি, ১০ মিমি রিংয়ের ১৩৫° হুক ≥ ৭৫ মিমি (বাস্তবে ৮০ মিমি), মাঝখানে ৫০% স্ট্যাগার্ড ল্যাপ → সিসমিক কমপ্লায়েন্ট।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: '0 Critical Fails · Cover Exact · Middle-Half Splice · 135° Hook ≥ 75mm · Chairs ≤ 1.0m', codeLimit: 'BNBC §8.3 / ACI 318', interpretation: { en: 'Ductile seismic detailing & durability clear cover verified. Safe to close formwork and pour.', bn: 'সিসমিক রিং, ল্যাপিং ও ক্লিয়ার কাভার সম্পূর্ণ সঠিক—বক্স বন্ধ ও ঢালাইয়ের অনুমতি দিন।' } },
      { tier: 'WARNING', rangeLabel: '0 Critical Fails · Weighted Score 75%–89% OR Extra Chair/Spacer Needed', codeLimit: 'Add Spacers / Tie Wire', interpretation: { en: 'Add additional chair bars or side spacers and tie loose stirrups before pouring.', bn: 'বাড়তি চেয়ার বার ও সাইড কাভার ব্লক যোগ করে এবং আলগা তার বেঁধে ঢালাই করুন।' } },
      { tier: 'FAIL', rangeLabel: 'ANY Critical Fail OR Cover Deficit >3mm OR Wrong Lap Zone OR Missing 135° Hooks', codeLimit: 'HOLD POINT · RE-FIX REBAR', interpretation: { en: 'Critical seismic or durability defect! Relocate splices out of L₀ zone, install joint ties / 135° hooks & replace crushed brick blocks with proper mortar cover blocks.', bn: 'গুরুতর সিসমিক ও কাভার ত্রুটি! ভুল স্থানের ল্যাপিং, ৯০° হুক বা ইটের টুকরা কাভার অবিলম্বে অপসারণ করে ঠিক করুন।' } },
    ],
    remedialActions: [
      { en: 'Cast dedicated 1:2 cement-sand cover blocks on site with recessed GI tie wires cured for 7 days in water drums (20/25/40/50/75 mm sizes).', bn: 'সাইটেই ১:২ সিমেন্ট-বালির মর্টার দিয়ে জিআই তার-যুক্ত কাভার ব্লক বানিয়ে ৭ দিন পানিতে কিউরিং করে ব্যবহার করুন।' },
      { en: 'Use mechanical couplers or re-position lap bars if >50% splices land at the floor slab joint.', bn: 'কলামের গোড়ায় ৫০%-এর বেশি ল্যাপ জমে গেলে অবশ্যই মেকানিক্যাল কাপলার ব্যবহার করুন বা ডাউয়েল উচ্চতা সমন্বয় করুন।' },
    ],
    calculatorInputs: [
      {
        key: 'coverMemberCode',
        label: { en: 'Structural Element Type', bn: 'কাঠামোর অংশ (মেম্বার)' },
        unit: '',
        defaultValue: 3,
        options: [
          { value: 1, label: { en: 'Footing / Pile Cap vs Soil (Min 75 mm / 3")', bn: 'ফুটিং / পাইল-ক্যাপ (ন্যূনতম ৭৫ মিমি)' } },
          { value: 2, label: { en: 'UGWR / Retaining Wall / Soil Face (Min 50 mm / 2")', bn: 'ওয়াটার ট্যাংক / রিটেইনিং ওয়াল (ন্যূনতম ৫০ মিমি)' } },
          { value: 3, label: { en: 'RCC Column & Beam (Min 40 mm / 1.5")', bn: 'আরসিসি কলাম ও বিম (ন্যূনতম ৪০ মিমি)' } },
          { value: 4, label: { en: 'Floor Slab & Staircase Waist (Min 20 mm / 3/4")', bn: 'ফ্লোর স্ল্যাব ও সিঁড়ি (ন্যূনতম ২০ মিমি)' } },
        ],
      },
      { key: 'measuredCoverMm', label: { en: 'Measured Clear Cover Provided', bn: 'সরবরাহকৃত ক্লিয়ার কাভার' }, unit: 'mm', defaultValue: 40, min: 5, max: 120, step: 2 },
      { key: 'colDepthMm', label: { en: 'Column Depth (Max Side h_c)', bn: 'কলামের সর্বোচ্চ বাহু (h_c)' }, unit: 'mm', defaultValue: 450, min: 200, max: 1500, step: 25 },
      { key: 'colClearHeightMm', label: { en: 'Column Clear Height (H_n)', bn: 'কলামের ক্লিয়ার উচ্চতা (H_n)' }, unit: 'mm', defaultValue: 3000, min: 1500, max: 7000, step: 50 },
      { key: 'stirrupBarDiaMm', label: { en: 'Stirrup / Tie Bar Diameter', bn: 'রিং/টাই রডের ডায়া' }, unit: 'mm', defaultValue: 10, min: 6, max: 16, step: 2 },
      { key: 'hook135ExtensionMm', label: { en: 'Measured 135° Hook Tail Length', bn: '১৩৫° হুকের লম্বা অংশ (Tail)' }, unit: 'mm', defaultValue: 80, min: 20, max: 200, step: 5 },
      {
        key: 'lapZoneComplianceCode',
        label: { en: 'Splice Location & Staggering Check', bn: 'ল্যাপিংয়ের স্থান ও স্ট্যাগারিং' },
        unit: '',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Middle-Half Zone (≤50% Lapped, Staggered ≥1.3 Ls)', bn: 'মাঝের অর্ধেক অংশে (≤৫০%, স্ট্যাগার্ড)' } },
          { value: 2, label: { en: 'Inside L₀ Joint Zone / 100% Unstaggered (Non-Compliant)', bn: 'জয়েন্ট L₀ জোনে বা সব এক স্থানে ল্যাপ (অবৈধ)' } },
        ],
      },
      { key: 'chairBarSpacingMm', label: { en: 'Top Mesh Chair Bar Spacing (Max)', bn: 'টপ রডের চেয়ার বারের দূরত্ব' }, unit: 'mm', defaultValue: 950, min: 300, max: 2500, step: 50 },
    ],
    checklistItems: [
      { id: 'rs-1', category: { en: 'Clear Cover Blocks', bn: 'ক্লিয়ার কাভার ব্লক' }, item: { en: 'Dense 1:2 GI-wire mortar cover blocks (75mm footing, 50mm tank, 40mm col/beam, 20mm slab)—ZERO brick chips or plastic debris', bn: 'সঠিক পুরুত্বের ১:২ সিমেন্ট-বালি জিআই তারযুক্ত কাভার ব্লক (ইটের টুকরা সম্পূর্ণ নিষিদ্ধ)' }, codeRef: 'BNBC §8.1', critical: true, weight: 20 },
      { id: 'rs-2', category: { en: 'Seismic Lapping', bn: 'সিসমিক ল্যাপিং জোন' }, item: { en: 'Column bars lapped strictly in middle-half (outside L₀); beam top bars lapped mid-span & bottom bars ≥ 2d from column face; ≤ 50% lapped & staggered ≥ 1.3 Ls', bn: 'কলাম রডের ল্যাপ কেবল মাঝের অর্ধেক অংশে (≤৫০% স্ট্যাগার্ড) এবং বিমের টপ রড মাঝখানে ও বটম রড ২d দূরে' }, codeRef: 'BNBC §8.3.3', critical: true, weight: 25 },
      { id: 'rs-3', category: { en: '135° Hooks & Core', bn: '১৩৫° হুক ও জয়েন্ট রিং' }, item: { en: '100% stirrups & crossties bent at 135° with tail ≥ max(6db, 75mm); transverse ties continuous inside beam-column joint core', bn: 'সকল রিংয়ের ১৩৫° হুক (টেল ≥ max(৬db, ৭৫ মিমি)) এবং বিম-কলাম জয়েন্টের ভেতরেও রিং স্থাপিত' }, codeRef: 'ACI 318 §18', critical: true, weight: 25 },
      { id: 'rs-4', category: { en: 'Chair Bars & Bar Dia', bn: 'চেয়ার বার ও রডের মাপ' }, item: { en: 'Steel chairs (≥ Ø12mm @ ≤ 1.0 m c/c) support slab/cantilever top mesh; bar dia, spacing & lap hoop spacing (≤ min(100mm, 6db)) verified vs IFC', bn: 'টপ মেশের নিচে ১২ মিমি+ চেয়ার বার ≤ ১.০ মি. পরপর বসানো এবং রডের ডায়া/স্পেসিং IFC অনুযায়ী সঠিক' }, codeRef: 'BNBC / PWD', critical: true, weight: 20 },
      { id: 'rs-5', category: { en: 'Rebar Cleanliness', bn: 'মরিচা ও তেল মুক্ত রড' }, item: { en: 'Reinforcement free of loose flaking rust, grease, shutter release oil, dried mortar, or mud before concrete placement', bn: 'রডে কোনো আলগা মরিচা, গ্রিজ, ফর্মা-অয়েল বা শুকনো মর্টার লেগে নেই' }, codeRef: 'ACI 318 §26', critical: false, weight: 10 },
    ],
  },
  {
    id: 'qc-curing-deshuttering',
    domainId: 'site-checklists',
    code: 'LAB-QCS-03',
    title: {
      en: 'Post-Pour Wet Curing & De-Shuttering Minimum Stripping Time Verifier',
      bn: 'ঢালাই পরবর্তী কিউরিং ও সাটারিং খোলার ন্যূনতম সময় যাচাই (BNBC / PWD)',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড কিউরিং ও ডিশাটারিং যাচাই',
    governingCodes: ['BNBC-2020 Part 6 §5.11', 'PWD Stripping Schedule', 'IS 456 Cl. 11.3 / ACI 347R'],
    objective: {
      en: 'Prevents premature soffit prop removal that induces permanent sag, shear cracks, or partial collapse, and verifies continuous wet ponding/hessian hydration (≥ 7–14 days) to attain full design f\'c and watertightness.',
      bn: 'সময়ের আগেই বিম/স্ল্যাবের সাটারিং ও প্রপস খুলে ফেলায় ছাদ ঝুলে পড়া বা ধসে যাওয়া রোধ করে এবং পূর্ণ শক্তি (f\'c) ও জলরোধী গুণাগুণ অর্জনে ন্যূনতম ৭–১৪ দিনের ভেজা কিউরিং (পন্ডিং/চট) নিশ্চিত করে।',
    },
    sampling: {
      frequency: { en: 'Before removing any vertical shuttering (columns/beam sides) or soffit props (beams/slabs/cantilevers), and daily curing audit.', bn: 'যেকোনো সাটারিং বা প্রপস খোলার ঠিক আগে এবং প্রতিদিন কিউরিং পরিদর্শনে।' },
      quantity: { en: 'Cross-check casting log date, span length, structural element category, concrete grade/blend (OPC vs PCC), and active wet curing days.', bn: 'ঢালাইয়ের তারিখ, স্প্যানের দৈর্ঘ্য, কাঠামোর ধরন, সিমেন্ট (OPC/PCC) এবং চলমান কিউরিং দিন যাচাই।' },
      lotSize: { en: '1 structural casting element / floor pour.', bn: '১টি কাস্টিং এলিমেন্ট বা ফ্লোর পোর।' },
    },
    apparatus: [
      { item: { en: 'Pour Log Register (SM-08 Cube Results), Tape Measure & Calendar/Temp Log', bn: 'ঢালাই লগ (কিউব টেস্ট রিপোর্ট), টেপ ও আবহাওয়া লগ' }, spec: '7-day cube strength ≥ 65–70% f\'c before stripping propped soffits' },
    ],
    procedure: [
      { en: 'Vertical Formwork Sides (Columns, Walls & Beam Sides): Stripping allowed after 24–48 hours (1–2 days) once concrete hardens without edge-spalling; immediately wrap columns in wet hessian/jute sacks.', bn: 'কলাম, দেয়াল ও বিমের পাশের সাটার: ঢালাইয়ের ২৪–৪৮ ঘণ্টা (১–২ দিন) পর খোলা যাবে—খোলার সাথে সাথে ভেজা চট/পাটের বস্তা জড়িয়ে দিন।' },
      { en: 'Slab Soffit Formwork (Leaving Props Fixed): Ply/MS sheets may be stripped after 3–7 days ONLY if props are re-tightened/left untouched underneath (using prop-drop heads or split props).', bn: 'স্ল্যাবের তলার শিট (প্রপস রেখে): নিচে প্রপস অক্ষত ও টাইট রেখে কেবল শিট খোলা যাবে ৩–৭ দিন পর।' },
      { en: 'Slab Props Removal: Span ≤ 4.5 m (15 ft) → Minimum 14 days! Span > 4.5 m (15 ft) → Minimum 21 days! Maintain reshoring on floors immediately below during upper pours.', bn: 'স্ল্যাবের প্রপস খোলা: স্প্যান ≤ ৪.৫ মি. (১৫ ফুট) হলে কমপক্ষে ১৪ দিন এবং > ৪.৫ মি. হলে কমপক্ষে ২১ দিন! ওপরের তলায় ঢালাই চললে নিচের ২ তলায় রিশোরিং রাখুন।' },
      { en: 'Beam, Arch & Cantilever Soffit Props: Span ≤ 6.0 m (20 ft) → 14–21 days (use 21d for PCC/blended cement); Span > 6.0 m OR ANY Cantilever Balcony/Canopy → Strict 28 days minimum + verify 28-day cube strength ≥ f\'c!', bn: 'বিম, আর্চ ও ক্যান্টিলিভারের প্রপস: স্প্যান ≤ ৬.০ মি. হলে ১৪–২১ দিন (PCC সিমেন্টে ২১ দিন) এবং স্প্যান > ৬.০ মি. বা যেকোনো ক্যান্টিলিভার (ঝুল বারান্দা) হলে কমপক্ষে ২৮ দিন ও ২৮-দিনের কিউব টেস্ট পাস নিশ্চিত করুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'For Cantilever beams/slabs and long-span beams (> 6.0 m), strip props from the TIP inward toward the support—NEVER from the support outward!', bn: 'ক্যান্টিলিভার ছাদ/বিমের প্রপস সবসময় বাইরের প্রান্ত (Tip) থেকে শুরু করে ভেতরের সাপোর্টের দিকে খুলবেন—উল্টো করলে মোমেন্ট বেড়ে ক্যান্টিলিভার ভেঙে পড়বে।' },
        { en: 'With PCC (CEM-II) or fly-ash/slag blended cement in winter (< 18°C), extend stripping periods by +3 to +7 days.', bn: 'শীতকালে (< ১৮°সে.) বা PCC (CEM-II) সিমেন্টের ঢালাইয়ে সাটার খোলার সময় ৩–৭ দিন বাড়িয়ে দিন।' },
      ],
      contractorTricks: [
        { en: 'Pulling Out Bamboo Props Early for the Next Floor: Contractors secretly pull out 50% of props at day 7 to reuse on the upper floor—causing immediate long-term creep sag in beams and diagonal shear cracking.', bn: '৭ দিনেই অর্ধেক প্রপস খুলে ওপরের তলায় নিয়ে যাওয়া: ঠিকাদার সাটারিং খরচ বাঁচাতে ৭-১০ দিনেই মাঝখানের প্রপস খুলে নেয়—যার ফলে কয়েক মাস পর ছাদ-বিম স্থায়ীভাবে ঝুলে যায়।' },
        { en: 'Dry-Surface Curing Illusion: Pouring a quick hose spray once at morning and evening on hot exposed columns while leaving slabs dry over weekend stops hydration dead within 48 hours.', bn: 'লোক-দেখানো পানি ছিটানো: ছাদে মাটির বাঁধ (Ponding) না দিয়ে কেবল সকাল-সন্ধ্যা পাইপ দিয়ে একটু পানি ছিটানো হলে গরমে ১ ঘণ্টার মধ্যেই ছাদ শুকিয়ে শক্তি কমে যায়।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'BNBC-2020 / PWD Minimum Stripping & Curing Thresholds', bn: 'BNBC / PWD ন্যূনতম সাটার খোলা ও কিউরিং সময়' },
          equation: 'Vertical Sides ≥ 24h (48h winter/PCC) | Slab Props: 14d (L ≤ 4.5m), 21d (L > 4.5m) | Beam/Cantilever: 21d (L ≤ 6m), 28d (L > 6m / Cantilever)',
          variables: [
            { en: 't_age = Elapsed concrete age since pour completion (hours or days)', bn: 't_age = ঢালাই শেষ হওয়ার পর অতিবাহিত সময় (ঘণ্টা বা দিন)' },
            { en: 't_curing = Continuous wet ponding/hessian days done (OPC ≥ 7d, PCC/Watertight ≥ 10–14d)', bn: 't_curing = চলমান ভেজা কিউরিং (পন্ডিং/চট) দিন সংখ্যা (OPC ≥ ৭, PCC ≥ ১০–১৪ দিন)' },
          ],
          unitNote: 'Cold climate (< 18°C) or PCC/CEM-II: Add safety buffer (+24h vertical / +4d slab / +7d beam).',
        },
      ],
      workedExample: {
        en: '6.5 m clear beam (or 2.1 m cantilever canopy) checked at concrete age 21 days with 10 days ponding curing → Minimum required prop duration = 28 days → FAIL / HOLD STRIPPING (+7 days remaining; keep props & wet curing active).',
        bn: '৬.৫ মি. স্প্যানের বিম (বা ক্যান্টিলিভার) ঢালাইয়ের ২১ দিন পর যাচাই করলে → ন্যূনতম প্রপস সময় = ২৮ দিন → স্থগিত (আরো ৭ দিন প্রপস রাখুন)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Age ≥ BNBC Stripping Min · Wet Curing Met · 0 Critical Fails', codeLimit: 'BNBC §5.11 / PWD', interpretation: { en: 'Concrete maturity & minimum stripping duration satisfied. Safe to de-shutter per sequence.', bn: 'নির্ধারিত দিন ও কিউরিং পূর্ণ হয়েছে—ধাপে ধাপে নিরাপদে সাটার/প্রপস খুলুন।' } },
      { tier: 'WARNING', rangeLabel: 'Age Meets Base Min BUT Curing Short OR PCC/Cold Weather Buffer Recommended', codeLimit: 'Extend Curing / +3–7d', interpretation: { en: 'Concrete meets bare minimum days but requires winter/PCC buffer or extended wet curing + 7d/28d cube verification.', bn: 'ন্যূনতম দিন পার হলেও শীতকাল বা PCC সিমেন্ট/কম কিউরিংয়ের জন্য কিউব রিপোর্ট দেখে আরো ৩–৭ দিন অপেক্ষা করা উত্তম।' } },
      { tier: 'FAIL', rangeLabel: 'Age < Minimum Required Stripping Time OR ANY Critical Fail', codeLimit: 'HOLD STRIPPING · KEEP PROPS', interpretation: { en: 'Premature de-shuttering hazard! Do NOT loosen or remove props until full required age & strength are confirmed.', bn: 'সময়ের আগেই সাটার খোলা বিপজ্জনক! নির্ধারিত দিন ও শক্তি অর্জন না হওয়া পর্যন্ত একটি প্রপসও সরাবেন না।' } },
    ],
    remedialActions: [
      { en: 'Maintain 50 mm deep ponding dykes on slabs for minimum 10–14 days and wrap columns/beams continuously with soaked gunny/hessian cloth.', bn: 'ছাদে ১০–১৪ দিন ৫০ মিমি গভীর পন্ডিং বাঁধ দিয়ে পানি জমান এবং কলামে সার্বক্ষণিক ভেজা চট বেঁধে রাখুন।' },
      { en: 'Keep at least 2 floors of reshoring props underneath newly poured multi-story slabs.', bn: 'বহুতল ভবনে নতুন ছাদ ঢালাইয়ের নিচের ২টি ফ্লোরে রিশোরিং প্রপস সর্বদা অক্ষত রাখুন।' },
    ],
    calculatorInputs: [
      {
        key: 'stripElementCode',
        label: { en: 'Formwork / Prop Element to Strip', bn: 'যে অংশের সাটার/প্রপস খোলা হবে' },
        unit: '',
        defaultValue: 3,
        options: [
          { value: 1, label: { en: '1. Vertical Sides: Columns / Walls / Beam Sides (24–48 hr)', bn: '১. কলাম, দেয়াল ও বিমের পাশের সাটার (২৪–৪৮ ঘণ্টা)' } },
          { value: 2, label: { en: '2. Slab Soffit Ply ONLY — Leaving Props Fixed (3–7 days)', bn: '২. কেবল স্ল্যাবের তলার শিট—প্রপস রেখে (৩–৭ দিন)' } },
          { value: 3, label: { en: '3. Slab Soffit Props Removal (14d ≤4.5m / 21d >4.5m)', bn: '৩. স্ল্যাবের প্রপস অপসারণ (১৪ দিন ≤৪.৫মি. / ২১ দিন >৪.৫মি.)' } },
          { value: 4, label: { en: '4. Beam / Arch Props ≤ 6.0 m Span (14–21 days)', bn: '৪. বিম/আর্চ প্রপস ≤ ৬.০ মি. স্প্যান (১৪–২১ দিন)' } },
          { value: 5, label: { en: '5. Beam > 6.0 m OR ANY Cantilever Balcony (28 days)', bn: '৫. > ৬.০ মি. বিম অথবা ক্যান্টিলিভার (২৮ দিন)' } },
        ],
      },
      { key: 'memberSpanM', label: { en: 'Clear Member Span (or Cantilever × 2)', bn: 'মেম্বারের ক্লিয়ার স্প্যান' }, unit: 'm', defaultValue: 4.2, min: 0.5, max: 18, step: 0.1 },
      { key: 'concreteAgeDays', label: { en: 'Concrete Age Since Casting', bn: 'ঢালাইয়ের বয়স (দিন)' }, unit: 'days', defaultValue: 14, min: 0.5, max: 60, step: 0.5 },
      { key: 'curingDaysDone', label: { en: 'Wet Ponding / Hessian Curing Completed', bn: 'সম্পন্ন ভেজা কিউরিং (দিন)' }, unit: 'days', defaultValue: 10, min: 0, max: 28, step: 1 },
      {
        key: 'cementBlendCode',
        label: { en: 'Cement Type Used in Pour', bn: 'ঢালাইয়ে ব্যবহৃত সিমেন্ট' },
        unit: '',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'OPC CEM-I (Normal Strength Gain)', bn: 'OPC CEM-I (স্বাভাবিক শক্তি)' } },
          { value: 2, label: { en: 'PCC CEM-II / Blended (Slower Early Gain)', bn: 'PCC CEM-II / ব্লেন্ডেড (ধীর গতি)' } },
        ],
      },
      { key: 'ambientTempC', label: { en: 'Average Ambient Temperature', bn: 'গড় তাপমাত্রা' }, unit: '°C', defaultValue: 28, min: 5, max: 45, step: 1 },
    ],
    checklistItems: [
      { id: 'cd-1', category: { en: 'Stripping Duration', bn: 'ন্যূনতম দিন' }, item: { en: 'Concrete age strictly meets or exceeds BNBC/PWD minimum stripping days for element type & span (with winter/PCC buffer)', bn: 'মেম্বারের ধরন ও স্প্যান অনুযায়ী BNBC/PWD নির্ধারিত ন্যূনতম দিন সম্পূর্ণ হয়েছে' }, codeRef: 'BNBC §5.11', critical: true, weight: 30 },
      { id: 'cd-2', category: { en: 'Wet Curing', bn: 'ভেজা কিউরিং' }, item: { en: 'Continuous 7–14 days wet ponding on slab / soaked hessian wraps on columns verified without dry interruptions', bn: 'ছাদে কমপক্ষে ৭–১৪ দিন নিয়মিত পন্ডিং ও কলামে সার্বক্ষণিক ভেজা চট দিয়ে কিউরিং সম্পন্ন' }, codeRef: 'PWD / ACI', critical: true, weight: 25 },
      { id: 'cd-3', category: { en: 'Reshoring & Cube Gate', bn: 'রিশোরিং ও কিউব টেস্ট' }, item: { en: 'Lower floors reshored if pouring above; 7-day / 28-day cylinder crushing strength meets design maturity before removing main beam/cantilever props', bn: 'ওপরের ছাদের লোড নিতে নিচের তলায় রিশোরিং রাখা এবং বিম-ক্যান্টিলিভার খোলার আগে কিউব স্ট্রেন্থ যাচাই' }, codeRef: 'ACI 347R', critical: true, weight: 25 },
      { id: 'cd-4', category: { en: 'Stripping Sequence', bn: 'সাটার খোলার ক্রম' }, item: { en: 'Cantilever props released from outer tip inward; no sledgehammer impact shocks or sudden crowbar prying on green edges', bn: 'ক্যান্টিলিভারের প্রপস প্রান্ত থেকে ভেতরের দিকে খোলা এবং হাতুড়ি দিয়ে আঘাত না করে সাবধানে সাটার খোলা' }, codeRef: 'Site QC', critical: false, weight: 20 },
    ],
  },
  {
    id: 'qc-masonry-plaster',
    domainId: 'site-checklists',
    code: 'LAB-QCS-04',
    title: {
      en: 'Brick Masonry, 2m Straightedge Plaster & Tile Finishing QA/QC Verifier',
      bn: 'ইটের গাঁথুনি, ২ মি. পাট্টি প্লাস্টার ও টাইলস ফিনিশিং মান যাচাই',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড গাঁথুনি, প্লাস্টার ও টাইলস চেকলিস্ট',
    governingCodes: ['BNBC-2020 Part 6 §4', 'PWD SoR Masonry & Finishing Spec', 'IS 2212 / IS 1661'],
    objective: {
      en: 'Eliminates hollow vertical joints, crooked walls, dry-brick mortar starvation, RCC-brick junction cracks, uneven plaster waves (> 3 mm under 2 m straightedge), and hollow floor/wall tiles.',
      bn: 'ফাঁকা জয়েন্ট, বাঁকা দেয়াল, শুকনো ইট, কলাম-দেয়াল জয়েন্টে চুল-ফাটল, প্লাস্টারের ঢেউ (> ৩ মিমি / ২ মি. পাট্টিতে) ও টাইলসের নিচে ফাঁপা অংশ হওয়া প্রতিরোধ করে।',
    },
    sampling: {
      frequency: { en: 'Daily during brickwork, prior to plastering each room (chicken mesh check), and 48–72 hours after tile/plaster installation.', bn: 'গাঁথুনি চলাকালীন প্রতিদিন, প্লাস্টারের আগে ও টাইলস-প্লাস্টার সম্পন্ন হওয়ার পর প্রতিটি রুমে।' },
      quantity: { en: '100% plumb, right-angle (3-4-5), 2m aluminum straightedge gap, chicken-mesh strip, and wooden-mallet/coin tile tapping.', bn: 'প্রতিটি দেয়ালে ওলন, ২ মি. অ্যালুমিনিয়াম পাট্টি, চিকেন-মেশ ও টাইলসের শব্দ-পরীক্ষা।' },
      lotSize: { en: '1 apartment/floor masonry & finishing zone.', bn: '১টি ফ্লোর বা ইউনিটের গাঁথুনি, প্লাস্টার ও টাইলস কাজ।' },
    },
    apparatus: [
      { item: { en: 'Plumb Bob, 2.0 m Aluminum Straightedge (Patti), Spirit Level & Try-Square', bn: 'ওলন (Plumb), ২.০ মি. অ্যালুমিনিয়াম পাট্টি, স্পিরিট লেভেল ও গুনিয়া' }, spec: 'Plumb ≤ 3 mm/3m; 2m Straightedge flatness ≤ 3 mm' },
      { item: { en: 'Tapping Mallet / Brass Rod & Digital Moisture Meter', bn: 'টাইলস ট্যাপিং রড/ম্যালেট ও স্টীল স্কেল' }, spec: 'Zero hollow ringing sound; uniform 10 mm joints' },
    ],
    procedure: [
      { en: 'Brickwork Audit: Confirm bricks soaked ≥ 2 hours, laid frog-up, uniform 10 ± 2 mm mortar joints, daily lift ≤ 1.5 m (5\'-0"), and 5" walls fitted with 2×6mm tie rods / RCC lintel bands every 1.0–1.2 m.', bn: 'ইটের গাঁথুনি: ইট ≥ ২ ঘণ্টা ভেজানো, ফ্রগ ওপরের দিকে, মর্টার জয়েন্ট ১০ ± ২ মিমি, দৈনিক উচ্চতা ≤ ১.৫ মি. (৫\'-০") এবং ৫" দেয়ালে ১.০–১.২ মি. পরপর রড/লিন্টেল ব্যান্ড নিশ্চিত করুন।' },
      { en: 'Junction Mesh & Plaster Thickness: Verify RCC column/beam faces hacked (tanka) and 200 mm GI Chicken Wire Mesh (20–24 gauge) fixed across all RCC-brick junctions. Plaster thickness: Ceiling 6–8 mm, Internal Wall 12 mm, External Wall 15–20 mm.', bn: 'জয়েন্ট মেশ ও প্লাস্টারের পুরুত্ব: কলাম-দেয়াল জয়েন্টে চিপিং ও ২০০ মিমি চিকেন-মেশ (২০–২৪ গেজ) লাগাতে হবে। প্লাস্টারের পুরুত্ব: সিলিং ৬–৮ মিমি, ভেতরের দেয়াল ১২ মিমি, বাইরের দেয়াল ১৫–২০ মিমি।' },
      { en: '2m Straightedge Flatness & Tile Hollowness: Hold a 2.0 m aluminum patti horizontally & diagonally across plastered wall—maximum gap ≤ 3.0 mm! Tap 100% of floor/wall tiles lightly for hollow drum sound (allowable < 5% edge tap, 0% center voids).', bn: '২ মি. পাট্টি ও টাইলস পরীক্ষা: প্লাস্টারের ওপর ২ মিটার পাট্টি ধরে সর্বোচ্চ ফাঁকা ≤ ৩ মিমি এবং প্রতিটি টাইলসে টোকা দিয়ে ফাঁপা শব্দ নেই কিনা যাচাই করুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Discard mortar > 90 minutes old; enforce minimum 7-day continuous water curing on brickwork and 7–10 days on plastered walls.', bn: '৯০ মিনিটের পুরনো মর্টার ফেলুন এবং গাঁথুনিতে ৭ দিন ও প্লাস্টারে ৭–১০ দিন নিয়মিত পানি দিয়ে কিউরিং করুন।' },
      ],
      contractorTricks: [
        { en: '25–30 mm Thick Plaster to Hide Crooked Brickwork & Skipped Chicken Mesh: Masons skip plumb-dots (Thiya/Bulla) and slap heavy thick plaster that later cracks and debonds, while skipping chicken wire at column joints guarantees vertical junction cracks.', bn: 'বাঁকা গাঁথুনি ঢাকতে মোটা প্লাস্টার ও চিকেন-মেশ বাদ: থিয়া-বুল্লা ছাড়া দেয়াল গাঁথলে বাঁকা ঢাকতে ২৫-৩০ মিমি মোটা প্লাস্টার করা হয় যা খসে পড়ে, আর চিকেন-মেশ বাদ দিলে কলাম-দেয়াল জয়েন্ট ফেটে যায়।' },
        { en: 'Spot-Daubing Floor Tiles (গোল্লা/ডট মেথড): Applying 4–5 cement-paste blobs under large tiles instead of full notched-trowel bed leaves hollow corners that crack under furniture loads.', bn: 'টাইলসের নিচে ডট দিয়ে বসানো: পুরো তলায় মর্টার না বিছিয়ে ৪-৫ জায়গায় দলা (ডট) দিয়ে টাইলস বসালে মাঝখানে ফাঁপা থাকে ও চাপে টাইলস ভেঙে যায়।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Masonry, Plaster Flatness & Tile Finishing Limits', bn: 'গাঁথুনি, প্লাস্টার পাট্টি ও টাইলস টলারেন্স সূত্র' },
          equation: 'Plumb ≤ 3 mm/3m  |  Joint = 8–12 mm  |  Lift ≤ 1.50 m/day  |  2m_Patti_Gap ≤ 3.0 mm  |  Brick_Soak ≥ 2.0 hr',
          variables: [
            { en: 'Plaster spec: Ceiling 6–8 mm, Internal Wall 12 mm (max 15mm), External 15–20 mm', bn: 'প্লাস্টারের পুরুত্ব: সিলিং ৬–৮ মিমি, ভেতরে ১২ মিমি, বাইরে ১৫–২০ মিমি' },
            { en: 'Hollow tiles allowed: 0% center voids (< 5% minor corner tap)', bn: 'টাইলস ফাঁপা হার: কেন্দ্রে ০% (কিনারে < ৫%)' },
          ],
          unitNote: '90° wall corners verified via 3-4-5 triangle check; GI Chicken Wire Mesh 20–24 gauge mandatory at RCC-brick seams.',
        },
      ],
      workedExample: {
        en: 'Brick soak = 2.5h, 10 mm joints, lift = 1.35 m, plumb = 2.0 mm/3m, Internal plaster = 12 mm with 2.0 mm gap under 2 m straightedge, 1.5% minor corner tile hollow → Weighted Score 100% → PASS.',
        bn: 'ইট ভেজানো ২.৫ ঘণ্টা, জয়েন্ট ১০ মিমি, লিফট ১.৩৫ মি., ওলন ২ মিমি, ভেতরের প্লাস্টার ১২ মিমি, ২ মি. পাট্টি ফাঁকা ২.০ মিমি ও টাইলস ফাঁপা ১.৫% → ১০০% পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: '0 Critical Fails · Score ≥ 90% · 2m Gap ≤ 3mm · Plumb ≤ 3mm', codeLimit: 'PWD / BNBC-2020', interpretation: { en: 'True-plumb masonry, flush plaster within 3 mm / 2m patti, and solid full-bed tiling verified.', bn: 'সঠিক ওলন, নিখুঁত ২ মি. পাট্টি প্লাস্টার ও মজবুত টাইলস—পরবর্তী রং/কাজের অনুমোদন দিন।' } },
      { tier: 'WARNING', rangeLabel: '0 Critical Fails · Score 75%–89% OR Minor Flatness 3.1–4.0 mm', codeLimit: 'Rectify Joint / Mesh', interpretation: { en: 'Feather-grind high plaster spots, rake missing mortar joints, or add chicken mesh strips prior to next coat.', bn: 'প্লাস্টারের উঁচু অংশ ঘষে সমান করুন, ফাঁকা জয়েন্ট ভরাট করুন ও চিকেন-মেশ নিশ্চিত করুন।' } },
      { tier: 'FAIL', rangeLabel: 'ANY Critical Fail OR 2m Gap > 4mm OR Lift > 1.8m OR Hollow Tile > 5%', codeLimit: 'DISMANTLE / RE-PLASTER / RE-LAY', interpretation: { en: 'Excessive waviness, crooked wall, dry bricks, or hollow tiles; chisel & re-plaster or replace hollow tiles immediately.', bn: 'প্লাস্টারে অতিরিক্ত ঢেউ (> ৪ মিমি), বাঁকা গাঁথুনি, শুকনো ইট বা ফাঁপা টাইলস—অবিলম্বে ভেঙে পুনরায় করুন।' } },
    ],
    remedialActions: [
      { en: 'Pull up and re-lay any hollow tiles using notched trowel full cement slurry/adhesive bed within 24 hours before grout hardens.', bn: 'ফাঁপা শব্দ হওয়া টাইলসগুলো খুলে খাঁজকাটা ট্রাওয়েল (Notched Trowel) দিয়ে পুরো তলায় মর্টার বিছিয়ে পুনরায় বসান।' },
    ],
    calculatorInputs: [
      {
        key: 'plasterSurfaceCode',
        label: { en: 'Plastering Surface Zone', bn: 'প্লাস্টারের স্থান' },
        unit: '',
        defaultValue: 2,
        options: [
          { value: 1, label: { en: '1. RCC Ceiling Soffit (Target 6–8 mm)', bn: '১. ছাদের সিলিং (লক্ষ্য ৬–৮ মিমি)' } },
          { value: 2, label: { en: '2. Internal Brick Wall (Target 12 mm)', bn: '২. ভেতরের দেয়াল (লক্ষ্য ১২ মিমি)' } },
          { value: 3, label: { en: '3. External Weather Wall (Target 15–20 mm)', bn: '৩. বাইরের দেয়াল (লক্ষ্য ১৫–২০ মিমি)' } },
        ],
      },
      { key: 'plasterThicknessMm', label: { en: 'Measured Plaster Thickness', bn: 'প্লাস্টারের মাপা পুরুত্ব' }, unit: 'mm', defaultValue: 12, min: 3, max: 40, step: 1 },
      { key: 'straightedgeGap2mMm', label: { en: '2.0 m Straightedge (Patti) Max Gap', bn: '২ মি. পাট্টির নিচে সর্বোচ্চ ফাঁকা' }, unit: 'mm', defaultValue: 2.0, min: 0, max: 15, step: 0.5 },
      { key: 'brickSoakHours', label: { en: 'Brick Pre-Soaking Time', bn: 'ইট পানিতে ভেজানোর সময়' }, unit: 'hr', defaultValue: 2.5, min: 0, max: 24, step: 0.5 },
      { key: 'mortarJointMm', label: { en: 'Average Mortar Joint Thickness', bn: 'মর্টার জয়েন্টের পুরুত্ব' }, unit: 'mm', defaultValue: 10, min: 4, max: 25, step: 1 },
      { key: 'dailyLiftM', label: { en: 'Daily Bricklaying Lift Height', bn: 'দৈনিক গাঁথুনির উচ্চতা' }, unit: 'm', defaultValue: 1.35, min: 0.3, max: 3.2, step: 0.05 },
      { key: 'plumbErrorMm', label: { en: 'Max Plumb Error per 3m Height', bn: '৩ মি. উচ্চতায় ওলন ত্রুটি' }, unit: 'mm', defaultValue: 2.0, min: 0, max: 25, step: 0.5 },
      { key: 'tileHollowPct', label: { en: 'Hollow Tile Sound Rate (Tapping)', bn: 'টাইলস টোকা পরীক্ষায় ফাঁপা হার' }, unit: '%', defaultValue: 1.5, min: 0, max: 100, step: 0.5 },
    ],
    checklistItems: [
      { id: 'mp-1', category: { en: 'Brick Pre-Soak', bn: 'ইট ভেজানো ও ফ্রগ' }, item: { en: '100% bricks soaked in clean water ≥ 2 hours until saturated; bricks laid frog-mark upward cleanly', bn: 'গাঁথুনির আগে ইট কমপক্ষে ২ ঘণ্টা পানিতে ভেজানো এবং ইটের ফ্রগ উপরের দিকে রাখা' }, codeRef: 'PWD §6', critical: true, weight: 20 },
      { id: 'mp-2', category: { en: 'Alignment & Lift', bn: 'ওলন ও লিফট সীমা' }, item: { en: 'Uniform 10 ± 2 mm mortar joints, wall plumb error ≤ 3 mm/3m, daily lift ≤ 1.5 m (5 ft) & 2×6mm tie rods every 1.0–1.2m on 5" walls', bn: 'সমান ১০±২ মিমি জয়েন্ট, ওলন ≤ ৩ মিমি, দৈনিক গাঁথুনি ≤ ১.৫ মি. ও ৫" দেয়ালে রডের ব্যান্ড' }, codeRef: 'BNBC §4', critical: true, weight: 25 },
      { id: 'mp-3', category: { en: 'Chicken Wire Mesh', bn: 'চিকেন-মেশ ও চিপিং' }, item: { en: 'RCC column/beam faces hacked (tanka) & 200 mm GI chicken-wire mesh (20–24 gauge) nailed over ALL RCC-brickwork joints', bn: 'আরসিসি কলাম-বিমে টংকা/চিপিং ও সকল ইট-কলাম সংযোগে ২০০ মিমি জিআই চিকেন-মেশ লাগানো' }, codeRef: 'PWD Spec', critical: true, weight: 20 },
      { id: 'mp-4', category: { en: 'Plaster Straightedge', bn: 'প্লাস্টার পাট্টি ও বুল্লা' }, item: { en: 'Level bullahs set; plaster thickness matches surface spec & 2.0 m aluminum straightedge deviation ≤ 3.0 mm with mortar used ≤ 90 min', bn: 'বুল্লা সেট করে সঠিক পুরুত্বের প্লাস্টার এবং ২ মি. পাট্টিতে ফাঁকা ≤ ৩.০ মিমি (৯০ মিনিটের মধ্যে মর্টার)' }, codeRef: 'IS 1661', critical: true, weight: 20 },
      { id: 'mp-5', category: { en: 'Tiling & Curing', bn: 'টাইলস ও কিউরিং' }, item: { en: 'Tiles laid on full notched bed (0% center voids on tapping); brickwork & plaster cured ≥ 7–10 days continuously', bn: 'পুরো তলায় মর্টার দিয়ে টাইলস বসানো (ফাঁপা শব্দ নেই) এবং গাঁথুনি-প্লাস্টারে ৭–১০ দিন কিউরিং' }, codeRef: 'Site QC', critical: false, weight: 15 },
    ],
  },
  {
    id: 'qc-excavation-foundation',
    domainId: 'site-checklists',
    code: 'LAB-QCS-05',
    title: {
      en: 'Foundation Excavation, Bearing Stratum & Dewatering QA/QC Checklist',
      bn: 'ফাউন্ডেশন খনন, বেয়ারিং মাটি ও ডি-ওয়াটারিং মান যাচাই চেকলিস্ট',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড ফাউন্ডেশন চেকলিস্ট',
    governingCodes: ['BNBC-2020 Part 6 Ch. 3', 'OSHA Excavation Shoring', 'PWD Foundation Spec'],
    objective: {
      en: 'Prevents trench cave-ins, footing bearing failure over disturbed mud/organic peat, and groundwater washing cement out of fresh footing concrete prior to PCC blinding.',
      bn: 'মাটি ধসে শ্রমিক দুর্ঘটনা, নরম কাদা বা জৈব মাটির ওপর ফাউন্ডেশন বসিয়ে দেয়া এবং ভূগর্ভস্থ পানির স্রোতে সদ্য ঢালাই করা ফুটিংয়ের সিমেন্ট ধুয়ে যাওয়া রোধ করে।',
    },
    sampling: {
      frequency: { en: 'Every footing pit, mat-foundation bay, or pile-cap trench immediately prior to Brick Flat Soling (BFS) & PCC blinding.', bn: 'প্রতিটি ফুটিং গর্ত, ম্যাট বা পাইল-ক্যাপে ইটের সলিং ও সিসি ঢালাইয়ের ঠিক আগে।' },
      quantity: { en: '100% excavated pit bottom level, soil log match, shoring & sump check.', bn: 'গর্তের তলদেশের লেভেল, মাটির ধরন, শোরিং ও পানি নিষ্কাশন যাচাই।' },
      lotSize: { en: '1 footing group / foundation excavation zone.', bn: '১টি ফুটিং গ্রুপ বা সম্পূর্ণ ম্যাট খনন এলাকা।' },
    },
    apparatus: [
      { item: { en: 'Auto-Level / Total Station, Soil Borehole Log & 5m Tape', bn: 'অটো-লেভেল মেশিন, সয়েল টেস্ট বোর-লগ ও স্টিল টেপ' }, spec: 'Datum RL tolerance ±15 mm' },
    ],
    procedure: [
      { en: 'Verify excavation bottom Reduced Level (RL) matches structural foundation drawing AND soil stratum matches Geotechnical Borehole Log bearing layer.', bn: 'অটো-লেভেলে খননের তলদেশের RL ও মাটির ধরন সয়েল টেস্ট রিপোর্টের বেয়ারিং স্তরের সাথে মিলিয়ে নিন।' },
      { en: 'Check trench side-slopes or sheet-pile/timber shoring for any excavation deeper than 1.5 m, keeping excavated spoil ≥ 1.0–1.5 m clear from pit edge.', bn: '১.৫ মিটারের বেশি গভীর গর্তে সঠিক ঢাল বা শোরিং আছে কিনা এবং কাটা মাটি গর্তের কিনার থেকে ≥ ১.০–১.৫ মিটার দূরে রাখা হয়েছে কিনা দেখুন।' },
      { en: 'Confirm groundwater is pumped continuously via perimeter sump/well-points to at least 300 mm below pit bottom BEFORE laying BFS and lean PCC.', bn: 'পাম্প বা সাম্প-পিটের মাধ্যমে ভূগর্ভস্থ পানি খননের তল থেকে অন্তত ৩০০ মিমি নিচে নামানো হয়েছে কিনা নিশ্চিত করুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Never pour lean concrete over standing mud/slurry—compact a 150 mm coarse sand/brick-khoa stabilization bed if sub-base turns soft.', bn: 'কাদা বা দাঁড়ানো পানির ওপর কখনোই সিসি ঢালাই দেবেন না; তল নরম হলে ১৫০ মিমি বালি-খোয়ার বেড কমপ্যাক্ট করে নিন।' },
      ],
      contractorTricks: [
        { en: 'Over-Excavating & Dumping Loose Soil Back Without Compaction: When excavators dig 300 mm too deep, workers shovel loose dirt back in to restore level—causing immediate foundation settlement.', bn: 'বেশি খুঁড়ে আলগা মাটি দিয়ে ভরাট: এক্সক্যাভেটর দিয়ে বেশি গভীর করে ফেললে অনেক সময় আলগা মাটি ফেলে লেভেল সমান করা হয়—যা ভবন বসিয়ে দেয়! অতিরিক্ত খনন অবশ্যই ১:৪:৮ সিসি বা বালি কমপ্যাকশনে পূরণ করতে হবে।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Footing RL Level & Dewatering Clearance Check', bn: 'ফুটিং লেভেল ও ডি-ওয়াটারিং ক্লিয়ারেন্স যাচাই' },
          equation: 'RL_error = |RL_measured - RL_design| ≤ 15 mm  |  Water_Level ≤ RL_pit - 0.30 m',
          variables: [
            { en: 'RL_measured = Surveyed excavation bottom Reduced Level (m)', bn: 'RL_measured = অটো-লেভেলে মাপা খনন তলের লেভেল (মি.)' },
            { en: 'Water_Level = Observed seepage water elevation relative to pit base (m)', bn: 'Water_Level = গর্তের তলের সাপেক্ষে পানির স্তর (মি.)' },
          ],
          unitNote: 'OSHA/BNBC safety: Shoring/benching mandatory for cohesive/non-cohesive trenches > 1.50 m deep.',
        },
      ],
      workedExample: {
        en: 'Design pit RL = -2.40 m vs measured -2.41 m (Δ = 10 mm ≤ 15 mm), water lowered 0.45 m below pit base, 0 critical fails → Approved for BFS & 75 mm PCC blinding.',
        bn: 'ডিজাইন লেভেল -২.৪০ মি. বনাম মাপা -২.৪১ মি. (ত্রুটি ১০ মিমি ≤ ১৫ মিমি), পানি তল থেকে ০.৪৫ মি. নিচে ও সকল চেকলিস্ট পাস → সলিং ও পিসিসি ঢালাই অনুমোদিত।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: '0 Critical Fails & RL Error ≤ 15 mm & Dry Subgrade', codeLimit: 'BNBC-2020 / PWD', interpretation: { en: 'Firm undisturbed bearing stratum and safe shored pit; approve BFS & PCC blinding.', bn: 'শক্ত ও শুষ্ক বেয়ারিং তল এবং নিরাপদ শোরিং—ইটের সলিং ও সিসি ঢালাইয়ের অনুমতি দিন।' } },
      { tier: 'WARNING', rangeLabel: '0 Critical Fails & Compliance 75%–89%', codeLimit: 'Trim / Compact Pit', interpretation: { en: 'Trim minor high spots or ram subgrade cleanly before placing BFS.', bn: 'উঁচু অংশ কেটে সমান করে ও দুরমুজ দিয়ে পিটিয়ে সলিং শুরু করুন।' } },
      { tier: 'FAIL', rangeLabel: 'ANY Critical Fail (Mud/Water/Unsafe Trench) OR RL Error > 25 mm', codeLimit: 'STOP WORK / SHORE & DEWATER', interpretation: { en: 'Unsafe trench collapse risk, standing water, or soft organic mud; halt entry, shore sides, dewater, and stabilize subgrade.', bn: 'গর্ত ধসার ঝুঁকি, দাঁড়ানো পানি বা কাদা! কাজ বন্ধ করে শোরিং, ডি-ওয়াটারিং ও তল স্থিতিশীল করুন।' } },
    ],
    remedialActions: [
      { en: 'Backfill accidental over-excavation strictly with 1:4:8 lean concrete or compacted coarse sand—NEVER loose excavated clay.', bn: 'ভুলবশত বেশি খনন করে ফেললে অবশ্যই সিসি ঢালাই বা কমপ্যাক্টেড মোটা বালি দিয়ে ভরাট করুন, কাটা আলগা মাটি দিয়ে নয়।' },
    ],
    calculatorInputs: [
      { key: 'excavationDepthM', label: { en: 'Total Excavation Depth Below EGL', bn: 'মাটি থেকে খননের মোট গভীরতা' }, unit: 'm', defaultValue: 2.4, min: 0.5, max: 15, step: 0.1 },
      { key: 'rlErrorMm', label: { en: 'Measured Bottom RL Error', bn: 'তলদেশের লেভেল (RL) ত্রুটি' }, unit: 'mm', defaultValue: 10, min: 0, max: 100, step: 1 },
      { key: 'dewateringClearanceMm', label: { en: 'Water Table Lowered Below Base', bn: 'ভিত্তির নিচে পানি নামানোর গভীরতা' }, unit: 'mm', defaultValue: 450, min: 0, max: 2000, step: 50 },
    ],
    checklistItems: [
      { id: 'ex-1', category: { en: 'Excavation Safety', bn: 'খনন নিরাপত্তা' }, item: { en: 'Adequate trench shoring / sheet piling / safe slope provided for depth > 1.5 m; spoil heap ≥ 1.2 m back from edge', bn: '১.৫ মিটারের বেশি গভীর খননে শোরিং/স্লোপ ও কাটা মাটি কিনার থেকে ≥ ১.২ মি. দূরে রাখা' }, codeRef: 'BNBC / OSHA', critical: true, weight: 30 },
      { id: 'ex-2', category: { en: 'Bearing Stratum', bn: 'বেয়ারিং মাটি' }, item: { en: 'Pit bottom RL matches design drawing (±15mm) and exposed undisturbed soil matches Geotech Borehole Log', bn: 'গর্তের তলদেশের RL (±১৫ মিমি) সঠিক ও মাটি সয়েল টেস্ট রিপোর্টের সাথে সামঞ্জস্যপূর্ণ' }, codeRef: 'BNBC Pt.6', critical: true, weight: 30 },
      { id: 'ex-3', category: { en: 'Dewatering', bn: 'ডি-ওয়াটারিং' }, item: { en: 'Sump pump / well-point active lowering water table ≥ 300 mm below subgrade; zero mud slurry or standing water', bn: 'পানি তলের ৩০০ মিমি নিচে নামানো এবং গর্তে কোনো কাদা বা জমানো পানি না থাকা' }, codeRef: 'PWD Spec', critical: true, weight: 25 },
      { id: 'ex-4', category: { en: 'Grid Layout', bn: 'সেন্টার-লাইন লেআউট' }, item: { en: 'Column grid centerlines & footing boundaries marked from permanent brick Burji benchmarks', bn: 'স্থায়ী বুর্জি বেঞ্চমার্ক থেকে কলাম ও ফুটিংয়ের সেন্টার-লাইন দাগ দেয়া' }, codeRef: 'Site QC', critical: false, weight: 15 },
    ],
  },
];
