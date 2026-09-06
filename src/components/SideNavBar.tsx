import React from 'react';
import { ActiveNavTab } from '../types';
import { User } from 'firebase/auth';

interface SideNavBarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  onFastScanner: () => void;
  googleUser?: User | null;
  onLogout?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  activeTab,
  setActiveTab,
  onFastScanner,
  googleUser,
  onLogout,
}) => {
  return (
    <aside className="hidden md:flex flex-col justify-between h-[calc(100vh-4rem)] w-64 p-5 border-r border-slate-200 bg-white shrink-0 select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Facility Plant Badge Header */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            <span className="material-symbols-outlined text-indigo-600 text-xl">anchor</span>
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 block leading-tight">Ranong Supply Hub</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Terminal Yard 04</span>
          </div>
        </div>

        {/* CTA Fast Scanner */}
        <div>
          <button
            onClick={onFastScanner}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-sm shadow-indigo-100 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-lg">document_scanner</span>
            <span>Fast Scanner</span>
          </button>
        </div>

        {/* Tab Items */}
        <nav className="space-y-1">
          {/* Tab 1: Stock Triage (Dashboard) */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-lg">inventory_2</span>
            <span>Stock Triage</span>
          </button>

          {/* Tab 2: Cabinets & Bins */}
          <button
            onClick={() => setActiveTab('cabinets')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
              activeTab === 'cabinets'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-lg">shelves</span>
            <span>Cabinets & Bins</span>
          </button>

          {/* Tab 3: Disbursement */}
          <button
            onClick={() => setActiveTab('reorders')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
              activeTab === 'reorders'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-lg">output</span>
            <span>Disbursement</span>
          </button>

          {/* Tab 4: Audit Logs */}
          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-lg">fact_check</span>
            <span>Audit Logs</span>
          </button>

          {/* Tab 5: Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Sleek Dark Card & Footer Nav Links */}
      <div className="space-y-3">
        {/* Sleek Terminal Status Card */}
        <div className="p-4 bg-slate-900 rounded-2xl text-white relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Terminal Mode</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">Ready</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3">
            <div className="bg-indigo-500 h-1.5 rounded-full w-3/4"></div>
          </div>
          <button
            onClick={() => setActiveTab('helper')}
            className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-bold transition-all text-center"
          >
            Open Helper Terminal
          </button>
        </div>

        <div className="pt-2 border-t border-slate-200 space-y-2">
          {googleUser && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-200 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {(googleUser.displayName || googleUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 truncate flex items-center gap-1">
                    <span className="truncate">{googleUser.displayName || googleUser.email?.split('@')[0]}</span>
                    {googleUser.email?.toLowerCase() === 'pousan888@gmail.com' && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[8px] font-bold shrink-0">
                        SUPER ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    {googleUser.email}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="ออกจากระบบ Google (Sign Out)"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => alert('ติดต่อทีมสนับสนุน IT/คลังสินค้า ท่าเรือระนอง\nอีเมล: support@ranonghub.th\nโทร: 077-800-112')}
            className="w-full flex items-center gap-3 text-slate-500 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
          >
            <span className="material-symbols-outlined text-lg">contact_support</span>
            <span>Support</span>
          </button>
          <div className="px-3 text-[10px] font-mono text-slate-400">
            v2.4.12 • Ranong Pier
          </div>
        </div>
      </div>
    </aside>
  );
};
