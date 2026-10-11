import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, LoadError, RecipeImage, TimeMeta, TopBar } from '../components/ui';
import { DAY_NAMES, longDate } from '../lib/dates';
import { cleanText } from '../lib/link';
import { isWeekend, resolveMeal, weekRecipeIds } from '../lib/planner';
import { findRecipes } from '../lib/rohlik';
import { backToDay } from '../lib/history';
import { goBack, href } from '../lib/router';
import { SLOT } from '../lib/slots';
import { actions, useStore } from '../lib/store';
import { cachedIds, forgetSwapView, getSwapView, type IdeaFilter, rememberIds, saveSwapView, swapKey } from '../lib/swapMemory';
import { useCards } from '../lib/useRohlik';
import type { RecipeCard, Slot } from '../lib/types';

/** Ideas added each time the end of the list comes into view. */
const PAGE = 6;

function IdeaCard({ recipe, slot, link, onPick }: { recipe: RecipeCard; slot: Slot; link: string; onPick: () => void }) {
  return (
    <article className="idea roll">
      <a href={link} aria-label={`Otevřít recept: ${recipe.title}`}>
        <RecipeImage recipe={recipe} slot={slot} className="thumb tall" />
      </a>
      <div className="meal-text">
        <a className="meal-title" href={link}>
          {recipe.title}
        </a>
        <TimeMeta minutes={recipe.time} />
        {recipe.author && <p className="muted">{recipe.author}</p>}
        <button type="button" className="btn primary pick" onClick={onPick}>
          Vybrat
        </button>
      </div>
    </article>
  );
}

/** Ids from Rohlík for the current filter or search; favourites come from the device. */
function useIdeaIds(slot: Slot, filter: IdeaFilter, query: string, favorites: number[]) {
  const [tick, setTick] = useState(0);
  const key = `${slot}|${filter}|${query}`;
  const [state, setState] = useState<{ key: string; ids: number[]; error: string | null } | null>(() => {
    const ids = cachedIds(key);
    return ids ? { key, ids, error: null } : null;
  });

  useEffect(() => {
    if (filter === 'fav' && !query) return;
    const known = cachedIds(key);
    if (known && tick === 0) {
      setState({ key, ids: known, error: null });
      return;
    }
    let live = true;
    const run = async () => {
      // Up to 300 ids is a short list of numbers; cards for them load as the list scrolls.
      let ids = await findRecipes({ slot, filter: filter === 'fav' ? 'all' : filter, query, size: 300 });
      // Nothing for this meal type: search all of Rohlík Chef.
      if (query && ids.length === 0) ids = await findRecipes({ query, size: 300 });
      return ids;
    };
    // Wait for typing to pause before asking Rohlík.
    const t = window.setTimeout(
      () => {
        run()
          .then((ids) => {
            rememberIds(key, ids);
            if (live) setState({ key, ids, error: null });
          })
          .catch((e: Error) => live && setState({ key, ids: [], error: e.message }));
      },
      query ? 400 : 0,
    );
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [key, tick]);

  if (filter === 'fav' && !query) return { ids: favorites, loading: false, error: null, retry: () => {} };
  const fresh = state?.key === key;
  return { ids: fresh ? state.ids : [], loading: !fresh, error: fresh ? state.error : null, retry: () => setTick((n) => n + 1) };
}

export function Swap({ dayIdx, mealIdx }: { dayIdx: number; mealIdx: number }) {
  const state = useStore();
  const week = state.week!;
  const day = week.days[dayIdx];
  const meal = day.meals[mealIdx];
  const slot = meal.slot;
  const current = resolveMeal(week, dayIdx, meal);

  // Coming back from a recipe: the same list, filter and search as before (lib/scroll restores the position).
  const key = swapKey(dayIdx, mealIdx);
  const [saved] = useState(() => getSwapView(key));
  const [filter, setFilter] = useState<IdeaFilter>(saved?.filter ?? 'all');
  const [query, setQuery] = useState(saved?.query ?? '');
  const [own, setOwn] = useState(saved?.own ?? '');
  const [count, setCount] = useState(saved?.count ?? PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const found = useIdeaIds(slot, filter, query.trim(), state.favorites);
  // Recipes already in the week go last, the current one is left out.
  const ordered = useMemo(() => {
    const inWeek = new Set(weekRecipeIds(week));
    const ids = found.ids.filter((id) => !(current?.kind === 'recipe' && current.id === id));
    return [...ids.filter((id) => !inWeek.has(id)), ...ids.filter((id) => inWeek.has(id))];
  }, [found.ids, week]);
  const shownIds = ordered.slice(0, count);
  // Ask Rohlík for the next cards a little ahead, so scrolling does not wait.
  const cards = useCards(ordered.slice(0, count + PAGE * 2));
  const ideas = shownIds.map((id) => cards.data.get(id)).filter((c): c is RecipeCard => !!c);
  const more = count < ordered.length;
  const currentCards = useCards(current?.kind === 'recipe' ? [current.id] : []);
  const currentTitle = current?.kind === 'text' ? current.text : current ? currentCards.data.get(current.id)?.title : undefined;

  // A new filter or search starts a new list. Compared with the last value, not a "first run" flag,
  // so running the effect twice (React development mode) cannot reset a restored list.
  const selection = `${filter}|${query}`;
  const lastSelection = useRef(selection);
  useEffect(() => {
    if (lastSelection.current === selection) return;
    lastSelection.current = selection;
    setCount(PAGE);
  }, [selection]);

  // Keep the view for the way back from a recipe. Forget it when leaving for anything else.
  useEffect(() => {
    saveSwapView(key, { filter, query, own, count });
  }, [key, filter, query, own, count]);
  useEffect(
    () => () => {
      if (!window.location.hash.startsWith('#/recipe/')) forgetSwapView(key);
    },
    [key],
  );

  // Load more when the end of the list comes near the screen: no button. Only after the cards asked
  // for last time have arrived, otherwise the end stays in view and the list runs away.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more || found.loading || cards.loading) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setCount((c) => c + PAGE), { rootMargin: '0px 0px 600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [more, found.loading, cards.loading, count]);

  const filters: { key: IdeaFilter; label: string }[] = [
    { key: 'all', label: 'Cokoliv' },
    { key: 'fav', label: 'Oblíbené' },
    { key: 'quick', label: 'Rychlé' },
  ];
  if (slot === 've' || slot === 'ob') filters.push({ key: 'bezmasa', label: 'Bez masa' }, { key: 'ryba', label: 'Ryba' });

  /** Leave without a change: one step back, wherever she came from. */
  const done = () => {
    forgetSwapView(key);
    goBack(`d/${dayIdx}`);
  };
  /** A meal was changed: back to its day, past the swap screen and any recipe screen before it. */
  const changed = () => {
    forgetSwapView(key);
    backToDay(dayIdx);
  };
  const pick = (recipeId: number) => {
    actions.setRecipe(dayIdx, mealIdx, recipeId);
    changed();
  };
  const pickOwn = () => {
    const text = cleanText(own);
    if (!text) return;
    actions.setText(dayIdx, mealIdx, text);
    changed();
  };

  // A weekday lunch can also simply be yesterday's dinner.
  const prevDinner = slot === 'ob' && !isWeekend(dayIdx) && !meal.leftover ? resolveMeal(week, dayIdx, { ...meal, leftover: true }) : undefined;
  const waiting = found.loading || (cards.loading && ideas.length < shownIds.length);
  const error = found.error ?? cards.error;

  return (
    <div className="screen with-bottom">
      <TopBar title={`Vyměnit ${SLOT[slot].acc}`} sub={`${DAY_NAMES[dayIdx]} ${longDate(day.date)} · pro ${meal.servings}`} back={`d/${dayIdx}`} />

      {currentTitle && (
        <div className="current" style={{ background: SLOT[slot].tint }}>
          <span className="slot-label" style={{ color: SLOT[slot].ink }}>
            Teď v plánu
          </span>
          <strong>{currentTitle}</strong>
        </div>
      )}

      <label className="search">
        <Icon.search />
        <span className="sr-only">Hledat recept na Rohlíku</span>
        <input id="swap-search" type="search" value={query} placeholder="Hledat recept na Rohlíku" onChange={(e) => setQuery(e.target.value)} />
      </label>

      {!query && (
        <div className="chips" role="group" aria-label="Filtr návrhů">
          {filters.map((f) => (
            <button type="button" key={f.key} className={`chipbtn ${filter === f.key ? 'sel' : ''}`} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {prevDinner && !query && (
        <div className="meal off">
          <div>
            <strong>Zbytek z večeře</strong>
            {prevDinner.kind === 'text' ? ` · ${prevDinner.text}` : ''}
          </div>
          <button
            type="button"
            className="btn soft"
            onClick={() => {
              actions.setLeftover(dayIdx, mealIdx);
              changed();
            }}
          >
            Vybrat
          </button>
        </div>
      )}

      <form
        className="own"
        onSubmit={(e) => {
          e.preventDefault();
          pickOwn();
        }}
      >
        <label htmlFor="own-meal">Něco bez receptu</label>
        <div className="own-row">
          <input id="own-meal" type="text" value={own} maxLength={60} placeholder="Třeba Křupinky s mlékem" onChange={(e) => setOwn(e.target.value)} />
          <button type="submit" className="btn soft" disabled={!cleanText(own)}>
            Dát
          </button>
        </div>
      </form>

      {error && <LoadError message={error} onRetry={() => (found.error ? found.retry() : cards.retry())} />}

      {!waiting && !error && ordered.length === 0 && (
        <div className="empty">
          <strong>{query ? 'Na Rohlíku nic takového není' : filter === 'fav' ? 'Zatím žádné oblíbené' : 'Tomuhle filtru nic neodpovídá'}</strong>
          <span>
            {query
              ? 'Zkuste jiné slovo, třeba „losos“ nebo „dýně“. Nebo to dejte jako jídlo bez receptu.'
              : filter === 'fav'
                ? 'Srdíčkem u jídla si ho uložíte a příště ho najdete tady.'
                : 'Zkuste jiný filtr nebo hledání.'}
          </span>
        </div>
      )}

      {/* Only new cards roll in. The key resets the list on a filter or search change. */}
      <div className="cards" key={`${filter}|${query}`}>
        {ideas.map((recipe) => (
          <IdeaCard
            key={recipe.id}
            recipe={recipe}
            slot={slot}
            link={href(`recipe/${recipe.id}/${dayIdx}/${mealIdx}/vybrat`)}
            onPick={() => pick(recipe.id)}
          />
        ))}
      </div>
      <div ref={sentinel} aria-hidden="true" />
      {waiting && <p className="muted center loading-line">Hledám na Rohlíku…</p>}
      {!waiting && !more && ideas.length > 0 && <p className="muted center loading-line">To jsou všechny recepty pro tento výběr.</p>}

      <footer className="bottom">
        <button type="button" className="btn soft big" onClick={done}>
          Nechat, jak je
        </button>
      </footer>
    </div>
  );
}
