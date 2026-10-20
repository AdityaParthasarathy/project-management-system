# FINAL STATUS

Legend: PASS = actually run · CODE = verified by reading code · MANUAL = needs a person/device.

## Live deployment
| Item | Value |
|---|---|
| Web app | https://projectflow-web-tau.vercel.app |
| API | https://projectflow-api-virid.vercel.app/api (health: `GET /api`) |
| Source | https://github.com/AdityaParthasarathy/project-management-system |
| Database | Hosted PostgreSQL (Prisma Postgres); migrations applied with `prisma migrate deploy` |
| Demo login | `demo@projectflow.test` / `DemoPass#2026` (3 projects, 6 tasks created through the API) |

## Test results
- API smoke test (`npm run test:api`): **42/42 PASS** against the local server and the live server.
- Unit tests (`npm test`): **10/10 PASS**.
- Rate limit: 429 after 20 login attempts/min - PASS. Expired / wrong-signature / malformed JWT -> 401 - PASS.
- CORS: allowed origin gets the header, other origins do not - PASS.
- Live web app in a browser: login with the demo account, dashboard numbers, Tasks page project filter - PASS.
- Mobile on a physical phone/emulator: MANUAL (not run). Docker image build: not run.

## Build results
Backend `npm run build` PASS · Frontend `npm run build` PASS · Mobile `npx tsc --noEmit` PASS · `npx expo export --platform web --output-dir .web-build` PASS · `expo-doctor` 20/20.

## Requirements coverage
All functional, technical, security and API requirements of the assignment are implemented (see `README.md` and `docs/ProjectFlow_Complete_Guide.pdf`, section 13). Bonus items done: Docker, unit + API tests, CI workflow file (`docs/github-actions-ci.yml`). Not done: pagination, sorting, audit logs, RBAC, refresh tokens, push notifications, offline mode, shared types.

## Android APK
Config is complete (`mobile/app.json`, `mobile/eas.json` preview = APK, API URL baked in). Cloud build: `cd mobile && npx eas-cli@latest login && npx eas-cli@latest build -p android --profile preview`.

## Known limitations
Stateless logout (token discarded client-side, expires in 1 day) · in-memory rate limiter (per instance) · web UI is a single large component file · free hosted database may be a temporary instance unless claimed · first request after idle is slow (serverless cold start).

## Remaining human actions
1. Submit the GitHub link, the two deployment URLs and the APK link.
2. Record the 5-minute demo (`DEMO.md`).
