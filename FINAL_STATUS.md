# FINAL STATUS

Legend: PASS = actually run · CODE = verified by reading code · MANUAL = needs a person/device.

## Live deployment
| Item | Value |
|---|---|
| Web app | https://projectflow-web-tau.vercel.app |
| API | https://projectflow-api-virid.vercel.app/api (health: `GET /api`) |
| Source | https://github.com/AdityaParthasarathy/project-management-system |
| Database | Hosted PostgreSQL (Prisma Postgres); migrations applied with `prisma migrate deploy` |
| Android APK | https://expo.dev/accounts/adityapartha/projects/project-management-mobile/builds/a179e36a-a3d4-4c4c-afec-7ed6c662bbf7 |
| Demo login | `demo@projectflow.test` / `DemoPass#2026` (3 projects, 6 tasks created through the API) |

## Test results
- API smoke test (`npm run test:api`): **66/66 PASS** against the local server and the live server (includes pagination, sorting, audit log, roles, refresh-token rotation).
- Unit tests (`npm test`): **24/24 PASS**.
- Rate limit: 429 after 20 login attempts/min - PASS. Expired / wrong-signature / malformed JWT -> 401 - PASS.
- CORS: allowed origin gets the header, other origins do not - PASS.
- Live web app in a browser: login with the demo account, dashboard numbers, Tasks page project filter - PASS.
- Mobile on a physical phone/emulator: MANUAL (not run). Docker image build: not run.

## Build results
Backend `npm run build` PASS · Frontend `npm run build` PASS · Mobile `npx tsc --noEmit` PASS · `npx expo export --platform web --output-dir .web-build` PASS · `expo-doctor` 20/20.

## Requirements coverage
All functional, technical, security and API requirements of the assignment are implemented (see `README.md` and `docs/ProjectFlow_Complete_Guide.pdf`, section 13). Bonus items done: Docker, 24 unit tests + 66-check API test, CI workflow file (`docs/github-actions-ci.yml`). All bonus items are implemented (see docs/BONUS_FEATURES.md). Notes: Docker build status below; CI file is not active until a GitHub token with workflow scope pushes it; reminders are local notifications (no remote push server).

## Android APK
Built with EAS and installed/tested on an Android emulator (login + live dashboard): https://expo.dev/accounts/adityapartha/projects/project-management-mobile/builds/a179e36a-a3d4-4c4c-afec-7ed6c662bbf7

## Known limitations
Stateless logout (token discarded client-side, expires in 1 day) · in-memory rate limiter (per instance) · web UI is a single large component file · free hosted database may be a temporary instance unless claimed · first request after idle is slow (serverless cold start).

## Remaining human actions
1. Submit the GitHub link, the two deployment URLs and the APK link.
2. Record the 5-minute demo (`DEMO.md`).
