# ============================================================
#  DevTrack - Build & Deploy Script
#  Chay file nay sau moi lan sua code
#
#  Kien truc hien tai:
#    - Infra (Kafka, Postgres, Redis, MongoDB, Playwright Server,
#             Architecture Parser)  --> Docker Compose
#    - Playwright Worker (Kafka consumer)  --> Kubernetes (kind)
#    - Backend (Spring Boot)               --> Local (IntelliJ)
#    - Frontend (Vite)                     --> Local (npm run dev)
#    - DevTrack Agent                      --> Local (node index.js)
#
#  Su dung:
#    .\deploy.ps1              # Build + deploy tat ca
#    .\deploy.ps1 -WorkerOnly  # Chi rebuild K8s worker
#    .\deploy.ps1 -ServerOnly  # Chi rebuild playwright-server Docker
#    .\deploy.ps1 -InfraOnly   # Chi khoi dong lai infra docker-compose
# ============================================================

param(
    [switch]$InfraOnly,
    [switch]$WorkerOnly,
    [switch]$ServerOnly
)

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
$IMAGE = "swp391-su26-ai-audit-project-swp391_se20a11_group-04-1-playwright-worker:latest"
$COMPOSE = "$ROOT\docker-compose.dev.yml"
$K8S_MANIFEST = "$ROOT\playwright-worker-local.yaml"
$ENV_FILE = "$ROOT\.env"

Write-Host ""
Write-Host "=== DevTrack Deploy ===" -ForegroundColor Cyan

# Neu khong co flag nao thi chay tat ca
$runAll = -not $InfraOnly -and -not $WorkerOnly -and -not $ServerOnly

# ============================================================
# PHAN 1: INFRA - Docker Compose
# ============================================================
if ($runAll -or $InfraOnly -or $ServerOnly) {
    Write-Host ""
    Write-Host ">> Infra (Docker Compose)..." -ForegroundColor Yellow

    if ($ServerOnly) {
        docker-compose -f $COMPOSE build playwright-server
        docker-compose -f $COMPOSE up -d --force-recreate playwright-server
    } else {
        docker-compose -f $COMPOSE up -d kafka postgres redis mongodb architecture-parser playwright-server
    }

    Write-Host "   OK" -ForegroundColor Green

    if ($InfraOnly) {
        Write-Host ""
        Write-Host "Done." -ForegroundColor Green
        exit 0
    }
}

# ============================================================
# PHAN 2: PLAYWRIGHT WORKER - Kubernetes
# ============================================================
if ($runAll -or $WorkerOnly) {
    Write-Host ""
    Write-Host ">> Build Docker image cho Playwright Worker..." -ForegroundColor Yellow
    docker build -f "$ROOT\code\playwright-service\Dockerfile.worker" -t $IMAGE "$ROOT\code\playwright-service"
    Write-Host "   Image built OK" -ForegroundColor Green

    Write-Host ""
    Write-Host ">> Load image vao kind cluster (co the mat 3-5 phut)..." -ForegroundColor Yellow
    kind load docker-image $IMAGE --name devtrack-local
    Write-Host "   Image loaded OK" -ForegroundColor Green

    Write-Host ""
    Write-Host ">> Cap nhat K8s namespace va secret..." -ForegroundColor Yellow
    kubectl create namespace devtrack --dry-run=client -o yaml | kubectl apply -f -
    kubectl delete secret devtrack-secrets -n devtrack --ignore-not-found
    kubectl create secret generic devtrack-secrets -n devtrack --from-env-file=$ENV_FILE
    Write-Host "   Namespace + Secret OK" -ForegroundColor Green

    Write-Host ""
    Write-Host ">> Apply K8s manifest..." -ForegroundColor Yellow
    kubectl apply -f $K8S_MANIFEST

    # Xoa ConfigMap workaround neu con (fix da duoc bake vao image moi)
    kubectl delete configmap playwright-executor-fix -n devtrack --ignore-not-found 2>$null
    # kubectl apply o tren da reset deployment ve trang thai sach, khong can patch them

    Write-Host ""
    Write-Host ">> Rollout restart K8s deployment..." -ForegroundColor Yellow
    kubectl rollout restart deployment/playwright-worker -n devtrack
    kubectl rollout status deployment/playwright-worker -n devtrack --timeout=120s
    Write-Host "   Playwright Worker deployed OK" -ForegroundColor Green
}

# ============================================================
# TONG KET
# ============================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Deploy hoan tat!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "[ Docker containers ]" -ForegroundColor Yellow
docker ps --format "  {{.Names}}  |  {{.Status}}" --filter "name=devtrack"
Write-Host ""
Write-Host "[ Kubernetes pods ]" -ForegroundColor Yellow
kubectl get pods -n devtrack
Write-Host ""
Write-Host "Debug logs:" -ForegroundColor DarkGray
Write-Host "  kubectl logs -f deployment/playwright-worker -n devtrack"
Write-Host "  docker logs -f devtrack-playwright-server-dev"
Write-Host ""
