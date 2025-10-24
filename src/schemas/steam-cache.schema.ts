import { z } from "zod";
import type { SteamApp, SteamSearch } from "../services/steam/steam.types";

export const steamSearchCacheSchema = z.object({
	term: z.string(),
	limit: z.number(),
	data: z.custom<SteamSearch>(),
	created_at: z.date(),
	expires_at: z.date(),
});

export const steamGameDetailsCacheSchema = z.object({
	game_id: z.number(),
	data: z.custom<SteamApp>(),
	created_at: z.date(),
	expires_at: z.date(),
});

export type SteamSearchCache = z.infer<typeof steamSearchCacheSchema>;
export type SteamGameDetailsCache = z.infer<typeof steamGameDetailsCacheSchema>;
