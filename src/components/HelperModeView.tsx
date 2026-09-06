import React, { useState } from 'react';
import { ConsumableItem, Cabinet } from '../types';

interface HelperModeViewProps {
  onBackToDashboard: () => void;
  onAuditCompleted: (cabinetId: string, summary: string) => void;
  onItemIssued: (sku: string, qty: number, recipient: string) => void;
  items: ConsumableItem[];
  cabinets: Cabinet[];
}

export const HelperModeView: React.FC<HelperModeViewProps> = ({
  onBackToDashboard,
  onAuditCompleted,
  onItemIssued,
  items,
  cabinets,
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'count' | 'issue'>('count');
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('CAB-C03');

  // Count states for Cabinet C-03 items
  const [counts, setCounts] = useState<Record<string, { qty: number; confirmed: boolean }>>({
    'SKU-KB-320': { qty: 42, confirmed: true },
    'SKU-DW-400': { qty: 120, confirmed: true },
    'SKU-GL-WLD': { qty: 15, confirmed: false },
  });

  // Fast Issue Form State
  const [issueSku, setIssueSku] = useState<string>('SKU-KB-320');
  const [issueQty, setIssueQty] = useState<number>(2);
  const [techBadgeId, setTechBadgeId] = useState<string>('TECH-7491 (ช่างสมศักดิ์)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const updateCountQty = (sku: string, delta: number) => {
    const current = counts[sku]?.qty ?? 10;
    const nextQty = Math.max(0, current + delta);
    setCounts({
      ...counts,
      [sku]: { qty: nextQty, confirmed: false },
    });
  };

  const toggleConfirmItem = (sku: string) => {
    const current = counts[sku] || { qty: 10, confirmed: false };
    setCounts({
      ...counts,
      [sku]: { ...current, confirmed: !current.confirmed },
    });
  };

  const handleSubmitAudit = () => {
    onAuditCompleted('CAB-C03', 'ตรวจนับครบ 3 รายการ พบต่าง -3 ในลวดเชื่อม');
    showToast('บันทึกผลการตรวจนับตู้ C-03 เรียบร้อยแล้ว ข้อมูลซิงค์เข้าสู่ระบบกลาง');
  };

  const handleConfirmIssue = () => {
    if (!techBadgeId.trim()) {
      alert('กรุณาระบุรหัสบัตรพนักงานช่างผู้เบิก');
      return;
    }
    onItemIssued(issueSku, issueQty, techBadgeId);
    showToast(`เบิกจ่าย ${issueSku} จำนวน ${issueQty} สำเร็จ ให้แก่ ${techBadgeId}`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b1c30] text-slate-100 flex flex-col min-h-screen">
      {/* TOP INDUSTRIAL HEADER */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
            <span className="material-symbols-outlined text-xl">devices</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">
                Ranong Ops - Helper Mode
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PLANT 04
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>พิเชษฐ์ (Helper ประจำกะ A)</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> พร้อมสแกนหน้าตู้ (Ready)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
        >
          <span className="material-symbols-outlined text-base">dashboard</span>
          <span>กลับหน้า Admin</span>
        </button>
      </header>

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg border border-emerald-400 font-medium text-xs flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODE TOGGLE TABS */}
      <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5">
        <div className="grid grid-cols-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveSubMode('count')}
            className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeSubMode === 'count'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">fact_check</span>
            <span>1. ตรวจนับสต็อก (Stock Count)</span>
          </button>
          <button
            onClick={() => setActiveSubMode('issue')}
            className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeSubMode === 'issue'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">output</span>
            <span>2. เบิกของด่วน (Issue Items)</span>
          </button>
        </div>

        {/* OPTICAL QR VIEWFINDER CONTAINER */}
        <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-5 overflow-hidden flex flex-col items-center justify-center shadow-inner">
          {/* Industrial Scanner Laser Line */}
          <div className="absolute inset-x-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse"></div>

          {/* Scanner Viewfinder Box */}
          <div className="w-56 h-44 border-2 border-dashed border-indigo-400/60 rounded-xl relative flex items-center justify-center bg-slate-900/40">
            {/* Reticle Corners */}
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
            <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>

            <div className="text-center p-2">
              <span className="material-symbols-outlined text-4xl text-indigo-400/80 mb-1">
                qr_code_scanner
              </span>
              <div className="text-[11px] font-mono text-emerald-400 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/40">
                CAB-C03-ZONE-WELD
              </div>
            </div>
          </div>

          {/* Target Bin Identified Badge */}
          <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-xs font-semibold text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>ตู้จัดเก็บ: ตู้ C-03 (โซนอะไหล่และอุปกรณ์งานเชื่อม ท่า 03)</span>
          </div>
        </div>

        {/* SUB-VIEW 1: STOCK COUNT */}
        {activeSubMode === 'count' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-lg">checklist</span>
                <span>รายการพัสดุในตู้ C-03 (นับยอดจริง)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">3 รายการตรวจ</span>
            </div>

            {/* ITEM 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-400">SKU-KB-320</span>
                  <h4 className="text-sm font-semibold text-white">ลวดเชื่อม Kobe RB-26 3.2mm</h4>
                  <span className="text-xs text-slate-400">ช่องเก็บ A-12 • ในระบบระบุ 45 กล่อง</span>
                </div>
                <button
                  onClick={() => toggleConfirmItem('SKU-KB-320')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    counts['SKU-KB-320']?.confirmed
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {counts['SKU-KB-320']?.confirmed ? 'ตรวจแล้ว (ต่าง -3)' : 'กดยืนยัน'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-300 font-medium">ยอดที่นับได้จริง:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCountQty('SKU-KB-320', -1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-base text-white active:scale-95"
                  >
                    -
                  </button>
                  <span className="font-mono text-base font-bold text-white w-12 text-center">
                    {counts['SKU-KB-320']?.qty ?? 42}
                  </span>
                  <button
                    onClick={() => updateCountQty('SKU-KB-320', 1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-base text-white active:scale-95"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-400">กล่อง</span>
                </div>
              </div>
            </div>

            {/* ITEM 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-400">SKU-DW-400</span>
                  <h4 className="text-sm font-semibold text-white">ใบเจียรสแตนเลส 4 นิ้ว</h4>
                  <span className="text-xs text-slate-400">ช่องเก็บ B-04 • ในระบบระบุ 120 แผ่น</span>
                </div>
                <button
                  onClick={() => toggleConfirmItem('SKU-DW-400')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    counts['SKU-DW-400']?.confirmed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {counts['SKU-DW-400']?.confirmed ? 'ตรงตามระบบ (120)' : 'กดยืนยัน'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-300 font-medium">ยอดที่นับได้จริง:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCountQty('SKU-DW-400', -5)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-base text-white active:scale-95"
                  >
                    -
                  </button>
                  <span className="font-mono text-base font-bold text-white w-12 text-center">
                    {counts['SKU-DW-400']?.qty ?? 120}
                  </span>
                  <button
                    onClick={() => updateCountQty('SKU-DW-400', 5)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-base text-white active:scale-95"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-400">แผ่น</span>
                </div>
              </div>
            </div>

            {/* ITEM 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-400">SKU-GL-WLD</span>
                  <h4 className="text-sm font-semibold text-white">ถุงมือหนังช่างเชื่อม (ยาวพิเศษ)</h4>
                  <span className="text-xs text-slate-400">ช่องเก็บ C-01 • ในระบบระบุ 15 คู่</span>
                </div>
                <button
                  onClick={() => toggleConfirmItem('SKU-GL-WLD')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    counts['SKU-GL-WLD']?.confirmed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {counts['SKU-GL-WLD']?.confirmed ? 'ตรงตามระบบ (15)' : 'กดยืนยัน'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-300 font-medium">ยอดที่นับได้จริง:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCountQty('SKU-GL-WLD', -1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-base text-white active:scale-95"
                  >
                    -
                  </button>
                  <span className="font-mono text-base font-bold text-white w-12 text-center">
                    {counts['SKU-GL-WLD']?.qty ?? 15}
                  </span>
                  <button
                    onClick={() => updateCountQty('SKU-GL-WLD', 1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-base text-white active:scale-95"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-400">คู่</span>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                onClick={handleSubmitAudit}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-xl">cloud_upload</span>
                <span>บันทึกผลการตรวจนับตู้นี้ (Submit Cabinet C-03 Count)</span>
              </button>
            </div>
          </div>
        )}

        {/* SUB-VIEW 2: FAST ISSUE */}
        {activeSubMode === 'issue' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <span className="material-symbols-outlined text-indigo-400 text-lg">output</span>
              <span>เบิกจ่ายพัสดุด่วนหน้าตู้ C-03</span>
            </h3>

            {/* Select Item to Issue */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">1. เลือกรายการพัสดุในตู้ C-03:</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { sku: 'SKU-KB-320', name: 'ลวดเชื่อม Kobe RB-26 3.2mm', bal: 42, unit: 'กล่อง' },
                  { sku: 'SKU-DW-400', name: 'ใบเจียรสแตนเลส 4 นิ้ว', bal: 120, unit: 'แผ่น' },
                  { sku: 'SKU-GL-WLD', name: 'ถุงมือหนังช่างเชื่อม (ยาวพิเศษ)', bal: 15, unit: 'คู่' },
                ].map((item) => (
                  <label
                    key={item.sku}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      issueSku === item.sku
                        ? 'bg-indigo-950/60 border-indigo-500'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="issueSku"
                        checked={issueSku === item.sku}
                        onChange={() => setIssueSku(item.sku)}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{item.name}</div>
                        <div className="text-[11px] font-mono text-indigo-400">{item.sku}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-300">
                      คงเหลือ {item.bal} {item.unit}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300">2. จำนวนที่ต้องการเบิก:</label>
              <div className="flex items-center justify-center gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => setIssueQty(Math.max(1, issueQty - 1))}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-xl text-white active:scale-90"
                >
                  -
                </button>
                <span className="font-mono text-2xl font-bold text-white w-20 text-center">
                  {issueQty}
                </span>
                <button
                  onClick={() => setIssueQty(issueQty + 1)}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-xl text-white active:scale-90"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tech Badge / Job Reference */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300">3. รหัสบัตรช่าง / ใบงาน (Job/Badge ID):</label>
              <div className="flex gap-2">
                <input
                  value={techBadgeId}
                  onChange={(e) => setTechBadgeId(e.target.value)}
                  placeholder="เช่น TECH-7491 (ช่างสมศักดิ์)"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={() => setTechBadgeId('TECH-7491 (ช่างสมศักดิ์)')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 border border-slate-700 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>สแกนบัตร</span>
                </button>
              </div>
            </div>

            {/* Confirm Issue Button */}
            <div className="pt-3">
              <button
                onClick={handleConfirmIssue}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition-all active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-xl">verified</span>
                <span>ยืนยันการจ่ายของ (Confirm &amp; Deduct Stock)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
