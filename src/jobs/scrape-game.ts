import dotenv from "dotenv";
import { connectDB } from "../config/database";
import logger from "../config/logger";
import {
	getOneGameFromQueue,
	setGameInQueue,
} from "../models/game-queue.model";
import { saveScrapeData } from "../models/scrape.model";
import { SCRAPE_SOURCES } from "../schemas/scrape.schema";
import { ProtondbScraper } from "../services/scraping/ProtondbScraper";
import type { Scraper } from "../services/scraping/Scraper";
import { SharedeckScraper } from "../services/scraping/SharedeckScraper";
import { SteamdeckhqScraper } from "../services/scraping/SteamdeckhqScraper";

dotenv.config();

async function run() {
	try {
		const startTime = Date.now();
		logger.info("Running job scrape-game...");

		await connectDB();

		const gameInQueue = await getOneGameFromQueue();

		if (!gameInQueue) {
			logger.info("No games in queue. Exiting job.");
			process.exit(0);
		}

		if (gameInQueue.rescrape) {
			logger.info(`Scraping game ${gameInQueue.game_id}...`);
			
			// Mark as scraped so is not picked again if job fails or there are multiple instances
			const utcNow = new Date(Date.now());
			await setGameInQueue(
				{ game_id: gameInQueue?.game_id, rescrape: false, rescraped_at: utcNow },
			);

			await runScrapeProcess(
				new ProtondbScraper(),
				SCRAPE_SOURCES.PROTONDB,
				gameInQueue.game_id,
			);
			await runScrapeProcess(
				new SteamdeckhqScraper(),
				SCRAPE_SOURCES.STEAMDECKHQ,
				gameInQueue.game_id,
			);
			await runScrapeProcess(
				new SharedeckScraper(),
				SCRAPE_SOURCES.SHAREDECK,
				gameInQueue.game_id,
			);
			logger.info(`Finished scraping game ${gameInQueue.game_id}`);
		} else {
			logger.info(
				`Skipping scrape for game ${gameInQueue.game_id}. Rescrape not requested.`,
			);
		}

		logger.info(
			`Job scrape-game completed in ${
				(Date.now() - startTime) / 1000
			} seconds.`,
		);
		process.exit(0);
	} catch (error) {
		logger.error("Error scraping game:", error);
		process.exit(1);
	}
}

async function runScrapeProcess(
	scraper: Scraper,
	source: SCRAPE_SOURCES,
	gameId: number,
) {
	try {
		const result = await scraper.scrape(gameId);
		await saveScrapeData({
			game_id: gameId,
			source,
			scraped_content: result,
		});
		scraper.close();
		return result;
	} catch (error) {
		logger.error(
			`Error in scrape process for game ${gameId} from source ${source}:`,
			error,
		);
		await setGameInQueue(
			{ game_id: gameId, rescrape_failed: true },
		);
	}
}

// Run the scrape
run();
