import { useState } from 'react';
import { copyText, Icon, LoadError, ProductImage, TopBar } from '../components/ui';
import { weekLabel } from '../lib/dates';
import { formatPrice, unitPrice } from '../lib/products';
import { href } from '../lib/router';
import { CATEGORY_LABEL, CATEGORY_ORDER, formatAmount, isTicked, type PickedProduct, type ShopItem, shoppingText } from '../lib/shopping';
import { actions, useStore } from '../lib/store';
import { type ItemProduct, useShopping } from '../lib/useShopping';

const searchUrl = (name: string) => `https://www.rohlik.cz/hledat/${encodeURIComponent(name)}`;

const CART_ASK =
  'Dej mi prosím do košíku na Rohlíku nákup na tento týden. U položek s číslem produktu vlož přesně ten produkt ' +
  'v uvedeném počtu, to je můj výběr. U položek bez čísla vyber můj obvyklý produkt (z mých obvyklých nákupů ' +
  'a oblíbených). Než něco vložíš, ukaž mi seznam produktů s cenami ke schválení.';

function ProductRow({ item, product, loading, on }: { item: ShopItem; product: ItemProduct | undefined; loading: boolean; on: boolean }) {
  if (!product) return null;
  const { card, choice, line } = product;
  return (
    <div className={`product ${on ? '' : 'dim'}`}>
      <ProductImage image={card?.image} pending={!card && loading} className="product-thumb" />
      <div className="product-text">
        <span className="product-name">{card?.name ?? (loading ? 'Načítám produkt…' : 'Produkt se nenačetl')}</span>
        {card && (
          <span className="muted">
            {choice.packs}× {card.amountText} · {formatPrice(unitPrice(card) * choice.packs)}
            {card.salePrice != null && <span className="sale"> sleva</span>}
          </span>
        )}
        {choice.soldOut ? (
          <span className="badge bad">Vyprodáno, vyberte jiný</span>
        ) : choice.replaced ? (
          <span className="badge warn">Původní vyprodáno, náhrada</span>
        ) : choice.own ? (
          <span className="badge">Vaše volba</span>
        ) : null}
      </div>
      <a className="btn soft small" href={href(`produkt/${line.ingredientId}`)} aria-label={`Vyměnit produkt pro ${item.name}`}>
        Vyměnit
      </a>
    </div>
  );
}

export function Shopping() {
  const { week: maybeWeek, productChoices } = useStore();
  const week = maybeWeek!;
  const shop = useShopping(week, productChoices);
  const { list, products } = shop;
  const [copied, setCopied] = useState<'list' | 'cart' | 'fail' | null>(null);
  const ticked = list.items.filter((i) => isTicked(week, i));
  const count = ticked.length + list.simple.length;

  // The chosen products of the ticked lines: for the price estimate and for Claude.
  const picked = new Map<string, PickedProduct>();
  let total = 0;
  for (const item of ticked) {
    const p = products.get(item.key);
    if (!p?.card || p.choice.soldOut) continue;
    picked.set(item.key, { productId: p.choice.productId, name: p.card.name, packs: p.choice.packs });
    total += unitPrice(p.card) * p.choice.packs;
  }

  const copy = async (what: 'list' | 'cart') => {
    const text = shoppingText(week, list, what === 'cart' ? picked : undefined);
    const ok = await copyText(what === 'cart' ? `${CART_ASK}\n\n${text}` : text);
    setCopied(ok ? what : 'fail');
  };

  return (
    <div className="screen with-bottom">
      <TopBar title="Nákupní seznam" sub={`${weekLabel(week.id)} · vybráno ${count} z ${list.items.length + list.simple.length}`} back="week" />

      {week.status !== 'approved' && <div className="notice">Jídelníček ještě není schválený. Seznam se s každou změnou přepočítá.</div>}
      {shop.loading && shop.ids.length > 0 && <p className="muted center loading-line">Načítám suroviny z Rohlíku ({shop.ids.length} receptů)…</p>}
      {shop.error && <LoadError message={shop.failed.length ? `${shop.failed.length} z ${shop.ids.length} receptů se nenačetlo. ${shop.error}` : shop.error} onRetry={shop.retry} />}

      {!shop.loading && list.items.length === 0 && list.simple.length === 0 && (
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
                <div className="shop-row">
                  <span className="shop-text">
                    <span className="shop-name">{s.text}</span>
                    <span className="muted">v jídelníčku {s.days}× · Claude vybere váš obvyklý produkt</span>
                  </span>
                  <span className="shop-right">
                    <a href={searchUrl(s.text)} target="_blank" rel="noreferrer">
                      Rohlík
                    </a>
                  </span>
                </div>
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
                const product = products.get(item.key);
                return (
                  <li key={item.key} className={on ? '' : 'dim'}>
                    <div className="shop-row">
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
                        {!product && !shop.sharedWith.has(item.key) && (
                          <a href={searchUrl(item.name)} target="_blank" rel="noreferrer">
                            Rohlík
                          </a>
                        )}
                      </span>
                    </div>
                    <ProductRow item={item} product={product} loading={shop.productsLoading} on={on} />
                    {shop.sharedWith.has(item.key) && <p className="muted product-shared">Produkt je u položky „{shop.sharedWith.get(item.key)}“.</p>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {total > 0 && (
        <div className="notice total">
          <span>Odhad za vybrané produkty</span>
          <strong>{formatPrice(total)}</strong>
        </div>
      )}
      <div className="notice">
        Do košíku: zkopírujte seznam pro Clauda a vložte ho do chatu. Produkty, které tu vidíte, vloží přesně; u ostatních vybere vaše obvyklé. Před vložením vám je ukáže ke schválení.
      </div>
      {copied === 'fail' && <p className="note center">Prohlížeč kopírování nedovolil. Zkuste to znovu.</p>}

      <footer className="bottom two">
        <button type="button" className="btn primary big grow" disabled={count === 0 || shop.loading} onClick={() => copy('cart')}>
          {copied === 'cart' ? 'Zkopírováno, vložte Claudovi' : 'Do košíku přes Clauda'}
        </button>
        <button type="button" className="btn soft big" disabled={count === 0 || shop.loading} onClick={() => copy('list')}>
          {copied === 'list' ? 'Hotovo' : 'Kopírovat'}
        </button>
      </footer>
    </div>
  );
}
