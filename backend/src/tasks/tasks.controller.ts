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
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TaskListQueryDto } from '../common/list-query.dto.js';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Request() request: any,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(
      request.user.userId,
      createTaskDto,
    );
  }

  // Query: search, status, priority, projectId, page, limit, sortBy, order.
  // Total matches come back in the X-Total-Count header.
  @Get()
  async findAll(
    @Request() request: any,
    @Query() query: TaskListQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { items, total } = await this.tasksService.findAll(request.user.userId, query);
    res.setHeader('X-Total-Count', String(total));
    return items;
  }

  @Get(':id')
  findOne(
    @Request() request: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tasksService.findOne(request.user.userId, id);
  }

  @Put(':id')
  update(
    @Request() request: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(
      request.user.userId,
      id,
      updateTaskDto,
    );
  }

  @Delete(':id')
  remove(
    @Request() request: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tasksService.remove(request.user.userId, id);
  }
}
