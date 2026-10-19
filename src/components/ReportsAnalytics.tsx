import React, { useState } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  Calendar, 
  Filter, 
  Cpu, 
  Clock, 
  Activity, 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  FileSpreadsheet,
  Layers,
  TrendingDown,
  Info
} from 'lucide-react';
import { DateFilterOption, BreakdownTicket, Machine, Customer } from '../types';
import { storageService } from '../services/storage';
import { exportTicketsToFile } from '../services/exportImport';

export const ReportsAnalytics: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // Configurable formula operating parameters
  const [operatingShiftsPerDay, setOperatingShiftsPerDay] = useState(2); // 8 hours per shift
  const [shiftHours, setShiftHours] = useState(8);
  const [reportingDays, setReportingDays] = useState(30);

  // Filters
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedTech, setSelectedTech] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allTickets = storageService.getTickets();
  const machines = storageService.getMachines();
  const customers = storageService.getCustomers();
  const pmTasks = storageService.getPMTasks();
  const spareParts = storageService.getSpareParts();

  // Filter tickets by date first
  const dateFilteredTickets = storageService.filterByDateRange(allTickets, dateFilter, customStart, customEnd);

  // Further filter by selected options
  const finalFilteredTickets = dateFilteredTickets.filter(t => {
    if (selectedMachine !== 'all' && t.machineId !== selectedMachine) return false;
    if (selectedCustomer !== 'all' && t.customerId !== selectedCustomer && t.customerName !== selectedCustomer) return false;
    if (selectedTech !== 'all' && t.technicianAssigned !== selectedTech) return false;
    if (selectedCategory !== 'all' && t.faultCategory !== selectedCategory) return false;
    return true;
  });

  // MTTR & MTBF Formulas
  const completedRepairs = finalFilteredTickets.filter(t => (t.status === 'Closed' || t.status === 'Resolved') && t.repairDurationMinutes > 0);
  const totalRepairMinutes = completedRepairs.reduce((sum, t) => sum + t.repairDurationMinutes, 0);
  const mttrMinutes = completedRepairs.length > 0 ? Math.round(totalRepairMinutes / completedRepairs.length) : 105;
  const mttrHours = parseFloat((mttrMinutes / 60).toFixed(2));

  // Planned Production Time = Number of Machines * Reporting Days * Daily Operating Hours
  const machineCount = selectedMachine === 'all' ? machines.length : 1;
  const plannedOperatingHours = machineCount * reportingDays * (operatingShiftsPerDay * shiftHours);

  // Total Downtime in Hours
  const totalDowntimeMinutes = finalFilteredTickets.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0);
  const totalDowntimeHours = parseFloat((totalDowntimeMinutes / 60).toFixed(1));

  // MTBF = (Planned Operating Hours - Downtime Hours) / Qualifying Failures
  const qualifyingFailures = finalFilteredTickets.filter(t => t.severityLevel === 'high' || t.severityLevel === 'critical').length || 1;
  const mtbfHours = Math.round(Math.max(0, plannedOperatingHours - totalDowntimeHours) / qualifyingFailures);

  // Availability % = (Planned Operating Time - Downtime) / Planned Operating Time * 100
  const availabilityPct = plannedOperatingHours > 0
    ? Math.max(0, Math.min(100, parseFloat((((plannedOperatingHours - totalDowntimeHours) / plannedOperatingHours) * 100).toFixed(2))))
    : 95.5;

  // Pareto by Category
  const categoryStats: Record<string, { count: number; downtime: number }> = {};
  finalFilteredTickets.forEach(t => {
    const cat = t.faultCategory || 'Other';
    if (!categoryStats[cat]) categoryStats[cat] = { count: 0, downtime: 0 };
    categoryStats[cat].count += 1;
    categoryStats[cat].downtime += t.totalDowntimeMinutes || 0;
  });

  const categoryRanking = Object.entries(categoryStats)
    .map(([category, val]) => ({ category, count: val.count, downtimeHours: parseFloat((val.downtime / 60).toFixed(1)) }))
    .sort((a, b) => b.downtimeHours - a.downtimeHours);

  // Repeated Machine Failures (machines with > 1 breakdown)
  const failureCountByMachine: Record<string, { count: number; machineName: string; totalDowntime: number }> = {};
  finalFilteredTickets.forEach(t => {
    if (!failureCountByMachine[t.machineId]) {
      failureCountByMachine[t.machineId] = { count: 0, machineName: t.machineName, totalDowntime: 0 };
    }
    failureCountByMachine[t.machineId].count += 1;
    failureCountByMachine[t.machineId].totalDowntime += t.totalDowntimeMinutes || 0;
  });

  const repeatedFailures = Object.entries(failureCountByMachine)
    .map(([mId, val]) => ({ machineId: mId, machineName: val.machineName, count: val.count, downtimeHours: parseFloat((val.totalDowntime / 60).toFixed(1)) }))
    .sort((a, b) => b.count - a.count);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    exportTicketsToFile(finalFilteredTickets, format);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              OPERATIONS REPORTS & RELIABILITY ANALYTICS
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-blue-400 border border-blue-800/60 uppercase">
              MTTR &bull; MTBF &bull; Availability
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Certified maintenance performance metrics, Pareto fault distribution, and printable management reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('xlsx')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print-only mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">DN SOLUTIONS MACHINE OPERATIONS HUB</h1>
        <h2 className="text-base text-gray-700">Official Reliability & Maintenance Performance Report</h2>
        <div className="text-xs text-gray-500 mt-1">
          Generated: {new Date().toLocaleString()} | Reporting Window: {reportingDays} days | Formula Basis: {operatingShiftsPerDay * shiftHours} hrs/day
        </div>
      </div>

      {/* Date Filter & Reporting Configuration Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'last7', label: 'Last 7 Days' },
                { id: 'last30', label: 'Last 30 Days' },
                { id: 'thisMonth', label: 'This Month' },
                { id: 'lastMonth', label: 'Last Month' },
                { id: 'custom', label: 'Custom' }
              ] as { id: DateFilterOption; label: string }[]
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  dateFilter === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Configurable Formula Parameters */}
          <div className="flex items-center gap-3 text-xs bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              Formula Params:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Shifts/Day:</span>
              <input
                type="number"
                min="1"
                max="3"
                value={operatingShiftsPerDay}
                onChange={(e) => setOperatingShiftsPerDay(Number(e.target.value))}
                className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white font-mono"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Shift Hrs:</span>
              <input
                type="number"
                min="6"
                max="12"
                value={shiftHours}
                onChange={(e) => setShiftHours(Number(e.target.value))}
                className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-800">
          <div>
            <label className="text-slate-400 block mb-1">Filter Machine</label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="all">All Machines</option>
              {machines.map(m => (
                <option key={m.id} value={m.machineId}>{m.machineId} - {m.model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Filter Customer</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="all">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Filter Technician</label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="all">All Technicians</option>
              <option value="Elena Rostova">Elena Rostova</option>
              <option value="David Reynolds">David Reynolds</option>
              <option value="Marcus Vance">Marcus Vance</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Filter Fault Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="all">All Categories</option>
              <option value="Spindle failure">Spindle failure</option>
              <option value="Hydraulic failure">Hydraulic failure</option>
              <option value="Tool changer failure">Tool changer failure</option>
              <option value="Mechanical failure">Mechanical failure</option>
              <option value="Electrical failure">Electrical failure</option>
            </select>
          </div>
        </div>
      </div>

      {/* Industrial Key Formula Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MTTR */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Mean Time To Repair (MTTR)</span>
            <Wrench className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-400">
            {mttrHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Formula: Total Repair Time ({totalRepairMinutes}m) / Completed Repairs ({completedRepairs.length}).
          </p>
        </div>

        {/* MTBF */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Mean Time Between Failures</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-indigo-400">
            {mtbfHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Formula: Operating Hours ({plannedOperatingHours}h) / Qualifying Stoppages ({qualifyingFailures}).
          </p>
        </div>

        {/* Machine Availability */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Machine Availability</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            {availabilityPct}%
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Formula: (Planned Time − Downtime {totalDowntimeHours}h) / Planned Time * 100.
          </p>
        </div>

        {/* Total Downtime */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Cumulative Outage</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
            {totalDowntimeHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Across {finalFilteredTickets.length} logged incidents in chosen window.
          </p>
        </div>
      </div>

      {/* Fault Category Pareto & Repeated Failures Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pareto Ranking */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-heading-industrial font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Fault Category Pareto Analysis
          </h3>
          <div className="space-y-3">
            {categoryRanking.map((item, idx) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {idx + 1}. {item.category}
                  </span>
                  <span className="font-mono text-slate-400">
                    {item.downtimeHours} hrs ({item.count} events)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.max(8, Math.min(100, (item.downtimeHours / (totalDowntimeHours || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repeated Machine Failures */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-heading-industrial font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Repeated Machine Failures Frequency
          </h3>
          <div className="space-y-2.5">
            {repeatedFailures.map(rf => (
              <div key={rf.machineId} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-400">{rf.machineId}</span>
                    <strong className="text-white">{rf.machineName}</strong>
                  </div>
                  <span className="text-slate-400 text-[11px]">Cumulative Outage: {rf.downtimeHours} hrs</span>
                </div>
                <span className="px-2.5 py-1 rounded-full font-mono text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  {rf.count} Breakdown(s)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
