import { SectionData, WebScraper } from "@danilidonbeltran/webscrapper";
import { STEAMDECK_HARDWARE } from "../../schemas/game.schema";
import type { GameReportBody } from "../../schemas/game-report.schema";
import {
	SCRAPE_SOURCES,
	type ScrapedContent,
} from "../../schemas/scrape.schema";
import type { Miner } from "./Miner";

export class SharedeckMiner implements Miner {
	private scraper: WebScraper;
	
	constructor() {
		this.scraper = new WebScraper({
			sectionSelectors: ["#reports article"],
			waitForSelector: "#reports",
			browser: "chromium",
			headless: true,
			timeout: 15_000,
		});
	}
	
	async mine(gameId: number) {
		const url = `https://sharedeck.games/apps/${gameId}`;
		const result = await this.scraper.scrapeTextStructured(url);
		return result;
	}
	
	close() {
		this.scraper.close();
	}

	polish(result: ScrapedContent) {
		if (!result.sections) {
			return { reports: [] };
		}
		const filteredSections = result.sections.filter(
			(section) => section.otherText && section.otherText.length > 0,
		);
		const reports: GameReportBody[] = filteredSections.map((section) => {
			return this.buildGameReport(section, result.url);
		});
		return { reports };
	}

	private buildGameReport(section: SectionData, url: string): GameReportBody {
		const items = section.otherText;
		return {
			title: null,
			source: SCRAPE_SOURCES.SHAREDECK,
			url: `${url}#${section.id}`,
			reporter: {
				username: this.findValue(items, /to be able to vote/i) || "Anonymous",
				user_profile_url: section.links[0]?.href || "",
				user_profile_avatar_url: section.images[0]?.src,
			},
			battery_performance: {
				life_span: items[0].replace(/[\n]/g, "").trim(),
				consumption: items[1],
			},
			steamdeck_hardware: this.parseSteamdeckHardware(items[4]),
			steamdeck_settings: {
				screen_refresh_rate: this.findValue(items, /screen refresh rate/i),
				tdp_limit: this.findValue(items, /tdp limit/i),
				proton_version: this.findValue(items, /proton version/i),
				steamos_version: this.findValue(items, /steamos version/i),
			},
			game_settings: {
				graphics_preset: this.findValue(items, /graphics preset/i),
				frame_rate_limit: this.findValue(items, /framerate limit/i),
				resolution: this.findValue(items, /resolution/i)
					.replace(/[\s\n]/g, "")
					.trim(),
			},
			steamdeck_experience: {
				average_frame_rate: items[2],
			},
			notes: this.getNotes(section),
			posted_at: null,
		};
	}

	private findValue(texts: string[], match: RegExp): string {
		for (let i = 0; i < texts.length; i++) {
			const matchResult = texts[i].match(match);
			if (matchResult) {
				return texts[i + 1] || "";
			}
		}
		return "";
	}

	private parseSteamdeckHardware(text: string): STEAMDECK_HARDWARE | undefined {
		const lowerText = text.toLowerCase();
		if (lowerText.includes("oled")) {
			return STEAMDECK_HARDWARE.OLED;
		} else if (lowerText.includes("lcd")) {
			return STEAMDECK_HARDWARE.LCD;
		}
		return undefined;
	}

	private getNotes(section: SectionData): string {
		const notesStartindex = section.otherText.indexOf("Note");
		const noteEndIndex = section.otherText.indexOf("Sign in with Steam");
		return (section.otherText || []).slice(notesStartindex + 1, noteEndIndex).join("\n\n");
	}
}
