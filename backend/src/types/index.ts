/**
 * NutriMind Type Definitions
 */

// ==================== User Types ====================

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  bmi: number;
  bmr: number;
  activityLevel: ActivityLevel;
  healthConditions: HealthCondition[];
  allergies: string[];
  dietaryPreferences: DietaryPreference[];
  tastePreferences: TastePreference;
  budget?: BudgetRange;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type HealthCondition =
  | 'diabetes'
  | 'hypertension'
  | 'hyperlipidemia'
  | 'fatty_liver'
  | 'gout'
  | 'obesity'
  | 'underweight'
  | 'anemia'
  | 'osteoporosis'
  | 'renal_disease'
  | 'celiac'
  | 'lactose_intolerant'
  | 'none'
  | 'digestive_health'
  | 'weight_loss'
  | 'pregnancy'
  | 'gastritis'
  | 'all';

export type DietaryPreference =
  | 'none'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'low_carb'
  | 'low_fat'
  | 'high_protein'
  | 'halal'
  | 'kosher';

export type TastePreference = 'balanced' | 'sweet' | 'savory' | 'spicy' | 'light' | 'rich';

export type BudgetRange = 'budget' | 'moderate' | 'premium';

// ==================== Nutrition Types ====================

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
  cholesterol: number;
  vitamins: {
    vitaminA: number;
    vitaminC: number;
    vitaminD: number;
    vitaminE: number;
    vitaminK: number;
    vitaminB12: number;
    folate: number;
  };
  minerals: {
    calcium: number;
    iron: number;
    magnesium: number;
    potassium: number;
    zinc: number;
  };
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
  cholesterol: number;
  vitamins: {
    vitaminA: number;
    vitaminC: number;
    vitaminD: number;
    vitaminE: number;
    vitaminK: number;
    vitaminB12: number;
    folate: number;
  };
  minerals: {
    calcium: number;
    iron: number;
    magnesium: number;
    potassium: number;
    zinc: number;
  };
}

// ==================== Food & Recipe Types ====================

export interface Food {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  nutrition: NutritionInfo;
  unit: string;
  servingSize: number;
  caloriesPer100g: number;
  isAllergen: boolean;
  allergenType?: string[];
  tags: string[];
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  nutrition: NutritionInfo;
  tags: string[];
  taste: TastePreference;
  suitableFor: HealthCondition[];
  contraindications: HealthCondition[];
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  source: string;
  createdAt?: Date;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface CookingStep {
  step: number;
  description: string;
  image?: string;
  tip?: string;
}

// ==================== Menu Types ====================

export interface MenuPlan {
  id: string;
  userId: string;
  type: MenuPlanType;
  startDate: Date;
  endDate: Date;
  days: DailyMenu[];
  totalNutrition: NutritionInfo;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt?: Date;
}

export type MenuPlanType = 'daily' | 'weekly' | 'monthly';

export interface DailyMenu {
  date: Date;
  meals: Meal[];
  totalNutrition: NutritionInfo;
  targets: NutritionTargets;
  score: number;
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  recipes: Recipe[];
  nutrition: NutritionInfo;
  notes?: string;
  tips?: string[];
}

// ==================== Agent Types ====================

export interface AgentState {
  userProfile: UserProfile | null;
  healthData: HealthData | null;
  dietaryNeeds: DietaryNeed[];
  recommendations: Recommendation[];
  nutritionReport: string | null;
  conversationHistory: Message[];
  currentTask: string | null;
  error: string | null;
}

export interface HealthData {
  weight: number[];
  bloodPressure?: { systolic: number; diastolic: number }[];
  bloodSugar?: number[];
  sleep?: number[];
  activity?: number[];
  symptoms: string[];
  lastCheckup: Date;
}

export interface DietaryNeed {
  id: string;
  type: 'restriction' | 'requirement' | 'preference' | 'goal';
  category: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  condition?: HealthCondition;
}

export interface Recommendation {
  id: string;
  type: 'food' | 'recipe' | 'meal' | 'tip' | 'warning';
  title: string;
  description: string;
  reasoning: string;
  evidence: string[];
  nutrition?: NutritionInfo;
  tags: string[];
  score: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ==================== Institution Types ====================

export interface Institution {
  id: string;
  type: InstitutionType;
  name: string;
  address: string;
  contact: string;
  settings: InstitutionSettings;
  menuPlans: MenuPlan[];
  nutritionReports: NutritionReport[];
  createdAt?: Date;
}

export type InstitutionType = 'school' | 'hospital' | 'enterprise' | 'nursing_home';

export interface InstitutionSettings {
  targetAgeGroup?: { min: number; max: number };
  budgetPerMeal?: number;
  nutritionStandards: NutritionTargets;
  allergensToExclude: string[];
  dietaryOptions: string[];
  mealCountPerDay: number;
  reportFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface NutritionReport {
  id: string;
  institutionId: string;
  type: 'daily' | 'weekly' | 'monthly';
  date: Date;
  data: ReportData;
  compliance: ComplianceStatus[];
  recommendations: string[];
  generatedAt: Date;
}

export interface ReportData {
  averageNutrition: NutritionInfo;
  mealParticipation: number;
  foodWaste: number;
  costPerMeal: number;
  allergenIncidents: number;
}

export interface ComplianceStatus {
  metric: string;
  target: number;
  actual: number;
  status: 'compliant' | 'warning' | 'violation';
}

// ==================== Chat Types ====================

export interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  context: AgentState;
  createdAt: Date;
  lastMessageAt: Date;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: Partial<AgentState>;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  suggestions?: string[];
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'show_menu' | 'show_recipe' | 'show_report' | 'analyze_image';
  label: string;
  payload: Record<string, unknown>;
}

// ==================== RAG Types ====================

export interface KnowledgeBaseConfig {
  recipes: string;
  nutrition: string;
  clinical: string;
  tcm: string;
}

export interface RAGQuery {
  query: string;
  context?: AgentState;
  filters?: Record<string, unknown>;
  topK?: number;
}

export interface RAGResult {
  content: string;
  source: string;
  relevanceScore: number;
  metadata: Record<string, unknown>;
}
