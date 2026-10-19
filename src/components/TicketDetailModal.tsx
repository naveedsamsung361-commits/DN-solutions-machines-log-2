import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Edit3, 
  Trash2, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  ShieldCheck, 
  Layers, 
  Maximize2,
  Calendar,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { BreakdownTicket, User } from '../types';

interface TicketDetailModalProps {
  isOpen: boolean;
  ticket: BreakdownTicket | null;
  onClose: () => void;
  onEdit: (ticket: BreakdownTicket) => void;
  onDelete: (ticketId: string) => void;
  currentUser: User;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onEdit,
  onDelete,
  currentUser
}) => {
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete breakdown ticket ${ticket.ticketNumber}? This action cannot be undone.`)) {
      onDelete(ticket.id);
      onClose();
    }
  };

  const getStatusBadge = (status: BreakdownTicket['status']) => {
    switch (status) {
      case 'Closed':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'Resolved':
        return 'bg-teal-950 text-teal-300 border-teal-800';
      case 'Repair in Progress':
        return 'bg-blue-950 text-blue-300 border-blue-800 animate-pulse';
      case 'Diagnosis in Progress':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'Waiting for Parts':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Waiting for Approval':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'Awaiting Quality Approval':
        return 'bg-pink-950 text-pink-300 border-pink-800';
      case 'Awaiting Restart Approval':
        return 'bg-amber-950 text-amber-300 border-amber-800 ring-1 ring-amber-500/50';
      case 'Testing':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'technician';
  const canDelete = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-industrial font-bold text-base sm:text-lg text-white">
                  {ticket.ticketNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(ticket.status)}`}>
                  {ticket.status}
                </span>
                {ticket.isWarrantyClaim && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800">
                    OEM Warranty
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {ticket.machineId} • {ticket.machineName} ({ticket.machineModel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors flex items-center gap-1.5"
              title="Print breakdown ticket report / PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            {canEdit && (
              <button
                onClick={() => onEdit(ticket)}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs transition-colors flex items-center gap-1.5"
                title="Edit ticket"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-lg text-xs transition-colors"
                title="Delete ticket"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Printable Header */}
          <div className="hidden print-only mb-6 border-b pb-4">
            <div className="text-xl font-bold">DN SOLUTIONS MACHINE OPERATIONS HUB</div>
            <div className="text-sm">Official Machine Fix Log & Breakdown Incident Report</div>
            <div className="text-xs text-gray-500">Ticket: {ticket.ticketNumber} | Date: {ticket.breakdownDate}</div>
          </div>

          {/* Critical Severity Alert Banner */}
          {ticket.severityLevel === 'critical' && ticket.status !== 'Closed' && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/80 shadow-lg shadow-red-950/30 flex items-center justify-between gap-3 text-red-200 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">CRITICAL BREAKDOWN ACTIVE — PRIORITY 1 INTERVENTION</h4>
                  <p className="text-[11px] text-red-300/90 mt-0.5">
                    Line impact: <strong className="uppercase">{ticket.productionImpact.replace('_', ' ')}</strong> • Browser notification and alarm audio active.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-red-600 text-white shrink-0">
                CRITICAL
              </span>
            </div>
          )}

          {/* Downtime KPI Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Downtime</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
                {Math.floor(ticket.totalDowntimeMinutes / 60)}h {ticket.totalDowntimeMinutes % 60}m
              </span>
              <span className="text-[10px] text-slate-400 block">({ticket.totalDowntimeMinutes} min)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Fault Severity</span>
              <span className="text-lg font-bold uppercase text-amber-400">{ticket.severityLevel}</span>
              <span className="text-[10px] text-slate-400 block">{ticket.productionImpact.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Breakdown Date</span>
              <span className="text-sm font-semibold font-mono text-white">{ticket.breakdownDate}</span>
              <span className="text-[10px] text-slate-400 block">{ticket.breakdownTime} ({ticket.shift})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Technician Assigned</span>
              <span className="text-sm font-semibold text-blue-400">{ticket.technicianAssigned}</span>
              <span className="text-[10px] text-slate-400 block">{ticket.maintenanceSupervisor} (Supv)</span>
            </div>
          </div>

          {/* Machine & Customer Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                Machine Specifications
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-400 block text-[10px]">Machine ID</span><strong>{ticket.machineId}</strong></div>
                <div><span className="text-slate-400 block text-[10px]">Model</span>{ticket.machineModel}</div>
                <div><span className="text-slate-400 block text-[10px]">Serial No.</span><span className="font-mono">{ticket.machineSerialNumber}</span></div>
                <div><span className="text-slate-400 block text-[10px]">Controller</span>{ticket.controllerType}</div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                Location & Operations
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-400 block text-[10px]">Customer</span><strong>{ticket.customerName}</strong></div>
                <div><span className="text-slate-400 block text-[10px]">Plant / Site</span>{ticket.factory}</div>
                <div><span className="text-slate-400 block text-[10px]">Department</span>{ticket.department}</div>
                <div><span className="text-slate-400 block text-[10px]">Production Line</span>{ticket.productionLine}</div>
              </div>
            </div>
          </div>

          {/* Fault Description & Alarms */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Fault Diagnosis & Alarm Codes
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200">
                Category: {ticket.faultCategory}
              </span>
              {ticket.alarmCode && (
                <span className="px-2.5 py-1 rounded bg-amber-950 border border-amber-800 text-xs font-mono font-bold text-amber-300">
                  Alarm Code: {ticket.alarmCode}
                </span>
              )}
              {ticket.axisAffected !== 'None' && (
                <span className="px-2 py-1 rounded bg-indigo-950 border border-indigo-800 text-xs font-semibold text-indigo-300">
                  Axis Affected: {ticket.axisAffected}
                </span>
              )}
            </div>

            {ticket.alarmMessage && (
              <div className="text-xs text-amber-400 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                Alarm Message: {ticket.alarmMessage}
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Description</span>
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                {ticket.faultDescription}
              </p>
            </div>

            {ticket.machineSymptoms && (
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Symptoms & Observations</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  {ticket.machineSymptoms}
                </p>
              </div>
            )}
          </div>

          {/* Downtime Stage Timeline */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Downtime Audit Milestones
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Breakdown Start</span>
                <span className="font-mono text-slate-200 font-semibold">
                  {ticket.breakdownStart ? new Date(ticket.breakdownStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Tech Arrival</span>
                <span className="font-mono text-slate-200 font-semibold">
                  {ticket.technicianArrival ? new Date(ticket.technicianArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Repair Completed</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {ticket.repairCompletion ? new Date(ticket.repairCompletion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Production Restart</span>
                <span className="font-mono text-purple-400 font-semibold">
                  {ticket.productionRestart ? new Date(ticket.productionRestart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs pt-1 text-slate-400 font-mono">
              <span>Diagnosis: <strong>{ticket.diagnosisDurationMinutes} min</strong></span>
              <span>Waiting: <strong>{ticket.waitingDurationMinutes} min</strong></span>
              <span>Repair: <strong>{ticket.repairDurationMinutes} min</strong></span>
              <span>Testing: <strong>{ticket.testingDurationMinutes} min</strong></span>
            </div>
          </div>

          {/* Root Cause & Corrective Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Diagnosed Root Cause
              </span>
              <p className="text-slate-200 leading-relaxed">
                {ticket.rootCause || 'Root cause under investigation by technician.'}
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Corrective Action & Fix
              </span>
              <p className="text-slate-200 leading-relaxed">
                {ticket.correctiveAction || 'Corrective action in progress.'}
              </p>
            </div>
          </div>

          {/* Spare Parts Consumed */}
          {ticket.sparePartsUsed && ticket.sparePartsUsed.length > 0 && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Spare Parts Replaced & Deducted
              </span>
              <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[11px]">
                    <tr>
                      <th className="p-2">Part Number</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {ticket.sparePartsUsed.map(part => (
                      <tr key={part.partId}>
                        <td className="p-2 font-mono text-blue-400 font-semibold">{part.partNumber}</td>
                        <td className="p-2 text-slate-200">{part.partName}</td>
                        <td className="p-2 text-center font-mono">{part.quantity}</td>
                        <td className="p-2 text-right font-mono text-emerald-400">${part.quantity * part.unitCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pre-Restart Safety Checklist */}
          {ticket.preRestartChecklist && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Pre-Restart Verification Status
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'spindleRunTest', label: 'Spindle Run & RPM Test' },
                  { key: 'emergencyStopVerified', label: 'Emergency Stop Verification' },
                  { key: 'axisInterlockTested', label: 'Axis Safety Interlocks' },
                  { key: 'lubricationPressureChecked', label: 'Way-Lube Pressure & Cycling' },
                  { key: 'coolantFlowTested', label: 'Coolant & CTS High Pressure' },
                  { key: 'guardInterlocksSafe', label: 'Enclosure Guard Interlock' },
                  { key: 'trialPartCutPassed', label: 'Trial Part Cut Passed CMM' }
                ].map(chk => {
                  const passed = ticket.preRestartChecklist[chk.key as keyof BreakdownTicket['preRestartChecklist']];
                  return (
                    <div key={chk.key} className="flex items-center gap-2 p-2 rounded bg-slate-900">
                      {passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className={passed ? 'text-slate-200' : 'text-slate-400 line-through'}>
                        {chk.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fault Photographs Gallery */}
          {ticket.photographs && ticket.photographs.length > 0 && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Attached Incident Photographs ({ticket.photographs.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ticket.photographs.map(photo => (
                  <div 
                    key={photo.id}
                    onClick={() => setFullscreenPhoto(photo.url)}
                    className="group relative rounded-lg overflow-hidden border border-slate-800 cursor-pointer bg-slate-900"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                    </div>
                    <div className="p-2 text-[11px]">
                      <span className="text-blue-400 capitalize font-medium block">{photo.photoType.replace('_', ' ')}</span>
                      <p className="text-slate-300 truncate">{photo.caption}</p>
                    </div>
                    <div className="absolute top-2 right-2 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Change Audit Trail */}
          {ticket.statusHistory && ticket.statusHistory.length > 0 && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Status Progression & Audit Trail
              </span>
              <div className="space-y-2 divide-y divide-slate-800/80">
                {ticket.statusHistory.map((step, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{step.status}</span>
                        <span className="text-slate-400 text-[10px]">by {step.changedBy}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">{step.note}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                      {new Date(step.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closure Sign-off block */}
          {ticket.status === 'Closed' && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <FileCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="font-bold text-white">Closed & Approved for Production Release</div>
                  <div className="text-[11px] text-emerald-300">
                    Closed by: {ticket.closedBy} on {ticket.closureDate ? new Date(ticket.closureDate).toLocaleString() : '—'}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700 font-semibold text-[11px]">
                Status: Verified
              </span>
            </div>
          )}
        </div>

        {/* Fullscreen Photo Zoom Modal */}
        {fullscreenPhoto && (
          <div 
            onClick={() => setFullscreenPhoto(null)}
            className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img src={fullscreenPhoto} alt="Full screen preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            <button className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
