import React from 'react';
import { X, Printer, QrCode, Cpu, ShieldCheck } from 'lucide-react';
import { Machine } from '../types';

interface MachineQRPlateModalProps {
  isOpen: boolean;
  machine: Machine | null;
  onClose: () => void;
  onScanThisMachine?: (machine: Machine) => void;
}

export const MachineQRPlateModal: React.FC<MachineQRPlateModalProps> = ({
  isOpen,
  machine,
  onClose,
  onScanThisMachine
}) => {
  if (!isOpen || !machine) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate SVG QR code blocks deterministically based on machineId string
  const generateQRCodeSvg = (text: string) => {
    // 21x21 grid for QR code version 1 pattern simulation with authentic finder patterns
    const size = 21;
    const grid: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

    // Finder patterns top-left, top-right, bottom-left
    const addFinder = (r: number, c: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (
            i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)
          ) {
            grid[r + i][c + j] = true;
          }
        }
      }
    };

    addFinder(0, 0);
    addFinder(0, size - 7);
    addFinder(size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Hash text into data area
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    let seed = Math.abs(hash);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8) ||
          r === 6 || c === 6
        ) {
          continue; // skip finder & timing
        }
        seed = (seed * 9301 + 49297) % 233280;
        grid[r][c] = (seed / 233280) > 0.45;
      }
    }

    return grid;
  };

  const qrGrid = generateQRCodeSvg(machine.machineId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            <span className="font-heading-industrial font-bold text-white text-sm">
              Machine Identification Plate (QR)
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Industrial Nameplate Card (Printable) */}
        <div className="p-4 rounded-xl bg-white text-slate-900 border-4 border-slate-300 shadow-xl space-y-3 font-mono print:border-black">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
            <div>
              <span className="font-black text-base tracking-wider block">DN SOLUTIONS</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-700">CNC Machine Identification</span>
            </div>
            <div className="text-right text-[10px]">
              <span className="font-bold text-blue-900 block">{machine.model}</span>
              <span>{machine.manufacturer}</span>
            </div>
          </div>

          {/* QR Code and Specs */}
          <div className="flex items-center gap-4">
            {/* High-res rendered SVG QR Code */}
            <div className="p-1.5 bg-white border-2 border-slate-900 rounded shrink-0 shadow-sm">
              <svg viewBox="0 0 21 21" className="w-28 h-28 shape-rendering-crispEdges">
                {qrGrid.map((row, r) =>
                  row.map((active, c) =>
                    active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#000000" /> : null
                  )
                )}
              </svg>
            </div>

            <div className="text-[10px] space-y-1 flex-1 leading-tight">
              <div>
                <span className="text-slate-500 block text-[8px] uppercase font-bold">Asset ID</span>
                <span className="font-black text-sm text-slate-950 font-mono">{machine.machineId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px] uppercase font-bold">Serial Number</span>
                <span className="font-bold text-slate-900">{machine.serialNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px] uppercase font-bold">CNC Controller</span>
                <span className="font-semibold text-slate-900">{machine.controllerType} ({machine.controllerModel})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px] uppercase font-bold">Location</span>
                <span className="text-slate-900 truncate block">{machine.factory} • {machine.productionLine}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-400 text-[8px] text-slate-600 flex justify-between">
            <span>Commissioned: {machine.commissioningDate || '2024'}</span>
            <span>Scan with DN Solutions Operations Hub</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-between no-print text-xs">
          {onScanThisMachine && (
            <button
              onClick={() => onScanThisMachine(machine)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Simulate Scan</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Nameplate Tag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
