<script setup lang="ts">
import type { LLMModel } from '~/composables/useLLMModel'

const props = defineProps<{
  compact?: boolean
}>()

const {
  chatModels,
  selectedModelId,
  currentModel,
  isLoading,
  error,
  modelsByProvider,
  selectModel,
  refreshModels,
} = useLLMModel()

const isOpen = ref(false)
const searchQuery = ref('')

// Toggle dropdown
const toggleDropdown = () => {
  if (!isOpen.value) {
    refreshModels()
  }
  isOpen.value = !isOpen.value
}

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.model-selector')) {
      isOpen.value = false
    }
  })
})

// Select model handler
const handleSelect = (modelId: string) => {
  selectModel(modelId)
  isOpen.value = false
}

// Filter models by search query
const filteredModels = computed(() => {
  if (!searchQuery.value.trim()) return modelsByProvider.value

  const query = searchQuery.value.toLowerCase()
  const filtered: Record<string, LLMModel[]> = {}

  for (const [provider, models] of Object.entries(modelsByProvider.value)) {
    const matching = models.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query) ||
      provider.toLowerCase().includes(query)
    )
    if (matching.length > 0) {
      filtered[provider] = matching
    }
  }

  return filtered
})

// Get provider icon with SVG
const getProviderIcon = (provider: string) => {
  const icons: Record<string, string> = {
    'ModelScope': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    'Qwen': 'M12 2l10 5.5L12 13 2 7.5 12 2z',
    '01-ai': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
    'Yi': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    'THUDM': 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
    'Zhipu': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    'Baichuan': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    'OpenAI': 'M22.2819 9.4611a5.9842 5.9842 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5099-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9842 5.9842 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 9.3943 9.3943 0 0 0 .51 4.9107 6.0463 6.0463 0 0 0 6.5146 2.9001A5.9842 5.9842 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zM13.26 22.43a4.4765 4.4765 0 0 1-2.8764-1.0408l.1419-.0805A4.4705 4.4705 0 0 1 12.0165 19a4.4705 4.4705 0 0 1-1.5446-8.2988l.1419-.0861a4.4857 4.4857 0 0 1 5.5437 1.0503zm-1.5926-9.2623a3.8087 3.8087 0 0 0 .2417-.0697l.0851-.0421a3.8393 3.8393 0 0 0-1.0516-7.116l.115-.0659a3.8137 3.8137 0 0 0 1.6285 7.2377zm-1.7693-6.171a3.8367 3.8367 0 0 0-1.5194-1.3449l.0836-.1213A3.846 3.846 0 0 0 10.001 6.5a3.812 3.812 0 0 0 1.6308-7.2148l.0659-.1154a3.8173 3.8173 0 0 0-1.5865 7.1246z',
    'default': 'M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0 2A6 6 0 1 0 8 2a6 6 0 0 0 0 12z',
  }
  return icons[provider] || icons.default
}

// Get provider display color
const getProviderColor = (provider: string) => {
  const colors: Record<string, string> = {
    'ModelScope': '#1E40AF',
    'Qwen': '#0891B2',
    '01-ai': '#F59E0B',
    'Yi': '#F59E0B',
    'THUDM': '#8B5CF6',
    'Zhipu': '#8B5CF6',
    'GLM': '#8B5CF6',
    'Baichuan': '#3B82F6',
    'OpenAI': '#10B981',
    'default': '#6B7280',
  }
  return colors[provider] || colors.default
}

// Get provider display name
const getProviderName = (provider: string) => {
  const names: Record<string, string> = {
    'ModelScope': 'ModelScope',
    'Qwen': '通义千问',
    '01-ai': '零一万物',
    'Yi': 'Yi',
    'THUDM': '智谱 AI',
    'Zhipu': '智谱 AI',
    'GLM': 'GLM',
    'Baichuan': '百川智能',
  }
  return names[provider] || provider
}

// Model capability icons
const getCapabilityIcon = (capability: string) => {
  const icons: Record<string, string> = {
    'chat': '💬',
    'instruct': '📝',
    'vision': '👁️',
    'function_call': '🔧',
  }
  return icons[capability] || '✨'
}
</script>

<template>
  <div class="model-selector relative">
    <!-- Selected Model Button -->
    <button
      type="button"
      class="group flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl hover:border-emerald-400/50 hover:bg-white transition-all duration-300 min-w-[180px] shadow-sm hover:shadow-md"
      :class="{ 'border-emerald-500 ring-4 ring-emerald-500/10 bg-white': isOpen }"
      @click="toggleDropdown"
    >
      <!-- Loading spinner -->
      <div v-if="isLoading && !currentModel" class="relative">
        <svg class="w-8 h-8 animate-spin" viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            class="stroke-emerald-200"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            class="stroke-emerald-500"
            stroke-dasharray="90, 150"
            stroke-dashoffset="0"
          />
        </svg>
      </div>

      <!-- Model icon with gradient -->
      <div
        v-else
        class="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        :style="{ background: `linear-gradient(135deg, ${getProviderColor(currentModel?.provider || 'default')}20, ${getProviderColor(currentModel?.provider || 'default')}10)` }"
      >
        <svg class="w-5 h-5" :style="{ color: getProviderColor(currentModel?.provider || 'default') }" viewBox="0 0 24 24" fill="currentColor">
          <path :d="getProviderIcon(currentModel?.provider || 'default')" />
        </svg>
      </div>

      <div class="text-left flex-1">
        <p class="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-700">
          {{ currentModel?.name || '选择模型' }}
        </p>
        <p v-if="!compact && currentModel?.provider" class="text-xs text-gray-500 flex items-center gap-1">
          {{ getProviderName(currentModel.provider) }}
          <span v-if="currentModel.context_length" class="text-gray-400">
            · {{ (currentModel.context_length / 1024).toFixed(0) }}K
          </span>
        </p>
      </div>

      <!-- Animated arrow indicator -->
      <div class="relative w-5 h-5 flex items-center justify-center">
        <svg
          class="w-4 h-4 text-gray-400 transition-transform duration-300 absolute"
          :class="{ 'rotate-180 opacity-0': isOpen, 'opacity-100': !isOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        <svg
          class="w-4 h-4 text-emerald-500 transition-transform duration-300"
          :class="{ 'rotate-180 opacity-100': isOpen, 'opacity-0': !isOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      </div>
    </button>

    <!-- Dropdown Menu with animations -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95 -translate-y-2"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 -translate-y-2"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-3 w-[380px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/50 overflow-hidden z-50"
      >
        <!-- Header with gradient -->
        <div class="relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
          <div class="relative px-5 py-4">
            <!-- Search bar -->
            <div class="relative mb-3">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索模型..."
                class="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              >
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-900">选择 AI 模型</h3>
                  <p class="text-xs text-gray-500">点击切换不同的大语言模型</p>
                </div>
              </div>

              <button
                @click.stop="refreshModels"
                class="p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
                title="刷新模型列表"
              >
                <svg
                  class="w-4 h-4 text-gray-500"
                  :class="{ 'animate-spin': isLoading }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Decorative gradient line -->
          <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />
        </div>

        <!-- Error State -->
        <div v-if="error" class="p-6 text-center">
          <div class="w-14 h-14 mx-auto mb-3 bg-red-50 rounded-full flex items-center justify-center shadow-lg shadow-red-500/10">
            <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-sm text-gray-600 mb-3">{{ error }}</p>
          <button
            @click="refreshModels"
            class="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
          >
            重新加载
          </button>
        </div>

        <!-- Loading State -->
        <div v-else-if="isLoading && chatModels.length === 0" class="p-8 text-center">
          <div class="w-16 h-16 mx-auto mb-4 relative">
            <svg class="w-full h-full animate-spin" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                class="stroke-gray-200"
              />
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                class="stroke-emerald-500"
                stroke-dasharray="90, 150"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
          <p class="text-sm text-gray-600 font-medium">正在从 ModelScope 获取模型...</p>
          <p class="text-xs text-gray-400 mt-1">这可能需要几秒钟</p>
        </div>

        <!-- Models List -->
        <div v-else class="max-h-[400px] overflow-y-auto scrollbar-thin">
          <!-- Empty state -->
          <div v-if="Object.keys(filteredModels).length === 0" class="p-6 text-center">
            <div class="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p class="text-sm text-gray-500">未找到匹配的模型</p>
          </div>

          <template v-else>
            <div
              v-for="(modelList, provider) in filteredModels"
              :key="provider"
              class="mb-1"
            >
              <!-- Provider Header -->
              <div class="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-2 border-b border-gray-100/50">
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center"
                    :style="{ background: `${getProviderColor(provider)}15` }"
                  >
                    <svg class="w-4 h-4" :style="{ color: getProviderColor(provider) }" viewBox="0 0 24 24" fill="currentColor">
                      <path :d="getProviderIcon(provider)" />
                    </svg>
                  </div>
                  <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    {{ getProviderName(provider) }}
                  </span>
                  <span class="text-xs text-gray-400">({{ modelList.length }})</span>
                </div>
              </div>

              <!-- Model Items -->
              <div class="py-2 px-3 space-y-1">
                <button
                  v-for="model in modelList"
                  :key="model.id"
                  type="button"
                  class="w-full px-3 py-2.5 text-left rounded-xl transition-all duration-200 flex items-start gap-3 group"
                  :class="[
                    selectedModelId === model.id
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent hover:border-gray-200/50'
                  ]"
                  @click="handleSelect(model.id)"
                >
                  <!-- Provider icon -->
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    :class="selectedModelId === model.id ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30' : 'bg-gray-100'"
                  >
                    <svg
                      class="w-5 h-5"
                      :class="selectedModelId === model.id ? 'text-white' : 'text-gray-500'"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path :d="getProviderIcon(provider)" />
                    </svg>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p
                        class="text-sm font-semibold truncate transition-colors"
                        :class="selectedModelId === model.id ? 'text-emerald-900' : 'text-gray-900'"
                      >
                        {{ model.name }}
                      </p>
                      <span
                        v-if="model.isDefault"
                        class="px-1.5 py-0.5 text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded flex-shrink-0 shadow-sm"
                      >
                        推荐
                      </span>
                    </div>

                    <p
                      v-if="model.description"
                      class="text-xs mt-0.5 line-clamp-1 transition-colors"
                      :class="selectedModelId === model.id ? 'text-emerald-700/80' : 'text-gray-500'"
                    >
                      {{ model.description }}
                    </p>

                    <div class="flex items-center gap-3 mt-1.5">
                      <span
                        v-if="model.context_length"
                        class="inline-flex items-center gap-1 text-xs"
                        :class="selectedModelId === model.id ? 'text-emerald-600/70' : 'text-gray-400'"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {{ (model.context_length / 1024).toFixed(0) }}K
                      </span>
                      <span
                        v-for="cap in model.capabilities?.slice(0, 2)"
                        :key="cap"
                        class="text-xs"
                        :class="selectedModelId === model.id ? 'text-emerald-600/70' : 'text-gray-400'"
                      >
                        {{ getCapabilityIcon(cap) }}
                      </span>
                    </div>
                  </div>

                  <!-- Selected indicator -->
                  <div
                    v-if="selectedModelId === model.id"
                    class="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30"
                  >
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 bg-gray-50/80 border-t border-gray-100/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p class="text-xs text-gray-500">
                共 {{ chatModels.length }} 个模型可用
              </p>
            </div>
            <p v-if="currentModel" class="text-xs text-gray-500">
              <span class="text-gray-400">当前:</span>
              <span class="font-medium text-emerald-600 ml-1">{{ currentModel.name }}</span>
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 bg-gray-900/5 backdrop-blur-sm"
        @click="isOpen = false"
      />
    </Transition>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}

.model-selector {
  z-index: 100;
}
</style>
