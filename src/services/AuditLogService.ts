import { auditLogRepository, type AuditLogFilter, type AuditLogRecord } from "@/repositories/AuditLogRepository";
import { logger } from "@/lib/logger";

export type AuditAction =
  | "auth.sign_in"
  | "auth.sign_out"
  | "auth.sign_up"
  | "auth.auth_failure"
  | "project.create"
  | "project.update"
  | "project.delete"
  | "project.archive"
  | "prompt.create"
  | "prompt.update"
  | "prompt.delete"
  | "prompt.version_create"
  | "knowledge.upload"
  | "knowledge.index_start"
  | "knowledge.index_complete"
  | "knowledge.delete"
  | "permission.role_change"
  | "permission.member_add"
  | "permission.member_remove"
  | "export.create"
  | "export.complete"
  | "export.fail"
  | "billing.subscribe"
  | "billing.unsubscribe"
  | "billing.payment_method_update"
  | "api.key_create"
  | "api.key_revoke"
  | "api.request"
  // Phase 12.2 — expanded operational audit coverage
  | "ai.request_start"
  | "ai.request_complete"
  | "ai.request_fail"
  | "billing.checkout_started"
  | "billing.webhook_received"
  | "workspace.create"
  | "workspace.delete"
  | "workspace.update"
  | "workspace.invite_sent"
  | "workspace.invite_accepted"
  | "automation.run"
  | "automation.run_fail"
  | "document.create"
  | "document.update"
  | "document.delete"
  | "task.create"
  | "task.update"
  | "task.delete"
  | "agent.create"
  | "agent.run"
  | "agent.delete"
  | "integration.connect"
  | "integration.disconnect";

export interface AuditContext {
  actorId?: string | null;
  workspaceId?: string | null;
  resourceId?: string | null;
  targetId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export class AuditLogService {
  async record(action: AuditAction, resource: string, ctx: AuditContext): Promise<void> {
    try {
      await auditLogRepository.create({
        actorId: ctx.actorId ?? null,
        action,
        resource,
        resourceId: ctx.resourceId ?? null,
        workspaceId: ctx.workspaceId ?? null,
        targetId: ctx.targetId ?? null,
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
        metadata: ctx.metadata ?? null,
      });
    } catch (err) {
      logger.error("auditLog.record failed", { action, resource, err });
    }
  }

  async list(filter: AuditLogFilter): Promise<{ items: AuditLogRecord[]; total: number }> {
    return auditLogRepository.findMany(filter);
  }

  async aggregateByAction(workspaceId?: string, fromDate?: Date) {
    return auditLogRepository.aggregateByAction(workspaceId, fromDate);
  }

  async aggregateByResource(workspaceId?: string, fromDate?: Date) {
    return auditLogRepository.aggregateByResource(workspaceId, fromDate);
  }
}

export const auditLogService = new AuditLogService();
