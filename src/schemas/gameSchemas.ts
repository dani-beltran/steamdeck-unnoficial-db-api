import { z } from 'zod';

// Schema for game ID parameter validation
export const gameIdParamSchema = z.object({
  id: z.number().int().positive('ID must be a positive integer'),
});

export const gameSchema = z.object({
  id: gameIdParamSchema.shape.id,
  name: z.string().min(1, 'Name is required'),
  settings: z.any().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Type exports
export type GameIdParams = z.infer<typeof gameIdParamSchema>;
export type Game = z.infer<typeof gameSchema>;

