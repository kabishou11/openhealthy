<script setup lang="ts">
/**
 * Random Draw Composable
 *
 * Provides utilities for random selection animations
 * inspired by whatToEat's 抽取 (draw) interactions
 */

interface DrawOptions {
  duration?: number
  shuffleCount?: number
}

interface DrawResult<T> {
  selected: T
  isAnimating: boolean
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Select random item with shuffle animation effect
 */
export function useRandomDraw<T>(items: T[], options: DrawOptions = {}) {
  const { duration = 300, shuffleCount = 3 } = options

  const selectedIndex = ref<number | null>(null)
  const isAnimating = ref(false)
  const shuffledItems = ref<T[]>([])

  const selected = computed<T | null>(() => {
    if (selectedIndex.value === null) return null
    return items[selectedIndex.value]
  })

  const draw = async (): Promise<DrawResult<T>> => {
    if (items.length === 0) {
      return { selected: null as T, isAnimating: false }
    }

    isAnimating.value = true
    shuffledItems.value = shuffleArray(items)

    // Shuffle animation
    for (let i = 0; i < shuffleCount; i++) {
      shuffledItems.value = shuffleArray(shuffledItems.value)
      await new Promise(resolve => setTimeout(resolve, duration))
    }

    // Select final item
    selectedIndex.value = Math.floor(Math.random() * items.length)
    isAnimating.value = false

    return {
      selected: items[selectedIndex.value],
      isAnimating: false,
    }
  }

  const reset = () => {
    selectedIndex.value = null
    shuffledItems.value = []
    isAnimating.value = false
  }

  return {
    selected,
    selectedIndex,
    shuffledItems,
    isAnimating,
    draw,
    reset,
  }
}

/**
 * Slot machine style selection
 */
export function useSlotMachine<T extends { name: string; icon?: string }>(
  items: T[],
  options: { columns?: number; speed?: number } = {}
) {
  const { columns = 1, speed = 50 } = options

  const currentIndices = ref<number[]>(new Array(columns).fill(0))
  const isSpinning = ref(false)
  const result = ref<T | null>(null)

  const spin = async (): Promise<T> => {
    if (items.length === 0) return null as T

    isSpinning.value = true

    // Spin each column with delay
    for (let col = 0; col < columns; col++) {
      const spinCount = 10 + Math.floor(Math.random() * 10)

      for (let i = 0; i < spinCount; i++) {
        currentIndices.value[col] = Math.floor(Math.random() * items.length)
        await new Promise(resolve => setTimeout(resolve, speed))
      }
    }

    // Select final result
    const finalIndex = Math.floor(Math.random() * items.length)
    currentIndices.value = new Array(columns).fill(finalIndex)
    result.value = items[finalIndex]
    isSpinning.value = false

    return items[finalIndex]
  }

  return {
    currentIndices,
    isSpinning,
    result,
    spin,
  }
}

/**
 * Random emoji picker with animation
 */
export function useEmojiPicker() {
  const celebrationEmojis = ['🎉', '✨', '🌟', '💫', '🎊', '⭐', '💖', '💯']

  const { selected, draw, isAnimating } = useRandomDraw(celebrationEmojis)

  const showEmoji = async (): Promise<string> => {
    const result = await draw()
    return result.selected || ''
  }

  return {
    emoji: selected,
    isAnimating,
    showEmoji,
  }
}
</script>
