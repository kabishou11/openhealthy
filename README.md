# NutriMind - 智能营养师助手

> 一个能替代营养师的AI系统，渗透到学校、医院、企业等机构

## 功能特点

- 🤖 **AI 智能对话** - 基于大模型的营养健康咨询
- 📋 **个性化餐单规划** - 根据用户身体数据生成7天餐单
- 🍳 **140+ 道食谱库** - 涵盖早餐、主食、荤菜、素菜、水产、汤、凉菜、甜品
- 📊 **营养分析** - 计算食物营养成分，分析摄入情况
- 👨‍🏫 **学校管理模块** - 学生健康档案、体检数据管理
- 🔐 **用户认证系统** - 登录/注册、角色权限管理
- 📷 **OCR 体检报告扫描** - 自动识别体检报告数据

## 项目进展

### ✅ 已完成

| 功能 | 状态 |
|------|------|
| Fastify API 基础框架 | ✅ |
| LangChain/LangGraph AI Agents | ✅ |
| ModelScope API 集成 (Qwen3-8B) | ✅ |
| 食谱数据库 (140道菜) | ✅ |
| 营养数据库 (60+食物) | ✅ |
| 用户健康档案管理 | ✅ |
| 智能对话 (WebSocket) | ✅ |
| 餐单生成 (LLM + 食谱库fallback) | ✅ |
| 单餐重新生成 | ✅ |
| JWT 认证系统 | ✅ |
| 登录/注册页面 | ✅ |
| 管理后台 | ✅ |
| 学生管理 | ✅ |
| 健康记录管理 | ✅ |
| OCR 体检报告扫描 | ✅ |

### 🚧 开发中

- [ ] 实时语音对话
- [ ] 微信/短信家长通知

### 📋 计划中

- [ ] 医院营养科对接
- [ ] 企业团餐管理
- [ ] 养老院营养管理

## 目录

- [快速开始](#快速开始)
- [部署指南](#部署指南)
  - [Windows](#windows-部署)
  - [macOS](#macos-部署)
- [项目结构](#项目结构)
- [环境要求](#环境要求)
- [配置说明](#配置说明)
- [API文档](#api文档)
- [常见问题](#常见问题)

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/kabishou11/openhealthy.git
cd openhealthy
```

### 2. 启动服务

```bash
# 终端1 - 启动后端 (端口 3001)
cd backend && npm run dev

# 终端2 - 启动前端 (端口 3000)
cd frontend && npm run dev
```

### 3. 访问应用

- 前端页面: http://localhost:3000
- 后端API: http://localhost:3001
- 健康检查: http://localhost:3001/health

---

## 部署指南

### Windows 部署

#### 前置要求

1. **安装 Node.js**
   - 下载地址: https://nodejs.org/zh-cn/
   - 选择 LTS 版本 (>= 18.x)
   - 安装时勾选 "Add to PATH"

2. **安装 Git** (可选)
   - 下载地址: https://git-scm.com/

#### 部署步骤

```powershell
# 1. 克隆项目
git clone https://github.com/kabishou11/openhealthy.git
cd openhealthy

# 2. 安装后端依赖
cd backend
npm install

# 3. 复制环境变量配置
copy .env.example .env

# 4. 编辑 .env 文件，配置 ModelScope Token
# 打开 .env 文件，修改以下内容：
# MODELSCOPE_TOKEN=你的ModelScopeToken
# (Token 获取地址: https://www.modelscope.cn/my/token)

# 5. 启动后端 (新开一个终端窗口)
npm run dev

# 6. 安装前端依赖 (新开一个终端窗口)
cd ..\frontend
npm install

# 7. 启动前端
npm run dev
```

#### 使用 PowerShell 一键启动脚本

创建 `start.ps1` 文件：

```powershell
# 启动后端
Start-Process powershell -ArgumentList "-Command", "cd backend; npm run dev"

# 启动前端
Start-Process powershell -ArgumentList "-Command", "cd frontend; npm run dev"

Write-Host "服务已启动!"
Write-Host "前端: http://localhost:3000"
Write-Host "后端: http://localhost:3001"
```

运行：`powershell -ExecutionPolicy Bypass -File start.ps1`

---

### macOS 部署

#### 前置要求

1. **安装 Homebrew** (如果未安装)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **安装 Node.js**
   ```bash
   brew install node
   ```

#### 部署步骤

```bash
# 1. 克隆项目
git clone https://github.com/kabishou11/openhealthy.git
cd openhealthy

# 2. 安装后端依赖
cd backend
npm install

# 3. 复制环境变量配置
cp .env.example .env

# 4. 编辑 .env 文件
# 打开 .env 文件，修改以下内容：
# MODELSCOPE_TOKEN=你的ModelScopeToken
# (Token 获取地址: https://www.modelscope.cn/my/token)

# 5. 启动后端
npm run dev

# 6. 新开终端，安装前端依赖
cd ../frontend
npm install

# 7. 启动前端
npm run dev
```

#### 使用脚本一键启动

创建 `start.sh` 文件：

```bash
#!/bin/bash
echo "启动 NutriMind 服务..."

# 启动后端
cd backend
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 5

# 启动前端
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "========================================="
echo "NutriMind 已启动!"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:3001"
echo "========================================="
echo "按 Ctrl+C 停止服务"

# 捕获 Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT

# 等待
wait
```

运行：
```bash
chmod +x start.sh
./start.sh
```

---

## 项目结构

```
openhealthy/
├── backend/                      # Node.js 后端 (Fastify)
│   ├── src/
│   │   ├── agents/              # LangChain/LangGraph AI Agents
│   │   │   └── langchain-agents.ts
│   │   ├── mcp_tools/           # MCP 工具
│   │   │   ├── recipe-database.ts  # 食谱数据库 (140道)
│   │   │   └── nutrition-db.ts   # 营养数据库
│   │   ├── modelscope/          # ModelScope API 客户端
│   │   │   └── client.ts
│   │   ├── routes/              # Fastify 路由
│   │   │   ├── chat.ts          # 智能对话
│   │   │   ├── menu.ts          # 餐单规划
│   │   │   ├── menus.ts         # 食谱管理
│   │   │   ├── nutrition.ts     # 营养分析
│   │   │   ├── auth.ts          # 认证
│   │   │   └── health-records.ts # 健康记录
│   │   ├── auth/                # 认证中间件
│   │   │   ├── jwt.ts
│   │   │   └── middleware.ts
│   │   └── index.ts             # 入口文件
│   ├── prisma/                  # 数据库 schema
│   └── package.json
│
├── frontend/                    # Nuxt 3 前端
│   ├── pages/
│   │   ├── index.vue           # 首页
│   │   ├── chat.vue            # 智能对话
│   │   ├── menu.vue            # 餐单规划
│   │   ├── recipes/            # 食谱浏览
│   │   ├── health/             # 健康分析
│   │   ├── dashboard.vue       # 控制台
│   │   ├── login.vue           # 登录
│   │   ├── register.vue        # 注册
│   │   └── admin/              # 管理后台
│   ├── composables/             # Vue 组合式函数
│   ├── stores/                  # Pinia 状态管理
│   └── nuxt.config.ts
│
├── CLAUDE.md                    # 项目开发文档
└── README.md                    # 本文件
```

---

## 环境要求

### 基础环境

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18 | 建议使用 LTS 版本 |
| npm | 最新版 | 依赖管理 |

### 可选软件

| 软件 | 版本 | 说明 |
|------|------|------|
| Redis | >= 7 | 缓存 (可选，当前使用内存) |

---

## 配置说明

### 环境变量配置

复制 `backend/.env.example` 到 `.env`，主要配置：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# JWT 认证
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# ModelScope API (必须配置!)
# 获取 Token: https://www.modelscope.cn/my/token
MODELSCOPE_TOKEN=ms-xxxxxxxxxxxxxxxxxxxxxxxx

# CORS 配置
CORS_ORIGINS=http://localhost:3000,http://localhost:1420
```

### ModelScope Token 获取

1. 访问 https://www.modelscope.cn/my/token
2. 登录/注册账号
3. 创建新 Token
4. 复制 Token 到 `.env` 文件

### OCR 模型 (可选)

项目已包含 OCR 服务代码，需要下载 GLM-OCR 模型才能使用：

```bash
# 克隆模型 (约 2.5GB)
git lfs install
git clone https://huggingface.co/zai-org/GLM-OCR models/GLM-OCR

# 或者使用 ModelScope
modelscope download --model ZhipuAI/glm-ocr --local_dir ./models/GLM-OCR
```

模型文件已包含在项目中 (`models/GLM-OCR/`)，如需重新下载可执行上述命令。

启动 OCR 服务：
```bash
cd backend
source .ocr-venv/bin/activate  # 或 activate.bat (Windows)
python src/ocr/glm-ocr-service.py --port 8081
```

---

## API 文档

### 健康检查

```http
GET /health
```

### 认证

```http
POST /api/v1/auth/register     # 注册
POST /api/v1/auth/login        # 登录
GET  /api/v1/auth/profile      # 获取当前用户
```

### 食谱

```http
GET  /api/v1/menu/recipes                    # 搜索食谱
GET  /api/v1/menu/recipes/:id                # 食谱详情
GET  /api/v1/menu/categories                  # 获取分类
GET  /api/v1/menu/recipes/random?count=3     # 随机食谱
```

### 餐单

```http
POST   /api/v1/menu/generate                  # 生成餐单
GET    /api/v1/menu/random-meal?type=午餐     # 单餐重新生成
```

### 营养

```http
GET  /api/v1/nutrition/foods        # 搜索食物
POST /api/v1/nutrition/calculate     # 计算营养
```

### OCR (需要 GLM-OCR 模型)

```http
GET  /api/v1/ocr/status             # OCR 状态
POST /api/v1/ocr/load               # 加载模型
POST /api/v1/ocr/unload             # 卸载模型
POST /api/v1/ocr                    # 执行 OCR
POST /api/v1/ocr/health-checkup     # 提取体检数据
```

---

## 常见问题

### Q: 餐单生成失败？

A: 检查以下几点：
1. `.env` 中是否正确配置 `MODELSCOPE_TOKEN`
2. Token 是否有效 (访问 https://www.modelscope.cn/my/token 检查)
3. 后端是否正常启动 (`npm run dev`)

### Q: 前端无法连接后端？

A:
1. 确认后端运行在端口 3001
2. 检查浏览器控制台 CORS 错误
3. 确认 `.env` 中 `CORS_ORIGINS` 包含前端地址

### Q: 食谱搜索返回空结果？

A: 这是 URL 编码问题，使用时确保参数正确编码。例如：
- 正确: `/api/v1/menu/recipes?category=%E6%97%A9%E9%A4%90`
- 或使用前端页面搜索

---

## 技术栈

### 后端

| 技术 | 用途 |
|------|------|
| Node.js 18+ | 运行时 |
| Fastify | Web 框架 |
| ModelScope API (Qwen3-8B) | LLM 大模型 |
| JWT | 用户认证 |
| WebSocket | 实时通信 |

### 前端

| 技术 | 用途 |
|------|------|
| Nuxt 3 | Vue 框架 |
| Tailwind CSS | 样式 |
| Pinia | 状态管理 |

---

## 许可证

MIT License

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=kabishou11/openhealthy&type=Date)](https://star-history.com/#kabishou11/openhealthy&Date)

---

> NutriMind - 让健康饮食变得简单又有趣
