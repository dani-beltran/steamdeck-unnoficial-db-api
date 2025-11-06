import { RedirectError } from "@danilidonbeltran/webscrapper/src/scraper";
import dotenv from "dotenv";
import { connectDB } from "../config/database";
import logger from "../config/logger";
import {
	getGameToScrapeFromQueue,
	setGameInQueue,
} from "../models/game-queue.model";
import { saveScrapeData } from "../models/scrape.model";
import { SCRAPE_SOURCES } from "../schemas/scrape.schema";
import { ProtondbMiner } from "../services/data-mining/ProtondbMiner";
import { SharedeckMiner } from "../services/data-mining/SharedeckMiner";
import { SteamdeckhqMiner } from "../services/data-mining/SteamdeckhqMiner";
import type { Miner } from "../services/data-mining/Miner";

dotenv.config();

///////////////////////////////////////////////////////////////////////////////
// Run the scrape job
//
// Job to scrape game data from various sources.
// It picks one game from the queue, scrapes data if rescrape is requested,
// and saves the data.
///////////////////////////////////////////////////////////////////////////////
run();

async function run() {
	const startTime = Date.now();
	try {
		logger.info("Running job scrape-game...");

		await connectDB();

		const gameInQueue = await getGameToScrapeFromQueue();

		if (!gameInQueue) {
			logger.info("No games in queue. Exiting job.");
			return;
		}

		logger.info(`Scraping game ${gameInQueue.game_id}...`);
		await Promise.all([
			runScrapeProcess(
				new ProtondbMiner(),
				SCRAPE_SOURCES.PROTONDB,
				gameInQueue.game_id,
			),
			runScrapeProcess(
				new SteamdeckhqMiner(),
				SCRAPE_SOURCES.STEAMDECKHQ,
				gameInQueue.game_id,
			),
			runScrapeProcess(
				new SharedeckMiner(),
				SCRAPE_SOURCES.SHAREDECK,
				gameInQueue.game_id,
			),
		]);

		// Mark as scraped so is not picked again
		const utcNow = new Date(Date.now());
		await setGameInQueue({
			game_id: gameInQueue?.game_id,
			rescrape: false,
			rescraped_at: utcNow,
		});

		logger.info(`Finished scraping game ${gameInQueue.game_id}`);
	} catch (error) {
		logger.error("Error scraping game:", error);
	} finally {
		logger.info(
			`Job scrape-game has ended. It took ${(Date.now() - startTime) / 1000} seconds.`,
		);
		process.exit(0);
	}
}

async function runScrapeProcess(
	miner: Miner,
	source: SCRAPE_SOURCES,
	gameId: number,
) {
	try {
		const { timestamp: _, ...result } = await miner.mine(gameId);
		logger.info(`Scraped url ${result.url}`);
		await saveScrapeData({
			game_id: gameId,
			source,
			scraped_content: result,
		});
		return result;
	} catch (error) {
		if (error instanceof RedirectError) {
			logger.warn(
				`Redirection prevented while scraping game ${gameId} from source ${source}`,
			);
			return;
		}
		logger.error(
			`Error in scrape process for game ${gameId} from source ${source}:`,
			error,
		);
		await setGameInQueue({ game_id: gameId, rescrape_failed: true });
	} finally {
		miner.close();
	}
}
