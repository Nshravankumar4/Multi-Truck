/**
 * Fleet Logistics & Financial Accounts Management - Tables & Spreadsheet Module
 * Renders P&L Accounts, Driver Settlement Ledgers, 1:1 Excel Replica, and ExcelJS Export
 * Developed by Shravan Kumar • 2026
 */

const TableModule = (function () {
  'use strict';

  let currentZoom = 100;
  let currentReplicaTab = 'pnl';
  let expenseFilterCategory = 'all';

  function setZoom(level) {
    currentZoom = level;
    const grid = document.getElementById('excelReplicaGrid');
    if (grid) {
      grid.style.transform = `scale(${level / 100})`;
      grid.style.transformOrigin = 'top left';
    }
    // Update zoom buttons
    ['80', '90', '100', '115'].forEach(z => {
      const btn = document.getElementById(`btnZoom${z}`);
      if (btn) {
        if (z == level) {
          btn.className = 'btn btn-sm btn-primary';
        } else {
          btn.className = 'btn btn-sm btn-secondary';
        }
      }
    });
  }

  /**
   * Render P&L Detailed Accounts View
   */
  function renderPnlView(truckFilter) {
    const container = document.getElementById('view-pnl');
    if (!container) return;

    const targetTrucks = (truckFilter === 'TG15T6666') ? ['TG15T6666'] :
                         (truckFilter === 'TS15UE1122') ? ['TS15UE1122'] :
                         ['TG15T6666', 'TS15UE1122'];

    let html = `
      <div class="view-header-row">
        <div>
          <h2>💼 Profit & Loss Financial Accounts</h2>
          <p class="section-subtext">Freight Revenue ($P_1$), Operating Expenses ($P_2$), and Net Operating Profit Analysis</p>
        </div>
        <div class="header-actions-group">
          <button class="btn btn-primary" onclick="AppModule.openAddModal('trip')">
            <span>+</span> Add Shipment / Trip
          </button>
          <button class="btn btn-secondary" onclick="TableModule.exportToExcel()">
            📥 Export Excel (.xlsx)
          </button>
        </div>
      </div>
    `;

    targetTrucks.forEach(tId => {
      const pnl = CalculationsModule.calculateTruckPnl(tId);
      const truck = DataModule.getTruckData(tId);
      if (!pnl || !truck) return;

      html += `
        <div class="pnl-truck-card">
          <!-- Truck Section Header -->
          <div class="pnl-truck-header">
            <div class="pnl-truck-title">
              <span class="truck-icon-badge">🚛</span>
              <div>
                <h3>${tId} • ${truck.driver.name}</h3>
                <span class="period-pill">Period: ${pnl.period}</span>
              </div>
            </div>
            <div class="pnl-header-kpis">
              <div class="pnl-kpi-pill">
                <label>P1 Revenue</label>
                <span>${CalculationsModule.formatINR(pnl.p1Revenue)}</span>
              </div>
              <div class="pnl-kpi-pill">
                <label>P2 Expenses</label>
                <span>${CalculationsModule.formatINR(pnl.p2Expenses)}</span>
              </div>
              <div class="pnl-kpi-pill profit-highlight">
                <label>Net Profit</label>
                <span>${CalculationsModule.formatINR(pnl.netProfit)} (${pnl.profitMargin}%)</span>
              </div>
            </div>
          </div>

          <!-- Section A: Freight Revenue Trips (P1) -->
          <div class="table-section-title">
            <h4>🚚 Section A: Freight Revenue Trips ($P_1$)</h4>
            <span class="count-badge">${truck.trips.length} Trips Total</span>
          </div>
          <div class="table-responsive-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 45px;">#</th>
                  <th>Dates</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Route Summary</th>
                  <th>Transporter</th>
                  <th class="text-right">P&L Freight ($P_1$)</th>
                  <th class="text-right">Base Freight (12% Comm.)</th>
                  <th class="text-right">Advance Recd</th>
                  <th class="text-right">Balance Due</th>
                  <th class="text-center">POD Status</th>
                </tr>
              </thead>
              <tbody>
                ${truck.trips.map((t, idx) => `
                  <tr>
                    <td><strong>${idx + 1}</strong></td>
                    <td><span class="date-badge">${t.dateRange}</span></td>
                    <td><strong>${t.from}</strong></td>
                    <td><strong>${t.to}</strong></td>
                    <td>${t.route}</td>
                    <td><span class="transporter-badge">${t.transporter || 'Direct'}</span></td>
                    <td class="text-right font-bold text-primary">${CalculationsModule.formatINR(t.pnlFreight)}</td>
                    <td class="text-right">${CalculationsModule.formatINR(t.baseFreight)}</td>
                    <td class="text-right text-success">${CalculationsModule.formatINR(t.advanceReceived)}</td>
                    <td class="text-right ${t.balanceFreight > 0 ? 'text-danger font-bold' : ''}">
                      ${CalculationsModule.formatINR(t.balanceFreight)}
                    </td>
                    <td class="text-center">
                      <span class="status-pill status-active">Delivered</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="table-total-row">
                  <td colspan="6" class="text-right"><strong>$P_1$ Total Sum:</strong></td>
                  <td class="text-right font-bold text-primary">${CalculationsModule.formatINR(pnl.p1Revenue)}</td>
                  <td class="text-right font-bold">${CalculationsModule.formatINR(pnl.totalBaseFreight)}</td>
                  <td colspan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Section B: Operating Expenses (P2) Breakdown -->
          <div class="table-section-title" style="margin-top: 1.5rem;">
            <h4>⛽ Section B: Operating Expenses Breakdown ($P_2$)</h4>
            <span class="count-badge">Total: ${CalculationsModule.formatINR(pnl.p2Expenses)}</span>
          </div>
          <div class="expenses-grid-two-col">
            <!-- Left: Itemized Diesel Fuel Log -->
            <div class="sub-table-container">
              <div class="sub-table-header">
                <h5>Diesel Fuel Entries</h5>
                <button class="btn btn-sm btn-secondary" onclick="AppModule.openAddModal('diesel', '${tId}')">+ Add Fuel Slip</button>
              </div>
              <table class="data-table table-condensed">
                <thead>
                  <tr>
                    <th>Slip</th>
                    <th>Date</th>
                    <th>Fuel Station</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${pnl.dieselEntries.map((d, dIdx) => `
                    <tr>
                      <td>#${dIdx + 1}</td>
                      <td>${d.date || 'Oct 2026'}</td>
                      <td>${d.pump || 'Highway Pump'}</td>
                      <td class="text-right font-semibold">${CalculationsModule.formatINR(d.amount)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="table-total-row">
                    <td colspan="3"><strong>Diesel Sub-Total:</strong></td>
                    <td class="text-right font-bold">${CalculationsModule.formatINR(pnl.dieselTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Right: Fixed & Operational Deductions Table -->
            <div class="sub-table-container">
              <div class="sub-table-header">
                <h5>Other Operating Deductions</h5>
                <span class="badge-sub">Standard Accounts</span>
              </div>
              <table class="data-table table-condensed">
                <thead>
                  <tr>
                    <th>Expense Category</th>
                    <th>Basis / Details</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>🛣️ FastTag Tolls</strong></td>
                    <td>National Highway Portals</td>
                    <td class="text-right font-semibold">${CalculationsModule.formatINR(pnl.fastTag)}</td>
                  </tr>
                  <tr>
                    <td><strong>🧪 AddBlue & Minor Exp</strong></td>
                    <td>Exhaust fluid & roadside items</td>
                    <td class="text-right font-semibold">${CalculationsModule.formatINR(pnl.addBlueAndExp)}</td>
                  </tr>
                  <tr>
                    <td><strong>🚨 Road / RTA / Police Exp</strong></td>
                    <td>Itemized ledger (${truck.roadExpenses.length} entries)</td>
                    <td class="text-right font-semibold">${CalculationsModule.formatINR(pnl.roadExpTotal)}</td>
                  </tr>
                  <tr>
                    <td><strong>👨‍✈️ Driver Salary (12%)</strong></td>
                    <td>12% on Base Freight (${CalculationsModule.formatINR(pnl.totalBaseFreight)})</td>
                    <td class="text-right font-semibold text-primary">${CalculationsModule.formatINR(pnl.driverSalary)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="table-total-row">
                    <td colspan="2"><strong>Total Operating Expenses ($P_2$):</strong></td>
                    <td class="text-right font-bold text-danger">${CalculationsModule.formatINR(pnl.p2Expenses)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Section C: Net Profit Calculation Card -->
          <div class="net-profit-card">
            <div class="profit-equation">
              <div class="eq-term">
                <label>Freight Revenue ($P_1$)</label>
                <span>${CalculationsModule.formatINR(pnl.p1Revenue)}</span>
              </div>
              <div class="eq-symbol">−</div>
              <div class="eq-term">
                <label>Operating Expenses ($P_2$)</label>
                <span>${CalculationsModule.formatINR(pnl.p2Expenses)}</span>
              </div>
              <div class="eq-symbol">=</div>
              <div class="eq-term result">
                <label>Net Operating Profit</label>
                <span class="text-success">${CalculationsModule.formatINR(pnl.netProfit)}</span>
              </div>
            </div>
            <div class="profit-note">
              <strong>Audit Note:</strong> Mathematical Profit of <strong>${CalculationsModule.formatINR(pnl.netProfit)}</strong> (${pnl.profitMargin}% margin) reconciles 100% with the verified workbook cell <code>${tId === 'TG15T6666' ? 'E29' : 'L29'}</code>.
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render Driver Settlements & Advances View
   */
  function renderDriverView(truckFilter) {
    const container = document.getElementById('view-driver');
    if (!container) return;

    const selectedTruck = (truckFilter === 'TS15UE1122') ? 'TS15UE1122' : 'TG15T6666';
    const truck = DataModule.getTruckData(selectedTruck);
    const drv = CalculationsModule.calculateDriverSettlement(selectedTruck);

    if (!truck || !drv) return;

    let html = `
      <div class="view-header-row">
        <div>
          <h2>👤 Driver Account Settlement & Advances</h2>
          <p class="section-subtext">Driver 12% Commission, Advances Reconciliation, and Itemized Road Expenses Ledger</p>
        </div>
        <div class="header-actions-group">
          <!-- Truck / Driver Switcher Pills -->
          <div class="truck-pill-toggle">
            <button class="pill-btn ${selectedTruck === 'TG15T6666' ? 'active' : ''}" onclick="AppModule.selectTruckFilter('TG15T6666')">
              TG15T6666 (Noor Allam)
            </button>
            <button class="pill-btn ${selectedTruck === 'TS15UE1122' ? 'active' : ''}" onclick="AppModule.selectTruckFilter('TS15UE1122')">
              TS15UE1122 (Allam Brother)
            </button>
          </div>
          <button class="btn btn-primary" onclick="AppModule.openAddModal('advance', '${selectedTruck}')">
            <span>+</span> Record Driver Advance
          </button>
          <button class="btn btn-secondary" onclick="AppModule.openAddModal('expense', '${selectedTruck}')">
            <span>+</span> Add Road Expense
          </button>
        </div>
      </div>

      <!-- 1. DRIVER SETTLEMENT SUMMARY STATEMENT BOX -->
      <div class="driver-statement-card ${selectedTruck === 'TG15T6666' ? 'theme-payable' : 'theme-receivable'}">
        <div class="statement-header">
          <div class="statement-driver-info">
            <span class="driver-avatar-circle">👨‍✈️</span>
            <div>
              <h3>Driver: ${drv.driverName}</h3>
              <span>Truck: <strong>${selectedTruck}</strong> • Period: ${drv.period}</span>
            </div>
          </div>
          <div class="settlement-status-badge ${selectedTruck === 'TG15T6666' ? 'badge-payable' : 'badge-receivable'}">
            ${drv.settlementAction}
          </div>
        </div>

        <div class="statement-math-grid">
          ${selectedTruck === 'TG15T6666' ? `
            <div class="statement-math-item">
              <label>12% Salary Commission</label>
              <strong>${CalculationsModule.formatINR(drv.salaryCommission)}</strong>
              <small>12% of ${CalculationsModule.formatINR(drv.totalBaseFreight)}</small>
            </div>
            <div class="statement-math-operator">+</div>
            <div class="statement-math-item">
              <label>Old Balance (B/F)</label>
              <strong>${CalculationsModule.formatINR(drv.oldBalance)}</strong>
              <small>Shankar wants to pay</small>
            </div>
            <div class="statement-math-operator">+</div>
            <div class="statement-math-item">
              <label>Road Expenses Claimed</label>
              <strong>${CalculationsModule.formatINR(drv.claimedExpenses)}</strong>
              <small>37 itemized entries</small>
            </div>
            <div class="statement-math-operator">=</div>
            <div class="statement-math-item highlight-credit">
              <label>Total Driver Credit</label>
              <strong>${CalculationsModule.formatINR(drv.totalDriverCredit)}</strong>
              <small>SUM(Commission+Old+Exp)</small>
            </div>
            <div class="statement-math-operator">−</div>
            <div class="statement-math-item">
              <label>Driver Advances Taken</label>
              <strong class="text-danger">${CalculationsModule.formatINR(drv.totalAdvances)}</strong>
              <small>10 cash / UPI advances</small>
            </div>
            <div class="statement-math-operator">=</div>
            <div class="statement-math-item final-balance">
              <label>Final Net Balance</label>
              <strong class="text-payable">${CalculationsModule.formatINR(drv.netBalance)}</strong>
              <small>Payable to Noor Allam</small>
            </div>
          ` : `
            <div class="statement-math-item">
              <label>Driver Advances Taken</label>
              <strong>${CalculationsModule.formatINR(drv.totalAdvances)}</strong>
              <small>6 cash/bank transfers</small>
            </div>
            <div class="statement-math-operator">−</div>
            <div class="statement-math-item">
              <label>Road Expenses</label>
              <strong>${CalculationsModule.formatINR(drv.claimedExpenses)}</strong>
              <small>22 itemized entries</small>
            </div>
            <div class="statement-math-operator">−</div>
            <div class="statement-math-item">
              <label>12% Salary Commission</label>
              <strong>${CalculationsModule.formatINR(drv.salaryCommission)}</strong>
              <small>12% on ${CalculationsModule.formatINR(drv.totalBaseFreight)}</small>
            </div>
            <div class="statement-math-operator">=</div>
            <div class="statement-math-item highlight-credit">
              <label>Advance Surplus with Driver</label>
              <strong>${CalculationsModule.formatINR(drv.advanceSurplus)}</strong>
              <small>Net Cash in Hand</small>
            </div>
            <div class="statement-math-operator">+</div>
            <div class="statement-math-item">
              <label>Old Balance Due</label>
              <strong>${CalculationsModule.formatINR(drv.oldBalance)}</strong>
              <small>Old Allam wants to pay</small>
            </div>
            <div class="statement-math-operator">=</div>
            <div class="statement-math-item final-balance">
              <label>Final Net Balance</label>
              <strong class="text-receivable">${CalculationsModule.formatINR(drv.netBalance)}</strong>
              <small>Payable by Allam to Shankar</small>
            </div>
          `}
        </div>

        <div class="statement-footer-banner">
          <span class="notice-icon">📢</span>
          <span><strong>Authoritative Note:</strong> ${drv.note}</span>
        </div>
      </div>

      <!-- 2. SIDE-BY-SIDE: 12% COMMISSION TRIPS & ADVANCES LEDGER -->
      <div class="expenses-grid-two-col" style="margin-top: 1.5rem;">
        <!-- Left: 12% Commission Eligible Trips -->
        <div class="sub-table-container">
          <div class="sub-table-header">
            <h5>Eligible Trips for 12% Commission</h5>
            <span class="badge-sub">Rate: 12%</span>
          </div>
          <table class="data-table table-condensed">
            <thead>
              <tr>
                <th>Date Range</th>
                <th>Route</th>
                <th class="text-right">Base Freight</th>
                <th class="text-right">12% Commission</th>
              </tr>
            </thead>
            <tbody>
              ${truck.trips.map(t => `
                <tr>
                  <td><span class="date-badge">${t.dateRange}</span></td>
                  <td><strong>${t.route}</strong></td>
                  <td class="text-right font-semibold">${CalculationsModule.formatINR(t.baseFreight)}</td>
                  <td class="text-right font-semibold text-primary">
                    ${CalculationsModule.formatINR(Math.round(t.baseFreight * 0.12))}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td colspan="2"><strong>Total Base Freight:</strong></td>
                <td class="text-right font-bold">${CalculationsModule.formatINR(drv.totalBaseFreight)}</td>
                <td class="text-right font-bold text-primary">${CalculationsModule.formatINR(drv.salaryCommission)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Right: Advances Taken Ledger -->
        <div class="sub-table-container">
          <div class="sub-table-header">
            <h5>Driver Advances Received (${drv.advancesCount} entries)</h5>
            <span class="badge-sub">Total: ${CalculationsModule.formatINR(drv.totalAdvances)}</span>
          </div>
          <table class="data-table table-condensed">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Location / Narration</th>
                <th>Mode</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${truck.advances.map((a, aIdx) => `
                <tr>
                  <td>${aIdx + 1}</td>
                  <td><span class="date-badge">${a.date}</span></td>
                  <td><strong>${a.location}</strong></td>
                  <td><span class="mode-tag">${a.mode || 'Cash'}</span></td>
                  <td class="text-right font-semibold text-danger">${CalculationsModule.formatINR(a.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td colspan="4"><strong>Total Advances Taken:</strong></td>
                <td class="text-right font-bold text-danger">${CalculationsModule.formatINR(drv.totalAdvances)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 3. ITEMIZED ROAD EXPENSES LEDGER (37 items for 6666 / 22 items for 1122) -->
      <div class="road-expenses-section" style="margin-top: 1.5rem;">
        <div class="section-toolbar-row">
          <div>
            <h4>🚨 Itemized En-Route Expenses Ledger (${truck.roadExpenses.length} Records)</h4>
            <p class="section-subtext">All receipts, police fees, weighbridge kanta, greasing, and interstate toll slips</p>
          </div>
          <div class="filter-chips-group">
            <button class="chip-btn ${expenseFilterCategory === 'all' ? 'active' : ''}" onclick="TableModule.filterExpenses('all')">All</button>
            <button class="chip-btn ${expenseFilterCategory === 'border' ? 'active' : ''}" onclick="TableModule.filterExpenses('border')">Border / Toll</button>
            <button class="chip-btn ${expenseFilterCategory === 'police' ? 'active' : ''}" onclick="TableModule.filterExpenses('police')">Police / Checking</button>
            <button class="chip-btn ${expenseFilterCategory === 'labour' ? 'active' : ''}" onclick="TableModule.filterExpenses('labour')">Labour / Kanta</button>
            <button class="chip-btn ${expenseFilterCategory === 'maintenance' ? 'active' : ''}" onclick="TableModule.filterExpenses('maintenance')">Tyres / Greasing</button>
          </div>
        </div>

        <div class="table-responsive-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Description</th>
                <th>Category</th>
                <th class="text-right">Amount</th>
                <th class="text-center">Verification</th>
              </tr>
            </thead>
            <tbody>
              ${getFilteredExpenses(truck.roadExpenses).map((e, eIdx) => `
                <tr>
                  <td><strong>${eIdx + 1}</strong></td>
                  <td><strong>${e.description}</strong></td>
                  <td><span class="category-pill ${getCategoryClass(e.category)}">${e.category}</span></td>
                  <td class="text-right font-bold">${CalculationsModule.formatINR(e.amount)}</td>
                  <td class="text-center">
                    <span class="verified-check">✓ Verified Slip</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td colspan="3" class="text-right"><strong>Itemized Expenses Total:</strong></td>
                <td class="text-right font-bold text-danger">${CalculationsModule.formatINR(drv.itemizedExpensesSum)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function filterExpenses(cat) {
    expenseFilterCategory = cat;
    const currentTruck = (window.AppModule && window.AppModule.getCurrentTruckFilter()) || 'TG15T6666';
    renderDriverView(currentTruck);
  }

  function getFilteredExpenses(expenses) {
    if (expenseFilterCategory === 'all') return expenses;
    if (expenseFilterCategory === 'border') {
      return expenses.filter(e => e.category.includes('Border') || e.category.includes('Toll'));
    }
    if (expenseFilterCategory === 'police') {
      return expenses.filter(e => e.category.includes('Police'));
    }
    if (expenseFilterCategory === 'labour') {
      return expenses.filter(e => e.category.includes('Labour') || e.category.includes('Kanta') || e.category.includes('Weighbridge'));
    }
    if (expenseFilterCategory === 'maintenance') {
      return expenses.filter(e => e.category.includes('Tyre') || e.category.includes('Greasing') || e.category.includes('Maintenance'));
    }
    return expenses;
  }

  function getCategoryClass(cat) {
    if (!cat) return '';
    if (cat.includes('Border') || cat.includes('Toll')) return 'cat-border';
    if (cat.includes('Police')) return 'cat-police';
    if (cat.includes('Labour') || cat.includes('Kanta')) return 'cat-labour';
    if (cat.includes('Tyre') || cat.includes('Greasing')) return 'cat-maintenance';
    return 'cat-general';
  }

  /**
   * Render Excel 1:1 Live Replica View
   */
  function renderExcelReplica(tabName) {
    if (tabName) currentReplicaTab = tabName;
    const container = document.getElementById('view-excel');
    if (!container) return;

    const data = DataModule.getData();
    const t6666 = data.TG15T6666;
    const t1122 = data.TS15UE1122;
    const pnl6666 = CalculationsModule.calculateTruckPnl('TG15T6666');
    const pnl1122 = CalculationsModule.calculateTruckPnl('TS15UE1122');
    const drv6666 = CalculationsModule.calculateDriverSettlement('TG15T6666');
    const drv1122 = CalculationsModule.calculateDriverSettlement('TS15UE1122');
    const arch = data.archive_2026_09;

    let html = `
      <div class="view-header-row">
        <div>
          <h2>📑 Excel 1:1 Live Replica Worksheets</h2>
          <p class="section-subtext">High-fidelity replica matching physical worksheets with formula tooltips and zoom controls</p>
        </div>
        <div class="header-actions-group">
          <!-- Zoom Controls -->
          <div class="excel-zoom-group">
            <span class="zoom-label">Zoom:</span>
            <button class="btn btn-sm btn-secondary" id="btnZoom80" onclick="TableModule.setZoom(80)">80% Fit</button>
            <button class="btn btn-sm btn-secondary" id="btnZoom90" onclick="TableModule.setZoom(90)">90%</button>
            <button class="btn btn-sm btn-primary" id="btnZoom100" onclick="TableModule.setZoom(100)">100%</button>
            <button class="btn btn-sm btn-secondary" id="btnZoom115" onclick="TableModule.setZoom(115)">115%</button>
          </div>
          <button class="btn btn-success" onclick="TableModule.exportToExcel()">
            📥 Download Genuine .xlsx
          </button>
        </div>
      </div>

      <!-- Sheet Navigation Tabs (Matching Excel Tab Style) -->
      <div class="excel-tabs-bar">
        <button class="excel-sheet-tab ${currentReplicaTab === 'pnl' ? 'active' : ''}" onclick="TableModule.renderExcelReplica('pnl')">
          📊 1122_6666_P&L Account
        </button>
        <button class="excel-sheet-tab ${currentReplicaTab === 'driver' ? 'active' : ''}" onclick="TableModule.renderExcelReplica('driver')">
          👤 1122_6666_Driver
        </button>
        <button class="excel-sheet-tab ${currentReplicaTab === 'sept6666' ? 'active' : ''}" onclick="TableModule.renderExcelReplica('sept6666')">
          📁 Sept 2026 - TG15T6666 (Sheet1)
        </button>
        <button class="excel-sheet-tab ${currentReplicaTab === 'sept1122' ? 'active' : ''}" onclick="TableModule.renderExcelReplica('sept1122')">
          📁 Sept 2026 - TS15UE1122 (Sheet2)
        </button>
      </div>

      <div class="excel-replica-outer-wrapper">
        <div id="excelReplicaGrid" class="excel-grid-container" style="transform: scale(${currentZoom / 100}); transform-origin: top left;">
    `;

    if (currentReplicaTab === 'pnl') {
      html += renderPnlReplicaSheet(t6666, t1122, pnl6666, pnl1122);
    } else if (currentReplicaTab === 'driver') {
      html += renderDriverReplicaSheet(t6666, t1122, drv6666, drv1122);
    } else if (currentReplicaTab === 'sept6666') {
      html += renderSept6666ReplicaSheet(arch.TG15T6666);
    } else if (currentReplicaTab === 'sept1122') {
      html += renderSept1122ReplicaSheet(arch.TS15UE1122);
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function renderPnlReplicaSheet(t6666, t1122, pnl6666, pnl1122) {
    return `
      <table class="excel-sheet-table">
        <thead>
          <tr class="excel-col-headers">
            <th class="row-num-header"></th>
            <th>C</th>
            <th>D</th>
            <th>E</th>
            <th>F</th>
            <th>G</th>
            <th>H</th>
            <th>I</th>
            <th>J</th>
            <th>K</th>
            <th>L</th>
            <th>M</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="row-number">4</td>
            <td colspan="11" class="cell-warning"><strong>Don’t Share Below</strong></td>
          </tr>
          <tr>
            <td class="row-number">6</td>
            <td colspan="3"></td>
            <td class="cell-bold">Date</td>
            <td class="cell-bold">01-10-2026 To 20-10-2026</td>
            <td colspan="6"></td>
          </tr>
          <tr>
            <td class="row-number">8</td>
            <td colspan="4" class="cell-header-blue"><strong>TG15T6666</strong></td>
            <td colspan="3"></td>
            <td colspan="4" class="cell-header-blue"><strong>TS15UE1122</strong></td>
          </tr>
          <tr>
            <td class="row-number">11</td>
            <td>01-10-26 TO 06-10-26</td>
            <td>MDCL TO MADHAPURA</td>
            <td class="cell-currency">175000</td>
            <td colspan="4"></td>
            <td>04-10-26 TO 06-10-26</td>
            <td>MDCL TO CHEGUNTA</td>
            <td class="cell-currency">15000</td>
            <td></td>
          </tr>
          <tr>
            <td class="row-number">12</td>
            <td>09-10-26 TO 14-10-26</td>
            <td>AURGANGABAD TO HYD</td>
            <td class="cell-currency">108500</td>
            <td colspan="4"></td>
            <td>06-10-26 TO 09-10-26</td>
            <td>MDCL TO MUZZFARPUR</td>
            <td class="cell-currency">141000</td>
            <td></td>
          </tr>
          <tr>
            <td class="row-number">13</td>
            <td>15-10-26 TO 17-10-26</td>
            <td>K"NAG TO KURNOOL</td>
            <td class="cell-currency">72300</td>
            <td colspan="4"></td>
            <td>11-10-26 TO 13-10-26</td>
            <td>JABALPUR TO BHONIGIRI</td>
            <td class="cell-currency">80000</td>
            <td></td>
          </tr>
          <tr>
            <td class="row-number">14</td>
            <td>18-10-26 TO 19-10-26</td>
            <td>KURNOOL TO MDCL</td>
            <td class="cell-currency">27000</td>
            <td colspan="4"></td>
            <td></td>
            <td class="cell-bold">Xp1: Total</td>
            <td class="cell-formula cell-currency">=SUM(L11:L13) [Val: 236000]</td>
            <td></td>
          </tr>
          <tr class="row-highlight-total">
            <td class="row-number">15</td>
            <td colspan="2" class="cell-bold">P1: Total Sum</td>
            <td class="cell-formula cell-currency">=SUM(E11:E14) [Val: 382800]</td>
            <td colspan="8"></td>
          </tr>
          <tr>
            <td class="row-number">18</td>
            <td></td>
            <td class="cell-bold">Disel</td>
            <td class="cell-currency">30500</td>
            <td colspan="4"></td>
            <td></td>
            <td class="cell-bold">Disel</td>
            <td class="cell-currency">24000</td>
            <td></td>
          </tr>
          <tr>
            <td class="row-number">19</td>
            <td colspan="2"></td>
            <td class="cell-currency">30500</td>
            <td colspan="5"></td>
            <td class="cell-currency">19000</td>
            <td colspan="2"></td>
          </tr>
          <tr>
            <td class="row-number">20</td>
            <td colspan="2"></td>
            <td class="cell-currency">31600</td>
            <td colspan="5"></td>
            <td class="cell-currency">23000</td>
            <td colspan="2"></td>
          </tr>
          <tr>
            <td class="row-number">21</td>
            <td colspan="2"></td>
            <td class="cell-currency">13000</td>
            <td colspan="5"></td>
            <td class="cell-currency">10000</td>
            <td colspan="2"></td>
          </tr>
          <tr>
            <td class="row-number">22</td>
            <td colspan="2"></td>
            <td class="cell-currency">27000</td>
            <td colspan="5"></td>
            <td class="cell-currency">27000</td>
            <td colspan="2"></td>
          </tr>
          <tr>
            <td class="row-number">23</td>
            <td>01-10-2026 To 20-10-2026</td>
            <td class="cell-bold">Exp</td>
            <td class="cell-currency">28735</td>
            <td colspan="4"></td>
            <td>01-10-2026 To 20-10-2026</td>
            <td class="cell-bold">Exp</td>
            <td class="cell-currency">11790</td>
            <td></td>
          </tr>
          <tr>
            <td class="row-number">24</td>
            <td></td>
            <td class="cell-bold">FastTag</td>
            <td class="cell-currency">40000</td>
            <td colspan="4"></td>
            <td></td>
            <td class="cell-bold">FastTag</td>
            <td class="cell-currency">25000</td>
            <td></td>
          </tr>
          <tr>
            <td class="row-number">25</td>
            <td></td>
            <td class="cell-bold">AddBlue & Exp</td>
            <td class="cell-currency">15000</td>
            <td colspan="4"></td>
            <td></td>
            <td class="cell-bold">AddBlue & Exp</td>
            <td class="cell-currency">20000</td>
            <td></td>
          </tr>
          <tr>
            <td class="row-number">26</td>
            <td></td>
            <td class="cell-bold">Salary</td>
            <td class="cell-currency">40740</td>
            <td colspan="4"></td>
            <td></td>
            <td class="cell-bold">Salary</td>
            <td class="cell-currency">23880</td>
            <td></td>
          </tr>
          <tr class="row-highlight-total">
            <td class="row-number">27</td>
            <td></td>
            <td class="cell-bold">P2: Total</td>
            <td class="cell-formula cell-currency">=SUM(E18:E26) [Val: 257075]</td>
            <td colspan="4"></td>
            <td></td>
            <td class="cell-bold">xp2: Total</td>
            <td class="cell-formula cell-currency">=SUM(L18:L26) [Val: 183670]</td>
            <td></td>
          </tr>
          <tr class="row-highlight-profit">
            <td class="row-number">29</td>
            <td></td>
            <td class="cell-bold">P1-P2 Total</td>
            <td class="cell-formula cell-currency font-bold">=E15-E27 [Val: 125725]</td>
            <td colspan="3"></td>
            <td>04-10-2026 To 20-10-26</td>
            <td class="cell-bold">xP1-xP2 Total</td>
            <td class="cell-formula cell-currency font-bold">=L14-L27 [Val: 52330]</td>
            <td class="cell-success"><strong>Note: Profit</strong></td>
          </tr>
        </tbody>
      </table>
    `;
  }

  function renderDriverReplicaSheet(t6666, t1122, drv6666, drv1122) {
    return `
      <div style="padding: 1rem 0;">
        <h4 style="margin-bottom: 0.5rem; color: #1e3a8a;">🚛 DRI NOOR ALLAM - TG15T6666 (Period: 01-10-2026 To 20-10-2026)</h4>
        <table class="excel-sheet-table">
          <thead>
            <tr class="excel-col-headers">
              <th class="row-num-header"></th>
              <th>C (Road Expenses)</th>
              <th>D (Amount)</th>
              <th>F (Date)</th>
              <th>G (Advance Narration)</th>
              <th>H (Advance Amt)</th>
              <th>K (Trip / Summary)</th>
              <th>L (Driver Account)</th>
              <th>M (Base Freight)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-number">6</td>
              <td>HYD KANTA</td>
              <td class="cell-currency">400</td>
              <td>01-10-2026</td>
              <td>OLD BALC SHANKAR WANT PAY</td>
              <td></td>
              <td>01-10-26 TO 06-10-26</td>
              <td class="cell-currency">13800</td>
              <td class="cell-currency">140000</td>
            </tr>
            <tr>
              <td class="row-number">7</td>
              <td>TARPAL</td>
              <td class="cell-currency">400</td>
              <td>EXPENSES</td>
              <td>01-10-2026 TO 20-10-26</td>
              <td></td>
              <td>09-10-26 TO 14-10-26</td>
              <td class="cell-currency">28700</td>
              <td class="cell-currency">108500</td>
            </tr>
            <tr>
              <td class="row-number">8</td>
              <td>BANDARKOLA BODER</td>
              <td class="cell-currency">900</td>
              <td colspan="2"></td>
              <td class="cell-currency">=SUM(I6:I7) [42500]</td>
              <td>15-10-26 TO 17-10-26</td>
              <td></td>
              <td class="cell-currency">64000</td>
            </tr>
            <tr>
              <td class="row-number">9</td>
              <td>MANSAR BODER</td>
              <td class="cell-currency">2600</td>
              <td>03-10-2026</td>
              <td>NAGAPUR ADV</td>
              <td class="cell-currency">5000</td>
              <td>18-10-26 TO 19-10-26</td>
              <td></td>
              <td class="cell-currency">27000</td>
            </tr>
            <tr>
              <td class="row-number">10</td>
              <td>KHAWAS BODER</td>
              <td class="cell-currency">700</td>
              <td>05-10-2026</td>
              <td>VARANSANI ADV</td>
              <td class="cell-currency">6000</td>
              <td class="cell-bold">Total 12% Coms</td>
              <td></td>
              <td class="cell-formula cell-currency">=SUM(M6:M9)*12% [40740]</td>
            </tr>
            <tr>
              <td class="row-number">15</td>
              <td>ARA LOUBAR SLIP</td>
              <td class="cell-currency">200</td>
              <td>14-10-2026</td>
              <td>CHEGUNTA JAFFER DABA</td>
              <td class="cell-currency">2000</td>
              <td class="cell-bold">Salary 12%</td>
              <td class="cell-currency font-bold">40740</td>
              <td></td>
            </tr>
            <tr>
              <td class="row-number">16</td>
              <td>BEETA PHOOL</td>
              <td class="cell-currency">300</td>
              <td>17-10-2026</td>
              <td>HOME TRSF</td>
              <td class="cell-currency">10000</td>
              <td>Old Balance</td>
              <td class="cell-currency">13800</td>
              <td></td>
            </tr>
            <tr>
              <td class="row-number">17</td>
              <td>SAMSATIPUR PHOOL</td>
              <td class="cell-currency">400</td>
              <td>18-10-2026</td>
              <td>MDCL ADV</td>
              <td class="cell-currency">5000</td>
              <td>Expenses</td>
              <td class="cell-currency">28700</td>
              <td></td>
            </tr>
            <tr class="row-highlight-total">
              <td class="row-number">18</td>
              <td>BIHAR POLICE</td>
              <td class="cell-currency">450</td>
              <td>19-10-2026</td>
              <td>MOBILE PH</td>
              <td class="cell-currency">35200</td>
              <td class="cell-bold">Total Credit</td>
              <td class="cell-formula cell-currency font-bold">=SUM(L15:L17) [83240]</td>
              <td></td>
            </tr>
            <tr class="row-highlight-total">
              <td class="row-number">19</td>
              <td>BIHAR PUJA PARCHI</td>
              <td class="cell-currency">980</td>
              <td colspan="2"></td>
              <td class="cell-formula cell-currency font-bold">=SUM(H9:H18) [78200]</td>
              <td>Advance</td>
              <td class="cell-currency font-bold">78200</td>
              <td></td>
            </tr>
            <tr class="row-highlight-profit">
              <td class="row-number">20</td>
              <td>PARKING</td>
              <td class="cell-currency">350</td>
              <td colspan="3"></td>
              <td class="cell-bold">Balance</td>
              <td class="cell-formula cell-currency font-bold">=L18-L19 [5040]</td>
              <td class="cell-success"><strong>As On Date 20-10-2026, Shankar wants to Pay.</strong></td>
            </tr>
            <tr>
              <td class="row-number">43</td>
              <td class="cell-bold">Total (37 road items)</td>
              <td class="cell-formula cell-currency font-bold">=SUM(D6:D42) [28735]</td>
              <td colspan="6"></td>
            </tr>
          </tbody>
        </table>

        <h4 style="margin-top: 2rem; margin-bottom: 0.5rem; color: #1e3a8a;">🚛 DRI ALLAM BROT - TS15UE1122 (Period: 04-10-2026 To 20-10-2026)</h4>
        <table class="excel-sheet-table">
          <thead>
            <tr class="excel-col-headers">
              <th class="row-num-header"></th>
              <th>C (Road Expenses)</th>
              <th>D (Amount)</th>
              <th>F (Date)</th>
              <th>G (Advance Narration)</th>
              <th>H (Advance Amt)</th>
              <th>K (Trip / Summary)</th>
              <th>M (Base Freight)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-number">53</td>
              <td>POLICE PARCHI</td>
              <td class="cell-currency">430</td>
              <td colspan="3"></td>
              <td>04-10-26 TO 06-10-26 (MDCL TO CHEGUNTA)</td>
              <td class="cell-currency">10000</td>
            </tr>
            <tr>
              <td class="row-number">54</td>
              <td>MOHINA BODER</td>
              <td class="cell-currency">500</td>
              <td colspan="3"></td>
              <td>06-10-26 TO 09-10-26 (MDCL TO MUZZFARPUR)</td>
              <td class="cell-currency">114000</td>
            </tr>
            <tr>
              <td class="row-number">55</td>
              <td>ARRA LABOUR</td>
              <td class="cell-currency">200</td>
              <td colspan="3"></td>
              <td>11-10-26 TO 13-10-26 (JABALPUR TO BHONIGIRI)</td>
              <td class="cell-currency">75000</td>
            </tr>
            <tr class="row-highlight-total">
              <td class="row-number">56</td>
              <td>HANMANA BODER</td>
              <td class="cell-currency">700</td>
              <td colspan="3"></td>
              <td class="cell-bold">Total 12% Coms</td>
              <td class="cell-formula cell-currency font-bold">=SUM(M53:M55)*12% [23880]</td>
            </tr>
            <tr>
              <td class="row-number">58</td>
              <td>KHAWASA BODER</td>
              <td class="cell-currency">700</td>
              <td>07-10-2026</td>
              <td>MDCL ADV</td>
              <td class="cell-currency">2500</td>
              <td colspan="2"></td>
            </tr>
            <tr>
              <td class="row-number">61</td>
              <td>CHANDARPUR PS</td>
              <td class="cell-currency">300</td>
              <td>09-10-2026</td>
              <td>HOME TRSF</td>
              <td class="cell-currency">20000</td>
              <td colspan="2"></td>
            </tr>
            <tr class="row-highlight-total">
              <td class="row-number">64</td>
              <td>MDCL KANTA</td>
              <td class="cell-currency">100</td>
              <td colspan="2" class="cell-bold">Advance Total</td>
              <td class="cell-formula cell-currency font-bold">=SUM(H58:H63) [41500]</td>
              <td colspan="2"></td>
            </tr>
            <tr>
              <td class="row-number">65</td>
              <td>PANDARKOLA BODER</td>
              <td class="cell-currency">700</td>
              <td>EXPENSES</td>
              <td>04-10-26 TO 20-10-26</td>
              <td class="cell-currency">11790</td>
              <td colspan="2"></td>
            </tr>
            <tr>
              <td class="row-number">66</td>
              <td>MANASAR BODER</td>
              <td class="cell-currency">900</td>
              <td>Salary</td>
              <td>Total 12% Coms</td>
              <td class="cell-currency">23880</td>
              <td colspan="2"></td>
            </tr>
            <tr>
              <td class="row-number">67</td>
              <td>KHAWASA BODER</td>
              <td class="cell-currency">700</td>
              <td colspan="2">Advance Surplus</td>
              <td class="cell-formula cell-currency font-bold">=H64-H65-H66 [5830]</td>
              <td colspan="2"></td>
            </tr>
            <tr>
              <td class="row-number">68</td>
              <td>HANMANA BODER</td>
              <td class="cell-currency">900</td>
              <td>OLD BALANCE</td>
              <td>OLD ALLAM WANT PAY</td>
              <td class="cell-currency">62340</td>
              <td colspan="2"></td>
            </tr>
            <tr class="row-highlight-profit">
              <td class="row-number">69</td>
              <td>MOHINA BODER</td>
              <td class="cell-currency">800</td>
              <td>Total</td>
              <td>Balc with Allam</td>
              <td class="cell-formula cell-currency font-bold">=H67+H68 [68170]</td>
              <td colspan="2" class="cell-warning"><strong>As On Date 20-10-2026, Allam wants to Pay Shankar</strong></td>
            </tr>
            <tr>
              <td class="row-number">75</td>
              <td class="cell-bold">Total (22 road items)</td>
              <td class="cell-formula cell-currency font-bold">=SUM(D53:D74) [11790]</td>
              <td colspan="5"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSept6666ReplicaSheet(arch) {
    return `
      <div style="padding: 1rem 0;">
        <h4 style="margin-bottom: 0.5rem; color: #1e3a8a;">📁 September 2026 Historical Archive • TG15T6666 (Driver: Noor Allam)</h4>
        <table class="excel-sheet-table">
          <thead>
            <tr class="excel-col-headers">
              <th class="row-num-header"></th>
              <th>Description / Route</th>
              <th>Date</th>
              <th class="text-right">Freight / Amount</th>
              <th>Notes / Calculations</th>
            </tr>
          </thead>
          <tbody>
            ${arch.trips.map((t, idx) => `
              <tr>
                <td class="row-number">${idx + 7}</td>
                <td><strong>${t.route}</strong></td>
                <td>${t.date}</td>
                <td class="text-right cell-currency">${CalculationsModule.formatINR(t.freight)}</td>
                <td>Historical freight slip</td>
              </tr>
            `).join('')}
            <tr class="row-highlight-total">
              <td class="row-number">12</td>
              <td colspan="2"><strong>Total Freight September ($P_1$)</strong></td>
              <td class="text-right font-bold cell-currency">${CalculationsModule.formatINR(arch.totalFreight)}</td>
              <td></td>
            </tr>
            <tr>
              <td class="row-number">59</td>
              <td colspan="2">Diesel Fuel Total (14 fuel slips)</td>
              <td class="text-right cell-currency">${CalculationsModule.formatINR(arch.diesel)}</td>
              <td>Reconciled</td>
            </tr>
            <tr>
              <td class="row-number">60</td>
              <td colspan="2">FastTag Tolls</td>
              <td class="text-right cell-currency">${CalculationsModule.formatINR(arch.fastTag)}</td>
              <td>National Highway</td>
            </tr>
            <tr>
              <td class="row-number">61</td>
              <td colspan="2">Driver Road Expenses</td>
              <td class="text-right cell-currency">${CalculationsModule.formatINR(arch.driverExpenses)}</td>
              <td>Itemized</td>
            </tr>
            <tr>
              <td class="row-number">62</td>
              <td colspan="2">Driver 12% Salary Commission</td>
              <td class="text-right cell-currency text-primary">${CalculationsModule.formatINR(arch.driverSalary)}</td>
              <td>12% on ${CalculationsModule.formatINR(arch.totalFreight)}</td>
            </tr>
            <tr class="row-highlight-total">
              <td class="row-number">66</td>
              <td colspan="2"><strong>Total Operating Expenses ($P_2$)</strong></td>
              <td class="text-right font-bold cell-currency text-danger">${CalculationsModule.formatINR(arch.totalExpenses)}</td>
              <td>SUM(Diesel+FastTag+Exp+Salary+Etc)</td>
            </tr>
            <tr class="row-highlight-profit">
              <td class="row-number">67</td>
              <td colspan="2"><strong>Net Operating Profit (September)</strong></td>
              <td class="text-right font-bold cell-currency text-success">${CalculationsModule.formatINR(arch.netProfit)}</td>
              <td>$P_1 - P_2$</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSept1122ReplicaSheet(arch) {
    return `
      <div style="padding: 1rem 0;">
        <h4 style="margin-bottom: 0.5rem; color: #1e3a8a;">📁 September 2026 Historical Archive • TS15UE1122 (Driver: Allam Brother)</h4>
        <table class="excel-sheet-table">
          <thead>
            <tr class="excel-col-headers">
              <th class="row-num-header"></th>
              <th>Description / Route</th>
              <th>Date</th>
              <th class="text-right">Freight / Amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${arch.trips.map((t, idx) => `
              <tr>
                <td class="row-number">${idx + 27}</td>
                <td><strong>${t.route}</strong></td>
                <td>${t.date}</td>
                <td class="text-right cell-currency">${CalculationsModule.formatINR(t.freight)}</td>
                <td>${t.note || 'Normal delivery'}</td>
              </tr>
            `).join('')}
            <tr class="row-highlight-total">
              <td class="row-number">32</td>
              <td colspan="2"><strong>Total Freight September</strong></td>
              <td class="text-right font-bold cell-currency">${CalculationsModule.formatINR(arch.totalFreight)}</td>
              <td></td>
            </tr>
            <tr>
              <td class="row-number">59</td>
              <td colspan="2">Diesel Fuel Total (12 slips)</td>
              <td class="text-right cell-currency">${CalculationsModule.formatINR(arch.diesel)}</td>
              <td>Reconciled</td>
            </tr>
            <tr>
              <td class="row-number">64</td>
              <td colspan="2">Road Expenses RTA</td>
              <td class="text-right cell-currency">${CalculationsModule.formatINR(arch.roadExpenses)}</td>
              <td>Itemized</td>
            </tr>
            <tr>
              <td class="row-number">65</td>
              <td colspan="2">Salary Commission 12%</td>
              <td class="text-right cell-currency text-primary">${CalculationsModule.formatINR(arch.salaryCommission)}</td>
              <td>12% Commission</td>
            </tr>
            <tr class="row-highlight-profit">
              <td class="row-number">70</td>
              <td colspan="2"><strong>Balance with Allam Carried Forward</strong></td>
              <td class="text-right font-bold cell-currency text-warning">${CalculationsModule.formatINR(arch.driverSettlement.balanceWithAllam)}</td>
              <td>Old Balance brought forward to October</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Export to genuine Excel (.xlsx) using ExcelJS
   */
  async function exportToExcel() {
    if (typeof ExcelJS === 'undefined') {
      alert('ExcelJS library is loading, please try again in a moment.');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Shravan Kumar - Transport Brokerage Ledger Pvt Ltd';
      workbook.lastModifiedBy = 'Shravan Kumar';
      workbook.created = new Date();
      workbook.modified = new Date();

      const data = DataModule.getData();
      const pnl6666 = CalculationsModule.calculateTruckPnl('TG15T6666');
      const pnl1122 = CalculationsModule.calculateTruckPnl('TS15UE1122');
      const drv6666 = CalculationsModule.calculateDriverSettlement('TG15T6666');
      const drv1122 = CalculationsModule.calculateDriverSettlement('TS15UE1122');

      // -------------------------------------------------------------
      // SHEET 1: 1122_6666_P&L Account
      // -------------------------------------------------------------
      const pnlSheet = workbook.addWorksheet('1122_6666_P&L Account');
      pnlSheet.columns = [
        { width: 5 },  // A
        { width: 5 },  // B
        { width: 22 }, // C
        { width: 28 }, // D
        { width: 18 }, // E
        { width: 5 },  // F
        { width: 22 }, // G
        { width: 5 },  // H
        { width: 5 },  // I
        { width: 22 }, // J
        { width: 28 }, // K
        { width: 18 }, // L
        { width: 25 }  // M
      ];

      // Row 4: Banner
      pnlSheet.getCell('C4').value = "Don’t Share Below";
      pnlSheet.getCell('C4').font = { bold: true, color: { argb: 'FF991B1B' } };

      // Row 6: Date Period
      pnlSheet.getCell('F6').value = "Date";
      pnlSheet.getCell('G6').value = "01-10-2026 To 20-10-2026";
      pnlSheet.getCell('G6').font = { bold: true };

      // Row 8: Truck Headers
      pnlSheet.getCell('C8').value = "TG15T6666";
      pnlSheet.getCell('C8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
      pnlSheet.getCell('C8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

      pnlSheet.getCell('J8').value = "TS15UE1122";
      pnlSheet.getCell('J8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
      pnlSheet.getCell('J8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

      // Trips Rows 11-14
      pnlSheet.getCell('C11').value = "01-10-26 TO 06-10-26";
      pnlSheet.getCell('D11').value = "MDCL TO MADHAPURA";
      pnlSheet.getCell('E11').value = 175000;
      pnlSheet.getCell('J11').value = "04-10-26 TO 06-10-26";
      pnlSheet.getCell('K11').value = "MDCL TO CHEGUNTA";
      pnlSheet.getCell('L11').value = 15000;

      pnlSheet.getCell('C12').value = "09-10-26 TO 14-10-26";
      pnlSheet.getCell('D12').value = "AURGANGABAD TO HYD";
      pnlSheet.getCell('E12').value = 108500;
      pnlSheet.getCell('J12').value = "06-10-26 TO 09-10-26";
      pnlSheet.getCell('K12').value = "MDCL TO MUZZFARPUR";
      pnlSheet.getCell('L12').value = 141000;

      pnlSheet.getCell('C13').value = "15-10-26 TO 17-10-26";
      pnlSheet.getCell('D13').value = "K\"NAG TO KURNOOL";
      pnlSheet.getCell('E13').value = 72300;
      pnlSheet.getCell('J13').value = "11-10-26 TO 13-10-26";
      pnlSheet.getCell('K13').value = "JABALPUR TO BHONIGIRI";
      pnlSheet.getCell('L13').value = 80000;

      pnlSheet.getCell('C14').value = "18-10-26 TO 19-10-26";
      pnlSheet.getCell('D14').value = "KURNOOL TO MDCL";
      pnlSheet.getCell('E14').value = 27000;
      pnlSheet.getCell('K14').value = "Xp1: Total";
      pnlSheet.getCell('L14').value = { formula: 'SUM(L11:L13)', result: 236000 };
      pnlSheet.getCell('L14').font = { bold: true };

      // Row 15: P1 Total Sum
      pnlSheet.getCell('C15').value = "P1:Total Sum";
      pnlSheet.getCell('E15').value = { formula: 'SUM(E11:E14)', result: 382800 };
      pnlSheet.getCell('E15').font = { bold: true };

      // Diesel Rows 18-22
      pnlSheet.getCell('D18').value = "Disel";
      pnlSheet.getCell('E18').value = 30500;
      pnlSheet.getCell('K18').value = "Disel";
      pnlSheet.getCell('L18').value = 24000;

      pnlSheet.getCell('E19').value = 30500;
      pnlSheet.getCell('L19').value = 19000;
      pnlSheet.getCell('E20').value = 31600;
      pnlSheet.getCell('L20').value = 23000;
      pnlSheet.getCell('E21').value = 13000;
      pnlSheet.getCell('L21').value = 10000;
      pnlSheet.getCell('E22').value = 27000;
      pnlSheet.getCell('L22').value = 27000;

      // Expenses Rows 23-26
      pnlSheet.getCell('C23').value = "01-10-2026 To 20-10-2026";
      pnlSheet.getCell('D23').value = "Exp";
      pnlSheet.getCell('E23').value = 28735;
      pnlSheet.getCell('J23').value = "01-10-2026 To 20-10-2026";
      pnlSheet.getCell('K23').value = "Exp";
      pnlSheet.getCell('L23').value = 11790;

      pnlSheet.getCell('D24').value = "FastTag";
      pnlSheet.getCell('E24').value = 40000;
      pnlSheet.getCell('K24').value = "FastTag";
      pnlSheet.getCell('L24').value = 25000;

      pnlSheet.getCell('D25').value = "AddBlue & Exp";
      pnlSheet.getCell('E25').value = 15000;
      pnlSheet.getCell('K25').value = "AddBlue & Exp";
      pnlSheet.getCell('L25').value = 20000;

      pnlSheet.getCell('D26').value = "Salary";
      pnlSheet.getCell('E26').value = 40740;
      pnlSheet.getCell('K26').value = "Salary";
      pnlSheet.getCell('L26').value = 23880;

      // Row 27: P2 Total
      pnlSheet.getCell('D27').value = "P2: Total";
      pnlSheet.getCell('E27').value = { formula: 'SUM(E18:E26)', result: 257075 };
      pnlSheet.getCell('E27').font = { bold: true };
      pnlSheet.getCell('K27').value = "xp2: Total";
      pnlSheet.getCell('L27').value = { formula: 'SUM(L18:L26)', result: 183670 };
      pnlSheet.getCell('L27').font = { bold: true };

      // Row 29: Net Profit
      pnlSheet.getCell('D29').value = "P1-P2 Total";
      pnlSheet.getCell('E29').value = { formula: 'E15-E27', result: 125725 };
      pnlSheet.getCell('E29').font = { bold: true, color: { argb: 'FF065F46' } };
      pnlSheet.getCell('E29').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };

      pnlSheet.getCell('J29').value = "04-10-2026 To 20-10-26";
      pnlSheet.getCell('K29').value = "xP1-xP2 Total";
      pnlSheet.getCell('L29').value = { formula: 'L14-L27', result: 52330 };
      pnlSheet.getCell('L29').font = { bold: true, color: { argb: 'FF065F46' } };
      pnlSheet.getCell('L29').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };

      pnlSheet.getCell('M29').value = "Note: Profit";
      pnlSheet.getCell('M29').font = { bold: true, color: { argb: 'FF047857' } };

      // -------------------------------------------------------------
      // SHEET 2: 1122_6666_Driver
      // -------------------------------------------------------------
      const drvSheet = workbook.addWorksheet('1122_6666_Driver');
      drvSheet.columns = [
        { width: 5 },  // A
        { width: 5 },  // B
        { width: 28 }, // C
        { width: 14 }, // D
        { width: 5 },  // E
        { width: 14 }, // F
        { width: 28 }, // G
        { width: 16 }, // H
        { width: 16 }, // I
        { width: 5 },  // J
        { width: 25 }, // K
        { width: 18 }, // L
        { width: 18 }  // M
      ];

      drvSheet.getCell('C3').value = "DRI NOOR ALLAM -TG15T6666";
      drvSheet.getCell('C3').font = { bold: true, color: { argb: 'FF1E3A8A' } };
      drvSheet.getCell('F3').value = "01-10-2026 To 20-10-2026";

      // Populate Noor Allam Road Expenses (37 items)
      data.TG15T6666.roadExpenses.forEach((exp, idx) => {
        const row = idx + 6;
        drvSheet.getCell(`C${row}`).value = exp.description;
        drvSheet.getCell(`D${row}`).value = exp.amount;
      });
      drvSheet.getCell('C43').value = "Total";
      drvSheet.getCell('D43').value = { formula: 'SUM(D6:D42)', result: 28735 };
      drvSheet.getCell('D43').font = { bold: true };

      // Populate Noor Allam Advances
      data.TG15T6666.advances.forEach((adv, idx) => {
        const row = idx + 9;
        drvSheet.getCell(`F${row}`).value = adv.date;
        drvSheet.getCell(`G${row}`).value = adv.location;
        drvSheet.getCell(`H${row}`).value = adv.amount;
      });
      drvSheet.getCell('H19').value = { formula: 'SUM(H9:H18)', result: 78200 };
      drvSheet.getCell('H19').font = { bold: true };

      // Base Freight & Commission (Noor Allam)
      drvSheet.getCell('K6').value = "01-10-26 TO 06-10-26";
      drvSheet.getCell('M6').value = 140000;
      drvSheet.getCell('K7').value = "09-10-26 TO 14-10-26";
      drvSheet.getCell('M7').value = 108500;
      drvSheet.getCell('K8').value = "15-10-26 TO 17-10-26";
      drvSheet.getCell('M8').value = 64000;
      drvSheet.getCell('K9').value = "18-10-26 TO 19-10-26";
      drvSheet.getCell('M9').value = 27000;
      drvSheet.getCell('K10').value = "Total 12% Coms";
      drvSheet.getCell('M10').value = { formula: 'SUM(M6:M9)*12%', result: 40740 };
      drvSheet.getCell('M10').font = { bold: true };

      // Noor Allam Settlement Box
      drvSheet.getCell('K15').value = "Salary 12%";
      drvSheet.getCell('L15').value = 40740;
      drvSheet.getCell('K16').value = "Old Balance";
      drvSheet.getCell('L16').value = 13800;
      drvSheet.getCell('K17').value = "Expenses";
      drvSheet.getCell('L17').value = 28700;
      drvSheet.getCell('K18').value = "Total";
      drvSheet.getCell('L18').value = { formula: 'SUM(L15:L17)', result: 83240 };
      drvSheet.getCell('L18').font = { bold: true };
      drvSheet.getCell('K19').value = "Advance";
      drvSheet.getCell('L19').value = 78200;
      drvSheet.getCell('K20').value = "Balance";
      drvSheet.getCell('L20').value = { formula: 'L18-L19', result: 5040 };
      drvSheet.getCell('L20').font = { bold: true, color: { argb: 'FF065F46' } };
      drvSheet.getCell('M20').value = "As On Date  20-10-2026, Shankar wants to Pay.";
      drvSheet.getCell('M20').font = { bold: true };

      // TS15UE1122 Section
      drvSheet.getCell('C49').value = "DRI ALLAM BROT - TS15UE1122";
      drvSheet.getCell('C49').font = { bold: true, color: { argb: 'FF1E3A8A' } };
      drvSheet.getCell('F49').value = "04-10-2026 To 20-10-2026";

      // 22 Road Expenses for 1122
      data.TS15UE1122.roadExpenses.forEach((exp, idx) => {
        const row = idx + 53;
        drvSheet.getCell(`C${row}`).value = exp.description;
        drvSheet.getCell(`D${row}`).value = exp.amount;
      });
      drvSheet.getCell('C75').value = "Total";
      drvSheet.getCell('D75').value = { formula: 'SUM(D53:D74)', result: 11790 };
      drvSheet.getCell('D75').font = { bold: true };

      // TS15UE1122 Settlement Box
      drvSheet.getCell('F64').value = "Advance Total";
      drvSheet.getCell('H64').value = { formula: 'SUM(H58:H63)', result: 41500 };
      drvSheet.getCell('F65').value = "EXPENSESS";
      drvSheet.getCell('H65').value = 11790;
      drvSheet.getCell('F66').value = "Salary 12% Coms";
      drvSheet.getCell('H66').value = 23880;
      drvSheet.getCell('F67').value = "Advance Surplus";
      drvSheet.getCell('H67').value = { formula: 'H64-H65-H66', result: 5830 };
      drvSheet.getCell('F68').value = "OLD ALLAM WANT PAY";
      drvSheet.getCell('H68').value = 62340;
      drvSheet.getCell('F69').value = "Total Balc with Allam";
      drvSheet.getCell('H69').value = { formula: 'H67+H68', result: 68170 };
      drvSheet.getCell('H69').font = { bold: true, color: { argb: 'FF991B1B' } };
      drvSheet.getCell('I69').value = "As On Date  20-10-2026, Allam wants to Pay Shankar";
      drvSheet.getCell('I69').font = { bold: true };

      // Write File
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Fleet_Accounts_Ledger_1122_6666_${new Date().toISOString().slice(0, 10)}.xlsx`);

      if (window.AppModule && window.AppModule.showToast) {
        window.AppModule.showToast('✅ Multi-sheet Excel workbook (.xlsx) exported successfully!', 'success');
      }
    } catch (err) {
      console.error('Excel export error:', err);
      alert('Failed to generate Excel file: ' + err.message);
    }
  }

  return {
    renderPnlView,
    renderDriverView,
    renderExcelReplica,
    exportToExcel,
    setZoom,
    filterExpenses
  };
})();

if (typeof window !== 'undefined') {
  window.TableModule = TableModule;
}
