import type { STEAMDECK_HARDWARE } from "./game.schema";
import type { SCRAPE_SOURCES } from "./scrape.schema";

export type Post = {
	title: string | null;
	source: SCRAPE_SOURCES;
	game_review?: string; // A review of the game from the user
	game_settings?: Record<string, string>; // Extracted game settings in key-value format
	steamdeck_hardware?: STEAMDECK_HARDWARE;
	steamdeck_settings?: {
		average_frame_rate?: string;
		frame_rate_cap?: string;
		screen_refresh_rate?: string;
		proton_version?: string;
		steamos_version?: string;
		tdp_limit?: string;
		scaling_filter?: string;
		gpu_clock_speed?: string;
	};
	battery_performance?: {
		consumption?: string;
		temps?: string;
		life_span?: string;
	};
	// Raw text from post that can contain settings and review
	raw: string;
	posted_at: Date | null;
};
