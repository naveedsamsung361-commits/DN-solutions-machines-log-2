import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  X, 
  ExternalLink, 
  Check, 
  Volume2, 
  VolumeX,
  Bell
} from 'lucide-react';
import { SystemNotification } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationBannerProps {
  onOpenTicket: (ticketId: string) => void;
  onOpenMachine: (machineId: string) => void;
  onOpenNotificationCenter: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onOpenTicket,
  onOpenMachine,
  onOpenNotificationCenter
}) => {
  const [activeAlert, setActiveAlert] = useState<SystemNotification | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    // Listen for live triggered alerts
    const unsubscribe = notificationService.subscribeToAlerts((notif) => {
      setActiveAlert(notif);
    });

    return () => unsubscribe();
  }, []);

  if (!activeAlert || dismissedIds.includes(activeAlert.id)) {
    return null;
  }

  const handleDismiss = () => {
    setDismissedIds(prev => [...prev, activeAlert.id]);
    setActiveAlert(null);
  };

  const handleAcknowledge = () => {
    notificationService.acknowledgeAlert(activeAlert.id);
    handleDismiss();
  };

  const handleAction = () => {
    if (activeAlert.linkedRecordType === 'ticket') {
      onOpenTicket(activeAlert.linkedRecordId);
    } else if (activeAlert.linkedRecordType === 'machine') {
      onOpenMachine(activeAlert.linkedRecordId);
    } else {
      onOpenNotificationCenter();
    }
    handleDismiss();
  };

  const isCritical = activeAlert.severity === 'critical';

  return (
    <aside 
      aria-label="System notification"
      className="fixed bottom-16 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-200"
    >
      <div className={`p-3.5 rounded-xl border shadow-2xl backdrop-blur-md ${
        isCritical 
          ? 'bg-slate-900/95 border-red-500/80 shadow-red-950/60 ring-1 ring-red-500/30' 
          : 'bg-slate-900/95 border-amber-500/80 shadow-amber-950/60 ring-1 ring-amber-500/30'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
            isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {isCritical ? (
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
                isCritical ? 'text-red-400' : 'text-amber-400'
              }`}>
                {isCritical ? 'CRITICAL SYSTEM ALERT' : 'WARRANTY NOTIFICATION'}
              </span>
              <button 
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                title="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-1">
              {activeAlert.title}
            </h4>

            <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {activeAlert.message}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
              <button
                onClick={handleAction}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow transition-all ${
                  isCritical 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                <span>{activeAlert.actionLabel || 'View Details'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <button
                onClick={handleAcknowledge}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Acknowledge</span>
              </button>

              <button
                onClick={onOpenNotificationCenter}
                className="ml-auto text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                title="Open Notification Center"
              >
                <Bell className="w-3 h-3" />
                <span className="hidden sm:inline">Center</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
