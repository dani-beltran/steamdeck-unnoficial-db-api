import type { Post } from "../../schemas/post.schema";
import {
	SCRAPE_SOURCES,
	type ScrapedContent,
} from "../../schemas/scrape.schema";
import { parseRelativeDate } from "../../utils/date";
import { createDateComparator } from "../../utils/sort";
import type { Miner } from "./Miner";

export class ProtondbMiner implements Miner {
	extractData(result: ScrapedContent) {
		if (!result.sections) {
			return { posts: [] };
		}
		const posts: Post[] = result.sections.map((section) => {
			return {
				title: section.title,
				source: SCRAPE_SOURCES.PROTONDB,
				raw: (section.paragraphs || []).join("\n\n"),
				game_review: "",
				posted_at: this.findPostedDate(section.links || []),
			};
		});
		const meaningfulPosts = posts
			.filter((p) => p.raw.trim() !== "")
			.sort(createDateComparator("posted_at", "desc"));
		return {
			posts: meaningfulPosts,
			steamdeck_rating: this.extractSteamdeckRating(result),
			steamdeck_verified: this.extractSteamdeckVerified(result),
		};
	}

	private findPostedDate(links: { text: string }[]): Date | null {
		const dateLink = links.find((link) => link.text.includes("ago"));
		if (dateLink) {
			// Handle direct relative date format like "2 months ago"
			return parseRelativeDate(dateLink.text.trim());
		}
		return null;
	}

	private extractSteamdeckRating(result: ScrapedContent) {
		// TODO: Implement extraction logic
		return undefined;
	}

	private extractSteamdeckVerified(result: ScrapedContent) {
		// TODO: Implement extraction logic
		return undefined;
	}
}
