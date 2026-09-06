import React, { useState } from 'react';
import { AuditFeedItem, Cabinet } from '../types';

interface AuditLogsViewProps {
  auditFeed: AuditFeedItem[];
  cabinets: Cabinet[];
  onOpenSheetsModal: () => void;
  onOpenScanQR: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  auditFeed,
  cabinets,
  onOpenSheetsModal,
  onOpenScanQR,
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'alert' | 'done'>('all');

  return (
    <main className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-indigo-600 text-2xl lg:text-3xl">fact_check</span>
              <span>บันทึกการตรวจนับและรายงานผลต่าง (Inspection &amp; Audit Logs)</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ประวัติการสแกนตรวจนับสต็อกหน้าตู้ล็อกเกอร์ การบันทึกยอดคลาดเคลื่อน และการลงนามของ Helper ประจำกะ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSheetsModal}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base text-emerald-600">table_view</span>
            <span>ส่งออกประวัติตรวจนับสู่ Sheets</span>
          </button>
          <button
            onClick={onOpenScanQR}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-100 transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-base">qr_code_scanner</span>
            <span>เริ่มตรวจนับใหม่</span>
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">การตรวจนับใน 24 ชม.</div>
          <div className="font-mono text-3xl font-bold text-emerald-600 mt-1">18 รอบตรวจ</div>
          <div className="text-xs text-slate-500 mt-1">ครอบคลุม 18 ตู้จัดเก็บ</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">พบคลาดเคลื่อน (DISCREPANCIES)</div>
          <div className="font-mono text-3xl font-bold text-amber-600 mt-1">2 รายการ</div>
          <div className="text-xs text-slate-500 mt-1">ตู้ A-01 (ลูกบล็อก), ตู้ C-03 (ลวดเชื่อม)</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">ความแม่นยำสต็อกโดยรวม</div>
          <div className="font-mono text-3xl font-bold text-indigo-600 mt-1">98.4%</div>
          <div className="text-xs text-slate-500 mt-1">อยู่ในเกณฑ์มาตรฐานความปลอดภัยท่าเรือ</div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: 'บันทึกทั้งหมด' },
          { id: 'alert', label: 'พบผลต่าง / แจ้งเตือน' },
          { id: 'done', label: 'ตรวจนับเรียบร้อย' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedType === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AUDIT LOGS TIMELINE & TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">ไทม์ไลน์บันทึกการตรวจนับประจำวัน</h3>
          <span className="text-xs text-slate-400">อัปเดตล่าสุด Real-time</span>
        </div>

        <div className="divide-y divide-slate-100">
          {auditFeed.map((item) => (
            <div key={item.id} className="p-5 hover:bg-slate-50/80 flex items-start gap-4 transition-colors">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  item.type === 'alert'
                    ? 'bg-amber-100 text-amber-700'
                    : item.type === 'in_progress'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {item.type === 'alert' ? 'warning' : item.type === 'in_progress' ? 'sync' : 'verified'}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {item.time}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-500">
                  <span>ผู้ตรวจนับ: <strong className="text-slate-900">{item.auditor}</strong></span>
                  <span>•</span>
                  <span>ตู้เป้าหมาย: <strong className="text-indigo-600 font-mono">{item.cabinetId}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">ส่งเข้าฐานข้อมูลระบบแล้ว</span>
                </div>
              </div>
            </div>
          ))}

          {/* Additional static realistic logs */}
          <div className="p-5 hover:bg-slate-50/80 flex items-start gap-4 transition-colors">
            <div className="p-2.5 rounded-xl shrink-0 bg-emerald-100 text-emerald-700">
              <span className="material-symbols-outlined text-xl">verified</span>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">ตรวจนับตู้ QA-01 เสร็จสิ้น</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ผู้ตรวจ: Auditor กานต์ • 08:30 น. (ตรงตามระบบทุกรายการ ปลอดภัยครบถ้วน)
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  08:30 น.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
