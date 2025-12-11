import { z } from "zod";
import { STEAMDECK_HARDWARE } from "./game.schema";
import { gameIdSchema } from "./game-id.schema";
import { SCRAPE_SOURCES } from "./scrape.schema";
import { VOTE_TYPE } from "./vote.schema";

// Schema for a single game settings entry
export const gameSettingsSchema = z.object({
	game_id: gameIdSchema,
	game_settings: z
		.record(z.string(), z.string().optional().nullable())
		.optional()
		.nullable(),
	steamdeck_settings: z
		.record(z.string(), z.string().optional().nullable())
		.optional()
		.nullable(),
	steamdeck_hardware: z.enum(STEAMDECK_HARDWARE).optional().nullable(),
	battery_performance: z
		.record(z.string(), z.string().optional().nullable())
		.optional()
		.nullable(),
	steamdeck_experience: z
		.record(z.string(), z.string().optional().nullable())
		.optional()
		.nullable(),
	source: z.enum(SCRAPE_SOURCES),
	posted_at: z.date().nullable(),
	thumbs_up: z.number().int().nonnegative().optional().default(0),
	thumbs_down: z.number().int().nonnegative().optional().default(0),
	updated_at: z.date(),
	created_at: z.date(),
});

export const gameVoteSchema = z.object({
	vote: z.enum(VOTE_TYPE),
});

// Input schema for creating/updating game settings (without timestamps)
export const gameSettingsInputSchema = gameSettingsSchema.omit({
	updated_at: true,
	created_at: true,
});

// Type exports
export type GameSettings = z.infer<typeof gameSettingsSchema>;
export type GameSettingsInput = z.input<typeof gameSettingsInputSchema>;
