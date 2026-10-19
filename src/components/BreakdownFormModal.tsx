import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wrench, 
  Camera, 
  Upload, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  Plus, 
  Trash2, 
  Save, 
  UserCheck, 
  Sliders,
  History,
  FileText
} from 'lucide-react';
import { 
  BreakdownTicket, 
  Machine, 
  FaultCategory, 
  SeverityLevel, 
  ProductionImpact, 
  ControllerType, 
  TicketStatus, 
  FaultPhoto, 
  SparePartUsed, 
  User 
} from '../types';
import { storageService } from '../services/storage';

interface BreakdownFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: BreakdownTicket) => void;
  existingTicket?: BreakdownTicket | null;
  currentUser: User;
  preselectedMachineId?: string;
}

export const BreakdownFormModal: React.FC<BreakdownFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingTicket,
  currentUser,
  preselectedMachineId
}) => {
  const machines = storageService.getMachines();
  const sparePartsList = storageService.getSpareParts();
  const users = storageService.getUsers();

  const [activeTab, setActiveTab] = useState<'basic' | 'fault' | 'photos' | 'downtime' | 'troubleshooting' | 'checklist' | 'closure'>('basic');

  // Form State
  const [ticketNumber, setTicketNumber] = useState('');
  const [breakdownDate, setBreakdownDate] = useState('');
  const [breakdownTime, setBreakdownTime] = useState('');
  const [shift, setShift] = useState<'Shift 1 (Morning)' | 'Shift 2 (Evening)' | 'Shift 3 (Night)'>('Shift 1 (Morning)');
  const [reportedBy, setReportedBy] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [technicianAssigned, setTechnicianAssigned] = useState('');
  const [maintenanceSupervisor, setMaintenanceSupervisor] = useState('');

  // Machine Details
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [machineName, setMachineName] = useState('');
  const [machineModel, setMachineModel] = useState('');
  const [machineSerialNumber, setMachineSerialNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [factory, setFactory] = useState('');
  const [department, setDepartment] = useState('');
  const [productionLine, setProductionLine] = useState('');

  // Fault Details
  const [faultCategory, setFaultCategory] = useState<FaultCategory>('Mechanical failure');
  const [faultDescription, setFaultDescription] = useState('');
  const [machineSymptoms, setMachineSymptoms] = useState('');
  const [alarmCode, setAlarmCode] = useState('');
  const [alarmMessage, setAlarmMessage] = useState('');
  const [controllerType, setControllerType] = useState<ControllerType>('FANUC');
  const [controllerScreenMessage, setControllerScreenMessage] = useState('');
  const [axisAffected, setAxisAffected] = useState<BreakdownTicket['axisAffected']>('None');
  const [spindleStatus, setSpindleStatus] = useState('Nominal');
  const [toolChangerStatus, setToolChangerStatus] = useState('Nominal');
  const [hydraulicStatus, setHydraulicStatus] = useState('Nominal');
  const [pneumaticStatus, setPneumaticStatus] = useState('Nominal');
  const [electricalStatus, setElectricalStatus] = useState('Nominal');
  const [mechanicalStatus, setMechanicalStatus] = useState('Nominal');
  const [severityLevel, setSeverityLevel] = useState<SeverityLevel>('medium');
  const [productionImpact, setProductionImpact] = useState<ProductionImpact>('line_stopped');

  // Photographs
  const [photographs, setPhotographs] = useState<FaultPhoto[]>([]);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoType, setNewPhotoType] = useState<FaultPhoto['photoType']>('alarm_screen');

  // Downtime tracking timestamps
  const [breakdownStart, setBreakdownStart] = useState('');
  const [technicianArrival, setTechnicianArrival] = useState('');
  const [diagnosisStart, setDiagnosisStart] = useState('');
  const [repairStart, setRepairStart] = useState('');
  const [repairCompletion, setRepairCompletion] = useState('');
  const [trialRunStart, setTrialRunStart] = useState('');
  const [machineRestoration, setMachineRestoration] = useState('');
  const [productionRestart, setProductionRestart] = useState('');
  const [sparePartsWaitingMinutes, setSparePartsWaitingMinutes] = useState(0);

  // Troubleshooting & Repairs
  const [initialInspection, setInitialInspection] = useState('');
  const [troubleshootingPerformed, setTroubleshootingPerformed] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [confirmedFailure, setConfirmedFailure] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [componentsRepaired, setComponentsRepaired] = useState('');
  const [componentsReplaced, setComponentsReplaced] = useState('');
  const [sparePartsUsed, setSparePartsUsed] = useState<SparePartUsed[]>([]);
  const [selectedPartToAdd, setSelectedPartToAdd] = useState('');
  const [partQtyToAdd, setPartQtyToAdd] = useState(1);

  // Checks & calibration
  const [parameterChanges, setParameterChanges] = useState('');
  const [calibrationPerformed, setCalibrationPerformed] = useState('');
  const [alignmentPerformed, setAlignmentPerformed] = useState('');
  const [electricalChecks, setElectricalChecks] = useState('');
  const [mechanicalChecks, setMechanicalChecks] = useState('');
  const [safetyChecks, setSafetyChecks] = useState('');
  const [testResults, setTestResults] = useState('');
  const [finalObservations, setFinalObservations] = useState('');
  const [technicianRemarks, setTechnicianRemarks] = useState('');
  const [supervisorRemarks, setSupervisorRemarks] = useState('');

  // Pre-restart safety checklist
  const [preRestartChecklist, setPreRestartChecklist] = useState<BreakdownTicket['preRestartChecklist']>({
    spindleRunTest: false,
    emergencyStopVerified: false,
    axisInterlockTested: false,
    lubricationPressureChecked: false,
    coolantFlowTested: false,
    guardInterlocksSafe: false,
    trialPartCutPassed: false
  });

  // Status and closure
  const [status, setStatus] = useState<TicketStatus>('Reported');
  const [statusChangeNote, setStatusChangeNote] = useState('');
  const [finalMachineStatus, setFinalMachineStatus] = useState<Machine['operatingStatus']>('running');
  const [productionRestartConfirmation, setProductionRestartConfirmation] = useState(false);
  const [supervisorApproved, setSupervisorApproved] = useState(false);
  const [isWarrantyClaim, setIsWarrantyClaim] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize or populate form
  useEffect(() => {
    if (existingTicket) {
      setTicketNumber(existingTicket.ticketNumber);
      setBreakdownDate(existingTicket.breakdownDate);
      setBreakdownTime(existingTicket.breakdownTime);
      setShift(existingTicket.shift);
      setReportedBy(existingTicket.reportedBy);
      setOperatorName(existingTicket.operatorName);
      setTechnicianAssigned(existingTicket.technicianAssigned);
      setMaintenanceSupervisor(existingTicket.maintenanceSupervisor);

      setSelectedMachineId(existingTicket.machineId);
      setMachineName(existingTicket.machineName);
      setMachineModel(existingTicket.machineModel);
      setMachineSerialNumber(existingTicket.machineSerialNumber);
      setCustomerName(existingTicket.customerName);
      setCustomerId(existingTicket.customerId);
      setFactory(existingTicket.factory);
      setDepartment(existingTicket.department);
      setProductionLine(existingTicket.productionLine);

      setFaultCategory(existingTicket.faultCategory);
      setFaultDescription(existingTicket.faultDescription);
      setMachineSymptoms(existingTicket.machineSymptoms);
      setAlarmCode(existingTicket.alarmCode);
      setAlarmMessage(existingTicket.alarmMessage);
      setControllerType(existingTicket.controllerType);
      setControllerScreenMessage(existingTicket.controllerScreenMessage);
      setAxisAffected(existingTicket.axisAffected);
      setSpindleStatus(existingTicket.spindleStatus);
      setToolChangerStatus(existingTicket.toolChangerStatus);
      setHydraulicStatus(existingTicket.hydraulicStatus);
      setPneumaticStatus(existingTicket.pneumaticStatus);
      setElectricalStatus(existingTicket.electricalStatus);
      setMechanicalStatus(existingTicket.mechanicalStatus);
      setSeverityLevel(existingTicket.severityLevel);
      setProductionImpact(existingTicket.productionImpact);

      setPhotographs(existingTicket.photographs || []);

      setBreakdownStart(existingTicket.breakdownStart || '');
      setTechnicianArrival(existingTicket.technicianArrival || '');
      setDiagnosisStart(existingTicket.diagnosisStart || '');
      setRepairStart(existingTicket.repairStart || '');
      setRepairCompletion(existingTicket.repairCompletion || '');
      setTrialRunStart(existingTicket.trialRunStart || '');
      setMachineRestoration(existingTicket.machineRestoration || '');
      setProductionRestart(existingTicket.productionRestart || '');
      setSparePartsWaitingMinutes(existingTicket.sparePartsWaitingMinutes || 0);

      setInitialInspection(existingTicket.initialInspection || '');
      setTroubleshootingPerformed(existingTicket.troubleshootingPerformed || '');
      setRootCause(existingTicket.rootCause || '');
      setConfirmedFailure(existingTicket.confirmedFailure || '');
      setCorrectiveAction(existingTicket.correctiveAction || '');
      setComponentsRepaired(existingTicket.componentsRepaired || '');
      setComponentsReplaced(existingTicket.componentsReplaced || '');
      setSparePartsUsed(existingTicket.sparePartsUsed || []);

      setParameterChanges(existingTicket.parameterChanges || '');
      setCalibrationPerformed(existingTicket.calibrationPerformed || '');
      setAlignmentPerformed(existingTicket.alignmentPerformed || '');
      setElectricalChecks(existingTicket.electricalChecks || '');
      setMechanicalChecks(existingTicket.mechanicalChecks || '');
      setSafetyChecks(existingTicket.safetyChecks || '');
      setTestResults(existingTicket.testResults || '');
      setFinalObservations(existingTicket.finalObservations || '');
      setTechnicianRemarks(existingTicket.technicianRemarks || '');
      setSupervisorRemarks(existingTicket.supervisorRemarks || '');

      setPreRestartChecklist(existingTicket.preRestartChecklist || {
        spindleRunTest: false,
        emergencyStopVerified: false,
        axisInterlockTested: false,
        lubricationPressureChecked: false,
        coolantFlowTested: false,
        guardInterlocksSafe: false,
        trialPartCutPassed: false
      });

      setStatus(existingTicket.status);
      setFinalMachineStatus(existingTicket.finalMachineStatus || 'running');
      setProductionRestartConfirmation(!!existingTicket.productionRestartConfirmation);
      setSupervisorApproved(!!existingTicket.supervisorApproved);
      setIsWarrantyClaim(!!existingTicket.isWarrantyClaim);
    } else {
      // New Ticket Defaults
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
      const ticketNum = `TKT-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      setTicketNumber(ticketNum);
      setBreakdownDate(dateStr);
      setBreakdownTime(timeStr);
      setBreakdownStart(now.toISOString());
      setReportedBy(currentUser.name);
      setOperatorName(currentUser.name);
      setTechnicianAssigned('Elena Rostova');
      setMaintenanceSupervisor('Marcus Vance');

      // If preselected machine
      const targetMachine = preselectedMachineId 
        ? machines.find(m => m.id === preselectedMachineId || m.machineId === preselectedMachineId) 
        : machines[0];

      if (targetMachine) {
        populateMachineData(targetMachine);
      }
    }
  }, [existingTicket, isOpen]);

  const populateMachineData = (m: Machine) => {
    setSelectedMachineId(m.machineId);
    setMachineName(m.machineName);
    setMachineModel(m.model);
    setMachineSerialNumber(m.serialNumber);
    setCustomerName(m.customerName);
    setCustomerId(m.customerId);
    setFactory(m.factory);
    setDepartment(m.department);
    setProductionLine(m.productionLine);
    setControllerType(m.controllerType);
  };

  const handleMachineChange = (mId: string) => {
    const m = machines.find(item => item.machineId === mId || item.id === mId);
    if (m) {
      populateMachineData(m);
    }
  };

  // Add photo via upload or simulated camera capture
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        const newPhoto: FaultPhoto = {
          id: `PHT-${Date.now()}-${i}`,
          url: dataUrl,
          caption: newPhotoCaption || file.name,
          photoType: newPhotoType,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.name
        };
        setPhotographs(prev => [...prev, newPhoto]);
        setNewPhotoCaption('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Spare Part to Ticket
  const handleAddSparePart = () => {
    if (!selectedPartToAdd || partQtyToAdd <= 0) return;
    const part = sparePartsList.find(p => p.id === selectedPartToAdd);
    if (!part) return;

    // Check inventory stock warning
    if (part.quantityAvailable < partQtyToAdd) {
      alert(`Warning: Selected quantity (${partQtyToAdd}) exceeds available stock (${part.quantityAvailable}).`);
    }

    const existingIndex = sparePartsUsed.findIndex(p => p.partId === part.id);
    if (existingIndex >= 0) {
      const updated = [...sparePartsUsed];
      updated[existingIndex].quantity += partQtyToAdd;
      setSparePartsUsed(updated);
    } else {
      setSparePartsUsed(prev => [
        ...prev,
        {
          partId: part.id,
          partName: part.partName,
          partNumber: part.partNumber,
          quantity: partQtyToAdd,
          unitCost: part.unitCost
        }
      ]);
    }
    setSelectedPartToAdd('');
    setPartQtyToAdd(1);
  };

  const handleRemoveSparePart = (partId: string) => {
    setSparePartsUsed(prev => prev.filter(p => p.partId !== partId));
  };

  // Quick timestamp setter
  const setTimestampNow = (setter: (val: string) => void) => {
    setter(new Date().toISOString());
  };

  // Auto-calculated downtime summary
  const calculatedDowntime = storageService.calculateDowntimeBreakdown({
    breakdownStart,
    technicianArrival,
    diagnosisStart,
    repairStart,
    repairCompletion,
    trialRunStart,
    machineRestoration,
    productionRestart,
    sparePartsWaitingMinutes,
    status
  });

  // Save validation and submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!ticketNumber.trim()) newErrors.push('Ticket number is required.');
    if (!selectedMachineId) newErrors.push('Please select a registered machine.');
    if (!faultDescription.trim()) newErrors.push('Fault description is required.');

    // Final Closure validation enforcement
    if (status === 'Closed') {
      if (!rootCause.trim()) newErrors.push('Final Closure requires Root Cause to be documented.');
      if (!correctiveAction.trim()) newErrors.push('Final Closure requires Corrective Action to be documented.');
      if (!repairCompletion) newErrors.push('Final Closure requires Repair Completion timestamp.');
      if (!testResults.trim()) newErrors.push('Final Closure requires Trial Run / Test Results to be documented.');
      if (!technicianRemarks.trim()) newErrors.push('Final Closure requires Technician Remarks.');
      if (!productionRestartConfirmation) newErrors.push('Final Closure requires Production Restart confirmation.');
      if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && !supervisorApproved) {
        newErrors.push('Closing a ticket requires Maintenance Supervisor or Admin approval.');
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);

    // Construct ticket object
    const updatedStatusHistory = existingTicket ? [...existingTicket.statusHistory] : [];
    if (!existingTicket || existingTicket.status !== status) {
      updatedStatusHistory.push({
        status,
        timestamp: new Date().toISOString(),
        changedBy: currentUser.name,
        note: statusChangeNote || `Status set to ${status}`
      });
    }

    const ticketToSave: BreakdownTicket = {
      id: existingTicket?.id || `TKT-${Date.now()}`,
      ticketNumber,
      breakdownDate,
      breakdownTime,
      machineId: selectedMachineId,
      machineName,
      machineModel,
      machineSerialNumber,
      customerName,
      customerId,
      factory,
      department,
      productionLine,
      shift,
      reportedBy,
      operatorName,
      technicianAssigned,
      maintenanceSupervisor,
      faultCategory,
      faultDescription,
      machineSymptoms,
      alarmCode,
      alarmMessage,
      controllerType,
      controllerScreenMessage,
      axisAffected,
      spindleStatus,
      toolChangerStatus,
      hydraulicStatus,
      pneumaticStatus,
      electricalStatus,
      mechanicalStatus,
      severityLevel,
      productionImpact,
      photographs,
      breakdownStart,
      technicianArrival,
      diagnosisStart,
      repairStart,
      repairCompletion,
      trialRunStart,
      machineRestoration,
      productionRestart,
      totalDowntimeMinutes: calculatedDowntime.totalDowntimeMinutes,
      diagnosisDurationMinutes: calculatedDowntime.diagnosisDurationMinutes,
      repairDurationMinutes: calculatedDowntime.repairDurationMinutes,
      waitingDurationMinutes: calculatedDowntime.waitingDurationMinutes,
      sparePartsWaitingMinutes,
      testingDurationMinutes: calculatedDowntime.testingDurationMinutes,
      timestampAuditLog: existingTicket?.timestampAuditLog || [],
      initialInspection,
      troubleshootingPerformed,
      rootCause,
      confirmedFailure,
      correctiveAction,
      componentsRepaired,
      componentsReplaced,
      sparePartsUsed,
      parameterChanges,
      calibrationPerformed,
      alignmentPerformed,
      electricalChecks,
      mechanicalChecks,
      safetyChecks,
      testResults,
      finalObservations,
      technicianRemarks,
      supervisorRemarks,
      preRestartChecklist,
      status,
      statusHistory: updatedStatusHistory,
      closedBy: status === 'Closed' ? (existingTicket?.closedBy || currentUser.name) : undefined,
      closureDate: status === 'Closed' ? (existingTicket?.closureDate || new Date().toISOString()) : undefined,
      finalMachineStatus,
      productionRestartConfirmation,
      supervisorApproved,
      isWarrantyClaim,
      createdAt: existingTicket?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Auto deduct inventory if spare parts are used
    sparePartsUsed.forEach(part => {
      storageService.adjustPartStock(
        part.partId,
        'issue',
        part.quantity,
        `Used on ticket ${ticketNumber}`,
        `Installed on machine ${selectedMachineId}`,
        ticketToSave.id,
        ticketNumber
      );
    });

    onSave(ticketToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading-industrial font-bold text-base sm:text-lg text-white uppercase tracking-wider">
                  {existingTicket ? `Edit Breakdown Ticket: ${existingTicket.ticketNumber}` : 'New Machine Breakdown Ticket'}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  severityLevel === 'critical' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-blue-950 text-blue-400'
                }`}>
                  {severityLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Industrial fix log, failure diagnosis, timestamps & downtime verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto text-xs shrink-0 scrollbar-none">
          {[
            { id: 'basic', label: 'A. Basic Info' },
            { id: 'fault', label: 'B. Fault Details' },
            { id: 'photos', label: `C. Photographs (${photographs.length})` },
            { id: 'downtime', label: 'D. Downtime Tracking' },
            { id: 'troubleshooting', label: 'E. Repair & Parts' },
            { id: 'checklist', label: 'F. Safety Checklist' },
            { id: 'closure', label: 'G. Status & Sign-off' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Validation Errors Banner */}
        {errors.length > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-red-400">
              <AlertTriangle className="w-4 h-4" /> Please resolve the following before saving:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Body with Tabs */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB A: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ticket Number (Auto)
                  </label>
                  <input
                    type="text"
                    value={ticketNumber}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-blue-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date of Breakdown *
                  </label>
                  <input
                    type="date"
                    value={breakdownDate}
                    onChange={(e) => setBreakdownDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Time of Breakdown *
                  </label>
                  <input
                    type="time"
                    value={breakdownTime}
                    onChange={(e) => setBreakdownTime(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Machine Selection with Auto-population */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> Select Registered CNC Machine *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Fields auto-populate from registry
                  </span>
                </div>

                <select
                  value={selectedMachineId}
                  onChange={(e) => handleMachineChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Machine --</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.machineId}>
                      {m.machineId} | {m.machineName} ({m.model}) - {m.customerName}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Model</span>
                    <span className="font-semibold text-slate-200">{machineModel || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Serial Number</span>
                    <span className="font-mono text-slate-200">{machineSerialNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Customer</span>
                    <span className="text-slate-200 truncate block">{customerName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Plant & Line</span>
                    <span className="text-slate-200 truncate block">{factory} / {productionLine || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Operational Context */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Operating Shift *
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Shift 1 (Morning)">Shift 1 (Morning)</option>
                    <option value="Shift 2 (Evening)">Shift 2 (Evening)</option>
                    <option value="Shift 3 (Night)">Shift 3 (Night)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reported By
                  </label>
                  <input
                    type="text"
                    value={reportedBy}
                    onChange={(e) => setReportedBy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Operator on Duty
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Technician *
                  </label>
                  <select
                    value={technicianAssigned}
                    onChange={(e) => setTechnicianAssigned(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Maintenance Supervisor
                </label>
                <input
                  type="text"
                  value={maintenanceSupervisor}
                  onChange={(e) => setMaintenanceSupervisor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* TAB B: FAULT DETAILS */}
          {activeTab === 'fault' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fault Category *
                  </label>
                  <select
                    value={faultCategory}
                    onChange={(e) => setFaultCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Mechanical failure">Mechanical failure</option>
                    <option value="Electrical failure">Electrical failure</option>
                    <option value="CNC controller alarm">CNC controller alarm</option>
                    <option value="Servo motor failure">Servo motor failure</option>
                    <option value="Spindle failure">Spindle failure</option>
                    <option value="Hydraulic failure">Hydraulic failure</option>
                    <option value="Pneumatic failure">Pneumatic failure</option>
                    <option value="Tool changer failure">Tool changer failure</option>
                    <option value="Sensor failure">Sensor failure</option>
                    <option value="Coolant system failure">Coolant system failure</option>
                    <option value="Lubrication failure">Lubrication failure</option>
                    <option value="Tooling issue">Tooling issue</option>
                    <option value="Software/parameter issue">Software/parameter issue</option>
                    <option value="Preventive maintenance">Preventive maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Severity Level *
                  </label>
                  <select
                    value={severityLevel}
                    onChange={(e) => setSeverityLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low (Minor nuisance, running)</option>
                    <option value="medium">Medium (Partial function loss)</option>
                    <option value="high">High (Severe production risk)</option>
                    <option value="critical">Critical (Line halted / Emergency)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Production Impact
                  </label>
                  <select
                    value={productionImpact}
                    onChange={(e) => setProductionImpact(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="none">None (Zero disruption)</option>
                    <option value="partial">Partial (Speed reduced)</option>
                    <option value="line_stopped">Line Stopped</option>
                    <option value="facility_stopped">Facility Stopped</option>
                  </select>
                </div>
              </div>

              {/* Alarm Code & CNC Controller */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Alarm Code
                  </label>
                  <input
                    type="text"
                    value={alarmCode}
                    onChange={(e) => setAlarmCode(e.target.value)}
                    placeholder="e.g. SV0027, EX1012, 414"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Alarm Message
                  </label>
                  <input
                    type="text"
                    value={alarmMessage}
                    onChange={(e) => setAlarmMessage(e.target.value)}
                    placeholder="e.g. SPINDLE MOTOR DISCONNECT"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Axis Affected
                  </label>
                  <select
                    value={axisAffected}
                    onChange={(e) => setAxisAffected(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="None">None</option>
                    <option value="X">X Axis</option>
                    <option value="Y">Y Axis</option>
                    <option value="Z">Z Axis</option>
                    <option value="A">A Axis (Rotary)</option>
                    <option value="B">B Axis (Tilt)</option>
                    <option value="C">C Axis (Rotary Table)</option>
                    <option value="Spindle">Spindle Cartridge</option>
                    <option value="ATC">Automatic Tool Changer</option>
                    <option value="Multiple">Multiple Axes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fault Description *
                </label>
                <textarea
                  rows={2}
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  placeholder="Concise overview of what happened when the machine stopped..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Machine Symptoms & Operator Observations
                </label>
                <textarea
                  rows={2}
                  value={machineSymptoms}
                  onChange={(e) => setMachineSymptoms(e.target.value)}
                  placeholder="Noise, vibration, smoke, smell, visual chatter, flashing beacon, hydraulic pressure drop..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Subsystem Status Indicators */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Subsystem Operational Checks
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Spindle Status</label>
                    <input
                      type="text"
                      value={spindleStatus}
                      onChange={(e) => setSpindleStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Tool Changer (ATC)</label>
                    <input
                      type="text"
                      value={toolChangerStatus}
                      onChange={(e) => setToolChangerStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Hydraulic System</label>
                    <input
                      type="text"
                      value={hydraulicStatus}
                      onChange={(e) => setHydraulicStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Pneumatic System</label>
                    <input
                      type="text"
                      value={pneumaticStatus}
                      onChange={(e) => setPneumaticStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Electrical Drives</label>
                    <input
                      type="text"
                      value={electricalStatus}
                      onChange={(e) => setElectricalStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Mechanical Alignment</label>
                    <input
                      type="text"
                      value={mechanicalStatus}
                      onChange={(e) => setMechanicalStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB C: FAULT PHOTOGRAPHS */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-400" />
                    Capture / Upload Machine Photographs
                  </span>
                  <span className="text-[11px] text-slate-400">Mobile camera supported</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Photograph Type</label>
                    <select
                      value={newPhotoType}
                      onChange={(e) => setNewPhotoType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      <option value="alarm_screen">Alarm Screen Photograph</option>
                      <option value="damaged_component">Damaged Component</option>
                      <option value="before_repair">Before-Repair State</option>
                      <option value="after_repair">After-Repair Verification</option>
                      <option value="general">General Machine Setup</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Photo Caption / Note</label>
                    <input
                      type="text"
                      value={newPhotoCaption}
                      onChange={(e) => setNewPhotoCaption(e.target.value)}
                      placeholder="e.g. Spindle coder connector pins showing coolant oil mist..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Upload or Take Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Supports mobile camera capture directly on Android/iOS.
                  </span>
                </div>
              </div>

              {/* Gallery of Uploaded Photos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photographs.map((photo, index) => (
                  <div key={photo.id} className="group relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="aspect-video bg-slate-900 overflow-hidden">
                      <img 
                        src={photo.url} 
                        alt={photo.caption} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                    </div>
                    <div className="p-2.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="capitalize font-semibold text-blue-400">{photo.photoType.replace('_', ' ')}</span>
                        <span>{new Date(photo.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-2">{photo.caption}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotographs(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {photographs.length === 0 && (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                  No photographs uploaded yet. Click above to attach alarm screen photos or damaged components.
                </div>
              )}
            </div>
          )}

          {/* TAB D: DOWNTIME TRACKING */}
          {activeTab === 'downtime' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                    Live Industrial Downtime Engine
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Total Downtime = Production Restart Time − Breakdown Start Time (with strict non-overlapping periods).
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono-industrial text-white">
                    {Math.floor(calculatedDowntime.totalDowntimeMinutes / 60)}h {calculatedDowntime.totalDowntimeMinutes % 60}m
                  </div>
                  <div className="text-[10px] text-blue-300 font-mono">
                    ({calculatedDowntime.totalDowntimeMinutes} total minutes)
                  </div>
                </div>
              </div>

              {/* Exact Timestamps Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Breakdown Start */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">1. Breakdown Occurred</label>
                    <button 
                      type="button" 
                      onClick={() => setTimestampNow(setBreakdownStart)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Set Now
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={breakdownStart ? breakdownStart.substring(0, 16) : ''}
                    onChange={(e) => setBreakdownStart(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                {/* 2. Technician Arrival */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">2. Technician Arrival</label>
                    <button 
                      type="button" 
                      onClick={() => setTimestampNow(setTechnicianArrival)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Set Now
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={technicianArrival ? technicianArrival.substring(0, 16) : ''}
                    onChange={(e) => setTechnicianArrival(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                {/* 3. Diagnosis Start */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">3. Diagnosis Start</label>
                    <button 
                      type="button" 
                      onClick={() => setTimestampNow(setDiagnosisStart)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Set Now
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={diagnosisStart ? diagnosisStart.substring(0, 16) : ''}
                    onChange={(e) => setDiagnosisStart(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                {/* 4. Repair Start */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">4. Repair Start</label>
                    <button 
                      type="button" 
                      onClick={() => setTimestampNow(setRepairStart)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Set Now
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={repairStart ? repairStart.substring(0, 16) : ''}
                    onChange={(e) => setRepairStart(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                {/* 5. Repair Completion */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">5. Repair Completion</label>
                    <button 
                      type="button" 
                      onClick={() => setTimestampNow(setRepairCompletion)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Set Now
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={repairCompletion ? repairCompletion.substring(0, 16) : ''}
                    onChange={(e) => setRepairCompletion(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                {/* 6. Trial Run Start */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">6. Trial-Run / Dry Cycle Start</label>
                    <button 
                      type="button" 
                      onClick={() => setTimestampNow(setTrialRunStart)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Set Now
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={trialRunStart ? trialRunStart.substring(0, 16) : ''}
                    onChange={(e) => setTrialRunStart(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                {/* 7. Machine Restoration */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">7. Machine Restored to Operations</label>
                    <button 
                      type="button" 
                      onClick={() => setTimestampNow(setMachineRestoration)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Set Now
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={machineRestoration ? machineRestoration.substring(0, 16) : ''}
                    onChange={(e) => setMachineRestoration(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                {/* 8. Production Restart */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">8. Production Restart (Part Cutting)</label>
                    <button 
                      type="button" 
                      onClick={() => setTimestampNow(setProductionRestart)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Set Now
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={productionRestart ? productionRestart.substring(0, 16) : ''}
                    onChange={(e) => setProductionRestart(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Stage-wise calculated breakdown */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Downtime Segments Breakdown
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Waiting Response</span>
                    <span className="font-mono font-bold text-slate-200">{calculatedDowntime.waitingDurationMinutes} m</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Diagnosis</span>
                    <span className="font-mono font-bold text-blue-400">{calculatedDowntime.diagnosisDurationMinutes} m</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Parts Waiting</span>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <input
                        type="number"
                        min="0"
                        value={sparePartsWaitingMinutes}
                        onChange={(e) => setSparePartsWaitingMinutes(Number(e.target.value))}
                        className="w-14 bg-slate-950 border border-slate-700 rounded px-1 text-center font-mono text-amber-400 font-bold"
                      />
                      <span className="text-[10px] text-slate-400">m</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Active Repair</span>
                    <span className="font-mono font-bold text-emerald-400">{calculatedDowntime.repairDurationMinutes} m</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Testing / Trial</span>
                    <span className="font-mono font-bold text-purple-400">{calculatedDowntime.testingDurationMinutes} m</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB E: TROUBLESHOOTING & REPAIR & PARTS */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Inspection Performed
                  </label>
                  <textarea
                    rows={2}
                    value={initialInspection}
                    onChange={(e) => setInitialInspection(e.target.value)}
                    placeholder="Visual check, LED codes, multimeters, hydraulic gauge readouts..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Troubleshooting & Diagnostics Executed
                  </label>
                  <textarea
                    rows={2}
                    value={troubleshootingPerformed}
                    onChange={(e) => setTroubleshootingPerformed(e.target.value)}
                    placeholder="Oscilloscope readings, servo tune, valve isolation, megger test..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirmed Failure Mode
                  </label>
                  <input
                    type="text"
                    value={confirmedFailure}
                    onChange={(e) => setConfirmedFailure(e.target.value)}
                    placeholder="e.g. Broken valve coil, shorted encoder line, worn thrust bearing"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">
                    Root Cause (Required for Final Closure)
                  </label>
                  <input
                    type="text"
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="Underlying reason (e.g. coolant mist ingress, seal degradation)"
                    className="w-full bg-slate-950 border border-amber-800/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  Corrective Action Taken (Required for Final Closure)
                </label>
                <textarea
                  rows={2}
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Steps taken to eliminate root cause and restore normal operation..."
                  className="w-full bg-slate-950 border border-emerald-800/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Spare Parts Integration Section */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Spare Parts Used & Replaced (Auto-Inventory Deduction)
                  </span>
                  <span className="text-[11px] text-blue-400">Inventory Connected</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedPartToAdd}
                    onChange={(e) => setSelectedPartToAdd(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Choose Spare Part from Inventory --</option>
                    {sparePartsList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.partNumber} - {p.partName} (Stock: {p.quantityAvailable} | ${p.unitCost})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={partQtyToAdd}
                      onChange={(e) => setPartQtyToAdd(Number(e.target.value))}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-center text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddSparePart}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Part
                    </button>
                  </div>
                </div>

                {/* Parts Table */}
                {sparePartsUsed.length > 0 && (
                  <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900 text-slate-400 text-[11px]">
                        <tr>
                          <th className="p-2">Part Number</th>
                          <th className="p-2">Description</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Unit Cost</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {sparePartsUsed.map(part => (
                          <tr key={part.partId} className="hover:bg-slate-900/40">
                            <td className="p-2 font-mono text-blue-400 font-semibold">{part.partNumber}</td>
                            <td className="p-2 text-slate-200">{part.partName}</td>
                            <td className="p-2 text-center font-mono">{part.quantity}</td>
                            <td className="p-2 text-right font-mono">${part.unitCost}</td>
                            <td className="p-2 text-right font-mono text-emerald-400">${part.quantity * part.unitCost}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveSparePart(part.partId)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Adjustments, Calibration & Tests */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Parameter Changes</label>
                  <input
                    type="text"
                    value={parameterChanges}
                    onChange={(e) => setParameterChanges(e.target.value)}
                    placeholder="e.g. Par 4002 modified"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Calibration Done</label>
                  <input
                    type="text"
                    value={calibrationPerformed}
                    onChange={(e) => setCalibrationPerformed(e.target.value)}
                    placeholder="e.g. Spindle M19 re-oriented"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Alignment Done</label>
                  <input
                    type="text"
                    value={alignmentPerformed}
                    onChange={(e) => setAlignmentPerformed(e.target.value)}
                    placeholder="e.g. ATC arm height checked"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Test Results & Trial Observations
                </label>
                <textarea
                  rows={2}
                  value={testResults}
                  onChange={(e) => setTestResults(e.target.value)}
                  placeholder="Dry cycle results, spindle speed ramp test, part dimensional tolerance verification..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* TAB F: PRE-RESTART SAFETY CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Pre-Restart Machine Safety & Verification Checklist
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Must be verified before handover to production</span>
                </div>

                <div className="space-y-3 pt-1">
                  {[
                    { key: 'spindleRunTest', label: '1. Spindle Run Test: Verified low/mid/high RPM rotation without vibration or abnormal heat' },
                    { key: 'emergencyStopVerified', label: '2. Emergency Stop Circuits: Main console and remote pendant E-stop pushbuttons verified' },
                    { key: 'axisInterlockTested', label: '3. Axis Interlocks & Hard Limits: Software and physical overtravel limit switches tested' },
                    { key: 'lubricationPressureChecked', label: '4. Way-Lubrication System: Pressure builds to specification (>12 Bar) and cycles normally' },
                    { key: 'coolantFlowTested', label: '5. Coolant & Washdown: Flood coolant, CTS high pressure pump, and chip augers operational' },
                    { key: 'guardInterlocksSafe', label: '6. Door Guard & Safety Interlocks: Machine enclosure interlock prevents spindle start while door open' },
                    { key: 'trialPartCutPassed', label: '7. Trial Cut / CMM Inspection: First piece produced and verified within dimensional tolerances' }
                  ].map(item => (
                    <label 
                      key={item.key}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={preRestartChecklist[item.key as keyof BreakdownTicket['preRestartChecklist']]}
                        onChange={(e) => setPreRestartChecklist(prev => ({
                          ...prev,
                          [item.key]: e.target.checked
                        }))}
                        className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-0 bg-slate-950 border-slate-700"
                      />
                      <span className="text-xs text-slate-200">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB G: STATUS, SIGN-OFF & CLOSURE */}
          {activeTab === 'closure' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Repair Ticket Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Reported">Reported</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Diagnosis in Progress">Diagnosis in Progress</option>
                    <option value="Waiting for Parts">Waiting for Parts</option>
                    <option value="Waiting for Approval">Waiting for Approval</option>
                    <option value="Repair in Progress">Repair in Progress</option>
                    <option value="Testing">Testing</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed (Final sign-off)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Final Machine Status After Fix
                  </label>
                  <select
                    value={finalMachineStatus}
                    onChange={(e) => setFinalMachineStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="running">Running (Full Production)</option>
                    <option value="idle">Idle (Available, not cutting)</option>
                    <option value="maintenance">Maintenance (Follow-up scheduled)</option>
                    <option value="breakdown">Breakdown (Unresolved)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status Change Remark / Audit Note
                </label>
                <input
                  type="text"
                  value={statusChangeNote}
                  onChange={(e) => setStatusChangeNote(e.target.value)}
                  placeholder="Reason for current status transition..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Warranty Claim Flag */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Warranty Claim Eligible</span>
                  <span className="text-[11px] text-slate-400">Flag repair for OEM warranty reimbursement claim</span>
                </div>
                <input
                  type="checkbox"
                  checked={isWarrantyClaim}
                  onChange={(e) => setIsWarrantyClaim(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                />
              </div>

              {/* Final Closure Verification Block */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-900/50 space-y-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                  Final Sign-off & Production Release
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Technician Remarks</label>
                    <textarea
                      rows={2}
                      value={technicianRemarks}
                      onChange={(e) => setTechnicianRemarks(e.target.value)}
                      placeholder="Remarks on component alignment, parameters or precautions..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Supervisor Remarks</label>
                    <textarea
                      rows={2}
                      value={supervisorRemarks}
                      onChange={(e) => setSupervisorRemarks(e.target.value)}
                      placeholder="Supervisor review, QA verification, or approval notes..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-200">
                    <input
                      type="checkbox"
                      checked={productionRestartConfirmation}
                      onChange={(e) => setProductionRestartConfirmation(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                    />
                    <span>I confirm that the machine has been successfully restored and released to production.</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-200">
                    <input
                      type="checkbox"
                      checked={supervisorApproved}
                      onChange={(e) => setSupervisorApproved(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                    />
                    <span>Supervisor sign-off approval verified (Authorized role: Manager or Admin).</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Current user: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role})
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Breakdown Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
