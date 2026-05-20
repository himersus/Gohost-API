"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = findUserById;
exports.findUserByAny = findUserByAny;
exports.findWorkspaceAdmin = findWorkspaceAdmin;
exports.findWorkspaceMember = findWorkspaceMember;
exports.createWorkspace = createWorkspace;
exports.deleteWorkspace = deleteWorkspace;
exports.findWorkspacesByProject = findWorkspacesByProject;
exports.countWorkspacesByProject = countWorkspacesByProject;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findUserById(userId) {
    return prisma_1.default.user.findFirst({ where: { id: userId } });
}
async function findUserByAny(username) {
    return prisma_1.default.user.findFirst({
        where: {
            OR: [
                { id: /^[0-9a-f-]{36}$/i.test(username) ? username : undefined },
                { username },
                { email: username },
            ],
        },
    });
}
async function findWorkspaceAdmin(userId, projectId) {
    return prisma_1.default.user_workspace.findFirst({
        where: { userId, projectId, role: "master" },
    });
}
async function findWorkspaceMember(userId, projectId) {
    return prisma_1.default.user_workspace.findFirst({ where: { userId, projectId } });
}
async function createWorkspace(data) {
    return prisma_1.default.user_workspace.create({ data });
}
async function deleteWorkspace(id) {
    return prisma_1.default.user_workspace.delete({ where: { id } });
}
async function findWorkspacesByProject(projectId) {
    return prisma_1.default.user_workspace.findMany({
        where: { projectId },
        include: { user: true },
    });
}
async function countWorkspacesByProject(projectId) {
    return prisma_1.default.user_workspace.count({ where: { projectId } });
}
