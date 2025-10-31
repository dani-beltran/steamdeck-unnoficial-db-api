import type { Request, Response } from "express";
import { getDB } from "../config/database";
import logger from "../config/logger";
import {
	addVoteToGame,
	fetchGameById,
	removeVoteFromGame,
} from "../models/game.model";
import { setGameInQueue } from "../models/game-queue.model";
import { fetchUserById, removeUserVote, setUserVote } from "../models/user.model";
import type { VoteBody } from "../schemas/vote.schema";
import type { SteamProfile } from "../services/steam/steam.types";

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

export const voteGameCtrl = async (req: Request, res: Response) => {
	const session = getDB().client.startSession();
	try {
		if (!req.isAuthenticated() && !req.user) {
			return res.status(401).json({ error: "Authentication required to vote" });
		}

		const gameId = Number(req.params.id);
		const { vote } = req.body as VoteBody;

		const user = await fetchUserById(Number((req.user as SteamProfile).id));

		if (!user) {
			return res.status(401).json({ error: "User not found" });
		}

		await session.withTransaction(async () => {
			const res = await setUserVote(user.steam_user_id, gameId, vote);
			if (res.voteCreated) {
				await addVoteToGame(gameId, vote);
			} else if (res.voteChanged) {
				const oppositeVote = vote === "up" ? "down" : "up";
				await addVoteToGame(gameId, vote);
				await removeVoteFromGame(gameId, oppositeVote);
			}
		});
		res.json({ message: `Vote '${vote}' recorded for game ID ${gameId}` });
	} catch (error) {
		logger.error("Error processing vote:", error);
		res.status(500).json({ error: "Internal server error" });
	} finally {
		session.endSession();
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

		const gameId = Number(req.params.id);

		const user = await fetchUserById(Number((req.user as SteamProfile).id));

		if (!user) {
			return res.status(401).json({ error: "User not found" });
		}

		const existingVote = user.votes.find((v) => v.game_id === gameId);
		if (!existingVote || existingVote?.vote_type === null) {
			return res
				.status(400)
				.json({ error: "No existing vote to remove for this game" });
		}

		await session.withTransaction(async () => {
			const { voteRemoved } = await removeUserVote(
				user.steam_user_id,
				gameId,
			);
			if (voteRemoved) {
				// biome-ignore lint/style/noNonNullAssertion: it is already checked that is not null above
				await removeVoteFromGame(gameId, existingVote.vote_type!);
			}
		});
		res.json({ message: `Vote removed for game ID ${gameId}` });
	} catch (error) {
		logger.error("Error removing vote:", error);
		res.status(500).json({ error: "Internal server error" });
	} finally {
		session.endSession();
	}
};
