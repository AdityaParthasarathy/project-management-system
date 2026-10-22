import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service.js';

function setup() {
  const prisma = {
    project: { findFirst: jest.fn<(...a: any[]) => any>() },
    task: {
      create: jest.fn<(...a: any[]) => any>(),
      findMany: jest.fn<(...a: any[]) => any>().mockResolvedValue([]),
      count: jest.fn<(...a: any[]) => any>().mockResolvedValue(0),
      findFirst: jest.fn<(...a: any[]) => any>(),
      update: jest.fn<(...a: any[]) => any>(),
      delete: jest.fn<(...a: any[]) => any>(),
    },
  };
  const audit = { log: jest.fn<(...a: any[]) => any>().mockResolvedValue(undefined) };
  return { prisma, audit, service: new TasksService(prisma as any, audit as any) };
}

describe('TasksService', () => {
  it('rejects creating a task in a project the user does not own', async () => {
    const { prisma, service } = setup();
    prisma.project.findFirst.mockResolvedValue(null);
    await expect(service.create(1, { name: 'x', projectId: 9 } as any)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.project.findFirst).toHaveBeenCalledWith({ where: { id: 9, userId: 1 } });
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it('scopes every list query to the user and applies filters', async () => {
    const { prisma, service } = setup();
    await service.findAll(7, { search: 'abc', status: 'PENDING', priority: 'HIGH', projectId: 3 });
    const where = prisma.task.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ userId: 7, status: 'PENDING', priority: 'HIGH', projectId: 3 });
    expect(where.name).toEqual({ contains: 'abc', mode: 'insensitive' });
  });

  it('applies pagination and sorting, and returns the total count', async () => {
    const { prisma, service } = setup();
    prisma.task.count.mockResolvedValue(45);
    const result = await service.findAll(7, { page: 3, limit: 10, sortBy: 'priority', order: 'asc' });
    const args = prisma.task.findMany.mock.calls[0][0];
    expect(args).toMatchObject({ skip: 20, take: 10, orderBy: { priority: 'asc' } });
    expect(result.total).toBe(45);
  });

  it('returns everything (no limit) when no page is requested', async () => {
    const { prisma, service } = setup();
    await service.findAll(7, {});
    const args = prisma.task.findMany.mock.calls[0][0];
    expect(args.take).toBeUndefined();
    expect(args.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('returns 404 for a task owned by someone else (read, update, delete)', async () => {
    const { prisma, service } = setup();
    prisma.task.findFirst.mockResolvedValue(null);
    await expect(service.findOne(1, 5)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(1, 5, { name: 'n' } as any)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(1, 5)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.task.update).not.toHaveBeenCalled();
    expect(prisma.task.delete).not.toHaveBeenCalled();
  });

  it('writes audit entries for create, complete and delete', async () => {
    const { prisma, audit, service } = setup();
    prisma.project.findFirst.mockResolvedValue({ id: 1 });
    prisma.task.create.mockResolvedValue({ id: 10, name: 'T' });
    await service.create(1, { name: 'T', projectId: 1 } as any);
    prisma.task.findFirst.mockResolvedValue({ id: 10, name: 'T' });
    prisma.task.update.mockResolvedValue({ id: 10, name: 'T' });
    await service.update(1, 10, { status: 'COMPLETED' } as any);
    await service.remove(1, 10);
    const actions = audit.log.mock.calls.map((c: any) => c[0].action);
    expect(actions).toEqual(['CREATE', 'COMPLETE', 'DELETE']);
  });
});
