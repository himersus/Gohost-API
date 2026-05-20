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
exports.listDeploys = listDeploys;
exports.getDeploy = getDeploy;
exports.deployApp = deployApp;
exports.getDeployLogs = getDeployLogs;
exports.cancelDeploy = cancelDeploy;
const uuid_1 = require("uuid");
const child_process_1 = require("child_process");
const repo = __importStar(require("./deploy.repository"));
const BASE_DOMAIN = process.env.BASE_DOMAIN || "enor.tech";
const TRAEFIK_NETWORK = "traefik-public";
function runDockerCommand(command) {
    try {
        return (0, child_process_1.execSync)(command, { timeout: 120000, encoding: "utf-8" });
    }
    catch (error) {
        throw new Error(error.stderr || error.message);
    }
}
async function validateAuthenticatedUser(userId) {
    if (!userId || !(0, uuid_1.validate)(userId)) {
        return { valid: false, status: 401, message: "Usuário não autenticado" };
    }
    const user = await repo.findUserById(userId);
    if (!user) {
        return { valid: false, status: 404, message: "Usuário não encontrado" };
    }
    return { valid: true, user };
}
async function listDeploys(projectId, userId, pagination) {
    const auth = await validateAuthenticatedUser(userId);
    if (!auth.valid) {
        throw { status: auth.status, message: auth.message };
    }
    if (!(0, uuid_1.validate)(projectId)) {
        throw { status: 400, message: "ID do projeto inválido" };
    }
    const project = await repo.findProjectById(projectId);
    if (!project) {
        throw { status: 404, message: "Projeto não encontrado" };
    }
    const { page, perPage } = pagination;
    const [deploys, total] = await Promise.all([
        repo.findDeploysByProject(projectId, page, perPage),
        repo.countDeploysByProject(projectId),
    ]);
    return {
        data: deploys,
        meta: {
            page,
            per_page: perPage,
            total,
            total_pages: Math.ceil(total / perPage),
        },
    };
}
async function getDeploy(deployId, userId) {
    const auth = await validateAuthenticatedUser(userId);
    if (!auth.valid) {
        throw { status: auth.status, message: auth.message };
    }
    if (!(0, uuid_1.validate)(deployId)) {
        throw { status: 400, message: "ID do deploy inválido" };
    }
    const deploy = await repo.findDeployById(deployId);
    if (!deploy) {
        throw { status: 404, message: "Deploy não encontrado" };
    }
    const project = await repo.findProjectById(deploy.projectId);
    if (!project) {
        throw { status: 404, message: "Projeto não encontrado" };
    }
    const workspace = await repo.findUserWorkspace(userId, project.id);
    if (!workspace) {
        throw { status: 403, message: "Você não tem acesso a este deploy" };
    }
    return deploy;
}
async function deployApp(app, image, port = 3000) {
    if (!app || !image) {
        throw { status: 400, message: "Campos 'app' e 'image' são obrigatórios" };
    }
    const project = await repo.findProjectBySubdomain(app);
    if (!project) {
        throw { status: 404, message: `App '${app}' não encontrada` };
    }
    const deployRecord = await repo.createDeploy({
        projectId: project.id,
    });
    try {
        runDockerCommand(`docker pull ${image}`);
        runDockerCommand(`docker stop ${app} || true`);
        runDockerCommand(`docker rm ${app} || true`);
        runDockerCommand(`docker run -d ` +
            `--name ${app} ` +
            `--network ${TRAEFIK_NETWORK} ` +
            `--restart unless-stopped ` +
            `--label traefik.enable=true ` +
            `--label traefik.http.routers.${app}.rule=Host(\`${app}.${BASE_DOMAIN}\`) ` +
            `--label traefik.http.routers.${app}.tls.certresolver=letsencrypt ` +
            `--label traefik.http.services.${app}.loadbalancer.server.port=${port} ` +
            `${image}`);
        runDockerCommand("docker image prune -f");
        await repo.updateDeployStatus(deployRecord.id, {
            status: "running",
            success: true,
        });
        return {
            ok: true,
            url: `https://${app}.${BASE_DOMAIN}`,
        };
    }
    catch (error) {
        await repo.updateDeployStatus(deployRecord.id, {
            status: "failed",
            success: false,
            logs: [error.message],
        });
        throw { status: 500, message: error.message };
    }
}
async function getDeployLogs(deployId, userId) {
    const deploy = await repo.findDeployWithProject(deployId);
    if (!deploy)
        throw { status: 404, message: "Deploy não encontrado" };
    const workspace = await repo.findUserWorkspace(userId, deploy.projectId);
    if (!workspace) {
        throw { status: 403, message: "Você não tem acesso a este deploy" };
    }
    return { logs: deploy.logs, status: deploy.status, success: deploy.success };
}
async function cancelDeploy(deployId, userId) {
    const deploy = await repo.findDeployWithProject(deployId);
    if (!deploy)
        throw { status: 404, message: "Deploy não encontrado" };
    const workspace = await repo.findUserWorkspace(userId, deploy.projectId);
    if (!workspace) {
        throw { status: 403, message: "Você não tem acesso a este deploy" };
    }
    const containerName = deploy.Project.subdomain;
    try {
        runDockerCommand(`docker stop ${containerName} || true`);
    }
    catch {
        // container may not exist
    }
    await repo.updateDeployStatus(deployId, {
        status: "stopped",
        success: false,
        logs: [...deploy.logs, "Deploy cancelado pelo utilizador"],
    });
    return { message: "Deploy cancelado com sucesso" };
}
