/**
 * Transport Brokerage Ledger Pvt Ltd
 * Dashboard Module (dashboard.js)
 * Clean, simplified dashboard per SR_B UI reference
 */

const DashboardModule = (() => {

  function renderDashboard(filterPeriod = null) {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    const fleetTotals = CalculationModule.calculateFleetTotals(filterPeriod);
    const trucks = DataModule.getTrucks();

    // 1. Six Simple KPI Cards
    let html = `
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">Total Revenue</span>
          <div class="metric-value">${CalculationModule.formatCurrency(fleetTotals.totalRevenue)}</div>
          <span class="metric-sub">P1 Freight Billing</span>
        </div>
        <div class="metric-card expenses">
          <span class="metric-label">Total Expenses</span>
          <div class="metric-value">${CalculationModule.formatCurrency(fleetTotals.totalExpenses)}</div>
          <span class="metric-sub">Diesel, Road &amp; Fixed</span>
        </div>
        <div class="metric-card profit">
          <span class="metric-label">Net Profit</span>
          <div class="metric-value">${CalculationModule.formatCurrency(fleetTotals.totalNetProfit)}</div>
          <span class="metric-sub">P1 - P2 Net Margin</span>
        </div>
        <div class="metric-card margin">
          <span class="metric-label">Profit Margin</span>
          <div class="metric-value">${CalculationModule.formatPercent(fleetTotals.overallMargin)}</div>
          <span class="metric-sub">Return on Freight</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Total Trips</span>
          <div class="metric-value">${fleetTotals.totalTrips}</div>
          <span class="metric-sub">Completed Runs</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Active Vehicles</span>
          <div class="metric-value">${fleetTotals.activeTruckCount}</div>
          <span class="metric-sub">Operating Fleet</span>
        </div>
      </div>
    `;

    // 2. Simple Vehicle-Wise Financial Table
    html += `
      <div class="card-panel">
        <div class="panel-header">
          <h2 class="panel-title">🚛 Vehicle Financial Performance</h2>
          <span style="font-size: 0.75rem; color: var(--muted);">Period: ${filterPeriod || 'October 2026'}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Assigned Driver</th>
                <th class="numeric">Trips</th>
                <th class="numeric">Revenue (P1)</th>
                <th class="numeric">Expenses (P2)</th>
                <th class="numeric">Net Profit</th>
                <th class="numeric">Margin</th>
                <th>Driver Settlement</th>
              </tr>
            </thead>
            <tbody>
    `;

    trucks.forEach(t => {
      const pnlRaw = DataModule.getPnLForTruck(t.id);
      const pnl = CalculationModule.calculatePnL(pnlRaw, filterPeriod);
      const settlement = CalculationModule.calculateDriverSettlement(t.id, filterPeriod);

      const isPositive = pnl.netProfit >= 0;
      const profitColor = isPositive ? 'var(--success)' : 'var(--danger)';

      let settlementBadge = '';
      if (settlement) {
        if (settlement.balancePayableToDriver >= 0) {
          settlementBadge = `<span class="badge badge-success">+${CalculationModule.formatCurrency(settlement.balancePayableToDriver)} (Pay Driver)</span>`;
        } else {
          settlementBadge = `<span class="badge badge-danger">-${CalculationModule.formatCurrency(Math.abs(settlement.balancePayableToDriver))} (Driver Owes)</span>`;
        }
      }

      html += `
        <tr>
          <td><strong>${t.regNumber || t.id}</strong></td>
          <td>${pnl.driverName || 'Driver'}</td>
          <td class="numeric">${pnl.tripCount}</td>
          <td class="numeric"><strong>${CalculationModule.formatCurrency(pnl.revenue.p1Freight)}</strong></td>
          <td class="numeric">${CalculationModule.formatCurrency(pnl.expenses.totalExpensesP2)}</td>
          <td class="numeric" style="color: ${profitColor}; font-weight: 700;">${CalculationModule.formatCurrency(pnl.netProfit)}</td>
          <td class="numeric">${CalculationModule.formatPercent(pnl.netProfitMarginPercent)}</td>
          <td>${settlementBadge}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Combined Fleet</strong></td>
                <td>-</td>
                <td class="numeric">${fleetTotals.totalTrips}</td>
                <td class="numeric">${CalculationModule.formatCurrency(fleetTotals.totalRevenue)}</td>
                <td class="numeric">${CalculationModule.formatCurrency(fleetTotals.totalExpenses)}</td>
                <td class="numeric" style="color: var(--success);">${CalculationModule.formatCurrency(fleetTotals.totalNetProfit)}</td>
                <td class="numeric">${CalculationModule.formatPercent(fleetTotals.overallMargin)}</td>
                <td>-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    // 3. Small Driver Settlement Summary Table
    html += `
      <div class="card-panel">
        <div class="panel-header">
          <h2 class="panel-title">📋 Driver Settlement Summary</h2>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AppModule.navigateToView('settlements')">View Full Ledger →</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Vehicle</th>
                <th class="numeric">Old Balance</th>
                <th class="numeric">12% Commission</th>
                <th class="numeric">Road Expenses</th>
                <th class="numeric">Advances Taken</th>
                <th class="numeric">Final Balance</th>
                <th>Direction</th>
              </tr>
            </thead>
            <tbody>
    `;

    trucks.forEach(t => {
      const settlement = CalculationModule.calculateDriverSettlement(t.id, filterPeriod);
      if (!settlement) return;

      const isPayable = settlement.balancePayableToDriver >= 0;
      const dirBadge = isPayable
        ? `<span class="badge badge-success">Payable to Driver</span>`
        : `<span class="badge badge-danger">Payable by Driver</span>`;

      html += `
        <tr>
          <td><strong>${settlement.driverName}</strong></td>
          <td>${t.regNumber || t.id}</td>
          <td class="numeric">${CalculationModule.formatCurrency(settlement.oldBalance)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(settlement.driverCommissionEarned)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(settlement.roadExpensesCovered)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(settlement.totalAdvancesTaken)}</td>
          <td class="numeric" style="font-weight: 700; color: ${isPayable ? 'var(--success)' : 'var(--danger)'};">
            ${CalculationModule.formatCurrency(Math.abs(settlement.balancePayableToDriver))}
          </td>
          <td>${dirBadge}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  return {
    renderDashboard
  };
})();
