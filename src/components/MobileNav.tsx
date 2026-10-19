import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Cpu, 
  CalendarClock, 
  MoreHorizontal,
  ShieldCheck,
  Building2,
  ArrowLeftRight,
  PackageSearch,
  BookOpen,
  HardDriveDownload,
  BarChart3,
  X,
  Smartphone,
  BellRing,
  Sparkles
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  openTicketCount: number;
  overduePMCount: number;
  onOpenAndroidInstall?: () => void;
  onOpenNotificationCenter?: () => void;
  onOpenAIAssistant?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  openTicketCount,
  overduePMCount,
  onOpenAndroidInstall,
  onOpenNotificationCenter,
  onOpenAIAssistant
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs: { id: NavTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Fix Log', icon: Wrench, badge: openTicketCount },
    { id: 'machines', label: 'Machines', icon: Cpu },
    { id: 'pm', label: 'PM Due', icon: CalendarClock, badge: overduePMCount }
  ];

  const moreTabs: { id: NavTab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'warranty', label: 'Warranty & Claims', icon: ShieldCheck, desc: 'Coverage terms, remaining days & claims' },
    { id: 'customers', label: 'Customer Management', icon: Building2, desc: 'Factory sites and customer machines' },
    { id: 'handover', label: 'Shift Handover', icon: ArrowLeftRight, desc: 'Operator & tech shift transfer log' },
    { id: 'spares', label: 'Spare Parts Inventory', icon: PackageSearch, desc: 'Stock levels, min alerts & part issues' },
    { id: 'knowledge', label: 'Technical Library', icon: BookOpen, desc: 'Alarm guides, schematics & manuals' },
    { id: 'backups', label: 'CNC Backups & Restore', icon: HardDriveDownload, desc: 'SRAM, parameter and ladder backups' },
    { id: 'reports', label: 'Analytics & MTTR/MTBF', icon: BarChart3, desc: 'Failure Pareto, downtime & availability' }
  ];

  return (
    <>
      {/* Bottom Floating Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 border-t border-slate-800 px-2 py-1.5 md:hidden backdrop-blur-lg flex items-center justify-around safe-area-bottom">
        {mainTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 relative transition-colors ${
                isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* More Options Drawer Trigger */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
            moreTabs.some(t => t.id === activeTab) ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">More</span>
        </button>
      </nav>

      {/* More Menu Modal on Mobile */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end md:hidden">
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="font-heading-industrial font-bold text-sm text-white uppercase tracking-wide">
                Operations Modules
              </span>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {moreTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setShowMoreMenu(false);
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isActive 
                        ? 'bg-blue-600/20 border-blue-500/50 text-white' 
                        : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-blue-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{tab.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}

              {onOpenAIAssistant && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenAIAssistant();
                  }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-indigo-700/60 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 text-left transition-all mt-2 cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-indigo-900/70 border border-indigo-700 text-indigo-300 shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">AI Maintenance Assistant</div>
                    <div className="text-[11px] text-indigo-400/90 mt-0.5">Diagnose alarms, search tickets & analyze downtime</div>
                  </div>
                </button>
              )}

              {onOpenNotificationCenter && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenNotificationCenter();
                  }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-red-800/60 bg-red-950/40 text-red-300 hover:bg-red-900/60 text-left transition-all mt-2"
                >
                  <div className="p-2 rounded-lg bg-red-900/70 border border-red-700 text-red-300 shrink-0">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">System Alerts & Notification Center</div>
                    <div className="text-[11px] text-red-400/90 mt-0.5">Critical breakdown tickets & warranty expirations</div>
                  </div>
                </button>
              )}

              {onOpenAndroidInstall && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenAndroidInstall();
                  }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-emerald-800 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 text-left transition-all mt-2"
                >
                  <div className="p-2 rounded-lg bg-emerald-900/80 border border-emerald-700 text-emerald-300 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Download & Install on Android</div>
                    <div className="text-[11px] text-emerald-400/90 mt-0.5">Add Hub icon to Android home screen for offline shop-floor use</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
