import { useState, useEffect, useCallback } from 'react';
import { WeekPlan } from '@/types';
import { generateWeekPlan } from '@/lib/planGenerator';
import { saveWeekPlan, loadWeekPlan } from '@/lib/storage';
import { startOfWeek, formatISO } from 'date-fns';

export function useWeekPlan() {
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await loadWeekPlan();
      const currentMonday = formatISO(startOfWeek(new Date(), { weekStartsOn: 1 }), {
        representation: 'date',
      });

      if (saved && saved.weekStartDate === currentMonday) {
        setPlan(saved);
      } else {
        const newPlan = generateWeekPlan();
        await saveWeekPlan(newPlan);
        setPlan(newPlan);
      }
      setLoading(false);
    })();
  }, []);

  const selectBreakfast = useCallback(
    async (dayIndex: number, breakfastId: string) => {
      setPlan((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          days: prev.days.map((day, i) =>
            i === dayIndex ? { ...day, selectedId: breakfastId } : day,
          ),
        };
        saveWeekPlan(updated);
        return updated;
      });
    },
    [],
  );

  const regenerate = useCallback(async () => {
    setLoading(true);
    const newPlan = generateWeekPlan();
    await saveWeekPlan(newPlan);
    setPlan(newPlan);
    setLoading(false);
  }, []);

  const confirmedCount = plan
    ? plan.days.filter((d) => d.selectedId !== null).length
    : 0;

  return { plan, loading, selectBreakfast, regenerate, confirmedCount };
}
