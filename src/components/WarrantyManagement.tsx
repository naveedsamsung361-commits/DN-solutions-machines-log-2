import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  FileCheck, 
  Plus, 
  Calendar, 
  Clock, 
  Building2, 
  FileText, 
  CheckCircle2, 
  ChevronRight,
  ExternalLink,
  DollarSign,
  X
} from 'lucide-react';
import { WarrantyRecord, WarrantyClaim, BreakdownTicket, User } from '../types';
import { storageService } from '../services/storage';

interface WarrantyManagementProps {
  onSelectTicket: (ticket: BreakdownTicket) => void;
  currentUser: User;
}

export const WarrantyManagement: React.FC<WarrantyManagementProps> = ({
  onSelectTicket,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'records' | 'claims'>('records');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showClaimModal, setShowClaimModal] = useState(false);

  const warranties = storageService.getWarranties();
  const claims = storageService.getWarrantyClaims();
  const tickets = storageService.getTickets();

  // Filtered warranties
  const filteredWarranties = warranties.filter(w => {
    if (statusFilter === 'all') return true;
    return w.status === statusFilter;
  });

  // New claim form state
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [claimTicketNumber, setClaimTicketNumber] = useState('');
  const [claimDescription, setClaimDescription] = useState('');
  const [claimAmount, setClaimAmount] = useState<number>(0);

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId || !claimDescription) return;

    const machine = storageService.getMachineById(selectedMachineId);
    const newClaim: WarrantyClaim = {
      id: `CLM-${Date.now()}`,
      claimNumber: `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      machineId: selectedMachineId,
      machineName: machine ? machine.machineName : selectedMachineId,
      ticketNumber: claimTicketNumber,
      claimDate: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      description: claimDescription,
      supportingPhotos: [],
      supportingDocuments: ['OEM_Diagnostic_Log.pdf'],
      providerResponse: 'Claim submitted to OEM technical review desk.',
      claimAmount,
      updatedAt: new Date().toISOString()
    };

    storageService.saveWarrantyClaim(newClaim);
    setShowClaimModal(false);
    setSelectedMachineId('');
    setClaimDescription('');
    setClaimAmount(0);
  };

  const activeCount = warranties.filter(w => w.status === 'Active').length;
  const expiringCount = warranties.filter(w => w.status === 'Expiring Soon').length;
  const expiredCount = warranties.filter(w => w.status === 'Expired').length;

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              WARRANTY & SERVICE CONTRACT MANAGEMENT
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-blue-400 border border-blue-800/60 uppercase">
              SLA Tracking
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine coverage monitoring, automated expiration countdowns, and OEM factory warranty reimbursement claims.
          </p>
        </div>

        <button
          onClick={() => setShowClaimModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Warranty Claim</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Warranties</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{activeCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Expiring Soon (&lt;60d)</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{expiringCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Expired Warranties</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400">{expiredCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Filed Claims</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400">{claims.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'records'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Machine Warranty Records ({warranties.length})
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'claims'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Reimbursement Claims ({claims.length})
        </button>
      </div>

      {/* TAB 1: WARRANTY RECORDS */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter status:</span>
            {['all', 'Active', 'Expiring Soon', 'Expired'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWarranties.map(war => {
              // Find breakdowns for this machine during warranty
              const machineBreakdowns = tickets.filter(t => t.machineId === war.machineId);
              const warrantyBreakdowns = machineBreakdowns.filter(t => t.isWarrantyClaim);

              return (
                <div key={war.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-blue-400 font-bold text-sm block">{war.machineId}</span>
                      <h3 className="text-white font-semibold text-xs">{war.machineName}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      war.status === 'Active'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : war.status === 'Expiring Soon'
                        ? 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}>
                      {war.status} ({war.remainingDays} days remaining)
                    </span>
                  </div>

                  {war.remainingDays <= 30 && war.remainingDays >= 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-[11px] text-amber-300 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Automatic Alert Active: Warranty expires in {war.remainingDays} days (&le; 30d threshold)</span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Coverage Type:</span>
                      <strong className="text-slate-200">{war.coverageType}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Provider:</span>
                      <span>{war.provider}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Period:</span>
                      <span>{war.startDate} &rarr; {war.expiryDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Service Contract No:</span>
                      <span className="font-mono text-blue-400">{war.serviceContractNumber}</span>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1 text-slate-400">
                    <p><strong className="text-slate-300">Covered:</strong> {war.coveredComponents}</p>
                    <p><strong className="text-slate-300">Contact:</strong> {war.serviceProviderContact}</p>
                  </div>

                  {/* Breakdowns linked */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Breakdowns under warranty: <strong className="text-white">{machineBreakdowns.length}</strong> ({warrantyBreakdowns.length} claims)
                    </span>
                    {warrantyBreakdowns.length > 0 && (
                      <button
                        onClick={() => onSelectTicket(warrantyBreakdowns[0])}
                        className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <span>View Claim Ticket</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: REIMBURSEMENT CLAIMS */}
      {activeTab === 'claims' && (
        <div className="space-y-3">
          {claims.map(claim => (
            <div key={claim.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-400 font-bold">{claim.claimNumber}</span>
                  <span className="text-slate-200 font-semibold">• {claim.machineName} ({claim.machineId})</span>
                  {claim.ticketNumber && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-950 font-mono text-slate-400 border border-slate-800">
                      Ref: {claim.ticketNumber}
                    </span>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                  claim.status === 'Approved'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : claim.status === 'Submitted'
                    ? 'bg-blue-950 text-blue-400 border border-blue-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {claim.status}
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                {claim.description}
              </p>

              <div className="flex flex-wrap items-center justify-between text-slate-400 pt-1 text-[11px]">
                <span>Date: {claim.claimDate}</span>
                {claim.claimAmount && (
                  <span className="text-emerald-400 font-mono font-semibold">
                    Amount: ${claim.claimAmount} (Reimbursed: ${claim.reimbursedAmount || 0})
                  </span>
                )}
                <span className="text-slate-400 truncate max-w-sm">
                  Response: {claim.providerResponse || 'Pending OEM response'}
                </span>
              </div>
            </div>
          ))}

          {claims.length === 0 && (
            <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
              No warranty reimbursement claims registered yet.
            </div>
          )}
        </div>
      )}

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-heading-industrial font-bold text-white text-sm">
                Submit New OEM Warranty Claim
              </span>
              <button onClick={() => setShowClaimModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Machine</label>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="">-- Choose Machine --</option>
                  {warranties.map(w => (
                    <option key={w.machineId} value={w.machineId}>
                      {w.machineId} - {w.machineName} ({w.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Related Breakdown Ticket # (Optional)</label>
                <input
                  type="text"
                  value={claimTicketNumber}
                  onChange={(e) => setClaimTicketNumber(e.target.value)}
                  placeholder="e.g. TKT-2026-0101"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Claim Description & Failure Details</label>
                <textarea
                  rows={3}
                  value={claimDescription}
                  onChange={(e) => setClaimDescription(e.target.value)}
                  placeholder="Describe OEM component failure, root cause and justification for warranty reimbursement..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Estimated Claim Amount ($ USD)</label>
                <input
                  type="number"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
