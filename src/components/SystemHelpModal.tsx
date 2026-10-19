import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Smartphone, 
  Terminal, 
  Database, 
  Server, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  FolderTree
} from 'lucide-react';

interface SystemHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemHelpModal: React.FC<SystemHelpModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const termuxSetupCode = `# 1. Update Termux packages
pkg update && pkg upgrade -y

# 2. Install Node.js, Git, and build tools
pkg install nodejs-lts git python make clang -y

# 3. Clone repository
git clone https://github.com/your-org/dn-solutions-hub.git
cd dn-solutions-hub

# 4. Install dependencies
npm install

# 5. Launch mobile web app server
npm run dev -- --host 0.0.0.0 --port 3000

# 6. Open in Chrome on Android: http://localhost:3000`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading-industrial font-bold text-base sm:text-lg text-white uppercase tracking-wider">
                System Guide & Android Termux Setup
              </h2>
              <p className="text-xs text-slate-400">
                Installation manual, folder hierarchy, database schema & troubleshooting guide
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-300">
          {/* Section 1: Android & Termux Beginner Instructions */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                1. Android Phone & Termux Quick Start Guide
              </span>
              <button
                onClick={() => copyCode(termuxSetupCode, 'termux')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded text-[11px] font-semibold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedKey === 'termux' ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>
            <p className="text-slate-400 leading-relaxed">
              You can run this complete industrial hub directly on an Android smartphone or tablet using Termux without any laptop required.
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
              {termuxSetupCode}
            </pre>
          </div>

          {/* Section 2: Architecture & Folder Hierarchy */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-blue-400" />
              2. Clean Modular Project Architecture
            </span>
            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`dn-solutions-hub/
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Top bar, role selector, global search
│   │   ├── Sidebar.tsx             # Desktop sidebar with live counters
│   │   ├── MobileNav.tsx           # Android touch bottom bar & drawer
│   │   ├── Dashboard.tsx           # KPIs, Pareto charts, fleet status
│   │   ├── BreakdownLog.tsx        # Machine fix log, filters, CSV/XLSX export
│   │   ├── BreakdownFormModal.tsx  # In-depth breakdown ticket form (Tabs A-G)
│   │   ├── TicketDetailModal.tsx   # Printable ticket inspection & timeline
│   │   ├── MachineRegistry.tsx     # CNC fleet list & controller filters
│   │   ├── MachineProfileModal.tsx # Machine profile, breakdown history, PM
│   │   ├── WarrantyManagement.tsx  # Warranty terms, expiry countdown, claims
│   │   ├── CustomerManagement.tsx  # Customer-scoped view & site isolation
│   │   ├── PreventiveMaintenance.tsx# PM calendar, checklists & completion
│   │   ├── ShiftHandoverLog.tsx    # Shift handover logs & acknowledgement
│   │   ├── SparePartsInventory.tsx # Parts catalog, min alerts, issues/returns
│   │   ├── TechnicalLibrary.tsx    # Alarm code manuals, schematics & SOPs
│   │   ├── MachineBackups.tsx      # SRAM & parameter backups with checksums
│   │   ├── ReportsAnalytics.tsx    # MTTR, MTBF, availability & PDF print
│   │   ├── ImportExportModal.tsx   # Excel/CSV mapping wizard & duplicate detect
│   │   └── AuditLogModal.tsx       # Security & operation audit log
│   ├── services/
│   │   ├── storage.ts              # LocalStorage persistent DB & calculation engine
│   │   ├── sampleData.ts           # Realistic DN Solutions CNC demonstration data
│   │   └── exportImport.ts         # SheetJS XLSX/CSV parser & template generator
│   └── types/
│       └── index.ts                # TypeScript domain models and enums`}
            </pre>
          </div>

          {/* Section 3: Database Entities & Formulas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Database className="w-4 h-4 text-purple-400" />
                3. Relational Schema & Entities
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li><strong className="text-slate-200">Users:</strong> 5 roles (Admin, Manager, Tech, Operator, Viewer)</li>
                <li><strong className="text-slate-200">Machines:</strong> CNC controller model, S/N, specs, warranty</li>
                <li><strong className="text-slate-200">BreakdownTickets:</strong> Downtime audit, symptoms, root cause</li>
                <li><strong className="text-slate-200">SpareParts:</strong> Inventory counts, min thresholds, bin tags</li>
                <li><strong className="text-slate-200">Transactions:</strong> Stock issue, return, restock history</li>
                <li><strong className="text-slate-200">ShiftHandovers:</strong> Running status, alarms, acknowledgements</li>
                <li><strong className="text-slate-200">AuditLogs:</strong> Immutable timestamped activity trail</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-400" />
                4. Verified Industrial Formulas
              </span>
              <div className="space-y-2 text-[11px] text-slate-400">
                <p>
                  <strong className="text-white block">MTTR (Mean Time to Repair):</strong>
                  Total Active Repair Time / Number of Completed Repairs.
                </p>
                <p>
                  <strong className="text-white block">MTBF (Mean Time Between Failures):</strong>
                  (Planned Operating Time − Outage Hours) / Number of Qualifying Failures.
                </p>
                <p>
                  <strong className="text-white block">Machine Availability %:</strong>
                  (Planned Operating Time − Outage Hours) / Planned Operating Time * 100.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Troubleshooting Guide */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              5. Troubleshooting & FAQ
            </span>
            <div className="space-y-2 text-[11px] text-slate-400">
              <div>
                <strong className="text-slate-200">Q: Does the app preserve data when refreshed?</strong>
                <p>Yes, all changes persist automatically in browser storage. You can also export a full JSON backup from the Excel/CSV menu at any time.</p>
              </div>
              <div>
                <strong className="text-slate-200">Q: How do I test different permissions?</strong>
                <p>Use the user switcher in the top right header to switch between Administrator, Maintenance Manager, Lead Technician, and Operator.</p>
              </div>
              <div>
                <strong className="text-slate-200">Q: How do I reset demo data?</strong>
                <p>Click the user switcher in the header and tap "Reset Demo Data" to restore the clean initial DN Solutions dataset.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
