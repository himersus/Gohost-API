import z from "zod";

export const createUserSchema = z.object({
    name: z.string().min(3, "O nome deve conter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve conter pelo menos 6 caracteres"),
});

export const updateUserSchema = z.object({
    name: z.string().min(3, "O nome deve conter pelo menos 3 caracteres").optional(),
    email: z.string().email("Email inválido").optional(),
    password: z.string().min(6, "A senha deve conter pelo menos 6 caracteres").optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
