// Schools API Composable
import { useAuthStore } from '~/stores/auth'

interface School {
  id: string
  name: string
  type: string
  address?: string
  contact_phone?: string
  student_count?: number
  nutrition_standard?: {
    calories: number
    protein: number
    fat: number
    sodium: number
  }
  is_active: boolean
  created_at: string
}

interface Cafeteria {
  id: string
  school_id: string
  name: string
  type: string
  capacity: number
  opening_hours?: {
    breakfast: string
    lunch: string
    dinner: string
  }
  status: string
}

interface Class {
  id: string
  school_id: string
  name: string
  grade?: string
}

export function useSchoolsAPI() {
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

  // Get schools
  const getSchools = async (): Promise<School[]> => {
    const response = await fetch(`${config.public.apiBase}/schools`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch schools')
    }

    const data = await response.json()
    return data.data.map((s: any) => ({
      ...s,
      nutrition_standard: s.nutrition_standard ? JSON.parse(s.nutrition_standard) : null,
    }))
  }

  // Get school by ID
  const getSchool = async (id: string): Promise<School> => {
    const response = await fetch(`${config.public.apiBase}/schools/${id}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch school')
    }

    const data = await response.json()
    return {
      ...data.data,
      nutrition_standard: data.data.nutrition_standard ? JSON.parse(data.data.nutrition_standard) : null,
    }
  }

  // Get cafeterias for a school
  const getCafeterias = async (schoolId: string): Promise<Cafeteria[]> => {
    const response = await fetch(`${config.public.apiBase}/schools/${schoolId}/cafeterias`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch cafeterias')
    }

    const data = await response.json()
    return data.data.map((c: any) => ({
      ...c,
      opening_hours: c.opening_hours ? JSON.parse(c.opening_hours) : null,
    }))
  }

  // Get classes for a school
  const getClasses = async (schoolId: string): Promise<Class[]> => {
    const response = await fetch(`${config.public.apiBase}/schools/${schoolId}/classes`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch classes')
    }

    const data = await response.json()
    return data.data
  }

  // Create school
  const createSchool = async (school: {
    name: string
    type: string
    address?: string
    contact_phone?: string
  }): Promise<{ id: string }> => {
    const response = await fetch(`${config.public.apiBase}/schools`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(school),
    })

    if (!response.ok) {
      throw new Error('Failed to create school')
    }

    const data = await response.json()
    return data.data
  }

  // Update school
  const updateSchool = async (id: string, updates: Partial<School>): Promise<{ id: string }> => {
    const response = await fetch(`${config.public.apiBase}/schools/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update school')
    }

    const data = await response.json()
    return data.data
  }

  // Create cafeteria
  const createCafeteria = async (cafeteria: {
    schoolId: string
    name: string
    type: string
    capacity: number
    opening_hours?: {
      breakfast: string
      lunch: string
      dinner: string
    }
  }): Promise<{ id: string }> => {
    const response = await fetch(`${config.public.apiBase}/cafeterias`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cafeteria),
    })

    if (!response.ok) {
      throw new Error('Failed to create cafeteria')
    }

    const data = await response.json()
    return data.data
  }

  // Create class
  const createClass = async (classData: {
    schoolId: string
    name: string
    grade?: string
  }): Promise<{ id: string }> => {
    const response = await fetch(`${config.public.apiBase}/classes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(classData),
    })

    if (!response.ok) {
      throw new Error('Failed to create class')
    }

    const data = await response.json()
    return data.data
  }

  return {
    getSchools,
    getSchool,
    getCafeterias,
    getClasses,
    createSchool,
    updateSchool,
    createCafeteria,
    createClass,
  }
}
