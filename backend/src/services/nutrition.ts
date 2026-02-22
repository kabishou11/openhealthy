// Nutrition Service - 营养计算和餐单生成
import { db, initializeDatabase } from '../models/db.js';
import { generateId } from '../auth/jwt.js';

let initialized = false;
const ensureDb = () => {
  if (!initialized) {
    initializeDatabase();
    initialized = true;
  }
};

// BMI categories
export const BMI_CATEGORIES = {
  underweight: { max: 18.5, label: '偏瘦', color: 'blue' },
  normal: { max: 24, label: '正常', color: 'green' },
  overweight: { max: 28, label: '偏胖', color: 'amber' },
  obese: { max: Infinity, label: '肥胖', color: 'red' },
};

// Get BMI status
export function getBMIStatus(bmi: number): { category: string; label: string; color: string } {
  for (const [key, value] of Object.entries(BMI_CATEGORIES)) {
    if (bmi < value.max) {
      return { category: key, label: value.label, color: value.color };
    }
  }
  return { category: 'obese', label: '肥胖', color: 'red' };
}

// Calculate daily calorie needs
export function calculateCalorieNeeds(
  weight: number,
  height: number,
  age: number,
  gender: 'MALE' | 'FEMALE',
  activityLevel: string = 'moderate'
): number {
  // BMR calculation (Mifflin-St Jeor)
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr += gender === 'MALE' ? 5 : -161;

  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

// Get calorie adjustment based on BMI
export function getCalorieAdjustment(bmi: number): number {
  if (bmi < 18.5) {
    return 1.15; // Increase for underweight
  } else if (bmi >= 28) {
    return 0.85; // Decrease for obese
  } else if (bmi >= 24) {
    return 0.95; // Slight decrease for overweight
  }
  return 1.0; // Normal range
}

// Calculate daily nutrition targets
export function calculateNutritionTargets(
  calories: number,
  bmi?: number
): { protein: number; carbs: number; fat: number; fiber: number } {
  // Protein: 15-20% of calories
  const protein = Math.round((calories * 0.18) / 4);

  // Carbs: 50-60% of calories
  const carbs = Math.round((calories * 0.55) / 4);

  // Fat: 25-35% of calories
  const fat = Math.round((calories * 0.30) / 9);

  // Fiber: 25-30g per day
  const fiber = 25;

  return { protein, carbs, fat, fiber };
}

// Generate meal plan based on student profile
export async function generateMealPlan(
  studentId: string,
  days: number = 7
): Promise<any> {
  ensureDb();

  const student = db.prepare(`
    SELECT s.*, sd.type as special_type, sd.detail as special_detail, sd.severity
    FROM students s
    LEFT JOIN special_diets sd ON s.id = sd.student_id AND sd.status = 'ACTIVE'
    WHERE s.id = ?
  `).get(studentId);

  if (!student) {
    throw new Error('Student not found');
  }

  // Calculate nutrition targets
  const weight = student.weight || 50;
  const height = student.height || 160;
  const age = student.birth_date
    ? new Date().getFullYear() - new Date(student.birth_date).getFullYear()
    : 15;
  const gender = student.gender as 'MALE' | 'FEMALE';

  let calories = calculateCalorieNeeds(weight, height, age, gender);
  if (student.bmi && student.bmi >= 24) {
    calories = Math.round(calories * getCalorieAdjustment(student.bmi));
  }

  const nutritionTargets = calculateNutritionTargets(calories, student.bmi);

  // Get available dishes
  const dishes = db.prepare(`
    SELECT * FROM dishes WHERE is_available = 1 ORDER BY category, name
  `).all();

  // Parse dish nutrition
  const parsedDishes = dishes.map((d: any) => ({
    ...d,
    nutrition: JSON.parse(d.nutrition || '{}'),
    allergens: d.allergens ? JSON.parse(d.allergens) : [],
    contraindications: d.contraindications ? JSON.parse(d.contraindications) : [],
  }));

  // Filter dishes based on special diet
  let filteredDishes = parsedDishes;
  if (student.special_type === 'ALLERGY' && student.special_detail) {
    const allergens = student.special_detail.split(',').map((s: string) => s.trim());
    filteredDishes = parsedDishes.filter((d: any) =>
      !d.allergens.some((a: string) => allergens.includes(a))
    );
  }

  // Categorize dishes
  const categoryDishes: Record<string, any[]> = {
    BREAKFAST: [],
    STAPLE: [],
    MEAT: [],
    VEGETABLE: [],
    SOUP: [],
    DESSERT: [],
  };

  for (const dish of filteredDishes) {
    if (categoryDishes[dish.category]) {
      categoryDishes[dish.category].push(dish);
    }
  }

  // Generate weekly plan
  const weeklyPlan: any[] = [];
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const meals: any[] = [];

    // Breakfast (20-25% of daily calories)
    const breakfastCalories = Math.round(calories * 0.22);
    const breakfast = selectDish(categoryDishes.BREAKFAST, breakfastCalories, ['STAPLE']);
    meals.push(createMeal('早餐', breakfast, categoryDishes.STAPLE, breakfastCalories));

    // Lunch (35-40% of daily calories)
    const lunchCalories = Math.round(calories * 0.38);
    const lunch = createBalancedMeal(
      categoryDishes.MEAT,
      categoryDishes.VEGETABLE,
      categoryDishes.STAPLE,
      lunchCalories
    );
    meals.push(createMeal('午餐', lunch.main, lunchCalories, lunch.sideDishes));

    // Dinner (30-35% of daily calories)
    const dinnerCalories = Math.round(calories * 0.32);
    const dinner = createBalancedMeal(
      categoryDishes.MEAT,
      categoryDishes.VEGETABLE,
      categoryDishes.STAPLE,
      dinnerCalories
    );
    meals.push(createMeal('晚餐', dinner.main, dinnerCalories, dinner.sideDishes));

    // Calculate total nutrition
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;

    weeklyPlan.push({
      day: dayNames[i],
      date: date.toISOString().split('T')[0],
      calories: Math.round(calories),
      nutrition: nutritionTargets,
      meals: meals.map((m: any) => ({
        name: m.type,
        dishes: m.dishes,
        nutrition: m.nutrition,
      })),
    });
  }

  return {
    student_id: studentId,
    nutrition_targets: nutritionTargets,
    weekly_plan: weeklyPlan,
    special_diet: student.special_type ? {
      type: student.special_type,
      detail: student.special_detail,
      severity: student.severity,
    } : null,
  };
}

// Select a dish that matches target calories
function selectDish(dishes: any[], targetCalories: number, additionalCategories?: string[]): any {
  if (dishes.length === 0) {
    return { name: '待定', nutrition: { calories: targetCalories } };
  }

  // Find dish closest to target
  let closest = dishes[0];
  let minDiff = Math.abs(closest.nutrition?.calories - targetCalories);

  for (const dish of dishes) {
    const diff = Math.abs((dish.nutrition?.calories || 0) - targetCalories);
    if (diff < minDiff) {
      minDiff = diff;
      closest = dish;
    }
  }

  return closest;
}

// Create a balanced meal
function createBalancedMeal(
  meatDishes: any[],
  vegDishes: any[],
  stapleDishes: any[],
  targetCalories: number
): { main: any; sideDishes: any[] } {
  // Main protein dish
  const main = meatDishes.length > 0
    ? selectDish(meatDishes, Math.round(targetCalories * 0.4))
    : { name: '主菜', nutrition: { calories: Math.round(targetCalories * 0.4) } };

  // Vegetables
  const vegetables = vegDishes.slice(0, 2);

  // Staple (rice/noodles)
  const staple = stapleDishes.length > 0
    ? selectDish(stapleDishes, Math.round(targetCalories * 0.35))
    : null;

  const sideDishes = [...vegetables];
  if (staple) sideDishes.push(staple);

  return { main, sideDishes };
}

// Create meal structure
function createMeal(
  type: string,
  mainDish: any,
  targetCalories: number,
  sideDishes?: any[]
): any {
  const dishes = [mainDish, ...(sideDishes || [])];

  let calories = 0, protein = 0, carbs = 0, fat = 0;
  for (const dish of dishes) {
    calories += dish.nutrition?.calories || 0;
    protein += dish.nutrition?.protein || 0;
    carbs += dish.nutrition?.carbs || 0;
    fat += dish.nutrition?.fat || 0;
  }

  return {
    type,
    dishes: dishes.map((d: any) => ({
      id: d.id,
      name: d.name,
      portion: d.portion_size || '1份',
    })),
    nutrition: {
      calories,
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
    },
  };
}

// Get nutrition summary for a day
export function getDayNutritionSummary(meals: any[]): any {
  let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0;

  for (const meal of meals) {
    if (meal.nutrition) {
      calories += meal.nutrition.calories || 0;
      protein += meal.nutrition.protein || 0;
      carbs += meal.nutrition.carbs || 0;
      fat += meal.nutrition.fat || 0;
      fiber += meal.nutrition.fiber || 0;
    }
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber: Math.round(fiber),
  };
}
