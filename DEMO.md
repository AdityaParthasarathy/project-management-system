# 5-Minute Demo

**Before you start**: backend running, web running (`http://localhost:3000`), phone/emulator running the app on the same Wi-Fi (see README → Mobile). Optional: `cd backend && npm run seed:demo` creates `demo@projectflow.test` (password in `backend/scripts/seed-demo.mjs`, override with `DEMO_PASSWORD`) with 3 projects and 6 tasks through the real API. For a from-scratch demo, skip the seed and register a fresh user.

| Time | Step |
|---|---|
| 0:00 | Introduce: Next.js web + Expo Android app, one NestJS REST API, one PostgreSQL database. |
| 0:30 | **Web**: Register a new account (or log in to the seeded one). Mention bcrypt + JWT. |
| 1:00 | Show the **Dashboard** — totals are live DB counts. |
| 1:30 | **Projects** → create "Demo Project" (status *In Progress*, dates). |
| 2:00 | **Tasks** → create a *High* priority task in that project. |
| 2:30 | Edit the task: priority → *Medium*, status → *In Progress*. |
| 3:00 | Mark the task **Completed**. |
| 3:30 | Back to Dashboard: completed / pending / in-progress counts changed. |
| 4:00 | Search a task by name; filter by status and priority; filter projects by status. |
| 4:30 | **Mobile**: log in with the same account, pull-to-refresh — same projects/tasks. Change a task's status on the phone, refresh the web page — it matches. |
| 5:00 | Architecture + security: ownership checks on every route (other users get 404), DTO validation, rate limiting, Prisma parameterised queries, JWT expiry, SecureStore on Android. |

Tip: to show ownership isolation, register a second user — their dashboard is empty.
