//
// Job to generate a game entry in the database.
// It picks one game from the queue, generates the entry, and marks it as processed.
// The game data is assumed to be already scraped and available in the scrapes collection.
//
import dotenv from "dotenv";
import { set } from "zod";
import { connectDB } from "../config/database";
import logger from "../config/logger";
import {
	getOneGameFromQueue,
	removeGameFromQueue,
	setGameInQueue,
} from "../models/game-queue.model";
import { getLastScrapedData } from "../models/scrape.model";
import { SCRAPE_SOURCES } from "../schemas/scrape.schema";
import { ProtondbMiner } from "../services/data-mining/ProtondbMiner";
import { SharedeckMiner } from "../services/data-mining/SharedeckMiner";
import { SteamdeckhqMiner } from "../services/data-mining/SteamdeckhqMiner";

dotenv.config();

async function run() {
	try {
		const startTime = Date.now();
		logger.info("Running job generate-game...");

		await connectDB();

		const gameInQueue = await getOneGameFromQueue("regenerate");

		if (!gameInQueue) {
			logger.info("No games in queue. Exiting job.");
			process.exit(0);
		}

		logger.info(`Generating game entry for game ${gameInQueue.game_id}...`);

		// Fetch the latest scraped data for the game from all sources
		const [protondbData, steamdeckhqData, sharedeckData] = await Promise.all([
			getLastScrapedData(gameInQueue.game_id, SCRAPE_SOURCES.PROTONDB),
			getLastScrapedData(gameInQueue.game_id, SCRAPE_SOURCES.STEAMDECKHQ),
			getLastScrapedData(gameInQueue.game_id, SCRAPE_SOURCES.SHAREDECK),
		]);

		if (!protondbData && !steamdeckhqData && !sharedeckData) {
			logger.warn(
				`No scraped data found for game ${gameInQueue.game_id}. Cannot generate entry.`,
			);
			await setGameInQueue({
				game_id: gameInQueue?.game_id,
				rescrape: true, // Set to true to attempt scraping again
				regenerated_at: new Date(Date.now()),
				regenerate_failed: true,
			});
			process.exit(0);
		}

		// Generate the game entry using the scraped data
		await generateGameEntry(
			gameInQueue.game_id,
			protondbData,
			steamdeckhqData,
			sharedeckData,
		);

		// TODO restore
		// await removeGameFromQueue(gameInQueue.game_id);

		const endTime = Date.now();
		logger.info(
			`Finished generating game entry for game ${gameInQueue.game_id} in ${
				(endTime - startTime) / 1000
			} seconds.`,
		);
		process.exit(0);
	} catch (error) {
		logger.error("Error in job generate-game:", error);
		process.exit(1);
	}
}

async function generateGameEntry(
	game_id: number,
	protondbData: any,
	steamdeckhqData: any,
	sharedeckData: any,
) {
	const protonMiner = new ProtondbMiner();
	const protonMinerData = protonMiner.extractData(protondbData.scraped_content);

	const steamdeckhqMiner = new SteamdeckhqMiner();
	const steamdeckhqMinerData = steamdeckhqMiner.extractData(
		steamdeckhqData.scraped_content,
	);

	const sharedeckMiner = new SharedeckMiner();
	const sharedeckMinerData = sharedeckMiner.extractData(
		sharedeckData.scraped_content,
	);

	console.log(
		`Generated data for game ${game_id}:`,
		sharedeckMinerData.posts[0],
	);
}

run();
