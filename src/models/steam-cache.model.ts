import { getDB } from "../config/database";
import type {
	SteamGameDetailsCache,
	SteamSearchCache,
	SteamDeckMostPlayedCache,
} from "../schemas/steam-cache.schema";
import type { SteamApp, SteamSearch } from "../services/steam/steam.types";

const SEARCH_CACHE_COLLECTION = "steam_search_cache";
const DETAILS_CACHE_COLLECTION = "steam_details_cache";
const MOST_PLAYED_CACHE_COLLECTION = "steam_deck_most_played_cache";

// Cache duration: 1 month (30 days)
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Get cached search results
 */
export const getCachedSearchResults = async (term: string, limit: number) => {
	const db = getDB();
	const now = new Date();

	const cached = await db
		.collection<SteamSearchCache>(SEARCH_CACHE_COLLECTION)
		.findOne({
			term,
			limit,
			expires_at: { $gt: now },
		});

	return cached?.data || null;
};

/**
 * Save search results to cache
 */
export const saveSearchResultsCache = async (
	term: string,
	limit: number,
	data: SteamSearch,
) => {
	const db = getDB();
	const now = new Date();
	const expires_at = new Date(now.getTime() + CACHE_DURATION_MS);

	await db.collection<SteamSearchCache>(SEARCH_CACHE_COLLECTION).updateOne(
		{ term, limit },
		{
			$set: {
				data,
				created_at: now,
				expires_at,
			},
		},
		{ upsert: true },
	);
};

/**
 * Get cached game details
 */
export const getCachedGameDetails = async (gameId: number) => {
	const db = getDB();
	const now = new Date();

	const cached = await db
		.collection<SteamGameDetailsCache>(DETAILS_CACHE_COLLECTION)
		.findOne({
			game_id: gameId,
			expires_at: { $gt: now },
		});

	return cached?.data || null;
};

export const getCachedGamesDetails = async (gameIds: number[]) => {
	const db = getDB();
	const now = new Date();

	const cachedCursor = await db
		.collection<SteamGameDetailsCache>(DETAILS_CACHE_COLLECTION)
		.find({
			game_id: { $in: gameIds },
			expires_at: { $gt: now },
		});
	return (await cachedCursor.toArray()).map((doc) => doc.data);
}

/**
 * Save game details to cache
 */
export const saveGameDetailsCache = async (gameId: number, data: SteamApp) => {
	const db = getDB();
	const now = new Date();
	const expires_at = new Date(now.getTime() + CACHE_DURATION_MS);

	await db
		.collection<SteamGameDetailsCache>(DETAILS_CACHE_COLLECTION)
		.updateOne(
			{ game_id: gameId },
			{
				$set: {
					data,
					created_at: now,
					expires_at,
				},
			},
			{ upsert: true },
		);
};

/**
 * Get cached Steam Deck most played games
 */
export const getCachedMostPlayedGames = async () => {
	const db = getDB();
	const now = new Date();

	const cached = await db
		.collection<SteamDeckMostPlayedCache>(MOST_PLAYED_CACHE_COLLECTION)
		.findOne({
			expires_at: { $gt: now },
		});

	return cached?.game_ids || null;
};

/**
 * Save Steam Deck most played games to cache
 */
export const saveMostPlayedGamesCache = async (gameIds: number[]) => {
	const db = getDB();
	const now = new Date();
	const expires_at = new Date(now.getTime() + CACHE_DURATION_MS);

	await db
		.collection<SteamDeckMostPlayedCache>(MOST_PLAYED_CACHE_COLLECTION)
		.updateOne(
			{},
			{
				$set: {
					game_ids: gameIds,
					created_at: now,
					expires_at,
				},
			},
			{ upsert: true },
		);
};

/**
 * Create indexes for cache collections (call this on app startup)
 */
export const createCacheIndexes = async () => {
	const db = getDB();

	// Create TTL index on search cache
	await db
		.collection<SteamSearchCache>(SEARCH_CACHE_COLLECTION)
		.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

	// Create compound index for search queries
	await db
		.collection<SteamSearchCache>(SEARCH_CACHE_COLLECTION)
		.createIndex({ term: 1, limit: 1 });

	// Create TTL index on details cache
	await db
		.collection<SteamGameDetailsCache>(DETAILS_CACHE_COLLECTION)
		.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

	// Create index on game_id
	await db
		.collection<SteamGameDetailsCache>(DETAILS_CACHE_COLLECTION)
		.createIndex({ game_id: 1 });

	// Create TTL index on most played cache
	await db
		.collection<SteamDeckMostPlayedCache>(MOST_PLAYED_CACHE_COLLECTION)
		.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
};
