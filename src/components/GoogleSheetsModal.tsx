import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, logoutGoogle } from '../services/firebaseAuth';
import { syncInventoryToGoogleSheets, exportToCSV } from '../services/sheetsService';
import { ConsumableItem, RequisitionRecord, Cabinet } from '../types';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleUser: User | null;
  onUserChanged: (user: User | null) => void;
  items: ConsumableItem[];
  requisitions: RequisitionRecord[];
  cabinets: Cabinet[];
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  googleUser,
  onUserChanged,
  items,
  requisitions,
  cabinets,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
    url?: string;
  }>({ type: 'idle', message: '' });

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const res = await googleSignIn();
      if (res?.user) {
        onUserChanged(res.user);
        setSyncStatus({
          type: 'success',
          message: `ลงชื่อเข้าใช้สำเร็จ: ${res.user.email}`,
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err.message || 'เกิดข้อผิดพลาดในการลงชื่อเข้าใช้ Google',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    onUserChanged(null);
    setSyncStatus({ type: 'idle', message: '' });
  };

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: 'idle', message: '' });
    try {
      const result = await syncInventoryToGoogleSheets(items, requisitions, cabinets);
      if (result.success) {
        setSyncStatus({
          type: 'success',
          message: result.message,
          url: result.spreadsheetUrl,
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: result.message,
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err.message || 'ซิงค์ข้อมูลล้มเหลว',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3Z" fill="#0F9D58"/>
              <path d="M9 7H15V17H9V7Z" fill="white"/>
              <path d="M7 11H17V13H7V11Z" fill="#0F9D58"/>
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Google Sheets Live Synchronization
            </h3>
            <p className="text-xs text-slate-500">
              เชื่อมต่อและซิงค์ข้อมูลสต็อกพัสดุ ประวัติการเบิก และสถานะตู้จัดเก็บ
            </p>
          </div>
        </div>

        {/* Auth Status Section */}
        {!googleUser ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-center">
            <div className="text-xs text-slate-600">
              ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่ออนุญาตให้แอปอ่านและบันทึกข้อมูลสต็อกลง Google Sheets โดยตรง
            </div>

            {/* Official Google Sign-In Button Styling per workspace skill guidelines */}
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'กำลังเชื่อมต่อ Google...' : 'ลงชื่อเข้าใช้ด้วย Google (Sign in with Google)'}</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google User'}
                  className="w-9 h-9 rounded-full object-cover border border-emerald-300"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  {googleUser.email?.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-emerald-950">
                  {googleUser.displayName || 'บัญชี Google'}
                </div>
                <div className="text-[11px] font-mono text-emerald-800">{googleUser.email}</div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 rounded-lg transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        )}

        {/* Sync Status Banner */}
        {syncStatus.message && (
          <div
            className={`p-3 rounded-xl text-xs flex flex-col gap-1.5 ${
              syncStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-base">
                {syncStatus.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{syncStatus.message}</span>
            </div>
            {syncStatus.url && (
              <a
                href={syncStatus.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline pt-1"
              >
                <span>เปิดเอกสาร Google Sheets ล่าสุดในแท็บใหม่ ↗</span>
              </a>
            )}
          </div>
        )}

        {/* What gets synced */}
        <div className="space-y-2 text-xs text-slate-600">
          <div className="font-bold text-slate-900">แผ่นงานที่จะสร้างและซิงค์ข้อมูล:</div>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>
              <strong>สต็อกพัสดุ (Inventory)</strong>: รหัส SKU, รายการ, คงเหลือ, Safety Min, แผนก, ตู้จัดเก็บ ({items.length} รายการ)
            </li>
            <li>
              <strong>ประวัติเบิกจ่าย (Requisitions)</strong>: เลขที่ใบเบิก, ผู้ขอเบิก, วัตถุประสงค์, รายการพัสดุ ({requisitions.length} รายการ)
            </li>
            <li>
              <strong>ผังตู้จัดเก็บ (Cabinets)</strong>: สถานะการตรวจนับ, ผู้ตรวจล่าสุด, วิศวกรผู้รับผิดชอบ ({cabinets.length} ตู้)
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {googleUser ? (
            <button
              onClick={handleSyncToSheets}
              disabled={isSyncing}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-base ${isSyncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isSyncing ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์ข้อมูลลง Google Sheets ทันที'}</span>
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              <span>ลงชื่อเข้าใช้ Google เพื่อเริ่มซิงค์</span>
            </button>
          )}

          <button
            onClick={() => exportToCSV(items)}
            className="py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            title="ดาวน์โหลดไฟล์ CSV สำหรับใช้ตอนออฟไลน์"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
