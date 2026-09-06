import React, { useState } from 'react';
import { Cabinet } from '../types';

interface CabinetsViewProps {
  cabinets: Cabinet[];
  onOpenPrintModal: (cabinet: Cabinet) => void;
  onOpenScanQR: () => void;
  onSelectCabinetForTerminal: (cabinetId: string) => void;
}

export const CabinetsView: React.FC<CabinetsViewProps> = ({
  cabinets,
  onOpenPrintModal,
  onOpenScanQR,
  onSelectCabinetForTerminal,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchCabinet, setSearchCabinet] = useState<string>('');
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('CAB-C03');

  const selectedCabinet =
    cabinets.find((c) => c.id === selectedCabinetId) || cabinets[0];

  const filteredCabinets = cabinets.filter((c) => {
    if (selectedZone !== 'all' && c.zoneCode !== selectedZone) return false;
    if (searchCabinet) {
      const q = searchCabinet.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.zone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <main className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-indigo-600 text-2xl lg:text-3xl">shelves</span>
              <span>ผังตู้จัดเก็บและจัดการ QR Code (Cabinets &amp; Bins)</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            แผนผังตู้ล็อกเกอร์และชั้นจัดเก็บวัสดุสิ้นเปลือง 24 ตู้ พร้อมระบบออกป้าย QR ประจำตู้สำหรับสแกนนับสต็อกหน้างาน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenPrintModal(selectedCabinet)}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>พิมพ์ QR ทั้งหมด</span>
          </button>
          <button
            onClick={() => alert('ฟังก์ชันเพิ่มตู้ล็อกเกอร์ใหม่: สามารถสร้างรหัสและพิมพ์ QR ประจำตู้ได้ทันที')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-100 transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>+ เพิ่มตู้ใหม่</span>
          </button>
        </div>
      </div>

      {/* 4 KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ตู้ทั้งหมด (TOTAL CABINETS)</div>
          <div className="font-mono text-3xl font-bold text-slate-900 mt-1">24 ตู้</div>
          <div className="text-xs text-slate-500 mt-1">ครอบคลุมลานท่าเรือ Zone A - D</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">ตรวจนับแล้ววันนี้ (AUDITED TODAY)</div>
          <div className="font-mono text-3xl font-bold text-emerald-600 mt-1">18 ตู้ (75%)</div>
          <div className="text-xs text-slate-500 mt-1">ความถูกต้องตรงตามระบบ 94.2%</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">รอตรวจนับ (PENDING/RECOUNT)</div>
          <div className="font-mono text-3xl font-bold text-amber-600 mt-1">6 ตู้</div>
          <div className="text-xs text-slate-500 mt-1">กำหนดตรวจกะบ่ายและกะดึก</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ความหนาแน่นเฉลี่ย (AVG DENSITY)</div>
          <div className="font-mono text-3xl font-bold text-indigo-600 mt-1">15 รายการ/ตู้</div>
          <div className="text-xs text-slate-500 mt-1">พื้นที่จัดเก็บพร้อมใช้งาน 82%</div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'Zone A', 'Zone B', 'Zone C', 'Zone D'].map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedZone === zone
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {zone === 'all' ? 'ทั้งหมด (24)' : zone}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            value={searchCabinet}
            onChange={(e) => setSearchCabinet(e.target.value)}
            placeholder="ค้นหาชื่อตู้ / รหัส..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* MAIN SPLIT: CABINET CARDS GRID (8 COLS) + DETAIL DRAWER (4 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* CABINET CARDS GRID (8 COLS) */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCabinets.map((cab) => {
            const isSelected = cab.id === selectedCabinetId;
            return (
              <div
                key={cab.id}
                onClick={() => setSelectedCabinetId(cab.id)}
                className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between shadow-sm relative ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-indigo-600">
                        {cab.id} • {cab.zone}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{cab.name}</h3>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        cab.status === 'counted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : cab.status === 'safe'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : cab.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {cab.statusTextTh}
                    </span>
                  </div>

                  {/* Summary & QR Preview */}
                  <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="space-y-1 text-xs">
                      <div className="text-slate-600">
                        จำนวนพัสดุ: <strong className="text-slate-900 font-mono">{cab.totalItems}</strong> รายการ
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ตรวจล่าสุด: <span className="font-medium text-slate-800">{cab.lastAuditTime}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ผู้ตรวจ: {cab.auditor}
                      </div>
                    </div>

                    {/* QR Code thumbnail */}
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl p-1 flex items-center justify-center shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-2xl text-slate-900">
                        qr_code_2
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCabinetForTerminal(cab.id);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">fact_check</span>
                    <span>เปิดนับสต็อกตู้นี้</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPrintModal(cab);
                    }}
                    className="px-3 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    <span>พิมพ์ QR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT DETAIL DRAWER (4 COLS) */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-indigo-600">
                CABINET SPEC &amp; QR BADGE
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {selectedCabinet.statusTextTh}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">{selectedCabinet.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{selectedCabinet.descriptionTh}</p>
          </div>

          {/* PRINTABLE QR CODE BADGE PREVIEW */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 bg-slate-50 flex flex-col items-center text-center">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              ตัวอย่างป้าย QR ประจำตู้ (Shelf Tag)
            </div>
            <div className="w-52 bg-white border border-slate-200 rounded-xl p-3 mt-2 shadow-sm flex flex-col items-center">
              <div className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                RANONG SUPPLY • TERMINAL 04
              </div>
              <div className="text-sm font-mono font-bold text-indigo-600 mt-0.5">
                {selectedCabinet.id}
              </div>

              {/* Realistic SVG QR Graphic */}
              <div className="my-2 p-2 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <svg className="w-28 h-28" viewBox="0 0 100 100" fill="none">
                  {/* Outer Frame */}
                  <rect width="100" height="100" fill="white" />
                  {/* Corner Position Detection Patterns */}
                  <rect x="10" y="10" width="24" height="24" fill="#0f172a" />
                  <rect x="14" y="14" width="16" height="16" fill="white" />
                  <rect x="18" y="18" width="8" height="8" fill="#0f172a" />

                  <rect x="66" y="10" width="24" height="24" fill="#0f172a" />
                  <rect x="70" y="14" width="16" height="16" fill="white" />
                  <rect x="74" y="18" width="8" height="8" fill="#0f172a" />

                  <rect x="10" y="66" width="24" height="24" fill="#0f172a" />
                  <rect x="14" y="70" width="16" height="16" fill="white" />
                  <rect x="18" y="74" width="8" height="8" fill="#0f172a" />

                  {/* QR Data Pattern Dots */}
                  <rect x="40" y="12" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="12" width="6" height="6" fill="#0f172a" />
                  <rect x="40" y="24" width="6" height="6" fill="#0f172a" />
                  <rect x="46" y="30" width="6" height="6" fill="#0f172a" />
                  <rect x="12" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="24" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="36" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="48" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="60" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="72" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="84" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="54" width="6" height="6" fill="#0f172a" />
                  <rect x="54" y="54" width="6" height="6" fill="#0f172a" />
                  <rect x="66" y="54" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="66" width="6" height="6" fill="#0f172a" />
                  <rect x="54" y="66" width="6" height="6" fill="#0f172a" />
                  <rect x="78" y="66" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="78" width="6" height="6" fill="#0f172a" />
                  <rect x="66" y="78" width="6" height="6" fill="#0f172a" />
                  <rect x="78" y="84" width="6" height="6" fill="#0f172a" />
                </svg>
              </div>

              <div className="font-mono text-[11px] font-bold text-slate-800">
                {selectedCabinet.qrCode}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                {selectedCabinet.descriptionTh}
              </div>
            </div>

            <button
              onClick={() => onOpenPrintModal(selectedCabinet)}
              className="mt-3 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-indigo-100 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>พิมพ์ป้าย QR เคลือบพลาสติก</span>
            </button>
          </div>

          {/* LIST OF SKUS IN THIS CABINET */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              รายการพัสดุในตู้นี้ ({selectedCabinet.items.length} รายการ)
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              {selectedCabinet.items.map((it, idx) => (
                <div key={idx} className="p-2.5 bg-white flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{it.name}</div>
                    <div className="font-mono text-[10px] text-indigo-600">{it.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">{it.qty}</div>
                    <span
                      className={`text-[10px] font-bold ${
                        it.status === 'good'
                          ? 'text-emerald-700'
                          : it.status === 'low'
                          ? 'text-amber-700'
                          : it.status === 'critical'
                          ? 'text-rose-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {it.statusTh}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RESPONSIBLE ENGINEER BADGE */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <span className="material-symbols-outlined text-lg">engineering</span>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">วิศวกรผู้รับผิดชอบตู้:</div>
              <div className="text-xs font-bold text-slate-900">
                {selectedCabinet.responsibleEngineer}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
