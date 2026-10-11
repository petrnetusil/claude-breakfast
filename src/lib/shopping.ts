import { activeMeals } from './planner';
import type { RecipeDetail, WeekPlan } from './types';

export type Category = 'zelenina' | 'maso' | 'mlecne' | 'pecivo' | 'spiz' | 'koreni';

export const CATEGORY_LABEL: Record<Category, string> = {
  zelenina: 'Ovoce, zelenina a bylinky',
  maso: 'Maso a ryby',
  mlecne: 'Mléčné a vejce',
  pecivo: 'Pečivo',
  spiz: 'Trvanlivé',
  koreni: 'Koření a základ – nejspíš máte doma',
};
export const CATEGORY_ORDER: Category[] = ['zelenina', 'maso', 'mlecne', 'pecivo', 'spiz', 'koreni'];

const PANTRY =
  /(^|\s)(sůl|pepř|med|badyán)(?!\p{L})|olej|cukr|mouka|skořice|paprika .*mletá|kari koření|oregano|majoránka|muškát|bobkový|nové koření|kmín|kardamom|hřebíček|koriandr mletý|kajenský|chilli vločky|vanilk|prášek do pečiva|soda|ocet|škrob|strouhanka|sójová|hořčice|kakao|sádlo|droždí|kypřící prášek|kurkum|římský kmín|chilli koření/u;
const SHELF =
  /vývar|kokosové mléko|konzerv|ovesný nápoj|rýžová smetana|džus|víno|nudle|těstovin|špagety|penne|makarony|fleky|tagliatelle|gnocchi|rýže|čočka|vločky|krupice|ořechy|semínka|čokoláda|rozinky|marmeláda|protlak|drcená rajčata|sušená rajčata|nakládané|omáčka|majonéza|guacamole|extrakt|aroma/;
const BAKERY = /chléb|chleba|tortill|veka|pečivo|bageta|rohlík|houska|croissant|pita/;
const MEAT = /kuřecí|kuře|krůt|hověz|vepř|telecí|jehněčí|mleté maso|losos|tuňák|treska|krevet|ryb|slanina|pancetta|šunka|klobás|párk|krkovice|roštěn|kližka|bůček|mortadella|prosciutto|chorizo/;
const DAIRY = /mléko|máslo|smetan|jogurt|tvaroh|sýr|cheddar|čedar|parmazán|gouda|feta|ricotta|lučina|žervé|kefír|vejce|ghí|mozzarell|burrata|mascarpone|cottage|eidam|ementál|pecorino|halloumi/;

export function classify(name: string): Category {
  if (PANTRY.test(name)) return 'koreni';
  if (SHELF.test(name)) return 'spiz';
  if (BAKERY.test(name)) return 'pecivo';
  if (MEAT.test(name)) return 'maso';
  if (DAIRY.test(name)) return 'mlecne';
  return 'zelenina';
}

export interface ShopItem {
  key: string;
  name: string;
  unit: string | null;
  /** null = no amount given in the recipe ("podle chuti"). */
  amount: number | null;
  category: Category;
  /** Staples: unticked by default. */
  pantry: boolean;
  /** Titles of the recipes that need it. */
  recipes: string[];
  /** Rohlík's ingredient numbers behind this line; the first one picks the product. */
  ingredientIds: number[];
}

export function roundAmount(amount: number, unit: string | null): number {
  if (unit === 'g' || unit === 'ml') {
    if (amount >= 100) return Math.round(amount / 10) * 10;
    return Math.max(5, Math.round(amount / 5) * 5);
  }
  return Math.max(0.5, Math.ceil(amount * 2 - 1e-9) / 2);
}

const UNIT_FORMS: Record<string, [string, string, string]> = {
  plátek: ['plátek', 'plátky', 'plátků'],
  stroužek: ['stroužek', 'stroužky', 'stroužků'],
  lžíce: ['lžíce', 'lžíce', 'lžic'],
  lžička: ['lžička', 'lžičky', 'lžiček'],
  hrst: ['hrst', 'hrsti', 'hrstí'],
  špetka: ['špetka', 'špetky', 'špetek'],
};

const num = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** "600 g", "1,2 kg", "3 stroužky", "podle chuti" */
export function formatAmount(amount: number | null, unit: string | null): string {
  if (amount == null) return unit === 'špetka' ? 'špetka' : unit === 'hrst' ? 'hrst' : 'podle chuti';
  if (unit === 'g' && amount >= 1000) return `${num(amount / 1000)} kg`;
  if (unit === 'ml' && amount >= 1000) return `${num(amount / 1000)} l`;
  if (!unit) return num(amount);
  const forms = UNIT_FORMS[unit];
  if (!forms) return `${num(amount)} ${unit}`;
  const form = amount === 1 ? forms[0] : Number.isInteger(amount) && amount >= 5 ? forms[2] : forms[1];
  return `${num(amount)} ${form}`;
}

/** Scales one ingredient amount from the recipe's portions to the wanted ones. A recipe without portions is made once. */
export function scale(amount: number | null, baseServings: number | null, servings: number): number | null {
  if (amount == null) return null;
  return baseServings == null ? amount : (amount * servings) / baseServings;
}

export interface ShopList {
  items: ShopItem[];
  /** Simple meals without a recipe ("Křupinky s mlékem"): bought as they are. */
  simple: { text: string; days: number }[];
}

/** Everything needed for the week, added up across recipes. Recipes not loaded yet are left out. */
export function buildShopping(week: WeekPlan, details: Map<number, RecipeDetail>): ShopList {
  const map = new Map<string, ShopItem & { raw: number | null }>();
  const simple = new Map<string, number>();
  for (const { meal, ref } of activeMeals(week)) {
    if (ref.kind === 'text') {
      simple.set(ref.text, (simple.get(ref.text) ?? 0) + 1);
      continue;
    }
    const recipe = details.get(ref.id);
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      const amount = scale(ing.amount, recipe.servings, meal.servings);
      const unit = amount == null ? null : ing.unit;
      const name = ing.name.toLowerCase();
      const key = `${name}|${unit ?? ''}|${amount == null ? 'x' : 'n'}`;
      const category = classify(name);
      const item = map.get(key);
      if (item) {
        if (amount != null) item.raw = (item.raw ?? 0) + amount;
        if (!item.recipes.includes(recipe.title)) item.recipes.push(recipe.title);
        if (ing.ingredientId != null && !item.ingredientIds.includes(ing.ingredientId)) item.ingredientIds.push(ing.ingredientId);
      } else {
        const ingredientIds = ing.ingredientId != null ? [ing.ingredientId] : [];
        map.set(key, { key, name: ing.name, unit, amount: null, raw: amount, category, pantry: category === 'koreni', recipes: [recipe.title], ingredientIds });
      }
    }
  }

  const all = [...map.values()];
  const withAmount = new Set(all.filter((i) => i.raw != null).map((i) => i.name.toLowerCase()));
  const items = all
    // "podle chuti" is noise once the same thing is on the list with an amount.
    .filter((i) => i.raw != null || !withAmount.has(i.name.toLowerCase()))
    .map(({ raw, ...item }) => ({ ...item, amount: raw == null ? null : roundAmount(raw, item.unit) }))
    .sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.name.localeCompare(b.name, 'cs'),
    );
  return { items, simple: [...simple].map(([text, days]) => ({ text, days })) };
}

export const isTicked = (week: WeekPlan, item: ShopItem): boolean => week.shop[item.key] ?? !item.pantry;

/** The chosen Rohlík product for a list line. */
export interface PickedProduct {
  productId: number;
  name: string;
  packs: number;
}

const days = (n: number) => `na ${n} ${n === 1 ? 'den' : n < 5 ? 'dny' : 'dní'}`;

/**
 * The shopping list as text. With `products`, each line carries the chosen product's number, so
 * Claude can put exactly that product in the cart.
 */
export function shoppingText(week: WeekPlan, list: ShopList, products?: Map<string, PickedProduct>): string {
  const lines = list.items
    .filter((i) => isTicked(week, i))
    .map((i) => {
      const need = i.amount == null ? i.name : `${i.name} – ${formatAmount(i.amount, i.unit)}`;
      const p = products?.get(i.key);
      return p ? `${need}: ${p.name} (č. ${p.productId}), ${p.packs}×` : need;
    });
  for (const s of list.simple) lines.push(`${s.text} (${days(s.days)})`);
  return lines.map((l) => `- ${l}`).join('\n');
}
