import { useMemo, useState } from 'react';
import { Icon, RecipeImage, TimeMeta, TopBar } from '../components/ui';
import { DAY_NAMES, longDate } from '../lib/dates';
import { candidates, isWeekend, resolveMeal, searchRecipes, suggest, type Filter } from '../lib/planner';
import { goBack, href } from '../lib/router';
import { quickLimit, SLOT, TAG_LABEL } from '../lib/slots';
import { actions, useStore } from '../lib/store';
import type { Recipe, Slot } from '../lib/types';

function IdeaCard({ recipe, slot, reason, onPick }: { recipe: Recipe; slot: Slot; reason: string; onPick: () => void }) {
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
        <TimeMeta minutes={recipe.time}>{recipe.tag && <span className="chip">{TAG_LABEL[recipe.tag]}</span>}</TimeMeta>
        <p className="muted">{reason}</p>
        <button type="button" className="btn primary pick" onClick={onPick}>
          Vybrat
        </button>
      </div>
    </article>
  );
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

  const prefs = { favorites: state.favorites, cooked: state.cooked };
  const all = useMemo(() => candidates(week, dayIdx, slot, filter, prefs), [week, dayIdx, slot, filter, state.favorites, state.cooked]);
  const ideas = suggest(all, round);
  const found = useMemo(() => searchRecipes(query, slot), [query, slot]);
  const searching = query.trim().length > 0;

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Cokoliv' },
    { key: 'fav', label: 'Oblíbené' },
    { key: 'quick', label: `Do ${quickLimit(slot)} min` },
  ];
  if (slot === 've' || slot === 'ob') {
    filters.push({ key: 'bezmasa', label: 'Bez masa' }, { key: 'ryba', label: 'Ryba' });
  }

  const pick = (recipeId: number) => {
    actions.setRecipe(dayIdx, mealIdx, recipeId);
    goBack(`d/${dayIdx}`);
  };

  // A weekday lunch can also simply be yesterday's dinner.
  const prevDinner = slot === 'ob' && !isWeekend(dayIdx) && !meal.leftover ? resolveMeal(week, dayIdx, { ...meal, leftover: true }) : undefined;

  return (
    <div className="screen with-bottom">
      <TopBar title={`Vyměnit ${SLOT[slot].acc}`} sub={`${DAY_NAMES[dayIdx]} ${longDate(day.date)} · pro ${meal.servings}`} back={`d/${dayIdx}`} />

      {current && (
        <div className="current" style={{ background: SLOT[slot].tint }}>
          <span className="slot-label" style={{ color: SLOT[slot].ink }}>
            Teď v plánu
          </span>
          <strong>{current.title}</strong>
        </div>
      )}

      <label className="search">
        <Icon.search />
        <span className="sr-only">Hledat jídlo nebo surovinu</span>
        <input type="search" value={query} placeholder="Hledat jídlo nebo surovinu" onChange={(e) => setQuery(e.target.value)} />
      </label>

      {searching ? (
        <>
          <p className="muted list-note">
            {found.length ? `Nalezeno: ${found.length}` : 'Nic takového v receptech není. Zkuste jiné slovo, třeba „losos“ nebo „těstoviny“.'}
          </p>
          <div className="cards">
            {found.map((recipe) => (
              <IdeaCard
                key={recipe.id}
                recipe={recipe}
                slot={slot}
                reason={recipe.slots.includes(slot) ? SLOT[recipe.slots[0]].label : `Běžně jako ${SLOT[recipe.slots[0]].label.toLowerCase()}`}
                onPick={() => pick(recipe.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="chips" role="group" aria-label="Filtr návrhů">
            {filters.map((f) => (
              <button
                type="button"
                key={f.key}
                className={`chipbtn ${filter === f.key ? 'sel' : ''}`}
                aria-pressed={filter === f.key}
                onClick={() => {
                  setFilter(f.key);
                  setRound(0);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {prevDinner && (
            <div className="meal off">
              <div>
                <strong>Zbytek z večeře</strong> · {prevDinner.title}
              </div>
              <button
                type="button"
                className="btn soft"
                onClick={() => {
                  actions.setLeftover(dayIdx, mealIdx);
                  goBack(`d/${dayIdx}`);
                }}
              >
                Vybrat
              </button>
            </div>
          )}

          {ideas.length === 0 && (
            <div className="empty">
              <strong>{filter === 'fav' ? 'Zatím žádné oblíbené' : 'Tomuhle filtru nic neodpovídá'}</strong>
              <span>{filter === 'fav' ? 'Srdíčkem u jídla si ho uložíte a příště ho najdete tady.' : 'Zkuste jiný filtr nebo hledání.'}</span>
            </div>
          )}
          {/* The key changes with the round so the three cards roll in again. */}
          <div className="cards" key={`${filter}-${round}`}>
            {ideas.map(({ recipe, reason }) => (
              <IdeaCard key={recipe.id} recipe={recipe} slot={slot} reason={reason} onPick={() => pick(recipe.id)} />
            ))}
          </div>
        </>
      )}

      <footer className="bottom two">
        <button type="button" className="btn outline big grow" disabled={searching || all.length <= 3} onClick={() => setRound(round + 1)}>
          <Icon.refresh />
          Další tři nápady
        </button>
        <button type="button" className="btn soft big" onClick={() => goBack(`d/${dayIdx}`)}>
          Nechat
        </button>
      </footer>
    </div>
  );
}
