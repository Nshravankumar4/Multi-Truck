# Project Operational Documentation & User Manual
## Transport Brokerage Ledger Pvt Ltd (P2)
**Fleet Logistics & Financial Accounts Management System**  
*Document Version: 2.0.0 • Developed by Shravan Kumar • 2026*

---

## 1. Introduction & Overview

The **Transport Brokerage Ledger (P2)** is a custom financial accounting and operations management platform designed to monitor, audit, and settle all financial transactions for the commercial fleet comprising:
- **Vehicle 1:** `TG15T6666` (Assigned Driver: **Noor Allam**)
- **Vehicle 2:** `TS15UE1122` (Assigned Driver: **Allam Brother / Shankar**)

This document serves as the authoritative operational manual for management, accountants, dispatchers, and system administrators.

---

## 2. Authentication & Access Control

### 2.1 User Accounts & Roles
The system enforces strict role-based access control. All authentication requests are verified locally using cryptographic SHA-256 digests.

| Account Card | Role Name | Intended Operator | Privileges |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `Administrator` | Shravan Kumar | Full authority to create, edit, delete, backup, restore, and configure ledgers. |
| **RUDRA** | `Operator / User` | Rudra / Accounts Staff | View all ledgers, filter trucks, inspect settlements, and export Excel reports. |

### 2.2 Security Best Practices
- **No Default Passwords:** The system displays zero default password hints or test strings.
- **Inactivity Watchdog:** If the portal remains inactive for **10 continuous minutes**, the session expires automatically to prevent unauthorized access.
- **Session Isolation:** Credentials and active session tokens are stored in encrypted browser memory (`sessionStorage`) and are automatically cleared on tab or browser closure.

---

## 3. Navigation & Screen Walkthrough

### 3.1 Slide-In Navigation Drawer (Screenshot 4)
The navigation drawer is opened via the **☰ Menu** button in the top left corner:
- **Header:** Displays the verified brand icon 🚚 and company designation `Transport Brokerage Ledger`.
- **User Profile Badge:** Displays current user identity and role pill.
- **Navigation Menu (Zero Scrollbar):** Direct access to:
  - 📊 **Dashboard:** Executive KPIs, settlement alerts, and fleet comparison.
  - 💼 **P&L Accounts:** Itemized trip revenue, diesel expenses, and net profit calculations.
  - 👤 **Driver Settlements:** 12% commission calculation, advances ledger, and 59 itemized road expense receipts.
  - 📑 **Spreadsheet Replica:** 1:1 live replica of original Excel sheets with zoom scaling.
  - 🔄 **Sync Cloud Database:** Triggers live sync with Google Apps Script backend.
  - 📥 **Export Excel (.xlsx):** Downloads genuine formatted `.xlsx` workbook.
  - ⚙️ **Settings & API:** Configures Google Apps Script Web App endpoint.
  - 📋 **Restore Excel Data:** Re-seeds verified original Excel records (Admin only).
- **Bottom Status & Actions:**
  - Status indicator: `Online • 2 Trucks • 7 Verified Trips`
  - Blue `🔄 Sync` button
  - High-visibility red `🚪 Logout / Switch User` button

### 3.2 View 1: Executive Fleet Dashboard
- **Settlement & Receivables Alert Banner (Screenshot 1):**
  - Surfaces urgent settlement notices (e.g., ₹5,040 payable to Noor Allam; ₹68,170 receivable from Allam Brother; ₹18,500 pending freight from HYD LOGISTICS).
  - Quick action buttons allow instantaneous navigation to relevant ledgers.
- **KPI Summary Cards:**
  - Total Freight Revenue ($P_1$): **₹6,18,800**
  - Total Operating Expenses ($P_2$): **₹4,40,745**
  - Net Operating Profit ($P_1 - P_2$): **₹1,78,055** (28.77% margin)
  - Total Diesel Fuel Spend: **₹2,35,600** (10 pump slips)
  - National Highway FastTag: **₹65,000**
  - Driver 12% Commissions: **₹64,620**
- **Dual-Truck Comparison Cards:**
  - Compares revenue, expenses, profit, and driver balances between `TG15T6666` and `TS15UE1122`.
- **Expense Allocation Bar:**
  - Visual breakdown: Diesel (53.4%), FastTag (14.7%), Driver Salary (14.7%), Road Expenses (9.2%), AdBlue & Others (8.0%).

### 3.3 View 2: P&L Financial Accounts
- Displays itemized trips contributing to freight revenue ($P_1$).
- Itemizes operating expenses ($P_2$):
  - 5 Diesel entries for `TG15T6666` (₹1,32,600) and 5 Diesel entries for `TS15UE1122` (₹1,03,000).
  - FastTag tolls (₹40,000 for 6666; ₹25,000 for 1122).
  - AddBlue and minor items (₹15,000 for 6666; ₹20,000 for 1122).
  - En-route road expenses (₹28,735 for 6666; ₹11,790 for 1122).
  - Driver 12% salary commission (₹40,740 for 6666; ₹23,880 for 1122).
- Dynamic mathematical formula card verifies $P_1 - P_2 = \text{Net Profit}$.

### 3.4 View 3: Driver Account Settlement & Advances
- **Driver Switcher:** Toggle between **Noor Allam (`TG15T6666`)** and **Allam Brother (`TS15UE1122`)**.
- **12% Commission Table:** Lists eligible base freight trips and automatically calculates 12% commission.
- **Advances Ledger:** Tracks advance cash, UPI, and bank transfers received by drivers.
- **Itemized Road Expenses Ledger:**
  - 37 items for Noor Allam totaling ₹28,735.
  - 22 items for Allam Brother totaling ₹11,790.
  - Interactive filter chips: Border / Toll, Police, Labour / Kanta, Tyres / Greasing.
- **Authoritative Settlement Statement Box:**
  - `TG15T6666`: Total Credit (₹83,240) − Advances (₹78,200) = **₹5,040** (Payable by Shankar to Noor Allam).
  - `TS15UE1122`: Advance Surplus (₹5,830) + Old Balance (₹62,340) = **₹68,170** (Payable by Allam to Shankar).

### 3.5 View 4: Excel 1:1 Live Replica
- Sheet tabs matching the master workbooks:
  1. `1122_6666_P&L Account`
  2. `1122_6666_Driver`
  3. `TG15T6666 - Sept 2026 (Sheet1)`
  4. `TS15UE1122 - Sept 2026 (Sheet2)`
- Zoom scaling controls: `80% Fit`, `90%`, `100%`, `115%`.
- Real Excel formatting with cell formulas (`=SUM(...)`) visible on hover.

---

## 4. Operational Workflows & Data Entry

### 4.1 Recording a New Freight Trip
1. Click **+ Add Shipment** in the sub-header toolbar.
2. Select **Freight Shipment Trip ($P_1$)**.
3. Choose the vehicle (`TG15T6666` or `TS15UE1122`).
4. Enter Date Range, Origin (From), Destination (To), Total Freight Amount, and Base Freight.
5. Provide Transporter name and Advance received.
6. Click **Save Entry**. The P&L and Driver Commission update immediately.

### 4.2 Recording a Diesel Fuel Slip
1. In the P&L Accounts view, click **+ Add Fuel Slip** (or open the Add modal).
2. Enter the Date, Pump / Station Name, and Slip Amount.
3. Click **Save Entry**. The Diesel total and Net Profit update automatically.

### 4.3 Recording a Driver Advance
1. In the Driver Settlement view, click **+ Record Driver Advance**.
2. Select vehicle, enter Date, Location/Narration, Payment Mode (Cash, UPI, Bank Transfer), and Amount.
3. Click **Save Entry**. The Driver Balance statement updates instantaneously.

### 4.4 Recording an En-Route Road Expense
1. In the Driver Settlement view, click **+ Add Road Expense**.
2. Enter Description, select Category (Border, Police, Weighbridge, Maintenance, etc.), and enter Amount.
3. Click **Save Entry**.

---

## 5. Excel Export & Backup Operations

### 5.1 Exporting Genuine Excel (.xlsx)
1. Click **📥 Export Excel (.xlsx)** in the top toolbar or drawer menu.
2. The system packages all verified sheets into a clean `.xlsx` workbook preserving all formulas, borders, and color schemes.
3. The file downloads directly to the user's Downloads directory.

### 5.2 Google Sheets Cloud Synchronization
1. Ensure the Google Apps Script Web App URL is configured in **Settings & API**.
2. Click **🔄 Sync** to push local updates and verify consistency with the Google Sheets database.
3. The backend script automatically logs an audit trail in `Audit_Log` and executes Drive snapshots.

---

*© 2026 Transport Brokerage Ledger Pvt Ltd • Developed by Shravan Kumar*
