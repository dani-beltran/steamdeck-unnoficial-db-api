import { WebScraper } from "@danilidonbeltran/webscrapper";
import type { Scraper } from "./Scraper";

export class ProtondbScraper implements Scraper {
	private scraper: WebScraper;

	constructor() {
		this.scraper = new WebScraper({ sectionSelectors: [".for-anchor-tags"] });
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
