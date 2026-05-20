import { exec, execFile } from "child_process";
import { decryptToken, encryptEnv, decryptEnv } from "../../utils/crypt";
import { parseGithubRepo, repositoryUsesDocker, getLastCommitFromBranch } from "../../utils/github";
import { sendSocketContent } from "../../sockets";
import prisma from "../../lib/prisma";
import fs from "fs";
import path from "path";
import { collectLogs, startLogStream } from "../../utils/logs";
import { fetchUserById, createMember } from "../user/user.service";
import { sanitizeShellArg, sanitizeBranchName, sanitizeSubdomain, sanitizeUsername } from "../../utils/sanitize";

export function validateUserInput(
  port: unknown,
  period_duration: unknown,
):
  | { valid: false; status: number; message: string }
  | { valid: true; portNumber: number } {
  const portNumber = Number(port);

  if (!port || !portNumber) {
    return {
      valid: false,
      status: 400,
      message: "Porta é obrigatório e deve ser um número valido",
    };
  }
  if (portNumber < 1024 || portNumber > 65535) {
    return {
      valid: false,
      status: 400,
      message: "Porta deve estar entre 1024 e 65535",
    };
  }
  if (
    period_duration !== undefined &&
    (!Number.isInteger(period_duration) || (period_duration as number) <= 0)
  ) {
    return {
      valid: false,
      status: 400,
      message: "Duração do período deve ser um número inteiro positivo",
    };
  }

  return { valid: true, portNumber };
}

export function assertGithubLinked(user: {
  github_id?: string | null;
  github_token?: string | null;
  github_username?: string | null;
}) {
  if (!user.github_id || !user.github_token || !user.github_username) {
    return {
      linked: false,
      message: "Informações do GitHub são obrigatórias, tente sincronizar com o github",
    } as const;
  }
  return { linked: true } as const;
}

export function decryptGithubToken(encryptedToken: string): string | null {
  return decryptToken(encryptedToken);
}

export async function validateGithubRepo(repoUrl: string, token: string): Promise<void> {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) {
    throw new Error("URL do repositório GitHub inválida");
  }
  if ((await repositoryUsesDocker(parsed.owner, parsed.repo, token)) === false) {
    throw new Error("O repositório deve conter um Dockerfile na raiz");
  }
}

export async function verifyGithubSession(token: string): Promise<void> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!response.ok) {
    throw new Error("A sua sessão do GitHub expirou, por favor sincronize novamente");
  }
}

export function buildCloneUrl(repoUrl: string, token: string): string {
  return repoUrl.replace("https://", `https://x-access-token:${token}@`);
}

export function cloneRepository(
  cloneUrl: string,
  targetPath: string,
  branch: string,
  projectId: string
): void {
  const safeBranch = sanitizeBranchName(branch);
  const safeTarget = sanitizeShellArg(targetPath);
  const safeUrl = sanitizeShellArg(cloneUrl);

  execFile("mkdir", ["-p", safeTarget], (mkdirErr) => {
    if (mkdirErr) {
      console.error(`Erro ao criar diretório [${projectId}]: ${mkdirErr.message}`);
      return;
    }

    execFile("git", ["clone", "--depth=1", "-b", safeBranch, safeUrl, safeTarget],
      { timeout: 60_000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } },
      async (error, _stdout, stderr) => {
        if (error) {
          await prisma.project.update({
            where: { id: projectId },
            data: { clone: "failed" },
          });
          console.error(`Erro ao clonar [${projectId}]: ${error.message}`);
          return;
        }

        console.log(stderr);

        await prisma.project.update({
          where: { id: projectId },
          data: { clone: "cloned" },
        });

        console.log(`Clone concluído [${projectId}]`);
      }
    );
  });
}

export { fetchUserById, createMember };

type RunProjectResponse = {
  statusCode: number;
  message: string;
} | void;

const generateEnvContent = (projectEnvs: string[]): string => {
  let envContent = "";
  projectEnvs.forEach((envVar: string) => {
    envContent += `${envVar}\n`;
  });
  return envContent;
};

export async function runProject(
  projectId: string,
  userId: string,
): Promise<RunProjectResponse> {
  const project = await prisma.project.findFirst({
    where: { id: projectId },
  });

  if (!project) {
    return { statusCode: 404, message: "Projeto não encontrado" };
  }

  const now = new Date();
  if (!project.date_expire || project.date_expire < now) {
    return {
      statusCode: 403,
      message: "O plano associado a este projeto expirou. Por favor, renove o plano para continuar.",
    };
  }

  const existUser = await prisma.user.findFirst({
    where: { id: userId },
  });

  if (!existUser) {
    return { statusCode: 404, message: "Usuário não encontrado" };
  }

  if (project.userId !== userId) {
    return {
      statusCode: 403,
      message: "Você não tem permissão para executar este projeto",
    };
  }

  if (!existUser.github_token) {
    return {
      statusCode: 400,
      message: "Token do GitHub não encontrado, tente sincronizar novamente",
    };
  }

  const deployDir = process.env.DEPLOY_DIR;
  const targetPath = `${deployDir}/${existUser.username}/${project.subdomain}`;
  if (!project.path) {
    await prisma.project.update({
      where: { id: project.id },
      data: { path: encryptEnv(targetPath) },
    });
  }

  const createComposeTreakfik = `
services:
  ${project.subdomain}:
    build: .
    container_name: ${project.subdomain}-api
    restart: always
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.${project.subdomain}.rule=Host(\`${project.subdomain}.enor.tech\`)"
      - "traefik.http.routers.${project.subdomain}.entrypoints=websecure"
      - "traefik.http.routers.${project.subdomain}.tls.certresolver=le"
      - "traefik.http.services.${project.subdomain}.loadbalancer.server.port=${project.port}"
    networks:
      - web
networks:
  web:
    external: true
`;

  fs.mkdirSync(targetPath, { recursive: true });

  fs.writeFileSync(
    path.join(targetPath, "docker-compose.yml"),
    createComposeTreakfik,
  );

  const lastCommit = await getLastCommitFromBranch(
    project.repo_url,
    project.branch,
    existUser.github_token!,
  );

  const buildDeploy = await prisma.deploy.create({
    data: {
      projectId: projectId,
      commit_id: lastCommit.sha || "unknown",
      commit_msg: lastCommit.message || "unknown",
      commit_author: lastCommit.author || "unknown",
      commit_email: lastCommit.email || "unknown",
      commit_date: lastCommit.date || new Date(),
      commit_branch: project.branch,
      commit_avatar_url: lastCommit.avatar_url || null,
    },
  });

  sendSocketContent("deploy_logs", {
    deployId: buildDeploy.id,
    projectId: projectId,
    status: "building",
    message: "Iniciando build do deploy",
  });

  if (!fs.existsSync(path.join(targetPath, "Dockerfile"))) {
    await prisma.deploy.update({
      where: { id: buildDeploy.id },
      data: {
        status: "failed",
        success: false,
      },
    });

    sendSocketContent("deploy_logs", {
      deployId: buildDeploy.id,
      projectId: projectId,
      status: "failed",
      message: "Este projecto não está disponível para deploy, verifique se o Dockerfile existe na raiz do repositório",
    });
    return {
      statusCode: 404,
      message: "Este projecto não está disponível para deploy, verifique se o Dockerfile existe na raiz do repositório",
    };
  }

  const environments = await prisma.environment.findMany({
    where: { projectId: projectId },
  });

  if (environments) {
    const envContent = generateEnvContent(
      environments.map((env) => `${env.key}=${decryptEnv(env.value)}`),
    );
    fs.writeFileSync(path.join(targetPath, ".env"), envContent);
  }

  exec(
    "git pull && docker-compose down -v && docker-compose up -d --build",
    { cwd: targetPath },
    async (error, stdout, stderr) => {
      if (error) {
        console.error("[docker error]", stderr);
        const logSplit = stderr.split("\n");
        await prisma.deploy.update({
          where: { id: buildDeploy.id },
          data: {
            status: "failed",
            success: false,
            logs: logSplit,
          },
        });
        sendSocketContent("deploy_logs", {
          deployId: buildDeploy.id,
          projectId: projectId,
          status: "failed",
          message: logSplit[logSplit.length - 2] || "Erro desconhecido durante o build do deploy",
        });
        await prisma.project.update({
          where: { id: projectId },
          data: { run_status: false },
        });
        return;
      }

      console.log("[docker]", stdout);
      const logSplit = stdout.split("\n");
      sendSocketContent("deploy_logs", {
        deployId: buildDeploy.id,
        projectId: projectId,
        status: "building",
        message: logSplit[logSplit.length - 2] || "Build do deploy concluído",
      });
      collectLogs(buildDeploy.id, projectId, logSplit);
      await prisma.deploy.update({
        where: { id: buildDeploy.id },
        data: {
          status: "running",
          success: true,
        },
      });

      await prisma.project.update({
        where: { id: projectId },
        data: {
          run_status: true,
        },
      });

      sendSocketContent("deploy_logs", {
        deployId: buildDeploy.id,
        projectId: projectId,
        status: "running",
        message: "Deploy executando com sucesso",
      });
      startLogStream(buildDeploy.id, projectId, project.subdomain);
    },
  );

  return { statusCode: 200, message: "Deploy iniciado" };
}

type StopProjectResponse = {
  statusCode: number;
  message: string;
} | void;

export async function stopProject(
  projectId: string,
  userId: string,
): Promise<StopProjectResponse> {
  const project = await prisma.project.findFirst({
    where: { id: projectId },
  });

  if (!project) {
    return {
      statusCode: 404,
      message: "Projeto não encontrado",
    };
  }

  if (project.userId !== userId) {
    return {
      statusCode: 403,
      message: "Você não tem permissão para parar este projeto",
    };
  }

  const existUser = await prisma.user.findFirst({
    where: { id: userId },
  });

  if (!existUser) {
    return {
      statusCode: 404,
      message: "Usuário não encontrado",
    };
  }

  const deployDir = process.env.DEPLOY_DIR;
  const targetPath = `${deployDir}/${existUser.username}/${project.subdomain}`;

  if (!project.path) {
    await prisma.project.update({
      where: { id: project.id },
      data: { path: encryptEnv(targetPath) },
    });
  }

  exec(
    "docker-compose down --rmi all --volumes",
    { cwd: targetPath },
    async (error, stdout, stderr) => {
      if (error) {
        console.error(`[docker error]: ${stderr}`);
        return;
      }

      await prisma.project.update({
        where: { id: projectId },
        data: { run_status: false },
      });

      console.log(`[docker]: ${stdout}`);
    },
  );

  return {
    statusCode: 200,
    message: "Projeto parado com sucesso",
  };
}
