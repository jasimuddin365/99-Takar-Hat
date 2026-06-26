$log = Join-Path $env:TEMP 'vite.log'
$err = Join-Path $env:TEMP 'vite.err.log'
Write-Host '--- VITE STDOUT ---'
if (Test-Path $log) { Get-Content $log } else { 'log missing' }
Write-Host '--- VITE STDERR ---'
if (Test-Path $err) { Get-Content $err } else { 'err log missing' }
Write-Host '--- ROOT ---'
try {
  $r = Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 5
  Write-Host "status=$($r.StatusCode) len=$($r.Content.Length)"
  Write-Host $r.Content.Substring(0, [Math]::Min(250, $r.Content.Length))
} catch {
  Write-Host "fail: $($_.Exception.Message)"
}
Write-Host '--- PROXY /api/categories ---'
try {
  $r = Invoke-WebRequest -Uri 'http://localhost:5173/api/categories' -UseBasicParsing -TimeoutSec 5
  Write-Host "status=$($r.StatusCode) len=$($r.Content.Length)"
  Write-Host $r.Content.Substring(0, [Math]::Min(250, $r.Content.Length))
} catch {
  Write-Host "fail: $($_.Exception.Message)"
}