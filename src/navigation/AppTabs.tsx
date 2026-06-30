import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from './types';
import { colors, typography } from '@/theme';
import { TrendingScreen } from '@/screens/TrendingScreen';
import { PortfolioScreen } from '@/screens/PortfolioScreen';
import { EmptyState } from '@/components/States';
import { Screen } from '@/components/Screen';

const Tab = createBottomTabNavigator<TabParamList>();

function ComingSoonScreen({ title }: { title: string }) {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState title={`${title} (Coming Soon)`} subtitle="This feature is not part of the assignment." />
      </View>
    </Screen>
  );
}

function MemesScreen() {
  return <ComingSoonScreen title="Memes" />;
}

function DiscoverScreen() {
  return <ComingSoonScreen title="Discover" />;
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
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Memes"
        component={MemesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={22} color={color} />,
        }}
        // @ts-ignore
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={22} color={color} />,
        }}
        // @ts-ignore
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={22} color={color} />,
        }}
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
});
