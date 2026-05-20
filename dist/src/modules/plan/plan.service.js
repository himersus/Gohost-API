"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlan = createPlan;
exports.listPlans = listPlans;
exports.updatePlan = updatePlan;
exports.getPlanById = getPlanById;
exports.deletePlanById = deletePlanById;
const repo = __importStar(require("./plan.repository"));
async function createPlan(data) {
    if (!data.name || !data.description || !data.duration) {
        throw { status: 400, message: "Todos os campos são obrigatórios" };
    }
    if (data.price === undefined || data.price === null || isNaN(data.price)) {
        throw { status: 400, message: "Preço inválido" };
    }
    const existing = await repo.findPlanByName(data.name);
    if (existing) {
        throw { status: 409, message: "Já existe um plano com este nome" };
    }
    return repo.createPlan({
        ...data,
        max_projects: data.max_projects && data.max_projects > 0 ? data.max_projects : 1,
        duration_description: data.duration_description || "",
        features: data.features || [],
        shortcut: data.shortcut || "",
    });
}
async function listPlans() {
    return repo.findAllPlans();
}
async function updatePlan(planId, data) {
    const plan = await repo.findPlanByAny(planId);
    if (!plan)
        throw { status: 404, message: "Plano não encontrado" };
    await repo.updatePlan(plan.id, {
        name: data.name || plan.name,
        description: data.description || plan.description,
        price: data.price !== undefined && !isNaN(data.price) ? data.price : plan.price,
        duration: data.duration || plan.duration,
        max_projects: data.max_projects && data.max_projects > 0 ? data.max_projects : plan.max_projects,
        duration_description: data.duration_description || plan.duration_description,
        features: data.features || plan.features,
        shortcut: data.shortcut || plan.shortcut,
    });
}
async function getPlanById(planId) {
    const plan = await repo.findPlanByAny(planId);
    if (!plan)
        throw { status: 404, message: "Plano não encontrado" };
    return plan;
}
async function deletePlanById(planId) {
    const plan = await repo.findPlanByAny(planId);
    if (!plan)
        throw { status: 404, message: "Plano não encontrado" };
    await repo.deletePlan(plan.id);
}
