import { activeMeals } from './planner';
import type { ProductCard, RecipeDetail, Selection, WeekPlan } from './types';

/** Rohlík's products for one ingredient across the whole week. */
export interface ProductLine {
  ingredientId: number;
  title: string;
  staple: boolean;
  /**
   * Rohlík's picks first, then alternatives. packs = the most any single planned recipe needs (not
   * rounded): Rohlík counts packs per recipe, so adding them up would buy a bottle of oil per recipe.
   * Used only when the week's total amount cannot be compared with the pack size.
   */
  options: { productId: number; packs: number }[];
}

/**
 * Rohlík's products per ingredient over the planned meals. Pack counts are scaled from Rohlík's
 * portions to the planned ones (a recipe given in pieces, "20 kusů", is made once) and the largest
 * single-recipe count is kept.
 */
export function productLines(week: WeekPlan, selections: Map<number, Selection>, details: Map<number, RecipeDetail>): Map<number, ProductLine> {
  const lines = new Map<number, { title: string; staple: boolean; packs: Map<number, number> }>();
  for (const { meal, ref } of activeMeals(week)) {
    if (ref.kind !== 'recipe') continue;
    const sel = selections.get(ref.id);
    if (!sel) continue;
    const factor = details.get(ref.id)?.servings === null ? 1 : meal.servings / sel.portions;
    for (const ing of sel.ingredients) {
      let line = lines.get(ing.ingredientId);
      if (!line) {
        line = { title: ing.title, staple: ing.staple, packs: new Map() };
        lines.set(ing.ingredientId, line);
      }
      // Something a recipe needs to buy is not a staple, even if another recipe expects it at home.
      line.staple = line.staple && ing.staple;
      for (const o of ing.options) line.packs.set(o.productId, Math.max(line.packs.get(o.productId) ?? 0, o.packs * factor));
    }
  }
  return new Map(
    [...lines].map(([ingredientId, l]) => [
      ingredientId,
      { ingredientId, title: l.title, staple: l.staple, options: [...l.packs].map(([productId, packs]) => ({ productId, packs })) },
    ]),
  );
}

export interface ProductChoice {
  productId: number;
  /** Whole packs to buy. */
  packs: number;
  /** She chose this product herself (now or in an earlier week). */
  own: boolean;
  /** The product she or Rohlík would pick is sold out; this is the next available one. */
  replaced: boolean;
  /** Nothing on the list is available. */
  soldOut: boolean;
}

const wholePacks = (packs: number) => Math.max(1, Math.ceil(packs - 1e-9));

type BaseUnit = 'g' | 'ml' | 'ks';

/** Pack size from Rohlík's text: "cca 320 g", "0,55 kg", "1 l", "6 ks". Anything else -> null. */
export function parsePack(text: string | undefined): { amount: number; unit: BaseUnit } | null {
  const m = /(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|ks)\b/i.exec(text ?? '');
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  const unit = m[2].toLowerCase();
  if (!(n > 0)) return null;
  if (unit === 'kg') return { amount: n * 1000, unit: 'g' };
  if (unit === 'l') return { amount: n * 1000, unit: 'ml' };
  return { amount: n, unit: unit as BaseUnit };
}

/** A spoon is near enough 15 ml (or g), a teaspoon 5. */
const SPOON: Record<string, number> = { lžíce: 15, lžička: 5 };

/** An ingredient amount from the list in g, ml or pieces; null when it cannot be measured ("špetka", "podle chuti"). */
export function needInBase(amount: number | null, unit: string | null): { amount: number; unit: BaseUnit } | null {
  if (amount == null) return null;
  if (unit === 'g' || unit === 'ml') return { amount, unit };
  if (unit && SPOON[unit]) return { amount: amount * SPOON[unit], unit: 'ml' };
  if (unit === null || unit === 'ks') return { amount, unit: 'ks' };
  return null;
}

export interface Need {
  amount: number | null;
  unit: string | null;
}

/**
 * Whole packs to buy: the week's total need divided by the pack size. Pieces ("3,5" bananas) are
 * counted against "N ks" in the pack text or the product name ("Banán 1 ks", sold as "cca 170 g").
 * Grams and millilitres are compared as if equal (fine for oil or milk), but only while that gives a
 * few packs: "1 l" of stock against a 60 g concentrate would be 17 packs; Rohlík's own count makes
 * the same mistake there, so one pack it is. Needs that cannot be compared fall back to Rohlík's
 * count for one recipe.
 */
export function packsFor(needs: Need[], packText: string | undefined, fallback: number, productName = ''): number {
  const pack = parsePack(packText);
  const count = /(\d+)\s*ks\b/i.exec(productName);
  const pieces = pack?.unit === 'ks' ? pack : count ? { amount: Number(count[1]), unit: 'ks' as const } : null;
  const weight = pack && pack.unit !== 'ks' ? pack : null;
  let byPieces = 0;
  let same = 0;
  let cross = 0;
  for (const n of needs) {
    const base = needInBase(n.amount, n.unit);
    if (!base) continue;
    if (base.unit === 'ks') byPieces += pieces ? base.amount : 0;
    else if (weight) {
      if (base.unit === weight.unit) same += base.amount;
      else cross += base.amount;
    }
  }
  const results: number[] = [];
  if (pieces && byPieces > 0) results.push(wholePacks(byPieces / pieces.amount));
  if (weight && same + cross > 0) {
    const withCross = wholePacks((same + cross) / weight.amount);
    results.push(cross === 0 || withCross <= 3 ? withCross : same ? wholePacks(same / weight.amount) : 1);
  }
  return results.length ? Math.max(...results) : wholePacks(fallback);
}

/**
 * Which product to buy: her own choice first, then Rohlík's pick, then the alternatives;
 * the first one in stock wins. Products whose card has not loaded yet count as available.
 * `needs` are the list amounts for this ingredient; with the product's pack size they give the packs.
 */
export function chooseProduct(line: ProductLine, cards: Map<number, ProductCard>, preferred?: number, needs: Need[] = []): ProductChoice | null {
  if (!line.options.length && preferred == null) return null;
  const order = [...line.options];
  if (preferred != null) {
    const i = order.findIndex((o) => o.productId === preferred);
    // A product she found outside Rohlík's list takes the pack count of Rohlík's pick.
    const own = i >= 0 ? order.splice(i, 1)[0] : { productId: preferred, packs: order[0]?.packs ?? 1 };
    order.unshift(own);
  }
  const available = (id: number) => cards.get(id)?.available ?? true;
  const idx = order.findIndex((o) => available(o.productId));
  const pick = order[idx >= 0 ? idx : 0];
  return {
    productId: pick.productId,
    packs: packsFor(needs, cards.get(pick.productId)?.amountText, pick.packs, cards.get(pick.productId)?.name),
    own: preferred != null && pick.productId === preferred,
    replaced: idx > 0,
    soldOut: idx < 0,
  };
}

export const unitPrice = (card: ProductCard) => card.salePrice ?? card.price;

/** "1 093,40 Kč" */
export const formatPrice = (czk: number) =>
  `${czk.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kč`;
