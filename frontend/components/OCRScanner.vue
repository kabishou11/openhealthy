<script setup lang="ts">
// ═══════════════════════════════════════════════════════════
// OCRScanner — 体检报告智能识别 · AI 总结 · 档案存储
// ═══════════════════════════════════════════════════════════
interface ScanItem { key: string; value: string; unit: string; ref: string; status: string }
interface ScanGroup { name: string; items: ScanItem[] }

const emit = defineEmits<{
  (e: 'scan-complete', data: { id: string }): void
  (e: 'cancel'): void
}>()

const API = 'http://127.0.0.1:3001'

// ── Core state ──
const image       = ref<string | null>(null)
const scanning    = ref(false)
const error       = ref<string | null>(null)
const rawText     = ref<string | null>(null)
const title       = ref('')
const groups      = ref<ScanGroup[]>([])
const summary     = ref('')
const saving      = ref(false)
const saved       = ref(false)
const showRaw     = ref(false)
const zoomed      = ref(false)
const isDragging  = ref(false)

// ── Info group detection ──
const INFO_KEYS = ['基本信息', '个人信息', '患者信息', '受检者', '一般信息']
const isInfo = (n: string) => INFO_KEYS.some(k => n.includes(k))

// ── Computed ──
const total    = computed(() => groups.value.reduce((s, g) => s + g.items.length, 0))
const abnormal = computed(() => groups.value.reduce((s, g) => s + g.items.filter(i => i.status === 'high' || i.status === 'low').length, 0))
const phase    = computed(() => saved.value ? 'done' : groups.value.length ? 'result' : 'upload')

// ── Image compress ──
const compress = (file: File): Promise<string> => new Promise((ok, fail) => {
  const r = new FileReader()
  r.onload = e => {
    const img = new Image()
    img.onload = () => {
      const M = 2048; let w = img.width, h = img.height
      if (w > M || h > M) { const s = Math.min(M / w, M / h); w = Math.round(w * s); h = Math.round(h * s) }
      const c = document.createElement('canvas'); c.width = w; c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) { fail(new Error('canvas')); return }
      ctx.drawImage(img, 0, 0, w, h)
      ok(c.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => fail(new Error('图片加载失败'))
    img.src = e.target?.result as string
  }
  r.onerror = () => fail(new Error('读取失败'))
  r.readAsDataURL(file)
})

// ── File handling ──
const pickFile = async (evt: Event) => {
  const f = (evt.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (!/^image\/(jpeg|jpg|png|webp|gif)$/.test(f.type)) { error.value = '仅支持 JPG / PNG / WebP 格式'; return }
  if (f.size > 20 * 1024 * 1024) { error.value = '图片不能超过 20MB'; return }
  error.value = null; rawText.value = null; groups.value = []; title.value = ''; summary.value = ''
  try { image.value = await compress(f) } catch { const r = new FileReader(); r.onload = e => { image.value = e.target?.result as string }; r.readAsDataURL(f) }
}
const onDrop = (e: DragEvent) => { e.preventDefault(); isDragging.value = false; const f = e.dataTransfer?.files[0]; if (f) pickFile({ target: { files: [f] } } as any) }
const reset = () => {
  image.value = null; rawText.value = null; groups.value = []; error.value = null
  saved.value = false; title.value = ''; zoomed.value = false; summary.value = ''
  const el = document.getElementById('scan-input') as HTMLInputElement; if (el) el.value = ''
}

// ── Scan ──
const scan = async () => {
  if (!image.value) return
  scanning.value = true; error.value = null
  try {
    const res = await fetch(`${API}/api/v1/scan-health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: image.value }) })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error || '识别失败')
    rawText.value = d.rawText || ''; title.value = d.title || ''; summary.value = d.summary || ''
    groups.value = (d.groups || []).map((g: ScanGroup) => ({ name: g.name, items: g.items.map((i: ScanItem) => ({ ...i })) }))
  } catch (e: any) { error.value = e.message } finally { scanning.value = false }
}

// ── Edit helpers ──
const upd = (gi: number, ii: number, f: keyof ScanItem, v: string) => { groups.value[gi].items[ii][f] = v }
const rmItem = (gi: number, ii: number) => { groups.value[gi].items.splice(ii, 1); if (!groups.value[gi].items.length) groups.value.splice(gi, 1) }
const addItem = (gi: number) => { groups.value[gi].items.push({ key: '', value: '', unit: '', ref: '', status: 'unknown' }) }
const addGroup = () => { groups.value.push({ name: '新分组', items: [{ key: '', value: '', unit: '', ref: '', status: 'unknown' }] }) }

// ── Save ──
const save = async () => {
  if (!groups.value.length && !rawText.value) return
  saving.value = true
  try {
    const sd: Record<string, string> = {}
    for (const g of groups.value) for (const i of g.items) if (i.key) sd[i.key] = i.value + (i.unit ? ` ${i.unit}` : '')
    const token = import.meta.client ? localStorage.getItem('token') : null
    const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}
    const res = await fetch(`${API}/api/v1/personal-health`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ rawText: rawText.value || '', structuredData: sd, groups: groups.value, scanDate: new Date().toISOString().split('T')[0], title: title.value || undefined, summary: summary.value || undefined, imageData: image.value || undefined }),
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error || '保存失败')
    saved.value = true; emit('scan-complete', { id: d.id })
  } catch (e: any) { error.value = e.message } finally { saving.value = false }
}

// ── Status helpers ──
const stColor = (s: string) => ({ high: 'text-rose-600 bg-rose-50 border-rose-200', low: 'text-amber-600 bg-amber-50 border-amber-200', normal: 'text-emerald-600 bg-emerald-50 border-emerald-200', unknown: 'text-slate-400 bg-slate-50 border-slate-200' }[s] || 'text-slate-400 bg-slate-50 border-slate-200')
const stLabel = (s: string) => ({ high: '偏高', low: '偏低', normal: '正常', unknown: '—' }[s] || '—')
</script>

<template>
  <div class="max-w-4xl mx-auto font-sans">

    <!-- ═══ HEADER BAR ═══ -->
    <div class="flex items-center gap-3 mb-5">
      <button @click="emit('cancel')" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 min-w-0">
        <template v-if="phase === 'result'">
          <input v-model="title" class="w-full text-lg font-bold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-indigo-300 focus:border-indigo-500 focus:outline-none transition-colors pb-0.5 tracking-tight" placeholder="报告标题"/>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-xs text-slate-400">{{ total }} 项指标</span>
            <span v-if="abnormal > 0" class="text-xs text-rose-500 font-semibold">{{ abnormal }} 项异常</span>
          </div>
        </template>
        <template v-else-if="phase === 'upload'">
          <h2 class="text-lg font-bold text-slate-800 tracking-tight">体检报告识别</h2>
          <p class="text-xs text-slate-400 mt-0.5">AI 视觉模型 · 自动提取 · 智能分组 · AI 总结</p>
        </template>
      </div>
      <!-- Save button -->
      <button v-if="phase === 'result'" @click="save" :disabled="saving"
        class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
        :class="saving ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 active:scale-[0.97]'">
        <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        {{ saving ? '保存中' : '存入档案' }}
      </button>
    </div>

    <!-- ═══ PHASE: DONE ═══ -->
    <div v-if="phase === 'done'" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30 rotate-3">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <h3 class="text-lg font-bold text-slate-800 mb-1">已存入健康档案</h3>
      <p class="text-sm text-slate-400 mb-6">{{ title || '体检记录' }} · {{ total }} 项指标</p>
      <button @click="reset" class="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25">继续扫描</button>
    </div>

    <!-- ═══ PHASE: UPLOAD ═══ -->
    <template v-if="phase === 'upload'">
      <div class="space-y-4">
        <div @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop="onDrop"
          class="relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden"
          :class="isDragging ? 'border-indigo-400 bg-indigo-50/50 scale-[1.01]' : image ? 'border-indigo-300 bg-white' : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50'">
          <label for="scan-input" class="block cursor-pointer">
            <input id="scan-input" type="file" accept="image/*" class="hidden" @change="pickFile">
            <template v-if="image">
              <img :src="image" alt="体检表" class="w-full max-h-80 object-contain p-4">
              <button @click.prevent="reset" class="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-500 rounded-xl flex items-center justify-center shadow-sm transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </template>
            <template v-else>
              <div class="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-4">
                  <svg class="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <p class="text-sm font-semibold text-slate-700">点击或拖拽上传体检表</p>
                <p class="text-xs text-slate-400 mt-1">JPG / PNG / WebP · 最大 20MB</p>
              </div>
            </template>
          </label>
        </div>

        <!-- Error -->
        <div v-if="error" class="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ error }}
        </div>

        <!-- Scan button -->
        <button v-if="image" @click="scan" :disabled="scanning"
          class="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          :class="scanning ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98]'">
          <svg v-if="scanning" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          {{ scanning ? 'AI 识别中...' : '开始智能识别' }}
        </button>
      </div>
    </template>

    <!-- ═══ PHASE: RESULT ═══ -->
    <div v-if="phase === 'result'" class="space-y-4">

      <!-- Source bar -->
      <div class="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div class="relative flex-shrink-0 cursor-pointer" @click="zoomed = !zoomed">
          <img :src="image!" alt="原图" class="rounded-xl object-contain bg-slate-50 transition-all duration-300" :class="zoomed ? 'w-full max-h-96' : 'w-16 h-16'"/>
          <div v-if="!zoomed" class="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-700 truncate">{{ title }}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-slate-400">{{ total }} 项</span>
            <span v-if="abnormal" class="text-xs text-rose-500 font-semibold">{{ abnormal }} 异常</span>
          </div>
        </div>
        <div class="flex gap-1.5 flex-shrink-0">
          <button @click="addGroup" class="px-2.5 py-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium">+ 分组</button>
          <button @click="reset" class="px-2.5 py-1.5 text-xs text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">重传</button>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ error }}
      </div>

      <!-- ── AI Summary ── -->
      <div v-if="summary || phase === 'result'" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-4 py-2.5 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100 flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </div>
          <span class="text-sm font-bold text-violet-800">AI 分析总结</span>
        </div>
        <div class="p-4">
          <textarea v-model="summary" rows="5" placeholder="AI 将在识别后自动生成分析总结，你也可以手动编辑..."
            class="w-full text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"/>
        </div>
      </div>

      <!-- ── Groups ── -->
      <div v-for="(g, gi) in groups" :key="gi" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <!-- Group header -->
        <div class="flex items-center gap-2 px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
          <input :value="g.name" @input="(e: Event) => g.name = (e.target as HTMLInputElement).value"
            class="flex-1 text-xs font-bold text-slate-600 uppercase tracking-wider bg-transparent focus:outline-none focus:text-indigo-600 min-w-0"/>
          <span class="text-[10px] text-slate-400 tabular-nums">{{ g.items.length }}</span>
          <button @click="addItem(gi)" class="w-5 h-5 flex items-center justify-center text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>

        <!-- Info group: card grid -->
        <template v-if="isInfo(g.name)">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
            <div v-for="(item, ii) in g.items" :key="ii" class="group relative px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
              <p class="text-[10px] text-slate-400 mb-0.5">{{ item.key }}</p>
              <input :value="item.value" @input="(e: Event) => upd(gi, ii, 'value', (e.target as HTMLInputElement).value)"
                class="w-full text-sm font-semibold text-slate-800 bg-transparent focus:outline-none focus:text-indigo-700"/>
              <button @click="rmItem(gi, ii)" class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-slate-300 hover:text-rose-400 transition-all">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </template>

        <!-- Data group: table -->
        <template v-else>
          <div class="grid grid-cols-12 gap-1 px-4 py-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-50">
            <span class="col-span-3">指标</span><span class="col-span-2">检测值</span><span class="col-span-1">单位</span><span class="col-span-3">参考范围</span><span class="col-span-2">状态</span><span class="col-span-1"></span>
          </div>
          <div v-for="(item, ii) in g.items" :key="ii"
            class="group grid grid-cols-12 gap-1 px-4 py-1.5 items-center border-b border-slate-50 last:border-0 transition-colors"
            :class="item.status === 'high' ? 'bg-rose-50/50' : item.status === 'low' ? 'bg-amber-50/50' : 'hover:bg-slate-50/60'">
            <input :value="item.key" @input="(e: Event) => upd(gi, ii, 'key', (e.target as HTMLInputElement).value)"
              class="col-span-3 text-xs text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none transition-colors truncate"/>
            <input :value="item.value" @input="(e: Event) => upd(gi, ii, 'value', (e.target as HTMLInputElement).value)"
              class="col-span-2 text-xs font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none transition-colors tabular-nums"
              :class="item.status === 'high' ? 'text-rose-600' : item.status === 'low' ? 'text-amber-600' : 'text-slate-800'"/>
            <input :value="item.unit" @input="(e: Event) => upd(gi, ii, 'unit', (e.target as HTMLInputElement).value)"
              class="col-span-1 text-[10px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none transition-colors"/>
            <input :value="item.ref" @input="(e: Event) => upd(gi, ii, 'ref', (e.target as HTMLInputElement).value)"
              class="col-span-3 text-[10px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none transition-colors"/>
            <div class="col-span-2">
              <select :value="item.status" @change="(e: Event) => upd(gi, ii, 'status', (e.target as HTMLSelectElement).value)"
                class="text-[10px] px-1.5 py-0.5 rounded-md border font-semibold focus:outline-none cursor-pointer w-full" :class="stColor(item.status)">
                <option value="normal">正常</option><option value="high">偏高</option><option value="low">偏低</option><option value="unknown">—</option>
              </select>
            </div>
            <button @click="rmItem(gi, ii)" class="col-span-1 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-slate-300 hover:text-rose-400 rounded transition-all mx-auto">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </template>
      </div>

      <!-- ── Raw text ── -->
      <div v-if="rawText" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button @click="showRaw = !showRaw" class="w-full px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
          <span class="text-slate-500 font-medium">原始识别文本</span>
          <svg class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" :class="showRaw ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div v-show="showRaw" class="px-4 pb-3">
          <pre class="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed border border-slate-100">{{ rawText }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
