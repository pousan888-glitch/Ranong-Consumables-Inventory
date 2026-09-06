import React from 'react';
import { Cabinet } from '../types';

interface PrintQRModalProps {
  cabinet: Cabinet | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintQRModal: React.FC<PrintQRModalProps> = ({
  cabinet,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !cabinet) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">print</span>
            <span>พิมพ์ป้าย QR Code ประจำตู้ล็อกเกอร์</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ป้ายมาตรฐานขนาด 10x15 ซม. เคลือบพลาสติกกันน้ำสำหรับติดหน้าตู้จัดเก็บพัสดุ
          </p>
        </div>

        {/* PRINTABLE BADGE */}
        <div
          id="printable-badge"
          className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm text-center flex flex-col items-center space-y-3"
        >
          {/* Badge Header */}
          <div className="border-b-2 border-slate-900 pb-2 w-full">
            <div className="text-[10px] font-bold text-slate-800 tracking-widest uppercase">
              RANONG SUPPLY HUB • TERMINAL YARD 04
            </div>
            <div className="text-xl font-mono font-extrabold text-slate-950 mt-0.5">
              {cabinet.id}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">
              {cabinet.name}
            </div>
          </div>

          {/* SVG QR Code */}
          <div className="p-3 bg-white border border-slate-300 rounded-xl">
            <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" fill="white" />
              {/* Corner 1 */}
              <rect x="10" y="10" width="24" height="24" fill="#000" />
              <rect x="14" y="14" width="16" height="16" fill="white" />
              <rect x="18" y="18" width="8" height="8" fill="#000" />
              {/* Corner 2 */}
              <rect x="66" y="10" width="24" height="24" fill="#000" />
              <rect x="70" y="14" width="16" height="16" fill="white" />
              <rect x="74" y="18" width="8" height="8" fill="#000" />
              {/* Corner 3 */}
              <rect x="10" y="66" width="24" height="24" fill="#000" />
              <rect x="14" y="70" width="16" height="16" fill="white" />
              <rect x="18" y="74" width="8" height="8" fill="#000" />
              {/* Data Blocks */}
              <rect x="40" y="12" width="6" height="6" fill="#000" />
              <rect x="52" y="12" width="6" height="6" fill="#000" />
              <rect x="40" y="24" width="6" height="6" fill="#000" />
              <rect x="46" y="30" width="6" height="6" fill="#000" />
              <rect x="12" y="42" width="6" height="6" fill="#000" />
              <rect x="24" y="42" width="6" height="6" fill="#000" />
              <rect x="36" y="42" width="6" height="6" fill="#000" />
              <rect x="48" y="42" width="6" height="6" fill="#000" />
              <rect x="60" y="42" width="6" height="6" fill="#000" />
              <rect x="72" y="42" width="6" height="6" fill="#000" />
              <rect x="84" y="42" width="6" height="6" fill="#000" />
              <rect x="42" y="54" width="6" height="6" fill="#000" />
              <rect x="54" y="54" width="6" height="6" fill="#000" />
              <rect x="66" y="54" width="6" height="6" fill="#000" />
              <rect x="42" y="66" width="6" height="6" fill="#000" />
              <rect x="54" y="66" width="6" height="6" fill="#000" />
              <rect x="78" y="66" width="6" height="6" fill="#000" />
              <rect x="42" y="78" width="6" height="6" fill="#000" />
              <rect x="66" y="78" width="6" height="6" fill="#000" />
              <rect x="78" y="84" width="6" height="6" fill="#000" />
            </svg>
          </div>

          <div className="font-mono text-xs font-bold text-slate-900 tracking-wider">
            {cabinet.qrCode}
          </div>

          {/* Badge Footer details */}
          <div className="border-t-2 border-slate-900 pt-2 w-full text-center">
            <div className="text-[11px] font-semibold text-slate-800">
              {cabinet.descriptionTh}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              ผู้รับผิดชอบ: {cabinet.responsibleEngineer}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100 transition-transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>พิมพ์ป้ายเดี๋ยวนี้</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
