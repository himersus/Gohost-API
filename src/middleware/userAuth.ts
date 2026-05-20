import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import prisma from "../lib/prisma";
const jwtSecret = process.env.JWT_SECRET as string;

export const verifyAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Usuário não autenticado. Por favor, faça login."
    });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string; username: string; email: string; role: string };
    (req as any).userId = decoded.id;
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });
    if (!user) {
      res.status(401).json({
        message: "Usuário não encontrado. Por favor, faça login novamente."
      });
      return;
    }
    if (user.is_active === false) {
      res.status(400).json({
        message: "Conta inativa. Por favor, ative sua conta."
      });
      return;
    }
    next();
  } catch (error) {
    res.status(401).json({
      message: "Usuário não autenticado. Por favor, faça login."
    });
  }
};


export const verifyAuthenticationAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Usuário não autenticado. Por favor, faça login."
    });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string; username: string; email: string; role: string };
    (req as any).userId = decoded.id;
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });
    if (!user) {
      res.status(401).json({
        message: "Usuário não encontrado. Por favor, faça login novamente."
      });
      return;
    }
    if (user.is_active === false) {
      res.status(400).json({
        message: "Conta inativa. Por favor, ative sua conta."
      });
      return;
    }

    if (user.roleUser !== 'admin') {
      res.status(403).json({
        message: "Acesso negado. Você não tem permissão para acessar este recurso."
      });
      return;
    }
    next();
  } catch (error) {
    res.status(401).json({
      message: "Usuário não autenticado. Por favor, faça login."
    });
  }
};
