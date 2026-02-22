// Menus API Composable
import { useAuthStore } from '~/stores/auth'

interface Dish {
  id: string
  cafeteria_id: string
  name: string
  category: string
  difficulty?: string
  cooking_time?: number
  portion_size?: string
  price: number
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  allergens?: string[]
  tags?: string[]
  contraindications?: string[]
  is_available: boolean
  is_special: boolean
}

interface DailyMenu {
  id: string
  cafeteria_id: string
  date: string
  week_day: number
  meals: {
    breakfast: Array<{ name: string; portion: string }>
    lunch: Array<{ name: string; portion: string }>
    dinner: Array<{ name: string; portion: string }>
  }
  total_nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  status: string
  published_at?: string
}

export function useMenusAPI() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }
    return headers
  }

  // Get today's menu
  const getTodayMenu = async (): Promise<DailyMenu | null> => {
    const response = await fetch(`${config.public.apiBase}/menus/today`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.data
  }

  // Get week menu
  const getWeekMenu = async (): Promise<DailyMenu[]> => {
    const response = await fetch(`${config.public.apiBase}/menus/week`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.data
  }

  // Create daily menu
  const createMenu = async (menu: {
    cafeteriaId: string
    date: string
    weekDay: number
    meals: {
      breakfast: Array<{ name: string; portion: string }>
      lunch: Array<{ name: string; portion: string }>
      dinner: Array<{ name: string; portion: string }>
    }
  }): Promise<{ id: string }> => {
    const response = await fetch(`${config.public.apiBase}/menus`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(menu),
    })

    if (!response.ok) {
      throw new Error('Failed to create menu')
    }

    const data = await response.json()
    return data.data
  }

  // Update daily menu
  const updateMenu = async (id: string, updates: {
    meals?: {
      breakfast: Array<{ name: string; portion: string }>
      lunch: Array<{ name: string; portion: string }>
      dinner: Array<{ name: string; portion: string }>
    }
    status?: string
  }): Promise<{ id: string }> => {
    const response = await fetch(`${config.public.apiBase}/menus/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update menu')
    }

    const data = await response.json()
    return data.data
  }

  // Publish menu
  const publishMenu = async (id: string): Promise<void> => {
    const response = await fetch(`${config.public.apiBase}/menus/${id}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to publish menu')
    }
  }

  // Get dishes
  const getDishes = async (params?: {
    category?: string
    cafeteriaId?: string
  }): Promise<Dish[]> => {
    const queryParams = new URLSearchParams()
    if (params?.category) queryParams.append('category', params.category)
    if (params?.cafeteriaId) queryParams.append('cafeteriaId', params.cafeteriaId)

    const url = `${config.public.apiBase}/dishes${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch dishes')
    }

    const data = await response.json()
    return data.data
  }

  // Get dish by ID
  const getDish = async (id: string): Promise<Dish> => {
    const response = await fetch(`${config.public.apiBase}/dishes/${id}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch dish')
    }

    const data = await response.json()
    return data.data
  }

  // Search dishes
  const searchDishes = async (query: string): Promise<Dish[]> => {
    const response = await fetch(`${config.public.apiBase}/dishes/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to search dishes')
    }

    const data = await response.json()
    return data.data
  }

  return {
    getTodayMenu,
    getWeekMenu,
    createMenu,
    updateMenu,
    publishMenu,
    getDishes,
    getDish,
    searchDishes,
  }
}
