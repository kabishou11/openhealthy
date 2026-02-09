/**
 * Voice AI - Simplified
 * Note: This is a stub implementation for Node.js backend.
 * The actual voice synthesis would be handled by the frontend.
 */

export interface VoiceConfig {
  language?: string;
  rate?: number;
}

export class VoiceAI {
  isSupported(): boolean {
    return false;
  }

  async speak(_text: string, _config?: VoiceConfig): Promise<void> {
    // Voice synthesis is only available in browser environments
    console.warn('Voice AI is not available in Node.js environment');
    return Promise.resolve();
  }
}

export const voiceAI = new VoiceAI();
