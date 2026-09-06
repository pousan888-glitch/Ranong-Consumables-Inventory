import { getAccessToken } from './firebaseAuth';
import { ConsumableItem, RequisitionRecord, Cabinet } from '../types';

export interface SyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  message: string;
}

/**
 * Creates or updates an active Google Spreadsheet with current warehouse inventory data.
 */
export async function syncInventoryToGoogleSheets(
  items: ConsumableItem[],
  requisitions: RequisitionRecord[],
  cabinets: Cabinet[],
  existingSpreadsheetId?: string
): Promise<SyncResult> {
  const token = await getAccessToken();
  if (!token) {
    return {
      success: false,
      message: 'กรุณาลงชื่อเข้าใช้ด้วย Google ก่อน เพื่อเชื่อมต่อ Google Sheets',
    };
  }

  try {
    let spreadsheetId = existingSpreadsheetId;
    let spreadsheetUrl = '';

    // Step 1: Create a new spreadsheet if one doesn't exist yet
    if (!spreadsheetId) {
      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `Ranong Port Terminal 04 - คลังพัสดุสิ้นเปลือง (${new Date().toLocaleDateString('th-TH')})`,
          },
          sheets: [
            { properties: { title: 'สต็อกพัสดุ (Inventory)' } },
            { properties: { title: 'ประวัติเบิกจ่าย (Requisitions)' } },
            { properties: { title: 'ผังตู้จัดเก็บ (Cabinets)' } },
          ],
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error?.message || 'ไม่สามารถสร้าง Google Sheets ได้');
      }

      const createData = await createResponse.json();
      spreadsheetId = createData.spreadsheetId;
      spreadsheetUrl = createData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    } else {
      spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    }

    // Step 2: Populate Sheet 1 - Inventory
    const inventoryHeaders = [
      'รหัสพัสดุ (SKU)',
      'ชื่อรายการพัสดุ',
      'สเปก / รายละเอียด',
      'ฝ่าย / แผนก',
      'ตู้จัดเก็บ',
      'ชั้นเก็บ',
      'คงเหลือ',
      'Safety Min',
      'หน่วย',
      'ราคาประเมิน/หน่วย (บาท)',
      'สถานะสต็อก',
      'ผู้ตรวจนับล่าสุด',
      'เวลาตรวจนับ',
    ];

    const inventoryRows = items.map((it) => [
      it.sku,
      it.name,
      it.spec,
      it.departmentTh,
      it.cabinetId,
      it.cabinetShelf,
      it.balance,
      it.safetyMin,
      it.unit,
      it.costPerUnit,
      it.status === 'critical' ? '🔴 วิกฤต (Critical)' : it.status === 'low' ? '🟡 ใกล้หมด (Low)' : '🟢 ปกติ (Normal)',
      it.lastAuditedBy,
      it.lastAuditedTime,
    ]);

    // Step 3: Populate Sheet 2 - Requisitions
    const requisitionHeaders = [
      'รหัสใบเบิก',
      'วันที่และเวลา',
      'ล็อตงานที่อ้างอิง',
      'รายการพัสดุที่เบิก',
      'ผู้ขอเบิก',
      'สถานะ',
      'ด่วนพิเศษ (Urgent)',
      'วัตถุประสงค์',
    ];

    const requisitionRows = requisitions.map((req) => [
      req.id,
      req.timestamp,
      req.lotNo,
      req.itemsSummary,
      req.requester,
      req.statusTh,
      req.urgent ? 'ใช่ (ด่วน)' : 'ปกติ',
      req.purpose || '-',
    ]);

    // Step 4: Populate Sheet 3 - Cabinets
    const cabinetHeaders = [
      'รหัสตู้',
      'ชื่อตู้จัดเก็บ',
      'โซนพื้นที่',
      'รหัส QR ประจำตู้',
      'จำนวนรายการ (SKU)',
      'สถานะตรวจนับ',
      'ผู้ตรวจนับล่าสุด',
      'เวลาตรวจล่าสุด',
      'วิศวกรผู้รับผิดชอบ',
    ];

    const cabinetRows = cabinets.map((cab) => [
      cab.id,
      cab.name,
      cab.zone,
      cab.qrCode,
      cab.totalItems,
      cab.statusTextTh,
      cab.auditor,
      cab.lastAuditTime,
      cab.responsibleEngineer,
    ]);

    // Send batch update to Google Sheets API
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const batchUpdateResponse = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'สต็อกพัสดุ (Inventory)'!A1",
            values: [inventoryHeaders, ...inventoryRows],
          },
          {
            range: "'ประวัติเบิกจ่าย (Requisitions)'!A1",
            values: [requisitionHeaders, ...requisitionRows],
          },
          {
            range: "'ผังตู้จัดเก็บ (Cabinets)'!A1",
            values: [cabinetHeaders, ...cabinetRows],
          },
        ],
      }),
    });

    if (!batchUpdateResponse.ok) {
      const err = await batchUpdateResponse.json();
      throw new Error(err.error?.message || 'บันทึกข้อมูลลง Google Sheets ล้มเหลว');
    }

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      message: 'ซิงค์ข้อมูลกับ Google Sheets สำเร็จเรียบร้อยแล้ว',
    };
  } catch (error: any) {
    console.error('Google Sheets Sync error:', error);
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets',
    };
  }
}

/**
 * Client-side CSV download fallback
 */
export function exportToCSV(items: ConsumableItem[], filename = 'ranong-consumables-inventory.csv') {
  const headers = ['SKU', 'Name', 'Department', 'Cabinet', 'Shelf', 'Balance', 'SafetyMin', 'Unit', 'Status', 'LastAuditedBy', 'LastAuditedTime'];
  const rows = items.map(item => [
    `"${item.sku}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.departmentTh}"`,
    `"${item.cabinetId}"`,
    `"${item.cabinetShelf}"`,
    item.balance,
    item.safetyMin,
    `"${item.unit}"`,
    `"${item.status}"`,
    `"${item.lastAuditedBy}"`,
    `"${item.lastAuditedTime}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
