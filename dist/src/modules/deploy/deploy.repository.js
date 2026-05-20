"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = findUserById;
exports.findProjectById = findProjectById;
exports.findDeployById = findDeployById;
exports.findUserWorkspace = findUserWorkspace;
exports.findDeploysByProject = findDeploysByProject;
exports.countDeploysByProject = countDeploysByProject;
exports.findProjectBySubdomain = findProjectBySubdomain;
exports.createDeploy = createDeploy;
exports.updateDeployStatus = updateDeployStatus;
exports.findDeployWithProject = findDeployWithProject;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findUserById(userId) {
    return prisma_1.default.user.findUnique({ where: { id: userId } });
}
async function findProjectById(projectId) {
    return prisma_1.default.project.findUnique({ where: { id: projectId } });
}
async function findDeployById(deployId) {
    return prisma_1.default.deploy.findUnique({ where: { id: deployId } });
}
async function findUserWorkspace(userId, projectId) {
    return prisma_1.default.user_workspace.findFirst({
        where: { userId, projectId },
    });
}
async function findDeploysByProject(projectId, page, perPage) {
    return prisma_1.default.deploy.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
    });
}
async function countDeploysByProject(projectId) {
    return prisma_1.default.deploy.count({ where: { projectId } });
}
async function findProjectBySubdomain(subdomain) {
    return prisma_1.default.project.findUnique({ where: { subdomain } });
}
async function createDeploy(data) {
    return prisma_1.default.deploy.create({ data });
}
async function updateDeployStatus(deployId, data) {
    return prisma_1.default.deploy.update({
        where: { id: deployId },
        data: data,
    });
}
async function findDeployWithProject(deployId) {
    return prisma_1.default.deploy.findUnique({
        where: { id: deployId },
        include: { Project: true },
    });
}
