import prisma from "../../lib/prisma";

export async function findUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function findProjectById(projectId: string) {
  return prisma.project.findUnique({ where: { id: projectId } });
}

export async function findDeployById(deployId: string) {
  return prisma.deploy.findUnique({ where: { id: deployId } });
}

export async function findUserWorkspace(userId: string, projectId: string) {
  return prisma.user_workspace.findFirst({
    where: { userId, projectId },
  });
}

export async function findDeploysByProject(
  projectId: string,
  page: number,
  perPage: number,
) {
  return prisma.deploy.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
  });
}

export async function countDeploysByProject(projectId: string) {
  return prisma.deploy.count({ where: { projectId } });
}

export async function findProjectBySubdomain(subdomain: string) {
  return prisma.project.findUnique({ where: { subdomain } });
}

export async function createDeploy(data: {
  projectId: string;
  commit_id?: string | null;
  commit_msg?: string | null;
  commit_author?: string | null;
  commit_email?: string | null;
  commit_date?: Date | null;
  commit_branch?: string | null;
  commit_avatar_url?: string | null;
}) {
  return prisma.deploy.create({ data });
}

export async function updateDeployStatus(
  deployId: string,
  data: { status?: string; success?: boolean; logs?: string[] },
) {
  return prisma.deploy.update({
    where: { id: deployId },
    data: data as any,
  });
}

export async function findDeployWithProject(deployId: string) {
  return prisma.deploy.findUnique({
    where: { id: deployId },
    include: { Project: true },
  });
}
