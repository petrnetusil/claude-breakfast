import { describe, expect, it } from 'vitest';
import { parseWeekLink } from './link';
import { chooseProduct, formatPrice, packsFor, parsePack, productLines, type ProductLine } from './products';
import { toProductCard, toSelection } from './rohlik';
import type { ProductCard, RecipeDetail, Selection } from './types';

// Made-up products and recipes; no Rohlík data is stored in this repo.
const card = (id: number, available = true, price = 10): ProductCard => ({ id, name: `Produkt ${id}`, image: '', amountText: '1 ks', price, salePrice: null, available });
const detail = (id: number, servings: number | null): RecipeDetail =>
  ({ id, title: `Recept ${id}`, slug: '', image: '', time: null, author: '', servings, servingsLabel: '', ingredients: [], steps: [] });

describe('Rohlík product responses', () => {
  it('reads a selection with Rohlík’s pick first and staples marked', () => {
    const sel = toSelection(5, {
      metadata: { portions: 4 },
      ingredientGroups: [
        { defaultSelected: true, ingredients: [{ ingredientId: 1, title: ' Mrkev ', products: [{ productId: 11, amount: 2 }, { productId: 10, amount: 1, selected: true }] }] },
        { defaultSelected: false, ingredients: [{ ingredientId: 2, title: 'Olej', products: [{ productId: 20, amount: 1, selected: true }] }] },
      ],
    });
    expect(sel).toEqual({
      recipeId: 5,
      portions: 4,
      ingredients: [
        { ingredientId: 1, title: 'Mrkev', staple: false, options: [{ productId: 10, packs: 1 }, { productId: 11, packs: 2 }] },
        { ingredientId: 2, title: 'Olej', staple: true, options: [{ productId: 20, packs: 1 }] },
      ],
    });
  });

  it('reads a product card and its stock', () => {
    const base = { productId: 3, name: ' Zkušební mrkev ', image: { path: 'https://cdn.example/3.jpg' }, textualAmount: '500 g', prices: { originalPrice: 24.9, salePrice: 19.9 } };
    expect(toProductCard({ ...base, stock: { availabilityStatus: 'AVAILABLE', maxAvailableAmount: 5 } })).toEqual({
      id: 3, name: 'Zkušební mrkev', image: 'https://cdn.example/3.jpg', amountText: '500 g', price: 24.9, salePrice: 19.9, available: true,
    });
    expect(toProductCard({ ...base, stock: { availabilityStatus: 'UNAVAILABLE', maxAvailableAmount: 0 } }).available).toBe(false);
  });
});

describe('productLines', () => {
  // Recipe 1 for 4 on Monday, its leftover for 1 on Tuesday, recipe 2 (made in pieces) on Tuesday.
  const { week } = parseWeekLink('?t=2026-10-12&lid=4,2,1,4&po=ve1&ut=ob=,ve2')!;
  const selections = new Map<number, Selection>([
    [1, { recipeId: 1, portions: 2, ingredients: [{ ingredientId: 7, title: 'Mrkev', staple: false, options: [{ productId: 70, packs: 1 }, { productId: 71, packs: 2 }] }] }],
    [2, { recipeId: 2, portions: 4, ingredients: [
      { ingredientId: 7, title: 'Mrkev', staple: true, options: [{ productId: 71, packs: 1 }, { productId: 72, packs: 1 }] },
      { ingredientId: 8, title: 'Sůl', staple: true, options: [{ productId: 80, packs: 1 }] },
    ] }],
  ]);
  const lines = productLines(week, selections, new Map([[1, detail(1, 2)], [2, detail(2, null)]]));

  it('keeps the largest single-recipe pack count, scaled to the planned portions', () => {
    // Recipe 1: ×4/2 = 2, leftover ×1/2 = 0.5; recipe 2 in pieces: ×1. Not added up.
    expect(lines.get(7)!.options).toEqual([
      { productId: 70, packs: 2 },
      { productId: 71, packs: 4 },
      { productId: 72, packs: 1 },
    ]);
  });

  it('keeps an ingredient a staple only when every recipe expects it at home', () => {
    expect(lines.get(7)!.staple).toBe(false);
    expect(lines.get(8)!.staple).toBe(true);
  });
});

describe('packs from the week’s need', () => {
  it('reads Rohlík pack sizes', () => {
    expect(parsePack('cca 320 g')).toEqual({ amount: 320, unit: 'g' });
    expect(parsePack('cca 0,55 kg')).toEqual({ amount: 550, unit: 'g' });
    expect(parsePack('1 l')).toEqual({ amount: 1000, unit: 'ml' });
    expect(parsePack('6 ks')).toEqual({ amount: 6, unit: 'ks' });
    expect(parsePack('2 m')).toBeNull();
  });

  it('divides the total need by the pack size, spoons counted as ml', () => {
    expect(packsFor([{ amount: 1350, unit: 'g' }], 'cca 320 g', 9)).toBe(5);
    expect(packsFor([{ amount: 5, unit: 'g' }, { amount: 12, unit: 'lžíce' }], '500 ml', 8)).toBe(1);
    expect(packsFor([{ amount: 9, unit: null }], '6 ks', 7)).toBe(2);
  });

  it('counts pieces against "N ks" in the product name', () => {
    expect(packsFor([{ amount: 3.5, unit: null }], 'cca 170 g', 2, 'Banán 1 ks')).toBe(4);
    expect(packsFor([{ amount: 5, unit: null }], '1 kg', 1, 'Citrony, síťka')).toBe(1);
  });

  it('does not turn a litre of stock into 17 packs of concentrate', () => {
    expect(packsFor([{ amount: 1000, unit: 'ml' }], '60 g', 17)).toBe(1);
    expect(packsFor([{ amount: 1000, unit: 'ml' }], '500 g', 1)).toBe(2);
  });

  it('falls back to one recipe’s count when the units do not compare', () => {
    expect(packsFor([{ amount: 1000, unit: 'ml' }], '6 ks', 1.2)).toBe(2);
    expect(packsFor([{ amount: null, unit: 'špetka' }], '100 g', 1)).toBe(1);
    expect(packsFor([{ amount: 300, unit: 'g' }], undefined, 3)).toBe(3);
  });
});

describe('chooseProduct', () => {
  const line: ProductLine = { ingredientId: 7, title: 'Mrkev', staple: false, options: [{ productId: 70, packs: 2.5 }, { productId: 71, packs: 1.2 }, { productId: 72, packs: 1 }] };

  it('takes Rohlík’s pick and rounds packs up', () => {
    expect(chooseProduct(line, new Map())).toEqual({ productId: 70, packs: 3, own: false, replaced: false, soldOut: false });
  });

  it('takes her own choice first, also one outside Rohlík’s list', () => {
    expect(chooseProduct(line, new Map(), 72)).toMatchObject({ productId: 72, packs: 1, own: true });
    // With the need and the pack size the count comes from the amount.
    const sized = new Map([[72, { ...card(72), amountText: '250 g' }]]);
    expect(chooseProduct(line, sized, 72, [{ amount: 600, unit: 'g' }])).toMatchObject({ productId: 72, packs: 3 });
    expect(chooseProduct(line, new Map(), 99)).toMatchObject({ productId: 99, packs: 3, own: true });
  });

  it('skips sold-out products and says so', () => {
    const cards = new Map([[70, card(70, false)], [71, card(71, true)]]);
    expect(chooseProduct(line, cards)).toMatchObject({ productId: 71, packs: 2, replaced: true, soldOut: false });
    const own = chooseProduct(line, new Map([[72, card(72, false)]]), 72);
    expect(own).toMatchObject({ productId: 70, own: false, replaced: true });
  });

  it('reports when nothing is available', () => {
    const cards = new Map([70, 71, 72].map((id) => [id, card(id, false)]));
    expect(chooseProduct(line, cards)).toMatchObject({ productId: 70, soldOut: true });
  });

  it('formats prices the Czech way', () => {
    expect(formatPrice(1093.4).replace(/\s/g, ' ')).toBe('1 093,40 Kč');
  });
});
