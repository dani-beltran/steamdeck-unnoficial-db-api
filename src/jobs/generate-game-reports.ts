import dotenv from "dotenv";
import { connectDB } from "../config/database";
import logger from "../config/logger";
import { getGameToGenerateFromQueue, removeGameFromQueue, setGameInQueue } from "../models/game-queue.model";
import { getLastScrapedData } from "../models/scrape.model";
import { type Scrape, SCRAPE_SOURCES } from "../schemas/scrape.schema";
import { ProtondbMiner } from "../services/data-mining/ProtondbMiner";
import { SharedeckMiner } from "../services/data-mining/SharedeckMiner";
import { SteamdeckhqMiner } from "../services/data-mining/SteamdeckhqMiner";
import type { GameReportBody } from "../schemas/game-report.schema";
import { getSteamdeckVerificationStatus, getSteamGameDestails } from "../services/steam/steam";
import { saveGame } from "../models/game.model";
import { replaceGameReportsForGame } from "../models/game-report.model";
import { CLAUDE_AI_MODEL, CLAUDE_API_KEY } from "../config/env";
import { ClaudeService } from "../services/claude";

dotenv.config();

///////////////////////////////////////////////////////////////////////////////
// Run the generate game reports job
// Job to generate a game entry in the database and its associated game reports.
// It pops one game from the queue and generates the entry.
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

        await removeGameFromQueue(gameId);

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

        const { reports } = getPolishedData({
            protondbData,
            steamdeckhqData,
            sharedeckData,
        });

        const [ steamGame, steamdeckVerificationStatus, steamdeckRating, summary ] = await Promise.all([
            getSteamGameDestails(gameId),
            getSteamdeckVerificationStatus(gameId),
            ProtondbMiner.getSteamdeckRating(gameId),
            generateGamePerformanceSummary(prepareSummaryInput(reports)),
        ]);

        await saveGame(gameId, {
            steam_app: steamGame,
            steamdeck_rating: steamdeckRating || undefined,
            steamdeck_verification_status: steamdeckVerificationStatus ?? undefined,
            game_performance_summary: summary || undefined,
        });

        await replaceGameReportsForGame(gameId, reports);
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

    if (protondbData) {
        const protonMiner = new ProtondbMiner();
        const protonMinerData = protonMiner.polish(
            protondbData.scraped_content,
        );
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
        reports
    };
}

function prepareSummaryInput(reports: GameReportBody[]) {
    const filteredReports = reports.filter(report => {
        return report.notes && 
        report.notes.trim().length > 0 && 
        // We remove reports from SteamdeckHQ for now, they are very long and detailed and skew the summary
        report.source !== SCRAPE_SOURCES.STEAMDECKHQ 
    }).sort((a, b) => {
        const aTime = a.posted_at ? a.posted_at.getTime() : 0;
        const bTime = b.posted_at ? b.posted_at.getTime() : 0;
        return bTime - aTime;
    });
    const notes = filteredReports.map((report, index) => {
        return `Report ${index + 1}: \n${report.notes}`;
    }).join("\n\n");
    return notes;
}

async function generateGamePerformanceSummary(raw?: string) {
	if (!raw) return "";
	const prompt = `Generate a concise summary (two to three sentences) of the following Steam Deck game's user reports, focusing on key points about performance, technical aspects and fixes or workarounds. 
Avoid personal opinions or extraneous details. Don't include the name of the game in the summary and don't provide a title for the summary.

Performance Review:
${raw}

Summary:`;
	const rawSummary = await askClaudeAI(prompt);
	// Clean up the summary
	const cleanedSummary = rawSummary
		.replace(/^Summary:\s*/i, "")
		.replace(/Summary\s/i, "")
		.replace(/\s+/g, " ")
		.replace(/^#/i, "")
		.trim();
	return cleanedSummary;
}

async function askClaudeAI(msg: string) {
    if (!msg) return "";
    const claudeService = new ClaudeService({
        apiKey: CLAUDE_API_KEY,
    });
    return claudeService.prompt(msg, {
        model: CLAUDE_AI_MODEL,
        maxTokens: 300,
        temperature: 0.3,
    });
}