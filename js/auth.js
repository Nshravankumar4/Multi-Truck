/**
 * Fleet Logistics & Financial Accounts Management - Authentication Module
 * Secure Role-Based Access Control (RBAC) with SHA-256 client verification
 * 10-Minute Inactivity Auto-Logout • Zero Default Password Hints
 * Developed by Shravan Kumar • 2026
 */

const AuthModule = (function () {
  'use strict';

  const AUTH_STORAGE_KEY = 'FLEET_LEDGER_P2_AUTH_SESSION';
  const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  const CREDENTIALS_KEY = 'FLEET_LEDGER_P2_CREDENTIALS';

  // Default Authoritative SHA-256 Hashes
  const DEFAULT_CREDENTIALS = {
    Admin: {
      username: 'Admin',
      displayName: 'Shravan (Admin)',
      role: 'ADMIN',
      permissions: ['read', 'write', 'edit', 'delete', 'export', 'backup', 'settings', 'sync'],
      // SHA-256 of "Shravan@2505"
      passwordHash: 'ded12726612993e58a7f6f1b0428300adcf13f6cabb7515436c5888b3de21c0b'
    },
    Rudra: {
      username: 'Rudra',
      displayName: 'Rudra (User)',
      role: 'USER',
      permissions: ['read', 'write', 'edit', 'export', 'sync'],
      // SHA-256 of "RudraSarika@2505"
      passwordHash: '0a623bcaece42a5740cdfb0b78849ec8717d811c8c2583697ab884513f4d9e3f'
    }
  };

  let currentUser = null;
  let inactivityTimer = null;

  function getCredentials() {
    try {
      const stored = localStorage.getItem(CREDENTIALS_KEY);
      if (stored) {
        return Object.assign({}, DEFAULT_CREDENTIALS, JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading stored credentials:', e);
    }
    return DEFAULT_CREDENTIALS;
  }

  async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function updatePassword(username, newPassword) {
    if (!username || !newPassword) return false;
    const creds = getCredentials();
    if (!creds[username]) return false;
    const hash = await sha256(newPassword);
    creds[username].passwordHash = hash;
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    
    // Notify cloud backend if configured
    if (typeof window !== 'undefined' && window.ApiModule && typeof window.ApiModule.pushPasswordUpdate === 'function') {
      window.ApiModule.pushPasswordUpdate(username, hash);
    }
    return true;
  }

  function init() {
    setupActivityListeners();
    checkExistingSession();
  }

  function checkExistingSession() {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.username && session.expiry > Date.now()) {
          currentUser = session;
          startInactivityTimer();
          onLoginSuccess(currentUser, false);
          return;
        }
      }
    } catch (e) {
      console.warn('Session check error:', e);
    }
    showLoginScreen();
  }

  function selectLoginUser(username) {
    const adminBtn = document.getElementById('userBtnAdmin');
    const rudraBtn = document.getElementById('userBtnRudra');
    const hiddenUser = document.getElementById('loginSelectedUser');
    const pwdInput = document.getElementById('loginPassword');

    if (username === 'Admin') {
      if (adminBtn) adminBtn.classList.add('active');
      if (rudraBtn) rudraBtn.classList.remove('active');
      if (hiddenUser) hiddenUser.value = 'Admin';
      if (pwdInput) pwdInput.placeholder = 'Enter password for Admin';
    } else {
      if (adminBtn) adminBtn.classList.remove('active');
      if (rudraBtn) rudraBtn.classList.add('active');
      if (hiddenUser) hiddenUser.value = 'Rudra';
      if (pwdInput) pwdInput.placeholder = 'Enter password for Rudra';
    }

    const errDiv = document.getElementById('loginErrorMsg');
    if (errDiv) errDiv.style.display = 'none';
    if (pwdInput) {
      pwdInput.value = '';
      pwdInput.focus();
    }
  }

  async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();

    const selectedUser = (document.getElementById('loginSelectedUser') || {}).value || 'Admin';
    const pwdInput = document.getElementById('loginPassword');
    const errDiv = document.getElementById('loginErrorMsg');
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (!pwdInput) return;
    const password = pwdInput.value.trim();

    if (!password) {
      showError('Please enter your password.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';
    }

    try {
      const inputHash = await sha256(password);
      const creds = getCredentials();
      const targetUser = creds[selectedUser];

      if (!targetUser || inputHash !== targetUser.passwordHash) {
        // Strict security: generic error, no hints
        showError('Invalid username or password. Access denied.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '🚀 Secure Login';
        }
        return;
      }

      // Login Verified
      currentUser = {
        username: targetUser.username,
        displayName: targetUser.displayName,
        role: targetUser.role,
        permissions: targetUser.permissions,
        loginTime: Date.now(),
        expiry: Date.now() + (24 * 60 * 60 * 1000) // 24hr session
      };

      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      startInactivityTimer();

      // Show welcome splash overlay
      showWelcomeSplash(currentUser);

    } catch (err) {
      console.error('Authentication exception:', err);
      showError('Authentication system error. Please try again.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Secure Login';
      }
    }
  }

  function showError(msg) {
    const errDiv = document.getElementById('loginErrorMsg');
    if (errDiv) {
      errDiv.textContent = msg;
      errDiv.style.display = 'block';
    }
  }

  function showWelcomeSplash(user) {
    const splash = document.getElementById('welcomeSplashOverlay');
    const greeting = document.getElementById('welcomeSplashGreeting');
    const status = document.getElementById('welcomeSplashStatus');

    if (greeting) greeting.textContent = `👋 Welcome, ${user.displayName}!`;
    if (status) status.textContent = 'Authenticating credentials & loading verified financial records...';
    if (splash) splash.style.display = 'flex';

    setTimeout(() => {
      if (status) status.textContent = 'Synchronizing Fleet P&L & Driver settlement ledgers...';
    }, 600);

    setTimeout(() => {
      if (splash) splash.style.display = 'none';
      onLoginSuccess(user, true);
    }, 1200);
  }

  function onLoginSuccess(user, isFresh) {
    const authWrapper = document.getElementById('authWrapper');
    const appWrapper = document.getElementById('appWrapper');

    if (authWrapper) authWrapper.style.display = 'none';
    if (appWrapper) appWrapper.style.display = 'flex';

    // Update UI Elements
    const curUserDisplay = document.getElementById('currentUserDisplay');
    const curRoleBadge = document.getElementById('currentUserRoleBadge');
    const drawerUserName = document.getElementById('drawerUserName');
    const drawerUserRole = document.getElementById('drawerUserRole');

    if (curUserDisplay) curUserDisplay.textContent = user.displayName;
    if (curRoleBadge) {
      curRoleBadge.textContent = user.role;
      curRoleBadge.className = 'user-role-badge ' + (user.role === 'ADMIN' ? 'role-admin' : 'role-user');
    }
    if (drawerUserName) drawerUserName.textContent = user.displayName;
    if (drawerUserRole) drawerUserRole.textContent = user.role;

    // RBAC: Show/Hide Admin-only elements
    const isAdmin = user.role === 'ADMIN';
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });

    if (window.AppModule && window.AppModule.onUserAuthenticated) {
      window.AppModule.onUserAuthenticated(user, isFresh);
    }
  }

  function showLoginScreen() {
    currentUser = null;
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    clearInactivityTimer();

    const authWrapper = document.getElementById('authWrapper');
    const appWrapper = document.getElementById('appWrapper');
    const pwdInput = document.getElementById('loginPassword');
    const errDiv = document.getElementById('loginErrorMsg');
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (appWrapper) appWrapper.style.display = 'none';
    if (authWrapper) authWrapper.style.display = 'flex';
    if (pwdInput) pwdInput.value = '';
    if (errDiv) errDiv.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Secure Login';
    }
  }

  function logout() {
    showLoginScreen();
  }

  function togglePasswordVisibility() {
    const pwdInput = document.getElementById('loginPassword');
    const toggleBtn = document.getElementById('togglePasswordBtn');
    if (!pwdInput) return;
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      if (toggleBtn) toggleBtn.textContent = '🔒';
    } else {
      pwdInput.type = 'password';
      if (toggleBtn) toggleBtn.textContent = '👁️';
    }
  }

  // 10-Minute Inactivity Tracker
  function setupActivityListeners() {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const throttledReset = throttle(resetInactivityTimer, 2000);
    events.forEach(ev => {
      window.addEventListener(ev, throttledReset, { passive: true });
    });
  }

  function startInactivityTimer() {
    clearInactivityTimer();
    inactivityTimer = setTimeout(() => {
      alert('Your session has timed out due to 10 minutes of inactivity. Please log in again.');
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }

  function resetInactivityTimer() {
    if (currentUser) {
      startInactivityTimer();
    }
  }

  function clearInactivityTimer() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }

  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  function getCurrentUser() {
    return currentUser;
  }

  function isAdmin() {
    return currentUser && currentUser.role === 'ADMIN';
  }

  return {
    init,
    selectLoginUser,
    handleLogin,
    logout,
    togglePasswordVisibility,
    getCurrentUser,
    isAdmin,
    updatePassword
  };
})();

if (typeof window !== 'undefined') {
  window.AuthModule = AuthModule;
}

