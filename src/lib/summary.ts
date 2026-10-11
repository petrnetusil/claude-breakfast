import { DAY_NAMES, weekLabel } from './dates';
import { weekLink } from './link';
import { resolveMeal } from './planner';
import { SLOT } from './slots';
import type { Household, Meal, RecipeCard, WeekPlan } from './types';

/** Readable name of a meal for lists and for messages to Claude. */
export function mealTitle(week: WeekPlan, dayIdx: number, meal: Meal, cards: Map<number, RecipeCard>): string | null {
  if (meal.off) return null;
  const ref = resolveMeal(week, dayIdx, meal);
  if (!ref) return null;
  const name = ref.kind === 'text' ? ref.text : cards.get(ref.id)?.title ?? `recept ${ref.id}`;
  return meal.leftover ? `${name} (z večeře)` : name;
}

/** The message she pastes into the Claude chat: the link plus the week in words. */
export function messageForClaude(week: WeekPlan, household: Household, cards: Map<number, RecipeCard>, ask: string): string {
  const lines = week.days.map((day, dayIdx) => {
    if (day.off) return `${DAY_NAMES[dayIdx]}: nevaříme`;
    const meals = day.meals
      .map((m) => {
        const t = mealTitle(week, dayIdx, m, cards);
        return `${SLOT[m.slot].label.toLowerCase()} ${t ?? 'nevaříme'}${t ? ` (pro ${m.servings})` : ''}`;
      })
      .join(', ');
    return `${DAY_NAMES[dayIdx]}: ${meals || 'nic'}`;
  });
  return [`${ask}`, '', `Jídelníček ${weekLabel(week.id)}:`, ...lines, '', weekLink(week, household)].join('\n');
}
