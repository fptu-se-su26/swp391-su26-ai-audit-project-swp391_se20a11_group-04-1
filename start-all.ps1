# start-all.ps1
$baseDir = $PSScriptRoot

Write-Host "1. Starting Kafka (Docker - Detached mode)..." -ForegroundColor Cyan
Set-Location -Path "$baseDir\code\backend"
docker compose -f docker-compose.kafka.yml up -d
Write-Host "Waiting 10 seconds for Kafka to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "2. Starting Playwright Server..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$baseDir\code\playwright-service'; node server.js`""

Write-Host "3. Starting Playwright Worker..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$baseDir\code\playwright-service'; npm run worker`""

Write-Host "4. Starting Spring Boot Backend..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$baseDir\code\backend'; .\mvnw.cmd spring-boot:run`""

Write-Host "Waiting 15 seconds for Backend to initialize before starting frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "5. Starting Frontend (React/Vite)..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$baseDir\code\frontend'; npm run dev`""

Write-Host "All services have been launched in separate windows!" -ForegroundColor Green
