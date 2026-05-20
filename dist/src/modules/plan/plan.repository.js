"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPlanByName = findPlanByName;
exports.findPlanByAny = findPlanByAny;
exports.createPlan = createPlan;
exports.findAllPlans = findAllPlans;
exports.updatePlan = updatePlan;
exports.deletePlan = deletePlan;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function findPlanByName(name) {
    return prisma_1.default.plan.findFirst({ where: { name } });
}
async function findPlanByAny(idOrName) {
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrName);
    return prisma_1.default.plan.findFirst({
        where: {
            OR: [
                { id: isUuid ? idOrName : undefined },
                { name: isUuid ? undefined : idOrName },
            ],
        },
    });
}
async function createPlan(data) {
    return prisma_1.default.plan.create({ data });
}
async function findAllPlans() {
    return prisma_1.default.plan.findMany();
}
async function updatePlan(id, data) {
    return prisma_1.default.plan.update({ where: { id }, data });
}
async function deletePlan(id) {
    return prisma_1.default.plan.delete({ where: { id } });
}
