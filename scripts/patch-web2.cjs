// Second stage of the web patch: UI pieces (sort, pager, activity + admin pages).
const fs = require('fs');
const file = 'C:/ProjectFlow-submission/frontend/app/page.tsx';
let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => {
  if (!s.includes(a)) throw new Error('missing anchor: ' + a.slice(0, 90));
  s = s.replace(a, b);
};

// call sites: dashboard + tasks page use the full project list
rep('dashboard={dashboard}\n                projects={projects}', 'dashboard={dashboard}\n                projects={allProjects}');
rep('<TasksPage\n                tasks={tasks}\n                projects={projects}', '<TasksPage\n                tasks={tasks}\n                projects={allProjects}');

// ProjectsPage props
rep('  projects,\n  projectSearch,', '  projects,\n  projectSort,\n  setProjectSort,\n  projectPage,\n  setProjectPage,\n  projectTotal,\n  projectSearch,');
rep(
  '  projects: Project[];\n  projectSearch: string;',
  '  projects: Project[];\n  projectSort: string;\n  setProjectSort: (value: string) => void;\n  projectPage: number;\n  setProjectPage: (value: number) => void;\n  projectTotal: number;\n  projectSearch: string;',
);
rep(
  '        <button\n          onClick={loadProjects}',
  '        <SortSelect value={projectSort} onChange={setProjectSort} options={PROJECT_SORTS} />\n\n        <button\n          onClick={() => {\n            setProjectPage(1);\n            loadProjects();\n          }}',
);
rep(
  '          ))\n        )}\n      </div>\n    </>\n  );\n}\n\n// ============================================================\n// TASKS PAGE',
  '          ))\n        )}\n      </div>\n\n      <Pager page={projectPage} total={projectTotal} onChange={setProjectPage} />\n    </>\n  );\n}\n\n// ============================================================\n// TASKS PAGE',
);

// TasksPage props
rep('  setTaskProject,\n  openCreateTask,', '  setTaskProject,\n  taskSort,\n  setTaskSort,\n  taskPage,\n  setTaskPage,\n  taskTotal,\n  openCreateTask,');
rep(
  '  setTaskProject: (value: string) => void;\n  openCreateTask: () => void;',
  '  setTaskProject: (value: string) => void;\n  taskSort: string;\n  setTaskSort: (value: string) => void;\n  taskPage: number;\n  setTaskPage: (value: number) => void;\n  taskTotal: number;\n  openCreateTask: () => void;',
);
rep('md:grid-cols-[1fr_auto_auto_auto_auto]', 'md:grid-cols-[1fr_auto_auto_auto_auto_auto]');
rep(
  '        <button\n          onClick={loadTasks}',
  '        <SortSelect value={taskSort} onChange={setTaskSort} options={TASK_SORTS} />\n\n        <button\n          onClick={() => {\n            setTaskPage(1);\n            loadTasks();\n          }}',
);
rep(
  '          ))\n        )}\n      </div>\n    </>\n  );\n}\n\n// ============================================================\n// SMALL COMPONENTS',
  '          ))\n        )}\n      </div>\n\n      <Pager page={taskPage} total={taskTotal} onChange={setTaskPage} />\n    </>\n  );\n}\n\n// ============================================================\n// SMALL COMPONENTS',
);

// navigation + new pages
rep(
  "{['Dashboard', 'Projects', 'Tasks'].map(",
  "{['Dashboard', 'Projects', 'Tasks', 'Activity', ...(user?.role === 'ADMIN' ? ['Admin'] : [])].map(",
);
rep(
  "            {activePage === 'Tasks' && (",
  "            {activePage === 'Activity' && <ActivityPage />}\n\n            {activePage === 'Admin' && user?.role === 'ADMIN' && <AdminPage />}\n\n            {activePage === 'Tasks' && (",
);

// new components appended at the end of the file
s += `

// ============================================================
// SORT / PAGINATION / ACTIVITY / ADMIN
// ============================================================

function SortSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Sort by"
      className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 outline-none"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

function Pager({
  page,
  total,
  onChange,
  pageSize = PAGE_SIZE,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
  pageSize?: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));

  if (total <= pageSize) {
    return (
      <p className="mt-4 text-xs text-zinc-600">
        {total} {total === 1 ? 'item' : 'items'}
      </p>
    );
  }

  return (
    <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
      <span>
        Page {page} of {pages} · {total} items
      </span>

      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-lg border border-zinc-700 px-4 py-2 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <button
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="rounded-lg border border-zinc-700 px-4 py-2 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

const ACTIVITY_PAGE_SIZE = 10;

function ActivityPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const response = await apiFetch(
          \`\${API_URL}/audit-logs?page=\${page}&limit=\${ACTIVITY_PAGE_SIZE}\`,
        );
        if (!response.ok) throw new Error('failed');
        const data = await response.json();
        if (cancelled) return;
        setEntries(data);
        setTotal(Number(response.headers.get('X-Total-Count') ?? data.length));
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <>
      <div className="mb-8">
        <p className="text-sm text-zinc-500">Audit log</p>
        <h3 className="mt-1 text-3xl font-bold">Activity</h3>
        <p className="mt-2 text-sm text-zinc-500">
          A record of what happened on your account: sign-ins and every create, update, complete and delete.
        </p>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading activity...</p>}
      {failed && <EmptyState message="Could not load activity." />}
      {!loading && !failed && entries.length === 0 && <EmptyState message="No activity yet." />}

      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <span className="mr-3 rounded-md bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-300">
                {entry.action}
              </span>
              <span className="text-sm">
                {entry.entity}
                {entry.details ? \`: \${entry.details}\` : ''}
              </span>
            </div>
            <span className="text-xs text-zinc-500">
              {new Date(entry.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <Pager page={page} total={total} onChange={setPage} pageSize={ACTIVITY_PAGE_SIZE} />
    </>
  );
}

type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { projects: number; tasks: number };
};

function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState('Loading users...');

  useEffect(() => {
    (async () => {
      try {
        const response = await apiFetch(\`\${API_URL}/admin/users\`);
        if (!response.ok) throw new Error('failed');
        setUsers(await response.json());
        setMessage('');
      } catch {
        setMessage('Could not load users.');
      }
    })();
  }, []);

  return (
    <>
      <div className="mb-8">
        <p className="text-sm text-zinc-500">Administrator only</p>
        <h3 className="mt-1 text-3xl font-bold">Users</h3>
      </div>

      {message && <p className="text-sm text-zinc-500">{message}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Projects</th>
              <th className="px-4 py-3">Tasks</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-zinc-800">
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u._count.projects}</td>
                <td className="px-4 py-3">{u._count.tasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
`;
fs.writeFileSync(file, s);
console.log('stage 2 ok');
