import type { ScrapedContent } from "../../schemas/scrape.schema";
import type { Miner } from "./Miner";

export class SharedeckMiner implements Miner {
	extractData(result: ScrapedContent) {
		// todo
		return { posts: [] };
	}
}
