import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  PROJECT_SORT_FIELDS,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_SORT_FIELDS,
  TASK_STATUSES,
} from '../shared/types.js';

/** Pagination + sorting query parameters. If `page` is omitted the full list is returned. */
export class PageQueryDto {
  @Type(() => Number) @IsInt() @Min(1) @IsOptional() page?: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) @IsOptional() limit?: number;
  @IsIn(['asc', 'desc']) @IsOptional() order?: 'asc' | 'desc';
  @IsIn(['all', 'mine']) @IsOptional() scope?: 'all' | 'mine'; // used by audit logs (admin only)
}

export class ProjectListQueryDto extends PageQueryDto {
  @IsString() @IsOptional() search?: string;
  @IsIn(PROJECT_STATUSES) @IsOptional() status?: (typeof PROJECT_STATUSES)[number];
  @IsIn(PROJECT_SORT_FIELDS) @IsOptional() sortBy?: (typeof PROJECT_SORT_FIELDS)[number];
}

export class TaskListQueryDto extends PageQueryDto {
  @IsString() @IsOptional() search?: string;
  @IsIn(TASK_STATUSES) @IsOptional() status?: (typeof TASK_STATUSES)[number];
  @IsIn(TASK_PRIORITIES) @IsOptional() priority?: (typeof TASK_PRIORITIES)[number];
  @Type(() => Number) @IsInt() @IsOptional() projectId?: number;
  @IsIn(TASK_SORT_FIELDS) @IsOptional() sortBy?: (typeof TASK_SORT_FIELDS)[number];
}

/** Converts page/limit/sort into Prisma skip/take/orderBy. No page -> no limit (backward compatible). */
export function toPaging(query: PageQueryDto & { sortBy?: string }) {
  const sortBy = query.sortBy ?? 'createdAt';
  const order = query.order ?? 'desc';
  const limit = query.limit ?? (query.page ? 20 : undefined);
  const skip = query.page && limit ? (query.page - 1) * limit : undefined;
  return { orderBy: { [sortBy]: order } as Record<string, 'asc' | 'desc'>, skip, take: limit };
}
