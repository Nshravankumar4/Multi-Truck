/**
 * Fleet Logistics & Financial Accounts Management - Data Layer
 * Master Verified Datasets for TG15T6666 & TS15UE1122
 * Source: Truck_Detials_1122_6666_Drivers.xlsx & Truck_Detials_1122_6666_P and L Account.xlsx
 * Developed by Shravan Kumar • 2026
 */

const STORAGE_KEY_P2 = 'FLEET_LEDGER_P2_MASTER_V1';

const INITIAL_DATA_P2 = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  trucks: [
    { id: 'TG15T6666', regNumber: 'TG15T6666', driverName: 'Noor Allam', phone: '+91 98480 11221', status: 'Active' },
    { id: 'TS15UE1122', regNumber: 'TS15UE1122', driverName: 'Allam Brother (Shankar)', phone: '+91 98480 22332', status: 'Active' }
  ],
  months: [
    { id: '2026-10', name: 'October 2026 (Active)', period: '01-10-2026 To 20-10-2026', isActive: true },
    { id: '2026-09', name: 'September 2026 (Archived)', period: '01-09-2026 To 30-09-2026', isActive: false }
  ],

  // -------------------------------------------------------------
  // TRUCK 1: TG15T6666 (Driver: Noor Allam) - October 2026
  // -------------------------------------------------------------
  TG15T6666: {
    driver: {
      name: 'Noor Allam',
      truckNo: 'TG15T6666',
      period: '01-10-2026 To 20-10-2026',
      commissionRate: 0.12,
      oldBalancePayable: 13800, // Old Balc Shankar wants to pay
      roadExpensesClaimed: 28700, // Rounded ledger credit
      roadExpensesItemizedSum: 28735 // Exact sum of 37 items
    },
    pl: {
      period: '01-10-2026 To 20-10-2026',
      fastTag: 40000,
      addBlueAndExp: 15000,
      dieselEntries: [
        { id: 'D-6666-1', date: '02-10-2026', pump: 'HPCL Nagpur Highway', amount: 30500 },
        { id: 'D-6666-2', date: '06-10-2026', pump: 'BPCL Jabalpur Bypass', amount: 30500 },
        { id: 'D-6666-3', date: '10-10-2026', pump: 'IOCL Aurangabad Plaza', amount: 31600 },
        { id: 'D-6666-4', date: '14-10-2026', pump: 'Reliance Hyd Outer Ring', amount: 13000 },
        { id: 'D-6666-5', date: '17-10-2026', pump: 'HPCL Kurnool Highway', amount: 27000 }
      ],
      dieselTotal: 132600
    },
    trips: [
      {
        id: 'TRIP-6666-01',
        sno: 1,
        dateRange: '01-10-26 TO 06-10-26',
        from: 'MDCL',
        to: 'MADHAPURA',
        route: 'MDCL TO MADHAPURA',
        pnlFreight: 175000,     // P1 Freight in P&L Account
        baseFreight: 140000,    // Base Lorry Freight for Driver 12% commission
        transporter: 'SR TRSP',
        advanceReceived: 130000,
        balanceFreight: 10000,
        podStatus: 'Delivered',
        remarks: 'Direct delivery completed'
      },
      {
        id: 'TRIP-6666-02',
        sno: 2,
        dateRange: '09-10-26 TO 14-10-26',
        from: 'AURGANGABAD',
        to: 'HYD',
        route: 'AURGANGABAD TO HYD',
        pnlFreight: 108500,
        baseFreight: 108500,
        transporter: 'HYD LOGISTICS',
        advanceReceived: 90000,
        balanceFreight: 18500,
        podStatus: 'Delivered',
        remarks: 'Return freight to Hyderabad'
      },
      {
        id: 'TRIP-6666-03',
        sno: 3,
        dateRange: '15-10-26 TO 17-10-26',
        from: 'K"NAG',
        to: 'KURNOOL',
        route: 'K"NAG TO KURNOOL',
        pnlFreight: 72300,
        baseFreight: 64000,
        transporter: 'KNR FREIGHT',
        advanceReceived: 50000,
        balanceFreight: 14000,
        podStatus: 'Delivered',
        remarks: 'Seeds dispatch to Kurnool'
      },
      {
        id: 'TRIP-6666-04',
        sno: 4,
        dateRange: '18-10-26 TO 19-10-26',
        from: 'KURNOOL',
        to: 'MDCL',
        route: 'KURNOOL TO MDCL',
        pnlFreight: 27000,
        baseFreight: 27000,
        transporter: 'LOCAL CARRIER',
        advanceReceived: 20000,
        balanceFreight: 7000,
        podStatus: 'Delivered',
        remarks: 'Empty return trip loaded with packaging'
      }
    ],
    advances: [
      { id: 'ADV-6666-01', date: '03-10-2026', location: 'NAGAPUR ADV', amount: 5000, mode: 'Cash' },
      { id: 'ADV-6666-02', date: '05-10-2026', location: 'VARANSANI ADV', amount: 6000, mode: 'Cash' },
      { id: 'ADV-6666-03', date: '06-10-2026', location: 'MOBILE PH', amount: 2000, mode: 'UPI' },
      { id: 'ADV-6666-04', date: '09-10-2026', location: 'BAHAGALPUR', amount: 3000, mode: 'Cash' },
      { id: 'ADV-6666-05', date: '12-10-2026', location: 'VARANSANI ADV', amount: 7000, mode: 'Cash' },
      { id: 'ADV-6666-06', date: '13-10-2026', location: 'NAGAPUR ADV', amount: 3000, mode: 'Cash' },
      { id: 'ADV-6666-07', date: '14-10-2026', location: 'CHEGUNTA JAFFER DABA', amount: 2000, mode: 'Dhaba' },
      { id: 'ADV-6666-08', date: '17-10-2026', location: 'HOME TRSF', amount: 10000, mode: 'Bank Transfer' },
      { id: 'ADV-6666-09', date: '18-10-2026', location: 'MDCL ADV', amount: 5000, mode: 'Cash' },
      { id: 'ADV-6666-10', date: '19-10-2026', location: 'MOBILE PH', amount: 35200, mode: 'UPI' }
    ],
    roadExpenses: [
      { id: 'EXP-6666-01', description: 'HYD KANTA', category: 'Kanta / Weighbridge', amount: 400 },
      { id: 'EXP-6666-02', description: 'TARPAL', category: 'Accessories / Maintenance', amount: 400 },
      { id: 'EXP-6666-03', description: 'BANDARKOLA BODER', category: 'Border / Toll', amount: 900 },
      { id: 'EXP-6666-04', description: 'MANSAR BODER', category: 'Border / Toll', amount: 2600 },
      { id: 'EXP-6666-05', description: 'KHAWAS BODER', category: 'Border / Toll', amount: 700 },
      { id: 'EXP-6666-06', description: 'HANMANA BODER', category: 'Border / Toll', amount: 900 },
      { id: 'EXP-6666-07', description: 'HEAD LIGHT BULB', category: 'Accessories / Maintenance', amount: 520 },
      { id: 'EXP-6666-08', description: 'KAMANI BOLT', category: 'Accessories / Maintenance', amount: 180 },
      { id: 'EXP-6666-09', description: 'BIHAR BODER', category: 'Border / Toll', amount: 900 },
      { id: 'EXP-6666-10', description: 'ARA LOUBAR SLIP', category: 'Labour / Loading', amount: 200 },
      { id: 'EXP-6666-11', description: 'BEETA PHOOL', category: 'Pooja / Traditional', amount: 300 },
      { id: 'EXP-6666-12', description: 'SAMSATIPUR PHOOL', category: 'Pooja / Traditional', amount: 400 },
      { id: 'EXP-6666-13', description: 'BIHAR POLICE', category: 'Police / Checking', amount: 450 },
      { id: 'EXP-6666-14', description: 'BIHAR PUJA PARCHI', category: 'Pooja / Traditional', amount: 980 },
      { id: 'EXP-6666-15', description: 'PARKING', category: 'Parking / Halt', amount: 350 },
      { id: 'EXP-6666-16', description: 'GERACE', category: 'Greasing / Washing', amount: 300 },
      { id: 'EXP-6666-17', description: 'TYRE PUMCHAR', category: 'Tyre / Puncture', amount: 300 },
      { id: 'EXP-6666-18', description: 'JABALPUR ENTRY', category: 'Border / Toll', amount: 1500 },
      { id: 'EXP-6666-19', description: 'BHAGALPUR PULL', category: 'Toll / Bridge', amount: 300 },
      { id: 'EXP-6666-20', description: 'BHAGALPUR KANTA', category: 'Kanta / Weighbridge', amount: 180 },
      { id: 'EXP-6666-21', description: 'POJJA PACHEE', category: 'Pooja / Traditional', amount: 670 },
      { id: 'EXP-6666-22', description: 'AURGANABAD LOUDING', category: 'Labour / Loading', amount: 1100 },
      { id: 'EXP-6666-23', description: 'KANTA', category: 'Kanta / Weighbridge', amount: 300 },
      { id: 'EXP-6666-24', description: 'MUNSI AURGANBAD', category: 'Labour / Loading', amount: 450 },
      { id: 'EXP-6666-25', description: 'BIHAR BODER', category: 'Border / Toll', amount: 900 },
      { id: 'EXP-6666-26', description: 'HANMANA BODER', category: 'Border / Toll', amount: 900 },
      { id: 'EXP-6666-27', description: 'KHAWAS BODER', category: 'Border / Toll', amount: 700 },
      { id: 'EXP-6666-28', description: 'BANDARKOLA BODER', category: 'Border / Toll', amount: 4500 },
      { id: 'EXP-6666-29', description: 'BANDARKOLA BODER', category: 'Border / Toll', amount: 700 },
      { id: 'EXP-6666-30', description: 'LORRY RUBBER STOP', category: 'Accessories / Maintenance', amount: 1800 },
      { id: 'EXP-6666-31', description: 'HYD TRSP LOUDING', category: 'Labour / Loading', amount: 300 },
      { id: 'EXP-6666-32', description: 'GERACE', category: 'Greasing / Washing', amount: 600 },
      { id: 'EXP-6666-33', description: 'TYRE PUMCHAR', category: 'Tyre / Puncture', amount: 250 },
      { id: 'EXP-6666-34', description: 'TUBE', category: 'Accessories / Maintenance', amount: 1450 },
      { id: 'EXP-6666-35', description: 'KURNOOL UNLODING', category: 'Labour / Loading', amount: 480 },
      { id: 'EXP-6666-36', description: 'KURNOOL OVER LOUD TOLL', category: 'Border / Toll', amount: 675 },
      { id: 'EXP-6666-37', description: 'LOUDING DASSHERA MAMUL', category: 'Pooja / Traditional', amount: 200 }
    ]
  },

  // -------------------------------------------------------------
  // TRUCK 2: TS15UE1122 (Driver: Allam Brother) - October 2026
  // -------------------------------------------------------------
  TS15UE1122: {
    driver: {
      name: 'Allam Brother (Shankar)',
      truckNo: 'TS15UE1122',
      period: '04-10-2026 To 20-10-2026',
      commissionRate: 0.12,
      oldBalancePayableByDriver: 62340, // Old balance Allam wants to pay Shankar
      roadExpensesClaimed: 11790
    },
    pl: {
      period: '04-10-2026 To 20-10-2026',
      fastTag: 25000,
      addBlueAndExp: 20000,
      dieselEntries: [
        { id: 'D-1122-1', date: '04-10-2026', pump: 'HPCL Chegunta Bypass', amount: 24000 },
        { id: 'D-1122-2', date: '08-10-2026', pump: 'BPCL Nagpur Express', amount: 19000 },
        { id: 'D-1122-3', date: '11-10-2026', pump: 'IOCL Jabalpur Plaza', amount: 23000 },
        { id: 'D-1122-4', date: '14-10-2026', pump: 'Reliance MP Highway', amount: 10000 },
        { id: 'D-1122-5', date: '18-10-2026', pump: 'HPCL Bhongir Hub', amount: 27000 }
      ],
      dieselTotal: 103000
    },
    trips: [
      {
        id: 'TRIP-1122-01',
        sno: 1,
        dateRange: '04-10-26 TO 06-10-26',
        from: 'MDCL',
        to: 'CHEGUNTA',
        route: 'MDCL TO CHEGUNTA',
        pnlFreight: 15000,     // P&L Freight
        baseFreight: 10000,    // Base Lorry Freight for Driver 12% commission
        transporter: 'LOCAL CARRIER',
        advanceReceived: 10000,
        balanceFreight: 0,
        podStatus: 'Delivered',
        remarks: 'Short haul seed transport'
      },
      {
        id: 'TRIP-1122-02',
        sno: 2,
        dateRange: '06-10-26 TO 09-10-26',
        from: 'MDCL',
        to: 'MUZZFARPUR',
        route: 'MDCL TO MUZZFARPUR',
        pnlFreight: 141000,
        baseFreight: 114000,
        transporter: 'BIHAR EXPRESS',
        advanceReceived: 100000,
        balanceFreight: 14000,
        podStatus: 'Delivered',
        remarks: 'North-bound agriculture seeds'
      },
      {
        id: 'TRIP-1122-03',
        sno: 3,
        dateRange: '11-10-26 TO 13-10-26',
        from: 'JABALPUR',
        to: 'BHONIGIRI',
        route: 'JABALPUR TO BHONIGIRI',
        pnlFreight: 80000,
        baseFreight: 75000,
        transporter: 'MP CARRIERS',
        advanceReceived: 65000,
        balanceFreight: 10000,
        podStatus: 'Delivered',
        remarks: 'Return delivery with heavy payload'
      }
    ],
    advances: [
      { id: 'ADV-1122-01', date: '07-10-2026', location: 'MDCL ADV', amount: 2500, mode: 'Cash' },
      { id: 'ADV-1122-02', date: '08-10-2026', location: 'NAGAPUR', amount: 5000, mode: 'Cash' },
      { id: 'ADV-1122-03', date: '09-10-2026', location: 'VARANASI', amount: 5000, mode: 'Cash' },
      { id: 'ADV-1122-04', date: '09-10-2026', location: 'HOME TRSF', amount: 20000, mode: 'Bank Transfer' },
      { id: 'ADV-1122-05', date: '11-10-2026', location: 'VARANASI', amount: 5000, mode: 'Cash' },
      { id: 'ADV-1122-06', date: '15-10-2026', location: 'CHANDRAPUR', amount: 4000, mode: 'Cash' }
    ],
    roadExpenses: [
      { id: 'EXP-1122-01', description: 'POLICE PARCHI', category: 'Police / Checking', amount: 430 },
      { id: 'EXP-1122-02', description: 'MOHINA BODER', category: 'Border / Toll', amount: 500 },
      { id: 'EXP-1122-03', description: 'ARRA LABOUR', category: 'Labour / Loading', amount: 200 },
      { id: 'EXP-1122-04', description: 'HANMANA BODER', category: 'Border / Toll', amount: 700 },
      { id: 'EXP-1122-05', description: 'JABALPUR CHAI PANI', category: 'Food / Chai Pani', amount: 200 },
      { id: 'EXP-1122-06', description: 'KHAWASA BODER', category: 'Border / Toll', amount: 700 },
      { id: 'EXP-1122-07', description: 'MANASAR BODER', category: 'Border / Toll', amount: 900 },
      { id: 'EXP-1122-08', description: 'CHANDARPUR BODER', category: 'Border / Toll', amount: 900 },
      { id: 'EXP-1122-09', description: 'CHANDARPUR PS', category: 'Police / Checking', amount: 300 },
      { id: 'EXP-1122-10', description: 'TYRE PUMCHAR', category: 'Tyre / Puncture', amount: 650 },
      { id: 'EXP-1122-11', description: 'GREACE', category: 'Greasing / Washing', amount: 300 },
      { id: 'EXP-1122-12', description: 'MDCL KANTA', category: 'Kanta / Weighbridge', amount: 100 },
      { id: 'EXP-1122-13', description: 'PANDARKOLA BODER', category: 'Border / Toll', amount: 700 },
      { id: 'EXP-1122-14', description: 'MANASAR BODER', category: 'Border / Toll', amount: 900 },
      { id: 'EXP-1122-15', description: 'KHAWASA BODER', category: 'Border / Toll', amount: 700 },
      { id: 'EXP-1122-16', description: 'HANMANA BODER', category: 'Border / Toll', amount: 900 },
      { id: 'EXP-1122-17', description: 'MOHINA BODER', category: 'Border / Toll', amount: 800 },
      { id: 'EXP-1122-18', description: 'ARRA LABOUR', category: 'Labour / Loading', amount: 200 },
      { id: 'EXP-1122-19', description: 'CHAPPRA BODER', category: 'Border / Toll', amount: 400 },
      { id: 'EXP-1122-20', description: 'PS KACHARA', category: 'Police / Checking', amount: 380 },
      { id: 'EXP-1122-21', description: 'PUJJA PARCHI', category: 'Pooja / Traditional', amount: 630 },
      { id: 'EXP-1122-22', description: 'GREACE', category: 'Greasing / Washing', amount: 300 }
    ]
  },

  // -------------------------------------------------------------
  // HISTORICAL ARCHIVE: SEPTEMBER 2026 (Sheet1 & Sheet2)
  // -------------------------------------------------------------
  archive_2026_09: {
    TG15T6666: {
      period: '01-09-2026 To 30-09-2026',
      driverName: 'Noor Allam',
      trips: [
        { route: 'MDCL TO PATNA', date: '01-09-26', freight: 126000 },
        { route: 'RAIPUR TO MDCL', date: '03-09-26', freight: 94500 },
        { route: 'MDCL TO COOCHBIHAR', date: '10-09-26', freight: 185000 },
        { route: 'RAIGANJ TO WARASEONI', date: '17-09-26', freight: 80500 },
        { route: 'WARASEONI TO MDCL', date: '27-09-26', freight: 71750 }
      ],
      totalFreight: 557750,
      diesel: 227070,
      fastTag: 70000,
      driverExpenses: 46375,
      driverSalary: 66960,
      loadingCharges: 7500,
      truckMaintenance: 2500,
      addBlue: 10000,
      totalExpenses: 430405,
      netProfit: 127345,
      driverSettlement: {
        salaryCommission: 66960,
        oldBalanceAug31: 18500,
        advancesTaken: 83800, // 48800 + 35000
        balanceSalaryCarriedForward: 13800 // Carried to October!
      }
    },
    TS15UE1122: {
      period: '01-09-2026 To 30-09-2026',
      driverName: 'Allam Brother',
      trips: [
        { route: 'MYSURU TO LUCKNOW', date: '01-09-26', freight: 148000 },
        { route: 'LUCKNOW TO MDCL', date: '07-09-26', freight: 87000, note: '1 bag shortage' },
        { route: 'IBRAHIMPATAM TO MDCL', date: '22-09-26', freight: 15000 },
        { route: 'PATNA TO MDCL', date: '30-09-26 TO 03-10-26', freight: 94500, note: '6 bags shortage rice' }
      ],
      totalFreight: 344500,
      diesel: 250989,
      roadExpenses: 36300,
      salaryCommission: 56940,
      tyreTruckRepair: 20000,
      loadingCharges: 10000,
      totalExpenses: 374229,
      driverSettlement: {
        totalAdvances: 134100,
        roadExpenses: 36300,
        salaryCommission: 56940,
        balanceWithAllam: 62340 // Carried to October!
      }
    }
  }
};

const DataModule = (function () {
  'use strict';

  let currentData = null;

  function init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_P2);
      if (stored) {
        currentData = JSON.parse(stored);
      } else {
        resetToDefaults();
      }
    } catch (e) {
      console.warn('Failed to load from localStorage, resetting defaults:', e);
      resetToDefaults();
    }
  }

  function resetToDefaults() {
    currentData = JSON.parse(JSON.stringify(INITIAL_DATA_P2));
    save();
  }

  function save() {
    try {
      if (currentData) {
        currentData.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY_P2, JSON.stringify(currentData));
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  function getData() {
    if (!currentData) init();
    return currentData;
  }

  function getTruckData(truckId) {
    const data = getData();
    return data[truckId] || null;
  }

  function addTrip(truckId, trip) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    if (!trip.id) trip.id = `TRIP-${truckId}-${Date.now()}`;
    truck.trips.push(trip);
    save();
    notifyChange('addTrip', { truckId, trip });
    return true;
  }

  function updateTrip(truckId, tripId, updatedTrip) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    const idx = truck.trips.findIndex(t => t.id === tripId);
    if (idx === -1) return false;
    truck.trips[idx] = Object.assign({}, truck.trips[idx], updatedTrip, { id: tripId });
    save();
    notifyChange('updateTrip', { truckId, tripId });
    return true;
  }

  function deleteTrip(truckId, tripId) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    const initialLen = truck.trips.length;
    truck.trips = truck.trips.filter(t => t.id !== tripId);
    if (truck.trips.length === initialLen) return false;
    save();
    notifyChange('deleteTrip', { truckId, tripId });
    return true;
  }

  function addExpense(truckId, expense) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    if (!expense.id) expense.id = `EXP-${truckId}-${Date.now()}`;
    truck.roadExpenses.push(expense);
    truck.driver.roadExpensesItemizedSum = truck.roadExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    save();
    notifyChange('addExpense', { truckId, expense });
    return true;
  }

  function updateExpense(truckId, expenseId, updatedExpense) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    const idx = truck.roadExpenses.findIndex(e => e.id === expenseId);
    if (idx === -1) return false;
    truck.roadExpenses[idx] = Object.assign({}, truck.roadExpenses[idx], updatedExpense, { id: expenseId });
    truck.driver.roadExpensesItemizedSum = truck.roadExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    save();
    notifyChange('updateExpense', { truckId, expenseId });
    return true;
  }

  function deleteExpense(truckId, expenseId) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    const initialLen = truck.roadExpenses.length;
    truck.roadExpenses = truck.roadExpenses.filter(e => e.id !== expenseId);
    if (truck.roadExpenses.length === initialLen) return false;
    truck.driver.roadExpensesItemizedSum = truck.roadExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    save();
    notifyChange('deleteExpense', { truckId, expenseId });
    return true;
  }

  function addAdvance(truckId, advance) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    if (!advance.id) advance.id = `ADV-${truckId}-${Date.now()}`;
    truck.advances.push(advance);
    save();
    notifyChange('addAdvance', { truckId, advance });
    return true;
  }

  function updateAdvance(truckId, advanceId, updatedAdvance) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    const idx = truck.advances.findIndex(a => a.id === advanceId);
    if (idx === -1) return false;
    truck.advances[idx] = Object.assign({}, truck.advances[idx], updatedAdvance, { id: advanceId });
    save();
    notifyChange('updateAdvance', { truckId, advanceId });
    return true;
  }

  function deleteAdvance(truckId, advanceId) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    const initialLen = truck.advances.length;
    truck.advances = truck.advances.filter(a => a.id !== advanceId);
    if (truck.advances.length === initialLen) return false;
    save();
    notifyChange('deleteAdvance', { truckId, advanceId });
    return true;
  }

  function addDiesel(truckId, diesel) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    if (!diesel.id) diesel.id = `D-${truckId}-${Date.now()}`;
    truck.pl.dieselEntries.push(diesel);
    truck.pl.dieselTotal = truck.pl.dieselEntries.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    save();
    notifyChange('addDiesel', { truckId, diesel });
    return true;
  }

  function updateDiesel(truckId, dieselId, updatedDiesel) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    const idx = truck.pl.dieselEntries.findIndex(d => d.id === dieselId);
    if (idx === -1) return false;
    truck.pl.dieselEntries[idx] = Object.assign({}, truck.pl.dieselEntries[idx], updatedDiesel, { id: dieselId });
    truck.pl.dieselTotal = truck.pl.dieselEntries.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    save();
    notifyChange('updateDiesel', { truckId, dieselId });
    return true;
  }

  function deleteDiesel(truckId, dieselId) {
    const truck = getTruckData(truckId);
    if (!truck) return false;
    const initialLen = truck.pl.dieselEntries.length;
    truck.pl.dieselEntries = truck.pl.dieselEntries.filter(d => d.id !== dieselId);
    if (truck.pl.dieselEntries.length === initialLen) return false;
    truck.pl.dieselTotal = truck.pl.dieselEntries.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    save();
    notifyChange('deleteDiesel', { truckId, dieselId });
    return true;
  }

  function findRecord(type, truckId, recordId) {
    const truck = getTruckData(truckId);
    if (!truck) return null;
    if (type === 'trip') {
      return (truck.trips || []).find(t => t.id === recordId) || null;
    } else if (type === 'diesel') {
      return (truck.pl && truck.pl.dieselEntries ? truck.pl.dieselEntries : []).find(d => d.id === recordId) || null;
    } else if (type === 'advance') {
      return (truck.advances || []).find(a => a.id === recordId) || null;
    } else if (type === 'expense') {
      return (truck.roadExpenses || []).find(e => e.id === recordId) || null;
    }
    return null;
  }

  function notifyChange(action, payload) {
    if (typeof window !== 'undefined' && window.ApiModule && typeof window.ApiModule.broadcastChange === 'function') {
      window.ApiModule.broadcastChange(action, payload);
    }
  }

  return {
    init,
    getData,
    getTruckData,
    addTrip,
    updateTrip,
    deleteTrip,
    addExpense,
    updateExpense,
    deleteExpense,
    addAdvance,
    updateAdvance,
    deleteAdvance,
    addDiesel,
    updateDiesel,
    deleteDiesel,
    findRecord,
    resetToDefaults,
    save
  };
})();

if (typeof window !== 'undefined') {
  window.DataModule = DataModule;
}

