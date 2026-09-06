import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Cabinet } from '../types';

interface ScanQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabinets: Cabinet[];
  onCabinetScanned: (cabinetId: string) => void;
}

export const ScanQRModal: React.FC<ScanQRModalProps> = ({
  isOpen,
  onClose,
  cabinets,
  onCabinetScanned,
}) => {
  const [scanTab, setScanTab] = useState<'camera' | 'upload' | 'simulate'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDecodingFile, setIsDecodingFile] = useState<boolean>(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Helper to extract clean cabinet ID
  const resolveCabinetId = (rawPayload: string): string => {
    const trimmed = rawPayload.trim();
    // Check if it's JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.cabinetId) return parsed.cabinetId;
      if (parsed.id) return parsed.id;
    } catch {
      // Not json, continue
    }

    // Direct match against known cabinets
    const directMatch = cabinets.find(
      (c) =>
        c.id.toLowerCase() === trimmed.toLowerCase() ||
        c.qrCode?.toLowerCase() === trimmed.toLowerCase() ||
        c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (directMatch) return directMatch.id;

    // Regex check for CAB-XXX
    const cabMatch = trimmed.match(/CAB-[A-Za-z0-9]+/i);
    if (cabMatch) {
      const normalized = cabMatch[0].toUpperCase();
      const match = cabinets.find((c) => c.id.toUpperCase() === normalized);
      if (match) return match.id;
      return normalized;
    }

    // Fallback: return trimmed
    return trimmed;
  };

  const handleScanSuccess = (decodedText: string) => {
    const cabId = resolveCabinetId(decodedText);
    stopCamera();
    onCabinetScanned(cabId);
    onClose();
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const element = document.getElementById('qr-reader-container');
      if (!element) return;

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore scan frame misses
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้กล้อง หรือเลือกอัปโหลดรูปภาพ / เลือกจำลองสแกนด้านล่าง');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (html5QrCodeRef.current && isCameraActive) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          setIsCameraActive(false);
        })
        .catch((err) => {
          console.warn('Camera stop error:', err);
          setIsCameraActive(false);
        });
    }
  };

  useEffect(() => {
    if (isOpen && scanTab === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, scanTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingFile(true);
    setUploadError(null);

    try {
      const scanner = new Html5Qrcode('qr-file-reader-dummy');
      const result = await scanner.scanFile(file, true);
      setIsDecodingFile(false);
      handleScanSuccess(result);
    } catch (err: any) {
      setIsDecodingFile(false);
      setUploadError('ไม่พบ QR Code ที่ชัดเจนในรูปภาพ กรุณาถ่ายภาพให้เห็น QR ชัดเจน หรือเลือกตู้จากรายการด้านล่าง');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const cabId = resolveCabinetId(manualCode);
    handleScanSuccess(cabId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="bg-slate-950 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 space-y-5 relative text-slate-100 my-auto">
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="ปิดหน้าต่าง"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Dummy container for file scanner */}
        <div id="qr-file-reader-dummy" className="hidden" />

        {/* HEADER */}
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
            </span>
            <span>สแกน QR Code หน้าตู้ตรวจนับ (Cabinet Scanner)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            นำกล้องส่องที่ป้าย QR หน้าตู้ หรืออัปโหลดรูปภาพเพื่อเปิดระบบตรวจนับพัสดุในตู้ทันที
          </p>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setScanTab('camera')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              scanTab === 'camera'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            <span>กล้องส่อง</span>
          </button>
          <button
            onClick={() => {
              stopCamera();
              setScanTab('upload');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              scanTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>อัปโหลดภาพ</span>
          </button>
          <button
            onClick={() => {
              stopCamera();
              setScanTab('simulate');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              scanTab === 'simulate'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">touch_app</span>
            <span>เลือกตู้ทันที</span>
          </button>
        </div>

        {/* TAB 1: CAMERA SCANNER */}
        {scanTab === 'camera' && (
          <div className="space-y-4">
            <div className="relative min-h-[260px] bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
              <div id="qr-reader-container" className="w-full max-w-sm rounded-xl overflow-hidden" />

              {cameraError ? (
                <div className="p-4 text-center space-y-2 max-w-xs">
                  <span className="material-symbols-outlined text-amber-400 text-3xl">videocam_off</span>
                  <div className="text-xs text-amber-300 font-medium leading-relaxed">
                    {cameraError}
                  </div>
                  <button
                    onClick={startCamera}
                    className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    ลองเปิดกล้องอีกครั้ง
                  </button>
                </div>
              ) : !isCameraActive ? (
                <div className="p-4 text-center space-y-2">
                  <span className="material-symbols-outlined text-indigo-400 text-3xl animate-spin">
                    progress_activity
                  </span>
                  <div className="text-xs text-slate-400 font-medium">กำลังเปิดกล้องระบบ...</div>
                </div>
              ) : null}
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              จัดวางกรอบสี่เหลี่ยมให้ตรงกับป้าย QR Code ที่ติดอยู่หน้าตู้ล็อกเกอร์
            </p>
          </div>
        )}

        {/* TAB 2: UPLOAD IMAGE SCANNER */}
        {scanTab === 'upload' && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-900/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isDecodingFile}
              />
              <span className="material-symbols-outlined text-indigo-400 text-4xl mb-2">
                add_photo_alternate
              </span>
              <div className="text-xs font-bold text-white">
                คลิกเพื่อเลือกไฟล์รูปถ่ายป้าย QR Code
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                รองรับไฟล์ JPG, PNG หรือรูปที่ถ่ายจากมือถือ
              </div>
              {isDecodingFile && (
                <div className="mt-3 flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  <span>กำลังสแกนและถอดรหัส QR...</span>
                </div>
              )}
            </label>

            {uploadError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-rose-400">warning</span>
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SIMULATE / MANUAL CODE */}
        {scanTab === 'simulate' && (
          <div className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                หรือพิมพ์รหัสตู้ / รหัส QR โดยตรง:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="เช่น CAB-C03 หรือ CAB-A01"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  ค้นหาตู้
                </button>
              </div>
            </form>
          </div>
        )}

        {/* QUICK CABINET SELECTOR (AVAILABLE IN ALL TABS FOR ACCESSIBILITY) */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              หรือแตะเพื่อเลือกตู้สำหรับตรวจนับทันที:
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {cabinets.length} ตู้พร้อมนับ
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs max-h-48 overflow-y-auto pr-1">
            {cabinets.map((cab) => (
              <button
                key={cab.id}
                onClick={() => handleScanSuccess(cab.id)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 hover:border-indigo-500 border border-slate-800 text-left transition-all flex flex-col justify-between group"
              >
                <div className="font-mono font-bold text-white group-hover:text-white flex items-center justify-between">
                  <span>{cab.id}</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-indigo-200">
                    {cab.zoneCode}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 group-hover:text-indigo-100 truncate mt-1">
                  {cab.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
