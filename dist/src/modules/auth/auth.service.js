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
exports.loginUser = loginUser;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.sendVerificationCode = sendVerificationCode;
exports.verifyEmailCode = verifyEmailCode;
exports.loginWithEmailCode = loginWithEmailCode;
exports.handleGithubLogin = handleGithubLogin;
exports.handleGoogleLogin = handleGoogleLogin;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypt_1 = require("../../utils/crypt");
const username_1 = require("../../utils/username");
const repo = __importStar(require("./auth.repository"));
const JWT_SECRET = process.env.JWT_SECRET;
async function loginUser(username, password) {
    const user = await repo.findUserByLogin(username);
    if (!user || !password) {
        throw { status: 401, message: "Usuário ou senha inválida" };
    }
    const isValid = await bcrypt_1.default.compare(password, user.password || "");
    if (!isValid) {
        throw { status: 401, message: "Usuário ou senha inválida" };
    }
    const payload = {
        id: user.id,
        is_active: user.is_active,
        username: user.username,
        email: user.email,
        roleUser: user.roleUser,
        provider: user.provider,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}
async function forgotPassword(email) {
    const user = await repo.findUserByEmail(email);
    if (!user) {
        throw { status: 404, message: "Usuário não encontrado" };
    }
    const resetToken = crypto_1.default.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await repo.setResetToken(email, resetToken, expires);
    return resetToken;
}
async function resetPassword(token, newPassword) {
    const user = await repo.findUserByResetToken(token);
    if (!user) {
        throw { status: 400, message: "Token inválido ou expirado" };
    }
    const hashed = await bcrypt_1.default.hash(newPassword, 10);
    await repo.updatePassword(user.id, hashed);
}
async function sendVerificationCode(email) {
    const user = await repo.findUserByEmail(email);
    if (!user) {
        throw { status: 404, message: "Usuário não encontrado" };
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt_1.default.hash(code, 10);
    await repo.updateUserConfirmCode(email, hashed);
    return code;
}
async function verifyEmailCode(email, code) {
    const user = await repo.findUserByEmail(email);
    if (!user) {
        throw { status: 404, message: "Usuário não encontrado" };
    }
    const isValid = await bcrypt_1.default.compare(code, user.confirm_code || "");
    if (!isValid) {
        throw { status: 400, message: "Código de verificação inválido" };
    }
    await repo.activateUser(email);
}
async function loginWithEmailCode(email, code) {
    const user = await repo.findUserByEmail(email);
    if (!user) {
        throw { status: 404, message: "Usuário não encontrado" };
    }
    const isValid = await bcrypt_1.default.compare(code, user.confirm_code || "");
    if (!isValid) {
        throw { status: 400, message: "Código de verificação inválido" };
    }
    await repo.activateUser(email);
    const payload = {
        id: user.id,
        is_active: user.is_active,
        username: user.username,
        email: user.email,
        roleUser: user.roleUser,
        provider: user.provider,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}
async function handleGithubLogin(githubUser, token, create) {
    const email = githubUser.email;
    const encryptedToken = (0, crypt_1.encryptToken)(token);
    let user = await repo.findUserByEmail(email);
    if (!user && create === "false") {
        return { redirect: `${process.env.FRONTEND_URL}/auth/error?message=Usuário não encontrado. Por favor, registre-se primeiro.&create=${create}` };
    }
    if (!user && create === "true") {
        const username = await (0, username_1.generateUniqueUsername)(githubUser.username, true);
        user = await repo.createUser({
            name: githubUser.username,
            username: username || `${githubUser.username}${Math.floor(1000 + Math.random() * 9000)}`,
            email,
            provider: "github",
            password: null,
            is_active: true,
            github_username: githubUser.username,
            github_token: encryptedToken,
            github_id: githubUser.id,
        });
    }
    if (!user) {
        return { redirect: `${process.env.FRONTEND_URL}/auth/error?message=Usuário não encontrado. Por favor, registre-se primeiro.` };
    }
    await repo.updateUserGithub(user.id, {
        github_username: githubUser.username,
        github_token: encryptedToken,
        github_id: githubUser.id,
    });
    const payload = {
        id: user.id,
        is_active: user.is_active,
        username: user.username,
        email: user.email,
        roleUser: user.roleUser,
        provider: "github",
    };
    const jwtToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "1d" });
    return {
        jwtToken,
        encryptedToken,
        github_username: githubUser.username,
        github_user_id: githubUser.id,
    };
}
async function handleGoogleLogin(userProfile, create) {
    const email = userProfile.emails[0].value || userProfile.email;
    const name = userProfile.displayName || email.split("@")[0];
    let user = await repo.findUserByEmail(email);
    if (!user && create === "false") {
        return { redirect: `${process.env.FRONTEND_URL}/auth/error?message=Usuário não encontrado.&create=${create}` };
    }
    if (!user && create === "true") {
        const username = await (0, username_1.generateUniqueUsername)(name);
        user = await repo.createUser({
            name,
            username: username || `${email.split("@")[0]}${Math.floor(1000 + Math.random() * 9000)}`,
            email,
            provider: "google",
            password: Math.random().toString(36).slice(-8),
            is_active: true,
        });
    }
    const payload = {
        id: user.id,
        is_active: user.is_active,
        username: user.username,
        email: user.email,
        provider: "google",
        roleUser: user.roleUser,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}
