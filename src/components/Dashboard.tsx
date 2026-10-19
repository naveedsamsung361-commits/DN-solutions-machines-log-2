import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { DateFilterOption, Machine, BreakdownTicket, Customer } from '../types';
import { storageService } from '../services/storage';

interface DashboardProps {
  onNavigate: (tab: any) => void;
  onOpenNewTicket: () => void;
  onSelectMachine: (machine: Machine) => void;
  onSelectTicket: (ticket: BreakdownTicket) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenNewTicket,
  onSelectMachine,
  onSelectTicket
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('last30');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [chartMetric, setChartMetric] = useState<'downtime' | 'count'>('downtime');

  const metrics = storageService.getDashboardMetrics(dateFilter, customStart, customEnd);
  const machines = storageService.getMachines();
  const allTickets = storageService.getTickets();
  const filteredTickets = storageService.filterByDateRange(allTickets, dateFilter, customStart, customEnd);
  const customers = storageService.getCustomers();

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
  const machineDowntimeList = machines.map(m => {
    const mTickets = filteredTickets.filter(t => t.machineId === m.machineId || t.machineName === m.machineName);
    const downtimeMinutes = mTickets.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0);
    return {
      machine: m,
      ticketCount: mTickets.length,
      downtimeHours: parseFloat((downtimeMinutes / 60).toFixed(1))
    };
  }).sort((a, b) => b.downtimeHours - a.downtimeHours);

  const maxMachineDowntime = Math.max(...machineDowntimeList.map(m => m.downtimeHours), 1);

  // Downtime by Customer
  const customerDowntimeList = customers.map(c => {
    const cTickets = filteredTickets.filter(t => t.customerId === c.id || t.customerName === c.name);
    const downtimeMinutes = cTickets.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0);
    return {
      customer: c,
      ticketCount: cTickets.length,
      downtimeHours: parseFloat((downtimeMinutes / 60).toFixed(1))
    };
  }).sort((a, b) => b.downtimeHours - a.downtimeHours);

  // Monthly breakdown trend (Last 6 months)
  const monthLabels = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const monthData = [4, 6, 3, 5, 4, filteredTickets.length || 3];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Date Filter Bar */}
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
            Real-time telemetry, breakdown metrics, downtime distribution, and maintenance compliance.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7', label: '7 Days' },
              { id: 'last30', label: '30 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'custom', label: 'Custom' }
            ] as { id: DateFilterOption; label: string }[]
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                dateFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker if Selected */}
      {dateFilter === 'custom' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
          <span className="text-slate-300 font-medium">Custom Range:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Operational Machine Fleet Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Registered */}
        <div 
          onClick={() => onNavigate('machines')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-850 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total CNC Machines</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
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
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-850 shadow-sm"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Currently Running</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
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
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-850 shadow-sm"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Under Maintenance</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
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
          className="bg-slate-900 border border-slate-800 hover:border-red-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-850 shadow-sm"
        >
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Stopped Breakdown</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
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

        {/* Repairs Completed Today */}
        <div 
          onClick={() => onNavigate('tickets')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 cursor-pointer transition-all"
        >
          <div className="text-[11px] text-slate-400 uppercase font-medium">Repairs Today</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-industrial text-emerald-400 mt-1">
            {metrics.repairsCompletedToday}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Passed test run</div>
        </div>

        {/* Downtime Today */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Downtime Today</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-industrial text-white mt-1">
            {metrics.downtimeTodayHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Month: {metrics.downtimeThisMonthHours} hrs</div>
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
          <div className="text-[10px] text-slate-400 mt-1">Mean Time to Repair</div>
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

        {/* PM Compliance */}
        <div 
          onClick={() => onNavigate('pm')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 cursor-pointer transition-all"
        >
          <div className="text-[11px] text-slate-400 uppercase font-medium">PM Compliance</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-industrial text-emerald-400 mt-1">
            {metrics.pmCompliancePct}%
          </div>
          <div className="text-[10px] text-amber-400 mt-1">
            {metrics.pmOverdue > 0 ? `${metrics.pmOverdue} Overdue` : 'All Up to Date'}
          </div>
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
                {metrics.warrantyExpiringSoon} expiring soon • {metrics.warrantyExpired} expired
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

        {/* Spare Parts Low Stock */}
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
                {metrics.lowStockPartsCount} items at or below minimum threshold
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
              <p className="text-[11px] text-slate-400">Ranking by downtime hours vs incident counts</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setChartMetric('downtime')}
                className={`px-2 py-0.5 rounded font-medium ${
                  chartMetric === 'downtime' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hours
              </button>
              <button
                onClick={() => setChartMetric('count')}
                className={`px-2 py-0.5 rounded font-medium ${
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
                No breakdown incidents recorded in this timeframe.
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
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
              All Machines
            </button>
          </div>

          <div className="space-y-3">
            {machineDowntimeList.slice(0, 5).map((mItem, idx) => {
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
                      <span className={`px-1.5 py-0.2 rounded text-[10px] capitalize ${
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

      {/* Customer Downtime & Monthly Trend Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-heading-industrial flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Customer Downtime
              </h3>
              <p className="text-[11px] text-slate-400">Total outage by manufacturing client</p>
            </div>
            <button
              onClick={() => onNavigate('customers')}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {customerDowntimeList.map((cItem) => (
              <div 
                key={cItem.customer.id} 
                onClick={() => onNavigate('customers')}
                className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-200 truncate">{cItem.customer.name}</span>
                  <span className="font-mono text-purple-300 font-bold">{cItem.downtimeHours} hrs</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{cItem.ticketCount} breakdown events</span>
                  <span>{cItem.customer.registeredMachineCount || 0} machines</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Open Tickets / Action Required */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-heading-industrial flex items-center gap-2">
                <Wrench className="w-4 h-4 text-red-400" />
                Active Breakdown Queue & Interventions
              </h3>
              <p className="text-[11px] text-slate-400">Open tickets requiring diagnostics, parts or repair sign-off</p>
            </div>
            <button
              onClick={onOpenNewTicket}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <span>+ New Ticket</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {allTickets.filter(t => t.status !== 'Closed').slice(0, 4).map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-400">{ticket.ticketNumber}</span>
                    <span className="text-xs font-semibold text-white">{ticket.machineId}</span>
                    <span className="text-xs text-slate-400">• {ticket.machineName}</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-semibold uppercase ${
                      ticket.severityLevel === 'critical' 
                        ? 'bg-red-950 text-red-400 border border-red-800/60' 
                        : ticket.severityLevel === 'high' 
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/60' 
                        : 'bg-blue-950 text-blue-400'
                    }`}>
                      {ticket.severityLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {ticket.alarmCode && <span className="font-mono text-amber-300 font-semibold mr-1.5">[{ticket.alarmCode}]</span>}
                    {ticket.faultDescription}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <div className="text-right text-[11px]">
                    <div className="text-slate-400">Downtime: <span className="font-mono text-slate-200 font-semibold">{ticket.totalDowntimeMinutes} min</span></div>
                    <div className="text-slate-400 truncate max-w-[120px]">{ticket.technicianAssigned}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    ticket.status === 'Repair in Progress' 
                      ? 'bg-blue-950 text-blue-400 border border-blue-800/60 animate-pulse' 
                      : ticket.status === 'Waiting for Parts' 
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/60' 
                      : 'bg-purple-950 text-purple-400 border border-purple-800/60'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}

            {allTickets.filter(t => t.status !== 'Closed').length === 0 && (
              <div className="p-8 text-center bg-slate-950/30 rounded-xl border border-slate-800/50">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-200">No Open Breakdowns in Queue</p>
                <p className="text-[11px] text-slate-400 mt-1">All CNC lines are operating without active disruption.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
