import { Request, Response } from "express";
import { validate } from "uuid";
import * as service from "./metrics.service";

export const getServiceMetrics = async (req: Request | any, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId || !validate(projectId)) {
      return res.status(400).json({ message: "ID do projeto é obrigatório" });
    }

    const result = await service.getServiceMetrics(projectId);
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao coletar métricas do serviço" });
  }
};

export const getMyGeneralMetrics = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId || !validate(userId)) {
      return res.status(400).json({ message: "ID do usuário é obrigatório" });
    }

    const result = await service.getGeneralMetrics(userId);
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao coletar métricas gerais" });
  }
};

export const getVpsMetrics = async (req: Request | any, res: Response) => {
  try {
    const result = await service.getVpsMetrics();
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Erro ao coletar métricas da VPS" });
  }
};
