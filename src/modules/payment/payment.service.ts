import { typePayment } from "@prisma/client";
import { validate } from "uuid";
import axios from "axios";
import * as repo from "./payment.repository";

type ResponseService = {
  message: string;
  code: number;
  data?: any;
  error?: any;
};

export const getAppyPayToken = async () => {
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.PG_API_CLIENT_ID!);
    params.append("client_secret", process.env.PG_API_SECRET!);
    params.append("resource", process.env.PG_RESOURCE_ID!);

    const response = await axios.post(
      "https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
    return { token: response.data.access_token };
  } catch {
    return { token: "" };
  }
};

export const verifyPayment = async (
  userId: string,
  projectId: string,
  planName: string,
) => {
  if (!userId || !validate(userId)) {
    return { message: "Usuário não autenticado", code: 401 };
  }

  const user = await repo.findUserById(userId);
  if (!user) return { message: "Usuário não encontrado", code: 404 };

  if (!validate(projectId)) {
    return { message: "ID do projeto inválido", code: 400 };
  }

  const project = await repo.findProjectById(projectId);
  if (!project) return { message: "Projeto não encontrado", code: 404 };

  if (!planName || typeof planName !== "string") {
    return { message: "Nome do plano inválido", code: 400 };
  }

  const plan = await repo.findPlanByName(planName);
  if (!plan) return { message: "Plano não encontrado", code: 404 };

  let paymentForm = "monthly";
  if (plan.duration === 30) paymentForm = "monthly";
  else if (plan.duration === 360) paymentForm = "yearly";

  if (paymentForm !== "monthly" && paymentForm !== "yearly") {
    return { message: "Forma de pagamento inválida", code: 400 };
  }

  let amount = plan.price;
  let timeInDay: number | undefined;
  if (paymentForm === "yearly") {
    amount = plan.price * 12 - plan.price * 0.5;
    timeInDay = plan.duration * 12;
  } else {
    timeInDay = plan.duration;
  }

  return {
    message: "Pagamento criado com sucesso",
    code: 200,
    data: {
      type_payment: paymentForm as typePayment,
      amount,
      time_in_day: timeInDay,
      plan_id: plan.id,
      plan_name: plan.name,
      username: user.username,
      user_email: user.email,
      name: user.name,
    },
  };
};

export const referenceSendPaymentService = async (
  merchantId: string,
  amount: number,
  description: string,
): Promise<ResponseService> => {
  const { token } = await getAppyPayToken();

  try {
    const response = await axios.request({
      method: "POST",
      url: "https://gwy-api.appypay.co.ao/v2.0/charges",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: {
        amount,
        currency: "AOA",
        description: description || "Pagamento DrenoDay",
        merchantTransactionId: merchantId,
        paymentMethod: process.env.PG_PAYMENT_METHOD_ID,
        notify: {
          name: "Justino Soares",
          telephone: "946671828",
          email: "justinocsoares123@gmail.com",
          smsNotification: true,
          emailNotification: true,
        },
      },
    });

    if (response.data.responseStatus.successful) {
      return {
        message: "A solicitação foi aceita para processamento.",
        code: 200,
        data: response.data.responseStatus.reference,
      };
    }
    return { message: "A solicitação foi rejeitada", code: 400 };
  } catch (error: any) {
    return { message: "A solicitação foi rejeitada", error, code: 400 };
  }
};

export async function processWebhook(payload: any) {
  const { merchantTransactionId, reference, responseStatus } = payload;

  if (!responseStatus || !reference) {
    throw { status: 400, message: "Payload inválido" };
  }

  if (responseStatus.code !== 100) return null;

  const referenceNumber = reference.referenceNumber;
  if (!referenceNumber && !merchantTransactionId) {
    throw { status: 400, message: "Referência ausente" };
  }

  const payment = await repo.findPaymentByRef(merchantTransactionId, referenceNumber);
  if (!payment) throw { status: 404, message: "Pagamento não encontrado" };
  if (payment.status === "approved") return null;

  const user = await repo.findUserById(payment.userId);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  let paymentForm = payment.type_payment;
  const now = new Date();
  const expirationDate = new Date(now);

  if (paymentForm === "monthly") expirationDate.setMonth(expirationDate.getMonth() + 1);
  else if (paymentForm === "yearly") expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  else throw { status: 400, message: "Forma de pagamento inválida" };

  await repo.updateProject(payment.projectId, { date_expire: expirationDate });
  await repo.updatePayment(payment.id, { date_start: now, date_end: expirationDate, status: "approved" });

  return { userId: payment.userId, paymentId: payment.id };
}

export async function confirmUserPayment(
  userId: string,
  paymentId: string,
  status: string,
) {
  const user = await repo.findUserById(userId);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  const payment = await repo.findPaymentById(paymentId);
  if (!payment) throw { status: 404, message: "Pagamento não encontrado" };

  const project = await repo.findProjectById(payment.projectId);
  if (!project) throw { status: 404, message: "Projeto do pagamento não encontrado" };

  const now = new Date();
  const expirationDate = new Date(now.getTime() + (project.days || 1) * 24 * 60 * 60 * 1000);

  await repo.updateProject(payment.projectId, {
    date_last_payment: now,
    date_expire: expirationDate,
    status_payment: status,
  });

  await repo.updatePayment(paymentId, {
    date_start: now,
    date_end: expirationDate,
    status,
  });
}
