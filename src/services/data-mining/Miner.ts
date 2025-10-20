import type { ScrapedContent } from "../../schemas/scrape.schema";

export type Post = {
	title: string | null;
	game_review?: string; // A review of the game from the user
	game_settings?: Record<string, string>; // Extracted game settings in key-value format
	steamdeck_hardware?: "oled" | "lcd";
	steamdeck_settings?: {
		average_frame_rate?: string;
		screen_refresh_rate?: string;
		proton_version?: string;
		steamos_version?: string;
		tdp_limit?: string;
	};
	battery_performance?: {
		consumption: string | undefined;
		temps: string | undefined;
		life_span: string | undefined;
	};
	// Raw text from post that can contain settings and review
	raw: string;
	posted_at: Date | null;
};

export type MinedData = {
	posts: Post[];
};

export interface Miner {
	extractData(result: ScrapedContent): MinedData;
}
