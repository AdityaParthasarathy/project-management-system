import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  ParseEnumPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Request() request: any,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(
      request.user.userId,
      createProjectDto,
    );
  }

  @Get()
  findAll(
    @Request() request: any,
    @Query('search') search?: string,
    @Query('status', new ParseEnumPipe(ProjectStatus, { optional: true })) status?: ProjectStatus,
  ) {
    return this.projectsService.findAll(
      request.user.userId,
      search,
      status,
    );
  }

  @Get(':id')
  findOne(
    @Request() request: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.projectsService.findOne(request.user.userId, id);
  }

  @Put(':id')
  update(
    @Request() request: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(
      request.user.userId,
      id,
      updateProjectDto,
    );
  }

  @Delete(':id')
  remove(
    @Request() request: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.projectsService.remove(request.user.userId, id);
  }
}