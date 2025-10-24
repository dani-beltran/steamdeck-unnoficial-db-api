import { WebScraper } from "@danilidonbeltran/webscrapper";
import { getSteamGameDestails } from "../steam/steam";
import type { Scraper } from "./Scraper";

export class SteamdeckhqScraper implements Scraper {
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

	async scrape(gameId: number) {
		const gameDetails = await getSteamGameDestails(gameId);
		const gameName = this.formatGameName(gameDetails.name);

		const url = `https://steamdeckhq.com/game-reviews/${gameName}`;
		const result = await this.scraper.scrapeTextStructured(url);
		return result;
	}

	close() {
		this.scraper.close();
	}

	private formatGameName(name: string): string {
		return name
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "");
	}
}
