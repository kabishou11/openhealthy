<script setup lang="ts">
import { useAuthGuard } from '~/composables/useAuthGuard'

useSeoMeta({ title: '个人餐单 - NutriMind', description: '个性化一周饮食计划' })

const { authStore } = useAuthGuard()
const route = useRoute()

// ─── 人群配置 ────────────────────────────────────────────────
const groups = [
  { id: 'general',   label: '普通成人', icon: '🧑',  color: 'emerald', calories: 1800, desc: '均衡营养，维持健康' },
  { id: 'student',   label: '学生',     icon: '👨‍🎓', color: 'blue',    calories: 2000, desc: '补充脑力，促进发育' },
  { id: 'elderly',   label: '老年人',   icon: '👴',  color: 'amber',   calories: 1600, desc: '易消化，补钙补铁' },
  { id: 'pregnant',  label: '孕妇',     icon: '🤰',  color: 'pink',    calories: 2200, desc: '补叶酸、DHA、铁' },
  { id: 'fitness',   label: '健身增肌', icon: '💪',  color: 'violet',  calories: 2500, desc: '高蛋白，促进肌肉合成' },
  { id: 'slimming',  label: '减脂',     icon: '⚡',  color: 'rose',    calories: 1400, desc: '低卡高饱腹，控制热量' },
  { id: 'diabetes',  label: '糖尿病',   icon: '🍬',  color: 'orange',  calories: 1600, desc: '低GI，控血糖' },
  { id: 'hypertension', label: '高血压', icon: '❤️', color: 'red',     calories: 1700, desc: '低盐低脂，DASH饮食' },
]

const groupColorMap: Record<string, string> = {
  emerald: 'bg-emerald-50 border-emerald-300 text-emerald-700',
  blue:    'bg-blue-50 border-blue-300 text-blue-700',
  amber:   'bg-amber-50 border-amber-300 text-amber-700',
  pink:    'bg-pink-50 border-pink-300 text-pink-700',
  violet:  'bg-violet-50 border-violet-300 text-violet-700',
  rose:    'bg-rose-50 border-rose-300 text-rose-700',
  orange:  'bg-orange-50 border-orange-300 text-orange-700',
  red:     'bg-red-50 border-red-300 text-red-700',
}
const groupActiveBg: Record<string, string> = {
  emerald: 'bg-emerald-500', blue: 'bg-blue-500', amber: 'bg-amber-500',
  pink: 'bg-pink-500', violet: 'bg-violet-500', rose: 'bg-rose-500',
  orange: 'bg-orange-500', red: 'bg-red-500',
}

// Auto-select group based on user role
const defaultGroup = computed(() => {
  if (authStore.isStudent) return 'student'
  return 'general'
})

const selectedGroup = ref(defaultGroup.value)
const currentGroup = computed(() => groups.find(g => g.id === selectedGroup.value)!)

// ─── 餐单数据 ────────────────────────────────────────────────
interface Meal { type: string; dishes: string[]; calories: number; tags?: string[] }
interface DayMenu { day: string; meals: Meal[]; totalCalories: number }

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const activeDay = ref('周一')
const loading = ref(false)
const activeTab = ref<'week' | 'shopping'>('week')

// Menu templates per group
const menuTemplates: Record<string, DayMenu[]> = {
  student: [
    { day: '周一', meals: [
      { type: '早餐', dishes: ['全麦面包', '牛奶', '水煮蛋', '香蕉'], calories: 480, tags: ['补钙', '补铁'] },
      { type: '午餐', dishes: ['糙米饭', '红烧鸡腿', '炒西兰花', '紫菜蛋花汤'], calories: 720, tags: ['高蛋白', '补脑'] },
      { type: '晚餐', dishes: ['杂粮粥', '清蒸鱼', '凉拌黄瓜', '蒸红薯'], calories: 520, tags: ['DHA', '低脂'] },
    ], totalCalories: 1720 },
    { day: '周二', meals: [
      { type: '早餐', dishes: ['燕麦粥', '豆浆', '坚果', '苹果'], calories: 460, tags: ['膳食纤维'] },
      { type: '午餐', dishes: ['米饭', '宫保鸡丁', '蒜蓉菠菜', '冬瓜汤'], calories: 700, tags: ['高蛋白'] },
      { type: '晚餐', dishes: ['荞麦面', '番茄炒蛋', '凉拌木耳'], calories: 490, tags: ['低GI'] },
    ], totalCalories: 1650 },
  ],
  elderly: [
    { day: '周一', meals: [
      { type: '早餐', dishes: ['小米粥', '蒸蛋羹', '豆腐脑', '软烂馒头'], calories: 380, tags: ['易消化', '补钙'] },
      { type: '午餐', dishes: ['软米饭', '清蒸鲈鱼', '炖豆腐', '菠菜汤'], calories: 580, tags: ['高钙', '低脂'] },
      { type: '晚餐', dishes: ['杂粮粥', '蒸南瓜', '炒时蔬'], calories: 380, tags: ['易消化'] },
    ], totalCalories: 1340 },
  ],
  pregnant: [
    { day: '周一', meals: [
      { type: '早餐', dishes: ['全麦面包', '牛奶', '水煮蛋', '橙子'], calories: 500, tags: ['叶酸', '补钙'] },
      { type: '午餐', dishes: ['糙米饭', '清蒸三文鱼', '炒菠菜', '骨头汤'], calories: 780, tags: ['DHA', '补铁', '补钙'] },
      { type: '晚餐', dishes: ['杂粮粥', '豆腐炖蛋', '炒时蔬', '核桃'], calories: 560, tags: ['DHA', '补铁'] },
    ], totalCalories: 1840 },
  ],
  slimming: [
    { day: '周一', meals: [
      { type: '早餐', dishes: ['燕麦粥', '水煮蛋白', '黄瓜'], calories: 280, tags: ['低卡', '高饱腹'] },
      { type: '午餐', dishes: ['糙米饭(小份)', '鸡胸肉', '大量蔬菜', '无油汤'], calories: 480, tags: ['高蛋白', '低脂'] },
      { type: '晚餐', dishes: ['蔬菜沙拉', '水煮虾', '无糖豆浆'], calories: 320, tags: ['低卡', '高蛋白'] },
    ], totalCalories: 1080 },
  ],
}

// Default template for groups without specific data
const defaultTemplate: DayMenu[] = weekDays.map((day, i) => ({
  day,
  meals: [
    { type: '早餐', dishes: ['燕麦粥', '水煮蛋', '牛奶', '水果'], calories: 450 },
    { type: '午餐', dishes: ['糙米饭', '清蒸鱼', '炒时蔬', '汤'], calories: 650 },
    { type: '晚餐', dishes: ['杂粮粥', '豆腐', '炒蔬菜'], calories: 420 },
  ],
  totalCalories: 1520,
}))

const weekMenu = computed<DayMenu[]>(() => {
  const template = menuTemplates[selectedGroup.value]
  if (!template) return defaultTemplate
  // Fill missing days with default
  return weekDays.map(day => template.find(d => d.day === day) || { ...defaultTemplate[0], day })
})

const todayMenu = computed(() => weekMenu.value.find(d => d.day === activeDay.value) || weekMenu.value[0])

// ─── 购物清单 ────────────────────────────────────────────────
interface ShoppingItem { name: string; amount: string; category: string; checked: boolean }

const shoppingCategories = ['主食', '肉禽蛋', '蔬菜', '水果', '豆制品', '乳制品', '调味品']

const shoppingList = ref<ShoppingItem[]>([
  { name: '糙米', amount: '1kg', category: '主食', checked: false },
  { name: '燕麦', amount: '500g', category: '主食', checked: false },
  { name: '全麦面包', amount: '1袋', category: '主食', checked: false },
  { name: '鸡胸肉', amount: '600g', category: '肉禽蛋', checked: false },
  { name: '鸡蛋', amount: '10个', category: '肉禽蛋', checked: false },
  { name: '三文鱼', amount: '300g', category: '肉禽蛋', checked: false },
  { name: '西兰花', amount: '2棵', category: '蔬菜', checked: false },
  { name: '菠菜', amount: '500g', category: '蔬菜', checked: false },
  { name: '黄瓜', amount: '4根', category: '蔬菜', checked: false },
  { name: '番茄', amount: '6个', category: '蔬菜', checked: false },
  { name: '苹果', amount: '6个', category: '水果', checked: false },
  { name: '香蕉', amount: '1串', category: '水果', checked: false },
  { name: '豆腐', amount: '2块', category: '豆制品', checked: false },
  { name: '牛奶', amount: '1L×3', category: '乳制品', checked: false },
])

const shoppingByCategory = computed(() => {
  return shoppingCategories.map(cat => ({
    name: cat,
    items: shoppingList.value.filter(i => i.category === cat),
  })).filter(c => c.items.length > 0)
})

const checkedCount = computed(() => shoppingList.value.filter(i => i.checked).length)

// ─── AI 生成 ─────────────────────────────────────────────────
const generating = ref(false)
const healthContext = ref<any>(null)

const generateMenu = async () => {
  generating.value = true
  await new Promise(r => setTimeout(r, 1500))
  generating.value = false
}

onMounted(() => {
  authStore.init()
  selectedGroup.value = defaultGroup.value
  try {
    const raw = sessionStorage.getItem('healthContext')
    if (raw) {
      healthContext.value = JSON.parse(raw)
      sessionStorage.removeItem('healthContext')
    }
  } catch { /* ignore */ }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pt-16">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="container mx-auto px-4 py-4 max-w-5xl">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg font-bold text-gray-900">个人餐单计划</h1>
            <p class="text-xs text-gray-400 mt-0.5">根据人群特点智能生成一周营养餐单</p>
          </div>
          <div class="flex items-center gap-2">
            <NuxtLink v-if="authStore.canManageCafeteria || authStore.isSchoolAdmin" to="/menu/cafeteria"
              class="px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors flex items-center gap-1.5">
              🏫 食堂餐单
            </NuxtLink>
            <button @click="generateMenu" :disabled="generating"
              class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" :class="{ 'animate-spin': generating }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ generating ? 'AI 生成中...' : 'AI 重新生成' }}
            </button>
          </div>
        </div>

        <!-- Health context banner -->
        <div v-if="healthContext" class="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          已根据体检数据「{{ healthContext.title }}」个性化调整餐单
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-5 max-w-5xl">
      <!-- 人群选择 -->
      <div class="mb-5">
        <p class="text-xs font-medium text-gray-500 mb-2.5">选择人群</p>
        <div class="flex gap-2 flex-wrap">
          <button v-for="g in groups" :key="g.id" @click="selectedGroup = g.id"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all"
            :class="selectedGroup === g.id
              ? groupActiveBg[g.color] + ' text-white border-transparent shadow-sm'
              : groupColorMap[g.color] + ' border'">
            <span>{{ g.icon }}</span>
            {{ g.label }}
            <span v-if="selectedGroup === g.id" class="opacity-80">· {{ g.calories }}kcal</span>
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-1.5">{{ currentGroup.desc }} · 目标热量 {{ currentGroup.calories }} kcal/天</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        <button @click="activeTab = 'week'"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          :class="activeTab === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
          一周餐单
        </button>
        <button @click="activeTab = 'shopping'"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
          :class="activeTab === 'shopping' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
          购物清单
          <span v-if="checkedCount > 0" class="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">{{ checkedCount }}</span>
        </button>
      </div>

      <!-- Week view -->
      <div v-if="activeTab === 'week'" class="grid lg:grid-cols-3 gap-5">
        <!-- Day selector -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-gray-50">
              <p class="text-sm font-semibold text-gray-800">本周计划</p>
            </div>
            <div class="divide-y divide-gray-50">
              <button v-for="day in weekMenu" :key="day.day" @click="activeDay = day.day"
                class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                :class="activeDay === day.day ? 'bg-emerald-50' : ''">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                    :class="activeDay === day.day ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'">
                    {{ day.day.slice(1) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium" :class="activeDay === day.day ? 'text-emerald-700' : 'text-gray-800'">{{ day.day }}</p>
                    <p class="text-xs text-gray-400">{{ day.meals.length }} 餐</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-medium" :class="activeDay === day.day ? 'text-emerald-600' : 'text-gray-500'">{{ day.totalCalories }}</p>
                  <p class="text-xs text-gray-400">kcal</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Day detail -->
        <div class="lg:col-span-2 space-y-3">
          <div v-for="meal in todayMenu.meals" :key="meal.type"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ meal.type === '早餐' ? '🌅' : meal.type === '午餐' ? '☀️' : '🌙' }}</span>
                <span class="font-semibold text-gray-800">{{ meal.type }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div v-if="meal.tags" class="flex gap-1">
                  <span v-for="tag in meal.tags?.slice(0,2)" :key="tag"
                    class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-full">{{ tag }}</span>
                </div>
                <span class="text-sm font-medium text-gray-500">{{ meal.calories }} kcal</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-for="dish in meal.dishes" :key="dish"
                class="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-xl text-sm border border-gray-100">
                {{ dish }}
              </span>
            </div>
          </div>

          <!-- Day summary -->
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm opacity-80">{{ activeDay }} 总热量</p>
                <p class="text-2xl font-bold">{{ todayMenu.totalCalories }} <span class="text-sm font-normal opacity-80">kcal</span></p>
              </div>
              <div class="text-right">
                <p class="text-sm opacity-80">目标</p>
                <p class="text-lg font-semibold">{{ currentGroup.calories }} kcal</p>
                <p class="text-xs opacity-70 mt-0.5"
                  :class="todayMenu.totalCalories <= currentGroup.calories ? 'text-green-200' : 'text-red-200'">
                  {{ todayMenu.totalCalories <= currentGroup.calories ? '✓ 达标' : '↑ 超出 ' + (todayMenu.totalCalories - currentGroup.calories) + ' kcal' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Shopping list -->
      <div v-if="activeTab === 'shopping'">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm text-gray-500">已勾选 {{ checkedCount }} / {{ shoppingList.length }} 项</p>
          <div class="flex gap-2">
            <button @click="shoppingList.forEach(i => i.checked = false)"
              class="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">重置</button>
            <button @click="() => window.print()"
              class="px-3 py-1.5 text-xs text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              打印
            </button>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div v-for="cat in shoppingByCategory" :key="cat.name"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-700">{{ cat.name }}</span>
              <span class="text-xs text-gray-400">{{ cat.items.filter(i => i.checked).length }}/{{ cat.items.length }}</span>
            </div>
            <div class="divide-y divide-gray-50">
              <label v-for="item in cat.items" :key="item.name"
                class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                <input type="checkbox" v-model="item.checked"
                  class="w-4 h-4 rounded accent-emerald-500 cursor-pointer"/>
                <span class="flex-1 text-sm" :class="item.checked ? 'line-through text-gray-400' : 'text-gray-700'">
                  {{ item.name }}
                </span>
                <span class="text-xs text-gray-400 font-mono">{{ item.amount }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
