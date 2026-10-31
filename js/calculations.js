/**
 * Transport Brokerage Ledger Pvt Ltd
 * Authoritative Mathematical Engine & Financial Calculations (P2)
 *
 * Capabilities:
 * - Dynamic Multi-Truck Support (Zero Hardcoded Truck IDs)
 * - Date & Accounting Period Aware (Respects Month & Custom Date Range Filters)
 * - Exact Parity with Master Excel Formulas (Base Freight 12% Commission, P1 - P2 Net Profit)
 * - Explicit Reconciliation for ₹35 Discrepancy (TG15T6666 Claimed vs Itemized)
 * - Fleet-Wide Aggregated Driver Settlement Calculation
 */

const CalcModule = (function () {
  'use strict';

  function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    const num = Math.round(Number(amount));
    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);
    return sign + '₹' + abs.toLocaleString('en-IN');
  }

  function calculateDriverCommission(baseFreightTotal) {
    return Math.round((Number(baseFreightTotal) || 0) * 0.12);
  }

  /**
   * Checks if a transaction date/period falls within the given filter criteria
   */
  function matchesFilter(item, filterOptions) {
    if (!filterOptions) return true;

    // 1. Period filter (e.g. "2026-10", "2026-09", or "ALL")
    if (filterOptions.period && filterOptions.period !== 'ALL') {
      if (item.period && item.period !== filterOptions.period) {
        return false;
      }
    }

    // 2. Custom Date Range filter
    const itemDate = item.date || "";
    if (filterOptions.startDate && itemDate && itemDate < filterOptions.startDate) {
      return false;
    }
    if (filterOptions.endDate && itemDate && itemDate > filterOptions.endDate) {
      return false;
    }

    // 3. Search query filter
    if (filterOptions.searchQuery && filterOptions.searchQuery.trim() !== '') {
      const q = filterOptions.searchQuery.toLowerCase().trim();
      const matchDesc = (item.desc && item.desc.toLowerCase().includes(q));
      const matchPump = (item.pump && item.pump.toLowerCase().includes(q));
      const matchRoute = ((item.from && item.from.toLowerCase().includes(q)) || (item.to && item.to.toLowerCase().includes(q)));
      const matchTrans = (item.transporter && item.transporter.toLowerCase().includes(q));
      const matchMode = (item.mode && item.mode.toLowerCase().includes(q));
      const matchLoc = (item.location && item.location.toLowerCase().includes(q));
      if (!matchDesc && !matchPump && !matchRoute && !matchTrans && !matchMode && !matchLoc) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculates P&L Account for a single truck respecting active date/month filters
   */
  function calculateTruckPnL(truck, filterOptions) {
    if (!truck) return null;

    const trips = (truck.trips || []).filter(t => matchesFilter(t, filterOptions));
    const diesel = (truck.diesel || []).filter(d => matchesFilter(d, filterOptions));
    const roadExpenses = (truck.roadExpenses || []).filter(e => matchesFilter(e, filterOptions));

    const totalRevenueP1 = trips.reduce((acc, t) => acc + (Number(t.pnlFreight) || 0), 0);
    const totalBaseFreight = trips.reduce((acc, t) => acc + (Number(t.baseFreight) || 0), 0);
    const driverCommission = calculateDriverCommission(totalBaseFreight);
    const totalDiesel = diesel.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    const totalRoadExp = roadExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    // Fixed expenses (pro-rated or full period)
    const fastTag = Number(truck.fixedExpenses && truck.fixedExpenses.fastTag) || 0;
    const addBlueAndMisc = Number(truck.fixedExpenses && truck.fixedExpenses.addBlueAndMisc) || 0;

    const totalExpensesP2 = totalDiesel + totalRoadExp + fastTag + addBlueAndMisc + driverCommission;
    const netProfit = totalRevenueP1 - totalExpensesP2;
    const profitMargin = totalRevenueP1 > 0 ? (netProfit / totalRevenueP1) * 100 : 0;

    return {
      truckId: truck.id,
      regNumber: truck.regNumber || truck.id,
      driverName: truck.driverName,
      filteredTrips: trips,
      filteredDiesel: diesel,
      filteredRoadExpenses: roadExpenses,
      totalRevenueP1,
      totalBaseFreight,
      driverCommission,
      totalDiesel,
      totalRoadExp,
      fastTag,
      addBlueAndMisc,
      totalExpensesP2,
      netProfit,
      profitMargin: profitMargin.toFixed(2),
      isProfitable: netProfit >= 0
    };
  }

  /**
   * Authoritative Driver Settlement Calculation (Dynamic & Multi-Truck)
   * Handles individual driver settlements without hardcoded branching.
   */
  function calculateDriverSettlement(truck, filterOptions) {
    if (!truck) return null;

    const trips = (truck.trips || []).filter(t => matchesFilter(t, filterOptions));
    const advances = (truck.driverAdvances || []).filter(a => matchesFilter(a, filterOptions));
    const roadExpenses = (truck.roadExpenses || []).filter(e => matchesFilter(e, filterOptions));

    const totalBaseFreight = trips.reduce((acc, t) => acc + (Number(t.baseFreight) || 0), 0);
    const commission12Pct = calculateDriverCommission(totalBaseFreight);
    const totalAdvances = advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0);
    const itemizedRoadExpenses = roadExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const params = truck.settlementParams || {};
    const oldBalance = Number(params.oldBalance) || 0;
    const oldBalanceNote = params.oldBalanceNote || "";
    const originalDirection = params.direction || "AUTO";

    // Preserved reconciliation policy:
    // If the truck has an explicitly documented claimedRoadExpenses variance (e.g. TG15T6666 ₹28,700 vs ₹28,735),
    // preserve both values and clearly show the reconciliation difference.
    let effectiveRoadExpenses = itemizedRoadExpenses;
    let claimedExpenses = itemizedRoadExpenses;
    let reconciliationDiff = 0;

    if (params.claimedRoadExpenses !== undefined && params.claimedRoadExpenses !== null && params.claimedRoadExpenses > 0) {
      claimedExpenses = params.claimedRoadExpenses;
      reconciliationDiff = Math.abs(itemizedRoadExpenses - claimedExpenses);
      effectiveRoadExpenses = claimedExpenses; // Settlement credits what driver claimed
    }

    // Credits: Commission + Reimbursable Road Expenses + (Prior Balance if Transporter owes Driver)
    let driverCredits = commission12Pct + effectiveRoadExpenses;
    if (originalDirection === "PAYABLE_TO_DRIVER") {
      driverCredits += oldBalance;
    }

    // Debits: Advances taken + (Prior Balance if Driver owes Transporter)
    let driverDebits = totalAdvances;
    if (originalDirection === "PAYABLE_BY_DRIVER") {
      driverDebits += oldBalance;
    }

    // Net settlement balance
    let netBalance = 0;
    let netDirection = "BALANCED";
    let statusNote = "";

    if (originalDirection === "PAYABLE_TO_DRIVER") {
      netBalance = driverCredits - totalAdvances;
      if (netBalance >= 0) {
        netDirection = "PAYABLE_TO_DRIVER";
        statusNote = "As On Date " + (params.settlementDate || "Active Period") + ", Shankar wants to Pay " + formatCurrency(netBalance);
      } else {
        netDirection = "PAYABLE_BY_DRIVER";
        netBalance = Math.abs(netBalance);
        statusNote = "As On Date " + (params.settlementDate || "Active Period") + ", Driver wants to Pay Shankar " + formatCurrency(netBalance);
      }
    } else if (originalDirection === "PAYABLE_BY_DRIVER") {
      const currentNetDeficit = totalAdvances - (commission12Pct + effectiveRoadExpenses);
      netBalance = oldBalance + currentNetDeficit;
      netDirection = "PAYABLE_BY_DRIVER";
      statusNote = "As On Date " + (params.settlementDate || "Active Period") + ", Allam wants to Pay Shankar " + formatCurrency(netBalance);
    } else {
      // Automatic general calculation for dynamically added trucks:
      const net = driverCredits - driverDebits;
      if (net > 0) {
        netBalance = net;
        netDirection = "PAYABLE_TO_DRIVER";
        statusNote = "Transporter pays Driver " + formatCurrency(netBalance);
      } else if (net < 0) {
        netBalance = Math.abs(net);
        netDirection = "PAYABLE_BY_DRIVER";
        statusNote = "Driver pays Transporter " + formatCurrency(netBalance);
      } else {
        netBalance = 0;
        netDirection = "BALANCED";
        statusNote = "Account is fully balanced (₹0)";
      }
    }

    return {
      truckId: truck.id,
      regNumber: truck.regNumber || truck.id,
      driverName: truck.driverName,
      driverPhone: truck.driverPhone,
      filteredTrips: trips,
      filteredAdvances: advances,
      filteredRoadExpenses: roadExpenses,
      totalBaseFreight,
      commission12Pct,
      totalAdvances,
      itemizedRoadExpenses,
      claimedExpenses,
      reconciliationDiff,
      hasReconciliationVariance: reconciliationDiff > 0,
      oldBalance,
      oldBalanceNote,
      driverCredits,
      driverDebits,
      netBalance,
      netDirection,
      statusNote
    };
  }

  /**
   * Fleet Combined Totals across ALL trucks in project
   */
  function calculateFleetTotals(trucks, filterOptions) {
    let combinedRevenue = 0;
    let combinedExpenses = 0;
    let combinedDiesel = 0;
    let combinedRoadExp = 0;
    let combinedFastTag = 0;
    let combinedAddBlue = 0;
    let combinedCommission = 0;
    let totalTripsCount = 0;
    let totalAdvances = 0;
    let totalPayableToDrivers = 0;
    let totalReceivableFromDrivers = 0;

    const truckPnLs = [];
    const driverSettlements = [];

    (trucks || []).forEach(t => {
      const pnl = calculateTruckPnL(t, filterOptions);
      const settlement = calculateDriverSettlement(t, filterOptions);

      truckPnLs.push(pnl);
      driverSettlements.push(settlement);

      combinedRevenue += pnl.totalRevenueP1;
      combinedExpenses += pnl.totalExpensesP2;
      combinedDiesel += pnl.totalDiesel;
      combinedRoadExp += pnl.totalRoadExp;
      combinedFastTag += pnl.fastTag;
      combinedAddBlue += pnl.addBlueAndMisc;
      combinedCommission += pnl.driverCommission;
      totalTripsCount += pnl.filteredTrips.length;
      totalAdvances += settlement.totalAdvances;

      if (settlement.netDirection === "PAYABLE_TO_DRIVER") {
        totalPayableToDrivers += settlement.netBalance;
      } else if (settlement.netDirection === "PAYABLE_BY_DRIVER") {
        totalReceivableFromDrivers += settlement.netBalance;
      }
    });

    const combinedNetProfit = combinedRevenue - combinedExpenses;
    const combinedMargin = combinedRevenue > 0 ? (combinedNetProfit / combinedRevenue) * 100 : 0;

    return {
      combinedRevenue,
      combinedExpenses,
      combinedNetProfit,
      combinedMargin: combinedMargin.toFixed(2),
      combinedDiesel,
      combinedRoadExp,
      combinedFastTag,
      combinedAddBlue,
      combinedCommission,
      totalTripsCount,
      totalAdvances,
      totalPayableToDrivers,
      totalReceivableFromDrivers,
      truckPnLs,
      driverSettlements
    };
  }

  return {
    formatCurrency,
    calculateDriverCommission,
    calculateTruckPnL,
    calculateDriverSettlement,
    calculateFleetTotals,
    matchesFilter
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalcModule;
}
