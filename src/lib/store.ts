import { useSyncExternalStore } from 'react';
import { nextMonday } from './dates';
import { activeMeals, generateWeek } from './planner';
import type { AppState, Household, Meal, WeekPlan } from './types';

const KEY = 'jidelnicek-v1';

const DEFAULT_STATE: AppState = {
  household: { sn: 4, sv: 2, ob: 1, ve: 4 },
  week: null,
  archive: [],
  favorites: [],
  cooked: {},
};

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

export const actions = {
  /** Generates a new draft for next week. An approved week moves to the archive. */
  startWeek(household: Household, seed: number = Date.now()): void {
    update((s) => {
      const archive = s.week && s.week.status === 'approved' ? [s.week, ...s.archive].slice(0, 12) : s.archive;
      const week = generateWeek(nextMonday(), household, seed, { favorites: s.favorites, cooked: s.cooked });
      return { ...s, household, archive, week };
    });
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
    editMeal(dayIdx, mealIdx, (m) => ({ ...m, recipeId, leftover: false, off: false }));
  },
  setLeftover(dayIdx: number, mealIdx: number): void {
    editMeal(dayIdx, mealIdx, (m) => ({ ...m, recipeId: null, leftover: true, off: false }));
  },
  toggleFavorite(recipeId: number): void {
    update((s) => ({
      ...s,
      favorites: s.favorites.includes(recipeId) ? s.favorites.filter((id) => id !== recipeId) : [...s.favorites, recipeId],
    }));
  },
  /** Locks the menu and remembers what was chosen, so later suggestions can learn from it. */
  approve(): void {
    update((s) => {
      if (!s.week) return s;
      const cooked = { ...s.cooked };
      const ids = new Set(activeMeals(s.week).map((x) => x.recipe.id));
      for (const id of ids) {
        const prev = cooked[id];
        // Re-approving the same week must not count twice.
        if (prev?.last === s.week.id) continue;
        cooked[id] = { count: (prev?.count ?? 0) + 1, last: s.week.id };
      }
      return { ...s, cooked, week: { ...s.week, status: 'approved' } };
    });
  },
  reopen(): void {
    editWeek((w) => ({ ...w, status: 'draft' }));
  },
  tick(key: string, value: boolean): void {
    editWeek((w) => ({ ...w, shop: { ...w.shop, [key]: value } }));
  },
  /** For tests and "start over". */
  reset(): void {
    update(() => DEFAULT_STATE);
  },
};

export const MAX_SERVINGS = MAX;
