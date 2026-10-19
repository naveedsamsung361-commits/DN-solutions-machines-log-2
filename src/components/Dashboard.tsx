import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  PlayCircle, 
  Wrench, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Activity, 
  ShieldAlert, 
  Calendar, 
  Package,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  BarChart2,
  PieChart,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  DollarSign,
  X,
  HelpCircle,
  Building2,
  Factory,
  RefreshCw
} from 'lucide-react';
import { DateFilterOption, Machine, BreakdownTicket, Customer } from '../types';
import { storageService } from '../services/storage';

interface DashboardProps {
  onNavigate: (tab: any) => void;
  onOpenNewTicket: () => void;
  onSelectMachine: (machine: Machine) => void;
  onSelectTicket: (ticket: BreakdownTicket) => void;
  onOpenAIAssistant?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenNewTicket,
  onSelectMachine,
  onSelectTicket,
  onOpenAIAssistant
}) => {
  // Multi-dimensional filters
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('last30');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedFactory, setSelectedFactory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [chartMetric, setChartMetric] = useState<'downtime' | 'count'>('downtime');

  const allMachines = storageService.getMachines();
  const allTickets = storageService.getTickets();
  const customers = storageService.getCustomers();
  const handovers = storageService.getShiftHandovers();

  // Extract unique factories and departments
  const uniqueFactories = useMemo(() => {
    const set = new Set<string>();
    allMachines.forEach(m => { if (m.factory) set.add(m.factory); });
    return Array.from(set);
  }, [allMachines]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    allMachines.forEach(m => { if (m.department) set.add(m.department); });
    return Array.from(set);
  }, [allMachines]);

  // Query metrics with multi-dimensional criteria
  const metrics = storageService.getDashboardMetrics(
    dateFilter, 
    customStart, 
    customEnd,
    {
      machineId: selectedMachineId !== 'all' ? selectedMachineId : undefined,
      customerId: selectedCustomerId !== 'all' ? selectedCustomerId : undefined,
      factory: selectedFactory !== 'all' ? selectedFactory : undefined,
      department: selectedDepartment !== 'all' ? selectedDepartment : undefined
    }
  );

  // Scoped tickets for interactive charts
  const filteredTickets = useMemo(() => {
    let tList = allTickets;
    if (selectedMachineId !== 'all') {
      tList = tList.filter(t => t.machineId === selectedMachineId);
    }
    if (selectedCustomerId !== 'all') {
      tList = tList.filter(t => t.customerId === selectedCustomerId);
    }
    if (selectedFactory !== 'all') {
      tList = tList.filter(t => t.factory === selectedFactory);
    }
    if (selectedDepartment !== 'all') {
      tList = tList.filter(t => t.department === selectedDepartment);
    }
    return storageService.filterByDateRange(tList, dateFilter, customStart, customEnd);
  }, [allTickets, dateFilter, customStart, customEnd, selectedMachineId, selectedCustomerId, selectedFactory, selectedDepartment]);

  // Calculate Breakdown by Category
  const categoryStats: Record<string, { count: number; downtime: number }> = {};
  filteredTickets.forEach(t => {
    const cat = t.faultCategory || 'Other';
    if (!categoryStats[cat]) categoryStats[cat] = { count: 0, downtime: 0 };
    categoryStats[cat].count += 1;
    categoryStats[cat].downtime += t.totalDowntimeMinutes || 0;
  });

  const categoryList = Object.entries(categoryStats)
    .map(([category, val]) => ({ category, count: val.count, downtimeHours: parseFloat((val.downtime / 60).toFixed(1)) }))
    .sort((a, b) => (chartMetric === 'downtime' ? b.downtimeHours - a.downtimeHours : b.count - a.count));

  const maxCategoryVal = Math.max(...categoryList.map(c => chartMetric === 'downtime' ? c.downtimeHours : c.count), 1);

  // Downtime by Machine
  const machineDowntimeList = allMachines
    .filter(m => selectedMachineId === 'all' || m.machineId === selectedMachineId)
    .map(m => {
      const mTickets = filteredTickets.filter(t => t.machineId === m.machineId || t.machineName === m.machineName);
      const downtimeMinutes = mTickets.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0);
      return {
        machine: m,
        ticketCount: mTickets.length,
        downtimeHours: parseFloat((downtimeMinutes / 60).toFixed(1))
      };
    }).sort((a, b) => b.downtimeHours - a.downtimeHours);

  const maxMachineDowntime = Math.max(...machineDowntimeList.map(m => m.downtimeHours), 1);

  // Unacknowledged handovers
  const unackHandoversCount = handovers.filter(h => !h.acknowledgedAt).length;

  const hasActiveFilters = selectedMachineId !== 'all' || selectedCustomerId !== 'all' || selectedFactory !== 'all' || selectedDepartment !== 'all';

  const resetFilters = () => {
    setSelectedMachineId('all');
    setSelectedCustomerId('all');
    setSelectedFactory('all');
    setSelectedDepartment('all');
    setDateFilter('last30');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              PLANT OPERATIONS & RELIABILITY DASHBOARD
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
              Live Hub
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fleet telemetry, breakdown metrics, downtime distribution, and maintenance compliance.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenAIAssistant && (
            <button
              onClick={onOpenAIAssistant}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-900/30 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
              <span>Ask AI Assistant</span>
            </button>
          )}

          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View MTTR, MTBF, Availability, and OEE calculation definitions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Formulas & Standards</span>
          </button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>OPERATIONAL DATA FILTERS</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
          {/* Date Filter Range */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Time Horizon</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Machine Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Machine</label>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Machines ({allMachines.length})</option>
              {allMachines.map(m => (
                <option key={m.id} value={m.machineId}>
                  {m.machineId} - {m.model}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Customers ({customers.length})</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Factory Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Factory</label>
            <select
              value={selectedFactory}
              onChange={(e) => setSelectedFactory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Factories</option>
              {uniqueFactories.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateFilter === 'custom' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
            <span className="text-slate-300 font-medium">Custom Range:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
            >
            </input>
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
            >
            </input>
          </div>
        )}
      </div>

      {/* Calculation Definitions Dialog (Formulas & Standards) */}
      {showFormulaInfo && (
        <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="font-heading-industrial font-bold text-sm text-white uppercase tracking-wider">
                Industrial Calculation Definitions & Standards (ISO / DIN 31051)
              </h3>
            </div>
            <button onClick={() => setShowFormulaInfo(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-blue-400 uppercase block">MTTR (Mean Time to Repair)</span>
              <p className="text-slate-300">{metrics.calculationDefinitions.mttr}</p>
              <span className="text-[10px] text-slate-400 block pt-1">Counts verified completed repairs. Excludes parts waiting delays.</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-indigo-400 uppercase block">MTBF (Mean Time Between Failures)</span>
              <p className="text-slate-300">{metrics.calculationDefinitions.mtbf}</p>
              <span className="text-[10px] text-slate-400 block pt-1">Measures operational uptime reliability between critical fault trips.</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-emerald-400 uppercase block">Machine Availability (%)</span>
              <p className="text-slate-300">{metrics.calculationDefinitions.availability}</p>
              <span className="text-[10px] text-slate-400 block pt-1">Planned production time baseline = 360 hrs/month (two shifts).</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-purple-400 uppercase block">OEE (Overall Equipment Effectiveness)</span>
              <p className="text-slate-300">{metrics.calculationDefinitions.oee}</p>
              <span className="text-[10px] text-slate-400 block pt-1">Requires measured production counts and scrap ratios to display factually.</span>
            </div>
          </div>
        </div>
      )}

      {/* Operational Machine Fleet Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Registered */}
        <div 
          onClick={() => onNavigate('machines')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-850 shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total CNC Machines</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono-industrial text-white">{metrics.totalMachines}</span>
            <span className="text-xs text-slate-400">units</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
            <span>Idle: <strong className="text-slate-300">{metrics.idleMachines}</strong></span>
            <span>•</span>
            <span className="text-blue-400 flex items-center hover:underline">View Fleet &rarr;</span>
          </div>
        </div>

        {/* Running */}
        <div 
          onClick={() => onNavigate('machines')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-850 shadow-sm group"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Currently Running</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono-industrial text-emerald-400">{metrics.runningMachines}</span>
            <span className="text-xs text-slate-400">in production</span>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400/90 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Availability: {metrics.machineAvailabilityPct}%</span>
          </div>
        </div>

        {/* Under Maintenance */}
        <div 
          onClick={() => onNavigate('tickets')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-850 shadow-sm group"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Under Maintenance</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono-industrial text-amber-400">{metrics.maintenanceMachines}</span>
            <span className="text-xs text-slate-400">active jobs</span>
          </div>
          <div className="mt-3 text-[11px] text-amber-400/80 flex items-center gap-1">
            <span>Diagnostics & service active</span>
          </div>
        </div>

        {/* Stopped Breakdown */}
        <div 
          onClick={() => onNavigate('tickets')}
          className="bg-slate-900 border border-slate-800 hover:border-red-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-850 shadow-sm group"
        >
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Stopped Breakdown</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono-industrial text-red-400">{metrics.breakdownMachines}</span>
            <span className="text-xs text-slate-400">line down</span>
          </div>
          <div className="mt-3 text-[11px] text-red-400/80 flex items-center gap-1">
            <span>Critical faults: {metrics.criticalFaults}</span>
          </div>
        </div>

        {/* Unacknowledged Handovers / Approvals */}
        <div 
          onClick={() => onNavigate('handover')}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-850 shadow-sm group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Shift Handovers</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono-industrial text-purple-400">{unackHandoversCount}</span>
            <span className="text-xs text-slate-400">pending</span>
          </div>
          <div className="mt-3 text-[11px] text-purple-400/80 flex items-center gap-1">
            <span>{unackHandoversCount > 0 ? 'Action required' : 'All acknowledged'}</span>
          </div>
        </div>
      </div>

      {/* Industrial Key Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Open Maintenance Tickets */}
        <div 
          onClick={() => onNavigate('tickets')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 cursor-pointer transition-all"
        >
          <div className="text-[11px] text-slate-400 uppercase font-medium">Open Tickets</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-industrial text-white mt-1">
            {metrics.openTicketsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Pending: {metrics.pendingRepairJobs}</div>
        </div>

        {/* Critical Unresolved Breakdowns */}
        <div 
          onClick={() => onNavigate('tickets')}
          className="bg-slate-900 border border-red-900/40 rounded-xl p-3.5 hover:border-red-700 cursor-pointer transition-all"
        >
          <div className="text-[11px] text-red-400 uppercase font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Critical Faults</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-industrial text-red-400 mt-1">
            {metrics.criticalFaults}
          </div>
          <div className="text-[10px] text-red-400/80 mt-1">Line-stopping alarms</div>
        </div>

        {/* Downtime Today & This Week */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Downtime (Today)</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-industrial text-white mt-1">
            {metrics.downtimeTodayHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Week: {metrics.downtimeThisWeekHours} hrs • Month: {metrics.downtimeThisMonthHours} hrs</div>
        </div>

        {/* MTTR (Mean Time To Repair) */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 cursor-pointer transition-all"
        >
          <div className="text-[11px] text-slate-400 uppercase font-medium">Avg MTTR</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-industrial text-blue-400 mt-1">
            {metrics.mttrHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Avg Repair: {metrics.avgRepairDurationHours} hrs</div>
        </div>

        {/* MTBF (Mean Time Between Failures) */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 cursor-pointer transition-all"
        >
          <div className="text-[11px] text-slate-400 uppercase font-medium">MTBF</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-industrial text-indigo-400 mt-1">
            {metrics.mtbfHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Mean Time Between Failures</div>
        </div>

        {/* Maintenance Cost & Loss */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 cursor-pointer transition-all"
        >
          <div className="text-[11px] text-slate-400 uppercase font-medium">Maintenance Cost</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-industrial text-emerald-400 mt-1">
            ${(metrics.totalMaintenanceCost / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Prod Loss: ~${(metrics.estimatedProductionLoss / 1000).toFixed(1)}k</div>
        </div>
      </div>

      {/* Critical Alert Bar for Warranty & Low Stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Warranty Expiring / Expired */}
        <div 
          onClick={() => onNavigate('warranty')}
          className="bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-800/40 rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:border-blue-700 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Warranty Attention</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {metrics.warrantyExpiringSoon} expiring soon (&lt; 30d) • {metrics.warrantyExpired} expired
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Preventive Maintenance Tasks */}
        <div 
          onClick={() => onNavigate('pm')}
          className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-800/40 rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:border-amber-700 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Preventive Maintenance</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {metrics.pmDue} tasks scheduled • <span className="text-amber-400 font-semibold">{metrics.pmOverdue} overdue</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Spare Parts Replenishment */}
        <div 
          onClick={() => onNavigate('spares')}
          className="bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-800/40 rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:border-rose-700 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Spare Parts Replenishment</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {metrics.lowStockPartsCount} below threshold ({metrics.outOfStockPartsCount} out of stock)
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downtime by Fault Category Pareto Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-heading-industrial flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                Fault Category Breakdown & Pareto
              </h3>
              <p className="text-[11px] text-slate-400">Ranking by downtime hours vs incident frequency</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setChartMetric('downtime')}
                className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                  chartMetric === 'downtime' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hours
              </button>
              <button
                onClick={() => setChartMetric('count')}
                className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                  chartMetric === 'count' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Count
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {categoryList.slice(0, 6).map((cat, idx) => {
              const val = chartMetric === 'downtime' ? cat.downtimeHours : cat.count;
              const pct = Math.max(5, Math.round((val / maxCategoryVal) * 100));

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[200px]">
                      {idx + 1}. {cat.category}
                    </span>
                    <span className="font-mono text-slate-400">
                      {chartMetric === 'downtime' ? `${cat.downtimeHours} hrs (${cat.count} faults)` : `${cat.count} faults (${cat.downtimeHours} hrs)`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 
                          ? 'bg-rose-500' 
                          : idx === 1 
                          ? 'bg-amber-500' 
                          : idx === 2 
                          ? 'bg-blue-500' 
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {categoryList.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No breakdown incidents recorded in this filtered timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Machine Downtime Distribution & Availability */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-heading-industrial flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Downtime by Machine Unit
              </h3>
              <p className="text-[11px] text-slate-400">CNC machine availability & cumulative outage</p>
            </div>
            <button
              onClick={() => onNavigate('machines')}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
            >
              All Machines
            </button>
          </div>

          <div className="space-y-3">
            {machineDowntimeList.slice(0, 5).map((mItem) => {
              const pct = Math.max(5, Math.round((mItem.downtimeHours / maxMachineDowntime) * 100));

              return (
                <div 
                  key={mItem.machine.id} 
                  onClick={() => onSelectMachine(mItem.machine)}
                  className="p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{mItem.machine.machineId}</span>
                      <span className="text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">{mItem.machine.model}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-rose-400 font-semibold">{mItem.downtimeHours} hrs</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${
                        mItem.machine.operatingStatus === 'running' 
                          ? 'bg-emerald-950 text-emerald-400' 
                          : mItem.machine.operatingStatus === 'breakdown' 
                          ? 'bg-red-950 text-red-400' 
                          : 'bg-amber-950 text-amber-400'
                      }`}>
                        {mItem.machine.operatingStatus}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
