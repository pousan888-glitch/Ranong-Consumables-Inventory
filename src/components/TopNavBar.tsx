import React from 'react';
import { ActiveNavTab } from '../types';
import { User } from 'firebase/auth';

interface TopNavBarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  onOpenScanQR: () => void;
  onOpenQuickIssue: () => void;
  onOpenSheetsModal: () => void;
  googleUser: User | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  notificationCount: number;
  onLogout?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanQR,
  onOpenQuickIssue,
  onOpenSheetsModal,
  googleUser,
  searchQuery,
  setSearchQuery,
  notificationCount,
  onLogout,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  return (
    <header className="flex justify-between items-center w-full px-4 lg:px-8 h-16 max-w-full border-b border-slate-200 bg-white sticky top-0 z-30 shrink-0">
      {/* Left: Brand & Main Navigation */}
      <div className="flex items-center gap-4 lg:gap-6">
        <div 
          onClick={() => setActiveTab('inventory')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-200">
            <span className="material-symbols-outlined text-white text-xl">factory</span>
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 tracking-tight block leading-tight">
              Ranong Operations Center
            </span>
            <span className="text-[11px] font-medium text-slate-500 tracking-wide block">
              Consumables Admin Hub
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-6 ml-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-5 text-sm transition-colors border-b-2 ${
              activeTab === 'inventory'
                ? 'text-indigo-600 border-indigo-600 font-semibold'
                : 'text-slate-500 border-transparent hover:text-slate-900 font-medium'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('cabinets')}
            className={`py-5 text-sm transition-colors border-b-2 ${
              activeTab === 'cabinets'
                ? 'text-indigo-600 border-indigo-600 font-semibold'
                : 'text-slate-500 border-transparent hover:text-slate-900 font-medium'
            }`}
          >
            Cabinets
          </button>
          <button
            onClick={() => setActiveTab('reorders')}
            className={`py-5 text-sm transition-colors border-b-2 ${
              activeTab === 'reorders'
                ? 'text-indigo-600 border-indigo-600 font-semibold'
                : 'text-slate-500 border-transparent hover:text-slate-900 font-medium'
            }`}
          >
            Reorders
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-5 text-sm transition-colors border-b-2 ${
              activeTab === 'logs'
                ? 'text-indigo-600 border-indigo-600 font-semibold'
                : 'text-slate-500 border-transparent hover:text-slate-900 font-medium'
            }`}
          >
            Inspection Logs
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-5 text-sm transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'text-indigo-600 border-indigo-600 font-semibold'
                : 'text-slate-500 border-transparent hover:text-slate-900 font-medium'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Right: Search, Fast Actions, Google Sheets & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search */}
        <div className="relative hidden md:block w-64 lg:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-full border border-transparent bg-slate-100 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            placeholder="ค้นหาชื่อของ / รหัสพัสดุ SKU..."
            type="text"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </div>

        {/* Google Sheets Live Sync Button */}
        <button
          onClick={onOpenSheetsModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-xs ${
            googleUser
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="จัดการการเชื่อมต่อ Google Sheets"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3Z" fill="#0F9D58"/>
            <path d="M9 7H15V17H9V7Z" fill="white"/>
            <path d="M7 11H17V13H7V11Z" fill="#0F9D58"/>
          </svg>
          <span className="hidden sm:inline">
            {googleUser ? 'Sheets Sync' : 'ต่อ Google Sheets'}
          </span>
          {googleUser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
        </button>

        {/* Scan QR */}
        <button
          onClick={onOpenScanQR}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors border border-slate-200 shadow-xs"
          title="Scan QR Code"
        >
          <span className="material-symbols-outlined text-lg text-slate-600">qr_code_scanner</span>
          <span className="hidden sm:inline">Scan QR</span>
        </button>

        {/* Quick Issue */}
        <button
          onClick={onOpenQuickIssue}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all active:scale-[0.98] shadow-xs shadow-indigo-200"
          title="Quick Issue"
        >
          <span className="material-symbols-outlined text-lg">output</span>
          <span className="hidden sm:inline">Quick Issue</span>
        </button>

        {/* Icons & Badge */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
          <button 
            onClick={() => setActiveTab('logs')}
            className="relative p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="การแจ้งเตือน"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                {notificationCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => alert('ศูนย์ควบคุมท่าเรือระนอง Terminal 04\nเบอร์วิทยุประสานงาน: Ch.03\nโทรศัพท์ภายในคลัง: 2401')}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="ช่วยเหลือ"
          >
            <span className="material-symbols-outlined text-xl">help</span>
          </button>
        </div>

        {/* User Profile Badge & Logout */}
        <div className="relative flex items-center gap-2 pl-2 border-l border-slate-200">
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 py-1"
            title="คลิกเพื่อดูข้อมูลบัญชี Google"
          >
            {googleUser?.photoURL ? (
              <img
                className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-2xs"
                alt={googleUser.displayName || 'Google User'}
                src={googleUser.photoURL}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-indigo-200">
                {(googleUser?.displayName || googleUser?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {googleUser?.displayName || (googleUser?.email ? googleUser.email.split('@')[0] : 'เจ้าหน้าที่คลัง')}
              </span>
              <span className="text-[10px] font-medium text-slate-500 truncate max-w-[120px]">
                {googleUser?.email || 'Admin คลังพัสดุ'}
              </span>
            </div>
            <span className="material-symbols-outlined text-base text-slate-400">
              {isProfileMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </div>

          {/* Quick Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors shadow-2xs cursor-pointer"
              title="ออกจากระบบ Google (Sign Out)"
            >
              <span className="material-symbols-outlined text-base text-rose-500">logout</span>
              <span className="hidden lg:inline">ออกจากระบบ</span>
            </button>
          )}

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                {googleUser?.photoURL ? (
                  <img
                    className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                    alt={googleUser.displayName || 'User'}
                    src={googleUser.photoURL}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                    {(googleUser?.displayName || googleUser?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {googleUser?.displayName || 'เจ้าหน้าที่คลังพัสดุ'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {googleUser?.email || 'google@user.com'}
                  </div>
                  <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Firebase Auth Verified</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-base text-slate-500">settings</span>
                  <span>ตั้งค่าผู้ใช้งาน & สิทธิ์</span>
                </button>
                <button
                  onClick={() => {
                    onOpenSheetsModal();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-base text-emerald-600">sync</span>
                  <span>สถานะ Google Sheets Sync</span>
                </button>
              </div>

              {onLogout && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>ออกจากระบบ Google (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
