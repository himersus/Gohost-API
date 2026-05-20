import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { encryptToken } from "../../utils/crypt";
import { generateUniqueUsername } from "../../utils/username";
import * as repo from "./auth.repository";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function loginUser(username: string, password: string) {
  const user = await repo.findUserByLogin(username);
  if (!user || !password) {
    throw { status: 401, message: "Usuário ou senha inválida" };
  }

  const isValid = await bcrypt.compare(password, user.password || "");
  if (!isValid) {
    throw { status: 401, message: "Usuário ou senha inválida" };
  }

  const payload = {
    id: user.id,
    is_active: user.is_active,
    username: user.username,
    email: user.email,
    roleUser: user.roleUser,
    provider: user.provider,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export async function sendVerificationCode(email: string) {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    throw { status: 404, message: "Usuário não encontrado" };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = await bcrypt.hash(code, 10);

  await repo.updateUserConfirmCode(email, hashed);

  return code;
}

export async function verifyEmailCode(email: string, code: string) {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    throw { status: 404, message: "Usuário não encontrado" };
  }

  const isValid = await bcrypt.compare(code, user.confirm_code || "");
  if (!isValid) {
    throw { status: 400, message: "Código de verificação inválido" };
  }

  await repo.activateUser(email);
}

export async function loginWithEmailCode(email: string, code: string) {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    throw { status: 404, message: "Usuário não encontrado" };
  }

  const isValid = await bcrypt.compare(code, user.confirm_code || "");
  if (!isValid) {
    throw { status: 400, message: "Código de verificação inválido" };
  }

  await repo.activateUser(email);

  const payload = {
    id: user.id,
    is_active: user.is_active,
    username: user.username,
    email: user.email,
    roleUser: user.roleUser,
    provider: user.provider,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export async function handleGithubLogin(
  githubUser: any,
  token: string,
  create: string,
) {
  const email = githubUser.email;
  const encryptedToken = encryptToken(token);

  let user = await repo.findUserByEmail(email);

  if (!user && create === "false") {
    return { redirect: `${process.env.FRONTEND_URL}/auth/error?message=Usuário não encontrado. Por favor, registre-se primeiro.&create=${create}` };
  }

  if (!user && create === "true") {
    const username = await generateUniqueUsername(githubUser.username, true);
    user = await repo.createUser({
      name: githubUser.username,
      username: username || `${githubUser.username}${Math.floor(1000 + Math.random() * 9000)}`,
      email,
      provider: "github",
      password: null,
      is_active: true,
      github_username: githubUser.username,
      github_token: encryptedToken,
      github_id: githubUser.id,
    });
  }

  if (!user) {
    return { redirect: `${process.env.FRONTEND_URL}/auth/error?message=Usuário não encontrado. Por favor, registre-se primeiro.` };
  }

  await repo.updateUserGithub(user.id, {
    github_username: githubUser.username,
    github_token: encryptedToken,
    github_id: githubUser.id,
  });

  const payload = {
    id: user.id,
    is_active: user.is_active,
    username: user.username,
    email: user.email,
    roleUser: user.roleUser,
    provider: "github",
  };

  const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

  return {
    jwtToken,
    encryptedToken,
    github_username: githubUser.username,
    github_user_id: githubUser.id,
  };
}

export async function handleGoogleLogin(userProfile: any, create: string) {
  const email = userProfile.emails[0].value || userProfile.email;
  const name = userProfile.displayName || email.split("@")[0];

  let user = await repo.findUserByEmail(email);

  if (!user && create === "false") {
    return { redirect: `${process.env.FRONTEND_URL}/auth/error?message=Usuário não encontrado.&create=${create}` };
  }

  if (!user && create === "true") {
    const username = await generateUniqueUsername(name);
    user = await repo.createUser({
      name,
      username: username || `${email.split("@")[0]}${Math.floor(1000 + Math.random() * 9000)}`,
      email,
      provider: "google",
      password: Math.random().toString(36).slice(-8),
      is_active: true,
    });
  }

  const payload = {
    id: user!.id,
    is_active: user!.is_active,
    username: user!.username,
    email: user!.email,
    provider: "google",
    roleUser: user!.roleUser,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}
