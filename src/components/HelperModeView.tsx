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
  onStartAudit?: (cabinetId: string) => void;
  isHelperOnly?: boolean;
  googleUser?: User | null;
  onLogout?: () => void;
}

// Robust cabinet-item matching logic
export const filterItemsForCabinet = (
  items: ConsumableItem[],
  cabinet: Cabinet
): ConsumableItem[] => {
  const normCabId = cabinet.id.toLowerCase().replace(/[\s-_]/g, '');
  const cleanCabCode = normCabId.replace('cab', '');
  const normCabName = cabinet.name.toLowerCase().replace(/[\s-_]/g, '');

  return items.filter((it) => {
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
};

export const HelperModeView: React.FC<HelperModeViewProps> = ({
  onBackToDashboard,
  onAuditCompleted,
  onItemIssued,
  items,
  cabinets,
  selectedCabinetId = 'CAB-C03',
  onSelectCabinetId,
  onOpenScanQR,
  onStartAudit,
  isHelperOnly = false,
  googleUser,
  onLogout,
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'count' | 'overview' | 'issue'>('count');
  const [currentCabId, setCurrentCabId] = useState<string>(selectedCabinetId);
  const [searchOverview, setSearchOverview] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [auditNote, setAuditNote] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync selectedCabinetId prop
  useEffect(() => {
    if (selectedCabinetId) {
      setCurrentCabId(selectedCabinetId);
    }
  }, [selectedCabinetId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Active cabinet object
  const activeCabinet = useMemo(() => {
    return (
      cabinets.find((c) => c.id === currentCabId) ||
      cabinets[0] || {
        id: 'CAB-C03',
        name: 'ตู้ C-03 (โซนงานเชื่อม)',
        zone: 'Zone C (งานเชื่อม)',
        zoneCode: 'Zone C',
        descriptionTh: 'ตู้จัดเก็บอุปกรณ์งานเชื่อมและเจียร',
        status: 'pending',
        statusTextTh: 'รอตรวจนับ',
        responsibleEngineer: 'วิศวกร ธนกร เจริญผล',
        qrCode: 'QR-RNG-CAB-C03',
        totalItems: 0,
        lowStockCount: 0,
        criticalCount: 0,
        lastAuditTime: 'วันนี้',
        auditor: 'Helper',
        items: [],
      }
    );
  }, [cabinets, currentCabId]);

  // Consumables in currently active cabinet
  const cabinetItems = useMemo(() => {
    return filterItemsForCabinet(items, activeCabinet);
  }, [items, activeCabinet]);

  // Compute summary for all cabinets (Items, total balance units, critical count)
  const allCabinetsStats = useMemo(() => {
    return cabinets.map((cab) => {
      const cabItems = filterItemsForCabinet(items, cab);
      const totalUnits = cabItems.reduce((acc, it) => acc + (it.balance || 0), 0);
      const criticalCount = cabItems.filter((it) => it.status === 'critical').length;
      const lowCount = cabItems.filter((it) => it.status === 'low').length;

      return {
        cabinet: cab,
        items: cabItems,
        totalItemsCount: cabItems.length,
        totalUnits,
        criticalCount,
        lowCount,
      };
    });
  }, [cabinets, items]);

  // Count state for active cabinet: SKU -> { qty: number; confirmed: boolean }
  const [counts, setCounts] = useState<Record<string, { qty: number; confirmed: boolean }>>({});

  // Initialize counts whenever active cabinet or its items change
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

  // Quick helper to adjust quantity
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

  const setMatchSystem = (sku: string, sysBalance: number) => {
    setCounts((prev) => ({
      ...prev,
      [sku]: {
        qty: sysBalance,
        confirmed: true,
      },
    }));
    showToast(`ยอดตรงตามระบบแล้ว (${sysBalance})`);
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

  // Confirm All Match Shortcut
  const handleConfirmAllMatch = () => {
    const confirmedAll: Record<string, { qty: number; confirmed: boolean }> = {};
    cabinetItems.forEach((it) => {
      confirmedAll[it.sku] = {
        qty: it.balance,
        confirmed: true,
      };
    });
    setCounts(confirmedAll);
    showToast(`ยืนยันยอดตรงตามระบบครบทุกรายการ (${cabinetItems.length} รายการ)`);
  };

  // Reset all counts to system balance
  const handleResetCounts = () => {
    const resetObj: Record<string, { qty: number; confirmed: boolean }> = {};
    cabinetItems.forEach((it) => {
      resetObj[it.sku] = {
        qty: it.balance,
        confirmed: false,
      };
    });
    setCounts(resetObj);
    showToast('รีเซ็ตยอดนับกลับเป็นค่าเริ่มต้นตามระบบแล้ว');
  };

  const handleCabinetChange = (newCabId: string) => {
    setCurrentCabId(newCabId);
    if (onSelectCabinetId) onSelectCabinetId(newCabId);
    showToast(`สลับไปยัง ${newCabId} เรียบร้อย`);
  };

  // Submit Audit
  const handleSubmitAudit = () => {
    const updatedBalanceMap: Record<string, number> = {};
    const diffs: string[] = [];

    cabinetItems.forEach((it) => {
      const counted = counts[it.sku]?.qty ?? it.balance;
      updatedBalanceMap[it.sku] = counted;
      const diff = counted - it.balance;
      if (diff !== 0) {
        diffs.push(`${it.name} (${diff > 0 ? '+' : ''}${diff} ${it.unit})`);
      }
    });

    const diffSummary =
      diffs.length > 0
        ? `พบผลต่าง ${diffs.length} รายการ: ${diffs.join(', ')}`
        : `ยอดตรงทุกรายการ (${cabinetItems.length} รายการ)`;

    const notePart = auditNote.trim() ? ` [หมายเหตุ: ${auditNote.trim()}]` : '';
    const summaryText = `ตรวจนับครบ ${cabinetItems.length} รายการ: ${diffSummary}${notePart}`;

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
    setAuditNote('');

    showToast(`บันทึกการตรวจนับตู้ ${activeCabinet.id} สำเร็จ! ยอดสต็อกได้รับการอัปเดต`);
  };

  // Fast Issue State
  const [issueSku, setIssueSku] = useState<string>('');
  const [issueQty, setIssueQty] = useState<number>(1);
  const [techBadgeId, setTechBadgeId] = useState<string>('TECH-7491 (ช่างสมศักดิ์)');

  useEffect(() => {
    if (cabinetItems.length > 0 && !issueSku) {
      setIssueSku(cabinetItems[0].sku);
    }
  }, [cabinetItems, issueSku]);

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
    googleUser?.displayName ||
    (googleUser?.email ? googleUser.email.split('@')[0] : 'เจ้าหน้าที่ Helper');

  // Stats for active cabinet count
  const confirmedCount = Object.values(counts).filter(
    (c: { qty: number; confirmed: boolean }) => c.confirmed
  ).length;
  const totalBalanceInActiveCabinet = cabinetItems.reduce((acc, it) => acc + (it.balance || 0), 0);
  const criticalInActiveCabinet = cabinetItems.filter((it) => it.status === 'critical').length;
  const lowInActiveCabinet = cabinetItems.filter((it) => it.status === 'low').length;

  // Filtered cabinets for the All Cabinets Overview Tab
  const filteredCabinetsOverview = useMemo(() => {
    return allCabinetsStats.filter(({ cabinet, items: cabItems }) => {
      // Zone match
      if (zoneFilter !== 'all' && !cabinet.zoneCode.toLowerCase().includes(zoneFilter.toLowerCase()) && !cabinet.zone.toLowerCase().includes(zoneFilter.toLowerCase())) {
        return false;
      }
      // Search query match (either cabinet name/id OR any contained item name/sku)
      if (searchOverview.trim()) {
        const q = searchOverview.trim().toLowerCase();
        const cabMatch = cabinet.name.toLowerCase().includes(q) || cabinet.id.toLowerCase().includes(q) || cabinet.zone.toLowerCase().includes(q);
        const itemMatch = cabItems.some((it) => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q) || it.spec.toLowerCase().includes(q));
        return cabMatch || itemMatch;
      }
      return true;
    });
  }, [allCabinetsStats, zoneFilter, searchOverview]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#071322] text-slate-100 flex flex-col min-h-screen">
      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl border border-indigo-500/50 text-xs font-semibold flex items-center gap-2.5 animate-bounce">
          <span className="material-symbols-outlined text-base text-indigo-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP INDUSTRIAL HEADER */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
            <span className="material-symbols-outlined text-xl">fact_check</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">
                Ranong Consumables • Helper Terminal
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                HELPER MODE
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate max-w-[280px] sm:max-w-md">
              <span className="text-slate-200 font-semibold">{helperDisplayName}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>พร้อมสแกน QR ตรวจนับสต็อก</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="ออกจากระบบ"
            >
              <span className="material-symbols-outlined text-base text-red-400">logout</span>
              <span className="hidden sm:inline">ออก</span>
            </button>
          )}
        </div>
      </header>

      {/* QUICK CABINET SELECTOR & OVERVIEW BAR (เห็นภาพรวมของแต่ละตู้ทันที) */}
      <section className="bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-indigo-400">inventory_2</span>
                <span>ตู้พัสดุทั้งหมด ({cabinets.length} ตู้)</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                แตะเพื่อสลับไปตรวจนับตู้นั้นทันที
              </span>
            </div>
            {onOpenScanQR && (
              <button
                onClick={onOpenScanQR}
                className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                <span>สแกน QR ตู้</span>
              </button>
            )}
          </div>

          {/* Horizontal scrollable cards for all cabinets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
            {allCabinetsStats.map(({ cabinet: cab, items: cabItems, totalUnits, criticalCount, lowCount }) => {
              const isSelected = cab.id === currentCabId;

              return (
                <button
                  key={cab.id}
                  onClick={() => {
                    handleCabinetChange(cab.id);
                    if (activeSubMode === 'overview') {
                      setActiveSubMode('count');
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <div className="font-mono text-xs font-black tracking-tight text-white flex items-center gap-1">
                      <span>{cab.id}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                      )}
                    </div>
                    {criticalCount > 0 ? (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-red-900/60 text-red-300 font-bold border border-red-700/50">
                        วิกฤต {criticalCount}
                      </span>
                    ) : lowCount > 0 ? (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-900/60 text-amber-300 font-bold border border-amber-700/50">
                        ใกล้หมด {lowCount}
                      </span>
                    ) : (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900/40 text-emerald-400 font-medium">
                        ปกติ
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-300 font-semibold truncate mt-1">
                    {cab.name.replace(/ตู้\s*[A-Z0-9-]+\s*/, '')}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-800/70 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {cabItems.length} รายการ
                    </span>
                    <span className="font-mono text-indigo-300 font-bold">
                      {totalUnits} หน่วย
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-4 flex-1">
        {/* MODE TOGGLE TABS */}
        <div className="grid grid-cols-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <button
            onClick={() => setActiveSubMode('count')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubMode === 'count'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">checklist</span>
            <span>1. ตรวจนับตู้ {activeCabinet.id} ({cabinetItems.length})</span>
          </button>
          <button
            onClick={() => setActiveSubMode('overview')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubMode === 'overview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">analytics</span>
            <span>2. ดูสต็อกทุกตู้ ({cabinets.length})</span>
          </button>
          <button
            onClick={() => setActiveSubMode('issue')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubMode === 'issue'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">output</span>
            <span>3. เบิกของด่วน</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* SUB-VIEW 1: STOCK COUNT (ตรวจนับพัสดุในตู้ที่เลือก)       */}
        {/* ========================================================= */}
        {activeSubMode === 'count' && (
          <div className="space-y-4">
            {/* CABINET BANNER */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs font-extrabold border border-indigo-500/30">
                      {activeCabinet.id}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                      {activeCabinet.zone}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      QR: {activeCabinet.qrCode}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {activeCabinet.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeCabinet.descriptionTh || 'ตู้จัดเก็บวัสดุสิ้นเปลืองประจำโซน'} • ผู้ดูแล:{' '}
                    <strong className="text-slate-300">{activeCabinet.responsibleEngineer}</strong>
                  </p>
                </div>

                {/* Right Quick Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {onStartAudit && (
                    <button
                      onClick={() => onStartAudit(activeCabinet.id)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-transform active:scale-[0.98] cursor-pointer"
                      title="เปิดหน้าตรวจนับสต็อกแบบเต็มจอ"
                    >
                      <span className="material-symbols-outlined text-base text-indigo-400">fullscreen</span>
                      <span>โหมดเต็มจอ</span>
                    </button>
                  )}
                  {onOpenScanQR && (
                    <button
                      onClick={onOpenScanQR}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-[0.98] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                      <span>สแกนตู้ใหม่</span>
                    </button>
                  )}
                </div>
              </div>

              {/* STATS BAR OF THIS CABINET */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60">
                  <div className="text-[11px] text-slate-400">รายการในตู้</div>
                  <div className="text-base font-bold text-white font-mono">
                    {cabinetItems.length} <span className="text-xs font-normal text-slate-400">SKUs</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60">
                  <div className="text-[11px] text-slate-400">ยอดสต็อกรวมในระบบ</div>
                  <div className="text-base font-bold text-indigo-300 font-mono">
                    {totalBalanceInActiveCabinet} <span className="text-xs font-normal text-slate-400">หน่วย</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60">
                  <div className="text-[11px] text-slate-400">สต็อกใกล้หมด / วิกฤต</div>
                  <div className="text-base font-bold font-mono">
                    {criticalInActiveCabinet > 0 ? (
                      <span className="text-red-400">วิกฤต {criticalInActiveCabinet} รายการ</span>
                    ) : lowInActiveCabinet > 0 ? (
                      <span className="text-amber-400">ใกล้หมด {lowInActiveCabinet} รายการ</span>
                    ) : (
                      <span className="text-emerald-400">สต็อกปกติทุกรายการ</span>
                    )}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60">
                  <div className="text-[11px] text-slate-400">ความคืบหน้าการนับ</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    {confirmedCount}/{cabinetItems.length}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({cabinetItems.length > 0 ? Math.round((confirmedCount / cabinetItems.length) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* QUICK ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConfirmAllMatch}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">done_all</span>
                    <span>⚡ ยืนยันยอดตรงทุกรายการ</span>
                  </button>
                  <button
                    onClick={handleResetCounts}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span>รีเซ็ต</span>
                  </button>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  ตรวจยืนยันแล้ว <strong className="text-emerald-400">{confirmedCount}</strong> จาก{' '}
                  <strong className="text-white">{cabinetItems.length}</strong> รายการ
                </div>
              </div>
            </div>

            {/* LIST OF CONSUMABLES TO AUDIT */}
            <div className="space-y-3">
              {cabinetItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
                  <span className="material-symbols-outlined text-4xl text-slate-600">inventory_2</span>
                  <div className="text-sm font-semibold text-white">ไม่พบรายการพัสดุในตู้ {activeCabinet.id}</div>
                  <div className="text-xs text-slate-500">กรุณาเลือกตู้พัสดุอื่นจากแถบด้านบน</div>
                </div>
              ) : (
                cabinetItems.map((item) => {
                  const currentCount = counts[item.sku]?.qty ?? item.balance;
                  const isConfirmed = counts[item.sku]?.confirmed ?? false;
                  const diff = currentCount - item.balance;

                  return (
                    <div
                      key={item.sku}
                      className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 space-y-3 transition-all ${
                        isConfirmed
                          ? 'border-emerald-500/50 bg-slate-900/95 ring-1 ring-emerald-500/20'
                          : diff !== 0
                          ? 'border-amber-500/50 bg-slate-900'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Item Header Info */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400">
                              {item.sku}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                              {item.spec}
                            </span>
                            {item.status === 'critical' && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-red-900/50 text-red-300 font-bold border border-red-700/50">
                                วิกฤต
                              </span>
                            )}
                            {item.status === 'low' && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-900/50 text-amber-300 font-bold border border-amber-700/50">
                                สต็อกใกล้หมด
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-white">{item.name}</h4>
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="flex items-center gap-1 text-slate-300">
                              <span className="material-symbols-outlined text-sm text-indigo-400">shelves</span>
                              <span>ช่องเก็บ: <strong>{item.cabinetShelf || 'ชั้นทั่วไป'}</strong></span>
                            </span>
                            <span>•</span>
                            <span>ยอดในระบบ: <strong className="text-slate-100 font-mono text-xs">{item.balance} {item.unit}</strong></span>
                            <span>•</span>
                            <span>Safety Min: <strong className="text-slate-400 font-mono">{item.safetyMin} {item.unit}</strong></span>
                          </div>
                        </div>

                        {/* Status Diff Badge & Match Button */}
                        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                          <button
                            onClick={() => setMatchSystem(item.sku, item.balance)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-indigo-300 transition-all cursor-pointer"
                            title="ปรับยอดนับให้ตรงกับยอดระบบทันที"
                          >
                            ✓ ยอดตรง ({item.balance})
                          </button>
                          <button
                            onClick={() => toggleConfirmItem(item.sku)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                      </div>

                      {/* COUNTER CONTROLLER */}
                      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-300 font-semibold">ยอดที่นับได้จริง:</span>
                          {diff === 0 ? (
                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-sm">check</span>
                              <span>ตรงตามระบบ</span>
                            </span>
                          ) : diff < 0 ? (
                            <span className="text-xs text-red-400 font-semibold font-mono flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-sm">arrow_downward</span>
                              <span>ขาด {Math.abs(diff)} {item.unit}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-cyan-400 font-semibold font-mono flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-sm">arrow_upward</span>
                              <span>เกิน +{diff} {item.unit}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCountQty(item.sku, -10)}
                            className="px-2 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 active:scale-95 cursor-pointer"
                            title="ลดทีละ 10"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => updateCountQty(item.sku, -1)}
                            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-lg text-white active:scale-95 flex items-center justify-center cursor-pointer"
                            title="ลดทีละ 1"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={currentCount}
                            onChange={(e) => setCountDirect(item.sku, parseInt(e.target.value) || 0)}
                            className="w-20 h-9 rounded-xl bg-slate-950 border border-slate-700 text-center font-mono font-bold text-white text-base focus:outline-hidden focus:border-indigo-400"
                          />
                          <button
                            onClick={() => updateCountQty(item.sku, 1)}
                            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-lg text-white active:scale-95 flex items-center justify-center cursor-pointer"
                            title="เพิ่มทีละ 1"
                          >
                            +
                          </button>
                          <button
                            onClick={() => updateCountQty(item.sku, 10)}
                            className="px-2 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 active:scale-95 cursor-pointer"
                            title="เพิ่มทีละ 10"
                          >
                            +10
                          </button>
                          <span className="text-xs font-semibold text-slate-300 pl-1 w-10">
                            {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* AUDIT NOTE & SUBMIT SECTION */}
            {cabinetItems.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-indigo-400">edit_note</span>
                    <span>บันทึกหมายเหตุหน้างานตู้ {activeCabinet.id} (Audit Note / Condition):</span>
                  </label>
                  <input
                    type="text"
                    value={auditNote}
                    onChange={(e) => setAuditNote(e.target.value)}
                    placeholder="เช่น สภาพตู้เรียบร้อย, มีรอยเปื้อนน้ำมันเล็กน้อย, จัดเรียงตามช่องเก็บแล้ว"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-400"
                  />
                </div>

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
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-VIEW 2: ALL CABINETS OVERVIEW (ตรวจเช็คยอดทุกตู้)     */}
        {/* ========================================================= */}
        {activeSubMode === 'overview' && (
          <div className="space-y-4">
            {/* OVERVIEW HEADER & SEARCH BAR */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 text-lg">fact_check</span>
                    <span>ตารางสรุปวัสดุสิ้นเปลืองในแต่ละตู้ (All Cabinets Stock Summary)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ตรวจสอบจำนวนพัสดุ ยอดคงเหลือ และตำแหน่งช่องเก็บของทุกตู้เพื่อเตรียมตรวจนับ
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    รวมทั้งสิ้น <strong className="text-white">{items.length}</strong> รายการใน{' '}
                    <strong className="text-indigo-300">{cabinets.length}</strong> ตู้
                  </span>
                </div>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="sm:col-span-2 relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchOverview}
                    onChange={(e) => setSearchOverview(e.target.value)}
                    placeholder="ค้นหาชื่อพัสดุ, SKU, หรือสเปก เช่น ถุงมือ, ใบตัด, น้ำมัน..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-400"
                  />
                  {searchOverview && (
                    <button
                      onClick={() => setSearchOverview('')}
                      className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-hidden focus:border-indigo-400"
                  >
                    <option value="all">ทุกโซน (All Zones)</option>
                    <option value="Zone A">Zone A - ซ่อมบำรุง</option>
                    <option value="Zone B">Zone B - ฝ่ายผลิต/สารเคมี</option>
                    <option value="Zone C">Zone C - งานเชื่อม</option>
                    <option value="Zone D">Zone D - ห้องแล็บ/คลัง</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ACCORDION/CARDS FOR EACH CABINET */}
            <div className="space-y-4">
              {filteredCabinetsOverview.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
                  <span className="material-symbols-outlined text-4xl text-slate-600">search_off</span>
                  <div className="text-sm font-semibold text-white">ไม่พบข้อมูลที่ตรงกับคำค้นหา "{searchOverview}"</div>
                  <button
                    onClick={() => {
                      setSearchOverview('');
                      setZoneFilter('all');
                    }}
                    className="text-xs text-indigo-400 underline hover:text-indigo-300"
                  >
                    ล้างการค้นหา
                  </button>
                </div>
              ) : (
                filteredCabinetsOverview.map(({ cabinet: cab, items: cabItems, totalUnits, criticalCount, lowCount }) => {
                  return (
                    <div
                      key={cab.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-700 transition-colors"
                    >
                      {/* Cabinet Card Header */}
                      <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                              {cab.id}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-white">
                              {cab.name}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                              {cab.zone}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {cab.descriptionTh} • ผู้ดูแล:{' '}
                            <span className="text-slate-300 font-medium">{cab.responsibleEngineer}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-indigo-300">
                              {cabItems.length} รายการ ({totalUnits} หน่วย)
                            </div>
                            <div className="text-[11px] font-medium">
                              {criticalCount > 0 ? (
                                <span className="text-red-400 font-bold">วิกฤต {criticalCount} รายการ</span>
                              ) : lowCount > 0 ? (
                                <span className="text-amber-400 font-bold">ใกล้หมด {lowCount} รายการ</span>
                              ) : (
                                <span className="text-emerald-400">สต็อกปกติ</span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              handleCabinetChange(cab.id);
                              setActiveSubMode('count');
                            }}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">checklist</span>
                            <span>เปิดตรวจนับตู้นี้</span>
                          </button>
                        </div>
                      </div>

                      {/* Items Table / List in this cabinet */}
                      <div className="p-4 sm:p-5 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-800 font-semibold">
                              <th className="pb-2 pl-2">รหัส SKU &amp; พัสดุ</th>
                              <th className="pb-2">สเปก / รุ่น</th>
                              <th className="pb-2">ช่องเก็บในตู้</th>
                              <th className="pb-2 text-right">ยอดในระบบ</th>
                              <th className="pb-2 text-right">Min</th>
                              <th className="pb-2 text-center pr-2">สถานะ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-medium">
                            {cabItems.map((item) => (
                              <tr key={item.sku} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-2.5 pl-2">
                                  <div className="font-bold text-white">{item.name}</div>
                                  <div className="font-mono text-[11px] text-indigo-400">{item.sku}</div>
                                </td>
                                <td className="py-2.5 text-slate-300 text-[11px] max-w-[220px] truncate">
                                  {item.spec}
                                </td>
                                <td className="py-2.5 text-slate-300">
                                  <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[11px] border border-slate-700/60">
                                    {item.cabinetShelf || 'ชั้นทั่วไป'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-mono font-bold text-white text-sm">
                                  {item.balance} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                                </td>
                                <td className="py-2.5 text-right font-mono text-slate-400 text-xs">
                                  {item.safetyMin} {item.unit}
                                </td>
                                <td className="py-2.5 text-center pr-2">
                                  {item.status === 'critical' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-800">
                                      วิกฤต
                                    </span>
                                  ) : item.status === 'low' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                                      ใกล้หมด
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                                      ปกติ
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-VIEW 3: FAST ISSUE (เบิกของด่วนหน้าตู้)               */}
        {/* ========================================================= */}
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
                        ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500/40'
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
                        <div className="text-[11px] font-mono text-indigo-400">
                          {item.sku} • ช่องเก็บ: {item.cabinetShelf}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-200">
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
