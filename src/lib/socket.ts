import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface SocketData {
  userId: string;
  name: string | null;
  image: string | null;
}

let ioInstance: SocketIOServer | null = null;

export function initSocket(server: HTTPServer) {
  if (ioInstance) return ioInstance;

  ioInstance = new SocketIOServer(server, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    transports: ["websocket", "polling"],
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  ioInstance.on("connection", (socket) => {
    const userData = socket.handshake.auth as SocketData;
    socket.data.userId = userData.userId;
    socket.data.name = userData.name;
    socket.data.image = userData.image;

    socket.on("join-project", async (data: { projectId: string }) => {
      socket.join(`project:${data.projectId}`);
      const existingPresence = await prisma.presence.findFirst({
        where: { userId: userData.userId, projectId: data.projectId, chatId: null },
      });
      if (existingPresence) {
        await prisma.presence.update({
          where: { id: existingPresence.id },
          data: { status: "active", lastSeen: new Date() },
        });
      } else {
        await prisma.presence.create({
          data: { userId: userData.userId, projectId: data.projectId, status: "active" },
        });
      }
      ioInstance?.to(`project:${data.projectId}`).emit("presence-update", {
        userId: userData.userId,
        projectId: data.projectId,
        status: "active",
      });
    });

    socket.on("join-chat", async (data: { chatId: string }) => {
      socket.join(`chat:${data.chatId}`);
      const existingPresence = await prisma.presence.findFirst({
        where: { userId: userData.userId, projectId: null, chatId: data.chatId },
      });
      if (existingPresence) {
        await prisma.presence.update({
          where: { id: existingPresence.id },
          data: { status: "active", lastSeen: new Date() },
        });
      } else {
        await prisma.presence.create({
          data: { userId: userData.userId, chatId: data.chatId, status: "active" },
        });
      }
      ioInstance?.to(`chat:${data.chatId}`).emit("presence-update", {
        userId: userData.userId,
        chatId: data.chatId,
        status: "active",
      });
    });

    socket.on("typing-start", async (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit("user-typing", {
        userId: userData.userId,
        chatId: data.chatId,
        isTyping: true,
      });
      await prisma.typingIndicator.upsert({
        where: { userId_chatId: { userId: userData.userId, chatId: data.chatId } },
        create: { userId: userData.userId, chatId: data.chatId, isTyping: true },
        update: { isTyping: true, updatedAt: new Date() },
      });
    });

    socket.on("typing-stop", async (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit("user-typing", {
        userId: userData.userId,
        chatId: data.chatId,
        isTyping: false,
      });
      await prisma.typingIndicator.deleteMany({
        where: { userId: userData.userId, chatId: data.chatId },
      });
    });

    socket.on("cursor-move", async (data: { chatId?: string; projectId?: string; x: number; y: number }) => {
      const room = data.chatId ? `chat:${data.chatId}` : data.projectId ? `project:${data.projectId}` : null;
      if (room) {
        socket.to(room).emit("cursor-move", {
          userId: userData.userId,
          x: data.x,
          y: data.y,
        });
      }
    });

    socket.on("document-operation", async (data: {
      resourceType: string;
      resourceId: string;
      operation: Record<string, unknown>;
      baseVersion: number;
      version: number;
    }) => {
      const pending = await prisma.documentOperation.findMany({
        where: {
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          baseVersion: data.baseVersion,
          applied: false,
        },
        orderBy: { createdAt: "asc" },
      });

      if (pending.length > 0) {
        socket.emit("conflict-detected", {
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          pendingOps: pending.map((p) => p.operation),
          strategy: "last-write-wins",
        });
      }

      await prisma.documentOperation.create({
        data: {
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          userId: userData.userId,
          version: data.version,
          operation: data.operation as Prisma.InputJsonValue,
          baseVersion: data.baseVersion,
          applied: true,
        },
      });

      socket.to(data.resourceType === "chat" ? `chat:${data.resourceId}` : `project:${data.resourceId}`).emit("document-operation", {
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        userId: userData.userId,
        operation: data.operation,
        version: data.version,
      });
    });

    socket.on("leave-project", async (data: { projectId: string }) => {
      socket.leave(`project:${data.projectId}`);
      await prisma.presence.deleteMany({
        where: { userId: userData.userId, projectId: data.projectId },
      });
      ioInstance?.to(`project:${data.projectId}`).emit("presence-update", {
        userId: userData.userId,
        projectId: data.projectId,
        status: "offline",
      });
    });

    socket.on("leave-chat", async (data: { chatId: string }) => {
      socket.leave(`chat:${data.chatId}`);
      await prisma.presence.deleteMany({
        where: { userId: userData.userId, chatId: data.chatId },
      });
      await prisma.typingIndicator.deleteMany({
        where: { userId: userData.userId, chatId: data.chatId },
      });
      ioInstance?.to(`chat:${data.chatId}`).emit("presence-update", {
        userId: userData.userId,
        chatId: data.chatId,
        status: "offline",
      });
    });

    socket.on("disconnect", async () => {
      await prisma.presence.updateMany({
        where: { userId: userData.userId },
        data: { status: "offline" },
      });
      ioInstance?.emit("user-offline", { userId: userData.userId });
    });
  });

  return ioInstance;
}

export function getSocketInstance(): SocketIOServer | null {
  return ioInstance;
}