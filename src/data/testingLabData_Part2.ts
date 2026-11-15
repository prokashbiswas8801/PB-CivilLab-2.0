import { LabTestDefinition } from '../types/testingLab';

export const TESTING_LAB_TESTS_PART2_CAT4_5: LabTestDefinition[] = [
  // =========================================================================
  // CATEGORY 4: FRESH, HARDENED & NDT CONCRETE TESTS (কংক্রিট ও এনডিটি পরীক্ষা)
  // 6 Complete 10-Section Bilingual Protocols
  // =========================================================================

  // 4.1 SLUMP CONE TEST OF FRESH CONCRETE
  {
    id: 'con-slump-cone',
    domainId: 'concrete-ndt',
    code: 'LAB-CON-01',
    title: {
      en: 'Slump Cone Test of Fresh Concrete (Workability, Slump Type & Temperature)',
      bn: 'তাজা কংক্রিটের স্লাম্প কোন পরীক্ষা (ওয়ার্কেবিলিটি, স্লাম্পের ধরন ও তাপমাত্রা)',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'তাৎক্ষণিক সাইট ফিল্ড পরীক্ষা',
    governingCodes: ['ASTM C143 / C1064', 'BNBC-2020 Part 6 §5.5', 'PWD SoR Spec', 'BS EN 12350-2'],
    objective: {
      en: 'Measures fresh concrete consistency and flowability right at the transit mixer chute or pump hopper prior to placement. Immediately prevents two catastrophic site failures: (1) low-slump honeycombing around congested column/beam joints, and (2) high-slump water adulteration causing bleeding, aggregate segregation, shrinkage cracking, and 25–40% strength collapse.',
      bn: 'ঢালাইয়ের ঠিক আগে মিক্সার মেশিন বা আরএমসি (RMC) গাড়ির মুখে কংক্রিটের কাজ করার উপযোগিতা (Workability) ও পানির সঠিক মাত্রা তাৎক্ষণিকভাবে যাচাই করে। এতে একদিকে অতিরিক্ত শুকনো কংক্রিটের কারণে হানিকম্বিং (Honeycombing) এড়ানো যায়, অন্যদিকে মিস্ত্রিদের বাড়তি পানি মিশিয়ে কংক্রিটের শক্তি নষ্ট করা বন্ধ হয়।',
    },
    sampling: {
      frequency: {
        en: 'Every single Ready-Mix (RMC) transit mixer truck arriving on site before unloading into the pump hopper, and the first batch plus every 15–20 m³ (or whenever water/aggregate moisture visibly shifts) during site-mixed concrete.',
        bn: 'রেডি-মিক্স (RMC) ব্যবহারের ক্ষেত্রে প্রতিটি ট্রাক আনলোডের আগে, এবং সাইটে মিক্সার মেশিনে ঢালাইয়ের ক্ষেত্রে প্রথম ব্যাচসহ প্রতি ১৫–২০ ঘনমিটারে (অথবা বালির আর্দ্রতা বদলালে) একবার।',
      },
      quantity: {
        en: 'Minimum 15 Liters (≈0.53 CFT, one full wheelbarrow scoop) taken from the middle third of the discharge stream—never the very first or last dribble.',
        bn: 'মিক্সার থেকে বের হওয়া মাঝখানের অংশ থেকে কমপক্ষে ১৫ লিটার (প্রায় ০.৫ ঘনফুট) তাজা কংক্রিট—কখনোই একেবারে শুরু বা শেষের অংশ থেকে নয়।',
      },
      lotSize: {
        en: '1 Transit Mixer Truck (5–7 m³) or 1 continuous 20 m³ structural pour segment.',
        bn: '১টি আরএমসি মিক্সার ট্রাক (৫–৭ ঘনমিটার) বা ২০ ঘনমিটারের একটি ঢালাই সেগমেন্ট।',
      },
    },
    apparatus: [
      {
        item: { en: 'Standard Abrams Slump Cone (1.5 mm thick galvanized steel)', bn: 'স্ট্যান্ডার্ড আব্রামস স্লাম্প কোন (গ্যালভানাইজড স্টিল)' },
        spec: 'Bottom Ø = 200 mm (8"), Top Ø = 100 mm (4"), Height H = 300 mm (12")',
      },
      {
        item: { en: 'Bullet-Nosed Steel Tamping Rod', bn: 'বুলেট-মাথা স্টিল টেম্পিং রড' },
        spec: 'Ø 16 mm (5/8") × 600 mm (24") long, hemispherical tip',
      },
      {
        item: { en: 'Rigid Non-Absorbent Base Plate, Scoop, Scale & Concrete Thermometer', bn: 'পানি-নিরোধক শক্ত বেস প্লেট, স্কুপ, স্কেল ও থার্মোমিটার' },
        spec: 'Min 500×500 mm flat plate; mm/inch ruler; 0–50°C probe',
      },
    ],
    procedure: [
      {
        en: 'Dampen the interior of the Slump Cone and the rigid base plate with a wet cloth (no standing water puddles). Place the cone on a flat, vibration-free surface and step firmly onto both foot-pieces to anchor it.',
        bn: 'স্লাম্প কোনের ভেতর ও বেস প্লেট ভেজা কাপড় দিয়ে হালকা ভিজিয়ে নিন (যেন বাড়তি পানি জমে না থাকে)। সমতল ও কম্পনমুক্ত জায়গায় রেখে কোনের দুই পাশের পা-দানিতে শক্ত করে পা দিয়ে চেপে ধরুন।',
      },
      {
        en: 'Fill the cone in 3 equal-volume layers per ASTM C143 (approx. 67 mm, 155 mm, and 300 mm heights; note PWD field manual also permits 4 equal layers). Tamp every layer uniformly 25 times across the full cross-section with the Ø16 mm × 600 mm rod.',
        bn: 'ASTM C143 অনুযায়ী ৩টি সমান আয়তনের স্তরে (প্রায় ৬৭ মিমি, ১৫৫ মিমি ও ৩০০ মিমি উচ্চতা; অথবা PWD অনুযায়ী ৪ স্তরে) কংক্রিট ভরুন এবং প্রতিটি স্তরে ১৬ মিমি রড দিয়ে চারদিকে সমানভাবে ২৫ বার করে খোঁচান (Tamping)।',
      },
      {
        en: 'Ensure strokes for layers 2 and 3 just penetrate (~25 mm) into the underlying layer. Heap the top layer slightly before tamping, then strike off excess concrete flush with the cone rim using a sawing and rolling motion of the tamping rod.',
        bn: '২য় ও ৩য় স্তরে খোঁচানোর সময় রড যেন নিচের স্তরে প্রায় ২৫ মিমি প্রবেশ করে। উপরের স্তর পূর্ণ করে খোঁচানোর পর রড দিয়ে ডানে-বামে ঘষতে ঘষতে কোনের মুখের সাথে একদম সমান করে ফেলুন।',
      },
      {
        en: 'Clean spilled concrete around the outer base while holding the cone steady, then lift the cone vertically upward smoothly in 5 ± 2 seconds with zero lateral twisting or sideways jerk.',
        bn: 'কোনের গোড়ায় পড়া বাড়তি কংক্রিট পরিষ্কার করে পা সরিয়ে হাতল ধরে একদম সোজা উপরের দিকে ৫ ± ২ সেকেন্ডে তুলে নিন—কোনোভাবেই বাঁকা করবেন না বা ঝাঁকি দেবেন না।',
      },
      {
        en: 'Set the empty cone upright immediately next to the slumped mass, rest the tamping rod horizontally across the cone top, and measure the vertical distance from the rod underside to the displaced original center of the specimen (Slump = 300 - H_subsided). Complete the entire test within 2.5 minutes and classify True / Zero / Shear / Collapse profile.',
        bn: 'খালি কোনটি কংক্রিটের ঠিক পাশে সোজা রেখে তার মাথায় টেম্পিং রডটি আড়াআড়ি বসান এবং রডের নিচ থেকে কংক্রিটের মাঝখানের শীর্ষবিন্দু পর্যন্ত উল্লম্ব দূরত্ব মাপুন (Slump = ৩০০ - H_subsided)। ২.৫ মিনিটের মধ্যে কাজ শেষ করে স্লাম্পের ধরন (True/Zero/Shear/Collapse) ও তাপমাত্রা নোট করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Never conduct the slump test on top of vibrating slab formwork or near operating concrete mixers/generators—vibrations induce false settlement.',
          bn: 'কম্পন হচ্ছে এমন সাটারিংয়ের ওপর বা চালু মিক্সার/জেনারেটরের পাশে স্লাম্প টেস্ট করবেন না—কম্পনে কংক্রিট অতিরিক্ত বসে গিয়ে ভুল রিডিং দেবে।',
        },
        {
          en: 'Complete all filling, tamping, and lifting within 150 seconds (2.5 min) after sampling; delays in hot tropical weather (>30°C) falsely lower measured slump due to rapid slump loss.',
          bn: 'নমুনা নেয়ার ২.৫ মিনিটের মধ্যেই পরীক্ষা শেষ করুন; রোদের তাপে দেরি করলে কংক্রিট জমে গিয়ে ভুল কম স্লাম্প দেখাবে।',
        },
      ],
      contractorTricks: [
        {
          en: 'Over-Tamping & Sideways Cone Yanking: Foremen tamp 35–45 strokes or yank the cone slightly sideways so high-water soupy concrete bridges momentarily and appears stiffer.',
          bn: '২৫ বারের বেশি খোঁচানো বা বাঁকা করে কোন তোলা: সাইটে অনেক সময় ৩৫–৪০ বার খুঁচিয়ে বা এক ঝটকায় কোন তুলে পাতলা কংক্রিটকেও ঘন দেখানোর চেষ্টা করা হয়।',
        },
        {
          en: 'Unauthorized "Bucket of Water" Before Pumping: Pump operators add raw water into the RMC chute saying "concrete is jamming the pipe"—destroying the approved water-cement ratio (w/c). Only certified PCE superplasticizer dosage is allowed.',
          bn: 'পাম্পে পাইপ জ্যাম হওয়ার অজুহাতে মিক্সারে বালতি ভরে পানি ঢালা: মিস্ত্রি বা পাম্প চালক সহজে ঢালাই করতে পানি মেশায়, যা কংক্রিটের ডিজাইন শক্তি ৩০% পর্যন্ত কমিয়ে দেয়। শুধু অনুমোদিত অ্যাডমিক্সচারই অনুমোদিত।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Slump Value (mm & Inches) & Standard Tolerance', bn: 'স্লাম্প নির্ণয় সূত্র (মিমি ও ইঞ্চি)' },
          equation: 'Slump (mm) = 300 - H_subsided  |  Slump (in) = Slump_mm / 25.4',
          variables: [
            { en: 'H_cone = 300 mm (12 inches) standard Abrams cone height', bn: 'H_cone = ৩০০ মিমি (১২ ইঞ্চি) স্ট্যান্ডার্ড আব্রামস কোনের উচ্চতা' },
            { en: 'H_subsided = Height of subsided concrete center above base plate (mm)', bn: 'H_subsided = কোন তোলার পর কংক্রিটের কেন্দ্রের উচ্চতা (মিমি)' },
          ],
          unitNote: 'Element Targets: Road Pavement 25–50mm (1"–2"); Mass Footing 50–75mm (2"–3"); Normal Beam/Slab/Col 75–125mm (3"–5"); Pumped Concrete 100–150mm (4"–6"); Bored Pile Tremie 150–200mm (6"–8"). Max Temp ≤ 32°C.',
        },
      ],
      workedExample: {
        en: 'For a Normal Beam/Slab/Column pour (Target 75–125 mm), the subsided center height measures H_subsided = 195 mm with True Slump profile and T = 29.5°C → Slump = 300 - 195 = 105 mm (4.13 in) → Inside 75–125 mm & Temp ≤ 32°C → PASS.',
        bn: 'সাধারণ বিম/স্ল্যাব/কলামের (লক্ষ্য ৭৫–১২৫ মিমি) পরীক্ষায় কংক্রিটের উচ্চতা ১৯৫ মিমি ও True Slump এবং তাপমাত্রা ২৯.৫°সে পাওয়া গেলে → স্লাম্প = ৩০০ - ১৯৫ = ১০৫ মিমি (৪.১৩ ইঞ্চি) → অনুমোদিত সীমায় PASS।',
      },
    },
    acceptanceRanges: [
      {
        tier: 'PASS',
        rangeLabel: 'True Slump within Element Band & Temp ≤ 32.0°C',
        codeLimit: 'ASTM C143 / ASTM C94 / BNBC',
        interpretation: {
          en: 'Cohesive, workable concrete matching design water-cement ratio. Approve immediate pouring and consolidation.',
          bn: 'সঠিক ওয়ার্কঅ্যাবিলিটি ও নিরাপদ তাপমাত্রা—তৎক্ষণাৎ ঢালাই ও ভাইব্রেটিংয়ের অনুমতি দিন।',
        },
      },
      {
        tier: 'WARNING',
        rangeLabel: 'Shear Slump OR ±15 mm Margin OR Temp 32.1–35.0°C',
        codeLimit: 'Re-Mix / Retest / Admixture',
        interpretation: {
          en: 'Shear slump indicates lack of cohesion/harsh mix (re-sample & retest once). If slightly stiff (< target), dose approved superplasticizer per supplier chart—NEVER add raw water.',
          bn: 'শেয়ার স্লাম্প হলে মিক্সার পুনরায় ঘুরিয়ে ২য় নমুনা পরীক্ষা করুন। স্লাম্প সামান্য কম থাকলে শুধু অনুমোদিত অ্যাডমিক্সচার দিন, পানি নয়।',
        },
      },
      {
        tier: 'FAIL',
        rangeLabel: 'Collapse Slump OR >25 mm Outside Band OR Temp > 35.0°C',
        codeLimit: 'REJECT TRANSIT MIXER',
        interpretation: {
          en: 'Collapse slump proves severe excess water/segregation or harsh wet tampering. Reject the transit mixer truck immediately from site.',
          bn: 'কলাপ্স স্লাম্প (Collapse) মানে অতিরিক্ত পানি বা সেগ্রিগেশন—এই কংক্রিট কাঠামো ধ্বংস করবে; পুরো ট্রাক সাইট থেকে ফেরত পাঠান।',
        },
      },
    ],
    remedialActions: [
      {
        en: 'Shear Slump observed: Discard sample, remix drum for 2 minutes, and retest a fresh sample; two consecutive Shear Slumps require fine-aggregate/water-cement redesign.',
        bn: 'শেয়ার স্লাম্প দেখা দিলে ড্রাম ২ মিনিট ঘুরিয়ে নতুন নমুনা পরীক্ষা করুন; পরপর দুবার শেয়ার স্লাম্প হলে বালির পরিমাণ ও মিক্স ডিজাইন সংশোধন করুন।',
      },
      {
        en: 'Collapse Slump or Over-Slump (> limit + 25 mm): Reject truckload unconditionally. Never attempt to stiffen wet concrete by throwing dry cement powder into the drum.',
        bn: 'কলাপ্স স্লাম্প হলে ট্রাক সরাসরি রিজেক্ট করুন—ভুলেও শুকনো সিমেন্ট মিশিয়ে কংক্রিট শক্ত করার চেষ্টা করবেন না।',
      },
    ],
    calculatorInputs: [
      {
        key: 'elementPresetCode',
        label: { en: 'Structural Element Slump Preset', bn: 'স্ট্রাকচারাল মেম্বার ও স্ট্যান্ডার্ড স্লাম্প সীমা' },
        unit: '',
        defaultValue: 3,
        options: [
          { value: 1, label: { en: 'Road Pavement / Mass Dry (25–50 mm | 1"–2")', bn: 'রোড পেভমেন্ট (২৫–৫০ মিমি)' } },
          { value: 2, label: { en: 'Mass Footing / Sub-Structure (50–75 mm | 2"–3")', bn: 'ফুটিং ও ম্যাস ফাউন্ডেশন (৫০–৭৫ মিমি)' } },
          { value: 3, label: { en: 'Normal Beam, Slab & Column (75–125 mm | 3"–5")', bn: 'সাধারণ বিম, ছাদ ও কলাম (৭৫–১২৫ মিমি)' } },
          { value: 4, label: { en: 'Pumped Concrete / Dense Rebar (100–150 mm | 4"–6")', bn: 'পাম্প কংক্রিট / ঘন রড (১০০–১৫০ মিমি)' } },
          { value: 5, label: { en: 'Cast-in-Situ Bored Pile Tremie (150–200 mm | 6"–8")', bn: 'বোরড পাইল ট্রেমি ঢালাই (১৫০–২০০ মিমি)' } },
        ],
      },
      {
        key: 'slumpTypeCode',
        label: { en: 'Observed Slump Shape / Profile', bn: 'পর্যবেক্ষিত স্লাম্পের আকৃতি' },
        unit: '',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'True Slump (Uniform vertical drop — Valid)', bn: 'ট্রু স্লাম্প (সমানভাবে নিচে নামা — সঠিক)' } },
          { value: 2, label: { en: 'Zero Slump (No measurable drop — Dry mix)', bn: 'জিরো স্লাম্প (একদমই নামেনি — অতি শুকনো)' } },
          { value: 3, label: { en: 'Shear Slump (Half slides diagonally — Retest)', bn: 'শেয়ার স্লাম্প (এক পাশ ধসে পড়া — পুনঃপরীক্ষা)' } },
          { value: 4, label: { en: 'Collapse Slump (Flattens like soup — Reject)', bn: 'কলাপ্স স্লাম্প (পানির মতো ছড়িয়ে যাওয়া — বাতিল)' } },
        ],
      },
      {
        key: 'subsidedHeightMm',
        label: { en: 'Subsided Concrete Top Height (H_subsided)', bn: 'কোন তোলার পর কংক্রিটের উচ্চতা (H_subsided)' },
        unit: 'mm',
        defaultValue: 195,
        min: 0,
        max: 300,
        step: 5,
      },
      {
        key: 'concreteTempC',
        label: { en: 'Fresh Concrete Temperature', bn: 'তাজা কংক্রিটের তাপমাত্রা' },
        unit: '°C',
        defaultValue: 29.5,
        min: 5,
        max: 45,
        step: 0.5,
      },
    ],
  },

  // 4.2 CONCRETE CYLINDER & CUBE COMPRESSIVE STRENGTH TEST
  {
    id: 'con-cylinder-cube',
    domainId: 'concrete-ndt',
    code: 'LAB-CON-02',
    title: {
      en: 'Concrete Cylinder (Ø100/150) & Cube (150mm) Compressive Strength (BNBC / ACI 318)',
      bn: 'কংক্রিটের সিলিন্ডার ও কিউব কম্প্রেসিভ স্ট্রেন্থ পরীক্ষা (BNBC-2020 ও ACI 318)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি ক্রাশিং পরীক্ষা',
    governingCodes: ['ASTM C39 / C31', 'ACI 318-19 §26.12.3', 'BS EN 12390-3', 'BNBC-2020 Part 6'],
    objective: {
      en: 'Directly verifies that structural concrete in columns, shear walls, beams, piles, and slabs attains the specified design compressive strength f\'c at 28 days—and meets BNBC-2020 / ACI 318-19 strict dual statistical criteria across 3 consecutive tests plus 7d/14d early curing strength maturity checkpoints.',
      bn: 'কলাম, বিম, শিয়ার ওয়াল, পাইল ও ছাদের কংক্রিট ২৮ দিনে নির্ধারিত ডিজাইন শক্তি (f\'c) এবং ৭/১৪ দিনে আনুপাতিক শক্তি অর্জন করেছে কিনা তা যাচাই করে—ACI 318-19 ও BNBC-2020-এর কঠোর দ্বৈত শর্ত (৩টি ধারাবাহিক টেস্টের গড় ও একক টেস্টের সর্বনিম্ন সীমা) অনুসারে।',
    },
    sampling: {
      frequency: {
        en: 'BNBC-2020 / ACI 318 §26.12.2: Minimum 1 strength test (3 cylinders at 28d + 2–3 companion cylinders at 7d/14d) per day, or per 110 m³ (40–100 m³ in Bangladesh PWD practice), or per 460 m² of slab/wall area, whichever requires the most samples.',
        bn: 'BNBC / PWD নিয়ম: প্রতিটি ঢালাইয়ের দিন অথবা প্রতি ৪০–১০০ ঘনমিটার কংক্রিটে কমপক্ষে ১টি সেট (২৮ দিনের জন্য ৩টি + ৭/১৪ দিনের জন্য ৩টি সিলিন্ডার বা কিউব)।',
      },
      quantity: {
        en: 'Standard Ø150×300 mm Cylinder (A = 17,671.5 mm²), Ø100×200 mm Cylinder (A = 7,854.0 mm²), or 150×150 mm Cube (A = 22,500 mm², where f\'_cyl ≈ 0.80 × f_cube).',
        bn: '১৫০×৩০০ মিমি সিলিন্ডার (A = ১৭,৬৭১.৫ মিমি²), ১০০×২০০ মিমি সিলিন্ডার (A = ৭,৮৫৪ মিমি²), অথবা ১৫০×১৫০ মিমি কিউব (A = ২২,৫০০ মিমি²; সিলিন্ডার ≈ ০.৮০ × কিউব)।',
      },
      lotSize: {
        en: 'Single structural concrete grade pour (e.g., 4th Floor Columns & Beams).',
        bn: 'একটি নির্দিষ্ট ফ্লোর বা স্ট্রাকচারাল মেম্বারের ঢালাই ব্যাচ।',
      },
    },
    apparatus: [
      {
        item: { en: '2000 kN Calibrated Compression Testing Machine (CTM)', bn: '২০০০ kN ক্যালিব্রেটেড কম্প্রেশন টেস্টিং মেশিন (CTM)' },
        spec: '±1% load accuracy, loading rate 0.25 ± 0.05 MPa/s (35 ± 7 psi/s)',
      },
      {
        item: { en: 'Heavy Cast-Iron / Steel Moulds, Neoprene/Sulfur Caps & Immersion Curing Tank', bn: 'লোহার সিলিন্ডার/কিউব মোল্ড, ক্যাপিং প্যাড ও কিউরিং ট্যাংক' },
        spec: '27 ± 2°C lime-saturated clean water curing until test hour',
      },
    ],
    procedure: [
      {
        en: 'Cast 150×300 mm cylinders in 3 equal layers (or 100×200 mm in 2 layers), rodding each layer 25 times with a 16 mm (or 10 mm) tamping rod and lightly tapping mould sides 10–15 times with a rubber mallet to expel air pockets.',
        bn: '১৫০×৩০০ মিমি সিলিন্ডার ৩ স্তরে (বা ১০০×২০০ মিমি ২ স্তরে) ঢেলে প্রতি স্তর ২৫ বার টেম্পিং রড দিয়ে খোঁচান এবং রাবার ম্যালেট দিয়ে পাশে ১০–১৫ বার মৃদু টোকা দিয়ে বাতাস বের করুন।',
      },
      {
        en: 'Cover top against evaporation for 24 ± 4 hours, demould carefully, engrave pour ID & date on the side, and immediately submerge in clean water curing tank at 27 ± 2°C.',
        bn: 'ঢালাইয়ের ২৪ ± ৪ ঘণ্টা পর মোল্ড খুলে গায়ে পোর নম্বর ও তারিখ খোদাই করে সাথে সাথেই পরিষ্কার পানির কিউরিং ট্যাংকে ডুবিয়ে রাখুন।',
      },
      {
        en: 'At Day 7 (milestone check: expect 65–70% of f\'c), Day 14 (expect 85–90%), or Day 28 (full ≥ 100%), remove specimens from water, wipe surface saturated dry, measure actual cross-section, cap/pad top and bottom flat faces.',
        bn: '৭ দিন (আশা ৬৫–৭০%), ১৪ দিন (৮৫–৯০%), বা ২৮ দিন পূর্ণ হলে পানি থেকে তুলে ভেজা অবস্থাতেই মাপ নিয়ে ক্যাপিং বা নিওপ্রিন প্যাডসহ মেশিনের কেন্দ্রে বসান।',
      },
      {
        en: 'Load smoothly at 0.25 MPa/s until peak failure P_max (kN). Average the companion specimens of the current test (f_test3), then apply the strict BNBC-2020 / ACI 318-19 3-consecutive-test average and single-test lower bound criteria.',
        bn: 'সেকেন্ডে ০.২৫ MPa গতিতে সমভাবে চাপ দিয়ে ভাঙার সর্বোচ্চ লোড P_max (kN) নিন। এই ব্যাচের নমুনাগুলোর গড় (f_test3) বের করে আগের দুটি ধারাবাহিক টেস্টের সাথে গড় (≥ f\'c) এবং সর্বনিম্ন একক সীমা যাচাই করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Never air-dry concrete cylinders overnight before crushing—dry specimens yield artificially 10–18% higher strength than standard wet-tested specimens per ASTM C39.',
          bn: 'ক্রাশিং করার আগে সিলিন্ডার শুকাবেন না—শুকনো সিলিন্ডার ভেজা সিলিন্ডারের চেয়ে ভুয়াভাবে ১০–১৮% বেশি শক্তি দেখায়।',
        },
        {
          en: 'Verify specimen ends are perpendicular within 0.5°; uneven un-capped tops concentrate stress on a single corner and cause premature 25% lower diagonal splitting.',
          bn: 'সিলিন্ডারের ওপর ও নিচের তল একদম সমতল রাখুন—বাঁকা হলে এক কোণায় চাপ পড়ে ২৫% কম শক্তিতে ভেঙে যাবে।',
        },
      ],
      contractorTricks: [
        {
          en: '"Rich Pocket Specimen Casting": Unscrupulous crews add an extra shovelful of cement into the test bucket or take samples before adding water to the truck, producing 35 MPa lab cylinders while the real slab is only 18 MPa.',
          bn: 'স্পেশাল ব্যাচ থেকে সিলিন্ডার ঢালাই: অনেক সময় ল্যাবে পাসের জন্য বালতিতে বাড়তি সিমেন্ট মিশিয়ে সিলিন্ডার বানানো হয়! সর্বদা নিজে দাঁড়িয়ে সরাসরি পাম্প/মিক্সারের মধ্যভাগ থেকে স্যাম্পল নিন।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Cylinder / Cube Compressive Strength & Conversion', bn: 'সিলিন্ডার ও কিউব কম্প্রেসিভ স্ট্রেন্থ সূত্র' },
          equation: 'A_cyl = π·d²/4  |  A_cube = b²  |  f_c (MPa) = (P_max × 1000) / A_mm2  |  f\'_cyl ≈ 0.80 × f_cube',
          variables: [
            { en: 'A_cyl = 17,671.5 mm² (Ø150mm) or 7,854.0 mm² (Ø100mm); A_cube = 22,500 mm² (150mm)', bn: 'A_cyl = ১৭,৬৭১.৫ মিমি² (Ø১৫০) বা ৭,৮৫৪ মিমি² (Ø১০০); A_cube = ২২,৫০০ মিমি²' },
            { en: '1 MPa = 145.038 psi (e.g., 25 MPa ≈ 3,626 psi; 30 MPa ≈ 4,351 psi)', bn: '১ MPa = ১৪৫.০৩৮ psi (যেমন ২৫ MPa = ৩,৬২৬ psi)' },
          ],
          unitNote: 'BNBC-2020 / ACI 318-19 28d Rules: (1) 3-Consecutive Test Avg ≥ f\'c; (2) No single test < (f\'c - 3.5 MPa) when f\'c ≤ 35 MPa, OR < 0.90·f\'c when f\'c > 35 MPa. Maturity: 7d ≈ 65–70%, 14d ≈ 85–90%, 28d ≥ 100%.',
        },
      ],
      workedExample: {
        en: 'M25 (f\'c = 25 MPa) 150×300 mm cylinders at 28d fail at 475, 490, 465 kN → Specimen strengths = 26.88, 27.73, 26.31 MPa → Current Test Avg = 26.97 MPa (3,912 psi). Combined with prev tests [25.80, 26.20 MPa], 3-Consecutive Avg = 26.32 MPa ≥ 25.0 MPa, and Min Single Test = 25.80 ≥ 21.5 MPa → PASS.',
        bn: 'M25 গ্রেডে ১৫০×৩০০ মিমি সিলিন্ডার ২৮ দিনে ৪৭৫, ৪৯০, ৪৬৫ kN-এ ভাঙলে গড় শক্তি = ২৬.৯৭ MPa। আগের দুটি টেস্টের (২৫.৮ ও ২৬.২) সাথে ৩টির ধারাবাহিক গড় = ২৬.৩২ MPa (≥ ২৫.০) এবং সর্বনিম্ন ২৫.৮০ ≥ ২১.৫ MPa → PASS।',
      },
    },
    acceptanceRanges: [
      {
        tier: 'PASS',
        rangeLabel: '3-Test Avg ≥ Req. & Single Test ≥ (f\'c - 3.5 MPa or 0.90·f\'c)',
        codeLimit: 'BNBC-2020 / ACI 318 §26.12.3',
        interpretation: {
          en: 'Satisfies both BNBC-2020 & ACI 318-19 acceptance rules cleanly. Approve formwork stripping and proceed with superstructure.',
          bn: 'BNBC-2020 এবং ACI 318-19-এর উভয় শর্ত শতভাগ পূরণ হয়েছে। সাটারিং খোলা ও পরবর্তী ফ্লোরের কাজ অনুমোদিত।',
        },
      },
      {
        tier: 'WARNING',
        rangeLabel: '7d/14d Early Below Expected OR 3-Test Avg < Req. (Single Test Still Above Floor)',
        codeLimit: 'Investigate Mix & Extend Curing',
        interpretation: {
          en: 'Early 7d (<65%) or 14d (<85%) low gain with PCC blended cement or 3-test rolling average marginally below f\'c triggers immediate mix-design check, extended wet curing, and NDT verification.',
          bn: '৭/১৪ দিনে শক্তি কিছুটা কম (PCC সিমেন্টে হতে পারে) অথবা ৩-টেস্টের গড় সামান্য কম হলে কিউরিং বাড়িয়ে ২৮ দিনের ফলাফল ও এনডিটি পরীক্ষা করুন।',
        },
      },
      {
        tier: 'FAIL',
        rangeLabel: 'Single Test < (f\'c - 3.5 MPa if ≤35) OR < 0.90·f\'c (if >35)',
        codeLimit: 'MANDATORY CORE TEST (ASTM C42)',
        interpretation: {
          en: 'Structural non-conformance per ACI 318-19! Halt loading/casting above suspect member immediately and extract 3 drilled cores per ASTM C42.',
          bn: 'একক টেস্ট সর্বনিম্ন কোড সীমার নিচে নেমে গেছে! ওপরের তলার ঢালাই বন্ধ করে ASTM C42 অনুযায়ী ৩টি কোর কাটিং টেস্ট করুন।',
        },
      },
    ],
    remedialActions: [
      {
        en: 'Per ACI 318-19 §26.12.4, if any individual strength test falls below f\'c - 3.5 MPa (or < 0.90·f\'c when f\'c > 35 MPa), take 3 drilled cores from the zone represented. Structural adequacy is confirmed only if core avg ≥ 0.85·f\'c and no single core < 0.75·f\'c.',
        bn: 'কোনো একক টেস্ট সর্বনিম্ন সীমার নিচে গেলে ওই অংশ থেকে ৩টি কোর কেটে পরীক্ষা করুন—কোরের গড় ≥ ০.৮৫ f\'c এবং প্রতিটি ≥ ০.৭৫ f\'c হতে হবে, নতুবা স্ট্রাকচারাল রেট্রোফিটিং/জ্যাকেটিং করতে হবে।',
      },
      {
        en: 'Sync this result with one click directly into Project Cube-Tests Register (SM-08) to keep curing & deshuttering schedules synchronized.',
        bn: 'প্রকল্পের কিউব টেস্ট রেজিস্টার (SM-08)-এর সাথে ১-ক্লিকে সিঙ্ক করে সাটারিং খোলার সময়সূচি আপডেট রাখুন।',
      },
    ],
    calculatorInputs: [
      {
        key: 'specTypeCode',
        label: { en: 'Specimen Size & Type', bn: 'নমুনার মাপ ও ধরন' },
        unit: '',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Standard Cylinder Ø150 × 300 mm (A = 17,671 mm²)', bn: 'স্ট্যান্ডার্ড সিলিন্ডার Ø১৫০×৩০০ মিমি' } },
          { value: 2, label: { en: 'Standard Cube 150 × 150 mm (0.80× Cyl Factor)', bn: 'স্ট্যান্ডার্ড কিউব ১৫০×১৫০ মিমি (০.৮০ ফ্যাক্টর)' } },
          { value: 3, label: { en: 'Compact Cylinder Ø100 × 200 mm (A = 7,854 mm²)', bn: 'ছোট সিলিন্ডার Ø১০০×২০০ মিমি' } },
        ],
      },
      {
        key: 'designFcMpa',
        label: { en: 'Specified 28-Day Design Strength (f\'c)', bn: 'নির্ধারিত ২৮-দিনের ডিজাইন শক্তি (f\'c)' },
        unit: 'MPa',
        defaultValue: 25,
        min: 15,
        max: 65,
        step: 0.5,
      },
      {
        key: 'testAgeDays',
        label: { en: 'Curing Age at Crushing (Days)', bn: 'পরীক্ষার বয়স (দিন)' },
        unit: '',
        defaultValue: 28,
        options: [
          { value: 7, label: { en: '7 Days (Expect ~65–70% of f\'c)', bn: '৭ দিন (প্রত্যাশিত ~৬৫–৭০%)' } },
          { value: 14, label: { en: '14 Days (Expect ~85–90% of f\'c)', bn: '১৪ দিন (প্রত্যাশিত ~৮৫–৯০%)' } },
          { value: 28, label: { en: '28 Days (Full Design ≥ 100% f\'c)', bn: '২৮ দিন (পূর্ণ ১০০% ডিজাইন শক্তি)' } },
        ],
      },
      { key: 'load1Kn', label: { en: 'Specimen #1 Peak Load (P₁)', bn: 'নমুনা #১ ভাঙার লোড (P₁)' }, unit: 'kN', defaultValue: 475, min: 20, max: 2500, step: 1 },
      { key: 'load2Kn', label: { en: 'Specimen #2 Peak Load (P₂)', bn: 'নমুনা #২ ভাঙার লোড (P₂)' }, unit: 'kN', defaultValue: 490, min: 20, max: 2500, step: 1 },
      { key: 'load3Kn', label: { en: 'Specimen #3 Peak Load (P₃)', bn: 'নমুনা #৩ ভাঙার লোড (P₃)' }, unit: 'kN', defaultValue: 465, min: 20, max: 2500, step: 1 },
      { key: 'prevTest1Mpa', label: { en: 'Previous Consecutive Test #1 Avg (Cyl. Equiv.)', bn: 'পূর্ববর্তী টেস্ট #১-এর গড় (সিলিন্ডার সমতুল্য)' }, unit: 'MPa', defaultValue: 25.8, min: 5, max: 80, step: 0.1 },
      { key: 'prevTest2Mpa', label: { en: 'Previous Consecutive Test #2 Avg (Cyl. Equiv.)', bn: 'পূর্ববর্তী টেস্ট #২-এর গড় (সিলিন্ডার সমতুল্য)' }, unit: 'MPa', defaultValue: 26.2, min: 5, max: 80, step: 0.1 },
    ],
  },

  // 4.3 DRILLED CONCRETE CORE TEST (ASTM C42)
  {
    id: 'con-core-cutting',
    domainId: 'concrete-ndt',
    code: 'LAB-CON-03',
    title: {
      en: 'Drilled Concrete Core Compressive Strength Test (L/D Correction & ACI 318 Audit)',
      bn: 'ড্রিলড কংক্রিট কোর কাটিং ও স্ট্রাকচারাল শক্তি যাচাই পরীক্ষা (ASTM C42)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি কোর ক্রাশিং পরীক্ষা',
    governingCodes: ['ASTM C42 / C42M', 'ACI 318-19 §26.12.4', 'BS EN 12504-1', 'BNBC-2020'],
    objective: {
      en: 'Serves as the decisive legal and structural referee test whenever 28-day cylinders fail, honeycombing is uncovered after deshuttering, or older buildings undergo seismic retrofitting assessment. Determines true in-situ concrete strength after applying L/D aspect-ratio correction factor k_ld.',
      bn: 'যখন ২৮ দিনের সিলিন্ডার টেস্ট ফেল করে, সাটারিং খোলার পর কংক্রিটে হানিকম্ব দেখা যায় অথবা পুরনো ভবনের রেট্রোফিটিং অ্যাসেসমেন্ট প্রয়োজন হয়, তখন সরাসরি ভবনের কলাম/বিম/ছাদ থেকে কোর কেটে প্রকৃত শক্তি নির্ণয়ের চূড়ান্ত রেফারি পরীক্ষা।',
    },
    sampling: {
      frequency: {
        en: 'Minimum 3 drilled cores for each strength test result falling below ACI 318 limits or each suspect structural member/pour zone.',
        bn: 'প্রতিটি সন্দেহজনক পোর জোন বা ফেল করা সিলিন্ডার ব্যাচের বিপরীতে কমপক্ষে ৩টি ড্রিলড কোর।',
      },
      quantity: {
        en: '3 undamaged cylindrical cores ideally Ø94–100 mm (min Ø75 mm ≥ 2× max aggregate size) with trimmed capped length-to-diameter ratio L/D between 1.00 and 2.00.',
        bn: 'অন্তত ৭৫–১০০ মিমি ব্যাসের ৩টি অক্ষত কোর—যার L/D অনুপাত ১.০০ থেকে ২.০০-এর মধ্যে এবং ভেতরে কোনো রড কাটা না থাকে।',
      },
      lotSize: {
        en: 'Suspect column/beam/slab bay represented by failed cylinder lot.',
        bn: 'ফেল করা ব্যাচ বা সন্দেহজনক কলাম/বিম/স্ল্যাব জোন।',
      },
    },
    apparatus: [
      {
        item: { en: 'Diamond Core Drilling Rig + Cover Meter (Ferroscan)', bn: 'ডায়মন্ড কোর ড্রিলিং মেশিন ও রিবার লোকেটর (Ferroscan)' },
        spec: 'Zero-vibration anchor rig; locate rebar beforehand to avoid cutting bars',
      },
      {
        item: { en: 'Diamond Saw, Sulfur/High-Strength Cap & 2000 kN CTM', bn: 'ডায়মন্ড করাত, সালফার ক্যাপিং ও কম্প্রেশন মেশিন' },
        spec: 'Ends sawed square & sulfur-capped ≤ 3 mm thick; vernier caliper ±0.1 mm',
      },
    ],
    procedure: [
      {
        en: 'Scan the column/beam/slab surface using a Rebar Cover Meter (Ferroscan) and mark clear rebar-free drilling windows. Never cut main longitudinal reinforcement.',
        bn: 'কোর ড্রিল করার আগে রিবার লোকেটর দিয়ে রডের অবস্থান চিহ্নিত করুন—কোনোভাবেই মূল লম্বালম্বি রড কাটা যাবে না।',
      },
      {
        en: 'Anchor the diamond core rig rigidly, drill slowly with steady water cooling, extract cores carefully, and immediately inspect for cracks, voids, or trapped rebar.',
        bn: 'ড্রিলিং মেশিন শক্তভাবে বসিয়ে পানি প্রবাহ বজায় রেখে ধীরে ধীরে কোর কেটে বের করুন এবং ফাটল বা রডের অংশ আছে কিনা দেখুন।',
      },
      {
        en: 'Saw both ends square with a water-cooled diamond saw so L/D sits between 1.00 and 2.00 (ideal ≥ 1.75). Measure diameter D at two perpendicular mid-height axes and capped length L.',
        bn: 'কোরের দুই মাথা সমকোণে কেটে L/D অনুপাত ১.০০ থেকে ২.০০-এর মধ্যে (আদর্শ ≥ ১.৭৫) আনুন এবং ক্যালিপারে সঠিক ব্যাস D ও দৈর্ঘ্য L মাপুন।',
      },
      {
        en: 'Per ASTM C42, condition cores in sealed plastic bags for ≥ 5 days after final wetting (or dry if structure is dry in service) before capping and crushing in CTM at 0.25 MPa/s.',
        bn: 'ASTM C42 অনুযায়ী আর্দ্রতা স্থিতিশীল করে (সিলড ব্যাগে কমপক্ষে ৫ দিন রেখে বা ডিজাইন পরিবেশ অনুযায়ী) ক্যাপিং শেষে ০.২৫ MPa/s গতিতে মেশিনে ভাঙুন।',
      },
      {
        en: 'Apply ASTM C42 L/D correction factor k_ld (1.00→0.87, 1.25→0.93, 1.50→0.96, 1.75→0.98, 2.00→1.00) to compute corrected core strengths and verify ACI 318 dual threshold (Avg ≥ 0.85 f\'c & Min ≥ 0.75 f\'c).',
        bn: 'L/D অনুপাত অনুযায়ী কোড কারেকশন ফ্যাক্টর k_ld গুণ করে প্রকৃত কোর শক্তি বের করুন এবং ৩টির গড় ≥ ০.৮৫ f\'c ও সর্বনিম্ন ≥ ০.৭৫ f\'c আছে কিনা যাচাই করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Cores with L/D < 1.00 are invalid under ASTM C42 and must be discarded; cores containing embedded steel rebar perpendicular to load axis should be rejected or drilled freshly nearby.',
          bn: 'যে কোরের L/D অনুপাত ১.০০-এর কম বা যার ভেতরে রডের টুকরা আটকে আছে তা ASTM C42 অনুযায়ী বাতিল গণ্য হবে।',
        },
        {
          en: 'Patch every drilled core hole immediately using non-shrink high-strength structural grout (e.g., Sikagrout / Conbextra GP2) + bonding agent.',
          bn: 'কোর কাটার পর গর্তগুলো তৎক্ষণাৎ নন-শ্রিঙ্ক হাই-স্ট্রেন্থ গ্রাউট ও বন্ডিং এজেন্ট দিয়ে নিখুঁতভাবে ভরাট করুন।',
        },
      ],
      contractorTricks: [
        {
          en: 'Testing Cores Bone-Dry in Oven or Without L/D Factor: Crushing a short core (L/D = 1.0) without multiplying by k_ld = 0.87 overestimates concrete strength by 15%—turning a failed 20 MPa core into a fake 23 MPa pass!',
          bn: 'L/D কারেকশন ফ্যাক্টর না দেয়া ও কোর শুকিয়ে ভাঙা: L/D = ১.০ কোরের সাথে ০.৮৭ গুণ না করলে শক্তি ১৫% বেশি দেখায়, যা ফেল করা কংক্রিটকেও ভুয়া পাস দেখাতে পারে!',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'ASTM C42 L/D Correction & Corrected Core Strength', bn: 'কোর কারেকশন ফ্যাক্টর ও সংশোধিত শক্তি সূত্র' },
          equation: 'f_core,corr = k_ld × [ (P_max × 1000) / (π·D²/4) ]',
          variables: [
            { en: 'k_ld (ASTM C42 Table): L/D 2.00→1.00 | 1.75→0.98 | 1.50→0.96 | 1.25→0.93 | 1.00→0.87', bn: 'k_ld মান: L/D ২.০০→১.০০ | ১.৭৫→০.৯৮ | ১.৫০→০.৯৬ | ১.২৫→০.৯৩ | ১.০০→০.৮৭' },
            { en: 'ACI 318 §26.12.4 Adequacy: 3-Core Avg ≥ 0.85·f\'c AND No Single Core < 0.75·f\'c', bn: 'ACI 318 শর্ত: ৩ কোরের গড় ≥ ০.৮৫·f\'c এবং কোনো একক কোর < ০.৭৫·f\'c হবে না' },
          ],
          unitNote: 'Note: In-situ drilled core strengths naturally read ~15% lower than ideal lab-cured cylinders due to field compaction, bleeding & drilling micro-disturbance.',
        },
      ],
      workedExample: {
        en: 'For M25 concrete (0.85·f\'c = 21.25 MPa, 0.75·f\'c = 18.75 MPa), three Ø100 mm cores (A = 7,854 mm²) trimmed to L = 175 mm (L/D = 1.75 → k_ld = 0.98) break at 178, 184, 172 kN → Corrected strengths = 22.21, 22.96, 21.46 MPa → Avg = 22.21 MPa (≥ 21.25) & Min = 21.46 (≥ 18.75) → PASS.',
        bn: 'M25 কংক্রিটে (সর্বনিম্ন গড় ২১.২৫, একক ১৮.৭৫ MPa) ৩টি ১০০ মিমি কোর L=১৭৫ মিমি (k_ld=০.৯৮) ১৭৮, ১৮৪, ১৭২ kN-এ ভাঙলে সংশোধিত গড় = ২২.২১ MPa (≥ ২১.২৫) ও সর্বনিম্ন ২১.৪৬ (≥ ১৮.৭৫) → PASS।',
      },
    },
    acceptanceRanges: [
      {
        tier: 'PASS',
        rangeLabel: '3-Core Avg ≥ 0.85·f\'c AND Min Core ≥ 0.75·f\'c',
        codeLimit: 'ACI 318-19 §26.12.4 / BNBC',
        interpretation: {
          en: 'Structural adequacy confirmed in place despite earlier cylinder discrepancy; repair core cavities with non-shrink grout and accept member.',
          bn: 'কংক্রিটের কাঠামোগত সক্ষমতা প্রমাণিত হয়েছে—কোরের গর্ত নন-শ্রিঙ্ক গ্রাউট দিয়ে ভরে মেম্বার অনুমোদন করুন।',
        },
      },
      {
        tier: 'WARNING',
        rangeLabel: 'L/D < 1.00 OR One Criterion Marginal (Within 5%)',
        codeLimit: 'Invalid Geometry / Re-Drill',
        interpretation: {
          en: 'Short core (L/D < 1.0) is inadmissible per ASTM C42, or results sit right on the 0.85/0.75 boundary; perform full structural load-capacity re-analysis before acceptance.',
          bn: 'L/D অনুপাত ১.০০-এর কম হলে নতুন দীর্ঘ কোর কাটুন অথবা সীমান্তবর্তী ক্ষেত্রে স্ট্রাকচারাল ইঞ্জিনিয়ারকে দিয়ে ফ্যাক্টর-অব-সেফটি পুনর্বিবেচনা করান।',
        },
      },
      {
        tier: 'FAIL',
        rangeLabel: '3-Core Avg < 0.85·f\'c OR Any Single Core < 0.75·f\'c',
        codeLimit: 'RETROFIT / LOAD TEST / DEMOLISH',
        interpretation: {
          en: 'In-situ structural strength fails BNBC/ACI 318 minimums. Perform structural RC jacketing, FRP wrapping, full-scale load test, or remove & recast.',
          bn: 'কোর টেস্টে কাঠামো অযোগ্য প্রমাণিত! অবিলম্বে আরসিসি জ্যাকেটিং, কার্বন ফাইবার র‍্যাপিং, ফুল-স্কেল লোড টেস্ট অথবা ভেঙে পুনর্নির্মাণ করতে হবে।',
        },
      },
    ],
    remedialActions: [
      {
        en: 'If columns fail ASTM C42 criteria, engage the Engineer of Record immediately to design Reinforced Concrete (RC) Jacketing with dowel shear keys or CFRP confinement.',
        bn: 'কলাম কোর টেস্টে ফেল করলে স্ট্রাকচারাল ইঞ্জিনিয়ারের ডিজাইন অনুযায়ী আরসিসি জ্যাকেটিং বা সিএফআরপি র‍্যাপিং করতে হবে।',
      },
    ],
    calculatorInputs: [
      { key: 'coreDiaMm', label: { en: 'Measured Core Diameter (D)', bn: 'কোরের গড় ব্যাস (D)' }, unit: 'mm', defaultValue: 100, min: 50, max: 160, step: 1 },
      { key: 'coreLenMm', label: { en: 'Capped Core Length (L)', bn: 'ক্যাপিংসহ কোর দৈর্ঘ্য (L)' }, unit: 'mm', defaultValue: 175, min: 60, max: 320, step: 1 },
      { key: 'designFcMpa', label: { en: 'Specified Design Strength (f\'c)', bn: 'ডিজাইন শক্তি (f\'c)' }, unit: 'MPa', defaultValue: 25, min: 15, max: 65, step: 0.5 },
      { key: 'core1LoadKn', label: { en: 'Core #1 Failure Load (P₁)', bn: 'কোর #১ ভাঙা লোড (P₁)' }, unit: 'kN', defaultValue: 178, min: 10, max: 1200, step: 1 },
      { key: 'core2LoadKn', label: { en: 'Core #2 Failure Load (P₂)', bn: 'কোর #২ ভাঙা লোড (P₂)' }, unit: 'kN', defaultValue: 184, min: 10, max: 1200, step: 1 },
      { key: 'core3LoadKn', label: { en: 'Core #3 Failure Load (P₃)', bn: 'কোর #৩ ভাঙা লোড (P₃)' }, unit: 'kN', defaultValue: 172, min: 10, max: 1200, step: 1 },
    ],
  },

  // 4.4 REBOUND (SCHMIDT) HAMMER NDT (ASTM C805)
  {
    id: 'con-rebound-hammer',
    domainId: 'concrete-ndt',
    code: 'LAB-CON-04',
    title: {
      en: 'Rebound (Schmidt) Hammer NDT Surface Hardness & Strength Audit (10-Reading Grid)',
      bn: 'রিবাউন্ড (শ্মিড) হ্যামার এনডিটি পরীক্ষা (১০-রিডিং গ্রিড ও কোণ সমন্বয়)',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড এনডিটি (NDT) পরীক্ষা',
    governingCodes: ['ASTM C805 / C805M', 'IS 13311 Part 2', 'BS 1881 Part 202', 'BNBC-2020'],
    objective: {
      en: 'Rapidly maps in-situ surface concrete hardness and comparative uniformity across columns, beams, and slab soffits without damaging structural members. Automatically screens 10–12 grid impacts to discard >±6 unit outliers and applies gravity inclination angle correction (0° horizontal, +90° upward soffit, -90° downward floor).',
      bn: 'কাঠামোর কোনো ক্ষতি না করেই দ্রুত কলাম, বিম ও ছাদের কংক্রিটের উপরের স্তরের দৃঢ়তা ও সমরূপতা যাচাই করে। ১০টি গ্রিড রিডিং থেকে >±৬ বিচ্যুত আউটলায়ার স্বয়ংক্রিয়ভাবে বাদ দিয়ে হ্যামারের কোণ (০°, +৯০°, -৯০°) সমন্বয় করে আনুমানিক শক্তি নির্ণয় করে।',
    },
    sampling: {
      frequency: {
        en: 'Minimum 10 impact readings per 150×150 mm (or 300×300 mm) ground-smooth grid zone, spaced ≥ 25 mm apart; test at least 3 zones per structural member.',
        bn: '১৫০×১৫০ মিমি ঘষে মসৃণ করা গ্রিডে কমপক্ষে ২৫ মিমি দূরে দূরে ১০–১২টি হ্যামার আঘাত; প্রতিটি মেম্বারে অন্তত ৩টি জোন।',
      },
      quantity: {
        en: 'Bare concrete face ground flat with silicon-carbide carborundum stone (all plaster, skim coat, paint, and laitance completely chipped off).',
        bn: 'প্লাস্টার, রঙ ও পুটিং সম্পূর্ণ তুলে ঘষার পাথর দিয়ে মসৃণ করা খালি কংক্রিট সারফেস।',
      },
      lotSize: {
        en: 'Per structural member (Column / Beam / Slab grid zone).',
        bn: 'প্রতিটি স্ট্রাকচারাল মেম্বার (কলাম / বিম / ছাদের অংশ)।',
      },
    },
    apparatus: [
      {
        item: { en: 'Type-N Schmidt Rebound Hammer (2.207 Nm impact energy)', bn: 'টাইপ-N শ্মিড রিবাউন্ড হ্যামার (২.২০৭ জুল)' },
        spec: 'Calibration verified on hardened steel anvil before/after testing: 80 ± 2',
      },
      {
        item: { en: 'Medium-Grain Carborundum Grinding Stone & Rebar Cover Meter', bn: 'কার্বোরান্ডাম ঘষার পাথর ও রিবার লোকেটর' },
        spec: 'Grind smooth & avoid striking within 25 mm of shallow rebar',
      },
    ],
    procedure: [
      {
        en: 'Verify the hammer on the calibration steel test anvil (should read 80 ± 2). Chip away all plaster/paint over a 150×150 mm area and rub flat with the carborundum stone.',
        bn: 'প্রথমে স্টিল অ্যানভিলে হ্যামারটি ৮০ ± ২ রিডিং দেয় কিনা পরীক্ষা করুন। এরপর ১৫০×১৫০ মিমি জায়গার প্লাস্টার ও রঙ সম্পূর্ণ তুলে কার্বোরান্ডাম পাথর দিয়ে ঘষে মসৃণ করুন।',
      },
      {
        en: 'Hold the plunger strictly perpendicular (90°) to the concrete surface—Select strike angle α = 0° (column/wall side), +90° (upward slab soffit/beam bottom), or -90° (downward floor/footing top).',
        bn: 'প্লাঞ্জারটি তলের সাথে ঠিক ৯০° লম্বভাবে ধরুন (কলাম ০°, ছাদের নিচ +৯০°, মেঝে -৯০°) এবং নরম বা ফাঁপা জায়গা এড়িয়ে চলুন।',
      },
      {
        en: 'Take 10 readings spaced ≥ 25 mm apart inside the 150×150 mm grid (never hit the exact same spot twice). Record all 10 values in the interactive grid below.',
        bn: '১৫০×১৫০ মিমি গ্রিডের ভেতর অন্তত ২৫ মিমি ব্যবধানে ১০টি রিডিং নিন (একই বিন্দুতে দুবার মারবেন না) এবং নিচের ১০-রিডিং গ্রিডে ইনপুট দিন।',
      },
      {
        en: 'Per ASTM C805 §7.2: Compute initial average of the 10 readings, discard any single reading differing by more than ±6 units, and average the remaining readings (if >2 readings differ by >6, discard the entire set and re-test).',
        bn: 'ASTM C805 নিয়ম অনুযায়ী ১০টি রিডিংয়ের গড় থেকে ±৬-এর বেশি বিচ্যুত রিডিং বাদ দিয়ে নতুন গড় বের করুন (২টির বেশি আউটলায়ার হলে পুরো সেট বাতিল করে পুনরায় পরীক্ষা করুন)।',
      },
      {
        en: 'Apply gravity inclination correction for +90° (subtract ~2.7–3.2 units) or -90° (add ~2.7–3.5 units) to obtain corrected R_n and map estimated compressive strength.',
        bn: 'অভিকর্ষজ কোণ (+৯০° বা -৯০°) অনুযায়ী সংশোধন মান যোগ বা বিয়োগ করে চূড়ান্ত R_n এবং আনুমানিক কম্প্রেসিভ শক্তি নির্ণয় করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Rebound Hammer tests ONLY the outer 30 mm surface skin; older carbonated concrete (>1–2 years) can read 15–25% higher artificially, whereas wet saturated surfaces read 10–15% lower.',
          bn: 'রিবাউন্ড হ্যামার শুধু বাইরের ৩০ মিমি ত্বকের শক্তি মাপে—পুরনো ভবনে কার্বনেশনের কারণে ১৫–২৫% বেশি এবং ভেজা তলে ১০–১৫% কম রিডিং আসে।',
        },
        {
          en: 'Never take readings on honeycombed pockets, directly over exposed coarse gravel, or near free edges (<50 mm).',
          bn: 'সরাসরি খোলা পাথর, হানিকম্ব গর্ত বা কলামের কিনারা থেকে ৫০ মিমির কম দূরত্বে হ্যামার মারবেন না।',
        },
      ],
      contractorTricks: [
        {
          en: 'Testing Over Rich Cement Plaster or Directly Over Rebar: Hitting unchipped 1:3 mortar plaster or shallow 10 mm stirrups can boost Rebound readings by 6–10 units, faking pass strength.',
          bn: 'প্লাস্টার না তুলে বা রডের ওপরে হ্যামার মারা: প্লাস্টারের ওপর বা রডের বরাবর হ্যামার মারলে রিডিং ৬–১০ পয়েন্ট বেশি দেখায়—তাই আগে প্লাস্টার তুলে গ্রাইন্ড করে নিন।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'ASTM C805 Outlier Screening, Angle Correction & Strength Correlation', bn: 'আউটলায়ার ছাঁটাই, কোণ সমন্বয় ও শক্তি সূত্র' },
          equation: 'R_corr = R_valid_mean + Δα  |  f_est (MPa) ≈ 0.025·R_corr² - 0.35·R_corr + 4.0',
          variables: [
            { en: 'Δα (Schmidt Type-N): 0° (Horiz.) = 0 | +90° (Upward) = -2.8 | -90° (Downward) = +3.0', bn: 'Δα: ০° (অনুভূমিক) = ০ | +৯০° (উপরে) = -২.৮ | -৯০° (নিচে) = +৩.০' },
            { en: 'Outlier Rule: Discard readings where |R_i - Mean_10| > 6; >2 outliers invalidates set', bn: 'আউটলায়ার: গড় থেকে ±৬-এর বেশি পার্থক্যের রিডিং বাদ যাবে (>২টি হলে সেট বাতিল)' },
          ],
          unitNote: 'IS 13311 Surface Quality: R > 40 Very Good Hard Layer; R 30–40 Good Layer; R 20–30 Fair; R < 20 Poor / Delaminated. Accuracy ±15–20% unless calibrated with project cores.',
        },
      ],
      workedExample: {
        en: 'Horizontal column strike (α = 0°) yields 10 readings [36, 35, 37, 36, 38, 34, 36, 37, 35, 36] → Zero outliers >±6, Mean R_corr = 36.0 → Est. f\'c = 23.8 MPa (95% of 25 MPa, Good Hard Layer ≥ 0.85·f\'c) → PASS.',
        bn: 'কলামে (০°) ১০টি রিডিংয়ের গড় R = ৩৬.০ (কোনো আউটলায়ার নেই) → আনুমানিক শক্তি = ২৩.৮ MPa (২৫ MPa-এর ৯৫%, Good Layer) → PASS।',
      },
    },
    acceptanceRanges: [
      {
        tier: 'PASS',
        rangeLabel: 'Corrected R ≥ 30 (Good/Very Good) & Est. f\'c ≥ 0.85·f\'c & ≤ 2 Outliers',
        codeLimit: 'ASTM C805 / IS 13311',
        interpretation: {
          en: 'Uniform, dense concrete surface hardness meeting structural expectation.',
          bn: 'কংক্রিটের পৃষ্ঠের দৃঢ়তা ও ঘনত্ব ডিজাইন মানের সাথে সামঞ্জস্যপূর্ণ ও সন্তোষজনক।',
        },
      },
      {
        tier: 'WARNING',
        rangeLabel: 'Est. f\'c 0.75–0.84·f\'c OR > 2 Outliers (>±6) OR Wet Surface',
        codeLimit: 'Verify UPV / Retest Set',
        interpretation: {
          en: 'High scatter (>2 outliers) invalidates the grid per ASTM C805, or borderline surface hardness—retest smooth grid and pair with UPV NDT.',
          bn: '২টির বেশি রিডিং ±৬-এর বাইরে গেলে পুরো সেট বাতিল করে নতুন গ্রিডে পরীক্ষা করুন এবং ইউপিভি (UPV) দিয়ে যাচাই করুন।',
        },
      },
      {
        tier: 'FAIL',
        rangeLabel: 'Corrected R < 20 (Poor/Delaminated) OR Est. f\'c < 0.75·f\'c',
        codeLimit: 'CORE CUTTING REQUIRED',
        interpretation: {
          en: 'Low surface strength or delaminated concrete skin. Never condemn solely on Rebound—extract 3 ASTM C42 drilled cores immediately.',
          bn: 'কংক্রিটের শক্তি কম বা স্তর দুর্বল। চূড়ান্ত সিদ্ধান্তের জন্য অবিলম্বে ASTM C42 কোর কাটিং টেস্ট করুন।',
        },
      },
    ],
    remedialActions: [
      {
        en: 'Always cross-verify low Rebound zones using Ultrasonic Pulse Velocity (UPV) and confirm with ASTM C42 cores before designing structural repairs.',
        bn: 'রিবাউন্ড কম পেলে ইউপিভি এবং কোর কাটিং পরীক্ষার মাধ্যমে অভ্যন্তরীণ মান নিশ্চিত হয়ে তারপর রেট্রোফিটিং সিদ্ধান্ত নিন।',
      },
    ],
    calculatorInputs: [
      {
        key: 'strikeAngleCode',
        label: { en: 'Hammer Strike Inclination Angle (α)', bn: 'হ্যামার ধরার কোণ (α)' },
        unit: '',
        defaultValue: 0,
        options: [
          { value: 0, label: { en: 'α = 0° Horizontal (Column / Shear Wall Side)', bn: 'α = ০° অনুভূমিক (কলাম বা দেয়াল)' } },
          { value: 90, label: { en: 'α = +90° Vertically Upward (Slab Soffit / Beam Bottom)', bn: 'α = +৯০° উপরের দিকে (ছাদ/বিমের নিচ)' } },
          { value: -90, label: { en: 'α = -90° Vertically Downward (Slab Top / Footing)', bn: 'α = -৯০° নিচের দিকে (মেঝে/ফুটিং টপ)' } },
        ],
      },
      {
        key: 'rawMeanRebound',
        label: { en: 'Valid Raw Mean Rebound Number (Synced from 10-Grid)', bn: 'গড় রিবাউন্ড নম্বর (১০-রিডিং গ্রিড থেকে সিঙ্ককৃত)' },
        unit: 'R',
        defaultValue: 36,
        min: 10,
        max: 65,
        step: 0.1,
      },
      {
        key: 'targetFcMpa',
        label: { en: 'Specified Concrete Grade (f\'c)', bn: 'ডিজাইন কংক্রিট শক্তি (f\'c)' },
        unit: 'MPa',
        defaultValue: 25,
        min: 15,
        max: 65,
        step: 0.5,
      },
    ],
  },

  // 4.5 ULTRASONIC PULSE VELOCITY (UPV) NDT (ASTM C597 / IS 13311)
  {
    id: 'con-upv',
    domainId: 'concrete-ndt',
    code: 'LAB-CON-05',
    title: {
      en: 'Ultrasonic Pulse Velocity (UPV) NDT Internal Void & Homogeneity Test',
      bn: 'আল্ট্রাসোনিক পালস ভেলোসিটি (UPV) এনডিটি ও অভ্যন্তরীণ হানিকম্ব পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড ইউপিভি এনডিটি পরীক্ষা',
    governingCodes: ['ASTM C597', 'IS 13311 Part 1', 'BS 1881 Part 203', 'BNBC-2020'],
    objective: {
      en: 'Transmits 54 kHz ultrasonic stress waves through concrete columns, beams, or slabs to detect deep internal honeycombing, hidden air voids, fire damage, micro-cracking, and cold-joint delamination invisible from the exterior.',
      bn: 'কলাম, বিম বা ছাদের ভেতর দিয়ে ৫৪ kHz আল্ট্রাসোনিক তরঙ্গ পাঠিয়ে বাইরের দিক থেকে না দেখা যাওয়া অভ্যন্তরীণ হানিকম্ব, ফাঁকা গর্ত (Voids), কোল্ড-জয়েন্ট ফাটল ও কংক্রিটের ঘনত্বের মান যাচাই করে।',
    },
    sampling: {
      frequency: {
        en: '3 to 5 Direct/Semi-Direct grid paths across each suspect column/beam, or 300×300 mm grid across slabs/foundations.',
        bn: 'প্রতিটি সন্দেহজনক কলাম বা বিমে ৩–৫টি পাথ এবং স্ল্যাবে ৩০০×৩০০ মিমি গ্রিডে পরীক্ষা।',
      },
      quantity: {
        en: 'Clean flat concrete contact pads on opposite faces (Direct), adjacent faces (Semi-Direct), or same face (Indirect) after chipping plaster.',
        bn: 'প্লাস্টার তুলে মসৃণ করা বিপরীত মুখ (Direct), পাশাপাশি মুখ (Semi-Direct) অথবা একই মুখ (Indirect) স্পর্শ তল।',
      },
      lotSize: {
        en: 'Per structural member (Column / Beam / Pile Cap / Slab Zone).',
        bn: 'প্রতিটি স্ট্রাকচারাল মেম্বার (কলাম / বিম / পাইল ক্যাপ)।',
      },
    },
    apparatus: [
      {
        item: { en: 'Digital Ultrasonic Pulse Velocity Tester + 54 kHz Transducers', bn: 'ডিজিটাল ইউপিভি (UPV) টেস্টিং মিটার ও ৫৪ kHz ট্রান্সডিউসার' },
        spec: 'Timing resolution 0.1 µs; calibrated calibration reference bar (~42–45 µs)',
      },
      {
        item: { en: 'Petroleum Jelly / Acoustic Coupling Gel & Steel Measuring Tape', bn: 'কাপলিং জেল / গ্রিজ ও স্টিল মাপার ফিতা' },
        spec: 'Measure exact path length L to ±1 mm',
      },
    ],
    procedure: [
      {
        en: 'Zero-calibrate the UPV unit using the supplied stainless calibration rod and coupling gel before starting field testing.',
        bn: 'সাইটে কাজ শুরুর আগে ক্যালিব্রেশন রডে কাপলিং জেল লাগিয়ে ইউপিভি মিটারটি জিরো-সেট (Zero-check) করে নিন।',
      },
      {
        en: 'Chip off plaster cleanly on both transducer contact points, measure exact straight-line path length L (mm) between transducer centers, and select mode: Direct (opposite faces — highest accuracy), Semi-Direct (90° corner), or Indirect (same face — apply -0.15 to -0.30 km/s surface adjustment).',
        bn: 'প্লাস্টার তুলে দুই প্রোবের কেন্দ্রের সরাসরি দূরত্ব L (মিমি) মাপুন এবং মোড নির্বাচন করুন: Direct (বিপরীত তল — সবচেয়ে নিখুঁত), Semi-Direct (কোণা), বা Indirect (একই তল)।',
      },
      {
        en: 'Coat both 54 kHz transducers generously with acoustic couplant gel, press firmly against concrete until digital transit time T (µs) stabilizes, and compute V (km/s) = L_mm / T_µs.',
        bn: 'উভয় প্রোবে পর্যাপ্ত কাপলিং জেল লাগিয়ে কংক্রিটের গায়ে শক্তভাবে চেপে ধরুন; ডিজিটাল মিটারে স্থির হওয়া সময় T (µs) লিখে বেগ V (km/s) = L_mm / T_µs হিসাব করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Avoid routing pulse paths parallel and close (<100 mm) to heavy longitudinal rebar—sound travels through steel at 5.9 km/s, falsely inflating concrete UPV by 15–25%.',
          bn: 'মোটা রডের খুব কাছাকাছি (<১০০ মিমি) সমান্তরাল লাইনে ইউপিভি চালাবেন না—স্টিলের ভেতর শব্দ ৫.৯ km/s বেগে চলে বলে কংক্রিটের ভুয়া ভালো রিডিং আসে।',
        },
        {
          en: 'Direct face-to-face transmission is always preferred; Indirect same-face mode yields ~5–15% lower pulse velocities and higher scatter.',
          bn: 'সম্ভব হলে সবসময় Direct (বিপরীত মুখ) পদ্ধতিতে মাপুন; Indirect পদ্ধতিতে ৫–১৫% কম বেগ আসে।',
        },
      ],
      contractorTricks: [
        {
          en: 'Measuring Over Thick Plaster or Under-Reporting Path Length L: Over-measuring thickness L by 25 mm or aligning probes directly over column main bars fakes a Poor 2.9 km/s void into a Good 3.8 km/s.',
          bn: 'প্লাস্টারের পুরুত্বসহ L বেশি ধরা বা রড বরাবর প্রোব ধরা: মাপ বাড়িয়ে ধরলে খারাপ হানিকম্ব কংক্রিটকেও ভালো দেখায়।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Ultrasonic Pulse Velocity (km/s & m/s)', bn: 'আল্ট্রাসোনিক পালস ভেলোসিটি সূত্র' },
          equation: 'V (km/s) = L_mm / T_µs  |  V (m/s) = (L_mm / T_µs) × 1000',
          variables: [
            { en: 'L_mm = Straight distance between transmitter & receiver centers (mm)', bn: 'L_mm = দুই প্রোবের মধ্যবর্তী কংক্রিট পুরুত্ব (মিমি)' },
            { en: 'T_µs = Measured ultrasonic transit time (microseconds, µs)', bn: 'T_µs = পালস অতিক্রমের সময় (মাইক্রো-সেকেন্ড, µs)' },
          ],
          unitNote: 'Unit Identity: 1 mm / 1 µs = 10⁻³ m / 10⁻⁶ s = 1,000 m/s = 1.00 km/s! IS 13311 Bands: >4.5 Excellent; 3.5–4.5 Good; 3.0–3.5 Medium/Doubtful; <3.0 Poor.',
        },
      ],
      workedExample: {
        en: 'Direct transmission across a 375 mm column records T = 88.0 µs → V = 375 / 88.0 = 4.26 km/s (4,261 m/s) → 3.50–4.50 km/s band → Good Homogeneous Concrete (PASS).',
        bn: '৩৭৫ মিমি কলামে Direct মোডে সময় T = ৮৮.০ µs হলে V = ৩৭৫ / ৮৮.০ = ৪.২৬ km/s (৪,২৬১ m/s) → ৩.৫–৪.৫ সীমার ভেতর → Good Quality PASS।',
      },
    },
    acceptanceRanges: [
      {
        tier: 'PASS',
        rangeLabel: 'V > 4.50 km/s (Excellent) OR 3.50–4.50 km/s (Good)',
        codeLimit: 'IS 13311 Part 1 / ASTM C597',
        interpretation: {
          en: 'Excellent (>4.5) or Good (3.5–4.5) quality concrete: dense, continuous matrix free of major honeycombing or delamination.',
          bn: 'উত্তম ও ঘন কংক্রিট—ভেতরে কোনো বড় ফাঁকা বা হানিকম্ব নেই।',
        },
      },
      {
        tier: 'WARNING',
        rangeLabel: 'V = 3.00–3.49 km/s (Medium / Doubtful)',
        codeLimit: 'Closer Grid & Core Verify',
        interpretation: {
          en: 'Medium/doubtful concrete homogeneity or fine micro-voids; map tighter 150 mm grid and confirm compressive strength with drilled cores.',
          bn: 'মাঝারি বা সন্দেহজনক ঘনত্ব—ঘন গ্রিডে পরীক্ষা করে প্রয়োজনে কোর কাটিং দিয়ে নিশ্চিত হোন।',
        },
      },
      {
        tier: 'FAIL',
        rangeLabel: 'V < 3.00 km/s (Poor / Honeycombed)',
        codeLimit: 'GROUTING / CORE / RETROFIT',
        interpretation: {
          en: 'Severe internal voids, honeycombing, or open cracking blocking ultrasonic waves. Perform pressure epoxy/cement grouting & core testing.',
          bn: 'ভেতরে মারাত্মক হানিকম্ব বা ফাটল—তাৎক্ষণিক প্রেশার ইপোক্সি/মাইক্রো-সিমেন্ট গ্রাউটিং এবং কোর টেস্ট প্রয়োজন।',
        },
      },
    ],
    remedialActions: [
      {
        en: 'For zones with V < 3.0 km/s, drill injection ports at 300 mm centers, flush loose laitance, pressure-grout low-viscosity epoxy or non-shrink micro-cement, and re-test UPV to confirm V rises ≥ 3.5 km/s.',
        bn: 'বেগ ৩.০ km/s-এর নিচে থাকলে ৩০০ মিমি পরপর নজল বসিয়ে প্রেশার গ্রাউটিং করুন এবং গ্রাউটিংয়ের পর পুনরায় ইউপিভি করে মান ≥ ৩.৫ km/s হয়েছে কিনা যাচাই করুন।',
      },
    ],
    calculatorInputs: [
      {
        key: 'txModeCode',
        label: { en: 'UPV Transmission Mode', bn: 'ইউপিভি প্রোব স্থাপনের পদ্ধতি' },
        unit: '',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Direct Transmission (Opposite Faces — Recommended)', bn: 'ডিরেক্ট মোড (বিপরীত মুখ — সবচেয়ে সঠিক)' } },
          { value: 2, label: { en: 'Semi-Direct Transmission (Adjacent 90° Corner)', bn: 'সেমি-ডিরেক্ট মোড (পাশাপাশি ৯০° কোণা)' } },
          { value: 3, label: { en: 'Indirect / Surface Transmission (Same Face)', bn: 'ইনডিরেক্ট মোড (একই পৃষ্ঠে প্রোব)' } },
        ],
      },
      { key: 'upvPathMm', label: { en: 'Measured Path Length (L)', bn: 'প্রোব দুটির মধ্যবর্তী দূরত্ব (L)' }, unit: 'mm', defaultValue: 375, min: 80, max: 2000, step: 5 },
      { key: 'upvTimeUs', label: { en: 'Measured Pulse Transit Time (T)', bn: 'পালস অতিক্রমের সময় (T)' }, unit: 'µs', defaultValue: 88, min: 15, max: 900, step: 0.5 },
    ],
  },

  // 4.6 FERROSCAN / COVER METER & HALF-CELL CORROSION POTENTIAL
  {
    id: 'con-cover-halfcell',
    domainId: 'concrete-ndt',
    code: 'LAB-CON-06',
    title: {
      en: 'Ferroscan Rebar Cover Depth & Half-Cell Corrosion Potential (ASTM C876)',
      bn: 'ফেরোস্ক্যান রডের কভার ও হাফ-সেল মরিচা ঝুঁকি পরীক্ষা (ASTM C876 / BNBC)',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'ফিল্ড স্ট্রাকচারাল ডায়াগনস্টিক পরীক্ষা',
    governingCodes: ['ASTM C876-15', 'BS 1881 Part 204', 'BNBC-2020 Part 6 §8.1.7', 'ACI 318 §20.5'],
    objective: {
      en: 'Non-destructively verifies whether actual clear concrete cover protects rebar against moisture/chloride attack per BNBC-2020 minimums, and maps active electrochemical reinforcement corrosion potential (mV vs Cu/CuSO4 Half-Cell) in existing damp, coastal, or spalling structures.',
      bn: 'রডের চারপাশে কংক্রিটের ক্লিয়ার কভার BNBC-2020 অনুযায়ী সঠিক আছে কিনা এবং উপকূলীয় লবণাক্ততা বা ড্যাম্পের কারণে ভেতরের রডে সক্রিয় মরিচা (Corrosion) ধরেছে কিনা তা কংক্রিট না ভেঙেই নির্ণয় করে।',
    },
    sampling: {
      frequency: {
        en: '10–15 cover scans per column/beam/slab panel; Half-Cell grid at 300–500 mm spacing over damp/stained or coastal zones.',
        bn: 'প্রতিটি কলাম/বিম/স্ল্যাবে ১০–১৫টি কভার স্ক্যান এবং ড্যাম্প বা দাগযুক্ত জায়গায় ৩০০–৫০০ মিমি গ্রিডে হাফ-সেল রিডিং।',
      },
      quantity: {
        en: 'Bare concrete surface free of steel mesh/plaster; one small 20 mm window chipped at a single bar to clip the Half-Cell positive electrical lead.',
        bn: 'ফেরোস্ক্যানের জন্য প্লাস্টারমুক্ত বা কংক্রিট তল এবং হাফ-সেলের পজিটিভ তার লাগানোর জন্য একটি রডে সামান্য কানেকশন পয়েন্ট।',
      },
      lotSize: {
        en: 'Per structural member or suspect damp zone.',
        bn: 'প্রতিটি স্ট্রাকচারাল মেম্বার বা ড্যাম্প জোন।',
      },
    },
    apparatus: [
      {
        item: { en: 'Electromagnetic Cover Meter / Ferroscan (Rebar Locator)', bn: 'ইলেক্ট্রোম্যাগনেটিক কভার মিটার / ফেরোস্ক্যান' },
        spec: 'Depth range 0–120 mm, bar diameter estimation ±2 mm',
      },
      {
        item: { en: 'Cu/CuSO₄ (CSE) Half-Cell Reference Electrode + High-Impedance Voltmeter', bn: 'Cu/CuSO₄ (CSE) হাফ-সেল ইলেক্ট্রোড ও হাই-ইম্পিডেন্স ভোল্টমিটার' },
        spec: 'Input impedance ≥ 10 MΩ; saturated copper sulfate solution + sponge tip',
      },
    ],
    procedure: [
      {
        en: 'Cover Meter: Calibrate Ferroscan away from steel, dial in expected bar diameter, scan perpendicular to main bars/stirrups, and record minimum clear cover (mm) against BNBC-2020 exposure limits.',
        bn: 'ফেরোস্ক্যান ক্যালিব্রেট করে মূল রড ও স্টিরাপের ওপর আড়াআড়ি স্ক্যান করুন এবং সর্বনিম্ন ক্লিয়ার কভার (মিমি) নোট করে BNBC সীমার সাথে মেলান।',
      },
      {
        en: 'Half-Cell Connection: Expose a small spot of rebar cleanly to bare bright steel, clamp positive terminal of the ≥10 MΩ voltmeter, and pre-wet the concrete grid for 30 minutes with soapy water for electrical continuity.',
        bn: 'একটি রডের সামান্য অংশ পরিষ্কার করে ভোল্টমিটারের পজিটিভ ক্লিপ লাগান এবং পরীক্ষার ৩০ মিনিট আগে কংক্রিট তল সাবান-পানি দিয়ে ভিজিয়ে নিন।',
      },
      {
        en: 'Press the saturated Cu/CuSO4 Half-Cell sponge firmly onto each marked concrete grid point and record stable negative voltage (mV vs CSE) for ASTM C876 corrosion probability evaluation.',
        bn: 'Cu/CuSO₄ হাফ-সেলের ভেজা স্পঞ্জ প্রতিটি গ্রিড পয়েন্টে চেপে ধরে স্থির নেগেটিভ ভোল্টেজ (mV) রিডিং লিখে ASTM C876 অনুযায়ী মরিচার ঝুঁকি নির্ণয় করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Never conduct Half-Cell readings on bone-dry concrete or over waterproof coatings/epoxy membranes—high surface resistance fakes harmless potentials.',
          bn: 'একদম শুকনো কংক্রিট বা ওয়াটারপ্রুফিং পেইন্টের ওপর হাফ-সেল পরীক্ষা করলে মরিচা থাকলেও কম ঝুঁকি দেখাবে—তাই আগে ভালোভাবে ভিজিয়ে ও রঙ তুলে পরীক্ষা করুন।',
        },
        {
          en: 'Check rebar electrical continuity across stirrups/bars before grid scanning; discontinuous bars give false readings.',
          bn: 'পরীক্ষার আগে বিভিন্ন রডের মধ্যে বৈদ্যুতিক সংযোগ (Continuity) ঠিক আছে কিনা নিশ্চিত হোন।',
        },
      ],
      contractorTricks: [
        {
          en: 'Zero-Cover Shifting During Pour: Missing plastic/mortar cover blocks causes main column stirrups to sit at only 8–12 mm depth instead of 40 mm—triggering severe cover spalling within 5–8 years.',
          bn: 'ঢালাইয়ের সময় কভার ব্লক না দেয়া বা সরে যাওয়া: কলামে ৪০ মিমি কভার ব্লক না দিলে রড মাত্র ১০ মিমি ভেতরে থেকে যায়—ফলে ৫–৮ বছরেই মরিচা ধরে পলেস্তারা খসে পড়ে।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'BNBC-2020 Clear Cover Check & ASTM C876 Half-Cell Thresholds', bn: 'BNBC কভার ও ASTM C876 মরিচা ঝুঁকি মানদণ্ড' },
          equation: 'Cover_margin = Cover_meas - Cover_min  |  E_cse (mV vs Cu/CuSO₄)',
          variables: [
            { en: 'BNBC Min Cover: Earth-Cast = 75mm | Soil/Weather = 50mm | Beam/Col = 40mm | Slab/Joist = 20mm', bn: 'BNBC ন্যূনতম কভার: মাটিতে ঢালাই ৭৫মিমি | মাটি/আবহাওয়া ৫০মিমি | বিম/কলাম ৪০মিমি | ছাদ ২০মিমি' },
            { en: 'ASTM C876 Risk: > -200 mV (<10% risk) | -200 to -350 mV (Uncertain) | < -350 mV (>90% Active)', bn: 'মরিচা ঝুঁকি: > -২০০ mV (<১০% নিরাপদ) | -২০০ থেকে -৩৫০ mV (সন্দেহজনক) | < -৩৫০ mV (>৯০% সক্রিয় মরিচা)' },
          ],
          unitNote: 'Note: More negative potentials (e.g., -420 mV < -350 mV) indicate severe active anodic steel corrosion.',
        },
      ],
      workedExample: {
        en: 'Interior Column (BNBC Min Cover = 40 mm) scans Cover = 42 mm (+2 mm PASS) and Half-Cell Potential = -145 mV vs CSE (> -200 mV, <10% corrosion risk) → PASS.',
        bn: 'ভবনের ভেতরের কলামে (ন্যূনতম ৪০ মিমি) স্ক্যানে কভার ৪২ মিমি এবং হাফ-সেল ভোল্টেজ -১৪৫ mV (> -২০০ mV, ঝুঁকি <১০%) পাওয়া গেলে → PASS।',
      },
    },
    acceptanceRanges: [
      {
        tier: 'PASS',
        rangeLabel: 'Cover ≥ BNBC Min & Half-Cell > -200 mV (CSE)',
        codeLimit: 'BNBC-2020 & ASTM C876',
        interpretation: {
          en: 'Adequate passive concrete cover (> -200 mV = <10% corrosion probability); rebar remains protected by alkaline concrete.',
          bn: 'সঠিক কভার ও <১০% মরিচার ঝুঁকি—রড সম্পূর্ণ নিরাপদ অবস্থায় আছে।',
        },
      },
      {
        tier: 'WARNING',
        rangeLabel: 'Cover Short ≤ 5 mm OR Half-Cell -200 to -350 mV',
        codeLimit: 'Uncertain Zone / Protective Coat',
        interpretation: {
          en: 'Uncertain corrosion activity (-200 to -350 mV) or minor cover shortfall; apply migrating corrosion inhibitor (MCI) & carbonation barrier coat.',
          bn: 'সন্দেহজনক জোন (-২০০ থেকে -৩৫০ mV) বা কভার সামান্য কম—কংক্রিটে অ্যান্টি-কার্বনেশন ও করোশন ইনহিবিটর প্রলেপ দিন।',
        },
      },
      {
        tier: 'FAIL',
        rangeLabel: 'Cover Deficit > 5 mm OR Half-Cell < -350 mV (>90% Corrosion)',
        codeLimit: 'ACTIVE CORROSION — REHABILITATE',
        interpretation: {
          en: 'Active rebar corrosion (>90% probability) or critically exposed steel! Chip loose cover, wire-brush rust, coat zinc-rich epoxy primer, and reinstate with polymer-modified repair mortar.',
          bn: 'ভেতরে সক্রিয় মরিচা (>৯০% নিশ্চিত) বা কভার অতি কম! দুর্বল কংক্রিট ভেঙে রড পরিষ্কার করে জিংক-ইপোক্সি প্রাইমার ও পলিমার মর্টার দিয়ে মেরামত করুন।',
        },
      },
    ],
    remedialActions: [
      {
        en: 'When Half-Cell < -350 mV, test chloride profile and carbonation depth; break out spalled cover behind rusted bars, clean to bright metal (Sa 2.5), apply zinc-rich primer, and patch with structural repair mortar.',
        bn: 'ভোল্টেজ -৩৫০ mV-এর নিচে নামলে মরিচা ধরা রডের চারপাশের কংক্রিট খুলে রড পরিষ্কার করে জিংক প্রাইমার ও মাইক্রো-কংক্রিট দিয়ে পুনর্গঠন করুন।',
      },
    ],
    calculatorInputs: [
      {
        key: 'memberTypeCode',
        label: { en: 'Structural Member & BNBC Exposure Limit', bn: 'মেম্বারের ধরন ও BNBC কভার সীমা' },
        unit: '',
        defaultValue: 3,
        options: [
          { value: 1, label: { en: 'Cast Directly Against Earth / Pile Cap (Min 75 mm)', bn: 'সরাসরি মাটির সংস্পর্শে / পাইল ক্যাপ (ন্যূনতম ৭৫ মিমি)' } },
          { value: 2, label: { en: 'Exposed to Soil / Weather / Coastal (Min 50 mm)', bn: 'মাটি / রোদ-বৃষ্টি / উপকূলীয় (ন্যূনতম ৫০ মিমি)' } },
          { value: 3, label: { en: 'Interior Column / Beam / Shear Wall (Min 40 mm)', bn: 'ভেতরের কলাম, বিম ও শিয়ার ওয়াল (ন্যূনতম ৪০ মিমি)' } },
          { value: 4, label: { en: 'Interior Slab / Joist / Shell (Min 20 mm)', bn: 'ভেতরের ছাদ / জয়েস্ট (ন্যূনতম ২০ মিমি)' } },
        ],
      },
      { key: 'measuredCoverMm', label: { en: 'Measured Clear Cover (Ferroscan)', bn: 'পরিমাপকৃত ক্লিয়ার কভার (Ferroscan)' }, unit: 'mm', defaultValue: 42, min: 0, max: 150, step: 1 },
      { key: 'halfCellMv', label: { en: 'Half-Cell Potential vs Cu/CuSO₄ (Negative mV)', bn: 'হাফ-সেল ভোল্টেজ (নেগেটিভ mV vs CSE)' }, unit: 'mV', defaultValue: -145, min: -750, max: 100, step: 5 },
    ],
  },

  // =========================================================================
  // CATEGORY 5: REINFORCING STEEL BAR (REBAR) TESTS (রড ও স্টিল পরীক্ষা)
  // 4 Complete 10-Section Bilingual Protocols (BDS ISO 6935-2 / ASTM A615 / A706)
  // =========================================================================

  // 5.1 FIELD UNIT WEIGHT PER METER & ROLLING MARGIN TOLERANCE
  {
    id: 'reb-unit-weight',
    domainId: 'rebar-steel',
    code: 'LAB-REB-01',
    title: {
      en: 'Rebar Field Unit Weight per Meter & Rolling Margin Tolerance (BDS ISO 6935-2)',
      bn: 'রডের প্রতি মিটার/ফুট একক ওজন ও রোলিং মার্জিন টলারেন্স পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'তাৎক্ষণিক সাইট ফিল্ড পরীক্ষা',
    governingCodes: ['BDS ISO 6935-2', 'BS 4449', 'ASTM A615 / A706', 'BNBC-2020'],
    objective: {
      en: 'Detects undersized "commercial light-section" bars on arrival before unloading trucks. Any underweight rolling margin reduces effective cross-sectional steel area A_s,eff proportionally—weakening flexural/shear capacity and causing 5–10% financial loss on piece-basis purchases.',
      bn: 'সাইটে রডের ট্রাক নামানোর আগেই আন্ডারসাইজ (চিকন/হালকা) রড শনাক্ত করে। রডের ওজন কম হলে কার্যকর প্রস্থচ্ছেদের ক্ষেত্রফল (A_s,eff) কমে যায় এবং ভবনের ডিজাইন নিরাপত্তায় সরাসরি ঘাটতি তৈরি হয়।',
    },
    sampling: {
      frequency: {
        en: 'Every incoming rebar truckload/bundle delivery across all bar diameters (8 mm to 50 mm) before crane/manual unloading.',
        bn: 'প্রতিটি রডের ট্রাক আনলোডের আগে প্রতি সাইজের (৮ মিমি থেকে ৫০ মিমি) বান্ডিল থেকে।',
      },
      quantity: {
        en: '3 straight rust-free rebar specimens cleanly sawed to 1,000 mm (or 500 mm) perpendicular length per diameter.',
        bn: 'প্রতি ডায়া থেকে ঠিক ১,০০০ মিমি (বা ৫০০ মিমি) সমকোণে কাটা মরিচামুক্ত ৩টি সোজা রড।',
      },
      lotSize: {
        en: '1 consignment bundle lot per bar diameter.',
        bn: 'প্রতিটি ডায়ার ট্রাক বান্ডিল লট।',
      },
    },
    apparatus: [
      {
        item: { en: 'Calibrated Digital Balance (0–30 kg, 1 g sensitivity)', bn: 'ক্যালিব্রেটেড ডিজিটাল ওজন মাপার স্কেল' },
        spec: '1 g resolution, zeroed on solid wind-shielded table',
      },
      {
        item: { en: 'Certified Steel Tape / Vernier Rule & Hacksaw', bn: 'স্টিল ফিতা ও হ্যাকস ব্লেড' },
        spec: 'Measure exact specimen length L (mm) to ±1 mm',
      },
    ],
    procedure: [
      {
        en: 'Cut 3 random straight bars cleanly at 90° (square ends, approx. 1,000 mm long) from different bundles of the same diameter.',
        bn: 'একই সাইজের বিভিন্ন বান্ডিল থেকে ৩টি সোজা রড ঠিক ৯০° সমকোণে ১,০০০ মিমি লম্বা করে কাটুন।',
      },
      {
        en: 'Measure exact length L (mm) of each piece and weigh on a wind-shielded calibrated digital scale in grams.',
        bn: 'বাতাসমুক্ত স্থানে স্থাপিত ডিজিটাল স্কেলে প্রতিটি টুকরার সঠিক দৈর্ঘ্য (মিমি) ও ওজন (গ্রাম) মাপুন।',
      },
      {
        en: 'Compute actual linear mass w_actual = W_sample / L_sample (kg/m) and kg/ft (= w_actual × 0.3048), then compare with theoretical w_std = d²/162.2 (kg/m) and d²/532.15 (kg/ft).',
        bn: 'প্রকৃত ওজন w_actual (kg/m ও kg/ft) বের করে আদর্শ ওজন d²/১৬২.২ (kg/m) ও d²/৫৩২.১৫ (kg/ft)-এর সাথে তুলনা করুন।',
      },
      {
        en: 'Verify Rolling Margin % against BDS ISO 6935-2 / BS 4449 tolerance: ±6.0% for 8–12 mm bars and ±4.5% for 16–50 mm bars. If slightly light, compute effective steel area A_s,eff and bar-spacing reduction factor.',
        bn: 'BDS ISO 6935-2 টলারেন্স (±৬.০% যদি ৮–১২ মিমি হয়; ±৪.৫% যদি ১৬–৫০ মিমি হয়) যাচাই করে কার্যকর স্টিল ক্ষেত্রফল A_s,eff ও স্পেসিং সমন্বয় দেখুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Never weigh bent or heavily scaled bars; ensure end cuts are square so length error stays below 0.2%.',
          bn: 'বাঁকা বা মরিচা ধরা রড ওজন করবেন না এবং কাটার প্রান্ত ঠিক ৯০° সোজা রাখুন।',
        },
        {
          en: 'For field bar-count billing vs weight billing: verify total weighbridge slip matches (Total Length × w_actual).',
          bn: 'পিস হিসেবে কেনা রডের ক্ষেত্রেও ওয়েব্রিজ ওজনের সাথে (মোট দৈর্ঘ্য × w_actual) মিলিয়ে নিন।',
        },
      ],
      contractorTricks: [
        {
          en: '"Rolling Below Nominal Rib Core": Small rolling mills pass 15.2 mm core billets with tall ribs stamped as "16 mm", saving 8–10% steel weight (1.42 kg/m instead of 1.578 kg/m) while looking visually normal.',
          bn: 'রডের ভেতরের অংশ চিকন রেখে ওপরের খাঁজ উঁচু রাখা: অসাধু মিলাররা রডের খাঁজ (Rib) উঁচু রেখে আসল ব্যাস ১৫.২ মিমি করে ১৬ মিমি নামে বিক্রি করে—দেখতে মোটা মনে হলেও ওজনে ৮–১০% হালকা হয়!',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Standard Linear Mass, Rolling Margin & Effective Steel Area', bn: 'রডের একক ওজন, রোলিং মার্জিন ও কার্যকর ক্ষেত্রফল সূত্র' },
          equation: 'w_std = d² / 162.2 (kg/m) = d² / 532.15 (kg/ft)  |  Margin(%) = [(w_act - w_std)/w_std]×100  |  A_s,eff = A_nom·(w_act/w_std)',
          variables: [
            { en: 'd = Nominal diameter (mm), L_sample (m), W_sample (kg)', bn: 'd = রডের নির্ধারিত ডায়া (মিমি), ওজন (কেজি), দৈর্ঘ্য (মি.)' },
            { en: 'BDS ISO 6935-2 / BS 4449 Tol: 8–12 mm ⇒ ±6.0% | 16–50 mm ⇒ ±4.5%', bn: 'টলারেন্স সীমা: ৮–১২ মিমি ⇒ ±৬.০% | ১৬–৫০ মিমি ⇒ ±৪.৫%' },
          ],
          unitNote: 'Nominal Reference: 8mm=0.395, 10mm=0.617, 12mm=0.888, 16mm=1.578, 20mm=2.466, 22mm=2.984, 25mm=3.853, 28mm=4.834, 32mm=6.313 kg/m.',
        },
      ],
      workedExample: {
        en: '16 mm rebar cut to 1,000 mm weighs 1,552 g → w_act = 1.552 kg/m (0.473 kg/ft) vs w_std = 16²/162.2 = 1.578 kg/m → Rolling Margin = -1.67% (within ±4.5% limit) → A_s,eff = 197.7 mm² (98.3% of nominal 201.1 mm²) → PASS.',
        bn: '১৬ মিমি রডের ১,০০০ মিমি টুকরার ওজন ১,৫৫২ গ্রাম হলে w_act = ১.৫৫২ kg/m বনাম আদর্শ ১.৫৭৮ kg/m → মার্জিন = -১.৬৭% (±৪.৫% সীমার ভেতর) → PASS।',
      },
    },
    acceptanceRanges: [
      {
        tier: 'PASS',
        rangeLabel: 'Within ±6.0% (8–12 mm) or ±4.5% (16–50 mm)',
        codeLimit: 'BDS ISO 6935-2 / BS 4449',
        interpretation: {
          en: 'Full-section rolling mass verified; effective steel area & structural spacing remain valid.',
          bn: 'রডের একক ওজন ও প্রস্থচ্ছেদের ক্ষেত্রফল কোড অনুযায়ী শতভাগ সঠিক রয়েছে।',
        },
      },
      {
        tier: 'WARNING',
        rangeLabel: 'Margin -4.6% to -6.0% (16–50 mm) OR Overweight > +4.5%/+6.0%',
        codeLimit: 'Check Avg of 3 Bundles / Spacing',
        interpretation: {
          en: 'Slightly underweight (16–50mm) or oversized rolling; verify 3-bar batch mean, and reduce slab/beam bar spacing proportionally to A_s,eff/A_nom if approved.',
          bn: 'ওজন সীমান্তের বাইরে—আরও ৩টি বান্ডিল থেকে মাপুন এবং প্রয়োজনে ডিজাইনারের সাথে রডের স্পেসিং কমিয়ে নেয়ার পরামর্শ নিন।',
        },
      },
      {
        tier: 'FAIL',
        rangeLabel: 'Underweight Exceeds -6.0% (Any Bar Size)',
        codeLimit: 'REJECT SUB-STANDARD LOT',
        interpretation: {
          en: 'Severely undersized rolling-mill bars compromising flexural/column capacity. Reject truck before unloading.',
          bn: 'মারাত্মক আন্ডারসাইজ হালকা রড (>৬% ঘাটতি)—ট্রাক থেকে আনলোড না করে সরাসরি ফেরত পাঠান।',
        },
      },
    ],
    remedialActions: [
      {
        en: 'Reject any delivery failing BDS ISO 6935-2 mass tolerance before unloading. Never use lighter bars at the same drawing spacing without formal structural redesign.',
        bn: 'আন্ডারসাইজ রড আনলোডের আগেই ফেরত দিন; কখনোই কম ওজনের রড ডিজাইনের সমান স্পেসিংয়ে ব্যবহার করবেন না।',
      },
    ],
    calculatorInputs: [
      { key: 'barDiaMm', label: { en: 'Nominal Rebar Diameter (d)', bn: 'রডের নির্ধারিত ডায়া (d)' }, unit: 'mm', defaultValue: 16, min: 8, max: 50, step: 2 },
      { key: 'cutLengthMm', label: { en: 'Measured Cut Specimen Length (L)', bn: 'কাটা টুকরার সঠিক দৈর্ঘ্য (L)' }, unit: 'mm', defaultValue: 1000, min: 250, max: 3000, step: 5 },
      { key: 'measuredMassG', label: { en: 'Measured Specimen Mass (W)', bn: 'মাপা টুকরার ওজন (W)' }, unit: 'g', defaultValue: 1552, min: 50, max: 35000, step: 5 },
    ],
  },

  // 5.2 UTM TENSILE YIELD (fy), ULTIMATE (fu) & SEISMIC DUCTILITY RATIO (fu/fy)
  {
    id: 'reb-tensile-yield',
    domainId: 'rebar-steel',
    code: 'LAB-REB-02',
    title: {
      en: 'UTM Tensile Yield (fy), Ultimate (fu) & Seismic Ductility Ratio (fu/fy) Test',
      bn: 'ইউটিএম টেনসাইল ইল্ড (fy), আল্টিমেট (fu) ও ভূমিকম্প সহনশীল ডাক্টিলিটি পরীক্ষা',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি ইউটিএম (UTM) পরীক্ষা',
    governingCodes: ['BNBC-2020 Part 6 §8.3', 'ASTM A370 / A706', 'BDS ISO 6935-2 (B500DWR)', 'ACI 318-19 §20.2.2'],
    objective: {
      en: 'Strictly audits reinforcing steel against BNBC-2020 Seismic Class D / ASTM A706 / B500DWR requirements: (1) Yield strength meets specified minimum fy_spec, (2) Actual yield does not exceed the seismic over-strength cap (fy ≤ fy_spec + 125 MPa) so beams still yield before columns crush, and (3) Strain-hardening ratio fu/fy satisfies seismic plastic-hinge ductility (≥ 1.25 for BNBC Seismic / A706; ≥ 1.15 for ISO B500C).',
      bn: 'রডের ইল্ড স্ট্রেন্থ নির্ধারিত গ্রেডের সমান বা বেশি কিনা, পাশাপাশি BNBC-2020 সিসমিক কোড অনুযায়ী ইল্ড স্ট্রেন্থ যেন অতিরিক্ত বেশি (Over-strength: fy_spec + ১২৫ MPa-এর বেশি) না হয় এবং ভূমিকম্পের সময় প্লাস্টিক হিঞ্জ তৈরির জন্য ডাক্টিলিটি অনুপাত (fu/fy ≥ ১.২৫) নিশ্চিত আছে কিনা তা পরীক্ষা করে।',
    },
    sampling: {
      frequency: {
        en: '3 full-section straight rebar specimens per diameter per mill heat/lot (each consignment of 25–40 MT) sent to an accredited UTM lab (BUET / PWD / HBRI).',
        bn: 'প্রতি ডায়া ও মিল হিট/চালানে (২৫–৪০ মেট্রিক টন) ৩টি পূর্ণ-সেকশন সোজা রডের টুকরা অনুমোদিত ল্যাবে (BUET / PWD / HBRI) পরীক্ষা করতে হবে।',
      },
      quantity: {
        en: '3 straight full-section deformed bars × 750–900 mm long per diameter (plus actual linear weight measured for A_0 = π·d_eff²/4).',
        bn: 'প্রতি ডায়া থেকে ৭৫০–৯০০ মিমি লম্বা ৩টি অক্ষত সোজা রড।',
      },
      lotSize: {
        en: 'Single steel mill heat / 25–40 MT shipment.',
        bn: 'একই হিট লট / ২৫–৪০ মেট্রিক টন চালান।',
      },
    },
    apparatus: [
      {
        item: { en: '600–1000 kN Servo-Hydraulic Universal Testing Machine (UTM)', bn: '৬০০–১০০০ kN ইউনিভার্সাল টেস্টিং মেশিন (UTM)' },
        spec: 'ASTM A370 Class 1 calibrated load cell & hydraulic wedge grips',
      },
      {
        item: { en: 'Digital Balance & Micrometer/Tape for Effective Area A_0', bn: 'ডিজিটাল ব্যালেন্স ও কার্যকর ক্ষেত্রফল মাপার যন্ত্র' },
        spec: 'Compute d_eff = √(162.2 × w_actual) → A_0 = π·d_eff²/4',
      },
    ],
    procedure: [
      {
        en: 'Weigh and measure length of the full-section specimen to determine actual unit weight w_actual (kg/m), effective diameter d_eff = √(162.2 × w_actual), and effective cross-sectional area A_0 = π·d_eff²/4.',
        bn: 'রডের প্রকৃত দৈর্ঘ্য ও ওজন থেকে কার্যকর একক ওজন w_actual, কার্যকর ব্যাস d_eff এবং প্রস্থচ্ছেদের ক্ষেত্রফল A_0 = π·d_eff²/4 নির্ণয় করুন।',
      },
      {
        en: 'Grip full-section deformed bar cleanly in UTM hydraulic jaws (NEVER lathe-turn or grind down TMT ribs, as this removes the tempered outer martensite ring).',
        bn: 'পূর্ণ-সেকশন রড সরাসরি ইউটিএম মেশিনের জ-তে আটকান (টিএমটি রডের খাঁজ কখনোই লেদ মেশিনে কেটে চিকন করবেন না)।',
      },
      {
        en: 'Apply smooth axial tensile loading per ASTM A370; record Yield Load P_y (upper yield or 0.2% offset proof load) and Peak Ultimate Load P_u.',
        bn: 'ASTM A370 অনুযায়ী সমান গতিতে টান দিয়ে ইল্ড লোড P_y (০.২% প্রুফ স্ট্রেস) এবং সর্বোচ্চ ভাঙার লোড P_u লিখে রাখুন।',
      },
      {
        en: 'Compute fy = (P_y×1000)/A_0, fu = (P_u×1000)/A_0, and verify all 3 BNBC-2020 seismic checks: (1) fy ≥ fy_spec, (2) fy ≤ fy_spec + 125 MPa, and (3) fu/fy ≥ 1.25 (or ≥ 1.15 for ISO B500C).',
        bn: 'fy, fu ও অনুপাত fu/fy হিসাব করে BNBC-2020-এর তিনটি শর্ত যাচাই করুন: (১) fy ≥ ন্যূনতম গ্রেড, (২) fy ≤ গ্রেড + ১২৫ MPa, এবং (৩) fu/fy ≥ ১.২৫।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Why does an upper limit (fy ≤ fy_spec + 125 MPa) matter? Over-strong beam bars prevent ductile beam hinging during earthquakes and force brittle shear/column failure instead!',
          bn: 'কেন অতিরিক্ত ইল্ড (fy > fy_spec + ১২৫ MPa) বিপজ্জনক? বিমের রড বেশি শক্ত হয়ে গেলে ভূমিকম্পে বিম না ভেঙে কলাম আগে ভেঙে যাওয়ার ঝুঁকি তৈরি হয়!',
        },
        {
          en: 'Ensure stress rate in elastic range complies with ASTM A370 (≤ 10–60 MPa/s) so rapid dynamic loading does not artificially elevate yield.',
          bn: 'টানার গতি কোড সীমার মধ্যে রাখুন—দ্রুত টানলে কৃত্রিমভাবে বেশি ইল্ড দেখায়।',
        },
      ],
      contractorTricks: [
        {
          en: 'Non-Ductile Ship-Plate / Billet Re-Rolled Bars: Re-rolled scrap steel frequently shows high yield (540 MPa) yet tiny ultimate load (fu = 580 MPa → fu/fy = 1.07 < 1.25), snapping suddenly without warning in seismic sway.',
          bn: 'স্ক্র্যাপ গলানো রডের ফাঁকি: সস্তা স্ক্র্যাপ রডে ইল্ড ৫৪০ MPa থাকলেও fu/fy অনুপাত ১.০৭ থাকে—যা ভূমিকম্পে কোনো সতর্কসংকেত ছাড়াই মট করে ভেঙে যাবে!',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Effective Steel Area, Yield/Ultimate Stress & Seismic Gate', bn: 'কার্যকর ক্ষেত্রফল, ইল্ড-টেনসাইল ও সিসমিক সূত্র' },
          equation: 'A_0 = π·d_eff²/4  |  fy = (P_y×1000)/A_0  |  fu = (P_u×1000)/A_0  |  Ratio = fu/fy',
          variables: [
            { en: 'd_eff = √(162.2 × w_actual) mm; A_0 = effective steel area (mm²)', bn: 'd_eff = √(১৬২.২ × w_actual) মিমি; A_0 = কার্যকর ক্ষেত্রফল (মিমি²)' },
            { en: 'BNBC Seismic / A706 Gates: fy ≥ fy_spec | fy ≤ fy_spec + 125 MPa | fu/fy ≥ 1.25 (ISO B500C ≥ 1.15)', bn: 'সিসমিক শর্ত: fy ≥ গ্রেড | fy ≤ গ্রেড + ১২৫ MPa | fu/fy ≥ ১.২৫ (ISO B500C ≥ ১.১৫)' },
          ],
          unitNote: 'Grades: 500W / B500DWR (500 MPa, Cap 625 MPa); ASTM A706 Gr60 (420 MPa, Cap 545 MPa); 400W (400 MPa, Cap 525 MPa). 1 MPa = 0.14504 ksi.',
        },
      ],
      workedExample: {
        en: '16 mm B500DWR bar (w_actual = 1.578 kg/m → A_0 = 201.1 mm²) yields at P_y = 109.0 kN (fy = 542.1 MPa, within 500–625 MPa) and breaks at P_u = 138.0 kN (fu = 686.3 MPa) → fu/fy = 1.27 ≥ 1.25 → PASS.',
        bn: '১৬ মিমি B500DWR রড (A_0 = ২০১.১ মিমি²) ১০৯ kN-এ ইল্ড (fy = ৫৪২.১ MPa) ও ১৩৮ kN-এ ছিঁড়লে (fu = ৬৮৬.৩ MPa) → fu/fy = ১.২৭ ≥ ১.২৫ → PASS।',
      },
    },
    acceptanceRanges: [
      {
        tier: 'PASS',
        rangeLabel: 'fy_spec ≤ fy ≤ fy_spec+125 MPa & fu/fy ≥ 1.25 (or ≥ 1.15 B500C)',
        codeLimit: 'BNBC-2020 / A706 / B500DWR',
        interpretation: {
          en: 'All 3 BNBC seismic strength and strain-hardening ductility gates satisfied; approved for SMRF/IMRF seismic frames.',
          bn: 'ইল্ড, ওভার-স্ট্রেংথ ক্যাপ এবং সিসমিক ডাক্টিলিটি অনুপাত সব শর্তই পাস—ভূমিকম্প-সহনশীল ভবনের জন্য অনুমোদিত।',
        },
      },
      {
        tier: 'WARNING',
        rangeLabel: 'fy > fy_spec + 125 MPa OR fu/fy 1.15–1.24 (for Seismic Spec)',
        codeLimit: 'Overstrength / Non-Seismic Margin',
        interpretation: {
          en: 'Exceeds seismic over-strength cap (risks altering strong-column/weak-beam hierarchy) or fu/fy between 1.15–1.24; restrict to non-seismic secondary elements only with designer sign-off.',
          bn: 'ইল্ড ১২৫ MPa সীমা ছাড়িয়ে গেছে বা fu/fy ১.১৫–১.২৪-এর মধ্যে—মূল সিসমিক ফ্রেমে ডিজাইনারের অনুমোদন ছাড়া ব্যবহার করবেন না।',
        },
      },
      {
        tier: 'FAIL',
        rangeLabel: 'fy < fy_spec OR fu/fy < 1.15 (or < 1.25 A706 brittle)',
        codeLimit: 'REJECT HEAT LOT',
        interpretation: {
          en: 'Under-strength steel or brittle lack of strain hardening; quarantine and reject entire consignment immediately.',
          bn: 'কম শক্তি বা ভঙ্গুর রড—ভবন সুরক্ষায় পুরো হিট লট লাল ট্যাগ দিয়ে সাইট থেকে ফেরত পাঠান।',
        },
      },
    ],
    remedialActions: [
      {
        en: 'Reject failed heat lots immediately and verify mill test certificates (MTC) match the heat number stamped on delivered bundles before allowing replacement stock.',
        bn: 'ফেল করা লট ফেরত দিয়ে নতুন রডের হিট নম্বর ও মিল সার্টিফিকেট (MTC) মিলিয়ে পুনরায় বুয়েট/পিডব্লিউডি ল্যাব টেস্ট করুন।',
      },
    ],
    calculatorInputs: [
      {
        key: 'steelGradeCode',
        label: { en: 'Specified Rebar Grade & Seismic Standard', bn: 'রডের নির্ধারিত গ্রেড ও সিসমিক মানদণ্ড' },
        unit: '',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'BNBC 500W / B500DWR (Min 500 MPa, Cap 625, fu/fy ≥ 1.25)', bn: 'BNBC 500W / B500DWR (৫০০–৬২৫ MPa, ≥ ১.২৫)' } },
          { value: 2, label: { en: 'ASTM A706 Grade 60 (Min 420 MPa, Cap 545, fu/fy ≥ 1.25)', bn: 'ASTM A706 গ্রেড ৬০ (৪২০–৫৪৫ MPa, ≥ ১.২৫)' } },
          { value: 3, label: { en: 'BDS 400W / Grade 60 Seismic (Min 400 MPa, Cap 525, ≥ 1.25)', bn: 'BDS 400W (৪০০–৫২৫ MPa, ≥ ১.২৫)' } },
          { value: 4, label: { en: 'BDS ISO B500C Ductile (Min 500 MPa, Cap 625, fu/fy ≥ 1.15)', bn: 'ISO B500C (৫০০–৬২৫ MPa, fu/fy ≥ ১.১৫)' } },
        ],
      },
      { key: 'barDiaMm', label: { en: 'Nominal Bar Diameter (d)', bn: 'রডের ডায়া (d)' }, unit: 'mm', defaultValue: 16, min: 8, max: 50, step: 2 },
      { key: 'measuredUnitWtKgM', label: { en: 'Measured Unit Weight (for A_0; 0 = Use Nominal)', bn: 'প্রকৃত একক ওজন (A_0-এর জন্য; ০ = আদর্শ)' }, unit: 'kg/m', defaultValue: 1.578, min: 0, max: 20, step: 0.001 },
      { key: 'yieldLoadKn', label: { en: 'Observed Yield Load (P_y)', bn: 'পরিমাপকৃত ইল্ড লোড (P_y)' }, unit: 'kN', defaultValue: 109, min: 5, max: 1500, step: 0.5 },
      { key: 'ultimateLoadKn', label: { en: 'Observed Peak Ultimate Load (P_u)', bn: 'সর্বোচ্চ আল্টিমেট লোড (P_u)' }, unit: 'kN', defaultValue: 138, min: 10, max: 1800, step: 0.5 },
    ],
  },

  // 5.3 PERCENTAGE ELONGATION TEST
  {
    id: 'reb-elongation',
    domainId: 'rebar-steel',
    code: 'LAB-REB-03',
    title: {
      en: 'Rebar Percentage Elongation & Fracture Ductility Test (L₀ = 5d / 200 mm)',
      bn: 'রডের শতাংশ প্রসারণ (Percentage Elongation) ও ডাক্টিলিটি পরীক্ষা',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি ডাক্টিলিটি পরীক্ষা',
    governingCodes: ['BDS ISO 6935-2', 'ISO 15630-1', 'ASTM A615 / A706', 'BNBC-2020'],
    objective: {
      en: 'Quantifies plastic stretch capacity of reinforcing bars prior to necking fracture. Ensures beams and columns can sustain large inelastic seismic rotations and warn visibly through wide deflections before failure—screening out brittle scrap steel (<12% elongation).',
      bn: 'টানের ফলে রড ছিঁড়ে যাওয়ার আগে কত শতাংশ লম্বা হতে পারে তা পরিমাপ করে। এর মাধ্যমে ভূমিকম্প বা অতিরিক্ত লোডে কাঠামো হঠাৎ ভেঙে যাওয়ার হাত থেকে রক্ষা পায় এবং ভঙ্গুর (<১২% প্রসারণ) নিম্নমানের স্ক্র্যাপ রড বাতিল করা যায়।',
    },
    sampling: {
      frequency: {
        en: 'Measured directly on the 3 tensile specimens tested per diameter per mill heat/lot.',
        bn: 'প্রতি ডায়া ও মিল লটের ৩টি টেনসাইল পরীক্ষার নমুনায় একই সাথে পরিমাপ করা হয়।',
      },
      quantity: {
        en: 'Full-section bar marked cleanly before UTM tension across standard gauge length L₀ = 5×d (ISO) or L₀ = 200 mm (8" ASTM).',
        bn: 'টানার আগে রডের গায়ে পাঞ্চ করে দাগ দেয়া স্ট্যান্ডার্ড গেজ দৈর্ঘ্য L₀ = ৫×d (ISO) বা ২০০ মিমি (৮" ASTM)।',
      },
      lotSize: {
        en: '25–40 MT heat consignment.',
        bn: '২৫–৪০ মেট্রিক টনের হিট চালান।',
      },
    },
    apparatus: [
      {
        item: { en: 'Gauge Length Punch / Divider (5×d or 200 mm) & Vernier Caliper', bn: 'গেজ পাঞ্চ মার্কার (৫×d বা ২০০ মিমি) ও ভার্নিয়ার ক্যালিপার' },
        spec: '±0.5 mm gauge measurement accuracy; match fractured halves tightly',
      },
      {
        item: { en: 'UTM Tensile Fracture Bench', bn: 'ইউটিএম মেশিন ও নমুনা সংযোগ বেঞ্চ' },
        spec: 'ISO 15630-1 / ASTM A370 manual post-fracture gauge fit',
      },
    ],
    procedure: [
      {
        en: 'Before placing the bar in the UTM, punch light fine gauge marks spaced along the middle of the bar at intervals of 1×d (for 5d gauge) or exact L₀ = 200 mm (8 inches).',
        bn: 'ইউটিএম মেশিনে দেয়ার আগে রডের মাঝখানে হালকা পাঞ্চ দিয়ে L₀ = ৫×d (যেমন ১৬ মিমি রডে ৮০ মিমি) অথবা ২০০ মিমি (৮ ইঞ্চি) দূরত্ব চিহ্নিত করুন।',
      },
      {
        en: 'Pull the bar to complete fracture in the UTM. Ensure the break occurred cleanly inside the central middle third of the gauge span (if it breaks within 2×d of a jaw grip or gauge mark, discard & retest if elongation fails).',
        bn: 'মেশিনে টেনে রডটি সম্পূর্ণ ছিঁড়ে ফেলুন। ছেঁড়া অংশটি যেন গেজ দাগের মাঝের অংশে হয়—একদম গ্রিপের কাছে ছিঁড়ে গেলে নতুন নমুনা দিয়ে পুনরায় পরীক্ষা করুন।',
      },
      {
        en: 'Fit both broken ends tightly face-to-face on a flat bench, measure final elongated distance L_f between the gauge marks, and compute Elongation (%) = [(L_f - L₀)/L₀] × 100.',
        bn: 'ছিঁড়ে যাওয়া দুই মাথা সমতল টেবিলে একদম লাগিয়ে ধরে দাগ দুটির নতুন দূরত্ব L_f মাপুন এবং ইলংগেশন % = [(L_f - L₀)/L₀] × ১০০ হিসাব করুন।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Never use punch marks that are hammered too deep—deep notches create stress concentrations that artificially trigger early fracture at the punch mark!',
          bn: 'পাঞ্চ দিয়ে রডের গায়ে খুব গভীর গর্ত করবেন না—গভীর দাগে স্ট্রেস কনসেন্ট্রেশন হয়ে রড আগেই ওখানে ছিঁড়ে যায়।',
        },
        {
          en: 'Do not confuse L₀ = 5d (ISO, higher % e.g. ≥ 14–16%) with L₀ = 200 mm (ASTM 8", lower % e.g. ≥ 9–14%)—localized necking forms a larger percentage of a shorter 5d gauge.',
          bn: 'L₀ = ৫d (ISO) এবং L₀ = ২০০ মিমি (ASTM)-এর মান একসাথে গুলিয়ে ফেলবেন না—ছোট ৫d গেজে শতকরা হার স্বাভাবিকভাবেই বেশি আসে।',
        },
      ],
      contractorTricks: [
        {
          en: 'Measuring Gap Between Broken Halves Without Tightly Fitting: Failing to press fractured faces completely together adds a 2–3 mm air gap, inflating apparent elongation by 3–4%!',
          bn: 'ছিঁড়ে যাওয়া দুই অংশ ঠিকমতো না লাগিয়ে মাপা: মাঝখানে ২–৩ মিমি ফাঁকা রেখে মাপলে ভুয়াভাবে ইলংগেশন ৩–৪% বেশি দেখায়।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Percentage Total Elongation After Fracture', bn: 'শতাংশ প্রসারণ (Percentage Elongation) সূত্র' },
          equation: 'Elongation (%) = [ (L_f - L₀) / L₀ ] × 100',
          variables: [
            { en: 'L₀ = 5 × d (ISO / BDS ISO 6935-2) OR 200 mm (8" ASTM A615/A706)', bn: 'L₀ = ৫ × d (ISO/BDS) অথবা ২০০ মিমি (ASTM)' },
            { en: 'L_f = Final gauge length after tightly fitting fractured halves (mm)', bn: 'L_f = ছিঁড়ে যাওয়া দুই টুকরা মিলিয়ে মাপা চূড়ান্ত দৈর্ঘ্য (মিমি)' },
          ],
          unitNote: 'BNBC / BDS ISO 6935-2 (5d): Seismic Grade 500W/400W ≥ 14%–16% (A706 200mm ≥ 10–14%); 12–13.9% Marginal; < 12% Brittle Scrap Steel (Reject).',
        },
      ],
      workedExample: {
        en: '16 mm 500W bar marked with ISO gauge L₀ = 5 × 16 = 80.0 mm stretches after fracture to L_f = 94.5 mm → Elongation = [(94.5 - 80.0) / 80.0] × 100 = 18.13% (≥ 14–16% seismic limit) → PASS.',
        bn: '১৬ মিমি রডে L₀ = ৫ × ১৬ = ৮০.০ মিমি গেজ টেনে ছিঁড়ার পর L_f = ৯৪.৫ মিমি হলে → ইলংগেশন = ১৮.১৩% (≥ ১৪–১৬%) → PASS।',
      },
    },
    acceptanceRanges: [
      {
        tier: 'PASS',
        rangeLabel: '≥ 14.0%–16.0% (ISO 5d) OR ≥ 12.0%–14.0% (ASTM 200mm)',
        codeLimit: 'BNBC-2020 / BDS ISO 6935-2',
        interpretation: {
          en: 'High plastic ductility verified; steel yields gracefully before rupture without brittle fracture.',
          bn: 'উত্তম ডাক্টিলিটি প্রমাণিত—রড হঠাৎ ছিঁড়ে যাওয়ার আগে পর্যাপ্ত প্রসারণ ক্ষমতা দেখিয়েছে।',
        },
      },
      {
        tier: 'WARNING',
        rangeLabel: '12.0%–13.9% (ISO 5d) OR 10.0%–11.9% (ASTM 200mm)',
        codeLimit: 'Borderline Ductility — Retest',
        interpretation: {
          en: 'Marginal elongation near seismic threshold; verify chemical carbon equivalent (CEV) and test 2 additional bars from same heat.',
          bn: 'সীমান্তবর্তী প্রসারণ—একই লট থেকে আরও ২টি রড টেস্ট করে ও কার্বন ইকুইভ্যালেন্ট দেখে নিশ্চিত হোন।',
        },
      },
      {
        tier: 'FAIL',
        rangeLabel: '< 12.0% (ISO 5d) OR < 10.0% (ASTM 200mm)',
        codeLimit: 'BRITTLE SCRAP STEEL — REJECT',
        interpretation: {
          en: 'Brittle scrap/over-carbonized steel failing earthquake ductility. Reject entire bundle/lot immediately.',
          bn: 'ভঙ্গুর ও নিম্নমানের স্ক্র্যাপ রড (<১২%)—ভূমিকম্পে হঠাৎ ভেঙে যাবে; পুরো চালান বাতিল করুন।',
        },
      },
    ],
    remedialActions: [
      {
        en: 'Never permit steel below 12% (5d) elongation anywhere in reinforced concrete structures; return failed consignment immediately.',
        bn: '১২%-এর কম প্রসারণযুক্ত রড কোনো আরসিসি কাজে ব্যবহার করবেন না—সরাসরি সাপ্লায়ারকে ফেরত পাঠান।',
      },
    ],
    calculatorInputs: [
      {
        key: 'gaugeStandardCode',
        label: { en: 'Gauge Length Standard (L₀)', bn: 'গেজ দৈর্ঘ্যের স্ট্যান্ডার্ড (L₀)' },
        unit: '',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'BDS ISO 6935-2 / BS 4449 (L₀ = 5 × d)', bn: 'BDS ISO 6935-2 / BS (L₀ = ৫ × d)' } },
          { value: 2, label: { en: 'ASTM A615 / A706 (Fixed L₀ = 200 mm / 8")', bn: 'ASTM A615 / A706 (স্থির L₀ = ২০০ মিমি)' } },
        ],
      },
      { key: 'barDiaMm', label: { en: 'Nominal Bar Diameter (d)', bn: 'রডের ডায়া (d)' }, unit: 'mm', defaultValue: 16, min: 8, max: 50, step: 2 },
      { key: 'finalGaugeMm', label: { en: 'Final Fractured Gauge Length (L_f)', bn: 'ছিঁড়ে যাওয়ার পর গেজ দৈর্ঘ্য (L_f)' }, unit: 'mm', defaultValue: 94.5, min: 40, max: 350, step: 0.5 },
    ],
  },

  // 5.4 180° BEND & REBEND TEST
  {
    id: 'reb-bend-rebend',
    domainId: 'rebar-steel',
    code: 'LAB-REB-04',
    title: {
      en: '180° Cold Bend & 90°/20° Strain-Aged Rebend Crack Audit (BDS ISO 6935-2)',
      bn: 'রডের ১৮০° কোল্ড বেন্ড ও ৯০°/২০° রি-বেন্ড ফাটল পরীক্ষা',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি / সাইট বেন্ডিং পরীক্ষা',
    governingCodes: ['ISO 15630-1', 'BDS ISO 6935-2', 'ASTM A615 / A706', 'BNBC-2020'],
    objective: {
      en: 'Simulates severe field bar-bending stresses—90°/135° seismic stirrup hooks, cranked slab bars, and bent-up column dowels straightened back after curing. Identifies strain-ageing embrittlement, high phosphorus/carbon brittleness, or faulty TMT water-quenching that splits bars at tight bends.',
      bn: 'সাইটে ১৩৫° সিসমিক রিং/হুক বাঁকানো, ক্র্যাংক করা এবং কলাম/স্ল্যাবের ডাউয়েল রড সোজা করার সময় রডের বাইরের দিকে ফাটল ধরে কিনা তা যাচাই করে—যা অতিরিক্ত কার্বন/ফসফরাস বা ত্রুটিপূর্ণ টিএমটি কোয়েঞ্চিংয়ের কারণে ভঙ্গুর রডকে ধরে ফেলে।',
    },
    sampling: {
      frequency: {
        en: '2 specimens per diameter per heat/lot alongside every UTM tensile batch.',
        bn: 'প্রতি ডায়া ও হিটের টেনসাইল টেস্টের পাশাপাশি ২টি করে নমুনা।',
      },
      quantity: {
        en: '2 straight full-section bars × 500–600 mm length per diameter (1 for 180° Cold Bend, 1 for 90°→100°C Aged→20° Rebend).',
        bn: 'প্রতি ডায়া থেকে ৫০০–৬০০ মিমি লম্বা ২টি সোজা রড (১টি ১৮০° কোল্ড বেন্ড ও ১টি ১০০°সে এজিংসহ রি-বেন্ড)।',
      },
      lotSize: {
        en: '25–40 MT heat lot.',
        bn: '২৫–৪০ মেট্রিক টনের হিট লট।',
      },
    },
    apparatus: [
      {
        item: { en: 'Hydraulic Rebar Bend-Rebend Machine + Calibrated Mandrel Rollers', bn: 'হাইড্রোলিক বেন্ড-রি-বেন্ড মেশিন ও ম্যান্ড্রেল পিন সেট' },
        spec: 'Mandrel diameters: 3d, 4d, 5d, 6d, 7d per code & grade',
      },
      {
        item: { en: '100°C Boiling Water Bath (30 min ageing) & 10× Inspection Loupe', bn: '১০০°সে ফুটন্ত পানির বাথ ও ১০× ম্যাগনিফাইং লেন্স' },
        spec: 'Inspect entire outer convex arc under bright light',
      },
    ],
    procedure: [
      {
        en: 'Select the exact Mandrel Pin Diameter from the BNBC / BDS ISO 6935-2 table based on bar diameter d and steel grade (e.g., 500W: ≤16mm → 4d (bend) / 5d (rebend); 20–25mm → 5d / 7d; >25mm → 7d / 8d).',
        bn: 'রডের ডায়া (d) ও গ্রেড অনুযায়ী কোড নির্ধারিত ম্যান্ড্রেল পিন নির্বাচন করুন (যেমন 500W: ≤১৬ মিমি → ৪d বেন্ড / ৫d রি-বেন্ড; ২০–২৫ মিমি → ৫d / ৭d)।',
      },
      {
        en: '180° Cold Bend: Place the bar steadily at ambient temperature (10–35°C) across supports and bend smoothly around the prescribed mandrel to full 180° (U-shape).',
        bn: '১৮০° কোল্ড বেন্ড: সাধারণ তাপমাত্রায় রডটি নির্দিষ্ট ম্যান্ড্রেল পিনের চারপাশে ধীরে ও সমভাবে পূর্ণ ১৮০° কোণে বাঁকান।',
      },
      {
        en: 'Rebend Protocol: Bend the companion specimen to 90° around the specified rebend mandrel, submerge in boiling water (100°C) for 30 minutes to accelerate strain ageing, cool naturally in air, then bend back (straighten) at least 20°.',
        bn: 'রি-বেন্ড পরীক্ষা: দ্বিতীয় রডটি ৯০° বাঁকিয়ে ৩০ মিনিট ফুটন্ত পানিতে (১০০°সে) ফুটিয়ে স্বাভাবিক বাতাসে ঠান্ডা করুন, এরপর আবার অন্তত ২০° সোজা করুন।',
      },
      {
        en: 'Examine the entire outer convex tension curvature thoroughly using a 10× loupe; even a single visible transverse crack or split fails the heat lot.',
        bn: 'বাঁকানো অংশের বাইরের উত্তল তল আলোর নিচে ম্যাগনিফাইং লেন্স দিয়ে দেখুন—সামান্য চুল পরিমাণ আড়াআড়ি ফাটল বা চির (Crack) দেখলেও লট বাতিল হবে।',
      },
    ],
    precautionsAndTricks: {
      precautions: [
        {
          en: 'Never bend around a smaller mandrel than code limit (e.g. bending 25mm 500W around a 2d pin breaks ductile steel artificially); conversely, an oversized mandrel (> code) voids the test.',
          bn: 'নির্ধারিত ম্যান্ড্রেলের চেয়ে ছোট পিনে বাঁকালে ভালো রডও ভেঙে যাবে, আবার বড় পিনে বাঁকালে পরীক্ষা অকার্যকর গণ্য হবে।',
        },
        {
          en: 'On site, strictly forbid bar-benders from heating stubborn rebars with oxy-acetylene gas torches to make hooks—red heat destroys the TMT martensite rim permanently.',
          bn: 'সাইটে মিস্ত্রিরা অনেক সময় হুক বা ক্র্যাংক বাঁকাতে গ্যাস টর্চে রড লাল করে গরম করে—এতে টিএমটি রডের শক্তি ও ডাক্টিলিটি স্থায়ীভাবে নষ্ট হয়!',
        },
      ],
      contractorTricks: [
        {
          en: 'Using Oversized Pins or Bending Only 135° Instead of 180°: Stopping at 135° around a loose 8d roller hides surface micro-tearing that opens up between 150° and 180°.',
          bn: 'বড় ম্যান্ড্রেল পিন ব্যবহার বা ১৮০°-এর বদলে ১৩৫° বাঁকানো: ১৩৫°-এ থেমে গেলে সূক্ষ্ম ফাটল লুকিয়ে থাকে যা ১৮০° পূর্ণ হলেই স্পষ্ট হয়ে ওঠে।',
        },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Mandrel Pin Ratio & Zero-Crack Criterion', bn: 'ম্যান্ড্রেল ব্যাস অনুপাত ও ফাটলমুক্ত মানদণ্ড' },
          equation: 'Mandrel_Ratio = D_mandrel / d  |  Max Code Ratio: 3d–7d (Grade & Dia Dependent)',
          variables: [
            { en: '500W Mandrel Table (Bend/Rebend): ≤16mm→4d/5d | 20–25mm→5d/7d | >25mm→7d', bn: '500W ম্যান্ড্রেল: ≤১৬মিমি→৪d/৫d | ২০–২৫মিমি→৫d/৭d | >২৫মিমি→৭d' },
            { en: '400W/Gr60 Mandrel Table: ≤16mm→3d | 20–25mm→4d | >25mm→5d', bn: '400W ম্যান্ড্রেল: ≤১৬মিমি→৩d | ২০–২৫মিমি→৪d | >২৫মিমি→৫d' },
          ],
          unitNote: 'Zero visible transverse cracks on outer tension face after 180° cold bend & 90°→100°C→20° rebend.',
        },
      ],
      workedExample: {
        en: '16 mm 500W bar bent 180° around a 64 mm mandrel pin (Ratio = 4.0×d = code limit 4d) and rebent 90°→20° with 0 visible surface cracks → PASS.',
        bn: '১৬ মিমি 500W রড ৬৪ মিমি পিনে (৪.০×d = কোড সীমা ৪d) ১৮০° বাঁকানো ও রি-বেন্ডের পর ০টি ফাটল পাওয়া গেলে → PASS।',
      },
    },
    acceptanceRanges: [
      {
        tier: 'PASS',
        rangeLabel: '0 Visible Cracks & Mandrel ≤ Code Limit & Bend = 180°',
        codeLimit: 'BDS ISO 6935-2 / ASTM A615',
        interpretation: {
          en: 'Sound ductile outer martensite rim; completely safe for 135° seismic hooks, cranks, and dowel alignment.',
          bn: 'উত্তম নমনীয়তা—১৩৫° সিসমিক হুক, ক্র্যাংক ও ডাউয়েল বাঁকানোর জন্য শতভাগ নিরাপদ।',
        },
      },
      {
        tier: 'WARNING',
        rangeLabel: '0 Cracks BUT Mandrel Oversized (> Code Limit) OR Bend < 180°',
        codeLimit: 'Invalid Test Setup — Repeat',
        interpretation: {
          en: 'Test bend was gentler than required by code (pin too large or incomplete angle); repeat test immediately with exact mandrel diameter & full 180° arc.',
          bn: 'পরীক্ষায় নির্ধারিত ম্যান্ড্রেলের চেয়ে বড় পিন বা কম কোণ ব্যবহার হয়েছে—সঠিক পিন ও পূর্ণ ১৮০° কোণে পুনরায় টেস্ট করুন।',
        },
      },
      {
        tier: 'FAIL',
        rangeLabel: 'Any Transverse Crack, Split, or Fracture on Outer Arc',
        codeLimit: 'REJECT HEAT LOT',
        interpretation: {
          en: 'Brittle strain-ageing or defective TMT quenching! Bars will crack or snap at hooks and seismic joints; reject consignment immediately.',
          bn: 'রডের বাইরের পিঠে ফাটল/চির ধরেছে! হুক বাঁকালে বা ভূমিকম্পে রড ভেঙে যাবে—পুরো চালান ফেরত দিন।',
        },
      },
    ],
    remedialActions: [
      {
        en: 'Quarantine and return any rebar heat failing cold bend or 100°C aged rebend testing; inspect existing bent stirrups/hooks on site if from same mill batch.',
        bn: 'বেন্ড বা রি-বেন্ড টেস্টে ফেল করা লট ফেরত পাঠান এবং একই ব্যাচের রিং/হুক আগে বানানো থাকলে সেগুলোও পরীক্ষা করুন।',
      },
    ],
    calculatorInputs: [
      {
        key: 'steelGradeCode',
        label: { en: 'Rebar Steel Grade (Determines Pin Limit)', bn: 'রডের গ্রেড (ম্যান্ড্রেল সীমা নির্ধারক)' },
        unit: '',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'Grade 500W / B500DWR (4d ≤16, 5d 20–25, 7d >25)', bn: 'গ্রেড 500W / B500DWR (৪d–৭d)' } },
          { value: 2, label: { en: 'Grade 400W / ASTM A706 Gr60 (3d ≤16, 4d 20–25, 5d >25)', bn: 'গ্রেড 400W / Gr60 (৩d–৫d)' } },
        ],
      },
      { key: 'barDiaMm', label: { en: 'Nominal Bar Diameter (d)', bn: 'রডের ডায়া (d)' }, unit: 'mm', defaultValue: 16, min: 8, max: 50, step: 2 },
      { key: 'mandrelDiaMm', label: { en: 'Mandrel Pin Diameter Used (D_m)', bn: 'ব্যবহৃত ম্যান্ড্রেল পিনের ব্যাস (D_m)' }, unit: 'mm', defaultValue: 64, min: 18, max: 400, step: 2 },
      { key: 'bendAngleDeg', label: { en: 'Bend Angle Achieved', bn: 'সম্পন্ন বেন্ড কোণ' }, unit: 'deg', defaultValue: 180, min: 45, max: 180, step: 15 },
      { key: 'cracksFoundCount', label: { en: 'Cracked / Fractured Specimens (0 = None)', bn: 'ফাটল/ভাঙন পাওয়া নমুনা (০ = নেই)' }, unit: 'nos', defaultValue: 0, min: 0, max: 5, step: 1 },
    ],
  },
];
