/**
 * Food Recognition - Simplified
 */

export interface FoodRecognitionResult {
  foods: Array<{ name: string; confidence: number }>;
  nutrition: { calories: number; protein: number; carbohydrates: number; fat: number };
  warnings: string[];
}

export class FoodRecognition {
  async recognizeFromUrl(imageUrl: string): Promise<FoodRecognitionResult> {
    return this.getMockResult();
  }

  async recognizeFromBase64(base64Image: string): Promise<FoodRecognitionResult> {
    return this.getMockResult();
  }

  private getMockResult(): FoodRecognitionResult {
    return {
      foods: [
        { name: '米饭', confidence: 0.95 },
        { name: '西兰花炒虾仁', confidence: 0.88 },
      ],
      nutrition: { calories: 580, protein: 35, carbohydrates: 65, fat: 18 },
      warnings: [],
    };
  }
}

export const foodRecognition = new FoodRecognition();
