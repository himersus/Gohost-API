import { Request, Response } from "express";
import { q } from "../../utils/to_string";
import * as service from "./plan.service";

export async function addPlan(req: Request, res: Response) {
  try {
    const plan = await service.createPlan(req.body);
    res.status(201).json(plan);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao criar plano" });
  }
}

export async function getPlans(req: Request, res: Response) {
  try {
    const plans = await service.listPlans();
    res.status(200).json(plans);
  } catch {
    res.status(500).json({ message: "Erro ao buscar planos" });
  }
}

export async function updatePlan(req: Request, res: Response) {
  try {
    const planId = q(req.params.planId);
    await service.updatePlan(planId, req.body);
    res.status(200).json({ message: "Plano atualizado com sucesso" });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao atualizar plano" });
  }
}

export async function getPlanById(req: Request, res: Response) {
  try {
    const planId = q(req.params.planId);
    const plan = await service.getPlanById(planId);
    res.status(200).json(plan);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao buscar plano" });
  }
}

export async function deletePlan(req: Request, res: Response) {
  try {
    const planId = q(req.params.planId);
    await service.deletePlanById(planId);
    res.status(200).json({ message: "Plano deletado com sucesso" });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erro ao deletar plano" });
  }
}
