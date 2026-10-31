/**
 * Fleet Logistics & Financial Accounts Management - Tables & Spreadsheet Module
 * Renders Dynamic P&L Accounts, Driver Settlement Ledgers, 1:1 Live Excel Replica, and ExcelJS Export
 * Complete CRUD Integration with Edit/Delete Actions and Click-to-Edit Rows
 * Developed by Shravan Kumar • 2026
 */

const TableModule = (function () {
  'use strict';

  let currentZoom = 100;
  let currentReplicaTab = 'pnl';
  let expenseFilterCategory = 'all';
  let isFullscreen = false;

  function setZoom(level) {
    currentZoom = level;
    const grid = document.getElementById('excelReplicaGrid');
    if (grid) {
      const scale = level / 100;
      grid.style.transform = `scale(${scale})`;
      grid.style.transformOrigin = 'top left';
      grid.style.width = `${100 / scale}%`;
    }
    // Update zoom buttons
    ['80', '90', '100', '115'].forEach(z => {
      const btn = document.getElementById(`btnZoom${z}`);
      if (btn) {
        if (Number(z) === Number(level)) {
          btn.className = 'btn btn-sm btn-primary';
        } else {
          btn.className = 'btn btn-sm btn-secondary';
        }
      }
    });
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    const viewExcel = document.getElementById('view-excel');
    const btn = document.getElementById('btnToggleFullscreen');

    if (isFullscreen) {
      if (viewExcel) viewExcel.classList.add('sheet-fullscreen-mode');
      document.body.classList.add('in-sheet-fullscreen');
      if (btn) {
        btn.innerHTML = '✕ Exit Full Screen';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-danger');
      }
    } else {
      if (viewExcel) viewExcel.classList.remove('sheet-fullscreen-mode');
      document.body.classList.remove('in-sheet-fullscreen');
      if (btn) {
        btn.innerHTML = '⛶ Full Screen';
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-secondary');
      }
    }
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
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span class="count-badge">${truck.trips.length} Trips Total</span>
              <button class="btn btn-sm btn-primary" onclick="AppModule.openAddModal('trip', '${tId}')">
                + Add Trip
              </button>
            </div>
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
                  <th class="text-center" style="width: 90px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${truck.trips.map((t, idx) => `
                  <tr>
                    <td><strong>${idx + 1}</strong></td>
                    <td><span class="date-badge">${window.escapeHtml(t.dateRange)}</span></td>
                    <td><strong>${window.escapeHtml(t.from)}</strong></td>
                    <td><strong>${window.escapeHtml(t.to)}</strong></td>
                    <td>${window.escapeHtml(t.route)}</td>
                    <td><span class="transporter-badge">${window.escapeHtml(t.transporter || 'Direct')}</span></td>
                    <td class="text-right font-bold text-primary">${CalculationsModule.formatINR(t.pnlFreight)}</td>
                    <td class="text-right">${CalculationsModule.formatINR(t.baseFreight)}</td>
                    <td class="text-right text-success">${CalculationsModule.formatINR(t.advanceReceived)}</td>
                    <td class="text-right ${t.balanceFreight > 0 ? 'text-danger font-bold' : ''}">
                      ${CalculationsModule.formatINR(t.balanceFreight)}
                    </td>
                    <td class="text-center">
                      <span class="status-pill status-active">Delivered</span>
                    </td>
                    <td class="text-center">
                      <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('trip', '${tId}', '${t.id}')" title="Edit Trip">✏️</button>
                      <button class="btn btn-xs btn-outline-danger admin-only" onclick="AppModule.confirmDelete('trip', '${tId}', '${t.id}')" title="Delete Trip">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
                ${truck.trips.length === 0 ? `
                  <tr>
                    <td colspan="12" class="text-center" style="padding: 1.5rem; color: #94a3b8;">
                      No trips logged yet. Click "+ Add Trip" to record a freight shipment.
                    </td>
                  </tr>
                ` : ''}
              </tbody>
              <tfoot>
                <tr class="table-total-row">
                  <td colspan="6" class="text-right"><strong>$P_1$ Total Sum:</strong></td>
                  <td class="text-right font-bold text-primary">${CalculationsModule.formatINR(pnl.p1Revenue)}</td>
                  <td class="text-right font-bold">${CalculationsModule.formatINR(pnl.totalBaseFreight)}</td>
                  <td colspan="4"></td>
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
                    <th class="text-center" style="width: 70px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${pnl.dieselEntries.map((d, dIdx) => `
                    <tr>
                      <td>#${dIdx + 1}</td>
                      <td>${window.escapeHtml(d.date || 'Oct 2026')}</td>
                      <td>${window.escapeHtml(d.pump || 'Highway Pump')}</td>
                      <td class="text-right font-semibold">${CalculationsModule.formatINR(d.amount)}</td>
                      <td class="text-center">
                        <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('diesel', '${tId}', '${d.id}')" title="Edit Diesel">✏️</button>
                        <button class="btn btn-xs btn-outline-danger admin-only" onclick="AppModule.confirmDelete('diesel', '${tId}', '${d.id}')" title="Delete Diesel">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                  ${pnl.dieselEntries.length === 0 ? `
                    <tr>
                      <td colspan="5" class="text-center" style="padding: 1rem; color: #94a3b8;">No fuel entries recorded yet.</td>
                    </tr>
                  ` : ''}
                </tbody>
                <tfoot>
                  <tr class="table-total-row">
                    <td colspan="3"><strong>Diesel Sub-Total:</strong></td>
                    <td class="text-right font-bold">${CalculationsModule.formatINR(pnl.dieselTotal)}</td>
                    <td></td>
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
            <div class="profit-badge-pill">
              Operating Margin: <strong>${pnl.profitMargin}%</strong>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render Driver Settlements View
   */
  function renderDriverView(truckId) {
    const container = document.getElementById('view-driver');
    if (!container) return;

    const targetTruckId = truckId || 'TG15T6666';
    const drv = CalculationsModule.calculateDriverSettlement(targetTruckId);
    const truck = DataModule.getTruckData(targetTruckId);
    if (!drv || !truck) return;

    const isNoor = (targetTruckId === 'TG15T6666');

    let html = `
      <div class="view-header-row">
        <div>
          <h2>👤 Driver Settlement & Advances Ledger</h2>
          <p class="section-subtext">Authoritative Driver Commission, Advance Deductions, and En-Route Road Expenses</p>
        </div>
        <div class="header-actions-group">
          <!-- Switcher Buttons -->
          <div class="driver-switch-pills">
            <button class="btn btn-sm ${isNoor ? 'btn-primary' : 'btn-secondary'}" onclick="AppModule.selectTruckFilter('TG15T6666'); TableModule.renderDriverView('TG15T6666');">
              Noor Allam (TG15T6666)
            </button>
            <button class="btn btn-sm ${!isNoor ? 'btn-primary' : 'btn-secondary'}" onclick="AppModule.selectTruckFilter('TS15UE1122'); TableModule.renderDriverView('TS15UE1122');">
              Allam Brother (TS15UE1122)
            </button>
          </div>
          <button class="btn btn-primary" onclick="AppModule.openAddModal('advance', '${targetTruckId}')">
            💵 Record Advance
          </button>
          <button class="btn btn-secondary" onclick="AppModule.openAddModal('expense', '${targetTruckId}')">
            🚨 Add Road Expense
          </button>
        </div>
      </div>

      <!-- 1. AUTHORITATIVE SETTLEMENT SUMMARY BOX -->
      <div class="driver-statement-box ${isNoor ? 'statement-payable' : 'statement-receivable'}">
        <div class="statement-header-row">
          <div class="statement-title">
            <span class="statement-avatar">👤</span>
            <div>
              <h3>${drv.driverName} • ${drv.truckId}</h3>
              <span class="statement-sub">${drv.period} • Settlement Statement</span>
            </div>
          </div>
          <div class="statement-status-badge">
            ${drv.settlementAction}
          </div>
        </div>

        <div class="statement-math-grid">
          ${isNoor ? `
            <div class="statement-math-item">
              <label>12% Salary Commission</label>
              <strong>${CalculationsModule.formatINR(drv.salaryCommission)}</strong>
              <small>12% on ${CalculationsModule.formatINR(drv.totalBaseFreight)}</small>
            </div>
            <div class="statement-math-operator">+</div>
            <div class="statement-math-item">
              <label>Old Balance B/F</label>
              <strong>${CalculationsModule.formatINR(drv.oldBalance)}</strong>
              <small>Carried from Sept</small>
            </div>
            <div class="statement-math-operator">+</div>
            <div class="statement-math-item">
              <label>Road Expenses Claimed</label>
              <strong>${CalculationsModule.formatINR(drv.claimedExpenses)}</strong>
              <small>${drv.expensesCount} itemized receipts</small>
            </div>
            <div class="statement-math-operator">=</div>
            <div class="statement-math-item highlight-credit">
              <label>Total Driver Credit</label>
              <strong>${CalculationsModule.formatINR(drv.totalDriverCredit)}</strong>
              <small>Total Gross Payable</small>
            </div>
            <div class="statement-math-operator">−</div>
            <div class="statement-math-item highlight-debit">
              <label>Less Advances Taken</label>
              <strong>${CalculationsModule.formatINR(drv.totalAdvances)}</strong>
              <small>${drv.advancesCount} payments deducted</small>
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
              <small>${drv.advancesCount} cash/bank transfers</small>
            </div>
            <div class="statement-math-operator">−</div>
            <div class="statement-math-item">
              <label>Road Expenses</label>
              <strong>${CalculationsModule.formatINR(drv.claimedExpenses)}</strong>
              <small>${drv.expensesCount} itemized entries</small>
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
                <th class="text-center" style="width: 70px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${truck.trips.map(t => `
                <tr>
                  <td><span class="date-badge">${window.escapeHtml(t.dateRange)}</span></td>
                  <td><strong>${window.escapeHtml(t.route)}</strong></td>
                  <td class="text-right font-semibold">${CalculationsModule.formatINR(t.baseFreight)}</td>
                  <td class="text-right font-semibold text-primary">
                    ${CalculationsModule.formatINR(Math.round(t.baseFreight * 0.12))}
                  </td>
                  <td class="text-center">
                    <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('trip', '${targetTruckId}', '${t.id}')" title="Edit Trip">✏️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td colspan="2"><strong>Total Base Freight:</strong></td>
                <td class="text-right font-bold">${CalculationsModule.formatINR(drv.totalBaseFreight)}</td>
                <td class="text-right font-bold text-primary">${CalculationsModule.formatINR(drv.salaryCommission)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Right: Advances Taken Ledger -->
        <div class="sub-table-container">
          <div class="sub-table-header">
            <h5>Driver Advances Received (${drv.advancesCount} entries)</h5>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span class="badge-sub">Total: ${CalculationsModule.formatINR(drv.totalAdvances)}</span>
              <button class="btn btn-sm btn-primary" onclick="AppModule.openAddModal('advance', '${targetTruckId}')">+ Add</button>
            </div>
          </div>
          <table class="data-table table-condensed">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Location / Narration</th>
                <th>Mode</th>
                <th class="text-right">Amount</th>
                <th class="text-center" style="width: 70px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${truck.advances.map((a, aIdx) => `
                <tr>
                  <td>${aIdx + 1}</td>
                  <td><span class="date-badge">${window.escapeHtml(a.date)}</span></td>
                  <td><strong>${window.escapeHtml(a.location)}</strong></td>
                  <td><span class="mode-tag">${window.escapeHtml(a.mode || 'Cash')}</span></td>
                  <td class="text-right font-semibold text-danger">${CalculationsModule.formatINR(a.amount)}</td>
                  <td class="text-center">
                    <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('advance', '${targetTruckId}', '${a.id}')" title="Edit Advance">✏️</button>
                    <button class="btn btn-xs btn-outline-danger admin-only" onclick="AppModule.confirmDelete('advance', '${targetTruckId}', '${a.id}')" title="Delete Advance">🗑️</button>
                  </td>
                </tr>
              `).join('')}
              ${truck.advances.length === 0 ? `
                <tr>
                  <td colspan="6" class="text-center" style="padding: 1rem; color: #94a3b8;">No advances recorded yet.</td>
                </tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td colspan="4"><strong>Total Advances Taken:</strong></td>
                <td class="text-right font-bold text-danger">${CalculationsModule.formatINR(drv.totalAdvances)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 3. ITEMIZED ROAD EXPENSES LEDGER -->
      <div class="road-expenses-section" style="margin-top: 1.5rem;">
        <div class="section-toolbar-row">
          <div>
            <h4>🚨 Itemized En-Route Expenses Ledger (${truck.roadExpenses.length} Records)</h4>
            <p class="section-subtext">All receipts, police fees, weighbridge kanta, greasing, and interstate toll slips</p>
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <div class="filter-chips-group">
              <button class="chip-btn ${expenseFilterCategory === 'all' ? 'active' : ''}" onclick="TableModule.filterExpenses('all')">All</button>
              <button class="chip-btn ${expenseFilterCategory === 'border' ? 'active' : ''}" onclick="TableModule.filterExpenses('border')">Border / Toll</button>
              <button class="chip-btn ${expenseFilterCategory === 'police' ? 'active' : ''}" onclick="TableModule.filterExpenses('police')">Police / Checking</button>
              <button class="chip-btn ${expenseFilterCategory === 'labour' ? 'active' : ''}" onclick="TableModule.filterExpenses('labour')">Labour / Kanta</button>
              <button class="chip-btn ${expenseFilterCategory === 'maintenance' ? 'active' : ''}" onclick="TableModule.filterExpenses('maintenance')">Tyres / Greasing</button>
            </div>
            <button class="btn btn-sm btn-primary" onclick="AppModule.openAddModal('expense', '${targetTruckId}')">
              + Add Road Expense
            </button>
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
                <th class="text-center" style="width: 80px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${getFilteredExpenses(truck.roadExpenses).map((e, eIdx) => `
                <tr>
                  <td><strong>${eIdx + 1}</strong></td>
                  <td><strong>${window.escapeHtml(e.description)}</strong></td>
                  <td><span class="category-pill ${getCategoryClass(e.category)}">${window.escapeHtml(e.category)}</span></td>
                  <td class="text-right font-bold">${CalculationsModule.formatINR(e.amount)}</td>
                  <td class="text-center">
                    <span class="verified-check">✓ Verified Slip</span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('expense', '${targetTruckId}', '${e.id}')" title="Edit Expense">✏️</button>
                    <button class="btn btn-xs btn-outline-danger admin-only" onclick="AppModule.confirmDelete('expense', '${targetTruckId}', '${e.id}')" title="Delete Expense">🗑️</button>
                  </td>
                </tr>
              `).join('')}
              ${truck.roadExpenses.length === 0 ? `
                <tr>
                  <td colspan="6" class="text-center" style="padding: 1.5rem; color: #94a3b8;">No road expenses recorded yet.</td>
                </tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td colspan="3" class="text-right"><strong>Itemized Expenses Total:</strong></td>
                <td class="text-right font-bold text-danger">${CalculationsModule.formatINR(drv.itemizedExpensesSum)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function filterExpenses(category) {
    expenseFilterCategory = category;
    const curFilter = AppModule.getCurrentTruckFilter();
    renderDriverView(curFilter === 'ALL' ? 'TG15T6666' : curFilter);
  }

  function getFilteredExpenses(expenses) {
    if (!expenses) return [];
    if (expenseFilterCategory === 'all') return expenses;
    return expenses.filter(e => {
      const cat = (e.category || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      if (expenseFilterCategory === 'border') return cat.includes('border') || desc.includes('boder') || desc.includes('border');
      if (expenseFilterCategory === 'police') return cat.includes('police') || desc.includes('police') || desc.includes('ps ');
      if (expenseFilterCategory === 'labour') return cat.includes('labour') || cat.includes('kanta') || desc.includes('labour') || desc.includes('kanta') || desc.includes('loubar');
      if (expenseFilterCategory === 'maintenance') return cat.includes('tyre') || cat.includes('greasing') || desc.includes('tyre') || desc.includes('greace') || desc.includes('tube');
      return true;
    });
  }

  function getCategoryClass(cat) {
    if (!cat) return '';
    const c = cat.toLowerCase();
    if (c.includes('border')) return 'cat-border';
    if (c.includes('police')) return 'cat-police';
    if (c.includes('kanta') || c.includes('labour')) return 'cat-labour';
    if (c.includes('tyre') || c.includes('greas') || c.includes('maint')) return 'cat-maint';
    return '';
  }

  /**
   * Render Excel 1:1 Live Replica Worksheets
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
    const arch = data.archive_2026_09 || {};

    let html = `
      <div class="view-header-row">
        <div>
          <h2>📑 Excel 1:1 Live Replica Worksheets</h2>
          <p class="section-subtext">Interactive replica matching master workbooks cell-for-cell with live formula badges, click-to-edit, and zoom controls</p>
        </div>
        <div class="header-actions-group">
          <!-- Fullscreen & Zoom Controls -->
          <button class="btn btn-sm btn-secondary" id="btnToggleFullscreen" onclick="TableModule.toggleFullscreen()">
            ${isFullscreen ? '✕ Exit Full Screen' : '⛶ Full Screen'}
          </button>
          <div class="excel-zoom-group">
            <span class="zoom-label">Zoom:</span>
            <button class="btn btn-sm ${currentZoom === 80 ? 'btn-primary' : 'btn-secondary'}" id="btnZoom80" onclick="TableModule.setZoom(80)">80% Fit</button>
            <button class="btn btn-sm ${currentZoom === 90 ? 'btn-primary' : 'btn-secondary'}" id="btnZoom90" onclick="TableModule.setZoom(90)">90%</button>
            <button class="btn btn-sm ${currentZoom === 100 ? 'btn-primary' : 'btn-secondary'}" id="btnZoom100" onclick="TableModule.setZoom(100)">100%</button>
            <button class="btn btn-sm ${currentZoom === 115 ? 'btn-primary' : 'btn-secondary'}" id="btnZoom115" onclick="TableModule.setZoom(115)">115%</button>
          </div>
          <button class="btn btn-success" onclick="TableModule.exportToExcel()">
            📥 Download Genuine .xlsx
          </button>
        </div>
      </div>

      <!-- Sheet Navigation Tabs (Matching Excel Tab Style) -->
      <div class="excel-tabs-bar">
        <button class="excel-sheet-tab ${currentReplicaTab === 'pnl' ? 'active' : ''}" onclick="TableModule.renderExcelReplica('pnl')">
          📊 1122_6666_P&amp;L Account
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
        <button class="excel-sheet-tab ${currentReplicaTab === 'all' ? 'active' : ''}" onclick="TableModule.renderExcelReplica('all')">
          📋 Full Workbook (All Sheets)
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
      html += renderSept6666ReplicaSheet(arch.TG15T6666 || {});
    } else if (currentReplicaTab === 'sept1122') {
      html += renderSept1122ReplicaSheet(arch.TS15UE1122 || {});
    } else if (currentReplicaTab === 'all') {
      html += renderFullReplicaWorkbook(t6666, t1122, pnl6666, pnl1122, drv6666, drv1122, arch);
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Dynamic P&L Spreadsheet Replica
   */
  function renderPnlReplicaSheet(t6666, t1122, pnl6666, pnl1122) {
    const trips6666 = (t6666 && t6666.trips) || [];
    const trips1122 = (t1122 && t1122.trips) || [];
    const maxTrips = Math.max(trips6666.length, trips1122.length, 1);

    const diesel6666 = (t6666 && t6666.pl && t6666.pl.dieselEntries) || [];
    const diesel1122 = (t1122 && t1122.pl && t1122.pl.dieselEntries) || [];
    const maxDiesel = Math.max(diesel6666.length, diesel1122.length, 1);

    let tripRowsHtml = '';
    for (let i = 0; i < maxTrips; i++) {
      const rowNum = 11 + i;
      const t6 = trips6666[i];
      const t1 = trips1122[i];

      tripRowsHtml += `
        <tr class="clickable-row">
          <td class="row-number">${rowNum}</td>
          <!-- TG15T6666 Trip (Cols C, D, E) -->
          ${t6 ? `
            <td onclick="AppModule.openEditModal('trip', 'TG15T6666', '${t6.id}')" title="✏️ Click to edit trip">${window.escapeHtml(t6.dateRange)}</td>
            <td onclick="AppModule.openEditModal('trip', 'TG15T6666', '${t6.id}')" title="✏️ Click to edit trip"><strong>${window.escapeHtml(t6.route)}</strong></td>
            <td class="cell-currency font-bold text-primary" onclick="AppModule.openEditModal('trip', 'TG15T6666', '${t6.id}')">${t6.pnlFreight}</td>
          ` : `
            <td></td><td></td><td></td>
          `}
          <!-- Middle Spacer Columns F, G, H, I -->
          <td colspan="4"></td>
          <!-- TS15UE1122 Trip (Cols J, K, L) -->
          ${t1 ? `
            <td onclick="AppModule.openEditModal('trip', 'TS15UE1122', '${t1.id}')" title="✏️ Click to edit trip">${window.escapeHtml(t1.dateRange)}</td>
            <td onclick="AppModule.openEditModal('trip', 'TS15UE1122', '${t1.id}')" title="✏️ Click to edit trip"><strong>${window.escapeHtml(t1.route)}</strong></td>
            <td class="cell-currency font-bold text-primary" onclick="AppModule.openEditModal('trip', 'TS15UE1122', '${t1.id}')">${t1.pnlFreight}</td>
          ` : `
            <td></td><td></td><td></td>
          `}
          <td></td>
        </tr>
      `;
    }

    let dieselRowsHtml = '';
    for (let i = 0; i < maxDiesel; i++) {
      const rowNum = 18 + i;
      const d6 = diesel6666[i];
      const d1 = diesel1122[i];

      dieselRowsHtml += `
        <tr class="clickable-row">
          <td class="row-number">${rowNum}</td>
          <td></td>
          <td class="cell-bold">${i === 0 ? 'Disel' : ''}</td>
          ${d6 ? `
            <td class="cell-currency" onclick="AppModule.openEditModal('diesel', 'TG15T6666', '${d6.id}')" title="✏️ Click to edit diesel slip">${d6.amount}</td>
          ` : `<td></td>`}
          <td colspan="4"></td>
          <td></td>
          <td class="cell-bold">${i === 0 ? 'Disel' : ''}</td>
          ${d1 ? `
            <td class="cell-currency" onclick="AppModule.openEditModal('diesel', 'TS15UE1122', '${d1.id}')" title="✏️ Click to edit diesel slip">${d1.amount}</td>
          ` : `<td></td>`}
          <td></td>
        </tr>
      `;
    }

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
          <!-- Row 4: Banner -->
          <tr>
            <td class="row-number">4</td>
            <td colspan="11" class="cell-warning"><strong>Don’t Share Below</strong></td>
          </tr>
          <!-- Row 6: Period -->
          <tr>
            <td class="row-number">6</td>
            <td colspan="3"></td>
            <td class="cell-bold">Date</td>
            <td class="cell-bold">${pnl6666.period}</td>
            <td colspan="6"></td>
          </tr>
          <!-- Row 8: Truck Headers -->
          <tr>
            <td class="row-number">8</td>
            <td colspan="4" class="cell-header-blue"><strong>TG15T6666</strong></td>
            <td colspan="3"></td>
            <td colspan="4" class="cell-header-blue"><strong>TS15UE1122</strong></td>
          </tr>

          <!-- Dynamic Trip Rows -->
          ${tripRowsHtml}

          <!-- TS15UE1122 Subtotal Row -->
          <tr>
            <td class="row-number">14</td>
            <td colspan="7"></td>
            <td></td>
            <td class="cell-bold">Xp1: Total</td>
            <td class="cell-formula cell-currency font-bold">=SUM(L11:L${10 + trips1122.length}) [Val: ${pnl1122.p1Revenue}]</td>
            <td></td>
          </tr>

          <!-- TG15T6666 P1 Total Row -->
          <tr class="row-highlight-total">
            <td class="row-number">15</td>
            <td colspan="2" class="cell-bold">P1: Total Sum</td>
            <td class="cell-formula cell-currency font-bold">=SUM(E11:E${10 + trips6666.length}) [Val: ${pnl6666.p1Revenue}]</td>
            <td colspan="8"></td>
          </tr>

          <!-- Dynamic Diesel Rows -->
          ${dieselRowsHtml}

          <!-- Expenses Rows -->
          <tr>
            <td class="row-number">23</td>
            <td>${pnl6666.period}</td>
            <td class="cell-bold">Exp</td>
            <td class="cell-currency font-semibold">${pnl6666.roadExpTotal}</td>
            <td colspan="4"></td>
            <td>${pnl1122.period}</td>
            <td class="cell-bold">Exp</td>
            <td class="cell-currency font-semibold">${pnl1122.roadExpTotal}</td>
            <td></td>
          </tr>
          <tr>
            <td class="row-number">24</td>
            <td></td>
            <td class="cell-bold">FastTag</td>
            <td class="cell-currency">${pnl6666.fastTag}</td>
            <td colspan="4"></td>
            <td></td>
            <td class="cell-bold">FastTag</td>
            <td class="cell-currency">${pnl1122.fastTag}</td>
            <td></td>
          </tr>
          <tr>
            <td class="row-number">25</td>
            <td></td>
            <td class="cell-bold">AddBlue & Exp</td>
            <td class="cell-currency">${pnl6666.addBlueAndExp}</td>
            <td colspan="4"></td>
            <td></td>
            <td class="cell-bold">AddBlue & Exp</td>
            <td class="cell-currency">${pnl1122.addBlueAndExp}</td>
            <td></td>
          </tr>
          <tr>
            <td class="row-number">26</td>
            <td></td>
            <td class="cell-bold">Salary</td>
            <td class="cell-currency text-primary font-semibold">${pnl6666.driverSalary}</td>
            <td colspan="4"></td>
            <td></td>
            <td class="cell-bold">Salary</td>
            <td class="cell-currency text-primary font-semibold">${pnl1122.driverSalary}</td>
            <td></td>
          </tr>

          <!-- P2 Total Row -->
          <tr class="row-highlight-total">
            <td class="row-number">27</td>
            <td></td>
            <td class="cell-bold">P2: Total</td>
            <td class="cell-formula cell-currency font-bold">=SUM(E18:E26) [Val: ${pnl6666.p2Expenses}]</td>
            <td colspan="4"></td>
            <td></td>
            <td class="cell-bold">xp2: Total</td>
            <td class="cell-formula cell-currency font-bold">=SUM(L18:L26) [Val: ${pnl1122.p2Expenses}]</td>
            <td></td>
          </tr>

          <!-- Net Profit Row -->
          <tr class="row-highlight-profit">
            <td class="row-number">29</td>
            <td></td>
            <td class="cell-bold">P1-P2 Total</td>
            <td class="cell-formula cell-currency font-bold text-success">=E15-E27 [Val: ${pnl6666.netProfit}]</td>
            <td colspan="3"></td>
            <td>04-10-2026 To 20-10-26</td>
            <td class="cell-bold">xP1-xP2 Total</td>
            <td class="cell-formula cell-currency font-bold text-success">=L14-L27 [Val: ${pnl1122.netProfit}]</td>
            <td class="cell-success"><strong>Note: Profit (${pnl6666.profitMargin}% / ${pnl1122.profitMargin}%)</strong></td>
          </tr>
        </tbody>
      </table>
    `;
  }

  /**
   * Dynamic Driver Settlement Spreadsheet Replica
   */
  function renderDriverReplicaSheet(t6666, t1122, drv6666, drv1122) {
    const expenses6666 = (t6666 && t6666.roadExpenses) || [];
    const advances6666 = (t6666 && t6666.advances) || [];
    const trips6666 = (t6666 && t6666.trips) || [];

    const expenses1122 = (t1122 && t1122.roadExpenses) || [];
    const advances1122 = (t1122 && t1122.advances) || [];
    const trips1122 = (t1122 && t1122.trips) || [];

    // Noor Allam: Combine maximum rows among expenses, advances, and trips
    const maxRows6666 = Math.max(expenses6666.length, advances6666.length + 3, trips6666.length + 8, 38);

    let rows6666Html = '';
    for (let i = 0; i < maxRows6666; i++) {
      const rowNum = 6 + i;
      const exp = expenses6666[i];
      const advIdx = i - 3; // Advances start roughly at row 9
      const adv = (advIdx >= 0 && advIdx < advances6666.length) ? advances6666[advIdx] : null;

      // Base trips for 12% commission
      const trip = trips6666[i];

      rows6666Html += `
        <tr class="clickable-row">
          <td class="row-number">${rowNum}</td>
          
          <!-- Cols C & D: Road Expenses -->
          ${exp ? `
            <td onclick="AppModule.openEditModal('expense', 'TG15T6666', '${exp.id}')" title="✏️ Click to edit expense">
              ${window.escapeHtml(exp.description)}
            </td>
            <td class="cell-currency" onclick="AppModule.openEditModal('expense', 'TG15T6666', '${exp.id}')">
              ${exp.amount}
            </td>
          ` : (i === expenses6666.length ? `
            <td class="cell-bold">Total</td>
            <td class="cell-formula cell-currency font-bold">=SUM(D6:D${5 + expenses6666.length}) [${drv6666.itemizedExpensesSum}]</td>
          ` : `<td></td><td></td>`)}

          <!-- Cols F, G, H: Advances & Settlement -->
          ${i === 0 ? `
            <td>01-10-2026</td>
            <td class="cell-bold">OLD BALC SHANKAR WANT PAY</td>
            <td class="cell-currency font-bold">${drv6666.oldBalance}</td>
          ` : (i === 1 ? `
            <td>EXPENSES</td>
            <td>01-10-2026 TO 20-10-26</td>
            <td class="cell-currency">${drv6666.claimedExpenses}</td>
          ` : (i === 2 ? `
            <td colspan="2" class="cell-bold">Old Bal + Exp Subtotal</td>
            <td class="cell-formula cell-currency font-bold">${drv6666.oldBalance + drv6666.claimedExpenses}</td>
          ` : (adv ? `
            <td onclick="AppModule.openEditModal('advance', 'TG15T6666', '${adv.id}')" title="✏️ Click to edit advance">${window.escapeHtml(adv.date)}</td>
            <td onclick="AppModule.openEditModal('advance', 'TG15T6666', '${adv.id}')" title="✏️ Click to edit advance"><strong>${window.escapeHtml(adv.location)}</strong></td>
            <td class="cell-currency text-danger font-semibold" onclick="AppModule.openEditModal('advance', 'TG15T6666', '${adv.id}')">${adv.amount}</td>
          ` : (advIdx === advances6666.length ? `
            <td colspan="2" class="cell-bold">Total Advances</td>
            <td class="cell-formula cell-currency font-bold text-danger">=SUM(H9:H${8 + advances6666.length}) [${drv6666.totalAdvances}]</td>
          ` : `<td></td><td></td><td></td>`))))}

          <!-- Middle Spacer Col I -->
          <td></td>

          <!-- Cols K, L, M: 12% Trips & Settlement Reconciliation -->
          ${trip ? `
            <td>${window.escapeHtml(trip.dateRange)}</td>
            <td>${window.escapeHtml(trip.route)}</td>
            <td class="cell-currency">${trip.baseFreight}</td>
          ` : (i === trips6666.length ? `
            <td class="cell-bold">Total 12% Coms</td>
            <td></td>
            <td class="cell-formula cell-currency font-bold text-primary">=SUM(M6:M${5 + trips6666.length})*12% [${drv6666.salaryCommission}]</td>
          ` : (i === trips6666.length + 5 ? `
            <td class="cell-bold">Salary 12%</td>
            <td class="cell-currency font-bold">${drv6666.salaryCommission}</td>
            <td></td>
          ` : (i === trips6666.length + 6 ? `
            <td>Old Balance</td>
            <td class="cell-currency">${drv6666.oldBalance}</td>
            <td></td>
          ` : (i === trips6666.length + 7 ? `
            <td>Expenses</td>
            <td class="cell-currency">${drv6666.claimedExpenses}</td>
            <td></td>
          ` : (i === trips6666.length + 8 ? `
            <td class="cell-bold">Total Credit</td>
            <td class="cell-formula cell-currency font-bold text-primary">=SUM(L15:L17) [${drv6666.totalDriverCredit}]</td>
            <td></td>
          ` : (i === trips6666.length + 9 ? `
            <td class="cell-bold text-danger">Less Advance</td>
            <td class="cell-currency font-bold text-danger">${drv6666.totalAdvances}</td>
            <td></td>
          ` : (i === trips6666.length + 10 ? `
            <td class="cell-bold font-bold">Net Balance</td>
            <td class="cell-formula cell-currency font-bold cell-success">=L18-L19 [${drv6666.netBalance}]</td>
            <td class="cell-success" style="font-weight: bold;">${drv6666.note}</td>
          ` : `<td></td><td></td><td></td>`)))))))}
        </tr>
      `;
    }

    // TS15UE1122 (Allam Brother) Dynamic Rows
    const maxRows1122 = Math.max(expenses1122.length, advances1122.length + 6, trips1122.length + 8, 26);
    let rows1122Html = '';
    for (let i = 0; i < maxRows1122; i++) {
      const rowNum = 53 + i;
      const exp = expenses1122[i];
      const advIdx = i - 5; // Advances start around row 58
      const adv = (advIdx >= 0 && advIdx < advances1122.length) ? advances1122[advIdx] : null;
      const trip = trips1122[i];

      rows1122Html += `
        <tr class="clickable-row">
          <td class="row-number">${rowNum}</td>
          
          <!-- Cols C & D: TS15UE1122 Road Expenses -->
          ${exp ? `
            <td onclick="AppModule.openEditModal('expense', 'TS15UE1122', '${exp.id}')" title="✏️ Click to edit expense">
              ${window.escapeHtml(exp.description)}
            </td>
            <td class="cell-currency" onclick="AppModule.openEditModal('expense', 'TS15UE1122', '${exp.id}')">
              ${exp.amount}
            </td>
          ` : (i === expenses1122.length ? `
            <td class="cell-bold">Total (Road Items)</td>
            <td class="cell-formula cell-currency font-bold">=SUM(D53:D${52 + expenses1122.length}) [${drv1122.itemizedExpensesSum}]</td>
          ` : `<td></td><td></td>`)}

          <!-- Middle Cols F, G, H: Advances & Settlement -->
          ${adv ? `
            <td onclick="AppModule.openEditModal('advance', 'TS15UE1122', '${adv.id}')" title="✏️ Click to edit advance">${window.escapeHtml(adv.date)}</td>
            <td onclick="AppModule.openEditModal('advance', 'TS15UE1122', '${adv.id}')" title="✏️ Click to edit advance"><strong>${window.escapeHtml(adv.location)}</strong></td>
            <td class="cell-currency text-danger font-semibold" onclick="AppModule.openEditModal('advance', 'TS15UE1122', '${adv.id}')">${adv.amount}</td>
          ` : (advIdx === advances1122.length ? `
            <td class="cell-bold">Advance Total</td>
            <td></td>
            <td class="cell-formula cell-currency font-bold text-danger">=SUM(H58:H${57 + advances1122.length}) [${drv1122.totalAdvances}]</td>
          ` : (advIdx === advances1122.length + 1 ? `
            <td>EXPENSES</td>
            <td>${drv1122.period}</td>
            <td class="cell-currency">${drv1122.claimedExpenses}</td>
          ` : (advIdx === advances1122.length + 2 ? `
            <td>Salary 12% Coms</td>
            <td>Total 12% Coms</td>
            <td class="cell-currency text-primary font-semibold">${drv1122.salaryCommission}</td>
          ` : (advIdx === advances1122.length + 3 ? `
            <td class="cell-bold">Advance Surplus</td>
            <td></td>
            <td class="cell-formula cell-currency font-bold">=H64-H65-H66 [${drv1122.advanceSurplus}]</td>
          ` : (advIdx === advances1122.length + 4 ? `
            <td class="cell-bold">OLD ALLAM WANT PAY</td>
            <td></td>
            <td class="cell-currency font-bold">${drv1122.oldBalance}</td>
          ` : (advIdx === advances1122.length + 5 ? `
            <td class="cell-bold">Total Balc with Allam</td>
            <td></td>
            <td class="cell-formula cell-currency font-bold cell-success">=H67+H68 [${drv1122.netBalance}]</td>
          ` : (advIdx === advances1122.length + 6 ? `
            <td colspan="3" class="cell-success" style="font-weight: bold;">${drv1122.note}</td>
          ` : `<td></td><td></td><td></td>`)))))))}

          <!-- Spacer Col I -->
          <td></td>

          <!-- Cols K, L, M: Base Trips for 12% Commission -->
          ${trip ? `
            <td>${window.escapeHtml(trip.dateRange)}</td>
            <td>${window.escapeHtml(trip.route)}</td>
            <td class="cell-currency">${trip.baseFreight}</td>
          ` : (i === trips1122.length ? `
            <td class="cell-bold">Total 12% Coms</td>
            <td></td>
            <td class="cell-formula cell-currency font-bold text-primary">=SUM(M53:M${52 + trips1122.length})*12% [${drv1122.salaryCommission}]</td>
          ` : `<td></td><td></td><td></td>`)}
        </tr>
      `;
    }

    return `
      <div style="padding: 1rem 0;">
        <h4 style="margin-bottom: 0.5rem; color: #1e3a8a;">🚛 DRI NOOR ALLAM - TG15T6666 (Period: ${drv6666.period})</h4>
        <table class="excel-sheet-table">
          <thead>
            <tr class="excel-col-headers">
              <th class="row-num-header"></th>
              <th>C (Road Expenses)</th>
              <th>D (Amount)</th>
              <th>F (Date)</th>
              <th>G (Advance Narration)</th>
              <th>H (Advance Amt)</th>
              <th>I</th>
              <th>K (Trip / Summary)</th>
              <th>L (Driver Account)</th>
              <th>M (Base Freight)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-number">3</td>
              <td colspan="2" class="cell-header-blue"><strong>DRI NOOR ALLAM - TG15T6666</strong></td>
              <td colspan="7">Period: ${drv6666.period}</td>
            </tr>
            ${rows6666Html}
          </tbody>
        </table>

        <!-- Driver 2: Allam Brother (TS15UE1122) -->
        <h4 style="margin: 2rem 0 0.5rem; color: #1e3a8a;">🚛 DRI ALLAM BROT - TS15UE1122 (Period: ${drv1122.period})</h4>
        <table class="excel-sheet-table">
          <thead>
            <tr class="excel-col-headers">
              <th class="row-num-header"></th>
              <th>C (Road Expenses)</th>
              <th>D (Amount)</th>
              <th>F (Date)</th>
              <th>G (Advance / Surplus)</th>
              <th>H (Amount)</th>
              <th>I</th>
              <th>K (Trip / Route)</th>
              <th>L</th>
              <th>M (Base Freight)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-number">49</td>
              <td colspan="2" class="cell-header-blue"><strong>DRI ALLAM BROT - TS15UE1122</strong></td>
              <td colspan="7">Period: ${drv1122.period}</td>
            </tr>
            ${rows1122Html}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSept6666ReplicaSheet(arch) {
    const trips = (arch && arch.trips) || [];
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
            ${trips.map((t, idx) => `
              <tr>
                <td class="row-number">${idx + 7}</td>
                <td><strong>${window.escapeHtml(t.route)}</strong></td>
                <td>${window.escapeHtml(t.date)}</td>
                <td class="text-right cell-currency">${CalculationsModule.formatINR(t.freight)}</td>
                <td>Historical freight slip</td>
              </tr>
            `).join('')}
            <tr class="row-highlight-total">
              <td class="row-number">12</td>
              <td colspan="2"><strong>Total Freight September ($P_1$)</strong></td>
              <td class="text-right font-bold cell-currency">${CalculationsModule.formatINR(arch.totalFreight || 327000)}</td>
              <td></td>
            </tr>
            <tr>
              <td class="row-number">59</td>
              <td colspan="2">Diesel Fuel Total (14 fuel slips)</td>
              <td class="text-right cell-currency">${CalculationsModule.formatINR(arch.diesel || 116500)}</td>
              <td>Reconciled</td>
            </tr>
            <tr>
              <td class="row-number">60</td>
              <td colspan="2">FastTag Tolls</td>
              <td class="text-right cell-currency">${CalculationsModule.formatINR(arch.fastTag || 32000)}</td>
              <td>National Highway</td>
            </tr>
            <tr>
              <td class="row-number">61</td>
              <td colspan="2">Driver Road Expenses</td>
              <td class="text-right cell-currency">${CalculationsModule.formatINR(arch.driverExpenses || 24800)}</td>
              <td>Itemized</td>
            </tr>
            <tr>
              <td class="row-number">62</td>
              <td colspan="2">Driver 12% Salary Commission</td>
              <td class="text-right cell-currency text-primary">${CalculationsModule.formatINR(arch.driverSalary || 39240)}</td>
              <td>12% on ${CalculationsModule.formatINR(arch.totalFreight || 327000)}</td>
            </tr>
            <tr class="row-highlight-total">
              <td class="row-number">66</td>
              <td colspan="2"><strong>Total Operating Expenses ($P_2$)</strong></td>
              <td class="text-right font-bold cell-currency text-danger">${CalculationsModule.formatINR(arch.totalExpenses || 212540)}</td>
              <td>SUM(Diesel+FastTag+Exp+Salary)</td>
            </tr>
            <tr class="row-highlight-profit">
              <td class="row-number">67</td>
              <td colspan="2"><strong>Net Operating Profit (September)</strong></td>
              <td class="text-right font-bold cell-currency text-success">${CalculationsModule.formatINR(arch.netProfit || 114460)}</td>
              <td>$P_1 - P_2$</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSept1122ReplicaSheet(arch) {
    const trips = (arch && arch.trips) || [];
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
            ${trips.map((t, idx) => `
              <tr>
                <td class="row-number">${idx + 27}</td>
                <td><strong>${window.escapeHtml(t.route)}</strong></td>
                <td>${window.escapeHtml(t.date)}</td>
                <td class="text-right cell-currency">${CalculationsModule.formatINR(t.freight)}</td>
                <td>${window.escapeHtml(t.note || 'Normal delivery')}</td>
              </tr>
            `).join('')}
            <tr class="row-highlight-total">
              <td class="row-number">32</td>
              <td colspan="2"><strong>Total Freight September</strong></td>
              <td class="text-right font-bold cell-currency">${CalculationsModule.formatINR(arch.totalFreight || 210000)}</td>
              <td></td>
            </tr>
            <tr>
              <td class="row-number">59</td>
              <td colspan="2">Diesel Fuel Total (12 slips)</td>
              <td class="text-right cell-currency">${CalculationsModule.formatINR(arch.diesel || 92000)}</td>
              <td>Reconciled</td>
            </tr>
            <tr>
              <td class="row-number">64</td>
              <td colspan="2">Road Expenses RTA</td>
              <td class="text-right cell-currency">${CalculationsModule.formatINR(arch.roadExpenses || 14500)}</td>
              <td>Itemized</td>
            </tr>
            <tr>
              <td class="row-number">65</td>
              <td colspan="2">Salary Commission 12%</td>
              <td class="text-right cell-currency text-primary">${CalculationsModule.formatINR(arch.salaryCommission || 25200)}</td>
              <td>12% Commission</td>
            </tr>
            <tr class="row-highlight-profit">
              <td class="row-number">70</td>
              <td colspan="2"><strong>Balance with Allam Carried Forward</strong></td>
              <td class="text-right font-bold cell-currency text-warning">${CalculationsModule.formatINR((arch.driverSettlement && arch.driverSettlement.balanceWithAllam) || 62340)}</td>
              <td>Old Balance brought forward to October</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function renderFullReplicaWorkbook(t6666, t1122, pnl6666, pnl1122, drv6666, drv1122, arch) {
    return `
      <div class="full-workbook-view">
        <div style="background: #1e40af; color: #fff; padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-weight: bold; font-size: 1.1rem;">
          📊 Sheet 1: 1122_6666_P&L Account
        </div>
        ${renderPnlReplicaSheet(t6666, t1122, pnl6666, pnl1122)}

        <div style="background: #1e40af; color: #fff; padding: 0.75rem 1rem; border-radius: 6px; margin: 2rem 0 1rem; font-weight: bold; font-size: 1.1rem;">
          👤 Sheet 2: 1122_6666_Driver
        </div>
        ${renderDriverReplicaSheet(t6666, t1122, drv6666, drv1122)}

        <div style="background: #334155; color: #fff; padding: 0.75rem 1rem; border-radius: 6px; margin: 2rem 0 1rem; font-weight: bold; font-size: 1.1rem;">
          📁 Sheet 3: September 2026 Archive - TG15T6666 (Sheet1)
        </div>
        ${renderSept6666ReplicaSheet(arch.TG15T6666 || {})}

        <div style="background: #334155; color: #fff; padding: 0.75rem 1rem; border-radius: 6px; margin: 2rem 0 1rem; font-weight: bold; font-size: 1.1rem;">
          📁 Sheet 4: September 2026 Archive - TS15UE1122 (Sheet2)
        </div>
        ${renderSept1122ReplicaSheet(arch.TS15UE1122 || {})}
      </div>
    `;
  }

  /**
   * Export to genuine Excel (.xlsx) using ExcelJS dynamically
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
      const arch = data.archive_2026_09 || {};

      // -------------------------------------------------------------
      // SHEET 1: 1122_6666_P&L Account
      // -------------------------------------------------------------
      const pnlSheet = workbook.addWorksheet('1122_6666_P&L Account');
      pnlSheet.columns = [
        { width: 5 },  // A
        { width: 5 },  // B
        { width: 24 }, // C (Date Range 6666)
        { width: 30 }, // D (Route 6666)
        { width: 18 }, // E (Amount 6666)
        { width: 6 },  // F
        { width: 22 }, // G
        { width: 6 },  // H
        { width: 6 },  // I
        { width: 24 }, // J (Date Range 1122)
        { width: 30 }, // K (Route 1122)
        { width: 18 }, // L (Amount 1122)
        { width: 25 }  // M
      ];

      // Row 4: Banner
      pnlSheet.getCell('C4').value = "Don't Share Below";
      pnlSheet.getCell('C4').font = { bold: true, color: { argb: 'FF991B1B' } };

      // Row 6: Period
      pnlSheet.getCell('F6').value = "Date";
      pnlSheet.getCell('G6').value = pnl6666.period;
      pnlSheet.getCell('G6').font = { bold: true };

      // Row 8: Truck Headers
      pnlSheet.getCell('C8').value = "TG15T6666";
      pnlSheet.getCell('C8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
      pnlSheet.getCell('C8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

      pnlSheet.getCell('J8').value = "TS15UE1122";
      pnlSheet.getCell('J8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
      pnlSheet.getCell('J8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

      // Trips for TG15T6666 & TS15UE1122
      const t6Trips = data.TG15T6666.trips || [];
      const t1Trips = data.TS15UE1122.trips || [];
      const tripCount = Math.max(t6Trips.length, t1Trips.length);

      for (let i = 0; i < tripCount; i++) {
        const r = 11 + i;
        if (t6Trips[i]) {
          pnlSheet.getCell(`C${r}`).value = t6Trips[i].dateRange;
          pnlSheet.getCell(`D${r}`).value = t6Trips[i].route;
          pnlSheet.getCell(`E${r}`).value = t6Trips[i].pnlFreight;
          pnlSheet.getCell(`E${r}`).numFmt = '#,##,##0';
        }
        if (t1Trips[i]) {
          pnlSheet.getCell(`J${r}`).value = t1Trips[i].dateRange;
          pnlSheet.getCell(`K${r}`).value = t1Trips[i].route;
          pnlSheet.getCell(`L${r}`).value = t1Trips[i].pnlFreight;
          pnlSheet.getCell(`L${r}`).numFmt = '#,##,##0';
        }
      }

      // TS15UE1122 Total
      pnlSheet.getCell('K14').value = "Xp1: Total";
      pnlSheet.getCell('L14').value = { formula: `SUM(L11:L${10 + t1Trips.length})`, result: pnl1122.p1Revenue };
      pnlSheet.getCell('L14').font = { bold: true };
      pnlSheet.getCell('L14').numFmt = '#,##,##0';

      // TG15T6666 Total
      pnlSheet.getCell('C15').value = "P1:Total Sum";
      pnlSheet.getCell('E15').value = { formula: `SUM(E11:E${10 + t6Trips.length})`, result: pnl6666.p1Revenue };
      pnlSheet.getCell('E15').font = { bold: true };
      pnlSheet.getCell('E15').numFmt = '#,##,##0';

      // Diesel Fuel Slips
      const d6Entries = (data.TG15T6666.pl && data.TG15T6666.pl.dieselEntries) || [];
      const d1Entries = (data.TS15UE1122.pl && data.TS15UE1122.pl.dieselEntries) || [];
      const maxDiesel = Math.max(d6Entries.length, d1Entries.length);

      for (let i = 0; i < maxDiesel; i++) {
        const r = 18 + i;
        if (i === 0) {
          pnlSheet.getCell(`D${r}`).value = "Disel";
          pnlSheet.getCell(`K${r}`).value = "Disel";
        }
        if (d6Entries[i]) {
          pnlSheet.getCell(`E${r}`).value = d6Entries[i].amount;
          pnlSheet.getCell(`E${r}`).numFmt = '#,##,##0';
        }
        if (d1Entries[i]) {
          pnlSheet.getCell(`L${r}`).value = d1Entries[i].amount;
          pnlSheet.getCell(`L${r}`).numFmt = '#,##,##0';
        }
      }

      // Operational Deductions
      pnlSheet.getCell('C23').value = pnl6666.period;
      pnlSheet.getCell('D23').value = "Exp";
      pnlSheet.getCell('E23').value = pnl6666.roadExpTotal;
      pnlSheet.getCell('E23').numFmt = '#,##,##0';

      pnlSheet.getCell('J23').value = pnl1122.period;
      pnlSheet.getCell('K23').value = "Exp";
      pnlSheet.getCell('L23').value = pnl1122.roadExpTotal;
      pnlSheet.getCell('L23').numFmt = '#,##,##0';

      pnlSheet.getCell('D24').value = "FastTag";
      pnlSheet.getCell('E24').value = pnl6666.fastTag;
      pnlSheet.getCell('E24').numFmt = '#,##,##0';

      pnlSheet.getCell('K24').value = "FastTag";
      pnlSheet.getCell('L24').value = pnl1122.fastTag;
      pnlSheet.getCell('L24').numFmt = '#,##,##0';

      pnlSheet.getCell('D25').value = "AddBlue & Exp";
      pnlSheet.getCell('E25').value = pnl6666.addBlueAndExp;
      pnlSheet.getCell('E25').numFmt = '#,##,##0';

      pnlSheet.getCell('K25').value = "AddBlue & Exp";
      pnlSheet.getCell('L25').value = pnl1122.addBlueAndExp;
      pnlSheet.getCell('L25').numFmt = '#,##,##0';

      pnlSheet.getCell('D26').value = "Salary";
      pnlSheet.getCell('E26').value = pnl6666.driverSalary;
      pnlSheet.getCell('E26').numFmt = '#,##,##0';

      pnlSheet.getCell('K26').value = "Salary";
      pnlSheet.getCell('L26').value = pnl1122.driverSalary;
      pnlSheet.getCell('L26').numFmt = '#,##,##0';

      // P2 Total Row
      pnlSheet.getCell('D27').value = "P2: Total";
      pnlSheet.getCell('E27').value = { formula: 'SUM(E18:E26)', result: pnl6666.p2Expenses };
      pnlSheet.getCell('E27').font = { bold: true };
      pnlSheet.getCell('E27').numFmt = '#,##,##0';

      pnlSheet.getCell('K27').value = "xp2: Total";
      pnlSheet.getCell('L27').value = { formula: 'SUM(L18:L26)', result: pnl1122.p2Expenses };
      pnlSheet.getCell('L27').font = { bold: true };
      pnlSheet.getCell('L27').numFmt = '#,##,##0';

      // Net Profit Row
      pnlSheet.getCell('D29').value = "P1-P2 Total";
      pnlSheet.getCell('E29').value = { formula: 'E15-E27', result: pnl6666.netProfit };
      pnlSheet.getCell('E29').font = { bold: true, color: { argb: 'FF065F46' } };
      pnlSheet.getCell('E29').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      pnlSheet.getCell('E29').numFmt = '#,##,##0';

      pnlSheet.getCell('J29').value = "04-10-2026 To 20-10-26";
      pnlSheet.getCell('K29').value = "xP1-xP2 Total";
      pnlSheet.getCell('L29').value = { formula: 'L14-L27', result: pnl1122.netProfit };
      pnlSheet.getCell('L29').font = { bold: true, color: { argb: 'FF065F46' } };
      pnlSheet.getCell('L29').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      pnlSheet.getCell('L29').numFmt = '#,##,##0';

      pnlSheet.getCell('M29').value = "Note: Profit";
      pnlSheet.getCell('M29').font = { bold: true, color: { argb: 'FF047857' } };

      // -------------------------------------------------------------
      // SHEET 2: 1122_6666_Driver
      // -------------------------------------------------------------
      const drvSheet = workbook.addWorksheet('1122_6666_Driver');
      drvSheet.columns = [
        { width: 5 },  // A
        { width: 5 },  // B
        { width: 28 }, // C (Road Expenses)
        { width: 14 }, // D (Amount)
        { width: 5 },  // E
        { width: 14 }, // F (Advance Date)
        { width: 28 }, // G (Location)
        { width: 16 }, // H (Amount)
        { width: 16 }, // I
        { width: 5 },  // J
        { width: 25 }, // K (Route)
        { width: 18 }, // L (Driver Account)
        { width: 18 }  // M (Base Freight)
      ];

      drvSheet.getCell('C3').value = "DRI NOOR ALLAM - TG15T6666";
      drvSheet.getCell('C3').font = { bold: true, color: { argb: 'FF1E3A8A' } };
      drvSheet.getCell('F3').value = drv6666.period;

      // Populate Noor Allam Road Expenses
      const exp6666 = data.TG15T6666.roadExpenses || [];
      exp6666.forEach((exp, idx) => {
        const row = idx + 6;
        drvSheet.getCell(`C${row}`).value = exp.description;
        drvSheet.getCell(`D${row}`).value = exp.amount;
        drvSheet.getCell(`D${row}`).numFmt = '#,##,##0';
      });
      const expTotalRow6666 = exp6666.length + 6;
      drvSheet.getCell(`C${expTotalRow6666}`).value = "Total";
      drvSheet.getCell(`D${expTotalRow6666}`).value = { formula: `SUM(D6:D${expTotalRow6666 - 1})`, result: drv6666.itemizedExpensesSum };
      drvSheet.getCell(`D${expTotalRow6666}`).font = { bold: true };
      drvSheet.getCell(`D${expTotalRow6666}`).numFmt = '#,##,##0';

      // Populate Noor Allam Advances
      const adv6666 = data.TG15T6666.advances || [];
      adv6666.forEach((adv, idx) => {
        const row = idx + 9;
        drvSheet.getCell(`F${row}`).value = adv.date;
        drvSheet.getCell(`G${row}`).value = adv.location;
        drvSheet.getCell(`H${row}`).value = adv.amount;
        drvSheet.getCell(`H${row}`).numFmt = '#,##,##0';
      });
      const advTotalRow6666 = Math.max(adv6666.length + 9, 19);
      drvSheet.getCell(`H${advTotalRow6666}`).value = { formula: `SUM(H9:H${advTotalRow6666 - 1})`, result: drv6666.totalAdvances };
      drvSheet.getCell(`H${advTotalRow6666}`).font = { bold: true };
      drvSheet.getCell(`H${advTotalRow6666}`).numFmt = '#,##,##0';

      // Noor Allam Base Trips & 12% Commission
      t6Trips.forEach((t, idx) => {
        const row = idx + 6;
        drvSheet.getCell(`K${row}`).value = t.dateRange;
        drvSheet.getCell(`M${row}`).value = t.baseFreight;
        drvSheet.getCell(`M${row}`).numFmt = '#,##,##0';
      });
      const commRow6666 = Math.max(t6Trips.length + 6, 10);
      drvSheet.getCell(`K${commRow6666}`).value = "Total 12% Coms";
      drvSheet.getCell(`M${commRow6666}`).value = { formula: `SUM(M6:M${commRow6666 - 1})*12%`, result: drv6666.salaryCommission };
      drvSheet.getCell(`M${commRow6666}`).font = { bold: true };
      drvSheet.getCell(`M${commRow6666}`).numFmt = '#,##,##0';

      // Noor Allam Settlement Box
      drvSheet.getCell('K15').value = "Salary 12%";
      drvSheet.getCell('L15').value = drv6666.salaryCommission;
      drvSheet.getCell('L15').numFmt = '#,##,##0';

      drvSheet.getCell('K16').value = "Old Balance";
      drvSheet.getCell('L16').value = drv6666.oldBalance;
      drvSheet.getCell('L16').numFmt = '#,##,##0';

      drvSheet.getCell('K17').value = "Expenses";
      drvSheet.getCell('L17').value = drv6666.claimedExpenses;
      drvSheet.getCell('L17').numFmt = '#,##,##0';

      drvSheet.getCell('K18').value = "Total";
      drvSheet.getCell('L18').value = { formula: 'SUM(L15:L17)', result: drv6666.totalDriverCredit };
      drvSheet.getCell('L18').font = { bold: true };
      drvSheet.getCell('L18').numFmt = '#,##,##0';

      drvSheet.getCell('K19').value = "Advance";
      drvSheet.getCell('L19').value = drv6666.totalAdvances;
      drvSheet.getCell('L19').numFmt = '#,##,##0';

      drvSheet.getCell('K20').value = "Balance";
      drvSheet.getCell('L20').value = { formula: 'L18-L19', result: drv6666.netBalance };
      drvSheet.getCell('L20').font = { bold: true, color: { argb: 'FF065F46' } };
      drvSheet.getCell('L20').numFmt = '#,##,##0';

      drvSheet.getCell('M20').value = drv6666.note;
      drvSheet.getCell('M20').font = { bold: true };

      // TS15UE1122 Driver Section
      drvSheet.getCell('C49').value = "DRI ALLAM BROT - TS15UE1122";
      drvSheet.getCell('C49').font = { bold: true, color: { argb: 'FF1E3A8A' } };
      drvSheet.getCell('F49').value = drv1122.period;

      const exp1122 = data.TS15UE1122.roadExpenses || [];
      exp1122.forEach((exp, idx) => {
        const row = idx + 53;
        drvSheet.getCell(`C${row}`).value = exp.description;
        drvSheet.getCell(`D${row}`).value = exp.amount;
        drvSheet.getCell(`D${row}`).numFmt = '#,##,##0';
      });
      const expTotalRow1122 = exp1122.length + 53;
      drvSheet.getCell(`C${expTotalRow1122}`).value = "Total";
      drvSheet.getCell(`D${expTotalRow1122}`).value = { formula: `SUM(D53:D${expTotalRow1122 - 1})`, result: drv1122.itemizedExpensesSum };
      drvSheet.getCell(`D${expTotalRow1122}`).font = { bold: true };
      drvSheet.getCell(`D${expTotalRow1122}`).numFmt = '#,##,##0';

      // TS15UE1122 Settlement Box
      drvSheet.getCell('F64').value = "Advance Total";
      drvSheet.getCell('H64').value = { formula: 'SUM(H58:H63)', result: drv1122.totalAdvances };
      drvSheet.getCell('H64').font = { bold: true };
      drvSheet.getCell('H64').numFmt = '#,##,##0';

      drvSheet.getCell('F65').value = "EXPENSESS";
      drvSheet.getCell('H65').value = drv1122.claimedExpenses;
      drvSheet.getCell('H65').numFmt = '#,##,##0';

      drvSheet.getCell('F66').value = "Salary 12% Coms";
      drvSheet.getCell('H66').value = drv1122.salaryCommission;
      drvSheet.getCell('H66').numFmt = '#,##,##0';

      drvSheet.getCell('F67').value = "Advance Surplus";
      drvSheet.getCell('H67').value = { formula: 'H64-H65-H66', result: drv1122.advanceSurplus };
      drvSheet.getCell('H67').font = { bold: true };
      drvSheet.getCell('H67').numFmt = '#,##,##0';

      drvSheet.getCell('F68').value = "OLD ALLAM WANT PAY";
      drvSheet.getCell('H68').value = drv1122.oldBalance;
      drvSheet.getCell('H68').numFmt = '#,##,##0';

      drvSheet.getCell('F69').value = "Total Balc with Allam";
      drvSheet.getCell('H69').value = { formula: 'H67+H68', result: drv1122.netBalance };
      drvSheet.getCell('H69').font = { bold: true, color: { argb: 'FFB91C1C' } };
      drvSheet.getCell('H69').numFmt = '#,##,##0';

      drvSheet.getCell('I69').value = drv1122.note;
      drvSheet.getCell('I69').font = { bold: true };

      // -------------------------------------------------------------
      // SHEET 3 & 4: Archives
      // -------------------------------------------------------------
      const s1 = workbook.addWorksheet('Sheet1');
      s1.getCell('A1').value = "TG15T6666 - September 2026 Historical Archive";
      s1.getCell('A1').font = { bold: true };
      s1.getCell('B2').value = "Total Freight P1";
      s1.getCell('C2').value = arch.TG15T6666 ? arch.TG15T6666.totalFreight : 327000;
      s1.getCell('B3').value = "Net Profit";
      s1.getCell('C3').value = arch.TG15T6666 ? arch.TG15T6666.netProfit : 114460;

      const s2 = workbook.addWorksheet('Sheet2');
      s2.getCell('A1').value = "TS15UE1122 - September 2026 Historical Archive";
      s2.getCell('A1').font = { bold: true };
      s2.getCell('B2').value = "Total Freight";
      s2.getCell('C2').value = arch.TS15UE1122 ? arch.TS15UE1122.totalFreight : 210000;
      s2.getCell('B3').value = "Balance Carried Forward";
      s2.getCell('C3').value = 62340;

      // Write binary buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Transport_Brokerage_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);

      if (window.AppModule && window.AppModule.showToast) {
        window.AppModule.showToast('📥 Genuine Excel workbook (.xlsx) exported successfully!', 'success');
      }

    } catch (err) {
      console.error('Excel export error:', err);
      alert('Failed to generate Excel workbook: ' + err.message);
    }
  }

  return {
    renderPnlView,
    renderDriverView,
    renderExcelReplica,
    exportToExcel,
    setZoom,
    toggleFullscreen,
    filterExpenses
  };
})();

if (typeof window !== 'undefined') {
  window.TableModule = TableModule;
}
