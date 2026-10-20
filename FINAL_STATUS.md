# FINAL STATUS

## Project status
**Demo-ready locally; two account-gated steps remain** (public deployment, APK build). Legend: PASS = actually run · CODE = verified by reading code · MANUAL = needs a person/device · BLOCKED = needs credentials.

## Architecture
Next.js web + Expo Android app → NestJS REST API (`/api`) → Prisma → PostgreSQL. JWT bearer auth shared by both clients.

## Completed features
Auth (register/login/logout/me), project CRUD + search/filter, task CRUD + search/status/priority filters + mark complete, live dashboard, web registration screen (added), mobile SecureStore auth restore, 401 handling, pull-to-refresh, loading/empty/error states.

## Changes made in this pass
- Backend dependencies were only declared in a stray root `package.json`; moved into `backend/package.json` (+ `prisma generate` on install/build).
- Activated rate limiting (global 120/min, auth 20/min); `JWT_SECRET` required at startup; configurable JWT expiry and CORS; enum-validated query params (invalid filter → 400 instead of 500); email normalisation; length limits; health endpoint `GET /api`; Nest logger instead of console emoji.
- Web: added registration, removed pre-filled test credentials, fixed page title.
- Mobile: fixed bad-password login showing "session expired"; time-based greeting; removed Expo starter screens/components/assets and debug logging; added Android package id, `eas.json` (APK preview profile), cleartext config for LAN demos; app renamed.
- Added `.env.example` files, `render.yaml`, `scripts/api-smoke-test.mjs`, `scripts/seed-demo.mjs`, README, docs/API.md, docs/ER-DIAGRAM.md, DEMO.md.

## Security
bcrypt PASS · JWT expiry/malformed/wrong-signature → 401 PASS · ownership (A↔B read/update/delete project & task → 404) PASS · DTO validation PASS · rate limiting PASS (429 observed on login after 20/min) · Prisma parameterised queries CODE · password never returned PASS (register/login/me) · secrets only in git-ignored `.env` CODE.

## Test results
- `node scripts/api-smoke-test.mjs` against the running backend: **40/40 PASS** (auth, validation, CRUD, filters, ownership, dashboard, cascade delete).
- Web: registered a new user in the browser and reached the dashboard — PASS. Other web screens: CODE only (not click-tested in this pass).
- Shared web/mobile data: same API/DB, API-level equivalence PASS; native Android device behaviour MANUAL.
- Backend unit tests (`npm test`): **10/10 PASS**. API smoke test now 42/42 (adds per-project task filter).
- `npx expo-doctor`: 20/20 PASS.

## Build results
Backend `npm run build` PASS · Backend `tsc --noEmit` PASS · Frontend `npm run build` PASS · Mobile `npx tsc --noEmit` PASS · Mobile `npx expo export --platform web --output-dir .web-build` PASS · Android APK BLOCKED (EAS not logged in).

## Deployment status
Not deployed (needs Render/Vercel/Neon logins). Config ready: `render.yaml`, env docs in README. Mobile API URL currently the LAN dev URL `http://192.168.29.8:5000/api` (fallback in `mobile/src/services/api.ts`; override with `EXPO_PUBLIC_API_URL`).

## Android APK status
Not built. Ready: `app.json` (package `com.projectmanagement.mobile`), `eas.json` preview=APK. Command: `cd mobile && npx eas-cli@latest login && npx eas-cli@latest build -p android --profile preview`.

## Documentation status
README, docs/API.md, docs/ER-DIAGRAM.md, DEMO.md, `.env.example` (backend, frontend, mobile), this file — done.

## Known limitations
Stateless logout; single-file web UI; stray files at repo root and three nested `.git` folders (see below).

## Human actions required
1. `npx eas-cli@latest login` then run the APK build (Expo account).
2. Deploy: Render blueprint (`render.yaml`) + Vercel for `frontend/` (account logins); then rebuild the APK with the HTTPS `EXPO_PUBLIC_API_URL`.
3. Repo cleanup I was not permitted to do: delete the leftover root-level `package.json`, `package-lock.json`, `prisma7.config.ts`, `prisma/`, `node_modules/` (stray Prisma 7 install; backend no longer uses them). `backend/`, `frontend/`, `mobile/` each contain their own `.git`; remove them (or use submodules) before pushing a single monorepo to GitHub. Rotate the DB password/JWT secret if the root `.env` was ever shared.
4. Physical Android test of the APK.

## Demo instructions
See DEMO.md.
