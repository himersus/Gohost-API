import { Request, Response } from "express";
import * as service from "./deploy.service";

export const listDeploys = async (req: Request | any, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 10;

    const result = await service.listDeploys(projectId, userId, { page, perPage });
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Falha ao listar deploys";
    res.status(status).json({ message });
  }
};

export const getDeploy = async (req: Request | any, res: Response) => {
  try {
    const deployId = req.params.deployId;
    const userId = req.userId;

    const deploy = await service.getDeploy(deployId, userId);
    res.status(200).json(deploy);
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Falha ao buscar deploy";
    res.status(status).json({ message });
  }
};

export const getDeployLogs = async (req: Request | any, res: Response) => {
  try {
    const deployId = req.params.deployId;
    const userId = req.userId;

    const result = await service.getDeployLogs(deployId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Falha ao obter logs" });
  }
};

export const cancelDeploy = async (req: Request | any, res: Response) => {
  try {
    const deployId = req.params.deployId;
    const userId = req.userId;

    const result = await service.cancelDeploy(deployId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Falha ao cancelar deploy" });
  }
};

export const deployApp = async (req: Request | any, res: Response) => {
  try {
    const { app, image, port } = req.body;

    const result = await service.deployApp(app, image, port || 3000);
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({
      ok: false,
      error: error.message || "Falha ao executar deploy",
    });
  }
};
