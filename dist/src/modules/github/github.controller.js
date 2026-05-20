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
exports.readCookieGitHub = exports.createCookieGitHub = exports.unsyncUserFromGitHub = exports.getUserBranchesByName = exports.getUserRepoByName = exports.syncUserWithGitHub = exports.getUserRepos = void 0;
const uuid_1 = require("uuid");
const service = __importStar(require("./github.service"));
const getUserRepos = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.per_page) || 10, 100);
        const name = req.query.name?.toLowerCase() || "";
        const result = await service.listUserRepos(userId, page, limit, name);
        res.json(result);
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ message: error.message || "Erro na sincronização com GitHub" });
    }
};
exports.getUserRepos = getUserRepos;
const syncUserWithGitHub = async (req, res) => {
    try {
        const userId = req.userId;
        const { github_username, github_token, github_user_id } = req.body;
        if (!github_username || !github_token || !github_user_id) {
            return res.status(400).json({ message: "Dados do GitHub não fornecidos" });
        }
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        await service.syncGithubUser(userId, github_username, github_token, github_user_id);
        res.status(200).json({ message: "Sincronização com GitHub realizada com sucesso" });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao sincronizar com GitHub" });
    }
};
exports.syncUserWithGitHub = syncUserWithGitHub;
const getUserRepoByName = async (req, res) => {
    try {
        const userId = req.userId;
        const repo = req.params.repo;
        const owner = req.params.owner;
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const data = await service.getRepoByName(userId, owner, repo);
        res.json(data);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao buscar repositório" });
    }
};
exports.getUserRepoByName = getUserRepoByName;
const getUserBranchesByName = async (req, res) => {
    try {
        const userId = req.userId;
        const repo = req.params.repo;
        const owner = req.params.owner;
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.per_page) || 10, 100);
        const name = req.query.name?.toLowerCase() || "";
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const result = await service.listRepoBranches(userId, owner, repo, page, limit, name);
        res.json(result);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao buscar branches" });
    }
};
exports.getUserBranchesByName = getUserBranchesByName;
const unsyncUserFromGitHub = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        await service.unsyncGithub(userId);
        res.status(200).json({ message: "Desconexão do GitHub realizada com sucesso" });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao desconectar do GitHub" });
    }
};
exports.unsyncUserFromGitHub = unsyncUserFromGitHub;
const createCookieGitHub = (req, res) => {
    res.cookie("teste", "TEsteeeeee", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: "Cookie criado com sucesso" });
};
exports.createCookieGitHub = createCookieGitHub;
const readCookieGitHub = (req, res) => {
    res.json(req.cookies);
};
exports.readCookieGitHub = readCookieGitHub;
