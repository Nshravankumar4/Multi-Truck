/**
 * Transport Brokerage Ledger Pvt Ltd
 * Security, Authentication & Role-Based Access Control (RBAC) (auth.js)
 */

const AuthModule = (function () {
  'use strict';

  const AUTH_STORAGE_KEY = 'SR_TRANSPORT_AUTH_SESSION_V2';
  const CREDENTIALS_STORAGE_KEY = 'SR_TRANSPORT_USER_CREDENTIALS_V1';
  const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (Test 17)

  const DEFAULT_USERS = {
    'Admin': {
      name: 'Shravan Kumar',
      role: 'ADMIN',
      passHash: 'c7c8fc3d085957d6050a4ec970c672b1574895fa7b045e7f1e56b4f74d0e8081', // Shravan@2505
      permissions: ['read', 'write', 'edit', 'delete', 'export', 'backup', 'restore', 'settings', 'projects']
    },
    'Rudra': {
      name: 'Rudra (Operator)',
      role: 'USER',
      passHash: '52bf4225d3df6cbcf896be4fbaf2c27056c0733bb58c54117b355418bb6b9075', // RudraSarika@2505
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
    // Fallback simple hash if subtle crypto unavailable
    let hash = 0;
    for (let i = 0; i < plainText.length; i++) {
      hash = ((hash << 5) - hash) + plainText.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  function getUsers() {
    try {
      const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }

  function saveUsers(users) {
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(users));
  }

  async function login(username, plainPassword) {
    const users = getUsers();
    const user = users[username];

    if (!user) {
      return { success: false, message: 'Invalid username.' };
    }

    const hashedInput = await sha256(plainPassword);
    if (hashedInput !== user.passHash) {
      return { success: false, message: 'Incorrect password for account ' + username + '.' };
    }

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

  function getSessionToken() {
    const user = getCurrentUser();
    return user ? (user.token || '') : '';
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

  // --- Complete Logout Fix ---
  function logout() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    localStorage.removeItem(AUTH_STORAGE_KEY);

    const authView = document.getElementById('auth-view') || document.getElementById('authWrapper');
    const appShell = document.getElementById('app-shell') || document.getElementById('appShell');

    if (appShell) {
      appShell.hidden = true;
      appShell.style.display = 'none';
    }

    if (authView) {
      authView.hidden = false;
      authView.style.display = 'grid';
    }

    const pwd = document.getElementById('loginPassword') || document.getElementById('login-password');
    if (pwd) pwd.value = '';

    const errBox = document.getElementById('auth-message') || document.getElementById('loginErrorMsg');
    if (errBox) {
      errBox.textContent = 'You have logged out safely. Please sign in to resume.';
      errBox.className = 'notice notice-info';
      errBox.hidden = false;
      errBox.style.display = 'block';
    }

    selectLoginUser('Admin');
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
          const s = localStorage.getItem(AUTH_STORAGE_KEY);
          if (s) resetInactivityWatchdog();
        }, { passive: true });
      });
    }
  }

  initActivityListeners();

  function selectLoginUser(username) {
    const adminBtn = document.getElementById('userBtnAdmin') || document.getElementById('user-btn-admin');
    const rudraBtn = document.getElementById('userBtnRudra') || document.getElementById('user-btn-rudra');
    const hiddenInput = document.getElementById('loginSelectedUser') || document.getElementById('login-username');
    const pwdInput = document.getElementById('loginPassword') || document.getElementById('login-password');

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
    const pwdInput = document.getElementById('loginPassword') || document.getElementById('login-password');
    const btn = document.getElementById('togglePasswordBtn') || document.getElementById('toggle-password');
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
    const hiddenInput = document.getElementById('loginSelectedUser') || document.getElementById('login-username');
    const pwdInput = document.getElementById('loginPassword') || document.getElementById('login-password');
    const errBox = document.getElementById('loginErrorMsg') || document.getElementById('auth-message');

    const username = (hiddenInput && hiddenInput.value) ? hiddenInput.value.trim() : 'Admin';
    const password = (pwdInput && pwdInput.value) ? pwdInput.value : '';

    if (errBox) {
      errBox.style.display = 'none';
      errBox.hidden = true;
      errBox.textContent = '';
    }

    const res = await login(username, password);
    if (!res.success) {
      if (errBox) {
        errBox.textContent = res.message || 'Authentication failed.';
        errBox.className = 'notice notice-error';
        errBox.hidden = false;
        errBox.style.display = 'block';
      } else {
        alert(res.message || 'Authentication failed.');
      }
      return;
    }

    // Success: Hide Auth, Show Shell
    const authView = document.getElementById('auth-view') || document.getElementById('authWrapper');
    const appShell = document.getElementById('app-shell') || document.getElementById('appShell');

    if (authView) {
      authView.hidden = true;
      authView.style.display = 'none';
    }
    if (appShell) {
      appShell.hidden = false;
      appShell.style.display = 'flex';
    }

    if (typeof AppModule !== 'undefined' && AppModule.init) {
      AppModule.init();
    }
  }

  return {
    login,
    logout,
    getCurrentUser,
    getSessionToken,
    isAdmin,
    hasPermission,
    updatePassword,
    resetInactivityWatchdog,
    selectLoginUser,
    togglePasswordVisibility,
    handleLogin,
    sha256
  };
})();
