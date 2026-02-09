/**
 * OCR Service
 *
 * Provides OCR functionality for health checkup data extraction
 * Supports: Zhipu AI (智谱 AI), Baidu OCR
 */

import { config } from '../config.js'

export interface OCRResult {
  text: string
  confidence: number
  items?: OCRItem[]
}

export interface OCRItem {
  text: string
  type: string
  confidence: number
  boundingBox?: number[]
}

/**
 * OCR Service - Zhipu AI Implementation
 */
class ZhipuOCRService {
  private apiKey: string
  private apiBase: string

  constructor() {
    this.apiKey = config.zhipuApiKey
    this.apiBase = config.zhipuApiBase
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  /**
   * Perform OCR on an image
   */
  async ocr(imageData: string): Promise<OCRResult> {
    if (!this.isConfigured()) {
      throw new Error('Zhipu OCR API key not configured')
    }

    const response = await fetch(`${this.apiBase}/vision/ocr GeneralBasic`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Zhipu OCR API error: ${error}`)
    }

    const data: any = await response.json()

    // Parse result
    const text = data.data?.result?.text || ''
    const items: OCRItem[] = (data.data?.result?.lines || []).map((line: any, index: number) => ({
      text: line.text || '',
      type: 'text',
      confidence: line.probability || 0.95,
    }))

    return {
      text,
      confidence: items.length > 0
        ? items.reduce((sum: number, item: OCRItem) => sum + item.confidence, 0) / items.length
        : 0,
      items,
    }
  }
}

/**
 * OCR Service - Baidu OCR Implementation
 */
class BaiduOCRService {
  private apiKey: string
  private secretKey: string
  private accessToken: string | null = null

  constructor() {
    this.apiKey = config.baiduOcrApiKey
    this.secretKey = config.baiduOcrSecretKey
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.secretKey
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken
    }

    const response = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error('Failed to get Baidu OCR access token')
    }

    const data: any = await response.json()
    this.accessToken = data.access_token
    return this.accessToken!
  }

  /**
   * Perform OCR on an image
   */
  async ocr(imageData: string): Promise<OCRResult> {
    if (!this.isConfigured()) {
      throw new Error('Baidu OCR credentials not configured')
    }

    const accessToken = await this.getAccessToken()

    const response = await fetch(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `image=${encodeURIComponent(imageData)}`,
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Baidu OCR API error: ${error}`)
    }

    const data: any = await response.json()

    // Parse result
    const items: OCRItem[] = (data.words_result || []).map((item: any) => ({
      text: item.words || '',
      type: 'text',
      confidence: item.probability?.average || 0.95,
      boundingBox: item.location ? [
        item.location.left,
        item.location.top,
        item.location.left + item.location.width,
        item.location.top + item.location.height,
      ] : undefined,
    }))

    const text = items.map(item => item.text).join('\n')

    return {
      text,
      confidence: items.length > 0
        ? items.reduce((sum: number, item: OCRItem) => sum + item.confidence, 0) / items.length
        : 0,
      items,
    }
  }
}

/**
 * Unified OCR Service
 */
export class OCRService {
  private zhipu: ZhipuOCRService
  private baidu: BaiduOCRService
  private preferredProvider: 'zhipu' | 'baidu'

  constructor(preferredProvider: 'zhipu' | 'baidu' = 'zhipu') {
    this.zhipu = new ZhipuOCRService()
    this.baidu = new BaiduOCRService()
    this.preferredProvider = preferredProvider
  }

  isConfigured(provider?: 'zhipu' | 'baidu'): boolean {
    if (provider === 'zhipu') return this.zhipu.isConfigured()
    if (provider === 'baidu') return this.baidu.isConfigured()
    return this.zhipu.isConfigured() || this.baidu.isConfigured()
  }

  getProviders(): { zhipu: boolean; baidu: boolean } {
    return {
      zhipu: this.zhipu.isConfigured(),
      baidu: this.baidu.isConfigured(),
    }
  }

  /**
   * Perform OCR using the preferred provider, fallback to alternative
   */
  async ocr(imageData: string, provider?: 'zhipu' | 'baidu'): Promise<OCRResult> {
    const targetProvider = provider || this.preferredProvider

    // Try primary provider first
    if (targetProvider === 'zhipu' && this.zhipu.isConfigured()) {
      try {
        return await this.zhipu.ocr(imageData)
      }
      catch (error) {
        console.warn('Zhipu OCR failed, trying Baidu:', error)
      }
    }

    if (targetProvider === 'baidu' && this.baidu.isConfigured()) {
      try {
        return await this.baidu.ocr(imageData)
      }
      catch (error) {
        console.warn('Baidu OCR failed, trying Zhipu:', error)
      }
    }

    // Fallback to alternative provider
    if (targetProvider === 'zhipu' && this.baidu.isConfigured()) {
      return await this.baidu.ocr(imageData)
    }

    if (targetProvider === 'baidu' && this.zhipu.isConfigured()) {
      return await this.zhipu.ocr(imageData)
    }

    throw new Error('No OCR provider configured. Please set ZHIPU_API_KEY or BAIDU_OCR credentials.')
  }
}

// Singleton instance
let ocrServiceInstance: OCRService | null = null

export function getOCRService(provider?: 'zhipu' | 'baidu'): OCRService {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OCRService(provider)
  }
  return ocrServiceInstance
}

export function resetOCRService(): void {
  ocrServiceInstance = null
}
