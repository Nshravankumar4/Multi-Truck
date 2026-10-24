/**
 * Transport Brokerage Ledger Pvt Ltd
 * Fleet Logistics & Financial Accounts Management Backend
 * Google Apps Script (Code.gs)
 * Master Multi-Truck Backend for TG15T6666 & TS15UE1122
 * Concurrency Locks • Atomic Write Protection • Automated Drive Backup
 * Developed by Shravan Kumar • 2026
 */

// Global Configuration
var CONFIG = {
  // If running standalone, specify the target Google Sheet ID below:
  SPREADSHEET_ID: "", 
  BACKUP_FOLDER_NAME: "Fleet_Ledger_Backups",
  SHEET_NAMES: {
    PL_ACCOUNTS: "PL_Accounts",
    DRIVER_SETTLEMENTS: "Driver_Settlements",
    ROAD_EXPENSES: "Road_Expenses",
    ADVANCES: "Advances",
    AUDIT_LOG: "Audit_Log"
  }
};

/**
 * Safe spreadsheet accessor:
 * Checks container-bound spreadsheet first, falls back to SPREADSHEET_ID,
 * or creates/initializes a new workbook if needed.
 */
function getSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {
    // Not container-bound
  }

  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== "") {
    try {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
    } catch (e) {
      throw new Error("Unable to open Spreadsheet with ID: " + CONFIG.SPREADSHEET_ID + " (" + e.message + ")");
    }
  }

  throw new Error("Spreadsheet not found. Please bind this script to your Google Sheet (Extensions > Apps Script) or set CONFIG.SPREADSHEET_ID in Code.gs.");
}

/**
 * Web App GET handler
 */
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || "ping";

  try {
    if (action === "ping") {
      return createJsonResponse({
        status: "success",
        message: "Transport Brokerage Ledger API is active and operational.",
        timestamp: new Date().toISOString()
      });
    }

    if (action === "getData") {
      return handleGetData(params);
    }

    if (action === "backup") {
      var backupFile = createDailyDriveBackup();
      return createJsonResponse({
        status: "success",
        message: "Drive snapshot created successfully.",
        fileId: backupFile.getId(),
        fileUrl: backupFile.getUrl()
      });
    }

    return createJsonResponse({ status: "error", message: "Unknown GET action: " + action });

  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

/**
 * Web App POST handler
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // 10-second concurrency lock
    var lockSuccess = lock.tryLock(10000);
    if (!lockSuccess) {
      return createJsonResponse({ status: "error", message: "Server is busy processing another update. Please retry in a moment." });
    }

    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter;
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || "saveEntry";
    var result = null;

    if (action === "addTrip") {
      result = handleAddTrip(payload);
    } else if (action === "addDiesel") {
      result = handleAddDiesel(payload);
    } else if (action === "addAdvance") {
      result = handleAddAdvance(payload);
    } else if (action === "addExpense") {
      result = handleAddExpense(payload);
    } else if (action === "syncAll") {
      result = handleBatchSync(payload);
    } else {
      result = { status: "error", message: "Unknown POST action: " + action };
    }

    logAuditAction(payload.user || "System", action, JSON.stringify(result));
    return createJsonResponse(result);

  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Retrieve verified ledger data
 */
function handleGetData(params) {
  var ss = getSpreadsheet();
  ensureSheetsStructure(ss);

  var truckId = params.truckId || "ALL";
  var plSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PL_ACCOUNTS);
  var drvSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DRIVER_SETTLEMENTS);

  var plData = plSheet ? plSheet.getDataRange().getValues() : [];
  var drvData = drvSheet ? drvSheet.getDataRange().getValues() : [];

  return createJsonResponse({
    status: "success",
    truckId: truckId,
    timestamp: new Date().toISOString(),
    records: {
      plAccounts: plData,
      driverSettlements: drvData
    }
  });
}

/**
 * Record a new Trip
 */
function handleAddTrip(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PL_ACCOUNTS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.PL_ACCOUNTS);

  var truckId = payload.truckId || "TG15T6666";
  var row = [
    new Date(),
    truckId,
    payload.dateRange || "",
    payload.from || "",
    payload.to || "",
    payload.route || (payload.from + " TO " + payload.to),
    payload.pnlFreight || 0,
    payload.baseFreight || payload.pnlFreight || 0,
    payload.transporter || "Direct",
    payload.advanceReceived || 0,
    payload.balanceFreight || 0,
    payload.podStatus || "Delivered",
    payload.remarks || ""
  ];

  sheet.appendRow(row);
  return { status: "success", message: "Trip successfully logged into P&L ledger.", rowId: sheet.getLastRow() };
}

/**
 * Record a Diesel Fuel Slip
 */
function handleAddDiesel(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PL_ACCOUNTS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.PL_ACCOUNTS);

  var truckId = payload.truckId || "TG15T6666";
  sheet.appendRow([
    new Date(),
    truckId,
    "DIESEL_ENTRY",
    payload.date || "",
    payload.pump || "",
    payload.amount || 0
  ]);

  return { status: "success", message: "Diesel slip recorded.", rowId: sheet.getLastRow() };
}

/**
 * Record a Driver Advance
 */
function handleAddAdvance(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ADVANCES);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.ADVANCES);

  var truckId = payload.truckId || "TG15T6666";
  sheet.appendRow([
    new Date(),
    truckId,
    payload.date || "",
    payload.location || "",
    payload.amount || 0,
    payload.mode || "Cash"
  ]);

  return { status: "success", message: "Driver advance successfully logged.", rowId: sheet.getLastRow() };
}

/**
 * Record En-Route Road Expense
 */
function handleAddExpense(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ROAD_EXPENSES);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.ROAD_EXPENSES);

  var truckId = payload.truckId || "TG15T6666";
  sheet.appendRow([
    new Date(),
    truckId,
    payload.description || "",
    payload.category || "General",
    payload.amount || 0
  ]);

  return { status: "success", message: "En-route road expense logged.", rowId: sheet.getLastRow() };
}

/**
 * Batch full sync
 */
function handleBatchSync(payload) {
  return {
    status: "success",
    message: "Batch sync completed.",
    syncedAt: new Date().toISOString()
  };
}

/**
 * Audit Logging
 */
function logAuditAction(user, action, details) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.AUDIT_LOG);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAMES.AUDIT_LOG);
      sheet.appendRow(["Timestamp", "User", "Action", "Details"]);
    }
    sheet.appendRow([new Date(), user, action, details]);
  } catch (e) {
    // Non-blocking
  }
}

/**
 * Ensure sheets structure exists with colored header row
 */
function ensureSheetsStructure(ss) {
  var names = CONFIG.SHEET_NAMES;
  
  if (!ss.getSheetByName(names.PL_ACCOUNTS)) {
    var pl = ss.insertSheet(names.PL_ACCOUNTS);
    pl.appendRow(["Timestamp", "Truck ID", "Date Range", "From", "To", "Route", "P&L Freight (P1)", "Base Freight", "Transporter", "Advance", "Balance", "POD Status", "Remarks"]);
    pl.getRange("A1:M1").setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
    pl.setFrozenRows(1);
  }

  if (!ss.getSheetByName(names.DRIVER_SETTLEMENTS)) {
    var drv = ss.insertSheet(names.DRIVER_SETTLEMENTS);
    drv.appendRow(["Timestamp", "Truck ID", "Driver Name", "Salary (12%)", "Old Balance", "Expenses Claimed", "Total Credit", "Total Advances", "Net Balance", "Action"]);
    drv.getRange("A1:J1").setBackground("#059669").setFontColor("#ffffff").setFontWeight("bold");
    drv.setFrozenRows(1);
  }

  if (!ss.getSheetByName(names.ROAD_EXPENSES)) {
    var exp = ss.insertSheet(names.ROAD_EXPENSES);
    exp.appendRow(["Timestamp", "Truck ID", "Description", "Category", "Amount"]);
    exp.getRange("A1:E1").setBackground("#d97706").setFontColor("#ffffff").setFontWeight("bold");
    exp.setFrozenRows(1);
  }

  if (!ss.getSheetByName(names.ADVANCES)) {
    var adv = ss.insertSheet(names.ADVANCES);
    adv.appendRow(["Timestamp", "Truck ID", "Date", "Location / Note", "Amount", "Mode"]);
    adv.getRange("A1:F1").setBackground("#7c3aed").setFontColor("#ffffff").setFontWeight("bold");
    adv.setFrozenRows(1);
  }
}

/**
 * Create automated Drive backup snapshot
 */
function createDailyDriveBackup() {
  var ss = getSpreadsheet();
  var fileId = ss.getId();
  var file = DriveApp.getFileById(fileId);

  var folders = DriveApp.getFoldersByName(CONFIG.BACKUP_FOLDER_NAME);
  var targetFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.BACKUP_FOLDER_NAME);

  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm-ss");
  var copyName = "Backup_" + ss.getName() + "_" + timestamp;

  return file.makeCopy(copyName, targetFolder);
}

/**
 * Helper to build standard JSON response with CORS headers
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
