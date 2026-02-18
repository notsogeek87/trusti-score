# 🧪 Script de Test - TrustiScore avec Neon.tech

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Test du Systeme TrustiScore" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Test 1 : Backend Health
Write-Host "Test 1 : Connexion Backend + Database..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET -ErrorAction Stop
    if ($response.status -eq "ok" -and $response.database -eq "connected") {
        Write-Host "SUCCES - Backend connecte a Neon.tech !" -ForegroundColor Green
        Write-Host "Timestamp BDD: $($response.timestamp)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERREUR - Backend non accessible sur port 3001" -ForegroundColor Red
    Write-Host "Lancez : cd backend; npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2 : Authentification
Write-Host "Test 2 : Authentification Admin..." -ForegroundColor Yellow
try {
    $body = @{
        password = "9xWL5JVP`$Nj1l6"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    
    if ($response.token) {
        Write-Host "SUCCES - Authentification reussie !" -ForegroundColor Green
        $global:authToken = $response.token
    }
} catch {
    Write-Host "ERREUR - Authentification echouee" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3 : Chargement de la configuration
Write-Host "Test 3 : Chargement de la configuration..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/config" -Method GET -ErrorAction Stop
    
    if ($response.siteName) {
        Write-Host "SUCCES - Configuration chargee !" -ForegroundColor Green
        Write-Host "Nom du site: $($response.siteName)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERREUR - Impossible de charger la config" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "TOUS LES TESTS REUSSIS !" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API : http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend    : http://localhost:8000" -ForegroundColor Cyan
Write-Host "Database    : Neon.tech (trusti-score-db)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mot de passe admin : 9xWL5JVP`$Nj1l6" -ForegroundColor Yellow
Write-Host ""
