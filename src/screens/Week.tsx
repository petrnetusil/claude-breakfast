import { useState } from 'react';
import { copyText, LoadError, TopBar } from '../components/ui';
import { DAY_NAMES, dayNumber, weekLabel } from '../lib/dates';
import { activeMeals, weekRecipeIds } from '../lib/planner';
import { href, navigate } from '../lib/router';
import { SLOT } from '../lib/slots';
import { actions, useStore } from '../lib/store';
import { mealTitle, messageForClaude } from '../lib/summary';
import { useCards } from '../lib/useRohlik';

export function Week() {
  const { week: maybeWeek, household } = useStore();
  const week = maybeWeek!;
  const { data: cards, loading, error, retry } = useCards(weekRecipeIds(week));
  const locked = week.status === 'approved';
  const meals = activeMeals(week).length;
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);

  const sendToClaude = async () => {
    const ok = await copyText(messageForClaude(week, household, cards, 'Tady je můj upravený jídelníček. Pracuj prosím s touto verzí.'));
    setCopied(ok ? 'ok' : 'fail');
  };

  const approve = () => {
    actions.approve();
    navigate('shop');
  };

  return (
    <div className="screen with-bottom">
      <TopBar title="Přehled týdne" sub={`${weekLabel(week.id)} · jídel ${meals}`} back="" />

      {error && <LoadError message={error} onRetry={retry} />}

      <section className="card claude-card">
        <h2>Změny přes Clauda</h2>
        <p className="muted">
          Zkopírujte jídelníček i se svými úpravami, vložte ho do chatu s Claudem a napište, co chcete změnit.
        </p>
        <button type="button" className="btn outline" onClick={sendToClaude}>
          {copied === 'ok' ? 'Zkopírováno, vložte do chatu' : 'Zkopírovat pro Clauda'}
        </button>
        {copied === 'fail' && <p className="note">Prohlížeč kopírování nedovolil. Zkuste to znovu.</p>}
      </section>

      <div className="cards">
        {week.days.map((day, dayIdx) => (
          <section className="card daycard" key={day.date}>
            <div className="card-head">
              <h2>
                {DAY_NAMES[dayIdx]} {dayNumber(day.date)}.
              </h2>
              <a className="textlink" href={href(`d/${dayIdx}`)}>
                {locked ? 'Zobrazit' : 'Upravit'}
              </a>
            </div>
            {day.off ? (
              <p className="muted">Nevaříme</p>
            ) : day.meals.length === 0 ? (
              <p className="muted">Nic naplánováno</p>
            ) : (
              <ul className="dayrows">
                {day.meals.map((meal, i) => {
                  const title = mealTitle(week, dayIdx, meal, cards);
                  const waiting = meal.recipeId != null && !cards.has(meal.recipeId) && loading;
                  return (
                    <li key={i} className={title ? '' : 'dim'}>
                      <span className="slot-label" style={{ color: SLOT[meal.slot].ink }}>
                        {SLOT[meal.slot].label}
                      </span>
                      <span>
                        {waiting ? 'Načítám…' : title ?? (meal.off ? 'nevaříme' : 'nevybráno')}
                        {title && <em> · pro {meal.servings}</em>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>

      <footer className="bottom stack">
        {locked ? (
          <>
            <a className="btn primary big" href={href('shop')}>
              Nákupní seznam
            </a>
            <button type="button" className="textlink center" onClick={() => actions.reopen()}>
              Upravit jídelníček
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn primary big" disabled={meals === 0} onClick={approve}>
              Schválit jídelníček
            </button>
            <p className="muted center">Další krok: nákupní seznam pro Rohlík</p>
          </>
        )}
      </footer>
    </div>
  );
}
