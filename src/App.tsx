import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth } from './services/firebaseAuth';
import { exportToCSV } from './services/sheetsService';
import {
  ActiveNavTab,
  ConsumableItem,
  Cabinet,
  QuickPRItem,
  AuditFeedItem,
  RequisitionRecord,
  UserStaff,
} from './types';
import {
  initialConsumables,
  departmentSummaries,
  initialDraftPR,
  initialAuditFeed,
  initialCabinets,
  initialRequisitions,
  initialUsers,
} from './data/mockData';

// Components
import { TopNavBar } from './components/TopNavBar';
import { SideNavBar } from './components/SideNavBar';
import { StockTriageView } from './components/StockTriageView';
import { HelperModeView } from './components/HelperModeView';
import { CabinetsView } from './components/CabinetsView';
import { RequisitionView } from './components/RequisitionView';
import { SettingsUserView } from './components/SettingsUserView';
import { AuditLogsView } from './components/AuditLogsView';

// Modals
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { PrintQRModal } from './components/PrintQRModal';
import { ScanQRModal } from './components/ScanQRModal';
import { QuickIssueModal } from './components/QuickIssueModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('inventory');
  const [items, setItems] = useState<ConsumableItem[]>(initialConsumables);
  const [cabinets, setCabinets] = useState<Cabinet[]>(initialCabinets);
  const [draftPR, setDraftPR] = useState<QuickPRItem[]>(initialDraftPR);
  const [auditFeed, setAuditFeed] = useState<AuditFeedItem[]>(initialAuditFeed);
  const [requisitions, setRequisitions] = useState<RequisitionRecord[]>(initialRequisitions);
  const [users, setUsers] = useState<UserStaff[]>(initialUsers);

  // Search & Global filters
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Google User state
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  // Modal states
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isScanQRModalOpen, setIsScanQRModalOpen] = useState(false);
  const [isQuickIssueModalOpen, setIsQuickIssueModalOpen] = useState(false);
  const [isPrintQRModalOpen, setIsPrintQRModalOpen] = useState(false);
  const [selectedCabinetForPrint, setSelectedCabinetForPrint] = useState<Cabinet | null>(null);

  // Banner/Toast message
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const showGlobalToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 4000);
  };

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Quick PR handlers
  const handleAddItemToPR = (item: ConsumableItem) => {
    const existing = draftPR.find((p) => p.sku === item.sku);
    if (existing) {
      setDraftPR(
        draftPR.map((p) => (p.sku === item.sku ? { ...p, qty: p.qty + 10 } : p))
      );
    } else {
      setDraftPR([
        ...draftPR,
        {
          id: `pr-${Date.now()}`,
          sku: item.sku,
          name: item.name,
          unit: item.unit,
          qty: Math.max(10, item.safetyMin - item.balance),
          estimatedPrice: item.costPerUnit,
        },
      ]);
    }
    showGlobalToast(`เพิ่ม ${item.name} ลงในรายการขอจัดซื้อด่วน (Quick PR) แล้ว`);
  };

  const handleRemovePRItem = (id: string) => {
    setDraftPR(draftPR.filter((p) => p.id !== id));
  };

  const handleUpdatePRQty = (id: string, delta: number) => {
    setDraftPR(
      draftPR
        .map((p) => {
          if (p.id === id) {
            const next = p.qty + delta;
            return next > 0 ? { ...p, qty: next } : null;
          }
          return p;
        })
        .filter(Boolean) as QuickPRItem[]
    );
  };

  const handleSubmitPR = () => {
    if (draftPR.length === 0) {
      alert('ยังไม่มีรายการในใบขอซื้อด่วน');
      return;
    }
    const prNumber = `PR-RNG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    showGlobalToast(`สร้างใบขอจัดซื้อด่วน ${prNumber} ส่งไปยังผู้จัดการคลังระนองเรียบร้อยแล้ว`);
  };

  // Helper mode handlers
  const handleAuditCompleted = (cabinetId: string, summary: string) => {
    setCabinets(
      cabinets.map((c) =>
        c.id === cabinetId
          ? {
              ...c,
              status: 'counted',
              statusTextTh: 'ตรวจแล้ว เรียบร้อย',
              lastAuditTime: 'วันนี้ เพิ่งตรวจเสร็จ',
              auditor: 'Helper พิเชษฐ์',
            }
          : c
      )
    );

    setAuditFeed([
      {
        id: `feed-${Date.now()}`,
        cabinetId: cabinetId,
        title: `ตรวจนับ ${cabinetId} เสร็จสิ้น`,
        detail: `ผู้ตรวจ: พิเชษฐ์ • เพิ่งตรวจเสร็จ (${summary})`,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        auditor: 'Helper พิเชษฐ์',
        type: 'done',
      },
      ...auditFeed,
    ]);
  };

  // Item Disbursement handler
  const handleItemIssued = (sku: string, qty: number, recipient: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.sku === sku) {
          const nextBal = Math.max(0, it.balance - qty);
          const nextStatus =
            nextBal <= it.safetyMin * 0.3
              ? 'critical'
              : nextBal <= it.safetyMin
              ? 'low'
              : 'normal';
          return {
            ...it,
            balance: nextBal,
            status: nextStatus,
          };
        }
        return it;
      })
    );

    const item = items.find((i) => i.sku === sku);
    const newReq: RequisitionRecord = {
      id: `#REQ-${Math.floor(8850 + Math.random() * 100)}`,
      timestamp: 'วันนี้ เพิ่งเบิก',
      lotNo: 'เบิกจ่ายด่วนหน้างาน (Quick Issue)',
      itemsSummary: `${item ? item.name : sku} (${qty} ${item ? item.unit : 'หน่วย'})`,
      requester: recipient,
      status: 'completed',
      statusTh: 'จ่ายของแล้ว',
      urgent: true,
      purpose: `เบิกใช้ด่วนหน้างานโดย ${recipient}`,
    };
    setRequisitions([newReq, ...requisitions]);
    showGlobalToast(`จ่ายของ ${sku} จำนวน ${qty} ให้แก่ ${recipient} สำเร็จ`);
  };

  // Requisition QA/QC portal handler
  const handleConfirmRequisition = (newReqData: {
    lotNo: string;
    itemsSummary: string;
    requester: string;
    urgent: boolean;
    purpose: string;
    targetCabinet: string;
  }) => {
    const newReq: RequisitionRecord = {
      id: `#REQ-${Math.floor(8860 + Math.random() * 100)}`,
      timestamp: 'วันนี้ เพิ่งเบิก',
      lotNo: newReqData.lotNo,
      itemsSummary: newReqData.itemsSummary,
      requester: newReqData.requester,
      status: 'completed',
      statusTh: 'รับของแล้ว',
      urgent: newReqData.urgent,
      purpose: newReqData.purpose,
      targetCabinet: newReqData.targetCabinet,
    };
    setRequisitions([newReq, ...requisitions]);
    showGlobalToast(`บันทึกใบเบิก ${newReq.id} เรียบร้อยแล้ว ปลดล็อก ${newReqData.targetCabinet}`);
  };

  // Update staff permissions
  const handleUpdateUserRole = (
    userId: string,
    newRole: UserStaff['role'],
    newZones: string[]
  ) => {
    const roleNames: Record<UserStaff['role'], string> = {
      super_admin: 'Super Admin',
      warehouse_admin: 'Admin คลัง',
      helper: 'Helper',
      qa_qc: 'QA/QC Lab',
    };
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              role: newRole,
              roleNameTh: roleNames[newRole],
              zones: newZones,
              assignedBy: 'สมชาย วงศ์ปรีดา (Admin คลัง)',
              assignedTime: 'วันนี้ เพิ่งปรับปรุง',
            }
          : u
      )
    );
  };

  // Open print modal
  const handleOpenPrintModal = (cab: Cabinet) => {
    setSelectedCabinetForPrint(cab);
    setIsPrintQRModalOpen(true);
  };

  const handleSelectCabinetForTerminal = (cabId: string) => {
    setActiveTab('helper');
    showGlobalToast(`เปิดโหมดตรวจนับหน้าตู้ ${cabId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* GLOBAL TOAST NOTIFICATION */}
      {globalToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border border-slate-800 text-xs font-semibold flex items-center gap-2.5 animate-slide-in">
          <span className="material-symbols-outlined text-base text-indigo-400">
            check_circle
          </span>
          <span>{globalToast}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR (hidden in full terminal mode for immersive experience) */}
      {activeTab !== 'helper' && (
        <TopNavBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenScanQR={() => setIsScanQRModalOpen(true)}
          onOpenQuickIssue={() => setIsQuickIssueModalOpen(true)}
          onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
          googleUser={googleUser}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          notificationCount={8}
        />
      )}

      {/* BODY WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR NAVIGATION (hidden in full terminal mode) */}
        {activeTab !== 'helper' && (
          <SideNavBar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onFastScanner={() => setActiveTab('helper')}
          />
        )}

        {/* VIEW 1: STOCK TRIAGE (ADMIN DASHBOARD) */}
        {activeTab === 'inventory' && (
          <StockTriageView
            items={items}
            departmentSummaries={departmentSummaries}
            draftPR={draftPR}
            auditFeed={auditFeed}
            onOpenQuickIssue={() => setIsQuickIssueModalOpen(true)}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            onExportCSV={() => exportToCSV(items)}
            onAddItemToPR={handleAddItemToPR}
            onRemovePRItem={handleRemovePRItem}
            onUpdatePRQty={handleUpdatePRQty}
            onSubmitPR={handleSubmitPR}
            searchQuery={searchQuery}
          />
        )}

        {/* VIEW 2: HELPER MODE (MOBILE INDUSTRIAL TERMINAL) */}
        {activeTab === 'helper' && (
          <HelperModeView
            onBackToDashboard={() => setActiveTab('inventory')}
            onAuditCompleted={handleAuditCompleted}
            onItemIssued={handleItemIssued}
            items={items}
            cabinets={cabinets}
          />
        )}

        {/* VIEW 3: CABINETS & QR MANAGEMENT */}
        {activeTab === 'cabinets' && (
          <CabinetsView
            cabinets={cabinets}
            onOpenPrintModal={handleOpenPrintModal}
            onOpenScanQR={() => setIsScanQRModalOpen(true)}
            onSelectCabinetForTerminal={handleSelectCabinetForTerminal}
          />
        )}

        {/* VIEW 4: REQUISITION / QA/QC PORTAL */}
        {activeTab === 'reorders' && (
          <RequisitionView
            items={items}
            requisitions={requisitions}
            onConfirmRequisition={handleConfirmRequisition}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
          />
        )}

        {/* VIEW 5: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <AuditLogsView
            auditFeed={auditFeed}
            cabinets={cabinets}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            onOpenScanQR={() => setIsScanQRModalOpen(true)}
          />
        )}

        {/* VIEW 6: SETTINGS / USER & ROLE ASSIGNMENT */}
        {activeTab === 'settings' && (
          <SettingsUserView
            users={users}
            onUpdateUserRole={handleUpdateUserRole}
          />
        )}
      </div>

      {/* POPUP MODALS */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        googleUser={googleUser}
        onUserChanged={setGoogleUser}
        items={items}
        requisitions={requisitions}
        cabinets={cabinets}
      />

      <PrintQRModal
        cabinet={selectedCabinetForPrint}
        isOpen={isPrintQRModalOpen}
        onClose={() => setIsPrintQRModalOpen(false)}
      />

      <ScanQRModal
        isOpen={isScanQRModalOpen}
        onClose={() => setIsScanQRModalOpen(false)}
        cabinets={cabinets}
        onCabinetScanned={(cabId) => handleSelectCabinetForTerminal(cabId)}
      />

      <QuickIssueModal
        isOpen={isQuickIssueModalOpen}
        onClose={() => setIsQuickIssueModalOpen(false)}
        items={items}
        onIssueSuccess={handleItemIssued}
      />
    </div>
  );
}
