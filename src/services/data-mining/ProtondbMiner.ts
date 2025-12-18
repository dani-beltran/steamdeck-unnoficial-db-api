import {
	type ScrapeStructuredResult,
	WebScraper,
} from "@danilidonbeltran/webscrapper";
import {
	STEAMDECK_HARDWARE,
	STEAMDECK_RATING,
} from "../../schemas/game.schema";
import type { GameReportBody } from "../../schemas/game-report.schema";
import {
	SCRAPE_SOURCES,
	type ScrapedContent,
} from "../../schemas/scrape.schema";
import { parseRelativeDate } from "../../utils/date";
import { createDateComparator } from "../../utils/sort";
import type { Miner } from "./Miner";

export class ProtondbMiner implements Miner {
	private scraper: WebScraper;

	constructor() {
		this.scraper = new WebScraper({
			sectionSelectors: [
				// Selector for user reports
				".for-anchor-tags",
			],
			waitForSelector: ".for-anchor-tags",
			browser: "chromium",
			headless: true,
			timeout: 15_000,
		});
	}

	getUrl(gameId: number): string {
		return `https://www.protondb.com/app/${gameId}?device=steamDeck`;
	}

	async scrape(gameId: number): Promise<ScrapeStructuredResult> {
		const url = this.getUrl(gameId);
		const result = await this.scraper.scrapeTextStructured(url);
		return result;
	}

	polish(result: ScrapedContent) {
		if (!result.sections) {
			return { reports: [] };
		}
		const articles = result.sections;
		const reports: GameReportBody[] = articles.map((section) => {
			const notes = (section.paragraphs || []).join("\n\n");
			return {
				title: section.title,
				source: SCRAPE_SOURCES.PROTONDB,
				reporter: {
					username: section.otherText[0],
					user_profile_url: section.links[0]?.href,
					user_profile_avatar_url: section.images[0]?.src,
				},
				url: section.links[2]?.href || result.url,
				notes,
				posted_at: this.findPostedDate(section.links || []),
				steamdeck_hardware: this.findSteamdeckHardware(notes),
				steamdeck_settings: this.findSteamdeckConfig(notes),
			};
		});
		const meaningfulReports = reports.filter((p) => p.notes.trim() !== "");
		return {
			reports: meaningfulReports.sort(
				createDateComparator("posted_at", "desc"),
			),
		};
	}

	close() {
		this.scraper.close();
	}

	static async getSteamdeckRating(
		gameId: number,
	): Promise<STEAMDECK_RATING | undefined> {
		try {
			const url = `https://www.protondb.com/api/v1/reports/summaries/${gameId}.json`;
			const response = await fetch(url);
			if (!response.ok) {
				return undefined;
			}
			const data = (await response.json()) as { tier?: string };
			// Map the tier from the API response to STEAMDECK_RATING enum
			if (data?.tier) {
				const tier = data.tier.toUpperCase();
				if (!Object.keys(STEAMDECK_RATING).includes(tier)) {
					console.warn(`Unknown Steam Deck rating tier '${tier}' for game ID ${gameId}`);
					return undefined;
				}
				const rating = STEAMDECK_RATING[tier as keyof typeof STEAMDECK_RATING];
				return rating;
			}
			return undefined;
		} catch (_error) {
			return undefined;
		}
	}

	private findPostedDate(links: { text: string }[]): Date | null {
		const dateLink = links.find((link) => link.text.includes("ago"));
		if (dateLink) {
			// Handle direct relative date format like "2 months ago"
			const date = parseRelativeDate(dateLink.text.trim());
			// Strip time component - set to midnight UTC
			if (date) {
				date.setUTCHours(0, 0, 0, 0);
			}
			return date;
		}
		return null;
	}

	private findSteamdeckHardware(notes: string) {
		const lowerNotes = notes.toLowerCase();
		if (lowerNotes.includes("lcd")) {
			return STEAMDECK_HARDWARE.LCD;
		} else if (lowerNotes.includes("oled")) {
			return STEAMDECK_HARDWARE.OLED;
		}
		return undefined;
	}

	private findSteamdeckConfig(notes: string) {
		const lowerNotes = notes.toLowerCase();
		return {
			frame_rate_cap: this.findFrameRate(lowerNotes),
			tdp_limit: this.findTdpLimit(lowerNotes),
			screen_refresh_rate: this.findRefreshRate(lowerNotes),
		};
	}

	private findFrameRate(notes: string): string | undefined {
		// Skip frame rate extraction if explicitly disabled
		const fpsOffRegex = /fps\s*(limit)?\s*(off|disabled)/i;
		if (fpsOffRegex.test(notes)) {
			return undefined;
		}
		// FPS regex: matches "X fps" or "fps (to/at/:) X"
		const frameRateRegex = /~?(\d+)\s*fps|fps\s*(?:limit\s*)?(?:to|of|at|:|\s)\s*~?(\d+)/i;
		const match = notes.match(frameRateRegex);
		return match?.[1] || match?.[2] || undefined;
	}

	private findRefreshRate(notes: string): string | undefined {
		// Skip refresh rate extraction if explicitly disabled
		const hzOffRegex = /hz\s*(off|disabled)/i;
		if (hzOffRegex.test(notes)) {
			return undefined;
		}
		// Hz regex: matches "X hz" or "hz (to/at/:) X"
		const refreshScreenRegex = /~?(\d+)\s*hz|hz\s*(?:limit\s*)?(?:to|of|at|:|\s)\s*~?(\d+)/i;
		const match = notes.match(refreshScreenRegex);
		return match?.[1] || match?.[2] || undefined;
	}

	private findTdpLimit(notes: string): string | undefined {
		// Skip TDP extraction if explicitly disabled
		const tdpOffRegex = /tdp\s*(limit)?\s*(off|disabled)/i;
		if (tdpOffRegex.test(notes)) {
			return undefined;
		}
		// TDP regex: matches "X w/watts" or "tdp/watts (to/at/:) X"
		const tdpRegex = /~?(\d+)\s*(w(?!\s+tdp))|(watts|tdp)\s*(?:limit\s*)?(?:of|to|at|:|\s)\s*~?(\d+)/i;
		const tdpMatch = notes.match(tdpRegex);
		return tdpMatch?.[1] || tdpMatch?.[4] || undefined;
	}
}
