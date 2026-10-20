import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
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
  }

  async findAll(
    userId: number,
    search?: string,
    status?: ProjectStatus,
  ) {
    return this.prisma.project.findMany({
      where: {
        userId,

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
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
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

    return this.prisma.project.update({
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
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);

    await this.prisma.project.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Project deleted successfully',
    };
  }
}