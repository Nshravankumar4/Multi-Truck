/**
 * Transport Brokerage Ledger Pvt Ltd
 * Multi-Project Data Storage & State Architecture (data.js)
 */

const DataModule = (() => {
  const MASTER_STORAGE_KEY = 'FLEET_LEDGER_P2_MASTER_V1';

  const DEFAULT_INITIAL_STATE = {
    version: 3,
    lastUpdated: new Date().toISOString(),
    activeProjectId: 'PRJ-001',
    activePeriod: '2026-10',

    accountingPeriods: [
      { id: '2026-10', name: 'October 2026', period: "2026-10", status: 'Active' },
      { id: '2026-09', name: 'September 2026', period: "2026-09", status: 'Closed' },
      { id: '2026-11', name: 'November 2026', period: "2026-11", status: 'Upcoming' }
    ],

    projects: [
      {
        id: 'PRJ-001',
        name: 'Project 001 - Hyderabad South',
        description: 'Primary Southern Interstate Logistics Route',
        spreadsheetId: '1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4',
        createdAt: '2026-10-01'
      }
    ],

    trucks: [
      {
        id: 'TG15T6666',
        regNumber: 'TG15T6666',
        driverId: 'DRV-001',
        model: 'BharatBenz 3528C',
        capacity: '35 Tons',
        status: 'Active',
        assignedRoute: 'Hyderabad - Nagpur - Raipur'
      },
      {
        id: 'TS15UE1122',
        regNumber: 'TS15UE1122',
        driverId: 'DRV-002',
        model: 'Tata Signa 3523',
        capacity: '35 Tons',
        status: 'Active',
        assignedRoute: 'Hyderabad - Vijayawada'
      }
    ],

    drivers: [
      {
        id: 'DRV-001',
        name: 'Noor Allam',
        phone: '+91 98765 43210',
        truckId: 'TG15T6666',
        commissionRate: 0.12,
        status: 'Active'
      },
      {
        id: 'DRV-002',
        name: 'Allam Brother',
        phone: '+91 98765 43211',
        truckId: 'TS15UE1122',
        commissionRate: 0.12,
        status: 'Active'
      }
    ],

    pnlData: {
      'TG15T6666': {
        truckId: 'TG15T6666',
        driverName: 'Noor Allam',
        period: 'October 2026',
        oldBalance: 13800,
        revenue: {
          p1Freight: 382800,
          baseFreight: 339500,
          haltage: 0,
          loadingCharges: 0,
          detention: 0
        },
        expenses: {
          dieselTotal: 132600,
          claimedRoadExpenses: 28700,
          itemizedRoadExpenses: 28735,
          reconciliationDiff: 35,
          roadTotalClaimed: 28700,
          roadTotalItemized: 28735,
          driverCommission: 40740,
          fastagCharges: 40000,
          addBlueCharges: 15000,
          fixedTotal: 55000
        },
        trips: [
          { id: 'TRP-66-1', date: '2026-10-02', transporter: 'SR Logistics', source: 'MDCL', destination: 'MADHAPURA', freightP1: 175000, baseFreight: 140000, dieselAmount: 62000, roadExpenses: 13500 },
          { id: 'TRP-66-2', date: '2026-10-09', transporter: 'Interstate Carrier', source: 'AURGANGABAD', destination: 'HYD', freightP1: 108500, baseFreight: 108500, dieselAmount: 38000, roadExpenses: 8200 },
          { id: 'TRP-66-3', date: '2026-10-15', transporter: 'South Trans', source: 'K"NAG', destination: 'KURNOOL', freightP1: 72300, baseFreight: 64000, dieselAmount: 18000, roadExpenses: 4500 },
          { id: 'TRP-66-4', date: '2026-10-18', transporter: 'Local Line', source: 'KURNOOL', destination: 'MDCL', freightP1: 27000, baseFreight: 27000, dieselAmount: 14600, roadExpenses: 2500 }
        ],
        dieselLogs: [
          { id: 'DSL-66-1', date: '2026-10-02', pump: 'IndianOil Hyd', liters: 338.89, rate: 90, amount: 30500 },
          { id: 'DSL-66-2', date: '2026-10-08', pump: 'BPCL Nagpur', liters: 338.89, rate: 90, amount: 30500 },
          { id: 'DSL-66-3', date: '2026-10-14', pump: 'HPCL Raipur', liters: 351.11, rate: 90, amount: 31600 },
          { id: 'DSL-66-4', date: '2026-10-17', pump: 'IndianOil Kurnool', liters: 144.44, rate: 90, amount: 13000 },
          { id: 'DSL-66-5', date: '2026-10-19', pump: 'Reliance Hyd', liters: 300.00, rate: 90, amount: 27000 }
        ],
        advances: [
          { id: 'ADV-66-1', date: '2026-10-01', type: 'Cash', purpose: 'NAGAPUR ADV', amount: 5000 },
          { id: 'ADV-66-2', date: '2026-10-03', type: 'Bank', purpose: 'VARANSANI ADV', amount: 6000 },
          { id: 'ADV-66-3', date: '2026-10-05', type: 'Cash', purpose: 'MOBILE PH', amount: 2000 },
          { id: 'ADV-66-4', date: '2026-10-08', type: 'Cash', purpose: 'BAHAGALPUR', amount: 3000 },
          { id: 'ADV-66-5', date: '2026-10-10', type: 'Bank', purpose: 'VARANSANI ADV', amount: 7000 },
          { id: 'ADV-66-6', date: '2026-10-12', type: 'Cash', purpose: 'NAGAPUR ADV', amount: 3000 },
          { id: 'ADV-66-7', date: '2026-10-14', type: 'Cash', purpose: 'CHEGUNTA JAFFER DABA', amount: 2000 },
          { id: 'ADV-66-8', date: '2026-10-16', type: 'Bank', purpose: 'HOME TRSF', amount: 10000 },
          { id: 'ADV-66-9', date: '2026-10-18', type: 'Cash', purpose: 'MDCL ADV', amount: 5000 },
          { id: 'ADV-66-10', date: '2026-10-20', type: 'Cash', purpose: 'MOBILE PH', amount: 35200 }
        ],
        roadExpenseItems: [
          { id: 'RXP-66-1', date: '2026-10-03', category: 'Toll / RTO', desc: 'HYD KANTA + TARPAL', amount: 800 },
          { id: 'RXP-66-2', date: '2026-10-08', category: 'Police / Border', desc: 'Borders & Checks', amount: 4200 },
          { id: 'RXP-66-3', date: '2026-10-15', category: 'Loading / Unloading', desc: 'Labor & Vouchers', amount: 23735 }
        ],
        otherExpenses: [
          { id: 'OXP-66-1', date: '2026-10-05', category: 'FastTag', desc: 'FastTag Toll Recharge', amount: 40000 },
          { id: 'OXP-66-2', date: '2026-10-20', category: 'Miscellaneous', desc: 'AddBlue & Maintenance', amount: 15000 }
        ]
      },

      'TS15UE1122': {
        truckId: 'TS15UE1122',
        driverName: 'Allam Brother',
        period: 'October 2026',
        oldBalance: 62340,
        revenue: {
          p1Freight: 236000,
          baseFreight: 199000,
          haltage: 0,
          loadingCharges: 0,
          detention: 0
        },
        expenses: {
          dieselTotal: 103000,
          claimedRoadExpenses: 11790,
          itemizedRoadExpenses: 11790,
          reconciliationDiff: 0,
          roadTotalClaimed: 11790,
          roadTotalItemized: 11790,
          driverCommission: 23880,
          fastagCharges: 25000,
          addBlueCharges: 20000,
          fixedTotal: 45000
        },
        trips: [
          { id: 'TRP-11-1', date: '2026-10-04', transporter: 'SR Logistics', source: 'MDCL', destination: 'CHEGUNTA', freightP1: 15000, baseFreight: 10000, dieselAmount: 24000, roadExpenses: 2500 },
          { id: 'TRP-11-2', date: '2026-10-06', transporter: 'Interstate Carrier', source: 'MDCL', destination: 'MUZZFARPUR', freightP1: 141000, baseFreight: 114000, dieselAmount: 42000, roadExpenses: 5290 },
          { id: 'TRP-11-3', date: '2026-10-11', transporter: 'East Freight', source: 'JABALPUR', destination: 'BHONIGIRI', freightP1: 80000, baseFreight: 75000, dieselAmount: 37000, roadExpenses: 4000 }
        ],
        dieselLogs: [
          { id: 'DSL-11-1', date: '2026-10-05', pump: 'IndianOil Hyd', liters: 266.67, rate: 90, amount: 24000 },
          { id: 'DSL-11-2', date: '2026-10-09', pump: 'HPCL Vijayawada', liters: 211.11, rate: 90, amount: 19000 },
          { id: 'DSL-11-3', date: '2026-10-12', pump: 'BPCL Jabalpur', liters: 255.56, rate: 90, amount: 23000 },
          { id: 'DSL-11-4', date: '2026-10-16', pump: 'IndianOil Bhonigiri', liters: 111.11, rate: 90, amount: 10000 },
          { id: 'DSL-11-5', date: '2026-10-18', pump: 'Reliance Hyd', liters: 300.00, rate: 90, amount: 27000 }
        ],
        advances: [
          { id: 'ADV-11-1', date: '2026-10-04', type: 'Cash', purpose: 'MDCL ADV', amount: 2500 },
          { id: 'ADV-11-2', date: '2026-10-06', type: 'Cash', purpose: 'NAGAPUR', amount: 5000 },
          { id: 'ADV-11-3', date: '2026-10-08', type: 'Cash', purpose: 'EN ROUTE', amount: 5000 },
          { id: 'ADV-11-4', date: '2026-10-10', type: 'Bank', purpose: 'HOME TRSF', amount: 20000 },
          { id: 'ADV-11-5', date: '2026-10-13', type: 'Cash', purpose: 'JABALPUR', amount: 5000 },
          { id: 'ADV-11-6', date: '2026-10-15', type: 'Cash', purpose: 'CHANDRAPUR', amount: 4000 }
        ],
        roadExpenseItems: [
          { id: 'RXP-11-1', date: '2026-10-06', category: 'Toll / RTO', desc: 'Police Parchi & Tolls', amount: 4300 },
          { id: 'RXP-11-2', date: '2026-10-14', category: 'Loading / Unloading', desc: 'Labor & Checkpost Vouchers', amount: 7490 }
        ],
        otherExpenses: [
          { id: 'OXP-11-1', date: '2026-10-05', category: 'FastTag', desc: 'FastTag Toll Recharge', amount: 25000 },
          { id: 'OXP-11-2', date: '2026-10-20', category: 'Miscellaneous', desc: 'AddBlue & Maintenance', amount: 20000 }
        ]
      }
    }
  };

  let store = null;

  function loadStateFromStorage() {
    try {
      const serialized = localStorage.getItem(MASTER_STORAGE_KEY);
      if (serialized) {
        store = JSON.parse(serialized);
      } else {
        store = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
        persistState();
      }
    } catch (e) {
      store = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
    }
    return store;
  }

  function persistState() {
    if (!store) return;
    store.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(store));
    } catch (e) {}
  }

  function getStore() {
    if (!store) loadStateFromStorage();
    return store;
  }

  function saveStore(newStore) {
    if (!newStore) return;
    store = newStore;
    persistState();
  }

  // --- Multi-Project Management (Test 2) ---
  function getProjects() {
    return getStore().projects || [];
  }

  function getActiveProject() {
    const s = getStore();
    return (s.projects || []).find(p => p.id === s.activeProjectId) || s.projects[0];
  }

  function setCurrentProjectId(projectId) {
    const s = getStore();
    const prj = (s.projects || []).find(p => p.id === projectId);
    if (prj) {
      s.activeProjectId = projectId;
      persistState();
      return true;
    }
    return false;
  }

  function addProject(prj) {
    const s = getStore();
    const newId = 'PRJ-' + String(s.projects.length + 1).padStart(3, '0');
    const newPrj = {
      id: newId,
      name: prj.name,
      description: prj.description || '',
      spreadsheetId: prj.spreadsheetId || '',
      createdAt: new Date().toISOString().split('T')[0]
    };
    s.projects.push(newPrj);
    persistState();
    return newPrj;
  }

  // --- Dynamic Unlimited Fleet / Truck Support (Test 3) ---
  function getTrucks() {
    return getStore().trucks || [];
  }

  function getTruckById(truckId) {
    return getTrucks().find(t => t.id === truckId);
  }

  function addTruck(truck) {
    const s = getStore();
    if (s.trucks.find(t => t.id === truck.id)) return false;

    const newTruck = {
      id: truck.id,
      regNumber: truck.regNumber || truck.id,
      driverId: truck.driverId || '',
      model: truck.model || 'Commercial Carrier',
      capacity: truck.capacity || '35 Tons',
      status: truck.status || 'Active',
      assignedRoute: truck.assignedRoute || 'Interstate Route'
    };
    s.trucks.push(newTruck);

    if (!s.pnlData[truck.id]) {
      s.pnlData[truck.id] = {
        truckId: truck.id,
        driverName: truck.driverName || '',
        period: s.activePeriod,
        oldBalance: 0,
        revenue: { p1Freight: 0, baseFreight: 0, haltage: 0, loadingCharges: 0, detention: 0 },
        expenses: { dieselTotal: 0, claimedRoadExpenses: 0, itemizedRoadExpenses: 0, reconciliationDiff: 0, roadTotalClaimed: 0, roadTotalItemized: 0, driverCommission: 0, fastagCharges: 0, addBlueCharges: 0, fixedTotal: 0 },
        trips: [], dieselLogs: [], advances: [], roadExpenseItems: [], otherExpenses: []
      };
    }

    persistState();
    return newTruck;
  }

  function registerTruck(truck) {
    return addTruck(truck);
  }

  function updateTruck(truckId, updatedData) {
    const s = getStore();
    const idx = s.trucks.findIndex(t => t.id === truckId);
    if (idx === -1) return false;
    s.trucks[idx] = { ...s.trucks[idx], ...updatedData };
    persistState();
    return true;
  }

  function deleteTruck(truckId) {
    const s = getStore();
    s.trucks = s.trucks.filter(t => t.id !== truckId);
    delete s.pnlData[truckId];
    persistState();
    return true;
  }

  // --- Drivers ---
  function getDrivers() {
    return getStore().drivers || [];
  }

  function getDriverById(driverId) {
    return getDrivers().find(d => d.id === driverId);
  }

  function getDriverForTruck(truckId) {
    return getDrivers().find(d => d.truckId === truckId);
  }

  // --- Periods ---
  function getActivePeriod() {
    return getStore().activePeriod || '2026-10';
  }

  function setActivePeriod(period) {
    const s = getStore();
    s.activePeriod = period;
    persistState();
  }

  function getAccountingPeriods() {
    const s = getStore();
    return s.accountingPeriods || [];
  }

  // --- P&L Raw ---
  function getPnLForTruck(truckId) {
    const s = getStore();
    return s.pnlData[truckId] || null;
  }

  // --- CRUD Trips ---
  function addTrip(truckId, trip) {
    const s = getStore();
    if (!s.pnlData[truckId]) return null;

    const newTrip = {
      id: 'TRP-' + Date.now().toString().slice(-6),
      date: trip.date || new Date().toISOString().split('T')[0],
      transporter: trip.transporter || 'SR Logistics',
      source: trip.source || 'Hyderabad',
      destination: trip.destination || 'Vijayawada',
      freightP1: Number(trip.freightP1) || 0,
      baseFreight: Number(trip.baseFreight) || Number(trip.freightP1) || 0,
      dieselAmount: Number(trip.dieselAmount) || 0,
      roadExpenses: Number(trip.roadExpenses) || 0
    };

    s.pnlData[truckId].trips.push(newTrip);
    recalculateTruckTotals(truckId);
    persistState();
    return newTrip;
  }

  function updateTrip(truckId, tripId, updatedTrip) {
    const s = getStore();
    if (!s.pnlData[truckId]) return false;
    const idx = s.pnlData[truckId].trips.findIndex(t => t.id === tripId);
    if (idx === -1) return false;

    s.pnlData[truckId].trips[idx] = {
      ...s.pnlData[truckId].trips[idx],
      ...updatedTrip,
      freightP1: Number(updatedTrip.freightP1) || 0,
      baseFreight: Number(updatedTrip.baseFreight) || 0,
      dieselAmount: Number(updatedTrip.dieselAmount) || 0,
      roadExpenses: Number(updatedTrip.roadExpenses) || 0
    };

    recalculateTruckTotals(truckId);
    persistState();
    return true;
  }

  function deleteTrip(truckId, tripId) {
    const s = getStore();
    if (!s.pnlData[truckId]) return false;
    const initialLen = s.pnlData[truckId].trips.length;
    s.pnlData[truckId].trips = s.pnlData[truckId].trips.filter(t => t.id !== tripId);
    if (s.pnlData[truckId].trips.length !== initialLen) {
      recalculateTruckTotals(truckId);
      persistState();
      return true;
    }
    return false;
  }

  // --- CRUD Diesel ---
  function addDiesel(truckId, diesel) {
    const s = getStore();
    if (!s.pnlData[truckId]) return null;

    const newLog = {
      id: 'DSL-' + Date.now().toString().slice(-6),
      date: diesel.date || new Date().toISOString().split('T')[0],
      pump: diesel.pump || 'IndianOil Station',
      liters: Number(diesel.liters) || 0,
      rate: Number(diesel.rate) || 90,
      amount: Number(diesel.amount) || ((Number(diesel.liters) || 0) * (Number(diesel.rate) || 90))
    };

    s.pnlData[truckId].dieselLogs.push(newLog);
    recalculateTruckTotals(truckId);
    persistState();
    return newLog;
  }

  function updateDiesel(truckId, logId, updatedDiesel) {
    const s = getStore();
    if (!s.pnlData[truckId]) return false;
    const idx = s.pnlData[truckId].dieselLogs.findIndex(d => d.id === logId);
    if (idx === -1) return false;

    s.pnlData[truckId].dieselLogs[idx] = {
      ...s.pnlData[truckId].dieselLogs[idx],
      ...updatedDiesel,
      liters: Number(updatedDiesel.liters) || 0,
      rate: Number(updatedDiesel.rate) || 0,
      amount: Number(updatedDiesel.amount) || 0
    };

    recalculateTruckTotals(truckId);
    persistState();
    return true;
  }

  function deleteDiesel(truckId, logId) {
    const s = getStore();
    if (!s.pnlData[truckId]) return false;
    const initialLen = s.pnlData[truckId].dieselLogs.length;
    s.pnlData[truckId].dieselLogs = s.pnlData[truckId].dieselLogs.filter(d => d.id !== logId);
    if (s.pnlData[truckId].dieselLogs.length !== initialLen) {
      recalculateTruckTotals(truckId);
      persistState();
      return true;
    }
    return false;
  }

  // --- CRUD Advances ---
  function addAdvance(truckId, advance) {
    const s = getStore();
    if (!s.pnlData[truckId]) return null;

    const newAdv = {
      id: 'ADV-' + Date.now().toString().slice(-6),
      date: advance.date || new Date().toISOString().split('T')[0],
      type: advance.type || 'Cash',
      purpose: advance.purpose || 'Trip Advance',
      amount: Number(advance.amount) || 0
    };

    s.pnlData[truckId].advances.push(newAdv);
    persistState();
    return newAdv;
  }

  function updateAdvance(truckId, advId, updatedAdv) {
    const s = getStore();
    if (!s.pnlData[truckId]) return false;
    const idx = s.pnlData[truckId].advances.findIndex(a => a.id === advId);
    if (idx === -1) return false;

    s.pnlData[truckId].advances[idx] = {
      ...s.pnlData[truckId].advances[idx],
      ...updatedAdv,
      amount: Number(updatedAdv.amount) || 0
    };

    persistState();
    return true;
  }

  function deleteAdvance(truckId, advId) {
    const s = getStore();
    if (!s.pnlData[truckId]) return false;
    const initialLen = s.pnlData[truckId].advances.length;
    s.pnlData[truckId].advances = s.pnlData[truckId].advances.filter(a => a.id !== advId);
    if (s.pnlData[truckId].advances.length !== initialLen) {
      persistState();
      return true;
    }
    return false;
  }

  // --- CRUD Road Expenses ---
  function addExpense(truckId, exp) {
    const s = getStore();
    if (!s.pnlData[truckId]) return null;

    const newExp = {
      id: 'RXP-' + Date.now().toString().slice(-6),
      date: exp.date || new Date().toISOString().split('T')[0],
      category: exp.category || 'Toll / RTO',
      desc: exp.desc || '',
      amount: Number(exp.amount) || 0
    };

    s.pnlData[truckId].roadExpenseItems.push(newExp);
    recalculateTruckTotals(truckId);
    persistState();
    return newExp;
  }

  function updateExpense(truckId, expId, updatedExp) {
    const s = getStore();
    if (!s.pnlData[truckId]) return false;
    const idx = s.pnlData[truckId].roadExpenseItems.findIndex(e => e.id === expId);
    if (idx === -1) return false;

    s.pnlData[truckId].roadExpenseItems[idx] = {
      ...s.pnlData[truckId].roadExpenseItems[idx],
      ...updatedExp,
      amount: Number(updatedExp.amount) || 0
    };

    recalculateTruckTotals(truckId);
    persistState();
    return true;
  }

  function deleteExpense(truckId, expId) {
    const s = getStore();
    if (!s.pnlData[truckId]) return false;
    const initialLen = s.pnlData[truckId].roadExpenseItems.length;
    s.pnlData[truckId].roadExpenseItems = s.pnlData[truckId].roadExpenseItems.filter(e => e.id !== expId);
    if (s.pnlData[truckId].roadExpenseItems.length !== initialLen) {
      recalculateTruckTotals(truckId);
      persistState();
      return true;
    }
    return false;
  }

  function recalculateTruckTotals(truckId) {
    const s = getStore();
    const pnl = s.pnlData[truckId];
    if (!pnl) return;

    let p1Total = 0;
    let baseTotal = 0;
    (pnl.trips || []).forEach(t => {
      p1Total += (Number(t.freightP1) || 0);
      baseTotal += (Number(t.baseFreight) || 0);
    });

    let dslTotal = 0;
    (pnl.dieselLogs || []).forEach(d => {
      dslTotal += (Number(d.amount) || 0);
    });

    let roadItemTotal = 0;
    (pnl.roadExpenseItems || []).forEach(r => {
      roadItemTotal += (Number(r.amount) || 0);
    });

    let tripRoadTotal = 0;
    (pnl.trips || []).forEach(t => {
      tripRoadTotal += (Number(t.roadExpenses) || 0);
    });

    pnl.revenue.p1Freight = p1Total;
    pnl.revenue.baseFreight = baseTotal;
    pnl.expenses.dieselTotal = dslTotal;
    pnl.expenses.roadTotalItemized = roadItemTotal;
    pnl.expenses.itemizedRoadExpenses = roadItemTotal;
    pnl.expenses.roadTotalClaimed = tripRoadTotal;
    pnl.expenses.claimedRoadExpenses = tripRoadTotal;
    pnl.expenses.reconciliationDiff = roadItemTotal - tripRoadTotal;

    const drv = getDriverForTruck(truckId);
    const commRate = drv ? (drv.commissionRate || 0.12) : 0.12;
    pnl.expenses.driverCommission = Math.round(baseTotal * commRate);
  }

  function mergeRemoteState(remoteState) {
    if (!remoteState) return;
    const s = getStore();
    if (remoteState.trucks && remoteState.trucks.length > 0) s.trucks = remoteState.trucks;
    if (remoteState.drivers && remoteState.drivers.length > 0) s.drivers = remoteState.drivers;
    if (remoteState.pnlData) s.pnlData = remoteState.pnlData;
    if (remoteState.activePeriod) s.activePeriod = remoteState.activePeriod;
    s.lastUpdated = remoteState.lastUpdated || new Date().toISOString();
    persistState();
  }

  function restoreOriginalData() {
    store = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
    persistState();
  }

  return {
    loadStateFromStorage,
    getStore,
    saveStore,
    getProjects,
    getActiveProject,
    setCurrentProjectId,
    addProject,
    getTrucks,
    getTruckById,
    addTruck,
    registerTruck,
    updateTruck,
    deleteTruck,
    getDrivers,
    getDriverById,
    getDriverForTruck,
    getActivePeriod,
    setActivePeriod,
    getAccountingPeriods,
    getPnLForTruck,
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
    mergeRemoteState,
    restoreOriginalData
  };
})();
