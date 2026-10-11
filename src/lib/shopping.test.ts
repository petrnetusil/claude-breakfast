import { describe, expect, it } from 'vitest';
import { parseWeekLink } from './link';
import { buildShopping, formatAmount, shoppingText } from './shopping';
import type { Ingredient, RecipeDetail } from './types';

// Made-up recipes; no Rohlík data is stored in this repo.
const ing = (name: string, amount: number | null, unit: string | null): Ingredient => ({ name, amount, unit, text: '' });
const recipe = (id: number, servings: number, ingredients: Ingredient[]): RecipeDetail => ({
  id, title: `Recept ${id}`, slug: `${id}-recept`, image: '', time: 20, author: '', servings, servingsLabel: `${servings} porce`, ingredients, steps: [],
});

const details = new Map([
  [1, recipe(1, 2, [ing('Mrkev', 200, 'g'), ing('Sůl', null, 'špetka'), ing('Vejce', 2, null)])],
  [2, recipe(2, 4, [ing('mrkev', 400, 'g'), ing('Sůl', 1, 'lžička'), ing('Kuřecí prsa', 500, 'g')])],
]);

describe('buildShopping', () => {
  // Monday dinner 1 for 4, Tuesday lunch is Monday's dinner, Tuesday dinner 2 for 4, Wednesday a simple breakfast.
  const { week } = parseWeekLink('?t=2026-10-12&lid=4,2,1,4&po=ve1&ut=ob=,ve2&st=sn:Křupinky_s_mlékem&ct=sn:Křupinky_s_mlékem,ve2-')!;
  const list = buildShopping(week, details);
  const find = (name: string) => list.items.find((i) => i.name.toLowerCase() === name);

  it('scales to portions and adds up the same ingredient across recipes, whatever its case', () => {
    // Recipe 1: 200 g for 2 -> 400 g for 4, plus the leftover lunch for 1 -> 100 g. Recipe 2: 400 g for 4.
    expect(find('mrkev')?.amount).toBe(900);
    expect(find('mrkev')?.recipes).toEqual(['Recept 1', 'Recept 2']);
    expect(find('vejce')?.amount).toBe(5);
    expect(find('kuřecí prsa')?.category).toBe('maso');
  });

  it('drops "podle chuti" when the same thing has an amount, and leaves staples unticked', () => {
    const salt = list.items.filter((i) => i.name === 'Sůl');
    expect(salt.map((i) => [i.amount, i.unit])).toEqual([[1, 'lžička']]);
    expect(salt[0].pantry).toBe(true);
  });

  it('lists simple meals separately, counted per day', () => {
    expect(list.simple).toEqual([{ text: 'Křupinky s mlékem', days: 2 }]);
    expect(shoppingText(week, list)).toContain('- Křupinky s mlékem (na 2 dny)');
    expect(shoppingText(week, list)).not.toContain('Sůl');
  });

  it('makes a recipe given in pieces once, whatever the portions', () => {
    const pieces = new Map([[3, { ...recipe(3, 1, [ing('Dýně', 500, 'g')]), servings: null }]]);
    const { week: w } = parseWeekLink('?po=sn3*4&ut=sn3*2')!;
    expect(buildShopping(w, pieces).items[0].amount).toBe(1000);
  });

  it('formats Czech amounts', () => {
    expect(formatAmount(1500, 'g')).toBe('1,5 kg');
    expect(formatAmount(3, 'stroužek')).toBe('3 stroužky');
    expect(formatAmount(null, null)).toBe('podle chuti');
  });
});
