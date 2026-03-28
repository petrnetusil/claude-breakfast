import { useState, useEffect, useMemo, useCallback } from 'react';
import { WeekPlan, ShoppingItem } from '@/types';
import { saveCheckedItems, loadCheckedItems } from '@/lib/storage';

export function useShoppingList(plan: WeekPlan | null) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCheckedItems().then(setCheckedItems);
  }, []);

  const items: ShoppingItem[] = useMemo(() => {
    if (!plan) return [];

    const aggregated = new Map<string, ShoppingItem>();

    for (const day of plan.days) {
      if (!day.selectedId) continue;
      const breakfast = day.options.find((b) => b.id === day.selectedId);
      if (!breakfast) continue;

      for (const ing of breakfast.ingredients) {
        const key = ing.rohlikQuery || ing.name;
        const existing = aggregated.get(key);
        if (existing) {
          // Combine amounts as text
          existing.amount = `${existing.amount}, ${ing.amount}`;
          existing.forBreakfast = `${existing.forBreakfast}, ${breakfast.name}`;
        } else {
          aggregated.set(key, {
            ...ing,
            forBreakfast: breakfast.name,
            checked: checkedItems[key] || false,
          });
        }
      }
    }

    return Array.from(aggregated.values());
  }, [plan, checkedItems]);

  const toggleItem = useCallback(
    (key: string) => {
      setCheckedItems((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        saveCheckedItems(updated);
        return updated;
      });
    },
    [],
  );

  const hasSelections = plan ? plan.days.some((d) => d.selectedId !== null) : false;

  return { items, toggleItem, hasSelections };
}
