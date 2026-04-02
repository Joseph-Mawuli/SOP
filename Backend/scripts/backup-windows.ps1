# Windows PostgreSQL Database Backup Script
# This script backs up the POS system database to a compressed zip file
# Uses .pgpass file for secure password storage
# Location: %APPDATA%\postgresql\pgpass.conf
# Format: localhost:5432:pos_system:postgres:PASSWORD
#
# Usage: powershell -ExecutionPolicy Bypass -File backup-windows.ps1

param(
    [string]$Database  = "pos_system",
    [string]$DBUser    = "postgres",
    [string]$DBServer  = "localhost",
    [string]$BackupDir = $(
        if ($PSScriptRoot) {
            Join-Path -Path $PSScriptRoot -ChildPath "..\backups"
        } else {
            Join-Path -Path $PWD -ChildPath "..\backups"
        }
    )
)

# Variables
$PostgresqlPath = "C:\Program Files\PostgreSQL\17\bin"
$pgpassPath     = "$env:APPDATA\postgresql\pgpass.conf"
$Date           = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFileName = "backup_${Database}_${Date}.sql"
$BackupFilePath = Join-Path $BackupDir $BackupFileName
$ZipFileName    = "backup_${Database}_${Date}.zip"
$ZipFilePath    = Join-Path $BackupDir $ZipFileName

# Create backup directory if it does not exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    Write-Host "Created backup directory: $BackupDir"
}

# Wrap all logic in a function so we can use return instead of exit.
# Using bare exit in a script kills the shell if the script is dot-sourced.
function Invoke-Backup {

    # Verify .pgpass file exists
    if (-not (Test-Path $pgpassPath)) {
        Write-Host "ERROR: .pgpass file not found at: $pgpassPath" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please create the .pgpass file first:" -ForegroundColor Yellow
        Write-Host "  1. Create directory: $($env:APPDATA)\postgresql"
        Write-Host "  2. Create file:      $pgpassPath"
        Write-Host "  3. Add this line (no spaces around colons):"
        Write-Host "     localhost:5432:pos_system:postgres:YOUR_PASSWORD"
        return 1
    }

    # Set PGPASSFILE explicitly so pg_dump always picks it up on Windows
    $env:PGPASSFILE = $pgpassPath

    # Run backup (plain SQL format so we can zip it afterwards)
    Write-Host "Starting backup of database: $Database"
    Write-Host "Backup file: $BackupFilePath"

    & "$PostgresqlPath\pg_dump.exe" -h $DBServer -U $DBUser -d $Database -b -v -f $BackupFilePath

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backup completed successfully!" -ForegroundColor Green

        # Compress backup into a .zip file
        Write-Host "Compressing backup..."
        $compress = @{
            Path             = $BackupFilePath
            CompressionLevel = "Optimal"
            DestinationPath  = $ZipFilePath
        }
        Compress-Archive @compress

        # Remove uncompressed SQL file
        Remove-Item $BackupFilePath -Force
        Write-Host "Compressed backup: $ZipFilePath"

        # Verify the zip was actually created before reporting size
        if (Test-Path $ZipFilePath) {
            $sizeMB = [math]::Round((Get-Item $ZipFilePath).Length / 1MB, 2)
            Write-Host "Size: $sizeMB MB"
        } else {
            Write-Host "WARNING: Compressed file not found after compression step!" -ForegroundColor Yellow
        }

        # Clean up old backups (older than 30 days)
        Write-Host "Cleaning up old backups..."
        $CutoffDate = (Get-Date).AddDays(-30)
        Get-ChildItem "$BackupDir\backup_*.zip" -File |
            Where-Object { $_.LastWriteTime -lt $CutoffDate } |
            Remove-Item -Force

        Write-Host ""
        Write-Host "Backup process completed successfully!" -ForegroundColor Green
        Write-Host "Backup location: $ZipFilePath"
        return 0

    } else {
        Write-Host "Backup failed! Exit code: $LASTEXITCODE" -ForegroundColor Red

        # Clean up any partial backup file left behind
        if (Test-Path $BackupFilePath) {
            Remove-Item $BackupFilePath -Force
            Write-Host "Removed partial backup file." -ForegroundColor Yellow
        }

        return 1
    }
}

# Run the backup function and capture its exit code
$BackupExitCode = Invoke-Backup
exit $BackupExitCode