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
exports.deleteEnvVar = exports.getEnvVars = exports.saveEnvVars = void 0;
const to_string_1 = require("../../utils/to_string");
const service = __importStar(require("./environment.service"));
const saveEnvVars = async (req, res) => {
    try {
        const userId = req.userId;
        const projectId = (0, to_string_1.q)(req.params.projectId);
        const { environments } = req.body;
        await service.saveEnvironmentVars(userId, projectId, environments);
        res.status(200).json({ message: "Variáveis salvas com sucesso" });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao salvar variáveis" });
    }
};
exports.saveEnvVars = saveEnvVars;
const getEnvVars = async (req, res) => {
    try {
        const userId = req.userId;
        const projectId = (0, to_string_1.q)(req.params.projectId);
        const page = parseInt((0, to_string_1.q)(req.query.page) || "1");
        const perPage = parseInt((0, to_string_1.q)(req.query.per_page) || "10");
        const result = await service.listEnvironmentVars(userId, projectId, page, perPage);
        res.status(200).json(result);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao buscar variáveis" });
    }
};
exports.getEnvVars = getEnvVars;
const deleteEnvVar = async (req, res) => {
    try {
        const userId = req.userId;
        const projectId = (0, to_string_1.q)(req.params.projectId);
        const envId = (0, to_string_1.q)(req.params.envId);
        await service.deleteEnvironmentVar(userId, projectId, envId);
        res.status(200).json({ message: "Variável deletada com sucesso" });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao deletar variável" });
    }
};
exports.deleteEnvVar = deleteEnvVar;
