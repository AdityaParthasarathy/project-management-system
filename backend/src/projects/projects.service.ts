import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { ProjectListQueryDto, toPaging } from '../common/list-query.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: number, createProjectDto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        status: createProjectDto.status,
        startDate: createProjectDto.startDate
          ? new Date(createProjectDto.startDate)
          : undefined,
        endDate: createProjectDto.endDate
          ? new Date(createProjectDto.endDate)
          : undefined,
        userId,
      },
    });
    await this.audit.log({ userId, action: 'CREATE', entity: 'Project', entityId: project.id, details: project.name });
    return project;
  }

  /** Returns the page of items plus the total number of matches (for pagination UIs). */
  async findAll(userId: number, query: ProjectListQueryDto = {}) {
    const where = {
      userId,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({ where, ...toPaging(query) }),
      this.prisma.project.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(userId: number, id: number) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    userId: number,
    id: number,
    updateProjectDto: UpdateProjectDto,
  ) {
    await this.findOne(userId, id);

    const project = await this.prisma.project.update({
      where: {
        id,
      },
      data: {
        ...updateProjectDto,
        startDate: updateProjectDto.startDate
          ? new Date(updateProjectDto.startDate)
          : undefined,
        endDate: updateProjectDto.endDate
          ? new Date(updateProjectDto.endDate)
          : undefined,
      },
    });
    await this.audit.log({ userId, action: 'UPDATE', entity: 'Project', entityId: id, details: project.name });
    return project;
  }

  async remove(userId: number, id: number) {
    const existing = await this.findOne(userId, id);

    await this.prisma.project.delete({
      where: {
        id,
      },
    });
    await this.audit.log({ userId, action: 'DELETE', entity: 'Project', entityId: id, details: existing.name });

    return {
      message: 'Project deleted successfully',
    };
  }
}
