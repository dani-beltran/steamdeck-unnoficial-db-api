import z from "zod";

export const idSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, {
    message: "Invalid ID format",
});

export const idSchemaParam = z.object({
    id: idSchema,
});

export type Id = z.infer<typeof idSchema>;