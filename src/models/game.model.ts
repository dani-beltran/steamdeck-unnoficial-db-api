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

export const findGames = async (filter: Partial<Game>) => {
	const db = getDB();
	return await db.collection<Game>(collection).find(filter).toArray();
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
