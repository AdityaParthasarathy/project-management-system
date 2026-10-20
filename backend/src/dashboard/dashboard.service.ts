import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: number) {
    const [
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
    ] = await Promise.all([
      this.prisma.project.count({
        where: {
          userId,
        },
      }),

      this.prisma.task.count({
        where: {
          userId,
        },
      }),

      this.prisma.task.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),

      this.prisma.task.count({
        where: {
          userId,
          status: 'PENDING',
        },
      }),

      this.prisma.project.count({
        where: {
          userId,
          status: 'IN_PROGRESS',
        },
      }),
    ]);

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
    };
  }
}