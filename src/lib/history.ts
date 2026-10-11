import { navigate, takeReplaced } from './router';

/*
 * Identity of each browser history entry: a key and its position in the history. Lets the app
 * remember a scroll position per entry (lib/scroll) and jump back several steps to a given screen,
 * e.g. to the day after changing a meal, past the swap and recipe screens.
 * Kept in history.state; the list of routes also in sessionStorage (route strings only).
 */

const STORE = 'jidelnicek-routes';
const routes = new Map<number, string>(readStored());
let lastIndex = -1;
let counter = 0;

function readStored(): [number, string][] {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? '[]') as [number, string][];
  } catch {
    return [];
  }
}

function persist(): void {
  try {
    sessionStorage.setItem(STORE, JSON.stringify([...routes].slice(-50)));
  } catch {
    // Storage blocked: jumping back still works while the page is open.
  }
}

interface EntryState {
  k?: string;
  i?: number;
}

/** The current entry. A new entry gets a key and the next position (or the same position after a replace). */
export interface Entry {
  key: string;
  index: number;
  isNew: boolean;
}

export function currentEntry(): Entry {
  const state = window.history.state as EntryState | null;
  if (state?.k && typeof state.i === 'number') {
    lastIndex = state.i;
    return { key: state.k, index: state.i, isNew: false };
  }
  const index = takeReplaced() ? Math.max(0, lastIndex) : lastIndex + 1;
  const key = `${Date.now().toString(36)}-${counter++}`;
  window.history.replaceState({ ...(state ?? {}), k: key, i: index }, '');
  lastIndex = index;
  return { key, index, isNew: true };
}

/** Records which screen an entry shows. Call after every route change. */
export function recordRoute(entry: Entry, route: string): void {
  routes.set(entry.index, route);
  // A new entry drops everything that was "forward" of it from the browser's history.
  if (entry.isNew) for (const i of [...routes.keys()]) if (i > entry.index) routes.delete(i);
  persist();
}

/**
 * Goes back to the nearest earlier entry whose route passes `test`, skipping the screens in between.
 * When there is none (e.g. the app was opened on this screen), replaces the current entry with `fallback`.
 */
export function backTo(test: (route: string) => boolean, fallback: string): void {
  const { index } = currentEntry();
  for (let i = index - 1; i >= 0; i--) {
    const route = routes.get(i);
    if (route === undefined) break;
    if (test(route)) {
      window.history.go(i - index);
      return;
    }
  }
  navigate(fallback, true);
}

/** Back to the given day of the plan. */
export const backToDay = (dayIdx: number) => backTo((r) => r === `d/${dayIdx}` || (dayIdx === 0 && r === ''), `d/${dayIdx}`);
