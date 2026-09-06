import React, { useState } from 'react';
import { ConsumableItem, DepartmentSummary, QuickPRItem, AuditFeedItem, StockStatus } from '../types';

interface StockTriageViewProps {
  items: ConsumableItem[];
  departmentSummaries: DepartmentSummary[];
  draftPR: QuickPRItem[];
  auditFeed: AuditFeedItem[];
  onOpenQuickIssue: () => void;
  onOpenSheetsModal: () => void;
  onExportCSV: () => void;
  onAddItemToPR: (item: ConsumableItem) => void;
  onRemovePRItem: (id: string) => void;
  onUpdatePRQty: (id: string, delta: number) => void;
  onSubmitPR: () => void;
  searchQuery: string;
}

export const StockTriageView: React.FC<StockTriageViewProps> = ({
  items,
  departmentSummaries,
  draftPR,
  auditFeed,
  onOpenQuickIssue,
  onOpenSheetsModal,
  onExportCSV,
  onAddItemToPR,
  onRemovePRItem,
  onUpdatePRQty,
  onSubmitPR,
  searchQuery,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedCabinet, setSelectedCabinet] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(['csm-1', 'csm-2', 'csm-5'])
  );
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Filter items
  const filteredItems = items.filter((it) => {
    if (selectedDept && it.department !== selectedDept) return false;
    if (selectedCabinet && it.cabinetId !== selectedCabinet) return false;
    if (selectedStatus && it.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        it.name.toLowerCase().includes(q) ||
        it.sku.toLowerCase().includes(q) ||
        it.spec.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItemIds(next);
  };

  const totalPRCost = draftPR.reduce((sum, item) => sum + item.qty * item.estimatedPrice, 0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <main className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50">
      {/* PAGE TITLE & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-indigo-600 text-2xl lg:text-3xl">analytics</span>
              <span>Admin Consumables Dashboard &amp; Department Overview</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ระบบเชื่อมต่อออนไลน์
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ภาพรวมการใช้วัสดุสิ้นเปลือง แยกตามฝ่ายปฏิบัติการ ท่าเรือระนอง (Terminal 04) พร้อมระบบติดตามสต็อกและสั่งซื้อด่วน (Quick PR)
          </p>
        </div>

        {/* Top Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSheetsModal}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            title="Google Sheets Live Synchronization"
          >
            <span className="material-symbols-outlined text-base text-emerald-600">table_chart</span>
            <span>ซิงค์ Sheets</span>
          </button>
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span className={`material-symbols-outlined text-base ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`}>
              refresh
            </span>
            <span>รีเฟรชข้อมูล</span>
          </button>
          <button
            onClick={onSubmitPR}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-100 transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-base">post_add</span>
            <span>สร้างใบจัดซื้อ (PR)</span>
          </button>
        </div>
      </div>

      {/* TOP KPIS BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Items */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">สต็อกทั้งหมด (TOTAL ITEMS)</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <span className="material-symbols-outlined text-xl">all_inbox</span>
            </div>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-slate-900">
              1,248 <span className="font-sans text-sm font-normal text-slate-500">รายการ</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-emerald-600">check_circle</span>
              <span>ครอบคลุม 4 แผนกซ่อมบำรุง</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Low Stock Alert */}
        <div className="bg-white border border-rose-200 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white to-rose-50/30 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-rose-600">
              สินค้าใกล้หมด ต้องสั่งซื้อ (LOW STOCK)
            </span>
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
              <span className="material-symbols-outlined text-xl">warning</span>
            </div>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-rose-600">
              8 <span className="font-sans text-sm font-normal text-rose-700">รายการวิกฤต</span>
            </div>
            <div className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-xs">priority_high</span>
              <span>3 รายการต่ำกว่าจุดความปลอดภัยขั้นสุด</span>
            </div>
          </div>
        </div>

        {/* KPI 3: In-flight POs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              กำลังดำเนินการจัดซื้อ (IN-FLIGHT POS)
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <span className="material-symbols-outlined text-xl">pending_actions</span>
            </div>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-slate-900">
              4 <span className="font-sans text-sm font-normal text-slate-500">รายการ (PO)</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-sky-600">local_shipping</span>
              <span>กำหนดส่งมอบภายใน 48 ชม.</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Counted Today */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">ตรวจนับวันนี้แล้ว (AUDITED TODAY)</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <span className="material-symbols-outlined text-xl">fact_check</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="font-mono text-3xl font-bold text-slate-900">
                18/24 <span className="font-sans text-sm font-normal text-slate-500">ตู้</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">75%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* DEPARTMENT CONSUMABLES OVERVIEW BANNER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-indigo-400">pie_chart</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  ภาพรวมการใช้วัสดุสิ้นเปลือง (Consumables Overview by Department)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  ประจำเดือนนี้
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                สัดส่วนการเบิกใช้, มูลค่ารวม, รายการพัสดุใช้บ่อย และสถานะความพร้อมสต็อกของแต่ละแผนกปฏิบัติการ
              </p>
            </div>
          </div>

          {/* Timeframe selector & export */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === 'month' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                เดือนนี้
              </button>
              <button
                onClick={() => setTimeframe('quarter')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === 'quarter' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ไตรมาสนี้
              </button>
              <button
                onClick={() => setTimeframe('year')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === 'year' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ปี 2024
              </button>
            </div>
            <button
              onClick={onExportCSV}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 text-slate-700 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>รายงานแผนก</span>
            </button>
          </div>
        </div>

        {/* Budget Allocation Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span className="font-bold tracking-wider uppercase">สัดส่วนการจัดสรรการเบิกจ่าย (CONSUMABLE BUDGET ALLOCATION)</span>
            <span className="font-mono font-semibold text-slate-900">ยอดรวม ฿342,800 (1,420 หน่วย)</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
            <div className="bg-amber-500 h-full transition-all" style={{ width: '42%' }} title="ซ่อมบำรุง 42%"></div>
            <div className="bg-indigo-600 h-full transition-all" style={{ width: '28%' }} title="ฝ่ายผลิต 28%"></div>
            <div className="bg-sky-500 h-full transition-all" style={{ width: '18%' }} title="ควบคุมคุณภาพ QA/QC 18%"></div>
            <div className="bg-emerald-500 h-full transition-all" style={{ width: '12%' }} title="ขนส่ง &amp; ท่าเทียบเรือ 12%"></div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="font-medium text-slate-800">ซ่อมบำรุงเครื่องจักร (Maintenance)</span>
              <span className="font-mono font-bold text-amber-600">42% (฿143,970)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span className="font-medium text-slate-800">ฝ่ายผลิต/หน้าลาน (Production)</span>
              <span className="font-mono font-bold text-indigo-600">28% (฿95,980)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span className="font-medium text-slate-800">ควบคุมคุณภาพ (QA/QC)</span>
              <span className="font-mono font-bold text-sky-600">18% (฿61,700)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-800">คลังสินค้า &amp; ท่าเรือ (Logistics)</span>
              <span className="font-mono font-bold text-emerald-600">12% (฿41,150)</span>
            </div>
          </div>
        </div>

        {/* 4 Department Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {departmentSummaries.map((dept) => (
            <div
              key={dept.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between space-y-3 hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${dept.colorClass}`}></span>
                  <h4 className="text-sm font-bold text-slate-900">{dept.thName}</h4>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${dept.badgeBg} ${dept.badgeText}`}>
                  {dept.statusTextTh}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">การเบิกใช้เดือนนี้:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{dept.units} หน่วย</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">มูลค่าเบิกใช้:</span>
                  <span className="font-mono font-medium text-xs text-slate-900">฿{dept.budget.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="text-[11px] text-slate-500 mb-1">พัสดุยอดนิยม:</div>
                  {dept.topItems.map((item, idx) => (
                    <div key={idx} className="text-xs font-medium text-slate-700 truncate">
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">ตู้หลัก: {dept.primaryCabinet}</span>
                <span className={`font-semibold ${dept.criticalTextTh.includes('พร้อม') ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {dept.criticalTextTh}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* URGENT REORDER ALERT BANNER */}
      {!alertDismissed && (
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl mt-0.5 shrink-0">
              notification_important
            </span>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                แจ้งเตือนด่วน: รายการพัสดุใกล้หมดคลัง 3 ชนิดสำคัญ
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                ถุงมือไนไตรล์ Size L, น้ำยาหล่อเย็นเครื่องจักรหนัก, และ ใบตัด 4 นิ้ว สต็อกต่ำกว่า Safety Stock เสี่ยงกระทบงานซ่อมบำรุงท่าเรือ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSubmitPR}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-transform active:scale-[0.98] shadow-xs"
            >
              <span className="material-symbols-outlined text-base">bolt</span>
              <span>เปิดใบสั่งซื้อด่วน (Quick PR)</span>
            </button>
            <button
              onClick={() => setAlertDismissed(true)}
              className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
              title="ปิดการแจ้งเตือน"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT SPLIT: TABLE (8 COLS) + QUICK REORDER DRAWER (4 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT 8 COLS: FILTER BAR + TABLE */}
        <div className="xl:col-span-8 flex flex-col space-y-4">
          {/* FILTER & SEARCH BAR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search Inside Table */}
              <div className="relative flex-1 min-w-[180px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => {}}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="พิมพ์ชื่อของ หรือ SKU..."
                  type="text"
                />
              </div>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                <option value="">ทุกแผนก (All Departments)</option>
                <option value="Maintenance">Maintenance (ซ่อมบำรุง)</option>
                <option value="Production">Production (ปฏิบัติการ)</option>
                <option value="QA/QC">QA/QC (ควบคุมคุณภาพ)</option>
                <option value="Safety">Safety (ความปลอดภัย)</option>
              </select>

              {/* Cabinet Selector */}
              <select
                value={selectedCabinet}
                onChange={(e) => setSelectedCabinet(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                <option value="">ตู้จัดเก็บทั้งหมด (A1 - D4)</option>
                <option value="ตู้ A-01">ตู้ A-01 (Main Mech)</option>
                <option value="ตู้ B-02">ตู้ B-02 (Safety &amp; Lab)</option>
                <option value="ตู้ C-03">ตู้ C-03 (Consumables)</option>
                <option value="ตู้ D-04">ตู้ D-04 (Heavy Tooling)</option>
                <option value="ตู้ QA-01">ตู้ QA-01 (Lab Chem)</option>
              </select>

              {/* Stock Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                <option value="">ทุกสถานะสต็อก</option>
                <option value="critical">🔴 วิกฤต (Critical)</option>
                <option value="low">🟡 ใกล้หมด (Low Stock)</option>
                <option value="normal">🟢 ปกติ (In Stock)</option>
              </select>
            </div>

            {/* Table Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSheetsModal}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                title="Google Sheets Sync"
              >
                <span className="material-symbols-outlined text-lg text-emerald-600">table_view</span>
              </button>
              <button
                onClick={onExportCSV}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                title="ดาวน์โหลด Excel/CSV"
              >
                <span className="material-symbols-outlined text-lg">download</span>
              </button>
            </div>
          </div>

          {/* COMPREHENSIVE INVENTORY TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 pl-4 pr-2 w-10">
                      <input
                        checked={selectedItemIds.size > 0 && selectedItemIds.size === filteredItems.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        type="checkbox"
                      />
                    </th>
                    <th className="py-3.5 px-3">รหัสพัสดุ (SKU)</th>
                    <th className="py-3.5 px-3">ชื่อรายการ &amp; สเปกพัสดุ</th>
                    <th className="py-3.5 px-3">แผนก &amp; ตู้จัดเก็บ</th>
                    <th className="py-3.5 px-3">คงเหลือ / Safety Min</th>
                    <th className="py-3.5 px-3 text-center">สถานะ</th>
                    <th className="py-3.5 px-3">ตรวจนับล่าสุด</th>
                    <th className="py-3.5 pr-4 pl-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredItems.map((item) => {
                    const isChecked = selectedItemIds.has(item.id);
                    const percentage = Math.min(100, Math.round((item.balance / item.safetyMin) * 100));

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isChecked ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 pl-4 pr-2">
                          <input
                            checked={isChecked}
                            onChange={() => toggleSelectItem(item.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            type="checkbox"
                          />
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.sku}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-xs text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500">{item.spec}</div>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.department === 'QA/QC'
                                  ? 'bg-sky-500'
                                  : item.department === 'Maintenance'
                                  ? 'bg-amber-500'
                                  : item.department === 'Production'
                                  ? 'bg-indigo-600'
                                  : 'bg-emerald-500'
                              }`}
                            ></span>
                            {item.department}
                          </span>
                          <div className="text-[11px] font-mono text-slate-500">
                            {item.cabinetId} ({item.cabinetShelf})
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center justify-between font-mono text-xs mb-1">
                            <span
                              className={`font-bold ${
                                item.status === 'critical'
                                  ? 'text-rose-600'
                                  : item.status === 'low'
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {item.balance}
                            </span>
                            <span className="text-slate-400">/ {item.safetyMin} {item.unit}</span>
                          </div>
                          <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                item.status === 'critical'
                                  ? 'bg-rose-500'
                                  : item.status === 'low'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {item.status === 'critical' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              🔴 วิกฤต (Critical)
                            </span>
                          )}
                          {item.status === 'low' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              🟡 ใกล้หมด (Low)
                            </span>
                          )}
                          {item.status === 'normal' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              🟢 ปกติ (Normal)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="text-xs text-slate-900 font-medium">{item.lastAuditedBy}</div>
                          <div className="text-[11px] text-slate-500">{item.lastAuditedTime}</div>
                        </td>
                        <td className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">
                          {item.status === 'critical' ? (
                            <button
                              onClick={() => onAddItemToPR(item)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px] transition-colors shadow-2xs"
                            >
                              สั่งซื้อด่วน
                            </button>
                          ) : item.status === 'low' ? (
                            <button
                              onClick={() => onAddItemToPR(item)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold text-[11px] transition-colors"
                            >
                              สั่งซื้อ
                            </button>
                          ) : (
                            <button
                              onClick={onOpenQuickIssue}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-semibold text-[11px] transition-colors"
                            >
                              เบิกใช้
                            </button>
                          )}
                          <button
                            onClick={() => alert(`ประวัติการเบิกจ่าย: ${item.name} (${item.sku})\n• ล่าสุด: เบิก 5 ${item.unit} โดยช่างซ่อมกะ A\n• คงเหลือปัจจุบัน: ${item.balance} ${item.unit}`)}
                            className="p-1 text-slate-400 hover:text-slate-700 ml-1 rounded"
                            title="ดูประวัติเบิก"
                          >
                            <span className="material-symbols-outlined text-base">history</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER */}
            <div className="px-4 py-3.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                แสดง <strong>1 - {filteredItems.length}</strong> จากทั้งหมด <strong>1,248</strong> รายการ (เลือกแล้ว {selectedItemIds.size} รายการ)
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40" disabled>
                  <span className="material-symbols-outlined text-xs">chevron_left</span>
                </button>
                <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium text-xs">1</button>
                <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-700 text-xs">2</button>
                <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-700 text-xs">3</button>
                <span className="px-1 text-xs text-slate-400">...</span>
                <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-700 text-xs">50</button>
                <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: QUICK REORDER CART & SUMMARY DRAWER */}
        <div className="xl:col-span-4 flex flex-col space-y-4">
          {/* REQUISITION CART PANEL */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <span className="material-symbols-outlined text-xl text-white">
                    shopping_cart_checkout
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">รายการขอจัดซื้อด่วน (Quick PR)</h3>
                  <span className="text-[11px] font-medium text-slate-500">DRAFT PR #RNG-2024-089</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {draftPR.length} รายการ
              </span>
            </div>

            {/* Items Pending PR */}
            <div className="py-4 space-y-3">
              {draftPR.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[11px] text-indigo-600 font-bold">{item.sku}</span>
                      <h5 className="text-xs font-semibold text-slate-900 leading-snug">{item.name}</h5>
                    </div>
                    <button
                      onClick={() => onRemovePRItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="ลบออกจาก PR"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">ขอสั่งซื้อเพิ่ม:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdatePRQty(item.id, -5)}
                        className="w-6 h-6 rounded-md border border-slate-200 bg-white flex items-center justify-center font-bold hover:bg-slate-100 text-slate-700 transition-colors"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {item.qty} {item.unit}
                      </span>
                      <button
                        onClick={() => onUpdatePRQty(item.id, 5)}
                        className="w-6 h-6 rounded-md border border-slate-200 bg-white flex items-center justify-center font-bold hover:bg-slate-100 text-slate-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {draftPR.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  ยังไม่มีรายการขอซื้อ กดปุ่ม "สั่งซื้อ" ในตารางเพื่อเพิ่ม
                </div>
              )}
            </div>

            {/* Cost Estimate & Approval Flow */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>มูลค่าประเมินโดยประมาณ:</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  ฿ {totalPRCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>ผู้อนุมัติตามลำดับขั้น:</span>
                <span className="font-semibold text-slate-900">ผจก. คลังระนอง (รอลงนาม)</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-4 pt-2">
              <button
                onClick={onSubmitPR}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 transition-transform active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>ส่งใบขอซื้อเพื่อรออนุมัติ (Submit PR)</span>
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                เมื่อกดส่ง ระบบจะออกเอกสาร e-PR ส่งแจ้งเตือน Line/Email แผนกจัดซื้อส่วนกลาง
              </p>
            </div>
          </div>

          {/* RECENT AUDIT ACTIVITY TIMELINE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900">การตรวจนับสด (Audit Feed)</h4>
              <span className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer">
                ดูทั้งหมด
              </span>
            </div>
            <div className="space-y-3 text-xs">
              {auditFeed.map((feed) => (
                <div key={feed.id} className="flex items-start gap-2.5 pb-2 border-b border-slate-100 last:border-b-0 last:pb-0">
                  <span
                    className={`material-symbols-outlined text-base mt-0.5 ${
                      feed.type === 'alert' ? 'text-amber-500' : feed.type === 'in_progress' ? 'text-sky-500' : 'text-emerald-600'
                    }`}
                  >
                    {feed.type === 'in_progress' ? 'sync' : 'verified'}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900">{feed.title}</div>
                    <div className="text-[11px] text-slate-500">{feed.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
