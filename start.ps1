# 🚀 Démarrage Rapide - TrustiScore

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    TrustiScore - Demarrage Systeme" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si le backend est déjà lancé
Write-Host "Verification du backend..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "Backend deja en ligne sur port 3001" -ForegroundColor Green
} catch {
    Write-Host "Demarrage du backend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '=== BACKEND API ===' -ForegroundColor Cyan; npm start"
    Write-Host "Backend demarre dans un nouveau terminal" -ForegroundColor Green
    Start-Sleep -Seconds 3
}

Write-Host ""

# Vérifier si le frontend est déjà lancé
Write-Host "Verification du frontend..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "Frontend deja en ligne sur port 8000" -ForegroundColor Green
} catch {
    Write-Host "Demarrage du frontend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '=== FRONTEND ===' -ForegroundColor Cyan; python -m http.server 8000"
    Write-Host "Frontend demarre dans un nouveau terminal" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    Systeme demarre !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API : http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend    : http://localhost:8000" -ForegroundColor Cyan
Write-Host "Interface   : http://localhost:8000/admin.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Mot de passe admin : 9xWL5JVP`$Nj1l6" -ForegroundColor Magenta
Write-Host ""

# Ouvrir le navigateur
Write-Host "Ouverture du navigateur..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Start-Process "http://localhost:8000/admin.html"

Write-Host ""
Write-Host "Pret ! Connectez-vous dans le navigateur." -ForegroundColor Green
Write-Host "Pour arreter : fermez les terminaux backend/frontend" -ForegroundColor Gray
Write-Host ""
