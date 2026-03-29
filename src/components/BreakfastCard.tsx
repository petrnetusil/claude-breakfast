import { View, Text, StyleSheet } from 'react-native';
import { Breakfast } from '@/types';
import { colors, spacing, borderRadius } from '@/theme';

interface BreakfastCardProps {
  breakfast: Breakfast;
  isCurrentSelection?: boolean;
}

export default function BreakfastCard({ breakfast, isCurrentSelection }: BreakfastCardProps) {
  return (
    <View style={styles.card}>
      {isCurrentSelection && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Aktuální výběr</Text>
        </View>
      )}

      <Text style={styles.emoji}>{breakfast.emoji}</Text>
      <Text style={styles.name}>{breakfast.name}</Text>
      <Text style={styles.description}>{breakfast.description}</Text>

      <View style={styles.badges}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>{breakfast.prepTimeMinutes} min</Text>
        </View>
        <View
          style={[
            styles.healthBadge,
            {
              backgroundColor: breakfast.isHealthy
                ? colors.healthy + '20'
                : colors.indulgent + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.healthBadgeText,
              { color: breakfast.isHealthy ? colors.healthy : colors.indulgent },
            ]}
          >
            {breakfast.isHealthy ? 'Zdravé' : 'Hříšné'}
          </Text>
        </View>
        {breakfast.tags.map((tag) => (
          <View key={tag} style={styles.tagBadge}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.ingredientsList}>
        <Text style={styles.ingredientsTitle}>
          Ingredience ({breakfast.ingredients.length}):
        </Text>
        {breakfast.ingredients.slice(0, 6).map((ing, i) => (
          <Text key={i} style={styles.ingredientItem}>
            • {ing.name} — {ing.amount}
          </Text>
        ))}
        {breakfast.ingredients.length > 6 && (
          <Text style={styles.ingredientMore}>
            +{breakfast.ingredients.length - 6} dalších...
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.card + 4,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  currentBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
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
  emoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  timeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.badge,
  },
  timeBadgeText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.badge,
  },
  healthBadgeText: {
    fontWeight: '600',
    fontSize: 13,
  },
  tagBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.badge,
  },
  tagText: {
    color: colors.textLight,
    fontSize: 12,
  },
  ingredientsList: {
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  ingredientsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ingredientItem: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
  },
  ingredientMore: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
