import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface RateLimitOptions {
  limit: number;
  ttlMs: number;
}

const RATE_LIMIT_KEY = 'rate-limit';
const SKIP_RATE_LIMIT_KEY = 'skip-rate-limit';

/** Override the limit for one route (e.g. stricter limit on login). */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/** Exempt a route (e.g. the health check). */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);

const defaultLimit = (): RateLimitOptions => ({
  limit: Number(process.env.RATE_LIMIT_PER_MINUTE) || 120,
  ttlMs: 60_000,
});

/**
 * Small in-memory, per-IP fixed-window rate limiter (applied globally).
 * Counters are kept per route handler, so a strict login limit does not
 * eat into the general API budget.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, targets)) {
      return true;
    }
    const { limit, ttlMs } =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, targets) ??
      defaultLimit();

    const req = context.switchToHttp().getRequest();
    const forwarded = String(req.headers?.['x-forwarded-for'] ?? '').split(',')[0].trim();
    const ip = forwarded || req.ip || 'unknown';
    const key = `${ip}|${context.getClass().name}.${context.getHandler().name}`;

    const now = Date.now();
    if (this.hits.size > 10_000) {
      for (const [k, v] of this.hits) if (v.resetAt <= now) this.hits.delete(k);
    }
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + ttlMs });
      return true;
    }
    entry.count += 1;
    if (entry.count > limit) {
      throw new HttpException(
        'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
