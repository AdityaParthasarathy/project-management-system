import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuditEntry {
  userId?: number | null;
  action: string; // e.g. CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  entity: string; // e.g. Project, Task, Auth
  entityId?: number | null;
  details?: string | null;
}

/** Writes an append-only record of important actions. Never lets a logging failure break a request. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          details: entry.details?.slice(0, 300) ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(`Could not write audit log: ${(error as Error).message}`);
    }
  }

  async list(options: { userId?: number; page: number; limit: number }) {
    const where = options.userId ? { userId: options.userId } : {};
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }
}
