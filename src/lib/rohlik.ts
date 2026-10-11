import type { Ingredient, ProductCard, RecipeCard, RecipeDetail, Selection, Slot } from './types';

/*
 * Live recipe data from rohlik.cz. These are the public endpoints Rohlík's own website uses;
 * they allow requests from any site (CORS "*") and need no login. Nothing is stored: results
 * are kept in memory only while the page is open, so the same card is not fetched twice.
 */

const BASE = 'https://www.rohlik.cz';
const CDN = 'https://cdn.rohlik.cz';

export class RohlikError extends Error {}

async function getJson<T>(path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(BASE + path);
  } catch {
    throw new RohlikError('Rohlík se nepodařilo načíst. Zkontrolujte připojení k internetu.');
  }
  if (res.status === 204) return null;
  if (!res.ok) throw new RohlikError(`Rohlík odpověděl chybou ${res.status}. Zkuste to za chvíli znovu.`);
  return (await res.json()) as T;
}

// ───────────── Parsing (pure, tested) ─────────────

const imageUrl = (path: string | undefined) => (!path ? '' : path.startsWith('http') ? path : CDN + path);

/** "45 min" -> 45, "1 h 30 min" -> 90, anything else -> null */
export function parseMinutes(text: string): number | null {
  const h = /(\d+)\s*h/i.exec(text);
  const m = /(\d+)\s*min/i.exec(text);
  if (!h && !m) return null;
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
}

/** "4 PORCE" -> 4. Pieces or a whole ("20 kusů", "1 dort", "3 litry") -> null; no number -> 4. */
export function parseServings(label: string): number | null {
  const n = /\d+/.exec(label);
  if (!n) return 4;
  return /porc/i.test(label) ? Math.max(1, Number(n[0])) : null;
}

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

function readNumber(s: string): number {
  if (FRACTIONS[s] != null) return FRACTIONS[s];
  const frac = /^(\d+)\s*[/⁄]\s*(\d+)$/.exec(s);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(s.replace(',', '.'));
}

/** Unit words in any grammatical form -> [unit, factor]. Order matters: longer words first. */
const W = '(?!\\p{L})'; // end of word; \b only knows ASCII letters, so "l" would match in "lžíce"
const L = '\\p{L}*';
const unit = (source: string) => new RegExp(`^(?:${source})`, 'iu');
const UNITS: [RegExp, string, number][] = [
  [unit(`kg${W}`), 'g', 1000],
  [unit(`g${W}|gram${L}`), 'g', 1],
  [unit(`dl${W}`), 'ml', 100],
  [unit(`ml${W}`), 'ml', 1],
  [unit(`l${W}|litr${L}`), 'ml', 1000],
  [unit(`(?:kávov${L}|čajov${L})\\s+lžič${L}`), 'lžička', 1],
  [unit(`polévkov${L}\\s+l[žz][ií]c${L}`), 'lžíce', 1],
  [unit(`lžič${L}`), 'lžička', 1],
  [unit(`lžíc${L}|lžic${L}`), 'lžíce', 1],
  [unit(`špet${L}`), 'špetka', 1],
  [unit(`strouž${L}`), 'stroužek', 1],
  [unit(`hrst${L}`), 'hrst', 1],
  [unit(`plát${L}`), 'plátek', 1],
  [unit(`svaz${L}`), 'svazek', 1],
  [unit(`snít${L}`), 'snítka', 1],
  [unit(`balení${W}|bal\\.`), 'balení', 1],
  [unit(`ks${W}|kus${L}|pieces? of${W}`), 'ks', 1],
];

const NUMBER = /^(\d+\s*[/⁄]\s*\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔])(?:\s*[–-]\s*(\d+(?:[.,]\d+)?))?\s*(?:x(?!\p{L}))?\s*/u;

/**
 * Amount and unit from Rohlík's ingredient text. Ranges take the upper end, so the
 * shopping list never comes out short.
 *   "4–6 lžic zakysané smetany" -> 6 lžíce, "½ kávové lžičky sody" -> 0,5 lžička,
 *   "Špetka soli" -> null špetka, "2 vejce" -> 2 (no unit), "Sůl" -> null
 */
export function parseAmount(text: string): { amount: number | null; unit: string | null } {
  let s = text.trim();
  let amount: number | null = null;
  const num = NUMBER.exec(s);
  if (num) {
    amount = readNumber(num[2] ?? num[1]);
    s = s.slice(num[0].length);
  }
  for (const [re, name, factor] of UNITS) {
    const u = re.exec(s);
    if (!u) continue;
    // A bare unit word ("Lžička medu") means one; a pinch or a handful has no amount.
    if (amount == null) return { amount: name === 'špetka' || name === 'hrst' ? null : 1, unit: name };
    return { amount: amount * factor, unit: name };
  }
  return { amount: Number.isFinite(amount) ? amount : null, unit: null };
}

/**
 * Not shopping: kitchen tools, baking paper, and plain water from the tap ("Voda neperlivá",
 * "Teplá voda"). Sparkling, soda or coconut water stay on the list.
 */
export const NOT_FOOD = /^(pomůcky|papír na pečení|alobal|potravinová fólie|špejle|párátka)|^((studená|teplá|horká|vlažná|vroucí|pitná) )?voda( neperlivá| z kohoutku)?$/i;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Thajské kari | Rychlá večeře" -> "Thajské kari": the part after "|" is a marketing line. */
export const cleanTitle = (name: string) => name.split('|')[0].replace(/\s+/g, ' ').trim();

interface RawCard {
  recipeId: number;
  name: string;
  slug: string;
  image?: { path?: string };
  details?: { text: string }[];
  authorName?: string;
}

export function toCard(raw: RawCard): RecipeCard {
  const time = (raw.details ?? []).map((d) => parseMinutes(d.text)).find((m) => m != null) ?? null;
  return { id: raw.recipeId, title: cleanTitle(raw.name), slug: raw.slug, image: imageUrl(raw.image?.path), time, author: raw.authorName ?? '' };
}

interface RawDetail {
  id: number;
  name: string;
  link?: string;
  totalTimeMinutes?: number | null;
  servings?: { name: string; default?: boolean }[];
  image?: { path?: string };
  author?: { name?: string };
  ingredients?: { name: string; items: { name: string; ingredientName: string; ingredientId?: number }[] }[];
  directions?: { name: string; steps: { content: string }[] }[];
}

export function toDetail(raw: RawDetail): RecipeDetail {
  const serving = raw.servings?.find((s) => s.default) ?? raw.servings?.[0];
  const ingredients: Ingredient[] = (raw.ingredients ?? [])
    .flatMap((group) => group.items)
    .filter((item) => !NOT_FOOD.test(item.name ?? item.ingredientName))
    .map((item) => ({
      ingredientId: item.ingredientId ?? null,
      name: cap((item.name || item.ingredientName).trim()),
      text: item.ingredientName.trim(),
      ...parseAmount(item.ingredientName),
    }));
  const steps = (raw.directions ?? []).flatMap((d) => d.steps.map((s) => s.content.trim())).filter(Boolean);
  return {
    id: raw.id,
    title: cleanTitle(raw.name),
    slug: (raw.link ?? '').replace(/^\/chef\//, ''),
    image: imageUrl(raw.image?.path),
    time: raw.totalTimeMinutes || null,
    author: raw.author?.name ?? '',
    servings: parseServings(serving?.name ?? ''),
    servingsLabel: (serving?.name ?? '').trim().toLowerCase(),
    ingredients,
    steps,
  };
}

export const recipeUrl = (r: { id: number; slug: string }) => `${BASE}/chef/${r.slug.startsWith(String(r.id)) ? r.slug : `${r.id}-${r.slug}`}`;

// ───────────── Fetching ─────────────

const cards = new Map<number, RecipeCard>();
const details = new Map<number, Promise<RecipeDetail>>();

export const cachedCard = (id: number) => cards.get(id);

/** Cards for the given ids; Rohlík serves up to 100 per request. Unknown ids are left out. */
export async function fetchCards(ids: number[]): Promise<Map<number, RecipeCard>> {
  const missing = [...new Set(ids)].filter((id) => !cards.has(id));
  for (let i = 0; i < missing.length; i += 100) {
    const batch = missing.slice(i, i + 100);
    const raw = (await getJson<RawCard[]>(`/api/v1/recipes/card?recipes=${batch.join(',')}`)) ?? [];
    for (const r of raw) cards.set(r.recipeId, toCard(r));
  }
  return new Map(ids.filter((id) => cards.has(id)).map((id) => [id, cards.get(id)!]));
}

export function fetchDetail(id: number): Promise<RecipeDetail> {
  let p = details.get(id);
  if (!p) {
    p = getJson<{ data: RawDetail }>(`/services/frontend-service/recipe/${id}`).then((res) => {
      if (!res?.data) throw new RohlikError('Recept na Rohlíku už není.');
      const d = toDetail(res.data);
      cards.set(id, { id, title: d.title, slug: d.slug, image: d.image, time: d.time, author: d.author });
      return d;
    });
    // A failed request may be retried later.
    p.catch(() => details.delete(id));
    details.set(id, p);
  }
  return p;
}

/** Rohlík's own meal-type filter for each slot. */
export const SLOT_FILTER: Record<Slot, string> = {
  sn: 'pokrm:snidane-svaciny',
  sv: 'pokrm:snidane-svaciny',
  po: 'pokrm:polevky',
  ob: 'pokrm:obedy-vecere',
  ve: 'pokrm:obedy-vecere',
  de: 'pokrm:dezerty-dorty',
};

export type SwapFilter = 'all' | 'quick' | 'bezmasa' | 'ryba';

export const FILTER_VALUE: Record<SwapFilter, string | null> = {
  all: null,
  quick: 'trendy:rychla-jidla',
  bezmasa: 'specialni-strava:vegetarianske-recepty',
  ryba: 'hlavni-surovina:ryby-morske-plody',
};

/** Recipe ids for a slot, optionally narrowed by a filter and a search text. At most 500 (Rohlík's limit). */
export async function findRecipes(opts: { slot?: Slot; filter?: SwapFilter; query?: string; size?: number }): Promise<number[]> {
  const filters = [opts.slot ? SLOT_FILTER[opts.slot] : null, opts.filter ? FILTER_VALUE[opts.filter] : null].filter(Boolean);
  const params = new URLSearchParams({ size: String(opts.size ?? 60) });
  if (filters.length) params.set('filters', filters.join(','));
  if (opts.query?.trim()) params.set('query', opts.query.trim());
  const res = await getJson<{ recipesIds?: number[] }>(`/api/v1/components/recipes/chef-navigation?${params}`);
  return res?.recipesIds ?? [];
}

// ───────────── Products for the shopping list ─────────────

interface RawSelection {
  metadata?: { portions?: number; defaultPortions?: number };
  ingredientGroups?: {
    defaultSelected?: boolean;
    ingredients: { ingredientId: number; title: string; products: { productId: number; amount: number; selected?: boolean }[] }[];
  }[];
}

export function toSelection(recipeId: number, raw: RawSelection): Selection {
  const portions = raw.metadata?.portions ?? raw.metadata?.defaultPortions ?? 4;
  const ingredients = (raw.ingredientGroups ?? []).flatMap((group) =>
    group.ingredients.map((i) => {
      // Rohlík's pick first, then the alternatives in Rohlík's order.
      const sorted = [...i.products].sort((a, b) => Number(!!b.selected) - Number(!!a.selected));
      return {
        ingredientId: i.ingredientId,
        title: i.title.trim(),
        staple: group.defaultSelected === false,
        options: sorted.map((p) => ({ productId: p.productId, packs: Math.max(0, p.amount) })),
      };
    }),
  );
  return { recipeId, portions: Math.max(1, portions), ingredients };
}

interface RawProductCard {
  productId: number;
  name: string;
  image?: { path?: string };
  textualAmount?: string;
  prices?: { originalPrice?: number; salePrice?: number | null };
  stock?: { availabilityStatus?: string; maxAvailableAmount?: number };
}

export function toProductCard(raw: RawProductCard): ProductCard {
  const status = raw.stock?.availabilityStatus ?? 'AVAILABLE';
  return {
    id: raw.productId,
    name: raw.name.trim(),
    image: imageUrl(raw.image?.path),
    amountText: (raw.textualAmount ?? '').trim(),
    price: raw.prices?.originalPrice ?? 0,
    salePrice: raw.prices?.salePrice ?? null,
    available: status === 'AVAILABLE' && (raw.stock?.maxAvailableAmount ?? 1) > 0,
  };
}

const selections = new Map<number, Promise<Selection>>();
const productCards = new Map<number, ProductCard>();

export function fetchSelection(recipeId: number): Promise<Selection> {
  let p = selections.get(recipeId);
  if (!p) {
    p = getJson<RawSelection>(`/api/v1/chef/${recipeId}/ingredients/selection`).then((raw) => toSelection(recipeId, raw ?? {}));
    p.catch(() => selections.delete(recipeId));
    selections.set(recipeId, p);
  }
  return p;
}

export const cachedProduct = (id: number) => productCards.get(id);

/** Product cards for the given ids; Rohlík serves 50 per request. Unknown ids are left out. */
export async function fetchProductCards(ids: number[]): Promise<Map<number, ProductCard>> {
  const missing = [...new Set(ids)].filter((id) => !productCards.has(id));
  const batches: number[][] = [];
  for (let i = 0; i < missing.length; i += 50) batches.push(missing.slice(i, i + 50));
  await Promise.all(
    batches.map(async (batch) => {
      const q = batch.map((id) => `products=${id}`).join('&');
      const raw = (await getJson<RawProductCard[]>(`/api/v1/products/card?${q}&categoryType=normal`)) ?? [];
      for (const r of raw) productCards.set(r.productId, toProductCard(r));
    }),
  );
  return new Map(ids.filter((id) => productCards.has(id)).map((id) => [id, productCards.get(id)!]));
}

/** Products Rohlík considers similar (for a sold-out product, say). */
export async function fetchSimilar(productId: number): Promise<number[]> {
  const raw = (await getJson<{ productId: number; similarProducts: number[] }[]>(`/api/v1/products/similar?products=${productId}`)) ?? [];
  return raw.find((r) => r.productId === productId)?.similarProducts ?? [];
}

export const productUrl = (id: number) => `${BASE}/${id}`;
