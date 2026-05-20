"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPasswordSchema = exports.resetPasswordSchema = exports.verifyCodeSchema = exports.sendCodeVerificationSchema = exports.loginUserSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.loginUserSchema = zod_1.default.object({
    username: zod_1.default.string().min(3),
    password: zod_1.default.string().min(6),
});
exports.sendCodeVerificationSchema = zod_1.default.object({
    email: zod_1.default.string().email("Email inválido"),
});
exports.verifyCodeSchema = zod_1.default.object({
    email: zod_1.default.string().email("Email inválido"),
    code: zod_1.default.string().length(6, "O código deve conter exatamente 6 caracteres"),
});
exports.resetPasswordSchema = zod_1.default.object({
    token: zod_1.default.string().min(1, "Token é obrigatório"),
    password: zod_1.default.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});
exports.forgotPasswordSchema = zod_1.default.object({
    email: zod_1.default.string().email("Email inválido"),
});
