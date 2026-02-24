<script setup lang="ts">
import { useAuthGuard } from '~/composables/useAuthGuard'

useSeoMeta({ title: '购物清单 - NutriMind' })

useAuthGuard()

const categories = [
  { id: '主食', icon: '🌾', color: 'amber' },
  { id: '肉禽蛋', icon: '🥩', color: 'red' },
  { id: '水产', icon: '🐟', color: 'blue' },
  { id: '蔬菜', icon: '🥦', color: 'emerald' },
  { id: '水果', icon: '🍎', color: 'rose' },
  { id: '豆制品', icon: '🫘', color: 'orange' },
  { id: '乳制品', icon: '🥛', color: 'sky' },
  { id: '调味品', icon: '🧂', color: 'gray' },
]

const catColorMap: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
}

interface ShoppingItem {
  id: string
  name: string
  amount: string
  unit: string
  category: string
  checked: boolean
  note?: string
  forMeal?: string
}

const items = ref<ShoppingItem[]>([
  { id: '1', name: '糙米', amount: '1', unit: 'kg', category: '主食', checked: false, forMeal: '午餐/晚餐' },
  { id: '2', name: '燕麦', amount: '500', unit: 'g', category: '主食', checked: false, forMeal: '早餐' },
  { id: '3', name: '全麦面包', amount: '1', unit: '袋', category: '主食', checked: false, forMeal: '早餐' },
  { id: '4', name: '荞麦面', amount: '400', unit: 'g', category: '主食', checked: false },
  { id: '5', name: '鸡胸肉', amount: '800', unit: 'g', category: '肉禽蛋', checked: false, forMeal: '午餐' },
  { id: '6', name: '鸡蛋', amount: '12', unit: '个', category: '肉禽蛋', checked: false },
  { id: '7', name: '猪里脊', amount: '400', unit: 'g', category: '肉禽蛋', checked: false },
  { id: '8', name: '三文鱼', amount: '300', unit: 'g', category: '水产', checked: false, note: '新鲜/冷冻均可' },
  { id: '9', name: '鲈鱼', amount: '1', unit: '条', category: '水产', checked: false },
  { id: '10', name: '虾仁', amount: '200', unit: 'g', category: '水产', checked: false },
  { id: '11', name: '西兰花', amount: '2', unit: '棵', category: '蔬菜', checked: false },
  { id: '12', name: '菠菜', amount: '500', unit: 'g', category: '蔬菜', checked: false },
  { id: '13', name: '黄瓜', amount: '4', unit: '根', category: '蔬菜', checked: false },
  { id: '14', name: '番茄', amount: '6', unit: '个', category: '蔬菜', checked: false },
  { id: '15', name: '木耳（干）', amount: '50', unit: 'g', category: '蔬菜', checked: false },
  { id: '16', name: '苹果', amount: '6', unit: '个', category: '水果', checked: false },
  { id: '17', name: '香蕉', amount: '1', unit: '串', category: '水果', checked: false },
  { id: '18', name: '橙子', amount: '4', unit: '个', category: '水果', checked: false },
  { id: '19', name: '豆腐', amount: '2', unit: '块', category: '豆制品', checked: false },
  { id: '20', name: '豆浆', amount: '1', unit: 'L', category: '豆制品', checked: false },
  { id: '21', name: '牛奶', amount: '3', unit: 'L', category: '乳制品', checked: false },
  { id: '22', name: '低脂酸奶', amount: '4', unit: '杯', category: '乳制品', checked: false },
  { id: '23', name: '橄榄油', amount: '1', unit: '瓶', category: '调味品', checked: false },
  { id: '24', name: '低钠盐', amount: '1', unit: '袋', category: '调味品', checked: false },
])

const searchQuery = ref('')
const filterCategory = ref<string | null>(null)
const showAddForm = ref(false)
const newItem = ref({ name: '', amount: '', unit: 'g', category: '蔬菜', note: '' })

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchCat = !filterCategory.value || item.category === filterCategory.value
    const matchSearch = !searchQuery.value || item.name.includes(searchQuery.value)
    return matchCat && matchSearch
  })
})

const byCategory = computed(() => {
  const cats = filterCategory.value ? [filterCategory.value] : categories.map(c => c.id)
  return cats.map(catId => {
    const cat = categories.find(c => c.id === catId)!
    const catItems = filteredItems.value.filter(i => i.category === catId)
    return { ...cat, items: catItems }
  }).filter(c => c.items.length > 0)
})

const checkedCount = computed(() => items.value.filter(i => i.checked).length)
const totalCount = computed(() => items.value.length)
const progress = computed(() => Math.round(checkedCount.value / totalCount.value * 100))

const addItem = () => {
  if (!newItem.value.name.trim()) return
  items.value.push({
    id: Date.now().toString(),
    name: newItem.value.name,
    amount: newItem.value.amount,
    unit: newItem.value.unit,
    category: newItem.value.category,
    checked: false,
    note: newItem.value.note || undefined,
  })
  newItem.value = { name: '', amount: '', unit: 'g', category: '蔬菜', note: '' }
  showAddForm.value = false
}

const removeItem = (id: string) => { items.value = items.value.filter(i => i.id !== id) }
const resetAll = () => items.value.forEach(i => i.checked = false)
const checkAll = () => items.value.forEach(i => i.checked = true)
</script>

<template>
  <div class="min-h-screen bg-gray-50 pt-16">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100 shadow-sm">
      <div class="container mx-auto px-4 py-4 max-w-3xl">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h1 class="text-lg font-bold text-gray-900">购物清单</h1>
            <p class="text-xs text-gray-400">本周餐单所需食材</p>
          </div>
          <div class="flex items-center gap-2">
            <button @click="resetAll" class="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">重置</button>
            <button @click="checkAll" class="px-3 py-1.5 text-xs text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50">全选</button>
            <button @click="showAddForm = !showAddForm"
              class="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              添加
            </button>
            <button onclick="window.print()"
              class="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              打印
            </button>
          </div>
        </div>

        <!-- Progress -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all duration-500"
              :style="{ width: progress + '%' }"></div>
          </div>
          <span class="text-xs text-gray-500 flex-shrink-0">{{ checkedCount }}/{{ totalCount }} 已购</span>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-4 max-w-3xl">
      <!-- Add form -->
      <Transition name="slide-down">
        <div v-if="showAddForm" class="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 mb-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">添加食材</h3>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="text-xs text-gray-500 block mb-1">食材名称</label>
              <input v-model="newItem.name" type="text" placeholder="如：西红柿"
                class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
            </div>
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="text-xs text-gray-500 block mb-1">数量</label>
                <input v-model="newItem.amount" type="text" placeholder="500"
                  class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
              </div>
              <div class="w-20">
                <label class="text-xs text-gray-500 block mb-1">单位</label>
                <select v-model="newItem.unit" class="w-full text-sm border border-gray-200 rounded-xl px-2 py-2 focus:outline-none">
                  <option>g</option><option>kg</option><option>个</option><option>袋</option><option>瓶</option><option>盒</option><option>L</option><option>根</option><option>棵</option><option>串</option><option>条</option><option>块</option><option>杯</option>
                </select>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="text-xs text-gray-500 block mb-1">分类</label>
              <select v-model="newItem.category" class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.icon }} {{ cat.id }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">备注（可选）</label>
              <input v-model="newItem.note" type="text" placeholder="如：新鲜的"
                class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button @click="showAddForm = false" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">取消</button>
            <button @click="addItem" class="px-4 py-2 text-sm bg-indigo-500 text-white rounded-xl hover:bg-indigo-600">添加</button>
          </div>
        </div>
      </Transition>

      <!-- Search + filter -->
      <div class="flex gap-2 mb-4">
        <div class="relative flex-1">
          <input v-model="searchQuery" type="text" placeholder="搜索食材..."
            class="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
          <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>

      <!-- Category filter chips -->
      <div class="flex gap-2 flex-wrap mb-4">
        <button @click="filterCategory = null"
          class="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
          :class="!filterCategory ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'">
          全部
        </button>
        <button v-for="cat in categories" :key="cat.id" @click="filterCategory = filterCategory === cat.id ? null : cat.id"
          class="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
          :class="filterCategory === cat.id ? catColorMap[cat.color] : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'">
          {{ cat.icon }} {{ cat.id }}
        </button>
      </div>

      <!-- Items by category -->
      <div class="space-y-4">
        <div v-for="cat in byCategory" :key="cat.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span>{{ cat.icon }}</span>{{ cat.id }}
            </span>
            <span class="text-xs text-gray-400">{{ cat.items.filter(i => i.checked).length }}/{{ cat.items.length }}</span>
          </div>
          <div class="divide-y divide-gray-50">
            <div v-for="item in cat.items" :key="item.id"
              class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
              <input type="checkbox" v-model="item.checked"
                class="w-4 h-4 rounded accent-emerald-500 cursor-pointer flex-shrink-0"/>
              <div class="flex-1 min-w-0">
                <span class="text-sm" :class="item.checked ? 'line-through text-gray-400' : 'text-gray-800'">
                  {{ item.name }}
                </span>
                <span v-if="item.note" class="text-xs text-gray-400 ml-2">{{ item.note }}</span>
                <span v-if="item.forMeal" class="text-xs text-indigo-400 ml-2">用于{{ item.forMeal }}</span>
              </div>
              <span class="text-sm font-mono text-gray-500 flex-shrink-0">{{ item.amount }}{{ item.unit }}</span>
              <button @click="removeItem(item.id)"
                class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all flex-shrink-0">
                <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
@media print {
  header, button, .no-print { display: none !important; }
  .bg-white { box-shadow: none !important; }
}
</style>
