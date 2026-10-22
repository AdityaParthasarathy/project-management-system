// Copies shared/*.ts into each app so every build system sees the same code
// (Vercel/Expo/Nest each build from their own folder). Run after editing shared/.
import { cpSync, mkdirSync } from 'node:fs';
const targets = ['backend/src/shared', 'frontend/app/shared', 'mobile/src/shared'];
for (const t of targets) {
  mkdirSync(t, { recursive: true });
  for (const f of ['types.ts', 'validation.ts']) cpSync(`shared/${f}`, `${t}/${f}`);
  console.log('synced ->', t);
}
