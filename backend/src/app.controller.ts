import { Controller, Get } from '@nestjs/common';
import { SkipRateLimit } from './common/rate-limit.js';

@Controller()
export class AppController {
  @SkipRateLimit()
  @Get()
  health() {
    return { status: 'ok', service: 'project-management-api' };
  }
}
