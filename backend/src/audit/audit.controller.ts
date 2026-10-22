import { Controller, Get, Query, Request, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PageQueryDto } from '../common/list-query.dto.js';
import { AuditService } from './audit.service.js';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  // Normal users see their own activity; admins can pass ?scope=all to see all users.
  @Get()
  async list(
    @Request() request: any,
    @Query() query: PageQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const seeAll = query.scope === 'all' && request.user.role === 'ADMIN';
    const { items, total } = await this.audit.list({
      userId: seeAll ? undefined : request.user.userId,
      page,
      limit,
    });
    res.setHeader('X-Total-Count', String(total));
    return items;
  }
}
