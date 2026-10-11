import { useSyncExternalStore } from 'react';

/** Tiny hash router: "#/week" -> ["week"], "#/swap/2/3" -> ["swap", "2", "3"]. */
function read(): string {
  return window.location.hash.replace(/^#\/?/, '');
}

function subscribe(listener: () => void): () => void {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

export function useRoute(): string[] {
  const path = useSyncExternalStore(subscribe, read);
  return path ? path.split('/') : [];
}

let replaced = false;
/** True once after a navigate(…, true): the new screen took the place of the old entry. */
export function takeReplaced(): boolean {
  const r = replaced;
  replaced = false;
  return r;
}

export function navigate(path: string, replace = false): void {
  const url = `#/${path}`;
  if (replace) {
    replaced = true;
    window.location.replace(url);
  } else window.location.hash = url;
}

export function goBack(fallback: string): void {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback, true);
}

export const href = (path: string) => `#/${path}`;
