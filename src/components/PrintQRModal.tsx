import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Cabinet } from '../types';

interface PrintQRModalProps {
  cabinet: Cabinet | null;
  allCabinets?: Cabinet[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCabinet?: (cabinet: Cabinet) => void;
}

export const PrintQRModal: React.FC<PrintQRModalProps> = ({
  cabinet,
  allCabinets = [],
  isOpen,
  onClose,
  onSelectCabinet,
}) => {
  const [currentCabinet, setCurrentCabinet] = useState<Cabinet | null>(cabinet);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  useEffect(() => {
    if (cabinet) {
      setCurrentCabinet(cabinet);
    }
  }, [cabinet]);

  useEffect(() => {
    if (!currentCabinet) return;

    let isMounted = true;
    setIsGenerating(true);

    // QR Payload contains the cabinet identification string
    const qrPayload = currentCabinet.qrCode || currentCabinet.id;

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('QR Generation error:', err);
        if (isMounted) {
          setIsGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentCabinet]);

  if (!isOpen || !currentCabinet) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPayload = () => {
    const payload = currentCabinet.qrCode || currentCabinet.id;
    navigator.clipboard?.writeText(payload);
    setCopyToast('คัดลอกรหัส QR สำเร็จ');
    setTimeout(() => setCopyToast(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="ปิดหน้าต่าง"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">qr_code_2</span>
            </span>
            <h3 className="text-base font-bold text-slate-900">
              สร้างป้าย QR Code ประจำตู้จัดเก็บ (Generate Cabinet QR)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            QR Code มาตรฐานความละเอียดสูง สำหรับพิมพ์ติดหน้าตู้ให้ Helper สแกนตรวจนับสต็อกหน้างาน
          </p>
        </div>

        {/* CABINET SELECTOR DROPDOWN */}
        {allCabinets.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>เลือกตู้ที่ต้องการสร้างป้าย:</span>
              <span className="text-[11px] font-mono text-indigo-600 font-bold">
                {currentCabinet.zoneCode}
              </span>
            </label>
            <select
              value={currentCabinet.id}
              onChange={(e) => {
                const target = allCabinets.find((c) => c.id === e.target.value);
                if (target) {
                  setCurrentCabinet(target);
                  if (onSelectCabinet) onSelectCabinet(target);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {allCabinets.map((cab) => (
                <option key={cab.id} value={cab.id}>
                  {cab.id} — {cab.name} ({cab.zone})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* TOAST ALERT */}
        {copyToast && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{copyToast}</span>
          </div>
        )}

        {/* PRINTABLE BADGE */}
        <div
          id="printable-badge"
          className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-sm text-center flex flex-col items-center space-y-3"
        >
          {/* Badge Header */}
          <div className="border-b-2 border-slate-900 pb-2 w-full">
            <div className="text-[10px] font-extrabold text-slate-800 tracking-widest uppercase">
              PORT OF RANONG • TERMINAL YARD 04
            </div>
            <div className="text-2xl font-mono font-black text-slate-950 mt-0.5 tracking-tight">
              {currentCabinet.id}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              {currentCabinet.name}
            </div>
          </div>

          {/* REAL GENERATED QR CODE */}
          <div className="p-3 bg-white border border-slate-300 rounded-2xl shadow-inner relative flex items-center justify-center min-w-[200px] min-h-[200px]">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <span className="material-symbols-outlined animate-spin text-2xl text-indigo-600">
                  progress_activity
                </span>
                <span className="text-xs font-medium">กำลังสร้าง QR Code...</span>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code for ${currentCabinet.id}`}
                className="w-48 h-48 rounded-lg object-contain"
              />
            ) : (
              <div className="text-xs text-slate-400">ไม่สามารถแสดงผล QR ได้</div>
            )}
          </div>

          {/* Scannable Payload text */}
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs font-bold text-slate-900 tracking-wider bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              {currentCabinet.qrCode || currentCabinet.id}
            </div>
            <button
              onClick={handleCopyPayload}
              className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
              title="คัดลอกรหัส Payload"
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
            </button>
          </div>

          {/* Badge Footer details */}
          <div className="border-t-2 border-slate-900 pt-2 w-full text-center space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-800">
              {currentCabinet.descriptionTh}
            </div>
            <div className="text-[10px] text-slate-600">
              โซน: <span className="font-bold text-slate-900">{currentCabinet.zone}</span> • ผู้ดูแล: {currentCabinet.responsibleEngineer}
            </div>
            <div className="text-[9px] text-indigo-700 font-mono font-semibold pt-1">
              สแกนด้วยโหมด Helper เพื่อตรวจนับพัสดุและเบิกจ่ายด่วน
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`QR-${currentCabinet.id}.png`}
              className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-colors"
            >
              <span className="material-symbols-outlined text-base text-indigo-600">download</span>
              <span>ดาวน์โหลดภาพ QR (PNG)</span>
            </a>
          )}

          <button
            onClick={handlePrint}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 transition-transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>พิมพ์ป้ายติดหน้าตู้</span>
          </button>
        </div>
      </div>
    </div>
  );
};
