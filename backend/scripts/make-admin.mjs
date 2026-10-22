// Promote an existing user to ADMIN. Usage: node scripts/make-admin.mjs user@example.com
// Uses DATABASE_URL from the environment / .env file (so it works for local and production databases).
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/make-admin.mjs user@example.com');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
  console.log(`${user.email} is now ${user.role}`);
} catch {
  console.error(`No user found with email ${email}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
