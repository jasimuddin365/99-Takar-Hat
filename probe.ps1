Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName | Format-Table -AutoSize
"---"
try { (Invoke-WebRequest -Uri http://localhost:5000/api/health -UseBasicParsing).Content } catch { "backend down: $_" }
"---"
try { (Invoke-WebRequest -Uri http://localhost:5173/ -UseBasicParsing).StatusCode } catch { "frontend down: $_" }
"---"
try { (Invoke-WebRequest -Uri http://localhost:5173/api/categories -UseBasicParsing).Content } catch { "proxy down: $_" }
