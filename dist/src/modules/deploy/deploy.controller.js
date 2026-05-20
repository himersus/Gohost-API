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
exports.deployApp = exports.cancelDeploy = exports.getDeployLogs = exports.getDeploy = exports.listDeploys = void 0;
const service = __importStar(require("./deploy.service"));
const listDeploys = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        const result = await service.listDeploys(projectId, userId, { page, perPage });
        res.status(200).json(result);
    }
    catch (error) {
        const status = error.status || 500;
        const message = error.message || "Falha ao listar deploys";
        res.status(status).json({ message });
    }
};
exports.listDeploys = listDeploys;
const getDeploy = async (req, res) => {
    try {
        const deployId = req.params.deployId;
        const userId = req.userId;
        const deploy = await service.getDeploy(deployId, userId);
        res.status(200).json(deploy);
    }
    catch (error) {
        const status = error.status || 500;
        const message = error.message || "Falha ao buscar deploy";
        res.status(status).json({ message });
    }
};
exports.getDeploy = getDeploy;
const getDeployLogs = async (req, res) => {
    try {
        const deployId = req.params.deployId;
        const userId = req.userId;
        const result = await service.getDeployLogs(deployId, userId);
        res.status(200).json(result);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Falha ao obter logs" });
    }
};
exports.getDeployLogs = getDeployLogs;
const cancelDeploy = async (req, res) => {
    try {
        const deployId = req.params.deployId;
        const userId = req.userId;
        const result = await service.cancelDeploy(deployId, userId);
        res.status(200).json(result);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Falha ao cancelar deploy" });
    }
};
exports.cancelDeploy = cancelDeploy;
const deployApp = async (req, res) => {
    try {
        const { app, image, port } = req.body;
        const result = await service.deployApp(app, image, port || 3000);
        res.status(200).json(result);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({
            ok: false,
            error: error.message || "Falha ao executar deploy",
        });
    }
};
exports.deployApp = deployApp;
