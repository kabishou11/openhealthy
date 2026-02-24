# NutriMind - 智能健康营养助手

> AI 驱动的健康管理平台：体检报告扫描 → 健康档案 → AI 医生对话 → 个性化餐单

## 功能

- **健康档案管理** — 扫描体检报告（OCR）自动提取指标，支持手动录入，异常指标高亮
- **AI 医生对话** — 基于体检数据与 AI 进行针对性健康咨询（Qwen3 流式输出）
- **个性化餐单** — 根据健康数据生成 7 天餐单，140+ 道食谱库
- **智能问答** — 营养健康知识问答，支持注入体检上下文
- **营养分析** — 食物营养成分计算与摄入分析

## 快速开始

### 前置要求

- Node.js >= 18
- [ModelScope Token](https://www.modelscope.cn/my/token)（免费注册获取）

### 1. 克隆 & 安装

```bash
git clone https://github.com/kabishou11/openhealthy.git
cd openhealthy

# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env`，填入必填项：

```env
MODELSCOPE_TOKEN=你的Token   # 必填，从 modelscope.cn/my/token 获取
```

### 3. 启动服务

**终端 1 — 后端（端口 3001）**
```bash
cd backend && npm run dev
```

**终端 2 — 前端（端口 3000）**
```bash
cd frontend && npm run dev
```

访问 http://localhost:3000

---

## 一键启动脚本

**macOS / Linux**
```bash
chmod +x start.sh && ./start.sh
```

**Windows PowerShell**
```powershell
powershell -ExecutionPolicy Bypass -File start.ps1
```

---

## 项目结构

```
openhealthy/
├── backend/                  # Fastify API 服务
│   ├── src/
│   │   ├── routes/
│   │   │   ├── scan-health.ts        # OCR 体检扫描（Qwen3-VL）
│   │   │   ├── personal-health.ts    # 健康档案 CRUD
│   │   │   ├── analyze-health.ts     # AI 医生对话（SSE 流式）
│   │   │   ├── chat.ts               # 智能问答
│   │   │   ├── menu.ts               # 餐单生成
│   │   │   └── models.ts             # 模型配置
│   │   ├── agents/                   # LangGraph AI Agents
│   │   ├── models/db.ts              # SQLite 数据库
│   │   └── config.ts                 # 统一配置（API Key 等）
│   ├── data/nutrimind.db             # SQLite 数据文件（本地）
│   └── .env.example
│
├── frontend/                 # Nuxt 3 前端
│   ├── pages/
│   │   ├── health/
│   │   │   ├── records.vue   # 健康档案列表 + AI 对话
│   │   │   └── scan.vue      # 体检扫描入口
│   │   ├── knowledge/        # 智能问答
│   │   ├── menu.vue          # 餐单规划
│   │   └── recipes/          # 食谱浏览
│   ├── components/
│   │   └── OCRScanner.vue    # 体检报告扫描组件
│   └── nuxt.config.ts        # 含 devProxy 配置
│
├── start.sh                  # macOS/Linux 一键启动
├── start.ps1                 # Windows 一键启动
└── .env.example
```

---

## 环境变量说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `MODELSCOPE_TOKEN` | ✅ | ModelScope API Token，用于所有 AI 功能 |
| `PORT` | 否 | 后端端口，默认 3001 |
| `NODE_ENV` | 否 | 环境，默认 development |

所有 AI 功能（对话、OCR、餐单生成）统一使用 `MODELSCOPE_TOKEN`，无需配置多个 Key。

---

## 使用的模型

| 功能 | 模型 |
|------|------|
| 体检报告 OCR | `Qwen/Qwen3-VL-235B-A22B-Instruct` |
| AI 医生对话 | `Qwen/Qwen3-Next-80B-A3B-Instruct` |
| 智能问答 / 餐单 | `Qwen/Qwen3-235B-A22B` |

均通过 ModelScope API 在线调用，无需本地 GPU。

---

## 常见问题

**Q: AI 对话返回"未配置 MODELSCOPE_TOKEN"**
→ 检查 `backend/.env` 中 `MODELSCOPE_TOKEN` 是否正确填写

**Q: 健康档案页面空白 / 记录不显示**
→ 确认后端已启动（`curl http://localhost:3001/health` 应返回 ok）

**Q: 体检扫描失败**
→ 检查图片格式（支持 JPG/PNG），文件大小建议 < 5MB

---

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Node.js 18 + Fastify + LangChain/LangGraph |
| 数据库 | SQLite (better-sqlite3) |
| 前端 | Nuxt 3 + Vue 3 + Tailwind CSS |
| AI | ModelScope API (Qwen3 系列) |

---

## License

MIT
