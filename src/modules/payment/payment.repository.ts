import prisma from "../../lib/prisma";

export async function findUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function findUserByAny(userId: string) {
  return prisma.user.findFirst({ where: { id: userId } });
}

export async function findProjectById(projectId: string) {
  return prisma.project.findUnique({ where: { id: projectId } });
}

export async function findPlanByName(name: string) {
  return prisma.plan.findUnique({ where: { name } });
}

export async function findPlanById(id: string) {
  return prisma.plan.findUnique({ where: { id } });
}

export async function findPaymentById(id: string) {
  return prisma.payment.findUnique({ where: { id } });
}

export async function findPaymentByRef(ref: string, merchant: string) {
  return prisma.payment.findFirst({
    where: { OR: [{ merchant }, { ref }] },
  });
}

export async function findPaymentByProof(proof: string) {
  return prisma.payment.findFirst({ where: { proof_payment: proof } });
}

export async function createPayment(data: any) {
  return prisma.payment.create({ data });
}

export async function updatePayment(id: string, data: any) {
  return prisma.payment.update({ where: { id }, data });
}

export async function updateProject(id: string, data: any) {
  return prisma.project.update({ where: { id }, data });
}

export async function findPaymentsByUser(
  userId: string,
  status?: string | string[],
  page?: number,
  perPage?: number,
  nameProject?: string,
) {
  const where: any = { userId };
  if (status) {
    where.status = Array.isArray(status) ? { in: status as any } : (status as any);
  }
  if (page && perPage) {
    return prisma.$transaction([
      prisma.payment.findMany({
        where: {
          ...where,
          project: nameProject
            ? { name: { contains: nameProject, mode: "insensitive" as const } }
            : undefined,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.payment.count({ where }),
    ]);
  }
  return prisma.payment.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function findPaymentByUserAndId(userId: string, paymentId: string) {
  return prisma.payment.findFirst({ where: { id: paymentId, userId } });
}
