/*
 * Scroll position per history entry. Going back (or forward) to a screen returns to where it was
 * left; a new screen starts at the top. Each history entry gets a key in history.state; positions
 * are kept in memory and in sessionStorage, so they survive a visit to rohlik.cz and back.
 * Only numbers are stored here, no Rohlík data.
 */

const STORE = 'jidelnicek-scroll';
const positions = new Map<string, number>(readStored());
let current: string | null = null;
let counter = 0;
let cancelRestore: (() => void) | null = null;

function readStored(): [string, number][] {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? '[]') as [string, number][];
  } catch {
    return [];
  }
}

function persist(): void {
  try {
    // The last 50 entries are plenty for one session.
    sessionStorage.setItem(STORE, JSON.stringify([...positions].slice(-50)));
  } catch {
    // Storage blocked: positions still work while the page is open.
  }
}

function entryKey(): { key: string; revisit: boolean } {
  const state = window.history.state as { k?: string } | null;
  if (state?.k) return { key: state.k, revisit: positions.has(state.k) };
  const key = `${Date.now().toString(36)}-${counter++}`;
  window.history.replaceState({ ...(state ?? {}), k: key }, '');
  return { key, revisit: false };
}

/** Scrolls to `y` once the page is tall enough (cards and photos may still be loading). Gives up after 3 s or when she scrolls herself. */
function restore(y: number): void {
  let frame = 0;
  const started = performance.now();
  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('wheel', stop);
    cancelRestore = null;
  };
  const step = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max >= y - 2 || performance.now() - started > 3000) {
      window.scrollTo(0, Math.min(y, Math.max(0, max)));
      stop();
      return;
    }
    frame = requestAnimationFrame(step);
  };
  window.addEventListener('touchstart', stop, { passive: true, once: true });
  window.addEventListener('wheel', stop, { passive: true, once: true });
  cancelRestore = stop;
  step();
}

/** Call once at start, before the first render. The app then calls onRouteChange for every screen, the first one included. */
export function initScrollMemory(): void {
  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  window.addEventListener('scroll', () => current && positions.set(current, window.scrollY), { passive: true });
  // The old screen is about to be replaced: stop recording until the new one is set up, so the
  // jump caused by the shorter new page is not saved as the old screen's position.
  window.addEventListener('hashchange', () => {
    current = null;
    cancelRestore?.();
  });
  window.addEventListener('pagehide', persist);
}

/** Call after every route change: back/forward returns to the saved position, anything new starts at the top. */
export function onRouteChange(): void {
  const { key, revisit } = entryKey();
  current = key;
  if (revisit) restore(positions.get(key)!);
  else {
    window.scrollTo(0, 0);
    positions.set(key, 0);
  }
  persist();
}
