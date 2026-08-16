import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import { verifyToken } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canAccessProject, canAccessChat } from "@/lib/resource-access";

let io: SocketIOServer | null = null;

export const GET = async () => {
  if (!io) {
    const httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6,
      transports: ["websocket", "polling"],
    });

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (typeof token !== "string" || token.length === 0) {
          return next(new Error("Authentication required"));
        }

        // Verify the Clerk session JWT (signature + exp/nbf against the Clerk
        // JWKS). `sub` is the Clerk user id; the DB relations (Presence,
        // TypingIndicator, DocumentOperation…) reference User.id (cuid), so we
        // resolve the DB identity here — never store the Clerk id in those
        // columns (FK violations / mismatched ownership).
        const claims = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        if (!claims?.sub) {
          return next(new Error("Invalid authentication token"));
        }

        const user = await prisma.user.findUnique({
          where: { clerkId: claims.sub },
          select: { id: true },
        });
        if (!user) {
          return next(new Error("Invalid authentication token"));
        }

        socket.data.userId = user.id;
        next();
      } catch {
        next(new Error("Invalid authentication token"));
      }
    });

    io.on("connection", (socket) => {
      const userId = socket.data.userId as string;

      socket.on("join-project", async (data: { projectId: string }) => {
        if (!(await canAccessProject(userId, data.projectId))) {
          socket.emit("error", { message: "Forbidden" });
          return;
        }
        socket.join(`project:${data.projectId}`);
        const existingPresence = await prisma.presence.findFirst({
          where: { userId, projectId: data.projectId, chatId: null },
        });
        if (existingPresence) {
          await prisma.presence.update({
            where: { id: existingPresence.id },
            data: { status: "active", lastSeen: new Date() },
          });
        } else {
          await prisma.presence.create({
            data: { userId, projectId: data.projectId, status: "active" },
          });
        }
        io?.to(`project:${data.projectId}`).emit("presence-update", {
          userId,
          projectId: data.projectId,
          status: "active",
        });
      });

      socket.on("join-chat", async (data: { chatId: string }) => {
        if (!(await canAccessChat(userId, data.chatId))) {
          socket.emit("error", { message: "Forbidden" });
          return;
        }
        socket.join(`chat:${data.chatId}`);
        const existingPresence = await prisma.presence.findFirst({
          where: { userId, projectId: null, chatId: data.chatId },
        });
        if (existingPresence) {
          await prisma.presence.update({
            where: { id: existingPresence.id },
            data: { status: "active", lastSeen: new Date() },
          });
        } else {
          await prisma.presence.create({
            data: { userId, chatId: data.chatId, status: "active" },
          });
        }
        io?.to(`chat:${data.chatId}`).emit("presence-update", {
          userId,
          chatId: data.chatId,
          status: "active",
        });
      });

      socket.on("typing-start", async (data: { chatId: string }) => {
        if (!(await canAccessChat(userId, data.chatId))) {
          socket.emit("error", { message: "Forbidden" });
          return;
        }
        socket.to(`chat:${data.chatId}`).emit("user-typing", {
          userId,
          chatId: data.chatId,
          isTyping: true,
        });
        await prisma.typingIndicator.upsert({
          where: { userId_chatId: { userId, chatId: data.chatId } },
          create: { userId, chatId: data.chatId, isTyping: true },
          update: { isTyping: true, updatedAt: new Date() },
        });
      });

      socket.on("typing-stop", async (data: { chatId: string }) => {
        if (!(await canAccessChat(userId, data.chatId))) {
          socket.emit("error", { message: "Forbidden" });
          return;
        }
        socket.to(`chat:${data.chatId}`).emit("user-typing", {
          userId,
          chatId: data.chatId,
          isTyping: false,
        });
        await prisma.typingIndicator.deleteMany({
          where: { userId, chatId: data.chatId },
        });
      });

      socket.on("cursor-move", async (data: { chatId?: string; projectId?: string; x: number; y: number }) => {
        if (data.chatId && !(await canAccessChat(userId, data.chatId))) return;
        if (data.projectId && !(await canAccessProject(userId, data.projectId))) return;
        const room = data.chatId ? `chat:${data.chatId}` : data.projectId ? `project:${data.projectId}` : null;
        if (room) {
          socket.to(room).emit("cursor-move", { userId, x: data.x, y: data.y });
        }
      });

      socket.on("document-operation", async (data: { resourceType: string; resourceId: string; operation: Record<string, unknown>; baseVersion: number; version: number }) => {
        // Only persist/relay operations on resources the user can access —
        // never let a client write operations into another user's resource.
        const allowed =
          data.resourceType === "chat"
            ? await canAccessChat(userId, data.resourceId)
            : data.resourceType === "project"
              ? await canAccessProject(userId, data.resourceId)
              : false;
        if (!allowed) {
          socket.emit("error", { message: "Forbidden" });
          return;
        }
        const room = data.resourceType === "chat" ? `chat:${data.resourceId}` : `project:${data.resourceId}`;
        await prisma.documentOperation.create({
          data: {
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            userId,
            version: data.version,
            operation: data.operation as Prisma.InputJsonValue,
            baseVersion: data.baseVersion,
            applied: true,
          },
        });
        socket.to(room).emit("document-operation", {
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          userId,
          operation: data.operation,
          version: data.version,
        });
      });

      socket.on("leave-project", async (data: { projectId: string }) => {
        socket.leave(`project:${data.projectId}`);
        await prisma.presence.deleteMany({ where: { userId, projectId: data.projectId } });
        io?.to(`project:${data.projectId}`).emit("presence-update", { userId, projectId: data.projectId, status: "offline" });
      });

      socket.on("leave-chat", async (data: { chatId: string }) => {
        socket.leave(`chat:${data.chatId}`);
        await prisma.presence.deleteMany({ where: { userId, chatId: data.chatId } });
        await prisma.typingIndicator.deleteMany({ where: { userId, chatId: data.chatId } });
        io?.to(`chat:${data.chatId}`).emit("presence-update", { userId, chatId: data.chatId, status: "offline" });
      });

      socket.on("disconnect", async () => {
        await prisma.presence.updateMany({ where: { userId }, data: { status: "offline" } });
        io?.emit("user-offline", { userId });
      });
    });
  }

  return new Response("Socket.IO server running", { status: 200 });
};
