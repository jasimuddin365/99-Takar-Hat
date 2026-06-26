# Restart the 99 Taka Bazaar backend with the rewritten route files.
# 1. Kills any node process holding port 5000.
# 2. Starts node src/server.js from the backend/ directory.
# 3. Tails server.log so you can see boot + incoming requests.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$backend = Join-Path $root 'backend'
$log = Join-Path $backend 'server.log'

Set-Location $backend

Write-Host '== Killing any process holding port 5000 ==' -ForegroundColor Cyan
$portOwner = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess |
  Where-Object { $_ -ne $null -and $_ -ne 0 } | Select-Object -First 1
if ($portOwner) {
  Write-Host "  Killing PID $portOwner"
  Stop-Process -Id $portOwner -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1
}

# Also kill any leftover node src/server.js that might be holding the port without netstat visibility.
Get-Process node -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -like '*node*' -and $_.MainWindowTitle -eq '' } |
  ForEach-Object {
    $cmdline = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    if ($cmdline -like '*src/server.js*') {
      Write-Host "  Killing leftover node server PID $($_.Id)"
      Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
  }

Write-Host '== Starting node src/server.js ==' -ForegroundColor Cyan
$env:DATABASE_URL = 'postgresql://postgres:1234@localhost:5432/Ninety_Nine?schema=public'
$env:PORT = '5000'
$env:NODE_ENV = 'development'

if (Test-Path $log) { Remove-Item $log -Force }

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'node'
$psi.Arguments = 'src/server.js'
$psi.WorkingDirectory = $backend
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true

$proc = [System.Diagnostics.Process]::Start($psi)
Write-Host "  Started backend as PID $($proc.Id)" -ForegroundColor Green

Write-Host '== Waiting for /api/health to respond ==' -ForegroundColor Cyan
$deadline = (Get-Date).AddSeconds(15)
while ((Get-Date) -lt $deadline) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5000/api/health' -TimeoutSec 2
    Write-Host "  HEALTH $($r.StatusCode): $($r.Content)" -ForegroundColor Green
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}

Write-Host ''
Write-Host '== Backend is live. Probe endpoints with:' -ForegroundColor Cyan
Write-Host '   curl http://localhost:5000/api/health'
Write-Host '   curl http://localhost:5000/api/products'
Write-Host '   curl http://localhost:5000/api/categories'
Write-Host '   curl http://localhost:5000/api/vendors'
Write-Host '   (auth-required endpoints need a cookie from POST /api/auth/login)'
Write-Host ''
Write-Host 'Tailing server.log — Ctrl+C to stop.' -ForegroundColor Yellow
Get-Content $log -Wait -Tail 50
