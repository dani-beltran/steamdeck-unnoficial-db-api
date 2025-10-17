import { WebScraper } from "@danilidonbeltran/webscrapper";
import type { Scraper } from "./Scraper";

export class SharedeckScraper implements Scraper {
	private scraper: WebScraper;

	constructor() {
		this.scraper = new WebScraper({
			sectionSelectors: ["#reports article"],
		});
	}

	async scrape(gameId: number) {
		const url = `https://sharedeck.games/apps/${gameId}`;
		const result = await this.scraper.scrapeTextStructured(url);
		return result;
	}

	close() {
		this.scraper.close();
	}
}
