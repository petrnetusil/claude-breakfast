import { startOfWeek, addDays, formatISO } from 'date-fns';
import { Breakfast, DayPlan, WeekPlan } from '@/types';
import { breakfasts } from '@/data/breakfasts';
import { isWeekendOrHoliday, isWeekend } from '@/data/holidays';

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickOptions(
  pool: Breakfast[],
  count: number,
  usedIds: Set<string>,
): Breakfast[] {
  // Prefer breakfasts not yet used this week, but allow reuse if needed
  const unused = pool.filter((b) => !usedIds.has(b.id));
  const shuffled = shuffle(unused.length >= count ? unused : pool);

  // Ensure roughly 50/50 healthy/indulgent mix
  const healthy = shuffled.filter((b) => b.isHealthy);
  const indulgent = shuffled.filter((b) => !b.isHealthy);
  const halfCount = Math.ceil(count / 2);

  const picked: Breakfast[] = [
    ...healthy.slice(0, halfCount),
    ...indulgent.slice(0, halfCount),
  ];

  // Fill remaining if we don't have enough of one kind
  if (picked.length < count) {
    const pickedIds = new Set(picked.map((b) => b.id));
    const remaining = shuffled.filter((b) => !pickedIds.has(b.id));
    picked.push(...remaining.slice(0, count - picked.length));
  }

  return shuffle(picked.slice(0, count));
}

export function generateWeekPlan(referenceDate?: Date): WeekPlan {
  const now = referenceDate || new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const usedIds = new Set<string>();

  const quickPool = breakfasts.filter((b) => b.category === 'quick');
  const elaboratePool = breakfasts.filter((b) => b.category === 'elaborate');

  const days: DayPlan[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const isFreeDay = isWeekendOrHoliday(date);
    const optionCount = isFreeDay ? 10 : 8;

    let options: Breakfast[];
    if (isFreeDay) {
      // Weekend/holiday: mostly elaborate, some quick
      const elaborate = pickOptions(elaboratePool, Math.ceil(optionCount * 0.7), usedIds);
      const quick = pickOptions(quickPool, optionCount - elaborate.length, usedIds);
      options = shuffle([...elaborate, ...quick]).slice(0, optionCount);
    } else {
      // Workday: only quick
      options = pickOptions(quickPool, optionCount, usedIds);
    }

    options.forEach((b) => usedIds.add(b.id));

    days.push({
      date: formatISO(date, { representation: 'date' }),
      dayOfWeek: date.getDay(),
      isWeekend: isWeekend(date),
      isHoliday: !isWeekend(date) && isWeekendOrHoliday(date),
      options,
      selectedId: null,
    });
  }

  return {
    weekStartDate: formatISO(monday, { representation: 'date' }),
    days,
    createdAt: new Date().toISOString(),
  };
}
