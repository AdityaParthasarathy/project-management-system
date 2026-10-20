import {
  Controller,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  getDashboard(@Request() request: any) {
    return this.dashboardService.getDashboard(
      request.user.userId,
    );
  }
}