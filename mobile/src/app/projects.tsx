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
import { Button, Card, EmptyState, ErrorState, FilterChip, Input, LoadingState, SearchBar, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/colors';
import { ApiError } from '@/services/api';
import { createProject, deleteProject, getProjects, updateProject } from '@/services/projects';
import { Project } from '@/types';

function formatDate(value?: string | null) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const statusOptions = [
  { label: 'All', value: 'ALL' },
  { label: 'Not Started', value: 'NOT_STARTED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
] as const;

export default function ProjectsScreen() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'NOT_STARTED' as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
    startDate: '',
    endDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = useCallback(async () => {
    if (authLoading || !user || !token) {
      return;
    }

    try {
      setError('');
      const filters = {
        search: search.trim(),
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      };
      const data = await getProjects(filters);
      setProjects(data);
    } catch (err: any) {
      if (err?.status === 401) {
        await logout();
        return;
      }
      setError('Unable to load projects. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout, search, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading || !user || !token) {
        return;
      }

      void loadProjects();
    }, [authLoading, user, token, loadProjects]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading || projects.length > 0) {
        loadProjects();
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search, statusFilter, loadProjects, loading, projects.length]);

  const openCreateModal = () => {
    setEditingProject(null);
    setForm({
      name: '',
      description: '',
      status: 'NOT_STARTED',
      startDate: '',
      endDate: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation required', 'Project name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };

      if (editingProject) {
        await updateProject(editingProject.id, payload);
        Alert.alert('Project updated', 'Changes saved successfully.');
      } else {
        await createProject(payload);
        Alert.alert('Project created', 'The new project has been added.');
      }

      setModalVisible(false);
      await loadProjects();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      Alert.alert('Project save failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (project: Project) => {
    Alert.alert('Delete this project?', 'Associated tasks may also be removed because of the backend relationship.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteProject(project.id);
          Alert.alert('Project deleted', 'The project was removed successfully.');
          await loadProjects();
        } catch (err) {
          const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
          Alert.alert('Delete failed', message);
        }
      } },
    ]);
  };

  const displayProjects = useMemo(() => projects, [projects]);

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Text style={styles.eyebrow}>WORKSPACE</Text>
        <Text style={styles.title}>Projects</Text>
      </View>

      <View style={styles.toolbar}>
        <Button title="+ New Project" onPress={openCreateModal} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search projects..."
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filterContent}>
        {statusOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            active={statusFilter === option.value}
            onPress={() => setStatusFilter(option.value)}
          />
        ))}
      </ScrollView>

      {loading && !projects.length ? (
        <LoadingState label="Loading projects..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); loadProjects(); }} />
      ) : displayProjects.length === 0 ? (
        <EmptyState title="No projects yet" subtitle="Create your first project to get started." onAction={openCreateModal} actionLabel="Create project" />
      ) : (
        <FlatList
          data={displayProjects}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadProjects(); }} tintColor={colors.primaryLight} />}
          renderItem={({ item }) => (
            <Card style={styles.projectCard}>
              <View style={styles.projectHeaderRow}>
                <Text style={styles.projectName}>{item.name}</Text>
                <StatusBadge status={item.status} />
              </View>

              <Text style={styles.projectDescription}>{item.description || 'No description provided.'}</Text>

              <View style={styles.projectMetaRow}>
                <Text style={styles.metaText}>{formatDate(item.startDate)}</Text>
                <Text style={styles.metaText}>→</Text>
                <Text style={styles.metaText}>{formatDate(item.endDate)}</Text>
              </View>

              <View style={styles.projectActions}>
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
            <Text style={styles.modalTitle}>{editingProject ? 'Edit Project' : 'Create Project'}</Text>

            <Input label="Name" value={form.name} onChangeText={(text) => setForm({ ...form, name: text })} placeholder="Project name" />
            <Input label="Description" value={form.description} onChangeText={(text) => setForm({ ...form, description: text })} placeholder="Project description" multiline />

            <Text style={styles.label}>Status</Text>
            <View style={styles.choiceRow}>
              {['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setForm({ ...form, status: status as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' })}
                  style={[styles.choiceButton, form.status === status && styles.choiceButtonActive]}
                >
                  <Text style={[styles.choiceText, form.status === status && styles.choiceTextActive]}>
                    {status === 'NOT_STARTED' ? 'Not Started' : status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Input label="Start Date" value={form.startDate} onChangeText={(text) => setForm({ ...form, startDate: text })} placeholder="YYYY-MM-DD" />
            <Input label="End Date" value={form.endDate} onChangeText={(text) => setForm({ ...form, endDate: text })} placeholder="YYYY-MM-DD" />

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} />
              <Button title={submitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'} loading={submitting} onPress={handleSubmit} />
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
    marginBottom: 14,
  },
  searchWrap: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  filtersRow: {
    paddingHorizontal: 18,
    marginBottom: 10,
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
  projectCard: {
    gap: 12,
  },
  projectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  projectName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    flexShrink: 1,
  },
  projectDescription: {
    color: colors.muted,
    fontSize: 13,
  },
  projectMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
  },
  projectActions: {
    flexDirection: 'row',
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
    gap: 14,
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
