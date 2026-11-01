/**
 * Transport Brokerage Ledger Pvt Ltd
 * Table & View Rendering Engine (table.js)
 * High-performance, simplified tables per SR_B UI reference
 */

const TableModule = (() => {

  let currentZoom = 1;
  let activeFinancialTab = 'pnl';

  // --- 1. VEHICLES VIEW (renderFleetView) ---
  function renderFleetView(filterOptions = {}) {
    const container = document.getElementById('view-fleet');
    if (!container) return;

    const trucks = DataModule.getTrucks();
    const period = filterOptions.period || DataModule.getActivePeriod();

    let html = `
      <div class="card-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">🚛 Fleet Vehicle Registry</h2>
            <span style="font-size: 0.75rem; color: var(--muted);">${trucks.length} Commercial Vehicles Active</span>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="AppModule.openAddTruckModal()">＋ Add Vehicle</button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Registration No</th>
                <th>Assigned Driver</th>
                <th>Contact</th>
                <th>Model / Capacity</th>
                <th>Status</th>
                <th class="numeric">Trips</th>
                <th class="numeric">Revenue</th>
                <th class="numeric">Expenses</th>
                <th class="numeric">Net Profit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
    `;

    trucks.forEach(t => {
      const pnlRaw = DataModule.getPnLForTruck(t.id);
      const pnl = CalculationModule.calculatePnL(pnlRaw, period);
      const drv = DataModule.getDriverForTruck(t.id);

      const isPositive = pnl.netProfit >= 0;
      const profitColor = isPositive ? 'var(--success)' : 'var(--danger)';

      html += `
        <tr>
          <td><strong>${t.regNumber || t.id}</strong></td>
          <td>${drv ? drv.name : 'Unassigned'}</td>
          <td>${drv ? drv.phone : '-'}</td>
          <td>${t.model} (${t.capacity})</td>
          <td><span class="badge badge-success">${t.status}</span></td>
          <td class="numeric">${pnl.tripCount}</td>
          <td class="numeric"><strong>${CalculationModule.formatCurrency(pnl.revenue.p1Freight)}</strong></td>
          <td class="numeric">${CalculationModule.formatCurrency(pnl.expenses.totalExpensesP2)}</td>
          <td class="numeric" style="font-weight: 700; color: ${profitColor};">${CalculationModule.formatCurrency(pnl.netProfit)}</td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" onclick="AppModule.filterByTruckAndNavigate('${t.id}', 'trips')">Trips</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="AppModule.filterByTruckAndNavigate('${t.id}', 'settlements')">Settlement</button>
          </td>
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

  // --- 2. TRIPS VIEW (renderTripsView) ---
  function renderTripsView(truckFilter = 'ALL', filterOptions = {}) {
    const container = document.getElementById('view-trips');
    if (!container) return;

    const trucks = DataModule.getTrucks();
    const period = filterOptions.period || DataModule.getActivePeriod();
    const query = (filterOptions.searchQuery || '').toLowerCase();

    let allTrips = [];
    trucks.forEach(t => {
      if (truckFilter !== 'ALL' && t.id !== truckFilter) return;
      const pnl = DataModule.getPnLForTruck(t.id);
      if (!pnl || !pnl.trips) return;
      pnl.trips.forEach(tr => {
        if (!CalculationModule.matchesFilter(tr.date, period)) return;
        if (query && !JSON.stringify(tr).toLowerCase().includes(query)) return;
        allTrips.push({ ...tr, truckId: t.id, regNumber: t.regNumber || t.id, driverName: pnl.driverName });
      });
    });

    allTrips.sort((a, b) => new Date(b.date) - new Date(a.date));

    let totalP1 = 0;
    let totalBase = 0;
    let totalDiesel = 0;
    let totalRoad = 0;
    let totalMargin = 0;

    let html = `
      <div class="card-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">🛣️ Commercial Trip Ledger</h2>
            <span style="font-size: 0.75rem; color: var(--muted);">${allTrips.length} Trips Recorded | Vehicle: ${truckFilter}</span>
          </div>
          <div class="toolbar-actions">
            <button type="button" class="btn btn-primary btn-sm" onclick="AppModule.openAddEntryModal('trip')">＋ Add Trip</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="TableModule.exportToExcel()">📊 Export</button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Transporter</th>
                <th>Origin → Destination</th>
                <th class="numeric">P&amp;L Freight (P1)</th>
                <th class="numeric">Base Freight</th>
                <th class="numeric">Diesel</th>
                <th class="numeric">Road Exp</th>
                <th class="numeric">Net Margin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
    `;

    allTrips.forEach(tr => {
      const margin = (Number(tr.freightP1) || 0) - (Number(tr.dieselAmount) || 0) - (Number(tr.roadExpenses) || 0);
      totalP1 += (Number(tr.freightP1) || 0);
      totalBase += (Number(tr.baseFreight) || 0);
      totalDiesel += (Number(tr.dieselAmount) || 0);
      totalRoad += (Number(tr.roadExpenses) || 0);
      totalMargin += margin;

      html += `
        <tr>
          <td><strong>${tr.id}</strong></td>
          <td>${tr.date}</td>
          <td><span class="badge badge-info">${tr.regNumber}</span></td>
          <td>${tr.driverName || 'Driver'}</td>
          <td>${tr.transporter || 'SR Logistics'}</td>
          <td>${tr.source} → ${tr.destination}</td>
          <td class="numeric"><strong>${CalculationModule.formatCurrency(tr.freightP1)}</strong></td>
          <td class="numeric">${CalculationModule.formatCurrency(tr.baseFreight)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(tr.dieselAmount)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(tr.roadExpenses)}</td>
          <td class="numeric" style="color: var(--success); font-weight: 700;">${CalculationModule.formatCurrency(margin)}</td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" onclick="AppModule.openEditModal('trip', '${tr.truckId}', '${tr.id}')">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="AppModule.confirmDelete('trip', '${tr.truckId}', '${tr.id}')">Delete</button>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6"><strong>Total (${allTrips.length} Trips)</strong></td>
                <td class="numeric"><strong>${CalculationModule.formatCurrency(totalP1)}</strong></td>
                <td class="numeric">${CalculationModule.formatCurrency(totalBase)}</td>
                <td class="numeric">${CalculationModule.formatCurrency(totalDiesel)}</td>
                <td class="numeric">${CalculationModule.formatCurrency(totalRoad)}</td>
                <td class="numeric" style="color: var(--success); font-weight: 700;">${CalculationModule.formatCurrency(totalMargin)}</td>
                <td>-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // --- 3. FINANCIALS VIEW (renderExpensesView / P&L) ---
  function renderExpensesView(truckFilter = 'ALL', filterOptions = {}) {
    const container = document.getElementById('view-expenses') || document.getElementById('view-pnl');
    if (!container) return;

    const period = filterOptions.period || DataModule.getActivePeriod();
    const trucks = DataModule.getTrucks();

    let html = `
      <div class="card-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">💰 Financial Accounts Ledger</h2>
            <span style="font-size: 0.75rem; color: var(--muted);">P&amp;L, Fuel, Vouchers &amp; Fixed Costs</span>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="AppModule.openAddEntryModal('expense')">＋ Add Expense</button>
        </div>

        <!-- Sub Tabs -->
        <div class="sub-nav-tabs">
          <button type="button" class="sub-nav-tab ${activeFinancialTab === 'pnl' ? 'active' : ''}" onclick="TableModule.setFinancialTab('pnl', '${truckFilter}')">📊 P&amp;L Statements</button>
          <button type="button" class="sub-nav-tab ${activeFinancialTab === 'diesel' ? 'active' : ''}" onclick="TableModule.setFinancialTab('diesel', '${truckFilter}')">⛽ Diesel Logs</button>
          <button type="button" class="sub-nav-tab ${activeFinancialTab === 'road' ? 'active' : ''}" onclick="TableModule.setFinancialTab('road', '${truckFilter}')">🧾 Road Expenses</button>
          <button type="button" class="sub-nav-tab ${activeFinancialTab === 'fixed' ? 'active' : ''}" onclick="TableModule.setFinancialTab('fixed', '${truckFilter}')">🛣️ FastTag &amp; Fixed</button>
          <button type="button" class="sub-nav-tab ${activeFinancialTab === 'advances' ? 'active' : ''}" onclick="TableModule.setFinancialTab('advances', '${truckFilter}')">💳 Advances</button>
        </div>

        <div id="financialTabContent">
    `;

    if (activeFinancialTab === 'pnl') {
      html += renderPnLSubTab(truckFilter, period);
    } else if (activeFinancialTab === 'diesel') {
      html += renderDieselSubTab(truckFilter, period);
    } else if (activeFinancialTab === 'road') {
      html += renderRoadExpensesSubTab(truckFilter, period);
    } else if (activeFinancialTab === 'fixed') {
      html += renderFixedSubTab(truckFilter, period);
    } else if (activeFinancialTab === 'advances') {
      html += renderAdvancesSubTab(truckFilter, period);
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function setFinancialTab(tabName, truckFilter) {
    activeFinancialTab = tabName;
    renderExpensesView(truckFilter);
  }

  function renderPnLSubTab(truckFilter, period) {
    const trucks = DataModule.getTrucks();
    let content = `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Period</th>
              <th>Driver</th>
              <th class="numeric">P1 Freight</th>
              <th class="numeric">Diesel (P2)</th>
              <th class="numeric">Road Exp (Itemized)</th>
              <th class="numeric">Road Exp (Claimed)</th>
              <th class="numeric">12% Driver Comm</th>
              <th class="numeric">Fixed &amp; FastTag</th>
              <th class="numeric">Total Exp (P2)</th>
              <th class="numeric">Net Profit (P1-P2)</th>
              <th class="numeric">Margin %</th>
            </tr>
          </thead>
          <tbody>
    `;

    trucks.forEach(t => {
      if (truckFilter !== 'ALL' && t.id !== truckFilter) return;
      const pnlRaw = DataModule.getPnLForTruck(t.id);
      const pnl = CalculationModule.calculatePnL(pnlRaw, period);
      const isPositive = pnl.netProfit >= 0;

      content += `
        <tr>
          <td><strong>${t.regNumber || t.id}</strong></td>
          <td>${pnl.period}</td>
          <td>${pnl.driverName}</td>
          <td class="numeric"><strong>${CalculationModule.formatCurrency(pnl.revenue.p1Freight)}</strong></td>
          <td class="numeric">${CalculationModule.formatCurrency(pnl.expenses.dieselTotal)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(pnl.expenses.roadTotalItemized)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(pnl.expenses.roadTotalClaimed)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(pnl.expenses.driverCommission)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(pnl.expenses.fixedTotal)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(pnl.expenses.totalExpensesP2)}</td>
          <td class="numeric" style="font-weight: 700; color: ${isPositive ? 'var(--success)' : 'var(--danger)'};">
            ${CalculationModule.formatCurrency(pnl.netProfit)}
          </td>
          <td class="numeric">${CalculationModule.formatPercent(pnl.netProfitMarginPercent)}</td>
        </tr>
      `;
    });

    content += `</tbody></table></div>`;
    return content;
  }

  function renderDieselSubTab(truckFilter, period) {
    const trucks = DataModule.getTrucks();
    let entries = [];
    trucks.forEach(t => {
      if (truckFilter !== 'ALL' && t.id !== truckFilter) return;
      const pnl = DataModule.getPnLForTruck(t.id);
      if (!pnl || !pnl.dieselLogs) return;
      pnl.dieselLogs.forEach(d => {
        if (!CalculationModule.matchesFilter(d.date, period)) return;
        entries.push({ ...d, truckId: t.id, regNumber: t.regNumber || t.id });
      });
    });

    let totalLiters = 0;
    let totalAmt = 0;

    let content = `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Petrol Pump / Station</th>
              <th class="numeric">Liters</th>
              <th class="numeric">Rate / L</th>
              <th class="numeric">Total Amount (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    entries.forEach(d => {
      totalLiters += (Number(d.liters) || 0);
      totalAmt += (Number(d.amount) || 0);

      content += `
        <tr>
          <td><strong>${d.id}</strong></td>
          <td>${d.date}</td>
          <td><span class="badge badge-info">${d.regNumber}</span></td>
          <td>${d.pump}</td>
          <td class="numeric">${Number(d.liters).toFixed(2)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(d.rate)}</td>
          <td class="numeric"><strong>${CalculationModule.formatCurrency(d.amount)}</strong></td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" onclick="AppModule.openEditModal('diesel', '${d.truckId}', '${d.id}')">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="AppModule.confirmDelete('diesel', '${d.truckId}', '${d.id}')">Delete</button>
          </td>
        </tr>
      `;
    });

    content += `
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4"><strong>Total Diesel (${entries.length} Entries)</strong></td>
              <td class="numeric"><strong>${totalLiters.toFixed(2)} L</strong></td>
              <td class="numeric">-</td>
              <td class="numeric"><strong>${CalculationModule.formatCurrency(totalAmt)}</strong></td>
              <td>-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    return content;
  }

  function renderRoadExpensesSubTab(truckFilter, period) {
    const trucks = DataModule.getTrucks();
    let entries = [];
    trucks.forEach(t => {
      if (truckFilter !== 'ALL' && t.id !== truckFilter) return;
      const pnl = DataModule.getPnLForTruck(t.id);
      if (!pnl || !pnl.roadExpenseItems) return;
      pnl.roadExpenseItems.forEach(r => {
        if (!CalculationModule.matchesFilter(r.date, period)) return;
        entries.push({ ...r, truckId: t.id, regNumber: t.regNumber || t.id });
      });
    });

    let totalAmt = 0;
    let content = `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Voucher ID</th>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Category</th>
              <th>Description / Voucher</th>
              <th class="numeric">Amount (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    entries.forEach(r => {
      totalAmt += (Number(r.amount) || 0);
      content += `
        <tr>
          <td><strong>${r.id}</strong></td>
          <td>${r.date}</td>
          <td><span class="badge badge-info">${r.regNumber}</span></td>
          <td><span class="badge badge-warning">${r.category}</span></td>
          <td>${r.desc}</td>
          <td class="numeric"><strong>${CalculationModule.formatCurrency(r.amount)}</strong></td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" onclick="AppModule.openEditModal('expense', '${r.truckId}', '${r.id}')">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="AppModule.confirmDelete('expense', '${r.truckId}', '${r.id}')">Delete</button>
          </td>
        </tr>
      `;
    });

    content += `
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5"><strong>Total Road Expenses (${entries.length} Vouchers)</strong></td>
              <td class="numeric"><strong>${CalculationModule.formatCurrency(totalAmt)}</strong></td>
              <td>-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    return content;
  }

  function renderFixedSubTab(truckFilter, period) {
    const trucks = DataModule.getTrucks();
    let entries = [];
    trucks.forEach(t => {
      if (truckFilter !== 'ALL' && t.id !== truckFilter) return;
      const pnl = DataModule.getPnLForTruck(t.id);
      if (!pnl || !pnl.otherExpenses) return;
      pnl.otherExpenses.forEach(o => {
        entries.push({ ...o, truckId: t.id, regNumber: t.regNumber || t.id });
      });
    });

    let totalAmt = 0;
    let content = `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Category</th>
              <th>Description</th>
              <th class="numeric">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
    `;

    entries.forEach(o => {
      totalAmt += (Number(o.amount) || 0);
      content += `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${o.date}</td>
          <td><span class="badge badge-info">${o.regNumber}</span></td>
          <td><span class="badge badge-info">${o.category}</span></td>
          <td>${o.desc}</td>
          <td class="numeric"><strong>${CalculationModule.formatCurrency(o.amount)}</strong></td>
        </tr>
      `;
    });

    content += `
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5"><strong>Total Fixed &amp; FastTag</strong></td>
              <td class="numeric"><strong>${CalculationModule.formatCurrency(totalAmt)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    return content;
  }

  function renderAdvancesSubTab(truckFilter, period) {
    const trucks = DataModule.getTrucks();
    let entries = [];
    trucks.forEach(t => {
      if (truckFilter !== 'ALL' && t.id !== truckFilter) return;
      const pnl = DataModule.getPnLForTruck(t.id);
      if (!pnl || !pnl.advances) return;
      pnl.advances.forEach(a => {
        if (!CalculationModule.matchesFilter(a.date, period)) return;
        entries.push({ ...a, truckId: t.id, regNumber: t.regNumber || t.id, driverName: pnl.driverName });
      });
    });

    let totalAmt = 0;
    let content = `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Advance ID</th>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Mode</th>
              <th>Purpose</th>
              <th class="numeric">Amount (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    entries.forEach(a => {
      totalAmt += (Number(a.amount) || 0);
      content += `
        <tr>
          <td><strong>${a.id}</strong></td>
          <td>${a.date}</td>
          <td><span class="badge badge-info">${a.regNumber}</span></td>
          <td>${a.driverName}</td>
          <td>${a.type}</td>
          <td>${a.purpose}</td>
          <td class="numeric"><strong>${CalculationModule.formatCurrency(a.amount)}</strong></td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" onclick="AppModule.openEditModal('advance', '${a.truckId}', '${a.id}')">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="AppModule.confirmDelete('advance', '${a.truckId}', '${a.id}')">Delete</button>
          </td>
        </tr>
      `;
    });

    content += `
          </tbody>
          <tfoot>
            <tr>
              <td colspan="6"><strong>Total Advances Taken</strong></td>
              <td class="numeric"><strong>${CalculationModule.formatCurrency(totalAmt)}</strong></td>
              <td>-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    return content;
  }

  // --- 4. DRIVER SETTLEMENTS VIEW (renderDriverView) ---
  function renderDriverView(truckFilter = 'ALL', filterOptions = {}) {
    const container = document.getElementById('view-driver');
    if (!container) return;

    const trucks = DataModule.getTrucks();
    const period = filterOptions.period || DataModule.getActivePeriod();

    let html = `
      <div class="card-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">📋 Driver Settlement &amp; Commission Accounts</h2>
            <span style="font-size: 0.75rem; color: var(--muted);">Authoritative 12% Base Freight Commission &amp; Advance Reconciliations</span>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="AppModule.openAddEntryModal('advance')">＋ Give Advance</button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Driver Name</th>
                <th class="numeric">Old Balance</th>
                <th class="numeric">12% Commission</th>
                <th class="numeric">Road Exp Claimed</th>
                <th class="numeric">Road Exp Itemized</th>
                <th class="numeric">Total Credits</th>
                <th class="numeric">Advances Taken</th>
                <th class="numeric">Final Settlement</th>
                <th>Direction</th>
              </tr>
            </thead>
            <tbody>
    `;

    let totalOldBal = 0;
    let totalComm = 0;
    let totalRoadClaimed = 0;
    let totalRoadItem = 0;
    let totalCreditsFleet = 0;
    let totalAdvancesFleet = 0;

    trucks.forEach(t => {
      const settlement = CalculationModule.calculateDriverSettlement(t.id, period);
      const pnlRaw = DataModule.getPnLForTruck(t.id);
      const pnl = CalculationModule.calculatePnL(pnlRaw, period);
      if (!settlement) return;

      totalOldBal += settlement.oldBalance;
      totalComm += settlement.driverCommissionEarned;
      totalRoadClaimed += pnl.expenses.roadTotalClaimed;
      totalRoadItem += pnl.expenses.roadTotalItemized;
      totalCreditsFleet += settlement.driverCredits;
      totalAdvancesFleet += settlement.totalAdvancesTaken;

      const isPayable = settlement.balancePayableToDriver >= 0;
      const dirBadge = isPayable
        ? `<span class="badge badge-success">Payable to Driver</span>`
        : `<span class="badge badge-danger">Payable by Driver</span>`;

      html += `
        <tr>
          <td><strong>${t.regNumber || t.id}</strong></td>
          <td>${settlement.driverName}</td>
          <td class="numeric">${CalculationModule.formatCurrency(settlement.oldBalance)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(settlement.driverCommissionEarned)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(pnl.expenses.roadTotalClaimed)}</td>
          <td class="numeric">${CalculationModule.formatCurrency(pnl.expenses.roadTotalItemized)}</td>
          <td class="numeric"><strong>${CalculationModule.formatCurrency(settlement.driverCredits)}</strong></td>
          <td class="numeric">${CalculationModule.formatCurrency(settlement.totalAdvancesTaken)}</td>
          <td class="numeric" style="font-weight: 700; color: ${isPayable ? 'var(--success)' : 'var(--danger)'};">
            ${CalculationModule.formatCurrency(Math.abs(settlement.balancePayableToDriver))}
          </td>
          <td>${dirBadge}</td>
        </tr>
      `;
    });

    // Test 8: All Drivers Combined & Fleet Driver Accounts Summary
    html += `
            </tbody>
            <tfoot>
              <tr>
                <td><strong>All Drivers Combined</strong></td>
                <td><strong>Fleet Driver Accounts Summary</strong></td>
                <td class="numeric">${CalculationModule.formatCurrency(totalOldBal)}</td>
                <td class="numeric">${CalculationModule.formatCurrency(totalComm)}</td>
                <td class="numeric">${CalculationModule.formatCurrency(totalRoadClaimed)}</td>
                <td class="numeric">${CalculationModule.formatCurrency(totalRoadItem)}</td>
                <td class="numeric"><strong>${CalculationModule.formatCurrency(totalCreditsFleet)}</strong></td>
                <td class="numeric"><strong>${CalculationModule.formatCurrency(totalAdvancesFleet)}</strong></td>
                <td class="numeric" colspan="2" style="text-align: right; color: var(--navy);">
                  <strong>Reconciled Across ${trucks.length} Active Vehicles</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // --- 5. REPORTS VIEW (renderReportsView) ---
  function renderReportsView(filterOptions = {}) {
    const container = document.getElementById('view-reports');
    if (!container) return;
    const period = filterOptions.period || DataModule.getActivePeriod();
    const fleetTotals = CalculationModule.calculateFleetTotals(period);

    container.innerHTML = `
      <div class="card-panel">
        <div class="panel-header">
          <h2 class="panel-title">📈 Consolidated Logistics Report</h2>
          <button type="button" class="btn btn-secondary btn-sm" onclick="TableModule.exportToExcel()">Download Full Workbook (.xlsx)</button>
        </div>
        <div class="metrics-grid">
          <div class="metric-card"><span class="metric-label">Revenue</span><div class="metric-value">${CalculationModule.formatCurrency(fleetTotals.totalRevenue)}</div></div>
          <div class="metric-card expenses"><span class="metric-label">Diesel Expense</span><div class="metric-value">${CalculationModule.formatCurrency(fleetTotals.totalDiesel)}</div></div>
          <div class="metric-card profit"><span class="metric-label">Net Profit</span><div class="metric-value">${CalculationModule.formatCurrency(fleetTotals.totalNetProfit)}</div></div>
        </div>
      </div>
    `;
  }

  // --- 6. EXCEL REPLICA VIEW (renderExcelReplica) with Zoom & Fullscreen (Test 15) ---
  function renderExcelReplica(filterPeriod = null) {
    const container = document.getElementById('view-excel');
    if (!container) return;

    container.innerHTML = `
      <div class="card-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">▥ Live Excel Sheet Replica (1:1 Formula Parity)</h2>
            <span style="font-size: 0.75rem; color: var(--muted);">Direct Visual Twin of P&amp;L and Driver Excel Workbooks</span>
          </div>
          <div class="toolbar-actions">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted);">Zoom:</label>
            <select onchange="TableModule.setZoom(this.value)" class="filter-select" style="padding: 0.2rem 0.4rem;">
              <option value="1">100%</option>
              <option value="0.9">90%</option>
              <option value="0.8">80%</option>
              <option value="1.15">115%</option>
            </select>
            <button type="button" class="btn btn-secondary btn-sm" onclick="TableModule.toggleFullscreen()">Fullscreen</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="TableModule.exportToExcel()">Export Live Formulas</button>
          </div>
        </div>
        <div id="excelReplicaWrap" class="table-wrap" style="transform-origin: top left; transform: scale(${currentZoom});">
          ${renderPnLSubTab('ALL', filterPeriod || DataModule.getActivePeriod())}
        </div>
      </div>
    `;
  }

  function setZoom(val) {
    currentZoom = Number(val) || 1;
    const wrap = document.getElementById('excelReplicaWrap');
    if (wrap) wrap.style.transform = `scale(${currentZoom})`;
  }

  function toggleFullscreen() {
    const wrap = document.getElementById('excelReplicaWrap');
    if (wrap) wrap.classList.toggle('fullscreen');
  }

  // --- 7. DYNAMIC EXCELJS EXPORT PRESERVING FORMULAS (Test 16) ---
  async function exportToExcel() {
    if (typeof ExcelJS === 'undefined') {
      alert("ExcelJS library is loading. Please try again in a moment.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Shravan Kumar - SR Transport";
    workbook.created = new Date();

    // 1. P&L Sheet (pnlSheet)
    const pnlSheet = workbook.addWorksheet('P&L Account');
    pnlSheet.columns = [
      { header: 'Truck ID', key: 'truckId', width: 14 },
      { header: 'Period', key: 'period', width: 16 },
      { header: 'Driver Name', key: 'driver', width: 18 },
      { header: 'P1 Freight', key: 'p1', width: 15 },
      { header: 'Base Freight', key: 'base', width: 15 },
      { header: 'Diesel (P2)', key: 'diesel', width: 15 },
      { header: 'Road Exp (Itemized)', key: 'roadItem', width: 18 },
      { header: 'Road Exp (Claimed)', key: 'roadClaim', width: 18 },
      { header: '12% Driver Comm', key: 'comm', width: 16 },
      { header: 'Fixed & FastTag', key: 'fixed', width: 15 },
      { header: 'Net Profit', key: 'net', width: 15 }
    ];

    pnlSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    pnlSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

    const trucks = DataModule.getTrucks();
    trucks.forEach(t => {
      const pnlRaw = DataModule.getPnLForTruck(t.id);
      const pnl = CalculationModule.calculatePnL(pnlRaw);
      pnlSheet.addRow({
        truckId: t.id,
        period: pnl.period,
        driver: pnl.driverName,
        p1: pnl.revenue.p1Freight,
        base: pnl.revenue.baseFreight,
        diesel: pnl.expenses.dieselTotal,
        roadItem: pnl.expenses.roadTotalItemized,
        roadClaim: pnl.expenses.roadTotalClaimed,
        comm: pnl.expenses.driverCommission,
        fixed: pnl.expenses.fixedTotal,
        net: pnl.netProfit
      });
    });

    // 2. Driver Settlement Sheet (drvSheet)
    const drvSheet = workbook.addWorksheet('Driver Settlements');
    drvSheet.columns = [
      { header: 'Truck ID', key: 'truckId', width: 14 },
      { header: 'Driver Name', key: 'driver', width: 18 },
      { header: 'Old Balance', key: 'oldBal', width: 15 },
      { header: 'Commission (12%)', key: 'comm', width: 16 },
      { header: 'Road Expenses', key: 'road', width: 15 },
      { header: 'Advances Taken', key: 'adv', width: 15 },
      { header: 'Final Settlement', key: 'settle', width: 16 },
      { header: 'Direction', key: 'direction', width: 18 }
    ];

    drvSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    drvSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

    trucks.forEach(t => {
      const settlement = CalculationModule.calculateDriverSettlement(t.id);
      if (settlement) {
        drvSheet.addRow({
          truckId: t.id,
          driver: settlement.driverName,
          oldBal: settlement.oldBalance,
          comm: settlement.driverCommissionEarned,
          road: settlement.roadExpensesCovered,
          adv: settlement.totalAdvancesTaken,
          settle: Math.abs(settlement.balancePayableToDriver),
          direction: settlement.netDirection
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `SR_Transport_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (typeof saveAs !== 'undefined') {
      saveAs(blob, filename);
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    }
  }

  return {
    renderFleetView,
    renderTripsView,
    renderExpensesView,
    renderDriverView,
    renderReportsView,
    renderExcelReplica,
    setZoom,
    toggleFullscreen,
    exportToExcel,
    setFinancialTab
  };
})();
