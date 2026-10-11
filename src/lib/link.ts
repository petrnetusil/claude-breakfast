import { addDays, fromIso, nextMonday, toIso } from './dates';
import type { Day, Household, Meal, Slot, WeekPlan } from './types';

/*
 * A week travels as a link, so Claude can write it in a chat and the app can send it back:
 *
 *   ?t=2026-10-12&lid=4,2,1,4&po=sn22143,sv681,ob24458,ve20074*6&ut=sn:Křupinky_s_mlékem,ob=,ve-&so=-
 *
 *   t      Monday of the week (YYYY-MM-DD)
 *   lid    default portions: snídaně, svačina, oběd ve všední dny, večeře and the rest
 *   po…ne  one parameter per day: meals separated by commas, "-" = the whole day off
 *
 * A meal is a slot (sn sv po ob ve de) followed by:
 *   22143        Rohlík recipe id
 *   :Text_jídla  a meal without a recipe, "_" stands for a space
 *   =            yesterday's dinner (lunch from leftovers)
 *   -            nevaříme
 * and an optional "*N" for the number of portions.
 */

export const DAY_KEYS = ['po', 'ut', 'st', 'ct', 'pa', 'so', 'ne'] as const;
export const SLOT_ORDER: Slot[] = ['sn', 'sv', 'po', 'ob', 've', 'de'];
export const DEFAULT_HOUSEHOLD: Household = { sn: 4, sv: 2, ob: 1, ve: 4 };

const isWeekendIdx = (dayIdx: number) => dayIdx >= 5;

export function defaultServings(h: Household, slot: Slot, dayIdx: number): number {
  if (slot === 'sn' || slot === 'sv') return h[slot];
  if (slot === 'ob' && !isWeekendIdx(dayIdx)) return h.ob;
  return h.ve;
}

const clampServings = (n: number) => Math.max(1, Math.min(12, Math.round(n)));

/** Removes characters that would break the link format. */
export const cleanText = (text: string) => text.replace(/[,&#*=]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

function parseMeal(token: string, dayIdx: number, h: Household): Meal | null {
  const m = /^(sn|sv|po|ob|ve|de)\s*(.*)$/i.exec(token.trim());
  if (!m) return null;
  const slot = m[1].toLowerCase() as Slot;
  let body = m[2].trim();
  let servings = defaultServings(h, slot, dayIdx);
  const star = /\*\s*(\d+)\s*$/.exec(body);
  if (star) {
    servings = clampServings(Number(star[1]));
    body = body.slice(0, star.index).trim();
  }
  const meal: Meal = { slot, recipeId: null, text: null, servings, off: false, leftover: false };
  if (body === '-') return { ...meal, off: true };
  if (body === '=') return { ...meal, leftover: true };
  if (/^\d+$/.test(body)) return { ...meal, recipeId: Number(body) };
  if (body.startsWith(':')) {
    const text = cleanText(body.slice(1).replace(/_/g, ' '));
    return text ? { ...meal, text } : null;
  }
  return null;
}

function parseHousehold(value: string | null): Household {
  const n = (value ?? '').split(',').map((x) => Number(x.trim()));
  const pick = (i: number, fallback: number) => (Number.isFinite(n[i]) && n[i] > 0 ? clampServings(n[i]) : fallback);
  const d = DEFAULT_HOUSEHOLD;
  return { sn: pick(0, d.sn), sv: pick(1, d.sv), ob: pick(2, d.ob), ve: pick(3, d.ve) };
}

/** Monday of the week that contains `iso`; falls back to next Monday for anything unreadable. */
function mondayOf(iso: string | null): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return nextMonday();
  const d = fromIso(iso);
  if (Number.isNaN(d.getTime())) return nextMonday();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toIso(d);
}

/** Reads a week from a link's query string. Returns null when the link carries no week. */
export function parseWeekLink(search: string): { week: WeekPlan; household: Household } | null {
  const params = new URLSearchParams(search);
  if (!DAY_KEYS.some((k) => params.has(k))) return null;
  const household = parseHousehold(params.get('lid'));
  const monday = mondayOf(params.get('t'));

  const days: Day[] = DAY_KEYS.map((key, dayIdx) => {
    const raw = (params.get(key) ?? '').trim();
    const date = addDays(monday, dayIdx);
    if (raw === '-') return { date, off: true, meals: [] };
    const bySlot = new Map<Slot, Meal>();
    for (const token of raw.split(/[,;]/)) {
      const meal = parseMeal(token, dayIdx, household);
      // A slot named twice: the last one wins.
      if (meal) bySlot.set(meal.slot, meal);
    }
    const meals = SLOT_ORDER.filter((s) => bySlot.has(s)).map((s) => bySlot.get(s)!);
    return { date, off: false, meals };
  });

  return { week: { id: monday, days, status: 'draft', shop: {} }, household };
}

function mealToken(meal: Meal, dayIdx: number, h: Household): string {
  let body: string;
  if (meal.off) return `${meal.slot}-`;
  if (meal.leftover) body = '=';
  else if (meal.recipeId != null) body = String(meal.recipeId);
  else if (meal.text) body = `:${cleanText(meal.text).replace(/ /g, '_')}`;
  else return '';
  const star = meal.servings !== defaultServings(h, meal.slot, dayIdx) ? `*${meal.servings}` : '';
  return `${meal.slot}${body}${star}`;
}

/** The query string for a week, e.g. "?t=2026-10-12&lid=4,2,1,4&po=…". Readable, not percent-encoded. */
export function weekQuery(week: WeekPlan, h: Household): string {
  const parts = [`t=${week.id}`, `lid=${h.sn},${h.sv},${h.ob},${h.ve}`];
  week.days.forEach((day, dayIdx) => {
    const value = day.off ? '-' : day.meals.map((m) => mealToken(m, dayIdx, h)).filter(Boolean).join(',');
    parts.push(`${DAY_KEYS[dayIdx]}=${value}`);
  });
  return `?${parts.join('&')}`;
}

/** Full link to the app with the week in it. */
export function weekLink(week: WeekPlan, h: Household, base = `${window.location.origin}${window.location.pathname}`): string {
  return `${base}${weekQuery(week, h)}`;
}
