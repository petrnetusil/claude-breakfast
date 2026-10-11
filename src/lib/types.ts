export type Slot = 'sn' | 'sv' | 'po' | 'ob' | 've' | 'de';
export type Tag = 'kure' | 'ryba' | 'hovezi' | 'veprove' | 'bezmasa' | '';

export interface Ingredient {
  name: string;
  amount: number | null;
  unit: string | null;
}

export interface Recipe {
  id: number;
  /** Path on rohlik.cz/chef/ */
  slug: string;
  title: string;
  /** Which meal slots this recipe is suggested for. */
  slots: Slot[];
  tag: Tag;
  /** Minutes, as listed by Rohlík. */
  time: number;
  /** Portions the ingredient amounts are for. */
  baseServings: number;
  /** false = Rohlík does not state it and the number is our estimate. */
  servingsStated: boolean;
  /** Original photo on Rohlík's CDN. */
  image: string;
  /** Same photo bundled with the app (public/recipes/), see scripts/fetch-images.mjs. */
  imageLocal: string;
  author: string;
  ingredients: Ingredient[];
  steps: string[];
}

export interface Meal {
  slot: Slot;
  recipeId: number | null;
  servings: number;
  /** "Nevaříme" – skipped for this day. */
  off: boolean;
  /** Lunch taken from the previous day's dinner. */
  leftover: boolean;
}

export interface Day {
  /** YYYY-MM-DD */
  date: string;
  off: boolean;
  meals: Meal[];
}

export interface WeekPlan {
  /** Monday, YYYY-MM-DD */
  id: string;
  days: Day[];
  status: 'draft' | 'approved';
  /** Shopping list overrides: item key -> ticked. Missing key = default. */
  shop: Record<string, boolean>;
}

export interface Household {
  sn: number;
  sv: number;
  ob: number;
  ve: number;
}

export interface AppState {
  household: Household;
  week: WeekPlan | null;
  archive: WeekPlan[];
  favorites: number[];
  /** How often and when each recipe was in an approved week. */
  cooked: Record<number, { count: number; last: string }>;
}
