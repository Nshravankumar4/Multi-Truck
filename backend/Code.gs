/**
 * Transport Brokerage Ledger Pvt Ltd
 * Enterprise Google Apps Script Backend (Code.gs)
 *
 * Dedicated Google Spreadsheet:
 * https://docs.google.com/spreadsheets/d/1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4/edit?usp=sharing
 *
 * Google Apps Script Project Editor:
 * https://script.google.com/u/0/home/projects/1l4GkXJ-eiX-SzyeGlfBMWc-H32sE2ubeNnq_LDEDXqMtYhU6b4Zls8bL/edit
 *
 * Active Web App Deployment:
 * URL: https://script.google.com/macros/s/AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ/exec
 * Deployment ID: AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ
 */

var CONFIG = {
  SPREADSHEET_ID: "1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4"
};

var PRIMARY_SPREADSHEET_ID = CONFIG.SPREADSHEET_ID;

var SHEETS = {
  PROJECT_SETTINGS: "Project_Settings",
  FLEET: "Fleet",
  DRIVERS: "Drivers",
  PL_ACCOUNTS: "PL_Accounts",
  TRIPS: "Trips",
  DIESEL_ENTRIES: "Diesel_Entries",
  DRIVER_SETTLEMENTS: "Driver_Settlements",
  ROAD_EXPENSES: "Road_Expenses",
  ADVANCES: "Advances",
  MONTHLY_ARCHIVES: "Monthly_Archives",
  AUDIT_LOG: "Audit_Log",
  META: "_Meta"
};

function resolveProjectSpreadsheet(spreadsheetId, projectId) {
  try {
    var bound = SpreadsheetApp.getActiveSpreadsheet();
    if (bound) return bound;
  } catch (e) {}

  var targetId = (spreadsheetId && spreadsheetId.trim() !== "" && !spreadsheetId.includes("placeholder"))
    ? spreadsheetId.trim()
    : PRIMARY_SPREADSHEET_ID;

  if (targetId && targetId !== "") {
    try {
      return SpreadsheetApp.openById(targetId);
    } catch (err) {
      throw new Error("Unable to open Google Spreadsheet with ID: " + targetId + " (" + err.message + ")");
    }
  }

  throw new Error("No valid Google Spreadsheet bound or configured.");
}

function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("🚚 SR Transport")
      .addItem("🔄 Initialize Master Tabs & Schema", "initializeMasterSheets")
      .addItem("💾 Create Drive Backup Snapshot", "createManualBackup")
      .addToUi();
  } catch (e) {}
}

function initializeMasterSheets() {
  var ss = resolveProjectSpreadsheet("", "PRJ-001");
  ensureProjectSheetsStructure(ss);

  var initialStore = {
    version: 3,
    lastUpdated: new Date().toISOString(),
    activePeriod: "2026-10",
    trucks: [
      { id: "TG15T6666", regNumber: "TG15T6666", driverId: "DRV-001", model: "BharatBenz 3528C", capacity: "35 Tons", status: "Active" },
      { id: "TS15UE1122", regNumber: "TS15UE1122", driverId: "DRV-002", model: "Tata Signa 3523", capacity: "35 Tons", status: "Active" }
    ],
    drivers: [
      { id: "DRV-001", name: "Noor Allam", phone: "+91 98765 43210", truckId: "TG15T6666", commissionRate: 0.12, status: "Active" },
      { id: "DRV-002", name: "Allam Brother", phone: "+91 98765 43211", truckId: "TS15UE1122", commissionRate: 0.12, status: "Active" }
    ],
    pnlData: {
      "TG15T6666": {
        truckId: "TG15T6666", driverName: "Noor Allam", period: "October 2026", oldBalance: 13800,
        revenue: { p1Freight: 382800, baseFreight: 339500, haltage: 0, loadingCharges: 0, detention: 0 },
        expenses: { dieselTotal: 132600, roadTotalClaimed: 28700, roadTotalItemized: 28735, driverCommission: 40740, fastagCharges: 40000, fixedTotal: 55000 },
        trips: [
          { id: "TRP-66-1", date: "2026-10-02", source: "MDCL", destination: "MADHAPURA", freightP1: 175000, baseFreight: 140000, dieselAmount: 62000, roadExpenses: 13500 },
          { id: "TRP-66-2", date: "2026-10-09", source: "AURGANGABAD", destination: "HYD", freightP1: 108500, baseFreight: 108500, dieselAmount: 38000, roadExpenses: 8200 },
          { id: "TRP-66-3", date: "2026-10-15", source: "K\"NAG", destination: "KURNOOL", freightP1: 72300, baseFreight: 64000, dieselAmount: 18000, roadExpenses: 4500 },
          { id: "TRP-66-4", date: "2026-10-18", source: "KURNOOL", destination: "MDCL", freightP1: 27000, baseFreight: 27000, dieselAmount: 14600, roadExpenses: 2500 }
        ],
        dieselLogs: [
          { id: "DSL-66-1", date: "2026-10-02", pump: "IndianOil Hyd", liters: 338.89, rate: 90, amount: 30500 },
          { id: "DSL-66-2", date: "2026-10-08", pump: "BPCL Nagpur", liters: 338.89, rate: 90, amount: 30500 },
          { id: "DSL-66-3", date: "2026-10-14", pump: "HPCL Raipur", liters: 351.11, rate: 90, amount: 31600 },
          { id: "DSL-66-4", date: "2026-10-17", pump: "IndianOil Kurnool", liters: 144.44, rate: 90, amount: 13000 },
          { id: "DSL-66-5", date: "2026-10-19", pump: "Reliance Hyd", liters: 300.00, rate: 90, amount: 27000 }
        ],
        advances: [
          { id: "ADV-66-1", date: "2026-10-01", type: "Cash", purpose: "NAGAPUR ADV", amount: 5000 },
          { id: "ADV-66-2", date: "2026-10-03", type: "Bank", purpose: "VARANSANI ADV", amount: 6000 },
          { id: "ADV-66-3", date: "2026-10-05", type: "Cash", purpose: "MOBILE PH", amount: 2000 },
          { id: "ADV-66-4", date: "2026-10-08", type: "Cash", purpose: "BAHAGALPUR", amount: 3000 },
          { id: "ADV-66-5", date: "2026-10-10", type: "Bank", purpose: "VARANSANI ADV", amount: 7000 },
          { id: "ADV-66-6", date: "2026-10-12", type: "Cash", purpose: "NAGAPUR ADV", amount: 3000 },
          { id: "ADV-66-7", date: "2026-10-14", type: "Cash", purpose: "CHEGUNTA JAFFER DABA", amount: 2000 },
          { id: "ADV-66-8", date: "2026-10-16", type: "Bank", purpose: "HOME TRSF", amount: 10000 },
          { id: "ADV-66-9", date: "2026-10-18", type: "Cash", purpose: "MDCL ADV", amount: 5000 },
          { id: "ADV-66-10", date: "2026-10-20", type: "Cash", purpose: "MOBILE PH", amount: 35200 }
        ],
        roadExpenseItems: [
          { id: "RXP-66-1", date: "2026-10-03", category: "Toll / RTO", desc: "HYD KANTA + TARPAL", amount: 800 },
          { id: "RXP-66-2", date: "2026-10-08", category: "Police / Border", desc: "Borders & Checks", amount: 4200 },
          { id: "RXP-66-3", date: "2026-10-15", category: "Loading / Unloading", desc: "Labor & Vouchers", amount: 23735 }
        ],
        otherExpenses: [
          { id: "OXP-66-1", date: "2026-10-05", category: "FastTag", desc: "FastTag Toll Recharge", amount: 40000 },
          { id: "OXP-66-2", date: "2026-10-20", category: "Miscellaneous", desc: "AddBlue & Maintenance", amount: 15000 }
        ]
      },
      "TS15UE1122": {
        truckId: "TS15UE1122", driverName: "Allam Brother", period: "October 2026", oldBalance: 62340,
        revenue: { p1Freight: 236000, baseFreight: 199000, haltage: 0, loadingCharges: 0, detention: 0 },
        expenses: { dieselTotal: 103000, roadTotalClaimed: 11790, roadTotalItemized: 11790, driverCommission: 23880, fastagCharges: 25000, fixedTotal: 45000 },
        trips: [
          { id: "TRP-11-1", date: "2026-10-04", source: "MDCL", destination: "CHEGUNTA", freightP1: 15000, baseFreight: 10000, dieselAmount: 24000, roadExpenses: 2500 },
          { id: "TRP-11-2", date: "2026-10-06", source: "MDCL", destination: "MUZZFARPUR", freightP1: 141000, baseFreight: 114000, dieselAmount: 42000, roadExpenses: 5290 },
          { id: "TRP-11-3", date: "2026-10-11", source: "JABALPUR", destination: "BHONIGIRI", freightP1: 80000, baseFreight: 75000, dieselAmount: 37000, roadExpenses: 4000 }
        ],
        dieselLogs: [
          { id: "DSL-11-1", date: "2026-10-05", pump: "IndianOil Hyd", liters: 266.67, rate: 90, amount: 24000 },
          { id: "DSL-11-2", date: "2026-10-09", pump: "HPCL Vijayawada", liters: 211.11, rate: 90, amount: 19000 },
          { id: "DSL-11-3", date: "2026-10-12", pump: "BPCL Jabalpur", liters: 255.56, rate: 90, amount: 23000 },
          { id: "DSL-11-4", date: "2026-10-16", pump: "IndianOil Bhonigiri", liters: 111.11, rate: 90, amount: 10000 },
          { id: "DSL-11-5", date: "2026-10-18", pump: "Reliance Hyd", liters: 300.00, rate: 90, amount: 27000 }
        ],
        advances: [
          { id: "ADV-11-1", date: "2026-10-04", type: "Cash", purpose: "MDCL ADV", amount: 2500 },
          { id: "ADV-11-2", date: "2026-10-06", type: "Cash", purpose: "NAGAPUR", amount: 5000 },
          { id: "ADV-11-3", date: "2026-10-08", type: "Cash", purpose: "EN ROUTE", amount: 5000 },
          { id: "ADV-11-4", date: "2026-10-10", type: "Bank", purpose: "HOME TRSF", amount: 20000 },
          { id: "ADV-11-5", date: "2026-10-13", type: "Cash", purpose: "JABALPUR", amount: 5000 },
          { id: "ADV-11-6", date: "2026-10-15", type: "Cash", purpose: "CHANDRAPUR", amount: 4000 }
        ],
        roadExpenseItems: [
          { id: "RXP-11-1", date: "2026-10-06", category: "Toll / RTO", desc: "Police Parchi & Tolls", amount: 4300 },
          { id: "RXP-11-2", date: "2026-10-14", category: "Loading / Unloading", desc: "Labor & Checkpost Vouchers", amount: 7490 }
        ],
        otherExpenses: [
          { id: "OXP-11-1", date: "2026-10-05", category: "FastTag", desc: "FastTag Toll Recharge", amount: 25000 },
          { id: "OXP-11-2", date: "2026-10-20", category: "Miscellaneous", desc: "AddBlue & Maintenance", amount: 20000 }
        ]
      }
    }
  };

  syncStateToSheets(ss, initialStore, "System Init");
}

function ensureProjectSheetsStructure(ss) {
  var headers = {
    Project_Settings: ["Setting Key", "Value", "Description", "Last Updated"],
    Fleet: ["Truck ID", "Registration No", "Assigned Driver ID", "Model", "Capacity", "Status"],
    Drivers: ["Driver ID", "Driver Name", "Phone", "Assigned Truck ID", "Commission Rate", "Status"],
    PL_Accounts: ["Truck ID", "Period", "Driver Name", "P1 Freight", "Base Freight", "Diesel Exp", "Road Exp Claimed", "Road Exp Itemized", "Driver Comm", "Fixed Exp", "Net Profit", "Net Margin %", "Driver Settlement Balance"],
    Trips: ["Trip ID", "Truck ID", "Date", "Source", "Destination", "P1 Freight", "Base Freight", "Diesel Cost", "Road Expenses", "Net Trip Margin"],
    Diesel_Entries: ["Log ID", "Truck ID", "Date", "Petrol Pump", "Liters", "Rate / Liter", "Total Amount"],
    Driver_Settlements: ["Settlement ID", "Truck ID", "Driver ID", "Period", "Total Advance", "Road Expenses Covered", "Driver Commission Earned", "Balance Payable / Receivable", "Status"],
    Road_Expenses: ["Expense ID", "Truck ID", "Date", "Category", "Description", "Amount"],
    Advances: ["Advance ID", "Truck ID", "Driver ID", "Date", "Payment Type", "Purpose", "Amount"],
    Monthly_Archives: ["Archive ID", "Project ID", "Period", "Trucks Active", "Total Revenue", "Total Diesel", "Total Driver Comm", "Total Expenses", "Net Profit", "Archive Date"],
    Audit_Log: ["Timestamp", "User", "Action", "Record Type", "Record ID", "Details"],
    _Meta: ["Meta Key", "Meta Value", "Updated At"]
  };

  Object.keys(headers).forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers[sheetName]);
      formatSheetHeaders(sheet, headers[sheetName].length);
    }
  });
}

function formatSheetHeaders(sheet, numCols) {
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground("#1e3a8a");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
  for (var i = 1; i <= numCols; i++) {
    sheet.autoResizeColumn(i);
  }
}

function doGet(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return jsonResponse({ success: false, error: "Database lock timeout: " + err.message });
  }

  try {
    var p = e ? e.parameter : {};
    var action = p.action || "getData";
    var spreadsheetId = p.spreadsheetId || "";
    var projectId = p.projectId || "PRJ-001";

    var ss = resolveProjectSpreadsheet(spreadsheetId, projectId);
    ensureProjectSheetsStructure(ss);

    if (action === "ping") {
      return jsonResponse({ success: true, message: "Transport Brokerage Backend Active", timestamp: new Date().toISOString() });
    }

    if (action === "getData") {
      var state = readStateFromSheets(ss);
      return jsonResponse({ success: true, data: state, serverTimestamp: new Date().toISOString() });
    }

    return jsonResponse({ success: false, error: "Unsupported GET action: " + action });

  } catch (ex) {
    return jsonResponse({ success: false, error: ex.message });
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // 30s atomic ScriptLock on mutations (Test 9)
  } catch (err) {
    return jsonResponse({ success: false, error: "Write lock concurrency timeout: " + err.message });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Empty POST body payload" });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || "saveData";
    var spreadsheetId = payload.spreadsheetId || "";
    var projectId = payload.projectId || "PRJ-001";
    var user = payload.user || "System";
    var token = payload.token || "";

    var ss = resolveProjectSpreadsheet(spreadsheetId, projectId);
    ensureProjectSheetsStructure(ss);

    // Server-Side RBAC Delete Authorization (Test 11)
    if (action === "deleteRecord") {
      var role = payload.role || (user.toLowerCase() === "admin" ? "ADMIN" : "OPERATOR");
      if (role !== "ADMIN" || user.toLowerCase() !== "admin") {
        return jsonResponse({
          success: false,
          error: "DELETE_UNAUTHORIZED: Only Administrator (Admin) has server-side privileges to delete ledger entries."
        });
      }
      if (!token || token.trim() === "" || token.length < 16) {
        return jsonResponse({
          success: false,
          error: "DELETE_UNAUTHORIZED: Invalid or expired session authentication token."
        });
      }

      var recordType = payload.recordType;
      var recordId = payload.recordId;
      var deleteResult = deleteRecordFromSheet(ss, recordType, recordId, user);
      return jsonResponse(deleteResult);
    }

    if (action === "saveData" || action === "sync") {
      var storeData = payload.data;
      if (!storeData) {
        return jsonResponse({ success: false, error: "Missing data payload for synchronization" });
      }

      syncStateToSheets(ss, storeData, user);
      logAudit(ss, user, "SYNC", "ALL", "Complete Store Sync");

      return jsonResponse({
        success: true,
        message: "Data successfully synchronized and persisted to Google Sheets",
        serverTimestamp: new Date().toISOString(),
        version: storeData.version || 3,
        store: storeData
      });
    }

    return jsonResponse({ success: false, error: "Unknown action: " + action });

  } catch (ex) {
    return jsonResponse({ success: false, error: ex.message });
  } finally {
    lock.releaseLock();
  }
}

function readStateFromSheets(ss) {
  var state = {
    version: 3,
    lastUpdated: new Date().toISOString(),
    activePeriod: "2026-10",
    trucks: [],
    drivers: [],
    pnlData: {}
  };

  var metaSheet = ss.getSheetByName(SHEETS.META);
  if (metaSheet && metaSheet.getLastRow() > 1) {
    var metaValues = metaSheet.getRange(2, 1, metaSheet.getLastRow() - 1, 2).getValues();
    metaValues.forEach(function(row) {
      if (row[0] === "ACTIVE_PERIOD") state.activePeriod = String(row[1]);
      if (row[0] === "DATA_VERSION") state.version = Number(row[1]) || 3;
    });
  }

  var fleetSheet = ss.getSheetByName(SHEETS.FLEET);
  if (fleetSheet && fleetSheet.getLastRow() > 1) {
    var fleetRows = fleetSheet.getRange(2, 1, fleetSheet.getLastRow() - 1, 6).getValues();
    fleetRows.forEach(function(r) {
      if (r[0]) {
        state.trucks.push({
          id: String(r[0]), regNumber: String(r[1]), driverId: String(r[2]),
          model: String(r[3]), capacity: String(r[4]), status: String(r[5])
        });
        state.pnlData[String(r[0])] = {
          truckId: String(r[0]), driverName: "", period: state.activePeriod, oldBalance: 0,
          revenue: { p1Freight: 0, baseFreight: 0, haltage: 0, loadingCharges: 0, detention: 0 },
          expenses: { dieselTotal: 0, roadTotalClaimed: 0, roadTotalItemized: 0, driverCommission: 0, fastagCharges: 0, fixedTotal: 0 },
          trips: [], dieselLogs: [], advances: [], roadExpenseItems: [], otherExpenses: []
        };
      }
    });
  }

  var drvSheet = ss.getSheetByName(SHEETS.DRIVERS);
  if (drvSheet && drvSheet.getLastRow() > 1) {
    var drvRows = drvSheet.getRange(2, 1, drvSheet.getLastRow() - 1, 6).getValues();
    drvRows.forEach(function(r) {
      if (r[0]) {
        state.drivers.push({
          id: String(r[0]), name: String(r[1]), phone: String(r[2]),
          truckId: String(r[3]), commissionRate: Number(r[4]) || 0.12, status: String(r[5])
        });
        if (state.pnlData[String(r[3])]) {
          state.pnlData[String(r[3])].driverName = String(r[1]);
        }
      }
    });
  }

  var tripSheet = ss.getSheetByName(SHEETS.TRIPS);
  if (tripSheet && tripSheet.getLastRow() > 1) {
    var tripRows = tripSheet.getRange(2, 1, tripSheet.getLastRow() - 1, 9).getValues();
    tripRows.forEach(function(r) {
      var tId = String(r[1]);
      if (state.pnlData[tId]) {
        state.pnlData[tId].trips.push({
          id: String(r[0]), date: formatDateCell(r[2]), source: String(r[3]),
          destination: String(r[4]), freightP1: Number(r[5]) || 0, baseFreight: Number(r[6]) || 0,
          dieselAmount: Number(r[7]) || 0, roadExpenses: Number(r[8]) || 0
        });
      }
    });
  }

  var dslSheet = ss.getSheetByName(SHEETS.DIESEL_ENTRIES);
  if (dslSheet && dslSheet.getLastRow() > 1) {
    var dslRows = dslSheet.getRange(2, 1, dslSheet.getLastRow() - 1, 7).getValues();
    dslRows.forEach(function(r) {
      var tId = String(r[1]);
      if (state.pnlData[tId]) {
        state.pnlData[tId].dieselLogs.push({
          id: String(r[0]), date: formatDateCell(r[2]), pump: String(r[3]),
          liters: Number(r[4]) || 0, rate: Number(r[5]) || 0, amount: Number(r[6]) || 0
        });
      }
    });
  }

  var rxpSheet = ss.getSheetByName(SHEETS.ROAD_EXPENSES);
  if (rxpSheet && rxpSheet.getLastRow() > 1) {
    var rxpRows = rxpSheet.getRange(2, 1, rxpSheet.getLastRow() - 1, 6).getValues();
    rxpRows.forEach(function(r) {
      var tId = String(r[1]);
      if (state.pnlData[tId]) {
        state.pnlData[tId].roadExpenseItems.push({
          id: String(r[0]), date: formatDateCell(r[2]), category: String(r[3]),
          desc: String(r[4]), amount: Number(r[5]) || 0
        });
      }
    });
  }

  var advSheet = ss.getSheetByName(SHEETS.ADVANCES);
  if (advSheet && advSheet.getLastRow() > 1) {
    var advRows = advSheet.getRange(2, 1, advSheet.getLastRow() - 1, 7).getValues();
    advRows.forEach(function(r) {
      var tId = String(r[1]);
      if (state.pnlData[tId]) {
        state.pnlData[tId].advances.push({
          id: String(r[0]), date: formatDateCell(r[3]), type: String(r[4]),
          purpose: String(r[5]), amount: Number(r[6]) || 0
        });
      }
    });
  }

  return state;
}

function syncStateToSheets(ss, store, user) {
  if (store.trucks && store.trucks.length > 0) {
    var fSheet = ss.getSheetByName(SHEETS.FLEET);
    clearDataRows(fSheet);
    var fData = store.trucks.map(function(t) {
      return [t.id, t.regNumber, t.driverId || "", t.model || "", t.capacity || "", t.status || "Active"];
    });
    if (fData.length > 0) fSheet.getRange(2, 1, fData.length, 6).setValues(fData);
  }

  if (store.drivers && store.drivers.length > 0) {
    var dSheet = ss.getSheetByName(SHEETS.DRIVERS);
    clearDataRows(dSheet);
    var dData = store.drivers.map(function(d) {
      return [d.id, d.name, d.phone || "", d.truckId || "", d.commissionRate || 0.12, d.status || "Active"];
    });
    if (dData.length > 0) dSheet.getRange(2, 1, dData.length, 6).setValues(dData);
  }

  var allTrips = [];
  var allDiesel = [];
  var allRoad = [];
  var allAdvances = [];
  var plRows = [];

  if (store.pnlData) {
    Object.keys(store.pnlData).forEach(function(truckId) {
      var pnl = store.pnlData[truckId];

      (pnl.trips || []).forEach(function(t) {
        var net = (Number(t.freightP1) || 0) - (Number(t.dieselAmount) || 0) - (Number(t.roadExpenses) || 0);
        allTrips.push([t.id, truckId, t.date, t.source, t.destination, t.freightP1, t.baseFreight, t.dieselAmount, t.roadExpenses, net]);
      });

      (pnl.dieselLogs || []).forEach(function(d) {
        allDiesel.push([d.id, truckId, d.date, d.pump, d.liters, d.rate, d.amount]);
      });

      (pnl.roadExpenseItems || []).forEach(function(r) {
        allRoad.push([r.id, truckId, r.date, r.category, r.desc, r.amount]);
      });

      (pnl.advances || []).forEach(function(a) {
        allAdvances.push([a.id, truckId, a.driverId || "", a.date, a.type, a.purpose, a.amount]);
      });

      var rev = pnl.revenue || {};
      var exp = pnl.expenses || {};
      var p1 = Number(rev.p1Freight) || 0;
      var base = Number(rev.baseFreight) || 0;
      var dsl = Number(exp.dieselTotal) || 0;
      var rdClaimed = Number(exp.roadTotalClaimed) || 0;
      var rdItem = Number(exp.roadTotalItemized) || 0;
      var comm = Number(exp.driverCommission) || 0;
      var fixed = Number(exp.fixedTotal) || 0;
      var netProfit = p1 - dsl - rdItem - comm - fixed;
      var margin = p1 > 0 ? ((netProfit / p1) * 100).toFixed(2) : "0.00";

      plRows.push([truckId, pnl.period || store.activePeriod, pnl.driverName || "", p1, base, dsl, rdClaimed, rdItem, comm, fixed, netProfit, margin, 0]);
    });
  }

  var tSheet = ss.getSheetByName(SHEETS.TRIPS);
  clearDataRows(tSheet);
  if (allTrips.length > 0) tSheet.getRange(2, 1, allTrips.length, 10).setValues(allTrips);

  var dslSheet = ss.getSheetByName(SHEETS.DIESEL_ENTRIES);
  clearDataRows(dslSheet);
  if (allDiesel.length > 0) dslSheet.getRange(2, 1, allDiesel.length, 7).setValues(allDiesel);

  var rxpSheet = ss.getSheetByName(SHEETS.ROAD_EXPENSES);
  clearDataRows(rxpSheet);
  if (allRoad.length > 0) rxpSheet.getRange(2, 1, allRoad.length, 6).setValues(allRoad);

  var advSheet = ss.getSheetByName(SHEETS.ADVANCES);
  clearDataRows(advSheet);
  if (allAdvances.length > 0) advSheet.getRange(2, 1, allAdvances.length, 7).setValues(allAdvances);

  var plSheet = ss.getSheetByName(SHEETS.PL_ACCOUNTS);
  clearDataRows(plSheet);
  if (plRows.length > 0) plSheet.getRange(2, 1, plRows.length, 13).setValues(plRows);

  var mSheet = ss.getSheetByName(SHEETS.META);
  if (mSheet) {
    clearDataRows(mSheet);
    var metaData = [
      ["ACTIVE_PERIOD", store.activePeriod || "2026-10", new Date().toISOString()],
      ["DATA_VERSION", store.version || 3, new Date().toISOString()],
      ["LAST_SYNCED_BY", user || "System", new Date().toISOString()],
      ["LAST_SYNC_TIMESTAMP", new Date().toISOString(), new Date().toISOString()]
    ];
    mSheet.getRange(2, 1, metaData.length, 3).setValues(metaData);
  }
}

function deleteRecordFromSheet(ss, recordType, recordId, user) {
  var sheetNameMap = {
    trip: SHEETS.TRIPS,
    diesel: SHEETS.DIESEL_ENTRIES,
    advance: SHEETS.ADVANCES,
    expense: SHEETS.ROAD_EXPENSES
  };

  var targetSheetName = sheetNameMap[recordType];
  if (!targetSheetName) {
    return { success: false, error: "Invalid record type: " + recordType };
  }

  var sheet = ss.getSheetByName(targetSheetName);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: false, error: "Sheet " + targetSheetName + " is empty or not found" };
  }

  var idColValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  var rowToDelete = -1;

  for (var i = 0; i < idColValues.length; i++) {
    if (String(idColValues[i][0]) === String(recordId)) {
      rowToDelete = i + 2;
      break;
    }
  }

  if (rowToDelete === -1) {
    return { success: false, error: "Record ID " + recordId + " not found in " + targetSheetName };
  }

  sheet.deleteRow(rowToDelete);
  logAudit(ss, user, "DELETE", recordType, "Deleted record ID: " + recordId + " from " + targetSheetName);

  return {
    success: true,
    message: "Record " + recordId + " successfully deleted from Google Sheets",
    deletedRecordId: recordId
  };
}

function processDeleteRecord(ss, recordType, truckId, recordId, user) {
  return deleteRecordFromSheet(ss, recordType, recordId, user);
}

function clearDataRows(sheet) {
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow > 1 && lastCol >= 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}

function logAudit(ss, user, action, type, details) {
  try {
    var aSheet = ss.getSheetByName(SHEETS.AUDIT_LOG);
    if (aSheet) {
      aSheet.appendRow([new Date().toISOString(), user, action, type, details]);
    }
  } catch (e) {}
}

function createManualBackup() {
  try {
    var ss = resolveProjectSpreadsheet("", "PRJ-001");
    var file = DriveApp.getFileById(ss.getId());
    var timeStr = Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMdd_HHmmss");
    var copyName = "Backup_" + ss.getName() + "_" + timeStr;
    file.makeCopy(copyName);
    SpreadsheetApp.getUi().alert("Backup Created", "Successfully created Google Drive snapshot: " + copyName, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    SpreadsheetApp.getUi().alert("Backup Failed", err.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function formatDateCell(cellValue) {
  if (!cellValue) return "";
  if (cellValue instanceof Date) {
    return Utilities.formatDate(cellValue, "GMT+5:30", "yyyy-MM-dd");
  }
  return String(cellValue);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
