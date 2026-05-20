"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveEnvSchema = exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const client_1 = require("@prisma/client");
exports.createProjectSchema = zod_1.default.object({
    name: zod_1.default.string().min(3, "O nome deve conter pelo menos 3 caracteres"),
    description: zod_1.default.string().min(10, "A descrição deve conter pelo menos 10 caracteres"),
    branch: zod_1.default.string().min(3, "A branch deve conter pelo menos 3 caracteres"),
    port: zod_1.default.number().int().positive("A porta deve ser um número positivo"),
    period_duration: zod_1.default.number().int().positive().optional(),
    repo_url: zod_1.default.string().url("URL do repositório inválida"),
    environments: zod_1.default.array(zod_1.default.object({ key: zod_1.default.string(), value: zod_1.default.string() })).optional(),
    default_plan: zod_1.default.string().min(3, "O plano padrão deve conter pelo menos 3 caracteres"),
    default_type_payment: zod_1.default.enum(client_1.typePayment).optional(),
});
exports.updateProjectSchema = zod_1.default.object({
    name: zod_1.default.string().min(3).optional(),
    description: zod_1.default.string().min(10).optional(),
    branch: zod_1.default.string().min(3).optional(),
    port: zod_1.default.number().int().positive().optional(),
    period_duration: zod_1.default.number().int().positive().optional(),
    environments: zod_1.default.array(zod_1.default.object({ key: zod_1.default.string(), value: zod_1.default.string() })).optional(),
});
exports.saveEnvSchema = zod_1.default.object({
    environments: zod_1.default.array(zod_1.default.object({
        key: zod_1.default.string(),
        value: zod_1.default.string(),
    })),
});
