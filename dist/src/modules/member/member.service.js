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
exports.addProjectMember = addProjectMember;
exports.removeProjectMember = removeProjectMember;
exports.listProjectMembers = listProjectMembers;
const repo = __importStar(require("./member.repository"));
async function addProjectMember(currentUserId, username, projectId, role) {
    if (role && !["member", "master"].includes(role)) {
        throw { status: 400, message: "Função inválida fornecida" };
    }
    const currentUser = await repo.findUserById(currentUserId);
    if (!currentUser)
        throw { status: 401, message: "Não autorizado" };
    const isAdmin = await repo.findWorkspaceAdmin(currentUserId, projectId);
    if (!isAdmin) {
        throw { status: 403, message: "Apenas administradores podem adicionar membros" };
    }
    const user = await repo.findUserByAny(username);
    if (!user)
        throw { status: 404, message: "Usuário não encontrado" };
    const existing = await repo.findWorkspaceMember(user.id, projectId);
    if (existing) {
        throw { status: 400, message: "Usuário já é membro do projeto" };
    }
    await repo.createWorkspace({
        userId: user.id,
        projectId,
        role: role || "member",
    });
}
async function removeProjectMember(currentUserId, username, projectId) {
    const currentUser = await repo.findUserById(currentUserId);
    if (!currentUser)
        throw { status: 401, message: "Não autorizado" };
    const isAdmin = await repo.findWorkspaceAdmin(currentUserId, projectId);
    if (!isAdmin) {
        throw { status: 403, message: "Apenas administradores podem remover membros" };
    }
    const user = await repo.findUserByAny(username);
    if (!user)
        throw { status: 404, message: "Usuário não encontrado" };
    const existing = await repo.findWorkspaceMember(user.id, projectId);
    if (!existing) {
        throw { status: 400, message: "Usuário não é membro do projeto" };
    }
    await repo.deleteWorkspace(existing.id);
}
async function listProjectMembers(currentUserId, projectId, page, perPage) {
    const currentUser = await repo.findUserById(currentUserId);
    if (!currentUser)
        throw { status: 401, message: "Não autorizado" };
    const isMember = await repo.findWorkspaceMember(currentUserId, projectId);
    if (!isMember) {
        throw { status: 403, message: "Apenas membros do projeto podem listar os membros" };
    }
    const members = await repo.findWorkspacesByProject(projectId);
    const total = await repo.countWorkspacesByProject(projectId);
    return {
        data: members.map((m) => ({
            id: m.user.id,
            username: m.user.username,
            email: m.user.email,
            role: m.role,
        })),
        meta: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) },
    };
}
