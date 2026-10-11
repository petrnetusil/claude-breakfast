import { useMemo } from 'react';
import { activeMeals } from './planner';
import { chooseProduct, type Need, type ProductChoice, type ProductLine, productLines } from './products';
import { buildShopping, type ShopList } from './shopping';
import type { ProductCard, WeekPlan } from './types';
import { useDetails, useProductCards, useSelections } from './useRohlik';

export interface ItemProduct {
  line: ProductLine;
  choice: ProductChoice;
  card: ProductCard | undefined;
  /** All list amounts for this ingredient ("5 g" and "12 lžic" of the same oil). */
  needs: Need[];
}

/** Everything the shopping list needs, loaded live: ingredients, Rohlík's products, their cards. */
export function useShopping(week: WeekPlan, productChoices: Record<number, number>) {
  const ids = [...new Set(activeMeals(week).flatMap((x) => (x.ref.kind === 'recipe' ? [x.ref.id] : [])))];
  const details = useDetails(ids);
  const selections = useSelections(ids);
  const list: ShopList = useMemo(() => buildShopping(week, details.data), [week.days, details.data]);
  const lines = useMemo(() => productLines(week, selections.data, details.data), [week.days, selections.data, details.data]);

  // Cards for the product each line would take; for a line whose pick is sold out, also its alternatives.
  const lineFor = (ingredientIds: number[]) => ingredientIds.map((id) => lines.get(id)).find(Boolean);
  const wantedFor = (cards: Map<number, ProductCard>) => {
    const wanted = new Set<number>();
    for (const item of list.items) {
      const line = lineFor(item.ingredientIds);
      if (!line) continue;
      const preferred = productChoices[line.ingredientId];
      const top = preferred ?? line.options[0]?.productId;
      if (top != null) wanted.add(top);
      if (top != null && cards.get(top)?.available === false) line.options.forEach((o) => wanted.add(o.productId));
    }
    return [...wanted];
  };
  const first = useProductCards(wantedFor(new Map()));
  const cards = useProductCards(wantedFor(first.data));

  // One product per ingredient: on the first list line of that ingredient, with the needs of all its lines.
  const products = new Map<string, ItemProduct>();
  /** Lines whose ingredient already has its product on an earlier line: line key -> that line's name. */
  const sharedWith = new Map<string, string>();
  const firstLine = new Map<number, string>();
  for (const item of list.items) {
    const line = lineFor(item.ingredientIds);
    if (!line) continue;
    const owner = firstLine.get(line.ingredientId);
    if (owner) {
      sharedWith.set(item.key, list.items.find((i) => i.key === owner)!.name);
      continue;
    }
    firstLine.set(line.ingredientId, item.key);
    const needs = list.items.filter((i) => lineFor(i.ingredientIds) === line).map((i) => ({ amount: i.amount, unit: i.unit }));
    const choice = chooseProduct(line, cards.data, productChoices[line.ingredientId], needs);
    if (choice) products.set(item.key, { line, choice, card: cards.data.get(choice.productId), needs });
  }

  return {
    ids,
    list,
    lines,
    products,
    sharedWith,
    loading: details.loading,
    productsLoading: selections.loading || cards.loading,
    error: details.error ?? selections.error ?? cards.error,
    failed: details.failed,
    retry: () => {
      details.retry();
      selections.retry();
      cards.retry();
    },
  };
}
