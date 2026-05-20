"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = findUserById;
exports.findNotificationById = findNotificationById;
exports.findNotificationsByUser = findNotificationsByUser;
exports.countNotificationsByUser = countNotificationsByUser;
exports.findAllNotifications = findAllNotifications;
exports.updateNotificationRead = updateNotificationRead;
exports.findAdmins = findAdmins;
exports.createNotification = createNotification;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findUserById(userId) {
    return prisma_1.default.user.findFirst({ where: { id: userId } });
}
async function findNotificationById(id) {
    return prisma_1.default.notification.findFirst({ where: { id } });
}
async function findNotificationsByUser(userId, page, perPage) {
    return prisma_1.default.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
    });
}
async function countNotificationsByUser(userId) {
    return prisma_1.default.notification.count({ where: { userId } });
}
async function findAllNotifications() {
    return prisma_1.default.notification.findMany({
        orderBy: { createdAt: "desc" },
    });
}
async function updateNotificationRead(id) {
    return prisma_1.default.notification.update({
        where: { id },
        data: { read: true },
    });
}
async function findAdmins() {
    return prisma_1.default.user.findMany({ where: { roleUser: "admin" } });
}
async function createNotification(data) {
    return prisma_1.default.notification.create({ data });
}
