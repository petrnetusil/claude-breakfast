import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.cardBg,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      }}
    >
      <Tabs.Screen
        name="week"
        options={{
          title: 'Týden',
          headerTitle: 'Snídaně na týden',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🍳</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Nákup',
          headerTitle: 'Nákupní seznam',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🛒</Text>
          ),
        }}
      />
    </Tabs>
  );
}
