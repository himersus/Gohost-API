import z from "zod";

export const createPlanSchema = z.object({
    name: z.string().min(3, "O nome deve conter pelo menos 3 caracteres"),
    description: z.string().min(10, "A descrição deve conter pelo menos 10 caracteres"),
    price: z.number().positive("O preço deve ser positivo"),
    duration: z.number().int().positive(),
    max_projects: z.number().int().positive(),
    duration_description: z.string().optional(),
    features: z.array(z.string()).optional(),
    shortcut: z.string().optional()
});

export const updatePlanSchema = z.object({
    name: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    duration: z.number().int().positive().optional(),
    max_projects: z.number().int().positive().optional(),
    duration_description: z.string().optional(),
    features: z.array(z.string()).optional(),
    shortcut: z.string().optional()
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
