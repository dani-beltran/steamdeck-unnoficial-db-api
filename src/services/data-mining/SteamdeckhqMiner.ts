import { SectionData, WebScraper } from "@danilidonbeltran/webscrapper";
import type { GameReportBody } from "../../schemas/game-report.schema";
import {
	SCRAPE_SOURCES,
	type ScrapedContent,
} from "../../schemas/scrape.schema";
import type { Miner } from "./Miner";
import { getSteamGameDestails } from "../steam/steam";

export class SteamdeckhqMiner implements Miner {
	private scraper: WebScraper;
	
	constructor() {
		this.scraper = new WebScraper({
			sectionSelectors: ["#review", "#recommended", "#entry-time"],
			waitForSelector: "#review",
			browser: "chromium",
			headless: true,
			followRedirects: false,
			timeout: 15_000,
		});
	}
	
	async mine(gameId: number) {
		const gameDetails = await getSteamGameDestails(gameId);
		const gameName = this.formatGameName(gameDetails.name);

		const url = `https://steamdeckhq.com/game-reviews/${gameName}`;
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
		const reviewSection = result.sections.find(
			(section) => section.id === "review",
		);
		const recommendedSection = result.sections.find(
			(section) => section.id === "recommended",
		);
		const timeSection = result.sections.find(
			(section) => section.id === "entry-time",
		);
		const rawPostedAt = timeSection?.otherText[0] || null;
		const report: GameReportBody = {
			source: SCRAPE_SOURCES.STEAMDECKHQ,
			title: reviewSection?.title ?? null,
			url: result.url,
			reporter: this.findAuthorship(reviewSection),
			game_settings: this.extractGameSettings(recommendedSection),
			steamdeck_settings: this.extractSteamdeckSettings(recommendedSection),
			battery_performance: this.extractBatteryPerformance(recommendedSection),
			notes: (reviewSection?.paragraphs || []).join("\n\n"),
			posted_at: rawPostedAt ? new Date(Date.parse(`${rawPostedAt} UTC`)) : null,
		};

		return { reports: [report] };
	}

	private formatGameName(name: string): string {
		return name
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "");
	}

	private extractGameSettings(recommendedSection?: {
		paragraphs: string[];
	}): Record<string, string> | undefined {
		if (!recommendedSection || !Array.isArray(recommendedSection.paragraphs)) {
			return;
		}

		const [_protonVersion, ...otherSettings] = recommendedSection.paragraphs;
		const settings: Record<string, string> = {};

		otherSettings.forEach((p) => {
			const [key, value] = p.split(":");
			if (key && value) {
				settings[key.trim()] = value.trim();
			}
		});

		return settings;
	}

	private extractBatteryPerformance(recommendedSection?: {
		otherText: string[];
	}) {
		if (!recommendedSection || !Array.isArray(recommendedSection.otherText)) {
			return;
		}

		const batteryConsumption = recommendedSection.otherText.find((text) =>
			text.match(/\d+W\s-\s\d+W/i),
		);
		const temps = recommendedSection.otherText.find((text) =>
			text.match(/\d+c\s-\s\d+c/i),
		);
		const lifeSpan = recommendedSection.otherText.find((text) =>
			text.match(/\d+\sHours/i),
		);
		return {
			consumption: batteryConsumption ? batteryConsumption.trim() : undefined,
			temps: temps ? temps.trim() : undefined,
			life_span: lifeSpan ? lifeSpan.trim() : undefined,
		};
	}

	private extractSteamdeckSettings(recommendedSection?: {
		paragraphs: string[];
		otherText: string[];
	}): Record<string, string> | undefined {
		if (!recommendedSection || !Array.isArray(recommendedSection.otherText)) {
			return;
		}

		const items = recommendedSection.otherText;

		return {
			frame_rate_cap: items[0]?.trim(),
			screen_refresh_rate: items[3]?.trim(),
			tdp_limit: items[8]?.trim(),
			scaling_filter: items[10]?.trim(),
			gpu_clock_speed: items[12]?.trim(),
			proton_version: recommendedSection.paragraphs[0]?.trim(),
		};
	}

	private findAuthorship(section?: SectionData): { username: string; user_profile_url: string } {
		const authorIndex = section?.links?.findIndex((link) =>
			link.href.includes("/author/"),
		);
		const link =
			typeof authorIndex === "number" && authorIndex >= 0 && section?.links
				? section.links[authorIndex]
				: null;
		return {
			username: link?.text || "Steam Deck HQ",
			user_profile_url: link?.href || "https://steamdeckhq.com/",
		};
	}
}
