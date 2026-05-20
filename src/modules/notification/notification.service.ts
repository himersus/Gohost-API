import * as repo from "./notification.repository";

export async function listNotifications(
  userId: string,
  page: number,
  perPage: number,
  isAdmin: boolean,
) {
  if (isAdmin) {
    const notifications = await repo.findAllNotifications();
    return notifications;
  }

  const [notifications, total] = await Promise.all([
    repo.findNotificationsByUser(userId, page, perPage),
    repo.countNotificationsByUser(userId),
  ]);

  return {
    data: notifications,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  };
}

export async function markAsRead(notificationId: string, userId: string, isAdmin: boolean) {
  const notification = await repo.findNotificationById(notificationId);
  if (!notification) throw { status: 404, message: "Notificação não encontrada" };

  if (!isAdmin && notification.userId !== userId) {
    throw { status: 403, message: "Você não tem permissão para marcar esta notificação como lida" };
  }

  await repo.updateNotificationRead(notificationId);
}

export async function getNotification(notificationId: string, userId: string, isAdmin: boolean) {
  const notification = await repo.findNotificationById(notificationId);
  if (!notification) throw { status: 404, message: "Notificação não encontrada" };

  if (!isAdmin && notification.userId !== userId) {
    throw { status: 403, message: "Você não tem permissão para ver esta notificação" };
  }

  return notification;
}

export const createNotification = async (
  userId: string | null,
  title: string,
  message: string,
) => {
  if (!userId) {
    const admins = await repo.findAdmins();
    await Promise.all(
      admins.map((admin) =>
        repo.createNotification({
          userId: admin.id,
          title,
          message,
          read: false,
        }),
      ),
    );
    return;
  }

  await repo.createNotification({ userId, title, message, read: false });
};
