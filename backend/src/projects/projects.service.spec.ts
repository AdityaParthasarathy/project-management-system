import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service.js';

function setup() {
  const prisma = {
    project: {
      create: jest.fn<(...a: any[]) => any>().mockResolvedValue({ id: 1, name: 'P' }),
      findMany: jest.fn<(...a: any[]) => any>().mockResolvedValue([]),
      count: jest.fn<(...a: any[]) => any>().mockResolvedValue(0),
      findFirst: jest.fn<(...a: any[]) => any>(),
      update: jest.fn<(...a: any[]) => any>(),
      delete: jest.fn<(...a: any[]) => any>(),
    },
  };
  const audit = { log: jest.fn<(...a: any[]) => any>().mockResolvedValue(undefined) };
  return { prisma, audit, service: new ProjectsService(prisma as any, audit as any) };
}

describe('ProjectsService', () => {
  it('creates a project owned by the caller and audits it', async () => {
    const { prisma, audit, service } = setup();
    await service.create(4, { name: 'P', startDate: '2026-01-01' } as any);
    const data = prisma.project.create.mock.calls[0][0].data;
    expect(data.userId).toBe(4);
    expect(data.startDate).toBeInstanceOf(Date);
    expect(audit.log.mock.calls[0][0]).toMatchObject({ userId: 4, action: 'CREATE', entity: 'Project' });
  });

  it('scopes list queries to the user and paginates', async () => {
    const { prisma, service } = setup();
    await service.findAll(4, { search: 'x', status: 'IN_PROGRESS', page: 2, limit: 5, sortBy: 'name', order: 'asc' });
    const args = prisma.project.findMany.mock.calls[0][0];
    expect(args.where).toMatchObject({ userId: 4, status: 'IN_PROGRESS' });
    expect(args).toMatchObject({ skip: 5, take: 5, orderBy: { name: 'asc' } });
  });

  it("does not let a user update or delete another user's project", async () => {
    const { prisma, service } = setup();
    prisma.project.findFirst.mockResolvedValue(null);
    await expect(service.update(1, 2, { name: 'n' } as any)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(1, 2)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.project.update).not.toHaveBeenCalled();
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });
});
