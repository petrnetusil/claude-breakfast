import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ShoppingItem as ShoppingItemType } from '@/types';
import { colors, spacing, borderRadius } from '@/theme';

interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggle: () => void;
  onRohlik: () => void;
}

export default function ShoppingItem({ item, onToggle, onRohlik }: ShoppingItemProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onToggle} style={styles.checkArea}>
        <View style={[styles.checkbox, item.checked && styles.checked]}>
          {item.checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.textArea}>
          <Text style={[styles.name, item.checked && styles.strikethrough]}>
            {item.name}
          </Text>
          <Text style={styles.amount}>{item.amount}</Text>
        </View>
      </Pressable>
      <Pressable onPress={onRohlik} style={styles.rohlikButton}>
        <Text style={styles.rohlikText}>🛒</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  checkArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checked: {
    backgroundColor: colors.approved,
    borderColor: colors.approved,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  textArea: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: colors.textLight,
  },
  amount: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  rohlikButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  rohlikText: {
    fontSize: 20,
  },
});
