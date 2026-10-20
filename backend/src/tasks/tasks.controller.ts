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
import { TaskPriority, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  @Get()
  findAll(
    @Request() request: any,
    @Query('search') search?: string,
    @Query('projectId', new ParseIntPipe({ optional: true })) projectId?: number,
    @Query('status', new ParseEnumPipe(TaskStatus, { optional: true })) status?: TaskStatus,
    @Query('priority', new ParseEnumPipe(TaskPriority, { optional: true })) priority?: TaskPriority,
  ) {
    return this.tasksService.findAll(
      request.user.userId,
      search,
      status,
      priority,
      projectId,
    );
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