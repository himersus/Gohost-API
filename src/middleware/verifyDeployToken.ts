import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";

export const verifyDeployToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ ok: false, error: "Token de deploy não fornecido" });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ ok: false, error: "Token de deploy inválido" });
    return;
  }

  const project = await prisma.project.findUnique({
    where: { deploy_token: token },
  });

  if (!project) {
    res.status(401).json({ ok: false, error: "Token de deploy inválido ou projeto não encontrado" });
    return;
  }

  (req as any).project = project;
  next();
};
