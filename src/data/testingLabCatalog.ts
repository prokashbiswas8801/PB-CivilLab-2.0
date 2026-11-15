import {
  LabTestDefinition,
  TestingLabDomainId,
  TestingLabDomainMeta,
} from '../types/testingLab';
import { TESTING_LAB_TESTS_PART1 } from './testingLabCatalogPart1';
import { TESTING_LAB_TESTS_PART2 } from './testingLabCatalogPart2';
import { TESTING_LAB_TESTS_PART3 } from './testingLabCatalogPart3';

export const TESTING_LAB_DOMAINS: TestingLabDomainMeta[] = [
  {
    id: 'cement',
    shortCode: 'LAB-01',
    titleEn: 'Cement Quality Tests (OPC & PCC)',
    titleBn: 'সিমেন্ট পরীক্ষা (OPC ও PCC)',
    subtitleEn: '5 Field Instant Checks (Lumps, Color, Float, Paste, Age) + 90µm Fineness, Vicat Consistency & Setting, Le Chatelier & Mortar Strength',
    subtitleBn: '৫টি সাইট পরীক্ষা (দলা, রঙ, ভাসা, পেস্ট, মেয়াদ) ও ৫টি ল্যাব পরীক্ষা (ফাইননেস, ভিক্যাট, সাউন্ডনেস ও মর্টার স্ট্রেন্থ)',
    governingCodes: ['BDS EN 197-1', 'ASTM C150 / C191', 'BNBC-2020'],
  },
  {
    id: 'aggregate',
    shortCode: 'LAB-02',
    titleEn: 'Sand & Aggregate Tests',
    titleBn: 'বালি ও পাথর/খোয়া পরীক্ষা',
    subtitleEn: 'Jar Silt & Clay %, 6-Sieve FM Gradation Table, Sand Bulking Farrah Box, Specific Gravity/Absorption & ACV/AIV/L.A. Abrasion',
    subtitleBn: 'জার পলি-কাদা %, ৬-সিভ এফএম (FM), বালির বাল্কিং, আপেক্ষিক গুরুত্ব/পানি শোষণ ও ACV/AIV/L.A. ক্ষয় পরীক্ষা',
    governingCodes: ['ASTM C136 / C117 / C127 / C131', 'PWD / RHD', 'BS 812'],
  },
  {
    id: 'brick-block',
    shortCode: 'LAB-03',
    titleEn: 'Brick & Block Tests',
    titleBn: 'ইট ও ব্লক পরীক্ষা',
    subtitleEn: 'Field Sound/Drop/20-Brick Dimensions (Metric & 9.5"×4.5"×2.75"), 24h Cold Water Absorption, Lona Efflorescence & 5-Specimen Crushing Strength',
    subtitleBn: 'শব্দ-পতন-২০ ইটের মাপ (মিমি ও ফুট-ইঞ্চি), ২৪-ঘণ্টা পানি শোষণ, নোনা (Lona) ও ৫-নমুনা কম্প্রেসিভ স্ট্রেন্থ',
    governingCodes: ['BDS 208', 'PWD 1st-Class Spec', 'ASTM C67 / C140 / IS 3495'],
  },
  {
    id: 'concrete-ndt',
    shortCode: 'LAB-04',
    titleEn: 'Fresh, Hardened & NDT Concrete Tests',
    titleBn: 'কংক্রিট ও এনডিটি পরীক্ষা',
    subtitleEn: 'Slump Cone (ASTM C143), Cylinder/Cube Strength (BNBC/ACI 318), Drilled Core (ASTM C42), 10-Pt Rebound Hammer, UPV & Ferroscan/Half-Cell',
    subtitleBn: 'স্লাম্প কোন, সিলিন্ডার/কিউব (৩-ব্যাচ BNBC নিয়ম), কোর কাটিং, ১০-পয়েন্ট রিবাউন্ড হ্যামার, ইউপিভি ও ফেরোস্ক্যান/হাফ-সেল',
    governingCodes: ['ASTM C143 / C39 / C42 / C805 / C597 / C876', 'ACI 318-19', 'BNBC-2020'],
  },
  {
    id: 'rebar-steel',
    shortCode: 'LAB-05',
    titleEn: 'Rebar & Steel Tests',
    titleBn: 'রড ও স্টিল পরীক্ষা',
    subtitleEn: 'Field Unit Weight (d²/162.2) & Rolling Margin, UTM Tensile Yield/Seismic Ratio (fu/fy), Elongation % & 180° Bend/Rebend Audit',
    subtitleBn: 'একক ওজন (d²/১৬২.২), ইউটিএম ইল্ড-আল্টিমেট-সিসমিক অনুপাত, ইলংগেশন % এবং ১৮০° বেন্ড ও রি-বেন্ড পরীক্ষা',
    governingCodes: ['BDS ISO 6935-2 (B500DWR)', 'ASTM A615 / A706 / A370', 'BNBC-2020'],
  },
  {
    id: 'soil-pile',
    shortCode: 'LAB-06',
    titleEn: 'Soil, Compaction & Pile Tests',
    titleBn: 'মাটি ও পাইল পরীক্ষা',
    subtitleEn: 'SPT (N-Value & N60/N1_60), Atterberg LL/PL/PI, FDD Sand Replacement vs MDD, Bentonite Drilling Slurry & Davisson Static Pile + PIT Integrity',
    subtitleBn: 'এসপিটি (N60 ও ওভারবার্ডেন), অ্যাটারবার্গ (LL/PL/PI), স্যান্ড রিপ্লেসমেন্ট বনাম MDD, বেনটোনাইট স্লারি এবং স্ট্যাটিক পাইল লোড ও পিআইটি',
    governingCodes: ['ASTM D1586 / D4318 / D1556 / D1143 / D5882', 'BNBC-2020 Part 6', 'FHWA / PWD'],
  },
  {
    id: 'highway-bitumen',
    shortCode: 'LAB-07',
    titleEn: 'Highway, Pavement & Bitumen Tests',
    titleBn: 'রাস্তা ও বিটুমিন পরীক্ষা',
    subtitleEn: '4-Day Soaked CBR (Subgrade to Base), DCP Field CBR, Bitumen 60/70 & 80/100 Penetration/Softening/Ductility/Flash, Marshall Stability + Extraction & Core Density',
    subtitleBn: '৪-দিন সোকড সিবিআর (CBR), ডিসিপি (DCP), বিটুমিন ৬০/৭০ ও ৮০/১০০, মার্শাল স্ট্যাবিলিটি ও বিটুমিন এক্সট্রাকশন এবং কোর ডেনসিটি',
    governingCodes: ['RHD / LGED Spec', 'ASTM D1883 / D6951 / D5 / D6927 / D2172 / D2726', 'AASHTO'],
  },
  {
    id: 'water-plumbing',
    shortCode: 'LAB-08',
    titleEn: 'Water, Plumbing & Waterproofing Tests',
    titleBn: 'পানি ও প্লাম্বিং পরীক্ষা',
    subtitleEn: 'Concrete Water pH/TDS/Chloride/Sulfate, Pipe Hydrostatic Test (10 bar / 2h), Sanitary Slope (1:60–1:120) + 1.5m Head & Ball Test, 72h Roof/Tank Ponding',
    subtitleBn: 'কংক্রিট পানির pH/TDS/ক্লোরাইড/সালফেট, পাইপ প্রেশার টেস্ট (১০ বার/২ ঘণ্টা), ড্রেনেজ ঢাল ও বল টেস্ট এবং ৭২-ঘণ্টা ছাদ/ট্যাংক পন্ডিং',
    governingCodes: ['ASTM C1602 / D5957', 'BNBC-2020 Part 6 & 8', 'PWD / IS 456'],
  },
  {
    id: 'site-checklists',
    shortCode: 'LAB-09',
    titleEn: 'Site Execution & Structural QA/QC Checklists',
    titleBn: 'সাইট চেকলিস্ট ও মান যাচাই',
    subtitleEn: 'Diagonal Formwork Squareness & Plumb, Rebar Clear Cover & BNBC Ductile Seismic Lapping, Post-Pour Curing & Stripping Days, Masonry/Plaster Straightedge & Foundation Excavation',
    subtitleBn: 'সাটারিং স্কয়ারেস ও ক্যাম্বার, রডের কাভার ও সিসমিক ১৩৫° হুক, ঢালাই পরবর্তী কিউরিং ও সাটার খোলা, গাঁথুনি/প্লাস্টার পাট্টি ও ফাউন্ডেশন খনন যাচাই',
    governingCodes: ['BNBC-2020 Part 6', 'ACI 318-19 / ACI 347R', 'PWD / OSHA'],
  },
];

export const TESTING_LAB_TESTS: LabTestDefinition[] = [
  ...TESTING_LAB_TESTS_PART1,
  ...TESTING_LAB_TESTS_PART2,
  ...TESTING_LAB_TESTS_PART3,
];

export const TESTING_LAB_DOMAIN_MAP: Record<TestingLabDomainId, TestingLabDomainMeta> =
  TESTING_LAB_DOMAINS.reduce(
    (acc, d) => {
      acc[d.id] = d;
      return acc;
    },
    {} as Record<TestingLabDomainId, TestingLabDomainMeta>
  );

export const TESTING_LAB_TEST_MAP: Record<string, LabTestDefinition> =
  TESTING_LAB_TESTS.reduce(
    (acc, t) => {
      acc[t.id] = t;
      return acc;
    },
    {} as Record<string, LabTestDefinition>
  );

export function getTestsForDomain(domainId: TestingLabDomainId): LabTestDefinition[] {
  return TESTING_LAB_TESTS.filter((t) => t.domainId === domainId);
}
