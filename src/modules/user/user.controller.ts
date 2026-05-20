import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { validate } from "uuid";
import { q } from "../../utils/to_string";
import { generateUniqueUsername } from "../../utils/username";
import * as repo from "./user.repository";
import { fetchUserById } from "./user.service";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ message: "Email, nome e senha são obrigatórios" });
    }

    const username = await generateUniqueUsername(name);
    if (!username) {
      return res.status(400).json({ message: "O nome fornecido não é válido" });
    }

    const existing = await repo.findUserByEmailOrUsername(email, username);
    if (existing) {
      return res.status(400).json({ message: "Usuário com este email ou username já existe." });
    }

    const user = await repo.createUser({
      email,
      name,
      password: await bcrypt.hash(password, 10),
      username,
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = q(req.params.userId);
    const user = await fetchUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    res.status(200).json(user);
  } catch {
    res.status(500).json({ error: "Failed to retrieve user" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    if (username && typeof username !== "string") {
      return res.status(400).json({ message: "Username inválido" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const users = await repo.findAllUsers(username as string | undefined, page, limit);
    res.status(200).json(users);
  } catch {
    res.status(500).json({ error: "Failed to retrieve users" });
  }
};

export const UserLoged = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const user = await repo.findUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    res.status(200).json(user);
  } catch {
    res.status(500).json({ error: "Failed to retrieve logged-in user" });
  }
};

export const updateUser = async (req: Request | any, res: Response) => {
  try {
    const userId = req.userId;
    const { email, name } = req.body;

    const user = await fetchUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const updated = await repo.updateUser(user.id, {
      email: email || user.email,
      name: name || user.name,
    });

    res.status(200).json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update user" });
  }
};
