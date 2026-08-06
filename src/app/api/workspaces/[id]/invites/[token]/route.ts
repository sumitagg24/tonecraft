import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { workspaceInviteRepository } from "@/repositories/WorkspaceInviteRepository";
import { workspaceMemberRepository } from "@/repositories/WorkspaceMemberRepository";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";
import { updateInviteSchema } from "../../../workspaceSchema";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";
import { auditLogService } from "@/services/AuditLogService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id, token } = ctx.params;
  
  const invite = await workspaceInviteRepository.findByToken(token);
  if (!invite || invite.workspaceId !== id) return notFound();
  return ok(invite);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id, token } = ctx.params;
  const { status } = updateInviteSchema.parse(body);
  
  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "manager");
  if (check === "none") return fail("FORBIDDEN", "You must be a manager or admin to update invitations", 403);
  
  const invite = await workspaceInviteRepository.findByToken(token);
  if (!invite || invite.workspaceId !== id) return notFound();
  
  const updated = await workspaceInviteRepository.updateStatus(token, status);
  
  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "members_invite",
    payload: { action: `invite_${status}`, email: invite.email, inviteId: invite.id },
  });
  
  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id, token } = ctx.params;
  
  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "manager");
  if (check === "none") return fail("FORBIDDEN", "You must be a manager or admin to delete invitations", 403);
  
  const invite = await workspaceInviteRepository.findByToken(token);
  if (!invite || invite.workspaceId !== id) return notFound();
  
  await workspaceInviteRepository.delete(token);
  
  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "members_invite",
    payload: { action: "invite_deleted", email: invite.email, inviteId: token },
  });
  
  return ok({ ok: true });
});

// Accept/Decline endpoint (no auth required)
export const POST = api.POST(async (ctx, body) => {
  const { id, token } = ctx.params;
  const { action } = body as { action: "accept" | "decline" };
  
  const invite = await workspaceInviteRepository.findByToken(token);
  if (!invite || invite.workspaceId !== id) return notFound();
  if (invite.status !== "pending") return fail("BAD_REQUEST", "Invitation is no longer pending", 400);
  
  if (action === "accept") {
    await workspaceMemberRepository.create({
      workspaceId: invite.workspaceId,
      userId: ctx.user.id,
      role: invite.role,
    });
    
    await workspaceInviteRepository.updateStatus(token, "accepted");
    
    await workspaceActivityRepository.create({
      workspaceId: invite.workspaceId,
      userId: ctx.user.id,
      type: "members_invite",
      payload: { action: "invite_accepted", email: invite.email, userId: ctx.user.id },
    });

    void auditLogService.record("workspace.invite_accepted", "workspace_invite", {
      actorId: ctx.user.id,
      workspaceId: invite.workspaceId,
      resourceId: invite.id,
      metadata: { role: invite.role, email: invite.email },
    });
    
    return ok({ message: "Invitation accepted" });
  } else {
    await workspaceInviteRepository.updateStatus(token, "rejected");
    
    await workspaceActivityRepository.create({
      workspaceId: invite.workspaceId,
      userId: ctx.user.id,
      type: "members_invite",
      payload: { action: "invite_declined", email: invite.email, userId: ctx.user.id },
    });
    
    return ok({ message: "Invitation declined" });
  }
});