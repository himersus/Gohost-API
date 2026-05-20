"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProjectById = findProjectById;
exports.findProjectsByUser = findProjectsByUser;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findProjectById(projectId) {
    return prisma_1.default.project.findFirst({ where: { id: projectId } });
}
async function findProjectsByUser(userId) {
    return prisma_1.default.project.findMany({
        where: { userId },
        select: {
            id: true,
            subdomain: true,
            payments: true,
            user_workspace: true,
        },
    });
}
