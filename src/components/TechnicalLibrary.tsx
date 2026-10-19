import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  FileText, 
  Download, 
  Plus, 
  Cpu, 
  Tag, 
  ExternalLink, 
  Clock, 
  X,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { TechnicalDocument, ControllerType, User } from '../types';
import { storageService } from '../services/storage';

interface TechnicalLibraryProps {
  currentUser: User;
}

export const TechnicalLibrary: React.FC<TechnicalLibraryProps> = ({ currentUser }) => {
  const [docs, setDocs] = useState<TechnicalDocument[]>(storageService.getTechnicalDocs());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [controllerFilter, setControllerFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New doc form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TechnicalDocument['category']>('alarm_manual');
  const [newController, setNewController] = useState<ControllerType>('FANUC');
  const [newMachineModel, setNewMachineModel] = useState('DNM 5700 II');
  const [newAlarmCode, setNewAlarmCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('Fanuc, Alarm, Troubleshooting');

  const reloadDocs = () => {
    setDocs(storageService.getTechnicalDocs());
  };

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const doc: TechnicalDocument = {
      id: `DOC-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      controllerType: newController,
      machineModel: newMachineModel,
      alarmCode: newAlarmCode,
      description: newDescription,
      fileName: `${newTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileSize: '3.4 MB',
      tags: newTags.split(',').map(t => t.trim()),
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString()
    };

    storageService.saveTechnicalDoc(doc);
    setShowUploadModal(false);
    setNewTitle('');
    setNewDescription('');
    reloadDocs();
  };

  const filteredDocs = docs.filter(d => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        d.title.toLowerCase().includes(q) ||
        (d.alarmCode && d.alarmCode.toLowerCase().includes(q)) ||
        d.description.toLowerCase().includes(q) ||
        (d.machineModel && d.machineModel.toLowerCase().includes(q)) ||
        d.tags.some(tag => tag.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
    if (controllerFilter !== 'all' && d.controllerType !== controllerFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              CNC TECHNICAL KNOWLEDGE LIBRARY & ALARM CODES
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-blue-400 border border-blue-800/60 uppercase">
              Field Diagnostics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Searchable CNC alarm resolutions, electrical wiring schematics, hydraulic flowcharts, and machine SOPs.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document / Alarm SOP</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search alarm code (e.g. SV0027, EX1012), controller, manual..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          >
            <option value="all">All Document Categories</option>
            <option value="alarm_manual">Alarm Troubleshooting Manuals</option>
            <option value="electrical_schematic">Electrical Schematics & PMC</option>
            <option value="mechanical_drawing">Mechanical & Hydraulic Drawings</option>
            <option value="controller_manual">CNC Controller Operating Guides</option>
            <option value="service_bulletin">DN Solutions Service Bulletins</option>
            <option value="sop">Maintenance Standard SOPs</option>
          </select>

          <select
            value={controllerFilter}
            onChange={(e) => setControllerFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          >
            <option value="all">All Controllers</option>
            <option value="FANUC">FANUC (0i, 31i)</option>
            <option value="Siemens">Siemens SINUMERIK 840D</option>
            <option value="Mitsubishi">Mitsubishi M80</option>
            <option value="Heidenhain">Heidenhain</option>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {doc.alarmCode && (
                    <span className="font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-xs">
                      {doc.alarmCode}
                    </span>
                  )}
                  <span className="font-mono text-xs text-blue-400 font-semibold">{doc.controllerType}</span>
                  {doc.machineModel && (
                    <span className="text-slate-400 text-xs">• {doc.machineModel}</span>
                  )}
                </div>
                <h3 className="font-heading-industrial font-bold text-sm text-white leading-snug">
                  {doc.title}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-slate-400 border border-slate-800 capitalize whitespace-nowrap">
                {doc.category.replace('_', ' ')}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
              {doc.description}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {doc.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">{doc.fileName} ({doc.fileSize})</span>
              <button
                onClick={() => alert(`Simulated downloading document: ${doc.fileName} (${doc.fileSize})`)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-heading-industrial font-bold text-white text-sm">
                Add Technical Guide / Alarm Documentation
              </span>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Document Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. FANUC 0i-MF Alarm SV0027 Spindle Diagnosis Manual"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="alarm_manual">Alarm Manual</option>
                    <option value="electrical_schematic">Electrical Schematic</option>
                    <option value="mechanical_drawing">Mechanical Drawing</option>
                    <option value="controller_manual">Controller Manual</option>
                    <option value="service_bulletin">Service Bulletin</option>
                    <option value="sop">Standard SOP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Controller Type</label>
                  <select
                    value={newController}
                    onChange={(e) => setNewController(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="FANUC">FANUC</option>
                    <option value="Siemens">Siemens</option>
                    <option value="Mitsubishi">Mitsubishi</option>
                    <option value="Heidenhain">Heidenhain</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Alarm Code (Optional)</label>
                  <input
                    type="text"
                    value={newAlarmCode}
                    onChange={(e) => setNewAlarmCode(e.target.value)}
                    placeholder="e.g. SV0027"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Machine Model</label>
                  <input
                    type="text"
                    value={newMachineModel}
                    onChange={(e) => setNewMachineModel(e.target.value)}
                    placeholder="e.g. DNM 5700 II"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Summary & Instructions</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Key troubleshooting steps, pinouts, multimeter checks, and safety warnings..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Save to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
