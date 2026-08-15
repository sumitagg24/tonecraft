import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { workspaceInviteRepository } from "@/repositories/WorkspaceInviteRepository";
import { workspaceRepository } from "@/repositories/WorkspaceRepository";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";
import { inviteCreateSchema } from "../../workspaceSchema";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";
import { notificationService } from "@/services/NotificationService";
import { auditLogService } from "@/services/AuditLogService";
import { fireAndForget } from "@/lib/fire-and-forget";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;

  const isMember = await permissionMiddleware.isWorkspaceMember(id, ctx.user.id);
  if (!isMember) return fail("FORBIDDEN", "You are not a member of this workspace", 403);

  const invites = await workspaceInviteRepository.findByWorkspace(id);
  return ok(invites);
});

export const POST = api.POST(async (ctx, body) => {
  const { id } = ctx.params;
  const { email, role, expiresAt, projectIds } = inviteCreateSchema.parse(body);

  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "manager");
  if (check === "none") return fail("FORBIDDEN", "You must be a manager or admin to invite members", 403);

  const workspace = await workspaceRepository.findById(id);
  if (!workspace) return notFound();

  const invite = await workspaceInviteRepository.create({
    workspaceId: id,
    email,
    role,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    sentById: ctx.user.id,
    projectIds,
  });

  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "members_invite",
    payload: { action: "invite_sent", email, role, inviteId: invite.id },
  });

  fireAndForget(
    notificationService.createInvitation(ctx.user.id, email, id, workspace.name, role ?? "member"),
    "notification.createInvitation",
    { workspaceId: id, email }
  );

  void auditLogService.record("permission.member_add", "workspace_invite", {
    actorId: ctx.user.id,
    workspaceId: id,
    resourceId: invite.id,
    metadata: { email, role, inviteId: invite.id },
  });

  return ok(invite, 201);
});
