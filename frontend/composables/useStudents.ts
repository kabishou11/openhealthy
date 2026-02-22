// Students API Composable
import { useAuthStore } from '~/stores/auth'

interface Student {
  id: string
  user_id?: string
  school_id: string
  class_id?: string
  student_id?: string
  name: string
  gender: string
  birth_date: string
  avatar?: string
  height?: number
  weight?: number
  bmi?: number
  vision_left?: number
  vision_right?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  allergies: string[]
  conditions: string[]
  class_name?: string
  school_name?: string
  status: string
  created_at: string
}

interface SpecialDiet {
  id: string
  student_id: string
  type: string
  detail: string
  severity: string
  start_date: string
  end_date?: string
  reason?: string
  status: string
  created_at: string
}

interface BMIStats {
  total: number
  underweight: number
  normal: number
  overweight: number
  obese: number
  unknown: number
  underweightPercent: number
  normalPercent: number
  overweightPercent: number
  obesePercent: number
  unknownPercent: number
}

export function useStudentsAPI() {
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

  // Get all students
  const getStudents = async (params?: {
    schoolId?: string
    classId?: string
    status?: string
  }): Promise<Student[]> => {
    const queryParams = new URLSearchParams()
    if (params?.schoolId) queryParams.append('schoolId', params.schoolId)
    if (params?.classId) queryParams.append('classId', params.classId)
    if (params?.status) queryParams.append('status', params.status)

    const url = `${config.public.apiBase}/students${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch students')
    }

    const data = await response.json()
    return data.data
  }

  // Get student by ID
  const getStudent = async (id: string): Promise<Student> => {
    const response = await fetch(`${config.public.apiBase}/students/${id}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch student')
    }

    const data = await response.json()
    return data.data
  }

  // Create student
  const createStudent = async (student: {
    userId?: string
    schoolId: string
    classId?: string
    studentId?: string
    name: string
    gender: string
    birthDate: string
    height?: number
    weight?: number
    visionLeft?: number
    visionRight?: number
    allergies?: string[]
    conditions?: string[]
  }): Promise<{ id: string }> => {
    const response = await fetch(`${config.public.apiBase}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(student),
    })

    if (!response.ok) {
      throw new Error('Failed to create student')
    }

    const data = await response.json()
    return data.data
  }

  // Update student
  const updateStudent = async (id: string, updates: {
    classId?: string
    height?: number
    weight?: number
    visionLeft?: number
    visionRight?: number
    allergies?: string[]
    conditions?: string[]
    status?: string
  }): Promise<{ id: string }> => {
    const response = await fetch(`${config.public.apiBase}/students/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update student')
    }

    const data = await response.json()
    return data.data
  }

  // Get special diets for a student
  const getSpecialDiets = async (studentId: string): Promise<SpecialDiet[]> => {
    const response = await fetch(`${config.public.apiBase}/students/${studentId}/diets`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch special diets')
    }

    const data = await response.json()
    return data.data
  }

  // Add special diet for a student
  const addSpecialDiet = async (studentId: string, diet: {
    type: string
    detail: string
    severity: string
    startDate: string
    endDate?: string
    reason?: string
  }): Promise<{ id: string }> => {
    const response = await fetch(`${config.public.apiBase}/students/${studentId}/diets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(diet),
    })

    if (!response.ok) {
      throw new Error('Failed to create special diet')
    }

    const data = await response.json()
    return data.data
  }

  // Get BMI statistics
  const getBMIStats = async (schoolId?: string): Promise<BMIStats> => {
    const url = schoolId
      ? `${config.public.apiBase}/students/stats/bmi?schoolId=${schoolId}`
      : `${config.public.apiBase}/students/stats/bmi`

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch BMI stats')
    }

    const data = await response.json()
    return data.data
  }

  // Get linked students for parent
  const getLinkedStudents = async (): Promise<Student[]> => {
    const response = await fetch(`${config.public.apiBase}/students/linked`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch linked students')
    }

    const data = await response.json()
    return data.data
  }

  // Get students with special diets (for cafeteria)
  const getStudentsWithSpecialDiets = async (params?: {
    schoolId?: string
    cafeteriaId?: string
  }): Promise<Student[]> => {
    const queryParams = new URLSearchParams()
    if (params?.schoolId) queryParams.append('schoolId', params.schoolId)
    if (params?.cafeteriaId) queryParams.append('cafeteriaId', params.cafeteriaId)

    const url = `${config.public.apiBase}/students/special-diets${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch students with special diets')
    }

    const data = await response.json()
    return data.data
  }

  return {
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    getSpecialDiets,
    addSpecialDiet,
    getBMIStats,
    getLinkedStudents,
    getStudentsWithSpecialDiets,
  }
}
