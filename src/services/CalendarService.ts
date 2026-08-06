import { prisma } from "@/lib/prisma";

export class CalendarService {
  async list(userId: string, from?: Date, to?: Date) {
    return prisma.calendarEvent.findMany({
      where: {
        userId,
        ...(from && to ? { startAt: { gte: from, lte: to } } : {}),
      },
      orderBy: { startAt: "asc" },
    });
  }

  async get(id: string, userId: string) {
    return prisma.calendarEvent.findFirst({ where: { id, userId } });
  }

  async create(userId: string, data: {
    title: string;
    description?: string;
    startAt: Date;
    endAt?: Date | null;
    allDay?: boolean;
    color?: string;
  }) {
    return prisma.calendarEvent.create({
      data: {
        userId,
        title: data.title,
        description: data.description ?? null,
        startAt: data.startAt,
        endAt: data.endAt ?? null,
        allDay: data.allDay ?? false,
        color: data.color ?? "#6366F1",
      },
    });
  }

  async update(id: string, userId: string, data: {
    title?: string;
    description?: string | null;
    startAt?: Date;
    endAt?: Date | null;
    allDay?: boolean;
    color?: string;
  }) {
    return prisma.calendarEvent.updateMany({ where: { id, userId }, data });
  }

  async remove(id: string, userId: string) {
    return prisma.calendarEvent.deleteMany({ where: { id, userId } });
  }
}

export const calendarService = new CalendarService();
