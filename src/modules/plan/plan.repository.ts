import prisma from "../../lib/prisma";

export async function findPlanByName(name: string) {
  return prisma.plan.findFirst({ where: { name } });
}

export async function findPlanByAny(idOrName: string) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrName);
  return prisma.plan.findFirst({
    where: {
      OR: [
        { id: isUuid ? idOrName : undefined },
        { name: isUuid ? undefined : idOrName },
      ],
    },
  });
}

export async function createPlan(data: {
  name: string;
  description: string;
  duration: number;
  price: number;
  max_projects: number;
  duration_description: string;
  features: string[];
  shortcut: string;
}) {
  return prisma.plan.create({ data });
}

export async function findAllPlans() {
  return prisma.plan.findMany();
}

export async function updatePlan(id: string, data: any) {
  return prisma.plan.update({ where: { id }, data });
}

export async function deletePlan(id: string) {
  return prisma.plan.delete({ where: { id } });
}
