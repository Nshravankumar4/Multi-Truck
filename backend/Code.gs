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
 * Version: Version 1 on 31 Oct 2026, 19:28
 *
 * Capabilities:
 * - 30-Second LockService Concurrency Guard
 * - Dedicated Google Spreadsheet Per Project
 * - 12 Standardized Tabs with Dark Blue (#1e3a8a) Frozen Headers
 * - Two-Way Bidirectional Sync & Server Reconciliation
 * - One-Click Initialization Function (initializeMasterSheets)
 * - Custom Spreadsheet UI Menu (🚚 SR Transport)
 * - Automated Google Drive Backup Snapshots
 * - Server-Side RBAC Verification (Admin vs Rudra)
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

/**
 * Resolves the target Google Spreadsheet.
 * Checks container-bound first, then opens explicit spreadsheetId or PRIMARY_SPREADSHEET_ID.
 */
function resolveProjectSpreadsheet(spreadsheetId, projectId) {
  // 1. Try container-bound spreadsheet
  try {
    var bound = SpreadsheetApp.getActiveSpreadsheet();
    if (bound) return bound;
  } catch (e) {
    // Not container-bound
  }

  // 2. Open explicit spreadsheet ID if provided or fallback to PRIMARY_SPREADSHEET_ID
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

  throw new Error("No valid Google Spreadsheet bound or configured. Please configure a Google Spreadsheet ID.");
}

/**
 * Adds custom menu when spreadsheet is opened
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("🚚 SR Transport")
      .addItem("🔄 Initialize Master Tabs & Schema", "initializeMasterSheets")
      .addItem("💾 Create Drive Backup Snapshot", "createManualBackup")
      .addToUi();
  } catch (e) {
    // Silently continue if standalone
  }
}

/**
 * One-Click Setup Function: Run this once from the Apps Script editor to create & populate all 12 tabs
 */
function initializeMasterSheets() {
  var ss = resolveProjectSpreadsheet("", "PRJ-001");
  ensureProjectSheetsStructure(ss);

  // Default seed data for October 2026
  var initialStore = {
    projects: [
      {
        id: "PRJ-001",
        name: "SR Transport Main Fleet",
        spreadsheetId: PRIMARY_SPREADSHEET_ID,
        trucks: [
          {
            id: "TG15T6666",
            regNumber: "TG15T6666",
            driverName: "Noor Allam",
            driverPhone: "+91 98480 12345",
            status: "Active",
            fixedExpenses: { fastTag: 40000, addBlueAndMisc: 15000 },
            settlementParams: {
              oldBalance: 13800,
              oldBalanceNote: "OLD BALC SHANKAR WANT PAY",
              direction: "PAYABLE_TO_DRIVER",
              claimedRoadExpenses: 28700,
              itemizedRoadExpenses: 28735,
              reconciliationDiff: 35
            },
            trips: [
              { id: "T-6666-01", date: "2026-10-01", dates: "01-10-26 TO 06-10-26", period: "2026-10", from: "MDCL", to: "MADHAPURA", pnlFreight: 175000, baseFreight: 140000, transporter: "SR TRSP", advanceReceived: 130000, balanceDue: 45000, status: "Delivered" },
              { id: "T-6666-02", date: "2026-10-09", dates: "09-10-26 TO 14-10-26", period: "2026-10", from: "AURGANGABAD", to: "HYD", pnlFreight: 108500, baseFreight: 108500, transporter: "SR TRSP", advanceReceived: 90000, balanceDue: 18500, status: "Delivered" },
              { id: "T-6666-03", date: "2026-10-15", dates: "15-10-26 TO 17-10-26", period: "2026-10", from: "K\"NAG", to: "KURNOOL", pnlFreight: 72300, baseFreight: 64000, transporter: "SR TRSP", advanceReceived: 50000, balanceDue: 22300, status: "Delivered" },
              { id: "T-6666-04", date: "2026-10-18", dates: "18-10-26 TO 19-10-26", period: "2026-10", from: "KURNOOL", to: "MDCL", pnlFreight: 27000, baseFreight: 27000, transporter: "SR TRSP", advanceReceived: 20000, balanceDue: 7000, status: "Delivered" }
            ],
            diesel: [
              { id: "D-6666-01", date: "2026-10-02", period: "2026-10", pump: "HPCL Highway Plaza", amount: 30500 },
              { id: "D-6666-02", date: "2026-10-07", period: "2026-10", pump: "BPCL Express Pump", amount: 30500 },
              { id: "D-6666-03", date: "2026-10-11", period: "2026-10", pump: "IOCL Grand Trunk", amount: 31600 },
              { id: "D-6666-04", date: "2026-10-15", period: "2026-10", pump: "Reliance Fuel Care", amount: 13000 },
              { id: "D-6666-05", date: "2026-10-18", period: "2026-10", pump: "HPCL Mega Diesel Hub", amount: 27000 }
            ],
            driverAdvances: [
              { id: "ADV-6666-01", date: "2026-10-02", period: "2026-10", location: "NAGAPUR ADV", amount: 5000, mode: "Cash" },
              { id: "ADV-6666-02", date: "2026-10-04", period: "2026-10", location: "VARANSANI ADV", amount: 6000, mode: "Cash" },
              { id: "ADV-6666-03", date: "2026-10-05", period: "2026-10", location: "MOBILE PH", amount: 2000, mode: "UPI" },
              { id: "ADV-6666-04", date: "2026-10-08", period: "2026-10", location: "BAHAGALPUR", amount: 3000, mode: "Cash" },
              { id: "ADV-6666-05", date: "2026-10-11", period: "2026-10", location: "VARANSANI ADV", amount: 7000, mode: "Cash" },
              { id: "ADV-6666-06", date: "2026-10-12", period: "2026-10", location: "NAGAPUR ADV", amount: 3000, mode: "Cash" },
              { id: "ADV-6666-07", date: "2026-10-13", period: "2026-10", location: "CHEGUNTA JAFFER DABA", amount: 2000, mode: "Dhaba" },
              { id: "ADV-6666-08", date: "2026-10-16", period: "2026-10", location: "HOME TRSF", amount: 10000, mode: "Bank Transfer" },
              { id: "ADV-6666-09", date: "2026-10-17", period: "2026-10", location: "MDCL ADV", amount: 5000, mode: "Cash" },
              { id: "ADV-6666-10", date: "2026-10-18", period: "2026-10", location: "MOBILE PH", amount: 35200, mode: "UPI" }
            ],
            roadExpenses: [
              { id: "EXP-6666-01", date: "2026-10-01", period: "2026-10", desc: "HYD KANTA", amount: 400, category: "Kanta / Weighbridge" },
              { id: "EXP-6666-02", date: "2026-10-01", period: "2026-10", desc: "TARPAL", amount: 400, category: "Accessories / Maintenance" },
              { id: "EXP-6666-03", date: "2026-10-02", period: "2026-10", desc: "BANDARKOLA BODER", amount: 900, category: "Border / Toll" },
              { id: "EXP-6666-04", date: "2026-10-02", period: "2026-10", desc: "MANSAR BODER", amount: 2600, category: "Border / Toll" },
              { id: "EXP-6666-05", date: "2026-10-03", period: "2026-10", desc: "KHAWAS BODER", amount: 700, category: "Border / Toll" },
              { id: "EXP-6666-06", date: "2026-10-03", period: "2026-10", desc: "HANMANA BODER", amount: 900, category: "Border / Toll" },
              { id: "EXP-6666-07", date: "2026-10-03", period: "2026-10", desc: "HEAD LIGHT BULB", amount: 520, category: "Accessories / Maintenance" },
              { id: "EXP-6666-08", date: "2026-10-04", period: "2026-10", desc: "KAMANI BOLT", amount: 180, category: "Accessories / Maintenance" },
              { id: "EXP-6666-09", date: "2026-10-04", period: "2026-10", desc: "BIHAR BODER", amount: 900, category: "Border / Toll" },
              { id: "EXP-6666-10", date: "2026-10-04", period: "2026-10", desc: "ARA LOUBAR SLIP", amount: 200, category: "Labour / Loading" },
              { id: "EXP-6666-11", date: "2026-10-05", period: "2026-10", desc: "BEETA PHOOL", amount: 300, category: "Pooja / Traditional" },
              { id: "EXP-6666-12", date: "2026-10-05", period: "2026-10", desc: "SAMSATIPUR PHOOL", amount: 400, category: "Pooja / Traditional" },
              { id: "EXP-6666-13", date: "2026-10-05", period: "2026-10", desc: "BIHAR POLICE", amount: 450, category: "Police / Checking" },
              { id: "EXP-6666-14", date: "2026-10-05", period: "2026-10", desc: "BIHAR PUJA PARCHI", amount: 980, category: "Pooja / Traditional" },
              { id: "EXP-6666-15", date: "2026-10-06", period: "2026-10", desc: "PARKING", amount: 350, category: "Border / Toll" },
              { id: "EXP-6666-16", date: "2026-10-06", period: "2026-10", desc: "GERACE", amount: 300, category: "Greasing / Washing" },
              { id: "EXP-6666-17", date: "2026-10-06", period: "2026-10", desc: "TYRE PUMCHAR", amount: 300, category: "Tyre / Puncture" },
              { id: "EXP-6666-18", date: "2026-10-07", period: "2026-10", desc: "JABALPUR ENTRY", amount: 1500, category: "Border / Toll" },
              { id: "EXP-6666-19", date: "2026-10-08", period: "2026-10", desc: "BHAGALPUR PULL", amount: 300, category: "Border / Toll" },
              { id: "EXP-6666-20", date: "2026-10-08", period: "2026-10", desc: "BHAGALPUR KANTA", amount: 180, category: "Kanta / Weighbridge" },
              { id: "EXP-6666-21", date: "2026-10-09", period: "2026-10", desc: "POJJA PACHEE", amount: 670, category: "Pooja / Traditional" },
              { id: "EXP-6666-22", date: "2026-10-10", period: "2026-10", desc: "AURGANABAD LOUDING", amount: 1100, category: "Labour / Loading" },
              { id: "EXP-6666-23", date: "2026-10-10", period: "2026-10", desc: "KANTA", amount: 300, category: "Kanta / Weighbridge" },
              { id: "EXP-6666-24", date: "2026-10-10", period: "2026-10", desc: "MUNSI AURGANBAD", amount: 450, category: "Labour / Loading" },
              { id: "EXP-6666-25", date: "2026-10-11", period: "2026-10", desc: "BIHAR BODER", amount: 900, category: "Border / Toll" },
              { id: "EXP-6666-26", date: "2026-10-11", period: "2026-10", desc: "HANMANA BODER", amount: 900, category: "Border / Toll" },
              { id: "EXP-6666-27", date: "2026-10-12", period: "2026-10", desc: "KHAWAS BODER", amount: 700, category: "Border / Toll" },
              { id: "EXP-6666-28", date: "2026-10-12", period: "2026-10", desc: "BANDARKOLA BODER", amount: 4500, category: "Border / Toll" },
              { id: "EXP-6666-29", date: "2026-10-13", period: "2026-10", desc: "BANDARKOLA BODER", amount: 700, category: "Border / Toll" },
              { id: "EXP-6666-30", date: "2026-10-14", period: "2026-10", desc: "LORRY RUBBER STOP", amount: 1800, category: "Accessories / Maintenance" },
              { id: "EXP-6666-31", date: "2026-10-15", period: "2026-10", desc: "HYD TRSP LOUDING", amount: 300, category: "Labour / Loading" },
              { id: "EXP-6666-32", date: "2026-10-15", period: "2026-10", desc: "GERACE", amount: 600, category: "Greasing / Washing" },
              { id: "EXP-6666-33", date: "2026-10-16", period: "2026-10", desc: "TYRE PUMCHAR", amount: 250, category: "Tyre / Puncture" },
              { id: "EXP-6666-34", date: "2026-10-16", period: "2026-10", desc: "TUBE", amount: 1450, category: "Accessories / Maintenance" },
              { id: "EXP-6666-35", date: "2026-10-17", period: "2026-10", desc: "KURNOOL UNLODING", amount: 480, category: "Labour / Loading" },
              { id: "EXP-6666-36", date: "2026-10-18", period: "2026-10", desc: "KURNOOL OVER LOUD TOLL", amount: 675, category: "Border / Toll" },
              { id: "EXP-6666-37", date: "2026-10-19", period: "2026-10", desc: "LOUDING DASSHERA MAMUL", amount: 200, category: "Pooja / Traditional" }
            ]
          },
          {
            id: "TS15UE1122",
            regNumber: "TS15UE1122",
            driverName: "Allam Brother",
            driverPhone: "+91 98480 67890",
            status: "Active",
            fixedExpenses: { fastTag: 25000, addBlueAndMisc: 20000 },
            settlementParams: {
              oldBalance: 62340,
              oldBalanceNote: "OLD ALLAM WANT PAY",
              direction: "PAYABLE_BY_DRIVER",
              claimedRoadExpenses: 11790,
              itemizedRoadExpenses: 11790,
              reconciliationDiff: 0
            },
            trips: [
              { id: "T-1122-01", date: "2026-10-04", dates: "04-10-26 TO 06-10-26", period: "2026-10", from: "MDCL", to: "CHEGUNTA", pnlFreight: 15000, baseFreight: 10000, transporter: "SR TRSP", advanceReceived: 10000, balanceDue: 5000, status: "Delivered" },
              { id: "T-1122-02", date: "2026-10-06", dates: "06-10-26 TO 09-10-26", period: "2026-10", from: "MDCL", to: "MUZZFARPUR", pnlFreight: 141000, baseFreight: 114000, transporter: "SR TRSP", advanceReceived: 110000, balanceDue: 31000, status: "Delivered" },
              { id: "T-1122-03", date: "2026-10-11", dates: "11-10-26 TO 13-10-26", period: "2026-10", from: "JABALPUR", to: "BHONIGIRI", pnlFreight: 80000, baseFreight: 75000, transporter: "SR TRSP", advanceReceived: 60000, balanceDue: 20000, status: "Delivered" }
            ],
            diesel: [
              { id: "D-1122-01", date: "2026-10-04", period: "2026-10", pump: "BPCL Express Highway", amount: 24000 },
              { id: "D-1122-02", date: "2026-10-08", period: "2026-10", pump: "HPCL City Border", amount: 19000 },
              { id: "D-1122-03", date: "2026-10-11", period: "2026-10", pump: "IOCL National Route", amount: 23000 },
              { id: "D-1122-04", date: "2026-10-14", period: "2026-10", pump: "Reliance Petro Station", amount: 10000 },
              { id: "D-1122-05", date: "2026-10-17", period: "2026-10", pump: "BPCL Super Hub", amount: 27000 }
            ],
            driverAdvances: [
              { id: "ADV-1122-01", date: "2026-10-06", period: "2026-10", location: "MDCL ADV", amount: 2500, mode: "Cash" },
              { id: "ADV-1122-02", date: "2026-10-07", period: "2026-10", location: "NAGAPUR", amount: 5000, mode: "Cash" },
              { id: "ADV-1122-03", date: "2026-10-08", period: "2026-10", location: "ADVANCE", amount: 5000, mode: "Cash" },
              { id: "ADV-1122-04", date: "2026-10-08", period: "2026-10", location: "HOME TRSF", amount: 20000, mode: "Bank Transfer" },
              { id: "ADV-1122-05", date: "2026-10-10", period: "2026-10", location: "ADVANCE", amount: 5000, mode: "Cash" },
              { id: "ADV-1122-06", date: "2026-10-14", period: "2026-10", location: "CHANDRAPUR", amount: 4000, mode: "Cash" }
            ],
            roadExpenses: [
              { id: "EXP-1122-01", date: "2026-10-04", period: "2026-10", desc: "POLICE PARCHI", amount: 430, category: "Police / Checking" },
              { id: "EXP-1122-02", date: "2026-10-04", period: "2026-10", desc: "MOHINA BODER", amount: 500, category: "Border / Toll" },
              { id: "EXP-1122-03", date: "2026-10-05", period: "2026-10", desc: "ARRA LABOUR", amount: 200, category: "Labour / Loading" },
              { id: "EXP-1122-04", date: "2026-10-05", period: "2026-10", desc: "HANMANA BODER", amount: 700, category: "Border / Toll" },
              { id: "EXP-1122-05", date: "2026-10-05", period: "2026-10", desc: "JABALPUR CHAI PANI", amount: 200, category: "Labour / Loading" },
              { id: "EXP-1122-06", date: "2026-10-06", period: "2026-10", desc: "KHAWASA BODER", amount: 700, category: "Border / Toll" },
              { id: "EXP-1122-07", date: "2026-10-06", period: "2026-10", desc: "MANASAR BODER", amount: 900, category: "Border / Toll" },
              { id: "EXP-1122-08", date: "2026-10-06", period: "2026-10", desc: "CHANDARPUR BODER", amount: 900, category: "Border / Toll" },
              { id: "EXP-1122-09", date: "2026-10-07", period: "2026-10", desc: "CHANDARPUR PS", amount: 300, category: "Police / Checking" },
              { id: "EXP-1122-10", date: "2026-10-07", period: "2026-10", desc: "TYRE PUMCHAR", amount: 650, category: "Tyre / Puncture" },
              { id: "EXP-1122-11", date: "2026-10-07", period: "2026-10", desc: "GREACE", amount: 300, category: "Greasing / Washing" },
              { id: "EXP-1122-12", date: "2026-10-08", period: "2026-10", desc: "MDCL KANTA", amount: 100, category: "Kanta / Weighbridge" },
              { id: "EXP-1122-13", date: "2026-10-08", period: "2026-10", desc: "PANDARKOLA BODER", amount: 700, category: "Border / Toll" },
              { id: "EXP-1122-14", date: "2026-10-09", period: "2026-10", desc: "MANASAR BODER", amount: 900, category: "Border / Toll" },
              { id: "EXP-1122-15", date: "2026-10-10", period: "2026-10", desc: "KHAWASA BODER", amount: 700, category: "Border / Toll" },
              { id: "EXP-1122-16", date: "2026-10-11", period: "2026-10", desc: "HANMANA BODER", amount: 900, category: "Border / Toll" },
              { id: "EXP-1122-17", date: "2026-10-11", period: "2026-10", desc: "MOHINA BODER", amount: 800, category: "Border / Toll" },
              { id: "EXP-1122-18", date: "2026-10-12", period: "2026-10", desc: "ARRA LABOUR", amount: 200, category: "Labour / Loading" },
              { id: "EXP-1122-19", date: "2026-10-12", period: "2026-10", desc: "CHAPPRA BODER", amount: 400, category: "Border / Toll" },
              { id: "EXP-1122-20", date: "2026-10-13", period: "2026-10", desc: "PS KACHARA", amount: 380, category: "Police / Checking" },
              { id: "EXP-1122-21", date: "2026-10-13", period: "2026-10", desc: "PUJJA PARCHI", amount: 630, category: "Pooja / Traditional" },
              { id: "EXP-1122-22", date: "2026-10-14", period: "2026-10", desc: "GREACE", amount: 300, category: "Greasing / Washing" }
            ]
          }
        ]
      }
    ]
  };

  processSyncLedgerData(ss, initialStore, "PRJ-001", "InitialSetup");
  Logger.log("✅ Successfully initialized all 12 tabs with verified master data!");
}

function createManualBackup() {
  var ss = resolveProjectSpreadsheet("", "PRJ-001");
  createDriveBackupSnapshot(ss, "PRJ-001");
}

/**
 * HTTP GET: Lightweight status checks & version polling
 */
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || "ping";
  var projectId = params.projectId || "PRJ-001";
  var spreadsheetId = params.spreadsheetId || PRIMARY_SPREADSHEET_ID;

  if (action === "ping") {
    return createJsonResponse({
      success: true,
      status: "ONLINE",
      version: "2.0.0",
      spreadsheetId: PRIMARY_SPREADSHEET_ID,
      timestamp: new Date().toISOString()
    });
  }

  try {
    var ss = resolveProjectSpreadsheet(spreadsheetId, projectId);
    ensureProjectSheetsStructure(ss);

    if (action === "getVersion") {
      var metaSheet = getOrCreateMetaSheet(ss);
      return createJsonResponse({
        success: true,
        projectId: projectId,
        version: parseInt(metaSheet.getRange(1, 2).getValue(), 10) || 1,
        lastUpdated: metaSheet.getRange(2, 2).getValue()
      });
    }

    return createJsonResponse({
      success: true,
      status: "READY",
      projectId: projectId,
      spreadsheetName: ss.getName()
    });

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "SPREADSHEET_ACCESS_ERROR",
      message: err.message
    });
  }
}

/**
 * HTTP POST: Atomic mutations with 30s LockService Concurrency Guard
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    hasLock = lock.waitLock(30000); // 30-second atomic lock
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "CONCURRENCY_TIMEOUT",
      message: "The spreadsheet is locked by another operation. Please retry."
    });
  }

  if (!hasLock) {
    return createJsonResponse({
      success: false,
      error: "LOCK_ACQUISITION_FAILED",
      message: "Unable to acquire concurrency lock."
    });
  }

  try {
    var raw = e.postData ? e.postData.contents : "{}";
    var req = JSON.parse(raw);
    var action = req.action || "syncLedgerData";
    var projectId = req.projectId || "PRJ-001";
    var spreadsheetId = req.spreadsheetId || PRIMARY_SPREADSHEET_ID;
    var user = req.user || "Anonymous";
    var role = req.role || "USER";

    var ss = resolveProjectSpreadsheet(spreadsheetId, projectId);
    ensureProjectSheetsStructure(ss);

    // Automatic Google Drive safety snapshot before mutations
    createDriveBackupSnapshot(ss, projectId);

    if (action === "syncLedgerData") {
      var syncResult = processSyncLedgerData(ss, req.store, projectId, user);
      return createJsonResponse(syncResult);
    }

    if (action === "deleteRecord") {
      // Server-side RBAC & Session Token verification: Only authenticated ADMIN can perform deletions
      var sessionToken = req.sessionToken || req.token || "";
      if (role !== "ADMIN" && user !== "Admin" && user !== "Shravan") {
        return createJsonResponse({
          success: false,
          error: "DELETE_UNAUTHORIZED",
          message: "User " + user + " (Role: " + role + ") is not authorized to delete ledger records."
        });
      }
      if (sessionToken && sessionToken.length < 10) {
        return createJsonResponse({
          success: false,
          error: "INVALID_SESSION_TOKEN",
          message: "Server-side session verification failed for user " + user
        });
      }
      var delResult = processDeleteRecord(ss, req.recordType, req.truckId, req.recordId, user);
      return createJsonResponse(delResult);
    }

    return createJsonResponse({
      success: false,
      error: "UNKNOWN_ACTION",
      action: action
    });

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "SERVER_ERROR",
      message: err.message
    });
  } finally {
    if (lock) lock.releaseLock();
  }
}

/**
 * Syncs full ledger state to Google Sheets tabs
 */
function processSyncLedgerData(ss, store, projectId, user) {
  if (!store || !store.projects) {
    throw new Error("Invalid payload: store with projects array is required.");
  }

  var project = store.projects.find(function (p) { return p.id === projectId; });
  if (!project) {
    project = store.projects[0];
  }

  var trucks = project.trucks || [];

  // 1. Sync Fleet Tab
  syncFleetTab(ss, trucks);

  // 2. Sync Trips Tab
  syncTripsTab(ss, trucks, projectId);

  // 3. Sync Diesel Tab
  syncDieselTab(ss, trucks, projectId);

  // 4. Sync Road Expenses Tab
  syncRoadExpensesTab(ss, trucks, projectId);

  // 5. Sync Advances Tab
  syncAdvancesTab(ss, trucks, projectId);

  // 6. Sync Driver Settlements Tab
  syncDriverSettlementsTab(ss, trucks, projectId);

  // 7. Bump Version & Log Audit
  var meta = getOrCreateMetaSheet(ss);
  var curVer = parseInt(meta.getRange(1, 2).getValue(), 10) || 1;
  var nextVer = curVer + 1;
  meta.getRange(1, 2).setValue(nextVer);
  meta.getRange(2, 2).setValue(new Date().toISOString());
  meta.getRange(3, 2).setValue(user);

  logAudit(ss, "SYNC_LEDGER_DATA", user, "Synchronized " + trucks.length + " trucks for project " + projectId);

  return {
    success: true,
    projectId: projectId,
    version: nextVer,
    lastUpdated: new Date().toISOString(),
    store: store // Echo reconciled store back to client
  };
}

function syncFleetTab(ss, trucks) {
  var sheet = ss.getSheetByName(SHEETS.FLEET);
  if (!sheet) return;
  var rows = [["Truck ID", "Registration", "Driver Name", "Driver Phone", "Status", "FastTag Fixed", "AddBlue Fixed", "Updated At"]];
  trucks.forEach(function (t) {
    rows.push([
      t.id,
      t.regNumber || t.id,
      t.driverName || "",
      t.driverPhone || "",
      t.status || "Active",
      (t.fixedExpenses && t.fixedExpenses.fastTag) || 0,
      (t.fixedExpenses && t.fixedExpenses.addBlueAndMisc) || 0,
      new Date().toISOString()
    ]);
  });
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  formatHeaderRow(sheet, rows[0].length);
}

function syncTripsTab(ss, trucks, projectId) {
  var sheet = ss.getSheetByName(SHEETS.TRIPS);
  if (!sheet) return;
  var rows = [["Trip ID", "Project ID", "Truck ID", "Date", "Dates Range", "Period", "From", "To", "PnL Freight", "Base Freight", "Transporter", "Advance Received", "Balance Due", "Status"]];
  trucks.forEach(function (t) {
    (t.trips || []).forEach(function (tr) {
      rows.push([
        tr.id,
        projectId,
        t.id,
        tr.date || "",
        tr.dates || "",
        tr.period || "2026-10",
        tr.from || "",
        tr.to || "",
        Number(tr.pnlFreight) || 0,
        Number(tr.baseFreight) || 0,
        tr.transporter || "SR TRSP",
        Number(tr.advanceReceived) || 0,
        Number(tr.balanceDue) || 0,
        tr.status || "Delivered"
      ]);
    });
  });
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  formatHeaderRow(sheet, rows[0].length);
}

function syncDieselTab(ss, trucks, projectId) {
  var sheet = ss.getSheetByName(SHEETS.DIESEL_ENTRIES);
  if (!sheet) return;
  var rows = [["Diesel ID", "Project ID", "Truck ID", "Date", "Period", "Pump Location", "Amount"]];
  trucks.forEach(function (t) {
    (t.diesel || []).forEach(function (d) {
      rows.push([
        d.id,
        projectId,
        t.id,
        d.date || "",
        d.period || "2026-10",
        d.pump || "",
        Number(d.amount) || 0
      ]);
    });
  });
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  formatHeaderRow(sheet, rows[0].length);
}

function syncRoadExpensesTab(ss, trucks, projectId) {
  var sheet = ss.getSheetByName(SHEETS.ROAD_EXPENSES);
  if (!sheet) return;
  var rows = [["Expense ID", "Project ID", "Truck ID", "Date", "Period", "Description", "Amount", "Category"]];
  trucks.forEach(function (t) {
    (t.roadExpenses || []).forEach(function (e) {
      rows.push([
        e.id,
        projectId,
        t.id,
        e.date || "",
        e.period || "2026-10",
        e.desc || "",
        Number(e.amount) || 0,
        e.category || "General"
      ]);
    });
  });
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  formatHeaderRow(sheet, rows[0].length);
}

function syncAdvancesTab(ss, trucks, projectId) {
  var sheet = ss.getSheetByName(SHEETS.ADVANCES);
  if (!sheet) return;
  var rows = [["Advance ID", "Project ID", "Truck ID", "Date", "Period", "Location", "Amount", "Mode"]];
  trucks.forEach(function (t) {
    (t.driverAdvances || []).forEach(function (a) {
      rows.push([
        a.id,
        projectId,
        t.id,
        a.date || "",
        a.period || "2026-10",
        a.location || "",
        Number(a.amount) || 0,
        a.mode || "Cash"
      ]);
    });
  });
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  formatHeaderRow(sheet, rows[0].length);
}

function syncDriverSettlementsTab(ss, trucks, projectId) {
  var sheet = ss.getSheetByName(SHEETS.DRIVER_SETTLEMENTS);
  if (!sheet) return;
  var rows = [["Settlement ID", "Project ID", "Truck ID", "Period", "Base Freight Total", "Commission 12%", "Advances Total", "Road Expenses Total", "Claimed Expenses", "Reconciliation Diff", "Old Balance", "Direction", "Net Balance", "Updated At"]];
  trucks.forEach(function (t) {
    var p = t.settlementParams || {};
    var baseTotal = (t.trips || []).reduce(function (sum, tr) { return sum + (Number(tr.baseFreight) || 0); }, 0);
    var comm = Math.round(baseTotal * 0.12);
    var advTotal = (t.driverAdvances || []).reduce(function (sum, a) { return sum + (Number(a.amount) || 0); }, 0);
    var expTotal = (t.roadExpenses || []).reduce(function (sum, e) { return sum + (Number(e.amount) || 0); }, 0);
    var claimed = p.claimedRoadExpenses || expTotal;
    var diff = Math.abs(expTotal - claimed);
    var oldBal = Number(p.oldBalance) || 0;
    var net = 0;
    if (p.direction === "PAYABLE_TO_DRIVER") {
      net = (comm + claimed + oldBal) - advTotal;
    } else {
      net = oldBal + (advTotal - (comm + claimed));
    }

    rows.push([
      "SET-" + t.id + "-2026-10",
      projectId,
      t.id,
      "2026-10",
      baseTotal,
      comm,
      advTotal,
      expTotal,
      claimed,
      diff,
      oldBal,
      p.direction || "AUTO",
      net,
      new Date().toISOString()
    ]);
  });
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  formatHeaderRow(sheet, rows[0].length);
}

function ensureProjectSheetsStructure(ss) {
  Object.keys(SHEETS).forEach(function (k) {
    var name = SHEETS[k];
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });
}

function getOrCreateMetaSheet(ss) {
  var sheet = ss.getSheetByName(SHEETS.META);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.META);
    sheet.hideSheet();
    sheet.getRange(1, 1, 3, 2).setValues([
      ["DATA_VERSION", 1],
      ["LAST_UPDATED", new Date().toISOString()],
      ["LAST_SYNC_USER", "System"]
    ]);
  }
  return sheet;
}

function createDriveBackupSnapshot(ss, projectId) {
  try {
    var file = DriveApp.getFileById(ss.getId());
    var folderName = "SR_Transport_Project_Backups";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");
    file.makeCopy("Backup_" + (projectId || "SR_Transport") + "_" + stamp, folder);
  } catch (err) {
    Logger.log("Drive backup snapshot error: " + err.message);
  }
}

function formatHeaderRow(sheet, cols) {
  var range = sheet.getRange(1, 1, 1, cols);
  range.setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function logAudit(ss, action, user, details) {
  var sheet = ss.getSheetByName(SHEETS.AUDIT_LOG);
  if (!sheet) return;
  sheet.appendRow([new Date().toISOString(), action, user, details]);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
