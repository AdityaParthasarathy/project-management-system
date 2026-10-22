import { describe, expect, it, jest } from '@jest/globals';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';

function setup() {
  const prisma = {
    user: {
      findUnique: jest.fn<(...a: any[]) => any>(),
      create: jest.fn<(...a: any[]) => any>(),
    },
    refreshToken: {
      create: jest.fn<(...a: any[]) => any>().mockResolvedValue({}),
      findUnique: jest.fn<(...a: any[]) => any>(),
      update: jest.fn<(...a: any[]) => any>().mockResolvedValue({}),
    },
  };
  const jwt = { sign: jest.fn<(...a: any[]) => any>().mockReturnValue('signed-token') };
  const audit = { log: jest.fn<(...a: any[]) => any>().mockResolvedValue(undefined) };
  return { prisma, jwt, audit, service: new AuthService(prisma as any, jwt as any, audit as any) };
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
    expect(result.refreshToken).toHaveLength(96);
  });

  it('gives new users the USER role by default', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }: any) => ({ id: 1, ...data }));
    await service.register({ fullName: 'A', email: 'a@b.co', password: 'secret1' });
    expect(prisma.user.create.mock.calls[0][0].data.role).toBe('USER');
  });

  it('rejects a duplicate email', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    await expect(service.register({ fullName: 'A', email: 'a@b.co', password: 'secret1' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a wrong password and an unknown user with the same error, and audits both', async () => {
    const { prisma, audit, service } = setup();
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@b.co', password: await bcrypt.hash('right', 4) });
    await expect(service.login({ email: 'a@b.co', password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException);
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: 'x@y.co', password: 'right' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(audit.log.mock.calls.map((c: any) => c[0].action)).toEqual(['LOGIN_FAILED', 'LOGIN_FAILED']);
  });

  it('stores only a hash of the refresh token it issues', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@b.co', role: 'USER', password: await bcrypt.hash('right', 4) });
    const result = await service.login({ email: 'a@b.co', password: 'right' });
    const stored = prisma.refreshToken.create.mock.calls[0][0].data.tokenHash;
    expect(stored).not.toBe(result.refreshToken);
    expect(stored).toHaveLength(64);
  });

  it('rotates refresh tokens: the old one is revoked and a new pair is issued', async () => {
    const { prisma, service } = setup();
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 7,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 100000),
      user: { id: 1, email: 'a@b.co', fullName: 'A', role: 'USER' },
    });
    const result = await service.refresh('some-refresh-token');
    expect(prisma.refreshToken.update.mock.calls[0][0]).toMatchObject({ where: { id: 7 } });
    expect(prisma.refreshToken.update.mock.calls[0][0].data.revokedAt).toBeInstanceOf(Date);
    expect(result.token).toBe('signed-token');
    expect(result.refreshToken).toHaveLength(96);
  });

  it('refuses revoked, expired or unknown refresh tokens', async () => {
    const { prisma, service } = setup();
    prisma.refreshToken.findUnique.mockResolvedValue(null);
    await expect(service.refresh('nope')).rejects.toBeInstanceOf(UnauthorizedException);
    prisma.refreshToken.findUnique.mockResolvedValue({ id: 1, revokedAt: new Date(), expiresAt: new Date(Date.now() + 1000), user: {} });
    await expect(service.refresh('revoked')).rejects.toBeInstanceOf(UnauthorizedException);
    prisma.refreshToken.findUnique.mockResolvedValue({ id: 1, revokedAt: null, expiresAt: new Date(Date.now() - 1000), user: {} });
    await expect(service.refresh('expired')).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logout revokes the refresh token on the server', async () => {
    const { prisma, service } = setup();
    prisma.refreshToken.findUnique.mockResolvedValue({ id: 3, userId: 1, revokedAt: null });
    await service.logout('tok');
    expect(prisma.refreshToken.update.mock.calls[0][0]).toMatchObject({ where: { id: 3 } });
  });
});
