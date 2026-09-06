import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { ConsumableItem, Cabinet } from '../types';

interface HelperModeViewProps {
  onBackToDashboard?: () => void;
  onAuditCompleted: (
    cabinetId: string,
    summary: string,
    updatedCounts?: Record<string, number>
  ) => void;
  onItemIssued: (sku: string, qty: number, recipient: string) => void;
  items: ConsumableItem[];
  cabinets: Cabinet[];
  selectedCabinetId?: string;
  onSelectCabinetId?: (cabinetId: string) => void;
  onOpenScanQR?: () => void;
  isHelperOnly?: boolean;
  googleUser?: User | null;
  onLogout?: () => void;
}

export const HelperModeView: React.FC<HelperModeViewProps> = ({
  onBackToDashboard,
  onAuditCompleted,
  onItemIssued,
  items,
  cabinets,
  selectedCabinetId = 'CAB-C03',
  onSelectCabinetId,
  onOpenScanQR,
  isHelperOnly = false,
  googleUser,
  onLogout,
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'count' | 'issue'>('count');
  const [currentCabId, setCurrentCabId] = useState<string>(selectedCabinetId);

  // Sync prop changes
  useEffect(() => {
    if (selectedCabinetId) {
      setCurrentCabId(selectedCabinetId);
    }
  }, [selectedCabinetId]);

  const activeCabinet = useMemo(() => {
    return (
      cabinets.find((c) => c.id === currentCabId) ||
      cabinets[0] || {
        id: 'CAB-C03',
        name: 'ตู้ C-03 (โซนงานเชื่อม)',
        zone: 'Zone C - ท่าเทียบเรือ 03',
        zoneCode: 'ZONE-C',
        descriptionTh: 'ตู้จัดเก็บอุปกรณ์งานเชื่อมและเจียร',
        status: 'pending',
        statusTextTh: 'รอตรวจนับ',
        responsibleEngineer: 'วิศวกรประจำกะ',
        qrCode: 'QR-CAB-C03',
      }
    );
  }, [cabinets, currentCabId]);

  // Find consumable items associated with this cabinet
  const cabinetItems = useMemo(() => {
    // Extract short code (e.g. C-03 from CAB-C03)
    const shortCode = activeCabinet.id.replace('CAB-', '');
    let matched = items.filter(
      (it) =>
        it.cabinetId.toLowerCase().includes(shortCode.toLowerCase()) ||
        it.cabinetId.toLowerCase().includes(activeCabinet.name.toLowerCase()) ||
        it.cabinetId.toLowerCase().includes(activeCabinet.id.toLowerCase())
    );

    // Fallback: If no direct items matched for this cabinet, pick 3 relevant items so Helper can always audit
    if (matched.length === 0) {
      if (activeCabinet.id.includes('A')) {
        matched = items.filter((it) => it.department.includes('หล่อลื่น') || it.department.includes('ซ่อมบำรุง')).slice(0, 3);
      } else if (activeCabinet.id.includes('B')) {
        matched = items.filter((it) => it.department.includes('เซฟตี้') || it.department.includes('ความปลอดภัย')).slice(0, 3);
      } else if (activeCabinet.id.includes('QA')) {
        matched = items.filter((it) => it.department.includes('เคมี') || it.department.includes('ตรวจสอบ')).slice(0, 3);
      } else {
        matched = items.slice(0, 3);
      }
    }

    return matched;
  }, [items, activeCabinet]);

  // Count state for each item in the active cabinet
  const [counts, setCounts] = useState<Record<string, { qty: number; confirmed: boolean }>>({});

  // Initialize counts when active cabinet or items change
  useEffect(() => {
    const initial: Record<string, { qty: number; confirmed: boolean }> = {};
    cabinetItems.forEach((it) => {
      initial[it.sku] = {
        qty: it.balance,
        confirmed: false,
      };
    });
    setCounts(initial);
  }, [cabinetItems, activeCabinet.id]);

  // Fast Issue State
  const [issueSku, setIssueSku] = useState<string>('');
  const [issueQty, setIssueQty] = useState<number>(1);
  const [techBadgeId, setTechBadgeId] = useState<string>('TECH-7491 (ช่างสมศักดิ์)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cabinetItems.length > 0 && !issueSku) {
      setIssueSku(cabinetItems[0].sku);
    }
  }, [cabinetItems, issueSku]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const updateCountQty = (sku: string, delta: number) => {
    const current = counts[sku]?.qty ?? 0;
    const nextQty = Math.max(0, current + delta);
    setCounts((prev) => ({
      ...prev,
      [sku]: {
        qty: nextQty,
        confirmed: false,
      },
    }));
  };

  const setCountDirect = (sku: string, val: number) => {
    const nextQty = Math.max(0, val);
    setCounts((prev) => ({
      ...prev,
      [sku]: {
        qty: nextQty,
        confirmed: false,
      },
    }));
  };

  const toggleConfirmItem = (sku: string) => {
    const current = counts[sku] || { qty: 0, confirmed: false };
    setCounts((prev) => ({
      ...prev,
      [sku]: {
        ...current,
        confirmed: !current.confirmed,
      },
    }));
  };

  const handleCabinetChange = (newCabId: string) => {
    setCurrentCabId(newCabId);
    if (onSelectCabinetId) onSelectCabinetId(newCabId);
    showToast(`สลับไปยัง ${newCabId} เรียบร้อย`);
  };

  const handleSubmitAudit = () => {
    // Collect updated counts
    const updatedBalanceMap: Record<string, number> = {};
    const diffs: string[] = [];

    cabinetItems.forEach((it) => {
      const counted = counts[it.sku]?.qty ?? it.balance;
      updatedBalanceMap[it.sku] = counted;
      const diff = counted - it.balance;
      if (diff !== 0) {
        diffs.push(`${it.name} (${diff > 0 ? '+' : ''}${diff})`);
      }
    });

    const diffSummary =
      diffs.length > 0
        ? `พบผลต่าง: ${diffs.join(', ')}`
        : `ยอดตรงทุกรายการ (${cabinetItems.length} รายการ)`;

    const summaryText = `ตรวจนับครบ ${cabinetItems.length} รายการ: ${diffSummary}`;

    onAuditCompleted(activeCabinet.id, summaryText, updatedBalanceMap);

    // Mark all as confirmed
    const confirmedAll: Record<string, { qty: number; confirmed: boolean }> = {};
    cabinetItems.forEach((it) => {
      confirmedAll[it.sku] = {
        qty: counts[it.sku]?.qty ?? it.balance,
        confirmed: true,
      };
    });
    setCounts(confirmedAll);

    showToast(`บันทึกการตรวจนับตู้ ${activeCabinet.id} สำเร็จ! ยอดสต็อกได้รับการอัปเดต`);
  };

  const handleConfirmIssue = () => {
    if (!techBadgeId.trim()) {
      alert('กรุณาระบุรหัสบัตรหรือชื่อช่างผู้เบิก');
      return;
    }
    if (!issueSku) {
      alert('กรุณาเลือกรายการที่ต้องการเบิก');
      return;
    }
    onItemIssued(issueSku, issueQty, techBadgeId);
    showToast(`เบิกจ่าย ${issueSku} จำนวน ${issueQty} สำเร็จ ให้แก่ ${techBadgeId}`);
  };

  const helperDisplayName =
    googleUser?.displayName || (googleUser?.email ? googleUser.email.split('@')[0] : 'เจ้าหน้าที่ Helper');

  return (
    <div className="flex-1 overflow-y-auto bg-[#071322] text-slate-100 flex flex-col min-h-screen">
      {/* TOP INDUSTRIAL HEADER */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
            <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">
                Ranong Operations • Helper Terminal
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                HELPER MODE
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate max-w-[280px] sm:max-w-md">
              <span className="text-slate-200 font-semibold">{helperDisplayName}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>พร้อมสแกน QR หน้าตู้</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* If NOT helper only, allow going back to dashboard */}
          {!isHelperOnly && onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="กลับไปหน้าหลัก Dashboard"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span className="hidden sm:inline">หน้าแดชบอร์ด</span>
            </button>
          )}

          {/* Quick Logout Button for Helper */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 text-xs font-semibold transition-all cursor-pointer"
              title="ออกจากระบบ Google (Sign Out)"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          )}
        </div>
      </header>

      {/* HELPER ROLE RESTRICTION BANNER */}
      {isHelperOnly && (
        <div className="bg-indigo-950/60 border-b border-indigo-900/80 px-4 py-2 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-base">verified_user</span>
            <span>
              <strong>เข้าสู่ระบบด้วยสิทธิ์ Helper:</strong> ได้รับสิทธิ์เฉพาะระบบสแกน QR ตรวจนับสต็อกหน้าตู้ และเบิกจ่ายด่วนเท่านั้น
            </span>
          </div>
          <span className="text-[10px] font-mono text-indigo-400 hidden md:inline">
            ZONE: ALL ASSIGNED LOCKERS
          </span>
        </div>
      )}

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-xl border border-emerald-400 font-bold text-xs flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN HELPER CONTENT */}
      <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        {/* SCAN / SELECT CABINET CONTROLLER */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                ตู้ที่กำลังตรวจนับปัจจุบัน (ACTIVE CABINET)
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-xl font-mono font-black text-white">{activeCabinet.id}</h2>
                <span className="text-sm font-bold text-slate-300">— {activeCabinet.name}</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {activeCabinet.zone} • ผู้ดูแล: {activeCabinet.responsibleEngineer}
              </div>
            </div>

            {/* SCAN QR BUTTON */}
            {onOpenScanQR && (
              <button
                onClick={onOpenScanQR}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-indigo-950 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                <span>📷 สแกน QR ตู้ใหม่</span>
              </button>
            )}
          </div>

          {/* Quick Cabinet Selector Dropdown */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 shrink-0 font-medium">สลับตู้ตรวจนับ:</span>
            <select
              value={currentCabId}
              onChange={(e) => handleCabinetChange(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              {cabinets.map((cab) => (
                <option key={cab.id} value={cab.id}>
                  {cab.id} — {cab.name} ({cab.zone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MODE TOGGLE TABS: COUNT vs. ISSUE */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveSubMode('count')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubMode === 'count'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">fact_check</span>
            <span>1. ตรวจนับสต็อก ({cabinetItems.length} รายการ)</span>
          </button>
          <button
            onClick={() => setActiveSubMode('issue')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubMode === 'issue'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">output</span>
            <span>2. เบิกของด่วนหน้าตู้</span>
          </button>
        </div>

        {/* SUB-VIEW 1: STOCK COUNT (ตรวจนับพัสดุในตู้) */}
        {activeSubMode === 'count' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>รายการวัสดุสิ้นเปลืองในตู้ {activeCabinet.id}</span>
              <span className="font-mono text-emerald-400 font-semibold">
                ตรวจยืนยันแล้ว{' '}
                {Object.values(counts).filter((c: { qty: number; confirmed: boolean }) => c.confirmed).length}/{cabinetItems.length} รายการ
              </span>
            </div>

            {cabinetItems.map((item) => {
              const currentCount = counts[item.sku]?.qty ?? item.balance;
              const isConfirmed = counts[item.sku]?.confirmed ?? false;
              const diff = currentCount - item.balance;

              return (
                <div
                  key={item.sku}
                  className={`bg-slate-900 border rounded-2xl p-5 space-y-3 transition-colors ${
                    isConfirmed
                      ? 'border-emerald-500/50 bg-slate-900/90'
                      : diff !== 0
                      ? 'border-amber-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          {item.sku}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-md bg-slate-800 text-slate-300 font-mono">
                          {item.spec}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1">{item.name}</h4>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>ช่องเก็บ: {item.shelfBin}</span>
                        <span>•</span>
                        <span>ยอดในระบบ: <strong className="text-slate-200">{item.balance} {item.unit}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleConfirmItem(item.sku)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          : diff !== 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isConfirmed
                        ? '✓ ยืนยันแล้ว'
                        : diff !== 0
                        ? `ต่าง (${diff > 0 ? '+' : ''}${diff}) กดยืนยัน`
                        : 'กดยืนยันยอด'}
                    </button>
                  </div>

                  {/* COUNTER CONTROLLER */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-xs text-slate-300 font-medium">ยอดที่นับได้จริง:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCountQty(item.sku, -5)}
                        className="px-2 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 active:scale-95 cursor-pointer"
                        title="ลดทีละ 5"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => updateCountQty(item.sku, -1)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-base text-white active:scale-95 flex items-center justify-center cursor-pointer"
                        title="ลดทีละ 1"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={currentCount}
                        onChange={(e) => setCountDirect(item.sku, parseInt(e.target.value) || 0)}
                        className="w-16 h-8 rounded-lg bg-slate-950 border border-slate-700 text-center font-mono font-bold text-white text-base focus:outline-hidden focus:border-indigo-400"
                      />
                      <button
                        onClick={() => updateCountQty(item.sku, 1)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-base text-white active:scale-95 flex items-center justify-center cursor-pointer"
                        title="เพิ่มทีละ 1"
                      >
                        +
                      </button>
                      <button
                        onClick={() => updateCountQty(item.sku, 5)}
                        className="px-2 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 active:scale-95 cursor-pointer"
                        title="เพิ่มทีละ 5"
                      >
                        +5
                      </button>
                      <span className="text-xs text-slate-400 pl-1">{item.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* SUBMIT BUTTON */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleSubmitAudit}
                className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 transition-all active:scale-[0.99] cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">cloud_upload</span>
                <span>บันทึกผลการตรวจนับตู้ {activeCabinet.id} (Submit &amp; Sync)</span>
              </button>

              {onOpenScanQR && (
                <button
                  onClick={onOpenScanQR}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                  <span>สแกน QR Code ตู้ถัดไป</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* SUB-VIEW 2: FAST ISSUE (เบิกของด่วนหน้าตู้) */}
        {activeSubMode === 'issue' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <span className="material-symbols-outlined text-indigo-400 text-lg">output</span>
              <span>เบิกจ่ายพัสดุด่วนหน้าตู้ {activeCabinet.id}</span>
            </h3>

            {/* Select Item to Issue */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                1. เลือกรายการพัสดุในตู้ {activeCabinet.id}:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {cabinetItems.map((item) => (
                  <label
                    key={item.sku}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      issueSku === item.sku
                        ? 'bg-indigo-950/60 border-indigo-500 text-white'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
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
                        <div className="text-xs font-bold">{item.name}</div>
                        <div className="text-[11px] font-mono text-indigo-400">{item.sku}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono">
                      คงเหลือ {item.balance} {item.unit}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300">2. จำนวนที่ต้องการเบิก:</label>
              <div className="flex items-center justify-center gap-4 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setIssueQty(Math.max(1, issueQty - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xl text-white active:scale-90 cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono text-2xl font-bold text-white w-20 text-center">
                  {issueQty}
                </span>
                <button
                  onClick={() => setIssueQty(issueQty + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xl text-white active:scale-90 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tech Badge / Job Reference */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300">
                3. รหัสบัตรช่าง / ใบงาน (Job/Badge ID):
              </label>
              <div className="flex gap-2">
                <input
                  value={techBadgeId}
                  onChange={(e) => setTechBadgeId(e.target.value)}
                  placeholder="เช่น TECH-7491 (ช่างสมศักดิ์)"
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <button
                  onClick={() => setTechBadgeId(`TECH-${Math.floor(1000 + Math.random() * 9000)} (ช่างประจำกะ)`)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>สุ่มบัตร</span>
                </button>
              </div>
            </div>

            {/* Confirm Issue Button */}
            <div className="pt-3">
              <button
                onClick={handleConfirmIssue}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition-all active:scale-[0.99] cursor-pointer"
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
