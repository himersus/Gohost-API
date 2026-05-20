"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createUserSchema = zod_1.default.object({
    name: zod_1.default.string().min(3, "O nome deve conter pelo menos 3 caracteres"),
    email: zod_1.default.string().email("Email inválido"),
    password: zod_1.default.string().min(6, "A senha deve conter pelo menos 6 caracteres"),
});
exports.updateUserSchema = zod_1.default.object({
    name: zod_1.default.string().min(3, "O nome deve conter pelo menos 3 caracteres").optional(),
    email: zod_1.default.string().email("Email inválido").optional(),
    password: zod_1.default.string().min(6, "A senha deve conter pelo menos 6 caracteres").optional(),
});
