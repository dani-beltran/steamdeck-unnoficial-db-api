import { z } from "zod";
import { gameIdSchema } from "./game-id.schema";

export enum STEAMDECK_RATING {
	GOLD = "gold",
	PLATINUM = "platinum",
	NATIVE = "native",
	UNSUPPORTED = "unsupported",
}

export enum STEAMDECK_HARDWARE {
	OLED = "oled",
	LCD = "lcd",
}

// Schema for game ID parameter validation
export const gameIdParamSchema = z.object({
	id: gameIdSchema,
});

// Schema for Steam search term validation
export const steamSearchTermSchema = z.object({
	term: z.string().min(1, "Search term is required"),
	limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const gameSchema = z.object({
	game_id: gameIdSchema,
	game_name: z.string().min(1, "Name is required"),
	game_performance_summary: z.string().optional(),
	game_review_summary: z.string().optional(),
	steamdeck_rating: z.enum(STEAMDECK_RATING).optional(),
	steamdeck_verified: z.boolean().optional(),
	settings: z
		.array(
			z.object({
				game_settings: z.record(z.string(), z.string().optional().nullable()).optional().nullable(),
				steamdeck_settings: z.record(z.string(), z.string().optional().nullable()).optional().nullable(),
				steamdeck_hardware: z.enum(STEAMDECK_HARDWARE).optional().nullable(),
				battery_performance: z.record(z.string(), z.string().optional().nullable()).optional().nullable(),
				steamdeck_experience: z.record(z.string(), z.string().optional().nullable()).optional().nullable(),
				posted_at: z.date().nullable(),
			}),
		)
		.nullable()
		.optional(),
	rescrape_requested: z.boolean().optional(),
	regenerate_requested: z.boolean().optional(),
	updated_at: z.date(),
	created_at: z.date(),
});

export const gameInputSchema = gameSchema.omit({
	game_id: true,
	updated_at: true,
	created_at: true,
});

// Type exports
export type GameIdParams = z.infer<typeof gameIdParamSchema>;
export type Game = z.infer<typeof gameSchema>;
export type GameInput = z.infer<typeof gameInputSchema>;
