import z from "zod";
import { typePayment } from "@prisma/client";

export const createProjectSchema = z.object({
  name: z.string().min(3, "O nome deve conter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve conter pelo menos 10 caracteres"),
  branch: z.string().min(3, "A branch deve conter pelo menos 3 caracteres"),
  port: z.number().int().positive("A porta deve ser um número positivo"),
  period_duration: z.number().int().positive().optional(),
  repo_url: z.string().url("URL do repositório inválida"),
  environments: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  default_plan: z.string().min(3, "O plano padrão deve conter pelo menos 3 caracteres"),
  default_type_payment: z.enum(typePayment).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  branch: z.string().min(3).optional(),
  port: z.number().int().positive().optional(),
  period_duration: z.number().int().positive().optional(),
  environments: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});

export const saveEnvSchema = z.object({
  environments: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SaveEnvInput = z.infer<typeof saveEnvSchema>;
