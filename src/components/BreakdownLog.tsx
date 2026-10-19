import React, { useState } from 'react';
import { 
  Wrench, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Cpu, 
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { BreakdownTicket, FaultCategory, SeverityLevel, TicketStatus, User } from '../types';
import { exportTicketsToFile } from '../services/exportImport';

interface BreakdownLogProps {
  tickets: BreakdownTicket[];
  onSelectTicket: (ticket: BreakdownTicket) => void;
  onOpenNewTicket: () => void;
  currentUser: User;
}

export const BreakdownLog: React.FC<BreakdownLogProps> = ({
  tickets,
  onSelectTicket,
  onOpenNewTicket,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'downtime_desc' | 'severity'>('date_desc');

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        ticket.ticketNumber.toLowerCase().includes(q) ||
        ticket.machineId.toLowerCase().includes(q) ||
        ticket.machineName.toLowerCase().includes(q) ||
        ticket.customerName.toLowerCase().includes(q) ||
        ticket.alarmCode.toLowerCase().includes(q) ||
        ticket.faultDescription.toLowerCase().includes(q) ||
        ticket.technicianAssigned.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'open' && (ticket.status === 'Closed' || ticket.status === 'Resolved')) return false;
      if (statusFilter === 'closed' && ticket.status !== 'Closed') return false;
      if (statusFilter !== 'open' && statusFilter !== 'closed' && ticket.status !== statusFilter) return false;
    }

    // Severity filter
    if (severityFilter !== 'all' && ticket.severityLevel !== severityFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && ticket.faultCategory !== categoryFilter) {
      return false;
    }

    return true;
  });

  // Sort tickets
  filteredTickets.sort((a, b) => {
    if (sortBy === 'date_desc') {
      return new Date(b.breakdownStart || b.createdAt).getTime() - new Date(a.breakdownStart || a.createdAt).getTime();
    }
    if (sortBy === 'date_asc') {
      return new Date(a.breakdownStart || a.createdAt).getTime() - new Date(b.breakdownStart || b.createdAt).getTime();
    }
    if (sortBy === 'downtime_desc') {
      return (b.totalDowntimeMinutes || 0) - (a.totalDowntimeMinutes || 0);
    }
    if (sortBy === 'severity') {
      const rank = { critical: 4, high: 3, medium: 2, low: 1 };
      return (rank[b.severityLevel] || 0) - (rank[a.severityLevel] || 0);
    }
    return 0;
  });

  const totalDowntimeAll = filteredTickets.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0);
  const activeCritical = filteredTickets.filter(t => t.severityLevel === 'critical' && t.status !== 'Closed').length;

  const handleExport = (format: 'xlsx' | 'csv') => {
    exportTicketsToFile(filteredTickets, format);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              MACHINE FIX LOG & BREAKDOWN REGISTRY
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-950 text-red-400 border border-red-800/60 uppercase">
              Core Module
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official shop-floor breakdown register, telemetry alarm logging, fault diagnosis, and repair verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('xlsx')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Export filtered records to Microsoft Excel .XLSX"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Export filtered records to CSV"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={onOpenNewTicket}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-lg text-xs font-bold shadow-md shadow-red-900/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Breakdown</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Filtered Tickets</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white">{filteredTickets.length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Cumulative Downtime</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            {parseFloat((totalDowntimeAll / 60).toFixed(1))} <span className="text-xs font-normal text-slate-400">hrs</span>
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Critical Outages</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{activeCritical}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Avg Incident Downtime</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400">
            {filteredTickets.length > 0 ? Math.round(totalDowntimeAll / filteredTickets.length) : 0} <span className="text-xs font-normal text-slate-400">min</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by ticket #, machine, alarm code, tech, customer..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open / Pending Only</option>
              <option value="closed">Closed Only</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="Diagnosis in Progress">Diagnosis in Progress</option>
              <option value="Waiting for Parts">Waiting for Parts</option>
              <option value="Repair in Progress">Repair in Progress</option>
              <option value="Testing">Testing</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All Fault Categories</option>
              <option value="Spindle failure">Spindle failure</option>
              <option value="Hydraulic failure">Hydraulic failure</option>
              <option value="Tool changer failure">Tool changer failure</option>
              <option value="CNC controller alarm">CNC controller alarm</option>
              <option value="Mechanical failure">Mechanical failure</option>
              <option value="Electrical failure">Electrical failure</option>
              <option value="Servo motor failure">Servo motor failure</option>
              <option value="Sensor failure">Sensor failure</option>
              <option value="Coolant system failure">Coolant system failure</option>
              <option value="Lubrication failure">Lubrication failure</option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-white">{filteredTickets.length}</strong> incidents</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
            >
              <option value="date_desc">Newest Breakdown First</option>
              <option value="date_asc">Oldest Breakdown First</option>
              <option value="downtime_desc">Highest Downtime First</option>
              <option value="severity">Highest Severity First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Breakdown Tickets List */}
      <div className="space-y-3">
        {filteredTickets.map(ticket => {
          const isCritical = ticket.severityLevel === 'critical';
          const isClosed = ticket.status === 'Closed';

          return (
            <div
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className={`p-4 rounded-2xl bg-slate-900 border transition-all cursor-pointer hover:bg-slate-850 shadow-sm ${
                isCritical && !isClosed 
                  ? 'border-red-600/70 shadow-lg shadow-red-950/20' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left Side: Ticket Number, Machine Info, Alarm Badge */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-industrial font-bold text-sm text-blue-400">
                      {ticket.ticketNumber}
                    </span>
                    <span className="text-xs font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {ticket.machineId}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {ticket.machineName} ({ticket.machineModel})
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                      ticket.severityLevel === 'critical'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : ticket.severityLevel === 'high'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}>
                      {ticket.severityLevel}
                    </span>
                    {ticket.isWarrantyClaim && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">
                        Warranty
                      </span>
                    )}
                  </div>

                  {/* Alarm Code & Fault Description */}
                  <div className="text-xs text-slate-300">
                    {ticket.alarmCode && (
                      <span className="font-mono text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded mr-2 border border-amber-800/60">
                        {ticket.alarmCode}
                      </span>
                    )}
                    <span className="font-medium text-white">{ticket.faultCategory}: </span>
                    <span className="text-slate-300">{ticket.faultDescription}</span>
                  </div>

                  {/* Operational Context Tags */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span>Customer: <strong className="text-slate-300">{ticket.customerName}</strong></span>
                    <span>•</span>
                    <span>Shift: {ticket.shift}</span>
                    <span>•</span>
                    <span>Tech: <strong className="text-blue-300">{ticket.technicianAssigned}</strong></span>
                    {ticket.photographs && ticket.photographs.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-blue-400">{ticket.photographs.length} Photo(s)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side: Downtime Duration, Status Badge, Quick Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Downtime</span>
                    <span className="text-base sm:text-lg font-bold font-mono text-rose-400">
                      {Math.floor(ticket.totalDowntimeMinutes / 60)}h {ticket.totalDowntimeMinutes % 60}m
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border ${
                      ticket.status === 'Closed'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : ticket.status === 'Repair in Progress'
                        ? 'bg-blue-950 text-blue-300 border-blue-800 animate-pulse'
                        : ticket.status === 'Waiting for Parts'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-purple-950 text-purple-300 border-purple-800'
                    }`}>
                      {ticket.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Inspect Ticket"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTickets.length === 0 && (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Wrench className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Breakdown Records Match Filter</h3>
            <p className="text-xs text-slate-400 mt-1">Try resetting the search terms or filters above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
