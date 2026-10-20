// Creates demo data THROUGH THE REST API (no direct DB access).
// Usage: node scripts/seed-demo.mjs [baseUrl]
// Env:   DEMO_EMAIL, DEMO_PASSWORD (defaults are for local demos only - never use for real accounts)
const BASE = process.argv[2] || process.env.API_URL || 'http://localhost:5000/api';
const email = process.env.DEMO_EMAIL || 'demo@projectflow.test';
const password = process.env.DEMO_PASSWORD || 'DemoPass#2026';

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

let r = await call('POST', '/auth/register', { fullName: 'Demo User', email, password });
if (r.status === 409) r = await call('POST', '/auth/login', { email, password });
if (!r.data?.token) {
  console.error('Could not authenticate demo user:', r.status, r.data?.message);
  process.exit(1);
}
const token = r.data.token;

const existing = await call('GET', '/projects', null, token);
if (existing.data?.length) {
  console.log(`Demo user already has ${existing.data.length} project(s); nothing to do.`);
  process.exit(0);
}

const mk = async (path, body) => (await call('POST', path, body, token)).data;

const web = await mk('/projects', { name: 'Website Redesign', description: 'Refresh the marketing site', status: 'IN_PROGRESS', startDate: '2026-09-01', endDate: '2026-12-15' });
const app = await mk('/projects', { name: 'Mobile App Launch', description: 'Ship the Android release', status: 'NOT_STARTED', startDate: '2026-11-01', endDate: '2027-02-01' });
await mk('/projects', { name: 'Onboarding Docs', description: 'Write the team handbook', status: 'COMPLETED', startDate: '2026-06-01', endDate: '2026-08-30' });

const tasks = [
  { name: 'Design homepage mockups', projectId: web.id, priority: 'HIGH', status: 'COMPLETED', dueDate: '2026-10-05' },
  { name: 'Implement responsive layout', projectId: web.id, priority: 'HIGH', status: 'IN_PROGRESS', dueDate: '2026-11-10' },
  { name: 'Write landing page copy', projectId: web.id, priority: 'MEDIUM', status: 'PENDING', dueDate: '2026-11-20' },
  { name: 'Set up analytics', projectId: web.id, priority: 'LOW', status: 'PENDING', dueDate: '2026-12-01' },
  { name: 'Configure EAS builds', projectId: app.id, priority: 'MEDIUM', status: 'PENDING', dueDate: '2026-11-15' },
  { name: 'Prepare store listing', projectId: app.id, priority: 'LOW', status: 'PENDING', dueDate: '2027-01-10' },
];
for (const t of tasks) await mk('/tasks', t);

const dash = await call('GET', '/dashboard', null, token);
console.log('Seeded demo data for', email);
console.log('Dashboard:', JSON.stringify(dash.data));
