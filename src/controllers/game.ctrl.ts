import type { Request, Response } from "express";
import logger from "../config/logger";
import { fetchGameById } from "../models/game.model";
import { setGameInQueue } from "../models/game-queue.model";

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
