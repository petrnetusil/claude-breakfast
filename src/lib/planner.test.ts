import { describe, expect, it } from 'vitest';
import { RECIPES } from '../data/recipes';
import { activeMeals, candidates, generateWeek, resolveMeal, searchRecipes, suggest, weekStats } from './planner';
import { buildShopping, classify, formatAmount, roundAmount } from './shopping';
import type { Household } from './types';

const household: Household = { sn: 4, sv: 2, ob: 1, ve: 4 };
const prefs = { favorites: [], cooked: {} };
const seeds = Array.from({ length: 40 }, (_, i) => i * 7919 + 13);

describe('seed recipes', () => {
  it('have unique ids and the fields the app relies on', () => {
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
    for (const r of RECIPES) {
      expect(r.slots.length, r.title).toBeGreaterThan(0);
      expect(r.baseServings, r.title).toBeGreaterThan(0);
      expect(r.ingredients.length, r.title).toBeGreaterThan(0);
      expect(r.steps.length, r.title).toBeGreaterThan(0);
      expect(r.image.startsWith('https://cdn.rohlik.cz/'), r.title).toBe(true);
    }
  });
});

describe('generateWeek', () => {
  it('fills every slot of all seven days', () => {
    for (const seed of seeds) {
      const week = generateWeek('2026-10-12', household, seed, prefs);
      expect(week.days).toHaveLength(7);
      week.days.forEach((day, i) => {
        expect(day.meals.map((m) => m.slot)).toEqual(i < 5 ? ['sn', 'sv', 'ob', 've'] : ['sn', 'po', 'ob', 've', 'de']);
        for (const meal of day.meals) expect(resolveMeal(week, i, meal), `seed ${seed} day ${i} ${meal.slot}`).toBeDefined();
      });
    }
  });

  it('keeps the week balanced', () => {
    for (const seed of seeds) {
      const week = generateWeek('2026-10-12', household, seed, prefs);
      const stats = weekStats(week);
      const count = (tag: string) => stats.tags.find((t) => t.tag === tag)?.count ?? 0;
      expect(count('ryba'), `fish, seed ${seed}`).toBeGreaterThanOrEqual(1);
      expect(count('bezmasa'), `meatless, seed ${seed}`).toBeGreaterThanOrEqual(2);
      expect(count('kure'), `chicken, seed ${seed}`).toBeLessThanOrEqual(3);
      expect(count('hovezi'), `beef, seed ${seed}`).toBeLessThanOrEqual(2);

      // No two dinners in a row with the same kind of protein.
      const dinners = week.days.map((d, i) => resolveMeal(week, i, d.meals.find((m) => m.slot === 've')!)!);
      for (let i = 1; i < dinners.length; i++) expect(dinners[i].tag, `seed ${seed} day ${i}`).not.toBe(dinners[i - 1].tag);

      // Weeknight dinners stay within an hour.
      for (const d of dinners.slice(0, 5)) expect(d.time).toBeLessThanOrEqual(60);

      // No main dish twice.
      const mains = activeMeals(week).filter((x) => !x.meal.leftover && (x.meal.slot === 've' || (x.meal.slot === 'ob' && x.dayIdx >= 5)));
      expect(new Set(mains.map((x) => x.recipe.id)).size).toBe(mains.length);
    }
  });

  it('uses household sizes and is deterministic per seed', () => {
    const a = generateWeek('2026-10-12', household, 42, prefs);
    const b = generateWeek('2026-10-12', household, 42, prefs);
    expect(a).toEqual(b);
    expect(a.days[0].meals.map((m) => m.servings)).toEqual([4, 2, 1, 4]);
    expect(a.days[5].meals.every((m) => m.servings === 4)).toBe(true);
  });

  it('follows the dinner when lunch is a leftover', () => {
    const week = generateWeek('2026-10-12', household, 42, prefs);
    const tuesdayLunch = week.days[1].meals[2];
    expect(tuesdayLunch.leftover).toBe(true);
    expect(resolveMeal(week, 1, tuesdayLunch)!.id).toBe(week.days[0].meals[3].recipeId);
    week.days[0].meals[3].off = true;
    expect(resolveMeal(week, 1, tuesdayLunch)).toBeUndefined();
  });
});

describe('swap suggestions', () => {
  const week = generateWeek('2026-10-12', household, 42, prefs);

  it('offers recipes of the right slot and never the current one', () => {
    week.days.forEach((day, dayIdx) => {
      day.meals.forEach((meal) => {
        const all = candidates(week, dayIdx, meal.slot, 'all', prefs);
        expect(all.length, `${dayIdx} ${meal.slot}`).toBeGreaterThan(0);
        for (const s of all) {
          expect(s.recipe.slots).toContain(meal.slot);
          if (!meal.leftover) expect(s.recipe.id).not.toBe(meal.recipeId);
        }
      });
    });
  });

  it('adds three more ideas per round, never repeating one', () => {
    week.days.forEach((day, dayIdx) => {
      day.meals.forEach((meal) => {
        const all = candidates(week, dayIdx, meal.slot, 'all', prefs);
        const ids = all.map((s) => s.recipe.id);
        expect(new Set(ids).size, `${dayIdx} ${meal.slot}`).toBe(ids.length);
        let prev: number[] = [];
        for (let round = 0; round * 3 < all.length + 3; round++) {
          const shown = suggest(all, round).map((s) => s.recipe.id);
          expect(shown.slice(0, prev.length)).toEqual(prev);
          expect(shown).toHaveLength(Math.min((round + 1) * 3, all.length));
          prev = shown;
        }
        expect(prev).toEqual(ids);
      });
    });
  });

  it('filters', () => {
    expect(candidates(week, 1, 've', 'ryba', prefs).every((s) => s.recipe.tag === 'ryba')).toBe(true);
    expect(candidates(week, 1, 've', 'quick', prefs).every((s) => s.recipe.time <= 25)).toBe(true);
    expect(candidates(week, 1, 've', 'fav', prefs)).toHaveLength(0);
    expect(candidates(week, 1, 've', 'fav', { favorites: [411], cooked: {} }).map((s) => s.recipe.id)).toEqual([411]);
  });

  it('searches titles and ingredients without diacritics', () => {
    expect(searchRecipes('losos', 've').map((r) => r.id)).toEqual(expect.arrayContaining([14613, 23851, 20074]));
    expect(searchRecipes('PALACINKY', 'sn')[0].id).toBe(45);
    expect(searchRecipes('cizrna', 'ob')[0].id).toBe(17167);
    expect(searchRecipes('   ', 've')).toEqual([]);
  });
});

describe('shopping list', () => {
  it('scales by portions and adds up across recipes', () => {
    const week = generateWeek('2026-10-12', household, 42, prefs);
    // Keep only Monday dinner: salmon with potatoes for 4, and Tuesday lunch as its leftover for 1.
    week.days.forEach((d, i) => d.meals.forEach((m) => (m.off = !((i === 0 && m.slot === 've') || (i === 1 && m.slot === 'ob')))));
    week.days[0].meals[3].recipeId = 14613;
    const items = buildShopping(week);
    const salmon = items.find((i) => i.name === 'filet z lososa')!;
    // 300 g for 2 portions -> 5 portions = 750 g
    expect(salmon.amount).toBe(750);
    expect(salmon.category).toBe('maso');
    expect(items.find((i) => i.name === 'sůl')!.pantry).toBe(true);
  });

  it('drops skipped days and meals', () => {
    const week = generateWeek('2026-10-12', household, 42, prefs);
    const full = buildShopping(week).length;
    week.days.forEach((d) => (d.off = true));
    expect(full).toBeGreaterThan(20);
    expect(buildShopping(week)).toHaveLength(0);
  });

  it('classifies and formats', () => {
    expect(classify('kuřecí vývar')).toBe('spiz');
    expect(classify('kokosové mléko')).toBe('spiz');
    expect(classify('kuřecí prsa')).toBe('maso');
    expect(classify('paprika sladká mletá')).toBe('koreni');
    expect(classify('červená paprika')).toBe('zelenina');
    expect(classify('celozrnný toustový chléb')).toBe('pecivo');
    expect(formatAmount(1200, 'g')).toBe('1,2 kg');
    expect(formatAmount(3, 'stroužek')).toBe('3 stroužky');
    expect(formatAmount(6, 'lžíce')).toBe('6 lžic');
    expect(formatAmount(null, null)).toBe('podle chuti');
    expect(roundAmount(187.5, 'g')).toBe(190);
    expect(roundAmount(1.2, 'ks')).toBe(1.5);
  });
});
