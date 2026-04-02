# Automated Windows PostgreSQL Database Backup Script (Task Scheduler Compatible)
# Uses .pgpass file for secure password storage (recommended)
# Location: %APPDATA%\postgresql\pgpass.conf
# Format: localhost:5432:pos_system:postgres:PASSWORD

param(
    [string]$Database     = "pos_system",
    [string]$DBUser       = "postgres",
    [string]$DBServer     = "localhost",
    [string]$BackupDir    = "C:\Users\JOSEPH\Desktop\SOP\Backend\backups",
    [string]$PostgresPath = "C:\Program Files\PostgreSQL\17\bin"
)

# ── Logging function ──
function Write-Log {
    param([string]$Message)
    $Timestamp  = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path "$BackupDir\backup.log" -Value $LogMessage -ErrorAction SilentlyContinue
}

# ── Wrap all logic in a function to avoid bare exit killing the shell ──
function Invoke-ScheduledBackup {

    # Create backup directory if needed
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
        Write-Log "Created backup directory: $BackupDir"
    }

    # Check PostgreSQL bin path
    if (-not (Test-Path "$PostgresPath\pg_dump.exe")) {
        Write-Log "ERROR: pg_dump.exe not found at: $PostgresPath"
        $script:ExitCode = 1
        return
    }

    # Verify .pgpass file exists
    $pgpassPath = "$env:APPDATA\postgresql\pgpass.conf"
    if (-not (Test-Path $pgpassPath)) {
        Write-Log "ERROR: .pgpass file not found at: $pgpassPath"
        Write-Log "Create it with: localhost:5432:pos_system:postgres:PASSWORD"
        $script:ExitCode = 1
        return
    }

    # Set PGPASSFILE explicitly so pg_dump always picks it up on Windows
    $env:PGPASSFILE = $pgpassPath

    # Build file paths — use .zip not .gz since we use Compress-Archive
    $Date           = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFileName = "backup_${Database}_${Date}.sql"
    $BackupFilePath = Join-Path $BackupDir $BackupFileName
    $ZipFilePath    = "$BackupFilePath.zip"

    Write-Log "Starting backup of database: $Database"
    Write-Log "Backup file: $BackupFilePath"

    # Run pg_dump in plain SQL format (required for Compress-Archive to work on it)
    # Removed -F c (custom binary format) — it conflicts with zip compression
    # Removed 2>$null so errors are captured in the log instead of silently dropped
    try {
        $pgDumpOutput = & "$PostgresPath\pg_dump.exe" -h $DBServer -U $DBUser -d $Database -b -f $BackupFilePath 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Log "ERROR: pg_dump failed with exit code: $LASTEXITCODE"
            Write-Log "pg_dump output: $pgDumpOutput"
            $script:ExitCode = 1
            return
        }

        Write-Log "Backup created: $BackupFileName"

        # Compress backup into a .zip file
        Write-Log "Compressing backup..."
        Compress-Archive -Path $BackupFilePath -DestinationPath $ZipFilePath -CompressionLevel Optimal -Force

        # Remove uncompressed SQL file
        Remove-Item $BackupFilePath -Force -ErrorAction SilentlyContinue

        # Verify zip exists before reading size
        if (Test-Path $ZipFilePath) {
            $FileSizeMB = [math]::Round((Get-Item $ZipFilePath).Length / 1MB, 2)
            Write-Log "Backup compressed successfully: ${FileSizeMB} MB"
        } else {
            Write-Log "WARNING: Zip file not found after compression step."
        }

        # Cleanup old backups (older than 30 days)
        # Pattern updated from *.sql.gz to *.sql.zip to match actual output
        Write-Log "Cleaning up old backups..."
        $CutoffDate  = (Get-Date).AddDays(-30)
        $DeletedCount = 0

        Get-ChildItem "$BackupDir\backup_*.sql.zip" -File -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTime -lt $CutoffDate } |
            ForEach-Object {
                Remove-Item $_.FullName -Force
                $DeletedCount++
                Write-Log "Deleted old backup: $($_.Name)"
            }

        Write-Log "Cleanup complete. Deleted $DeletedCount old backup(s)"
        Write-Log "Backup process completed successfully!"
        Write-Log "Location: $ZipFilePath"
        $script:ExitCode = 0

    } catch {
        Write-Log "ERROR: Backup process failed: $_"
        # Clean up partial files if they exist
        if (Test-Path $BackupFilePath) { Remove-Item $BackupFilePath -Force -ErrorAction SilentlyContinue }
        if (Test-Path $ZipFilePath)    { Remove-Item $ZipFilePath    -Force -ErrorAction SilentlyContinue }
        $script:ExitCode = 1
    }
}

# ── Run and propagate exit code to Task Scheduler ──
$script:ExitCode = 0
Invoke-ScheduledBackup
exit $script:ExitCode