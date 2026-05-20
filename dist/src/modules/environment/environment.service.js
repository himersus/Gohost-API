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
exports.saveEnvironmentVars = saveEnvironmentVars;
exports.listEnvironmentVars = listEnvironmentVars;
exports.deleteEnvironmentVar = deleteEnvironmentVar;
const crypt_1 = require("../../utils/crypt");
const repo = __importStar(require("./environment.repository"));
async function saveEnvironmentVars(userId, projectId, environments) {
    const user = await repo.findUserById(userId);
    if (!user)
        throw { status: 404, message: "Usuário não encontrado" };
    const members = await repo.findUserWorkspaces(userId, projectId);
    if (members.length === 0) {
        throw { status: 403, message: "Você não tem acesso a este projeto" };
    }
    const project = await repo.findProjectById(projectId, userId);
    if (!project)
        throw { status: 404, message: "Projeto não encontrado" };
    const upserts = environments.map(({ key, value }) => repo.upsertEnvironment(projectId, key, (0, crypt_1.encryptEnv)(value)));
    await Promise.all(upserts);
}
async function listEnvironmentVars(userId, projectId, page, perPage) {
    const user = await repo.findUserById(userId);
    if (!user)
        throw { status: 404, message: "Usuário não encontrado" };
    const members = await repo.findUserWorkspaces(userId, projectId);
    if (members.length === 0) {
        throw { status: 403, message: "Você não tem acesso a este projeto" };
    }
    const project = await repo.findProjectById(projectId, userId);
    if (!project)
        throw { status: 404, message: "Projeto não encontrado" };
    const [vars, total] = await Promise.all([
        repo.findEnvironmentsByProject(projectId),
        repo.countEnvironmentsByProject(projectId),
    ]);
    return {
        data: vars,
        meta: {
            page,
            per_page: perPage,
            total,
            total_pages: Math.ceil(total / perPage),
        },
    };
}
async function deleteEnvironmentVar(userId, projectId, envId) {
    const user = await repo.findUserById(userId);
    if (!user)
        throw { status: 404, message: "Usuário não encontrado" };
    const members = await repo.findUserWorkspaces(userId, projectId);
    if (members.length === 0) {
        throw { status: 403, message: "Você não tem acesso a este projeto" };
    }
    const project = await repo.findProjectById(projectId, userId);
    if (!project)
        throw { status: 404, message: "Projeto não encontrado" };
    const env = await repo.findEnvironmentById(envId, projectId);
    if (!env) {
        throw { status: 404, message: "Variável de ambiente não encontrada" };
    }
    await repo.deleteEnvironment(envId);
}
