<#
  PromiseCity — Supabase daily backup with daily / weekly / monthly rotation.

  Produces ONE  promisecity-YYYYMMDD-HHMMSS.sql.gz  per run (schema + data of
  the public schema), exactly like the old admin.promisepd.com .sql.gz backups.

  It reads the database connection string from  .env.local  (key SUPABASE_DB_URL)
  so NO password is ever stored in this script or printed to the log.

  Dumping uses the Supabase CLI via `npx supabase db dump`, which bundles a
  matching pg_dump — so you do NOT need to install PostgreSQL separately.

  One-time setup + scheduling: see  scripts/BACKUP.md
#>

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression | Out-Null

# ---- settings (safe to edit) -------------------------------------------------
$BackupRoot  = Join-Path $env:USERPROFILE "Downloads\backup\promisecity-supabase"
$KeepDaily   = 14   # keep last 14 daily dumps
$KeepWeekly  = 8    # keep last 8 weekly dumps
$KeepMonthly = 12   # keep last 12 monthly dumps
$MinBytes    = 2048 # a real dump is far bigger; smaller = treat as failure
# -----------------------------------------------------------------------------

$RepoDir = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $RepoDir ".env.local"

function Write-Log($msg) {
  $line = "{0}  {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Write-Host $line
  if ($script:LogFile) { Add-Content -Path $script:LogFile -Value $line }
}

function Compress-Gzip($srcPath, $dstPath) {
  $in  = [System.IO.File]::OpenRead($srcPath)
  $out = [System.IO.File]::Create($dstPath)
  $gz  = New-Object System.IO.Compression.GzipStream($out, [System.IO.Compression.CompressionLevel]::Optimal)
  try { $in.CopyTo($gz) } finally { $gz.Dispose(); $out.Dispose(); $in.Dispose() }
}

function Prune-Dir($dir, $keep) {
  Get-ChildItem -Path $dir -Filter "*.sql.gz" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip $keep |
    ForEach-Object { Remove-Item $_.FullName -Force; Write-Log "pruned $($_.Name)" }
}

# ---- read SUPABASE_DB_URL from .env.local (never logged) ---------------------
if (-not (Test-Path $EnvFile)) { throw ".env.local not found at $EnvFile" }
$DbUrl = $null
foreach ($l in Get-Content $EnvFile) {
  if ($l -match '^\s*SUPABASE_DB_URL\s*=\s*(.+?)\s*$') {
    $DbUrl = $matches[1].Trim().Trim('"').Trim("'")
  }
}
if ([string]::IsNullOrWhiteSpace($DbUrl)) {
  throw "SUPABASE_DB_URL is not set in .env.local. Add the Session-pooler connection string from Supabase (Project Settings > Database > Connection string > Session mode). See scripts/BACKUP.md."
}

# ---- folders -----------------------------------------------------------------
$Daily   = Join-Path $BackupRoot "daily"
$Weekly  = Join-Path $BackupRoot "weekly"
$Monthly = Join-Path $BackupRoot "monthly"
$Last    = Join-Path $BackupRoot "last"
$Logs    = Join-Path $BackupRoot "logs"
foreach ($d in @($BackupRoot,$Daily,$Weekly,$Monthly,$Last,$Logs)) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
}

$Stamp        = Get-Date -Format "yyyyMMdd-HHmmss"
$script:LogFile = Join-Path $Logs ("backup-" + (Get-Date -Format "yyyyMM") + ".log")

$Tmp = Join-Path $env:TEMP ("pcbk-" + $Stamp)
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
$SchemaSql = Join-Path $Tmp "schema.sql"
$DataSql   = Join-Path $Tmp "data.sql"
$Combined  = Join-Path $Tmp "combined.sql"

try {
  Write-Log "=== backup start ($Stamp) ==="

  # 1. schema (DDL: tables, indexes, RLS policies, functions, triggers)
  Write-Log "dumping schema..."
  & npx --yes supabase db dump --db-url $DbUrl -f $SchemaSql
  if ($LASTEXITCODE -ne 0) { throw "schema dump failed (exit $LASTEXITCODE)" }

  # 2. data (rows, via COPY for speed/size)
  Write-Log "dumping data..."
  & npx --yes supabase db dump --db-url $DbUrl --data-only --use-copy -f $DataSql
  if ($LASTEXITCODE -ne 0) { throw "data dump failed (exit $LASTEXITCODE)" }

  # 3. combine schema + data into one restorable file
  $head = "-- PromiseCity Supabase backup`r`n-- created: $(Get-Date -Format s)`r`n-- contents: public schema (DDL) followed by data`r`n`r`n"
  Set-Content -Path $Combined -Value $head -Encoding UTF8
  Get-Content -Path $SchemaSql -ErrorAction Stop | Add-Content -Path $Combined -Encoding UTF8
  Add-Content -Path $Combined -Value "`r`n`r`n-- ============================ DATA ============================`r`n" -Encoding UTF8
  Get-Content -Path $DataSql -ErrorAction Stop | Add-Content -Path $Combined -Encoding UTF8

  $srcBytes = (Get-Item $Combined).Length
  if ($srcBytes -lt $MinBytes) { throw "combined dump only $srcBytes bytes - looks empty, aborting (NOT overwriting good backups)" }

  # 4. gzip -> daily/ and refresh last/latest
  $OutName = "promisecity-$Stamp.sql.gz"
  $OutPath = Join-Path $Daily $OutName
  Compress-Gzip $Combined $OutPath
  Copy-Item $OutPath (Join-Path $Last "promisecity-latest.sql.gz") -Force
  $gzKB  = [math]::Round((Get-Item $OutPath).Length / 1KB, 1)
  $srcKB = [math]::Round($srcBytes / 1KB, 1)
  Write-Log "wrote daily/$OutName  ($gzKB KB gz, $srcKB KB raw)"

  # 5. promote the first dump of each week / month
  $cal     = [System.Globalization.CultureInfo]::InvariantCulture.Calendar
  $weekNo  = $cal.GetWeekOfYear((Get-Date), [System.Globalization.CalendarWeekRule]::FirstFourDayWeek, [System.DayOfWeek]::Monday)
  $weekTag = "{0}-W{1:D2}" -f (Get-Date).Year, $weekNo
  $weeklyTarget = Join-Path $Weekly "promisecity-$weekTag.sql.gz"
  if (-not (Test-Path $weeklyTarget)) { Copy-Item $OutPath $weeklyTarget -Force; Write-Log "weekly snapshot $weekTag" }

  $monthTag = Get-Date -Format "yyyyMM"
  $monthlyTarget = Join-Path $Monthly "promisecity-$monthTag.sql.gz"
  if (-not (Test-Path $monthlyTarget)) { Copy-Item $OutPath $monthlyTarget -Force; Write-Log "monthly snapshot $monthTag" }

  # 6. prune old dumps
  Prune-Dir $Daily   $KeepDaily
  Prune-Dir $Weekly  $KeepWeekly
  Prune-Dir $Monthly $KeepMonthly

  Write-Log "=== backup OK ==="
}
catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}
finally {
  Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
}
