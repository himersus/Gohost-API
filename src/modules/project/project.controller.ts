import { Request, Response } from "express";
import { validate } from "uuid";
import { generateUniqueSubdomain } from "../../utils/domain";
import { q } from "../../utils/to_string";
import { encryptEnv } from "../../utils/crypt";
import { getLastCommitFromBranch } from "../../utils/github";
import { computeProjectAmount, computeProjectDays } from "../../utils/project";
import * as repo from "./project.repository";
import {
  assertGithubLinked,
  validateUserInput,
  decryptGithubToken,
  validateGithubRepo,
  verifyGithubSession,
  stopProject,
  fetchUserById,
  createMember,
} from "./project.service";

export const createProject = async (req: Request | any, res: Response) => {
  const { name, description, branch, port, repo_url, environments, default_plan, default_type_payment, period_duration } = req.body;
  const userId = req.userId;

  if (!validate(userId) || !userId) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  const inputResult = validateUserInput(port, period_duration);
  if (!inputResult.valid) {
    return res.status(inputResult.status).json({ message: inputResult.message });
  }

  const existingName = await repo.findProjectByName(name, userId);
  if (existingName) {
    return res.status(400).json({ message: "Você já tem um projeto com esse nome" });
  }

  if (!name) {
    return res.status(400).json({ message: "O nome do projeto é obrigatório" });
  }

  try {
    const user = await fetchUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const githubCheck = assertGithubLinked(user);
    if (!githubCheck.linked) return res.status(400).json({ message: githubCheck.message });

    const plan = await repo.findPlanByName(default_plan);
    if (!plan) return res.status(400).json({ message: "O plano escolhido não está disponível" });

    if (plan.duration < 30 && period_duration && period_duration > 1) {
      return res.status(400).json({ message: "O plano não suporta a duração selecionada" });
    }

    const subdomain = await generateUniqueSubdomain(name);
    if (!subdomain) return res.status(500).json({ message: "Não foi possível gerar um subdomínio único" });
    if (!user.github_token) return res.status(400).json({ message: "Token do GitHub não encontrado" });

    const token = decryptGithubToken(user.github_token);
    if (!token) return res.status(500).json({ message: "Erro ao descriptografar token do GitHub" });

    try { await validateGithubRepo(repo_url, token); }
    catch (error) { return res.status(400).json({ message: "Erro ao verificar o repositório: " + (error as Error).message }); }

    await verifyGithubSession(token);

    const days = computeProjectDays(plan.duration, default_type_payment, period_duration);
    const amount = computeProjectAmount(plan.price, default_type_payment, period_duration);
    const baseDomain = process.env.BASE_DOMAIN;
    if (!baseDomain) return res.status(500).json({ message: "Base domain não configurado" });

    const project = await repo.createProject({
      name,
      description,
      branch,
      repo_url,
      default_plan: plan.name,
      default_type_payment: default_type_payment || "monthly",
      port: `${port}`,
      userId: user.id,
      subdomain: subdomain as string,
      domain: `https://${subdomain}.${baseDomain}`,
      days,
      amount_to_pay: amount,
    });

    const upserts = (environments || []).map(
      ({ key, value }: { key: string; value: string }) =>
        prisma.environment.upsert({
          where: { projectId_key: { projectId: project.id, key } },
          update: { value: encryptEnv(value) },
          create: { projectId: project.id, key, value: encryptEnv(value) },
        }),
    );

    if (upserts.length > 0) await prisma.$transaction(upserts);
    await createMember(user.id, project.id);

    return res.status(201).json({ ...project, paid: false });
  } catch (error) {
    console.error("[createProject]", error);
    return res.status(500).json({ message: "Erro ao criar projeto" });
  }
};

export const stopTheProject = async (req: Request | any, res: Response) => {
  const projectId = q(req.params.projectId);
  const userId = req.userId;

  if (!validate(projectId) || !validate(userId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const result = await stopProject(projectId, userId);
    if (result && result.statusCode !== 200) {
      return res.status(result.statusCode).json({ message: result.message });
    }
    res.status(200).json({ message: "Projeto parado com sucesso" });
  } catch {
    res.status(500).json({ message: "Erro ao parar projeto" });
  }
};

export const getProject = async (req: Request | any, res: Response) => {
  const projectId = q(req.params.projectId);
  const userId = req.userId;

  if (!validate(projectId) || !validate(userId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const user = await repo.findUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const project = await repo.findProjectWithWorkspace(projectId, userId);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });
    if (project.user_workspace.length === 0) {
      return res.status(403).json({ message: "Você não tem acesso a este projeto" });
    }

    const paid = !!(project.date_expire && project.date_expire > new Date());
    const lastCommit = await getLastCommitFromBranch(project.repo_url, project.branch, user.github_token!);

    return res.status(200).json({
      ...project,
      paid,
      deploy: {
        commit_msg: lastCommit.message || "unknown",
        commit_branch: project.branch,
        commit_author: lastCommit.author || "unknown",
        status: project.deploy[0]?.status || "unknown",
        commit_avatar_url: lastCommit.avatar_url || null,
      },
    });
  } catch (error) {
    console.error("[getProject]", error);
    return res.status(500).json({ message: "Erro ao buscar projeto" });
  }
};

export const getMyProjects = async (req: Request | any, res: Response) => {
  const userId = req.userId;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.per_page as string) || 10;
  const name = req.query.name as string | undefined;

  if (!validate(userId)) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  try {
    const user = await repo.findUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const [projects, total] = await repo.findProjectsByUser(userId, page, perPage, name);
    const now = new Date();

    const data = await Promise.all(
      projects.map(async (p) => {
        try {
          const commit = await getLastCommitFromBranch(p.repo_url, p.branch, user.github_token!);
          return {
            ...p,
            paid: !!(p.date_expire && p.date_expire > now),
            deploy: {
              commit_msg: commit.message || "unknown",
              commit_branch: p.branch,
              commit_author: commit.author || "unknown",
              status: p.deploy[0]?.status || "unknown",
              commit_avatar_url: commit.avatar_url || null,
            },
          };
        } catch {
          return { ...p, paid: !!(p.date_expire && p.date_expire > now), deploy: p.deploy[0] || null };
        }
      }),
    );

    res.status(200).json({ data, meta: { page, per_page: perPage, total_pages: Math.ceil(total / perPage) } });
  } catch (error) {
    console.error("[getMyProjects]", error);
    res.status(500).json({ message: "Falha ao recuperar projetos" });
  }
};

export const getAllProjects = async (req: Request | any, res: Response) => {
  const userId = req.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.per_page as string) || 10;
  const name = req.query.name as string | undefined;

  if (!userId || !validate(userId)) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  try {
    const user = await repo.findUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const [projects, total] = await repo.findProjectsByUserRaw(userId, page, limit, name);
    const now = new Date();

    const data = await Promise.all(
      projects.map(async (p) => {
        try {
          const commit = await getLastCommitFromBranch(p.repo_url, p.branch, user.github_token!);
          return {
            ...p,
            paid: !!(p.date_expire && p.date_expire > now),
            deploy: {
              commit_msg: commit.message || "unknown",
              commit_branch: p.branch,
              commit_author: commit.author || "unknown",
              status: p.deploy[0]?.status || "unknown",
              commit_avatar_url: commit.avatar_url || null,
            },
          };
        } catch {
          return { ...p, paid: !!(p.date_expire && p.date_expire > now), deploy: p.deploy[0] || null };
        }
      }),
    );

    res.status(200).json({ data, meta: { page, per_page: limit, total_pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[getAllProjects]", error);
    res.status(500).json({ message: "Falha ao recuperar projetos" });
  }
};

export const updateProject = async (req: Request | any, res: Response) => {
  const projectId = q(req.params.projectId);
  const { name, description, branch, port } = req.body;
  const userId = req.userId;

  if (!validate(projectId) || !validate(userId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const inputResult = validateUserInput(port, undefined);
  if (!inputResult.valid) {
    return res.status(inputResult.status).json({ message: inputResult.message });
  }

  try {
    const project = await repo.findProjectById(projectId);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    const workspace = await repo.findUserWorkspace(userId, projectId);
    if (!workspace || workspace.role !== "master") {
      return res.status(403).json({ message: "Você não tem acesso a este projeto" });
    }

    if (name) {
      const dup = await repo.findProjectByNameExcluding(name, userId, projectId);
      if (dup) return res.status(400).json({ message: "Você já tem um projeto com esse nome" });
    }

    const updated = await repo.updateProject(projectId, {
      name: name || project.name,
      description: description || project.description,
      port: port || project.port,
      branch: branch || project.branch,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Falha ao atualizar projeto" });
  }
};

export const deleteProject = async (req: Request | any, res: Response) => {
  const projectId = q(req.params.projectId);
  const userId = req.userId;

  if (!validate(projectId) || !validate(userId)) {
    return res.status(400).json({ message: "Projecto ou utilizador inválido" });
  }

  try {
    const project = await repo.findProjectById(projectId);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    const workspace = await repo.findUserWorkspace(userId, projectId);
    if (!workspace || workspace.role !== "master") {
      return res.status(403).json({ message: "Você não tem acesso a este projeto" });
    }

    await repo.deletePaymentsByProject(projectId);
    await repo.deleteDeploysByProject(projectId);
    await repo.deleteProject(projectId);

    res.status(200).json({ message: "Projeto deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Falha ao deletar projeto" });
  }
};

import prisma from "../../lib/prisma";
