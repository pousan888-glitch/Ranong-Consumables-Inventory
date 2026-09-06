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
}) => {
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

        {/* User Profile Badge */}
        <div 
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-90"
        >
          <img
            className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-2xs"
            alt="สมชาย Admin คลังพัสดุ"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCH2gl_4Z6HdjzIPaqjUAfkJgIpY8fXoo5s7ph8-DiKO2pEPT89vL_hewmSmD_nNGLhSSDnxPdGQ2Ddvr-e6hQ0O09eZPPGAdCa3B1NW5RIq5JCz5-_DFgRRA86LsBuU2RQTIergs5JIFu3vgDJiNq6U86ze2UuIS6eQR0v1EcFVoWhifuH05AnBcXtgyP1-FUxJgAQJDreIj5d84Ph0ZslL8am8tB1jbUCiyXHG4bjCY9oRkR4ncWJ"
            referrerPolicy="no-referrer"
          />
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 leading-tight">สมชาย ว.</span>
            <span className="text-[10px] font-medium text-slate-500">Admin คลังพัสดุ</span>
          </div>
        </div>
      </div>
    </header>
  );
};
