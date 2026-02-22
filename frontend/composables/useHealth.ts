// Health API Composable
import { useAuthStore } from '~/stores/auth'

interface HealthRecord {
  id: string
  student_id: string
  checkup_date: string
  school_year?: string
  height: number
  weight: number
  bmi: number
  vision_left: number
  vision_right: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  hemoglobin?: number
  fasting_glucose?: number
  ai_analysis?: string
  created_at: string
}

interface HealthSummary {
  latestRecord: {
    bmiCategory: string
    raw_data: Record<string, any> | null
  } | null
  specialDiets: any[]
  nutritionTargets: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
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

export function useHealthAPI() {
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

  // Get health records for a student
  const getHealthRecords = async (studentId: string): Promise<HealthRecord[]> => {
    const response = await fetch(`${config.public.apiBase}/health/records/${studentId}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch health records')
    }

    const data = await response.json()
    return data.data
  }

  // Get health summary for a student
  const getHealthSummary = async (studentId: string): Promise<HealthSummary> => {
    const response = await fetch(`${config.public.apiBase}/health/summary/${studentId}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch health summary')
    }

    const data = await response.json()
    return data.data
  }

  // Get health trend data
  const getHealthTrend = async (studentId: string): Promise<HealthRecord[]> => {
    const response = await fetch(`${config.public.apiBase}/health/trend/${studentId}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch health trend')
    }

    const data = await response.json()
    return data.data
  }

  // Create new health record
  const createHealthRecord = async (record: {
    studentId: string
    checkupDate: string
    schoolYear?: string
    height: number
    weight: number
    bmi: number
    visionLeft: number
    visionRight: number
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    hemoglobin?: number
    fastingGlucose?: number
  }): Promise<{ id: string }> => {
    const response = await fetch(`${config.public.apiBase}/health/records`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(record),
    })

    if (!response.ok) {
      throw new Error('Failed to create health record')
    }

    const data = await response.json()
    return data.data
  }

  // Calculate BMI
  const calculateBMI = (height: number, weight: number): number => {
    if (!height || !weight || height <= 0) return 0
    const heightM = height / 100
    return Math.round((weight / (heightM * heightM)) * 10) / 10
  }

  // Get BMI category
  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return '偏瘦'
    if (bmi < 24) return '正常'
    if (bmi < 28) return '偏胖'
    return '肥胖'
  }

  // Calculate nutrition needs based on age, gender, and activity
  const calculateNutritionNeeds = (age: number, gender: string, activityLevel: string = 'moderate'): {
    calories: number
    protein: number
    fat: number
    carbs: number
  } => {
    // Base BMR calculation (Mifflin-St Jeor)
    let bmr: number
    if (gender === 'male') {
      bmr = 10 * 55 + 6.25 * 165 - 5 * age + 5
    } else {
      bmr = 10 * 45 + 6.25 * 160 - 5 * age - 161
    }

    // Activity multiplier
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    }
    const multiplier = multipliers[activityLevel] || 1.55

    const tdee = Math.round(bmr * multiplier)

    // Macronutrient distribution
    return {
      calories: tdee,
      protein: Math.round(tdee * 0.15 / 4), // 15% protein
      fat: Math.round(tdee * 0.25 / 9), // 25% fat
      carbs: Math.round(tdee * 0.60 / 4), // 60% carbs
    }
  }

  return {
    getHealthRecords,
    getHealthSummary,
    getHealthTrend,
    createHealthRecord,
    calculateBMI,
    getBMICategory,
    calculateNutritionNeeds,
  }
}
