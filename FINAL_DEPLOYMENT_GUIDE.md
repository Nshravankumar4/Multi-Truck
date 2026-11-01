# SR Transport — Final Deployment & Production Runbook
**Application:** Multi-Truck Fleet Logistics & Brokerage Financial Ledger  
**Production Host:** GitHub Pages (`https://nshravankumar4.github.io/Multi-Truck/`)  
**Backend:** Google Apps Script Web App  
**Authoritative Spreadsheet:** Google Sheets (ID: `1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4`)  
**Status:** PRODUCTION READY

---

## 1. Verified Production Assets

| Asset Name | Target URL / Identifier | Access Level | Description |
|---|---|---|---|
| **Authoritative Google Sheet** | [Open Google Spreadsheet](https://docs.google.com/spreadsheets/d/1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4/edit) | **Admin Only** | Dedicated cloud database containing 12 standardized master tabs. |
| **Web App Endpoint** | [Production Executable URL](https://script.google.com/macros/s/AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ/exec) | **System API** | Atomic sync and mutation engine with 30s `LockService`. |
| **Deployment ID** | `AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ` | Version 2 | Latest deployed Google Apps Script revision. |
| **Spreadsheet ID** | `1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4` | Cloud Master | Resolved automatically by backend `resolveProjectSpreadsheet()`. |

---

## 2. Standardized Google Spreadsheet Tab Schema

The backend initializes and synchronizes the following 12 tabs:
1. `Project_Settings`: Configuration keys, active period, and metadata.
2. `Fleet`: Truck ID, registration number, driver assignment, model, capacity, status.
3. `Drivers`: Driver ID, name, phone, truck ID, commission rate (12%), status.
4. `PL_Accounts`: P1 Freight, base freight, diesel, claimed road, itemized road, driver commission, fixed expenses, net profit, margin %.
5. `Trips`: Trip ID, truck ID, date, source, destination, P1 freight, base freight, diesel, road exp, margin.
6. `Diesel_Entries`: Log ID, truck ID, date, pump name, liters, rate, total amount.
7. `Driver_Settlements`: Settlement ID, truck ID, driver ID, period, advances, road expenses, commission, net balance payable/receivable.
8. `Road_Expenses`: Voucher ID, truck ID, date, category, description, amount.
9. `Advances`: Advance ID, truck ID, driver ID, date, payment type, purpose, amount.
10. `Monthly_Archives`: Monthly consolidated snapshot for long-term historical audits.
11. `Audit_Log`: Timestamp, user, action, record type, record ID, details.
12. `_Meta`: Internal versioning, last synced timestamp, and active accounting period.

---

## 3. Deployment Procedure for GitHub Pages

1. **Verify Automated Test Suite:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File "test_suite.ps1"
   ```
   Ensure output reports: `RESULT: 22 / 22 TESTS PASSED`.

2. **Commit Changes to Git:**
   ```bash
   git add -A
   git commit -m "feat(release): complete main-branch audit, security repair, and UI redesign"
   ```

3. **Merge & Push to `main`:**
   ```bash
   git checkout main
   git merge fix/multi-truck-complete-audit
   git push origin main
   ```

4. **Verify GitHub Pages Deployment:**
   - Navigate to repository settings on GitHub: **Settings** > **Pages**.
   - Ensure source is configured to deploy from branch `main` (`/ (root)`).
   - Visit: `https://nshravankumar4.github.io/Multi-Truck/`.
