# =========================================================================
# 🚚 TRANSPORT BROKERAGE LEDGER (P2) - AUTOMATED VERIFICATION SUITE
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
Write-Host "TRANSPORT BROKERAGE LEDGER (P2) AUTOMATED VERIFICATION SUITE" -ForegroundColor Cyan
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

# 2. Test Backend LockService Concurrency Guard
Assert-Test "LockService Concurrency Guard in Code.gs" (
    $codeContent.Contains("LockService.getScriptLock()") -and
    $codeContent.Contains("lock.waitLock(30000)") -and
    $codeContent.Contains("lock.releaseLock()")
) "Code.gs must acquire and release 30s ScriptLock on mutations."

# 3. Test Metadata & DATA_VERSION Management in Code.gs
Assert-Test "Metadata & DATA_VERSION Tracking in Code.gs" (
    $codeContent.Contains("SHEET_META") -and
    $codeContent.Contains("getDataVersion") -and
    $codeContent.Contains("incrementDataVersion") -and
    $codeContent.Contains("action === ""getVersion""")
) "Code.gs must maintain _Meta sheet, getDataVersion, and incrementDataVersion."

# 4. Test Lightweight Version Polling Endpoint in Backend
Assert-Test "Lightweight Version Polling Endpoint in Code.gs" (
    $codeContent.Contains("action === ""getVersion""") -and
    $codeContent.Contains("version: currentVersion")
) "doGet must support fast 'getVersion' action returning version and lastUpdated."

# 5. Test Central Recalculation Engine in Backend
Assert-Test "Central Recalculation Engine in Code.gs" (
    $codeContent.Contains("function recalculateFinancials(ss)") -and
    $codeContent.Contains("function calculateSummary(ss, transport, advances)") -and
    $codeContent.Contains("function calculateTransportRow(item)")
) "Code.gs must have central recalculateFinancials, calculateSummary, and calculateTransportRow."

# 6. Test Admin vs Rudra Permission Enforcement in Backend
Assert-Test "Backend Delete Security Guard (userCanDelete)" (
    $codeContent.Contains("function userCanDelete(envelope)") -and
    $codeContent.Contains("user === ""rudra""") -and
    $codeContent.Contains("DELETE_NOT_ALLOWED")
) "Code.gs must reject delete requests from Rudra with DELETE_NOT_ALLOWED."

# 7. Test Admin-Only Dataset Restore Guard in Backend
Assert-Test "Backend Restore Security Guard & Safety Backup" (
    $codeContent.Contains("action === ""restoreFullDataset""") -and
    $codeContent.Contains("RESTORE_NOT_ALLOWED") -and
    $codeContent.Contains("createCloudBackup(ss, ""Pre-Restore-Safety-Backup"")")
) "Code.gs must create safety backup and verify Admin permissions before restore."

# 8. Test DataModule Full CRUD Capabilities
Assert-Test "DataModule Full CRUD API (Add, Update, Delete for all types)" (
    $dataContent.Contains("addTrip") -and $dataContent.Contains("updateTrip") -and $dataContent.Contains("deleteTrip") -and
    $dataContent.Contains("addDiesel") -and $dataContent.Contains("updateDiesel") -and $dataContent.Contains("deleteDiesel") -and
    $dataContent.Contains("addAdvance") -and $dataContent.Contains("updateAdvance") -and $dataContent.Contains("deleteAdvance") -and
    $dataContent.Contains("addExpense") -and $dataContent.Contains("updateExpense") -and $dataContent.Contains("deleteExpense") -and
    $dataContent.Contains("findRecord")
) "data.js must export add, update, delete, and findRecord for trip, diesel, advance, and expense."

# 9. Test Frontend Delete Security Blocks Rudra
Assert-Test "Frontend Delete Guards Block Rudra in app.js" (
    $appContent.Contains("confirmDelete") -and
    $appContent.Contains("!AuthModule.isAdmin()") -and
    $appContent.Contains("Rudra can add and edit records but cannot delete them.")
) "app.js confirmDelete must prevent Rudra from deleting records."

# 10. Test Frontend Edit Modal & CRUD Workflows in app.js
Assert-Test "Edit Modal & Save Workflow in app.js" (
    $appContent.Contains("openEditModal") -and
    $appContent.Contains("isEditing") -and
    $appContent.Contains("editingRecordId") -and
    $appContent.Contains("saveModalEntry")
) "app.js must support openEditModal and update existing records in saveModalEntry."

# 11. Test Realtime Cross-Tab BroadcastChannel & Version Polling in api.js
Assert-Test "Realtime Cross-Tab Synchronization in api.js" (
    $apiContent.Contains("BroadcastChannel") -and
    $apiContent.Contains("sr_transport_sync_channel") -and
    $apiContent.Contains("checkCloudVersionAndSync") -and
    $apiContent.Contains("getDataVersion") -and
    $apiContent.Contains("incrementDataVersion")
) "api.js must implement BroadcastChannel cross-tab sync and DATA_VERSION tracking."

# 12. Test Dynamic 1:1 Live Excel Replica in table.js (No Static Hardcoding)
Assert-Test "Dynamic 1:1 Live Excel Replica Rendering in table.js" (
    $tableContent.Contains("renderExcelReplica") -and
    $tableContent.Contains("renderPnlReplicaSheet") -and
    $tableContent.Contains("renderDriverReplicaSheet") -and
    $tableContent.Contains("trips6666.map") -or $tableContent.Contains("for (let i = 0; i < maxTrips; i++)") -and
    $tableContent.Contains("AppModule.openEditModal")
) "table.js must dynamically render spreadsheet rows from state and allow click-to-edit."

# 13. Test Genuine Dynamic ExcelJS Export with Formula Preservation
Assert-Test "Dynamic ExcelJS Export in table.js" (
    $tableContent.Contains("exportToExcel") -and
    $tableContent.Contains("new ExcelJS.Workbook()") -and
    $tableContent.Contains("1122_6666_P&L Account") -and
    $tableContent.Contains("1122_6666_Driver") -and
    $tableContent.Contains("workbook.xlsx.writeBuffer()")
) "table.js exportToExcel must construct multi-sheet ExcelJS workbook with dynamic rows and formulas."

# 14. Test Inactivity Watchdog & SHA-256 Security in auth.js
Assert-Test "Inactivity Watchdog & SHA-256 Security in auth.js" (
    $authContent.Contains("INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000") -and
    $authContent.Contains("crypto.subtle.digest('SHA-256'") -and
    $authContent.Contains("updatePassword")
) "auth.js must enforce 10-minute timeout, SHA-256 hashing, and support password updates."

# 15. Test Mathematical Calculation Engine Parity
Assert-Test "Authoritative Mathematical Engine in calculations.js" (
    $calcContent.Contains("calculateTruckPnl") -and
    $calcContent.Contains("calculateDriverSettlement") -and
    $calcContent.Contains("calculateCombinedFleet") -and
    $calcContent.Contains("formatINR")
) "calculations.js must evaluate 12% commission, P1-P2 net profit, and driver balances."

# 16. Test Fullscreen & Zoom Scaling Controls
Assert-Test "Fullscreen Mode & Zoom Controls Integration" (
    $tableContent.Contains("toggleFullscreen") -and
    $tableContent.Contains("setZoom") -and
    $cssContent.Contains(".sheet-fullscreen-mode") -and
    $htmlContent.Contains("changePasswordModal")
) "Fullscreen mode, zoom controls, and Change Password modal must be integrated."

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "RESULT: $passedTests / $totalTests TESTS PASSED" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Red" })
Write-Host "==========================================================`n" -ForegroundColor Cyan

if ($passedTests -ne $totalTests) {
    exit 1
} else {
    exit 0
}

