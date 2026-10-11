import { TopBar } from '../components/ui';
import { DAY_NAMES, dayNumber, weekLabel } from '../lib/dates';
import { resolveMeal, weekStats } from '../lib/planner';
import { href, navigate } from '../lib/router';
import { SLOT } from '../lib/slots';
import { actions, useStore } from '../lib/store';

export function Week() {
  const week = useStore().week!;
  const stats = weekStats(week);
  const locked = week.status === 'approved';

  const approve = () => {
    actions.approve();
    navigate('shop');
  };

  return (
    <div className="screen with-bottom">
      <TopBar title="Přehled týdne" sub={weekLabel(week.id)} back="" />

      <section className="balance">
        <div>
          <h2>Vyváženost týdne</h2>
          <p>Hlavní jídla: večeře a víkendové obědy</p>
        </div>
        <div className="balance-grid">
          {stats.tags.map((t) => (
            <div key={t.tag}>
              <strong>{t.count}×</strong>
              <span>{t.label.toLowerCase()}</span>
            </div>
          ))}
        </div>
        <ul>
          {stats.avgWeekdayDinner != null && <li>Večeře ve všední dny: průměrně {stats.avgWeekdayDinner} minut</li>}
          <li>
            Obědy do práce: {stats.lunchLeftover}× z večeře, {stats.lunchFresh}× čerstvý
          </li>
        </ul>
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
            ) : (
              <ul className="dayrows">
                {day.meals.map((meal, i) => {
                  const recipe = meal.off ? undefined : resolveMeal(week, dayIdx, meal);
                  return (
                    <li key={i} className={recipe ? '' : 'dim'}>
                      <span className="slot-label" style={{ color: SLOT[meal.slot].ink }}>
                        {SLOT[meal.slot].label}
                      </span>
                      <span>
                        {recipe ? recipe.title : meal.off ? 'nevaříme' : 'nevybráno'}
                        {recipe && meal.leftover ? ' (z večeře)' : ''}
                        {recipe && <em> · pro {meal.servings}</em>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>

      {!locked && (
        <button
          type="button"
          className="textlink center"
          onClick={() => {
            if (window.confirm('Navrhnout celý týden znovu? Úpravy v tomto jídelníčku se ztratí.')) navigate('start');
          }}
        >
          Navrhnout celý týden znovu
        </button>
      )}

      <footer className="bottom stack">
        {locked ? (
          <>
            <a className="btn primary big" href={href('shop')}>
              Nákupní seznam
            </a>
            <div className="two-links">
              <button type="button" className="textlink" onClick={() => actions.reopen()}>
                Upravit jídelníček
              </button>
              <a className="textlink" href={href('start')}>
                Naplánovat další týden
              </a>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="btn primary big" disabled={stats.meals === 0} onClick={approve}>
              Schválit jídelníček
            </button>
            <p className="muted center">Další krok: nákupní seznam pro Rohlík</p>
          </>
        )}
      </footer>
    </div>
  );
}
