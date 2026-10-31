/**
 * Transport Brokerage Ledger Pvt Ltd
 * Security, Authentication & Role-Based Access Control (RBAC) (P2)
 */

const AuthModule = (function () {
  'use strict';

  const AUTH_STORAGE_KEY = 'SR_TRANSPORT_AUTH_SESSION_V2';
  const CREDENTIALS_STORAGE_KEY = 'SR_TRANSPORT_USER_CREDENTIALS_V1';
  const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  const DEFAULT_USERS = {
    'Admin': {
      name: 'Shravan Kumar',
      role: 'ADMIN',
      passHash: 'c7c8fc3d085957d6050a4ec970c672b1574895fa7b045e7f1e56b4f74d0e8081', // SHA-256 for Shravan@2505
      permissions: ['read', 'write', 'edit', 'delete', 'export', 'backup', 'restore', 'settings', 'projects']
    },
    'Rudra': {
      name: 'Rudra (Operator)',
      role: 'USER',
      passHash: '52bf4225d3df6cbcf896be4fbaf2c27056c0733bb58c54117b355418bb6b9075', // SHA-256 for RudraSarika@2505
      permissions: ['read', 'write', 'edit', 'export'] // Delete, project management & Settings blocked
    }
  };

  let inactivityTimer = null;

  async function sha256(plainText) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback simple hash if subtle crypto not available (for tests)
    let hash = 0;
    for (let i = 0; i < plainText.length; i++) {
      hash = ((hash << 5) - hash) + plainText.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  function getUsers() {
    try {
      const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Credentials read error, fallback to default', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_USERS));
  }

  function saveUsers(users) {
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(users));
  }

  async function login(username, password) {
    const users = getUsers();
    const user = users[username];
    if (!user) return { success: false, message: 'Account not found. Please select Admin or Rudra.' };

    const inputHash = await sha256(password);
    if (inputHash !== user.passHash) {
      return { success: false, message: 'Invalid password. Please enter the correct password.' };
    }

    // Generate secure session token
    const token = 'TOK_' + username + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    const session = {
      username: username,
      displayName: user.name,
      role: user.role,
      permissions: user.permissions,
      token: token,
      loginTime: Date.now(),
      lastActive: Date.now()
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    resetInactivityWatchdog();
    return { success: true, session: session };
  }

  function getCurrentUser() {
    try {
      const sessionStr = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!sessionStr) return null;
      const session = JSON.parse(sessionStr);
      if (Date.now() - session.lastActive > INACTIVITY_TIMEOUT_MS) {
        logout();
        return null;
      }
      session.lastActive = Date.now();
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return session;
    } catch (e) {
      return null;
    }
  }

  function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'ADMIN';
  }

  function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    return user.permissions && user.permissions.includes(permission);
  }

  function logout() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.reload();
  }

  async function updatePassword(username, newPlainPassword) {
    const users = getUsers();
    if (!users[username]) return { success: false, message: 'User does not exist.' };
    if (!newPlainPassword || newPlainPassword.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }
    users[username].passHash = await sha256(newPlainPassword);
    saveUsers(users);
    return { success: true, message: 'Password updated successfully!' };
  }

  function resetInactivityWatchdog() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      alert('Your session has timed out after 10 minutes of inactivity to protect financial records.');
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }

  function initActivityListeners() {
    if (typeof window !== 'undefined') {
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, () => {
          const user = getCurrentUser();
          if (user) resetInactivityWatchdog();
        }, { passive: true });
      });
    }
  }

  initActivityListeners();

  function selectLoginUser(username) {
    const adminBtn = document.getElementById('userBtnAdmin');
    const rudraBtn = document.getElementById('userBtnRudra');
    const hiddenInput = document.getElementById('loginSelectedUser');
    const pwdInput = document.getElementById('loginPassword');

    if (hiddenInput) hiddenInput.value = username;

    if (username === 'Admin') {
      if (adminBtn) adminBtn.classList.add('active');
      if (rudraBtn) rudraBtn.classList.remove('active');
      if (pwdInput) pwdInput.placeholder = 'Enter password for Admin';
    } else {
      if (adminBtn) adminBtn.classList.remove('active');
      if (rudraBtn) rudraBtn.classList.add('active');
      if (pwdInput) pwdInput.placeholder = 'Enter password for Rudra';
    }
    if (pwdInput) pwdInput.focus();
  }

  function togglePasswordVisibility() {
    const pwdInput = document.getElementById('loginPassword');
    const btn = document.getElementById('togglePasswordBtn');
    if (!pwdInput) return;
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      if (btn) btn.textContent = '🔒';
    } else {
      pwdInput.type = 'password';
      if (btn) btn.textContent = '👁️';
    }
  }

  async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const hiddenInput = document.getElementById('loginSelectedUser');
    const pwdInput = document.getElementById('loginPassword');
    const errBox = document.getElementById('loginErrorMsg');

    const username = (hiddenInput && hiddenInput.value) ? hiddenInput.value.trim() : 'Admin';
    const password = (pwdInput && pwdInput.value) ? pwdInput.value : '';

    if (errBox) {
      errBox.style.display = 'none';
      errBox.textContent = '';
    }

    const res = await login(username, password);
    if (!res.success) {
      if (errBox) {
        errBox.textContent = res.message || 'Authentication failed.';
        errBox.style.display = 'block';
      } else {
        alert(res.message || 'Authentication failed.');
      }
      return;
    }

    const loginModal = document.getElementById('loginModal');
    const appShell = document.getElementById('appShell');
    if (loginModal) loginModal.style.display = 'none';
    if (appShell) appShell.style.display = 'block';

    if (typeof AppModule !== 'undefined' && typeof AppModule.init === 'function') {
      AppModule.init();
    }
  }

  return {
    login,
    logout,
    getCurrentUser,
    isAdmin,
    hasPermission,
    updatePassword,
    resetInactivityWatchdog,
    sha256,
    selectLoginUser,
    togglePasswordVisibility,
    handleLogin
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthModule;
}
