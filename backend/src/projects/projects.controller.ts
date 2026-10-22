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
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ProjectListQueryDto } from '../common/list-query.dto.js';

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

  // Query: search, status, page, limit, sortBy, order. Total matches come back in the X-Total-Count header.
  @Get()
  async findAll(
    @Request() request: any,
    @Query() query: ProjectListQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { items, total } = await this.projectsService.findAll(request.user.userId, query);
    res.setHeader('X-Total-Count', String(total));
    return items;
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
