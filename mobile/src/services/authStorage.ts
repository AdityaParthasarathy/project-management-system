import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'project_management_token';
const REFRESH_TOKEN_KEY = 'project_management_refresh_token';

// Only the browser preview uses localStorage. On Android/iOS the tokens always go to SecureStore
// (Android Keystore / iOS Keychain), whatever globals the JS runtime happens to expose.
function isWebEnvironment() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;
}

function getSecureStoreApi() {
  if (typeof SecureStore === 'undefined') {
    return null;
  }

  const secureStore = SecureStore as any;
  if (
    typeof secureStore.setItemAsync !== 'function' ||
    typeof secureStore.getItemAsync !== 'function' ||
    typeof secureStore.deleteItemAsync !== 'function'
  ) {
    return null;
  }

  return secureStore;
}

async function setValue(key: string, value: string) {
  if (isWebEnvironment()) {
    window.localStorage.setItem(key, value);
    return;
  }

  const secureStore = getSecureStoreApi();
  if (!secureStore) {
    return;
  }

  await secureStore.setItemAsync(key, value);
}

async function getValue(key: string) {
  if (isWebEnvironment()) {
    return window.localStorage.getItem(key);
  }

  const secureStore = getSecureStoreApi();
  if (!secureStore) {
    return null;
  }

  return secureStore.getItemAsync(key);
}

async function deleteValue(key: string) {
  if (isWebEnvironment()) {
    window.localStorage.removeItem(key);
    return;
  }

  const secureStore = getSecureStoreApi();
  if (!secureStore) {
    return;
  }

  try {
    await secureStore.deleteItemAsync(key);
  } catch {
    // Ignore missing or unsupported secure-store methods on non-native runtimes.
  }
}

export async function saveToken(token: string) {
  await setValue(TOKEN_KEY, token);
}

export async function getToken() {
  return getValue(TOKEN_KEY);
}

export async function saveRefreshToken(token: string) {
  await setValue(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken() {
  return getValue(REFRESH_TOKEN_KEY);
}

/** Removes both the access token and the refresh token (full local sign-out). */
export async function removeToken() {
  await deleteValue(TOKEN_KEY);
  await deleteValue(REFRESH_TOKEN_KEY);
}
