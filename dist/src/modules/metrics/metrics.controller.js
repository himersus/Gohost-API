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
exports.getVpsMetrics = exports.getMyGeneralMetrics = exports.getServiceMetrics = void 0;
const uuid_1 = require("uuid");
const service = __importStar(require("./metrics.service"));
const getServiceMetrics = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        if (!projectId || !(0, uuid_1.validate)(projectId)) {
            return res.status(400).json({ message: "ID do projeto é obrigatório" });
        }
        const result = await service.getServiceMetrics(projectId);
        res.status(200).json(result);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao coletar métricas do serviço" });
    }
};
exports.getServiceMetrics = getServiceMetrics;
const getMyGeneralMetrics = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(400).json({ message: "ID do usuário é obrigatório" });
        }
        const result = await service.getGeneralMetrics(userId);
        res.status(200).json(result);
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao coletar métricas gerais" });
    }
};
exports.getMyGeneralMetrics = getMyGeneralMetrics;
const getVpsMetrics = async (req, res) => {
    try {
        const result = await service.getVpsMetrics();
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: "Erro ao coletar métricas da VPS" });
    }
};
exports.getVpsMetrics = getVpsMetrics;
