// One-off patch used to add bonus features to frontend/app/page.tsx (kept for reference).
const fs = require('fs');
const file = 'C:/ProjectFlow-submission/frontend/app/page.tsx';
let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b, all = false) => {
  if (!s.includes(a)) throw new Error('missing anchor: ' + a.slice(0, 80));
  s = all ? s.split(a).join(b) : s.replace(a, b);
};

// A. shared types + validation instead of local copies
const typeStart = s.indexOf('type User = {');
const typeEnd = s.indexOf('type ProjectForm = {');
s = s.slice(0, typeStart) + s.slice(typeEnd);
rep(
  "import { FormEvent, useEffect, useState } from 'react';",
  "import { FormEvent, useCallback, useEffect, useState } from 'react';\nimport type { AuditLogEntry, DashboardStats as DashboardData, Project, Task, User } from './shared/types';\nimport { validateProject, validateRegister, validateTask } from './shared/validation';",
);

// B. apiFetch with silent token refresh
rep(
  "const API_URL =\n  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';\n",
  `const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const PAGE_SIZE = 6;

// Renews the short-lived access token using the long-lived refresh token (rotated by the server).
let refreshInFlight: Promise<boolean> | null = null;
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(\`\${API_URL}/auth/refresh\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }
  return refreshInFlight;
}

// fetch() for authenticated calls: attaches the token and retries once after a silent refresh on 401.
async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const withAuth = (): RequestInit => ({
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: \`Bearer \${localStorage.getItem('token')}\`,
    },
  });
  let res = await fetch(input, withAuth());
  if (res.status === 401 && (await refreshAccessToken())) {
    res = await fetch(input, withAuth());
  }
  return res;
}

const PROJECT_SORTS = [
  ['createdAt:desc', 'Newest first'],
  ['createdAt:asc', 'Oldest first'],
  ['name:asc', 'Name A-Z'],
  ['name:desc', 'Name Z-A'],
  ['status:asc', 'Status'],
  ['startDate:asc', 'Start date'],
];

const TASK_SORTS = [
  ['createdAt:desc', 'Newest first'],
  ['createdAt:asc', 'Oldest first'],
  ['name:asc', 'Name A-Z'],
  ['name:desc', 'Name Z-A'],
  ['priority:desc', 'Priority: high to low'],
  ['priority:asc', 'Priority: low to high'],
  ['dueDate:asc', 'Due date: soonest'],
  ['dueDate:desc', 'Due date: latest'],
];
`,
);

// C. every data call goes through apiFetch (auth/login|register keep plain fetch)
s = s.replace(/\bfetch\(\s*(`\$\{API_URL\}\/(?!auth\/\$\{authMode\}|auth\/refresh|auth\/logout))/g, 'apiFetch($1');
s = s.replace(/await fetch\(url,/g, 'await apiFetch(url,');
s = s.replace(/\bapiFetch\(`\$\{API_URL\}\/auth\/me`, \{ headers \}\)/, 'apiFetch(`${API_URL}/auth/me`)');

// D. state
rep(
  "  const [projects, setProjects] = useState<Project[]>([]);",
  `  const [projects, setProjects] = useState<Project[]>([]); // current page on the Projects screen
  const [allProjects, setAllProjects] = useState<Project[]>([]); // full list for dropdowns / names
  const [projectSort, setProjectSort] = useState('createdAt:desc');
  const [projectPage, setProjectPage] = useState(1);
  const [projectTotal, setProjectTotal] = useState(0);
  const [taskSort, setTaskSort] = useState('createdAt:desc');
  const [taskPage, setTaskPage] = useState(1);
  const [taskTotal, setTaskTotal] = useState(0);`,
);

// E. effects: refetch on filter / sort / page changes
rep(
  `  useEffect(() => {
    if (token) loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskStatus, taskPriority, taskProject]);

  useEffect(() => {
    if (token) loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectStatus]);`,
  `  useEffect(() => {
    setTaskPage(1);
  }, [taskStatus, taskPriority, taskProject, taskSort]);

  useEffect(() => {
    if (token) loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskStatus, taskPriority, taskProject, taskSort, taskPage]);

  useEffect(() => {
    setProjectPage(1);
  }, [projectStatus, projectSort]);

  useEffect(() => {
    if (token) loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectStatus, projectSort, projectPage]);`,
);

// F. auth: validation + keep refresh token
rep(
  "    setLoading(true);\n    setError('');\n\n    try {\n      const response = await fetch(`${API_URL}/auth/${authMode}`",
  "    setError('');\n\n    if (authMode === 'register') {\n      const check = validateRegister({ fullName, email, password });\n      if (!check.ok) {\n        setError(check.message);\n        return;\n      }\n    }\n\n    setLoading(true);\n\n    try {\n      const response = await fetch(`${API_URL}/auth/${authMode}`",
);
rep(
  "      localStorage.setItem('token', data.token);\n      setPassword('');",
  "      localStorage.setItem('token', data.token);\n      localStorage.setItem('refreshToken', data.refreshToken ?? '');\n      setPassword('');",
);

// G. logout revokes the refresh token on the server
rep(
  `    if (token) {
      // Stateless JWT: server call is informational; the token is discarded client-side.
      fetch(\`\${API_URL}/auth/logout\`, { method: 'POST' }).catch(() => {});
    }
    localStorage.removeItem('token');`,
  `    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      // Revokes the refresh token on the server (real logout); failures are ignored.
      fetch(\`\${API_URL}/auth/logout\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');`,
);

// H. initial load: tasks page 1 with total, all projects for dropdowns
rep("apiFetch(`${API_URL}/tasks`, { headers })", "apiFetch(`${API_URL}/tasks?page=1&limit=${PAGE_SIZE}`, { headers })");
rep(
  "      setProjects(projectsData);\n      setTasks(tasksData);",
  "      setAllProjects(projectsData);\n      setProjects(projectsData.slice(0, PAGE_SIZE));\n      setProjectTotal(projectsData.length);\n      setTasks(tasksData);\n      setTaskTotal(Number(tasksResponse.headers.get('X-Total-Count') ?? tasksData.length));",
);

// I. loadProjects with paging + sorting; refresh the full list after changes
rep(
  "      if (projectStatus) {\n        params.append('status', projectStatus);\n      }\n",
  "      if (projectStatus) {\n        params.append('status', projectStatus);\n      }\n\n      const [pSortBy, pOrder] = projectSort.split(':');\n      params.append('sortBy', pSortBy);\n      params.append('order', pOrder);\n      params.append('page', String(projectPage));\n      params.append('limit', String(PAGE_SIZE));\n",
);
rep(
  "      const data = await response.json();\n      setProjects(data);",
  "      const data = await response.json();\n      setProjects(data);\n      setProjectTotal(Number(response.headers.get('X-Total-Count') ?? data.length));",
);
rep(
  "  function openCreateProject() {",
  `  async function refreshAllProjects() {
    try {
      const response = await apiFetch(\`\${API_URL}/projects\`);
      if (response.ok) setAllProjects(await response.json());
    } catch {
      // keep the previous list
    }
  }

  function openCreateProject() {`,
);
rep("await loadProjects();", "await loadProjects();\n      await refreshAllProjects();", true);

// J. loadTasks with paging + sorting
rep(
  "      if (taskProject) {\n        params.append('projectId', taskProject);\n      }\n",
  "      if (taskProject) {\n        params.append('projectId', taskProject);\n      }\n\n      const [tSortBy, tOrder] = taskSort.split(':');\n      params.append('sortBy', tSortBy);\n      params.append('order', tOrder);\n      params.append('page', String(taskPage));\n      params.append('limit', String(PAGE_SIZE));\n",
);

// K. client-side validation (same rules as the backend, shared with mobile)
rep(
  "  async function saveProject(event: FormEvent) {\n    event.preventDefault();",
  "  async function saveProject(event: FormEvent) {\n    event.preventDefault();\n\n    const projectCheck = validateProject({\n      name: projectForm.name,\n      startDate: projectForm.startDate,\n      endDate: projectForm.endDate,\n    });\n    if (!projectCheck.ok) {\n      setError(projectCheck.message);\n      return;\n    }",
);
rep(
  "  async function saveTask(event: FormEvent) {\n    event.preventDefault();",
  "  async function saveTask(event: FormEvent) {\n    event.preventDefault();\n\n    const taskCheck = validateTask({\n      name: taskForm.name,\n      projectId: taskForm.projectId,\n      dueDate: taskForm.dueDate,\n    });\n    if (!taskCheck.ok) {\n      setError(taskCheck.message);\n      return;\n    }",
);

// L. projects list for dropdowns / dashboard = full list
rep("                projects={projects}\n                projectSearch", "                projects={projects}\n                projectSort={projectSort}\n                setProjectSort={setProjectSort}\n                projectPage={projectPage}\n                setProjectPage={setProjectPage}\n                projectTotal={projectTotal}\n                projectSearch");
rep("        projects.length > 0\n          ? String(projects[0].id)", "        allProjects.length > 0\n          ? String(allProjects[0].id)");
rep("                  {projects.map((project) => (\n                    <option", "                  {allProjects.map((project) => (\n                    <option");

// M. page components: sort + pager
rep(
  "                taskProject={taskProject}\n                setTaskProject={setTaskProject}\n",
  "                taskProject={taskProject}\n                setTaskProject={setTaskProject}\n                taskSort={taskSort}\n                setTaskSort={setTaskSort}\n                taskPage={taskPage}\n                setTaskPage={setTaskPage}\n                taskTotal={taskTotal}\n",
);
fs.writeFileSync(file, s);
console.log('stage 1 ok');
