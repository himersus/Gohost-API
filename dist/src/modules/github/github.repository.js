"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = findUserById;
exports.updateUserGithub = updateUserGithub;
exports.findUserRepos = findUserRepos;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findUserById(userId) {
    return prisma_1.default.user.findFirst({ where: { id: userId } });
}
async function updateUserGithub(id, data) {
    return prisma_1.default.user.update({ where: { id }, data });
}
async function findUserRepos(userId) {
    return prisma_1.default.user.findFirst({ where: { id: userId } });
}
