<script setup lang="ts">
useSeoMeta({
  title: '知识库管理 - NutriMind',
  description: '管理营养知识库条目、批量导入导出、索引重建',
})

// Knowledge categories
const categories = [
  { id: 'guidelines', name: '膳食指南', icon: '📋' },
  { id: 'nutrition', name: '营养知识', icon: '🥗' },
  { id: 'diabetes', name: '糖尿病饮食', icon: '🍬' },
  { id: 'hypertension', name: '高血压饮食', icon: '❤️' },
  { id: 'fatty_liver', name: '脂肪肝调理', icon: '🫁' },
  { id: 'tcm', name: '中医食疗', icon: '🌿' },
  { id: 'gout', name: '痛风饮食', icon: '🦶' },
  { id: 'weight_loss', name: '减脂瘦身', icon: '⚡' },
  { id: 'pregnancy', name: '孕期营养', icon: '🤰' },
  { id: 'digestive_health', name: '消化健康', icon: '🥬' },
  { id: 'anemia', name: '贫血调理', icon: '🩸' },
  { id: 'osteoporosis', name: '骨骼健康', icon: '🦴' },
  { id: 'heart_health', name: '心脏健康', icon: '💓' },
  { id: 'food_compatibility', name: '食物相宜', icon: '⚖️' },
  { id: 'cooking_methods', name: '烹饪方法', icon: '🍳' },
  { id: 'eating_habits', name: '饮食习惯', icon: '🍽️' },
]

// Knowledge entry interface
interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: string
  source: string
  tags: string[]
  createdAt: string
  updatedAt: string
  status: 'published' | 'draft' | 'archived'
}

// Sample knowledge entries
const entries = ref<KnowledgeEntry[]>([
  {
    id: 'kb-001',
    title: '糖尿病饮食原则',
    content: '糖尿病饮食原则：控制总热量；均衡营养；定时定量进餐；增加膳食纤维摄入；选择低GI食物；限制简单糖类。低GI食物推荐：糙米、燕麦、红薯、豆类、大多数蔬菜、苹果、梨、柑橘类水果。',
    category: 'diabetes',
    source: '糖尿病营养治疗指南',
    tags: ['糖尿病', '血糖控制', '低GI'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    status: 'published',
  },
  {
    id: 'kb-002',
    title: '高血压DASH饮食',
    content: '高血压饮食（DASH）：富含水果、蔬菜、全谷物；低脂奶制品；限制饱和脂肪、胆固醇、精制糖和钠的摄入。降压饮食建议：多吃富含钾的食物（香蕉、橙子、土豆、菠菜）；增加钙摄入（奶制品、小鱼干）；限制钠盐（<5g/天）。',
    category: 'hypertension',
    source: '高血压营养管理指南',
    tags: ['高血压', 'DASH饮食', '降压'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    status: 'published',
  },
  {
    id: 'kb-003',
    title: '阴虚体质饮食宜忌',
    content: '阴虚体质饮食宜滋阴润燥：多吃梨、银耳、百合、麦冬、枸杞、蜂蜜等滋阴食物；忌辛辣、温燥食物如辣椒、姜、葱、蒜。推荐食疗方：银耳莲子羹、百合麦冬粥、雪梨蜂蜜水。',
    category: 'tcm',
    source: '中医食疗学',
    tags: ['阴虚体质', '滋阴', '食疗'],
    createdAt: '2024-01-16',
    updatedAt: '2024-01-16',
    status: 'published',
  },
  {
    id: 'kb-004',
    title: '痛风饮食禁忌',
    content: '痛风饮食原则：限制高嘌呤食物（动物内脏、海鲜、浓肉汤）；限制酒精（尤其是啤酒）；增加水分摄入；控制体重。痛风患者宜吃：低脂奶制品、鸡蛋、新鲜蔬菜、大量饮水。避免：动物内脏、浓肉汤、啤酒、海鲜。',
    category: 'gout',
    source: '痛风营养治疗指南',
    tags: ['痛风', '嘌呤', '饮食禁忌'],
    createdAt: '2024-01-17',
    updatedAt: '2024-01-17',
    status: 'published',
  },
  {
    id: 'kb-005',
    title: '孕期营养补充',
    content: '孕期营养原则：孕早期无需额外热量；孕中晚期每天增加200-300kcal；补充叶酸、铁、钙、DHA；避免生食和酒精。孕期推荐食物：深绿色蔬菜（叶酸）；红肉、动物肝脏（铁）；奶制品、豆腐（钙）；深海鱼（DHA）。',
    category: 'pregnancy',
    source: '孕期营养指南',
    tags: ['孕期', '营养补充', '叶酸'],
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18',
    status: 'published',
  },
])

const selectedCategory = ref<string | null>(null)
const searchQuery = ref('')
const showEditor = ref(false)
const editingEntry = ref<KnowledgeEntry | null>(null)
const isReindexing = ref(false)
const showImportDialog = ref(false)

// Filtered entries
const filteredEntries = computed(() => {
  return entries.value.filter(entry => {
    const matchesCategory = !selectedCategory.value || entry.category === selectedCategory.value
    const matchesSearch = !searchQuery.value ||
      entry.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.value.toLowerCase()))
    return matchesCategory && matchesSearch
  })
})

// Stats
const stats = computed(() => {
  const byCategory = categories.map(cat => ({
    ...cat,
    count: entries.value.filter(e => e.category === cat.id && e.status === 'published').length,
  }))
  return {
    total: entries.value.length,
    published: entries.value.filter(e => e.status === 'published').length,
    drafts: entries.value.filter(e => e.status === 'draft').length,
    byCategory,
  }
})

// CRUD operations
const createEntry = () => {
  editingEntry.value = {
    id: `kb-${Date.now()}`,
    title: '',
    content: '',
    category: 'nutrition',
    source: '',
    tags: [],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    status: 'draft',
  }
  showEditor.value = true
}

const editEntry = (entry: KnowledgeEntry) => {
  editingEntry.value = { ...entry }
  showEditor.value = true
}

const saveEntry = () => {
  if (!editingEntry.value) return

  if (editingEntry.value.id.startsWith('kb-new')) {
    entries.value.push({ ...editingEntry.value, id: `kb-${Date.now()}` })
  }
  else {
    const index = entries.value.findIndex(e => e.id === editingEntry.value!.id)
    if (index >= 0) {
      entries.value[index] = {
        ...editingEntry.value,
        updatedAt: new Date().toISOString().split('T')[0],
      }
    }
  }

  showEditor.value = false
  editingEntry.value = null
}

const deleteEntry = (id: string) => {
  if (!confirm('确定要删除这条知识吗？')) return
  entries.value = entries.value.filter(e => e.id !== id)
}

const toggleStatus = (entry: KnowledgeEntry) => {
  entry.status = entry.status === 'published' ? 'draft' : 'published'
  entry.updatedAt = new Date().toISOString().split('T')[0]
}

// Reindex
const reindex = async () => {
  isReindexing.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  isReindexing.value = false
}

// Export
const exportData = () => {
  const data = JSON.stringify(filteredEntries.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url = `knowledge-base-${new Date().toISOString().
  a.downloadsplit('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold mb-1">知识库管理</h1>
            <p class="text-blue-100 text-sm">管理营养知识条目、分类、标签</p>
          </div>
          <div class="flex gap-2">
            <button
              @click="showImportDialog = true"
              class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              批量导入
            </button>
            <button
              @click="exportData"
              class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出
            </button>
            <button
              @click="reindex"
              :disabled="isReindexing"
              class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <svg class="w-4 h-4" :class="{ 'animate-spin': isReindexing }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ isReindexing ? '索引中...' : '重建索引' }}
            </button>
            <button
              @click="createEntry"
              class="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              添加知识
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="card p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div class="text-2xl font-bold">{{ stats.total }}</div>
          <div class="text-blue-100 text-xs">知识条目</div>
        </div>
        <div class="card p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div class="text-2xl font-bold">{{ stats.published }}</div>
          <div class="text-green-100 text-xs">已发布</div>
        </div>
        <div class="card p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <div class="text-2xl font-bold">{{ stats.drafts }}</div>
          <div class="text-amber-100 text-xs">草稿</div>
        </div>
        <div class="card p-4 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <div class="text-2xl font-bold">{{ categories.length }}</div>
          <div class="text-purple-100 text-xs">分类</div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid lg:grid-cols-4 gap-6">
        <!-- Sidebar: Categories -->
        <div class="lg:col-span-1 space-y-4">
          <div class="card p-4">
            <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              知识分类
            </h3>
            <div class="space-y-1">
              <button
                @click="selectedCategory = null"
                class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all"
                :class="!selectedCategory ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'"
              >
                <span class="flex items-center gap-2">
                  <span class="text-base">📁</span>
                  全部
                </span>
                <span class="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{{ stats.total }}</span>
              </button>
              <button
                v-for="cat in stats.byCategory"
                :key="cat.id"
                @click="selectedCategory = selectedCategory === cat.id ? null : cat.id"
                class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all"
                :class="selectedCategory === cat.id ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'"
              >
                <span class="flex items-center gap-2">
                  <span class="text-base">{{ cat.icon }}</span>
                  {{ cat.name }}
                </span>
                <span class="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{{ cat.count }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Main: Entries List -->
        <div class="lg:col-span-3 space-y-4">
          <!-- Search -->
          <div class="card p-3">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索知识..."
                class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Entries -->
          <div class="space-y-3">
            <div
              v-for="entry in filteredEntries"
              :key="entry.id"
              class="card p-4 hover:shadow-md transition-shadow"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm">{{ categories.find(c => c.id === entry.category)?.icon }}</span>
                    <h3 class="font-medium text-gray-900 truncate">{{ entry.title }}</h3>
                    <span
                      class="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                      :class="entry.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                    >
                      {{ entry.status === 'published' ? '已发布' : '草稿' }}
                    </span>
                  </div>
                  <p class="text-gray-600 text-sm line-clamp-2 mb-2">{{ entry.content }}</p>
                  <div class="flex items-center gap-3 text-xs text-gray-500">
                    <span>{{ entry.source }}</span>
                    <span>{{ entry.updatedAt }}</span>
                  </div>
                  <div class="flex flex-wrap gap-1 mt-2">
                    <span
                      v-for="tag in entry.tags"
                      :key="tag"
                      class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    @click="toggleStatus(entry)"
                    class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    :title="entry.status === 'published' ? '设为草稿' : '发布'"
                  >
                    <svg v-if="entry.status === 'published'" class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </button>
                  <button
                    @click="editEntry(entry)"
                    class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="deleteEntry(entry.id)"
                    class="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="filteredEntries.length === 0" class="card p-8 text-center">
              <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-gray-500 text-sm">暂无知识条目</p>
              <button @click="createEntry" class="mt-3 px-4 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors">
                添加知识
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Dialog -->
    <Teleport to="body">
      <div v-if="showEditor" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ editingEntry?.id.startsWith('kb-new') ? '添加知识' : '编辑知识' }}
            </h2>
          </div>
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  v-model="editingEntry!.title"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="输入知识标题"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    v-model="editingEntry!.category"
                    class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                      {{ cat.icon }} {{ cat.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">来源</label>
                  <input
                    v-model="editingEntry!.source"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="知识来源"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <textarea
                  v-model="editingEntry!.content"
                  rows="6"
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="输入知识内容..."
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">标签（逗号分隔）</label>
                <input
                  v-model="tagsInput"
                  type="text"
                  @blur="editingEntry!.tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)"
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="标签1, 标签2, 标签3"
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
              @click="saveEntry"
              class="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Import Dialog -->
    <Teleport to="body">
      <div v-if="showImportDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-xl font-semibold text-gray-900">批量导入知识</h2>
          </div>
          <div class="p-6">
            <div class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-gray-600 mb-2">拖拽JSON文件到此处，或点击选择文件</p>
              <p class="text-sm text-gray-400">支持 JSON 格式，每条记录包含 title、content、category、source、tags 字段</p>
              <button class="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors">
                选择文件
              </button>
            </div>
          </div>
          <div class="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              @click="showImportDialog = false"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              class="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
            >
              导入
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
