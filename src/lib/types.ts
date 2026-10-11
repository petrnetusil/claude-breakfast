export type Slot = 'sn' | 'sv' | 'po' | 'ob' | 've' | 'de';

/** Recipe summary from Rohlík, enough for a card. Loaded live, never stored. */
export interface RecipeCard {
  id: number;
  title: string;
  /** Path on rohlik.cz/chef/ */
  slug: string;
  image: string;
  /** Minutes, null when Rohlík does not say. */
  time: number | null;
  author: string;
}

export interface Ingredient {
  /** Rohlík's clean ingredient name ("Zakysaná smetana"), used to add up the shopping list. */
  name: string;
  amount: number | null;
  unit: string | null;
  /** As written in the recipe ("4–6 lžic zakysané smetany"). */
  text: string;
}

export interface RecipeDetail extends RecipeCard {
  /**
   * Portions the ingredient amounts are for. null when Rohlík gives the yield in pieces or as a
   * whole ("20 kusů", "1 dort"): such a recipe is made once, whatever the number of eaters.
   */
  servings: number | null;
  /** As written by Rohlík ("4 porce", "12 kusů"). */
  servingsLabel: string;
  ingredients: Ingredient[];
  steps: string[];
}

export interface Meal {
  slot: Slot;
  /** Rohlík recipe. */
  recipeId: number | null;
  /** A simple meal without a recipe ("Křupinky s mlékem"). */
  text: string | null;
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
  /** Rohlík recipe ids. */
  favorites: number[];
}
