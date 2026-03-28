import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DayPlan } from '@/types';
import { colors, spacing, borderRadius } from '@/theme';
import { getCzechDayName, formatCzechDate } from '@/data/holidays';

interface DayRowProps {
  day: DayPlan;
  index: number;
  onPress: () => void;
}

export default function DayRow({ day, index, onPress }: DayRowProps) {
  const date = new Date(day.date + 'T00:00:00');
  const selected = day.options.find((b) => b.id === day.selectedId);
  const isFreeDay = day.isWeekend || day.isHoliday;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isFreeDay && styles.freeDayBg,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <View style={styles.dateRow}>
          <Text style={styles.dayName}>{getCzechDayName(date)}</Text>
          <Text style={styles.dateText}>{formatCzechDate(date)}</Text>
          {day.isHoliday && <Text style={styles.holidayBadge}>svátek</Text>}
        </View>
        {selected ? (
          <View style={styles.selectionRow}>
            <Text style={styles.emoji}>{selected.emoji}</Text>
            <Text style={styles.breakfastName} numberOfLines={1}>
              {selected.name}
            </Text>
            <Text style={styles.prepTime}>{selected.prepTimeMinutes} min</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Zatím nevybráno — klepni pro výběr</Text>
        )}
      </View>
      <View
        style={[
          styles.dot,
          { backgroundColor: selected ? colors.approved : colors.pending },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  freeDayBg: {
    backgroundColor: colors.weekend,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  left: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginRight: spacing.sm,
  },
  dateText: {
    fontSize: 14,
    color: colors.textLight,
  },
  holidayBadge: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  breakfastName: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  prepTime: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
  placeholder: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: spacing.md,
  },
});
