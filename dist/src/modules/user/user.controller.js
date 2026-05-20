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
exports.updateUser = exports.UserLoged = exports.getAllUsers = exports.getUser = exports.createUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const to_string_1 = require("../../utils/to_string");
const username_1 = require("../../utils/username");
const repo = __importStar(require("./user.repository"));
const user_service_1 = require("./user.service");
const createUser = async (req, res) => {
    try {
        const { email, name, password } = req.body;
        if (!email || !name || !password) {
            return res.status(400).json({ message: "Email, nome e senha são obrigatórios" });
        }
        const username = await (0, username_1.generateUniqueUsername)(name);
        if (!username) {
            return res.status(400).json({ message: "O nome fornecido não é válido" });
        }
        const existing = await repo.findUserByEmailOrUsername(email, username);
        if (existing) {
            return res.status(400).json({ message: "Usuário com este email ou username já existe." });
        }
        const user = await repo.createUser({
            email,
            name,
            password: await bcrypt_1.default.hash(password, 10),
            username,
        });
        return res.status(201).json(user);
    }
    catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Failed to create user" });
    }
};
exports.createUser = createUser;
const getUser = async (req, res) => {
    try {
        const userId = (0, to_string_1.q)(req.params.userId);
        const user = await (0, user_service_1.fetchUserById)(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        res.status(200).json(user);
    }
    catch {
        res.status(500).json({ error: "Failed to retrieve user" });
    }
};
exports.getUser = getUser;
const getAllUsers = async (req, res) => {
    try {
        const { username } = req.query;
        if (username && typeof username !== "string") {
            return res.status(400).json({ message: "Username inválido" });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const users = await repo.findAllUsers(username, page, limit);
        res.status(200).json(users);
    }
    catch {
        res.status(500).json({ error: "Failed to retrieve users" });
    }
};
exports.getAllUsers = getAllUsers;
const UserLoged = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await repo.findUserById(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        res.status(200).json(user);
    }
    catch {
        res.status(500).json({ error: "Failed to retrieve logged-in user" });
    }
};
exports.UserLoged = UserLoged;
const updateUser = async (req, res) => {
    try {
        const userId = req.userId;
        const { email, name } = req.body;
        const user = await (0, user_service_1.fetchUserById)(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const updated = await repo.updateUser(user.id, {
            email: email || user.email,
            name: name || user.name,
        });
        res.status(200).json(updated);
    }
    catch {
        res.status(500).json({ error: "Failed to update user" });
    }
};
exports.updateUser = updateUser;
