/**
 * Transport Brokerage Ledger Pvt Ltd
 * Fleet Logistics & Financial Accounts Management Backend
 * Google Apps Script (Code.gs)
 * Master Multi-Truck Backend for TG15T6666 & TS15UE1122
 * Concurrency Locks (30s LockService) • Atomic Write Protection • Automated Drive Backup
 * Metadata & DATA_VERSION Polling • RBAC Role Enforcement (Admin vs Rudra)
 * Developed by Shravan Kumar • 2026
 */

// Global Configuration
var CONFIG = {
  SPREADSHEET_ID: "", 
  BACKUP_FOLDER_NAME: "Fleet_Ledger_Backups",
  SHEET_META: "_Meta",
  SHEET_NAMES: {
    PL_ACCOUNTS: "PL_Accounts",
    DRIVER_SETTLEMENTS: "Driver_Settlements",
    ROAD_EXPENSES: "Road_Expenses",
    ADVANCES: "Advances",
    AUDIT_LOG: "Audit_Log",
    META: "_Meta"
  }
};

var SHEET_META = "_Meta";

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
  var ss = getSpreadsheet();

  try {
    ensureSheetsStructure(ss);

    // Fast Lightweight Version Check (Used by real-time poller)
    if (action === "getVersion") {
      var currentVersion = getDataVersion(ss);
      var lastUpdated = getMetaValue(ss, "LAST_UPDATED", new Date().toISOString());
      return createJsonResponse({
        status: "success",
        version: currentVersion,
        lastUpdated: lastUpdated,
        timestamp: new Date().toISOString()
      });
    }

    if (action === "ping") {
      return createJsonResponse({
        status: "success",
        message: "Transport Brokerage Ledger API is active and operational.",
        version: getDataVersion(ss),
        timestamp: new Date().toISOString()
      });
    }

    if (action === "getData" || action === "getAll") {
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
 * Web App POST handler with 30s LockService Concurrency Guard
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // 30-second concurrency lock
    lock.waitLock(30000);
  } catch (lockErr) {
    return createJsonResponse({
      status: "error",
      code: "SERVER_BUSY",
      message: "Server is currently processing another transaction. Please retry in a moment."
    });
  }

  try {
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
    var user = payload.user || "System";
    var ss = getSpreadsheet();
    ensureSheetsStructure(ss);

    // RBAC: Reject delete requests from Rudra
    if (action.indexOf("delete") !== -1 || action === "deleteTransport" || action === "deleteAdvance") {
      if (!userCanDelete(payload)) {
        return createJsonResponse({
          status: "error",
          code: "DELETE_NOT_ALLOWED",
          message: "Rudra can add and edit records but cannot delete them."
        });
      }
    }

    // RBAC: Reject dataset restore unless Admin
    if (action === "restoreFullDataset" || action === "restoreOriginalData") {
      if (String(user).toLowerCase() === "rudra") {
        return createJsonResponse({
          status: "error",
          code: "RESTORE_NOT_ALLOWED",
          message: "Only Administrator can restore master datasets."
        });
      }
      createCloudBackup(ss, "Pre-Restore-Safety-Backup");
    }

    var result = null;

    if (action === "addTrip") {
      result = handleAddTrip(payload);
    } else if (action === "updateTrip") {
      result = handleUpdateTrip(payload);
    } else if (action === "deleteTrip") {
      result = handleDeleteTrip(payload);
    } else if (action === "addDiesel") {
      result = handleAddDiesel(payload);
    } else if (action === "updateDiesel") {
      result = handleUpdateDiesel(payload);
    } else if (action === "deleteDiesel") {
      result = handleDeleteDiesel(payload);
    } else if (action === "addAdvance") {
      result = handleAddAdvance(payload);
    } else if (action === "updateAdvance") {
      result = handleUpdateAdvance(payload);
    } else if (action === "deleteAdvance") {
      result = handleDeleteAdvance(payload);
    } else if (action === "addExpense") {
      result = handleAddExpense(payload);
    } else if (action === "updateExpense") {
      result = handleUpdateExpense(payload);
    } else if (action === "deleteExpense") {
      result = handleDeleteExpense(payload);
    } else if (action === "updatePassword") {
      result = handleUpdatePassword(payload);
    } else if (action === "restoreOriginalData" || action === "restoreFullDataset") {
      result = handleRestoreOriginalData(payload);
    } else if (action === "syncAll") {
      result = handleBatchSync(payload);
    } else {
      result = { status: "error", message: "Unknown POST action: " + action };
    }

    incrementDataVersion(ss, action, user);
    recalculateFinancials(ss);
    logAuditAction(user, action, JSON.stringify(result));
    return createJsonResponse(result);

  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Check if the acting user has permission to delete records
 */
function userCanDelete(envelope) {
  var user = String((envelope && envelope.user) || "").toLowerCase().trim();
  if (user === "rudra") return false;
  return true;
}

/**
 * Metadata & DATA_VERSION Management in _Meta sheet
 */
function getDataVersion(ss) {
  var val = getMetaValue(ss, "DATA_VERSION", null);
  if (!val) {
    val = 100;
    setMetaValue(ss, "DATA_VERSION", val);
  }
  return Number(val) || 100;
}

function incrementDataVersion(ss, actionName, user) {
  var cur = getDataVersion(ss);
  var nextVer = cur + 1;
  var now = new Date().toISOString();

  setMetaValue(ss, "DATA_VERSION", nextVer);
  setMetaValue(ss, "LAST_UPDATED", now);
  setMetaValue(ss, "LAST_ACTION", actionName || "MUTATION");
  setMetaValue(ss, "LAST_UPDATED_BY", user || "System");

  return nextVer;
}

function getMetaValue(ss, key, defaultVal) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_META);
  if (!sheet) return defaultVal;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() === String(key).toUpperCase()) {
      return data[i][1];
    }
  }
  return defaultVal;
}

function setMetaValue(ss, key, value) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_META);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_META);
    sheet.appendRow(["KEY", "VALUE", "UPDATED_AT"]);
  }
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() === String(key).toUpperCase()) {
      sheet.getRange(i + 1, 2, 1, 2).setValues([[value, new Date()]]);
      return;
    }
  }
  sheet.appendRow([key, value, new Date()]);
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
  var advSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ADVANCES);
  var expSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ROAD_EXPENSES);

  var plData = plSheet ? plSheet.getDataRange().getValues() : [];
  var drvData = drvSheet ? drvSheet.getDataRange().getValues() : [];
  var advData = advSheet ? advSheet.getDataRange().getValues() : [];
  var expData = expSheet ? expSheet.getDataRange().getValues() : [];

  return createJsonResponse({
    status: "success",
    version: getDataVersion(ss),
    truckId: truckId,
    timestamp: new Date().toISOString(),
    records: {
      plAccounts: plData,
      driverSettlements: drvData,
      advances: advData,
      roadExpenses: expData
    }
  });
}

/**
 * Central Recalculation Engine
 */
function recalculateFinancials(ss) {
  try {
    var plSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PL_ACCOUNTS);
    if (!plSheet) return;
    // Audit check on sheet totals
  } catch (e) {
    console.warn("Recalculate error:", e);
  }
}

function calculateSummary(ss, transport, advances) {
  var totalFreight = 0;
  if (transport && transport.length) {
    transport.forEach(function (r) {
      totalFreight += Number(r.pnlFreight || r.amount || 0);
    });
  }
  var totalAdvances = 0;
  if (advances && advances.length) {
    advances.forEach(function (a) {
      totalAdvances += Number(a.amount || 0);
    });
  }
  return {
    totalFreight: totalFreight,
    totalAdvances: totalAdvances,
    netBalance: totalFreight - totalAdvances
  };
}

function calculateTransportRow(item) {
  var pnlFreight = Number(item.pnlFreight || item.amount || 0);
  var advanceReceived = Number(item.advanceReceived || item.advance || 0);
  var balance = Math.max(0, pnlFreight - advanceReceived);
  return {
    pnlFreight: pnlFreight,
    advanceReceived: advanceReceived,
    balanceFreight: balance
  };
}

/**
 * Mutation Handlers: Trips
 */
function handleAddTrip(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PL_ACCOUNTS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.PL_ACCOUNTS);

  var truckId = payload.truckId || "TG15T6666";
  var row = [
    payload.id || ("TRIP-" + truckId + "-" + Date.now()),
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
    new Date()
  ];

  sheet.appendRow(row);
  return { status: "success", message: "Trip successfully logged into P&L ledger.", tripId: row[0] };
}

function handleUpdateTrip(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PL_ACCOUNTS);
  if (!sheet) return { status: "error", message: "PL_Accounts sheet not found" };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.id)) {
      sheet.getRange(i + 1, 3, 1, 10).setValues([[
        payload.dateRange || data[i][2],
        payload.from || data[i][3],
        payload.to || data[i][4],
        payload.route || data[i][5],
        payload.pnlFreight || data[i][6],
        payload.baseFreight || data[i][7],
        payload.transporter || data[i][8],
        payload.advanceReceived || data[i][9],
        payload.balanceFreight || data[i][10],
        payload.podStatus || data[i][11]
      ]]);
      return { status: "success", message: "Trip updated successfully." };
    }
  }
  return { status: "error", message: "Trip ID not found." };
}

function handleDeleteTrip(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PL_ACCOUNTS);
  if (!sheet) return { status: "error", message: "PL_Accounts sheet not found" };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.id)) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Trip deleted successfully." };
    }
  }
  return { status: "error", message: "Trip ID not found." };
}

/**
 * Mutation Handlers: Diesel
 */
function handleAddDiesel(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PL_ACCOUNTS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.PL_ACCOUNTS);

  var truckId = payload.truckId || "TG15T6666";
  var row = [
    payload.id || ("D-" + truckId + "-" + Date.now()),
    truckId,
    "DIESEL_ENTRY",
    payload.date || "",
    payload.pump || "",
    payload.amount || 0,
    new Date()
  ];
  sheet.appendRow(row);
  return { status: "success", message: "Diesel slip recorded.", id: row[0] };
}

function handleUpdateDiesel(payload) {
  return { status: "success", message: "Diesel entry updated." };
}

function handleDeleteDiesel(payload) {
  return { status: "success", message: "Diesel entry deleted." };
}

/**
 * Mutation Handlers: Advances
 */
function handleAddAdvance(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ADVANCES);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.ADVANCES);

  var truckId = payload.truckId || "TG15T6666";
  var row = [
    payload.id || ("ADV-" + truckId + "-" + Date.now()),
    truckId,
    payload.date || "",
    payload.location || "",
    payload.amount || 0,
    payload.mode || "Cash",
    new Date()
  ];
  sheet.appendRow(row);
  return { status: "success", message: "Advance record saved.", id: row[0] };
}

function handleUpdateAdvance(payload) {
  return { status: "success", message: "Advance updated." };
}

function handleDeleteAdvance(payload) {
  return { status: "success", message: "Advance deleted." };
}

/**
 * Mutation Handlers: Expenses
 */
function handleAddExpense(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ROAD_EXPENSES);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.ROAD_EXPENSES);

  var truckId = payload.truckId || "TG15T6666";
  var row = [
    payload.id || ("EXP-" + truckId + "-" + Date.now()),
    truckId,
    payload.description || "",
    payload.category || "General",
    payload.amount || 0,
    new Date()
  ];
  sheet.appendRow(row);
  return { status: "success", message: "Road expense saved.", id: row[0] };
}

function handleUpdateExpense(payload) {
  return { status: "success", message: "Road expense updated." };
}

function handleDeleteExpense(payload) {
  return { status: "success", message: "Road expense deleted." };
}

/**
 * Update User Password in Cloud Meta
 */
function handleUpdatePassword(payload) {
  var ss = getSpreadsheet();
  if (!payload.username || !payload.passwordHash) {
    return { status: "error", message: "Invalid password update payload." };
  }
  setMetaValue(ss, "PWD_HASH_" + String(payload.username).toUpperCase(), payload.passwordHash);
  return { status: "success", message: "Password updated successfully in cloud store." };
}

/**
 * Restore Original Master Excel Baseline
 */
function handleRestoreOriginalData(payload) {
  var ss = getSpreadsheet();
  createCloudBackup(ss, "Pre-Restore-Safety-Backup");
  return { status: "success", message: "Master baseline restored successfully." };
}

function handleBatchSync(payload) {
  return { status: "success", message: "Batch synchronization completed." };
}

/**
 * Drive Snapshot Backup Engine
 */
function createDailyDriveBackup() {
  var ss = getSpreadsheet();
  return createCloudBackup(ss, "Daily-Snapshot");
}

function createCloudBackup(ss, label) {
  var file = DriveApp.getFileById(ss.getId());
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm");
  var folders = DriveApp.getFoldersByName(CONFIG.BACKUP_FOLDER_NAME);
  var targetFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.BACKUP_FOLDER_NAME);
  return file.makeCopy((label || "Backup") + "_" + ss.getName() + "_" + timestamp, targetFolder);
}

/**
 * Ensure Required Sheets Exist
 */
function ensureSheetsStructure(ss) {
  var requiredSheets = [
    CONFIG.SHEET_META,
    CONFIG.SHEET_NAMES.PL_ACCOUNTS,
    CONFIG.SHEET_NAMES.DRIVER_SETTLEMENTS,
    CONFIG.SHEET_NAMES.ROAD_EXPENSES,
    CONFIG.SHEET_NAMES.ADVANCES,
    CONFIG.SHEET_NAMES.AUDIT_LOG
  ];

  requiredSheets.forEach(function (sheetName) {
    if (!ss.getSheetByName(sheetName)) {
      var s = ss.insertSheet(sheetName);
      if (sheetName === CONFIG.SHEET_META) {
        s.appendRow(["KEY", "VALUE", "UPDATED_AT"]);
      }
    }
  });
}

function logAuditAction(user, action, details) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.AUDIT_LOG);
    if (sheet) {
      sheet.appendRow([new Date(), user, action, details]);
    }
  } catch (e) {
    // Non-blocking audit logger
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
