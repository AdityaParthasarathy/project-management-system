import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './common/rate-limit.js';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    DashboardModule,
    AdminModule,
  ],
  controllers: [AppController],
  // Global per-IP rate limit; auth endpoints apply a stricter limit (see AuthController).
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
