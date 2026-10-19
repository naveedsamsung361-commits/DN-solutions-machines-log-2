export type UserRole = 'admin' | 'manager' | 'technician' | 'operator' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  badgeNumber: string;
  phone?: string;
  avatar?: string;
}

export type MachineStatus = 'running' | 'idle' | 'maintenance' | 'breakdown' | 'decommissioned';
export type ControllerType = 'FANUC' | 'Mitsubishi' | 'Siemens' | 'Heidenhain' | 'Other';
export type MachineType = 
  | 'Vertical Machining Center' 
  | 'Horizontal Machining Center' 
  | 'CNC Turning Center' 
  | '5-Axis Machining Center' 
  | 'Multi-Tasking Mill-Turn' 
  | 'Boring Mill';

export interface Machine {
  id: string;
  machineId: string; // e.g. "MC-VMC-01"
  machineName: string; // e.g. "DNM 5700 II - Line A"
  model: string; // e.g. "DNM 5700 II"
  manufacturer: string; // "DN Solutions"
  serialNumber: string;
  customerId: string;
  customerName: string;
  customerLocation: string;
  factory: string;
  department: string;
  productionLine: string;
  installationDate: string;
  commissioningDate: string;
  machineType: MachineType;
  controllerType: ControllerType;
  controllerModel: string; // e.g. "FANUC 0i-MF Plus"
  controllerSerialNumber: string;
  machineConfiguration: string; // e.g. "BT40 / 12,000 RPM Spindle / 30 ATC / CTS 20 Bar"
  softwareFirmwareVersion: string; // e.g. "V02.14.00"
  electricalSpecs: string; // e.g. "380V-415V 3-Phase 50/60Hz 35kVA"
  operatingStatus: MachineStatus;
  warrantyStartDate: string;
  warrantyExpiryDate: string;
  serviceContractDetails: string;
  maintenanceFrequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  responsibleTechnician: string;
  machinePhotoUrl?: string;
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type FaultCategory =
  | 'Mechanical failure'
  | 'Electrical failure'
  | 'CNC controller alarm'
  | 'Servo motor failure'
  | 'Spindle failure'
  | 'Hydraulic failure'
  | 'Pneumatic failure'
  | 'Tool changer failure'
  | 'Sensor failure'
  | 'Coolant system failure'
  | 'Lubrication failure'
  | 'Tooling issue'
  | 'Software/parameter issue'
  | 'Preventive maintenance'
  | 'Other';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ProductionImpact = 'none' | 'partial' | 'line_stopped' | 'facility_stopped';
export type TicketStatus =
  | 'Reported'
  | 'Assigned'
  | 'Diagnosis in Progress'
  | 'Waiting for Parts'
  | 'Waiting for Approval'
  | 'Repair in Progress'
  | 'Testing'
  | 'Awaiting Quality Approval'
  | 'Awaiting Restart Approval'
  | 'Resolved'
  | 'Closed';

export type PhotoType = 'alarm_screen' | 'damaged_component' | 'before_repair' | 'after_repair' | 'general';

export interface FaultPhoto {
  id: string;
  url: string;
  caption: string;
  photoType: PhotoType;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SparePartUsed {
  partId: string;
  partName: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
}

export interface TimestampAuditEntry {
  id: string;
  editedAt: string;
  editedBy: string;
  reason: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface StatusHistoryEntry {
  status: TicketStatus;
  timestamp: string;
  changedBy: string;
  note: string;
}

export interface PreRestartChecklist {
  spindleRunTest: boolean;
  emergencyStopVerified: boolean;
  axisInterlockTested: boolean;
  lubricationPressureChecked: boolean;
  coolantFlowTested: boolean;
  guardInterlocksSafe: boolean;
  trialPartCutPassed: boolean;
}

export interface BreakdownTicket {
  id: string;
  ticketNumber: string; // e.g. "TKT-2026-0101"
  breakdownDate: string;
  breakdownTime: string;
  
  // Machine Details
  machineId: string;
  machineName: string;
  machineModel: string;
  machineSerialNumber: string;
  customerName: string;
  customerId: string;
  factory: string;
  department: string;
  productionLine: string;
  
  // Operational Context
  shift: 'Shift 1 (Morning)' | 'Shift 2 (Evening)' | 'Shift 3 (Night)';
  reportedBy: string;
  operatorName: string;
  technicianAssigned: string;
  maintenanceSupervisor: string;
  
  // Fault Details
  faultCategory: FaultCategory;
  faultDescription: string;
  machineSymptoms: string;
  alarmCode: string;
  alarmMessage: string;
  controllerType: ControllerType;
  controllerScreenMessage: string;
  axisAffected: 'X' | 'Y' | 'Z' | 'A' | 'B' | 'C' | 'Spindle' | 'ATC' | 'None' | 'Multiple';
  spindleStatus: string;
  toolChangerStatus: string;
  hydraulicStatus: string;
  pneumaticStatus: string;
  electricalStatus: string;
  mechanicalStatus: string;
  severityLevel: SeverityLevel;
  productionImpact: ProductionImpact;
  
  // Photographs
  photographs: FaultPhoto[];
  
  // Downtime Tracking
  breakdownStart: string; // ISO
  technicianArrival?: string;
  diagnosisStart?: string;
  repairStart?: string;
  repairCompletion?: string;
  trialRunStart?: string;
  machineRestoration?: string;
  productionRestart?: string;
  
  // Calculated minutes (stored for quick filtering & analytics)
  totalDowntimeMinutes: number;
  diagnosisDurationMinutes: number;
  repairDurationMinutes: number;
  waitingDurationMinutes: number;
  sparePartsWaitingMinutes: number;
  testingDurationMinutes: number;
  
  timestampAuditLog: TimestampAuditEntry[];
  
  // Troubleshooting & Repair
  initialInspection?: string;
  troubleshootingPerformed?: string;
  rootCause?: string;
  confirmedFailure?: string;
  correctiveAction?: string;
  componentsRepaired?: string;
  componentsReplaced?: string;
  sparePartsUsed: SparePartUsed[];
  parameterChanges?: string;
  calibrationPerformed?: string;
  alignmentPerformed?: string;
  electricalChecks?: string;
  mechanicalChecks?: string;
  safetyChecks?: string;
  testResults?: string;
  finalObservations?: string;
  technicianRemarks?: string;
  supervisorRemarks?: string;
  
  // Pre-restart safety checklist
  preRestartChecklist: PreRestartChecklist;
  
  // Status and workflow
  status: TicketStatus;
  statusHistory: StatusHistoryEntry[];
  
  // Closure
  closedBy?: string;
  closureDate?: string;
  finalMachineStatus?: MachineStatus;
  productionRestartConfirmation?: boolean;
  supervisorApproved?: boolean;
  
  // Warranty
  isWarrantyClaim?: boolean;
  warrantyClaimId?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  factories: { name: string; location: string }[];
  registeredMachineCount?: number;
  activeTicketsCount?: number;
  totalDowntimeHours?: number;
  notes?: string;
}

export type WarrantyStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Missing';

export interface WarrantyRecord {
  id: string;
  machineId: string;
  machineName: string;
  provider: string; // e.g. "DN Solutions OEM Warranty"
  startDate: string;
  expiryDate: string;
  coverageType: 'Full Comprehensive' | 'Parts Only' | 'Labor Only' | 'Spindle & Controller Extended';
  coveredComponents: string;
  excludedComponents: string;
  warrantyTerms: string;
  serviceContractNumber: string;
  serviceProviderContact: string;
  warrantyDocumentUrl?: string;
  status: WarrantyStatus;
  remainingDays: number;
}

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  machineId: string;
  machineName: string;
  ticketId?: string;
  ticketNumber?: string;
  claimDate: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Reimbursed';
  description: string;
  supportingPhotos: string[];
  supportingDocuments: string[];
  providerResponse?: string;
  resolutionNotes?: string;
  claimAmount?: number;
  reimbursedAmount?: number;
  updatedAt: string;
}

export type PMInterval = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'Operating-Hour-Based';

export interface PMChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  notes?: string;
}

export interface PreventiveMaintenanceTask {
  id: string;
  machineId: string;
  machineName: string;
  taskName: string;
  category: 'Mechanical' | 'Electrical' | 'Lubrication' | 'Hydraulic' | 'Pneumatic' | 'Alignment / Geometry' | 'Coolant & Filters';
  interval: PMInterval;
  operatingHoursTarget?: number;
  scheduledDate: string;
  dueDate: string;
  assignedTechnician: string;
  requiredTools: string;
  requiredSpareParts: string;
  safetyPrecautions: string;
  checklist: PMChecklistItem[];
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
  actualCompletionDate?: string;
  inspectionResults?: string;
  technicianRemarks?: string;
  nextDueDate?: string;
  completedBy?: string;
}

export interface ShiftHandover {
  id: string;
  date: string;
  shift: 'Shift 1 (Morning)' | 'Shift 2 (Evening)' | 'Shift 3 (Night)';
  machineId: string;
  machineName: string;
  operator: string;
  technician: string;
  machineRunningStatus: MachineStatus;
  productionStatus: 'Normal Production' | 'Reduced Feed/Speed' | 'Waiting Material' | 'Line Idle' | 'Down';
  currentBreakdownId?: string;
  pendingMaintenance: string;
  temporaryRepairDetails?: string;
  outstandingAlarms: string;
  sparePartsRequired?: string;
  safetyConcerns: string;
  pendingJobs: string;
  handoverRemarks: string;
  receivedBy?: string;
  acknowledgedAt?: string;
  handoverTime: string;
  createdAt: string;
}

export interface SparePart {
  id: string;
  partNumber: string;
  partName: string;
  category: 'Electrical / CNC' | 'Hydraulic' | 'Pneumatic' | 'Mechanical / Spindle' | 'Coolant & Lube' | 'Sensors & Switches' | 'Wear Items';
  machineCompatibility: string[]; // e.g. ["DNM 5700", "PUMA GT2600", "Lynx 2100"]
  manufacturer: string;
  quantityAvailable: number;
  minStockLevel: number;
  storageLocation: string; // e.g. "Rack B-04, Bin 12"
  unitCost: number;
  supplier: string;
  leadTimeDays: number;
  warrantyPeriodMonths: number;
  partCondition: 'New' | 'Refurbished' | 'Repaired';
  imageUrl?: string;
}

export interface InventoryTransaction {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  type: 'issue' | 'return' | 'restock' | 'adjustment';
  quantity: number;
  ticketId?: string;
  ticketNumber?: string;
  reference: string;
  performedBy: string;
  date: string;
  notes: string;
}

export interface TechnicalDocument {
  id: string;
  title: string;
  category: 'alarm_manual' | 'electrical_schematic' | 'mechanical_drawing' | 'controller_manual' | 'parameter_manual' | 'service_bulletin' | 'sop';
  controllerType?: ControllerType;
  machineModel?: string;
  alarmCode?: string;
  description: string;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
}

export interface MachineBackup {
  id: string;
  machineId: string;
  machineName: string;
  backupDate: string;
  backupType: 'Complete SRAM' | 'Parameters (CNC)' | 'Macro Variables' | 'Pitch Error Compensation' | 'PMC Ladder / PLC' | 'Part Programs' | 'Tool Data / Offsets';
  controllerType: ControllerType;
  softwareVersion: string;
  backupLocation: string;
  fileChecksum: string;
  createdBy: string;
  verificationStatus: 'Verified OK' | 'Pending Verification' | 'Failed Checksum';
  restorationHistory: {
    restoredDate: string;
    restoredBy: string;
    reason: string;
    status: 'Success' | 'Failed';
  }[];
  remarks: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'APPROVAL' | 'EXPORT' | 'IMPORT' | 'CHECKLIST_SIGN';
  module: 'MACHINES' | 'BREAKDOWN_LOG' | 'WARRANTY' | 'CUSTOMERS' | 'PREVENTIVE_MAINTENANCE' | 'SHIFT_HANDOVER' | 'SPARE_PARTS' | 'BACKUPS' | 'DOCS';
  recordId: string;
  details: string;
}

export type DateFilterOption = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

export type NotificationSeverity = 'critical' | 'warning' | 'info';

export type NotificationType =
  | 'critical_breakdown'
  | 'warranty_expiring'
  | 'pm_overdue'
  | 'low_inventory'
  | 'unacknowledged_handover';

export interface SystemNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: string;
  linkedRecordType: 'ticket' | 'machine' | 'pm' | 'part' | 'handover';
  linkedRecordId: string;
  suggestedAction: string;
  actionLabel: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  meta?: {
    daysRemaining?: number;
    alarmCode?: string;
    productionImpact?: string;
    machineName?: string;
  };
}

export interface NotificationSettings {
  browserNotificationsEnabled: boolean;
  soundAlertsEnabled: boolean;
  criticalBreakdownAlerts: boolean;
  warrantyExpirationAlerts: boolean;
  pmOverdueAlerts: boolean;
  lowInventoryAlerts: boolean;
}

export interface DashboardMultiFilter {
  dateRange: DateFilterOption;
  customStart?: string;
  customEnd?: string;
  machineId?: string;
  customerId?: string;
  factory?: string;
  department?: string;
}

export interface AICitation {
  recordType: 'ticket' | 'machine' | 'part' | 'pm' | 'handover';
  recordId: string;
  label: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: AICitation[];
  isDiagnostic?: boolean;
}

