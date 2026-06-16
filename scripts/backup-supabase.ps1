<#
  Thin wrapper so the Windows scheduled task has a stable entry point.
  All the real work (dump every table -> gzip JSON -> daily/weekly/monthly
  rotation) lives in backup-supabase.mjs and runs on Node — no Docker or
  PostgreSQL install needed. See scripts/BACKUP.md.
#>
$ErrorActionPreference = "Stop"
$mjs  = Join-Path $PSScriptRoot "backup-supabase.mjs"
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { Write-Error "Node.js not found in PATH — install Node or add it to PATH."; exit 1 }
if (-not (Test-Path $mjs)) { Write-Error "backup-supabase.mjs not found next to this script."; exit 1 }
& $node $mjs
exit $LASTEXITCODE
