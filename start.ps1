# NutriMind 一键启动脚本 (Windows PowerShell)

# 检查 .env
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "已创建 backend\.env，请填写 MODELSCOPE_TOKEN 后重新运行" -ForegroundColor Yellow
    exit 1
}

# 安装依赖
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "安装后端依赖..." -ForegroundColor Cyan
    Push-Location backend; npm install; Pop-Location
}
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "安装前端依赖..." -ForegroundColor Cyan
    Push-Location frontend; npm install; Pop-Location
}

# 启动后端
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -PassThru

Start-Sleep 3

# 启动前端
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru

Write-Host ""
Write-Host "===============================" -ForegroundColor Green
Write-Host "  NutriMind 已启动" -ForegroundColor Green
Write-Host "  前端: http://localhost:3000" -ForegroundColor Green
Write-Host "  后端: http://localhost:3001" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
