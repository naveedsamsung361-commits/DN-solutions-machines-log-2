import React from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Cpu, 
  CalendarClock, 
  ShieldCheck, 
  Building2, 
  ArrowLeftRight, 
  PackageSearch, 
  BookOpen, 
  HardDriveDownload, 
  BarChart3,
  AlertOctagon,
  Clock,
  ExternalLink
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTab = 
  | 'dashboard' 
  | 'tickets' 
  | 'machines' 
  | 'pm' 
  | 'warranty' 
  | 'customers' 
  | 'handover' 
  | 'spares' 
  | 'knowledge' 
  | 'backups' 
  | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  openTicketCount: number;
  overduePMCount: number;
  warrantyExpiringCount: number;
  lowStockCount: number;
  userRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  openTicketCount,
  overduePMCount,
  warrantyExpiringCount,
  lowStockCount,
  userRole
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string; roleRestricted?: boolean }[] = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
    { 
      id: 'tickets', 
      label: 'Machine Fix Log', 
      icon: Wrench, 
      badge: openTicketCount, 
      badgeColor: 'bg-red-500 text-white' 
    },
    { id: 'machines', label: 'Machine Registry', icon: Cpu },
    { 
      id: 'pm', 
      label: 'Preventive Maintenance', 
      icon: CalendarClock,
      badge: overduePMCount,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    },
    { 
      id: 'warranty', 
      label: 'Warranty Management', 
      icon: ShieldCheck,
      badge: warrantyExpiringCount,
      badgeColor: 'bg-blue-500 text-white'
    },
    { id: 'customers', label: 'Customer Operations', icon: Building2 },
    { id: 'handover', label: 'Shift Handover Log', icon: ArrowLeftRight },
    { 
      id: 'spares', 
      label: 'Spare Parts Inventory', 
      icon: PackageSearch,
      badge: lowStockCount,
      badgeColor: 'bg-rose-600 text-white'
    },
    { id: 'knowledge', label: 'Technical Library', icon: BookOpen },
    { id: 'backups', label: 'CNC Backups & Restores', icon: HardDriveDownload },
    { id: 'reports', label: 'Analytics & MTTR/MTBF', icon: BarChart3 }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between hidden md:flex shrink-0 select-none">
      <div className="py-4">
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              Shop Floor System: Online
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Role Access: <span className="text-blue-400 font-semibold uppercase">{userRole}</span>
          </div>
        </div>

        <nav className="space-y-0.5 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-5 text-center ${item.badgeColor || 'bg-slate-700 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Industrial Hardware Badge */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="font-semibold text-slate-300">CNC Controller Link</span>
            <span className="text-emerald-400 font-mono">FOCAS / OPC UA</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Active monitoring across Fanuc, Siemens & Mitsubishi lines.
          </p>
        </div>
      </div>
    </aside>
  );
};
