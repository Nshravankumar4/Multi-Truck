/**
 * Transport Brokerage Ledger Pvt Ltd
 * Multi-Project & Dynamic Fleet Tables & Spreadsheet Replica Module (P2)
 *
 * Capabilities:
 * - Dynamic P&L Accounts (Supports Any Number of Trucks & Date Filtering)
 * - Fleet Driver Settlement Overview (Fixes BUG-001 when ALL trucks selected)
 * - Itemized Road Expenses with Category Filter Chips
 * - Preserved Reconciliation Box for TG15T6666 ₹35 Discrepancy
 * - 1:1 Live Excel Replica with Zoom Controls (80%, 90%, 100%, 115%) & Fullscreen Mode
 * - Dynamic Genuine ExcelJS Export Preserving Live Formulas (=SUM, 12% Comm)
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
    ['80', '90', '100', '115'].forEach(z => {
      const btn = document.getElementById(`btnZoom${z}`);
      if (btn) {
        btn.className = (Number(z) === Number(level)) ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
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

  function filterExpenses(category) {
    expenseFilterCategory = category;
    const items = document.querySelectorAll('.expense-item-row');
    items.forEach(row => {
      const cat = row.getAttribute('data-category') || '';
      if (category === 'all' || cat.toLowerCase().includes(category.toLowerCase())) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
    const chips = document.querySelectorAll('.chip-btn');
    chips.forEach(c => {
      if (c.getAttribute('data-cat') === category) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  }

  /**
   * Render P&L Detailed Accounts View
   */
  function renderPnlView(truckFilter, filterOptions) {
    const container = document.getElementById('view-pnl');
    if (!container) return;

    let allTrucks = DataModule.getTrucks();
    let targetTrucks = allTrucks;
    if (truckFilter && truckFilter !== 'ALL') {
      targetTrucks = allTrucks.filter(t => t.id === truckFilter);
    }

    const curPrj = DataModule.getCurrentProject();
    const periodDisplay = (filterOptions && filterOptions.period && filterOptions.period !== 'ALL')
      ? "Period: " + filterOptions.period
      : (curPrj.activePeriod ? "Period: " + curPrj.activePeriod : "All Dates");

    let html = `
      <div class="view-header-row">
        <div>
          <h2>💼 Profit &amp; Loss Accounts Ledger</h2>
          <p class="section-subtext">Freight Shipments ($P_1$), Operating Deductions ($P_2$), Diesel Logs, and Net Operating Margins (${periodDisplay})</p>
        </div>
        <div class="header-actions-group">
          <button class="btn btn-primary" onclick="AppModule.openAddModal('trip')">
            ➕ Add Shipment
          </button>
          <button class="btn btn-secondary" onclick="AppModule.openAddModal('diesel')">
            ⛽ Add Fuel Slip
          </button>
          <button class="btn btn-secondary" onclick="TableModule.exportToExcel()">
            📥 Export Excel (.xlsx)
          </button>
        </div>
      </div>
    `;

    targetTrucks.forEach(truck => {
      const pnl = CalcModule.calculateTruckPnL(truck, filterOptions);
      const tId = truck.id;

      html += `
        <div class="pnl-truck-container" style="margin-bottom: 2.5rem; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <!-- Truck Section Header -->
          <div class="truck-section-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.25rem;">
            <div>
              <h3 style="margin: 0; font-size: 1.3rem; color: #1e3a8a;">🚛 ${ApiModule.escapeHtml(truck.regNumber || truck.id)} — ${ApiModule.escapeHtml(truck.driverName)}</h3>
              <span style="font-size: 0.85rem; color: #64748b;">Assigned Driver: ${ApiModule.escapeHtml(truck.driverName)} • Status: ${truck.status}</span>
            </div>
            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <span class="badge ${pnl.isProfitable ? 'badge-success' : 'badge-danger'}" style="font-size: 0.9rem; padding: 0.35rem 0.75rem; border-radius: 6px;">
                Net Profit: ${CalcModule.formatCurrency(pnl.netProfit)} (${pnl.profitMargin}%)
              </span>
            </div>
          </div>

          <!-- P1: Freight Revenue Table -->
          <div class="sub-table-container" style="margin-bottom: 1.5rem;">
            <div class="sub-table-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4 style="margin: 0; color: #15803d; font-size: 1.05rem;">💰 Freight Revenue Shipments ($P_1$) — ${pnl.filteredTrips.length} Trips</h4>
              <button class="btn btn-sm btn-primary" onclick="AppModule.openAddModal('trip', '${tId}')">+ Add Trip</button>
            </div>
            <div style="overflow-x: auto;">
              <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 0.6rem; text-align: left;">#</th>
                    <th style="padding: 0.6rem; text-align: left;">Trip Dates</th>
                    <th style="padding: 0.6rem; text-align: left;">Route (From → To)</th>
                    <th style="padding: 0.6rem; text-align: left;">Transporter</th>
                    <th style="padding: 0.6rem; text-align: right;">Total Freight ($P_1$)</th>
                    <th style="padding: 0.6rem; text-align: right;">Base Freight (12% Comm)</th>
                    <th style="padding: 0.6rem; text-align: right;">Advance Recd</th>
                    <th style="padding: 0.6rem; text-align: right;">Balance Due</th>
                    <th style="padding: 0.6rem; text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${pnl.filteredTrips.map((t, idx) => `
                    <tr class="clickable-row" onclick="AppModule.openEditModal('trip', '${tId}', '${t.id}')" style="cursor: pointer; border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 0.6rem;">${idx + 1}</td>
                      <td style="padding: 0.6rem;"><span class="date-badge">${ApiModule.escapeHtml(t.dates || t.date)}</span></td>
                      <td style="padding: 0.6rem;"><strong>${ApiModule.escapeHtml(t.from)}</strong> → <strong>${ApiModule.escapeHtml(t.to)}</strong></td>
                      <td style="padding: 0.6rem;">${ApiModule.escapeHtml(t.transporter || 'SR TRSP')}</td>
                      <td style="padding: 0.6rem; text-align: right; font-weight: 600; color: #15803d;">${CalcModule.formatCurrency(t.pnlFreight)}</td>
                      <td style="padding: 0.6rem; text-align: right;">${CalcModule.formatCurrency(t.baseFreight)}</td>
                      <td style="padding: 0.6rem; text-align: right;">${CalcModule.formatCurrency(t.advanceReceived)}</td>
                      <td style="padding: 0.6rem; text-align: right; color: ${t.balanceDue > 0 ? '#b91c1c' : '#15803d'}; font-weight: 600;">${CalcModule.formatCurrency(t.balanceDue)}</td>
                      <td style="padding: 0.6rem; text-align: center;" onclick="event.stopPropagation()">
                        <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('trip', '${tId}', '${t.id}')" title="Edit Trip">✏️</button>
                        <button class="btn btn-xs btn-outline-danger admin-only" onclick="AppModule.confirmDelete('trip', '${tId}', '${t.id}')" title="Delete Trip">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                  ${pnl.filteredTrips.length === 0 ? `
                    <tr><td colspan="9" style="text-align: center; padding: 1.5rem; color: #94a3b8;">No shipment trips found matching the selected filter.</td></tr>
                  ` : ''}
                </tbody>
                <tfoot>
                  <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                    <td colspan="4" style="padding: 0.6rem;">Total Freight Revenue ($P_1$ Sum):</td>
                    <td style="padding: 0.6rem; text-align: right; color: #15803d; font-size: 1.05rem;">${CalcModule.formatCurrency(pnl.totalRevenueP1)}</td>
                    <td style="padding: 0.6rem; text-align: right;">${CalcModule.formatCurrency(pnl.totalBaseFreight)}</td>
                    <td colspan="2"></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- P2: Operating Expenses (Diesel & Operational Deductions) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            <!-- Diesel Logs -->
            <div class="sub-table-container">
              <div class="sub-table-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="margin: 0; color: #2563eb; font-size: 1rem;">⛽ Diesel Fuel Slips (${pnl.filteredDiesel.length} Entries)</h4>
                <button class="btn btn-sm btn-primary" onclick="AppModule.openAddModal('diesel', '${tId}')">+ Add Fuel</button>
              </div>
              <div style="overflow-x: auto;">
                <table class="data-table" style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                      <th style="padding: 0.5rem; text-align: left;">#</th>
                      <th style="padding: 0.5rem; text-align: left;">Date</th>
                      <th style="padding: 0.5rem; text-align: left;">Pump Station</th>
                      <th style="padding: 0.5rem; text-align: right;">Amount</th>
                      <th style="padding: 0.5rem; text-align: center;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pnl.filteredDiesel.map((d, dIdx) => `
                      <tr class="clickable-row" onclick="AppModule.openEditModal('diesel', '${tId}', '${d.id}')" style="cursor: pointer; border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 0.5rem;">${dIdx + 1}</td>
                        <td style="padding: 0.5rem;"><span class="date-badge">${ApiModule.escapeHtml(d.date)}</span></td>
                        <td style="padding: 0.5rem;">${ApiModule.escapeHtml(d.pump || 'Highway Pump')}</td>
                        <td style="padding: 0.5rem; text-align: right; font-weight: 600;">${CalcModule.formatCurrency(d.amount)}</td>
                        <td style="padding: 0.5rem; text-align: center;" onclick="event.stopPropagation()">
                          <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('diesel', '${tId}', '${d.id}')">✏️</button>
                          <button class="btn btn-xs btn-outline-danger admin-only" onclick="AppModule.confirmDelete('diesel', '${tId}', '${d.id}')">🗑️</button>
                        </td>
                      </tr>
                    `).join('')}
                    ${pnl.filteredDiesel.length === 0 ? `<tr><td colspan="5" style="text-align: center; padding: 1rem; color: #94a3b8;">No fuel entries.</td></tr>` : ''}
                  </tbody>
                  <tfoot>
                    <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                      <td colspan="3" style="padding: 0.5rem;">Diesel Subtotal:</td>
                      <td style="padding: 0.5rem; text-align: right; color: #2563eb;">${CalcModule.formatCurrency(pnl.totalDiesel)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Other Operating Expenses Breakdown -->
            <div class="sub-table-container">
              <div class="sub-table-header" style="margin-bottom: 0.5rem;">
                <h4 style="margin: 0; color: #b91c1c; font-size: 1rem;">📉 Other Operating Deductions</h4>
              </div>
              <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 0.5rem; text-align: left;">Category</th>
                    <th style="padding: 0.5rem; text-align: left;">Basis</th>
                    <th style="padding: 0.5rem; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.5rem;"><strong>🛣️ FastTag Tolls</strong></td>
                    <td style="padding: 0.5rem; color: #64748b;">National Highway Portals</td>
                    <td style="padding: 0.5rem; text-align: right; font-weight: 600;">${CalcModule.formatCurrency(pnl.fastTag)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.5rem;"><strong>🧪 AddBlue &amp; Misc</strong></td>
                    <td style="padding: 0.5rem; color: #64748b;">Exhaust fluid &amp; maintenance</td>
                    <td style="padding: 0.5rem; text-align: right; font-weight: 600;">${CalcModule.formatCurrency(pnl.addBlueAndMisc)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.5rem;"><strong>🚨 Road / RTA / Police Exp</strong></td>
                    <td style="padding: 0.5rem; color: #64748b;">Itemized en-route receipts</td>
                    <td style="padding: 0.5rem; text-align: right; font-weight: 600;">${CalcModule.formatCurrency(pnl.totalRoadExp)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.5rem;"><strong>👨‍✈️ Driver Salary Commission</strong></td>
                    <td style="padding: 0.5rem; color: #64748b;">12% on ${CalcModule.formatCurrency(pnl.totalBaseFreight)} base</td>
                    <td style="padding: 0.5rem; text-align: right; font-weight: 600; color: #16a34a;">${CalcModule.formatCurrency(pnl.driverCommission)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                    <td colspan="2" style="padding: 0.5rem;">Total Operating Expenses ($P_2$):</td>
                    <td style="padding: 0.5rem; text-align: right; color: #b91c1c; font-size: 1.05rem;">${CalcModule.formatCurrency(pnl.totalExpensesP2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Mathematical Equation Card -->
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.95rem; color: #14532d;">
              <strong>Equation Verification:</strong> 
              Freight Revenue ($P_1$: ${CalcModule.formatCurrency(pnl.totalRevenueP1)}) − Operating Expenses ($P_2$: ${CalcModule.formatCurrency(pnl.totalExpensesP2)}) = <strong>Net Profit</strong>
            </div>
            <div style="font-size: 1.25rem; font-weight: bold; color: #15803d;">
              ${CalcModule.formatCurrency(pnl.netProfit)} (${pnl.profitMargin}%)
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render Driver Settlements View
   * Fixes BUG-001: When ALL trucks selected, renders fleet driver overview instead of first truck only!
   */
  function renderDriverView(truckFilter, filterOptions) {
    const container = document.getElementById('view-driver');
    if (!container) return;

    const allTrucks = DataModule.getTrucks();
    const isAll = (!truckFilter || truckFilter === 'ALL');

    let html = `
      <div class="view-header-row">
        <div>
          <h2>👤 Driver Settlement &amp; Advances Ledger</h2>
          <p class="section-subtext">Authoritative 12% Salary Commissions, Advance Deductions, and En-Route Road Expenses</p>
        </div>
        <div class="header-actions-group">
          <!-- Dynamic Driver Switcher Pills -->
          <div class="driver-switch-pills" style="display: flex; gap: 0.35rem;">
            <button class="btn btn-sm ${isAll ? 'btn-primary' : 'btn-secondary'}" onclick="AppModule.selectTruckFilter('ALL');">
              🚛 All Drivers Combined
            </button>
            ${allTrucks.map(t => `
              <button class="btn btn-sm ${truckFilter === t.id ? 'btn-primary' : 'btn-secondary'}" onclick="AppModule.selectTruckFilter('${t.id}');">
                ${ApiModule.escapeHtml(t.driverName)} (${ApiModule.escapeHtml(t.regNumber || t.id)})
              </button>
            `).join('')}
          </div>
          <button class="btn btn-primary" onclick="AppModule.openAddModal('advance')">
            💵 Record Advance
          </button>
          <button class="btn btn-secondary" onclick="AppModule.openAddModal('expense')">
            🚨 Add Road Expense
          </button>
        </div>
      </div>
    `;

    // --- CASE 1: ALL FLEET COMBINED OVERVIEW ---
    if (isAll) {
      const fleet = CalcModule.calculateFleetTotals(allTrucks, filterOptions);

      html += `
        <!-- Fleet Overview Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
            <span style="font-size: 0.78rem; color: #64748b; font-weight: 600;">TOTAL 12% COMMISSIONS</span>
            <div style="font-size: 1.4rem; font-weight: bold; color: #16a34a; margin-top: 0.25rem;">${CalcModule.formatCurrency(fleet.combinedCommission)}</div>
            <small style="color: #64748b;">Earned across ${allTrucks.length} drivers</small>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
            <span style="font-size: 0.78rem; color: #64748b; font-weight: 600;">TOTAL ADVANCES PAID</span>
            <div style="font-size: 1.4rem; font-weight: bold; color: #b91c1c; margin-top: 0.25rem;">${CalcModule.formatCurrency(fleet.totalAdvances)}</div>
            <small style="color: #64748b;">Cash, UPI, &amp; Bank Transfers</small>
          </div>
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 1rem;">
            <span style="font-size: 0.78rem; color: #15803d; font-weight: 600;">PAYABLE TO DRIVERS</span>
            <div style="font-size: 1.4rem; font-weight: bold; color: #15803d; margin-top: 0.25rem;">${CalcModule.formatCurrency(fleet.totalPayableToDrivers)}</div>
            <small style="color: #15803d;">Company owes to drivers</small>
          </div>
          <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 1rem;">
            <span style="font-size: 0.78rem; color: #991b1b; font-weight: 600;">RECEIVABLE FROM DRIVERS</span>
            <div style="font-size: 1.4rem; font-weight: bold; color: #991b1b; margin-top: 0.25rem;">${CalcModule.formatCurrency(fleet.totalReceivableFromDrivers)}</div>
            <small style="color: #991b1b;">Drivers owe to company</small>
          </div>
        </div>

        <!-- Fleet Driver Accounts Table -->
        <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem; margin-bottom: 2rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1.15rem; color: #1e3a8a;">📋 Fleet Driver Accounts Summary</h3>
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 0.6rem; text-align: left;">Driver Name</th>
                <th style="padding: 0.6rem; text-align: left;">Assigned Truck</th>
                <th style="padding: 0.6rem; text-align: right;">Base Freight</th>
                <th style="padding: 0.6rem; text-align: right;">12% Commission</th>
                <th style="padding: 0.6rem; text-align: right;">Road Expenses</th>
                <th style="padding: 0.6rem; text-align: right;">Advances Paid</th>
                <th style="padding: 0.6rem; text-align: right;">Old Balance</th>
                <th style="padding: 0.6rem; text-align: right;">Net Balance</th>
                <th style="padding: 0.6rem; text-align: center;">Status / Action</th>
                <th style="padding: 0.6rem; text-align: center;">Details</th>
              </tr>
            </thead>
            <tbody>
              ${fleet.driverSettlements.map(drv => {
                const isPayable = drv.netDirection === "PAYABLE_TO_DRIVER";
                return `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.6rem;"><strong>${ApiModule.escapeHtml(drv.driverName)}</strong></td>
                    <td style="padding: 0.6rem;"><span class="badge badge-neutral">${ApiModule.escapeHtml(drv.regNumber)}</span></td>
                    <td style="padding: 0.6rem; text-align: right;">${CalcModule.formatCurrency(drv.totalBaseFreight)}</td>
                    <td style="padding: 0.6rem; text-align: right; color: #16a34a; font-weight: 600;">${CalcModule.formatCurrency(drv.commission12Pct)}</td>
                    <td style="padding: 0.6rem; text-align: right;">${CalcModule.formatCurrency(drv.claimedExpenses)}</td>
                    <td style="padding: 0.6rem; text-align: right; color: #b91c1c;">${CalcModule.formatCurrency(drv.totalAdvances)}</td>
                    <td style="padding: 0.6rem; text-align: right;">${CalcModule.formatCurrency(drv.oldBalance)}</td>
                    <td style="padding: 0.6rem; text-align: right; font-weight: bold; font-size: 1.05rem; color: ${isPayable ? '#15803d' : '#b91c1c'};">
                      ${CalcModule.formatCurrency(drv.netBalance)}
                    </td>
                    <td style="padding: 0.6rem; text-align: center;">
                      <span class="badge ${isPayable ? 'badge-success' : 'badge-danger'}">
                        ${isPayable ? 'Pay Driver' : 'Driver Owes'}
                      </span>
                    </td>
                    <td style="padding: 0.6rem; text-align: center;">
                      <button class="btn btn-xs btn-primary" onclick="AppModule.selectTruckFilter('${drv.truckId}');">View Ledger →</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // --- CASE 2: INDIVIDUAL DRIVER LEDGER ---
    const targetTrucks = isAll ? allTrucks : allTrucks.filter(t => t.id === truckFilter);

    targetTrucks.forEach(truck => {
      const drv = CalcModule.calculateDriverSettlement(truck, filterOptions);
      if (!drv) return;
      const isPayable = drv.netDirection === "PAYABLE_TO_DRIVER";

      html += `
        <div class="driver-ledger-card" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; margin-bottom: 2rem;">
          <!-- Driver Statement Header Box -->
          <div style="background: ${isPayable ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${isPayable ? '#86efac' : '#fca5a5'}; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${isPayable ? '#bbf7d0' : '#fecaca'}; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
              <div>
                <h3 style="margin: 0; color: ${isPayable ? '#14532d' : '#7f1d1d'}; font-size: 1.25rem;">
                  👤 ${ApiModule.escapeHtml(drv.driverName)} — ${ApiModule.escapeHtml(drv.regNumber)}
                </h3>
                <span style="font-size: 0.82rem; color: #64748b;">${drv.statusNote}</span>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 0.8rem; text-transform: uppercase; font-weight: bold; color: ${isPayable ? '#15803d' : '#b91c1c'};">
                  ${isPayable ? 'Company Wants to Pay' : 'Driver Wants to Pay'}
                </span>
                <div style="font-size: 1.7rem; font-weight: bold; color: ${isPayable ? '#15803d' : '#b91c1c'};">
                  ${CalcModule.formatCurrency(drv.netBalance)}
                </div>
              </div>
            </div>

            <!-- Mathematical Formula Breakdown -->
            <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; font-size: 0.88rem; color: #334155;">
              <div>12% Salary: <strong>${CalcModule.formatCurrency(drv.commission12Pct)}</strong></div>
              <div>+ Road Exp: <strong>${CalcModule.formatCurrency(drv.claimedExpenses)}</strong></div>
              <div>+ Old Bal: <strong>${CalcModule.formatCurrency(drv.oldBalance)}</strong></div>
              <div>− Advances: <strong style="color: #b91c1c;">${CalcModule.formatCurrency(drv.totalAdvances)}</strong></div>
              <div>= Net: <strong style="color: ${isPayable ? '#15803d' : '#b91c1c'};">${CalcModule.formatCurrency(drv.netBalance)}</strong></div>
            </div>

            ${drv.hasReconciliationVariance ? `
              <!-- Explicit ₹35 Discrepancy Reconciliation Box -->
              <div style="margin-top: 0.75rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 0.6rem; font-size: 0.8rem; color: #92400e;">
                ⚠️ <strong>Audit Reconciliation Note:</strong> Itemized receipts sum to <strong>${CalcModule.formatCurrency(drv.itemizedRoadExpenses)}</strong>, 
                while driver claimed voucher reflects <strong>${CalcModule.formatCurrency(drv.claimedExpenses)}</strong> 
                (Variance: <strong>₹${drv.reconciliationDiff}</strong> preserved separately per source workbook audit).
              </div>
            ` : ''}
          </div>

          <!-- 2 Columns: 12% Commissions & Advances -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            <!-- Eligible Base Freight Trips -->
            <div class="sub-table-container">
              <div class="sub-table-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="margin: 0; color: #16a34a; font-size: 1rem;">🚛 Eligible Base Freight (12% Commission)</h4>
                <span class="badge badge-success">Rate: 12.0%</span>
              </div>
              <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 0.5rem; text-align: left;">Trip Dates</th>
                    <th style="padding: 0.5rem; text-align: left;">Route</th>
                    <th style="padding: 0.5rem; text-align: right;">Base Freight</th>
                    <th style="padding: 0.5rem; text-align: right;">12% Commission</th>
                  </tr>
                </thead>
                <tbody>
                  ${drv.filteredTrips.map(tr => `
                    <tr class="clickable-row" onclick="AppModule.openEditModal('trip', '${truck.id}', '${tr.id}')" style="cursor: pointer; border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 0.5rem;"><span class="date-badge">${ApiModule.escapeHtml(tr.dates || tr.date)}</span></td>
                      <td style="padding: 0.5rem;">${ApiModule.escapeHtml(tr.from)} → ${ApiModule.escapeHtml(tr.to)}</td>
                      <td style="padding: 0.5rem; text-align: right;">${CalcModule.formatCurrency(tr.baseFreight)}</td>
                      <td style="padding: 0.5rem; text-align: right; color: #16a34a; font-weight: 600;">${CalcModule.formatCurrency(Math.round(tr.baseFreight * 0.12))}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                    <td colspan="2" style="padding: 0.5rem;">Total (12% Formula):</td>
                    <td style="padding: 0.5rem; text-align: right;">${CalcModule.formatCurrency(drv.totalBaseFreight)}</td>
                    <td style="padding: 0.5rem; text-align: right; color: #16a34a;">${CalcModule.formatCurrency(drv.commission12Pct)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Advances Taken -->
            <div class="sub-table-container">
              <div class="sub-table-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="margin: 0; color: #b91c1c; font-size: 1rem;">💵 Driver Advances (${drv.filteredAdvances.length} Slips)</h4>
                <button class="btn btn-sm btn-primary" onclick="AppModule.openAddModal('advance', '${truck.id}')">+ Add</button>
              </div>
              <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 0.5rem; text-align: left;">Date</th>
                    <th style="padding: 0.5rem; text-align: left;">Location / Narration</th>
                    <th style="padding: 0.5rem; text-align: left;">Mode</th>
                    <th style="padding: 0.5rem; text-align: right;">Amount</th>
                    <th style="padding: 0.5rem; text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${drv.filteredAdvances.map(a => `
                    <tr class="clickable-row" onclick="AppModule.openEditModal('advance', '${truck.id}', '${a.id}')" style="cursor: pointer; border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 0.5rem;"><span class="date-badge">${ApiModule.escapeHtml(a.date)}</span></td>
                      <td style="padding: 0.5rem;">${ApiModule.escapeHtml(a.location)}</td>
                      <td style="padding: 0.5rem;"><span class="badge badge-neutral">${ApiModule.escapeHtml(a.mode || 'Cash')}</span></td>
                      <td style="padding: 0.5rem; text-align: right; color: #b91c1c; font-weight: 600;">${CalcModule.formatCurrency(a.amount)}</td>
                      <td style="padding: 0.5rem; text-align: center;" onclick="event.stopPropagation()">
                        <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('advance', '${truck.id}', '${a.id}')">✏️</button>
                        <button class="btn btn-xs btn-outline-danger admin-only" onclick="AppModule.confirmDelete('advance', '${truck.id}', '${a.id}')">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                    <td colspan="3" style="padding: 0.5rem;">Total Advances:</td>
                    <td style="padding: 0.5rem; text-align: right; color: #b91c1c;">${CalcModule.formatCurrency(drv.totalAdvances)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Itemized Road Expenses Ledger -->
          <div class="sub-table-container">
            <div class="sub-table-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4 style="margin: 0; color: #eab308; font-size: 1rem;">🚨 Itemized Road Expenses (${drv.filteredRoadExpenses.length} Receipts)</h4>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-primary" onclick="AppModule.openAddModal('expense', '${truck.id}')">+ Add Expense</button>
              </div>
            </div>
            <div style="overflow-x: auto;">
              <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 0.5rem; text-align: left;">#</th>
                    <th style="padding: 0.5rem; text-align: left;">Description</th>
                    <th style="padding: 0.5rem; text-align: left;">Category</th>
                    <th style="padding: 0.5rem; text-align: right;">Amount</th>
                    <th style="padding: 0.5rem; text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${drv.filteredRoadExpenses.map((e, eIdx) => `
                    <tr class="clickable-row expense-item-row" data-category="${ApiModule.escapeAttr(e.category || '')}" onclick="AppModule.openEditModal('expense', '${truck.id}', '${e.id}')" style="cursor: pointer; border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 0.5rem;">${eIdx + 1}</td>
                      <td style="padding: 0.5rem;"><strong>${ApiModule.escapeHtml(e.desc)}</strong></td>
                      <td style="padding: 0.5rem;"><span class="badge badge-neutral">${ApiModule.escapeHtml(e.category || 'General')}</span></td>
                      <td style="padding: 0.5rem; text-align: right; font-weight: 600;">${CalcModule.formatCurrency(e.amount)}</td>
                      <td style="padding: 0.5rem; text-align: center;" onclick="event.stopPropagation()">
                        <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('expense', '${truck.id}', '${e.id}')">✏️</button>
                        <button class="btn btn-xs btn-outline-danger admin-only" onclick="AppModule.confirmDelete('expense', '${truck.id}', '${e.id}')">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                    <td colspan="3" style="padding: 0.5rem;">Itemized Receipts Total:</td>
                    <td style="padding: 0.5rem; text-align: right; color: #1e3a8a;">${CalcModule.formatCurrency(drv.itemizedRoadExpenses)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render Excel 1:1 Live Replica Worksheets
   */
  function renderExcelReplica(tabName) {
    if (tabName) currentReplicaTab = tabName;
    const container = document.getElementById('view-excel');
    if (!container) return;

    const trucks = DataModule.getTrucks();
    const t6666 = trucks.find(t => t.id === 'TG15T6666') || trucks[0] || {};
    const t1122 = trucks.find(t => t.id === 'TS15UE1122') || trucks[1] || {};

    const pnl6666 = CalcModule.calculateTruckPnL(t6666, { period: '2026-10' });
    const pnl1122 = CalcModule.calculateTruckPnL(t1122, { period: '2026-10' });
    const drv6666 = CalcModule.calculateDriverSettlement(t6666, { period: '2026-10' });
    const drv1122 = CalcModule.calculateDriverSettlement(t1122, { period: '2026-10' });

    let html = `
      <div class="view-header-row">
        <div>
          <h2>📑 Excel 1:1 Live Replica Worksheets</h2>
          <p class="section-subtext">Interactive replica matching master workbooks cell-for-cell with live formula tooltips, click-to-edit, and zoom controls</p>
        </div>
        <div class="header-actions-group">
          <button class="btn btn-sm btn-secondary" id="btnToggleFullscreen" onclick="TableModule.toggleFullscreen()">
            ${isFullscreen ? '✕ Exit Full Screen' : '⛶ Full Screen'}
          </button>
          <div class="excel-zoom-group" style="display: flex; gap: 0.25rem; align-items: center;">
            <span class="zoom-label" style="font-size: 0.8rem; color: #64748b;">Zoom:</span>
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

      <div class="excel-tabs-bar" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">
        <button class="btn btn-sm ${currentReplicaTab === 'pnl' ? 'btn-primary' : 'btn-secondary'}" onclick="TableModule.renderExcelReplica('pnl')">
          📊 1122_6666_P&amp;L Account
        </button>
        <button class="btn btn-sm ${currentReplicaTab === 'driver' ? 'btn-primary' : 'btn-secondary'}" onclick="TableModule.renderExcelReplica('driver')">
          👤 1122_6666_Driver
        </button>
        <button class="btn btn-sm ${currentReplicaTab === 'sept6666' ? 'btn-primary' : 'btn-secondary'}" onclick="TableModule.renderExcelReplica('sept6666')">
          📁 Sept 2026 - TG15T6666 (Sheet1)
        </button>
        <button class="btn btn-sm ${currentReplicaTab === 'sept1122' ? 'btn-primary' : 'btn-secondary'}" onclick="TableModule.renderExcelReplica('sept1122')">
          📁 Sept 2026 - TS15UE1122 (Sheet2)
        </button>
      </div>

      <div class="excel-replica-outer-wrapper" style="overflow: auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1rem;">
        <div id="excelReplicaGrid" style="transform: scale(${currentZoom / 100}); transform-origin: top left; width: ${100 / (currentZoom / 100)}%;">
    `;

    if (currentReplicaTab === 'pnl') {
      html += renderPnlReplicaSheet(t6666, t1122, pnl6666, pnl1122);
    } else if (currentReplicaTab === 'driver') {
      html += renderDriverReplicaSheet(t6666, t1122, drv6666, drv1122);
    } else if (currentReplicaTab === 'sept6666') {
      html += renderSeptReplicaSheet(t6666, 'TG15T6666');
    } else {
      html += renderSeptReplicaSheet(t1122, 'TS15UE1122');
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function renderPnlReplicaSheet(t6666, t1122, pnl6666, pnl1122) {
    const trips6666 = (t6666.trips || []).filter(t => t.period === '2026-10');
    const trips1122 = (t1122.trips || []).filter(t => t.period === '2026-10');
    const diesel6666 = (t6666.diesel || []).filter(d => d.period === '2026-10');
    const diesel1122 = (t1122.diesel || []).filter(d => d.period === '2026-10');

    return `
      <table class="excel-grid-table" style="width: 100%; border-collapse: collapse; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 0.82rem;">
        <thead>
          <tr style="background: #1e3a8a; color: #ffffff; text-align: center; font-weight: bold;">
            <th colspan="3" style="border: 1px solid #cbd5e1; padding: 6px;">TG15T6666 (Noor Allam) — 01-10-2026 To 20-10-2026</th>
            <th style="width: 20px; background: #94a3b8; border: 1px solid #cbd5e1;"></th>
            <th colspan="3" style="border: 1px solid #cbd5e1; padding: 6px;">TS15UE1122 (Allam Brother) — 04-10-2026 To 20-10-2026</th>
          </tr>
          <tr style="background: #f1f5f9; font-weight: 600; text-align: left;">
            <th style="border: 1px solid #cbd5e1; padding: 5px;">Date Range</th>
            <th style="border: 1px solid #cbd5e1; padding: 5px;">Route Description</th>
            <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: right;">Freight (₹)</th>
            <th style="background: #94a3b8; border: 1px solid #cbd5e1;"></th>
            <th style="border: 1px solid #cbd5e1; padding: 5px;">Date Range</th>
            <th style="border: 1px solid #cbd5e1; padding: 5px;">Route Description</th>
            <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: right;">Freight (₹)</th>
          </tr>
        </thead>
        <tbody>
          <!-- Freight Rows -->
          ${[0, 1, 2, 3].map(i => {
            const tr6 = trips6666[i];
            const tr1 = trips1122[i];
            return `
              <tr>
                <td style="border: 1px solid #cbd5e1; padding: 5px;">${tr6 ? ApiModule.escapeHtml(tr6.dates || tr6.date) : ''}</td>
                <td style="border: 1px solid #cbd5e1; padding: 5px;">${tr6 ? ApiModule.escapeHtml(tr6.from + ' TO ' + tr6.to) : ''}</td>
                <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: right; font-weight: 600; color: #15803d;">${tr6 ? CalcModule.formatCurrency(tr6.pnlFreight) : ''}</td>
                <td style="background: #94a3b8; border: 1px solid #cbd5e1;"></td>
                <td style="border: 1px solid #cbd5e1; padding: 5px;">${tr1 ? ApiModule.escapeHtml(tr1.dates || tr1.date) : ''}</td>
                <td style="border: 1px solid #cbd5e1; padding: 5px;">${tr1 ? ApiModule.escapeHtml(tr1.from + ' TO ' + tr1.to) : ''}</td>
                <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: right; font-weight: 600; color: #15803d;">${tr1 ? CalcModule.formatCurrency(tr1.pnlFreight) : ''}</td>
              </tr>
            `;
          }).join('')}
          <tr style="background: #e2e8f0; font-weight: bold;">
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 6px;">P1: Total Freight Sum</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; color: #15803d; font-size: 0.95rem;">${CalcModule.formatCurrency(pnl6666.totalRevenueP1)}</td>
            <td style="background: #94a3b8; border: 1px solid #cbd5e1;"></td>
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 6px;">xP1: Total Freight Sum</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; color: #15803d; font-size: 0.95rem;">${CalcModule.formatCurrency(pnl1122.totalRevenueP1)}</td>
          </tr>
          <!-- Section Separator -->
          <tr style="background: #cbd5e1; font-weight: bold;">
            <td colspan="3" style="border: 1px solid #94a3b8; padding: 4px; text-align: center;">OPERATING DEDUCTIONS (P2)</td>
            <td style="background: #94a3b8; border: 1px solid #cbd5e1;"></td>
            <td colspan="3" style="border: 1px solid #94a3b8; padding: 4px; text-align: center;">OPERATING DEDUCTIONS (xP2)</td>
          </tr>
          <!-- Diesel Rows -->
          ${[0, 1, 2, 3, 4].map(i => {
            const d6 = diesel6666[i];
            const d1 = diesel1122[i];
            return `
              <tr>
                <td style="border: 1px solid #cbd5e1; padding: 4px; color: #64748b;">Diesel Slip ${i + 1}</td>
                <td style="border: 1px solid #cbd5e1; padding: 4px;">${d6 ? ApiModule.escapeHtml(d6.pump) : ''}</td>
                <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: right;">${d6 ? CalcModule.formatCurrency(d6.amount) : ''}</td>
                <td style="background: #94a3b8; border: 1px solid #cbd5e1;"></td>
                <td style="border: 1px solid #cbd5e1; padding: 4px; color: #64748b;">Diesel Slip ${i + 1}</td>
                <td style="border: 1px solid #cbd5e1; padding: 4px;">${d1 ? ApiModule.escapeHtml(d1.pump) : ''}</td>
                <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: right;">${d1 ? CalcModule.formatCurrency(d1.amount) : ''}</td>
              </tr>
            `;
          }).join('')}
          <tr>
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 4px;">En-route Road Expenses</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: right;">${CalcModule.formatCurrency(pnl6666.totalRoadExp)}</td>
            <td style="background: #94a3b8; border: 1px solid #cbd5e1;"></td>
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 4px;">En-route Road Expenses</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: right;">${CalcModule.formatCurrency(pnl1122.totalRoadExp)}</td>
          </tr>
          <tr>
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 4px;">FastTag Tolls</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: right;">${CalcModule.formatCurrency(pnl6666.fastTag)}</td>
            <td style="background: #94a3b8; border: 1px solid #cbd5e1;"></td>
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 4px;">FastTag Tolls</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: right;">${CalcModule.formatCurrency(pnl1122.fastTag)}</td>
          </tr>
          <tr>
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 4px;">AddBlue &amp; Maintenance</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: right;">${CalcModule.formatCurrency(pnl6666.addBlueAndMisc)}</td>
            <td style="background: #94a3b8; border: 1px solid #cbd5e1;"></td>
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 4px;">AddBlue &amp; Maintenance</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: right;">${CalcModule.formatCurrency(pnl1122.addBlueAndMisc)}</td>
          </tr>
          <tr>
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 4px;">Driver Salary (12% Commission)</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: right; color: #16a34a; font-weight: 600;">${CalcModule.formatCurrency(pnl6666.driverCommission)}</td>
            <td style="background: #94a3b8; border: 1px solid #cbd5e1;"></td>
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 4px;">Driver Salary (12% Commission)</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: right; color: #16a34a; font-weight: 600;">${CalcModule.formatCurrency(pnl1122.driverCommission)}</td>
          </tr>
          <tr style="background: #e2e8f0; font-weight: bold;">
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 6px;">P2: Total Operating Expenses</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; color: #b91c1c; font-size: 0.95rem;">${CalcModule.formatCurrency(pnl6666.totalExpensesP2)}</td>
            <td style="background: #94a3b8; border: 1px solid #cbd5e1;"></td>
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 6px;">xp2: Total Operating Expenses</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; color: #b91c1c; font-size: 0.95rem;">${CalcModule.formatCurrency(pnl1122.totalExpensesP2)}</td>
          </tr>
          <tr style="background: #dcfce7; font-weight: bold; border-top: 2px solid #16a34a;">
            <td colspan="2" style="border: 1px solid #86efac; padding: 8px; font-size: 1rem; color: #14532d;">P1 − P2 Net Operating Profit</td>
            <td style="border: 1px solid #86efac; padding: 8px; text-align: right; font-size: 1.1rem; color: #15803d;">${CalcModule.formatCurrency(pnl6666.netProfit)}</td>
            <td style="background: #94a3b8; border: 1px solid #cbd5e1;"></td>
            <td colspan="2" style="border: 1px solid #86efac; padding: 8px; font-size: 1rem; color: #14532d;">xP1 − xP2 Net Operating Profit</td>
            <td style="border: 1px solid #86efac; padding: 8px; text-align: right; font-size: 1.1rem; color: #15803d;">${CalcModule.formatCurrency(pnl1122.netProfit)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  function renderDriverReplicaSheet(t6666, t1122, drv6666, drv1122) {
    return `
      <div style="padding: 1rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
        <h4 style="margin: 0 0 1rem 0; color: #1e3a8a;">1122_6666_Driver Authoritative Settlements</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
          <!-- Left: Noor Allam -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; padding: 1rem; border-radius: 6px;">
            <h5 style="margin: 0 0 0.5rem 0; color: #15803d;">TG15T6666 (Noor Allam)</h5>
            <div style="font-size: 0.85rem; line-height: 1.6;">
              <div>12% Salary Commission: <strong>${CalcModule.formatCurrency(drv6666.commission12Pct)}</strong></div>
              <div>Itemized Road Receipts (37 items): <strong>${CalcModule.formatCurrency(drv6666.itemizedRoadExpenses)}</strong></div>
              <div>Claimed Road Expenses: <strong>${CalcModule.formatCurrency(drv6666.claimedExpenses)}</strong> (Reconciliation Diff: ₹${drv6666.reconciliationDiff})</div>
              <div>Old Balance Due to Driver: <strong>${CalcModule.formatCurrency(drv6666.oldBalance)}</strong></div>
              <div>Advances Paid (10 slips): <strong style="color: #b91c1c;">${CalcModule.formatCurrency(drv6666.totalAdvances)}</strong></div>
              <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e2e8f0; font-size: 1rem; font-weight: bold; color: #15803d;">
                Net Balance: ${CalcModule.formatCurrency(drv6666.netBalance)} (Shankar pays Noor Allam)
              </div>
            </div>
          </div>
          <!-- Right: Allam Brother -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; padding: 1rem; border-radius: 6px;">
            <h5 style="margin: 0 0 0.5rem 0; color: #b91c1c;">TS15UE1122 (Allam Brother)</h5>
            <div style="font-size: 0.85rem; line-height: 1.6;">
              <div>12% Salary Commission: <strong>${CalcModule.formatCurrency(drv1122.commission12Pct)}</strong></div>
              <div>Road Receipts (22 items): <strong>${CalcModule.formatCurrency(drv1122.itemizedRoadExpenses)}</strong></div>
              <div>Old Balance Owed by Driver: <strong>${CalcModule.formatCurrency(drv1122.oldBalance)}</strong></div>
              <div>Advances Paid (6 slips): <strong style="color: #b91c1c;">${CalcModule.formatCurrency(drv1122.totalAdvances)}</strong></div>
              <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e2e8f0; font-size: 1rem; font-weight: bold; color: #b91c1c;">
                Net Balance: ${CalcModule.formatCurrency(drv1122.netBalance)} (Allam Brother pays Shankar)
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSeptReplicaSheet(truck, label) {
    const trips = (truck.trips || []).filter(t => t.period === '2026-09');
    return `
      <div style="padding: 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px;">
        <h4 style="margin: 0 0 0.5rem 0; color: #475569;">September 2026 Historical Archive — ${label}</h4>
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 5px; text-align: left;">Trip Dates</th>
              <th style="padding: 5px; text-align: left;">Route</th>
              <th style="padding: 5px; text-align: right;">Freight (₹)</th>
              <th style="padding: 5px; text-align: right;">Advance Recd</th>
              <th style="padding: 5px; text-align: right;">Balance Due</th>
            </tr>
          </thead>
          <tbody>
            ${trips.map(t => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 5px;">${ApiModule.escapeHtml(t.dates || t.date)}</td>
                <td style="padding: 5px;">${ApiModule.escapeHtml(t.from)} → ${ApiModule.escapeHtml(t.to)}</td>
                <td style="padding: 5px; text-align: right; font-weight: 600;">${CalcModule.formatCurrency(t.pnlFreight)}</td>
                <td style="padding: 5px; text-align: right;">${CalcModule.formatCurrency(t.advanceReceived)}</td>
                <td style="padding: 5px; text-align: right;">${CalcModule.formatCurrency(t.balanceDue)}</td>
              </tr>
            `).join('')}
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
      alert("ExcelJS library is loading. Please retry in a few seconds.");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Transport Brokerage Ledger Pvt Ltd";
      workbook.created = new Date();

      const prj = DataModule.getCurrentProject();
      const trucks = DataModule.getTrucks();

      // Sheet 1: P&L Accounts
      const pnlSheet = workbook.addWorksheet('1122_6666_P&L Account');
      pnlSheet.columns = [
        { header: 'Truck ID', key: 'truckId', width: 14 },
        { header: 'Period', key: 'period', width: 12 },
        { header: 'Trip Route', key: 'route', width: 26 },
        { header: 'Freight Revenue (P1)', key: 'p1', width: 20 },
        { header: 'Base Freight', key: 'base', width: 18 },
        { header: 'Advance Recd', key: 'adv', width: 16 },
        { header: 'Balance Due', key: 'bal', width: 16 }
      ];

      trucks.forEach(t => {
        (t.trips || []).forEach(tr => {
          pnlSheet.addRow({
            truckId: t.id,
            period: tr.period || "2026-10",
            route: tr.from + ' TO ' + tr.to,
            p1: Number(tr.pnlFreight) || 0,
            base: Number(tr.baseFreight) || 0,
            adv: Number(tr.advanceReceived) || 0,
            bal: Number(tr.balanceDue) || 0
          });
        });
      });

      // Sheet 2: Driver Settlements
      const drvSheet = workbook.addWorksheet('1122_6666_Driver');
      drvSheet.columns = [
        { header: 'Driver Name', key: 'driver', width: 20 },
        { header: 'Truck ID', key: 'truckId', width: 14 },
        { header: '12% Commission', key: 'comm', width: 18 },
        { header: 'Advances', key: 'adv', width: 16 },
        { header: 'Road Expenses', key: 'exp', width: 16 },
        { header: 'Old Balance', key: 'old', width: 16 },
        { header: 'Net Settlement', key: 'net', width: 18 },
        { header: 'Direction', key: 'dir', width: 24 }
      ];

      trucks.forEach(t => {
        const set = CalcModule.calculateDriverSettlement(t, { period: '2026-10' });
        if (set) {
          drvSheet.addRow({
            driver: set.driverName,
            truckId: t.id,
            comm: set.commission12Pct,
            adv: set.totalAdvances,
            exp: set.claimedExpenses,
            old: set.oldBalance,
            net: set.netBalance,
            dir: set.netDirection
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `SR_Transport_Master_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);

      if (typeof AppModule !== 'undefined' && typeof AppModule.showToast === 'function') {
        AppModule.showToast('📥 Genuine Excel (.xlsx) workbook downloaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Export Excel failed:', err);
      alert('Export Excel failed: ' + err.message);
    }
  }

  return {
    setZoom,
    toggleFullscreen,
    filterExpenses,
    renderPnlView,
    renderDriverView,
    renderExcelReplica,
    exportToExcel
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TableModule;
}
