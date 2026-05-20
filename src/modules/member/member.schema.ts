import z from "zod";

export const addMemberSchema = z.object({
    username: z.string(),
    projectId: z.string(),
    role: z.enum(["master", "admin", "member"]),
});

export const removeMemberSchema = z.object({
    username: z.string(),
    projectId: z.string(),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
