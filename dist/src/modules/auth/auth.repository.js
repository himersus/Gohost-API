"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByLogin = findUserByLogin;
exports.findUserByEmail = findUserByEmail;
exports.updateUserConfirmCode = updateUserConfirmCode;
exports.activateUser = activateUser;
exports.createUser = createUser;
exports.updateUserGithub = updateUserGithub;
exports.findUserByResetToken = findUserByResetToken;
exports.setResetToken = setResetToken;
exports.clearResetToken = clearResetToken;
exports.updatePassword = updatePassword;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findUserByLogin(username) {
    return prisma_1.default.user.findFirst({
        where: { OR: [{ username }, { email: username }] },
    });
}
async function findUserByEmail(email) {
    return prisma_1.default.user.findUnique({ where: { email } });
}
async function updateUserConfirmCode(email, code) {
    return prisma_1.default.user.update({ where: { email }, data: { confirm_code: code } });
}
async function activateUser(email) {
    return prisma_1.default.user.update({
        where: { email },
        data: { is_active: true, confirm_code: null },
    });
}
async function createUser(data) {
    return prisma_1.default.user.create({ data });
}
async function updateUserGithub(id, data) {
    return prisma_1.default.user.update({ where: { id }, data });
}
async function findUserByResetToken(token) {
    return prisma_1.default.user.findFirst({
        where: { reset_token: token, reset_token_expires: { gte: new Date() } },
    });
}
async function setResetToken(email, token, expires) {
    return prisma_1.default.user.update({
        where: { email },
        data: { reset_token: token, reset_token_expires: expires },
    });
}
async function clearResetToken(id) {
    return prisma_1.default.user.update({
        where: { id },
        data: { reset_token: null, reset_token_expires: null },
    });
}
async function updatePassword(id, hashedPassword) {
    return prisma_1.default.user.update({
        where: { id },
        data: { password: hashedPassword, reset_token: null, reset_token_expires: null },
    });
}
