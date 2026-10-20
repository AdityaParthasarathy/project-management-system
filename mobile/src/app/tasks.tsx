import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Button, Card, EmptyState, ErrorState, FilterChip, Input, LoadingState, PriorityBadge, SearchBar, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/colors';
import { ApiError } from '@/services/api';
import { getProjects } from '@/services/projects';
import { createTask, deleteTask, getTasks, updateTask } from '@/services/tasks';
import { Project, Task } from '@/types';

function formatDate(value?: string | null) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const taskStatusOptions = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
] as const;

const priorityOptions = [
  { label: 'All', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
] as const;

export default function TasksScreen() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    projectId: 0,
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    status: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
    dueDate: '',
  });

  const loadProjects = useCallback(async () => {
    if (authLoading || !user || !token) {
      return;
    }

    const data = await getProjects();
    setProjects(data);
  }, [authLoading, user, token]);

  const loadTasks = useCallback(async () => {
    if (authLoading || !user || !token) {
      return;
    }

    try {
      setError('');
      const data = await getTasks({
        search: search.trim(),
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        projectId: projectFilter ?? undefined,
      });
      setTasks(data);
    } catch (err: any) {
      if (err?.status === 401) {
        await logout();
        return;
      }
      setError('Unable to load tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout, priorityFilter, projectFilter, search, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading || !user || !token) {
        return;
      }

      void loadProjects();
      void loadTasks();
    }, [authLoading, user, token, loadProjects, loadTasks]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTasks();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, projectFilter, loadTasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setForm({
      name: '',
      description: '',
      projectId: projects[0]?.id ?? 0,
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setForm({
      name: task.name,
      description: task.description || '',
      projectId: task.projectId,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation required', 'Task name is required.');
      return;
    }

    if (!form.projectId) {
      Alert.alert('Validation required', 'Please select a project.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        projectId: form.projectId,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || undefined,
      };

      if (editingTask) {
        await updateTask(editingTask.id, payload);
        Alert.alert('Task updated', 'Changes were saved.');
      } else {
        await createTask(payload);
        Alert.alert('Task created', 'Your task is now visible.');
      }

      setModalVisible(false);
      await loadTasks();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Task save failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (task: Task) => {
    Alert.alert('Delete this task?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteTask(task.id);
          Alert.alert('Task deleted', 'The task was removed.');
          await loadTasks();
        } catch (err) {
          const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
          Alert.alert('Delete failed', message);
        }
      } },
    ]);
  };

  const handleComplete = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'COMPLETED' });
      await loadTasks();
      Alert.alert('Task completed', 'The task is now marked as completed.');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Unable to complete task', message);
    }
  };

  const displayTasks = useMemo(() => tasks, [tasks]);

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Text style={styles.eyebrow}>WORKSPACE</Text>
        <Text style={styles.title}>Tasks</Text>
      </View>

      <View style={styles.toolbar}>
        <Button title="+ New Task" onPress={openCreateModal} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search tasks..." />
      </View>

      {projects.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent} style={styles.filtersRow}>
          <FilterChip label="All projects" active={projectFilter === null} onPress={() => setProjectFilter(null)} />
          {projects.map((project) => (
            <FilterChip key={project.id} label={project.name} active={projectFilter === project.id} onPress={() => setProjectFilter(project.id)} />
          ))}
        </ScrollView>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent} style={styles.filtersRow}>
        {taskStatusOptions.map((option) => (
          <FilterChip key={option.value} label={option.label} active={statusFilter === option.value} onPress={() => setStatusFilter(option.value)} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent} style={styles.filtersRow}>
        {priorityOptions.map((option) => (
          <FilterChip key={option.value} label={option.label} active={priorityFilter === option.value} onPress={() => setPriorityFilter(option.value)} />
        ))}
      </ScrollView>

      {loading && !tasks.length ? (
        <LoadingState label="Loading tasks..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); void loadTasks(); }} />
      ) : displayTasks.length === 0 ? (
        <EmptyState title="No tasks yet" subtitle="Create a task to start tracking your work." onAction={openCreateModal} actionLabel="Create task" />
      ) : (
        <FlatList
          data={displayTasks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadTasks(); }} tintColor={colors.primaryLight} />}
          renderItem={({ item }) => (
            <Card style={styles.taskCard}>
              <View style={styles.taskHeaderRow}>
                <Text style={styles.taskName}>{item.name}</Text>
                <PriorityBadge priority={item.priority} />
              </View>

              <Text style={styles.taskDescription}>{item.description || 'No description provided.'}</Text>

              <View style={styles.taskMetaRow}>
                <Text style={styles.metaText}>{projects.find((project) => project.id === item.projectId)?.name || 'Project'}</Text>
                <StatusBadge status={item.status} />
              </View>

              <Text style={styles.metaText}>Due: {formatDate(item.dueDate)}</Text>

              <View style={styles.taskActions}>
                {item.status !== 'COMPLETED' ? (
                  <Button title="Complete" onPress={() => void handleComplete(item)} />
                ) : null}
                <Button title="Edit" variant="secondary" onPress={() => openEditModal(item)} />
                <Button title="Delete" variant="danger" onPress={() => handleDelete(item)} />
              </View>
            </Card>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'Create Task'}</Text>

            <Input label="Task Name" value={form.name} onChangeText={(text) => setForm({ ...form, name: text })} placeholder="Task name" />
            <Input label="Description" value={form.description} onChangeText={(text) => setForm({ ...form, description: text })} placeholder="Task description" multiline />

            <Text style={styles.label}>Project</Text>
            <View style={styles.choiceRow}>
              {projects.map((project) => (
                <Pressable
                  key={project.id}
                  onPress={() => setForm({ ...form, projectId: project.id })}
                  style={[styles.choiceButton, form.projectId === project.id && styles.choiceButtonActive]}
                >
                  <Text style={[styles.choiceText, form.projectId === project.id && styles.choiceTextActive]}>{project.name}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.choiceRow}>
              {['LOW', 'MEDIUM', 'HIGH'].map((priority) => (
                <Pressable
                  key={priority}
                  onPress={() => setForm({ ...form, priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' })}
                  style={[styles.choiceButton, form.priority === priority && styles.choiceButtonActive]}
                >
                  <Text style={[styles.choiceText, form.priority === priority && styles.choiceTextActive]}>{priority === 'LOW' ? 'Low' : priority === 'MEDIUM' ? 'Medium' : 'High'}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Status</Text>
            <View style={styles.choiceRow}>
              {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setForm({ ...form, status: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' })}
                  style={[styles.choiceButton, form.status === status && styles.choiceButtonActive]}
                >
                  <Text style={[styles.choiceText, form.status === status && styles.choiceTextActive]}>{status === 'PENDING' ? 'Pending' : status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}</Text>
                </Pressable>
              ))}
            </View>

            <Input label="Due Date" value={form.dueDate} onChangeText={(text) => setForm({ ...form, dueDate: text })} placeholder="YYYY-MM-DD" />

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} />
              <Button title={submitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'} loading={submitting} onPress={handleSubmit} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {
    paddingHorizontal: 18,
    paddingTop: 32,
    marginBottom: 12,
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
  toolbar: {
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  searchWrap: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  filtersRow: {
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  filterContent: {
    gap: 10,
    paddingRight: 18,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 12,
  },
  taskCard: {
    gap: 10,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  taskName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  taskDescription: {
    color: colors.muted,
    fontSize: 13,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
  },
  taskActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  label: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  choiceText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  choiceTextActive: {
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});
