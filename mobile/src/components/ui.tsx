import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const palette = {
  background: '#09090B',
  surface: '#18181B',
  border: '#27272A',
  text: '#FAFAFA',
  muted: '#A1A1AA',
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export function Button({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  disabled = false,
}: {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.primaryButton,
        !isPrimary && styles.secondaryButton,
        isDanger && styles.dangerButton,
        (disabled || loading) && styles.disabledButton,
        pressed && styles.pressed,
      ]}
      onPress={disabled || loading ? undefined : onPress}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.buttonText, isDanger && styles.dangerButtonText]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  autoCapitalize,
  editable,
}: {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        editable={editable}
        placeholderTextColor={palette.muted}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchBar}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        style={styles.searchInput}
      />
    </View>
  );
}

export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const tone =
    normalized === 'COMPLETED'
      ? styles.badgeSuccess
      : normalized === 'IN_PROGRESS' || normalized === 'IN PROGRESS'
        ? styles.badgeWarning
        : normalized === 'NOT_STARTED' || normalized === 'PENDING'
          ? styles.badgeNeutral
          : styles.badgeMuted;

  return (
    <View style={[styles.badge, tone]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const normalized = priority.toUpperCase();
  const tone =
    normalized === 'HIGH'
      ? styles.badgeDanger
      : normalized === 'MEDIUM'
        ? styles.badgeWarning
        : styles.badgeSuccess;

  return (
    <View style={[styles.badge, tone]}>
      <Text style={styles.badgeText}>{priority}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card style={styles.emptyStateCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.emptyAction} onPress={onAction}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={palette.primaryLight} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card style={styles.errorCard}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.errorRetryButton}>
          <Text style={styles.errorRetryText}>Retry</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

export function SectionHeader({ title, action, right }: { title: string; action?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right || (action ? <Text style={styles.sectionAction}>{action}</Text> : null)}
    </View>
  );
}

export function SelectRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.selectRow} onPress={onPress}>
      <Text style={styles.selectLabel}>{label}</Text>
      <Text style={styles.selectValue}>{value}</Text>
    </Pressable>
  );
}

export function SectionList({ children }: { children: React.ReactNode }) {
  return <ScrollView style={styles.sectionScroll}>{children}</ScrollView>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButton: {
    backgroundColor: palette.primary,
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  dangerButton: {
    backgroundColor: '#2C1220',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: palette.text,
    fontWeight: '700',
    fontSize: 15,
  },
  dangerButtonText: {
    color: '#FECACA',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: palette.text,
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.text,
    fontSize: 15,
  },
  textarea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    color: palette.muted,
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  filterChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderColor: palette.primary,
  },
  filterChipText: {
    color: palette.muted,
    fontWeight: '600',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: palette.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  badgeNeutral: {
    backgroundColor: 'rgba(161, 161, 170, 0.12)',
    borderColor: 'rgba(161, 161, 170, 0.35)',
  },
  badgeMuted: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: 'rgba(124, 58, 237, 0.35)',
  },
  badgeText: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyStateCard: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: palette.muted,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 18,
  },
  emptyAction: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    borderWidth: 1,
    borderColor: `${palette.primary}66`,
  },
  emptyActionText: {
    color: palette.primaryLight,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loadingText: {
    color: palette.muted,
    fontSize: 14,
  },
  errorCard: {
    borderColor: 'rgba(239, 68, 68, 0.45)',
    backgroundColor: 'rgba(127, 29, 29, 0.18)',
  },
  errorTitle: {
    color: '#FECACA',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#FDE2E2',
    fontSize: 14,
    marginBottom: 14,
  },
  errorRetryButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  errorRetryText: {
    color: '#FECACA',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    color: palette.text,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionAction: {
    color: palette.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectLabel: {
    color: palette.muted,
    fontSize: 12,
  },
  selectValue: {
    color: palette.text,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionScroll: {
    flex: 1,
  },
});
