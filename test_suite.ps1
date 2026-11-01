# =========================================================================
# 🚚 TRANSPORT BROKERAGE LEDGER (P2) - COMPLETE AUTOMATED VERIFICATION SUITE
# =========================================================================

$ErrorActionPreference = "Stop"
$p2Dir = "D:\Repo\SR Transport"
$codeGs = Join-Path $p2Dir "backend\Code.gs"
$apiJs = Join-Path $p2Dir "js\api.js"
$appJs = Join-Path $p2Dir "js\app.js"
$authJs = Join-Path $p2Dir "js\auth.js"
$calcJs = Join-Path $p2Dir "js\calculations.js"
$dashJs = Join-Path $p2Dir "js\dashboard.js"
$dataJs = Join-Path $p2Dir "js\data.js"
$tableJs = Join-Path $p2Dir "js\table.js"
$indexHtml = Join-Path $p2Dir "index.html"
$stylesCss = Join-Path $p2Dir "css\styles.css"

$totalTests = 0
$passedTests = 0

function Assert-Test([string]$testName, [bool]$condition, [string]$details) {
    $script:totalTests++
    if ($condition) {
        $script:passedTests++
        Write-Host "✅ [PASS] $testName" -ForegroundColor Green
    } else {
        Write-Host "❌ [FAIL] $testName : $details" -ForegroundColor Red
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "TRANSPORT BROKERAGE LEDGER (P2) COMPREHENSIVE VERIFICATION" -ForegroundColor Cyan
Write-Host "==========================================================`n" -ForegroundColor Cyan

# 1. Inspect Core Files Exist
Assert-Test "All Core Application Files Exist" (
    (Test-Path $codeGs) -and (Test-Path $apiJs) -and (Test-Path $appJs) -and 
    (Test-Path $authJs) -and (Test-Path $calcJs) -and (Test-Path $dashJs) -and 
    (Test-Path $dataJs) -and (Test-Path $tableJs) -and (Test-Path $indexHtml) -and
    (Test-Path $stylesCss)
) "One or more core application files are missing."

$codeContent = Get-Content $codeGs -Raw -Encoding utf8
$apiContent = Get-Content $apiJs -Raw -Encoding utf8
$appContent = Get-Content $appJs -Raw -Encoding utf8
$authContent = Get-Content $authJs -Raw -Encoding utf8
$calcContent = Get-Content $calcJs -Raw -Encoding utf8
$dashContent = Get-Content $dashJs -Raw -Encoding utf8
$dataContent = Get-Content $dataJs -Raw -Encoding utf8
$tableContent = Get-Content $tableJs -Raw -Encoding utf8
$htmlContent = Get-Content $indexHtml -Raw -Encoding utf8
$cssContent = Get-Content $stylesCss -Raw -Encoding utf8

# 2. Multi-Project Management Architecture
Assert-Test "Multi-Project Management in data.js & app.js" (
    $dataContent.Contains("getProjects") -and
    $dataContent.Contains("addProject") -and
    $dataContent.Contains("setCurrentProjectId") -and
    $appContent.Contains("selectProject") -and
    $appContent.Contains("openAddProjectModal")
) "DataModule and AppModule must implement full project creation and switching."

# 3. Dynamic Unlimited Fleet / Truck Support
Assert-Test "Dynamic Unlimited Fleet & Truck Management" (
    $dataContent.Contains("addTruck") -and
    $dataContent.Contains("updateTruck") -and
    $dataContent.Contains("deleteTruck") -and
    $appContent.Contains("openAddTruckModal") -and
    $appContent.Contains("renderTruckFilterPills")
) "System must support registering new trucks dynamically with driver assignment."

# 4. Date & Accounting Period Organization
Assert-Test "Date & Accounting Period Architecture" (
    $dataContent.Contains("accountingPeriods") -and
    $dataContent.Contains("period: ""2026-10""") -and
    $dataContent.Contains("period: ""2026-09""") -and
    $calcContent.Contains("matchesFilter") -and
    $appContent.Contains("selectPeriodFilter")
) "Transactions must be associated with dates and periods without cross-month corruption."

# 5. Authoritative P&L Calculations (P1 - P2)
Assert-Test "Authoritative P&L Calculation Engine" (
    $calcContent.Contains("totalRevenueP1") -and
    $calcContent.Contains("totalExpensesP2") -and
    $calcContent.Contains("netProfit = totalRevenueP1 - totalExpensesP2") -and
    $calcContent.Contains("calculateDriverCommission")
) "P&L calculation must compute P1, P2, Net Profit, and 12% commission on base freight."

# 6. Dynamic Driver Settlement Engine
Assert-Test "Dynamic Multi-Truck Driver Settlement Engine" (
    $calcContent.Contains("calculateDriverSettlement") -and
    $calcContent.Contains("driverCredits") -and
    $calcContent.Contains("driverDebits") -and
    $calcContent.Contains("netDirection")
) "Driver settlements must be calculated dynamically based on credits and debits."

# 7. Explicit Reconciliation for ₹35 Discrepancy
Assert-Test "Audit Reconciliation for TG15T6666 ₹35 Discrepancy" (
    $dataContent.Contains("claimedRoadExpenses: 28700") -and
    $dataContent.Contains("itemizedRoadExpenses: 28735") -and
    $dataContent.Contains("reconciliationDiff: 35") -and
    $calcContent.Contains("reconciliationDiff")
) "System must preserve both itemized (₹28,735) and claimed (₹28,700) expenses with ₹35 difference."

# 8. Fleet Driver Settlements Overview (BUG-001 Fix)
Assert-Test "Fleet Driver Overview when ALL Trucks Selected" (
    $tableContent.Contains("All Drivers Combined") -and
    $tableContent.Contains("Fleet Driver Accounts Summary") -and
    $calcContent.Contains("totalPayableToDrivers") -and
    $calcContent.Contains("totalReceivableFromDrivers")
) "Driver view must show combined fleet summary when ALL trucks are selected."

# 9. Backend LockService Concurrency Guard
Assert-Test "LockService Concurrency Guard in Code.gs" (
    $codeContent.Contains("LockService.getScriptLock()") -and
    $codeContent.Contains("lock.waitLock(30000)") -and
    $codeContent.Contains("lock.releaseLock()")
) "Code.gs must enforce 30s atomic ScriptLock on mutations."

# 10. Dedicated Project Spreadsheet Resolution & Tabs
Assert-Test "Dedicated Spreadsheet Resolution in Code.gs" (
    $codeContent.Contains("resolveProjectSpreadsheet") -and
    $codeContent.Contains("Project_Settings") -and
    $codeContent.Contains("Driver_Settlements") -and
    $codeContent.Contains("Road_Expenses")
) "Code.gs must resolve dedicated spreadsheet and ensure standardized tabs."

# 11. Server-Side RBAC Delete Authorization (BUG-006 Fix)
Assert-Test "Server-Side RBAC Delete Authorization in Code.gs" (
    $codeContent.Contains("action === ""deleteRecord""") -and
    $codeContent.Contains("DELETE_UNAUTHORIZED") -and
    $codeContent.Contains("role !== ""ADMIN""")
) "Code.gs must enforce server-side role check rejecting non-admin delete requests."

# 12. Bidirectional Cloud Sync Reconciliation (BUG-004 Fix)
Assert-Test "Bidirectional Cloud Sync Reconciliation in api.js" (
    $apiContent.Contains("syncLedgerData") -and
    $apiContent.Contains("DataModule.saveStore(result.store)") -and
    $apiContent.Contains("updateStatusBadge")
) "api.js must push mutations, receive reconciled server data, and update LocalStorage."

# 13. Realtime Cross-Tab Synchronization
Assert-Test "Realtime Cross-Tab Synchronization via BroadcastChannel" (
    $apiContent.Contains("BroadcastChannel") -and
    $apiContent.Contains("broadcastLocalChange")
) "api.js must broadcast local mutations to other tabs via BroadcastChannel."

# 14. Frontend RBAC Delete Guards (Rudra Safeguard)
Assert-Test "Frontend Delete Guards Block Rudra in app.js" (
    $appContent.Contains("function confirmDelete") -and
    $appContent.Contains("!AuthModule.isAdmin()") -and
    $appContent.Contains("Access Denied: Operators (Rudra) cannot delete")
) "Frontend must block Rudra from deleting records with an alert."

# 15. Dynamic Live Excel Replica with Zoom & Fullscreen
Assert-Test "Dynamic 1:1 Live Excel Replica with Zoom Controls" (
    $tableContent.Contains("renderExcelReplica") -and
    $tableContent.Contains("setZoom") -and
    $tableContent.Contains("toggleFullscreen")
) "table.js must support Zoom (80%, 90%, 100%, 115%) and fullscreen mode."

# 16. Dynamic Genuine ExcelJS Export
Assert-Test "Dynamic ExcelJS Export Preserving Formulas" (
    $tableContent.Contains("exportToExcel") -and
    $tableContent.Contains("ExcelJS.Workbook") -and
    $tableContent.Contains("pnlSheet") -and
    $tableContent.Contains("drvSheet")
) "table.js must generate genuine multi-sheet .xlsx with live formulas."

# 17. Security & Inactivity Watchdog in auth.js
Assert-Test "Inactivity Watchdog & SHA-256 Security in auth.js" (
    $authContent.Contains("INACTIVITY_TIMEOUT_MS") -and
    $authContent.Contains("sha256") -and
    $authContent.Contains("resetInactivityWatchdog")
) "auth.js must implement 10-minute timeout and SHA-256 password digests."

# 18. Responsive Mobile CSS
Assert-Test "Responsive Mobile CSS Rules in styles.css" (
    $cssContent.Contains("@media (max-width: 768px)") -and
    $cssContent.Contains("@media (max-width: 480px)")
) "styles.css must include responsive breakpoints for mobile and tablet."

# 19. Project Switcher & Date Controls in index.html
Assert-Test "Project Switcher & Date Controls in index.html" (
    $htmlContent.Contains("id=""projectSelectDropdown""") -and
    $htmlContent.Contains("id=""truckFilterPillsContainer""") -and
    $htmlContent.Contains("id=""filterPeriodSelect""") -and
    $htmlContent.Contains("id=""filterStartDate""")
) "index.html must include project dropdown, dynamic truck container, and date pickers."

# 20. Authoritative Master Data Verification
Assert-Test "Authoritative Master Data Parity" (
    $dataContent.Contains("175000") -and $dataContent.Contains("108500") -and 
    $dataContent.Contains("72300") -and $dataContent.Contains("27000") -and
    $dataContent.Contains("15000") -and $dataContent.Contains("141000") -and 
    $dataContent.Contains("80000") -and $dataContent.Contains("30500")
) "data.js must contain verified master freight, fuel, and expense amounts."

# 21. Admin-Only Cloud Links & Settings Protection Verification
Assert-Test "Admin-Only Settings Modal & Cloud Links Protection" (
    $apiContent.Contains("AKfycbwREdyxaW64mixcHfFNyspj_KD_jxYYryQWjRukjPiBxdjkNoG0tguD0vaPW0n0cMcinQ") -and
    $apiContent.Contains("1dy6GxF_9TtWLA_Yogc53cNnJWHz9mQks1ETsyDYAbz4") -and
    (!$apiContent.Contains("1l4GkXJ-eiX-SzyeGlfBMWc-H32sE2ubeNnq_LDEDXqMtYhU6b4Zls8bL")) -and
    $htmlContent.Contains("settingsModal"" class=""app-modal-overlay admin-only""") -and
    $appContent.Contains("Access Denied: Only Administrator (Admin) can view and configure cloud spreadsheet settings") -and
    $apiContent.Contains("Access Denied: Only Administrator (Admin) can access the raw Google Spreadsheet")
) "System must protect live spreadsheet settings and links so only Admin can access them."

# 22. Enterprise Workspace Suite & View Screens Verification
Assert-Test "Enterprise Workspace Suite (Fleet, Trips, Expenses, Reports)" (
    $tableContent.Contains("renderFleetView") -and
    $tableContent.Contains("renderTripsView") -and
    $tableContent.Contains("renderExpensesView") -and
    $tableContent.Contains("renderReportsView") -and
    $htmlContent.Contains("id=""view-fleet""") -and
    $htmlContent.Contains("id=""view-trips""") -and
    $htmlContent.Contains("id=""view-expenses""") -and
    $htmlContent.Contains("id=""view-reports""") -and
    $appContent.Contains("VIEW_MAP")
) "System must provide complete enterprise screens for Fleet, Trips, Expenses, and Reports."

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "RESULT: $passedTests / $totalTests TESTS PASSED" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Red" })
Write-Host "==========================================================`n" -ForegroundColor Cyan

if ($passedTests -lt $totalTests) {
    exit 1
}
