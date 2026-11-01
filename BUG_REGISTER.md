# Bug Register & Source Code Audit
## Transport Brokerage Ledger (SR Transport)
**Repository:** https://github.com/Nshravankumar4/Multi-Truck.git  
**Target:** `D:\Repo\SR Transport`  
**Date:** October 2026 • Auditor: Shravan Kumar

---

### Executive Summary
A comprehensive audit of the published source code in `app.js`, `api.js`, `data.js`, `calculations.js`, `table.js`, and `Code.gs` confirmed 7 critical architectural and functional bugs, as well as an essential financial reconciliation item between P&L and Driver Settlement for `TG15T6666`.

---

### Confirmed Bug Registry

| Bug ID | Component | Severity | Description | Root Cause in Code | Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | `js/app.js` | **Critical** | **Truck filter incorrectly implemented in Driver View:** Selecting "All Fleet Combined" displays only the first truck's (`TG15T6666`) driver settlement instead of aggregating fleet driver settlements. | `currentTruckFilter === 'ALL' ? 'TG15T6666' : currentTruckFilter` in driver render routine. | Implemented dedicated fleet-wide Driver Settlement Overview when `ALL` is selected, aggregating total driver payables, receivables, advances, and commissions across all trucks. |
| **BUG-002** | `js/app.js`<br>`js/calculations.js` | **Critical** | **Month filter state changes without filtering records:** `selectMonthFilter()` updates `currentMonthFilter`, but `renderCurrentView()` does not pass month/date range to calculations or table builders. | Calculation functions and table renderers ignored `currentMonthFilter` and computed totals across the entire lifetime array. | Integrated date & period filter engine into `CalcModule`, passing active period (`2026-10`, `2026-09`, etc.) or custom date ranges to all calculation and render functions. |
| **BUG-003** | `js/data.js`<br>`js/calculations.js` | **Critical** | **Hardcoded two-truck assumption:** The system breaks if a 3rd truck is registered; settlement calculation uses `if (truck.id === "TG15T6666") ... else ...`, forcing any new truck into `TS15UE1122`'s settlement math. | Hardcoded array indexing and binary if-else branching on truck IDs instead of data-driven parameters. | Refactored data model and calculations to be fully data-driven. Any number of trucks can be dynamically added with their own settlement parameters, trips, and driver assignments. |
| **BUG-004** | `js/api.js`<br>`js/app.js` | **Critical** | **Cloud synchronization false positive:** The app reports "Cloud Synced" and shows a green toast without applying returned server records to `LocalStorage`, risking data loss or state divergence. | `syncPush` logged responses but never merged server data back into `DataModule` or detected stale client state. | Implemented bidirectional reconciliation: server returns authoritative data and version; client merges and persists to `LocalStorage`; sync status accurately reflects `Connected`, `Syncing`, `Synced`, `Offline`, `Sync Failed`. |
| **BUG-005** | `backend/Code.gs` | **High** | **Unbound / empty spreadsheet ID risks silent failures or unintended database creation:** `CONFIG.SPREADSHEET_ID` was empty and could fail or attach to unintended containers. | No project-specific spreadsheet configuration or explicit validation. | Implemented Multi-Project architecture where each project specifies its own verified `spreadsheetId`. Backend validates sheet presence and schema before accepting writes. |
| **BUG-006** | `backend/Code.gs` | **High** | **Insecure client-supplied identity check:** Delete check only tested `if (user === "rudra")`, meaning arbitrary unverified strings could delete records. | Client-side username string passed without session verification. | Implemented server-side token validation and strict role verification. Delete operations require `ADMIN` role and validated session token. |
| **BUG-007** | `js/calculations.js` | **Medium** | **Hardcoded fallback calculation values:** Fallbacks like `28700` and truck-specific constants prevented dynamic multi-truck expansion. | Static constants directly in math functions. | Abstracted all settlement parameters (`oldBalance`, `claimedExpenses`, `itemizedExpenses`, `commissionRate`) into data entities. |
| **BUG-008** | `js/auth.js`<br>`index.html` | **Critical** | **Logout not working / UI modal ID mismatch:** Clicking "Logout" did not return user to login screen; `AppModule.checkAuthSession()` referenced non-existent DOM IDs (`loginModal`, `appShell`) while HTML used `authWrapper`. | ID mismatch caused session termination to fail silently without restoring login interface. | Standardized semantic DOM structure (`#auth-view` and `#app-shell`), wired event listeners centrally, and updated `AuthModule.logout()` to immediately clear session and toggle views. |

---

### Financial Calculation Discrepancy & Reconciliation Policy

In `Truck_Detials_1122_6666_Drivers.xlsx` and `Truck_Detials_1122_6666_P and L Account.xlsx`:

| Parameter | TG15T6666 Value | TS15UE1122 Value | Accounting Note |
| :--- | :--- | :--- | :--- |
| **Itemized Road Expenses Sum** | **₹28,735** (37 receipts) | **₹11,790** (22 receipts) | Computed from raw receipt rows (Col C-D). Used in P&L Account ($P_2$). |
| **Driver Claimed Settlement Expenses** | **₹28,700** | **₹11,790** | Claimed in settlement summary (Row 7, Col I). Used in Driver Settlement credit. |
| **Discrepancy / Rounding Difference** | **₹35** | **₹0** | The driver claimed ₹28,700 whereas receipts sum to ₹28,735. |

**Reconciliation Policy:**
The software **MUST NOT** silently force these two numbers to match.
- In P&L Accounts, operating expense reflects verified receipts: **₹28,735**
- In Driver Settlement, the credit reflects claimed amount: **₹28,700**, with an explicit reconciliation difference badge: **₹35 (Pending driver voucher reconciliation)**.
- For all new or dynamic trucks, settlement defaults to itemized receipts unless a claimed adjustment is explicitly entered.

