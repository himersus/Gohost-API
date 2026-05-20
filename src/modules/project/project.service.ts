import crypto from "crypto";
import { execSync } from "child_process";
import { decryptToken } from "../../utils/crypt";
import { parseGithubRepo, repositoryUsesDocker } from "../../utils/github";
import * as repo from "./project.repository";
import { fetchUserById, createMember } from "../user/user.service";

export function validateUserInput(
  port: unknown,
  period_duration: unknown,
):
  | { valid: false; status: number; message: string }
  | { valid: true; portNumber: number } {
  const portNumber = Number(port);
  if (!port || !portNumber) {
    return { valid: false, status: 400, message: "Porta é obrigatório e deve ser um número valido" };
  }
  if (portNumber < 1024 || portNumber > 65535) {
    return { valid: false, status: 400, message: "Porta deve estar entre 1024 e 65535" };
  }
  if (period_duration !== undefined && (!Number.isInteger(period_duration) || (period_duration as number) <= 0)) {
    return { valid: false, status: 400, message: "Duração do período deve ser um número inteiro positivo" };
  }
  return { valid: true, portNumber };
}

export function assertGithubLinked(user: {
  github_id?: string | null;
  github_token?: string | null;
  github_username?: string | null;
}) {
  if (!user.github_id || !user.github_token || !user.github_username) {
    return { linked: false, message: "Informações do GitHub são obrigatórias, tente sincronizar com o github" } as const;
  }
  return { linked: true } as const;
}

export function decryptGithubToken(encryptedToken: string): string | null {
  return decryptToken(encryptedToken);
}

export async function validateGithubRepo(repoUrl: string, token: string): Promise<void> {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) throw new Error("URL do repositório GitHub inválida");
  if ((await repositoryUsesDocker(parsed.owner, parsed.repo, token)) === false) {
    throw new Error("O repositório deve conter um Dockerfile na raiz");
  }
}

export async function verifyGithubSession(token: string): Promise<void> {
  const response = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new Error("A sua sessão do GitHub expirou, por favor sincronize novamente");
  }
}

export { fetchUserById, createMember };

export async function getDeployToken(projectId: string, userId: string) {
  const project = await repo.findProjectById(projectId);
  if (!project) throw { status: 404, message: "Projeto não encontrado" };
  if (project.userId !== userId) {
    throw { status: 403, message: "Você não tem permissão para ver este token" };
  }
  return { deploy_token: project.deploy_token };
}

export async function regenerateDeployToken(projectId: string, userId: string) {
  const project = await repo.findProjectById(projectId);
  if (!project) throw { status: 404, message: "Projeto não encontrado" };
  if (project.userId !== userId) {
    throw { status: 403, message: "Você não tem permissão para regenerar este token" };
  }

  const newToken = crypto.randomUUID();
  await repo.updateProjectDeployToken(projectId, newToken);
  return { deploy_token: newToken };
}

export async function stopProject(projectId: string, userId: string) {
  const project = await repo.findProjectById(projectId);
  if (!project) return { statusCode: 404, message: "Projeto não encontrado" };
  if (project.userId !== userId) {
    return { statusCode: 403, message: "Você não tem permissão para parar este projeto" };
  }

  try {
    execSync(`docker stop ${project.subdomain} || true`, { timeout: 30_000 });
    execSync(`docker rm ${project.subdomain} || true`, { timeout: 30_000 });
    await repo.updateProject(projectId, { run_status: false });
    return { statusCode: 200, message: "Projeto parado com sucesso" };
  } catch (error: any) {
    console.error("[stopProject]", error.message);
    return { statusCode: 500, message: "Erro ao parar projeto" };
  }
}
