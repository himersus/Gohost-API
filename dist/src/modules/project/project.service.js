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
exports.createMember = exports.fetchUserById = void 0;
exports.validateUserInput = validateUserInput;
exports.assertGithubLinked = assertGithubLinked;
exports.decryptGithubToken = decryptGithubToken;
exports.validateGithubRepo = validateGithubRepo;
exports.verifyGithubSession = verifyGithubSession;
exports.getDeployToken = getDeployToken;
exports.regenerateDeployToken = regenerateDeployToken;
exports.stopProject = stopProject;
const crypto_1 = __importDefault(require("crypto"));
const child_process_1 = require("child_process");
const crypt_1 = require("../../utils/crypt");
const github_1 = require("../../utils/github");
const repo = __importStar(require("./project.repository"));
const user_service_1 = require("../user/user.service");
Object.defineProperty(exports, "fetchUserById", { enumerable: true, get: function () { return user_service_1.fetchUserById; } });
Object.defineProperty(exports, "createMember", { enumerable: true, get: function () { return user_service_1.createMember; } });
function validateUserInput(port, period_duration) {
    const portNumber = Number(port);
    if (!port || !portNumber) {
        return { valid: false, status: 400, message: "Porta é obrigatório e deve ser um número valido" };
    }
    if (portNumber < 1024 || portNumber > 65535) {
        return { valid: false, status: 400, message: "Porta deve estar entre 1024 e 65535" };
    }
    if (period_duration !== undefined && (!Number.isInteger(period_duration) || period_duration <= 0)) {
        return { valid: false, status: 400, message: "Duração do período deve ser um número inteiro positivo" };
    }
    return { valid: true, portNumber };
}
function assertGithubLinked(user) {
    if (!user.github_id || !user.github_token || !user.github_username) {
        return { linked: false, message: "Informações do GitHub são obrigatórias, tente sincronizar com o github" };
    }
    return { linked: true };
}
function decryptGithubToken(encryptedToken) {
    return (0, crypt_1.decryptToken)(encryptedToken);
}
async function validateGithubRepo(repoUrl, token) {
    const parsed = (0, github_1.parseGithubRepo)(repoUrl);
    if (!parsed)
        throw new Error("URL do repositório GitHub inválida");
    if ((await (0, github_1.repositoryUsesDocker)(parsed.owner, parsed.repo, token)) === false) {
        throw new Error("O repositório deve conter um Dockerfile na raiz");
    }
}
async function verifyGithubSession(token) {
    const response = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (!response.ok) {
        throw new Error("A sua sessão do GitHub expirou, por favor sincronize novamente");
    }
}
async function getDeployToken(projectId, userId) {
    const project = await repo.findProjectById(projectId);
    if (!project)
        throw { status: 404, message: "Projeto não encontrado" };
    if (project.userId !== userId) {
        throw { status: 403, message: "Você não tem permissão para ver este token" };
    }
    return { deploy_token: project.deploy_token };
}
async function regenerateDeployToken(projectId, userId) {
    const project = await repo.findProjectById(projectId);
    if (!project)
        throw { status: 404, message: "Projeto não encontrado" };
    if (project.userId !== userId) {
        throw { status: 403, message: "Você não tem permissão para regenerar este token" };
    }
    const newToken = crypto_1.default.randomUUID();
    await repo.updateProjectDeployToken(projectId, newToken);
    return { deploy_token: newToken };
}
async function stopProject(projectId, userId) {
    const project = await repo.findProjectById(projectId);
    if (!project)
        return { statusCode: 404, message: "Projeto não encontrado" };
    if (project.userId !== userId) {
        return { statusCode: 403, message: "Você não tem permissão para parar este projeto" };
    }
    try {
        (0, child_process_1.execSync)(`docker stop ${project.subdomain} || true`, { timeout: 30000 });
        (0, child_process_1.execSync)(`docker rm ${project.subdomain} || true`, { timeout: 30000 });
        await repo.updateProject(projectId, { run_status: false });
        return { statusCode: 200, message: "Projeto parado com sucesso" };
    }
    catch (error) {
        console.error("[stopProject]", error.message);
        return { statusCode: 500, message: "Erro ao parar projeto" };
    }
}
