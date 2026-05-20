import * as repo from "./plan.repository";

export async function createPlan(data: {
  name: string;
  description: string;
  price: number;
  duration: number;
  max_projects: number;
  duration_description: string;
  features: string[];
  shortcut: string;
}) {
  if (!data.name || !data.description || !data.duration) {
    throw { status: 400, message: "Todos os campos são obrigatórios" };
  }
  if (data.price === undefined || data.price === null || isNaN(data.price)) {
    throw { status: 400, message: "Preço inválido" };
  }

  const existing = await repo.findPlanByName(data.name);
  if (existing) {
    throw { status: 409, message: "Já existe um plano com este nome" };
  }

  return repo.createPlan({
    ...data,
    max_projects: data.max_projects && data.max_projects > 0 ? data.max_projects : 1,
    duration_description: data.duration_description || "",
    features: data.features || [],
    shortcut: data.shortcut || "",
  });
}

export async function listPlans() {
  return repo.findAllPlans();
}

export async function updatePlan(
  planId: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    duration: number;
    max_projects: number;
    duration_description: string;
    features: string[];
    shortcut: string;
  }>,
) {
  const plan = await repo.findPlanByAny(planId);
  if (!plan) throw { status: 404, message: "Plano não encontrado" };

  await repo.updatePlan(plan.id, {
    name: data.name || plan.name,
    description: data.description || plan.description,
    price: data.price !== undefined && !isNaN(data.price) ? data.price : plan.price,
    duration: data.duration || plan.duration,
    max_projects: data.max_projects && data.max_projects > 0 ? data.max_projects : plan.max_projects,
    duration_description: data.duration_description || plan.duration_description,
    features: data.features || plan.features,
    shortcut: data.shortcut || plan.shortcut,
  });
}

export async function getPlanById(planId: string) {
  const plan = await repo.findPlanByAny(planId);
  if (!plan) throw { status: 404, message: "Plano não encontrado" };
  return plan;
}

export async function deletePlanById(planId: string) {
  const plan = await repo.findPlanByAny(planId);
  if (!plan) throw { status: 404, message: "Plano não encontrado" };
  await repo.deletePlan(plan.id);
}
