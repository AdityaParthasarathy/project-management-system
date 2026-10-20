import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'project_management_token';

function isWebEnvironment() {
  return typeof window !== 'undefined' && !!window.localStorage;
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

export async function saveToken(token: string) {
  if (isWebEnvironment()) {
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  const secureStore = getSecureStoreApi();
  if (!secureStore) {
    return;
  }

  await secureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  if (isWebEnvironment()) {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  const secureStore = getSecureStoreApi();
  if (!secureStore) {
    return null;
  }

  return secureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  if (isWebEnvironment()) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }

  const secureStore = getSecureStoreApi();
  if (!secureStore) {
    return;
  }

  try {
    await secureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Ignore missing or unsupported secure-store methods on non-native runtimes.
  }
}
