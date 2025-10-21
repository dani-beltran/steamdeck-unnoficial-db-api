import { getDB } from "../config/database";
import type { GameQueue, InputGameQueue } from "../schemas/game-queue.schema";

const collection = "game_queue";

export const setGameInQueue = async (game: InputGameQueue) => {
	const db = getDB();
	const utcNow = new Date(Date.now());
	await db.collection<GameQueue>(collection).updateOne(
		{ game_id: game.game_id },
		{
			$set: { ...game },
			$setOnInsert: { queued_at: utcNow },
		},
		{ upsert: true },
	);
	return;
};

export const setMultipleGamesInQueue = async (games: InputGameQueue[]) => {
	const db = getDB();
	const utcNow = new Date(Date.now());
	const bulkOps = games.map((game) => ({
		updateOne: {
			filter: { game_id: game.game_id },
			update: {
				$set: { ...game },
				$setOnInsert: { queued_at: utcNow },
			},
			upsert: true,
		},
	}));
	if (bulkOps.length > 0) {
		await db.collection<GameQueue>(collection).bulkWrite(bulkOps);
	}
	return;
}

export const getOneGameFromQueue = async (
	target: "rescrape" | "regenerate",
) => {
	const db = getDB();
	return await db.collection<GameQueue>(collection).findOne(
		{
			// if target is regenerate, rescrape must be false. So we only pick games that were already scraped
			rescrape: target !== "regenerate",
			[target]: true,
		},
		{ sort: { queued_at: 1 } },
	);
};

export const removeGameFromQueue = async (game_id: number) => {
	const db = getDB();
	await db.collection<GameQueue>(collection).deleteOne({ game_id });
	return;
};
