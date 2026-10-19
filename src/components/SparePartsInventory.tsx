import React, { useState } from 'react';
import { 
  PackageSearch, 
  Plus, 
  AlertTriangle, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  RotateCcw, 
  Search, 
  Filter, 
  X,
  Layers,
  History,
  CheckCircle2
} from 'lucide-react';
import { SparePart, InventoryTransaction, User } from '../types';
import { storageService } from '../services/storage';

interface SparePartsInventoryProps {
  currentUser: User;
}

export const SparePartsInventory: React.FC<SparePartsInventoryProps> = ({ currentUser }) => {
  const [parts, setParts] = useState<SparePart[]>(storageService.getSpareParts());
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(storageService.getTransactions());
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Stock Adjustment Modal
  const [adjustPart, setAdjustPart] = useState<SparePart | null>(null);
  const [adjustType, setAdjustType] = useState<'issue' | 'return' | 'restock' | 'adjustment'>('restock');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustRef, setAdjustRef] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustError, setAdjustError] = useState('');

  // New Part Modal
  const [showNewPartModal, setShowNewPartModal] = useState(false);
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newCategory, setNewCategory] = useState<SparePart['category']>('Electrical / CNC');
  const [newManufacturer, setNewManufacturer] = useState('FANUC Corporation');
  const [newQty, setNewQty] = useState(5);
  const [newMinStock, setNewMinStock] = useState(2);
  const [newLocation, setNewLocation] = useState('Aisle A, Bin 01');
  const [newCost, setNewCost] = useState(250);
  const [newSupplier, setNewSupplier] = useState('DN Solutions NA Parts');

  const reloadData = () => {
    setParts(storageService.getSpareParts());
    setTransactions(storageService.getTransactions());
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustPart || adjustQty <= 0) return;

    const res = storageService.adjustPartStock(
      adjustPart.id,
      adjustType,
      adjustQty,
      adjustRef || 'Manual shop-floor adjustment',
      adjustNotes,
    );

    if (!res.success) {
      setAdjustError(res.error || 'Failed to adjust stock');
      return;
    }

    setAdjustPart(null);
    setAdjustError('');
    setAdjustQty(1);
    setAdjustRef('');
    setAdjustNotes('');
    reloadData();
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartNumber || !newPartName) return;

    const part: SparePart = {
      id: `PRT-${Date.now()}`,
      partNumber: newPartNumber,
      partName: newPartName,
      category: newCategory,
      machineCompatibility: ['DNM 5700 II', 'PUMA GT2600'],
      manufacturer: newManufacturer,
      quantityAvailable: newQty,
      minStockLevel: newMinStock,
      storageLocation: newLocation,
      unitCost: newCost,
      supplier: newSupplier,
      leadTimeDays: 3,
      warrantyPeriodMonths: 12,
      partCondition: 'New'
    };

    storageService.saveSparePart(part);
    setShowNewPartModal(false);
    reloadData();
  };

  const filteredParts = parts.filter(p => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        p.partNumber.toLowerCase().includes(q) ||
        p.partName.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q) ||
        p.storageLocation.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  const lowStockCount = parts.filter(p => p.quantityAvailable <= p.minStockLevel).length;
  const totalValuation = parts.reduce((sum, p) => sum + (p.quantityAvailable * p.unitCost), 0);

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading-industrial font-bold text-lg sm:text-xl text-white tracking-wide">
              CNC SPARE PARTS INVENTORY & WAREHOUSE
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-950 text-rose-400 border border-rose-800/60 uppercase">
              Bin Management
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reorder thresholds, stock issuance on breakdown tickets, transaction audit trail, and valuation.
          </p>
        </div>

        <button
          onClick={() => setShowNewPartModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Spare Part</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Catalog SKUs</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white">{parts.length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Low / Out of Stock</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400">{lowStockCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Inventory Valuation</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">${totalValuation.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Recent Transactions</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400">{transactions.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Parts Catalog & Stock Levels ({parts.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'transactions'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Inventory Transaction History ({transactions.length})
        </button>
      </div>

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search part number, description, bin location..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="all">All Categories</option>
              <option value="Electrical / CNC">Electrical / CNC</option>
              <option value="Hydraulic">Hydraulic</option>
              <option value="Pneumatic">Pneumatic</option>
              <option value="Mechanical / Spindle">Mechanical / Spindle</option>
              <option value="Coolant & Lube">Coolant & Lube</option>
              <option value="Sensors & Switches">Sensors & Switches</option>
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Part Number</th>
                    <th className="p-3">Part Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 text-center">Available Stock</th>
                    <th className="p-3 text-right">Unit Cost</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredParts.map(part => {
                    const isLow = part.quantityAvailable <= part.minStockLevel;

                    return (
                      <tr key={part.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-blue-400 whitespace-nowrap">
                          {part.partNumber}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-white block">{part.partName}</span>
                          <span className="text-[11px] text-slate-400">{part.manufacturer} • Mfr</span>
                        </td>
                        <td className="p-3 text-slate-300">{part.category}</td>
                        <td className="p-3 font-mono text-slate-300 text-[11px]">{part.storageLocation}</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1.5 font-mono font-bold">
                            <span className={`text-sm ${isLow ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}`}>
                              {part.quantityAvailable}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">/ min {part.minStockLevel}</span>
                          </div>
                          {isLow && (
                            <span className="block text-[9px] font-bold text-rose-400 uppercase tracking-tight">
                              REORDER
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-200">${part.unitCost}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setAdjustPart(part);
                              setAdjustType('issue');
                              setAdjustQty(1);
                              setAdjustError('');
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded text-[11px] font-semibold border border-slate-700"
                          >
                            Issue / Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS AUDIT */}
      {activeTab === 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Part Number</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3">Reference / Ticket</th>
                  <th className="p-3">Performed By</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-850/60">
                    <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(txn.date).toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        txn.type === 'issue'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : txn.type === 'restock'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-blue-400 font-semibold">{txn.partNumber}</td>
                    <td className="p-3 text-center font-mono font-bold text-white">{txn.quantity}</td>
                    <td className="p-3 text-slate-300">{txn.ticketNumber || txn.reference}</td>
                    <td className="p-3 text-slate-400">{txn.performedBy}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{txn.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustPart && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="font-heading-industrial font-bold text-white text-sm block">
                  Inventory Stock Adjustment
                </span>
                <span className="text-[11px] text-blue-400 font-mono">
                  {adjustPart.partNumber} - {adjustPart.partName}
                </span>
              </div>
              <button onClick={() => setAdjustPart(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="p-2.5 rounded bg-red-950/80 border border-red-800 text-xs text-red-300">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Current Available:</span>
                <strong className="font-mono text-emerald-400 text-sm">{adjustPart.quantityAvailable} units</strong>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Action Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="issue">Issue to Machine Repair (-)</option>
                  <option value="restock">Restock / Purchase Order (+)</option>
                  <option value="return">Return to Store (+)</option>
                  <option value="adjustment">Cycle Count Exact Adjustment (=)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Reference (PO # / Ticket #)</label>
                <input
                  type="text"
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  placeholder="e.g. PO-99120 or TKT-2026-0101"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Reason for issuance or inventory replenishment..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustPart(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Part Modal */}
      {showNewPartModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-heading-industrial font-bold text-white text-sm">
                Add New Spare Part SKU to Catalog
              </span>
              <button onClick={() => setShowNewPartModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePart} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Part Number *</label>
                  <input
                    type="text"
                    value={newPartNumber}
                    onChange={(e) => setNewPartNumber(e.target.value)}
                    placeholder="e.g. A860-2150-T101"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Electrical / CNC">Electrical / CNC</option>
                    <option value="Hydraulic">Hydraulic</option>
                    <option value="Pneumatic">Pneumatic</option>
                    <option value="Mechanical / Spindle">Mechanical / Spindle</option>
                    <option value="Coolant & Lube">Coolant & Lube</option>
                    <option value="Sensors & Switches">Sensors & Switches</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Part Name / Description *</label>
                <input
                  type="text"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="e.g. Fanuc Alpha Spindle Pulse Coder"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Min Stock Level</label>
                  <input
                    type="number"
                    min="1"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Unit Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Bin Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Aisle B, Shelf 02"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPartModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Save Spare Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
