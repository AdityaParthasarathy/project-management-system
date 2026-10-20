# API Reference

Base URL (dev): `http://localhost:5000/api` · All bodies are JSON. Protected routes need `Authorization: Bearer <JWT>`.

Errors use Nest's shape: `{ "statusCode": 400, "message": "…" | ["…"], "error": "Bad Request" }`.
Common errors: `400` validation (unknown fields are rejected; invalid enum / non-numeric id), `401` missing/invalid/expired token or bad credentials, `404` resource missing **or owned by another user**, `409` duplicate email, `429` rate limit exceeded.

Rate limits (per IP): 120 req/min globally, 20 req/min on `register` and `login` (env-configurable).

Enums — Project status: `NOT_STARTED | IN_PROGRESS | COMPLETED` · Task status: `PENDING | IN_PROGRESS | COMPLETED` · Priority: `LOW | MEDIUM | HIGH`.

## Health
| `GET /api` | public | `200 { "status": "ok", "service": "project-management-api" }` |
|---|---|---|

## Auth
| Method & path | Auth | Body | Success | Errors |
|---|---|---|---|---|
| `POST /auth/register` | no | `fullName` (string ≤100), `email`, `password` (6–72 chars) | `201 { message, token, user: {id, fullName, email} }` | 400, 409, 429 |
| `POST /auth/login` | no | `email`, `password` | `201 { message, token, user }` | 400, 401, 429 |
| `POST /auth/logout` | no | – | `201 { message }` (stateless JWT: client discards the token) | – |
| `GET /auth/me` | yes | – | `200 { id, fullName, email, createdAt }` | 401 |

Emails are trimmed and lower-cased. Passwords are bcrypt-hashed and never returned. Tokens expire after `JWT_EXPIRES_IN` (default `1d`).

## Projects (own projects only)
| Method & path | Body / query | Success | Errors |
|---|---|---|---|
| `GET /projects` | query `search` (name, case-insensitive), `status` | `200 Project[]` (newest first) | 400 bad status, 401 |
| `GET /projects/:id` | – | `200 Project` | 400 bad id, 401, 404 |
| `POST /projects` | `name` (req), `description`, `status`, `startDate`, `endDate` (ISO dates) | `201 Project` | 400, 401 |
| `PUT /projects/:id` | any subset of the create fields | `200 Project` | 400, 401, 404 |
| `DELETE /projects/:id` | – | `200 { message }` (cascades to the project's tasks) | 400, 401, 404 |

`Project = { id, name, description, status, startDate, endDate, createdAt, userId }`

## Tasks (own tasks only)
| Method & path | Body / query | Success | Errors |
|---|---|---|---|
| `GET /tasks` | query `search` (name), `status`, `priority`, `projectId` | `200 Task[]` | 400 bad enum, 401 |
| `GET /tasks/:id` | – | `200 Task` | 400, 401, 404 |
| `POST /tasks` | `name`, `projectId` (req, must be your project), `description`, `priority`, `status`, `dueDate` | `201 Task` | 400, 401, 404 project not found |
| `PUT /tasks/:id` | any subset of the create fields (mark complete: `{ "status": "COMPLETED" }`) | `200 Task` | 400, 401, 404 |
| `DELETE /tasks/:id` | – | `200 { message }` | 400, 401, 404 |

`Task = { id, name, description, priority, status, dueDate, createdAt, projectId, userId }`

## Dashboard
| Method & path | Auth | Success |
|---|---|---|
| `GET /dashboard` | yes | `200 { totalProjects, totalTasks, completedTasks, pendingTasks, projectsInProgress }` — live `COUNT` queries scoped to the user |
