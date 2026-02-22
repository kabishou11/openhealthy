// OCR API Composable
import { useAuthStore } from '~/stores/auth'

export interface OCRStatus {
  loaded: boolean
  model_loaded: boolean
  model_name?: string
}

export interface HealthCheckupData {
  name?: string
  gender?: string
  age?: number
  height?: number
  weight?: number
  bmi?: number
  vision_left?: number
  vision_right?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  heart_rate?: number
  hemoglobin?: number
  raw_text: string
  confidence: number
}

export interface OCRResult {
  text: string
  confidence: number
  words?: Array<{
    text: string
    confidence: number
    bbox: [number, number, number, number]
  }>
}

export function useOCR() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {}
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }
    return headers
  }

  // Check OCR service status
  const checkStatus = async (): Promise<OCRStatus> => {
    const response = await fetch(`${config.public.apiBase}/ocr/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to check OCR status')
    }

    const data = await response.json()
    return data.data
  }

  // Load OCR model
  const loadModel = async (modelName: string = 'glm-4v-flash'): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${config.public.apiBase}/ocr/load`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: modelName }),
    })

    if (!response.ok) {
      throw new Error('Failed to load OCR model')
    }

    const data = await response.json()
    return data.data
  }

  // Perform OCR on image (base64 or URL)
  const recognizeImage = async (imageData: string | File): Promise<OCRResult> => {
    let body: any

    if (typeof imageData === 'string') {
      // Check if it's a URL or base64
      if (imageData.startsWith('http')) {
        body = { url: imageData }
      } else {
        body = { image: imageData }
      }
    } else {
      // Convert File to base64
      body = { file: imageData.name }
    }

    const response = await fetch(`${config.public.apiBase}/ocr`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error('Failed to perform OCR')
    }

    const data = await response.json()
    return data.data
  }

  // Extract health checkup data from image
  const extractHealthCheckup = async (imageData: string | File): Promise<HealthCheckupData> => {
    let body: any

    if (typeof imageData === 'string') {
      if (imageData.startsWith('http')) {
        body = { url: imageData }
      } else {
        body = { image: imageData }
      }
    } else {
      body = { file: imageData.name }
    }

    const response = await fetch(`${config.public.apiBase}/ocr/health-checkup`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error('Failed to extract health checkup data')
    }

    const data = await response.json()
    return data.data
  }

  // Parse PDF for health checkup data
  const parsePDF = async (file: File): Promise<HealthCheckupData> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${config.public.apiBase}/ocr/pdf`, {
      method: 'POST',
      headers: {
        'Authorization': authStore.token ? `Bearer ${authStore.token}` : '',
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to parse PDF')
    }

    const data = await response.json()
    return data.data
  }

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Upload image and extract health checkup (simplified)
  const uploadAndExtract = async (file: File): Promise<HealthCheckupData> => {
    const base64 = await fileToBase64(file)
    return extractHealthCheckup(base64)
  }

  return {
    checkStatus,
    loadModel,
    recognizeImage,
    extractHealthCheckup,
    parsePDF,
    fileToBase64,
    uploadAndExtract,
  }
}
