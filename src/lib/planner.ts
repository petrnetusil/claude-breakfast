import { RECIPES, getRecipe } from '../data/recipes';
import { addDays } from './dates';
import { quickLimit, TAG_LABEL, WEEKDAY_SLOTS, WEEKEND_SLOTS } from './slots';
import type { AppState, Day, Household, Meal, Recipe, Slot, Tag, WeekPlan } from './types';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const isWeekend = (dayIdx: number) => dayIdx >= 5;

/** The recipe a meal stands for. A leftover lunch resolves to the previous day's dinner. */
export function resolveMeal(week: WeekPlan, dayIdx: number, meal: Meal): Recipe | undefined {
  if (!meal.leftover) return getRecipe(meal.recipeId);
  const prev = week.days[dayIdx - 1];
  if (!prev || prev.off) return undefined;
  const dinner = prev.meals.find((m) => m.slot === 've');
  if (!dinner || dinner.off) return undefined;
  return getRecipe(dinner.recipeId);
}

/** Meals that are actually cooked: day on, meal on, recipe known. */
export function activeMeals(week: WeekPlan): { dayIdx: number; meal: Meal; recipe: Recipe }[] {
  const out: { dayIdx: number; meal: Meal; recipe: Recipe }[] = [];
  week.days.forEach((day, dayIdx) => {
    if (day.off) return;
    for (const meal of day.meals) {
      if (meal.off) continue;
      const recipe = resolveMeal(week, dayIdx, meal);
      if (recipe) out.push({ dayIdx, meal, recipe });
    }
  });
  return out;
}

const isMain = (dayIdx: number, slot: Slot) => slot === 've' || (slot === 'ob' && isWeekend(dayIdx));

export interface Prefs {
  favorites: number[];
  cooked: AppState['cooked'];
}

const TAG_CAP: Partial<Record<Tag, number>> = { kure: 3, hovezi: 2, ryba: 2, veprove: 1, bezmasa: 4 };

function pickBest<T>(pool: T[], score: (x: T) => number): T | undefined {
  let best: T | undefined;
  let bestScore = -Infinity;
  for (const x of pool) {
    const s = score(x);
    if (s > bestScore) {
      best = x;
      bestScore = s;
    }
  }
  return best;
}

/** Builds a balanced draft week starting on `monday`. Deterministic for a given seed. */
export function generateWeek(monday: string, household: Household, seed: number, prefs: Prefs): WeekPlan {
  const rng = mulberry32(seed);
  const fav = new Set(prefs.favorites);
  const used = new Set<number>();
  const recent = (r: Recipe) => {
    const c = prefs.cooked[r.id];
    return c ? addDays(c.last, 14) >= monday : false;
  };
  const base = (r: Recipe) => (fav.has(r.id) ? 1.5 : 0) - (recent(r) ? 3 : 0) + rng();

  const take = (pool: Recipe[], score: (r: Recipe) => number = base): Recipe | undefined => {
    const free = pool.filter((r) => !used.has(r.id));
    const r = pickBest(free.length ? free : pool, score);
    if (r) used.add(r.id);
    return r;
  };
  const takeN = (pool: Recipe[], n: number): Recipe[] => {
    const out: Recipe[] = [];
    for (let i = 0; i < n; i++) {
      const r = take(pool);
      if (r) out.push(r);
    }
    return out;
  };

  const bySlot = (slot: Slot) => RECIPES.filter((r) => r.slots.includes(slot));

  // Breakfast and snack: a small rotation on weekdays, something slower at the weekend.
  const quickBreakfasts = bySlot('sn').filter((r) => r.slots[0] === 'sn' && r.time <= 20);
  const rotB = takeN(quickBreakfasts, 3);
  const weekendB = takeN(bySlot('sn').filter((r) => r.time > 20 || !quickBreakfasts.includes(r)), 2);
  const rotS = takeN(bySlot('sv').filter((r) => r.slots[0] === 'sv'), 3);
  const workLunches = takeN(bySlot('ob').filter((r) => !r.slots.includes('ve')), 2);
  const soups = bySlot('po');
  const desserts = takeN(bySlot('de').filter((r) => r.slots[0] === 'de'), 2);

  // Mains, chosen in eating order so neighbours differ and the week stays balanced.
  const mains = bySlot('ve');
  const tagCount: Partial<Record<Tag, number>> = {};
  let prevTag: Tag = '';
  let prevDinnerTag: Tag = '';
  let mainIdx = 0;
  const takeMain = (maxTime: number, preferLong: boolean, dinner: boolean): Recipe | undefined => {
    const r = take(
      mains.filter((m) => m.time <= maxTime),
      (m) => {
        const n = tagCount[m.tag] ?? 0;
        let s = base(m) - n * 2;
        if (m.tag === prevTag) s -= 6;
        if (dinner && m.tag === prevDinnerTag) s -= 12;
        if (n >= (TAG_CAP[m.tag] ?? 9)) s -= 10;
        if (mainIdx >= 2 && m.tag === 'ryba' && !tagCount.ryba) s += 4;
        if (mainIdx >= 2 && m.tag === 'bezmasa' && (tagCount.bezmasa ?? 0) < 2) s += 3;
        if (preferLong && m.time > 60) s += 3;
        return s;
      },
    );
    if (r) {
      tagCount[r.tag] = (tagCount[r.tag] ?? 0) + 1;
      prevTag = r.tag;
      if (dinner) prevDinnerTag = r.tag;
      mainIdx++;
    }
    return r;
  };

  const meal = (slot: Slot, recipe: Recipe | undefined, servings: number, leftover = false): Meal => ({
    slot,
    recipeId: leftover ? null : recipe?.id ?? null,
    servings,
    off: false,
    leftover,
  });

  const days: Day[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const meals: Meal[] = [];
    if (!isWeekend(i)) {
      const freshLunch = i === 0 || i === 2;
      for (const slot of WEEKDAY_SLOTS) {
        if (slot === 'sn') meals.push(meal('sn', rotB[i % rotB.length], household.sn));
        if (slot === 'sv') meals.push(meal('sv', rotS[(i + 1) % rotS.length], household.sv));
        if (slot === 'ob') {
          meals.push(freshLunch ? meal('ob', workLunches[i === 0 ? 0 : 1], household.ob) : meal('ob', undefined, household.ob, true));
        }
        if (slot === 've') meals.push(meal('ve', takeMain(60, false, true), household.ve));
      }
    } else {
      const w = i - 5;
      for (const slot of WEEKEND_SLOTS) {
        if (slot === 'sn') meals.push(meal('sn', weekendB[w] ?? rotB[w], household.sn));
        if (slot === 'po') meals.push(meal('po', take(soups, (r) => base(r) + (w === 0 && r.time > 60 ? 2 : 0)), household.ve));
        if (slot === 'ob') meals.push(meal('ob', takeMain(240, true, false), household.ve));
        if (slot === 've') meals.push(meal('ve', takeMain(40, false, true), household.ve));
        if (slot === 'de') meals.push(meal('de', desserts[w], household.ve));
      }
    }
    days.push({ date, off: false, meals });
  }

  return { id: monday, days, status: 'draft', shop: {} };
}

// ───────────── Swapping ─────────────

export type Filter = 'all' | 'fav' | 'quick' | 'bezmasa' | 'ryba';

export interface Suggestion {
  recipe: Recipe;
  reason: string;
}

function weekTagCounts(week: WeekPlan, skip?: { dayIdx: number; slot: Slot }): Partial<Record<Tag, number>> {
  const counts: Partial<Record<Tag, number>> = {};
  for (const { dayIdx, meal, recipe } of activeMeals(week)) {
    if (!isMain(dayIdx, meal.slot) || meal.leftover) continue;
    if (skip && skip.dayIdx === dayIdx && skip.slot === meal.slot) continue;
    if (recipe.tag) counts[recipe.tag] = (counts[recipe.tag] ?? 0) + 1;
  }
  return counts;
}

function neighbourTags(week: WeekPlan, dayIdx: number): Tag[] {
  const tags: Tag[] = [];
  for (const d of [dayIdx - 1, dayIdx + 1]) {
    const day = week.days[d];
    const dinner = day && !day.off ? day.meals.find((m) => m.slot === 've' && !m.off) : undefined;
    const r = dinner ? getRecipe(dinner.recipeId) : undefined;
    if (r?.tag) tags.push(r.tag);
  }
  return tags;
}

/** All recipes that fit the slot and filter, best first. */
export function candidates(week: WeekPlan, dayIdx: number, slot: Slot, filter: Filter, prefs: Prefs): Suggestion[] {
  const fav = new Set(prefs.favorites);
  const current = week.days[dayIdx].meals.find((m) => m.slot === slot);
  const currentId = current && !current.leftover ? current.recipeId : null;
  const inWeek = new Set(activeMeals(week).filter((x) => !x.meal.leftover).map((x) => x.recipe.id));
  const counts = weekTagCounts(week, { dayIdx, slot });
  const near = isMain(dayIdx, slot) ? neighbourTags(week, dayIdx) : [];
  const limit = quickLimit(slot);
  const maxTime = slot === 've' && !isWeekend(dayIdx) ? 60 : Infinity;

  const pool = RECIPES.filter((r) => {
    if (!r.slots.includes(slot) || r.id === currentId || r.time > maxTime) return false;
    if (filter === 'fav') return fav.has(r.id);
    if (filter === 'quick') return r.time <= limit;
    if (filter === 'bezmasa' || filter === 'ryba') return r.tag === filter;
    return true;
  });

  const scored = pool.map((recipe) => {
    let score = 0;
    let reason = 'Tento týden ještě nebylo';
    const cooked = prefs.cooked[recipe.id];
    if (recipe.time <= limit) {
      score += 0.5;
      reason = `Hotovo za ${recipe.time} minut`;
    }
    if (recipe.tag && isMain(dayIdx, slot) && !counts[recipe.tag]) {
      score += 2;
      reason = `${TAG_LABEL[recipe.tag]} tento týden ještě není`;
    }
    if (near.includes(recipe.tag)) score -= 2;
    if (cooked) reason = `Vařili jste ${cooked.count}×`;
    if (fav.has(recipe.id)) {
      score += 1.5;
      reason = 'V oblíbených';
    }
    if (inWeek.has(recipe.id)) {
      score -= 4;
      reason = 'Tento týden už je v plánu';
    }
    // Stable tie-break so the order does not jump between renders.
    score += ((recipe.id * 2654435761) >>> 0) / 4294967296 / 10;
    return { recipe, reason, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map(({ recipe, reason }) => ({ recipe, reason }));
}

/** Three suggestions; `round` pages through the candidates and wraps around. */
export function suggest(all: Suggestion[], round: number): Suggestion[] {
  if (all.length <= 3) return all;
  const start = (round * 3) % all.length;
  return [0, 1, 2].map((i) => all[(start + i) % all.length]);
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Free-text search over every recipe: title first, then ingredients. Slot matches come first. */
export function searchRecipes(query: string, slot: Slot): Recipe[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const hits: { recipe: Recipe; rank: number }[] = [];
  for (const recipe of RECIPES) {
    const inTitle = normalize(recipe.title).includes(q);
    const inIngredients = recipe.ingredients.some((i) => normalize(i.name).includes(q));
    if (!inTitle && !inIngredients) continue;
    hits.push({ recipe, rank: (inTitle ? 0 : 2) + (recipe.slots.includes(slot) ? 0 : 1) });
  }
  hits.sort((a, b) => a.rank - b.rank || a.recipe.title.localeCompare(b.recipe.title, 'cs'));
  return hits.map((h) => h.recipe);
}

// ───────────── Week statistics ─────────────

export interface WeekStats {
  tags: { tag: Tag; label: string; count: number }[];
  avgWeekdayDinner: number | null;
  lunchLeftover: number;
  lunchFresh: number;
  meals: number;
}

export function weekStats(week: WeekPlan): WeekStats {
  const counts = weekTagCounts(week);
  const order: Tag[] = ['kure', 'ryba', 'hovezi', 'veprove', 'bezmasa'];
  const tags = order.filter((t) => counts[t]).map((tag) => ({ tag, label: TAG_LABEL[tag], count: counts[tag] ?? 0 }));
  const active = activeMeals(week);
  const dinners = active.filter((x) => x.meal.slot === 've' && !isWeekend(x.dayIdx));
  const lunches = active.filter((x) => x.meal.slot === 'ob' && !isWeekend(x.dayIdx));
  return {
    tags,
    avgWeekdayDinner: dinners.length ? Math.round(dinners.reduce((s, x) => s + x.recipe.time, 0) / dinners.length) : null,
    lunchLeftover: lunches.filter((x) => x.meal.leftover).length,
    lunchFresh: lunches.filter((x) => !x.meal.leftover).length,
    meals: active.length,
  };
}
