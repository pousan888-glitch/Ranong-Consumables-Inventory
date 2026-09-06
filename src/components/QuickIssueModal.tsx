import React, { useState } from 'react';
import { ConsumableItem } from '../types';

interface QuickIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ConsumableItem[];
  onIssueSuccess: (sku: string, qty: number, recipient: string) => void;
}

export const QuickIssueModal: React.FC<QuickIssueModalProps> = ({
  isOpen,
  onClose,
  items,
  onIssueSuccess,
}) => {
  const [selectedSku, setSelectedSku] = useState(items[0]?.sku || '');
  const [qty, setQty] = useState(1);
  const [recipient, setRecipient] = useState('ช่างสมศักดิ์ (กะเช้า Berth 03)');
  const [workOrder, setWorkOrder] = useState('WO-2024-0419');

  if (!isOpen) return null;

  const selectedItem = items.find((i) => i.sku === selectedSku) || items[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSku) return;
    onIssueSuccess(selectedSku, qty, `${recipient} [${workOrder}]`);
    onClose();
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
            <span className="material-symbols-outlined text-indigo-600">output</span>
            <span>เบิกจ่ายพัสดุด่วน (Quick Issue)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกการเบิกพัสดุฉุกเฉินหน้างานและตัดยอดสต็อกอัตโนมัติ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Item Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900">เลือกรายการพัสดุ:</label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              {items.map((item) => (
                <option key={item.id} value={item.sku}>
                  {item.sku} - {item.name} (คงเหลือ: {item.balance} {item.unit})
                </option>
              ))}
            </select>
            {selectedItem && (
              <div className="text-[11px] text-slate-500 mt-1">
                ตู้จัดเก็บ: <strong className="text-slate-700">{selectedItem.cabinetId}</strong> ({selectedItem.cabinetShelf}) • แผนก: {selectedItem.departmentTh}
              </div>
            )}
          </div>

          {/* Quantity Stepper */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900">จำนวนที่เบิก:</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={selectedItem ? selectedItem.balance : 999}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center font-mono font-bold text-sm p-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                +
              </button>
              <span className="text-xs text-slate-500 font-medium">
                {selectedItem ? selectedItem.unit : 'หน่วย'}
              </span>
            </div>
          </div>

          {/* Recipient */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900">ผู้ขอเบิก / แผนกช่าง:</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="ระบุชื่อผู้รับของ"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              required
            />
          </div>

          {/* Work Order */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900">เลขที่ใบสั่งงาน / Job Order (ถ้ามี):</label>
            <input
              type="text"
              value={workOrder}
              onChange={(e) => setWorkOrder(e.target.value)}
              placeholder="เช่น WO-2024-0419"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100 transition-transform active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">check</span>
              <span>บันทึกการเบิกจ่าย</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
