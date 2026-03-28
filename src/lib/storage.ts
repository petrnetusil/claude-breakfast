import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeekPlan } from '@/types';

const WEEK_PLAN_KEY = 'snidane_week_plan';
const CHECKED_ITEMS_KEY = 'snidane_checked_items';

export async function saveWeekPlan(plan: WeekPlan): Promise<void> {
  await AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(plan));
}

export async function loadWeekPlan(): Promise<WeekPlan | null> {
  const data = await AsyncStorage.getItem(WEEK_PLAN_KEY);
  if (!data) return null;
  return JSON.parse(data) as WeekPlan;
}

export async function saveCheckedItems(checked: Record<string, boolean>): Promise<void> {
  await AsyncStorage.setItem(CHECKED_ITEMS_KEY, JSON.stringify(checked));
}

export async function loadCheckedItems(): Promise<Record<string, boolean>> {
  const data = await AsyncStorage.getItem(CHECKED_ITEMS_KEY);
  if (!data) return {};
  return JSON.parse(data) as Record<string, boolean>;
}
