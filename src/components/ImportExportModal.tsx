import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw,
  Layers,
  FileCheck,
  HelpCircle,
  Database
} from 'lucide-react';
import { BreakdownTicket, User } from '../types';
import { 
  downloadCSVTemplate, 
  parseSpreadsheetFile, 
  autoSuggestMapping, 
  validateImportRows, 
  SUPPORTED_TARGET_FIELDS, 
  ColumnMapping, 
  ImportValidationResult 
} from '../services/exportImport';
import { storageService } from '../services/storage';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted: () => void;
  currentUser: User;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onImportCompleted,
  currentUser
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validationResults, setValidationResults] = useState<ImportValidationResult[]>([]);
  const [importSummary, setImportSummary] = useState<{ importedCount: number; skippedCount: number; errorsCount: number } | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setFile(selectedFile);
      const parsed = await parseSpreadsheetFile(selectedFile);
      if (parsed.headers.length === 0) {
        alert('File appears to be empty or has no recognizable header row.');
        return;
      }

      setHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Auto-suggest mappings
      const initialMap = autoSuggestMapping(parsed.headers);
      setMapping(initialMap);
      setStep('mapping');
    } catch (err: any) {
      alert(`Error reading spreadsheet: ${err.message}`);
    }
  };

  const handleProceedToPreview = () => {
    const existingTickets = storageService.getTickets();
    const results = validateImportRows(rawRows, mapping, existingTickets);
    setValidationResults(results);
    setStep('preview');
  };

  const handleExecuteImport = () => {
    let importedCount = 0;
    let skippedCount = 0;
    let errorsCount = 0;

    validationResults.forEach(res => {
      if (!res.isValid) {
        errorsCount++;
        return;
      }

      if (res.isDuplicate && skipDuplicates) {
        skippedCount++;
        return;
      }

      storageService.saveTicket(res.mappedTicket as BreakdownTicket);
      importedCount++;
    });

    storageService.logAction(
      'IMPORT',
      'BREAKDOWN_LOG',
      file?.name || 'SPREADSHEET',
      `Imported ${importedCount} records (${skippedCount} duplicates skipped, ${errorsCount} errors)`
    );

    setImportSummary({ importedCount, skippedCount, errorsCount });
    setStep('result');
    onImportCompleted();
  };

  const handleDatabaseBackupDownload = () => {
    const json = storageService.exportFullDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DN_Solutions_Hub_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleDatabaseRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const content = loadEvt.target?.result as string;
      const res = storageService.importFullDatabase(content);
      if (res.success) {
        alert('Database restored successfully from backup!');
        onImportCompleted();
        onClose();
      } else {
        alert(`Restore failed: ${res.message}`);
      }
    };
    reader.readAsText(f);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading-industrial font-bold text-base sm:text-lg text-white uppercase tracking-wider">
                Import Historical Excel & CSV Records
              </h2>
              <p className="text-xs text-slate-400">
                11-step validation wizard, field mapping, duplicate detection & full database backups
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper */}
        <div className="flex items-center justify-around px-6 py-2 bg-slate-950/40 border-b border-slate-800 text-xs shrink-0 font-medium">
          <span className={step === 'upload' ? 'text-blue-400 font-bold' : 'text-slate-400'}>1. Upload File</span>
          <span>&rarr;</span>
          <span className={step === 'mapping' ? 'text-blue-400 font-bold' : 'text-slate-400'}>2. Map Columns</span>
          <span>&rarr;</span>
          <span className={step === 'preview' ? 'text-blue-400 font-bold' : 'text-slate-400'}>3. Validate & Preview</span>
          <span>&rarr;</span>
          <span className={step === 'result' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>4. Import Report</span>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-300">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center space-y-4 bg-slate-950/40 transition-colors">
                <FileSpreadsheet className="w-12 h-12 text-blue-400 mx-auto" />
                <div>
                  <h3 className="font-bold text-white text-base">Select Excel (.XLSX) or CSV Spreadsheet</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload your maintenance records. Column headers will be read automatically.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold cursor-pointer shadow-md transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Browse Excel / CSV File</span>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Template & Full Database Backup tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-white block">Download Standard CSV Template</span>
                  <p className="text-slate-400 text-[11px]">
                    Preformatted CSV containing all 16 supported import headers and sample row.
                  </p>
                  <button
                    onClick={downloadCSVTemplate}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download CSV Template</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-white block">Full Database Backup (JSON)</span>
                  <p className="text-slate-400 text-[11px]">
                    Export or restore complete system data including machines, tickets, and parts.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDatabaseBackupDownload}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 text-xs"
                    >
                      <Database className="w-3.5 h-3.5 text-blue-400" />
                      <span>Export DB</span>
                    </button>
                    <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 text-xs cursor-pointer">
                      <span>Restore DB</span>
                      <input type="file" accept=".json" onChange={handleDatabaseRestore} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs">
                File: <strong className="text-white">{file?.name}</strong> • Loaded <strong className="text-white">{rawRows.length}</strong> rows. Map your spreadsheet columns to the application fields:
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Application Field</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Mapped Spreadsheet Column</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {SUPPORTED_TARGET_FIELDS.map(field => {
                      const currentMappedHeader = (mapping as any)[field.key] || '';
                      return (
                        <tr key={field.key} className="hover:bg-slate-850/50">
                          <td className="p-2.5">
                            <span className="font-semibold text-white block">{field.label}</span>
                            <span className="text-[10px] text-slate-400">{field.hint}</span>
                          </td>
                          <td className="p-2.5">
                            {field.required ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                                Required
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Optional</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <select
                              value={currentMappedHeader}
                              onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1 text-xs text-white ${
                                field.required && !currentMappedHeader ? 'border-amber-600' : 'border-slate-700'
                              }`}
                            >
                              <option value="">-- Do Not Map --</option>
                              {headers.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  &larr; Back
                </button>
                <button
                  onClick={handleProceedToPreview}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <span>Preview & Validate Rows</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Total Rows</span>
                  <span className="text-lg font-bold font-mono text-white">{validationResults.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Valid Rows</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {validationResults.filter(r => r.isValid && (!r.isDuplicate || !skipDuplicates)).length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Duplicates Detected</span>
                  <span className="text-lg font-bold font-mono text-amber-400">
                    {validationResults.filter(r => r.isDuplicate).length}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">Skip Duplicate Tickets</span>
                  <span className="text-slate-400 text-[11px]">Prevents overwriting existing database records silently</span>
                </div>
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                />
              </div>

              {/* Rows List */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Ticket #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Machine ID</th>
                      <th className="p-2">Fault Category</th>
                      <th className="p-2">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {validationResults.map(res => (
                      <tr key={res.rowNumber} className={res.isValid ? 'hover:bg-slate-850/50' : 'bg-red-950/20'}>
                        <td className="p-2 font-mono text-slate-400">{res.rowNumber}</td>
                        <td className="p-2 font-mono text-blue-400 font-semibold">{res.mappedTicket.ticketNumber}</td>
                        <td className="p-2 font-mono">{res.mappedTicket.breakdownDate}</td>
                        <td className="p-2">{res.mappedTicket.machineId}</td>
                        <td className="p-2 text-slate-300">{res.mappedTicket.faultCategory}</td>
                        <td className="p-2">
                          {res.isValid ? (
                            res.isDuplicate ? (
                              <span className="text-amber-400 font-semibold text-[10px]">Duplicate (Skip)</span>
                            ) : (
                              <span className="text-emerald-400 font-semibold text-[10px]">Valid OK</span>
                            )
                          ) : (
                            <span className="text-red-400 font-semibold text-[10px]">{res.errors.join(', ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  &larr; Back to Mapping
                </button>
                <button
                  onClick={handleExecuteImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Execute Import Now</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: RESULT REPORT */}
          {step === 'result' && importSummary && (
            <div className="p-8 text-center space-y-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div>
                <h3 className="font-heading-industrial font-bold text-lg text-white">Import Execution Completed</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Historical machine fix records have been loaded into the active operations database.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-center pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Imported</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">{importSummary.importedCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Skipped</span>
                  <span className="text-xl font-bold font-mono text-amber-400">{importSummary.skippedCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Failed</span>
                  <span className="text-xl font-bold font-mono text-rose-400">{importSummary.errorsCount}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow"
                >
                  Close Wizard & View Records
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
