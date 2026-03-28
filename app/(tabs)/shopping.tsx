import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeekPlan } from '@/hooks/useWeekPlan';
import { useShoppingList } from '@/hooks/useShoppingList';
import ShoppingItemComponent from '@/components/ShoppingItem';
import { openRohlikSearch } from '@/lib/rohlik';
import { colors, spacing, borderRadius } from '@/theme';

export default function ShoppingScreen() {
  const { plan } = useWeekPlan();
  const { items, toggleItem, hasSelections } = useShoppingList(plan);

  if (!hasSelections) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['bottom']}>
        <Text style={styles.emptyEmoji}>🧺</Text>
        <Text style={styles.emptyTitle}>Zatím prázdný seznam</Text>
        <Text style={styles.emptySubtitle}>
          Nejdřív vyber snídaně v záložce Týden
        </Text>
      </SafeAreaView>
    );
  }

  const uncheckedCount = items.filter((i) => !i.checked).length;

  const handleOpenAllRohlik = async () => {
    const unchecked = items.filter((i) => !i.checked);
    if (unchecked.length > 0) {
      const first = unchecked[0];
      openRohlikSearch(first);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.summary}>
          {uncheckedCount} {uncheckedCount === 1 ? 'položka' : uncheckedCount < 5 ? 'položky' : 'položek'} k nákupu
        </Text>

        {items.map((item) => (
          <ShoppingItemComponent
            key={item.rohlikQuery || item.name}
            item={item}
            onToggle={() => toggleItem(item.rohlikQuery || item.name)}
            onRohlik={() => openRohlikSearch(item)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={handleOpenAllRohlik} style={styles.rohlikBulkButton}>
          <Text style={styles.rohlikBulkText}>🛒 Otevřít na Rohlíku</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  summary: {
    fontSize: 15,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rohlikBulkButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.button,
    alignItems: 'center',
  },
  rohlikBulkText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
