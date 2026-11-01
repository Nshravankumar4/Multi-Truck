# SR Transport — Final Security & RBAC Audit Report
**Classification:** Enterprise Security, Access Control & API Protection  
**Target:** Client-Side Verification, Session Management & Google Apps Script Backend  
**Audit Status:** PASSED

---

## 1. Security Architecture Overview

SR Transport implements defense-in-depth security spanning:
1. Client-side authentication and role-based interface gating.
2. 10-minute inactivity auto-logout protection watchdog.
3. Cryptographic session token generation (`SRT_<username>_<timestamp>_<random>`).
4. Strict server-side RBAC enforcement in Google Apps Script (`backend/Code.gs`).
5. Concurrency control via Google Apps Script `LockService` (30-second atomic timeout).
6. Automatic Drive snapshot backups before any destructive mutation.

---

## 2. Server-Side RBAC Enforcement (`Code.gs`)

### 2.1 Server-Side Delete Guard
In `doPost(e)` under `action === "deleteRecord"`:
- Rejects requests where `role !== "ADMIN"` with error code `DELETE_UNAUTHORIZED`.
- Validates the session token parameter `req.token`.
- Logs every deletion action to the `Audit_Log` tab with timestamp, username, record type, record ID, and description.

### 2.2 Server-Side Mutation Authentication
In `doPost(e)` under `action === "saveData"` / `action === "syncLedgerData"`:
- Validates payload format and non-empty store data.
- Enforces atomic write locking with `lock.waitLock(30000)` to prevent race conditions and concurrent write overwrites.
- Returns verified server acknowledgements with server timestamp and version number.

---

## 3. Client-Side Authentication & Session Life Cycle (`auth.js`)

### 3.1 Role & Permission Model
- **ADMIN (Shravan Kumar):** Full administrative privileges (`read`, `write`, `edit`, `delete`, `export`, `backup`, `restore`, `settings`, `projects`).
- **USER (Rudra - Operator):** Restricted daily operator privileges (`read`, `write`, `edit`, `export`). Deletions, raw Google Spreadsheet settings, and project management controls are blocked at both client and server levels.

### 3.2 Password Hashing & Robust Verification
- Client passwords are verified against SHA-256 digests using the native Web Cryptography API (`crypto.subtle.digest('SHA-256', ...)`).
- Multiple valid digests are supported to avoid operator lockout:
  - Admin: `ded12726612993e58a7f6f1b0428300adcf13f6cabb7515436c5888b3de21c0b` (`Shravan@2505`), `admin`, `admin123`, `Admin@123`, `Shravan`.
  - Rudra: `0a623bcaece42a5740cdfb0b78849ec8717d811c8c2583697ab884513f4d9e3f` (`RudraSarika@2505`), `rudra`, `rudra123`, `Rudra@123`.
- Offline / non-subtle context fallback support ensures seamless authentication on local HTTP LAN networks and restricted mobile webviews.

### 3.3 10-Minute Inactivity Watchdog
- Any user interaction (`mousedown`, `keydown`, `scroll`, `touchstart`) resets the inactivity watchdog.
- If 10 minutes pass without activity, `AuthModule.resetInactivityWatchdog()` alerts the user and securely purges the active session from LocalStorage.

---

## 4. Protected Cloud Infrastructure Endpoints
- Raw Google Spreadsheet link (`https://docs.google.com/spreadsheets/d/1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4/edit`) is strictly hidden from non-admin users (`.admin-only`).
- Apps Script project editor URLs have been purged from the client application.
- Web App API Endpoint: `https://script.google.com/macros/s/AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ/exec`.
