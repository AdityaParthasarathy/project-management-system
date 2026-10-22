# Bonus features: what they are and where the code lives

| Bonus feature | What it does | Where in the code |
|---|---|---|
| **Pagination** | List endpoints return one page at a time; the total comes back in the `X-Total-Count` header. Web has Previous/Next, mobile has "Load more". | `backend/src/common/list-query.dto.ts` (`page`, `limit`, `toPaging`), `tasks.service.ts` / `projects.service.ts` (`findAll`), web `Pager` in `frontend/app/page.tsx`, mobile `tasks.tsx` / `projects.tsx` (`limit`, `ListFooterComponent`) |
| **Sorting** | `sortBy` (whitelisted fields) and `order` on projects and tasks. | same DTO file (`TASK_SORT_FIELDS`, `PROJECT_SORT_FIELDS` in `shared/types.ts`), web `SortSelect`, mobile sort chips |
| **Audit logs** | Append-only record of REGISTER, LOGIN, LOGIN_FAILED, LOGOUT, CREATE, UPDATE, COMPLETE, DELETE. Users see their own; admins can see all with `?scope=all`. | `backend/src/audit/` (service, controller, module), table `AuditLog`, web `ActivityPage` |
| **Role-based access control** | Users have role `USER` or `ADMIN`. Admin-only routes return 403 for normal users. Emails listed in `ADMIN_EMAILS` become admins when they register; `npm run make-admin -- <email>` promotes an existing user. | `backend/src/auth/roles.decorator.ts`, `guards/roles.guard.ts`, `backend/src/admin/` (`GET /api/admin/users`), column `User.role`, web `AdminPage` |
| **Refresh tokens** | Access token lives 1 hour; a 7-day refresh token (stored only as a SHA-256 hash, rotated on every use) renews it silently. Logout revokes the refresh token on the server. | `backend/src/auth/auth.service.ts` (`issueTokens`, `refresh`, `logout`), table `RefreshToken`, web `apiFetch` in `page.tsx`, mobile `services/api.ts` (`refreshSession`) |
| **Push notifications (tasks due tomorrow)** | The mobile app posts a local notification, at most once per day, listing incomplete tasks due tomorrow. | `mobile/src/services/notifications.ts`, called from `mobile/src/app/index.tsx`; plugin in `mobile/app.json` |
| **Offline viewing on mobile** | Every list/dashboard/profile response is saved on the phone; with no network the app shows the saved copy and an "Offline" banner. The saved copy is wiped on logout. | `mobile/src/services/cache.ts` (`withCache`), `offline.ts`, `components/OfflineBanner.tsx` |
| **Shared types / validation** | One source of truth for enums, types and form rules, copied into backend, web and mobile. | `shared/types.ts`, `shared/validation.ts`, `scripts/sync-shared.mjs` (copies into `*/shared/`) |
| **Docker** | `docker compose up --build` starts PostgreSQL and the API. | `backend/Dockerfile`, `docker-compose.yml` |
| **Unit + integration tests** | 24 unit tests and a 66-check live API test. | `backend/src/**/*.spec.ts`, `backend/scripts/api-smoke-test.mjs` |
| **CI/CD pipeline** | GitHub Actions builds and tests backend, web and mobile on every push. | `docs/github-actions-ci.yml` (copy to `.github/workflows/ci.yml`) |

## Notes on honesty
- **Push notifications** are local notifications scheduled on the phone, not server-sent pushes. True remote push needs Firebase (FCM) credentials from a Google account. Local notifications work only in the installed APK (Expo Go on Android does not include the module).
- **Rate limiter** is in-memory per server instance.
- Admin access in the deployed demo: promote a user with `npm run make-admin -- email` using the production `DATABASE_URL`.
