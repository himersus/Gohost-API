"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOneNotification = exports.markNotificationAsRead = exports.myNotifications = void 0;
const uuid_1 = require("uuid");
const to_string_1 = require("../../utils/to_string");
const service = __importStar(require("./notification.service"));
const myNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const page = parseInt((0, to_string_1.q)(req.query.page) || "1");
        const perPage = parseInt((0, to_string_1.q)(req.query.per_page) || "10");
        if (!(0, uuid_1.validate)(userId)) {
            return res.status(400).json({ message: "ID do usuário inválido" });
        }
        const user = req.user;
        const isAdmin = user?.roleUser === "admin";
        const result = await service.listNotifications(userId, page, perPage, isAdmin);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Erro ao buscar notificações" });
    }
};
exports.myNotifications = myNotifications;
const markNotificationAsRead = async (req, res) => {
    try {
        const notificationId = (0, to_string_1.q)(req.params.notificationId);
        const userId = req.userId;
        const isAdmin = req.user?.roleUser === "admin";
        if (!(0, uuid_1.validate)(notificationId)) {
            return res.status(400).json({ message: "ID da notificação inválido" });
        }
        await service.markAsRead(notificationId, userId, isAdmin);
        res.status(200).json({ message: "Notificação marcada como lida" });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao marcar notificação como lida" });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const getOneNotification = async (req, res) => {
    try {
        const notificationId = (0, to_string_1.q)(req.params.notificationId);
        const userId = req.userId;
        const isAdmin = req.user?.roleUser === "admin";
        if (!(0, uuid_1.validate)(notificationId)) {
            return res.status(400).json({ message: "ID da notificação inválido" });
        }
        const notification = await service.getNotification(notificationId, userId, isAdmin);
        res.status(200).json(notification);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao buscar notificação" });
    }
};
exports.getOneNotification = getOneNotification;
