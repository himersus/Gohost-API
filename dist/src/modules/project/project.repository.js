"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProjectById = findProjectById;
exports.findProjectByName = findProjectByName;
exports.findProjectByNameExcluding = findProjectByNameExcluding;
exports.findUserById = findUserById;
exports.findPlanByName = findPlanByName;
exports.createProject = createProject;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
exports.findUserWorkspace = findUserWorkspace;
exports.findProjectWithWorkspace = findProjectWithWorkspace;
exports.findProjectsByUser = findProjectsByUser;
exports.findProjectsByUserRaw = findProjectsByUserRaw;
exports.deletePaymentsByProject = deletePaymentsByProject;
exports.deleteDeploysByProject = deleteDeploysByProject;
exports.findProjectWithDeploy = findProjectWithDeploy;
exports.updateProjectDeployToken = updateProjectDeployToken;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findProjectById(projectId) {
    return prisma_1.default.project.findUnique({ where: { id: projectId } });
}
async function findProjectByName(name, userId) {
    return prisma_1.default.project.findFirst({ where: { name, userId } });
}
async function findProjectByNameExcluding(name, userId, projectId) {
    return prisma_1.default.project.findFirst({
        where: { name, userId, NOT: { id: projectId } },
    });
}
async function findUserById(userId) {
    return prisma_1.default.user.findUnique({ where: { id: userId } });
}
async function findPlanByName(name) {
    return prisma_1.default.plan.findFirst({ where: { name } });
}
async function createProject(data) {
    return prisma_1.default.project.create({ data });
}
async function updateProject(id, data) {
    return prisma_1.default.project.update({ where: { id }, data });
}
async function deleteProject(id) {
    return prisma_1.default.project.delete({ where: { id } });
}
async function findUserWorkspace(userId, projectId) {
    return prisma_1.default.user_workspace.findFirst({ where: { userId, projectId } });
}
async function findProjectWithWorkspace(projectId, userId) {
    return prisma_1.default.project.findUnique({
        where: { id: projectId },
        include: {
            user_workspace: { where: { userId }, take: 1 },
            deploy: { orderBy: { createdAt: "desc" }, take: 1 },
        },
    });
}
async function findProjectsByUser(userId, page, perPage, name) {
    const where = {
        userId,
        ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
    };
    return Promise.all([
        prisma_1.default.project.findMany({
            where,
            include: {
                deploy: { orderBy: { createdAt: "desc" }, take: 1 },
            },
            skip: (page - 1) * perPage,
            take: perPage,
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.default.project.count({ where }),
    ]);
}
async function findProjectsByUserRaw(userId, page, limit, name) {
    const where = {
        userId,
        ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
    };
    return Promise.all([
        prisma_1.default.project.findMany({
            where,
            include: {
                deploy: { orderBy: { createdAt: "desc" }, take: 1 },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.default.project.count({ where }),
    ]);
}
async function deletePaymentsByProject(projectId) {
    return prisma_1.default.payment.deleteMany({ where: { projectId } });
}
async function deleteDeploysByProject(projectId) {
    return prisma_1.default.deploy.deleteMany({ where: { projectId } });
}
async function findProjectWithDeploy(projectId) {
    return prisma_1.default.project.findFirst({
        where: { id: projectId },
        include: {
            deploy: { orderBy: { createdAt: "desc" }, take: 1 },
        },
    });
}
async function updateProjectDeployToken(id, token) {
    return prisma_1.default.project.update({
        where: { id },
        data: { deploy_token: token },
    });
}
