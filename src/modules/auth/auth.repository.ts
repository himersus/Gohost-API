import { Provider } from "@prisma/client";
import prisma from "../../lib/prisma";

export async function findUserByLogin(username: string) {
  return prisma.user.findFirst({
    where: { OR: [{ username }, { email: username }] },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function updateUserConfirmCode(email: string, code: string | null) {
  return prisma.user.update({ where: { email }, data: { confirm_code: code } });
}

export async function activateUser(email: string) {
  return prisma.user.update({
    where: { email },
    data: { is_active: true, confirm_code: null },
  });
}

export async function createUser(data: {
  name: string;
  username: string;
  email: string;
  provider: Provider;
  password?: string | null;
  is_active: boolean;
  github_username?: string;
  github_token?: string;
  github_id?: string;
}) {
  return prisma.user.create({ data });
}

export async function updateUserGithub(
  id: string,
  data: { github_username?: string; github_token?: string; github_id?: string },
) {
  return prisma.user.update({ where: { id }, data });
}
