import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  UserCheck, 
  Layers, 
  X,
  FileCheck
} from 'lucide-react';
import { ShiftHandover, Machine, User } from '../types';
import { storageService } from '../services/storage';

interface ShiftHandoverLogProps {
  currentUser: User;
}

export const ShiftHandoverLog: React.FC<ShiftHandoverLogProps> = ({ currentUser }) => {
  const [handovers, setHandovers] = useState<ShiftHandover[]>(storageService.getShiftHandovers());
  const [showNewModal, setShowNewModal] = useState(false);
  const machines = storageService.getMachines();

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'Shift 1 (Morning)' | 'Shift 2 (Evening)' | 'Shift 3 (Night)'>('Shift 1 (Morning)');
  const [machineId, setMachineId] = useState(machines[0]?.machineId || '');
  const [operator, setOperator] = useState(currentUser.name);
  const [technician, setTechnician] = useState('Elena Rostova');
  const [machineRunningStatus, setMachineRunningStatus] = useState<ShiftHandover['machineRunningStatus']>('running');
  const [productionStatus, setProductionStatus] = useState<ShiftHandover['productionStatus']>('Normal Production');
  const [pendingMaintenance, setPendingMaintenance] = useState('');
  const [temporaryRepairDetails, setTemporaryRepairDetails] = useState('');
  const [outstandingAlarms, setOutstandingAlarms] = useState('None');
  const [sparePartsRequired, setSparePartsRequired] = useState('');
  const [safetyConcerns, setSafetyConcerns] = useState('None reported');
  const [pendingJobs, setPendingJobs] = useState('');
  const [handoverRemarks, setHandoverRemarks] = useState('');

  const reloadHandovers = () => {
    setHandovers(storageService.getShiftHandovers());
  };

  const handleAcknowledge = (id: string) => {
    storageService.acknowledgeShiftHandover(id);
    reloadHandovers();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const m = machines.find(item => item.machineId === machineId);
    if (!m) return;

    const newHandover: ShiftHandover = {
      id: `SH-${Date.now()}`,
      date,
      shift,
      machineId: m.machineId,
      machineName: m.machineName,
      operator,
      technician,
      machineRunningStatus,
      productionStatus,
      pendingMaintenance,
      temporaryRepairDetails,
      outstandingAlarms,
      sparePartsRequired,
      safetyConcerns,
      pendingJobs,
      handoverRemarks,
      handoverTime: new Date().toTimeString().substring(0, 5),
      createdAt: new Date().toISOString()
    };

    storageService.saveShiftHandover(newHandover);
    setShowNewModal(false);
    reloadHandovers();
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              SHOP-FLOOR SHIFT HANDOVER LOG
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-blue-400 border border-blue-800/60 uppercase">
              Shift Transfer Protocol
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Inter-shift communication of machine running states, temporary fixes, active alarms, and safety concerns.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Shift Handover</span>
        </button>
      </div>

      {/* Handover Cards List */}
      <div className="space-y-4">
        {handovers.map(h => {
          const isAcknowledged = !!h.acknowledgedAt;
          const hasUnresolvedIssues = h.machineRunningStatus === 'breakdown' || (h.outstandingAlarms && h.outstandingAlarms !== 'None');

          return (
            <div 
              key={h.id} 
              className={`p-5 rounded-2xl bg-slate-900 border transition-all ${
                hasUnresolvedIssues 
                  ? 'border-amber-600/70 shadow-lg shadow-amber-950/20' 
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-blue-400 font-bold text-xs">{h.machineId}</span>
                  <span className="text-white font-semibold text-xs">• {h.machineName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-slate-200 border border-slate-800">
                    {h.shift}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">{h.date} at {h.handoverTime}</span>
                  {hasUnresolvedIssues && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 animate-pulse">
                      Attention Required
                    </span>
                  )}
                </div>

                {isAcknowledged ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-800/60 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledged by {h.receivedBy}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAcknowledge(h.id)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-all flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Acknowledge Handover</span>
                  </button>
                )}
              </div>

              {/* Handover Body Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Operators & Personnel</span>
                  <p><strong className="text-slate-300">Outgoing Operator:</strong> {h.operator}</p>
                  <p><strong className="text-slate-300">Duty Technician:</strong> {h.technician}</p>
                  <p><strong className="text-slate-300">Machine Status:</strong> <span className="capitalize text-blue-400 font-semibold">{h.machineRunningStatus}</span></p>
                  <p><strong className="text-slate-300">Production State:</strong> {h.productionStatus}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Alarms & Temporary Fixes</span>
                  <p className="text-amber-300"><strong className="text-slate-400">Alarms:</strong> {h.outstandingAlarms || 'None'}</p>
                  <p><strong className="text-slate-400">Temporary Fix:</strong> {h.temporaryRepairDetails || 'None'}</p>
                  <p><strong className="text-slate-400">Safety Concerns:</strong> <span className="text-rose-400">{h.safetyConcerns}</span></p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pending Jobs & Instructions</span>
                  <p className="text-slate-200 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    {h.handoverRemarks || 'Standard continuation of production schedule.'}
                  </p>
                  {h.pendingJobs && (
                    <p className="text-[11px] text-slate-400">
                      <strong>Remaining Work:</strong> {h.pendingJobs}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Handover Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-heading-industrial font-bold text-white text-sm">
                Log Shop-Floor Shift Handover
              </span>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Shift</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Shift 1 (Morning)">Shift 1 (Morning)</option>
                    <option value="Shift 2 (Evening)">Shift 2 (Evening)</option>
                    <option value="Shift 3 (Night)">Shift 3 (Night)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Machine ID</label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.machineId}>{m.machineId} - {m.machineName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Machine Status</label>
                  <select
                    value={machineRunningStatus}
                    onChange={(e) => setMachineRunningStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="running">Running (Nominal)</option>
                    <option value="breakdown">Breakdown Stopped</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="idle">Idle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Production Status</label>
                  <select
                    value={productionStatus}
                    onChange={(e) => setProductionStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Normal Production">Normal Production</option>
                    <option value="Reduced Feed/Speed">Reduced Feed/Speed</option>
                    <option value="Waiting Material">Waiting Material</option>
                    <option value="Line Idle">Line Idle</option>
                    <option value="Down">Down</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Outstanding CNC Alarms</label>
                <input
                  type="text"
                  value={outstandingAlarms}
                  onChange={(e) => setOutstandingAlarms(e.target.value)}
                  placeholder="e.g. None or EX1012 intermittent warning"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Temporary Fixes / Interventions</label>
                <input
                  type="text"
                  value={temporaryRepairDetails}
                  onChange={(e) => setTemporaryRepairDetails(e.target.value)}
                  placeholder="e.g. Cleaned air blast nozzle; monitor sensor SQ24"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Safety Concerns</label>
                <input
                  type="text"
                  value={safetyConcerns}
                  onChange={(e) => setSafetyConcerns(e.target.value)}
                  placeholder="e.g. Ensure door interlock is locked"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Handover Remarks for Next Shift *</label>
                <textarea
                  rows={2}
                  value={handoverRemarks}
                  onChange={(e) => setHandoverRemarks(e.target.value)}
                  placeholder="Instructions, batch quantities, precautions for next shift..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Save Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
