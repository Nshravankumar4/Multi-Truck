/**
 * Transport Brokerage Ledger Pvt Ltd
 * API & Cloud Synchronization Module (api.js)
 *
 * Dedicated Production Google Spreadsheet:
 * https://docs.google.com/spreadsheets/d/1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4/edit?usp=sharing
 *
 * Web App Endpoint:
 * https://script.google.com/macros/s/AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ/exec
 */

const ApiModule = (() => {
  const CONFIG = {
    SPREADSHEET_ID: "1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4",
    GAS_URL: "https://script.google.com/macros/s/AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ/exec",
    DEPLOYMENT_ID: "AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ",
    SYNC_INTERVAL_MS: 300000,
    REQUEST_TIMEOUT_MS: 20000
  };

  const syncChannel = ('BroadcastChannel' in window)
    ? new BroadcastChannel('sr_transport_sync_channel')
    : null;

  function initCrossTabSync(onRemoteUpdate) {
    if (!syncChannel) return;
    syncChannel.onmessage = (event) => {
      const msg = event.data;
      if (msg && msg.type === 'DATA_UPDATED') {
        DataModule.loadStateFromStorage();
        if (typeof onRemoteUpdate === 'function') {
          onRemoteUpdate(msg);
        }
      }
    };
  }

  function broadcastLocalChange(source) {
    if (!syncChannel) return;
    syncChannel.postMessage({
      type: 'DATA_UPDATED',
      source: source || 'local_mutation',
      timestamp: new Date().toISOString()
    });
  }

  function updateStatusBadge(status, label) {
    const dot = document.getElementById('cloudStatusDot') || document.getElementById('cloud-dot');
    const text = document.getElementById('cloudStatusText') || document.getElementById('cloud-status');
    if (dot) {
      dot.className = 'status-dot ' + status;
    }
    if (text) {
      text.textContent = label;
    }
  }

  async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  // Bidirectional Cloud Sync Reconciliation (Test 12)
  async function syncLedgerData(customStore) {
    updateStatusBadge('syncing', 'Syncing...');
    const storeData = customStore || DataModule.getStore();
    const activeProject = DataModule.getActiveProject();
    const targetSpreadsheetId = (activeProject && activeProject.spreadsheetId)
      ? activeProject.spreadsheetId
      : CONFIG.SPREADSHEET_ID;

    const payload = {
      action: 'saveData',
      projectId: activeProject ? activeProject.id : 'PRJ-001',
      spreadsheetId: targetSpreadsheetId,
      user: (typeof AuthModule !== 'undefined' && AuthModule.getCurrentUser())
        ? AuthModule.getCurrentUser().username
        : 'Operator',
      data: storeData
    };

    try {
      const resp = await fetchWithTimeout(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
      const resJson = await resp.json();
      const result = resJson;

      if (result.success) {
        // If server sent back updated store, save it to DataModule
        if (result.store) {
          DataModule.saveStore(result.store);
        }
        updateStatusBadge('online', 'Synced');
        broadcastLocalChange('cloud_sync');
        return { success: true, timestamp: resJson.serverTimestamp || new Date().toISOString() };
      } else {
        updateStatusBadge('offline', 'Sync Error');
        return { success: false, error: resJson.error || 'Server error' };
      }
    } catch (err) {
      updateStatusBadge('offline', 'Offline');
      return { success: false, error: err.message, offlineFallback: true };
    }
  }

  async function syncWithServer(storeData, options = {}) {
    return syncLedgerData(storeData);
  }

  async function pullFromServer() {
    updateStatusBadge('syncing', 'Fetching...');
    const activeProject = DataModule.getActiveProject();
    const targetSpreadsheetId = (activeProject && activeProject.spreadsheetId)
      ? activeProject.spreadsheetId
      : CONFIG.SPREADSHEET_ID;

    const url = `${CONFIG.GAS_URL}?action=getData&projectId=${encodeURIComponent(activeProject ? activeProject.id : 'PRJ-001')}&spreadsheetId=${encodeURIComponent(targetSpreadsheetId)}`;

    try {
      const resp = await fetchWithTimeout(url, { method: 'GET' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const resJson = await resp.json();

      if (resJson.success && resJson.data) {
        DataModule.mergeRemoteState(resJson.data);
        updateStatusBadge('online', 'Synced');
        broadcastLocalChange('cloud_pull');
        return { success: true, data: resJson.data };
      }
      updateStatusBadge('offline', 'Pull Error');
      return { success: false, error: resJson.error || 'Invalid server payload' };
    } catch (err) {
      updateStatusBadge('offline', 'Offline');
      return { success: false, error: err.message };
    }
  }

  async function deleteRecordOnServer(recordType, recordId) {
    if (typeof AuthModule !== 'undefined' && !AuthModule.isAdmin()) {
      return { success: false, error: "Access Denied: Operators cannot delete records." };
    }

    const currentUser = (typeof AuthModule !== 'undefined') ? AuthModule.getCurrentUser() : null;
    const sessionToken = (typeof AuthModule !== 'undefined') ? AuthModule.getSessionToken() : '';

    const payload = {
      action: 'deleteRecord',
      recordType: recordType,
      recordId: recordId,
      user: currentUser ? currentUser.username : 'admin',
      token: sessionToken,
      spreadsheetId: CONFIG.SPREADSHEET_ID
    };

    try {
      const resp = await fetchWithTimeout(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return await resp.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function getSpreadsheetUrl() {
    if (typeof AuthModule !== 'undefined' && !AuthModule.isAdmin()) {
      throw new Error("Access Denied: Only Administrator (Admin) can access the raw Google Spreadsheet.");
    }
    const activeProject = DataModule.getActiveProject();
    const sheetId = (activeProject && activeProject.spreadsheetId)
      ? activeProject.spreadsheetId
      : CONFIG.SPREADSHEET_ID;
    return `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`;
  }

  function openGoogleSheet() {
    try {
      const url = getSpreadsheetUrl();
      window.open(url, '_blank');
    } catch (err) {
      alert(err.message);
    }
  }

  function getConfig() {
    if (typeof AuthModule !== 'undefined' && !AuthModule.isAdmin()) {
      return {
        GAS_URL: CONFIG.GAS_URL,
        DEPLOYMENT_ID: CONFIG.DEPLOYMENT_ID,
        SYNC_INTERVAL_MS: CONFIG.SYNC_INTERVAL_MS
      };
    }
    return { ...CONFIG };
  }

  function updateGasUrl(newUrl) {
    if (typeof AuthModule !== 'undefined' && !AuthModule.isAdmin()) {
      alert("Access Denied: Only Administrator can update API endpoints.");
      return false;
    }
    if (newUrl && newUrl.startsWith("https://script.google.com/")) {
      CONFIG.GAS_URL = newUrl.trim();
      localStorage.setItem('sr_transport_gas_url', CONFIG.GAS_URL);
      return true;
    }
    return false;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  return {
    initCrossTabSync,
    broadcastLocalChange,
    updateStatusBadge,
    syncLedgerData,
    syncWithServer,
    pullFromServer,
    deleteRecordOnServer,
    getSpreadsheetUrl,
    openGoogleSheet,
    getConfig,
    updateGasUrl,
    escapeHtml
  };
})();
