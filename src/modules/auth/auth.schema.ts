import z from "zod";

export const loginUserSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
});

export const sendCodeVerificationSchema = z.object({
    email: z.string().email("Email inválido"),
});

export const verifyCodeSchema = z.object({
    email: z.string().email("Email inválido"),
    code: z.string().length(6, "O código deve conter exatamente 6 caracteres"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SendCodeVerificationInput = z.infer<typeof sendCodeVerificationSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
