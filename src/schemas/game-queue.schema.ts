import z from "zod";
import { gameIdSchema } from "./game-id.schema";


export const gameQueueSchema = z.object({
  game_id: gameIdSchema,
  queued_at: z.date(), // old createdAt
  rescrape: z.boolean().optional(),
  regenerate: z.boolean().optional(),
});

export const inputGameQueueSchema = gameQueueSchema.omit({ queued_at: true });

export type GameQueue = z.infer<typeof gameQueueSchema>;
export type InputGameQueue = z.infer<typeof inputGameQueueSchema>;