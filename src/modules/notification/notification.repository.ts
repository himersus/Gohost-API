import prisma from "../../lib/prisma";

export async function findUserById(userId: string) {
  return prisma.user.findFirst({ where: { id: userId } });
}

export async function findNotificationById(id: string) {
  return prisma.notification.findFirst({ where: { id } });
}

export async function findNotificationsByUser(
  userId: string,
  page: number,
  perPage: number,
) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
  });
}

export async function countNotificationsByUser(userId: string) {
  return prisma.notification.count({ where: { userId } });
}

export async function findAllNotifications() {
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updateNotificationRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

export async function findAdmins() {
  return prisma.user.findMany({ where: { roleUser: "admin" } });
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  read: boolean;
}) {
  return prisma.notification.create({ data });
}
