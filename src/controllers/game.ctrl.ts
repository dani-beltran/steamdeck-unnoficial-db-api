import type { Request, Response } from "express";
import z from "zod";
import { getDB } from "../config/database";
import logger from "../config/logger";
import { fetchGameById } from "../models/game.model";
import { setGameInQueue } from "../models/game-queue.model";
import { fetchGameReportsByGameId } from "../models/game-report.model";
import {
	addVoteToGameSettings,
	removeVoteFromGameSettings,
} from "../models/game-settings.model";
import { voteGamePerformanceSummary } from "../models/game-summary-vote.mode";
import { getCachedGameDetails } from "../models/steam-cache.model";
import {
	fetchUserById,
	removeUserVote,
	setUserVote,
} from "../models/user.model";
import { gameIdParamSchema } from "../schemas/game.schema";
import { saveGameSummaryVoteSchema } from "../schemas/game-summary-vote.schema";
import type { VoteBody } from "../schemas/vote.schema";
import type { SteamProfile } from "../services/steam/steam.types";
import { fetchAndCacheSteamGameDetails } from "./steam-game.ctrl";

export const getGameByIdCtrl = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const id = Number(req.params.id);
		const game = await fetchGameById(id);
		const cachedGame = await getCachedGameDetails(id);
		const steamApp = cachedGame
			? cachedGame
			: await fetchAndCacheSteamGameDetails(id);

		if (!game) {
			await setGameInQueue({ game_id: id, rescrape: true, regenerate: true });
			res.json({
				status: "queued",
				game: {
					game_id: id,
					steam_app: steamApp,
				},
			});
			return;
		}

		// Fetch game reports separately
		const reports = await fetchGameReportsByGameId(id);

		res.json({
			status: "ready",
			game: { ...game, reports, steam_app: steamApp },
		});
	} catch (error) {
		logger.error("Error fetching game:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const voteGameCtrl = async (req: Request, res: Response) => {
	const session = getDB().client.startSession();
	try {
		if (!req.isAuthenticated() && !req.user) {
			return res.status(401).json({ error: "Authentication required to vote" });
		}

		const gameSettingId = String(req.params.id);
		const { vote } = req.body as VoteBody;

		const user = await fetchUserById(Number((req.user as SteamProfile).id));

		if (!user) {
			return res.status(401).json({ error: "User not found" });
		}

		await session.withTransaction(async () => {
			const res = await setUserVote(user.steam_user_id, gameSettingId, vote);
			if (res.voteCreated) {
				await addVoteToGameSettings(gameSettingId, vote);
			} else if (res.voteChanged) {
				const oppositeVote = vote === "up" ? "down" : "up";
				await addVoteToGameSettings(gameSettingId, vote);
				await removeVoteFromGameSettings(gameSettingId, oppositeVote);
			}
		});
		res.json({
			message: `Vote '${vote}' recorded for game ID ${gameSettingId}`,
		});
	} catch (error) {
		logger.error("Error processing vote:", error);
		res.status(500).json({ error: "Internal server error" });
	} finally {
		await session.endSession();
	}
};

export const removeVoteFromGameCtrl = async (req: Request, res: Response) => {
	const session = getDB().client.startSession();
	try {
		if (!req.isAuthenticated() && !req.user) {
			return res
				.status(401)
				.json({ error: "Authentication required to remove vote" });
		}

		const gameSettingsId = String(req.params.id);
		const user = await fetchUserById(Number((req.user as SteamProfile).id));

		if (!user) {
			return res.status(401).json({ error: "User not found" });
		}

		const existingVote = user.votes.find(
			(v) => v.game_settings_id === gameSettingsId,
		);
		if (!existingVote || existingVote?.vote_type === null) {
			return res
				.status(400)
				.json({ error: "No existing vote to remove for this game" });
		}

		await session.withTransaction(async () => {
			const { voteRemoved } = await removeUserVote(
				user.steam_user_id,
				gameSettingsId,
			);
			if (voteRemoved) {
				await removeVoteFromGameSettings(
					gameSettingsId,
					// biome-ignore lint/style/noNonNullAssertion: it is already checked that is not null above
					existingVote.vote_type!,
				);
			}
		});
		res.json({ message: `Vote removed for game ID ${gameSettingsId}` });
	} catch (error) {
		logger.error("Error removing vote:", error);
		res.status(500).json({ error: "Internal server error" });
	} finally {
		await session.endSession();
	}
};

export const voteGameSummaryCtrl = async (req: Request, res: Response) => {
	try {
		const { id } = gameIdParamSchema.parse(req.params);
		const { vote_type } = saveGameSummaryVoteSchema.parse(req.body);

		await voteGamePerformanceSummary(id, req.session.id, vote_type);

		res.json({ message: `Vote '${vote_type}' recorded for game ID ${id}` });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		logger.error("Error processing game summary vote:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
