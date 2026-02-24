<div align="center">

# 🥗 NutriMind — AI 智能健康营养助手

**拍一张体检报告，AI 帮你读懂身体、定制餐单、对话医生**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen)](https://nodejs.org)
[![Nuxt 3](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxt.js)](https://nuxt.com)
[![ModelScope](https://img.shields.io/badge/AI-ModelScope%20Qwen3-blue)](https://modelscope.cn)
[![Stars](https://img.shields.io/github/stars/kabishou11/openhealthy?style=social)](https://github.com/kabishou11/openhealthy/stargazers)

[快速开始](#-快速开始) · [功能演示](#-核心功能) · [演示账号](#-演示账号) · [技术栈](#-技术栈)

</div>

---

## ✨ 为什么选择 NutriMind？

> 你有没有拿到一张体检报告，看着密密麻麻的数字却不知道什么意思？
> 你有没有想过"我该怎么吃"，却只能靠感觉？
> **NutriMind 就是为了解决这些问题而生的。**

- 📷 **拍照上传体检报告** → AI 自动识别所有指标，异常项红色高亮
- 🤖 **和 AI 医生对话** → 基于你的真实体检数据，给出针对性建议
- 🍽️ **一键生成个性化餐单** → 8 类人群，7 天计划，AI 实时生成
- 🏫 **学校食堂管理** → 从学生体检到食堂配餐，全链路覆盖

---

## 🎯 核心功能

### 📋 健康档案 — 让体检报告"活"起来

```
上传体检表图片
    ↓
Qwen3-VL 视觉模型自动识别
    ↓
分组表格展示（血常规 / 肝功能 / 血脂 / 血糖...）
    ↓
异常指标红色高亮 + AI 总结分析
    ↓
一键跳转：AI 问答 / 定制餐单 / 推荐食谱
```

### 🤖 AI 医生对话 — 不是泛泛而谈，是基于你的数据

体检数据自动注入对话上下文，AI 医生知道你的白细胞是多少、血糖是否偏高，给出的建议真正针对你。支持流式输出，回复实时呈现。

### 🍽️ 个性化餐单 — 8 类人群，AI 实时生成

| 人群 | 热量目标 | 特点 |
|------|---------|------|
| 普通成人 | 1800 kcal | 均衡营养 |
| 学生 | 2000 kcal | 补脑补铁 |
| 老年人 | 1600 kcal | 易消化补钙 |
| 孕妇 | 2200 kcal | 叶酸 DHA 铁 |
| 健身增肌 | 2500 kcal | 高蛋白 |
| 减脂 | 1400 kcal | 低卡高饱腹 |
| 糖尿病 | 1600 kcal | 低 GI |
| 高血压 | 1700 kcal | DASH 饮食 |

点击「AI 重新生成」，后端调用 Qwen3 大模型，结合菜谱数据库实时生成 7 天餐单。

### 🏫 学校场景 — 从体检到食堂的完整闭环

- **学生管理**：BMI 统计、班级筛选、健康档案批量管理
- **食堂餐单**：周菜单计划、发布/草稿、过敏原标注、AI 排菜
- **角色权限**：8 种角色，各司其职，数据隔离

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- [ModelScope Token](https://www.modelscope.cn/my/token)（**免费注册**，无需信用卡）

### 一键启动

```bash
# 克隆项目
git clone https://github.com/kabishou11/openhealthy.git
cd openhealthy

# 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 配置 API Key（只需一步）
cd backend
echo "MODELSCOPE_TOKEN=你的Token" > .env

# 启动后端（终端 1）
npm run dev

# 启动前端（终端 2）
cd ../frontend && npm run dev
```

打开 http://localhost:3000 🎉

> **没有 Token？** 也没关系！登录页有演示模式，可以体验所有界面。
> **有 Token？** 在「模型配置」页面在线填写，无需重启服务。

---

## 🎭 演示账号

后端未启动时，点击登录页的演示账号卡片即可进入演示模式。

| 角色 | 手机号 | 密码 | 能看到什么 |
|------|--------|------|-----------|
| 👨‍👩‍👧 家长 | 13800138001 | 123456 | 孩子健康档案、餐单推荐 |
| 👨‍🎓 学生 | 13800138002 | 123456 | 个人健康档案、个性化餐单 |
| 🍽️ 食堂管理员 | 13800138003 | 123456 | 食堂菜单管理、AI 排菜 |
| 🏫 学校管理员 | 13800138004 | 123456 | 学生管理 + 学校配置 |
| 👨‍⚕️ 医生/营养师 | 13800138005 | 123456 | 健康分析 + 知识库 |
| 🔑 超级管理员 | 13800138000 | 123456 | **全部功能** |

---

## 🏗️ 项目结构

```
openhealthy/
├── backend/                    # Fastify API 服务（Node.js 18）
│   ├── src/
│   │   ├── routes/
│   │   │   ├── scan-health.ts      # 📷 OCR 体检扫描（Qwen3-VL）
│   │   │   ├── personal-health.ts  # 📋 健康档案 CRUD（用户隔离）
│   │   │   ├── analyze-health.ts   # 🤖 AI 医生对话（SSE 流式）
│   │   │   ├── chat.ts             # 💬 智能问答
│   │   │   ├── menu.ts             # 🍽️ AI 餐单生成
│   │   │   ├── auth.ts             # 🔐 JWT 登录/注册
│   │   │   └── models.ts           # ⚙️ 模型配置（统一 Key/URL）
│   │   ├── agents/                 # LangGraph AI Agents
│   │   └── models/db.ts            # SQLite 数据库
│   └── .env.example
│
├── frontend/                   # Nuxt 3 前端（Vue 3 + Tailwind）
│   ├── pages/
│   │   ├── health/
│   │   │   ├── records.vue     # 健康档案（扫描 + 展示 + AI 对话）
│   │   │   └── scan.vue        # 体检扫描入口
│   │   ├── knowledge/
│   │   │   ├── index.vue       # 智能问答
│   │   │   └── models.vue      # 模型配置
│   │   ├── menu.vue            # 个性化餐单（8 类人群 + AI 生成）
│   │   ├── menu/cafeteria.vue  # 食堂餐单计划
│   │   └── admin/              # 后台管理（学生/用户/食堂）
│   ├── components/
│   │   ├── NavBar.vue          # 角色差异化导航
│   │   └── OCRScanner.vue      # 体检报告扫描组件
│   └── stores/auth.ts          # Pinia Auth Store（15+ 角色 getter）
```

---

## 🤖 使用的 AI 模型

所有模型通过 **ModelScope API 在线调用**，无需本地 GPU，无需下载模型文件。

| 功能 | 默认模型 | 说明 |
|------|---------|------|
| 📷 体检报告 OCR | `Qwen3-VL-235B-A22B-Instruct` | 视觉语言模型，识别图片中的医疗数据 |
| 🤖 AI 医生对话 | `Qwen3-Next-80B-A3B-Instruct` | 基于体检数据的流式健康咨询 |
| 💬 智能问答 | `Qwen3-235B-A22B` | 营养健康知识问答 |
| 🍽️ 餐单生成 | `Qwen3-235B-A22B` | 结合菜谱数据库生成个性化餐单 |

各功能模型可在「模型配置」页面**独立切换**，支持 DeepSeek、Kimi、Llama 等 10+ 模型。

---

## 🔐 角色权限系统

```
ADMIN（超管）
  └── 全部功能 + 用户管理

SCHOOL_ADMIN（学校管理员）
  └── 学生管理 + 学校配置 + 食堂查看

CAFETERIA_MANAGER（食堂管理员）
  └── 食堂餐单计划 + AI 排菜

CAFETERIA_COOK（厨师）
  └── 食堂管理（只读）

DOCTOR / INSTITUTION（医生/机构）
  └── 健康档案 + 营养分析 + 知识库管理

PARENT / STUDENT（家长/学生）
  └── 个人健康档案 + 餐单 + 智能问答
```

---

## 🛠️ 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 后端框架 | Fastify + Node.js 18 | 高性能 API 服务 |
| AI 编排 | LangChain + LangGraph | 多 Agent 协作 |
| 数据库 | SQLite (better-sqlite3) | 零配置，开箱即用 |
| 认证 | JWT + Pinia Auth Store | 8 种角色，15+ getter |
| 前端框架 | Nuxt 3 + Vue 3 | SSR + 自动路由 |
| UI | Tailwind CSS + Nuxt UI | 响应式设计 |
| AI 模型 | ModelScope Qwen3 系列 | 在线 API，无需 GPU |

---

## ❓ 常见问题

**Q: 没有 ModelScope Token 能用吗？**
→ 可以！登录页点击演示账号卡片进入演示模式，所有界面都能体验。AI 功能需要 Token，[免费注册](https://www.modelscope.cn/my/token)即可获取。

**Q: AI 对话返回"未配置 API Key"**
→ 在「模型配置」页面在线填写 Token，无需重启服务。

**Q: 体检扫描失败**
→ 检查图片格式（JPG/PNG），建议文件 < 5MB，确保文字清晰可见。

**Q: 登录后一直跳回 /login**
→ 确认后端已启动：`curl http://localhost:3001/health`

---

## 🤝 贡献

欢迎 PR 和 Issue！如果这个项目对你有帮助，请点个 ⭐ Star，这是对我最大的鼓励。

```
Fork → 新建分支 → 提交改动 → 发起 PR
```

---

## 📄 License

[MIT](LICENSE) © 2024 NutriMind Contributors
