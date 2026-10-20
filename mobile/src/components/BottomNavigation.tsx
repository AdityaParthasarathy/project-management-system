import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';

const palette = {
  background: '#09090B',
  surface: '#18181B',
  border: '#27272A',
  text: '#FAFAFA',
  muted: '#A1A1AA',
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
};

const tabs = [
  { label: 'Home', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Profile', path: '/profile' },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {tabs.map(({ label, path }) => {
        const isActive = path === '/' ? pathname === '/' : pathname.startsWith(path);

        return (
          <Pressable
            key={label}
            onPress={() => router.replace(path as any)}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 18,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'rgba(124, 58, 237, 0.16)',
  },
  tabText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: palette.primaryLight,
  },
});
