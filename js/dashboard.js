/**
 * Transport Brokerage Ledger Pvt Ltd
 * Multi-Project & Dynamic Fleet Executive Dashboard (P2)
 */

const DashboardModule = (function () {
  'use strict';

  function render(filterOptions) {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    const currentProject = DataModule.getCurrentProject();
    let trucks = DataModule.getTrucks();

    // Apply truck filter if specific truck selected
    if (filterOptions && filterOptions.truckId && filterOptions.truckId !== 'ALL') {
      trucks = trucks.filter(t => t.id === filterOptions.truckId);
    }

    const fleet = CalcModule.calculateFleetTotals(trucks, filterOptions);
    const periodDisplay = (filterOptions && filterOptions.period && filterOptions.period !== 'ALL')
      ? "Period: " + filterOptions.period
      : (currentProject.activePeriod ? "Period: " + currentProject.activePeriod : "All Dates");

    // Dynamic Settlement Action Alerts
    let alertsHtml = '';
    fleet.driverSettlements.forEach(drv => {
      const isPayable = drv.netDirection === "PAYABLE_TO_DRIVER";
      const cardClass = isPayable ? "alert-card-payable" : "alert-card-receivable";
      const amountClass = isPayable ? "payable-amount" : "receivable-amount";
      const actionText = isPayable ? "Pay Driver →" : "Collect Balance →";

      alertsHtml += `
        <div class="alert-card ${cardClass}">
          <div class="alert-card-left">
            <div class="alert-card-meta">
              <span class="alert-lr-badge">${ApiModule.escapeHtml(drv.regNumber)}</span>
              <span class="alert-truck-badge">${ApiModule.escapeHtml(drv.driverName)}</span>
            </div>
            <div class="alert-card-route">${periodDisplay} • Driver Settlement</div>
            <div class="alert-card-sub">
              <span>Commission: ${CalcModule.formatCurrency(drv.commission12Pct)}</span> • 
              <span>Advances: ${CalcModule.formatCurrency(drv.totalAdvances)}</span>
            </div>
          </div>
          <div class="alert-card-right">
            <div class="alert-amount ${amountClass}">${CalcModule.formatCurrency(drv.netBalance)}</div>
            <button class="btn-alert-action" onclick="AppModule.switchView('driver'); AppModule.selectTruckFilter('${drv.truckId}');">
              ${actionText}
            </button>
          </div>
        </div>
      `;
    });

    // Dynamic Side-by-Side Truck Cards
    let truckCardsHtml = '';
    fleet.truckPnLs.forEach(pnl => {
      truckCardsHtml += `
        <div class="truck-performance-card">
          <div class="truck-card-header">
            <div>
              <span class="truck-name">${ApiModule.escapeHtml(pnl.regNumber)}</span>
              <span class="truck-driver-sub">${ApiModule.escapeHtml(pnl.driverName)}</span>
            </div>
            <span class="truck-status-badge ${pnl.isProfitable ? 'status-active' : 'status-danger'}">
              ${pnl.profitMargin}% Margin
            </span>
          </div>
          <div class="truck-card-body">
            <div class="truck-metric-row">
              <span>Freight Revenue (P1):</span>
              <strong style="color: #15803d;">${CalcModule.formatCurrency(pnl.totalRevenueP1)}</strong>
            </div>
            <div class="truck-metric-row">
              <span>Operating Expenses (P2):</span>
              <strong style="color: #b91c1c;">${CalcModule.formatCurrency(pnl.totalExpensesP2)}</strong>
            </div>
            <div class="truck-metric-row">
              <span>Diesel Fuel (${pnl.filteredDiesel.length} slips):</span>
              <span>${CalcModule.formatCurrency(pnl.totalDiesel)}</span>
            </div>
            <div class="truck-metric-row">
              <span>En-route Road Expenses:</span>
              <span>${CalcModule.formatCurrency(pnl.totalRoadExp)}</span>
            </div>
            <div class="truck-metric-row">
              <span>12% Driver Salary Commission:</span>
              <span>${CalcModule.formatCurrency(pnl.driverCommission)}</span>
            </div>
            <div class="truck-metric-row highlight-net">
              <span>Net Operating Profit:</span>
              <strong style="color: #1e3a8a; font-size: 1.15rem;">${CalcModule.formatCurrency(pnl.netProfit)}</strong>
            </div>
          </div>
          <div class="truck-card-footer">
            <button class="btn btn-secondary btn-sm" onclick="AppModule.switchView('pnl'); AppModule.selectTruckFilter('${pnl.truckId}');">
              View P&amp;L Ledgers
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AppModule.switchView('driver'); AppModule.selectTruckFilter('${pnl.truckId}');">
              Settlements
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <!-- 1. ALERT CARDS SECTION -->
      <div class="dashboard-alerts-section">
        <div class="alert-section-header">
          <span class="alert-header-badge">⚠️ Action Required</span>
          <h4>Pending Settlement &amp; Fleet Balances (${periodDisplay})</h4>
        </div>
        <div class="alert-cards-carousel">
          ${alertsHtml}
        </div>
      </div>

      <!-- 2. MASTER FLEET KPI METRIC CARDS -->
      <div class="kpi-grid">
        <!-- Revenue -->
        <div class="kpi-card kpi-revenue">
          <div class="kpi-header">
            <span class="kpi-title">TOTAL FREIGHT REVENUE (P1)</span>
            <span class="kpi-icon">💰</span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedRevenue)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-success">${fleet.totalTripsCount} Filtered Trips</span>
            <span class="kpi-subtext">Across ${trucks.length} Trucks</span>
          </div>
        </div>

        <!-- Expenses -->
        <div class="kpi-card kpi-expenses">
          <div class="kpi-header">
            <span class="kpi-title">TOTAL OPERATING EXPENSES (P2)</span>
            <span class="kpi-icon">📉</span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedExpenses)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-warning">Diesel, Tolls, Comm</span>
            <span class="kpi-subtext">Operating Costs</span>
          </div>
        </div>

        <!-- Net Profit -->
        <div class="kpi-card kpi-profit">
          <div class="kpi-header">
            <span class="kpi-title">NET OPERATING PROFIT (P1 - P2)</span>
            <span class="kpi-icon">📈</span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedNetProfit)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-profit">${fleet.combinedMargin}% Profit Margin</span>
            <span class="kpi-subtext">Healthy Margin</span>
          </div>
        </div>

        <!-- Diesel Fuel Spend -->
        <div class="kpi-card kpi-diesel">
          <div class="kpi-header">
            <span class="kpi-title">TOTAL DIESEL FUEL SPEND</span>
            <span class="kpi-icon">⛽</span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedDiesel)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-info">${fleet.combinedRevenue > 0 ? ((fleet.combinedDiesel / fleet.combinedRevenue) * 100).toFixed(1) : 0}% of Revenue</span>
            <span class="kpi-subtext">Major Expense</span>
          </div>
        </div>

        <!-- FastTag Highway Tolls -->
        <div class="kpi-card kpi-fasttag">
          <div class="kpi-header">
            <span class="kpi-title">FASTTAG HIGHWAY TOLLS</span>
            <span class="kpi-icon">🛣️</span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedFastTag)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-neutral">Electronic Tolls</span>
            <span class="kpi-subtext">Fleet Allocated</span>
          </div>
        </div>

        <!-- Driver 12% Salary Commissions -->
        <div class="kpi-card kpi-commission">
          <div class="kpi-header">
            <span class="kpi-title">DRIVER 12% COMMISSIONS</span>
            <span class="kpi-icon">🤝</span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedCommission)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-commission">12% Base Freight</span>
            <span class="kpi-subtext">Driver Salaries</span>
          </div>
        </div>
      </div>

      <!-- 3. DYNAMIC FLEET COMPARISON SECTION -->
      <div class="dashboard-section-title">
        <h3>🚛 Individual Truck Performance (${periodDisplay})</h3>
        <span class="section-sub">${trucks.length} Active commercial vehicles in project: ${ApiModule.escapeHtml(currentProject.name)}</span>
      </div>

      <div class="trucks-grid">
        ${truckCardsHtml}
      </div>

      <!-- 4. EXPENSE ALLOCATION DISTRIBUTION PROGRESS BAR -->
      <div class="expense-allocation-card" style="margin-top: 1.5rem; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem;">
        <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #1e293b;">📊 Fleet Operating Expense Distribution ($P_2$)</h4>
        <div style="height: 18px; border-radius: 9px; overflow: hidden; display: flex; background: #f1f5f9;">
          <div style="background: #2563eb; width: ${fleet.combinedExpenses > 0 ? (fleet.combinedDiesel / fleet.combinedExpenses) * 100 : 0}%;" title="Diesel: ${CalcModule.formatCurrency(fleet.combinedDiesel)}"></div>
          <div style="background: #0284c7; width: ${fleet.combinedExpenses > 0 ? (fleet.combinedFastTag / fleet.combinedExpenses) * 100 : 0}%;" title="FastTag: ${CalcModule.formatCurrency(fleet.combinedFastTag)}"></div>
          <div style="background: #16a34a; width: ${fleet.combinedExpenses > 0 ? (fleet.combinedCommission / fleet.combinedExpenses) * 100 : 0}%;" title="Commission: ${CalcModule.formatCurrency(fleet.combinedCommission)}"></div>
          <div style="background: #eab308; width: ${fleet.combinedExpenses > 0 ? (fleet.combinedRoadExp / fleet.combinedExpenses) * 100 : 0}%;" title="Road Exp: ${CalcModule.formatCurrency(fleet.combinedRoadExp)}"></div>
          <div style="background: #8b5cf6; width: ${fleet.combinedExpenses > 0 ? (fleet.combinedAddBlue / fleet.combinedExpenses) * 100 : 0}%;" title="AddBlue: ${CalcModule.formatCurrency(fleet.combinedAddBlue)}"></div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.75rem; font-size: 0.78rem; color: #475569;">
          <div><span style="color: #2563eb;">■</span> Diesel Fuel (${fleet.combinedExpenses > 0 ? ((fleet.combinedDiesel / fleet.combinedExpenses) * 100).toFixed(1) : 0}%)</div>
          <div><span style="color: #0284c7;">■</span> FastTag Tolls (${fleet.combinedExpenses > 0 ? ((fleet.combinedFastTag / fleet.combinedExpenses) * 100).toFixed(1) : 0}%)</div>
          <div><span style="color: #16a34a;">■</span> Driver 12% Comm (${fleet.combinedExpenses > 0 ? ((fleet.combinedCommission / fleet.combinedExpenses) * 100).toFixed(1) : 0}%)</div>
          <div><span style="color: #eab308;">■</span> Road Exp (${fleet.combinedExpenses > 0 ? ((fleet.combinedRoadExp / fleet.combinedExpenses) * 100).toFixed(1) : 0}%)</div>
          <div><span style="color: #8b5cf6;">■</span> AddBlue &amp; Maintenance (${fleet.combinedExpenses > 0 ? ((fleet.combinedAddBlue / fleet.combinedExpenses) * 100).toFixed(1) : 0}%)</div>
        </div>
      </div>
    `;
  }

  return {
    render
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardModule;
}
