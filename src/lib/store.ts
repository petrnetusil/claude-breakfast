import { useSyncExternalStore } from 'react';
import { DEFAULT_HOUSEHOLD } from './link';
import type { AppState, Household, Meal, WeekPlan } from './types';

/*
 * The only state kept on the device: the current week (recipe ids, portions, ticks),
 * the household's portion defaults and favourite recipe ids. No Rohlík data is stored.
 * v2: the week now comes from Claude via a link; v1 held built-in recipes.
 */
const KEY = 'jidelnicek-v2';

const DEFAULT_STATE: AppState = { household: DEFAULT_HOUSEHOLD, week: null, favorites: [] };

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<AppState>) };
  } catch {
    // Private mode or broken JSON: start clean.
  }
  return DEFAULT_STATE;
}

let state: AppState = load();
const listeners = new Set<() => void>();

export const getState = () => state;

function update(fn: (s: AppState) => AppState): void {
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked; the app keeps working for this session.
  }
  listeners.forEach((l) => l());
}

export function useStore(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getState,
  );
}

const MAX = 12;
const clamp = (n: number) => Math.max(1, Math.min(MAX, n));

function editWeek(fn: (w: WeekPlan) => WeekPlan): void {
  update((s) => (s.week ? { ...s, week: fn(s.week) } : s));
}

function editMeal(dayIdx: number, mealIdx: number, fn: (m: Meal) => Meal): void {
  editWeek((w) => ({
    ...w,
    days: w.days.map((d, i) => (i !== dayIdx ? d : { ...d, meals: d.meals.map((m, j) => (j !== mealIdx ? m : fn(m))) })),
  }));
}

const chosen = { leftover: false, off: false };

export const actions = {
  /** A week from Claude replaces the current one. */
  importWeek(week: WeekPlan, household: Household): void {
    update((s) => ({ ...s, household, week }));
  },
  clearWeek(): void {
    update((s) => ({ ...s, week: null }));
  },
  toggleDay(dayIdx: number): void {
    editWeek((w) => ({ ...w, days: w.days.map((d, i) => (i === dayIdx ? { ...d, off: !d.off } : d)) }));
  },
  setMealOff(dayIdx: number, mealIdx: number, off: boolean): void {
    editMeal(dayIdx, mealIdx, (m) => ({ ...m, off }));
  },
  setServings(dayIdx: number, mealIdx: number, servings: number): void {
    editMeal(dayIdx, mealIdx, (m) => ({ ...m, servings: clamp(servings) }));
  },
  setRecipe(dayIdx: number, mealIdx: number, recipeId: number): void {
    editMeal(dayIdx, mealIdx, (m) => ({ ...m, ...chosen, recipeId, text: null }));
  },
  setText(dayIdx: number, mealIdx: number, text: string): void {
    editMeal(dayIdx, mealIdx, (m) => ({ ...m, ...chosen, recipeId: null, text }));
  },
  setLeftover(dayIdx: number, mealIdx: number): void {
    editMeal(dayIdx, mealIdx, (m) => ({ ...m, ...chosen, recipeId: null, text: null, leftover: true }));
  },
  toggleFavorite(recipeId: number): void {
    update((s) => ({
      ...s,
      favorites: s.favorites.includes(recipeId) ? s.favorites.filter((id) => id !== recipeId) : [...s.favorites, recipeId],
    }));
  },
  approve(): void {
    editWeek((w) => ({ ...w, status: 'approved' }));
  },
  reopen(): void {
    editWeek((w) => ({ ...w, status: 'draft' }));
  },
  tick(key: string, value: boolean): void {
    editWeek((w) => ({ ...w, shop: { ...w.shop, [key]: value } }));
  },
};

export const MAX_SERVINGS = MAX;
