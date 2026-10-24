/**
 * Fleet Logistics & Financial Accounts Management - Executive Dashboard
 * Renders KPIs, Settlement Alert Cards, Visual Breakdowns, and Truck Comparison
 * Developed by Shravan Kumar • 2026
 */

const DashboardModule = (function () {
  'use strict';

  function render() {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    const fleet = CalculationsModule.calculateCombinedFleet();
    const pnl6666 = fleet.pnl6666;
    const pnl1122 = fleet.pnl1122;
    const drv6666 = fleet.drv6666;
    const drv1122 = fleet.drv1122;

    container.innerHTML = `
      <!-- 1. ALERT CARDS / OUTSTANDING SETTLEMENT BANNER (Matching Screenshot 1 Style) -->
      <div class="dashboard-alerts-section">
        <div class="alert-section-header">
          <span class="alert-header-badge">⚠️ Action Required</span>
          <h4>Pending Settlement & Freight Receivables Alerts</h4>
        </div>
        <div class="alert-cards-carousel">
          <!-- Card 1: Noor Allam Settlement -->
          <div class="alert-card alert-card-payable">
            <div class="alert-card-left">
              <div class="alert-card-meta">
                <span class="alert-lr-badge">TG15T6666</span>
                <span class="alert-truck-badge">Noor Allam</span>
              </div>
              <div class="alert-card-route">01-10-2026 To 20-10-2026 • Driver Settlement</div>
              <div class="alert-card-sub">
                <span>Total Credit: ${CalculationsModule.formatINR(drv6666.totalDriverCredit)}</span> • 
                <span>Advances: ${CalculationsModule.formatINR(drv6666.totalAdvances)}</span>
              </div>
            </div>
            <div class="alert-card-right">
              <div class="alert-amount payable-amount">${CalculationsModule.formatINR(drv6666.netBalance)}</div>
              <button class="btn-alert-action" onclick="AppModule.switchView('driver'); AppModule.selectTruckFilter('TG15T6666');">
                Pay Driver →
              </button>
            </div>
          </div>

          <!-- Card 2: Allam Brother Settlement -->
          <div class="alert-card alert-card-receivable">
            <div class="alert-card-left">
              <div class="alert-card-meta">
                <span class="alert-lr-badge">TS15UE1122</span>
                <span class="alert-truck-badge">Allam Brother</span>
              </div>
              <div class="alert-card-route">04-10-2026 To 20-10-2026 • Driver Settlement</div>
              <div class="alert-card-sub">
                <span>Surplus: ${CalculationsModule.formatINR(drv1122.advanceSurplus)}</span> • 
                <span>Old Bal: ${CalculationsModule.formatINR(drv1122.oldBalance)}</span>
              </div>
            </div>
            <div class="alert-card-right">
              <div class="alert-amount receivable-amount">${CalculationsModule.formatINR(drv1122.netBalance)}</div>
              <button class="btn-alert-action" onclick="AppModule.switchView('driver'); AppModule.selectTruckFilter('TS15UE1122');">
                Collect Balance →
              </button>
            </div>
          </div>

          <!-- Card 3: Freight Balance Trip 6666-02 -->
          <div class="alert-card alert-card-info">
            <div class="alert-card-left">
              <div class="alert-card-meta">
                <span class="alert-lr-badge">TRIP-02</span>
                <span class="alert-truck-badge">AURGANGABAD → HYD</span>
              </div>
              <div class="alert-card-route">HYD LOGISTICS • Freight: ${CalculationsModule.formatINR(108500)}</div>
              <div class="alert-card-sub">Advance: ${CalculationsModule.formatINR(90000)} • Received</div>
            </div>
            <div class="alert-card-right">
              <div class="alert-amount info-amount">${CalculationsModule.formatINR(18500)}</div>
              <button class="btn-alert-action" onclick="AppModule.switchView('pnl');">
                Freight Due →
              </button>
            </div>
          </div>
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
          <div class="kpi-value">${CalculationsModule.formatINR(fleet.combinedRevenue)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-success">7 Active Trips</span>
            <span class="kpi-subtext">October 2026 Fleet Total</span>
          </div>
        </div>

        <!-- Total Expenses -->
        <div class="kpi-card kpi-expenses">
          <div class="kpi-header">
            <span class="kpi-title">OPERATING EXPENSES (P2)</span>
            <span class="kpi-icon">📉</span>
          </div>
          <div class="kpi-value">${CalculationsModule.formatINR(fleet.combinedExpenses)}</div>
          <div class="kpi-footer">
            <span class="kpi-subtext">Diesel, FastTag, AdBlue, Road, Salary</span>
          </div>
        </div>

        <!-- Net Operating Profit -->
        <div class="kpi-card kpi-profit">
          <div class="kpi-header">
            <span class="kpi-title">NET FLEET PROFIT (P1 - P2)</span>
            <span class="kpi-icon">🏆</span>
          </div>
          <div class="kpi-value highlight-profit">${CalculationsModule.formatINR(fleet.combinedNetProfit)}</div>
          <div class="kpi-footer">
            <span class="kpi-badge badge-profit">Margin: ${fleet.combinedMargin}%</span>
            <span class="kpi-subtext">Net Earnings Realized</span>
          </div>
        </div>

        <!-- Total Diesel Spend -->
        <div class="kpi-card kpi-diesel">
          <div class="kpi-header">
            <span class="kpi-title">TOTAL DIESEL LOGS</span>
            <span class="kpi-icon">⛽</span>
          </div>
          <div class="kpi-value">${CalculationsModule.formatINR(fleet.combinedDiesel)}</div>
          <div class="kpi-footer">
            <span class="kpi-subtext">10 Pump Fuel Slips Reconciled</span>
          </div>
        </div>

        <!-- FastTag Tolls -->
        <div class="kpi-card kpi-toll">
          <div class="kpi-header">
            <span class="kpi-title">FASTTAG TOLLS</span>
            <span class="kpi-icon">🛣️</span>
          </div>
          <div class="kpi-value">${CalculationsModule.formatINR(fleet.combinedFastTag)}</div>
          <div class="kpi-footer">
            <span class="kpi-subtext">National Highway Toll Portals</span>
          </div>
        </div>

        <!-- Driver Commissions -->
        <div class="kpi-card kpi-salary">
          <div class="kpi-header">
            <span class="kpi-title">DRIVER 12% COMMISSION</span>
            <span class="kpi-icon">👨‍✈️</span>
          </div>
          <div class="kpi-value">${CalculationsModule.formatINR(fleet.combinedSalary)}</div>
          <div class="kpi-footer">
            <span class="kpi-subtext">Calculated on Base Freight</span>
          </div>
        </div>
      </div>

      <!-- 3. INDIVIDUAL TRUCK PERFORMANCE COMPARISON -->
      <div class="truck-comparison-grid">
        <!-- Truck 1 Card -->
        <div class="truck-card">
          <div class="truck-card-header">
            <div class="truck-id-badge">
              <span class="truck-emoji">🚛</span>
              <div>
                <h3>TG15T6666</h3>
                <span>Driver: Noor Allam</span>
              </div>
            </div>
            <span class="status-pill status-active">Active • 4 Trips</span>
          </div>
          <div class="truck-stats-grid">
            <div class="stat-item">
              <label>Revenue (P1)</label>
              <strong>${CalculationsModule.formatINR(pnl6666.p1Revenue)}</strong>
            </div>
            <div class="stat-item">
              <label>Expenses (P2)</label>
              <strong>${CalculationsModule.formatINR(pnl6666.p2Expenses)}</strong>
            </div>
            <div class="stat-item">
              <label>Net Profit</label>
              <strong class="text-success">${CalculationsModule.formatINR(pnl6666.netProfit)}</strong>
            </div>
            <div class="stat-item">
              <label>Profit Margin</label>
              <strong class="text-primary">${pnl6666.profitMargin}%</strong>
            </div>
          </div>
          <div class="truck-settlement-callout payable">
            <div>
              <span class="callout-label">Driver Settlement:</span>
              <span class="callout-desc">Shankar wants to pay Noor Allam</span>
            </div>
            <div class="callout-val payable">${CalculationsModule.formatINR(drv6666.netBalance)}</div>
          </div>
          <button class="btn btn-secondary btn-block" onclick="AppModule.switchView('pnl'); AppModule.selectTruckFilter('TG15T6666');">
            Inspect TG15T6666 Accounts →
          </button>
        </div>

        <!-- Truck 2 Card -->
        <div class="truck-card">
          <div class="truck-card-header">
            <div class="truck-id-badge">
              <span class="truck-emoji">🚛</span>
              <div>
                <h3>TS15UE1122</h3>
                <span>Driver: Allam Brother (Shankar)</span>
              </div>
            </div>
            <span class="status-pill status-active">Active • 3 Trips</span>
          </div>
          <div class="truck-stats-grid">
            <div class="stat-item">
              <label>Revenue (P1)</label>
              <strong>${CalculationsModule.formatINR(pnl1122.p1Revenue)}</strong>
            </div>
            <div class="stat-item">
              <label>Expenses (P2)</label>
              <strong>${CalculationsModule.formatINR(pnl1122.p2Expenses)}</strong>
            </div>
            <div class="stat-item">
              <label>Net Profit</label>
              <strong class="text-success">${CalculationsModule.formatINR(pnl1122.netProfit)}</strong>
            </div>
            <div class="stat-item">
              <label>Profit Margin</label>
              <strong class="text-primary">${pnl1122.profitMargin}%</strong>
            </div>
          </div>
          <div class="truck-settlement-callout receivable">
            <div>
              <span class="callout-label">Driver Settlement:</span>
              <span class="callout-desc">Allam wants to pay Shankar</span>
            </div>
            <div class="callout-val receivable">${CalculationsModule.formatINR(drv1122.netBalance)}</div>
          </div>
          <button class="btn btn-secondary btn-block" onclick="AppModule.switchView('pnl'); AppModule.selectTruckFilter('TS15UE1122');">
            Inspect TS15UE1122 Accounts →
          </button>
        </div>
      </div>

      <!-- 4. OPERATING EXPENSE BREAKDOWN VISUALIZATION -->
      <div class="expense-breakdown-card">
        <div class="card-header-styled">
          <h4>📊 Operating Expense Allocation (Total: ${CalculationsModule.formatINR(fleet.combinedExpenses)})</h4>
          <span class="badge-sub">Cost Efficiency Analysis</span>
        </div>
        <div class="breakdown-bar-container">
          <div class="bar-segment diesel" style="width: 53.4%;" title="Diesel: ₹2,35,600 (53.4%)"></div>
          <div class="bar-segment toll" style="width: 14.7%;" title="FastTag Tolls: ₹65,000 (14.7%)"></div>
          <div class="bar-segment salary" style="width: 14.7%;" title="Driver Salaries: ₹64,620 (14.7%)"></div>
          <div class="bar-segment road" style="width: 9.2%;" title="Road Expenses & RTA: ₹40,525 (9.2%)"></div>
          <div class="bar-segment addblue" style="width: 8.0%;" title="AdBlue & Others: ₹35,000 (8.0%)"></div>
        </div>
        <div class="breakdown-legend">
          <div class="legend-item"><span class="dot diesel"></span> Diesel (53.4% • ₹2,35,600)</div>
          <div class="legend-item"><span class="dot toll"></span> FastTag (14.7% • ₹65,000)</div>
          <div class="legend-item"><span class="dot salary"></span> Driver Salary (14.7% • ₹64,620)</div>
          <div class="legend-item"><span class="dot road"></span> Road / Police / RTA (9.2% • ₹40,525)</div>
          <div class="legend-item"><span class="dot addblue"></span> AdBlue & Exp (8.0% • ₹35,000)</div>
        </div>
      </div>
    `;
  }

  return {
    render
  };
})();

if (typeof window !== 'undefined') {
  window.DashboardModule = DashboardModule;
}
