import React, { useState } from 'react';
import { UserStaff } from '../types';
import { User } from 'firebase/auth';

interface SettingsUserViewProps {
  users: UserStaff[];
  onUpdateUserRole: (userId: string, newRole: UserStaff['role'], zones: string[]) => void;
  googleUser?: User | null;
  onLogout?: () => void;
}

export const SettingsUserView: React.FC<SettingsUserViewProps> = ({
  users,
  onUpdateUserRole,
  googleUser,
  onLogout,
}) => {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserStaff>(users[0]);
  const [editedRole, setEditedRole] = useState<UserStaff['role']>(users[0].role);
  const [editedZones, setEditedZones] = useState<string[]>(users[0].zones);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSelectUser = (user: UserStaff) => {
    setSelectedUser(user);
    setEditedRole(user.role);
    setEditedZones(user.zones);
  };

  const toggleZone = (zoneName: string) => {
    if (editedZones.includes(zoneName)) {
      setEditedZones(editedZones.filter((z) => z !== zoneName));
    } else {
      setEditedZones([...editedZones, zoneName]);
    }
  };

  const handleSavePermissions = () => {
    onUpdateUserRole(selectedUser.id, editedRole, editedZones);
    setToastMessage(`บันทึกการปรับสิทธิ์ของ ${selectedUser.name} เรียบร้อยแล้ว`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredUsers = users.filter((u) => {
    if (selectedRoleFilter !== 'all' && u.role !== selectedRoleFilter) return false;
    return true;
  });

  return (
    <main className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50">
      {/* TOAST */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-400 text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-indigo-600 text-2xl lg:text-3xl">admin_panel_settings</span>
              <span>จัดการผู้ใช้และกำหนดสิทธิ์ (Access Control &amp; Staff Registry)</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            กำหนดบทบาทหน้าที่ สิทธิ์เข้าถึงตู้จัดเก็บพัสดุรายโซน (Zone RBAC) และประวัติการมอบหมายสิทธิ์ ท่าเรือระนอง
          </p>
        </div>

        <button
          onClick={() => alert('ฟังก์ชันลงทะเบียนเจ้าหน้าที่ใหม่: เพิ่มชื่อและออกรหัส PIN สำหรับ Helper')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-100 transition-all self-start active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>+ เพิ่มพนักงานใหม่</span>
        </button>
      </div>

      {/* ACTIVE GOOGLE AUTHENTICATION SESSION CARD */}
      {googleUser && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {googleUser.photoURL ? (
              <img
                src={googleUser.photoURL}
                alt={googleUser.displayName || 'Google User'}
                className="w-12 h-12 rounded-full border-2 border-indigo-100 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-base flex items-center justify-center">
                {(googleUser.displayName || googleUser.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {googleUser.displayName || 'ผู้ใช้งาน Google'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Google Authenticated</span>
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{googleUser.email}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                UID: <span className="font-mono">{googleUser.uid.slice(0, 16)}...</span> • โปรเจกต์ Firebase: Warehouse Consumables Monitor
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2 border border-rose-200 transition-colors self-start sm:self-center cursor-pointer"
              title="ออกจากระบบ Google ทันที"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>ออกจากระบบ (Logout)</span>
            </button>
          )}
        </div>
      )}

      {/* 4 KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ผู้ใช้งานทั้งหมด (TOTAL STAFF)</div>
          <div className="font-mono text-3xl font-bold text-slate-900 mt-1">38 คน</div>
          <div className="text-xs text-slate-500 mt-1">Active ในกะวันนี้ 26 คน</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">ผู้ดูแลระบบ (ADMINS)</div>
          <div className="font-mono text-3xl font-bold text-indigo-600 mt-1">4 คน</div>
          <div className="text-xs text-slate-500 mt-1">สิทธิ์อนุมัติการสั่งซื้อ PR</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">เจ้าหน้าที่ปฏิบัติการ (HELPERS)</div>
          <div className="font-mono text-3xl font-bold text-slate-900 mt-1">22 คน</div>
          <div className="text-xs text-slate-500 mt-1">สิทธิ์สแกนหน้าตู้และเบิกของ</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">ฝ่ายตรวจสอบคุณภาพ (QA/QC)</div>
          <div className="font-mono text-3xl font-bold text-emerald-600 mt-1">12 คน</div>
          <div className="text-xs text-slate-500 mt-1">สิทธิ์เบิกสารเคมีและตรวจตู้แล็บ</div>
        </div>
      </div>

      {/* ROLE FILTER TABS */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { id: 'all', label: 'ทั้งหมด (38)' },
          { id: 'super_admin', label: 'Super Admin (1)' },
          { id: 'warehouse_admin', label: 'Admin คลัง (3)' },
          { id: 'helper', label: 'Helper ภาคสนาม (22)' },
          { id: 'qa_qc', label: 'QA/QC Lab (12)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedRoleFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedRoleFilter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN SPLIT: STAFF ROSTER (8 COLS) + PERMISSIONS DRAWER (4 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* STAFF ROSTER TABLE (8 COLS) */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">ชื่อ - นามสกุล / ตำแหน่ง</th>
                  <th className="py-3.5 px-3">บทบาทระบบ</th>
                  <th className="py-3.5 px-3">โซนที่ได้รับอนุญาต</th>
                  <th className="py-3.5 px-3 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSelected = u.id === selectedUser.id;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                            {u.name.slice(0, 1)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {u.empId} • {u.titleTh}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            u.role === 'super_admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'warehouse_admin'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : u.role === 'qa_qc'
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {u.roleNameTh}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {u.zones.map((z, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold"
                            >
                              {z}
                            </span>
                          ))}
                          {u.zones.length === 0 && (
                            <span className="text-slate-400 text-[11px] italic">ไม่มีสิทธิ์</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {u.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        )}
                        {u.status === 'offline' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Offline
                          </span>
                        )}
                        {u.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUser(u);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          แก้ไขสิทธิ์
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PERMISSIONS ASSIGNMENT DRAWER (4 COLS) */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-indigo-600">
                PERMISSION CONTROLLER
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {selectedUser.empId}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">กำหนดสิทธิ์ผู้ใช้งาน</h2>
          </div>

          {/* User Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            {selectedUser.avatar ? (
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold">
                {selectedUser.name.slice(0, 1)}
              </div>
            )}
            <div>
              <div className="font-bold text-sm text-slate-900">{selectedUser.name}</div>
              <div className="text-xs text-slate-500">{selectedUser.titleTh}</div>
              <div className="text-[11px] font-mono text-indigo-600">{selectedUser.email}</div>
            </div>
          </div>

          {/* Role Radio Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900">เลือกระดับบทบาท (System Role):</label>
            <div className="space-y-2 text-xs">
              {[
                {
                  role: 'super_admin' as const,
                  title: 'Super Admin (Tier 1)',
                  desc: 'สิทธิ์เต็มทุกระบบ อนุมัติ PR และจัดการผู้ใช้',
                },
                {
                  role: 'warehouse_admin' as const,
                  title: 'Admin คลัง (Warehouse Admin)',
                  desc: 'จัดการสต็อก ออกใบขอซื้อ ควบคุมตู้จัดเก็บ',
                },
                {
                  role: 'helper' as const,
                  title: 'Helper (Field Ops)',
                  desc: 'สแกน QR ตรวจนับสต็อกหน้าตู้ และเบิกจ่ายด่วน',
                },
                {
                  role: 'qa_qc' as const,
                  title: 'QA/QC (Auditor)',
                  desc: 'เบิกสารเคมีและตรวจประเมินคุณภาพสินค้า',
                },
              ].map((r) => (
                <label
                  key={r.role}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    editedRole === r.role
                      ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="editedRole"
                    checked={editedRole === r.role}
                    onChange={() => setEditedRole(r.role)}
                    className="mt-0.5 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-slate-900">{r.title}</div>
                    <div className="text-[11px] text-slate-500">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Authorized Zones Checkboxes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900">โซนที่ได้รับอนุญาตให้เปิดตู้ (Authorized Zones):</label>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {[
                'Zone A (ลานซ่อมบำรุงหลัก Berth 01-02)',
                'Zone B (ฝ่ายผลิต / สารเคมี)',
                'Zone C (งานเชื่อมและโครงสร้าง Berth 03)',
                'Central Workshop (โรงซ่อมใหญ่)',
              ].map((zone) => {
                const zoneCode = zone.split(' ')[0] + ' ' + zone.split(' ')[1];
                const isChecked = editedZones.some((z) => z.includes(zoneCode) || z.includes('All'));
                return (
                  <label
                    key={zone}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleZone(zoneCode)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-900 font-medium">{zone}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Audit Trail Note */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">ประวัติการมอบหมายล่าสุด:</div>
            <div>{selectedUser.assignedBy || 'คณะกรรมการบริหาร'}</div>
            <div>{selectedUser.assignedTime || '1 ม.ค. 2024'}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSavePermissions}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100 transition-transform active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>บันทึกสิทธิ์ (Save Permissions)</span>
            </button>
            <button
              onClick={() => handleSelectUser(selectedUser)}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
