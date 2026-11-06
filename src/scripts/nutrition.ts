import { defaultDailyGoal } from "./data";

export type MealKind = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export interface MacroValues {
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionValues extends MacroValues {
  calories: number;
}

export interface Meal extends MacroValues {
  id: string;
  type: MealKind;
  description?: string;
  images?: string[];
}

export interface DailySummary {
  eaten: NutritionValues;
  limit: NutritionValues;
  remaining: NutritionValues;
}

export const mealKinds: readonly MealKind[] = ["Breakfast", "Lunch", "Dinner", "Snack"];
export const caloriesPerGram = { protein: 4, carbs: 4, fat: 9 } as const;

const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, useGrouping: false });
const mealsStorageKey = "nutriday-meals";
const dailyGoalStorageKey = "nutriday-daily-goal";
const sampleWeekStorageKey = "nutriday-sample-week-seeded-v3";
type MealsByDay = Record<string, Meal[]>;

const sampleWeek: readonly Omit<Meal, "id">[] = [
  { type: "Breakfast", protein: 120, carbs: 200, fat: 60 },
  { type: "Lunch", protein: 140, carbs: 240, fat: 70 },
  { type: "Dinner", protein: 130, carbs: 220, fat: 65 },
  { type: "Breakfast", protein: 115, carbs: 180, fat: 55 },
  { type: "Lunch", protein: 145, carbs: 250, fat: 75 },
  { type: "Dinner", protein: 125, carbs: 210, fat: 60 },
  { type: "Breakfast", protein: 135, carbs: 230, fat: 68 },
];

export function formatAmount(value: number) {
  return formatter.format(value);
}

export function getCalories(values: MacroValues) {
  return values.protein * caloriesPerGram.protein + values.carbs * caloriesPerGram.carbs + values.fat * caloriesPerGram.fat;
}

export function getDailySummary(meals: readonly Meal[], dailyGoal: MacroValues = defaultDailyGoal): DailySummary {
  const eaten = meals.reduce<NutritionValues>(
    (total, meal) => ({
      calories: total.calories + getCalories(meal),
      protein: total.protein + meal.protein,
      carbs: total.carbs + meal.carbs,
      fat: total.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const limit = { ...dailyGoal, calories: getCalories(dailyGoal) };

  return {
    eaten,
    limit,
    remaining: {
      calories: Math.max(limit.calories - eaten.calories, 0),
      protein: Math.max(limit.protein - eaten.protein, 0),
      carbs: Math.max(limit.carbs - eaten.carbs, 0),
      fat: Math.max(limit.fat - eaten.fat, 0),
    },
  };
}

export function createDailyGoal(input: MacroValues): MacroValues | null {
  return isMacroValues(input) ? { ...input } : null;
}

export function createMeal(input: Omit<Meal, "id" | "type"> & { type: string }): Meal | null {
  const values = [input.protein, input.carbs, input.fat];

  if (!mealKinds.includes(input.type as MealKind) || values.some((value) => !Number.isFinite(value) || value < 0) ||
    (input.description !== undefined && (typeof input.description !== "string" || input.description.length > 500)) ||
    (input.images !== undefined && !isMealImages(input.images))) {
    return null;
  }

  return {
    ...input,
    id: crypto.randomUUID(),
    type: input.type as MealKind,
    description: input.description?.trim() || undefined,
  };
}

export function getDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function shiftDayKey(dayKey: string, amount: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return getDayKey(new Date(year, month - 1, day + amount));
}

export function formatDayLabel(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(year, month - 1, day));
}

export function loadMeals(dayKey = getDayKey()): Meal[] {
  const savedMeals = readSavedMeals();
  return Array.isArray(savedMeals) ? savedMeals : savedMeals[dayKey] ?? [];
}

export function getEarliestLoggedDayKey(todayDayKey = getDayKey()) {
  const savedMeals = readSavedMeals();
  if (Array.isArray(savedMeals)) return todayDayKey;
  return Object.keys(savedMeals)
    .filter((dayKey) => /^\d{4}-\d{2}-\d{2}$/.test(dayKey) && dayKey <= todayDayKey && savedMeals[dayKey].length > 0)
    .sort()[0] ?? todayDayKey;
}

export function saveMeals(meals: readonly Meal[], dayKey = getDayKey()) {
  const savedMeals = readSavedMeals();
  const mealsByDay: MealsByDay = Array.isArray(savedMeals) ? {} : savedMeals;
  mealsByDay[dayKey] = [...meals];
  window.localStorage.setItem(mealsStorageKey, JSON.stringify(mealsByDay));
}

export function seedCurrentWeekMeals(endDayKey = getDayKey()) {
  if (window.localStorage.getItem(sampleWeekStorageKey)) return;

  const savedMeals = readSavedMeals();
  const mealsByDay: MealsByDay = Array.isArray(savedMeals) ? { [endDayKey]: savedMeals } : { ...savedMeals };

  sampleWeek.forEach((meal, index) => {
    const dayKey = shiftDayKey(endDayKey, index - (sampleWeek.length - 1));
    if (mealsByDay[dayKey]?.length) return;
    mealsByDay[dayKey] = [{ ...meal, id: `sample-${dayKey}` }];
  });

  window.localStorage.setItem(mealsStorageKey, JSON.stringify(mealsByDay));
  window.localStorage.setItem(sampleWeekStorageKey, "true");
}

function readSavedMeals(): Meal[] | MealsByDay {
  try {
    const saved = window.localStorage.getItem(mealsStorageKey);
    const meals = saved ? JSON.parse(saved) : null;
    if (Array.isArray(meals) && meals.every(isMeal)) return meals;
    if (isMealsByDay(meals)) return meals;
  } catch {
    // Ignore invalid local data and start the current day empty.
  }
  return {};
}

export function loadDailyGoal(): MacroValues {
  try {
    const saved = window.localStorage.getItem(dailyGoalStorageKey);
    const dailyGoal = saved ? JSON.parse(saved) : null;
    return isMacroValues(dailyGoal) ? dailyGoal : defaultDailyGoal;
  } catch {
    return defaultDailyGoal;
  }
}

export function saveDailyGoal(dailyGoal: MacroValues) {
  window.localStorage.setItem(dailyGoalStorageKey, JSON.stringify(dailyGoal));
}

function isMeal(value: unknown): value is Meal {
  if (!value || typeof value !== "object") return false;

  const meal = value as Meal;
  return (
    typeof meal.id === "string" &&
    mealKinds.includes(meal.type) &&
    (meal.description === undefined || (typeof meal.description === "string" && meal.description.length <= 500)) &&
    (meal.images === undefined || isMealImages(meal.images)) &&
    isMacroValues(meal)
  );
}

function isMealImages(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 3 && value.every(
    (image) => typeof image === "string" && image.length <= 250_000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image),
  );
}

function isMealsByDay(value: unknown): value is MealsByDay {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.values(value).every(
    (meals) => Array.isArray(meals) && meals.every(isMeal),
  );
}

function isMacroValues(value: unknown): value is MacroValues {
  if (!value || typeof value !== "object") return false;

  const macros = value as MacroValues;
  return [macros.protein, macros.carbs, macros.fat].every(
    (amount) => typeof amount === "number" && Number.isFinite(amount) && amount >= 0,
  );
}
