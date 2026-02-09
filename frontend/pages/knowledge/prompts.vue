<script setup lang="ts">
useSeoMeta({
  title: '提示词管理 - NutriMind',
  description: '管理系统提示词模板、Few-shot示例',
})

// Prompt types
type PromptType = 'system' | 'user' | 'fewshot' | 'context'

interface PromptTemplate {
  id: string
  name: string
  type: PromptType
  content: string
  description: string
  variables: string[]
  category: string
  isDefault: boolean
  usage: number
  createdAt: string
  updatedAt: string
}

// Helper function to format variable names
const formatVariable = (v: string) => `{{${v}}}`

// Sample prompts
const prompts = ref<PromptTemplate[]>([
  {
    id: 'sys-001',
    name: '营养专家系统提示词',
    type: 'system',
    category: 'general',
    description: 'NutriMind AI营养专家的默认系统提示词',
    content: `你是一位专业的营养健康顾问 NutriMind。你的职责是为用户提供科学、准确、实用的营养健康建议。

## 核心原则
1. **科学性优先**: 所有建议基于营养学研究和临床指南
2. **个性化**: 根据用户的健康状况、偏好制定建议
3. **实用性**: 提供可操作的饮食建议，而非泛泛而谈
4. **安全性**: 涉及疾病管理时，强调遵医嘱

## 专业领域
- 疾病饮食管理（糖尿病、高血压、痛风等）
- 中医食疗与体质调理
- 特殊人群营养（孕期、老年、儿童）
- 减脂瘦身与增肌
- 营养素补充指导

## 回复风格
- 使用清晰的标题和列表结构
- 适当使用emoji增加亲和力
- 重点内容加粗强调
- 提供具体食物推荐和替代方案
- 最后提醒如有特殊情况请咨询专业医生`,
    variables: ['user_profile', 'health_conditions', 'query'],
    isDefault: true,
    usage: 1234,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  },
  {
    id: 'sys-002',
    name: '糖尿病问答提示词',
    type: 'system',
    category: 'diabetes',
    description: '针对糖尿病用户的专业问答提示词',
    content: `你是糖尿病营养管理专家，专注于为糖尿病患者提供饮食指导。

## 糖尿病饮食核心原则
1. **控制总热量**: 根据患者体重、活动量计算每日所需热量
2. **选择低GI食物**: 优先选择GI<55的食物
3. **均衡营养**: 碳水45-60%，蛋白质15-20%，脂肪25-35%
4. **定时定量**: 规律进餐，避免血糖波动

## 推荐食物类别
- **主食**: 糙米、燕麦、红薯、荞麦
- **蔬菜**: 西兰花、菠菜、芹菜、苦瓜
- **水果**: 苹果、梨、柚子、草莓（适量）
- **蛋白质**: 鱼、豆腐、鸡胸肉、鸡蛋

## 禁忌食物
- 高GI食物：白米、白面包、糖果
- 高糖饮料：果汁、碳酸饮料
- 高脂肪食物：油炸食品、肥肉`,
    variables: ['blood_glucose', 'dietary_restrictions', 'meal_history'],
    isDefault: false,
    usage: 567,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-10',
  },
  {
    id: 'sys-003',
    name: '中医食疗提示词',
    type: 'system',
    category: 'tcm',
    description: '中医食疗体质调理的专业提示词',
    content: `你是中医食疗专家，擅长根据中医理论进行体质辨识和饮食调理。

## 八种基本体质
1. **平和质**: 健康体质，注意维持
2. **气虚质**: 易疲劳，气短乏力
3. **阳虚质**: 畏寒怕冷，手足不温
4. **阴虚质**: 口干咽燥，手足心热
5. **痰湿质**: 形体肥胖，腹满胸闷
6. **湿热质**: 面垢油光，易生痤疮
7. **血瘀质**: 面色晦暗，易现瘀斑
8. **气郁质**: 情志抑郁，善太息
9. **特禀质**: 过敏体质，先天异常

## 食疗原则
- **因人制宜**: 根据体质选择食物
- **因时制宜**: 四季养生侧重不同
- **因地制宜**: 考虑地域特点
- **食物性味**: 温热寒凉四气，酸苦甘辛咸五味

## 阴阳平衡
- 阴虚宜滋阴润燥
- 阳虚宜温补阳气
- 平和质注意阴阳平衡`,
    variables: ['constitution_type', 'season', 'symptoms'],
    isDefault: false,
    usage: 234,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-12',
  },
  {
    id: 'fs-001',
    name: '糖尿病饮食Few-shot示例',
    type: 'fewshot',
    category: 'diabetes',
    description: '糖尿病饮食建议的问答示例',
    content: `## 示例1
用户: 糖尿病早餐吃什么好？
助手: 糖尿病早餐建议选择低GI、高纤维的食物：
✅ 推荐：
- 杂粮粥（燕麦、糙米混合）+ 水煮蛋 + 凉拌黄瓜
- 全麦面包2片 + 无糖豆浆 + 坚果10g
- 燕麦牛奶 + 水煮蛋 + 小番茄

❌ 避免：
- 白粥加油条
- 甜面包、蛋糕
- 果汁、甜饮料

---
## 示例2
用户: 糖尿病能吃水果吗？
助手: 糖尿病患者可以适量吃水果，选择低GI水果：
✅ 推荐（GI<55）：
- 苹果、梨、柚子、草莓、樱桃
- 每天控制在200g以内

⚠️ 注意（GI>70）：
- 荔枝、龙眼、西瓜尽量避免
- 避免果汁，保留水果纤维

⏰ 建议在两餐之间食用，避免餐后立即吃水果`,
    variables: [],
    isDefault: false,
    usage: 189,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10',
  },
])

// Active category filter
const activeCategory = ref<string | null>(null)
const searchQuery = ref('')
const showEditor = ref(false)
const editingPrompt = ref<PromptTemplate | null>(null)
const activeTab = ref<'all' | 'system' | 'fewshot'>('all')

// Categories
const categories = computed(() => {
  const cats = new Set(prompts.value.map(p => p.category))
  return Array.from(cats).map(cat => ({
    id: cat,
    name: cat === 'general' ? '通用' : cat === 'diabetes' ? '糖尿病' : cat === 'tcm' ? '中医食疗' : cat,
    count: prompts.value.filter(p => p.category === cat).length,
  }))
})

// Filtered prompts
const filteredPrompts = computed(() => {
  return prompts.value.filter(prompt => {
    const matchesCategory = !activeCategory.value || prompt.category === activeCategory.value
    const matchesTab = activeTab.value === 'all' || prompt.type === activeTab.value
    const matchesSearch = !searchQuery.value ||
      prompt.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCategory && matchesTab && matchesSearch
  })
})

// Stats
const stats = computed(() => ({
  total: prompts.value.length,
  system: prompts.value.filter(p => p.type === 'system').length,
  fewshot: prompts.value.filter(p => p.type === 'fewshot').length,
  totalUsage: prompts.value.reduce((sum, p) => sum + p.usage, 0),
}))

// Editor
const createPrompt = () => {
  editingPrompt.value = {
    id: `prompt-${Date.now()}`,
    name: '',
    type: 'system',
    content: '',
    description: '',
    variables: [],
    category: 'general',
    isDefault: false,
    usage: 0,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  }
  showEditor.value = true
}

const editPrompt = (prompt: PromptTemplate) => {
  editingPrompt.value = { ...prompt }
  showEditor.value = true
}

const savePrompt = () => {
  if (!editingPrompt.value) return

  if (editingPrompt.value.id.startsWith('prompt-')) {
    prompts.value.push({ ...editingPrompt.value })
  }
  else {
    const index = prompts.value.findIndex(p => p.id === editingPrompt.value!.id)
    if (index >= 0) {
      prompts.value[index] = {
        ...editingPrompt.value,
        updatedAt: new Date().toISOString().split('T')[0],
      }
    }
  }

  showEditor.value = false
  editingPrompt.value = null
}

const deletePrompt = (id: string) => {
  const prompt = prompts.value.find(p => p.id === id)
  if (prompt?.isDefault) {
    alert('默认提示词不能删除')
    return
  }
  if (!confirm('确定要删除这个提示词吗？')) return
  prompts.value = prompts.value.filter(p => p.id !== id)
}

const duplicatePrompt = (prompt: PromptTemplate) => {
  const copy: PromptTemplate = {
    ...prompt,
    id: `prompt-${Date.now()}`,
    name: `${prompt.name} (副本)`,
    isDefault: false,
    usage: 0,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  }
  prompts.value.push(copy)
}

const setAsDefault = (id: string) => {
  const category = prompts.value.find(p => p.id === id)?.category
  prompts.value.forEach(p => {
    if (p.category === category) {
      p.isDefault = p.id === id
    }
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold mb-1">提示词管理</h1>
            <p class="text-amber-100 text-sm">管理AI回复的系统提示词和示例</p>
          </div>
          <button
            @click="createPrompt"
            class="px-3 py-1.5 bg-white text-amber-600 rounded-lg text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加提示词
          </button>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-6">
      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="card p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <div class="text-2xl font-bold">{{ stats.total }}</div>
          <div class="text-amber-100 text-xs">提示词</div>
        </div>
        <div class="card p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div class="text-2xl font-bold">{{ stats.system }}</div>
          <div class="text-blue-100 text-xs">系统</div>
        </div>
        <div class="card p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div class="text-2xl font-bold">{{ stats.fewshot }}</div>
          <div class="text-green-100 text-xs">Few-shot</div>
        </div>
        <div class="card p-4 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <div class="text-2xl font-bold">{{ stats.totalUsage.toLocaleString() }}</div>
          <div class="text-purple-100 text-xs">调用次数</div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid lg:grid-cols-4 gap-6">
        <!-- Sidebar: Categories -->
        <div class="lg:col-span-1">
          <div class="card p-4">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              分类筛选
            </h3>
            <div class="space-y-2">
              <button
                @click="activeCategory = null"
                class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all"
                :class="!activeCategory ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-50 text-gray-600'"
              >
                <span>全部</span>
                <span class="text-sm bg-gray-200 px-2 py-0.5 rounded-full">{{ stats.total }}</span>
              </button>
              <button
                v-for="cat in categories"
                :key="cat.id"
                @click="activeCategory = activeCategory === cat.id ? null : cat.id"
                class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all"
                :class="activeCategory === cat.id ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-50 text-gray-600'"
              >
                <span>{{ cat.name }}</span>
                <span class="text-sm bg-gray-200 px-2 py-0.5 rounded-full">{{ cat.count }}</span>
              </button>
            </div>
          </div>

          <div class="card p-4 mt-4">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              类型筛选
            </h3>
            <div class="flex flex-wrap gap-2">
              <button
                @click="activeTab = 'all'"
                class="px-3 py-1.5 rounded-lg text-sm transition-all"
                :class="activeTab === 'all' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              >
                全部
              </button>
              <button
                @click="activeTab = 'system'"
                class="px-3 py-1.5 rounded-lg text-sm transition-all"
                :class="activeTab === 'system' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              >
                系统提示词
              </button>
              <button
                @click="activeTab = 'fewshot'"
                class="px-3 py-1.5 rounded-lg text-sm transition-all"
                :class="activeTab === 'fewshot' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              >
                Few-shot
              </button>
            </div>
          </div>
        </div>

        <!-- Main: Prompts List -->
        <div class="lg:col-span-3">
          <!-- Search -->
          <div class="card p-4 mb-4">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索提示词名称、描述..."
                class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Prompts -->
          <div class="space-y-4">
            <div
              v-for="prompt in filteredPrompts"
              :key="prompt.id"
              class="card p-4 hover:shadow-lg transition-shadow"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 text-xs rounded-full"
                    :class="prompt.type === 'system' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'"
                  >
                    {{ prompt.type === 'system' ? '系统提示词' : 'Few-shot' }}
                  </span>
                  <span v-if="prompt.isDefault" class="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                    默认
                  </span>
                  <h3 class="font-semibold text-gray-900">{{ prompt.name }}</h3>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">使用 {{ prompt.usage }} 次</span>
                </div>
              </div>

              <p class="text-gray-600 text-sm mb-3">{{ prompt.description }}</p>

              <!-- Content Preview -->
              <div class="bg-gray-50 rounded-xl p-3 mb-3">
                <pre class="text-xs text-gray-600 whitespace-pre-wrap font-mono">{{ prompt.content.slice(0, 200) }}...</pre>
              </div>

              <!-- Variables -->
              <div v-if="prompt.variables.length > 0" class="flex flex-wrap gap-1 mb-3">
                <span class="text-xs text-gray-500">变量:</span>
                <span
                  v-for="v in prompt.variables"
                  :key="v"
                  class="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs"
                >
                  {{ formatVariable(v) }}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  @click="editPrompt(prompt)"
                  class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="编辑"
                >
                  <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="duplicatePrompt(prompt)"
                  class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="复制"
                >
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  v-if="!prompt.isDefault"
                  @click="setAsDefault(prompt.id)"
                  class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="设为默认"
                >
                  <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  @click="deletePrompt(prompt.id)"
                  class="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除"
                >
                  <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="filteredPrompts.length === 0" class="card p-8 text-center">
              <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-gray-500">未找到匹配的提示词</p>
              <button @click="createPrompt" class="mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors">
                添加新提示词
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Dialog -->
    <Teleport to="body">
      <div v-if="showEditor" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ editingPrompt?.id.startsWith('prompt-') ? '添加提示词' : '编辑提示词' }}
            </h2>
          </div>
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    v-model="editingPrompt!.name"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="提示词名称"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <select
                    v-model="editingPrompt!.type"
                    class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="system">系统提示词</option>
                    <option value="fewshot">Few-shot示例</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    v-model="editingPrompt!.category"
                    class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="general">通用</option>
                    <option value="diabetes">糖尿病</option>
                    <option value="tcm">中医食疗</option>
                    <option value="hypertension">高血压</option>
                  </select>
                </div>
                <div class="flex items-end">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="editingPrompt!.isDefault"
                      type="checkbox"
                      class="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span class="text-sm font-medium text-gray-700">设为默认</span>
                  </label>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <input
                  v-model="editingPrompt!.description"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="提示词用途描述"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <textarea
                  v-model="editingPrompt!.content"
                  rows="12"
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-mono text-sm"
                  placeholder="输入提示词内容，支持 {变量名} 格式..."
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">变量（逗号分隔，可选）</label>
                <input
                  v-model="variablesInput"
                  @blur="editingPrompt!.variables = variablesInput.split(',').map(v => v.trim()).filter(Boolean)"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="user_profile, health_conditions, query"
                />
              </div>
            </div>
          </div>
          <div class="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              @click="showEditor = false"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              @click="savePrompt"
              class="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
