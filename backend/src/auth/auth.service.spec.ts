import { describe, expect, it, jest } from '@jest/globals';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';

function setup() {
  const prisma = { user: { findUnique: jest.fn<(...a: any[]) => any>(), create: jest.fn<(...a: any[]) => any>() } };
  const jwt = { sign: jest.fn<(...a: any[]) => any>().mockReturnValue('signed-token') };
  return { prisma, service: new AuthService(prisma as any, jwt as any) };
}

describe('AuthService', () => {
  it('stores a bcrypt hash and never returns the password', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }: any) => ({ id: 1, ...data }));
    const result = await service.register({ fullName: 'A', email: 'a@b.co', password: 'secret1' });
    const stored = prisma.user.create.mock.calls[0][0].data.password;
    expect(stored).not.toBe('secret1');
    expect(await bcrypt.compare('secret1', stored)).toBe(true);
    expect(JSON.stringify(result)).not.toContain('password');
    expect(result.token).toBe('signed-token');
  });

  it('rejects a duplicate email', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    await expect(service.register({ fullName: 'A', email: 'a@b.co', password: 'secret1' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a wrong password and an unknown user with the same error', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@b.co', password: await bcrypt.hash('right', 4) });
    await expect(service.login({ email: 'a@b.co', password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException);
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: 'x@y.co', password: 'right' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
