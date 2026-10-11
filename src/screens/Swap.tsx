import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, LoadError, RecipeImage, TimeMeta, TopBar } from '../components/ui';
import { DAY_NAMES, longDate } from '../lib/dates';
import { cleanText } from '../lib/link';
import { isWeekend, resolveMeal, suggest, weekRecipeIds } from '../lib/planner';
import { findRecipes, type SwapFilter } from '../lib/rohlik';
import { goBack, href } from '../lib/router';
import { SLOT } from '../lib/slots';
import { actions, useStore } from '../lib/store';
import { useCards } from '../lib/useRohlik';
import type { RecipeCard, Slot } from '../lib/types';

type Filter = SwapFilter | 'fav';

function IdeaCard({ recipe, slot, onPick }: { recipe: RecipeCard; slot: Slot; onPick: () => void }) {
  const recipeHref = href(`recipe/${recipe.id}`);
  return (
    <article className="idea roll">
      <a href={recipeHref} aria-label={`Otevřít recept: ${recipe.title}`}>
        <RecipeImage recipe={recipe} slot={slot} className="thumb tall" />
      </a>
      <div className="meal-text">
        <a className="meal-title" href={recipeHref}>
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
function useIdeaIds(slot: Slot, filter: Filter, query: string, favorites: number[]) {
  const [state, setState] = useState<{ key: string; ids: number[]; error: string | null }>({ key: '', ids: [], error: null });
  const [tick, setTick] = useState(0);
  const key = `${slot}|${filter}|${query}|${tick}`;

  useEffect(() => {
    if (filter === 'fav' && !query) return;
    let live = true;
    const run = async () => {
      let ids = await findRecipes({ slot, filter: filter === 'fav' ? 'all' : filter, query });
      // Nothing for this meal type: search all of Rohlík Chef.
      if (query && ids.length === 0) ids = await findRecipes({ query });
      return ids;
    };
    // Wait for typing to pause before asking Rohlík.
    const t = window.setTimeout(() => {
      run()
        .then((ids) => live && setState({ key, ids, error: null }))
        .catch((e: Error) => live && setState({ key, ids: [], error: e.message }));
    }, query ? 400 : 0);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [key]);

  if (filter === 'fav' && !query) return { ids: favorites, loading: false, error: null, retry: () => {} };
  const fresh = state.key === key;
  return { ids: fresh ? state.ids : [], loading: !fresh, error: fresh ? state.error : null, retry: () => setTick((n) => n + 1) };
}

export function Swap({ dayIdx, mealIdx }: { dayIdx: number; mealIdx: number }) {
  const state = useStore();
  const week = state.week!;
  const day = week.days[dayIdx];
  const meal = day.meals[mealIdx];
  const slot = meal.slot;
  const current = resolveMeal(week, dayIdx, meal);

  const [filter, setFilter] = useState<Filter>('all');
  const [round, setRound] = useState(0);
  const [query, setQuery] = useState('');
  const [own, setOwn] = useState('');
  const cardsRef = useRef<HTMLDivElement>(null);

  const found = useIdeaIds(slot, filter, query.trim(), state.favorites);
  // Recipes already in the week go last, the current one is left out.
  const inWeek = new Set(weekRecipeIds(week));
  const ordered = useMemo(() => {
    const ids = found.ids.filter((id) => !(current?.kind === 'recipe' && current.id === id));
    return [...ids.filter((id) => !inWeek.has(id)), ...ids.filter((id) => inWeek.has(id))];
  }, [found.ids, week]);
  const shownIds = suggest(ordered, round);
  // Ask Rohlík for the next cards a little ahead, so "Další tři nápady" is instant.
  const cards = useCards(ordered.slice(0, (round + 3) * 3));
  const ideas = shownIds.map((id) => cards.data.get(id)).filter((c): c is RecipeCard => !!c);
  const left = ordered.length - shownIds.length;
  const currentCards = useCards(current?.kind === 'recipe' ? [current.id] : []);
  const currentTitle = current?.kind === 'text' ? current.text : current ? currentCards.data.get(current.id)?.title : undefined;

  useEffect(() => {
    setRound(0);
  }, [filter, query]);

  // Bring the first of the newly added ideas into view.
  useEffect(() => {
    if (round === 0) return;
    const fresh = cardsRef.current?.children[round * 3] as HTMLElement | undefined;
    fresh?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [round]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Cokoliv' },
    { key: 'fav', label: 'Oblíbené' },
    { key: 'quick', label: 'Rychlé' },
  ];
  if (slot === 've' || slot === 'ob') filters.push({ key: 'bezmasa', label: 'Bez masa' }, { key: 'ryba', label: 'Ryba' });

  const done = () => goBack(`d/${dayIdx}`);
  const pick = (recipeId: number) => {
    actions.setRecipe(dayIdx, mealIdx, recipeId);
    done();
  };
  const pickOwn = () => {
    const text = cleanText(own);
    if (!text) return;
    actions.setText(dayIdx, mealIdx, text);
    done();
  };

  // A weekday lunch can also simply be yesterday's dinner.
  const prevDinner = slot === 'ob' && !isWeekend(dayIdx) && !meal.leftover ? resolveMeal(week, dayIdx, { ...meal, leftover: true }) : undefined;
  const loading = found.loading || (cards.loading && ideas.length < shownIds.length);
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
              done();
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

      {!loading && !error && ordered.length === 0 && (
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

      {/* New ideas are added below; only the new cards roll in. The key resets on a filter or search change. */}
      <div className="cards" key={`${filter}|${query}`} ref={cardsRef}>
        {ideas.map((recipe) => (
          <IdeaCard key={recipe.id} recipe={recipe} slot={slot} onPick={() => pick(recipe.id)} />
        ))}
        {loading && <p className="muted center loading-line">Hledám na Rohlíku…</p>}
      </div>

      <footer className="bottom two">
        <button type="button" className="btn outline big grow" disabled={loading || left <= 0} onClick={() => setRound(round + 1)}>
          <Icon.refresh />
          {left <= 0 ? 'Víc nápadů nemáme' : left < 3 ? `Poslední ${left === 1 ? 'nápad' : 'dva nápady'}` : 'Další tři nápady'}
        </button>
        <button type="button" className="btn soft big" onClick={done}>
          Nechat
        </button>
      </footer>
    </div>
  );
}
