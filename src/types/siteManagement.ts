/**
 * PB CivilLab — Site Management & Field ERP
 * Authoritative TypeScript Type Definitions
 * 
 * Covering 9 Interconnected Modules:
 * 1. Store Ledger & Inventory Management
 * 2. Material Requisitions & Inward Logistics
 * 3. Labor Muster Roll, Khoraki & Wage Ledger
 * 4. Construction Schedule, Milestones & Engineer Roster
 * 5. Digital Field Notes & Voice Memo Transcripts
 * 6. Subcontractor & Contractor RA Bill Certification
 * 7. Site Petty Cash Ledger & Imprest Register
 * 8. Concrete Pour, Cube Test & Deshuttering Log
 * 9. Daily Progress Report (DPR) Aggregator
 */

export type MaterialUnit =
  | 'Bags'
  | 'Ton'
  | 'CFT'
  | 'Nos'
  | 'Liters'
  | 'Kg'
  | 'Sq.Ft'
  | 'Rft'
  | 'Cum'
  | 'Bundle';

export type TradeCategory =
  | 'Head Mason'
  | 'Mason'
  | 'Helper/Jogali'
  | 'Bar Bender'
  | 'Carpenter'
  | 'Plumber'
  | 'Electrician'
  | 'Painter'
  | 'Custom';

export type UrgencyLevel = 'Normal' | 'Urgent' | 'Critical';

export type RequisitionStatus = 'Pending' | 'Approved' | 'Received' | 'Cancelled';

export type AttendanceStatus = 'P' | 'H' | 'OT' | 'A'; // P = 1.0 day, H = 0.5 day, OT = 1.0 day + OT hours, A = 0.0

export type FieldNoteCategory =
  | 'Client Instruction'
  | 'Architect Verbal Order'
  | 'Site Observation'
  | 'Safety/Issue'
  | 'Quality Concern';

export type PettyCashType = 'Cash Received' | 'Expense';

export type PettyCashCategory =
  | 'Labor Snacks'
  | 'Hardware/GI Wire/Nails'
  | 'Transport/Van'
  | 'Tools'
  | 'Fuel/Generator'
  | 'Printing/Stationery'
  | 'Misc';

export type ConcreteGrade =
  | 'M15'
  | 'M20'
  | 'M25'
  | 'M30'
  | 'M35'
  | 'M40'
  | 'Custom';

export type CubeTestStatus = 'Scheduled' | 'Passed' | 'Failed';

// ============================================================================
// 1. INVENTORY & STORE LEDGER
// ============================================================================

export interface InventoryItem {
  id: string;
  itemId?: string; // Ergonomic alias for id
  name: string;
  category: string;
  unit: MaterialUnit;
  currentStock: number;
  minThreshold: number;
  unitRate: number;
  theoreticalBoqQty: number;
  totalInward: number;
  totalOutward: number;
  specification?: string;
  locationRack?: string;
  notes?: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'Inward' | 'Outward';
  date: string; // YYYY-MM-DD
  quantity: number;
  unit: MaterialUnit;
  unitRate?: number;
  totalAmount?: number;
  
  // Inward Details
  challanNo?: string;
  supplier?: string;
  truckNo?: string;
  vehicleNo?: string; // Ergonomic alias for truckNo
  receiver?: string;
  gatePassNo?: string;

  // Outward Details
  floorZone?: string;
  workHead?: string;
  foreman?: string;
  issuedTo?: string;

  remarks?: string;
  timestamp: string;
}

// ============================================================================
// 2. MATERIAL REQUISITIONS
// ============================================================================

export interface RequisitionItem {
  itemId: string;
  itemName: string;
  unit: MaterialUnit;
  requestedQty: number;
  estimatedRate: number;
  currentStockAtReq: number;
  notes?: string;
}

export interface RequisitionOrder {
  id: string;
  reqId?: string; // Ergonomic alias for id
  reqNo: string;
  date: string; // YYYY-MM-DD
  requiredByDate: string; // YYYY-MM-DD
  urgency: UrgencyLevel;
  items: RequisitionItem[];
  status: RequisitionStatus;
  linkedChallanNo?: string;
  linkedInwardTransactionIds?: string[];
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  receivedAt?: string;
}

// ============================================================================
// 3. LABOR MUSTER ROLL & WAGE LEDGER
// ============================================================================

export interface LaborWorker {
  id: string;
  workerId?: string; // Ergonomic alias for id
  name: string;
  phone: string;
  trade: TradeCategory;
  customTrade?: string;
  dailyWage: number;
  overtimeRatePerHr: number;
  joiningDate: string; // YYYY-MM-DD
  isActive: boolean;
  nidPassport?: string;
  emergencyContact?: string;
}

export interface DailyAttendanceRecord {
  status: AttendanceStatus;
  overtimeHours: number;
  khoraki: number; // Advance / food deduction taken today
  wagePaid: number; // Direct cash payment given today
  notes?: string;
}

/**
 * Monthly Attendance Book mapping:
 * Key: `YYYY-MM` (e.g. "2026-11")
 *   Subkey: `workerId`
 *     Subkey: `day` (1 to 31)
 */
export type MonthlyAttendanceMap = Record<string, Record<string, Record<number, DailyAttendanceRecord>>>;
export type MonthlyAttendance = MonthlyAttendanceMap; // Ergonomic alias

export interface WorkerPaymentRecord {
  id: string;
  workerId: string;
  workerName: string;
  date: string; // YYYY-MM-DD
  type: 'Khoraki / Advance' | 'Wage Payout' | 'Final Settlement';
  amount: number;
  paymentMethod: 'Cash' | 'bKash/Mobile' | 'Bank Transfer';
  voucherRef?: string;
  remarks?: string;
  timestamp: string;
}

// ============================================================================
// 4. CONSTRUCTION SCHEDULE, MILESTONES & ROSTER
// ============================================================================

export interface MilestoneTask {
  id: string;
  taskId?: string; // Ergonomic alias for id
  title: string;
  zoneFloor: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  progress: number; // 0 to 100
  isCastingEvent: boolean;
  castingDate?: string; // YYYY-MM-DD
  autoCuringEndDate?: string; // YYYY-MM-DD
  autoDeshutteringDate?: string; // YYYY-MM-DD
  linkedCubeTestId?: string;
  status: 'Not Started' | 'In Progress' | 'Under Curing' | 'Completed';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedForeman?: string;
  notes?: string;
}

export type ProjectMilestone = MilestoneTask; // Ergonomic alias

export interface EngineerTask {
  id: string;
  title: string;
  category:
    | 'Quality Inspection'
    | 'Safety Audit'
    | 'Material Checking'
    | 'Level/Grid Verification'
    | 'Client Coordination';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo: string;
  targetDate: string; // YYYY-MM-DD
  isCompleted: boolean;
  completedAt?: string;
  remarks?: string;
}

// ============================================================================
// 5. DIGITAL FIELD NOTES & VOICE LOGS
// ============================================================================

export interface FieldNote {
  id: string;
  noteId?: string; // Ergonomic alias for id
  timestamp: string;
  date: string; // YYYY-MM-DD
  category: FieldNoteCategory;
  floorGridTag: string; // e.g. '#Grid-B3', '#Level2-Beam'
  content: string;
  voiceTranscript?: string;
  recordedBy: string;
  priority?: 'Normal' | 'High' | 'Critical';
  isResolved: boolean;
}

// ============================================================================
// 6. SUBCONTRACTOR RA BILL CERTIFICATION
// ============================================================================

export interface ContractorRABill {
  id: string;
  billId?: string; // Ergonomic alias for id
  billNo: string;
  date: string; // YYYY-MM-DD
  contractorName: string;
  workTrade: string;
  unit: string;
  contractRate: number;
  previousMeasuredQty: number;
  currentMeasuredQty: number;
  totalCumulativeQty: number;
  currentGrossAmount: number;
  totalGrossAmount: number;
  retentionPercent: number; // 0 to 100 (e.g. 10%)
  retentionAmount: number;
  advanceDeducted: number;
  advancePaid?: number; // Ergonomic alias / payment tracking
  taxVatDeducted: number;
  netPayable: number;
  paymentStatus: 'Draft' | 'Certified' | 'Paid';
  voucherNo?: string;
  remarks?: string;
}

// ============================================================================
// 7. PETTY CASH & IMPREST REGISTER
// ============================================================================

export interface PettyCashTransaction {
  id: string;
  transactionId?: string; // Ergonomic alias for id
  date: string; // YYYY-MM-DD
  type: PettyCashType;
  category: PettyCashCategory;
  amount: number;
  voucherNo: string;
  description: string;
  receiverOrSupplier?: string;
  approvedBy?: string;
  timestamp: string;
}

export type PettyCashLedger = PettyCashTransaction; // Ergonomic alias

// ============================================================================
// 8. CONCRETE POUR & CUBE TEST LOG
// ============================================================================

export interface CubeTestRecord {
  id: string;
  pourId: string;
  castingDate: string; // YYYY-MM-DD
  structuralElement: string;
  concreteGrade: ConcreteGrade;
  targetStrengthMPa: number;
  slumpMm: number;
  day7TestDate: string; // YYYY-MM-DD
  day28TestDate: string; // YYYY-MM-DD
  day7StrengthMPa?: number;
  day28StrengthMPa?: number;
  day7PassDcr?: number;
  day28PassDcr?: number;
  status: CubeTestStatus;
  labName?: string;
  remarks?: string;
  linkedMilestoneId?: string;
}

// ============================================================================
// 9. FINANCIAL ROLLUP & DAILY PROGRESS REPORT (DPR)
// ============================================================================

export interface ProjectFinancialSummary {
  totalLaborWagesGross: number;
  totalLaborKhorakiAdvance: number;
  totalLaborWagesPaid: number;
  totalLaborWageLiability: number;
  totalPettyCashInward: number;
  totalPettyCashSpent: number;
  pettyCashBalance: number;
  totalContractorGrossCertified: number;
  totalContractorRetentionHeld: number;
  totalContractorNetPaid: number;
  totalMaterialProcuredSpend: number;
  grandTotalSiteCost: number;
}

export interface DailyProgressReport {
  date: string;
  projectCode: string;
  projectName: string;
  weather: string;
  temperature?: string;
  siteCondition?: string;
  laborHeadcountByTrade: Record<string, { count: number; totalHours: number; otHours: number }>;
  totalLaborHeadcount: number;
  totalLaborCostToday: number;
  materialsReceived: Array<{
    itemName: string;
    qty: number;
    unit: string;
    challanNo?: string;
    supplier?: string;
  }>;
  materialsIssued: Array<{
    itemName: string;
    qty: number;
    unit: string;
    floorZone?: string;
    workHead?: string;
  }>;
  activeMilestones: Array<{
    title: string;
    zoneFloor: string;
    progress: number;
    status: string;
  }>;
  engineerInspections: Array<{
    title: string;
    category: string;
    priority: string;
    isCompleted: boolean;
  }>;
  pettyCashSpentToday: number;
  pettyCashTransactions: PettyCashTransaction[];
  cubeTestsDueToday: CubeTestRecord[];
  curingRemindersActive: Array<{
    element: string;
    castingDate: string;
    curingEndDate: string;
    daysLeft: number;
  }>;
  fieldNotesToday: FieldNote[];
  remarks: string;
  compiledBy: string;
  generatedAt: string;
}

// ============================================================================
// ROOT STATE STORAGE MODEL (PER PROJECT)
// ============================================================================

export interface SiteManagementData {
  version: number;
  projectId: string;
  lastModified: string;
  inventory: InventoryItem[];
  stockTransactions: StockTransaction[];
  requisitions: RequisitionOrder[];
  workers: LaborWorker[];
  attendance: MonthlyAttendanceMap;
  workerPayments: WorkerPaymentRecord[];
  milestones: MilestoneTask[];
  engineerTasks: EngineerTask[];
  fieldNotes: FieldNote[];
  raBills: ContractorRABill[];
  pettyCash: PettyCashTransaction[];
  cubeTests: CubeTestRecord[];
}
