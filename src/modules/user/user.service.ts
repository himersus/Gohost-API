import * as repo from "./user.repository";
import prisma from "../../lib/prisma";

export async function fetchUserById(userId: string) {
  return repo.findUserByAny(userId);
}

export async function createMember(userId: string, projectId: string) {
  const user = await repo.findUserByAny(userId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!user || !project) {
    throw new Error("User or project not found");
  }

  await prisma.user_workspace.create({
    data: { userId: user.id, projectId: project.id, role: "master" },
  });
}
