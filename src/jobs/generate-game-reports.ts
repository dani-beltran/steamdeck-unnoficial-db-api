import dotenv from "dotenv";
import { connectDB } from "../config/database";
import logger from "../config/logger";
import { getGameToGenerateFromQueue, removeGameFromQueue, setGameInQueue } from "../models/game-queue.model";
import { getLastScrapedData } from "../models/scrape.model";
import { type Scrape, SCRAPE_SOURCES } from "../schemas/scrape.schema";
import { ProtondbMiner } from "../services/data-mining/ProtondbMiner";
import { SharedeckMiner } from "../services/data-mining/SharedeckMiner";
import { SteamdeckhqMiner } from "../services/data-mining/SteamdeckhqMiner";
import type { STEAMDECK_RATING } from "../schemas/game.schema";
import type { GameReportBody } from "../schemas/game-report.schema";
import { getSteamGameDestails } from "../services/steam/steam";
import { saveGame } from "../models/game.model";
import { deleteDuplicateGameReports, saveGameReportsBulk } from "../models/game-report.model";
import { set } from "zod";

dotenv.config();

///////////////////////////////////////////////////////////////////////////////
// Run the generate game reports job
// Job to generate a game entry in the database and its associated game reports.
// It picks one game from the queue, generates the entry, and removes it from the queue.
// The game data is assumed to be already scraped and available in the scrapes collection.
///////////////////////////////////////////////////////////////////////////////
run();

async function run() {
	const startTime = Date.now();
	try {
		logger.info("Running job generate-game...");
		await connectDB();

		const gameInQueue = await getGameToGenerateFromQueue();

		if (!gameInQueue) {
			logger.info("No games in queue. Exiting job.");
			return;
		}

        const gameId = gameInQueue.game_id;
		logger.info(`Generating game entry for game ${gameId}...`);

		// Fetch the latest scraped data for the game from all sources
		const [protondbData, steamdeckhqData, sharedeckData] = await Promise.all([
			getLastScrapedData(gameId, SCRAPE_SOURCES.PROTONDB),
			getLastScrapedData(gameId, SCRAPE_SOURCES.STEAMDECKHQ),
			getLastScrapedData(gameId, SCRAPE_SOURCES.SHAREDECK),
		]);

		if (!protondbData && !steamdeckhqData && !sharedeckData) {
			logger.warn(
				`No scraped data found for game ${gameId}. Cannot generate game reports.`,
			);
            await setGameInQueue({
                game_id: gameId,
                regenerate: true,
                regenerate_failed: true,
            });
			return;
		}

        const { reports, steamdeck_rating, steamdeck_verified } = getPolishedData({
            protondbData,
            steamdeckhqData,
            sharedeckData,
        });

        const steamGame = await getSteamGameDestails(gameId);

        await saveGame(gameId, {
            steam_app: steamGame,
            steamdeck_rating: steamdeck_rating || undefined,
            steamdeck_verified: steamdeck_verified || undefined,
        });

        await saveGameReportsBulk(gameId, reports);
        await deleteDuplicateGameReports();
        await removeGameFromQueue(gameId);
    } catch (error) {
		logger.error("Error in job generate-game:", error);
	} finally {
		logger.info(
			`Job generate-game has ended. It took ${(Date.now() - startTime) / 1000} seconds.`,
		);
		process.exit(0);
	}
}

function getPolishedData(params: {
    protondbData: Scrape | null;
    steamdeckhqData: Scrape | null;
    sharedeckData: Scrape | null;
}) {
    const { protondbData, steamdeckhqData, sharedeckData } = params;
    const reports: GameReportBody[] = [];
    let steamdeck_rating: STEAMDECK_RATING | undefined;
    let steamdeck_verified: boolean | undefined;

    if (protondbData) {
        const protonMiner = new ProtondbMiner();
        const protonMinerData = protonMiner.polish(
            protondbData.scraped_content,
        );
        steamdeck_rating = protonMinerData.steamdeck_rating;
        steamdeck_verified = protonMinerData.steamdeck_verified;
        reports.push(...protonMinerData.reports);
    }

    if (steamdeckhqData) {
        const steamdeckhqMiner = new SteamdeckhqMiner();
        const steamdeckhqMinerData = steamdeckhqMiner.polish(
            steamdeckhqData.scraped_content,
        );
        reports.push(...steamdeckhqMinerData.reports);
    }

    if (sharedeckData) {
        const sharedeckMiner = new SharedeckMiner();
        const sharedeckMinerData = sharedeckMiner.polish(
            sharedeckData.scraped_content,
        );
        reports.push(...sharedeckMinerData.reports);
    }

    return {
        reports,
        steamdeck_rating,
        steamdeck_verified,
    };
}