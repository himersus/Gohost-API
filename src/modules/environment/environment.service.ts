import { encryptEnv } from "../../utils/crypt";
import * as repo from "./environment.repository";

export async function saveEnvironmentVars(
  userId: string,
  projectId: string,
  environments: { key: string; value: string }[],
) {
  const user = await repo.findUserById(userId);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  const members = await repo.findUserWorkspaces(userId, projectId);
  if (members.length === 0) {
    throw { status: 403, message: "Você não tem acesso a este projeto" };
  }

  const project = await repo.findProjectById(projectId, userId);
  if (!project) throw { status: 404, message: "Projeto não encontrado" };

  const upserts = environments.map(({ key, value }) =>
    repo.upsertEnvironment(projectId, key, encryptEnv(value)),
  );

  await Promise.all(upserts);
}

export async function listEnvironmentVars(
  userId: string,
  projectId: string,
  page: number,
  perPage: number,
) {
  const user = await repo.findUserById(userId);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  const members = await repo.findUserWorkspaces(userId, projectId);
  if (members.length === 0) {
    throw { status: 403, message: "Você não tem acesso a este projeto" };
  }

  const project = await repo.findProjectById(projectId, userId);
  if (!project) throw { status: 404, message: "Projeto não encontrado" };

  const [vars, total] = await Promise.all([
    repo.findEnvironmentsByProject(projectId),
    repo.countEnvironmentsByProject(projectId),
  ]);

  return {
    data: vars,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  };
}

export async function deleteEnvironmentVar(
  userId: string,
  projectId: string,
  envId: string,
) {
  const user = await repo.findUserById(userId);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  const members = await repo.findUserWorkspaces(userId, projectId);
  if (members.length === 0) {
    throw { status: 403, message: "Você não tem acesso a este projeto" };
  }

  const project = await repo.findProjectById(projectId, userId);
  if (!project) throw { status: 404, message: "Projeto não encontrado" };

  const env = await repo.findEnvironmentById(envId, projectId);
  if (!env) {
    throw { status: 404, message: "Variável de ambiente não encontrada" };
  }

  await repo.deleteEnvironment(envId);
}
