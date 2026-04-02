#!/usr/bin/env powershell
# Setup .pgpass file for secure PostgreSQL authentication
# This creates the necessary directories and file with proper permissions

param(
    [string]$Database = "pos_system",
    [string]$Host = "localhost",
    [int]$Port = 5432,
    [string]$User = "postgres"
)

# Get password securely
Write-Host "PostgreSQL .pgpass Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: $Database" -ForegroundColor Green
Write-Host "Host: $Host" -ForegroundColor Green
Write-Host "Port: $Port" -ForegroundColor Green
Write-Host "User: $User" -ForegroundColor Green
Write-Host ""

$password = Read-Host "Enter PostgreSQL password for user '$User'" -AsSecureString
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($password))

# Create .pgpass directory if it doesn't exist
$pgpassDir = "$env:APPDATA\postgresql"
if (-not (Test-Path $pgpassDir)) {
    Write-Host "Creating directory: $pgpassDir"
    New-Item -ItemType Directory -Force -Path $pgpassDir | Out-Null
}

# Create .pgpass file
$pgpassPath = "$pgpassDir\pgpass.conf"
$pgpassContent = "$Host`:$Port`:$Database`:$User`:$plainPassword"

Write-Host "Creating .pgpass file at: $pgpassPath"
Set-Content -Path $pgpassPath -Value $pgpassContent -Force

# Set file permissions (owner read-only)
Write-Host "Setting file permissions..."
icacls "$pgpassPath" /inheritance:r /grant:r "$env:USERNAME`:F" | Out-Null

# Verify
if (Test-Path $pgpassPath) {
    Write-Host ""
    Write-Host "✓ .pgpass file created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host ".pgpass location: $pgpassPath"
    Write-Host "Permissions: Owner (Read/Write), Others (None)"
    Write-Host ""
    Write-Host "You can now run the backup scripts:" -ForegroundColor Cyan
    Write-Host "  - PowerShell -ExecutionPolicy Bypass -File backup-windows.ps1"
    Write-Host "  - PowerShell -ExecutionPolicy Bypass -File setup-scheduled-backup.ps1"
} else {
    Write-Host "ERROR: Failed to create .pgpass file" -ForegroundColor Red
    exit 1
}

# Clean up plainPassword from memory
$plainPassword = $null
$password = $null
