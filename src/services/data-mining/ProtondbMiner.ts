import { type ScrapeStructuredResult, type SectionData, WebScraper } from "@danilidonbeltran/webscrapper";
import { STEAMDECK_HARDWARE, STEAMDECK_RATING } from "../../schemas/game.schema";
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
				// Selector for rating
				".GameInfo__SummaryContainer-sc-19o71ac-1",
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

	async mine(gameId: number): Promise<ScrapeStructuredResult> {
		const url = this.getUrl(gameId);
		const result = await this.scraper.scrapeTextStructured(url);
		return result;
	}

	polish(result: ScrapedContent) {
		if (!result.sections) {
			return { reports: [] };
		}
		const [firstSection, ...articles] = result.sections;
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
		const meaningfulReports = reports
			.filter((p) => p.notes.trim() !== "")
			.sort(createDateComparator("posted_at", "desc"));
		return {
			reports: meaningfulReports,
			steamdeck_rating: this.extractSteamdeckRating(firstSection),
		};
	}

	close() {
		this.scraper.close();
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

	private extractSteamdeckRating(section: SectionData) {
		switch (section.otherText[0].toLowerCase()) {
			case "platinum":
				return STEAMDECK_RATING.PLATINUM;
			case "gold":
				return STEAMDECK_RATING.GOLD;
			case "native":
				return STEAMDECK_RATING.NATIVE;
			case "unsupported":
				return STEAMDECK_RATING.UNSUPPORTED;
			case "borked":
				return STEAMDECK_RATING.BORKED;
			default:
				return undefined;
		}
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
		const tdpRegex = /~?(\d+)\s*(w|watts)|(watts|tdp).*?~?(\d+)/i;
		const frameRateRegex = /~?(\d+)\s*fps|fps.*?~?(\d+)/i;
		const refreshScreenRegex = /~?(\d+)\s*hz|hz.*?~?(\d+)/i;
		const frameRateMatch = lowerNotes.match(frameRateRegex);
		const frameRate = frameRateMatch?.[1] || frameRateMatch?.[2];
		const tdpMatch = lowerNotes.match(tdpRegex);
		const tdp = tdpMatch?.[1] || tdpMatch?.[4];
		const refreshRateMatch = lowerNotes.match(refreshScreenRegex);
		const refreshRate = refreshRateMatch?.[1] || refreshRateMatch?.[2];
		return {
			frame_rate_cap: frameRate || undefined,
			tdp_limit: tdp || undefined,
			screen_refresh_rate: refreshRate || undefined,
		}
	}
}
