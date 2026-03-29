import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WeekPlan } from '@/types';
import { generateWeekPlan } from '@/lib/planGenerator';
import { saveWeekPlan, loadWeekPlan } from '@/lib/storage';
import { startOfWeek, formatISO } from 'date-fns';
import { breakfasts } from '@/data/breakfasts';

interface WeekPlanContextValue {
  plan: WeekPlan | null;
  loading: boolean;
  confirmedCount: number;
  selectBreakfast: (dayIndex: number, breakfastId: string) => void;
  regenerate: () => void;
  generateMoreOptions: (dayIndex: number) => void;
}

const WeekPlanContext = createContext<WeekPlanContextValue | null>(null);

export function WeekPlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const planRef = useRef<WeekPlan | null>(null);

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  useEffect(() => {
    (async () => {
      try {
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
      } catch {
        const newPlan = generateWeekPlan();
        setPlan(newPlan);
      }
      setLoading(false);
    })();
  }, []);

  const selectBreakfast = useCallback((dayIndex: number, breakfastId: string) => {
    const current = planRef.current;
    if (!current) return;

    const updated: WeekPlan = {
      ...current,
      days: current.days.map((day, i) =>
        i === dayIndex ? { ...day, selectedId: breakfastId } : day,
      ),
    };
    setPlan(updated);
    planRef.current = updated;
    saveWeekPlan(updated);
  }, []);

  const regenerate = useCallback(() => {
    setLoading(true);
    const newPlan = generateWeekPlan();
    setPlan(newPlan);
    planRef.current = newPlan;
    saveWeekPlan(newPlan).finally(() => setLoading(false));
  }, []);

  const generateMoreOptions = useCallback((dayIndex: number) => {
    const current = planRef.current;
    if (!current) return;

    const day = current.days[dayIndex];
    const existingIds = new Set(day.options.map((b) => b.id));
    const isFreeDay = day.isWeekend || day.isHoliday;

    // Get breakfasts not already in this day's options
    const pool = breakfasts.filter((b) => {
      if (existingIds.has(b.id)) return false;
      if (!isFreeDay) return b.category === 'quick';
      return true;
    });

    // Shuffle and pick up to 8 more
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const newOptions = shuffled.slice(0, Math.min(8, shuffled.length));

    if (newOptions.length === 0) return;

    const updated: WeekPlan = {
      ...current,
      days: current.days.map((d, i) =>
        i === dayIndex
          ? { ...d, options: [...d.options, ...newOptions] }
          : d,
      ),
    };
    setPlan(updated);
    planRef.current = updated;
    saveWeekPlan(updated);
  }, []);

  const confirmedCount = plan
    ? plan.days.filter((d) => d.selectedId !== null).length
    : 0;

  return (
    <WeekPlanContext.Provider
      value={{ plan, loading, confirmedCount, selectBreakfast, regenerate, generateMoreOptions }}
    >
      {children}
    </WeekPlanContext.Provider>
  );
}

export function useWeekPlan(): WeekPlanContextValue {
  const ctx = useContext(WeekPlanContext);
  if (!ctx) throw new Error('useWeekPlan must be used within WeekPlanProvider');
  return ctx;
}
