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
exports.getAllPayments = exports.getPaymentById = exports.getUserPayments = exports.createPayment = exports.confirmPayment = exports.webhookPayment = exports.getAppyPayToken = exports.referenceSendPaymentGateway = void 0;
const uuid_1 = require("uuid");
const sockets_1 = require("../../sockets");
const to_string_1 = require("../../utils/to_string");
const notification_service_1 = require("../notification/notification.service");
const repo = __importStar(require("./payment.repository"));
const service = __importStar(require("./payment.service"));
const generateMerchantId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 15; i++)
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
};
const referenceSendPaymentGateway = async (req, res) => {
    try {
        const { description, projectId, plan_name } = req.body;
        const userId = req.userId;
        const verifyPayRaw = await service.verifyPayment(userId, projectId, plan_name);
        if (verifyPayRaw.code !== 200) {
            return res.status(verifyPayRaw.code || 400).json({ message: verifyPayRaw.message });
        }
        const verifyPay = verifyPayRaw.data;
        const merchantId = generateMerchantId();
        const data = await service.referenceSendPaymentService(merchantId, 1, description);
        if (data.code !== 200) {
            return res.status(data.code || 400).json({ message: data.message || "Erro ao criar referência" });
        }
        const payment = await repo.createPayment({
            userId,
            planId: verifyPay.plan_id,
            plan_name: verifyPay.plan_name,
            amount: 0,
            time_in_day: verifyPay.time_in_day || 0,
            entity: data.data.entity,
            ref: data.data.referenceNumber,
            merchant: merchantId,
            status: "pending",
            type_payment: verifyPay.type_payment,
            projectId,
        });
        (0, sockets_1.sendSocketContent)("new_payment", {
            userId,
            paymentId: payment.id,
            amount: verifyPay.amount,
            plan_name: verifyPay.plan_name,
            status: "pending",
        });
        return res.status(200).json(data);
    }
    catch (error) {
        console.error("[referenceSendPaymentGateway]", error);
        return res.status(500).json({ message: "Erro ao criar referência de pagamento" });
    }
};
exports.referenceSendPaymentGateway = referenceSendPaymentGateway;
const getAppyPayToken = async (req, res) => {
    try {
        const data = await service.getAppyPayToken();
        return res.status(200).json(data);
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao obter token de pagamento" });
    }
};
exports.getAppyPayToken = getAppyPayToken;
const webhookPayment = async (req, res) => {
    try {
        const payload = req.body;
        if (!payload) {
            await (0, notification_service_1.createNotification)(null, "Webhook Error", "Payload inválido");
            return res.status(400).json({ message: "Payload inválido" });
        }
        const result = await service.processWebhook(payload);
        if (result === null) {
            return res.status(200).json({ received: true });
        }
        (0, sockets_1.sendSocketContent)("confirmed_payment", {
            userId: result.userId,
            paymentId: result.paymentId,
            status: "Pago",
            message: "Pagamento realizado com sucesso",
        });
        await (0, notification_service_1.createNotification)(result.userId, "Sucesso", "Pagamento realizado com sucesso.");
        res.status(200).json({ message: "Webhook recebido com sucesso" });
    }
    catch (error) {
        const status = error.status || 500;
        await (0, notification_service_1.createNotification)(null, "Webhook Error", error.message);
        res.status(status).json({ message: error.message });
    }
};
exports.webhookPayment = webhookPayment;
const confirmPayment = async (req, res) => {
    try {
        const userId = req.userId;
        const { paymentId, status } = req.body;
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        if (status !== "approved" && status !== "rejected" && status !== "failed") {
            return res.status(400).json({ message: "Status de pagamento inválido" });
        }
        await service.confirmUserPayment(userId, paymentId, status);
        (0, sockets_1.sendSocketContent)("confirmed_payment", {
            userId,
            paymentId,
            status: status === "approved" ? "Pago" : "Rejeitado",
        });
        res.status(200).json({
            message: "Pagamento confirmado com sucesso.",
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ message: error.message || "Erro ao confirmar pagamento" });
    }
};
exports.confirmPayment = confirmPayment;
const createPayment = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId, proof_payment } = req.body;
        if (!(0, uuid_1.validate)(projectId)) {
            return res.status(400).json({ message: "ID do projeto inválido" });
        }
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const user = await repo.findUserById(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const project = await repo.findProjectById(projectId);
        if (!project)
            return res.status(404).json({ message: "Projeto não encontrado" });
        if (!project.default_plan)
            return res.status(400).json({ message: "Projeto não tem plano associado" });
        const plan = await repo.findPlanByName(project.default_plan);
        if (!plan)
            return res.status(404).json({ message: "Plano não encontrado" });
        if (!proof_payment || typeof proof_payment !== "string") {
            return res.status(400).json({ message: "Comprovante de pagamento inválido" });
        }
        const existing = await repo.findPaymentByProof(proof_payment);
        if (existing) {
            return res.status(400).json({ message: "Já existe um pagamento com este comprovante" });
        }
        const payment = await repo.createPayment({
            userId: user.id,
            planId: plan.id,
            plan_name: plan.name,
            amount: project.amount_to_pay || 0,
            proof_payment,
            time_in_day: project.days || 0,
            status: "pending",
            type_payment: project.default_type_payment,
            projectId: project.id,
        });
        await repo.updateProject(project.id, { status_payment: "pending" });
        (0, sockets_1.sendSocketContent)("new_payment", {
            userId,
            paymentId: payment.id,
            amount: project.amount_to_pay || 0,
            plan_name: plan.name,
            status: "Pendente",
        });
        return res.status(201).json(payment);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao registrar pagamento" });
    }
};
exports.createPayment = createPayment;
const getUserPayments = async (req, res) => {
    try {
        const userId = req.userId;
        const status = req.query.status;
        if (status && !["pending", "approved", "rejected", "failed"].includes(status)) {
            return res.status(400).json({ message: "Status de pagamento inválido" });
        }
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const user = await repo.findUserById(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const payments = await repo.findPaymentsByUser(userId, status);
        return res.status(200).json(payments);
    }
    catch (error) {
        return res.status(400).json({ message: "Erro ao buscar pagamentos" });
    }
};
exports.getUserPayments = getUserPayments;
const getPaymentById = async (req, res) => {
    try {
        const userId = req.userId;
        const paymentId = (0, to_string_1.q)(req.params.paymentId);
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const user = await repo.findUserById(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const payment = await repo.findPaymentByUserAndId(userId, paymentId);
        if (!payment)
            return res.status(404).json({ message: "Pagamento não encontrado" });
        return res.status(200).json(payment);
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao buscar pagamento" });
    }
};
exports.getPaymentById = getPaymentById;
const getAllPayments = async (req, res) => {
    try {
        const userId = (0, to_string_1.q)(req.userId);
        const page = parseInt((0, to_string_1.q)(req.query.page)) || 1;
        const perPage = parseInt((0, to_string_1.q)(req.query.per_page)) || 10;
        const nameProject = (0, to_string_1.q)(req.query.name);
        const rawStatus = req.query.status;
        const statusList = rawStatus
            ? (Array.isArray(rawStatus) ? rawStatus : String(rawStatus).split(","))
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
        if (!userId || !(0, uuid_1.validate)(userId)) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const user = await repo.findUserById(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const [payments, total] = await repo.findPaymentsByUser(userId, statusList.length > 0 ? statusList : undefined, page, perPage, nameProject);
        return res.status(200).json({
            data: payments,
            meta: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) },
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao buscar pagamentos" });
    }
};
exports.getAllPayments = getAllPayments;
