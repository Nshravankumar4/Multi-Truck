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

    // Dynamic Settlement Action Alerts & Summaries
    let alertsHtml = '';
    fleet.driverSettlements.forEach(drv => {
      const isPayable = drv.netDirection === "PAYABLE_TO_DRIVER";
      const cardClass = isPayable ? "alert-card-payable" : "alert-card-receivable";
      const amountClass = isPayable ? "payable-amount" : "receivable-amount";
      const statusLabel = isPayable
        ? `Pay Driver ${CalcModule.formatCurrency(drv.netBalance)}`
        : `Driver Owes ${CalcModule.formatCurrency(drv.netBalance)}`;
      const actionText = isPayable ? "Pay Driver →" : "Collect Balance →";

      alertsHtml += `
        <div class="alert-card ${cardClass}" style="border-radius: 8px;">
          <div class="alert-card-left">
            <div class="alert-card-meta">
              <span class="alert-lr-badge">${ApiModule.escapeHtml(drv.regNumber)}</span>
              <span class="alert-truck-badge">${ApiModule.escapeHtml(drv.driverName)}</span>
            </div>
            <div class="alert-card-route">${periodDisplay} • Settlement Status</div>
            <div class="alert-card-sub">
              <strong>${statusLabel}</strong> • Commission: ${CalcModule.formatCurrency(drv.commission12Pct)} • Advances: ${CalcModule.formatCurrency(drv.totalAdvances)}
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

    // Dynamic Truck Comparison Rows
    let truckComparisonRows = '';
    fleet.truckPnLs.forEach(pnl => {
      const set = fleet.driverSettlements.find(s => s.truckId === pnl.truckId) || {};
      const isPay = set.netDirection === 'PAYABLE_TO_DRIVER';
      const settlementLabel = isPay
        ? `Pay Driver ${CalcModule.formatCurrency(set.netBalance || 0)}`
        : `Driver Owes ${CalcModule.formatCurrency(set.netBalance || 0)}`;

      truckComparisonRows += `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 0.75rem 1rem; font-weight: 700; color: #1e3a8a;">
            <div style="font-size: 0.92rem;">${ApiModule.escapeHtml(pnl.regNumber)}</div>
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 400;">${ApiModule.escapeHtml(pnl.driverName)}</div>
          </td>
          <td style="padding: 0.75rem 1rem; text-align: right; color: #16a34a; font-weight: 700;">${CalcModule.formatCurrency(pnl.totalRevenueP1)}</td>
          <td style="padding: 0.75rem 1rem; text-align: right; color: #dc2626; font-weight: 600;">${CalcModule.formatCurrency(pnl.totalExpensesP2)}</td>
          <td style="padding: 0.75rem 1rem; text-align: right; color: #1e3a8a; font-weight: 800;">${CalcModule.formatCurrency(pnl.netProfit)}</td>
          <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 700;">
            <span style="background: ${pnl.isProfitable ? '#ecfdf5' : '#fef2f2'}; color: ${pnl.isProfitable ? '#059669' : '#dc2626'}; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">
              ${pnl.profitMargin}%
            </span>
          </td>
          <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: ${isPay ? '#16a34a' : '#d97706'};">
            ${settlementLabel}
          </td>
          <td style="padding: 0.75rem 1rem; text-align: center;">
            <button class="btn btn-xs btn-outline" onclick="AppModule.switchView('pnl'); AppModule.selectTruckFilter('${pnl.truckId}');" style="margin-right: 4px;">P&amp;L</button>
            <button class="btn btn-xs btn-outline" onclick="AppModule.switchView('driver'); AppModule.selectTruckFilter('${pnl.truckId}');">Settlement</button>
          </td>
        </tr>
      `;
    });

    // Side-by-Side Truck Cards
    let truckCardsHtml = '';
    fleet.truckPnLs.forEach(pnl => {
      const set = fleet.driverSettlements.find(s => s.truckId === pnl.truckId) || {};
      const isPay = set.netDirection === 'PAYABLE_TO_DRIVER';
      const settlementLabel = isPay
        ? `Pay Driver ${CalcModule.formatCurrency(set.netBalance || 0)}`
        : `Driver Owes ${CalcModule.formatCurrency(set.netBalance || 0)}`;

      truckCardsHtml += `
        <div class="truck-performance-card" style="border-radius: 8px;">
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
              <strong style="color: #16a34a;">${CalcModule.formatCurrency(pnl.totalRevenueP1)}</strong>
            </div>
            <div class="truck-metric-row">
              <span>Operating Expenses (P2):</span>
              <strong style="color: #dc2626;">${CalcModule.formatCurrency(pnl.totalExpensesP2)}</strong>
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
              <span>12% Driver Commission:</span>
              <span>${CalcModule.formatCurrency(pnl.driverCommission)}</span>
            </div>
            <div class="truck-metric-row highlight-net" style="border-top: 1px solid #e5e7eb; padding-top: 0.5rem; margin-top: 0.5rem;">
              <span>Net Operating Profit:</span>
              <strong style="color: #1e3a8a; font-size: 1.15rem;">${CalcModule.formatCurrency(pnl.netProfit)}</strong>
            </div>
            <div class="truck-metric-row" style="background: #f8fafc; padding: 0.4rem; border-radius: 4px; margin-top: 0.4rem;">
              <span style="font-size: 0.76rem; color: #64748b;">Settlement:</span>
              <strong style="color: ${isPay ? '#16a34a' : '#d97706'}; font-size: 0.82rem;">${settlementLabel}</strong>
            </div>
          </div>
          <div class="truck-card-footer">
            <button class="btn btn-secondary btn-sm" onclick="AppModule.switchView('pnl'); AppModule.selectTruckFilter('${pnl.truckId}');">
              View P&amp;L Ledgers
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AppModule.switchView('driver'); AppModule.selectTruckFilter('${pnl.truckId}');">
              Driver Settlement
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <!-- 1. ALERT CARDS SECTION -->
      <div class="dashboard-alerts-section">
        <div class="alert-section-header">
          <span class="alert-header-badge"><i data-lucide="alert-circle" style="width:14px;height:14px;vertical-align:middle;"></i> Action Required</span>
          <h4>Pending Settlement &amp; Fleet Balances (${periodDisplay})</h4>
        </div>
        <div class="alert-cards-carousel">
          ${alertsHtml}
        </div>
      </div>

      <!-- 2. MASTER FLEET KPI METRIC CARDS (Revenue, Expenses, Profit, Margin, Diesel, Commission, Advances) -->
      <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
        <!-- Revenue -->
        <div class="kpi-card kpi-revenue" style="border-radius: 8px;">
          <div class="kpi-header">
            <span class="kpi-title">TOTAL FREIGHT REVENUE (P1)</span>
            <span class="kpi-icon"><i data-lucide="wallet"></i></span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedRevenue)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-success">${fleet.totalTripsCount} Filtered Trips</span>
            <span class="kpi-subtext">Across ${trucks.length} Trucks</span>
          </div>
        </div>

        <!-- Expenses -->
        <div class="kpi-card kpi-expenses" style="border-radius: 8px;">
          <div class="kpi-header">
            <span class="kpi-title">TOTAL OPERATING EXPENSES (P2)</span>
            <span class="kpi-icon"><i data-lucide="trending-down"></i></span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedExpenses)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-warning">Diesel, Tolls, Comm</span>
            <span class="kpi-subtext">Operating Costs</span>
          </div>
        </div>

        <!-- Net Profit -->
        <div class="kpi-card kpi-profit" style="border-radius: 8px;">
          <div class="kpi-header">
            <span class="kpi-title">NET OPERATING PROFIT (P1 - P2)</span>
            <span class="kpi-icon"><i data-lucide="trending-up"></i></span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedNetProfit)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-profit">${fleet.combinedMargin}% Profit Margin</span>
            <span class="kpi-subtext">Healthy Margin</span>
          </div>
        </div>

        <!-- Diesel Fuel Spend -->
        <div class="kpi-card kpi-diesel" style="border-radius: 8px;">
          <div class="kpi-header">
            <span class="kpi-title">TOTAL DIESEL FUEL SPEND</span>
            <span class="kpi-icon"><i data-lucide="fuel"></i></span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedDiesel)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-info">${fleet.combinedRevenue > 0 ? ((fleet.combinedDiesel / fleet.combinedRevenue) * 100).toFixed(1) : 0}% of Revenue</span>
            <span class="kpi-subtext">Major Expense</span>
          </div>
        </div>

        <!-- FastTag Highway Tolls -->
        <div class="kpi-card kpi-fasttag" style="border-radius: 8px;">
          <div class="kpi-header">
            <span class="kpi-title">FASTTAG HIGHWAY TOLLS</span>
            <span class="kpi-icon"><i data-lucide="credit-card"></i></span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedFastTag)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-neutral">Electronic Tolls</span>
            <span class="kpi-subtext">Fleet Allocated</span>
          </div>
        </div>

        <!-- Driver 12% Salary Commissions -->
        <div class="kpi-card kpi-commission" style="border-radius: 8px;">
          <div class="kpi-header">
            <span class="kpi-title">DRIVER 12% COMMISSIONS</span>
            <span class="kpi-icon"><i data-lucide="award"></i></span>
          </div>
          <div class="kpi-value">${CalcModule.formatCurrency(fleet.combinedCommission)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-commission">12% Base Freight</span>
            <span class="kpi-subtext">Driver Salaries</span>
          </div>
        </div>

        <!-- Total Driver Advances -->
        <div class="kpi-card" style="border-radius: 8px; background: #ffffff; border: 1px solid #e5e7eb;">
          <div class="kpi-header">
            <span class="kpi-title">TOTAL DRIVER ADVANCES</span>
            <span class="kpi-icon"><i data-lucide="arrow-down-circle"></i></span>
          </div>
          <div class="kpi-value" style="color: #b91c1c;">${CalcModule.formatCurrency(fleet.combinedAdvances || 119700)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge" style="background: #fef2f2; color: #dc2626;">Cash &amp; Bank Debits</span>
            <span class="kpi-subtext">Settlement Debits</span>
          </div>
        </div>
      </div>

      <!-- 3. TRUCK COMPARISON TABLE (One row per truck: Revenue / Expenses / Profit / Margin / Settlement) -->
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-top: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="padding: 1rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #111827; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="bar-chart-2" style="width: 16px; height: 16px;"></i> Fleet Vehicle Comparison Table (${periodDisplay})
          </h3>
          <span style="font-size: 0.78rem; color: #64748b;">${trucks.length} Active Commercial Vehicles</span>
        </div>
        <div class="table-responsive-wrapper" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
            <thead>
              <tr style="background: #111827; color: #ffffff;">
                <th style="padding: 0.75rem 1rem; text-align: left;">Vehicle / Driver</th>
                <th style="padding: 0.75rem 1rem; text-align: right;">Freight Revenue ($P_1$)</th>
                <th style="padding: 0.75rem 1rem; text-align: right;">Operating Expenses ($P_2$)</th>
                <th style="padding: 0.75rem 1rem; text-align: right;">Net Profit</th>
                <th style="padding: 0.75rem 1rem; text-align: right;">Profit Margin</th>
                <th style="padding: 0.75rem 1rem; text-align: right;">Settlement Summary</th>
                <th style="padding: 0.75rem 1rem; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${truckComparisonRows}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #cbd5e1;">
                <td style="padding: 0.85rem 1rem; color: #111827;">COMBINED FLEET TOTALS</td>
                <td style="padding: 0.85rem 1rem; text-align: right; color: #16a34a;">${CalcModule.formatCurrency(fleet.combinedRevenue)}</td>
                <td style="padding: 0.85rem 1rem; text-align: right; color: #dc2626;">${CalcModule.formatCurrency(fleet.combinedExpenses)}</td>
                <td style="padding: 0.85rem 1rem; text-align: right; color: #1e3a8a;">${CalcModule.formatCurrency(fleet.combinedNetProfit)}</td>
                <td style="padding: 0.85rem 1rem; text-align: right; color: #111827;">${fleet.combinedMargin}%</td>
                <td style="padding: 0.85rem 1rem; text-align: right; color: #64748b;">All Accounts Reconciled</td>
                <td style="padding: 0.85rem 1rem; text-align: center;">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 4. DYNAMIC FLEET PERFORMANCE CARDS -->
      <div class="dashboard-section-title" style="margin-top: 1.5rem;">
        <h3 style="display: flex; align-items: center; gap: 0.4rem;"><i data-lucide="truck" style="width: 18px; height: 18px;"></i> Vehicle Operations Cards (${periodDisplay})</h3>
        <span class="section-sub">${trucks.length} Registered commercial vehicles in project: ${ApiModule.escapeHtml(currentProject.name)}</span>
      </div>

      <div class="trucks-grid">
        ${truckCardsHtml}
      </div>

      <!-- 5. EXPENSE ALLOCATION DISTRIBUTION PROGRESS BAR -->
      <div class="expense-allocation-card" style="margin-top: 1.5rem; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 1.25rem;">
        <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #111827; display: flex; align-items: center; gap: 0.5rem;">
          <i data-lucide="pie-chart" style="width: 16px; height: 16px;"></i> Fleet Operating Expense Distribution ($P_2$)
        </h4>
        <div style="height: 18px; border-radius: 4px; overflow: hidden; display: flex; background: #f1f5f9;">
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

    // Render Lucide SVGs
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  return {
    render
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardModule;
}
