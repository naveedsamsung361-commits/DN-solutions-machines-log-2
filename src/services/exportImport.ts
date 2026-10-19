import * as XLSX from 'xlsx';
import { BreakdownTicket } from '../types';

export interface ColumnMapping {
  ticketNumber?: string;
  breakdownDate?: string;
  breakdownTime?: string;
  machineId?: string;
  machineName?: string;
  customerName?: string;
  faultCategory?: string;
  alarmCode?: string;
  alarmMessage?: string;
  faultDescription?: string;
  severityLevel?: string;
  technicianAssigned?: string;
  status?: string;
  totalDowntimeMinutes?: string;
  rootCause?: string;
  correctiveAction?: string;
}

export interface ImportValidationResult {
  rowNumber: number;
  data: Record<string, any>;
  mappedTicket: Partial<BreakdownTicket>;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
  warnings: string[];
}

export const SUPPORTED_TARGET_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean; hint: string }[] = [
  { key: 'ticketNumber', label: 'Ticket / Log Number', required: true, hint: 'e.g. TKT-2025-0012' },
  { key: 'breakdownDate', label: 'Breakdown Date', required: true, hint: 'YYYY-MM-DD format preferred' },
  { key: 'breakdownTime', label: 'Breakdown Time', required: false, hint: 'HH:MM format' },
  { key: 'machineId', label: 'Machine ID / Asset Code', required: true, hint: 'e.g. MC-VMC-01' },
  { key: 'machineName', label: 'Machine Name / Model', required: false, hint: 'e.g. DNM 5700 II' },
  { key: 'customerName', label: 'Customer / Company', required: false, hint: 'e.g. Precision Aero' },
  { key: 'faultCategory', label: 'Fault Category', required: false, hint: 'e.g. Spindle failure, Mechanical' },
  { key: 'alarmCode', label: 'Alarm Code', required: false, hint: 'e.g. SV0027, EX1012' },
  { key: 'alarmMessage', label: 'Alarm Message', required: false, hint: 'e.g. Spindle pulse missing' },
  { key: 'faultDescription', label: 'Fault Description', required: true, hint: 'Summary of failure' },
  { key: 'severityLevel', label: 'Severity Level', required: false, hint: 'low, medium, high, critical' },
  { key: 'technicianAssigned', label: 'Technician Assigned', required: false, hint: 'Technician name' },
  { key: 'status', label: 'Repair Status', required: false, hint: 'Reported, Repair in Progress, Closed, etc.' },
  { key: 'totalDowntimeMinutes', label: 'Downtime (Minutes or Hours)', required: false, hint: 'Numeric downtime duration' },
  { key: 'rootCause', label: 'Root Cause', required: false, hint: 'Diagnosed underlying reason' },
  { key: 'correctiveAction', label: 'Corrective Action', required: false, hint: 'Repair steps executed' }
];

// Generates and downloads a CSV template with sample row
export function downloadCSVTemplate(): void {
  const headers = [
    'Ticket Number',
    'Breakdown Date',
    'Breakdown Time',
    'Machine ID',
    'Machine Name',
    'Customer Name',
    'Fault Category',
    'Alarm Code',
    'Alarm Message',
    'Fault Description',
    'Severity Level',
    'Technician Assigned',
    'Repair Status',
    'Total Downtime (Minutes)',
    'Root Cause',
    'Corrective Action'
  ];

  const sampleRow = [
    'TKT-HIST-089',
    '2026-08-14',
    '10:30',
    'MC-VMC-01',
    'DNM 5700 II',
    'Precision Aero Dynamics',
    'Spindle failure',
    'AL-SV0027',
    'Spindle Position Sensor Pulse Missing',
    'Spindle vibration alarm tripped at 8000 RPM',
    'high',
    'Elena Rostova',
    'Closed',
    '180',
    'Optical encoder contaminated by coolant vapor',
    'Cleaned sensor pins, replaced O-ring seal, verified M19 orientation'
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), sampleRow.map(cell => `"${cell}"`).join(',')].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'DN_Solutions_Breakdown_Import_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Parse file (CSV or XLSX) to JSON rows and header list
export async function parseSpreadsheetFile(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(rawRows[0]);
  return { headers, rows: rawRows };
}

// Auto-guess initial mapping based on header similarity
export function autoSuggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  headers.forEach(h => {
    const norm = normalize(h);
    if (norm.includes('ticket') || norm.includes('logno') || norm.includes('tkt')) mapping.ticketNumber = h;
    else if (norm.includes('date') && !norm.includes('close')) mapping.breakdownDate = h;
    else if (norm.includes('time') && !norm.includes('down')) mapping.breakdownTime = h;
    else if (norm.includes('machineid') || norm.includes('asset') || norm.includes('equipmentid')) mapping.machineId = h;
    else if (norm.includes('machinename') || norm.includes('model')) mapping.machineName = h;
    else if (norm.includes('customer') || norm.includes('company') || norm.includes('client')) mapping.customerName = h;
    else if (norm.includes('category') || norm.includes('faulttype')) mapping.faultCategory = h;
    else if (norm.includes('alarmcode') || norm.includes('errorcode')) mapping.alarmCode = h;
    else if (norm.includes('alarmmsg') || norm.includes('alarmmessage')) mapping.alarmMessage = h;
    else if (norm.includes('desc') || norm.includes('symptom') || norm.includes('problem')) mapping.faultDescription = h;
    else if (norm.includes('severity') || norm.includes('priority')) mapping.severityLevel = h;
    else if (norm.includes('tech') || norm.includes('engineer') || norm.includes('assignee')) mapping.technicianAssigned = h;
    else if (norm.includes('status') || norm.includes('state')) mapping.status = h;
    else if (norm.includes('downtime') || norm.includes('duration')) mapping.totalDowntimeMinutes = h;
    else if (norm.includes('cause') || norm.includes('root')) mapping.rootCause = h;
    else if (norm.includes('action') || norm.includes('solution') || norm.includes('fix')) mapping.correctiveAction = h;
  });

  return mapping;
}

// Validate rows against mappings and check for duplicates against existing tickets
export function validateImportRows(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  existingTickets: BreakdownTicket[]
): ImportValidationResult[] {
  const existingTicketSet = new Set(existingTickets.map(t => t.ticketNumber.trim().toLowerCase()));

  return rows.map((row, idx) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const getVal = (key?: string): string => (key && row[key] !== undefined ? String(row[key]).trim() : '');

    const ticketNumber = getVal(mapping.ticketNumber);
    const breakdownDate = getVal(mapping.breakdownDate);
    const machineId = getVal(mapping.machineId);
    const faultDescription = getVal(mapping.faultDescription);

    if (!ticketNumber) errors.push('Missing ticket number');
    if (!breakdownDate) errors.push('Missing breakdown date');
    if (!machineId) errors.push('Missing machine ID');
    if (!faultDescription) errors.push('Missing fault description');

    // Date validation
    let validDate = breakdownDate;
    if (breakdownDate) {
      const parsed = Date.parse(breakdownDate);
      if (isNaN(parsed)) {
        // Try to handle Excel numeric date serials
        if (!isNaN(Number(breakdownDate))) {
          const excelDate = new Date(Math.round((Number(breakdownDate) - 25569) * 86400 * 1000));
          validDate = excelDate.toISOString().split('T')[0];
        } else {
          errors.push(`Invalid date format "${breakdownDate}"`);
        }
      } else {
        validDate = new Date(parsed).toISOString().split('T')[0];
      }
    }

    // Duplicate check
    const isDuplicate = !!ticketNumber && existingTicketSet.has(ticketNumber.toLowerCase());
    if (isDuplicate) {
      warnings.push(`Ticket ${ticketNumber} already exists in database`);
    }

    const mappedTicket: Partial<BreakdownTicket> = {
      id: `TKT-IMP-${Date.now()}-${idx}`,
      ticketNumber: ticketNumber || `TKT-IMP-${idx + 1}`,
      breakdownDate: validDate,
      breakdownTime: getVal(mapping.breakdownTime) || '08:00',
      machineId: machineId || 'UNKNOWN-MC',
      machineName: getVal(mapping.machineName) || machineId,
      customerName: getVal(mapping.customerName) || 'General Machining',
      faultCategory: (getVal(mapping.faultCategory) as any) || 'Mechanical failure',
      alarmCode: getVal(mapping.alarmCode) || '',
      alarmMessage: getVal(mapping.alarmMessage) || '',
      faultDescription: faultDescription || 'Historical imported breakdown record',
      severityLevel: (getVal(mapping.severityLevel).toLowerCase() as any) || 'medium',
      technicianAssigned: getVal(mapping.technicianAssigned) || 'Unassigned',
      status: (getVal(mapping.status) as any) || 'Closed',
      totalDowntimeMinutes: Number(getVal(mapping.totalDowntimeMinutes)) || 60,
      rootCause: getVal(mapping.rootCause) || 'Historical record',
      correctiveAction: getVal(mapping.correctiveAction) || 'Repaired as per standard procedures',
      breakdownStart: validDate ? `${validDate}T08:00:00Z` : new Date().toISOString(),
      photographs: [],
      timestampAuditLog: [],
      sparePartsUsed: [],
      statusHistory: [
        {
          status: 'Closed',
          timestamp: new Date().toISOString(),
          changedBy: 'System Import',
          note: 'Imported from historical spreadsheet'
        }
      ],
      preRestartChecklist: {
        spindleRunTest: true,
        emergencyStopVerified: true,
        axisInterlockTested: true,
        lubricationPressureChecked: true,
        coolantFlowTested: true,
        guardInterlocksSafe: true,
        trialPartCutPassed: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      rowNumber: idx + 1,
      data: row,
      mappedTicket,
      isValid: errors.length === 0,
      isDuplicate,
      errors,
      warnings
    };
  });
}

// Export tickets to CSV or Excel XLSX
export function exportTicketsToFile(tickets: BreakdownTicket[], format: 'csv' | 'xlsx'): void {
  const exportData = tickets.map(t => ({
    'Ticket Number': t.ticketNumber,
    'Breakdown Date': t.breakdownDate,
    'Breakdown Time': t.breakdownTime,
    'Machine ID': t.machineId,
    'Machine Name': t.machineName,
    'Customer': t.customerName,
    'Factory': t.factory,
    'Shift': t.shift,
    'Severity': t.severityLevel,
    'Status': t.status,
    'Fault Category': t.faultCategory,
    'Alarm Code': t.alarmCode,
    'Alarm Message': t.alarmMessage,
    'Description': t.faultDescription,
    'Downtime (Minutes)': t.totalDowntimeMinutes,
    'Downtime (Hours)': (t.totalDowntimeMinutes / 60).toFixed(2),
    'Technician Assigned': t.technicianAssigned,
    'Root Cause': t.rootCause || '',
    'Corrective Action': t.correctiveAction || '',
    'Closed Date': t.closureDate || '',
    'Warranty Claim': t.isWarrantyClaim ? 'YES' : 'NO'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Breakdown Records');

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `DN_Solutions_Breakdown_Report_${timestamp}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}
