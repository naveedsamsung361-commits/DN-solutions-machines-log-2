import React, { useState } from 'react';
import { 
  Wrench, 
  Search, 
  PlusCircle, 
  Shield, 
  History, 
  HelpCircle, 
  Bell, 
  UserCheck, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  QrCode,
  ScanLine,
  Smartphone,
  Calendar,
  ShieldAlert,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storage';

interface HeaderProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onOpenNewTicket: () => void;
  onOpenQRScanner: () => void;
  onOpenAndroidInstall?: () => void;
  onOpenAuditLogs: () => void;
  onOpenHelp: () => void;
  onOpenImportExport: () => void;
  onOpenNotificationCenter?: () => void;
  onOpenAIAssistant?: () => void;
  onGlobalSearch: (query: string) => void;
  searchQuery: string;
  onResetDemoData: () => void;
  activeCriticalCount: number;
  lowStockCount: number;
  warrantyExpiringCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  onOpenNewTicket,
  onOpenQRScanner,
  onOpenAndroidInstall,
  onOpenAuditLogs,
  onOpenHelp,
  onOpenImportExport,
  onOpenNotificationCenter,
  onOpenAIAssistant,
  onGlobalSearch,
  searchQuery,
  onResetDemoData,
  activeCriticalCount,
  lowStockCount,
  warrantyExpiringCount = 0
}) => {
  const users = storageService.getUsers();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-900/60 text-purple-300 border-purple-700/50';
      case 'manager': return 'bg-blue-900/60 text-blue-300 border-blue-700/50';
      case 'technician': return 'bg-amber-900/60 text-amber-300 border-amber-700/50';
      case 'operator': return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';
      case 'viewer': return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/20 text-white font-bold">
            <span className="font-heading-industrial text-lg tracking-wider">DN</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading-industrial font-bold text-sm sm:text-base tracking-wide text-white uppercase">
                DN Solutions
              </span>
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60 uppercase tracking-widest hidden sm:inline-block">
                Operations Hub
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[210px] sm:max-w-md hidden md:block">
              Machine Fix Log, Breakdown Management & Maintenance Tracking
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-2 hidden sm:block relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onGlobalSearch(e.target.value)}
              placeholder="Search Machine ID, Ticket #, Alarm Code, Customer, Tech..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => onGlobalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Android App Download & Install Button */}
          {onOpenAndroidInstall && (
            <button
              onClick={onOpenAndroidInstall}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-400 border border-emerald-800/80 rounded-lg text-xs font-semibold shadow transition-all transform active:scale-95"
              title="Download & Install Hub on Android device (PWA)"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Android App</span>
            </button>
          )}

          {/* AI Maintenance Assistant Button */}
          {onOpenAIAssistant && (
            <button
              onClick={onOpenAIAssistant}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-indigo-600/30 to-blue-600/30 hover:from-indigo-600/50 hover:to-blue-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
              title="Open AI Maintenance Assistant"
            >
              <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
              <span className="hidden lg:inline">AI Assistant</span>
            </button>
          )}

          {/* Quick QR Scanner Button */}
          <button
            onClick={onOpenQRScanner}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/60 text-slate-200 hover:text-white rounded-lg text-xs font-semibold shadow transition-all"
            title="Scan machine identification plate QR code using camera"
          >
            <ScanLine className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>

          {/* Prominent Report Breakdown Button */}
          <button
            onClick={onOpenNewTicket}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-medium rounded-lg shadow-md shadow-red-900/30 text-xs sm:text-sm transition-all transform active:scale-95"
            title="Create new breakdown ticket"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span className="font-semibold whitespace-nowrap">Report Breakdown</span>
          </button>

          {/* Import / Export */}
          <button
            onClick={onOpenImportExport}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
            title="Import Excel/CSV records or export reports"
          >
            <span>Excel/CSV</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                if (onOpenNotificationCenter) {
                  onOpenNotificationCenter();
                } else {
                  setShowNotifications(!showNotifications);
                }
              }}
              className={`relative p-2 rounded-lg border transition-all ${
                activeCriticalCount > 0 
                  ? 'bg-red-950/70 border-red-500/80 text-red-300 ring-1 ring-red-500/40 animate-pulse'
                  : (warrantyExpiringCount > 0 || lowStockCount > 0)
                    ? 'bg-amber-950/70 border-amber-500/80 text-amber-300 ring-1 ring-amber-500/40'
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/70 text-slate-300'
              }`}
              title="System Alerts & Notification Center"
            >
              <Bell className="w-4 h-4" />
              {(activeCriticalCount > 0 || warrantyExpiringCount > 0 || lowStockCount > 0) && (
                <span className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-slate-900 ${
                  activeCriticalCount > 0 ? 'bg-red-600 animate-bounce' : 'bg-amber-600'
                }`}>
                  {activeCriticalCount + warrantyExpiringCount + lowStockCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">System Notifications</span>
                  <span className="text-[10px] text-slate-400">Live Status</span>
                </div>
                <div className="py-2 space-y-2 text-xs">
                  {activeCriticalCount > 0 && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{activeCriticalCount} Critical Breakdown(s) Active</p>
                        <p className="text-[11px] text-red-400/80">Immediate technician attention required on line.</p>
                      </div>
                    </div>
                  )}

                  {warrantyExpiringCount > 0 && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-950/50 border border-amber-800/60 text-amber-300">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{warrantyExpiringCount} Machine Warranty Expiring &lt; 30d</p>
                        <p className="text-[11px] text-amber-400/80">Submit OEM warranty claims before coverage lapses.</p>
                      </div>
                    </div>
                  )}

                  {lowStockCount > 0 && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300">
                      <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{lowStockCount} Spare Part(s) Low/Out of Stock</p>
                        <p className="text-[11px] text-slate-400">Reorder threshold reached.</p>
                      </div>
                    </div>
                  )}

                  {activeCriticalCount === 0 && warrantyExpiringCount === 0 && lowStockCount === 0 && (
                    <div className="flex items-center gap-2 p-3 text-slate-400 text-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>All systems nominal</span>
                    </div>
                  )}

                  {onOpenNotificationCenter && (
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        onOpenNotificationCenter();
                      }}
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Open Full Notification Center</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Audit Log */}
          <button
            onClick={onOpenAuditLogs}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-slate-300 transition-colors hidden sm:block"
            title="View Security & Operation Audit Logs"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Help / Setup Guide */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-slate-300 transition-colors"
            title="Setup Guide & System Docs"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors"
              title="Switch user role for shop-floor testing"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600/30 flex items-center justify-center border border-blue-500/40 text-blue-300 font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden lg:block">
                <div className="text-xs font-medium text-slate-200 leading-tight">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {currentUser.role}
                </div>
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-slate-200">Switch User & Role</p>
                  <p className="text-[10px] text-slate-400">Tests permission enforcement across views</p>
                </div>
                <div className="py-1 space-y-1">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                        u.id === currentUser.id 
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40' 
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.department}</div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${getRoleBadgeColor(u.role)}`}>
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      if (confirm('Reset operations database to clean initial demonstration dataset?')) {
                        onResetDemoData();
                        setShowUserDropdown(false);
                      }
                    }}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
