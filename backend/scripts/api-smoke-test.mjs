// End-to-end API smoke test. Usage: node scripts/api-smoke-test.mjs [baseUrl]
// Creates two throwaway users and exercises auth, CRUD, validation, ownership and the dashboard.
const BASE = process.argv[2] || 'http://localhost:5000/api';
const results = [];
let failed = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}
function check(name, cond, extra = '') {
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`);
  if (!cond) failed++;
}

const stamp = Date.now();
const emailA = `smoke.a.${stamp}@example.com`;
const emailB = `smoke.b.${stamp}@example.com`;
const pw = 'Smoke#Test123';

let r = await call('POST', '/auth/register', { body: { fullName: 'Smoke A', email: emailA, password: pw } });
check('register A -> 201', r.status === 201, r.status);
check('register response has token, no password', !!r.data?.token && !JSON.stringify(r.data).includes('password'));
const a = r.data?.token;
r = await call('POST', '/auth/register', { body: { fullName: 'Smoke B', email: emailB, password: pw } });
const b = r.data?.token;
r = await call('POST', '/auth/register', { body: { fullName: 'Dup', email: emailA, password: pw } });
check('duplicate email -> 409', r.status === 409, r.status);
r = await call('POST', '/auth/register', { body: { fullName: 'X', email: 'bad', password: '1' } });
check('invalid register body -> 400', r.status === 400, r.status);
r = await call('POST', '/auth/register', { body: { fullName: 'X', email: 'x@y.com', password: 'abcdef', role: 'admin' } });
check('unknown field rejected -> 400', r.status === 400, r.status);
r = await call('POST', '/auth/login', { body: { email: emailA, password: 'wrong-password' } });
check('invalid login -> 401', r.status === 401, r.status);
r = await call('POST', '/auth/login', { body: { email: emailA.toUpperCase(), password: pw } });
check('login (case-insensitive email) -> 201', r.status === 201 && !!r.data?.token, r.status);
r = await call('GET', '/auth/me', { token: a });
check('me -> 200 without password', r.status === 200 && r.data?.email === emailA && !('password' in r.data), JSON.stringify(r.data));
r = await call('GET', '/auth/me');
check('me without token -> 401', r.status === 401, r.status);
r = await call('GET', '/auth/me', { token: 'not.a.jwt' });
check('me malformed token -> 401', r.status === 401, r.status);
r = await call('POST', '/auth/logout', { token: a });
check('logout -> 2xx', r.status < 300, r.status);

r = await call('GET', '/projects');
check('projects without token -> 401', r.status === 401, r.status);
r = await call('POST', '/projects', { token: a, body: { name: '' } });
check('project empty name -> 400', r.status === 400, r.status);
r = await call('POST', '/projects', { token: a, body: { name: 'P', status: 'BOGUS' } });
check('project bad enum -> 400', r.status === 400, r.status);
r = await call('POST', '/projects', {
  token: a,
  body: { name: 'Alpha Project', description: 'd', status: 'IN_PROGRESS', startDate: '2026-01-01', endDate: '2026-12-31' },
});
check('create project -> 201', r.status === 201 && r.data?.id, r.status);
const pid = r.data?.id;
r = await call('GET', `/projects/${pid}`, { token: a });
check('get project -> 200', r.status === 200 && r.data?.name === 'Alpha Project');
r = await call('GET', '/projects/abc', { token: a });
check('invalid id -> 400', r.status === 400, r.status);
r = await call('GET', '/projects/99999999', { token: a });
check('missing project -> 404', r.status === 404, r.status);
r = await call('PUT', `/projects/${pid}`, { token: a, body: { name: 'Alpha Renamed', status: 'COMPLETED' } });
check('update project -> 200', r.status === 200 && r.data?.name === 'Alpha Renamed' && r.data?.status === 'COMPLETED', r.status);
r = await call('GET', '/projects?search=renamed&status=COMPLETED', { token: a });
check('project search+filter', r.status === 200 && r.data.length === 1, JSON.stringify(r.data));
r = await call('GET', '/projects?status=NOPE', { token: a });
check('project filter invalid enum -> 400', r.status === 400, r.status);

r = await call('POST', '/tasks', { token: a, body: { name: 'T1', projectId: pid, priority: 'HIGH' } });
check('create task -> 201', r.status === 201 && r.data?.priority === 'HIGH', r.status);
const tid = r.data?.id;
await call('POST', '/tasks', { token: a, body: { name: 'Other', projectId: pid, priority: 'LOW', status: 'IN_PROGRESS' } });
r = await call('POST', '/tasks', { token: a, body: { name: 'T', projectId: pid, priority: 'URGENT' } });
check('task bad priority -> 400', r.status === 400, r.status);
r = await call('POST', '/tasks', { token: a, body: { name: 'T' } });
check('task missing projectId -> 400', r.status === 400, r.status);
r = await call('POST', '/tasks', { token: b, body: { name: 'Steal', projectId: pid } });
check("task in other user's project -> 404", r.status === 404, r.status);
r = await call('PUT', `/tasks/${tid}`, { token: a, body: { status: 'COMPLETED' } });
check('mark complete -> 200', r.status === 200 && r.data?.status === 'COMPLETED', r.status);
r = await call('GET', '/tasks?priority=HIGH&status=COMPLETED&search=t1', { token: a });
check('task search+filters', r.status === 200 && r.data.length === 1, JSON.stringify(r.data));
r = await call('GET', `/tasks?projectId=${pid}`, { token: a });
check('task filter by project', r.status === 200 && r.data.length === 2, JSON.stringify(r.data));
r = await call('GET', '/tasks?projectId=0', { token: a });
check('task filter by other project is empty', r.status === 200 && r.data.length === 0);
r = await call('GET', '/tasks?status=NOPE', { token: a });
check('task filter invalid enum -> 400', r.status === 400, r.status);
r = await call('GET', '/dashboard', { token: a });
check(
  'dashboard real numbers',
  r.status === 200 && r.data.totalProjects === 1 && r.data.totalTasks === 2 && r.data.completedTasks === 1 && r.data.pendingTasks === 0 && r.data.projectsInProgress === 0,
  JSON.stringify(r.data),
);

// ownership
r = await call('GET', `/projects/${pid}`, { token: b });
check('B read A project -> 404', r.status === 404, r.status);
r = await call('PUT', `/projects/${pid}`, { token: b, body: { name: 'hack' } });
check('B update A project -> 404', r.status === 404, r.status);
r = await call('DELETE', `/projects/${pid}`, { token: b });
check('B delete A project -> 404', r.status === 404, r.status);
r = await call('GET', `/tasks/${tid}`, { token: b });
check('B read A task -> 404', r.status === 404, r.status);
r = await call('PUT', `/tasks/${tid}`, { token: b, body: { name: 'hack' } });
check('B update A task -> 404', r.status === 404, r.status);
r = await call('DELETE', `/tasks/${tid}`, { token: b });
check('B delete A task -> 404', r.status === 404, r.status);
r = await call('GET', '/projects', { token: b });
check('B list projects empty', r.status === 200 && r.data.length === 0);
r = await call('GET', '/dashboard', { token: b });
check('B dashboard zeroes', r.data?.totalProjects === 0 && r.data?.totalTasks === 0);

r = await call('DELETE', `/tasks/${tid}`, { token: a });
check('delete task -> 200', r.status === 200, r.status);
r = await call('DELETE', `/projects/${pid}`, { token: a });
check('delete project -> 200 (cascades tasks)', r.status === 200, r.status);
r = await call('GET', '/tasks', { token: a });
check('tasks cascade-deleted', r.status === 200 && r.data.length === 0, JSON.stringify(r.data));

console.log(results.join('\n'));
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
