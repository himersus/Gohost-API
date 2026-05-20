import { Request, Response } from "express";
import { validate } from "uuid";
import * as service from "./member.service";

export const addMember = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const { username, projectId, role } = req.body;

    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    await service.addProjectMember(userId, username, projectId, role);
    res.status(200).json({ message: "Membro adicionado com sucesso" });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao adicionar membro" });
  }
};

export const removeMember = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const { username, projectId } = req.body;

    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    await service.removeProjectMember(userId, username, projectId);
    res.status(200).json({ message: "Membro removido com sucesso" });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao remover membro" });
  }
};

export const listMembers = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const projectId = req.params.projectId;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 10;

    if (!userId || !validate(userId)) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const result = await service.listProjectMembers(userId, projectId, page, perPage);
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao listar membros" });
  }
};
