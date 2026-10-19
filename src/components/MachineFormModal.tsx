import React, { useState, useEffect } from 'react';
import { X, Save, Cpu, Camera, AlertCircle } from 'lucide-react';
import { Machine, MachineStatus, ControllerType, MachineType } from '../types';
import { storageService } from '../services/storage';

interface MachineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (machine: Machine) => void;
  existingMachine?: Machine | null;
}

export const MachineFormModal: React.FC<MachineFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingMachine
}) => {
  const customers = storageService.getCustomers();
  const users = storageService.getUsers();

  const [machineId, setMachineId] = useState('');
  const [machineName, setMachineName] = useState('');
  const [model, setModel] = useState('DNM 5700 II');
  const [manufacturer, setManufacturer] = useState('DN Solutions');
  const [serialNumber, setSerialNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [factory, setFactory] = useState('');
  const [department, setDepartment] = useState('');
  const [productionLine, setProductionLine] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [commissioningDate, setCommissioningDate] = useState('');
  const [machineType, setMachineType] = useState<MachineType>('Vertical Machining Center');
  const [controllerType, setControllerType] = useState<ControllerType>('FANUC');
  const [controllerModel, setControllerModel] = useState('');
  const [controllerSerialNumber, setControllerSerialNumber] = useState('');
  const [machineConfiguration, setMachineConfiguration] = useState('');
  const [softwareFirmwareVersion, setSoftwareFirmwareVersion] = useState('');
  const [electricalSpecs, setElectricalSpecs] = useState('');
  const [operatingStatus, setOperatingStatus] = useState<MachineStatus>('running');
  const [warrantyStartDate, setWarrantyStartDate] = useState('');
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [serviceContractDetails, setServiceContractDetails] = useState('');
  const [maintenanceFrequency, setMaintenanceFrequency] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [responsibleTechnician, setResponsibleTechnician] = useState('');
  const [machinePhotoUrl, setMachinePhotoUrl] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingMachine) {
      setMachineId(existingMachine.machineId);
      setMachineName(existingMachine.machineName);
      setModel(existingMachine.model);
      setManufacturer(existingMachine.manufacturer);
      setSerialNumber(existingMachine.serialNumber);
      setCustomerId(existingMachine.customerId);
      setCustomerName(existingMachine.customerName);
      setCustomerLocation(existingMachine.customerLocation);
      setFactory(existingMachine.factory);
      setDepartment(existingMachine.department);
      setProductionLine(existingMachine.productionLine);
      setInstallationDate(existingMachine.installationDate);
      setCommissioningDate(existingMachine.commissioningDate);
      setMachineType(existingMachine.machineType);
      setControllerType(existingMachine.controllerType);
      setControllerModel(existingMachine.controllerModel);
      setControllerSerialNumber(existingMachine.controllerSerialNumber);
      setMachineConfiguration(existingMachine.machineConfiguration);
      setSoftwareFirmwareVersion(existingMachine.softwareFirmwareVersion);
      setElectricalSpecs(existingMachine.electricalSpecs);
      setOperatingStatus(existingMachine.operatingStatus);
      setWarrantyStartDate(existingMachine.warrantyStartDate);
      setWarrantyExpiryDate(existingMachine.warrantyExpiryDate);
      setServiceContractDetails(existingMachine.serviceContractDetails);
      setMaintenanceFrequency(existingMachine.maintenanceFrequency);
      setResponsibleTechnician(existingMachine.responsibleTechnician);
      setMachinePhotoUrl(existingMachine.machinePhotoUrl || '');
      setAdditionalNotes(existingMachine.additionalNotes || '');
    } else {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setMachineId(`MC-CNC-${randomNum}`);
      setMachineName('DNM 5700 II - Bay');
      setModel('DNM 5700 II');
      setManufacturer('DN Solutions');
      setSerialNumber(`MV0041-${randomNum}`);
      const defCust = customers[0];
      if (defCust) {
        setCustomerId(defCust.id);
        setCustomerName(defCust.name);
        setCustomerLocation(defCust.address);
        setFactory(defCust.factories[0]?.name || 'Plant 1');
      }
      setDepartment('Machining & Tooling');
      setProductionLine('Precision Line 1');
      setInstallationDate(new Date().toISOString().split('T')[0]);
      setCommissioningDate(new Date().toISOString().split('T')[0]);
      setControllerModel('FANUC 0i-MF Plus');
      setControllerSerialNumber(`F0i-${randomNum}`);
      setMachineConfiguration('BT40 / 12,000 RPM Spindle / 30 ATC / CTS 20 Bar');
      setSoftwareFirmwareVersion('V02.14.00');
      setElectricalSpecs('380V-415V 3-Phase 50/60Hz 35kVA');
      setWarrantyStartDate(new Date().toISOString().split('T')[0]);
      // +2 years default
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 2);
      setWarrantyExpiryDate(exp.toISOString().split('T')[0]);
      setServiceContractDetails('DN Solutions 2-Year OEM Comprehensive Package');
      setResponsibleTechnician(users[2]?.name || 'Elena Rostova');
      setMachinePhotoUrl('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80');
      setAdditionalNotes('');
    }
  }, [existingMachine, isOpen]);

  const handleCustomerSelect = (cId: string) => {
    const cust = customers.find(c => c.id === cId);
    if (cust) {
      setCustomerId(cust.id);
      setCustomerName(cust.name);
      setCustomerLocation(cust.address);
      if (cust.factories && cust.factories.length > 0) {
        setFactory(cust.factories[0].name);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId.trim() || !machineName.trim() || !serialNumber.trim()) {
      setError('Machine ID, Name, and Serial Number are required.');
      return;
    }
    setError('');

    const machine: Machine = {
      id: existingMachine?.id || `MCH-${Date.now()}`,
      machineId,
      machineName,
      model,
      manufacturer,
      serialNumber,
      customerId,
      customerName,
      customerLocation,
      factory,
      department,
      productionLine,
      installationDate,
      commissioningDate,
      machineType,
      controllerType,
      controllerModel,
      controllerSerialNumber,
      machineConfiguration,
      softwareFirmwareVersion,
      electricalSpecs,
      operatingStatus,
      warrantyStartDate,
      warrantyExpiryDate,
      serviceContractDetails,
      maintenanceFrequency,
      responsibleTechnician,
      machinePhotoUrl,
      additionalNotes,
      createdAt: existingMachine?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(machine);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading-industrial font-bold text-base sm:text-lg text-white uppercase tracking-wider">
                {existingMachine ? `Edit Machine: ${existingMachine.machineId}` : 'Register New CNC Machine'}
              </h2>
              <p className="text-xs text-slate-400">
                Complete asset record, controller specifications & warranty profile
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Section 1: Identification */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              1. Asset Identification & Model
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Machine ID *</label>
                <input
                  type="text"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  placeholder="e.g. MC-VMC-01"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-blue-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Machine Name *</label>
                <input
                  type="text"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  placeholder="e.g. DNM 5700 II - Bay A1"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Machine Model *</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. DNM 5700 II, PUMA GT2600"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Machine Serial Number *</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. MV0041-928104"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Machine Type</label>
                <select
                  value={machineType}
                  onChange={(e) => setMachineType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Vertical Machining Center">Vertical Machining Center</option>
                  <option value="Horizontal Machining Center">Horizontal Machining Center</option>
                  <option value="CNC Turning Center">CNC Turning Center</option>
                  <option value="5-Axis Machining Center">5-Axis Machining Center</option>
                  <option value="Multi-Tasking Mill-Turn">Multi-Tasking Mill-Turn</option>
                  <option value="Boring Mill">Boring Mill</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Customer & Plant Location */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              2. Customer Location & Production Assignment
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Customer / Company</label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Factory / Plant</label>
                <input
                  type="text"
                  value={factory}
                  onChange={(e) => setFactory(e.target.value)}
                  placeholder="e.g. Plant 1 - Main Facility"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Milling & Precision"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Production Line</label>
                <input
                  type="text"
                  value={productionLine}
                  onChange={(e) => setProductionLine(e.target.value)}
                  placeholder="e.g. Bulkhead Cell 2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Installation Date</label>
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Commissioning Date</label>
                <input
                  type="date"
                  value={commissioningDate}
                  onChange={(e) => setCommissioningDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: CNC Controller & Hardware Specs */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              3. CNC Controller & Electrical Configuration
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-semibold">CNC Controller Type *</label>
                <select
                  value={controllerType}
                  onChange={(e) => setControllerType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="FANUC">FANUC</option>
                  <option value="Mitsubishi">Mitsubishi</option>
                  <option value="Siemens">Siemens</option>
                  <option value="Heidenhain">Heidenhain</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Controller Model</label>
                <input
                  type="text"
                  value={controllerModel}
                  onChange={(e) => setControllerModel(e.target.value)}
                  placeholder="e.g. FANUC 0i-MF Plus / Siemens 840D sl"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Controller Serial No.</label>
                <input
                  type="text"
                  value={controllerSerialNumber}
                  onChange={(e) => setControllerSerialNumber(e.target.value)}
                  placeholder="e.g. E235-90812-B"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Machine Configuration</label>
                <input
                  type="text"
                  value={machineConfiguration}
                  onChange={(e) => setMachineConfiguration(e.target.value)}
                  placeholder="e.g. BT40 / 12,000 RPM / 30 ATC / CTS 20 Bar"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Software / Firmware Version</label>
                <input
                  type="text"
                  value={softwareFirmwareVersion}
                  onChange={(e) => setSoftwareFirmwareVersion(e.target.value)}
                  placeholder="e.g. B0F4-0018-02.10"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Electrical Specifications</label>
              <input
                type="text"
                value={electricalSpecs}
                onChange={(e) => setElectricalSpecs(e.target.value)}
                placeholder="e.g. 380-415V 3-Phase 50/60Hz, 38kVA, Full Load 58A"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          {/* Section 4: Operational Status & Warranty */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              4. Operations, Maintenance & Warranty
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Operating Status</label>
                <select
                  value={operatingStatus}
                  onChange={(e) => setOperatingStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="running">Running (Active)</option>
                  <option value="idle">Idle</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="breakdown">Breakdown</option>
                  <option value="decommissioned">Decommissioned</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Warranty Start Date</label>
                <input
                  type="date"
                  value={warrantyStartDate}
                  onChange={(e) => setWarrantyStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Warranty Expiry Date</label>
                <input
                  type="date"
                  value={warrantyExpiryDate}
                  onChange={(e) => setWarrantyExpiryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Maintenance Frequency</label>
                <select
                  value={maintenanceFrequency}
                  onChange={(e) => setMaintenanceFrequency(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Responsible Lead Technician</label>
                <select
                  value={responsibleTechnician}
                  onChange={(e) => setResponsibleTechnician(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Service Contract Details</label>
              <input
                type="text"
                value={serviceContractDetails}
                onChange={(e) => setServiceContractDetails(e.target.value)}
                placeholder="e.g. DN Solutions Full Platinum Care SLA #DNS-2024"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Machine Photo URL</label>
              <input
                type="text"
                value={machinePhotoUrl}
                onChange={(e) => setMachinePhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Additional Operational Notes</label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Special tooling notes, critical accuracy requirements, custom macro programs..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Machine</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
