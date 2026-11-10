import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  Languages,
  ShieldCheck,
  AlertTriangle,
  Truck,
  Briefcase,
  FileSpreadsheet,
  Award,
  Building,
  UserCheck,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  Hash,
} from 'lucide-react';
import { useCivilLab } from '../../context/CivilLabContext';
import { CivilWorkspace } from '../../types/civil';
import { OfficeDocVerificationModal } from './OfficeDocVerificationModal';
import { OfficeDocPublicPortalView } from './OfficeDocPublicPortalView';
import {
  VerifiedOfficeDocRecord,
  generateOfficeDocHash,
  buildOfficeDocVerificationUrl,
  saveVerifiedOfficeDoc,
} from '../../utils/officeDocVerification';

export type OfficeDocType =
  | 'gate-pass'
  | 'work-order'
  | 'ra-bill-forwarding'
  | 'site-instruction-ncr'
  | 'completion-certificate';

interface GatePassItem {
  sl: number;
  description: string;
  quantity: string;
  unit: string;
  purposeOrDestination: string;
  remarks: string;
}

interface WorkOrderItem {
  sl: number;
  itemDescription: string;
  qty: string;
  unit: string;
  rate: string;
  amount: string;
}

interface OfficeDocsModuleProps {
  activeWorkspace?: CivilWorkspace;
}

export const OfficeDocsModule: React.FC<OfficeDocsModuleProps> = ({ activeWorkspace }) => {
  const { userProfile } = useCivilLab();

  // Document Type State
  const [docType, setDocType] = useState<OfficeDocType>('gate-pass');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [copied, setCopied] = useState<boolean>(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState<boolean>(false);
  const [activeVerifiedDoc, setActiveVerifiedDoc] = useState<VerifiedOfficeDocRecord | null>(null);
  const [publicPortalPreviewDoc, setPublicPortalPreviewDoc] = useState<VerifiedOfficeDocRecord | null>(null);

  // Common Header Metadata
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [language]);

  const [docMeta, setDocMeta] = useState({
    memoNo: `CL/SITE/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
    date: todayStr,
    organization: userProfile?.organization || 'National Engineering & Construction Consortium',
    projectName: activeWorkspace?.name || 'Multi-Story Residential & Commercial Complex',
    projectCode: activeWorkspace?.projectCode || 'PRJ-2026-08',
    siteLocation: activeWorkspace?.siteLocation || 'Plot 42, Sector 11, Uttara, Dhaka-1230',
    clientName: 'Modern Living Properties Ltd.',
    contractorName: 'Eastern Star Builders & Civil Contractors Ltd.',
    engineerName: userProfile?.name || 'Engr. Md. Tanvir Hasan',
    engineerTitle: userProfile?.title || 'Resident Project Engineer',
    licenseNo: userProfile?.licenseNo || 'IEB M-38491 / PEng 1024',
    consultantOrg: 'Design Consortium Engineers & Architects',
  });

  // 1. GATE PASS & CHALLAN SPECIFIC STATE
  const [gatePassData, setGatePassData] = useState({
    passType: 'Returnable' as 'Returnable' | 'Non-Returnable',
    vehicleNo: 'Dhaka Metro-Ta-11-8492',
    driverName: 'Md. Rafiqul Islam',
    driverPhone: '+880 1711-902834',
    destination: 'Godown Depot #2, Hemayetpur, Savar',
    purpose: 'Transfer of surplus scaffolding props and hydraulic cutter for repair',
    authorizedBy: userProfile?.name || 'Engr. Md. Tanvir Hasan',
    securityOfficer: 'Md. Anisur Rahman (Chief Security)',
    items: [
      { sl: 1, description: 'Steel Tubular Scaffolding Props (3.5m Heavy Duty)', quantity: '120', unit: 'Pcs', purposeOrDestination: 'Site Transfer', remarks: 'Good Condition' },
      { sl: 2, description: 'Bar Bending Hydraulic Machine (32mm Capacity)', quantity: '1', unit: 'Set', purposeOrDestination: 'Workshop Servicing', remarks: 'Motor overhauling' },
      { sl: 3, description: 'G.I. Coupler Clamps & Base Plates', quantity: '250', unit: 'Nos', purposeOrDestination: 'Site Transfer', remarks: 'In gunny bags' },
    ] as GatePassItem[],
  });

  // 2. SUB-CONTRACTOR WORK ORDER STATE
  const [workOrderData, setWorkOrderData] = useState({
    workOrderNo: `WO/RCC/${new Date().getFullYear()}/042`,
    trade: 'RCC Structural Formwork, Rebar Binding & Concreting',
    commencementDate: todayStr,
    completionTargetDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    totalOrderValue: '18,50,000',
    retentionPercent: '10',
    defectLiabilityMonths: '12',
    advancePercent: '5',
    scopeSummary: 'Execution of complete RCC frame structure including column casting, beam-slab formwork shuttering, rebar fabrication per approved BBS, and machine-mix concrete casting per BNBC-2020 specifications.',
    items: [
      { sl: 1, itemDescription: 'Fabrication & binding of deformed rebar (500W/60 grade) per approved BBS', qty: '45', unit: 'Ton', rate: '9,500', amount: '4,27,500' },
      { sl: 2, itemDescription: 'Marine ply & steel prop formwork shuttering for beam, slab & column', qty: '12,500', unit: 'SFT', rate: '48', amount: '6,00,000' },
      { sl: 3, itemDescription: 'Batch mixing, hoisting, pouring, compacting and finishing of M25 concrete', qty: '8,200', unit: 'CFT', rate: '32', amount: '2,62,400' },
      { sl: 4, itemDescription: 'Solid brick masonry in 1:4 cement mortar with curing', qty: '3,800', unit: 'CFT', rate: '65', amount: '2,47,000' },
    ] as WorkOrderItem[],
  });

  // 3. JOINT MEASUREMENT & RA BILL FORWARDING LETTER STATE
  const [raBillLetterData, setRaBillLetterData] = useState({
    billNo: 'RA-04 (Interim Payment Certificate)',
    measurementPeriod: '1st October 2026 to 31st October 2026',
    subContractor: 'Eastern Star Builders & Civil Contractors Ltd.',
    workTrade: 'RCC Structural Civil & Finishing Works',
    grossAmountClaimed: '12,45,000',
    grossAmountCertified: '11,80,000',
    retentionAmount: '1,18,000', // 10%
    aitTaxDeduction: '35,400', // 3%
    advanceMobilizationRecovery: '50,000',
    netRecommendedPayable: '9,76,600',
    recommendationNote: 'The joint on-site measurement recorded in MB-08 (Pages 42-65) has been thoroughly verified against approved structural drawings. Concrete cylinder 28-day crushing reports comply with BNBC M25 specifications. Release of net payment is recommended.',
  });

  // 4. SITE INSTRUCTION / NON-CONFORMANCE NOTICE (NCR) STATE
  const [ncrData, setNcrData] = useState({
    ncrNo: `NCR/STR/${new Date().getFullYear()}/015`,
    issuedTo: 'M/S Prime Builders & Associates (Structural Contractor)',
    locationGrid: '4th Floor Beam B-12 and Column C-3 junction (Grid Line B-3)',
    severity: 'Major' as 'Minor' | 'Major' | 'Critical / Safety Hazard',
    defectDescription: 'During post-deshuttering joint inspection, severe honeycombing and exposed stirrups were observed on the beam-column core junction of Column C-3. Additionally, clear cover of 40mm was found compromised due to missing cover blocks.',
    governingCode: 'BNBC-2020 Part 6 Chapter 5 (Concrete Quality & Placement) & ACI 318 Section 26.5',
    rectificationActionRequired: 'Chip off loose concrete until sound aggregate is exposed under supervision of Resident Engineer. Apply bonding agent (Sika Top Armatec 110) and pressure-grout using non-shrink structural micro-concrete (fck >= 40 MPa). Provide certified test cube report.',
    targetRectificationDays: '3',
    followUpInspectionDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
  });

  // 5. PROJECT COMPLETION & HANDOVER CERTIFICATE STATE
  const [handoverData, setHandoverData] = useState({
    certNo: `PCC/FINAL/${new Date().getFullYear()}/008`,
    contractRef: 'PRJ/CIVIL/CONTRACT-2024-001',
    scheduledCompletionDate: '30 September 2026',
    actualCompletionDate: '15 October 2026',
    finalContractValue: '4,85,50,000',
    defectsLiabilityEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    scopeCompleted: 'Turnkey construction of 10-story RCC commercial building including foundation piles, superstructure frame, plumbing, electrical substations, firefighting, and architectural finishes.',
    declaration: 'It is hereby certified that the subject project works have been inspected and tested in accordance with the contract documents, approved structural drawings, and BNBC-2020 standards, and are found to be substantially completed in sound, functional condition.',
  });

  // Handlers for Gate Pass Item CRUD
  const handleAddGatePassItem = () => {
    setGatePassData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sl: prev.items.length + 1,
          description: '',
          quantity: '1',
          unit: 'Nos',
          purposeOrDestination: 'Site transfer',
          remarks: 'Good condition',
        },
      ],
    }));
  };

  const handleRemoveGatePassItem = (index: number) => {
    setGatePassData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sl: i + 1 })),
    }));
  };

  // Handlers for Work Order Item CRUD
  const handleAddWorkOrderItem = () => {
    setWorkOrderData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sl: prev.items.length + 1,
          itemDescription: '',
          qty: '100',
          unit: 'SFT',
          rate: '50',
          amount: '5000',
        },
      ],
    }));
  };

  const handleRemoveWorkOrderItem = (index: number) => {
    setWorkOrderData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sl: i + 1 })),
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const el = document.getElementById('printable-office-document');
    if (el) {
      navigator.clipboard.writeText(el.innerText || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const buildCurrentVerifiedRecord = (): VerifiedOfficeDocRecord => {
    const docId = `DOC-${docType.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const hash = generateOfficeDocHash(`${docId}|${docMeta.memoNo}|${docMeta.projectCode}|${Date.now()}`);

    let docTypeTitle = 'Material Gate Pass & Delivery Challan';
    let docTypeTitleBn = 'ম্যাটেরিয়াল গেট পাস ও ডেলিভারি চালান';
    let summaryText = gatePassData.purpose;
    let keyFields: Array<{ label: string; value: string | number; highlight?: boolean }> = [];
    let tableData: { headers: string[]; rows: Array<Array<string | number>> } | undefined = undefined;
    let clausesOrNotes: string[] = [];

    if (docType === 'gate-pass') {
      docTypeTitle = `Material Gate Pass & Delivery Challan (${gatePassData.passType})`;
      docTypeTitleBn = `ম্যাটেরিয়াল গেট পাস ও ডেলিভারি চালান (${gatePassData.passType === 'Returnable' ? 'ফেরতযোগ্য' : 'অফেরতযোগ্য'})`;
      summaryText = `Gate clearance authorization for transport of materials/equipment to ${gatePassData.destination}. Purpose: ${gatePassData.purpose}.`;
      keyFields = [
        { label: 'Pass Category', value: gatePassData.passType, highlight: true },
        { label: 'Vehicle Reg', value: gatePassData.vehicleNo },
        { label: 'Carrier / Driver', value: `${gatePassData.driverName} (${gatePassData.driverPhone})` },
        { label: 'Destination', value: gatePassData.destination },
        { label: 'Total Items Dispatched', value: gatePassData.items.length },
      ];
      tableData = {
        headers: ['SL', 'Item Description', 'Qty', 'Unit', 'Purpose / Condition'],
        rows: gatePassData.items.map((it) => [it.sl, it.description, it.quantity, it.unit, it.remarks || it.purposeOrDestination]),
      };
      clausesOrNotes = [
        'Security guard on duty must verify physical count prior to vehicle exit gate passage.',
        gatePassData.passType === 'Returnable'
          ? 'Mandatory Return: Materials must be returned within 7 working days with signed return slip.'
          : 'Permanent dispatch: Deductions/adjustments logged into store inventory register.',
      ];
    } else if (docType === 'work-order') {
      docTypeTitle = `Sub-Contractor Work Order (${workOrderData.workOrderNo})`;
      docTypeTitleBn = `উপ-ঠিকাদারি কার্যাদেশ ও চুক্তিপত্র (${workOrderData.workOrderNo})`;
      summaryText = workOrderData.scopeSummary;
      keyFields = [
        { label: 'Awarded Trade', value: workOrderData.trade },
        { label: 'Sub-Contractor', value: docMeta.contractorName, highlight: true },
        { label: 'Commencement', value: workOrderData.commencementDate },
        { label: 'Target Completion', value: workOrderData.completionTargetDate },
        { label: 'Retention Security', value: `${workOrderData.retentionPercent}%` },
        { label: 'Defect Liability', value: `${workOrderData.defectLiabilityMonths} Months` },
      ];
      tableData = {
        headers: ['SL', 'Work Description', 'Est. Qty', 'Unit', 'Rate (৳)', 'Amount (৳)'],
        rows: workOrderData.items.map((it) => [it.sl, it.itemDescription, it.qty, it.unit, `৳ ${it.rate}`, `৳ ${it.amount}`]),
      };
      clausesOrNotes = [
        'Workmanship must strictly conform to BNBC-2020 Part 6 and ACI 318.',
        `${workOrderData.retentionPercent}% retention security deducted from all RA bills and held for ${workOrderData.defectLiabilityMonths} months.`,
      ];
    } else if (docType === 'ra-bill-forwarding') {
      docTypeTitle = `Interim RA Bill Forwarding Letter (${raBillLetterData.billNo})`;
      docTypeTitleBn = `চলতি হিসাব (RA) বিল যাচাই ও অর্থ প্রদান সুপারিশ পত্র`;
      summaryText = raBillLetterData.recommendationNote;
      keyFields = [
        { label: 'Bill Reference', value: raBillLetterData.billNo },
        { label: 'Measurement Period', value: raBillLetterData.measurementPeriod },
        { label: 'Gross Certified', value: `৳ ${raBillLetterData.grossAmountCertified}` },
        { label: 'Net Payable Disbursement', value: `৳ ${raBillLetterData.netRecommendedPayable}`, highlight: true },
        { label: 'Retention Holding', value: `- ৳ ${raBillLetterData.retentionAmount}` },
      ];
      tableData = {
        headers: ['Breakdown Item', 'Amount (৳)', 'Status'],
        rows: [
          ['Gross Certified Work Value', `৳ ${raBillLetterData.grossAmountCertified}`, 'Verified in MB'],
          ['Less: Security Retention (10%)', `- ৳ ${raBillLetterData.retentionAmount}`, 'Withheld'],
          ['Less: Advance Recovery', `- ৳ ${raBillLetterData.advanceMobilizationRecovery}`, 'Recovered'],
          ['Less: Tax / AIT / VAT', `- ৳ ${raBillLetterData.aitTaxDeduction}`, 'Statutory Deduction'],
          ['Net Recommended Payable', `৳ ${raBillLetterData.netRecommendedPayable}`, 'CERTIFIED FOR PAYMENT'],
        ],
      };
      clausesOrNotes = [
        'Joint physical measurements verified in Measurement Book (MB) pages against approved drawings.',
        'Concrete cube test 28-day crushing strengths verified compliant with design specifications.',
      ];
    } else if (docType === 'site-instruction-ncr') {
      docTypeTitle = `Site Non-Conformance Notice (NCR: ${ncrData.ncrNo})`;
      docTypeTitleBn = `সাইট নন-কনফরম্যান্স নোটিশ (NCR) ও সংশোধন নির্দেশ`;
      summaryText = ncrData.defectDescription;
      keyFields = [
        { label: 'NCR Notice No', value: ncrData.ncrNo },
        { label: 'Severity Level', value: ncrData.severity, highlight: true },
        { label: 'Location / Grid', value: ncrData.locationGrid },
        { label: 'Governing Standard', value: ncrData.governingCode },
        { label: 'Rectification Window', value: `${ncrData.targetRectificationDays} Days` },
        { label: 'Follow-up Inspection', value: ncrData.followUpInspectionDate },
      ];
      tableData = {
        headers: ['Parameter', 'Details / Directives'],
        rows: [
          ['Observed Non-Conformance', ncrData.defectDescription],
          ['Mandatory Remediation Method', ncrData.rectificationActionRequired],
          ['Governing Technical Standard', ncrData.governingCode],
          ['Target Completion Deadline', `${ncrData.targetRectificationDays} Days (${ncrData.followUpInspectionDate})`],
        ],
      };
      clausesOrNotes = [
        'Subsequent concrete placement or covering works remain suspended until this NCR is formally inspected and closed by the Resident Engineer.',
      ];
    } else if (docType === 'completion-certificate') {
      docTypeTitle = `Substantial Completion & Handover Certificate (${handoverData.certNo})`;
      docTypeTitleBn = `প্রকল্প সমাপনী ও আনুষ্ঠানিক হস্তান্তর প্রত্যয়ন`;
      summaryText = handoverData.declaration;
      keyFields = [
        { label: 'Certificate Ref', value: handoverData.certNo },
        { label: 'Contract Reference', value: handoverData.contractRef },
        { label: 'Actual Completion', value: handoverData.actualCompletionDate, highlight: true },
        { label: 'Final Contract Value', value: `৳ ${handoverData.finalContractValue}` },
        { label: 'Defect Liability Expiration', value: handoverData.defectsLiabilityEndDate },
      ];
      tableData = {
        headers: ['Project Milestone', 'Contract Specification'],
        rows: [
          ['Scope of Infrastructure', handoverData.scopeCompleted],
          ['Scheduled Completion', handoverData.scheduledCompletionDate],
          ['Actual Substantial Completion', handoverData.actualCompletionDate],
          ['Final Certified Contract Value', `৳ ${handoverData.finalContractValue}`],
          ['Warranty & Defect Liability Expiry', handoverData.defectsLiabilityEndDate],
        ],
      };
      clausesOrNotes = [
        'All structural, architectural, MEP, and life-safety systems have been commissioned and tested.',
        '12-month defect liability period initiated as of the certified substantial completion date.',
      ];
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bdcivillab.app';
    const record: VerifiedOfficeDocRecord = {
      docId,
      docType,
      docTypeTitle,
      docTypeTitleBn,
      memoNo: docMeta.memoNo,
      issueDate: docMeta.date,
      projectName: docMeta.projectName,
      projectCode: docMeta.projectCode,
      siteLocation: docMeta.siteLocation,
      organization: docMeta.organization,
      clientName: docMeta.clientName,
      contractorName: docMeta.contractorName,
      engineerName: docMeta.engineerName,
      engineerTitle: docMeta.engineerTitle,
      licenseNo: docMeta.licenseNo,
      verificationHash: hash,
      issuedAt: new Date().toISOString(),
      verificationUrl: '',
      language,
      summaryText,
      keyFields,
      tableData,
      clausesOrNotes,
      signatories: [
        {
          role: 'Prepared by Resident Engineer',
          name: docMeta.engineerName,
          title: docMeta.engineerTitle,
          license: docMeta.licenseNo,
          verifiedStatus: 'CERTIFIED & AUTHENTIC',
        },
        {
          role: 'Checked by Project Manager / Consultant',
          name: 'Lead Consultant, PE',
          title: docMeta.consultantOrg,
          license: 'IEB F-14290 (Verified)',
          verifiedStatus: 'VERIFIED',
        },
        {
          role: 'Accepted by Contractor / Recipient',
          name: 'Authorized Signatory',
          title: docMeta.contractorName,
          verifiedStatus: 'ACKNOWLEDGED',
        },
      ],
    };

    record.verificationUrl = buildOfficeDocVerificationUrl(record, origin);
    return record;
  };

  const handleOpenVerificationPortal = () => {
    const rec = buildCurrentVerifiedRecord();
    saveVerifiedOfficeDoc(rec);
    setActiveVerifiedDoc(rec);
    setVerificationModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation Strip */}
      <div className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)]">
                  SM-10
                </span>
                <span className="text-xs font-sans text-[var(--md-sys-color-on-surface-variant)]">
                  Official Office Documents & Letters
                </span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-[var(--md-sys-color-on-surface)] tracking-tight">
                {language === 'bn' ? 'অফিসিয়াল চিঠি, চালান ও কার্যাদেশ জেনারেটর' : 'Official Engineering Letters & Contracts'}
              </h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-sans">
                {language === 'bn'
                  ? 'প্রজেক্ট ও ইঞ্জিনিয়ার প্রোফাইল ডেটা স্বয়ংক্রিয়ভাবে সংযুক্ত করে এ৪ প্রিন্ট ও পিডিএফ উপযোগী ফরম্যাট।'
                  : 'Bilingual legal/contractual office documentation pre-filled with project & engineering credentials.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Language Toggle Button */}
            <button
              type="button"
              onClick={() => setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'))}
              className="px-4 py-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer transition-all"
            >
              <Languages className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>{language === 'en' ? 'বাংলা সংস্করণ (Bengali)' : 'English Version'}</span>
            </button>

            {/* Dedicated Verification Portal Link Button */}
            <button
              type="button"
              onClick={handleOpenVerificationPortal}
              className="px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all hover:scale-[1.02]"
              title="Generate a unique public-facing verification URL and QR code for external stakeholders"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Verification Portal Link</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold inline-flex items-center gap-1.5 shadow-md hover:opacity-90 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Document (PDF)</span>
            </button>
          </div>
        </div>

        {/* Document Template Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-6 pt-5 border-t border-[var(--md-sys-color-outline-variant)]">
          {[
            {
              id: 'gate-pass' as const,
              titleEn: 'Gate Pass & Challan',
              titleBn: 'গেট পাস ও চালান',
              icon: Truck,
              desc: 'Material dispatch & returnable pass',
            },
            {
              id: 'work-order' as const,
              titleEn: 'Sub-Contractor Work Order',
              titleBn: 'সাব-কন্ট্রাক্টর কার্যাদেশ',
              icon: Briefcase,
              desc: 'Trade contract & scope terms',
            },
            {
              id: 'ra-bill-forwarding' as const,
              titleEn: 'RA Bill Forwarding Letter',
              titleBn: 'চলতি বিল প্রেরণ পত্র',
              icon: FileSpreadsheet,
              desc: 'Joint measurement endorsement',
            },
            {
              id: 'site-instruction-ncr' as const,
              titleEn: 'Site Instruction / NCR',
              titleBn: 'সাইট নির্দেশ / NCR',
              icon: AlertTriangle,
              desc: 'Defect rectification notice',
            },
            {
              id: 'completion-certificate' as const,
              titleEn: 'Completion & Handover',
              titleBn: 'হস্তান্তর ও সমাপনী সনদ',
              icon: Award,
              desc: 'Final substantial completion',
            },
          ].map((tab) => {
            const isSelected = docType === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDocType(tab.id)}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isSelected
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/10 shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)]/60 bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-on-surface-variant)]'
                    }`}
                  />
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-primary)]" />
                  )}
                </div>
                <div className="mt-2">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isSelected ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    {language === 'bn' ? tab.titleBn : tab.titleEn}
                  </div>
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: Left Parameters Editor + Right Authentic A4 Document View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Customization Form (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-5 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
            <h3 className="text-sm font-bold font-sans text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <span>{language === 'bn' ? 'তথ্য ও প্যারামিটার এডিটর' : 'Letter Data & Parameters'}</span>
            </h3>
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              {docMeta.projectCode}
            </span>
          </div>

          {/* General Metadata Inputs */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider block">
              1. Document Reference
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Memo / Ref No
                </label>
                <input
                  type="text"
                  value={docMeta.memoNo}
                  onChange={(e) => setDocMeta({ ...docMeta, memoNo: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={docMeta.date}
                  onChange={(e) => setDocMeta({ ...docMeta, date: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Issuing Engineering Org / Company
              </label>
              <input
                type="text"
                value={docMeta.organization}
                onChange={(e) => setDocMeta({ ...docMeta, organization: e.target.value })}
                className="w-full px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={docMeta.projectName}
                onChange={(e) => setDocMeta({ ...docMeta, projectName: e.target.value })}
                className="w-full px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Site Location
              </label>
              <input
                type="text"
                value={docMeta.siteLocation}
                onChange={(e) => setDocMeta({ ...docMeta, siteLocation: e.target.value })}
                className="w-full px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
              />
            </div>
          </div>

          {/* TEMPLATE-SPECIFIC EDITORS */}
          {docType === 'gate-pass' && (
            <div className="space-y-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[11px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider block">
                2. Gate Pass Logistics
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Pass Category
                  </label>
                  <select
                    value={gatePassData.passType}
                    onChange={(e) =>
                      setGatePassData({ ...gatePassData, passType: e.target.value as any })
                    }
                    className="w-full px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  >
                    <option value="Returnable">Returnable (ফেরতযোগ্য)</option>
                    <option value="Non-Returnable">Non-Returnable (অফেরতযোগ্য)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Vehicle Registration No
                  </label>
                  <input
                    type="text"
                    value={gatePassData.vehicleNo}
                    onChange={(e) => setGatePassData({ ...gatePassData, vehicleNo: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Driver / Carrier Name
                  </label>
                  <input
                    type="text"
                    value={gatePassData.driverName}
                    onChange={(e) => setGatePassData({ ...gatePassData, driverName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    value={gatePassData.driverPhone}
                    onChange={(e) => setGatePassData({ ...gatePassData, driverPhone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Destination / Delivery Point
                </label>
                <input
                  type="text"
                  value={gatePassData.destination}
                  onChange={(e) => setGatePassData({ ...gatePassData, destination: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                    Materials List ({gatePassData.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddGatePassItem}
                    className="text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {gatePassData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] font-bold">#{item.sl}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGatePassItem(idx)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Material description..."
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...gatePassData.items];
                          updated[idx].description = e.target.value;
                          setGatePassData({ ...gatePassData, items: updated });
                        }}
                        className="w-full px-2 py-1 rounded-md text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          placeholder="Qty (e.g. 100)"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...gatePassData.items];
                            updated[idx].quantity = e.target.value;
                            setGatePassData({ ...gatePassData, items: updated });
                          }}
                          className="w-full px-2 py-1 rounded-md text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                        <input
                          type="text"
                          placeholder="Unit (Pcs/Nos/CFT)"
                          value={item.unit}
                          onChange={(e) => {
                            const updated = [...gatePassData.items];
                            updated[idx].unit = e.target.value;
                            setGatePassData({ ...gatePassData, items: updated });
                          }}
                          className="w-full px-2 py-1 rounded-md text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {docType === 'work-order' && (
            <div className="space-y-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[11px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider block">
                2. Contract & Financial Terms
              </span>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Sub-Contractor Firm Name
                </label>
                <input
                  type="text"
                  value={docMeta.contractorName}
                  onChange={(e) => setDocMeta({ ...docMeta, contractorName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Work Trade / Package
                </label>
                <input
                  type="text"
                  value={workOrderData.trade}
                  onChange={(e) => setWorkOrderData({ ...workOrderData, trade: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Commence Date
                  </label>
                  <input
                    type="date"
                    value={workOrderData.commencementDate}
                    onChange={(e) =>
                      setWorkOrderData({ ...workOrderData, commencementDate: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Completion Target
                  </label>
                  <input
                    type="date"
                    value={workOrderData.completionTargetDate}
                    onChange={(e) =>
                      setWorkOrderData({ ...workOrderData, completionTargetDate: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Security Retention (%)
                  </label>
                  <input
                    type="number"
                    value={workOrderData.retentionPercent}
                    onChange={(e) =>
                      setWorkOrderData({ ...workOrderData, retentionPercent: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Defect Liability (Months)
                  </label>
                  <input
                    type="number"
                    value={workOrderData.defectLiabilityMonths}
                    onChange={(e) =>
                      setWorkOrderData({ ...workOrderData, defectLiabilityMonths: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                    Schedule of Rates / Items ({workOrderData.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddWorkOrderItem}
                    className="text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {workOrderData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold">Item {item.sl}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkOrderItem(idx)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Item description..."
                        value={item.itemDescription}
                        onChange={(e) => {
                          const updated = [...workOrderData.items];
                          updated[idx].itemDescription = e.target.value;
                          setWorkOrderData({ ...workOrderData, items: updated });
                        }}
                        className="w-full px-2 py-1 rounded-md text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                      />
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="text"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...workOrderData.items];
                            updated[idx].qty = e.target.value;
                            setWorkOrderData({ ...workOrderData, items: updated });
                          }}
                          className="px-2 py-1 rounded-md text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => {
                            const updated = [...workOrderData.items];
                            updated[idx].unit = e.target.value;
                            setWorkOrderData({ ...workOrderData, items: updated });
                          }}
                          className="px-2 py-1 rounded-md text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                        <input
                          type="text"
                          placeholder="Rate (৳)"
                          value={item.rate}
                          onChange={(e) => {
                            const updated = [...workOrderData.items];
                            updated[idx].rate = e.target.value;
                            setWorkOrderData({ ...workOrderData, items: updated });
                          }}
                          className="px-2 py-1 rounded-md text-xs font-mono font-bold border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {docType === 'ra-bill-forwarding' && (
            <div className="space-y-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[11px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider block">
                2. Interim Payment Certification
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Bill Reference / No
                  </label>
                  <input
                    type="text"
                    value={raBillLetterData.billNo}
                    onChange={(e) =>
                      setRaBillLetterData({ ...raBillLetterData, billNo: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Measurement Period
                  </label>
                  <input
                    type="text"
                    value={raBillLetterData.measurementPeriod}
                    onChange={(e) =>
                      setRaBillLetterData({ ...raBillLetterData, measurementPeriod: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Gross Certified (৳)
                  </label>
                  <input
                    type="text"
                    value={raBillLetterData.grossAmountCertified}
                    onChange={(e) =>
                      setRaBillLetterData({ ...raBillLetterData, grossAmountCertified: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono font-bold border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Net Recommended (৳)
                  </label>
                  <input
                    type="text"
                    value={raBillLetterData.netRecommendedPayable}
                    onChange={(e) =>
                      setRaBillLetterData({ ...raBillLetterData, netRecommendedPayable: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Engineer&apos;s Certification Remark
                </label>
                <textarea
                  rows={3}
                  value={raBillLetterData.recommendationNote}
                  onChange={(e) =>
                    setRaBillLetterData({ ...raBillLetterData, recommendationNote: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {docType === 'site-instruction-ncr' && (
            <div className="space-y-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[11px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider block">
                2. Non-Conformance Notice (NCR)
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    NCR Notice No
                  </label>
                  <input
                    type="text"
                    value={ncrData.ncrNo}
                    onChange={(e) => setNcrData({ ...ncrData, ncrNo: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Severity Level
                  </label>
                  <select
                    value={ncrData.severity}
                    onChange={(e) => setNcrData({ ...ncrData, severity: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  >
                    <option value="Minor">Minor (Non-structural)</option>
                    <option value="Major">Major (Structural Remediation)</option>
                    <option value="Critical / Safety Hazard">Critical / Immediate Stop Work</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Grid / Structural Element Location
                </label>
                <input
                  type="text"
                  value={ncrData.locationGrid}
                  onChange={(e) => setNcrData({ ...ncrData, locationGrid: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Governing Building Code Reference
                </label>
                <input
                  type="text"
                  value={ncrData.governingCode}
                  onChange={(e) => setNcrData({ ...ncrData, governingCode: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Observed Non-Conformance / Defect
                </label>
                <textarea
                  rows={2}
                  value={ncrData.defectDescription}
                  onChange={(e) => setNcrData({ ...ncrData, defectDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Mandatory Rectification Method
                </label>
                <textarea
                  rows={2}
                  value={ncrData.rectificationActionRequired}
                  onChange={(e) =>
                    setNcrData({ ...ncrData, rectificationActionRequired: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {docType === 'completion-certificate' && (
            <div className="space-y-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[11px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider block">
                2. Project Completion & Handover
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Certificate Serial No
                  </label>
                  <input
                    type="text"
                    value={handoverData.certNo}
                    onChange={(e) => setHandoverData({ ...handoverData, certNo: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                    Actual Completion Date
                  </label>
                  <input
                    type="date"
                    value={handoverData.actualCompletionDate}
                    onChange={(e) =>
                      setHandoverData({ ...handoverData, actualCompletionDate: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Final Certified Project Value (৳)
                </label>
                <input
                  type="text"
                  value={handoverData.finalContractValue}
                  onChange={(e) =>
                    setHandoverData({ ...handoverData, finalContractValue: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-full text-xs font-mono font-bold border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Defects Liability Expiration Date
                </label>
                <input
                  type="date"
                  value={handoverData.defectsLiabilityEndDate}
                  onChange={(e) =>
                    setHandoverData({ ...handoverData, defectsLiabilityEndDate: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Signatory Details (Pre-filled from Profile) */}
          <div className="space-y-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
            <span className="text-[11px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider block">
              3. Authorizing Signatory
            </span>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Engineer of Record / Signatory
              </label>
              <input
                type="text"
                value={docMeta.engineerName}
                onChange={(e) => setDocMeta({ ...docMeta, engineerName: e.target.value })}
                className="w-full px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={docMeta.engineerTitle}
                  onChange={(e) => setDocMeta({ ...docMeta, engineerTitle: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-full text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  License / Registration
                </label>
                <input
                  type="text"
                  value={docMeta.licenseNo}
                  onChange={(e) => setDocMeta({ ...docMeta, licenseNo: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Official A4 Document Sheet (8 Cols) */}
        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-4 sm:p-8 shadow-md">
            {/* Authentic Printable Document Canvas */}
            <div
              id="printable-office-document"
              className={`bg-white text-zinc-900 p-8 sm:p-12 rounded-xl shadow-lg border border-zinc-200 max-w-[850px] mx-auto print:m-0 print:p-0 print:border-none print:shadow-none printable-document ${
                language === 'bn' ? 'font-nikosh' : 'font-serif'
              }`}
              lang={language === 'bn' ? 'bn' : 'en'}
              style={{ minHeight: '1050px' }}
            >
              {/* LETTERHEAD HEADER */}
              <div className="border-b-2 border-zinc-900 pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 font-serif uppercase">
                      {docMeta.organization}
                    </h1>
                    <div className="text-xs text-zinc-600 font-sans mt-0.5">
                      Civil, Structural & Architectural Project Management Division
                    </div>
                    <div className="text-[11px] text-zinc-500 font-sans mt-0.5 flex items-center gap-2">
                      <span>Site: {docMeta.siteLocation}</span>
                      <span>•</span>
                      <span>Email: {userProfile?.email || 'site.engr@civillab.local'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 rounded-sm border border-zinc-900 font-mono text-[10px] font-bold uppercase tracking-wider bg-zinc-50">
                      OFFICIAL COPY
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">
                      ISO 9001:2015 Compliant
                    </div>
                  </div>
                </div>
              </div>

              {/* DOCUMENT METADATA STRIP */}
              <div className="flex justify-between items-center text-xs font-mono border-b border-zinc-200 pb-3 mb-6 text-zinc-700">
                <div>
                  <span className="font-semibold text-zinc-900">
                    {language === 'bn' ? 'স্মারক নং / Ref:' : 'Ref / Memo No:'}
                  </span>{' '}
                  <span className="font-bold text-zinc-950">{docMeta.memoNo}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-900">
                    {language === 'bn' ? 'তারিখ:' : 'Date:'}
                  </span>{' '}
                  <span className="font-bold text-zinc-950">{todayFormatted}</span>
                </div>
              </div>

              {/* PROJECT INFO BANNER */}
              <div className="p-3 bg-zinc-50 border border-zinc-300 rounded-md mb-6 text-xs font-sans grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                    {language === 'bn' ? 'প্রকল্পের নাম' : 'Project Title'}
                  </span>
                  <span className="font-bold text-zinc-900">{docMeta.projectName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                    {language === 'bn' ? 'প্রকল্প কোড' : 'Project Code'}
                  </span>
                  <span className="font-mono font-bold text-zinc-900">{docMeta.projectCode}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                    {language === 'bn' ? 'সাইট অবস্থান' : 'Site Location'}
                  </span>
                  <span className="text-zinc-800 truncate block">{docMeta.siteLocation}</span>
                </div>
              </div>

              {/* ============================================================== */}
              {/* 1. MATERIAL GATE PASS & DELIVERY CHALLAN PREVIEW */}
              {/* ============================================================== */}
              {docType === 'gate-pass' && (
                <div className="space-y-5">
                  <div className="text-center my-4">
                    <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-zinc-950 border-b-2 border-zinc-900 inline-block pb-1">
                      {language === 'bn'
                        ? `ম্যাটেরিয়াল গেট পাস ও ডেলিভারি চালান (${gatePassData.passType === 'Returnable' ? 'ফেরতযোগ্য' : 'অফেরতযোগ্য'})`
                        : `MATERIAL GATE PASS & DELIVERY CHALLAN (${gatePassData.passType.toUpperCase()})`}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-sans bg-zinc-50/70 p-3 rounded border border-zinc-200">
                    <div>
                      <div>
                        <b>Carrier / Driver:</b> {gatePassData.driverName} ({gatePassData.driverPhone})
                      </div>
                      <div className="mt-1">
                        <b>Vehicle Reg No:</b> <span className="font-mono font-bold">{gatePassData.vehicleNo}</span>
                      </div>
                    </div>
                    <div>
                      <div>
                        <b>Destination:</b> {gatePassData.destination}
                      </div>
                      <div className="mt-1">
                        <b>Dispatch Purpose:</b> {gatePassData.purpose}
                      </div>
                    </div>
                  </div>

                  {/* Materials Table */}
                  <table className="w-full text-left border-collapse border border-zinc-300 text-xs font-sans mt-3">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-900">
                        <th className="p-2 border-r border-zinc-300 w-12 text-center">SL</th>
                        <th className="p-2 border-r border-zinc-300">
                          {language === 'bn' ? 'মালের বিবরণ (Description)' : 'Item Description & Specification'}
                        </th>
                        <th className="p-2 border-r border-zinc-300 text-center w-20">
                          {language === 'bn' ? 'পরিমাণ' : 'Qty'}
                        </th>
                        <th className="p-2 border-r border-zinc-300 text-center w-16">
                          {language === 'bn' ? 'একক' : 'Unit'}
                        </th>
                        <th className="p-2">
                          {language === 'bn' ? 'মন্তব্য ও অবস্থা' : 'Purpose / Condition'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {gatePassData.items.map((item) => (
                        <tr key={item.sl} className="hover:bg-zinc-50">
                          <td className="p-2 border-r border-zinc-300 text-center font-mono font-bold">
                            {item.sl}
                          </td>
                          <td className="p-2 border-r border-zinc-300 font-semibold text-zinc-900">
                            {item.description || 'General Site Equipment/Material'}
                          </td>
                          <td className="p-2 border-r border-zinc-300 text-center font-mono font-bold">
                            {item.quantity}
                          </td>
                          <td className="p-2 border-r border-zinc-300 text-center font-mono">
                            {item.unit}
                          </td>
                          <td className="p-2 text-zinc-700">
                            {item.remarks || item.purposeOrDestination}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-[11px] text-amber-900 font-sans leading-relaxed">
                    <b>Security Gate Instructions:</b> This pass must be verified by the Security Guard on-duty before departure. If marked &quot;Returnable&quot;, the carrier must return the exact materials within 7 working days, failing which replacement deductions will be levied on the sub-contractor ledger.
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 2. SUB-CONTRACTOR WORK ORDER PREVIEW */}
              {/* ============================================================== */}
              {docType === 'work-order' && (
                <div className="space-y-4">
                  <div className="text-center my-3">
                    <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-zinc-950 border-b-2 border-zinc-900 inline-block pb-1">
                      {language === 'bn'
                        ? 'উপ-ঠিকাদারি কার্যাদেশ ও চুক্তিপত্র'
                        : 'SUB-CONTRACTOR WORK ORDER & SERVICE CONTRACT'}
                    </h2>
                    <div className="text-xs font-mono text-zinc-600 mt-1">
                      Work Order No: {workOrderData.workOrderNo}
                    </div>
                  </div>

                  <div className="text-xs font-sans leading-relaxed text-zinc-800 space-y-2">
                    <p>
                      <b>To:</b> <span className="font-bold text-zinc-950">{docMeta.contractorName}</span>
                    </p>
                    <p>
                      <b>Subject:</b>{' '}
                      <span className="font-bold underline">
                        {language === 'bn'
                          ? `কার্যাদেশ: ${workOrderData.trade} কাজ সম্পাদন প্রসঙ্গে`
                          : `Award of Work Order for ${workOrderData.trade}`}
                      </span>
                    </p>
                    <p>
                      Dear Sir, with reference to your quotation and subsequent rate negotiations, we are pleased to award you this Work Order for the execution of civil engineering works at <b>{docMeta.projectName}</b> under the terms and schedule of rates detailed below:
                    </p>
                  </div>

                  {/* Schedule of Rates Table */}
                  <table className="w-full text-left border-collapse border border-zinc-300 text-xs font-sans mt-2">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-900">
                        <th className="p-2 border-r border-zinc-300 w-10 text-center">SL</th>
                        <th className="p-2 border-r border-zinc-300">Description of Civil Work</th>
                        <th className="p-2 border-r border-zinc-300 text-right w-20">Est. Qty</th>
                        <th className="p-2 border-r border-zinc-300 text-center w-16">Unit</th>
                        <th className="p-2 border-r border-zinc-300 text-right w-24">Rate (৳)</th>
                        <th className="p-2 text-right w-28">Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {workOrderData.items.map((item) => (
                        <tr key={item.sl} className="hover:bg-zinc-50">
                          <td className="p-2 border-r border-zinc-300 text-center font-mono font-bold">
                            {item.sl}
                          </td>
                          <td className="p-2 border-r border-zinc-300 font-medium text-zinc-900">
                            {item.itemDescription || 'RCC structural civil work'}
                          </td>
                          <td className="p-2 border-r border-zinc-300 text-right font-mono">
                            {item.qty}
                          </td>
                          <td className="p-2 border-r border-zinc-300 text-center font-mono">
                            {item.unit}
                          </td>
                          <td className="p-2 border-r border-zinc-300 text-right font-mono font-semibold">
                            ৳ {item.rate}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-zinc-950">
                            ৳ {item.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Contract Clauses */}
                  <div className="bg-zinc-50 p-3 rounded border border-zinc-200 text-[11px] font-sans space-y-1.5 text-zinc-700">
                    <div className="font-bold text-zinc-900 text-xs uppercase">Key Contract Terms:</div>
                    <div>1. <b>Commencement:</b> Work shall commence on {workOrderData.commencementDate} and achieve substantial completion by {workOrderData.completionTargetDate}.</div>
                    <div>2. <b>Security Retention:</b> {workOrderData.retentionPercent}% shall be deducted from every running account (RA) bill and released upon expiration of the {workOrderData.defectLiabilityMonths}-month defect liability period.</div>
                    <div>3. <b>Quality Standard:</b> All materials, clear cover blocks, compaction, and curing shall strictly comply with BNBC-2020 Part 6 and ACI 318 standards.</div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 3. JOINT MEASUREMENT & RA BILL FORWARDING LETTER PREVIEW */}
              {/* ============================================================== */}
              {docType === 'ra-bill-forwarding' && (
                <div className="space-y-4">
                  <div className="text-center my-3">
                    <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-zinc-950 border-b-2 border-zinc-900 inline-block pb-1">
                      {language === 'bn'
                        ? 'চলতি হিসাব (RA) বিল যাচাই ও অর্থ প্রদান সুপারিশ পত্র'
                        : 'INTERIM RUNNING ACCOUNT (RA) BILL FORWARDING & CERTIFICATION'}
                    </h2>
                  </div>

                  <div className="text-xs font-sans leading-relaxed text-zinc-800 space-y-2">
                    <p>
                      <b>To:</b> Project Director / Finance Department, {docMeta.organization}
                    </p>
                    <p>
                      <b>Subject:</b>{' '}
                      <span className="font-bold underline">
                        {language === 'bn'
                          ? `যৌথ পরিমাপ সাপেক্ষে ${raBillLetterData.billNo} বিলের অর্থ পরিশোধের সুপারিশ`
                          : `Verification & Recommendation for Payment of ${raBillLetterData.billNo}`}
                      </span>
                    </p>
                    <p>
                      Dear Sir, the joint physical measurement for civil and structural works executed by <b>{docMeta.contractorName}</b> for the period <b>{raBillLetterData.measurementPeriod}</b> has been conducted at site. The measurements have been checked and verified against recorded levels in Measurement Book (MB).
                    </p>
                  </div>

                  {/* Financial Certification Summary */}
                  <div className="border border-zinc-300 rounded overflow-hidden text-xs font-sans">
                    <div className="bg-zinc-100 p-2.5 font-bold text-zinc-900 border-b border-zinc-300 flex justify-between">
                      <span>Payment Certification Breakdown</span>
                      <span className="font-mono">Bill Ref: {raBillLetterData.billNo}</span>
                    </div>
                    <div className="divide-y divide-zinc-200">
                      <div className="p-2.5 flex justify-between">
                        <span>Total Gross Value of Work Executed this Period</span>
                        <span className="font-mono font-bold text-zinc-900">৳ {raBillLetterData.grossAmountCertified}</span>
                      </div>
                      <div className="p-2.5 flex justify-between text-amber-800">
                        <span>Less: Security Retention Holding (10%)</span>
                        <span className="font-mono font-semibold">- ৳ {raBillLetterData.retentionAmount}</span>
                      </div>
                      <div className="p-2.5 flex justify-between text-rose-800">
                        <span>Less: Advance Mobilization Recovery</span>
                        <span className="font-mono font-semibold">- ৳ {raBillLetterData.advanceMobilizationRecovery}</span>
                      </div>
                      <div className="p-2.5 flex justify-between text-rose-800">
                        <span>Less: Advance Income Tax (AIT / VAT)</span>
                        <span className="font-mono font-semibold">- ৳ {raBillLetterData.aitTaxDeduction}</span>
                      </div>
                      <div className="p-3 bg-emerald-50/80 flex justify-between items-center text-emerald-950 font-bold border-t-2 border-emerald-600">
                        <span className="text-sm">NET AMOUNT RECOMMENDED FOR DISBURSEMENT</span>
                        <span className="text-base font-mono">৳ {raBillLetterData.netRecommendedPayable}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-sans leading-relaxed text-zinc-700 italic bg-zinc-50 p-3 rounded border border-zinc-200">
                    &quot;{raBillLetterData.recommendationNote}&quot;
                  </p>
                </div>
              )}

              {/* ============================================================== */}
              {/* 4. SITE INSTRUCTION / NON-CONFORMANCE NOTICE (NCR) PREVIEW */}
              {/* ============================================================== */}
              {docType === 'site-instruction-ncr' && (
                <div className="space-y-4">
                  <div className="text-center my-3">
                    <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-rose-900 border-b-2 border-rose-900 inline-block pb-1">
                      {language === 'bn'
                        ? 'সাইট নন-কনফরম্যান্স নোটিশ (NCR) ও সংশোধন নির্দেশ'
                        : 'SITE NON-CONFORMANCE NOTICE (NCR) & RECTIFICATION DIRECTIVE'}
                    </h2>
                    <div className="text-xs font-mono text-zinc-600 mt-1">
                      NCR Reference: {ncrData.ncrNo} • Severity: <span className="font-bold text-rose-600">{ncrData.severity}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-sans bg-rose-50/50 p-3 rounded border border-rose-200">
                    <div>
                      <div><b>Issued To:</b> {docMeta.contractorName}</div>
                      <div className="mt-1"><b>Location / Grid:</b> <span className="font-mono font-bold">{ncrData.locationGrid}</span></div>
                    </div>
                    <div>
                      <div><b>Standard Violated:</b> <span className="font-mono text-[11px]">{ncrData.governingCode}</span></div>
                      <div className="mt-1"><b>Rectification Window:</b> <span className="font-bold text-rose-700">{ncrData.targetRectificationDays} Working Days</span></div>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs font-sans">
                    <div className="p-3 border border-zinc-300 rounded">
                      <div className="font-bold text-zinc-900 uppercase text-[10px] mb-1">
                        1. Observed Non-Conformance / Quality Violation:
                      </div>
                      <p className="leading-relaxed text-zinc-800">{ncrData.defectDescription}</p>
                    </div>

                    <div className="p-3 border border-emerald-300 bg-emerald-50/40 rounded">
                      <div className="font-bold text-emerald-950 uppercase text-[10px] mb-1">
                        2. Required Rectification Methodology (BNBC / ACI Compliant):
                      </div>
                      <p className="leading-relaxed text-zinc-800">{ncrData.rectificationActionRequired}</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-zinc-100 rounded text-[11px] text-zinc-700 font-sans leading-tight">
                    <b>Contractual Note:</b> Subsequent concreting of adjacent elements remains suspended until this NCR is formally closed out and re-inspected by the Resident Project Engineer on {ncrData.followUpInspectionDate}.
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 5. PROJECT COMPLETION & HANDOVER CERTIFICATE PREVIEW */}
              {/* ============================================================== */}
              {docType === 'completion-certificate' && (
                <div className="space-y-4">
                  <div className="text-center my-4">
                    <div className="w-12 h-12 rounded-full border-2 border-zinc-900 mx-auto flex items-center justify-center mb-2">
                      <Award className="w-6 h-6 text-zinc-900" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-zinc-950 border-b-2 border-zinc-900 inline-block pb-1">
                      {language === 'bn'
                        ? 'প্রকল্প সমাপনী ও আনুষ্ঠানিক হস্তান্তর প্রত্যয়ন'
                        : 'SUBSTANTIAL COMPLETION & PROJECT HANDOVER CERTIFICATE'}
                    </h2>
                    <div className="text-xs font-mono text-zinc-600 mt-1">
                      Certificate Serial: {handoverData.certNo}
                    </div>
                  </div>

                  <div className="text-xs font-sans leading-relaxed text-zinc-800 text-justify space-y-3">
                    <p>
                      This is to certify that <b>{docMeta.contractorName}</b> has substantially completed all physical civil, structural, and finishing works under Contract Reference <b>{handoverData.contractRef}</b> for the construction of <b>{docMeta.projectName}</b> located at {docMeta.siteLocation}.
                    </p>
                    <p className="bg-zinc-50 p-3 rounded border border-zinc-200">
                      <b>Scope of Completed Infrastructure:</b> {handoverData.scopeCompleted}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-sans bg-zinc-100/60 p-3 rounded border border-zinc-300">
                    <div>
                      <div><b>Actual Completion Date:</b> <span className="font-mono font-bold">{handoverData.actualCompletionDate}</span></div>
                      <div className="mt-1"><b>Final Contract Value:</b> <span className="font-mono font-bold">৳ {handoverData.finalContractValue}</span></div>
                    </div>
                    <div>
                      <div><b>Defect Liability Period:</b> 12 Months</div>
                      <div className="mt-1"><b>Warranty End Date:</b> <span className="font-mono font-bold">{handoverData.defectsLiabilityEndDate}</span></div>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-xs font-sans italic text-zinc-700 leading-relaxed">
                    &quot;{handoverData.declaration}&quot;
                  </div>
                </div>
              )}

              {/* THREE-COLUMN SIGNATURE BLOCKS */}
              <div className="grid grid-cols-3 gap-6 pt-16 mt-8 border-t border-zinc-200 text-xs font-sans">
                {/* 1. Prepared by Site Engineer */}
                <div className="text-center">
                  <div className="border-t border-zinc-900 pt-2 font-bold text-zinc-950">
                    {docMeta.engineerName}
                  </div>
                  <div className="text-[11px] text-zinc-600">{docMeta.engineerTitle}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{docMeta.licenseNo}</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Resident Engineer / EOR</div>
                </div>

                {/* 2. Checked by Consultant / PM */}
                <div className="text-center">
                  <div className="border-t border-zinc-900 pt-2 font-bold text-zinc-950">
                    Project Manager
                  </div>
                  <div className="text-[11px] text-zinc-600">{docMeta.organization}</div>
                  <div className="text-[10px] font-mono text-zinc-500">IEB F-14290</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Consulting Engineer</div>
                </div>

                {/* 3. Accepted by Client / Contractor */}
                <div className="text-center">
                  <div className="border-t border-zinc-900 pt-2 font-bold text-zinc-950">
                    Authorized Signatory
                  </div>
                  <div className="text-[11px] text-zinc-600">{docMeta.contractorName}</div>
                  <div className="text-[10px] font-mono text-zinc-500">Managing Director / Rep</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Received & Acknowledged</div>
                </div>
              </div>

              {/* FOOTER WATERMARK */}
              <div className="text-center pt-8 mt-6 border-t border-zinc-100 text-[10px] text-zinc-400 font-sans flex justify-between items-center">
                <span>CivilLab Engineering Hub • Certified Office Document</span>
                <span>Page 1 of 1 • Generated {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Portal Link Modal */}
      <OfficeDocVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        currentDocRecord={activeVerifiedDoc}
        onOpenPublicPreview={(rec) => setPublicPortalPreviewDoc(rec)}
      />

      {/* In-App Public Portal Read-Only Preview Modal */}
      {publicPortalPreviewDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <OfficeDocPublicPortalView
            record={publicPortalPreviewDoc}
            onClose={() => setPublicPortalPreviewDoc(null)}
          />
        </div>
      )}
    </div>
  );
};
