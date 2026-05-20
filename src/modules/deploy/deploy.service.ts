import { validate } from "uuid";
import { execSync } from "child_process";
import * as repo from "./deploy.repository";

const BASE_DOMAIN = process.env.BASE_DOMAIN || "enor.tech";
const TRAEFIK_NETWORK = "traefik-public";

interface PaginationParams {
  page: number;
  perPage: number;
}

interface ListDeploysResult {
  data: any[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

function runDockerCommand(command: string): string {
  try {
    return execSync(command, { timeout: 120_000, encoding: "utf-8" });
  } catch (error: any) {
    throw new Error(error.stderr || error.message);
  }
}

async function validateAuthenticatedUser(userId: string) {
  if (!userId || !validate(userId)) {
    return { valid: false as const, status: 401, message: "Usuário não autenticado" };
  }

  const user = await repo.findUserById(userId);
  if (!user) {
    return { valid: false as const, status: 404, message: "Usuário não encontrado" };
  }

  return { valid: true as const, user };
}

export async function listDeploys(
  projectId: string,
  userId: string,
  pagination: PaginationParams,
): Promise<ListDeploysResult> {
  const auth = await validateAuthenticatedUser(userId);
  if (!auth.valid) {
    throw { status: auth.status, message: auth.message };
  }

  if (!validate(projectId)) {
    throw { status: 400, message: "ID do projeto inválido" };
  }

  const project = await repo.findProjectById(projectId);
  if (!project) {
    throw { status: 404, message: "Projeto não encontrado" };
  }

  const { page, perPage } = pagination;
  const [deploys, total] = await Promise.all([
    repo.findDeploysByProject(projectId, page, perPage),
    repo.countDeploysByProject(projectId),
  ]);

  return {
    data: deploys,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  };
}

export async function getDeploy(
  deployId: string,
  userId: string,
) {
  const auth = await validateAuthenticatedUser(userId);
  if (!auth.valid) {
    throw { status: auth.status, message: auth.message };
  }

  if (!validate(deployId)) {
    throw { status: 400, message: "ID do deploy inválido" };
  }

  const deploy = await repo.findDeployById(deployId);
  if (!deploy) {
    throw { status: 404, message: "Deploy não encontrado" };
  }

  const project = await repo.findProjectById(deploy.projectId);
  if (!project) {
    throw { status: 404, message: "Projeto não encontrado" };
  }

  const workspace = await repo.findUserWorkspace(userId, project.id);
  if (!workspace) {
    throw { status: 403, message: "Você não tem acesso a este deploy" };
  }

  return deploy;
}

export async function deployApp(
  app: string,
  image: string,
  port: number = 3000,
) {
  if (!app || !image) {
    throw { status: 400, message: "Campos 'app' e 'image' são obrigatórios" };
  }

  const project = await repo.findProjectBySubdomain(app);
  if (!project) {
    throw { status: 404, message: `App '${app}' não encontrada` };
  }

  const deployRecord = await repo.createDeploy({
    projectId: project.id,
  });

  try {
    runDockerCommand(`docker pull ${image}`);

    runDockerCommand(`docker stop ${app} || true`);

    runDockerCommand(`docker rm ${app} || true`);

    runDockerCommand(
      `docker run -d ` +
        `--name ${app} ` +
        `--network ${TRAEFIK_NETWORK} ` +
        `--restart unless-stopped ` +
        `--label traefik.enable=true ` +
        `--label traefik.http.routers.${app}.rule=Host(\`${app}.${BASE_DOMAIN}\`) ` +
        `--label traefik.http.routers.${app}.tls.certresolver=letsencrypt ` +
        `--label traefik.http.services.${app}.loadbalancer.server.port=${port} ` +
        `${image}`,
    );

    runDockerCommand("docker image prune -f");

    await repo.updateDeployStatus(deployRecord.id, {
      status: "running",
      success: true,
    });

    return {
      ok: true,
      url: `https://${app}.${BASE_DOMAIN}`,
    };
  } catch (error: any) {
    await repo.updateDeployStatus(deployRecord.id, {
      status: "failed",
      success: false,
      logs: [error.message],
    });

    throw { status: 500, message: error.message };
  }
}
