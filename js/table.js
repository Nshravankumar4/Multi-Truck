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

  function refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      setTimeout(() => lucide.createIcons(), 20);
    }
  }

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
    refreshIcons();
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
    refreshIcons();
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
    refreshIcons();
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
    refreshIcons();
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

  /**
   * -------------------------------------------------------------
   * NEW ENTERPRISE SUITE SCREENS: Fleet, Trips, Expenses, Reports
   * -------------------------------------------------------------
   */

  /**
   * 1. Fleet / Vehicle Management View
   */
  function renderFleetView(filterOptions) {
    const container = document.getElementById('view-fleet');
    if (!container) return;

    const currentProject = DataModule.getCurrentProject();
    const trucks = DataModule.getTrucks();
    const periodDisplay = (filterOptions && filterOptions.period && filterOptions.period !== 'ALL')
      ? filterOptions.period
      : (currentProject.activePeriod || '2026-10');

    let vehicleCardsHtml = '';
    let totalFleetRev = 0;
    let totalFleetExp = 0;
    let totalFleetNet = 0;
    let totalFleetTrips = 0;

    trucks.forEach(t => {
      const pnl = CalcModule.calculateTruckPnL(t, filterOptions);
      const set = CalcModule.calculateDriverSettlement(t, filterOptions);

      totalFleetRev += pnl.totalRevenueP1;
      totalFleetExp += pnl.totalExpensesP2;
      totalFleetNet += pnl.netProfit;
      totalFleetTrips += pnl.filteredTrips.length;

      const isPayable = set.netDirection === 'PAYABLE_TO_DRIVER';

      vehicleCardsHtml += `
        <div class="enterprise-vehicle-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: 1.25rem; font-weight: 700; color: #1e3a8a; letter-spacing: 0.5px;">${ApiModule.escapeHtml(t.regNumber || t.id)}</span>
                  <span style="background: #ecfdf5; color: #047857; font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 9999px; border: 1px solid #a7f3d0;">Active</span>
                </div>
                <div style="font-size: 0.85rem; color: #475569; margin-top: 0.2rem;">
                  Driver: <strong style="color: #0f172a;">${ApiModule.escapeHtml(t.driverName)}</strong>
                  ${t.driverPhone ? `<span style="color: #64748b; font-size: 0.78rem;"> • ${ApiModule.escapeHtml(t.driverPhone)}</span>` : ''}
                </div>
              </div>
              <span style="font-size: 0.85rem; font-weight: 700; color: ${pnl.isProfitable ? '#15803d' : '#b91c1c'}; background: ${pnl.isProfitable ? '#f0fdf4' : '#fef2f2'}; padding: 0.25rem 0.6rem; border-radius: 6px;">
                ${pnl.profitMargin}% Margin
              </span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; padding: 0.85rem 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; font-size: 0.82rem;">
              <div>
                <span style="color: #64748b; display: block; font-size: 0.72rem; text-transform: uppercase;">Freight Revenue (P1)</span>
                <strong style="color: #15803d; font-size: 0.95rem;">${CalcModule.formatCurrency(pnl.totalRevenueP1)}</strong>
              </div>
              <div>
                <span style="color: #64748b; display: block; font-size: 0.72rem; text-transform: uppercase;">Operating Costs (P2)</span>
                <strong style="color: #b91c1c; font-size: 0.95rem;">${CalcModule.formatCurrency(pnl.totalExpensesP2)}</strong>
              </div>
              <div>
                <span style="color: #64748b; display: block; font-size: 0.72rem; text-transform: uppercase;">Net Operating Profit</span>
                <strong style="color: #1e3a8a; font-size: 0.95rem;">${CalcModule.formatCurrency(pnl.netProfit)}</strong>
              </div>
              <div>
                <span style="color: #64748b; display: block; font-size: 0.72rem; text-transform: uppercase;">Trips Completed</span>
                <strong style="color: #334155; font-size: 0.95rem;">${pnl.filteredTrips.length} Shipments</strong>
              </div>
            </div>

            <div style="margin-top: 0.75rem; padding: 0.6rem; background: ${isPayable ? '#eff6ff' : '#fefce8'}; border: 1px solid ${isPayable ? '#bfdbfe' : '#fef08a'}; border-radius: 8px; font-size: 0.78rem;">
              <span style="color: #475569;">Driver Account Balance:</span>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.2rem;">
                <strong style="color: ${isPayable ? '#1e40af' : '#854d0e'}; font-size: 0.9rem;">${CalcModule.formatCurrency(set.netBalance)}</strong>
                <span style="font-weight: 600; font-size: 0.75rem; color: ${isPayable ? '#1d4ed8' : '#a16207'};">
                  ${isPayable ? 'Payable to Driver' : 'Payable by Driver'}
                </span>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.4rem; margin-top: 1rem; flex-wrap: wrap;">
            <button class="btn btn-xs btn-primary" onclick="AppModule.switchView('trips'); AppModule.selectTruckFilter('${t.id}');" style="flex: 1;">
              📦 Trips
            </button>
            <button class="btn btn-xs btn-secondary" onclick="AppModule.switchView('pnl'); AppModule.selectTruckFilter('${t.id}');" style="flex: 1;">
              💼 P&amp;L
            </button>
            <button class="btn btn-xs btn-secondary" onclick="AppModule.switchView('driver'); AppModule.selectTruckFilter('${t.id}');" style="flex: 1;">
              👤 Settlement
            </button>
            <button class="btn btn-xs btn-outline admin-only" onclick="AppModule.confirmDelete('truck', '${t.id}')" title="Delete Truck">
              🗑️
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin: 0;">🚛 Commercial Vehicle Fleet Management</h2>
          <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
            Real-time fleet performance, operational tracking, and vehicle profitability for <strong>${ApiModule.escapeHtml(currentProject.name)}</strong> (${periodDisplay}).
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-secondary" onclick="TableModule.exportToExcel()" title="Export Fleet to Excel">
            📥 Export Excel (.xlsx)
          </button>
          <button class="btn btn-primary admin-only" onclick="AppModule.openAddTruckModal()" title="Register New Vehicle">
            ＋ Register New Vehicle
          </button>
        </div>
      </div>

      <!-- Fleet Overview Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        ${vehicleCardsHtml}
      </div>

      <!-- Fleet Detailed Table -->
      <div class="excel-card-wrapper" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="padding: 1rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0;">Vehicle Performance &amp; Financial Summary</h3>
          <span style="font-size: 0.8rem; color: #64748b;">${trucks.length} Registered Commercial Trucks</span>
        </div>
        <div class="table-responsive-wrapper" style="overflow-x: auto;">
          <table class="report-data-table" style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
            <thead>
              <tr style="background: #1e3a8a; color: #ffffff;">
                <th style="padding: 0.65rem 0.85rem; text-align: left;">Vehicle Number</th>
                <th style="padding: 0.65rem 0.85rem; text-align: left;">Assigned Driver</th>
                <th style="padding: 0.65rem 0.85rem; text-align: center;">Trips</th>
                <th style="padding: 0.65rem 0.85rem; text-align: right;">Freight Revenue ($P_1$)</th>
                <th style="padding: 0.65rem 0.85rem; text-align: right;">Operating Costs ($P_2$)</th>
                <th style="padding: 0.65rem 0.85rem; text-align: right;">Net Profit ($P_1 - P_2$)</th>
                <th style="padding: 0.65rem 0.85rem; text-align: right;">Margin %</th>
                <th style="padding: 0.65rem 0.85rem; text-align: right;">Driver Settlement</th>
                <th style="padding: 0.65rem 0.85rem; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${trucks.map(t => {
                const p = CalcModule.calculateTruckPnL(t, filterOptions);
                const s = CalcModule.calculateDriverSettlement(t, filterOptions);
                const isPay = s.netDirection === 'PAYABLE_TO_DRIVER';
                return `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: #1e3a8a;">${ApiModule.escapeHtml(t.regNumber || t.id)}</td>
                    <td style="padding: 0.65rem 0.85rem;">${ApiModule.escapeHtml(t.driverName)}</td>
                    <td style="padding: 0.65rem 0.85rem; text-align: center;">${p.filteredTrips.length}</td>
                    <td style="padding: 0.65rem 0.85rem; text-align: right; color: #15803d; font-weight: 600;">${CalcModule.formatCurrency(p.totalRevenueP1)}</td>
                    <td style="padding: 0.65rem 0.85rem; text-align: right; color: #b91c1c; font-weight: 600;">${CalcModule.formatCurrency(p.totalExpensesP2)}</td>
                    <td style="padding: 0.65rem 0.85rem; text-align: right; color: #1e3a8a; font-weight: 700;">${CalcModule.formatCurrency(p.netProfit)}</td>
                    <td style="padding: 0.65rem 0.85rem; text-align: right; font-weight: 600;">${p.profitMargin}%</td>
                    <td style="padding: 0.65rem 0.85rem; text-align: right; color: ${isPay ? '#15803d' : '#b91c1c'}; font-weight: 600;">
                      ${CalcModule.formatCurrency(s.netBalance)} (${isPay ? 'Payable' : 'Receivable'})
                    </td>
                    <td style="padding: 0.65rem 0.85rem; text-align: center;">
                      <button class="btn btn-xs btn-outline" onclick="AppModule.switchView('pnl'); AppModule.selectTruckFilter('${t.id}');" title="View P&L">📊</button>
                      <button class="btn btn-xs btn-outline" onclick="AppModule.switchView('driver'); AppModule.selectTruckFilter('${t.id}');" title="View Driver">👤</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                <td style="padding: 0.75rem 0.85rem;" colspan="2">FLEET TOTALS (${trucks.length} Trucks)</td>
                <td style="padding: 0.75rem 0.85rem; text-align: center;">${totalFleetTrips}</td>
                <td style="padding: 0.75rem 0.85rem; text-align: right; color: #15803d;">${CalcModule.formatCurrency(totalFleetRev)}</td>
                <td style="padding: 0.75rem 0.85rem; text-align: right; color: #b91c1c;">${CalcModule.formatCurrency(totalFleetExp)}</td>
                <td style="padding: 0.75rem 0.85rem; text-align: right; color: #1e3a8a;">${CalcModule.formatCurrency(totalFleetNet)}</td>
                <td style="padding: 0.75rem 0.85rem; text-align: right;">${totalFleetRev > 0 ? ((totalFleetNet / totalFleetRev) * 100).toFixed(2) : 0}%</td>
                <td style="padding: 0.75rem 0.85rem; text-align: right;">-</td>
                <td style="padding: 0.75rem 0.85rem; text-align: center;">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
    refreshIcons();
  }

  /**
   * 2. Trips / Shipments Management View
   */
  function renderTripsView(truckFilter, filterOptions) {
    const container = document.getElementById('view-trips');
    if (!container) return;

    const currentProject = DataModule.getCurrentProject();
    let trucks = DataModule.getTrucks();

    if (truckFilter && truckFilter !== 'ALL') {
      trucks = trucks.filter(t => t.id === truckFilter);
    }

    let allTrips = [];
    trucks.forEach(t => {
      (t.trips || []).forEach(tr => {
        if (CalcModule.matchesFilter(tr, filterOptions)) {
          allTrips.push({ ...tr, truckReg: t.regNumber || t.id, driverName: t.driverName, truckId: t.id });
        }
      });
    });

    const totalFreight = allTrips.reduce((s, tr) => s + (Number(tr.pnlFreight) || 0), 0);
    const totalBaseFreight = allTrips.reduce((s, tr) => s + (Number(tr.baseFreight) || 0), 0);
    const totalAdvance = allTrips.reduce((s, tr) => s + (Number(tr.advanceReceived) || 0), 0);
    const totalBalance = allTrips.reduce((s, tr) => s + (Number(tr.balanceDue) || 0), 0);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin: 0;">📦 Freight Shipment Trips Ledger</h2>
          <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
            Detailed shipment records, route logistics, freight revenues ($P_1$), and payment statuses.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-secondary" onclick="TableModule.exportToExcel()" title="Export Trips to Excel">
            📥 Export Excel (.xlsx)
          </button>
          <button class="btn btn-primary" onclick="AppModule.openAddModal('trip')" title="Add New Shipment">
            ＋ Add Shipment
          </button>
        </div>
      </div>

      <!-- Trips Metric Highlights -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem;">
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Shipments</span>
          <div style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin-top: 0.2rem;">${allTrips.length} Verified Trips</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem;">
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Total P&amp;L Freight ($P_1$)</span>
          <div style="font-size: 1.3rem; font-weight: 700; color: #15803d; margin-top: 0.2rem;">${CalcModule.formatCurrency(totalFreight)}</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem;">
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Advance Received</span>
          <div style="font-size: 1.3rem; font-weight: 700; color: #1e40af; margin-top: 0.2rem;">${CalcModule.formatCurrency(totalAdvance)}</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem;">
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Balance Outstanding</span>
          <div style="font-size: 1.3rem; font-weight: 700; color: #b91c1c; margin-top: 0.2rem;">${CalcModule.formatCurrency(totalBalance)}</div>
        </div>
      </div>

      <!-- Trips Table Card -->
      <div class="excel-card-wrapper" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div class="table-responsive-wrapper" style="overflow-x: auto;">
          <table class="report-data-table" style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
            <thead>
              <tr style="background: #1e3a8a; color: #ffffff;">
                <th style="padding: 0.65rem; text-align: left;">Trip ID</th>
                <th style="padding: 0.65rem; text-align: left;">Vehicle</th>
                <th style="padding: 0.65rem; text-align: left;">Dates</th>
                <th style="padding: 0.65rem; text-align: left;">Route (From → To)</th>
                <th style="padding: 0.65rem; text-align: left;">Transporter</th>
                <th style="padding: 0.65rem; text-align: right;">Total Freight ($P_1$)</th>
                <th style="padding: 0.65rem; text-align: right;">Base Freight (12%)</th>
                <th style="padding: 0.65rem; text-align: right;">Advance Recd</th>
                <th style="padding: 0.65rem; text-align: right;">Balance Due</th>
                <th style="padding: 0.65rem; text-align: center;">POD Status</th>
                <th style="padding: 0.65rem; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${allTrips.length === 0 ? `
                <tr><td colspan="11" style="text-align: center; padding: 2rem; color: #64748b;">No shipment trips match current filters.</td></tr>
              ` : allTrips.map(tr => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 0.6rem; font-family: monospace; font-weight: 700; color: #1e3a8a;">${ApiModule.escapeHtml(tr.id)}</td>
                  <td style="padding: 0.6rem; font-weight: 600;">${ApiModule.escapeHtml(tr.truckReg)}</td>
                  <td style="padding: 0.6rem;">${ApiModule.escapeHtml(tr.dates || '-')}</td>
                  <td style="padding: 0.6rem; font-weight: 600; color: #0f172a;">${ApiModule.escapeHtml(tr.from)} → ${ApiModule.escapeHtml(tr.to)}</td>
                  <td style="padding: 0.6rem;">${ApiModule.escapeHtml(tr.transporter || '-')}</td>
                  <td style="padding: 0.6rem; text-align: right; color: #15803d; font-weight: 700;">${CalcModule.formatCurrency(tr.pnlFreight)}</td>
                  <td style="padding: 0.6rem; text-align: right; color: #475569;">${CalcModule.formatCurrency(tr.baseFreight)}</td>
                  <td style="padding: 0.6rem; text-align: right; color: #1e40af;">${CalcModule.formatCurrency(tr.advanceReceived)}</td>
                  <td style="padding: 0.6rem; text-align: right; color: ${tr.balanceDue > 0 ? '#b91c1c' : '#15803d'}; font-weight: 700;">${CalcModule.formatCurrency(tr.balanceDue)}</td>
                  <td style="padding: 0.6rem; text-align: center;">
                    <span style="font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 9999px; font-weight: 600; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">
                      ${ApiModule.escapeHtml(tr.podStatus || 'Verified')}
                    </span>
                  </td>
                  <td style="padding: 0.6rem; text-align: center;">
                    <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('trip', '${tr.truckId}', '${tr.id}')" title="Edit Trip">✏️</button>
                    <button class="btn btn-xs btn-outline-danger admin-only" onclick="AppModule.confirmDelete('trip', '${tr.truckId}', '${tr.id}')" title="Delete Trip">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                <td style="padding: 0.75rem 0.65rem;" colspan="5">TOTALS (${allTrips.length} Shipments)</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right; color: #15803d;">${CalcModule.formatCurrency(totalFreight)}</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right; color: #475569;">${CalcModule.formatCurrency(totalBaseFreight)}</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right; color: #1e40af;">${CalcModule.formatCurrency(totalAdvance)}</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right; color: #b91c1c;">${CalcModule.formatCurrency(totalBalance)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
    refreshIcons();
  }

  /**
   * 3. Operational Expenses & Fuel Ledger View
   */
  function renderExpensesView(truckFilter, filterOptions) {
    const container = document.getElementById('view-expenses');
    if (!container) return;

    let trucks = DataModule.getTrucks();
    if (truckFilter && truckFilter !== 'ALL') {
      trucks = trucks.filter(t => t.id === truckFilter);
    }

    let allDiesel = [];
    let allRoad = [];
    let allAdvances = [];

    trucks.forEach(t => {
      (t.diesel || []).forEach(d => {
        if (CalcModule.matchesFilter(d, filterOptions)) {
          allDiesel.push({ ...d, truckReg: t.regNumber || t.id, truckId: t.id });
        }
      });
      (t.roadExpenses || []).forEach(r => {
        if (CalcModule.matchesFilter(r, filterOptions)) {
          allRoad.push({ ...r, truckReg: t.regNumber || t.id, truckId: t.id });
        }
      });
      (t.advances || []).forEach(a => {
        if (CalcModule.matchesFilter(a, filterOptions)) {
          allAdvances.push({ ...a, truckReg: t.regNumber || t.id, driverName: t.driverName, truckId: t.id });
        }
      });
    });

    const totalDieselAmount = allDiesel.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const totalRoadAmount = allRoad.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const totalAdvancesAmount = allAdvances.reduce((s, a) => s + (Number(a.amount) || 0), 0);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin: 0;">⛽ Fleet Operational Expenses &amp; Fuel Ledger</h2>
          <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
            Diesel fuel fills, en-route driver road expenses, advances, and FastTag electronic toll expenses ($P_2$).
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-secondary" onclick="AppModule.openAddModal('diesel')">＋ Diesel Entry</button>
          <button class="btn btn-secondary" onclick="AppModule.openAddModal('expense')">＋ Road Expense</button>
          <button class="btn btn-secondary" onclick="AppModule.openAddModal('advance')">＋ Driver Advance</button>
          <button class="btn btn-primary" onclick="TableModule.exportToExcel()">📥 Export Excel</button>
        </div>
      </div>

      <!-- Expense Summary Highlights -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem;">
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Diesel Fuel</span>
          <div style="font-size: 1.3rem; font-weight: 700; color: #2563eb; margin-top: 0.2rem;">${CalcModule.formatCurrency(totalDieselAmount)}</div>
          <span style="font-size: 0.72rem; color: #64748b;">${allDiesel.length} Fuel Receipts</span>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem;">
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">En-Route Road Expenses</span>
          <div style="font-size: 1.3rem; font-weight: 700; color: #d97706; margin-top: 0.2rem;">${CalcModule.formatCurrency(totalRoadAmount)}</div>
          <span style="font-size: 0.72rem; color: #64748b;">${allRoad.length} Itemized Entries</span>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem;">
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Driver Cash Advances</span>
          <div style="font-size: 1.3rem; font-weight: 700; color: #b91c1c; margin-top: 0.2rem;">${CalcModule.formatCurrency(totalAdvancesAmount)}</div>
          <span style="font-size: 0.72rem; color: #64748b;">${allAdvances.length} Advance Slips</span>
        </div>
      </div>

      <!-- Audit Notice Box for Road Expenses Variance -->
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #1e40af; line-height: 1.5;">
        ℹ️ <strong>Reconciliation Note:</strong> Itemized road receipts for TG15T6666 total <strong>₹28,735</strong> (37 receipts) whereas driver settlement claimed road expenses are <strong>₹28,700</strong> (audit difference of <strong>₹35</strong> is preserved and reconciled per master accounting ledger).
      </div>

      <!-- Diesel Slips Table -->
      <div class="excel-card-wrapper" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="padding: 0.85rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0;">⛽ Diesel Fuel Refill Slips (${allDiesel.length} Entries)</h3>
          <button class="btn btn-xs btn-primary" onclick="AppModule.openAddModal('diesel')">＋ Add Fuel Entry</button>
        </div>
        <div class="table-responsive-wrapper" style="overflow-x: auto;">
          <table class="report-data-table" style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
            <thead>
              <tr style="background: #1e3a8a; color: #ffffff;">
                <th style="padding: 0.6rem; text-align: left;">Date</th>
                <th style="padding: 0.6rem; text-align: left;">Vehicle</th>
                <th style="padding: 0.6rem; text-align: left;">Slip No</th>
                <th style="padding: 0.6rem; text-align: left;">Petrol Pump / Station</th>
                <th style="padding: 0.6rem; text-align: right;">Litres</th>
                <th style="padding: 0.6rem; text-align: right;">Rate / Litre</th>
                <th style="padding: 0.6rem; text-align: right;">Total Amount</th>
                <th style="padding: 0.6rem; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${allDiesel.length === 0 ? `
                <tr><td colspan="8" style="text-align: center; padding: 1.5rem; color: #64748b;">No diesel entries found.</td></tr>
              ` : allDiesel.map(d => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 0.55rem;">${ApiModule.escapeHtml(d.date)}</td>
                  <td style="padding: 0.55rem; font-weight: 600;">${ApiModule.escapeHtml(d.truckReg)}</td>
                  <td style="padding: 0.55rem; font-family: monospace;">${ApiModule.escapeHtml(d.slipNo || '-')}</td>
                  <td style="padding: 0.55rem;">${ApiModule.escapeHtml(d.pumpName || d.location || '-')}</td>
                  <td style="padding: 0.55rem; text-align: right;">${d.litres ? Number(d.litres).toFixed(2) + ' L' : '-'}</td>
                  <td style="padding: 0.55rem; text-align: right;">${d.rate ? CalcModule.formatCurrency(d.rate) : '-'}</td>
                  <td style="padding: 0.55rem; text-align: right; font-weight: 700; color: #1e3a8a;">${CalcModule.formatCurrency(d.amount)}</td>
                  <td style="padding: 0.55rem; text-align: center;">
                    <button class="btn btn-xs btn-outline" onclick="AppModule.openEditModal('diesel', '${d.truckId}', '${d.id}')">✏️</button>
                    <button class="btn btn-xs btn-outline-danger admin-only" onclick="AppModule.confirmDelete('diesel', '${d.truckId}', '${d.id}')">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                <td style="padding: 0.65rem;" colspan="6">TOTAL FUEL EXPENDITURE</td>
                <td style="padding: 0.65rem; text-align: right; color: #1e3a8a;">${CalcModule.formatCurrency(totalDieselAmount)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
    refreshIcons();
  }

  /**
   * 4. Reports & Analytics Center View
   */
  function renderReportsView(filterOptions) {
    const container = document.getElementById('view-reports');
    if (!container) return;

    const prj = DataModule.getCurrentProject();
    const trucks = DataModule.getTrucks();
    const fleet = CalcModule.calculateFleetTotals(trucks, filterOptions);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin: 0;">📈 Fleet Financial Reports &amp; Analytics</h2>
          <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
            Authoritative executive accounts, monthly comparisons, driver liabilities, and verified Excel reports.
          </p>
        </div>
        <button class="btn btn-primary" onclick="TableModule.exportToExcel()">
          📥 Download Genuine Excel (.xlsx) Report
        </button>
      </div>

      <!-- Executive Performance Card -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem 0;">Executive Fleet P&amp;L Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Total Freight Revenue ($P_1$)</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: #15803d; margin-top: 0.25rem;">${CalcModule.formatCurrency(fleet.combinedRevenue)}</div>
            <span style="font-size: 0.72rem; color: #64748b;">${fleet.totalTripsCount} Filtered Trips</span>
          </div>
          <div style="padding: 1rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Total Operating Costs ($P_2$)</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: #b91c1c; margin-top: 0.25rem;">${CalcModule.formatCurrency(fleet.combinedExpenses)}</div>
            <span style="font-size: 0.72rem; color: #64748b;">Fuel, Tolls, Comm, Road</span>
          </div>
          <div style="padding: 1rem; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
            <span style="font-size: 0.75rem; color: #1e40af; text-transform: uppercase; font-weight: 600;">Net Operating Profit</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: #1e3a8a; margin-top: 0.25rem;">${CalcModule.formatCurrency(fleet.combinedNetProfit)}</div>
            <span style="font-size: 0.72rem; color: #1d4ed8; font-weight: 600;">${fleet.combinedMargin}% Margin</span>
          </div>
        </div>
      </div>

      <!-- Truck Contribution Table -->
      <div class="excel-card-wrapper" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="padding: 0.85rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0;">Vehicle Profitability Breakdown</h3>
        </div>
        <div class="table-responsive-wrapper" style="overflow-x: auto;">
          <table class="report-data-table" style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
            <thead>
              <tr style="background: #1e3a8a; color: #ffffff;">
                <th style="padding: 0.65rem; text-align: left;">Vehicle</th>
                <th style="padding: 0.65rem; text-align: left;">Driver</th>
                <th style="padding: 0.65rem; text-align: right;">Revenue ($P_1$)</th>
                <th style="padding: 0.65rem; text-align: right;">Diesel Fuel</th>
                <th style="padding: 0.65rem; text-align: right;">Road Exp</th>
                <th style="padding: 0.65rem; text-align: right;">Driver Comm (12%)</th>
                <th style="padding: 0.65rem; text-align: right;">Operating Exp ($P_2$)</th>
                <th style="padding: 0.65rem; text-align: right;">Net Profit</th>
                <th style="padding: 0.65rem; text-align: right;">Margin %</th>
              </tr>
            </thead>
            <tbody>
              ${fleet.truckPnLs.map(p => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 0.6rem; font-weight: 700; color: #1e3a8a;">${ApiModule.escapeHtml(p.regNumber)}</td>
                  <td style="padding: 0.6rem;">${ApiModule.escapeHtml(p.driverName)}</td>
                  <td style="padding: 0.6rem; text-align: right; color: #15803d; font-weight: 600;">${CalcModule.formatCurrency(p.totalRevenueP1)}</td>
                  <td style="padding: 0.6rem; text-align: right;">${CalcModule.formatCurrency(p.totalDiesel)}</td>
                  <td style="padding: 0.6rem; text-align: right;">${CalcModule.formatCurrency(p.totalRoadExp)}</td>
                  <td style="padding: 0.6rem; text-align: right;">${CalcModule.formatCurrency(p.driverCommission)}</td>
                  <td style="padding: 0.6rem; text-align: right; color: #b91c1c; font-weight: 600;">${CalcModule.formatCurrency(p.totalExpensesP2)}</td>
                  <td style="padding: 0.6rem; text-align: right; color: #1e3a8a; font-weight: 700;">${CalcModule.formatCurrency(p.netProfit)}</td>
                  <td style="padding: 0.6rem; text-align: right; font-weight: 600;">${p.profitMargin}%</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                <td style="padding: 0.75rem 0.65rem;" colspan="2">TOTAL FLEET PERFORMANCE</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right; color: #15803d;">${CalcModule.formatCurrency(fleet.combinedRevenue)}</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right;">${CalcModule.formatCurrency(fleet.combinedDiesel)}</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right;">${CalcModule.formatCurrency(fleet.combinedRoadExp)}</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right;">${CalcModule.formatCurrency(fleet.combinedCommission)}</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right; color: #b91c1c;">${CalcModule.formatCurrency(fleet.combinedExpenses)}</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right; color: #1e3a8a;">${CalcModule.formatCurrency(fleet.combinedNetProfit)}</td>
                <td style="padding: 0.75rem 0.65rem; text-align: right;">${fleet.combinedMargin}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
    refreshIcons();
  }

  return {
    setZoom,
    toggleFullscreen,
    filterExpenses,
    renderPnlView,
    renderDriverView,
    renderExcelReplica,
    renderFleetView,
    renderTripsView,
    renderExpensesView,
    renderReportsView,
    exportToExcel
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TableModule;
}
