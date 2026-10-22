import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from './api';
import { setOffline } from './offline';

const PREFIX = 'cache:';

/**
 * Offline viewing: run the live request and remember the result. If the network is down,
 * fall back to the last saved result (and flag the app as offline so a banner is shown).
 */
export async function withCache<T>(key: string, load: () => Promise<T>): Promise<T> {
  try {
    const data = await load();
    setOffline(false);
    try {
      await AsyncStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), data }));
    } catch {
      // Cache is best-effort; never fail a request because saving failed.
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.isNetworkError) {
      try {
        const raw = await AsyncStorage.getItem(PREFIX + key);
        if (raw) {
          const saved = JSON.parse(raw) as { at: number; data: T };
          setOffline(true, saved.at);
          return saved.data;
        }
      } catch {
        // fall through to the original error
      }
    }
    throw error;
  }
}

/** Removes saved data (called on logout so the next user never sees it). */
export async function clearCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(PREFIX) || k.startsWith('reminder:'));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {
    // ignore
  }
  setOffline(false);
}
