# Stop all dev processes (Vite + Express)
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
"stopped node processes"