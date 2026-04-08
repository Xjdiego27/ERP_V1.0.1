# ══════════════════════════════════════════════════════════
# DEPLOY ERP — Ejecutar en el servidor de producción (INTRANETEQ)
# ══════════════════════════════════════════════════════════
#
# USO:
#   1. Copiar la carpeta DEPLOY_PRODUCCION (o el .zip) al servidor
#   2. Abrir PowerShell como administrador en el servidor
#   3. Ejecutar:  .\DEPLOY.ps1
#
# Este script:
#   - Copia los archivos del backend al directorio del proyecto
#   - Copia el frontend compilado al directorio de nginx
#   - Reinicia el backend
# ══════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY ERP — Servidor Produccion"      -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── CONFIGURACION — Ajustar segun el servidor ──
# Ruta donde esta el proyecto en el servidor de produccion
$PROYECTO_ROOT = Read-Host "Ruta del proyecto en este servidor (ej: C:\ERP, C:\Users\admin\ERP)"
$BACKEND_DIR   = Join-Path $PROYECTO_ROOT "backend"
$NGINX_HTML    = "C:\nginx\html\erp"  # Donde nginx sirve el frontend

# Verificar que las rutas existen
if (-not (Test-Path $BACKEND_DIR)) {
    Write-Host "ERROR: No se encontro el backend en: $BACKEND_DIR" -ForegroundColor Red
    Write-Host "Verifica la ruta del proyecto." -ForegroundColor Yellow
    pause
    exit 1
}

$SCRIPT_DIR = $PSScriptRoot

# ── 1. BACKEND — Copiar archivos Python ──
Write-Host ""
Write-Host "[1/3] Copiando backend..." -ForegroundColor Yellow

$backendSrc = Join-Path $SCRIPT_DIR "backend"
if (-not (Test-Path $backendSrc)) {
    Write-Host "ERROR: No se encontro la carpeta backend\ junto a este script" -ForegroundColor Red
    pause
    exit 1
}

# Copiar todos los .py
Copy-Item "$backendSrc\*.py" $BACKEND_DIR -Force
Write-Host "  - Archivos .py copiados" -ForegroundColor Green

# Copiar requirements.txt
if (Test-Path "$backendSrc\requirements.txt") {
    Copy-Item "$backendSrc\requirements.txt" $BACKEND_DIR -Force
    Write-Host "  - requirements.txt copiado" -ForegroundColor Green
}

# Copiar subcarpetas (schemas, servicios, templates)
foreach ($sub in @("schemas", "servicios", "templates")) {
    if (Test-Path "$backendSrc\$sub") {
        Copy-Item "$backendSrc\$sub" "$BACKEND_DIR\$sub" -Recurse -Force
        Write-Host "  - $sub\ copiado" -ForegroundColor Green
    }
}

Write-Host "  Backend actualizado OK" -ForegroundColor Green

# ── 2. FRONTEND — Copiar build compilado ──
Write-Host ""
Write-Host "[2/3] Copiando frontend..." -ForegroundColor Yellow

$frontendSrc = Join-Path $SCRIPT_DIR "frontend"
if (Test-Path $frontendSrc) {
    if (Test-Path $NGINX_HTML) {
        # Limpiar assets viejos
        if (Test-Path "$NGINX_HTML\assets") {
            Remove-Item "$NGINX_HTML\assets\*" -Recurse -Force 2>$null
        }
        Copy-Item "$frontendSrc\*" $NGINX_HTML -Recurse -Force
        Write-Host "  Frontend copiado a $NGINX_HTML" -ForegroundColor Green
    } else {
        Write-Host "  ADVERTENCIA: No se encontro $NGINX_HTML — frontend NO copiado" -ForegroundColor Yellow
        Write-Host "  Copia manualmente frontend\* a donde nginx sirve los archivos" -ForegroundColor Yellow
    }
} else {
    Write-Host "  No hay carpeta frontend\ — saltando" -ForegroundColor DarkGray
}

# ── 3. REINICIAR BACKEND ──
Write-Host ""
Write-Host "[3/3] Reiniciando backend..." -ForegroundColor Yellow

# Buscar proceso python con uvicorn en puerto 4000
$pythonProcs = Get-Process python -ErrorAction SilentlyContinue
if ($pythonProcs) {
    Write-Host "  Deteniendo procesos Python existentes..." -ForegroundColor DarkGray
    $pythonProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Intentar encontrar el python del venv
$venvPython = Join-Path $BACKEND_DIR ".venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    Write-Host "  Iniciando backend con venv..." -ForegroundColor DarkGray
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "cd /d `"$BACKEND_DIR`" && `"$venvPython`" -u -m uvicorn main:app --host 0.0.0.0 --port 4000 --reload" `
        -WindowStyle Minimized
    Start-Sleep -Seconds 3

    # Verificar
    $listening = netstat -ano | Select-String ":4000 " | Select-String "LISTENING"
    if ($listening) {
        Write-Host "  Backend reiniciado OK (puerto 4000)" -ForegroundColor Green
    } else {
        Write-Host "  ADVERTENCIA: El backend podria no haber arrancado. Verifica manualmente." -ForegroundColor Yellow
    }

    # Intentar reiniciar chat backend tambien
    $chatDir = Join-Path $PROYECTO_ROOT "chat_backend"
    if (Test-Path "$chatDir\chat_server.py") {
        Start-Process -FilePath "cmd.exe" `
            -ArgumentList "/c", "cd /d `"$chatDir`" && `"$venvPython`" -u -m uvicorn chat_server:app --host 0.0.0.0 --port 4001 --reload" `
            -WindowStyle Minimized
        Write-Host "  Chat backend reiniciado (puerto 4001)" -ForegroundColor Green
    }
} else {
    Write-Host "  No se encontro venv en $venvPython" -ForegroundColor Yellow
    Write-Host "  Reinicia el backend manualmente." -ForegroundColor Yellow
}

# ── Recargar nginx ──
Write-Host ""
$nginxExe = "C:\nginx\nginx.exe"
if (Test-Path $nginxExe) {
    & $nginxExe -s reload 2>$null
    Write-Host "  Nginx recargado" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOY COMPLETADO"                      -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifica en el navegador:" -ForegroundColor Cyan
Write-Host "  http://intraneteq" -ForegroundColor White
Write-Host ""
pause
