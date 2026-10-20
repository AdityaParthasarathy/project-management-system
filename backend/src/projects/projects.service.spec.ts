import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';

function setup() {
  const prisma = {
    project: { create: jest.fn<(...a: any[]) => any>(), findMany: jest.fn<(...a: any[]) => any>().mockResolvedValue([]), findFirst: jest.fn<(...a: any[]) => any>(), update: jest.fn<(...a: any[]) => any>(), delete: jest.fn<(...a: any[]) => any>() },
  };
  return { prisma, service: new ProjectsService(prisma as any) };
}

describe('ProjectsService', () => {
  it('creates a project owned by the caller', async () => {
    const { prisma, service } = setup();
    await service.create(4, { name: 'P', startDate: '2026-01-01' } as any);
    const data = prisma.project.create.mock.calls[0][0].data;
    expect(data.userId).toBe(4);
    expect(data.startDate).toBeInstanceOf(Date);
  });

  it('scopes list queries to the user', async () => {
    const { prisma, service } = setup();
    await service.findAll(4, 'x', 'IN_PROGRESS' as any);
    expect(prisma.project.findMany.mock.calls[0][0].where).toMatchObject({ userId: 4, status: 'IN_PROGRESS' });
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
