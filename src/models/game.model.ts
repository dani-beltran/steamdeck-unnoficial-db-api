import { getDB } from "../config/database";
import {
	type Game,
	type GameInput,
	gameInputSchema,
} from "../schemas/game.schema";

const collection = "games";

export const fetchGameById = async (id: number) => {
	const db = getDB();
	return await db.collection<Game>(collection).findOne({ game_id: id });
};

type FindGamesArgs = {
	regenerateRequested?: boolean;
	rescrapeRequested?: boolean;
};

export const findGames = async (filter: FindGamesArgs) => {
	const db = getDB();
	return await db
		.collection<Game>(collection)
		.find({
			regenerate_requested: filter.regenerateRequested,
			rescrape_requested: filter.rescrapeRequested,
		})
		.sort("updated_at", "asc")
		.toArray();
};

export const saveGame = async (id: number, game: GameInput) => {
	const validatedGame: GameInput = gameInputSchema.parse(game);
	const db = getDB();
	await db.collection<Game>(collection).updateOne(
		{ game_id: id },
		{
			$set: {
				...validatedGame,
				updated_at: new Date(),
			},
			$setOnInsert: {
				created_at: new Date(),
			},
		},
		{ upsert: true },
	);
};

export const saveGamesBulk = async (
	games: { id: number; data: GameInput }[],
) => {
	const db = getDB();
	const bulkOps = games.map(({ id, data }) => {
		const validatedGame: GameInput = gameInputSchema.parse(data);
		return {
			updateOne: {
				filter: { game_id: id },
				update: {
					$set: {
						...validatedGame,
						updated_at: new Date(),
					},
					$setOnInsert: {
						created_at: new Date(),
					},
				},
				upsert: true,
			},
		};
	});
	if (bulkOps.length > 0) {
		await db.collection<Game>(collection).bulkWrite(bulkOps);
	}
};

export const createGameIndexes = async () => {
	const db = getDB();

	// Create unique index on game_id (primary key)
	await db
		.collection<Game>(collection)
		.createIndex({ game_id: 1 }, { unique: true });

	// Create index for regenerate_requested queries
	await db
		.collection<Game>(collection)
		.createIndex({ regenerate_requested: 1 });

	// Create index for rescrape_requested queries
	await db.collection<Game>(collection).createIndex({ rescrape_requested: 1 });

	// Create index for updated_at (useful for sorting)
	await db.collection<Game>(collection).createIndex({ updated_at: -1 });
};
