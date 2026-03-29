import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';
import { useWeekPlan } from '@/hooks/useWeekPlan';
import BreakfastCard from '@/components/BreakfastCard';
import { getCzechDayName, formatCzechDate } from '@/data/holidays';
import { colors, spacing } from '@/theme';
import { Breakfast } from '@/types';

export default function DayDetailScreen() {
  const { dayIndex } = useLocalSearchParams<{ dayIndex: string }>();
  const index = parseInt(dayIndex || '0', 10);
  const { plan, selectBreakfast, generateMoreOptions } = useWeekPlan();
  const router = useRouter();
  const [selected, setSelected] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allSwiped, setAllSwiped] = useState(false);
  const swiperRef = useRef<SwiperCardRefType>(null);

  if (!plan) return null;

  const day = plan.days[index];
  if (!day) return null;

  const date = new Date(day.date + 'T00:00:00');
  const options = day.options;

  const handleSwipeRight = (cardIndex: number) => {
    const breakfast = options[cardIndex];
    if (!breakfast) return;
    selectBreakfast(index, breakfast.id);
    setSelectedName(breakfast.name);
    setSelected(true);
    setTimeout(() => router.back(), 800);
  };

  const handleSwipedAll = () => {
    setAllSwiped(true);
  };

  const handleGenerateMore = () => {
    generateMoreOptions(index);
    setAllSwiped(false);
    setCurrentIndex(0);
  };

  if (selected) {
    return (
      <SafeAreaView style={styles.confirmationContainer}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.confirmationContent}>
          <Text style={styles.confirmationEmoji}>✅</Text>
          <Text style={styles.confirmationText}>Vybráno!</Text>
          <Text style={styles.confirmationName}>{selectedName}</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
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
            {Math.min(currentIndex + 1, options.length)}/{options.length}
          </Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {(day.isWeekend || day.isHoliday) && (
        <Text style={styles.freeLabel}>
          {day.isHoliday ? 'Svátek — dopřej si!' : 'Víkend — čas na pořádnou snídani!'}
        </Text>
      )}

      {allSwiped ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🤔</Text>
          <Text style={styles.emptyTitle}>Prošla jsi všechny možnosti</Text>
          <Pressable onPress={handleGenerateMore} style={styles.moreButton}>
            <Text style={styles.moreButtonText}>Vymysli další!</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.backLinkButton}>
            <Text style={styles.backLinkText}>Zpět na týden</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.swiperContainer}>
          <Swiper
            ref={swiperRef}
            data={options}
            renderCard={(breakfast: Breakfast) => (
              <BreakfastCard
                breakfast={breakfast}
                isCurrentSelection={day.selectedId === breakfast.id}
              />
            )}
            keyExtractor={(breakfast: Breakfast) => breakfast.id}
            onSwipeRight={handleSwipeRight}
            onSwipedAll={handleSwipedAll}
            onIndexChange={setCurrentIndex}
            disableTopSwipe
            disableBottomSwipe
            OverlayLabelRight={() => (
              <View style={styles.overlayRight}>
                <Text style={styles.overlayRightText}>Chci! ✅</Text>
              </View>
            )}
            OverlayLabelLeft={() => (
              <View style={styles.overlayLeft}>
                <Text style={styles.overlayLeftText}>Další ❌</Text>
              </View>
            )}
          />
        </View>
      )}

      {!allSwiped && (
        <View style={styles.swipeHintBar}>
          <Text style={styles.hintText}>← Swipni doleva pro další, doprava pro výběr →</Text>
        </View>
      )}
    </SafeAreaView>
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
    marginBottom: spacing.xs,
  },
  swiperContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  overlayRight: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.approved + '30',
    borderRadius: 20,
  },
  overlayRightText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.approved,
  },
  overlayLeft: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.pending + '30',
    borderRadius: 20,
  },
  overlayLeftText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.pending,
  },
  swipeHintBar: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  moreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: spacing.md,
  },
  moreButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  backLinkButton: {
    padding: spacing.md,
  },
  backLinkText: {
    color: colors.textLight,
    fontSize: 15,
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  confirmationContent: {
    alignItems: 'center',
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
  confirmationName: {
    fontSize: 18,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
