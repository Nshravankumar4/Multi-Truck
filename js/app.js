/**
 * Transport Brokerage Ledger Pvt Ltd
 * Main Application Orchestrator & State Controller (app.js)
 */

const AppModule = (function () {
  'use strict';

  // Navigation View Mapping (Test 22)
  const VIEW_MAP = {
    'dashboard': 'view-dashboard',
    'vehicles': 'view-fleet',
    'fleet': 'view-fleet',
    'trips': 'view-trips',
    'financials': 'view-expenses',
    'pnl': 'view-pnl',
    'expenses': 'view-expenses',
    'settlements': 'view-driver',
    'driver': 'view-driver',
    'reports': 'view-reports',
    'excel': 'view-excel',
    'settings': 'view-settings'
  };

  const VIEW_TITLES = {
    'dashboard': { title: 'Dashboard', sub: 'Multi-truck financial performance & trip accounts' },
    'vehicles': { title: 'Vehicles', sub: 'Commercial fleet registry & vehicle management' },
    'fleet': { title: 'Vehicles', sub: 'Commercial fleet registry & vehicle management' },
    'trips': { title: 'Trips', sub: 'Comprehensive freight and shipment ledger' },
    'financials': { title: 'Financials', sub: 'P&L, diesel logs, vouchers & fixed expenses' },
    'settlements': { title: 'Driver Settlements', sub: 'Authoritative 12% commission & advance reconciliation' },
    'reports': { title: 'Consolidated Reports', sub: 'Executive freight & fleet summary' },
    'excel': { title: 'Live Excel Sheet', sub: '1:1 Visual replica of original workbooks' },
    'settings': { title: 'Settings', sub: 'Project, cloud spreadsheet & security preferences' }
  };

  // State
  let currentView = 'dashboard';
  let currentTruckFilter = 'ALL';
  let currentPeriodFilter = '2026-10';
  let customStartDate = '';
  let customEndDate = '';
  let currentSearchQuery = '';

  let activeModalType = 'trip';
  let editingRecordId = null;
  let editingTruckId = null;

  function init() {
    checkAuthSession();
    renderProjectSelector();
    renderPeriodSelector();
    renderTruckFilterPills();
    renderCurrentView();
    setupEventListeners();
    ApiModule.initCrossTabSync(onRemoteDataChanged);
  }

  function checkAuthSession() {
    const user = AuthModule.getCurrentUser();
    const authView = document.getElementById('auth-view') || document.getElementById('authWrapper');
    const appShell = document.getElementById('app-shell') || document.getElementById('appShell');

    if (!user) {
      if (appShell) { appShell.hidden = true; appShell.style.display = 'none'; }
      if (authView) { authView.hidden = false; authView.style.display = 'grid'; }
      AuthModule.selectLoginUser('Admin');
    } else {
      if (authView) { authView.hidden = true; authView.style.display = 'none'; }
      if (appShell) { appShell.hidden = false; appShell.style.display = 'flex'; }
      updateUserBadge(user);
    }
  }

  function updateUserBadge(user) {
    const nameEl = document.getElementById('userDisplayName') || document.getElementById('user-name');
    const roleEl = document.getElementById('userRoleBadge') || document.getElementById('user-role');
    if (nameEl) nameEl.textContent = user.displayName || user.username;
    if (roleEl) roleEl.textContent = user.role || 'USER';
  }

  function navigateToView(viewName) {
    const targetSectionId = VIEW_MAP[viewName] || 'view-dashboard';
    currentView = viewName;

    // Toggle active state on sidebar tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => {
      if (t.getAttribute('data-view') === viewName || 
          (viewName === 'vehicles' && t.getAttribute('data-view') === 'fleet') ||
          (viewName === 'financials' && t.getAttribute('data-view') === 'expenses') ||
          (viewName === 'settlements' && t.getAttribute('data-view') === 'driver')) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    // Toggle view containers
    Object.values(VIEW_MAP).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === targetSectionId) {
          el.hidden = false;
          el.style.display = 'block';
        } else {
          el.hidden = true;
          el.style.display = 'none';
        }
      }
    });

    // Update Top Title
    const titleMeta = VIEW_TITLES[viewName] || VIEW_TITLES['dashboard'];
    const titleEl = document.getElementById('page-title');
    const subEl = document.getElementById('page-subtitle');
    if (titleEl) titleEl.textContent = titleMeta.title;
    if (subEl) subEl.textContent = titleMeta.sub;

    closeSidebar();
    renderCurrentView();
  }

  function renderCurrentView() {
    const filterOptions = {
      period: currentPeriodFilter,
      startDate: customStartDate,
      endDate: customEndDate,
      searchQuery: currentSearchQuery
    };

    if (currentView === 'dashboard') {
      DashboardModule.renderDashboard(currentPeriodFilter);
    } else if (currentView === 'vehicles' || currentView === 'fleet') {
      TableModule.renderFleetView(filterOptions);
    } else if (currentView === 'trips') {
      TableModule.renderTripsView(currentTruckFilter, filterOptions);
    } else if (currentView === 'financials' || currentView === 'pnl' || currentView === 'expenses') {
      TableModule.renderExpensesView(currentTruckFilter, filterOptions);
    } else if (currentView === 'settlements' || currentView === 'driver') {
      TableModule.renderDriverView(currentTruckFilter, filterOptions);
    } else if (currentView === 'reports') {
      TableModule.renderReportsView(filterOptions);
    } else if (currentView === 'excel') {
      TableModule.renderExcelReplica(currentPeriodFilter);
    } else if (currentView === 'settings') {
      renderSettingsView();
    }
  }

  // --- Dynamic Project Management (Test 2) ---
  function renderProjectSelector() {
    const select = document.getElementById('projectSelectDropdown');
    if (!select) return;
    const projects = DataModule.getProjects();
    const activePrj = DataModule.getActiveProject();

    select.innerHTML = '';
    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      if (activePrj && activePrj.id === p.id) opt.selected = true;
      select.appendChild(opt);
    });

    if (AuthModule.isAdmin()) {
      const addOpt = document.createElement('option');
      addOpt.value = '__ADD_NEW__';
      addOpt.textContent = '＋ Create New Project...';
      select.appendChild(addOpt);
    }
  }

  function selectProject(projectId) {
    if (projectId === '__ADD_NEW__') {
      openAddProjectModal();
      return;
    }
    DataModule.setCurrentProjectId(projectId);
    renderTruckFilterPills();
    renderCurrentView();
    showToast(`Switched to ${DataModule.getActiveProject().name}`, 'info');
  }

  function openAddProjectModal() {
    if (!AuthModule.isAdmin()) {
      alert("Only Administrator can create new projects.");
      return;
    }
    const name = prompt("Enter New Project Name (e.g. Project 002 - North Corridor):");
    if (!name || name.trim() === '') return;
    const desc = prompt("Enter Project Description:") || "Commercial Transport Route";
    const sheetId = prompt("Enter Dedicated Google Spreadsheet ID (or leave blank to configure later):") || "";

    const newPrj = DataModule.addProject({
      name: name.trim(),
      description: desc.trim(),
      spreadsheetId: sheetId.trim()
    });

    if (newPrj) {
      renderProjectSelector();
      selectProject(newPrj.id);
      showToast(`📁 Project ${newPrj.name} created!`, 'success');
    }
  }

  // --- Dynamic Period Selector (Test 4) ---
  function renderPeriodSelector() {
    const select = document.getElementById('filterPeriodSelect');
    if (!select) return;
    const periods = DataModule.getAccountingPeriods();
    const activePeriod = DataModule.getActivePeriod();

    select.innerHTML = '';
    periods.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      if (p.id === activePeriod) opt.selected = true;
      select.appendChild(opt);
    });

    const allOpt = document.createElement('option');
    allOpt.value = 'ALL';
    allOpt.textContent = 'All Accounting Periods';
    select.appendChild(allOpt);
  }

  function selectPeriodFilter(period) {
    currentPeriodFilter = period;
    DataModule.setActivePeriod(period === 'ALL' ? '2026-10' : period);
    renderCurrentView();
  }

  // --- Dynamic Truck Filter Pills (Test 3) ---
  function renderTruckFilterPills() {
    const container = document.getElementById('truckFilterPillsContainer');
    if (!container) return;
    const trucks = DataModule.getTrucks();

    container.innerHTML = '';

    // "All Fleet" pill
    const allPill = document.createElement('button');
    allPill.type = 'button';
    allPill.className = 'truck-pill ' + (currentTruckFilter === 'ALL' ? 'active' : '');
    allPill.textContent = 'All Fleet';
    allPill.addEventListener('click', () => selectTruckFilter('ALL'));
    container.appendChild(allPill);

    trucks.forEach(t => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'truck-pill ' + (currentTruckFilter === t.id ? 'active' : '');
      pill.textContent = t.regNumber || t.id;
      pill.addEventListener('click', () => selectTruckFilter(t.id));
      container.appendChild(pill);
    });

    if (AuthModule.isAdmin()) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'truck-pill';
      addBtn.textContent = '＋ Add Truck';
      addBtn.style.borderStyle = 'dashed';
      addBtn.addEventListener('click', openAddTruckModal);
      container.appendChild(addBtn);
    }
  }

  function selectTruckFilter(truckId) {
    currentTruckFilter = truckId;
    renderTruckFilterPills();
    renderCurrentView();
  }

  function filterByTruckAndNavigate(truckId, targetView) {
    currentTruckFilter = truckId;
    renderTruckFilterPills();
    navigateToView(targetView);
  }

  // --- Add Truck Modal (Test 3) ---
  function openAddTruckModal() {
    if (!AuthModule.isAdmin()) {
      alert("Only Administrator can register new vehicles.");
      return;
    }
    const dialog = document.getElementById('truckModal');
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else if (dialog) {
      dialog.style.display = 'block';
    }
  }

  function closeTruckModal() {
    const dialog = document.getElementById('truckModal');
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    } else if (dialog) {
      dialog.style.display = 'none';
    }
  }

  function handleAddTruckSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const reg = document.getElementById('truckRegInput').value.trim().toUpperCase();
    const model = document.getElementById('truckModelInput').value.trim() || 'Commercial Carrier';
    const driverName = document.getElementById('truckDriverInput').value.trim() || 'Assigned Driver';
    const phone = document.getElementById('truckDriverPhoneInput').value.trim() || '';
    const capacity = document.getElementById('truckCapacityInput').value.trim() || '35 Tons';
    const route = document.getElementById('truckRouteInput').value.trim() || 'Interstate Route';

    if (!reg) {
      alert("Registration Number is required.");
      return;
    }

    const newTruck = DataModule.addTruck({
      id: reg,
      regNumber: reg,
      model,
      capacity,
      driverName,
      assignedRoute: route
    });

    if (newTruck) {
      closeTruckModal();
      renderTruckFilterPills();
      selectTruckFilter(newTruck.id);
      showToast(`🚛 Vehicle ${newTruck.regNumber} registered successfully!`, 'success');
    } else {
      alert("A vehicle with this registration number already exists.");
    }
  }

  // --- Reusable Entry Modal (Trips, Diesel, Expenses, Advances) ---
  function openAddEntryModal(type = 'trip') {
    activeModalType = type;
    editingRecordId = null;
    editingTruckId = null;

    const dialog = document.getElementById('entryModal');
    const title = document.getElementById('modalTitle');
    const typeSelect = document.getElementById('modalEntryType');
    const truckSelect = document.getElementById('modalTruckSelect');

    if (title) title.textContent = `＋ Add ${type.toUpperCase()} Record`;
    if (typeSelect) {
      typeSelect.value = type;
      typeSelect.disabled = false;
    }

    // Populate truck dropdown
    if (truckSelect) {
      truckSelect.innerHTML = '';
      DataModule.getTrucks().forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.regNumber} (${t.model})`;
        if (currentTruckFilter !== 'ALL' && currentTruckFilter === t.id) opt.selected = true;
        truckSelect.appendChild(opt);
      });
    }

    toggleModalFields(type);

    // Reset date fields to today
    const today = new Date().toISOString().split('T')[0];
    const tripDate = document.getElementById('tripDate');
    const dieselDate = document.getElementById('dieselDate');
    const advDate = document.getElementById('advDate');
    if (tripDate) tripDate.value = today;
    if (dieselDate) dieselDate.value = today;
    if (advDate) advDate.value = today;

    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else if (dialog) {
      dialog.style.display = 'block';
    }
  }

  function openEditModal(type, truckId, recordId) {
    activeModalType = type;
    editingRecordId = recordId;
    editingTruckId = truckId;

    const dialog = document.getElementById('entryModal');
    const title = document.getElementById('modalTitle');
    const typeSelect = document.getElementById('modalEntryType');
    const truckSelect = document.getElementById('modalTruckSelect');

    if (title) title.textContent = `✏️ Edit ${type.toUpperCase()} #${recordId}`;
    if (typeSelect) {
      typeSelect.value = type;
      typeSelect.disabled = true;
    }

    if (truckSelect) {
      truckSelect.innerHTML = '';
      DataModule.getTrucks().forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.regNumber} (${t.model})`;
        if (t.id === truckId) opt.selected = true;
        truckSelect.appendChild(opt);
      });
      truckSelect.disabled = true;
    }

    toggleModalFields(type);

    const pnl = DataModule.getPnLForTruck(truckId);
    if (!pnl) return;

    if (type === 'trip') {
      const tr = (pnl.trips || []).find(t => t.id === recordId);
      if (tr) {
        document.getElementById('tripDate').value = tr.date || '';
        document.getElementById('tripTransporter').value = tr.transporter || '';
        document.getElementById('tripSource').value = tr.source || '';
        document.getElementById('tripDest').value = tr.destination || '';
        document.getElementById('tripFreightP1').value = tr.freightP1 || 0;
        document.getElementById('tripBaseFreight').value = tr.baseFreight || 0;
        document.getElementById('tripDiesel').value = tr.dieselAmount || 0;
        document.getElementById('tripRoadExp').value = tr.roadExpenses || 0;
      }
    } else if (type === 'diesel') {
      const dl = (pnl.dieselLogs || []).find(d => d.id === recordId);
      if (dl) {
        document.getElementById('dieselDate').value = dl.date || '';
        document.getElementById('dieselPump').value = dl.pump || '';
        document.getElementById('dieselLiters').value = dl.liters || 0;
        document.getElementById('dieselRate').value = dl.rate || 0;
        document.getElementById('dieselAmount').value = dl.amount || 0;
      }
    } else if (type === 'advance') {
      const adv = (pnl.advances || []).find(a => a.id === recordId);
      if (adv) {
        document.getElementById('advDate').value = adv.date || '';
        document.getElementById('advType').value = adv.type || 'Cash';
        document.getElementById('advPurpose').value = adv.purpose || '';
        document.getElementById('advAmount').value = adv.amount || 0;
      }
    } else if (type === 'expense') {
      const exp = (pnl.roadExpenseItems || []).find(e => e.id === recordId);
      if (exp) {
        document.getElementById('expCategory').value = exp.category || 'Toll / RTO';
        document.getElementById('expDesc').value = exp.desc || '';
        document.getElementById('expAmount').value = exp.amount || 0;
      }
    }

    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else if (dialog) {
      dialog.style.display = 'block';
    }
  }

  function toggleModalFields(type) {
    const tripF = document.getElementById('modalFieldsTrip');
    const dieselF = document.getElementById('modalFieldsDiesel');
    const advF = document.getElementById('modalFieldsAdvance');
    const expF = document.getElementById('modalFieldsExpense');

    if (tripF) tripF.style.display = (type === 'trip') ? 'block' : 'none';
    if (dieselF) dieselF.style.display = (type === 'diesel') ? 'block' : 'none';
    if (advF) advF.style.display = (type === 'advance') ? 'block' : 'none';
    if (expF) expF.style.display = (type === 'expense') ? 'block' : 'none';
  }

  function closeEntryModal() {
    const dialog = document.getElementById('entryModal');
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    } else if (dialog) {
      dialog.style.display = 'none';
    }
  }

  function handleSaveEntry(e) {
    if (e && e.preventDefault) e.preventDefault();
    const typeSelect = document.getElementById('modalEntryType');
    const truckSelect = document.getElementById('modalTruckSelect');
    const type = typeSelect ? typeSelect.value : activeModalType;
    const truckId = truckSelect ? truckSelect.value : editingTruckId;

    if (!truckId) {
      alert("Please select a vehicle.");
      return;
    }

    const isEdit = !!editingRecordId;

    if (type === 'trip') {
      const tripData = {
        date: document.getElementById('tripDate').value,
        transporter: document.getElementById('tripTransporter').value.trim(),
        source: document.getElementById('tripSource').value.trim(),
        destination: document.getElementById('tripDest').value.trim(),
        freightP1: Number(document.getElementById('tripFreightP1').value) || 0,
        baseFreight: Number(document.getElementById('tripBaseFreight').value) || 0,
        dieselAmount: Number(document.getElementById('tripDiesel').value) || 0,
        roadExpenses: Number(document.getElementById('tripRoadExp').value) || 0
      };

      if (!tripData.source || !tripData.destination || tripData.freightP1 <= 0) {
        alert("Please provide valid origin, destination, and freight amount.");
        return;
      }

      if (isEdit) DataModule.updateTrip(truckId, editingRecordId, tripData);
      else DataModule.addTrip(truckId, tripData);

    } else if (type === 'diesel') {
      const dslData = {
        date: document.getElementById('dieselDate').value,
        pump: document.getElementById('dieselPump').value.trim(),
        liters: Number(document.getElementById('dieselLiters').value) || 0,
        rate: Number(document.getElementById('dieselRate').value) || 0,
        amount: Number(document.getElementById('dieselAmount').value) || 0
      };

      if (isEdit) DataModule.updateDiesel(truckId, editingRecordId, dslData);
      else DataModule.addDiesel(truckId, dslData);

    } else if (type === 'advance') {
      const advData = {
        date: document.getElementById('advDate').value,
        type: document.getElementById('advType').value,
        purpose: document.getElementById('advPurpose').value.trim(),
        amount: Number(document.getElementById('advAmount').value) || 0
      };

      if (isEdit) DataModule.updateAdvance(truckId, editingRecordId, advData);
      else DataModule.addAdvance(truckId, advData);

    } else if (type === 'expense') {
      const expData = {
        category: document.getElementById('expCategory').value,
        desc: document.getElementById('expDesc').value.trim(),
        amount: Number(document.getElementById('expAmount').value) || 0
      };

      if (isEdit) DataModule.updateExpense(truckId, editingRecordId, expData);
      else DataModule.addExpense(truckId, expData);
    }

    closeEntryModal();
    renderCurrentView();
    showToast(isEdit ? 'Record updated successfully!' : 'Record saved successfully!', 'success');
  }

  // --- Strict RBAC Delete Guard (Test 14) ---
  function confirmDelete(type, truckId, recordId) {
    if (!AuthModule.isAdmin()) {
      alert("Access Denied: Operators (Rudra) cannot delete ledger entries.\nPlease contact Administrator (Shravan Kumar).");
      return;
    }

    if (!confirm(`Are you sure you want to delete this ${type.toUpperCase()} record permanently?`)) {
      return;
    }

    let ok = false;
    if (type === 'trip') ok = DataModule.deleteTrip(truckId, recordId);
    else if (type === 'diesel') ok = DataModule.deleteDiesel(truckId, recordId);
    else if (type === 'advance') ok = DataModule.deleteAdvance(truckId, recordId);
    else if (type === 'expense') ok = DataModule.deleteExpense(truckId, recordId);

    if (ok) {
      renderCurrentView();
      showToast(`${type.toUpperCase()} record removed.`, 'info');
      // Also notify server
      ApiModule.deleteRecordOnServer(type, recordId);
    }
  }

  // --- Settings View & Modal (Test 21) ---
  function renderSettingsView() {
    const container = document.getElementById('view-settings');
    if (!container) return;

    const user = AuthModule.getCurrentUser();
    const config = ApiModule.getConfig();
    const activePrj = DataModule.getActiveProject();

    let adminPanel = '';
    if (AuthModule.isAdmin()) {
      adminPanel = `
        <div class="card-panel">
          <div class="panel-header">
            <h2 class="panel-title">⚡ Google Cloud Integration (Admin Only)</h2>
            <span class="badge badge-success">Verified Admin Access</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--muted); margin: 0 0 1rem;">
            Direct links to the authoritative Google Spreadsheet and Apps Script backend are restricted to Administrator.
          </p>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="ApiModule.openGoogleSheet()">📊 Open Google Spreadsheet</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="AppModule.openSettingsModal()">⚙️ Configure Endpoints</button>
          </div>
        </div>
      `;
    } else {
      adminPanel = `
        <div class="card-panel">
          <div class="notice notice-info">
            Cloud spreadsheet settings and direct URLs are protected. Contact Administrator for backend configuration.
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="card-panel">
        <div class="panel-header">
          <h2 class="panel-title">👤 User Account Profile</h2>
        </div>
        <p><strong>Username:</strong> ${user ? user.username : 'N/A'}</p>
        <p><strong>Role:</strong> <span class="badge ${AuthModule.isAdmin() ? 'badge-success' : 'badge-info'}">${user ? user.role : 'OPERATOR'}</span></p>
        <p><strong>Active Project:</strong> ${activePrj ? activePrj.name : 'Project 001'}</p>
        <div style="margin-top: 1rem;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AppModule.openChangePasswordModal()">🔑 Change Password</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="AuthModule.logout()">↪ Log Out</button>
        </div>
      </div>
      ${adminPanel}
    `;
  }

  function openSettingsModal() {
    if (!AuthModule.isAdmin()) {
      alert("Access Denied: Only Administrator (Admin) can view and configure cloud spreadsheet settings.");
      return;
    }
    const dialog = document.getElementById('settingsModal');
    const sheetIdInput = document.getElementById('settingsSheetIdInput');
    const gasUrlInput = document.getElementById('settingsGasUrlInput');

    const config = ApiModule.getConfig();
    if (sheetIdInput) sheetIdInput.value = config.SPREADSHEET_ID;
    if (gasUrlInput) gasUrlInput.value = config.GAS_URL;

    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else if (dialog) {
      dialog.style.display = 'block';
    }
  }

  function closeSettingsModal() {
    const dialog = document.getElementById('settingsModal');
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    } else if (dialog) {
      dialog.style.display = 'none';
    }
  }

  function saveSettings(e) {
    if (e && e.preventDefault) e.preventDefault();
    const gasUrl = document.getElementById('settingsGasUrlInput').value;
    if (ApiModule.updateGasUrl(gasUrl)) {
      closeSettingsModal();
      showToast("Cloud configuration saved!", 'success');
    }
  }

  function openChangePasswordModal() {
    const dialog = document.getElementById('changePasswordModal');
    const userSpan = document.getElementById('changePwdUserDisplay');
    const user = AuthModule.getCurrentUser();
    if (userSpan && user) userSpan.textContent = user.displayName || user.username;
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else if (dialog) {
      dialog.style.display = 'block';
    }
  }

  function closeChangePasswordModal() {
    const dialog = document.getElementById('changePasswordModal');
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    } else if (dialog) {
      dialog.style.display = 'none';
    }
  }

  async function handlePasswordChange(e) {
    if (e && e.preventDefault) e.preventDefault();
    const newPwd = document.getElementById('newPasswordInput').value;
    const confirmPwd = document.getElementById('confirmPasswordInput').value;

    if (newPwd !== confirmPwd) {
      alert("Passwords do not match!");
      return;
    }

    const user = AuthModule.getCurrentUser();
    if (!user) return;

    const res = await AuthModule.updatePassword(user.username, newPwd);
    if (res.success) {
      closeChangePasswordModal();
      showToast("Password updated successfully!", 'success');
    } else {
      alert(res.message);
    }
  }

  // --- Sidebar Mobile Navigation ---
  function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const scrim = document.getElementById('sidebar-scrim');
    if (sidebar) sidebar.classList.add('open');
    if (scrim) scrim.classList.add('open');
  }

  function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const scrim = document.getElementById('sidebar-scrim');
    if (sidebar) sidebar.classList.remove('open');
    if (scrim) scrim.classList.remove('open');
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || document.getElementById('toast');
    if (!container) return;

    const pill = document.createElement('div');
    pill.className = `toast-pill toast-${type}`;
    pill.textContent = message;
    container.appendChild(pill);

    setTimeout(() => {
      pill.style.opacity = '0';
      setTimeout(() => pill.remove(), 400);
    }, 3000);
  }

  function onRemoteDataChanged() {
    renderCurrentView();
    showToast("Data synchronized from another session", 'info');
  }

  // --- Centralized Event Listener Registration ---
  function setupEventListeners() {
    // Navigation Tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        const view = this.getAttribute('data-view');
        if (view) navigateToView(view);
      });
    });

    // Mobile Sidebar controls
    const openBtn = document.getElementById('sidebar-open');
    if (openBtn) openBtn.addEventListener('click', openSidebar);

    const closeBtn = document.getElementById('sidebar-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

    const scrim = document.getElementById('sidebar-scrim');
    if (scrim) scrim.addEventListener('click', closeSidebar);

    // Logout button
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) logoutBtn.addEventListener('click', () => AuthModule.logout());

    // Top action buttons
    const topAddBtn = document.getElementById('topAddEntryBtn');
    if (topAddBtn) topAddBtn.addEventListener('click', () => openAddEntryModal('trip'));

    const topExportBtn = document.getElementById('topExportExcelBtn');
    if (topExportBtn) topExportBtn.addEventListener('click', () => TableModule.exportToExcel());

    // Filter toolbar controls
    const projectSelect = document.getElementById('projectSelectDropdown');
    if (projectSelect) {
      projectSelect.addEventListener('change', function () {
        selectProject(this.value);
      });
    }

    const periodSelect = document.getElementById('filterPeriodSelect');
    if (periodSelect) {
      periodSelect.addEventListener('change', function () {
        selectPeriodFilter(this.value);
      });
    }

    const startDate = document.getElementById('filterStartDate');
    if (startDate) {
      startDate.addEventListener('change', function () {
        customStartDate = this.value;
        renderCurrentView();
      });
    }

    const endDate = document.getElementById('filterEndDate');
    if (endDate) {
      endDate.addEventListener('change', function () {
        customEndDate = this.value;
        renderCurrentView();
      });
    }

    // Cloud sync buttons
    const sidebarSync = document.getElementById('sidebarSyncBtn');
    if (sidebarSync) sidebarSync.addEventListener('click', () => ApiModule.syncLedgerData());

    const headerSync = document.getElementById('btnHeaderSync');
    if (headerSync) headerSync.addEventListener('click', () => ApiModule.syncLedgerData());

    // Form Event Listeners
    const authForm = document.getElementById('authLoginForm');
    if (authForm) authForm.addEventListener('submit', AuthModule.handleLogin);

    const entryForm = document.getElementById('addEntryForm');
    if (entryForm) entryForm.addEventListener('submit', handleSaveEntry);

    const closeEntryBtn = document.getElementById('closeEntryModalBtn');
    if (closeEntryBtn) closeEntryBtn.addEventListener('click', closeEntryModal);

    const cancelEntryBtn = document.getElementById('cancelEntryModalBtn');
    if (cancelEntryBtn) cancelEntryBtn.addEventListener('click', closeEntryModal);

    const entryTypeSelect = document.getElementById('modalEntryType');
    if (entryTypeSelect) {
      entryTypeSelect.addEventListener('change', function () {
        toggleModalFields(this.value);
      });
    }

    const truckForm = document.getElementById('addTruckForm');
    if (truckForm) truckForm.addEventListener('submit', handleAddTruckSubmit);

    const closeTruckBtn = document.getElementById('closeTruckModalBtn');
    if (closeTruckBtn) closeTruckBtn.addEventListener('click', closeTruckModal);

    const cancelTruckBtn = document.getElementById('cancelTruckModalBtn');
    if (cancelTruckBtn) cancelTruckBtn.addEventListener('click', closeTruckModal);

    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) settingsForm.addEventListener('submit', saveSettings);

    const closeSettingsBtn = document.getElementById('closeSettingsModalBtn');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);

    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', closeSettingsModal);

    const openSheetBtn = document.getElementById('openCloudSheetBtn');
    if (openSheetBtn) openSheetBtn.addEventListener('click', () => ApiModule.openGoogleSheet());

    const restoreDataBtn = document.getElementById('restoreOriginalDataBtn');
    if (restoreDataBtn) {
      restoreDataBtn.addEventListener('click', () => {
        if (confirm("Reset local data back to the verified Excel workbooks?")) {
          DataModule.restoreOriginalData();
          renderCurrentView();
          showToast("Data re-seeded from master records", 'success');
        }
      });
    }

    const pwdForm = document.getElementById('changePasswordForm');
    if (pwdForm) pwdForm.addEventListener('submit', handlePasswordChange);

    const closePwdBtn = document.getElementById('closePasswordModalBtn');
    if (closePwdBtn) closePwdBtn.addEventListener('click', closeChangePasswordModal);

    const cancelPwdBtn = document.getElementById('cancelPasswordBtn');
    if (cancelPwdBtn) cancelPwdBtn.addEventListener('click', closeChangePasswordModal);

    const togglePwdBtn = document.getElementById('togglePasswordBtn');
    if (togglePwdBtn) togglePwdBtn.addEventListener('click', AuthModule.togglePasswordVisibility);

    const userAdminBtn = document.getElementById('userBtnAdmin');
    if (userAdminBtn) userAdminBtn.addEventListener('click', () => AuthModule.selectLoginUser('Admin'));

    const userRudraBtn = document.getElementById('userBtnRudra');
    if (userRudraBtn) userRudraBtn.addEventListener('click', () => AuthModule.selectLoginUser('Rudra'));
  }

  // Auto-init on DOMContentLoaded
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', init);
  }

  return {
    init,
    navigateToView,
    renderCurrentView,
    selectProject,
    openAddProjectModal,
    selectPeriodFilter,
    selectTruckFilter,
    filterByTruckAndNavigate,
    openAddTruckModal,
    openAddEntryModal,
    openEditModal,
    confirmDelete,
    openSettingsModal,
    openChangePasswordModal,
    showToast,
    closeSidebar
  };
})();
