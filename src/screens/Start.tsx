import { href } from '../lib/router';
import { useStore } from '../lib/store';

const GUIDE = 'https://github.com/petrnetusil/claude-breakfast/blob/master/docs/navod.md';

const STEPS = [
  ['Napište Claudovi', 'V projektu Jídelníček napište nebo nadiktujte, na co máte chuť. Třeba „lehčí večeře, ve středu ryba, ke snídani křupinky“.'],
  ['Claude vybere z Rohlíku', 'Projde recepty na Rohlík Chef, poskládá vyvážený týden a pošle odkaz.'],
  ['Klepněte na odkaz', 'Jídelníček se otevře tady. Jídla můžete měnit, vypínat a přepočítat, a pak z nich udělat nákup.'],
];

export function Start() {
  const hasWeek = useStore().week != null;

  return (
    <div className="screen start">
      <div className="start-hero">
        <img src="./icon.svg" alt="" width="72" height="72" />
        <h1>Jídelníček</h1>
        <p>Týden jídla s Claudem a recepty z Rohlíku.</p>
      </div>

      <ol className="card howto">
        {STEPS.map(([title, text], i) => (
          <li key={title}>
            <span className="step-num">{i + 1}</span>
            <div>
              <strong>{title}</strong>
              <p className="muted">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <a className="btn primary big" href="https://claude.ai/projects" target="_blank" rel="noreferrer">
        Otevřít Clauda
      </a>
      {hasWeek && (
        <a className="btn soft big" href={href('')}>
          Zpět na rozpracovaný týden
        </a>
      )}
      <a className="textlink center" href={GUIDE} target="_blank" rel="noreferrer">
        Jak Clauda poprvé nastavit
      </a>
    </div>
  );
}
