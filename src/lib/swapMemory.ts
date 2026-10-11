import type { SwapFilter } from './rohlik';

/*
 * What the swap screen looked like, so that opening a candidate recipe and coming back keeps the
 * list, filter, search and scroll position. In memory only: gone when the page is closed.
 */

export type IdeaFilter = SwapFilter | 'fav';

export interface SwapView {
  filter: IdeaFilter;
  query: string;
  own: string;
  /** How many ideas were shown. */
  count: number;
  scrollY: number;
}

const views = new Map<string, SwapView>();

export const swapKey = (dayIdx: number, mealIdx: number) => `${dayIdx}/${mealIdx}`;
export const getSwapView = (key: string) => views.get(key);
export const saveSwapView = (key: string, view: SwapView) => views.set(key, view);
export const forgetSwapView = (key: string) => views.delete(key);

/** Recipe ids per Rohlík query, so coming back does not ask Rohlík again. In memory only. */
const idLists = new Map<string, number[]>();
export const cachedIds = (key: string) => idLists.get(key);
export const rememberIds = (key: string, ids: number[]) => idLists.set(key, ids);
