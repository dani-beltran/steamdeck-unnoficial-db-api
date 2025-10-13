import z from "zod";
import { gameIdSchema } from "./game-schemas";


export const gameQueueSchema = z.object({
  game_id: gameIdSchema,
  queued_at: z.date(), // old createdAt
  rescrape: z.boolean().optional(),
  regenerate: z.boolean().optional(),
});

export type GameQueue = z.infer<typeof gameQueueSchema>;