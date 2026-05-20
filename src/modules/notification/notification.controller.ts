import { Request, Response } from "express";
import { validate } from "uuid";
import { q } from "../../utils/to_string";
import * as service from "./notification.service";

export const myNotifications = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const page = parseInt(q(req.query.page) || "1");
    const perPage = parseInt(q(req.query.per_page) || "10");

    if (!validate(userId)) {
      return res.status(400).json({ message: "ID do usuário inválido" });
    }

    const user = req.user;
    const isAdmin = user?.roleUser === "admin";

    const result = await service.listNotifications(userId, page, perPage, isAdmin);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Erro ao buscar notificações" });
  }
};

export const markNotificationAsRead = async (req: Request | any, res: Response) => {
  try {
    const notificationId = q(req.params.notificationId);
    const userId = req.userId;
    const isAdmin = req.user?.roleUser === "admin";

    if (!validate(notificationId)) {
      return res.status(400).json({ message: "ID da notificação inválido" });
    }

    await service.markAsRead(notificationId, userId, isAdmin);
    res.status(200).json({ message: "Notificação marcada como lida" });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao marcar notificação como lida" });
  }
};

export const getOneNotification = async (req: Request | any, res: Response) => {
  try {
    const notificationId = q(req.params.notificationId);
    const userId = req.userId;
    const isAdmin = req.user?.roleUser === "admin";

    if (!validate(notificationId)) {
      return res.status(400).json({ message: "ID da notificação inválido" });
    }

    const notification = await service.getNotification(notificationId, userId, isAdmin);
    res.status(200).json(notification);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao buscar notificação" });
  }
};
