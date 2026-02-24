# NutriMind - 智能健康营养助手

> AI 驱动的学校健康管理平台：多角色权限 → 体检扫描 → 健康档案 → AI 医生对话 → 个性化餐单 → 食堂管理

## 功能概览

- **多角色权限系统** — 8 种角色（家长/学生/学校管理员/食堂管理员/厨师/医生/机构/超管），各角色独立导航与权限
- **健康档案管理** — 扫描体检报告（OCR）自动提取指标，分组表格展示，异常指标高亮，用户数据隔离
- **AI 医生对话** — 基于体检数据与 AI 进行针对性健康咨询（流式输出）
- **个性化餐单** — 8 类人群（普通/学生/老年/孕妇/健身/减脂/糖尿病/高血压），7 天餐单 + 购物清单
- **食堂管理** — 食堂管理员专属：周菜单计划、发布/草稿、过敏原标注、AI 排菜
- **智能问答** — 营养健康知识问答，支持注入体检上下文
- **学生管理** — 学校管理员：学生健康档案、BMI 统计、班级筛选
- **用户管理** — 超管：全平台用户账号管理、角色筛选、启用/禁用
- **知识库管理** — 可视化算法选择（混合/向量/BM25/重排序），分块策略配置

## 快速开始

### 前置要求

- Node.js >= 18
- [ModelScope Token](https://www.modelscope.cn/my/token)（免费注册获取）

### 1. 克隆 & 安装

```bash
git clone https://github.com/kabishou11/openhealthy.git
cd openhealthy

cd backend && npm install
cd ../frontend && npm install
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env`：

```env
MODELSCOPE_TOKEN=你的Token   # 必填，从 modelscope.cn/my/token 获取
JWT_SECRET=your_secret       # 可选，默认有内置值
```

> 也可在启动后通过「模型配置」页面在线填写 API Key，无需重启。

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

## 演示账号

| 角色 | 手机号 | 密码 | 说明 |
|------|--------|------|------|
| 家长 | 13800138001 | 123456 | 查看孩子健康数据 |
| 学生 | 13800138002 | 123456 | 个人健康档案 |
| 食堂管理员 | 13800138003 | 123456 | 食堂菜单管理 |
| 学校管理员 | 13800138004 | 123456 | 学生管理 + 学校配置 |
| 医生/营养师 | 13800138005 | 123456 | 健康分析 + 知识库 |
| 超级管理员 | 13800138000 | 123456 | 全平台管理 |

> 后端未启动时，登录页自动进入演示模式（mock 用户），可切换角色体验不同界面。

---

## 项目结构

```
openhealthy/
├── backend/                  # Fastify API 服务
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts               # JWT 登录/注册
│   │   │   ├── scan-health.ts        # OCR 体检扫描（Qwen3-VL）
│   │   │   ├── personal-health.ts    # 健康档案 CRUD（用户隔离）
│   │   │   ├── analyze-health.ts     # AI 医生对话（SSE 流式）
│   │   │   ├── chat.ts               # 智能问答
│   │   │   ├── menu.ts               # 餐单生成
│   │   │   └── models.ts             # 模型配置（统一 Key/URL）
│   │   ├── agents/                   # LangGraph AI Agents
│   │   ├── models/db.ts              # SQLite 数据库
│   │   └── config.ts                 # 统一配置
│   ├── data/nutrimind.db             # SQLite 数据文件
│   └── .env.example
│
├── frontend/                 # Nuxt 3 前端
│   ├── pages/
│   │   ├── login.vue         # 登录（含演示账号切换）
│   │   ├── register.vue      # 注册（角色选择）
│   │   ├── dashboard.vue     # 用户中心（角色差异化快捷入口）
│   │   ├── health/
│   │   │   ├── records.vue   # 健康档案三栏联动
│   │   │   ├── scan.vue      # 体检扫描入口
│   │   │   └── analysis.vue  # 营养分析
│   │   ├── knowledge/
│   │   │   ├── index.vue     # 智能问答
│   │   │   ├── models.vue    # 模型配置
│   │   │   ├── manage.vue    # 知识库管理（可视化算法选择）
│   │   │   └── prompts.vue   # Prompt 管理
│   │   ├── menu.vue          # 个人餐单（8 类人群）
│   │   ├── menu/
│   │   │   ├── cafeteria.vue # 食堂餐单计划（食堂管理员）
│   │   │   └── shopping.vue  # 购物清单
│   │   └── admin/
│   │       ├── school.vue    # 学校管理（学校管理员）
│   │       ├── cafeteria.vue # 食堂后台（食堂管理员）
│   │       ├── students.vue  # 学生管理（学校管理员）
│   │       └── users.vue     # 用户管理（超管）
│   ├── components/
│   │   ├── NavBar.vue        # 角色差异化导航
│   │   └── OCRScanner.vue    # 体检报告扫描组件
│   ├── composables/
│   │   └── useAuthGuard.ts   # 统一 Auth Guard composable
│   ├── stores/
│   │   └── auth.ts           # Pinia Auth Store（15+ 角色 getter）
│   └── nuxt.config.ts
│
├── start.sh                  # macOS/Linux 一键启动
└── start.ps1                 # Windows 一键启动
```

---

## 角色权限说明

| 角色 | 可访问页面 |
|------|-----------|
| PARENT（家长） | 健康档案、餐单、智能问答 |
| STUDENT（学生） | 健康档案、餐单、智能问答 |
| SCHOOL_ADMIN（学校管理员） | 以上 + 学校管理、学生管理、食堂查看 |
| CAFETERIA_MANAGER（食堂管理员） | 以上 + 食堂管理、食堂餐单计划 |
| CAFETERIA_COOK（厨师） | 食堂管理（只读） |
| DOCTOR（医生/营养师） | 健康档案、营养分析、知识库管理 |
| INSTITUTION（机构） | 健康档案、营养分析 |
| ADMIN（超管） | 全部页面 + 用户管理 |

---

## 环境变量说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `MODELSCOPE_TOKEN` | ✅ | ModelScope API Token |
| `JWT_SECRET` | 否 | JWT 签名密钥，默认内置 |
| `PORT` | 否 | 后端端口，默认 3001 |
| `NODE_ENV` | 否 | 环境，默认 development |

---

## 使用的模型

| 功能 | 默认模型 | 可配置 |
|------|---------|--------|
| 体检报告 OCR | `Qwen/Qwen3-VL-235B-A22B-Instruct` | ✅ |
| AI 医生对话 | `Qwen/Qwen3-Next-80B-A3B-Instruct` | ✅ |
| 智能问答 | `Qwen/Qwen3-235B-A22B` | ✅ |
| 餐单生成 | `Qwen/Qwen3-235B-A22B` | ✅ |

均通过 ModelScope API 在线调用，无需本地 GPU。各功能模型可在「模型配置」页面独立切换。

---

## 常见问题

**Q: AI 对话返回"未配置 API Key"**
→ 检查 `backend/.env` 中 `MODELSCOPE_TOKEN`，或在「模型配置」页面在线填写

**Q: 健康档案页面空白**
→ 确认后端已启动：`curl http://localhost:3001/health`

**Q: 登录后跳转到 /login**
→ 后端未启动时，点击登录页的演示账号卡片可进入演示模式

**Q: 体检扫描失败**
→ 检查图片格式（支持 JPG/PNG），文件大小建议 < 5MB

---

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Node.js 18 + Fastify + LangChain/LangGraph |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (jsonwebtoken) + Pinia Auth Store |
| 前端 | Nuxt 3 + Vue 3 + Tailwind CSS |
| AI | ModelScope API (Qwen3 系列) |

---

## License

MIT
