import { Request, Response } from "express";
import { validate } from "uuid";
import { PaymentStatus } from "@prisma/client";
import { sendSocketContent } from "../../sockets";
import { q } from "../../utils/to_string";
import { createNotification } from "../notification/notification.service";
import * as repo from "./payment.repository";
import * as service from "./payment.service";

const generateMerchantId = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 15; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
};

export const referenceSendPaymentGateway = async (req: Request | any, res: Response) => {
  try {
    const { description, projectId, plan_name } = req.body;
    const userId = req.userId;

    const verifyPayRaw: any = await service.verifyPayment(userId, projectId, plan_name);
    if (verifyPayRaw.code !== 200) {
      return res.status(verifyPayRaw.code || 400).json({ message: verifyPayRaw.message });
    }

    const verifyPay = verifyPayRaw.data;
    const merchantId = generateMerchantId();

    const data: any = await service.referenceSendPaymentService(merchantId, 1, description);
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

    sendSocketContent("new_payment", {
      userId,
      paymentId: payment.id,
      amount: verifyPay.amount,
      plan_name: verifyPay.plan_name,
      status: "pending",
    });

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[referenceSendPaymentGateway]", error);
    return res.status(500).json({ message: "Erro ao criar referência de pagamento" });
  }
};

export const getAppyPayToken = async (req: Request, res: Response) => {
  try {
    const data = await service.getAppyPayToken();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ message: "Erro ao obter token de pagamento" });
  }
};

export const webhookPayment = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload) {
      await createNotification(null, "Webhook Error", "Payload inválido");
      return res.status(400).json({ message: "Payload inválido" });
    }

    const result = await service.processWebhook(payload);

    if (result === null) {
      return res.status(200).json({ received: true });
    }

    sendSocketContent("confirmed_payment", {
      userId: result.userId,
      paymentId: result.paymentId,
      status: "Pago",
      message: "Pagamento realizado com sucesso",
    });

    await createNotification(result.userId, "Sucesso", "Pagamento realizado com sucesso.");
    res.status(200).json({ message: "Webhook recebido com sucesso" });
  } catch (error: any) {
    const status = error.status || 500;
    await createNotification(null, "Webhook Error", error.message);
    res.status(status).json({ message: error.message });
  }
};

export const confirmPayment = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const { paymentId, status } = req.body;

    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    if (status !== "approved" && status !== "rejected" && status !== "failed") {
      return res.status(400).json({ message: "Status de pagamento inválido" });
    }

    await service.confirmUserPayment(userId, paymentId, status);

    sendSocketContent("confirmed_payment", {
      userId,
      paymentId,
      status: status === "approved" ? "Pago" : "Rejeitado",
    });

    res.status(200).json({
      message: "Pagamento confirmado com sucesso.",
    });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao confirmar pagamento" });
  }
};

export const createPayment = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId, proof_payment } = req.body;

    if (!validate(projectId)) {
      return res.status(400).json({ message: "ID do projeto inválido" });
    }
    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const user = await repo.findUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const project = await repo.findProjectById(projectId);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });
    if (!project.default_plan) return res.status(400).json({ message: "Projeto não tem plano associado" });

    const plan = await repo.findPlanByName(project.default_plan);
    if (!plan) return res.status(404).json({ message: "Plano não encontrado" });

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

    sendSocketContent("new_payment", {
      userId,
      paymentId: payment.id,
      amount: project.amount_to_pay || 0,
      plan_name: plan.name,
      status: "Pendente",
    });

    return res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao registrar pagamento" });
  }
};

export const getUserPayments = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const status = req.query.status as string | undefined;

    if (status && !["pending", "approved", "rejected", "failed"].includes(status)) {
      return res.status(400).json({ message: "Status de pagamento inválido" });
    }
    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const user = await repo.findUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const payments = await repo.findPaymentsByUser(userId, status);
    return res.status(200).json(payments);
  } catch (error) {
    return res.status(400).json({ message: "Erro ao buscar pagamentos" });
  }
};

export const getPaymentById = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const paymentId = q(req.params.paymentId);

    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const user = await repo.findUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const payment = await repo.findPaymentByUserAndId(userId, paymentId);
    if (!payment) return res.status(404).json({ message: "Pagamento não encontrado" });

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar pagamento" });
  }
};

export const getAllPayments = async (req: Request | any, res: Response) => {
  try {
    const userId = q(req.userId);
    const page = parseInt(q(req.query.page) as string) || 1;
    const perPage = parseInt(q(req.query.per_page) as string) || 10;
    const nameProject = q(req.query.name) as string | undefined;

    const rawStatus = req.query.status;
    const statusList: PaymentStatus[] = rawStatus
      ? (Array.isArray(rawStatus) ? rawStatus : String(rawStatus).split(","))
          .map((s: string) => s.trim() as PaymentStatus)
          .filter(Boolean)
      : [];

    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const user = await repo.findUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const [payments, total] = await repo.findPaymentsByUser(
      userId,
      statusList.length > 0 ? statusList : undefined,
      page,
      perPage,
      nameProject,
    ) as [any[], number];

    return res.status(200).json({
      data: payments,
      meta: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) },
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar pagamentos" });
  }
};
