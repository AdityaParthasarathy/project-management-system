import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { TaskListQueryDto, toPaging } from '../common/list-query.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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

    const task = await this.prisma.task.create({
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
    await this.audit.log({ userId, action: 'CREATE', entity: 'Task', entityId: task.id, details: task.name });
    return task;
  }

  /** Returns the page of items plus the total number of matches (for pagination UIs). */
  async findAll(userId: number, query: TaskListQueryDto = {}) {
    const where = {
      userId,
      ...(query.projectId !== undefined ? { projectId: query.projectId } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({ where, ...toPaging(query) }),
      this.prisma.task.count({ where }),
    ]);

    return { items, total };
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

    const task = await this.prisma.task.update({
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
    await this.audit.log({
      userId,
      action: updateTaskDto.status === 'COMPLETED' ? 'COMPLETE' : 'UPDATE',
      entity: 'Task',
      entityId: id,
      details: task.name,
    });
    return task;
  }

  async remove(userId: number, id: number) {
    const existing = await this.findOne(userId, id);

    await this.prisma.task.delete({
      where: {
        id,
      },
    });
    await this.audit.log({ userId, action: 'DELETE', entity: 'Task', entityId: id, details: existing.name });

    return {
      message: 'Task deleted successfully',
    };
  }
}
