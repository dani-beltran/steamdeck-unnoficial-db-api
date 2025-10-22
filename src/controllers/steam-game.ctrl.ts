import logger from "../config/logger";
import type { Request, Response } from "express";
import { searchSteamGames, getSteamGameDestails, getMostPlayedSteamDeckGameIds } from "../services/steam/steam";

export const searchSteamGamesCtrl = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const term = req.query.term as string;
		const limit = Number(req.query.limit);
		const data = await searchSteamGames(term, limit);
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
		const data = await getSteamGameDestails(gameId);
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
