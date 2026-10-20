import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';

function setup() {
  const prisma = {
    project: { findFirst: jest.fn<(...a: any[]) => any>() },
    task: {
      create: jest.fn<(...a: any[]) => any>(),
      findMany: jest.fn<(...a: any[]) => any>().mockResolvedValue([]),
      findFirst: jest.fn<(...a: any[]) => any>(),
      update: jest.fn<(...a: any[]) => any>(),
      delete: jest.fn<(...a: any[]) => any>(),
    },
  };
  return { prisma, service: new TasksService(prisma as any) };
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
    await service.findAll(7, 'abc', 'PENDING' as any, 'HIGH' as any, 3);
    const where = prisma.task.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ userId: 7, status: 'PENDING', priority: 'HIGH', projectId: 3 });
    expect(where.name).toEqual({ contains: 'abc', mode: 'insensitive' });
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
});
