# Transport Brokerage Ledger Pvt Ltd
## Fleet Logistics & Financial Accounts Management System (P2)
**Master Enterprise Portal for Dual-Truck Operations (`TG15T6666` & `TS15UE1122`)**  
*Developed by Shravan Kumar • 2026*

---

## 📌 Executive Summary

**Transport Brokerage Ledger (P2)** is an enterprise-grade financial accounting, trip profitability, and driver settlement portal engineered specifically for multi-truck transport operations. 

It replicates, digitizes, and audits two authoritative master workbooks:
1. `X/Truck_Detials_1122_6666_Drivers.xlsx` (Driver Settlements, Advances, 12% Commissions, and 59 itemized road expenses)
2. `Y/Truck_Detials_1122_6666_P and L Account.xlsx` (Freight Revenue $P_1$, Operating Expenses $P_2$, Diesel logs, FastTag, and Net Operating Profit)

---

## 🚛 Verified Fleet Financial Breakdown (October 2026)

| Metric | TG15T6666 (Noor Allam) | TS15UE1122 (Allam Brother) | Fleet Combined Total |
| :--- | :--- | :--- | :--- |
| **Freight Revenue ($P_1$)** | **₹3,82,800** (4 trips) | **₹2,36,000** (3 trips) | **₹6,18,800** (7 trips) |
| **Operating Expenses ($P_2$)** | **₹2,57,075** | **₹1,83,670** | **₹4,40,745** |
| • Diesel Fuel | ₹1,32,600 (5 entries) | ₹1,03,000 (5 entries) | ₹2,35,600 (10 slips) |
| • FastTag Tolls | ₹40,000 | ₹25,000 | ₹65,000 |
| • AddBlue & Maintenance | ₹15,000 | ₹20,000 | ₹35,000 |
| • Road Expenses (En-route) | ₹28,735 (37 items) | ₹11,790 (22 items) | ₹40,525 (59 items) |
| • Driver 12% Salary Commission | ₹40,740 | ₹23,880 | ₹64,620 |
| **Net Operating Profit ($P_1 - P_2$)** | **₹1,25,725** (32.8% margin) | **₹52,330** (22.2% margin) | **₹1,78,055** (**28.77% margin**) |
| **Driver Account Settlement** | **₹5,040** *(Payable to Driver)* | **₹68,170** *(Payable by Driver)* | Net Cash Flow Balanced |

---

## 🔐 Security & Role-Based Access Control (RBAC)

The system features client-side SHA-256 password hashing with **zero exposure of plaintext passwords or default credentials**, strict input validation, and an automatic **10-minute inactivity timeout**.

| Account | Role | Verification | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | Shravan (Admin) | SHA-256 Verified | Full Read, Write, Edit, Delete, Export, Reset & Backup |
| **USER / OPERATOR** | Rudra (User) | SHA-256 Verified | Read-only Dashboard, P&L, Driver Ledgers & Excel Export |

*Note: Any session idle for longer than 10 minutes automatically terminates with session clearing to safeguard financial ledgers.*

---

## 🚀 Key Modules & Capabilities

1. **📊 Executive Fleet Dashboard**:
   - High-contrast KPI metric cards (Revenue, Expenses, Net Profit, Diesel spend, FastTag tolls).
   - Outstanding Action Cards (Screenshot 1 style) highlighting settlement actions and pending freight balances.
   - Dual-truck side-by-side performance cards with individual profit margins.
   - Operating expense allocation progress bar.

2. **💼 P&L Financial Accounts**:
   - Itemized Freight Trips ($P_1$) with route, transporter, base freight, advance, and balance due.
   - Operating Expenses ($P_2$) breakdown: itemized Diesel logs, FastTag, AddBlue, and 12% Driver Commission.
   - Clear mathematical equation box: $P_1 - P_2 = \text{Net Profit}$.

3. **👤 Driver Account Settlement & Advances**:
   - 12% Commission calculation on eligible base freight trips.
   - Driver Advances ledger tracking payments by Cash, UPI, and Bank Transfer.
   - Itemized En-route Road Expenses Ledger (37 entries for Noor Allam, 22 entries for Allam Brother) with category filtering (Border, Police, Weighbridge, Maintenance, Pooja).
   - Final Settlement Statement Box clearly articulating who pays whom.

4. **📑 1:1 Live Excel Replica & Zoom Controls**:
   - Multi-sheet tabs: `1122_6666_P&L Account`, `1122_6666_Driver`, and September 2026 Historical Archives (`Sheet1` & `Sheet2`).
   - Excel Zoom scaling: `80% Fit`, `90%`, `100%`, `115%`.
   - Authentic Excel grid formatting with colored headers, currency alignment, and formula tooltips.

5. **📥 Genuine Excel (.xlsx) Export**:
   - Powered by ExcelJS and FileSaver.
   - Generates authentic multi-sheet `.xlsx` files with colored section headers, borders, and live Excel formulas (`=SUM(...)`).

6. **☁️ Google Apps Script Backend (`backend/Code.gs`)**:
   - Multi-sheet sync for `PL_Accounts`, `Driver_Settlements`, `Road_Expenses`, `Advances`, and `Audit_Log`.
   - Concurrency lock protection (`LockService.getScriptLock()`).
   - Automated Google Drive backup snapshot function (`createDailyDriveBackup()`).

---

## 🛠️ Technology Stack

- **Frontend Core:** Pure Semantic HTML5, Modern CSS3 (CSS Variables, Flexbox, CSS Grid), Vanilla ES6+ JavaScript (Zero heavyweight framework overhead).
- **Libraries (Local):** `libs/exceljs.min.js`, `libs/FileSaver.min.js`, `libs/xlsx.full.min.js`.
- **Backend:** Google Apps Script (`Code.gs`) with Google Sheets REST endpoints.
- **Storage:** Browser LocalStorage (`FLEET_LEDGER_P2_MASTER_V1`) with cloud fallback.

---

## 🏁 Quickstart Guide

1. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).
2. Select your account:
   - **ADMIN**: Enter the authorized Administrator password.
   - **RUDRA**: Enter the authorized Operator password.
3. Access the complete fleet accounts, filter by vehicle (`TG15T6666` or `TS15UE1122`), inspect driver ledgers, and export genuine Excel reports.

---

*© 2026 Transport Brokerage Ledger Pvt Ltd • Developed by Shravan Kumar*
