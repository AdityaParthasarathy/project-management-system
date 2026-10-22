import { createHash, randomBytes } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS) || 7;

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

// Emails listed in ADMIN_EMAILS (comma separated) get the ADMIN role when they register.
const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { fullName, email, password } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: adminEmails().includes(email) ? 'ADMIN' : 'USER',
      },
    });

    await this.audit.log({ userId: user.id, action: 'REGISTER', entity: 'Auth', entityId: user.id });

    return {
      message: 'Registration successful',
      ...(await this.issueTokens(user)),
      user: this.publicUser(user),
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await this.audit.log({ action: 'LOGIN_FAILED', entity: 'Auth', details: email });
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      await this.audit.log({ userId: user.id, action: 'LOGIN_FAILED', entity: 'Auth', entityId: user.id });
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.audit.log({ userId: user.id, action: 'LOGIN', entity: 'Auth', entityId: user.id });

    return {
      message: 'Login successful',
      ...(await this.issueTokens(user)),
      user: this.publicUser(user),
    };
  }

  /**
   * Exchange a refresh token for a new access token + a NEW refresh token.
   * The old refresh token is revoked (rotation), so a stolen token only works once.
   */
  async refresh(refreshToken?: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return {
      message: 'Token refreshed',
      ...(await this.issueTokens(stored.user)),
      user: this.publicUser(stored.user),
    };
  }

  /** Server-side logout: revoke the refresh token so it can never be used again. */
  async logout(refreshToken?: string) {
    if (refreshToken) {
      const stored = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: sha256(refreshToken) },
      });
      if (stored && !stored.revokedAt) {
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date() },
        });
        await this.audit.log({ userId: stored.userId, action: 'LOGOUT', entity: 'Auth', entityId: stored.userId });
      }
    }
    return { message: 'Logout successful' };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private publicUser(user: { id: number; fullName: string; email: string; role: string }) {
    return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
  }

  private async issueTokens(user: { id: number; email: string; role: string }) {
    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    const refreshToken = randomBytes(48).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: sha256(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return { token, refreshToken };
  }
}
