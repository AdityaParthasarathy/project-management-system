import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Card, EmptyState, LoadingState, PriorityBadge, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/colors';
import { getDashboard } from '@/services/dashboard';
import { getProjects } from '@/services/projects';
import { getTasks } from '@/services/tasks';
import { DashboardStats, Project, Task } from '@/types';

function formatDate(value?: string | null) {
  if (!value) return 'No date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (authLoading || !user || !token) {
        return;
      }

      void loadDashboard();
    }, [authLoading, user, token]),
  );

  const loadDashboard = useCallback(async () => {
    if (authLoading || !user || !token) {
      return;
    }

    try {
      setError('');
      const [stats, projectList, taskList] = await Promise.all([
        getDashboard(),
        getProjects(),
        getTasks(),
      ]);

      setDashboard(stats);
      setProjects(projectList);
      setTasks(taskList);
    } catch (err: any) {
      if (err?.status === 401) {
        Alert.alert('Session expired', 'Your session has expired. Please log in again.');
        await logout();
        return;
      }

      setError('Unable to load dashboard. Please check your connection and try again.');
      Alert.alert('Dashboard unavailable', 'Unable to load dashboard. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

  const recentTasks = tasks.slice(0, 3);
  const activeProjects = projects.filter((project) => project.status === 'IN_PROGRESS').slice(0, 3);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadDashboard();
            }}
            tintColor={colors.primaryLight}
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>PROJECT MANAGEMENT</Text>
            <Text style={styles.title}>{greeting()}, {user?.fullName?.split(' ')[0] || 'there'}.</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
        </View>

        {loading && !dashboard ? (
          <LoadingState label="Loading dashboard..." />
        ) : error ? (
          <Card style={styles.cardError}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Total Projects" value={String(dashboard?.totalProjects ?? 0)} />
              <StatCard label="Total Tasks" value={String(dashboard?.totalTasks ?? 0)} />
              <StatCard label="Completed" value={String(dashboard?.completedTasks ?? 0)} />
              <StatCard label="Pending" value={String(dashboard?.pendingTasks ?? 0)} />
              <StatCard label="In Progress" value={String(dashboard?.projectsInProgress ?? 0)} fullWidth />
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Recent Tasks</Text>

              {recentTasks.length ? (
                recentTasks.map((task) => (
                  <Card key={task.id} style={styles.itemCard}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.itemTitle}>{task.name}</Text>
                      <PriorityBadge priority={task.priority} />
                    </View>

                    <Text style={styles.itemMeta}>{task.description || 'No description provided.'}</Text>

                    <View style={styles.metaRow}>
                      <StatusBadge status={task.status} />
                      <Text style={styles.metaText}>{formatDate(task.dueDate)}</Text>
                    </View>
                  </Card>
                ))
              ) : (
                <EmptyState title="No tasks yet" subtitle="Create a task to start tracking your work." />
              )}
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Active Projects</Text>

              {activeProjects.length ? (
                activeProjects.map((project) => (
                  <Card key={project.id} style={styles.itemCard}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.itemTitle}>{project.name}</Text>
                      <StatusBadge status={project.status} />
                    </View>

                    <Text style={styles.itemMeta}>{project.description || 'No description provided.'}</Text>
                    <Text style={styles.metaText}>{formatDate(project.startDate)} — {formatDate(project.endDate)}</Text>
                  </Card>
                ))
              ) : (
                <EmptyState title="No active projects" subtitle="Projects in progress will appear here." />
              )}
            </View>
          </>
        )}
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

function StatCard({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <Card style={[styles.statCard, fullWidth && styles.fullWidthCard]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Card>
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
    paddingTop: 34,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 26,
    fontWeight: '800',
    maxWidth: 240,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderColor: colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primaryLight,
    fontWeight: '800',
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    width: '47.5%',
    minHeight: 96,
  },
  fullWidthCard: {
    width: '100%',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  sectionWrap: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  itemCard: {
    marginBottom: 12,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  itemMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
  },
  cardError: {
    backgroundColor: 'rgba(127, 29, 29, 0.18)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  errorText: {
    color: '#FECACA',
    fontSize: 14,
  },
});