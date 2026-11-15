import { LabTestDefinition } from '../types/testingLab';

export const TESTING_LAB_TESTS_PART1: LabTestDefinition[] = [
  // =========================================================================
  // CATEGORY 1: CEMENT QUALITY TESTS (সিমেন্ট পরীক্ষা — OPC CEM-I & PCC CEM-II)
  // 10 Field & Lab Tests
  // =========================================================================

  // 1.1 FIELD CHECK 1: PHYSICAL, LUMPS & BAG WEIGHT TEST
  {
    id: 'cem-field-lumps',
    domainId: 'cement',
    code: 'LAB-CEM-01',
    title: {
      en: 'Field Cement Check #1: Physical Lumps & Bag Weight Audit (with 5-Point Scorecard)',
      bn: 'সাইট সিমেন্ট পরীক্ষা #১: চাকা বা দলা ও ব্যাগের ওজন যাচাই (৫-পয়েন্ট স্কোরকার্ডসহ)',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'তাৎক্ষণিক সাইট ফিল্ড চেক',
    governingCodes: ['BNBC-2020 Part 6', 'PWD SoR Spec', 'BDS EN 197-1', 'BSTI Tol. ±1%'],
    objective: {
      en: 'Detects premature air-hydration (hard uncrushable lumps formed due to damp godown storage or torn bags) and verifies actual bag weight (50.0 kg nominal). Using pre-hydrated cement drastically cuts concrete compressive strength and causes honeycombing.',
      bn: 'গুদামে স্যাঁতসেঁতে আবহাওয়া বা ফাটা ব্যাগের কারণে সিমেন্ট জমে শক্ত দলা (Lump) বেঁধেছে কিনা এবং ব্যাগে পুরো ৫০.০ কেজি ওজন আছে কিনা তা সাইটে তাৎক্ষণিকভাবে যাচাই করে। জমে যাওয়া সিমেন্ট ব্যবহারে ঢালাইয়ের শক্তি মারাত্মকভাবে কমে যায় ও হানিকম্বিং হয়।',
    },
    sampling: {
      frequency: {
        en: 'Every incoming delivery truck/challan prior to unloading, plus weekly inspection of stacked site cement shed.',
        bn: 'প্রতিটি সিমেন্টের ট্রাক/চালান আনলোড করার আগে এবং গুদামে মজুদ সিমেন্টের ক্ষেত্রে প্রতি সপ্তাহে একবার।',
      },
      quantity: {
        en: 'Weigh 5 random sealed bags per truck (or √N bags); collect 1,000 g combined sample from middle/corner pockets of bags to check lumps.',
        bn: 'প্রতি ট্রাক থেকে দৈবচয়ন ভিত্তিতে ৫টি সিল করা ব্যাগ ওজন এবং ১,০০০ গ্রাম সিমেন্ট (ব্যাগের মাঝখান ও কোণা থেকে) দলা পরীক্ষার জন্য।',
      },
      lotSize: {
        en: '100 to 400 bags (5–20 MT) per challan or single weekly consignment.',
        bn: 'প্রতি চালানে ১০০ থেকে ৪০০ ব্যাগ (৫–২০ মেট্রিক টন) অথবা এক সপ্তাহের স্টক।',
      },
    },
    apparatus: [
      { item: { en: 'Calibrated Digital Platform Scale', bn: 'ক্যালিব্রেটেড ডিজিটাল প্ল্যাটফর্ম স্কেল' }, spec: 'Capacity 100 kg, Least count ±50 g' },
      { item: { en: '1.18 mm (#16) / 150 µm Test Sieve & Pan', bn: '১.১৮ মিমি (#১৬) বা ১৫০ মাইক্রন চালনি ও প্যান' }, spec: '200 mm Brass/SS frame' },
      { item: { en: 'Dry Scoop & Small Weighing Scale (1 g)', bn: 'শুকনো স্কুপ ও ডিজিটাল গ্রাম স্কেল' }, spec: 'Capacity 2 kg, Least count 0.5 g' },
    ],
    procedure: [
      { en: 'Inspect outer Kraft-paper/PP-woven bags for damp stains, moisture rings, torn corners, or re-stitched double seams.', bn: 'ব্যাগের বাইরের কাগজ বা বস্তায় পানির দাগ, স্যাঁতসেঁতে ভাব, ছেঁড়া কোণা বা পুনরায় সেলাইয়ের (Double Stitch) চিহ্ন আছে কিনা দেখুন।' },
      { en: 'Weigh 5 intact bags sequentially on a zeroed platform scale on level ground and compute the average weight per bag.', bn: 'সমান জায়গায় বসানো জিরো করা স্কেলে একে একে ৫টি অক্ষত ব্যাগ মাপুন এবং গড় ওজন বের করুন।' },
      { en: 'Open 2 bags and press any visible chunks between thumb and forefinger. Soft air-set lumps crumble easily into fine powder; hard rock-like lumps do not break.', bn: '২টি ব্যাগ খুলে ভেতরের দলা বৃদ্ধাঙ্গুলি ও তর্জনী দিয়ে টিপে দেখুন। বাতাসে তৈরি নরম দলা সহজে গুঁড়া হয়ে যাবে, কিন্তু পানিতে জমা শক্ত দলা ভাঙবে না।' },
      { en: 'Screen a 1,000 g representative sample through a 1.18 mm sieve and weigh all hard uncrushable lumps retained.', bn: '১,০০০ গ্রাম নমুনা সিমেন্ট ১.১৮ মিমি চালনিতে চেলে হাতে চাপ দিলেও না ভাঙা শক্ত দলার ওজন মাপুন।' },
      { en: 'Record this result alongside the other 4 Field Instant Checks inside the interactive 5-Point Field Cement Lot Inspection Scorecard below.', bn: 'নিচের ৫-পয়েন্ট ফিল্ড সিমেন্ট লট স্কোরকার্ডে এই ফলাফলের সাথে বাকি ৪টি ফিল্ড চেক যুক্ত করে চূড়ান্ত অনুমোদন সিদ্ধান্ত নিন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Never dry-crush hard cement lumps with a hammer or shovel to mix into RCC—already-hydrated lumps act only as weak inert filler.', bn: 'শক্ত হয়ে যাওয়া সিমেন্টের চাকা কখনোই হাতুড়ি বা বেলচা দিয়ে ভেঙে ঢালাইয়ে মেশাবেন না; একবার জমে যাওয়া সিমেন্ট আর কোনো শক্তি দেয় না।' },
        { en: 'Keep cement shed floor 150–200 mm raised on wooden pallets and 300 mm away from perimeter walls with polythene damp barrier.', bn: 'গুদামে মাটি থেকে ১৫০–২০০ মিমি উঁচু কাঠের পাটাতনের ওপর পলিথিন বিছিয়ে দেয়াল থেকে ৩০০ মিমি দূরে সিমেন্ট সাজিয়ে রাখুন।' },
      ],
      contractorTricks: [
        { en: 'Roll-Crushed Expired Stock: Unscrupulous dealers crush old 4-month lumpy bags through mechanical rollers and repack them in new branded bags—check stitching color and smell/temperature inside the bag.', bn: 'পুরনো জমে যাওয়া সিমেন্ট মেশিনে গুঁড়া করে নতুন বস্তায় ভরে বিক্রি করা হয়—ব্যাগের মুখের সুতার রঙ ও উৎপাদনের সিল ভালো করে পরীক্ষা করুন।' },
        { en: 'Systematic 47–48 kg Short-Weight Bags: Suppliers sometimes deliver bags weighing 47.5 kg instead of 50 kg, cutting actual cement content by 5% in volume batching.', bn: 'ওজন চুরি: অনেক সময় ৫০ কেজির জায়গায় ৪৭.৫–৪৮ কেজির বস্তা দেওয়া হয়, যা ভলিউম ব্যাচিংয়ে কংক্রিটের সিমেন্ট ৫% কমিয়ে দেয়।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Hard Lump Percentage (%)', bn: 'শক্ত দলার শতকরা হার (%)' },
          equation: 'Lump(%) = (W_lump / W_sample) × 100',
          variables: [
            { en: 'W_lump = Weight of uncrushable hard lumps (g)', bn: 'W_lump = হাতের চাপেও না ভাঙা শক্ত দলার ওজন (গ্রাম)' },
            { en: 'W_sample = Total tested cement sample weight (g)', bn: 'W_sample = মোট পরীক্ষিত নমুনার ওজন (গ্রাম)' },
          ],
          unitNote: 'Lump ≤ 2.0% Pass; 2.1%–5.0% Screen & Lab Verify; > 5.0% Reject Lot.',
        },
        {
          name: { en: 'Bag Weight Deficit (%)', bn: 'ব্যাগের ওজন ঘাটতি হার (%)' },
          equation: 'Deficit(%) = [(50.0 - W_avg) / 50.0] × 100',
          variables: [
            { en: 'W_avg = Average measured weight of 5 bags (kg)', bn: 'W_avg = ৫টি ব্যাগের পরিমাপকৃত গড় ওজন (কেজি)' },
          ],
          unitNote: 'BSTI / BDS tolerance on average lot weight: ≥ 49.5 kg (±1.0%).',
        },
      ],
      workedExample: {
        en: 'For 5 bags averaging 49.70 kg: Deficit = ((50.0 - 49.70)/50.0)×100 = 0.60% (Pass, ≥ 49.5 kg). In 1,000 g sample with 10 g hard lumps: Lump% = (10/1000)×100 = 1.00% (Pass, ≤ 2%).',
        bn: '৫টি ব্যাগের গড় ওজন ৪৯.৭০ কেজি হলে ঘাটতি = ((৫০.০ - ৪৯.৭০)/৫০.০)×১০০ = ০.৬০% (পাস, ≥ ৪৯.৫ কেজি)। ১,০০০ গ্রাম নমুনায় ১০ গ্রাম শক্ত দলা থাকলে হার = (১০/১০০০)×১০০ = ১.০০% (পাস, ≤ ২%)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Avg Bag ≥ 49.5 kg & Hard Lumps ≤ 2.0%', codeLimit: 'BSTI / PWD / BNBC', interpretation: { en: 'Free-flowing, full-weight cement acceptable for structural concrete.', bn: 'দলামুক্ত ও সঠিক ওজনের সিমেন্ট—আরসিসি ঢালাইয়ে সরাসরি ব্যবহারযোগ্য।' } },
      { tier: 'WARNING', rangeLabel: 'Bag 49.0–49.49 kg OR Lumps 2.1%–5.0%', codeLimit: 'Sieve & Lab Retest', interpretation: { en: 'Borderline; screen out lumps via 1.18 mm sieve and verify 7-day mortar strength before RCC.', bn: 'সীমান্তবর্তী মান; চালনি দিয়ে দলা ফেলে এবং ল্যাব মর্টার টেস্ট ছাড়া মূল আরসিসিতে ব্যবহার করবেন না।' } },
      { tier: 'FAIL', rangeLabel: 'Bag < 49.0 kg OR Hard Lumps > 5.0%', codeLimit: 'REJECT DELIVERY', interpretation: { en: 'Moisture-damaged or severely short-weighted cement; reject truckload immediately.', bn: 'পানি লেগে নষ্ট হওয়া বা ওজনে মারাত্মক কম সিমেন্ট—ট্রাক আনলোড না করে ফেরত পাঠান।' } },
    ],
    remedialActions: [
      { en: 'Reject any delivery with > 5% hard uncrushable lumps; never allow site labor to break lumps and pour into the mixer.', bn: '৫%-এর বেশি শক্ত দলা থাকলে সম্পূর্ণ চালান বাতিল করুন; লেবার দিয়ে দলা ভেঙে মিক্সারে দেওয়ার অনুমতি দেবেন না।' },
      { en: 'If bag weight averages 49.0–49.45 kg, either return batch or add compensatory extra cement by scale and deduct cost from supplier bill.', bn: 'গড় ওজন ৪৯.৫ কেজির কম হলে ওজন অনুযায়ী অতিরিক্ত সিমেন্ট যোগ করে অথবা ট্রাক ফেরত দিয়ে সরবরাহকারীর বিল সমন্বয় করুন।' },
    ],
    calculatorInputs: [
      { key: 'avgBagWeightKg', label: { en: 'Average Measured Bag Weight', bn: 'মাপা ব্যাগের গড় ওজন' }, unit: 'kg', defaultValue: 49.7, min: 35, max: 52, step: 0.05 },
      { key: 'sampleMassG', label: { en: 'Tested Sample Mass', bn: 'পরীক্ষিত নমুনার ওজন' }, unit: 'g', defaultValue: 1000, min: 100, max: 5000, step: 50 },
      { key: 'hardLumpMassG', label: { en: 'Uncrushable Hard Lump Mass', bn: 'হাতে না ভাঙা শক্ত দলার ওজন' }, unit: 'g', defaultValue: 10, min: 0, max: 1000, step: 1 },
    ],
  },

  // 1.2 FIELD CHECK 2: COLOR, HAND-TEMP & RUBBING SMOOTHNESS TEST
  {
    id: 'cem-field-color-rub',
    domainId: 'cement',
    code: 'LAB-CEM-02',
    title: {
      en: 'Field Cement Check #2: Uniform Color, Temperature & Finger-Rubbing Smoothness Test',
      bn: 'সাইট সিমেন্ট পরীক্ষা #২: রঙ, ভেতরের তাপমাত্রা ও আঙুলে ঘষা মসৃণতা পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'তাৎক্ষণিক সাইট ফিল্ড চেক',
    governingCodes: ['PWD Specification', 'BNBC-2020 Part 6', 'BDS EN 197-1'],
    objective: {
      en: 'Verifies uniform greenish-grey hydration-ready mineral composition and checks for adulteration with coarse sand dust, chalk powder, lime, or slag grit—while ensuring no active exothermic heat from pre-hydration inside the bag.',
      bn: 'সিমেন্টের আদর্শ সবুজাভ-ধূসর (Greenish-Grey) রঙ ঠিক আছে কিনা, ভেতরে সস্তা পাথরের গুঁড়া বা বালির ভেজাল মিশ্রিত হয়েছে কিনা এবং ব্যাগের ভেতর জলীয় বাষ্প বিক্রিয়ায় গরম হয়ে উঠেছে কিনা তা পরীক্ষা করে।',
    },
    sampling: {
      frequency: { en: 'Every newly opened lot / delivery batch before starting daily batching.', bn: 'প্রতিটি নতুন লট খোলার সময় এবং প্রতিদিনের ঢালাই শুরুর আগে।' },
      quantity: { en: '100 g hand sample drawn from at least 150 mm deep inside 3 different bags.', bn: 'কমপক্ষে ৩টি ব্যাগের ১৫০ মিমি গভীর থেকে সংগৃহীত ১০০ গ্রাম নমুনা।' },
      lotSize: { en: 'Each delivery truck or stacked lot.', bn: 'প্রতিটি ট্রাক চালান বা স্ট্যাক করা লট।' },
    },
    apparatus: [
      { item: { en: 'White A4 Paper Sheet & Clean Daylight Inspection Tray', bn: 'সাদা কাগজ ও পরিষ্কার ট্রে' }, spec: 'For uniform shade comparison' },
      { item: { en: 'Probe Thermometer (Optional)', bn: 'ডিজিটাল প্রোব থার্মোমিটার (ঐচ্ছিক)' }, spec: 'Range 0–80°C, ±0.5°C' },
    ],
    procedure: [
      { en: 'Spread a thin layer of cement on white paper under natural daylight: OPC CEM-I must show a uniform greenish-grey tint (PCC CEM-II may appear slightly lighter grey).', bn: 'দিনের আলোতে সাদা কাগজের ওপর সিমেন্ট ছড়িয়ে দেখুন: OPC সিমেন্টে সমান সবুজাভ-ধূসর রঙ থাকবে (PCC সামান্য হালকা ধূসর হতে পারে)।' },
      { en: 'Check for blotchy streaks, yellowish/brownish spots, or chalky white flecks which signal uneven burning or lime/ash adulteration.', bn: 'রঙের ভেতরে হলদেটে, লালচে বা সাদাটে ছোপ আছে কিনা দেখুন—এটি কাঁচা ক্লিংকার বা চুন/ছাই ভেজালের লক্ষণ।' },
      { en: 'Thrust bare clean dry hand deep into the middle of the opened bag: good cement feels distinctly COOL, never warm.', bn: 'শুকনো হাত ব্যাগের একদম মাঝখান পর্যন্ত ঢুকিয়ে দিন: ভালো সিমেন্ট অবশ্যই ঠান্ডা অনুভূত হবে, কখনোই গরম নয়।' },
      { en: 'Rub a pinch firmly between thumb and forefinger for 10 seconds: pure cement feels silky-smooth like talcum powder without gritty sand grains.', bn: 'বৃদ্ধাঙ্গুলি ও তর্জনীর মাঝে এক চিমটি সিমেন্ট ১০ সেকেন্ড ঘষুন: খাঁটি সিমেন্ট ট্যালকম পাউডারের মতো মসৃণ লাগবে; বালির মতো খসখসে দানা থাকবে না।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Always wash hands thoroughly with clean water after checking cement directly due to high alkalinity (pH ~12.5).', bn: 'সিমেন্ট ক্ষারীয় (pH ~১২.৫) হওয়ায় হাত দিয়ে পরীক্ষার পরপরই পরিষ্কার পানি দিয়ে হাত ধুয়ে ফেলুন।' },
        { en: 'Inspect under natural shade—yellow sodium/LED site floodlights distort greenish-grey tones.', bn: 'হলুদ সাইট লাইটের বদলে দিনের স্বাভাবিক আলোতে রঙ পরীক্ষা করুন।' },
      ],
      contractorTricks: [
        { en: 'Freshly Mill-Hot Bags vs Hydrated Heat: Cement straight off a clinker mill can feel slightly warm (~45°C) initially, whereas moisture-spoiled cement feels warm AND has damp lumps/crusting.', bn: 'কারখানা থেকে সদ্য নামা সিমেন্ট হালকা গরম থাকতে পারে, তবে সাথে দলা বা শক্ত ভাব থাকলে সেটি আর্দ্রতায় নষ্ট হওয়া সিমেন্ট।' },
        { en: 'Stone Quarry Dust Blending: Mixing 15% fine granite/stone dust leaves a sandy gritty sensation during finger rubbing.', bn: 'পাথরের গুঁড়া ভেজাল দিলে আঙুলে ঘষার সময় সুজি বা মিহি বালির মতো খসখসে দানা অনুভূত হয়।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Visual-Tactile Quality Index', bn: 'দৃশ্যমান ও স্পর্শগত মান সূচক' },
          equation: 'Pass Criteria: Color = Uniform Greenish-Grey ∧ Smoothness = Silky ∧ Temp ≤ 38°C',
          variables: [
            { en: 'T_bag = Internal cement temperature inside bag (°C)', bn: 'T_bag = ব্যাগের ভেতরের সিমেন্টের তাপমাত্রা (°সে.)' },
            { en: 'Color & Rub Codes = 1 (Uniform/Smooth), 2 (Marginal), 3 (Failing/Gritty)', bn: 'রঙ ও মসৃণতা কোড = ১ (সঠিক), ২ (মাঝারি), ৩ (ভেজাল/খসখসে)' },
          ],
          unitNote: 'Warm (> 45°C) + gritty cement risks flash set and concrete cracking.',
        },
      ],
      workedExample: {
        en: 'Uniform greenish-grey powder (1), silky smooth rubbing (1), and cool bag core 29°C (≤ 38°C) → PASS. Gritty feel (3) or > 45°C core heat → Hold & verify 90µm sieve residue.',
        bn: 'সমান সবুজাভ-ধূসর রঙ (১), মসৃণ স্পর্শ (১) এবং ব্যাগের ভেতর তাপমাত্রা ২৯°সে. (≤ ৩৮°সে.) → পাস। খসখসে ভাব বা >৪৫°সে. তাপ থাকলে চালনি পরীক্ষা করুন।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Uniform Greenish-Grey + Silky Smooth + Cool (≤ 38°C)', codeLimit: 'PWD Field Spec', interpretation: { en: 'Well-ground pure clinker cement with zero gritty adulteration.', bn: 'সঠিকভাবে পেষা খাঁটি সিমেন্ট—কোনো খসখসে ভেজাল নেই।' } },
      { tier: 'WARNING', rangeLabel: 'Slightly Pale/Warm (39–45°C) OR Faintly Coarse', codeLimit: 'Verify 90µm Sieve', interpretation: { en: 'Cool down freshly delivered mill-hot cement 48 h before batching or test 90µm sieve fineness.', bn: 'সদ্য ফ্যাক্টরি থেকে আসা গরম সিমেন্ট হলে ৪৮ ঘণ্টা ঠান্ডা করে এবং ৯০ মাইক্রন চালনি টেস্ট করে ব্যবহার করুন।' } },
      { tier: 'FAIL', rangeLabel: 'Streaky/Yellowish OR Gritty Sand Feel OR Hot (> 45°C)', codeLimit: 'REJECT / LAB HOLD', interpretation: { en: 'Adulterated with stone dust/chalk or actively hydrating inside bag—unfit for RCC.', bn: 'পাথরের গুঁড়া ভেজাল বা ব্যাগের ভেতরেই বিক্রিয়া শুরু হয়েছে—আরসিসিতে ব্যবহার নিষেধ।' } },
    ],
    remedialActions: [
      { en: 'If gritty texture is felt, immediately run LAB-CEM-06 (90-Micron Sieve Fineness Test); reject if residue exceeds 10%.', bn: 'আঙুলে খসখসে দানা লাগলে সাথে সাথেই ৯০-মাইক্রন চালনি পরীক্ষা করুন; ১০%-এর বেশি অবশেষ থাকলে ট্রাক ফেরত দিন।' },
      { en: 'Do not mix hot cement (> 45°C) directly into summer structural pours to prevent rapid slump loss and plastic shrinkage cracking.', bn: 'গরম সিমেন্ট (>৪৫°সে.) সরাসরি ঢালাইয়ে দিলে দ্রুত স্লাম্প হারিয়ে প্লাস্টিক শ্রিঙ্কেজ ফাটল ধরবে।' },
    ],
    calculatorInputs: [
      {
        key: 'colorCode',
        label: { en: 'Color Inspection', bn: 'রঙ পর্যবেক্ষণ' },
        unit: 'grade',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '1 — Uniform Greenish-Grey', bn: '১ — সমান সবুজাভ-ধূসর (আদর্শ)' } },
          { value: 2, label: { en: '2 — Slightly Pale / Light Grey', bn: '২ — সামান্য ফ্যাকাশে ধূসর' } },
          { value: 3, label: { en: '3 — Yellowish / Streaky / Blotchy', bn: '৩ — হলদেটে বা ছোপ ছোপ দাগ' } },
        ],
      },
      {
        key: 'rubCode',
        label: { en: 'Finger-Rubbing Smoothness', bn: 'আঙুলে ঘষার মসৃণতা' },
        unit: 'feel',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '1 — Silky Flour-Like Smooth', bn: '১ — আটার মতো নরম ও মসৃণ' } },
          { value: 2, label: { en: '2 — Trace Fine Grains', bn: '২ — সামান্য মিহি দানা ভাব' } },
          { value: 3, label: { en: '3 — Distinctly Gritty / Sandy', bn: '৩ — স্পষ্ট বালির মতো খসখসে' } },
        ],
      },
      { key: 'bagCoreTempC', label: { en: 'Inside Bag Temperature', bn: 'ব্যাগের ভেতরের তাপমাত্রা' }, unit: '°C', defaultValue: 29, min: 10, max: 75, step: 0.5 },
    ],
  },

  // 1.3 FIELD CHECK 3: FLOAT TEST (পানিতে ভাসা পরীক্ষা)
  {
    id: 'cem-field-float',
    domainId: 'cement',
    code: 'LAB-CEM-03',
    title: {
      en: 'Field Cement Check #3: Water Float & Settling Test',
      bn: 'সাইট সিমেন্ট পরীক্ষা #৩: পানিতে ভাসা ও থিতানো (Float) পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'তাৎক্ষণিক সাইট ফিল্ড চেক',
    governingCodes: ['PWD Field QA Manual', 'BNBC-2020 Part 6'],
    objective: {
      en: 'Quickly distinguishes pure dense Portland cement (Specific Gravity ≈ 3.15) from lighter chalk, rice-husk ash, excess fly-ash, or soapstone powder adulterants on site without needing laboratory instruments.',
      bn: 'ল্যাব যন্ত্রপাতি ছাড়াই সাইটে খাঁটি পোর্টল্যান্ড সিমেন্টের (আপেক্ষিক গুরুত্ব ≈ ৩.১৫) সাথে হালকা চক পাউডার, ছাই বা সাবান পাথর গুঁড়ার ভেজাল আছে কিনা তা তাৎক্ষণিক শনাক্ত করে।',
    },
    sampling: {
      frequency: { en: 'Every suspicious batch or once per incoming truck challan.', bn: 'প্রতিটি ট্রাকের সিমেন্টে অথবা সন্দেহজনক ব্যাচের ক্ষেত্রে।' },
      quantity: { en: 'One clean teaspoon (~5–10 g) of dry cement from bag center.', bn: 'ব্যাগের মাঝখান থেকে ১ চা চামচ (প্রায় ৫–১০ গ্রাম) শুকনো সিমেন্ট।' },
      lotSize: { en: 'Each delivery batch (5–20 MT).', bn: 'প্রতিটি ডেলিভারি লট (৫–২০ মে. টন)।' },
    },
    apparatus: [
      { item: { en: 'Transparent Glass Beaker / Clear Bucket', bn: 'স্বচ্ছ কাচের গ্লাস বা পরিষ্কার বালতি' }, spec: 'Depth ≥ 150 mm, clean potable water' },
      { item: { en: 'Clean Dry Spoon', bn: 'পরিষ্কার শুকনো চামচ' }, spec: 'Stainless steel / plastic' },
    ],
    procedure: [
      { en: 'Fill a clean transparent bucket or tall beaker with still, clear potable water and let all water movement stop completely.', bn: 'একটি স্বচ্ছ গ্লাস বা বালতিতে পরিষ্কার পানি ভরে পানির ঢেউ পুরোপুরি স্থির হতে দিন।' },
      { en: 'Gently sprinkle ~5 g (a generous pinch) of dry cement onto the water surface from ~50 mm height—do NOT dump it in a lump.', bn: 'পানির ওপর প্রায় ৫০ মিমি উচ্চতা থেকে ১ চিমটি (~৫ গ্রাম) সিমেন্ট আলতোভাবে ছিটিয়ে দিন (একসাথে ঢালবেন না)।' },
      { en: 'Observe surface behavior with a stopwatch/watch: pure cement floats briefly (3 to 10 seconds) before breaking surface tension and sinking smoothly.', bn: 'ঘড়ি ধরে দেখুন: খাঁটি সিমেন্ট ৩ থেকে ১০ সেকেন্ড পানির ওপরে ভেসে থেকে ধীরে ধীরে নিচে ডুবে যাবে।' },
      { en: 'Check the water surface and bottom after 30 seconds: water should remain clear with zero persistent floating white chalk scum or oily film.', bn: '৩০ সেকেন্ড পর দেখুন: সব সিমেন্ট নিচে থিতিয়ে যাবে এবং পানির ওপরে সাদা ফেনা, চক বা তেলতেলে স্তর ভেসে থাকবে না।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Always sprinkle loose dry powder gently; dropping a compacted scoop causes even adulterated material to sink immediately by momentum.', bn: 'সিমেন্ট আলতো করে ছিটিয়ে দেবেন; চামচ ভরে একসাথে ফেললে ভেজাল সিমেন্টও ভারে সাথে সাথে ডুবে যেতে পারে।' },
        { en: 'Use clean, oil-free water—soap or oil film on the glass breaks surface tension artificially.', bn: 'তেল বা সাবানমুক্ত পরিষ্কার পানি ও গ্লাস ব্যবহার করুন।' },
      ],
      contractorTricks: [
        { en: 'Immediate Sinking vs Endless Floating: If powder sinks like stone immediately (0 sec float), it is pre-hydrated/heavy stone sand; if a white layer stays floating beyond 30 seconds, chalk, lime, or excess light ash is present.', bn: 'সাথে সাথে পাথরের মতো ডুবে গেলে সিমেন্ট আগেই আর্দ্রতা পেয়ে ভারী হয়ে গেছে, আর ৩০ সেকেন্ডের বেশি ওপরে ভেসে থাকলে চুন, চক বা হালকা ছাই ভেজাল রয়েছে।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Water Float & Surface Residue Rule', bn: 'ভাসা ও ভাসমান অবশেষ যাচাই' },
          equation: 'Pass: 3 s ≤ T_float ≤ 15 s  ∧  Residual Floating Scum = 0%',
          variables: [
            { en: 'T_float = Time taken for sprinkled particles to initiate sinking (sec)', bn: 'T_float = ছিটিয়ে দেওয়া সিমেন্ট ডুবতে শুরু করার সময় (সেকেন্ড)' },
            { en: 'Scum Code = Visual surface residue after 30 seconds', bn: 'ভাসমান অবশেষ = ৩০ সেকেন্ড পর পানির ওপর থাকা স্তরের অবস্থা' },
          ],
          unitNote: 'Pure cement SG ≈ 3.15 yields brief float followed by complete settling.',
        },
      ],
      workedExample: {
        en: 'Sprinkled cement floats 6 seconds then sinks cleanly to the bottom leaving 0% surface scum → PASS (Consistent with pure Portland cement SG ≈ 3.15).',
        bn: 'ছিটিয়ে দেওয়া সিমেন্ট ৬ সেকেন্ড ভেসে থাকার পর সম্পূর্ণ নিচে ডুবে গেলে এবং ওপরে কোনো স্তর (০%) না থাকলে → পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Floats 3–15 s then sinks completely (No Scum)', codeLimit: 'Field Pass', interpretation: { en: 'Expected density and fineness of unhydrated Portland cement.', bn: 'আর্দ্রতা-মুক্ত খাঁটি পোর্টল্যান্ড সিমেন্টের স্বাভাবিক ঘনত্ব প্রমাণিত।' } },
      { tier: 'WARNING', rangeLabel: 'Sinks in 1–2 s OR Trace Fly-Ash Film', codeLimit: 'Check CEM-II Blend', interpretation: { en: 'Note: PCC (CEM-II/A-M or B-M) contains mineral slag/fly-ash which may leave slight grey film; confirm bag grade & 90µm sieve.', bn: 'PCC (CEM-II) সিমেন্টে ফ্লাই-অ্যাশ বা স্ল্যাগ থাকায় সামান্য ছাই ভাসতে পারে—ব্যাগের গ্রেড ও ল্যাব টেস্ট মিলিয়ে নিন।' } },
      { tier: 'FAIL', rangeLabel: 'Instant Stone Drop (0 s) OR Heavy Chalk Scum > 30 s', codeLimit: 'REJECT / LAB TEST', interpretation: { en: 'Likely moisture-spoiled coarse lumps or chalk/lime adulteration.', bn: 'সিমেন্ট পানি লেগে নষ্ট হয়েছে অথবা চক/চুনের ভেজাল রয়েছে—বাতিল বা ল্যাব টেস্ট করুন।' } },
    ],
    remedialActions: [
      { en: 'Quarantine truckload if white/oily scum floats past 30 seconds or particles drop straight like sand; send sealed sample for ASTM C109 mortar strength.', bn: '৩০ সেকেন্ডের বেশি সাদা স্তর ভেসে থাকলে বা বালির মতো সরাসরি ডুবে গেলে সিমেন্ট ব্যবহার বন্ধ রেখে ল্যাবে মর্টার শক্তি পরীক্ষা করুন।' },
    ],
    calculatorInputs: [
      { key: 'floatTimeSec', label: { en: 'Observed Initial Float Duration', bn: 'পানিতে ভেসে থাকার সময়' }, unit: 'sec', defaultValue: 6, min: 0, max: 60, step: 0.5 },
      {
        key: 'scumCode',
        label: { en: 'Surface Scum After 30 Seconds', bn: '৩০ সেকেন্ড পর উপরের অবস্থা' },
        unit: 'status',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '1 — Clean Water, All Sunk', bn: '১ — সম্পূর্ণ ডুবে গেছে, পানি পরিষ্কার' } },
          { value: 2, label: { en: '2 — Slight Grey Mineral Film (PCC)', bn: '২ — সামান্য ধূসর আস্তরণ (PCC)' } },
          { value: 3, label: { en: '3 — Heavy White/Chalk Scum', bn: '৩ — ঘন সাদা চক/তেলতেলে স্তর' } },
        ],
      },
    ],
  },

  // 1.4 FIELD CHECK 4: GLASS PLATE PASTE SETTING TEST
  {
    id: 'cem-field-glass-plate',
    domainId: 'cement',
    code: 'LAB-CEM-04',
    title: {
      en: 'Field Cement Check #4: Glass Plate Thick-Paste Setting & Crack Test',
      bn: 'সাইট সিমেন্ট পরীক্ষা #৪: কাঁচের প্লেটে ঘন পেস্ট সেটিং ও ফাটল পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'তাৎক্ষণিক সাইট ফিল্ড চেক',
    governingCodes: ['PWD Field Manual', 'BNBC-2020 Part 6'],
    objective: {
      en: 'Evaluates cohesive hardening and shrinkage stability of cement paste on site within 24 hours—detecting dead/stale cement that stays soft or unsound cement that warps and cracks off the glass plate.',
      bn: '২৪ ঘণ্টার মধ্যে সাইটে সিমেন্ট পেস্টের জমাট বাঁধার ক্ষমতা ও সঙ্কোচন স্থায়িত্ব পরীক্ষা করে—যাতে পুরনো অকার্যকর সিমেন্ট (যা শক্ত হয় না) বা অতিরিক্ত চুনযুক্ত সিমেন্ট (যা বেঁকে ফেটে যায়) ধরা পড়ে।',
    },
    sampling: {
      frequency: { en: 'Once per incoming brand/batch or whenever stale godown stock is suspected.', bn: 'প্রতিটি নতুন ব্র্যান্ড বা লটের জন্য অথবা পুরনো সিমেন্ট সন্দেহ হলে।' },
      quantity: { en: '100 g dry cement mixed with ~30–35 mL clean water into a stiff thick pat.', bn: '১০০ গ্রাম শুকনো সিমেন্টের সাথে ~৩০–৩৫ মি.লি. পানি মিশিয়ে ঘন পেস্ট।' },
      lotSize: { en: 'Up to 20 MT consignment.', bn: 'সর্বোচ্চ ২০ মেট্রিক টন চালান।' },
    },
    apparatus: [
      { item: { en: 'Clean Flat Glass Plate (150 × 150 mm)', bn: 'সমতল কাঁচের প্লেট (১৫০ × ১৫০ মিমি)' }, spec: 'Thickness ≥ 4 mm, clean & grease-free' },
      { item: { en: 'Bucket with Clean Water & Gauging Trowel', bn: 'পরিষ্কার পানির বালতি ও কর্ণিক' }, spec: 'Shaded storage at ambient site temp' },
    ],
    procedure: [
      { en: 'Mix 100 g cement with ~30% water into a thick cohesive paste (stiff enough to mold cleanly without running).', bn: '১০০ গ্রাম সিমেন্টে ~৩০% পানি দিয়ে ঘন ও আঠালো পেস্ট তৈরি করুন যাতে গড়িয়ে না পড়ে।' },
      { en: 'Form a cake/pat ~80 mm diameter, 12 mm thick at center tapering to thin 2 mm sharp edges on the flat glass plate.', bn: 'কাঁচের প্লেটের ওপর মাঝখানে ১২ মিমি পুরু ও চারপাশে পাতলা (২ মিমি) চ্যাপ্টা কেক বা পেস্ট পিঠা তৈরি করুন।' },
      { en: 'After 30 minutes in shade (moist cover), immerse the glass plate gently into a bucket of clean water and leave undisturbed for 24 hours.', bn: 'ছায়ায় ৩০ মিনিট রেখে প্লেটটি আলতো করে পানির বালতিতে ডুবিয়ে দিন এবং ২৪ ঘণ্টা পর তুলে আনুন।' },
      { en: 'Inspect at 24 hours: good cement sets rock-hard to fingernail pressure with zero distortion, curling, or radial edge cracks.', bn: '২৪ ঘণ্টা পর পরীক্ষা করুন: ভালো সিমেন্ট নখ দিয়ে আঁচড়ালে শক্ত পাথরের মতো থাকবে এবং কিনারায় কোনো ফাটল বা বেঁকে যাওয়া থাকবে না।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Keep pat covered with damp cloth for the first 30 min before submerging so direct hot sun does not induce false drying cracks.', bn: 'প্রথম ৩০ মিনিট কড়া রোদে না রেখে ভেজা চট বা ছায়ায় রাখুন; রোদে শুকালে ভুয়া শ্রিঙ্কেজ ফাটল দেখা দিতে পারে।' },
      ],
      contractorTricks: [
        { en: 'Stale/Dead Cement Check: Expired cement submerged for 24 h washes out softly under finger pressure instead of turning crisp and ringing when tapped.', bn: 'মেয়াদোত্তীর্ণ মৃত সিমেন্ট ২৪ ঘণ্টা পানিতে রাখার পরও নরম কাদার মতো থাকে এবং আঙুলের চাপে ভেঙে যায়।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: '24-Hour Pat Cohesion & Soundness Check', bn: '২৪-ঘণ্টা পেস্ট দৃঢ়তা ও স্থায়িত্ব নিয়ম' },
          equation: 'Pass: Pat Hardened (24h) ∧ Surface Cracks = None ∧ Edge Curling = 0 mm',
          variables: [
            { en: 'Hardness Rating = 1 (Rock Hard), 2 (Slightly Soft), 3 (Crumbles)', bn: 'দৃঢ়তা = ১ (পাথরের মতো শক্ত), ২ (সামান্য নরম), ৩ (গুঁড়া হয়ে ভেঙে যায়)' },
            { en: 'Crack Rating = 1 (None), 2 (Hairline Edge), 3 (Warped / Radial Cracks)', bn: 'ফাটল = ১ (কোনো ফাটল নেই), ২ (সামান্য কিনারায়), ৩ (বেঁকে ফেটে গেছে)' },
          ],
          unitNote: 'Curled/cracked pat indicates unsoundness (excess CaO); soft pat indicates dead cement.',
        },
      ],
      workedExample: {
        en: 'At 24 h under water, cake is rock-hard to fingernail (1) with 0 cracks/warping (1) → PASS.',
        bn: '২৪ ঘণ্টা পানির নিচে থাকার পর পেস্টটি নখে দাগ না কাটার মতো শক্ত (১) এবং কোনো ফাটল বা বাঁক না থাকলে (১) → পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Hardened Firmly at 24 h + Zero Cracks/Warping', codeLimit: 'PWD Field Spec', interpretation: { en: 'Sound, hydraulically active cement suitable for RCC.', bn: 'স্থিতিশীল ও কার্যকর সিমেন্ট—ঢালাইয়ের উপযুক্ত।' } },
      { tier: 'WARNING', rangeLabel: 'Hairline Edge Check OR Slow Hardening (PCC)', codeLimit: 'Run Vicat & Soundness', interpretation: { en: 'PCC may gain 24h hardness slightly slower; confirm via LAB-CEM-08/09 if edges show hairline marks.', bn: 'PCC সিমেন্ট ২৪ ঘণ্টায় তুলনামূলক কিছুটা কম শক্ত হতে পারে—সন্দেহ থাকলে ভিক্যাট ও সাউন্ডনেস টেস্ট করুন।' } },
      { tier: 'FAIL', rangeLabel: 'Soft/Washable at 24 h OR Curled/Cracked Off Glass', codeLimit: 'REJECT / LAB HOLD', interpretation: { en: 'Dead stale cement or unsound excessive free lime—high risk of structural expansion failure.', bn: 'অকার্যকর পুরনো সিমেন্ট বা অতিরিক্ত চুনের কারণে প্রসারণ ফাটল—বাতিল করুন।' } },
    ],
    remedialActions: [
      { en: 'If the submerged pat remains soft or crumbles at 24 h, immediately stop concrete pouring and replace the batch.', bn: '২৪ ঘণ্টায়ও পেস্ট নরম বা ভঙ্গুর থাকলে সাথে সাথে ঢালাই বন্ধ করে সিমেন্টের লট পরিবর্তন করুন।' },
      { en: 'If the pat warps or develops radial cracks, verify Le-Chatelier expansion (LAB-CEM-09 ≤ 10 mm) before acceptance.', bn: 'পেস্ট বেঁকে বা ফেটে গেলে লি-চ্যাটেলিয়ার সাউন্ডনেস টেস্ট (≤ ১০ মিমি) ছাড়া অনুমোদন দেবেন না।' },
    ],
    calculatorInputs: [
      {
        key: 'hardnessCode',
        label: { en: '24-Hr Hardness (Fingernail Test)', bn: '২৪ ঘণ্টা পর দৃঢ়তা (নখ পরীক্ষা)' },
        unit: 'rating',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '1 — Rock Hard (No Dent)', bn: '১ — পাথরের মতো শক্ত (দাগ পড়ে না)' } },
          { value: 2, label: { en: '2 — Firm but Scratches', bn: '২ — শক্ত তবে নখে সামান্য দাগ পড়ে' } },
          { value: 3, label: { en: '3 — Soft / Crumbles in Water', bn: '৩ — নরম / পানিতে গলে ভেঙে যায়' } },
        ],
      },
      {
        key: 'crackCode',
        label: { en: 'Distortion & Cracking Status', bn: 'ফাটল ও বেঁকে যাওয়ার অবস্থা' },
        unit: 'rating',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '1 — Zero Cracks, Flat on Glass', bn: '১ — কোনো ফাটল বা বাঁক নেই' } },
          { value: 2, label: { en: '2 — Hairline Shrinkage on Edge', bn: '২ — কিনারায় সামান্য সূক্ষ্ম দাগ' } },
          { value: 3, label: { en: '3 — Warped / Radial Soundness Cracks', bn: '৩ — বেঁকে গেছে / বড় ফাটল ধরেছে' } },
        ],
      },
    ],
  },

  // 1.5 FIELD CHECK 5: DATE OF PACKING & STORAGE STRENGTH REDUCTION CHECK
  {
    id: 'cem-field-packing-storage',
    domainId: 'cement',
    code: 'LAB-CEM-05',
    title: {
      en: 'Field Cement Check #5: Date of Packing & Storage Age Strength Reduction Calculator',
      bn: 'সাইট সিমেন্ট পরীক্ষা #৫: উৎপাদন তারিখ ও গুদামজাতকরণে শক্তি হ্রাস (Strength Loss) যাচাই',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'তাৎক্ষণিক সাইট ফিল্ড চেক',
    governingCodes: ['IS 456 / BNBC-2020', 'PWD Quality Manual', 'Portland Cement Assoc.'],
    objective: {
      en: 'Audits manufacturing Week/Month stamp on cement bags and quantifies moisture-induced 28-day strength loss over storage duration (3 months ≈ 20% loss, 6 months ≈ 30% loss, 12 months ≈ 40% loss) so expired batches are re-tested or rejected.',
      bn: 'ব্যাগে মুদ্রিত উৎপাদনের তারিখ/সপ্তাহ পরীক্ষা করে এবং গুদামে থাকার কারণে সিমেন্টের ২৮-দিনের শক্তি কত % কমে যায় (৩ মাসে ~২০%, ৬ মাসে ~৩০%, ১২ মাসে ~৪০% হ্রাস) তা নির্ণয় করে মেয়াদোত্তীর্ণ সিমেন্ট ব্যবহার রোধ করে।',
    },
    sampling: {
      frequency: { en: 'Every delivery challan before unloading, and monthly audit for site godown stock.', bn: 'প্রতিটি ট্রাক আনলোডের আগে এবং সাইট গুদামে থাকা স্টকের ক্ষেত্রে প্রতি মাসে।' },
      quantity: { en: 'Inspect printed date/week code on minimum 10 bags across top, middle, and bottom layers of stack.', bn: 'স্ট্যাকের ওপর, মাঝ ও নিচের স্তরের কমপক্ষে ১০টি ব্যাগের গায়ে প্রিন্ট করা তারিখ/সপ্তাহ কোড দেখুন।' },
      lotSize: { en: 'Each manufacturing week batch.', bn: 'প্রতিটি উৎপাদন সপ্তাহের ব্যাচ।' },
    },
    apparatus: [
      { item: { en: 'Batch Tag / Calendar Verification Sheet', bn: 'ব্যাচ ট্যাগ ও সপ্তাহ-ক্যালেন্ডার চার্ট' }, spec: 'Tracks ISO Week 01–52 & Month/Year' },
    ],
    procedure: [
      { en: 'Locate the manufacturing date / week stamp printed along the side flap or stitched tag of the bag (e.g., W42/2026 or 15 Oct 2026).', bn: 'ব্যাগের পাশের প্যানেল বা সেলাই ট্যাগে লেখা উৎপাদন তারিখ বা সপ্তাহ নম্বর (যেমন W42/2026 বা ১৫ অক্টো ২০২৬) খুঁজে বের করুন।' },
      { en: 'Calculate total elapsed days (and months) between manufacturing date and today’s planned concrete pour date.', bn: 'উৎপাদনের তারিখ থেকে আজকের ঢালাইয়ের তারিখ পর্যন্ত মোট অতিক্রান্ত দিন ও মাস হিসাব করুন।' },
      { en: 'Check the storage strength retention table: fresh cement (≤ 4–6 weeks) gives 100% rated strength; 3 months drops ~20%; 6 months drops ~30%; 12 months drops ~40% (and 24 months ~50%).', bn: 'শক্তি হ্রাস চার্ট দেখুন: তাজা সিমেন্ট (≤ ১–১.৫ মাস) ১০০% শক্তি দেয়; ৩ মাসে ~২০%, ৬ মাসে ~৩০%, ১২ মাসে ~৪০% ও ২৪ মাসে ~৫০% শক্তি কমে যায়।' },
      { en: 'Enforce BNBC / IS 456 rule: any cement stored > 3 months (90 days) in humid Bangladesh conditions MUST pass ASTM C109 mortar strength re-testing before structural RCC use.', bn: 'বাংলাদেশের আর্দ্র আবহাওয়ায় ৩ মাস (৯০ দিন)-এর বেশি পুরনো সিমেন্ট অবশ্যই ল্যাবে কম্প্রেসিভ স্ট্রেন্থ পুনরায় পরীক্ষা (Re-test) না করে আরসিসিতে ব্যবহার করবেন না।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Bangladesh coastal/monsoon humidity (>80% RH) accelerates strength loss faster than dry climates; cover stacks tightly with heavy tarpaulin.', bn: 'বাংলাদেশের বর্ষা ও উপকূলীয় উচ্চ আর্দ্রতায় (>৮০% RH) সিমেন্ট দ্রুত শক্তি হারায়—স্ট্যাক ভারী ত্রিপল/পলিথিনে ঢেকে রাখুন।' },
      ],
      contractorTricks: [
        { en: 'Hidden Old Stock Under Fresh Truck: Dealers sometimes hide 4-month-old bags at the bottom of a truck under 2-week-old fresh bags—always inspect bottom layers during unloading.', bn: 'নতুন ব্যাগের নিচে পুরনো ব্যাগ চালান দেওয়া: ট্রাকের ওপরে তাজা ব্যাগ রেখে নিচে ৪–৫ মাস পুরনো ব্যাগ লুকিয়ে রাখা হয়—আনলোডের সময় নিচের ব্যাগের তারিখও দেখুন।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Storage Age Strength Loss Interpolation (%)', bn: 'গুদামজাত বয়স অনুযায়ী শক্তি হ্রাস (%)' },
          equation: 'Loss(%): 0–1m = 0% | 3m (90d) ≈ 20% | 6m (180d) ≈ 30% | 12m (365d) ≈ 40% | 24m ≈ 50%',
          variables: [
            { en: 'Age_d = Elapsed days since Date of Packing (days)', bn: 'Age_d = উৎপাদনের তারিখ থেকে অতিক্রান্ত দিন' },
            { en: 'Retained(%) = 100 - Estimated_Loss(%)', bn: 'Retained(%) = অবশিষ্ট সম্ভাব্য শক্তির হার (%)' },
          ],
          unitNote: 'BNBC / IS 456 mandatory re-test cutoff: Age > 90 days (3 months).',
        },
      ],
      workedExample: {
        en: 'Cement packed 45 days ago (1.5 months) has ~6.7% strength reduction (~93.3% retained) and is ≤ 90 days cutoff → PASS for direct RCC use. Cement at 110 days (> 3 months) loses ~22% strength → HOLD for mandatory mortar re-test.',
        bn: '৪৫ দিন (১.৫ মাস) আগে উৎপাদিত সিমেন্টে সম্ভাব্য শক্তি হ্রাস ~৬.৭% (৯৩.৩% অবশিষ্ট) এবং বয়স ≤ ৯০ দিন → পাস। ১১০ দিন (>৩ মাস) হলে ~২২% শক্তি কমে যায়—ল্যাব রি-টেস্ট ছাড়া আরসিসিতে ব্যবহার নিষেধ।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Age ≤ 60 Days (Loss < 12%)', codeLimit: 'Fresh Lot (Optimum)', interpretation: { en: 'Full-potency fresh cement ready for columns, slabs, and high-strength RCC.', bn: 'তাজা ও পূর্ণ শক্তিসম্পন্ন সিমেন্ট—কলাম, ছাদ ও উচ্চ শক্তির আরসিসিতে সরাসরি ব্যবহারযোগ্য।' } },
      { tier: 'WARNING', rangeLabel: 'Age 61–90 Days (Loss ~12–20%)', codeLimit: 'Use Priority FIFO / Screen', interpretation: { en: 'Approaching 3-month cutoff (~20% loss at 90d); consume immediately in secondary RCC or increase cement factor by 10–15% if verified lump-free.', bn: '৩ মাসের সীমার কাছাকাছি (৯০ দিনে ~২০% হ্রাস); দলামুক্ত থাকলে দ্রুত ব্যবহার করুন অথবা সিমেন্টের পরিমাণ ১০–১৫% বাড়ান।' } },
      { tier: 'FAIL', rangeLabel: 'Age > 90 Days (Loss ≥ 20%–40%)', codeLimit: 'RE-TEST MANDATORY / REJECT', interpretation: { en: 'Exceeds 3-month shelf limit; ~20% loss at 3m, ~30% at 6m, ~40% at 12m. Do NOT use in structural RCC without passing ASTM C109 lab test.', bn: '৩ মাস পার হয়েছে—৩ মাসে ~২০%, ৬ মাসে ~৩০% এবং ১২ মাসে ~৪০% শক্তি হারায়; ল্যাব টেস্ট ছাড়া আরসিসিতে ব্যবহার সম্পূর্ণ নিষেধ।' } },
    ],
    remedialActions: [
      { en: 'If cement exceeds 90 days (3 months), run ASTM C109 3/7-day mortar cube strength test; if strength passes at least 80% of rated grade, adjust concrete mix proportion (+15–25% cement) or downgrade to non-structural PCC/plaster.', bn: '৯০ দিনের বেশি পুরনো সিমেন্টের জন্য মর্টার কিউব টেস্ট করুন অথবা নন-স্ট্রাকচারাল সিসি ঢালাই ও প্লাস্টারের কাজে নামিয়ে দিন।' },
    ],
    calculatorInputs: [
      { key: 'storageAgeDays', label: { en: 'Days Elapsed Since Packing Date', bn: 'উৎপাদনের পর অতিক্রান্ত দিন' }, unit: 'days', defaultValue: 35, min: 1, max: 730, step: 1 },
      { key: 'ratedGradeMpa', label: { en: 'Nominal 28-Day Cement Grade', bn: 'সিমেন্টের মূল গ্রেড শক্তি' }, unit: 'MPa', defaultValue: 42.5, min: 32.5, max: 52.5, step: 10 },
    ],
  },

  // 1.6 LAB TEST 6: FINENESS OF CEMENT BY 90-MICRON SIEVE
  {
    id: 'cem-fineness-sieve',
    domainId: 'cement',
    code: 'LAB-CEM-06',
    title: {
      en: 'Fineness of Cement by 90-Micron (#170) Sieve (ASTM C430 / IS 4031)',
      bn: '৯০-মাইক্রন (#১৭০) চালনিতে সিমেন্টের সূক্ষ্মতা বা ফাইননেস পরীক্ষা',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি পরীক্ষা',
    governingCodes: ['ASTM C430', 'IS 4031 Part 1', 'BDS EN 196-6'],
    objective: {
      en: 'Quantifies the coarse grain fraction retained above 90 µm. Finer cement exposes greater surface area to water, speeding up early hydration and strength gain—whereas >10% coarse residue signals poor grinding, moisture caking, or gritty adulteration.',
      bn: '৯০ মাইক্রনের বড় মোটা দানার শতকরা হার নির্ণয় করে। সিমেন্ট যত মিহি হবে পানির সাথে বিক্রিয়া তত দ্রুত হবে ও প্রারম্ভিক শক্তি বাড়বে; ১০%-এর বেশি অবশেষ থাকলে কারখানায় দুর্বল পেষণ, আর্দ্রতা জমে যাওয়া বা পাথরের গুঁড়ার ভেজাল ধরা পড়ে।',
    },
    sampling: {
      frequency: { en: 'Once per 50 MT (1,000 bags) or whenever coarse/lumpy cement is suspected.', bn: 'প্রতি ৫০ মেট্রিক টনে একবার অথবা সিমেন্ট মোটা বা ভেজাল সন্দেহ হলে।' },
      quantity: { en: 'Exactly 100 g dry cement sample (W₁) freed of soft air-lumps by finger pressure.', bn: 'হাতে হালকা দলা ভেঙে ঠিক ১০০ গ্রাম শুকনো সিমেন্ট (W₁)।' },
      lotSize: { en: 'Up to 50 MT per batch.', bn: 'সর্বোচ্চ ৫০ মেট্রিক টন লট।' },
    },
    apparatus: [
      { item: { en: '90-Micron (#170 ASTM / IS 90 µm) Brass Sieve with Lid & Pan', bn: '৯০-মাইক্রন (#১৭০ মেশ) চালনি, ঢাকনা ও প্যান' }, spec: '200 mm diameter wire-cloth mesh' },
      { item: { en: 'Analytical Balance & Soft Bristle Brush', bn: 'অ্যানালিটিক্যাল ডিজিটাল ব্যালেন্স ও নরম ব্রাশ' }, spec: 'Least count 0.01 g' },
    ],
    procedure: [
      { en: 'Inspect 90 µm sieve mesh against light for pinholes or tears; clean gently with a soft dry bristle brush.', bn: '৯০ মাইক্রন চালনি আলোতে ধরে ছিদ্র বা ছেঁড়া আছে কিনা দেখুন ও নরম ব্রাশে পরিষ্কার করুন।' },
      { en: 'Weigh exactly W₁ = 100.0 g of dry cement (after lightly rubbing soft air-agglomerates between fingers) and place it on the 90 µm sieve with pan attached.', bn: 'নরম দলা আঙুলে গুঁড়া করে ঠিক W₁ = ১০০.০ গ্রাম সিমেন্ট প্যান লাগানো ৯০ মাইক্রন চালনিতে নিন।' },
      { en: 'Fit the lid securely and sieve continuously with gentle horizontal wrist-shaking and rotating taps for exactly 15 minutes.', bn: 'ঢাকনা আটকে ঠিক ১৫ মিনিট ধরে হাতের কব্জি ঘুরিয়ে ও আলতো ঝাঁকুনি দিয়ে একটানা চালুন।' },
      { en: 'Brush dust clinging to the underside of the sieve mesh cleanly into the pan, then weigh the coarse residue retained ON the 90 µm sieve (W₂).', bn: 'চালনির নিচে লেগে থাকা গুঁড়া ব্রাশ দিয়ে প্যানে ফেলে চালনির ওপরে আটকে থাকা মোটা অবশেষের ওজন (W₂) নিন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Never press cement through the 90 µm brass mesh using fingers or a trowel—this stretches wire openings permanently.', bn: 'আঙুল বা কর্ণিক দিয়ে চাপ দিয়ে সিমেন্ট চালনির ভেতর দিয়ে পার করবেন না—এতে তারের ফাঁক বড় হয়ে ভুল রিডিং আসবে।' },
        { en: 'Dry the sample in an oven at 105°C only if slightly damp; otherwise keep sealed in airtight jar until weighing.', bn: 'নমুনা আদ্র হলে প্রয়োজনে শুকিয়ে ওজন নিন এবং পরীক্ষার সময় বাতাসের আর্দ্রতা এড়িয়ে চলুন।' },
      ],
      contractorTricks: [
        { en: 'Stone Dust / Sand Adulteration Detection: Cheap stone crusher dust contains 20–40% particles coarser than 90 µm, making this simple sieve test an instant fraud detector.', bn: 'পাথরের গুঁড়া ভেজাল ধরার সহজ উপায়: সস্তা পাথর বা বালির গুঁড়া মেশানো থাকলে ৯০ মাইক্রন চালনিতে অবশেষ ১০%-এর অনেক বেশি (১৫–৩০%) পাওয়া যায়।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Sieve Fineness Residue Percentage (R)', bn: '৯০ মাইক্রন চালনিতে অবশেষ শতকরা হার (R)' },
          equation: 'R(%) = (W₂ / W₁) × 100',
          variables: [
            { en: 'W₁ = Initial dry cement sample weight (e.g., 100.0 g)', bn: 'W₁ = মোট নমুনা সিমেন্টের ওজন (যেমন ১০০.০ গ্রাম)' },
            { en: 'W₂ = Weight retained on 90 µm (#170) sieve after 15 min (g)', bn: 'W₂ = ১৫ মিনিট চালনার পর ৯০ মাইক্রন চালনিতে অবশিষ্ট ওজন (গ্রাম)' },
          ],
          unitNote: 'IS 269 / ASTM C430 / PWD limit: Residue R ≤ 10.0% for OPC (≤ 5% Rapid Hardening).',
        },
      ],
      workedExample: {
        en: 'For W₁ = 100.0 g OPC sample, retained weight after 15 min sieving is W₂ = 4.5 g → R = (4.5 / 100.0) × 100 = 4.50% (≤ 10% OPC limit → PASS).',
        bn: 'W₁ = ১০০.০ গ্রাম সিমেন্ট ১৫ মিনিট চালার পর চালনিতে W₂ = ৪.৫ গ্রাম অবশেষ থাকলে → R = (৪.৫ / ১০০.০) × ১০০ = ৪.৫০% (≤ ১০% সীমা → পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Residue R ≤ 8.0%', codeLimit: 'OPC ≤ 10% (Optimal)', interpretation: { en: 'Finely ground cement ensuring fast hydration, high early strength, and low bleeding.', bn: 'উত্তম মিহি সিমেন্ট—দ্রুত শক্তি অর্জন ও কংক্রিটের ব্লিডিং কমায়।' } },
      { tier: 'WARNING', rangeLabel: '8.0% < Residue ≤ 10.0%', codeLimit: 'Upper Pass Margin', interpretation: { en: 'Borderline OPC fineness limit; confirm Blaine air permeability (≥ 225–280 m²/kg) and 7-day strength.', bn: 'সর্বোচ্চ অনুমোদিত ১০% সীমার কাছাকাছি—ব্লেইন ফাইননেস ও ৭-দিনের মর্টার স্ট্রেন্থ যাচাই করুন।' } },
      { tier: 'FAIL', rangeLabel: 'Residue R > 10.0%', codeLimit: 'REJECT LOT', interpretation: { en: 'Coarse grinding, moisture pre-hydration, or adulteration—poor strength and high bleeding.', bn: 'মোটা দানা, আর্দ্রতায় জমা বা ভেজাল মিশ্রণ—শক্তি কম হবে; পুরো লট বাতিল করুন।' } },
    ],
    remedialActions: [
      { en: 'Reject the lot if 90 µm residue exceeds 10.0% for OPC; coarse particles stay unhydrated inside concrete and reduce strength.', bn: 'অবশেষ ১০%-এর বেশি হলে পুরো সিমেন্ট ব্যাচ বাতিল করুন; মোটা দানা পানির সাথে বিক্রিয়া করতে পারে না।' },
    ],
    calculatorInputs: [
      { key: 'totalMassG', label: { en: 'Initial Sample Weight (W₁)', bn: 'মোট নমুনার ওজন (W₁)' }, unit: 'g', defaultValue: 100, min: 50, max: 500, step: 10 },
      { key: 'retainedMassG', label: { en: 'Weight Retained on 90µm Sieve (W₂)', bn: '৯০µm চালনিতে অবশিষ্ট ওজন (W₂)' }, unit: 'g', defaultValue: 4.5, min: 0, max: 100, step: 0.1 },
    ],
  },

  // 1.7 LAB TEST 7: NORMAL CONSISTENCY OF CEMENT (VICAT APPARATUS)
  {
    id: 'cem-normal-consistency',
    domainId: 'cement',
    code: 'LAB-CEM-07',
    title: {
      en: 'Normal Consistency of Cement by Vicat Apparatus (ASTM C187 / IS 4031)',
      bn: 'ভিক্যাট যন্ত্রে সিমেন্টের নরমাল কনসিস্টেন্সি (পানির চাহিদা) পরীক্ষা',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি পরীক্ষা',
    governingCodes: ['ASTM C187', 'IS 4031 Part 4', 'BS EN 196-3'],
    objective: {
      en: 'Establishes the exact percentage of mixing water (P) required to produce a standard Vicat cement paste where a 10 mm plunger penetrates 5 to 7 mm from the bottom (33 to 35 mm from the top of the 40 mm mould). Essential prerequisite before setting time & soundness tests.',
      bn: 'স্ট্যান্ডার্ড সিমেন্ট পেস্ট তৈরি করতে ঠিক কত % পানি (P) লাগে তা নির্ণয় করে—যেখানে ১০ মিমি প্লাঞ্জারটি ৪০ মিমি মোল্ডের তলা থেকে ৫–৭ মিমি ওপরে (উপর থেকে ৩৩–৩৫ মিমি) থামে। এটি সেটিং টাইম ও সাউন্ডনেস পরীক্ষার মূল ভিত্তি।',
    },
    sampling: {
      frequency: { en: 'Once per 50 MT (1,000 bags) or every brand/grade/batch change.', bn: 'প্রতি ৫০ মেট্রিক টন সিমেন্টে অথবা ব্র্যান্ড/গ্রেড পরিবর্তন হলে।' },
      quantity: { en: '400 g (or 500 g) dry cement per trial batch (prepare 3–4 trials = 1.6 kg total).', bn: 'প্রতি ট্রায়ালের জন্য ৪০০ গ্রাম (অথবা ৫০০ গ্রাম) শুকনো সিমেন্ট (মোট ১.৬ কেজি)।' },
      lotSize: { en: 'Up to 50 MT lot.', bn: 'সর্বোচ্চ ৫০ মেট্রিক টন লট।' },
    },
    apparatus: [
      { item: { en: 'Vicat Apparatus with 10 mm Cylindrical Plunger', bn: 'ভিক্যাট অ্যাপারেটাস ও ১০ মিমি ব্যাসের প্লাঞ্জার' }, spec: '300 ± 1 g moving rod, 40 mm high brass mould' },
      { item: { en: 'Non-Porous Glass Base Plate & Gauging Trowels', bn: 'কাঁচের বেস প্লেট ও দুটি কর্ণিক' }, spec: '27 ± 2°C ambient test room' },
      { item: { en: 'Precision Balance (0.1 g) & Graduated Cylinder (1 mL)', bn: 'ডিজিটাল ব্যালেন্স ও মাপার সিলিন্ডার' }, spec: 'Stopwatch for 3–5 min gauging' },
    ],
    procedure: [
      { en: 'Weigh W_cement = 400 g dry cement on a clean non-porous plate and add a trial volume of potable water (start around 28%, i.e., 112 mL).', bn: '৪০০ গ্রাম সিমেন্ট মেপে প্লেটে নিন এবং প্রাথমিকভাবে আনুমানিক ২৮% (১১২ মি.লি.) পরিষ্কার পানি ঢালুন।' },
      { en: 'Start stopwatch at water addition and knead briskly with two trowels; total gauging time (from water contact to mould fill) MUST stay strictly between 3 and 5 minutes.', bn: 'পানি দেওয়ার সাথে সাথে স্টপওয়াচ চালু করে কর্ণিক দিয়ে দ্রুত পেস্ট মেশান; পানি মেশানো থেকে ছাঁচ ভরা পর্যন্ত সময় অবশ্যই ৩–৫ মিনিটের মধ্যে হতে হবে।' },
      { en: 'Fill the 40 mm Vicat ring mould resting on a flat glass plate, tap gently to expel trapped air, and level flush with the top edge.', bn: 'গ্লাস প্লেটের ওপর রাখা ৪০ মিমি ভিক্যাট ছাঁচে পেস্ট ভরে হালকা টোকা দিয়ে বাতাস বের করে উপরের তল সমান করে দিন।' },
      { en: 'Lower the 10 mm diameter plunger gently to touch the paste center, release quickly without initial thrust, and read scale penetration from bottom after 30 seconds.', bn: '১০ মিমি প্লাঞ্জারটি পেস্টের ঠিক মাঝখানে স্পর্শ করিয়ে বিনা ধাক্কায় ছেড়ে দিন এবং ৩০ সেকেন্ড পর স্কেলে তলা থেকে দূরত্ব মাপুন।' },
      { en: 'Repeat with fresh cement and adjusted water % until the plunger stops 5 to 7 mm from the bottom (33 to 35 mm penetration from the top).', bn: 'তলা থেকে ৫–৭ মিমি ওপরে (উপর থেকে ৩৩–৩৫ মিমি) না থামা পর্যন্ত পানির পরিমাণ কম-বেশি করে নতুন নমুনায় ট্রায়াল দিন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Maintain gauging strictly within 3–5 minutes; slow mixing lets initial hydration stiffen paste and gives falsely high P%.', bn: 'মিক্সিং ৩–৫ মিনিটের মধ্যে শেষ করুন; দেরি করলে পেস্ট শক্ত হয়ে পানির চাহিদা (P%) ভুল বেশি দেখাবে।' },
        { en: 'Zero the Vicat pointer cleanly on the bare glass plate before running trials.', bn: 'পরীক্ষার আগে খালি কাঁচের প্লেটের ওপর প্লাঞ্জার নামিয়ে ভিক্যাট স্কেলের জিরো (0) ঠিক করে নিন।' },
      ],
      contractorTricks: [
        { en: 'Excessive Water Demand (>34%): Often occurs when limestone filler, fly-ash, or unburnt clay is over-blended into low-grade PCC, forcing contractors to add extra site water that weakens concrete.', bn: 'অতিরিক্ত পানির চাহিদা (>৩৪%): নিম্নমানের সিমেন্টে বেশি চুনাপাথর বা ছাই মেশালে P% বেড়ে যায়—ফলে ঢালাইয়ের সময় মিস্ত্রিরা বাড়তি পানি মিশিয়ে কংক্রিটের শক্তি নষ্ট করে।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Standard Consistency Water Percent (P)', bn: 'নরমাল কনসিস্টেন্সি শতকরা হার (P)' },
          equation: 'P(%) = (W_water / W_cement) × 100',
          variables: [
            { en: 'W_water = Water mass/volume yielding 5–7 mm bottom clearance (mL ≡ g)', bn: 'W_water = তলা থেকে ৫–৭ মিমি ফাঁকা রাখা পানির পরিমাণ (মি.লি.)' },
            { en: 'W_cement = Dry cement mass (g)', bn: 'W_cement = শুকনো সিমেন্টের ওজন (গ্রাম)' },
          ],
          unitNote: 'Typical Bangladesh OPC (CEM-I): 26%–30%; PCC (CEM-II): 28%–33%.',
        },
      ],
      workedExample: {
        en: 'For W_cement = 400 g requiring W_water = 116 mL to achieve 6.0 mm clearance from bottom (34 mm from top): P = (116 / 400) × 100 = 29.0% (Within standard 26%–33% band → PASS).',
        bn: '৪০০ গ্রাম সিমেন্টে ১১৬ মি.লি. পানি মিশিয়ে তলা থেকে ৬.০ মিমি (উপর থেকে ৩৪ মিমি) পেনিট্রেশন পেলে → P = (১১৬ / ৪০০) × ১০০ = ২৯.০% (আদর্শ ২৬%–৩৩% সীমা → পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'P = 26%–33% & Bottom Clearance 5.0–7.0 mm', codeLimit: 'ASTM C187 / IS 4031', interpretation: { en: 'Valid standard consistency achieved; water demand is normal for OPC/PCC.', bn: 'আদর্শ কনসিস্টেন্সি অর্জিত হয়েছে—সিমেন্টের পানির চাহিদা স্বাভাবিক।' } },
      { tier: 'WARNING', rangeLabel: 'Clearance ≠ 5–7 mm OR P = 33.1%–35.0%', codeLimit: 'Retest Trial / High Demand', interpretation: { en: 'If clearance ≠ 5–7 mm, adjust trial water ±4 mL; if P > 33%, cement has high fineness or mineral filler demand.', bn: 'তলা থেকে দূরত্ব ৫–৭ মিমি না হলে পানির পরিমাণ ±৪ মি.লি. বদলে নতুন ট্রায়াল দিন।' } },
      { tier: 'FAIL', rangeLabel: 'P < 24% OR P > 35%', codeLimit: 'Abnormal Water Demand', interpretation: { en: 'Severe grinding/filler abnormality or pre-hydration; verify mortar cube strength before approval.', bn: 'অস্বাভাবিক কম বা বেশি পানির চাহিদা—ভেজাল বা নষ্ট সিমেন্ট হতে পারে; ল্যাবে মর্টার টেস্ট করুন।' } },
    ],
    remedialActions: [
      { en: 'If plunger penetrates < 33 mm from top (> 7 mm from bottom), repeat trial with MORE water; if > 35 mm (< 5 mm from bottom), repeat with LESS water.', bn: 'প্লাঞ্জার উপর থেকে ৩৩ মিমি-এর কম ঢুকলে পরের ট্রায়ালে পানি বাড়ান, আর ৩৫ মিমি-এর বেশি ঢুকলে পানি কমান।' },
      { en: 'If converged P exceeds 34%, check slump retention and adjust concrete superplasticizer dosage rather than raising w/c ratio.', bn: 'কনসিস্টেন্সি ৩৪%-এর বেশি হলে মিক্স ডিজাইনে পানির বদলে অ্যাডমিক্সচার ব্যবহার করে ওয়ার্কেবিলিটি ঠিক রাখুন।' },
    ],
    calculatorInputs: [
      { key: 'cementMassG', label: { en: 'Dry Cement Weight (W_cement)', bn: 'শুকনো সিমেন্টের ওজন' }, unit: 'g', defaultValue: 400, min: 200, max: 1000, step: 50 },
      { key: 'waterAddedMl', label: { en: 'Water Added (W_water)', bn: 'মেশানো পানির পরিমাণ' }, unit: 'mL', defaultValue: 116, min: 50, max: 450, step: 1 },
      { key: 'bottomClearanceMm', label: { en: 'Reading From Bottom of Mold (Target 5–7)', bn: 'ছাঁচের তলা থেকে দূরত্ব (টার্গেট ৫–৭)' }, unit: 'mm', defaultValue: 6.0, min: 0, max: 40, step: 0.5 },
    ],
  },

  // 1.8 LAB TEST 8: INITIAL & FINAL SETTING TIME OF CEMENT (VICAT NEEDLE)
  {
    id: 'cem-setting-time',
    domainId: 'cement',
    code: 'LAB-CEM-08',
    title: {
      en: 'Initial & Final Setting Time by Vicat Needle (ASTM C191 / BDS EN 197)',
      bn: 'ভিক্যাট নিডল দ্বারা সিমেন্টের ইনিশিয়াল (IST) ও ফাইনাল সেটিং টাইম (FST) পরীক্ষা',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি পরীক্ষা',
    governingCodes: ['ASTM C191 / C150', 'BDS EN 197-1 / 196-3', 'IS 4031 Part 5'],
    objective: {
      en: 'Determines Initial Setting Time (IST) and Final Setting Time (FST) using water = 0.85 × P × W_cement. IST < 45 min is dangerous because concrete begins stiffening during transit/pouring—causing cold joints and incomplete vibration; FST > 600 min delays formwork stripping and slows floor cycles.',
      bn: '০.৮৫ × P × W_cement পানি দিয়ে সিমেন্টের ইনিশিয়াল (IST) ও ফাইনাল সেটিং টাইম (FST) নির্ণয় করে। IST < ৪৫ মিনিট অত্যন্ত বিপজ্জনক কারণ গাড়িতে আনা বা ঢালাইয়ের সময়ই কংক্রিট শক্ত হয়ে কোল্ড জয়েন্ট ও হানিকম্বিং তৈরি করে; আবার FST > ৬০০ মিনিট হলে সাটারিং খুলতে দেরি হয়।',
    },
    sampling: {
      frequency: { en: 'Once per 50 MT (1,000 bags) or every brand/batch change.', bn: 'প্রতি ৫০ মেট্রিক টনে একবার অথবা ব্র্যান্ড/ব্যাচ পরিবর্তনে।' },
      quantity: { en: '400 g (or 500 g) dry cement gauged with 0.85 × P water.', bn: '৪০০ গ্রাম (বা ৫০০ গ্রাম) শুকনো সিমেন্ট এবং ০.৮৫ × P পরিমাণ পানি।' },
      lotSize: { en: 'Up to 50 MT batch.', bn: 'সর্বোচ্চ ৫০ মেট্রিক টন ব্যাচ।' },
    },
    apparatus: [
      { item: { en: 'Vicat Apparatus with 1 mm² Square/Round Needle & 5 mm Annular Attachment', bn: 'ভিক্যাট অ্যাপারেটাস (১ মিমি² নিডল ও ৫ মিমি অ্যানুলার রিং)' }, spec: '300 ± 1 g rod, 40 mm Vicat mould' },
      { item: { en: 'Stopwatch / Digital Lab Timer & Humidity Chamber', bn: 'স্টপওয়াচ ও আদ্রতা চেম্বার (৯০% RH, ২৭±২°সে.)' }, spec: '1-minute resolution' },
    ],
    procedure: [
      { en: 'Compute setting test gauging water = 0.85 × (P / 100) × W_cement from LAB-CEM-07.', bn: 'নরমাল কনসিস্টেন্সি (P) থেকে পানির পরিমাণ = ০.৮৫ × (P / ১০০) × W_cement নির্ণয় করুন।' },
      { en: 'Record clock time T₁ at the instant water touches cement, mix within 3–5 min, fill the Vicat mould on glass plate, and place in 90% RH curing cabinet.', bn: 'সিমেন্টে পানি মেশানোর ঠিক মুহূর্তে সময় T₁ লিখে রাখুন, ৩–৫ মিনিটে পেস্ট বানিয়ে ছাঁচ ভরে আদ্রতা চেম্বারে রাখুন।' },
      { en: 'Using the 1 mm² needle, test at 5–10 min intervals. Initial Setting Time (IST = T₂ - T₁) is when the needle stops at 5 ± 0.5 mm from the bottom (35 mm from top).', bn: '১ মিমি² নিডল দিয়ে প্রতি ৫–১০ মিনিট পরপর পরীক্ষা করুন। তলা থেকে ৫ ± ০.৫ মিমি ওপরে আটকে যাওয়ার সময় T₂ হতে IST = T₂ - T₁ বের করুন।' },
      { en: 'Replace with the 5 mm annular collar attachment. Final Setting Time (FST = T₃ - T₁) is when the central needle makes a slight impression while the outer circular ring makes NO mark on the paste.', bn: 'এবার ৫ মিমি অ্যানুলার রিং যুক্ত নিডল লাগান। মাঝের সুই দাগ কাটলেও বাইরের রিং পেস্টে কোনো গোল দাগ কাটতে না পারলে সেই সময় T₃ হতে FST = T₃ - T₁ নির্ণয় করুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Release the moving rod gently without throwing/pushing and wipe the needle tip clean before every drop.', bn: 'প্রতিবার নিডল ছাড়ার আগে মাথা পরিষ্কার করে মুছে নিন এবং ধাক্কা না দিয়ে আলতোভাবে ছেড়ে দিন।' },
        { en: 'Keep test spots at least 5 mm away from previous holes and 10 mm clear of mould rim.', bn: 'পূর্বের ছিদ্র থেকে কমপক্ষে ৫ মিমি দূরে এবং ছাঁচের কিনারা থেকে ১০ মিমি ভেতরে নিডল বসান।' },
      ],
      contractorTricks: [
        { en: 'Low-Gypsum Flash Set & Over-Retarded Adulteration: Poorly controlled grinding mills omit gypsum (causing dangerous IST < 30 min flash set in transit) or dump excess industrial slag/gypsum (pushing FST > 600 min and stalling slab stripping).', bn: 'জিপসাম কারচুপি: জিপসাম কম দিলে গাড়িতেই কংক্রিট ৩০ মিনিটের আগে জমে যায় (Flash Set), আবার অতিরিক্ত স্ল্যাগ/জিপসাম দিলে ১০ ঘণ্টায়ও শক্ত হয় না (FST > ৬০০ মি.)।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: '0.85P Setting Water & Elapsed Setting Times', bn: '০.৮৫P পানির পরিমাণ ও সেটিং টাইম সূত্র' },
          equation: 'W_set = 0.85 × (P/100) × W_cement  |  IST = T₂ - T₁  |  FST = T₃ - T₁',
          variables: [
            { en: 'T₁ = Clock time when water is added to cement (min)', bn: 'T₁ = পানি মেশানোর শুরুর সময় (মিনিট)' },
            { en: 'T₂ = Time 1 mm² needle penetrates to 5 ± 0.5 mm from bottom (min)', bn: 'T₂ = ১ মিমি² নিডল তলা থেকে ৫ মিমি ওপরে থামার সময় (মিনিট)' },
            { en: 'T₃ = Time 5 mm annular attachment leaves no circular impression (min)', bn: 'T₃ = অ্যানুলার রিং কোনো দাগ না কাটার সময় (মিনিট)' },
          ],
          unitNote: 'ASTM C150: IST ≥ 45 min, FST ≤ 375 min (6.25 hrs) | BDS EN 197-1: IST ≥ 60 min (42.5N), FST ≤ 600 min (10 hrs).',
        },
      ],
      workedExample: {
        en: 'For W_cement = 400 g & P = 29%: W_set = 0.85 × 0.29 × 400 = 98.6 mL. Water added T₁ = 0 min, IST T₂ = 140 min (IST = 140 min ≥ 60 min), FST T₃ = 295 min (FST = 295 min ≤ 375/600 min) → PASS.',
        bn: '৪০০ গ্রাম সিমেন্ট ও P = ২৯% হলে পানি = ০.৮৫ × ০.২৯ × ৪০০ = ৯৮.৬ মি.লি.। T₁ = ০, T₂ = ১৪০ মি. (IST = ১৪০ মি. ≥ ৬০ মি.), T₃ = ২৯৫ মি. (FST = ২৯৫ মি. ≤ ৩৭৫/৬০০ মি.) → পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'IST ≥ 60 min & FST ≤ 375 min', codeLimit: 'BDS EN 197 & ASTM C150', interpretation: { en: 'Ideal hydration rate: safe transit/placing window and timely hardening for formwork cycle.', bn: 'আদর্শ সেটিং সময়: মিক্সার থেকে ঢালাই ও ভাইব্রেশনের যথেষ্ট সময় পাওয়া যাবে এবং সময়মতো শক্ত হবে।' } },
      { tier: 'WARNING', rangeLabel: 'IST 45–59 min OR FST 376–600 min', codeLimit: 'EN 197 Max / Retarder Check', interpretation: { en: 'Passes ASTM 45 min / IS 600 min bounds but tighter margin: verify transit time in summer heat or keep props longer if FST > 375 min.', bn: 'ASTM/IS সীমায় থাকলেও সতর্কতা প্রয়োজন: গরমে দ্রুত ঢালাই শেষ করুন বা FST বেশি হলে সাটারিং খোলায় সময় নিন।' } },
      { tier: 'FAIL', rangeLabel: 'IST < 45 min OR FST > 600 min', codeLimit: 'REJECT CEMENT LOT', interpretation: { en: 'IST < 45 min risks transit stiffening & cold joints; FST > 600 min indicates stale/adulterated cement delaying shuttering.', bn: 'IST < ৪৫ মিনিটে গাড়িতেই কংক্রিট জমে যাবে (কোল্ড জয়েন্ট), আর FST > ৬০০ মিনিটে ঢালাই শক্ত হতে দেরি হবে—ব্যাচ বাতিল করুন।' } },
    ],
    remedialActions: [
      { en: 'Reject any cement with IST < 45 minutes immediately; never use in ready-mix concrete or long-lead pours.', bn: 'IST ৪৫ মিনিটের কম হলে সিমেন্ট সাথে সাথে বাতিল করুন; রেডি-মিক্স বা ছাদের ঢালাইয়ে এটি মারাত্মক ঝুঁকিপূর্ণ।' },
      { en: 'If FST exceeds 600 minutes, hold structural batching, increase formwork propping duration, and verify 7-day compressive strength.', bn: 'FST ৬০০ মিনিট ছাড়ালে ঢালাই বন্ধ করে সাটারিংয়ের সময় বাড়ান এবং ৭-দিনের শক্তি পরীক্ষা করুন।' },
    ],
    calculatorInputs: [
      { key: 'cementMassG', label: { en: 'Cement Sample Weight', bn: 'সিমেন্টের ওজন' }, unit: 'g', defaultValue: 400, min: 200, max: 1000, step: 50 },
      { key: 'consistencyPct', label: { en: 'Normal Consistency (P)', bn: 'নরমাল কনসিস্টেন্সি (P)' }, unit: '%', defaultValue: 29.0, min: 22, max: 40, step: 0.5 },
      { key: 't1WaterMin', label: { en: 'T₁: Water Added Time', bn: 'T₁: পানি মেশানোর সময়' }, unit: 'min', defaultValue: 0, min: 0, max: 120, step: 1 },
      { key: 't2InitialMin', label: { en: 'T₂: Initial Set Reading Time', bn: 'T₂: ইনিশিয়াল সেটিং সময়' }, unit: 'min', defaultValue: 140, min: 5, max: 500, step: 5 },
      { key: 't3FinalMin', label: { en: 'T₃: Final Set Reading Time', bn: 'T₃: ফাইনাল সেটিং সময়' }, unit: 'min', defaultValue: 295, min: 30, max: 900, step: 5 },
    ],
  },

  // 1.9 LAB TEST 9: SOUNDNESS TEST BY LE-CHATELIER APPARATUS
  {
    id: 'cem-soundness-lechatelier',
    domainId: 'cement',
    code: 'LAB-CEM-09',
    title: {
      en: 'Cement Soundness Test by Le-Chatelier Apparatus (BS EN 196-3 / IS 4031)',
      bn: 'লি-চ্যাটেলিয়ার যন্ত্রে সিমেন্টের সাউন্ডনেস বা প্রসারণ পরীক্ষা (BS EN 196-3)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি পরীক্ষা',
    governingCodes: ['BS EN 196-3', 'BDS EN 197-1', 'IS 4031 Part 3'],
    objective: {
      en: 'Measures potential delayed volumetric expansion (>10 mm) caused by excess uncombined free lime (CaO) or magnesia (MgO) in over/under-burnt clinker—preventing map-cracking and spalling months after concrete hardens.',
      bn: 'ক্লিংকারে থাকা অতিরিক্ত মুক্ত চুন (CaO) বা ম্যাগনেশিয়ার (MgO) কারণে কংক্রিট শক্ত হওয়ার কয়েক মাস পর ভয়াবহ প্রসারণ ও ফাটল (Map-Cracking / Spalling) হবে কিনা তা প্রসারণ মেপে (সীমা ≤ ১০ মিমি) যাচাই করে।',
    },
    sampling: {
      frequency: { en: 'Every 100 MT or brand change / suspicion of high free-lime clinker.', bn: 'প্রতি ১০০ মেট্রিক টনে অথবা ব্র্যান্ড পরিবর্তন / কাঁচা ক্লিংকার সন্দেহ হলে।' },
      quantity: { en: '100 g dry cement mixed with 0.78 × P potable water.', bn: '১০০ গ্রাম শুকনো সিমেন্ট এবং ০.৭৮ × P পরিমাণ পরিষ্কার পানি।' },
      lotSize: { en: 'Up to 100 MT batch.', bn: 'সর্বোচ্চ ১০০ মেট্রিক টন লট।' },
    },
    apparatus: [
      { item: { en: 'Le-Chatelier Split Brass Mould & Two 165 mm Indicator Arms', bn: 'লি-চ্যাটেলিয়ার স্প্লিট ব্রাস মোল্ড ও ২টি ১৬৫ মিমি সূচক দণ্ড' }, spec: '30 mm internal dia × 30 mm height, 0.5 mm split' },
      { item: { en: '2 Glass Cover Plates, Lead Weight & Boiling Water Bath', bn: '২টি কাঁচের প্লেট, ওজন ও ফুটন্ত পানির বাথ' }, spec: 'Boils continuously at 100°C for 3 hours' },
      { item: { en: 'Digital Vernier Caliper / Millimeter Scale', bn: 'ডিজিটাল ভার্নিয়ার ক্যালিপার / মিমি স্কেল' }, spec: 'Least count 0.1 mm / 0.5 mm' },
    ],
    procedure: [
      { en: 'Lightly oil the inside of the Le-Chatelier split cylinder and set it on a lightly oiled flat glass plate.', bn: 'লি-চ্যাটেলিয়ার মোল্ডের ভেতর হালকা তেল মেখে একটি তেল-মাখা কাঁচের প্লেটের ওপর বসান।' },
      { en: 'Gauge 100 g cement with 0.78 × P water within 3–5 min, fill the mould keeping the split seam closed gently, cover with a second glass plate + weight, and submerge in 27 ± 2°C water for 24 hours.', bn: '১০০ গ্রাম সিমেন্ট ০.৭৮ × P পানিতে গুলে মোল্ড পূর্ণ করুন, ওপরে আরেকটি কাঁচের প্লেট ও ওজন দিয়ে ২৭±২°সে. পানিতে ২৪ ঘণ্টা ডুবিয়ে রাখুন।' },
      { en: 'Remove from cold bath and measure the exact distance L₁ (mm) separating the tips of the two indicator arms.', bn: '২৪ ঘণ্টা পর ঠান্ডা পানি থেকে তুলে দুটি সূচক দণ্ডের মাথার মধ্যবর্তী দূরত্ব L₁ (মিমি) মাপুন।' },
      { en: 'Submerge in boiling water bath, bring to boiling within 25–30 min, boil steadily for 3 hours, cool to room temperature, and measure the final distance L₂ (mm).', bn: 'এবার মোল্ডটি ফুটন্ত পানির বাথে ডুবিয়ে ৩ ঘণ্টা একটানা ফোটান; ঠান্ডা করে সূচক দণ্ডের মাথার নতুন দূরত্ব L₂ (মিমি) মাপুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Verify the split brass cylinder springs cleanly before filling; never bind it rigidly with wire or heavy clamps.', bn: 'মোল্ড ভরার আগে এর ফাঁকা অংশ সহজে প্রসারিত হয় কিনা দেখুন—তার বা ক্ল্যাম্প দিয়ে চেপে বাঁধবেন না।' },
        { en: 'Cool boiled specimens back to room temperature (27°C) before measuring L₂ to avoid thermal brass error.', bn: '৩ ঘণ্টা ফোটানোর পর পিতলের তাপীয় প্রসারণ বাদ দিতে ঘরের তাপমাত্রায় ঠান্ডা করে তবেই L₂ মাপুন।' },
      ],
      contractorTricks: [
        { en: 'Over-Limed Poor-Kiln Cement: Low-cost vertical shaft kiln clinkers contain >2% free CaO that passes 7-day tests cleanly yet cracks plasters and slabs 6 months later—boiling exposes this instantly.', bn: 'অতিরিক্ত চুনযুক্ত নিম্নমানের ক্লিংকার ৭ দিনে ভালো শক্তি দিলেও ৬ মাস পর প্লাস্টার ও ছাদে জালের মতো ফাটল ধরায়—৩ ঘণ্টা ফুটানো টেস্টে তা সাথে সাথে ধরা পড়ে।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Le-Chatelier Unsoundness Expansion (mm)', bn: 'লি-চ্যাটেলিয়ার প্রসারণ (মিমি)' },
          equation: 'Expansion = L₂ - L₁ (mm)',
          variables: [
            { en: 'L₁ = Indicator gap after 24h 27°C water bath (mm)', bn: 'L₁ = ২৪ ঘণ্টা ঠান্ডা পানিতে থাকার পর সূচকের দূরত্ব (মিমি)' },
            { en: 'L₂ = Indicator gap after 3h 100°C boiling bath & cooling (mm)', bn: 'L₂ = ৩ ঘণ্টা ফুটানোর ও ঠান্ডা করার পর সূচকের দূরত্ব (মিমি)' },
          ],
          unitNote: 'BS EN 196-3 / BDS EN 197-1 / IS 269 Limit: Expansion ≤ 10.0 mm.',
        },
      ],
      workedExample: {
        en: 'For L₁ = 12.0 mm (after 24h water bath) and L₂ = 14.5 mm (after 3h boil & cool): Expansion = 14.5 - 12.0 = 2.5 mm (≤ 10.0 mm code limit → PASS).',
        bn: '২৪ ঘণ্টা পর L₁ = ১২.০ মিমি এবং ৩ ঘণ্টা ফোটানোর পর L₂ = ১৪.৫ মিমি হলে → প্রসারণ = ১৪.৫ - ১২.০ = ২.৫ মিমি (≤ ১০.০ মিমি সীমা → পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Expansion ≤ 8.0 mm', codeLimit: 'BDS EN 197-1 (≤ 10 mm)', interpretation: { en: 'Volume-stable cement with well-combined clinker; negligible delayed CaO expansion risk.', bn: 'আয়তন-স্থিতিশীল উত্তম সিমেন্ট—পরবর্তীতে প্রসারণ ফাটলের ঝুঁকি নেই।' } },
      { tier: 'WARNING', rangeLabel: '8.1 mm ≤ Expansion ≤ 10.0 mm', codeLimit: 'Upper Code Limit', interpretation: { en: 'Near ceiling limit; aerate cement in dry shade for 7 days and re-test (free lime hydrates harmlessly in air).', bn: 'সর্বোচ্চ ১০ মিমি সীমার কাছাকাছি—৭ দিন শুকনো ছায়ায় ছড়িয়ে রেখে পুনরায় পরীক্ষা করে দেখুন।' } },
      { tier: 'FAIL', rangeLabel: 'Expansion > 10.0 mm', codeLimit: 'UNSOUND — REJECT', interpretation: { en: 'Excess free CaO/MgO causing severe delayed concrete cracking & plaster pop-outs; reject batch.', bn: 'অতিরিক্ত মুক্ত চুন বা ম্যাগনেশিয়া (>১০ মিমি)—কংক্রিট ও প্লাস্টার ফাটিয়ে দেবে; লট বাতিল করুন।' } },
    ],
    remedialActions: [
      { en: 'If initial expansion exceeds 10 mm due to free CaO, BS/IS allows aeration of a spread sample for 7 days followed by re-test (must pass ≤ 5 mm aerated); otherwise reject completely.', bn: 'প্রসারণ >১০ মিমি হলে ট্রাক ফিরিয়ে দিন অথবা ৭ দিন ছড়িয়ে রেখে রি-টেস্টে ≤ ৫ মিমি না আসলে সম্পূর্ণ বাতিল করুন।' },
    ],
    calculatorInputs: [
      { key: 'initialGapMm', label: { en: 'Distance After 24h Water Bath (L₁)', bn: '২৪ ঘণ্টা পর সূচক দূরত্ব (L₁)' }, unit: 'mm', defaultValue: 12.0, min: 1, max: 60, step: 0.5 },
      { key: 'finalGapMm', label: { en: 'Distance After 3h Boiling Bath (L₂)', bn: '৩ ঘণ্টা ফুটানোর পর দূরত্ব (L₂)' }, unit: 'mm', defaultValue: 14.5, min: 1, max: 80, step: 0.5 },
    ],
  },

  // 1.10 LAB TEST 10: COMPRESSIVE STRENGTH OF CEMENT MORTAR CUBE
  {
    id: 'cem-mortar-strength',
    domainId: 'cement',
    code: 'LAB-CEM-10',
    title: {
      en: 'Compressive Strength of Cement Mortar Cube (ASTM C109 / BS EN 196-1)',
      bn: 'সিমেন্ট মর্টার কিউব কম্প্রেসিভ স্ট্রেন্থ পরীক্ষা (ASTM C109 / BDS EN 196-1)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি পরীক্ষা',
    governingCodes: ['ASTM C109', 'BDS EN 197-1 / 196-1', 'IS 4031 Part 6'],
    objective: {
      en: 'Directly measures the actual hydraulic strength class (e.g., CEM-I 42.5N, 52.5N, or PCC CEM-II 42.5N) at 3, 7, and 28 days using 1:3 Standard Graded Ottawa/Ennore Sand mortar cubes—verifying mill certificates and structural grade compliance.',
      bn: '১:৩ অনুপাতে স্ট্যান্ডার্ড অটোয়া/এন্নোর বালির মর্টার কিউব তৈরি করে ৩, ৭ ও ২৮ দিনে সিমেন্টের প্রকৃত শক্তি (CEM-I 42.5N / 52.5N এবং PCC CEM-II) নির্ণয় করে ও মিল সার্টিফিকেটের সত্যতা যাচাই করে।',
    },
    sampling: {
      frequency: { en: 'Once per 100 MT (2,000 bags) or every brand/grade change & stored batches > 90 days.', bn: 'প্রতি ১০০ মেট্রিক টনে অথবা ব্র্যান্ড পরিবর্তন ও >৯০ দিন পুরনো সিমেন্টের ক্ষেত্রে।' },
      quantity: { en: 'Minimum 9 mortar cubes (3 for 3-day, 3 for 7-day, 3 for 28-day): 1:3 Cement : Standard Graded Sand at w/c = 0.485.', bn: 'কমপক্ষে ৯টি মর্টার কিউব (৩, ৭ ও ২৮ দিনের জন্য ৩টি করে): ১:৩ সিমেন্ট-স্ট্যান্ডার্ড বালি, w/c = ০.৪৮৫।' },
      lotSize: { en: 'Single consignment up to 100 MT.', bn: 'সর্বোচ্চ ১০০ মেট্রিক টন চালান।' },
    },
    apparatus: [
      { item: { en: '50×50 mm (2" Cube) or 70.6×70.6 mm Steel Cube Moulds', bn: '৫০×৫০ মিমি (A=২৫০০ মিমি²) বা ৭০.৬×৭০.৬ মিমি (A=৫০০০ মিমি²) স্টিল মোল্ড' }, spec: 'Precision rigid 3-gang brass/steel moulds' },
      { item: { en: 'Standard Graded Ottawa (ASTM C778) / Ennore Sand & Vibrator', bn: 'স্ট্যান্ডার্ড গ্রেডেড অটোয়া/এন্নোর বালি ও ভাইব্রেটর' }, spec: '1:3 Cement-to-Sand weight ratio, w/c = 0.485' },
      { item: { en: 'Compression Testing Machine (CTM) & Curing Tank', bn: 'কম্প্রেশন টেস্টিং মেশিন (CTM) ও কিউরিং ট্যাংক' }, spec: 'Load pace 0.9–1.8 kN/s, water 27±2°C' },
    ],
    procedure: [
      { en: 'Batch 1 part cement to 3 parts Standard Graded Sand by mass (e.g., 500 g cement + 1,500 g sand for 6 × 50 mm cubes) with w/c = 0.485 (242.5 mL water for OPC).', bn: 'ওজন অনুযায়ী ১ ভাগ সিমেন্ট ও ৩ ভাগ স্ট্যান্ডার্ড বালি (যেমন ৫০০ গ্রাম সিমেন্ট + ১,৫০০ গ্রাম বালি) এবং w/c = ০.৪৮৫ হারে ২৪২.৫ মি.লি. পানি মাপুন।' },
      { en: 'Mix uniformly in a planetary mixer (or hand-trowel within 4 min), compact in 2 layers inside oiled 50×50 mm (or 70.6×70.6 mm) moulds via standard tamping/vibration.', bn: 'মোল্ডে হালকা তেল মেখে ২ স্তরে মর্টার ভরে স্ট্যান্ডার্ড টেম্পিং বা ভাইব্রেটরে কমপ্যাক্ট করুন।' },
      { en: 'Keep moulds in 90% RH chamber for 24 hours, demould carefully, mark dates, and submerge in clean 27 ± 2°C curing water until test age.', bn: '২৪ ঘণ্টা আর্দ্র চেম্বারে রেখে ছাঁচ খুলে তারিখ লিখে ২৭±২°সে. পরিষ্কার পানির ট্যাংকে ডুবিয়ে রাখুন।' },
      { en: 'Test 3 cubes at 3-day, 7-day, and 28-day in SSD condition using CTM at uniform loading rate; record peak failure loads P₁, P₂, P₃ (kN) and compute f_m = P_max / A.', bn: '৩, ৭ ও ২৮ দিনে ৩টি করে কিউব CTM মেশিনে সমভাবে চাপ দিয়ে ভাঙার লোড P₁, P₂, P₃ (kN) নিন এবং f_m = P_max / A বের করুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Never substitute ungraded local construction sand in cement strength testing—always use ASTM C778 Ottawa or IS 650 Ennore standard sand.', bn: 'সিমেন্টের শক্তি পরীক্ষায় কখনোই সাধারণ নির্মাণ বালি ব্যবহার করবেন না—অবশ্যই স্ট্যান্ডার্ড অটোয়া বা এন্নোর বালি ব্যবহার করতে হবে।' },
        { en: 'Place cube side faces (mould-cast flat faces), NOT the hand-troweled top face, against the steel CTM platens.', bn: 'কিউবের হাতে সমান করা ওপরের তল নয়, বরং ছাঁচের মসৃণ পাশের দুটি তল CTM মেশিনের প্লেটের সাথে বসান।' },
      ],
      contractorTricks: [
        { en: 'Over-Slagged PCC Passing 28d but Failing 3d Formwork Cycle: High fly-ash/slag PCC CEM-II/B-M cements may achieve 42.5 MPa at 28 days while crawling at only 12–14 MPa at 3 days—delaying safe post-tensioning or rapid slab cycles.', bn: '৩-দিনের শক্তি কম থাকা PCC: অতিরিক্ত স্ল্যাগ/অ্যাশ মেশানো সিমেন্ট ২৮ দিনে পাস করলেও ৩ দিনে খুব কম শক্তি দেয়—তাই দ্রুত সাটারিং খোলা বা শীতে ঢালাইয়ের আগে ৩ ও ৭ দিনের শক্তি চেক জরুরি।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Mortar Cube Compressive Strength (f_m)', bn: 'মর্টার কিউব কম্প্রেসিভ স্ট্রেন্থ (f_m)' },
          equation: 'f_m (MPa) = (P_max(kN) × 1000) / A (mm²)   |   1 MPa = 145.038 psi',
          variables: [
            { en: 'P_max = Mean failure load of 3 mortar cubes (kN)', bn: 'P_max = ৩টি মর্টার কিউবের গড় ভাঙা লোড (kN)' },
            { en: 'A = Cross-sectional area: 2,500 mm² (50×50 mm ASTM C109) or 5,000 mm² (70.6×70.6 mm IS)', bn: 'A = কিউবের ক্ষেত্রফল: ২,৫০০ মিমি² (৫০×৫০ মিমি) অথবা ৫,০০০ মিমি² (৭০.৬×৭০.৬ মিমি)' },
          ],
          unitNote: 'CEM-I 42.5N: 2d/3d ≥ 10/20, 7d ≥ 33, 28d ≥ 42.5 MPa | CEM-I 52.5N: 3d ≥ 27, 7d ≥ 40, 28d ≥ 52.5 MPa | CEM-II PCC 42.5N: 3d ≥ 16, 7d ≥ 28, 28d ≥ 42.5 MPa.',
        },
      ],
      workedExample: {
        en: 'For 50×50 mm cubes (A = 2,500 mm²) of CEM-I 42.5N tested at 7 days with loads [88.0, 91.5, 89.0] kN → Mean P = 89.5 kN → f_m = (89.5 × 1000)/2500 = 35.80 MPa (5,192 psi) ≥ 33.0 MPa 7-day target → PASS.',
        bn: '৫০×৫০ মিমি কিউবে (A = ২,৫০০ মিমি²) ৭ দিনের ভাঙা লোড [৮৮.০, ৯১.৫, ৮৯.০] kN → গড় ৮৯.৫ kN → f_m = (৮৯.৫ × ১০০০)/২৫০০ = ৩৫.৮০ MPa (৫,১৯২ psi) ≥ ৩৩.০ MPa টার্গেট → পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'CEM-I 42.5N: 3d≥20, 7d≥33, 28d≥42.5 | 52.5N: 3d≥27, 7d≥40, 28d≥52.5 | CEM-II PCC: 3d≥16, 7d≥28, 28d≥42.5 MPa', codeLimit: 'BDS EN 197-1 / ASTM C150', interpretation: { en: 'Meets or exceeds specified early and 28-day strength grade cleanly.', bn: 'নির্ধারিত সিমেন্ট গ্রেডের ৩, ৭ ও ২৮ দিনের প্রারম্ভিক ও চূড়ান্ত শক্তি অর্জন করেছে।' } },
      { tier: 'WARNING', rangeLabel: '90%–99% of Target Grade at 3d or 7d', codeLimit: 'Hold Upper Pour / Verify 28d', interpretation: { en: 'Slightly slow early strength (e.g., cold weather or higher mineral blend); maintain wet curing & verify 28-day cubes.', bn: 'প্রারম্ভিক শক্তি লক্ষ্যমাত্রার ৯০–৯৯%—কিউরিং বাড়িয়ে ২৮-দিনের চূড়ান্ত ফলাফল যাচাই করুন।' } },
      { tier: 'FAIL', rangeLabel: '< 90% of Grade Requirement', codeLimit: 'REJECT / DOWNGRADE MIX', interpretation: { en: 'Substandard or expired cement; unsafe for high-strength structural concrete.', bn: 'নিম্নমানের বা মেয়াদোত্তীর্ণ সিমেন্ট—স্ট্রাকচারাল আরসিসিতে ব্যবহার নিষেধ।' } },
    ],
    remedialActions: [
      { en: 'If 3-day/7-day mortar strength falls >10% short, pause structural batching, increase trial concrete mix cement content or switch brand.', bn: '৩ বা ৭ দিনের শক্তি ১০%-এর বেশি কম হলে সিমেন্টের ব্র্যান্ড বদলান অথবা স্ট্রাকচারাল ঢালাইয়ে ব্যবহার বন্ধ রাখুন।' },
    ],
    calculatorInputs: [
      {
        key: 'cementGradeCode',
        label: { en: 'Cement Class & Grade', bn: 'সিমেন্টের শ্রেণি ও গ্রেড' },
        unit: 'grade',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: 'CEM-I 42.5N (OPC)', bn: 'CEM-I 42.5N (OPC)' } },
          { value: 2, label: { en: 'CEM-I 52.5N (High-Strength OPC)', bn: 'CEM-I 52.5N (উচ্চ-শক্তি OPC)' } },
          { value: 3, label: { en: 'CEM-II 42.5N (PCC Composite)', bn: 'CEM-II 42.5N (PCC কম্পোজিট)' } },
        ],
      },
      {
        key: 'cubeSizeCode',
        label: { en: 'Mortar Cube Mould Size', bn: 'মর্টার কিউব ছাঁচের মাপ' },
        unit: 'size',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '50 × 50 mm (A = 2,500 mm² — ASTM C109)', bn: '৫০ × ৫০ মিমি (২,৫০০ মিমি²)' } },
          { value: 2, label: { en: '70.6 × 70.6 mm (A = 5,000 mm² — IS 4031)', bn: '৭০.৬ × ৭০.৬ মিমি (৫,০০০ মিমি²)' } },
        ],
      },
      {
        key: 'testAgeDays',
        label: { en: 'Test Age', bn: 'পরীক্ষার বয়স' },
        unit: 'days',
        defaultValue: 7,
        options: [
          { value: 3, label: { en: '3 Days (Early Strength)', bn: '৩ দিন (প্রারম্ভিক শক্তি)' } },
          { value: 7, label: { en: '7 Days (Intermediate Strength)', bn: '৭ দিন (মধ্যবর্তী শক্তি)' } },
          { value: 28, label: { en: '28 Days (Full Rated Strength)', bn: '২৮ দিন (পূর্ণ শক্তি)' } },
        ],
      },
      { key: 'load1Kn', label: { en: 'Cube #1 Peak Load (P₁)', bn: 'কিউব #১ ভাঙা লোড (P₁)' }, unit: 'kN', defaultValue: 88.0, min: 5, max: 500, step: 0.5 },
      { key: 'load2Kn', label: { en: 'Cube #2 Peak Load (P₂)', bn: 'কিউব #২ ভাঙা লোড (P₂)' }, unit: 'kN', defaultValue: 91.5, min: 5, max: 500, step: 0.5 },
      { key: 'load3Kn', label: { en: 'Cube #3 Peak Load (P₃)', bn: 'কিউব #৩ ভাঙা লোড (P₃)' }, unit: 'kN', defaultValue: 89.0, min: 5, max: 500, step: 0.5 },
    ],
  },

  // =========================================================================
  // CATEGORY 2: FINE & COARSE AGGREGATE TESTS (বালি ও পাথর/খোয়া পরীক্ষা)
  // 5 Complete Lab & Field Tests
  // =========================================================================

  // 2.1 FIELD SILT & CLAY CONTENT IN SAND (GRADUATED JAR / CYLINDER)
  {
    id: 'agg-sand-silt',
    domainId: 'aggregate',
    code: 'LAB-AGG-01',
    title: {
      en: 'Field Silt & Clay Content in Sand — Graduated Jar / Cylinder Method',
      bn: 'গ্র্যাজুয়েটেড জার পদ্ধতিতে বালিতে পলি ও কাদার পরিমাণ পরীক্ষা (Field Silt Test)',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'তাৎক্ষণিক সাইট ও ল্যাব পরীক্ষা',
    governingCodes: ['PWD / LGED Spec', 'ASTM C117 (3% wt)', 'IS 2386 Part 2', 'BS 812'],
    objective: {
      en: 'Measures fine silt, clay, and organic mud coating sand particles. Excess silt (>6% by volume or >3% by weight) coats aggregates, prevents cement paste bonding, hikes water demand, and triggers shrinkage cracks and low strength in concrete & plaster.',
      bn: 'বালির কণার গায়ে লেগে থাকা পলি ও কাদার (Silt & Clay) পরিমাণ নির্ণয় করে। অতিরিক্ত কাদা (>৬% আয়তন বা >৩% ওজন) থাকলে সিমেন্ট ও পাথরের সাথে জোড়া লাগে না, পানির চাহিদা বেড়ে যায় এবং কংক্রিট/প্লাস্টারে ফাটল ধরে।',
    },
    sampling: {
      frequency: { en: 'Every incoming sand barge/truckload (Sylhet, Kushtia, or local river sand) and after heavy rain on stockpile.', bn: 'প্রতিটি বালির ট্রাক বা বলগেট আনলোডের সময় এবং ভারী বৃষ্টির পর স্টক থেকে।' },
      quantity: { en: 'Approx. 500 g representative moist/dry sand taken from 3 depths of the sand pile.', bn: 'বালির স্তূপের ৩টি গভীরতা থেকে নেওয়া প্রায় ৫০০ গ্রাম বালি।' },
      lotSize: { en: 'Each delivery truck (300–600 CFT) or barge (1,500–4,000 CFT).', bn: 'প্রতি ট্রাক (৩০০–৬০০ সিএফটি) বা বলগেট লট।' },
    },
    apparatus: [
      { item: { en: 'Graduated Transparent Glass Measuring Cylinder (250 mL or 500 mL)', bn: 'দাগ কাটা স্বচ্ছ কাঁচের মাপার সিলিন্ডার (২৫০ বা ৫০০ মি.লি.)' }, spec: 'Minimum 1 mL / 2 mL graduations' },
      { item: { en: 'Common Salt (NaCl) Solution (1% Dissolving Agent)', bn: 'সাধারণ লবণ (১% দ্রবণ) ও পরিষ্কার পানি' }, spec: '1 teaspoon salt per 500 mL water speeds clay settling' },
    ],
    procedure: [
      { en: 'Fill a 250 mL graduated glass cylinder up to the 50 mL mark with 1% common salt water (salt neutralizes colloidal charge so clay settles cleanly).', bn: '২৫০ মি.লি. মাপার সিলিন্ডারে ৫০ মি.লি. পর্যন্ত ১% লবণ-পানি নিন (লবণ মিশ্রিত পানি কাদা দ্রুত ও পরিষ্কারভাবে থিতাতে সাহায্য করে)।' },
      { en: 'Pour representative sand carefully until the submerged sand top reaches approximately the 100 mL mark, then top up salt water to the 150 mL mark.', bn: 'সিলিন্ডারে বালি ঢালুন যতক্ষণ না পানির নিচে বালি প্রায় ১০০ মি.লি. দাগ স্পর্শ করে; এরপর আরও লবণ-পানি ঢেলে ১৫০ মি.লি. পূর্ণ করুন।' },
      { en: 'Cover the cylinder mouth tightly with palm/stopper, invert and shake vigorously for 30–45 seconds to wash all silt off sand grains.', bn: 'সিলিন্ডারের মুখ হাত বা কর্ক দিয়ে বন্ধ করে ৩০–৪৫ সেকেন্ড ভালোভাবে ঝাঁকান যাতে বালির গায়ের সব কাদা পানিতে ধুয়ে আসে।' },
      { en: 'Place vertically on a vibration-free table for 3 hours until water clears and two distinct layers form: heavy coarse sand at bottom (V_sand) and fine silt/clay layer on top (V_silt).', bn: 'কোনো ঝাঁকুনি ছাড়া সমতল টেবিলে ৩ ঘণ্টা রেখে দিন—নিচে ভারী বালি (V_sand) এবং তার ওপর হালকা পলি/কাদার (V_silt) আলাদা স্তর জমে যাবে।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Allow the full 3-hour settling period (especially with fine local sand)—reading at 15 min underestimates suspended clay by half.', bn: 'অবশ্যই পূর্ণ ৩ ঘণ্টা থিতাতে দিন; ১৫ মিনিটে রিডিং নিলে পানিতে ভাসমান কাদা হিসাবের বাইরে থেকে যাবে।' },
        { en: 'Read V_sand from 0 to the sand-silt interface, and V_silt strictly as the thickness of the fine silt layer above the sand.', bn: 'তলা থেকে বালি-কাদার সীমানা পর্যন্ত V_sand এবং তার ওপর শুধু কাদার পুরুত্বকে V_silt হিসেবে মাপুন।' },
      ],
      contractorTricks: [
        { en: 'Top Clean Layer Over Muddy Core: Dredged river sand piles often look clean after rain washes the outside skin while deeper inside pockets hold 12% clay—always dig 300 mm deep before sampling.', bn: 'বৃষ্টিতে বালির ওপরের স্তর ধুয়ে পরিষ্কার দেখালেও ভেতরে ১০–১২% কাদা লুকানো থাকে—তাই অন্তত ৩০০ মিমি খুঁড়ে নমুনা নিন।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Volumetric Jar Silt & Clay Content (%)', bn: 'জারে থিতানো পলি ও কাদার শতকরা হার (%)' },
          equation: 'Silt Content (%) = (V_silt / V_sand) × 100',
          variables: [
            { en: 'V_silt = Thickness/volume of settled silt & clay layer above sand (mL)', bn: 'V_silt = বালির ওপরে জমা হওয়া পলি ও কাদার স্তরের মাপ (মি.লি.)' },
            { en: 'V_sand = Volume of clean settled sand layer at bottom (mL)', bn: 'V_sand = নিচে থিতানো পরিষ্কার বালির মাপ (মি.লি.)' },
          ],
          unitNote: 'Pass for RCC: ≤ 6.0% by Volume (or ≤ 3.0% by Weight via ASTM C117 Wash); 6–8%: Wash Required; > 8%: Reject.',
        },
      ],
      workedExample: {
        en: 'After 3h settling, clean sand reads V_sand = 96.0 mL and the fine top silt band measures V_silt = 4.5 mL → Silt Content = (4.5 / 96.0) × 100 = 4.69% (≤ 6.0% Pass for RCC).',
        bn: '৩ ঘণ্টা থিতানোর পর বালির স্তর V_sand = ৯৬.০ মি.লি. এবং ওপরের পলির স্তর V_silt = ৪.৫ মি.লি. হলে → পলি = (৪.৫ / ৯৬.০) × ১০০ = ৪.৬৯% (≤ ৬.০% সীমা → পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Silt ≤ 6.0% by Vol (ASTM C117 ≤ 3.0% by Wt)', codeLimit: 'PWD / IS 2386 / BNBC', interpretation: { en: 'Clean sand approved directly for structural RCC, mortar, and plastering.', bn: 'পরিষ্কার বালি—আরসিসি ঢালাই, গাঁথুনি ও প্লাস্টারের জন্য সরাসরি অনুমোদিত।' } },
      { tier: 'WARNING', rangeLabel: '6.0% < Silt ≤ 8.0% by Vol', codeLimit: 'Wash Before Mixing', interpretation: { en: 'Excess surface silt; wash thoroughly with clean water on sloping screen or verify ASTM C117 #200 wash (< 3% by wt) before RCC.', bn: '৬–৮% পলি রয়েছে—ঢালাইয়ের আগে পরিষ্কার পানিতে ধুয়ে নিতে হবে অথবা ল্যাবে #২০০ ওয়েট ওয়াশ (<৩%) টেস্ট করতে হবে।' } },
      { tier: 'FAIL', rangeLabel: 'Silt > 8.0% by Vol', codeLimit: 'REJECT LOT', interpretation: { en: 'Muddy/silty sand unusable for RCC or plaster; severely drops bond and causes crazing cracks.', bn: '৮%-এর বেশি পলি/কাদা—কংক্রিট ও প্লাস্টারে সম্পূর্ণ নিষিদ্ধ; সম্পূর্ণ লট বাতিল করুন।' } },
    ],
    remedialActions: [
      { en: 'If silt falls between 6% and 8%, flood-wash sand on an inclined perforated platform and re-test until jar silt drops below 6%.', bn: 'পলি ৬–৮% হলে ঢালু স্ক্রিনের ওপর পানি ঢেলে বালি ধুয়ে পুনরায় জারে পরীক্ষা করুন যতক্ষণ না ৬%-এর নিচে নামে।' },
      { en: 'Reject any delivery exceeding 8% silt content immediately at the site gate.', bn: '৮%-এর বেশি পলি পেলে সাইট গেট থেকেই বালির ট্রাক/বলগেট ফেরত দিন।' },
    ],
    calculatorInputs: [
      { key: 'sandLayerMl', label: { en: 'Settled Clean Sand Layer (V_sand)', bn: 'থিতানো পরিষ্কার বালির স্তর (V_sand)' }, unit: 'mL', defaultValue: 96.0, min: 10, max: 500, step: 0.5 },
      { key: 'siltLayerMl', label: { en: 'Top Silt & Clay Layer (V_silt)', bn: 'ওপরের পলি ও কাদার স্তর (V_silt)' }, unit: 'mL', defaultValue: 4.5, min: 0, max: 200, step: 0.5 },
    ],
  },

  // 2.2 SIEVE ANALYSIS & FINENESS MODULUS (FM) OF SAND & COARSE AGGREGATE (ASTM C136)
  {
    id: 'agg-sand-fm',
    domainId: 'aggregate',
    code: 'LAB-AGG-02',
    title: {
      en: 'Sieve Analysis & Fineness Modulus (FM) Calculator (ASTM C136 — 6-Sieve Table)',
      bn: 'চালনি বিশ্লেষণ ও বালির ফাইননেস মডুলাস (FM) পরীক্ষা (৬-সিভ টেবিল ক্যালকুলেটর)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাব ও ফিল্ড লট পরীক্ষা',
    governingCodes: ['ASTM C136', 'BNBC-2020 Part 6', 'PWD / LGED Standard', 'ASTM C33'],
    objective: {
      en: 'Quantifies particle size gradation across standard ASTM sieves (#4, #8, #16, #30, #50, #100) to compute Fineness Modulus (FM). Ensures proper selection between Local Domar plaster sand (1.20–1.50), masonry mortar sand (1.50–1.80), blended general RCC (2.20–2.50), and coarse Sylhet structural RCC sand (2.50–3.00).',
      bn: 'আদর্শ ASTM চালনি (#৪, #৮, #১৬, #৩০, #৫০, #১০০) ব্যবহার করে বালির দানা বিন্যাস ও Fineness Modulus (FM) নির্ণয় করে। এর মাধ্যমে প্লাস্টার (১.২০–১.৫০), গাঁথুনি (১.৫০–১.৮০), সাধারণ আরসিসি (২.২০–২.৫০) এবং উচ্চ-শক্তির কলাম/বিম ঢালাইয়ের সিলেট বালি (২.৫০–৩.০০) সঠিকভাবে নির্বাচন করা হয়।',
    },
    sampling: {
      frequency: { en: 'Every new sand quarry source, every 100 m³ (3,500 CFT) stockpile, and prior to every concrete mix design.', bn: 'প্রতিটি নতুন উৎস/খাদ থেকে, প্রতি ১০০ মি³ (৩,৫০০ সিএফটি) বালির জন্য এবং মিক্স ডিজাইনের পূর্বে।' },
      quantity: { en: '500 g oven-dry sand (quartering split from a 5 kg field sample).', bn: '৫ কেজি মাঠের নমুনা কোয়ার্টারিং করে নেওয়া ৫০০ গ্রাম ওভেন-ড্রাই বালি।' },
      lotSize: { en: 'Each quarry delivery or 3,500 CFT stockpile.', bn: 'প্রতিটি ডেলিভারি বা ৩,৫০০ সিএফটি মজুদ।' },
    },
    apparatus: [
      { item: { en: 'ASTM Standard Sieve Stack (#4, #8, #16, #30, #50, #100 + Lid & Pan)', bn: 'ASTM স্ট্যান্ডার্ড সিভ সেট (#৪, #৮, #১৬, #৩০, #৫০, #১০০ + প্যান)' }, spec: '4.75, 2.36, 1.18, 0.60, 0.30, 0.15 mm apertures' },
      { item: { en: 'Mechanical Sieve Shaker & Digital Balance (0.1 g)', bn: 'সিভ শেকার মেশিন ও ডিজিটাল স্কেল (০.১ গ্রাম)' }, spec: 'Shakes 10–15 min continuously' },
      { item: { en: 'Drying Oven (110 ± 5°C) & Brass Sieve Cleaning Brush', bn: 'ড্রাইং ওভেন (১১০°সে.) ও সিভ ব্রাশ' }, spec: 'Dry to constant weight' },
    ],
    procedure: [
      { en: 'Dry the representative 500 g sand sample at 110 ± 5°C to constant mass, cool to room temperature, and record total weight.', bn: 'নমুনা বালি ১১০±৫°সে. তাপমাত্রায় শুকিয়ে ঠান্ডা করে ঠিক ৫০০ গ্রাম ওজন মেপে নিন।' },
      { en: 'Assemble ASTM sieves cleanly in descending order (#4 top → #8 → #16 → #30 → #50 → #100 → Pan at bottom), pour sand onto #4, and cover.', bn: 'ওপর থেকে নিচ ক্রমান্বয়ে #৪, #৮, #১৬, #৩০, #৫০, #১০০ এবং একদম নিচে প্যান সাজিয়ে #৪ চালনিতে বালি ঢেলে ঢাকনা লাগান।' },
      { en: 'Shake on mechanical sieve shaker for 10–15 minutes until less than 1% passes per additional minute.', bn: 'সিভ শেকার মেশিনে ১০–১৫ মিনিট ধরে ভালোভাবে চালুন।' },
      { en: 'Weigh the exact mass retained on EACH sieve (#4 through #100) plus the Pan separately, verifying total mass loss is ≤ 0.5%.', bn: 'প্রতিটি চালনির ওপরে আটকে থাকা বালি এবং নিচের প্যানের ধুলো আলাদাভাবে মাপুন (মোট ওজন ঘাটতি ≤ ০.৫%)।' },
      { en: 'Compute Individual Retained %, Cumulative Retained % for all 6 standard sieves, sum them, and divide by 100 to obtain FM.', bn: 'প্রতিটি চালনির নিজস্ব % ও ক্রমপুঞ্জিত (Cumulative) % বের করে ৬টি চালনির ক্রমপুঞ্জিত % যোগ করে ১০০ দিয়ে ভাগ করে FM নির্ণয় করুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Never sieve damp/wet sand—surface moisture glues fine dust onto coarse screens and artificially inflates FM by +0.3 to +0.5.', bn: 'ভেজা বালি কখনোই চালনিতে চালবেন না—পানির কারণে মিহি দানা বড় চালনিতে আটকে গিয়ে FM ভুয়া ০.৩–০.৫ বেশি দেখাবে।' },
        { en: 'Exclude Pan weight from the FM cumulative sum—only sum the 6 standard sieves (#4, #8, #16, #30, #50, #100).', bn: 'FM যোগফলে প্যানের অংশ যোগ করা যাবে না—শুধুমাত্র #৪ থেকে #১০০ পর্যন্ত ৬টি স্ট্যান্ডার্ড চালনির ক্রমপুঞ্জিত % যোগ হবে।' },
      ],
      contractorTricks: [
        { en: 'Fake "Sylhet Sand" Dilution: Suppliers mix 40% cheap local white sand (FM 1.3) with 60% Sylhet sand (FM 2.8) to drop FM to ~2.1 while billing full Sylhet prices—always inspect #30 and #50 retention.', bn: 'সিলেট বালির সাথে ৪০% সস্তা সাদা লোকাল বালি (FM ১.৩) মিশিয়ে দিলে FM ২.১-এ নেমে আসে অথচ দাম পুরো নেওয়া হয়—#৩০ ও #৫০ চালনিতে অবশেষ দেখলেই এটি ধরা পড়ে।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Fineness Modulus (FM) — ASTM C136', bn: 'ফাইননেস মডুলাস (FM) সূত্র' },
          equation: 'FM = [ Σ(Cum.% Retained on #4, #8, #16, #30, #50, #100) ] / 100',
          variables: [
            { en: 'Ind.% Retained (i) = (W_retained,i / W_total) × 100', bn: 'নিজস্ব % = (উক্ত চালনিতে ওজন / মোট ওজন) × ১০০' },
            { en: 'Cum.% Retained (i) = Σ Ind.% Retained from #4 down to sieve i', bn: 'ক্রমপুঞ্জিত % = #৪ থেকে শুরু করে ঐ চালনি পর্যন্ত নিজস্ব %-এর যোগফল' },
          ],
          unitNote: 'Bangladesh FM Practice: 1.20–1.50 Plaster | 1.50–1.80 Masonry Mortar | 2.20–2.50 Blended General RCC | 2.50–3.00 Coarse Sylhet Structural RCC.',
        },
      ],
      workedExample: {
        en: 'For a 500 g Sylhet sand sample with retained weights [#4=12g, #8=48g, #16=115g, #30=145g, #50=110g, #100=55g, Pan=15g]: Cum.% = [2.4%, 12.0%, 35.0%, 64.0%, 86.0%, 97.0%]. Sum = 296.4% → FM = 296.4 / 100 = 2.96 (Coarse Sylhet Structural RCC Sand).',
        bn: '৫০০ গ্রাম সিলেট বালিতে অবশেষ [#৪=১২, #৮=৪৮, #১৬=১১৫, #৩০=১৪৫, #৫০=১১০, #১০০=৫৫, প্যান=১৫ গ্রাম] হলে ক্রমপুঞ্জিত % = [২.৪%, ১২%, ৩৫%, ৬৪%, ৮৬%, ৯৭%] → যোগফল = ২৯৬.৪% → FM = ২.৯৬ (উন্নত সিলেট আরসিসি বালি)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'FM 2.50–3.00 (Structural RCC Sylhet) | 2.20–2.50 (Gen. RCC) | 1.50–1.80 (Masonry) | 1.20–1.50 (Plaster)', codeLimit: 'BNBC / PWD Bangladesh Standard', interpretation: { en: 'Well-graded sand matching the selected intended structural or finishing application.', bn: 'নির্বাচিত কাজের (আরসিসি, গাঁথুনি বা প্লাস্টার) জন্য সম্পূর্ণ সঠিক গ্রেডের বালি।' } },
      { tier: 'WARNING', rangeLabel: 'FM 1.81–2.19 OR FM 3.01–3.20', codeLimit: 'Blend Sand Proportions', interpretation: { en: 'Gap between masonry and RCC ranges or slightly coarse harsh sand; blend coarse Sylhet + local sand to target desired FM.', bn: 'গাঁথুনি ও আরসিসি সীমার মাঝামাঝি বা সামান্য বেশি মোটা—সিলেট ও লোকাল বালি নির্দিষ্ট অনুপাতে মিশিয়ে (Blending) সঠিক FM তৈরি করুন।' } },
      { tier: 'FAIL', rangeLabel: 'FM < 1.20 (Silty Dust) OR FM > 3.20 (Harsh Gravelly)', codeLimit: 'Unsuitable for Selected Use', interpretation: { en: 'Outside selected work grade or extreme fineness/coarseness causing segregation, bleeding, or shrinkage cracks.', bn: 'নির্বাচিত কাজের গ্রেডের বাইরে—অতি মিহি বা অতি মোটা হওয়ায় প্লাস্টারে ফাটল বা কংক্রিটে সেগ্রিগেশন ঘটাবে।' } },
    ],
    remedialActions: [
      { en: 'To upgrade low FM (e.g., 2.10) to 2.60 RCC target, calculate volumetric blending ratio between coarse Sylhet sand (FM 2.9) and fine sand (FM 1.3): X = (FM_target - FM_fine)/(FM_coarse - FM_fine).', bn: 'FM কম হলে সিলেট বালি ও লোকাল বালির সঠিক ব্লেন্ডিং অনুপাত হিসাব করে একত্রে মিক্সিং করুন।' },
      { en: 'Reject overly fine sand (FM < 1.20) for plastering/mortar as excess fines spike cement water demand and crack walls.', bn: 'প্লাস্টার বা গাঁথুনিতে FM ১.২০-এর কম অতি মিহি বালি ব্যবহার করবেন না—দেয়ালে চুলের মতো ফাটল ধরবে।' },
    ],
    calculatorInputs: [
      {
        key: 'intendedUseCode',
        label: { en: 'Target Engineering Application', bn: 'বালির ব্যবহারের ক্ষেত্র' },
        unit: 'scope',
        defaultValue: 4,
        options: [
          { value: 4, label: { en: 'Structural RCC — Sylhet Sand (Target FM 2.50–3.00)', bn: 'স্ট্রাকচারাল আরসিসি — সিলেট বালি (FM ২.৫০–৩.০০)' } },
          { value: 3, label: { en: 'General RCC — Blended Sand (Target FM 2.20–2.50)', bn: 'সাধারণ আরসিসি — ব্লেন্ডেড বালি (FM ২.২০–২.৫০)' } },
          { value: 2, label: { en: 'Brick Masonry Mortar (Target FM 1.50–1.80)', bn: 'ইটের গাঁথুনির মর্টার (FM ১.৫০–১.৮০)' } },
          { value: 1, label: { en: 'Finishing Wall Plaster (Target FM 1.20–1.50)', bn: 'ফিনিশিং প্লাস্টার — লোকাল/ডোমার (FM ১.২০–১.৫০)' } },
        ],
      },
      { key: 'retained4G', label: { en: 'Retained on #4 Sieve (4.75 mm)', bn: '#৪ চালনিতে অবশেষ (৪.৭৫ মিমি)' }, unit: 'g', defaultValue: 12, min: 0, max: 500, step: 0.5 },
      { key: 'retained8G', label: { en: 'Retained on #8 Sieve (2.36 mm)', bn: '#৮ চালনিতে অবশেষ (২.৩৬ মিমি)' }, unit: 'g', defaultValue: 48, min: 0, max: 500, step: 0.5 },
      { key: 'retained16G', label: { en: 'Retained on #16 Sieve (1.18 mm)', bn: '#১৬ চালনিতে অবশেষ (১.১৮ মিমি)' }, unit: 'g', defaultValue: 115, min: 0, max: 500, step: 0.5 },
      { key: 'retained30G', label: { en: 'Retained on #30 Sieve (0.60 mm)', bn: '#৩০ চালনিতে অবশেষ (০.৬০ মিমি)' }, unit: 'g', defaultValue: 145, min: 0, max: 500, step: 0.5 },
      { key: 'retained50G', label: { en: 'Retained on #50 Sieve (0.30 mm)', bn: '#৫০ চালনিতে অবশেষ (০.৩০ মিমি)' }, unit: 'g', defaultValue: 110, min: 0, max: 500, step: 0.5 },
      { key: 'retained100G', label: { en: 'Retained on #100 Sieve (0.15 mm)', bn: '#১০০ চালনিতে অবশেষ (০.১৫ মিমি)' }, unit: 'g', defaultValue: 55, min: 0, max: 500, step: 0.5 },
      { key: 'panMassG', label: { en: 'Fines Passing #100 (Bottom Pan)', bn: 'প্যানে জমা মিহি বালি (<০.১৫ মিমি)' }, unit: 'g', defaultValue: 15, min: 0, max: 500, step: 0.5 },
    ],
  },

  // 2.3 BULKING OF SAND TEST (বালির স্ফীতি বা আয়তন বৃদ্ধি পরীক্ষা)
  {
    id: 'agg-sand-bulking',
    domainId: 'aggregate',
    code: 'LAB-AGG-03',
    title: {
      en: 'Bulking of Sand & Volume-Batching Farrah Correction Test',
      bn: 'বালির স্ফীতি (Bulking) এবং সাইট ভলিউম ফর্মা বক্স সংশোধন পরীক্ষা',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'তাৎক্ষণিক সাইট ফিল্ড চেক',
    governingCodes: ['IS 2386 Part 3', 'BNBC-2020 Part 6', 'PWD Volume Batching Spec'],
    objective: {
      en: 'Measures how much moist loose sand expands in volume (up to 20–38% at 4–6% moisture) due to water-film surface tension pushing grains apart. Without compensating volume in site measurement boxes (Farrah), RCC concrete becomes severely under-sanded, harsh, and porous.',
      bn: 'আর্দ্রতার কারণে (৪–৬% পানিতে) বালির আয়তন কত % বেড়ে যায় (সর্বোচ্চ ২০–৩৮%) তা নির্ণয় করে। সাইটে ফর্মা বক্স দিয়ে মাপার সময় এই স্ফীতি যোগ না করলে কংক্রিটে বালি কম পড়ে যায় ও ছিদ্রযুক্ত (Porous) ঢালাই হয়।',
    },
    sampling: {
      frequency: { en: 'Every morning before starting volume-batched concrete or masonry mortar, and immediately after rain.', bn: 'প্রতিদিন সকালে ভলিউম ব্যাচিং শুরুর আগে এবং বৃষ্টির পরপরই।' },
      quantity: { en: 'Approx. 400 mL loose damp sand taken directly from the active mixer-side stockpile.', bn: 'মিক্সার মেশিনের পাশের বালির স্তূপ থেকে সরাসরি নেওয়া ~৪০০ মি.লি. ভেজা বালি।' },
      lotSize: { en: 'Each active batching shift.', bn: 'প্রতিটি ঢালাই শিফট।' },
    },
    apparatus: [
      { item: { en: 'Graduated Measuring Cylinder (500 mL or 250 mL) & Stirring Rod', bn: 'দাগ কাটা মাপার সিলিন্ডার (৫০০ বা ২৫০ মি.লি.) ও নাড়ার দণ্ড' }, spec: 'Minimum 2 mL graduation' },
      { item: { en: 'Clean Potable Water & Site Farrah Box Reference', bn: 'পরিষ্কার পানি ও সাইট ফর্মা বক্সের মাপ' }, spec: '1 Bag Cement = 1.25 CFT standard box' },
    ],
    procedure: [
      { en: 'Fill the graduated cylinder loosely (do NOT tamp or tap) with damp site sand up to an exact readable mark H₁ (e.g., 200 mL).', bn: 'কোনো চাপাচাপি বা ঝাঁকুনি ছাড়াই আলতো করে সাইটের ভেজা বালি দিয়ে সিলিন্ডারের একটি নির্দিষ্ট দাগ H₁ (যেমন ২০০ মি.লি.) পর্যন্ত ভরুন।' },
      { en: 'Transfer sand temporarily onto a clean tray, pour ~200 mL clean water into the cylinder, then gently pour the sand back into the water while stirring to expel all trapped air.', bn: 'বালি একটি ট্রে-তে ঢেলে সিলিন্ডারে ২০০ মি.লি. পানি নিন; এরপর ঐ বালি ধীরে ধীরে পানির ভেতর ঢেলে রড দিয়ে নেড়ে সব বাতাস বের করে দিন।' },
      { en: 'Let the saturated inundated sand settle cleanly for 5 minutes and read the new lower sand height H₂ (e.g., 165 mL).', bn: 'সম্পূর্ণ পানিতে ডুবে থাকা বালি ৫ মিনিট থিতাতে দিন এবং নতুন কমে যাওয়া উচ্চতা H₂ (যেমন ১৬৫ মি.লি.) লিখে রাখুন।' },
      { en: 'Compute Bulking % = ((H₁ - H₂)/H₂) × 100 and multiply the dry Farrah box sand volume by (1 + Bulking/100).', bn: 'স্ফীতি % = ((H₁ - H₂)/H₂) × ১০০ হিসাব করুন এবং সাইটে ফর্মা বক্স দিয়ে মাপার সময় বালি এই গুণিতক অনুযায়ী বাড়িয়ে দিন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Never tap or compact the damp sand during initial filling H₁—it must represent the exact loose condition filled into site Farrah boxes/baskets.', bn: 'প্রাথমিক উচ্চতা H₁ মাপার সময় সিলিন্ডার ঝাঁকাবেন না; মিস্ত্রিরা ফর্মা বক্সে যেভাবে আলগা বালি ভরে ঠিক সেভাবে ভরতে হবে।' },
      ],
      contractorTricks: [
        { en: 'Short-Sanded Harsh Honeycombed Concrete: Uncorrected 25% sand bulking in a 1:1.5:3 RCC mix reduces true dry sand from 1.50 to 1.20 parts—leaving stone voids unfilled!', bn: '২৫% বাল্কিং সংশোধন না করলে ১:১.৫:৩ অনুপাতে প্রকৃত বালি ১.৫০-এর বদলে ১.২০ ভাগ হয়ে যায়—ফলে পাথরের ফাঁকা জায়গা পূর্ণ হয় না ও হানিকম্বিং হয়।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Sand Bulking (%) & Site Farrah Correction', bn: 'বালির স্ফীতি (%) ও ফর্মা বক্স সংশোধন' },
          equation: 'Bulking(%) = [(H₁ - H₂) / H₂] × 100   |   V_site = V_dry × (1 + Bulking/100)',
          variables: [
            { en: 'H₁ = Initial height/volume of loose moist site sand (mm or mL)', bn: 'H₁ = ভেজা আলগা বালির প্রাথমিক উচ্চতা (মিমি বা মি.লি.)' },
            { en: 'H₂ = Final settled height of fully inundated saturated sand (mm or mL)', bn: 'H₂ = পানিতে সম্পূর্ণ ডোবানো বালির নিচের উচ্চতা (মিমি বা মি.লি.)' },
            { en: 'V_dry = Dry mix sand volume per bag (e.g., 1.875 CFT for 1:1.5:3)', bn: 'V_dry = প্রতি ব্যাগে শুকনো বালির মাপ (যেমন ১:১.৫:৩-এ ১.৮৭৫ সিএফটি)' },
          ],
          unitNote: 'Fine sands bulk 25–38% at 5% moisture; coarse Sylhet sands bulk 15–22%.',
        },
      ],
      workedExample: {
        en: 'For H₁ = 200 mL damp sand settling to H₂ = 166 mL saturated: Bulking = ((200 - 166)/166)×100 = 20.48%. Multiplier = 1.205× → For 1.875 CFT dry sand per bag (1:1.5:3), measure 1.875 × 1.205 = 2.26 CFT (+0.38 CFT extra) in Farrah box.',
        bn: 'H₁ = ২০০ মি.লি. আলগা বালি পানিতে H₂ = ১৬৬ মি.লি. হলে স্ফীতি = ((২০০ - ১৬৬)/১৬৬)×১০০ = ২০.৪৮%। ১:১.৫:৩ মিক্সে ১.৮৭৫ সিএফটির বদলে ফর্মা দিয়ে ২.২৬ সিএফটি (+০.৩৮ সিএফটি বেশি) বালি মাপতে হবে।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Bulking ≤ 18% (Low-Moisture / Coarse Sand)', codeLimit: 'Apply Exact Multiplier', interpretation: { en: 'Normal moisture bulking; apply computed Farrah box multiplier cleanly during batching.', bn: 'স্বাভাবিক স্ফীতি—হিসাবকৃত গুণিতক অনুযায়ী ফর্মায় বাড়তি বালি যোগ করে ঢালাই করুন।' } },
      { tier: 'WARNING', rangeLabel: '18% < Bulking ≤ 30%', codeLimit: 'Mandatory Batch Correction', interpretation: { en: 'Significant volume expansion (~5% moisture peak); failing to compensate box volume will starve concrete of mortar.', bn: 'উল্লেখযোগ্য আয়তন বৃদ্ধি—ফর্মায় বাড়তি বালি যোগ করা বাধ্যতামূলক, নতুবা হানিকম্বিং হবে।' } },
      { tier: 'FAIL', rangeLabel: 'Bulking > 30% (Over-Fine Damp Sand)', codeLimit: 'Switch to Weigh-Batch / Coarse Sand', interpretation: { en: 'Extreme moisture fluffing typical of very fine sand; check sand FM or use weigh-batching.', bn: 'অতি চিকন বালির অত্যধিক স্ফীতি—বালির FM পরীক্ষা করুন অথবা ওজন পদ্ধতিতে (Weigh Batching) মিক্সিং করুন।' } },
    ],
    remedialActions: [
      { en: 'Mark the corrected Farrah box fill height clearly on-site with red paint before starting every pour shift, or switch to a calibrated digital weigh-batcher.', bn: 'ঢালাই শুরুর আগেই সংশোধিত বাড়তি মাপ অনুযায়ী ফর্মা বক্সে লাল রঙ দিয়ে দাগ দিয়ে রাখুন।' },
    ],
    calculatorInputs: [
      { key: 'dampHeightH1', label: { en: 'Initial Loose Moist Sand Height (H₁)', bn: 'ভেজা আলগা বালির উচ্চতা (H₁)' }, unit: 'mL', defaultValue: 200, min: 20, max: 1000, step: 1 },
      { key: 'saturatedHeightH2', label: { en: 'Saturated Inundated Sand Height (H₂)', bn: 'পানিতে ডোবানো বালির উচ্চতা (H₂)' }, unit: 'mL', defaultValue: 166, min: 20, max: 1000, step: 1 },
      { key: 'dryBoxVolCft', label: { en: 'Dry Sand Volume per Bag (e.g., 1.875 CFT for 1:1.5:3)', bn: 'ব্যাগ প্রতি শুকনো বালির মাপ (CFT)' }, unit: 'CFT', defaultValue: 1.875, min: 0.5, max: 10, step: 0.125 },
    ],
  },

  // 2.4 SPECIFIC GRAVITY & WATER ABSORPTION OF COARSE AGGREGATE (ASTM C127)
  {
    id: 'agg-sg-absorption',
    domainId: 'aggregate',
    code: 'LAB-AGG-04',
    title: {
      en: 'Specific Gravity & Water Absorption: Stone Chips vs. Picked Jhama Brick Chips (ASTM C127)',
      bn: 'পাথর ও পিকড ঝামা খোয়ার আপেক্ষিক গুরুত্ব (Specific Gravity) এবং পানি শোষণ পরীক্ষা',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি পরীক্ষা',
    governingCodes: ['ASTM C127', 'BS 812 Part 2', 'BNBC-2020 Part 6', 'PWD SoR Spec'],
    objective: {
      en: 'Determines Bulk Specific Gravity (G_sb), SSD Specific Gravity, and 24-hour Water Absorption %—critical for ACI 211 absolute volume mix design, concrete unit weight, and distinguishing dense Pakur/Bholaganj stone chips (≤1.5%) from 1st-class Picked Jhama brick khoa (≤12–15%).',
      bn: 'পাথর বা ঝামা খোয়ার আপেক্ষিক গুরুত্ব (G_sb, SSD SG) এবং ২৪-ঘণ্টা পানি শোষণ % নির্ণয় করে। এটি মিক্স ডিজাইনে পাথরের পরিমাণ নির্ধারণ এবং ভালো ভোলগঞ্জ/পাকুর পাথর (শোষণ ≤১.৫%) বনাম ১ম শ্রেণির পিকড ঝামা খোয়া (≤১২–১৫%) যাচাইয়ে অপরিহার্য।',
    },
    sampling: {
      frequency: { en: 'Once per quarry/kiln batch change or every 250 m³ coarse aggregate supply.', bn: 'পাথরের খাদ বা ইটভাটা পরিবর্তন হলে অথবা প্রতি ২৫০ মি³ সরবরাহের জন্য।' },
      quantity: { en: '2,000 to 3,000 g representative coarse aggregate (washed clean over 4.75 mm #4 sieve).', bn: '৪.৭৫ মিমি (#৪) চালনিতে ধুয়ে নেওয়া ২,০০০ থেকে ৩,০০০ গ্রাম পাথর বা ঝামা খোয়া।' },
      lotSize: { en: 'Up to 250 m³ (~8,800 CFT) stockpile.', bn: 'সর্বোচ্চ ২৫০ মি³ (~৮,৮০০ সিএফটি) স্টক।' },
    },
    apparatus: [
      { item: { en: 'Wire Mesh Buoyancy Basket & Water Tank with Suspension Balance', bn: 'তারের ঝুড়ি (Wire Basket), পানির ট্যাংক ও ঝুলন্ত ডিজিটাল ব্যালেন্স' }, spec: 'Capacity 5–10 kg, sensitivity 0.5 g' },
      { item: { en: 'Thermostatic Drying Oven (110 ± 5°C) & Absorbent Towels', bn: 'ড্রাইং ওভেন (১১০°সে.) ও পানি মোছার তোয়ালে' }, spec: 'For SSD & oven-dry states' },
    ],
    procedure: [
      { en: 'Wash ~2.5 kg sample over a 4.75 mm (#4) sieve to remove dust, then submerge completely in water at room temperature for 24 ± 4 hours.', bn: 'প্রায় ২.৫ কেজি নমুনা ৪.৭৫ মিমি চালনিতে ধুয়ে পরিষ্কার করুন এবং ২৪±৪ ঘণ্টা পরিষ্কার পানিতে সম্পূর্ণ ডুবিয়ে রাখুন।' },
      { en: 'Weigh the submerged aggregate inside the wire basket under water (subtract tare weight of empty basket under water) to obtain Submerged Weight C (g).', bn: 'তারের ঝুড়িতে ভরে পানির নিচে ডুবন্ত অবস্থায় ওজন নিয়ে খালি ঝুড়ির ডুবন্ত ওজন বাদ দিয়ে পানির নিচের ওজন C (গ্রাম) বের করুন।' },
      { en: 'Lift aggregate out and roll briskly in a dry absorbent cloth until surface sheen vanishes while pores stay saturated—immediately weigh Saturated Surface-Dry weight B (g).', bn: 'পানি থেকে তুলে শুকনো তোয়ালে দিয়ে কণাগুলোর গায়ের চকচকে পানি মুছে ফেলুন (ভেতর ভেজা কিন্তু বাইরে শুকনো — SSD) এবং সাথে সাথেই ওজন B (গ্রাম) নিন।' },
      { en: 'Dry the sample in a 110 ± 5°C oven until constant weight (≈24 h), cool in a desiccator/tray, and record Oven-Dry Weight A (g).', bn: 'নমুনাটি ওভেনে ১১০±৫°সে. তাপমাত্রায় শুকিয়ে ঠান্ডা করে ওভেন-ড্রাই ওজন A (গ্রাম) নিন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Weigh SSD mass B immediately after wiping; leaving stone exposed to warm air evaporates pore water rapidly and under-reports absorption.', bn: 'তোয়ালে দিয়ে মোছার সাথে সাথেই SSD ওজন B মেপে ফেলুন—খোলা বাতাসে রাখলে পানি শুকিয়ে ভুল কম শোষণ দেখাবে।' },
        { en: 'Jiggle the wire basket underwater to release trapped air bubbles clinging to rough Jhama brick pores.', bn: 'ঝামা খোয়ার গর্তে আটকে থাকা বাতাস বের করতে পানির নিচে ঝুড়ি হালকা ঝাঁকিয়ে নিন।' },
      ],
      contractorTricks: [
        { en: 'Dry Brick Khoa Stealing Mixing Water: Brick khoa absorbs 12–15% water! Batching unsoaked dry khoa into RCC sucks water straight out of cement paste, causing honeycombing and 30% strength loss.', bn: 'শুকনো ইটের খোয়া কংক্রিটের পানি টেনে নেয়: ঝামা খোয়ার পানি শোষণ ১২–১৫%। ঢালাইয়ের আগে খোয়া ভালোভাবে ভিজিয়ে (SSD) না নিলে সিমেন্টের পানি টেনে নিয়ে কংক্রিটের শক্তি ৩০% কমিয়ে দেয়।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Bulk SG, SSD SG & Water Absorption % (ASTM C127)', bn: 'বাল্ক ও SSD আপেক্ষিক গুরুত্ব এবং পানি শোষণ (%)' },
          equation: 'G_sb = A / (B - C)  |  SSD SG = B / (B - C)  |  Absorption(%) = [(B - A) / A] × 100',
          variables: [
            { en: 'A = Oven-dry mass in air (g)', bn: 'A = ওভেনে শুকানো (Oven-Dry) ওজন (গ্রাম)' },
            { en: 'B = Saturated Surface-Dry (SSD) mass in air (g)', bn: 'B = বাইরে শুকনো কিন্তু ভেতর ভেজা (SSD) ওজন (গ্রাম)' },
            { en: 'C = Submerged apparent weight in water (g)', bn: 'C = পানির নিচে ডুবন্ত ওজন (গ্রাম)' },
          ],
          unitNote: 'Stone Chips (Pakur/Bholaganj): Abs ≤ 1.5%, G_sb ≈ 2.65–2.80 | Picked Jhama Khoa: Abs ≤ 12–15%, G_sb ≈ 1.85–2.10 | > 16% Reject.',
        },
      ],
      workedExample: {
        en: 'For Bholaganj Stone Chips: A = 2,480 g, B = 2,502 g, C = 1,595 g → (B-C) = 907 g. G_sb = 2480/907 = 2.73; SSD SG = 2502/907 = 2.76; Absorption = ((2502-2480)/2480)×100 = 0.89% (≤ 1.5% → PASS).',
        bn: 'ভোলগঞ্জ পাথরের জন্য A = ২,৪৮০ গ্রাম, B = ২,৫০২ গ্রাম, C = ১,৫৯৫ গ্রাম হলে → G_sb = ২৪৮০/(২৫০২-১৫৯৫) = ২.৭৩; SSD SG = ২.৭৬; পানি শোষণ = ((২৫০২-২৪৮০)/২৪৮০)×১০০ = ০.৮৯% (≤ ১.৫% → পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Stone: Abs ≤ 1.5% (G_sb 2.60–2.85) | Picked Jhama Khoa: Abs ≤ 15% (G_sb 1.80–2.20)', codeLimit: 'ASTM C127 / PWD / BNBC', interpretation: { en: 'Dense durable stone or well-vitrified 1st-class Picked Jhama khoa suitable for RCC.', bn: 'উত্তম ঘন পাথর বা ভালো পোড়া ১ম শ্রেণির পিকড ঝামা খোয়া—আরসিসি ঢালাইয়ের উপযুক্ত।' } },
      { tier: 'WARNING', rangeLabel: 'Stone: Abs 1.51%–2.5% | Jhama: Abs 15.1%–16.0%', codeLimit: 'Verify Strength & Pre-Soak', interpretation: { en: 'Higher porosity aggregate; verify crushing/LA value and pre-soak thoroughly to SSD before batching.', bn: 'ছিদ্রযুক্ত খোয়া/পাথর—এলএ/ক্রাশিং টেস্ট যাচাই করুন এবং ঢালাইয়ের আগে অবশ্যই ভিজিয়ে SSD করে নিন।' } },
      { tier: 'FAIL', rangeLabel: 'Stone: Abs > 2.5% | Brick Khoa: Abs > 16.0% (or G_sb < 1.80)', codeLimit: 'REJECT FOR RCC', interpretation: { en: 'Under-burnt soft porous brick khoa or weathered shale—unfit for reinforced concrete.', bn: 'কাঁচা ও অতি ছিদ্রযুক্ত ঝামা বা দুর্বল পাথর—আরসিসিতে ব্যবহার করলে কংক্রিট দুর্বল হবে; বাতিল করুন।' } },
    ],
    remedialActions: [
      { en: 'Pre-wet Brick Khoa piles continuously for 12–24 hours and drain surface water 1 hour prior to RCC mixing so dry khoa does not steal mix water.', bn: 'ইটের খোয়া ব্যবহার করলে ঢালাইয়ের ১২–২৪ ঘণ্টা আগে ভালোভাবে ভিজিয়ে এবং ঢালাইয়ের ১ ঘণ্টা আগে বাড়তি পানি ঝরিয়ে নিন।' },
      { en: 'Reject any Brick Khoa lot showing > 16% water absorption for structural RCC beams, columns, and slabs.', bn: 'পানি শোষণ ১৬%-এর বেশি হলে স্ট্রাকচারাল আরসিসির জন্য খোয়া বাতিল করুন।' },
    ],
    calculatorInputs: [
      {
        key: 'aggTypeCode',
        label: { en: 'Coarse Aggregate Type', bn: 'খোয়া বা পাথরের ধরন' },
        unit: 'type',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '1 — Crushed Stone Chips (Pakur/Bholaganj ≤1.5%)', bn: '১ — ক্রাশড স্টোন চিপস / পাথর (≤১.৫%)' } },
          { value: 2, label: { en: '2 — Picked Jhama Brick Khoa (≤15%)', bn: '২ — পিকড ঝামা ইটের খোয়া (≤১৫%)' } },
        ],
      },
      { key: 'ovenDryMassA', label: { en: 'Oven-Dry Weight in Air (A)', bn: 'ওভেন-ড্রাই শুকনো ওজন (A)' }, unit: 'g', defaultValue: 2480, min: 200, max: 10000, step: 10 },
      { key: 'ssdMassB', label: { en: 'SSD Weight in Air (B)', bn: 'SSD ভিজা-শুকনো ওজন (B)' }, unit: 'g', defaultValue: 2502, min: 200, max: 10000, step: 10 },
      { key: 'submergedMassC', label: { en: 'Submerged Weight in Water (C)', bn: 'পানির নিচে ডুবন্ত ওজন (C)' }, unit: 'g', defaultValue: 1595, min: 100, max: 8000, step: 10 },
    ],
  },

  // 2.5 AGGREGATE CRUSHING VALUE (ACV), IMPACT VALUE (AIV) & LOS ANGELES (L.A.) ABRASION
  {
    id: 'agg-acv-aiv-laa',
    domainId: 'aggregate',
    code: 'LAB-AGG-05',
    title: {
      en: 'Aggregate Toughness: Crushing (ACV), Impact (AIV) & L.A. Abrasion Value (ASTM C131 / BS 812)',
      bn: 'পাথরের ক্রাশিং (ACV), ইমপ্যাক্ট (AIV) এবং এল.এ. অ্যাব্রেশন (L.A.) ক্ষয় পরীক্ষা',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি পরীক্ষা',
    governingCodes: ['ASTM C131 (L.A.)', 'BS 812 Part 110/112 (ACV/AIV)', 'BNBC-2020', 'RHD / LGED'],
    objective: {
      en: 'Measures mechanical resistance of crushed stone or brick chips against gradual compressive crushing (ACV), sudden shock impact (AIV), and surface abrasion/wear (L.A. Abrasion)—ensuring structural concrete and highway pavements withstand heavy wheel loads without pulverizing.',
      bn: 'চাপা লোডের বিপরীতে ক্রাশিং (ACV), হঠাৎ আঘাতের বিপরীতে ইমপ্যাক্ট (AIV) এবং ঘর্ষণজনিত ক্ষয়ের বিপরীতে এল.এ. অ্যাব্রেশন (LAA) ক্ষমতা পরীক্ষা করে—যাতে রাস্তা ও উচ্চ-শক্তির আরসিসিতে পাথর গুঁড়া হয়ে না যায়।',
    },
    sampling: {
      frequency: { en: 'Every new quarry/crusher source or per 250 m³ stone/khoa batch.', bn: 'প্রতিটি নতুন পাথরের খাদ/ক্রাশার উৎস বা প্রতি ২৫০ মি³ সরবরাহের জন্য।' },
      quantity: { en: '5,000 g clean dry 10–20 mm graded stone (Grading A/B for L.A.) or ~3 kg passing 12.5 mm retained 10 mm (for ACV/AIV).', bn: 'এল.এ.-এর জন্য ৫,০০০ গ্রাম (১০–২০ মিমি) এবং ACV/AIV-এর জন্য ১২.৫–১০ মিমি সাইজের শুকনো পাথর।' },
      lotSize: { en: 'Up to 250 m³ stockpile.', bn: 'সর্বোচ্চ ২৫০ মি³ স্টক।' },
    },
    apparatus: [
      { item: { en: 'Los Angeles Drum (12 Steel Spheres, 500 Rev @ 30–33 RPM)', bn: 'এল.এ. অ্যাব্রেশন ড্রাম ও স্টিল বল (৫০০ ঘূর্ণন)' }, spec: 'ASTM C131, 1.70 mm (#12) finish sieve' },
      { item: { en: 'ACV Cylindrical Plunger & CTM (400 kN Load in 10 min) OR AIV Hammer (13.5–14 kg, 15 Blows)', bn: 'ACV পিস্টন ও ৪০০ kN CTM অথবা AIV হ্যামার (১৫ আঘাত, ৩৮০ মিমি পতন)' }, spec: 'BS 812, 2.36 mm (#8) finish sieve' },
    ],
    procedure: [
      { en: 'Wash and oven-dry sample at 105–110°C; measure exact dry initial sample weight W₁ (e.g., 5,000 g for L.A., ~3,000 g for ACV, or ~350 g cup for AIV).', bn: 'নমুনা ধুয়ে ওভেনে শুকিয়ে মোট শুকনো ওজন W₁ মাপুন (যেমন L.A.-এর জন্য ৫,০০০ গ্রাম)।' },
      { en: 'Select test protocol: (a) L.A. Abrasion: tumble with standard steel balls for 500 revolutions; (b) ACV: compress at 40 kN/min to 400 kN in 10 min; (c) AIV: apply 15 blows of 13.75 kg hammer from 380 mm drop.', bn: 'নির্ধারিত পরীক্ষা চালান: L.A.-তে ৫০০ পাক ঘোরান, ACV-তে ১০ মিনিটে ৪০০ kN চাপ দিন, অথবা AIV-তে ১৫ বার হ্যামার আঘাত করুন।' },
      { en: 'Sieve all crushed/abraded material through the code-mandated finish sieve: 1.70 mm (#12) for L.A. Abrasion OR 2.36 mm (#8) for ACV & AIV.', bn: 'পরীক্ষার পর চূর্ণ অংশ চালনিতে চালুন: এল.এ. অ্যাব্রেশনের জন্য ১.৭০ মিমি (#১২) এবং ACV/AIV-এর জন্য ২.৩৬ মিমি (#৮)।' },
      { en: 'Weigh the fine pulverized fraction PASSING that sieve (W₂) and compute Percentage Loss = (W₂ / W₁) × 100.', bn: 'ঐ চালনি পার হয়ে যাওয়া গুঁড়া অংশের ওজন (W₂) মেপে ক্ষয়ের হার = (W₂ / W₁) × ১০০ নির্ণয় করুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Never exceed 400 kN on ACV or reuse already-tested stones for a second run.', bn: 'ACV পরীক্ষায় ৪০০ kN-এর বেশি লোড দেবেন না এবং একবার টেস্ট করা পাথর দিয়ে দ্বিতীয়বার টেস্ট করবেন না।' },
        { en: 'Match the steel sphere count cleanly to L.A. Grading (12 balls for Grading A, 11 for B, 8 for C).', bn: 'এল.এ. গ্রেডিং অনুযায়ী সঠিক সংখ্যক স্টিল বল (A=১২টি, B=১১টি, C=৮টি) ব্যবহার করুন।' },
      ],
      contractorTricks: [
        { en: 'Over-Sieved Unclean Quarry Rejects: Soft weathered sandstone looks dark like trap basalt when wet—ACV/L.A. instantly reveals >40% pulverization.', bn: 'ভিজিয়ে কালো দেখানো নরম বেলেপাথর: পানি দিয়ে ভিজিয়ে নরম পাথরকেও ভালো কালো পাথর বলে চালানো হয়—L.A. / AIV টেস্টে তা >৪০% গুঁড়া হয়ে ধরা পড়ে।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'ACV / AIV / L.A. Abrasion Loss (%)', bn: 'ACV / AIV / এল.এ. অ্যাব্রেশন ক্ষয় (%)' },
          equation: 'Loss (%) = (W₂ / W₁) × 100',
          variables: [
            { en: 'W₁ = Initial dry aggregate sample mass (g)', bn: 'W₁ = প্রাথমিক শুকনো নমুনার ওজন (গ্রাম)' },
            { en: 'W₂ = Mass PASSING 2.36 mm (#8) sieve for ACV/AIV OR 1.70 mm (#12) sieve for L.A. Abrasion (g)', bn: 'W₂ = ACV/AIV-এ ২.৩৬ মিমি (#৮) অথবা L.A.-তে ১.৭০ মিমি (#১২) চালনি পার হওয়া গুঁড়ার ওজন (গ্রাম)' },
          ],
          unitNote: 'BNBC / RHD / LGED: Wearing Course ≤ 30% | Base Course / General RCC ≤ 35%–40% | > 40% Soft/Weak (Reject).',
        },
      ],
      workedExample: {
        en: 'For L.A. Abrasion with W₁ = 5,000 g and weight passing 1.70 mm (#12) sieve W₂ = 1,100 g: L.A. Value = (1,100 / 5,000) × 100 = 22.00% (≤ 30% Wearing/RCC Pass).',
        bn: 'এল.এ. অ্যাব্রেশন পরীক্ষায় W₁ = ৫,০০০ গ্রাম এবং ১.৭০ মিমি (#১২) পার হওয়া গুঁড়া W₂ = ১,১০০ গ্রাম হলে → L.A. = (১,১০০ / ৫,০০০) × ১০০ = ২২.০০% (≤ ৩০% ওয়ারিং কোর্স ও আরসিসি পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Value ≤ 30.0%', codeLimit: 'Wearing Course / Heavy RCC', interpretation: { en: 'Hard, tough aggregate approved for highway wearing surfaces, bridges, and high-strength RCC.', bn: 'অত্যন্ত শক্ত ও মজবুত পাথর—হাইওয়ে কার্পেটিং, ব্রিজ ও উচ্চ-শক্তির আরসিসির জন্য অনুমোদিত।' } },
      { tier: 'WARNING', rangeLabel: '30.1% – 40.0%', codeLimit: 'Base Course / Gen. RCC Max', interpretation: { en: 'Acceptable up to 35–40% for road base/sub-base and non-wearing concrete (verify client/LGED spec); unsuitable for highway wearing coats.', bn: 'রাস্তার বেজ কোর্স বা সাধারণ আরসিসিতে (≤৩৫–৪০%) শর্তসাপেক্ষে ব্যবহারযোগ্য, তবে হাইওয়ে টপ লেয়ারে ব্যবহার নিষেধ।' } },
      { tier: 'FAIL', rangeLabel: 'Value > 40.0%', codeLimit: 'SOFT / REJECT LOT', interpretation: { en: 'Soft, friable, weak aggregate; fails BNBC/RHD/LGED requirements—reject lot immediately.', bn: 'অতি নরম ও ভঙ্গুর পাথর (>৪০%)—সব ধরনের আরসিসি ও সড়ক কাজে সম্পূর্ণ বাতিল।' } },
    ],
    remedialActions: [
      { en: 'Reject aggregates exceeding 30% for highway wearing surfaces or > 40% for any structural/base work; change quarry source.', bn: 'ওয়ারিং কোর্সে >৩০% অথবা কোনো আরসিসি/বেজ কাজে >৪০% ক্ষয় পাওয়া গেলে পাথরের উৎস পরিবর্তন করুন।' },
    ],
    calculatorInputs: [
      {
        key: 'testMethodCode',
        label: { en: 'Test Method Protocol', bn: 'পরীক্ষার পদ্ধতি' },
        unit: 'method',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '1 — L.A. Abrasion (Passes 1.70 mm #12 Sieve)', bn: '১ — এল.এ. অ্যাব্রেশন (১.৭০ মিমি #১২ চালনি)' } },
          { value: 2, label: { en: '2 — ACV Crushing Value (Passes 2.36 mm #8 Sieve)', bn: '২ — ACV ক্রাশিং (২.৩৬ মিমি #৮ চালনি)' } },
          { value: 3, label: { en: '3 — AIV Impact Value (Passes 2.36 mm #8 Sieve)', bn: '৩ — AIV ইমপ্যাক্ট (২.৩৬ মিমি #৮ চালনি)' } },
        ],
      },
      { key: 'initialMassG', label: { en: 'Total Dry Sample Weight (W₁)', bn: 'মোট শুকনো নমুনার ওজন (W₁)' }, unit: 'g', defaultValue: 5000, min: 200, max: 10000, step: 50 },
      { key: 'passingFinesG', label: { en: 'Weight Passing Finish Sieve (W₂)', bn: 'শেষ চালনি পার হওয়া গুঁড়া ওজন (W₂)' }, unit: 'g', defaultValue: 1100, min: 0, max: 10000, step: 10 },
    ],
  },

  // =========================================================================
  // CATEGORY 3: BRICK & CONCRETE HOLLOW BLOCK TESTS (ইট ও ব্লক পরীক্ষা — BDS 208 / PWD)
  // 4 Complete Tests
  // =========================================================================

  // 3.1 FIELD INSTANT BRICK QUALITY CHECKS & 20-BRICK CUMULATIVE DIMENSION CHECK
  {
    id: 'brk-field-checks',
    domainId: 'brick-block',
    code: 'LAB-BRK-01',
    title: {
      en: 'Field Brick Quality Checks (5 Instant Checks + 20-Brick Dimension Tolerance)',
      bn: 'সাইটে ইটের ৫টি তাৎক্ষণিক পরীক্ষা ও ২০-ইটের মাপের বিচ্যুতি (Feet-Inch / mm) যাচাই',
    },
    testType: 'Field Instant Check',
    testTypeBn: 'তাৎক্ষণিক সাইট ফিল্ড চেক',
    governingCodes: ['BDS 208', 'PWD 1st Class Spec', 'IS 1077', 'BNBC-2020 Part 6'],
    objective: {
      en: 'Performs rapid on-site screening across 5 visual/physical gates (Metallic Ringing Sound, 1.2 m Drop Impact, Fingernail Scratch Hardness, Frog & Uniform Fracture Check, and 20-Brick Cumulative Dimension Tolerance in Metric 240×115×70 mm or Traditional 9.5"×4.5"×2.75" BD field size).',
      bn: 'সাইটে দ্রুত ৫টি মান যাচাই সম্পন্ন করে: ঝনঝন ধাতব শব্দ, ১.২ মিটার (৪ ফুট) পতন পরীক্ষা, নখের আঁচড় কাঠিন্য, ফ্রগ মার্ক ও সমসত্ত্ব ভাঙন এবং ২০টি ইটের সম্মিলিত দৈর্ঘ্য-প্রস্থ-উচ্চতার মাপ (BD মেট্রিক ২৪০×১১৫×৭০ মিমি অথবা প্রচলিত ৯.৫"×৪.৫"×২.৭৫" ফুট-ইঞ্চি)।',
    },
    sampling: {
      frequency: { en: 'Every incoming brick truck/boat (2,000–5,000 nos) prior to unloading at site.', bn: 'সাইটে প্রতিটি ইটের ট্রাক বা নৌকা আনলোড করার আগে।' },
      quantity: { en: '20 random bricks selected from front, middle, and rear of truck for dimensions + 5 pairs for sound/drop/fracture checks.', bn: 'ট্রাকের সামনে, মাঝ ও পেছন থেকে ২০টি ইট মাপের জন্য এবং ৫ জোড়া শব্দ, পতন ও ভাঙন পরীক্ষার জন্য।' },
      lotSize: { en: '2,000 to 10,000 bricks per kiln batch.', bn: 'প্রতি ব্যাচে ২,০০০ থেকে ১০,০০০ ইট।' },
    },
    apparatus: [
      { item: { en: '5 m Steel Measuring Tape (mm + Feet-Inch) & Carpenters Square', bn: '৫ মিটার স্টিল টেপ (মিমি ও ফুট-ইঞ্চি দাগযুক্ত)' }, spec: 'Least count 1 mm / 1/16"' },
      { item: { en: 'Level Hard Paved Floor / Stone Slab', bn: 'সমান শক্ত পাকা মেঝে বা পাথরের স্ল্যাব' }, spec: 'For 1.2 m (4 ft) free-drop test' },
    ],
    procedure: [
      { en: '1) Ringing Sound Test: Strike two dry bricks sharply together face-to-face. 1st-class bricks emit a clear, crisp metallic ringing bell sound; dull thud signals cracks or under-burning.', bn: '১) শব্দ পরীক্ষা: দুটি ইট একসাথে ঠোকা দিন। ১ম শ্রেণির ইটে স্পষ্ট ধাতব ঝনঝন শব্দ হবে; ভোঁতা শব্দ হলে ফাটল বা কাঁচা ইট বুঝবেন।' },
      { en: '2) 1.2 m Drop Test: Drop 5 flat bricks from chest/shoulder height (1.2 m / 4 ft) onto hard concrete ground—good bricks must not shatter or break.', bn: '২) ১.২ মিটার পতন পরীক্ষা: ৪ ফুট উচ্চতা থেকে পাকা মেঝেতে ৫টি ইট ফ্ল্যাট অবস্থায় ফেলুন—ভালো ইট টুকরো হয়ে ভেঙে যাবে না।' },
      { en: '3) Nail Scratch Hardness Test: Scratch the flat face firmly with a steel nail or hard fingernail—1st-class brick surface must leave NO deep groove or chalky powder.', bn: '৩) আঁচড় পরীক্ষা: লোহার পেরেক বা নখ দিয়ে ইটের গায়ে আঁচড় দিন—পাকা ভালো ইটে গভীর দাগ বা গুঁড়া উঠবে না।' },
      { en: '4) Frog Mark & Homogeneous Fracture: Break one brick cleanly; the core must show uniform cherry-red/copper color free of white lime pebbles, air voids, or unburnt black core.', bn: '৪) ফ্রগ মার্ক ও সমান গঠন: একটি ইট ভেঙে ভেতরটা দেখুন—ভেতরে চুনের দানা, বায়ু গর্ত বা কাঁচা কালো কেন্দ্র ছাড়া সমান তামাটে/লাল রঙ থাকতে হবে।' },
      { en: '5) 20-Brick Cumulative Dimension Check: Clean burrs and stack 20 bricks tightly end-to-end (Length), edge-to-edge (Width), and flat-on-flat (Height) and verify tolerance against BD Metric (4800±80, 2300±40, 1400±40 mm) or Traditional 9.5"×4.5"×2.75" (190", 90", 55").', bn: '৫) ২০-ইটের মাপের পরীক্ষা: ২০টি ইট গায়ে-গায়ে সাজিয়ে একত্রে দৈর্ঘ্য, প্রস্থ ও উচ্চতা মাপুন (মেট্রিক: ৪৮০০±৮০, ২৩০০±৪০, ১৪০০±৪০ মিমি অথবা প্রচলিত: ১৫\'-১০", ৭\'-৬", ৪\'-৭")।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Scrape away kiln ash/mud blisters before stacking 20 bricks end-to-end so false gaps do not inflate cumulative length.', bn: 'মাপ নেওয়ার আগে ইটের গায়ের বাড়তি ছাই বা মাটির দলা পরিষ্কার করে নিন।' },
      ],
      contractorTricks: [
        { en: '"Small-Die" Undersized Bricks: Kilns shrink brick dies from 9.5"×4.5" down to 9.0"×4.25" to save clay and coal—stealing 12% masonry wall volume and forcing excessive mortar consumption!', bn: 'ছোট ছাঁচের চুরি: ভাটা মালিকরা ৯.৫"×৪.৫"-এর বদলে ৯.০"×৪.২৫" ছাঁচে ইট তৈরি করে, ফলে দেয়ালে ১২% বেশি ইট ও অতিরিক্ত মর্টার খরচ হয়।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: '20-Brick Cumulative Dimension Deviation', bn: '২০-ইটের সম্মিলিত মাপের বিচ্যুতি' },
          equation: 'Metric Target: L = 4800±80, W = 2300±40, H = 1400±40 mm  |  Field (9.5"×4.5"×2.75"): 190" (15\'-10"), 90" (7\'-6"), 55" (4\'-7")',
          variables: [
            { en: 'ΔL = L_20 - L_std (mm); Allowed Metric ±80 mm (±1.67%)', bn: 'ΔL = মাপা ২০ ইটের দৈর্ঘ্য - আদর্শ দৈর্ঘ্য' },
            { en: 'ΔW, ΔH = Allowed Metric ±40 mm (±1.74% / ±2.86%)', bn: 'ΔW, ΔH = প্রস্থ ও উচ্চতার অনুমোদিত বিচ্যুতি ±৪০ মিমি' },
          ],
          unitNote: 'Oversized bricks lower mortar joints; undersized bricks spike mortar cost & fail bond.',
        },
      ],
      workedExample: {
        en: 'For BD Metric Standard (240×115×70 mm) 20-brick stack measuring L=4760 mm (-40 mm), W=2280 mm (-20 mm), H=1385 mm (-15 mm), with 0 drop breaks & ringing sound → All within ±80/±40/±40 mm → PASS.',
        bn: 'BD মেট্রিক মাপে (২৪০×১১৫×৭০ মিমি) ২০টি ইটের মাপ L=৪৭৬০ (-৪০ মিমি), W=২২৮০ (-২০ মিমি), H=১৩৮৫ (-১৫ মিমি), শব্দ ঝনঝন ও পতন ভাঙন ০টি হলে → সব বিচ্যুতি সীমার মধ্যে → পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'All 4 Sound/Drop/Hardness/Core Pass & 20-Brick Dimensions Within Tolerance', codeLimit: 'BDS 208 / PWD 1st Class', interpretation: { en: 'Uniform, well-burnt 1st-class masonry bricks approved for structural/exterior walls.', bn: 'সমান ও ভালো পোড়া ১ম শ্রেণির ইট—সব ধরনের গাঁথুনির জন্য অনুমোদিত।' } },
      { tier: 'WARNING', rangeLabel: '1 Drop Break OR Slight Dimension Drift (±1.5× Tol.)', codeLimit: '2nd Class / Check Absorption', interpretation: { en: 'Minor size drift or one soft corner break; check 24h water absorption & crushing strength before accepting.', bn: 'সামান্য মাপের পার্থক্য বা একটি ভাঙা ইট—পানি শোষণ ও কম্প্রেসিভ স্ট্রেন্থ পরীক্ষা করে সিদ্ধান্ত নিন।' } },
      { tier: 'FAIL', rangeLabel: '≥ 2 Drop Breaks OR Dull Thud/Soft Scratch OR Out-of-Spec Dimensions', codeLimit: 'REJECT DELIVERY', interpretation: { en: 'Under-burnt, cracked, or undersized bricks—unacceptable for structural masonry.', bn: 'কাঁচা, ফাটা বা অতি ছোট ছাঁচের ইট—গাড়ি থেকে না নামিয়ে ফেরত পাঠান।' } },
    ],
    remedialActions: [
      { en: 'Reject truckload if ≥2 of 5 dropped bricks break or cumulative 20-brick dimensions exceed tolerance limits.', bn: 'পতন পরীক্ষায় ২ বা তার বেশি ইট ভাঙলে অথবা ২০ ইটের মাপ সহনশীল সীমা ছাড়ালে চালান বাতিল করুন।' },
    ],
    calculatorInputs: [
      {
        key: 'brickStdCode',
        label: { en: 'Standard Brick Size System', bn: 'ইটের আদর্শ মাপের ধরন' },
        unit: 'std',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '1 — BD Metric Standard (240 × 115 × 70 mm)', bn: '১ — BD মেট্রিক স্ট্যান্ডার্ড (২৪০ × ১১৫ × ৭০ মিমি)' } },
          { value: 2, label: { en: '2 — Traditional BD Field (9.5" × 4.5" × 2.75")', bn: '২ — প্রচলিত BD সাইট মাপ (৯.৫" × ৪.৫" × ২.৭৫")' } },
        ],
      },
      { key: 'cum20LenMm', label: { en: 'Measured 20-Brick Length (Target 4800 / 4826 mm)', bn: '২০ ইটের মাপা দৈর্ঘ্য (mm)' }, unit: 'mm', defaultValue: 4760, min: 3800, max: 5500, step: 5 },
      { key: 'cum20WidMm', label: { en: 'Measured 20-Brick Width (Target 2300 / 2286 mm)', bn: '২০ ইটের মাপা প্রস্থ (mm)' }, unit: 'mm', defaultValue: 2280, min: 1800, max: 2800, step: 5 },
      { key: 'cum20HgtMm', label: { en: 'Measured 20-Brick Height (Target 1400 / 1397 mm)', bn: '২০ ইটের মাপা উচ্চতা (mm)' }, unit: 'mm', defaultValue: 1385, min: 1000, max: 1800, step: 5 },
      {
        key: 'ringingSoundCode',
        label: { en: 'Ringing Sound & Scratch Hardness', bn: 'শব্দ ও নখ-আঁচড় পরীক্ষা' },
        unit: 'pass',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '1 — Clear Metallic Ring & No Nail Dent', bn: '১ — স্পষ্ট ঝনঝন শব্দ ও আঁচড় পড়ে না' } },
          { value: 2, label: { en: '2 — Muffled / Slight Surface Dust', bn: '২ — মাঝারি শব্দ / সামান্য ধুলা উঠে' } },
          { value: 3, label: { en: '3 — Dull Thud / Soft Chalky Scratch', bn: '৩ — ভোঁতা শব্দ / সহজে আঁচড়ে গুঁড়া হয়' } },
        ],
      },
      { key: 'dropBreakCount', label: { en: 'Bricks Broken in 1.2m Drop (Out of 5)', bn: '৪ ফুট পতনে ভাঙা ইট (৫টির মধ্যে)' }, unit: 'nos', defaultValue: 0, min: 0, max: 5, step: 1 },
    ],
  },

  // 3.2 24-HOUR COLD WATER ABSORPTION TEST OF BRICKS
  {
    id: 'brk-water-absorption',
    domainId: 'brick-block',
    code: 'LAB-BRK-02',
    title: {
      en: '24-Hour Cold Water Absorption Test of Bricks & Blocks (ASTM C67 / BDS 208)',
      bn: 'ইটের ২৪-ঘণ্টা ঠান্ডা পানি শোষণ ক্ষমতা পরীক্ষা (ASTM C67 / BDS 208)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাব ও ফিল্ড পরীক্ষা',
    governingCodes: ['BDS 208', 'PWD Strict Spec (≤15%)', 'ASTM C67', 'IS 3495 Part 2'],
    objective: {
      en: 'Measures brick porosity via 24-hour cold water absorption. Overly porous bricks (>20–22%) draw hydration water out of masonry mortar, swell on monsoon exposure, leak rainwater through exterior walls, and invite salt efflorescence & dampness.',
      bn: '২৪ ঘণ্টা ঠান্ডা পানিতে ভিজিয়ে ইটের ছিদ্রতা ও পানি শোষণ হার নির্ণয় করে। অতি ছিদ্রযুক্ত ইট (>২০–২২%) মর্টারের পানি শুষে নিয়ে গাঁথুনি দুর্বল করে এবং বর্ষায় বাইরের দেয়ালে ড্যাম্প ও নোনা ধরায়।',
    },
    sampling: {
      frequency: { en: 'Every kiln batch delivery (or per 20,000 bricks).', bn: 'প্রতিটি নতুন ভাটা চালান বা প্রতি ২০,০০০ ইটের জন্য একবার।' },
      quantity: { en: '5 whole representative bricks dried thoroughly and tested together.', bn: '৫টি অক্ষত শুকনো ইট একত্রে পরীক্ষা।' },
      lotSize: { en: 'Up to 50,000 bricks per kiln chamber.', bn: 'সর্বোচ্চ ৫০,০০০ ইটের লট।' },
    },
    apparatus: [
      { item: { en: 'Ventilated Drying Oven (105–115°C) & Immersion Water Tank', bn: 'ড্রাইং ওভেন (১১০°সে.) ও পানি ডোবানোর ট্যাংক' }, spec: 'Water temp maintained at 27 ± 2°C' },
      { item: { en: 'Digital Balance (1 g Accuracy) & Damp Wipe Cloth', bn: 'ডিজিটাল স্কেল (১ গ্রাম) ও মোছার কাপড়' }, spec: 'Capacity ≥ 10 kg' },
    ],
    procedure: [
      { en: 'Dry 5 whole brushed bricks in a ventilated oven at 105–115°C until two consecutive weighings (2 h apart) show ≤0.1% change, then cool to room temperature and record Dry Weight W₁ (g).', bn: '৫টি ইট পরিষ্কার করে ১১০±৫°সে. ওভেনে শুকিয়ে ঠান্ডা করে শুকনো ওজন W₁ (গ্রাম) মাপুন।' },
      { en: 'Submerge the cooled dry bricks completely in clean water at 27 ± 2°C for exactly 24 hours without stacking tightly.', bn: 'ঠান্ডা ইটগুলো গায়ে-গায়ে না লাগিয়ে ২৭±২°সে. পরিষ্কার পানির ট্যাংকে ঠিক ২৪ ঘণ্টা সম্পূর্ণ ডুবিয়ে রাখুন।' },
      { en: 'Remove each brick, wipe off surface drip water cleanly with a damp cloth, and weigh within 3 minutes to record Wet SSD Weight W₂ (g).', bn: '২৪ ঘণ্টা পর তুলে হালকা ভেজা কাপড়ে গা মুছে ৩ মিনিটের মধ্যে ভেজা ওজন W₂ (গ্রাম) মাপুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Always cool oven-dried bricks completely to room temperature before submerging—hot bricks crack internally and trap steam voids.', bn: 'ওভেন থেকে বের করা গরম ইট সাথে সাথে পানিতে ডোবাবেন না; পুরো ঠান্ডা হওয়ার পর ডোবান।' },
      ],
      contractorTricks: [
        { en: 'Pre-Dipped Bricks Before Inspection: Unscrupulous suppliers sometimes wet porous 2nd/3rd class bricks slightly or weigh hastily to hide true absorption—always oven-dry W₁ cleanly first.', bn: 'আগেই ভিজিয়ে রাখা ইট: ওজন বাড়াতে বা কম শোষণ দেখাতে ভেজা ইট পরিমাপ করা হয়—তাই ওভেনে না শুকিয়ে কখনোই W₁ নেবেন না।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Water Absorption Percentage (W_abs)', bn: 'পানি শোষণ শতকরা হার (W_abs)' },
          equation: 'W_abs (%) = [(W₂ - W₁) / W₁] × 100',
          variables: [
            { en: 'W₁ = Oven-dry cooled brick weight (g)', bn: 'W₁ = ওভেন-ড্রাই শুকনো ইটের ওজন (গ্রাম)' },
            { en: 'W₂ = 24-hr submerged surface-wiped SSD weight (g)', bn: 'W₂ = ২৪ ঘণ্টা ভিজিয়ে মোছা ইটের ওজন (গ্রাম)' },
          ],
          unitNote: 'Picked Jhama / Ceramic ≤ 10%–12% | 1st Class ≤ 15% (PWD strict) to ≤ 20% (Max) | 2nd Class 20%–22% | 3rd Class > 22% Reject.',
        },
      ],
      workedExample: {
        en: 'For a 1st-class clay brick with W₁ = 2,950 g and 24h W₂ = 3,360 g → W_abs = ((3,360 - 2,950)/2,950)×100 = 13.90% (≤ 15% PWD Strict 1st-Class → PASS).',
        bn: '১টি ইটের শুকনো ওজন W₁ = ২,৯৫০ গ্রাম এবং ২৪ ঘণ্টা পর ভেজা ওজন W₂ = ৩,৩৬০ গ্রাম হলে → শোষণ = ((৩,৩৬০ - ২,৯৫০)/২,৯৫০)×১০০ = ১৩.৯০% (≤ ১৫% পিডব্লিউডি ১ম শ্রেণি → পাস)।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: '≤ 12% (Picked Jhama/Ceramic) | ≤ 15% (PWD 1st Class) | 15.1–20% (Max 1st Class)', codeLimit: 'BDS 208 / PWD', interpretation: { en: 'Dense well-fired brick (≤15% PWD strict; up to 20% general max 1st class). Safe for structural & exterior walls.', bn: 'ভালো পোড়া ঘন ইট (≤১৫% কঠোর পিডব্লিউডি ১ম শ্রেণি; সর্বোচ্চ ২০% অনুমোদিত)—মূল ভবন ও বাইরের দেয়ালে নিরাপদ।' } },
      { tier: 'WARNING', rangeLabel: '20.1% – 22.0% (2nd Class Brick)', codeLimit: 'IS 1077 Class 2', interpretation: { en: '2nd-class porosity; restrict to interior partitions or temporary works only—unfit for exterior damp-prone masonry.', bn: '২য় শ্রেণির ইট (২০–২২%)—শুধু ভেতরের পার্টিশন দেয়ালে ব্যবহারযোগ্য, বাইরের দেয়ালে ড্যাম্প ধরতে পারে।' } },
      { tier: 'FAIL', rangeLabel: '> 22.0% (3rd Class / Under-Burnt)', codeLimit: 'REJECT LOT', interpretation: { en: 'Under-burnt porous 3rd-class brick; unusable for structural or exterior masonry.', bn: '৩য় শ্রেণির কাঁচা ও অতি ছিদ্রযুক্ত ইট (>২২%)—সব ধরনের কাঠামোগত ও বাইরের দেয়ালে সম্পূর্ণ বাতিল।' } },
    ],
    remedialActions: [
      { en: 'Pre-soak 1st-class bricks in clean water tank for at least 2–3 hours prior to laying so they do not suck water out of 1:4 / 1:5 cement mortar.', bn: '১ম শ্রেণির ইট হলেও গাঁথুনির ২–৩ ঘণ্টা আগে পরিষ্কার পানিতে ভিজিয়ে নিতে হবে যাতে মর্টারের পানি শুষে না নেয়।' },
      { en: 'Reject deliveries exceeding 20% (PWD) or 22% (max 2nd class cutoff) for structural/exterior masonry.', bn: '২০–২২%-এর বেশি শোষণ হলে বাইরের ও লোড-বিয়ারিং দেয়ালের জন্য ইট ফেরত দিন।' },
    ],
    calculatorInputs: [
      { key: 'dryWeightG', label: { en: 'Oven-Dry Weight (W₁)', bn: 'ওভেন-ড্রাই শুকনো ওজন (W₁)' }, unit: 'g', defaultValue: 2950, min: 500, max: 10000, step: 10 },
      { key: 'wetWeightG', label: { en: '24-Hr Submerged SSD Weight (W₂)', bn: '২৪-ঘণ্টা ভেজা ওজন (W₂)' }, unit: 'g', defaultValue: 3360, min: 500, max: 12000, step: 10 },
    ],
  },

  // 3.3 EFFLORESCENCE (LONA) TEST OF BRICKS (ইটের নোনা পরীক্ষা)
  {
    id: 'brk-efflorescence',
    domainId: 'brick-block',
    code: 'LAB-BRK-03',
    title: {
      en: 'Efflorescence (Lona / Soluble Salt) Test of Bricks (IS 3495 Part 3 / ASTM C67)',
      bn: 'ইটের নোনা বা লবণাক্ততা (Efflorescence / Lona) পরীক্ষা',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাব ও সাইট শেড পরীক্ষা',
    governingCodes: ['IS 3495 Part 3', 'BDS 208', 'ASTM C67', 'PWD Specification'],
    objective: {
      en: 'Detects soluble alkaline sulfate/chloride salts inside clay bricks that crystallize on the surface when moisture evaporates—causing chronic "Lona" salt whitewash, paint blistering, and plaster peeling along walls.',
      bn: 'ইটের ভেতরে থাকা দ্রবণীয় ক্ষারীয় লবণ শনাক্ত করে যা পরবর্তীতে দেয়ালের আর্দ্রতায় ভেসে উঠে সাদা "নোনা" (Lona) ধরায় এবং ভবনের রঙ ও প্লাস্টার খসিয়ে দেয়।',
    },
    sampling: {
      frequency: { en: 'Every new brick kiln source (especially saline/coastal clay zones like Khulna, Barishal, Satkhira) or per 50,000 bricks.', bn: 'নতুন ভাটা বা উপকূলীয় অঞ্চলের (খুলনা, বরিশাল, সাতক্ষীরা ইত্যাদি) ইটের ক্ষেত্রে এবং প্রতি ৫০,০০০ ইটে।' },
      quantity: { en: '5 whole dry bricks tested vertically side-by-side in distilled water dishes.', bn: '৫টি আস্ত শুকনো ইট ডিস্টিল্ড পানির ট্রে-তে দাঁড় করিয়ে পরীক্ষা।' },
      lotSize: { en: 'Up to 50,000 bricks.', bn: 'সর্বোচ্চ ৫০,০০০ ইটের লট।' },
    },
    apparatus: [
      { item: { en: 'Shallow Flat-Bottom Porcelain/Glass Tray & Distilled Water', bn: 'চ্যাপ্টা কাঁচ/পোর্সেলিন ট্রে ও ডিস্টিল্ড ওয়াটার' }, spec: 'Min. 25 mm water immersion depth' },
      { item: { en: 'Warm Ventilated Room (20–30°C) & Transparent Grid Sheet', bn: 'বায়ু চলাচলযুক্ত ঘর ও ক্ষেত্রফল মাপার গ্রিড শীট' }, spec: 'For % salt area estimate' },
    ],
    procedure: [
      { en: 'Stand 5 dry bricks vertically on-end inside shallow dishes containing 25 mm depth of pure distilled water in a warm ventilated room (20–30°C).', bn: '৫টি শুকনো ইট একটি ট্রে-র ভেতর ২৫ মিমি গভীর ডিস্টিল্ড পানিতে খাড়াভাবে দাঁড় করিয়ে রাখুন।' },
      { en: 'Allow all water to absorb up through brick pores and evaporate completely (usually 3–5 days).', bn: 'ইটের ছিদ্র বেয়ে সব পানি ওপরে উঠে সম্পূর্ণ শুকিয়ে যাওয়া (৩–৫ দিন) পর্যন্ত অপেক্ষা করুন।' },
      { en: 'After complete drying, refill another 25 mm of distilled water into the dish and repeat the full drying cycle a second time.', bn: 'সম্পূর্ণ শুকানোর পর ট্রে-তে আবার ২৫ মিমি ডিস্টিল্ড পানি ঢেলে দ্বিতীয়বার সম্পূর্ণ শুকান।' },
      { en: 'Inspect all exposed brick faces and measure the % of surface covered by white salt deposits AND check if the brick surface powders or flakes.', bn: 'এবার ইটের চারপাশ পরীক্ষা করে সাদা লবণের স্তর মোট পৃষ্ঠের কত % ঢেকেছে তা মাপুন এবং ইটের গুঁড়া বা আঁশ খসে পড়ছে কিনা দেখুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Always use distilled/deionized water—salty tap or tube-well water injects external salts and ruins the brick test.', bn: 'অবশ্যই ডিস্টিল্ড বা বৃষ্টির লবণমুক্ত পানি ব্যবহার করুন; লবণাক্ত টিউবওয়েলের পানি ব্যবহার করলে ভুল ফলাফল আসবে।' },
        { en: 'Always run the second drying cycle; single-cycle drying misses deeper soluble sulfates.', bn: 'একবার নয়, অবশ্যই দুইবার পানি শোষণ ও শুকানোর চক্র সম্পন্ন করুন।' },
      ],
      contractorTricks: [
        { en: 'Acid-Washed Salt Disguise: Kiln suppliers hose bricks down with water/acid before dispatch to hide visible white crust; the 2-cycle capillary test draws hidden internal salt straight back out.', bn: 'পাঠানোর আগে পানি দিয়ে ইটের ওপরের সাদা নোনা ধুয়ে ফেলা হয়—২-চক্রের ক্যাপিলারি টেস্টে ভেতরের লুকানো নোনা ঠিকই বেরিয়ে আসে।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'IS 3495 / BDS 208 Efflorescence Classification', bn: 'নোনা বা লবণাক্ততা শ্রেণিবিভাগ নিয়ম' },
          equation: 'Salt Area (%) = (A_salt / A_brick_faces) × 100',
          variables: [
            { en: 'Nil (0%) | Slight (< 10%) | Moderate (10%–50%, no flaking) | Heavy (> 50%) | Serious (Powder/Flaking)', bn: 'নোনা মুক্ত (০%) | সামান্য (<১০%) | মধ্যম (১০–৫০%) | অতিরিক্ত (>৫০% — পরিত্যাজ্য) | মারাত্মক (গুঁড়া/আঁশ খসা — সম্পূর্ণ বাতিল)' },
          ],
          unitNote: '1st-Class Structural Bricks must not exceed "Slight (<10%)" (PWD/BNBC max "Moderate" with anti-salt wash; Heavy/Serious = Reject).',
        },
      ],
      workedExample: {
        en: 'Two-cycle dry bricks show a faint white veil covering ~6% of exposed surface with zero powdering or flaking → Classified as SLIGHT (< 10%) → PASS for 1st-class masonry.',
        bn: '২-চক্র শুকানোর পর ইটের পৃষ্ঠের মাত্র ~৬% জায়গায় পাতলা সাদা আভা দেখা গেছে কিন্তু কোনো গুঁড়া বা আঁশ খসেনি → সামান্য / Slight (< ১০%) → পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: '0% = Nil (নোনা মুক্ত)  |  < 10% = Slight (সামান্য)', codeLimit: 'BDS 208 1st Class', interpretation: { en: 'Negligible/low salt; approved for exposed and plastered structural masonry.', bn: 'নোনা মুক্ত (০%) বা সামান্য (<১০%)—১ম শ্রেণির গাঁথুনি ও প্লাস্টারের জন্য অনুমোদিত।' } },
      { tier: 'WARNING', rangeLabel: '10% – 50% = Moderate (মধ্যম — No Powdering)', codeLimit: 'Interior Non-Damp / Brush + Seal', interpretation: { en: 'Moderate surface salt without flaking; dry-brush clean & seal with anti-salt primer, avoid damp basement/toilet walls.', bn: 'মধ্যম নোনা (১০–৫০%)—বেজমেন্ট বা ভেজা দেয়ালে ব্যবহার নিষেধ; তারের ব্রাশে পরিষ্কার ও সল্ট-সিলার ব্যবহার করুন।' } },
      { tier: 'FAIL', rangeLabel: '> 50% = Heavy (অতিরিক্ত — পরিত্যাজ্য) OR Powder/Flaking = Serious (মারাত্মক — সম্পূর্ণ বাতিল)', codeLimit: 'REJECT LOT', interpretation: { en: 'Heavy salt crust (>50%) or surface powdering/spalling destroys plaster and corrodes adjacent steel—reject immediately.', bn: 'অতিরিক্ত নোনা (>৫০%) বা ইটের গুঁড়া/আঁশ খসে পড়া (Serious)—দেয়ালের প্লাস্টার ও রঙ ধ্বংস করবে; সম্পূর্ণ বাতিল করুন।' } },
    ],
    remedialActions: [
      { en: 'Reject entire brick batch immediately if Heavy (>50%) or Serious (powdering/flaking) efflorescence occurs.', bn: 'অতিরিক্ত (>৫০%) অথবা গুঁড়া/আঁশ খসে পড়া (Serious) নোনা পাওয়া গেলে সম্পূর্ণ চালান বাতিল করুন।' },
      { en: 'For Slight/Moderate bricks used in interior walls, wire-brush dry salts off before plastering and apply penetrating silane/anti-efflorescence primer.', bn: 'সামান্য/মধ্যম নোনার ইট প্লাস্টারের আগে শুকনো তারের ব্রাশ দিয়ে ঘষে পরিষ্কার করে অ্যান্টি-সল্ট প্রাইমার দিন।' },
    ],
    calculatorInputs: [
      { key: 'saltAreaPct', label: { en: 'Salt Deposit Surface Area (%)', bn: 'সাদা লবণ ঢাকা পৃষ্ঠের হার (%)' }, unit: '%', defaultValue: 6, min: 0, max: 100, step: 1 },
      {
        key: 'flakingCode',
        label: { en: 'Brick Surface Condition', bn: 'ইটের পৃষ্ঠের অবস্থা' },
        unit: 'state',
        defaultValue: 1,
        options: [
          { value: 1, label: { en: '1 — Thin Deposit Only (No Powder / Flaking)', bn: '১ — শুধু পাতলা সাদা দাগ (খসে পড়ে না)' } },
          { value: 2, label: { en: '2 — Surface Powdering / Spalling / Flaking (Serious)', bn: '২ — গুঁড়া হয়ে ঝরছে বা আঁশ খসছে (মারাত্মক)' } },
        ],
      },
    ],
  },

  // 3.4 COMPRESSIVE / CRUSHING STRENGTH OF BRICKS & HOLLOW BLOCKS (ASTM C67 / C140)
  {
    id: 'brk-compressive',
    domainId: 'brick-block',
    code: 'LAB-BRK-04',
    title: {
      en: 'Compressive / Crushing Strength of Bricks & Hollow Blocks (5-Specimen Average — ASTM C67 / C140)',
      bn: 'ইট ও কংক্রিট হলো ব্লকের কম্প্রেসিভ স্ট্রেন্থ (৫ নমুনার গড় — ASTM C67 / C140)',
    },
    testType: 'Laboratory Test',
    testTypeBn: 'ল্যাবরেটরি পরীক্ষা',
    governingCodes: ['ASTM C67 (Bricks)', 'ASTM C140 (Hollow Blocks)', 'BDS 208', 'PWD Specification'],
    objective: {
      en: 'Measures ultimate crushing strength (MPa and psi) averaged across 5 specimens for clay bricks (Grade S >20 MPa, 1st Class ≥10.5–15.0 MPa, 2nd Class ≥7.0 MPa) and Load-Bearing Concrete Hollow Blocks (≥13.1 MPa net area)—preventing masonry wall crushing under load and ensuring good Jhama khoa quality.',
      bn: '৫টি নমুনার গড় ভাঙা শক্তি (MPa ও psi) নির্ণয় করে: Grade S (>২০ MPa), ১ম শ্রেণি (≥১০.৫–১৫.০ MPa), ২য় শ্রেণি (≥৭.০ MPa) এবং লোড-বিয়ারিং কংক্রিট হলো ব্লক (≥১৩.১ MPa নেট এরিয়া)—যাতে ভারবহনকারী দেয়াল ভেঙে না পড়ে ও খোয়ার মান ঠিক থাকে।',
    },
    sampling: {
      frequency: { en: 'Once per 50,000 bricks/blocks or every new kiln/block plant consignment.', bn: 'প্রতি ৫০,০০০ ইট/ব্লকের জন্য একবার অথবা ভাটা/ব্লক কারখানা পরিবর্তন হলে।' },
      quantity: { en: '5 whole bricks (frog filled with 1:1 cement mortar and cured 3 days) or 3–5 concrete hollow blocks capped flush.', bn: '৫টি অক্ষত ইট (ফ্রগ ১:১ মর্টারে ভরাট ও ৩ দিন কিউরিং করা) অথবা ৩–৫টি হলো ব্লক।' },
      lotSize: { en: 'Up to 50,000 units.', bn: 'সর্বোচ্চ ৫০,০০০টি ইট/ব্লক।' },
    },
    apparatus: [
      { item: { en: 'Compression Testing Machine (CTM, 1,000–2,000 kN) + 3 mm Plywood Bearing Sheets', bn: 'কম্প্রেশন টেস্টিং মেশিন (CTM) ও ৩ মিমি প্লাইউড প্যাড' }, spec: 'Calibrated load pace 14 MPa/min (2,000 psi/min)' },
      { item: { en: 'Vernier Caliper / Scale (1 mm) & 1:1 Cement-Sand Capping Mortar', bn: 'ভার্নিয়ার ক্যালিপার ও ফ্রগ ভরাটের ১:১ সিমেন্ট-বালি মর্টার' }, spec: '24h soaking + 3d damp gunny bag curing' },
    ],
    procedure: [
      { en: 'Grind irregular bumps off 5 specimens, measure exact Length (L) and Width (W) in mm, and for bricks immerse in water 24 hours.', bn: '৫টি নমুনার বাড়তি অংশ ঘষে সমান করে দৈর্ঘ্য (L) ও প্রস্থ (W) মিমি-তে মাপুন এবং ইট হলে ২৪ ঘণ্টা পানিতে ভিজিয়ে রাখুন।' },
      { en: 'Fill brick frog depression flush with 1:1 cement-sand mortar, cover under damp jute bags for 24h, then cure submerged 3 days before testing.', bn: 'ইটের ফ্রগ ১:১ সিমেন্ট-বালি মর্টারে সমান করে ভরাট করে ২৪ ঘণ্টা ভেজা চটে ও ৩ দিন পানিতে কিউরিং করুন।' },
      { en: 'For Concrete Hollow Blocks (ASTM C140), measure/enter the net solid cross-sectional bed area (typically ~55–65% of L×W gross area) or test capped full block.', bn: 'হলো ব্লকের ক্ষেত্রে (ASTM C140) ফাঁকা অংশ বাদ দিয়ে নিট সলিড বেড ক্ষেত্রফল (Net Area) হিসাব করুন।' },
      { en: 'Place each specimen flat between two 3 mm plywood sheets centered in CTM, apply load at 14 MPa/min until failure, record P₁..P₅ (kN), and compute 5-specimen mean.', bn: 'CTM প্লেটের মাঝে ৩ মিমি প্লাইউড দিয়ে প্রতিটি ইট বসিয়ে সমভাবে চাপ দিন এবং ৫টি নমুনার ভাঙা লোড P₁..P₅ (kN) নিয়ে গড় MPa ও psi বের করুন।' },
    ],
    precautionsAndTricks: {
      precautions: [
        { en: 'Always place 3 mm plywood bearing pads top and bottom and ensure frog mortar has cured ≥ 3 days so stress distributes evenly.', bn: 'উপর-নিচ ৩ মিমি প্লাইউড প্যাড দিন এবং ফ্রগ ভরাটের মর্টার কমপক্ষে ৩ দিন কিউরিং হয়েছে কিনা নিশ্চিত করুন।' },
      ],
      contractorTricks: [
        { en: 'Hand-Picked "Show Sample" vs Random Kiln Lot: Suppliers send 5 over-burnt ceramic-hard Jhama bricks to the lab while dumping soft under-burnt 2nd-class bricks on site—field QA engineers must pick specimens straight from delivered stacks.', bn: 'ল্যাবে আলাদা ভালো ইট পাঠানো: ঠিকাদার ল্যাব টেস্টের জন্য আলাদা সেরা ৫টি ইট দিয়ে সাইটে নরম ইট ঢোকায়—ইঞ্জিনিয়ারকে অবশ্যই সাইটের স্তূপ থেকে নিজে নমুনা তুলে সাইন করে ল্যাবে পাঠাতে হবে।' },
      ],
    },
    mathSection: {
      formulas: [
        {
          name: { en: 'Average Brick / Hollow Block Compressive Strength (f_b)', bn: '৫-নমুনার গড় কম্প্রেসিভ স্ট্রেন্থ (f_b)' },
          equation: 'f_b,i = (P_max,i × 1000) / A_net (MPa)  |  f_b,avg = (Σ f_b,i) / 5  |  1 MPa = 145.038 psi',
          variables: [
            { en: 'P_max,i = Peak failure load of specimen i = 1..5 (kN)', bn: 'P_max,i = ১ থেকে ৫ নম্বর নমুনার ভাঙা লোড (kN)' },
            { en: 'A_net = L × W (mm²) for solid brick, or L × W × (Net Solid % / 100) for hollow block', bn: 'A_net = ইটের জন্য L × W (মিমি²), এবং হলো ব্লকের জন্য নিট সলিড এরিয়া' },
          ],
          unitNote: 'Grade S > 20 MPa (2900 psi) | 1st Class ≥ 10.5–15.0 MPa (1500–2200 psi) | 2nd Class ≥ 7.0 MPa (1000 psi) | Load-Bearing Hollow Block ≥ 13.1 MPa Net.',
        },
      ],
      workedExample: {
        en: 'For 5 standard 240×115 mm solid bricks (A = 27,600 mm²) failing at [450, 470, 440, 465, 455] kN → Mean P = 456 kN → f_b = (456×1000)/27600 = 16.52 MPa (2,396 psi) → Passes 1st Class (≥ 10.5–15.0 MPa).',
        bn: '২৪০×১১৫ মিমি মাপের ৫টি ইট (A = ২৭,৬০০ মিমি²) [৪৫০, ৪৭০, ৪৪০, ৪৬৫, ৪৫৫] kN লোডে ভাঙলে গড় লোড ৪৫৬ kN → f_b = (৪৫৬×১০০০)/২৭৬০০ = ১৬.৫২ MPa (২,৩৯৬ psi) → ১ম শ্রেণি পাস।',
      },
    },
    acceptanceRanges: [
      { tier: 'PASS', rangeLabel: 'Grade S > 20 MPa (2900 psi) | 1st Class ≥ 10.5–15.0 MPa (1500–2200 psi) | Load-Bearing Block ≥ 13.1 MPa Net', codeLimit: 'BDS 208 / PWD / ASTM C140', interpretation: { en: 'Meets or exceeds specified structural masonry crushing strength.', bn: 'নির্ধারিত গ্রেডের (১ম শ্রেণি / Grade S / লোড-বিয়ারিং ব্লক) শক্তি অর্জন করেছে।' } },
      { tier: 'WARNING', rangeLabel: '7.0 – 10.4 MPa (2nd Class Brick, ≥ 1000 psi)', codeLimit: 'Non-Load Partition Only', interpretation: { en: 'Passes 2nd-class ≥ 7.0 MPa threshold; restrict strictly to non-load-bearing interior partition walls.', bn: '২য় শ্রেণির শক্তি (≥৭.০ MPa)—শুধু লোড না নেওয়া ভেতরের পার্টিশন দেয়ালে ব্যবহারযোগ্য।' } },
      { tier: 'FAIL', rangeLabel: '< 7.0 MPa (< 1000 psi) OR Block < Target Net MPa', codeLimit: 'REJECT LOT', interpretation: { en: 'Severely under-burnt weak brick or defective block mix; reject delivery immediately.', bn: 'অতি দুর্বল ও কাঁচা ইট/ব্লক (<৭.০ MPa)—গাড়ি ফেরত দিন।' } },
    ],
    remedialActions: [
      { en: 'Reject any 1st-class structural lot scoring below 10.5 MPa (1,500 psi) or hollow load-bearing blocks below 13.1 MPa net area.', bn: '১ম শ্রেণির ইট ১০.৫ MPa-এর নিচে বা লোড-বিয়ারিং ব্লক ১৩.১ MPa-এর নিচে নামলে পুরো লট বাতিল করুন।' },
      { en: 'Also check individual specimen consistency—no single brick in the 5-brick sample should drop below 80% of the class minimum.', bn: '৫টি নমুনার গড়ের পাশাপাশি কোনো একটি একক ইট যেন সর্বনিম্ন সীমার ৮০%-এর নিচে না নামে তা নিশ্চিত করুন।' },
    ],
    calculatorInputs: [
      {
        key: 'masonryUnitCode',
        label: { en: 'Unit Class & Standard Target', bn: 'ইট বা ব্লকের শ্রেণি' },
        unit: 'class',
        defaultValue: 2,
        options: [
          { value: 1, label: { en: '1 — Grade S / Heavy Duty Brick (> 20.0 MPa / 2900 psi)', bn: '১ — Grade S / হেভি ডিউটি ইট (> ২০.০ MPa)' } },
          { value: 2, label: { en: '2 — 1st Class Clay Brick (PWD ≥ 15.0 / BDS ≥ 10.5 MPa)', bn: '২ — ১ম শ্রেণির ইট (≥ ১০.৫–১৫.০ MPa)' } },
          { value: 3, label: { en: '3 — 2nd Class Brick (≥ 7.0 MPa / 1000 psi)', bn: '৩ — ২য় শ্রেণির ইট (≥ ৭.০ MPa)' } },
          { value: 4, label: { en: '4 — Load-Bearing Concrete Hollow Block (≥ 13.1 MPa Net)', bn: '৪ — লোড-বিয়ারিং হলো ব্লক (≥ ১৩.১ MPa নিট)' } },
        ],
      },
      { key: 'brickLengthMm', label: { en: 'Specimen Length (L)', bn: 'নমুনার দৈর্ঘ্য (L)' }, unit: 'mm', defaultValue: 240, min: 80, max: 600, step: 1 },
      { key: 'brickWidthMm', label: { en: 'Specimen Width (W)', bn: 'নমুনার প্রস্থ (W)' }, unit: 'mm', defaultValue: 115, min: 50, max: 350, step: 1 },
      { key: 'netSolidPct', label: { en: 'Net Solid Area % (100% Solid Brick, ~58% Hollow Block)', bn: 'নিট সলিড এরিয়া % (ইট ১০০%)' }, unit: '%', defaultValue: 100, min: 30, max: 100, step: 1 },
      { key: 'load1Kn', label: { en: 'Specimen #1 Peak Load (P₁)', bn: 'নমুনা #১ ভাঙা লোড (P₁)' }, unit: 'kN', defaultValue: 450, min: 10, max: 3000, step: 5 },
      { key: 'load2Kn', label: { en: 'Specimen #2 Peak Load (P₂)', bn: 'নমুনা #২ ভাঙা লোড (P₂)' }, unit: 'kN', defaultValue: 470, min: 10, max: 3000, step: 5 },
      { key: 'load3Kn', label: { en: 'Specimen #3 Peak Load (P₃)', bn: 'নমুনা #৩ ভাঙা লোড (P₃)' }, unit: 'kN', defaultValue: 440, min: 10, max: 3000, step: 5 },
      { key: 'load4Kn', label: { en: 'Specimen #4 Peak Load (P₄)', bn: 'নমুনা #৪ ভাঙা লোড (P₄)' }, unit: 'kN', defaultValue: 465, min: 10, max: 3000, step: 5 },
      { key: 'load5Kn', label: { en: 'Specimen #5 Peak Load (P₅)', bn: 'নমুনা #৫ ভাঙা লোড (P₅)' }, unit: 'kN', defaultValue: 455, min: 10, max: 3000, step: 5 },
    ],
  },
];
