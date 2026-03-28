export interface Ingredient {
  name: string;
  amount: string;
  rohlikQuery?: string;
}

export interface Breakfast {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  prepTimeMinutes: number;
  category: 'quick' | 'elaborate';
  tags: string[];
  isHealthy: boolean;
  emoji: string;
  servings: number;
}

export interface DayPlan {
  date: string;
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
  options: Breakfast[];
  selectedId: string | null;
}

export interface WeekPlan {
  weekStartDate: string;
  days: DayPlan[];
  createdAt: string;
}

export interface ShoppingItem extends Ingredient {
  forBreakfast: string;
  checked: boolean;
}
