
import axios from "axios";
import { Request, Response } from "express";
import CryptoJS from 'crypto-js';
import { validate } from "uuid";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserRepos = async (req: Request | any, res: Response) => {
    const userId = req.userId;

    if (!userId || !validate(userId)) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const existUser = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!existUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const encrypted = existUser.github_token;

    if (!encrypted) {
        return res.status(404).json({ message: "Token do GitHub não encontrado, faça login com o github" });
    }

    const bytes = CryptoJS.AES.decrypt(encrypted, process.env.TOKEN_SECRET!);
    const token = bytes.toString(CryptoJS.enc.Utf8);

    if (!token) {
        return res.status(401).json({ message: "Token não fornecido" });
    }

    try {
        const response = await axios.get("https://api.github.com/user/repos", {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json"
            }
        });

        if (response.status !== 200) {
            return res.status(response.status).json({ message: "Erro ao buscar repositórios" });
        }

        return res.json(response.data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar repositórios" });
    }
};


