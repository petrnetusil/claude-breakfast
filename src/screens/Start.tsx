import { useState } from 'react';
import { Stepper } from '../components/ui';
import { nextMonday, weekLabel } from '../lib/dates';
import { navigate } from '../lib/router';
import { actions, useStore } from '../lib/store';
import type { Household } from '../lib/types';

const ROWS: { key: keyof Household; label: string; hint: string }[] = [
  { key: 'sn', label: 'Snídaně', hint: 'celá rodina' },
  { key: 'sv', label: 'Svačina', hint: 'děti do školy' },
  { key: 'ob', label: 'Oběd ve všední dny', hint: 'do práce' },
  { key: 've', label: 'Večeře a víkend', hint: 'celá rodina' },
];

export function Start() {
  const state = useStore();
  const [household, setHousehold] = useState<Household>(state.household);
  const replacing = state.week != null;

  const start = () => {
    actions.startWeek(household);
    navigate('', true);
  };

  return (
    <div className="screen start">
      <div className="start-hero">
        <img src="./icon.svg" alt="" width="72" height="72" />
        <h1>Jídelníček</h1>
        <p>Navrhnu vyvážený týden. Co se vám nelíbí, vyměníte jedním klepnutím.</p>
      </div>

      <section className="card">
        <h2>Pro kolik lidí vaříme</h2>
        <p className="muted">Výchozí počty. U každého jídla je pak můžete změnit.</p>
        {ROWS.map((row) => (
          <div className="row" key={row.key}>
            <div>
              <div className="row-title">{row.label}</div>
              <div className="muted">{row.hint}</div>
            </div>
            <Stepper value={household[row.key]} onChange={(n) => setHousehold({ ...household, [row.key]: n })} />
          </div>
        ))}
      </section>

      <button type="button" className="btn primary big" onClick={start}>
        Navrhnout týden {weekLabel(nextMonday())}
      </button>
      {replacing && <p className="muted center">Rozpracovaný jídelníček se tím přepíše.</p>}
    </div>
  );
}
