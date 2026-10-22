import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Admin-only: every route here needs a valid token AND role ADMIN (otherwise 403).
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('users')
  listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { projects: true, tasks: true } },
      },
      orderBy: { id: 'asc' },
    });
  }
}
