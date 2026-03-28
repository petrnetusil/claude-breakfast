import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useWeekPlan } from '@/hooks/useWeekPlan';
import BreakfastCard from '@/components/BreakfastCard';
import { getCzechDayName, formatCzechDate } from '@/data/holidays';
import { colors, spacing } from '@/theme';
import { Breakfast } from '@/types';

export default function DayDetailScreen() {
  const { dayIndex } = useLocalSearchParams<{ dayIndex: string }>();
  const index = parseInt(dayIndex || '0', 10);
  const { plan, selectBreakfast } = useWeekPlan();
  const router = useRouter();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selected, setSelected] = useState(false);

  if (!plan) return null;

  const day = plan.days[index];
  if (!day) return null;

  const date = new Date(day.date + 'T00:00:00');
  const options = day.options;

  // Put currently selected option first if revisiting
  const orderedOptions = day.selectedId
    ? [
        ...options.filter((b) => b.id === day.selectedId),
        ...options.filter((b) => b.id !== day.selectedId),
      ]
    : options;

  const handleSelect = async (breakfast: Breakfast) => {
    await selectBreakfast(index, breakfast.id);
    setSelected(true);
    setTimeout(() => router.back(), 600);
  };

  if (selected) {
    return (
      <SafeAreaView style={styles.confirmationContainer}>
        <Text style={styles.confirmationEmoji}>✅</Text>
        <Text style={styles.confirmationText}>Vybráno!</Text>
      </SafeAreaView>
    );
  }

  const currentBreakfast = orderedOptions[currentCardIndex];
  const isLast = currentCardIndex >= orderedOptions.length - 1;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Zpět</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.dayTitle}>
              {getCzechDayName(date)} {formatCzechDate(date)}
            </Text>
            <Text style={styles.counter}>
              {currentCardIndex + 1}/{orderedOptions.length}
            </Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {day.isWeekend && (
          <Text style={styles.freeLabel}>Víkend — čas na pořádnou snídani!</Text>
        )}
        {day.isHoliday && (
          <Text style={styles.freeLabel}>Svátek — dopřej si něco lepšího!</Text>
        )}

        {currentBreakfast && (
          <View style={styles.cardContainer}>
            {day.selectedId === currentBreakfast.id && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Aktuální výběr</Text>
              </View>
            )}
            <BreakfastCard breakfast={currentBreakfast} showIngredients />
          </View>
        )}

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => {
              if (!isLast) setCurrentCardIndex((i) => i + 1);
            }}
            style={[styles.actionButton, styles.skipButton, isLast && styles.disabledButton]}
            disabled={isLast}
          >
            <Text style={[styles.skipText, isLast && styles.disabledText]}>← Další</Text>
          </Pressable>
          <Pressable
            onPress={() => currentBreakfast && handleSelect(currentBreakfast)}
            style={[styles.actionButton, styles.selectButton]}
          >
            <Text style={styles.selectText}>Tohle chci! →</Text>
          </Pressable>
        </View>

        {isLast && (
          <Text style={styles.endHint}>
            To je vše! Zvol si z těchto možností.
          </Text>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  counter: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  freeLabel: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  currentBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.lg,
    zIndex: 10,
    backgroundColor: colors.approved,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: colors.border,
  },
  selectButton: {
    backgroundColor: colors.approved,
  },
  disabledButton: {
    opacity: 0.4,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  disabledText: {
    color: colors.textLight,
  },
  endHint: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 13,
    fontStyle: 'italic',
    paddingBottom: spacing.sm,
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  confirmationEmoji: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  confirmationText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.approved,
  },
});
