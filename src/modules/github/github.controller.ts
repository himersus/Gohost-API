import { Request, Response } from "express";
import { validate } from "uuid";
import * as service from "./github.service";

export const getUserRepos = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.per_page) || 10, 100);
    const name = (req.query.name as string)?.toLowerCase() || "";

    const result = await service.listUserRepos(userId, page, limit, name);
    res.json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Erro na sincronização com GitHub" });
  }
};

export const syncUserWithGitHub = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const { github_username, github_token, github_user_id } = req.body;

    if (!github_username || !github_token || !github_user_id) {
      return res.status(400).json({ message: "Dados do GitHub não fornecidos" });
    }
    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    await service.syncGithubUser(userId, github_username, github_token, github_user_id);
    res.status(200).json({ message: "Sincronização com GitHub realizada com sucesso" });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao sincronizar com GitHub" });
  }
};

export const getUserRepoByName = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const repo = req.params.repo;
    const owner = req.params.owner;

    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const data = await service.getRepoByName(userId, owner, repo);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao buscar repositório" });
  }
};

export const getUserBranchesByName = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const repo = req.params.repo;
    const owner = req.params.owner;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.per_page) || 10, 100);
    const name = (req.query.name as string)?.toLowerCase() || "";

    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const result = await service.listRepoBranches(userId, owner, repo, page, limit, name);
    res.json(result);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao buscar branches" });
  }
};

export const unsyncUserFromGitHub = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    await service.unsyncGithub(userId);
    res.status(200).json({ message: "Desconexão do GitHub realizada com sucesso" });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao desconectar do GitHub" });
  }
};

export const createCookieGitHub = (req: any, res: any) => {
  res.cookie("teste", "TEsteeeeee", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.status(200).json({ message: "Cookie criado com sucesso" });
};

export const readCookieGitHub = (req: any, res: any) => {
  res.json(req.cookies);
};
