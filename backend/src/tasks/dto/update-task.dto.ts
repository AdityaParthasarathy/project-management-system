import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../shared/types.js';
import type { TaskPriority, TaskStatus } from '../../shared/types.js';

export class UpdateTaskDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(TASK_PRIORITIES)
  @IsOptional()
  priority?: TaskPriority;

  @IsIn(TASK_STATUSES)
  @IsOptional()
  status?: TaskStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsInt()
  @IsOptional()
  projectId?: number;
}