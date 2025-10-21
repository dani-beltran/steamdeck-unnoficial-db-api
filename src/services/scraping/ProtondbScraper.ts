import { WebScraper } from "@danilidonbeltran/webscrapper";
import type { Scraper } from "./Scraper";

export class ProtondbScraper implements Scraper {
	private scraper: WebScraper;

	constructor() {
		this.scraper = new WebScraper({ 
			sectionSelectors: [".GameInfo__SummaryContainer-sc-19o71ac-1", ".DeckVerifiedInfo__AlignedRowWidthUnset-sc-acfn33-0", ".for-anchor-tags"], 
			waitForSelector: ".for-anchor-tags",
			browser: "chromium",
			headless: true,
			timeout: 10_000
		});
	}

	async scrape(gameId: number) {
		const url = `https://www.protondb.com/app/${gameId}?device=steamDeck`;
		const result = await this.scraper.scrapeTextStructured(url);

		return result;
	}

	close() {
		this.scraper.close();
	}
}
