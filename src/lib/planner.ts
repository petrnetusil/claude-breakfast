import type { Meal, WeekPlan } from './types';

export const isWeekend = (dayIdx: number) => dayIdx >= 5;

/** What a meal stands for: a Rohlík recipe or a simple meal. A leftover lunch resolves to the previous day's dinner. */
export type MealRef = { kind: 'recipe'; id: number } | { kind: 'text'; text: string };

function ref(meal: Meal): MealRef | undefined {
  if (meal.recipeId != null) return { kind: 'recipe', id: meal.recipeId };
  if (meal.text) return { kind: 'text', text: meal.text };
  return undefined;
}

export function resolveMeal(week: WeekPlan, dayIdx: number, meal: Meal): MealRef | undefined {
  if (!meal.leftover) return ref(meal);
  const prev = week.days[dayIdx - 1];
  if (!prev || prev.off) return undefined;
  const dinner = prev.meals.find((m) => m.slot === 've');
  if (!dinner || dinner.off || dinner.leftover) return undefined;
  return ref(dinner);
}

/** Meals that are actually eaten: day on, meal on, something chosen. */
export function activeMeals(week: WeekPlan): { dayIdx: number; meal: Meal; ref: MealRef }[] {
  const out: { dayIdx: number; meal: Meal; ref: MealRef }[] = [];
  week.days.forEach((day, dayIdx) => {
    if (day.off) return;
    for (const meal of day.meals) {
      if (meal.off) continue;
      const r = resolveMeal(week, dayIdx, meal);
      if (r) out.push({ dayIdx, meal, ref: r });
    }
  });
  return out;
}

/** Every Rohlík recipe id in the week, each once. */
export function weekRecipeIds(week: WeekPlan): number[] {
  const ids = new Set<number>();
  for (const day of week.days) for (const m of day.meals) if (m.recipeId != null) ids.add(m.recipeId);
  return [...ids];
}

/** Ideas shown after `round` taps on "Další tři nápady": three more each time, never a repeat. */
export function suggest<T>(all: T[], round: number): T[] {
  return all.slice(0, (round + 1) * 3);
}
