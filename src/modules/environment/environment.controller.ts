import { Request, Response } from "express";
import { q } from "../../utils/to_string";
import * as service from "./environment.service";

export const saveEnvVars = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const projectId = q(req.params.projectId) as string;
    const { environments } = req.body;

    await service.saveEnvironmentVars(userId, projectId, environments);
    res.status(200).json({ message: "Variáveis salvas com sucesso" });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao salvar variáveis" });
  }
};

export const getEnvVars = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const projectId = q(req.params.projectId) as string;
    const page = parseInt(q(req.query.page) || "1");
    const perPage = parseInt(q(req.query.per_page) || "10");

    const result = await service.listEnvironmentVars(userId, projectId, page, perPage);
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao buscar variáveis" });
  }
};

export const deleteEnvVar = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const projectId = q(req.params.projectId) as string;
    const envId = q(req.params.envId) as string;

    await service.deleteEnvironmentVar(userId, projectId, envId);
    res.status(200).json({ message: "Variável deletada com sucesso" });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao deletar variável" });
  }
};
