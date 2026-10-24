/**
 * Fleet Logistics & Financial Accounts Management - App Controller
 * Orchestrates views, sidebar drawer, truck filters, modals, and toasts
 * Developed by Shravan Kumar • 2026
 */

const AppModule = (function () {
  'use strict';

  let currentView = 'dashboard';
  let currentTruckFilter = 'ALL';
  let currentMonthFilter = '2026-10';

  function init() {
    DataModule.init();
    AuthModule.init();
    ApiModule.init();

    setupGlobalEventListeners();
    renderCurrentView();
  }

  function setupGlobalEventListeners() {
    // Keyboard Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSidebar();
        closeModal();
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
    const backdrop = document.getElementById('drawerBackdrop');
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

  // Modal Dialogs
  function openAddModal(type, targetTruck) {
    const modal = document.getElementById('addEntryModal');
    const title = document.getElementById('addModalTitle');
    const truckSelect = document.getElementById('modalTruckSelect');
    const typeSelect = document.getElementById('modalEntryType');

    if (truckSelect && targetTruck) {
      truckSelect.value = targetTruck;
    }
    if (typeSelect && type) {
      typeSelect.value = type;
      toggleModalFields(type);
    }

    if (title) {
      if (type === 'trip') title.textContent = '➕ Add New Freight Shipment Trip';
      else if (type === 'diesel') title.textContent = '⛽ Record Diesel Fuel Slip';
      else if (type === 'advance') title.textContent = '💵 Record Driver Advance Payment';
      else if (type === 'expense') title.textContent = '🚨 Record En-Route Road Expense';
      else title.textContent = '➕ Add Financial Entry';
    }

    if (modal) modal.style.display = 'flex';
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
  }

  function saveModalEntry(e) {
    if (e && e.preventDefault) e.preventDefault();

    const type = document.getElementById('modalEntryType').value;
    const truckId = document.getElementById('modalTruckSelect').value;

    if (!AuthModule.isAdmin()) {
      alert('Only Administrator account has permission to add or modify ledger entries.');
      return;
    }

    if (type === 'trip') {
      const dates = document.getElementById('tripDates').value.trim();
      const from = document.getElementById('tripFrom').value.trim();
      const to = document.getElementById('tripTo').value.trim();
      const pnlFreight = Number(document.getElementById('tripPnlFreight').value) || 0;
      const baseFreight = Number(document.getElementById('tripBaseFreight').value) || pnlFreight;
      const transporter = document.getElementById('tripTransporter').value.trim() || 'Direct';
      const adv = Number(document.getElementById('tripAdvance').value) || 0;

      if (!dates || !from || !to || !pnlFreight) {
        alert('Please fill in all mandatory trip details.');
        return;
      }

      DataModule.addTrip(truckId, {
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
        remarks: 'Added via web portal'
      });
      showToast('✅ Trip added successfully to ledger!', 'success');

    } else if (type === 'diesel') {
      const date = document.getElementById('dieselDate').value.trim();
      const pump = document.getElementById('dieselPump').value.trim();
      const amount = Number(document.getElementById('dieselAmount').value) || 0;

      if (!amount) {
        alert('Please specify the fuel amount.');
        return;
      }

      DataModule.addDiesel(truckId, {
        date: date || 'Oct 2026',
        pump: pump || 'Highway Pump',
        amount
      });
      showToast('⛽ Diesel fuel slip recorded!', 'success');

    } else if (type === 'advance') {
      const date = document.getElementById('advDate').value.trim();
      const location = document.getElementById('advLocation').value.trim();
      const amount = Number(document.getElementById('advAmount').value) || 0;
      const mode = document.getElementById('advMode').value;

      if (!amount || !location) {
        alert('Please provide narration and amount.');
        return;
      }

      DataModule.addAdvance(truckId, {
        date: date || 'Oct 2026',
        location,
        amount,
        mode
      });
      showToast('💵 Driver advance payment recorded!', 'success');

    } else if (type === 'expense') {
      const desc = document.getElementById('expDesc').value.trim();
      const cat = document.getElementById('expCategory').value;
      const amount = Number(document.getElementById('expAmount').value) || 0;

      if (!amount || !desc) {
        alert('Please provide description and amount.');
        return;
      }

      DataModule.addExpense(truckId, {
        description: desc,
        category: cat,
        amount
      });
      showToast('🚨 Road expense recorded!', 'success');
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
    toggleModalFields,
    closeModal,
    saveModalEntry,
    openSettingsModal,
    saveSettings,
    restoreOriginalData,
    syncNow,
    showToast,
    onUserAuthenticated
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  AppModule.init();
});

if (typeof window !== 'undefined') {
  window.AppModule = AppModule;
}
