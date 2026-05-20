"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = findUserById;
exports.findProjectById = findProjectById;
exports.findUserWorkspaces = findUserWorkspaces;
exports.upsertEnvironment = upsertEnvironment;
exports.findEnvironmentsByProject = findEnvironmentsByProject;
exports.countEnvironmentsByProject = countEnvironmentsByProject;
exports.findEnvironmentById = findEnvironmentById;
exports.deleteEnvironment = deleteEnvironment;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findUserById(userId) {
    return prisma_1.default.user.findUnique({ where: { id: userId } });
}
async function findProjectById(projectId, userId) {
    return prisma_1.default.project.findFirst({ where: { id: projectId, userId } });
}
async function findUserWorkspaces(userId, projectId) {
    return prisma_1.default.user_workspace.findMany({ where: { userId, projectId } });
}
async function upsertEnvironment(projectId, key, value) {
    return prisma_1.default.environment.upsert({
        where: { projectId_key: { projectId, key } },
        update: { value },
        create: { projectId, key, value },
    });
}
async function findEnvironmentsByProject(projectId) {
    return prisma_1.default.environment.findMany({
        where: { projectId },
        select: {
            id: true,
            key: true,
            projectId: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
async function countEnvironmentsByProject(projectId) {
    return prisma_1.default.environment.count({ where: { projectId } });
}
async function findEnvironmentById(envId, projectId) {
    return prisma_1.default.environment.findFirst({ where: { id: envId, projectId } });
}
async function deleteEnvironment(id) {
    return prisma_1.default.environment.delete({ where: { id } });
}
