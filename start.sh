#!/bin/bash
set -e

echo "启动 NutriMind..."

# 检查 .env
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "已创建 backend/.env，请填写 MODELSCOPE_TOKEN 后重新运行"
  exit 1
fi

# 安装依赖（如果 node_modules 不存在）
[ ! -d backend/node_modules ] && (cd backend && npm install)
[ ! -d frontend/node_modules ] && (cd frontend && npm install)

# 启动后端
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

sleep 3

# 启动前端
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "==============================="
echo "  NutriMind 已启动"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:3001"
echo "  Ctrl+C 停止"
echo "==============================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
