import { Heart, Icon, RecipeImage, Stepper, TimeMeta } from '../components/ui';
import { DAY_NAMES, DAY_ON, DAY_SHORT, dayNumber, longDate, weekLabel } from '../lib/dates';
import { isWeekend, resolveMeal } from '../lib/planner';
import { href, navigate } from '../lib/router';
import { SLOT, TAG_LABEL } from '../lib/slots';
import { actions, useStore } from '../lib/store';
import type { Meal, WeekPlan } from '../lib/types';

function MealCard({ week, dayIdx, mealIdx, meal, order }: { week: WeekPlan; dayIdx: number; mealIdx: number; meal: Meal; order: number }) {
  const slot = SLOT[meal.slot];
  const recipe = resolveMeal(week, dayIdx, meal);
  const locked = week.status === 'approved';
  const swapHref = href(`swap/${dayIdx}/${mealIdx}`);

  if (meal.off) {
    return (
      <div className="meal off">
        <div>
          <strong>{slot.label}</strong> · nevaříme
        </div>
        {!locked && (
          <button type="button" className="btn soft" onClick={() => actions.setMealOff(dayIdx, mealIdx, false)}>
            Vrátit
          </button>
        )}
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="meal off">
        <div>
          <strong>{slot.label}</strong> · {meal.leftover ? 'není z čeho, večeře den předtím chybí' : 'zatím nevybráno'}
        </div>
        {!locked && (
          <a className="btn primary" href={swapHref}>
            Vybrat
          </a>
        )}
      </div>
    );
  }

  const recipeHref = href(`recipe/${recipe.id}/${dayIdx}/${mealIdx}`);
  return (
    // The key changes with the recipe, so a swapped meal rolls in again.
    <article className="meal roll" key={recipe.id} style={{ animationDelay: `${order * 50}ms` }}>
      <div className="meal-top">
        <a href={recipeHref} aria-label={`Otevřít recept: ${recipe.title}`}>
          <RecipeImage recipe={recipe} slot={meal.slot} className="thumb" />
        </a>
        <div className="meal-text">
          <div className="slot-label" style={{ color: slot.ink }}>
            {slot.label}
          </div>
          <a className="meal-title" href={recipeHref}>
            {recipe.title}
          </a>
          <TimeMeta minutes={meal.leftover ? null : recipe.time}>
            {meal.leftover ? <span className="chip">Ze včerejší večeře</span> : recipe.tag && <span className="chip">{TAG_LABEL[recipe.tag]}</span>}
          </TimeMeta>
        </div>
        <Heart recipeId={recipe.id} className="corner" />
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

  const cooking = day.off ? [] : day.meals.filter((m) => !m.off && resolveMeal(week, dayIdx, m));
  const minutes = cooking.reduce((sum, m) => sum + (m.leftover ? 0 : resolveMeal(week, dayIdx, m)!.time), 0);

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
          <p className="muted">{day.off ? 'Volný den' : `Jídel: ${cooking.length} · vaření celkem ${minutes} min`}</p>
        </div>
        {isWeekend(dayIdx) && !locked && (
          <button type="button" className="btn outline" onClick={() => actions.toggleDay(dayIdx)}>
            {day.off ? 'Vrátit den' : 'Tento den nevaříme'}
          </button>
        )}
      </div>

      {day.off ? (
        <div className="empty">
          <strong>{DAY_ON[dayIdx].replace(/^./, (c) => c.toUpperCase())} nevaříme</strong>
          <span>Do nákupu se z tohoto dne nic nepřidá.</span>
        </div>
      ) : (
        <div className="cards">
          {day.meals.map((meal, mealIdx) => (
            <MealCard key={`${meal.slot}-${meal.recipeId}-${meal.leftover}`} week={week} dayIdx={dayIdx} mealIdx={mealIdx} meal={meal} order={mealIdx} />
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
