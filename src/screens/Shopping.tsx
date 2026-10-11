import { useMemo, useState } from 'react';
import { Icon, TopBar } from '../components/ui';
import { weekLabel } from '../lib/dates';
import { buildShopping, CATEGORY_LABEL, CATEGORY_ORDER, formatAmount, isTicked, shoppingText } from '../lib/shopping';
import { actions, useStore } from '../lib/store';

const searchUrl = (name: string) => `https://www.rohlik.cz/hledat/${encodeURIComponent(name)}`;

export function Shopping() {
  const week = useStore().week!;
  const items = useMemo(() => buildShopping(week), [week.days]);
  const [copied, setCopied] = useState(false);
  const ticked = items.filter((i) => isTicked(week, i));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shoppingText(week, items));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.alert('Seznam se nepodařilo zkopírovat. Prohlížeč to v tuto chvíli nedovolil.');
    }
  };

  return (
    <div className="screen with-bottom">
      <TopBar title="Nákupní seznam" sub={`${weekLabel(week.id)} · vybráno ${ticked.length} z ${items.length}`} back="week" />

      {week.status !== 'approved' && (
        <div className="notice">Jídelníček ještě není schválený. Seznam se s každou změnou přepočítá.</div>
      )}

      {items.length === 0 && (
        <div className="empty">
          <strong>Není co nakupovat</strong>
          <span>V jídelníčku teď není žádné jídlo.</span>
        </div>
      )}

      {CATEGORY_ORDER.map((category) => {
        const group = items.filter((i) => i.category === category);
        if (!group.length) return null;
        return (
          <section className="card shop" key={category}>
            <h2>{CATEGORY_LABEL[category]}</h2>
            <ul>
              {group.map((item) => {
                const on = isTicked(week, item);
                return (
                  <li key={item.key} className={on ? '' : 'dim'}>
                    <label>
                      <input type="checkbox" checked={on} onChange={(e) => actions.tick(item.key, e.target.checked)} />
                      <span className="box" aria-hidden="true">
                        {on && <Icon.check />}
                      </span>
                      <span className="shop-text">
                        <span className="shop-name">{item.name}</span>
                        <span className="muted">{item.recipes.join(', ')}</span>
                      </span>
                    </label>
                    <span className="shop-right">
                      <strong>{formatAmount(item.amount, item.unit)}</strong>
                      <a href={searchUrl(item.name)} target="_blank" rel="noreferrer">
                        Rohlík
                      </a>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <div className="notice">
        Vložení do košíku na Rohlíku jedním klepnutím přijde v dalším kroku. Zatím jde seznam zkopírovat, nebo si u položky otevřít hledání na Rohlíku.
      </div>

      <footer className="bottom">
        <button type="button" className="btn primary big" disabled={ticked.length === 0} onClick={copy}>
          {copied ? 'Zkopírováno' : `Zkopírovat seznam (${ticked.length})`}
        </button>
      </footer>
    </div>
  );
}
