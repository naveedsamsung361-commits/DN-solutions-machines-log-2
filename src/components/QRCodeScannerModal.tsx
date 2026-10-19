import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  RotateCw, 
  Flashlight, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  Wrench, 
  Eye, 
  Upload, 
  Sparkles,
  QrCode,
  ScanLine,
  ArrowRight
} from 'lucide-react';
import jsQR from 'jsqr';
import { Machine } from '../types';
import { storageService } from '../services/storage';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMachineProfile: (machine: Machine) => void;
  onReportBreakdown: (machine: Machine) => void;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectMachineProfile,
  onReportBreakdown
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [matchedMachine, setMatchedMachine] = useState<Machine | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const machines = storageService.getMachines();

  // Start camera stream
  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);
    setHasCameraPermission(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setHasCameraPermission(true);
        setIsScanning(true);
        requestScan();
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      setHasCameraPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please grant camera permission in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device detected on this system.');
      } else {
        setErrorMessage(err.message || 'Unable to access camera feed.');
      }
    }
  };

  // Stop camera stream & scan loop
  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      streamRef.current = null;
    }
  };

  // Scan loop
  const requestScan = () => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          handleCodeDetected(code.data);
          return; // Stop scanning once found
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(requestScan);
  };

  // Process detected QR code payload
  const handleCodeDetected = (rawValue: string) => {
    setIsScanning(false);
    setScannedResult(rawValue);

    // Haptic vibration feedback if supported
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {
      // ignore
    }

    // Match against registered machines
    const cleanVal = rawValue.trim();
    let found = machines.find(m => 
      m.machineId.toLowerCase() === cleanVal.toLowerCase() ||
      m.serialNumber.toLowerCase() === cleanVal.toLowerCase() ||
      m.id.toLowerCase() === cleanVal.toLowerCase()
    );

    // If payload contains JSON
    if (!found && cleanVal.startsWith('{') && cleanVal.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanVal);
        const targetId = parsed.machineId || parsed.id || parsed.serialNumber;
        if (targetId) {
          found = machines.find(m => 
            m.machineId.toLowerCase() === String(targetId).toLowerCase() ||
            m.serialNumber.toLowerCase() === String(targetId).toLowerCase()
          );
        }
      } catch (e) {
        // ignore
      }
    }

    // If payload contains URL parameters like ?machineId=MC-VMC-01
    if (!found && cleanVal.includes('machineId=')) {
      const match = cleanVal.match(/machineId=([^&]+)/);
      if (match && match[1]) {
        const urlId = decodeURIComponent(match[1]);
        found = machines.find(m => m.machineId.toLowerCase() === urlId.toLowerCase());
      }
    }

    // Fallback: search substring match
    if (!found) {
      found = machines.find(m => 
        cleanVal.toLowerCase().includes(m.machineId.toLowerCase()) ||
        cleanVal.toLowerCase().includes(m.serialNumber.toLowerCase()) ||
        cleanVal.toLowerCase().includes(m.model.toLowerCase())
      );
    }

    setMatchedMachine(found || null);
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && (track.getCapabilities as any)?.().torch) {
      try {
        const next = !torchEnabled;
        await (track.applyConstraints as any)({ advanced: [{ torch: next }] });
        setTorchEnabled(next);
      } catch (e) {
        console.warn('Torch toggle not supported', e);
      }
    } else {
      alert('Flashlight is not supported on this camera/device.');
    }
  };

  // Flip Camera
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Resume scanning
  const handleRescan = () => {
    setScannedResult(null);
    setMatchedMachine(null);
    setIsScanning(true);
    requestScan();
  };

  // File Upload fallback for scanning QR code from an image file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleCodeDetected(code.data);
          } else {
            alert('No valid QR code detected in the selected image. Please try another photo.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Simulated Machine Plate quick-scan (super helpful for testing on desktop without physical machine plates)
  const handleQuickPlateScan = (machine: Machine) => {
    handleCodeDetected(machine.machineId);
  };

  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      setMatchedMachine(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading-industrial font-bold text-sm sm:text-base text-white uppercase tracking-wider">
                Machine Plate QR Code Scanner
              </h2>
              <p className="text-[11px] text-slate-400">
                Point camera at machine identification plate or asset tag
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

        {/* Scanner Viewport */}
        <div className="p-5 space-y-4">
          {!scannedResult ? (
            <div className="space-y-4">
              {/* Camera Video Container with Target Reticle */}
              <div className="relative aspect-square max-h-80 mx-auto w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Industrial HUD Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-blue-500/80 rounded-2xl relative shadow-2xl shadow-blue-500/20">
                    {/* Corner Reticles */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

                    {/* Laser Scan Animation Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400/50 absolute top-0 animate-[bounce_2.5s_infinite]" />

                    <div className="absolute bottom-2 inset-x-0 text-center">
                      <span className="text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60 uppercase tracking-widest">
                        Align Machine QR Code
                      </span>
                    </div>
                  </div>
                </div>

                {/* Camera Permission / Error Overlay */}
                {hasCameraPermission === false && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-amber-400" />
                    <span className="font-semibold text-white text-xs">Camera Feed Inactive</span>
                    <p className="text-[11px] text-slate-400 max-w-xs">{errorMessage}</p>
                    <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow">
                      <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                      Upload QR Image File
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFacingMode}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
                    title="Switch Front / Rear Camera"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px]">Flip Camera</span>
                  </button>
                  <button
                    onClick={toggleTorch}
                    className={`p-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                      torchEnabled ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title="Toggle Flashlight / Torch"
                  >
                    <Flashlight className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px]">Torch</span>
                  </button>
                </div>

                {/* Upload from Gallery fallback */}
                <label className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors text-[11px]">
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              {/* Shop-Floor Simulation Quick-Tags (Allows instant testing without physical plates) */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Shop Floor Plate Simulator (Quick Test)
                  </span>
                  <span className="text-slate-400 text-[10px]">Tap to simulate plate scan:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {machines.slice(0, 5).map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleQuickPlateScan(m)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-blue-600/20 hover:border-blue-500 border border-slate-700/80 text-[11px] font-mono text-slate-300 transition-all flex items-center gap-1"
                    >
                      <span className="font-bold text-blue-400">{m.machineId}</span>
                      <span className="text-[10px] text-slate-400">({m.model})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Scanned Result Card with Direct Jump Actions */
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              {matchedMachine ? (
                <div className="p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/80 space-y-4 shadow-xl">
                  {/* Status header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="font-heading-industrial font-bold text-sm text-emerald-400 uppercase tracking-wide">
                        Machine Plate Verified
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Tag: {scannedResult}
                    </span>
                  </div>

                  {/* Machine Plate Preview */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {matchedMachine.machinePhotoUrl ? (
                        <img src={matchedMachine.machinePhotoUrl} alt={matchedMachine.machineName} className="w-full h-full object-cover" />
                      ) : (
                        <Cpu className="w-8 h-8 text-blue-400" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-industrial font-bold text-base text-white">
                          {matchedMachine.machineId}
                        </span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                          matchedMachine.operatingStatus === 'running'
                            ? 'bg-emerald-950 text-emerald-400'
                            : matchedMachine.operatingStatus === 'breakdown'
                            ? 'bg-red-950 text-red-400'
                            : 'bg-amber-950 text-amber-400'
                        }`}>
                          {matchedMachine.operatingStatus}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-200 text-xs">{matchedMachine.machineName}</h3>
                      <p className="text-[11px] text-slate-400">
                        Model: <strong className="text-white">{matchedMachine.model}</strong> • S/N: <span className="font-mono">{matchedMachine.serialNumber}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {matchedMachine.customerName} • {matchedMachine.factory} ({matchedMachine.productionLine})
                      </p>
                    </div>
                  </div>

                  {/* Direct Actions Required in Prompt: "Jump directly to its profile or report a new breakdown" */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectMachineProfile(matchedMachine);
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Machine Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onReportBreakdown(matchedMachine);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                    >
                      <Wrench className="w-4 h-4 text-yellow-300" />
                      <span>Report Breakdown</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Scanned Tag didn't match known machine ID */
                <div className="p-5 rounded-2xl bg-slate-950 border border-amber-800/80 space-y-3 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Unknown Machine Tag Detected</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Scanned payload: <code className="font-mono text-amber-300 bg-slate-900 px-2 py-0.5 rounded">{scannedResult}</code>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      No registered machine matching this ID or serial number was found in the database.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleRescan}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Scan Another Machine</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
