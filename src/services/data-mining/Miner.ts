import type { ScrapeStructuredResult } from "@danilidonbeltran/webscrapper";
import type { GameReportBody } from "../../schemas/game-report.schema";
import type { ScrapedContent } from "../../schemas/scrape.schema";

export type MinedData = {
	reports: GameReportBody[];
};

export interface Miner {
	/** Get the URL to scrape for a given game ID */
	getUrl(gameId: number): Promise<string> | string;
	/** Scrape data for a given game ID */
	mine(gameId: number): Promise<ScrapeStructuredResult>;
	/** Convert scraped data into structured format */
	polish(result: ScrapedContent): MinedData;
	/** Close any resources used by the miner */
	close(): void;
}
