import prisma from "../../lib/prisma";

export async function findProjectById(projectId: string) {
  return prisma.project.findUnique({ where: { id: projectId } });
}

export async function findProjectByName(name: string, userId: string) {
  return prisma.project.findFirst({ where: { name, userId } });
}

export async function findProjectByNameExcluding(
  name: string,
  userId: string,
  projectId: string,
) {
  return prisma.project.findFirst({
    where: { name, userId, NOT: { id: projectId } },
  });
}

export async function findUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function findPlanByName(name: string) {
  return prisma.plan.findFirst({ where: { name } });
}

export async function createProject(data: any) {
  return prisma.project.create({ data });
}

export async function updateProject(id: string, data: any) {
  return prisma.project.update({ where: { id }, data });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}

export async function findUserWorkspace(userId: string, projectId: string) {
  return prisma.user_workspace.findFirst({ where: { userId, projectId } });
}

export async function findProjectWithWorkspace(projectId: string, userId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      user_workspace: { where: { userId }, take: 1 },
      deploy: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function findProjectsByUser(
  userId: string,
  page: number,
  perPage: number,
  name?: string,
) {
  const where: any = {
    userId,
    ...(name ? { name: { contains: name, mode: "insensitive" as const } } : {}),
  };
  return Promise.all([
    prisma.project.findMany({
      where,
      include: {
        deploy: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.count({ where }),
  ]);
}

export async function findProjectsByUserRaw(
  userId: string,
  page: number,
  limit: number,
  name?: string,
) {
  const where: any = {
    userId,
    ...(name ? { name: { contains: name, mode: "insensitive" as const } } : {}),
  };
  return Promise.all([
    prisma.project.findMany({
      where,
      include: {
        deploy: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.count({ where }),
  ]);
}

export async function deletePaymentsByProject(projectId: string) {
  return prisma.payment.deleteMany({ where: { projectId } });
}

export async function deleteDeploysByProject(projectId: string) {
  return prisma.deploy.deleteMany({ where: { projectId } });
}

export async function findProjectWithDeploy(projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId },
    include: {
      deploy: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function updateProjectDeployToken(id: string, token: string) {
  return prisma.project.update({
    where: { id },
    data: { deploy_token: token },
  });
}
