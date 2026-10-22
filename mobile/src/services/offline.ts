import { useSyncExternalStore } from 'react';

// Tiny shared store: is the app currently showing saved (cached) data because the network is down?
interface OfflineState {
  offline: boolean;
  savedAt: number | null;
}

let state: OfflineState = { offline: false, savedAt: null };
const listeners = new Set<() => void>();

export function setOffline(offline: boolean, savedAt: number | null = null) {
  if (state.offline === offline && state.savedAt === savedAt) return;
  state = { offline, savedAt };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useOfflineState(): OfflineState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
