/**
 * Transport Brokerage Ledger Pvt Ltd
 * Enterprise Multi-Project, Multi-Truck Data Store (P2)
 *
 * Architecture:
 * - Multi-Project Management with dedicated Spreadsheet IDs
 * - Dynamic Unlimited Truck Fleet Support
 * - Date & Accounting Period Organization (Historical 2026-09, Active 2026-10, Future 2026-11)
 * - Preserved Authoritative Excel Records & Reconciliations
 * - Bidirectional Cloud Synchronization Reconciliation
 */

const DataModule = (function () {
  'use strict';

  const STORAGE_KEY_V2 = 'FLEET_LEDGER_P2_MASTER_V2';
  const ACTIVE_PROJECT_KEY = 'FLEET_LEDGER_ACTIVE_PROJECT_ID_V2';

  // Seed Data: Master Project 001 with TG15T6666 & TS15UE1122
  const INITIAL_SEED = {
    version: 2,
    lastUpdated: new Date().toISOString(),
    projects: [
      {
        id: "PRJ-001",
        name: "SR Transport Main Fleet",
        description: "Primary commercial dual-truck operations (TG15T6666 & TS15UE1122)",
        spreadsheetId: "1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4",
        status: "Active",
        createdAt: "2026-10-01",
        accountingPeriods: [
          { id: "2026-09", name: "September 2026", status: "Archived", startDate: "2026-09-01", endDate: "2026-09-30" },
          { id: "2026-10", name: "October 2026", status: "Active", startDate: "2026-10-01", endDate: "2026-10-31" },
          { id: "2026-11", name: "November 2026", status: "Planned", startDate: "2026-11-01", endDate: "2026-11-30" }
        ],
        activePeriod: "2026-10",
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
              settlementDate: "2026-10-20",
              direction: "PAYABLE_TO_DRIVER",
              claimedRoadExpenses: 28700,
              itemizedRoadExpenses: 28735,
              reconciliationDiff: 35
            },
            trips: [
              // October 2026 Trips (P1)
              { id: "T-6666-01", date: "2026-10-01", dates: "01-10-26 TO 06-10-26", period: "2026-10", from: "MDCL", to: "MADHAPURA", pnlFreight: 175000, baseFreight: 140000, transporter: "SR TRSP", advanceReceived: 130000, balanceDue: 45000, status: "Delivered" },
              { id: "T-6666-02", date: "2026-10-09", dates: "09-10-26 TO 14-10-26", period: "2026-10", from: "AURGANGABAD", to: "HYD", pnlFreight: 108500, baseFreight: 108500, transporter: "SR TRSP", advanceReceived: 90000, balanceDue: 18500, status: "Delivered" },
              { id: "T-6666-03", date: "2026-10-15", dates: "15-10-26 TO 17-10-26", period: "2026-10", from: "K\"NAG", to: "KURNOOL", pnlFreight: 72300, baseFreight: 64000, transporter: "SR TRSP", advanceReceived: 50000, balanceDue: 22300, status: "Delivered" },
              { id: "T-6666-04", date: "2026-10-18", dates: "18-10-26 TO 19-10-26", period: "2026-10", from: "KURNOOL", to: "MDCL", pnlFreight: 27000, baseFreight: 27000, transporter: "SR TRSP", advanceReceived: 20000, balanceDue: 7000, status: "Delivered" },
              // September 2026 Historical Archive (Sheet1 in original Excel)
              { id: "T-6666-S01", date: "2026-09-01", dates: "01-09-26", period: "2026-09", from: "MDCL", to: "PATNA", pnlFreight: 126000, baseFreight: 126000, transporter: "SR TRSP", advanceReceived: 100000, balanceDue: 26000, status: "Archived" },
              { id: "T-6666-S02", date: "2026-09-03", dates: "03-09-26", period: "2026-09", from: "RAIPUR", to: "MDCL", pnlFreight: 94500, baseFreight: 94500, transporter: "SR TRSP", advanceReceived: 80000, balanceDue: 14500, status: "Archived" },
              { id: "T-6666-S03", date: "2026-09-10", dates: "10-09-26", period: "2026-09", from: "MDCL", to: "COOCHBIHAR", pnlFreight: 185000, baseFreight: 185000, transporter: "SR TRSP", advanceReceived: 150000, balanceDue: 35000, status: "Archived" },
              { id: "T-6666-S04", date: "2026-09-17", dates: "17-09-26", period: "2026-09", from: "RAIGANJ", to: "WARASEONI", pnlFreight: 80500, baseFreight: 80500, transporter: "SR TRSP", advanceReceived: 65000, balanceDue: 15500, status: "Archived" },
              { id: "T-6666-S05", date: "2026-09-27", dates: "27-09-26", period: "2026-09", from: "WARASEONI", to: "MDCL", pnlFreight: 71750, baseFreight: 71750, transporter: "SR TRSP", advanceReceived: 60000, balanceDue: 11750, status: "Archived" }
            ],
            diesel: [
              // October 2026 Diesel Entries
              { id: "D-6666-01", date: "2026-10-02", period: "2026-10", pump: "HPCL Highway Plaza", amount: 30500 },
              { id: "D-6666-02", date: "2026-10-07", period: "2026-10", pump: "BPCL Express Pump", amount: 30500 },
              { id: "D-6666-03", date: "2026-10-11", period: "2026-10", pump: "IOCL Grand Trunk", amount: 31600 },
              { id: "D-6666-04", date: "2026-10-15", period: "2026-10", pump: "Reliance Fuel Care", amount: 13000 },
              { id: "D-6666-05", date: "2026-10-18", period: "2026-10", pump: "HPCL Mega Diesel Hub", amount: 27000 }
            ],
            driverAdvances: [
              // October 2026 Advances
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
              // October 2026 Road Expenses (37 Verified Items)
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
              settlementDate: "2026-10-20",
              direction: "PAYABLE_BY_DRIVER",
              claimedRoadExpenses: 11790,
              itemizedRoadExpenses: 11790,
              reconciliationDiff: 0
            },
            trips: [
              // October 2026 Trips (P1)
              { id: "T-1122-01", date: "2026-10-04", dates: "04-10-26 TO 06-10-26", period: "2026-10", from: "MDCL", to: "CHEGUNTA", pnlFreight: 15000, baseFreight: 10000, transporter: "SR TRSP", advanceReceived: 10000, balanceDue: 5000, status: "Delivered" },
              { id: "T-1122-02", date: "2026-10-06", dates: "06-10-26 TO 09-10-26", period: "2026-10", from: "MDCL", to: "MUZZFARPUR", pnlFreight: 141000, baseFreight: 114000, transporter: "SR TRSP", advanceReceived: 110000, balanceDue: 31000, status: "Delivered" },
              { id: "T-1122-03", date: "2026-10-11", dates: "11-10-26 TO 13-10-26", period: "2026-10", from: "JABALPUR", to: "BHONIGIRI", pnlFreight: 80000, baseFreight: 75000, transporter: "SR TRSP", advanceReceived: 60000, balanceDue: 20000, status: "Delivered" },
              // September 2026 Historical Archive (Sheet2 in original Excel)
              { id: "T-1122-S01", date: "2026-09-01", dates: "01-09-26", period: "2026-09", from: "MYSURU", to: "LUCKNOW", pnlFreight: 148000, baseFreight: 148000, transporter: "SR TRSP", advanceReceived: 120000, balanceDue: 28000, status: "Archived" },
              { id: "T-1122-S02", date: "2026-09-07", dates: "07-09-26", period: "2026-09", from: "LUCKNOW", to: "MDCL", pnlFreight: 87000, baseFreight: 87000, transporter: "SR TRSP", advanceReceived: 70000, balanceDue: 17000, status: "Archived" },
              { id: "T-1122-S03", date: "2026-09-22", dates: "22-09-26", period: "2026-09", from: "IBRAHIMPATAM", to: "MDCL", pnlFreight: 15000, baseFreight: 15000, transporter: "SR TRSP", advanceReceived: 10000, balanceDue: 5000, status: "Archived" },
              { id: "T-1122-S04", date: "2026-09-30", dates: "30-09-26 TO 03-10-26", period: "2026-09", from: "PATNA", to: "MDCL", pnlFreight: 94500, baseFreight: 94500, transporter: "SR TRSP", advanceReceived: 75000, balanceDue: 19500, status: "Archived" }
            ],
            diesel: [
              // October 2026 Diesel Entries
              { id: "D-1122-01", date: "2026-10-04", period: "2026-10", pump: "BPCL Express Highway", amount: 24000 },
              { id: "D-1122-02", date: "2026-10-08", period: "2026-10", pump: "HPCL City Border", amount: 19000 },
              { id: "D-1122-03", date: "2026-10-11", period: "2026-10", pump: "IOCL National Route", amount: 23000 },
              { id: "D-1122-04", date: "2026-10-14", period: "2026-10", pump: "Reliance Petro Station", amount: 10000 },
              { id: "D-1122-05", date: "2026-10-17", period: "2026-10", pump: "BPCL Super Hub", amount: 27000 }
            ],
            driverAdvances: [
              // October 2026 Advances
              { id: "ADV-1122-01", date: "2026-10-06", period: "2026-10", location: "MDCL ADV", amount: 2500, mode: "Cash" },
              { id: "ADV-1122-02", date: "2026-10-07", period: "2026-10", location: "NAGAPUR", amount: 5000, mode: "Cash" },
              { id: "ADV-1122-03", date: "2026-10-08", period: "2026-10", location: "ADVANCE", amount: 5000, mode: "Cash" },
              { id: "ADV-1122-04", date: "2026-10-08", period: "2026-10", location: "HOME TRSF", amount: 20000, mode: "Bank Transfer" },
              { id: "ADV-1122-05", date: "2026-10-10", period: "2026-10", location: "ADVANCE", amount: 5000, mode: "Cash" },
              { id: "ADV-1122-06", date: "2026-10-14", period: "2026-10", location: "CHANDRAPUR", amount: 4000, mode: "Cash" }
            ],
            roadExpenses: [
              // October 2026 Road Expenses (22 Verified Items)
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

  function getStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_V2);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.projects && parsed.projects.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('LocalStorage parse error, falling back to seed:', e);
    }
    const fresh = JSON.parse(JSON.stringify(INITIAL_SEED));
    saveStore(fresh);
    return fresh;
  }

  function saveStore(store) {
    store.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(store));
    if (window.ApiModule && typeof ApiModule.broadcastLocalChange === 'function') {
      ApiModule.broadcastLocalChange(store);
    }
  }

  // --- Project Management ---
  function getProjects() {
    return getStore().projects;
  }

  function getCurrentProjectId() {
    return localStorage.getItem(ACTIVE_PROJECT_KEY) || "PRJ-001";
  }

  function setCurrentProjectId(projectId) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
  }

  function getCurrentProject() {
    const store = getStore();
    const activeId = getCurrentProjectId();
    return store.projects.find(p => p.id === activeId) || store.projects[0];
  }

  function addProject(project) {
    const store = getStore();
    if (!project.id) {
      project.id = "PRJ-" + String(store.projects.length + 1).padStart(3, '0');
    }
    if (!project.status) project.status = "Active";
    if (!project.createdAt) project.createdAt = new Date().toISOString().slice(0, 10);
    if (!project.accountingPeriods) {
      project.accountingPeriods = [
        { id: "2026-10", name: "October 2026", status: "Active", startDate: "2026-10-01", endDate: "2026-10-31" }
      ];
    }
    if (!project.activePeriod) project.activePeriod = "2026-10";
    if (!project.trucks) project.trucks = [];
    store.projects.push(project);
    saveStore(store);
    setCurrentProjectId(project.id);
    return project;
  }

  function updateProject(projectId, updatedData) {
    const store = getStore();
    const idx = store.projects.findIndex(p => p.id === projectId);
    if (idx === -1) return false;
    store.projects[idx] = Object.assign({}, store.projects[idx], updatedData);
    saveStore(store);
    return true;
  }

  function deleteProject(projectId) {
    const store = getStore();
    if (store.projects.length <= 1) {
      alert("Cannot delete the only project in the system.");
      return false;
    }
    store.projects = store.projects.filter(p => p.id !== projectId);
    if (getCurrentProjectId() === projectId) {
      setCurrentProjectId(store.projects[0].id);
    }
    saveStore(store);
    return true;
  }

  // --- Dynamic Fleet / Trucks ---
  function getTrucks(projectId) {
    const prj = projectId ? getStore().projects.find(p => p.id === projectId) : getCurrentProject();
    return prj ? prj.trucks : [];
  }

  function getTruck(truckId, projectId) {
    const trucks = getTrucks(projectId);
    return trucks.find(t => t.id === truckId || t.regNumber === truckId) || null;
  }

  function addTruck(truckData, projectId) {
    const store = getStore();
    const prj = projectId ? store.projects.find(p => p.id === projectId) : store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;

    const truckId = (truckData.id || truckData.regNumber || "TRK-" + Date.now()).toUpperCase().trim();
    if (prj.trucks.some(t => t.id === truckId)) {
      alert("Truck with ID " + truckId + " already exists!");
      return false;
    }

    const newTruck = {
      id: truckId,
      regNumber: truckData.regNumber || truckId,
      driverName: truckData.driverName || "Driver " + truckId,
      driverPhone: truckData.driverPhone || "",
      status: truckData.status || "Active",
      fixedExpenses: {
        fastTag: Number(truckData.fastTag) || 0,
        addBlueAndMisc: Number(truckData.addBlueAndMisc) || 0
      },
      settlementParams: {
        oldBalance: Number(truckData.oldBalance) || 0,
        oldBalanceNote: truckData.oldBalanceNote || "Initial Balance",
        settlementDate: new Date().toISOString().slice(0, 10),
        direction: (Number(truckData.oldBalance) || 0) >= 0 ? "PAYABLE_TO_DRIVER" : "PAYABLE_BY_DRIVER",
        claimedRoadExpenses: 0,
        itemizedRoadExpenses: 0,
        reconciliationDiff: 0
      },
      trips: [],
      diesel: [],
      driverAdvances: [],
      roadExpenses: []
    };

    prj.trucks.push(newTruck);
    saveStore(store);
    return newTruck;
  }

  function updateTruck(truckId, updatedData, projectId) {
    const store = getStore();
    const prj = projectId ? store.projects.find(p => p.id === projectId) : store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const idx = prj.trucks.findIndex(t => t.id === truckId);
    if (idx === -1) return false;

    prj.trucks[idx] = Object.assign({}, prj.trucks[idx], updatedData);
    saveStore(store);
    return true;
  }

  function deleteTruck(truckId, projectId) {
    const store = getStore();
    const prj = projectId ? store.projects.find(p => p.id === projectId) : store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    prj.trucks = prj.trucks.filter(t => t.id !== truckId);
    saveStore(store);
    return true;
  }

  // --- Transactions CRUD (Trips, Diesel, Advances, Road Expenses) ---
  function inferPeriod(dateStr) {
    if (!dateStr) return getCurrentProject().activePeriod || "2026-10";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return parts[0] + '-' + parts[1]; // YYYY-MM-DD
      if (parts[2].length === 4) return parts[2] + '-' + parts[1]; // DD-MM-YYYY
    }
    return getCurrentProject().activePeriod || "2026-10";
  }

  function addTrip(truckId, trip) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;

    if (!trip.id) trip.id = 'T-' + truckId.slice(-4) + '-' + String(Date.now()).slice(-4);
    if (!trip.date) trip.date = new Date().toISOString().slice(0, 10);
    if (!trip.period) trip.period = inferPeriod(trip.date);
    trip.pnlFreight = Number(trip.pnlFreight) || 0;
    trip.baseFreight = Number(trip.baseFreight) || trip.pnlFreight;
    trip.advanceReceived = Number(trip.advanceReceived) || 0;
    trip.balanceDue = trip.pnlFreight - trip.advanceReceived;

    truck.trips.push(trip);
    saveStore(store);
    return true;
  }

  function updateTrip(truckId, tripId, updatedTrip) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;
    const idx = truck.trips.findIndex(t => t.id === tripId);
    if (idx === -1) return false;

    updatedTrip.id = tripId;
    if (!updatedTrip.period) updatedTrip.period = inferPeriod(updatedTrip.date);
    updatedTrip.pnlFreight = Number(updatedTrip.pnlFreight) || 0;
    updatedTrip.baseFreight = Number(updatedTrip.baseFreight) || updatedTrip.pnlFreight;
    updatedTrip.advanceReceived = Number(updatedTrip.advanceReceived) || 0;
    updatedTrip.balanceDue = updatedTrip.pnlFreight - updatedTrip.advanceReceived;

    truck.trips[idx] = updatedTrip;
    saveStore(store);
    return true;
  }

  function deleteTrip(truckId, tripId) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;
    truck.trips = truck.trips.filter(t => t.id !== tripId);
    saveStore(store);
    return true;
  }

  function addDiesel(truckId, diesel) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;

    if (!diesel.id) diesel.id = 'D-' + truckId.slice(-4) + '-' + String(Date.now()).slice(-4);
    if (!diesel.date) diesel.date = new Date().toISOString().slice(0, 10);
    if (!diesel.period) diesel.period = inferPeriod(diesel.date);
    diesel.amount = Number(diesel.amount) || 0;

    truck.diesel.push(diesel);
    saveStore(store);
    return true;
  }

  function updateDiesel(truckId, dieselId, updatedDiesel) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;
    const idx = truck.diesel.findIndex(d => d.id === dieselId);
    if (idx === -1) return false;

    updatedDiesel.id = dieselId;
    if (!updatedDiesel.period) updatedDiesel.period = inferPeriod(updatedDiesel.date);
    updatedDiesel.amount = Number(updatedDiesel.amount) || 0;

    truck.diesel[idx] = updatedDiesel;
    saveStore(store);
    return true;
  }

  function deleteDiesel(truckId, dieselId) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;
    truck.diesel = truck.diesel.filter(d => d.id !== dieselId);
    saveStore(store);
    return true;
  }

  function addAdvance(truckId, adv) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;

    if (!adv.id) adv.id = 'ADV-' + truckId.slice(-4) + '-' + String(Date.now()).slice(-4);
    if (!adv.date) adv.date = new Date().toISOString().slice(0, 10);
    if (!adv.period) adv.period = inferPeriod(adv.date);
    adv.amount = Number(adv.amount) || 0;

    truck.driverAdvances.push(adv);
    saveStore(store);
    return true;
  }

  function updateAdvance(truckId, advId, updatedAdv) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;
    const idx = truck.driverAdvances.findIndex(a => a.id === advId);
    if (idx === -1) return false;

    updatedAdv.id = advId;
    if (!updatedAdv.period) updatedAdv.period = inferPeriod(updatedAdv.date);
    updatedAdv.amount = Number(updatedAdv.amount) || 0;

    truck.driverAdvances[idx] = updatedAdv;
    saveStore(store);
    return true;
  }

  function deleteAdvance(truckId, advId) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;
    truck.driverAdvances = truck.driverAdvances.filter(a => a.id !== advId);
    saveStore(store);
    return true;
  }

  function addExpense(truckId, exp) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;

    if (!exp.id) exp.id = 'EXP-' + truckId.slice(-4) + '-' + String(Date.now()).slice(-4);
    if (!exp.date) exp.date = new Date().toISOString().slice(0, 10);
    if (!exp.period) exp.period = inferPeriod(exp.date);
    exp.amount = Number(exp.amount) || 0;

    truck.roadExpenses.push(exp);
    saveStore(store);
    return true;
  }

  function updateExpense(truckId, expId, updatedExp) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;
    const idx = truck.roadExpenses.findIndex(e => e.id === expId);
    if (idx === -1) return false;

    updatedExp.id = expId;
    if (!updatedExp.period) updatedExp.period = inferPeriod(updatedExp.date);
    updatedExp.amount = Number(updatedExp.amount) || 0;

    truck.roadExpenses[idx] = updatedExp;
    saveStore(store);
    return true;
  }

  function deleteExpense(truckId, expId) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (!prj) return false;
    const truck = prj.trucks.find(t => t.id === truckId);
    if (!truck) return false;
    truck.roadExpenses = truck.roadExpenses.filter(e => e.id !== expId);
    saveStore(store);
    return true;
  }

  function findRecord(truckId, type, id) {
    const truck = getTruck(truckId);
    if (!truck) return null;
    if (type === 'trip') return truck.trips.find(t => t.id === id) || null;
    if (type === 'diesel') return truck.diesel.find(d => d.id === id) || null;
    if (type === 'advance') return truck.driverAdvances.find(a => a.id === id) || null;
    if (type === 'expense') return truck.roadExpenses.find(e => e.id === id) || null;
    return null;
  }

  // --- Reset to Master Verified Seed Data ---
  function resetToOriginalSeed() {
    const copy = JSON.parse(JSON.stringify(INITIAL_SEED));
    saveStore(copy);
    setCurrentProjectId("PRJ-001");
    return copy;
  }

  // Backward compatibility wrapper for old code expecting getData()
  function getData() {
    const prj = getCurrentProject();
    return {
      metadata: {
        systemTitle: prj.name,
        version: "2.0.0",
        activeFinancialPeriod: prj.activePeriod || "2026-10",
        currencySymbol: "₹",
        lastUpdated: getStore().lastUpdated
      },
      trucks: prj.trucks
    };
  }

  function saveData(compatData) {
    const store = getStore();
    const prj = store.projects.find(p => p.id === getCurrentProjectId());
    if (prj && compatData.trucks) {
      prj.trucks = compatData.trucks;
    }
    saveStore(store);
  }

  return {
    getStore,
    saveStore,
    getProjects,
    getCurrentProjectId,
    setCurrentProjectId,
    getCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    getTrucks,
    getTruck,
    addTruck,
    updateTruck,
    deleteTruck,
    addTrip,
    updateTrip,
    deleteTrip,
    addDiesel,
    updateDiesel,
    deleteDiesel,
    addAdvance,
    updateAdvance,
    deleteAdvance,
    addExpense,
    updateExpense,
    deleteExpense,
    findRecord,
    resetToOriginalSeed,
    getData,
    saveData,
    init: getStore
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataModule;
}
