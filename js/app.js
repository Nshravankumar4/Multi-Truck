/**
 * Fleet Logistics & Financial Accounts Management - App Controller
 * Orchestrates views, sidebar drawer, truck filters, modals, full CRUD, and toasts
 * Developed by Shravan Kumar • 2026
 */

const AppModule = (function () {
  'use strict';

  let currentView = 'dashboard';
  let currentTruckFilter = 'ALL';
  let currentMonthFilter = '2026-10';

  // Edit State Tracking
  let isEditing = false;
  let editingRecordType = null;
  let editingTruckId = null;
  let editingRecordId = null;

  function init() {
    DataModule.init();
    AuthModule.init();
    ApiModule.init();

    setupGlobalEventListeners();
    renderCurrentView();
  }

  function setupGlobalEventListeners() {
    // Keyboard Escape key handling
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSidebar();
        closeModal();
        const viewExcel = document.getElementById('view-excel');
        if (viewExcel && viewExcel.classList.contains('sheet-fullscreen-mode')) {
          TableModule.toggleFullscreen();
        }
      }
    });
  }

  function onUserAuthenticated(user, isFresh) {
    renderCurrentView();
    if (isFresh) {
      showToast(`Welcome back, ${user.displayName}! Fleet accounts loaded.`, 'success');
    }
  }

  function switchView(viewName) {
    currentView = viewName;

    // Toggle View Sections
    const views = ['dashboard', 'pnl', 'driver', 'excel'];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) {
        el.style.display = (v === viewName) ? 'block' : 'none';
      }
    });

    // Update Top Navbar Buttons
    const navButtons = {
      dashboard: 'btnNavDashboard',
      pnl: 'btnNavPnl',
      driver: 'btnNavDriver',
      excel: 'btnNavExcel'
    };
    Object.keys(navButtons).forEach(k => {
      const btn = document.getElementById(navButtons[k]);
      if (btn) {
        if (k === viewName) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    // Update Drawer Menu Items
    const drawerNavs = {
      dashboard: 'drawerNavDashboard',
      pnl: 'drawerNavPnl',
      driver: 'drawerNavDriver',
      excel: 'drawerNavExcel'
    };
    Object.keys(drawerNavs).forEach(k => {
      const dBtn = document.getElementById(drawerNavs[k]);
      if (dBtn) {
        if (k === viewName) dBtn.classList.add('active');
        else dBtn.classList.remove('active');
      }
    });

    renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderCurrentView() {
    if (currentView === 'dashboard') {
      DashboardModule.render();
    } else if (currentView === 'pnl') {
      TableModule.renderPnlView(currentTruckFilter);
    } else if (currentView === 'driver') {
      TableModule.renderDriverView(currentTruckFilter === 'ALL' ? 'TG15T6666' : currentTruckFilter);
    } else if (currentView === 'excel') {
      TableModule.renderExcelReplica();
    }
  }

  function selectTruckFilter(truckId) {
    currentTruckFilter = truckId;

    // Update Pill Buttons
    const pills = {
      ALL: 'pillFilterAll',
      TG15T6666: 'pillFilter6666',
      TS15UE1122: 'pillFilter1122'
    };
    Object.keys(pills).forEach(k => {
      const btn = document.getElementById(pills[k]);
      if (btn) {
        if (k === truckId) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    renderCurrentView();
  }

  function selectMonthFilter(monthId) {
    currentMonthFilter = monthId;
    renderCurrentView();
  }

  function getCurrentTruckFilter() {
    return currentTruckFilter;
  }

  // Sidebar Drawer Controls
  function toggleSidebar(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const drawer = document.getElementById('appDrawer');
    if (!drawer) return;

    if (drawer.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function openSidebar() {
    const drawer = document.getElementById('appDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    const drawer = document.getElementById('appDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Modal Dialogs & CRUD Operations
  function openAddModal(type = 'trip', targetTruck = null) {
    isEditing = false;
    editingRecordType = null;
    editingTruckId = null;
    editingRecordId = null;

    const modal = document.getElementById('addEntryModal');
    const title = document.getElementById('addModalTitle');
    const truckSelect = document.getElementById('modalTruckSelect');
    const typeSelect = document.getElementById('modalEntryType');
    const submitBtn = document.getElementById('modalSubmitBtn');

    if (truckSelect) {
      truckSelect.value = targetTruck || (currentTruckFilter === 'ALL' ? 'TG15T6666' : currentTruckFilter);
      truckSelect.disabled = false;
    }
    if (typeSelect) {
      typeSelect.value = type;
      typeSelect.disabled = false;
      toggleModalFields(type);
    }

    if (title) {
      if (type === 'trip') title.textContent = '➕ Add New Freight Shipment Trip';
      else if (type === 'diesel') title.textContent = '⛽ Record Diesel Fuel Slip';
      else if (type === 'advance') title.textContent = '💵 Record Driver Advance Payment';
      else if (type === 'expense') title.textContent = '🚨 Record En-Route Road Expense';
      else title.textContent = '➕ Add Financial Entry';
    }

    if (submitBtn) submitBtn.textContent = 'Save Entry';

    // Reset Inputs
    clearModalInputs();

    if (modal) modal.style.display = 'flex';
  }

  function openEditModal(type, truckId, recordId) {
    const record = DataModule.findRecord(type, truckId, recordId);
    if (!record) {
      showToast('Record not found.', 'danger');
      return;
    }

    isEditing = true;
    editingRecordType = type;
    editingTruckId = truckId;
    editingRecordId = recordId;

    const modal = document.getElementById('addEntryModal');
    const title = document.getElementById('addModalTitle');
    const truckSelect = document.getElementById('modalTruckSelect');
    const typeSelect = document.getElementById('modalEntryType');
    const submitBtn = document.getElementById('modalSubmitBtn');

    if (truckSelect) {
      truckSelect.value = truckId;
      truckSelect.disabled = true; // Lock truck during edit
    }
    if (typeSelect) {
      typeSelect.value = type;
      typeSelect.disabled = true; // Lock type during edit
      toggleModalFields(type);
    }

    if (title) {
      if (type === 'trip') title.textContent = '✏️ Edit Freight Shipment Trip';
      else if (type === 'diesel') title.textContent = '✏️ Edit Diesel Fuel Slip';
      else if (type === 'advance') title.textContent = '✏️ Edit Driver Advance Payment';
      else if (type === 'expense') title.textContent = '✏️ Edit En-Route Road Expense';
      else title.textContent = '✏️ Edit Entry';
    }

    if (submitBtn) submitBtn.textContent = 'Save Changes';

    // Populate Fields
    if (type === 'trip') {
      const datesInput = document.getElementById('tripDates');
      const fromInput = document.getElementById('tripFrom');
      const toInput = document.getElementById('tripTo');
      const pnlInput = document.getElementById('tripPnlFreight');
      const baseInput = document.getElementById('tripBaseFreight');
      const transInput = document.getElementById('tripTransporter');
      const advInput = document.getElementById('tripAdvance');

      if (datesInput) datesInput.value = record.dateRange || '';
      if (fromInput) fromInput.value = record.from || '';
      if (toInput) toInput.value = record.to || '';
      if (pnlInput) pnlInput.value = record.pnlFreight || '';
      if (baseInput) baseInput.value = record.baseFreight || '';
      if (transInput) transInput.value = record.transporter || '';
      if (advInput) advInput.value = record.advanceReceived || '';
    } else if (type === 'diesel') {
      const dateInput = document.getElementById('dieselDate');
      const pumpInput = document.getElementById('dieselPump');
      const amtInput = document.getElementById('dieselAmount');

      if (dateInput) dateInput.value = record.date || '';
      if (pumpInput) pumpInput.value = record.pump || '';
      if (amtInput) amtInput.value = record.amount || '';
    } else if (type === 'advance') {
      const dateInput = document.getElementById('advDate');
      const locInput = document.getElementById('advLocation');
      const amtInput = document.getElementById('advAmount');
      const modeInput = document.getElementById('advMode');

      if (dateInput) dateInput.value = record.date || '';
      if (locInput) locInput.value = record.location || '';
      if (amtInput) amtInput.value = record.amount || '';
      if (modeInput) modeInput.value = record.mode || 'Cash';
    } else if (type === 'expense') {
      const descInput = document.getElementById('expDesc');
      const catInput = document.getElementById('expCategory');
      const amtInput = document.getElementById('expAmount');

      if (descInput) descInput.value = record.description || '';
      if (catInput) catInput.value = record.category || 'Border / Toll';
      if (amtInput) amtInput.value = record.amount || '';
    }

    if (modal) modal.style.display = 'flex';
  }

  function confirmDelete(type, truckId, recordId) {
    if (!AuthModule.isAdmin()) {
      showToast('⚠️ Rudra can add and edit records but cannot delete them.', 'danger');
      return;
    }

    const typeLabels = {
      trip: 'freight shipment trip',
      diesel: 'diesel fuel entry',
      advance: 'driver advance record',
      expense: 'road expense receipt'
    };
    const label = typeLabels[type] || 'record';

    if (confirm(`Are you sure you want to permanently delete this ${label}?`)) {
      let success = false;
      if (type === 'trip') {
        success = DataModule.deleteTrip(truckId, recordId);
      } else if (type === 'diesel') {
        success = DataModule.deleteDiesel(truckId, recordId);
      } else if (type === 'advance') {
        success = DataModule.deleteAdvance(truckId, recordId);
      } else if (type === 'expense') {
        success = DataModule.deleteExpense(truckId, recordId);
      }

      if (success) {
        showToast('🗑️ Record deleted successfully.', 'success');
        renderCurrentView();
      } else {
        showToast('Failed to delete record.', 'danger');
      }
    }
  }

  function clearModalInputs() {
    ['tripDates', 'tripFrom', 'tripTo', 'tripPnlFreight', 'tripBaseFreight', 'tripTransporter', 'tripAdvance',
     'dieselDate', 'dieselPump', 'dieselAmount',
     'advDate', 'advLocation', 'advAmount',
     'expDesc', 'expAmount'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  function toggleModalFields(type) {
    const tripFields = document.getElementById('modalFieldsTrip');
    const dieselFields = document.getElementById('modalFieldsDiesel');
    const advanceFields = document.getElementById('modalFieldsAdvance');
    const expenseFields = document.getElementById('modalFieldsExpense');

    if (tripFields) tripFields.style.display = (type === 'trip') ? 'block' : 'none';
    if (dieselFields) dieselFields.style.display = (type === 'diesel') ? 'block' : 'none';
    if (advanceFields) advanceFields.style.display = (type === 'advance') ? 'block' : 'none';
    if (expenseFields) expenseFields.style.display = (type === 'expense') ? 'block' : 'none';
  }

  function closeModal() {
    const modals = document.querySelectorAll('.app-modal-overlay');
    modals.forEach(m => (m.style.display = 'none'));
    isEditing = false;
    editingRecordType = null;
    editingTruckId = null;
    editingRecordId = null;
  }

  function saveModalEntry(e) {
    if (e && e.preventDefault) e.preventDefault();

    const type = document.getElementById('modalEntryType').value;
    const truckId = document.getElementById('modalTruckSelect').value;

    if (type === 'trip') {
      const dates = document.getElementById('tripDates').value.trim();
      const from = document.getElementById('tripFrom').value.trim();
      const to = document.getElementById('tripTo').value.trim();
      const pnlFreight = Number(document.getElementById('tripPnlFreight').value) || 0;
      const baseFreight = Number(document.getElementById('tripBaseFreight').value) || pnlFreight;
      const transporter = document.getElementById('tripTransporter').value.trim() || 'Direct';
      const adv = Number(document.getElementById('tripAdvance').value) || 0;

      if (!dates || !from || !to || !pnlFreight) {
        alert('Please fill in all mandatory trip details (Dates, From, To, and Freight Amount).');
        return;
      }

      const tripPayload = {
        dateRange: dates,
        from,
        to,
        route: `${from} TO ${to}`,
        pnlFreight,
        baseFreight,
        transporter,
        advanceReceived: adv,
        balanceFreight: pnlFreight - adv,
        podStatus: 'Delivered',
        remarks: isEditing ? 'Updated via web portal' : 'Added via web portal'
      };

      if (isEditing && editingRecordId) {
        DataModule.updateTrip(truckId, editingRecordId, tripPayload);
        showToast('✅ Trip details updated successfully!', 'success');
      } else {
        DataModule.addTrip(truckId, tripPayload);
        showToast('✅ Trip added successfully to ledger!', 'success');
      }

    } else if (type === 'diesel') {
      const date = document.getElementById('dieselDate').value.trim();
      const pump = document.getElementById('dieselPump').value.trim();
      const amount = Number(document.getElementById('dieselAmount').value) || 0;

      if (!amount) {
        alert('Please specify the fuel amount.');
        return;
      }

      const dieselPayload = {
        date: date || 'Oct 2026',
        pump: pump || 'Highway Pump',
        amount
      };

      if (isEditing && editingRecordId) {
        DataModule.updateDiesel(truckId, editingRecordId, dieselPayload);
        showToast('⛽ Diesel fuel entry updated!', 'success');
      } else {
        DataModule.addDiesel(truckId, dieselPayload);
        showToast('⛽ Diesel fuel slip recorded!', 'success');
      }

    } else if (type === 'advance') {
      const date = document.getElementById('advDate').value.trim();
      const location = document.getElementById('advLocation').value.trim();
      const amount = Number(document.getElementById('advAmount').value) || 0;
      const mode = document.getElementById('advMode').value;

      if (!amount || !location) {
        alert('Please provide narration and amount.');
        return;
      }

      const advancePayload = {
        date: date || 'Oct 2026',
        location,
        amount,
        mode
      };

      if (isEditing && editingRecordId) {
        DataModule.updateAdvance(truckId, editingRecordId, advancePayload);
        showToast('💵 Driver advance updated!', 'success');
      } else {
        DataModule.addAdvance(truckId, advancePayload);
        showToast('💵 Driver advance payment recorded!', 'success');
      }

    } else if (type === 'expense') {
      const desc = document.getElementById('expDesc').value.trim();
      const cat = document.getElementById('expCategory').value;
      const amount = Number(document.getElementById('expAmount').value) || 0;

      if (!amount || !desc) {
        alert('Please provide description and amount.');
        return;
      }

      const expPayload = {
        description: desc,
        category: cat,
        amount
      };

      if (isEditing && editingRecordId) {
        DataModule.updateExpense(truckId, editingRecordId, expPayload);
        showToast('🚨 Road expense updated!', 'success');
      } else {
        DataModule.addExpense(truckId, expPayload);
        showToast('🚨 Road expense recorded!', 'success');
      }
    }

    closeModal();
    renderCurrentView();
  }

  function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const endpointInput = document.getElementById('settingGasEndpoint');
    if (endpointInput) {
      endpointInput.value = ApiModule.getEndpoint();
    }
    if (modal) modal.style.display = 'flex';
  }

  function saveSettings(e) {
    if (e && e.preventDefault) e.preventDefault();
    const endpointInput = document.getElementById('settingGasEndpoint');
    if (endpointInput) {
      ApiModule.setEndpoint(endpointInput.value);
    }
    closeModal();
    showToast('⚙️ System settings updated successfully!', 'success');
  }

  function restoreOriginalData() {
    if (!AuthModule.isAdmin()) {
      alert('Only Administrator has permission to restore original Excel data.');
      return;
    }

    if (confirm('Are you sure you want to restore the verified original Excel dataset? Any newly added entries will be re-seeded.')) {
      DataModule.resetToDefaults();
      renderCurrentView();
      showToast('📋 Original Excel dataset re-seeded successfully!', 'info');
      closeSidebar();
    }
  }

  function syncNow() {
    ApiModule.syncNow();
  }

  // Password Change
  function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const userSpan = document.getElementById('changePwdUserDisplay');
    const curUser = AuthModule.getCurrentUser();
    if (userSpan && curUser) {
      userSpan.textContent = curUser.displayName;
    }
    const newPwd = document.getElementById('newPasswordInput');
    const confirmPwd = document.getElementById('confirmPasswordInput');
    if (newPwd) newPwd.value = '';
    if (confirmPwd) confirmPwd.value = '';
    if (modal) modal.style.display = 'flex';
  }

  async function savePasswordChange(e) {
    if (e && e.preventDefault) e.preventDefault();
    const curUser = AuthModule.getCurrentUser();
    if (!curUser) return;

    const newPwd = (document.getElementById('newPasswordInput') || {}).value;
    const confirmPwd = (document.getElementById('confirmPasswordInput') || {}).value;

    if (!newPwd || newPwd.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }
    if (newPwd !== confirmPwd) {
      alert('Passwords do not match. Please re-enter.');
      return;
    }

    const success = await AuthModule.updatePassword(curUser.username, newPwd);
    if (success) {
      closeModal();
      showToast('🔑 Password changed successfully!', 'success');
    } else {
      alert('Failed to update password.');
    }
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'danger' ? '⚠️' : 'ℹ️'}</span>
      <span class="toast-msg">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('visible');
    }, 50);

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  return {
    init,
    switchView,
    selectTruckFilter,
    selectMonthFilter,
    getCurrentTruckFilter,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    openAddModal,
    openEditModal,
    confirmDelete,
    toggleModalFields,
    closeModal,
    saveModalEntry,
    openSettingsModal,
    saveSettings,
    restoreOriginalData,
    openChangePasswordModal,
    savePasswordChange,
    syncNow,
    showToast,
    onUserAuthenticated,
    renderCurrentView
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  AppModule.init();
});

if (typeof window !== 'undefined') {
  window.AppModule = AppModule;
}
