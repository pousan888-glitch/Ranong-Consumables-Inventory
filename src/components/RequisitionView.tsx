import React, { useState } from 'react';
import { ConsumableItem, RequisitionRecord } from '../types';

interface RequisitionViewProps {
  items: ConsumableItem[];
  requisitions: RequisitionRecord[];
  onConfirmRequisition: (req: {
    lotNo: string;
    itemsSummary: string;
    requester: string;
    urgent: boolean;
    purpose: string;
    targetCabinet: string;
  }) => void;
  onOpenSheetsModal: () => void;
}

export const RequisitionView: React.FC<RequisitionViewProps> = ({
  items,
  requisitions,
  onConfirmRequisition,
  onOpenSheetsModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Cart for requisition
  const [cart, setCart] = useState<Array<{ item: ConsumableItem; qty: number }>>([
    {
      item: items.find((i) => i.sku === 'CHM-STRIP-902') || items[0],
      qty: 2,
    },
    {
      item: items.find((i) => i.sku === 'PPE-GLV-C100-M') || items[1],
      qty: 1,
    },
  ]);

  const [lotNumber, setLotNumber] = useState('Lot #RN-2024-0982 (ตู้คอนเทนเนอร์เคมีส่งออก)');
  const [purpose, setPurpose] = useState('ตรวจไอระเหยสารเคมี VOCs ตู้คอนเทนเนอร์เทียบท่าลาน Berth 04');
  const [isUrgent, setIsUrgent] = useState(true);
  const [pin, setPin] = useState('8492');
  const [isPinVerified, setIsPinVerified] = useState(true);

  const catalogItems = items.filter((i) => i.department === 'QA/QC' || i.department === 'Safety');

  const addItemToCart = (item: ConsumableItem, qty = 1) => {
    const existing = cart.find((c) => c.item.id === item.id);
    if (existing) {
      setCart(
        cart.map((c) => (c.item.id === item.id ? { ...c, qty: c.qty + qty } : c))
      );
    } else {
      setCart([...cart, { item, qty }]);
    }
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(
      cart
        .map((c) => {
          if (c.item.id === id) {
            const next = c.qty + delta;
            return next > 0 ? { ...c, qty: next } : null;
          }
          return c;
        })
        .filter(Boolean) as Array<{ item: ConsumableItem; qty: number }>
    );
  };

  const handleConfirm = () => {
    if (cart.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการเบิก');
      return;
    }
    const summary = cart.map((c) => `${c.item.name} (${c.qty} ${c.item.unit})`).join(', ');
    onConfirmRequisition({
      lotNo: lotNumber,
      itemsSummary: summary,
      requester: 'ดร. กัญญา บุญประเสริฐ',
      urgent: isUrgent,
      purpose,
      targetCabinet: 'ตู้แล็บ QA-01',
    });
    setCart([]);
  };

  return (
    <main className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-indigo-600 text-2xl lg:text-3xl">science</span>
              <span>QA/QC Consumables Portal (ระบบเบิกอุปกรณ์และสารเคมี)</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Lab Station 2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            พอร์ทัลเบิกจ่ายสารทดสอบเคมี ถุงมือ Cleanroom และซีลตรวจสอบคุณภาพสินค้า ท่าเรือระนอง
          </p>
        </div>

        <button
          onClick={onOpenSheetsModal}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm self-start"
        >
          <span className="material-symbols-outlined text-base text-emerald-600">sync_alt</span>
          <span>ซิงค์ประวัติใบเบิกสู่ Sheets</span>
        </button>
      </div>

      {/* BATCH CONTEXT BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">biotech</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              ชุดตรวจ / อ้างอิงล็อตงานที่กำลังตรวจสอบ:
            </div>
            <div className="text-sm font-bold text-slate-900">{lotNumber}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">ขั้นตอนการตรวจ:</span>
            <span className="font-semibold text-slate-900">Phase 2: In-situ Chemical Screening</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">จุดรับพัสดุ:</span>
            <span className="font-semibold text-emerald-700">ตู้แล็บ QA-01 (ช่อง 12-18) ปลดล็อกอัตโนมัติ</span>
          </div>
        </div>
      </div>

      {/* MAIN SPLIT: CATALOG (8 COLS) + REQUISITION CART DRAWER (4 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT 8 COLS: CATALOG & REQUISITIONS TABLE */}
        <div className="xl:col-span-8 space-y-6">
          {/* CATALOG HEADER & FILTER TABS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-lg">category</span>
                <span>คลังพัสดุสำหรับงานตรวจสอบ (QA Consumable Catalog)</span>
              </h3>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  search
                </span>
                <input
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="ค้นหาชื่อสารเคมี / อุปกรณ์..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              {[
                { id: 'all', label: 'ทั้งหมด (QA/QC)' },
                { id: 'test', label: 'ชุดทดสอบเคมี' },
                { id: 'ppe', label: 'ถุงมือ & หน้ากาก' },
                { id: 'seal', label: 'สติกเกอร์ซีล' },
                { id: 'glass', label: 'เครื่องแก้ว & สารละลาย' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeCategory === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCT CATALOG CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalogItems
              .filter((it) => {
                if (catalogSearch) {
                  return it.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                         it.sku.toLowerCase().includes(catalogSearch.toLowerCase());
                }
                return true;
              })
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                        {item.sku}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          item.status === 'critical'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.status === 'low'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {item.status === 'critical' ? 'สต็อกวิกฤต' : 'พร้อมเบิก'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.spec}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500">คงเหลือในตู้:</div>
                      <div className="font-mono text-sm font-bold text-slate-900">
                        {item.balance} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => addItemToCart(item, 1)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm shadow-indigo-100 transition-transform active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      <span>เบิกรายการนี้</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* RECENT REQUISITIONS HISTORY TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-lg">receipt_long</span>
                <span>ประวัติการเบิกจ่ายล่าสุด (Recent Requisitions Log)</span>
              </h3>
              <span className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer">
                ดูประวัติทั้งหมด
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">รหัสใบเบิก</th>
                    <th className="py-3 px-3">เวลา</th>
                    <th className="py-3 px-3">ล็อตงาน / วัตถุประสงค์</th>
                    <th className="py-3 px-3">รายการพัสดุ</th>
                    <th className="py-3 px-3">ผู้ขอเบิก</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requisitions.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                        {req.id}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{req.timestamp}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{req.lotNo}</div>
                        {req.purpose && <div className="text-[11px] text-slate-500">{req.purpose}</div>}
                      </td>
                      <td className="py-3 px-3 text-slate-900">{req.itemsSummary}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-900">{req.requester}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {req.statusTh}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: ACTIVE REQUISITION CART DRAWER */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-indigo-600">REQUISITION ORDER</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {cart.length} รายการในรายการเบิก
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">ใบขอเบิกพัสดุ QA/QC</h2>
            <div className="text-xs text-slate-500 mt-0.5">ผู้ขอเบิก: ดร. กัญญา บุญประเสริฐ (Lab Lead)</div>
          </div>

          {/* Cart Items List */}
          <div className="space-y-3">
            {cart.map(({ item, qty }) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{item.name}</div>
                  <div className="font-mono text-[10px] text-indigo-600 font-bold">{item.sku}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCartQty(item.id, -1)}
                    className="w-6 h-6 rounded-md border border-slate-200 bg-white flex items-center justify-center font-bold text-xs hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-xs w-8 text-center text-slate-900">{qty}</span>
                  <button
                    onClick={() => updateCartQty(item.id, 1)}
                    className="w-6 h-6 rounded-md border border-slate-200 bg-white flex items-center justify-center font-bold text-xs hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    +
                  </button>
                  <span className="text-[11px] text-slate-500">{item.unit}</span>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                ยังไม่มีรายการเบิก เลือกกด "เบิกรายการนี้" จากแคตตาล็อก
              </div>
            )}
          </div>

          {/* Purpose Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900">วัตถุประสงค์ / หมายเหตุการเบิก:</label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900"
            />
          </div>

          {/* Urgent Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
            <div>
              <div className="text-xs font-bold text-amber-900">เบิกด่วนพิเศษ (Urgent Protocol)</div>
              <div className="text-[11px] text-amber-700">ส่งคำขอตรงถึงหัวหน้าคลังพัสดุทันที</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Inspector PIN Verification */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>รหัส PIN ยืนยันตัวตนผู้ตรวจ:</span>
              <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>ยืนยันแล้ว</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-24 px-3 py-1.5 font-mono text-center tracking-widest text-base font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
              />
              <div className="text-[11px] text-slate-500">
                ดร. กัญญา บุญประเสริฐ (สิทธิ์ผู้อนุมัติแล็บ)
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 transition-transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>ยืนยันการเบิกของ (Confirm Requisition)</span>
          </button>
        </div>
      </div>
    </main>
  );
};
