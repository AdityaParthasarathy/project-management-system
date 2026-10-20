import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const authThrottle = {
  default: {
    limit: Number(process.env.AUTH_RATE_LIMIT_PER_MINUTE) || 20,
    ttl: 60_000,
  },
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle(authThrottle)
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle(authThrottle)
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
