import React, { useState } from 'react';
import { 
  HardDriveDownload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  ShieldCheck, 
  FileCode, 
  History, 
  X,
  Server
} from 'lucide-react';
import { MachineBackup, Machine, ControllerType, User } from '../types';
import { storageService } from '../services/storage';

interface MachineBackupsProps {
  currentUser: User;
}

export const MachineBackups: React.FC<MachineBackupsProps> = ({ currentUser }) => {
  const [backups, setBackups] = useState<MachineBackup[]>(storageService.getMachineBackups());
  const [showNewModal, setShowNewModal] = useState(false);
  const machines = storageService.getMachines();

  // Form State
  const [machineId, setMachineId] = useState(machines[0]?.machineId || '');
  const [backupDate, setBackupDate] = useState(new Date().toISOString().split('T')[0]);
  const [backupType, setBackupType] = useState<MachineBackup['backupType']>('Complete SRAM');
  const [controllerType, setControllerType] = useState<ControllerType>('FANUC');
  const [softwareVersion, setSoftwareVersion] = useState('B0F4-0018-02.10');
  const [backupLocation, setBackupLocation] = useState('//dns-nas-01/backups/');
  const [fileChecksum, setFileChecksum] = useState('SHA256: 8f4b1e9c22d76a0019283e74bcf61e938472910aefbca9104812390ff12398ab');
  const [verificationStatus, setVerificationStatus] = useState<MachineBackup['verificationStatus']>('Verified OK');
  const [remarks, setRemarks] = useState('');

  const reloadBackups = () => {
    setBackups(storageService.getMachineBackups());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const m = machines.find(item => item.machineId === machineId);
    if (!m) return;

    const newBackup: MachineBackup = {
      id: `BAK-${Date.now()}`,
      machineId: m.machineId,
      machineName: m.machineName,
      backupDate,
      backupType,
      controllerType,
      softwareVersion,
      backupLocation,
      fileChecksum,
      createdBy: currentUser.name,
      verificationStatus,
      restorationHistory: [],
      remarks: remarks || 'Standard scheduled CNC memory archive.'
    };

    storageService.saveMachineBackup(newBackup);
    setShowNewModal(false);
    reloadBackups();
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              CNC CONFIGURATION BACKUP & RESTORE ARCHIVE
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
              Disaster Recovery
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controlled tracking of Fanuc/Siemens/Mitsubishi SRAM images, parameters, macro variables, PMC ladders, and cryptographic checksums.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Backup</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-900/60 flex items-start gap-3 text-xs text-slate-300">
        <Server className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-semibold">Controlled Recordkeeping Protocol</strong>
          <span>
            This module stores verified checksums and storage locations for disaster recovery. It does not automatically overwrite physical CNC control registers without physical shop-floor key authorization.
          </span>
        </div>
      </div>

      {/* Backup Cards List */}
      <div className="space-y-3">
        {backups.map(b => (
          <div key={b.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-blue-400 font-bold text-xs">{b.machineId}</span>
                <span className="text-white font-semibold text-xs">• {b.machineName}</span>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
                  {b.controllerType} ({b.softwareVersion})
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800">
                  {b.backupType}
                </span>
              </div>

              <span className={`px-2.5 py-1 rounded text-[11px] font-bold self-start sm:self-auto ${
                b.verificationStatus === 'Verified OK'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {b.verificationStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 text-[10px] block">Storage Location</span>
                <span className="font-mono text-slate-200 bg-slate-950 px-2 py-1 rounded block truncate border border-slate-800">
                  {b.backupLocation}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Checksum (SHA256)</span>
                <span className="font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded block truncate border border-slate-800">
                  {b.fileChecksum}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Backup Date: <strong className="text-slate-200">{b.backupDate}</strong> • Created by: {b.createdBy}</span>
              {b.restorationHistory && b.restorationHistory.length > 0 && (
                <span className="text-emerald-400 font-mono">
                  Restored {b.restorationHistory.length} time(s) successfully
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-heading-industrial font-bold text-white text-sm">
                Record Machine Configuration Backup
              </span>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Machine</label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.machineId}>{m.machineId} - {m.machineName} ({m.model})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Backup Type</label>
                  <select
                    value={backupType}
                    onChange={(e) => setBackupType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Complete SRAM">Complete SRAM</option>
                    <option value="Parameters (CNC)">Parameters (CNC)</option>
                    <option value="Macro Variables">Macro Variables</option>
                    <option value="Pitch Error Compensation">Pitch Error Compensation</option>
                    <option value="PMC Ladder / PLC">PMC Ladder / PLC</option>
                    <option value="Part Programs">Part Programs</option>
                    <option value="Tool Data / Offsets">Tool Data / Offsets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Backup Date</label>
                  <input
                    type="date"
                    value={backupDate}
                    onChange={(e) => setBackupDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Backup Network / Cloud Location</label>
                <input
                  type="text"
                  value={backupLocation}
                  onChange={(e) => setBackupLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">SHA256 File Checksum</label>
                <input
                  type="text"
                  value={fileChecksum}
                  onChange={(e) => setFileChecksum(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Verification Status</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Verified OK">Verified OK (Checksum Validated)</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Failed Checksum">Failed Checksum</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Taken before kinematic laser re-alignment"
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
