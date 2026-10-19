import React, { useState } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Wrench, 
  ShieldAlert, 
  UserCheck, 
  Calendar,
  X,
  FileCheck
} from 'lucide-react';
import { PreventiveMaintenanceTask, PMInterval, Machine, User } from '../types';
import { storageService } from '../services/storage';

interface PreventiveMaintenanceProps {
  currentUser: User;
}

export const PreventiveMaintenance: React.FC<PreventiveMaintenanceProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<PreventiveMaintenanceTask[]>(storageService.getPMTasks());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTaskToExecute, setSelectedTaskToExecute] = useState<PreventiveMaintenanceTask | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Execution modal state
  const [checklistState, setChecklistState] = useState<{ id: string; completed: boolean }[]>([]);
  const [inspectionResults, setInspectionResults] = useState('');
  const [technicianRemarks, setTechnicianRemarks] = useState('');

  // New task form state
  const machines = storageService.getMachines();
  const [newMachineId, setNewMachineId] = useState(machines[0]?.machineId || '');
  const [newTaskName, setNewTaskName] = useState('');
  const [newCategory, setNewCategory] = useState<PreventiveMaintenanceTask['category']>('Hydraulic');
  const [newInterval, setNewInterval] = useState<PMInterval>('Monthly');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignedTech, setNewAssignedTech] = useState(currentUser.name);
  const [newRequiredTools, setNewRequiredTools] = useState('');
  const [newRequiredParts, setNewRequiredParts] = useState('');
  const [newPrecautions, setNewPrecautions] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('Check fluid levels\nClean air filters\nTest emergency switches');

  const reloadTasks = () => {
    setTasks(storageService.getPMTasks());
  };

  const openExecutionModal = (task: PreventiveMaintenanceTask) => {
    setSelectedTaskToExecute(task);
    setChecklistState(task.checklist.map(c => ({ id: c.id, completed: c.completed })));
    setInspectionResults(task.inspectionResults || '');
    setTechnicianRemarks(task.technicianRemarks || '');
  };

  const handleCompleteExecution = () => {
    if (!selectedTaskToExecute) return;
    storageService.completePMTask(selectedTaskToExecute.id, inspectionResults, technicianRemarks);
    setSelectedTaskToExecute(null);
    reloadTasks();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const m = machines.find(item => item.machineId === newMachineId);
    if (!m || !newTaskName) return;

    const checklistItems = newChecklistText.split('\n').filter(t => t.trim()).map((text, i) => ({
      id: `CHK-${Date.now()}-${i}`,
      task: text.trim(),
      completed: false
    }));

    const newTask: PreventiveMaintenanceTask = {
      id: `PM-${Date.now()}`,
      machineId: m.machineId,
      machineName: m.machineName,
      taskName: newTaskName,
      category: newCategory,
      interval: newInterval,
      scheduledDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      assignedTechnician: newAssignedTech,
      requiredTools: newRequiredTools,
      requiredSpareParts: newRequiredParts,
      safetyPrecautions: newPrecautions || 'Standard LOTO disconnect and safety glasses.',
      checklist: checklistItems,
      status: 'Scheduled'
    };

    storageService.savePMTask(newTask);
    setShowNewTaskModal(false);
    setNewTaskName('');
    reloadTasks();
  };

  const filteredTasks = tasks.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const scheduledCount = tasks.filter(t => t.status === 'Scheduled').length;
  const overdueCount = tasks.filter(t => t.status === 'Overdue').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              PREVENTIVE MAINTENANCE (PM) SCHEDULING
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
              Reliability Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Recurrent maintenance schedules, safety checklists, tool requisitions, and post-service inspection verification.
          </p>
        </div>

        <button
          onClick={() => setShowNewTaskModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule PM Task</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Tasks</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white">{tasks.length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Scheduled Upcoming</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400">{scheduledCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Overdue Action Needed</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400">{overdueCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Completed Successfully</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{completedCount}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400">Filter status:</span>
        {['all', 'Scheduled', 'Overdue', 'Completed'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Task List Cards */}
      <div className="space-y-3">
        {filteredTasks.map(task => {
          const isOverdue = task.status === 'Overdue';
          const isCompleted = task.status === 'Completed';

          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl bg-slate-900 border transition-all ${
                isOverdue 
                  ? 'border-rose-600/70 shadow-lg shadow-rose-950/20' 
                  : isCompleted 
                  ? 'border-emerald-800/40 bg-slate-900/80' 
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-blue-400 font-bold text-xs">{task.machineId}</span>
                    <span className="text-slate-400 text-xs font-semibold">• {task.machineName}</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-950 text-slate-300 border border-slate-800">
                      {task.interval}
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-950 text-slate-300 border border-slate-800">
                      {task.category}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                      isCompleted 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : isOverdue 
                        ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse' 
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <h3 className="font-heading-industrial font-bold text-sm text-white">{task.taskName}</h3>

                  <div className="text-xs text-slate-400 space-y-0.5 pt-0.5">
                    <p><strong className="text-slate-300">Safety:</strong> {task.safetyPrecautions}</p>
                    <p><strong className="text-slate-300">Tools & Parts:</strong> {task.requiredTools || 'Standard toolset'} {task.requiredSpareParts ? `• Parts: ${task.requiredSpareParts}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right text-xs">
                    <span className="text-[10px] text-slate-400 block font-mono">Due Date</span>
                    <span className={`font-mono font-bold ${isOverdue ? 'text-rose-400' : 'text-slate-200'}`}>
                      {task.dueDate}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Tech: {task.assignedTechnician}</span>
                  </div>

                  {!isCompleted ? (
                    <button
                      onClick={() => openExecutionModal(task)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Execute & Sign</span>
                    </button>
                  ) : (
                    <div className="text-right text-[11px] text-emerald-400 font-mono">
                      <span>Completed by {task.completedBy}</span>
                      {task.nextDueDate && <div className="text-slate-400">Next due: {task.nextDueDate}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Modal */}
      {selectedTaskToExecute && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="font-heading-industrial font-bold text-white text-sm block">
                  Execute Preventive Maintenance Checklist
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedTaskToExecute.machineId} • {selectedTaskToExecute.taskName}
                </span>
              </div>
              <button onClick={() => setSelectedTaskToExecute(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <span className="font-semibold text-slate-300 block">Mandatory Inspection Items:</span>
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                {selectedTaskToExecute.checklist.map((item, idx) => (
                  <label key={item.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState[idx]?.completed || false}
                      onChange={(e) => {
                        const copy = [...checklistState];
                        copy[idx] = { ...copy[idx], completed: e.target.checked };
                        setChecklistState(copy);
                      }}
                      className="w-4 h-4 mt-0.5 rounded text-emerald-600 bg-slate-900 border-slate-700"
                    />
                    <span className="text-slate-200">{item.task}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Inspection Results & Measurements</label>
                <textarea
                  rows={2}
                  value={inspectionResults}
                  onChange={(e) => setInspectionResults(e.target.value)}
                  placeholder="e.g. Lube pressure tested at 14.8 Bar, oil clear without swarf, filter replaced..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Technician Remarks & Sign-off</label>
                <input
                  type="text"
                  value={technicianRemarks}
                  onChange={(e) => setTechnicianRemarks(e.target.value)}
                  placeholder="e.g. All checks passed. Ready for production."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskToExecute(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteExecution}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Certify & Sign Off</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-heading-industrial font-bold text-white text-sm">
                Schedule New PM Maintenance Task
              </span>
              <button onClick={() => setShowNewTaskModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Machine</label>
                <select
                  value={newMachineId}
                  onChange={(e) => setNewMachineId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.machineId}>
                      {m.machineId} - {m.machineName} ({m.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Task Name *</label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="e.g. Monthly Hydraulic Filter Replacement & Contamination Check"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Interval</label>
                  <select
                    value={newInterval}
                    onChange={(e) => setNewInterval(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Operating-Hour-Based">Operating-Hour-Based</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Due Date *</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Checklist Items (One per line)</label>
                <textarea
                  rows={3}
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
