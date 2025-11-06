import type { ScrapeStructuredResult } from "@danilidonbeltran/webscrapper";
import type { STEAMDECK_RATING } from "../../schemas/game.schema";
import type { GameReportBody } from "../../schemas/game-report.schema";
import type { ScrapedContent } from "../../schemas/scrape.schema";

export type MinedData = {
	reports: GameReportBody[];
	steamdeck_rating?: STEAMDECK_RATING;
	steamdeck_verified?: boolean;
};

export interface Miner {
	/** Scrape data for a given game ID */
	mine(gameId: number): Promise<ScrapeStructuredResult>;
	/** Convert scraped data into structured format */
	polish(result: ScrapedContent): MinedData;
	/** Close any resources used by the miner */
	close(): void;
}
