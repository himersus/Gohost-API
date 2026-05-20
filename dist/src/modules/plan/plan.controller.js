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
exports.addPlan = addPlan;
exports.getPlans = getPlans;
exports.updatePlan = updatePlan;
exports.getPlanById = getPlanById;
exports.deletePlan = deletePlan;
const to_string_1 = require("../../utils/to_string");
const service = __importStar(require("./plan.service"));
async function addPlan(req, res) {
    try {
        const plan = await service.createPlan(req.body);
        res.status(201).json(plan);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao criar plano" });
    }
}
async function getPlans(req, res) {
    try {
        const plans = await service.listPlans();
        res.status(200).json(plans);
    }
    catch {
        res.status(500).json({ message: "Erro ao buscar planos" });
    }
}
async function updatePlan(req, res) {
    try {
        const planId = (0, to_string_1.q)(req.params.planId);
        await service.updatePlan(planId, req.body);
        res.status(200).json({ message: "Plano atualizado com sucesso" });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao atualizar plano" });
    }
}
async function getPlanById(req, res) {
    try {
        const planId = (0, to_string_1.q)(req.params.planId);
        const plan = await service.getPlanById(planId);
        res.status(200).json(plan);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao buscar plano" });
    }
}
async function deletePlan(req, res) {
    try {
        const planId = (0, to_string_1.q)(req.params.planId);
        await service.deletePlanById(planId);
        res.status(200).json({ message: "Plano deletado com sucesso" });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao deletar plano" });
    }
}
