import { useEffect, useState } from 'react';
import { LoadError, ProductImage, TopBar } from '../components/ui';
import { formatPrice, packsFor, unitPrice } from '../lib/products';
import { fetchSimilar, productUrl } from '../lib/rohlik';
import { goBack } from '../lib/router';
import { formatAmount } from '../lib/shopping';
import { actions, useStore } from '../lib/store';
import { useProductCards } from '../lib/useRohlik';
import { useShopping } from '../lib/useShopping';
import type { ProductCard } from '../lib/types';

function ProductOption({ card, packs, current, onPick }: { card: ProductCard; packs: number; current: boolean; onPick: () => void }) {
  return (
    <article className={`idea product-option roll ${current ? 'current-pick' : ''}`}>
      <a href={productUrl(card.id)} target="_blank" rel="noreferrer" aria-label={`${card.name} na Rohlíku`}>
        <ProductImage image={card.image} className="thumb tall" />
      </a>
      <div className="meal-text">
        <span className="meal-title">{card.name}</span>
        <span className="muted">
          {card.amountText} · {formatPrice(unitPrice(card))}
          {card.salePrice != null && <span className="sale"> sleva z {formatPrice(card.price)}</span>}
        </span>
        <span className="muted">
          Potřeba {packs}× · celkem {formatPrice(unitPrice(card) * packs)}
        </span>
        {current ? (
          <span className="badge">Vybráno</span>
        ) : card.available ? (
          <button type="button" className="btn primary pick" onClick={onPick}>
            Vybrat
          </button>
        ) : (
          <span className="badge bad">Vyprodáno</span>
        )}
      </div>
    </article>
  );
}

/** Other products for one ingredient: Rohlík's alternatives plus products similar to the current one. */
export function ProductSwap({ ingredientId }: { ingredientId: number }) {
  const { week: maybeWeek, productChoices } = useStore();
  const week = maybeWeek!;
  const shop = useShopping(week, productChoices);
  const line = shop.lines.get(ingredientId);
  const item = shop.list.items.find((i) => i.ingredientIds.includes(ingredientId));
  const product = shop.list.items.map((i) => shop.products.get(i.key)).find((x) => x?.line.ingredientId === ingredientId);
  const choice = product?.choice;

  const [similar, setSimilar] = useState<number[]>([]);
  useEffect(() => {
    if (!choice) return;
    let live = true;
    fetchSimilar(choice.productId)
      .then((ids) => live && setSimilar(ids))
      .catch(() => live && setSimilar([]));
    return () => {
      live = false;
    };
  }, [choice?.productId]);

  // Rohlík's alternatives with their pack counts, then similar products with the pick's pack count.
  // Packs for each product from the week's need and that product's pack size.
  const fallbackOf = new Map<number, number>((line?.options ?? []).map((o) => [o.productId, o.packs]));
  const packsFor_ = (card: ProductCard) => packsFor(product?.needs ?? [], card.amountText, fallbackOf.get(card.id) ?? line?.options[0]?.packs ?? 1, card.name);
  const ids = [...new Set([...(choice ? [choice.productId] : []), ...(line?.options.map((o) => o.productId) ?? []), ...similar])];
  const cards = useProductCards(ids);
  const options = ids.map((id) => cards.data.get(id)).filter((c): c is ProductCard => !!c);

  const pick = (productId: number) => {
    actions.chooseProduct(ingredientId, productId);
    goBack('shop');
  };

  const need = item ? (item.amount == null ? item.name : `${item.name} – ${formatAmount(item.amount, item.unit)}`) : line?.title ?? '';

  return (
    <div className="screen">
      <TopBar title="Vyměnit produkt" sub={need} back="shop" />
      <p className="muted">Vybraný produkt se použije i příště, když bude v jídelníčku stejná surovina.</p>
      {(shop.error || cards.error) && <LoadError message={(shop.error ?? cards.error)!} onRetry={() => (shop.error ? shop.retry() : cards.retry())} />}
      {!line && !shop.productsLoading && !shop.error && (
        <div className="empty">
          <strong>Pro tuto surovinu Rohlík produkty nenabízí</strong>
          <span>Claude vybere vhodný produkt při plnění košíku.</span>
        </div>
      )}
      <div className="cards">
        {options.map((card) => (
          <ProductOption
            key={card.id}
            card={card}
            packs={packsFor_(card)}
            current={card.id === choice?.productId}
            onPick={() => pick(card.id)}
          />
        ))}
        {(shop.productsLoading || cards.loading) && <p className="muted center loading-line">Načítám produkty z Rohlíku…</p>}
      </div>
    </div>
  );
}
