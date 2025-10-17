import type { ScrapedContent } from "../../schemas/scrape.schema";

export type Post = {
	title: string | null;
	// A review of the game from the user
	gameReview?: string;
	// Extracted game settings in key-value format
	gameSettings?: Record<string, string>;
	batteryPerformance?: {
		consumption: string | undefined;
		temps: string | undefined;
		lifeSpan: string | undefined;
	};
	// Raw text from post that can contain settings and review
	raw: string;
	postedAt: Date | null;
};

export type MinedData = {
	posts: Post[];
};

export interface Miner {
	extractData(result: ScrapedContent): MinedData;
}
