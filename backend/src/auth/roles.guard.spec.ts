import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './guards/roles.guard.js';
import { ROLES_KEY } from './roles.decorator.js';

function contextFor(user: any, required?: string[]) {
  class Handler {}
  if (required) Reflect.defineMetadata(ROLES_KEY, required, Handler);
  return {
    getHandler: () => Handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('lets everyone through routes without a role requirement', () => {
    expect(guard.canActivate(contextFor({ role: 'USER' }))).toBe(true);
  });

  it('allows an ADMIN on an admin route', () => {
    expect(guard.canActivate(contextFor({ role: 'ADMIN' }, ['ADMIN']))).toBe(true);
  });

  it('blocks a normal USER on an admin route with 403', () => {
    expect(() => guard.canActivate(contextFor({ role: 'USER' }, ['ADMIN']))).toThrow(ForbiddenException);
  });
});
