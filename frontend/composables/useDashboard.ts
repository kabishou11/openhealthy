// Dashboard API Composable
import { useAuthStore } from '~/stores/auth'

interface User {
  id: string
  phone: string
  name: string
  role: string
  avatar?: string
}

interface Student {
  id: string
  name: string
  bmi?: number
  class_name?: string
}

interface DailyMenu {
  id: string
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
}

interface DashboardData {
  user: User
  students: Student[]
  todayMenu: DailyMenu | null
}

export function useDashboardAPI() {
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

  // Get dashboard data
  const getDashboardData = async (): Promise<DashboardData> => {
    const user = authStore.user
    if (!user) {
      throw new Error('User not authenticated')
    }

    const [studentsResponse, todayMenuResponse] = await Promise.all([
      fetch(`${config.public.apiBase}/students/linked`, {
        headers: getAuthHeaders(),
      }),
      fetch(`${config.public.apiBase}/menus/today`, {
        headers: getAuthHeaders(),
      }),
    ])

    const students = studentsResponse.ok ? (await studentsResponse.json()).data : []
    const todayMenu = todayMenuResponse.ok ? (await todayMenuResponse.json()).data : null

    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      students,
      todayMenu,
    }
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

  return {
    getDashboardData,
    getTodayMenu,
    getWeekMenu,
  }
}
