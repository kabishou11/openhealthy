<script setup lang="ts">
useSeoMeta({ title: '健康档案 - NutriMind', description: '查看和管理您的体检健康档案' })

const API_BASE = ''
const router = useRouter()

interface ScanItem { key: string; value: string; unit: string; ref: string; status: string }
interface ScanGroup { name: string; items: ScanItem[] }
interface ChatMsg { role: 'user' | 'assistant'; content: string }

const records       = ref<any[]>([])
const loading       = ref(true)
const showScanner   = ref(false)
const deleting      = ref<string | null>(null)
const searchQuery   = ref('')
const showManualAdd = ref(false)

// 展开的卡片 ID
const expandedId = ref<string | null>(null)
// 当前 tab: 'data' | 'summary' | 'chat'
const activeTab  = ref<Record<string, string>>({})

// 编辑状态（per record）
const editingId   = ref<string | null>(null)
const editTitle   = ref('')
const editDate    = ref('')
const editNotes   = ref('')
const editSummary = ref('')
const editGroups  = ref<ScanGroup[]>([])
const isSaving    = ref(false)

// 手动添加
const manualTitle  = ref('')
const manualDate   = ref(new Date().toISOString().split('T')[0])
const manualNotes  = ref('')
const manualGroups = ref<ScanGroup[]>([{ name: '检测指标', items: [{ key: '', value: '', unit: '', ref: '', status: 'unknown' }] }])
const manualSaving = ref(false)

// AI 对话（per record）
const chatHistory  = ref<Record<string, ChatMsg[]>>({})
const chatInput    = ref<Record<string, string>>({})
const chatLoading  = ref<Record<string, boolean>>({})

// ── 数据加载 ──
const loadRecords = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/api/v1/personal-health`)
    if (res.ok) { const d = await res.json(); records.value = d.data || [] }
    else { console.error('loadRecords failed:', res.status, await res.text()) }
  } catch (e) { console.error('loadRecords error:', e) } finally { loading.value = false }
}

// ── 加载单条详情（含 image_data 等大字段）──
const loadDetail = async (id: string) => {
  const idx = records.value.findIndex(r => r.id === id)
  if (idx === -1) return
  // 如果已有 image_data 说明已加载过
  if (records.value[idx]._detailLoaded) return
  try {
    const res = await fetch(`${API_BASE}/api/v1/personal-health/${id}`)
    if (res.ok) {
      const d = await res.json()
      records.value[idx] = { ...records.value[idx], ...d.data, _detailLoaded: true,
        structured_data: d.data.structured_data ? (typeof d.data.structured_data === 'string' ? JSON.parse(d.data.structured_data) : d.data.structured_data) : {},
        groups: d.data.groups_data ? (typeof d.data.groups_data === 'string' ? JSON.parse(d.data.groups_data) : d.data.groups) : d.data.groups || null,
      }
    }
  } catch { /* ignore */ }
}

const toggleExpand = async (id: string) => {
  if (expandedId.value === id) { expandedId.value = null; return }
  expandedId.value = id
  if (!activeTab.value[id]) activeTab.value[id] = 'data'
  await loadDetail(id)
}

const deleteRecord = async (id: string) => {
  if (!confirm('确认删除该体检记录？')) return
  deleting.value = id
  try {
    await fetch(`${API_BASE}/api/v1/personal-health/${id}`, { method: 'DELETE' })
    records.value = records.value.filter(r => r.id !== id)
    if (expandedId.value === id) expandedId.value = null
  } finally { deleting.value = null }
}

const onScanComplete = async () => {
  showScanner.value = false
  await loadRecords()
}

// ── Groups 兼容 ──
const getGroups = (d: any): ScanGroup[] => {
  if (d.groups && d.groups.length) return d.groups
  const entries = Object.entries(d.structured_data || {})
  if (!entries.length) return []
  return [{ name: '检测指标', items: entries.map(([key, value]) => ({ key, value: String(value), unit: '', ref: '', status: 'unknown' })) }]
}

const getAbnormalCount = (r: any) => {
  const groups = getGroups(r)
  return groups.reduce((n, g) => n + g.items.filter(i => i.status === 'high' || i.status === 'low').length, 0)
}

const getTotalCount = (r: any) => {
  const groups = getGroups(r)
  return groups.reduce((n, g) => n + g.items.length, 0)
}

// ── 搜索过滤 ──
const filteredRecords = computed(() => {
  if (!searchQuery.value.trim()) return records.value
  const q = searchQuery.value.toLowerCase()
  return records.value.filter(r =>
    (r.title || '').toLowerCase().includes(q) ||
    (r.scan_date || '').includes(q)
  )
})

// ── 编辑 ──
const startEdit = (r: any) => {
  editingId.value = r.id
  editTitle.value = r.title || ''
  editDate.value = r.scan_date || ''
  editNotes.value = r.notes || ''
  editSummary.value = r.summary || ''
  editGroups.value = JSON.parse(JSON.stringify(getGroups(r)))
}
const cancelEdit = () => { editingId.value = null }

const editAddItem = (gi: number) => editGroups.value[gi].items.push({ key: '', value: '', unit: '', ref: '', status: 'unknown' })
const editRemoveItem = (gi: number, ii: number) => {
  editGroups.value[gi].items.splice(ii, 1)
  if (!editGroups.value[gi].items.length) editGroups.value.splice(gi, 1)
}
const editAddGroup = () => editGroups.value.push({ name: '新分组', items: [{ key: '', value: '', unit: '', ref: '', status: 'unknown' }] })

const saveEdit = async () => {
  if (!editingId.value) return
  isSaving.value = true
  try {
    const sd: Record<string, string> = {}
    for (const g of editGroups.value) for (const item of g.items) if (item.key) sd[item.key] = item.value + (item.unit ? ` ${item.unit}` : '')
    const res = await fetch(`${API_BASE}/api/v1/personal-health/${editingId.value}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle.value, scanDate: editDate.value, notes: editNotes.value, summary: editSummary.value, structuredData: sd, groups: editGroups.value }),
    })
    if (!res.ok) throw new Error('保存失败')
    const idx = records.value.findIndex(r => r.id === editingId.value)
    if (idx !== -1) {
      records.value[idx] = { ...records.value[idx], title: editTitle.value, scan_date: editDate.value, notes: editNotes.value, summary: editSummary.value, structured_data: sd, groups: JSON.parse(JSON.stringify(editGroups.value)) }
    }
    editingId.value = null
  } finally { isSaving.value = false }
}

// ── 手动添加 ──
const manualAddItem = (gi: number) => manualGroups.value[gi].items.push({ key: '', value: '', unit: '', ref: '', status: 'unknown' })
const manualRemoveItem = (gi: number, ii: number) => {
  manualGroups.value[gi].items.splice(ii, 1)
  if (!manualGroups.value[gi].items.length) manualGroups.value.splice(gi, 1)
}
const manualAddGroup = () => manualGroups.value.push({ name: '新分组', items: [{ key: '', value: '', unit: '', ref: '', status: 'unknown' }] })

const saveManual = async () => {
  manualSaving.value = true
  try {
    const sd: Record<string, string> = {}
    for (const g of manualGroups.value) for (const item of g.items) if (item.key) sd[item.key] = item.value + (item.unit ? ` ${item.unit}` : '')
    const res = await fetch(`${API_BASE}/api/v1/personal-health`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredData: sd, groups: manualGroups.value, scanDate: manualDate.value, title: manualTitle.value || `手动记录 ${manualDate.value}`, notes: manualNotes.value, sourceType: 'manual' }),
    })
    if (!res.ok) throw new Error('保存失败')
    showManualAdd.value = false
    manualTitle.value = ''; manualNotes.value = ''
    manualGroups.value = [{ name: '检测指标', items: [{ key: '', value: '', unit: '', ref: '', status: 'unknown' }] }]
    await loadRecords()
  } finally { manualSaving.value = false }
}

// ── AI 对话 ──
const sendChat = async (recordId: string) => {
  const msg = (chatInput.value[recordId] || '').trim()
  if (!msg) return
  if (!chatHistory.value[recordId]) chatHistory.value[recordId] = []
  chatHistory.value[recordId].push({ role: 'user', content: msg })
  chatInput.value[recordId] = ''
  chatLoading.value[recordId] = true

  try {
    const res = await fetch(`${API_BASE}/api/v1/analyze-health/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, message: msg, history: chatHistory.value[recordId].slice(0, -1) }),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || '请求失败') }

    chatHistory.value[recordId].push({ role: 'assistant', content: '' })
    const idx = chatHistory.value[recordId].length - 1
    const reader = res.body!.getReader()
    const dec = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of dec.decode(value, { stream: true }).split('\n')) {
        if (!line.startsWith('data: ')) continue
        const s = line.slice(6).trim()
        if (s === '[DONE]') continue
        try { const p = JSON.parse(s); const c = p.choices?.[0]?.delta?.content; if (c) chatHistory.value[recordId][idx].content += c } catch {}
      }
    }
  } catch (e: any) {
    chatHistory.value[recordId].push({ role: 'assistant', content: `出错了：${e.message}` })
  } finally { chatLoading.value[recordId] = false }
}

// ── 跳转 ──
const goWithContext = (path: string, r: any) => {
  sessionStorage.setItem('healthContext', JSON.stringify({ title: r.title, data: r.structured_data }))
  router.push(path)
}

const statusColor = (s: string) => ({
  high: 'text-red-600 bg-red-50', low: 'text-amber-600 bg-amber-50',
  normal: 'text-emerald-600 bg-emerald-50', unknown: 'text-gray-400',
}[s] || 'text-gray-400')
const statusLabel = (s: string) => ({ high: '偏高', low: '偏低', normal: '正常', unknown: '' }[s] || '')

onMounted(loadRecords)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">

    <!-- 扫描器全屏覆盖 -->
    <Transition name="slide-up">
      <div v-if="showScanner" class="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div class="container mx-auto px-4 py-8 max-w-5xl">
          <OCRScanner @scan-complete="onScanComplete" @cancel="showScanner = false" />
        </div>
      </div>
    </Transition>

    <!-- 手动添加弹窗 -->
    <Transition name="slide-up">
      <div v-if="showManualAdd" class="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-16 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 mb-8">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-bold text-gray-800">手动添加健康记录</h3>
            <button @click="showManualAdd = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div class="grid grid-cols-2 gap-3">
              <input v-model="manualTitle" placeholder="标题（如：年度体检）" class="col-span-2 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"/>
              <input v-model="manualDate" type="date" class="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"/>
            </div>
            <!-- 分组编辑 -->
            <div v-for="(g, gi) in manualGroups" :key="gi" class="border border-gray-200 rounded-xl overflow-hidden">
              <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                <input v-model="g.name" class="flex-1 text-xs font-bold text-gray-600 bg-transparent focus:outline-none"/>
                <button @click="manualAddItem(gi)" class="text-xs text-violet-500 hover:text-violet-700">+ 行</button>
              </div>
              <div v-for="(item, ii) in g.items" :key="ii" class="grid grid-cols-12 gap-1 px-3 py-1.5 border-b border-gray-50 last:border-0">
                <input v-model="item.key" placeholder="指标名" class="col-span-3 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"/>
                <input v-model="item.value" placeholder="值" class="col-span-2 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"/>
                <input v-model="item.unit" placeholder="单位" class="col-span-1 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"/>
                <input v-model="item.ref" placeholder="参考范围" class="col-span-3 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"/>
                <select v-model="item.status" class="col-span-2 text-xs border border-gray-200 rounded px-1 py-0.5 focus:outline-none">
                  <option value="normal">正常</option><option value="high">偏高</option><option value="low">偏低</option><option value="unknown">未知</option>
                </select>
                <button @click="manualRemoveItem(gi, ii)" class="col-span-1 text-gray-300 hover:text-red-400 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <button @click="manualAddGroup" class="w-full py-2 border border-dashed border-violet-300 rounded-xl text-xs text-violet-500 hover:bg-violet-50">+ 添加分组</button>
            <textarea v-model="manualNotes" placeholder="备注（可选）" rows="2" class="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"/>
          </div>
          <div class="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
            <button @click="showManualAdd = false" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl">取消</button>
            <button @click="saveManual" :disabled="manualSaving" class="px-5 py-2 text-sm font-semibold bg-violet-500 hover:bg-violet-600 text-white rounded-xl shadow-sm">
              {{ manualSaving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="container mx-auto px-4 py-8 max-w-4xl">

      <!-- 顶部 -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">健康档案</h1>
          <p class="text-sm text-gray-400 mt-0.5">{{ records.length }} 条记录</p>
        </div>
        <div class="flex gap-2">
          <button @click="showManualAdd = true"
            class="flex items-center gap-1.5 px-4 py-2.5 border border-violet-200 text-violet-600 hover:bg-violet-50 rounded-xl text-sm font-medium transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            手动添加
          </button>
          <button @click="showScanner = true"
            class="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98]">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            扫描体检表
          </button>
        </div>
      </div>

      <!-- 搜索 -->
      <div v-if="records.length > 0" class="mb-4">
        <input v-model="searchQuery" placeholder="搜索标题或日期..." class="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"/>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="records.length === 0" class="text-center py-24">
        <div class="w-24 h-24 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <svg class="w-12 h-12 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">暂无体检记录</h3>
        <p class="text-gray-400 mb-6">上传体检表或手动添加健康数据</p>
        <div class="flex gap-3 justify-center">
          <button @click="showManualAdd = true" class="px-5 py-2.5 border border-violet-200 text-violet-600 rounded-xl font-medium hover:bg-violet-50">手动添加</button>
          <button @click="showScanner = true" class="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25">扫描体检表</button>
        </div>
      </div>

      <!-- 卡片列表 -->
      <div v-else class="space-y-3">
        <div v-for="r in filteredRecords" :key="r.id" class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all" :class="expandedId === r.id ? 'ring-1 ring-violet-400 border-violet-300' : 'hover:shadow-md'">

          <!-- 卡片头部 -->
          <div class="flex items-center gap-3 px-5 py-4 cursor-pointer select-none" @click="toggleExpand(r.id)">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-semibold text-gray-900 text-sm truncate">{{ r.title }}</p>
                <span v-if="getAbnormalCount(r) > 0" class="px-1.5 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full flex-shrink-0">{{ getAbnormalCount(r) }} 异常</span>
                <span v-else-if="getTotalCount(r) > 0" class="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-full flex-shrink-0">正常</span>
              </div>
              <p class="text-xs text-gray-400 mt-0.5">{{ r.scan_date }} · {{ getTotalCount(r) }} 项指标</p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button @click.stop="deleteRecord(r.id)" :disabled="deleting === r.id"
                class="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
              <svg class="w-4 h-4 text-gray-400 transition-transform duration-200" :class="expandedId === r.id ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>

          <!-- 展开内容 -->
          <div v-if="expandedId === r.id" class="border-t border-gray-100">

            <!-- Tabs -->
            <div class="flex border-b border-gray-100 px-5">
              <button v-for="tab in [{ key: 'data', label: '指标数据' }, { key: 'summary', label: 'AI 总结' }, { key: 'chat', label: 'AI 对话' }]" :key="tab.key"
                @click="activeTab[r.id] = tab.key"
                class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
                :class="(activeTab[r.id] || 'data') === tab.key ? 'border-violet-500 text-violet-600' : 'border-transparent text-gray-400 hover:text-gray-600'">
                {{ tab.label }}
              </button>
              <!-- 操作按钮 -->
              <div class="ml-auto flex items-center gap-1.5 py-1">
                <template v-if="editingId === r.id">
                  <button @click="saveEdit" :disabled="isSaving" class="px-3 py-1 text-xs font-semibold bg-violet-500 text-white rounded-lg hover:bg-violet-600">{{ isSaving ? '...' : '保存' }}</button>
                  <button @click="cancelEdit" class="px-3 py-1 text-xs text-gray-500 hover:bg-gray-50 rounded-lg">取消</button>
                </template>
                <button v-else @click="startEdit(r)" class="px-3 py-1 text-xs text-violet-500 hover:bg-violet-50 rounded-lg font-medium">编辑</button>
              </div>
            </div>

            <!-- Tab: 指标数据 -->
            <div v-if="(activeTab[r.id] || 'data') === 'data'" class="max-h-[28rem] overflow-y-auto">
              <template v-if="editingId === r.id">
                <!-- 编辑模式 -->
                <div v-for="(g, gi) in editGroups" :key="gi" class="border-b border-gray-100 last:border-0">
                  <div class="flex items-center justify-between px-4 py-2 bg-gray-50">
                    <input v-model="g.name" class="text-xs font-semibold text-gray-600 bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-violet-400 w-32"/>
                    <button @click="editAddItem(gi)" class="text-xs text-violet-500 hover:text-violet-700">+ 行</button>
                  </div>
                  <div v-for="(item, ii) in g.items" :key="ii" class="grid grid-cols-12 gap-1 px-4 py-1.5 border-b border-gray-50 last:border-0">
                    <input v-model="item.key" class="col-span-3 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"/>
                    <input v-model="item.value" class="col-span-2 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400 font-medium"/>
                    <input v-model="item.unit" class="col-span-1 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"/>
                    <input v-model="item.ref" class="col-span-3 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"/>
                    <select v-model="item.status" class="col-span-2 text-xs border border-gray-200 rounded px-1 py-0.5 focus:outline-none">
                      <option value="normal">正常</option><option value="high">偏高</option><option value="low">偏低</option><option value="unknown">未知</option>
                    </select>
                    <button @click="editRemoveItem(gi, ii)" class="col-span-1 text-gray-300 hover:text-red-400 flex items-center justify-center">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
                <div class="p-4 space-y-2">
                  <button @click="editAddGroup" class="w-full py-2 border border-dashed border-violet-300 rounded-xl text-xs text-violet-500 hover:bg-violet-50">+ 添加分组</button>
                  <textarea v-model="editNotes" placeholder="备注" rows="2" class="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"/>
                </div>
              </template>
              <template v-else>
                <!-- 查看模式 -->
                <div v-for="(g, gi) in getGroups(r)" :key="gi" class="border-b border-gray-100 last:border-0">
                  <div class="px-4 py-2 bg-gray-50">
                    <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ g.name }}</span>
                  </div>
                  <div class="grid grid-cols-12 gap-1 px-4 py-1.5 text-xs text-gray-400 border-b border-gray-100">
                    <span class="col-span-3">指标</span><span class="col-span-2">检测值</span><span class="col-span-1">单位</span><span class="col-span-3">参考范围</span><span class="col-span-3">状态</span>
                  </div>
                  <div v-for="(item, ii) in g.items" :key="ii"
                    class="grid grid-cols-12 gap-1 px-4 py-1.5 text-xs border-b border-gray-50 last:border-0"
                    :class="item.status === 'high' ? 'bg-red-50/60' : item.status === 'low' ? 'bg-amber-50/60' : ''">
                    <span class="col-span-3 text-gray-600 truncate">{{ item.key }}</span>
                    <span class="col-span-2 font-semibold" :class="item.status === 'high' ? 'text-red-600' : item.status === 'low' ? 'text-amber-600' : 'text-gray-800'">{{ item.value }}</span>
                    <span class="col-span-1 text-gray-400">{{ item.unit }}</span>
                    <span class="col-span-3 text-gray-400">{{ item.ref }}</span>
                    <span class="col-span-3">
                      <span v-if="item.status && item.status !== 'unknown'" class="inline-block px-1.5 py-0.5 rounded-full text-xs font-medium" :class="statusColor(item.status)">{{ statusLabel(item.status) }}</span>
                    </span>
                  </div>
                </div>
                <div v-if="r.notes" class="mx-4 my-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">{{ r.notes }}</div>
              </template>
            </div>

            <!-- Tab: AI 总结 -->
            <div v-if="(activeTab[r.id] || 'data') === 'summary'" class="p-5">
              <template v-if="editingId === r.id">
                <textarea v-model="editSummary" rows="8" placeholder="AI 分析总结..." class="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none leading-relaxed"/>
              </template>
              <template v-else>
                <div v-if="r.summary" class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{{ r.summary }}</div>
                <div v-else class="text-center py-8 text-gray-400">
                  <p class="text-sm">暂无 AI 总结</p>
                  <p class="text-xs mt-1">通过扫描体检表自动生成，或点击编辑手动添加</p>
                </div>
              </template>
            </div>

            <!-- Tab: AI 对话 -->
            <div v-if="(activeTab[r.id] || 'data') === 'chat'" class="flex flex-col" style="height: 24rem;">
              <!-- 消息列表 -->
              <div class="flex-1 overflow-y-auto p-4 space-y-3">
                <div v-if="!chatHistory[r.id]?.length" class="text-center py-8 text-gray-400">
                  <div class="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                  </div>
                  <p class="text-sm">针对这份报告，向 AI 医生提问</p>
                  <p class="text-xs mt-1">例如：这些异常指标严重吗？饮食上需要注意什么？</p>
                </div>
                <div v-for="(msg, mi) in (chatHistory[r.id] || [])" :key="mi"
                  class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
                  <div class="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                    :class="msg.role === 'user' ? 'bg-violet-500 text-white rounded-br-md' : 'bg-gray-100 text-gray-700 rounded-bl-md'">
                    <p class="whitespace-pre-wrap">{{ msg.content }}</p>
                  </div>
                </div>
                <div v-if="chatLoading[r.id]" class="flex justify-start">
                  <div class="px-3.5 py-2.5 bg-gray-100 rounded-2xl rounded-bl-md">
                    <span class="flex gap-1">
                      <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
                      <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
                      <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
                    </span>
                  </div>
                </div>
              </div>
              <!-- 输入框 -->
              <div class="border-t border-gray-100 px-4 py-3 flex gap-2">
                <input v-model="chatInput[r.id]" @keydown.enter="sendChat(r.id)" placeholder="输入问题..."
                  class="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" :disabled="chatLoading[r.id]"/>
                <button @click="sendChat(r.id)" :disabled="chatLoading[r.id] || !(chatInput[r.id] || '').trim()"
                  class="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                  发送
                </button>
              </div>
            </div>

            <!-- 底部操作栏 -->
            <div class="border-t border-gray-100 px-5 py-3 flex items-center gap-2">
              <button @click="goWithContext('/knowledge', r)" class="px-3 py-1.5 text-xs text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg font-medium transition-colors">AI 问答</button>
              <button @click="goWithContext('/menu', r)" class="px-3 py-1.5 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-medium transition-colors">定制餐单</button>
              <button @click="goWithContext('/recipes', r)" class="px-3 py-1.5 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg font-medium transition-colors">推荐食谱</button>
              <!-- 原始图片 -->
              <div v-if="r.image_data" class="ml-auto">
                <button @click="r._showImage = !r._showImage" class="text-xs text-gray-400 hover:text-gray-600">{{ r._showImage ? '收起图片' : '查看原图' }}</button>
              </div>
            </div>
            <div v-if="r._showImage && r.image_data" class="px-5 pb-4">
              <img :src="r.image_data" alt="原图" class="w-full max-h-64 object-contain bg-gray-50 rounded-xl border border-gray-200"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(20px); opacity: 0; }
</style>
