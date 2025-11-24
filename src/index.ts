import app from "./app";
import { connectDB } from "./config/database";
import { PORT } from "./config/env";
import logger from "./config/logger";
import { createGameIndexes } from "./models/game.model";
import { createGameQueueIndexes } from "./models/game-queue.model";
import { createGameSettingsIndexes } from "./models/game-settings.model";
import { createScrapeIndexes } from "./models/scrape.model";
import { createCacheIndexes } from "./models/steam-cache.model";

// Start server
const startServer = async () => {
	try {
		await connectDB();
		await createIndexes();

		app.listen(PORT, () => {
			logger.info(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
};

const createIndexes = async () => {
	logger.info("Creating cache indexes...");
	await createCacheIndexes();
	logger.info("Cache indexes created successfully");

	logger.info("Creating game queue indexes...");
	await createGameQueueIndexes();
	logger.info("Game queue indexes created successfully");

	logger.info("Creating game indexes...");
	await createGameIndexes();
	logger.info("Game indexes created successfully");

	logger.info("Creating game settings indexes...");
	await createGameSettingsIndexes();
	logger.info("Game settings indexes created successfully");

	logger.info("Creating scrape indexes...");
	await createScrapeIndexes();
	logger.info("Scrape indexes created successfully");
};

startServer();
