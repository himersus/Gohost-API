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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.getAllProjects = exports.getMyProjects = exports.getProject = exports.regenerateDeployToken = exports.getDeployToken = exports.stopTheProject = exports.createProject = void 0;
const uuid_1 = require("uuid");
const domain_1 = require("../../utils/domain");
const to_string_1 = require("../../utils/to_string");
const crypt_1 = require("../../utils/crypt");
const github_1 = require("../../utils/github");
const project_1 = require("../../utils/project");
const repo = __importStar(require("./project.repository"));
const project_service_1 = require("./project.service");
const createProject = async (req, res) => {
    const { name, description, branch, port, repo_url, environments, default_plan, default_type_payment, period_duration } = req.body;
    const userId = req.userId;
    if (!(0, uuid_1.validate)(userId) || !userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const inputResult = (0, project_service_1.validateUserInput)(port, period_duration);
    if (!inputResult.valid) {
        return res.status(inputResult.status).json({ message: inputResult.message });
    }
    const existingName = await repo.findProjectByName(name, userId);
    if (existingName) {
        return res.status(400).json({ message: "Você já tem um projeto com esse nome" });
    }
    if (!name) {
        return res.status(400).json({ message: "O nome do projeto é obrigatório" });
    }
    try {
        const user = await (0, project_service_1.fetchUserById)(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const githubCheck = (0, project_service_1.assertGithubLinked)(user);
        if (!githubCheck.linked)
            return res.status(400).json({ message: githubCheck.message });
        const plan = await repo.findPlanByName(default_plan);
        if (!plan)
            return res.status(400).json({ message: "O plano escolhido não está disponível" });
        if (plan.duration < 30 && period_duration && period_duration > 1) {
            return res.status(400).json({ message: "O plano não suporta a duração selecionada" });
        }
        const subdomain = await (0, domain_1.generateUniqueSubdomain)(name);
        if (!subdomain)
            return res.status(500).json({ message: "Não foi possível gerar um subdomínio único" });
        if (!user.github_token)
            return res.status(400).json({ message: "Token do GitHub não encontrado" });
        const token = (0, project_service_1.decryptGithubToken)(user.github_token);
        if (!token)
            return res.status(500).json({ message: "Erro ao descriptografar token do GitHub" });
        try {
            await (0, project_service_1.validateGithubRepo)(repo_url, token);
        }
        catch (error) {
            return res.status(400).json({ message: "Erro ao verificar o repositório: " + error.message });
        }
        await (0, project_service_1.verifyGithubSession)(token);
        const days = (0, project_1.computeProjectDays)(plan.duration, default_type_payment, period_duration);
        const amount = (0, project_1.computeProjectAmount)(plan.price, default_type_payment, period_duration);
        const baseDomain = process.env.BASE_DOMAIN;
        if (!baseDomain)
            return res.status(500).json({ message: "Base domain não configurado" });
        const project = await repo.createProject({
            name,
            description,
            branch,
            repo_url,
            default_plan: plan.name,
            default_type_payment: default_type_payment || "monthly",
            port: `${port}`,
            userId: user.id,
            subdomain: subdomain,
            domain: `https://${subdomain}.${baseDomain}`,
            days,
            amount_to_pay: amount,
        });
        const upserts = (environments || []).map(({ key, value }) => prisma_1.default.environment.upsert({
            where: { projectId_key: { projectId: project.id, key } },
            update: { value: (0, crypt_1.encryptEnv)(value) },
            create: { projectId: project.id, key, value: (0, crypt_1.encryptEnv)(value) },
        }));
        if (upserts.length > 0)
            await prisma_1.default.$transaction(upserts);
        await (0, project_service_1.createMember)(user.id, project.id);
        return res.status(201).json({ ...project, paid: false });
    }
    catch (error) {
        console.error("[createProject]", error);
        return res.status(500).json({ message: "Erro ao criar projeto" });
    }
};
exports.createProject = createProject;
const stopTheProject = async (req, res) => {
    const projectId = (0, to_string_1.q)(req.params.projectId);
    const userId = req.userId;
    if (!(0, uuid_1.validate)(projectId) || !(0, uuid_1.validate)(userId)) {
        return res.status(400).json({ message: "ID inválido" });
    }
    try {
        const result = await (0, project_service_1.stopProject)(projectId, userId);
        if (result && result.statusCode !== 200) {
            return res.status(result.statusCode).json({ message: result.message });
        }
        res.status(200).json({ message: "Projeto parado com sucesso" });
    }
    catch {
        res.status(500).json({ message: "Erro ao parar projeto" });
    }
};
exports.stopTheProject = stopTheProject;
const getDeployToken = async (req, res) => {
    try {
        const projectId = (0, to_string_1.q)(req.params.projectId);
        const userId = req.userId;
        if (!(0, uuid_1.validate)(projectId) || !(0, uuid_1.validate)(userId)) {
            return res.status(400).json({ message: "ID inválido" });
        }
        const result = await (0, project_service_1.getDeployToken)(projectId, userId);
        res.status(200).json(result);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao obter token" });
    }
};
exports.getDeployToken = getDeployToken;
const regenerateDeployToken = async (req, res) => {
    try {
        const projectId = (0, to_string_1.q)(req.params.projectId);
        const userId = req.userId;
        if (!(0, uuid_1.validate)(projectId) || !(0, uuid_1.validate)(userId)) {
            return res.status(400).json({ message: "ID inválido" });
        }
        const result = await (0, project_service_1.regenerateDeployToken)(projectId, userId);
        res.status(200).json(result);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao regenerar token" });
    }
};
exports.regenerateDeployToken = regenerateDeployToken;
const getProject = async (req, res) => {
    const projectId = (0, to_string_1.q)(req.params.projectId);
    const userId = req.userId;
    if (!(0, uuid_1.validate)(projectId) || !(0, uuid_1.validate)(userId)) {
        return res.status(400).json({ message: "ID inválido" });
    }
    try {
        const user = await repo.findUserById(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const project = await repo.findProjectWithWorkspace(projectId, userId);
        if (!project)
            return res.status(404).json({ message: "Projeto não encontrado" });
        if (project.user_workspace.length === 0) {
            return res.status(403).json({ message: "Você não tem acesso a este projeto" });
        }
        const paid = !!(project.date_expire && project.date_expire > new Date());
        const lastCommit = await (0, github_1.getLastCommitFromBranch)(project.repo_url, project.branch, user.github_token);
        return res.status(200).json({
            ...project,
            paid,
            deploy: {
                commit_msg: lastCommit.message || "unknown",
                commit_branch: project.branch,
                commit_author: lastCommit.author || "unknown",
                status: project.deploy[0]?.status || "unknown",
                commit_avatar_url: lastCommit.avatar_url || null,
            },
        });
    }
    catch (error) {
        console.error("[getProject]", error);
        return res.status(500).json({ message: "Erro ao buscar projeto" });
    }
};
exports.getProject = getProject;
const getMyProjects = async (req, res) => {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const name = req.query.name;
    if (!(0, uuid_1.validate)(userId)) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }
    try {
        const user = await repo.findUserById(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const [projects, total] = await repo.findProjectsByUser(userId, page, perPage, name);
        const now = new Date();
        const data = await Promise.all(projects.map(async (p) => {
            try {
                const commit = await (0, github_1.getLastCommitFromBranch)(p.repo_url, p.branch, user.github_token);
                return {
                    ...p,
                    paid: !!(p.date_expire && p.date_expire > now),
                    deploy: {
                        commit_msg: commit.message || "unknown",
                        commit_branch: p.branch,
                        commit_author: commit.author || "unknown",
                        status: p.deploy[0]?.status || "unknown",
                        commit_avatar_url: commit.avatar_url || null,
                    },
                };
            }
            catch {
                return { ...p, paid: !!(p.date_expire && p.date_expire > now), deploy: p.deploy[0] || null };
            }
        }));
        res.status(200).json({ data, meta: { page, per_page: perPage, total_pages: Math.ceil(total / perPage) } });
    }
    catch (error) {
        console.error("[getMyProjects]", error);
        res.status(500).json({ message: "Falha ao recuperar projetos" });
    }
};
exports.getMyProjects = getMyProjects;
const getAllProjects = async (req, res) => {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.per_page) || 10;
    const name = req.query.name;
    if (!userId || !(0, uuid_1.validate)(userId)) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }
    try {
        const user = await repo.findUserById(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const [projects, total] = await repo.findProjectsByUserRaw(userId, page, limit, name);
        const now = new Date();
        const data = await Promise.all(projects.map(async (p) => {
            try {
                const commit = await (0, github_1.getLastCommitFromBranch)(p.repo_url, p.branch, user.github_token);
                return {
                    ...p,
                    paid: !!(p.date_expire && p.date_expire > now),
                    deploy: {
                        commit_msg: commit.message || "unknown",
                        commit_branch: p.branch,
                        commit_author: commit.author || "unknown",
                        status: p.deploy[0]?.status || "unknown",
                        commit_avatar_url: commit.avatar_url || null,
                    },
                };
            }
            catch {
                return { ...p, paid: !!(p.date_expire && p.date_expire > now), deploy: p.deploy[0] || null };
            }
        }));
        res.status(200).json({ data, meta: { page, per_page: limit, total_pages: Math.ceil(total / limit) } });
    }
    catch (error) {
        console.error("[getAllProjects]", error);
        res.status(500).json({ message: "Falha ao recuperar projetos" });
    }
};
exports.getAllProjects = getAllProjects;
const updateProject = async (req, res) => {
    const projectId = (0, to_string_1.q)(req.params.projectId);
    const { name, description, branch, port } = req.body;
    const userId = req.userId;
    if (!(0, uuid_1.validate)(projectId) || !(0, uuid_1.validate)(userId)) {
        return res.status(400).json({ message: "ID inválido" });
    }
    const inputResult = (0, project_service_1.validateUserInput)(port, undefined);
    if (!inputResult.valid) {
        return res.status(inputResult.status).json({ message: inputResult.message });
    }
    try {
        const project = await repo.findProjectById(projectId);
        if (!project)
            return res.status(404).json({ message: "Projeto não encontrado" });
        const workspace = await repo.findUserWorkspace(userId, projectId);
        if (!workspace || workspace.role !== "master") {
            return res.status(403).json({ message: "Você não tem acesso a este projeto" });
        }
        if (name) {
            const dup = await repo.findProjectByNameExcluding(name, userId, projectId);
            if (dup)
                return res.status(400).json({ message: "Você já tem um projeto com esse nome" });
        }
        const updated = await repo.updateProject(projectId, {
            name: name || project.name,
            description: description || project.description,
            port: port || project.port,
            branch: branch || project.branch,
        });
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ message: "Falha ao atualizar projeto" });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    const projectId = (0, to_string_1.q)(req.params.projectId);
    const userId = req.userId;
    if (!(0, uuid_1.validate)(projectId) || !(0, uuid_1.validate)(userId)) {
        return res.status(400).json({ message: "Projecto ou utilizador inválido" });
    }
    try {
        const project = await repo.findProjectById(projectId);
        if (!project)
            return res.status(404).json({ message: "Projeto não encontrado" });
        const workspace = await repo.findUserWorkspace(userId, projectId);
        if (!workspace || workspace.role !== "master") {
            return res.status(403).json({ message: "Você não tem acesso a este projeto" });
        }
        await repo.deletePaymentsByProject(projectId);
        await repo.deleteDeploysByProject(projectId);
        await repo.deleteProject(projectId);
        res.status(200).json({ message: "Projeto deletado com sucesso" });
    }
    catch (error) {
        res.status(500).json({ message: "Falha ao deletar projeto" });
    }
};
exports.deleteProject = deleteProject;
const prisma_1 = __importDefault(require("../../lib/prisma"));
