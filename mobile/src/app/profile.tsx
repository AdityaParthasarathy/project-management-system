import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Button, Card, LoadingState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getMe } from '@/services/auth';
import { colors } from '@/constants/colors';
import { User } from '@/types';

export default function ProfileScreen() {
  const { logout, user: authUser, token, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(authUser ?? null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadUser = useCallback(async () => {
    if (authLoading || !token || !authUser) {
      return;
    }

    try {
      setLoading(true);
      const me = await getMe();
      setUser(me);
    } catch (error: any) {
      if (error?.status === 401) {
        await logout();
        router.replace('/login');
      } else {
        Alert.alert('Unable to load profile', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading || !token || !authUser) {
        return;
      }

      void loadUser();
    }, [authLoading, token, authUser, loadUser]),
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadUser(); }} tintColor={colors.primaryLight} />}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PROFILE</Text>
          <Text style={styles.title}>Account</Text>
        </View>

        {loading && !user ? (
          <LoadingState label="Loading profile..." />
        ) : (
          <Card style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>

            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{user?.fullName || '—'}</Text>

            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || '—'}</Text>

            <Button title="Logout" variant="secondary" onPress={async () => { await logout(); }} />
          </Card>
        )}
      </ScrollView>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 38,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: colors.primaryLight,
    fontSize: 30,
    fontWeight: '800',
  },
  label: {
    width: '100%',
    color: colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    width: '100%',
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
});
