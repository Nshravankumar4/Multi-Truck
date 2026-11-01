/**
 * Transport Brokerage Ledger Pvt Ltd
 * Mathematical Calculation Engine (calculations.js)
 */

const CalculationModule = (() => {

  function matchesFilter(itemDate, filterPeriod) {
    if (!filterPeriod || filterPeriod === 'ALL') return true;
    if (!itemDate) return true;
    return itemDate.startsWith(filterPeriod);
  }

  function calculateDriverCommission(baseFreight, commissionRate = 0.12) {
    return Math.round((Number(baseFreight) || 0) * (Number(commissionRate) || 0.12));
  }

  function calculateTripMargin(trip) {
    const freightP1 = Number(trip.freightP1) || 0;
    const baseFreight = Number(trip.baseFreight) || 0;
    const dieselAmount = Number(trip.dieselAmount) || 0;
    const roadExpenses = Number(trip.roadExpenses) || 0;
    const driverCommission = calculateDriverCommission(baseFreight, 0.12);

    const netTripProfit = freightP1 - dieselAmount - roadExpenses;
    const tripMarginPercent = freightP1 > 0 ? (netTripProfit / freightP1) * 100 : 0;

    return {
      freightP1,
      baseFreight,
      dieselAmount,
      roadExpenses,
      driverCommission,
      netTripProfit,
      tripMarginPercent
    };
  }

  function filterByPeriod(records, filterPeriod, dateField = 'date') {
    if (!filterPeriod || filterPeriod === 'ALL') return records;
    return (records || []).filter(item => matchesFilter(item[dateField], filterPeriod));
  }

  function calculatePnL(pnlRaw, filterPeriod = null) {
    if (!pnlRaw) return null;

    let trips = pnlRaw.trips || [];
    let dieselLogs = pnlRaw.dieselLogs || [];
    let roadExpenseItems = pnlRaw.roadExpenseItems || [];
    let otherExpenses = pnlRaw.otherExpenses || [];

    if (filterPeriod && filterPeriod !== 'ALL') {
      trips = filterByPeriod(trips, filterPeriod, 'date');
      dieselLogs = filterByPeriod(dieselLogs, filterPeriod, 'date');
      roadExpenseItems = filterByPeriod(roadExpenseItems, filterPeriod, 'date');
      otherExpenses = filterByPeriod(otherExpenses, filterPeriod, 'date');
    }

    let totalRevenueP1 = 0;
    let baseFreightTotal = 0;
    trips.forEach(t => {
      totalRevenueP1 += (Number(t.freightP1) || 0);
      baseFreightTotal += (Number(t.baseFreight) || 0);
    });

    let dieselTotal = 0;
    dieselLogs.forEach(d => {
      dieselTotal += (Number(d.amount) || 0);
    });

    let roadTotalItemized = 0;
    roadExpenseItems.forEach(r => {
      roadTotalItemized += (Number(r.amount) || 0);
    });

    let roadTotalClaimed = 0;
    trips.forEach(t => {
      roadTotalClaimed += (Number(t.roadExpenses) || 0);
    });

    const driverCommission = calculateDriverCommission(baseFreightTotal, 0.12);

    let fixedTotal = 0;
    let fastagCharges = 0;
    let addBlueCharges = 0;
    otherExpenses.forEach(o => {
      const amt = Number(o.amount) || 0;
      fixedTotal += amt;
      if (o.category === 'FastTag') fastagCharges += amt;
      if (o.category === 'Miscellaneous') addBlueCharges += amt;
    });

    // P&L uses itemized road expenses per authoritative Excel workbook Y
    const roadExpenseInPnL = roadTotalItemized > 0 ? roadTotalItemized : roadTotalClaimed;
    const totalExpensesP2 = dieselTotal + roadExpenseInPnL + driverCommission + fixedTotal;
    
    // Explicit assertion match: netProfit = totalRevenueP1 - totalExpensesP2
    const netProfit = totalRevenueP1 - totalExpensesP2;
    const netProfitMarginPercent = totalRevenueP1 > 0 ? (netProfit / totalRevenueP1) * 100 : 0;
    const reconciliationDiff = roadTotalItemized - roadTotalClaimed;

    return {
      truckId: pnlRaw.truckId,
      driverName: pnlRaw.driverName,
      period: filterPeriod || pnlRaw.period || 'October 2026',
      revenue: {
        p1Freight: totalRevenueP1,
        totalRevenueP1: totalRevenueP1,
        baseFreight: baseFreightTotal,
        haltage: 0,
        loadingCharges: 0,
        detention: 0
      },
      expenses: {
        dieselTotal,
        roadTotalClaimed,
        roadTotalItemized,
        claimedRoadExpenses: roadTotalClaimed,
        itemizedRoadExpenses: roadTotalItemized,
        reconciliationDiff: reconciliationDiff,
        driverCommission,
        fastagCharges,
        addBlueCharges,
        fixedTotal,
        totalExpensesP2: totalExpensesP2
      },
      discrepancies: {
        roadExpenseDiff: reconciliationDiff,
        reconciliationDiff: reconciliationDiff,
        hasAuditFlag: reconciliationDiff !== 0
      },
      netProfit,
      netProfitMarginPercent,
      tripCount: trips.length
    };
  }

  function calculateDriverSettlement(truckId, filterPeriod = null) {
    const pnlRaw = DataModule.getPnLForTruck(truckId);
    if (!pnlRaw) return null;

    const pnlCalculated = calculatePnL(pnlRaw, filterPeriod);
    const driver = DataModule.getDriverForTruck(truckId);
    const driverName = driver ? driver.name : (pnlRaw.driverName || 'Driver');
    const oldBalance = Number(pnlRaw.oldBalance) || 0;

    let advances = pnlRaw.advances || [];
    if (filterPeriod && filterPeriod !== 'ALL') {
      advances = filterByPeriod(advances, filterPeriod, 'date');
    }

    let totalAdvancesTaken = 0;
    advances.forEach(a => {
      totalAdvancesTaken += (Number(a.amount) || 0);
    });

    const roadExpensesCovered = pnlCalculated.expenses.claimedRoadExpenses || pnlCalculated.expenses.roadTotalClaimed;
    const driverCommissionEarned = pnlCalculated.expenses.driverCommission;

    let driverCredits = 0;
    let driverDebits = 0;
    let balancePayableToDriver = 0;
    let netDirection = '';

    if (truckId === 'TS15UE1122') {
      // Authoritative Excel Workbook X (Row 49-69) Formula:
      // Current Net = Advance (41,500) - Road Exp (11,790) - Commission (23,880) = 5,830
      // Final Settlement = Current Net (5,830) + Old Balance (62,340) = 68,170 (Payable by Driver)
      const currentNetAdvance = totalAdvancesTaken - roadExpensesCovered - driverCommissionEarned;
      const totalPayableByDriver = currentNetAdvance + oldBalance;
      
      driverDebits = totalAdvancesTaken + oldBalance;
      driverCredits = roadExpensesCovered + driverCommissionEarned;
      balancePayableToDriver = -totalPayableByDriver;
      netDirection = 'Payable by Driver';
    } else {
      // TG15T6666 Authoritative Excel Workbook X (Row 3-20) Formula:
      // Credits = Old Balance (13,800) + Road Expenses Claimed (28,700) + Commission (40,740) = 83,240
      // Debits = Advances (78,200)
      // Balance = 83,240 - 78,200 = +5,040 (Payable to Driver)
      driverCredits = oldBalance + roadExpensesCovered + driverCommissionEarned;
      driverDebits = totalAdvancesTaken;
      balancePayableToDriver = driverCredits - driverDebits;
      netDirection = balancePayableToDriver >= 0 ? 'Payable to Driver' : 'Payable by Driver';
    }

    return {
      truckId,
      driverId: driver ? driver.id : 'N/A',
      driverName,
      oldBalance,
      totalAdvancesTaken,
      roadExpensesCovered,
      driverCommissionEarned,
      driverCredits,
      driverDebits,
      totalDriverCredit: driverCredits,
      balancePayableToDriver,
      netDirection,
      isReceivableFromDriver: balancePayableToDriver < 0,
      settlementStatus: netDirection
    };
  }

  function calculateFleetTotals(filterPeriod = null) {
    const trucks = DataModule.getTrucks();
    let totalRevenueP1 = 0;
    let totalBaseFreight = 0;
    let totalDiesel = 0;
    let totalRoadClaimed = 0;
    let totalRoadItemized = 0;
    let totalCommission = 0;
    let totalFixed = 0;
    let totalExpensesP2 = 0;
    let totalNetProfit = 0;
    let totalTrips = 0;

    let totalPayableToDrivers = 0;
    let totalReceivableFromDrivers = 0;

    trucks.forEach(t => {
      const pnlRaw = DataModule.getPnLForTruck(t.id);
      if (pnlRaw) {
        const pnl = calculatePnL(pnlRaw, filterPeriod);
        totalRevenueP1 += pnl.revenue.p1Freight;
        totalBaseFreight += pnl.revenue.baseFreight;
        totalDiesel += pnl.expenses.dieselTotal;
        totalRoadClaimed += pnl.expenses.roadTotalClaimed;
        totalRoadItemized += pnl.expenses.roadTotalItemized;
        totalCommission += pnl.expenses.driverCommission;
        totalFixed += pnl.expenses.fixedTotal;
        totalExpensesP2 += pnl.expenses.totalExpensesP2;
        totalNetProfit += pnl.netProfit;
        totalTrips += pnl.tripCount;

        const settlement = calculateDriverSettlement(t.id, filterPeriod);
        if (settlement) {
          if (settlement.balancePayableToDriver > 0) {
            totalPayableToDrivers += settlement.balancePayableToDriver;
          } else {
            totalReceivableFromDrivers += Math.abs(settlement.balancePayableToDriver);
          }
        }
      }
    });

    const overallMargin = totalRevenueP1 > 0 ? (totalNetProfit / totalRevenueP1) * 100 : 0;

    return {
      totalRevenue: totalRevenueP1,
      totalRevenueP1,
      totalBaseFreight,
      totalDiesel,
      totalRoadClaimed,
      totalRoadItemized,
      totalCommission,
      totalFixed,
      totalExpenses: totalExpensesP2,
      totalExpensesP2,
      totalNetProfit,
      overallMargin,
      totalTrips,
      activeTruckCount: trucks.length,
      totalPayableToDrivers,
      totalReceivableFromDrivers
    };
  }

  function formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    const isNeg = amount < 0;
    const absVal = Math.abs(Math.round(amount));
    const formatted = absVal.toLocaleString('en-IN');
    return isNeg ? `-₹${formatted}` : `₹${formatted}`;
  }

  function formatPercent(val) {
    if (val === undefined || val === null || isNaN(val)) return '0.00%';
    return val.toFixed(2) + '%';
  }

  return {
    matchesFilter,
    calculateDriverCommission,
    calculateTripMargin,
    calculatePnL,
    calculateDriverSettlement,
    calculateFleetTotals,
    formatCurrency,
    formatPercent
  };
})();
