import dotenv from "dotenv";
import { connectDB } from "../config/database";
import { getOneGameFromQueue, removeGameFromQueue } from "../models/game-queue.model";
import { saveScrapeData } from "../models/scrape.model";
import { SCRAPE_SOURCES } from "../schemas/scrape.schema";
import { ProtondbScraper } from "../services/scraping/ProtondbScraper";
import type { Scraper } from "../services/scraping/Scraper";
import { SteamdeckhqScraper } from "../services/scraping/SteamdeckhqScraper";

dotenv.config();

async function run() {
	try {
		// Connect to database
		await connectDB();

		// Get one game from the queue
		const gameInQueue = await getOneGameFromQueue();

		if (!gameInQueue) {
			console.log("No games in queue");
			process.exit(0);
		}

		if (gameInQueue.rescrape) {
			console.log(`Scraping game ${gameInQueue.game_id} in ProtonDB...`);
			await runScrapeProcess(
				new ProtondbScraper(),
				SCRAPE_SOURCES.PROTONDB,
				gameInQueue.game_id,
			);

			console.log(`Scraping game ${gameInQueue.game_id} in SteamDeckHQ...`);
			await runScrapeProcess(
				new SteamdeckhqScraper(),
				SCRAPE_SOURCES.STEAMDECKHQ,
				gameInQueue.game_id,
			).catch((error) => {
				console.error(
					`Error scraping SteamDeckHQ for game ${gameInQueue.game_id}:`,
					error,
				);
			});

			console.log(`Finished scraping game ${gameInQueue.game_id}`);
		} else {
			console.log(
				`Skipping scrape for game ${gameInQueue.game_id}. Rescrape not requested.`,
			);
		}

		await removeGameFromQueue(gameInQueue.game_id);
		// Exit the process
		process.exit(0);
	} catch (error) {
		console.error("Error scraping game:", error);
		process.exit(1);
	}
}

async function runScrapeProcess(
	scraper: Scraper,
	source: SCRAPE_SOURCES,
	gameId: number,
) {
	const result = await scraper.scrape(gameId);
	await saveScrapeData({
		game_id: gameId,
		source,
		scraped_content: result,
	});
	scraper.close();
	return result;
}

// Run the scrape
run();
