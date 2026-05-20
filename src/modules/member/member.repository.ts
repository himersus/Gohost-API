import { roleWorkspace } from "@prisma/client";
import prisma from "../../lib/prisma";

export async function findUserById(userId: string) {
  return prisma.user.findFirst({ where: { id: userId } });
}

export async function findUserByAny(username: string) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { id: /^[0-9a-f-]{36}$/i.test(username) ? username : undefined },
        { username },
        { email: username },
      ],
    },
  });
}

export async function findWorkspaceAdmin(userId: string, projectId: string) {
  return prisma.user_workspace.findFirst({
    where: { userId, projectId, role: "master" },
  });
}

export async function findWorkspaceMember(userId: string, projectId: string) {
  return prisma.user_workspace.findFirst({ where: { userId, projectId } });
}

export async function createWorkspace(data: {
  userId: string;
  projectId: string;
  role: roleWorkspace;
}) {
  return prisma.user_workspace.create({ data });
}

export async function deleteWorkspace(id: string) {
  return prisma.user_workspace.delete({ where: { id } });
}

export async function findWorkspacesByProject(projectId: string) {
  return prisma.user_workspace.findMany({
    where: { projectId },
    include: { user: true },
  });
}

export async function countWorkspacesByProject(projectId: string) {
  return prisma.user_workspace.count({ where: { projectId } });
}
