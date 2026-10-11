import { Heart, Icon, LoadError, RecipeImage, Stepper, TimeMeta } from '../components/ui';
import { DAY_NAMES, DAY_ON, DAY_SHORT, dayNumber, longDate, weekLabel } from '../lib/dates';
import { isWeekend, resolveMeal, weekRecipeIds } from '../lib/planner';
import { href, navigate } from '../lib/router';
import { SLOT } from '../lib/slots';
import { actions, useStore } from '../lib/store';
import { useCards } from '../lib/useRohlik';
import type { Meal, RecipeCard, WeekPlan } from '../lib/types';

interface MealProps {
  week: WeekPlan;
  dayIdx: number;
  mealIdx: number;
  meal: Meal;
  order: number;
  cards: Map<number, RecipeCard>;
  loading: boolean;
}

function MealCard({ week, dayIdx, mealIdx, meal, order, cards, loading }: MealProps) {
  const slot = SLOT[meal.slot];
  const ref = resolveMeal(week, dayIdx, meal);
  const locked = week.status === 'approved';
  const swapHref = href(`swap/${dayIdx}/${mealIdx}`);

  if (meal.off || !ref) {
    const why = meal.off ? 'nevaříme' : meal.leftover ? 'není z čeho, večeře den předtím chybí' : 'zatím nevybráno';
    return (
      <div className="meal off">
        <div>
          <strong>{slot.label}</strong> · {why}
        </div>
        {!locked &&
          (meal.off ? (
            <button type="button" className="btn soft" onClick={() => actions.setMealOff(dayIdx, mealIdx, false)}>
              Vrátit
            </button>
          ) : (
            <a className="btn primary" href={swapHref}>
              Vybrat
            </a>
          ))}
      </div>
    );
  }

  const card = ref.kind === 'recipe' ? cards.get(ref.id) : undefined;
  const title = ref.kind === 'text' ? ref.text : card?.title ?? (loading ? 'Načítám z Rohlíku…' : 'Recept se nenašel');
  const recipeHref = ref.kind === 'recipe' ? href(`recipe/${ref.id}/${dayIdx}/${mealIdx}`) : undefined;
  const chip = meal.leftover ? 'Ze včerejší večeře' : ref.kind === 'text' ? 'Bez receptu' : null;

  return (
    // The key changes with the recipe, so a swapped meal rolls in again.
    <article className="meal roll" style={{ animationDelay: `${order * 50}ms` }}>
      <div className="meal-top">
        {recipeHref ? (
          <a href={recipeHref} aria-label={`Otevřít recept: ${title}`}>
            <RecipeImage recipe={card} slot={meal.slot} className={`thumb ${!card && loading ? 'pending' : ''}`} />
          </a>
        ) : (
          <RecipeImage recipe={undefined} slot={meal.slot} className="thumb" />
        )}
        <div className="meal-text">
          <div className="slot-label" style={{ color: slot.ink }}>
            {slot.label}
          </div>
          {recipeHref ? (
            <a className={`meal-title ${card ? '' : 'muted'}`} href={recipeHref}>
              {title}
            </a>
          ) : (
            <span className="meal-title">{title}</span>
          )}
          <TimeMeta minutes={meal.leftover || ref.kind === 'text' ? null : card?.time ?? null}>{chip && <span className="chip">{chip}</span>}</TimeMeta>
        </div>
        {ref.kind === 'recipe' && <Heart recipeId={ref.id} className="corner" />}
      </div>
      {!locked && (
        <div className="meal-actions">
          <a className="btn primary" href={swapHref}>
            <Icon.swap />
            Vyměnit
          </a>
          <button type="button" className="btn soft" onClick={() => actions.setMealOff(dayIdx, mealIdx, true)}>
            Nevaříme
          </button>
          <Stepper value={meal.servings} onChange={(n) => actions.setServings(dayIdx, mealIdx, n)} />
        </div>
      )}
    </article>
  );
}

export function Planner({ dayIdx }: { dayIdx: number }) {
  const week = useStore().week!;
  const day = week.days[dayIdx];
  const locked = week.status === 'approved';
  const { data: cards, loading, error, retry } = useCards(weekRecipeIds(week));

  const cooking = day.off ? [] : day.meals.filter((m) => !m.off && resolveMeal(week, dayIdx, m));
  const minutes = cooking.reduce((sum, m) => {
    const ref = m.leftover ? undefined : resolveMeal(week, dayIdx, m);
    return sum + (ref?.kind === 'recipe' ? cards.get(ref.id)?.time ?? 0 : 0);
  }, 0);

  return (
    <div className="screen with-bottom">
      <header className="home-head">
        <div>
          <p className="eyebrow">Týden {weekLabel(week.id)}</p>
          <h1>Jídelníček</h1>
        </div>
        <div className="home-head-right">
          <span className="saved">
            <Icon.check />
            {locked ? 'Schváleno' : 'Uloženo'}
          </span>
          <a className="btn soft small" href={href('fav')}>
            Oblíbené
          </a>
        </div>
      </header>

      <nav className="strip" aria-label="Dny v týdnu">
        {week.days.map((d, i) => (
          <button
            type="button"
            key={d.date}
            className={`strip-day ${i === dayIdx ? 'sel' : ''} ${d.off ? 'off' : ''}`}
            aria-current={i === dayIdx ? 'date' : undefined}
            aria-label={`${DAY_NAMES[i]} ${longDate(d.date)}`}
            onClick={() => navigate(`d/${i}`, true)}
          >
            <span>{DAY_SHORT[i]}</span>
            <strong>{dayNumber(d.date)}</strong>
          </button>
        ))}
      </nav>

      <div className="day-head">
        <div>
          <h2>
            {DAY_NAMES[dayIdx]} {longDate(day.date)}
          </h2>
          <p className="muted">{day.off ? 'Volný den' : `Jídel: ${cooking.length}${minutes ? ` · vaření celkem ${minutes} min` : ''}`}</p>
        </div>
        {isWeekend(dayIdx) && !locked && (
          <button type="button" className="btn outline" onClick={() => actions.toggleDay(dayIdx)}>
            {day.off ? 'Vrátit den' : 'Tento den nevaříme'}
          </button>
        )}
      </div>

      {error && <LoadError message={error} onRetry={retry} />}

      {day.off ? (
        <div className="empty">
          <strong>{DAY_ON[dayIdx].replace(/^./, (c) => c.toUpperCase())} nevaříme</strong>
          <span>Do nákupu se z tohoto dne nic nepřidá.</span>
        </div>
      ) : day.meals.length === 0 ? (
        <div className="empty">
          <strong>Na tento den není nic naplánováno</strong>
          <span>Napište Claudovi, co si dát, a otevřete nový odkaz.</span>
        </div>
      ) : (
        <div className="cards">
          {day.meals.map((meal, mealIdx) => (
            <MealCard
              key={`${meal.slot}-${meal.recipeId}-${meal.text}-${meal.leftover}`}
              week={week}
              dayIdx={dayIdx}
              mealIdx={mealIdx}
              meal={meal}
              order={mealIdx}
              cards={cards}
              loading={loading}
            />
          ))}
        </div>
      )}

      <footer className="bottom">
        <a className="btn primary big" href={href(locked ? 'shop' : 'week')}>
          {locked ? 'Nákupní seznam' : 'Přehled týdne a schválení'}
        </a>
      </footer>
    </div>
  );
}
