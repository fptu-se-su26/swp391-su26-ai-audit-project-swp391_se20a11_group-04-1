# start-all.ps1
$baseDir = $PSScriptRoot

# ─────────────────────────────────────────────────────────
# BƯỚC 1: KAFKA
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[1/5] Starting Kafka (Docker)..." -ForegroundColor Cyan
Set-Location -Path "$baseDir\code\backend"
docker compose -f docker-compose.kafka.yml up -d

Write-Host "      Waiting 15s for Kafka to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# ─────────────────────────────────────────────────────────
# BƯỚC 2: SPRING BOOT BACKEND
# Phải chạy TRƯỚC workers vì:
#   - Workers cần gọi /internal/test-runs/** khi nhận message
#   - Backend tạo Kafka topic "test-run-jobs" khi khởi động
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/5] Starting Spring Boot Backend..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$baseDir\code\backend'; .\mvnw.cmd spring-boot:run`""

Write-Host "      Waiting 45s for Backend to fully start and create Kafka topic..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

# ─────────────────────────────────────────────────────────
# BƯỚC 3: PLAYWRIGHT HTTP SERVER
# Phải chạy TRƯỚC workers vì:
#   - Workers gọi /run và /status qua localhost:4001 (local mode)
#   - WebSocket screencast cần server.js đang listen
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/5] Starting Playwright HTTP Server (port 4001)..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$baseDir\code\playwright-service'; node server.js`""

Write-Host "      Waiting 5s for Playwright server to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# ─────────────────────────────────────────────────────────
# BƯỚC 4: PLAYWRIGHT KAFKA WORKERS (3 instances)
# Stagger 8 giây giữa mỗi worker để tránh rebalance đồng thời
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/5] Starting 3 Playwright Workers (staggered 8s apart)..." -ForegroundColor Cyan
for ($i = 1; $i -le 3; $i++) {
    Write-Host "      Starting Worker $i of 3..." -ForegroundColor Cyan
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$baseDir\code\playwright-service'; npm run worker`""
    if ($i -lt 3) {
        Write-Host "      Waiting 8s before next worker..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
    }
}

Write-Host "      Waiting 10s for all workers to stabilize in Kafka group..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# ─────────────────────────────────────────────────────────
# BƯỚC 5: FRONTEND
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] Starting Frontend (React/Vite)..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$baseDir\code\frontend'; npm run dev`""

# ─────────────────────────────────────────────────────────
# DONE
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  All services launched successfully!        " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Kafka:         localhost:9092              " -ForegroundColor White
Write-Host "  Backend:       http://localhost:8080       " -ForegroundColor White
Write-Host "  Playwright:    http://localhost:4001/health" -ForegroundColor White
Write-Host "  Frontend:      http://localhost:5173       " -ForegroundColor White
Write-Host "  Workers:       3 instances                 " -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Startup sequence complete." -ForegroundColor Green
Write-Host "  Total wait time: ~83 seconds" -ForegroundColor Gray
