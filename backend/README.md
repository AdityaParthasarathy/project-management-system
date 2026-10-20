# Backend (NestJS + Prisma)

See the [root README](../README.md) and [API reference](../docs/API.md).

```bash
npm install && cp .env.example .env   # fill DATABASE_URL, JWT_SECRET
npx prisma migrate deploy
npm run start:dev                     # http://localhost:5000/api
npm run test:api                      # live API smoke test (needs the server running)
npm run seed:demo                     # demo data via the API
```
