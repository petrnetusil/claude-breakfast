import { useMemo, useState } from 'react';
import { copyText, Icon, LoadError, TopBar } from '../components/ui';
import { weekLabel } from '../lib/dates';
import { activeMeals } from '../lib/planner';
import { buildShopping, CATEGORY_LABEL, CATEGORY_ORDER, formatAmount, isTicked, shoppingText } from '../lib/shopping';
import { actions, useStore } from '../lib/store';
import { useDetails } from '../lib/useRohlik';

const searchUrl = (name: string) => `https://www.rohlik.cz/hledat/${encodeURIComponent(name)}`;

const CART_ASK =
  'Dej mi prosím do košíku na Rohlíku nákup na tento týden. Ke každé položce najdi vhodný produkt a balení, ' +
  'u základních surovin se zeptej, jestli je máme doma. Než něco vložíš, ukaž mi seznam produktů s cenami ke schválení.';

export function Shopping() {
  const week = useStore().week!;
  const ids = [...new Set(activeMeals(week).flatMap((x) => (x.ref.kind === 'recipe' ? [x.ref.id] : [])))];
  const details = useDetails(ids);
  const list = useMemo(() => buildShopping(week, details.data), [week.days, details.data]);
  const [copied, setCopied] = useState<'list' | 'cart' | 'fail' | null>(null);
  const ticked = list.items.filter((i) => isTicked(week, i));
  const count = ticked.length + list.simple.length;

  const copy = async (what: 'list' | 'cart') => {
    const text = shoppingText(week, list);
    const ok = await copyText(what === 'cart' ? `${CART_ASK}\n\n${text}` : text);
    setCopied(ok ? what : 'fail');
  };

  return (
    <div className="screen with-bottom">
      <TopBar title="Nákupní seznam" sub={`${weekLabel(week.id)} · vybráno ${count} z ${list.items.length + list.simple.length}`} back="week" />

      {week.status !== 'approved' && <div className="notice">Jídelníček ještě není schválený. Seznam se s každou změnou přepočítá.</div>}
      {details.loading && ids.length > 0 && <p className="muted center loading-line">Načítám suroviny z Rohlíku ({ids.length} receptů)…</p>}
      {details.error && (
        <LoadError message={`${details.failed.length} z ${ids.length} receptů se nenačetlo. ${details.error}`} onRetry={details.retry} />
      )}

      {!details.loading && list.items.length === 0 && list.simple.length === 0 && (
        <div className="empty">
          <strong>Není co nakupovat</strong>
          <span>V jídelníčku teď není žádné jídlo.</span>
        </div>
      )}

      {list.simple.length > 0 && (
        <section className="card shop">
          <h2>Jídla bez receptu</h2>
          <ul>
            {list.simple.map((s) => (
              <li key={s.text}>
                <span className="shop-text">
                  <span className="shop-name">{s.text}</span>
                  <span className="muted">
                    v jídelníčku {s.days}× · Claude najde produkt
                  </span>
                </span>
                <span className="shop-right">
                  <a href={searchUrl(s.text)} target="_blank" rel="noreferrer">
                    Rohlík
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {CATEGORY_ORDER.map((category) => {
        const group = list.items.filter((i) => i.category === category);
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
        Do košíku: zkopírujte seznam pro Clauda a vložte ho do chatu. Claude najde produkty na Rohlíku a před vložením do košíku vám je ukáže ke schválení.
      </div>
      {copied === 'fail' && <p className="note center">Prohlížeč kopírování nedovolil. Zkuste to znovu.</p>}

      <footer className="bottom two">
        <button type="button" className="btn primary big grow" disabled={count === 0 || details.loading} onClick={() => copy('cart')}>
          {copied === 'cart' ? 'Zkopírováno, vložte Claudovi' : 'Do košíku přes Clauda'}
        </button>
        <button type="button" className="btn soft big" disabled={count === 0 || details.loading} onClick={() => copy('list')}>
          {copied === 'list' ? 'Hotovo' : 'Kopírovat'}
        </button>
      </footer>
    </div>
  );
}
