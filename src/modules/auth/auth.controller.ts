import "dotenv/config";
import { Request, Response } from "express";
import * as service from "./auth.service";
import { sendEmail } from "../../middleware/sendemail";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const token = await service.loginUser(username, password);
    res.status(200).json({ token });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "O login falhou" });
  }
};

export const sendCodeVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const code = await service.sendVerificationCode(email);
    await sendEmail(
      email,
      "Código de Verificação - Drenoday",
      "Código de Verificação",
      code,
      `Seu código de verificação é: <strong>${code}</strong>.`,
    );
    res.status(200).json({ message: "Código de verificação enviado para o e-mail." });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Falha ao enviar o código de verificação." });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    await service.verifyEmailCode(email, code);
    res.status(200).json({ message: "E-mail verificado com sucesso." });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Falha ao verificar o código." });
  }
};

export const loginWithEmail = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const token = await service.loginWithEmailCode(email, code);
    res.status(200).json({ token });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Falha ao verificar o código." });
  }
};

export const loginGitHub = async (req: Request | any, res: Response) => {
  try {
    const user: any = req.user;
    const token = user.token;
    const create = user.create || "false";

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Usuário não encontrado.`);
    }

    const result = await service.handleGithubLogin(user, token, create);

    if (result.redirect) {
      return res.redirect(result.redirect);
    }

    const { jwtToken, encryptedToken, github_username, github_user_id } = result as any;

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 24 * 60 * 60 * 1000,
    };

    res.cookie("auth_token", jwtToken, cookieOpts);
    res.cookie("github_token", encryptedToken, cookieOpts);
    res.cookie("github_username", github_username, cookieOpts);
    res.cookie("github_user_id", github_user_id, cookieOpts);

    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/github?token=${jwtToken}&github_token=${encryptedToken}&github_username=${github_username}&github_user_id=${github_user_id}`,
    );
  } catch {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Erro ao autenticar com GitHub`);
  }
};

export const loginGoogle = async (req: Request | any, res: Response) => {
  try {
    const userProfile: any = req.user;
    const state = JSON.parse(req.query.state || "{}");
    const create = state.create || "true";

    if (!userProfile) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Usuário não encontrado.`);
    }

    const token = await service.handleGoogleLogin(userProfile, create);
    return res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  } catch {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Erro ao autenticar com Google`);
  }
};
