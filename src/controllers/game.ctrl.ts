import type { Request, Response } from "express";
import logger from "../config/logger";
import { fetchGameById, saveGame } from "../models/game.model";
import { setGameInQueue } from "../models/game-queue.model";
import {
	getSteamGameDestails,
	searchSteamGames,
} from "../services/steam/steam";

export const getGameByIdCtrl = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const id = Number(req.params.id);
		const game = await fetchGameById(id);

		if (!game) {
			await setGameInQueue({ game_id: id, rescrape: true, regenerate: true });
			res.json({ status: "queued", game: null });
			return;
		}

		res.json({ status: "ready", game });
	} catch (error) {
		logger.error("Error fetching game:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

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
