import { getDB } from "../config/database";
import {
	type GameSettings,
	type GameSettingsInput,
	gameSettingsInputSchema,
} from "../schemas/game-settings.schema";

const collection = "game-settings";

// Fetch all settings for a specific game
export const fetchGameSettingsByGameId = async (gameId: number) => {
	const db = getDB();
	return db
		.collection<GameSettings>(collection)
		.find({ game_id: gameId })
		.sort({ posted_at: -1 })
		.toArray();
};

// Save multiple game settings entries for a game
export const saveGameSettingsBulk = async (
	gameId: number,
	settingsArray: Omit<GameSettingsInput, "game_id">[],
) => {
	if (settingsArray.length === 0) return;

	const validatedSettings = settingsArray.map((settings) =>
		gameSettingsInputSchema.parse({
			...settings,
			game_id: gameId,
		}),
	);

	const db = getDB();
	const settingsWithTimestamps = validatedSettings.map((settings) => ({
		...settings,
		updated_at: new Date(),
		created_at: new Date(),
	})) as GameSettings[];

	return db.collection<GameSettings>(collection).insertMany(settingsWithTimestamps);
};

// Delete all settings for a specific game (useful for regeneration)
export const deleteGameSettings = async (gameId: number) => {
	const db = getDB();
	return db.collection<GameSettings>(collection).deleteMany({ game_id: gameId });
};


// Create indexes for the game-settings collection
export const createGameSettingsIndexes = async () => {
	const db = getDB();

	// Create index on game_id (primary query field)
	await db.collection<GameSettings>(collection).createIndex({ game_id: 1 });

	// Create compound index for game_id and posted_at (for sorting)
	await db
		.collection<GameSettings>(collection)
		.createIndex({ game_id: 1, posted_at: -1 });

	// Create compound index for game_id and hardware type
	await db
		.collection<GameSettings>(collection)
		.createIndex({ game_id: 1, steamdeck_hardware: 1 });
};
