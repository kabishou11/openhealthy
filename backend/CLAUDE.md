# NutriMind AI Nutrition Assistant - Project Documentation

> Last Updated: 2026-02-06
> Version: 2.1

## Progress Tracker

### ✅ Completed
- [x] Basic Fastify API setup
- [x] LangChain integration with ChatOpenAI
- [x] Recipe database: **93 recipes** (8 categories)
- [x] Nutrition database: **60+ foods** (12 categories)
- [x] User health profile management
- [x] Basic multi-agent system (4 agents)
- [x] Chat endpoints with WebSocket support
- [x] Fallback mock responses when no API key
- [x] RAG knowledge base: 50+ nutrition knowledge chunks
- [x] Frontend: Fluid cursor, animations, clamp typography
- [x] Frontend pages: Home, Chat, Recipes, Menu, Analysis
- [x] Fixed fluid cursor to show native cursor with trail effect

### 🚧 In Progress
- [ ] Complete LangGraph workflow implementation
- [ ] Connect RAG knowledge base to agents
- [ ] Design school scenario module (health checkup scanning, parent notifications)

### 📋 Pending
- [ ] User health profile API integration
- [ ] Image-based food recognition
- [ ] Voice input/output
- [ ] Real vector database for RAG
- [ ] TCM knowledge base
- [ ] School module: PE teacher dashboard
- [ ] School module: Parent notification system
- [ ] School module: Hospital integration API

## Project Vision

A comprehensive AI-powered nutrition assistant that replaces human nutritionists, targeting:
- **Personal Users**: Family nutrition advisor
- **Schools**: Student meal planning (with health checkup scanning)
- **Hospitals**: Clinical dietary prescriptions
- **Enterprises**: Employee healthy meal planning
- **Nursing Homes**: Elderly nutrition management

## School Scenario Module

### Overview

The school scenario transforms NutriMind into a comprehensive student health management platform that integrates:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         学校营养管理平台 (School Module)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │  📋 体检数据扫描   │    │  🍽️ AI餐单规划   │    │  📱 家长推送系统      │  │
│  │  Health Checkup  │    │  Meal Planning   │    │  Parent Notifications │  │
│  │  OCR 数据提取     │    │  个性化配餐      │    │  微信/短信           │  │
│  └────────┬─────────┘    └────────┬─────────┘    └──────────┬───────────┘  │
│           │                       │                       │                │
│           └───────────────────────┼───────────────────────┘                │
│                                   ▼                                          │
│                    ┌──────────────────────────────────┐                    │
│                    │     🏫 学校管理后台              │                    │
│                    │   PE教师/管理员控制台            │                    │
│                    └──────────────────────────────────┘                    │
│                                   │                                          │
│           ┌───────────────────────┼───────────────────────┐                 │
│           ▼                       ▼                       ▼                 │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────────┐  │
│  │  👨‍⚕️ 营养师/医院  │   │  📊 营养分析报告  │   │  🔒 数据安全与隐私      │  │
│  │  专业支持接口     │   │  可视化看板      │   │  学生数据保护           │  │
│  └──────────────────┘   └──────────────────┘   └──────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. 体检数据扫描 (Health Checkup Data Scanning)

#### OCR 数据提取流程

```
学生体检报告 (纸质/PDF)
        │
        ▼
┌───────────────┐
│  上传/扫描    │ ──→ 支持批量上传
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  OCR识别引擎  │ ──→ Tesseract / 百度OCR / 阿里云OCR
└───────┬───────┘
        │
        ▼
┌─────────────────────────┐
│  关键数据字段提取        │
│  ├─ 身高/体重           │
│  ├─ BMI值              │
│  ├─ 视力检测           │
│  ├─ 血压               │
│  ├─ 血糖/血脂           │
│  ├─ 肝功能             │
│  └─ 过敏原/既往病史     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  AI 数据校验与补全      │
│  ├─ 异常值标记         │
│  ├─ 数据标准化         │
│  └─ 缺失字段推断       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  学生健康档案           │
│  Student Health Profile │
│  (存入数据库)          │
└─────────────────────────┘
```

#### 体检报告数据模型

```typescript
interface HealthCheckupData {
  studentId: string;
  checkupDate: Date;
  schoolYear: string;        // 学年: "2024-2025"
  grade: string;             // 年级: "高一"
  class: string;             // 班级: "1班"

  // 基础身体数据
  basicData: {
    height: number;          // 身高 cm
    weight: number;         // 体重 kg
    bmi: number;            // BMI
    bmiCategory: '偏瘦' | '正常' | '偏胖' | '肥胖';
    waistline?: number;     // 腰围 cm
    bodyFat?: number;        // 体脂率 %
  };

  // 视力检测
  vision: {
    leftEye: number;
    rightEye: number;
    isMyopic: boolean;
    myopiaLevel?: '轻度' | '中度' | '重度';
  };

  // 血压
  bloodPressure?: {
    systolic: number;        // 收缩压
    diastolic: number;       // 舒张压
    status: '正常' | '偏高' | '偏低';
  };

  // 血液检测
  bloodTest?: {
    fastingGlucose?: number; // 空腹血糖
    triglycerides?: number;  // 甘油三酯
    totalCholesterol?: number; // 总胆固醇
    liverFunction?: {
      alt?: number;         // 谷丙转氨酶
      ast?: number;         // 谷草转氨酶
    };
  };

  // 健康风险评估
  riskAssessment: {
    obesityRisk: 'low' | 'medium' | 'high';
    malnutritionRisk: 'low' | 'medium' | 'high';
    hypertensionRisk: 'low' | 'medium' | 'high';
    diabetesRisk: 'low' | 'medium' | 'high';
    fattyLiverRisk: 'low' | 'medium' | 'high';
  };

  // 过敏原与禁忌
  allergies: string[];       // 过敏原: ["花生", "虾", "牛奶"]
  dietaryRestrictions: string[]; // 饮食禁忌: ["不吃猪肉", "素食主义"]

  // 特殊需求
  specialNeeds?: {
    isAthleticStudent: boolean; // 体育特长生
    isInRecovery: boolean;       // 康复期学生
    hasChronicCondition?: string; // 慢性病: "糖尿病", "哮喘"
  };
}
```

### 2. AI 智能配餐系统

#### 个性化餐单生成

```typescript
interface StudentMealPlan {
  studentId: string;
  planWeek: string;          // 计划周期: "2024-03-11 至 2024-03-17"
  dailyMeals: {
    date: string;
    breakfast?: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks?: Snack[];
  }[];
  nutritionTargets: {
    calories: number;         // 目标热量
    protein: number;         // 蛋白质 g
    fat: number;             // 脂肪 g
    carbohydrates: number;  // 碳水 g
    fiber: number;           // 膳食纤维 g
    calcium?: number;        // 钙 mg (生长发育期)
    iron?: number;           // 铁 mg
    vitaminA?: number;       // 维生素A μg
  };
  recommendations: string[]; // 饮食建议
  warnings: string[];        // 注意事项
}

interface Meal {
  name: string;              // 餐次名称
  dishes: Dish[];
  totalNutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
  nutritionScore: number;    // 营养评分 0-100
}

interface Dish {
  name: string;
  portion: number;          // 份量 (g)
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
  isRecommended: boolean;   // 是否推荐菜品
  tags: string[];           // 标签: ["高蛋白", "护眼", "补铁"]
}
```

#### 按年级营养标准

| 年级 | 热量 (kcal) | 蛋白质 (g) | 脂肪 (g) | 钙 (mg) | 特点 |
|------|------------|------------|----------|---------|------|
| 小学1-3年级 | 1400-1600 | 45-55 | 40-50 | 800 | 少食多餐，软烂易嚼 |
| 小学4-6年级 | 1600-1800 | 55-65 | 45-55 | 1000 | 注意补铁 |
| 初中 | 1800-2000 | 65-75 | 50-60 | 1000 | 生长发育高峰 |
| 高中 | 2000-2200 | 70-80 | 55-65 | 1000 | 脑力消耗大 |

### 3. PE教师管理后台

#### 教师控制台功能

```
🏫 XX中学 - 营养管理控制台
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 数据概览
├─ 在校学生: 1,250人
├─ 已建档: 1,180人 (94.4%)
├─ 特殊饮食需求: 86人 (6.9%)
└─ 本周配餐完成率: 100%

👥 学生健康管理
├─ 🔍 搜索/筛选学生
│   ├─ 按班级: [高一] ▾ [全部]
│   ├─ 按BMI: [偏胖] ▾ [全部]
│   └─ 按风险: [高风险] ▾ [全部]
├─ 📋 体检数据导入
│   └─ 支持批量上传 / OCR扫描
├─ 📝 个性化方案调整
└─ 📞 联系家长

📈 营养分析看板
├─ 全校BMI分布饼图
├─ 各年级营养摄入趋势
├─ 食堂菜品评分排行
└─ 异常指标预警列表

📤 消息推送
├─ 📱 微信模板消息
├─ 📲 短信推送
└─ 📧 邮件报告
```

### 4. 家长通知系统

#### 推送内容示例

```
📱 微信小程序推送

NutriMind 营养小助手
────────────────────────────────────
尊敬的家长，张三的本周营养餐单已生成

🍽️ 今日推荐午餐
• 红烧鸡腿 (优质蛋白)
• 清炒时蔬 (膳食纤维)
• 紫菜蛋花汤 (补碘)

📊 营养摄入: 达标 ✅
⚠️ 提醒: 多喝水，少吃零食

[查看详细餐单]
```

#### 通知类型与模板

| 触发条件 | 渠道 | 模板ID | 内容 |
|---------|------|--------|------|
| 体检报告生成 | 微信 | TM001 | 尊敬的家长，{{student_name}}的{{checkup_date}}体检报告已生成 |
| 餐单每周更新 | 微信 | TM002 | {{student_name}}本周营养餐单已更新 |
| 营养指标异常 | 微信+短信 | TM003 | 提醒：{{student_name}}的{{indicator}}指标异常 |
| 饮食过敏风险 | 微信+短信 | TM004 | 重要：{{student_name}}对{{allergy}}过敏，请注意 |
| 月度报告 | 邮件 | EM001 | {{student_name}}月度营养健康报告 |

### 5. 营养师/医院专业支持

#### API 接口设计

```typescript
// 学生转诊请求
interface ReferralRequest {
  referralId: string;
  studentId: string;
  hospitalId: string;
  referralType: 'nutrition_consultation' | 'dietary_prescription';
  reason: string;  // 转诊原因，如 "肥胖症合并脂肪肝"
  checkupData: HealthCheckupData;
  currentMealPlan: StudentMealPlan;
  aiAnalysis: string;  // AI初步分析
  referralDate: string;
  status: 'pending' | 'approved' | 'completed';
}

// API Endpoints
POST /api/v1/school/hospital/referral       // 学生转诊请求
POST /api/v1/school/hospital/consultation    // 在线会诊请求
GET /api/v1/school/hospital/patient/:id     // 获取患者营养史
POST /api/v1/school/hospital/dietary-prescription  // 接收饮食处方
```

#### 支持场景

- 学生肥胖症/营养不良专业干预
- 慢性病学生(如糖尿病)饮食处方
- 术后康复期学生营养支持
- 过敏学生脱敏治疗配合饮食管理
- 生长发育迟缓学生专业评估

### 6. 数据安全与隐私

```
访问控制
├─ PE教师: 只能查看所管理班级学生数据
├─ 校医: 可查看全校学生健康数据
├─ 营养师: 需学生授权后可查看详细数据
├─ 家长: 仅可查看自己孩子数据
└─ 管理员: 全部数据访问权限

隐私保护
├─ 学生姓名脱敏显示 (仅显示"张**")
├─ 体检数据仅必要人员可见
├─ 数据传输全程加密 (TLS 1.3)
├─ 数据存储加密 (AES-256)
└─ 日志审计追踪

合规性
├─ 符合《个人信息保护法》
├─ 符合《儿童个人信息网络保护规定》
├─ 符合《学校卫生工作条例》
└─ 数据本地化存储 (学校服务器/教育云)
```

## Tech Stack

### Backend
- **Runtime**: Node.js 18+ (ESM modules)
- **Framework**: Fastify.js
- **AI Orchestration**: LangChain + LangGraph
- **LLM**: OpenAI GPT-4o (configurable)
- **Database**: In-memory (dev) / PostgreSQL (production)
- **Caching**: Redis

### Frontend
- **Framework**: Nuxt 3 (Vue 3)
- **Styling**: Tailwind CSS
- **Animations**: Custom WebGL fluid cursor, CSS animations
- **State**: Pinia

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Nuxt 3)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Chat UI    │  │  Menu Plan  │  │  Analysis Dashboard    │ │
│  │  (Voice)    │  │  (Recipes)  │  │  (Charts)              │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     API Layer (Fastify)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  /chat   │ │ /menu    │ │ /nutrition│ │ /health         │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                LangGraph Agent Orchestration                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Agent Network                         │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────┐  │   │
│  │  │ Coordinator│ │ Nutrition │ │  Diet     │ │ Menu   │  │   │
│  │  │   Agent   │ │ Analyzer  │ │ Therapy   │ │ Planner│  │   │
│  │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └────┬───┘  │   │
│  │        └─────────────┴─────────────┴────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↑                                   │
│                    LangGraph State Graph                       │
├─────────────────────────────────────────────────────────────────┤
│                        MCP Tools Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  howtocook  │  nutrition-db  │  user-health  │ food-rec │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        RAG Knowledge Base                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  菜谱数据库   │  │  营养学知识  │  │  临床食疗案例     │   │
│  │  (300+ recipes)│ │ (膳食指南) │ │ (疾病饮食方案)    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Multi-Agent Design

### Agent 1: Coordinator Agent (协调者)

**Role**: Orchestrates the entire workflow, routing requests to appropriate agents.

**Capabilities**:
- Intent classification
- Task delegation
- Response synthesis
- Context management

**LangGraph Node**: `coordinator`

### Agent 2: Nutrition Analyzer Agent (营养分析)

**Role**: Analyzes user health data and calculates nutritional requirements.

**Capabilities**:
- BMI/BMR/TDEE calculation
- Macronutrient distribution
- Dietary structure analysis
- Health report generation

**LangGraph Node**: `nutrition_analyzer`

### Agent 3: Diet Therapy Expert Agent (食疗专家)

**Role**: TCM-based dietary recommendations.

**Capabilities**:
- Constitution analysis (体质分析)
- Seasonal adjustments
- Food nature properties (食物性味)
- Disease-specific therapy

**LangGraph Node**: `diet_therapy_expert`

### Agent 4: Menu Planner Agent (菜单规划)

**Role**: Generates personalized meal plans.

**Capabilities**:
- Weekly/monthly menu generation
- Nutritional target matching
- Ingredient optimization
- Recipe selection

**LangGraph Node**: `menu_planner`

### Agent 5: Health Advisor Agent (健康顾问)

**Role**: Natural language conversation about nutrition.

**Capabilities**:
- Q&A about nutrition
- Health tips
- Behavior motivation
- Emotional support

**LangGraph Node**: `health_advisor`

## LangGraph State Definition

```typescript
interface NutriMindState {
  // User context
  userProfile: UserProfile | null;
  healthData: HealthData | null;

  // Conversation
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;

  // Task context
  currentTask: string | null;
  taskResult: Record<string, unknown>;

  // Recommendations
  recommendations: Recommendation[];
  nutritionReport: string | null;

  // System
  error: string | null;
  needsHumanReview: boolean;
}
```

## LangGraph Workflow

```
START
  │
  ▼
┌─────────────────┐
│  Coordinator    │ ←── User message
│  (Intent Class) │
└────────┬────────┘
         │
         ├─────────────────────────────────────────────┐
         │                                             │
         ▼                                             ▼
┌─────────────────┐                          ┌─────────────────┐
│ Nutrition       │                          │ Health Advisor  │
│ Analyzer        │                          │ (Simple Q&A)    │
└────────┬────────┘                          └────────┬────────┘
         │                                            │
         │         ┌─────────────────┐                │
         │         │ Diet Therapy    │                │
         │         │ Expert          │                │
         │         └────────┬────────┘                │
         │                  │                         │
         │         ┌────────▼────────┐                │
         │         │ Menu Planner    │                │
         │         │ (Meal Planning) │                │
         │         └────────┬────────┘                │
         │                  │                         │
         └──────────────────┼─────────────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │ Coordinator     │ ←── Synthesize response
                  │ (Final Response)│
                  └────────┬────────┘
                           │
                           ▼
                        END
```

## Data Sources

### Recipe Database (HowToCook)
- **Source**: [Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook)
- **Count**: 300+ Chinese recipes
- **Format**: JSON with ingredients, steps, nutrition

### Nutrition Data
- **Chinese Food Composition Table** (中国食物营养成分表)
- **Chinese Dietary Guidelines 2022** (中国居民膳食指南2022)
- **USDA FoodData Central**

### TCM Knowledge
- **中医食疗学** - TCM Diet Therapy
- **食物性味归经** - Food nature, flavor, meridian
- **体质分类** - Constitution types

### Clinical Guidelines
- **糖尿病饮食指南** - Diabetes diet
- **高血压饮食建议** - Hypertension diet
- **痛风饮食禁忌** - Gout diet

## Design Principles

### 1. Visual Design (from whatToEat)

```css
/* Fluid WebGL cursor effect */
.cursor-fluid {
  filter: url('#fluid-filter');
  mix-blend-mode: screen;
}

/* Responsive typography */
body {
  font-size: clamp(14px, 2vw, 18px);
}

/* Warm, caring color palette */
:root {
  --primary: #FF6B6B;
  --secondary: #4ECDC4;
  --warm-bg: #FFF9F5;
  --text: #2D3436;
}
```

### 2. User Experience

- **Single purpose per page**: Each page solves one problem
- **Fun interactions**: Random抽取, emoji feedback animations
- **Warmth**: Soft colors, caring tone, professional but friendly
- **Data visualization**: Charts for nutrition, trends

### 3. Code Patterns

```typescript
// Agent implementation pattern
class BaseAgent {
  protected llm: ChatOpenAI;
  protected tools: StructuredTool[];

  async execute(input: string): Promise<AgentResult> {
    // 1. Think about the task
    const thought = await this.think(input);
    // 2. Execute tools if needed
    const toolResults = await this.executeTools(thought);
    // 3. Synthesize response
    return this.synthesize(thought, toolResults);
  }
}

// LangGraph node pattern
function nutritionAnalyzerNode(state: NutriMindState): NutriMindState {
  const result = nutritionAgent.execute(state.userQuery);
  return {
    ...state,
    nutritionReport: result.report,
    recommendations: result.recommendations,
  };
}
```

## API Endpoints

### Chat
- `POST /api/v1/chat` - Send message, get AI response
- `GET /api/v1/chat/:sessionId` - Get conversation history

### Menu
- `GET /api/v1/menu/recipes` - List recipes
- `GET /api/v1/menu/recipes/:id` - Get recipe details
- `POST /api/v1/menu/generate` - Generate meal plan
- `GET /api/v1/menu/categories` - Get recipe categories

### Nutrition
- `GET /api/v1/nutrition/foods` - Search foods
- `POST /api/v1/nutrition/calculate` - Calculate meal nutrition
- `POST /api/v1/nutrition/analyze` - Analyze user nutrition needs
- `GET /api/v1/nutrition/trends/:userId` - Get health trends

### Health
- `GET /health` - Health check
- `GET /status/agents` - Agent status
- `GET /ready` - Readiness check

### WebSocket
- `WS /ws/chat` - Real-time chat

## Environment Variables

```env
# API
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:1420
```

## Development Notes

### LangChain Correct Usage

**DO**:
```typescript
// Use proper message format
const messages = [
  new SystemMessage(systemPrompt),
  new HumanMessage(userInput),
];

// Use structured output
const structuredOutput = llm.withStructuredOutput(schema);
```

**DON'T**:
```typescript
// Don't use role/content directly in newer versions
{ role: 'system', content: '...' }  // Deprecated format
```

### LangGraph Integration

**State Management**:
```typescript
// Always return new state object
function node(state: State): State {
  return { ...state, updated: true };
}
```

**Conditional Edges**:
```typescript
graph.add_conditional_edges('node', (state) => {
  if (state.needsHumanReview) return 'human';
  return 'continue';
});
```

## Known Issues & Solutions

1. **OpenAI API Key Missing**
   - Status: ✅ Fixed with mock LLM fallback
   - When no API key: System uses mock responses for testing

2. **TypeScript Strict Mode**
   - Status: ✅ Relaxed to `strict: false`
   - Reason: Many any types from browser APIs

3. **Voice AI Browser APIs**
   - Status: ✅ Moved to frontend-only
   - Backend: Stub implementation

## Future Improvements

- [ ] Add actual LangGraph workflow with proper state
- [ ] Implement RAG with vector database (Pinecone/Weaviate)
- [ ] Add database persistence (PostgreSQL)
- [ ] Implement voice input/output
- [ ] Add image-based food recognition
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## File Structure

```
backend/
├── src/
│   ├── agents/              # LangChain/LangGraph agents
│   │   └── langchain-agents.ts
│   ├── mcp_tools/           # Model Context Protocol tools
│   │   ├── howtocook.ts
│   │   ├── nutrition-db.ts
│   │   └── user-health.ts
│   ├── routes/              # Fastify routes
│   │   ├── chat.ts
│   │   ├── menu.ts
│   │   ├── nutrition.ts
│   │   └── health.ts
│   ├── integrations/        # External integrations
│   │   ├── voice-ai.ts
│   │   └── food-recognition.ts
│   ├── websocket/           # WebSocket handlers
│   ├── rag/                 # RAG knowledge base
│   ├── types/               # TypeScript types
│   ├── utils/               # Utilities
│   └── index.ts             # Entry point
├── package.json
└── tsconfig.json

frontend/
├── pages/                   # Nuxt pages
├── components/              # Vue components
├── composables/             # Vue composables
├── stores/                  # Pinia stores
├── assets/                  # Static assets
├── app.vue
└── nuxt.config.ts
```

---

> This document should be updated whenever significant changes are made to the architecture, agent design, or technical decisions.
