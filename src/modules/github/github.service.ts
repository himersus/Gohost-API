import axios from "axios";
import { decryptToken } from "../../utils/crypt";
import * as githubRepo from "./github.repository";

function getLastPage(linkHeader?: string): number | null {
  if (!linkHeader) return null;
  const links = linkHeader.split(",");
  const last = links.find((l) => l.includes('rel="last"'));
  if (!last) return null;
  const match = last.match(/page=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function getDecryptedToken(user: any): string {
  if (!user.github_token || !user.github_username || !user.github_id) {
    throw { status: 404, message: "Usuário não sincronizado com GitHub" };
  }
  const token = decryptToken(user.github_token.replace(/\s/g, ""));
  if (!token) {
    throw { status: 401, message: "Sincronização com GitHub expirada" };
  }
  return token;
}

export async function listUserRepos(userId: string, page: number, limit: number, name: string) {
  const user = await githubRepo.findUserById(userId);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  const token = getDecryptedToken(user);

  const response = await axios.get("https://api.github.com/user/repos", {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
    params: { affiliation: "owner,collaborator,organization_member", sort: "updated", direction: "desc", page, per_page: limit },
  });

  let data = response.data;
  if (name) {
    data = data.filter((r: any) => r.name.toLowerCase().includes(name));
  }

  return {
    data,
    meta: { page, per_page: limit, total_pages: getLastPage(response.headers.link) },
  };
}

export async function syncGithubUser(userId: string, githubUsername: string, githubToken: string, githubUserId: string) {
  const user = await githubRepo.findUserById(userId);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  await githubRepo.updateUserGithub(userId, {
    github_username: githubUsername,
    github_token: githubToken,
    github_id: githubUserId,
  });
}

export async function getRepoByName(userId: string, owner: string, repo: string) {
  const user = await githubRepo.findUserById(userId);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  const token = getDecryptedToken(user);

  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw { status: 404, message: "Repositório não encontrado" };
    }
    throw { status: 500, message: "Erro ao buscar repositório" };
  }
}

export async function listRepoBranches(userId: string, owner: string, repo: string, page: number, limit: number, name: string) {
  const user = await githubRepo.findUserById(userId);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  const token = getDecryptedToken(user);

  const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches`, {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
    params: { page, per_page: limit },
  });

  let branches = response.data;
  if (name) {
    branches = branches.filter((b: any) => b.name.toLowerCase().includes(name));
  }

  return {
    data: branches,
    meta: { page, per_page: limit, total_pages: getLastPage(response.headers.link) },
  };
}

export async function unsyncGithub(userId: string) {
  const user = await githubRepo.findUserById(userId);
  if (!user) throw { status: 404, message: "Usuário não encontrado" };

  if (!user.github_token && !user.github_username && !user.github_id) {
    throw { status: 400, message: "Usuário já não está sincronizado com GitHub" };
  }

  await githubRepo.updateUserGithub(userId, {
    github_username: null,
    github_token: null,
    github_id: null,
  });
}
