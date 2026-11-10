import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  InventoryItem,
  StockTransaction,
  RequisitionOrder,
  RequisitionItem,
  LaborWorker,
  MonthlyAttendanceMap,
  DailyAttendanceRecord,
  WorkerPaymentRecord,
  MilestoneTask,
  EngineerTask,
  FieldNote,
  ContractorRABill,
  PettyCashTransaction,
  CubeTestRecord,
  ProjectFinancialSummary,
  DailyProgressReport,
  SiteManagementData,
  UrgencyLevel,
  ConcreteGrade,
} from '../types/siteManagement';
import { useCivilLab } from './CivilLabContext';
import { useOfflineSync } from './OfflineSyncContext';

// ============================================================================
// CONSTANTS & INITIAL DATA SCHEMAS
// ============================================================================

export const SITE_VERSION_KEY = 'bdcivillab_site_version';
export const CURRENT_SITE_VERSION = 'v3_clean';
const STORAGE_KEY_PREFIX = 'bdcivillab_site_erp_v3_clean_';
const LEGACY_STORAGE_KEY_PREFIX = 'pbcivillab_site_erp_v3_clean_';
const DEFAULT_PROJECT_ID = 'PROJ-DEFAULT-01';

/**
 * Creates empty, schema-compliant root state for a project
 */
export const createInitialSiteData = (projectId: string): SiteManagementData => ({
  version: 1,
  projectId,
  lastModified: new Date().toISOString(),
  inventory: [],
  stockTransactions: [],
  requisitions: [],
  workers: [],
  attendance: {},
  workerPayments: [],
  milestones: [],
  engineerTasks: [],
  fieldNotes: [],
  raBills: [],
  pettyCash: [],
  cubeTests: [],
});

/**
 * Pre-seeds realistic, high-fidelity sample construction site data
 */
export const createSampleSiteData = (projectId: string): SiteManagementData => {
  const today = new Date();
  const formatOffset = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const currentMonth = today.toISOString().slice(0, 7); // e.g. "2026-11"
  const todayDay = today.getDate();

  const inventory: InventoryItem[] = [
    {
      id: 'INV-CEM-01',
      name: 'Portland Composite Cement (PCC) 50kg',
      category: 'Cement',
      unit: 'Bags',
      currentStock: 45, // Below threshold -> trigger requisition!
      minThreshold: 100,
      unitRate: 580,
      theoreticalBoqQty: 2400,
      totalInward: 800,
      totalOutward: 755,
      specification: 'BDS EN 197-1 CEM II/B-M 42.5N',
      locationRack: 'Shed-A / Bay 1',
      notes: 'Strictly maintain 150mm timber pallet clearance from ground.',
      updatedAt: formatOffset(-1),
    },
    {
      id: 'INV-STL-16',
      name: '500W Deformed Rebar 16mm (Grade 72.5)',
      category: 'Steel',
      unit: 'Ton',
      currentStock: 3.4,
      minThreshold: 5.0, // Low stock!
      unitRate: 98000,
      theoreticalBoqQty: 45.0,
      totalInward: 18.0,
      totalOutward: 14.6,
      specification: 'ASTM A615 / BDS ISO 6935-2',
      locationRack: 'Open Yard Stack-B',
      updatedAt: formatOffset(-2),
    },
    {
      id: 'INV-STL-10',
      name: '500W Deformed Rebar 10mm (Ties/Stirrups)',
      category: 'Steel',
      unit: 'Ton',
      currentStock: 8.2,
      minThreshold: 4.0,
      unitRate: 99500,
      theoreticalBoqQty: 22.0,
      totalInward: 12.0,
      totalOutward: 3.8,
      specification: 'BDS ISO 6935-2',
      locationRack: 'Open Yard Stack-A',
      updatedAt: formatOffset(-3),
    },
    {
      id: 'INV-SND-01',
      name: 'Sylhet Coarse Sand (FM 2.5 - 2.8)',
      category: 'Aggregates',
      unit: 'CFT',
      currentStock: 650,
      minThreshold: 800, // Low stock!
      unitRate: 65,
      theoreticalBoqQty: 8500,
      totalInward: 3200,
      totalOutward: 2550,
      specification: 'Washed, Silt < 3%',
      locationRack: 'Stockpile 1',
      updatedAt: formatOffset(-1),
    },
    {
      id: 'INV-STN-01',
      name: 'Black Stone Chips 3/4" Down (Crushed Boulder)',
      category: 'Aggregates',
      unit: 'CFT',
      currentStock: 1400,
      minThreshold: 1000,
      unitRate: 195,
      theoreticalBoqQty: 14000,
      totalInward: 5000,
      totalOutward: 3600,
      specification: 'Los Angeles Abrasion < 24%',
      locationRack: 'Stockpile 2',
      updatedAt: formatOffset(-2),
    },
    {
      id: 'INV-BRK-01',
      name: 'Auto-Kiln First Class Clay Bricks',
      category: 'Masonry',
      unit: 'Nos',
      currentStock: 12500,
      minThreshold: 8000,
      unitRate: 13.5,
      theoreticalBoqQty: 85000,
      totalInward: 30000,
      totalOutward: 17500,
      specification: 'Crushing Strength > 15 MPa',
      locationRack: 'East Boundary Yard',
      updatedAt: formatOffset(-4),
    },
  ];

  const stockTransactions: StockTransaction[] = [
    {
      id: 'STX-IN-01',
      itemId: 'INV-CEM-01',
      itemName: 'Portland Composite Cement (PCC) 50kg',
      type: 'Inward',
      date: formatOffset(-5),
      quantity: 400,
      unit: 'Bags',
      unitRate: 580,
      totalAmount: 232000,
      challanNo: 'CH-2026-8812',
      supplier: 'Shah Cement Industries Ltd.',
      truckNo: 'DM-TA-11-4092',
      receiver: 'Engr. Prokash / Store Incharge',
      remarks: 'Delivered in sound condition. Moisture seal intact.',
      timestamp: `${formatOffset(-5)}T10:30:00Z`,
    },
    {
      id: 'STX-OUT-01',
      itemId: 'INV-CEM-01',
      itemName: 'Portland Composite Cement (PCC) 50kg',
      type: 'Outward',
      date: formatOffset(-2),
      quantity: 210,
      unit: 'Bags',
      unitRate: 580,
      totalAmount: 121800,
      floorZone: '3rd Floor Beam-Slab Pour',
      workHead: 'RCC 1:1.5:3 Concrete Casting',
      foreman: 'Master Mason Jahangir',
      remarks: 'Issued for Grid A1-D4 slab deck casting.',
      timestamp: `${formatOffset(-2)}T08:15:00Z`,
    },
    {
      id: 'STX-IN-02',
      itemId: 'INV-SND-01',
      itemName: 'Sylhet Coarse Sand (FM 2.5 - 2.8)',
      type: 'Inward',
      date: formatOffset(-3),
      quantity: 800,
      unit: 'CFT',
      unitRate: 65,
      totalAmount: 52000,
      challanNo: 'CH-SAND-402',
      supplier: 'Meghna Dredging & Transport',
      truckNo: 'DM-U-14-8821',
      receiver: 'Engr. Prokash',
      remarks: 'Fineness Modulus verified on site = 2.62.',
      timestamp: `${formatOffset(-3)}T14:45:00Z`,
    },
  ];

  const requisitions: RequisitionOrder[] = [
    {
      id: 'REQ-2026-001',
      reqNo: 'REQ-2026-001',
      date: formatOffset(-2),
      requiredByDate: formatOffset(1),
      urgency: 'Critical',
      items: [
        {
          itemId: 'INV-CEM-01',
          itemName: 'Portland Composite Cement (PCC) 50kg',
          unit: 'Bags',
          requestedQty: 300,
          estimatedRate: 580,
          currentStockAtReq: 45,
          notes: 'Required for 4th floor columns & lift wall casting.',
        },
        {
          itemId: 'INV-STL-16',
          itemName: '500W Deformed Rebar 16mm (Grade 72.5)',
          unit: 'Ton',
          requestedQty: 6.0,
          estimatedRate: 98000,
          currentStockAtReq: 3.4,
          notes: 'Column lap reinforcement cutting schedule.',
        },
      ],
      status: 'Approved',
      requestedBy: 'Site Engineer Prokash',
      approvedBy: 'Project Director',
      notes: 'Procurement order released to supplier.',
      createdAt: `${formatOffset(-2)}T09:00:00Z`,
    },
  ];

  const workers: LaborWorker[] = [
    {
      id: 'WRK-001',
      name: 'Md. Jahangir Alam',
      phone: '01711-234567',
      trade: 'Head Mason',
      dailyWage: 1100,
      overtimeRatePerHr: 160,
      joiningDate: formatOffset(-60),
      isActive: true,
      emergencyContact: '01912-345678',
    },
    {
      id: 'WRK-002',
      name: 'Rahmat Ali',
      phone: '01819-456789',
      trade: 'Mason',
      dailyWage: 900,
      overtimeRatePerHr: 130,
      joiningDate: formatOffset(-45),
      isActive: true,
    },
    {
      id: 'WRK-003',
      name: 'Sumon Mia',
      phone: '01611-987654',
      trade: 'Helper/Jogali',
      dailyWage: 650,
      overtimeRatePerHr: 90,
      joiningDate: formatOffset(-30),
      isActive: true,
    },
    {
      id: 'WRK-004',
      name: 'Kalam Bar Bender',
      phone: '01715-882211',
      trade: 'Bar Bender',
      dailyWage: 950,
      overtimeRatePerHr: 140,
      joiningDate: formatOffset(-50),
      isActive: true,
    },
    {
      id: 'WRK-005',
      name: 'Mizanur Rahman',
      phone: '01920-334455',
      trade: 'Carpenter',
      dailyWage: 950,
      overtimeRatePerHr: 140,
      joiningDate: formatOffset(-50),
      isActive: true,
    },
  ];

  // Seed attendance for current month
  const attendance: MonthlyAttendanceMap = {
    [currentMonth]: {
      'WRK-001': {
        [Math.max(1, todayDay - 2)]: { status: 'P', overtimeHours: 2, khoraki: 300, wagePaid: 0 },
        [Math.max(1, todayDay - 1)]: { status: 'P', overtimeHours: 1, khoraki: 200, wagePaid: 0 },
        [todayDay]: { status: 'P', overtimeHours: 0, khoraki: 200, wagePaid: 0 },
      },
      'WRK-002': {
        [Math.max(1, todayDay - 2)]: { status: 'P', overtimeHours: 2, khoraki: 250, wagePaid: 0 },
        [Math.max(1, todayDay - 1)]: { status: 'P', overtimeHours: 0, khoraki: 200, wagePaid: 0 },
        [todayDay]: { status: 'P', overtimeHours: 1, khoraki: 200, wagePaid: 0 },
      },
      'WRK-003': {
        [Math.max(1, todayDay - 2)]: { status: 'P', overtimeHours: 2, khoraki: 200, wagePaid: 0 },
        [Math.max(1, todayDay - 1)]: { status: 'P', overtimeHours: 2, khoraki: 150, wagePaid: 0 },
        [todayDay]: { status: 'P', overtimeHours: 0, khoraki: 150, wagePaid: 0 },
      },
      'WRK-004': {
        [Math.max(1, todayDay - 2)]: { status: 'P', overtimeHours: 3, khoraki: 250, wagePaid: 0 },
        [Math.max(1, todayDay - 1)]: { status: 'H', overtimeHours: 0, khoraki: 200, wagePaid: 0 },
        [todayDay]: { status: 'P', overtimeHours: 2, khoraki: 200, wagePaid: 0 },
      },
      'WRK-005': {
        [Math.max(1, todayDay - 2)]: { status: 'P', overtimeHours: 1, khoraki: 250, wagePaid: 0 },
        [Math.max(1, todayDay - 1)]: { status: 'P', overtimeHours: 1, khoraki: 200, wagePaid: 0 },
        [todayDay]: { status: 'P', overtimeHours: 0, khoraki: 200, wagePaid: 0 },
      },
    },
  };

  const workerPayments: WorkerPaymentRecord[] = [
    {
      id: 'PAY-01',
      workerId: 'WRK-001',
      workerName: 'Md. Jahangir Alam',
      date: formatOffset(-7),
      type: 'Wage Payout',
      amount: 6500,
      paymentMethod: 'Cash',
      voucherRef: 'V-WAGE-44',
      remarks: 'Weekly wage settlement for previous week.',
      timestamp: `${formatOffset(-7)}T18:00:00Z`,
    },
    {
      id: 'PAY-02',
      workerId: 'WRK-003',
      workerName: 'Sumon Mia',
      date: formatOffset(-7),
      type: 'Wage Payout',
      amount: 3800,
      paymentMethod: 'bKash/Mobile',
      voucherRef: 'BKASH-88291',
      remarks: 'Weekly wage settlement minus advance.',
      timestamp: `${formatOffset(-7)}T18:15:00Z`,
    },
  ];

  const milestones: MilestoneTask[] = [
    {
      id: 'MS-CAST-03',
      title: '3rd Floor Slab & Beam Casting (Grid A1-D4)',
      zoneFloor: 'Level 3 / Slab Deck',
      startDate: formatOffset(-3),
      endDate: formatOffset(18),
      progress: 65,
      isCastingEvent: true,
      castingDate: formatOffset(-3),
      autoCuringEndDate: formatOffset(11), // 14 days curing
      autoDeshutteringDate: formatOffset(18), // 21 days for soffit props
      linkedCubeTestId: 'CUBE-POUR-03',
      status: 'Under Curing',
      priority: 'Critical',
      assignedForeman: 'Md. Jahangir Alam',
      notes: 'Continuous wet hessian burlap ponding verified.',
    },
    {
      id: 'MS-COL-04',
      title: 'Level 3 to Level 4 Column Shuttering & Rebaring',
      zoneFloor: 'Level 3 to 4',
      startDate: formatOffset(-1),
      endDate: formatOffset(4),
      progress: 35,
      isCastingEvent: false,
      status: 'In Progress',
      priority: 'High',
      assignedForeman: 'Kalam Bar Bender',
      notes: 'Clear cover blocks 40mm tied to ties at 1.0m intervals.',
    },
  ];

  const engineerTasks: EngineerTask[] = [
    {
      id: 'TSK-01',
      title: 'Pre-Pour Shuttering Alignment & Line-Dori Inspection',
      category: 'Quality Inspection',
      priority: 'Urgent',
      assignedTo: 'Engr. Prokash',
      targetDate: formatOffset(0),
      isCompleted: false,
      remarks: 'Check plumb of column C3 and clear cover blocks.',
    },
    {
      id: 'TSK-02',
      title: 'Daily Sand Silt Content Bottle Test & Cube Slump Verification',
      category: 'Material Checking',
      priority: 'High',
      assignedTo: 'Engr. Prokash',
      targetDate: formatOffset(0),
      isCompleted: true,
      completedAt: `${formatOffset(0)}T11:00:00Z`,
      remarks: 'Slump measured 105 mm. Silt content within 2.8%.',
    },
    {
      id: 'TSK-03',
      title: 'Check Safety Harness & Perimeter Fall Protection Netting',
      category: 'Safety Audit',
      priority: 'Urgent',
      assignedTo: 'Site Safety Officer',
      targetDate: formatOffset(0),
      isCompleted: true,
      completedAt: `${formatOffset(0)}T09:30:00Z`,
      remarks: 'All carpenters on external scaffolding tied off.',
    },
  ];

  const fieldNotes: FieldNote[] = [
    {
      id: 'NOTE-01',
      timestamp: `${formatOffset(0)}T10:15:00Z`,
      date: formatOffset(0),
      category: 'Client Instruction',
      floorGridTag: '#Grid-C2-Plumbing',
      content: 'Client requested shifting master bath waste stack 150mm east to accommodate larger shower glass partition.',
      voiceTranscript: 'Audio transcribed: "Please shift the master bath vertical plumbing core 6 inches towards the eastern shaft wall."',
      recordedBy: 'Engr. Prokash',
      priority: 'High',
      isResolved: false,
    },
    {
      id: 'NOTE-02',
      timestamp: `${formatOffset(-1)}T15:30:00Z`,
      date: formatOffset(-1),
      category: 'Site Observation',
      floorGridTag: '#Level3-Curing',
      content: 'Hessian cloth on western cantilever slab edge was drying out due to heavy afternoon wind. Instructed helper to re-wet and secure with polythene cover.',
      recordedBy: 'Site Supervisor',
      priority: 'Normal',
      isResolved: true,
    },
  ];

  const raBills: ContractorRABill[] = [
    {
      id: 'RA-01',
      billNo: 'RA-01',
      date: formatOffset(-6),
      contractorName: 'Eastern Civil Builders (M/S Haque & Sons)',
      workTrade: 'RCC Structural Civil Labor (Footing to 3rd Floor)',
      unit: 'Sq.Ft',
      contractRate: 145,
      previousMeasuredQty: 0,
      currentMeasuredQty: 3200,
      totalCumulativeQty: 3200,
      currentGrossAmount: 464000,
      totalGrossAmount: 464000,
      retentionPercent: 10,
      retentionAmount: 46400,
      advanceDeducted: 50000,
      taxVatDeducted: 13920, // 3% AIT
      netPayable: 353680,
      paymentStatus: 'Certified',
      voucherNo: 'V-RA-01-CERT',
      remarks: 'Joint measurement verified with Contractor Forman on site.',
    },
  ];

  const pettyCash: PettyCashTransaction[] = [
    {
      id: 'PC-IN-01',
      date: formatOffset(-10),
      type: 'Cash Received',
      category: 'Misc',
      amount: 25000,
      voucherNo: 'HO-CASH-402',
      description: 'Site imprest replenishment from Head Office.',
      receiverOrSupplier: 'Site Accountant',
      approvedBy: 'Project Director',
      timestamp: `${formatOffset(-10)}T09:00:00Z`,
    },
    {
      id: 'PC-EXP-01',
      date: formatOffset(-2),
      type: 'Expense',
      category: 'Hardware/GI Wire/Nails',
      amount: 3450,
      voucherNo: 'V-PC-101',
      description: 'Purchased 20kg GI binding wire, 5kg 2.5" steel nails, and 2 rolls masking tape.',
      receiverOrSupplier: 'M/S Bismillah Hardware Store',
      approvedBy: 'Engr. Prokash',
      timestamp: `${formatOffset(-2)}T11:30:00Z`,
    },
    {
      id: 'PC-EXP-02',
      date: formatOffset(-1),
      type: 'Expense',
      category: 'Labor Snacks',
      amount: 1200,
      voucherNo: 'V-PC-102',
      description: 'Overtime tea and biscuits for casting crew (12 workers).',
      receiverOrSupplier: 'Tara Mia Canteen',
      approvedBy: 'Engr. Prokash',
      timestamp: `${formatOffset(-1)}T19:30:00Z`,
    },
    {
      id: 'PC-EXP-03',
      date: formatOffset(0),
      type: 'Expense',
      category: 'Transport/Van',
      amount: 850,
      voucherNo: 'V-PC-103',
      description: 'Pickup van fare for sending concrete test cubes to BUET Civil Lab.',
      receiverOrSupplier: 'Local Van Driver',
      approvedBy: 'Engr. Prokash',
      timestamp: `${formatOffset(0)}T08:30:00Z`,
    },
  ];

  const cubeTests: CubeTestRecord[] = [
    {
      id: 'CUBE-POUR-03',
      pourId: 'POUR-L3-SLAB',
      castingDate: formatOffset(-3),
      structuralElement: '3rd Floor Slab & Beams (Grid A1-D4)',
      concreteGrade: 'M25',
      targetStrengthMPa: 25,
      slumpMm: 110,
      day7TestDate: formatOffset(4), // castingDate + 7 days
      day28TestDate: formatOffset(25), // castingDate + 28 days
      status: 'Scheduled',
      labName: 'BUET Concrete Testing Facility',
      remarks: '3 sets of 150mm cubes molded and submerged in curing tank.',
      linkedMilestoneId: 'MS-CAST-03',
    },
    {
      id: 'CUBE-POUR-02',
      pourId: 'POUR-L2-COL',
      castingDate: formatOffset(-28),
      structuralElement: '2nd Floor Columns C1-C8',
      concreteGrade: 'M25',
      targetStrengthMPa: 25,
      slumpMm: 95,
      day7TestDate: formatOffset(-21),
      day28TestDate: formatOffset(0), // DUE TODAY!
      day7StrengthMPa: 18.5,
      day7PassDcr: 18.5 / (25 * 0.67),
      day28StrengthMPa: 27.2,
      day28PassDcr: 27.2 / 25,
      status: 'Passed',
      labName: 'Central Materials Testing Laboratory',
      remarks: 'Crushed today: 28-day characteristic strength achieved 108.8% of design target.',
    },
  ];

  return {
    version: 1,
    projectId,
    lastModified: new Date().toISOString(),
    inventory,
    stockTransactions,
    requisitions,
    workers,
    attendance,
    workerPayments,
    milestones,
    engineerTasks,
    fieldNotes,
    raBills,
    pettyCash,
    cubeTests,
  };
};

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

export interface SiteManagementContextType {
  // Scoping & State
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  siteData: SiteManagementData;
  isLoaded: boolean;

  // Connection 4: Live Project Financial Summary Rollup
  financialSummary: ProjectFinancialSummary;

  // Connection 5: 1-Click Unified DPR Selector
  compileDailyProgressReport: (dateString?: string) => DailyProgressReport;

  // 1. INVENTORY CRUD & ACTIONS
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'totalInward' | 'totalOutward' | 'updatedAt'>) => InventoryItem;
  updateInventoryItem: (id: string, partial: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  recordStockTransaction: (tx: Omit<StockTransaction, 'id' | 'timestamp'>) => StockTransaction;

  // 2. REQUISITION CRUD & CROSS-MODULE CONNECTIONS (1 & 2)
  createRequisition: (req: Omit<RequisitionOrder, 'id' | 'createdAt'>) => RequisitionOrder;
  updateRequisition: (id: string, partial: Partial<RequisitionOrder>) => void;
  deleteRequisition: (id: string) => void;
  createRequisitionFromLowStock: (urgency?: UrgencyLevel, notes?: string) => RequisitionOrder | null;
  markRequisitionAsReceived: (
    reqId: string,
    challanNo: string,
    vehicleNo?: string,
    supplier?: string,
    receiver?: string
  ) => boolean;

  // 3. LABOR & ATTENDANCE CRUD
  addWorker: (worker: Omit<LaborWorker, 'id'>) => LaborWorker;
  updateWorker: (id: string, partial: Partial<LaborWorker>) => void;
  deleteWorker: (id: string) => void;
  recordDailyAttendance: (
    workerId: string,
    dateString: string,
    record: Partial<DailyAttendanceRecord>
  ) => void;
  recordWorkerPayment: (payment: Omit<WorkerPaymentRecord, 'id' | 'timestamp'>) => WorkerPaymentRecord;
  getWorkerMonthlySummary: (
    workerId: string,
    monthYear: string
  ) => {
    presentDays: number;
    halfDays: number;
    absentDays: number;
    totalOtHours: number;
    grossWage: number;
    totalKhoraki: number;
    totalDirectPaid: number;
    netBalanceDue: number;
  };

  // 4. SCHEDULE & ROSTER CRUD & CONNECTION 3
  addMilestoneTask: (task: Omit<MilestoneTask, 'id'>) => MilestoneTask;
  updateMilestoneTask: (id: string, partial: Partial<MilestoneTask>) => void;
  deleteMilestoneTask: (id: string) => void;
  addEngineerTask: (task: Omit<EngineerTask, 'id'>) => EngineerTask;
  toggleEngineerTask: (id: string) => void;
  deleteEngineerTask: (id: string) => void;

  // 5. FIELD NOTES CRUD
  addFieldNote: (note: Omit<FieldNote, 'id' | 'timestamp'>) => FieldNote;
  updateFieldNote: (id: string, partial: Partial<FieldNote>) => void;
  deleteFieldNote: (id: string) => void;

  // 6. CONTRACTOR RA BILL CRUD
  addRABill: (bill: Omit<ContractorRABill, 'id'>) => ContractorRABill;
  updateRABill: (id: string, partial: Partial<ContractorRABill>) => void;
  deleteRABill: (id: string) => void;

  // 7. PETTY CASH CRUD
  addPettyCashEntry: (entry: Omit<PettyCashTransaction, 'id' | 'timestamp'>) => PettyCashTransaction;
  updatePettyCashEntry: (id: string, partial: Partial<PettyCashTransaction>) => void;
  deletePettyCashEntry: (id: string) => void;

  // 8. CUBE TESTS CRUD & CONNECTION 3
  addCubeTestRecord: (cube: Omit<CubeTestRecord, 'id' | 'day7TestDate' | 'day28TestDate'>) => CubeTestRecord;
  updateCubeTestRecord: (id: string, partial: Partial<CubeTestRecord>) => void;
  deleteCubeTestRecord: (id: string) => void;

  // DATA BACKUP, EXPORT & SEED
  exportSiteDataBackup: () => string;
  importSiteDataBackup: (jsonString: string) => boolean;
  resetProjectSiteData: () => void;
  loadSampleSiteData: () => void;
}

const SiteManagementContext = createContext<SiteManagementContextType | undefined>(undefined);

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const SiteManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useCivilLab();
  const { enqueueMutation } = useOfflineSync();

  // Active Project scoping — prioritizes userProfile.activeProjectId or fallback
  const [activeProjectId, setActiveProjectId] = useState<string>(
    userProfile.activeProjectId || DEFAULT_PROJECT_ID
  );

  // Sync when active project changes in CivilLabContext
  useEffect(() => {
    if (userProfile.activeProjectId && userProfile.activeProjectId !== activeProjectId) {
      setActiveProjectId(userProfile.activeProjectId);
    }
  }, [userProfile.activeProjectId, activeProjectId]);

  // Root State
  const [siteData, setSiteData] = useState<SiteManagementData>(() => {
    return createInitialSiteData(activeProjectId);
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // PERSISTENCE ENGINE: LOAD & SAVE WITH SCHEMA MIGRATION & ERROR RECOVERY
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Purge legacy site records on version mismatch while retaining system settings
    try {
      const storedVer = localStorage.getItem(SITE_VERSION_KEY);
      if (storedVer !== CURRENT_SITE_VERSION) {
        console.info('[SiteManagement] Version mismatch detected. Purging previous site logs.');
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('pbcivillab_site_erp_v1_') || key.startsWith('pbcivillab_site_erp_v2_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(SITE_VERSION_KEY, CURRENT_SITE_VERSION);
      }
    } catch (err) {
      console.warn('[SiteManagement] Purge error:', err);
    }

    const storageKey = `${STORAGE_KEY_PREFIX}${activeProjectId}`;
    const legacyStorageKey = `${LEGACY_STORAGE_KEY_PREFIX}${activeProjectId}`;
    try {
      let raw = localStorage.getItem(storageKey);
      if (!raw) {
        raw = localStorage.getItem(legacyStorageKey);
        if (raw) {
          localStorage.setItem(storageKey, raw);
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        // Robust schema recovery: ensure all expected arrays and maps exist
        const sanitized: SiteManagementData = {
          version: 1,
          projectId: activeProjectId,
          lastModified: parsed.lastModified || new Date().toISOString(),
          inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
          stockTransactions: Array.isArray(parsed.stockTransactions) ? parsed.stockTransactions : [],
          requisitions: Array.isArray(parsed.requisitions) ? parsed.requisitions : [],
          workers: Array.isArray(parsed.workers) ? parsed.workers : [],
          attendance: parsed.attendance && typeof parsed.attendance === 'object' ? parsed.attendance : {},
          workerPayments: Array.isArray(parsed.workerPayments) ? parsed.workerPayments : [],
          milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
          engineerTasks: Array.isArray(parsed.engineerTasks) ? parsed.engineerTasks : [],
          fieldNotes: Array.isArray(parsed.fieldNotes) ? parsed.fieldNotes : [],
          raBills: Array.isArray(parsed.raBills) ? parsed.raBills : [],
          pettyCash: Array.isArray(parsed.pettyCash) ? parsed.pettyCash : [],
          cubeTests: Array.isArray(parsed.cubeTests) ? parsed.cubeTests : [],
        };
        setSiteData(sanitized);
      } else {
        // Brand-new project starts with clean zero baseline
        const clean = createInitialSiteData(activeProjectId);
        setSiteData(clean);
        localStorage.setItem(storageKey, JSON.stringify(clean));
      }
    } catch (err) {
      console.warn(`[SiteManagement] Failed to parse localStorage for ${storageKey}. Recovering clean state:`, err);
      const clean = createInitialSiteData(activeProjectId);
      setSiteData(clean);
    } finally {
      setIsLoaded(true);
    }
  }, [activeProjectId]);

  // Save to localStorage on any state modification
  const persistState = useCallback((updater: (prev: SiteManagementData) => SiteManagementData) => {
    setSiteData((prev) => {
      const next = updater(prev);
      next.lastModified = new Date().toISOString();
      try {
        const key = `${STORAGE_KEY_PREFIX}${next.projectId}`;
        localStorage.setItem(key, JSON.stringify(next));
      } catch (err) {
        console.error('[SiteManagement] Failed to persist to localStorage:', err);
      }
      return next;
    });
  }, []);

  // --------------------------------------------------------------------------
  // CONNECTION 4: LIVE PROJECT FINANCIAL SUMMARY ROLLUP
  // --------------------------------------------------------------------------
  const financialSummary = useMemo<ProjectFinancialSummary>(() => {
    // 1. Labor wages calculation across all attendance
    let totalLaborWagesGross = 0;
    let totalLaborKhorakiAdvance = 0;
    let totalLaborDirectCashPaidInAttendance = 0;

    const workerMap = new Map<string, LaborWorker>();
    siteData.workers.forEach((w) => workerMap.set(w.id, w));

    Object.values(siteData.attendance).forEach((monthBook) => {
      Object.entries(monthBook).forEach(([workerId, daysMap]) => {
        const worker = workerMap.get(workerId);
        const dailyWage = worker?.dailyWage || 0;
        const otRate = worker?.overtimeRatePerHr || 0;

        Object.values(daysMap).forEach((dayRec) => {
          if (dayRec.status === 'P') {
            totalLaborWagesGross += dailyWage;
          } else if (dayRec.status === 'H') {
            totalLaborWagesGross += dailyWage * 0.5;
          } else if (dayRec.status === 'OT') {
            totalLaborWagesGross += dailyWage;
          }
          if (dayRec.overtimeHours > 0) {
            totalLaborWagesGross += dayRec.overtimeHours * otRate;
          }
          totalLaborKhorakiAdvance += dayRec.khoraki || 0;
          totalLaborDirectCashPaidInAttendance += dayRec.wagePaid || 0;
        });
      });
    });

    // 2. Worker Payment Ledger records
    const totalWorkerPaymentsVouchered = siteData.workerPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalLaborWagesPaid = totalLaborDirectCashPaidInAttendance + totalWorkerPaymentsVouchered;
    const totalLaborWageLiability = Math.max(0, totalLaborWagesGross - totalLaborWagesPaid - totalLaborKhorakiAdvance);

    // 3. Petty Cash Inward & Outward
    let totalPettyCashInward = 0;
    let totalPettyCashSpent = 0;
    siteData.pettyCash.forEach((tx) => {
      if (tx.type === 'Cash Received') {
        totalPettyCashInward += tx.amount || 0;
      } else {
        totalPettyCashSpent += tx.amount || 0;
      }
    });
    const pettyCashBalance = totalPettyCashInward - totalPettyCashSpent;

    // 4. Contractor RA Bills
    let totalContractorGrossCertified = 0;
    let totalContractorRetentionHeld = 0;
    let totalContractorNetPaid = 0;
    siteData.raBills.forEach((bill) => {
      totalContractorGrossCertified += bill.currentGrossAmount || 0;
      totalContractorRetentionHeld += bill.retentionAmount || 0;
      if (bill.paymentStatus === 'Paid') {
        totalContractorNetPaid += bill.netPayable || 0;
      }
    });

    // 5. Material Procured Spend (Inward transactions with totalAmount)
    const totalMaterialProcuredSpend = siteData.stockTransactions
      .filter((t) => t.type === 'Inward')
      .reduce((acc, t) => acc + (t.totalAmount || (t.quantity * (t.unitRate || 0))), 0);

    // 6. Grand Total Site Cost
    const grandTotalSiteCost =
      totalLaborWagesGross +
      totalPettyCashSpent +
      totalContractorGrossCertified +
      totalMaterialProcuredSpend;

    return {
      totalLaborWagesGross,
      totalLaborKhorakiAdvance,
      totalLaborWagesPaid,
      totalLaborWageLiability,
      totalPettyCashInward,
      totalPettyCashSpent,
      pettyCashBalance,
      totalContractorGrossCertified,
      totalContractorRetentionHeld,
      totalContractorNetPaid,
      totalMaterialProcuredSpend,
      grandTotalSiteCost,
    };
  }, [siteData]);

  // --------------------------------------------------------------------------
  // CONNECTION 5: 1-CLICK UNIFIED DPR SELECTOR
  // --------------------------------------------------------------------------
  const compileDailyProgressReport = useCallback(
    (targetDate?: string): DailyProgressReport => {
      const date = targetDate || new Date().toISOString().split('T')[0];
      const monthKey = date.slice(0, 7);
      const dayNum = parseInt(date.split('-')[2], 10);

      // 1. Labor Headcount by Trade on `date`
      const laborHeadcountByTrade: Record<string, { count: number; totalHours: number; otHours: number }> = {};
      let totalLaborHeadcount = 0;
      let totalLaborCostToday = 0;

      const workerMap = new Map<string, LaborWorker>();
      siteData.workers.forEach((w) => workerMap.set(w.id, w));

      const monthBook = siteData.attendance[monthKey];
      if (monthBook) {
        Object.entries(monthBook).forEach(([workerId, days]) => {
          const dayRec = days[dayNum];
          if (dayRec && (dayRec.status === 'P' || dayRec.status === 'H' || dayRec.status === 'OT')) {
            const worker = workerMap.get(workerId);
            const trade = worker?.trade || 'Mason';
            const weight = dayRec.status === 'H' ? 0.5 : 1.0;
            const hours = weight * 8 + (dayRec.overtimeHours || 0);

            if (!laborHeadcountByTrade[trade]) {
              laborHeadcountByTrade[trade] = { count: 0, totalHours: 0, otHours: 0 };
            }
            laborHeadcountByTrade[trade].count += weight;
            laborHeadcountByTrade[trade].totalHours += hours;
            laborHeadcountByTrade[trade].otHours += dayRec.overtimeHours || 0;

            totalLaborHeadcount += weight;

            // Cost for today
            const dailyWage = worker?.dailyWage || 0;
            const otRate = worker?.overtimeRatePerHr || 0;
            totalLaborCostToday += dailyWage * weight + (dayRec.overtimeHours || 0) * otRate;
          }
        });
      }

      // 2. Materials Received Today
      const materialsReceived = siteData.stockTransactions
        .filter((t) => t.type === 'Inward' && t.date === date)
        .map((t) => ({
          itemName: t.itemName,
          qty: t.quantity,
          unit: t.unit,
          challanNo: t.challanNo,
          supplier: t.supplier,
        }));

      // 3. Materials Issued Today
      const materialsIssued = siteData.stockTransactions
        .filter((t) => t.type === 'Outward' && t.date === date)
        .map((t) => ({
          itemName: t.itemName,
          qty: t.quantity,
          unit: t.unit,
          floorZone: t.floorZone,
          workHead: t.workHead,
        }));

      // 4. Active Milestones on `date`
      const activeMilestones = siteData.milestones
        .filter((m) => m.startDate <= date && (m.endDate >= date || m.status === 'In Progress' || m.status === 'Under Curing'))
        .map((m) => ({
          title: m.title,
          zoneFloor: m.zoneFloor,
          progress: m.progress,
          status: m.status,
        }));

      // 5. Engineer Inspections
      const engineerInspections = siteData.engineerTasks
        .filter((t) => t.targetDate === date)
        .map((t) => ({
          title: t.title,
          category: t.category,
          priority: t.priority,
          isCompleted: t.isCompleted,
        }));

      // 6. Petty Cash Today
      const pettyCashTransactions = siteData.pettyCash.filter((p) => p.date === date && p.type === 'Expense');
      const pettyCashSpentToday = pettyCashTransactions.reduce((acc, p) => acc + p.amount, 0);

      // 7. Cube Tests Due Today
      const cubeTestsDueToday = siteData.cubeTests.filter(
        (c) => c.day7TestDate === date || c.day28TestDate === date
      );

      // 8. Curing Reminders Active
      const curingRemindersActive = siteData.milestones
        .filter((m) => m.isCastingEvent && m.castingDate && m.autoCuringEndDate && m.castingDate <= date && m.autoCuringEndDate >= date)
        .map((m) => {
          const end = new Date(m.autoCuringEndDate!).getTime();
          const curr = new Date(date).getTime();
          const diffDays = Math.max(0, Math.ceil((end - curr) / (1000 * 60 * 60 * 24)));
          return {
            element: m.title,
            castingDate: m.castingDate!,
            curingEndDate: m.autoCuringEndDate!,
            daysLeft: diffDays,
          };
        });

      // 9. Field Notes
      const fieldNotesToday = siteData.fieldNotes.filter((n) => n.date === date);

      return {
        date,
        projectCode: siteData.projectId,
        projectName: 'Civil Construction Project',
        weather: 'Fair & Sunny (Dry site conditions)',
        temperature: '29°C',
        siteCondition: 'Normal operations; concrete vibrators & batch mixer functional',
        laborHeadcountByTrade,
        totalLaborHeadcount,
        totalLaborCostToday,
        materialsReceived,
        materialsIssued,
        activeMilestones,
        engineerInspections,
        pettyCashSpentToday,
        pettyCashTransactions,
        cubeTestsDueToday,
        curingRemindersActive,
        fieldNotesToday,
        remarks: 'All quality checks and slump tests verified per ACI 318 / BNBC 2020 standards.',
        compiledBy: 'Site Engineer of Record',
        generatedAt: new Date().toISOString(),
      };
    },
    [siteData]
  );

  // --------------------------------------------------------------------------
  // 1. INVENTORY CRUD & STOCK TRANSACTIONS
  // --------------------------------------------------------------------------
  const addInventoryItem = useCallback(
    (item: Omit<InventoryItem, 'id' | 'totalInward' | 'totalOutward' | 'updatedAt'>) => {
      const newItem: InventoryItem = {
        ...item,
        id: `INV-${Date.now().toString(36).toUpperCase()}`,
        totalInward: item.currentStock,
        totalOutward: 0,
        updatedAt: new Date().toISOString(),
      };
      persistState((prev) => ({
        ...prev,
        inventory: [newItem, ...prev.inventory],
      }));
      return newItem;
    },
    [persistState]
  );

  const updateInventoryItem = useCallback(
    (id: string, partial: Partial<InventoryItem>) => {
      persistState((prev) => ({
        ...prev,
        inventory: prev.inventory.map((item) =>
          item.id === id ? { ...item, ...partial, updatedAt: new Date().toISOString() } : item
        ),
      }));
    },
    [persistState]
  );

  const deleteInventoryItem = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        inventory: prev.inventory.filter((item) => item.id !== id),
      }));
    },
    [persistState]
  );

  const recordStockTransaction = useCallback(
    (tx: Omit<StockTransaction, 'id' | 'timestamp'>) => {
      const newTx: StockTransaction = {
        ...tx,
        id: `STX-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
      };

      persistState((prev) => {
        // Automatically adjust current stock and totals
        const updatedInventory = prev.inventory.map((item) => {
          if (item.id === tx.itemId) {
            const isOutward = tx.type === 'Outward';
            const qtyDelta = isOutward ? -tx.quantity : tx.quantity;
            const newStock = Math.max(0, item.currentStock + qtyDelta);
            return {
              ...item,
              currentStock: newStock,
              totalInward: !isOutward ? item.totalInward + tx.quantity : item.totalInward,
              totalOutward: isOutward ? item.totalOutward + tx.quantity : item.totalOutward,
              updatedAt: new Date().toISOString(),
            };
          }
          return item;
        });

        return {
          ...prev,
          inventory: updatedInventory,
          stockTransactions: [newTx, ...prev.stockTransactions],
        };
      });

      return newTx;
    },
    [persistState]
  );

  // --------------------------------------------------------------------------
  // 2. REQUISITIONS & CROSS-MODULE CONNECTIONS (1 & 2)
  // --------------------------------------------------------------------------
  const createRequisition = useCallback(
    (req: Omit<RequisitionOrder, 'id' | 'createdAt'>) => {
      const newReq: RequisitionOrder = {
        ...req,
        id: `REQ-${Date.now().toString(36).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      };
      persistState((prev) => ({
        ...prev,
        requisitions: [newReq, ...prev.requisitions],
      }));
      return newReq;
    },
    [persistState]
  );

  const updateRequisition = useCallback(
    (id: string, partial: Partial<RequisitionOrder>) => {
      persistState((prev) => ({
        ...prev,
        requisitions: prev.requisitions.map((r) => (r.id === id ? { ...r, ...partial } : r)),
      }));
    },
    [persistState]
  );

  const deleteRequisition = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        requisitions: prev.requisitions.filter((r) => r.id !== id),
      }));
    },
    [persistState]
  );

  /**
   * CONNECTION 1: Low Stock -> Requisition Slip
   * Automatically scans all inventory items where currentStock <= minThreshold
   */
  const createRequisitionFromLowStock = useCallback(
    (urgency: UrgencyLevel = 'Urgent', notes?: string): RequisitionOrder | null => {
      const lowStockItems = siteData.inventory.filter((item) => item.currentStock <= item.minThreshold);
      if (lowStockItems.length === 0) return null;

      const todayStr = new Date().toISOString().split('T')[0];
      const reqItems: RequisitionItem[] = lowStockItems.map((item) => {
        // Calculate needed quantity: target replenishment to double the threshold
        const deficit = Math.max(item.minThreshold * 2 - item.currentStock, item.minThreshold);
        return {
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          requestedQty: Math.ceil(deficit),
          estimatedRate: item.unitRate,
          currentStockAtReq: item.currentStock,
          notes: `Auto-generated: Current stock (${item.currentStock}) is at or below safe threshold (${item.minThreshold})`,
        };
      });

      const nextSeq = siteData.requisitions.length + 1;
      const newReq: RequisitionOrder = {
        id: `REQ-AUTO-${Date.now().toString(36).toUpperCase()}`,
        reqNo: `REQ-LOWSTOCK-${nextSeq.toString().padStart(3, '0')}`,
        date: todayStr,
        requiredByDate: todayStr,
        urgency,
        items: reqItems,
        status: 'Pending',
        requestedBy: 'CivilLab Auto-Stock Sentinel',
        notes: notes || 'Automated low stock indent generated based on minimum inventory thresholds.',
        createdAt: new Date().toISOString(),
      };

      persistState((prev) => ({
        ...prev,
        requisitions: [newReq, ...prev.requisitions],
      }));

      return newReq;
    },
    [siteData.inventory, siteData.requisitions.length, persistState]
  );

  /**
   * CONNECTION 2: Requisition -> Store Inward Logistics
   * Marks requisition as Received AND automatically generates Inward Stock Transactions,
   * directly incrementing currentStock in the Store Ledger.
   */
  const markRequisitionAsReceived = useCallback(
    (
      reqId: string,
      challanNo: string,
      vehicleNo?: string,
      supplier?: string,
      receiver?: string
    ): boolean => {
      const req = siteData.requisitions.find((r) => r.id === reqId);
      if (!req || req.status === 'Received') return false;

      const todayStr = new Date().toISOString().split('T')[0];
      const nowIso = new Date().toISOString();
      const generatedTxIds: string[] = [];
      const newTransactions: StockTransaction[] = [];

      // Create an Inward Stock Transaction for every item in the requisition
      req.items.forEach((item, idx) => {
        const txId = `STX-IN-REQ-${Date.now().toString(36).toUpperCase()}-${idx}`;
        generatedTxIds.push(txId);
        newTransactions.push({
          id: txId,
          itemId: item.itemId,
          itemName: item.itemName,
          type: 'Inward',
          date: todayStr,
          quantity: item.requestedQty,
          unit: item.unit,
          unitRate: item.estimatedRate,
          totalAmount: item.requestedQty * item.estimatedRate,
          challanNo,
          supplier: supplier || 'Approved Project Vendor',
          truckNo: vehicleNo || 'Site Direct',
          vehicleNo: vehicleNo || 'Site Direct',
          receiver: receiver || 'Site Storekeeper',
          remarks: `Auto-received from Requisition ${req.reqNo}`,
          timestamp: nowIso,
        });
      });

      persistState((prev) => {
        // 1. Update Inventory Current Stock
        const updatedInventory = prev.inventory.map((invItem) => {
          const receivedItem = req.items.find((ri) => ri.itemId === invItem.id);
          if (receivedItem) {
            return {
              ...invItem,
              currentStock: invItem.currentStock + receivedItem.requestedQty,
              totalInward: invItem.totalInward + receivedItem.requestedQty,
              updatedAt: nowIso,
            };
          }
          return invItem;
        });

        // 2. Update Requisition Status
        const updatedRequisitions = prev.requisitions.map((r) =>
          r.id === reqId
            ? {
                ...r,
                status: 'Received' as const,
                receivedAt: nowIso,
                linkedChallanNo: challanNo,
                linkedInwardTransactionIds: generatedTxIds,
              }
            : r
        );

        return {
          ...prev,
          inventory: updatedInventory,
          requisitions: updatedRequisitions,
          stockTransactions: [...newTransactions, ...prev.stockTransactions],
        };
      });

      return true;
    },
    [siteData.requisitions, persistState]
  );

  // --------------------------------------------------------------------------
  // 3. LABOR & ATTENDANCE CRUD
  // --------------------------------------------------------------------------
  const addWorker = useCallback(
    (worker: Omit<LaborWorker, 'id'>) => {
      const newWorker: LaborWorker = {
        ...worker,
        id: `WRK-${Date.now().toString(36).toUpperCase()}`,
      };
      persistState((prev) => ({
        ...prev,
        workers: [newWorker, ...prev.workers],
      }));
      return newWorker;
    },
    [persistState]
  );

  const updateWorker = useCallback(
    (id: string, partial: Partial<LaborWorker>) => {
      persistState((prev) => ({
        ...prev,
        workers: prev.workers.map((w) => (w.id === id ? { ...w, ...partial } : w)),
      }));
    },
    [persistState]
  );

  const deleteWorker = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        workers: prev.workers.filter((w) => w.id !== id),
      }));
    },
    [persistState]
  );

  const recordDailyAttendance = useCallback(
    (workerId: string, dateString: string, record: Partial<DailyAttendanceRecord>) => {
      const monthKey = dateString.slice(0, 7); // e.g. "2026-11"
      const dayNum = parseInt(dateString.split('-')[2], 10);

      persistState((prev) => {
        const nextAttendance = { ...prev.attendance };
        if (!nextAttendance[monthKey]) {
          nextAttendance[monthKey] = {};
        }
        if (!nextAttendance[monthKey][workerId]) {
          nextAttendance[monthKey][workerId] = {};
        }

        const existingRecord = nextAttendance[monthKey][workerId][dayNum] || {
          status: 'P',
          overtimeHours: 0,
          khoraki: 0,
          wagePaid: 0,
        };

        nextAttendance[monthKey][workerId][dayNum] = {
          ...existingRecord,
          ...record,
        };

        return {
          ...prev,
          attendance: nextAttendance,
        };
      });

      // Enqueue in Background Sync Queue
      const worker = siteData.workers.find((w) => w.id === workerId);
      const workerName = worker?.name || 'Worker';
      const otText = record.overtimeHours ? ` (+${record.overtimeHours}h OT)` : '';
      const khorakiText = record.khoraki ? ` (৳${record.khoraki} Khoraki)` : '';

      enqueueMutation({
        module: 'attendance',
        action: 'RECORD_ATTENDANCE',
        entityId: `${workerId}_${dateString}`,
        summary: `Attendance: ${workerName} [${record.status || 'P'}] on ${dateString}${otText}${khorakiText}`,
        payload: { workerId, dateString, record },
        projectId: activeProjectId,
      });
    },
    [persistState, siteData.workers, enqueueMutation, activeProjectId]
  );

  const recordWorkerPayment = useCallback(
    (payment: Omit<WorkerPaymentRecord, 'id' | 'timestamp'>) => {
      const newPayment: WorkerPaymentRecord = {
        ...payment,
        id: `PAY-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
      };
      persistState((prev) => ({
        ...prev,
        workerPayments: [newPayment, ...prev.workerPayments],
      }));
      return newPayment;
    },
    [persistState]
  );

  const getWorkerMonthlySummary = useCallback(
    (workerId: string, monthYear: string) => {
      const worker = siteData.workers.find((w) => w.id === workerId);
      const dailyWage = worker?.dailyWage || 0;
      const otRate = worker?.overtimeRatePerHr || 0;

      const daysMap = siteData.attendance[monthYear]?.[workerId] || {};
      let presentDays = 0;
      let halfDays = 0;
      let absentDays = 0;
      let totalOtHours = 0;
      let totalKhoraki = 0;
      let totalDirectPaid = 0;

      Object.values(daysMap).forEach((d) => {
        if (d.status === 'P') presentDays += 1;
        else if (d.status === 'H') halfDays += 1;
        else if (d.status === 'OT') presentDays += 1;
        else if (d.status === 'A') absentDays += 1;

        totalOtHours += d.overtimeHours || 0;
        totalKhoraki += d.khoraki || 0;
        totalDirectPaid += d.wagePaid || 0;
      });

      // Also sum payments from workerPayments matching this worker in this month
      const paymentsInMonth = siteData.workerPayments
        .filter((p) => p.workerId === workerId && p.date.startsWith(monthYear))
        .reduce((sum, p) => sum + p.amount, 0);

      const grossWage =
        presentDays * dailyWage + halfDays * (dailyWage * 0.5) + totalOtHours * otRate;
      const totalDeductionsAndPaid = totalKhoraki + totalDirectPaid + paymentsInMonth;
      const netBalanceDue = Math.max(0, grossWage - totalDeductionsAndPaid);

      return {
        presentDays,
        halfDays,
        absentDays,
        totalOtHours,
        grossWage,
        totalKhoraki,
        totalDirectPaid: totalDirectPaid + paymentsInMonth,
        netBalanceDue,
      };
    },
    [siteData.workers, siteData.attendance, siteData.workerPayments]
  );

  // --------------------------------------------------------------------------
  // 4. SCHEDULE & ROSTER CRUD & CONNECTION 3
  // --------------------------------------------------------------------------
  const addMilestoneTask = useCallback(
    (task: Omit<MilestoneTask, 'id'>) => {
      const id = `MS-${Date.now().toString(36).toUpperCase()}`;
      let finalTask: MilestoneTask = { ...task, id };
      let autoCubeRecord: CubeTestRecord | null = null;

      // CONNECTION 3: If it's a casting event, compute curing & deshuttering dates and auto-generate Cube Test
      if (task.isCastingEvent && task.castingDate) {
        const castDate = new Date(task.castingDate);
        
        // 14 days standard wet curing
        const cureEnd = new Date(castDate);
        cureEnd.setDate(cureEnd.getDate() + 14);
        const autoCuringEndDate = cureEnd.toISOString().split('T')[0];

        // 21 days standard soffit/bottom deshuttering
        const deshutterDate = new Date(castDate);
        deshutterDate.setDate(deshutterDate.getDate() + 21);
        const autoDeshutteringDate = deshutterDate.toISOString().split('T')[0];

        // Auto 7-day and 28-day dates for cube crushing
        const d7 = new Date(castDate);
        d7.setDate(d7.getDate() + 7);
        const day7TestDate = d7.toISOString().split('T')[0];

        const d28 = new Date(castDate);
        d28.setDate(d28.getDate() + 28);
        const day28TestDate = d28.toISOString().split('T')[0];

        const cubeId = task.linkedCubeTestId || `CUBE-${Date.now().toString(36).toUpperCase()}`;

        finalTask = {
          ...finalTask,
          autoCuringEndDate,
          autoDeshutteringDate,
          linkedCubeTestId: cubeId,
          status: finalTask.status === 'Not Started' ? 'Under Curing' : finalTask.status,
        };

        if (!task.linkedCubeTestId) {
          autoCubeRecord = {
            id: cubeId,
            pourId: `POUR-${id.slice(-6)}`,
            castingDate: task.castingDate,
            structuralElement: `${task.title} (${task.zoneFloor || 'Site'})`,
            concreteGrade: 'M25',
            targetStrengthMPa: 25,
            slumpMm: 100,
            day7TestDate,
            day28TestDate,
            status: 'Scheduled',
            labName: 'Central Materials Testing Laboratory',
            remarks: `Auto-scheduled from casting milestone "${task.title}". Curing until ${autoCuringEndDate}, Deshuttering on ${autoDeshutteringDate}.`,
            linkedMilestoneId: id,
          };
        }
      }

      persistState((prev) => ({
        ...prev,
        milestones: [finalTask, ...prev.milestones],
        cubeTests: autoCubeRecord ? [autoCubeRecord, ...prev.cubeTests] : prev.cubeTests,
      }));

      return finalTask;
    },
    [persistState]
  );

  const updateMilestoneTask = useCallback(
    (id: string, partial: Partial<MilestoneTask>) => {
      persistState((prev) => {
        let linkedCubeIdToSync: string | undefined;
        let newCastDateToSync: string | undefined;
        let newD7: string | undefined;
        let newD28: string | undefined;

        const updatedMilestones = prev.milestones.map((m) => {
          if (m.id === id) {
            const updated = { ...m, ...partial };
            if (updated.isCastingEvent && updated.castingDate) {
              const castDate = new Date(updated.castingDate);
              const cureEnd = new Date(castDate);
              cureEnd.setDate(cureEnd.getDate() + 14);
              updated.autoCuringEndDate = cureEnd.toISOString().split('T')[0];
              const deshutter = new Date(castDate);
              deshutter.setDate(deshutter.getDate() + 21);
              updated.autoDeshutteringDate = deshutter.toISOString().split('T')[0];

              if (updated.linkedCubeTestId && partial.castingDate) {
                linkedCubeIdToSync = updated.linkedCubeTestId;
                newCastDateToSync = updated.castingDate;
                const d7 = new Date(castDate);
                d7.setDate(d7.getDate() + 7);
                newD7 = d7.toISOString().split('T')[0];
                const d28 = new Date(castDate);
                d28.setDate(d28.getDate() + 28);
                newD28 = d28.toISOString().split('T')[0];
              }
            }
            return updated;
          }
          return m;
        });

        const updatedCubeTests = linkedCubeIdToSync && newCastDateToSync
          ? prev.cubeTests.map((c) =>
              c.id === linkedCubeIdToSync
                ? {
                    ...c,
                    castingDate: newCastDateToSync!,
                    day7TestDate: newD7!,
                    day28TestDate: newD28!,
                  }
                : c
            )
          : prev.cubeTests;

        return {
          ...prev,
          milestones: updatedMilestones,
          cubeTests: updatedCubeTests,
        };
      });
    },
    [persistState]
  );

  const deleteMilestoneTask = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        milestones: prev.milestones.filter((m) => m.id !== id),
      }));
    },
    [persistState]
  );

  const addEngineerTask = useCallback(
    (task: Omit<EngineerTask, 'id'>) => {
      const newTask: EngineerTask = {
        ...task,
        id: `TSK-${Date.now().toString(36).toUpperCase()}`,
      };
      persistState((prev) => ({
        ...prev,
        engineerTasks: [newTask, ...prev.engineerTasks],
      }));
      return newTask;
    },
    [persistState]
  );

  const toggleEngineerTask = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        engineerTasks: prev.engineerTasks.map((t) =>
          t.id === id
            ? {
                ...t,
                isCompleted: !t.isCompleted,
                completedAt: !t.isCompleted ? new Date().toISOString() : undefined,
              }
            : t
        ),
      }));
    },
    [persistState]
  );

  const deleteEngineerTask = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        engineerTasks: prev.engineerTasks.filter((t) => t.id !== id),
      }));
    },
    [persistState]
  );

  // --------------------------------------------------------------------------
  // 5. FIELD NOTES CRUD
  // --------------------------------------------------------------------------
  const addFieldNote = useCallback(
    (note: Omit<FieldNote, 'id' | 'timestamp'>) => {
      const newNote: FieldNote = {
        ...note,
        id: `NOTE-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
      };
      persistState((prev) => ({
        ...prev,
        fieldNotes: [newNote, ...prev.fieldNotes],
      }));

      enqueueMutation({
        module: 'field-notes',
        action: 'CREATE',
        entityId: newNote.id,
        summary: `Field Note [${newNote.floorGridTag || 'Site'}]: ${newNote.content.slice(0, 45)}...`,
        payload: newNote,
        projectId: activeProjectId,
      });

      return newNote;
    },
    [persistState, enqueueMutation, activeProjectId]
  );

  const updateFieldNote = useCallback(
    (id: string, partial: Partial<FieldNote>) => {
      persistState((prev) => ({
        ...prev,
        fieldNotes: prev.fieldNotes.map((n) => (n.id === id ? { ...n, ...partial } : n)),
      }));

      const actionText = partial.isResolved !== undefined
        ? partial.isResolved ? 'Resolved' : 'Reopened'
        : 'Updated';

      enqueueMutation({
        module: 'field-notes',
        action: 'UPDATE',
        entityId: id,
        summary: `${actionText} Field Note: ${id}`,
        payload: { id, partial },
        projectId: activeProjectId,
      });
    },
    [persistState, enqueueMutation, activeProjectId]
  );

  const deleteFieldNote = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        fieldNotes: prev.fieldNotes.filter((n) => n.id !== id),
      }));

      enqueueMutation({
        module: 'field-notes',
        action: 'DELETE',
        entityId: id,
        summary: `Deleted Field Note ${id}`,
        payload: { id },
        projectId: activeProjectId,
      });
    },
    [persistState, enqueueMutation, activeProjectId]
  );

  // --------------------------------------------------------------------------
  // 6. CONTRACTOR RA BILL CRUD
  // --------------------------------------------------------------------------
  const addRABill = useCallback(
    (bill: Omit<ContractorRABill, 'id'>) => {
      const newBill: ContractorRABill = {
        ...bill,
        id: `RA-${Date.now().toString(36).toUpperCase()}`,
      };
      persistState((prev) => ({
        ...prev,
        raBills: [newBill, ...prev.raBills],
      }));
      return newBill;
    },
    [persistState]
  );

  const updateRABill = useCallback(
    (id: string, partial: Partial<ContractorRABill>) => {
      persistState((prev) => ({
        ...prev,
        raBills: prev.raBills.map((b) => (b.id === id ? { ...b, ...partial } : b)),
      }));
    },
    [persistState]
  );

  const deleteRABill = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        raBills: prev.raBills.filter((b) => b.id !== id),
      }));
    },
    [persistState]
  );

  // --------------------------------------------------------------------------
  // 7. PETTY CASH CRUD
  // --------------------------------------------------------------------------
  const addPettyCashEntry = useCallback(
    (entry: Omit<PettyCashTransaction, 'id' | 'timestamp'>) => {
      const newEntry: PettyCashTransaction = {
        ...entry,
        id: `PC-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
      };
      persistState((prev) => ({
        ...prev,
        pettyCash: [newEntry, ...prev.pettyCash],
      }));

      enqueueMutation({
        module: 'petty-cash',
        action: 'CREATE',
        entityId: newEntry.id,
        summary: `Petty Cash ${newEntry.type}: ৳${newEntry.amount.toLocaleString()} (${newEntry.voucherNo} - ${newEntry.category})`,
        payload: newEntry,
        projectId: activeProjectId,
      });

      return newEntry;
    },
    [persistState, enqueueMutation, activeProjectId]
  );

  const updatePettyCashEntry = useCallback(
    (id: string, partial: Partial<PettyCashTransaction>) => {
      persistState((prev) => ({
        ...prev,
        pettyCash: prev.pettyCash.map((p) => (p.id === id ? { ...p, ...partial } : p)),
      }));

      enqueueMutation({
        module: 'petty-cash',
        action: 'UPDATE',
        entityId: id,
        summary: `Updated Petty Cash entry ${id}`,
        payload: { id, partial },
        projectId: activeProjectId,
      });
    },
    [persistState, enqueueMutation, activeProjectId]
  );

  const deletePettyCashEntry = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        pettyCash: prev.pettyCash.filter((p) => p.id !== id),
      }));

      enqueueMutation({
        module: 'petty-cash',
        action: 'DELETE',
        entityId: id,
        summary: `Deleted Petty Cash entry ${id}`,
        payload: { id },
        projectId: activeProjectId,
      });
    },
    [persistState, enqueueMutation, activeProjectId]
  );

  // --------------------------------------------------------------------------
  // 8. CUBE TESTS CRUD & CONNECTION 3
  // --------------------------------------------------------------------------
  const addCubeTestRecord = useCallback(
    (cube: Omit<CubeTestRecord, 'id' | 'day7TestDate' | 'day28TestDate'>) => {
      const castDate = new Date(cube.castingDate);

      // Auto +7 and +28 days
      const d7 = new Date(castDate);
      d7.setDate(d7.getDate() + 7);
      const day7TestDate = d7.toISOString().split('T')[0];

      const d28 = new Date(castDate);
      d28.setDate(d28.getDate() + 28);
      const day28TestDate = d28.toISOString().split('T')[0];

      // Auto curing end (14 days) and deshuttering (21 days)
      const cureEnd = new Date(castDate);
      cureEnd.setDate(cureEnd.getDate() + 14);
      const autoCuringEndDate = cureEnd.toISOString().split('T')[0];

      const deshutter = new Date(castDate);
      deshutter.setDate(deshutter.getDate() + 21);
      const autoDeshutteringDate = deshutter.toISOString().split('T')[0];

      const id = `CUBE-${Date.now().toString(36).toUpperCase()}`;
      let milestoneId = cube.linkedMilestoneId;
      let newMilestone: MilestoneTask | null = null;

      // CONNECTION 3: If not linked to a schedule task, auto-generate schedule casting milestone with curing & deshuttering
      if (!milestoneId) {
        milestoneId = `MS-CAST-${Date.now().toString(36).toUpperCase()}`;
        newMilestone = {
          id: milestoneId,
          title: `Casting & Curing: ${cube.structuralElement}`,
          zoneFloor: cube.structuralElement,
          startDate: cube.castingDate,
          endDate: autoDeshutteringDate,
          progress: 50,
          isCastingEvent: true,
          castingDate: cube.castingDate,
          autoCuringEndDate,
          autoDeshutteringDate,
          linkedCubeTestId: id,
          status: 'Under Curing',
          priority: 'Critical',
          notes: `Auto-generated from Cube Test ${cube.pourId || id}. 7-day test: ${day7TestDate}, 28-day test: ${day28TestDate}.`,
        };
      }

      // Calculate DCRs if strengths provided
      const day7PassDcr = cube.day7StrengthMPa
        ? cube.day7StrengthMPa / (cube.targetStrengthMPa * 0.67)
        : undefined;
      const day28PassDcr = cube.day28StrengthMPa
        ? cube.day28StrengthMPa / cube.targetStrengthMPa
        : undefined;

      let status = cube.status || 'Scheduled';
      if (cube.day28StrengthMPa !== undefined) {
        status = cube.day28StrengthMPa >= cube.targetStrengthMPa ? 'Passed' : 'Failed';
      }

      const newRecord: CubeTestRecord = {
        ...cube,
        id,
        day7TestDate,
        day28TestDate,
        day7PassDcr,
        day28PassDcr,
        status,
        linkedMilestoneId: milestoneId,
      };

      persistState((prev) => ({
        ...prev,
        cubeTests: [newRecord, ...prev.cubeTests],
        milestones: newMilestone ? [newMilestone, ...prev.milestones] : prev.milestones,
      }));

      return newRecord;
    },
    [persistState]
  );

  const updateCubeTestRecord = useCallback(
    (id: string, partial: Partial<CubeTestRecord>) => {
      persistState((prev) => {
        let linkedMilestoneIdToSync: string | undefined;
        let newCastDateToSync: string | undefined;
        let newCureEnd: string | undefined;
        let newDeshutter: string | undefined;

        const updatedCubeTests = prev.cubeTests.map((c) => {
          if (c.id === id) {
            const merged = { ...c, ...partial };
            if (merged.castingDate && (!partial.day7TestDate || !partial.day28TestDate)) {
              const castDate = new Date(merged.castingDate);
              const d7 = new Date(castDate);
              d7.setDate(d7.getDate() + 7);
              merged.day7TestDate = d7.toISOString().split('T')[0];
              const d28 = new Date(castDate);
              d28.setDate(d28.getDate() + 28);
              merged.day28TestDate = d28.toISOString().split('T')[0];

              if (merged.linkedMilestoneId && partial.castingDate) {
                linkedMilestoneIdToSync = merged.linkedMilestoneId;
                newCastDateToSync = merged.castingDate;
                const cure = new Date(castDate);
                cure.setDate(cure.getDate() + 14);
                newCureEnd = cure.toISOString().split('T')[0];
                const desh = new Date(castDate);
                desh.setDate(desh.getDate() + 21);
                newDeshutter = desh.toISOString().split('T')[0];
              }
            }
            if (merged.day7StrengthMPa !== undefined) {
              merged.day7PassDcr = merged.day7StrengthMPa / (merged.targetStrengthMPa * 0.67);
            }
            if (merged.day28StrengthMPa !== undefined) {
              merged.day28PassDcr = merged.day28StrengthMPa / merged.targetStrengthMPa;
              merged.status = merged.day28StrengthMPa >= merged.targetStrengthMPa ? 'Passed' : 'Failed';
            }
            return merged;
          }
          return c;
        });

        const updatedMilestones = linkedMilestoneIdToSync && newCastDateToSync
          ? prev.milestones.map((m) =>
              m.id === linkedMilestoneIdToSync
                ? {
                    ...m,
                    castingDate: newCastDateToSync!,
                    autoCuringEndDate: newCureEnd!,
                    autoDeshutteringDate: newDeshutter!,
                  }
                : m
            )
          : prev.milestones;

        return {
          ...prev,
          cubeTests: updatedCubeTests,
          milestones: updatedMilestones,
        };
      });
    },
    [persistState]
  );

  const deleteCubeTestRecord = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        cubeTests: prev.cubeTests.filter((c) => c.id !== id),
      }));
    },
    [persistState]
  );

  // --------------------------------------------------------------------------
  // BACKUP, EXPORT & RECOVERY
  // --------------------------------------------------------------------------
  const exportSiteDataBackup = useCallback((): string => {
    return JSON.stringify(siteData, null, 2);
  }, [siteData]);

  const importSiteDataBackup = useCallback(
    (jsonString: string): boolean => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || typeof parsed !== 'object') return false;

        const sanitized: SiteManagementData = {
          version: 1,
          projectId: parsed.projectId || activeProjectId,
          lastModified: new Date().toISOString(),
          inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
          stockTransactions: Array.isArray(parsed.stockTransactions) ? parsed.stockTransactions : [],
          requisitions: Array.isArray(parsed.requisitions) ? parsed.requisitions : [],
          workers: Array.isArray(parsed.workers) ? parsed.workers : [],
          attendance: parsed.attendance && typeof parsed.attendance === 'object' ? parsed.attendance : {},
          workerPayments: Array.isArray(parsed.workerPayments) ? parsed.workerPayments : [],
          milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
          engineerTasks: Array.isArray(parsed.engineerTasks) ? parsed.engineerTasks : [],
          fieldNotes: Array.isArray(parsed.fieldNotes) ? parsed.fieldNotes : [],
          raBills: Array.isArray(parsed.raBills) ? parsed.raBills : [],
          pettyCash: Array.isArray(parsed.pettyCash) ? parsed.pettyCash : [],
          cubeTests: Array.isArray(parsed.cubeTests) ? parsed.cubeTests : [],
        };

        setSiteData(sanitized);
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${sanitized.projectId}`, JSON.stringify(sanitized));
        return true;
      } catch (err) {
        console.error('[SiteManagement] Import backup failed:', err);
        return false;
      }
    },
    [activeProjectId]
  );

  const resetProjectSiteData = useCallback(() => {
    const clean = createInitialSiteData(activeProjectId);
    setSiteData(clean);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeProjectId}`, JSON.stringify(clean));
  }, [activeProjectId]);

  const loadSampleSiteData = useCallback(() => {
    const sample = createSampleSiteData(activeProjectId);
    setSiteData(sample);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeProjectId}`, JSON.stringify(sample));
  }, [activeProjectId]);

  const value = useMemo<SiteManagementContextType>(
    () => ({
      activeProjectId,
      setActiveProjectId,
      siteData,
      isLoaded,
      financialSummary,
      compileDailyProgressReport,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      recordStockTransaction,
      createRequisition,
      updateRequisition,
      deleteRequisition,
      createRequisitionFromLowStock,
      markRequisitionAsReceived,
      addWorker,
      updateWorker,
      deleteWorker,
      recordDailyAttendance,
      recordWorkerPayment,
      getWorkerMonthlySummary,
      addMilestoneTask,
      updateMilestoneTask,
      deleteMilestoneTask,
      addEngineerTask,
      toggleEngineerTask,
      deleteEngineerTask,
      addFieldNote,
      updateFieldNote,
      deleteFieldNote,
      addRABill,
      updateRABill,
      deleteRABill,
      addPettyCashEntry,
      updatePettyCashEntry,
      deletePettyCashEntry,
      addCubeTestRecord,
      updateCubeTestRecord,
      deleteCubeTestRecord,
      exportSiteDataBackup,
      importSiteDataBackup,
      resetProjectSiteData,
      loadSampleSiteData,
    }),
    [
      activeProjectId,
      siteData,
      isLoaded,
      financialSummary,
      compileDailyProgressReport,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      recordStockTransaction,
      createRequisition,
      updateRequisition,
      deleteRequisition,
      createRequisitionFromLowStock,
      markRequisitionAsReceived,
      addWorker,
      updateWorker,
      deleteWorker,
      recordDailyAttendance,
      recordWorkerPayment,
      getWorkerMonthlySummary,
      addMilestoneTask,
      updateMilestoneTask,
      deleteMilestoneTask,
      addEngineerTask,
      toggleEngineerTask,
      deleteEngineerTask,
      addFieldNote,
      updateFieldNote,
      deleteFieldNote,
      addRABill,
      updateRABill,
      deleteRABill,
      addPettyCashEntry,
      updatePettyCashEntry,
      deletePettyCashEntry,
      addCubeTestRecord,
      updateCubeTestRecord,
      deleteCubeTestRecord,
      exportSiteDataBackup,
      importSiteDataBackup,
      resetProjectSiteData,
      loadSampleSiteData,
    ]
  );

  return <SiteManagementContext.Provider value={value}>{children}</SiteManagementContext.Provider>;
};

// ============================================================================
// HOOK CONSUMER
// ============================================================================

export const useSiteManagement = (): SiteManagementContextType => {
  const context = useContext(SiteManagementContext);
  if (!context) {
    throw new Error('useSiteManagement must be used within a SiteManagementProvider');
  }
  return context;
};
