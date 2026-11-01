/**
 * Transport Brokerage Ledger Pvt Ltd
 * Multi-Project Cloud API, Verification & Realtime Synchronization (P2)
 */

const ApiModule = (function () {
  'use strict';

  const CONFIG = {
    SPREADSHEET_ID: '1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4',
    GAS_URL: 'https://script.google.com/macros/s/AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ/exec',
    DEPLOYMENT_ID: 'AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ',
    SCRIPT_PROJECT_URL: 'https://script.google.com/u/0/home/projects/1l4GkXJ-eiX-SzyeGlfBMWc-H32sE2ubeNnq_LDEDXqMtYhU6b4Zls8bL/edit'
  };

  const GAS_URL_KEY = 'FLEET_LEDGER_P2_GAS_ENDPOINT';
  const DATA_VERSION_KEY = 'FLEET_LEDGER_P2_DATA_VERSION';
  const DEFAULT_SPREADSHEET_ID = CONFIG.SPREADSHEET_ID;
  const DEFAULT_GAS_URL = CONFIG.GAS_URL;
  const SCRIPT_PROJECT_URL = CONFIG.SCRIPT_PROJECT_URL;

  let currentSyncStatus = 'ONLINE_READY'; // 'SYNCING', 'SYNCED', 'OFFLINE', 'FAILED', 'CONFLICT'
  let syncTimer = null;
  let isSyncing = false;

  // Real-time Cross-Tab Synchronization via BroadcastChannel
  const syncChannel = (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined')
    ? new BroadcastChannel('sr_transport_sync_channel_v2')
    : null;

  if (syncChannel) {
    syncChannel.onmessage = function (event) {
      if (event && event.data) {
        console.log('[SyncChannel] Cross-tab event received:', event.data);
        if (typeof AppModule !== 'undefined' && typeof AppModule.renderCurrentView === 'function') {
          AppModule.renderCurrentView();
        }
      }
    };
  }

  function getEndpoint() {
    const stored = localStorage.getItem(GAS_URL_KEY);
    if (stored && stored.includes('AKfycbxhwvJi8UDsJd2yFo9oprDAQGS8M9L6UfcM5M9Tmn98UPZFP8ijYdS9ZIYAl4hiyKbopA')) {
      localStorage.setItem(GAS_URL_KEY, DEFAULT_GAS_URL);
      return DEFAULT_GAS_URL;
    }
    return stored || DEFAULT_GAS_URL;
  }

  function setEndpoint(url) {
    if (url) {
      localStorage.setItem(GAS_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(GAS_URL_KEY);
    }
  }

  function getDataVersion() {
    return parseInt(localStorage.getItem(DATA_VERSION_KEY) || '1', 10);
  }

  function incrementDataVersion() {
    const nextVer = getDataVersion() + 1;
    localStorage.setItem(DATA_VERSION_KEY, String(nextVer));
    return nextVer;
  }

  function broadcastLocalChange(data) {
    const newVersion = incrementDataVersion();
    if (syncChannel) {
      try {
        syncChannel.postMessage({
          type: 'LOCAL_MUTATION',
          version: newVersion,
          timestamp: Date.now()
        });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  function getProjectSpreadsheetId() {
    const prj = DataModule.getCurrentProject();
    return (prj && prj.spreadsheetId && prj.spreadsheetId.trim() !== '') ? prj.spreadsheetId.trim() : DEFAULT_SPREADSHEET_ID;
  }

  function setProjectSpreadsheetId(id) {
    const prj = DataModule.getCurrentProject();
    if (prj) {
      DataModule.updateProject(prj.id, { spreadsheetId: (id || '').trim() });
    }
  }

  function getConfig() {
    return Object.assign({}, CONFIG);
  }

  function getSpreadsheetUrl() {
    const sheetId = getProjectSpreadsheetId();
    return 'https://docs.google.com/spreadsheets/d/' + sheetId + '/edit?usp=sharing';
  }

  function openGoogleSheet() {
    if (typeof AuthModule !== 'undefined' && typeof AuthModule.isAdmin === 'function' && !AuthModule.isAdmin()) {
      alert("Access Denied: Only Administrator (Admin) can access the raw Google Spreadsheet.");
      return;
    }
    window.open(getSpreadsheetUrl(), '_blank');
  }

  function openScriptProject() {
    if (typeof AuthModule !== 'undefined' && typeof AuthModule.isAdmin === 'function' && !AuthModule.isAdmin()) {
      alert("Access Denied: Only Administrator (Admin) can access the Google Apps Script project.");
      return;
    }
    window.open(SCRIPT_PROJECT_URL, '_blank');
  }

  function updateStatusBadge(status, text) {
    currentSyncStatus = status;
    const badge = document.getElementById('headerCloudSyncBadge');
    if (!badge) return;

    badge.className = 'header-sync-pill';
    if (status === 'SYNCING') {
      badge.classList.add('syncing');
      badge.innerHTML = '🔄 Syncing...';
      badge.title = 'Synchronizing with cloud spreadsheet...';
    } else if (status === 'SYNCED') {
      badge.classList.add('synced');
      badge.innerHTML = '🟢 Synced (v' + getDataVersion() + ')';
      badge.title = 'All records successfully persisted and verified in cloud.';
    } else if (status === 'OFFLINE') {
      badge.classList.add('offline');
      badge.innerHTML = '⚪ Offline Mode';
      badge.title = 'Running locally in browser LocalStorage.';
    } else if (status === 'FAILED') {
      badge.classList.add('error');
      badge.innerHTML = '🔴 Sync Error';
      badge.title = text || 'Cloud synchronization failed. Check Apps Script endpoint.';
    } else {
      badge.innerHTML = '🟢 Cloud Ready';
    }
  }

  /**
   * Real Bidirectional Sync:
   * Pushes full project store, receives server reconciliation, merges and updates local store
   */
  async function syncNow() {
    if (isSyncing) return;
    isSyncing = true;
    updateStatusBadge('SYNCING');

    const url = getEndpoint();
    const curUser = AuthModule.getCurrentUser();
    const activeProject = DataModule.getCurrentProject();

    if (!url || url.trim() === '') {
      updateStatusBadge('OFFLINE', 'No Apps Script Web App URL configured.');
      isSyncing = false;
      return { success: false, offline: true, message: 'Running in offline mode (no endpoint configured).' };
    }

    try {
      const payload = {
        action: 'syncLedgerData',
        projectId: activeProject.id,
        spreadsheetId: activeProject.spreadsheetId || '',
        version: getDataVersion(),
        user: curUser ? curUser.username : 'Anonymous',
        role: curUser ? curUser.role : 'USER',
        sessionToken: curUser ? curUser.token : '',
        timestamp: new Date().toISOString(),
        store: DataModule.getStore()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' ' + response.statusText);
      }

      const result = await response.json();

      if (result.success) {
        // Apply reconciled data from server if provided
        if (result.store && result.store.projects) {
          DataModule.saveStore(result.store);
        }
        if (result.version) {
          localStorage.setItem(DATA_VERSION_KEY, String(result.version));
        }
        updateStatusBadge('SYNCED');
        if (typeof AppModule !== 'undefined' && typeof AppModule.showToast === 'function') {
          AppModule.showToast('🟢 Cloud ledger successfully synchronized and verified!', 'success');
        }
        isSyncing = false;
        return { success: true, version: result.version };
      } else {
        updateStatusBadge('FAILED', result.message || result.error);
        if (typeof AppModule !== 'undefined' && typeof AppModule.showToast === 'function') {
          AppModule.showToast('⚠️ Cloud Sync: ' + (result.message || result.error), 'error');
        }
        isSyncing = false;
        return { success: false, error: result.error, message: result.message };
      }

    } catch (err) {
      console.warn('Sync error:', err);
      updateStatusBadge('FAILED', err.message);
      if (typeof AppModule !== 'undefined' && typeof AppModule.showToast === 'function') {
        AppModule.showToast('🔴 Network error during cloud sync: ' + err.message, 'error');
      }
      isSyncing = false;
      return { success: false, error: err.message };
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function parseAmount(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  return {
    getEndpoint,
    setEndpoint,
    getProjectSpreadsheetId,
    setProjectSpreadsheetId,
    openGoogleSheet,
    openScriptProject,
    getConfig,
    getSpreadsheetUrl,
    getScriptProjectUrl: function () { return SCRIPT_PROJECT_URL; },
    getDataVersion,
    incrementDataVersion,
    broadcastLocalChange,
    syncNow,
    updateStatusBadge,
    escapeHtml,
    escapeAttr,
    parseAmount
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiModule;
}
