import type { STEAMDECK_RATING } from "../../schemas/game.schema";
import type { Post } from "../../schemas/post.schema";
import type { ScrapedContent } from "../../schemas/scrape.schema";

export type MinedData = {
	posts: Post[];
	steamdeck_rating?: STEAMDECK_RATING;
	steamdeck_verified?: boolean;
};

export interface Miner {
	extractData(result: ScrapedContent): MinedData;
}
