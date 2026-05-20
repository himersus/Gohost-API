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
exports.listUserRepos = listUserRepos;
exports.syncGithubUser = syncGithubUser;
exports.getRepoByName = getRepoByName;
exports.listRepoBranches = listRepoBranches;
exports.unsyncGithub = unsyncGithub;
const axios_1 = __importDefault(require("axios"));
const crypt_1 = require("../../utils/crypt");
const githubRepo = __importStar(require("./github.repository"));
function getLastPage(linkHeader) {
    if (!linkHeader)
        return null;
    const links = linkHeader.split(",");
    const last = links.find((l) => l.includes('rel="last"'));
    if (!last)
        return null;
    const match = last.match(/page=(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}
function getDecryptedToken(user) {
    if (!user.github_token || !user.github_username || !user.github_id) {
        throw { status: 404, message: "Usuário não sincronizado com GitHub" };
    }
    const token = (0, crypt_1.decryptToken)(user.github_token.replace(/\s/g, ""));
    if (!token) {
        throw { status: 401, message: "Sincronização com GitHub expirada" };
    }
    return token;
}
async function listUserRepos(userId, page, limit, name) {
    const user = await githubRepo.findUserById(userId);
    if (!user)
        throw { status: 404, message: "Usuário não encontrado" };
    const token = getDecryptedToken(user);
    const response = await axios_1.default.get("https://api.github.com/user/repos", {
        headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
        params: { affiliation: "owner,collaborator,organization_member", sort: "updated", direction: "desc", page, per_page: limit },
    });
    let data = response.data;
    if (name) {
        data = data.filter((r) => r.name.toLowerCase().includes(name));
    }
    return {
        data,
        meta: { page, per_page: limit, total_pages: getLastPage(response.headers.link) },
    };
}
async function syncGithubUser(userId, githubUsername, githubToken, githubUserId) {
    const user = await githubRepo.findUserById(userId);
    if (!user)
        throw { status: 404, message: "Usuário não encontrado" };
    await githubRepo.updateUserGithub(userId, {
        github_username: githubUsername,
        github_token: githubToken,
        github_id: githubUserId,
    });
}
async function getRepoByName(userId, owner, repo) {
    const user = await githubRepo.findUserById(userId);
    if (!user)
        throw { status: 404, message: "Usuário não encontrado" };
    const token = getDecryptedToken(user);
    try {
        const response = await axios_1.default.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
        });
        return response.data;
    }
    catch (error) {
        if (error.response?.status === 404) {
            throw { status: 404, message: "Repositório não encontrado" };
        }
        throw { status: 500, message: "Erro ao buscar repositório" };
    }
}
async function listRepoBranches(userId, owner, repo, page, limit, name) {
    const user = await githubRepo.findUserById(userId);
    if (!user)
        throw { status: 404, message: "Usuário não encontrado" };
    const token = getDecryptedToken(user);
    const response = await axios_1.default.get(`https://api.github.com/repos/${owner}/${repo}/branches`, {
        headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
        params: { page, per_page: limit },
    });
    let branches = response.data;
    if (name) {
        branches = branches.filter((b) => b.name.toLowerCase().includes(name));
    }
    return {
        data: branches,
        meta: { page, per_page: limit, total_pages: getLastPage(response.headers.link) },
    };
}
async function unsyncGithub(userId) {
    const user = await githubRepo.findUserById(userId);
    if (!user)
        throw { status: 404, message: "Usuário não encontrado" };
    if (!user.github_token && !user.github_username && !user.github_id) {
        throw { status: 400, message: "Usuário já não está sincronizado com GitHub" };
    }
    await githubRepo.updateUserGithub(userId, {
        github_username: null,
        github_token: null,
        github_id: null,
    });
}
