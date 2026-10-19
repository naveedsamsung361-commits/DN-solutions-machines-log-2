import React, { useState, useEffect } from 'react';
import { 
  User, 
  Machine, 
  BreakdownTicket, 
  Customer 
} from './types';
import { storageService } from './services/storage';

// Navigation & Layout Components
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';

// View Modules
import { Dashboard } from './components/Dashboard';
import { BreakdownLog } from './components/BreakdownLog';
import { BreakdownFormModal } from './components/BreakdownFormModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { MachineRegistry } from './components/MachineRegistry';
import { MachineFormModal } from './components/MachineFormModal';
import { MachineProfileModal } from './components/MachineProfileModal';
import { WarrantyManagement } from './components/WarrantyManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { PreventiveMaintenance } from './components/PreventiveMaintenance';
import { ShiftHandoverLog } from './components/ShiftHandoverLog';
import { SparePartsInventory } from './components/SparePartsInventory';
import { TechnicalLibrary } from './components/TechnicalLibrary';
import { MachineBackups } from './components/MachineBackups';
import { ReportsAnalytics } from './components/ReportsAnalytics';
import { ImportExportModal } from './components/ImportExportModal';
import { AuditLogModal } from './components/AuditLogModal';
import { SystemHelpModal } from './components/SystemHelpModal';
import { QRCodeScannerModal } from './components/QRCodeScannerModal';
import { MachineQRPlateModal } from './components/MachineQRPlateModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { NotificationBanner } from './components/NotificationBanner';
import { notificationService } from './services/notificationService';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(storageService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  // Global search query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<BreakdownTicket | null>(null);
  const [preselectedMachineId, setPreselectedMachineId] = useState<string | undefined>(undefined);

  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<BreakdownTicket | null>(null);

  const [isMachineFormOpen, setIsMachineFormOpen] = useState(false);
  const [machineToEdit, setMachineToEdit] = useState<Machine | null>(null);

  const [isMachineProfileOpen, setIsMachineProfileOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAndroidInstallOpen, setIsAndroidInstallOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // QR Code Scanner & Plate modals
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isQRPlateOpen, setIsQRPlateOpen] = useState(false);
  const [qrPlateMachine, setQRPlateMachine] = useState<Machine | null>(null);

  // Initial check for critical breakdown tickets and warranties expiring within 30 days on mount
  useEffect(() => {
    // 1. Check for active critical breakdown tickets
    const activeTickets = storageService.getTickets();
    const activeCritical = activeTickets.find(t => 
      t.severityLevel === 'critical' && 
      t.status !== 'Closed' && 
      t.status !== 'Resolved'
    );
    if (activeCritical && !notificationService.isAlertAcknowledged(`crit_tkt_${activeCritical.id}`)) {
      notificationService.triggerCriticalTicketAlert(activeCritical, () => {
        setSelectedTicket(activeCritical);
        setIsTicketDetailOpen(true);
      });
    }

    // 2. Check for machines with warranty expiring within 30 days
    const machinesList = storageService.getMachines();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiringMachine = machinesList.find(m => {
      if (!m.warrantyExpiryDate) return false;
      const exp = new Date(m.warrantyExpiryDate);
      exp.setHours(0, 0, 0, 0);
      const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 30 && diff >= 0;
    });

    if (expiringMachine && !notificationService.isAlertAcknowledged(`war_exp_${expiringMachine.id}`)) {
      notificationService.triggerWarrantyAlert(expiringMachine, () => {
        setSelectedMachine(expiringMachine);
        setIsMachineProfileOpen(true);
      });
    }
  }, []);

  // Force component re-render when storage updates
  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSwitchUser = (user: User) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
    triggerRefresh();
  };

  const handleResetDemoData = () => {
    storageService.resetToDefaults();
    setCurrentUser(storageService.getCurrentUser());
    triggerRefresh();
  };

  // Data queries for live badges
  const tickets = storageService.getTickets();
  const machines = storageService.getMachines();
  const pmTasks = storageService.getPMTasks();
  const warranties = storageService.getWarranties();
  const spareParts = storageService.getSpareParts();
  const handovers = storageService.getShiftHandovers();

  // Calculate warranties within 30 days or expired
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const machinesWithExpiringWarranty = machines.filter(m => {
    if (!m.warrantyExpiryDate) return false;
    const exp = new Date(m.warrantyExpiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  });

  const openTicketsCount = tickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length;
  const overduePMCount = pmTasks.filter(p => p.status === 'Overdue').length;
  const warrantyExpiringCount = Math.max(
    warranties.filter(w => w.status === 'Expiring Soon').length,
    machinesWithExpiringWarranty.length
  );
  const lowStockCount = spareParts.filter(p => p.quantityAvailable <= p.minStockLevel).length;
  const activeCriticalCount = tickets.filter(t => t.severityLevel === 'critical' && t.status !== 'Closed').length;

  // Breakdown Ticket Actions
  const handleOpenNewTicket = (mId?: string) => {
    setTicketToEdit(null);
    setPreselectedMachineId(mId);
    setIsTicketFormOpen(true);
  };

  const handleEditTicket = (ticket: BreakdownTicket) => {
    setTicketToEdit(ticket);
    setIsTicketFormOpen(true);
  };

  const handleSelectTicket = (ticket: BreakdownTicket) => {
    setSelectedTicket(ticket);
    setIsTicketDetailOpen(true);
  };

  const handleSaveTicket = (ticket: BreakdownTicket) => {
    storageService.saveTicket(ticket);
    setIsTicketFormOpen(false);
    setTicketToEdit(null);
    triggerRefresh();

    // Trigger critical breakdown browser notification and sound if marked critical
    if (ticket.severityLevel === 'critical' && ticket.status !== 'Closed') {
      notificationService.triggerCriticalTicketAlert(ticket, () => {
        setSelectedTicket(ticket);
        setIsTicketDetailOpen(true);
      });
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    storageService.deleteTicket(ticketId);
    triggerRefresh();
  };

  // Machine Actions
  const handleOpenNewMachine = () => {
    setMachineToEdit(null);
    setIsMachineFormOpen(true);
  };

  const handleEditMachine = (machine: Machine) => {
    setMachineToEdit(machine);
    setIsMachineFormOpen(true);
  };

  const handleSelectMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsMachineProfileOpen(true);
  };

  const handleSaveMachine = (machine: Machine) => {
    storageService.saveMachine(machine);
    setIsMachineFormOpen(false);
    setMachineToEdit(null);
    triggerRefresh();

    // Trigger warranty expiration alert if machine warranty is within 30 days
    if (machine.warrantyExpiryDate) {
      notificationService.triggerWarrantyAlert(machine, () => {
        setSelectedMachine(machine);
        setIsMachineProfileOpen(true);
      });
    }
  };

  const handleDeleteMachine = (machineId: string) => {
    storageService.deleteMachine(machineId);
    setIsMachineProfileOpen(false);
    triggerRefresh();
  };

  // Global search filtering
  const searchResults = searchQuery.trim() ? {
    tickets: tickets.filter(t => 
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.alarmCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.faultDescription.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 4),
    machines: machines.filter(m =>
      m.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 4),
    spareParts: spareParts.filter(p =>
      p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.partName.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3)
  } : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenNewTicket={() => handleOpenNewTicket()}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenAndroidInstall={() => setIsAndroidInstallOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
        onGlobalSearch={setSearchQuery}
        searchQuery={searchQuery}
        onResetDemoData={handleResetDemoData}
        activeCriticalCount={activeCriticalCount}
        lowStockCount={lowStockCount}
        warrantyExpiringCount={warrantyExpiringCount}
      />

      {/* Global Search Results Overlay (If search query active) */}
      {searchResults && (
        <div className="fixed inset-x-0 top-14 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 shadow-2xl max-h-96 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold text-white">
                Global Search Results for: &ldquo;<strong className="text-blue-400">{searchQuery}</strong>&rdquo;
              </span>
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                Clear Search
              </button>
            </div>

            {/* Tickets Matches */}
            {searchResults.tickets.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5 font-bold">
                  Breakdown Tickets ({searchResults.tickets.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.tickets.map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        handleSelectTicket(t);
                        setSearchQuery('');
                      }}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-blue-400 font-bold">{t.ticketNumber}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{t.machineId}</span>
                      </div>
                      <p className="text-slate-300 truncate mt-0.5">{t.faultDescription}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Machine Matches */}
            {searchResults.machines.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5 font-bold">
                  CNC Machines ({searchResults.machines.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.machines.map(m => (
                    <div
                      key={m.id}
                      onClick={() => {
                        handleSelectMachine(m);
                        setSearchQuery('');
                      }}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-white font-bold">{m.machineId}</span>
                        <span className="text-slate-400 text-[10px]">{m.model}</span>
                      </div>
                      <p className="text-slate-300 truncate mt-0.5">{m.machineName} • S/N: {m.serialNumber}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parts Matches */}
            {searchResults.spareParts.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5 font-bold">
                  Spare Parts ({searchResults.spareParts.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {searchResults.spareParts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setActiveTab('spares');
                        setSearchQuery('');
                      }}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500 cursor-pointer"
                    >
                      <span className="font-mono text-blue-400 font-bold block">{p.partNumber}</span>
                      <p className="text-slate-300 truncate text-[11px]">{p.partName}</p>
                      <span className="text-[10px] text-slate-400">Stock: {p.quantityAvailable}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.tickets.length === 0 && searchResults.machines.length === 0 && searchResults.spareParts.length === 0 && (
              <div className="py-4 text-center text-slate-400">
                No matching records found across tickets, machines, or parts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Workspace with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          openTicketCount={openTicketsCount}
          overduePMCount={overduePMCount}
          warrantyExpiringCount={warrantyExpiringCount}
          lowStockCount={lowStockCount}
          userRole={currentUser.role}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                onNavigate={setActiveTab}
                onOpenNewTicket={() => handleOpenNewTicket()}
                onSelectMachine={handleSelectMachine}
                onSelectTicket={handleSelectTicket}
              />
            )}

            {activeTab === 'tickets' && (
              <BreakdownLog
                tickets={tickets}
                onSelectTicket={handleSelectTicket}
                onOpenNewTicket={() => handleOpenNewTicket()}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'machines' && (
              <MachineRegistry
                machines={machines}
                onSelectMachine={handleSelectMachine}
                onOpenNewMachineModal={handleOpenNewMachine}
                onEditMachine={handleEditMachine}
                onDeleteMachine={handleDeleteMachine}
                onReportBreakdownForMachine={(m) => handleOpenNewTicket(m.machineId)}
                onOpenQRScanner={() => setIsQRScannerOpen(true)}
                onViewQRPlate={(m) => {
                  setQRPlateMachine(m);
                  setIsQRPlateOpen(true);
                }}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'pm' && (
              <PreventiveMaintenance currentUser={currentUser} />
            )}

            {activeTab === 'warranty' && (
              <WarrantyManagement onSelectTicket={handleSelectTicket} currentUser={currentUser} />
            )}

            {activeTab === 'customers' && (
              <CustomerManagement
                onSelectMachine={handleSelectMachine}
                onSelectTicket={handleSelectTicket}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'handover' && (
              <ShiftHandoverLog currentUser={currentUser} />
            )}

            {activeTab === 'spares' && (
              <SparePartsInventory currentUser={currentUser} />
            )}

            {activeTab === 'knowledge' && (
              <TechnicalLibrary currentUser={currentUser} />
            )}

            {activeTab === 'backups' && (
              <MachineBackups currentUser={currentUser} />
            )}

            {activeTab === 'reports' && (
              <ReportsAnalytics />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Android / Smartphone) */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        openTicketCount={openTicketsCount}
        overduePMCount={overduePMCount}
        onOpenAndroidInstall={() => setIsAndroidInstallOpen(true)}
        onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
      />

      {/* MODALS */}
      {/* 1. Breakdown Ticket Creation/Edit Form Modal */}
      <BreakdownFormModal
        isOpen={isTicketFormOpen}
        onClose={() => {
          setIsTicketFormOpen(false);
          setTicketToEdit(null);
        }}
        onSave={handleSaveTicket}
        existingTicket={ticketToEdit}
        currentUser={currentUser}
        preselectedMachineId={preselectedMachineId}
      />

      {/* 2. Breakdown Ticket Detail Modal */}
      <TicketDetailModal
        isOpen={isTicketDetailOpen}
        ticket={selectedTicket}
        onClose={() => {
          setIsTicketDetailOpen(false);
          setSelectedTicket(null);
        }}
        onEdit={(t) => {
          setIsTicketDetailOpen(false);
          handleEditTicket(t);
        }}
        onDelete={handleDeleteTicket}
        currentUser={currentUser}
      />

      {/* 3. Machine Form Modal */}
      <MachineFormModal
        isOpen={isMachineFormOpen}
        onClose={() => {
          setIsMachineFormOpen(false);
          setMachineToEdit(null);
        }}
        onSave={handleSaveMachine}
        existingMachine={machineToEdit}
      />

      {/* 4. Machine Profile Modal */}
      <MachineProfileModal
        isOpen={isMachineProfileOpen}
        machine={selectedMachine}
        onClose={() => {
          setIsMachineProfileOpen(false);
          setSelectedMachine(null);
        }}
        onEditMachine={(m) => {
          setIsMachineProfileOpen(false);
          handleEditMachine(m);
        }}
        onDeleteMachine={handleDeleteMachine}
        onSelectTicket={handleSelectTicket}
        onOpenNewTicketForMachine={(m) => {
          setIsMachineProfileOpen(false);
          handleOpenNewTicket(m.machineId);
        }}
        onViewQRPlate={(m) => {
          setQRPlateMachine(m);
          setIsQRPlateOpen(true);
        }}
        onOpenAndroidInstall={() => setIsAndroidInstallOpen(true)}
        onMachineUpdated={(updated) => {
          setSelectedMachine(updated);
          triggerRefresh();
        }}
        currentUser={currentUser}
      />

      {/* 5. Spreadsheet Import & Export Wizard */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onImportCompleted={triggerRefresh}
        currentUser={currentUser}
      />

      {/* 6. Security & Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      {/* 7. System Setup & Termux Guide Modal */}
      <SystemHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* 8. QR Code Camera Scanner Modal */}
      <QRCodeScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onSelectMachineProfile={(machine) => {
          setSelectedMachine(machine);
          setIsMachineProfileOpen(true);
        }}
        onReportBreakdown={(machine) => {
          handleOpenNewTicket(machine.machineId);
        }}
      />

      {/* 9. Machine QR Identification Plate Modal */}
      <MachineQRPlateModal
        isOpen={isQRPlateOpen}
        machine={qrPlateMachine}
        onClose={() => {
          setIsQRPlateOpen(false);
          setQRPlateMachine(null);
        }}
        onScanThisMachine={(m) => {
          setIsQRPlateOpen(false);
          setQRPlateMachine(null);
          setIsQRScannerOpen(true);
        }}
      />

      {/* 10. Android App Download & PWA Installation Modal */}
      <AndroidInstallModal
        isOpen={isAndroidInstallOpen}
        onClose={() => setIsAndroidInstallOpen(false)}
      />

      {/* 11. System Alerts & Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        tickets={tickets}
        machines={machines}
        pmTasks={pmTasks}
        spareParts={spareParts}
        handovers={handovers}
        onSelectTicket={(ticket) => {
          setSelectedTicket(ticket);
          setIsTicketDetailOpen(true);
        }}
        onSelectMachine={(machine) => {
          setSelectedMachine(machine);
          setIsMachineProfileOpen(true);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab as NavTab);
        }}
      />

      {/* 12. Floating Live Notification Toast Banner */}
      <NotificationBanner
        onOpenTicket={(ticketId) => {
          const t = tickets.find(x => x.id === ticketId || x.ticketNumber === ticketId);
          if (t) {
            setSelectedTicket(t);
            setIsTicketDetailOpen(true);
          }
        }}
        onOpenMachine={(machineId) => {
          const m = machines.find(x => x.id === machineId || x.machineId === machineId);
          if (m) {
            setSelectedMachine(m);
            setIsMachineProfileOpen(true);
          }
        }}
        onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
      />
    </div>
  );
};
export default App;
