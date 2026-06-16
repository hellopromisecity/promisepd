<#
  Registers a Windows scheduled task that runs backup-supabase.ps1 every day.
  Run this ONCE, in a normal (non-admin is fine) PowerShell window:

      powershell -ExecutionPolicy Bypass -File scripts\register-backup-task.ps1

  Change $At below if you want a different time. Re-running updates the task.
#>

$ErrorActionPreference = "Stop"

$TaskName = "PromiseCity Supabase Backup"
$Script   = Join-Path $PSScriptRoot "backup-supabase.ps1"
$At       = "02:00"   # daily run time (24h). Missed runs catch up when the PC next turns on.

if (-not (Test-Path $Script)) { throw "backup-supabase.ps1 not found next to this script." }
$pwsh = (Get-Command powershell.exe).Source

$action   = New-ScheduledTaskAction -Execute $pwsh -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Script`""
$trigger  = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -Description "Daily Supabase logical backup (.sql.gz) for PromiseCity" -Force | Out-Null

Write-Host "OK - registered '$TaskName' to run daily at $At."
Write-Host ""
Write-Host "Test it right now with:"
Write-Host "    Start-ScheduledTask -TaskName `"$TaskName`""
Write-Host "Then check your backups in:"
Write-Host "    $env:USERPROFILE\Downloads\backup\promisecity-supabase\daily"
