import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from './types';
import { colors, typography } from '@/theme';
import { TrendingScreen } from '@/screens/TrendingScreen';
import { PortfolioScreen } from '@/screens/PortfolioScreen';

const Tab = createBottomTabNavigator<TabParamList>();

// Lightweight emoji glyphs keep the bundle small; swap for vector icons from
// the ChadWallet asset pack if desired (see SETUP.md > Branding).
function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return <Text style={[styles.icon, { opacity: focused ? 1 : 0.45 }]}>{glyph}</Text>;
}

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tab.Screen
        name="Trending"
        component={TrendingScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon glyph="🔥" focused={focused} /> }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon glyph="💼" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgElevated,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
  } as never,
  label: { ...typography.micro },
  icon: { fontSize: 20 },
});
