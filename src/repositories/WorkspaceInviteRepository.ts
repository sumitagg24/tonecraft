import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export class WorkspaceInviteRepository {
  async create(data: {
    workspaceId: string;
    email: string;
    role?: "member" | "manager" | "admin";
    expiresAt?: Date | string;
    sentById?: string;
    projectIds?: string[];
  }) {
    return prisma.workspaceInvite.create({
      data: {
        ...data,
        role: data.role ?? "member",
        token: randomBytes(32).toString("hex"),
      },
      include: { sentBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return prisma.workspaceInvite.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByToken(token: string) {
    return prisma.workspaceInvite.findUnique({
      where: { token },
      include: { 
        workspace: { select: { id: true, name: true } },
        sentBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findByWorkspaceAndEmail(workspaceId: string, email: string) {
    return prisma.workspaceInvite.findUnique({
      where: { workspaceId_email: { workspaceId, email } },
      include: { workspace: { select: { id: true } } },
    });
  }

  async updateStatus(token: string, status: "pending" | "accepted" | "rejected" | "expired") {
    return prisma.workspaceInvite.update({
      where: { token },
      data: { status },
    });
  }

  async delete(token: string) {
    return prisma.workspaceInvite.delete({ where: { token } });
  }

  async deleteByWorkspaceAndEmail(workspaceId: string, email: string) {
    return prisma.workspaceInvite.deleteMany({ where: { workspaceId, email } });
  }
}

export const workspaceInviteRepository = new WorkspaceInviteRepository();