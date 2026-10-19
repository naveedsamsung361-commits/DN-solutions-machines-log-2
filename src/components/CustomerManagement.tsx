import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Cpu, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Customer, Machine, BreakdownTicket, User } from '../types';
import { storageService } from '../services/storage';

interface CustomerManagementProps {
  onSelectMachine: (machine: Machine) => void;
  onSelectTicket: (ticket: BreakdownTicket) => void;
  currentUser: User;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  onSelectMachine,
  onSelectTicket,
  currentUser
}) => {
  const customers = storageService.getCustomers();
  const allMachines = storageService.getMachines();
  const allTickets = storageService.getTickets();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [siteSearch, setSiteSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Scoped records for selected customer
  const customerMachines = allMachines.filter(m => m.customerId === selectedCustomer?.id || m.customerName === selectedCustomer?.name);
  const customerTickets = allTickets.filter(t => t.customerId === selectedCustomer?.id || t.customerName === selectedCustomer?.name);
  
  const activeCustomerTickets = customerTickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved');
  const completedCustomerTickets = customerTickets.filter(t => t.status === 'Closed' || t.status === 'Resolved');
  const totalCustomerDowntimeMinutes = customerTickets.reduce((sum, t) => sum + (t.totalDowntimeMinutes || 0), 0);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              CUSTOMER-WISE OPERATIONS & SITE ASSETS
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-950 text-purple-400 border border-purple-800/60 uppercase">
              Client Scoped
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Factory locations, client fleet isolation, dedicated breakdown registers, and SLA compliance metrics.
          </p>
        </div>
      </div>

      {/* Customer Selector Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {customers.map(cust => {
          const isSelected = cust.id === selectedCustomerId;
          return (
            <button
              key={cust.id}
              onClick={() => setSelectedCustomerId(cust.id)}
              className={`p-4 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-950/30 ring-1 ring-blue-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-blue-400">{cust.code}</span>
                <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-950 text-slate-300 border border-slate-800">
                  {cust.registeredMachineCount} Units
                </span>
              </div>
              <h3 className="font-heading-industrial font-bold text-sm text-white truncate">
                {cust.name}
              </h3>
              <p className="text-[11px] text-slate-400 truncate mt-1">{cust.contactPerson}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                <span>Active Outages: <strong className="text-amber-400">{cust.activeTicketsCount}</strong></span>
                <span>Downtime: <strong className="text-rose-400">{cust.totalDowntimeHours}h</strong></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Customer In-depth Profile View */}
      {selectedCustomer && (
        <div className="space-y-6 animate-in fade-in">
          {/* Customer Profile Banner */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading-industrial font-bold text-lg text-white">
                    {selectedCustomer.name}
                  </h2>
                  <span className="font-mono text-xs text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                    ID: {selectedCustomer.code}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedCustomer.notes}</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Client Fleet</span>
                  <span className="text-base font-bold text-white">{customerMachines.length} CNCs</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Open Tickets</span>
                  <span className="text-base font-bold text-amber-400">{activeCustomerTickets.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total Outage</span>
                  <span className="text-base font-bold text-rose-400">{parseFloat((totalCustomerDowntimeMinutes / 60).toFixed(1))} hrs</span>
                </div>
              </div>
            </div>

            {/* Contact Details & Factory Sites */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Contact Lead</span>
                <p className="font-medium text-white">{selectedCustomer.contactPerson}</p>
                <div className="text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>{selectedCustomer.contactPhone}</span>
                </div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{selectedCustomer.contactEmail}</span>
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Factory Sites & Plants</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCustomer.factories.map((f, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200 block">{f.name}</strong>
                        <span className="text-slate-400 text-[11px]">{f.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Customer's Installed Machines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading-industrial font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Registered CNC Machines at {selectedCustomer.name}
              </h3>
              <span className="text-xs text-slate-400">{customerMachines.length} Units</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {customerMachines.map(m => (
                <div
                  key={m.id}
                  onClick={() => onSelectMachine(m)}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-blue-400 font-bold">{m.machineId}</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-semibold uppercase ${
                      m.operatingStatus === 'running' 
                        ? 'bg-emerald-950 text-emerald-400' 
                        : m.operatingStatus === 'breakdown' 
                        ? 'bg-red-950 text-red-400' 
                        : 'bg-amber-950 text-amber-400'
                    }`}>
                      {m.operatingStatus}
                    </span>
                  </div>

                  <div>
                    <strong className="text-white block text-sm">{m.machineName}</strong>
                    <span className="text-slate-400 text-[11px]">{m.model} • {m.controllerType}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Line: {m.productionLine}</span>
                    <span className="text-blue-400 hover:underline">View Profile &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer's Breakdown Tickets & History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading-industrial font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-red-400" />
                Customer Breakdown & Repair Log
              </h3>
              <span className="text-xs text-slate-400">{customerTickets.length} Incident Records</span>
            </div>

            <div className="space-y-2.5">
              {customerTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-400 font-bold">{ticket.ticketNumber}</span>
                      <span className="font-mono text-slate-400">{ticket.breakdownDate}</span>
                      <span className="text-white font-semibold">• {ticket.machineId} ({ticket.machineModel})</span>
                    </div>
                    <p className="text-slate-300">
                      {ticket.alarmCode && <span className="font-mono text-amber-300 font-semibold mr-1.5">[{ticket.alarmCode}]</span>}
                      {ticket.faultDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Downtime</span>
                      <span className="font-mono font-bold text-rose-400">{ticket.totalDowntimeMinutes} min</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-200">
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))}

              {customerTickets.length === 0 && (
                <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
                  No breakdown incidents recorded for {selectedCustomer.name}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
