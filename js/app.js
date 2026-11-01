/**
 * Transport Brokerage Ledger Pvt Ltd
 * Main Application Orchestrator & State Controller (P2)
 *
 * Implements:
 * - Multi-Project Management & Switching
 * - Dynamic Unlimited Truck Filter & Fleet Registry
 * - Comprehensive Date & Accounting Period Filtering
 * - Authoritative View Coordination (Dashboard, P&L, Driver, Live Replica)
 * - Full CRUD Operations with Strict RBAC Delete Guards (Rudra Safeguard)
 * - Real-Time Bidirectional Cloud Synchronization
 */

const AppModule = (function () {
  'use strict';

  // State
  let currentView = 'dashboard';
  let currentTruckFilter = 'ALL';
  let currentPeriodFilter = '2026-10'; // Default active accounting month
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
  }

  function checkAuthSession() {
    const user = AuthModule.getCurrentUser();
    const loginModal = document.getElementById('loginModal');
    const appShell = document.getElementById('appShell');

    if (!user) {
      if (loginModal) loginModal.style.display = 'flex';
      if (appShell) appShell.style.display = 'none';
    } else {
      if (loginModal) loginModal.style.display = 'none';
      if (appShell) appShell.style.display = 'block';
      updateUserBadge(user);
    }
  }

  function updateUserBadge(user) {
    const nameEl = document.getElementById('currentUserDisplay');
    const roleEl = document.getElementById('currentUserRoleBadge');
    if (nameEl) nameEl.textContent = user.displayName || user.name || user.username;
    if (roleEl) {
      roleEl.textContent = user.role;
      roleEl.className = 'user-role-badge ' + (user.role === 'ADMIN' ? 'role-admin' : 'role-user');
    }
    // Update admin-only elements visibility
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
      el.style.display = (user.role === 'ADMIN') ? '' : 'none';
    });
  }

  // --- Dynamic Project & Truck Filters ---
  function renderProjectSelector() {
    const selector = document.getElementById('projectSelectDropdown');
    if (!selector) return;

    const projects = DataModule.getProjects();
    const curId = DataModule.getCurrentProjectId();

    selector.innerHTML = projects.map(p => `
      <option value="${p.id}" ${p.id === curId ? 'selected' : ''}>
        📁 ${ApiModule.escapeHtml(p.name)} (${p.status})
      </option>
    `).join('');
  }

  function renderPeriodSelector() {
    const periodSelect = document.getElementById('filterPeriodSelect');
    if (!periodSelect) return;

    const periods = (typeof DataModule !== 'undefined' && DataModule.getAccountingPeriods)
      ? DataModule.getAccountingPeriods()
      : [
          { id: '2026-10', name: 'October 2026', status: 'Active' },
          { id: '2026-09', name: 'September 2026', status: 'Archived' },
          { id: '2026-11', name: 'November 2026', status: 'Planned' }
        ];

    let html = periods.map(p => `
      <option value="${p.id}" ${p.id === currentPeriodFilter ? 'selected' : ''}>
        ${ApiModule.escapeHtml(p.name)} (${p.status})
      </option>
    `).join('');
    html += `<option value="ALL" ${currentPeriodFilter === 'ALL' ? 'selected' : ''}>All Financial Periods</option>`;
    periodSelect.innerHTML = html;
  }

  function selectProject(projectId) {
    DataModule.setCurrentProjectId(projectId);
    currentTruckFilter = 'ALL';
    const curPrj = DataModule.getCurrentProject();
    currentPeriodFilter = curPrj.activePeriod || '2026-10';
    renderProjectSelector();
    renderPeriodSelector();
    renderTruckFilterPills();
    renderCurrentView();
    showToast(`Switched to project: ${curPrj.name}`, 'info');
  }

  function renderTruckFilterPills() {
    const container = document.getElementById('truckFilterPillsContainer');
    if (!container) return;

    const trucks = DataModule.getTrucks();

    let pillsHtml = `
      <button class="truck-pill-btn ${currentTruckFilter === 'ALL' ? 'active' : ''}" onclick="AppModule.selectTruckFilter('ALL')">
        🚛 All Fleet Combined
      </button>
    `;

    trucks.forEach(t => {
      pillsHtml += `
        <button class="truck-pill-btn ${currentTruckFilter === t.id ? 'active' : ''}" onclick="AppModule.selectTruckFilter('${t.id}')">
          🚛 ${ApiModule.escapeHtml(t.regNumber || t.id)} (${ApiModule.escapeHtml(t.driverName)})
        </button>
      `;
    });

    // Add Truck Shortcut Button
    pillsHtml += `
      <button class="btn btn-sm btn-outline admin-only" onclick="AppModule.openAddTruckModal()" style="margin-left: 0.5rem;" title="Register new truck">
        ＋ New Truck
      </button>
    `;

    container.innerHTML = pillsHtml;

    // Refresh admin visibility
    const user = AuthModule.getCurrentUser();
    if (user && user.role !== 'ADMIN') {
      container.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
  }

  function selectTruckFilter(truckId) {
    currentTruckFilter = truckId;
    renderTruckFilterPills();
    renderCurrentView();
  }

  function selectPeriodFilter(period) {
    currentPeriodFilter = period;
    customStartDate = '';
    customEndDate = '';
    const dateInputStart = document.getElementById('filterStartDate');
    const dateInputEnd = document.getElementById('filterEndDate');
    if (dateInputStart) dateInputStart.value = '';
    if (dateInputEnd) dateInputEnd.value = '';
    renderCurrentView();
  }

  function applyCustomDateFilter() {
    const start = document.getElementById('filterStartDate') ? document.getElementById('filterStartDate').value : '';
    const end = document.getElementById('filterEndDate') ? document.getElementById('filterEndDate').value : '';
    if (!start && !end) {
      alert("Please select at least a Start Date or End Date.");
      return;
    }
    customStartDate = start;
    customEndDate = end;
    currentPeriodFilter = 'CUSTOM';
    renderCurrentView();
    showToast(`Date filter applied: ${start || 'Beginning'} to ${end || 'Present'}`, 'info');
  }

  function resetFilters() {
    const curPrj = DataModule.getCurrentProject();
    currentTruckFilter = 'ALL';
    currentPeriodFilter = curPrj.activePeriod || '2026-10';
    customStartDate = '';
    customEndDate = '';
    currentSearchQuery = '';

    const startInput = document.getElementById('filterStartDate');
    const endInput = document.getElementById('filterEndDate');
    const searchInput = document.getElementById('filterSearchInput');
    const periodSelect = document.getElementById('filterPeriodSelect');

    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    if (searchInput) searchInput.value = '';
    if (periodSelect) periodSelect.value = currentPeriodFilter;

    renderTruckFilterPills();
    renderCurrentView();
    showToast('Filters reset to default.', 'info');
  }

  function applySearch(query) {
    currentSearchQuery = query;
    renderCurrentView();
  }

  const VIEW_MAP = {
    overview: 'dashboard',
    dashboard: 'dashboard',
    fleet: 'fleet',
    trips: 'trips',
    financials: 'pnl',
    pnl: 'pnl',
    expenses: 'expenses',
    settlements: 'driver',
    driver: 'driver',
    reports: 'reports',
    excel: 'excel'
  };

  const VIEW_TITLES = {
    dashboard: 'Overview • Fleet Command Center',
    fleet: 'Fleet • Commercial Vehicle Management',
    trips: 'Trips • Freight Shipments & Routes',
    pnl: 'Financials • Profit & Loss Accounts',
    expenses: 'Expenses • Fuel, Tolls & Road Receipts',
    driver: 'Settlements • Driver Accounts & Liabilities',
    reports: 'Reports • Analytics & Excel Exports',
    excel: 'Spreadsheet • 1:1 Live Excel Replica'
  };

  // --- View Switching ---
  function switchView(viewName) {
    if (viewName === 'settings') {
      openSettingsModal();
      closeSidebar();
      return;
    }

    const targetView = VIEW_MAP[viewName] || 'dashboard';
    currentView = targetView;

    const allViews = ['dashboard', 'fleet', 'trips', 'pnl', 'expenses', 'driver', 'reports', 'excel'];
    allViews.forEach(v => {
      const el = document.getElementById('view-' + v);
      if (el) el.style.display = (v === targetView) ? 'block' : 'none';
    });

    // Update nav links across header and sidebar
    document.querySelectorAll('[data-view-target]').forEach(btn => {
      const target = btn.getAttribute('data-view-target');
      if (target === targetView || VIEW_MAP[target] === targetView) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Legacy nav buttons support for backward compatibility
    ['Dashboard', 'Pnl', 'Driver', 'Excel'].forEach(legacy => {
      const btn = document.getElementById('btnNav' + legacy);
      const drawerBtn = document.getElementById('drawerNav' + legacy);
      const isMatch = (VIEW_MAP[legacy.toLowerCase()] === targetView);
      if (btn) btn.classList.toggle('active', isMatch);
      if (drawerBtn) drawerBtn.classList.toggle('active', isMatch);
    });

    const breadcrumb = document.getElementById('headerBreadcrumbView');
    if (breadcrumb) {
      breadcrumb.textContent = VIEW_TITLES[targetView] || targetView.toUpperCase();
    }

    renderCurrentView();
    closeSidebar();
  }

  function renderCurrentView() {
    const filterOptions = {
      truckId: currentTruckFilter,
      period: currentPeriodFilter,
      startDate: customStartDate,
      endDate: customEndDate,
      searchQuery: currentSearchQuery
    };

    if (currentView === 'dashboard') {
      DashboardModule.render(filterOptions);
    } else if (currentView === 'fleet') {
      TableModule.renderFleetView(filterOptions);
    } else if (currentView === 'trips') {
      TableModule.renderTripsView(currentTruckFilter, filterOptions);
    } else if (currentView === 'pnl') {
      TableModule.renderPnlView(currentTruckFilter, filterOptions);
    } else if (currentView === 'expenses') {
      TableModule.renderExpensesView(currentTruckFilter, filterOptions);
    } else if (currentView === 'driver') {
      TableModule.renderDriverView(currentTruckFilter, filterOptions);
    } else if (currentView === 'reports') {
      TableModule.renderReportsView(filterOptions);
    } else if (currentView === 'excel') {
      TableModule.renderExcelReplica();
    }
  }

  // --- Add / Edit Record Modals ---
  function openAddModal(type, defaultTruckId) {
    activeModalType = type || 'trip';
    editingRecordId = null;
    editingTruckId = defaultTruckId || (currentTruckFilter !== 'ALL' ? currentTruckFilter : 'TG15T6666');

    const modal = document.getElementById('addEntryModal');
    const title = document.getElementById('addModalTitle');
    const typeSelect = document.getElementById('modalEntryType');
    const truckSelect = document.getElementById('modalTruckSelect');
    const submitBtn = document.getElementById('modalSubmitBtn');

    if (title) title.textContent = '➕ Add Financial Record';
    if (submitBtn) submitBtn.textContent = 'Save Record';
    if (typeSelect) {
      typeSelect.value = activeModalType;
      typeSelect.disabled = false;
    }

    populateModalTruckOptions(editingTruckId);
    toggleModalFields(activeModalType);
    clearModalFields();

    if (modal) modal.style.display = 'flex';
  }

  function openEditModal(type, truckId, recordId) {
    const record = DataModule.findRecord(truckId, type, recordId);
    if (!record) {
      alert("Record not found.");
      return;
    }

    activeModalType = type;
    editingTruckId = truckId;
    editingRecordId = recordId;

    const modal = document.getElementById('addEntryModal');
    const title = document.getElementById('addModalTitle');
    const typeSelect = document.getElementById('modalEntryType');
    const submitBtn = document.getElementById('modalSubmitBtn');

    if (title) title.textContent = '✏️ Edit ' + type.toUpperCase() + ' Record';
    if (submitBtn) submitBtn.textContent = 'Update Record';
    if (typeSelect) {
      typeSelect.value = type;
      typeSelect.disabled = true;
    }

    populateModalTruckOptions(truckId);
    toggleModalFields(type);
    prefillModalFields(type, record);

    if (modal) modal.style.display = 'flex';
  }

  function populateModalTruckOptions(selectedId) {
    const truckSelect = document.getElementById('modalTruckSelect');
    if (!truckSelect) return;
    const trucks = DataModule.getTrucks();
    truckSelect.innerHTML = trucks.map(t => `
      <option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>
        ${ApiModule.escapeHtml(t.regNumber || t.id)} (${ApiModule.escapeHtml(t.driverName)})
      </option>
    `).join('');
  }

  function toggleModalFields(type) {
    ['Trip', 'Diesel', 'Advance', 'Expense'].forEach(t => {
      const el = document.getElementById('modalFields' + t);
      if (el) el.style.display = (t.toLowerCase() === type.toLowerCase()) ? 'block' : 'none';
    });
  }

  function clearModalFields() {
    ['tripDates', 'tripFrom', 'tripTo', 'tripPnlFreight', 'tripBaseFreight', 'tripTransporter', 'tripAdvance',
     'dieselDate', 'dieselPump', 'dieselAmount',
     'advDate', 'advLocation', 'advAmount',
     'expDesc', 'expAmount'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const today = new Date().toISOString().slice(0, 10);
    if (document.getElementById('dieselDate')) document.getElementById('dieselDate').value = today;
    if (document.getElementById('advDate')) document.getElementById('advDate').value = today;
  }

  function prefillModalFields(type, r) {
    if (type === 'trip') {
      if (document.getElementById('tripDates')) document.getElementById('tripDates').value = r.dates || r.date || '';
      if (document.getElementById('tripFrom')) document.getElementById('tripFrom').value = r.from || '';
      if (document.getElementById('tripTo')) document.getElementById('tripTo').value = r.to || '';
      if (document.getElementById('tripPnlFreight')) document.getElementById('tripPnlFreight').value = r.pnlFreight || '';
      if (document.getElementById('tripBaseFreight')) document.getElementById('tripBaseFreight').value = r.baseFreight || '';
      if (document.getElementById('tripTransporter')) document.getElementById('tripTransporter').value = r.transporter || 'SR TRSP';
      if (document.getElementById('tripAdvance')) document.getElementById('tripAdvance').value = r.advanceReceived || '';
    } else if (type === 'diesel') {
      if (document.getElementById('dieselDate')) document.getElementById('dieselDate').value = r.date || '';
      if (document.getElementById('dieselPump')) document.getElementById('dieselPump').value = r.pump || '';
      if (document.getElementById('dieselAmount')) document.getElementById('dieselAmount').value = r.amount || '';
    } else if (type === 'advance') {
      if (document.getElementById('advDate')) document.getElementById('advDate').value = r.date || '';
      if (document.getElementById('advLocation')) document.getElementById('advLocation').value = r.location || '';
      if (document.getElementById('advAmount')) document.getElementById('advAmount').value = r.amount || '';
      if (document.getElementById('advMode')) document.getElementById('advMode').value = r.mode || 'Cash';
    } else if (type === 'expense') {
      if (document.getElementById('expDesc')) document.getElementById('expDesc').value = r.desc || '';
      if (document.getElementById('expCategory')) document.getElementById('expCategory').value = r.category || 'General';
      if (document.getElementById('expAmount')) document.getElementById('expAmount').value = r.amount || '';
    }
  }

  function saveModalEntry(e) {
    if (e && e.preventDefault) e.preventDefault();

    const truckSelect = document.getElementById('modalTruckSelect');
    const truckId = truckSelect ? truckSelect.value : editingTruckId;
    const typeSelect = document.getElementById('modalEntryType');
    const type = typeSelect ? typeSelect.value : activeModalType;

    const isEdit = (editingRecordId !== null);

    if (type === 'trip') {
      const pnlFreight = Number(document.getElementById('tripPnlFreight').value) || 0;
      const baseFreight = Number(document.getElementById('tripBaseFreight').value) || pnlFreight;
      const advReceived = Number(document.getElementById('tripAdvance').value) || 0;
      const dates = document.getElementById('tripDates').value;

      const tripData = {
        dates: dates,
        date: new Date().toISOString().slice(0, 10),
        from: document.getElementById('tripFrom').value.trim(),
        to: document.getElementById('tripTo').value.trim(),
        pnlFreight: pnlFreight,
        baseFreight: baseFreight,
        transporter: document.getElementById('tripTransporter').value.trim() || 'SR TRSP',
        advanceReceived: advReceived,
        balanceDue: pnlFreight - advReceived,
        status: 'Delivered'
      };

      if (isEdit) DataModule.updateTrip(truckId, editingRecordId, tripData);
      else DataModule.addTrip(truckId, tripData);

    } else if (type === 'diesel') {
      const dieselData = {
        date: document.getElementById('dieselDate').value,
        pump: document.getElementById('dieselPump').value.trim() || 'Highway Plaza',
        amount: Number(document.getElementById('dieselAmount').value) || 0
      };

      if (isEdit) DataModule.updateDiesel(truckId, editingRecordId, dieselData);
      else DataModule.addDiesel(truckId, dieselData);

    } else if (type === 'advance') {
      const advData = {
        date: document.getElementById('advDate').value,
        location: document.getElementById('advLocation').value.trim() || 'Cash Advance',
        amount: Number(document.getElementById('advAmount').value) || 0,
        mode: document.getElementById('advMode').value
      };

      if (isEdit) DataModule.updateAdvance(truckId, editingRecordId, advData);
      else DataModule.addAdvance(truckId, advData);

    } else if (type === 'expense') {
      const expData = {
        desc: document.getElementById('expDesc').value.trim(),
        category: document.getElementById('expCategory').value,
        amount: Number(document.getElementById('expAmount').value) || 0
      };

      if (isEdit) DataModule.updateExpense(truckId, editingRecordId, expData);
      else DataModule.addExpense(truckId, expData);
    }

    closeModal();
    renderCurrentView();
    showToast(isEdit ? 'Record updated successfully!' : 'New record saved successfully!', 'success');
  }

  // --- Strict RBAC Delete Guard ---
  function confirmDelete(type, truckId, recordId) {
    if (!AuthModule.isAdmin()) {
      alert("Access Denied: Operators (Rudra) cannot delete ledger entries.\nPlease contact Administrator (Shravan Kumar).");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete this ${type.toUpperCase()} record?`)) {
      return;
    }

    let ok = false;
    if (type === 'trip') ok = DataModule.deleteTrip(truckId, recordId);
    else if (type === 'diesel') ok = DataModule.deleteDiesel(truckId, recordId);
    else if (type === 'advance') ok = DataModule.deleteAdvance(truckId, recordId);
    else if (type === 'expense') ok = DataModule.deleteExpense(truckId, recordId);

    if (ok) {
      renderCurrentView();
      showToast(`${type.toUpperCase()} record deleted.`, 'info');
    }
  }

  function closeModal() {
    const modals = document.querySelectorAll('.app-modal-overlay');
    modals.forEach(m => {
      if (m.id !== 'loginModal') m.style.display = 'none';
    });
  }

  // --- Cloud Synchronization & Settings ---
  function syncNow() {
    ApiModule.syncNow();
  }

  function openSettingsModal() {
    if (!AuthModule.isAdmin()) {
      alert("Access Denied: Only Administrator (Admin) can view and configure cloud spreadsheet settings and API links.");
      return;
    }
    const modal = document.getElementById('settingsModal');
    const endpointInput = document.getElementById('settingGasEndpoint');
    const sheetIdInput = document.getElementById('settingSheetUrl');
    const cfg = ApiModule.getConfig ? ApiModule.getConfig() : {};

    if (endpointInput) endpointInput.value = ApiModule.getEndpoint();
    if (sheetIdInput) {
      sheetIdInput.value = (typeof ApiModule.getSpreadsheetUrl === 'function')
        ? ApiModule.getSpreadsheetUrl()
        : ('https://docs.google.com/spreadsheets/d/' + ApiModule.getProjectSpreadsheetId() + '/edit?usp=sharing');
    }

    const quickSheet = document.getElementById('settingQuickSheetLink');
    if (quickSheet && typeof ApiModule.getSpreadsheetUrl === 'function') {
      quickSheet.href = ApiModule.getSpreadsheetUrl();
    }

    const quickProject = document.getElementById('settingQuickProjectLink');
    if (quickProject && cfg.SCRIPT_PROJECT_URL) {
      quickProject.href = cfg.SCRIPT_PROJECT_URL;
    }

    const quickEndpoint = document.getElementById('settingQuickEndpointLink');
    if (quickEndpoint) {
      quickEndpoint.href = ApiModule.getEndpoint();
    }

    const deploymentIdEl = document.getElementById('settingDeploymentIdDisplay');
    if (deploymentIdEl && cfg.DEPLOYMENT_ID) {
      deploymentIdEl.textContent = cfg.DEPLOYMENT_ID;
    }

    const sheetIdEl = document.getElementById('settingSheetIdDisplay');
    if (sheetIdEl) {
      sheetIdEl.textContent = ApiModule.getProjectSpreadsheetId();
    }

    if (modal) modal.style.display = 'flex';
  }

  function saveSettings(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!AuthModule.isAdmin()) {
      alert("Access Denied: Only Administrator (Admin) can modify system and cloud spreadsheet settings.");
      return;
    }
    const endpointInput = document.getElementById('settingGasEndpoint');
    const sheetIdInput = document.getElementById('settingSheetUrl');

    if (endpointInput) ApiModule.setEndpoint(endpointInput.value);
    if (sheetIdInput) {
      let rawVal = sheetIdInput.value.trim();
      // Extract spreadsheet ID if full URL was pasted
      const match = rawVal.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const cleanId = match ? match[1] : rawVal;
      ApiModule.setProjectSpreadsheetId(cleanId);
    }

    closeModal();
    showToast('⚙️ System settings updated.', 'success');
  }

  function restoreOriginalData() {
    if (!AuthModule.isAdmin()) {
      alert("Only Administrator can restore master Excel seed data.");
      return;
    }

    if (confirm("Restore authoritative Excel data? Newly entered records in Project 001 will be reset.")) {
      DataModule.resetToOriginalSeed();
      renderTruckFilterPills();
      renderCurrentView();
      showToast("📋 Master Excel dataset restored successfully!", 'info');
    }
  }

  // --- Dynamic New Truck Modal ---
  function openAddTruckModal() {
    if (!AuthModule.isAdmin()) {
      alert("Only Administrator can register new trucks.");
      return;
    }
    const reg = prompt("Enter new Truck Registration (e.g. TG15T9999):");
    if (!reg || reg.trim() === '') return;
    const driver = prompt("Enter Driver Name for " + reg + ":") || "Assigned Driver";
    const phone = prompt("Enter Driver Phone Number:") || "";
    const fastTag = prompt("Enter Monthly FastTag Allocated Amount (₹):", "30000") || "0";
    const addBlue = prompt("Enter Monthly AddBlue / Misc Allocated (₹):", "15000") || "0";

    const newTruck = DataModule.addTruck({
      regNumber: reg.trim().toUpperCase(),
      driverName: driver.trim(),
      driverPhone: phone.trim(),
      fastTag: Number(fastTag),
      addBlueAndMisc: Number(addBlue)
    });

    if (newTruck) {
      renderTruckFilterPills();
      selectTruckFilter(newTruck.id);
      showToast("🚛 New truck " + newTruck.regNumber + " registered successfully!", 'success');
    }
  }

  // --- Dynamic New Project Modal ---
  function openAddProjectModal() {
    if (!AuthModule.isAdmin()) {
      alert("Only Administrator can create new projects.");
      return;
    }
    const name = prompt("Enter New Project Name (e.g. Project 002 - North Corridor):");
    if (!name || name.trim() === '') return;
    const desc = prompt("Enter Brief Description:") || "Commercial Transport Project";
    const sheetId = prompt("Enter Dedicated Google Spreadsheet ID (or leave blank to configure later):") || "";

    const newPrj = DataModule.addProject({
      name: name.trim(),
      description: desc.trim(),
      spreadsheetId: sheetId.trim()
    });

    if (newPrj) {
      renderProjectSelector();
      selectProject(newPrj.id);
      showToast("📁 Project " + newPrj.name + " created and activated!", 'success');
    }
  }

  // --- Password Management ---
  function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const userSpan = document.getElementById('changePwdUserDisplay');
    const user = AuthModule.getCurrentUser();
    if (userSpan && user) userSpan.textContent = user.displayName || user.username;
    if (modal) modal.style.display = 'flex';
  }

  async function savePasswordChange(e) {
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
      closeModal();
      showToast("🔑 Password updated successfully!", 'success');
    } else {
      alert(res.message);
    }
  }

  // --- Sidebar Toggle ---
  function toggleSidebar(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const drawer = document.getElementById('appDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer) drawer.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('open');
  }

  function closeSidebar() {
    const drawer = document.getElementById('appDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  // --- Toast Notification Utility ---
  function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-pill toast-' + (type || 'info');
    toast.innerHTML = `<span>${ApiModule.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  function setupEventListeners() {
    // Keyboard Escape to close modals
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    // Form Event Listeners (moved from inline handlers)
    const authForm = document.getElementById('authLoginForm');
    if (authForm && typeof AuthModule !== 'undefined' && AuthModule.handleLogin) {
      authForm.addEventListener('submit', AuthModule.handleLogin);
    }

    const addForm = document.getElementById('addEntryForm');
    if (addForm) {
      addForm.addEventListener('submit', saveModalEntry);
    }

    const setForm = document.getElementById('settingsForm');
    if (setForm) {
      setForm.addEventListener('submit', saveSettings);
    }

    const pwdForm = document.getElementById('changePasswordForm');
    if (pwdForm) {
      pwdForm.addEventListener('submit', savePasswordChange);
    }

    const entryTypeSelect = document.getElementById('modalEntryType');
    if (entryTypeSelect) {
      entryTypeSelect.addEventListener('change', function () {
        toggleModalFields(this.value);
      });
    }

    const periodSelect = document.getElementById('filterPeriodSelect');
    if (periodSelect) {
      periodSelect.addEventListener('change', function () {
        selectPeriodFilter(this.value);
      });
    }

    const searchInput = document.getElementById('filterSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        applySearch(this.value);
      });
    }

    const sidebarBtn = document.getElementById('btnOpenSidebar');
    if (sidebarBtn) {
      sidebarBtn.addEventListener('click', toggleSidebar);
    }

    const drawerCloseBtn = document.querySelector('.drawer-close-btn');
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', closeSidebar);
    }

    const drawerBackdrop = document.getElementById('drawerBackdrop');
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', closeSidebar);
    }

    // Refresh Lucide icons if available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      setTimeout(() => lucide.createIcons(), 30);
    }
  }

  return {
    init,
    switchView,
    selectProject,
    selectTruckFilter,
    selectPeriodFilter,
    applyCustomDateFilter,
    resetFilters,
    applySearch,
    openAddModal,
    openEditModal,
    saveModalEntry,
    confirmDelete,
    openAddTruckModal,
    openAddProjectModal,
    openSettingsModal,
    saveSettings,
    restoreOriginalData,
    openChangePasswordModal,
    savePasswordChange,
    syncNow,
    toggleSidebar,
    closeSidebar,
    closeModal,
    showToast,
    toggleModalFields
  };
})();

// Initialize on DOM load
if (typeof window !== 'undefined') {
  window.AppModule = AppModule;
  window.addEventListener('DOMContentLoaded', () => {
    AppModule.init();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppModule;
}
