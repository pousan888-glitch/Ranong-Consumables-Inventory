export type StockStatus = 'critical' | 'low' | 'normal';

export interface ConsumableItem {
  id: string;
  sku: string;
  name: string;
  spec: string;
  department: 'Maintenance' | 'Production' | 'QA/QC' | 'Logistics' | 'Safety';
  departmentTh: string;
  cabinetId: string;
  cabinetShelf: string;
  balance: number;
  safetyMin: number;
  unit: string;
  costPerUnit: number;
  status: StockStatus;
  lastAuditedBy: string;
  lastAuditedTime: string;
  selectedForPR?: boolean;
}

export interface Cabinet {
  id: string;
  name: string;
  zone: string;
  zoneCode: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D';
  qrCode: string;
  totalItems: number;
  lowStockCount: number;
  criticalCount: number;
  status: 'counted' | 'pending' | 'safe' | 'recount';
  statusTextTh: string;
  lastAuditTime: string;
  auditor: string;
  responsibleEngineer: string;
  descriptionTh: string;
  items: {
    sku: string;
    name: string;
    qty: string;
    status: 'good' | 'normal' | 'low' | 'critical';
    statusTh: string;
  }[];
}

export interface DepartmentSummary {
  id: string;
  name: string;
  thName: string;
  percentage: number;
  budget: number;
  units: number;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  statusTextTh: string;
  primaryCabinet: string;
  criticalTextTh: string;
  topItems: string[];
}

export interface QuickPRItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  qty: number;
  estimatedPrice: number;
}

export interface AuditFeedItem {
  id: string;
  cabinetId: string;
  title: string;
  detail: string;
  time: string;
  auditor: string;
  type: 'done' | 'in_progress' | 'alert';
}

export interface RequisitionRecord {
  id: string;
  timestamp: string;
  lotNo: string;
  itemsSummary: string;
  requester: string;
  status: 'completed' | 'pending';
  statusTh: string;
  urgent?: boolean;
  purpose?: string;
  targetCabinet?: string;
}

export interface UserStaff {
  id: string;
  name: string;
  empId: string;
  email: string;
  titleTh: string;
  role: 'super_admin' | 'warehouse_admin' | 'helper' | 'qa_qc';
  roleNameTh: string;
  zones: string[];
  status: 'active' | 'offline' | 'pending';
  avatar: string;
  assignedBy?: string;
  assignedTime?: string;
}

export type ActiveNavTab = 
  | 'inventory' // Dashboard / Stock Triage
  | 'cabinets'  // Cabinets & Bins
  | 'reorders'  // Requisition / Disbursement
  | 'logs'      // Audit Logs & Feeds
  | 'settings'  // User & Role Assignment
  | 'helper';   // Helper Mode (Terminal)
