import React, { useState } from 'react';
import { 
  Cpu, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Building2, 
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Eye,
  Edit3,
  Trash2,
  QrCode,
  ScanLine
} from 'lucide-react';
import { Machine, ControllerType, MachineStatus, User } from '../types';

interface MachineRegistryProps {
  machines: Machine[];
  onSelectMachine: (machine: Machine) => void;
  onOpenNewMachineModal: () => void;
  onEditMachine: (machine: Machine) => void;
  onDeleteMachine: (machineId: string) => void;
  onReportBreakdownForMachine: (machine: Machine) => void;
  onOpenQRScanner: () => void;
  onViewQRPlate: (machine: Machine) => void;
  currentUser: User;
}

export const MachineRegistry: React.FC<MachineRegistryProps> = ({
  machines,
  onSelectMachine,
  onOpenNewMachineModal,
  onEditMachine,
  onDeleteMachine,
  onReportBreakdownForMachine,
  onOpenQRScanner,
  onViewQRPlate,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [controllerFilter, setControllerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');

  const customerNames = Array.from(new Set(machines.map(m => m.customerName)));

  const filteredMachines = machines.filter(m => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        m.machineId.toLowerCase().includes(q) ||
        m.machineName.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q) ||
        m.serialNumber.toLowerCase().includes(q) ||
        m.customerName.toLowerCase().includes(q) ||
        m.controllerModel.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (controllerFilter !== 'all' && m.controllerType !== controllerFilter) return false;
    if (statusFilter !== 'all' && m.operatingStatus !== statusFilter) return false;
    if (customerFilter !== 'all' && m.customerName !== customerFilter) return false;

    return true;
  });

  const getStatusBadge = (status: MachineStatus) => {
    switch (status) {
      case 'running':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'breakdown':
        return 'bg-red-950 text-red-400 border-red-800 animate-pulse';
      case 'maintenance':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'idle':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'decommissioned':
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              CNC MACHINE FLEET REGISTRY
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-blue-400 border border-blue-800/60 uppercase">
              {machines.length} Total Units
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete database of installed DN Solutions CNC machining centers, turning centers, controllers, and warranties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenQRScanner}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all transform active:scale-95"
            title="Scan machine identification plate QR code using camera"
          >
            <ScanLine className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>Scan Machine Plate (QR)</span>
          </button>

          {canManage && (
            <button
              onClick={onOpenNewMachineModal}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Machine</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, model, S/N, customer..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Controller Filter */}
          <div>
            <select
              value={controllerFilter}
              onChange={(e) => setControllerFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All CNC Controllers</option>
              <option value="FANUC">FANUC Controllers</option>
              <option value="Siemens">Siemens SINUMERIK</option>
              <option value="Mitsubishi">Mitsubishi M80</option>
              <option value="Heidenhain">Heidenhain TNC</option>
              <option value="Other">Other Controllers</option>
            </select>
          </div>

          {/* Operating Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All Operating Statuses</option>
              <option value="running">Running in Production</option>
              <option value="breakdown">Breakdown Stopped</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="idle">Idle / Standby</option>
            </select>
          </div>

          {/* Customer */}
          <div>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All Customers / Plants</option>
              {customerNames.map(cName => (
                <option key={cName} value={cName}>{cName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 text-slate-400">
          <span>Displaying <strong className="text-white">{filteredMachines.length}</strong> registered machines</span>
        </div>
      </div>

      {/* Grid of Machines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMachines.map(machine => (
          <div
            key={machine.id}
            onClick={() => onSelectMachine(machine)}
            className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all shadow-sm hover:shadow-xl hover:shadow-blue-950/20 flex flex-col justify-between"
          >
            <div>
              {/* Photo & Status Banner */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                {machine.machinePhotoUrl ? (
                  <img
                    src={machine.machinePhotoUrl}
                    alt={machine.machineName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <Cpu className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                
                {/* Status Pill */}
                <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-md ${getStatusBadge(machine.operatingStatus)}`}>
                  {machine.operatingStatus}
                </span>

                {/* Machine ID Tag */}
                <div className="absolute bottom-3 left-3">
                  <span className="font-mono-industrial font-bold text-sm text-white bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-700/80 backdrop-blur-sm">
                    {machine.machineId}
                  </span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 space-y-2.5">
                <div>
                  <h3 className="font-heading-industrial font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                    {machine.machineName}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Model: <strong className="text-slate-200">{machine.model}</strong> • {machine.machineType}
                  </p>
                </div>

                <div className="space-y-1 text-xs pt-1 border-t border-slate-800/80">
                  <div className="flex justify-between text-slate-400">
                    <span>Controller:</span>
                    <strong className="text-slate-200">{machine.controllerType} ({machine.controllerModel})</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Serial No:</span>
                    <span className="font-mono text-slate-300">{machine.serialNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Customer:</span>
                    <span className="text-slate-200 truncate max-w-[160px]">{machine.customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Plant & Line:</span>
                    <span className="text-slate-300 truncate max-w-[160px]">{machine.factory} • {machine.productionLine}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Assigned To:</span>
                    <strong className="text-blue-400 font-semibold">{machine.responsibleTechnician || 'Unassigned'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-blue-400 font-medium flex items-center gap-1 group-hover:underline">
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Profile</span>
              </span>

              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onViewQRPlate(machine)}
                  className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-blue-400 border border-slate-700/60 transition-colors"
                  title="View & Print Machine QR Code Plate"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onReportBreakdownForMachine(machine)}
                  className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/50 transition-colors"
                  title="Report Fault on this machine"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
                {canManage && (
                  <>
                    <button
                      onClick={() => onEditMachine(machine)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Edit Machine Specifications"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete machine ${machine.machineId}?`)) {
                          onDeleteMachine(machine.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Machine"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredMachines.length === 0 && (
          <div className="col-span-full p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Machines Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting the filter options above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
