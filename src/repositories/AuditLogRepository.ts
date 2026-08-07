import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const auditLogSelect = {
  id: true,
  actorId: true,
  action: true,
  resource: true,
  resourceId: true,
  workspaceId: true,
  organizationId: true,
  targetId: true,
  metadata: true,
  createdAt: true,
} as const;

const auditLogSelectWithActor = {
  ...auditLogSelect,
  actor: { select: { id: true, name: true, email: true, image: true } },
} as const;

export interface AuditLogFilter {
  workspaceId?: string;
  organizationId?: string;
  actorId?: string;
  resource?: string;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  perPage?: number;
}

export interface AuditLogRecord {
  id: string;
  actorId: string | null;
  actor: { id: string; name: string | null; email: string | null; image: string | null } | null;
  action: string;
  resource: string;
  resourceId: string | null;
  workspaceId: string | null;
  organizationId: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export class AuditLogRepository {
  async create(data: {
    actorId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    workspaceId?: string | null;
    organizationId?: string | null;
    targetId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<AuditLogRecord> {
    return prisma.auditLog.create({
      data: {
        actorId: data.actorId ?? null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId ?? null,
        workspaceId: data.workspaceId ?? null,
        organizationId: data.organizationId ?? null,
        targetId: data.targetId ?? null,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
      select: auditLogSelectWithActor,
    }) as unknown as AuditLogRecord;
  }

  async findMany(filter: AuditLogFilter): Promise<{ items: AuditLogRecord[]; total: number }> {
    const {
      workspaceId,
      organizationId,
      actorId,
      resource,
      action,
      fromDate,
      toDate,
      page = 1,
      perPage = 50,
    } = filter;

    const where: Record<string, unknown> = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (organizationId) where.organizationId = organizationId;
    if (actorId) where.actorId = actorId;
    if (resource) where.resource = resource;
    if (action) where.action = action;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) (where.createdAt as Record<string, Date>).gte = fromDate;
      if (toDate) (where.createdAt as Record<string, Date>).lte = toDate;
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: where as Prisma.AuditLogWhereInput,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      select: auditLogSelectWithActor,
    }),
    prisma.auditLog.count({ where: where as Prisma.AuditLogWhereInput }),
    ]);

    return {
      items: items as unknown as AuditLogRecord[],
      total,
    };
  }

  async aggregateByAction(workspaceId?: string, fromDate?: Date): Promise<Array<{ action: string; count: number }>> {
    const where: Record<string, unknown> = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (fromDate) where.createdAt = { gte: fromDate };

    const results = await prisma.auditLog.groupBy({
      by: ["action"],
      where: where as Prisma.AuditLogWhereInput,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    return results.map((r) => ({ action: r.action, count: r._count.id }));
  }

  async aggregateByResource(workspaceId?: string, fromDate?: Date): Promise<Array<{ resource: string; count: number }>> {
    const where: Record<string, unknown> = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (fromDate) where.createdAt = { gte: fromDate };

    const results = await prisma.auditLog.groupBy({
      by: ["resource"],
      where: where as Prisma.AuditLogWhereInput,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    return results.map((r) => ({ resource: r.resource, count: r._count.id }));
  }
}

export const auditLogRepository = new AuditLogRepository();
