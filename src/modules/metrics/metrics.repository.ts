import prisma from "../../lib/prisma";

export async function findProjectById(projectId: string) {
  return prisma.project.findFirst({ where: { id: projectId } });
}

export async function findProjectsByUser(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    select: {
      id: true,
      subdomain: true,
      payments: true,
      user_workspace: true,
    },
  });
}
