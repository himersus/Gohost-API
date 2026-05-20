import prisma from "../../lib/prisma";

export async function findUserByAny(userId: string) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(userId);
  return prisma.user.findFirst({
    where: {
      OR: [
        { id: isUuid ? userId : undefined },
        { username: userId },
        { email: userId },
      ],
    },
  });
}

export async function findUserByEmailOrUsername(email: string, username: string) {
  return prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
}

export async function findUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function findAllUsers(
  username: string | undefined,
  page: number,
  limit: number,
) {
  return prisma.user.findMany({
    where: username
      ? { username: { contains: username, mode: "insensitive" as const } }
      : undefined,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  username: string;
}) {
  return prisma.user.create({ data });
}

export async function updateUser(
  id: string,
  data: { email?: string; name?: string },
) {
  return prisma.user.update({ where: { id }, data });
}
