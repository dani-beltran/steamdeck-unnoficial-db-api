import { z } from "zod";
import type { SteamApp } from "../services/steam/steam.types";
import { gameIdSchema } from "./game-id.schema";

export enum STEAMDECK_RATING {
	GOLD = "gold",
	PLATINUM = "platinum",
	NATIVE = "native",
	UNSUPPORTED = "unsupported",
	BORKED = "borked",
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

export const gameIdsQuerySchema = z.object({
	ids: z
		.string()
		.min(1, "At least one game ID is required")
		.transform((val) => val.split(",").map((id) => Number(id))),
});

// Schema for pagination parameters
export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional().default(1),
	pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const gameSchema = z.object({
	game_id: gameIdSchema,
	steam_app: z.custom<SteamApp>().optional(),
	game_performance_summary: z.string().optional().nullable(),
	steamdeck_rating: z.enum(STEAMDECK_RATING).optional().nullable(),
	steamdeck_verified: z.boolean().optional().nullable(),
	rescrape_requested: z.boolean().optional(),
	regenerate_requested: z.boolean().optional(),
	generated_at: z.date().optional(),
	updated_at: z.date(),
	created_at: z.date(),
});

export const gameInputSchema = gameSchema.omit({
	game_id: true,
	generated_at: true,
	updated_at: true,
	created_at: true,
});

// Type exports
export type GameIdParams = z.infer<typeof gameIdParamSchema>;
export type Game = z.infer<typeof gameSchema>;
export type GameInput = z.infer<typeof gameInputSchema>;
