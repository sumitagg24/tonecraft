import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { workspaceMemberRepository } from "@/repositories/WorkspaceMemberRepository";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";
import { auditLogService } from "@/services/AuditLogService";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";
import { z } from "zod";

const roleSchema = z.object({
  role: z.enum(["member", "manager", "admin"]),
});

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const workspaceId = ctx.request.nextUrl.searchParams.get("workspaceId");

  if (!workspaceId) {
    return fail("BAD_REQUEST", "workspaceId is required", 400);
  }

  const role = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (role !== "admin") return fail("FORBIDDEN", "Admin access required", 403);

  const [members, pendingInvites, auditLogs] = await Promise.all([
    workspaceMemberRepository.findByWorkspace(workspaceId),
    prisma.workspaceInvite.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        sentBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        action: true,
        resource: true,
        actorId: true,
        targetId: true,
        metadata: true,
        createdAt: true,
      },
    }),
  ]);

  return ok({
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    })),
    invites: pendingInvites,
    recentAudit: auditLogs,
  });
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const workspaceId = ctx.request.nextUrl.searchParams.get("workspaceId");
  const targetUserId = ctx.request.nextUrl.searchParams.get("targetUserId");

  if (!workspaceId || !targetUserId) {
    return fail("BAD_REQUEST", "workspaceId and targetUserId are required", 400);
  }

  const check = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (check !== "admin") return fail("FORBIDDEN", "Only admins can update member roles", 403);

  const parsed = roleSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid role", 400, parsed.error.issues);
  }

  const targetMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: targetUserId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const result = await workspaceMemberRepository.updateRole(workspaceId, targetUserId, parsed.data.role);
  if (result.count === 0) return notFound();

  await workspaceActivityRepository.create({
    workspaceId,
    userId: ctx.user.id,
    type: "members_status",
    payload: { action: "role_updated", memberId: targetUserId, role: parsed.data.role },
  });

  void auditLogService.record("permission.role_change", "workspace_member", {
    actorId: ctx.user.id,
    workspaceId,
    targetId: targetUserId,
    metadata: { newRole: parsed.data.role, targetMember },
  });

  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const workspaceId = ctx.request.nextUrl.searchParams.get("workspaceId");
  const targetUserId = ctx.request.nextUrl.searchParams.get("targetUserId");

  if (!workspaceId || !targetUserId) {
    return fail("BAD_REQUEST", "workspaceId and targetUserId are required", 400);
  }

  const check = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (check !== "admin") return fail("FORBIDDEN", "Only admins can remove members", 403);

  const result = await workspaceMemberRepository.remove(workspaceId, targetUserId);
  if (result.count === 0) return notFound();

  await workspaceActivityRepository.create({
    workspaceId,
    userId: ctx.user.id,
    type: "members_status",
    payload: { action: "removed", memberId: targetUserId },
  });

  void auditLogService.record("permission.member_remove", "workspace_member", {
    actorId: ctx.user.id,
    workspaceId,
    targetId: targetUserId,
  });

  return ok({ ok: true });
});
