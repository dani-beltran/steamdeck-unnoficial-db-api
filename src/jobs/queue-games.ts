import dotenv from "dotenv";
import { connectDB } from "../config/database";
import logger from "../config/logger";
import { findGames, saveGamesBulk } from "../models/game.model";
import { setMultipleGamesInQueue } from "../models/game-queue.model";

dotenv.config();

///////////////////////////////////////////////////////////////////////////////
// Run the queue games job
// Job to find games that need to be scraped or regenerated
// and add them to the game queue.
///////////////////////////////////////////////////////////////////////////////
run();

async function run() {
	const startTime = Date.now();
	try {
		logger.info("Running job queue games...");

		await connectDB();
		const gamesToRescrape = await findGames({ rescrapeRequested: true });
		const gamesToRegenerate = await findGames({ regenerateRequested: true });

		logger.info(`Found ${gamesToRescrape.length} games to rescrape.`);
		logger.info(`Found ${gamesToRegenerate.length} games to regenerate.`);

		const queueItemRegenerate = gamesToRegenerate.map((game) => ({
			game_id: game.game_id,
			regenerate: true,
		}));
		const queueItemRescrape = gamesToRescrape.map((game) => ({
			game_id: game.game_id,
			rescrape: true,
		}));

		await setMultipleGamesInQueue([
			...queueItemRegenerate,
			...queueItemRescrape,
		]);

		const gamesToUpdate = [...gamesToRegenerate, ...gamesToRescrape].map(
			(game) => ({
				id: game.game_id,
				data: {
					...game,
					rescrape_requested: false,
					regenerate_requested: false,
				},
			}),
		);

		await saveGamesBulk(gamesToUpdate);

		logger.info("Games added to the queue successfully.");
	} catch (error) {
		logger.error("Error in job queue games:", error);
	} finally {
		logger.info(
			`Job queue-games has ended. It took ${(Date.now() - startTime) / 1000} seconds.`,
		);
		process.exit(0);
	}
}
