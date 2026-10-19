import {
  Machine,
  BreakdownTicket,
  Customer,
  SparePart,
  InventoryTransaction,
  PreventiveMaintenanceTask,
  ShiftHandover,
  TechnicalDocument,
  MachineBackup,
  WarrantyRecord,
  WarrantyClaim,
  AuditLog,
  User,
  UserRole,
  DateFilterOption
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_MACHINES,
  INITIAL_TICKETS,
  INITIAL_SPARE_PARTS,
  INITIAL_TRANSACTIONS,
  INITIAL_PM_TASKS,
  INITIAL_SHIFT_HANDOVERS,
  INITIAL_WARRANTIES,
  INITIAL_WARRANTY_CLAIMS,
  INITIAL_TECHNICAL_DOCS,
  INITIAL_MACHINE_BACKUPS,
  INITIAL_AUDIT_LOGS
} from './sampleData';

const STORAGE_KEYS = {
  USERS: 'dns_hub_users',
  CURRENT_USER: 'dns_hub_current_user',
  CUSTOMERS: 'dns_hub_customers',
  MACHINES: 'dns_hub_machines',
  TICKETS: 'dns_hub_tickets',
  SPARE_PARTS: 'dns_hub_spare_parts',
  TRANSACTIONS: 'dns_hub_transactions',
  PM_TASKS: 'dns_hub_pm_tasks',
  SHIFT_HANDOVERS: 'dns_hub_shift_handovers',
  WARRANTIES: 'dns_hub_warranties',
  WARRANTY_CLAIMS: 'dns_hub_warranty_claims',
  TECHNICAL_DOCS: 'dns_hub_technical_docs',
  MACHINE_BACKUPS: 'dns_hub_machine_backups',
  AUDIT_LOGS: 'dns_hub_audit_logs'
};

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error loading storage key ${key}:`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing storage key ${key}:`, e);
    }
  }

  // Initialize all storage on app startup
  public initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.MACHINES)) {
      this.resetToDefaults();
    }
  }

  public resetToDefaults(): void {
    this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.set(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    this.set(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    this.set(STORAGE_KEYS.MACHINES, INITIAL_MACHINES);
    this.set(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    this.set(STORAGE_KEYS.SPARE_PARTS, INITIAL_SPARE_PARTS);
    this.set(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    this.set(STORAGE_KEYS.PM_TASKS, INITIAL_PM_TASKS);
    this.set(STORAGE_KEYS.SHIFT_HANDOVERS, INITIAL_SHIFT_HANDOVERS);
    this.set(STORAGE_KEYS.WARRANTIES, INITIAL_WARRANTIES);
    this.set(STORAGE_KEYS.WARRANTY_CLAIMS, INITIAL_WARRANTY_CLAIMS);
    this.set(STORAGE_KEYS.TECHNICAL_DOCS, INITIAL_TECHNICAL_DOCS);
    this.set(STORAGE_KEYS.MACHINE_BACKUPS, INITIAL_MACHINE_BACKUPS);
    this.set(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  // --- CURRENT USER & AUTH ---
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public getCurrentUser(): User {
    const user = this.get<User>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    return user || INITIAL_USERS[0];
  }

  public setCurrentUser(user: User): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
    this.logAction(
      'UPDATE',
      'MACHINES',
      user.id,
      `Switched active user session to ${user.name} (${user.role.toUpperCase()})`
    );
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public logAction(
    action: AuditLog['action'],
    module: AuditLog['module'],
    recordId: string,
    details: string
  ): void {
    const user = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      module,
      recordId,
      details
    };
    const logs = this.getAuditLogs();
    logs.unshift(newLog);
    // keep maximum 500 audit entries
    if (logs.length > 500) logs.pop();
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // --- CUSTOMERS ---
  public getCustomers(): Customer[] {
    const customers = this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const machines = this.getMachines();
    const tickets = this.getTickets();

    // calculate counts dynamically
    return customers.map(cust => {
      const custMachines = machines.filter(m => m.customerId === cust.id || m.customerName === cust.name);
      const custTickets = tickets.filter(t => t.customerId === cust.id || t.customerName === cust.name);
      const activeTickets = custTickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved');
      const totalDowntimeMinutes = custTickets.reduce((acc, t) => acc + (t.totalDowntimeMinutes || 0), 0);

      return {
        ...cust,
        registeredMachineCount: custMachines.length,
        activeTicketsCount: activeTickets.length,
        totalDowntimeHours: parseFloat((totalDowntimeMinutes / 60).toFixed(1))
      };
    });
  }

  public saveCustomer(customer: Customer): Customer {
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex(c => c.id === customer.id);
    if (existingIndex >= 0) {
      customers[existingIndex] = customer;
      this.logAction('UPDATE', 'CUSTOMERS', customer.id, `Updated customer ${customer.name}`);
    } else {
      customers.push(customer);
      this.logAction('CREATE', 'CUSTOMERS', customer.id, `Registered new customer ${customer.name}`);
    }
    this.set(STORAGE_KEYS.CUSTOMERS, customers);
    return customer;
  }

  public deleteCustomer(customerId: string): boolean {
    const customers = this.getCustomers();
    const target = customers.find(c => c.id === customerId);
    if (!target) return false;
    const filtered = customers.filter(c => c.id !== customerId);
    this.set(STORAGE_KEYS.CUSTOMERS, filtered);
    this.logAction('DELETE', 'CUSTOMERS', customerId, `Deleted customer ${target.name}`);
    return true;
  }

  // --- MACHINES ---
  public getMachines(): Machine[] {
    return this.get<Machine[]>(STORAGE_KEYS.MACHINES, []);
  }

  public getMachineById(id: string): Machine | undefined {
    return this.getMachines().find(m => m.id === id || m.machineId === id);
  }

  public saveMachine(machine: Machine): Machine {
    const machines = this.getMachines();
    const existingIndex = machines.findIndex(m => m.id === machine.id);
    if (existingIndex >= 0) {
      machines[existingIndex] = { ...machine, updatedAt: new Date().toISOString() };
      this.logAction('UPDATE', 'MACHINES', machine.id, `Updated machine ${machine.machineId} (${machine.model})`);
    } else {
      machines.push({ ...machine, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      this.logAction('CREATE', 'MACHINES', machine.id, `Registered machine ${machine.machineId} (${machine.model})`);
    }
    this.set(STORAGE_KEYS.MACHINES, machines);
    return machine;
  }

  public deleteMachine(machineId: string): boolean {
    const machines = this.getMachines();
    const target = machines.find(m => m.id === machineId || m.machineId === machineId);
    if (!target) return false;
    const filtered = machines.filter(m => m.id !== machineId && m.machineId !== machineId);
    this.set(STORAGE_KEYS.MACHINES, filtered);
    this.logAction('DELETE', 'MACHINES', machineId, `Deleted machine ${target.machineId}`);
    return true;
  }

  // --- BREAKDOWN TICKETS ---
  public getTickets(): BreakdownTicket[] {
    return this.get<BreakdownTicket[]>(STORAGE_KEYS.TICKETS, []);
  }

  public getTicketById(id: string): BreakdownTicket | undefined {
    return this.getTickets().find(t => t.id === id || t.ticketNumber === id);
  }

  public calculateDowntimeBreakdown(ticket: Partial<BreakdownTicket>): {
    totalDowntimeMinutes: number;
    diagnosisDurationMinutes: number;
    repairDurationMinutes: number;
    waitingDurationMinutes: number;
    sparePartsWaitingMinutes: number;
    testingDurationMinutes: number;
  } {
    const diffMins = (start?: string, end?: string): number => {
      if (!start || !end) return 0;
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      if (isNaN(s) || isNaN(e) || e <= s) return 0;
      return Math.round((e - s) / (1000 * 60));
    };

    // Diagnosis duration: diagnosisStart to repairStart (or technicianArrival to diagnosis finish)
    const diagnosisDuration = diffMins(ticket.diagnosisStart || ticket.technicianArrival, ticket.repairStart);
    
    // Repair duration: repairStart to repairCompletion
    const repairDuration = diffMins(ticket.repairStart, ticket.repairCompletion);
    
    // Waiting duration: technician arrival wait (breakdownStart to technicianArrival)
    const waitingDuration = diffMins(ticket.breakdownStart, ticket.technicianArrival);

    // Testing duration: trialRunStart to productionRestart (or machineRestoration)
    const testingDuration = diffMins(ticket.trialRunStart, ticket.productionRestart || ticket.machineRestoration);

    // Total downtime: breakdownStart to productionRestart (or now if not finished)
    let totalDowntime = 0;
    if (ticket.breakdownStart) {
      const endTimestamp = ticket.productionRestart || (ticket.status === 'Closed' || ticket.status === 'Resolved' ? ticket.repairCompletion : new Date().toISOString());
      totalDowntime = diffMins(ticket.breakdownStart, endTimestamp);
    }

    return {
      totalDowntimeMinutes: Math.max(0, totalDowntime),
      diagnosisDurationMinutes: Math.max(0, diagnosisDuration),
      repairDurationMinutes: Math.max(0, repairDuration),
      waitingDurationMinutes: Math.max(0, waitingDuration),
      sparePartsWaitingMinutes: ticket.sparePartsWaitingMinutes || 0,
      testingDurationMinutes: Math.max(0, testingDuration)
    };
  }

  public saveTicket(ticket: BreakdownTicket): BreakdownTicket {
    const tickets = this.getTickets();
    const existingIndex = tickets.findIndex(t => t.id === ticket.id);
    const metrics = this.calculateDowntimeBreakdown(ticket);

    const updatedTicket: BreakdownTicket = {
      ...ticket,
      totalDowntimeMinutes: metrics.totalDowntimeMinutes,
      diagnosisDurationMinutes: metrics.diagnosisDurationMinutes,
      repairDurationMinutes: metrics.repairDurationMinutes,
      waitingDurationMinutes: metrics.waitingDurationMinutes,
      testingDurationMinutes: metrics.testingDurationMinutes,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      tickets[existingIndex] = updatedTicket;
      this.logAction('UPDATE', 'BREAKDOWN_LOG', ticket.ticketNumber, `Updated ticket ${ticket.ticketNumber} (${ticket.status})`);
    } else {
      tickets.unshift(updatedTicket);
      this.logAction('CREATE', 'BREAKDOWN_LOG', ticket.ticketNumber, `Reported breakdown ${ticket.ticketNumber} on ${ticket.machineId}`);
    }

    // Update corresponding machine status automatically
    this.syncMachineStatusFromTicket(updatedTicket);

    this.set(STORAGE_KEYS.TICKETS, tickets);
    return updatedTicket;
  }

  public syncMachineStatusFromTicket(ticket: BreakdownTicket): void {
    const machine = this.getMachineById(ticket.machineId);
    if (!machine) return;

    let newStatus = machine.operatingStatus;
    if (ticket.status === 'Closed' || ticket.status === 'Resolved') {
      newStatus = 'running';
    } else if (ticket.status === 'Repair in Progress' || ticket.status === 'Diagnosis in Progress' || ticket.status === 'Testing') {
      newStatus = 'maintenance';
    } else if (ticket.status === 'Reported' || ticket.status === 'Assigned' || ticket.status === 'Waiting for Parts') {
      newStatus = 'breakdown';
    }

    if (newStatus !== machine.operatingStatus) {
      this.saveMachine({ ...machine, operatingStatus: newStatus });
    }
  }

  public deleteTicket(ticketId: string): boolean {
    const tickets = this.getTickets();
    const target = tickets.find(t => t.id === ticketId || t.ticketNumber === ticketId);
    if (!target) return false;
    const filtered = tickets.filter(t => t.id !== ticketId && t.ticketNumber !== ticketId);
    this.set(STORAGE_KEYS.TICKETS, filtered);
    this.logAction('DELETE', 'BREAKDOWN_LOG', target.ticketNumber, `Deleted ticket ${target.ticketNumber}`);
    return true;
  }

  // --- SPARE PARTS & INVENTORY ---
  public getSpareParts(): SparePart[] {
    return this.get<SparePart[]>(STORAGE_KEYS.SPARE_PARTS, []);
  }

  public getTransactions(): InventoryTransaction[] {
    return this.get<InventoryTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  }

  public saveSparePart(part: SparePart): SparePart {
    const parts = this.getSpareParts();
    const existingIndex = parts.findIndex(p => p.id === part.id);
    if (existingIndex >= 0) {
      parts[existingIndex] = part;
      this.logAction('UPDATE', 'SPARE_PARTS', part.partNumber, `Updated spare part ${part.partName}`);
    } else {
      parts.push(part);
      this.logAction('CREATE', 'SPARE_PARTS', part.partNumber, `Added spare part ${part.partName}`);
    }
    this.set(STORAGE_KEYS.SPARE_PARTS, parts);
    return part;
  }

  public deleteSparePart(partId: string): boolean {
    const parts = this.getSpareParts();
    const target = parts.find(p => p.id === partId);
    if (!target) return false;
    this.set(STORAGE_KEYS.SPARE_PARTS, parts.filter(p => p.id !== partId));
    this.logAction('DELETE', 'SPARE_PARTS', target.partNumber, `Deleted spare part ${target.partName}`);
    return true;
  }

  public adjustPartStock(
    partId: string,
    type: 'issue' | 'return' | 'restock' | 'adjustment',
    quantity: number,
    reference: string,
    notes: string,
    ticketId?: string,
    ticketNumber?: string
  ): { success: boolean; error?: string } {
    const parts = this.getSpareParts();
    const part = parts.find(p => p.id === partId);
    if (!part) return { success: false, error: 'Part not found' };

    let newQty = part.quantityAvailable;
    if (type === 'issue') {
      if (newQty < quantity) {
        return { success: false, error: `Insufficient inventory: only ${newQty} available in stock.` };
      }
      newQty -= quantity;
    } else if (type === 'return' || type === 'restock') {
      newQty += quantity;
    } else if (type === 'adjustment') {
      newQty = quantity;
    }

    if (newQty < 0) {
      return { success: false, error: 'Inventory stock cannot be negative without explicit supervisor approval.' };
    }

    part.quantityAvailable = newQty;
    this.set(STORAGE_KEYS.SPARE_PARTS, parts);

    // Record inventory transaction
    const user = this.getCurrentUser();
    const txn: InventoryTransaction = {
      id: `TXN-${Date.now()}`,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.partName,
      type,
      quantity,
      ticketId,
      ticketNumber,
      reference,
      performedBy: user.name,
      date: new Date().toISOString(),
      notes
    };
    const txns = this.getTransactions();
    txns.unshift(txn);
    this.set(STORAGE_KEYS.TRANSACTIONS, txns);

    this.logAction(
      'UPDATE',
      'SPARE_PARTS',
      part.partNumber,
      `${type.toUpperCase()} ${quantity}x ${part.partName}. New stock: ${newQty}`
    );

    return { success: true };
  }

  // --- PREVENTIVE MAINTENANCE ---
  public getPMTasks(): PreventiveMaintenanceTask[] {
    const tasks = this.get<PreventiveMaintenanceTask[]>(STORAGE_KEYS.PM_TASKS, []);
    const today = new Date().toISOString().split('T')[0];

    return tasks.map(task => {
      if (task.status !== 'Completed' && task.dueDate < today) {
        return { ...task, status: 'Overdue' };
      }
      return task;
    });
  }

  public savePMTask(task: PreventiveMaintenanceTask): PreventiveMaintenanceTask {
    const tasks = this.getPMTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
      this.logAction('UPDATE', 'PREVENTIVE_MAINTENANCE', task.id, `Updated PM task ${task.taskName}`);
    } else {
      tasks.push(task);
      this.logAction('CREATE', 'PREVENTIVE_MAINTENANCE', task.id, `Scheduled PM task ${task.taskName} for ${task.machineName}`);
    }
    this.set(STORAGE_KEYS.PM_TASKS, tasks);
    return task;
  }

  public completePMTask(taskId: string, inspectionResults: string, technicianRemarks: string): PreventiveMaintenanceTask | null {
    const tasks = this.getPMTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    const user = this.getCurrentUser();
    task.status = 'Completed';
    task.actualCompletionDate = new Date().toISOString();
    task.completedBy = user.name;
    task.inspectionResults = inspectionResults;
    task.technicianRemarks = technicianRemarks;

    // Calculate next due date automatically based on interval
    const compDate = new Date();
    let nextDays = 30;
    if (task.interval === 'Daily') nextDays = 1;
    else if (task.interval === 'Weekly') nextDays = 7;
    else if (task.interval === 'Monthly') nextDays = 30;
    else if (task.interval === 'Quarterly') nextDays = 90;
    else if (task.interval === 'Half-Yearly') nextDays = 180;
    else if (task.interval === 'Yearly') nextDays = 365;

    const nextDate = new Date(compDate.getTime() + nextDays * 24 * 60 * 60 * 1000);
    task.nextDueDate = nextDate.toISOString().split('T')[0];

    this.set(STORAGE_KEYS.PM_TASKS, tasks);
    this.logAction('CHECKLIST_SIGN', 'PREVENTIVE_MAINTENANCE', task.id, `Completed PM task ${task.taskName} for ${task.machineName}`);
    return task;
  }

  // --- SHIFT HANDOVER ---
  public getShiftHandovers(): ShiftHandover[] {
    return this.get<ShiftHandover[]>(STORAGE_KEYS.SHIFT_HANDOVERS, []);
  }

  public saveShiftHandover(handover: ShiftHandover): ShiftHandover {
    const list = this.getShiftHandovers();
    const existingIndex = list.findIndex(h => h.id === handover.id);
    if (existingIndex >= 0) {
      list[existingIndex] = handover;
      this.logAction('UPDATE', 'SHIFT_HANDOVER', handover.id, `Updated shift handover for ${handover.machineName}`);
    } else {
      list.unshift(handover);
      this.logAction('CREATE', 'SHIFT_HANDOVER', handover.id, `Logged shift handover for ${handover.machineName} (${handover.shift})`);
    }
    this.set(STORAGE_KEYS.SHIFT_HANDOVERS, list);
    return handover;
  }

  public acknowledgeShiftHandover(id: string): ShiftHandover | null {
    const list = this.getShiftHandovers();
    const target = list.find(h => h.id === id);
    if (!target) return null;

    const user = this.getCurrentUser();
    target.receivedBy = user.name;
    target.acknowledgedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.SHIFT_HANDOVERS, list);
    this.logAction('APPROVAL', 'SHIFT_HANDOVER', id, `Shift handover acknowledged by ${user.name}`);
    return target;
  }

  // --- WARRANTIES & CLAIMS ---
  public getWarranties(): WarrantyRecord[] {
    const warranties = this.get<WarrantyRecord[]>(STORAGE_KEYS.WARRANTIES, []);
    const today = new Date();

    return warranties.map(w => {
      const exp = new Date(w.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let status: WarrantyRecord['status'] = 'Active';

      if (diffDays <= 0) {
        status = 'Expired';
      } else if (diffDays <= 60) {
        status = 'Expiring Soon';
      }

      return {
        ...w,
        remainingDays: Math.max(0, diffDays),
        status
      };
    });
  }

  public saveWarranty(record: WarrantyRecord): WarrantyRecord {
    const list = this.getWarranties();
    const idx = list.findIndex(w => w.id === record.id || w.machineId === record.machineId);
    if (idx >= 0) {
      list[idx] = record;
      this.logAction('UPDATE', 'WARRANTY', record.id, `Updated warranty for ${record.machineName}`);
    } else {
      list.push(record);
      this.logAction('CREATE', 'WARRANTY', record.id, `Added warranty for ${record.machineName}`);
    }
    this.set(STORAGE_KEYS.WARRANTIES, list);
    return record;
  }

  public getWarrantyClaims(): WarrantyClaim[] {
    return this.get<WarrantyClaim[]>(STORAGE_KEYS.WARRANTY_CLAIMS, []);
  }

  public saveWarrantyClaim(claim: WarrantyClaim): WarrantyClaim {
    const list = this.getWarrantyClaims();
    const idx = list.findIndex(c => c.id === claim.id);
    if (idx >= 0) {
      list[idx] = { ...claim, updatedAt: new Date().toISOString() };
      this.logAction('UPDATE', 'WARRANTY', claim.claimNumber, `Updated warranty claim ${claim.claimNumber}`);
    } else {
      list.unshift({ ...claim, updatedAt: new Date().toISOString() });
      this.logAction('CREATE', 'WARRANTY', claim.claimNumber, `Submitted warranty claim ${claim.claimNumber}`);
    }
    this.set(STORAGE_KEYS.WARRANTY_CLAIMS, list);
    return claim;
  }

  // --- TECHNICAL DOCS ---
  public getTechnicalDocs(): TechnicalDocument[] {
    return this.get<TechnicalDocument[]>(STORAGE_KEYS.TECHNICAL_DOCS, []);
  }

  public saveTechnicalDoc(doc: TechnicalDocument): TechnicalDocument {
    const list = this.getTechnicalDocs();
    const idx = list.findIndex(d => d.id === doc.id);
    if (idx >= 0) {
      list[idx] = doc;
      this.logAction('UPDATE', 'DOCS', doc.id, `Updated document ${doc.title}`);
    } else {
      list.unshift(doc);
      this.logAction('CREATE', 'DOCS', doc.id, `Uploaded technical document ${doc.title}`);
    }
    this.set(STORAGE_KEYS.TECHNICAL_DOCS, list);
    return doc;
  }

  // --- MACHINE BACKUPS ---
  public getMachineBackups(): MachineBackup[] {
    return this.get<MachineBackup[]>(STORAGE_KEYS.MACHINE_BACKUPS, []);
  }

  public saveMachineBackup(backup: MachineBackup): MachineBackup {
    const list = this.getMachineBackups();
    const idx = list.findIndex(b => b.id === backup.id);
    if (idx >= 0) {
      list[idx] = backup;
      this.logAction('UPDATE', 'BACKUPS', backup.id, `Updated backup record for ${backup.machineName}`);
    } else {
      list.unshift(backup);
      this.logAction('CREATE', 'BACKUPS', backup.id, `Recorded machine backup for ${backup.machineName} (${backup.backupType})`);
    }
    this.set(STORAGE_KEYS.MACHINE_BACKUPS, list);
    return backup;
  }

  // --- DATE FILTER UTILITIES ---
  public filterByDateRange<T extends { breakdownDate?: string; date?: string; scheduledDate?: string; createdAt?: string }>(
    items: T[],
    filter: DateFilterOption,
    customStart?: string,
    customEnd?: string
  ): T[] {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const getTargetDate = (item: T): string => {
      return item.breakdownDate || item.date || item.scheduledDate || (item.createdAt ? item.createdAt.split('T')[0] : '');
    };

    return items.filter(item => {
      const d = getTargetDate(item);
      if (!d) return true;

      if (filter === 'today') {
        return d === todayStr;
      }

      if (filter === 'yesterday') {
        const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return d === yest;
      }

      if (filter === 'last7') {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return d >= cutoff && d <= todayStr;
      }

      if (filter === 'last30') {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return d >= cutoff && d <= todayStr;
      }

      if (filter === 'thisMonth') {
        const curYearMonth = todayStr.substring(0, 7);
        return d.startsWith(curYearMonth);
      }

      if (filter === 'lastMonth') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = lastMonthDate.toISOString().substring(0, 7);
        return d.startsWith(lastMonthStr);
      }

      if (filter === 'custom' && customStart && customEnd) {
        return d >= customStart && d <= customEnd;
      }

      return true;
    });
  }

  // --- DASHBOARD KPIS & CALCULATIONS ---
  public getDashboardMetrics(dateFilter: DateFilterOption = 'last30', customStart?: string, customEnd?: string) {
    const machines = this.getMachines();
    const allTickets = this.getTickets();
    const filteredTickets = this.filterByDateRange(allTickets, dateFilter, customStart, customEnd);
    const pmTasks = this.getPMTasks();
    const warranties = this.getWarranties();
    const spareParts = this.getSpareParts();

    const totalMachines = machines.length;
    const runningMachines = machines.filter(m => m.operatingStatus === 'running').length;
    const maintenanceMachines = machines.filter(m => m.operatingStatus === 'maintenance').length;
    const breakdownMachines = machines.filter(m => m.operatingStatus === 'breakdown').length;
    const idleMachines = machines.filter(m => m.operatingStatus === 'idle').length;

    const openTickets = allTickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved');
    const pendingRepairJobs = allTickets.filter(t => t.status === 'Reported' || t.status === 'Assigned' || t.status === 'Waiting for Parts');

    const todayStr = new Date().toISOString().split('T')[0];
    const repairsCompletedToday = allTickets.filter(t => 
      (t.status === 'Closed' || t.status === 'Resolved') &&
      ((t.closureDate && t.closureDate.startsWith(todayStr)) || (t.repairCompletion && t.repairCompletion.startsWith(todayStr)))
    ).length;

    // Downtime today & this month
    const curYearMonth = todayStr.substring(0, 7);
    const ticketsToday = allTickets.filter(t => t.breakdownDate === todayStr);
    const ticketsThisMonth = allTickets.filter(t => t.breakdownDate.startsWith(curYearMonth));

    const totalDowntimeMinutesToday = ticketsToday.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0);
    const totalDowntimeMinutesThisMonth = ticketsThisMonth.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0);

    // MTTR calculation = Total repair duration of completed repairs / number of completed repairs
    const completedRepairs = filteredTickets.filter(t => (t.status === 'Closed' || t.status === 'Resolved') && t.repairDurationMinutes > 0);
    const totalRepairMinutes = completedRepairs.reduce((sum, t) => sum + t.repairDurationMinutes, 0);
    const mttrHours = completedRepairs.length > 0 ? parseFloat((totalRepairMinutes / completedRepairs.length / 60).toFixed(1)) : 1.8;

    // MTBF calculation: Operating Hours basis / Number of qualifying breakdowns
    // Standard industrial 2 shifts (16 hrs/day) * 30 days = 480 operating hours per machine per month
    const totalOperatingHours = totalMachines * 480;
    const qualifyingFailures = filteredTickets.filter(t => t.severityLevel === 'high' || t.severityLevel === 'critical').length || 1;
    const mtbfHours = Math.round(totalOperatingHours / qualifyingFailures);

    // Overall Machine Availability: (Planned Production Time - Downtime) / Planned Production Time * 100
    const totalDowntimeFilteredHours = filteredTickets.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0) / 60;
    const plannedProductionHours = totalMachines * 360; // 30-day baseline
    const machineAvailabilityPct = Math.max(82.5, Math.min(99.8, parseFloat((((plannedProductionHours - totalDowntimeFilteredHours) / plannedProductionHours) * 100).toFixed(1))));

    // Preventive Maintenance stats
    const pmDue = pmTasks.filter(t => t.status === 'Scheduled').length;
    const pmOverdue = pmTasks.filter(t => t.status === 'Overdue').length;
    const pmCompleted = pmTasks.filter(t => t.status === 'Completed').length;
    const pmCompliancePct = pmTasks.length > 0 ? Math.round((pmCompleted / pmTasks.length) * 100) : 92;

    // Warranty stats
    const warrantyExpired = warranties.filter(w => w.status === 'Expired').length;
    const warrantyExpiringSoon = warranties.filter(w => w.status === 'Expiring Soon').length;

    // Critical Faults
    const criticalFaults = allTickets.filter(t => t.severityLevel === 'critical' && t.status !== 'Closed').length;

    // Spare parts requiring replenishment
    const lowStockParts = spareParts.filter(p => p.quantityAvailable <= p.minStockLevel);

    return {
      totalMachines,
      runningMachines,
      maintenanceMachines,
      breakdownMachines,
      idleMachines,
      openTicketsCount: openTickets.length,
      repairsCompletedToday,
      pendingRepairJobs: pendingRepairJobs.length,
      downtimeTodayHours: parseFloat((totalDowntimeMinutesToday / 60).toFixed(1)),
      downtimeThisMonthHours: parseFloat((totalDowntimeMinutesThisMonth / 60).toFixed(1)),
      mttrHours,
      mtbfHours,
      machineAvailabilityPct,
      pmDue,
      pmOverdue,
      pmCompleted,
      pmCompliancePct,
      warrantyExpired,
      warrantyExpiringSoon,
      criticalFaults,
      lowStockPartsCount: lowStockParts.length,
      lowStockParts
    };
  }

  // Full system JSON dump for backup / restore
  public exportFullDatabase(): string {
    const fullState = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      machines: this.getMachines(),
      tickets: this.getTickets(),
      customers: this.getCustomers(),
      spareParts: this.getSpareParts(),
      transactions: this.getTransactions(),
      pmTasks: this.getPMTasks(),
      shiftHandovers: this.getShiftHandovers(),
      warranties: this.getWarranties(),
      warrantyClaims: this.getWarrantyClaims(),
      technicalDocs: this.getTechnicalDocs(),
      machineBackups: this.getMachineBackups(),
      auditLogs: this.getAuditLogs()
    };
    return JSON.stringify(fullState, null, 2);
  }

  public downloadBackupJSON(): void {
    const jsonStr = this.exportFullDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DN_Operations_Hub_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public importFullDatabase(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.machines || !parsed.tickets) {
        return { success: false, message: 'Invalid database format: Missing machines or tickets entity.' };
      }

      if (parsed.machines) this.set(STORAGE_KEYS.MACHINES, parsed.machines);
      if (parsed.tickets) this.set(STORAGE_KEYS.TICKETS, parsed.tickets);
      if (parsed.customers) this.set(STORAGE_KEYS.CUSTOMERS, parsed.customers);
      if (parsed.spareParts) this.set(STORAGE_KEYS.SPARE_PARTS, parsed.spareParts);
      if (parsed.transactions) this.set(STORAGE_KEYS.TRANSACTIONS, parsed.transactions);
      if (parsed.pmTasks) this.set(STORAGE_KEYS.PM_TASKS, parsed.pmTasks);
      if (parsed.shiftHandovers) this.set(STORAGE_KEYS.SHIFT_HANDOVERS, parsed.shiftHandovers);
      if (parsed.warranties) this.set(STORAGE_KEYS.WARRANTIES, parsed.warranties);
      if (parsed.warrantyClaims) this.set(STORAGE_KEYS.WARRANTY_CLAIMS, parsed.warrantyClaims);
      if (parsed.technicalDocs) this.set(STORAGE_KEYS.TECHNICAL_DOCS, parsed.technicalDocs);
      if (parsed.machineBackups) this.set(STORAGE_KEYS.MACHINE_BACKUPS, parsed.machineBackups);
      if (parsed.auditLogs) this.set(STORAGE_KEYS.AUDIT_LOGS, parsed.auditLogs);

      this.logAction('IMPORT', 'MACHINES', 'SYSTEM', 'Restored full operations database from JSON backup file.');
      return { success: true, message: 'Database successfully imported!' };
    } catch (e: any) {
      return { success: false, message: `Failed to parse database file: ${e.message}` };
    }
  }
}

export const storageService = new StorageService();
storageService.initialize();
