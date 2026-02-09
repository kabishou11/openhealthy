/**
 * OCR Routes - GLM-OCR Pipeline
 *
 * API endpoints for GLM-OCR functionality
 * Model is loaded on-demand by user clicking the load button
 */

// Local OCR service configuration - can be overridden with GLM_OCR_URL env var
const GLM_OCR_URL = process.env.GLM_OCR_URL || 'http://127.0.0.1:8081'

// Maximum image size (5MB base64 = ~3.75MB actual)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

// PDF parsing function
async function parsePdf(buffer: Buffer): Promise<{ numpages: number; text: string }> {
  try {
    // Try dynamic import first
    const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js').catch(() => null)
    if (pdfParseModule && typeof pdfParseModule.default === 'function') {
      return pdfParseModule.default(buffer)
    }

    // Fallback: try standard import
    const pdfParseFn = (await import('pdf-parse')).default
    return pdfParseFn(buffer)
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err}`)
  }
}

// Get OCR service status
async function getOCRStatus(): Promise<{
  available: boolean
  modelLoaded: boolean
  loading: boolean
  progress: { stage: string; percent: number; message: string } | null
}> {
  try {
    const response = await fetch(`${GLM_OCR_URL}/health`, { signal: AbortSignal.timeout(2000) })
    if (response.ok) {
      const status = await response.json() as {
        model_loaded?: boolean
        progress?: { stage: string; percent: number; message: string }
      }
      return {
        available: status.model_loaded ?? false,
        modelLoaded: status.model_loaded ?? false,
        loading: false,
        progress: status.progress ?? null,
      }
    }
  } catch {
    // Service not available
  }
  return {
    available: false,
    modelLoaded: false,
    loading: false,
    progress: null,
  }
}

export async function registerOCRRoutes(fastify: any) {
  // Get OCR status
  fastify.get('/api/v1/ocr/status', async () => {
    const status = await getOCRStatus()
    return {
      available: status.available,
      modelLoaded: status.modelLoaded,
      loading: status.loading,
      progress: status.progress,
      service: 'glm-ocr-pipeline',
      url: GLM_OCR_URL,
    }
  })

  // Load GLM-OCR model
  fastify.post('/api/v1/ocr/load', async (request: any, reply: any) => {
    try {
      const response = await fetch(`${GLM_OCR_URL}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const result = await response.json() as { success?: boolean; message?: string }
      return {
        success: true,
        message: result.message || '模型加载完成',
      }
    } catch (error: any) {
      fastify.log.error('Failed to load OCR model:', error)
      return reply.status(500).send({ error: error.message || '加载模型失败' })
    }
  })

  // Unload GLM-OCR model
  fastify.post('/api/v1/ocr/unload', async () => {
    try {
      await fetch(`${GLM_OCR_URL}/unload`, { method: 'POST' })
      return { success: true, message: '模型已卸载' }
    } catch {
      return { success: false, message: '卸载模型失败' }
    }
  })

  // Perform OCR on image
  fastify.post('/api/v1/ocr', async (request: any, reply: any) => {
    const { image, prompt } = request.body as { image: string; prompt?: string }

    if (!image) {
      return reply.status(400).send({ error: 'Image data is required' })
    }

    // Check image size (base64 overhead is ~37%)
    const base64Length = image.split(',')[1]?.length || image.length
    if (base64Length > MAX_IMAGE_SIZE) {
      return reply.status(413).send({
        error: '图片太大',
        message: '请上传小于5MB的图片，或尝试压缩后再上传'
      })
    }

    // Check if model is loaded
    const status = await getOCRStatus()
    if (!status.available) {
      return reply.status(503).send({
        error: 'OCR 模型未加载',
        message: '请点击"加载模型"按钮加载 GLM-OCR 模型',
        tip: 'POST /api/v1/ocr/load',
      })
    }

    try {
      const response = await fetch(`${GLM_OCR_URL}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ocr', image, prompt: prompt || 'Text Recognition:' }),
      })

      if (!response.ok) {
        const error = await response.text() as string
        throw new Error(`OCR service error: ${error}`)
      }

      const result = await response.json() as { text?: string }
      return {
        success: true,
        text: result.text || '',
        confidence: 0.95,
        model: 'glm-ocr-pipeline',
      }
    } catch (error: any) {
      fastify.log.error('OCR failed:', error)
      return reply.status(500).send({ error: error.message || 'OCR failed' })
    }
  })

  // OCR health checkup data extraction
  fastify.post('/api/v1/ocr/health-checkup', async (request: any, reply: any) => {
    const { image } = request.body as { image: string }

    if (!image) {
      return reply.status(400).send({ error: 'Image data is required' })
    }

    // Check image size
    const base64Length = image.split(',')[1]?.length || image.length
    if (base64Length > MAX_IMAGE_SIZE) {
      return reply.status(413).send({
        error: '图片太大',
        message: '请上传小于5MB的图片'
      })
    }

    // Check if model is loaded
    const status = await getOCRStatus()
    if (!status.available) {
      return reply.status(503).send({
        error: 'OCR 模型未加载',
        message: '请点击"加载模型"按钮加载 GLM-OCR 模型',
      })
    }

    try {
      fastify.log.info('Using GLM-OCR pipeline for health checkup extraction')

      const response = await fetch(`${GLM_OCR_URL}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health', image }),
      })

      if (!response.ok) {
        throw new Error('OCR service error')
      }

      const result = await response.json() as { success?: boolean; data?: Record<string, any> }

      if (result.success && result.data) {
        const data = result.data

        // Convert to our HealthProfile format
        const healthData = {
          name: (data.name || '') as string,
          studentId: (data.student_id || data.studentId || '') as string,
          school: (data.school || '') as string,
          grade: (data.grade || '') as string,
          class: (data.class || '') as string,
          gender: (data.gender || '') as string,
          birthDate: (data.birth_date || data.birthDate || '') as string,
          checkDate: (data.check_date || data.checkDate || new Date().toISOString().split('T')[0]) as string,
          metrics: {
            height: Number(data.height) || 0,
            weight: Number(data.weight) || 0,
            bmi: Number(data.bmi) || 0,
            visionLeft: Number(data.vision_left || data.visionLeft) || 0,
            visionRight: Number(data.vision_right || data.visionRight) || 0,
            bloodPressureSystolic: Number(data.blood_pressure_systolic || data.bloodPressureSystolic) || 0,
            bloodPressureDiastolic: Number(data.blood_pressure_diastolic || data.bloodPressureDiastolic) || 0,
            heartRate: Number(data.heart_rate || data.heartRate) || 0,
            hemoglobin: Number(data.hemoglobin) || 0,
            lungCapacity: Number(data.lung_capacity || data.lungCapacity) || 0,
          },
          allergies: (data.allergies || []) as string[],
          conditions: (data.conditions || []) as string[],
          notes: '',
        }

        return {
          success: true,
          rawText: data.raw_text || '',
          extractedData: healthData,
          model: 'glm-ocr-pipeline',
          source: 'glm-ocr-pipeline',
        }
      }

      return reply.status(500).send({ error: 'Failed to extract health data' })
    } catch (error: any) {
      fastify.log.error('Health OCR failed:', error)
      return reply.status(500).send({ error: error.message || 'Health OCR failed' })
    }
  })

  // PDF upload and parse endpoint
  fastify.post('/api/v1/ocr/pdf', async (request: any, reply: any) => {
    try {
      const { file, filename } = request.body as { file: string; filename?: string }

      if (!file) {
        return reply.status(400).send({ error: 'No file data provided' })
      }

      // Decode base64 to buffer
      let fileBuffer: Buffer
      if (file.startsWith('data:application/pdf;base64,')) {
        const base64Data = file.replace(/^data:application\/pdf;base64,/, '')
        fileBuffer = Buffer.from(base64Data, 'base64')
      } else {
        fileBuffer = Buffer.from(file, 'base64')
      }

      fastify.log.info(`Processing PDF file: ${filename || 'unknown'}, size: ${fileBuffer.length} bytes`)

      // Parse PDF
      const pdfData = await parsePdf(fileBuffer)
      fastify.log.info(`PDF parsed: ${pdfData.numpages} pages, text length: ${pdfData.text.length}`)

      // Parse health data from text
      const healthData = parseHealthDataFromText(pdfData.text)

      return {
        success: true,
        pages: pdfData.numpages,
        rawText: pdfData.text.substring(0, 2000),
        extractedData: healthData,
        source: 'pdf-parse',
      }
    }
    catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: error.message || 'PDF processing failed' })
    }
  })
}

// Helper: Parse health data from OCR text using regex patterns
function parseHealthDataFromText(text: string): Record<string, any> {
  const data: Record<string, any> = {}
  const nameMatch = text.match(/姓名[：:]\s*(.+?)(?:\s|$|，|。)/i)
  if (nameMatch) data.name = nameMatch[1].trim()

  const genderMatch = text.match(/性别[：:]\s*(男|女)/i)
  if (genderMatch) data.gender = genderMatch[1]

  const heightMatch = text.match(/身高[：:]\s*(\d+\.?\d*)\s*cm/i)
  if (heightMatch) data.height = parseFloat(heightMatch[1])

  const weightMatch = text.match(/体重[：:]\s*(\d+\.?\d*)\s*kg/i)
  if (weightMatch) data.weight = parseFloat(weightMatch[1])

  const bmiMatch = text.match(/BMI[：:]\s*(\d+\.?\d*)/i)
  if (bmiMatch) data.bmi = parseFloat(bmiMatch[1])

  if (data.height && data.weight && data.height > 0 && data.weight > 0) {
    const heightM = data.height / 100
    data.bmi = Math.round((data.weight / (heightM * heightM)) * 10) / 10
  }

  const visionLeftMatch = text.match(/左眼[视力：:]\s*(\d+\.?\d*)/i)
  const visionRightMatch = text.match(/右眼[视力：:]\s*(\d+\.?\d*)/i)
  if (visionLeftMatch || visionRightMatch) {
    data.visionLeft = parseFloat(visionLeftMatch?.[1]) || 0
    data.visionRight = parseFloat(visionRightMatch?.[1]) || 0
  }

  const bpMatch = text.match(/血压[：:]\s*(\d+)[/／](\d+)/i)
  if (bpMatch) {
    data.bloodPressureSystolic = parseInt(bpMatch[1])
    data.bloodPressureDiastolic = parseInt(bpMatch[2])
  }

  const heartMatch = text.match(/心率[：:]\s*(\d+)/i)
  if (heartMatch) data.heartRate = parseInt(heartMatch[1])

  const lungMatch = text.match(/肺活量[：:]\s*(\d+)/i)
  if (lungMatch) data.lungCapacity = parseInt(lungMatch[1])

  const hemoglobinMatch = text.match(/血红蛋白[：:]\s*(\d+\.?\d*)/i)
  if (hemoglobinMatch) data.hemoglobin = parseFloat(hemoglobinMatch[1])

  const allergyMatch = text.match(/过敏[原物][：:]\s*(.+)/i)
  if (allergyMatch) {
    data.allergies = allergyMatch[1].split(/[,，、]/).map((s: string) => s.trim()).filter(Boolean)
  }

  const conditionMatch = text.match(/既往[病疾]史[：:]\s*(.+)/i)
  if (conditionMatch) {
    data.conditions = conditionMatch[1].split(/[,，、]/).map((s: string) => s.trim()).filter(Boolean)
  }

  const studentIdMatch = text.match(/学号[：:]\s*(.+)/i)
  if (studentIdMatch) data.studentId = studentIdMatch[1].trim()

  const schoolMatch = text.match(/学校[：:]\s*(.+)/i)
  if (schoolMatch) data.school = schoolMatch[1].trim()

  const gradeMatch = text.match(/(年级|班级)[：:]\s*(.+)/i)
  if (gradeMatch) {
    const parts = gradeMatch[2].trim().split(/[年级班]/)
    if (parts.length >= 1) data.grade = parts[0].trim()
    if (parts.length >= 2) data.class = parts[1].trim()
  }

  return {
    name: data.name || '',
    studentId: data.studentId || '',
    school: data.school || '',
    grade: data.grade || '',
    class: data.class || '',
    gender: data.gender || '',
    birthDate: data.birthDate || '',
    checkDate: data.checkDate || new Date().toISOString().split('T')[0],
    metrics: {
      height: data.height || 0,
      weight: data.weight || 0,
      bmi: data.bmi || 0,
      visionLeft: data.visionLeft || 0,
      visionRight: data.visionRight || 0,
      bloodPressureSystolic: data.bloodPressureSystolic || 0,
      bloodPressureDiastolic: data.bloodPressureDiastolic || 0,
      heartRate: data.heartRate || 0,
      hemoglobin: data.hemoglobin || 0,
      lungCapacity: data.lungCapacity || 0,
    },
    allergies: data.allergies || [],
    conditions: data.conditions || [],
    notes: '',
  }
}
