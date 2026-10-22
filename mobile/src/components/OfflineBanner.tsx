import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOfflineState } from '@/services/offline';

/** Shown on top of every screen while the app is displaying saved (offline) data. */
export function OfflineBanner() {
  const { offline, savedAt } = useOfflineState();

  if (!offline) return null;

  const when = savedAt ? new Date(savedAt).toLocaleString() : 'earlier';

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Offline: showing data saved {when}. Pull down to retry.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#78350F',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 8,
  },
  text: {
    color: '#FDE68A',
    fontSize: 12,
    textAlign: 'center',
  },
});
