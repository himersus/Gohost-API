"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDeployToken = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const verifyDeployToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ ok: false, error: "Token de deploy não fornecido" });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ ok: false, error: "Token de deploy inválido" });
        return;
    }
    const project = await prisma_1.default.project.findUnique({
        where: { deploy_token: token },
    });
    if (!project) {
        res.status(401).json({ ok: false, error: "Token de deploy inválido ou projeto não encontrado" });
        return;
    }
    req.project = project;
    next();
};
exports.verifyDeployToken = verifyDeployToken;
