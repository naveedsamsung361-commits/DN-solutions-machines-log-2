import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Bell, 
  BellRing, 
  BellOff, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  Settings, 
  Volume2, 
  VolumeX, 
  Check, 
  RotateCcw,
  Sparkles,
  Info,
  Wrench,
  Package,
  Layers
} from 'lucide-react';
import { 
  SystemNotification, 
  NotificationSeverity, 
  NotificationType,
  BreakdownTicket, 
  Machine, 
  PreventiveMaintenanceTask, 
  SparePart, 
  ShiftHandover 
} from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: BreakdownTicket[];
  machines: Machine[];
  pmTasks: PreventiveMaintenanceTask[];
  spareParts: SparePart[];
  handovers: ShiftHandover[];
  onSelectTicket: (ticket: BreakdownTicket) => void;
  onSelectMachine: (machine: Machine) => void;
  onNavigateTab?: (tab: string) => void;
}

type FilterCategory = 'all' | 'critical' | 'warranty' | 'pm_inventory';

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  tickets,
  machines,
  pmTasks,
  spareParts,
  handovers,
  onSelectTicket,
  onSelectMachine,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<FilterCategory>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState(notificationService.getSettings());
  const [refreshCount, setRefreshCount] = useState(0);

  // Sync browser permission and settings
  useEffect(() => {
    if (notificationService.isBrowserNotificationSupported()) {
      setBrowserPermission(notificationService.getBrowserPermission());
    }

    const unsubscribe = notificationService.subscribeToChanges(() => {
      setSettings(notificationService.getSettings());
      if (notificationService.isBrowserNotificationSupported()) {
        setBrowserPermission(notificationService.getBrowserPermission());
      }
      setRefreshCount(prev => prev + 1);
    });

    return () => unsubscribe();
  }, []);

  // Compute all notifications from current data
  const allNotifications = useMemo(() => {
    return notificationService.evaluateSystemAlerts(
      tickets,
      machines,
      pmTasks,
      spareParts,
      handovers
    );
  }, [tickets, machines, pmTasks, spareParts, handovers, refreshCount]);

  // Counts
  const criticalCount = allNotifications.filter(n => n.type === 'critical_breakdown').length;
  const warrantyCount = allNotifications.filter(n => n.type === 'warranty_expiring').length;
  const pmAndInvCount = allNotifications.filter(n => n.type === 'pm_overdue' || n.type === 'low_inventory' || n.type === 'unacknowledged_handover').length;
  const unacknowledgedCount = allNotifications.filter(n => !n.acknowledged).length;

  // Filtered list
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'critical':
        return allNotifications.filter(n => n.type === 'critical_breakdown');
      case 'warranty':
        return allNotifications.filter(n => n.type === 'warranty_expiring');
      case 'pm_inventory':
        return allNotifications.filter(n => n.type === 'pm_overdue' || n.type === 'low_inventory' || n.type === 'unacknowledged_handover');
      case 'all':
      default:
        return allNotifications;
    }
  }, [allNotifications, activeTab]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await notificationService.requestBrowserPermission();
    setBrowserPermission(perm);
  };

  const handleTestAlert = () => {
    notificationService.triggerTestAlert();
  };

  const handleToggleSound = () => {
    notificationService.saveSettings({ soundAlertsEnabled: !settings.soundAlertsEnabled });
  };

  const handleToggleBrowserNotifs = () => {
    notificationService.saveSettings({ browserNotificationsEnabled: !settings.browserNotificationsEnabled });
  };

  const handleAcknowledge = (id: string) => {
    notificationService.acknowledgeAlert(id);
  };

  const handleClearAcknowledged = () => {
    notificationService.clearAllAcknowledged();
  };

  const handleActionClick = (notif: SystemNotification) => {
    if (notif.linkedRecordType === 'ticket') {
      const target = tickets.find(t => t.id === notif.linkedRecordId || t.ticketNumber === notif.linkedRecordId);
      if (target) {
        onClose();
        onSelectTicket(target);
      }
    } else if (notif.linkedRecordType === 'machine') {
      const target = machines.find(m => m.id === notif.linkedRecordId || m.machineId === notif.linkedRecordId);
      if (target) {
        onClose();
        onSelectMachine(target);
      }
    } else if (notif.linkedRecordType === 'pm') {
      onClose();
      onNavigateTab?.('pm');
    } else if (notif.linkedRecordType === 'part') {
      onClose();
      onNavigateTab?.('inventory');
    } else if (notif.linkedRecordType === 'handover') {
      onClose();
      onNavigateTab?.('handover');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  System Alerts & Notification Center
                </h2>
                {unacknowledgedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-600 text-white animate-pulse">
                    {unacknowledgedCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Live monitoring for critical breakdown tickets & warranty expirations (&lt; 30 days)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                settings.soundAlertsEnabled
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                  : 'bg-red-950/40 border-red-800/60 text-red-400'
              }`}
              title={settings.soundAlertsEnabled ? 'Audio Alerts On (Click to Mute)' : 'Audio Alerts Muted (Click to Unmute)'}
            >
              {settings.soundAlertsEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Test Alert Button */}
            <button
              onClick={handleTestAlert}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Test browser notification and industrial alert sound"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Test Alert</span>
            </button>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg border transition-colors ${
                showSettings 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Notification Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Browser Permission Banner */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Browser Desktop Notifications:</span>
            {browserPermission === 'granted' ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Active (Granted)
              </span>
            ) : browserPermission === 'denied' ? (
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <BellOff className="w-3.5 h-3.5" />
                Blocked by browser settings
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Permission required for background alerts
              </span>
            )}
          </div>

          {browserPermission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1 rounded bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow transition-all"
            >
              Enable Desktop Alerts
            </button>
          )}
        </div>

        {/* Collapsible Settings Panel */}
        {showSettings && (
          <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                Notification Thresholds & Alert Channels
              </span>
              <button
                onClick={handleClearAcknowledged}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Acknowledged Alerts
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <span>Sound Chime / Industrial Siren</span>
                <input
                  type="checkbox"
                  checked={settings.soundAlertsEnabled}
                  onChange={(e) => notificationService.saveSettings({ soundAlertsEnabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <span>Native Browser System Push</span>
                <input
                  type="checkbox"
                  checked={settings.browserNotificationsEnabled}
                  onChange={(e) => notificationService.saveSettings({ browserNotificationsEnabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <span>Critical Breakdown Tickets</span>
                <input
                  type="checkbox"
                  checked={settings.criticalBreakdownAlerts}
                  onChange={(e) => notificationService.saveSettings({ criticalBreakdownAlerts: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <span>Warranty Expiration (&lt; 30 Days)</span>
                <input
                  type="checkbox"
                  checked={settings.warrantyExpirationAlerts}
                  onChange={(e) => notificationService.saveSettings({ warrantyExpirationAlerts: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                />
              </label>
            </div>
          </div>
        )}

        {/* Filter Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-800/90 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>All Alerts</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-950/60">
              {allNotifications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'critical'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-400/90 hover:text-red-300 hover:bg-red-950/30'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Critical Breakdowns</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-950/60">
              {criticalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('warranty')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'warranty'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/30'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Warranty Expirations</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-950/60">
              {warrantyCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pm_inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'pm_inventory'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PM & Spare Parts</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-950/60">
              {pmAndInvCount}
            </span>
          </button>
        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-90" />
              <h3 className="text-sm font-bold text-white">No active alerts in this category</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                All breakdown tickets, warranty coverage periods, and maintenance schedules are currently nominal.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isCrit = notif.severity === 'critical';
              const isWarn = notif.severity === 'warning';

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    notif.acknowledged 
                      ? 'bg-slate-950/50 border-slate-800/80 opacity-70' 
                      : isCrit
                        ? 'bg-slate-950/90 border-red-500/70 shadow-lg shadow-red-950/20'
                        : isWarn
                          ? 'bg-slate-950/90 border-amber-500/70 shadow-lg shadow-amber-950/20'
                          : 'bg-slate-950/90 border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isCrit 
                          ? 'bg-red-500/20 text-red-400' 
                          : isWarn
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {notif.type === 'critical_breakdown' ? (
                          <ShieldAlert className="w-5 h-5" />
                        ) : notif.type === 'warranty_expiring' ? (
                          <Calendar className="w-5 h-5" />
                        ) : notif.type === 'pm_overdue' ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isCrit 
                              ? 'bg-red-950 text-red-400 border border-red-800' 
                              : isWarn
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}>
                            {notif.type.replace('_', ' ')}
                          </span>

                          {notif.meta?.daysRemaining !== undefined && (
                            <span className="text-[11px] font-mono font-bold text-amber-300">
                              {notif.meta.daysRemaining < 0 
                                ? `Expired ${Math.abs(notif.meta.daysRemaining)}d ago`
                                : `Expires in ${notif.meta.daysRemaining} days`}
                            </span>
                          )}

                          {notif.acknowledged && (
                            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Acknowledged
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white mt-1">
                          {notif.title}
                        </h4>

                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Suggested action block */}
                        {notif.suggestedAction && (
                          <div className="mt-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800/90 text-[11px] text-slate-300 flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-slate-200">Recommended Next Action:</strong> {notif.suggestedAction}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      Logged: {new Date(notif.timestamp).toLocaleString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {!notif.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(notif.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Acknowledge</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleActionClick(notif)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow transition-all ${
                          isCrit 
                            ? 'bg-red-600 hover:bg-red-500 shadow-red-900/30' 
                            : isWarn
                              ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
                              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                        }`}
                      >
                        <span>{notif.actionLabel || 'View Record'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            {unacknowledgedCount} unacknowledged alert(s) across {allNotifications.length} active system triggers
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close Center
          </button>
        </div>
      </div>
    </div>
  );
};
