"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = findUserById;
exports.findUserByAny = findUserByAny;
exports.findProjectById = findProjectById;
exports.findPlanByName = findPlanByName;
exports.findPlanById = findPlanById;
exports.findPaymentById = findPaymentById;
exports.findPaymentByRef = findPaymentByRef;
exports.findPaymentByProof = findPaymentByProof;
exports.createPayment = createPayment;
exports.updatePayment = updatePayment;
exports.updateProject = updateProject;
exports.findPaymentsByUser = findPaymentsByUser;
exports.findPaymentByUserAndId = findPaymentByUserAndId;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findUserById(userId) {
    return prisma_1.default.user.findUnique({ where: { id: userId } });
}
async function findUserByAny(userId) {
    return prisma_1.default.user.findFirst({ where: { id: userId } });
}
async function findProjectById(projectId) {
    return prisma_1.default.project.findUnique({ where: { id: projectId } });
}
async function findPlanByName(name) {
    return prisma_1.default.plan.findUnique({ where: { name } });
}
async function findPlanById(id) {
    return prisma_1.default.plan.findUnique({ where: { id } });
}
async function findPaymentById(id) {
    return prisma_1.default.payment.findUnique({ where: { id } });
}
async function findPaymentByRef(ref, merchant) {
    return prisma_1.default.payment.findFirst({
        where: { OR: [{ merchant }, { ref }] },
    });
}
async function findPaymentByProof(proof) {
    return prisma_1.default.payment.findFirst({ where: { proof_payment: proof } });
}
async function createPayment(data) {
    return prisma_1.default.payment.create({ data });
}
async function updatePayment(id, data) {
    return prisma_1.default.payment.update({ where: { id }, data });
}
async function updateProject(id, data) {
    return prisma_1.default.project.update({ where: { id }, data });
}
async function findPaymentsByUser(userId, status, page, perPage, nameProject) {
    const where = { userId };
    if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
    }
    if (page && perPage) {
        return prisma_1.default.$transaction([
            prisma_1.default.payment.findMany({
                where: {
                    ...where,
                    project: nameProject
                        ? { name: { contains: nameProject, mode: "insensitive" } }
                        : undefined,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            prisma_1.default.payment.count({ where }),
        ]);
    }
    return prisma_1.default.payment.findMany({ where, orderBy: { createdAt: "desc" } });
}
async function findPaymentByUserAndId(userId, paymentId) {
    return prisma_1.default.payment.findFirst({ where: { id: paymentId, userId } });
}
