import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createTaskDto: CreateTaskDto) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: createTaskDto.projectId,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.task.create({
      data: {
        name: createTaskDto.name,
        description: createTaskDto.description,
        priority: createTaskDto.priority,
        status: createTaskDto.status,
        dueDate: createTaskDto.dueDate
          ? new Date(createTaskDto.dueDate)
          : undefined,
        projectId: createTaskDto.projectId,
        userId,
      },
    });
  }

  async findAll(
    userId: number,
    search?: string,
    status?: TaskStatus,
    priority?: TaskPriority,
    projectId?: number,
  ) {
    return this.prisma.task.findMany({
      where: {
        userId,

        ...(projectId !== undefined ? { projectId } : {}),

        ...(search
          ? {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {}),

        ...(status
          ? {
              status: status,
            }
          : {}),

        ...(priority
          ? {
              priority: priority,
            }
          : {}),
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: number, id: number) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    userId: number,
    id: number,
    updateTaskDto: UpdateTaskDto,
  ) {
    await this.findOne(userId, id);

    if (updateTaskDto.projectId !== undefined) {
      const project = await this.prisma.project.findFirst({
        where: {
          id: updateTaskDto.projectId,
          userId,
        },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    return this.prisma.task.update({
      where: {
        id,
      },
      data: {
        name: updateTaskDto.name,
        description: updateTaskDto.description,
        priority: updateTaskDto.priority,
        status: updateTaskDto.status,
        projectId: updateTaskDto.projectId,
        dueDate: updateTaskDto.dueDate
          ? new Date(updateTaskDto.dueDate)
          : undefined,
      },
    });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);

    await this.prisma.task.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Task deleted successfully',
    };
  }
}