import React, { useState } from 'react';
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
  const [activeCabinetId, setActiveCabinetId] = useState('CAB-C03');

  if (!isOpen) return null;

  const handleSimulatedScan = (cabId: string) => {
    onCabinetScanned(cabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 space-y-5 relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">qr_code_scanner</span>
            <span>สแกน QR Code หน้าตู้ (Optical Sensor)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            นำกล้องส่องที่ป้าย QR Code บริเวณหน้าตู้ล็อกเกอร์เพื่อเปิดระบบตรวจนับ
          </p>
        </div>

        {/* Viewfinder animation */}
        <div className="relative h-56 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
          {/* Laser beam */}
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse"></div>

          {/* Reticle */}
          <div className="w-40 h-40 border-2 border-dashed border-indigo-400 rounded-xl relative flex flex-col items-center justify-center p-3 bg-slate-950/60">
            <span className="material-symbols-outlined text-5xl text-indigo-400/70 animate-bounce">
              barcode_scanner
            </span>
            <div className="text-[10px] font-mono text-emerald-400 mt-2 font-bold">
              CAMERA SCANNING...
            </div>
          </div>
        </div>

        {/* Quick Cabinet Test selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            หรือเลือกจำลองสแกนตู้จัดเก็บ:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {cabinets.map((cab) => (
              <button
                key={cab.id}
                onClick={() => handleSimulatedScan(cab.id)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 border border-slate-800 text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-white">{cab.id}</div>
                  <div className="text-[10px] text-slate-400 group-hover:text-indigo-100">{cab.name.split(' ')[1] || cab.name}</div>
                </div>
                <span className="material-symbols-outlined text-sm text-indigo-400 group-hover:text-white">arrow_forward</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleSimulatedScan(activeCabinetId)}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition-transform active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-base">verified</span>
          <span>จำลองสแกนตู้ C-03 (สแกนสำเร็จ)</span>
        </button>
      </div>
    </div>
  );
};
