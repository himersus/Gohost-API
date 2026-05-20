import { roleWorkspace } from "@prisma/client";
import * as repo from "./member.repository";

export async function addProjectMember(
  currentUserId: string,
  username: string,
  projectId: string,
  role: string | undefined,
) {
  if (role && !["member", "master"].includes(role)) {
    throw { status: 400, message: "Função inválida fornecida" };
  }

  const currentUser = await repo.findUserById(currentUserId);
  if (!currentUser) throw { status: 401, message: "Não autorizado" };

  const isAdmin = await repo.findWorkspaceAdmin(currentUserId, projectId);
  if (!isAdmin) {
    throw { status: 403, message: "Apenas administradores podem adicionar membros" };
  }

  const user = await repo.findUserByAny(username);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  const existing = await repo.findWorkspaceMember(user.id, projectId);
  if (existing) {
    throw { status: 400, message: "Usuário já é membro do projeto" };
  }

    await repo.createWorkspace({
      userId: user.id,
      projectId,
      role: (role as roleWorkspace) || "member",
    });
}

export async function removeProjectMember(
  currentUserId: string,
  username: string,
  projectId: string,
) {
  const currentUser = await repo.findUserById(currentUserId);
  if (!currentUser) throw { status: 401, message: "Não autorizado" };

  const isAdmin = await repo.findWorkspaceAdmin(currentUserId, projectId);
  if (!isAdmin) {
    throw { status: 403, message: "Apenas administradores podem remover membros" };
  }

  const user = await repo.findUserByAny(username);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  const existing = await repo.findWorkspaceMember(user.id, projectId);
  if (!existing) {
    throw { status: 400, message: "Usuário não é membro do projeto" };
  }

  await repo.deleteWorkspace(existing.id);
}

export async function listProjectMembers(
  currentUserId: string,
  projectId: string,
  page: number,
  perPage: number,
) {
  const currentUser = await repo.findUserById(currentUserId);
  if (!currentUser) throw { status: 401, message: "Não autorizado" };

  const isMember = await repo.findWorkspaceMember(currentUserId, projectId);
  if (!isMember) {
    throw { status: 403, message: "Apenas membros do projeto podem listar os membros" };
  }

  const members = await repo.findWorkspacesByProject(projectId);
  const total = await repo.countWorkspacesByProject(projectId);

  return {
    data: members.map((m) => ({
      id: m.user.id,
      username: m.user.username,
      email: m.user.email,
      role: m.role,
    })),
    meta: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) },
  };
}
