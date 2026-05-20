"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByAny = findUserByAny;
exports.findUserByEmailOrUsername = findUserByEmailOrUsername;
exports.findUserById = findUserById;
exports.findAllUsers = findAllUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findUserByAny(userId) {
    const isUuid = /^[0-9a-f-]{36}$/i.test(userId);
    return prisma_1.default.user.findFirst({
        where: {
            OR: [
                { id: isUuid ? userId : undefined },
                { username: userId },
                { email: userId },
            ],
        },
    });
}
async function findUserByEmailOrUsername(email, username) {
    return prisma_1.default.user.findFirst({
        where: { OR: [{ email }, { username }] },
    });
}
async function findUserById(userId) {
    return prisma_1.default.user.findUnique({ where: { id: userId } });
}
async function findAllUsers(username, page, limit) {
    return prisma_1.default.user.findMany({
        where: username
            ? { username: { contains: username, mode: "insensitive" } }
            : undefined,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
    });
}
async function createUser(data) {
    return prisma_1.default.user.create({ data });
}
async function updateUser(id, data) {
    return prisma_1.default.user.update({ where: { id }, data });
}
