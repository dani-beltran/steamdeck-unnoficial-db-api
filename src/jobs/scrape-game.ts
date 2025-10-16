import { getOneGameFromQueue } from "../models/game-queue.model";
import { connectDB } from "../config/database";
import dotenv from "dotenv";
import { ProtondbScraper } from "../services/scraping/ProtondbScraper";
import { getScrapeData, saveScrapeData } from "../models/scrape.model";
import { SCRAPE_SOURCES } from "../schemas/scrape.schema";

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

    const results = [];

    const protondbScrapeData = await getScrapeData(
      gameInQueue.game_id,
      SCRAPE_SOURCES.PROTONDB
    );

    if (gameInQueue.rescrape || !protondbScrapeData) {
        console.log(`Scraping game ${gameInQueue.game_id} in ProtonDB`);
        results.push(await scrapeProtondb(gameInQueue.game_id));
    } else {
        console.log(`Skipping ProtonDB scrape for game ${gameInQueue.game_id}, already have data`);
        results.push(protondbScrapeData.scraped_content);
    }

    console.log('Formated and clean scrape results', ProtondbScraper.extractData(results[0]) );

    process.exit(0);
  } catch (error) {
    console.error("Error scraping game:", error);
    process.exit(1);
  }
}

async function scrapeProtondb(gameId: number) {
  const scraper = new ProtondbScraper();
  const result = await scraper.scrape(gameId);
  await saveScrapeData({
    game_id: gameId,
    source: SCRAPE_SOURCES.PROTONDB,
    scraped_content: result,
  });
  scraper.close();
  return result;
}

// Run the scrape
run();
