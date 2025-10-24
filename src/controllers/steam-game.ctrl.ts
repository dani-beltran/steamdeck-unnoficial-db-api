import logger from "../config/logger";
import type { Request, Response } from "express";
import { searchSteamGames, getSteamGameDestails, getMostPlayedSteamDeckGameIds } from "../services/steam/steam";
import { 
	getCachedSearchResults, 
	saveSearchResultsCache,
	getCachedGameDetails,
	saveGameDetailsCache
} from "../models/steam-cache.model";

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
		
		// Fetch from Steam API
		const data = await getSteamGameDestails(gameId);
		
		// Save to cache
		await saveGameDetailsCache(gameId, data);
		logger.info(`Cached game details for game ID: ${gameId}`);
		
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
        const ids = await getMostPlayedSteamDeckGameIds();
        // TODO: fetch game details for these ids
        // but first cache the results to avoid hitting Steam API limits
        res.json({ games: "TODO" });
    } catch (error) {
        logger.error("Error fetching most played Steam Deck games:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
