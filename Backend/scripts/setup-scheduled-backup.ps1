# Setup Automated Daily Backups on Windows
# This script creates a scheduled task in Windows Task Scheduler
# IMPORTANT: Before running this, create a .pgpass file for secure password storage
#
# Usage: powershell -ExecutionPolicy Bypass -File setup-scheduled-backup.ps1

# ── Configuration ──
$TaskName        = "POS_System_Daily_Backup"
$TaskDescription = "Automated daily backup of POS system database"
$BackupScriptPath = "C:\Users\JOSEPH\Desktop\SOP\Backend\scripts\backup-windows.ps1"
$BackupTime      = "02:00"   # Task Scheduler expects HH:mm, not HH:mm:ss

# .pgpass file configuration
$pgpassDir  = "$env:APPDATA\postgresql"
$pgpassPath = "$pgpassDir\pgpass.conf"

# ── Wrap logic in a function to safely use return instead of bare exit ──
function Invoke-ScheduleSetup {

    # Verify backup script exists
    if (-not (Test-Path $BackupScriptPath)) {
        Write-Host "ERROR: Backup script not found at: $BackupScriptPath" -ForegroundColor Red
        Write-Host "Please check the path and try again." -ForegroundColor Yellow
        $script:ExitCode = 1
        return
    }

    # Verify .pgpass file exists before creating the task
    if (-not (Test-Path $pgpassPath)) {
        Write-Host "ERROR: .pgpass file not found at: $pgpassPath" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please create the .pgpass file first:" -ForegroundColor Yellow
        Write-Host "  1. Create directory: $pgpassDir"
        Write-Host "  2. Create file:      $pgpassPath"
        Write-Host "  3. Add this line (no spaces around colons):"
        Write-Host "     localhost:5432:pos_system:postgres:YOUR_PASSWORD"
        Write-Host "  4. Lock down permissions:"
        Write-Host "     icacls `"$pgpassPath`" /inheritance:r /grant:r `"%USERNAME%:F`""
        Write-Host "  5. Then run this script again."
        $script:ExitCode = 1
        return
    }

    # Remove existing task if it already exists
    $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($ExistingTask) {
        Write-Host "Task '$TaskName' already exists. Removing..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }

    # Create task action — runs the backup script silently via PowerShell
    $Action = New-ScheduledTaskAction `
        -Execute "PowerShell.exe" `
        -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$BackupScriptPath`""

    # Create task trigger — daily at the configured time
    $Trigger = New-ScheduledTaskTrigger `
        -Daily `
        -At $BackupTime

    # Create task settings
    $Settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable `
        -ExecutionTimeLimit (New-TimeSpan -Hours 1)  # Kill the task if it runs over 1 hour

    # Run as SYSTEM so it works even when no user is logged in
    # NOTE: SYSTEM account does not use the user-level .pgpass file.
    # The backup script sets $env:PGPASSFILE explicitly, which handles this.
    $Principal = New-ScheduledTaskPrincipal `
        -UserID "NT AUTHORITY\SYSTEM" `
        -LogonType ServiceAccount `
        -RunLevel Highest

    Write-Host "Creating scheduled task: $TaskName" -ForegroundColor Cyan

    Register-ScheduledTask `
        -TaskName    $TaskName `
        -Action      $Action `
        -Trigger     $Trigger `
        -Settings    $Settings `
        -Principal   $Principal `
        -Description $TaskDescription `
        -Force | Out-Null

    if ($?) {
        Write-Host ""
        Write-Host "Scheduled task created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Task Details:" -ForegroundColor Cyan
        Write-Host "  Name:             $TaskName"
        Write-Host "  Schedule:         Daily at $BackupTime"
        Write-Host "  Script:           $BackupScriptPath"
        Write-Host "  Backups location: C:\Users\JOSEPH\Desktop\SOP\Backend\backups\"
        Write-Host "  Retention:        30 days"
        Write-Host "  Max runtime:      1 hour"
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Yellow
        Write-Host "  1. Test the backup manually:"
        Write-Host "     PowerShell -ExecutionPolicy Bypass -File `"$BackupScriptPath`""
        Write-Host "  2. Or trigger the scheduled task immediately:"
        Write-Host "     Start-ScheduledTask -TaskName '$TaskName'"
        Write-Host ""
        Write-Host "Useful commands:" -ForegroundColor Cyan
        Write-Host "  Verify task:   Get-ScheduledTask -TaskName '$TaskName' | Select-Object *"
        Write-Host "  Run now:       Start-ScheduledTask -TaskName '$TaskName'"
        Write-Host "  Disable task:  Disable-ScheduledTask -TaskName '$TaskName'"
        Write-Host "  Remove task:   Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
        $script:ExitCode = 0
    } else {
        Write-Host "ERROR: Failed to register the scheduled task." -ForegroundColor Red
        $script:ExitCode = 1
    }
}

# ── Run and propagate exit code ──
$script:ExitCode = 0
Invoke-ScheduleSetup
exit $script:ExitCode