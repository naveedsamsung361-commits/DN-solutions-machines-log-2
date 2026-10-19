import { 
  SystemNotification, 
  NotificationSettings, 
  BreakdownTicket, 
  Machine, 
  PreventiveMaintenanceTask, 
  SparePart, 
  ShiftHandover 
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'dns_hub_notification_settings',
  ACKNOWLEDGED: 'dns_hub_acknowledged_alerts',
  DISMISSED_TOASTS: 'dns_hub_dismissed_toasts',
  LAST_TRIGGERED: 'dns_hub_last_triggered_timestamps'
};

const DEFAULT_SETTINGS: NotificationSettings = {
  browserNotificationsEnabled: true,
  soundAlertsEnabled: true,
  criticalBreakdownAlerts: true,
  warrantyExpirationAlerts: true,
  pmOverdueAlerts: true,
  lowInventoryAlerts: true
};

type AlertListener = (notification: SystemNotification) => void;
type ChangeListener = () => void;

class NotificationService {
  private alertListeners: Set<AlertListener> = new Set();
  private changeListeners: Set<ChangeListener> = new Set();
  private audioCtx: AudioContext | null = null;

  // --- AUDIO SYNTHESIS VIA WEB AUDIO API ---
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (e) {
      console.warn('Web Audio API not initialized:', e);
      return null;
    }
  }

  public playCriticalAlarmSound(): void {
    const settings = this.getSettings();
    if (!settings.soundAlertsEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Industrial double-pulse urgent tone (880Hz to 660Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      // Pulse 1
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(660, now + 0.12);
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(660, now + 0.12);

      // Pulse 2
      osc1.frequency.setValueAtTime(880, now + 0.18);
      osc1.frequency.exponentialRampToValueAtTime(660, now + 0.32);
      osc2.frequency.setValueAtTime(880, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(660, now + 0.32);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + 0.14);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.18);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.36);
      osc2.stop(now + 0.36);
    } catch (e) {
      console.warn('Audio playback suppressed or not allowed yet:', e);
    }
  }

  public playWarningChime(): void {
    const settings = this.getSettings();
    if (!settings.soundAlertsEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Pleasant rising double chime (587.33Hz -> 880Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.15); // A5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio playback suppressed or not allowed yet:', e);
    }
  }

  // --- BROWSER SYSTEM NOTIFICATION API ---
  public isBrowserNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getBrowserPermission(): NotificationPermission {
    if (!this.isBrowserNotificationSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestBrowserPermission(): Promise<NotificationPermission> {
    if (!this.isBrowserNotificationSupported()) return 'denied';
    try {
      const result = await Notification.requestPermission();
      this.notifyChanges();
      return result;
    } catch (e) {
      console.error('Failed to request notification permission:', e);
      return 'denied';
    }
  }

  public sendBrowserNotification(
    title: string, 
    options?: {
      body?: string;
      tag?: string;
      data?: unknown;
      onClick?: () => void;
    }
  ): Notification | null {
    if (!this.isBrowserNotificationSupported()) return null;
    const settings = this.getSettings();
    if (!settings.browserNotificationsEnabled) return null;

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: options?.body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: options?.tag,
          requireInteraction: true
        });

        if (options?.onClick) {
          notif.onclick = () => {
            window.focus();
            options.onClick?.();
            notif.close();
          };
        }

        // Auto close after 10 seconds if not interacted
        setTimeout(() => {
          try { notif.close(); } catch { /* ignore */ }
        }, 10000);

        return notif;
      } catch (e) {
        console.warn('Browser notification failed to display:', e);
        return null;
      }
    }
    return null;
  }

  // --- SETTINGS & ACKNOWLEDGMENT PERSISTENCE ---
  public getSettings(): NotificationSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: Partial<NotificationSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.notifyChanges();
  }

  public getAcknowledgedIds(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACKNOWLEDGED);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public acknowledgeAlert(id: string, userName?: string): void {
    const list = this.getAcknowledgedIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(STORAGE_KEYS.ACKNOWLEDGED, JSON.stringify(list));
      this.notifyChanges();
    }
  }

  public clearAllAcknowledged(): void {
    localStorage.setItem(STORAGE_KEYS.ACKNOWLEDGED, JSON.stringify([]));
    this.notifyChanges();
  }

  public isAlertAcknowledged(id: string): boolean {
    return this.getAcknowledgedIds().includes(id);
  }

  // --- EVALUATION ENGINE ---

  /**
   * Evaluates all active records and compiles the list of notifications.
   */
  public evaluateSystemAlerts(
    tickets: BreakdownTicket[],
    machines: Machine[],
    pmTasks: PreventiveMaintenanceTask[] = [],
    spareParts: SparePart[] = [],
    handovers: ShiftHandover[] = []
  ): SystemNotification[] {
    const notifications: SystemNotification[] = [];
    const acknowledgedIds = this.getAcknowledgedIds();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Critical Breakdown Tickets
    const criticalTickets = tickets.filter(t => 
      t.severityLevel === 'critical' && 
      t.status !== 'Closed' && 
      t.status !== 'Resolved'
    );

    for (const ticket of criticalTickets) {
      const id = `crit_tkt_${ticket.id}`;
      notifications.push({
        id,
        type: 'critical_breakdown',
        severity: 'critical',
        title: `CRITICAL BREAKDOWN: ${ticket.machineId} (${ticket.machineModel})`,
        message: `Ticket #${ticket.ticketNumber} marked CRITICAL. ${ticket.alarmCode ? `[${ticket.alarmCode}] ` : ''}${ticket.faultDescription} — Impact: ${ticket.productionImpact.replace('_', ' ').toUpperCase()}`,
        timestamp: ticket.breakdownDate ? `${ticket.breakdownDate}T${ticket.breakdownTime || '00:00'}:00Z` : ticket.createdAt,
        linkedRecordType: 'ticket',
        linkedRecordId: ticket.id,
        suggestedAction: 'Immediate technician intervention required. Inspect spindle/controller alarms & verify safety interlocks.',
        actionLabel: 'View Breakdown Ticket',
        acknowledged: acknowledgedIds.includes(id),
        meta: {
          alarmCode: ticket.alarmCode,
          productionImpact: ticket.productionImpact,
          machineName: ticket.machineName
        }
      });
    }

    // 2. Machine Warranties Expiring within 30 Days (or Expired)
    for (const machine of machines) {
      if (!machine.warrantyExpiryDate) continue;

      const expiryDate = new Date(machine.warrantyExpiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        const id = `war_exp_${machine.id}`;
        const isExpired = diffDays < 0;
        const isUrgent = diffDays >= 0 && diffDays <= 7;

        notifications.push({
          id,
          type: 'warranty_expiring',
          severity: isUrgent ? 'critical' : 'warning',
          title: isExpired 
            ? `WARRANTY EXPIRED: ${machine.machineId} (${machine.model})`
            : `WARRANTY EXPIRING IN ${diffDays} DAY(S): ${machine.machineId}`,
          message: isExpired
            ? `Machine ${machine.machineName} warranty expired on ${machine.warrantyExpiryDate} (${Math.abs(diffDays)} days ago). Repairs require authorized service contract quotation.`
            : `Factory warranty for ${machine.machineName} (${machine.model}, S/N: ${machine.serialNumber}) expires on ${machine.warrantyExpiryDate}. File any pending OEM claims before coverage lapses.`,
          timestamp: machine.updatedAt || new Date().toISOString(),
          linkedRecordType: 'machine',
          linkedRecordId: machine.id,
          suggestedAction: isExpired 
            ? 'Request service level agreement (SLA) renewal from DN Solutions.' 
            : 'Audit active tickets for OEM warranty claim submissions & schedule pre-expiration inspection.',
          actionLabel: 'View Machine Profile',
          acknowledged: acknowledgedIds.includes(id),
          meta: {
            daysRemaining: diffDays,
            machineName: machine.machineName
          }
        });
      }
    }

    // 3. Preventive Maintenance Overdue
    const overduePMs = pmTasks.filter(pm => {
      if (pm.status === 'Completed') return false;
      if (pm.status === 'Overdue') return true;
      if (pm.dueDate) {
        const due = new Date(pm.dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
      }
      return false;
    });

    for (const pm of overduePMs) {
      const id = `pm_overdue_${pm.id}`;
      notifications.push({
        id,
        type: 'pm_overdue',
        severity: 'warning',
        title: `OVERDUE PM: ${pm.taskName} (${pm.machineName})`,
        message: `Scheduled maintenance for ${pm.machineName} was due on ${pm.dueDate}. Interval: ${pm.interval}. Assigned: ${pm.assignedTechnician || 'Unassigned'}.`,
        timestamp: pm.scheduledDate ? `${pm.scheduledDate}T08:00:00Z` : new Date().toISOString(),
        linkedRecordType: 'pm',
        linkedRecordId: pm.id,
        suggestedAction: 'Execute required checklist items, verify lubrication levels, and sign off task.',
        actionLabel: 'Open PM Schedule',
        acknowledged: acknowledgedIds.includes(id),
        meta: {
          machineName: pm.machineName
        }
      });
    }

    // 4. Low and Out-of-Stock Spare Parts
    const lowStockParts = spareParts.filter(p => p.quantityAvailable <= p.minStockLevel);
    for (const part of lowStockParts) {
      const id = `part_low_${part.id}`;
      const isZero = part.quantityAvailable <= 0;
      notifications.push({
        id,
        type: 'low_inventory',
        severity: isZero ? 'critical' : 'warning',
        title: isZero 
          ? `OUT OF STOCK: ${part.partNumber} (${part.partName})` 
          : `LOW STOCK ALERT: ${part.partNumber} (${part.quantityAvailable} left)`,
        message: `Inventory balance for ${part.partName} (${part.category}) has reached ${part.quantityAvailable} unit(s). Minimum threshold is ${part.minStockLevel}. Lead time: ${part.leadTimeDays} days.`,
        timestamp: new Date().toISOString(),
        linkedRecordType: 'part',
        linkedRecordId: part.id,
        suggestedAction: `Issue purchase requisition to supplier ${part.supplier || 'OEM Parts Desk'}.`,
        actionLabel: 'Open Inventory',
        acknowledged: acknowledgedIds.includes(id)
      });
    }

    // 5. Unacknowledged Shift Handovers (last 24 hours)
    const unacknowledgedHandovers = handovers.filter(h => !h.acknowledgedAt);
    for (const handover of unacknowledgedHandovers) {
      const id = `handover_unack_${handover.id}`;
      notifications.push({
        id,
        type: 'unacknowledged_handover',
        severity: 'info',
        title: `PENDING HANDOVER ACKNOWLEDGMENT: ${handover.shift}`,
        message: `${handover.machineName} handover by ${handover.operator || handover.technician} on ${handover.date} requires incoming shift verification.`,
        timestamp: handover.createdAt || new Date().toISOString(),
        linkedRecordType: 'handover',
        linkedRecordId: handover.id,
        suggestedAction: 'Review outstanding alarms & work completed, then sign off handover.',
        actionLabel: 'View Handover Log',
        acknowledged: acknowledgedIds.includes(id)
      });
    }

    // Sort: unacknowledged first, then by severity (critical > warning > info), then by timestamp desc
    return notifications.sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1;
      }
      const sevOrder = { critical: 0, warning: 1, info: 2 };
      if (sevOrder[a.severity] !== sevOrder[b.severity]) {
        return sevOrder[a.severity] - sevOrder[b.severity];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  // --- IMMEDIATE EVENT TRIGGERS (CALL WHEN USER SAVES TICKET OR MACHINE) ---

  /**
   * Explicitly triggers an alert when a ticket is created or updated as 'critical'.
   */
  public triggerCriticalTicketAlert(
    ticket: BreakdownTicket,
    onNavigate?: () => void
  ): void {
    if (ticket.severityLevel !== 'critical') return;

    const settings = this.getSettings();
    if (!settings.criticalBreakdownAlerts) return;

    // Play urgent sound
    this.playCriticalAlarmSound();

    const title = `🚨 CRITICAL BREAKDOWN: ${ticket.machineId}`;
    const body = `Ticket #${ticket.ticketNumber} marked CRITICAL. ${ticket.alarmCode ? `[${ticket.alarmCode}] ` : ''}${ticket.faultDescription} — Impact: ${ticket.productionImpact.replace('_', ' ').toUpperCase()}`;

    // Send Browser System Notification
    this.sendBrowserNotification(title, {
      body,
      tag: `critical_${ticket.id}`,
      onClick: onNavigate
    });

    // Notify in-app toast / banner listeners
    const notif: SystemNotification = {
      id: `crit_tkt_${ticket.id}`,
      type: 'critical_breakdown',
      severity: 'critical',
      title,
      message: body,
      timestamp: new Date().toISOString(),
      linkedRecordType: 'ticket',
      linkedRecordId: ticket.id,
      suggestedAction: 'Immediate technician intervention required. Line stopped.',
      actionLabel: 'View Ticket',
      acknowledged: false,
      meta: {
        alarmCode: ticket.alarmCode,
        productionImpact: ticket.productionImpact,
        machineName: ticket.machineName
      }
    };

    this.emitAlert(notif);
  }

  /**
   * Explicitly triggers an alert when a machine's warranty is within 30 days of expiring.
   */
  public triggerWarrantyAlert(
    machine: Machine,
    onNavigate?: () => void
  ): void {
    if (!machine.warrantyExpiryDate) return;

    const settings = this.getSettings();
    if (!settings.warrantyExpirationAlerts) return;

    const expiryDate = new Date(machine.warrantyExpiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      const isExpired = diffDays < 0;
      const title = isExpired 
        ? `⚠️ WARRANTY EXPIRED: ${machine.machineId}`
        : `⚠️ WARRANTY EXPIRING IN ${diffDays} DAYS: ${machine.machineId}`;
      const body = isExpired
        ? `Factory warranty expired on ${machine.warrantyExpiryDate} (${Math.abs(diffDays)} days ago) for ${machine.machineName}.`
        : `Factory warranty for ${machine.machineName} (${machine.model}) expires on ${machine.warrantyExpiryDate}. File open claims now!`;

      // Play chime
      this.playWarningChime();

      // Send Browser System Notification
      this.sendBrowserNotification(title, {
        body,
        tag: `war_${machine.id}`,
        onClick: onNavigate
      });

      const notif: SystemNotification = {
        id: `war_exp_${machine.id}`,
        type: 'warranty_expiring',
        severity: diffDays <= 7 ? 'critical' : 'warning',
        title,
        message: body,
        timestamp: new Date().toISOString(),
        linkedRecordType: 'machine',
        linkedRecordId: machine.id,
        suggestedAction: 'Audit active breakdown tickets for warranty coverage claims.',
        actionLabel: 'View Machine Profile',
        acknowledged: false,
        meta: {
          daysRemaining: diffDays,
          machineName: machine.machineName
        }
      };

      this.emitAlert(notif);
    }
  }

  /**
   * Fires a test alert so the user / technician can immediately verify
   * that sound and browser notifications are functioning properly on their device.
   */
  public triggerTestAlert(): void {
    this.playCriticalAlarmSound();

    const title = '🔔 TEST SYSTEM ALERT: DN Operations Hub';
    const body = 'Browser notification system and industrial audio alerts are operational on this workstation.';

    this.sendBrowserNotification(title, {
      body,
      tag: 'test_system_alert'
    });

    const notif: SystemNotification = {
      id: `test_${Date.now()}`,
      type: 'critical_breakdown',
      severity: 'critical',
      title,
      message: body,
      timestamp: new Date().toISOString(),
      linkedRecordType: 'ticket',
      linkedRecordId: 'test',
      suggestedAction: 'System test verified. Audio and desktop push notifications are fully configured.',
      actionLabel: 'Acknowledged',
      acknowledged: false
    };

    this.emitAlert(notif);
  }

  // --- PUB / SUB EVENT LISTENERS ---
  public subscribeToAlerts(listener: AlertListener): () => void {
    this.alertListeners.add(listener);
    return () => {
      this.alertListeners.delete(listener);
    };
  }

  public subscribeToChanges(listener: ChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  private emitAlert(notif: SystemNotification): void {
    this.alertListeners.forEach(fn => {
      try { fn(notif); } catch (e) { console.error('Alert listener error:', e); }
    });
    this.notifyChanges();
  }

  private notifyChanges(): void {
    this.changeListeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('Change listener error:', e); }
    });
  }
}

export const notificationService = new NotificationService();
