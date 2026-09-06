import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn } from '../services/firebaseAuth';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result?.user) {
        onLoginSuccess(result.user);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let msg = error?.message || 'ไม่สามารถลงชื่อเข้าใช้ด้วย Google ได้ กรุณาลองใหม่อีกครั้ง';
      if (error?.code === 'auth/popup-closed-by-user') {
        msg = 'หน้าต่างลงชื่อเข้าใช้ถูกปิดก่อนทำรายการสำเร็จ กรุณากดลองใหม่อีกครั้ง';
      } else if (error?.code === 'auth/unauthorized-domain') {
        msg = 'โดเมนนี้ยังไม่ได้รับการอนุมัติใน Firebase Authentication กรุณาตรวจสอบ Authorized Domains ใน Firebase Console';
      } else if (error?.code === 'auth/popup-blocked') {
        msg = 'เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้แล้วลองใหม่อีกครั้ง';
      }
      setErrorMessage(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Top Brand Banner */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
            <span className="material-symbols-outlined text-xl">inventory_2</span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">Ranong Port Hub</div>
            <div className="text-[10px] text-slate-500 font-mono">Terminal Yard 04 • Consumables</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Firebase Auth Active</span>
          </span>
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl max-w-md w-full space-y-6 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-50 rounded-full blur-2xl pointer-events-none"></div>

          {/* Card Header */}
          <div className="text-center space-y-3 relative">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wider uppercase mb-1">
                Security Access Control
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                เข้าสู่ระบบคลังพัสดุ
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                ระบบจำกัดสิทธิ์เฉพาะเจ้าหน้าที่ที่ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อความปลอดภัยของข้อมูลคลังพัสดุ ท่าเรือระนอง
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base text-rose-600 shrink-0 mt-0.5">
                error
              </span>
              <div className="flex-1">
                <div className="font-bold text-rose-900">การเข้าสู่ระบบไม่สำเร็จ</div>
                <div className="mt-0.5 leading-relaxed">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-300 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer group"
            >
              {isSigningIn ? (
                <>
                  <span className="material-symbols-outlined text-xl text-indigo-600 animate-spin">
                    progress_activity
                  </span>
                  <span>กำลังเชื่อมต่อกับ Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span className="text-slate-800 group-hover:text-slate-950 font-semibold">
                    ลงชื่อเข้าใช้ด้วย Google (Sign in with Google)
                  </span>
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-[11px] text-slate-400">
                ระบบเชื่อมต่อ Firebase Auth กับโปรเจกต์ <strong>Warehouse Consumables Monitor</strong>
              </p>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="material-symbols-outlined text-indigo-600 text-lg">verified_user</span>
              <div className="text-[10px] font-bold text-slate-700 mt-0.5">สิทธิ์เฉพาะบุคคล</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="material-symbols-outlined text-emerald-600 text-lg">sync</span>
              <div className="text-[10px] font-bold text-slate-700 mt-0.5">Google Sheets</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="material-symbols-outlined text-sky-600 text-lg">qr_code_scanner</span>
              <div className="text-[10px] font-bold text-slate-700 mt-0.5">สแกนหน้าตู้ QR</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto py-3 text-center text-xs text-slate-400 border-t border-slate-200">
        Ranong Operations Consumables Hub • การท่าเรือแห่งประเทศไทย ท่าเรือระนอง • All Rights Reserved
      </footer>
    </div>
  );
};
