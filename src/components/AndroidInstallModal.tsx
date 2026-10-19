import React from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  MoreVertical, 
  PlusSquare, 
  WifiOff, 
  QrCode, 
  Camera, 
  HardDriveDownload 
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { storageService } from '../services/storage';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  const handleDownloadOfflineData = () => {
    storageService.downloadBackupJSON();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading-industrial font-bold text-base text-white uppercase tracking-wider">
                  Download & Install on Android
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                DN Solutions Machine Operations Hub Mobile App
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

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-slate-300">
          {/* Status banner */}
          {isInstalled ? (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-white">App is Already Installed!</p>
                <p className="text-[11px] text-emerald-400/90 mt-0.5">
                  You are running the standalone app with full offline cache and shop-floor hardware acceleration.
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Direct 1-Tap Installation Available
                </span>
                <p className="font-bold text-white text-sm mt-0.5">Install to Android Home Screen</p>
                <p className="text-[11px] text-slate-300">Fast install without going through Google Play Store.</p>
              </div>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95 text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Install Now</span>
              </button>
            </div>
          ) : null}

          {/* Android Chrome 2-Step Instructions */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              How to Install on Android (Chrome / Samsung Internet):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-slate-900 text-blue-400 shrink-0 border border-slate-800">
                  <MoreVertical className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Step A: Open Menu</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tap the <strong>three dots (⋮)</strong> menu in the top right corner of Chrome or bottom right of Samsung Internet.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-slate-900 text-emerald-400 shrink-0 border border-slate-800">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Step B: Tap Install</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>. The icon will appear in your Android app drawer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shop-Floor Mobile Features */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm">Features for Industrial Android Tablets & Phones:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Camera QR machine plate scanning</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Full offline data caching & persistence</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2">
                <HardDriveDownload className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Direct PDF & spreadsheet export</span>
              </div>
            </div>
          </div>

          {/* Direct Offline Data Download for Android */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              <span>Need machine database saved to device storage?</span>
            </div>
            <button
              onClick={handleDownloadOfflineData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Download entire database JSON to Android Downloads"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download Database JSON</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
