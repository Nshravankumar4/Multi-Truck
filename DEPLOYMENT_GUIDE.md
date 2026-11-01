# Deployment & Cloud Integration Guide
## Transport Brokerage Ledger Pvt Ltd (SR Transport)
**Target:** Multi-Project Cloud Spreadsheet Architecture

---

## 1. Verified Active Production Deployment

The production deployment has been completed and verified with the following live assets:

| Asset | Production URL / Identifier | Access Level |
|---|---|---|
| **Dedicated Google Spreadsheet** | [Open Spreadsheet](https://docs.google.com/spreadsheets/d/1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4/edit?usp=sharing)<br>`https://docs.google.com/spreadsheets/d/1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4/edit?usp=sharing` | **Admin Only** |
| **Production Web App Endpoint** | [API Executable URL](https://script.google.com/macros/s/AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ/exec)<br>`https://script.google.com/macros/s/AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ/exec` | Real-time Sync API |
| **Deployment ID** | `AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ` | Version 2 (1 Nov 2026, 12:54) |
| **Spreadsheet ID** | `1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4` | Bound Cloud Master Ledger |

---

## 2. Administrator-Only Cloud Links & Settings Protection

Per business requirements, all cloud infrastructure links and configuration controls are strictly restricted:
- **Visibility:** The `⚙️ Settings` button (in both the top toolbar and the sidebar drawer) and the `📊 Open Sheet` button are tagged with `.admin-only`.
- **RBAC Enforcement:** When logged in as **Rudra (Operator)**, these buttons are hidden from the DOM. If accessed programmatically, client-side guards block access:
  ```javascript
  if (!AuthModule.isAdmin()) {
    alert("Access Denied: Only Administrator (Admin) can view and configure cloud spreadsheet settings.");
    return;
  }
  ```
- **Backend Authorization:** `Code.gs` enforces that mutations requiring deletion or structural re-seeding require `role === "ADMIN"`.

---

## 3. Dedicated Google Spreadsheet Architecture

### Step 1: Create a Dedicated Spreadsheet
1. Open [https://sheets.new](https://sheets.new) in your web browser.
2. Name the spreadsheet:
   `SR Transport - [Project Name] (e.g. SR Transport Main Fleet)`
3. Copy the Spreadsheet ID from the browser URL:
   `https://docs.google.com/spreadsheets/d/`**`<YOUR_SPREADSHEET_ID>`**`/edit`

### Step 2: Bind the Apps Script Backend
1. In your newly created Google Sheet, go to **Extensions** > **Apps Script**.
2. Rename the project to `SR_Transport_Backend`.
3. In `Code.gs`, delete any existing template code and paste the complete content of [`backend/Code.gs`](file:///d:/Repo/SR%20Transport/backend/Code.gs).
4. Save the project (**💾 Save**).

### Step 3: Deploy as Web App
1. Click **Deploy** > **New deployment**.
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**.
3. Configure the deployment settings:
   - **Description**: `SR Transport Production v2.0`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` *(Allows the frontend to send authenticated POST requests)*
4. Click **Deploy**.
5. Authorize access when prompted by Google.
6. Copy the **Web app URL**:
   `https://script.google.com/macros/s/AKfycb.../exec`

---

## 3. Frontend Portal Configuration

1. Open [`index.html`](file:///d:/Repo/SR%20Transport/index.html) in any modern browser.
2. Log in as **ADMIN** (`Admin` / `Shravan@2505`).
3. Click the **⚙️ Settings** icon in the top toolbar or navigation drawer.
4. Paste your **Dedicated Google Spreadsheet ID** into the Spreadsheet ID field.
5. Paste your deployed **Apps Script Web App URL** into the Web App URL field.
6. Click **Save Settings**.
7. Click the **🔄 Sync** button in the toolbar:
   - The status badge will change from `🔄 Syncing...` to `🟢 Synced (v2)`.
   - The 12 standard tabs (`Project_Settings`, `Fleet`, `Drivers`, `PL_Accounts`, `Trips`, `Diesel_Entries`, `Driver_Settlements`, `Road_Expenses`, `Advances`, `Monthly_Archives`, `Audit_Log`, `_Meta`) will be automatically initialized in your Google Sheet!

---

## 4. Multi-Project Management

When managing multiple fleets, companies, or corridors:
1. In the top bar, click **＋ Project**.
2. Enter the new Project Name (e.g. `Project 002 - North Corridor Logistics`).
3. Follow Step 1 above to create a separate Google Spreadsheet for that project and enter its Spreadsheet ID.
4. Each project maintains its own isolated trucks, drivers, trips, and accounting periods. Data is completely segregated and never collides.

---

## 5. Security & Inactivity Safeguards

- **Client Credentials:** Passwords are verified client-side using SHA-256 hashes (`crypto.subtle.digest`).
- **Inactivity Watchdog:** Any session left idle for **10 continuous minutes** is automatically terminated and cleared.
- **Rudra Delete Protection:** Operator `Rudra` can view, add, and edit daily operational records, but cannot delete records or alter project configurations. Backend server-side checks reject any unauthorized delete requests.
- **Automated Drive Backups:** The Apps Script backend automatically creates a timestamped copy of the spreadsheet in a dedicated Google Drive folder (`SR_Transport_Project_Backups`) before applying any mutations.

