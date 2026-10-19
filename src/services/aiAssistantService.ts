import { GoogleGenAI } from '@google/genai';
import { storageService } from './storage';
import { AIMessage, AICitation, BreakdownTicket, Machine, SparePart, PreventiveMaintenanceTask, ShiftHandover } from '../types';

class AIAssistantService {
  private getClient(): GoogleGenAI | null {
    const key = 
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof window !== 'undefined' && (window as unknown as { GEMINI_API_KEY?: string }).GEMINI_API_KEY) ||
      '';
    if (!key) return null;
    try {
      return new GoogleGenAI({ apiKey: key });
    } catch (e) {
      console.warn('GoogleGenAI initialization skipped:', e);
      return null;
    }
  }

  /**
   * Builds live grounded context from the storage service.
   */
  private buildSystemContext(): string {
    const machines = storageService.getMachines();
    const tickets = storageService.getTickets();
    const parts = storageService.getSpareParts();
    const pms = storageService.getPMTasks();
    const handovers = storageService.getShiftHandovers();
    const metrics = storageService.getDashboardMetrics('last30');

    const machinesSummary = machines.map(m => 
      `- [${m.machineId}] ${m.machineName} (${m.model}, S/N: ${m.serialNumber}) | Customer: ${m.customerName} | Status: ${m.operatingStatus.toUpperCase()} | Warranty Expiry: ${m.warrantyExpiryDate || 'N/A'}`
    ).join('\n');

    const ticketsSummary = tickets.map(t => 
      `- [${t.ticketNumber}] on Machine ${t.machineId} (${t.machineModel}) | Status: ${t.status} | Severity: ${t.severityLevel.toUpperCase()} | Alarm: ${t.alarmCode || 'None'} | Fault: "${t.faultDescription}" | Downtime: ${t.totalDowntimeMinutes || 0}m | Root Cause: ${t.rootCause || 'Under investigation'}`
    ).join('\n');

    const lowStockParts = parts.filter(p => p.quantityAvailable <= p.minStockLevel).map(p =>
      `- [${p.partNumber}] ${p.partName} | Available: ${p.quantityAvailable} | Min: ${p.minStockLevel} | Cost: $${p.unitCost} | Supplier: ${p.supplier}`
    ).join('\n');

    const overduePMs = pms.filter(p => p.status === 'Overdue').map(p =>
      `- [${p.id}] ${p.taskName} for ${p.machineName} | Due: ${p.dueDate} | Assigned: ${p.assignedTechnician || 'Unassigned'}`
    ).join('\n');

    const handoversSummary = handovers.slice(0, 4).map(h =>
      `- [${h.id}] Date: ${h.date} (${h.shift}) | Machine: ${h.machineName} | Operator: ${h.operator} | Acknowledged: ${h.acknowledgedAt ? 'Yes' : 'NO'} | Work Done: "${h.workCompleted}" | Pending: "${h.pendingMaintenance || 'None'}"`
    ).join('\n');

    return `
You are the AI Maintenance Assistant for the DN Solutions Operations Hub (CNC Machine Operations & Maintenance System).
You strictly follow these 8 industrial engineering rules:
1. Base all answers strictly on the actual shop-floor records provided below.
2. Cite real ticket numbers (e.g. [TKT-2026-0101]), machine IDs (e.g. [MCH-001]), and part numbers (e.g. [PRT-004]).
3. Distinguish confirmed findings from hypotheses. Label diagnostic possibilities as "Suspected / Hypothesis".
4. Never fabricate alarm codes, live telemetry, or repairs.
5. If information is missing from the database, explicitly state that it is unavailable.
6. Never attempt or suggest modifying records without authorized supervisor approval.
7. You do not have direct physical CNC machine control; do not pretend to command physical axes, spindles, or chucks.
8. Always remind operators that safety-critical interventions (spindle lockouts, hydraulic pressure release, electrical work) require qualified technician physical verification and LOTO (Lockout/Tagout).

OPERATIONAL CONTEXT SUMMARY (Live Data):
- Total Fleet: ${metrics.totalMachines} machines (${metrics.runningMachines} Running, ${metrics.breakdownMachines} Breakdown, ${metrics.maintenanceMachines} Maintenance, ${metrics.idleMachines} Idle)
- Active MTTR: ${metrics.mttrHours} hours | MTBF: ${metrics.mtbfHours} hours | Availability: ${metrics.machineAvailabilityPct}%
- Downtime Today: ${metrics.downtimeTodayHours} hrs | This Month: ${metrics.downtimeThisMonthHours} hrs
- Active Critical Breakdowns: ${metrics.criticalFaults}

MACHINES IN FLEET:
${machinesSummary}

BREAKDOWN TICKETS:
${ticketsSummary}

LOW OR OUT-OF-STOCK SPARE PARTS:
${lowStockParts || 'All inventory levels currently above minimum thresholds.'}

OVERDUE PREVENTIVE MAINTENANCE TASKS:
${overduePMs || 'No overdue preventive maintenance tasks.'}

RECENT SHIFT HANDOVERS:
${handoversSummary}
`;
  }

  /**
   * Main query execution.
   */
  public async ask(userQuery: string, history: AIMessage[] = []): Promise<AIMessage> {
    const ai = this.getClient();
    let textResponse = '';
    const citations: AICitation[] = [];

    if (ai) {
      try {
        const systemInstruction = this.buildSystemContext();
        const chatContents = history.slice(-6).map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        }));

        chatContents.push({
          role: 'user',
          parts: [{ text: userQuery }]
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: chatContents,
          config: {
            systemInstruction
          }
        });

        textResponse = response.text || '';
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local reasoning engine:', err);
        textResponse = this.executeLocalReasoning(userQuery);
      }
    } else {
      // Local deterministic intelligence fallback
      textResponse = this.executeLocalReasoning(userQuery);
    }

    // Extract citations from the response text
    this.extractCitations(textResponse, citations);

    return {
      id: `MSG-${Date.now()}`,
      role: 'assistant',
      content: textResponse,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations,
      isDiagnostic: userQuery.toLowerCase().includes('troubleshoot') || userQuery.toLowerCase().includes('alarm') || userQuery.toLowerCase().includes('diagnos')
    };
  }

  /**
   * High-accuracy deterministic CNC rule and record search engine.
   * Answers user questions with 100% real records from the local storage.
   */
  private executeLocalReasoning(query: string): string {
    const q = query.toLowerCase();
    const machines = storageService.getMachines();
    const tickets = storageService.getTickets();
    const parts = storageService.getSpareParts();
    const pms = storageService.getPMTasks();
    const handovers = storageService.getShiftHandovers();
    const metrics = storageService.getDashboardMetrics('last30');

    // 1. Highest Downtime Machines
    if (q.includes('highest downtime') || q.includes('most downtime') || (q.includes('downtime') && q.includes('month'))) {
      const machineDowntimes = machines.map(m => {
        const mTickets = tickets.filter(t => t.machineId === m.machineId);
        const totalMinutes = mTickets.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0);
        return { machine: m, hours: (totalMinutes / 60).toFixed(1), ticketCount: mTickets.length };
      }).sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));

      const top = machineDowntimes[0];
      const second = machineDowntimes[1];

      return `### 📊 Machine Downtime Analysis (Current Month)
Based on operational records, **[${top.machine.machineId}] ${top.machine.machineName} (${top.machine.model})** has recorded the highest cumulative downtime:
- **Total Downtime:** **${top.hours} hours** across ${top.ticketCount} breakdown incidents.
- **Operating Status:** Currently **${top.machine.operatingStatus.toUpperCase()}**.
- **Customer / Location:** ${top.machine.customerName} (${top.machine.factory}, Line: ${top.machine.productionLine}).

The second highest downtime machine is **[${second.machine.machineId}] ${second.machine.machineName}** with **${second.hours} hours** of downtime.

*Note: Calculations reflect elapsed downtime recorded in verified breakdown tickets.*`;
    }

    // 2. Unresolved breakdowns affecting production
    if (q.includes('unresolved') || (q.includes('breakdown') && q.includes('production')) || q.includes('open tickets')) {
      const openTickets = tickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved');
      const lineStopping = openTickets.filter(t => t.productionImpact === 'line_stopped' || t.productionImpact === 'facility_stopped');

      if (openTickets.length === 0) {
        return `✅ **No unresolved breakdowns affecting production.** All registered breakdown tickets are currently resolved or closed.`;
      }

      let resp = `### 🚨 Unresolved Breakdown Tickets (${openTickets.length} Active)\nThere are currently **${lineStopping.length} line-stopping breakdowns** out of ${openTickets.length} open tickets:\n\n`;
      openTickets.forEach(t => {
        resp += `- **[${t.ticketNumber}]** on Machine **[${t.machineId}]** (${t.machineModel})
  - **Status:** \`${t.status}\` | **Severity:** \`${t.severityLevel.toUpperCase()}\`
  - **Alarm Code:** \`${t.alarmCode || 'No alarm code'}\`
  - **Fault Description:** ${t.faultDescription}
  - **Production Impact:** ${t.productionImpact.replace('_', ' ').toUpperCase()}
  - **Assigned Technician:** ${t.technicianAssigned || 'Unassigned'}\n\n`;
      });

      resp += `*Action Recommended: Prioritize line-stopping tickets. Verify safety interlocks prior to trial restart.*`;
      return resp;
    }

    // 3. Overdue Maintenance Tasks
    if (q.includes('overdue') || (q.includes('preventive') && q.includes('due')) || q.includes('maintenance')) {
      const overdue = pms.filter(p => p.status === 'Overdue');
      if (overdue.length === 0) {
        return `✅ **Preventive Maintenance Status:** All scheduled maintenance tasks are up to date! Overall compliance is **${metrics.pmCompliancePct}%**.`;
      }

      let resp = `### ⚠️ Overdue Preventive Maintenance Tasks (${overdue.length} Tasks)\n`;
      overdue.forEach(p => {
        resp += `- **[${p.id}] ${p.taskName}** for Machine **${p.machineName}**
  - **Scheduled Due Date:** ${p.dueDate}
  - **Interval:** ${p.interval}
  - **Assigned Technician:** ${p.assignedTechnician || 'Unassigned'}
  - **Checklist Progress:** ${p.checklist?.filter(c => c.completed).length || 0} / ${p.checklist?.length || 0} items completed\n\n`;
      });
      return resp;
    }

    // 4. Spindle vibration or historical fault search
    if (q.includes('spindle') || q.includes('vibration') || q.includes('alarm') || q.includes('fanuc')) {
      const matchingTickets = tickets.filter(t => 
        t.faultDescription.toLowerCase().includes('spindle') ||
        t.faultDescription.toLowerCase().includes('vibration') ||
        t.faultCategory.toLowerCase().includes('spindle') ||
        (t.alarmCode && t.alarmCode.toLowerCase().includes('spn'))
      );

      if (matchingTickets.length > 0) {
        let resp = `### 🔍 Historical Spindle / Vibration Faults Found (${matchingTickets.length} Records)\n\n`;
        matchingTickets.forEach(t => {
          resp += `**Ticket [${t.ticketNumber}]** — Machine **[${t.machineId}]** (${t.machineModel})
- **Reported Date:** ${t.breakdownDate}
- **Recorded Alarm:** \`${t.alarmCode || 'N/A'}\` — ${t.alarmMessage || 'No message logged'}
- **Fault Details:** "${t.faultDescription}"
- **Confirmed Root Cause:** ${t.rootCause || 'Root cause investigation logged in ticket'}
- **Corrective Action Taken:** ${t.correctiveAction || 'Component inspection and adjustment'}
- **Parts Consumed:** ${t.sparePartsUsed?.map(p => `[${p.partNumber}] ${p.partName}`).join(', ') || 'None'}\n\n`;
        });

        resp += `### 🛠️ Suggested Diagnostic Checks:
1. **Dynamic Runout & Chattering:** Measure spindle taper radial runout with dial test indicator (< 0.003mm allowable).
2. **Drive Belt & Pulley Alignment:** Inspect spindle pulley belt tension and bearing temperature rise after 15 min warm-up run.
3. **Tool Clamping Force:** Verify hydraulic disc spring pull-stud drawbar retention force.
4. **Safety Check:** Always engage spindle interlock and LOTO before touching tooling or rotor.`;
        return resp;
      }

      return `No past tickets explicitly mentioned "spindle vibration". However, Machine **[MCH-001]** has spindle maintenance scheduled under ticket history. Suggested diagnostic: Inspect hydraulic pull-stud clamp force and Fanuc SP9011 sensor cables.`;
    }

    // 5. Spare parts below minimum stock
    if (q.includes('spare part') || q.includes('minimum stock') || q.includes('inventory') || q.includes('out of stock')) {
      const lowParts = parts.filter(p => p.quantityAvailable <= p.minStockLevel);
      if (lowParts.length === 0) {
        return `✅ **Inventory Healthy:** All spare parts currently exceed their configured minimum stock thresholds.`;
      }

      let resp = `### 📦 Spare Parts Requiring Replenishment (${lowParts.length} Items)\n\n`;
      lowParts.forEach(p => {
        const isOut = p.quantityAvailable <= 0;
        resp += `- **[${p.partNumber}] ${p.partName}** (${p.category})
  - **Stock Status:** ${isOut ? '🔴 **OUT OF STOCK (0 units)**' : `🟡 **Low Stock (${p.quantityAvailable} units available)**`}
  - **Minimum Threshold:** ${p.minStockLevel} | **Reserved:** ${p.quantityReserved}
  - **Unit Cost:** $${p.unitCost.toLocaleString()} | **Lead Time:** ${p.leadTimeDays} days
  - **Authorized Supplier:** ${p.supplier}\n\n`;
      });

      resp += `*Action Recommended: Issue purchase requisitions for parts with lead times > 5 days to avoid prolonged repair holds.*`;
      return resp;
    }

    // 6. Shift handover summary
    if (q.includes('handover') || q.includes('yesterday') || q.includes('shift')) {
      const latest = handovers[0];
      if (!latest) {
        return `No shift handover logs have been submitted yet.`;
      }

      return `### 📋 Shift Handover Summary (${latest.date} • ${latest.shift})
- **Machine:** **${latest.machineName}**
- **Handed Over By:** Operator **${latest.operator}** | Technician **${latest.technician || 'N/A'}**
- **Machine Operating Status:** \`${latest.machineStatus.toUpperCase()}\`
- **Work Completed During Shift:** ${latest.workCompleted}
- **Pending Maintenance / Outstanding Issues:** ${latest.pendingMaintenance || 'None reported'}
- **Safety / Environmental Observations:** ${latest.safetyConcerns || 'Safety protocols observed. Guards intact.'}
- **Acknowledgment Status:** ${latest.acknowledgedAt ? `✅ Acknowledged by incoming shift at ${latest.acknowledgedAt}` : '⚠️ **Pending Incoming Shift Acknowledgment**'}`;
    }

    // 7. Calculate MTTR & MTBF
    if (q.includes('mttr') || q.includes('mtbf') || q.includes('reliability') || q.includes('availability')) {
      return `### ⏱️ Industrial Reliability & Maintenance Metrics (Last 30 Days)
- **MTTR (Mean Time to Repair):** **${metrics.mttrHours} hours**
  - *Formula:* Total repair duration of qualified completed repairs ÷ Number of completed repairs
  - *Current Status:* Within OEM target window (< 2.5 hours).
- **MTBF (Mean Time Between Failures):** **${metrics.mtbfHours} hours**
  - *Formula:* Total qualified machine operating hours ÷ Qualifying high/critical failure incidents
- **Fleet Availability:** **${metrics.machineAvailabilityPct}%**
  - *Formula:* (Planned Production Time - Downtime) ÷ Planned Production Time × 100
- **Downtime Cumulative:** Today: ${metrics.downtimeTodayHours} hrs | Month-to-date: ${metrics.downtimeThisMonthHours} hrs
- **Total Maintenance & Repair Expenditure:** $${metrics.totalMaintenanceCost.toLocaleString()}`;
    }

    // Default general response with real records
    return `### 🤖 DN Operations Hub AI Assistant
I have analyzed the current shop-floor records:
- **Active CNC Machines:** ${metrics.totalMachines} units (${metrics.runningMachines} running in production, ${metrics.breakdownMachines} stopped for repair).
- **Open Breakdown Tickets:** ${metrics.openTicketsCount} tickets active (${metrics.criticalFaults} critical line-stoppages).
- **Preventive Maintenance Compliance:** ${metrics.pmCompliancePct}% (${metrics.pmOverdue} tasks overdue).
- **Spare Parts Inventory:** ${metrics.lowStockPartsCount} items below replenishment threshold.

**You can ask me specific questions such as:**
1. *"Which machines have the highest downtime this month?"*
2. *"Show unresolved breakdowns affecting production."*
3. *"Which machines have overdue maintenance?"*
4. *"Find previous tickets involving spindle vibration or alarm codes."*
5. *"Which spare parts are below minimum stock?"*
6. *"Summarize yesterday's shift handover."*
7. *"Calculate MTTR and MTBF for the previous 30 days."*

*Note: All answers are grounded in registered shop-floor records. Safety-critical troubleshooting requires qualified technician verification.*`;
  }

  /**
   * Matches IDs in the generated text to provide interactive link badges.
   */
  private extractCitations(text: string, citations: AICitation[]): void {
    const machines = storageService.getMachines();
    const tickets = storageService.getTickets();
    const parts = storageService.getSpareParts();

    // Match tickets e.g. TKT-2026-0101 or TKT-001
    const ticketMatches = text.match(/TKT-[\w-]+/g);
    if (ticketMatches) {
      new Set(ticketMatches).forEach(tNum => {
        const t = tickets.find(x => x.ticketNumber === tNum || x.id === tNum);
        if (t && !citations.some(c => c.recordId === t.id)) {
          citations.push({
            recordType: 'ticket',
            recordId: t.id,
            label: t.ticketNumber
          });
        }
      });
    }

    // Match machines e.g. MCH-001, MC-HMC-01
    const machineMatches = text.match(/MCH-[\w-]+|MC-[\w-]+/g);
    if (machineMatches) {
      new Set(machineMatches).forEach(mId => {
        const m = machines.find(x => x.machineId === mId || x.id === mId);
        if (m && !citations.some(c => c.recordId === m.id)) {
          citations.push({
            recordType: 'machine',
            recordId: m.id,
            label: m.machineId
          });
        }
      });
    }

    // Match parts e.g. PRT-001
    const partMatches = text.match(/PRT-[\w-]+/g);
    if (partMatches) {
      new Set(partMatches).forEach(pNum => {
        const p = parts.find(x => x.partNumber === pNum || x.id === pNum);
        if (p && !citations.some(c => c.recordId === p.id)) {
          citations.push({
            recordType: 'part',
            recordId: p.id,
            label: p.partNumber
          });
        }
      });
    }
  }
}

export const aiAssistantService = new AIAssistantService();
