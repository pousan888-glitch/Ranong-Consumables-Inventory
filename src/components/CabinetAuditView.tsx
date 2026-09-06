import React, { useState, useMemo } from 'react';
import { Cabinet, ConsumableItem } from '../types';

interface CabinetAuditViewProps {
  cabinet: Cabinet;
  allCabinets: Cabinet[];
  items: ConsumableItem[];
  auditorName: string;
  onSaveAudit: (
    cabinetId: string,
    updatedCounts: Record<string, number>,
    summary: string,
    remarks?: string
  ) => void;
  onSelectCabinet?: (cabinetId: string) => void;
  onBackToMain?: () => void;
  onOpenScanAnother?: () => void;
  onLogout?: () => void;
}

export const CabinetAuditView: React.FC<CabinetAuditViewProps> = ({
  cabinet,
  allCabinets,
  items,
  auditorName,
  onSaveAudit,
  onSelectCabinet,
  onBackToMain,
  onOpenScanAnother,
  onLogout,
}) => {
  // Find consumables for this cabinet
  const cabinetItems = useMemo(() => {
    const normCabId = cabinet.id.toLowerCase().replace(/[\s-_]/g, '');
    const cleanCabCode = normCabId.replace('cab', '');
    const normCabName = cabinet.name.toLowerCase().replace(/[\s-_]/g, '');

    const matched = items.filter((it) => {
      const normItemCab = it.cabinetId.toLowerCase().replace(/[\s-_]/g, '');
      const cleanItemCab = normItemCab.replace('cab', '').replace('ตู้', '');

      const cabIdMatches =
        normItemCab.includes(normCabId) ||
        normCabId.includes(normItemCab) ||
        cleanItemCab === cleanCabCode ||
        normItemCab.includes(cleanCabCode) ||
        cleanItemCab.includes(cleanCabCode) ||
        normCabName.includes(normItemCab) ||
        normItemCab.includes(normCabName);

      const skuMatches = cabinet.items?.some(
        (ci) => ci.sku.toLowerCase() === it.sku.toLowerCase()
      );

      return cabIdMatches || skuMatches;
    });

    return matched;
  }, [items, cabinet]);

  // Counts state: SKU -> counted quantity
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    cabinetItems.forEach((it) => {
      initial[it.sku] = it.balance;
    });
    return initial;
  });

  // Re-sync counts when cabinet changes
  React.useEffect(() => {
    const initial: Record<string, number> = {};
    cabinetItems.forEach((it) => {
      initial[it.sku] = it.balance;
    });
    setCounts(initial);
    setIsSuccessModalOpen(false);
  }, [cabinet.id, cabinetItems]);

  const [remarks, setRemarks] = useState<string>('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [lastSavedSummary, setLastSavedSummary] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateCount = (sku: string, delta: number) => {
    setCounts((prev) => {
      const current = prev[sku] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [sku]: next };
    });
  };

  const setCountDirect = (sku: string, value: number) => {
    setCounts((prev) => ({
      ...prev,
      [sku]: Math.max(0, value),
    }));
  };

  const setMatchSystem = (sku: string, systemBalance: number) => {
    setCountDirect(sku, systemBalance);
    showToast('ปรับยอดตรงตามระบบแล้ว');
  };

  // Compute audit summary statistics
  const stats = useMemo(() => {
    let exactMatches = 0;
    let shortage = 0;
    let surplus = 0;
    const diffList: string[] = [];

    cabinetItems.forEach((it) => {
      const counted = counts[it.sku] ?? it.balance;
      const diff = counted - it.balance;
      if (diff === 0) {
        exactMatches += 1;
      } else if (diff < 0) {
        shortage += 1;
        diffList.push(`${it.name} ขาด ${Math.abs(diff)} ${it.unit}`);
      } else {
        surplus += 1;
        diffList.push(`${it.name} เกิน +${diff} ${it.unit}`);
      }
    });

    return {
      total: cabinetItems.length,
      exactMatches,
      shortage,
      surplus,
      diffList,
    };
  }, [cabinetItems, counts]);

  const handleSave = () => {
    const diffSummary =
      stats.diffList.length > 0
        ? `พบผลต่าง ${stats.diffList.length} รายการ (${stats.diffList.join(', ')})`
        : `ยอดตรงทุกรายการ (${cabinetItems.length} รายการ)`;

    const summary = `ตรวจนับตู้ ${cabinet.id} ครบ ${cabinetItems.length} รายการ: ${diffSummary}`;
    setLastSavedSummary(summary);

    onSaveAudit(cabinet.id, counts, summary, remarks);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 flex flex-col min-h-screen">
      {/* GLOBAL NOTIFICATION TOAST */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-slide-in">
          <span className="material-symbols-outlined text-sm">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP COMPACT HEADER */}
      <header className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-950">
            <span className="material-symbols-outlined text-lg">fact_check</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-wide uppercase">
                ระบบตรวจนับสต็อกหน้าตู้ (Mobile Audit)
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-indigo-400">person</span>
              <span className="text-slate-200 font-semibold">{auditorName}</span>
              <span>•</span>
              <span className="text-slate-400">บันทึกตรวจนับ</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenScanAnother && (
            <button
              onClick={onOpenScanAnother}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="สแกน QR ตู้ใหม่"
            >
              <span className="material-symbols-outlined text-sm text-indigo-400">qr_code_scanner</span>
              <span className="hidden sm:inline">สแกนตู้ใหม่</span>
            </button>
          )}

          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="กลับไปหน้าหลัก"
            >
              <span className="material-symbols-outlined text-sm">dashboard</span>
              <span className="hidden sm:inline">หน้าหลัก</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs transition-colors cursor-pointer"
              title="ออกจากระบบ"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-5 space-y-4 pb-28">
        {/* SCANNED CABINET SUMMARY CARD */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs font-black border border-indigo-500/30">
                  {cabinet.id}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-semibold">
                  {cabinet.zone}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {cabinet.name}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {cabinet.descriptionTh}
              </p>
            </div>

            {/* Quick Cabinet Dropdown switcher if available */}
            {allCabinets.length > 1 && onSelectCabinet && (
              <div className="shrink-0">
                <select
                  value={cabinet.id}
                  onChange={(e) => onSelectCabinet(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  {allCabinets.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
              <span>สถานะเดิม: {cabinet.statusTextTh}</span>
              {cabinet.lastAuditTime && <span>({cabinet.lastAuditTime})</span>}
            </div>
            <div className="text-slate-500">
              วิศวกรผู้ดูแล: <span className="text-slate-300">{cabinet.responsibleEngineer}</span>
            </div>
          </div>
        </div>

        {/* AUDIT PROGRESS & SUMMARY BAR */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-7 h-7 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-base">format_list_bulleted</span>
            </span>
            <div>
              <div className="font-bold text-slate-200">
                รายการพัสดุในตู้ ({cabinetItems.length} รายการ)
              </div>
              <div className="text-[10px] text-slate-400">
                ปรับยอดตามจำนวนที่นับได้จริงในตู้
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
            {stats.shortage > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                ขาด {stats.shortage}
              </span>
            )}
            {stats.surplus > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
                เกิน {stats.surplus}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ตรง {stats.exactMatches}
            </span>
          </div>
        </div>

        {/* CONSUMABLE ITEMS LIST (โชว์คอนซูมที่ต้องบันทึกจำนวน) */}
        <div className="space-y-3">
          {cabinetItems.map((item, index) => {
            const countedQty = counts[item.sku] ?? item.balance;
            const diff = countedQty - item.balance;
            const isExact = diff === 0;

            return (
              <div
                key={item.sku}
                className={`bg-slate-950 rounded-2xl border transition-all p-4 ${
                  isExact
                    ? 'border-slate-800'
                    : diff < 0
                    ? 'border-rose-800/60 bg-rose-950/10'
                    : 'border-sky-800/60 bg-sky-950/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-900">
                        {item.sku}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.cabinetShelf}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white truncate">
                      {index + 1}. {item.name}
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1">
                      {item.spec}
                    </div>
                  </div>

                  {/* DIFFERENCE BADGE */}
                  <div className="shrink-0 text-right">
                    {isExact ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="material-symbols-outlined text-xs">check</span>
                        <span>ยอดตรง</span>
                      </span>
                    ) : diff < 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        <span className="material-symbols-outlined text-xs">arrow_downward</span>
                        <span>ขาด {Math.abs(diff)} {item.unit}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        <span className="material-symbols-outlined text-xs">arrow_upward</span>
                        <span>เกิน +{diff} {item.unit}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* COUNTING CONTROLS */}
                <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  {/* SYSTEM BALANCE INFO */}
                  <div className="text-xs">
                    <div className="text-slate-400 text-[11px]">
                      ยอดในระบบ:{' '}
                      <span className="font-bold text-slate-200 font-mono">
                        {item.balance} {item.unit}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Safety Min: {item.safetyMin} {item.unit}
                    </div>
                  </div>

                  {/* TOUCH-FRIENDLY STEPPER & DIRECT INPUT */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMatchSystem(item.sku, item.balance)}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold border border-slate-700 transition-colors"
                      title="กดเมื่อยอดที่นับได้ตรงกับระบบ"
                    >
                      ตรงระบบ
                    </button>

                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() => updateCount(item.sku, -1)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-transform active:scale-90"
                        title="ลดจำนวน"
                      >
                        <span className="material-symbols-outlined text-base">remove</span>
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={countedQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCountDirect(item.sku, isNaN(val) ? 0 : val);
                        }}
                        className="w-14 text-center font-mono font-bold text-sm bg-transparent text-white focus:outline-hidden"
                      />

                      <button
                        type="button"
                        onClick={() => updateCount(item.sku, 1)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-transform active:scale-90"
                        title="เพิ่มจำนวน"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AUDIT REMARKS / NOTES */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-indigo-400">note_alt</span>
            <span>หมายเหตุการตรวจนับหน้าตู้ (ถ้ามี):</span>
          </label>
          <textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="เช่น สภาพตู้สมบูรณ์, พัสดุถูกจัดวางเรียบร้อย, พบกล่องชำรุด 1 กล่อง..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </main>

      {/* STICKY BOTTOM SAVE BAR */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3 sm:p-4 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs">
            <div className="font-bold text-white flex items-center gap-1">
              <span>ตรวจ {cabinetItems.length} รายการ</span>
              {stats.diffList.length > 0 ? (
                <span className="text-amber-400 font-normal">
                  • ผลต่าง {stats.diffList.length} จุด
                </span>
              ) : (
                <span className="text-emerald-400 font-normal">
                  • ยอดตรงทุกรายการ
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              ผู้ตรวจ: <span className="text-slate-200">{auditorName}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            <span>กดบันทึกจำนวนตรวจนับ</span>
          </button>
        </div>
      </footer>

      {/* COMPLETION SUCCESS MODAL */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AUDIT COMPLETED
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                บันทึกการตรวจนับตู้ {cabinet.id} สำเร็จ!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ระบบได้อัปเดตยอดคงเหลือของวัสดุสิ้นเปลือง และบันทึกประวัติการตรวจโดย{' '}
                <strong className="text-slate-200">{auditorName}</strong> เรียบร้อยแล้ว
              </p>
            </div>

            {/* SUMMARY CARD */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left text-xs space-y-1 text-slate-300">
              <div className="text-[11px] font-bold text-slate-400">ผลการตรวจนับ:</div>
              <div className="text-slate-200 text-xs font-mono">{lastSavedSummary}</div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {onOpenScanAnother && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    onOpenScanAnother();
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                  <span>สแกนตรวจตู้ถัดไป</span>
                </button>
              )}

              {onBackToMain && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    onBackToMain();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">dashboard</span>
                  <span>กลับหน้าหลักคลัง</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
