$ROOT = $PSScriptRoot
$VENV = Join-Path $ROOT "backend\.venv\Scripts\python.exe"
$BACKEND = Join-Path $ROOT "backend"
$CHAT_BACKEND = Join-Path $ROOT "chat_backend"
$FRONTEND = Join-Path $ROOT "erp-poo"

Write-Host ""
Write-Host "======================================"  -ForegroundColor Cyan
Write-Host "  SISTEMA ERP - Iniciando servicios"     -ForegroundColor Cyan
Write-Host "======================================"  -ForegroundColor Cyan
Write-Host ""

# ── Limpiar procesos previos que puedan ocupar los puertos ──
Write-Host "[0/3] Limpiando procesos previos..."     -ForegroundColor DarkGray
$prevErr = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
# Matar cualquier python/node que use los puertos 8000/8001/5173
foreach ($port in @(8000, 8001, 5173)) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
$ErrorActionPreference = $prevErr
Start-Sleep -Seconds 1

# ── Verificar que el venv existe ──
if (-not (Test-Path $VENV)) {
    Write-Host "ERROR: No se encontro python.exe en $VENV" -ForegroundColor Red
    Write-Host "Ejecuta:  cd backend && python -m venv .venv && .venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[1/3] Backend ERP (FastAPI) puerto 8000..." -ForegroundColor Yellow
$backCmd = "`"$VENV`" -u -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload 2>&1"
$back = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c","cd /d `"$BACKEND`" && $backCmd" `
    -PassThru -NoNewWindow
Start-Sleep -Seconds 3

# Verificar que el backend levanto
if ($back.HasExited) {
    Write-Host "ERROR: El backend ERP no pudo iniciar. Revisa errores arriba." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[2/3] Backend Chat (FastAPI) puerto 8001..." -ForegroundColor Yellow
$chatCmd = "`"$VENV`" -u -m uvicorn chat_server:app --host 0.0.0.0 --port 8001 --reload 2>&1"
$chat = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c","cd /d `"$CHAT_BACKEND`" && $chatCmd" `
    -PassThru -NoNewWindow
Start-Sleep -Seconds 2

Write-Host "[3/3] Frontend (Vite) puerto 5173..."   -ForegroundColor Yellow
$front = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c","cd /d `"$FRONTEND`" && npm run dev 2>&1" `
    -PassThru -NoNewWindow
Start-Sleep -Seconds 4

Write-Host ""
Write-Host "======================================"  -ForegroundColor Green
Write-Host "  Backend ERP:  http://localhost:8000"   -ForegroundColor Green
Write-Host "  Backend Chat: http://localhost:8001"   -ForegroundColor Green
Write-Host "  Frontend:     http://localhost:5173"   -ForegroundColor Green
Write-Host "======================================"  -ForegroundColor Green
Write-Host ""
Write-Host "Ctrl+C para detener ambos servicios."   -ForegroundColor Gray
Write-Host ""

try {
    Wait-Process -Id $back.Id -ErrorAction SilentlyContinue
}
finally {
    Write-Host ""
    Write-Host "Deteniendo servicios..." -ForegroundColor Red
    if (!$back.HasExited)  { Stop-Process -Id $back.Id  -Force -ErrorAction SilentlyContinue }
    if (!$chat.HasExited)  { Stop-Process -Id $chat.Id  -Force -ErrorAction SilentlyContinue }
    if (!$front.HasExited) { Stop-Process -Id $front.Id -Force -ErrorAction SilentlyContinue }
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Servicios detenidos." -ForegroundColor Red
}
