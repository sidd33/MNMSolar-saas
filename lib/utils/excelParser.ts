import * as xlsx from "xlsx";

export interface HandoverData {
  clientName?: string;
  address?: string;
  dcCapacity?: string;
  orderValue?: string;
  orderValueWithTax?: string;
  projectType?: string;
  primaryContactName?: string;
  primaryContactMobile?: string;
  paymentTerms?: {
    advance?: string;
    structureDispatch?: string;
    materialReadiness?: string;
    structureErection?: string;
    commissioning?: string;
    retention?: string;
  }
}

export async function parseHandoverExcel(fileBuffer: ArrayBuffer): Promise<HandoverData> {
  const workbook = xlsx.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const json: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  let customerName = "";
  let capacity = "";
  let newAddress = "";
  let orderValue = "";
  let orderValueWithTax = "";
  let projectType = "";
  let contactName = "";
  let contactMobile = "";
  
  const paymentTerms: HandoverData['paymentTerms'] = {};

  // 1 & 2. Client Name and Address (Strictly Col A, stop at row 15)
  for (let r = 0; r < Math.min(15, json.length); r++) {
    const row = json[r];
    if (!row || !row.length) continue;

    const colA = row[0] ? String(row[0]).toLowerCase().trim() : "";

    if (colA === "customer name") {
      for (let c = row.length - 1; c >= 1; c--) {
        if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== "") {
          customerName = String(row[c]).trim();
          break;
        }
      }
    }

    if (colA === "address") {
      for (let c = row.length - 1; c >= 1; c--) {
        if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== "") {
          newAddress = String(row[c]).trim();
          break;
        }
      }
    }
  }

  // 3. Scan everything else
  for (let r = 0; r < json.length; r++) {
    const row = json[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const cellVal = row[c] ? String(row[c]).toLowerCase().trim() : "";
      const exactVal = row[c] ? String(row[c]).toUpperCase().trim() : "";

      if (cellVal.includes("capacity") || cellVal.includes("(kw)") || cellVal === "kw") {
        if (r + 1 < json.length) {
          const valueBelow = json[r + 1][c];
          if (valueBelow !== undefined && valueBelow !== null && String(valueBelow).trim() !== "") {
            capacity = String(valueBelow).replace(/kw/i, "").replace(/[^0-9.]/g, '').trim();
          }
        }
      }

      if (cellVal === "order value with tax") {
        if (r + 1 < json.length) {
          const valueBelow = json[r + 1][c];
          if (valueBelow !== undefined && valueBelow !== null && String(valueBelow).trim() !== "") {
            orderValueWithTax = String(valueBelow).replace(/,/g, '').replace(/[^0-9.]/g, '').trim();
          }
        }
      }

      if (cellVal.includes("order value (rs.)") || cellVal === "considered" || cellVal === "order value") {
        if (r + 1 < json.length) {
          const valueBelow = json[r + 1][c];
          if (valueBelow !== undefined && valueBelow !== null && String(valueBelow).trim() !== "") {
            const val = String(valueBelow).replace(/,/g, '').replace(/[^0-9.]/g, '').trim();
            if (val) orderValue = val;
          }
        }
      }

      // Payment Terms Parsing
      if (cellVal === "advance") paymentTerms.advance = extractPercent(json[r][c+1]);
      if (cellVal.includes("structure for dispatch")) paymentTerms.structureDispatch = extractPercent(json[r][c+1]);
      if (cellVal.includes("solar material readiness")) paymentTerms.materialReadiness = extractPercent(json[r][c+1]);
      if (cellVal.includes("structure erection")) paymentTerms.structureErection = extractPercent(json[r][c+1]);
      if (cellVal.includes("installation & commissioning")) paymentTerms.commissioning = extractPercent(json[r][c+1]);
      if (cellVal.includes("retention for")) paymentTerms.retention = extractPercent(json[r][c+1]);

      if (!contactName && cellVal === "contact person") {
        let mobileIndex = -1;
        row.forEach((v, i) => { if (String(v).toLowerCase().trim() === "mobile") mobileIndex = i; });

        if (r + 1 < json.length) {
          const valueBelow = json[r + 1][c];
          if (valueBelow !== undefined && valueBelow !== null && String(valueBelow).trim() !== "") {
            contactName = String(valueBelow).trim();
          }
          if (mobileIndex !== -1) {
            const mobileBelow = json[r + 1][mobileIndex];
            if (mobileBelow !== undefined && mobileBelow !== null && String(mobileBelow).trim() !== "") {
              contactMobile = String(mobileBelow).replace(/[^0-9.+E]/g, '').trim();
            }
          }
        }
      }

      if (exactVal.includes("CAPEX")) projectType = "CAPEX";
      if (exactVal.includes("OPEX")) projectType = "OPEX";
    }
  }

  return {
    clientName: customerName,
    address: newAddress,
    dcCapacity: capacity,
    orderValue: orderValue,
    orderValueWithTax: orderValueWithTax,
    projectType: projectType,
    primaryContactName: contactName,
    primaryContactMobile: contactMobile,
    paymentTerms
  };
}

function extractPercent(val: any): string {
  if (val === undefined || val === null) return "";
  const s = String(val).trim();
  if (s === "—" || s === "-") return "";
  // If it's a fraction (like 0.05 for 5%)
  if (!isNaN(Number(s)) && Number(s) < 1 && Number(s) > 0) {
    return (Number(s) * 100).toString();
  }
  return s.replace(/[^0-9.]/g, '');
}
