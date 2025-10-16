import { ScrapeStructuredResult } from "@danilidonbeltran/webscrapper";

export interface Scraper {
  scrape(gameId: number): Promise<ScrapeStructuredResult>;
  close(): void;
}
