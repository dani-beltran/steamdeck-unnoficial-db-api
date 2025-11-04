import { getDB } from "../config/database";
import type { GameQueue, InputGameQueue } from "../schemas/game-queue.schema";

const collection = "game-queue";

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
};

export const getGameToScrapeFromQueue = async () => {
	const db = getDB();
	return await db.collection<GameQueue>(collection).findOne(
		{
			rescrape: true,
			rescrape_failed: { $ne: true },
		},
		{ sort: { queued_at: 1 } },
	);
};

export const getGameToGenerateFromQueue = async () => {
	const db = getDB();
	return await db.collection<GameQueue>(collection).findOne(
		{
			rescrape: { $ne: true },
			regenerate: true,
			regenerate_failed: { $ne: true },
		},
		{ sort: { queued_at: 1 } },
	);
};

export const removeGameFromQueue = async (game_id: number) => {
	const db = getDB();
	await db.collection<GameQueue>(collection).deleteOne({ game_id });
	return;
};

export const createGameQueueIndexes = async () => {
	const db = getDB();

	// Create unique index on game_id (primary key)
	await db
		.collection<GameQueue>(collection)
		.createIndex({ game_id: 1 }, { unique: true });

	// Create compound index for rescrape queries sorted by queued_at
	await db
		.collection<GameQueue>(collection)
		.createIndex({ rescrape: 1, queued_at: 1 });

	// Create compound index for regenerate queries sorted by queued_at
	await db
		.collection<GameQueue>(collection)
		.createIndex({ regenerate: 1, queued_at: 1 });
};
