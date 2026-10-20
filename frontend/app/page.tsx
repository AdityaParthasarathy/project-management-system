'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type User = {
  id: number;
  fullName: string;
  email: string;
};

type DashboardData = {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
};

type Project = {
  id: number;
  name: string;
  description: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startDate: string | null;
  endDate: string | null;
};

type Task = {
  id: number;
  name: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string | null;
  projectId: number;
};

type ProjectForm = {
  name: string;
  description: string;
  status: Project['status'];
  startDate: string;
  endDate: string;
};

type TaskForm = {
  name: string;
  description: string;
  priority: Task['priority'];
  status: Task['status'];
  dueDate: string;
  projectId: string;
};

const emptyProjectForm: ProjectForm = {
  name: '',
  description: '',
  status: 'NOT_STARTED',
  startDate: '',
  endDate: '',
};

const emptyTaskForm: TaskForm = {
  name: '',
  description: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  dueDate: '',
  projectId: '',
};

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [activePage, setActivePage] = useState('Dashboard');

  // ---------------- PROJECT STATE ----------------

  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatus, setProjectStatus] = useState('');

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [projectForm, setProjectForm] =
    useState<ProjectForm>(emptyProjectForm);

  const [projectLoading, setProjectLoading] = useState(false);

  // ---------------- TASK STATE ----------------

  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [taskPriority, setTaskPriority] = useState('');
  const [taskProject, setTaskProject] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [taskForm, setTaskForm] =
    useState<TaskForm>(emptyTaskForm);

  const [taskLoading, setTaskLoading] = useState(false);

  // ---------------- INITIAL LOAD ----------------

  useEffect(() => {
    const savedToken = localStorage.getItem('token');

    if (savedToken) {
      setToken(savedToken);
      loadUserData(savedToken);
    }
  }, []);

  // Re-fetch whenever a filter dropdown changes (avoids stale-state lag).
  useEffect(() => {
    if (token) loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskStatus, taskPriority, taskProject]);

  useEffect(() => {
    if (token) loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectStatus]);

  // ---------------- AUTH ----------------

  async function submitAuth(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/${authMode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          authMode === 'register'
            ? { fullName, email, password }
            : { email, password },
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(
          message ||
            (authMode === 'register' ? 'Registration failed' : 'Login failed'),
        );
      }

      localStorage.setItem('token', data.token);
      setPassword('');

      setToken(data.token);
      setUser(data.user);

      await loadUserData(data.token);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to server',
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadUserData(authToken: string) {
    try {
      const headers = {
        Authorization: `Bearer ${authToken}`,
      };

      const [
        meResponse,
        dashboardResponse,
        projectsResponse,
        tasksResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/auth/me`, { headers }),
        fetch(`${API_URL}/dashboard`, { headers }),
        fetch(`${API_URL}/projects`, { headers }),
        fetch(`${API_URL}/tasks`, { headers }),
      ]);

      if (
        meResponse.status === 401 ||
        dashboardResponse.status === 401 ||
        projectsResponse.status === 401 ||
        tasksResponse.status === 401
      ) {
        logout();
        return;
      }

      const meData = await meResponse.json();
      const dashboardData = await dashboardResponse.json();
      const projectsData = await projectsResponse.json();
      const tasksData = await tasksResponse.json();

      setUser(meData);
      setDashboard(dashboardData);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch {
      setError(
        'Unable to connect to the backend. Make sure NestJS is running.',
      );
    }
  }

  async function loadDashboard() {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();
      setDashboard(data);
    } catch {
      // Do not break the UI if dashboard refresh fails.
    }
  }

  function logout() {
    if (token) {
      // Stateless JWT: server call is informational; the token is discarded client-side.
      fetch(`${API_URL}/auth/logout`, { method: 'POST' }).catch(() => {});
    }
    localStorage.removeItem('token');

    setToken(null);
    setUser(null);
    setDashboard(null);
    setProjects([]);
    setTasks([]);
  }

  // ============================================================
  // PROJECTS
  // ============================================================

  async function loadProjects() {
    if (!token) return;

    try {
      const params = new URLSearchParams();

      if (projectSearch.trim()) {
        params.append('search', projectSearch.trim());
      }

      if (projectStatus) {
        params.append('status', projectStatus);
      }

      const query = params.toString();

      const response = await fetch(
        `${API_URL}/projects${query ? `?${query}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load projects',
      );
    }
  }

  function openCreateProject() {
    setEditingProject(null);
    setProjectForm(emptyProjectForm);
    setShowProjectModal(true);
    setError('');
  }

  function openEditProject(project: Project) {
    setEditingProject(project);

    setProjectForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate
        ? project.startDate.substring(0, 10)
        : '',
      endDate: project.endDate
        ? project.endDate.substring(0, 10)
        : '',
    });

    setShowProjectModal(true);
    setError('');
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault();

    if (!token) return;

    setProjectLoading(true);
    setError('');

    try {
      const url = editingProject
        ? `${API_URL}/projects/${editingProject.id}`
        : `${API_URL}/projects`;

      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectForm.name,
          description: projectForm.description || undefined,
          status: projectForm.status,
          startDate: projectForm.startDate || undefined,
          endDate: projectForm.endDate || undefined,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Failed to save project',
        );
      }

      setShowProjectModal(false);
      setEditingProject(null);
      setProjectForm(emptyProjectForm);

      await loadProjects();
      await loadDashboard();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save project',
      );
    } finally {
      setProjectLoading(false);
    }
  }

  async function deleteProject(projectId: number) {
    if (!token) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this project?',
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.message || 'Failed to delete project',
        );
      }

      await loadProjects();
      await loadUserData(token);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete project',
      );
    }
  }

  // ============================================================
  // TASKS
  // ============================================================

  async function loadTasks() {
    if (!token) return;

    try {
      const params = new URLSearchParams();

      if (taskSearch.trim()) {
        params.append('search', taskSearch.trim());
      }

      if (taskStatus) {
        params.append('status', taskStatus);
      }

      if (taskPriority) {
        params.append('priority', taskPriority);
      }

      if (taskProject) {
        params.append('projectId', taskProject);
      }

      const query = params.toString();

      const response = await fetch(
        `${API_URL}/tasks${query ? `?${query}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load tasks',
      );
    }
  }

  function openCreateTask() {
    setEditingTask(null);

    setTaskForm({
      ...emptyTaskForm,
      projectId:
        projects.length > 0
          ? String(projects[0].id)
          : '',
    });

    setShowTaskModal(true);
    setError('');
  }

  function openEditTask(task: Task) {
    setEditingTask(task);

    setTaskForm({
      name: task.name,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate
        ? task.dueDate.substring(0, 10)
        : '',
      projectId: String(task.projectId),
    });

    setShowTaskModal(true);
    setError('');
  }

  async function saveTask(event: FormEvent) {
    event.preventDefault();

    if (!token) return;

    if (!taskForm.projectId) {
      setError('Please select a project.');
      return;
    }

    setTaskLoading(true);
    setError('');

    try {
      const url = editingTask
        ? `${API_URL}/tasks/${editingTask.id}`
        : `${API_URL}/tasks`;

      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: taskForm.name,
          description:
            taskForm.description || undefined,
          priority: taskForm.priority,
          status: taskForm.status,
          dueDate: taskForm.dueDate || undefined,
          projectId: Number(taskForm.projectId),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Failed to save task',
        );
      }

      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm(emptyTaskForm);

      await loadTasks();
      await loadDashboard();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save task',
      );
    } finally {
      setTaskLoading(false);
    }
  }

  async function deleteTask(taskId: number) {
    if (!token) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this task?',
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/tasks/${taskId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.message || 'Failed to delete task',
        );
      }

      await loadTasks();
      await loadDashboard();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete task',
      );
    }
  }

  async function markTaskComplete(task: Task) {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/tasks/${task.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: 'COMPLETED',
          }),
        },
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.message || 'Failed to complete task',
        );
      }

      await loadTasks();
      await loadDashboard();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to complete task',
      );
    }
  }

  // ============================================================
  // LOGIN SCREEN
  // ============================================================

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-black">
              PF
            </div>

            <h1 className="text-3xl font-bold">
              Welcome to ProjectFlow
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              {authMode === 'login'
                ? 'Sign in to manage your projects and tasks.'
                : 'Create an account to get started.'}
            </p>
          </div>

          <form
            onSubmit={submitAuth}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7"
          >
            <div className="space-y-5">
              {authMode === 'register' && (
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Full name
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
                    placeholder="Jane Doe"
                    maxLength={100}
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
                  placeholder="••••••••"
                  minLength={authMode === 'register' ? 6 : undefined}
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="w-full text-center text-sm text-zinc-400 transition hover:text-white"
              >
                {authMode === 'login'
                  ? "Don't have an account? Register"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // ============================================================
  // MAIN APP
  // ============================================================

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-zinc-800 bg-zinc-950 p-6 md:block">
          <div className="mb-10">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-black">
              PF
            </div>

            <h1 className="text-xl font-bold">
              ProjectFlow
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Project Management
            </p>
          </div>

          <nav className="space-y-2">
            {['Dashboard', 'Projects', 'Tasks'].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setActivePage(item)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                    activePage === item
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </nav>

          <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-sm font-medium">
              {user?.fullName}
            </p>

            <p className="mt-1 truncate text-xs text-zinc-500">
              {user?.email}
            </p>
          </div>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-10">
            <div>
              <p className="text-sm text-zinc-500">
                Workspace
              </p>

              <h2 className="text-xl font-semibold">
                {activePage}
              </h2>
            </div>

            <button
              onClick={logout}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              Logout
            </button>
          </header>

          <div className="p-6 md:p-10">
            {activePage === 'Dashboard' && (
              <Dashboard
                user={user}
                dashboard={dashboard}
                projects={projects}
                setActivePage={setActivePage}
              />
            )}

            {activePage === 'Projects' && (
              <ProjectsPage
                projects={projects}
                projectSearch={projectSearch}
                setProjectSearch={setProjectSearch}
                projectStatus={projectStatus}
                setProjectStatus={setProjectStatus}
                openCreateProject={openCreateProject}
                openEditProject={openEditProject}
                deleteProject={deleteProject}
                loadProjects={loadProjects}
              />
            )}

            {activePage === 'Tasks' && (
              <TasksPage
                tasks={tasks}
                projects={projects}
                taskSearch={taskSearch}
                setTaskSearch={setTaskSearch}
                taskStatus={taskStatus}
                setTaskStatus={setTaskStatus}
                taskPriority={taskPriority}
                setTaskPriority={setTaskPriority}
                taskProject={taskProject}
                setTaskProject={setTaskProject}
                openCreateTask={openCreateTask}
                openEditTask={openEditTask}
                deleteTask={deleteTask}
                markTaskComplete={markTaskComplete}
                loadTasks={loadTasks}
              />
            )}
          </div>
        </section>
      </div>

      {/* PROJECT MODAL */}

      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  {editingProject
                    ? 'Edit Project'
                    : 'Create Project'}
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  {editingProject
                    ? 'Update project details.'
                    : 'Add a new project to your workspace.'}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowProjectModal(false)
                }
                className="text-xl text-zinc-500 hover:text-white"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={saveProject}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Project name
                </label>

                <input
                  value={projectForm.name}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                  placeholder="Website redesign"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Description
                </label>

                <textarea
                  value={projectForm.description}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                  placeholder="What is this project about?"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Status
                </label>

                <select
                  value={projectForm.status}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      status:
                        event.target
                          .value as Project['status'],
                    })
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                >
                  <option value="NOT_STARTED">
                    Not Started
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Start date
                  </label>

                  <input
                    type="date"
                    value={projectForm.startDate}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        startDate: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    End date
                  </label>

                  <input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        endDate: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowProjectModal(false)
                  }
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 hover:bg-zinc-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={projectLoading}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                  {projectLoading
                    ? 'Saving...'
                    : editingProject
                      ? 'Save Changes'
                      : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  {editingTask
                    ? 'Edit Task'
                    : 'Create Task'}
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  {editingTask
                    ? 'Update task details.'
                    : 'Add a new task to a project.'}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowTaskModal(false)
                }
                className="text-xl text-zinc-500 hover:text-white"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={saveTask}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Task name
                </label>

                <input
                  value={taskForm.name}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                  placeholder="Design login page"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Description
                </label>

                <textarea
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                  placeholder="Describe what needs to be done..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Project
                </label>

                <select
                  value={taskForm.projectId}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      projectId: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                  required
                >
                  <option value="">
                    Select a project
                  </option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Priority
                  </label>

                  <select
                    value={taskForm.priority}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        priority:
                          event.target
                            .value as Task['priority'],
                      })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Status
                  </label>

                  <select
                    value={taskForm.status}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        status:
                          event.target
                            .value as Task['status'],
                      })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                  >
                    <option value="PENDING">
                      Pending
                    </option>

                    <option value="IN_PROGRESS">
                      In Progress
                    </option>

                    <option value="COMPLETED">
                      Completed
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Due date
                </label>

                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      dueDate: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowTaskModal(false)
                  }
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 hover:bg-zinc-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={taskLoading}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                  {taskLoading
                    ? 'Saving...'
                    : editingTask
                      ? 'Save Changes'
                      : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({
  user,
  dashboard,
  projects,
  setActivePage,
}: {
  user: User | null;
  dashboard: DashboardData | null;
  projects: Project[];
  setActivePage: (page: string) => void;
}) {
  return (
    <>
      <div className="mb-8">
        <p className="text-sm text-zinc-500">
          Welcome back, {user?.fullName}
        </p>

        <h3 className="mt-1 text-3xl font-bold">
          Here&apos;s your overview.
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={dashboard?.totalProjects ?? 0}
        />

        <StatCard
          label="Total Tasks"
          value={dashboard?.totalTasks ?? 0}
        />

        <StatCard
          label="Completed Tasks"
          value={dashboard?.completedTasks ?? 0}
        />

        <StatCard
          label="Projects In Progress"
          value={dashboard?.projectsInProgress ?? 0}
        />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Recent Projects
          </h3>

          <button
            onClick={() => setActivePage('Projects')}
            className="text-sm text-zinc-400 hover:text-white"
          >
            View all →
          </button>
        </div>

        <div className="space-y-3">
          {projects.slice(0, 5).map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <div>
                <h4 className="font-medium">
                  {project.name}
                </h4>

                <p className="mt-1 text-sm text-zinc-500">
                  {project.description ||
                    'No description'}
                </p>
              </div>

              <StatusBadge status={project.status} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ============================================================
// PROJECTS PAGE
// ============================================================

function ProjectsPage({
  projects,
  projectSearch,
  setProjectSearch,
  projectStatus,
  setProjectStatus,
  openCreateProject,
  openEditProject,
  deleteProject,
  loadProjects,
}: {
  projects: Project[];
  projectSearch: string;
  setProjectSearch: (value: string) => void;
  projectStatus: string;
  setProjectStatus: (value: string) => void;
  openCreateProject: () => void;
  openEditProject: (project: Project) => void;
  deleteProject: (id: number) => void;
  loadProjects: () => void;
}) {
  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            Workspace
          </p>

          <h3 className="mt-1 text-3xl font-bold">
            Projects
          </h3>
        </div>

        <button
          onClick={openCreateProject}
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          + New Project
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <input
          value={projectSearch}
          onChange={(event) =>
            setProjectSearch(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              loadProjects();
            }
          }}
          placeholder="Search projects..."
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-500"
        />

        <select
          value={projectStatus}
          onChange={(event) => {
            setProjectStatus(event.target.value);

            setTimeout(() => {
              loadProjects();
            }, 0);
          }}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-zinc-500"
        >
          <option value="">All Status</option>

          <option value="NOT_STARTED">
            Not Started
          </option>

          <option value="IN_PROGRESS">
            In Progress
          </option>

          <option value="COMPLETED">
            Completed
          </option>
        </select>

        <button
          onClick={loadProjects}
          className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Search
        </button>
      </div>

      <div className="space-y-3">
        {projects.length === 0 ? (
          <EmptyState message="No projects found." />
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">
                      {project.name}
                    </h4>

                    <StatusBadge
                      status={project.status}
                    />
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    {project.description ||
                      'No description'}
                  </p>

                  {(project.startDate ||
                    project.endDate) && (
                    <p className="mt-3 text-xs text-zinc-600">
                      {project.startDate
                        ? `Start: ${formatDate(project.startDate)}`
                        : ''}

                      {project.startDate &&
                      project.endDate
                        ? ' · '
                        : ''}

                      {project.endDate
                        ? `End: ${formatDate(project.endDate)}`
                        : ''}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      openEditProject(project)
                    }
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteProject(project.id)
                    }
                    className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ============================================================
// TASKS PAGE
// ============================================================

function TasksPage({
  tasks,
  projects,
  taskSearch,
  setTaskSearch,
  taskStatus,
  setTaskStatus,
  taskPriority,
  setTaskPriority,
  taskProject,
  setTaskProject,
  openCreateTask,
  openEditTask,
  deleteTask,
  markTaskComplete,
  loadTasks,
}: {
  tasks: Task[];
  projects: Project[];
  taskSearch: string;
  setTaskSearch: (value: string) => void;
  taskStatus: string;
  setTaskStatus: (value: string) => void;
  taskPriority: string;
  setTaskPriority: (value: string) => void;
  taskProject: string;
  setTaskProject: (value: string) => void;
  openCreateTask: () => void;
  openEditTask: (task: Task) => void;
  deleteTask: (id: number) => void;
  markTaskComplete: (task: Task) => void;
  loadTasks: () => void;
}) {
  function getProjectName(projectId: number) {
    return (
      projects.find((project) => project.id === projectId)
        ?.name || 'Unknown Project'
    );
  }

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            Workspace
          </p>

          <h3 className="mt-1 text-3xl font-bold">
            Tasks
          </h3>
        </div>

        <button
          onClick={openCreateTask}
          disabled={projects.length === 0}
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + New Task
        </button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
        <input
          value={taskSearch}
          onChange={(event) =>
            setTaskSearch(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              loadTasks();
            }
          }}
          placeholder="Search tasks..."
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-500"
        />

        <select
          value={taskProject}
          onChange={(event) => setTaskProject(event.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 outline-none"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <select
          value={taskStatus}
          onChange={(event) => {
            setTaskStatus(event.target.value);

            setTimeout(() => {
              loadTasks();
            }, 0);
          }}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 outline-none"
        >
          <option value="">All Status</option>

          <option value="PENDING">
            Pending
          </option>

          <option value="IN_PROGRESS">
            In Progress
          </option>

          <option value="COMPLETED">
            Completed
          </option>
        </select>

        <select
          value={taskPriority}
          onChange={(event) => {
            setTaskPriority(event.target.value);

            setTimeout(() => {
              loadTasks();
            }, 0);
          }}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 outline-none"
        >
          <option value="">All Priority</option>

          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>

        <button
          onClick={loadTasks}
          className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Search
        </button>
      </div>

      {projects.length === 0 && (
        <div className="mb-4 rounded-xl border border-yellow-900/50 bg-yellow-950/20 p-4 text-sm text-yellow-400">
          Create a project before creating a task.
        </div>
      )}

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <EmptyState message="No tasks found." />
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">
                      {task.name}
                    </h4>

                    <PriorityBadge
                      priority={task.priority}
                    />

                    <StatusBadge
                      status={task.status}
                    />
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    {task.description ||
                      'No description'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-600">
                    <span>
                      Project:{' '}
                      {getProjectName(task.projectId)}
                    </span>

                    {task.dueDate && (
                      <span>
                        Due:{' '}
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {task.status !== 'COMPLETED' && (
                    <button
                      onClick={() =>
                        markTaskComplete(task)
                      }
                      className="rounded-lg border border-green-900/50 px-4 py-2 text-sm text-green-400 hover:bg-green-950/30"
                    >
                      Complete
                    </button>
                  )}

                  <button
                    onClick={() =>
                      openEditTask(task)
                    }
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteTask(task.id)
                    }
                    className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <p className="text-sm text-zinc-500">{label}</p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const labels: Record<string, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    PENDING: 'Pending',
  };

  return (
    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
      {labels[status] || status}
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  return (
    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
      {priority}
    </span>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}