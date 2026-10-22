# ProjectFlow — Project Management System

Full-stack project & task manager: a **Next.js** web app and an **Expo / React Native** Android app sharing one **NestJS** REST API and one **PostgreSQL** database. Same account works on web and mobile.

## Live deployment
- Web app: https://projectflow-web-tau.vercel.app
- API: https://projectflow-api-virid.vercel.app/api (health check: `GET /api`)
- Android APK (EAS build): https://expo.dev/accounts/adityapartha/projects/project-management-mobile/builds/a179e36a-a3d4-4c4c-afec-7ed6c662bbf7
- Demo login (seeded through the API): `demo@projectflow.test` / `DemoPass#2026`
- Database: hosted PostgreSQL (Prisma Postgres). Both apps are hosted on Vercel; the API runs as a serverless function.

## Features
- Register / login / logout, bcrypt-hashed passwords, JWT with expiry
- Projects: CRUD, status (Not Started / In Progress / Completed), dates, search by name, filter by status
- Tasks: CRUD, priority (Low/Medium/High), status (Pending/In Progress/Completed), due date, mark complete, search + status/priority filters
- Dashboard with live DB counts (projects, tasks, completed, pending, projects in progress)
- Mobile: SecureStore token storage, session restore, 401 → session-expired + redirect to login, pull-to-refresh, loading / empty / error states
- Bonus features: pagination, sorting, audit log (Activity page), roles (USER/ADMIN + admin page), refresh tokens with server-side logout, mobile offline cache, due-tomorrow reminders, shared types/validation. See [docs/BONUS_FEATURES.md](docs/BONUS_FEATURES.md)
- Per-user data isolation on every endpoint, DTO validation, rate limiting

## Tech stack
| Layer | Tech |
|---|---|
| Backend | NestJS 12, Prisma 6, PostgreSQL, Passport-JWT, bcrypt, class-validator, custom in-memory rate-limit guard (ESM) |
| Web | Next.js 16, React 19, Tailwind 4 |
| Mobile | Expo 58, Expo Router, React Native 0.88, TypeScript, expo-secure-store |

## Architecture
```
 Next.js web ──┐
               ├── HTTPS/JSON + Bearer JWT ──> NestJS API (/api) ──Prisma──> PostgreSQL
 Expo Android ─┘
```

## Folder structure
```
backend/    NestJS API (src/auth, projects, tasks, dashboard, prisma) + prisma/schema & migrations + scripts/
frontend/   Next.js web app (app/page.tsx)
mobile/     Expo app (src/app screens, src/services API layer, src/context auth)
docs/       API.md, ER-DIAGRAM.md
render.yaml Render blueprint (API + Postgres)
```

## Prerequisites
Node.js 22+, PostgreSQL 14+, (mobile) Expo Go or an Android device/emulator, (APK) an Expo account.

## Installation & database setup
```bash
cd backend && npm install            # also runs prisma generate
cp .env.example .env                 # then edit DATABASE_URL and JWT_SECRET
npx prisma migrate deploy            # creates tables from backend/prisma/migrations
cd ../frontend && npm install
cd ../mobile && npm install
```

## Environment variables
| App | Variable | Purpose |
|---|---|---|
| backend | `DATABASE_URL` | PostgreSQL connection string (secret) |
| backend | `JWT_SECRET` | JWT signing key (secret, required — server refuses to start without it) |
| backend | `JWT_EXPIRES_IN` | access-token lifetime, default `1h` |
| backend | `REFRESH_TOKEN_DAYS` | refresh-token lifetime, default `7` |
| backend | `ADMIN_EMAILS` | comma-separated emails that become ADMIN when they register |
| backend | `PORT` | default `5000` |
| backend | `CORS_ORIGIN` | comma-separated allowed web origins, `*` = any |
| backend | `RATE_LIMIT_PER_MINUTE`, `AUTH_RATE_LIMIT_PER_MINUTE` | defaults 120 / 20 |
| frontend | `NEXT_PUBLIC_API_URL` | public API base URL, e.g. `http://localhost:5000/api` |
| mobile | `EXPO_PUBLIC_API_URL` | public API base URL (never put secrets in `EXPO_PUBLIC_*`) |

Copy each `.env.example`; real `.env*` files are git-ignored.

## Run locally
```bash
cd backend  && npm run build && npm run start:prod    # or: npm run start:dev   (http://localhost:5000/api)
cd frontend && npm run dev                            # http://localhost:3000
cd mobile   && npx expo start                         # set EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:5000/api first
```
Demo data (via the real API): `cd backend && npm run seed:demo`. API smoke test (40 checks): `npm run test:api`.

## API endpoints
Summary — full request/response docs in [docs/API.md](docs/API.md).
`POST /api/auth/register|login|logout`, `GET /api/auth/me`, `GET|POST /api/projects`, `GET|PUT|DELETE /api/projects/:id`, `GET|POST /api/tasks`, `GET|PUT|DELETE /api/tasks/:id`, `GET /api/dashboard`, `GET /api` (health).

## Database (ER diagram)
```mermaid
erDiagram
    User ||--o{ Project : owns
    User ||--o{ Task : owns
    Project ||--o{ Task : contains
    User { int id PK
      string fullName
      string email UK
      string password
      datetime createdAt }
    Project { int id PK
      string name
      enum status
      datetime startDate
      datetime endDate
      int userId FK }
    Task { int id PK
      string name
      enum priority
      enum status
      datetime dueDate
      int projectId FK
      int userId FK }
```
Details: [docs/ER-DIAGRAM.md](docs/ER-DIAGRAM.md). All foreign keys cascade on delete.

## Authentication
Login/register return a JWT (`sub` = user id). Clients send `Authorization: Bearer <token>`. Web keeps the token in `localStorage`; Android keeps it in `expo-secure-store` (Keystore-backed), web-preview falls back to `localStorage`. Logout is client-side token disposal (stateless JWT).

## Security
bcrypt (cost 10) · JWT secret from env, expiry enforced, malformed/expired/wrong-signature tokens → 401 · every project/task query is scoped by `userId` (foreign records return 404) · global `ValidationPipe` (whitelist + forbidNonWhitelisted + transform) · enum-validated query params · Prisma parameterised queries (no raw SQL) · passwords never serialized · CORS configurable · throttling (global + stricter on auth) · secrets only in environment variables.

## Android APK build
```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview   # produces an installable .apk
```
`eas.json` preview profile uses `buildType: apk`. The `preview` profile already sets `EXPO_PUBLIC_API_URL` to the deployed HTTPS API. To test against a LAN backend instead, run Expo Go with `EXPO_PUBLIC_API_URL=http://<LAN-IP>:5000/api`.

## Deployment
Both projects are deployed with the Vercel CLI (`vercel deploy --prod` from `backend/` and from `frontend/`).
1. **Database**: any PostgreSQL. Run `DATABASE_URL=... npx prisma migrate deploy` once.
2. **API** (`backend/`): Vercel env vars `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (the web URL). The backend is native ESM, `engines.node` is 22.x and `prisma generate` runs in the build. `render.yaml` is an alternative blueprint for Render.
3. **Web** (`frontend/`): env var `NEXT_PUBLIC_API_URL=https://<api-host>/api`.
4. **Mobile**: `EXPO_PUBLIC_API_URL` (already set for the `preview` EAS profile and used as the in-code default).

The rate limiter keeps counters in memory per server instance (fine for this assessment; use Redis for multi-instance production).

## Demo flow
See [DEMO.md](DEMO.md).

## Known limitations
- Logout does not revoke tokens server-side (stateless JWT; tokens expire after 1 day).
- Backend Jest scaffold specs are not runnable under the current ESM/Jest config; verification is via `npm run test:api`.
- Web UI is a single-page client component (`frontend/app/page.tsx`).
- The free hosted database may be a temporary Prisma Postgres instance; claim it (link in FINAL_STATUS.md) or point `DATABASE_URL` at another PostgreSQL.
