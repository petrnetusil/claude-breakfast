import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeekPlan } from '@/hooks/useWeekPlan';
import DayRow from '@/components/DayRow';
import { colors, spacing } from '@/theme';

export default function WeekScreen() {
  const { plan, loading, regenerate, confirmedCount } = useWeekPlan();
  const router = useRouter();

  if (loading || !plan) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Připravuji snídaně...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.counter}>
            Vybráno {confirmedCount}/7
          </Text>
          <Pressable onPress={regenerate} style={styles.regenerateButton}>
            <Text style={styles.regenerateText}>Nový týden</Text>
          </Pressable>
        </View>

        {plan.days.map((day, index) => (
          <DayRow
            key={day.date}
            day={day}
            index={index}
            onPress={() =>
              router.push({
                pathname: '/day/[dayIndex]',
                params: { dayIndex: String(index) },
              })
            }
          />
        ))}

        {confirmedCount < 7 && (
          <Text style={styles.hint}>
            Klepni na den a swipni doprava pro výběr snídaně
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textLight,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  counter: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  regenerateButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  regenerateText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  hint: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 14,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
