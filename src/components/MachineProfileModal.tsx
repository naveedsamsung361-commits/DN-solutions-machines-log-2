import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Wrench, 
  Clock, 
  ShieldCheck, 
  CalendarClock, 
  Package, 
  FileText, 
  Camera, 
  Edit3, 
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layers,
  HardDriveDownload,
  QrCode,
  UserCheck,
  User,
  Phone,
  Mail,
  Download,
  Smartphone,
  ChevronDown,
  Share2,
  Sparkles,
  Save,
  Check
} from 'lucide-react';
import { Machine, BreakdownTicket, User as UserType } from '../types';
import { storageService } from '../services/storage';

interface MachineProfileModalProps {
  isOpen: boolean;
  machine: Machine | null;
  onClose: () => void;
  onEditMachine: (machine: Machine) => void;
  onDeleteMachine: (machineId: string) => void;
  onSelectTicket: (ticket: BreakdownTicket) => void;
  onOpenNewTicketForMachine: (machine: Machine) => void;
  onViewQRPlate?: (machine: Machine) => void;
  onOpenAndroidInstall?: () => void;
  onMachineUpdated?: (updated: Machine) => void;
  currentUser: UserType;
}

export const MachineProfileModal: React.FC<MachineProfileModalProps> = ({
  isOpen,
  machine,
  onClose,
  onEditMachine,
  onDeleteMachine,
  onSelectTicket,
  onOpenNewTicketForMachine,
  onViewQRPlate,
  onOpenAndroidInstall,
  onMachineUpdated,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'breakdowns' | 'pm' | 'warranty' | 'parts' | 'backups'>('info');
  
  // Assigned Technician Re-assignment state
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [showAndroidDownloadMenu, setShowAndroidDownloadMenu] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (machine) {
      setAssignedTechnician(machine.responsibleTechnician || 'Unassigned');
      setIsEditingAssignee(false);
      setSaveSuccessMsg(null);
    }
  }, [machine]);

  if (!isOpen || !machine) return null;

  const users = storageService.getUsers();
  const techniciansList = users.filter(u => u.role === 'technician' || u.role === 'manager' || u.role === 'admin');

  // Find user details of the assigned technician if registered
  const assignedUserDetails = users.find(
    u => u.name.toLowerCase() === assignedTechnician.toLowerCase()
  );

  const allTickets = storageService.getTickets();
  const machineTickets = allTickets.filter(t => t.machineId === machine.machineId || t.machineName === machine.machineName);
  const pmTasks = storageService.getPMTasks().filter(p => p.machineId === machine.machineId || p.machineName === machine.machineName);
  const warranties = storageService.getWarranties().filter(w => w.machineId === machine.machineId);
  const backups = storageService.getMachineBackups().filter(b => b.machineId === machine.machineId);

  const totalDowntimeMinutes = machineTickets.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0);
  const openRepairs = machineTickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved');

  // Spare parts used on this machine across all tickets
  const partsUsedList: { partId: string; partNumber: string; partName: string; quantity: number; ticketNumber: string }[] = [];
  machineTickets.forEach(t => {
    t.sparePartsUsed?.forEach(p => {
      partsUsedList.push({
        partId: p.partId,
        partNumber: p.partNumber,
        partName: p.partName,
        quantity: p.quantity,
        ticketNumber: t.ticketNumber
      });
    });
  });

  const getStatusColor = (status: Machine['operatingStatus']) => {
    switch (status) {
      case 'running': return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'breakdown': return 'bg-red-950 text-red-400 border-red-800';
      case 'maintenance': return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'idle': return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'decommissioned': return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'technician';

  // Save the newly assigned technician
  const handleSaveAssignedTechnician = () => {
    if (!assignedTechnician.trim()) return;
    const updatedMachine: Machine = {
      ...machine,
      responsibleTechnician: assignedTechnician.trim(),
      updatedAt: new Date().toISOString()
    };
    storageService.saveMachine(updatedMachine);
    storageService.logAction(
      'UPDATE',
      'MACHINES',
      machine.id,
      `Reassigned responsible maintenance technician for ${machine.machineId} to ${assignedTechnician.trim()}`
    );
    setIsEditingAssignee(false);
    setSaveSuccessMsg(`Assigned to ${assignedTechnician.trim()}`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    if (onMachineUpdated) {
      onMachineUpdated(updatedMachine);
    }
  };

  // --- ANDROID OFFLINE DOWNLOAD GENERATOR ---
  // Generates a self-contained, mobile-optimized HTML document for Android browsers
  const handleDownloadAndroidPassport = () => {
    const passportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#0b1120">
  <title>${machine.machineId} - DN Solutions Service Passport</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0b1120; color: #e2e8f0; padding: 16px; line-height: 1.5; font-size: 14px; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }
    .tag { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #064e3b; color: #34d399; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
    .row { padding: 6px 0; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; }
    .label { color: #94a3b8; font-size: 12px; }
    .val { font-weight: 600; color: #f8fafc; font-family: monospace; }
    .assigned-box { background: #172554; border: 1px solid #1d4ed8; border-radius: 10px; padding: 12px; margin: 12px 0; }
    .assigned-title { font-size: 11px; text-transform: uppercase; color: #60a5fa; font-weight: 700; margin-bottom: 4px; }
    .tech-name { font-size: 16px; font-weight: 800; color: #ffffff; }
    .badge { background: #1e3a8a; color: #93c5fd; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { text-align: left; background: #1e293b; color: #94a3b8; padding: 8px; font-weight: 600; }
    td { padding: 8px; border-bottom: 1px solid #1e293b; }
    .btn-print { width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 16px; }
    @media print { .btn-print { display: none; } body { background: #fff; color: #000; } .card { border: 1px solid #ccc; background: #fff; } .val, .title, .tech-name { color: #000; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div style="font-size: 10px; color: #60a5fa; font-weight: bold; letter-spacing: 1px;">DN SOLUTIONS OPERATIONS HUB</div>
        <div class="title">${machine.machineId}</div>
        <div style="color: #94a3b8; font-size: 12px;">${machine.model} • S/N: ${machine.serialNumber}</div>
      </div>
      <span class="tag">${machine.operatingStatus}</span>
    </div>

    <!-- Assigned Maintenance Technician Card -->
    <div class="assigned-box">
      <div class="assigned-title">🔧 CURRENT ASSIGNED MAINTENANCE TECHNICIAN</div>
      <div class="tech-name">${machine.responsibleTechnician || 'Unassigned'}</div>
      <div style="color: #93c5fd; font-size: 11px; margin-top: 2px;">
        Responsible for preventive maintenance schedules, breakdown repairs & machine reliability.
      </div>
    </div>

    <div style="font-size: 12px; font-weight: 700; color: #93c5fd; margin-top: 12px; text-transform: uppercase;">Machine Specifications</div>
    <div class="row"><span class="label">Customer</span><span class="val">${machine.customerName}</span></div>
    <div class="row"><span class="label">Location</span><span class="val">${machine.customerLocation} (${machine.factory} • ${machine.productionLine})</span></div>
    <div class="row"><span class="label">CNC Controller</span><span class="val">${machine.controllerType} - ${machine.controllerModel}</span></div>
    <div class="row"><span class="label">Controller S/N</span><span class="val">${machine.controllerSerialNumber || 'N/A'}</span></div>
    <div class="row"><span class="label">Electrical Specs</span><span class="val">${machine.electricalSpecs}</span></div>
    <div class="row"><span class="label">PM Frequency</span><span class="val">${machine.maintenanceFrequency}</span></div>
    <div class="row"><span class="label">Warranty Expiry</span><span class="val">${machine.warrantyExpiryDate || 'N/A'}</span></div>
    <div class="row"><span class="label">Lifetime Downtime</span><span class="val">${(totalDowntimeMinutes / 60).toFixed(1)} Hours (${machineTickets.length} incidents)</span></div>

    <button class="btn-print" onclick="window.print()">Print / Save PDF to Android</button>
  </div>

  <div class="card">
    <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Breakdown & Fix History (${machineTickets.length})</div>
    ${machineTickets.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Ticket #</th>
            <th>Date</th>
            <th>Fault</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${machineTickets.slice(0, 10).map(t => `
            <tr>
              <td style="color:#60a5fa; font-family:monospace; font-weight:bold;">${t.ticketNumber}</td>
              <td style="font-family:monospace;">${t.breakdownDate}</td>
              <td>${t.faultCategory}<br><small style="color:#94a3b8;">${t.faultDescription.substring(0, 45)}...</small></td>
              <td><span class="badge">${t.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color:#94a3b8; font-size:12px; padding:10px 0;">No breakdowns recorded.</p>'}
  </div>

  <footer style="text-align: center; color: #64748b; font-size: 11px; padding: 12px;">
    Generated for Android Mobile Storage • DN Solutions Hub System
  </footer>
</body>
</html>`;

    const blob = new Blob([passportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${machine.machineId}_DN_Service_Passport.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowAndroidDownloadMenu(false);
  };

  // Download Machine Specs as JSON for offline mobile storage
  const handleDownloadMachineJSON = () => {
    const data = {
      machine,
      tickets: machineTickets,
      preventiveMaintenance: pmTasks,
      exportTimestamp: new Date().toISOString(),
      generatedBy: currentUser.name
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${machine.machineId}_Specs_Offline.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowAndroidDownloadMenu(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Banner */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center overflow-hidden shrink-0">
              {machine.machinePhotoUrl ? (
                <img src={machine.machinePhotoUrl} alt={machine.machineName} className="w-full h-full object-cover" />
              ) : (
                <Cpu className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading-industrial font-bold text-base sm:text-xl text-white tracking-wide">
                  {machine.machineId} : {machine.machineName}
                </h2>
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold capitalize border ${getStatusColor(machine.operatingStatus)}`}>
                  {machine.operatingStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {machine.model} • S/N: <span className="font-mono text-slate-300">{machine.serialNumber}</span> • {machine.customerName}
              </p>
            </div>
          </div>

          {/* Action Bar with 'Download for Android' & QR Plate */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* ANDROID DOWNLOAD BUTTON DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setShowAndroidDownloadMenu(!showAndroidDownloadMenu)}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-transform active:scale-95"
                title="Download machine data & passport easily for Android devices"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Download for Android</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showAndroidDownloadMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      Android Mobile Download
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Save machine profile for offline shop-floor use
                    </p>
                  </div>
                  <div className="py-1 space-y-1">
                    <button
                      onClick={handleDownloadAndroidPassport}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
                    >
                      <Download className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <span className="font-semibold block">Download Service Passport (HTML)</span>
                        <span className="text-[10px] text-slate-400">Offline printable sheet for Android phones</span>
                      </div>
                    </button>

                    <button
                      onClick={handleDownloadMachineJSON}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
                    >
                      <HardDriveDownload className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-semibold block">Download Machine JSON Data</span>
                        <span className="text-[10px] text-slate-400">Raw backup for mobile offline apps</span>
                      </div>
                    </button>

                    {onViewQRPlate && (
                      <button
                        onClick={() => {
                          setShowAndroidDownloadMenu(false);
                          onViewQRPlate(machine);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
                      >
                        <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <span className="font-semibold block">View & Print Machine QR Plate</span>
                          <span className="text-[10px] text-slate-400">Asset barcode for mobile scanning</span>
                        </div>
                      </button>
                    )}

                    {onOpenAndroidInstall && (
                      <div className="pt-1 mt-1 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setShowAndroidDownloadMenu(false);
                            onOpenAndroidInstall();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/80 text-emerald-300 font-semibold transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <span className="block">Install Hub App on Android</span>
                            <span className="text-[10px] text-emerald-400/80">Add to Android home screen</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {onViewQRPlate && (
              <button
                onClick={() => onViewQRPlate(machine)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="View & Print Machine QR Code Identification Plate"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Plate</span>
              </button>
            )}

            <button
              onClick={() => onOpenNewTicketForMachine(machine)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Fault</span>
            </button>

            {canEdit && (
              <button
                onClick={() => onEditMachine(machine)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto text-xs shrink-0 scrollbar-none">
          {[
            { id: 'info', label: 'Machine Profile & Specs' },
            { id: 'breakdowns', label: `Breakdowns & Repairs (${machineTickets.length})` },
            { id: 'pm', label: `Preventive Maintenance (${pmTasks.length})` },
            { id: 'warranty', label: 'Warranty & SLA' },
            { id: 'parts', label: `Parts Consumed (${partsUsedList.length})` },
            { id: 'backups', label: `CNC Backups (${backups.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-300">
          
          {/* TAB 1: MACHINE SPECS & INFORMATION */}
          {activeTab === 'info' && (
            <div className="space-y-6">

              {/* DEDICATED PROMINENT 'ASSIGNED TO' TECHNICIAN CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 border-2 border-blue-600/50 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/50 flex items-center justify-center shrink-0">
                      <UserCheck className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold">
                          Assigned Maintenance Technician
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Active Lead
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <h3 className="font-heading-industrial font-bold text-lg text-white tracking-wide">
                          {machine.responsibleTechnician || 'Unassigned Technician'}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Sole personnel currently responsible for maintenance tracking, breakdown troubleshooting, and trial runs on this machine.
                      </p>
                    </div>
                  </div>

                  {/* Reassign Button or Toggle */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {saveSuccessMsg && (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3.5 h-3.5" />
                        {saveSuccessMsg}
                      </span>
                    )}

                    {!isEditingAssignee ? (
                      canEdit && (
                        <button
                          onClick={() => setIsEditingAssignee(true)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/20 hover:border-blue-500 border border-slate-700 text-blue-400 hover:text-blue-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Reassign Technician</span>
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => setIsEditingAssignee(false)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Reassignment Editor */}
                {isEditingAssignee && (
                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-150">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Select Responsible Technician from Roster or type name:
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={assignedTechnician}
                          onChange={(e) => setAssignedTechnician(e.target.value)}
                          className="flex-1 bg-slate-950 border border-blue-500/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                        >
                          <option value="">-- Choose Assigned Technician --</option>
                          {techniciansList.map(u => (
                            <option key={u.id} value={u.name}>
                              {u.name} ({u.role.toUpperCase()} • {u.badgeNumber || u.department})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={assignedTechnician}
                          onChange={(e) => setAssignedTechnician(e.target.value)}
                          placeholder="Or type custom name"
                          className="w-48 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleSaveAssignedTechnician}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-900/40 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Assignment</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Assigned Technician Contact Card */}
                {assignedUserDetails && (
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Badge: <strong className="text-white font-mono">{assignedUserDetails.badgeNumber || 'DN-TECH'}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      {assignedUserDetails.email}
                    </span>
                    {assignedUserDetails.phone && (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        {assignedUserDetails.phone}
                      </span>
                    )}
                    <span className="text-slate-400">
                      Dept: <strong className="text-slate-200">{assignedUserDetails.department}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Top Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Lifetime Downtime</span>
                  <span className="text-xl font-bold font-mono text-rose-400">
                    {parseFloat((totalDowntimeMinutes / 60).toFixed(1))} hrs
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Breakdowns</span>
                  <span className="text-xl font-bold font-mono text-white">{machineTickets.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Active Open Tickets</span>
                  <span className="text-xl font-bold font-mono text-amber-400">{openRepairs.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Commissioned Since</span>
                  <span className="text-sm font-semibold font-mono text-slate-200">{machine.commissioningDate || '—'}</span>
                </div>
              </div>

              {/* Machine Hardware & Electrical Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                    Controller & Hardware Details
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">CNC Controller:</span>
                      <strong className="text-white">{machine.controllerType} - {machine.controllerModel}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Controller Serial No:</span>
                      <span className="font-mono text-slate-200">{machine.controllerSerialNumber || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Firmware / Software:</span>
                      <span className="font-mono text-slate-200">{machine.softwareFirmwareVersion || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Machine Type:</span>
                      <span className="text-slate-200">{machine.machineType}</span>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-400 block mb-1">Configuration / Spindle:</span>
                      <span className="text-slate-200 bg-slate-900 p-2 rounded block">{machine.machineConfiguration || 'Standard'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                    Electrical, Plant & Operations
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Electrical Specs:</span>
                      <span className="text-slate-200">{machine.electricalSpecs}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Customer Location:</span>
                      <span className="text-slate-200">{machine.customerName} ({machine.customerLocation})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Factory / Line:</span>
                      <span className="text-slate-200">{machine.factory} • {machine.productionLine}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Assigned To:</span>
                      <strong className="text-blue-400">{machine.responsibleTechnician}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">PM Frequency:</span>
                      <span className="text-emerald-400 font-semibold">{machine.maintenanceFrequency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {machine.additionalNotes && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Technician Remarks & Machine Notes
                  </span>
                  <p className="text-slate-300 leading-relaxed">{machine.additionalNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BREAKDOWN & REPAIR HISTORY */}
          {activeTab === 'breakdowns' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-white">Full Incident History</span>
                <span className="text-slate-400">{machineTickets.length} records</span>
              </div>

              {machineTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t)}
                  className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-400 font-bold">{t.ticketNumber}</span>
                      <span className="text-slate-400 font-mono">{t.breakdownDate}</span>
                      <span className="font-semibold text-white">[{t.faultCategory}]</span>
                    </div>
                    <p className="text-slate-300 line-clamp-1">{t.faultDescription}</p>
                    {t.alarmCode && (
                      <span className="font-mono text-amber-300 text-[11px]">Alarm: {t.alarmCode}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Downtime</span>
                      <span className="font-mono font-bold text-rose-400">{t.totalDowntimeMinutes} min</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}

              {machineTickets.length === 0 && (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl">
                  Zero breakdown incidents recorded for this machine.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PREVENTIVE MAINTENANCE SCHEDULES */}
          {activeTab === 'pm' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-white">Preventive Maintenance Tasks</span>
                <span className="text-slate-400">{pmTasks.length} tasks scheduled</span>
              </div>

              {pmTasks.map(task => (
                <div key={task.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">{task.taskName}</span>
                      <span className="text-slate-400 text-[11px]">
                        Interval: {task.interval} • Category: {task.category}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      task.status === 'Completed'
                        ? 'bg-emerald-950 text-emerald-400'
                        : task.status === 'Overdue'
                        ? 'bg-rose-950 text-rose-400'
                        : 'bg-amber-950 text-amber-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Due Date: <span className="font-mono text-slate-200">{task.dueDate}</span> • Tech: {task.assignedTechnician}
                  </div>
                </div>
              ))}

              {pmTasks.length === 0 && (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl">
                  No preventive maintenance tasks scheduled for this unit.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WARRANTY INFORMATION */}
          {activeTab === 'warranty' && (() => {
            const daysUntil = machine.warrantyExpiryDate ? Math.ceil((new Date(machine.warrantyExpiryDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)) : null;
            return (
              <div className="space-y-4">
                {daysUntil !== null && daysUntil <= 30 && (
                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 animate-in fade-in ${
                    daysUntil < 0 
                      ? 'bg-rose-950/60 border-rose-600/80 text-rose-200' 
                      : 'bg-amber-950/60 border-amber-500/80 text-amber-200'
                  }`}>
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-xs">
                        {daysUntil < 0 ? 'WARRANTY COVERAGE EXPIRED' : `AUTOMATIC ALERT: WARRANTY EXPIRES IN ${daysUntil} DAYS`}
                      </h4>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {daysUntil < 0 
                          ? `Factory warranty expired ${Math.abs(daysUntil)} days ago. Repairs require authorized contract extension.` 
                          : `Machine warranty is within 30 days of expiring (${machine.warrantyExpiryDate}). An alert was sent to the Notification Center. File open OEM claims before coverage lapses.`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">OEM Factory Warranty Details</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                      daysUntil !== null && daysUntil <= 30
                        ? daysUntil < 0 
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
                        : 'bg-blue-950 text-blue-400 border-blue-800'
                    }`}>
                      {machine.warrantyExpiryDate ? `Expires ${machine.warrantyExpiryDate}` : 'No Data'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                    <div><span className="text-slate-400 block">Warranty Start:</span>{machine.warrantyStartDate || '—'}</div>
                    <div><span className="text-slate-400 block">Warranty Expiry:</span>{machine.warrantyExpiryDate || '—'}</div>
                    <div className="col-span-2 pt-1">
                      <span className="text-slate-400 block">Service Agreement:</span>
                      <span className="text-slate-200">{machine.serviceContractDetails || 'Standard Factory Warranty'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 5: SPARE PARTS CONSUMED */}
          {activeTab === 'parts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-white">Historical Spare Parts Consumed</span>
                <span className="text-slate-400">{partsUsedList.length} parts issued</span>
              </div>

              {partsUsedList.length > 0 ? (
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 text-[11px]">
                      <tr>
                        <th className="p-2">Part Number</th>
                        <th className="p-2">Part Name</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2">Ticket Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {partsUsedList.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono text-blue-400 font-semibold">{p.partNumber}</td>
                          <td className="p-2 text-slate-200">{p.partName}</td>
                          <td className="p-2 text-center font-mono">{p.quantity}</td>
                          <td className="p-2 font-mono text-slate-400">{p.ticketNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl">
                  Zero spare parts issued or replaced for this machine.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CNC BACKUPS */}
          {activeTab === 'backups' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-white">CNC Memory & Parameter Backups</span>
                <span className="text-slate-400">{backups.length} archived backups</span>
              </div>

              {backups.map(b => (
                <div key={b.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{b.backupType}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {b.verificationStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Backup Date: <span className="font-mono text-slate-200">{b.backupDate}</span> • Created by: {b.createdBy}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    Checksum: {b.fileChecksum}
                  </div>
                </div>
              ))}

              {backups.length === 0 && (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl">
                  No configuration backups registered for this machine yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
