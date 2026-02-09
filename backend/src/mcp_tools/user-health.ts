/**
 * User Health MCP Tool
 *
 * Manages user health profiles and health data
 */

import { createLogger } from '../utils/logger.js';
import { UserProfile, HealthData, NutritionTargets } from '../types/index.js';

const logger = createLogger('user-health-mcp');

// In-memory user storage (would be database in production)
const USER_PROFILES: Map<string, UserProfile> = new Map();
const HEALTH_DATA: Map<string, HealthData> = new Map();

// Sample users for testing
initializeSampleData();

function initializeSampleData() {
  const sampleUser: UserProfile = {
    id: 'user-001',
    name: '张三',
    age: 35,
    gender: 'male',
    height: 175,
    weight: 75,
    bmi: 24.5,
    bmr: 1700,
    activityLevel: 'moderate',
    healthConditions: ['fatty_liver', 'obesity'],
    allergies: [],
    dietaryPreferences: ['none'],
    tastePreferences: 'balanced',
    budget: 'moderate',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  USER_PROFILES.set(sampleUser.id, sampleUser);

  const sampleHealthData: HealthData = {
    weight: [76, 75.5, 75, 74.8, 74.5],
    bloodPressure: [
      { systolic: 135, diastolic: 88 },
      { systolic: 132, diastolic: 85 },
      { systolic: 130, diastolic: 84 },
    ],
    bloodSugar: [5.8, 5.6, 5.5],
    symptoms: ['容易疲劳', '食欲较好'],
    lastCheckup: new Date(),
  };

  HEALTH_DATA.set(sampleUser.id, sampleHealthData);

  logger.info('Initialized sample user data');
}

export interface CreateUserProfileParams {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  healthConditions?: string[];
  allergies?: string[];
  dietaryPreferences?: string[];
  tastePreferences?: string;
  budget?: string;
}

export interface UpdateUserProfileParams {
  height?: number;
  weight?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  healthConditions?: string[];
  allergies?: string[];
  dietaryPreferences?: string[];
  tastePreferences?: string;
  budget?: string;
}

export interface HealthMetricsParams {
  weight?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  bloodSugar?: number;
  sleep?: number;
  activity?: number;
  symptoms?: string[];
}

export class UserHealthMCP {
  /**
   * Create a new user profile
   */
  async createProfile(params: CreateUserProfileParams): Promise<UserProfile> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const bmi = this.calculateBMI(params.height, params.weight);
    const bmr = this.calculateBMR(params);

    const profile: UserProfile = {
      id,
      name: params.name,
      age: params.age,
      gender: params.gender,
      height: params.height,
      weight: params.weight,
      bmi,
      bmr,
      activityLevel: params.activityLevel,
      healthConditions: (params.healthConditions || []) as UserProfile['healthConditions'],
      allergies: params.allergies || [],
      dietaryPreferences: (params.dietaryPreferences || ['none']) as UserProfile['dietaryPreferences'],
      tastePreferences: (params.tastePreferences as UserProfile['tastePreferences']) || 'balanced',
      budget: (params.budget as UserProfile['budget']) || 'moderate',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    USER_PROFILES.set(id, profile);
    logger.info(`Created user profile: ${id}`);

    // Initialize empty health data
    HEALTH_DATA.set(id, {
      weight: [params.weight],
      symptoms: [],
      lastCheckup: new Date(),
    });

    return profile;
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    return USER_PROFILES.get(userId) || null;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, params: UpdateUserProfileParams): Promise<UserProfile | null> {
    const profile = USER_PROFILES.get(userId);
    if (!profile) return null;

    // Update fields
    if (params.height !== undefined) profile.height = params.height;
    if (params.weight !== undefined) {
      profile.weight = params.weight;
      // Update BMI
      profile.bmi = this.calculateBMI(profile.height, profile.weight);
    }
    if (params.activityLevel !== undefined) profile.activityLevel = params.activityLevel;
    if (params.healthConditions !== undefined) profile.healthConditions = params.healthConditions as UserProfile['healthConditions'];
    if (params.allergies !== undefined) profile.allergies = params.allergies;
    if (params.dietaryPreferences !== undefined) profile.dietaryPreferences = params.dietaryPreferences as UserProfile['dietaryPreferences'];
    if (params.tastePreferences !== undefined) profile.tastePreferences = params.tastePreferences as UserProfile['tastePreferences'];
    if (params.budget !== undefined) profile.budget = params.budget as UserProfile['budget'];

    // Recalculate BMR
    profile.bmr = this.calculateBMR(profile);

    profile.updatedAt = new Date();
    USER_PROFILES.set(userId, profile);

    return profile;
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<boolean> {
    const deleted = USER_PROFILES.delete(userId);
    if (deleted) {
      HEALTH_DATA.delete(userId);
      logger.info(`Deleted user profile: ${userId}`);
    }
    return deleted;
  }

  /**
   * Get user health data
   */
  async getHealthData(userId: string): Promise<HealthData | null> {
    return HEALTH_DATA.get(userId) || null;
  }

  /**
   * Add health metrics
   */
  async addHealthMetrics(userId: string, metrics: HealthMetricsParams): Promise<HealthData | null> {
    const profile = USER_PROFILES.get(userId);
    if (!profile) return null;

    let data = HEALTH_DATA.get(userId);
    if (!data) {
      data = {
        weight: [profile.weight],
        symptoms: [],
        lastCheckup: new Date(),
      };
    }

    // Add weight
    if (metrics.weight !== undefined) {
      data.weight.push(metrics.weight);
      // Keep only last 30 records
      if (data.weight.length > 30) {
        data.weight = data.weight.slice(-30);
      }
    }

    // Add blood pressure
    if (metrics.bloodPressure !== undefined) {
      if (!data.bloodPressure) data.bloodPressure = [];
      data.bloodPressure.push(metrics.bloodPressure);
      if (data.bloodPressure.length > 30) {
        data.bloodPressure = data.bloodPressure.slice(-30);
      }
    }

    // Add blood sugar
    if (metrics.bloodSugar !== undefined) {
      if (!data.bloodSugar) data.bloodSugar = [];
      data.bloodSugar.push(metrics.bloodSugar);
      if (data.bloodSugar.length > 30) {
        data.bloodSugar = data.bloodSugar.slice(-30);
      }
    }

    // Add sleep
    if (metrics.sleep !== undefined) {
      if (!data.sleep) data.sleep = [];
      data.sleep.push(metrics.sleep);
      if (data.sleep.length > 30) {
        data.sleep = data.sleep.slice(-30);
      }
    }

    // Add activity
    if (metrics.activity !== undefined) {
      if (!data.activity) data.activity = [];
      data.activity.push(metrics.activity);
      if (data.activity.length > 30) {
        data.activity = data.activity.slice(-30);
      }
    }

    // Add symptoms
    if (metrics.symptoms && metrics.symptoms.length > 0) {
      data.symptoms = [...data.symptoms, ...metrics.symptoms];
    }

    data.lastCheckup = new Date();
    HEALTH_DATA.set(userId, data);

    // Update profile weight if provided
    if (metrics.weight !== undefined) {
      profile.weight = metrics.weight;
      profile.bmi = this.calculateBMI(profile.height, metrics.weight);
      USER_PROFILES.set(userId, profile);
    }

    return data;
  }

  /**
   * Calculate BMI
   */
  calculateBMI(height: number, weight: number): number {
    const heightM = height / 100;
    return Math.round((weight / (heightM * heightM)) * 10) / 10;
  }

  /**
   * Calculate BMR using Mifflin-St Jeor
   */
  calculateBMR(profile: {
    weight: number;
    height: number;
    age: number;
    gender: 'male' | 'female' | 'other';
  }): number {
    let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;

    if (profile.gender === 'male') {
      bmr += 5;
    } else if (profile.gender === 'female') {
      bmr -= 161;
    }

    return Math.round(bmr);
  }

  /**
   * Calculate nutrition targets based on profile
   */
  async calculateNutritionTargets(userId: string): Promise<NutritionTargets | null> {
    const profile = USER_PROFILES.get(userId);
    if (!profile) return null;

    const bmr = profile.bmr;
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = Math.round(bmr * (activityMultipliers[profile.activityLevel] || 1.2));

    // Adjust for health conditions
    let targetCalories = tdee;

    if (profile.healthConditions.includes('obesity')) {
      targetCalories = Math.round(tdee * 0.85);
    } else if (profile.healthConditions.includes('underweight')) {
      targetCalories = Math.round(tdee * 1.15);
    } else if (profile.healthConditions.includes('diabetes')) {
      targetCalories = Math.round(tdee * 0.9);
    }

    return {
      calories: targetCalories,
      protein: Math.round(targetCalories * 0.18 / 4),
      carbohydrates: Math.round(targetCalories * 0.50 / 4),
      fat: Math.round(targetCalories * 0.32 / 9),
      fiber: 25,
      sugar: 50,
      sodium: profile.healthConditions.includes('hypertension') ? 1500 : 2000,
      saturatedFat: Math.round(targetCalories * 0.07 / 9),
      cholesterol: 300,
      vitamins: {
        vitaminA: profile.gender === 'male' ? 900 : 700,
        vitaminC: 90,
        vitaminD: 20,
        vitaminE: 15,
        vitaminK: 120,
        vitaminB12: 2.4,
        folate: 400,
      },
      minerals: {
        calcium: 1000,
        iron: profile.gender === 'male' ? 8 : 18,
        magnesium: profile.gender === 'male' ? 420 : 320,
        potassium: 3400,
        zinc: profile.gender === 'male' ? 11 : 8,
      },
    };
  }

  /**
   * Get health trend analysis
   */
  async getHealthTrends(userId: string): Promise<{
    weight: { current: number; change: number; trend: string };
    bloodPressure: { current: { systolic: number; diastolic: number } | null; trend: string };
    bmi: { current: number; category: string };
    recommendations: string[];
  } | null> {
    const profile = USER_PROFILES.get(userId);
    const data = HEALTH_DATA.get(userId);
    if (!profile) return null;

    const result: {
      weight: { current: number; change: number; trend: string };
      bloodPressure: { current: { systolic: number; diastolic: number } | null; trend: string };
      bmi: { current: number; category: string };
      recommendations: string[];
    } = {
      weight: {
        current: profile.weight,
        change: 0,
        trend: 'stable',
      },
      bloodPressure: {
        current: data?.bloodPressure?.[data.bloodPressure.length - 1] || null,
        trend: 'stable',
      },
      bmi: {
        current: profile.bmi,
        category: this.getBMICategory(profile.bmi),
      },
      recommendations: [],
    };

    // Calculate weight trend
    if (data?.weight && data.weight.length >= 2) {
      const firstWeight = data.weight[0];
      const change = Math.round((profile.weight - firstWeight) * 10) / 10;
      result.weight.change = change;
      result.weight.trend = change < -0.5 ? 'decreasing' : change > 0.5 ? 'increasing' : 'stable';
    }

    // Calculate blood pressure trend
    if (data?.bloodPressure && data.bloodPressure.length >= 2) {
      const first = data.bloodPressure[0];
      const current = data.bloodPressure[data.bloodPressure.length - 1];
      const systolicChange = current.systolic - first.systolic;
      if (systolicChange < -5) {
        result.bloodPressure.trend = 'improving';
      } else if (systolicChange > 5) {
        result.bloodPressure.trend = 'worsening';
      }
    }

    // Generate recommendations based on trends
    if (result.weight.trend === 'increasing' && profile.bmi >= 25) {
      result.recommendations.push('建议控制饮食热量，增加运动量以促进体重下降');
    }

    if (result.bmi.category === 'obese' || result.bmi.category === 'overweight') {
      result.recommendations.push('建议制定减重目标，每周减重0.5-1kg为宜');
    }

    if (result.bloodPressure.current?.systolic && result.bloodPressure.current.systolic > 140) {
      result.recommendations.push('血压偏高，建议减少钠盐摄入，增加富含钾的食物');
    }

    return result;
  }

  /**
   * Get BMI category
   */
  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 24) return 'normal';
    if (bmi < 28) return 'overweight';
    return 'obese';
  }

  /**
   * Get all users (for admin)
   */
  async getAllUsers(): Promise<UserProfile[]> {
    return Array.from(USER_PROFILES.values());
  }
}

export const userHealthMCP = new UserHealthMCP();
