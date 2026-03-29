import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeekPlan } from '@/hooks/useWeekPlan';
import { useShoppingList } from '@/hooks/useShoppingList';
import ShoppingItemComponent from '@/components/ShoppingItem';
import { colors, spacing } from '@/theme';

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.summary}>
          {uncheckedCount} {uncheckedCount === 1 ? 'položka' : uncheckedCount < 5 ? 'položky' : 'položek'} k nákupu
        </Text>

        {items.map((item) => (
          <ShoppingItemComponent
            key={item.name}
            item={item}
            onToggle={() => toggleItem(item.name)}
          />
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pro {items.length} ingrediencí z vybraných snídaní
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: spacing.xl,
  },
  summary: {
    fontSize: 15,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  footer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
  },
});
