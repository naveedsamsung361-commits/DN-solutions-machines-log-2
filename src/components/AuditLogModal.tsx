import React from 'react';
import { X, History, Shield, ShieldCheck, Filter } from 'lucide-react';
import { storageService } from '../services/storage';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const logs = storageService.getAuditLogs();

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'UPDATE': return 'bg-blue-950 text-blue-400 border-blue-800';
      case 'DELETE': return 'bg-rose-950 text-rose-400 border-rose-800';
      case 'APPROVAL': return 'bg-purple-950 text-purple-400 border-purple-800';
      case 'CHECKLIST_SIGN': return 'bg-teal-950 text-teal-400 border-teal-800';
      case 'IMPORT': return 'bg-amber-950 text-amber-400 border-amber-800';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading-industrial font-bold text-base sm:text-lg text-white uppercase tracking-wider">
                System Security & Operational Audit Log
              </h2>
              <p className="text-xs text-slate-400">
                Immutable record of who created, edited, approved, closed, or exported records
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Target ID</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-850/50">
                    <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <strong className="text-white block">{log.userName}</strong>
                      <span className="text-[10px] text-slate-400 uppercase">{log.userRole}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 whitespace-nowrap font-mono">{log.module}</td>
                    <td className="p-3 text-blue-400 font-mono font-semibold whitespace-nowrap">{log.recordId}</td>
                    <td className="p-3 text-slate-300 max-w-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
