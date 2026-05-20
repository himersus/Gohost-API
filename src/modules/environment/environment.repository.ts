import prisma from "../../lib/prisma";

export async function findUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function findProjectById(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } });
}

export async function findUserWorkspaces(userId: string, projectId: string) {
  return prisma.user_workspace.findMany({ where: { userId, projectId } });
}

export async function upsertEnvironment(
  projectId: string,
  key: string,
  value: string,
) {
  return prisma.environment.upsert({
    where: { projectId_key: { projectId, key } },
    update: { value },
    create: { projectId, key, value },
  });
}

export async function findEnvironmentsByProject(projectId: string) {
  return prisma.environment.findMany({
    where: { projectId },
    select: {
      id: true,
      key: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function countEnvironmentsByProject(projectId: string) {
  return prisma.environment.count({ where: { projectId } });
}

export async function findEnvironmentById(envId: string, projectId: string) {
  return prisma.environment.findFirst({ where: { id: envId, projectId } });
}

export async function deleteEnvironment(id: string) {
  return prisma.environment.delete({ where: { id } });
}
