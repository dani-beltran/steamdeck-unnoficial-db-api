import { z } from 'zod';

// Schema for game ID parameter validation
export const gameIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const gameSchema = z.object({
  game_id: gameIdParamSchema.shape.id,
  game_name: z.string().min(1, 'Name is required'),
  game_performance_summary: z.string().optional(),
  game_review_summary: z.string().optional(),
  steamdeck_rating: z.enum(['gold', 'platinum', 'native', 'unsupported']).optional(),
  steamdeck_verified: z.boolean().optional(),
  settings: z.array(z.object({
    game_settings: z.record(z.string(), z.any()).optional(),
    steamdeck_settings: z.record(z.string(), z.any()).optional(),
    steamdeck_hardware: z.enum(['lcd', 'oled']).optional(),
    battery_performance: z.record(z.string(), z.any()).optional(),
    posted_at: z.date().optional(),
  })).nullable().optional(),
  updated_at: z.date(),
  created_at: z.date(),
});

// Type exports
export type GameIdParams = z.infer<typeof gameIdParamSchema>;
export type Game = z.infer<typeof gameSchema>;

