import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { validate } from "uuid";
import { generateUniqueDomain } from "../modify/domain";


const prisma = new PrismaClient();

export const createProject = async (req: Request | any, res: Response) => {
    const { name, description, environments, workspaceId, time_in_day, amount } = req.body;
    const userId = req.userId;
    try {
        const existUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: validate(userId) ? userId : undefined },
                    { username: userId },
                    { email: userId }
                ]
            },
        });

        if (!existUser) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        if (!name) {
            return res.status(400).json({ message: "O nome do projeto é obrigatório" });
        }

        const domain = await generateUniqueDomain(name);

        if (!domain) {
            return res.status(500).json({ message: "Não foi possível gerar um domínio único" });
        }

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                message: "O valor do pagamento é inválido"
            });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                workspaceId,
                userId: existUser.id,
                domain: domain as string,
                environments: environments || [],
            }
        });

        const payment = await prisma.payment.create({
            data: {
                userId: existUser.id,
                amount: amount,
                time_in_day: time_in_day || 0,
                status: 'pending',
                type_payment: 'monthly',
                qty_months: 1,
                projectId: project.id
            }
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({
            message: "Failed to create project",
            error: (error as Error).message
        });
    }
};

export const getProject = async (req: Request | any, res: Response) => {
    const { projectId } = req.params;
    const userId = req.userId;

    if (!validate(projectId) || !validate(userId)) {
        return res.status(400).json({ message: "ID inválido" });
    }
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" });
        }

        const userWorkspace = await prisma.user_workspace.findFirst({
            where: {
                userId,
                workspaceId: project.workspaceId
            }
        });

        if (!userWorkspace) {
            return res.status(403).json({ message: "Você não tem acesso a este projeto" });
        }
        return res.status(200).json(project);
    } catch (error) {
        return res.status(500).json({ message: "erro ao buscar projeto" });
    }
};

export const getMyProjects = async (req: Request | any, res: Response) => {
    const userId = req.userId; // Supondo que o ID do usuário logado esteja disponível em req.userId
    const workspaceId = req.params.workspaceId;
    try {
        const projects = await prisma.project.findMany({
            where: { userId, workspaceId },
        });

        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve projects" });
    }
};

export const updateProject = async (req: Request | any, res: Response) => {
    const { projectId } = req.params;
    const { name, description, environments } = req.body;
    const userId = req.userId;

    if (!validate(projectId) || !validate(userId)) {
        return res.status(400).json({ message: "ID inválido" });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" });
        }

        if (project.userId !== userId) {
            return res.status(403).json({ message: "Você não tem permissão para atualizar este projeto" });
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                name: name || project.name,
                description: description || project.description,
                environments: environments || project.environments,
            },
        });

        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ error: "Failed to update project" });
    }
};

export const deleteProject = async (req: Request | any, res: Response) => {
    const { projectId } = req.params;
    const userId = req.userId;

    if (!validate(projectId) || !validate(userId)) {
        return res.status(400).json({ message: "ID inválido" });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" });
        }

        if (project.userId !== userId) {
            return res.status(403).json({ message: "Você não tem permissão para deletar este projeto" });
        }

        await prisma.payment.deleteMany({
            where: { projectId: projectId },
        });

        await prisma.project.delete({
            where: { id: projectId },
        });

        res.status(200).json({ message: "Projeto deletado com sucesso" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete project",
            error: (error as Error).message
        });
    }
};

export const GetPendingProjectsPayments = async (req: Request | any, res: Response) => {
    const userId = req.userId;
    let status = req.query.status || 'pending';


    if (status !== 'pending' && status !== 'completed' && status !== 'failed') {
        status = 'pending';
    }

    try {
        const payments = await prisma.payment.findMany({
            where: {
                userId: userId,
                status: status
            },
            include: {
                project: true
            }
        });

        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve pending payments" });
    }
};
