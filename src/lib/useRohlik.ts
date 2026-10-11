import { useEffect, useMemo, useState } from 'react';
import { cachedCard, fetchCards, fetchDetail } from './rohlik';
import type { RecipeCard, RecipeDetail } from './types';

export interface Loaded<T> {
  data: T;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const message = (e: unknown) => (e instanceof Error ? e.message : 'Něco se nepovedlo.');

/** Cards for these ids, fetched live. Already loaded cards show at once. */
export function useCards(ids: number[]): Loaded<Map<number, RecipeCard>> {
  const key = [...new Set(ids)].sort((a, b) => a - b).join(',');
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ key: string; cards: Map<number, RecipeCard>; error: string | null; done: boolean }>({
    key: '',
    cards: new Map(),
    error: null,
    done: false,
  });

  useEffect(() => {
    const list = key ? key.split(',').map(Number) : [];
    let live = true;
    fetchCards(list)
      .then((cards) => live && setState({ key, cards, error: null, done: true }))
      .catch((e) => live && setState({ key, cards: new Map(), error: message(e), done: true }));
    return () => {
      live = false;
    };
  }, [key, tick]);

  // Until this key's request finishes, show what the session already has.
  const data = useMemo(() => {
    if (state.key === key && state.done) return state.cards;
    const m = new Map<number, RecipeCard>();
    for (const id of key ? key.split(',').map(Number) : []) {
      const c = cachedCard(id);
      if (c) m.set(id, c);
    }
    return m;
  }, [key, state]);

  const fresh = state.key === key && state.done;
  return { data, loading: !fresh, error: fresh ? state.error : null, retry: () => setTick((t) => t + 1) };
}

/** Full recipes (ingredients, steps) for these ids, fetched live in parallel. */
export function useDetails(ids: number[]): Loaded<Map<number, RecipeDetail>> & { failed: number[] } {
  const key = [...new Set(ids)].sort((a, b) => a - b).join(',');
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ key: string; data: Map<number, RecipeDetail>; failed: number[]; error: string | null; done: boolean }>({
    key: '',
    data: new Map(),
    failed: [],
    error: null,
    done: false,
  });

  useEffect(() => {
    const list = key ? key.split(',').map(Number) : [];
    let live = true;
    setState({ key, data: new Map(), failed: [], error: null, done: false });
    Promise.allSettled(list.map((id) => fetchDetail(id))).then((results) => {
      if (!live) return;
      const data = new Map<number, RecipeDetail>();
      const failed: number[] = [];
      let error: string | null = null;
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') data.set(list[i], r.value);
        else {
          failed.push(list[i]);
          error = message(r.reason);
        }
      });
      setState({ key, data, failed, error, done: true });
    });
    return () => {
      live = false;
    };
  }, [key, tick]);

  const fresh = state.key === key && state.done;
  return {
    data: fresh ? state.data : new Map(),
    failed: fresh ? state.failed : [],
    loading: !fresh,
    error: fresh ? state.error : null,
    retry: () => setTick((t) => t + 1),
  };
}

export function useDetail(id: number): Loaded<RecipeDetail | undefined> {
  const d = useDetails([id]);
  return { data: d.data.get(id), loading: d.loading, error: d.error, retry: d.retry };
}
