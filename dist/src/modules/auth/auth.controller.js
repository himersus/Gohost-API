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
exports.loginGoogle = exports.resetPassword = exports.forgotPassword = exports.loginGitHub = exports.loginWithEmail = exports.verifyCode = exports.sendCodeVerification = exports.login = void 0;
require("dotenv/config");
const service = __importStar(require("./auth.service"));
const sendemail_1 = require("../../middleware/sendemail");
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const token = await service.loginUser(username, password);
        res.status(200).json({ token });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "O login falhou" });
    }
};
exports.login = login;
const sendCodeVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const code = await service.sendVerificationCode(email);
        await (0, sendemail_1.sendEmail)(email, "Código de Verificação - Drenoday", "Código de Verificação", code, `Seu código de verificação é: <strong>${code}</strong>.`);
        res.status(200).json({ message: "Código de verificação enviado para o e-mail." });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Falha ao enviar o código de verificação." });
    }
};
exports.sendCodeVerification = sendCodeVerification;
const verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        await service.verifyEmailCode(email, code);
        res.status(200).json({ message: "E-mail verificado com sucesso." });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Falha ao verificar o código." });
    }
};
exports.verifyCode = verifyCode;
const loginWithEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const token = await service.loginWithEmailCode(email, code);
        res.status(200).json({ token });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Falha ao verificar o código." });
    }
};
exports.loginWithEmail = loginWithEmail;
const loginGitHub = async (req, res) => {
    try {
        const user = req.user;
        const token = user.token;
        const create = user.create || "false";
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Usuário não encontrado.`);
        }
        const result = await service.handleGithubLogin(user, token, create);
        if (result.redirect) {
            return res.redirect(result.redirect);
        }
        const { jwtToken, encryptedToken, github_username, github_user_id } = result;
        const cookieOpts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
        };
        res.cookie("auth_token", jwtToken, cookieOpts);
        res.cookie("github_token", encryptedToken, cookieOpts);
        res.cookie("github_username", github_username, cookieOpts);
        res.cookie("github_user_id", github_user_id, cookieOpts);
        return res.redirect(`${process.env.FRONTEND_URL}/auth/github?token=${jwtToken}&github_token=${encryptedToken}&github_username=${github_username}&github_user_id=${github_user_id}`);
    }
    catch {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Erro ao autenticar com GitHub`);
    }
};
exports.loginGitHub = loginGitHub;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email é obrigatório" });
        const resetToken = await service.forgotPassword(email);
        await (0, sendemail_1.sendEmail)(email, "Recuperação de Senha - DrenoDay", "Recuperação de Senha", resetToken, `Seu token de recuperação é: <strong>${resetToken}</strong>. Este token expira em 1 hora.`);
        res.status(200).json({ message: "Email de recuperação enviado com sucesso" });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao recuperar senha" });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: "Token e nova senha são obrigatórios" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
        }
        await service.resetPassword(token, password);
        res.status(200).json({ message: "Senha redefinida com sucesso" });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao redefinir senha" });
    }
};
exports.resetPassword = resetPassword;
const loginGoogle = async (req, res) => {
    try {
        const userProfile = req.user;
        const state = JSON.parse(req.query.state || "{}");
        const create = state.create || "true";
        if (!userProfile) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Usuário não encontrado.`);
        }
        const token = await service.handleGoogleLogin(userProfile, create);
        return res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    }
    catch {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Erro ao autenticar com Google`);
    }
};
exports.loginGoogle = loginGoogle;
