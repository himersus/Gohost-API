"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlanSchema = exports.createPlanSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createPlanSchema = zod_1.default.object({
    name: zod_1.default.string().min(3, "O nome deve conter pelo menos 3 caracteres"),
    description: zod_1.default.string().min(10, "A descrição deve conter pelo menos 10 caracteres"),
    price: zod_1.default.number().positive("O preço deve ser positivo"),
    duration: zod_1.default.number().int().positive(),
    max_projects: zod_1.default.number().int().positive(),
    duration_description: zod_1.default.string().optional(),
    features: zod_1.default.array(zod_1.default.string()).optional(),
    shortcut: zod_1.default.string().optional()
});
exports.updatePlanSchema = zod_1.default.object({
    name: zod_1.default.string().min(3).optional(),
    description: zod_1.default.string().min(10).optional(),
    price: zod_1.default.number().positive().optional(),
    duration: zod_1.default.number().int().positive().optional(),
    max_projects: zod_1.default.number().int().positive().optional(),
    duration_description: zod_1.default.string().optional(),
    features: zod_1.default.array(zod_1.default.string()).optional(),
    shortcut: zod_1.default.string().optional()
});
