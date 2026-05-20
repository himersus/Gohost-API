import prisma from "../../lib/prisma";

export async function findUserById(userId: string) {
  return prisma.user.findFirst({ where: { id: userId } });
}

export async function updateUserGithub(
  id: string,
  data: { github_username?: string | null; github_token?: string | null; github_id?: string | null },
) {
  return prisma.user.update({ where: { id }, data });
}

export async function findUserRepos(userId: string) {
  return prisma.user.findFirst({ where: { id: userId } });
}
