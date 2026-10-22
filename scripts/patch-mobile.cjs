// One-off patch used to add bonus features to the mobile app (kept for reference).
const fs = require('fs');
const root = 'C:/ProjectFlow-submission/mobile/src/';

function patch(file, pairs) {
  let s = fs.readFileSync(root + file, 'utf8');
  const crlf = s.includes('\r\n');
  s = s.replace(/\r\n/g, '\n');
  for (const [a, b, all] of pairs) {
    if (!s.includes(a)) throw new Error(file + ' missing anchor: ' + a.slice(0, 90));
    s = all ? s.split(a).join(b) : s.replace(a, b);
  }
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(root + file, s);
}

// shared types: the app's own type file now just re-exports the shared source of truth
fs.writeFileSync(root + 'types/index.ts', "// Types live in shared/types.ts (synced into src/shared). Re-exported here for existing imports.\nexport * from '../shared/types';\n");

patch('services/tasks.ts', [
  ["import { authenticatedRequest } from './api';", "import { authenticatedRequest, authenticatedRequestRaw } from './api';\nimport { withCache } from './cache';"],
  ["  projectId?: number;\n}", "  projectId?: number;\n}\n\nexport interface TaskPageOptions extends TaskFilters {\n  limit?: number;\n  sortBy?: string;\n  order?: 'asc' | 'desc';\n}"],
  [
    "  return authenticatedRequest<Task[]>(url);\n}",
    "  return withCache(`tasks:${query}`, () => authenticatedRequest<Task[]>(url));\n}\n\n/** One page of tasks (sorted) plus the total number of matches. Works offline from the saved copy. */\nexport async function getTasksPage(options: TaskPageOptions = {}) {\n  const params = new URLSearchParams();\n\n  if (options.search) params.append('search', options.search);\n  if (options.status) params.append('status', options.status);\n  if (options.priority) params.append('priority', options.priority);\n  if (options.projectId) params.append('projectId', String(options.projectId));\n  params.append('page', '1');\n  params.append('limit', String(options.limit ?? 8));\n  if (options.sortBy) params.append('sortBy', options.sortBy);\n  if (options.order) params.append('order', options.order);\n\n  const query = params.toString();\n\n  return withCache(`tasks-page:${query}`, async () => {\n    const { data, headers } = await authenticatedRequestRaw<Task[]>(`/tasks?${query}`);\n    return { items: data, total: Number(headers.get('x-total-count') ?? data.length) };\n  });\n}",
  ],
]);

patch('services/projects.ts', [
  ["import { authenticatedRequest } from './api';", "import { authenticatedRequest, authenticatedRequestRaw } from './api';\nimport { withCache } from './cache';"],
  ["  status?: string;\n}", "  status?: string;\n}\n\nexport interface ProjectPageOptions extends ProjectFilters {\n  limit?: number;\n  sortBy?: string;\n  order?: 'asc' | 'desc';\n}"],
  [
    "  return authenticatedRequest<Project[]>(url);\n}",
    "  return withCache(`projects:${query}`, () => authenticatedRequest<Project[]>(url));\n}\n\n/** One page of projects (sorted) plus the total number of matches. Works offline from the saved copy. */\nexport async function getProjectsPage(options: ProjectPageOptions = {}) {\n  const params = new URLSearchParams();\n\n  if (options.search) params.append('search', options.search);\n  if (options.status) params.append('status', options.status);\n  params.append('page', '1');\n  params.append('limit', String(options.limit ?? 8));\n  if (options.sortBy) params.append('sortBy', options.sortBy);\n  if (options.order) params.append('order', options.order);\n\n  const query = params.toString();\n\n  return withCache(`projects-page:${query}`, async () => {\n    const { data, headers } = await authenticatedRequestRaw<Project[]>(`/projects?${query}`);\n    return { items: data, total: Number(headers.get('x-total-count') ?? data.length) };\n  });\n}",
  ],
]);

patch('services/dashboard.ts', [
  ["import { authenticatedRequest } from './api';", "import { authenticatedRequest } from './api';\nimport { withCache } from './cache';"],
  ["  return authenticatedRequest<DashboardStats>('/dashboard');", "  return withCache('dashboard', () => authenticatedRequest<DashboardStats>('/dashboard'));"],
]);

// auth: keep refresh token, revoke it on logout, wipe the offline cache
patch('services/auth.ts', [
  [
    "export async function logout() {\n  return authenticatedRequest<{ message: string }>('/auth/logout', {\n    method: 'POST',\n  });\n}",
    "export async function logout() {\n  // Tell the server to revoke the refresh token (real logout), then the caller clears local storage.\n  const refreshToken = await getRefreshToken();\n  return apiRequest<{ message: string }>('/auth/logout', {\n    method: 'POST',\n    body: JSON.stringify({ refreshToken: refreshToken ?? undefined }),\n  });\n}",
  ],
  ["import { apiRequest, authenticatedRequest } from './api';", "import { apiRequest, authenticatedRequest } from './api';\nimport { getRefreshToken } from './authStorage';"],
  ["export interface AuthResponse {\n  token: string;\n  user: User;\n  message: string;\n}", "export interface AuthResponse {\n  token: string;\n  refreshToken: string;\n  user: User;\n  message: string;\n}"],
]);

patch('context/AuthContext.tsx', [
  ["import { getToken, removeToken, saveToken } from '@/services/authStorage';", "import { getToken, removeToken, saveRefreshToken, saveToken } from '@/services/authStorage';\nimport { clearCache } from '@/services/cache';"],
  ["  const clearSession = useCallback(async () => {\n    await removeToken();", "  const clearSession = useCallback(async () => {\n    await removeToken();\n    await clearCache();"],
  ["    const response = await loginApi(email, password);\n    await saveToken(response.token);", "    const response = await loginApi(email, password);\n    await saveToken(response.token);\n    await saveRefreshToken(response.refreshToken);"],
  ["    const response = await registerApi(fullName, email, password);\n    await saveToken(response.token);", "    const response = await registerApi(fullName, email, password);\n    await saveToken(response.token);\n    await saveRefreshToken(response.refreshToken);"],
]);

// layout: offline banner above everything
patch('app/_layout.tsx', [
  ["import { colors } from '@/constants/colors';", "import { colors } from '@/constants/colors';\nimport { OfflineBanner } from '@/components/OfflineBanner';"],
  ["      <StatusBar style=\"light\" />\n      <Stack\n        screenOptions", "      <StatusBar style=\"light\" />\n      <OfflineBanner />\n      <Stack\n        screenOptions"],
]);

// due-tomorrow reminders after the dashboard loads
patch('app/index.tsx', [
  ["import { getTasks } from '@/services/tasks';", "import { getTasks } from '@/services/tasks';\nimport { notifyTasksDueTomorrow } from '@/services/notifications';"],
  ["      setTasks(taskList);", "      setTasks(taskList);\n      void notifyTasksDueTomorrow(taskList);"],
]);

console.log('mobile patch ok');
