# NutriMind - 智能营养师助手

> 一个能替代营养师的AI系统，渗透到学校、医院、企业等机构

## 目录

- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [环境要求](#环境要求)
- [后端部署](#后端部署)
- [前端部署](#前端部署)
- [OCR服务部署](#ocr服务部署)
- [开发说明](#开发说明)
- [API文档](#api文档)

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/nutrimind.git
cd nutrimind
```

### 2. 启动所有服务

```bash
# 方式一：使用启动脚本
./start-all.sh

# 方式二：手动启动
# 终端1 - 启动后端API
cd backend && npm run dev

# 终端2 - 启动前端
cd frontend && npm run dev

# 终端3 - 启动OCR服务（可选，需要GLM-OCR模型）
cd backend && ./start-ocr.sh
```

### 3. 访问应用

- 前端页面: http://localhost:3000
- 后端API: http://localhost:3001
- OCR服务: http://localhost:8081

---

## 项目结构

```
openhelthy/
├── backend/                      # Node.js 后端 (Fastify)
│   ├── src/
│   │   ├── agents/              # LangChain/LangGraph AI Agents
│   │   │   └── langchain-agents.ts
│   │   ├── mcp_tools/           # Model Context Protocol 工具
│   │   │   ├── howtocook.ts     # 菜谱工具 (343道菜谱)
│   │   │   ├── nutrition-db.ts  # 营养数据库
│   │   │   └── user-health.ts   # 用户健康档案
│   │   ├── rag/                 # RAG 知识库
│   │   │   └── knowledge-base.ts
│   │   ├── routes/              # Fastify 路由
│   │   │   ├── chat.ts          # 智能对话
│   │   │   ├── menu.ts          # 餐单规划
│   │   │   ├── nutrition.ts     # 营养分析
│   │   │   └── health.ts        # 健康档案
│   │   ├── ocr/                 # OCR 服务
│   │   │   └── glm-ocr-service.py
│   │   ├── websocket/           # WebSocket 处理
│   │   └── index.ts             # 入口文件
│   ├── .ocr-venv/               # OCR Python 虚拟环境
│   ├── setup-ocr-venv.sh         # OCR 环境设置脚本
│   ├── start-ocr.sh             # OCR 服务启动脚本
│   └── package.json
│
├── frontend/                    # Nuxt 3 前端
│   ├── pages/                   # 页面
│   │   ├── index.vue           # 首页
│   │   ├── chat.vue            # 智能对话
│   │   ├── menu.vue            # 餐单规划
│   │   ├── recipes.vue         # 食谱浏览
│   │   ├── analysis.vue        # 健康分析
│   │   ├── students.vue        # 学生管理
│   │   └── ocr.vue             # OCR 扫描
│   ├── components/             # Vue 组件
│   │   ├── NavBar.vue          # 导航栏
│   │   ├── ChatWidget.vue      # 对话组件
│   │   └── HealthCard.vue      # 健康卡片
│   ├── composables/            # Vue 组合式函数
│   │   ├── useChat.ts          # 对话逻辑
│   │   ├── useNutrition.ts     # 营养计算
│   │   └── useHealth.ts        # 健康档案
│   ├── stores/                 # Pinia 状态管理
│   ├── assets/                 # 静态资源
│   └── nuxt.config.ts
│
├── models/                      # 本地模型
│   └── GLM-OCR/                # GLM-OCR OCR模型
│
├── whatToEat/                   # 参考项目
├── kb/                          # 知识库
├── docs/                        # 文档
└── README.md                    # 本文件
```

---

## 环境要求

### 基础环境

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18 | 建议使用 LTS 版本 |
| Python | 3.11 | OCR 服务需要 |
| npm/yarn | 最新版 | 依赖管理 |
| Git | 最新版 | 版本控制 |

### 可选软件

| 软件 | 版本 | 说明 |
|------|------|------|
| PostgreSQL | >= 15 | 生产环境数据库 |
| Redis | >= 7 | 缓存和会话存储 |
| GLM-OCR Model | - | 本地OCR模型（位于 models/GLM-OCR） |

---

## 后端部署

### 1. 安装 Node.js 依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置
vim .env
```

`.env` 配置示例：

```env
# API 配置
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4o

# 服务器配置
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# CORS 配置
CORS_ORIGINS=http://localhost:3000,http://localhost:1420

# OCR 服务（可选）
GLM_OCR_URL=http://127.0.0.1:8081
```

### 3. 启动开发服务器

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

### 4. 验证后端

```bash
# 健康检查
curl http://localhost:3001/health

# API 状态
curl http://localhost:3001/api/v1/status
```

---

## 前端部署

### 1. 安装 Node.js 依赖

```bash
cd frontend
npm install
```

### 2. 配置环境变量（如需要）

```bash
# 复制环境变量模板
cp .env.example .env.local

# 配置 API 地址
NUXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
npm run preview
```

### 5. 验证前端

访问 http://localhost:3000

---

## OCR服务部署

OCR 服务使用 GLM-OCR 本地模型进行文字识别。

### 1. 设置 Python 虚拟环境

```bash
cd backend

# 使用提供的脚本设置环境
chmod +x setup-ocr-venv.sh
./setup-ocr-venv.sh
```

### 2. 配置 GLM-OCR 模型

确保模型文件位于：

```
models/GLM-OCR/
├── config.json
├── pytorch_model.bin
├── tokenizer.json
└── ...
```

### 3. 启动 OCR 服务

```bash
cd backend

# 方式一：使用启动脚本
chmod +x start-ocr.sh
./start-ocr.sh

# 方式二：手动启动
.ocr-venv/bin/python src/ocr/glm-ocr-service.py --port 8081

# 方式三：后台运行
nohup .ocr-venv/bin/python src/ocr/glm-ocr-service.py --port 8081 > /tmp/ocr.log 2>&1 &
```

### 4. 验证 OCR 服务

```bash
# 健康检查
curl http://localhost:8081/health

# 加载模型
curl -X POST -H "Content-Type: application/json" -d '{}' http://localhost:8081/load

# 测试 OCR
curl -X POST -H "Content-Type: application/json" \
  -d '{"action": "ocr", "image": "BASE64_IMAGE_DATA", "prompt": "Text Recognition:"}' \
  http://localhost:8081/
```

### 5. OCR 服务端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 检查服务状态 |
| `/load` | POST | 加载 GLM-OCR 模型 |
| `/unload` | POST | 卸载模型，释放内存 |
| `/` | POST | 执行 OCR 识别 |

### OCR 请求示例

```bash
# 加载模型
curl -X POST http://127.0.0.1:8081/load

# 识别图片
curl -X POST http://127.0.0.1:8081/ \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ocr",
    "image": "data:image/png;base64,IMAGE_BASE64_STRING",
    "prompt": "Text Recognition:"
  }'

# 提取健康数据
curl -X POST http://127.0.0.1:8081/ \
  -H "Content-Type: application/json" \
  -d '{
    "action": "health",
    "image": "data:image/png;base64,IMAGE_BASE64_STRING"
  }'
```

---

## 开发说明

### 代码规范

- TypeScript 严格模式
- ESLint 代码检查
- Prettier 代码格式化
- Git 提交信息规范

### 添加新功能

1. **添加 API 路由**: 在 `backend/src/routes/` 添加新文件
2. **添加前端页面**: 在 `frontend/pages/` 添加 `.vue` 文件
3. **添加 AI 工具**: 在 `backend/src/mcp_tools/` 添加工具
4. **更新文档**: 同步更新 README 和 API 文档

### 测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

---

## API 文档

### 健康检查

```http
GET /health
GET /api/v1/status
```

### 智能对话

```http
POST /api/v1/chat                  # 发送消息
WS /ws/chat                         # WebSocket 实时对话
GET /api/v1/chat/:sessionId        # 获取对话历史
```

### 餐单规划

```http
GET /api/v1/menu/recipes           # 搜索食谱
GET /api/v1/menu/recipes/:id       # 食谱详情
POST /api/v1/menu/generate         # 生成餐单
GET /api/v1/menu/categories        # 获取分类
```

### 营养分析

```http
GET /api/v1/nutrition/foods        # 搜索食物
POST /api/v1/nutrition/calculate   # 计算营养
POST /api/v1/nutrition/analyze     # 营养分析
```

### 健康管理

```http
POST /api/v1/health/profile        # 创建健康档案
GET /api/v1/health/profile/:id     # 获取档案
PUT /api/v1/health/profile/:id     # 更新档案
```

### OCR 服务

```http
GET /api/v1/ocr/status             # OCR 状态
POST /api/v1/ocr/load             # 加载模型
POST /api/v1/ocr/unload           # 卸载模型
POST /api/v1/ocr                  # 执行 OCR
POST /api/v1/ocr/health-checkup   # 提取健康数据
POST /api/v1/ocr/pdf              # PDF 解析
```

---

## Docker 部署

### 开发环境

```bash
docker-compose up -d
```

### 生产环境

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 环境变量

```yaml
# docker-compose.yml 示例
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
```

---

## 常见问题

### Q: OCR 服务无法启动？

A: 检查以下几点：
1. Python 3.11 是否安装
2. 虚拟环境是否正确创建
3. GLM-OCR 模型文件是否完整
4. 端口 8081 是否被占用

### Q: 前端无法连接后端？

A: 检查 CORS 配置：
1. 确认 `.env` 中的 `CORS_ORIGINS` 包含前端地址
2. 确认后端正在运行

### Q: AI 对话无响应？

A: 检查：
1. `OPENAI_API_KEY` 是否正确
2. 网络是否能访问 OpenAI API
3. 查看后端日志

---

## 技术栈

### 后端

| 技术 | 用途 |
|------|------|
| Node.js 18+ | 运行时 |
| Fastify | Web 框架 |
| LangChain + LangGraph | AI 编排 |
| OpenAI GPT-4o | LLM |
| GLM-OCR | 本地 OCR |
| WebSocket | 实时通信 |

### 前端

| 技术 | 用途 |
|------|------|
| Nuxt 3 | Vue 框架 |
| Tailwind CSS | 样式 |
| Pinia | 状态管理 |
| Chart.js | 图表 |
| Vue Transition | 动画 |

---

## 许可证

MIT License

---

## 联系方式

- GitHub: https://github.com/nutrimind
- Email: hello@nutrimind.ai

---

> NutriMind - 让健康饮食变得简单又有趣
