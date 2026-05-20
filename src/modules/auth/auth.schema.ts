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

export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SendCodeVerificationInput = z.infer<typeof sendCodeVerificationSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
