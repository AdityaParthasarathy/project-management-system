import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RateLimit } from '../common/rate-limit.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

const authRateLimit = {
  limit: Number(process.env.AUTH_RATE_LIMIT_PER_MINUTE) || 20,
  ttlMs: 60_000,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @RateLimit(authRateLimit)
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @RateLimit(authRateLimit)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // JWTs are stateless: logout is completed client-side by discarding the token.
  @Post('logout')
  logout() {
    return {
      message: 'Logout successful',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() request: any) {
    return this.authService.getMe(request.user.userId);
  }
}
