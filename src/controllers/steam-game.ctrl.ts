import type { Request, Response } from "express";
import logger from "../config/logger";
import {
	getCachedGameDetails,
	getCachedGamesDetails,
	getCachedMostPlayedGames,
	getCachedSearchResults,
	saveGameDetailsCache,
	saveMostPlayedGamesCache,
	saveSearchResultsCache,
} from "../models/steam-cache.model";
import {
	getMostPlayedSteamDeckGameIds,
	getSteamGameDestails,
	searchSteamGames,
} from "../services/steam/steam";

export const searchSteamGamesCtrl = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const term = req.query.term as string;
		const limit = Number(req.query.limit);

		// Check cache first
		const cachedData = await getCachedSearchResults(term, limit);
		if (cachedData) {
			res.json(cachedData);
			return;
		}

		// Fetch from Steam API
		const data = await searchSteamGames(term, limit);

		// Save to cache
		await saveSearchResultsCache(term, limit, data);
		logger.info(`Cached search results for term: ${term}, limit: ${limit}`);

		res.json(data);
	} catch (error) {
		logger.error("Error searching Steam games:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getSteamGameDetailsCtrl = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const gameId = Number(req.params.id);

		// Check cache first
		const cachedData = await getCachedGameDetails(gameId);
		if (cachedData) {
			res.json(cachedData);
			return;
		}

		const data = await fetchAndCacheSteamGameDetails(gameId);

		res.json(data);
	} catch (error) {
		logger.error("Error fetching Steam game details:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMostPlayedSteamDeckGamesCtrl = async (
	_req: Request,
	res: Response,
): Promise<void> => {
	try {
		const LIMIT = 32;

		// Check cache first
		const cachedIds = await getCachedMostPlayedGames();
		if (cachedIds) {
			const games = await getManySteamGamesDetails(cachedIds.slice(0, LIMIT));
			res.json(games);
			return;
		}

		// Fetch from Steam API
		const ids = await getMostPlayedSteamDeckGameIds();

		// Save to cache
		await saveMostPlayedGamesCache(ids);
		logger.info(`Cached most played Steam Deck games: ${ids.length} games`);

		const games = await getManySteamGamesDetails(ids.slice(0, LIMIT));
		res.json(games);
	} catch (error) {
		logger.error("Error fetching most played Steam Deck games:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

const getManySteamGamesDetails = async (gameIds: number[]) => {
	const uniqueGameIds = Array.from(new Set(gameIds));
	const cachedGames = await getCachedGamesDetails(uniqueGameIds);
	const cachedGameIds = cachedGames.map((game) => game.steam_appid);
	const missingGameIds = uniqueGameIds.filter(
		(id) => !cachedGameIds.includes(id),
	);
	for (const gameId of missingGameIds) {
		const gameDetails = await fetchAndCacheSteamGameDetails(gameId).catch(
			(err) => {
				logger.error(`Error fetching details for game ID ${gameId}:`, err);
				return null;
			},
		);
		if (!gameDetails) continue;
		cachedGames.push(gameDetails);
	}
	// keep original order
	return uniqueGameIds
		.map((id) => cachedGames.find((game) => game.steam_appid === id))
		.filter((game) => game !== undefined);
};

const fetchAndCacheSteamGameDetails = async (gameId: number) => {
	const data = await getSteamGameDestails(gameId);
	await saveGameDetailsCache(gameId, data);
	logger.info(`Cached game details for game ID: ${gameId}`);
	return data;
};
